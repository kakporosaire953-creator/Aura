#!/usr/bin/env node
/**
 * Diagnostic de l'authentification sur un site déployé — LECTURE SEULE.
 *
 *   node scripts/diagnostic-prod.cjs https://votre-site.exemple
 *
 * Ce script ne crée aucun compte, ne se connecte à rien, n'envoie aucun
 * e-mail et ne demande aucun secret. Il interroge les routes publiques avec
 * des valeurs volontairement invalides : le code HTTP renvoyé suffit à dire
 * si le stockage et l'envoi d'e-mails sont configurés sur l'environnement.
 *
 * Chaque sonde est expliquée : un 400 attendu n'est pas une erreur, c'est
 * la preuve que la route fonctionne sans effet de bord.
 *
 * Codes de sortie : 0 = tout est en place, 1 = un point bloque, 2 = usage.
 */
'use strict';

const base = (process.argv[2] ?? '').trim().replace(/\/+$/, '');
if (!base) {
  console.error('Usage : node scripts/diagnostic-prod.cjs https://votre-site.exemple');
  process.exit(2);
}
if (!/^https?:\/\//.test(base)) {
  console.error('Adresse invalide : indiquez une URL complète (https://…).');
  process.exit(2);
}

const DELAI_MS = 15000;
const resultats = [];
let bloque = false;

function ligne(etat, titre, detail) {
  const symbole = etat === 'ok' ? '✓' : etat === 'attention' ? '!' : '✗';
  const couleur = etat === 'ok' ? '\x1b[32m' : etat === 'attention' ? '\x1b[33m' : '\x1b[31m';
  console.log(`${couleur}${symbole}\x1b[0m ${titre}`);
  if (detail) console.log(`   ${detail}`);
  resultats.push({ etat, titre, detail });
  if (etat === 'echec') bloque = true;
}

