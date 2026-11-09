/**
 * La fonction serverless, appelée « nue » — reproduction de `api/index.ts`.
 *
 * En production Vercel, le routeur n'est pas monté dans une application
 * Express : il est appelé comme une fonction, avec l'objet `req` brut de
 * Node. Les accesseurs ajoutés par Express (`req.path`, `req.protocol`…)
 * n'existent donc pas.
 *
 * C'est exactement ce qui a cassé la production le 2026-11-09 : une garde
 * lisait `req.path`, levait un `TypeError`, et **toute l'API v1** répondait
 * `500 interne` alors que tout fonctionnait en développement (`app.use`,
 * où `req.path` existe). Ce test appelle le routeur de la même manière que
 * Vercel, pour que l'écart ne puisse plus passer inaperçu.
 *
 *   node --import tsx --test tests/fonction-serverless.test.ts
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const dossierData = mkdtempSync(path.join(tmpdir(), 'aura-brute-'));
process.env.AURA_DATA_DIR = dossierData;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.AURA_VERIFICATION_EMAIL_OBLIGATOIRE;

const { default: handler } = await import('../api/index');
const { cheminSousRouteur } = await import('../server/v1/routes');

let serveur: Server;
let base = '';

type Json = Record<string, unknown> & { code?: string; name?: string };

let cookie = '';

function appel(methode: string, route: string, corps?: unknown) {
  return fetch(base + route, {
    method: methode,
    headers: {
      ...(corps !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: corps !== undefined ? JSON.stringify(corps) : undefined,
  }).then((r) => {
    const pose = r.headers.getSetCookie?.() ?? [];
    if (pose.length) cookie = pose[0].split(';')[0];
    return r;
  });
}

before(async () => {
  // Comme la réécriture Vercel : /api/<reste> → fonction avec __path=<reste>.
  serveur = createServer((req, res) => {
    const brut = req.url ?? '/';
    const reste = brut.replace(/^\/api\/?/, '').split('?')[0];
    (req as unknown as { query: Record<string, string> }).query = { __path: reste };
    void handler(req as never, res as never);
  });
  await new Promise<void>((resolve) => serveur.listen(0, '127.0.0.1', resolve));
  const adresse = serveur.address();
  base = typeof adresse === 'object' && adresse ? `http://127.0.0.1:${adresse.port}` : '';
});

after(async () => {
  await new Promise<void>((resolve) => serveur.close(() => resolve()));
  rmSync(dossierData, { recursive: true, force: true });
});

describe('Chemin de requête sans Express', () => {
  test('se déduit de `url`, jamais de `path`', () => {
    assert.equal(cheminSousRouteur({ url: '/me' } as never), '/me');
    assert.equal(cheminSousRouteur({ url: '/me?sessions=1' } as never), '/me');
    assert.equal(cheminSousRouteur({ url: '/me/' } as never), '/me');
    assert.equal(cheminSousRouteur({ url: '' } as never), '/');
    assert.equal(cheminSousRouteur({} as never), '/');
    // `originalUrl` sert de secours quand `url` est absent.
    assert.equal(
      cheminSousRouteur({ originalUrl: '/v1/capabilities?x=1' } as never),
      '/v1/capabilities',
    );
  });
});

describe('Routeur appelé comme une fonction serverless', () => {
  test('/status répond, sans Express au-dessus', async () => {
    const r = await appel('GET', '/status');
    assert.equal(r.status, 200);
    const j = (await r.json()) as Json;
    assert.equal(j.name, 'Aura');
  });

  test('/v1/capabilities répond 200 (et non 500)', async () => {
    const r = await appel('GET', '/v1/capabilities');
    assert.equal(r.status, 200);
    const j = (await r.json()) as Json;
    assert.equal(typeof j.comptes, 'boolean');
    assert.ok(j.persistance, 'l’état de persistance doit être décrit');
  });

  test('/v1/conversations sans session répond 401 anonyme', async () => {
    const r = await appel('GET', '/v1/conversations');
    assert.equal(r.status, 401);
    assert.equal(((await r.json()) as Json).code, 'anonyme');
  });

  test('une route v1 inconnue ne produit jamais 500', async () => {
    const r = await appel('GET', '/v1/route-qui-nexiste-pas');
    assert.notEqual(r.status, 500);
  });

  test('le parcours complet fonctionne : inscription → espace → conversation', async () => {
    const inscription = await appel('POST', '/auth/register', {
      email: `parcours-${Date.now()}@test.dev`,
      password: 'motdepasse123',
      nom: 'Parcours',
    });
    assert.equal(inscription.status, 201);
    assert.ok(cookie, 'la session doit être posée par cookie');

    const me = await appel('GET', '/v1/me');
    assert.equal(me.status, 200);

    const liste = await appel('GET', '/v1/conversations');
    assert.equal(liste.status, 200);

    const creation = await appel('POST', '/v1/conversations', { titre: 'Essai' });
    assert.equal(creation.status, 201);
  });

  test('l’inscription lit son corps JSON dans ce mode', async () => {
    const r = await appel('POST', '/auth/register', {
      email: `brute-${Date.now()}@test.dev`,
      password: 'motdepasse123',
      nom: 'Brute',
    });
    assert.equal(r.status, 201);
  });
});
