/**
 * Confirmation d'adresse obligatoire avant l'accès à l'espace.
 *
 * Trois états sont vérifiés ici, parce qu'ils n'ont pas les mêmes
 * conséquences pour l'utilisateur :
 *  - `obligatoire` : un compte non confirmé reçoit 403 `email-non-verifie`
 *    sur tout le workspace, mais garde l'accès à /me et au renvoi du lien ;
 *  - `impossible` : aucun e-mail ne peut partir ; exiger la confirmation
 *    enfermerait tout le monde, l'accès reste donc ouvert ;
 *  - `facultative` : l'administrateur l'a désactivée explicitement.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import express from 'express';

const dossierData = mkdtempSync(path.join(tmpdir(), 'aura-verif-'));
process.env.AURA_AI_PROVIDER = 'mock';
process.env.AURA_DATA_DIR = dossierData;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.VERCEL;
delete process.env.AURA_VERIFICATION_EMAIL_OBLIGATOIRE;
// Un point d'entrée local injoignable : aucun appel réseau réel pendant les tests.
process.env.AURA_MAIL_PROVIDER = '';
process.env.AURA_MAIL_API_KEY = '';
process.env.AURA_MAIL_FROM = '';
process.env.AURA_PUBLIC_ORIGIN = '';

const { createApiApp } = await import('../server/api');
const { etatVerification, accesAutorise } = await import('../server/auth/verification');

let serveur: Server;
let base: string;

type Json = Record<string, unknown> & { error?: string; code?: string };

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

function configurerMail(actif: boolean) {
  if (actif) {
    process.env.AURA_MAIL_PROVIDER = 'resend';
    process.env.AURA_MAIL_API_KEY = 're_test_0000000000000000000000000';
    process.env.AURA_MAIL_FROM = 'AURA <bonjour@aura.test>';
    process.env.AURA_PUBLIC_ORIGIN = 'https://aura.test';
    // Aucun envoi ne doit partir : on pointe vers une adresse locale fermée.
    process.env.AURA_MAIL_API_URL = 'http://127.0.0.1:9';
    process.env.AURA_MAIL_TIMEOUT_MS = '1000';
  } else {
    process.env.AURA_MAIL_PROVIDER = '';
    process.env.AURA_MAIL_API_KEY = '';
    process.env.AURA_MAIL_FROM = '';
    process.env.AURA_PUBLIC_ORIGIN = '';
    delete process.env.AURA_MAIL_API_URL;
  }
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

describe('Règle de confirmation d’adresse', () => {
  test('sans fournisseur d’e-mails, la règle est « impossible » et n’enferme personne', () => {
    configurerMail(false);
    delete process.env.AURA_VERIFICATION_EMAIL_OBLIGATOIRE;
    assert.equal(etatVerification(), 'impossible');
    assert.equal(accesAutorise({ emailVerifie: false }), true);
  });

  test('désactivation explicite par l’administrateur', () => {
    process.env.AURA_VERIFICATION_EMAIL_OBLIGATOIRE = '0';
    assert.equal(etatVerification(), 'facultative');
    assert.equal(accesAutorise({ emailVerifie: false }), true);
    delete process.env.AURA_VERIFICATION_EMAIL_OBLIGATOIRE;
  });

  test('avec fournisseur d’e-mails, la confirmation devient obligatoire', () => {
    configurerMail(true);
    assert.equal(etatVerification(), 'obligatoire');
    assert.equal(accesAutorise({ emailVerifie: false }), false);
    assert.equal(accesAutorise({ emailVerifie: true }), true);
    assert.equal(accesAutorise(null), false);
  });

  test('confirmation exigée sans fournisseur : l’inscription est refusée, pas simulée', async () => {
    configurerMail(false);
    process.env.AURA_VERIFICATION_EMAIL_OBLIGATOIRE = '1';
    const appel = client();
    const r = await appel('POST', '/auth/register', {
      email: 'sans-mail@test.dev',
      password: 'motdepasse123',
      nom: 'SM',
    });
    assert.equal(r.statut, 503);
    assert.equal(r.json.code, 'mail-indisponible');
    delete process.env.AURA_VERIFICATION_EMAIL_OBLIGATOIRE;
  });
});

describe('État public : /api/status dit ce qui reste à configurer', () => {
  test('sans fournisseur d’e-mails, l’état le dit sans secret', async () => {
    configurerMail(false);
    delete process.env.AURA_VERIFICATION_EMAIL_OBLIGATOIRE;
    const appel = client();
    const r = await appel('GET', '/status');
    assert.equal(r.statut, 200);
    const config = r.json.config as Json;
    assert.equal(config.mailConfiguree, false);
    assert.equal(config.verificationEmail, 'impossible');
    const setup = r.json.setup as Json;
    assert.match(String(setup.mail), /non configuré/);
    // Aucune valeur d'environnement ni nom de fournisseur ne doit fuiter.
    assert.doesNotMatch(JSON.stringify(r.json), /re_test|resend|AURA_MAIL_API_KEY/i);
  });

  test('avec fournisseur, la confirmation redevient obligatoire', async () => {
    configurerMail(true);
    const appel = client();
    const r = await appel('GET', '/status');
    const config = r.json.config as Json;
    assert.equal(config.mailConfiguree, true);
    assert.equal(config.verificationEmail, 'obligatoire');
    assert.equal((r.json.setup as Json).mail, undefined);
    configurerMail(false);
  });
});

describe('Garde de l’interface (règle front, sans navigateur)', () => {
  test('l’écran d’attente ne s’affiche que si la confirmation est exigible', async () => {
    const { confirmationRequise } = await import('../src/app/gardes');
    // Adresse non confirmée, e-mails possibles → espace fermé.
    assert.equal(confirmationRequise({ emailVerifie: false }, 'obligatoire'), true);
    assert.equal(confirmationRequise({ emailVerifie: undefined }, 'obligatoire'), true);
    // Adresse confirmée → espace ouvert.
    assert.equal(confirmationRequise({ emailVerifie: true }, 'obligatoire'), false);
    // Règle désactivée ou inapplicable → jamais d’enfermement.
    assert.equal(confirmationRequise({ emailVerifie: false }, 'facultative'), false);
    assert.equal(confirmationRequise({ emailVerifie: false }, 'impossible'), false);
    assert.equal(confirmationRequise(null, 'obligatoire'), true);
  });
});

describe('Accès à l’espace d’un compte non confirmé', () => {
  test('workspace fermé, profil et renvoi accessibles, ouverture après confirmation', async () => {
    configurerMail(true);
    const appel = client();
    const inscription = await appel('POST', '/auth/register', {
      email: 'attente@test.dev',
      password: 'motdepasse123',
      nom: 'Att',
    });
    assert.equal(inscription.statut, 201);
    assert.equal((inscription.json.compte as Json).emailVerifie, false);

    const me = await appel('GET', '/me');
    assert.equal(me.statut, 200);
    assert.equal(me.json.verificationEmail, 'obligatoire');

    // Toutes les routes du workspace sont fermées…
    for (const route of ['/v1/conversations', '/v1/studio/jobs', '/v1/projets', '/v1/missions', '/chat']) {
      const r = await appel(route === '/chat' ? 'POST' : 'GET', route, route === '/chat' ? { messages: [] } : undefined);
      assert.equal(r.statut, 403, route);
      assert.equal(r.json.code, 'email-non-verifie', route);
    }

    // …mais l'utilisateur n'est jamais enfermé : il peut demander un lien.
    const renvoi = await appel('POST', '/v1/me/email/renvoyer', { langue: 'fr' });
    assert.notEqual(renvoi.statut, 403, 'le renvoi doit rester accessible');
    assert.notEqual(renvoi.statut, 401, 'le renvoi doit rester accessible');

    // Après confirmation (simulée en base, comme le ferait /auth/verify-email),
    // l'espace s'ouvre.
    const { entrepotComptes } = await import('../server/db/entrepots');
    const comptes = entrepotComptes();
    const compte = await comptes.parEmail('attente@test.dev');
    assert.ok(compte);
    compte!.emailVerifie = true;
    await comptes.enregistrer(compte!);

    const apres = await appel('GET', '/v1/conversations');
    assert.equal(apres.statut, 200);
  });

  test('désactivation : l’espace reste ouvert malgré une adresse non confirmée', async () => {
    configurerMail(true);
    process.env.AURA_VERIFICATION_EMAIL_OBLIGATOIRE = '0';
    const appel = client();
    await appel('POST', '/auth/register', {
      email: 'libre@test.dev',
      password: 'motdepasse123',
      nom: 'Libre',
    });
    const r = await appel('GET', '/v1/conversations');
    assert.equal(r.statut, 200);
    delete process.env.AURA_VERIFICATION_EMAIL_OBLIGATOIRE;
    configurerMail(false);
  });
});
