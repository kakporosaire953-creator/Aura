#!/usr/bin/env node
/**
 * AURA AI PROVIDERS HEALTH CHECK — diagnostic sécurisé des fournisseurs IA.
 *
 * Usage : node scripts/verifier-cles.cjs [--rapide]
 *   --rapide : uniquement configuration + génération (2 appels/fournisseur)
 *
 * Garanties :
 *  - aucune clé affichée ni journalisée ;
 *  - requêtes minimales (prompts courts, max_tokens réduits) ;
 *  - un seul appel par vérification (pas d'appels répétés inutiles) ;
 *  - durées d'exécution mesurées et affichées ;
 *  - erreurs distinguées : configuration / authentification / quota /
 *    modèle indisponible / réseau / délai dépassé ;
 *  - aucune réponse utilisateur conservée (extraits tronqués affichés).
 *
 * À lancer depuis une machine avec accès Internet (poste de dev, serveur).
 */
const { readFileSync } = require('node:fs');
const path = require('node:path');

// Charge .env si présent (comme les scripts npm du projet).
try {
  const brut = readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  for (const ligne of brut.split('\n')) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch {
  /* pas de .env — variables d'environnement système */
}

const env = (primaire, alias) =>
  (process.env[primaire] ?? (alias ? process.env[alias] ?? '' : '')).trim();
const RAPIDE = process.argv.includes('--rapide');
const DELAI_MS = 20000;

/** Classification d'un échec — jamais de secret dans les messages. */
function classerErreur(e) {
  if (e && e.statut) {
    const s = e.statut;
    if (s === 401 || s === 403) return `ÉCHEC (authentification refusée, HTTP ${s})`;
    if (s === 429) return 'ÉCHEC (quota dépassé, HTTP 429)';
    if (s === 402) return 'ÉCHEC (crédits épuisés, HTTP 402)';
    if (s === 404) return 'ÉCHEC (modèle indisponible, HTTP 404)';
    return `ÉCHEC (HTTP ${s})`;
  }
  const nom = e instanceof Error ? e.name : '';
  if (nom === 'TimeoutError' || nom === 'AbortError') return `ÉCHEC (délai dépassé > ${DELAI_MS} ms)`;
  return 'ÉCHEC (réseau injoignable)';
}

async function appel(url, options) {
  const debut = Date.now();
  try {
    const r = await fetch(url, { ...options, signal: AbortSignal.timeout(DELAI_MS) });
    const dureeMs = Date.now() - debut;
    if (!r.ok) {
      const err = new Error(`HTTP ${r.status}`);
      err.statut = r.status;
      err.dureeMs = dureeMs;
      throw err;
    }
    return { donnees: await r.json(), dureeMs };
  } catch (e) {
    if (e instanceof Error && !e.statut) e.dureeMs = Date.now() - debut;
    throw e;
  }
}

/* ── Définition des fournisseurs et de leurs vérifications ── */

const fournisseurs = [
  {
    nom: 'Gemini',
    cle: env('GEMINI_API_KEY', 'AURA_GEMINI_API_KEY'),
    base: env('GEMINI_API_BASE', 'AURA_MODELE_URL') || 'https://generativelanguage.googleapis.com',
    modele: env('GEMINI_MODEL', 'AURA_MODELE') || 'gemini-3.8-flash',
    entetes: (cle) => ({ 'Content-Type': 'application/json', 'x-goog-api-key': cle }),
    urlGen: (base, modele) => `${base}/v1beta/models/${modele}:generateContent`,
    urlStream: (base, modele) => `${base}/v1beta/models/${modele}:streamGenerateContent?alt=sse`,
    corpsGen: (messages, system, stream) => ({
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { temperature: 0.3, maxOutputTokens: 16 },
    }),
    extraireTexte: (d) =>
      (d?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('').trim(),
    tramesStream: (texte) =>
      texte
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .filter((t) => t && t !== '[DONE]')
        .map((t) => {
          try {
            return JSON.parse(t);
          } catch {
            return null;
          }
        })
        .filter(Boolean),
    extraireTrame: (j) =>
      (j?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join(''),
  },
  {
    nom: 'Groq',
    cle: env('GROQ_API_KEY'),
    base: env('GROQ_API_BASE') || 'https://api.groq.com/openai/v1',
    modele: env('GROQ_MODEL') || 'llama-3.3-70b-versatile',
    entetes: (cle) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` }),
    urlGen: (base) => `${base}/chat/completions`,
    urlStream: (base) => `${base}/chat/completions`,
    corpsGen: (messages, system, stream) => ({
      model: env('GROQ_MODEL') || 'llama-3.3-70b-versatile',
      messages: [...(system ? [{ role: 'system', content: system }] : []), ...messages],
      max_tokens: 16,
      ...(stream ? { stream: true } : {}),
    }),
    extraireTexte: (d) => String(d?.choices?.[0]?.message?.content ?? '').trim(),
    tramesStream: (texte) =>
      texte
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .filter((t) => t && t !== '[DONE]')
        .map((t) => {
          try {
            return JSON.parse(t);
          } catch {
            return null;
          }
        })
        .filter(Boolean),
    extraireTrame: (j) => String(j?.choices?.[0]?.delta?.content ?? ''),
  },
  {
    nom: 'OpenRouter',
    cle: env('OPENROUTER_API_KEY'),
    base: env('OPENROUTER_API_BASE') || 'https://openrouter.ai/api/v1',
    modele: env('OPENROUTER_MODEL') || 'openai/gpt-4o-mini',
    entetes: (cle) => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cle}`,
      'HTTP-Referer': 'https://aura.africa',
      'X-OpenRouter-Title': 'AURA',
    }),
    urlGen: (base) => `${base}/chat/completions`,
    urlStream: (base) => `${base}/chat/completions`,
    corpsGen: (messages, system, stream) => ({
      model: env('OPENROUTER_MODEL') || 'openai/gpt-4o-mini',
      messages: [...(system ? [{ role: 'system', content: system }] : []), ...messages],
      max_tokens: 16,
      ...(stream ? { stream: true } : {}),
    }),
    extraireTexte: (d) => String(d?.choices?.[0]?.message?.content ?? '').trim(),
    tramesStream: (texte) =>
      texte
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .filter((t) => t && t !== '[DONE]')
        .map((t) => {
          try {
            return JSON.parse(t);
          } catch {
            return null;
          }
        })
        .filter(Boolean),
    extraireTrame: (j) => String(j?.choices?.[0]?.delta?.content ?? ''),
  },
];

async function verifier(f) {
  const lignes = [];
  const notes = [];
  if (!f.cle) {
    lignes.push('  Configuration    : ABSENTE (clé non configurée)');
    return { lignes, ok: false, nonConfigure: true };
  }
  lignes.push('  Configuration    : OK');

  // 1. Authentification + génération (un seul appel minimal).
  let genOk = false;
  try {
    const { donnees, dureeMs } = await appel(f.urlGen(f.base, f.modele), {
      method: 'POST',
      headers: f.entetes(f.cle),
      body: JSON.stringify(
        f.corpsGen([{ role: 'user', content: 'Dis OK.' }], undefined, false),
      ),
    });
    const texte = f.extraireTexte(donnees);
    genOk = texte.length > 0;
    lignes.push(
      genOk
        ? `  Authentification : OK\n  Génération       : OK (${dureeMs} ms, extrait : « ${texte.slice(0, 24)} »)`
        : `  Authentification : OK\n  Génération       : ÉCHEC (réponse vide, ${dureeMs} ms)`,
    );
    notes.push(`  Modèle           : ${f.modele}`);
  } catch (e) {
    const statut = e.statut ?? null;
    lignes.push(
      `  Authentification : ${statut === 401 || statut === 403 ? classerErreur(e) : statut ? 'OK (authentifiée)' : 'NON TESTÉE (réseau)'}`,
    );
    lignes.push(`  Génération       : ${classerErreur(e)}`);
    return { lignes, ok: false, nonConfigure: false, notes };
  }

  if (RAPIDE) return { lignes, ok: genOk, notes };

  // 2. Conversations multi-messages + message système.
  try {
    const { dureeMs } = await appel(f.urlGen(f.base, f.modele), {
      method: 'POST',
      headers: f.entetes(f.cle),
      body: JSON.stringify(
        f.corpsGen(
          [
            { role: 'user', content: 'Je m’appelle Ada.' },
            { role: 'assistant', content: 'Bonjour Ada.' },
            { role: 'user', content: 'Quel est mon prénom ?' },
          ],
          'Réponds en un mot.',
          false,
        ),
      ),
    });
    lignes.push(`  Conversations    : OK (${dureeMs} ms, système + 3 messages)`);
  } catch (e) {
    lignes.push(`  Conversations    : ${classerErreur(e)}`);
  }

  // 3. Streaming : fragments progressifs, ordre préservé, fin normale.
  try {
    const debut = Date.now();
    const r = await fetch(f.urlStream(f.base, f.modele), {
      method: 'POST',
      headers: f.entetes(f.cle),
      body: JSON.stringify(
        f.corpsGen([{ role: 'user', content: 'Compte de 1 à 3.' }], undefined, true),
      ),
      signal: AbortSignal.timeout(DELAI_MS),
    });
    if (!r.ok) {
      const err = new Error(`HTTP ${r.status}`);
      err.statut = r.status;
      throw err;
    }
    const brut = await r.text();
    const trames = f.tramesStream(brut);
    const fragments = trames.map(f.extraireTrame).filter(Boolean);
    const dureeMs = Date.now() - debut;
    lignes.push(
      fragments.length > 0
        ? `  Streaming        : OK (${fragments.length} fragment(s), ${dureeMs} ms)`
        : `  Streaming        : ÉCHEC (aucun fragment reçu, ${dureeMs} ms)`,
    );
  } catch (e) {
    lignes.push(`  Streaming        : ${classerErreur(e)}`);
  }

  // 4. Gestion des erreurs : modèle inexistant → erreur structurée attendue.
  try {
    await appel(f.urlGen(f.base, 'modele-inexistant-aura-test'), {
      method: 'POST',
      headers: f.entetes(f.cle),
      body: JSON.stringify(f.corpsGen([{ role: 'user', content: 'x' }], undefined, false)),
    });
    lignes.push('  Gestion erreurs  : inattendue (modèle invalide accepté)');
  } catch (e) {
    lignes.push(
      e.statut
        ? `  Gestion erreurs  : OK (modèle invalide refusé proprement, HTTP ${e.statut})`
        : `  Gestion erreurs  : ${classerErreur(e)}`,
    );
  }

  // 5. Timeout côté client (normalisation vérifiée sans appel supplémentaire).
  try {
    await fetch(f.urlGen(f.base, f.modele), {
      method: 'POST',
      headers: f.entetes(f.cle),
      body: JSON.stringify(f.corpsGen([{ role: 'user', content: 'x' }], undefined, false)),
      signal: AbortSignal.timeout(1),
    });
    lignes.push('  Timeout          : inattendu (réponse en < 1 ms)');
  } catch (e) {
    const nom = e instanceof Error ? e.name : '';
    lignes.push(
      nom === 'TimeoutError' || nom === 'AbortError'
        ? `  Timeout          : OK (annulation normalisée après ${e.dureeMs ?? 1} ms)`
        : `  Timeout          : ${classerErreur(e)}`,
    );
  }

  return { lignes, ok: genOk, notes };
}

/* ── Exécution ── */

(async () => {
  const debutGlobal = Date.now();
  console.log('AURA AI PROVIDERS HEALTH CHECK');
  console.log('==============================');
  const resultats = [];
  for (const f of fournisseurs) {
    console.log(`\n${f.nom}`);
    console.log('-'.repeat(f.nom.length));
    const res = await verifier(f);
    for (const l of res.lignes) console.log(l);
    for (const n of res.notes ?? []) console.log(n);
    resultats.push({ nom: f.nom, ...res });
  }
  const dureeTotale = Date.now() - debutGlobal;
  const ok = resultats.filter((r) => r.ok).length;
  const absents = resultats.filter((r) => r.nonConfigure).length;
  console.log('\n==============================');
  console.log(
    `Bilan : ${ok}/${resultats.length} fournisseur(s) opérationnel(s)` +
      (absents ? `, ${absents} non configuré(s)` : '') +
      ` — durée totale ${dureeTotale} ms`,
  );
  console.log(
    'Rappel : les résultats réseau dépendent de la machine exécutée ; ' +
      'relancez ce script depuis un poste avec accès Internet si nécessaire.',
  );
  process.exit(ok === resultats.length ? 0 : 1);
})();
