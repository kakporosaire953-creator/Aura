/**
 * Administration — qui a le droit d'entrer.
 *
 * Le rôle d'administrateur ne vit **pas** dans la base : il vient d'une
 * variable d'environnement (`AURA_ADMIN_EMAILS`). Conséquence voulue :
 * aucun compte ne peut s'octroyer le rôle par une requête, une faille dans
 * l'écriture des comptes ne donne jamais l'administration, et retirer une
 * adresse de la variable suffit à révoquer l'accès (au redéploiement près).
 *
 * Sans variable, l'administration est **fermée** — pas « ouverte par défaut ».
 */
import type { NextFunction, Request, Response } from 'express';

/** Liste normalisée des adresses administratives. */
export function emailsAdmins(): string[] {
  return (process.env.AURA_ADMIN_EMAILS ?? '')
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'));
}

/** L'administration est-elle configurée sur cet environnement ? */
export function adminConfigure(): boolean {
  return emailsAdmins().length > 0;
}

/** Cette adresse est-elle administratrice ? Comparaison stricte, normalisée. */
export function emailAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const propre = email.trim().toLowerCase();
  return emailsAdmins().includes(propre);
}

/**
 * Deux formes de requête coexistent dans le code : `/api` attache
 * `{ utilisateur }`, l'API v1 attache directement le compte. On lit donc
 * l'adresse dans les deux, sans supposer laquelle est en jeu.
 */
type ReqAdmin = Request & {
  compte?: { email?: string; utilisateur?: { email?: string } };
};

function emailDeLaRequete(req: Request): string | null {
  const compte = (req as ReqAdmin).compte;
  return compte?.email ?? compte?.utilisateur?.email ?? null;
}

/**
 * Garde des routes d'administration.
 * 403 explicite : l'utilisateur est authentifié, il sait donc que la route
 * existe ; prétendre le contraire (404) ne tromperait personne et complique
 * le diagnostic d'une mauvaise configuration.
 */
export function adminRequise(req: Request, res: Response, next: NextFunction): void {
  if (!adminConfigure()) {
    res.status(503).json({
      error: "L'administration n'est pas configurée sur cet environnement.",
      code: 'admin-non-configure',
    });
    return;
  }
  if (!emailDeLaRequete(req)) {
    res.status(401).json({ error: 'non connecté', code: 'anonyme' });
    return;
  }
  if (!emailAdmin(emailDeLaRequete(req))) {
    res.status(403).json({ error: 'Accès réservé à l’administration.', code: 'admin-refuse' });
    return;
  }
  next();
}

/** Le compte suspendu est-il privé de l'application ? (toujours, sauf admin) */
export function suspensionActive(compte: { bannissement?: unknown; email?: string }): boolean {
  if (!compte.bannissement) return false;
  // Un administrateur ne peut pas s'enfermer dehors par mégarde : la
  // suspension d'un compte admin est ignorée (et l'interface l'interdit).
  return !emailAdmin(compte.email);
}
