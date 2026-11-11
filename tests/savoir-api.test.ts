/**
 * Référentiel — intégration HTTP (pilote fichier temporaire, IA simulée).
 *
 * Ce que ces tests prouvent :
 *  - les routes documentaires sont fermées sans rôle administrateur (même
 *    garde que le reste de l'administration, aucun second contrôle) ;
 *  - une source non validée ne débloque aucune collecte ;
 *  - une ressource importée reste invisible du chat tant qu'elle n'est pas
 *    validée, puis devient citable ;
 *  - la réponse du chat porte les références réellement transmises.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import express from 'express';

const dossierData = mkdtempSync(path.join(tmpdir(), 'aura-savoir-api-'));
process.env.AURA_AI_PROVIDER = 'mock';
process.env.AURA_DATA_DIR = dossierData;
process.env.AURA_ADMIN_EMAILS = 'savoir-admin@test.dev';
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.VERCEL;
delete process.env.AURA_VERIFICATION_EMAIL_OBLIGATOIRE;
delete process.env.AURA_MAIL_PROVIDER;

const { createApiApp } = await import('../server/api');

let serveur: Server;
let base = '';

type Json = Record<string, any>;

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
    return { statut: r.status, json };
  };
}

async function inscrire(email: string) {
  const c = client();
  const r = await c('POST', '/auth/register', {
    email,
    password: 'MotDePasse123!',
    nom: 'Test Savoir',
  });
  if (r.statut !== 201) {
    const l = await c('POST', '/auth/login', { email, password: 'MotDePasse123!' });
    assert.equal(l.statut, 200, 'connexion');
  }
  return c;
}

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

const TEXTE = `
L’immatriculation d’une entreprise au Bénin se fait au guichet unique de formalisation des entreprises.
Le registre du commerce et du crédit mobilier (RCCM) est délivré par le greffe compétent.
L’identifiant fiscal unique (IFU) est délivré par la direction générale des impôts.
Une SARL doit désigner un gérant et disposer d’un capital social.
`.trim();

describe('Administration du référentiel', () => {
  test('sans connexion : refus ; compte ordinaire : refus', async () => {
    const anonyme = client();
    const r0 = await anonyme('GET', '/v1/admin/savoir/etat');
    assert.ok([401, 403].includes(r0.statut), `anonyme ${r0.statut}`);

    const simple = await inscrire('savoir-simple@test.dev');
    for (const route of ['/v1/admin/savoir/etat', '/v1/admin/savoir/sources', '/v1/admin/savoir/journal']) {
      const r = await simple('GET', route);
      assert.equal(r.statut, 403, route);
    }
  });

  test('l’administrateur voit l’état réel et la recherche disponible', async () => {
    const admin = await inscrire('savoir-admin@test.dev');
    const r = await admin('GET', '/v1/admin/savoir/etat');
    assert.equal(r.statut, 200);
    assert.equal(r.json.ressources, 0);
    assert.equal(r.json.recherche, 'lexicale');
    assert.deepEqual(r.json.hotesAutorises, []);
  });

  test('une source non activée n’autorise aucune collecte', async () => {
    const admin = await inscrire('savoir-admin@test.dev');
    const semis = await admin('POST', '/v1/admin/savoir/sources/semer', {});
    assert.equal(semis.statut, 200);
    assert.ok((semis.json.crees as Json[]).length >= 1);

    const refus = await admin('POST', '/v1/admin/savoir/ressources', {
      url: 'https://service-public.bj/une-page',
      domaine: 'administration',
      niveau: 'A',
    });
    assert.equal(refus.statut, 422);
    assert.match(String(refus.json.erreur ?? ''), /autoris|catalogue|source/i);
  });

  test('import → à vérifier → validation → citable dans le chat', async () => {
    const admin = await inscrire('savoir-admin@test.dev');
    const importe = await admin('POST', '/v1/admin/savoir/ressources', {
      texte: TEXTE,
      titre: 'Créer une entreprise au Bénin',
      description: 'Formalités RCCM et IFU.',
      domaine: 'entrepreneuriat',
      pays: 'BJ',
      organisme: 'Test',
      niveau: 'A',
    });
    assert.equal(importe.statut, 201);
    const id = importe.json.ressource.id as string;
    assert.equal(importe.json.ressource.statut, 'a-verifier');

    // Tant que la ressource n'est pas validée, la recherche ne la renvoie pas.
    const avant = await admin('POST', '/v1/admin/savoir/recherche', {
      question: 'Comment créer une entreprise au Bénin ?',
    });
    assert.equal(avant.statut, 200);
    assert.equal((avant.json.passages as Json[]).length, 0);

    const valide = await admin('POST', `/v1/admin/savoir/ressources/${id}/statut`, { statut: 'actif' });
    assert.equal(valide.statut, 200);

    const apres = await admin('POST', '/v1/admin/savoir/recherche', {
      question: 'Comment créer une entreprise au Bénin ?',
    });
    assert.ok((apres.json.passages as Json[]).length > 0);

    // Chat : la réponse porte les références réellement transmises.
    const conv = await admin('POST', '/v1/conversations', {});
    assert.equal(conv.statut, 201);
    const convId = conv.json.conversation.id as string;
    const msg = await admin('POST', `/v1/conversations/${convId}/messages`, {
      contenu: 'Comment créer une entreprise au Bénin ?',
    });
    assert.equal(msg.statut, 200);
    const meta = msg.json.reponse?.meta as Json;
    assert.ok(Array.isArray(meta.references) && meta.references.length > 0, 'références attendues');
    assert.equal(meta.references[0].etiquette, 'S1');
    assert.equal(meta.references[0].ressourceId, id);
  });

  test('une question sans ancrage ne cite aucune source', async () => {
    const admin = await inscrire('savoir-admin@test.dev');
    const conv = await admin('POST', '/v1/conversations', {});
    const convId = conv.json.conversation.id as string;
    const msg = await admin('POST', `/v1/conversations/${convId}/messages`, {
      contenu: 'Écris un poème sur la mer',
    });
    assert.equal(msg.statut, 200);
    const meta = msg.json.reponse?.meta as Json;
    assert.ok(!meta.references || meta.references.length === 0);
  });
});
