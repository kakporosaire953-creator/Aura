/**
 * Récupération de compte — parcours complets sur l'API réelle (mission 08).
 *
 * Base de test isolée (dossier temporaire, pilote fichier), `fetch` sortant
 * remplacé par un bouchon : aucun e-mail ne peut réellement partir.
 *   node --import tsx --test tests/recuperation.test.ts
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import express from 'express';

const dossierData = mkdtempSync(path.join(tmpdir(), 'aura-recup-'));
process.env.AURA_AI_PROVIDER = 'mock';
process.env.AURA_DATA_DIR = dossierData;
process.env.NODE_ENV = 'test';
// Derrière un proxy de test : chaque client peut avoir sa propre adresse,
// comme autant d'appareils distincts face à la limitation par IP.
process.env.AURA_TRUST_PROXY = '1';
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.VERCEL;

const { createApiApp, configurerConfianceProxy } = await import('../server/api');
const { baseDeDonnees, entrepotComptes } = await import('../server/db/entrepots');
const { CLE } = await import('../server/db/base');
const { reinitialiserLimitesLocales } = await import('../server/v1/limite');

/**
 * Les compteurs de limitation vivent dans le stockage (partagés entre
 * instances). Chaque parcours repart donc d'une ardoise vierge, comme le
 * ferait un nouvel appareil.
 */
async function viderLimites(): Promise<void> {
  reinitialiserLimitesLocales();
  const base = baseDeDonnees();
  for (const cle of await base.lister('aurav1:rl:')) await base.supprimer(cle);
}

const fetchReel = globalThis.fetch;
type Envoi = { to: string[]; subject: string; html: string; text: string };
const envois: Envoi[] = [];
let autoriserFetch = true;

function installerBouchonMail(): void {
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    if (String(url).startsWith(base)) return fetchReel(url as string, init);
    if (!autoriserFetch) throw new Error('envoi inattendu');
    envois.push(JSON.parse(String(init?.body)) as Envoi);
    return new Response('{"id":"mail_test"}', { status: 200 });
  }) as typeof fetch;
}

const CONFIG_MAIL = {
  AURA_MAIL_PROVIDER: 'resend',
  AURA_MAIL_API_KEY: 'cle-de-test',
  AURA_MAIL_FROM: 'AURA <bonjour@aura.test>',
  AURA_PUBLIC_ORIGIN: 'https://aura.test',
  AURA_MAIL_API_URL: 'https://mail.fournisseur.test',
};

function retirerConfigMail(): void {
  for (const cle of Object.keys(CONFIG_MAIL)) delete process.env[cle];
}

let serveur: Server;
let base: string;

