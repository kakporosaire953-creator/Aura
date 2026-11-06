/**
 * E-mails transactionnels (mission 08).
 *
 * Aucun réseau : `fetch` est remplacé par un bouchon qui capture la requête.
 * On vérifie le contrat exact (URL, en-têtes, corps), l'absence de simulation
 * quand la configuration manque, et le contenu des deux modèles FR/EN.
 *   node --import tsx --test tests/mail.test.ts
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const {
  configurationMail,
  envoyer,
  mailConfigure,
  originePublique,
  raisonMailIndisponible,
} = await import('../server/mail/adaptateur');
const { gabaritReinitialisation, gabaritVerification, langueDepuis } = await import(
  '../server/mail/gabarits'
);
const { envoyerReinitialisation, envoyerVerification, lienReinitialisation } = await import(
  '../server/mail/service'
);

const ENV_MAIL = [
  'AURA_MAIL_PROVIDER',
  'AURA_MAIL_API_KEY',
  'AURA_MAIL_FROM',
  'AURA_MAIL_REPLY_TO',
  'AURA_MAIL_API_URL',
  'AURA_MAIL_TIMEOUT_MS',
  'AURA_PUBLIC_ORIGIN',
] as const;

const sauvegarde = new Map<string, string | undefined>();
const fetchReel = globalThis.fetch;

type Capture = { url: string; init: RequestInit };

function configurer(valeurs: Record<string, string>): void {
  for (const cle of ENV_MAIL) delete process.env[cle];
  Object.assign(process.env, valeurs);
}

function bouchonFetch(
  reponse: () => Response | Promise<Response>,
): { appels: Capture[] } {
  const appels: Capture[] = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    appels.push({ url: String(url), init: init ?? {} });
    return reponse();
  }) as typeof fetch;
  return { appels };
}

const CONFIG_COMPLETE = {
  AURA_MAIL_PROVIDER: 'resend',
  AURA_MAIL_API_KEY: 'cle-de-test',
  AURA_MAIL_FROM: 'AURA <bonjour@aura.test>',
  AURA_PUBLIC_ORIGIN: 'https://aura.test',
  AURA_MAIL_API_URL: 'https://mail.fournisseur.test',
};

beforeEach(() => {
  for (const cle of ENV_MAIL) {
    if (!sauvegarde.has(cle)) sauvegarde.set(cle, process.env[cle]);
  }
});

afterEach(() => {
  globalThis.fetch = fetchReel;
  for (const cle of ENV_MAIL) {
    const v = sauvegarde.get(cle);
    if (v === undefined) delete process.env[cle];
    else process.env[cle] = v;
  }
});

/* ─────────────────────────── Configuration ─────────────────────────── */

describe('Configuration de l’envoi', () => {
  test('sans variable : service indisponible, jamais simulé', async () => {
    configurer({});
    assert.equal(mailConfigure(), false);
    assert.match(raisonMailIndisponible(), /pas configuré/);

    const { appels } = bouchonFetch(() => new Response('{}', { status: 200 }));
    const r = await envoyer({ a: 'x@y.test', sujet: 's', texte: 't', html: '<p>h</p>' });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, 'mail-indisponible');
    assert.equal(appels.length, 0, 'aucune requête ne part sans configuration');
  });

  test('une clé manquante suffit à rendre le service indisponible', () => {
    configurer({ ...CONFIG_COMPLETE, AURA_MAIL_API_KEY: '' });
    const etat = configurationMail();
    assert.equal(etat.ok, false);
  });

  test('un fournisseur inconnu est refusé explicitement', () => {
    configurer({ ...CONFIG_COMPLETE, AURA_MAIL_PROVIDER: 'autre' });
    assert.equal(mailConfigure(), false);
    assert.match(raisonMailIndisponible(), /non pris en charge/);
  });

  test('un expéditeur mal formé est refusé', () => {
    configurer({ ...CONFIG_COMPLETE, AURA_MAIL_FROM: 'AURA' });
    assert.equal(mailConfigure(), false);
  });

  test('origine publique : https exigée hors localhost, jamais d’identifiants', () => {
    configurer({ ...CONFIG_COMPLETE, AURA_PUBLIC_ORIGIN: 'http://aura.test' });
    assert.equal(originePublique(), null);
    configurer({ ...CONFIG_COMPLETE, AURA_PUBLIC_ORIGIN: 'http://localhost:5173' });
    assert.equal(originePublique(), 'http://localhost:5173');
    configurer({ ...CONFIG_COMPLETE, AURA_PUBLIC_ORIGIN: 'https://user:mdp@aura.test' });
    assert.equal(originePublique(), null);
    configurer({ ...CONFIG_COMPLETE, AURA_PUBLIC_ORIGIN: 'https://aura.test/' });
    assert.equal(originePublique(), 'https://aura.test');
  });
});

