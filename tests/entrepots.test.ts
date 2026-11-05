/**
 * Tests unitaires des entrepôts (persistance) : CRUD, périmètre
 * propriétaire, plafonds, migrations. Pilote fichier temporaire.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const dossier = mkdtempSync(path.join(tmpdir(), 'aura-db-'));
process.env.AURA_DATA_DIR = dossier;

const { baseDeDonnees, entrepotComptes, entrepotDonnees, migrerDonnees, migrerAncienDepot, nouvelId, profilParDefaut, preferencesParDefaut } =
  await import('../server/db/entrepots');

after(() => rmSync(dossier, { recursive: true, force: true }));

describe('EntrepotDonnees', () => {
  test('conversations et messages : CRUD + suppression en cascade', async () => {
    const d = entrepotDonnees('u1');
    const conv = await d.creerConversation({
      id: nouvelId('conv'),
      titre: 'Fil',
      projectId: null,
      archive: false,
      cree: new Date().toISOString(),
      maj: new Date().toISOString(),
    });
    await d.ajouterMessage({
      id: nouvelId('msg'),
      conversationId: conv.id,
      role: 'user',
      contenu: 'salut',
      statut: 'envoye',
      cree: new Date().toISOString(),
      meta: null,
    });
    assert.equal((await d.messages(conv.id)).length, 1);
    await d.supprimerConversation(conv.id);
    assert.equal((await d.messages(conv.id)).length, 0);
    assert.equal(await d.conversation(conv.id), null);
  });

  test('isolation : chaque user ne voit que ses données', async () => {
    const d1 = entrepotDonnees('iso1');
    const d2 = entrepotDonnees('iso2');
    const m = await d1.creerMission({
      id: nouvelId('msn'),
      projectId: null,
      titre: 'Privée',
      description: '',
      priorite: 'moyenne',
      statut: 'a_faire',
      echeance: null,
      ordre: 0,
      sousTaches: [],
      notes: '',
      cree: new Date().toISOString(),
      maj: new Date().toISOString(),
    });
    assert.equal(await d2.mission(m.id), null);
    assert.equal((await d2.missions()).length, 0);
    assert.equal(await d2.majMission(m.id, { titre: 'volé' }), null);
  });

  test('suppression projet détache les éléments rattachés', async () => {
    const d = entrepotDonnees('u3');
    const p = await d.creerProjet({
      id: nouvelId('prj'),
      nom: 'P',
      description: '',
      objectif: '',
      categorie: '',
      instructions: '',
      statut: 'actif',
      cree: new Date().toISOString(),
      maj: new Date().toISOString(),
    });
    const mission = await d.creerMission({
      id: nouvelId('msn'),
      projectId: p.id,
      titre: 'T',
      description: '',
      priorite: 'basse',
      statut: 'a_faire',
      echeance: null,
      ordre: 0,
      sousTaches: [],
      notes: '',
      cree: new Date().toISOString(),
      maj: new Date().toISOString(),
    });
    await d.supprimerProjet(p.id);
    const apres = await d.mission(mission.id);
    assert.equal(apres?.projectId, null);
  });

  test('plafond de messages par fil', async () => {
    const d = entrepotDonnees('u4');
    const conv = await d.creerConversation({
      id: nouvelId('conv'),
      titre: 'Long',
      projectId: null,
      archive: false,
      cree: new Date().toISOString(),
      maj: new Date().toISOString(),
    });
    for (let i = 0; i < 305; i++) {
      await d.ajouterMessage({
        id: nouvelId('msg'),
        conversationId: conv.id,
        role: 'user',
        contenu: `m${i}`,
        statut: 'envoye',
        cree: new Date().toISOString(),
        meta: null,
      });
    }
    const messages = await d.messages(conv.id, { limite: 500 });
    assert.equal(messages.length, 300);
    assert.equal(messages[messages.length - 1].contenu, 'm304');
  });
});

describe('Migrations', () => {
  test('migrerDonnees complète un ancien schéma', () => {
    const d = migrerDonnees({
      schemaVersion: 1,
      missions: [{ id: 'm1', titre: 'Ancienne' }],
      creations: [{ id: 'c1', titre: 'Old' }],
      conversations: [{ id: 'v1', titre: 'F' }],
    });
    assert.equal(d.missions[0].sousTaches.length, 0);
    assert.equal(d.missions[0].statut, 'a_faire');
    assert.equal(d.creations[0].versions.length, 0);
    assert.equal(d.conversations[0].projectId, null);
  });

  test('migrerAncienDepot importe les comptes historiques', async () => {
    const base = baseDeDonnees();
    const ancien = path.join(dossier, 'comptes-legacy.json');
    writeFileSync(
      ancien,
      JSON.stringify({
        utilisateurs: [
          {
            id: 'legacy1',
            email: 'legacy@test.dev',
            nom: 'Legacy',
            hash: 'ab',
            sel: 'cd',
            cree: '2026-01-01T00:00:00Z',
            onboarding: { fait: false, objectif: null },
          },
        ],
        sessions: [],
      }),
      'utf8',
    );
    await migrerAncienDepot(base, ancien);
    const comptes = entrepotComptes();
    const u = await comptes.parEmail('legacy@test.dev');
    assert.equal(u?.id, 'legacy1');
    assert.equal(u?.profil.unites, 'metriques');
  });
});

describe('Comptes et sessions', () => {
  test('création, recherche par email, sessions expirées purgées', async () => {
    const comptes = entrepotComptes();
    await comptes.creer({
      id: 'u-sess',
      email: 'sess@test.dev',
      nom: 'S',
      hash: 'x',
      sel: 'y',
      cree: new Date().toISOString(),
      onboarding: { fait: false, objectif: null },
      profil: profilParDefaut(),
      preferences: preferencesParDefaut(),
    });
    assert.ok(await comptes.parEmail('sess@test.dev'));
    await comptes.creerSession({
      id: 'exp',
      userId: 'u-sess',
      expire: Date.now() - 1000,
      cree: new Date().toISOString(),
    });
    assert.equal(await comptes.sessionParEmpreinte('exp'), null);
  });
});
