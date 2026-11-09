/**
 * Traduction des codes d'erreur d'authentification en messages lisibles.
 *
 * Isolé de la page pour deux raisons :
 * - c'est testable sans monter React ni GSAP ;
 * - la distinction entre « réseau coupé » (aucune réponse) et « serveur en
 *   erreur » (réponse HTTP sans JSON) était invisible : les deux affichaient
 *   « Le service ne répond pas ». Elle est désormais explicite, code HTTP en
 *   clair, ce qui évite de chercher la panne au mauvais endroit.
 */

export type TraductionsAuth = {
  errIdentifiants: string;
  errExiste: string;
  errSaisie: string;
  errStockage: string;
  errLimite: string;
  errServeur: string;
};

export type TraductionsGoogle = {
  googleAnnule: string;
  googleExpire: string;
  googleEchec: string;
  googleIndisponible: string;
  googleConflit: string;
  googleStockage: string;
};

/**
 * Codes renvoyés par `/api/auth/google/retour` (en query string) : le serveur
 * redirige, c'est donc l'interface qui traduit. Chaque code porte une cause
 * distincte — inutile de renvoyer l'utilisateur vers une piste fausse.
 */
export function messageGoogle(code: string | undefined, t: TraductionsGoogle): string | null {
  switch (code) {
    case 'etat':
      return t.googleExpire;
    case 'refus':
      return t.googleAnnule;
    case 'indisponible':
      return t.googleIndisponible;
    case 'conflit':
      return t.googleConflit;
    case 'stockage':
      return t.googleStockage;
    case 'non-verifiable':
    case 'reseau':
      return t.googleEchec;
    // Code inconnu : on informe sans inventer de cause.
    case undefined:
    case '':
      return null;
    default:
      return t.googleEchec;
  }
}

export function messageErreur(
  code: string | undefined,
  secours: string,
  t: TraductionsAuth,
  statut?: number,
): string {
  switch (code) {
    case 'identifiants':
      return t.errIdentifiants;
    case 'existe':
      return t.errExiste;
    case 'validation':
      return t.errSaisie;
    case 'stockage-indisponible':
      return t.errStockage;
    case 'limite':
      return t.errLimite;
    // `reseau` : la requête n'a jamais abouti (hors ligne, proxy, blocage).
    case 'reseau':
      return t.errServeur;
    // `serveur` : le serveur a répondu, mais pas avec notre contrat JSON
    // (500 de la fonction serverless, page d'erreur d'un proxy…).
    case 'serveur':
      return statut ? `${t.errServeur} (HTTP ${statut})` : t.errServeur;
    default:
      if (secours) return statut ? `${secours} (HTTP ${statut})` : secours;
      return statut ? `${t.errServeur} (HTTP ${statut})` : t.errServeur;
  }
}
