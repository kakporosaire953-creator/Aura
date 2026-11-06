/**
 * Messages d'erreur d'authentification (mission 10).
 *
 * Objectif : ne plus confondre « le réseau n'a pas répondu » et « le serveur
 * a répondu par une erreur ». Les deux affichaient le même texte, ce qui
 * envoyait chercher la panne au mauvais endroit.
 *   node --import tsx --test tests/messages-auth.test.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const { messageErreur } = await import('../src/app/messages-auth');
const { CONTENT } = await import('../src/app/dictionaries');

const t = CONTENT.fr.auth;
const en = CONTENT.en.auth;

describe('Codes d’erreur connus', () => {
  test('chaque code de l’API a son message dédié', () => {
    assert.equal(messageErreur('identifiants', '', t), t.errIdentifiants);
    assert.equal(messageErreur('existe', '', t), t.errExiste);
    assert.equal(messageErreur('validation', '', t), t.errSaisie);
    assert.equal(messageErreur('stockage-indisponible', '', t), t.errStockage);
    assert.equal(messageErreur('limite', '', t), t.errLimite);
  });

  test('« stockage-indisponible » ne dit jamais « réessayez plus tard »', () => {
    const message = messageErreur('stockage-indisponible', '', t, 503);
    assert.equal(message, t.errStockage);
    assert.ok(!message.includes('HTTP'), 'un 503 de stockage n’est pas un incident HTTP inconnu');
  });
});

describe('Ce que le message distingue désormais', () => {
  test('réseau coupé : aucune mention de code HTTP', () => {
    const message = messageErreur('reseau', '', t, 0);
    assert.equal(message, t.errServeur);
    assert.ok(!message.includes('HTTP'));
  });

  test('serveur en erreur : le code HTTP est affiché', () => {
    const message = messageErreur('serveur', '', t, 500);
    assert.equal(message, `${t.errServeur} (HTTP 500)`);
    assert.ok(message.includes('500'));
  });

  test('serveur en erreur sans code connu : pas de parenthèse vide', () => {
    assert.equal(messageErreur('serveur', '', t), t.errServeur);
    assert.equal(messageErreur('serveur', '', t, 0), t.errServeur);
  });

  test('un code inconnu avec message serveur garde le message et le statut', () => {
    assert.equal(
      messageErreur('autre-chose', 'Erreur interne du service.', t, 502),
      'Erreur interne du service. (HTTP 502)',
    );
  });

  test('un code inconnu sans message retombe sur le texte générique', () => {
    assert.equal(messageErreur(undefined, '', t), t.errServeur);
    assert.equal(messageErreur(undefined, '', t, 504), `${t.errServeur} (HTTP 504)`);
  });
});

describe('Bilingue', () => {
  test('les deux langues produisent un message, jamais une clé brute', () => {
    for (const langue of [t, en]) {
      for (const code of ['identifiants', 'existe', 'validation', 'stockage-indisponible', 'limite', 'reseau', 'serveur']) {
        const message = messageErreur(code, '', langue, 500);
        assert.equal(typeof message, 'string');
        assert.ok(message.length > 3, `${code} doit produire un texte`);
      }
    }
  });
});