async function appel(chemin, options = {}) {
  return fetch(base + chemin, {
    ...options,
    redirect: 'manual',
    signal: AbortSignal.timeout(DELAI_MS),
    headers: {
      'User-Agent': 'AURA-diagnostic/1.0',
      ...(options.corps ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
    body: options.corps ? JSON.stringify(options.corps) : undefined,
  });
}

async function json(reponse) {
  try {
    return await reponse.json();
  } catch {
    return {};
  }
}

/** Adresse jamais utilisée : aucune chance de tomber sur un vrai compte. */
const adresseTest = `diagnostic-${Date.now()}-${Math.floor(Math.random() * 1e6)}@aura-diagnostic.invalid`;

async function principal() {
  console.log(`\nDiagnostic d'authentification — ${base}\n${'─'.repeat(64)}`);

  /* 1. Le site répond-il ? */
  let page;
  try {
    page = await appel('/login');
  } catch (e) {
    ligne('echec', 'Le site est injoignable', e instanceof Error ? e.message : String(e));
    return conclure();
  }
  const html = await page.text();

  if (page.status === 401 || page.status === 403) {
    ligne(
      'echec',
      `La page de connexion est protégée (HTTP ${page.status})`,
      'Protection de déploiement Vercel activée ? Le navigateur la franchit, pas un visiteur normal : désactivez-la pour le domaine public.',
    );
    return conclure();
  }
  if (page.status !== 200) {
    ligne('echec', `La page /login ne se charge pas (HTTP ${page.status})`);
    return conclure();
  }
  if (!/<div id="root"|<script/i.test(html)) {
    ligne('attention', 'La réponse de /login ne ressemble pas à l’application', 'Vérifiez que le domaine pointe bien sur le projet AURA.');
  } else {
    ligne('ok', 'La page /login est servie (HTTP 200)');
  }

  const csp = page.headers.get('content-security-policy');
  if (csp) {
    ligne('ok', 'En-tête CSP présent', `${csp.slice(0, 90)}${csp.length > 90 ? '…' : ''}`);
  } else {
    ligne('attention', 'Aucun en-tête CSP sur le document', 'Il n’est posé que par le serveur ou vercel.json — vérifiez la configuration du domaine.');
  }

  /* 2. État déclaré par l'application. */
  const statut = await appel('/api/status');
  const etat = await json(statut);
  if (statut.status !== 200) {
    ligne('echec', `GET /api/status répond ${statut.status}`, 'L’API ne démarre pas sur cet environnement.');
    return conclure();
  }
  const comptesActifs = etat?.features?.accounts === 'live';
  if (comptesActifs) {
    ligne('ok', 'L’application déclare les comptes actifs', 'features.accounts = live');
  } else {
    ligne(
      'echec',
      'L’application déclare les comptes NON configurés',
      etat?.setup?.accounts ??
        'Stockage absent : posez KV_REST_API_URL et KV_REST_API_TOKEN (Vercel KV / Upstash) puis redéployez.',
    );
  }

  /* 3. Le stockage accepte-t-il une écriture potentielle ?
        Mot de passe volontairement trop court : la route répond 400 sans
        créer de compte — sauf si le stockage est indisponible (503). */
  const inscription = await appel('/api/auth/register', {
    method: 'POST',
    corps: { email: adresseTest, password: 'court', nom: '' },
  });
  if (inscription.status === 400) {
    ligne('ok', 'Inscription : la route valide les données', 'HTTP 400 attendu, aucun compte créé');
  } else if (inscription.status === 503) {
    ligne(
      'echec',
      'Inscription refusée : stockage indisponible',
      (await json(inscription)).error ?? 'Configurez Vercel KV, puis redéployez.',
    );
  } else if (inscription.status === 429) {
    ligne('attention', 'Inscription limitée (HTTP 429)', 'Trop de tentatives récentes depuis cette IP — réessayez plus tard.');
  } else {
    ligne('attention', `Inscription : réponse inattendue (HTTP ${inscription.status})`);
  }

  /* 4. La connexion refuse-t-elle proprement ? */
  const connexion = await appel('/api/auth/login', {
    method: 'POST',
    corps: { email: adresseTest, password: 'MotDePasseQuelconque1!' },
  });
  if (connexion.status === 401) {
    ligne('ok', 'Connexion : identifiants inconnus refusés', 'HTTP 401 attendu, message unique (pas d’énumération)');
  } else if (connexion.status === 503) {
    ligne('echec', 'Connexion refusée : stockage indisponible', (await json(connexion)).error ?? '');
  } else if (connexion.status === 400) {
    ligne('attention', 'Connexion : données refusées avant vérification (HTTP 400)');
  } else {
    ligne('attention', `Connexion : réponse inattendue (HTTP ${connexion.status})`);
  }

  /* 5. Les routes de récupération sont-elles déployées ?
        Un jeton bidon doit produire un refus métier (400), pas un 404. */
  const reinit = await appel('/api/auth/reset-password', {
    method: 'POST',
    corps: { token: 'jeton-inexistant-'.padEnd(43, 'x'), password: 'MotDePasseSolide1!' },
  });
  const corpsReinit = await json(reinit);
  if (reinit.status === 400 && corpsReinit.code === 'jeton-invalide') {
    ligne('ok', 'Réinitialisation : route déployée et jeton inconnu refusé');
  } else if (reinit.status === 404) {
    ligne('attention', 'Réinitialisation : route absente', 'Le déploiement ne contient pas la mission 08 — redéployez depuis main.');
  } else if (reinit.status === 503) {
    ligne('attention', 'Réinitialisation : stockage indisponible (HTTP 503)', 'Même cause que ci-dessus : les comptes ne sont pas persistés sur cet environnement.');
  } else {
    ligne('attention', `Réinitialisation : réponse inattendue (HTTP ${reinit.status})`);
  }

  /* 6. L'envoi d'e-mails est-il configuré ?
        Une adresse bien formée mais inexistante : 503 = pas de fournisseur,
        202 = fournisseur configuré (aucun message envoyé, aucun compte). */
  const oubli = await appel('/api/auth/forgot-password', {
    method: 'POST',
    corps: { email: adresseTest, langue: 'fr' },
  });
  const corpsOubli = await json(oubli);
  if (oubli.status === 503 && corpsOubli.code === 'mail-indisponible') {
    ligne(
      'attention',
      'E-mails NON configurés : la récupération répond 503',
      'Posez AURA_MAIL_PROVIDER, AURA_MAIL_API_KEY, AURA_MAIL_FROM et AURA_PUBLIC_ORIGIN. Tant que ce n’est pas fait, aucun lien ne peut partir.',
    );
  } else if (oubli.status === 202) {
    ligne('ok', 'E-mails configurés', 'HTTP 202 (la réponse est identique quelle que soit l’adresse)');
  } else if (oubli.status === 404) {
    ligne('attention', 'Récupération : route absente', 'Déploiement antérieur à la mission 08.');
  } else {
    ligne('attention', `Récupération : réponse inattendue (HTTP ${oubli.status})`);
  }

  conclure();
}

function conclure() {
  console.log(`${'─'.repeat(64)}`);
  const echecs = resultats.filter((r) => r.etat === 'echec').length;
  const attentions = resultats.filter((r) => r.etat === 'attention').length;

  if (echecs === 0 && attentions === 0) {
    console.log('✓ Tout est en place : comptes, connexion, récupération et e-mails.\n');
    process.exit(0);
  }
  if (echecs > 0) {
    console.log(`${echecs} point(s) bloquant(s), ${attentions} avertissement(s).`);
    console.log('Causes les plus fréquentes, dans cet ordre :');
    console.log('  1. Stockage non configuré → Vercel KV (KV_REST_API_URL / KV_REST_API_TOKEN) puis redéploiement.');
    console.log('  2. Fournisseur d’e-mails absent → 503 attendu sur la récupération, comptes pourtant utilisables.');
    console.log('  3. Protection de déploiement Vercel active sur le domaine public.');
    console.log('  4. Variables ajoutées après le dernier déploiement → relancer un déploiement.\n');
    process.exit(1);
  }
  console.log(`${attentions} avertissement(s), aucun blocage.\n`);
  process.exit(0);
}

principal().catch((e) => {
  console.error('\nDiagnostic interrompu :', e instanceof Error ? e.message : e);
  process.exit(1);
});