/* ─────────────────────────── Transmission ─────────────────────────── */

describe('Transmission au fournisseur', () => {
  test('requête conforme : point d’entrée, jeton, expéditeur, destinataire', async () => {
    configurer(CONFIG_COMPLETE);
    const { appels } = bouchonFetch(() => new Response('{"id":"mail_1"}', { status: 200 }));

    const r = await envoyer({ a: 'claire@exemple.test', sujet: 'Sujet', texte: 'Texte', html: '<p>Html</p>' });
    assert.equal(r.ok, true);
    assert.equal(appels.length, 1);
    assert.equal(appels[0].url, 'https://mail.fournisseur.test/emails');

    const init = appels[0].init;
    assert.equal(init.method, 'POST');
    const entetes = init.headers as Record<string, string>;
    assert.equal(entetes.Authorization, 'Bearer cle-de-test');
    const corps = JSON.parse(String(init.body)) as Record<string, unknown>;
    assert.equal(corps.from, 'AURA <bonjour@aura.test>');
    assert.deepEqual(corps.to, ['claire@exemple.test']);
    assert.equal(corps.subject, 'Sujet');
    assert.equal(corps.text, 'Texte');
    assert.equal(corps.html, '<p>Html</p>');
    assert.equal(corps.reply_to, undefined);
  });

  test('reply-to transmis seulement s’il est configuré', async () => {
    configurer({ ...CONFIG_COMPLETE, AURA_MAIL_REPLY_TO: 'support@aura.test' });
    const { appels } = bouchonFetch(() => new Response('{}', { status: 201 }));
    await envoyer({ a: 'a@b.test', sujet: 's', texte: 't', html: 'h' });
    const corps = JSON.parse(String(appels[0].init.body)) as Record<string, unknown>;
    assert.equal(corps.reply_to, 'support@aura.test');
  });

  test('un refus du fournisseur n’est jamais transformé en succès', async () => {
    configurer(CONFIG_COMPLETE);
    bouchonFetch(() => new Response('{"message":"domaine non vérifié"}', { status: 403 }));
    const r = await envoyer({ a: 'a@b.test', sujet: 's', texte: 't', html: 'h' });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, 'mail-refuse');
  });

  test('une panne réseau n’est jamais transformée en succès', async () => {
    configurer(CONFIG_COMPLETE);
    globalThis.fetch = (async () => {
      throw new Error('ECONNREFUSED');
    }) as typeof fetch;
    const r = await envoyer({ a: 'a@b.test', sujet: 's', texte: 't', html: 'h' });
    assert.equal(r.ok, false);
  });

  test('le délai maximal interrompt l’envoi', async () => {
    configurer({ ...CONFIG_COMPLETE, AURA_MAIL_TIMEOUT_MS: '1000' });
    globalThis.fetch = ((_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const e = new Error('aborted');
          e.name = 'AbortError';
          reject(e);
        });
      })) as unknown as typeof fetch;

    const debut = Date.now();
    const r = await envoyer({ a: 'a@b.test', sujet: 's', texte: 't', html: 'h' });
    assert.equal(r.ok, false);
    assert.ok(Date.now() - debut >= 900, 'le délai configuré est respecté');
  });
});

/* ─────────────────────────── Modèles ─────────────────────────── */

