/**
 * API v1 — sécurité du compte : mot de passe, sessions actives, renvoi de
 * vérification. Toutes ces routes exigent une session valide.
 *
 * Détails volontaires :
 * - l'identifiant de session exposé est un préfixe de l'empreinte stockée,
 *   jamais le cookie ;
 * - révoquer « les autres » ne ferme pas l'appareil depuis lequel on agit ;
 * - changer son mot de passe laisse la session courante ouverte et ferme
 *   toutes les autres ;
 * - aucune route ne prétend avoir envoyé un e-mail sans fournisseur configuré.
 */
import express from 'express';
import {
  DUREE_JETON_VERIFICATION_MS,
  hacherMotDePasse,
  verifierMotDePasse,
} from '../accounts.js';
import { envoyerVerificationCompte } from '../auth/recuperation.js';
import { mailConfigure, raisonMailIndisponible } from '../mail/adaptateur.js';
import { langueDepuis } from '../mail/gabarits.js';
import {
  REGLES,
  asyncRoute,
  authRequise,
  erreur404,
  invalide,
  limiteIdentifiant,
  limiteParCompte,
  type ReqV1,
} from './middlewares.js';

/** Libellé lisible d'un en-tête d'agent — affiché au propriétaire du compte. */
export function decrireAgent(agent: string | null | undefined): string {
  if (!agent) return 'Appareil inconnu';
  const a = agent.toLowerCase();
  const navigateur =
    /edg\//.test(a) ? 'Edge'
    : /opr\/|opera/.test(a) ? 'Opera'
    : /firefox\//.test(a) ? 'Firefox'
    : /chrome\//.test(a) ? 'Chrome'
    : /safari\//.test(a) ? 'Safari'
    : /curl|wget|node|python|postman/.test(a) ? 'Outil'
    : null;
  const systeme =
    /iphone|ipad|ios/.test(a) ? 'iOS'
    : /android/.test(a) ? 'Android'
    : /mac os x|macintosh/.test(a) ? 'macOS'
    : /windows/.test(a) ? 'Windows'
    : /linux/.test(a) ? 'Linux'
    : null;
  if (navigateur && systeme) return `${navigateur} · ${systeme}`;
  return navigateur ?? systeme ?? 'Appareil inconnu';
}

const ID_SESSION = /^[a-f0-9]{16}$/;

function sessionPublique(session: {
  id: string;
  cree: string;
  expire: number;
  derniereActivite?: number;
  agent?: string | null;
}, couranteId: string | null) {
  const activite = session.derniereActivite ?? Date.parse(session.cree) ?? 0;
  return {
    id: session.id.slice(0, 16),
    libelle: decrireAgent(session.agent),
    courante: session.id === couranteId,
    cree: session.cree,
    derniereActivite: new Date(activite).toISOString(),
    expire: new Date(session.expire).toISOString(),
  };
}

