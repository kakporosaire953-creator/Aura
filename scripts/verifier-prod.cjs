#!/usr/bin/env node
/**
 * Vérification de la construction de production (mission 07).
 *
 * Trois familles de contrôles, aucune supposition :
 *
 * 1. **Simulation** — `import.meta.env.DEV` vaut `false` à la construction :
 *    le blocage devient une constante et tout le code d'activation (écriture
 *    du drapeau, création du compte de démonstration) doit disparaître du
 *    paquet livré.
 * 2. **CSP** — la politique n'autorise que `'self'`, Google Fonts et
 *    l'origine de l'animation d'accueil. On vérifie donc qu'aucune ressource
 *    réellement chargée par le document (scripts, styles, polices, images)
 *    ne vient d'ailleurs.
 * 3. **Cohérence** — `vercel.json` et `server/en-tetes.ts` doivent porter la
 *    même politique, directive par directive.
 *
 * Usage : npm run verif:prod   (construit puis vérifie)
 */
const fs = require('node:fs');
const path = require('node:path');

const racine = path.join(__dirname, '..');
const dossierDist = path.join(racine, 'dist');
const dossierAssets = path.join(dossierDist, 'assets');

const ORIGINES_AUTORISEES = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'lottie.host',
]);

function echec(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function hote(url) {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

if (!fs.existsSync(dossierAssets)) echec('dist/assets absent : lancez la construction.');

const paquets = fs
  .readdirSync(dossierAssets)
  .filter((f) => f.startsWith('index-') && f.endsWith('.js'));

if (paquets.length === 0) echec('paquet principal introuvable dans dist/assets.');

const source = paquets.map((f) => fs.readFileSync(path.join(dossierAssets, f), 'utf8')).join('\n');

/* ── 1. Simulation ── */

const interdits = [
  ['aura_simulation', "le drapeau d'activation du mode simulation"],
  ['demo@aura.local', 'la création du compte de démonstration'],
];

for (const [motif, description] of interdits) {
  if (source.includes(motif)) {
    echec(`${description} est encore présent dans le paquet de production (${motif}).`);
  }
}

if (!source.includes('mode simulation est désactivé')) {
  echec("la garde du mode simulation est absente : la vérification n'aurait plus de sens.");
}

/* ── 2. Compatibilité CSP : ce que le document charge réellement ── */

const html = fs.readFileSync(path.join(dossierDist, 'index.html'), 'utf8');
const references = [...html.matchAll(/(?:src|href)\s*=\s*"([^"]+)"/g)].map((m) => m[1]);

const externesDocument = [];
for (const ref of references) {
  if (!/^https?:\/\//i.test(ref)) continue;
  const h = hote(ref);
  if (!h) echec(`référence illisible dans index.html : ${ref}`);
  externesDocument.push(h);
  if (!ORIGINES_AUTORISEES.has(h)) {
    echec(`index.html charge ${h}, absent de la CSP (${ref}).`);
  }
}

const css = fs
  .readdirSync(dossierAssets)
  .filter((f) => f.endsWith('.css'))
  .map((f) => fs.readFileSync(path.join(dossierAssets, f), 'utf8'))
  .join('\n');

for (const m of css.matchAll(/url\((?:["'])?(https?:\/\/[^)"']+)/g)) {
  const h = hote(m[1]);
  if (!h || !ORIGINES_AUTORISEES.has(h)) {
    echec(`le CSS charge ${h ?? m[1]}, absent de la CSP.`);
  }
}

/* ── 3. Cohérence entre vercel.json et server/en-tetes.ts ── */

let vercel;
try {
  vercel = JSON.parse(fs.readFileSync(path.join(racine, 'vercel.json'), 'utf8'));
} catch (e) {
  echec(`vercel.json illisible : ${e instanceof Error ? e.message : e}`);
}

const enteteCsp = (vercel.headers ?? [])
  .flatMap((bloc) => bloc.headers ?? [])
  .find((h) => h.key.toLowerCase() === 'content-security-policy');

if (!enteteCsp) echec('aucune CSP déclarée dans vercel.json.');

const sourceEnTetes = fs.readFileSync(path.join(racine, 'server', 'en-tetes.ts'), 'utf8');
const blocCsp = sourceEnTetes.slice(
  sourceEnTetes.indexOf('CONTENU_SECURITE = ['),
  sourceEnTetes.indexOf('].join'),
);

if (!blocCsp) echec('CONTENU_SECURITE introuvable dans server/en-tetes.ts.');

// Seules les lignes d'éléments comptent : les commentaires du tableau sont
// écartés avant lecture, sinon les apostrophes du texte français passeraient
// pour des directives.
const directives = blocCsp
  .split('\n')
  .filter((ligne) => !ligne.trim().startsWith('//'))
  .flatMap((ligne) => [...ligne.matchAll(/"([^"]+)"/g)].map((m) => m[1]))
  .filter((v) => /^(default-src|script-src|style-src|font-src|img-src|media-src|connect-src|worker-src|frame-src|object-src|base-uri|form-action|frame-ancestors)( |$)/.test(v));

if (directives.length === 0) echec('aucune directive lue dans server/en-tetes.ts.');

for (const directive of directives) {
  if (!enteteCsp.value.includes(directive)) {
    echec(`la CSP de vercel.json diverge du code : « ${directive} » manquante.`);
  }
}

console.log('✓ Production : le mode simulation ne peut pas être activé.');
console.log(
  `✓ CSP : ${references.length} références du document contrôlées, ` +
    `${externesDocument.length ? [...new Set(externesDocument)].join(', ') : 'aucune origine externe'}.`,
);
console.log(`✓ Cohérence : ${directives.length} directives identiques dans vercel.json et le serveur.`);
console.log(`  ${paquets.length} paquet(s) vérifié(s), ${Math.round(source.length / 1024)} ko lus.`);
