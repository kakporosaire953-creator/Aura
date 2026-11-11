/**
 * Aura — service worker.
 *
 * Règle de base, non négociable : **les données ne sont jamais mises en
 * cache**. Aucune réponse de `/api/*` n'est stockée ni resservie : un compte
 * suspendu, une conversation supprimée ou un jeton expiré doivent être vus
 * immédiatement. Seule la *coque* (HTML, scripts, styles, icônes) est gardée,
 * pour que l'application s'ouvre vite et dise honnêtement « hors ligne »
 * quand le réseau manque.
 *
 * Deux stratégies, et pas une de plus :
 *  - navigation  → réseau d'abord (6 s), puis page en cache, puis `/hors-ligne.html` ;
 *  - fichiers     → cache d'abord (noms hachés par Vite ⇒ jamais périmés),
 *                   réseau sinon.
 *
 * Ce fichier est servi à la racine (`/sw.js`) : sa portée couvre tout le
 * site, sans en-tête `Service-Worker-Allowed` particulier.
 */

const VERSION = 'aura-1';
const COQUE = `aura-coque-${VERSION}`;
const PAGES = `aura-pages-${VERSION}`;
const PAGES_MAX = 12;
const DELAI_RESEAU = 6000;

/** Ce sans quoi l'application ne peut pas démarrer hors ligne. */
const ESSENTIEL = [
  '/',
  '/index.html',
  '/hors-ligne.html',
  '/manifest.webmanifest',
  '/icones/aura-192.png',
  '/icones/aura-512.png',
];

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    (async () => {
      const cache = await caches.open(COQUE);
      // Un par un : un fichier absent ne doit pas annuler tout le cache.
      await Promise.all(
        ESSENTIEL.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined),
        ),
      );
    })(),
  );
});

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    (async () => {
      const noms = await caches.keys();
      await Promise.all(
        noms
          .filter((nom) => nom.startsWith('aura-') && nom !== COQUE && nom !== PAGES)
          .map((nom) => caches.delete(nom)),
      );
      await self.clients.claim();
    })(),
  );
});

/* Une nouvelle version n'est activée que si la page le demande : personne ne
   se fait recharger au milieu d'une phrase. */
self.addEventListener('message', (evenement) => {
  if (evenement.data && evenement.data.type === 'ACTIVER') {
    void self.skipWaiting();
  }
});

function avecDelai(promesse, ms) {
  return new Promise((resoudre, rejeter) => {
    const minuteur = setTimeout(() => rejeter(new Error('delai-depasse')), ms);
    promesse.then(
      (valeur) => {
        clearTimeout(minuteur);
        resoudre(valeur);
      },
      (erreur) => {
        clearTimeout(minuteur);
        rejeter(erreur);
      },
    );
  });
}

async function garderPage(requete, reponse) {
  try {
    const cache = await caches.open(PAGES);
    await cache.put(requete, reponse);
    const cles = await cache.keys();
    for (const cle of cles.slice(0, Math.max(0, cles.length - PAGES_MAX))) {
      await cache.delete(cle);
    }
  } catch {
    /* quota plein ou requête non cachable : sans conséquence */
  }
}

async function naviguer(requete) {
  try {
    const reponse = await avecDelai(fetch(requete), DELAI_RESEAU);
    if (reponse && reponse.ok && reponse.type === 'basic') {
      await garderPage(requete, reponse.clone());
    }
    return reponse;
  } catch {
    const cachePages = await caches.open(PAGES);
    const dejaVu = await cachePages.match(requete);
    if (dejaVu) return dejaVu;
    // Application déjà ouverte auparavant : la coque suffit, les données
    // reviendront du réseau dès qu'il répond.
    const coque =
      (await caches.match('/index.html')) ||
      (await caches.match('/')) ||
      (await caches.match('/app'));
    if (coque) return coque;
    const secours = await caches.match('/hors-ligne.html');
    return secours || Response.error();
  }
}

async function fichierDAbord(requete) {
  const enCache = await caches.match(requete);
  if (enCache) return enCache;
  try {
    const reponse = await fetch(requete);
    if (reponse && reponse.ok && reponse.type === 'basic') {
      const cache = await caches.open(COQUE);
      await cache.put(requete, reponse.clone());
    }
    return reponse;
  } catch (erreur) {
    const secours = await caches.match(requete, { ignoreSearch: true });
    if (secours) return secours;
    throw erreur;
  }
}

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;
  if (requete.method !== 'GET') return;

  const url = new URL(requete.url);
  if (url.origin !== self.location.origin) return;

  // Données, authentification, administration : toujours le réseau, jamais
  // un cache. Une réponse `Set-Cookie` ne doit pas non plus être rejouée.
  if (url.pathname.startsWith('/api/') || url.pathname === '/sw.js') return;

  if (requete.mode === 'navigate') {
    evenement.respondWith(naviguer(requete));
    return;
  }

  const estFichier =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icones/') ||
    /\.(?:css|js|mjs|json|webmanifest|png|jpe?g|svg|gif|webp|avif|woff2?|ttf|otf|mp3|mp4|webm)$/i.test(
      url.pathname,
    );

  if (estFichier) evenement.respondWith(fichierDAbord(requete));
});
