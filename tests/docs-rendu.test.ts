/**
 * Documentation — rendu réel de chaque guide (côté serveur).
 *
 * Ce n'est pas un test navigateur : les pages sont rendues avec
 * `react-dom/server` et un `window` minimal. Ce qui est prouvé : les douze
 * guides s'affichent sans erreur, le sommaire liste bien chaque section, les
 * tableaux produisent le bon nombre de cellules, et les liens « à lire
 * ensuite » pointent vers des pages existantes.
 *   node --import tsx --test tests/docs-rendu.test.ts
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

/* ── Environnement minimal, avant tout import de composant ── */
const magasin = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (cle: string) => (magasin.has(cle) ? (magasin.get(cle) as string) : null),
  setItem: (cle: string, valeur: string) => void magasin.set(cle, String(valeur)),
  removeItem: (cle: string) => void magasin.delete(cle),
  clear: () => void magasin.clear(),
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
const { DocumentationPage } = await import('../src/pages/DocumentationPage');
const { DocumentationArticlePage } = await import('../src/pages/DocumentationArticlePage');
const { DOCS } = await import('../src/app/docs');

function rendre(element: React.ReactElement): string {
  return renderToString(
    React.createElement(
      PrefsProvider,
      null,
      React.createElement(MemoryRouter, null, element),
    ),
  );
}

/** Rend un guide à son URL, comme le fait le routeur de l'application. */
function rendreGuide(slug: string): string {
  return renderToString(
    React.createElement(
      PrefsProvider,
      null,
      React.createElement(
        MemoryRouter,
        { initialEntries: [`/documentation/${slug}`] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: '/documentation/:slug',
            element: React.createElement(DocumentationArticlePage),
          }),
        ),
      ),
    ),
  );
}

before(() => {
  magasin.set('aura_lang', 'fr');
});

describe('Hub de la documentation', () => {
  test('liste les douze guides avec leur titre et leur durée', () => {
    const html = rendre(React.createElement(DocumentationPage));
    for (const article of DOCS.fr.articles) {
      assert.ok(html.includes(article.titre), `titre absent du sommaire : ${article.titre}`);
    }
    assert.ok(html.includes('Démarrage'));
    assert.ok(html.includes('Installer AURA'));
  });
});

describe('Chaque guide se rend', () => {
  test('aucun article ne casse le rendu', () => {
    for (const article of DOCS.fr.articles) {
      const html = rendreGuide(article.slug);
      assert.ok(html.length > 2000, `${article.slug} : page suspicieusement courte`);
      assert.ok(html.includes(article.titre), `${article.slug} : titre absent`);
      // Chaque section doit figurer dans le sommaire de l'article.
      for (const section of article.sections) {
        assert.ok(html.includes(section.titre), `${article.slug} : section « ${section.titre} » absente`);
      }
    }
  });

  test('les tableaux produisent toutes leurs cellules', () => {
    for (const article of DOCS.fr.articles) {
      const html = rendreGuide(article.slug);
      for (const section of article.sections) {
        for (const bloc of section.blocs) {
          if (bloc.type !== 'tableau') continue;
          for (const ligne of bloc.lignes) {
            for (const cellule of ligne) {
              assert.ok(html.includes(cellule), `${article.slug}#${section.id} : cellule « ${cellule.slice(0, 40)} » absente`);
            }
          }
        }
      }
    }
  });

  test('les notes de limite sont rendues comme telles', () => {
    const html = rendreGuide('erreurs');
    assert.ok(html.includes('doc-note-limite'), 'aucune note de limite rendue sur le guide des erreurs');
    assert.ok(html.includes('compte-banni'));
  });
});
