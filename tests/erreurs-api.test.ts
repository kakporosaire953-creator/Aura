/**
 * Filets de sécurité de l'API (mission 10).
 *
 * Constat de départ : quand une route n'existait pas ou qu'une erreur
 * survenait, Express renvoyait une page HTML. Le client, qui attend du JSON,
 * affichait alors « Le service ne répond pas » — impossible de distinguer une
 * panne serveur d'une route absente. Ces tests garantissent que /api répond
 * toujours en JSON, avec un code exploitable.
 *   node --import tsx --test tests/erreurs-api.test.ts
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import express from 'express';

const dossierData = mkdtempSync(path.join(tmpdir(), 'aura-erreurs-'));
process.env.AURA_AI_PROVIDER = 'mock';
process.env.AURA_DATA_DIR = dossierData;
process.env.NODE_ENV = 'test';
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.VERCEL;

const { createApiApp } = await import('../server/api');

let serveur: Server;
let base: string;

before(async () => {
  const app = express();
  app.use('/api', createApiApp());
  await new Promise<void>((resolve) => {
    serveur = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${(serveur.address() as { port: number }).port}/api`;
});

after(async () => {
  await new Promise<void>((resolve) => serveur.close(() => resolve()));
  rmSync(dossierData, { recursive: true, force: true });
});

describe('Réponses d’erreur de l’API', () => {
  test('une route inconnue renvoie du JSON, jamais du HTML', async () => {
    const r = await fetch(`${base}/route-qui-nexiste-pas`);
    assert.equal(r.status, 404);
    assert.match(r.headers.get('content-type') ?? '', /application\/json/);
    const corps = (await r.json()) as { code?: string; error?: string };
    assert.equal(corps.code, 'introuvable');
    assert.ok(corps.error);
  });

  test('un corps JSON malformé renvoie 400 en JSON (faute du client, pas panne)', async () => {
    const r = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ ceci n’est pas du JSON',
    });
    assert.equal(r.status, 400);
    assert.match(r.headers.get('content-type') ?? '', /application\/json/);
    const corps = (await r.json()) as { code?: string };
    assert.equal(corps.code, 'validation');
  });

  test('la route de santé répond toujours en JSON', async () => {
    const r = await fetch(`${base}/status`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type') ?? '', /application\/json/);
    const corps = (await r.json()) as { features?: { accounts?: string } };
    assert.ok(corps.features?.accounts);
  });

  test('aucune réponse de /api ne contient de balise HTML', async () => {
    for (const route of ['/inconnue', '/auth/inconnue', '/v1/inconnue']) {
      const r = await fetch(base + route);
      const texte = await r.text();
      assert.ok(!/<!doctype html|<html/i.test(texte), `${route} renvoie du HTML`);
      assert.match(r.headers.get('content-type') ?? '', /application\/json/, `${route} n’est pas du JSON`);
      // 404 : route absente. 401 : la surface privée exige une session, ce qui
      // est un refus légitime et non une fuite de page HTML.
      assert.ok([401, 404].includes(r.status), `${route} → ${r.status}`);
    }
  });
});
