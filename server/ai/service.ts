/**
 * Service IA central — l'unique point d'entrée des routes AURA.
 *
 * Chaque appel déclare un TYPE DE TÂCHE (routage déterministe) ; le
 * service sélectionne les fournisseurs capables, orchestre le repli
 * (règles de fallback.ts, dont « jamais de bascule silencieuse après un
 * premier fragment streamé »), normalise les erreurs et laisse la couche
 * usage tracer la consommation.
 *
 * Aucun nom de fournisseur ni de modèle ne sort de cette couche vers
 * l'interface : les `ReponseAi` portent ces métadonnées pour les logs et
 * l'usage interne uniquement.
 */
import { maxReplis } from './config';
import { ErreurAi, erreurAucunFournisseur, natureDe } from './errors';
import { executerAvecRepli } from './fallback';
import { candidatsPour, desactiverFournisseur } from './registre';
import { capacitesPour } from './router';
import type {
  ReponseAi,
  RequeteAi,
  RequeteStructuree,
  ResultatGrounding,
  TacheAi,
} from './types';

export type Journalisation = {
  /** Enregistre la consommation (couche usage) — optionnel. */
  noter?: (trace: {
    fournisseur: string;
    modele: string;
    mode: 'generation' | 'stream' | 'structure' | 'recherche' | 'repli';
    caracteres?: number;
    erreur?: string;
  }) => void;
};

function maxTentatives(): number {
  return Math.max(1, 1 + maxReplis());
}

function rejets(journal?: Journalisation) {
  return {
    maxTentatives: maxTentatives(),
    onEchec: (f: { id: string; modele: string }, e: unknown, tentative: number) => {
      const code = e instanceof ErreurAi ? e.code : 'inconnu';
      console.warn(`[ia] tentative ${tentative} échouée (${f.id}, ${code}) — bascule éventuelle`);
      journal?.noter?.({ fournisseur: f.id, modele: f.modele, mode: 'repli', erreur: code });
    },
    onDesactiver: (f: { id: string }) => desactiverFournisseur(f.id),
  };
}

/** Génération de texte (synchrone). */
export async function generer(
  tache: TacheAi,
  req: RequeteAi,
  journal?: Journalisation,
): Promise<ReponseAi> {
  const liste = await candidatsPour(capacitesPour(tache));
  const rep = await executerAvecRepli(liste, (f) => f.generateResponse(req), rejets(journal));
  journal?.noter?.({
    fournisseur: rep.fournisseur,
    modele: rep.modele,
    mode: 'generation',
    caracteres: rep.texte.length,
  });
  return rep;
}

/**
 * Génération en streaming. Si un premier fragment a déjà été émis vers le
 * client, aucune bascule silencieuse : l'erreur est remontée telle quelle.
 */
export async function genererEnStream(
  tache: TacheAi,
  req: RequeteAi,
  onChunk: (texte: string) => void,
  signal?: AbortSignal,
  journal?: Journalisation,
): Promise<ReponseAi> {
  const liste = await candidatsPour(capacitesPour(tache, { streaming: true }));
  let emis = false;
  const rep = await executerAvecRepli(
    liste,
    (f) =>
      f.streamResponse(
        req,
        (t) => {
          emis = true;
          onChunk(t);
        },
        signal,
      ),
    { ...rejets(journal), peutBasculer: () => !emis },
  );
  journal?.noter?.({
    fournisseur: rep.fournisseur,
    modele: rep.modele,
    mode: 'stream',
    caracteres: rep.texte.length,
  });
  return rep;
}

/** Sortie structurée (JSON Schema) — missions, aides contextuelles… */
export async function genererStructure<T>(
  tache: TacheAi,
  req: RequeteStructuree,
  journal?: Journalisation,
): Promise<T> {
  const liste = await candidatsPour(capacitesPour(tache, { structuree: true }));
  let utilise: { id: string; modele: string } | null = null;
  const out = await executerAvecRepli(
    liste,
    (f) => {
      utilise = f;
      return f.generateStructuredOutput<T>(req);
    },
    rejets(journal),
  );
  if (utilise) {
    journal?.noter?.({
      fournisseur: (utilise as { id: string }).id,
      modele: (utilise as { modele: string }).modele,
      mode: 'structure',
    });
  }
  return out;
}

/**
 * Recherche sourcée réelle : seuls les fournisseurs dotés de la capacité
 * `sources` sont sollicités ; les URLs proviennent du moteur, jamais du
 * modèle lui-même.
 */
export async function rechercherAvecSources(
  question: string,
  system: string,
  journal?: Journalisation,
): Promise<ResultatGrounding> {
  const liste = await candidatsPour(capacitesPour('recherche'));
  const dispo = liste.filter((f) => typeof f.rechercherAvecSources === 'function');
  let utilise: { id: string; modele: string } | null = null;
  const rep = await executerAvecRepli(
    dispo,
    (f) => {
      utilise = f;
      return f.rechercherAvecSources!(question, system);
    },
    rejets(journal),
  );
  if (utilise) {
    journal?.noter?.({
      fournisseur: (utilise as { id: string }).id,
      modele: (utilise as { modele: string }).modele,
      mode: 'recherche',
    });
  }
  return rep;
}

/**
 * État agrégé, SANS nom de fournisseur ni de modèle (exposé par l'API) :
 * quelles opérations sont réellement disponibles sur cet environnement.
 */
export type EtatIa = {
  ok: boolean;
  streaming: boolean;
  sortieStructuree: boolean;
  sources: boolean;
  code: boolean;
  image: boolean;
  raison?: string;
};

export async function etatIa(): Promise<EtatIa> {
  const conversation = await candidatsPour(capacitesPour('conversation'));
  const structure = await candidatsPour(capacitesPour('structure', { structuree: true }));
  const recherche = await candidatsPour(capacitesPour('recherche'));
  const code = await candidatsPour(capacitesPour('code'));
  const image = await candidatsPour(capacitesPour('image'));
  const principal = conversation[0];
  const ok = conversation.length > 0;
  return {
    ok,
    streaming: ok && principal.getCapabilities().streaming,
    sortieStructuree: structure.length > 0,
    sources: recherche.length > 0,
    code: code.length > 0,
    image: image.length > 0,
    ...(ok
      ? {}
      : {
          raison:
            'Aucun moteur IA n’est encore configuré sur cet environnement : des clés serveur doivent être ajoutées par l’administrateur.',
        }),
  };
}

/** Erreur standardisée quand l'IA est appelée sans aucun moteur disponible. */
export function erreurIaIndisponible(): ErreurAi {
  return erreurAucunFournisseur(
    'Aucun moteur IA n’est encore configuré sur cet environnement (clés serveur à ajouter).',
  );
}

export { natureDe };
