# Activer les comptes et les e-mails en production

Ce document répond à une situation précise : **le site est en ligne, la page
de connexion s'affiche, mais se connecter ou créer un compte ne marche pas.**

## 1. Pourquoi ça ne marche pas

AURA refuse volontairement de faire semblant. Sur Vercel, le disque est
éphémère : sans base configurée, le serveur refuse d'écrire des comptes
qu'il perdrait au redéploiement. Les routes répondent alors :

```json
{ "error": "Stockage non configuré sur cet environnement. Ajoutez Vercel KV …",
  "code": "stockage-indisponible" }
```

Code HTTP : `503` sur `/api/auth/register` et `/api/auth/login`. Côté
interface, le message « Les comptes attendent la configuration du stockage »
s'affiche sous le formulaire.

Trois causes possibles, dans l'ordre de fréquence :

| # | Cause | Symptôme |
|---|---|---|
| 1 | Aucune base KV reliée au projet | `503 stockage-indisponible` |
| 2 | Variables ajoutées **après** le dernier déploiement | `503` persistant malgré la config |
| 3 | Protection de déploiement Vercel sur le domaine | `401`/`403` sur **toute** page, avant même le site |

## 2. Vérifier en 10 secondes, sans rien installer

Ouvrez dans le navigateur :

```
https://<votre-site>/api/status
```

Regardez deux champs :

- `features.accounts` : `live` (stockage OK) ou `setup-required` ;
- `setup.accounts` : la raison exacte en clair.

C'est la source de vérité : elle décrit l'état réel du serveur, pas une
intention.

## 3. Diagnostic complet, en une commande

Depuis le dépôt, sans clé, sans secret, **sans créer de compte** :

```bash
npm run diagnostic -- https://<votre-site>
```

Le script (`scripts/diagnostic-prod.cjs`) sonde les routes publiques avec des
valeurs volontairement invalides : le code HTTP suffit à conclure, et rien
n'est écrit.

Ce qu'il vérifie : page `/login` servie, en-tête CSP présent, état déclaré des
comptes, validation d'inscription, refus propre de connexion, présence des
routes de récupération, configuration des e-mails. Il se termine par un code
de sortie `0` (tout est en place) ou `1` (un point bloque), et rappelle les
causes probables.

## 4. Activer le stockage (obligatoire pour les comptes)

1. Tableau de bord Vercel → votre projet → **Storage** → **Create Database**
   → **KV / Upstash Redis** (l'offre gratuite suffit pour démarrer).
2. **Connect** la base au projet, environnements **Production** et
   **Preview**. Vercel injecte `KV_REST_API_URL` et `KV_REST_API_TOKEN`.
3. **Redéployer** : les variables ne s'appliquent jamais au déploiement en
   cours. `Deployments → … → Redeploy`, ou un commit vide sur `main`.

Vérification : `/api/status` doit afficher `features.accounts: "live"`.

> Auto-hébergement / serveur classique : à défaut de KV, définissez
> `AURA_DATA_DIR=/var/lib/aura` (dossier persistant). Le pilote fichier écrit
> un JSON atomique (tmp + rename) et n'est **pas** compatible avec un disque
> éphémère.

## 5. Activer les e-mails (nécessaire pour « mot de passe oublié »)

Sans fournisseur, la récupération répond `503 mail-indisponible` — et c'est
volontaire : aucun message n'est annoncé comme parti.

1. Créer un compte **Resend** et **vérifier le domaine expéditeur**
   (enregistrements SPF et DKIM chez votre registrar).
2. Ajouter dans Vercel, environnements **Production** et **Preview** :

| Variable | Exemple |
|---|---|
| `AURA_MAIL_PROVIDER` | `resend` |
| `AURA_MAIL_API_KEY` | `re_…` (clé serveur, jamais dans le frontend) |
| `AURA_MAIL_FROM` | `AURA <bonjour@votredomaine.tld>` |
| `AURA_PUBLIC_ORIGIN` | `https://votredomaine.tld` |
| `AURA_MAIL_REPLY_TO` | `support@votredomaine.tld` (facultatif) |

3. Redéployer, puis relancer `npm run diagnostic -- https://<votre-site>` :
   la ligne « E-mails NON configurés » doit devenir « E-mails configurés ».

> `AURA_PUBLIC_ORIGIN` n'est jamais déduite de l'en-tête `Host` : c'est ce qui
> empêche un lien de réinitialisation de pointer vers un domaine usurpé.

## 6. Parcours de vérification manuel, après activation

1. Créer un compte → l'espace s'ouvre immédiatement (la vérification d'adresse
   n'est pas bloquante) et un bandeau « Confirmez votre adresse » apparaît.
2. Ouvrir l'e-mail, cliquer sur le lien → `/verifier-email` confirme l'adresse.
3. Se déconnecter, puis **Mot de passe oublié** → l'e-mail de réinitialisation
   arrive ; le lien vaut 30 minutes et **une seule fois**.
4. Après changement : les autres sessions doivent être fermées
   (`/parametres` → Sécurité → Sessions actives).

## 7. Ce qu'il ne faut pas conclure trop vite

- Un `503` sur `/api/auth/forgot-password` **ne veut pas dire** que
  l'authentification est cassée : les comptes peuvent fonctionner alors que
  les e-mails ne sont pas configurés.
- Un `429` n'est pas une panne : c'est la limitation de débit (par exemple
  10 tentatives de connexion en 10 minutes depuis la même IP).
- Un `401` sur **toutes** les pages est un problème de déploiement
  (protection Vercel activée), pas d'AURA.
