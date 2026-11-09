/**
 * Récupération de compte — routes publiques.
 *
 * Trois principes non négociables :
 *
 * 1. **Anti-énumération.** Une demande de récupération ou de renvoi répond
 *    toujours 202 avec le même corps, que le compte existe ou non, et le
 *    temps de réponse est égalisé. Seule une erreur de syntaxe sur l'adresse
 *    est signalée (400), et le message d'indisponibilité du service d'e-mail
 *    est identique pour toutes les adresses.
 * 2. **Aucun jeton en clair.** Le jeton naît d'un tirage de 32 octets ; seule
 *    son empreinte SHA-256 est stockée. Il ne figure jamais dans les journaux.
 * 3. **Usage unique réel.** La consommation passe par une réservation
 *    atomique (`SET … NX EX`) : deux requêtes concurrentes ne peuvent pas
 *    réussir toutes les deux.
 */
import express, { type Request, type Response } from 'express';
import {
  DUREE_JETON_REINITIALISATION_MS,
  DUREE_JETON_VERIFICATION_MS,
  creerJeton,
  emailValide,
  empreinteJeton,
  empreinteValeur,
  hacherMotDePasse,
} from '../accounts.js';
import { entrepotComptes, entrepotJetons } from '../db/entrepots.js';
import type { Compte, Jeton } from '../db/types.js';
import {
  REGLES,
  asyncRoute,
  invalide,
  limiteIdentifiant,
  limiteParIp,
  versPublicV1,
} from '../v1/middlewares.js';
import { mailConfigure, raisonMailIndisponible } from '../mail/adaptateur.js';
import { langueDepuis, type LangueMail } from '../mail/gabarits.js';
import { envoyerReinitialisation, envoyerVerification } from '../mail/service.js';

/* ── Utilitaires ── */

/** Délai plancher : le temps de réponse ne doit pas trahir l'existence d'un compte. */
const DELAI_PLANCHER_MS = 350;

async function attendrePlancher(debut: number): Promise<void> {
  const reste = DELAI_PLANCHER_MS - (Date.now() - debut);
  if (reste > 0) await new Promise((r) => setTimeout(r, reste));
}

function refusMail(res: Response): void {
  res.status(503).json({
    error: raisonMailIndisponible() || "L'envoi d'e-mails n'est pas configuré sur cet environnement.",
    code: 'mail-indisponible',
  });
}

function refusStockage(res: Response): void {
  res.status(503).json({
    error: 'Service momentanément indisponible : stockage injoignable.',
    code: 'stockage-indisponible',
  });
}

function jetonInvalide(res: Response, code: 'jeton-invalide' | 'jeton-expire'): void {
  res.status(400).json({
    error:
      code === 'jeton-expire'
        ? 'Ce lien a expiré. Demandez-en un nouveau.'
        : 'Ce lien n’est pas valide ou a déjà été utilisé.',
    code,
  });
}

function motDePasseValide(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && valeur.length >= 8 && valeur.length <= 200;
}

/** Réponse identique dans tous les cas : le client ne peut rien déduire. */
function reponseGenerique(res: Response): void {
  res.status(202).json({ ok: true });
}

/**
 * Émet un jeton de vérification et envoie l'e-mail. Best-effort : renvoie
 * le résultat d'envoi, ne lève jamais, et laisse le compte inchangé si
 * l'envoi échoue (le jeton est alors supprimé).
 */
export async function envoyerVerificationCompte(
  compte: Compte,
  langue: LangueMail,
): Promise<{ ok: boolean; code?: string }> {
  if (compte.emailVerifie === true) return { ok: true };
  // Pas de fournisseur : aucun jeton n'est créé, rien n'est simulé.
  if (!mailConfigure()) return { ok: false, code: 'mail-indisponible' };
  const jetons = entrepotJetons();
  await jetons.revoquerActif(compte.id, 'verification');

  const { jeton, id } = creerJeton();
  const maintenant = Date.now();
  const enregistrement: Jeton = {
    id,
    type: 'verification',
    userId: compte.id,
    cree: maintenant,
    expire: maintenant + DUREE_JETON_VERIFICATION_MS,
    utiliseLe: null,
    empreinteEmail: empreinteValeur(compte.email),
  };
  await jetons.creer(enregistrement);

  const envoi = await envoyerVerification({
    nom: compte.nom,
    email: compte.email,
    langue,
    jeton,
    dureeHeures: Math.round(DUREE_JETON_VERIFICATION_MS / 3600_000),
  });

  if (!envoi.ok) {
    await jetons.terminer(enregistrement);
    return { ok: false, code: envoi.code };
  }
  return { ok: true };
}

