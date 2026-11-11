/**
 * Guide public des sources — ce qu'il doit dire, et ne pas dire.
 *
 * La documentation ne promet jamais une fonction absente : la recherche
 * sémantique n'est pas active (aucun fournisseur d'embeddings), et une
 * ressource non validée n'est pas citable. Ces deux limites doivent rester
 * écrites noir sur blanc.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DOCS } from '../src/app/docs';

describe('Guide « Sources et citations »', () => {
  test('existe dans les deux langues, avec les mêmes sections', () => {
    const fr = DOCS.fr.articles.find((a) => a.slug === 'sources');
    const en = DOCS.en.articles.find((a) => a.slug === 'sources');
    assert.ok(fr && en, 'guide des sources absent');
    assert.deepEqual(en!.sections.map((s) => s.id), fr!.sections.map((s) => s.id));
  });

  test('décrit les limites réelles', () => {
    const texte = JSON.stringify(DOCS.fr.articles.find((a) => a.slug === 'sources'));
    assert.match(texte, /lexicale/);
    assert.match(texte, /à vérifier/);
    assert.match(texte, /\[S1\]/);
    assert.doesNotMatch(texte, /sémantique (est|sera) (active|disponible)/i);
  });

  test('les articles associés existent', () => {
    const slugs = new Set(DOCS.fr.articles.map((a) => a.slug));
    const article = DOCS.fr.articles.find((a) => a.slug === 'sources')!;
    for (const associe of article.associes) assert.ok(slugs.has(associe), associe);
  });
});
