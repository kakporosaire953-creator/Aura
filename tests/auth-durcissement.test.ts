/**
 * Durcissement de l'authentification (mission 07).
 *
 * Ces tests n'écrivent que dans une base de test isolée (dossier temporaire,
 * pilote fichier) : aucun compte réel, aucun accès réseau, aucun envoi.
 *   node --import tsx --test tests/auth-durcissement.test.ts
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import express from 'express';

const dossierData = mkdtempSync(path.join(tmpdir(), 'aura-auth-'));
process.env.AURA_AI_PROVIDER = 'mock';
process.env.AURA_DATA_DIR = dossierData;
process.env.NODE_ENV = 'test';
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.VERCEL;

const { createApiApp, configurerConfianceProxy } = await import('../server/api');
const { entrepotComptes, baseDeDonnees } = await import('../server/db/entrepots');
const { empreinteJeton, nomCookieSession, lireJetonSession, COOKIE_SESSION } = await import(
  '../server/accounts'
);
const { compterTentative, ipClient, empreinteIdentifiant, reinitialiserLimitesLocales } =
  await import('../server/v1/limite');
const { enTetesDocument, enTetesHsts, CONTENU_SECURITE } = await import('../server/en-tetes');
const { destinationApresConnexion } = await import('../src/app/retour');
const { decisionGarde } = await import('../src/app/garde-etat');

/* ── Mini navigateur : localStorage en mémoire, avant tout import du mode démo ── */

const magasin = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (cle: string) => (magasin.has(cle) ? (magasin.get(cle) as string) : null),
  setItem: (cle: string, valeur: string) => void magasin.set(cle, String(valeur)),
  removeItem: (cle: string) => void magasin.delete(cle),
  clear: () => magasin.clear(),
  key: (i: number) => [...magasin.keys()][i] ?? null,
  get length() {
    return magasin.size;
  },
} as Storage;

const simulation = await import('../src/app/simulation');

type Json = Record<string, unknown> & { error?: string; code?: string };

let serveur: Server;
let base: string;

/** Client HTTP qui conserve les cookies, comme un navigateur. */
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
    const json = (r.status === 204 ? {} : await r.json().catch(() => ({}))) as Json;
    return { statut: r.status, json, entetes: r.headers, setCookie };
  };
  appel.cookie = () => cookie;
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
  rmSync(dossierData, { recursive: true, force: true });
});

/* ───────────────────────── Phase 3 : destination ───────────────────────── */

describe('Garde des routes privées — destination conservée', () => {
  test('un chemin interne est restitué tel quel', () => {
    assert.equal(destinationApresConnexion('/chat/abc?onglet=2'), '/chat/abc?onglet=2');
    assert.equal(destinationApresConnexion('/parametres'), '/parametres');
    assert.equal(destinationApresConnexion('/app'), '/app');
  });

  test('une destination externe est refusée (pas de redirection ouverte)', () => {
    assert.equal(destinationApresConnexion('https://exemple.test/piege'), '/app');
    assert.equal(destinationApresConnexion('//exemple.test/piege'), '/app');
    assert.equal(destinationApresConnexion('/\\exemple.test'), '/app');
    assert.equal(destinationApresConnexion('javascript:alert(1)'), '/app');
    assert.equal(destinationApresConnexion(''), '/app');
    assert.equal(destinationApresConnexion(undefined), '/app');
    assert.equal(destinationApresConnexion(42), '/app');
  });

  test("revenir sur l'authentification n'a pas de sens", () => {
    assert.equal(destinationApresConnexion('/login'), '/app');
    assert.equal(destinationApresConnexion('/login?depuis=/chat'), '/app');
    assert.equal(destinationApresConnexion('/register'), '/app');
  });

  test('un secours explicite est respecté', () => {
    assert.equal(destinationApresConnexion(null, '/historique'), '/historique');
  });

  test('la garde attend, redirige, affiche ou signale une panne — jamais autre chose', () => {
    assert.equal(decisionGarde('chargement'), 'attente');
    assert.equal(decisionGarde('anonyme'), 'rediriger');
    assert.equal(decisionGarde('connecte'), 'afficher');
    // Une panne de stockage ou un service muet ne déconnecte personne.
    assert.equal(decisionGarde('indisponible'), 'panne');
  });
});

/* ───────────────────── Phase 4 : simulation maîtrisée ───────────────────── */

