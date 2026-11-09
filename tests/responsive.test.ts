/**
 * Contrat de responsive — vérifications statiques du CSS.
 *
 * Ce test ne dessine rien : il ne remplace pas un navigateur. Il verrouille
 * les règles qui, dans l'historique du projet, ont réellement cassé la mise
 * en page — pistes de grille plus larges que l'écran, hauteurs en `vh` sur
 * mobile, tableaux qui poussent la page, actions de liste invisibles au
 * tactile. Une régression sur ces points doit échouer ici avant d'arriver
 * en production.
 *
 *   node --import tsx --test tests/responsive.test.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

/**
 * Contenu de **tous** les blocs `@media` dont la condition est exacte.
 * Le fichier contient plusieurs blocs pour un même point de rupture
 * (sections historiques) : chercher dans un seul produirait des faux
 * négatifs.
 */
function blocMedia(condition: string): string {
  const marqueur = `@media ${condition} {`;
  let position = 0;
  let total = '';
  let trouve = false;
  while ((position = css.indexOf(marqueur, position)) !== -1) {
    trouve = true;
    const ouverture = css.indexOf('{', position) + 1;
    let i = ouverture;
    let profondeur = 1;
    while (i < css.length && profondeur > 0) {
      if (css[i] === '{') profondeur += 1;
      else if (css[i] === '}') profondeur -= 1;
      i += 1;
    }
    total += css.slice(ouverture, i - 1) + '\n';
    position = i;
  }
  assert.ok(trouve, `bloc @media ${condition} introuvable`);
  return total;
}

/** Toutes les règles portant ce sélecteur, dans l'ordre du fichier. */
function regles(selecteur: string): string {
  const echappe = selecteur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...css.matchAll(new RegExp(`${echappe}\\s*{[^}]*}`, 'g'))].map((m) => m[0]).join('\n');
}

function contient(bloc: string, extrait: string, quoi: string) {
  assert.ok(
    bloc.replace(/\s+/g, ' ').includes(extrait.replace(/\s+/g, ' ')),
    `${quoi} — attendu : ${extrait}`,
  );
}

describe('Fenêtre et garde-fous généraux', () => {
  test('la fenêtre est déclarée sans bloquer le zoom', () => {
    assert.match(html, /name="viewport"/);
    assert.match(html, /width=device-width/);
    assert.match(html, /initial-scale=1/);
    assert.doesNotMatch(html, /user-scalable\s*=\s*no/);
    assert.doesNotMatch(html, /maximum-scale\s*=\s*1(?![\d.])/);
  });

  test('aucune largeur en 100vw (elle ignore la barre de défilement)', () => {
    assert.equal((css.match(/100vw/g) ?? []).length, 0);
  });

  test('la page ne défile jamais horizontalement', () => {
    assert.match(css, /html\s*{[^}]*overflow-x:\s*clip/);
    assert.match(css, /body\s*{[^}]*overflow-x:\s*clip/);
  });

  test('les images et médias ne dépassent pas leur conteneur', () => {
    assert.match(css, /img\s*{[^}]*max-width:\s*100%/);
    assert.match(css, /video,[\s\S]{0,80}max-width:\s*100%/);
  });

  test('les champs restent à 16 px minimum au doigt (pas de zoom iOS)', () => {
    const bloc = blocMedia('(pointer: coarse)');
    contient(bloc, 'font-size: max(16px, 1em)', 'taille de police des champs tactiles');
    contient(bloc, 'min-height: 44px', 'cible tactile des boutons');
  });
});

describe('Hauteurs de page sur mobile', () => {
  test('les pages pleines utilisent dvh avec un repli vh', () => {
    const chat = /\.chat-page\s*{[^}]*}/.exec(css)?.[0] ?? '';
    const module = /\.module-page\s*{[^}]*}/.exec(css)?.[0] ?? '';
    for (const [nom, bloc] of [['.chat-page', chat], ['.module-page', module]] as const) {
      assert.match(bloc, /100vh/, `${nom} garde un repli vh`);
      assert.match(bloc, /100dvh/, `${nom} doit suivre la barre d'URL (dvh)`);
    }
  });

  test('le dialogue tient dans la zone visible réelle', () => {
    const dlg = /\.dlg\s*{[^}]*}/.exec(css)?.[0] ?? '';
    assert.match(dlg, /max-height:\s*86vh/);
    assert.match(dlg, /max-height:\s*86dvh/);
  });

  test('l’espace de discussion mobile occupe la hauteur réelle', () => {
    const bloc = blocMedia('(max-width: 720px)');
    contient(bloc, 'height: 100dvh', 'coque du chat sur téléphone');
  });

  test('les barres basses réservent la zone sûre des iPhone', () => {
    assert.ok(
      (css.match(/env\(safe-area-inset-bottom/g) ?? []).length >= 3,
      'au moins trois réservations de zone sûre (barre d’onglets, composeur)',
    );
  });
});

