/**
 * Connexion Google — OAuth 2.0 « authorization code », côté serveur.
 *
 * Principes :
 *
 * 1. **Le secret ne quitte jamais le serveur.** Le navigateur n'envoie qu'un
 *    code d'autorisation à usage unique ; l'échange contre des jetons se fait
 *    ici, sur le canal TLS serveur → Google.
 * 2. **Anti-CSRF réel.** Un `state` aléatoire de 32 octets est posé dans un
 *    cookie HttpOnly avant la redirection, puis comparé (temps constant) au
 *    retour. Sans ce cookie, le retour est refusé même avec un code valide.
 * 3. **Rien n'est cru sur parole.** L'`id_token` est vérifié : signature
 *    RS256 contre les clés publiques de Google (`oauth2/v3/certs`, mises en
 *    cache), émetteur, audience, expiration, et `email_verified === true`.
 *    Un jeton non vérifiable est un refus, jamais un passage.
 * 4. **Aucune énumération.** Un compte existant est rapproché par adresse
 *    vérifiée par Google ; le message d'erreur reste générique.
 *
 * Sans `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, la fonctionnalité se
 * déclare indisponible — elle n'est jamais simulée.
 */
import { createPublicKey, randomBytes, timingSafeEqual, verify as verifierSignature } from 'node:crypto';
import express, { type Request, type Response } from 'express';
import {
  DUREE_SESSION_MS,
  creerSession,
  hacherMotDePasse,
  lireCookie,
  nomCookieSession,
  serialiserCookie,
} from '../accounts.js';
import { entrepotComptes, nouvelId, preferencesParDefaut, profilParDefaut } from '../db/entrepots.js';
import type { Compte } from '../db/types.js';
import { asyncRoute, REGLES, limiteParIp } from '../v1/middlewares.js';
import { originePublique } from '../mail/adaptateur.js';

const CONSENTEMENT = 'https://accounts.google.com/o/oauth2/v2/auth';
const JETON = 'https://oauth2.googleapis.com/token';
const CERTIFICATS = 'https://www.googleapis.com/oauth2/v3/certs';
const EMETTEURS = new Set(['accounts.google.com', 'https://accounts.google.com']);

/** Cookie d'état anti-CSRF (vie courte : une seule tentative de connexion). */
export const COOKIE_ETAT = 'aura_oauth_etat';
/** Cookie de destination : une page interne, jamais une URL externe. */
export const COOKIE_RETOUR = 'aura_oauth_retour';
const DUREE_ETAT_S = 600;

export type ConfigGoogle = { clientId: string; clientSecret: string; redirectUri: string };

export type IdentiteGoogle = {
  sub: string;
  email: string;
  emailVerifie: boolean;
  nom: string;
};

function nettoie(valeur: string | undefined): string {
  return (valeur ?? '').trim();
}

/**
 * Configuration effective, ou la raison exacte de son absence.
 * L'URI de retour est dérivée de l'origine publique déclarée : jamais de
 * l'en-tête `Host` (usurpable), sinon un retour OAuth pourrait viser un
 * domaine étranger.
 */
export function configurationGoogle():
  | { ok: true; config: ConfigGoogle }
  | { ok: false; raison: string } {
  const clientId = nettoie(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = nettoie(process.env.GOOGLE_CLIENT_SECRET);
  const declare = nettoie(process.env.GOOGLE_REDIRECT_URI);

  if (!clientId || !clientSecret) {
    return { ok: false, raison: 'La connexion Google n’est pas configurée sur cet environnement.' };
  }

  let redirectUri = declare;
  if (!redirectUri) {
    const origine = originePublique();
    if (!origine) {
      return { ok: false, raison: 'L’origine publique des liens n’est pas configurée correctement.' };
    }
    redirectUri = `${origine}/api/auth/google/retour`;
  }

  try {
    const url = new URL(redirectUri);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      return { ok: false, raison: 'L’URI de retour Google doit être servie en HTTPS.' };
    }
    if (url.username || url.password) {
      return { ok: false, raison: 'L’URI de retour Google est invalide.' };
    }
  } catch {
    return { ok: false, raison: 'L’URI de retour Google est invalide.' };
  }

  return { ok: true, config: { clientId, clientSecret, redirectUri } };
}

export function googleConfigure(): boolean {
  return configurationGoogle().ok;
}