describe('Simulation — développement seulement, sans secret', () => {
  test('active par défaut en développement, jamais en production', () => {
    assert.equal(simulation.modeSimulationActif(null, true), true);
    assert.equal(simulation.modeSimulationActif('1', true), true);
    assert.equal(simulation.modeSimulationActif('0', true), false);
    // Production : aucune valeur stockée ne peut la rallumer.
    assert.equal(simulation.modeSimulationActif('1', false), false);
    assert.equal(simulation.modeSimulationActif(null, false), false);
    assert.equal(simulation.simulationActivee(), false);
  });

  test('refuse de s’activer hors développement', () => {
    magasin.clear();
    simulation.definirSimulation(true);
    assert.equal(magasin.get('aura_simulation'), undefined);
    assert.equal(simulation.ouvrirDemo(), false);
    assert.equal(magasin.get('aura_session'), undefined);
  });

  test('aucun mot de passe n’est écrit dans le navigateur', () => {
    const mdp = 'motdepasse-tres-secret-42';
    const r = simulation.inscrireSimule('demo-test@aura.dev', mdp, 'Nom Test');
    assert.equal(r.ok, true);
    const stocke = magasin.get('aura_sim_comptes') ?? '';
    assert.ok(stocke.includes('demo-test@aura.dev'), 'le compte simulé est bien enregistré');
    assert.equal(stocke.includes(mdp), false, 'aucun mot de passe en clair');
    assert.equal(stocke.toLowerCase().includes('motdepasse'), false);
  });
});

/* ─────────── Phase 2 : provenance de l'adresse derrière un proxy ─────────── */

