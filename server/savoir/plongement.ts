/**
 * Point d'extension des embeddings — **volontairement inactif aujourd'hui**.
 *
 * Constat d'audit : les quatre fournisseurs configurés (Gemini, Groq,
 * OpenRouter, mock) annoncent tous `embeddings: false`. Aucun ne sait
 * transformer un texte en vecteur, et AURA ne paiera pas un service
 * supplémentaire sans décision explicite. La recherche sémantique n'est
 * donc **pas** simulée : elle reste éteinte, et la recherche lexicale
 * (BM25 + filtres) assure le service.
 *
 * Le jour où un fournisseur d'embeddings est branché (Gemini
 * `text-embedding-004`, par exemple), il suffira d'appeler
 * `enregistrerEncodeur()` au démarrage pour que l'indexation et la
 * recherche passent en mode hybride, sans toucher au reste du module.
 */

export type Encodeur = {
  id: string;
  dimension: number;
  /** Renvoie un vecteur par texte, dans le même ordre. */
  encoder: (textes: string[]) => Promise<number[][]>;
};

let encodeur: Encodeur | null = null;

export function enregistrerEncodeur(valeur: Encodeur | null): void {
  encodeur = valeur;
  console.log(
    valeur
      ? `[savoir] recherche sémantique activée (${valeur.id}, ${valeur.dimension} dimensions)`
      : '[savoir] recherche sémantique inactive — recherche lexicale seule',
  );
}

export function encodeurDisponible(): Encodeur | null {
  return encodeur;
}

/** Encode un lot de textes, ou renvoie null si aucun encodeur n'est branché. */
export async function plonger(textes: string[], force?: Encodeur | null): Promise<number[][] | null> {
  const actif = force ?? encodeur;
  if (!actif || textes.length === 0) return null;
  const vecteurs = await actif.encoder(textes);
  if (vecteurs.length !== textes.length) {
    throw new Error('Encodeur incohérent : un vecteur attendu par texte.');
  }
  return vecteurs;
}

export const SANS_EMBEDDINGS =
  'Recherche lexicale : aucun fournisseur d’embeddings n’est configuré (capacité absente chez les fournisseurs actuels).';