/* ── Routes ── */

export function createRoutesRecuperation(): express.Router {
  const r = express.Router();

  /* Mot de passe oublié — réponse toujours identique. */
  r.post(
    '/forgot-password',
    limiteParIp(REGLES.oubliIp),
    asyncRoute(async (req: Request, res: Response) => {
      const debut = Date.now();
      const corps = (req.body ?? {}) as { email?: unknown; langue?: unknown };
      const email = typeof corps.email === 'string' ? corps.email.trim().toLowerCase() : '';
      if (!emailValide(email)) {
        invalide(res, { email: 'invalide' });
        return;
      }
      // Service d'envoi absent : on le dit, sans jamais toucher au stockage
      // ni laisser croire qu'un message est parti.
      if (!mailConfigure()) {
        refusMail(res);
        return;
      }
      // Le compteur porte sur l'adresse soumise, qu'elle existe ou non.
      if (await limiteIdentifiant(res, REGLES.oubliEmail, email)) return;

      const comptes = entrepotComptes();
      if (comptes.mode === 'indisponible') {
        refusStockage(res);
        return;
      }

      const langue = langueDepuis(corps.langue);
      const compte = await comptes.parEmail(email);
      if (compte) {
        const jetons = entrepotJetons();
        await jetons.revoquerActif(compte.id, 'reinitialisation');

        const { jeton, id } = creerJeton();
        const maintenant = Date.now();
        const enregistrement: Jeton = {
          id,
          type: 'reinitialisation',
          userId: compte.id,
          cree: maintenant,
          expire: maintenant + DUREE_JETON_REINITIALISATION_MS,
          utiliseLe: null,
          empreinteEmail: empreinteValeur(email),
        };
        await jetons.creer(enregistrement);

        const envoi = await envoyerReinitialisation({
          nom: compte.nom,
          email: compte.email,
          langue,
          jeton,
          dureeMinutes: Math.round(DUREE_JETON_REINITIALISATION_MS / 60_000),
        });

        if (!envoi.ok) {
          // Rien n'est enregistré comme envoyé : le jeton disparaît.
          await jetons.terminer(enregistrement);
          refusMail(res);
          return;
        }
      }

      await attendrePlancher(debut);
      reponseGenerique(res);
    }),
  );

  /* Réinitialisation — jeton à usage unique, toutes les sessions fermées. */
  r.post(
    '/reset-password',
    limiteParIp(REGLES.reinitialisationIp),
    asyncRoute(async (req: Request, res: Response) => {
      const corps = (req.body ?? {}) as { token?: unknown; password?: unknown };
      const brut = typeof corps.token === 'string' ? corps.token.trim() : '';
      if (!brut || brut.length < 20 || brut.length > 200) {
        jetonInvalide(res, 'jeton-invalide');
        return;
      }
      if (!motDePasseValide(corps.password)) {
        invalide(res, { password: typeof corps.password === 'string' && corps.password.length < 8 ? 'court' : 'invalide' });
        return;
      }

      const comptes = entrepotComptes();
      if (comptes.mode === 'indisponible') {
        refusStockage(res);
        return;
      }
      const jetons = entrepotJetons();
      const id = empreinteJeton(brut);

      const jeton = await jetons.lireSansFiltre(id);
      if (!jeton || jeton.type !== 'reinitialisation') {
        jetonInvalide(res, 'jeton-invalide');
        return;
      }
      if (jeton.utiliseLe) {
        jetonInvalide(res, 'jeton-invalide');
        return;
      }
      if (jeton.expire <= Date.now()) {
        await jetons.terminer(jeton);
        jetonInvalide(res, 'jeton-expire');
        return;
      }
      // Réservation atomique : le premier arrivé gagne.
      if (!(await jetons.reserver(id))) {
        jetonInvalide(res, 'jeton-invalide');
        return;
      }

      const compte = await comptes.parId(jeton.userId);
      if (!compte) {
        await jetons.terminer(jeton);
        jetonInvalide(res, 'jeton-invalide');
        return;
      }

      const { hash, sel } = await hacherMotDePasse(corps.password);
      compte.hash = hash;
      compte.sel = sel;
      // Un mot de passe utilisable existe désormais, même pour un compte
      // ouvert via Google (qui n'en avait aucun).
      compte.motDePasseDefini = true;
      // L'adresse vient d'être prouvée par l'e-mail reçu.
      compte.emailVerifie = true;
      compte.emailVerifieLe = new Date().toISOString();
      await comptes.enregistrer(compte);

      const revoquees = await comptes.supprimerToutesSessions(compte.id);
      await jetons.terminer(jeton);

      res.json({ ok: true, sessionsFermees: revoquees });
    }),
  );

  /* Vérification d'adresse — lien à usage unique. */
  r.post(
    '/verify-email',
    limiteParIp(REGLES.verificationIp),
    asyncRoute(async (req: Request, res: Response) => {
      const corps = (req.body ?? {}) as { token?: unknown };
      const brut = typeof corps.token === 'string' ? corps.token.trim() : '';
      if (!brut || brut.length < 20 || brut.length > 200) {
        jetonInvalide(res, 'jeton-invalide');
        return;
      }

      const comptes = entrepotComptes();
      if (comptes.mode === 'indisponible') {
        refusStockage(res);
        return;
      }
      const jetons = entrepotJetons();
      const id = empreinteJeton(brut);

      const jeton = await jetons.lireSansFiltre(id);
      if (!jeton || jeton.type !== 'verification') {
        jetonInvalide(res, 'jeton-invalide');
        return;
      }
      if (jeton.utiliseLe) {
        jetonInvalide(res, 'jeton-invalide');
        return;
      }
      if (jeton.expire <= Date.now()) {
        await jetons.terminer(jeton);
        jetonInvalide(res, 'jeton-expire');
        return;
      }
      if (!(await jetons.reserver(id))) {
        jetonInvalide(res, 'jeton-invalide');
        return;
      }

      const compte = await comptes.parId(jeton.userId);
      if (!compte) {
        await jetons.terminer(jeton);
        jetonInvalide(res, 'jeton-invalide');
        return;
      }
      if (empreinteValeur(compte.email) !== jeton.empreinteEmail) {
        // L'adresse a changé depuis l'envoi : le lien ne vaut plus.
        await jetons.terminer(jeton);
        jetonInvalide(res, 'jeton-invalide');
        return;
      }

      compte.emailVerifie = true;
      compte.emailVerifieLe = new Date().toISOString();
      await comptes.enregistrer(compte);
      await jetons.terminer(jeton);

      res.json({ compte: versPublicV1(compte) });
    }),
  );

  /* Renvoi de vérification — réponse toujours identique. */
  r.post(
    '/resend-verification',
    limiteParIp(REGLES.renvoiIp),
    asyncRoute(async (req: Request, res: Response) => {
      const debut = Date.now();
      const corps = (req.body ?? {}) as { email?: unknown; langue?: unknown };
      const email = typeof corps.email === 'string' ? corps.email.trim().toLowerCase() : '';
      if (!emailValide(email)) {
        invalide(res, { email: 'invalide' });
        return;
      }
      if (!mailConfigure()) {
        refusMail(res);
        return;
      }
      if (await limiteIdentifiant(res, REGLES.renvoiEmail, email)) return;

      const comptes = entrepotComptes();
      if (comptes.mode === 'indisponible') {
        refusStockage(res);
        return;
      }

      const compte = await comptes.parEmail(email);
      if (compte && compte.emailVerifie !== true) {
        const envoi = await envoyerVerificationCompte(compte, langueDepuis(corps.langue));
        if (!envoi.ok) {
          refusMail(res);
          return;
        }
      }

      await attendrePlancher(debut);
      reponseGenerique(res);
    }),
  );

  return r;
}