describe('Adresse du client derrière le proxy (Vercel)', () => {
  let appProxy: Server;
  let racineProxy = '';

  before(async () => {
    // Reproduit exactement ce que fait configurerConfianceProxy derrière Vercel.
    const app = express();
    app.set('trust proxy', 1);
    app.get('/qui', (req, res) => {
      res.json({ resolu: ipClient(req), express: req.ip ?? null });
    });
    await new Promise<void>((resolve) => {
      appProxy = app.listen(0, '127.0.0.1', () => resolve());
    });
    const adresse = appProxy.address() as { port: number };
    racineProxy = `http://127.0.0.1:${adresse.port}/qui`;
  });

  after(async () => {
    await new Promise<void>((resolve) => appProxy.close(() => resolve()));
  });

  const interroger = async (entetes: Record<string, string>) => {
    const r = await fetch(racineProxy, { headers: entetes });
    return (await r.json()) as { resolu: string; express: string | null };
  };

  test('la valeur ajoutée par la plateforme est retenue, la valeur forgée est ignorée', async () => {
    // Un client peut préfixer x-forwarded-for ; le proxy ajoute la vraie
    // adresse à la fin. C'est cette dernière qui compte.
    const r = await interroger({ 'x-forwarded-for': '6.6.6.6, 203.0.113.7' });
    assert.equal(r.resolu, '203.0.113.7');
    assert.equal(r.express, '203.0.113.7');
  });

  test('un en-tête forgé seul ne prend pas la main sur la socket', async () => {
    // Sans la plateforme devant, `trust proxy` n'est pas activé : l'en-tête
    // est ignoré et l'adresse réelle de la connexion est utilisée.
    const app = express();
    app.get('/qui', (req, res) => {
      res.json({ resolu: ipClient(req), express: req.ip ?? null });
    });
    const s = await new Promise<Server>((resolve) => {
      const v = app.listen(0, '127.0.0.1', () => resolve(v));
    });
    const port = (s.address() as { port: number }).port;
    const r = await fetch(`http://127.0.0.1:${port}/qui`, {
      headers: { 'x-forwarded-for': '6.6.6.6' },
    });
    const j = (await r.json()) as { resolu: string };
    await new Promise<void>((resolve) => s.close(() => resolve()));
    assert.equal(j.resolu, '127.0.0.1');
  });

  test('sans en-tête, la socket fait foi', async () => {
    const r = await interroger({});
    assert.equal(r.resolu, '127.0.0.1');
  });

  test('la confiance proxy n’est activée que sur déclaration explicite', () => {
    const ancienVercel = process.env.VERCEL;
    const ancienDrapeau = process.env.AURA_TRUST_PROXY;
    try {
      const app = express();
      delete process.env.VERCEL;
      delete process.env.AURA_TRUST_PROXY;
      configurerConfianceProxy(app);
      assert.equal(app.get('trust proxy'), false, 'aucune confiance par défaut');

      process.env.VERCEL = '1';
      configurerConfianceProxy(app);
      assert.equal(app.get('trust proxy'), 1, 'un seul saut sur Vercel');

      delete process.env.VERCEL;
      process.env.AURA_TRUST_PROXY = '1';
      configurerConfianceProxy(app);
      assert.equal(app.get('trust proxy'), 1, 'auto-hébergement derrière un proxy déclaré');
    } finally {
      if (ancienVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = ancienVercel;
      if (ancienDrapeau === undefined) delete process.env.AURA_TRUST_PROXY;
      else process.env.AURA_TRUST_PROXY = ancienDrapeau;
    }
  });
});

/* ──────────────────── Phase 2 : limitation de débit ──────────────────── */

describe('Limitation de débit — compteur partagé', () => {
  test('bloque au-delà du seuil, sans dépendre de la mémoire du processus', async () => {
    reinitialiserLimitesLocales();
    const base = baseDeDonnees();
    const cle = 'test-seuil-' + Math.random().toString(36).slice(2);
    const v1 = await compterTentative(base, cle, 2, 60_000);
    const v2 = await compterTentative(base, cle, 2, 60_000);
    const v3 = await compterTentative(base, cle, 2, 60_000);
    assert.equal(v1.bloque, false);
    assert.equal(v2.bloque, false);
    assert.equal(v3.bloque, true);
    assert.equal(v3.restant, 0);
  });

  test('chaque clé est indépendante : aucune fermeture collective', async () => {
    const base = baseDeDonnees();
    const a = 'test-a-' + Math.random().toString(36).slice(2);
    const b = 'test-b-' + Math.random().toString(36).slice(2);
    for (let i = 0; i < 5; i++) await compterTentative(base, a, 5, 60_000);
    const verdictA = await compterTentative(base, a, 5, 60_000);
    const verdictB = await compterTentative(base, b, 5, 60_000);
    assert.equal(verdictA.bloque, true);
    assert.equal(verdictB.bloque, false, 'une autre adresse reste servie');
  });

  test('un stockage en panne ne bloque personne et ne lève pas', async () => {
    reinitialiserLimitesLocales();
    const enPanne = {
      mode: 'kv' as const,
      lire: async () => {
        throw new Error('Stockage KV indisponible (réseau).');
      },
      ecrire: async () => {
        throw new Error('Stockage KV indisponible (réseau).');
      },
      supprimer: async () => {
        throw new Error('Stockage KV indisponible (réseau).');
      },
      lister: async () => [],
      incr: async () => {
        throw new Error('Stockage KV indisponible (réseau).');
      },
    };
    const v = await compterTentative(enPanne, 'test-panne-' + Math.random(), 3, 60_000);
    assert.equal(v.bloque, false);
    assert.equal(v.source, 'local');
  });

  test('adresse IP : proxys respectés, en-têtes forgés ignorés', () => {
    const faux = (entetes: Record<string, string>, ip?: string) =>
      ({ headers: entetes, ip }) as unknown as Parameters<typeof ipClient>[0];

    // `req.ip` résolu par Express derrière le proxy : prioritaire.
    assert.equal(ipClient(faux({ 'x-forwarded-for': '1.1.1.1, 9.9.9.9' }, '203.0.113.7')), '203.0.113.7');
    // Sans `req.ip` (fonction serverless nue) : dernière entrée = celle du proxy.
    assert.equal(ipClient(faux({ 'x-forwarded-for': '1.1.1.1, 203.0.113.7' })), '203.0.113.7');
    // Ce qu'un client forge en tête de liste est ignoré.
    assert.equal(ipClient(faux({ 'x-forwarded-for': '10.0.0.1' }, '198.51.100.4')), '198.51.100.4');
    // Formes tolérées.
    assert.equal(ipClient(faux({}, '::ffff:192.0.2.9')), '192.0.2.9');
    assert.equal(ipClient(faux({ 'x-forwarded-for': '192.0.2.9:4567' })), '192.0.2.9');
    // En-tête illisible : regroupé à part, jamais deviné.
    assert.equal(ipClient(faux({ 'x-forwarded-for': 'pas-une-ip' })), 'inconnu');
    assert.equal(ipClient(faux({})), 'inconnu');
  });

  test('les compteurs ne conservent pas l’adresse e-mail en clair', () => {
    const e = empreinteIdentifiant('Personne@Aura.dev');
    assert.equal(e, empreinteIdentifiant('  personne@aura.dev  '));
    assert.equal(e.includes('@'), false);
    assert.equal(e.length, 24);
  });

  test('HTTP : la 11e inscription sur une même adresse est refusée, les autres passent', async () => {
    const c = client();
    const email = 'limite-' + Date.now() + '@test.dev';
    let dernier = 0;
    let code = '';
    for (let i = 0; i < 11; i++) {
      const r = await c('POST', '/auth/register', { email, password: 'motdepasse1', nom: 'Test' });
      dernier = r.statut;
      code = String(r.json.code ?? '');
    }
    assert.equal(dernier, 429);
    assert.equal(code, 'limite');

    // Une autre adresse n'est pas affectée par ce compteur.
    const autre = await client()('POST', '/auth/register', {
      email: 'autre-' + Date.now() + '@test.dev',
      password: 'motdepasse1',
      nom: 'Test',
    });
    assert.equal(autre.statut, 201);
  });
});

/* ─────────────── Phase 5/6 : sessions, cookies, en-têtes ─────────────── */

describe('Sessions et erreurs distinctes', () => {
  test('inscription → session → déconnexion → anonyme', async () => {
    const c = client();
    const email = 'parcours-' + Date.now() + '@test.dev';
    const ins = await c('POST', '/auth/register', { email, password: 'motdepasse1', nom: 'Nom' });
    assert.equal(ins.statut, 201);
    const cookie = String(ins.setCookie ?? '');
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.match(cookie, /Path=\//);

    const moi = await c('GET', '/me');
    assert.equal(moi.statut, 200);
    assert.equal((moi.json.compte as Json).email, email);

    const sortie = await c('POST', '/auth/logout');
    assert.equal(sortie.statut, 204);
    assert.match(String(sortie.setCookie ?? ''), /Max-Age=0/);

    const apres = await c('GET', '/me');
    assert.equal(apres.statut, 401);
    assert.equal(apres.json.code, 'anonyme');
  });

  test('session inconnue ou expirée : 401 ciblé, pas un anonymat muet', async () => {
    const c = client();
    const email = 'expire-' + Date.now() + '@test.dev';
    const ins = await c('POST', '/auth/register', { email, password: 'motdepasse1', nom: 'Nom' });
    assert.equal(ins.statut, 201);

    const jeton = decodeURIComponent(String(ins.setCookie ?? '').split(';')[0].split('=')[1]);
    await entrepotComptes().supprimerSession(empreinteJeton(jeton));

    const r = await c('GET', '/me');
    assert.equal(r.statut, 401);
    assert.equal(r.json.code, 'session-expiree');
  });

  test('route privée v1 sans session : 401 anonyme', async () => {
    const r = await client()('GET', '/v1/me');
    assert.equal(r.statut, 401);
    assert.equal(r.json.code, 'anonyme');
  });

  test('cookie : nom préfixé en production, ancien nom toujours lisible', () => {
    const ancien = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      assert.equal(nomCookieSession(), '__Host-aura_session');
      // Une session ouverte avant le changement de nom reste valide.
      assert.equal(lireJetonSession({ headers: { cookie: 'aura_session=jeton-herite' } }), 'jeton-herite');
      assert.equal(
        lireJetonSession({ headers: { cookie: '__Host-aura_session=jeton-neuf' } }),
        'jeton-neuf',
      );
    } finally {
      process.env.NODE_ENV = ancien;
      assert.equal(nomCookieSession(), COOKIE_SESSION);
    }
  });

  test('l’API ne met jamais ses réponses en cache et se déclare non encadrable', async () => {
    const r = await client()('GET', '/status');
    assert.equal(r.statut, 200);
    assert.equal(r.entetes.get('x-content-type-options'), 'nosniff');
    assert.equal(r.entetes.get('x-frame-options'), 'DENY');
    assert.equal(r.entetes.get('cache-control'), 'no-store');
    assert.equal(r.entetes.get('referrer-policy'), 'strict-origin-when-cross-origin');
  });

  test('politique de sécurité du document : cohérente et fermée', () => {
    const enTetes = enTetesDocument();
    const csp = enTetes['Content-Security-Policy'];
    assert.equal(csp, CONTENU_SECURITE);
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /connect-src 'self' https:\/\/lottie\.host/);
    assert.ok(enTetes['X-Frame-Options']);
    assert.ok(enTetes['Permissions-Policy']);
    // HSTS seulement là où le HTTPS est réel (Vercel), jamais en local.
    assert.equal(Object.keys(enTetesHsts()).length, 0);
  });
});
