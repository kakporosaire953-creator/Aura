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
  /** Écrit avec expiration — utilisé pour les jetons à usage unique. */
  ecrireTtl<T>(cle: string, valeur: T, ttlSecondes: number): Promise<void>;
  /**
   * Réservation atomique (`SET … NX EX`). Renvoie true si la clé vient
   * d'être créée, false si elle existait déjà. C'est le verrou qui rend
   * un jeton réellement à usage unique, même sous requêtes concurrentes.
   */
  reserver(cle: string, ttlSecondes: number): Promise<boolean>;
  supprimer(cle: string): Promise<void>;
  lister(prefixe: string): Promise<string[]>;
  /**
   * Incrément atomique d'un compteur à fenêtre glissante fixe.
   * Renvoie la valeur après incrément. Le premier incrément pose
   * l'expiration (`ttlSecondes`), les suivants la laissent intacte :
   * une clé expirée repart donc naturellement à zéro.
   */
  incr(cle: string, ttlSecondes: number): Promise<number>;
}

/* ── Clés normalisées ── */

export const CLE = {
  compte: (userId: string) => `aurav1:compte:${userId}`,
  compteParEmail: (email: string) => `aurav1:email:${email.toLowerCase()}`,
  session: (empreinte: string) => `aurav1:session:${empreinte}`,
  donnees: (userId: string) => `aurav1:data:${userId}`,
  // Compteurs de limitation de débit (fenêtre fixe, TTL gérée par le pilote).
  limite: (portee: string) => `aurav1:rl:${portee}`,
  // Jetons à usage unique — la clé est l'empreinte, jamais le jeton brut.
  jeton: (empreinte: string) => `aurav1:jeton:${empreinte}`,
  jetonActif: (userId: string, type: string) => `aurav1:jeton-actif:${userId}:${type}`,
  jetonVerrou: (empreinte: string) => `aurav1:jeton-verrou:${empreinte}`,
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
    const expiration = this.expirations.get(cle);
    if (expiration !== undefined) {
      if (expiration <= Date.now()) {
        this.expirations.delete(cle);
        const mm = await this.charger();
        if (mm.delete(cle)) await this.persister();
        return null;
      }
    }
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

  async ecrireTtl<T>(cle: string, valeur: T, ttlSecondes: number): Promise<void> {
    const exp = Date.now() + Math.max(1, Math.ceil(ttlSecondes)) * 1000;
    this.expirations.set(cle, exp);
    await this.ecrire(cle, valeur);
  }

  async reserver(cle: string, ttlSecondes: number): Promise<boolean> {
    const maintenant = Date.now();
    const exp = this.expirations.get(cle);
    if (exp !== undefined && exp > maintenant) return false;
    this.expirations.set(cle, maintenant + Math.max(1, Math.ceil(ttlSecondes)) * 1000);
    await this.ecrire(cle, 1);
    return true;
  }

  /** Expirations logiques du pilote fichier (le fichier reste un simple JSON). */
  private readonly expirations = new Map<string, number>();

  async supprimer(cle: string): Promise<void> {
    this.expirations.delete(cle);
    const m = await this.charger();
    if (m.delete(cle)) await this.persister();
  }

  async lister(prefixe: string): Promise<string[]> {
    const m = await this.charger();
    return [...m.keys()].filter((k) => k.startsWith(prefixe)).sort();
  }

  /**
   * Compteurs en mémoire du processus. Ce pilote sert en développement et
   * en auto-hébergement mono-processus : un compteur partagé en base
   * n'apporterait rien et alourdirait chaque tentative de connexion.
   * Le pilote KV, lui, compte de façon distribuée (voir plus bas).
   */
  private readonly compteurs = new Map<string, { n: number; exp: number }>();

  async incr(cle: string, ttlSecondes: number): Promise<number> {
    const maintenant = Date.now();
    const actuel = this.compteurs.get(cle);
    if (!actuel || actuel.exp <= maintenant) {
      this.compteurs.set(cle, { n: 1, exp: maintenant + ttlSecondes * 1000 });
      return 1;
    }
    actuel.n += 1;
    return actuel.n;
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
    let r: Response;
    try {
      r = await fetch(this.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.jeton}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commande),
      });
    } catch {
      // Réseau coupé, DNS, délai dépassé : même famille d'erreur qu'un 5xx.
      throw new Error('Stockage KV indisponible (réseau).');
    }
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

  async ecrireTtl<T>(cle: string, valeur: T, ttlSecondes: number): Promise<void> {
    await this.appel(['SET', cle, JSON.stringify(valeur), 'EX', String(Math.max(1, Math.ceil(ttlSecondes)))]);
  }

  async reserver(cle: string, ttlSecondes: number): Promise<boolean> {
    const r = await this.appel([
      'SET',
      cle,
      '1',
      'NX',
      'EX',
      String(Math.max(1, Math.ceil(ttlSecondes))),
    ]);
    return r === 'OK';
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

  /**
   * Incrément atomique **avec son expiration**, dans un seul aller-retour.
   *
   * Le pipeline envoie `INCR` puis `EXPIRE … NX` : les deux commandes sont
   * exécutées l'une après l'autre par Redis, sans qu'une autre commande
   * puisse s'intercaler. Une coupure réseau ou un arrêt de l'instance ne
   * peut donc pas laisser derrière elle un compteur sans expiration —
   * c'est-à-dire un blocage définitif pour cette clé. `NX` garantit de son
   * côté qu'une fenêtre en cours n'est jamais rallongée par un incrément
   * tardif.
   *
   * Repli si le point d'entrée `/pipeline` n'est pas disponible (autre
   * hébergeur Redis parlant la même API) : `INCR`, puis `TTL` ; l'expiration
   * n'est posée que si la clé n'en a pas (`-1`). Trois allers-retours, mais
   * la garantie « jamais de compteur immortel » est conservée.
   */
  async incr(cle: string, ttlSecondes: number): Promise<number> {
    const ttl = String(Math.max(1, Math.ceil(ttlSecondes)));

    try {
      const reponse = await this.pipeline([
        ['INCR', cle],
        ['EXPIRE', cle, ttl, 'NX'],
      ]);
      const n = Number(reponse[0]);
      if (!Number.isFinite(n)) throw new Error('Stockage KV : réponse INCR illisible.');
      return n;
    } catch (e) {
      if (e instanceof Error && /réponse INCR illisible/.test(e.message)) throw e;
      console.error(
        '[db] pipeline KV indisponible, repli INCR + TTL —',
        e instanceof Error ? e.message : e,
      );
    }

    const n = Number(await this.appel(['INCR', cle]));
    if (!Number.isFinite(n)) throw new Error('Stockage KV : réponse INCR illisible.');
    const restant = Number(await this.appel(['TTL', cle]));
    if (restant === -1) await this.appel(['EXPIRE', cle, ttl]);
    return n;
  }

  /** Pipeline REST : plusieurs commandes, un seul aller-retour, ordre garanti. */
  private async pipeline(commandes: unknown[][]): Promise<unknown[]> {
    const url = `${this.url.replace(/\/+$/, '')}/pipeline`;
    let r: Response;
    try {
      r = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.jeton}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commandes),
      });
    } catch {
      throw new Error('Stockage KV indisponible (réseau).');
    }
    if (!r.ok) throw new Error(`Stockage KV indisponible (${r.status}).`);
    const j = (await r.json()) as unknown;
    if (!Array.isArray(j)) throw new Error('Stockage KV : pipeline illisible.');
    // Chaque entrée est soit un résultat, soit { error }.
    return j.map((entree, i) => {
      if (entree && typeof entree === 'object' && 'error' in (entree as object)) {
        throw new Error(`Stockage KV : commande ${i + 1} refusée.`);
      }
      if (entree && typeof entree === 'object' && 'result' in (entree as object)) {
        return (entree as { result: unknown }).result;
      }
      return entree;
    });
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
  async ecrireTtl(): Promise<void> {
    throw new Error(this.raison);
  }
  async reserver(): Promise<boolean> {
    throw new Error(this.raison);
  }
  async supprimer(): Promise<void> {
    /* rien à supprimer */
  }
  async lister(): Promise<string[]> {
    return [];
  }
  async incr(): Promise<number> {
    throw new Error(this.raison);
  }
}

/**
 * Fabrique explicite du pilote KV — utilisée par les tests pour viser un
 * serveur Redis REST local. `choisirBase()` reste le seul point d'entrée
 * de l'application.
 */
export function creerPiloteKV(url: string, jeton: string): BaseDeDonnees {
  return new PiloteKV(url, jeton);
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
