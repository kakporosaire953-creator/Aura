/**
 * Audit de mise en page, dans un vrai navigateur (Chromium via Playwright).
 *
 * Pour chaque page et chaque largeur d'écran :
 *  - débordement horizontal de la page (scrollWidth > largeur visible) ;
 *  - éléments qui dépassent la fenêtre sans être dans un conteneur défilant ;
 *  - cibles tactiles plus petites que 40 px sur téléphone ;
 *  - erreurs JavaScript et erreurs console.
 *
 * Ce script n'est pas lancé par `npm test` : il demande un navigateur, absent
 * de l'environnement de développement. Il tourne en CI
 * (`.github/workflows/audit-responsive.yml`) et peut se lancer en local :
 *
 *   BASE_URL=http://127.0.0.1:4173 node scripts/audit-responsive.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const SORTIE = process.env.OUT_DIR || 'audit-responsive';
const COMPTE = { email: `audit-${Date.now()}@aura.test`, password: 'motdepasse123', nom: 'Audit' };

const LARGEURS = [320, 360, 390, 414, 480, 768, 834, 1024, 1180, 1280, 1440, 1920];
const PAGES = [
  ['accueil', '/'],
  ['tarifs', '/tarifs'],
  ['documentation', '/docs'],
  ['connexion', '/login'],
  ['inscription', '/register'],
  ['espace', '/espace'],
  ['assistant', '/chat'],
  ['atelier', '/studio'],
  ['projets', '/projets'],
  ['missions', '/missions'],
  ['memoire', '/memoire'],
  ['explorer', '/explorer'],
  ['historique', '/historique'],
  ['parametres', '/parametres'],
];
const CAPTURES = [390, 768];
const PAGES_CAPTURE = new Set(['accueil', 'espace', 'assistant', 'atelier']);

function idUnique(largeur, page) {
  return `${page}-${largeur}`;
}

async function mesurer(page) {
  return page.evaluate(() => {
    const largeur = window.innerWidth;
    const debordements = [];
    const ciblesPetites = [];

    const dansConteneurDefilant = (el) => {
      let noeud = el.parentElement;
      while (noeud && noeud !== document.body) {
        const style = getComputedStyle(noeud);
        if (/(auto|scroll|hidden|clip)/.test(`${style.overflowX} ${style.overflowY}`)) return true;
        noeud = noeud.parentElement;
      }
      return false;
    };

    const chemin = (el) => {
      const morceaux = [];
      let noeud = el;
      while (noeud && noeud.nodeType === 1 && morceaux.length < 5) {
        const classe = [...noeud.classList].slice(0, 2).join('.');
        morceaux.unshift(noeud.tagName.toLowerCase() + (classe ? `.${classe}` : ''));
        noeud = noeud.parentElement;
      }
      return morceaux.join(' > ');
    };

    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // Élément hors fenêtre à droite (tolérance 1 px pour les arrondis).
      if (r.right > largeur + 1 && !dansConteneurDefilant(el)) {
        debordements.push({ selecteur: chemin(el), gauche: Math.round(r.left), droite: Math.round(r.right) });
        if (debordements.length >= 12) break;
      }
    }

    if (largeur <= 768) {
      for (const el of document.querySelectorAll('button, a, select, input[type="checkbox"]')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.height < 40 || r.width < 24) {
          ciblesPetites.push({ selecteur: chemin(el), largeur: Math.round(r.width), hauteur: Math.round(r.height) });
          if (ciblesPetites.length >= 8) break;
        }
      }
    }

    return {
      largeur,
      defilementPage: document.documentElement.scrollWidth,
      debordements,
      ciblesPetites,
    };
  });
}

async function principal() {
  mkdirSync(`${SORTIE}/captures`, { recursive: true });

  // 1. Un compte de test : la session est réutilisée par tous les contextes.
  const inscription = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(COMPTE),
  });
  if (!inscription.ok) {
    throw new Error(`inscription impossible (${inscription.status}) : ${await inscription.text()}`);
  }
  const cookies = (inscription.headers.getSetCookie?.() ?? []).map((c) => {
    const [paire] = c.split(';');
    const i = paire.indexOf('=');
    return { name: paire.slice(0, i), value: paire.slice(i + 1), domain: new URL(BASE).hostname, path: '/' };
  });

  const navigateur = await chromium.launch();
  const resultats = [];
  const erreurs = [];

  for (const largeur of LARGEURS) {
    const contexte = await navigateur.newContext({
      viewport: { width: largeur, height: largeur <= 480 ? 780 : 900 },
      hasTouch: largeur <= 768,
      isMobile: largeur <= 480,
      deviceScaleFactor: 1,
    });
    await contexte.addCookies(cookies);
    const page = await contexte.newPage();

    page.on('pageerror', (e) => erreurs.push({ largeur, type: 'pageerror', message: String(e).slice(0, 300) }));
    page.on('console', (m) => {
      if (m.type() === 'error') erreurs.push({ largeur, type: 'console', message: m.text().slice(0, 300) });
    });

    for (const [nom, chemin] of PAGES) {
      await page.goto(`${BASE}${chemin}`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(700);
      const mesure = await mesurer(page);
      resultats.push({ id: idUnique(largeur, nom), page: nom, chemin, ...mesure });

      if (CAPTURES.includes(largeur) && PAGES_CAPTURE.has(nom)) {
        await page.screenshot({ path: `${SORTIE}/captures/${nom}-${largeur}.png`, fullPage: true });
      }
    }

    await contexte.close();
  }

  await navigateur.close();

  const problemes = resultats.filter((r) => r.defilementPage > r.largeur + 1 || r.debordements.length > 0);
  const cibles = resultats.filter((r) => r.ciblesPetites.length > 0);

  const rapport = {
    base: BASE,
    largeurs: LARGEURS,
    pages: PAGES.map(([nom, chemin]) => ({ nom, chemin })),
    total: resultats.length,
    problemes,
    cibles,
    erreurs,
    resultats,
  };
  writeFileSync(`${SORTIE}/rapport.json`, JSON.stringify(rapport, null, 2));

  console.log(`\n${resultats.length} mesures · ${problemes.length} page(s) en débordement · ${erreurs.length} erreur(s) JS · ${cibles.length} page(s) avec petites cibles`);
  for (const p of problemes) {
    console.log(`\n✗ ${p.id} (${p.chemin}) — page ${p.defilementPage}px pour ${p.largeur}px visibles`);
    for (const d of p.debordements.slice(0, 6)) {
      console.log(`    ${d.selecteur} → ${d.gauche}…${d.droite}px`);
    }
  }
  for (const e of erreurs.slice(0, 10)) {
    console.log(`! ${e.largeur}px ${e.type} : ${e.message}`);
  }
  if (cibles.length) {
    console.log('\nCibles tactiles < 40 px (mobile uniquement) :');
    for (const c of cibles.slice(0, 12)) {
      console.log(`    ${c.id} : ${c.ciblesPetites.map((x) => `${x.selecteur} (${x.largeur}×${x.hauteur})`).join(', ')}`);
    }
  }
  console.log(`\nRapport : ${SORTIE}/rapport.json · captures : ${SORTIE}/captures/`);
}

principal().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
