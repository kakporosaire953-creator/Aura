/**
 * Panneau d'administration — accès, modération, journal.
 *
 * Ce que ces tests protègent :
 *  - le rôle vient d'une variable d'environnement, jamais d'un champ en base :
 *    un compte ordinaire ne peut rien, même en connaissant les routes ;
 *  - une suspension ferme réellement l'accès (connexion ET sessions déjà
 *    ouvertes), sans supprimer les données ;
 *  - un administrateur ne peut pas se suspendre ni se supprimer lui-même ;
 *  - la suppression exige l'adresse exacte ;
 *  - chaque action laisse une trace dans le journal.
 */
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import express from 'express';

const dossierData = mkdtempSync(path.join(tmpdir(), 'aura-admin-'));
process.env.AURA_AI_PROVIDER = 'mock';
process.env.AURA_DATA_DIR = dossierData;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.VERCEL;
delete process.env.AURA_VERIFICATION_EMAIL_OBLIGATOIRE;
delete process.env.AURA_MAIL_PROVIDER;

const { createApiApp } = await import('../server/api');

let serveur: Server;
let base = '';

type Json = Record<string, unknown> & { error?: string; code?: string };

/** Client à cookie : une seule session par instance. */
function client() {
  let cookie: string | null = null;
  return async function appel(methode: string, route: string, corps?: unknown) {
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
    const json = (r.status === 204 ? {} : await r.json().catch(() => ({}))) as Json;
    return { statut: r.status, json, cookie: () => cookie };
  };
}

async function inscrire(email: string, nom = 'Test') {
  const c = client();
  const r = await c('POST', '/auth/register', { email, password: 'MotDePasse123!', nom });
  if (r.statut === 201) return c;
  // Compte déjà créé par un test précédent : on s'y connecte.
  assert.equal(r.statut, 409, `inscription ${email}`);
  const connexion = await c('POST', '/auth/login', { email, password: 'MotDePasse123!' });
  assert.equal(connexion.statut, 200, `connexion ${email}`);
  return c;
}

const ADMIN = 'patron@test.dev';

before(async () => {
  const app = express();
  app.use('/api', createApiApp());
  await new Promise<void>((resolve) => {
    serveur = app.listen(0, '127.0.0.1', resolve);
  });
  const adresse = serveur.address();
  base = typeof adresse === 'object' && adresse ? `http://127.0.0.1:${adresse.port}/api` : '';
});

after(() => {
  serveur?.close();
  rmSync(dossierData, { recursive: true, force: true });
});

beforeEach(() => {
  process.env.AURA_ADMIN_EMAILS = ADMIN;
});

describe('Accès au panneau', () => {
  test('sans variable, l’administration est fermée (503), pas ouverte par défaut', async () => {
    delete process.env.AURA_ADMIN_EMAILS;
    const c = await inscrire('sansadmin@test.dev');
    const r = await c('GET', '/v1/admin/statistiques');
    assert.equal(r.statut, 503);
    assert.equal(r.json.code, 'admin-non-configure');
    const etat = await c('GET', '/v1/admin/etat');
    assert.equal(etat.statut, 200);
    assert.equal(etat.json.admin, false);
    assert.equal(etat.json.configure, false);
  });

  test('un compte ordinaire reçoit 403 sur toutes les routes d’administration', async () => {
    const simple = await inscrire('simple@test.dev');
    for (const route of [
      '/v1/admin/statistiques',
      '/v1/admin/utilisateurs',
      '/v1/admin/journal',
    ]) {
      const r = await simple('GET', route);
      assert.equal(r.statut, 403, route);
      assert.equal(r.json.code, 'admin-refuse', route);
    }
    const etat = await simple('GET', '/v1/admin/etat');
    assert.equal(etat.json.admin, false);
    assert.equal(etat.json.configure, true);
  });

  test('un visiteur non connecté est refusé en 401', async () => {
    const r = await client()('GET', '/v1/admin/statistiques');
    assert.equal(r.statut, 401);
  });

  test('l’administrateur désigné voit les statistiques et la liste', async () => {
    const admin = await inscrire(ADMIN);
    const etat = await admin('GET', '/v1/admin/etat');
    assert.equal(etat.json.admin, true);

    const stats = await admin('GET', '/v1/admin/statistiques');
    assert.equal(stats.statut, 200);
    assert.ok((stats.json.comptes as number) >= 2);

    const liste = await admin('GET', '/v1/admin/utilisateurs');
    assert.equal(liste.statut, 200);
    const utilisateurs = liste.json.utilisateurs as { email: string }[];
    assert.ok(utilisateurs.some((u) => u.email === ADMIN));

    const recherche = await admin('GET', '/v1/admin/utilisateurs?recherche=simple');
    const trouves = recherche.json.utilisateurs as { email: string }[];
    assert.equal(trouves.length, 1);
    assert.equal(trouves[0].email, 'simple@test.dev');
  });
});