describe('Grilles : aucune piste plus large que l’écran', () => {
  test('les grilles auto-fill / auto-fit bornent leur piste à 100 %', () => {
    const fautives = [...css.matchAll(/repeat\(\s*auto-(?:fill|fit)\s*,\s*minmax\(\s*(\d+)px/g)];
    assert.deepEqual(
      fautives.map((m) => m[0]),
      [],
      'utiliser minmax(min(100%, Npx), 1fr)',
    );
  });

  test('l’atelier et son historique se replient', () => {
    const bloc = blocMedia('(max-width: 1020px)');
    contient(bloc, '.studio-espace { grid-template-columns: 1fr; }', 'atelier sur tablette');
  });

  test('la discussion passe en une colonne sur téléphone', () => {
    const bloc = blocMedia('(max-width: 720px)');
    contient(bloc, '.chat-page { grid-template-columns: 1fr; }', 'discussion sur téléphone');
    contient(bloc, '.missions-kanban { grid-template-columns: 1fr; }', 'kanban sur téléphone');
  });

  test('le tableau de bord et la mémoire s’empilent', () => {
    contient(blocMedia('(max-width: 720px)'), '.espace-grille {', 'tableau de bord');
    const memoire = /\.memoire-liste\s*{[^}]*}/.exec(css)?.[0] ?? '';
    assert.match(memoire, /minmax\(min\(100%, 290px\), 1fr\)/);
  });

  test('les articles de documentation perdent leur sommaire latéral', () => {
    const bloc = blocMedia('(max-width: 900px)');
    contient(bloc, '.doc-mise-en-page { grid-template-columns: minmax(0, 1fr); }', 'sommaire des docs');
  });

  test('l’espace de travail bascule en tiroir sous 900 px', () => {
    const bloc = blocMedia('(max-width: 899px)');
    contient(bloc, '.ws {', 'coque');
    contient(bloc, '.ws-bottom {', 'barre d’onglets');
    contient(bloc, '.ws-sidebar {', 'tiroir');
  });
});

describe('Points de rupture couverts', () => {
  const points = [360, 420, 560, 640, 720, 899, 900, 980, 1020, 1099, 1440];
  for (const px of points) {
    test(`${px} px`, () => {
      const present =
        css.includes(`(max-width: ${px}px)`) ||
        css.includes(`(min-width: ${px}px)`) ||
        css.includes(`max-width: ${px}px`) ||
        css.includes(`max-height: ${px}px`);
      assert.ok(present, `aucune règle à ${px} px`);
    });
  }

  test('320 px (iPhone SE) hérite du bloc ≤ 360 px', () => {
    const bloc = blocMedia('(max-width: 360px)');
    contient(bloc, 'body { font-size: 16px; }', 'base typographique à 320 px');
  });

  test('téléphone couché : la hauteur est rendue au contenu', () => {
    const bloc = blocMedia('(orientation: landscape) and (max-height: 520px)');
    contient(bloc, '.hero {', 'bannière en paysage');
    contient(bloc, 'min-height: auto', 'bannière en paysage');
  });
});

describe('Barres d’actions et contenus longs', () => {
  test('les pieds de dialogue et barres d’actions reviennent à la ligne', () => {
    for (const selecteur of ['.dlg-pied', '.page-module-actions', '.studio-apercu-haut']) {
      assert.match(regles(selecteur), /flex-wrap:\s*wrap/, `${selecteur} doit passer à la ligne`);
    }
  });

  test('le sélecteur d’export des huit formats ne déborde pas', () => {
    assert.match(regles('.btn-export select'), /max-width:/);
    const petit = blocMedia('(max-width: 420px)');
    contient(petit, '.btn-export { width: 100%; justify-content: space-between; }', 'export sur petit écran');
  });

  test('les adresses e-mail et URLs peuvent se couper', () => {
    assert.match(css, /\.page-confirmation-email,[\s\S]{0,200}overflow-wrap:\s*anywhere/);
  });

  test('l’écran d’attente de confirmation est mis en page et empilé', () => {
    assert.match(css, /\.page-confirmation\s*{/);
    const petit = blocMedia('(max-width: 420px)');
    contient(petit, '.page-confirmation-actions {', 'écran de confirmation');
    contient(petit, 'flex-direction: column', 'écran de confirmation');
  });

  test('les tableaux défilent dans leur cadre', () => {
    assert.match(css, /\.doc-tableau-defile\s*{[^}]*overflow-x:\s*auto/);
    assert.match(css, /\.md-tableau-wrap\s*{[^}]*overflow-x:\s*auto/);
  });

  test('les tableaux de bord à très petits écrans resserrent la typographie', () => {
    const bloc = blocMedia('(max-width: 360px)');
    contient(bloc, '.display-xl {', 'titre principal à 320 px');
    contient(bloc, '.ws-fil {', 'titre de la barre haute à 320 px');
  });
});