/** URL du consentement Google — construite ici, jamais dans le navigateur. */
export function urlConsentement(etat: string, config: ConfigGoogle): string {
  const parametres = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: etat,
    prompt: 'select_account',
  });
  return `${CONSENTEMENT}?${parametres.toString()}`;
}

export function etatAleatoire(): string {
  return randomBytes(32).toString('base64url');
}

/** Comparaison à temps constant de deux chaînes de longueur libre. */
export function memeValeur(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/**
 * Destination interne uniquement : un chemin absolu de ce site.
 * `//exemple.tld` et les URL à schéma sont rejetés (redirection ouverte).
 */
export function retourInterne(valeur: unknown, defaut = '/espace'): string {
  if (typeof valeur !== 'string') return defaut;
  const propre = valeur.trim();
  if (!propre.startsWith('/') || propre.startsWith('//') || propre.includes('\\')) return defaut;
  if (propre.length > 300) return defaut;
  return propre;
}

/* ───────────────────────── Vérification de l'id_token ───────────────────────── */

type ClePublique = ReturnType<typeof createPublicKey>;
type CleJwk = { kid?: string; kty?: string } & Record<string, unknown>;
const cacheCles = new Map<string, { cle: ClePublique; expire: number }>();

function decoderSegment(segment: string): unknown {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as unknown;
}

async function clePublique(kid: string): Promise<ClePublique | null> {
  const enCache = cacheCles.get(kid);
  if (enCache && enCache.expire > Date.now()) return enCache.cle;

  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), 5000);
  try {
    const r = await fetch(CERTIFICATS, { signal: controleur.signal });
    if (!r.ok) return null;
    const d = (await r.json()) as { keys?: CleJwk[] };
    const expire = Date.now() + 60 * 60 * 1000;
    for (const jwk of d.keys ?? []) {
      if (!jwk.kid || jwk.kty !== 'RSA') continue;
      try {
        cacheCles.set(jwk.kid, {
          cle: createPublicKey({ key: jwk, format: 'jwk' }),
          expire,
        });
      } catch {
        /* clé illisible : ignorée, jamais devinée */
      }
    }
    return cacheCles.get(kid)?.cle ?? null;
  } catch {
    // Échec réseau : refus (fail closed), jamais de jeton accepté sans preuve.
    return null;
  } finally {
    clearTimeout(minuteur);
  }
}

export type ResultatIdToken =
  | { ok: true; identite: IdentiteGoogle }
  | { ok: false; raison: 'jeton-invalide' | 'jeton-non-verifiable' };

/**
 * Vérifie l'`id_token` OpenID Connect : structure, signature RS256, émetteur,
 * audience, expiration, adresse vérifiée. Toute anomalie est un refus.
 */
export async function verifierIdToken(
  jeton: string,
  clientId: string,
  maintenant = Date.now(),
): Promise<ResultatIdToken> {
  const parties = jeton.split('.');
  if (parties.length !== 3) return { ok: false, raison: 'jeton-invalide' };
  const [enteteB64, chargeB64, signatureB64] = parties;

  let entete: { alg?: string; kid?: string };
  let charge: {
    iss?: string;
    aud?: string | string[];
    exp?: number;
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    given_name?: string;
    name?: string;
  };
  try {
    entete = decoderSegment(enteteB64) as typeof entete;
    charge = decoderSegment(chargeB64) as typeof charge;
  } catch {
    return { ok: false, raison: 'jeton-invalide' };
  }

  if (entete.alg !== 'RS256' || !entete.kid) return { ok: false, raison: 'jeton-invalide' };
  const cle = await clePublique(entete.kid);
  if (!cle) return { ok: false, raison: 'jeton-non-verifiable' };

  const signe = Buffer.from(`${enteteB64}.${chargeB64}`);
  const signature = Buffer.from(signatureB64, 'base64url');
  let valide = false;
  try {
    valide = verifierSignature('RSA-SHA256', signe, cle, signature);
  } catch {
    valide = false;
  }
  if (!valide) return { ok: false, raison: 'jeton-invalide' };

  if (!charge.iss || !EMETTEURS.has(charge.iss)) return { ok: false, raison: 'jeton-invalide' };
  const audiences = Array.isArray(charge.aud) ? charge.aud : [charge.aud];
  if (!audiences.includes(clientId)) return { ok: false, raison: 'jeton-invalide' };
  if (typeof charge.exp !== 'number' || charge.exp * 1000 < maintenant - 60_000) {
    return { ok: false, raison: 'jeton-invalide' };
  }
  if (typeof charge.sub !== 'string' || !charge.sub) return { ok: false, raison: 'jeton-invalide' };
  if (typeof charge.email !== 'string' || !charge.email.includes('@')) {
    return { ok: false, raison: 'jeton-invalide' };
  }
  // Une adresse non vérifiée par Google ne prouve rien : elle n'ouvre pas de
  // compte (sinon n'importe qui revendiquerait l'adresse d'autrui).
  if (charge.email_verified !== true && charge.email_verified !== 'true') {
    return { ok: false, raison: 'jeton-invalide' };
  }

  return {
    ok: true,
    identite: {
      sub: charge.sub,
      email: charge.email.trim().toLowerCase(),
      emailVerifie: true,
      nom: (charge.given_name || charge.name || '').trim().slice(0, 80),
    },
  };
}

