/**
 * Limitation de débit sur le pilote KV réel (mission 07, condition d'atomicité).
 *
 * Un faux serveur Redis REST, en mémoire, remplace Vercel KV : le vrai
 * `PiloteKV` est exercé, sans réseau externe, sans secret, sans compte.
 * Ce que ces tests prouvent :
 * - l'incrément et l'expiration partent dans le même aller-retour `/pipeline` ;
 * - une clé sans expiration est réparée au premier incrément (jamais de
 *   compteur immortel après une interruption) ;
 * - une fenêtre en cours n'est jamais rallongée (`EXPIRE … NX`) ;
 * - si `/pipeline` n'existe pas, le repli `INCR` + `TTL` + `EXPIRE` conserve
 *   la garantie.
 *   node --import tsx --test tests/limite-kv.test.ts
 */
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';

const { creerPiloteKV } = await import('../server/db/base');
const { compterTentative, reinitialiserLimitesLocales } = await import('../server/v1/limite');

type Entree = { valeur: string | number; exp: number | null };

const magasin = new Map<string, Entree>();
const journal: unknown[][] = [];
let pipelineEnPanne = false;

function vivant(cle: string): Entree | null {
  const e = magasin.get(cle);
  if (!e) return null;
  if (e.exp !== null && e.exp <= Date.now()) {
    magasin.delete(cle);
    return null;
  }
  return e;
}

/** Sous-ensemble Redis suffisant pour le pilote et le limiteur. */
function commande(cmd: unknown[]): unknown {
  const nom = String(cmd[0]).toUpperCase();
  const cle = String(cmd[1] ?? '');
  switch (nom) {
    case 'PING':
      return 'PONG';
    case 'GET': {
      const e = vivant(cle);
      return e ? String(e.valeur) : null;
    }
    case 'SET': {
      const existant = vivant(cle);
      const nx = cmd.some((c) => String(c).toUpperCase() === 'NX');
      if (nx && existant) return null;
      magasin.set(cle, { valeur: String(cmd[2]), exp: null });
      return 'OK';
    }
    case 'DEL': {
      const avait = vivant(cle) !== null;
      magasin.delete(cle);
      return avait ? 1 : 0;
    }
    case 'INCR': {
      const e = vivant(cle);
      const suivant = Number(e?.valeur ?? 0) + 1;
      magasin.set(cle, { valeur: suivant, exp: e?.exp ?? null });
      return suivant;
    }
    case 'EXPIRE': {
      const e = vivant(cle);
      if (!e) return 0;
      const nx = cmd.some((c) => String(c).toUpperCase() === 'NX');
      if (nx && e.exp !== null) return 0;
      e.exp = Date.now() + Number(cmd[2]) * 1000;
      return 1;
    }
    case 'TTL': {
      const e = vivant(cle);
      if (!e) return -2;
      if (e.exp === null) return -1;
      return Math.max(0, Math.round((e.exp - Date.now()) / 1000));
    }
    case 'SCAN': {
      const motif = String(cmd[cmd.indexOf('MATCH') + 1] ?? '*');
      const prefixe = motif.replace(/\*$/, '');
      return ['0', [...magasin.keys()].filter((k) => k.startsWith(prefixe))];
    }
    default:
      throw new Error(`commande non gérée : ${nom}`);
  }
}

const serveur: Server = createServer((req, res) => {
  let corps = '';
  req.on('data', (c) => (corps += c));
  req.on('end', () => {
    const chemin = (req.url ?? '/').split('?')[0];
    let charge: unknown;
    try {
      charge = JSON.parse(corps || '[]');
    } catch {
      res.writeHead(400).end(JSON.stringify({ error: 'json' }));
      return;
    }
    if (chemin === '/pipeline') {
      journal.push(charge as unknown[]);
      if (pipelineEnPanne) {
        res.writeHead(500).end(JSON.stringify({ error: 'pipeline indisponible' }));
        return;
      }
      const resultats = (charge as unknown[][]).map((c) => ({ result: commande(c) }));
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(resultats));
      return;
    }
    journal.push(charge as unknown[]);
    try {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(
        JSON.stringify({ result: commande(charge as unknown[]) }),
      );
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' }).end(
        JSON.stringify({ error: e instanceof Error ? e.message : 'refus' }),
      );
    }
  });
});

let base = '';

before(async () => {
  await new Promise<void>((resolve) => serveur.listen(0, '127.0.0.1', resolve));
  const adresse = serveur.address() as { port: number };
  base = `http://127.0.0.1:${adresse.port}`;
});

