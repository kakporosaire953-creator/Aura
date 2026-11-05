/**
 * Base de données AURA — interface minimale clé/valeur + pilotes.
 *
 * - Pilote `kv` : Vercel KV / Upstash REST (production).
 * - Pilote `fichier` : JSON atomique (dev / auto-hébergement).
 * - Pilote `indisponible` : refus honnête, jamais de faux stockage.
 *
 * Le modèle logique (server/db/types.ts) est relationnel ; sa projection
 * physique est un agrégat JSON par utilisateur + index globaux d'auth,
 * ce qui garantit l'isolation des comptes et un nombre d'appels KV réduit.
 * Un futur pilote SQL peut implémenter la même interface.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface BaseDeDonnees {
  readonly mode: 'fichier' | 'kv' | 'indisponible';
  readonly raison?: string;
  lire<T>(cle: string): Promise<T | null>;
  ecrire<T>(cle: string, valeur: T): Promise<void>;
  supprimer(cle: string): Promise<void>;
  lister(prefixe: string): Promise<string[]>;
}

/* ── Clés normalisées ── */

export const CLE = {
  compte: (userId: string) => `aurav1:compte:${userId}`,
  compteParEmail: (email: string) => `aurav1:email:${email.toLowerCase()}`,
  session: (empreinte: string) => `aurav1:session:${empreinte}`,
  donnees: (userId: string) => `aurav1:data:${userId}`,
  // Ancien dépôt (comptes.json / aura:comptes) — lu pour migration.
  ancienKv: 'aura:comptes',
} as const;

/* ── Pilote fichier JSON (dev / auto-hébergement) ── */

class PiloteFichier implements BaseDeDonnees {
  readonly mode = 'fichier' as const;
  private readonly fichier: string;
  private cache: Map<string, string> | null = null;
  private ecritureEnCours: Promise<void> = Promise.resolve();

  constructor(dossier: string) {
    this.fichier = path.join(dossier, 'auradb.json');
  }

  private async charger(): Promise<Map<string, string>> {
    if (this.cache) return this.cache;
    try {
      const brut = await fs.readFile(this.fichier, 'utf8');
      const objet = JSON.parse(brut) as Record<string, unknown>;
      this.cache = new Map(
        Object.entries(objet).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]),
      );
    } catch {
      this.cache = new Map();
    }
    return this.cache;
  }

  /** Écriture atomique sérialisée (tmp + rename) — jamais de fichier à moitié écrit. */
  private persister(): Promise<void> {
    this.ecritureEnCours = this.ecritureEnCours.then(async () => {
      const m = this.cache ?? new Map();
      await fs.mkdir(path.dirname(this.fichier), { recursive: true });
      const tmp = this.fichier + '.tmp';
      await fs.writeFile(tmp, JSON.stringify(Object.fromEntries(m), null, 2), 'utf8');
      await fs.rename(tmp, this.fichier);
    });
    return this.ecritureEnCours;
  }

  async lire<T>(cle: string): Promise<T | null> {
    const m = await this.charger();
    const brut = m.get(cle);
    if (brut === undefined) return null;
    try {
      return JSON.parse(brut) as T;
    } catch {
      return null;
    }
  }

  async ecrire<T>(cle: string, valeur: T): Promise<void> {
    const m = await this.charger();
    m.set(cle, JSON.stringify(valeur));
    await this.persister();
  }

  async supprimer(cle: string): Promise<void> {
    const m = await this.charger();
    if (m.delete(cle)) await this.persister();
  }

  async lister(prefixe: string): Promise<string[]> {
    const m = await this.charger();
    return [...m.keys()].filter((k) => k.startsWith(prefixe)).sort();
  }
}

/* ── Pilote KV REST (Vercel KV / Upstash) ── */

class PiloteKV implements BaseDeDonnees {
  readonly mode = 'kv' as const;

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

  async lire<T>(cle: string): Promise<T | null> {
    const brut = (await this.appel(['GET', cle])) as string | null;
    if (!brut) return null;
    try {
      return JSON.parse(brut) as T;
    } catch {
      return null;
    }
  }

  async ecrire<T>(cle: string, valeur: T): Promise<void> {
    await this.appel(['SET', cle, JSON.stringify(valeur)]);
  }

  async supprimer(cle: string): Promise<void> {
    await this.appel(['DEL', cle]);
  }

  async lister(prefixe: string): Promise<string[]> {
    // SCAN cursor MATCH prefix* COUNT 200 — pagination jusqu'à épuisement.
    const cles: string[] = [];
    let curseur = '0';
    for (let tour = 0; tour < 50; tour++) {
      const res = (await this.appel(['SCAN', curseur, 'MATCH', prefixe + '*', 'COUNT', '200'])) as [
        string,
        string[],
      ];
      curseur = res[0];
      cles.push(...res[1]);
      if (curseur === '0') break;
    }
    return cles.sort();
  }
}

/* ── Pilote indisponible ── */

class PiloteIndisponible implements BaseDeDonnees {
  readonly mode = 'indisponible' as const;
  constructor(readonly raison: string) {}
  async lire<T>(): Promise<T | null> {
    return null;
  }
  async ecrire(): Promise<void> {
    throw new Error(this.raison);
  }
  async supprimer(): Promise<void> {
    /* rien à supprimer */
  }
  async lister(): Promise<string[]> {
    return [];
  }
}

export function choisirBase(): BaseDeDonnees {
  const kvUrl = process.env.KV_REST_API_URL || process.env.AURA_KV_URL;
  const kvJeton = process.env.KV_REST_API_TOKEN || process.env.AURA_KV_TOKEN;
  if (kvUrl && kvJeton) return new PiloteKV(kvUrl, kvJeton);
  if (process.env.AURA_DATA_DIR) return new PiloteFichier(process.env.AURA_DATA_DIR);
  // Sur Vercel, le disque est éphémère : mentirait sur la persistance.
  if (!process.env.VERCEL) return new PiloteFichier(path.join(process.cwd(), 'data'));
  return new PiloteIndisponible(
    "Stockage non configuré sur cet environnement. Ajoutez Vercel KV (KV_REST_API_URL / KV_REST_API_TOKEN) ou AURA_DATA_DIR.",
  );
}

/* ── Lecture-modification-écriture (optimiste, suffisant ici) ── */

export async function modifier<T>(base: BaseDeDonnees, cle: string, defaut: T, fn: (t: T) => T | Promise<T>): Promise<T> {
  const actuel = (await base.lire<T>(cle)) ?? defaut;
  const suivant = await fn(actuel);
  await base.ecrire(cle, suivant);
  return suivant;
}
