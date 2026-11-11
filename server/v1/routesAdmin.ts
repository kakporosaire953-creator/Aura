/**
 * Administration — lecture de l'état réel et actions de modération.
 *
 * Trois principes :
 *
 * 1. **Le rôle vient de l'environnement** (`AURA_ADMIN_EMAILS`), jamais d'un
 *    champ en base : impossible de s'octroyer l'administration par une
 *    requête, et révoquer l'accès est une simple variable.
 * 2. **Suspendre n'efface rien.** Un compte banni garde ses données ; il ne
 *    peut plus se connecter et ses sessions sont fermées immédiatement.
 * 3. **Tout est journalisé.** Chaque action (qui, quoi, quand, sur qui)
 *    laisse une trace consultable — jamais de secret ni de hash.
 */
import express, { type Request, type Response } from 'express';
import { emailAdmin, adminRequise } from '../auth/admin.js';
import { entrepotComptes, entrepotDonnees, nouvelId } from '../db/entrepots.js';
import type { Compte, JournalAdmin, Session } from '../db/types.js';
import { asyncRoute, authRequise, invalide, limiteParCompte } from './middlewares.js';
import type { ReqV1 } from './middlewares.js';

const PAGE_MAX = 50;

function masquerSessions(sessions: Session[]) {
  return sessions
    .map((s) => ({
      id: s.id.slice(0, 12),
      cree: s.cree,
      expire: s.expire,
      derniereActivite: s.derniereActivite ?? null,
      agent: s.agent ?? null,
    }))
    .sort((a, b) => (b.derniereActivite ?? 0) - (a.derniereActivite ?? 0));
}

function resume(c: Compte, nbSessions: number) {
  return {
    id: c.id,
    email: c.email,
    nom: c.nom,
    cree: c.cree,
    emailVerifie: c.emailVerifie === true,
    googleLie: typeof c.googleSub === 'string' && c.googleSub.length > 0,
    motDePasseDefini: c.motDePasseDefini !== false,
    banni: Boolean(c.bannissement),
    motifBannissement: c.bannissement?.motif ?? null,
    banniLe: c.bannissement?.le ?? null,
    sessions: nbSessions,
  };
}

