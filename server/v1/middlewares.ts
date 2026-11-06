/**
 * Middlewares de l'API v1 : session, authentification obligatoire,
 * limitation de débit, validation. Aucune donnée envoyée par le
 * navigateur n'est crus sur parole.
 */
import type { NextFunction, Request, Response } from 'express';
import {
  COOKIE_SESSION,
  empreinteJeton,
  lireCookie,
} from '../accounts';
import { entrepotComptes, entrepotDonnees, type EntrepotComptes, type EntrepotDonnees } from '../db/entrepots';
import type { Compte, ComptePublic } from '../db/types';

export type ReqV1 = Request & {
  compte?: Compte;
  comptes?: EntrepotComptes;
  donnees?: EntrepotDonnees;
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
  };
}

/** Attache le compte si le cookie de session est valide. */
export async function attacherCompteV1(req: ReqV1, _res: Response, next: NextFunction) {
  req.comptes = entrepotComptes();
  const jeton = lireCookie(req, COOKIE_SESSION);
  if (jeton) {
    try {
      const session = await req.comptes.sessionParEmpreinte(empreinteJeton(jeton));
      if (session) {
        const compte = await req.comptes.parId(session.userId);
        if (compte) {
          req.compte = compte;
          req.donnees = entrepotDonnees(compte.id);
        }
      }
    } catch {
      /* stockage injoignable : traité comme anonyme */
    }
  }
  next();
}

/** Refuse toute route privée sans compte authentifié. */
export function authRequise(req: ReqV1, res: Response, next: NextFunction) {
  if (!req.compte || !req.donnees) {
    res.status(401).json({ error: 'Connexion requise.', code: 'anonyme' });
    return;
  }
  next();
}

/* ── Limitation de débit (best-effort par instance) ── */

const tentatives = new Map<string, number[]>();

export function tropDeTentatives(
  cle: string,
  max = 25,
  fenetreMs = 10 * 60 * 1000,
): boolean {
  const maintenant = Date.now();
  const fenetre = (tentatives.get(cle) ?? []).filter((t) => maintenant - t < fenetreMs);
  if (fenetre.length >= max) {
    tentatives.set(cle, fenetre);
    return true;
  }
  fenetre.push(maintenant);
  tentatives.set(cle, fenetre);
  return false;
}

export function limiteParCompte(max: number, fenetreMs: number) {
  return (req: ReqV1, res: Response, next: NextFunction) => {
    const cle = req.compte?.id ?? req.ip ?? 'inconnu';
    if (tropDeTentatives(cle, max, fenetreMs)) {
      res.status(429).json({ error: 'Trop de requêtes. Réessayez dans quelques minutes.', code: 'limite' });
      return;
    }
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
