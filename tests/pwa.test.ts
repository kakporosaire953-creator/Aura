/**
 * Application installable — ce qui est vérifiable sans navigateur.
 *
 * Un manifeste valide, des icônes réellement présentes et à la bonne taille,
 * un service worker qui ne met **jamais** les données en cache, des en-têtes
 * qui ne figent pas `/sw.js`, et une page hors ligne autonome. Ce fichier ne
 * prouve pas l'installation elle-même (elle dépend du navigateur) : voir
 * `tests/pwa-ui.test.ts` pour le comportement des composants.
 *   node --import tsx --test tests/pwa.test.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.join(import.meta.dirname, '..');
const PUBLIC = path.join(RACINE, 'public');
const lire = (...p: string[]) => fs.readFileSync(path.join(RACINE, ...p), 'utf8');
const existe = (...p: string[]) => fs.existsSync(path.join(RACINE, ...p));

type Icone = { src: string; sizes: string; type: string; purpose?: string };
type Manifeste = {
  id: string;
  name: string;
  short_name: string;
  start_url: string;
  scope: string;
  display: string;
  background_color: string;
  theme_color: string;
  lang: string;
  icons: Icone[];
  shortcuts: { name: string; url: string }[];
};

const manifeste = JSON.parse(lire('public', 'manifest.webmanifest')) as Manifeste;

/** Largeur et hauteur lues dans l'en-tête IHDR d'un PNG (octets 16 à 23). */
function taillePng(chemin: string): { largeur: number; hauteur: number } {
  const tampon = fs.readFileSync(chemin);
  assert.equal(tampon.subarray(1, 4).toString('ascii'), 'PNG', `${chemin} n'est pas un PNG`);
  return { largeur: tampon.readUInt32BE(16), hauteur: tampon.readUInt32BE(20) };
}

