#!/usr/bin/env node
/**
 * Vérification des clés API IA — autonome (aucune clé stockée ici ; le
 * script lit uniquement l'environnement / le fichier .env).
 *
 * Usage : node scripts/verifier-cles.cjs
 *   → appelle chaque fournisseur configuré avec une requête minime et
 *     affiche le résultat réel : OK / refusée / injoignable / non configurée.
 * À lancer depuis une machine ayant accès à Internet (poste de dev ou
 * serveur) — les clés ne sont jamais affichées.
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

const fournisseurs = [
  {
    nom: 'Google Gemini',
    cle: env('GEMINI_API_KEY', 'AURA_GEMINI_API_KEY'),
    base: env('GEMINI_API_BASE', 'AURA_MODELE_URL') || 'https://generativelanguage.googleapis.com',
    modele: env('GEMINI_MODEL', 'AURA_MODELE') || 'gemini-3.8-flash',
    requete(cle, base, modele) {
      return {
        url: `${base}/v1beta/models/${modele}:generateContent`,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle },
        corps: {
          contents: [{ role: 'user', parts: [{ text: 'Dis « OK » en un mot.' }] }],
          generationConfig: { maxOutputTokens: 8 },
        },
        extraire: (d) => d?.candidates?.[0]?.content?.parts?.[0]?.text,
      };
    },
  },
  {
    nom: 'Groq',
    cle: env('GROQ_API_KEY'),
    base: env('GROQ_API_BASE') || 'https://api.groq.com/openai/v1',
    modele: env('GROQ_MODEL') || 'llama-3.3-70b-versatile',
    requete(cle, base, modele) {
      return {
        url: `${base}/chat/completions`,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
        corps: {
          model: modele,
          messages: [{ role: 'user', content: 'Say OK in one word.' }],
          max_tokens: 8,
        },
        extraire: (d) => d?.choices?.[0]?.message?.content,
      };
    },
  },
  {
    nom: 'OpenRouter',
    cle: env('OPENROUTER_API_KEY'),
    base: env('OPENROUTER_API_BASE') || 'https://openrouter.ai/api/v1',
    modele: env('OPENROUTER_MODEL') || 'openai/gpt-4o-mini',
    requete(cle, base, modele) {
      return {
        url: `${base}/chat/completions`,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
        corps: {
          model: modele,
          messages: [{ role: 'user', content: 'Say OK in one word.' }],
          max_tokens: 8,
        },
        extraire: (d) => d?.choices?.[0]?.message?.content,
      };
    },
  },
];

async function main() {
  console.log('Vérification des clés API IA (aucune clé affichée)\n');
  let echecs = 0;
  for (const f of fournisseurs) {
    if (!f.cle) {
      console.log(`○ ${f.nom} — non configurée (clé absente)`);
      continue;
    }
    const r = f.requete(f.cle, f.base, f.modele);
    try {
      const rep = await fetch(r.url, {
        method: 'POST',
        headers: r.headers,
        body: JSON.stringify(r.corps),
        signal: AbortSignal.timeout(20000),
      });
      if (!rep.ok) {
        echecs++;
        console.log(`❌ ${f.nom} — HTTP ${rep.status} (clé refusée ou service indisponible)`);
        continue;
      }
      const texte = String(r.extraire(await rep.json()) ?? '').trim().slice(0, 40);
      console.log(`✅ ${f.nom} — clé valide — réponse reçue : « ${texte} »`);
    } catch (e) {
      echecs++;
      const nom = e instanceof Error ? e.name : 'Erreur';
      const message = e instanceof Error ? e.message : String(e);
      console.log(`❌ ${f.nom} — injoignable : ${nom === 'TimeoutError' ? 'délai dépassé' : message}`);
    }
  }
  console.log(
    echecs === 0
      ? '\nToutes les clés configurées répondent.'
      : `\n${echecs} fournisseur(s) à vérifier.`,
  );
  process.exit(echecs > 0 ? 1 : 0);
}

main();
