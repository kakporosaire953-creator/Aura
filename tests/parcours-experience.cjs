/**
 * Audit responsive + captures « AVANT/APRÈS » (mission expérience 008).
 *
 * Usage : node tests/parcours-experience.cjs [avant|apres]
 *   - teste le débordement horizontal sur toutes les routes × largeurs cibles ;
 *   - vérifie menu mobile, Escape, sélecteur FR/EN, galerie mobile, tarifs,
 *     documentation, liens factices ;
 *   - produit les captures dans /home/user/audit-captures/experience-008/<phase>/.
 */
const fs = require('node:fs');
const path = require('node:path');
const chromium = require('@sparticuz/chromium').default;
const puppeteer = require('puppeteer-core');

const PHASE = process.argv[2] || 'avant';
const BASE = process.env.AURA_BASE || 'http://127.0.0.1:3120';
const SORTIE = path.join('/home/user/audit-captures/experience-008', PHASE);
const LARGEURS = [320, 360, 375, 390, 414, 430, 768, 820, 1024, 1280, 1440, 1920];
const ROUTES_PUBLIQUES = ['/', '/documentation', '/login', '/register'];

const resultats = [];
let echecs = 0;
const ok = (n, c, d = '') => {
  resultats.push({ nom: n, ok: Boolean(c), detail: d });
  if (!c) echecs++;
  console.log(`${c ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`);
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Navigation résiliente : un rechargement complet peut être lent (Vite). */
async function aller(page, url) {
  for (let essai = 0; essai < 3; essai++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      return;
    } catch (e) {
      if (essai === 2) throw e;
      await pause(800);
    }
  }
}

