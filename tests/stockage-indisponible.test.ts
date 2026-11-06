/**
 * Stockage injoignable : une panne ne doit jamais être présentée comme un
 * anonymat (401) ni comme un succès silencieux. 501 non plus : 503.
 *
 * Le pilote KV est configuré mais pointe vers un port fermé : les appels
 * échouent vite, sans réseau réel, sans écriture nulle part.
 *   node --import tsx --test tests/stockage-indisponible.test.ts
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import express from 'express';

process.env.AURA_AI_PROVIDER = 'mock';
process.env.NODE_ENV = 'test';
// KV configuré mais inaccessible : 127.0.0.1:1 refuse la connexion.
process.env.KV_REST_API_URL = 'http://127.0.0.1:1';
process.env.KV_REST_API_TOKEN = 'jeton-de-test';
delete process.env.AURA_DATA_DIR;
delete process.env.VERCEL;

const { createApiApp, configurerConfianceProxy } = await import('../server/api');

type Json = Record<string, unknown> & { error?: string; code?: string };

let serveur: Server;
let base: string;

function client() {
  let cookie: string | null = null;
  const appel = async function (methode: string, route: string, corps?: unknown) {
    const r = await fetch(base + route, {
      method: methode,
      headers: {
        ...(corps !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
    });
    const setCookie = r.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return { statut: r.status, json: (await r.json().catch(() => ({}))) as Json };
  };
  appel.avecCookie = (valeur: string) => {
    cookie = valeur;
  };
  return appel;
}

before(async () => {
  const app = express();
  configurerConfianceProxy(app);
  app.use('/api', createApiApp());
  await new Promise<void>((resolve) => {
    serveur = app.listen(0, '127.0.0.1', resolve);
  });
  const adresse = serveur.address() as { port: number };
  base = `http://127.0.0.1:${adresse.port}/api`;
});

after(async () => {
  await new Promise<void>((resolve) => serveur.close(() => resolve()));
});

describe('Stockage injoignable', () => {
  test('sans cookie : 401 anonyme (aucune lecture de stockage nécessaire)', async () => {
    const r = await client()('GET', '/me');
    assert.equal(r.statut, 401);
    assert.equal(r.json.code, 'anonyme');
  });

  test('avec un cookie : 503 stockage-indisponible, jamais 401', async () => {
    const c = client();
    c.avecCookie('aura_session=jeton-quelconque');
    const r = await c('GET', '/me');
    assert.equal(r.statut, 503);
    assert.equal(r.json.code, 'stockage-indisponible');
  });

  test('API v1 protégée : 503 également, pas un refus d’authentification', async () => {
    const c = client();
    c.avecCookie('aura_session=jeton-quelconque');
    const r = await c('GET', '/v1/me');
    assert.equal(r.statut, 503);
    assert.equal(r.json.code, 'stockage-indisponible');
  });

  test('connexion et inscription : 503 explicite, la requête ne reste pas suspendue', async () => {
    const login = await client()('POST', '/auth/login', {
      email: 'personne@test.dev',
      password: 'motdepasse1',
    });
    assert.equal(login.statut, 503);
    assert.equal(login.json.code, 'stockage-indisponible');

    const inscription = await client()('POST', '/auth/register', {
      email: 'nouveau-' + Date.now() + '@test.dev',
      password: 'motdepasse1',
      nom: 'Test',
    });
    assert.equal(inscription.statut, 503);
    assert.equal(inscription.json.code, 'stockage-indisponible');
  });

  test('la limitation de débit continue de fonctionner sans compteur partagé', async () => {
    const c = client();
    const email = 'panne-' + Date.now() + '@test.dev';
    let dernier = 0;
    let code = '';
    for (let i = 0; i < 11; i++) {
      const r = await c('POST', '/auth/register', { email, password: 'motdepasse1', nom: 'Test' });
      dernier = r.statut;
      code = String(r.json.code ?? '');
    }
    // Le stockage est en panne : le repli local prend le relais et finit par refuser.
    assert.equal(dernier, 429);
    assert.equal(code, 'limite');
  });
});
