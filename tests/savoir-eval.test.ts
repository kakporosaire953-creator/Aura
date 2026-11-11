/**
 * Évaluation du référentiel — jeu de questions figé.
 *
 * Deux mesures, calculées sans aucune tolérance de complaisance :
 *  - **détection** : précision et rappel du déclenchement (un faux positif
 *    injecte des documents hors sujet dans une réponse créative) ;
 *  - **classement** : la bonne ressource arrive-t-elle en tête, sur un petit
 *    corpus local saisi dans le test ?
 *
 * Le corpus est explicitement un corpus **de test** (organisme « Test ») :
 * il ne sert jamais de connaissance réelle à l'application.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const dossier = mkdtempSync(path.join(tmpdir(), 'aura-savoir-eval-'));
process.env.AURA_DATA_DIR = dossier;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;

const { detecter } = await import('../server/savoir/detection');
const { ingerer, changerStatut } = await import('../server/savoir/indexer');
const { rechercher, viderCacheRecherche } = await import('../server/savoir/recherche');

after(() => rmSync(dossier, { recursive: true, force: true }));

/* ───────────────────────── Détection ───────────────────────── */

const POSITIFS = [
  'Comment obtenir un acte de naissance au Bénin ?',
  'Quelles sont les démarches pour créer une entreprise au Bénin ?',
  'Quel est le coût du RCCM ?',
  'Comment obtenir son IFU ?',
  'Quels sont les départements du Bénin ?',
  'Combien d’habitants compte Cotonou ?',
  'Quelles sont les conditions d’inscription à l’université ?',
  'Comment obtenir une bourse d’études ?',
  'Qu’est-ce que la fête du vodun ?',
  'Parle-moi du royaume d’Abomey',
  'Quel ministère gère le numérique ?',
  'Quel est le taux de chômage au Bénin ?',
  'Quand a eu lieu le dernier recensement ?',
  'Quelles sont les conditions pour un passeport ?',
  'Comment demander un casier judiciaire ?',
  'Quelles sont les démarches pour immatriculer sa SARL ?',
  'Où en est la fibre optique au Bénin ?',
  'Quels incubateurs existent à Cotonou ?',
  'Quelle est la population du Bénin ?',
  'Quelles sont les taxes pour une PME ?',
];

const NEGATIFS = [
  'Écris un poème sur la mer',
  'Corrige ce bug en JavaScript',
  'Traduis ce texte en anglais',
  'Résume ce paragraphe',
  'Bonjour, ça va ?',
  'Qui es-tu ?',
  'Où sont mes messages ?',
  'Combien font 3 + 4 ?',
  'Écris un e-mail à mon client',
  'Raconte-moi une histoire drôle',
  'Quel temps fait-il à Paris ?',
  'Donne-moi une idée de logo',
];

describe('Détection : jeu de 32 questions', () => {
  test('précision = 1, rappel ≥ 0,95', () => {
    const fauxPositifs = NEGATIFS.filter((q) => detecter(q).declenche);
    const fauxNegatifs = POSITIFS.filter((q) => !detecter(q).declenche);
    assert.deepEqual(fauxPositifs, [], 'aucun déclenchement sur une demande non documentaire');
    assert.ok(
      fauxNegatifs.length <= 1,
      `rappel insuffisant : ${fauxNegatifs.length} manqué(s) — ${fauxNegatifs.join(' | ')}`,
    );
  });
});

/* ───────────────────────── Classement ───────────────────────── */

const DOCS = [
  {
    domaine: 'entrepreneuriat' as const,
    titre: 'Immatriculation des entreprises',
    texte: `La création d’une entreprise au Bénin commence par l’immatriculation au registre du commerce et du crédit mobilier.
Le greffe compétent délivre le RCCM après dépôt du dossier et paiement des frais.
L’identifiant fiscal unique (IFU) est délivré par la direction générale des impôts.
Une SARL doit désigner un gérant et disposer d’un capital social.`,
    question: 'Comment créer une entreprise et obtenir le RCCM ?',
  },
  {
    domaine: 'culture' as const,
    titre: 'Patrimoine du Danxomè',
    texte: `Les palais royaux d’Abomey sont inscrits au patrimoine mondial.
Le royaume du Danxomè a marqué l’histoire de l’actuel Bénin.
La fête du vodun se tient chaque année et rassemble des pratiquants venus de la région.
Les tata somba et les temples d’Ouidah complètent ce patrimoine.`,
    question: 'Quelle est l’histoire du royaume d’Abomey ?',
  },
  {
    domaine: 'education' as const,
    titre: 'Inscriptions universitaires',
    texte: `L’inscription à l’université se fait en ligne après publication des résultats du baccalauréat.
Les bourses d’études sont attribuées sur critères sociaux et académiques.
Les établissements délivrent les diplômes selon le système licence-master-doctorat.
Les frais de scolarité varient selon le parcours choisi.`,
    question: 'Comment s’inscrire à l’université et demander une bourse ?',
  },
];

describe('Classement : la bonne ressource arrive en tête', () => {
  before(async () => {
    for (const doc of DOCS) {
      const r = await ingerer({
        texte: doc.texte,
        titre: doc.titre,
        domaine: doc.domaine,
        pays: 'BJ',
        organisme: 'Test',
        niveau: 'A',
        par: 'eval',
      });
      assert.equal(r.ok, true, r.erreur ?? '');
      await changerStatut(r.ressource!.id, 'actif', 'eval');
    }
    viderCacheRecherche();
  });

  test('trois questions, trois bonnes têtes de liste', async () => {
    for (const doc of DOCS) {
      const r = await rechercher({ question: doc.question, limite: 3 });
      assert.ok(r.passages.length > 0, `aucun passage pour « ${doc.question} »`);
      assert.equal(r.passages[0].titre, doc.titre, `mauvais classement pour « ${doc.question} »`);
    }
  });

  test('une question hors référentiel ne renvoie rien de pertinent', async () => {
    const r = await rechercher({ question: 'Quelle est la recette du thiéboudienne ?' });
    assert.ok(r.passages.length === 0 || r.passages[0].score < 0.35);
  });
});
