/**
 * Registre de fournisseurs — construction depuis la configuration,
 * disponibilité (clé présente), désactivation sur erreur d'authentification.
 *
 * Les noms de fournisseurs et de modèles servent uniquement à la
 * journalisation technique interne et aux métriques ; ils ne sont jamais
 * renvoyés vers l'interface utilisateur.
 */
import { modeMock, ordreFournisseurs, type IdFournisseur } from './config.js';
import { FournisseurGemini } from './providers/gemini.js';
import { FournisseurGroq } from './providers/groq.js';
import { FournisseurOpenRouter } from './providers/openrouter.js';
import { FournisseurMock } from './providers/mock.js';
import { ordonnerCandidats } from './router.js';
import type { CapacitesAi, FournisseurAi } from './types.js';

let instances: FournisseurAi[] | null = null;
const desactives = new Set<string>();
const quotaJusqu = new Map<string, number>();
let journalFait = false;

/**
 * Durée d'écartement d'un fournisseur en dépassement de quota connu
 * (le routeur ne lui envoie plus de requêtes pendant cette fenêtre).
 */
export const DELAI_QUOTA_MS = 5 * 60 * 1000;

/** État de quota observé (429/402) : le fournisseur est écarté un temps. */
export function signalerQuota(id: string): void {
  quotaJusqu.set(id, Date.now() + DELAI_QUOTA_MS);
  console.warn(
    `[ia] fournisseur '${id}' en dépassement de quota — écarté pendant ${Math.round(DELAI_QUOTA_MS / 1000)} s`,
  );
}

function enQuota(id: string): boolean {
  return (quotaJusqu.get(id) ?? 0) > Date.now();
}

function construire(): FournisseurAi[] {
  const parId: Record<IdFournisseur, () => FournisseurAi> = {
    gemini: () => new FournisseurGemini(),
    groq: () => new FournisseurGroq(),
    openrouter: () => new FournisseurOpenRouter(),
    mock: () => new FournisseurMock(),
  };
  if (modeMock()) {
    // Tests uniquement — jamais sélectionnable par défaut en production.
    return [parId.mock()];
  }
  return ordreFournisseurs().map((id) => parId[id]());
}

export function registreFournisseurs(): FournisseurAi[] {
  if (!instances) {
    instances = construire();
    journaliserConfiguration(instances);
  }
  return instances;
}

/** Réinitialisation (tests uniquement). */
export function reinitialiserRegistre(): void {
  instances = null;
  desactives.clear();
  quotaJusqu.clear();
  journalFait = false;
}

/**
 * Logs techniques : quels fournisseurs manquent de configuration.
 * (noms visibles uniquement dans les logs serveur, jamais dans l'API)
 */
function journaliserConfiguration(liste: FournisseurAi[]): void {
  if (journalFait) return;
  journalFait = true;
  for (const f of liste) {
    void f.checkAvailability().then((d) => {
      if (!d.ok) console.warn(`[ia] fournisseur '${f.id}' non configuré : ${d.raison ?? 'clé absente'}`);
    });
  }
}

/** Désactivation durable (erreur d'authentification) jusqu'à réinit. */
export function desactiverFournisseur(id: string): void {
  desactives.add(id);
  console.warn(`[ia] fournisseur '${id}' désactivé (authentification refusée) — bascule sur le suivant`);
}

/**
 * Candidats pour une liste de capacités : configurés (clé présente),
 * non désactivés, capables — dans l'ordre déterministe de la configuration.
 */
export async function candidatsPour(
  requises: (keyof CapacitesAi)[],
): Promise<FournisseurAi[]> {
  const capables = ordonnerCandidats(registreFournisseurs(), requises).filter(
    (f) => !desactives.has(f.id) && !enQuota(f.id),
  );
  const disponibles: FournisseurAi[] = [];
  for (const f of capables) {
    const d = await f.checkAvailability();
    if (d.ok) disponibles.push(f);
  }
  return disponibles;
}

/** État technique interne (journalisation, diagnostics). */
export async function etatTechnique(): Promise<
  Array<{ id: string; modele: string; configure: boolean; desactive: boolean }>
> {
  const out = [];
  for (const f of registreFournisseurs()) {
    const d = await f.checkAvailability();
    out.push({ id: f.id, modele: f.modele, configure: d.ok, desactive: desactives.has(f.id) });
  }
  return out;
}
