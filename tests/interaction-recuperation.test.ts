/**
 * Interactions réelles dans un DOM simulé (mission 09).
 *
 * Ce n'est PAS un test navigateur : jsdom ne rend pas de pixels et n'applique
 * aucune feuille de style. En revanche, React est réellement monté, les
 * événements `input`/`submit`/`click` sont réellement dispatchés, le routeur
 * fonctionne, et les appels réseau sont interceptés : ce que ces tests
 * prouvent, c'est le **comportement** des écrans (états, messages, appels),
 * pas leur apparence.
 *   node --import tsx --test tests/interaction-recuperation.test.ts
 */
import { test, describe, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  attendre,
  cliquer,
  demonter,
  fermerNavigateur,
  installerNavigateur,
  monter,
  reinitialiserUrl,
  saisir,
  soumettre,
  texte,
} from './support/dom';

// Le navigateur simulé doit exister AVANT tout import de composant.
installerNavigateur('https://aura.test/mot-de-passe-oublie?jeton=jeton-de-test-suffisamment-long');
process.env.NODE_ENV = 'test';

const React = await import('react');
const { MemoryRouter } = await import('react-router-dom');
const { PrefsProvider } = await import('../src/app/prefs');
const { SessionProvider } = await import('../src/app/session');
const { MotDePasseOubliePage } = await import('../src/pages/MotDePasseOubliePage');
const { ReinitialiserPage } = await import('../src/pages/ReinitialiserPage');
const { VerifierEmailPage } = await import('../src/pages/VerifierEmailPage');
const { SecuriteCompte } = await import('../src/components/auth/SecuriteCompte');
const { CONTENT } = await import('../src/app/dictionaries');

const t = CONTENT.fr.securite;

/* ─────────────────────────── Bouchon réseau ─────────────────────────── */

type Reponse = { statut?: number; json: unknown };
type Appel = { methode: string; url: string; corps?: unknown };
let appels: Appel[] = [];

