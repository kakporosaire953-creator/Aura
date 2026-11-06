/**
 * Rendu des écrans de récupération (mission 08).
 *
 * Ce n'est pas un test navigateur : les composants sont rendus côté serveur
 * (`react-dom/server`) avec un `window` minimal. Cela prouve qu'ils
 * s'exécutent sans erreur, avec le bon contenu et les bons liens — sans
 * prétendre vérifier le CSS, le focus ou les animations.
 *   node --import tsx --test tests/pages-compte.test.ts
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

/* ── Environnement navigateur minimal, avant tout import de composant ── */
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
(globalThis as unknown as { window: unknown }).window = {
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  localStorage: globalThis.localStorage,
  scrollTo() {},
  location: { pathname: '/', search: '' },
  history: { replaceState() {} },
};

process.env.NODE_ENV = 'test';

const { PrefsProvider } = await import('../src/app/prefs');
const { SessionProvider } = await import('../src/app/session');
const { MotDePasseOubliePage } = await import('../src/pages/MotDePasseOubliePage');
const { ReinitialiserPage } = await import('../src/pages/ReinitialiserPage');
const { VerifierEmailPage } = await import('../src/pages/VerifierEmailPage');
const { CONTENT } = await import('../src/app/dictionaries');

type Composant = React.ComponentType<Record<string, never>>;

function rendre(Page: Composant, chemin: string): string {
  return renderToString(
    React.createElement(
      PrefsProvider,
      null,
      React.createElement(
        SessionProvider,
        null,
        React.createElement(
          MemoryRouter,
          { initialEntries: [chemin] },
          React.createElement(Page as React.ComponentType),
        ),
      ),
    ),
  );
}

const fr = CONTENT.fr.securite;

before(() => {
  magasin.clear();
});

describe('Mot de passe oublié', () => {
  test('le formulaire s’affiche avec le bon libellé et le retour connexion', () => {
    const html = rendre(MotDePasseOubliePage, '/mot-de-passe-oublie');
    assert.ok(html.includes('compte-page'));
    assert.ok(html.includes(fr.oubliTitre1));
    assert.ok(html.includes(fr.oubliTitre2));
    assert.ok(html.includes(fr.oubliSubmit));
    assert.ok(html.includes('type="email"'));
    assert.ok(html.includes('/login'), 'retour vers la connexion');
    assert.ok(html.includes(fr.oubliNote), 'la promesse d’anti-énumération est affichée');
  });

  test('le mot de passe oublié est atteignable depuis la connexion', async () => {
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../src/pages/AuthPage.tsx', import.meta.url), 'utf8'),
    );
    assert.match(source, /\/mot-de-passe-oublie/);
  });
});

describe('Réinitialisation', () => {
  test('sans jeton : le lien est annoncé invalide, le bouton est inactif', () => {
    const html = rendre(ReinitialiserPage, '/reinitialiser');
    assert.ok(html.includes(fr.resetNouveau));
    assert.ok(html.includes(fr.resetConfirmer));
    assert.equal((html.match(/disabled=""/g) ?? []).length, 3, 'les deux champs et le bouton');
  });

  test('avec jeton : les champs sont actifs', () => {
    const html = rendre(ReinitialiserPage, '/reinitialiser?jeton=jeton-de-test-suffisamment-long');
    assert.ok(html.includes(fr.resetSubmit));
    assert.equal((html.match(/disabled=""/g) ?? []).length, 0);
    assert.ok(!html.includes(fr.lienInvalide));
  });
});

describe('Confirmation d’adresse', () => {
  test('l’écran s’affiche en attente, sans appel réseau au rendu', () => {
    let appels = 0;
    const fetchReel = globalThis.fetch;
    globalThis.fetch = (async () => {
      appels += 1;
      throw new Error('appel inattendu au rendu');
    }) as typeof fetch;
    try {
      const html = rendre(VerifierEmailPage, '/verifier-email');
      assert.ok(html.includes(fr.verifTitre));
      assert.ok(html.includes(fr.verifEnCours));
      assert.equal(appels, 0, 'le rendu lui-même ne déclenche aucune requête');
    } finally {
      globalThis.fetch = fetchReel;
    }
  });
});

describe('Textes FR/EN', () => {
  test('les deux langues couvrent les mêmes clés', () => {
    const clesFr = Object.keys(CONTENT.fr.securite).sort();
    const clesEn = Object.keys(CONTENT.en.securite).sort();
    assert.deepEqual(clesEn, clesFr);
    assert.ok(clesFr.length >= 50);
  });

  test('aucun texte anglais ne traîne dans la version française', () => {
    for (const [cle, valeur] of Object.entries(CONTENT.fr.securite)) {
      assert.equal(typeof valeur, 'string', cle);
      assert.ok(!/\b(the|your|password has)\b/i.test(valeur as string), `${cle} semble anglais`);
    }
  });
});
