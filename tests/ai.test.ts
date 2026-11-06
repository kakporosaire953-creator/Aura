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
