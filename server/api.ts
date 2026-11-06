/**
 * API Aura partagée — utilisée par server.ts (dev / auto-hébergement)
 * et par api/index.ts (fonction serverless Vercel). Une seule source
 * de vérité pour l'état honnête du produit et l'authentification.
 *
 * - Routes historiques (/status, /auth/*, /me, /chat) : contrat conservé.
 * - API v1 (/v1/...) : conversations, projets, missions, mémoire, recherche,
 *   studio — voir server/v1/. Authentification et isolation par compte
 *   appliquées systématiquement côté serveur.
 */
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  COOKIE_SESSION,
  creerSession,
  empreinteJeton,
  hacherMotDePasse,
  lireCookie,
  serialiserCookie,
  validerInscription,
  verifierMotDePasse,
  DUREE_SESSION_MS,
} from './accounts';
import {
  entrepotComptes,
  nouvelId,
  preferencesParDefaut,
  profilParDefaut,
} from './db/entrepots';
import type { Compte, ComptePublic } from './db/types';
import { validerMessages } from './chat';
import * as serviceIa from './ai/service';
import { ErreurAi } from './ai/errors';
import { createApiV1 } from './v1/routes';
import { tropDeTentatives } from './v1/middlewares';

const comptes = entrepotComptes();

type ReqAuth = Request & { compte?: { utilisateur: Compte } };

function versPublic(u: Compte): ComptePublic {
  return {
    id: u.id,
    email: u.email,
    nom: u.nom,
    cree: u.cree,
    onboarding: u.onboarding,
    profil: u.profil,
    preferences: u.preferences,
  };
}

async function attacherCompte(req: ReqAuth, _res: Response, next: NextFunction) {
  const jeton = lireCookie(req, COOKIE_SESSION);
  if (jeton) {
    try {
      const session = await comptes.sessionParEmpreinte(empreinteJeton(jeton));
      if (session) {
        const utilisateur = await comptes.parId(session.userId);
        if (utilisateur) req.compte = { utilisateur };
      }
    } catch {
      /* stockage momentanément injoignable : traité comme anonyme */
    }
  }
  next();
}

function definirSession(res: Response, jeton: string) {
  res.setHeader(
    'Set-Cookie',
    serialiserCookie(COOKIE_SESSION, jeton, { maxAge: Math.floor(DUREE_SESSION_MS / 1000) }),
  );
}