describe('Suspension', () => {
  test('bannir ferme la session ouverte et refuse la connexion, sans effacer les données', async () => {
    const admin = await inscrire(ADMIN);
    const cible = await inscrire('cible@test.dev');

    const avant = await cible('GET', '/v1/conversations');
    assert.equal(avant.statut, 200, 'la cible accède normalement avant la suspension');

    const liste = await admin('GET', '/v1/admin/utilisateurs?recherche=cible@test.dev');
    const id = (liste.json.utilisateurs as { id: string }[])[0].id;

    const ban = await admin('POST', `/v1/admin/utilisateurs/${id}/bannir`, { motif: 'test' });
    assert.equal(ban.statut, 200);
    assert.ok((ban.json.sessionsFermees as number) >= 1);

    // La session déjà ouverte est révoquée : le cookie ne vaut plus rien.
    const apres = await cible('GET', '/v1/conversations');
    assert.equal(apres.statut, 401);
    assert.equal(apres.json.code, 'session-expiree');

    // La connexion est refusée… avec le mot de passe correct.
    const connexion = await client()('POST', '/auth/login', {
      email: 'cible@test.dev',
      password: 'MotDePasse123!',
    });
    assert.equal(connexion.statut, 403);
    assert.equal(connexion.json.code, 'compte-banni');

    // …et un mauvais mot de passe reste un refus générique (pas d'énumération).
    const faux = await client()('POST', '/auth/login', {
      email: 'cible@test.dev',
      password: 'mauvais-mot-de-passe',
    });
    assert.equal(faux.statut, 401);
    assert.equal(faux.json.code, 'identifiants');

    // Les données existent toujours : débannir rend le compte utilisable.
    const deban = await admin('POST', `/v1/admin/utilisateurs/${id}/debannir`);
    assert.equal(deban.statut, 200);
    const retour = await client()('POST', '/auth/login', {
      email: 'cible@test.dev',
      password: 'MotDePasse123!',
    });
    assert.equal(retour.statut, 200);
  });

  test('débannir un compte non suspendu est signalé, pas silencieux', async () => {
    const admin = await inscrire(ADMIN);
    const liste = await admin('GET', '/v1/admin/utilisateurs?recherche=cible@test.dev');
    const id = (liste.json.utilisateurs as { id: string }[])[0].id;
    const r = await admin('POST', `/v1/admin/utilisateurs/${id}/debannir`);
    assert.equal(r.statut, 409);
    assert.equal(r.json.code, 'non-banni');
  });

  test('un administrateur ne peut pas se suspendre ni se supprimer', async () => {
    const admin = await inscrire(ADMIN);
    const liste = await admin('GET', `/v1/admin/utilisateurs?recherche=${ADMIN}`);
    const moi = (liste.json.utilisateurs as { id: string }[])[0].id;

    const ban = await admin('POST', `/v1/admin/utilisateurs/${moi}/bannir`, {});
    assert.equal(ban.statut, 400);
    assert.equal(ban.json.code, 'soi-meme');

    const sup = await admin('POST', `/v1/admin/utilisateurs/${moi}/supprimer`, {
      confirmation: ADMIN,
    });
    assert.equal(sup.statut, 400);
    assert.equal(sup.json.code, 'soi-meme');
  });
});

describe('Suppression et journal', () => {
  test('la suppression exige l’adresse exacte, puis retire le compte', async () => {
    const admin = await inscrire(ADMIN);
    const victime = await inscrire('asupprimer@test.dev');
    const liste = await admin('GET', '/v1/admin/utilisateurs?recherche=asupprimer@test.dev');
    const id = (liste.json.utilisateurs as { id: string }[])[0].id;

    const mauvais = await admin('POST', `/v1/admin/utilisateurs/${id}/supprimer`, {
      confirmation: 'autre@test.dev',
    });
    assert.equal(mauvais.statut, 400);

    const bon = await admin('POST', `/v1/admin/utilisateurs/${id}/supprimer`, {
      confirmation: 'asupprimer@test.dev',
    });
    assert.equal(bon.statut, 200);

    // Le compte n'existe plus : plus de connexion possible.
    const connexion = await client()('POST', '/auth/login', {
      email: 'asupprimer@test.dev',
      password: 'MotDePasse123!',
    });
    assert.equal(connexion.statut, 401);
    assert.equal(victime !== null, true);

    const detail = await admin('GET', `/v1/admin/utilisateurs/${id}`);
    assert.equal(detail.statut, 404);
  });

  test('chaque action laisse une trace horodatée, sans secret', async () => {
    const admin = await inscrire(ADMIN);
    const r = await admin('GET', '/v1/admin/journal');
    assert.equal(r.statut, 200);
    const entrees = r.json.entrees as { action: string; cible: string; par: string }[];
    assert.ok(entrees.length >= 2, 'suspension, débannissement et suppression tracés');
    assert.ok(entrees.some((e) => e.action === 'supprimer'));
    assert.ok(entrees.every((e) => e.cible.includes('@')));
    assert.doesNotMatch(JSON.stringify(entrees), /MotDePasse123|hash|sel/i);
  });
});
