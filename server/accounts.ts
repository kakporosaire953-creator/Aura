/**
 * Authentification Aura — crypto, sessions, cookies, validation.
 *
 * - Mots de passe : scrypt (node:crypto), sel par utilisateur, comparaison
 *   à temps constant. Aucun secret n'est stocké ailleurs que dans le hash.
 * - Sessions : jeton aléatoire opaque, empreinte sha256 stockée côté serveur
 *   (jamais de JWT maison). Le jeton voyage uniquement dans un cookie
 *   HttpOnly SameSite=Lax (Secure en production).
 *
 * La persistance des comptes vit dans server/db/ (entrepotComptes) ;
 * les anciens dépôts sont migrés automatiquement à la première lecture.
 */
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import type { Session } from './db/types';

export type { Session };

/* ───────────────────────── Mots de passe & sessions ───────────────────────── */

function scrypt(motDePasse: string, sel: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(motDePasse, sel, 64, (err, buf) => (err ? reject(err) : resolve(buf)));
  });
}

export async function hacherMotDePasse(motDePasse: string): Promise<{ hash: string; sel: string }> {
  const sel = randomBytes(16).toString('hex');
  const hash = (await scrypt(motDePasse, sel)).toString('hex');
  return { hash, sel };
}

export async function verifierMotDePasse(
  motDePasse: string,
  hash: string,
  sel: string,
): Promise<boolean> {
  const calcule = await scrypt(motDePasse, sel);
  const attendu = Buffer.from(hash, 'hex');
  return calcule.length === attendu.length && timingSafeEqual(calcule, attendu);
}

export const DUREE_SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export function creerSession(agent?: string | null): { jeton: string; session: Session } {
  const jeton = randomBytes(32).toString('base64url');
  const maintenant = Date.now();
  const normalise = (agent ?? '').replace(/\s+/g, ' ').trim().slice(0, 160);
  const session: Session = {
    id: createHash('sha256').update(jeton).digest('hex'),
    userId: '',
    expire: maintenant + DUREE_SESSION_MS,
    cree: new Date(maintenant).toISOString(),
    derniereActivite: maintenant,
    ...(normalise ? { agent: normalise } : {}),
  };
  return { jeton, session };
}

export function empreinteJeton(jeton: string): string {
  return createHash('sha256').update(jeton).digest('hex');
}

/** Empreinte d'une valeur quelconque (adresse e-mail liée à un jeton). */
export function empreinteValeur(valeur: string): string {
  return createHash('sha256').update(valeur.trim().toLowerCase()).digest('hex');
}

/* ─────────────── Jetons à usage unique : durées et génération ─────────────── */

function dureeEnv(nom: string, defaut: number, min: number, max: number): number {
  const brut = Number(process.env[nom]);
  if (!Number.isFinite(brut)) return defaut;
  return Math.min(max, Math.max(min, Math.floor(brut)));
}

/**
 * Durées de vie des jetons — centralisées ici, réglables par variable
 * d'environnement dans des bornes sûres (jamais 0, jamais « infinie »).
 */
export const DUREE_JETON_VERIFICATION_MS =
  dureeEnv('AURA_JETON_VERIFICATION_HEURES', 24, 1, 168) * 60 * 60 * 1000;

export const DUREE_JETON_REINITIALISATION_MS =
  dureeEnv('AURA_JETON_REINITIALISATION_MINUTES', 30, 5, 120) * 60 * 1000;

/**
 * Jeton opaque de 32 octets d'entropie. Seule son empreinte SHA-256 sera
 * stockée ; la valeur brute ne quitte le serveur que dans l'e-mail.
 */
export function creerJeton(): { jeton: string; id: string } {
  const jeton = randomBytes(32).toString('base64url');
  return { jeton, id: empreinteJeton(jeton) };
}

/* ───────────────────────── Cookies ───────────────────────── */

export const COOKIE_SESSION = 'aura_session';

/**
 * Nom préfixé `__Host-` : le navigateur n'accepte ce cookie que s'il est
 * `Secure`, posé sur `Path=/` et sans attribut `Domain`. C'est une garantie
 * supplémentaire contre l'écrasement par un sous-domaine.
 * Utilisé uniquement en production (HTTPS) ; en développement et en
 * auto-hébergement, le nom simple reste en vigueur.
 */
export const COOKIE_SESSION_SECURISE = '__Host-aura_session';

/** Nom du cookie à poser, selon l'environnement réel. */
export function nomCookieSession(): string {
  return process.env.NODE_ENV === 'production' ? COOKIE_SESSION_SECURISE : COOKIE_SESSION;
}

/**
 * Jeton de session lu dans les deux noms : les sessions ouvertes avant le
 * passage au préfixe `__Host-` restent valides (aucun utilisateur déconnecté
 * par un renommage de cookie).
 */
export function lireJetonSession(requete: { headers: { cookie?: string } }): string | null {
  const prefere = lireCookie(requete, nomCookieSession());
  if (prefere) return prefere;
  return lireCookie(requete, COOKIE_SESSION);
}

export function lireCookie(requete: { headers: { cookie?: string } }, nom: string): string | null {
  const entete = requete.headers.cookie;
  if (!entete) return null;
  for (const partie of entete.split(';')) {
    const [k, ...v] = partie.trim().split('=');
    if (k === nom) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function serialiserCookie(
  nom: string,
  valeur: string,
  options: { maxAge?: number } = {},
): string {
  const morceaux = [
    `${nom}=${encodeURIComponent(valeur)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (process.env.NODE_ENV === 'production') morceaux.push('Secure');
  if (options.maxAge !== undefined) morceaux.push(`Max-Age=${options.maxAge}`);
  return morceaux.join('; ');
}

/* ───────────────────────── Validation ───────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Validation de syntaxe uniquement — ne dit jamais si l'adresse a un compte. */
export function emailValide(email: string): boolean {
  return EMAIL_RE.test((email ?? '').trim().toLowerCase());
}

export type Saisie = { email: string; password: string; nom?: string };

export function validerInscription(s: Partial<Saisie>): {
  ok: boolean;
  champs: Record<string, string>;
} {
  const champs: Record<string, string> = {};
  const email = (s.email ?? '').trim().toLowerCase();
  const password = s.password ?? '';
  const nom = (s.nom ?? '').trim();
  if (!EMAIL_RE.test(email)) champs.email = 'invalide';
  if (password.length < 8) champs.password = 'court';
  if (password.length > 200) champs.password = 'long';
  if (nom.length > 80) champs.nom = 'long';
  return { ok: Object.keys(champs).length === 0, champs };
}
