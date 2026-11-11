# Redéployer AURA sur Vercel (et faire prendre une variable)

Une variable d'environnement ajoutée dans Vercel **n'atteint pas** un
déploiement déjà construit. Ce document décrit le geste, les pièges, et le
contournement qui fonctionne quand le bouton *Redeploy* refuse.

## 1. Le geste normal

1. Ouvrir le projet sur [vercel.com](https://vercel.com), **sur ordinateur**
   (l'application mobile n'affiche pas le menu).
2. Onglet **Deployments**.
3. La ligne la plus haute est le déploiement de production courant.
4. **⋯** à droite → **Redeploy** → confirmer.

Compter **1 à 2 minutes**. Le déploiement passe par `Queued → Building →
Ready`.

## 2. Ce qui bloque, et quoi faire

| Symptôme | Cause probable | Solution |
|---|---|---|
| Bouton grisé, rien ne se passe | un déploiement est encore en cours | attendre l'état *Ready* |
| Menu **⋯** invisible | mobile, ou fenêtre trop étroite | passer sur ordinateur |
| Message d'erreur au clic | compte non membre du projet, ou quota du plan atteint | se connecter avec le compte propriétaire |
| Le déploiement réussit mais la variable semble ignorée | variable cochée pour le mauvais environnement (*Preview* au lieu de *Production*) | corriger la case, redéployer |

## 3. Le contournement infaillible : un commit sur `main`

Tout nouveau commit sur `main` déclenche une production, avec **toutes** les
variables actuelles. Deux moyens :

- **Depuis GitHub** : ouvrir un fichier du dépôt → crayon *Edit* → enregistrer
  sur `main`. Vercel démarre seul.
- **Depuis une pull request** : fusionner n'importe quelle modification ; le
  commit de fusion suffit.

C'est la méthode à privilégier quand le bouton *Redeploy* ne répond pas : elle
ne dépend que de GitHub.

## 4. Vérifier que la variable est réellement prise

Les variables d'administration ne sont **pas** lisibles depuis l'extérieur —
c'est voulu. Le contrôle se fait avec une session ouverte :

```bash
# Connecté dans le navigateur, ouvrir simplement :
https://<domaine>/api/v1/admin/etat
```

| Réponse | Lecture |
|---|---|
| `{"admin":true,"configure":true}` | variable lue, adresse reconnue |
| `{"admin":false,"configure":true}` | variable lue, mais l'adresse du compte n'y figure pas |
| `503 admin-non-configure` | variable absente de **ce** déploiement |
| `401 anonyme` | pas de session : se connecter d'abord |

## 5. Après le déploiement

Contrôler trois points, sans supposer :

```bash
curl -s https://<domaine>/api/status          # état des briques
curl -s https://<domaine>/manifest.webmanifest # manifeste PWA servi
curl -s https://<domaine>/sw.js | head -3      # service worker servi
```

Un déploiement peut réussir et casser une route : ces trois réponses sont la
preuve minimale que le site et l'application installable sont intacts.
