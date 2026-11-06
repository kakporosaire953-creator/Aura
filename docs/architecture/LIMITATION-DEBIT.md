# Limitation de débit — fonctionnement, garanties, repli

Document de référence pour le module `server/v1/limite.ts` et les middlewares
`server/v1/middlewares.ts`. Il décrit ce qui est **réellement** garanti, y compris les
limites assumées.

## 1. Où sont les compteurs

| Portée de clé | Usage | Plafond | Fenêtre |
|---|---|---|---|
| `aurav1:rl:login-ip:<adresse>` | connexion, par adresse IP | 20 | 10 min |
| `aurav1:rl:login-email:<empreinte>` | connexion, par adresse e-mail (SHA-256 tronqué) | 10 | 10 min |
| `aurav1:rl:register-ip:<adresse>` | inscription, par adresse IP | 30 | 10 min |
| `aurav1:rl:register-email:<empreinte>` | inscription, par adresse e-mail | 10 | 1 h |
| `aurav1:rl:compte:<userId>` | suppression de compte | 5 | 15 min |
| `aurav1:rl:chat:<userId>` | messages de chat | 40 | 5 min |

Une portée saturée n'affecte jamais une autre portée : saturer la connexion ne ferme ni
l'inscription ni le chat. L'adresse e-mail n'est jamais écrite en clair dans une clé.

## 2. Atomicité de l'incrément et de l'expiration

Le pilote KV (`server/db/base.ts`) envoie **dans un seul aller-retour** un pipeline REST :

```
POST <KV_REST_API_URL>/pipeline
[ ["INCR", "aurav1:rl:login-ip:203.0.113.7"],
  ["EXPIRE", "aurav1:rl:login-ip:203.0.113.7", "600", "NX"] ]
```

Trois propriétés en découlent :

1. **Jamais de compteur immortel.** L'expiration est posée dans la même exécution que
   l'incrément. Une coupure réseau, un arrêt de l'instance serverless ou une erreur du
   client entre les deux commandes ne peut pas laisser une clé sans TTL, donc un blocage
   définitif pour cette clé. Une clé héritée sans expiration est **réparée** au premier
   incrément (`EXPIRE … NX` s'applique quand aucune expiration n'existe).
2. **Jamais de fenêtre rallongée.** `NX` n'écrase pas une expiration existante : une
   tentative tardive ne repousse pas la fin de la fenêtre, donc un attaquant ne peut pas
   maintenir un compteur saturé indéfiniment.
3. **Comptage exact entre instances.** `INCR` est atomique côté Redis : deux instances
   serverless simultanées ne peuvent pas lire la même valeur ni se contredire.

**Repli si `/pipeline` n'existe pas** (autre hébergeur Redis exposant la même API REST) :
`INCR`, puis `TTL` ; `EXPIRE` n'est envoyé que si la clé n'a pas d'expiration (`-1`).
Trois allers-retours au lieu d'un, mais la garantie « jamais de compteur immortel » est
conservée. Le repli est journalisé.

**Vérifié par les tests** (`tests/limite-kv.test.ts`, faux serveur Redis REST) :
les deux commandes partent bien dans un seul pipeline, une clé sans TTL est réparée, une
fenêtre en cours n'est pas rallongée, une fenêtre expirée repart de zéro, et le repli
`INCR` + `TTL` + `EXPIRE` pose l'expiration.

## 3. Repli mémoire : conditions exactes et conséquences

Le compteur partagé est la règle. Le compteur mémoire n'est utilisé que dans deux cas :

| Situation | Ce qui se passe |
|---|---|
| Le stockage est **non configuré** (`PiloteIndisponible`) | Compteurs du processus. Les routes d'authentification répondent de toute façon `503 stockage-indisponible`, donc la limitation est un garde-fou secondaire. |
| Le stockage est **configuré mais injoignable** (réseau, panne, 5xx) | L'incrément échoue, le repli local prend le relais, une ligne est écrite dans les journaux (`[api] limitation : stockage partagé indisponible, repli local`). Aucune exception n'est propagée, aucune requête n'est refusée à cause de la panne. |

**Garanties du repli :**

- il ne bloque **jamais** collectivement : la clé reste propre à la portée et à l'identifiant ;
- il **n'échoue jamais** la route : la disponibilité prime sur la limitation ;
- il est **best-effort par instance** : deux instances serverless ne partagent pas leur
  compteur, et un démarrage à froid le remet à zéro. C'est une dégradation **assumée**,
  limitée à la durée d'une panne de stockage ;
- la mémoire est purgée à l'usage au-delà de 5 000 entrées, et chaque entrée expire au plus
  tard en 15 minutes.

**Ce que le repli ne fait pas :** il ne se substitue pas au stockage en fonctionnement
normal, il ne masque aucune panne (l'incident est journalisé) et il ne rend pas la
limitation plus stricte pour les autres utilisateurs.

## 4. Provenance de l'adresse IP

`ipClient()` ne suppose rien :

1. **`req.ip`**, quand Express l'a résolu. La confiance proxy est réglée par
   `configurerConfianceProxy()` : `trust proxy = 1` **uniquement** si `VERCEL` est défini ou
   `AURA_TRUST_PROXY=1`. Sur Vercel, il y a exactement un saut de proxy : Express retient
   l'adresse ajoutée par la plateforme et ignore ce que le navigateur aurait pu préfixer
   dans `x-forwarded-for`.
2. **À défaut** (fonction serverless appelée sans application Express, cas où `req.ip`
   n'existe pas), l'entrée **la plus à droite** de `x-forwarded-for` : c'est celle que le
   proxy ajoute lui-même, donc non forgeable. Une valeur mise en tête de liste par le client
   est ignorée.
3. Sinon `inconnu`, regroupé à part.

Aucune confiance n'est accordée à `x-forwarded-for` quand l'application est exposée
directement : sans proxy déclaré, `trust proxy` reste `false` et la socket fait foi.

**Vérifié par les tests** (`tests/auth-durcissement.test.ts`) : valeur forgée en tête
ignorée, valeur ajoutée par la plateforme retenue, en-tête ignoré sans proxy, confiance
activée seulement sur déclaration.

## 5. Ce qui n'est pas garanti

- Un compteur partagé ne protège pas d'une attaque **distribuée** sur de nombreuses adresses.
  Il ralentit, il n'arrête pas ; la vérification d'e-mail et le second facteur restent les
  vraies réponses.
- Une panne de stockage ouvre une fenêtre où seule la mémoire de chaque instance limite le
  débit.
- Les plafonds sont des constantes de code (`REGLES` dans `server/v1/middlewares.ts`) : les
  modifier demande une livraison, pas un réglage d'environnement.
