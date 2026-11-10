/**
 * Tests du système IA multi-fournisseurs.
 *
 * Les fournisseurs sont simulés UNIQUEMENT au niveau des tests (stubs HTTP
 * locaux + mock) — l'application ne contient aucune simulation de réponse.
 *
 * Couverture : contrat commun, détection des clés absentes, routage
 * déterministe, règles de fallback (dont « jamais de bascule silencieuse
 * après un premier fragment streamé »), erreurs normalisées, non-exposition
 * des secrets et des noms internes, suivi d'usage.
 */
import assert from 'node:assert/strict';
import http from 'node:http';
import { after, describe, test } from 'node:test';

import { FournisseurGemini } from '../server/ai/providers/gemini';
import { FournisseurGroq } from '../server/ai/providers/groq';
import { FournisseurOpenRouter } from '../server/ai/providers/openrouter';
import { FournisseurMock } from '../server/ai/providers/mock';
import { executerAvecRepli } from '../server/ai/fallback';
import * as serviceIa from '../server/ai/service';
import { reinitialiserRegistre, candidatsPour, desactiverFournisseur } from '../server/ai/registre';
import { POLITIQUE_ROUTAGE, capacitesPour, ordonnerCandidats } from '../server/ai/router';
import { ErreurAi, estRecuperable, natureDe } from '../server/ai/errors';
import { erreurDepuisStatut } from '../server/ai/transport';
import type { CapacitesAi, FournisseurAi, RequeteAi } from '../server/ai/types';

const ENV_IA = [
  'AI_DEFAULT_PROVIDER',
  'AI_FALLBACK_ORDER',
  'AI_MAX_RETRIES',
  'AI_REQUEST_TIMEOUT_MS',
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'GEMINI_API_BASE',
  'GROQ_API_BASE',
  'OPENROUTER_API_BASE',
  'AURA_AI_PROVIDER',
  'AURA_GEMINI_API_KEY',
  'AURA_MODELE_URL',
];

function purgerEnv(): void {
  for (const k of ENV_IA) delete process.env[k];
  reinitialiserRegistre();
}

/* ── Stubs HTTP (fournisseurs simulés côté tests uniquement) ── */

type Stub = {
  url: string;
  hits: () => number;
  fermer: () => Promise<void>;
};

function stub(
  handler: (req: http.IncomingMessage, res: http.ServerResponse, corps: Record<string, unknown>) => void,
): Promise<Stub> {
  let hits = 0;
  const serveur = http.createServer((req, res) => {
    hits++;
    let brut = '';
    req.on('data', (c) => (brut += c));
    req.on('end', () => {
      let corps: Record<string, unknown> = {};
      try {
        corps = JSON.parse(brut) as Record<string, unknown>;
      } catch {
        /* corps non JSON */
      }
      handler(req, res, corps);
    });
  });
  return new Promise((resolve) => {
    serveur.listen(0, '127.0.0.1', () => {
      const port = (serveur.address() as { port: number }).port;
      resolve({
        url: `http://127.0.0.1:${port}`,
        hits: () => hits,
        fermer: () =>
          new Promise<void>((r) => {
            serveur.closeAllConnections?.();
            serveur.close(() => r());
          }),
      });
    });
  });
}

/** Réponse OpenAI-compatible (Groq / OpenRouter). */
function reponseOpenAi(texte: string): string {
  return JSON.stringify({
    choices: [{ message: { content: texte }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 3, completion_tokens: 2 },
  });
}

function sseOpenAi(res: http.ServerResponse, morceaux: string[]): void {
  res.writeHead(200, { 'Content-Type': 'text/event-stream' });
  for (const m of morceaux) {
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: m } }] })}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();
}

/** Réponse Gemini-compatible. */
function reponseGemini(texte: string): string {
  return JSON.stringify({
    candidates: [{ content: { parts: [{ text: texte }] } }],
  });
}

