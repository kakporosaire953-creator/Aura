/**
 * Tests d'intégration de l'API v1 — parcours réel avec persistance
 * (pilote fichier temporaire) et fournisseur IA simulé (AURA_AI_PROVIDER=mock) :
 * aucun appel réseau, aucun coût. Exécution :
 *   node --import tsx --test tests/*.test.ts
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import express from 'express';

// Configuration AVANT tout import du serveur.
const dossierData = mkdtempSync(path.join(tmpdir(), 'aura-test-'));
process.env.AURA_AI_PROVIDER = 'mock';
process.env.AURA_DATA_DIR = dossierData;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.VERCEL;

const { createApiApp } = await import('../server/api');

type Json = Record<string, unknown> & { error?: string; code?: string };

let serveur: Server;
let base: string;

/** Client http avec cookies (conservation de session). */
function client() {
  let cookie: string | null = null;
  const appel = async function (
    methode: string,
    route: string,
    corps?: unknown,
  ): Promise<{ statut: number; json: Json; entetes: Headers }> {
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
    return { statut: r.status, json, entetes: r.headers };
  };
  appel.enteteCookie = () => cookie;
  return appel;
}

before(async () => {
  const app = express();
  app.use('/api', createApiApp());
  await new Promise<void>((resolve) => {
    serveur = app.listen(0, '127.0.0.1', resolve);
  });
  const adresse = serveur.address() as { port: number };
  base = `http://127.0.0.1:${adresse.port}/api`;
});

after(async () => {
  await new Promise<void>((resolve) => serveur.close(() => resolve()));
  rmSync(dossierData, { recursive: true, force: true });
});

describe('Authentification', () => {
  test('inscription → session → /me', async () => {
    const c = client();
    const inscr = await c('POST', '/auth/register', {
      email: 'alice@test.dev',
      password: 'motdepasse123',
      nom: 'Alice',
    });
    assert.equal(inscr.statut, 201);
    assert.equal(inscr.json.compte && (inscr.json.compte as Json).email, 'alice@test.dev');

    const me = await c('GET', '/me');
    assert.equal(me.statut, 200);

    // Mot de passe incorrect → 401 message unique.
    const c2 = client();
    const faux = await c2('POST', '/auth/login', {
      email: 'alice@test.dev',
      password: 'incorrecte!!',
    });
    assert.equal(faux.statut, 401);

    const ok = await c2('POST', '/auth/login', {
      email: 'alice@test.dev',
      password: 'motdepasse123',
    });
    assert.equal(ok.statut, 200);
  });

  test('anonyme : /v1 protégé → 401', async () => {
    const c = client();
    const r = await c('GET', '/v1/conversations');
    assert.equal(r.statut, 401);
    const r2 = await c('GET', '/v1/capabilities');
    assert.equal(r2.statut, 200); // les capacités restent publiques
  });

  test('déconnexion invalide la session', async () => {
    const c = client();
    await c('POST', '/auth/register', {
      email: 'bob@test.dev',
      password: 'motdepasse123',
      nom: 'Bob',
    });
    const out = await c('POST', '/auth/logout');
    assert.equal(out.statut, 204);
    const me = await c('GET', '/me');
    assert.equal(me.statut, 401);
  });
});

