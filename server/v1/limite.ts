/**
 * Limitation de débit des points sensibles (connexion, inscription, chat,
 * suppression de compte).
 *
 * Principe : le compteur vit dans le stockage partagé (Vercel KV en
 * production), donc il survit aux démarrages à froid et se partage entre
 * instances serverless. Le compteur mémoire n'est qu'un filet de sécurité
 * local lorsque le stockage est injoignable — jamais la protection unique.
 *
 * Règles de sûreté :
 * - Aucune confiance aveugle dans les en-têtes IP : on lit l'adresse
 *   effectivement résolue par Express derrière le proxy, et à défaut
 *   l'entrée la plus à droite de `x-forwarded-for` (celle ajoutée par le
 *   proxy de la plateforme, pas celle qu'un client aurait pu forger).
 * - Une clé de limitation n'est jamais partagée entre deux portées :
 *   un compteur saturé sur une route ne doit pas fermer les autres.
 * - Si le stockage tombe, on continue de répondre : la disponibilité
 *   prime, et la limitation retombe sur la mémoire du processus.
 */
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import type { BaseDeDonnees } from '../db/base';
import { CLE } from '../db/base';

export type Verdict = {
  /** true si la tentative est refusée. */
  bloque: boolean;
  /** Tentatives encore autorisées dans la fenêtre courante. */
  restant: number;
  /** Origine du comptage — utile aux tests et aux diagnostics. */
  source: 'partage' | 'local';
};

const EXPIRE_LOCAL_MS = 15 * 60 * 1000;

/** Filet de sécurité : compteurs du processus, purgés à l'usage. */
const local = new Map<string, { n: number; exp: number }>();

function compterLocal(cle: string, fenetreMs: number): number {
  const maintenant = Date.now();
  if (local.size > 5_000) {
    for (const [k, v] of local) if (v.exp <= maintenant) local.delete(k);
  }
  const actuel = local.get(cle);
  if (!actuel || actuel.exp <= maintenant) {
    local.set(cle, { n: 1, exp: maintenant + Math.min(fenetreMs, EXPIRE_LOCAL_MS) });
    return 1;
  }
  actuel.n += 1;
  return actuel.n;
}

/** Remise à zéro — réservée aux tests. */
export function reinitialiserLimitesLocales(): void {
  local.clear();
}

/**
 * Incrémente le compteur d'une clé et dit si la tentative est autorisée.
 * Ne lève jamais : une panne de stockage ne doit pas casser la route.
 */
export async function compterTentative(
  base: BaseDeDonnees | null,
  cle: string,
  max: number,
  fenetreMs: number,
): Promise<Verdict> {
  if (base && base.mode !== 'indisponible') {
    try {
      const n = await base.incr(CLE.limite(cle), Math.ceil(fenetreMs / 1000));
      return { bloque: n > max, restant: Math.max(0, max - n), source: 'partage' };
    } catch (e) {
      // Stockage injoignable : on ne bloque personne à cause d'une panne.
      console.error(
        '[api] limitation : stockage partagé indisponible, repli local —',
        e instanceof Error ? e.message : e,
      );
    }
  }
  const n = compterLocal(cle, fenetreMs);
  return { bloque: n > max, restant: Math.max(0, max - n), source: 'local' };
}

/* ── Identité des compteurs ── */

const IP_VALIDE = /^[0-9a-fA-F.:]{3,45}$/;

function normaliserIp(brut: string | undefined | null): string | null {
  if (!brut) return null;
  let valeur = brut.trim();
  if (!valeur) return null;
  // « 1.2.3.4:5678 » (IPv4 avec port) → « 1.2.3.4 ».
  const v4port = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(valeur);
  if (v4port) valeur = v4port[1];
  // « ::ffff:1.2.3.4 » (IPv4 mappée) → « 1.2.3.4 ».
  if (valeur.toLowerCase().startsWith('::ffff:')) valeur = valeur.slice(7);
  return IP_VALIDE.test(valeur) ? valeur.toLowerCase() : null;
}

/**
 * Adresse du client, sans jamais faire confiance à un en-tête forgé.
 *
 * 1. `req.ip` : résolu par Express. Avec `trust proxy` réglé sur le nombre
 *    exact de proxys de la plateforme, il désigne le client et ignore ce que
 *    le navigateur aurait pu ajouter en tête de `x-forwarded-for`.
 * 2. À défaut (fonction serverless appelée sans application Express),
 *    l'entrée la plus à droite de `x-forwarded-for` : c'est celle que le
 *    proxy de la plateforme ajoute lui-même, donc non forgeable.
 * 3. Sinon « inconnu », regroupé à part.
 */
export function ipClient(requete: Request): string {
  // `req.ip` peut lever si la requête n'est pas passée par une application
  // Express (fonction serverless appelée « nue ») : on ne suppose rien.
  let direct: unknown = null;
  try {
    direct = requete.ip;
  } catch {
    direct = null;
  }
  const directe = normaliserIp(typeof direct === 'string' ? direct : null);
  if (directe) return directe;

  const entete = requete.headers['x-forwarded-for'];
  const brut = Array.isArray(entete) ? entete.join(',') : (entete ?? '');
  const morceaux = brut
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  for (let i = morceaux.length - 1; i >= 0; i--) {
    const ip = normaliserIp(morceaux[i]);
    if (ip) return ip;
  }
  return 'inconnu';
}

/**
 * Empreinte courte d'un identifiant sensible (adresse e-mail) : le
 * compteur ne doit pas constituer un index d'adresses en base.
 */
export function empreinteIdentifiant(valeur: string): string {
  return createHash('sha256').update(valeur.trim().toLowerCase()).digest('hex').slice(0, 24);
}