export function createRoutesCompte(): express.Router {
  const r = express.Router();

  /* ── Sessions actives ── */

  r.get(
    '/me/sessions',
    authRequise,
    asyncRoute(async (req, res) => {
      const rq = req as ReqV1;
      const courante = rq.session?.id ?? null;
      const sessions = (await rq.comptes!.sessionsDe(rq.compte!.id))
        .sort((a, b) => {
          const aa = a.derniereActivite ?? Date.parse(a.cree);
          const bb = b.derniereActivite ?? Date.parse(b.cree);
          return bb - aa;
        })
        .map((s) => sessionPublique(s, courante));
      res.set('Cache-Control', 'no-store');
      res.json({ sessions });
    }),
  );

  r.delete(
    '/me/sessions/:id',
    authRequise,
    asyncRoute(async (req, res) => {
      const rq = req as ReqV1;
      const prefixe = String(req.params.id ?? '');
      if (!ID_SESSION.test(prefixe)) {
        invalide(res, { id: 'invalide' });
        return;
      }
      const sessions = await rq.comptes!.sessionsDe(rq.compte!.id);
      const cible = sessions.find((s) => s.id.startsWith(prefixe));
      if (!cible) {
        erreur404(res);
        return;
      }
      if (rq.session && cible.id === rq.session.id) {
        res.status(400).json({
          error: 'Cette session est la vôtre : utilisez la déconnexion.',
          code: 'session-courante',
        });
        return;
      }
      await rq.comptes!.supprimerSession(cible.id);
      res.json({ ok: true });
    }),
  );

  r.post(
    '/me/sessions/revoquer-autrui',
    authRequise,
    asyncRoute(async (req, res) => {
      const rq = req as ReqV1;
      const fermees = await rq.comptes!.supprimerAutresSessions(
        rq.compte!.id,
        rq.session?.id ?? null,
      );
      res.json({ ok: true, sessionsFermees: fermees });
    }),
  );

  /* ── Changement de mot de passe ── */

  r.post(
    '/me/password',
    authRequise,
    limiteParCompte(5, 15 * 60 * 1000),
    asyncRoute(async (req, res) => {
      const rq = req as ReqV1;
      const corps = (req.body ?? {}) as { actuel?: unknown; nouveau?: unknown };
      const actuel = typeof corps.actuel === 'string' ? corps.actuel : '';
      const nouveau = typeof corps.nouveau === 'string' ? corps.nouveau : '';

      const compte = rq.compte!;
      // Compte ouvert via Google : aucun mot de passe n'existe. La session
      // ouverte fait foi (le parcours « mot de passe oublié » dépend d'un
      // e-mail qui n'est pas encore opérationnel) ; on définit donc le
      // premier mot de passe sans demander l'ancien — et on ferme toutes les
      // autres sessions dans la foulée.
      const premierMotDePasse = compte.motDePasseDefini === false;

      const champs: Record<string, string> = {};
      if (!premierMotDePasse && !actuel) champs.actuel = 'requis';
      if (nouveau.length < 8) champs.nouveau = 'court';
      if (nouveau.length > 200) champs.nouveau = 'long';
      if (Object.keys(champs).length > 0) {
        invalide(res, champs);
        return;
      }
      if (!premierMotDePasse && nouveau === actuel) {
        res.status(400).json({
          error: 'Choisissez un mot de passe différent de l’actuel.',
          code: 'identique',
          champs: { nouveau: 'identique' },
        });
        return;
      }

      if (!premierMotDePasse) {
        const valide = await verifierMotDePasse(actuel, compte.hash, compte.sel);
        if (!valide) {
          // Compteur dédié : marteler ce champ n'atteint pas la connexion.
          if (await limiteIdentifiant(res, REGLES.loginEmail, `mdp:${compte.email}`)) return;
          res.status(401).json({
            error: 'Mot de passe actuel incorrect.',
            code: 'mot-de-passe',
            champs: { actuel: 'incorrect' },
          });
          return;
        }
      }

      const { hash, sel } = await hacherMotDePasse(nouveau);
      compte.hash = hash;
      compte.sel = sel;
      compte.motDePasseDefini = true;
      await rq.comptes!.enregistrer(compte);

      const fermees = await rq.comptes!.supprimerAutresSessions(
        compte.id,
        rq.session?.id ?? null,
      );
      res.json({ ok: true, sessionsFermees: fermees });
    }),
  );

  /* ── Renvoi de vérification depuis une session ouverte ── */

  r.post(
    '/me/email/renvoyer',
    authRequise,
    limiteParCompte(3, 60 * 60 * 1000),
    asyncRoute(async (req, res) => {
      const rq = req as ReqV1;
      const compte = rq.compte!;
      if (compte.emailVerifie === true) {
        res.status(409).json({ error: 'Cette adresse est déjà confirmée.', code: 'deja-verifie' });
        return;
      }
      if (!mailConfigure()) {
        res.status(503).json({
          error: raisonMailIndisponible() || "L'envoi d'e-mails n'est pas configuré sur cet environnement.",
          code: 'mail-indisponible',
        });
        return;
      }
      const corps = (req.body ?? {}) as { langue?: unknown };
      const envoi = await envoyerVerificationCompte(compte, langueDepuis(corps.langue));
      if (!envoi.ok) {
        // Deux causes distinctes, deux réponses distinctes. Les confondre
        // affichait « pas configuré » alors que le fournisseur avait refusé
        // l'envoi (domaine non vérifié, quota, clé) : fausse piste garantie.
        const indisponible = envoi.code === 'mail-indisponible';
        res.status(indisponible ? 503 : 502).json({
          error: indisponible
            ? raisonMailIndisponible() ||
              "L'envoi d'e-mails n'est pas configuré sur cet environnement."
            : "L'envoi de l'e-mail a été refusé par le service d'e-mails. Réessayez dans quelques minutes.",
          code: indisponible ? 'mail-indisponible' : 'mail-refuse',
        });
        return;
      }
      res.status(202).json({
        ok: true,
        expireDansMinutes: Math.round(DUREE_JETON_VERIFICATION_MS / 60_000),
      });
    }),
  );

  return r;
}