function sseGemini(res: http.ServerResponse, morceaux: string[]): void {
  res.writeHead(200, { 'Content-Type': 'text/event-stream' });
  for (const m of morceaux) {
    res.write(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: m } ] } }] })}\n\n`);
  }
  res.end();
}

const requeteTest: RequeteAi = {
  messages: [{ role: 'user', content: 'Bonjour' }],
  system: 'Tu es un test.',
};

const stubs: Stub[] = [];
after(async () => {
  for (const s of stubs) await s.fermer();
  purgerEnv();
});

/* ── 1. Contrat commun ── */

describe('Interface commune des fournisseurs', () => {
  const fournisseurs: Array<[string, () => FournisseurAi]> = [
    ['gemini', () => new FournisseurGemini()],
    ['groq', () => new FournisseurGroq()],
    ['openrouter', () => new FournisseurOpenRouter()],
    ['mock', () => new FournisseurMock()],
  ];
  for (const [nom, fabrique] of fournisseurs) {
    test(`${nom} implémente FournisseurAi et déclare toutes les capacités`, () => {
      const f = fabrique();
      assert.equal(typeof f.getCapabilities, 'function');
      assert.equal(typeof f.checkAvailability, 'function');
      assert.equal(typeof f.generateResponse, 'function');
      assert.equal(typeof f.streamResponse, 'function');
      assert.equal(typeof f.generateStructuredOutput, 'function');
      const caps = f.getCapabilities();
      for (const cle of [
        'texte',
        'streaming',
        'imagesEntree',
        'generationImages',
        'sortieStructuree',
        'outils',
        'audio',
        'embeddings',
        'code',
        'sources',
      ] satisfies (keyof CapacitesAi)[]) {
        assert.equal(typeof caps[cle], 'boolean', `capacité ${cle} déclarée`);
      }
    });
  }
});

/* ── 2. Clés absentes ── */

describe('Détection des clés manquantes', () => {
  test('sans clé : checkAvailability refuse et le service refuse proprement', async () => {
    purgerEnv();
    for (const f of [new FournisseurGemini(), new FournisseurGroq(), new FournisseurOpenRouter()]) {
      const d = await f.checkAvailability();
      assert.equal(d.ok, false, `${f.id} sans clé`);
      assert.ok(d.raison && d.raison.length > 0);
    }
    await assert.rejects(
      () => serviceIa.generer('conversation', requeteTest),
      (e: unknown) => e instanceof ErreurAi && e.statut === 503 && e.code === 'aucun-fournisseur',
    );
    const etat = await serviceIa.etatIa();
    assert.equal(etat.ok, false);
    assert.ok(etat.raison);
  });

  test('le message public ne révèle aucun nom de fournisseur', async () => {
    purgerEnv();
    const etat = await serviceIa.etatIa();
    const texte = JSON.stringify(etat).toLowerCase();
    for (const interdit of ['gemini', 'groq', 'openrouter', 'mock', 'llama', 'gpt-']) {
      assert.ok(!texte.includes(interdit), `état public doit éviter « ${interdit} »`);
    }
  });

  test('alias historique AURA_AI_PROVIDER=mock toujours accepté', async () => {
    purgerEnv();
    process.env.AURA_AI_PROVIDER = 'mock';
    reinitialiserRegistre();
    const r = await serviceIa.generer('conversation', requeteTest);
    assert.equal(r.fournisseur, 'mock');
    purgerEnv();
  });
});

/* ── 3. Routeur déterministe ── */

describe('Routeur — politique déterministe', () => {
  test('politique : chaque tâche déclare ses capacités requises', () => {
    assert.deepEqual(POLITIQUE_ROUTAGE.image.capacitesRequises, ['imagesEntree']);
    assert.deepEqual(POLITIQUE_ROUTAGE.recherche.capacitesRequises, ['sources']);
    assert.deepEqual(POLITIQUE_ROUTAGE.code.capacitesRequises, ['texte', 'code']);
    assert.deepEqual(capacitesPour('conversation', { streaming: true }), ['texte', 'streaming']);
  });

  test('capacités indisponibles → aucun candidat, refus explicite', async () => {
    purgerEnv();
    // Seul Groq configuré (pas d'entrée image, pas de sources).
    process.env.GROQ_API_KEY = 'gsk-test';
    reinitialiserRegistre();
    assert.equal((await candidatsPour(['imagesEntree'])).length, 0);
    assert.equal((await candidatsPour(['sources'])).length, 0);
    assert.equal((await candidatsPour(['texte'])).length, 1);
    await assert.rejects(
      () => serviceIa.generer('image', requeteTest),
      (e: unknown) => e instanceof ErreurAi && e.code === 'aucun-fournisseur',
    );
    purgerEnv();
  });

  test('ordre = configuration (AI_FALLBACK_ORDER, fournisseur par défaut épinglé)', async () => {
    purgerEnv();
    process.env.GROQ_API_KEY = 'gsk-test';
    process.env.OPENROUTER_API_KEY = 'sk-or-test';
    process.env.AI_FALLBACK_ORDER = 'groq,openrouter';
    process.env.AI_DEFAULT_PROVIDER = 'openrouter';
    reinitialiserRegistre();
    const ids = (await candidatsPour(['texte'])).map((f) => f.id);
    assert.deepEqual(ids, ['openrouter', 'groq'], 'le défaut est épinglé en tête');
    purgerEnv();
  });

  test('ordonnerCandidats filtre par capacité sans changer l\'ordre', () => {
    const gem = new FournisseurGemini();
    const groq = new FournisseurGroq();
    assert.deepEqual(ordonnerCandidats([groq, gem], ['imagesEntree']).map((f) => f.id), ['gemini']);
    assert.deepEqual(ordonnerCandidats([groq, gem], ['texte']).map((f) => f.id), ['groq', 'gemini']);
  });
});

/* ── 4. Règles de fallback ── */

describe('Fallback — jamais aveugle', () => {
  const requis: (keyof CapacitesAi)[] = ['texte'];

  test('erreur de quota → bascule sur le fournisseur suivant', async () => {
    const a = new FournisseurMock({ id: 'a', echec: 'quota' });
    const b = new FournisseurMock({ id: 'b' });
    const rep = await executerAvecRepli(
      [a, b],
      (f) => f.generateResponse(requeteTest),
      { maxTentatives: 3 },
    );
    assert.equal(rep.fournisseur, 'b');
    assert.equal(b.nombreAppels, 1);
  });

  test('erreur réseau et timeout → bascule ; validation → aucun repli', async () => {
    for (const echec of ['reseau', 'timeout', 'sortie'] as const) {
      const a = new FournisseurMock({ id: 'a', echec });
      const b = new FournisseurMock({ id: 'b' });
      const rep = await executerAvecRepli([a, b], (f) => f.generateResponse(requeteTest), {
        maxTentatives: 3,
      });
      assert.equal(rep.fournisseur, 'b', `${echec} récupérable → bascule`);
    }
    // Requête invalide / contenu refusé : la chaîne s'arrête.
    for (const echec of ['contenu', 'vide'] as const) {
      const a = new FournisseurMock({ id: 'a', echec });
      const b = new FournisseurMock({ id: 'b' });
      await assert.rejects(() =>
        executerAvecRepli([a, b], (f) => f.generateResponse(requeteTest), { maxTentatives: 3 }),
      );
      assert.equal(b.nombreAppels, 0, `aucune bascule après ${echec}`);
    }
  });

  test('erreur d\'auth → désactivation du fautif, bascule sur le suivant', async () => {
    const desactives: string[] = [];
    const a = new FournisseurMock({ id: 'a', echec: 'auth' });
    const b = new FournisseurMock({ id: 'b' });
    const rep = await executerAvecRepli([a, b], (f) => f.generateResponse(requeteTest), {
      maxTentatives: 3,
      onDesactiver: (f) => desactives.push(f.id),
    });
    assert.equal(rep.fournisseur, 'b');
    assert.deepEqual(desactives, ['a'], 'le fautif est marqué — jamais réessayé');
  });

  test('streaming : après un premier fragment émis, pas de bascule silencieuse', async () => {
    const b = new FournisseurMock({ id: 'b' });
    // Fournisseur qui émet un fragment puis casse (coupure réseau simulée).
    const emetteur = {
      id: 'emetteur',
      modele: 'm',
      getCapabilities: () => ({ texte: true, streaming: true } as CapacitesAi),
      checkAvailability: async () => ({ ok: true }),
      generateResponse: async () => ({ texte: '', modele: 'm', fournisseur: 'emetteur' }),
      streamResponse: async (
        _r: RequeteAi,
        onChunk: (t: string) => void,
      ) => {
        onChunk('début ');
        throw new ErreurAi('coupure', 'reseau', 502, 'reseau');
      },
      generateStructuredOutput: async () => ({}),
    } as unknown as FournisseurAi;
    let recu = '';
    await assert.rejects(() =>
      executerAvecRepli(
        [emetteur, b],
        (f) =>
          f.streamResponse(requeteTest, (t) => {
            recu += t;
          }),
        { maxTentatives: 3, peutBasculer: () => recu === '' },
      ),
    );
    assert.equal(recu, 'début ', 'le fragment émis est conservé côté client');
    assert.equal(b.nombreAppels, 0, 'jamais de second fournisseur après émission');
  });

  test('streaming : bascule permise tant qu\'aucun fragment n\'est émis', async () => {
    const a = new FournisseurMock({ id: 'a', echec: 'reseau' });
    const b = new FournisseurMock({ id: 'b' });
    let emis = false;
    const rep = await executerAvecRepli(
      [a, b],
      (f) =>
        f.streamResponse(requeteTest, () => {
          emis = true;
        }),
      { maxTentatives: 3, peutBasculer: () => !emis },
    );
    assert.equal(rep.fournisseur, 'b');
    assert.equal(emis, true);
  });

  test('aucun candidat → erreur structurée 503', async () => {
    await assert.rejects(
      () => executerAvecRepli([], (f) => f.generateResponse(requeteTest), { maxTentatives: 3 }),
      (e: unknown) => e instanceof ErreurAi && e.statut === 503,
    );
  });

  test('classification des erreurs : récupérable ou non', () => {
    assert.equal(estRecuperable(new ErreurAi('x', 'limite-modele', 429, 'quota')), true);
    assert.equal(estRecuperable(new ErreurAi('x', 'timeout', 504, 'timeout')), true);
    assert.equal(estRecuperable(new ErreurAi('x', 'auth-fournisseur', 502, 'auth')), true);
    assert.equal(estRecuperable(new ErreurAi('x', 'bloque', 422, 'contenu')), false);
    assert.equal(estRecuperable(new ErreurAi('x', 'requete-invalide', 400, 'validation')), false);
    assert.equal(natureDe(new Error('réseau')), 'reseau');
    const abort = new Error('abort');
    abort.name = 'AbortError';
    assert.equal(natureDe(abort), 'timeout');
  });
});

/* ── 5. Adaptateurs contre stubs HTTP (contrats d'API réels) ── */

describe('Adaptateurs — appels normalisés', () => {
  test('Groq : génération, streaming, sortie structurée (format OpenAI-compatible)', async () => {
    const s = await stub((_req, res, corps) => {
      if (corps.stream === true) {
        sseOpenAi(res, ['Bon', 'jour !']);
        return;
      }
      if (corps.response_format) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(reponseOpenAi('{"missions":[]}'));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(reponseOpenAi('Bonjour depuis le stub Groq'));
    });
    stubs.push(s);
    purgerEnv();
    process.env.GROQ_API_KEY = 'gsk-cle-secrete-test';
    process.env.GROQ_API_BASE = s.url;
    reinitialiserRegistre();
    const f = new FournisseurGroq();

    const rep = await f.generateResponse(requeteTest);
    assert.equal(rep.texte, 'Bonjour depuis le stub Groq');
    assert.equal(rep.fournisseur, 'groq');

    let flux = '';
    const rep2 = await f.streamResponse(requeteTest, (t) => (flux += t));
    assert.equal(flux, 'Bonjour !');
    assert.equal(rep2.texte, 'Bonjour !');

    const out = await f.generateStructuredOutput<{ missions: unknown[] }>({
      ...requeteTest,
      schema: { type: 'object', properties: { missions: { type: 'array' } } },
    });
    assert.deepEqual(out, { missions: [] });
    purgerEnv();
  });

  test('Gemini : génération, streaming SSE, grounding (sources réelles)', async () => {
    const s = await stub((req, res, corps) => {
      if (typeof req.url === 'string' && req.url.includes('streamGenerateContent')) {
        sseGemini(res, ['Bon', 'jour']);
        return;
      }
      if (Array.isArray((corps as { tools?: unknown[] }).tools)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            candidates: [
              {
                content: { parts: [{ text: 'Synthèse sourcée' }] },
                groundingMetadata: {
                  groundingChunks: [
                    { web: { uri: 'https://example.org/article', title: 'Article' } },
                    { web: { uri: 'https://example.org/article', title: 'Doublon' } },
                  ],
                },
              },
            ],
          }),
        );
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(reponseGemini('Bonjour depuis le stub Gemini'));
    });
    stubs.push(s);
    purgerEnv();
    process.env.GEMINI_API_KEY = 'cle-secrete-gemini-test';
    process.env.GEMINI_API_BASE = s.url;
    reinitialiserRegistre();
    const f = new FournisseurGemini();

    const rep = await f.generateResponse(requeteTest);
    assert.equal(rep.texte, 'Bonjour depuis le stub Gemini');

    let flux = '';
    await f.streamResponse(requeteTest, (t) => (flux += t));
    assert.equal(flux, 'Bonjour');

    const r = await f.rechercherAvecSources('question ?', 'system');
    assert.equal(r.texte, 'Synthèse sourcée');
    assert.equal(r.sources.length, 1, 'doublon d\'URL éliminé');
    assert.equal(r.sources[0].url, 'https://example.org/article');
    purgerEnv();
  });

  test('statuts d\'erreur normalisés (401→auth, 429→quota, 400→validation)', async () => {
    const s = await stub((_req, res) => {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end('{}');
    });
    stubs.push(s);
    purgerEnv();
    process.env.OPENROUTER_API_KEY = 'sk-or-cle-secrete-test';
    process.env.OPENROUTER_API_BASE = s.url;
    reinitialiserRegistre();
    const f = new FournisseurOpenRouter();
    await assert.rejects(
      () => f.generateResponse(requeteTest),
      (e: unknown) => e instanceof ErreurAi && e.nature === 'quota' && e.statut === 429,
    );
    purgerEnv();
  });

  test('la clé API n\'apparaît jamais dans les messages d\'erreur', async () => {
    const s = await stub((_req, res) => {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end('{"error": "bad key"}');
    });
    stubs.push(s);
    purgerEnv();
    process.env.GROQ_API_KEY = 'gsk-super-secrete-98765';
    process.env.GROQ_API_BASE = s.url;
    reinitialiserRegistre();
    const f = new FournisseurGroq();
    try {
      await f.generateResponse(requeteTest);
      assert.fail('aurait dû échouer');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      assert.ok(!message.includes('gsk-super-secrete-98765'), 'jamais de clé dans l\'erreur');
      assert.ok(e instanceof ErreurAi && e.nature === 'auth');
    }
    purgerEnv();
  });

  test('timeout : le fournisseur lent est déclaré indisponible (erreur structurée)', async () => {
    const s = await stub(() => {
      /* ne répond jamais */
    });
    stubs.push(s);
    purgerEnv();
    process.env.GROQ_API_KEY = 'gsk-test';
    process.env.GROQ_API_BASE = s.url;
    process.env.AI_REQUEST_TIMEOUT_MS = '150';
    reinitialiserRegistre();
    const f = new FournisseurGroq();
    await assert.rejects(
      () => f.generateResponse(requeteTest),
      (e: unknown) => e instanceof ErreurAi && e.nature === 'timeout',
    );
    purgerEnv();
  });

  test('erreur réseau → bascule de bout en bout via le service', async () => {
    const sCassee = await stub((_req, res) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end('{}');
    });
    const sBonne = await stub((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(reponseOpenAi('Réponse de secours'));
    });
    stubs.push(sCassee, sBonne);
    purgerEnv();
    process.env.GEMINI_API_KEY = 'cle-a';
    process.env.GEMINI_API_BASE = sCassee.url;
    process.env.GROQ_API_KEY = 'cle-b';
    process.env.GROQ_API_BASE = sBonne.url;
    process.env.AI_FALLBACK_ORDER = 'gemini,groq,openrouter';
    reinitialiserRegistre();

    const traces: Array<{ fournisseur: string; mode: string }> = [];
    const rep = await serviceIa.generer('conversation', requeteTest, {
      noter: (t) => traces.push({ fournisseur: t.fournisseur, mode: t.mode }),
    });
    assert.equal(rep.fournisseur, 'groq', 'bascule sur le second fournisseur');
    assert.equal(rep.texte, 'Réponse de secours');
    assert.ok(
      traces.some((t) => t.mode === 'repli'),
      'la bascule est journalisée',
    );
    assert.ok(traces.some((t) => t.mode === 'generation' && t.fournisseur === 'groq'));
    purgerEnv();
  });

  test('auth refusée : le fautif est désactivé, la chaîne assure le service', async () => {
    let hitsMauvais = 0;
    const sMauvais = await stub((_req, res) => {
      hitsMauvais++;
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end('{}');
    });
    const sBon = await stub((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(reponseOpenAi('Service assuré'));
    });
    stubs.push(sMauvais, sBon);
    purgerEnv();
    process.env.GEMINI_API_KEY = 'cle-refusee';
    process.env.GEMINI_API_BASE = sMauvais.url;
    process.env.GROQ_API_KEY = 'cle-valide';
    process.env.GROQ_API_BASE = sBon.url;
    reinitialiserRegistre();

    assert.equal((await serviceIa.generer('conversation', requeteTest)).texte, 'Service assuré');
    const hitsApres1 = hitsMauvais;
    await serviceIa.generer('conversation', requeteTest);
    assert.equal(hitsMauvais, hitsApres1, 'le fournisseur désactivé n\'est plus sollicité');
    purgerEnv();
  });

  test('streaming interrompu : le texte partiel est conservé', async () => {
    const s = await stub((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: 'début ' } }] })}\n\n`);
      // puis coupure du flux (erreur réseau simulée), après que le premier
      // fragment a eu le temps d'être reçu.
      setTimeout(() => res.destroy(), 50);
    });
    stubs.push(s);
    purgerEnv();
    process.env.GROQ_API_KEY = 'cle';
    process.env.GROQ_API_BASE = s.url;
    reinitialiserRegistre();
    const f = new FournisseurGroq();
    let recu = '';
    try {
      await f.streamResponse(requeteTest, (t) => (recu += t));
    } catch {
      /* la coupure remonte une erreur — c'est le comportement attendu */
    }
    assert.equal(recu, 'début ', 'le fragment déjà émis est conservé');
    purgerEnv();
  });
});

