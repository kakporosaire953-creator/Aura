/**
 * Middlewares de l'API v1 : session, authentification obligatoire,
 * limitation de débit, validation. Aucune donnée envoyée par le
 * navigateur n'est crus sur parole.
 */
import type { NextFunction, Request, Response } from 'express';
import { empreinteJeton, lireJetonSession } from '../accounts.js';
import { accesAutorise, MESSAGE_EMAIL_NON_VERIFIE } from '../auth/verification.js';
import {
  baseDeDonnees,
  entrepotComptes,
  entrepotDonnees,
  type EntrepotComptes,
  type EntrepotDonnees,
} from '../db/entrepots.js';
import type { Compte, ComptePublic, Session } from '../db/types.js';
import { compterTentative, ipClient, empreinteIdentifiant } from './limite.js';

export type ReqV1 = Request & {
  compte?: Compte;
  /** Session courante — sert à lister et révoquer les autres appareils. */
  session?: Session;
  comptes?: EntrepotComptes;
  donnees?: EntrepotDonnees;
  /** Le cookie de session était présent mais ne correspond à aucune session valide. */
  sessionExpiree?: boolean;
  /** La lecture du stockage a échoué : anonyme par accident, pas par nature. */
  stockageIndisponible?: boolean;
};

export function versPublicV1(c: Compte): ComptePublic {
  return {
    id: c.id,
    email: c.email,
    nom: c.nom,
    cree: c.cree,
    onboarding: c.onboarding,
    profil: c.profil,
    preferences: c.preferences,
    emailVerifie: c.emailVerifie === true,
  };
}

/**
 * Attache le compte si le cookie de session est valide.
 *
 * Trois situations distinctes, jamais confondues :
 * - session valide → compte attaché ;
 * - cookie présent mais inconnu ou expiré → `sessionExpiree` (401 ciblé) ;
 * - stockage injoignable → `stockageIndisponible` (503, pas 401).
 */
