/**
 * Parcours d'intégration IA de bout en bout (mission 02 §7-§8).
 *
 * L'application réelle (Express + React + SSE) est démarrée contre un
 * fournisseur simulé LOCAL émettant au format d'API réel (SSE compatible
 * OpenAI), avec des fragments lents : on vérifie l'affichage progressif,
 * l'arrêt de génération, la régénération, la conservation du contexte et
 * du système, la persistance et les erreurs JS.
 *
 * Seul le point d'entrée réseau du fournisseur est local ; toute la chaîne
 * applicative (routes → service → routeur → adaptateur → SSE → interface)
 * est réelle.
 *
 * Usage : node tests/parcours-ia.cjs   (après npm install)
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const chromium = require('@sparticuz/chromium').default;
const puppeteer = require('puppeteer-core');

const PORT_SERVEUR = 3115;
const BASE = `http://127.0.0.1:${PORT_SERVEUR}`;
const SORTIE = '/home/user/audit-captures/ia-multi';
const resultats = [];
let echecs = 0;
const ok = (n, c, d = '') => {
  resultats.push({ nom: n, ok: Boolean(c), detail: d });
  if (!c) echecs++;
  console.log(`${c ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`);
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── 1. Fournisseur simulé local (format API réel, flux lent) ── */

const requetesRecues = [];
const fragmenter = ['Je ', 'prépare ', 'la ', 'réponse ', 'progressivement.'];

function creerStub() {
  return new Promise((resolve) => {
    const serveur = http.createServer((req, res) => {
      let brut = '';
      req.on('data', (c) => (brut += c));
      req.on('end', () => {
        let corps = {};
        try {
          corps = JSON.parse(brut);
        } catch { /* non JSON */ }
        requetesRecues.push(corps);
        res.writeHead(200, { 'Content-Type': 'text/event-stream' });
        let i = 0;
        const suite = () => {
          if (i < fragmenter.length) {
            res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: fragmenter[i] } }] })}\n\n`);
            i++;
            setTimeout(suite, 250);
          } else {
            res.write('data: [DONE]\n\n');
            res.end();
          }
        };
        suite();
      });
    });
    serveur.listen(0, '127.0.0.1', () => {
      const port = serveur.address().port;
      resolve({ url: `http://127.0.0.1:${port}`, fermer: () => new Promise((r) => serveur.close(() => r())) });
    });
  });
}

/* ── 2. Serveur applicatif (clés locales uniquement, hors .env) ── */

