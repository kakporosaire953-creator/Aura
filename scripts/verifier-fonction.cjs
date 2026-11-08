#!/usr/bin/env node
/**
 * Vérifie que la fonction serverless peut réellement démarrer.
 *
 * Constat (mission 10) : en production, `/api/status` renvoyait
 * « 500 FUNCTION_INVOCATION_FAILED ». Cause : le projet est en ESM
 * (`"type": "module"`), et Node exige une extension explicite sur les imports
 * relatifs. Compilé tel quel, `import './accounts'` devient
 * `ERR_MODULE_NOT_FOUND` au premier appel — invisible en local, où `tsx`
 * tolère l'absence d'extension.
 *
 * Ce script reproduit la compilation de la plateforme (esbuild, format ESM),
 * puis charge le module dans un vrai contexte ESM. Il échoue si un import
 * relatif manque d'extension, ou si le module ne s'expose pas correctement.
 *
 *   node scripts/verifier-fonction.cjs
 */
'use strict';

const { execFileSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, symlinkSync, rmSync, existsSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const racine = path.resolve(__dirname, '..');
const dossier = mkdtempSync(path.join(tmpdir(), 'aura-fonction-'));

function echec(message) {
  console.error(`✗ ${message}`);
  rmSync(dossier, { recursive: true, force: true });
  process.exit(1);
}

try {
  // 1. Lister les sources serveur (comme le fait la plateforme).
  const sources = execFileSync('find', ['server', '-name', '*.ts'], {
    cwd: racine,
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter(Boolean);

  // 2. Compiler en ESM, sans regrouper : les spécificateurs sont conservés
  //    tels quels — c'est exactement là que l'oubli d'extension se voit.
  execFileSync(
    path.join(racine, 'node_modules/.bin/esbuild'),
    ['api/index.ts', ...sources, `--outdir=${dossier}`, `--outbase=${racine}`, '--format=esm', '--platform=node', '--log-level=error'],
    { cwd: racine, stdio: 'pipe' },
  );

  // 3. Contexte ESM réel, avec les dépendances du projet.
  writeFileSync(path.join(dossier, 'package.json'), '{ "type": "module" }\n');
  const modules = path.join(racine, 'node_modules');
  if (!existsSync(modules)) echec('node_modules absent : lancez npm install avant la vérification.');
  symlinkSync(modules, path.join(dossier, 'node_modules'), 'dir');

  // 4. Charger la fonction ET l'invoquer : le routeur est importé
  //    dynamiquement, donc un simple import ne prouverait rien. C'est un vrai
  //    appel HTTP à /api/status qui déclenche la résolution des imports.
  const script = `
    const m = await import(${JSON.stringify(path.join(dossier, 'api/index.js'))});
    if (typeof m.default !== 'function') {
      console.log('ECHEC:pas-de-handler');
      process.exit(1);
    }
    const express = (await import('express')).default;
    const app = express();
    app.use('/api', (req, res) => void m.default(req, res));
    const s = app.listen(0, '127.0.0.1');
    await new Promise((r) => s.once('listening', r));
    const r = await fetch('http://127.0.0.1:' + s.address().port + '/api/status');
    const corps = await r.text();
    s.close();
    if (r.status !== 200) {
      console.log('ECHEC:statut-' + r.status + ':' + corps.slice(0, 120));
      process.exit(1);
    }
    console.log('OK');
  `;
  const sortie = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: dossier,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (!sortie.includes('OK')) echec(`la fonction ne répond pas correctement : ${sortie.trim()}`);

  console.log('✓ Fonction serverless : imports ESM résolus, handler chargé.');
  rmSync(dossier, { recursive: true, force: true });
} catch (e) {
  const message =
    e instanceof Error
      ? String(e.stderr || e.stdout || e.message).split('\n').slice(0, 6).join('\n')
      : String(e);
  echec(`la fonction ne démarre pas en ESM.\n${message}`);
}