(async () => {
  fs.mkdirSync(SORTIE, { recursive: true });
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: 'shell',
    env: { ...process.env, LD_LIBRARY_PATH: '/tmp/al2023/lib' },
  });
  const page = await browser.newPage();
  // Mode réel forcé avant le premier rendu. La langue n'est PAS écrasée :
  // la préférence de l'utilisateur doit survivre aux navigations.
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('aura_simulation', '0');
      sessionStorage.setItem('aura_intro_v1', 'ok');
      if (!localStorage.getItem('aura_lang')) localStorage.setItem('aura_lang', 'fr');
    } catch (e) {}
  });
  await page.setRequestInterception(true);
  page.on('request', (r) => (r.url().startsWith(BASE) || r.url().startsWith('data:') || r.url().startsWith('blob:') ? r.continue() : r.abort()));
  const erreurs = [];
  page.on('pageerror', (e) => {
    const m = String(e.message);
    if (/WebSocket closed without opened/.test(m)) return;
    erreurs.push(m);
  });

  /* ── 1. Matrice débordement horizontal : routes × largeurs ── */
  const debordements = [];
  for (const route of ROUTES_PUBLIQUES) {
    for (const l of LARGEURS) {
      await page.setViewport({ width: l, height: 900 });
      await aller(page, BASE + route);
      await pause(350);
      const m = await page.evaluate(() => {
        const doc = document.scrollingElement;
        const large = doc.scrollWidth - doc.clientWidth;
        // Élément le plus à droite (hors éléments décoratifs connus)
        let coupable = '';
        if (large > 2) {
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            if (r.right > doc.clientWidth + 2 && r.width > 8 && r.height > 8) {
              const s = getComputedStyle(el);
              if (s.position === 'fixed' && s.opacity === '0') continue;
              coupable = `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} (right=${Math.round(r.right)})`;
              break;
            }
          }
        }
        return { large, coupable };
      });
      if (m.large > 2) {
        debordements.push(`${route} @${l}px : +${m.large}px ${m.coupable}`);
        ok(`débordement ${route} @${l}px`, false, `+${m.large}px ${m.coupable}`);
      }
    }
  }
  ok(
    `matrice débordement (${ROUTES_PUBLIQUES.length} routes × ${LARGEURS.length} largeurs)`,
    debordements.length === 0,
    debordements.length ? `${debordements.length} cas` : 'aucun',
  );

  /* ── 2. Captures principales ── */
  const capturer = async (route, l, h, nom, action) => {
    await page.setViewport({ width: l, height: h });
    await aller(page, BASE + route);
    await pause(1700);
    if (action) await action();
    await page.screenshot({ path: path.join(SORTIE, `${nom}.png`) });
  };
  await capturer('/', 1440, 900, 'accueil-desktop');
  await capturer('/', 390, 844, 'accueil-mobile');
  await capturer('/documentation', 1440, 900, 'documentation');
  await capturer('/login', 390, 844, 'connexion-mobile');
  await capturer('/register', 390, 844, 'inscription-mobile');

  // Galerie : capture de la section desktop + mobile
  for (const [l, h, nom] of [[1440, 900, 'galerie-desktop'], [390, 844, 'galerie-mobile']]) {
    await page.setViewport({ width: l, height: h });
    await aller(page, BASE + '/');
    await pause(600);
    await page.evaluate(() => document.querySelector('#galerie')?.scrollIntoView());
    await pause(1200);
    await page.screenshot({ path: path.join(SORTIE, `${nom}.png`) });
  }
  // Tarifs
  await page.setViewport({ width: 1440, height: 900 });
  await aller(page, BASE + '/');
  await pause(600);
  await page.evaluate(() => document.querySelector('#tarifs')?.scrollIntoView());
  await pause(1000);
  await page.screenshot({ path: path.join(SORTIE, 'tarifs-desktop.png') });
  await page.setViewport({ width: 390, height: 844 });
  await aller(page, BASE + '/');
  await pause(600);
  await page.evaluate(() => document.querySelector('#tarifs')?.scrollIntoView());
  await pause(1000);
  await page.screenshot({ path: path.join(SORTIE, 'tarifs-mobile.png') });

  /* ── 3. Menu mobile : ouverture, Escape, sélecteur FR/EN dans le menu ── */
  await page.setViewport({ width: 390, height: 844 });
  await aller(page, BASE + '/');
  await pause(600);
  const burger = await page.$('.nav-burger');
  ok('burger mobile présent', Boolean(burger));
  if (burger) {
    await burger.click();
    await pause(500);
    const etatOuvert = await page.evaluate(() => {
      const menu = document.querySelector('.nav-mobile');
      return {
        ouvert: menu?.classList.contains('ouvert') ?? false,
        visible: menu ? getComputedStyle(menu).display !== 'none' : false,
        langueDansMenu: Boolean(menu?.querySelector('.bascule-langue')),
        hauteurMenu: menu?.getBoundingClientRect().height ?? 0,
      };
    });
    ok('menu mobile s’ouvre', etatOuvert.ouvert && etatOuvert.visible);
    ok('sélecteur FR/EN présent dans le menu mobile', etatOuvert.langueDansMenu);
    await page.screenshot({ path: path.join(SORTIE, 'navbar-mobile-ouverte.png') });
    await page.keyboard.press('Escape');
    await pause(400);
    const etatFerme = await page.evaluate(() =>
      document.querySelector('.nav-mobile')?.classList.contains('ouvert') ?? false,
    );
    ok('Escape ferme le menu', !etatFerme);
    // Re-ouvrir, sélectionner une destination → fermeture
    await burger.click();
    await pause(400);
    const lien = await page.$('.nav-mobile a[href="/documentation"]');
    if (lien) {
      await lien.click();
      await pause(600);
      const fermeApresNav = await page.evaluate(() =>
        document.querySelector('.nav-mobile')?.classList.contains('ouvert') ?? true,
      );
      ok('sélection d’une destination ferme le menu', !fermeApresNav);
    }
  }

  /* ── 4. Sélecteur FR/EN : dans le menu mobile, traduit, préférence gardée ── */
  await page.setViewport({ width: 390, height: 844 });
  await aller(page, BASE + '/');
  await pause(500);
  // Ouvrir le menu mobile puis basculer en anglais DEPUIS le menu.
  const burgerLangue = await page.$('.nav-burger');
  if (burgerLangue) {
    await burgerLangue.click();
    await pause(450);
  }
  const enMenu = await page.$('.nav-mobile .bascule-langue button:nth-of-type(2)');
  if (enMenu) {
    await enMenu.click();
    await pause(700);
    const etatEn = await page.evaluate(() => ({
      path: location.pathname,
      titre: document.title,
      texte: document.body.textContent ?? '',
      langue: localStorage.getItem('aura_lang'),
    }));
    ok('FR/EN depuis le menu mobile : traduction appliquée', /Get started|Start/i.test(etatEn.texte) || etatEn.langue === 'en', etatEn.titre);
    ok('FR/EN : page courante préservée', etatEn.path === '/');
    ok('FR/EN : mélange FR/EN absent', !(/Commencer/.test(etatEn.texte) && /Get started/.test(etatEn.texte)));
    ok('FR/EN : préférence enregistrée', etatEn.langue === 'en', String(etatEn.langue));
    await page.screenshot({ path: path.join(SORTIE, 'navbar-mobile-anglais.png') });
    // Rechargement : la préférence doit survivre.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await pause(700);
    const apresRechargement = await page.evaluate(() => ({
      langue: localStorage.getItem('aura_lang'),
      texte: document.body.textContent ?? '',
    }));
    ok(
      'FR/EN : préférence conservée après rechargement',
      apresRechargement.langue === 'en' && !/Commencer/.test(apresRechargement.texte),
      String(apresRechargement.langue),
    );
    // Retour au français (depuis le menu).
    const burgerRetour = await page.$('.nav-burger');
    if (burgerRetour) {
      await burgerRetour.click();
      await pause(400);
    }
    const frMenu = await page.$('.nav-mobile .bascule-langue button:nth-of-type(1)');
    if (frMenu) {
      await frMenu.click();
      await pause(500);
    }
  } else {
    ok('FR/EN : sélecteur accessible dans le menu mobile', false, 'introuvable');
  }

  // Desktop : le sélecteur reste présent dans la barre.
  await page.setViewport({ width: 1440, height: 900 });
  await aller(page, BASE + '/');
  await pause(500);
  const langueDesktop = await page.evaluate(() => {
    const b = document.querySelector('.nav-cta .bascule-langue');
    if (!b) return false;
    const r = b.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(b).display !== 'none';
  });
  ok('FR/EN : sélecteur visible dans la barre desktop', langueDesktop);

  /* ── 5. Galerie mobile : animation défilante fonctionnelle ── */
  await page.setViewport({ width: 390, height: 844 });
  await aller(page, BASE + '/');
  await pause(700);
  const galerie = await page.evaluate(() => {
    const piste = document.querySelector('.galerie-piste');
    if (!piste) return { existe: false };
    const s = getComputedStyle(piste);
    return {
      existe: true,
      defilable: piste.scrollWidth > piste.clientWidth,
      overflowX: s.overflowX,
      snap: s.scrollSnapType,
    };
  });
  ok('galerie mobile : contenu défilable présent', galerie.existe && galerie.defilable, JSON.stringify(galerie));

  /* ── 6. Tarifs : montants exacts fournis par le propriétaire ── */
  await page.setViewport({ width: 1440, height: 900 });
  await aller(page, BASE + '/');
  await pause(500);
  const tarifs = await page.evaluate(() => document.querySelector('#tarifs')?.textContent ?? '');
  ok('tarifs : 1 500 FCFA/mois affiché', /1\s?500\s*FCFA/.test(tarifs));
  ok('tarifs : 500 FCFA/mois affiché', /(^|[^1\d])500\s*FCFA/.test(tarifs));
  ok('tarifs : 20 000 FCFA/an affiché', /20\s?000\s*FCFA/.test(tarifs));
  ok('tarifs : aucun « Bientôt annoncé »', !/Bient.t annonc/.test(tarifs));

  /* ── 7. Documentation : plus de « En rédaction » / « À venir » ── */
  await aller(page, BASE + '/documentation');
  await pause(500);
  const docs = await page.evaluate(() => document.body.textContent ?? '');
  ok('documentation : aucun contenu masqué par « En rédaction »', !/En r.daction/i.test(docs));
  ok('documentation : aucun « À venir »', !/ venir/i.test(docs));

  /* ── 8. Pages applicatives : chargement sans débordement ── */
  const email = `exp-${Date.now()}@test.dev`;
  await page.setViewport({ width: 390, height: 844 });
  await aller(page, BASE + '/register');
  await pause(700);
  const champs = await page.$$('.form-champ');
  if (champs.length >= 3) {
    await champs[0].type('Audit');
    await champs[champs.length - 2].type(email);
    await champs[champs.length - 1].type('motdepasse123');
    await page.click('button[type=submit]');
    await page.waitForFunction(() => location.pathname === '/app', { timeout: 15000 });
    for (const [route, nom] of [
      ['/app', 'workspace-mobile'],
      ['/chat', 'assistant-mobile'],
      ['/projets', 'projets-mobile'],
      ['/missions', 'missions-mobile'],
      ['/explore', 'explorer-mobile'],
      ['/studio', 'studio-mobile'],
      ['/historique', 'historique-mobile'],
      ['/parametres', 'parametres-mobile'],
    ]) {
      await aller(page, BASE + route);
      await pause(600);
      const debord = await page.evaluate(() => {
        const d = document.scrollingElement;
        return d.scrollWidth - d.clientWidth;
      });
      ok(`page applicative ${route} utilisable sur mobile`, debord <= 2, `${debord}px de débordement`);
      await page.screenshot({ path: path.join(SORTIE, `${nom}.png`) });
    }
    // Desktop : workspace + assistant
    await page.setViewport({ width: 1440, height: 900 });
    for (const [route, nom] of [['/app', 'workspace-desktop'], ['/chat', 'assistant-desktop']]) {
      await aller(page, BASE + route);
      await pause(600);
      await page.screenshot({ path: path.join(SORTIE, `${nom}.png`) });
    }
  } else {
    ok('inscription d’audit (pages applicatives)', false, 'formulaire inattendu');
  }

  /* ── 9. Erreurs JS ── */
  ok('aucune erreur JS sur les pages publiques', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

  await browser.close();
  fs.writeFileSync(path.join(SORTIE, 'resultats.json'), JSON.stringify({ date: new Date().toISOString(), phase: PHASE, resultats, debordements }, null, 2));
  console.log(`\n${resultats.length - echecs}/${resultats.length} vérifications OK — captures dans ${SORTIE}`);
  process.exit(echecs > 0 ? 1 : 0);
})().catch((e) => {
  console.error('ÉCHEC:', e);
  process.exit(1);
});