/* ── 6. Scénarios routeur & fallback (mission 02) ── */

describe('Scénarios mission 02 — routeur', () => {
  test('un fournisseur non configuré n\'est jamais sélectionné (même en tête d\'ordre)', async () => {
    purgerEnv();
    process.env.AI_FALLBACK_ORDER = 'openrouter,groq,gemini';
    // Seule Groq possède une clé : OpenRouter en tête d\'ordre doit être ignoré.
    process.env.GROQ_API_KEY = 'gsk-test';
    reinitialiserRegistre();
    const ids = (await candidatsPour(['texte'])).map((f) => f.id);
    assert.deepEqual(ids, ['groq']);
    purgerEnv();
  });

  test('quota épuisé connu : le fournisseur est écarté des requêtes suivantes', async () => {
    const sQuota = await stub((_req, res) => {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end('{}');
    });
    const sBon = await stub((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(reponseOpenAi('Service assuré'));
    });
    stubs.push(sQuota, sBon);
    purgerEnv();
    process.env.GEMINI_API_KEY = 'cle-a';
    process.env.GEMINI_API_BASE = sQuota.url;
    process.env.GROQ_API_KEY = 'cle-b';
    process.env.GROQ_API_BASE = sBon.url;
    process.env.AI_FALLBACK_ORDER = 'gemini,groq,openrouter';
    reinitialiserRegistre();

    // 1er appel : quota sur gemini → bascule sur groq.
    assert.equal((await serviceIa.generer('conversation', requeteTest)).texte, 'Service assuré');
    const hitsGemini = sQuota.hits();
    // 2e appel : gemini est en état de quota connu → il n'est plus sollicité.
    await serviceIa.generer('conversation', requeteTest);
    assert.equal(sQuota.hits(), hitsGemini, 'quota connu : aucun nouvel appel');
    purgerEnv();
  });

  test('capacité « sources » : seul un fournisseur avec recherche sourcée est choisi', async () => {
    purgerEnv();
    process.env.GROQ_API_KEY = 'gsk-test';
    process.env.GEMINI_API_KEY = 'cle-test';
    reinitialiserRegistre();
    const ids = (await candidatsPour(['sources'])).map((f) => f.id);
    assert.deepEqual(ids, ['gemini'], 'seul Gemini déclare la capacité sources');
    purgerEnv();
  });
});

