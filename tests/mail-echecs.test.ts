/**
 * Un envoi refusé n'est pas « pas configuré ».
 *
 * Cas réel (novembre 2026) : le fournisseur refusait l'envoi (domaine non
 * vérifié) et l'interface affichait « l'envoi d'e-mails n'est pas configuré
 * sur cet environnement ». La configuration était bonne ; c'est le code
 * d'erreur qui était faux, et l'utilisateur — comme l'exploitant — partait
 * sur une fausse piste.
 *
 * Ces tests distinguent les deux causes, côté transport et côté routes :
 *   - `mail-indisponible` (503) : la configuration manque, aucun envoi tenté ;
 *   - `mail-refuse` (502) : la configuration est complète, le fournisseur a
 *     refusé ou n'a pas répondu.
 *
 *   node --import tsx --test tests/mail-echecs.test.ts
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer, type Server } from 'node:http';

const dossierData = mkdtempSync(path.join(tmpdir(), 'aura-mail-echec-'));
process.env.AURA_DATA_DIR = dossierData;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.AURA_VERIFICATION_EMAIL_OBLIGATOIRE;

const BASE_PROVIDER = 'https://mail.fournisseur.test';
const fetchReel = globalThis.fetch;
// Bouchon : seul le fournisseur est intercepté, le client de test continue
// de joindre le serveur local.
let reponseFournisseur: () => Response = () => new Response('{}', { status: 403 });
globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
  const cible = String(url);
  if (cible.startsWith(BASE_PROVIDER)) return reponseFournisseur();
  return fetchReel(url as never, init);
}) as typeof fetch;

const { envoyer, configurationMail } = await import('../server/mail/adaptateur');
const { default: handler } = await import('../api/index');

let serveur: Server;
let base = '';

type Json = Record<string, unknown> & { code?: string; envoiMail?: { ok: boolean; code?: string } };

function client() {
  let cookie = '';
  return async function appel(methode: string, route: string, corps?: unknown) {
    const r = await fetchReel(base + route, {
      method: methode,
      headers: {
        ...(corps !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
    });
    const pose = r.headers.getSetCookie?.() ?? [];
    if (pose.length) cookie = pose[0].split(';')[0];
    const json = (r.status === 204 ? {} : await r.json().catch(() => ({}))) as Json;
    return { statut: r.status, json };
  };
}

function configurerMail(actif: boolean) {
  if (actif) {
    process.env.AURA_MAIL_PROVIDER = 'resend';
    process.env.AURA_MAIL_API_KEY = 're_test_0000000000000000000000000';
    process.env.AURA_MAIL_FROM = 'AURA <bonjour@aura.test>';
    process.env.AURA_PUBLIC_ORIGIN = 'https://aura.test';
    process.env.AURA_MAIL_API_URL = BASE_PROVIDER;
    process.env.AURA_MAIL_TIMEOUT_MS = '2000';
  } else {
    for (const cle of [
      'AURA_MAIL_PROVIDER',
      'AURA_MAIL_API_KEY',
      'AURA_MAIL_FROM',
      'AURA_PUBLIC_ORIGIN',
      'AURA_MAIL_API_URL',
    ]) {
      delete process.env[cle];
    }
  }
}

before(async () => {
  serveur = createServer((req, res) => {
    const reste = (req.url ?? '/').replace(/^\/api\/?/, '').split('?')[0];
    (req as unknown as { query: Record<string, string> }).query = { __path: reste };
    void handler(req as never, res as never);
  });
  await new Promise<void>((resolve) => serveur.listen(0, '127.0.0.1', resolve));
  const adresse = serveur.address();
  base = typeof adresse === 'object' && adresse ? `http://127.0.0.1:${adresse.port}/api` : '';
});

after(async () => {
  globalThis.fetch = fetchReel;
  await new Promise<void>((resolve) => serveur.close(() => resolve()));
  rmSync(dossierData, { recursive: true, force: true });
});

describe('Transport : distinguer « pas configuré » de « refusé »', () => {
  test('configuration absente → mail-indisponible, sans appel réseau', async () => {
    configurerMail(false);
    assert.equal(configurationMail().ok, false);
    const r = await envoyer({ a: 'x@test.dev', sujet: 's', texte: 't', html: '<p>t</p>' });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, 'mail-indisponible');
  });

  test('configuration complète + refus du fournisseur → mail-refuse', async () => {
    configurerMail(true);
    reponseFournisseur = () =>
      new Response(
        JSON.stringify({ message: 'The aura.test domain is not verified.', name: 'validation_error' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    const r = await envoyer({ a: 'x@test.dev', sujet: 's', texte: 't', html: '<p>t</p>' });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.code, 'mail-refuse');
      assert.doesNotMatch(r.raison, /pas configuré/);
    }
  });

  test('quota du fournisseur → mail-refuse (pas une erreur de configuration)', async () => {
    configurerMail(true);
    reponseFournisseur = () => new Response('{}', { status: 429 });
    const r = await envoyer({ a: 'x@test.dev', sujet: 's', texte: 't', html: '<p>t</p>' });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, 'mail-refuse');
  });
});

describe('Routes : l’interface reçoit la vraie cause', () => {
  test('inscription : le résultat de l’envoi est annoncé', async () => {
    configurerMail(true);
    reponseFournisseur = () => new Response('{}', { status: 403 });
    const appel = client();
    const r = await appel('POST', '/auth/register', {
      email: `refus-${Date.now()}@test.dev`,
      password: 'motdepasse123',
      nom: 'Refus',
    });
    assert.equal(r.statut, 201);
    assert.equal(r.json.mailConfigure, true);
    assert.equal(r.json.envoiMail?.ok, false);
    assert.equal(r.json.envoiMail?.code, 'mail-refuse');
  });

  test('renvoi : 502 mail-refuse quand le fournisseur refuse', async () => {
    configurerMail(true);
    reponseFournisseur = () => new Response('{}', { status: 403 });
    const appel = client();
    await appel('POST', '/auth/register', {
      email: `renvoi-${Date.now()}@test.dev`,
      password: 'motdepasse123',
      nom: 'Renvoi',
    });
    const renvoi = await appel('POST', '/v1/me/email/renvoyer', { langue: 'fr' });
    assert.equal(renvoi.statut, 502);
    assert.equal(renvoi.json.code, 'mail-refuse');
    assert.doesNotMatch(String(renvoi.json.error), /pas configuré/);
  });

  test('renvoi : 503 mail-indisponible quand la configuration manque', async () => {
    // Compte créé alors que l'envoi est possible…
    configurerMail(true);
    reponseFournisseur = () => new Response('{}', { status: 200 });
    const appel = client();
    await appel('POST', '/auth/register', {
      email: `sansmail-${Date.now()}@test.dev`,
      password: 'motdepasse123',
      nom: 'SansMail',
    });
    // …puis configuration retirée (simule un environnement mal réglé).
    configurerMail(false);
    const renvoi = await appel('POST', '/v1/me/email/renvoyer', { langue: 'fr' });
    assert.equal(renvoi.statut, 503);
    assert.equal(renvoi.json.code, 'mail-indisponible');
    assert.match(String(renvoi.json.error), /pas configuré/i);
  });

  test('renvoi accepté : 202 quand le fournisseur répond 200', async () => {
    configurerMail(true);
    reponseFournisseur = () => new Response('{"id":"test"}', { status: 200 });
    const appel = client();
    await appel('POST', '/auth/register', {
      email: `ok-${Date.now()}@test.dev`,
      password: 'motdepasse123',
      nom: 'Ok',
    });
    const renvoi = await appel('POST', '/v1/me/email/renvoyer', { langue: 'fr' });
    assert.equal(renvoi.statut, 202);
  });
});