function bouchon(routes: Record<string, (corps?: unknown) => Reponse>): void {
  appels = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    const methode = (init?.method ?? 'GET').toUpperCase();
    const corps = init?.body ? JSON.parse(String(init.body)) : undefined;
    const sansQuery = u.split('?')[0];
    // `/api/me` est appelé par le fournisseur de session à chaque montage :
    // ce n'est pas l'action testée, on ne le compte pas dans `appels`.
    if (!(methode === 'GET' && sansQuery === '/api/me')) {
      appels.push({ methode, url: u, corps });
    }
    const route = routes[`${methode} ${u}`] ?? routes[`${methode} ${sansQuery}`];
    if (!route) {
      return new Response(JSON.stringify({ error: 'route non bouchonnée', code: 'test' }), {
        status: 599,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const r = route(corps);
    return new Response(JSON.stringify(r.json), {
      status: r.statut ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

const COMPTE = {
  id: 'usr_test',
  email: 'claire@exemple.test',
  nom: 'Claire',
  cree: '2026-01-01T00:00:00.000Z',
  onboarding: { fait: true, objectif: null },
  profil: {
    pays: 'BJ',
    region: null,
    languePrincipale: 'fr',
    languesSecondaires: [],
    devise: 'XOF',
    fuseau: 'Africa/Porto-Novo',
    unites: 'metriques',
    domaine: null,
  },
  preferences: { tonReponse: 'concis', utiliserMemoire: true, langueReponse: 'auto' },
  emailVerifie: false,
};

function enveloppe(children: unknown, chemin = '/mot-de-passe-oublie') {
  return React.createElement(
    PrefsProvider,
    null,
    React.createElement(
      SessionProvider,
      null,
      React.createElement(MemoryRouter, { initialEntries: [chemin] }, children as never),
    ),
  );
}

// Certaines pages lisent le jeton dans `window.location` et le retirent
// après usage : chaque test repart donc d'une URL neuve.
const URL_DEPART = '/mot-de-passe-oublie?jeton=jeton-de-test-suffisamment-long';

beforeEach(async () => {
  await demonter();
  appels = [];
  reinitialiserUrl(URL_DEPART);
});

after(() => fermerNavigateur());

/* ─────────────────────── Mot de passe oublié ─────────────────────── */

describe('Mot de passe oublié — interactions', () => {
  test('une saisie invalide est refusée localement, sans appel réseau', async () => {
    bouchon({});
    await monter(enveloppe(React.createElement(MotDePasseOubliePage)));
    await saisir('#email-oubli', 'pas-une-adresse');
    await soumettre();
    assert.ok(texte().includes(CONTENT.fr.auth.errSaisie));
    assert.equal(appels.length, 0, 'aucune requête ne doit partir');
    assert.ok(document.querySelector('#email-oubli'), 'le formulaire reste affiché');
  });

  test('202 : le message reste conditionnel et le formulaire disparaît', async () => {
    bouchon({ 'POST /api/auth/forgot-password': () => ({ statut: 202, json: { ok: true } }) });
    await monter(enveloppe(React.createElement(MotDePasseOubliePage)));
    await saisir('#email-oubli', 'claire@exemple.test');
    await soumettre();
    await attendre(() => texte().includes(t.oubliEnvoye), 'message de confirmation attendu');

    assert.equal(appels.length, 1);
    assert.equal(appels[0].url, '/api/auth/forgot-password');
    assert.deepEqual(appels[0].corps, { email: 'claire@exemple.test', langue: 'fr' });
    assert.equal(document.querySelector('#email-oubli'), null, 'le formulaire est remplacé');
    assert.ok(!texte().includes('compte existe'), 'aucune confirmation d’existence');
  });

  test('l’adresse est normalisée (espaces et majuscules) avant l’envoi', async () => {
    bouchon({ 'POST /api/auth/forgot-password': () => ({ statut: 202, json: { ok: true } }) });
    await monter(enveloppe(React.createElement(MotDePasseOubliePage)));
    await saisir('#email-oubli', '  Claire@Exemple.TEST  ');
    await soumettre();
    await attendre(() => appels.length === 1);
    assert.deepEqual(appels[0].corps, { email: 'claire@exemple.test', langue: 'fr' });
  });

  test('503 : le service non configuré est dit franchement, sans faux succès', async () => {
    bouchon({
      'POST /api/auth/forgot-password': () => ({
        statut: 503,
        json: { error: 'non configuré', code: 'mail-indisponible' },
      }),
    });
    await monter(enveloppe(React.createElement(MotDePasseOubliePage)));
    await saisir('#email-oubli', 'claire@exemple.test');
    await soumettre();
    await attendre(() => texte().includes(t.mailIndisponible), 'message d’indisponibilité attendu');
    assert.ok(!texte().includes(t.oubliEnvoye), 'aucun message de succès');
    assert.ok(document.querySelector('#email-oubli'), 'le formulaire reste utilisable');
  });

  test('429 : la limite est annoncée, le formulaire reste actif', async () => {
    bouchon({
      'POST /api/auth/forgot-password': () => ({ statut: 429, json: { error: 'trop', code: 'limite' } }),
    });
    await monter(enveloppe(React.createElement(MotDePasseOubliePage)));
    await saisir('#email-oubli', 'claire@exemple.test');
    await soumettre();
    await attendre(() => texte().includes(t.limite), 'message de limite attendu');
    assert.ok(document.querySelector('#email-oubli'));
  });
});

/* ─────────────────────────── Réinitialisation ─────────────────────────── */

describe('Réinitialisation — interactions', () => {
  const chemin = '/reinitialiser?jeton=jeton-de-test-suffisamment-long';
  const jeton = 'jeton-de-test-suffisamment-long';

  test('sans jeton : les champs sont inactifs et le lien est annoncé invalide', async () => {
    bouchon({});
    await monter(enveloppe(React.createElement(ReinitialiserPage), '/reinitialiser'));
    const bouton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    assert.equal(bouton.disabled, true);
    assert.ok(texte().includes(t.lienInvalide));
  });

  test('deux mots de passe différents : erreur locale, aucun appel réseau', async () => {
    bouchon({});
    await monter(enveloppe(React.createElement(ReinitialiserPage), chemin));
    await saisir('#reset-mdp', 'MotDePasseSolide1!');
    await saisir('#reset-confirmation', 'AutreMotDePasse2!');
    await soumettre();
    assert.ok(texte().includes(t.resetDifferents));
    assert.equal(appels.length, 0);
  });

  test('un mot de passe trop court est refusé avant l’envoi', async () => {
    bouchon({});
    await monter(enveloppe(React.createElement(ReinitialiserPage), chemin));
    await saisir('#reset-mdp', 'court');
    await saisir('#reset-confirmation', 'court');
    await soumettre();
    assert.ok(texte().includes(t.resetCourt));
    assert.equal(appels.length, 0);
  });

  test('succès : le jeton part au serveur, l’URL est nettoyée, le lien n’est pas réutilisable', async () => {
    bouchon({
      'POST /api/auth/reset-password': () => ({
        statut: 200,
        json: { ok: true, sessionsFermees: 2 },
      }),
    });
    await monter(enveloppe(React.createElement(ReinitialiserPage), chemin));
    await saisir('#reset-mdp', 'NouveauMotDePasse1!');
    await saisir('#reset-confirmation', 'NouveauMotDePasse1!');
    await soumettre();
    await attendre(() => texte().includes(t.resetFait), 'confirmation attendue');

    assert.equal(appels.length, 1);
    assert.deepEqual(appels[0].corps, { token: jeton, password: 'NouveauMotDePasse1!' });
    assert.equal(window.location.search, '', 'le jeton est retiré de la barre d’adresse');
    assert.ok(!texte().includes(jeton), 'le jeton n’est jamais affiché');
    assert.equal(document.querySelectorAll('input').length, 0, 'le formulaire est remplacé');
  });

  test('jeton expiré : message dédié, le formulaire reste pour réessayer', async () => {
    bouchon({
      'POST /api/auth/reset-password': () => ({
        statut: 400,
        json: { error: 'expiré', code: 'jeton-expire' },
      }),
    });
    await monter(enveloppe(React.createElement(ReinitialiserPage), chemin));
    await saisir('#reset-mdp', 'NouveauMotDePasse1!');
    await saisir('#reset-confirmation', 'NouveauMotDePasse1!');
    await soumettre();
    await attendre(() => texte().includes(t.resetExpire), 'message d’expiration attendu');
    assert.ok(document.querySelector('#reset-mdp'), 'le formulaire reste affiché');
  });

  test('jeton déjà utilisé : message d’invalidité, pas d’expiration', async () => {
    bouchon({
      'POST /api/auth/reset-password': () => ({
        statut: 400,
        json: { error: 'invalide', code: 'jeton-invalide' },
      }),
    });
    await monter(enveloppe(React.createElement(ReinitialiserPage), chemin));
    await saisir('#reset-mdp', 'NouveauMotDePasse1!');
    await saisir('#reset-confirmation', 'NouveauMotDePasse1!');
    await soumettre();
    await attendre(() => texte().includes(t.resetInvalide));
  });
});

/* ─────────────────────────── Vérification ─────────────────────────── */

describe('Vérification d’adresse — interactions', () => {
  const chemin = '/verifier-email?jeton=jeton-de-test-suffisamment-long';

  test('le jeton est envoyé une seule fois au montage', async () => {
    bouchon({
      'POST /api/auth/verify-email': () => ({ statut: 200, json: { compte: COMPTE } }),
    });
    await monter(enveloppe(React.createElement(VerifierEmailPage), chemin));
    await attendre(() => texte().includes(t.verifOk), 'confirmation attendue');
    assert.equal(appels.length, 1, 'un seul appel, même si React remonte le composant');
    assert.deepEqual(appels[0].corps, { token: 'jeton-de-test-suffisamment-long' });
    assert.equal(window.location.search, '', 'le jeton quitte l’URL');
  });

  test('un jeton refusé est annoncé comme tel', async () => {
    bouchon({
      'POST /api/auth/verify-email': () => ({
        statut: 400,
        json: { error: 'invalide', code: 'jeton-invalide' },
      }),
    });
    await monter(enveloppe(React.createElement(VerifierEmailPage), chemin));
    await attendre(() => texte().includes(t.verifEchec), 'état d’échec attendu');
    assert.ok(texte().includes(t.resetInvalide));
  });

  test('sans jeton : aucun appel réseau, message immédiat', async () => {
    bouchon({});
    reinitialiserUrl('/verifier-email');
    await monter(enveloppe(React.createElement(VerifierEmailPage), '/verifier-email'));
    await attendre(() => texte().includes(t.verifEchec));
    assert.equal(appels.length, 0);
  });
});

/* ─────────────────────────── Sécurité du compte ─────────────────────────── */

describe('Sécurité du compte — interactions', () => {
  const sessions = [
    {
      id: 'aaaaaaaaaaaaaaaa',
      libelle: 'Chrome · macOS',
      courante: true,
      cree: '2026-11-01T10:00:00.000Z',
      derniereActivite: '2026-11-06T09:00:00.000Z',
      expire: '2026-12-01T10:00:00.000Z',
    },
    {
      id: 'bbbbbbbbbbbbbbbb',
      libelle: 'Safari · iOS',
      courante: false,
      cree: '2026-10-20T08:00:00.000Z',
      derniereActivite: '2026-11-05T18:30:00.000Z',
      expire: '2026-11-20T08:00:00.000Z',
    },
  ];

  function routes(extra: Record<string, (corps?: unknown) => Reponse> = {}) {
    return {
      'GET /api/me': () => ({ statut: 200, json: { compte: COMPTE } }),
      'GET /api/v1/me/sessions': () => ({ statut: 200, json: { sessions } }),
      ...extra,
    };
  }

  test('les sessions sont listées, l’appareil courant est identifié et non révocable', async () => {
    bouchon(routes());
    await monter(enveloppe(React.createElement(SecuriteCompte), '/parametres'));
    await attendre(() => texte().includes('Safari · iOS'), 'sessions attendues');

    assert.ok(texte().includes('Chrome · macOS'));
    assert.ok(texte().includes(t.sessionCourante));
    const lignes = document.querySelectorAll('.session-ligne');
    assert.equal(lignes.length, 2);
    assert.equal(
      lignes[0].querySelector('button'),
      null,
      'la session courante n’offre pas de bouton « Fermer »',
    );
    assert.ok(lignes[1].querySelector('button'));
  });

  test('fermer une session appelle bien la route et rafraîchit la liste', async () => {
    let revoquee = false;
    bouchon(
      routes({
        'DELETE /api/v1/me/sessions/bbbbbbbbbbbbbbbb': () => {
          revoquee = true;
          return { statut: 200, json: { ok: true } };
        },
        'GET /api/v1/me/sessions': () => ({
          statut: 200,
          json: { sessions: revoquee ? [sessions[0]] : sessions },
        }),
      }),
    );
    await monter(enveloppe(React.createElement(SecuriteCompte), '/parametres'));
    await attendre(() => texte().includes('Safari · iOS'));

    const boutons = document.querySelectorAll('.session-ligne button');
    assert.equal(boutons.length, 1, 'seule la session distante est révocable');
    const React2 = React;
    await React2.act(async () => {
      (boutons[0] as HTMLButtonElement).dispatchEvent(
        new window.MouseEvent('click', { bubbles: true }),
      );
    });

    await attendre(() => !texte().includes('Safari · iOS'), 'la session doit disparaître');
    assert.ok(revoquee);
    assert.equal(
      appels.filter((a) => a.methode === 'DELETE').length,
      1,
      'un seul appel de révocation',
    );
  });

  test('« fermer les autres sessions » est proposé tant qu’il en reste', async () => {
    let fermees = false;
    bouchon(
      routes({
        'POST /api/v1/me/sessions/revoquer-autrui': () => {
          fermees = true;
          return { statut: 200, json: { ok: true, sessionsFermees: 1 } };
        },
        'GET /api/v1/me/sessions': () => ({
          statut: 200,
          json: { sessions: fermees ? [sessions[0]] : sessions },
        }),
      }),
    );
    await monter(enveloppe(React.createElement(SecuriteCompte), '/parametres'));
    await attendre(() => texte().includes(t.sessionsRevoquerAutres));

    const bouton = [...document.querySelectorAll('button')].find((b) =>
      (b.textContent ?? '').includes(t.sessionsRevoquerAutres),
    ) as HTMLButtonElement;
    await React.act(async () => {
      bouton.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    });

    await attendre(() => !texte().includes('Safari · iOS'));
    assert.ok(fermees);
  });

  test('adresse non confirmée : le renvoi est proposé et son résultat affiché', async () => {
    bouchon(
      routes({
        'POST /api/v1/me/email/renvoyer': () => ({
          statut: 202,
          json: { ok: true, expireDansMinutes: 1440 },
        }),
      }),
    );
    await monter(enveloppe(React.createElement(SecuriteCompte), '/parametres'));
    await attendre(() => texte().includes(t.emailNonVerifie));

    const bouton = [...document.querySelectorAll('button')].find((b) =>
      (b.textContent ?? '').includes(t.emailRenvoyer),
    ) as HTMLButtonElement;
    assert.ok(bouton, 'le bouton de renvoi doit être présent');
    await React.act(async () => {
      bouton.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    });
    await attendre(() => texte().includes(t.emailEnvoye));
    const envoi = appels.find((a) => a.url === '/api/v1/me/email/renvoyer');
    assert.ok(envoi);
    assert.deepEqual(envoi!.corps, { langue: 'fr' });
  });

  test('changement de mot de passe : refus local puis appel réel et confirmation', async () => {
    bouchon(
      routes({
        'POST /api/v1/me/password': () => ({
          statut: 200,
          json: { ok: true, sessionsFermees: 1 },
        }),
      }),
    );
    await monter(enveloppe(React.createElement(SecuriteCompte), '/parametres'));
    await attendre(() => document.querySelector('#param-actuel') !== null);

    // 1. Confirmation différente → aucune requête.
    await saisir('#param-actuel', 'ActuelMotDePasse1!');
    await saisir('#param-nouveau', 'NouveauMotDePasse1!');
    await saisir('#param-confirmation', 'AutreChose2!');
    await saisir('#param-confirmation', 'AutreChose2!');
    const formulaire = document.querySelector('#param-actuel')!.closest('form') as HTMLFormElement;
    await React.act(async () => {
      formulaire.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    });
    assert.ok(texte().includes(t.mdpDifferents));
    assert.equal(
      appels.filter((a) => a.url === '/api/v1/me/password').length,
      0,
      'aucun appel tant que la confirmation ne correspond pas',
    );

    // 2. Confirmation correcte → l'API est appelée puis confirmée.
    await saisir('#param-confirmation', 'NouveauMotDePasse1!');
    await React.act(async () => {
      formulaire.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    });
    await attendre(() => texte().includes(t.mdpFait), 'confirmation attendue');

    const envoi = appels.find((a) => a.url === '/api/v1/me/password');
    assert.deepEqual(envoi!.corps, {
      actuel: 'ActuelMotDePasse1!',
      nouveau: 'NouveauMotDePasse1!',
    });
    assert.equal(
      (document.querySelector('#param-nouveau') as HTMLInputElement).value,
      '',
      'les champs sont vidés après succès',
    );
  });

  test('mot de passe actuel refusé : le message du serveur est relayé', async () => {
    bouchon(
      routes({
        'POST /api/v1/me/password': () => ({
          statut: 401,
          json: { error: 'incorrect', code: 'mot-de-passe' },
        }),
      }),
    );
    await monter(enveloppe(React.createElement(SecuriteCompte), '/parametres'));
    await attendre(() => document.querySelector('#param-actuel') !== null);
    await saisir('#param-actuel', 'FauxMaisLong1!');
    await saisir('#param-nouveau', 'NouveauMotDePasse1!');
    await saisir('#param-confirmation', 'NouveauMotDePasse1!');
    const formulaire = document.querySelector('#param-actuel')!.closest('form') as HTMLFormElement;
    await React.act(async () => {
      formulaire.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    });
    await attendre(() => texte().includes(t.mdpIncorrect), 'message d’erreur attendu');
    assert.ok(!texte().includes(t.mdpFait));
  });
});