export function createRoutesAdmin(): express.Router {
  const r = express.Router();
  const comptes = entrepotComptes();

  /* État d'accès — lisible par tout compte connecté, pour que l'interface
     n'affiche le lien « Administration » qu'à qui de droit. */
  r.get('/etat', authRequise, (req, res) => {
    const rq = req as ReqV1;
    res.json({
      admin: emailAdmin(rq.compte?.email),
      configure: Boolean((process.env.AURA_ADMIN_EMAILS ?? '').trim()),
    });
  });

  const garde = [authRequise, adminRequise, limiteParCompte(120, 5 * 60 * 1000)];

  /* ── Statistiques globales ── */
  r.get(
    '/statistiques',
    ...garde,
    asyncRoute(async (_req: Request, res: Response) => {
      const tous = await comptes.listerTous();
      const sessions = await comptes.sessionsActives();
      const ilYaSeptJours = Date.now() - 7 * 24 * 60 * 60 * 1000;

      let conversations = 0;
      let messages = 0;
      let creations = 0;
      for (const c of tous) {
        try {
          const d = await entrepotDonnees(c.id).tout();
          conversations += d.conversations.length;
          messages += d.messages.length;
          creations += d.creations.length;
        } catch {
          // Une donnée illisible ne doit pas casser le tableau de bord.
        }
      }

      res.json({
        comptes: tous.length,
        verifies: tous.filter((c) => c.emailVerifie === true).length,
        google: tous.filter((c) => Boolean(c.googleSub)).length,
        bannis: tous.filter((c) => Boolean(c.bannissement)).length,
        sessionsActives: sessions.length,
        inscriptions7j: tous.filter((c) => Date.parse(c.cree) >= ilYaSeptJours).length,
        conversations,
        messages,
        creations,
      });
    }),
  );

  /* ── Liste des comptes (recherche + pagination) ── */
  r.get(
    '/utilisateurs',
    ...garde,
    asyncRoute(async (req: Request, res: Response) => {
      const q = req.query as { recherche?: unknown; page?: unknown; taille?: unknown };
      const recherche = typeof q.recherche === 'string' ? q.recherche.trim().toLowerCase() : '';
      const page = Math.max(1, Math.floor(Number(q.page) || 1));
      const taille = Math.min(PAGE_MAX, Math.max(1, Math.floor(Number(q.taille) || 25)));

      const tous = await comptes.listerTous();
      const filtres = recherche
        ? tous.filter(
            (c) =>
              c.email.toLowerCase().includes(recherche) ||
              (c.nom ?? '').toLowerCase().includes(recherche) ||
              c.id.toLowerCase().includes(recherche),
          )
        : tous;

      // Les plus récents d'abord : c'est ce qu'on veut voir en ouvrant le panneau.
      const tries = filtres.sort((a, b) => Date.parse(b.cree) - Date.parse(a.cree));
      const debut = (page - 1) * taille;
      const tranche = tries.slice(debut, debut + taille);
      const sessions = await comptes.sessionsActives();

      res.json({
        total: tries.length,
        page,
        taille,
        pages: Math.max(1, Math.ceil(tries.length / taille)),
        utilisateurs: tranche.map((c) =>
          resume(c, sessions.filter((s) => s.userId === c.id).length),
        ),
      });
    }),
  );

  /* ── Détail d'un compte ── */
  r.get(
    '/utilisateurs/:id',
    ...garde,
    asyncRoute(async (req: Request, res: Response) => {
      const compte = await comptes.parId(String(req.params.id ?? ''));
      if (!compte) {
        res.status(404).json({ error: 'Compte introuvable.', code: 'introuvable' });
        return;
      }
      const sessions = await comptes.sessionsDe(compte.id);
      let activite = { conversations: 0, messages: 0, projets: 0, missions: 0, creations: 0 };
      try {
        const d = await entrepotDonnees(compte.id).tout();
        activite = {
          conversations: d.conversations.length,
          messages: d.messages.length,
          projets: d.projets.length,
          missions: d.missions.length,
          creations: d.creations.length,
        };
      } catch {
        /* données illisibles : on rend au moins l'identité du compte */
      }

      res.json({
        utilisateur: {
          ...resume(compte, sessions.length),
          bannissement: compte.bannissement ?? null,
          emailVerifieLe: compte.emailVerifieLe ?? null,
        },
        sessions: masquerSessions(sessions),
        activite,
      });
    }),
  );

  /* ── Actions ── */
  const cible = async (req: Request, res: Response): Promise<Compte | null> => {
    const compte = await comptes.parId(String(req.params.id ?? ''));
    if (!compte) {
      res.status(404).json({ error: 'Compte introuvable.', code: 'introuvable' });
      return null;
    }
    const rq = req as ReqV1;
    if (compte.id === rq.compte?.id) {
      res.status(400).json({
        error: 'Cette action vise votre propre compte : elle est refusée.',
        code: 'soi-meme',
      });
      return null;
    }
    return compte;
  };

  const journaliser = async (
    req: Request,
    action: JournalAdmin['action'],
    sur: Compte,
    motif: string | null,
  ) => {
    const rq = req as ReqV1;
    await comptes.journalAjouter({
      id: nouvelId('adm'),
      le: new Date().toISOString(),
      par: rq.compte?.email ?? '(inconnu)',
      action,
      cible: sur.email,
      motif,
    });
  };

  r.post(
    '/utilisateurs/:id/bannir',
    ...garde,
    asyncRoute(async (req: Request, res: Response) => {
      const compte = await cible(req, res);
      if (!compte) return;
      const corps = (req.body ?? {}) as { motif?: unknown };
      const motif =
        typeof corps.motif === 'string' && corps.motif.trim()
          ? corps.motif.trim().slice(0, 200)
          : null;

      compte.bannissement = {
        le: new Date().toISOString(),
        motif,
        par: (req as ReqV1).compte?.email ?? '(inconnu)',
      };
      await comptes.enregistrer(compte);
      // Une suspension qui laisserait les sessions ouvertes ne suspendrait rien.
      const fermees = await comptes.supprimerToutesSessions(compte.id);
      await journaliser(req, 'bannir', compte, motif);
      res.json({ ok: true, sessionsFermees: fermees });
    }),
  );

  r.post(
    '/utilisateurs/:id/debannir',
    ...garde,
    asyncRoute(async (req: Request, res: Response) => {
      const compte = await cible(req, res);
      if (!compte) return;
      if (!compte.bannissement) {
        res.status(409).json({ error: 'Ce compte n’est pas suspendu.', code: 'non-banni' });
        return;
      }
      delete compte.bannissement;
      await comptes.enregistrer(compte);
      await journaliser(req, 'debannir', compte, null);
      res.json({ ok: true });
    }),
  );

  r.post(
    '/utilisateurs/:id/sessions/revoquer',
    ...garde,
    asyncRoute(async (req: Request, res: Response) => {
      const compte = await cible(req, res);
      if (!compte) return;
      const fermees = await comptes.supprimerToutesSessions(compte.id);
      await journaliser(req, 'revoquer-sessions', compte, null);
      res.json({ ok: true, sessionsFermees: fermees });
    }),
  );

  r.post(
    '/utilisateurs/:id/supprimer',
    ...garde,
    asyncRoute(async (req: Request, res: Response) => {
      const compte = await cible(req, res);
      if (!compte) return;
      const corps = (req.body ?? {}) as { confirmation?: unknown };
      // Suppression définitive : l'adresse exacte doit être recopiée.
      if (typeof corps.confirmation !== 'string' || corps.confirmation.trim().toLowerCase() !== compte.email) {
        invalide(res, { confirmation: 'adresse-exacte-requise' });
        return;
      }
      await comptes.supprimerCompte(compte.id);
      await journaliser(req, 'supprimer', compte, null);
      res.json({ ok: true });
    }),
  );

  /* ── Journal des actions ── */
  r.get(
    '/journal',
    ...garde,
    asyncRoute(async (_req: Request, res: Response) => {
      const entrees = await comptes.journalLire();
      res.json({ entrees: entrees.slice(0, 100) });
    }),
  );

  return r;
}
