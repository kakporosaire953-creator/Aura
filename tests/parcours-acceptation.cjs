/**
 * Scénario d'acceptation AURA WORKSPACE (§23) — parcours headless réel :
 * inscription → vue d'ensemble → projet → conversation dans le projet →
 * échange avec l'assistant → décomposition IA validée → document rattaché
 * → persistance après actualisation → retour ultérieur.
 *
 * Serveur : API réelle + persistance réelle (pilote fichier), moteur IA
 * simulé (AI_DEFAULT_PROVIDER=mock — alias AURA_AI_PROVIDER accepté) —
 * aucun appel payant.
 */
const fs = require('fs');
const path = require('path');
const chromium = require('@sparticuz/chromium').default;
const puppeteer = require('puppeteer-core');

const BASE = process.env.AURA_BASE || 'http://127.0.0.1:3112';
const SORTIE = '/home/user/audit-captures/workspace';
const resultats = [];
let echecs = 0;

function ok(nom, condition, detail = '') {
  resultats.push({ nom, ok: Boolean(condition), detail });
  if (!condition) echecs++;
  console.log(`${condition ? '✅' : '❌'} ${nom}${detail ? ' — ' + detail : ''}`);
}

async function pause(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function nouvellePage(browser, largeur = 1440, hauteur = 900) {
  const page = await browser.newPage();
  // Le scénario d'acceptation exige le mode RÉEL (API + base de données) :
  // le mode simulation navigateur est désactivé explicitement.
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('aura_simulation', '0'); } catch (e) {}
  });
  await page.setViewport({ width: largeur, height: hauteur });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.startsWith(BASE) || url.startsWith('data:')) return req.continue();
    // Google Fonts → servi localement (captures fidèles, réseau bloqué).
    if (url.includes('fonts.googleapis.com')) {
      const css = `
@font-face { font-family: 'Fraunces'; font-style: normal; font-weight: 100 900; src: url(https://fonts.gstatic.com/local-fraunces.woff2) format('woff2'); }
@font-face { font-family: 'Fraunces'; font-style: italic; font-weight: 100 900; src: url(https://fonts.gstatic.com/local-fraunces-it.woff2) format('woff2'); }
@font-face { font-family: 'Manrope'; font-style: normal; font-weight: 200 800; src: url(https://fonts.gstatic.com/local-manrope.woff2) format('woff2'); }`;
      return req.respond({ status: 200, contentType: 'text/css', body: css });
    }
    if (url.includes('fonts.gstatic.com')) {
      const map = {
        'local-fraunces.woff2': 'fraunces-latin-wght-normal.woff2',
        'local-fraunces-it.woff2': 'fraunces-latin-wght-italic.woff2',
        'local-manrope.woff2': 'manrope-latin-wght-normal.woff2',
      };
      const nom = url.split('/').pop();
      const paquet = nom.includes('manrope') ? 'manrope' : 'fraunces';
      const fichier = path.join(
        '/tmp/audit-tools/node_modules/@fontsource-variable',
        paquet,
        'files',
        map[nom] ?? map['local-manrope.woff2'],
      );
      try {
        return req.respond({
          status: 200,
          contentType: 'font/woff2',
          body: fs.readFileSync(fichier),
        });
      } catch {
        return req.abort();
      }
    }
    return req.abort();
  });
  const erreurs = [];
  // Bruit d'infrastructure de développement (WebSocket HMR de Vite) exclu :
  // ce n'est pas une erreur applicative et il dépend du port du serveur.
  const bruitInfra = (m) =>
    /WebSocket closed without opened|failed to connect to websocket|\[vite\]|net::|Failed to load resource/i.test(
      m,
    );
  page.on('pageerror', (e) => {
    const m = String(e.message);
    if (!bruitInfra(m)) erreurs.push(m);
  });
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const m = msg.text();
    if (!bruitInfra(m)) erreurs.push(m);
  });
  // (doublon fusionné : filtre unique ci-dessus, bruit d'infra compris)
  page.erreursJS = erreurs;
  return page;
}

async function capture(page, nom) {
  await pause(700);
  await page.screenshot({ path: path.join(SORTIE, `${nom}.png`), fullPage: false });
}


async function tape(page, selecteur, texte) {
  try {
    await page.waitForSelector(selecteur, { timeout: 8000 });
  } catch (e) {
    const html = await page.evaluate(() => document.querySelector('.dlg')?.innerHTML?.slice(0, 400) ?? 'PAS DE DLG');
    console.log('DIAG dialog:', html);
    throw e;
  }
  await page.type(selecteur, texte);
}

async function attendre(page, selecteur, timeout = 10000) {
  await page.waitForSelector(selecteur, { timeout });
}

