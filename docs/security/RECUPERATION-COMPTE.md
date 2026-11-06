# Récupération de compte — modèle de sécurité

Mission 08. Ce document décrit **ce que le système garantit**, comment, et
ce qu'il ne garantit pas. Aucune affirmation ici n'est une intention : chaque
point renvoie à un fichier ou à un test exécutable.

## 1. Le problème

Jusqu'à la mission 07, un compte AURA perdu (mot de passe oublié) était
définitivement perdu, et un mot de passe ne pouvait jamais être changé.
Ajouter ces fonctions revient à ajouter des chemins d'accès au compte :
chaque route nouvelle est une surface d'attaque, et deux d'entre elles sont
**publiques** (mot de passe oublié, vérification d'adresse).

## 2. Jetons à usage unique

| Propriété | Mise en œuvre | Preuve |
|---|---|---|
| Entropie suffisante | 32 octets aléatoires (`randomBytes(32).toString('base64url')`), 256 bits | `tests/jetons.test.ts` (longueur, unicité sur 200 tirages) |
| Jamais stocké en clair | clé KV = `sha256(jeton)` ; le jeton brut n'existe que dans l'e-mail | `tests/jetons.test.ts` (lecture du fichier de stockage), `tests/recuperation.test.ts` (clés = 64 hexadécimaux) |
| Usage unique réel | réservation atomique `SET <verrou> 1 NX EX 120` avant toute écriture | `tests/jetons.test.ts` (6 appels concurrents → 1 seul gagnant), `tests/recuperation.test.ts` (2 réinitialisations simultanées → 200 + 400) |
| Expiration | TTL posé à l'écriture (`EX`) **et** vérifié à la lecture, donc doublement borné | `tests/jetons.test.ts`, `tests/recuperation.test.ts` (`jeton-expire`) |
| Un seul jeton actif par compte et par type | index `aurav1:jeton-actif:<userId>:<type>` réécrit à chaque émission | `tests/jetons.test.ts` |
| Lié à l'adresse | `empreinteEmail` comparée à l'adresse courante du compte avant validation | route `verify-email` |
| Type vérifié | un jeton de vérification ne peut pas réinitialiser un mot de passe | `tests/recuperation.test.ts` |

Pourquoi un verrou en plus du TTL : deux instances serverless peuvent traiter
le même clic (double envoi du navigateur, relance réseau). Sans réservation
atomique, les deux liraient un jeton encore valide et écriraient toutes les
deux. La réservation tranche côté stockage, pas côté processus.

Le verrou n'est **pas** supprimé après usage : il vit 120 secondes et bloque
toute rejeu immédiat. Le jeton et son index, eux, sont supprimés.

## 3. Anti-énumération

Trois fuites auraient été classiques ; elles sont fermées :

1. **Statut HTTP différent** → `/forgot-password` et `/resend-verification`
   répondent **202 avec le même corps**, compte existant ou non.
2. **Temps de réponse différent** (un compte existant déclenche un envoi) →
   un plancher de 350 ms est appliqué sur les deux branches.
3. **Message d'erreur différent** → l'indisponibilité du service d'e-mail
   (`503 mail-indisponible`) est renvoyée **avant** toute recherche de compte,
   donc identique pour toutes les adresses.

La seule erreur distincte est une **faute de syntaxe** sur l'adresse
(`400 validation`), qui ne dit rien de l'existence du compte.

Limitation par adresse : le compteur est incrémenté sur l'adresse soumise,
qu'elle existe ou non — un attaquant ne peut pas utiliser les quotas comme
oracle.

## 4. Ce que la récupération ne fait jamais

- Elle n'envoie **jamais** de mot de passe : uniquement un lien.
- Elle ne révèle **jamais** l'adresse e-mail d'un compte à un tiers.
- Elle ne laisse **aucune session ouverte** après une réinitialisation :
  toutes les sessions du compte sont supprimées (compromission ⇒ expulsion).
- Elle ne modifie **jamais** un compte existant lors d'une simple demande.
- Elle ne prétend **jamais** qu'un e-mail est parti : sans fournisseur
  configuré, la réponse est `503`, et aucun jeton n'est créé.

## 5. Changement de mot de passe (session ouverte)

- Mot de passe actuel exigé (vérification scrypt via `verifierMotDePasse`).
- Refus si le nouveau est identique à l'ancien (`400 identique`).
- Les **autres** sessions sont fermées ; la session courante survit, sinon
  l'utilisateur se déconnecterait lui-même après avoir sécurisé son compte.
- Compteur dédié (5 / 15 min par compte) et compteur d'échecs par adresse :
  marteler ce champ n'ouvre pas la porte de `/auth/login`.

## 6. Sessions actives

Ce que l'API expose, et rien de plus :

| Champ | Source | Remarque |
|---|---|---|
| `id` | 16 premiers hexadécimaux de `sha256(jeton)` | préfixe seul : suffisant pour révoquer, inutilisable comme cookie |
| `libelle` | `User-Agent` tronqué, décodé côté serveur | « Chrome · macOS », « Outil », « Appareil inconnu » |
| `cree`, `derniereActivite`, `expire` | session | dates ISO |
| `courante` | comparaison avec la session de la requête | jamais devinée |

Le jeton de session n'est **jamais** renvoyé par cette route. La révocation
d'une session d'un autre compte renvoie `404` (pas de fuite d'existence), et
la révocation de sa propre session est refusée (`400 session-courante`) :
la déconnexion a sa propre route.

Écriture de `derniereActivite` : au plus **une fois toutes les 5 minutes** par
session, et jamais bloquante (`marquerActivite` ignore une panne d'écriture).

## 7. Vérification d'adresse — non bloquante

Décision produit assumée : un compte non vérifié fonctionne normalement.
La vérification sert à **pouvoir récupérer** le compte plus tard, pas à
fermer l'accès.

- Un bandeau informatif et refermable apparaît dans l'espace.
- Le renvoi est possible depuis les paramètres (3 / heure par compte).
- Les comptes créés **avant** la mission n'ont pas le champ : ils sont traités
  comme non vérifiés, sans aucune migration destructive
  (`tests/recuperation.test.ts`, « Comptes existants »).
- Une réinitialisation réussie vaut preuve d'adresse : le compte passe
  vérifié (l'e-mail a été reçu).

## 8. Risques résiduels

| Risque | État | Mitigation / raison |
|---|---|---|
| Boîte mail compromise | inhérent | la réinitialisation ferme toutes les sessions et ne révèle rien |
| Fuite du stockage KV | réduite | les jetons y sont hachés ; les sessions aussi |
| Déni de service par e-mail (coût) | limité | 3 / heure par adresse, 10 / 15 min par IP |
| Usurpation d'origine dans un lien | fermée | `AURA_PUBLIC_ORIGIN` est déclarée, jamais déduite de `Host` |
| Vérification en navigateur réel | non exécutée | aucun Chromium dans l'environnement de build (annoncé, non simulé) |
| Lien ouvert par un antivirus | accepté | le lien est un `POST` côté interface : un simple aperçu ne consomme pas le jeton |

## 9. Références

- `server/auth/recuperation.ts` — routes publiques.
- `server/v1/routesCompte.ts` — routes privées (mot de passe, sessions).
- `server/db/entrepots.ts` — `EntrepotJetons`, `supprimerAutresSessions`, `marquerActivite`.
- `server/mail/` — fournisseur, gabarits, service.
- `tests/jetons.test.ts`, `tests/mail.test.ts`, `tests/recuperation.test.ts`.