describe('Scénarios mission 02 — fallback', () => {
  const stubReponse = (texte: string) => async (_req: http.IncomingMessage, res: http.ServerResponse) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(reponseOpenAi(texte));
  };
  const stubErreur = (statut: number) => async (_req: http.IncomingMessage, res: http.ServerResponse) => {
    res.writeHead(statut, { 'Content-Type': 'application/json' });
    res.end('{}');
  };

  test('Groq indisponible → OpenRouter disponible sert la réponse', async () => {
    const sG = await stub(stubErreur(500));
    const sO = await stub(stubReponse('Réponse OpenRouter'));
    stubs.push(sG, sO);
    purgerEnv();
    process.env.GROQ_API_KEY = 'cle';
    process.env.GROQ_API_BASE = sG.url;
    process.env.OPENROUTER_API_KEY = 'cle';
    process.env.OPENROUTER_API_BASE = sO.url;
    process.env.AI_FALLBACK_ORDER = 'groq,openrouter';
    reinitialiserRegistre();
    const rep = await serviceIa.generer('conversation', requeteTest);
    assert.equal(rep.fournisseur, 'openrouter');
    assert.equal(rep.texte, 'Réponse OpenRouter');
    purgerEnv();
  });

  test('OpenRouter indisponible → Gemini disponible sert la réponse', async () => {
    const sO = await stub(stubErreur(500));
    const sGem = await stub(async (_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(reponseGemini('Réponse Gemini'));
    });
    stubs.push(sO, sGem);
    purgerEnv();
    process.env.OPENROUTER_API_KEY = 'cle';
    process.env.OPENROUTER_API_BASE = sO.url;
    process.env.GEMINI_API_KEY = 'cle';
    process.env.GEMINI_API_BASE = sGem.url;
    process.env.AI_FALLBACK_ORDER = 'openrouter,gemini,groq';
    reinitialiserRegistre();
    const rep = await serviceIa.generer('conversation', requeteTest);
    assert.equal(rep.fournisseur, 'gemini');
    assert.equal(rep.texte, 'Réponse Gemini');
    purgerEnv();
  });

  test('deux fournisseurs indisponibles → le troisième sert ; aucun doublon facturé', async () => {
    const s1 = await stub(stubErreur(500));
    const s2 = await stub(stubErreur(500));
    const s3 = await stub(stubReponse('Dernier recours'));
    stubs.push(s1, s2, s3);
    purgerEnv();
    process.env.GEMINI_API_KEY = 'c';
    process.env.GEMINI_API_BASE = s1.url;
    process.env.GROQ_API_KEY = 'c';
    process.env.GROQ_API_BASE = s2.url;
    process.env.OPENROUTER_API_KEY = 'c';
    process.env.OPENROUTER_API_BASE = s3.url;
    process.env.AI_FALLBACK_ORDER = 'gemini,groq,openrouter';
    reinitialiserRegistre();
    const rep = await serviceIa.generer('conversation', requeteTest);
    assert.equal(rep.fournisseur, 'openrouter');
    assert.equal(s1.hits(), 1);
    assert.equal(s2.hits(), 1);
    assert.equal(s3.hits(), 1, 'exactement un appel par fournisseur — pas de boucle');
    purgerEnv();
  });

  test('tous les fournisseurs indisponibles → erreur structurée unique', async () => {
    const s1 = await stub(stubErreur(500));
    const s2 = await stub(stubErreur(500));
    stubs.push(s1, s2);
    purgerEnv();
    process.env.GEMINI_API_KEY = 'c';
    process.env.GEMINI_API_BASE = s1.url;
    process.env.GROQ_API_KEY = 'c';
    process.env.GROQ_API_BASE = s2.url;
    process.env.AI_FALLBACK_ORDER = 'gemini,groq';
    reinitialiserRegistre();
    await assert.rejects(
      () => serviceIa.generer('conversation', requeteTest),
      (e: unknown) => e instanceof ErreurAi && e.statut === 502,
    );
    assert.equal(s1.hits() + s2.hits(), 2, 'pas de tentatives multiples par fournisseur');
    purgerEnv();
  });

  test('succès immédiat : aucun appel facturable supplémentaire (0 bascule)', async () => {
    const s1 = await stub(stubReponse('Réponse immédiate'));
    const s2 = await stub(stubReponse('Jamais appelée'));
    stubs.push(s1, s2);
    purgerEnv();
    process.env.GROQ_API_KEY = 'c';
    process.env.GROQ_API_BASE = s1.url;
    process.env.OPENROUTER_API_KEY = 'c';
    process.env.OPENROUTER_API_BASE = s2.url;
    process.env.AI_FALLBACK_ORDER = 'groq,openrouter';
    reinitialiserRegistre();
    const traces: Array<{ mode: string; bascules?: number }> = [];
    await serviceIa.generer('conversation', requeteTest, {
      noter: (t) => traces.push(t),
    });
    assert.equal(s2.hits(), 0, 'le second fournisseur n\'est jamais sollicité');
    assert.equal(s1.hits(), 1);
    const generation = traces.find((t) => t.mode === 'generation');
    assert.equal(generation?.bascules, 0);
    purgerEnv();
  });

  test('streaming : annulation utilisateur en cours de flux → texte partiel conservé', async () => {
    const s = await stub((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: 'un ' } }] })}\n\n`);
      setTimeout(() => {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: 'deux ' } }] })}\n\n`);
        setTimeout(() => res.end('data: [DONE]\n\n'), 400);
      }, 200);
    });
    stubs.push(s);
    purgerEnv();
    process.env.GROQ_API_KEY = 'c';
    process.env.GROQ_API_BASE = s.url;
    reinitialiserRegistre();
    const f = new FournisseurGroq();
    const controle = new AbortController();
    let recu = '';
    setTimeout(() => controle.abort(), 320);
    const rep = await f.streamResponse(requeteTest, (t) => (recu += t), controle.signal);
    assert.equal(rep.texte.trim(), 'un deux', 'les fragments reçus avant annulation sont conservés');
    assert.equal(recu, 'un deux ');
    purgerEnv();
  });

  test('observabilité : durée et nombre de bascules tracés', async () => {
    const s1 = await stub(stubErreur(500));
    const s2 = await stub(stubReponse('Après bascule'));
    stubs.push(s1, s2);
    purgerEnv();
    process.env.GEMINI_API_KEY = 'c';
    process.env.GEMINI_API_BASE = s1.url;
    process.env.GROQ_API_KEY = 'c';
    process.env.GROQ_API_BASE = s2.url;
    reinitialiserRegistre();
    const traces: Array<{ mode: string; dureeMs?: number; bascules?: number; fournisseur?: string }> = [];
    await serviceIa.generer('conversation', requeteTest, { noter: (t) => traces.push(t) });
    const generation = traces.find((t) => t.mode === 'generation');
    assert.ok((generation?.dureeMs ?? -1) >= 0, 'durée mesurée');
    assert.equal(generation?.bascules, 1, 'une bascule tracée');
    assert.equal(generation?.fournisseur, 'groq');
    purgerEnv();
  });
});