export async function attacherCompteV1(req: ReqV1, _res: Response, next: NextFunction) {
  req.comptes = entrepotComptes();
  const jeton = lireJetonSession(req);
  if (jeton) {
    try {
      const session = await req.comptes.sessionParEmpreinte(empreinteJeton(jeton));
      if (session) {
        const compte = await req.comptes.parId(session.userId);
        if (compte) {
          req.compte = compte;
          req.session = session;
          req.donnees = entrepotDonnees(compte.id);
          // Dernière activité au plus une fois toutes les 5 minutes.
          void req.comptes.marquerActivite(session).catch(() => {});
        } else {
          req.sessionExpiree = true;
        }
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

/** Refuse toute route privée sans compte authentifié. */
export function authRequise(req: ReqV1, res: Response, next: NextFunction) {
  if (req.compte && req.donnees) {
    next();
    return;
  }
  // Une panne de stockage n'est pas un visiteur anonyme : le dire clairement.
  if (req.stockageIndisponible) {
    erreur503Stockage(res, 'Service momentanément indisponible : stockage injoignable.');
    return;
  }
  if (req.sessionExpiree) {
    res.status(401).json({ error: 'Session expirée. Reconnectez-vous.', code: 'session-expiree' });
    return;
  }
  res.status(401).json({ error: 'Connexion requise.', code: 'anonyme' });
}

/** Garde de confirmation d'adresse, appliquée au routeur du workspace. */
export function emailVerifieRequis(req: Request, res: Response, next: NextFunction) {
  const r = req as ReqV1;
  if (!r.compte) {
    next(); // non connecté : `authRequise` répondra 401, pas 403
    return;
  }
  if (accesAutorise(r.compte)) {
    next();
    return;
  }
  res.status(403).json({ error: MESSAGE_EMAIL_NON_VERIFIE, code: 'email-non-verifie' });
}

/* ── Limitation de débit (compteur partagé, repli local) ── */

/**
 * Portées de limitation. Chaque portée a son propre préfixe de clé :
 * saturer la connexion ne ferme ni l'inscription ni le chat.
 */
export type Portee =
  | 'login-ip'
  | 'login-email'
  | 'register-ip'
  | 'register-email'
  | 'compte'
  | 'chat'
  | 'forgot-ip'
  | 'forgot-email'
  | 'resend-ip'
  | 'resend-email'
  | 'verify-ip'
  | 'reset-ip';

export type RegleLimite = { portee: Portee; max: number; fenetreMs: number };

export const REGLES: Record<
  | 'loginIp'
  | 'loginEmail'
  | 'registerIp'
  | 'registerEmail'
  | 'suppression'
  | 'oubliIp'
  | 'oubliEmail'
  | 'renvoiIp'
  | 'renvoiEmail'
  | 'verificationIp'
  | 'reinitialisationIp',
  RegleLimite
> = {
  loginIp: { portee: 'login-ip', max: 20, fenetreMs: 10 * 60 * 1000 },
  loginEmail: { portee: 'login-email', max: 10, fenetreMs: 10 * 60 * 1000 },
  registerIp: { portee: 'register-ip', max: 30, fenetreMs: 10 * 60 * 1000 },
  registerEmail: { portee: 'register-email', max: 10, fenetreMs: 60 * 60 * 1000 },
  suppression: { portee: 'compte', max: 5, fenetreMs: 15 * 60 * 1000 },
  // Récupération de compte : les demandes sont rares par nature.
  oubliIp: { portee: 'forgot-ip', max: 10, fenetreMs: 15 * 60 * 1000 },
  oubliEmail: { portee: 'forgot-email', max: 3, fenetreMs: 60 * 60 * 1000 },
  renvoiIp: { portee: 'resend-ip', max: 5, fenetreMs: 15 * 60 * 1000 },
  renvoiEmail: { portee: 'resend-email', max: 3, fenetreMs: 60 * 60 * 1000 },
  verificationIp: { portee: 'verify-ip', max: 30, fenetreMs: 10 * 60 * 1000 },
  reinitialisationIp: { portee: 'reset-ip', max: 20, fenetreMs: 10 * 60 * 1000 },
};

/** Message commun — jamais d'indice sur le compteur exact restant. */
function refusLimite(res: Response) {
  res.status(429).json({
    error: 'Trop de tentatives. Réessayez dans quelques minutes.',
    code: 'limite',
  });
}

/**
 * Applique une règle à une clé donnée. Renvoie true si la requête est
 * refusée (la réponse 429 est déjà envoyée).
 */
export async function depasse(
  res: Response,
  portee: Portee,
  identifiant: string,
  max: number,
  fenetreMs: number,
): Promise<boolean> {
  const base = baseDeDonnees();
  const verdict = await compterTentative(base, `${portee}:${identifiant}`, max, fenetreMs);
  if (verdict.bloque) {
    refusLimite(res);
    return true;
  }
  return false;
}

/** Limitation d'une route d'authentification, par adresse IP. */
export function limiteParIp(regle: RegleLimite) {
  return async (req: ReqV1, res: Response, next: NextFunction) => {
    if (await depasse(res, regle.portee, ipClient(req), regle.max, regle.fenetreMs)) return;
    next();
  };
}

/** Limitation par identifiant fourni (adresse e-mail à l'inscription/connexion). */
export async function limiteIdentifiant(
  res: Response,
  regle: RegleLimite,
  valeur: string,
): Promise<boolean> {
  if (!valeur) return false;
  return depasse(res, regle.portee, empreinteIdentifiant(valeur), regle.max, regle.fenetreMs);
}

/** Limitation d'une action sensible sur le compte connecté. */
export function limiteParCompte(max: number, fenetreMs: number) {
  return async (req: ReqV1, res: Response, next: NextFunction) => {
    const identifiant = req.compte?.id ?? `ip-${ipClient(req)}`;
    if (await depasse(res, 'compte', identifiant, max, fenetreMs)) return;
    next();
  };
}

/* ── Validation ── */

export function chaine(
  v: unknown,
  opts: { min?: number; max?: number; defaut?: string | null; nullable?: boolean } = {},
): string | null | undefined {
  if (v === undefined) return opts.defaut;
  if (v === null) return opts.nullable ? null : undefined;
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  if (opts.min !== undefined && t.length < opts.min) return undefined;
  if (opts.max !== undefined && t.length > opts.max) return undefined;
  return t;
}

export function enumere<T extends string>(v: unknown, valeurs: readonly T[]): T | undefined {
  return typeof v === 'string' && (valeurs as readonly string[]).includes(v) ? (v as T) : undefined;
}

export function bool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

export function invalide(res: Response, champs?: Record<string, string>) {
  res.status(400).json({ error: 'Saisie invalide.', code: 'validation', ...(champs ? { champs } : {}) });
}

export function erreur404(res: Response) {
  res.status(404).json({ error: 'Ressource introuvable.', code: 'introuvable' });
}

export function erreur503Stockage(res: Response, raison: string) {
  res.status(503).json({ error: raison, code: 'stockage-indisponible' });
}

/** Express async wrapper — les erreurs inattendues deviennent un 500 propre. */
export function asyncRoute(
  fn: (req: ReqV1, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as ReqV1, res, next).catch((e) => {
      if (e instanceof Error && /Stockage non configuré|Stockage KV indisponible/.test(e.message)) {
        res.status(503).json({ error: e.message, code: 'stockage-indisponible' });
        return;
      }
      console.error('[api/v1] erreur interne', e instanceof Error ? e.message : e);
      res.status(500).json({ error: 'Erreur interne du service.', code: 'interne' });
    });
  };
}