export function createApiApp(): express.Router {
  const api = express.Router();
  api.use(express.json({ limit: '32kb' }));
  api.use(attacherCompte);

  // API v1 — modules fonctionnels du workspace.
  api.use('/v1', createApiV1());

  // État réel du produit — jamais de fausse fonctionnalité.
  api.get('/status', async (_req, res) => {
    const comptesActifs = comptes.mode !== 'indisponible';
    const etatIa = await serviceIa.etatIa();
    const chatActif = etatIa.ok;
    res.json({
      name: 'Aura',
      phase: 'workspace',
      tagline: "De l'idée au résultat.",
      config: {
        // État technique minimal pour l'UI (jamais de stratégie commerciale,
        // jamais de nom de fournisseur ni de modèle).
        iaConfiguree: etatIa.ok,
      },
      features: {
        publicSite: 'live',
        intro: 'live',
        sculpture3d: 'live',
        accounts: comptesActifs ? 'live' : 'setup-required',
        chat: chatActif ? 'live' : 'setup-required',
        explore: chatActif ? 'live' : 'setup-required',
        studio: chatActif ? 'live' : 'setup-required',
        missions: comptesActifs ? 'live' : 'setup-required',
      },
      setup: {
        ...(comptesActifs ? {} : { accounts: comptes.raison }),
        ...(chatActif
          ? {}
          : {
              chat: 'Assistant non configuré sur cet environnement : ajoutez GEMINI_API_KEY (clé serveur uniquement).',
            }),
      },
    });
  });

  /* ── Inscription ── */
  api.post('/auth/register', async (req, res) => {
    const ip = req.ip ?? 'inconnu';
    if (tropDeTentatives(ip)) {
      res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.', code: 'limite' });
      return;
    }
    if (comptes.mode === 'indisponible') {
      res.status(503).json({ error: comptes.raison, code: 'stockage-indisponible' });
      return;
    }

    const corps = (req.body ?? {}) as { email?: string; password?: string; nom?: string };
    const { ok, champs } = validerInscription(corps);
    if (!ok) {
      res.status(400).json({ error: 'Saisie invalide.', code: 'validation', champs });
      return;
    }

    const email = corps.email!.trim().toLowerCase();
    if (await comptes.parEmail(email)) {
      res.status(409).json({ error: 'Un compte existe déjà avec cette adresse.', code: 'existe' });
      return;
    }

    const { hash, sel } = await hacherMotDePasse(corps.password!);
    const utilisateur: Compte = {
      id: nouvelId('usr'),
      email,
      nom: (corps.nom ?? '').trim(),
      hash,
      sel,
      cree: new Date().toISOString(),
      onboarding: { fait: false, objectif: null },
      profil: profilParDefaut(),
      preferences: preferencesParDefaut(),
    };
    const { jeton, session } = creerSession();
    session.userId = utilisateur.id;
    await comptes.creer(utilisateur);
    await comptes.creerSession(session);

    definirSession(res, jeton);
    res.status(201).json({ compte: versPublic(utilisateur) });
  });

  /* ── Connexion ── */
  api.post('/auth/login', async (req, res) => {
    const ip = req.ip ?? 'inconnu';
    if (tropDeTentatives(ip)) {
      res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.', code: 'limite' });
      return;
    }
    if (comptes.mode === 'indisponible') {
      res.status(503).json({ error: comptes.raison, code: 'stockage-indisponible' });
      return;
    }

    const corps = (req.body ?? {}) as { email?: string; password?: string };
    const email = (corps.email ?? '').trim().toLowerCase();
    const password = corps.password ?? '';
    if (!email || !password) {
      res.status(400).json({ error: 'Saisie invalide.', code: 'validation' });
      return;
    }

    const utilisateur = await comptes.parEmail(email);
    // Message unique : pas d'énumération de comptes.
    const refus = () =>
      res.status(401).json({ error: 'Identifiants incorrects.', code: 'identifiants' });
    if (!utilisateur) {
      await verifierMotDePasse(password, '00'.repeat(64), '00'.repeat(16));
      refus();
      return;
    }
    const valide = await verifierMotDePasse(password, utilisateur.hash, utilisateur.sel);
    if (!valide) {
      refus();
      return;
    }

    const { jeton, session } = creerSession();
    session.userId = utilisateur.id;
    await comptes.creerSession(session);

    definirSession(res, jeton);
    res.json({ compte: versPublic(utilisateur) });
  });

  /* ── Déconnexion ── */
  api.post('/auth/logout', async (req, res) => {
    const jeton = lireCookie(req, COOKIE_SESSION);
    if (jeton && comptes.mode !== 'indisponible') {
      try {
        await comptes.supprimerSession(empreinteJeton(jeton));
      } catch {
        /* le cookie est de toute façon effacé */
      }
    }
    res.setHeader('Set-Cookie', serialiserCookie(COOKIE_SESSION, '', { maxAge: 0 }));
    res.status(204).end();
  });

  /* ── Compte courant ── */
  api.get('/me', (req, res) => {
    const reqAuth = req as ReqAuth;
    if (!reqAuth.compte) {
      res.status(401).json({ error: 'non connecté', code: 'anonyme' });
      return;
    }
    res.json({ compte: versPublic(reqAuth.compte.utilisateur) });
  });

  /* ── Onboarding ── */
  api.patch('/me/onboarding', async (req, res) => {
    const reqAuth = req as ReqAuth;
    if (!reqAuth.compte) {
      res.status(401).json({ error: 'non connecté', code: 'anonyme' });
      return;
    }
    const corps = (req.body ?? {}) as { fait?: boolean; objectif?: string };
    const objectif = typeof corps.objectif === 'string' ? corps.objectif.trim().slice(0, 120) : null;
    const fait = corps.fait === true;

    const u = await comptes.parId(reqAuth.compte.utilisateur.id);
    if (!u) {
      res.status(401).json({ error: 'non connecté', code: 'anonyme' });
      return;
    }
    u.onboarding = { fait, objectif: objectif || null };
    await comptes.enregistrer(u);
    reqAuth.compte.utilisateur = u;
    res.json({ compte: versPublic(u) });
  });

  /* ── Chat (contrat historique ; le flux principal passe par /v1) ── */
  api.post('/chat', async (req, res) => {
    const reqAuth = req as ReqAuth;
    if (!reqAuth.compte) {
      res.status(401).json({ error: 'non connecté', code: 'anonyme' });
      return;
    }
    const etatIa = await serviceIa.etatIa();
    if (!etatIa.ok) {
      res.status(503).json({
        error: etatIa.raison ?? 'Chat indisponible : aucun moteur IA n’est configuré.',
        code: 'chat-indisponible',
      });
      return;
    }
    const ip = reqAuth.compte.utilisateur.id || (req.ip ?? 'inconnu');
    if (tropDeTentatives('chat:' + ip, 40, 5 * 60 * 1000)) {
      res.status(429).json({ error: 'Trop de messages. Réessayez dans quelques minutes.', code: 'limite' });
      return;
    }

    const corps = (req.body ?? {}) as { messages?: unknown; langue?: unknown };
    const verif = validerMessages(corps.messages);
    if (!verif.ok) {
      res.status(400).json({ error: 'Conversation invalide.', code: 'validation' });
      return;
    }

    try {
      const langue = corps.langue === 'en' ? 'en' : 'fr';
      const rep = await serviceIa.generer(
        'conversation',
        {
          messages: verif.messages,
          langue,
          system:
            langue === 'en'
              ? "You are Aura, the assistant of the Aura platform. Answer in the user's language, clearly and honestly. Never invent facts, sources, prices, or features. If you don't know, say so. Keep answers useful and concise."
              : 'Tu es Aura, l\'assistant de la plateforme Aura. Réponds dans la langue de l\'utilisateur, clairement et honnêtement. N\'invente jamais de faits, de sources, de prix ou de fonctionnalités. Si tu ne sais pas, dis-le. Des réponses utiles et concises.',
        },
      );
      // Le modèle utilisé (interne) n'est jamais exposé côté client.
      res.json({ reponse: rep.texte });
    } catch (e) {
      if (e instanceof ErreurAi) {
        res.status(e.statut).json({ error: e.message, code: e.code });
        return;
      }
      res.status(502).json({ error: 'Le moteur IA ne répond pas.', code: 'modele-indisponible' });
    }
  });

  return api;
}