after(async () => {
  await new Promise<void>((resolve) => serveur.close(() => resolve()));
});

beforeEach(() => {
  magasin.clear();
  journal.length = 0;
  pipelineEnPanne = false;
  reinitialiserLimitesLocales();
});

describe('Pilote KV — incrément et expiration', () => {
  test('INCR et EXPIRE partent dans le même pipeline', async () => {
    const pilote = creerPiloteKV(base, 'jeton');
    const n = await pilote.incr('aurav1:rl:test:pipeline', 60);
    assert.equal(n, 1);

    assert.equal(journal.length, 1, 'une seule requête pour l’incrément et son expiration');
    const commandes = journal[0] as unknown[][];
    assert.deepEqual(commandes[0], ['INCR', 'aurav1:rl:test:pipeline']);
    assert.deepEqual(commandes[1], ['EXPIRE', 'aurav1:rl:test:pipeline', '60', 'NX']);

    const ttl = commande(['TTL', 'aurav1:rl:test:pipeline']) as number;
    assert.ok(ttl > 0 && ttl <= 60, `expiration posée (ttl=${ttl})`);
  });

  test('une clé sans expiration est réparée au premier incrément', async () => {
    // Situation d'une interruption entre INCR et EXPIRE dans une version antérieure.
    magasin.set('aurav1:rl:test:orpheline', { valeur: 4, exp: null });
    const pilote = creerPiloteKV(base, 'jeton');
    const n = await pilote.incr('aurav1:rl:test:orpheline', 30);
    assert.equal(n, 5);
    const ttl = commande(['TTL', 'aurav1:rl:test:orpheline']) as number;
    assert.ok(ttl > 0 && ttl <= 30, 'le compteur ne peut plus vivre indéfiniment');
  });

  test('une fenêtre en cours n’est jamais rallongée', async () => {
    const pilote = creerPiloteKV(base, 'jeton');
    await pilote.incr('aurav1:rl:test:nx', 2);
    await new Promise((r) => setTimeout(r, 1100));
    const ttlAvant = commande(['TTL', 'aurav1:rl:test:nx']) as number;
    await pilote.incr('aurav1:rl:test:nx', 2);
    const ttlApres = commande(['TTL', 'aurav1:rl:test:nx']) as number;
    assert.ok(ttlApres <= ttlAvant, `ttl ${ttlAvant} → ${ttlApres} (pas de rallonge)`);
  });

  test('la fenêtre se referme d’elle-même', async () => {
    const pilote = creerPiloteKV(base, 'jeton');
    await pilote.incr('aurav1:rl:test:expire', 1);
    await new Promise((r) => setTimeout(r, 1150));
    const n = await pilote.incr('aurav1:rl:test:expire', 1);
    assert.equal(n, 1, 'nouvelle fenêtre, compteur reparti de zéro');
  });

  test('sans point d’entrée /pipeline, le repli pose quand même l’expiration', async () => {
    pipelineEnPanne = true;
    const pilote = creerPiloteKV(base, 'jeton');
    const n = await pilote.incr('aurav1:rl:test:repli', 45);
    assert.equal(n, 1);
    const ttl = commande(['TTL', 'aurav1:rl:test:repli']) as number;
    assert.ok(ttl > 0 && ttl <= 45, 'expiration garantie par INCR + TTL + EXPIRE');
    const noms = journal.map((c) => String((c as unknown[])[0]).toUpperCase());
    assert.ok(noms.includes('INCR') && noms.includes('TTL') && noms.includes('EXPIRE'));
  });

  test('le limiteur compte bien sur le stockage partagé', async () => {
    const pilote = creerPiloteKV(base, 'jeton');
    const cle = 'test-limiteur-kv';
    const v1 = await compterTentative(pilote, cle, 2, 60_000);
    const v2 = await compterTentative(pilote, cle, 2, 60_000);
    const v3 = await compterTentative(pilote, cle, 2, 60_000);
    assert.deepEqual([v1.bloque, v2.bloque, v3.bloque], [false, false, true]);
    assert.equal(v3.source, 'partage');
  });

  test('un stockage totalement muet fait basculer sur le repli local, sans erreur', async () => {
    const pilote = creerPiloteKV('http://127.0.0.1:1', 'jeton');
    const v = await compterTentative(pilote, 'test-muet', 3, 60_000);
    assert.equal(v.bloque, false);
    assert.equal(v.source, 'local');
  });
});