/* ─────────────────────────── Échange du code ─────────────────────────── */

export type ResultatEchange =
  | { ok: true; identite: IdentiteGoogle }
  | { ok: false; raison: 'refus' | 'reseau' | 'non-verifiable' };

export async function echangerCode(code: string, config: ConfigGoogle): Promise<ResultatEchange> {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), 8000);
  try {
    const r = await fetch(JETON, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
      signal: controleur.signal,
    });
    if (!r.ok) {
      // Jamais le corps brut dans les journaux : il peut contenir des jetons.
      console.error(`[google] échange refusé (${r.status})`);
      return { ok: false, raison: 'refus' };
    }
    const d = (await r.json()) as { id_token?: unknown };
    if (typeof d.id_token !== 'string') return { ok: false, raison: 'refus' };

    const verif = await verifierIdToken(d.id_token, config.clientId);
    if (!verif.ok) {
      console.error(`[google] id_token refusé — ${verif.raison}`);
      return { ok: false, raison: verif.raison === 'jeton-non-verifiable' ? 'non-verifiable' : 'refus' };
    }
    return { ok: true, identite: verif.identite };
  } catch {
    return { ok: false, raison: 'reseau' };
  } finally {
    clearTimeout(minuteur);
  }
}

/* ─────────────────────── Rapprochement avec un compte ─────────────────────── */

export type ResultatCompte =
  | { ok: true; compte: Compte; cree: boolean }
  | { ok: false; raison: 'conflit' | 'stockage' };

/**
 * Un compte Google devient un compte AURA.
 *
 * - inconnu → création sans mot de passe utilisable (secret aléatoire jamais
 *   divulgué : aucun mot de passe ne peut ouvrir ce compte, seule la
 *   réinitialisation permet d'en définir un) ;
 * - connu par la même adresse → rattachement, l'adresse étant prouvée par
 *   Google ;
 * - connu mais rattaché à un autre identifiant Google → refus.
 */
export async function compteDepuisIdentite(identite: IdentiteGoogle): Promise<ResultatCompte> {
  const comptes = entrepotComptes();
  if (comptes.mode === 'indisponible') return { ok: false, raison: 'stockage' };

  try {
    const existant = await comptes.parEmail(identite.email);
    const maintenant = new Date().toISOString();

    if (existant) {
      if (existant.googleSub && existant.googleSub !== identite.sub) {
        return { ok: false, raison: 'conflit' };
      }
      const maj: Compte = {
        ...existant,
        googleSub: identite.sub,
        emailVerifie: true,
        emailVerifieLe: existant.emailVerifieLe ?? maintenant,
      };
      await comptes.enregistrer(maj);
      return { ok: true, compte: maj, cree: false };
    }

    // Mot de passe technique : 32 octets aléatoires dont le hash seul est
    // conservé. Aucun mot de passe choisi par l'utilisateur n'existe tant
    // qu'il n'en définit pas un via la réinitialisation.
    const secret = randomBytes(32).toString('hex');
    const { hash, sel } = await hacherMotDePasse(secret);
    const compte: Compte = {
      id: nouvelId('usr'),
      email: identite.email,
      nom: identite.nom,
      hash,
      sel,
      cree: maintenant,
      onboarding: { fait: false, objectif: null },
      profil: profilParDefaut(),
      preferences: preferencesParDefaut(),
      emailVerifie: true,
      emailVerifieLe: maintenant,
      googleSub: identite.sub,
      motDePasseDefini: false,
    };
    await comptes.creer(compte);
    return { ok: true, compte, cree: true };
  } catch (e) {
    console.error('[google] stockage injoignable —', e instanceof Error ? e.message : e);
    return { ok: false, raison: 'stockage' };
  }
}