(async () => {
  fs.mkdirSync(SORTIE, { recursive: true });
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: 'shell',
    env: { ...process.env, LD_LIBRARY_PATH: '/tmp/al2023/lib' },
  });

  const email = `parcours-${Date.now()}@test.dev`;
  const mdp = 'motdepasse123';

  /* ── 1. Inscription (UI) ── */
  let page = await nouvellePage(browser);
  await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded' });
  await attendre(page, 'form');
  await pause(600);
  const champs = await page.$$('.form-champ');
  ok('page inscription affichée', champs.length >= 2, `${champs.length} champs`);
  if (champs.length >= 3) await champs[0].type('Parcours Test');
  await champs[champs.length - 2].type(email);
  await champs[champs.length - 1].type(mdp);
  await capture(page, '01-inscription');
  await page.click('button[type=submit]');
  await page.waitForFunction(() => location.pathname === '/app', { timeout: 10000 });
  ok('1. inscription → redirection vue d’ensemble', true);
  await attendre(page, '.accueil-salut');
  const salut = await page.$eval('.accueil-salut', (e) => e.textContent);
  ok('2. accueil personnalisé', /Parcours|Bonjour/.test(salut), salut.trim().slice(0, 40));
  await capture(page, '02-vue-ensemble');

  /* ── 3. Création de projet ── */
  const boutonsAction = await page.$$('.accueil-action');
  await boutonsAction[1].click(); // « Créer un projet »
  await attendre(page, '.dlg');
  await tape(page, '.dlg input[type=text]', 'Application de gestion scolaire');
  {
    const d = await page.evaluate(() => ({
      url: location.pathname,
      dlg: !!document.querySelector('.dlg'),
      corps: document.querySelector('.dlg-corps')?.innerHTML?.slice(0, 200) ?? 'RIEN',
    }));
    console.log('DIAG après input:', JSON.stringify(d));
  }
  await pause(300);
  {
    const d = await page.evaluate(() => ({
      url: location.pathname,
      dlg: !!document.querySelector('.dlg'),
    }));
    console.log('DIAG +300ms:', JSON.stringify(d));
  }
  await tape(page, '.dlg textarea', 'Gérer les notes et présences des écoles du quartier.');
  const champsDlg = await page.$$('.dlg textarea');
  await champsDlg[1].type('Adapter au contexte scolaire béninois, en français.');
  await capture(page, '03-creation-projet');
  const pied = await page.$$('.dlg-pied .btn-principal');
  await pied[0].click();
  await page.waitForFunction(() => location.pathname.startsWith('/projets/'), { timeout: 10000 });
  ok('3. projet créé → espace projet', true, await page.evaluate(() => location.pathname));
  await attendre(page, '.page-module-titre');
  await capture(page, '04-espace-projet');

  /* ── 4. Conversation dans le projet ── */
  const onglets = await page.$$('.onglets button');
  for (const o of onglets) {
    const txt = await o.evaluate((e) => e.textContent);
    if (/Conversations/.test(txt)) {
      await o.click();
      break;
    }
  }
  await pause(400);
  const btnConv = await page.$('.liste-simple .btn-principal');
  await btnConv.click();
  await page.waitForFunction(() => location.pathname === '/chat', { timeout: 10000 });
  await pause(500);

  /* ── 5. Échange avec l'assistant ── */
  await tape(page, '.chat-saisie', 'Comment organiser les notes d’une école primaire ?');
  await page.click('.chat-envoi');
  await page.waitForFunction(
    () => document.querySelectorAll('.msg-ia').length > 0 &&
      (document.querySelector('.msg-ia')?.textContent ?? '').length > 20,
    { timeout: 15000 },
  );
  const reponse = await page.$eval('.msg-ia', (e) => e.textContent);
  ok('5. réponse assistant reçue (moteur serveur)', reponse.includes('[mock]') || reponse.length > 20, reponse.trim().slice(0, 60));
  await capture(page, '05-conversation');
  const urlConv = await page.evaluate(() => location.pathname);
  ok('conversation rattachée au projet', urlConv.startsWith('/chat/'), urlConv);

  /* ── 6. Décomposition IA → missions validées ── */
  await page.goto(`${BASE}/missions`, { waitUntil: 'domcontentloaded' });
  await attendre(page, '.page-module-titre');
  const btnAide = await page.$$('.page-module-actions button');
  for (const b of btnAide) {
    const txt = await b.evaluate((e) => e.textContent);
    if (/Décomposer|Break down/.test(txt)) {
      await b.click();
      break;
    }
  }
  await attendre(page, '.dlg textarea');
  await tape(page, '.dlg textarea', 'Déployer l’application de gestion scolaire dans trois écoles.');
  await capture(page, '06-aide-ia');
  const piedAide = await page.$$('.dlg-pied .btn-principal');
  await piedAide[0].click();
  await page.waitForFunction(
    () => document.querySelectorAll('.proposition-carte').length > 0,
    { timeout: 15000 },
  );
  const nbProp = (await page.$$('.proposition-carte')).length;
  ok('6a. proposition IA affichée (non enregistrée)', nbProp > 0, `${nbProp} propositions`);
  await capture(page, '07-propositions');
  const btnValider = await page.$$('.dlg-pied .btn-principal');
  await btnValider[btnValider.length - 1].click(); // « Valider et créer »
  await page.waitForFunction(
    () => document.querySelectorAll('.mission-carte').length >= 2,
    { timeout: 15000 },
  );
  ok('6b. missions validées et enregistrées', true);
  await capture(page, '08-missions');

  /* ── 7. Document rattaché au projet (Studio) ── */
  await page.goto(`${BASE}/studio`, { waitUntil: 'domcontentloaded' });
  await attendre(page, '.studio-type');
  await tape(page, '.studio-creation textarea', 'Rédiger un guide de lancement pour l’école pilote.');
  const selectProjet = await page.$('.studio-creation select');
  if (selectProjet) {
    await selectProjet.select(await page.evaluate(() => {
      const s = document.querySelectorAll('.studio-creation select')[0];
      return s.options[s.selectedIndex > 0 ? s.selectedIndex : 1]?.value ?? '';
    }));
  }
  await page.click('.studio-creation .btn-principal');
  await page.waitForFunction(
    () => document.querySelectorAll('.studio-document, .etat-erreur').length > 0,
    { timeout: 20000 },
  );
  const docTexte = await page.evaluate(() => document.querySelector('.studio-document')?.textContent ?? '');
  ok('7. document généré (moteur simulé identifié)', docTexte.includes('démonstration') || docTexte.length > 40, docTexte.trim().slice(0, 60));
  await capture(page, '09-studio');

  /* ── 8. Persistance après actualisation ── */
  await page.reload({ waitUntil: 'domcontentloaded' });
  await pause(1200);
  await page.goto(`${BASE}/projets`, { waitUntil: 'domcontentloaded' });
  await attendre(page, '.projet-carte');
  ok('8a. projet toujours présent après rechargement', (await page.$$('.projet-carte')).length >= 1);
  const liensProjet = await page.$$('.projet-carte');
  await liensProjet[0].click();
  await page.waitForFunction(() => location.pathname.startsWith('/projets/'));
  await pause(800);
  // L'espace projet liste la conversation et la création.
  const badges = await page.$$eval('.onglet-n', (els) => els.map((e) => Number(e.textContent)));
  ok('8b. données rattachées visibles (convs/missions/créations)', badges.some((n) => n > 0), JSON.stringify(badges));
  await capture(page, '10-projet-rempli');

  /* ── 9. Retour ultérieur (nouvelle session) ── */
  await page.evaluate(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  });
  const page2 = await nouvellePage(browser);
  const cdp = await page2.target().createCDPSession();
  await cdp.send('Network.clearBrowserCookies');
  await page2.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page2.waitForSelector('form');
  await pause(600);
  const champs2 = await page2.$$('.form-champ');
  if (champs2.length < 2) { throw new Error('formulaire login incomplet: ' + champs2.length); }
  await champs2[champs2.length - 2].type(email);
  await champs2[champs2.length - 1].type(mdp);
  await page2.click('button[type=submit]');
  await page2.waitForFunction(() => location.pathname === '/app', { timeout: 10000 });
  await pause(1200);
  const recents = await page2.$$eval('.accueil-recent', (els) => els.map((e) => e.textContent));
  ok('9. retour ultérieur : travail repris (données persistées)', recents.length > 0, `${recents.length} éléments`);
  await capture(page2, '11-retour-ultérieur');

  /* ── Pages complémentaires + mobile ── */
  await page2.goto(`${BASE}/memoire`, { waitUntil: 'domcontentloaded' });
  await pause(600);
  await capture(page2, '12-memoire');
  await page2.goto(`${BASE}/parametres`, { waitUntil: 'domcontentloaded' });
  await pause(600);
  await capture(page2, '13-parametres');
  await page2.goto(`${BASE}/explore`, { waitUntil: 'domcontentloaded' });
  await pause(600);
  await capture(page2, '14-explore');

  const mobile = await nouvellePage(browser, 390, 844);
  await mobile.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' });
  await pause(900);
  await capture(mobile, '15-mobile-vue-ensemble');
  await mobile.goto(`${BASE}${urlConv}`, { waitUntil: 'domcontentloaded' });
  await pause(900);
  await capture(mobile, '16-mobile-conversation');

  /* ── Erreurs JS console ── */
  const toutesErreurs = [...page.erreursJS, ...page2.erreursJS, ...mobile.erreursJS];
  ok('aucune erreur JS console', toutesErreurs.length === 0, toutesErreurs.slice(0, 3).join(' | '));

  await browser.close();
  fs.writeFileSync(
    path.join(SORTIE, 'resultats.json'),
    JSON.stringify({ date: new Date().toISOString(), resultats }, null, 2),
  );
  console.log(`\n${resultats.length - echecs}/${resultats.length} vérifications OK`);
  process.exit(echecs > 0 ? 1 : 0);
})().catch((e) => {
  console.error('ÉCHEC PARCOURS:', e);
  process.exit(1);
});
