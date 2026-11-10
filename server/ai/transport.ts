/**
 * Transport HTTP commun aux adaptateurs (aucun SDK tiers) :
 * requêtes JSON avec délai d'attente, lecture de flux SSE, normalisation
 * des statuts d'erreur. Les clés transitent uniquement dans les en-têtes,
 * jamais journalisées.
 */
import { CODES_AI, ErreurAi, classerStatut } from './errors.js';

/** Timeout applicatif (AbortError/TimeoutError) — rattrapé en ErreurAi. */
export async function appelJson(
  url: string,
  opts: {
    method?: string;
    headers: Record<string, string>;
    corps: unknown;
    signal?: AbortSignal;
    timeoutMs: number;
  },
): Promise<Response> {
  const timeout = AbortSignal.timeout(opts.timeoutMs);
  const signal = opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout;
  let r: Response;
  try {
    r = await fetch(url, {
      method: opts.method ?? 'POST',
      headers: opts.headers,
      body: JSON.stringify(opts.corps),
      signal,
    });
  } catch (e) {
    if (opts.signal?.aborted) {
      throw new ErreurAi('Génération interrompue.', CODES_AI.annule, 499, 'contenu');
    }
    if (e instanceof Error && (e.name === 'AbortError' || e.name === 'TimeoutError')) {
      throw new ErreurAi(
        `Le fournisseur n'a pas répondu dans le délai imparti (${opts.timeoutMs} ms).`,
        CODES_AI.timeout,
        504,
        'timeout',
      );
    }
    throw new ErreurAi(
      'Le fournisseur est injoignable (erreur réseau).',
      CODES_AI.reseau,
      502,
      'reseau',
    );
  }
  if (!r.ok) {
    throw erreurDepuisStatut(r.status);
  }
  return r;
}

/** Erreur fournisseur → taxonomie AURA (sans détailler la clé ou l'interne). */
export function erreurDepuisStatut(statut: number): ErreurAi {
  const nature = classerStatut(statut);
  if (nature === 'auth') {
    return new ErreurAi(
      'Le moteur IA a refusé l’authentification serveur (clé à vérifier).',
      CODES_AI.auth,
      502,
      'auth',
    );
  }
  if (nature === 'quota') {
    return new ErreurAi(
      'Le moteur IA est sollicité au-delà de ses limites pour le moment.',
      CODES_AI.limite,
      429,
      'quota',
    );
  }
  if (nature === 'timeout') {
    return new ErreurAi('Le moteur IA a mis trop de temps à répondre.', CODES_AI.timeout, 504, 'timeout');
  }
  if (nature === 'validation') {
    return new ErreurAi('Requête refusée par le moteur IA.', CODES_AI.invalide, 400, 'validation');
  }
  // 404 : le fournisseur a répondu — c'est le MODÈLE qui n'existe pas (ou
  // n'est pas ouvert à cette clé). Dire « ne répond pas » envoyait chercher
  // une panne réseau qui n'existe pas.
  if (statut === 404) {
    return new ErreurAi(
      'Le modèle configuré n’existe pas ou n’est pas accessible avec cette clé.',
      CODES_AI.modeleIntrouvable,
      502,
      'serveur',
    );
  }
  // 5xx : le fournisseur a répondu, mais en erreur. La formulation le dit,
  // sans exposer ni la clé ni le corps de la réponse.
  if (statut >= 500) {
    return new ErreurAi(
      `Le moteur IA a renvoyé une erreur (HTTP ${statut}).`,
      CODES_AI.erreurFournisseur,
      502,
      'serveur',
    );
  }
  return new ErreurAi('Le moteur IA ne répond pas.', CODES_AI.indisponible, 502, 'serveur');
}

/**
 * Lecture d'un flux SSE : trames `data: ...`, terminateur `[DONE]`,
 * commentaires (`: ...`) ignorés. `onTrame` reçoit chaque objet JSON.
 */
export async function lireSSE(r: Response, onTrame: (json: unknown) => void): Promise<void> {
  if (!r.body) {
    throw new ErreurAi('Flux de réponse absent.', CODES_AI.indisponible, 502, 'serveur');
  }
  const lecteur = r.body.getReader();
  const decode = new TextDecoder();
  let tampon = '';
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    tampon += decode.decode(value, { stream: true });
    const lignes = tampon.split('\n');
    tampon = lignes.pop() ?? '';
    for (const ligne of lignes) {
      const propre = ligne.trim();
      if (!propre || propre.startsWith(':')) continue;
      const donnee = propre.startsWith('data:') ? propre.slice(5).trim() : '';
      if (!donnee || donnee === '[DONE]') continue;
      try {
        onTrame(JSON.parse(donnee));
      } catch {
        /* trame partielle ou bruit : ignorée */
      }
    }
  }
}
