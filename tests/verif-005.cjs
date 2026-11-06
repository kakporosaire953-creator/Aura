/**
 * Vérification des ajouts de la mission 005 :
 *  - suppression de compte (dialogue, confirmation, mot de passe, effacement)
 *  - export Imprimer / PDF du Studio
 */
const fs = require('fs');
const path = require('path');
const chromium = require('@sparticuz/chromium').default;
const puppeteer = require('puppeteer-core');

const BASE = 'http://127.0.0.1:3113';
const SORTIE = '/home/user/audit-captures/workspace-005';
const resultats = [];
let echecs = 0;
const ok = (n, c, d = '') => {
  resultats.push({ nom: n, ok: Boolean(c), detail: d });
  if (!c) echecs++;
  console.log(`${c ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`);
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(SORTIE, { recursive: true });
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: 'shell',
    env: { ...process.env, LD_LIBRARY_PATH: '/tmp/al2023/lib' },
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('aura_simulation', '0'); } catch (e) {}
  });
  await page.setRequestInterception(true);
  page.on('request', (r) => (r.url().startsWith(BASE) || r.url().startsWith('data:') ? r.continue() : r.abort()));
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(String(e.message)));

  // ── Inscription (mode réel) ──
  const email = `suppr-${Date.now()}@test.dev`;
  await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('form');
  await pause(500);
  const champs = await page.$$('.form-champ');
  await champs[0].type('Compte A Supprimer');
  await champs[champs.length - 2].type(email);
  await champs[champs.length - 1].type('motdepasse123');
  await page.click('button[type=submit]');
  await page.waitForFunction(() => location.pathname === '/app', { timeout: 10000 });

  // ── Studio : bouton Imprimer / PDF ──
  await page.goto(`${BASE}/studio`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.studio-type');
  await page.type('.studio-creation textarea', 'Note interne de test');
  await page.click('.studio-creation .btn-principal');
  await page.waitForSelector('.studio-document', { timeout: 20000 });
  await page.evaluate(() => { window.__printAppele = false; window.print = () => { window.__printAppele = true; }; });
  const btns = await page.$$('.studio-apercu-haut button, .studio-apercu-haut a');
  let btnPdf = null;
  for (const b of btns) {
    const txt = await b.evaluate((e) => e.textContent);
    if (/Imprimer|PDF/.test(txt)) btnPdf = b;
  }
  ok('bouton « Imprimer / PDF » présent', Boolean(btnPdf));
  if (btnPdf) {
    await btnPdf.click();
    await pause(300);
    ok('export PDF déclenche window.print()', await page.evaluate(() => window.__printAppele === true));
  }
  await page.screenshot({ path: path.join(SORTIE, '01-studio-pdf.png') });

  // ── Paramètres : zone sensible ──
  await page.goto(`${BASE}/parametres`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.param-section');
  await pause(500);
  const danger = await page.$('.param-danger');
  ok('zone sensible visible dans Paramètres', Boolean(danger));
  await page.screenshot({ path: path.join(SORTIE, '02-params-danger.png') });
  await danger.querySelector ? null : null;
  const btnSuppr = await page.$('.param-danger .btn-danger-simple');
  await btnSuppr.click();
  await page.waitForSelector('.dlg');
  await pause(300);
  ok('dialogue de confirmation affiché', (await page.$$('.dlg .champ')).length === 2);
  await page.screenshot({ path: path.join(SORTIE, '03-dialogue-suppression.png') });

  // Mauvais mot de passe → erreur honnête, compte conservé
  const inputs = await page.$$('.dlg .champ input');
  await inputs[0].type('fauxmotdepasse');
  await inputs[1].type('SUPPRIMER');
  await page.click('.dlg-pied .btn-danger-simple');
  await page.waitForSelector('.form-erreur', { timeout: 8000 });
  ok('mauvais mot de passe refusé (message affiché)', true);
  await page.screenshot({ path: path.join(SORTIE, '04-erreur-mdp.png') });

  // Bon mot de passe → suppression → retour sur la connexion
  await inputs[0].click();
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.type('motdepasse123');
  page.once('dialog', (d) => d.accept());
  await page.click('.dlg-pied .btn-danger-simple');
  try {
    await page.waitForFunction(() => location.pathname === '/login', { timeout: 10000 });
  } catch (e) {
    const diag = await page.evaluate(() => ({
      url: location.pathname,
      err: document.querySelector('.dlg .form-erreur')?.textContent ?? '',
      val: document.querySelectorAll('.dlg input')[0]?.value ?? '',
    }));
    console.log('DIAG:', JSON.stringify(diag));
    throw e;
  }
  await pause(400);
  const infoTxt = await page.evaluate(() => document.querySelector('.form-info')?.textContent ?? '');
  ok('compte supprimé → page de connexion avec message d’état', /supprim/i.test(infoTxt), infoTxt.trim().slice(0, 60));
  await page.screenshot({ path: path.join(SORTIE, '05-compte-supprime.png') });

  // Le compte n'existe plus
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'motdepasse123' }),
  });
  ok('reconnexion impossible (compte effacé)', r.status === 401, `status ${r.status}`);

  ok('aucune erreur JS console', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));
  await browser.close();
  fs.writeFileSync(path.join(SORTIE, 'resultats.json'), JSON.stringify({ date: new Date().toISOString(), resultats }, null, 2));
  console.log(`\n${resultats.length - echecs}/${resultats.length} vérifications OK`);
  process.exit(echecs > 0 ? 1 : 0);
})().catch((e) => {
  console.error('ÉCHEC:', e);
  process.exit(1);
});
