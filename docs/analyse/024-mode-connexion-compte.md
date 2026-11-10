# 024 — Le compte dit comment il se connecte

**Date** : 2026-11-09 · **Branche** : `arena/6e611b86-aura`

## Le problème

Depuis l'ajout de Google, deux natures de comptes coexistent :

- ouverts par mot de passe (les comptes historiques) ;
- ouverts par Google, **sans aucun mot de passe** (`motDePasseDefini: false`).

Dans les paramètres, ces derniers voyaient un formulaire « Mot de passe actuel »
qui ne pouvait jamais aboutir : l'ancien mot de passe n'existe pas. C'était une
impasse silencieuse, et rien n'indiquait à l'utilisateur *comment* il ouvre son
compte.

## Ce qui change

### Interface — section « Mode de connexion »

Deux lignes factuelles, tirées de l'état réel renvoyé par le serveur :

| Ligne | Valeurs |
|---|---|
| Connexion Google | *Rattachée* / *Non rattachée* |
| Mot de passe | *Défini* / *Aucun mot de passe* |

La ligne Google n'apparaît que si elle est rattachée **ou** si aucun mot de passe
n'existe — un compte purement « mot de passe » n'affiche pas une information
inutile.

### Formulaire adapté

Quand `motDePasseDefini === false` :

- le champ « Mot de passe actuel » disparaît ;
- le texte explique la situation (« ce compte a été ouvert avec Google ») ;
- le bouton dit « Définir un mot de passe ».

Un compte historique (`motDePasseDefini` absent) conserve **exactement** le
comportement d'avant : ancien mot de passe exigé.

### Côté serveur — `POST /v1/me/password`

| Cas | `actuel` | Résultat |
|---|---|---|
| mot de passe existant | requis, vérifié | inchangé |
| compte Google sans mot de passe | ignoré | premier mot de passe défini, `motDePasseDefini = true` |

Dans les deux cas : minimum 8 caractères, limite de 5 changements par 15 min,
et **fermeture de toutes les autres sessions**.

**Compromis assumé** : définir le premier mot de passe ne demande pas de
re-prouver l'identité, parce que l'unique autre voie (lien e-mail) n'est pas
opérationnelle. La session ouverte tient donc lieu de preuve. Dès que l'envoi
d'e-mails fonctionnera, cette exception pourra être retirée au profit du
parcours « mot de passe oublié » ; le code est isolé sur la seule variable
`premierMotDePasse` pour que ce changement reste local.

## Vérifications

- `tests/google.test.ts` : un compte créé par Google définit un mot de passe
  sans `actuel`, l'état passe à `motDePasseDefini: true`, et ce mot de passe
  ouvre ensuite le compte (`/auth/login` → 200).
- `tests/recuperation.test.ts` : pour un compte avec mot de passe, `actuel`
  reste obligatoire (400 `champs.actuel: requis`).
- `npm test` : **288 tests** · `tsc --noEmit` : 0 erreur · build et sondes : verts.

## Ce qui n'est pas fait (et ne l'est pas par omission)

- **Délier Google** d'un compte : pas encore proposé — cela demande une
  confirmation par mot de passe et une décision produit (que devient un compte
  Google seul si on délie ?).
- **Changer d'adresse e-mail** : hors périmètre.
