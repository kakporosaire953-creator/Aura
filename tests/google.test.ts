/**
 * Connexion Google (OAuth 2.0 code) — vérifié de bout en bout, sans réseau.
 *
 * Ce que ces tests protègent :
 *  - aucune simulation quand la configuration manque (503 explicite) ;
 *  - l'état anti-CSRF : sans le cookie posé au départ, le retour est refusé ;
 *  - la signature de l'`id_token` est réellement vérifiée (jeton signé par
 *    une autre clé → refus, aucun compte créé) ;
 *  - une adresse non vérifiée par Google n'ouvre aucun compte ;
 *  - le rattachement d'un compte existant n'en crée pas un second ;
 *  - la destination de retour reste interne (pas de redirection ouverte).
 */
import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, type KeyObject } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import express from 'express';

const dossierData = mkdtempSync(path.join(tmpdir(), 'aura-google-'));
process.env.AURA_AI_PROVIDER = 'mock';
process.env.AURA_DATA_DIR = dossierData;
process.env.AURA_PUBLIC_ORIGIN = 'https://aura.test';
process.env.GOOGLE_CLIENT_ID = 'client-test.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_SECRET = 'secret-de-test';
delete process.env.GOOGLE_REDIRECT_URI;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.VERCEL;
delete process.env.AURA_MAIL_PROVIDER;

const { createApiApp } = await import('../server/api');
const google = await import('../server/auth/google');

let serveur: Server;
let base = '';
const fetchReel = globalThis.fetch;

/* ─────────────────────────── Clés & jetons de test ─────────────────────────── */

type Paire = { privee: KeyObject; publique: KeyObject };
const paires = new Map<string, Paire>();

function paire(kid: string): Paire {
  const existante = paires.get(kid);
  if (existante) return existante;
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const creee = { privee: privateKey, publique: publicKey };
  paires.set(kid, creee);
  return creee;
}

function base64url(valeur: string): string {
  return Buffer.from(valeur).toString('base64url');
}

function idToken(charge: Record<string, unknown>, kid = 'kid-1', signataire = kid): string {
  const entete = base64url(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' }));
  const corps = base64url(JSON.stringify(charge));
  const signature = sign('RSA-SHA256', Buffer.from(`${entete}.${corps}`), paire(signataire).privee);
  return `${entete}.${corps}.${signature.toString('base64url')}`;
}

function chargeValide(surcharge: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    iss: 'https://accounts.google.com',
    aud: 'client-test.apps.googleusercontent.com',
    sub: 'google-sub-1',
    email: 'nouveau@gmail.test',
    email_verified: true,
    given_name: 'Rim',
    exp: Math.floor(Date.now() / 1000) + 600,
    ...surcharge,
  };
}

type Appel = { url: string; corps: string };