describe('Conversations et messages (persistance réelle)', () => {
  test('cycle complet : créer, discuter, régénérer, supprimer', async () => {
    const c = client();
    await c('POST', '/auth/register', {
      email: 'conv@test.dev',
      password: 'motdepasse123',
      nom: 'Conv',
    });

    const conv = await c('POST', '/v1/conversations', {});
    assert.equal(conv.statut, 201);
    const convId = (conv.json.conversation as Json).id as string;

    const msg = await c('POST', `/v1/conversations/${convId}/messages`, {
      contenu: 'Bonjour AURA',
      stream: false,
    });
    assert.equal(msg.statut, 200);
    assert.equal((msg.json.reponse as Json).role, 'assistant');
    assert.match(String((msg.json.reponse as Json).contenu), /mock/);

    // Régénération : pas de nouveau message utilisateur.
    const regen = await c('POST', `/v1/conversations/${convId}/messages`, {
      regenerer: true,
      stream: false,
    });
    assert.equal(regen.statut, 200);
    const detail = await c('GET', `/v1/conversations/${convId}`);
    const messages = detail.json.messages as Json[];
    assert.equal(messages.filter((m) => m.role === 'user').length, 1);
    assert.equal(messages.filter((m) => m.role === 'assistant').length, 1);

    // Titre auto.
    const liste = await c('GET', '/v1/conversations');
    const conversations = liste.json.conversations as Json[];
    assert.equal(conversations[0].titre, 'Bonjour AURA');

    const del = await c('DELETE', `/v1/conversations/${convId}`);
    assert.equal(del.statut, 204);
  });

  test('streaming SSE : chunks + done', async () => {
    const c = client();
    await c('POST', '/auth/register', {
      email: 'stream@test.dev',
      password: 'motdepasse123',
      nom: 'Stream',
    });
    const conv = await c('POST', '/v1/conversations', {});
    const convId = (conv.json.conversation as Json).id as string;

    const r = await fetch(`${base}/v1/conversations/${convId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(c.enteteCookie() ? { Cookie: c.enteteCookie()! } : {}),
      },
      body: JSON.stringify({ contenu: 'en streaming', stream: true }),
    });
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type') ?? '', /text\/event-stream/);
    const corps = await r.text();
    assert.match(corps, /event: chunk/);
    assert.match(corps, /event: done/);
  });
});

describe('Isolation entre comptes', () => {
  test("jamais d'accès aux ressources d'un autre compte", async () => {
    const alice = client();
    await alice('POST', '/auth/register', {
      email: 'iso-a@test.dev',
      password: 'motdepasse123',
      nom: 'A',
    });
    const conv = await alice('POST', '/v1/conversations', { titre: 'Privé' });
    const convId = (conv.json.conversation as Json).id as string;
    const mission = await alice('POST', '/v1/missions', { titre: 'Privée' });
    const missionId = (mission.json.mission as Json).id as string;

    const eve = client();
    await eve('POST', '/auth/register', {
      email: 'iso-b@test.dev',
      password: 'motdepasse123',
      nom: 'B',
    });
    assert.equal((await eve('GET', `/v1/conversations/${convId}`)).statut, 404);
    assert.equal(
      (await eve('POST', `/v1/conversations/${convId}/messages`, { contenu: 'pirate' })).statut,
      404,
    );
    assert.equal((await eve('PATCH', `/v1/missions/${missionId}`, { titre: 'volé' })).statut, 404);
    assert.equal((await eve('DELETE', `/v1/missions/${missionId}`)).statut, 404);
    const liste = await eve('GET', '/v1/conversations');
    assert.equal((liste.json.conversations as Json[]).length, 0);
  });
});

describe('Projets', () => {
  test('CRUD + espace projet', async () => {
    const c = client();
    await c('POST', '/auth/register', {
      email: 'prj@test.dev',
      password: 'motdepasse123',
      nom: 'P',
    });
    const creation = await c('POST', '/v1/projets', {
      nom: 'Application scolaire',
      objectif: 'Gérer les notes',
      instructions: 'Contexte béninois, français.',
    });
    assert.equal(creation.statut, 201);
    const prjId = (creation.json.projet as Json).id as string;

    // Conversation rattachée.
    const conv = await c('POST', '/v1/conversations', { projectId: prjId });
    assert.equal((conv.json.conversation as Json).projectId, prjId);

    const espace = await c('GET', `/v1/projets/${prjId}`);
    assert.equal(espace.statut, 200);
    assert.equal((espace.json.conversations as Json[]).length, 1);
    assert.equal((espace.json.projet as Json).instructions, 'Contexte béninois, français.');

    // Archiver puis supprimer.
    assert.equal((await c('PATCH', `/v1/projets/${prjId}`, { statut: 'archive' })).statut, 200);
    assert.equal((await c('DELETE', `/v1/projets/${prjId}`)).statut, 204);
    assert.equal((await c('GET', `/v1/projets/${prjId}`)).statut, 404);
  });
});

describe('Missions', () => {
  test('CRUD, sous-tâches, batch', async () => {
    const c = client();
    await c('POST', '/auth/register', {
      email: 'msn@test.dev',
      password: 'motdepasse123',
      nom: 'M',
    });
    const m = await c('POST', '/v1/missions', {
      titre: 'Cadrer',
      priorite: 'haute',
      sousTaches: ['Livrables', 'Contraintes'],
      echeance: '2026-12-01',
    });
    assert.equal(m.statut, 201);
    const mission = m.json.mission as Json;
    assert.equal((mission.sousTaches as Json[]).length, 2);
    assert.equal(mission.priorite, 'haute');

    const maj = await c('PATCH', `/v1/missions/${mission.id}`, {
      statut: 'en_cours',
      sousTaches: [
        { id: (mission.sousTaches as Json[])[0].id, titre: 'Livrables', fait: true },
        { titre: 'Nouvelle', fait: false },
      ],
    });
    assert.equal(maj.statut, 200);
    assert.equal((maj.json.mission as Json).statut, 'en_cours');
    const st = (maj.json.mission as Json).sousTaches as Json[];
    assert.equal(st.find((s) => s.titre === 'Livrables')?.fait, true);
    assert.equal(st.length, 2);

    const batch = await c('POST', '/v1/missions/batch', {
      missions: [
        { titre: 'Étape 1', priorite: 'basse' },
        { titre: 'Étape 2', sousTaches: ['a'] },
      ],
    });
    assert.equal(batch.statut, 201);
    assert.equal((batch.json.missions as Json[]).length, 2);
  });

  test('aide IA : proposition structurée, rien n\'est enregistré', async () => {
    const c = client();
    await c('POST', '/auth/register', {
      email: 'aide@test.dev',
      password: 'motdepasse123',
      nom: 'IA',
    });
    const avant = await c('GET', '/v1/missions');
    const aide = await c('POST', '/v1/missions/aide', {
      objectif: 'Lancer une boutique en ligne',
    });
    assert.equal(aide.statut, 200);
    assert.equal(Array.isArray(aide.json.proposition), true);
    const apres = await c('GET', '/v1/missions');
    assert.equal(
      (apres.json.missions as Json[]).length,
      (avant.json.missions as Json[]).length,
    );
    assert.match(String(aide.json.note), /non enregistrée/i);
  });
});

describe('Mémoire', () => {
  test('CRUD + contrôle utilisateur (désactivation, effacement)', async () => {
    const c = client();
    await c('POST', '/auth/register', {
      email: 'mem@test.dev',
      password: 'motdepasse123',
      nom: 'Mem',
    });
    const ajout = await c('POST', '/v1/memoires', {
      contenu: 'Préfère les réponses courtes',
      type: 'preference',
    });
    assert.equal(ajout.statut, 201);
    const memId = (ajout.json.memoire as Json).id as string;

    assert.equal((await c('PATCH', `/v1/memoires/${memId}`, { actif: false })).statut, 200);
    const actives = await c('GET', '/v1/memoires?actives=1');
    assert.equal((actives.json.memoires as Json[]).length, 0);

    const vider = await c('DELETE', '/v1/memoires');
    assert.equal(vider.statut, 200);
    assert.equal((vider.json.supprimees as number) >= 1, true);
  });
});

describe('Honnêteté des capacités', () => {
  test('capacités réelles exposées', async () => {
    const c = client();
    const caps = await c('GET', '/v1/capabilities');
    assert.equal(caps.statut, 200);
    assert.equal(caps.json.comptes, true);
    assert.equal((caps.json.assistant as Json).ok, true);
    assert.equal((caps.json.images as Json).ok, false);
    assert.equal((caps.json.fichiers as Json).ok, false);
  });

  test('recherche sans moteur : indisponibilité déclarée, pas de faux résultat', async () => {
    const c = client();
    await c('POST', '/auth/register', {
      email: 'search@test.dev',
      password: 'motdepasse123',
      nom: 'S',
    });
    const r = await c('POST', '/v1/search', { requete: 'prix du riz à Cotonou' });
    // Le mock n'a pas la capacité « outils » → 503 honnête.
    assert.equal(r.statut, 503);
    assert.equal(r.json.code, 'stockage-indisponible');
  });

  test('studio : génération réelle via le moteur (mock), versions et export', async () => {
    const c = client();
    await c('POST', '/auth/register', {
      email: 'studio@test.dev',
      password: 'motdepasse123',
      nom: 'St',
    });
    const job = await c('POST', '/v1/studio/jobs', {
      type: 'rapport',
      instruction: 'Rapport sur la scolarisation',
    });
    assert.equal(job.statut, 201);
    const creation = job.json.job as Json;
    assert.equal(creation.statut, 'terminee');
    assert.equal((creation.versions as Json[]).length, 1);

    const rev = await c('POST', `/v1/studio/jobs/${creation.id}/versions`, {
      instruction: 'Ajoute une conclusion',
    });
    assert.equal(rev.statut, 201);
    assert.equal(((rev.json.job as Json).versions as Json[]).length, 2);

    const exp = await fetch(`${base}/v1/studio/artifacts/${creation.id}`, {
      headers: { ...(c.enteteCookie() ? { Cookie: c.enteteCookie()! } : {}) },
    });
    assert.equal(exp.status, 200);
    assert.match(exp.headers.get('content-type') ?? '', /markdown/);
    assert.match(await exp.text(), /Rapport sur la scolarisation/);
  });
});

describe('Profil contextuel et préférences', () => {
  test('PATCH /v1/me + /v1/preferences avec validation', async () => {
    const c = client();
    await c('POST', '/auth/register', {
      email: 'profil@test.dev',
      password: 'motdepasse123',
      nom: 'P',
    });
    const maj = await c('PATCH', '/v1/me', {
      profil: {
        pays: 'Bénin',
        region: 'Cotonou',
        devise: 'XOF',
        fuseau: 'Africa/Porto-Novo',
        unites: 'metriques',
        languePrincipale: 'fr',
      },
    });
    assert.equal(maj.statut, 200);
    assert.equal(((maj.json.compte as Json).profil as Json).pays, 'Bénin');

    const invalide = await c('PATCH', '/v1/me', { profil: { unites: 'romaines' } });
    assert.equal(invalide.statut, 400);

    const prefs = await c('PATCH', '/v1/preferences', {
      tonReponse: 'pedagogique',
      utiliserMemoire: false,
    });
    assert.equal(prefs.statut, 200);
    assert.equal((prefs.json.preferences as Json).tonReponse, 'pedagogique');
  });
});

describe('Suppression de compte (§16)', () => {
  test('confirmation par mot de passe, suppression complète, sessions invalidées', async () => {
    const c = client();
    await c('POST', '/auth/register', {
      email: 'del@test.dev',
      password: 'motdepasse123',
      nom: 'Del',
    });
    await c('POST', '/v1/conversations', { titre: 'À supprimer' });

    // Mauvais mot de passe → refus, rien n'est supprimé.
    const faux = await c('DELETE', '/v1/me', { password: 'incorrecte!!' });
    assert.equal(faux.statut, 401);
    assert.equal(faux.json.code, 'identifiants');
    assert.equal((await c('GET', '/v1/conversations')).statut, 200);

    // Bon mot de passe → suppression.
    const ok = await c('DELETE', '/v1/me', { password: 'motdepasse123' });
    assert.equal(ok.statut, 204);

    // Session immédiatement invalide.
    assert.equal((await c('GET', '/me')).statut, 401);
    assert.equal((await c('GET', '/v1/conversations')).statut, 401);

    // Le compte n'existe plus : reconnexion impossible.
    const c2 = client();
    const login = await c2('POST', '/auth/login', {
      email: 'del@test.dev',
      password: 'motdepasse123',
    });
    assert.equal(login.statut, 401);
  });

  test('les autres comptes restent intacts', async () => {
    const a = client();
    await a('POST', '/auth/register', {
      email: 'survivant@test.dev',
      password: 'motdepasse123',
      nom: 'Survie',
    });
    const conv = await a('POST', '/v1/conversations', { titre: 'Précieux' });

    const b = client();
    await b('POST', '/auth/register', {
      email: 'partant@test.dev',
      password: 'motdepasse123',
      nom: 'Partant',
    });
    assert.equal((await b('DELETE', '/v1/me', { password: 'motdepasse123' })).statut, 204);

    assert.equal((await a('GET', '/me')).statut, 200);
    assert.equal(
      (await a('GET', `/v1/conversations/${(conv.json.conversation as Json).id}`)).statut,
      200,
    );
  });
});
