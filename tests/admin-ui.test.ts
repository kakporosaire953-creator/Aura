/**
 * Panneau d'administration — comportement réel des écrans.
 *
 * Ce n'est PAS un test navigateur : jsdom ne rend aucun pixel et n'applique
 * aucune feuille de style. Ce qui est prouvé ici : React est monté, les
 * appels réseau sont interceptés, les clics déclenchent les bonnes requêtes,
 * et chaque état (non configuré, refusé, administrateur) affiche le bon
 * message. L'accès lui-même reste décidé par le serveur (`tests/admin.test.ts`).
 *   node --import tsx --test tests/admin-ui.test.ts
 */
import { test, describe, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  attendre,
  cliquer,
  demonter,
  fermerNavigateur,
  installerNavigateur,
  monter,
  saisir,
  texte,
} from './support/dom';

installerNavigateur('https://aura.test/admin');
process.env.NODE_ENV = 'test';

const React = await import('react');
const { MemoryRouter } = await import('react-router-dom');
const { PrefsProvider } = await import('../src/app/prefs');
const { SessionProvider } = await import('../src/app/session');
const { AdminPage } = await import('../src/pages/AdminPage');
const { CONTENT } = await import('../src/app/dictionaries');

const t = CONTENT.fr.admin;

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
    appels.push({ methode, url: u, corps });
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
  email: 'claire@exemple.test',
  nom: 'Claire',
  cree: '2026-01-01T00:00:00.000Z',
  onboarding: { fait: true, objectif: null },
  emailVerifie: true,
};

const STATS = {
  comptes: 12,
  verifies: 9,
  google: 3,
  bannis: 1,
  sessionsActives: 5,
  inscriptions7j: 4,
  conversations: 21,
  messages: 154,
  creations: 33,
};

const UTILISATEURS = [
  {
    id: 'usr_1',
    email: 'claire@exemple.test',
    nom: 'Claire',
    cree: '2026-01-01T00:00:00.000Z',
    emailVerifie: true,
    googleLie: false,
    banni: false,
    sessions: 2,
    derniereActivite: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'usr_2',
    email: 'trouble@exemple.test',
    nom: null,
    cree: '2026-01-15T00:00:00.000Z',
    emailVerifie: false,
    googleLie: true,
    banni: true,
    sessions: 0,
    derniereActivite: null,
  },
];

const DETAIL = {
  utilisateur: {
    ...UTILISATEURS[0],
    bannissement: null,
  },
  sessions: [
    { id: 'ses_1', cree: '2026-02-01T09:00:00.000Z', expire: 0, derniereActivite: 1770000000000, agent: 'Firefox / Linux' },
  ],
  activite: { conversations: 4, messages: 30, projets: 2, missions: 6, creations: 11 },
};

const JOURNAL = {
  entrees: [
    {
      id: 'j1',
      le: '2026-02-02T08:00:00.000Z',
      par: 'claire@exemple.test',
      action: 'bannir',
      cible: 'trouble@exemple.test',
      motif: 'abus',
    },
  ],
};

function monterPage() {
  return monter(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(
        PrefsProvider,
        null,
        React.createElement(SessionProvider, null, React.createElement(AdminPage, null)),
      ),
    ),
  );
}

/** Réseau nominal : un administrateur connecté devant 2 comptes. */
function routesAdmin(etat: { admin: boolean; configure: boolean } = { admin: true, configure: true }) {
  return {
    'GET /api/me': () => ({ json: { compte: COMPTE, verificationEmail: 'facultative' } }),
    'GET /api/v1/admin/etat': () => ({ json: etat }),
    'GET /api/v1/admin/statistiques': () => ({ json: STATS }),
    'GET /api/v1/admin/utilisateurs': () => ({
      json: { total: 2, page: 1, pages: 1, utilisateurs: UTILISATEURS },
    }),
    'GET /api/v1/admin/utilisateurs/usr_1': () => ({ json: DETAIL }),
    'GET /api/v1/admin/journal': () => ({ json: JOURNAL }),
    'POST /api/v1/admin/utilisateurs/usr_1/bannir': () => ({ json: { ok: true } }),
    'POST /api/v1/admin/utilisateurs/usr_2/debannir': () => ({ json: { ok: true } }),
  };
}

const contient = (motif: string) => () => texte().includes(motif);

beforeEach(async () => {
  await demonter();
});

after(async () => {
  await demonter();
  fermerNavigateur();
});

/* ─────────────────────────────── Tests ─────────────────────────────── */