/* ─────────────── Messages d'erreur : chaque cause se distingue ─────────────── */

describe('Erreurs fournisseur — ne jamais confondre deux causes', () => {
  test('404 : le modèle est en cause, pas le réseau', () => {
    const e = erreurDepuisStatut(404);
    assert.equal(e.code, 'modele-introuvable');
    assert.match(e.message, /modèle/i);
    assert.doesNotMatch(e.message, /ne répond pas/);
  });

  test('5xx : le fournisseur a répondu, en erreur', () => {
    const e = erreurDepuisStatut(503);
    assert.equal(e.code, 'erreur-fournisseur');
    assert.match(e.message, /HTTP 503/);
  });

  test('401/403, 429, 504 gardent leurs messages propres', () => {
    assert.equal(erreurDepuisStatut(401).code, 'auth-fournisseur');
    assert.equal(erreurDepuisStatut(429).code, 'limite-modele');
    assert.equal(erreurDepuisStatut(504).code, 'timeout');
    // Aucun message ne divulgue de clé ni de corps de réponse.
    for (const statut of [400, 401, 403, 404, 429, 500, 503, 504]) {
      assert.doesNotMatch(erreurDepuisStatut(statut).message, /key=|api[_-]?key|sk-|xkeysib/i);
    }
  });
});
