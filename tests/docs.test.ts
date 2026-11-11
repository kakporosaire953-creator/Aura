/**
 * Documentation du site — cohérence de ce qui est affiché.
 *
 * La documentation est du contenu, donc elle se relit : slugs uniques,
 * parité FR/EN, tableaux dont chaque ligne a le bon nombre de cellules,
 * articles associés réellement existants, icônes présentes dans le jeu
 * dessiné, et aucune phrase laissée en chantier. Ce fichier ne juge pas la
 * pertinence du propos — il empêche les fautes structurelles qui cassent la
 * page ou promettent un lien mort.
 *   node --import tsx --test tests/docs.test.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DOCS } from '../src/app/docs';

const RACINE = path.join(import.meta.dirname, '..');
const iconesSource = fs.readFileSync(path.join(RACINE, 'src/components/ui/Icone.tsx'), 'utf8');

const fr = DOCS.fr;
const en = DOCS.en;

describe('Structure bilingue', () => {
  test('le français et l’anglais ont les mêmes articles, dans le même ordre', () => {
    const slugsFr = fr.articles.map((a) => a.slug);
    const slugsEn = en.articles.map((a) => a.slug);
    assert.deepEqual(slugsEn, slugsFr);
    assert.ok(slugsFr.length >= 10, `seulement ${slugsFr.length} articles`);
  });

  test('les slugs sont uniques et lisibles dans une URL', () => {
    const slugs = fr.articles.map((a) => a.slug);
    assert.equal(new Set(slugs).size, slugs.length, 'slug en double');
    for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  test('chaque article a un titre, un résumé et une durée crédible', () => {
    for (const a of fr.articles) {
      assert.ok(a.titre.length > 2, `${a.slug} : titre vide`);
      assert.ok(a.resume.length > 20, `${a.slug} : résumé trop court`);
      assert.match(a.duree, /^\d{1,2} min$/, `${a.slug} : durée « ${a.duree} »`);
    }
  });
});

describe('Sections et blocs', () => {
  test('chaque article a au moins trois sections, avec des identifiants uniques', () => {
    for (const a of fr.articles) {
      assert.ok(a.sections.length >= 3, `${a.slug} : ${a.sections.length} section(s)`);
      const ids = a.sections.map((s) => s.id);
      assert.equal(new Set(ids).size, ids.length, `${a.slug} : identifiant de section en double`);
      for (const s of a.sections) {
        assert.match(s.id, /^[a-z0-9]+(-[a-z0-9]+)*$/);
        assert.ok(s.titre.length > 2, `${a.slug}#${s.id} : titre vide`);
        assert.ok(s.blocs.length > 0, `${a.slug}#${s.id} : aucun bloc`);
      }
    }
  });

  test('la structure des sections est identique en français et en anglais', () => {
    for (let i = 0; i < fr.articles.length; i++) {
      const a = fr.articles[i];
      const b = en.articles[i];
      assert.equal(b.slug, a.slug);
      assert.deepEqual(
        b.sections.map((s) => s.id),
        a.sections.map((s) => s.id),
        `${a.slug} : sections différentes entre FR et EN`,
      );
      assert.equal(b.sections.length, a.sections.length);
    }
  });

  test('aucun texte vide, aucun tableau mal formé', () => {
    for (const langue of [fr, en]) {
      for (const a of langue.articles) {
        for (const s of a.sections) {
          for (const bloc of s.blocs) {
            if (bloc.type === 'para') {
              assert.ok(bloc.texte.trim().length > 10, `${a.slug}#${s.id} : paragraphe vide`);
            }
            if (bloc.type === 'note') {
              assert.ok(bloc.texte.trim().length > 10, `${a.slug}#${s.id} : note vide`);
            }
            if (bloc.type === 'liste' || bloc.type === 'etapes') {
              assert.ok(bloc.items.length >= 2, `${a.slug}#${s.id} : liste de ${bloc.items.length} élément(s)`);
              for (const item of bloc.items) assert.ok(item.trim().length > 3);
            }
            if (bloc.type === 'tableau') {
              assert.ok(bloc.entetes.length >= 2, `${a.slug}#${s.id} : tableau à une colonne`);
              assert.ok(bloc.lignes.length >= 1, `${a.slug}#${s.id} : tableau vide`);
              for (const [i, ligne] of bloc.lignes.entries()) {
                assert.equal(
                  ligne.length,
                  bloc.entetes.length,
                  `${a.slug}#${s.id} : ligne ${i + 1} a ${ligne.length} cellule(s) pour ${bloc.entetes.length} en-tête(s)`,
                );
              }
            }
            if (bloc.type === 'code') {
              assert.ok(bloc.code.trim().length > 0, `${a.slug}#${s.id} : bloc de code vide`);
            }
          }
        }
      }
    }
  });

  test('aucun texte laissé en chantier', () => {
    const interdits = [/lorem ipsum/i, /\bTODO\b/, /\bFIXME\b/, /à compléter/i, /\bXXX\b/];
    const textes: string[] = [];
    for (const langue of [fr, en]) {
      for (const a of langue.articles) {
        textes.push(a.titre, a.resume);
        for (const s of a.sections) {
          textes.push(s.titre);
          for (const bloc of s.blocs) {
            if ('texte' in bloc) textes.push(bloc.texte);
            if ('items' in bloc) textes.push(...bloc.items);
            if (bloc.type === 'tableau') textes.push(...bloc.entetes, ...bloc.lignes.flat());
          }
        }
      }
    }
    for (const texte of textes) {
      for (const motif of interdits) assert.doesNotMatch(texte, motif);
    }
  });
});

describe('Liens et icônes', () => {
  test('les articles associés existent et ne se citent pas eux-mêmes', () => {
    const slugs = new Set(fr.articles.map((a) => a.slug));
    for (const langue of [fr, en]) {
      for (const a of langue.articles) {
        assert.ok(a.associes.length >= 1, `${a.slug} : aucun article associé`);
        for (const cible of a.associes) {
          assert.ok(slugs.has(cible), `${a.slug} renvoie vers « ${cible} », qui n’existe pas`);
          assert.notEqual(cible, a.slug, `${a.slug} se cite lui-même`);
        }
      }
    }
  });

  test('chaque icône d’article est dessinée dans le jeu d’icônes', () => {
    for (const a of fr.articles) {
      assert.ok(
        iconesSource.includes(`'${a.icone}'`) || iconesSource.includes(`${a.icone}:`),
        `icône « ${a.icone} » absente de Icone.tsx (article ${a.slug})`,
      );
    }
  });

  test('les sujets attendus sont réellement couverts', () => {
    const slugs = fr.articles.map((a) => a.slug);
    for (const attendu of [
      'demarrage',
      'conversation',
      'projets-missions',
      'memoire',
      'explorer',
      'studio',
      'exports',
      'application',
      'compte-securite',
      'erreurs',
      'limites',
      'api',
    ]) {
      assert.ok(slugs.includes(attendu), `guide manquant : ${attendu}`);
    }
  });
});