let adresseIp = 0;
function client() {
  let cookie: string | null = null;
  adresseIp += 1;
  const ip = `198.51.100.${adresseIp}`;
  const appel = async function (methode: string, route: string, corps?: unknown) {
    const r = await fetchReel(base + route, {
      method: methode,
      headers: {
        ...(corps !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
        'X-Forwarded-For': ip,
      },
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
    });
    const setCookie = r.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const json = (r.status === 204 ? {} : await r.json().catch(() => ({}))) as Record<string, unknown> & {
      error?: string;
      code?: string;
      compte?: { emailVerifie?: boolean; email?: string };
    };
    return { statut: r.status, json, setCookie };
  };
  appel.cookie = () => cookie;
  appel.poserCookie = (valeur: string) => {
    cookie = valeur;
  };
  return appel;
}

let compteur = 0;
function adresseNeuve(): string {
  compteur += 1;
  return `personne${compteur}.${Date.now()}@exemple.test`;
}

async function inscrire(email: string, password = 'MotDePasse123!') {
  const c = client();
  const r = await c('POST', '/auth/register', { email, password, nom: 'Claire' });
  assert.equal(r.statut, 201, `inscription attendue (${r.statut})`);
  return c;
}

/** Jeton contenu dans le dernier e-mail adressé à `email` pour ce parcours. */
function jetonPour(email: string, chemin: 'reinitialiser' | 'verifier-email'): string | null {
  for (let i = envois.length - 1; i >= 0; i--) {
    const m = envois[i];
    if (!m.to.includes(email)) continue;
    const trouve = m.html.match(new RegExp(`/${chemin}\\?jeton=([A-Za-z0-9_-]+)`));
    if (trouve) return decodeURIComponent(trouve[1]);
  }
  return null;
}

/** Attend l'arrivée du message et renvoie son jeton (jamais de jeton inventé). */
async function attendreJeton(
  email: string,
  chemin: 'reinitialiser' | 'verifier-email',
  timeout = 3000,
): Promise<string> {
  const fin = Date.now() + timeout;
  while (Date.now() < fin) {
    const jeton = jetonPour(email, chemin);
    if (jeton) return jeton;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error(`Aucun jeton « ${chemin} » reçu pour ${email}`);
}

async function attendreEnvoi(nb: number, timeout = 2000): Promise<void> {
  const fin = Date.now() + timeout;
  while (envois.length < nb && Date.now() < fin) {
    await new Promise((r) => setTimeout(r, 20));
  }
  assert.ok(envois.length >= nb, `e-mail attendu (${envois.length}/${nb})`);
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
  installerBouchonMail();
});

after(async () => {
  globalThis.fetch = fetchReel;
  await new Promise<void>((resolve) => serveur.close(() => resolve()));
  rmSync(dossierData, { recursive: true, force: true });
});

/* ───────────────────── Sans fournisseur : rien n’est simulé ───────────────────── */

describe('Service d’e-mail absent', () => {
  test('mot de passe oublié → 503 explicite, aucun jeton créé', async () => {
    retirerConfigMail();
    const email = adresseNeuve();
    await inscrire(email);
    const avant = envois.length;

    const c = client();
    const r = await c('POST', '/auth/forgot-password', { email });
    assert.equal(r.statut, 503);
    assert.equal(r.json.code, 'mail-indisponible');
    assert.equal(envois.length, avant, 'aucun e-mail ne part');

    const cles = await baseDeDonnees().lister('aurav1:jeton:');
    assert.equal(cles.length, 0, 'aucun jeton ne doit rester en base');
  });

  test('renvoi de vérification → 503, même pour une adresse inconnue', async () => {
    retirerConfigMail();
    const c = client();
    const r = await c('POST', '/auth/resend-verification', { email: adresseNeuve() });
    assert.equal(r.statut, 503);
    assert.equal(r.json.code, 'mail-indisponible');
  });

  test('le renvoi depuis une session ouverte est refusé honnêtement', async () => {
    retirerConfigMail();
    const c = await inscrire(adresseNeuve());
    const r = await c('POST', '/v1/me/email/renvoyer', {});
    assert.equal(r.statut, 503);
    assert.equal(r.json.code, 'mail-indisponible');
  });
});

/* ─────────────────────────── Mot de passe oublié ─────────────────────────── */

describe('Mot de passe oublié', () => {
  before(async () => {
    Object.assign(process.env, CONFIG_MAIL);
    await viderLimites();
  });

  test('réponse identique pour une adresse connue et une adresse inconnue', async () => {
    const connue = adresseNeuve();
    await inscrire(connue);
    const inconnue = adresseNeuve();
    const c = client();

    const r1 = await c('POST', '/auth/forgot-password', { email: connue });
    const r2 = await c('POST', '/auth/forgot-password', { email: inconnue });

    assert.equal(r1.statut, 202);
    assert.equal(r2.statut, 202);
    assert.deepEqual(r1.json, r2.json, 'le corps ne doit rien révéler');
    assert.deepEqual(r1.setCookie, r2.setCookie, 'aucun cookie n’est posé');
  });

  test('l’e-mail part réellement et le jeton n’est stocké que haché', async () => {
    const email = adresseNeuve();
    await inscrire(email);
    const c = client();
    const avant = envois.length;
    const r = await c('POST', '/auth/forgot-password', { email, langue: 'fr' });
    assert.equal(r.statut, 202);
    await attendreEnvoi(avant + 1);

    const jeton = await attendreJeton(email, 'reinitialiser');
    const message = envois.filter((m) => m.to.includes(email)).at(-1)!;
    assert.deepEqual(message.to, [email]);
    assert.match(message.subject, /Réinitialisez/);
    assert.ok(jeton.length >= 43, 'jeton attendu dans le lien');

    // Le jeton brut n'est écrit nulle part dans le stockage.
    const cles = await baseDeDonnees().lister('aurav1:jeton:');
    assert.ok(cles.length >= 1);
    for (const cle of cles) {
      assert.ok(!cle.includes(jeton!), 'la clé est une empreinte, pas le jeton');
      assert.match(cle.replace('aurav1:jeton:', ''), /^[a-f0-9]{64}$/);
    }
    const brut = JSON.stringify(await baseDeDonnees().lire(CLE.jeton(cles[cles.length - 1])));
    assert.ok(!brut.includes(jeton!));
  });

  test('adresse mal formée → 400 sans consultation du stockage', async () => {
    const c = client();
    const r = await c('POST', '/auth/forgot-password', { email: 'pas-une-adresse' });
    assert.equal(r.statut, 400);
    assert.equal(r.json.code, 'validation');
  });

  test('au-delà de 3 demandes par heure pour une même adresse → 429', async () => {
    const email = adresseNeuve();
    const c = client();
    const statuts: number[] = [];
    for (let i = 0; i < 4; i++) {
      statuts.push((await c('POST', '/auth/forgot-password', { email })).statut);
    }
    assert.deepEqual(statuts.slice(0, 3), [202, 202, 202]);
    assert.equal(statuts[3], 429);
  });
});

/* ─────────────────────────── Réinitialisation ─────────────────────────── */

describe('Réinitialisation du mot de passe', () => {
  before(async () => {
    Object.assign(process.env, CONFIG_MAIL);
    await viderLimites();
  });

  test('jeton valide : mot de passe changé, sessions fermées, jeton consommé', async () => {
    const email = adresseNeuve();
    const c = await inscrire(email);
    const autre = client();
    const connexion = await autre('POST', '/auth/login', { email, password: 'MotDePasse123!' });
    assert.equal(connexion.statut, 200);

    await c('POST', '/auth/forgot-password', { email });
    const jeton = await attendreJeton(email, 'reinitialiser');

    const r = await client()('POST', '/auth/reset-password', {
      token: jeton,
      password: 'NouveauMotDePasse456!',
    });
    assert.equal(r.statut, 200);
    assert.equal(r.json.ok, true);
    assert.ok((r.json.sessionsFermees as number) >= 1, 'les sessions sont fermées');

    // L'ancienne session ne vaut plus rien.
    const apres = await autre('GET', '/v1/me');
    assert.equal(apres.statut, 401);

    // Ancien mot de passe refusé, nouveau accepté.
    const ancien = await client()('POST', '/auth/login', { email, password: 'MotDePasse123!' });
    assert.equal(ancien.statut, 401);
    const nouveau = await client()('POST', '/auth/login', {
      email,
      password: 'NouveauMotDePasse456!',
    });
    assert.equal(nouveau.statut, 200);
    assert.equal(nouveau.json.compte?.emailVerifie, true, 'l’adresse est prouvée par l’e-mail');

    // Usage unique : le même lien ne sert plus.
    const rejoue = await client()('POST', '/auth/reset-password', {
      token: jeton,
      password: 'EncoreUnAutre789!',
    });
    assert.equal(rejoue.statut, 400);
    assert.equal(rejoue.json.code, 'jeton-invalide');
  });

  test('en course, un seul appel réussit (réservation atomique)', async () => {
    const email = adresseNeuve();
    await inscrire(email);
    const demande = await client()('POST', '/auth/forgot-password', { email });
    assert.equal(demande.statut, 202, `demande de réinitialisation (${JSON.stringify(demande.json)})`);
    const jeton = await attendreJeton(email, 'reinitialiser');

    const [a, b] = await Promise.all([
      client()('POST', '/auth/reset-password', { token: jeton, password: 'Course111111!' }),
      client()('POST', '/auth/reset-password', { token: jeton, password: 'Course222222!' }),
    ]);
    const statuts = [a.statut, b.statut].sort();
    assert.deepEqual(statuts, [200, 400], 'un seul gagnant');
  });

  test('jeton expiré → 400 jeton-expire', async () => {
    const email = adresseNeuve();
    const c = await inscrire(email);
    void c;
    await client()('POST', '/auth/forgot-password', { email });
    const jeton = await attendreJeton(email, 'reinitialiser');

    // On vieillit artificiellement le jeton stocké.
    const { empreinteJeton } = await import('../server/accounts');
    const cle = CLE.jeton(empreinteJeton(jeton));
    const enregistrement = (await baseDeDonnees().lire<Record<string, unknown>>(cle))!;
    enregistrement.expire = Date.now() - 1000;
    await baseDeDonnees().ecrire(cle, enregistrement);

    const r = await client()('POST', '/auth/reset-password', {
      token: jeton,
      password: 'MotDePasseTardif1!',
    });
    assert.equal(r.statut, 400);
    assert.equal(r.json.code, 'jeton-expire');
  });

  test('mot de passe trop court → 400, jeton non consommé', async () => {
    const email = adresseNeuve();
    await inscrire(email);
    await client()('POST', '/auth/forgot-password', { email });
    const jeton = await attendreJeton(email, 'reinitialiser');

    const court = await client()('POST', '/auth/reset-password', { token: jeton, password: 'court' });
    assert.equal(court.statut, 400);
    assert.equal(court.json.code, 'validation');

    const bon = await client()('POST', '/auth/reset-password', {
      token: jeton,
      password: 'AssezLongMotDePasse!',
    });
    assert.equal(bon.statut, 200, 'le jeton reste utilisable après un refus de validation');
  });

  test('un jeton de vérification ne peut pas réinitialiser un mot de passe', async () => {
    const email = adresseNeuve();
    await inscrire(email);
    const jeton = await attendreJeton(email, 'verifier-email');
    const r = await client()('POST', '/auth/reset-password', {
      token: jeton,
      password: 'Detournement123!',
    });
    assert.equal(r.statut, 400);
  });
});

/* ─────────────────────────── Vérification d'adresse ─────────────────────────── */

describe('Vérification d’adresse', () => {
  before(async () => {
    Object.assign(process.env, CONFIG_MAIL);
    await viderLimites();
  });

  test('l’inscription envoie un lien, sans bloquer le compte', async () => {
    const email = adresseNeuve();
    const c = await inscrire(email);
    const jeton = await attendreJeton(email, 'verifier-email');

    // Le compte est utilisable immédiatement (vérification non bloquante).
    const me = await c('GET', '/v1/me');
    assert.equal(me.statut, 200);
    assert.equal(me.json.compte?.emailVerifie, false);
    const r = await client()('POST', '/auth/verify-email', { token: jeton });
    assert.equal(r.statut, 200);

    const apres = await c('GET', '/v1/me');
    assert.equal(apres.json.compte?.emailVerifie, true);
  });

  test('le lien ne sert qu’une fois', async () => {
    const email = adresseNeuve();
    await inscrire(email);
    const jeton = await attendreJeton(email, 'verifier-email');
    assert.equal((await client()('POST', '/auth/verify-email', { token: jeton })).statut, 200);
    const rejoue = await client()('POST', '/auth/verify-email', { token: jeton });
    assert.equal(rejoue.statut, 400);
    assert.equal(rejoue.json.code, 'jeton-invalide');
  });

  test('renvoi depuis la session : 202 puis 409 une fois confirmée', async () => {
    const email = adresseNeuve();
    const c = await inscrire(email);
    const r = await c('POST', '/v1/me/email/renvoyer', { langue: 'en' });
    assert.equal(r.statut, 202);
    const jeton = await attendreJeton(email, 'verifier-email');
    assert.match(envois.filter((m) => m.to.includes(email)).at(-1)!.subject, /Confirm/);
    await client()('POST', '/auth/verify-email', { token: jeton });
    const apres = await c('POST', '/v1/me/email/renvoyer', {});
    assert.equal(apres.statut, 409);
    assert.equal(apres.json.code, 'deja-verifie');
  });
});

/* ─────────────────────────── Changement de mot de passe ─────────────────────────── */

describe('Changement de mot de passe depuis une session', () => {
  before(async () => {
    Object.assign(process.env, CONFIG_MAIL);
    await viderLimites();
  });

  test('mot de passe actuel requis', async () => {
    const email = adresseNeuve();
    const c = await inscrire(email);
    const r = await c('POST', '/v1/me/password', { actuel: 'faux', nouveau: 'NouveauMotDePasse1!' });
    assert.equal(r.statut, 401);
    assert.equal(r.json.code, 'mot-de-passe');
  });

  test('succès : la session courante reste ouverte, les autres tombent', async () => {
    const email = adresseNeuve();
    const c = await inscrire(email);
    const autre = client();
    assert.equal((await autre('POST', '/auth/login', { email, password: 'MotDePasse123!' })).statut, 200);

    const r = await c('POST', '/v1/me/password', {
      actuel: 'MotDePasse123!',
      nouveau: 'NouveauMotDePasse1!',
    });
    assert.equal(r.statut, 200);
    assert.ok((r.json.sessionsFermees as number) >= 1);

    assert.equal((await c('GET', '/v1/me')).statut, 200, 'la session courante survit');
    assert.equal((await autre('GET', '/v1/me')).statut, 401, 'les autres sessions sont fermées');

    const login = await client()('POST', '/auth/login', {
      email,
      password: 'NouveauMotDePasse1!',
    });
    assert.equal(login.statut, 200);
  });

  test('compte avec mot de passe : « actuel » reste obligatoire', async () => {
    const c = await inscrire(adresseNeuve());
    const r = await c('POST', '/v1/me/password', { nouveau: 'NouveauMotDePasse1!' });
    assert.equal(r.statut, 400);
    assert.equal(r.json.code, 'validation');
    assert.deepEqual((r.json.champs as Record<string, string>).actuel, 'requis');
  });

  test('nouveau mot de passe identique ou trop court refusé', async () => {
    const c = await inscrire(adresseNeuve());
    const identique = await c('POST', '/v1/me/password', {
      actuel: 'MotDePasse123!',
      nouveau: 'MotDePasse123!',
    });
    assert.equal(identique.statut, 400);
    assert.equal(identique.json.code, 'identique');
    const court = await c('POST', '/v1/me/password', { actuel: 'MotDePasse123!', nouveau: 'court' });
    assert.equal(court.statut, 400);
    assert.equal(court.json.code, 'validation');
  });
});

/* ─────────────────────────── Sessions actives ─────────────────────────── */

describe('Sessions actives', () => {
  before(async () => {
    Object.assign(process.env, CONFIG_MAIL);
    await viderLimites();
  });

  test('liste : appareil, activité, session courante identifiée', async () => {
    const email = adresseNeuve();
    const c = await inscrire(email);
    await client()('POST', '/auth/login', { email, password: 'MotDePasse123!' });

    const r = await c('GET', '/v1/me/sessions');
    assert.equal(r.statut, 200);
    const sessions = r.json.sessions as Array<Record<string, unknown>>;
    assert.equal(sessions.length, 2);
    assert.equal(sessions.filter((s) => s.courante).length, 1);
    for (const s of sessions) {
      assert.match(String(s.id), /^[a-f0-9]{16}$/);
      assert.equal(typeof s.cree, 'string');
      assert.equal(typeof s.derniereActivite, 'string');
      assert.match(String(s.libelle), /Chrome · macOS/);
      assert.equal(s.token, undefined, 'aucun jeton de session n’est exposé');
    }
  });

  test('révoquer une autre session, puis toutes les autres', async () => {
    const email = adresseNeuve();
    const c = await inscrire(email);
    const autre = client();
    await autre('POST', '/auth/login', { email, password: 'MotDePasse123!' });

    const liste = await c('GET', '/v1/me/sessions');
    const sessions = liste.json.sessions as Array<{ id: string; courante: boolean }>;
    const distante = sessions.find((s) => !s.courante)!;

    const r = await c('DELETE', `/v1/me/sessions/${distante.id}`);
    assert.equal(r.statut, 200);
    assert.equal((await autre('GET', '/v1/me')).statut, 401);

    // La session courante ne se révoque pas par cette route.
    const courante = sessions.find((s) => s.courante)!;
    const refus = await c('DELETE', `/v1/me/sessions/${courante.id}`);
    assert.equal(refus.statut, 400);
    assert.equal(refus.json.code, 'session-courante');

    // Identifiant fantaisiste ou mal formé.
    assert.equal((await c('DELETE', '/v1/me/sessions/0000000000000000')).statut, 404);
    assert.equal((await c('DELETE', '/v1/me/sessions/zz')).statut, 400);
  });

  test('revoquer-autrui ferme tout sauf l’appareil courant', async () => {
    const email = adresseNeuve();
    const c = await inscrire(email);
    const a = client();
    const b = client();
    await a('POST', '/auth/login', { email, password: 'MotDePasse123!' });
    await b('POST', '/auth/login', { email, password: 'MotDePasse123!' });

    const r = await c('POST', '/v1/me/sessions/revoquer-autrui', {});
    assert.equal(r.statut, 200);
    assert.equal(r.json.sessionsFermees, 2);
    assert.equal((await c('GET', '/v1/me')).statut, 200);
    assert.equal((await a('GET', '/v1/me')).statut, 401);
    assert.equal((await b('GET', '/v1/me')).statut, 401);
  });

  test('les sessions d’un compte ne sont pas visibles depuis un autre', async () => {
    const c1 = await inscrire(adresseNeuve());
    const c2 = await inscrire(adresseNeuve());
    const l1 = (await c1('GET', '/v1/me/sessions')).json.sessions as Array<{ id: string }>;
    const r = await c2('DELETE', `/v1/me/sessions/${l1[0].id}`);
    assert.equal(r.statut, 404, 'aucune fuite entre comptes');
  });
});

/* ─────────────────────────── Compatibilité ─────────────────────────── */

describe('Comptes existants', () => {
  test('un compte sans champ de vérification reste lisible', async () => {
    const comptes = entrepotComptes();
    const email = adresseNeuve();
    const c = await inscrire(email);
    const me = await c('GET', '/v1/me');
    assert.equal(me.statut, 200);

    const compte = await comptes.parEmail(email);
    assert.ok(compte);
    // Les comptes antérieurs n'ont pas ces champs : on les traite comme non vérifiés.
    delete compte!.emailVerifie;
    delete compte!.emailVerifieLe;
    await comptes.enregistrer(compte!);
    const relu = await c('GET', '/v1/me');
    assert.equal(relu.statut, 200);
    assert.equal(relu.json.compte?.emailVerifie, false);
  });
});
