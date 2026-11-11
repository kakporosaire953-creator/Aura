/**
 * Vecteurs d'embeddings — quantification simple (int8 → base64).
 *
 * Pourquoi quantifier : un vecteur de 768 flottants en JSON pèse ~6 Ko. Sur
 * un stockage clé/valeur facturé à l'octet, 500 segments deviendraient
 * inutilisables. En int8, un vecteur tient en 768 octets (~1 Ko en base64),
 * pour une perte de précision négligeable sur une recherche par similarité.
 *
 * Le module est prêt mais **inactif** tant qu'aucun fournisseur d'embeddings
 * n'est configuré : voir `plongement.ts`.
 */

export type VecteurQuantifie = { base64: string; echelle: number; dimension: number };

export function quantifier(vecteur: number[]): VecteurQuantifie {
  const max = Math.max(...vecteur.map((v) => Math.abs(v)), 1e-9);
  const echelle = max / 127;
  const octets = Buffer.alloc(vecteur.length);
  for (let i = 0; i < vecteur.length; i++) {
    const v = Math.round(vecteur[i] / echelle);
    octets[i] = Math.max(-127, Math.min(127, v)) & 0xff;
  }
  return { base64: octets.toString('base64'), echelle, dimension: vecteur.length };
}

export function dequantifier(vecteur: VecteurQuantifie): number[] {
  const octets = Buffer.from(vecteur.base64, 'base64');
  const sortie = new Array<number>(octets.length);
  for (let i = 0; i < octets.length; i++) {
    const brut = octets[i] > 127 ? octets[i] - 256 : octets[i];
    sortie[i] = brut * vecteur.echelle;
  }
  return sortie;
}

/** Similarité cosinus, entre -1 et 1. */
export function cosinus(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let produit = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    produit += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return produit / (Math.sqrt(na) * Math.sqrt(nb));
}
