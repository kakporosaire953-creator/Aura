/**
 * En-têtes de sécurité du document (page HTML servie par AURA).
 *
 * Deux endroits les posent, et doivent rester alignés :
 * - `vercel.json` (production, appliqué par la plateforme) ;
 * - `server.ts` en mode production (auto-hébergement, vérifications locales).
 *
 * Politique choisie après inventaire réel des ressources : aucun script
 * tiers, aucune police servie ailleurs que Google Fonts (déjà présent dans
 * index.html), une seule origine de données distante (l'animation Lottie).
 * Tout le reste parle à `/api`, donc même origine.
 */
import type { Application, NextFunction, Request, Response } from 'express';

export const CONTENU_SECURITE = [
  "default-src 'self'",
  // Le document contient deux scripts en ligne (thème et révélation) posés
  // avant le premier rendu : ils doivent rester autorisés.
  "script-src 'self' 'unsafe-inline'",
  // Styles en ligne produits par React et par la feuille Google Fonts.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  // L'animation d'accueil est chargée depuis lottie.host ; l'API est interne.
  "connect-src 'self' https://lottie.host",
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Aucun site extérieur ne peut encadrer AURA (anti-clickjacking).
  "frame-ancestors 'none'",
].join('; ');

/** En-têtes communs à toutes les réponses du document. */
export function enTetesDocument(): Record<string, string> {
  return {
    'Content-Security-Policy': CONTENU_SECURITE,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  };
}

/**
 * HSTS : uniquement là où le domaine est réellement servi en HTTPS.
 * Jamais en développement (un `localhost` en HTTP resterait bloqué
 * pendant des mois dans le navigateur du développeur).
 */
export function enTetesHsts(): Record<string, string> {
  if (process.env.VERCEL === undefined) return {};
  return { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload' };
}

/** Pose les en-têtes sur toutes les réponses (mode production auto-hébergé). */
export function appliquerEnTetesDocument(app: Application): void {
  const communs = { ...enTetesDocument(), ...enTetesHsts() };
  app.use((_req: Request, res: Response, next: NextFunction) => {
    for (const [cle, valeur] of Object.entries(communs)) res.setHeader(cle, valeur);
    next();
  });
}
