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
  creerSession,
  empreinteJeton,
  hacherMotDePasse,
  lireJetonSession,
  nomCookieSession,
  serialiserCookie,
  validerInscription,
  verifierMotDePasse,
  DUREE_SESSION_MS,
} from './accounts.js';
import {
  entrepotComptes,
  nouvelId,
  preferencesParDefaut,
  profilParDefaut,
} from './db/entrepots.js';
import type { Compte, ComptePublic } from './db/types.js';

/** En-tête d'agent tronqué : sert uniquement à décrire une session à son propriétaire. */
function userAgent(req: Request): string | null {
  const brut = req.headers['user-agent'];
  const valeur = Array.isArray(brut) ? brut[0] : brut;
  return valeur ? valeur.replace(/\s+/g, ' ').trim().slice(0, 160) : null;
}

function langueDe(req: Request): 'fr' | 'en' {
  const corps = (req.body ?? {}) as { langue?: unknown };
  return langueDepuis(corps.langue);
}
import { validerMessages } from './chat.js';
import * as serviceIa from './ai/service.js';
import { ErreurAi } from './ai/errors.js';
import { createApiV1 } from './v1/routes.js';
import {
  REGLES,
  asyncRoute,
  limiteParIp,
  limiteIdentifiant,
  depasse,
} from './v1/middlewares.js';
import { ipClient } from './v1/limite.js';
import { createRoutesRecuperation, envoyerVerificationCompte } from './auth/recuperation.js';
import { mailConfigure } from './mail/adaptateur.js';
import {
  accesAutorise,
  etatVerification,
  MESSAGE_EMAIL_NON_VERIFIE,
  verificationBloquante,
} from './auth/verification.js';
import { langueDepuis } from './mail/gabarits.js';
import { createRoutesGoogle, googleConfigure } from './auth/google.js';

const comptes = entrepotComptes();

type ReqAuth = Request & {
  compte?: { utilisateur: Compte };
  /** Cookie présent mais session inconnue ou expirée. */
  sessionExpiree?: boolean;
  /** Lecture du stockage impossible : anonyme par accident, pas par nature. */
  stockageIndisponible?: boolean;
};

/**
 * Confiance proxy : AURA est derrière un seul proxy (Vercel) ou exposée
 * directement (dev, auto-hébergement). On ne fait confiance à un en-tête
 * `x-forwarded-for` que lorsqu'un proxy de confiance est effectivement
 * devant l'application — jamais par défaut.
 */
export function configurerConfianceProxy(app: express.Application): void {
  const derriereProxy =
    process.env.VERCEL !== undefined || process.env.AURA_TRUST_PROXY === '1';
  app.set('trust proxy', derriereProxy ? 1 : false);
}

function versPublic(u: Compte): ComptePublic {
  return {
    id: u.id,
    email: u.email,
    nom: u.nom,
    cree: u.cree,
    onboarding: u.onboarding,
    profil: u.profil,
    preferences: u.preferences,
    emailVerifie: u.emailVerifie === true,
    googleLie: typeof u.googleSub === 'string' && u.googleSub.length > 0,
    motDePasseDefini: u.motDePasseDefini !== false,
  };
}

async function attacherCompte(req: ReqAuth, _res: Response, next: NextFunction) {
  const jeton = lireJetonSession(req);
  if (jeton) {
    try {
      const session = await comptes.sessionParEmpreinte(empreinteJeton(jeton));
      if (session) {
        const utilisateur = await comptes.parId(session.userId);
        if (utilisateur) req.compte = { utilisateur };
        else req.sessionExpiree = true;
      } else {
        req.sessionExpiree = true;
      }
    } catch (e) {
      req.stockageIndisponible = true;
      console.error(
        '[api] session illisible (stockage) —',
        e instanceof Error ? e.message : e,
      );
    }
  }
  next();
}

function definirSession(res: Response, jeton: string) {
  res.setHeader(
    'Set-Cookie',
    serialiserCookie(nomCookieSession(), jeton, { maxAge: Math.floor(DUREE_SESSION_MS / 1000) }),
  );
}

/**
 * En-têtes de sécurité communs à l'API. Volontairement sobres : l'API ne
 * renvoie que du JSON, aucune ressource à charger, donc pas de CSP ici
 * (elle est posée sur le document par la plateforme, voir vercel.json).
 */
function enTetesApi(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store');
  next();
}

