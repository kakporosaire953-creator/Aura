# 023 — Connexion Google, et confirmation d'adresse non bloquante

**Date** : 2026-11-09 · **Branche** : `arena/f3f04d15-aura`

## Décisions

1. **La confirmation d'adresse n'est plus obligatoire.** Elle redevient un
   simple lien utile, pas une porte. Motif : l'envoi d'e-mails n'est pas
   encore opérationnel (aucun domaine vérifié, budget nul) ; exiger une
   confirmation dans ces conditions fermait l'espace à tout le monde.
2. **Connexion Google** ajoutée : gratuite, sans domaine, et l'adresse y est
   déjà prouvée par Google.

Les deux vont ensemble : la porte d'entrée ne dépend plus d'un e-mail AURA.

## Confirmation d'adresse — nouveau comportement

`server/auth/verification.ts` :

| `AURA_VERIFICATION_EMAIL_OBLIGATOIRE` | État | Accès à l'espace sans confirmation |
|---|---|---|
| `1` | `obligatoire` | refusé (403 `email-non-verifie`) |
| `0` | `facultative` | ouvert |
| **absente** | `facultative` (avec fournisseur) / `impossible` (sans) | **ouvert** |

Rien n'est supprimé : la confirmation bloquante reste disponible via `=1`,
le code de vérification, les jetons et le renvoi continuent de fonctionner.
Le message d'état reste honnête — `impossible` signifie « aucun e-mail ne
peut partir », jamais « c'est confirmé ».

## Connexion Google — comment c'est construit

OAuth 2.0 « authorization code », **entièrement côté serveur**
(`server/auth/google.ts`) :

```
Navigateur ──GET /api/auth/google/demarrer──► 302 vers accounts.google.com
                                              (state aléatoire + cookie HttpOnly)
Navigateur ──GET /api/auth/google/retour?code&state──►
   serveur : état comparé (temps constant) → POST oauth2.googleapis.com/token
             (client_secret jamais dans le navigateur) → id_token
             signature RS256 vérifiée (JWKS Google, cache 1 h)
             iss / aud / exp / email_verified vérifiés
             compte trouvé ou créé → cookie de session → 302 vers la page interne
```

Garde-fous effectifs :

| Risque | Parade |
|---|---|
| CSRF de connexion | `state` de 32 octets en cookie HttpOnly, usage unique, comparé en temps constant |
| Jeton forgé | signature RS256 contre les clés publiées par Google ; clés illisibles → refus |
| Jeton d'un autre site | `aud` strictement égal au `client_id` |
| Adresse revendiquée | `email_verified` doit être vrai, sinon aucun compte |
| Redirection ouverte | la destination est un chemin interne validé (`/…`, jamais `//`) |
| Vol de compte | un compte déjà rattaché à un autre Google est refusé (`conflit`) |
| Secret exposé | le `client_secret` ne quitte jamais le serveur ; aucun secret dans les URL |

Comptes créés par Google : mot de passe technique aléatoire (jamais
communiqué) → aucune connexion par mot de passe possible tant que
l'utilisateur n'en a pas défini un via « mot de passe oublié »
(`motDePasseDefini: false`, exposé au client pour l'interface).

Compte existant trouvé par la même adresse : **rattachement**, pas de doublon ;
le mot de passe historique reste valable.

## Configuration (gratuite)

1. Google Cloud Console → créer un projet → **Identifiants → Créer un
   identifiant OAuth** → type « Application Web ».
2. URI de redirection autorisée :
   `https://aura-seven-mocha-51.vercel.app/api/auth/google/retour`
3. Dans Vercel (Production) :

   ```
   GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=…
   AURA_PUBLIC_ORIGIN=https://aura-seven-mocha-51.vercel.app
   ```
4. **Redeploy.** Le bouton « Continuer avec Google » n'apparaît que si
   `/api/status` répond `googleConfiguree: true`.

Aucun coût : ni domaine, ni abonnement, ni carte bancaire.

## Vérifications

- `tests/google.test.ts` (13 tests) : indisponibilité honnête, URL de
  consentement, `state` absent ou différent, refus utilisateur, **jeton signé
  par une autre clé rejeté**, `email_verified:false` rejeté, création de
  compte + session, rattachement sans doublon, conflit d'identité, absence de
  redirection ouverte, `client_secret` jamais dans l'URL.
- `tests/verification-email.test.ts` : défaut non bloquant, `=1` bloquant,
  `/api/status` annonce `facultative`.
- `npm test` : 287 tests · `tsc --noEmit` : 0 erreur · build : OK.

## Ce qui reste à faire côté exploitation

- Poser les variables Google (ci-dessus) — **jamais faites par l'agent**.
- Si un jour l'envoi d'e-mails est opérationnel : `AURA_VERIFICATION_EMAIL_OBLIGATOIRE=1`
  rétablit la règle bloquante, sans changement de code.