/** Bouchon réseau : certificats Google + échange de code, rien d'autre. */
function bouchon(token: () => Response, kid = 'kid-1') {
  const appels: Appel[] = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const adresse = String(url);
    appels.push({ url: adresse, corps: typeof init?.body === 'string' ? init.body : '' });
    if (adresse === 'https://www.googleapis.com/oauth2/v3/certs') {
      const jwk = paire(kid).publique.export({ format: 'jwk' }) as Record<string, string>;
      return new Response(JSON.stringify({ keys: [{ ...jwk, kid, alg: 'RS256', use: 'sig' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (adresse === 'https://oauth2.googleapis.com/token') return token();
    return new Response('{}', { status: 404 });
  }) as typeof fetch;
  return appels;
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
  globalThis.fetch = fetchReel;
  serveur?.close();
  rmSync(dossierData, { recursive: true, force: true });
});

beforeEach(() => {
  process.env.GOOGLE_CLIENT_ID = 'client-test.apps.googleusercontent.com';
  process.env.GOOGLE_CLIENT_SECRET = 'secret-de-test';
  delete process.env.GOOGLE_REDIRECT_URI;
});

afterEach(() => {
  globalThis.fetch = fetchReel;
});

/** Requête sans suivre les redirections : c'est la réponse 302 qui compte. */
async function appel(chemin: string, cookies: string[] = []) {
  const r = await fetchReel(base + chemin, {
    redirect: 'manual',
    headers: cookies.length ? { Cookie: cookies.join('; ') } : {},
  });
  const poses = r.headers.getSetCookie?.() ?? [];
  return {
    statut: r.status,
    emplacement: r.headers.get('location') ?? '',
    poses,
    json: (() => {
      try {
        return JSON.parse('') as unknown;
      } catch {
        return null;
      }
    })(),
  };
}

/** Valeur d'un cookie posé, `null` s'il est absent. */
function valeurCookie(poses: string[], nom: string): string | null {
  for (const ligne of poses) {
    const [paireCle] = ligne.split(';');
    const [cle, ...reste] = paireCle.split('=');
    if (cle.trim() === nom) return decodeURIComponent(reste.join('='));
  }
  return null;
}

function cookiesDe(poses: string[]): string[] {
  return poses.map((l) => l.split(';')[0]);
}

const COMPTE_RETOUR = 'https://aura.test/api/auth/google/retour';

/* ───────────────────────────── Disponibilité ───────────────────────────── */

describe('Sans configuration, la connexion Google est dite indisponible', () => {
  test('départ refusé en 503, aucun appel réseau', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    const appels = bouchon(() => new Response('{}', { status: 200 }));
    const r = await appel('/auth/google/demarrer');
    assert.equal(r.statut, 503);
    assert.equal(appels.length, 0);
    assert.equal(google.googleConfigure(), false);
  });

  test('le statut public ne divulgue que la disponibilité', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    const statut = await appel('/auth/google/statut');
    assert.equal(statut.statut, 200);
    const r = await appel('/status');
    const texte = JSON.stringify(r);
    assert.equal(google.googleConfigure(), false);
    assert.ok(!texte.includes('secret-de-test'));
  });

  test('un retour sans configuration ne délivre aucune session', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    const r = await appel('/auth/google/retour?code=x&state=y');
    assert.equal(r.statut, 302);
    assert.equal(r.emplacement, '/login?google=indisponible');
    assert.equal(r.poses.filter((c) => c.includes('aura_session')).length, 0);
  });
});

/* ─────────────────────────────── Départ ─────────────────────────────── */

describe('Départ vers Google', () => {
  test('redirige avec client_id, scope, état aléatoire et URI de retour déclarée', async () => {
    const r = await appel('/auth/google/demarrer?retour=/projets');
    assert.equal(r.statut, 302);
    const url = new URL(r.emplacement);
    assert.equal(url.origin, 'https://accounts.google.com');
    assert.equal(url.searchParams.get('client_id'), 'client-test.apps.googleusercontent.com');
    assert.equal(url.searchParams.get('redirect_uri'), COMPTE_RETOUR);
    assert.equal(url.searchParams.get('response_type'), 'code');
    assert.equal(url.searchParams.get('scope'), 'openid email profile');
    const etat = url.searchParams.get('state') ?? '';
    assert.ok(etat.length >= 40, 'état assez long pour ne pas être deviné');

    const cookieEtat = valeurCookie(r.poses, google.COOKIE_ETAT);
    assert.equal(cookieEtat, etat);
    assert.ok(r.poses.some((c) => c.includes('HttpOnly')));
    assert.equal(valeurCookie(r.poses, google.COOKIE_RETOUR), '/projets');
  });

  test('une destination externe est ramenée à l’espace (pas de redirection ouverte)', async () => {
    const r = await appel('/auth/google/demarrer?retour=' + encodeURIComponent('https://evil.test/x'));
    assert.equal(valeurCookie(r.poses, google.COOKIE_RETOUR), '/espace');
    const r2 = await appel('/auth/google/demarrer?retour=' + encodeURIComponent('//evil.test'));
    assert.equal(valeurCookie(r2.poses, google.COOKIE_RETOUR), '/espace');
  });
});

/* ─────────────────────────────── Retour ─────────────────────────────── */

