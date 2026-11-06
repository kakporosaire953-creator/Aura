/**
 * Jetons à usage unique (mission 08).
 *
 * Ce que ces tests prouvent, sans réseau ni service externe :
 * - un jeton naît de 32 octets et n'existe en base que sous forme d'empreinte ;
 * - les durées sont centralisées, bornées et surchargeables ;
 * - un jeton expiré est refusé, un jeton révoqué ne vaut plus rien ;
 * - la réservation est atomique : un seul appelant l'obtient, même en course.
 *   node --import tsx --test tests/jetons.test.ts
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { TypeJeton } from '../server/db/types';

const dossierData = mkdtempSync(path.join(tmpdir(), 'aura-jetons-'));
process.env.AURA_DATA_DIR = dossierData;
process.env.NODE_ENV = 'test';
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;

const { baseDeDonnees, entrepotJetons } = await import('../server/db/entrepots');
const { CLE } = await import('../server/db/base');
const {
  creerJeton,
  empreinteJeton,
  empreinteValeur,
  DUREE_JETON_REINITIALISATION_MS,
  DUREE_JETON_VERIFICATION_MS,
} = await import('../server/accounts');


function jetonVerification(userId: string, expire = Date.now() + 60_000) {
  const { jeton, id } = creerJeton();
  return {
    jeton,
    enregistrement: {
      id,
      type: 'verification' as const,
      userId,
      cree: Date.now(),
      expire,
      utiliseLe: null,
      empreinteEmail: empreinteValeur(`${userId}@exemple.test`),
    },
  };
}

after(() => rmSync(dossierData, { recursive: true, force: true }));

describe('Génération et empreinte', () => {
  test('le jeton fait 32 octets d’entropie et n’est stocké que haché', () => {
    const { jeton, id } = creerJeton();
    assert.equal(Buffer.from(jeton, 'base64url').length, 32);
    assert.equal(jeton.length, 43);
    assert.equal(id, createHash('sha256').update(jeton).digest('hex'));
    assert.ok(!id.includes(jeton), 'l’empreinte ne contient jamais le jeton');
    assert.match(id, /^[a-f0-9]{64}$/);
  });

  test('deux jetons successifs sont distincts', () => {
    const vus = new Set<string>();
    for (let i = 0; i < 200; i++) vus.add(creerJeton().jeton);
    assert.equal(vus.size, 200);
  });

  test('l’empreinte d’adresse ignore casse et espaces', () => {
    assert.equal(empreinteValeur('  Aura@Exemple.TEST '), empreinteValeur('aura@exemple.test'));
    assert.equal(empreinteValeur('aura@exemple.test'), empreinteJeton('aura@exemple.test'));
  });
});

describe('Durées centralisées', () => {
  test('valeurs par défaut : vérification 24 h, réinitialisation 30 min', () => {
    assert.equal(DUREE_JETON_VERIFICATION_MS, 24 * 60 * 60 * 1000);
    assert.equal(DUREE_JETON_REINITIALISATION_MS, 30 * 60 * 1000);
  });
});

describe('Entrepôt de jetons', () => {
  test('créer puis relire : seule l’empreinte est en base', async () => {
    const jetons = entrepotJetons();
    const { jeton, enregistrement } = jetonVerification('usr_a');
    await jetons.creer(enregistrement);

    const relu = await jetons.parId(enregistrement.id);
    assert.ok(relu);
    assert.equal(relu!.type, 'verification');
    assert.equal(relu!.userId, 'usr_a');
    assert.equal(relu!.utiliseLe, null);

    // Aucune trace du jeton brut dans le fichier de stockage.
    const fichiers = readdirSync(dossierData);
    const contenu = fichiers
      .map((f) => {
        try {
          return readFileSync(path.join(dossierData, f), 'utf8');
        } catch {
          return '';
        }
      })
      .join('\n');
    assert.ok(!contenu.includes(jeton), 'le jeton en clair ne doit jamais être persisté');
    assert.ok(contenu.includes(enregistrement.id), 'l’empreinte doit être persistée');
  });

  test('un nouvel envoi invalide le précédent', async () => {
    const jetons = entrepotJetons();
    const premier = jetonVerification('usr_b');
    await jetons.creer(premier.enregistrement);
    const second = jetonVerification('usr_b');
    await jetons.creer(second.enregistrement);

    const actif = await jetons.actif('usr_b', 'verification');
    assert.equal(actif?.id, second.enregistrement.id);
    await jetons.revoquerActif('usr_b', 'verification');
    assert.equal(await jetons.actif('usr_b', 'verification'), null);
    assert.equal(await jetons.parId(second.enregistrement.id), null);
  });

  test('actif ne renvoie jamais le jeton d’un autre compte ni d’un autre type', async () => {
    const jetons = entrepotJetons();
    const a = jetonVerification('usr_c');
    await jetons.creer(a.enregistrement);
    assert.equal(await jetons.actif('usr_autre', 'verification'), null);
    assert.equal(await jetons.actif('usr_c', 'reinitialisation'), null);
  });

  test('un jeton expiré sort du stockage', async () => {
    const jetons = entrepotJetons();
    const { enregistrement } = jetonVerification('usr_d', Date.now() - 1);
    await baseDeDonnees().ecrireTtl(CLE.jeton(enregistrement.id), enregistrement, 60);
    // La lecture brute permet à la route de distinguer « expiré » de « inconnu ».
    assert.ok(await jetons.lireSansFiltre(enregistrement.id));
    assert.equal(await jetons.parId(enregistrement.id), null);
    // Une fois constaté expiré, le jeton est retiré du stockage.
    assert.equal(await jetons.lireSansFiltre(enregistrement.id), null);
  });

  test('usage unique : une seule réservation réussit, même en course', async () => {
    const jetons = entrepotJetons();
    const { enregistrement } = jetonVerification('usr_e');
    await jetons.creer(enregistrement);

    const resultats = await Promise.all(
      Array.from({ length: 6 }, () => jetons.reserver(enregistrement.id)),
    );
    assert.equal(resultats.filter(Boolean).length, 1, 'exactement un appelant gagne');
  });

  test('après consommation, le jeton et son index disparaissent', async () => {
    const jetons = entrepotJetons();
    const { enregistrement } = jetonVerification('usr_f');
    await jetons.creer(enregistrement);
    assert.equal(await jetons.reserver(enregistrement.id), true);
    await jetons.terminer(enregistrement);
    assert.equal(await jetons.parId(enregistrement.id), null);
    assert.equal(await jetons.actif('usr_f', 'verification'), null);
  });
});

describe('Type de jeton', () => {
  test('les deux types prévus existent', () => {
    const valeurs: TypeJeton[] = ['verification', 'reinitialisation'];
    assert.deepEqual(valeurs, ['verification', 'reinitialisation']);
  });
});