/* ────────────────────────────── Routes ────────────────────────────── */

function rediriger(res: Response, chemin: string) {
  res.setHeader('Cache-Control', 'no-store');
  res.redirect(302, chemin);
}

function poserCookie(res: Response, nom: string, valeur: string, maxAge: number) {
  const anciens = res.getHeader('Set-Cookie');
  const liste = Array.isArray(anciens) ? anciens : anciens ? [String(anciens)] : [];
  res.setHeader('Set-Cookie', [...liste, serialiserCookie(nom, valeur, { maxAge })]);
}

function agentDe(req: Request): string | null {
  const brut = req.headers['user-agent'];
  const valeur = Array.isArray(brut) ? brut[0] : brut;
  return valeur ? valeur.replace(/\s+/g, ' ').trim().slice(0, 160) : null;
}

export function createRoutesGoogle(): express.Router {
  const r = express.Router();

  /** Disponibilité — information publique, aucun secret. */
  r.get('/statut', (_req, res) => {
    res.json({ disponible: googleConfigure() });
  });

  /** Départ : pose l'état anti-CSRF puis redirige vers Google. */
  r.get('/demarrer', limiteParIp(REGLES.googleIp), (req, res) => {
    const etat = configurationGoogle();
    if (!etat.ok) {
      res.status(503).json({ error: etat.raison, code: 'google-indisponible' });
      return;
    }
    const retour = retourInterne((req.query as { retour?: unknown }).retour);
    const nonce = etatAleatoire();
    poserCookie(res, COOKIE_ETAT, nonce, DUREE_ETAT_S);
    poserCookie(res, COOKIE_RETOUR, retour, DUREE_ETAT_S);
    rediriger(res, urlConsentement(nonce, etat.config));
  });

  /** Retour de Google : vérification d'état, échange, session. */
  r.get(
    '/retour',
    asyncRoute(async (req: Request, res: Response) => {
      const query = req.query as { code?: unknown; state?: unknown; error?: unknown };
      const attendu = lireCookie(req, COOKIE_ETAT);
      const retour = retourInterne(lireCookie(req, COOKIE_RETOUR));
      // Le cookie d'état est à usage unique : consommé quoi qu'il arrive.
      poserCookie(res, COOKIE_ETAT, '', 0);
      poserCookie(res, COOKIE_RETOUR, '', 0);

      const etat = configurationGoogle();
      if (!etat.ok) {
        rediriger(res, '/login?google=indisponible');
        return;
      }
      if (typeof query.error === 'string' && query.error) {
        // Refus explicite de l'utilisateur (access_denied) ou erreur Google.
        rediriger(res, '/login?google=refus');
        return;
      }
      const code = typeof query.code === 'string' ? query.code : '';
      const state = typeof query.state === 'string' ? query.state : '';
      if (!code || !state || !attendu || !memeValeur(state, attendu)) {
        rediriger(res, '/login?google=etat');
        return;
      }

      const echange = await echangerCode(code, etat.config);
      if (!echange.ok) {
        rediriger(res, `/login?google=${echange.raison === 'reseau' ? 'reseau' : 'refus'}`);
        return;
      }

      const resultat = await compteDepuisIdentite(echange.identite);
      if (!resultat.ok) {
        rediriger(res, `/login?google=${resultat.raison}`);
        return;
      }

      const { jeton, session } = creerSession(agentDe(req));
      session.userId = resultat.compte.id;
      try {
        await entrepotComptes().creerSession(session);
      } catch (e) {
        console.error('[google] session non enregistrée —', e instanceof Error ? e.message : e);
        rediriger(res, '/login?google=stockage');
        return;
      }

      poserCookie(res, nomCookieSession(), jeton, Math.floor(DUREE_SESSION_MS / 1000));
      rediriger(res, retour);
    }),
  );

  return r;
}
