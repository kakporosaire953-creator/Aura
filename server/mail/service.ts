/**
 * Service d'e-mail : liens et envois des deux messages d'AURA.
 *
 * Les liens sont construits à partir de l'origine publique déclarée en
 * configuration, jamais à partir de l'en-tête `Host` de la requête.
 * Sans configuration complète, rien n'est envoyé et l'appelant reçoit
 * un refus explicite — aucun succès n'est jamais simulé.
 */
import { envoyer, originePublique } from './adaptateur';
import { gabaritReinitialisation, gabaritVerification, type LangueMail } from './gabarits';
import type { ResultatEnvoi } from './adaptateur';

export { mailConfigure, raisonMailIndisponible } from './adaptateur';

function lien(chemin: string, jeton: string): string | null {
  const origine = originePublique();
  if (!origine) return null;
  return `${origine}${chemin}?jeton=${encodeURIComponent(jeton)}`;
}

export function lienVerification(jeton: string): string | null {
  return lien('/verifier-email', jeton);
}

export function lienReinitialisation(jeton: string): string | null {
  return lien('/reinitialiser', jeton);
}

export async function envoyerVerification(opts: {
  nom: string;
  email: string;
  langue: LangueMail;
  jeton: string;
  dureeHeures: number;
}): Promise<ResultatEnvoi> {
  const url = lienVerification(opts.jeton);
  if (!url) return { ok: false, raison: "L'origine publique n'est pas configurée.", code: 'mail-indisponible' };
  const message = gabaritVerification({
    nom: opts.nom,
    lien: url,
    dureeHeures: opts.dureeHeures,
    langue: opts.langue,
  });
  return envoyer({ ...message, a: opts.email });
}

export async function envoyerReinitialisation(opts: {
  nom: string;
  email: string;
  langue: LangueMail;
  jeton: string;
  dureeMinutes: number;
}): Promise<ResultatEnvoi> {
  const url = lienReinitialisation(opts.jeton);
  if (!url) return { ok: false, raison: "L'origine publique n'est pas configurée.", code: 'mail-indisponible' };
  const message = gabaritReinitialisation({
    nom: opts.nom,
    lien: url,
    dureeMinutes: opts.dureeMinutes,
    langue: opts.langue,
  });
  return envoyer({ ...message, a: opts.email });
}