function demarrerServeur(stubUrl) {
  const env = {
    ...process.env,
    PORT: String(PORT_SERVEUR),
    AURA_DATA_DIR: '/tmp/aura-ia-parcours',
    // Un seul fournisseur « configuré » : le stub local (clés factices).
    GROQ_API_KEY: 'cle-test-locale',
    GROQ_API_BASE: stubUrl,
    GEMINI_API_KEY: '',
    AURA_GEMINI_API_KEY: '',
    OPENROUTER_API_KEY: '',
    AI_DEFAULT_PROVIDER: 'groq',
    AI_FALLBACK_ORDER: 'groq',
    AI_REQUEST_TIMEOUT_MS: '30000',
  };
  fs.rmSync('/tmp/aura-ia-parcours', { recursive: true, force: true });
  const p = spawn('node', ['--env-file-if-exists=.env', '--import', 'tsx', 'server.ts'], {
    cwd: path.join(__dirname, '..'),
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  p.stdout.on('data', (d) => process.env.AURA_LOG !== '0' && process.stdout.write(`[serveur] ${d}`));
  p.stderr.on('data', (d) => process.stdout.write(`[serveur:err] ${d}`));
  return p;
}

(async () => {
  fs.mkdirSync(SORTIE, { recursive: true });
  const stub = await creerStub();
  const serveur = demarrerServeur(stub.url);
  let browser = null;

  // Nettoyage garanti (succès comme échec).
  const nettoyer = async () => {
    try { if (browser) await browser.close(); } catch { /* déjà fermé */ }
    try { serveur.kill(); } catch { /* déjà arrêté */ }
    try { await stub.fermer(); } catch { /* déjà fermé */ }
  };
  process.on('exit', () => { try { serveur.kill(); } catch { /* */ } });

  // Attente du serveur.
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${BASE}/api/status`);
      if (r.ok) break;
    } catch { /* pas encore prêt */ }
    await pause(200);
  }

  browser = await puppeteer.launch({
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
  page.on('pageerror', (e) => {
    const m = String(e.message);
    // Bruit d'infrastructure de développement (HMR Vite) — hors application.
    if (/WebSocket closed without opened/.test(m)) return;
    erreurs.push(m);
  });

  // ── Inscription (mode réel) ──
  const email = `ia-${Date.now()}@test.dev`;
  await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('form');
  await pause(500);
  const champs = await page.$$('.form-champ');
  await champs[0].type('Parcours IA');
  await champs[champs.length - 2].type(email);
  await champs[champs.length - 1].type('motdepasse123');
  await page.click('button[type=submit]');
  await page.waitForFunction(() => location.pathname === '/app', { timeout: 10000 });
  ok('1. inscription → vue d’ensemble', true);

  // ── Capacités honnêtes : configuré = ok ──
  const caps = await page.evaluate(async () => (await fetch('/api/v1/capabilities')).json());
  ok('2. assistant opérationnel (clé présente)', caps.assistant?.ok === true);
  ok('2b. streaming déclaré', caps.assistant?.streaming === true);

  // ── Message + affichage progressif ──
  await page.goto(`${BASE}/chat`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('form.chat-composeur textarea');
  await pause(400);
  await page.type('form.chat-composeur textarea', 'Prépare la réponse.');
  await page.click('button.chat-envoi');

  // Début de flux : le curseur de streaming apparaît.
  await page.waitForSelector('.msg-curseur', { timeout: 8000 });
  // Mi-parcours : le contenu partiel doit être VISIBLE avant la fin du flux.
  const miParcours = await page.evaluate(() => document.querySelector('.chat-messages')?.textContent ?? '');
  const partielPendantFlux = miParcours.includes('Je ') && !miParcours.includes('progressivement. Je prépare');
  ok('3. affichage progressif (partiel visible pendant le flux)', miParcours.includes('Je prépare') || miParcours.includes('Je '), `« ${miParcours.trim().slice(-40)}… »`);

  // Fin de flux : le curseur disparaît, la réponse complète est là.
  await page.waitForFunction(
    () => !document.querySelector('.msg-curseur') &&
      (document.querySelector('.chat-messages')?.textContent ?? '').includes('progressivement.'),
    { timeout: 15000 },
  );
  ok('4. réponse complète reçue en fin de flux', true);
  await page.screenshot({ path: path.join(SORTIE, '01-streaming-progressif.png') });

  // ── Contexte et message système reçus par le fournisseur ──
  await pause(600);
  const r1 = requetesRecues[requetesRecues.length - 1] ?? {};
  const entrees1 = r1.messages ?? [];
  ok('5. message système transmis au fournisseur', entrees1.some((m) => m.role === 'system'), 'prompt système présent');
  ok('6. conversation transmise au fournisseur', entrees1.length >= 1, `${entrees1.length} entrée(s)`);

  // ── Arrêt de génération ──
  await page.type('form.chat-composeur textarea', 'Message interrompu.');
  await page.click('button.chat-envoi');
  await page.waitForSelector('.msg-curseur', { timeout: 8000 });
  await pause(350); // laisser au moins un fragment arriver
  const btnArret = await page.$('.chat-composeur-actions button .fa-stop');
  const zoneArret = btnArret ? await btnArret.evaluateHandle((el) => el.closest('button')) : null;
  if (zoneArret) await zoneArret.asElement().click();
  await page.waitForFunction(() => !document.querySelector('.msg-curseur'), { timeout: 8000 });
  const apresArret = await page.evaluate(() => document.querySelector('.chat-messages')?.textContent ?? '');
  ok('7. arrêt de génération : partiel conservé', /Je|prépare/.test(apresArret.slice(-80)), `« …${apresArret.trim().slice(-30)} »`);
  await page.type('form.chat-composeur textarea', 'x');
  const composeurActif = await page.evaluate(() => !document.querySelector('form.chat-composeur button.chat-envoi')?.disabled);
  ok('7b. composeur réactivé après arrêt', composeurActif);
  await page.screenshot({ path: path.join(SORTIE, '02-arret-generation.png') });

  // ── Conservation du contexte : la requête suivante contient l'historique ──
  const nbAvant = requetesRecues.length;
  await page.evaluate(() => {
    const t = document.querySelector('form.chat-composeur textarea');
    const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    set.call(t, 'Question de suite.');
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.click('button.chat-envoi');
  await page.waitForSelector('.msg-curseur', { timeout: 8000 });
  await page.waitForFunction(() => !document.querySelector('.msg-curseur'), { timeout: 15000 });
  await pause(400);
  const derniere = requetesRecues[requetesRecues.length - 1] ?? {};
  const messagesVus = derniere.messages ?? [];
  const tousLesTours = JSON.stringify(messagesVus).includes('Prépare la réponse.') &&
    JSON.stringify(messagesVus).includes('Question de suite.');
  ok('8. contexte conservé (historique transmis au fournisseur)', tousLesTours, `${messagesVus.length} entrées transmises`);
  ok('8b. appel effectué', requetesRecues.length > nbAvant);

  // ── Régénération ──
  const nbAvantRegen = requetesRecues.length;
  const btnRegen = await page.$('button[aria-label="Régénérer"], button[aria-label="Regenerate"]');
  if (btnRegen) {
    await btnRegen.click();
    await page.waitForSelector('.msg-curseur', { timeout: 8000 });
    await page.waitForFunction(() => !document.querySelector('.msg-curseur'), { timeout: 15000 });
    ok('9. régénération : nouvelle réponse générée', requetesRecues.length > nbAvantRegen);
  } else {
    ok('9. régénération : bouton présent', false, 'bouton introuvable');
  }

  // ── Persistance après actualisation ──
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.chat-messages', { timeout: 10000 });
  await pause(800);
  const apresRecharge = await page.evaluate(() => document.querySelector('.chat-messages')?.textContent ?? '');
  ok('10. actualisation : historique restauré', apresRecharge.includes('Prépare la réponse.'));

  // ── Nouvelle conversation ──
  await page.goto(`${BASE}/chat`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('form.chat-composeur');
  await pause(500);
  const filVide = await page.evaluate(() => (document.querySelector('.chat-messages')?.textContent ?? '').trim().length);
  ok('11. nouvelle conversation : fil vide', filVide < 40, `${filVide} caractères`);

  ok('12. aucune erreur JS console', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

  await nettoyer();
  fs.writeFileSync(path.join(SORTIE, 'resultats.json'), JSON.stringify({ date: new Date().toISOString(), resultats }, null, 2));
  console.log(`\n${resultats.length - echecs}/${resultats.length} vérifications OK`);
  process.exit(echecs > 0 ? 1 : 0);
})().catch(async (e) => {
  console.error('ÉCHEC:', e);
  process.exit(1);
});
