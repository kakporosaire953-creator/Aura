/**
 * API Aura partagée — utilisée par server.ts (dev / auto-hébergement)
 * et par api/index.ts (fonction serverless Vercel). Une seule source
 * de vérité pour l'état honnête du produit et l'authentification.
 */
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  COOKIE_SESSION,
  choisirMagasin,
  creerSession,
  empreinteJeton,
  hacherMotDePasse,
  lireCookie,
  serialiserCookie,
  validerInscription,
  verifierMotDePasse,
  versPublic,
  DUREE_SESSION_MS,
  type ComptePublic,
  type Utilisateur,
} from './accounts';

const magasin = choisirMagasin();

/* ── Limitation de débit mémoire (best-effort par instance) ── */
const tentatives = new Map<string, number[]>();
function tropDeTentatives(ip: string): boolean {
  const maintenant = Date.now();
  const fenetre = (tentatives.get(ip) ?? []).filter((t) => maintenant - t < 10 * 60 * 1000);
  if (fenetre.length >= 25) {
    tentatives.set(ip, fenetre);
    return true;
  }
  fenetre.push(maintenant);
  tentatives.set(ip, fenetre);
  return false;
}

type ReqAuth = Request & { compte?: { utilisateur: Utilisateur } };

async function attacherCompte(req: ReqAuth, _res: Response, next: NextFunction) {
  const jeton = lireCookie(req, COOKIE_SESSION);
  if (jeton) {
    try {
      const donnees = await magasin.lire();
      const session = donnees.sessions.find(
        (s) => s.id === empreinteJeton(jeton) && s.expire > Date.now(),
      );
      if (session) {
        const utilisateur = donnees.utilisateurs.find((u) => u.id === session.userId);
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

function profilCourant(req: ReqAuth): { compte: ComptePublic } | { error: string } {
  if (!req.compte) return { error: 'non connecté' };
  return { compte: versPublic(req.compte.utilisateur) };
}

export function createApiApp(): express.Router {
  const api = express.Router();
  api.use(express.json({ limit: '32kb' }));
  api.use(attacherCompte);

  // État réel du produit — jamais de fausse fonctionnalité.
  api.get('/status', (_req, res) => {
    const comptesActifs = magasin.mode !== 'indisponible';
    res.json({
      name: 'Aura',
      phase: 'renaissance',
      tagline: "De l'idée au résultat.",
      features: {
        publicSite: 'live',
        intro: 'live',
        sculpture3d: 'live',
        accounts: comptesActifs ? 'live' : 'setup-required',
        chat: 'rebuilding',
        explore: 'rebuilding',
        studio: 'rebuilding',
        missions: 'rebuilding',
      },
      setup: comptesActifs ? undefined : { accounts: magasin.raison },
    });
  });

  /* ── Inscription ── */
  api.post('/auth/register', async (req, res) => {
    const ip = req.ip ?? 'inconnu';
    if (tropDeTentatives(ip)) {
      res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.', code: 'limite' });
      return;
    }
    if (magasin.mode === 'indisponible') {
      res.status(503).json({ error: magasin.raison, code: 'stockage-indisponible' });
      return;
    }

    const corps = (req.body ?? {}) as { email?: string; password?: string; nom?: string };
    const { ok, champs } = validerInscription(corps);
    if (!ok) {
      res.status(400).json({ error: 'Saisie invalide.', code: 'validation', champs });
      return;
    }

    const email = corps.email!.trim().toLowerCase();
    const donnees = await magasin.lire();
    if (donnees.utilisateurs.some((u) => u.email === email)) {
      res.status(409).json({ error: 'Un compte existe déjà avec cette adresse.', code: 'existe' });
      return;
    }

    const { hash, sel } = await hacherMotDePasse(corps.password!);
    const utilisateur: Utilisateur = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      email,
      nom: (corps.nom ?? '').trim(),
      hash,
      sel,
      cree: new Date().toISOString(),
      onboarding: { fait: false, objectif: null },
    };
    const { jeton, session } = creerSession();
    session.userId = utilisateur.id;
    donnees.utilisateurs.push(utilisateur);
    donnees.sessions.push(session);
    await magasin.ecrire(donnees);

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
    if (magasin.mode === 'indisponible') {
      res.status(503).json({ error: magasin.raison, code: 'stockage-indisponible' });
      return;
    }

    const corps = (req.body ?? {}) as { email?: string; password?: string };
    const email = (corps.email ?? '').trim().toLowerCase();
    const password = corps.password ?? '';
    if (!email || !password) {
      res.status(400).json({ error: 'Saisie invalide.', code: 'validation' });
      return;
    }

    const donnees = await magasin.lire();
    const utilisateur = donnees.utilisateurs.find((u) => u.email === email);
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
    donnees.sessions.push(session);
    await magasin.ecrire(donnees);

    definirSession(res, jeton);
    res.json({ compte: versPublic(utilisateur) });
  });

  /* ── Déconnexion ── */
  api.post('/auth/logout', async (req, res) => {
    const jeton = lireCookie(req, COOKIE_SESSION);
    if (jeton && magasin.mode !== 'indisponible') {
      try {
        const donnees = await magasin.lire();
        donnees.sessions = donnees.sessions.filter((s) => s.id !== empreinteJeton(jeton));
        await magasin.ecrire(donnees);
      } catch {
        /* le cookie est de toute façon effacé */
      }
    }
    res.setHeader('Set-Cookie', serialiserCookie(COOKIE_SESSION, '', { maxAge: 0 }));
    res.status(204).end();
  });

  /* ── Compte courant ── */
  api.get('/me', (req, res) => {
    const p = profilCourant(req as ReqAuth);
    if ('error' in p) {
      res.status(401).json({ error: p.error, code: 'anonyme' });
      return;
    }
    res.json(p);
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

    const donnees = await magasin.lire();
    const u = donnees.utilisateurs.find((x) => x.id === reqAuth.compte!.utilisateur.id);
    if (!u) {
      res.status(401).json({ error: 'non connecté', code: 'anonyme' });
      return;
    }
    u.onboarding = { fait, objectif: objectif || null };
    reqAuth.compte.utilisateur = u;
    await magasin.ecrire(donnees);
    res.json({ compte: versPublic(u) });
  });

  return api;
}