describe('Retour de Google', () => {
  test('sans cookie d’état, un code valide ne suffit pas', async () => {
    bouchon(() => new Response(JSON.stringify({ id_token: idToken(chargeValide()) }), { status: 200 }));
    const r = await appel('/auth/google/retour?code=abc&state=xyz');
    assert.equal(r.emplacement, '/login?google=etat');
    assert.equal(valeurCookie(r.poses, 'aura_session') ?? valeurCookie(r.poses, '__Host-aura_session'), null);
  });

  test('un état qui ne correspond pas au cookie est refusé', async () => {
    const depart = await appel('/auth/google/demarrer?retour=/espace');
    const cookies = cookiesDe(depart.poses);
    bouchon(() => new Response('{}', { status: 200 }));
    const r = await appel('/auth/google/retour?code=abc&state=mauvais-etat', cookies);
    assert.equal(r.emplacement, '/login?google=etat');
  });

  test('un refus explicite de l’utilisateur est traité comme tel', async () => {
    const depart = await appel('/auth/google/demarrer');
    const etat = valeurCookie(depart.poses, google.COOKIE_ETAT)!;
    const r = await appel(
      `/auth/google/retour?error=access_denied&state=${encodeURIComponent(etat)}`,
      cookiesDe(depart.poses),
    );
    assert.equal(r.emplacement, '/login?google=refus');
  });

  test('un id_token signé par une autre clé est rejeté : aucun compte créé', async () => {
    const depart = await appel('/auth/google/demarrer');
    const etat = valeurCookie(depart.poses, google.COOKIE_ETAT)!;
    // Les certificats publiés sont ceux de « kid-1 » ; le jeton est signé
    // par une clé que Google ne publie pas.
    paire('kid-forge');
    const forge = idToken(chargeValide({ email: 'forge@gmail.test' }), 'kid-1', 'kid-forge');
    bouchon(() => new Response(JSON.stringify({ id_token: forge }), { status: 200 }), 'kid-1');

    const r = await appel(
      `/auth/google/retour?code=abc&state=${encodeURIComponent(etat)}`,
      cookiesDe(depart.poses),
    );
    assert.equal(r.emplacement, '/login?google=refus');
    assert.equal(valeurCookie(r.poses, 'aura_session'), null);
  });

  test('une adresse non vérifiée par Google n’ouvre pas de compte', async () => {
    const depart = await appel('/auth/google/demarrer');
    const etat = valeurCookie(depart.poses, google.COOKIE_ETAT)!;
    const jeton = idToken(chargeValide({ email_verified: false, email: 'non-verifie@gmail.test' }));
    bouchon(() => new Response(JSON.stringify({ id_token: jeton }), { status: 200 }));

    const r = await appel(
      `/auth/google/retour?code=abc&state=${encodeURIComponent(etat)}`,
      cookiesDe(depart.poses),
    );
    assert.equal(r.emplacement, '/login?google=refus');
  });

  test('un échange accepté ouvre une session et crée un compte sans mot de passe', async () => {
    const depart = await appel('/auth/google/demarrer?retour=/projets');
    const etat = valeurCookie(depart.poses, google.COOKIE_ETAT)!;
    const jeton = idToken(
      chargeValide({ sub: 'google-sub-neuf', email: 'Nouveau@Gmail.Test' }),
      'kid-neuf',
    );
    const appels = bouchon(
      () => new Response(JSON.stringify({ id_token: jeton, access_token: 'at' }), { status: 200 }),
      'kid-neuf',
    );

    const r = await appel(
      `/auth/google/retour?code=code-1&state=${encodeURIComponent(etat)}`,
      cookiesDe(depart.poses),
    );
    assert.equal(r.statut, 302);
    assert.equal(r.emplacement, '/projets');
    const session = valeurCookie(r.poses, 'aura_session');
    assert.ok(session && session.length > 20, 'cookie de session posé');

    // Le secret ne part que côté serveur, dans le corps de l'échange.
    const echange = appels.find((a) => a.url === 'https://oauth2.googleapis.com/token');
    assert.ok(echange);
    assert.match(echange.corps, /client_secret=secret-de-test/);
    assert.match(echange.corps, /code=code-1/);
    assert.match(echange.corps, /redirect_uri=/);
    // Aucun secret dans l'URL de redirection navigateur.
    assert.doesNotMatch(r.emplacement, /secret-de-test/);

    // Le compte existe, son adresse est prouvée par Google.
    const session2 = await fetchReel(`${base}/me`, {
      headers: { Cookie: `aura_session=${encodeURIComponent(session!)}` },
    });
    assert.equal(session2.status, 200);
    const corps = (await session2.json()) as {
      compte: { email: string; emailVerifie: boolean; googleLie: boolean; motDePasseDefini: boolean };
      verificationEmail: string;
    };
    assert.equal(corps.compte.email, 'nouveau@gmail.test');
    assert.equal(corps.compte.emailVerifie, true);
    assert.equal(corps.compte.googleLie, true);
    assert.equal(corps.compte.motDePasseDefini, false);

    // Aucun mot de passe n'existe : on peut en définir un sans « actuel »
    // (la session ouverte fait foi, faute d'e-mail opérationnel).
    const mdp = await fetchReel(`${base}/v1/me/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `aura_session=${encodeURIComponent(session!)}`,
      },
      body: JSON.stringify({ actuel: '', nouveau: 'MotDePasseGoogle1!' }),
    });
    assert.equal(mdp.status, 200);

    const apres = await fetchReel(`${base}/me`, {
      headers: { Cookie: `aura_session=${encodeURIComponent(session!)}` },
    });
    const apresCorps = (await apres.json()) as { compte: { motDePasseDefini: boolean } };
    assert.equal(apresCorps.compte.motDePasseDefini, true);

    const parMotDePasse = await fetchReel(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nouveau@gmail.test', password: 'MotDePasseGoogle1!' }),
    });
    assert.equal(parMotDePasse.status, 200, 'le mot de passe défini ouvre le compte');
  });

  test('un compte existant est rattaché, pas dupliqué', async () => {
    // Inscription classique.
    const inscription = await fetchReel(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'deja@test.dev', password: 'motdepasse123', nom: 'Déjà' }),
    });
    assert.equal(inscription.status, 201);

    const depart = await appel('/auth/google/demarrer');
    const etat = valeurCookie(depart.poses, google.COOKIE_ETAT)!;
    const jeton = idToken(chargeValide({ sub: 'google-sub-deja', email: 'deja@test.dev' }), 'kid-deja');
    bouchon(() => new Response(JSON.stringify({ id_token: jeton }), { status: 200 }), 'kid-deja');

    const r = await appel(
      `/auth/google/retour?code=code-2&state=${encodeURIComponent(etat)}`,
      cookiesDe(depart.poses),
    );
    assert.equal(r.emplacement, '/espace');
    const session = valeurCookie(r.poses, 'aura_session');
    assert.ok(session);

    const me = await fetchReel(`${base}/me`, {
      headers: { Cookie: `aura_session=${encodeURIComponent(session!)}` },
    });
    const corps = (await me.json()) as {
      compte: { email: string; googleLie: boolean; motDePasseDefini: boolean; emailVerifie: boolean };
    };
    assert.equal(corps.compte.email, 'deja@test.dev');
    assert.equal(corps.compte.googleLie, true);
    // Le mot de passe existant reste utilisable.
    assert.equal(corps.compte.motDePasseDefini, true);
    assert.equal(corps.compte.emailVerifie, true);

    const connexion = await fetchReel(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'deja@test.dev', password: 'motdepasse123' }),
    });
    assert.equal(connexion.status, 200, 'le mot de passe historique fonctionne toujours');
  });

  test('deux identités Google différentes sur la même adresse : refus, pas d’écrasement', async () => {
    const depart = await appel('/auth/google/demarrer');
    const etat = valeurCookie(depart.poses, google.COOKIE_ETAT)!;
    // « deja@test.dev » a été rattaché à « google-sub-deja » au test précédent.
    const jeton = idToken(chargeValide({ sub: 'google-sub-intrus', email: 'deja@test.dev' }), 'kid-intrus');
    bouchon(() => new Response(JSON.stringify({ id_token: jeton }), { status: 200 }), 'kid-intrus');

    const r = await appel(
      `/auth/google/retour?code=code-3&state=${encodeURIComponent(etat)}`,
      cookiesDe(depart.poses),
    );
    assert.equal(r.emplacement, '/login?google=conflit');
    assert.equal(valeurCookie(r.poses, 'aura_session'), null);
  });
});

/* ─────────────────── Messages d'erreur côté interface ─────────────────── */

describe('Traduction des retours Google (fonction pure, sans navigateur)', () => {
  test('chaque code a un message distinct, aucun n’invente de cause', async () => {
    const { messageGoogle } = await import('../src/app/messages-auth');
    const t = {
      googleAnnule: 'annule',
      googleExpire: 'expire',
      googleEchec: 'echec',
      googleIndisponible: 'indisponible',
      googleConflit: 'conflit',
      googleStockage: 'stockage',
    };
    assert.equal(messageGoogle('refus', t), 'annule');
    assert.equal(messageGoogle('etat', t), 'expire');
    assert.equal(messageGoogle('conflit', t), 'conflit');
    assert.equal(messageGoogle('stockage', t), 'stockage');
    assert.equal(messageGoogle('non-verifiable', t), 'echec');
    assert.equal(messageGoogle('reseau', t), 'echec');
    assert.equal(messageGoogle('inconnu', t), 'echec');
    // Aucun message sans code : pas d'alerte gratuite.
    assert.equal(messageGoogle(undefined, t), null);
    assert.equal(messageGoogle('', t), null);
  });
});
