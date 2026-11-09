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
 * - `facultative` : désactivée volontairement par l'administrateur
 *   (`AURA_VERIFICATION_EMAIL_OBLIGATOIRE=0`).
 *
 * La variable d'environnement peut forcer `obligatoire` même sans
 * fournisseur (`=1`) : dans ce cas l'inscription refuse honnêtement (503),
 * plutôt que de créer des comptes qui ne pourraient jamais être confirmés.
 */
import { mailConfigure } from '../mail/adaptateur.js';

export type EtatVerification = 'obligatoire' | 'impossible' | 'facultative';

const VALEURS_VRAIES = new Set(['1', 'oui', 'true', 'on']);
const VALEURS_FAUSSES = new Set(['0', 'non', 'false', 'off']);

export function etatVerification(): EtatVerification {
  const brut = (process.env.AURA_VERIFICATION_EMAIL_OBLIGATOIRE ?? '').trim().toLowerCase();
  if (VALEURS_FAUSSES.has(brut)) return 'facultative';
  if (VALEURS_VRAIES.has(brut)) return 'obligatoire';
  return mailConfigure() ? 'obligatoire' : 'impossible';
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
