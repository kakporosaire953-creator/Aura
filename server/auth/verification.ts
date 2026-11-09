/**
 * Confirmation d'adresse : quelle règle s'applique réellement ici ?
 *
 * Trois états, jamais confondus :
 *
 * - `obligatoire` : l'envoi d'e-mails fonctionne ; un compte non confirmé
 *   n'accède pas à son espace (403 `email-non-verifie`).
 * - `impossible` : aucun fournisseur d'e-mails n'est configuré. Exiger une
 *   confirmation serait alors une porte fermée dont personne n'a la clé :
 *   l'accès reste ouvert, et l'interface le dit explicitement au lieu de
 *   laisser croire à une vérification.
 * - `facultative` : état par défaut. L'adresse peut être confirmée (le lien
 *   est envoyé quand un fournisseur existe), mais rien n'est bloqué : c'est
 *   la règle en vigueur depuis la décision produit du 2026-11-09, le temps
 *   que l'envoi d'e-mails soit réellement opérationnel.
 *
 * `AURA_VERIFICATION_EMAIL_OBLIGATOIRE=1` rétablit la confirmation
 * bloquante (et, sans fournisseur, refuse honnêtement l'inscription en 503
 * plutôt que de créer des comptes qui ne pourraient jamais s'ouvrir).
 * `=0` fige explicitement l'état non bloquant.
 */
import { mailConfigure } from '../mail/adaptateur.js';

export type EtatVerification = 'obligatoire' | 'impossible' | 'facultative';

const VALEURS_VRAIES = new Set(['1', 'oui', 'true', 'on']);
const VALEURS_FAUSSES = new Set(['0', 'non', 'false', 'off']);

export function etatVerification(): EtatVerification {
  const brut = (process.env.AURA_VERIFICATION_EMAIL_OBLIGATOIRE ?? '').trim().toLowerCase();
  // La variable reste prioritaire : elle seule peut rétablir le blocage.
  if (VALEURS_VRAIES.has(brut)) return 'obligatoire';
  if (VALEURS_FAUSSES.has(brut)) return 'facultative';
  // Défaut : aucune confirmation exigée. Sans fournisseur, on le dit
  // franchement (« impossible ») au lieu de laisser croire qu'un lien part.
  return mailConfigure() ? 'facultative' : 'impossible';
}

/** L'accès à l'espace est-il refusé tant que l'adresse n'est pas confirmée ? */
export function verificationBloquante(): boolean {
  return etatVerification() === 'obligatoire';
}

/** Un compte non confirmé peut-il se connecter à son espace ? */
export function accesAutorise(compte: { emailVerifie?: boolean } | null | undefined): boolean {
  if (!compte) return false;
  if (compte.emailVerifie === true) return true;
  return !verificationBloquante();
}

/** Message unique, réutilisé par l'API et par l'interface. */
export const MESSAGE_EMAIL_NON_VERIFIE =
  'Confirmez votre adresse e-mail pour accéder à votre espace : un lien vous a été envoyé à l’inscription.';
