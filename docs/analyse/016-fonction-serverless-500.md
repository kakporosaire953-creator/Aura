# 016 — « 500 FUNCTION_INVOCATION_FAILED » sur `/api`

**Mission 10** · branche `arena/cf8f9057-aura`.

## 1. Symptôme rapporté

Sur le site déployé, la page `/login` s'affiche mais toute action échoue avec
« Le service ne répond pas ». En ouvrant directement `/api/status` dans le
navigateur, la plateforme renvoie :

```
This page is unavailable
A function needed by this page temporarily failed.
500 FUNCTION_INVOCATION_FAILED
```

Ce n'est donc **pas** un problème de configuration (KV, e-mails) : la
fonction serverless ne parvient pas à démarrer.

## 2. Cause racine

Le projet est en ESM (`"type": "module"` dans `package.json`). **En ESM, Node
exige l'extension explicite sur les imports relatifs.** Or le code serveur
importait sans extension :

```ts
import { hacherMotDePasse } from './accounts';   // ✗ en ESM
```

Compilé tel quel par la plateforme (esbuild → ESM), le module échoue au
chargement :

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/server/accounts'
  imported from /var/task/api/index.js
```

**Pourquoi c'était invisible en local** : `tsx` (dev, tests) et Vite
résolvent tous deux les imports sans extension. `tsc --noEmit` aussi. Les
176 tests passaient, le build passait, `verif:prod` passait — aucun de ces
outils ne se comporte comme Node au moment de charger la fonction.

## 3. Reproduction, avant correction

```bash
# compiler comme la plateforme, sans regrouper
esbuild api/index.ts $(find server -name '*.ts') \
  --outdir=/tmp/sim --outbase=. --format=esm --platform=node
echo '{ "type": "module" }' > /tmp/sim/package.json
ln -s "$PWD/node_modules" /tmp/sim/node_modules
node -e "import('/tmp/sim/server/api.js')"
# → ERR_MODULE_NOT_FOUND: Cannot find module '/tmp/sim/server/accounts'
```

Le même montage, une fois les extensions ajoutées, sert `/api/status` (200) et
`/api/auth/login` (401) dans un contexte ESM pur.

## 4. Correction

1. **99 spécificateurs relatifs** complétés par `.js` dans `server/**` et
   `api/index.ts` (les fichiers restent des `.ts` : TypeScript, Vite et `tsx`
   résolvent `.js` → `.ts`, vérifié).
2. `api/index.ts` :
   - le routeur est importé **paresseusement**, donc un échec de chargement
     devient une réponse **JSON** `{ code: "interne" }` avec la pile dans les
     journaux — au lieu d'une page d'erreur muette ;
   - sonde **`/api/__ping`** qui répond sans charger le routeur : elle
     distingue « la fonction s'exécute » de « l'application plante au
     démarrage ».
3. `server/api.ts` : route inconnue → 404 JSON, erreur non capturée → JSON
   (4xx = requête invalide, 5xx = interne). `/api` ne renvoie plus jamais de
   HTML.
4. Côté client : le message d'erreur affiche désormais le code HTTP
   (« (HTTP 500) ») quand il y en a un, jamais pour une coupure réseau.

## 5. Prévention

Nouveau garde-fou dans `verif:prod` : `scripts/verifier-fonction.cjs`
compile la fonction en ESM, la **charge et l'invoque** (`/api/status`), puis
échoue si le module ne démarre pas.

Contrôle négatif effectué : en retirant volontairement une extension, le
script sort en code 1 avec la pile exacte (`ERR_MODULE_NOT_FOUND`). Sans ce
test, la régression repasserait inaperçue.

```bash
npm run verif:prod     # build + contrôle production + fonction serverless
```

## 6. Ce que ça change pour l'utilisateur

Après fusion et redéploiement :

- `/api/status` doit renvoyer du JSON ;
- `/api/auth/login` répond `401` pour des identifiants inconnus, ou
  `503 stockage-indisponible` si Vercel KV n'est pas relié (sujet distinct,
  voir `docs/operations/ACTIVER-COMPTES-ET-EMAILS.md`) ;
- `npm run diagnostic -- https://votre-site` résume l'état en une commande.

## 7. Leçon retenue

Un test qui passe ne prouve que ce qu'il exerce. Toute la chaîne locale
(tsx, Vite, tsc) était plus permissive que le runtime de production : c'est
précisément l'écart qu'il faut tester, pas l'outil qu'on a sous la main.