describe('Manifeste', () => {
  test('se déclare installable, en français, avec une portée racine', () => {
    assert.equal(manifeste.id, '/');
    assert.equal(manifeste.name, "AURA — De l'idée au résultat.");
    assert.equal(manifeste.short_name, 'AURA');
    assert.equal(manifeste.lang, 'fr');
    assert.equal(manifeste.display, 'standalone');
    assert.equal(manifeste.start_url, '/app');
    assert.equal(manifeste.scope, '/');
    assert.match(manifeste.background_color, /^#[0-9a-f]{6}$/i);
    assert.match(manifeste.theme_color, /^#[0-9a-f]{6}$/i);
  });

  test('déclare au moins 192 et 512 px, plus une version maskable', () => {
    const tailles = manifeste.icons.map((i) => i.sizes);
    assert.ok(tailles.includes('192x192'), 'icône 192 manquante');
    assert.ok(tailles.includes('512x512'), 'icône 512 manquante');
    assert.ok(
      manifeste.icons.some((i) => i.purpose === 'maskable'),
      'aucune icône maskable : les icônes seraient rognées sur Android',
    );
  });

  test('chaque icône existe et correspond à la taille annoncée', () => {
    for (const icone of manifeste.icons) {
      assert.equal(icone.type, 'image/png');
      const chemin = path.join(PUBLIC, icone.src.replace(/^\//, ''));
      assert.ok(fs.existsSync(chemin), `icône absente : ${icone.src}`);
      const [largeur, hauteur] = icone.sizes.split('x').map(Number);
      assert.deepEqual(taillePng(chemin), { largeur, hauteur }, `taille incohérente : ${icone.src}`);
    }
  });

  test('les raccourcis pointent vers des routes réelles', () => {
    const routes = manifeste.shortcuts.map((s) => s.url);
    assert.deepEqual(routes, ['/chat', '/projets', '/missions']);
  });
});

describe('Service worker', () => {
  const sw = lire('public', 'sw.js');

  test('vit à la racine et écoute les trois étapes du cycle de vie', () => {
    assert.ok(existe('public', 'sw.js'), '/sw.js doit être servi à la racine');
    for (const etape of ['install', 'activate', 'fetch']) {
      assert.match(sw, new RegExp(`addEventListener\\('${etape}'`), `écouteur « ${etape} » absent`);
    }
  });

  test('ne met jamais /api en cache — ni données, ni sessions', () => {
    assert.match(sw, /startsWith\('\/api\/'\)/, "le test d'exclusion de /api a disparu");
    assert.match(sw, /if \(url\.pathname\.startsWith\('\/api\/'\)[^)]*\) return;/);
    assert.doesNotMatch(sw, /caches\.open\([^)]*\)[\s\S]{0,80}\/api\//, 'une route /api est mise en cache');
  });

  test('sert une page hors ligne honnête', () => {
    assert.match(sw, /\/hors-ligne\.html/);
    assert.ok(existe('public', 'hors-ligne.html'));
    const page = lire('public', 'hors-ligne.html');
    assert.match(page, /hors ligne/i);
    assert.match(page, /name="viewport"/);
    // Autonome : aucune police ni script distant, sinon la page ne s'affiche
    // pas hors ligne.
    assert.doesNotMatch(page, /<link[^>]+href="https?:/i);
    assert.doesNotMatch(page, /<script[^>]+src=/i);
  });

  test('reste un script classique, sans dépendance ni eval', () => {
    assert.doesNotMatch(sw, /^\s*import\s/m, 'aucun import : le worker doit être autonome');
    assert.doesNotMatch(sw, /importScripts/);
    assert.doesNotMatch(sw, /\beval\(/);
    assert.doesNotMatch(sw, /new Function/);
  });

  test('versionne ses caches et supprime les anciens', () => {
    assert.match(sw, /const VERSION = 'aura-\d+'/);
    assert.match(sw, /caches\.delete/);
  });
});

describe('Document et en-têtes', () => {
  const html = lire('index.html');

  test('le document déclare le manifeste et les icônes iOS', () => {
    assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
    assert.match(html, /rel="apple-touch-icon" href="\/icones\/apple-touch-icon\.png"/);
    assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
    assert.match(html, /name="apple-mobile-web-app-title"/);
    assert.match(html, /name="theme-color"/);
  });

  test('l’icône Apple existe en 180 px', () => {
    assert.deepEqual(taillePng(path.join(PUBLIC, 'icones', 'apple-touch-icon.png')), {
      largeur: 180,
      hauteur: 180,
    });
  });

  test('Vercel ne fige ni /sw.js ni le manifeste', () => {
    const vercel = JSON.parse(lire('vercel.json')) as {
      headers: { source: string; headers: { key: string; value: string }[] }[];
      rewrites: { source: string; destination: string }[];
    };
    const enTetes = (source: string) =>
      Object.fromEntries(
        (vercel.headers.find((h) => h.source === source)?.headers ?? []).map((h) => [h.key, h.value]),
      );

    const sw = enTetes('/sw.js');
    assert.match(sw['Cache-Control'] ?? '', /max-age=0|no-cache/);
    assert.equal(sw['Service-Worker-Allowed'], '/');

    const manifesteEnTetes = enTetes('/manifest.webmanifest');
    assert.match(manifesteEnTetes['Content-Type'] ?? '', /application\/manifest\+json/);

    // La réécriture SPA ne doit pas avaler les fichiers de l'application
    // installable (double sécurité : Vercel sert d'abord les fichiers).
    const spa = vercel.rewrites.find((r) => r.destination === '/index.html');
    assert.ok(spa, 'réécriture SPA introuvable');
    const motif = new RegExp(`^${spa.source}$`);
    assert.equal(motif.test('/app'), true);
    for (const fichier of ['/sw.js', '/manifest.webmanifest', '/icones/aura-192.png', '/hors-ligne.html']) {
      assert.equal(motif.test(fichier), false, `${fichier} serait renvoyé vers index.html`);
    }
  });

  test('le serveur auto-hébergé pose les mêmes en-têtes sur /sw.js', async () => {
    const { poserEntetesPwa } = await import('../server/en-tetes');
    const poser = (chemin: string) => {
      const poses: Record<string, string> = {};
      let suite = false;
      poserEntetesPwa({ path: chemin } as never, { setHeader: (c: string, v: string) => (poses[c] = v) } as never, () => (suite = true));
      return { poses, suite };
    };

    const sw = poser('/sw.js');
    assert.equal(sw.suite, true);
    assert.match(sw.poses['Cache-Control'], /no-cache/);
    assert.equal(sw.poses['Service-Worker-Allowed'], '/');

    const api = poser('/api/status');
    assert.equal(api.poses['Cache-Control'], undefined, 'l’API ne doit pas être marquée no-cache ici');
    assert.equal(api.suite, true);
  });
});
