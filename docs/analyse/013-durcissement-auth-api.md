# 013 — Durcissement de l'authentification et de l'API

Date : 2026-11-06 · Branche : `arena/255c4e65-aura` · Base : `b749b588` (main après PR #26)

> Branche imposée par la plateforme. **Aucun commit, aucune fusion, aucun déploiement**
> sans autorisation explicite. Aucune clé d'API, aucun secret, aucune variable de
> production n'a été lue, modifiée ou citée.

## 1. Demande

> « Sécurisation et fiabilisation du système d'authentification existant. »

Huit phases imposées : préparation, limitation de débit, protection des routes frontend,
suppression des simulations dangereuses, gestion des erreurs de stockage, durcissement des
cookies et en-têtes, tests, rapport. Contrainte de fond : **corriger sans reconstruire**,
sans changer de base de données, sans toucher aux comptes existants, sans e-mail, sans
déploiement.

## 2. État Git et vérification des constats de la mission 06

| Point | Constat |
|---|---|
| Commit de départ | `b749b588` — identique à `main` (PR #26 fusionnée) |
| État Git | propre, aucun fichier modifié, aucune branche divergente |
| Branche de travail | `arena/255c4e65-aura` (la branche dédiée de cette session ; aucune autre n'a été créée) |

Les constats de l'audit 06 ont été **re-vérifiés dans le code**, pas recopiés :

| Constat 06 | Vérification | Verdict |
|---|---|---|
| Limitation de débit en mémoire, `req.ip` sans `trust proxy` | `server/api.ts`, `server/v1/middlewares.ts` | **Confirmé** |
| Seule `/app` redirige vers `/login` | `src/App.tsx` l. 69-79 | **Confirmé** |
| Simulation activable en production | `definirSimulation`, bouton de démonstration sur `/login` | **Confirmé** |
| Panne de stockage présentée comme un anonymat | `catch {}` dans `attacherCompte` et `attacherCompteV1` | **Confirmé** |
| Aucun en-tête de sécurité | `vercel.json`, `server.ts` | **Confirmé** |
| Mots de passe en clair dans la simulation | `src/app/simulation.ts` | **Infirmé** — le code retire déjà `motDePasse` à la lecture et ne l'écrit jamais. L'audit 06 se fondait sur une occurrence de la chaîne `motDePasse`, qui est en réalité l'instruction de retrait. Correction consignée ici. |

## 3. Limitation de débit (phase 2)

**Le défaut réel.** `tropDeTentatives` tenait ses compteurs dans une `Map` de processus et
prenait `req.ip` pour clé. Sans `trust proxy`, `req.ip` ne désigne pas le client derrière un
proxy : tous les visiteurs partageaient un même compteur. Deux conséquences : la protection
anti-force brute était inopérante, et 25 tentatives échouées fermaient la plateforme pour
tout le monde pendant dix minutes.

**Ce qui a été fait.**

- `BaseDeDonnees` expose désormais `incr(cle, ttlSecondes)`. Le pilote KV envoie **dans un
  seul pipeline REST** `INCR` puis `EXPIRE … NX` : l'expiration est posée dans la même
  exécution que l'incrément, donc aucune interruption ne peut laisser un compteur sans
  expiration (c'est-à-dire un blocage définitif de la clé), et `NX` empêche qu'une tentative
  tardive rallonge la fenêtre. Repli `INCR` + `TTL` + `EXPIRE` si le point d'entrée
  `/pipeline` n'existe pas. Le pilote fichier compte en mémoire de processus, ce qui suffit
  à un déploiement mono-processus et évite une écriture disque par tentative.
  Détail complet : `docs/architecture/LIMITATION-DEBIT.md`.
- `server/v1/limite.ts` : compteur partagé, repli local **si et seulement si** le stockage
  échoue, jamais d'exception propagée. Une panne de stockage ne bloque donc personne et ne
  casse aucune route.
- `ipClient()` : `req.ip` quand Express l'a résolu, sinon l'entrée **la plus à droite** de
  `x-forwarded-for` (celle que le proxy de la plateforme ajoute lui-même), sinon « inconnu ».
  Une valeur forgée en tête de liste est ignorée ; les formes `1.2.3.4:port` et
  `::ffff:1.2.3.4` sont normalisées. Vérifié de bout en bout par requêtes réelles sur une
  application configurée comme derrière Vercel (un saut) : `6.6.6.6, 203.0.113.7` donne
  `203.0.113.7`, et sans proxy déclaré l'en-tête est ignoré au profit de la socket.
- `configurerConfianceProxy()` (`server/api.ts`) : `trust proxy = 1` **uniquement** si
  `VERCEL` est défini ou `AURA_TRUST_PROXY=1`. En développement et en auto-hébergement
  direct, aucune confiance n'est accordée à un en-tête.
- Clés séparées par portée — `login-ip`, `login-email`, `register-ip`, `register-email`,
  `compte`, `chat` — de sorte qu'un compteur saturé ne ferme jamais les autres routes.
- L'adresse e-mail n'est jamais écrite en clair dans une clé : elle est hachée (SHA-256,
  24 caractères).

| Portée | Plafond | Fenêtre |
|---|---|---|
| Connexion, par IP | 20 | 10 min |
| Connexion, par adresse | 10 | 10 min |
| Inscription, par IP | 30 | 10 min |
| Inscription, par adresse | 10 | 1 h |
| Suppression de compte | 5 | 15 min |
| Chat, par compte | 40 | 5 min |

**Preuves.** Blocage au seuil, indépendance des clés, repli sans exception quand le stockage
est en panne, choix de l'adresse IP, et refus HTTP de la 11ᵉ inscription sur une même
adresse **sans affecter une autre adresse** (tests `auth-durcissement`). Sur un faux serveur
Redis REST exerçant le vrai pilote (tests `limite-kv`) : une seule requête porte `INCR` et
`EXPIRE … NX`, une clé héritée sans TTL est réparée au premier incrément, une fenêtre en
cours n'est pas rallongée, une fenêtre expirée repart de zéro, et le repli pose quand même
l'expiration.

**Comportement de repli, écrit noir sur blanc** (`docs/architecture/LIMITATION-DEBIT.md`) :
le compteur mémoire n'est utilisé que si le stockage est absent ou en panne ; il ne bloque
jamais collectivement, ne fait jamais échouer la route, reste propre à chaque portée, et
reste best-effort par instance pendant la durée de la panne — dégradation assumée et
journalisée.

## 4. Protection des routes frontend (phase 3)

- `src/app/gardes.tsx` : une seule garde, `<RoutePrivee>`, posée au-dessus de
  `WorkspaceLayout`. Les neuf routes privées (`/app`, `/chat`, `/chat/:id`, `/projets`,
  `/projets/:id`, `/historique`, `/explore`, `/studio`, `/missions`, `/memoire`,
  `/parametres`) en héritent sans duplication.
- `src/app/garde-etat.ts` : décision pure et testable — attente, redirection, panne,
  affichage. Une panne **ne déconnecte personne** ; seul un 401 du serveur renvoie vers la
  connexion.
- `src/app/retour.ts` : destination conservée via `state.depuis`, restituée après
  authentification. Refus des URL absolues, des `//…`, des `/\…`, des schémas `javascript:`
  et des retours sur `/login` ou `/register` (pas de redirection ouverte).
- `src/app/session.tsx` : quatre états (`chargement`, `connecte`, `anonyme`,
  `indisponible`) avec motif (`stockage` ou `reseau`). Un 503 du serveur ne devient plus un
  anonymat.
- Interface d'attente et d'indisponibilité : message explicite, bouton « Réessayer » qui
  relance `rafraichir()`, `role="status"` et `aria-live` (aucune icône décorative ajoutée,
  aucun nouveau langage visuel).

La garde ne remplace jamais `authRequise` : le serveur reste seul juge, chaque route `/v1`
étant protégée côté Express.

## 5. Simulation (phase 4)

- `const DEV = import.meta.env?.DEV === true` est évalué à la construction : en production,
  `simulationActivee()` et `simulationDisponible()` renvoient `false` en dur, `definirSimulation()`
  n'écrit plus rien, `ouvrirDemo()` renvoie `false`.
- Le bouton de démonstration de `/login`, la bascule de la barre publique, celle de l'espace
  de travail et la section « Simulation » des paramètres ne sont plus rendus en production.
- `modeSimulationActif(enregistre, dev)` isole la décision pour la tester sans navigateur.
- **Aucun secret** : vérifié par test — le mot de passe saisi n'apparaît jamais dans
  `localStorage`.
- `npm run verif:prod` construit puis inspecte le paquet : les chaînes `aura_simulation` et
  `demo@aura.local` ont **disparu** du JavaScript livré (code mort éliminé par le
  compilateur), la garde reste présente. Preuve en production minifiée : `Xn=!1`,
  `function z(){return!1}`.

## 6. Erreurs de stockage (phase 5)

| Situation | Avant | Maintenant |
|---|---|---|
| Aucune session | 401 `anonyme` | 401 `anonyme` |
| Cookie mort ou session expirée | 401 `anonyme` | 401 **`session-expiree`** |
| Stockage injoignable | 401 `anonyme` (silencieux) | **503 `stockage-indisponible`** |
| Erreur inattendue | requête suspendue (handler asynchrone non capturé) | 500 `interne` |
| Stockage non configuré | 503 | 503 (inchangé) |

- `attacherCompte` et `attacherCompteV1` distinguent désormais les trois causes au lieu de
  tout absorber.
- Tous les gestionnaires asynchrones de `server/api.ts` passent par `asyncRoute` : plus
  aucune promesse rejetée non capturée, plus de requête suspendue.
- Le pilote KV traduit une panne réseau en `Stockage KV indisponible (réseau)` — même famille
  que ses erreurs HTTP, donc même réponse 503.
- Le contrat d'erreur existant est conservé : `{ error, code, champs? }`, codes ajoutés sans
  en renommer aucun.

## 7. Cookies et en-têtes (phase 6)

**Cookie.** `__Host-aura_session` en production (Secure, Path=/, sans `Domain`),
`aura_session` ailleurs. `lireJetonSession()` accepte **les deux noms** : aucune session
ouverte avant ce changement n'est invalidée (vérifié en production locale : 200 avec l'ancien
nom comme avec le nouveau).

**En-têtes du document** (`vercel.json` pour Vercel, `server/en-tetes.ts` pour
l'auto-hébergement, textes rigoureusement identiques) :

| En-tête | Valeur |
|---|---|
| `Content-Security-Policy` | `default-src 'self'` ; scripts et styles du document autorisés en ligne ; polices Google ; `connect-src 'self' https://lottie.host` ; `frame-ancestors 'none'` ; `object-src 'none'` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` — **uniquement** là où le HTTPS est réel (Vercel) |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | caméra, micro, géolocalisation, paiement désactivés |
| `Cross-Origin-Opener-Policy` | `same-origin` |

**En-têtes de l'API** : `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`,
`Cross-Origin-Resource-Policy: same-origin`, `Cache-Control: no-store`.

**Compatibilité vérifiée**, et contrôlée automatiquement par `npm run verif:prod` :

- le document ne référence que `self`, `fonts.googleapis.com` et `fonts.gstatic.com` —
  aucune autre origine ;
- aucune feuille de style livrée ne contient d'`url(https://…)` ;
- la politique de `vercel.json` et celle de `server/en-tetes.ts` sont comparées directive
  par directive (13 directives identiques) : toute divergence fait échouer la vérification ;
- aucune occurrence d'`eval` ni de `new Function`, aucun gestionnaire `on*=` en ligne,
  aucune WebSocket, aucun script tiers ;
- la seule origine distante appelée depuis le code est `lottie.host` (animation d'accueil),
  déclarée dans `connect-src`.

## 8. Tests

| Suite | Contenu | Résultat |
|---|---|---|
| `tests/api.test.ts` (existant) | parcours API : authentification, comptes, projets, missions, mémoire, suppression, observabilité | **18/18** |
| `tests/entrepots.test.ts`, `tests/ai.test.ts` (existants) | persistance, migrations, routeur IA | **43/43** |
| `tests/auth-durcissement.test.ts` (**nouveau**) | destination de retour, décision de garde, provenance de l'adresse derrière proxy, simulation (états, absence de secret), limitation (seuil, isolation, panne, empreinte), sessions et codes, cookie préfixé et hérité, en-têtes | **24/24** |
| `tests/limite-kv.test.ts` (**nouveau**) | vrai pilote KV contre un faux serveur Redis REST : pipeline `INCR` + `EXPIRE NX`, réparation d'une clé sans TTL, absence de rallonge, fenêtre expirée, repli, panne totale | **7/7** |
| `tests/stockage-indisponible.test.ts` (**nouveau**) | KV configuré mais injoignable : 401 sans cookie, 503 avec cookie, 503 sur `/v1`, 503 sur connexion et inscription, limitation toujours active | **5/5** |

Total : **97 tests, 26 suites, 0 échec** (`npm test`). Bases isolées : dossier temporaire
supprimé après exécution, pilote KV pointé vers un port fermé. Aucun compte réel, aucune
écriture en production, aucun envoi.

Vérifications complémentaires exécutées :

| Vérification | Résultat |
|---|---|
| `tsc --noEmit` | aucune erreur |
| `npm run build` | construction réussie (paquet principal 666 ko, 206 ko compressés) |
| `npm run verif:prod` | simulation impossible, **CSP compatible** (6 références du document contrôlées), **13 directives identiques** entre `vercel.json` et le serveur |
| Serveur de développement (HTTP réel) | inscription 201 + cookie `HttpOnly; SameSite=Lax; Path=/` ; `/api/me` 200 ; anonyme 401 ; cookie mort → `session-expiree` ; `/v1/me` anonyme 401 ; `/chat` servi ; déconnexion 204 puis 401 |
| Serveur de production local (`NODE_ENV=production`) | CSP, HSTS absent hors Vercel, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `COOP` ; cookie `__Host-aura_session` **Secure** ; connexion inconnue → 401 (jamais 500) ; ancien et nouveau nom de cookie acceptés |

## 9. Fichiers

**Créés**

| Fichier | Rôle |
|---|---|
| `server/v1/limite.ts` | compteur distribué, repli local, adresse IP, empreinte |
| `server/en-tetes.ts` | politique de sécurité du document, HSTS conditionnel |
| `src/app/gardes.tsx` | garde unique des routes privées |
| `src/app/garde-etat.ts` | décision de garde (pure, testable) |
| `src/app/retour.ts` | destination après connexion, sans redirection ouverte |
| `tests/auth-durcissement.test.ts` | 19 tests |
| `tests/stockage-indisponible.test.ts` | 5 tests |
| `scripts/verifier-prod.cjs` | preuve post-construction : simulation, compatibilité CSP, cohérence des en-têtes |
| `docs/architecture/LIMITATION-DEBIT.md` | atomicité, repli mémoire, provenance de l'adresse |
| `tests/limite-kv.test.ts` | 7 tests sur le vrai pilote KV |

**Modifiés**

| Fichier | Nature |
|---|---|
| `server/db/base.ts` | `incr` dans l'interface et les trois pilotes, erreur réseau KV typée |
| `server/v1/middlewares.ts` | limitation distribuée, états `sessionExpiree` / `stockageIndisponible`, 503 dans `authRequise` |
| `server/api.ts` | confiance proxy, `asyncRoute` partout, 503/401 distincts, en-têtes API, message d'installation sans nom de variable |
| `server/accounts.ts` | `__Host-aura_session`, lecture des deux noms |
| `server/v1/routes.ts` | cookie de suppression via les nouveaux helpers |
| `server.ts` | confiance proxy, en-têtes du document en production |
| `src/App.tsx` | garde au-dessus de l'espace de travail |
| `src/app/session.tsx` | état `indisponible` et motif |
| `src/app/simulation.ts` | verrou de production, décision pure, `ouvrirDemo` booléen |
| `src/app/dictionaries.ts` | messages d'indisponibilité (fr/en) |
| `src/pages/AuthPage.tsx` | destination de retour, démonstration en développement seulement |
| `src/pages/ParametresPage.tsx`, `src/components/layout/SiteChrome.tsx`, `WorkspaceLayout.tsx` | bascules de simulation masquées en production |
| `src/index.css` | présentation de l'état « service indisponible » |
| `vercel.json` | en-têtes de sécurité |
| `README.md`, `docs/api/README.md`, `.env.example` | documentation des codes, des limites, du cookie et de `AURA_TRUST_PROXY` |
| `package.json` | script `verif:prod` |

## 10. Décisions techniques

1. **Compteur dans le stockage existant**, pas de nouvelle dépendance ni de nouveau service :
   `INCR`/`EXPIRE` du pilote KV suffisent et restent atomiques.
2. **Repli local assumé** : si le stockage tombe, la disponibilité prime sur la limitation.
   Le repli est journalisé, jamais silencieux.
3. **Confiance proxy explicite** : `1` saut, et seulement derrière un proxy déclaré. Aucun
   `trust proxy = true`, qui ferait confiance à n'importe quel en-tête.
4. **Deux noms de cookie lus pendant la transition** : durcir sans déconnecter personne.
5. **Une garde, pas neuf** : la décision est extraite dans un module pur, testable sans
   navigateur, et la garde ne duplique pas la logique des pages.
6. **Simulation verrouillée à la compilation**, pas à l'exécution : `import.meta.env.DEV`
   devient `false`, le code d'activation disparaît du paquet livré.
7. **HSTS conditionnel** : jamais en développement, pour ne pas bloquer un `localhost` en
   HTTP pendant des mois.

## 11. Risques résiduels

| # | Risque | Niveau | Commentaire |
|---|---|---|---|
| 1 | CSP non validée dans un navigateur réel | **Moyen** | Vérifiée automatiquement (références du document, CSS, cohérence des directives) et par inventaire du code (aucun `eval`, aucun gestionnaire en ligne). Aucun navigateur disponible dans cet environnement : à confirmer en préproduction après déploiement. |
| 2 | Repli mémoire en cas de panne KV | Faible | Par instance et remis à zéro au démarrage à froid : la limitation est dégradée pendant la panne, jamais désactivée. Comportement assumé et documenté (`docs/architecture/LIMITATION-DEBIT.md`). |
| 3 | Plafonds fixés dans le code | Faible | Un réglage demande une livraison, pas une variable d'environnement. |
| 4 | Compteurs non purgés côté fichier | Faible | Nettoyage à l'usage au-delà de 5 000 entrées ; processus unique en développement. |
| 5 | Pas de vérification d'e-mail ni de récupération de mot de passe | **Élevé (produit)** | Hors périmètre de cette mission, prochaine étape prévue. |
| 6 | Journal d'audit des connexions inexistant | Moyen | Les erreurs de stockage sont journalisées, pas les tentatives. |
| 7 | Tests navigateur non exécutés | Moyen | `puppeteer-core` et Chromium sont absents de cet environnement ; les parcours `.cjs` n'ont pas pu tourner. Remplacés par des tests HTTP réels et des tests purs. |
| 8 | Trois PR Dependabot ouvertes (#15 à #17) | Faible | Non touchées. |

## 12. Tâches restantes

1. Vérifier la CSP dans un vrai navigateur après déploiement (console + chargement de
   l'animation d'accueil et des polices).
2. Étape suivante de la feuille de route : socle e-mail et jetons, vérification d'adresse,
   réinitialisation de mot de passe, changement de mot de passe, sessions actives.
3. Journal d'audit d'authentification (connexions, échecs, suppressions).
4. Paramètres de scrypt versionnés et durcissement progressif du hachage.
5. Rejouer les parcours navigateur (`.cjs`) dans un environnement disposant de Chromium.

## 13. Non-régression

- 97 tests automatisés verts, dont les 61 hérités des missions précédentes.
- `tsc --noEmit` sans erreur, construction de production réussie.
- Contrats d'API conservés : mêmes routes, mêmes codes existants, seuls des codes et des
  statuts **plus précis** sont ajoutés.
- Aucun compte supprimé ou modifié, aucune migration, aucun changement de base de données,
  aucune dépendance ajoutée, aucune clé touchée.
- Livraison : un commit sur `arena/255c4e65-aura` et une Pull Request ouverte, **non
  fusionnée**, sans déploiement de production.