describe('Modèles d’e-mails', () => {
  const lien = 'https://aura.test/reinitialiser?jeton=abc123';

  test('français : sujet, lien, durée et mention de non-demande', () => {
    const m = gabaritReinitialisation({ nom: 'Claire', lien, dureeMinutes: 30, langue: 'fr' });
    assert.equal(m.sujet, 'Réinitialisez votre mot de passe AURA');
    assert.ok(m.html.includes(lien));
    assert.ok(m.texte.includes(lien));
    assert.ok(m.html.includes('30 minutes'));
    assert.ok(m.html.includes('ignorez cet e-mail'));
    assert.ok(m.html.includes('Bonjour Claire,'));
    assert.ok(m.html.includes('lang="fr"'));
  });

  test('anglais : aucun texte français ne subsiste', () => {
    const m = gabaritVerification({ nom: 'Claire', lien, dureeHeures: 24, langue: 'en' });
    assert.equal(m.sujet, 'Confirm your AURA address');
    assert.ok(m.html.includes('lang="en"'));
    assert.ok(m.html.includes('24 hours'));
    assert.ok(!/Bonjour|votre|Confirmez/.test(m.html));
  });

  test('le nom est échappé (pas d’injection HTML dans l’e-mail)', () => {
    const m = gabaritVerification({
      nom: '<script>alert(1)</script>',
      lien,
      dureeHeures: 24,
      langue: 'fr',
    });
    assert.ok(!m.html.includes('<script>'));
    assert.ok(m.html.includes('&lt;script&gt;'));
  });

  test('le fournisseur n’apparaît jamais dans les messages', () => {
    for (const m of [
      gabaritVerification({ nom: 'A', lien, dureeHeures: 24, langue: 'fr' }),
      gabaritReinitialisation({ nom: 'A', lien, dureeMinutes: 30, langue: 'en' }),
    ]) {
      assert.ok(!/resend/i.test(m.html + m.texte + m.sujet));
    }
  });

  test('langue : repli sûr sur le français', () => {
    assert.equal(langueDepuis('en'), 'en');
    assert.equal(langueDepuis('fr'), 'fr');
    assert.equal(langueDepuis('de'), 'fr');
    assert.equal(langueDepuis(undefined), 'fr');
    assert.equal(langueDepuis(42, 'en'), 'en');
  });

  test('les liens des e-mails viennent de l’origine configurée', () => {
    configurer(CONFIG_COMPLETE);
    assert.equal(lienReinitialisation('abc123'), 'https://aura.test/reinitialiser?jeton=abc123');
    configurer({ ...CONFIG_COMPLETE, AURA_PUBLIC_ORIGIN: '' });
    assert.equal(lienReinitialisation('abc123'), null);
  });
});

describe('Envoi des deux messages', () => {
  test('vérification : lien /verifier-email et durée en heures', async () => {
    configurer(CONFIG_COMPLETE);
    const { appels } = bouchonFetch(() => new Response('{}', { status: 200 }));
    const r = await envoyerVerification({
      nom: 'Claire',
      email: 'claire@exemple.test',
      langue: 'fr',
      jeton: 'jeton-test',
      dureeHeures: 24,
    });
    assert.equal(r.ok, true);
    const corps = JSON.parse(String(appels[0].init.body)) as Record<string, unknown>;
    assert.ok(String(corps.html).includes('/verifier-email?jeton=jeton-test'));
    assert.ok(String(corps.text).includes('/verifier-email?jeton=jeton-test'));
  });

  test('réinitialisation : lien /reinitialiser et durée en minutes', async () => {
    configurer(CONFIG_COMPLETE);
    const { appels } = bouchonFetch(() => new Response('{}', { status: 200 }));
    const r = await envoyerReinitialisation({
      nom: 'Claire',
      email: 'claire@exemple.test',
      langue: 'en',
      jeton: 'jeton-reset',
      dureeMinutes: 30,
    });
    assert.equal(r.ok, true);
    const corps = JSON.parse(String(appels[0].init.body)) as Record<string, unknown>;
    assert.ok(String(corps.html).includes('/reinitialiser?jeton=jeton-reset'));
    assert.equal(corps.subject, 'Reset your AURA password');
  });
});
