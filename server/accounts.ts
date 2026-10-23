/**
 * Moteur de comptes Aura — authentification réelle, honnête.
 *
 * - Mots de passe : scrypt (node:crypto), sel par utilisateur, comparaison à temps constant.
 * - Sessions : jeton aléatoire opaque stocké côté serveur (jamais de JWT maison).
 * - Stockage : fichier JSON (dev / auto-hébergement) ou Vercel KV (Upstash REST)
 *   si les variables d'environnement sont présentes. Sans stockage configurable,
 *   le service déclare clairement qu'il est indisponible — jamais de faux compte.
 */
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type Onboarding = { fait: boolean; objectif: string | null };

export type Utilisateur = {
  id: string;
  email: string;
  nom: string;
  hash: string;
  sel: string;
  cree: string;
  onboarding: Onboarding;
};

export type Session = {
  id: string; // empreinte sha256 du jeton
  userId: string;
  expire: number;
  cree: string;
};

export type Donnees = { utilisateurs: Utilisateur[]; sessions: Session[] };

export type ComptePublic = {
  email: string;
  nom: string;
  cree: string;
  onboarding: Onboarding;
};

export function versPublic(u: Utilisateur): ComptePublic {
  return { email: u.email, nom: u.nom, cree: u.cree, onboarding: u.onboarding };
}

/* ───────────────────────── Stockage ───────────────────────── */

export interface Magasin {
  readonly mode: 'fichier' | 'kv' | 'indisponible';
  readonly raison?: string;
  lire(): Promise<Donnees>;
  ecrire(d: Donnees): Promise<void>;
}

const VIDE: Donnees = { utilisateurs: [], sessions: [] };

class MagasinFichier implements Magasin {
  readonly mode = 'fichier' as const;
  private readonly fichier: string;

  constructor(dossier: string) {
    this.fichier = path.join(dossier, 'comptes.json');
  }

  async lire(): Promise<Donnees> {
    try {
      const brut = await fs.readFile(this.fichier, 'utf8');
      const d = JSON.parse(brut) as Partial<Donnees>;
      return {
        utilisateurs: Array.isArray(d.utilisateurs) ? d.utilisateurs : [],
        sessions: Array.isArray(d.sessions) ? d.sessions : [],
      };
    } catch {
      return { ...VIDE, utilisateurs: [], sessions: [] };
    }
  }

  async ecrire(d: Donnees): Promise<void> {
    await fs.mkdir(path.dirname(this.fichier), { recursive: true });
    const tmp = this.fichier + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(d, null, 2), 'utf8');
    await fs.rename(tmp, this.fichier);
  }
}

class MagasinKV implements Magasin {
  readonly mode = 'kv' as const;
  private static readonly CLE = 'aura:comptes';

  constructor(
    private readonly url: string,
    private readonly jeton: string,
  ) {}

  private async appel(commande: unknown[]): Promise<unknown> {
    const r = await fetch(this.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.jeton}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commande),
    });
    if (!r.ok) throw new Error(`Stockage KV indisponible (${r.status}).`);
    const j = (await r.json()) as { result: unknown };
    return j.result;
  }

  async lire(): Promise<Donnees> {
    const brut = (await this.appel(['GET', MagasinKV.CLE])) as string | null;
    if (!brut) return { utilisateurs: [], sessions: [] };
    const d = JSON.parse(brut) as Partial<Donnees>;
    return {
      utilisateurs: Array.isArray(d.utilisateurs) ? d.utilisateurs : [],
      sessions: Array.isArray(d.sessions) ? d.sessions : [],
    };
  }

  async ecrire(d: Donnees): Promise<void> {
    await this.appel(['SET', MagasinKV.CLE, JSON.stringify(d)]);
  }
}

class MagasinIndisponible implements Magasin {
  readonly mode = 'indisponible' as const;
  constructor(readonly raison: string) {}
  async lire(): Promise<Donnees> {
    return { utilisateurs: [], sessions: [] };
  }
  async ecrire(): Promise<void> {
    /* jamais appelé : les routes refusent avant d'écrire */
  }
}

export function choisirMagasin(): Magasin {
  const kvUrl = process.env.KV_REST_API_URL || process.env.AURA_KV_URL;
  const kvJeton = process.env.KV_REST_API_TOKEN || process.env.AURA_KV_TOKEN;
  if (kvUrl && kvJeton) return new MagasinKV(kvUrl, kvJeton);
  if (process.env.AURA_DATA_DIR) return new MagasinFichier(process.env.AURA_DATA_DIR);
  // Sur Vercel le disque est éphémère : des comptes « persistés » mentiraient.
  if (!process.env.VERCEL) return new MagasinFichier(path.join(process.cwd(), 'data'));
  return new MagasinIndisponible(
    "Stockage des comptes non configuré sur cet environnement. Ajoutez Vercel KV (KV_REST_API_URL / KV_REST_API_TOKEN) ou AURA_DATA_DIR pour l'activer.",
  );
}

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

export function creerSession(): { jeton: string; session: Session } {
  const jeton = randomBytes(32).toString('base64url');
  const session: Session = {
    id: createHash('sha256').update(jeton).digest('hex'),
    userId: '',
    expire: Date.now() + DUREE_SESSION_MS,
    cree: new Date().toISOString(),
  };
  return { jeton, session };
}

export function empreinteJeton(jeton: string): string {
  return createHash('sha256').update(jeton).digest('hex');
}

/* ───────────────────────── Cookies ───────────────────────── */

export const COOKIE_SESSION = 'aura_session';

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
