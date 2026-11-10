# 025 — « Le moteur IA ne répond pas » ne voulait rien dire

**Date** : 2026-11-09 · **Branche** : `arena/6e611b86-aura`

## Symptôme

Le chat affiche « Le moteur IA ne répond pas. » en une à deux secondes. Une
réponse aussi rapide contredit le message : un vrai silence réseau prend le
délai complet (45 s par défaut).

## Cause

`server/ai/transport.ts` classait tout statut non reconnu dans une seule
erreur générique. Or ce fourre-tout attrapait aussi :

- **404** — le modèle demandé n'existe pas, ou n'est pas ouvert à cette clé ;
- **5xx** — le fournisseur a répondu, mais en erreur.

Dans les deux cas, le fournisseur **avait répondu**. « Ne répond pas »
envoyait donc chercher une panne réseau inexistante, au lieu de regarder le
nom du modèle ou l'état du fournisseur.

## Correctif

Trois messages distincts, un code par cause :

| Statut fournisseur | Code | Message |
|---|---|---|
| 401 / 403 | `auth-fournisseur` | « a refusé l'authentification serveur (clé à vérifier) » |
| 429 / 402 | `limite-modele` | « est sollicité au-delà de ses limites » |
| 404 | **`modele-introuvable`** | « Le modèle configuré n'existe pas ou n'est pas accessible avec cette clé. » |
| ≥ 500 | **`erreur-fournisseur`** | « a renvoyé une erreur (HTTP 5xx) » |
| 408 / 504 | `timeout` | « a mis trop de temps à répondre » |

Aucun message ne contient de clé, d'en-tête ni de corps de réponse : le statut
seul est repris. Les codes sont journalisés (`[ia] tentative N échouée (…, code)`).

## Comment lire la panne sans les journaux

Le message affiché suffit désormais à trancher :

- « refusé l'authentification » → la **clé** ;
- « au-delà de ses limites » → le **quota** ;
- « n'existe pas ou n'est pas accessible » → le **nom du modèle** (`AURA_MODELE`) ;
- « a renvoyé une erreur (HTTP 5xx) » → **le fournisseur**, pas AURA ;
- « mis trop de temps » → réseau ou modèle saturé.

## Vérifications

`tests/ai.test.ts` : 404 → `modele-introuvable` (et jamais « ne répond pas »),
503 → `erreur-fournisseur` avec le statut, 401/429/504 inchangés, et aucune
clé dans aucun message. Suite complète : 291 tests.
