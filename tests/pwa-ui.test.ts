/**
 * Application installable — comportement réel des composants (jsdom).
 *
 * Ce n'est PAS un test navigateur : l'invite d'installation de Chrome,
 * l'écran d'accueil d'iOS et l'affichage plein écran ne peuvent pas être
 * simulés honnêtement ici. Ce qui est vérifié : le bouton n'apparaît que
 * quand le navigateur émet réellement son invite, il déclenche la bonne
 * méthode, l'enregistrement vise `/sw.js` à la racine, et une mise à jour
 * n'est appliquée que sur clic.
 *   node --import tsx --test tests/pwa-ui.test.ts
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
  texte,
} from './support/dom';

const dom = installerNavigateur('https://aura.test/app');
process.env.NODE_ENV = 'test';

const React = await import('react');
const { PrefsProvider } = await import('../src/app/prefs');
const { BoutonInstaller } = await import('../src/components/pwa/BoutonInstaller');
const { BandeauMiseAJour } = await import('../src/components/pwa/BandeauMiseAJour');
const pwa = await import('../src/app/pwa');
const { CONTENT } = await import('../src/app/dictionaries');

const t = CONTENT.fr.pwa;

function monterAvec(element: React.ReactElement) {
  return monter(React.createElement(PrefsProvider, null, element));
}

/** Fabrique l'événement que Chrome émet quand le site est installable. */
function inviteInstallation(resultat: 'accepted' | 'dismissed' = 'accepted') {
  const evenement = new dom.window.Event('beforeinstallprompt', { cancelable: true });
  const journal = { prompt: 0, choix: 0 };
  Object.assign(evenement, {
    prompt: async () => {
      journal.prompt += 1;
    },
    userChoice: Promise.resolve({ outcome: resultat }).then((v) => {
      journal.choix += 1;
      return v;
    }),
  });
  return { evenement, journal };
}

beforeEach(async () => {
  await demonter();
  pwa._reinitialiserPwa();
});

after(async () => {
  await demonter();
  fermerNavigateur();
});

describe('Invitation à installer', () => {
  test('aucun bouton tant que le navigateur n’a rien proposé', async () => {
    await monterAvec(React.createElement(BoutonInstaller));
    assert.equal(document.querySelector('.ws-installer'), null);
    assert.equal(texte().includes(t.installer), false);
  });

  test('l’invite du navigateur fait apparaître le bouton, qui la déclenche', async () => {
    await monterAvec(React.createElement(BoutonInstaller));
    const { evenement, journal } = inviteInstallation('accepted');

    await React.act(async () => {
      dom.window.dispatchEvent(evenement);
    });

    await attendre(() => document.querySelector('.ws-installer') !== null, 'bouton absent');
    assert.match(texte(), new RegExp(t.installer));

    await cliquer('.ws-installer');
    assert.equal(journal.prompt, 1, 'prompt() non appelé');
    await attendre(() => journal.choix === 1, 'le choix de l’utilisateur n’a pas été lu');
  });

  test('un refus n’installe rien et ne laisse pas le bouton mentir', async () => {
    await monterAvec(React.createElement(BoutonInstaller));
    const { evenement } = inviteInstallation('dismissed');
    await React.act(async () => {
      dom.window.dispatchEvent(evenement);
    });
    await attendre(() => document.querySelector('.ws-installer') !== null, 'bouton absent');
    await cliquer('.ws-installer');
    await attendre(() => document.querySelector('.ws-installer') === null, 'le bouton devrait disparaître');
    assert.equal(pwa.estInstallee(), false);
  });

  test('reconnaît une application déjà installée (display-mode)', async () => {
    const originale = dom.window.matchMedia;
    dom.window.matchMedia = ((requete: string) => ({
      matches: requete.includes('display-mode: standalone'),
      media: requete,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    })) as unknown as typeof dom.window.matchMedia;
    try {
      assert.equal(pwa.estInstallee(), true);
    } finally {
      dom.window.matchMedia = originale;
    }
  });
});

describe('Service worker et mises à jour', () => {
  test('enregistre /sw.js à la racine, jamais un autre chemin', async () => {
    const enregistrements: { url: string; portee?: string }[] = [];
    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: async (url: string, opts?: { scope?: string }) => {
          enregistrements.push({ url, portee: opts?.scope });
          return { waiting: null, installing: null, addEventListener() {}, update: async () => undefined };
        },
        controller: {},
        addEventListener() {},
      },
    });

    pwa.enregistrerServiceWorker();
    if (document.readyState === 'loading') {
      dom.window.dispatchEvent(new dom.window.Event('load'));
    }

    await attendre(() => enregistrements.length > 0, 'aucun enregistrement de service worker');
    assert.deepEqual(enregistrements[0], { url: '/sw.js', portee: '/' });

    delete (globalThis.navigator as unknown as Record<string, unknown>).serviceWorker;
  });

  test('sans service worker disponible, rien ne casse', async () => {
    delete (globalThis.navigator as unknown as Record<string, unknown>).serviceWorker;
    assert.doesNotThrow(() => pwa.enregistrerServiceWorker());
  });

  test('une mise à jour est proposée, puis appliquée sur clic seulement', async () => {
    const messages: unknown[] = [];
    const ecouteursReg: Record<string, (() => void)[]> = {};
    const ecouteursWorker: Record<string, (() => void)[]> = {};
    const enAttente = {
      state: 'installed',
      postMessage: (m: unknown) => messages.push(m),
      addEventListener: (type: string, cb: () => void) =>
        void ((ecouteursWorker[type] ??= []).push(cb)),
    };
    const reg = {
      waiting: null as unknown,
      installing: null as unknown,
      addEventListener: (type: string, cb: () => void) => void ((ecouteursReg[type] ??= []).push(cb)),
      update: async () => undefined,
    };

    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: async () => reg,
        controller: {},
        addEventListener() {},
      },
    });

    await monterAvec(React.createElement(BandeauMiseAJour));
    assert.equal(texte().includes(t.miseAJour), false, 'aucun bandeau avant mise à jour');

    pwa.enregistrerServiceWorker();
    if (document.readyState === 'loading') {
      dom.window.dispatchEvent(new dom.window.Event('load'));
    }
    await attendre(() => (ecouteursReg.updatefound ?? []).length > 0, 'écouteur updatefound absent');

    // Le navigateur installe la nouvelle version en arrière-plan.
    reg.installing = { state: 'installing', addEventListener: (type: string, cb: () => void) => void ((ecouteursWorker[type] ??= []).push(cb)) };
    await React.act(async () => {
      (ecouteursReg.updatefound ?? []).forEach((cb) => cb());
    });
    (reg.installing as { state: string }).state = 'installed';
    await React.act(async () => {
      (ecouteursWorker.statechange ?? []).forEach((cb) => cb());
    });

    await attendre(() => texte().includes(t.miseAJour), 'bandeau de mise à jour absent');
    assert.equal(messages.length, 0, 'aucune activation sans clic');

    reg.waiting = enAttente;
    await cliquer('.pwa-maj button');
    assert.deepEqual(messages, [{ type: 'ACTIVER' }]);

    delete (globalThis.navigator as unknown as Record<string, unknown>).serviceWorker;
  });
});