describe('Panneau d’administration — accès', () => {
  test('sans variable côté serveur : le motif est affiché, rien d’autre', async () => {
    bouchon(routesAdmin({ admin: false, configure: false }));
    await monterPage();
    await attendre(contient(t.nonConfigure), 'message de non-configuration absent');
    assert.equal(appels.some((a) => a.url.includes('/statistiques')), false);
  });

  test('compte ordinaire : accès refusé, aucune donnée demandée', async () => {
    bouchon(routesAdmin({ admin: false, configure: true }));
    await monterPage();
    await attendre(contient(t.accesRefuse), 'message de refus absent');
    assert.equal(document.querySelector('.admin-tableau'), null);
  });
});

describe('Panneau d’administration — données réelles', () => {
  test('les statistiques, la liste et le journal viennent du serveur', async () => {
    bouchon(routesAdmin());
    await monterPage();
    await attendre(contient('claire@exemple.test'), 'liste non rendue');
    const stats = document.querySelectorAll('.admin-stat');
    assert.equal(stats.length, 9);
    assert.match(texte(), new RegExp(`12\\s*${t.comptes}`));
    assert.match(texte(), /trouble@exemple\.test/);
    assert.match(texte(), new RegExp(t.banni));
    assert.match(texte(), new RegExp(t.nonVerifie));
    assert.match(texte(), /abus/);
  });

  test('« Suspendre » ouvre le détail, confirmer envoie le bon POST', async () => {
    bouchon(routesAdmin());
    await monterPage();
    await attendre(contient('trouble@exemple.test'), 'liste non rendue');

    await cliquer('.admin-tableau tbody tr:nth-child(1) .admin-btn-danger');
    await attendre(contient(t.detailTitre), 'panneau de détail absent');
    await attendre(contient('Firefox / Linux'), 'sessions du compte absentes');

    await saisir('#admin-motif', 'publicité répétée');
    const boutons = [...document.querySelectorAll('.admin-danger button')] as HTMLElement[];
    const confirmer = boutons.find((b) => b.textContent?.includes(t.bannirConfirmer));
    assert.ok(confirmer, 'bouton de confirmation introuvable');
    await cliquer('.admin-danger button');

    await attendre(
      () => appels.some((a) => a.methode === 'POST' && a.url.endsWith('/usr_1/bannir')),
      'aucun POST de suspension',
    );
    const post = appels.find((a) => a.methode === 'POST' && a.url.endsWith('/usr_1/bannir'));
    assert.deepEqual(post?.corps, { motif: 'publicité répétée' });
    await attendre(contient(t.faitBanni), 'confirmation absente');
  });

  test('un compte suspendu propose « Rétablir », pas « Suspendre »', async () => {
    bouchon(routesAdmin());
    await monterPage();
    await attendre(contient('trouble@exemple.test'), 'liste non rendue');
    const ligne = document.querySelector('.admin-tableau tbody tr:nth-child(2)') as HTMLElement;
    assert.match(ligne.textContent ?? '', new RegExp(t.debannir));
    assert.doesNotMatch(ligne.textContent ?? '', new RegExp(t.bannirConfirmer));
  });

  test('la suppression reste bloquée tant que l’adresse n’est pas recopiée', async () => {
    bouchon(routesAdmin());
    await monterPage();
    await attendre(contient('trouble@exemple.test'), 'liste non rendue');
    await cliquer('.admin-tableau tbody tr:nth-child(1) .admin-btn');
    await attendre(contient(t.detailTitre), 'panneau de détail absent');

    const suppression = [...document.querySelectorAll('.admin-danger button')].find((b) =>
      b.textContent?.includes(t.supprimerConfirmer),
    ) as HTMLButtonElement | undefined;
    assert.ok(suppression, 'bouton de suppression introuvable');
    assert.equal(suppression.disabled, true);

    await saisir('#admin-confirmation', 'claire@exemple.test');
    assert.equal(suppression.disabled, false);
    assert.equal(
      appels.some((a) => a.methode === 'POST' && a.url.endsWith('/supprimer')),
      false,
      'aucune suppression ne doit partir avant le clic',
    );
  });

  test('une recherche relance la liste avec le bon paramètre', async () => {
    bouchon(routesAdmin());
    await monterPage();
    await attendre(contient('trouble@exemple.test'), 'liste non rendue');

    await saisir('#admin-recherche', 'claire');
    const formulaire = document.querySelector('.admin-recherche') as HTMLFormElement;
    const React2 = React;
    await React2.act(async () => {
      formulaire.dispatchEvent(
        new (globalThis as unknown as { Event: typeof Event }).Event('submit', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    await attendre(
      () => appels.some((a) => a.url.includes('/admin/utilisateurs?') && a.url.includes('recherche=claire')),
      'recherche non transmise',
    );
  });
});