export function createApiApp(): express.Router {
  const api = express.Router();
  api.use(enTetesApi);
  // Les messages peuvent porter des images : corps plus large sur cette seule
  // route, avant le limiteur général (32 Ko) qui s'applique au reste de l'API.
  api.use('/v1/conversations/:id/messages', express.json({ limit: '6mb' }));
  api.use(express.json({ limit: '32kb' }));
  api.use(attacherCompte);

  // API v1 — modules fonctionnels du workspace.
  api.use('/v1', createApiV1());

  /* Connexion Google : deux routes publiques (départ, retour). Sans
     configuration, elles répondent 503 — jamais une simulation. */
  api.use('/auth/google', createRoutesGoogle());

  /* Récupération de compte : routes publiques (mot de passe oublié,
     réinitialisation, vérification d'adresse, renvoi). */
  api.use('/auth', createRoutesRecuperation());

  // État réel du produit — jamais de fausse fonctionnalité.
  api.get('/status', asyncRoute(async (_req, res) => {
    const comptesActifs = comptes.mode !== 'indisponible';
    const etatIa = await serviceIa.etatIa();
    const chatActif = etatIa.ok;
    // L'envoi d'e-mails conditionne deux parcours : la confirmation
    // d'adresse et la réinitialisation de mot de passe. Son absence se dit,
    // sans nom de fournisseur ni secret : l'exploitant doit pouvoir lire
    // « ce qui reste à configurer » depuis le site lui-même.
    const mailActif = mailConfigure();
    res.json({
      name: 'Aura',
      phase: 'workspace',
      tagline: "De l'idée au résultat.",
      config: {
        // État technique minimal pour l'UI (jamais de stratégie commerciale,
        // jamais de nom de fournisseur ni de modèle).
        iaConfiguree: etatIa.ok,
        mailConfiguree: mailActif,
        verificationEmail: etatVerification(),
        // Simple disponibilité : ni identifiant client ni secret ici.
        googleConfiguree: googleConfigure(),
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
              chat: "Assistant non configuré sur cet environnement : ajoutez une clé de moteur côté serveur (jamais dans le navigateur).",
            }),
        ...(mailActif
          ? {}
          : {
              // Aucun nom de variable ni de fournisseur ici : cet état est
              // public. La marche à suivre vit dans docs/analyse et .env.example.
              mail: "Envoi d'e-mails non configuré : la confirmation d'adresse et la réinitialisation de mot de passe sont indisponibles sur cet environnement.",
            }),
      },
    });
  }));

  /* ── Inscription ── */
  api.post('/auth/register', limiteParIp(REGLES.registerIp), asyncRoute(async (req, res) => {
    if (comptes.mode === 'indisponible') {
      res.status(503).json({ error: comptes.raison, code: 'stockage-indisponible' });
      return;
    }

    const corps = (req.body ?? {}) as { email?: string; password?: string; nom?: string };
    if (typeof corps.email === 'string' && corps.email.trim()) {
      if (await limiteIdentifiant(res, REGLES.registerEmail, corps.email)) return;
    }
    const { ok, champs } = validerInscription(corps);
    if (!ok) {
      res.status(400).json({ error: 'Saisie invalide.', code: 'validation', champs });
      return;
    }

    // Confirmation obligatoire sans fournisseur d'e-mails : l'inscription est
    // refusée plutôt que de créer un compte qui ne pourrait jamais s'ouvrir.
    if (verificationBloquante() && !mailConfigure()) {
      res.status(503).json({
        error:
          'La confirmation d’adresse est obligatoire, mais l’envoi d’e-mails n’est pas configuré sur cet environnement.',
        code: 'mail-indisponible',
      });
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
    utilisateur.emailVerifie = false;
    const { jeton, session } = creerSession(userAgent(req));
    session.userId = utilisateur.id;
    await comptes.creer(utilisateur);
    await comptes.creerSession(session);

    definirSession(res, jeton);
    // L'envoi est attendu (au plus 8 s, un seul essai) pour que la réponse
    // dise la vérité : un compte créé sans lien reçu est une impasse, et
    // l'interface doit l'annoncer tout de suite plutôt que de laisser
    // croire qu'un e-mail est parti.
    const envoi = await envoyerVerificationCompte(utilisateur, langueDe(req)).catch(
      (): { ok: boolean; code?: string } => ({ ok: false, code: 'mail-refuse' }),
    );

    res.status(201).json({
      compte: versPublic(utilisateur),
      mailConfigure: mailConfigure(),
      envoiMail: envoi.ok ? { ok: true } : { ok: false, code: envoi.code ?? 'mail-refuse' },
    });
  }));

  /* ── Connexion ── */
  api.post('/auth/login', limiteParIp(REGLES.loginIp), asyncRoute(async (req, res) => {
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
    // Deuxième verrou, indépendant de l'adresse IP : une même adresse n'est
    // pas martelée depuis plusieurs machines.
    if (await limiteIdentifiant(res, REGLES.loginEmail, email)) return;

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

    const { jeton, session } = creerSession(userAgent(req));
    session.userId = utilisateur.id;
    await comptes.creerSession(session);

    definirSession(res, jeton);
    res.json({ compte: versPublic(utilisateur) });
  }));

  /* ── Déconnexion ── */
  api.post('/auth/logout', asyncRoute(async (req, res) => {
    const jeton = lireJetonSession(req);
    if (jeton && comptes.mode !== 'indisponible') {
      try {
        await comptes.supprimerSession(empreinteJeton(jeton));
      } catch {
        /* le cookie est de toute façon effacé */
      }
    }
    res.setHeader('Set-Cookie', serialiserCookie(nomCookieSession(), '', { maxAge: 0 }));
    res.status(204).end();
  }));

  /* ── Compte courant ── */
  api.get('/me', (req, res) => {
    const reqAuth = req as ReqAuth;
    if (!reqAuth.compte) {
      // Une panne de stockage ne doit jamais être présentée comme un anonymat.
      if (reqAuth.stockageIndisponible) {
        res.status(503).json({
          error: 'Service momentanément indisponible : stockage injoignable.',
          code: 'stockage-indisponible',
        });
        return;
      }
      if (reqAuth.sessionExpiree) {
        res.status(401).json({ error: 'session expirée', code: 'session-expiree' });
        return;
      }
      res.status(401).json({ error: 'non connecté', code: 'anonyme' });
      return;
    }
    res.json({
      compte: versPublic(reqAuth.compte.utilisateur),
      // La règle appliquée par le serveur, pour que l'interface n'invente rien.
      verificationEmail: etatVerification(),
    });
  });

  /* ── Onboarding ── */
  api.patch('/me/onboarding', asyncRoute(async (req, res) => {
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
  }));

  /* ── Chat (contrat historique ; le flux principal passe par /v1) ── */
  api.post('/chat', asyncRoute(async (req, res) => {
    const reqAuth = req as ReqAuth;
    if (!reqAuth.compte) {
      res.status(401).json({ error: 'non connecté', code: 'anonyme' });
      return;
    }
    if (!accesAutorise(reqAuth.compte.utilisateur)) {
      res.status(403).json({ error: MESSAGE_EMAIL_NON_VERIFIE, code: 'email-non-verifie' });
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
    // Limite par compte (le trafic chat est toujours authentifié).
    const identifiantChat = reqAuth.compte.utilisateur.id || `ip-${ipClient(req)}`;
    if (await depasse(res, 'chat', identifiantChat, 40, 5 * 60 * 1000)) return;

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
  }));

  /* ── Filets de sécurité de l'API ──
     Toute réponse de /api doit rester du JSON : une page HTML d'erreur est
     illisible par le client, qui affiche alors « le service ne répond pas »
     sans pouvoir distinguer une panne d'une route absente. */

  // Route inconnue sous /api : 404 JSON explicite (jamais le SPA).
  api.use((_req, res) => {
    res.status(404).json({ error: 'Ressource introuvable.', code: 'introuvable' });
  });

  // Erreur non capturée : le statut d'origine est respecté (un corps JSON
  // malformé est une faute du client, pas une panne du serveur).
  api.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    const statut =
      typeof (err as { status?: unknown })?.status === 'number'
        ? (err as { status: number }).status
        : typeof (err as { statusCode?: unknown })?.statusCode === 'number'
          ? (err as { statusCode: number }).statusCode
          : 500;
    if (statut >= 400 && statut < 500) {
      res.status(statut).json({ error: 'Requête invalide.', code: 'validation' });
      return;
    }
    console.error(
      '[api] erreur non gérée —',
      err instanceof Error ? (err.stack ?? err.message) : err,
    );
    res.status(500).json({ error: 'Erreur interne du service.', code: 'interne' });
  });

  return api;
}
