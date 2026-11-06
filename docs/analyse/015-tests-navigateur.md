# 015 — Tests d'interface : ce qui est réellement exécuté

**Mission 09** · branche `arena/a5ec05d0-aura` · base `main` = `e962345`.

Cette mission devait installer un **vrai navigateur** (Chromium/Playwright),
couvrir les parcours de connexion et de récupération, et vérifier la CSP
appliquée par un moteur de rendu. **Ce n'est pas ce qui a été fait**, parce
que c'est impossible dans cet environnement. Voilà pourquoi, et ce qui a été
fait à la place.

## 1. Le blocage, constaté puis mesuré

```bash
command -v chromium chromium-browser google-chrome firefox   # → tous absents
ls ~/.cache/ms-playwright                                    # → vide
curl -m 8 -o /dev/null -w '%{http_code}' https://cdn.playwright.dev        # → 000
curl -m 8 -o /dev/null -w '%{http_code}' https://playwright.azureedge.net  # → 000
curl -m 8 -o /dev/null -w '%{http_code}' https://storage.googleapis.com    # → 000
curl -m 8 -o /dev/null -w '%{http_code}' https://registry.npmjs.org/jsdom  # → 200
```

Le bac à sable n'autorise que le registre npm (et quelques hôtes GitHub) :
**aucun binaire de navigateur ne peut être téléchargé**, et aucun paquet
Debian ne peut l'être non plus. Installer Playwright aurait produit une suite
écrite mais **jamais exécutée** — exactement ce que la consigne interdit
(« aucune simulation », « ne jamais prétendre »).

Décision : ne pas ajouter de dépendance inutile, écrire à la place la couche
la plus proche réellement exécutable, et documenter l'écart.

## 2. Ce qui a été construit et exécuté

Une suite d'**interactions dans un DOM simulé** (`jsdom`), où React est
réellement monté et où les événements sont réellement dispatchés.

| Élément | Rôle |
|---|---|
| `tests/support/dom.ts` | banc : `window`/`document` réels (jsdom), montage React, `input`/`submit`/`click`, attente d'état, URL contrôlée |
| `tests/interaction-recuperation.test.ts` | **20 tests** d'interaction sur les quatre écrans |
| `jsdom` + `@types/jsdom` | dépendances **de développement uniquement** |

Ces tests couvrent, écran par écran :

**Mot de passe oublié** (5) — saisie invalide refusée sans requête ; succès
`202` avec message conditionnel et disparition du formulaire ; normalisation
de l'adresse (casse, espaces) ; `503` affiché franchement sans faux succès ;
`429` affiché avec formulaire conservé.

**Réinitialisation** (6) — sans jeton, bouton inactif + message ; deux mots de
passe différents → erreur locale, zéro requête ; mot de passe trop court
refusé avant l'envoi ; succès → `POST { token, password }`, **URL nettoyée**,
jeton absent du DOM, formulaire remplacé ; jeton expiré et jeton déjà utilisé
→ messages distincts.

**Vérification d'adresse** (3) — un seul appel au montage malgré les
remontages de React, jeton retiré de l'URL après usage ; refus annoncé comme
refus ; sans jeton, aucun appel réseau.

**Sécurité du compte** (6) — sessions listées avec l'appareil courant marqué
et **non révocable** ; révocation d'une session distante → un seul `DELETE`
puis rafraîchissement ; « fermer les autres sessions » ; renvoi de
vérification → `POST /v1/me/email/renvoyer` avec la langue ; changement de mot
de passe : refus local si la confirmation diffère (aucune requête), puis appel
réel, champs vidés et confirmation ; mot de passe actuel refusé → message
relayé.

## 3. Ce que ces tests prouvent — et ce qu'ils ne prouvent pas

**Prouvé** : le comportement des écrans (états, messages, appels émis, corps
exacts, nettoyage d'URL, absence de fuite du jeton dans le DOM), le câblage
React → services → API, et l'absence de requête quand une validation locale
échoue.

**Non prouvé** : rendu visuel, contrastes, focus, animations, responsivité,
et **CSP réellement appliquée** — jsdom n'applique ni CSS ni CSP. La CSP reste
vérifiée **statiquement** par `npm run verif:prod` (13 directives identiques
entre `vercel.json` et le serveur).

Je ne prétends donc pas avoir fait un test navigateur : j'ai fait le test
d'interface le plus fort possible ici, et laissé le navigateur pour un
environnement qui en a un.

## 4. Comment ajouter le navigateur plus tard (sans réécrire)

La suite est déjà structurée pour un remplacement direct : chaque test décrit
un parcours, pas une implémentation. Avec un accès réseau normal :

```bash
npm i -D @playwright/test
npx playwright install chromium
```

puis réutiliser les mêmes scénarios contre un serveur réel :

```bash
npm start &                      # API + front sur le port 3000
npx playwright test              # connexion, oubli → réinitialisation, /verifier-email
```

Les points restent à couvrir en navigateur : CSP effective, focus visible,
contraste, comportement tactile des boutons de session sur mobile.

## 5. Résultats

| Commande | Résultat |
|---|---|
| `npm test` | **176 / 176** (156 + 20 nouveaux) |
| `./node_modules/.bin/tsc --noEmit` | **0 erreur** |
| `npm run build` | OK |
| `npm run verif:prod` | OK — 13 directives CSP identiques, mode démo verrouillé |

## 6. Risque résiduel, écrit noir sur blanc

Un défaut **purement visuel** (alignement, contraste, débordement, focus) sur
les trois écrans de récupération et le bloc sécurité ne serait détecté par
aucun test automatisé de ce dépôt aujourd'hui. C'est le seul angle mort
connu de la mission 08, et il ne se fermera qu'avec un navigateur réel.
