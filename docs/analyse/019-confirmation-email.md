# 019 — Confirmation d'adresse obligatoire avant l'espace

**Date** : 2026-10-23 · **Branche** : `arena/3630913f-aura`

## Demande

« Un utilisateur doit confirmer son mail avant d'avoir accès à son espace. »

C'est un renversement de la règle précédente (bandeau informatif, refermable,
sans effet sur l'accès). L'ancienne règle est supprimée : elle ne doit pas
être réintroduite.

## Trois états, jamais confondus

`server/auth/verification.ts` décide, à chaque requête, laquelle des trois
règles s'applique — et l'interface reçoit cet état dans `/api/me`
(`verificationEmail`), pour ne jamais afficher un écran que le serveur
refuserait :

| État | Condition | Effet |
|---|---|---|
| `obligatoire` | un fournisseur d'e-mails est configuré (`mailConfigure()`), ou `AURA_VERIFICATION_EMAIL_OBLIGATOIRE=1` | un compte non confirmé reçoit `403 email-non-verifie` sur tout le workspace |
| `impossible` | aucun fournisseur d'e-mails | accès ouvert, et l'interface le dit : sans e-mail sortant, personne ne pourrait jamais se confirmer |
| `facultative` | `AURA_VERIFICATION_EMAIL_OBLIGATOIRE=0` | accès ouvert, choix explicite de l'administrateur |

Pourquoi `impossible` n'enferme personne : exiger une confirmation qu'aucun
e-mail ne peut délivrer, c'est fermer un espace dont personne n'a la clé, et
c'est contraire à la règle « ne jamais prétendre qu'un e-mail est parti ».
Dès qu'un fournisseur est configuré, la règle devient **bloquante sans autre
réglage**. Le forçage `=1` sert à tester le chemin bloquant sans envoyer
d'e-mail : dans ce cas l'inscription répond honnêtement `503 mail-indisponible`
plutôt que de créer un compte qui ne pourrait jamais être confirmé.

## Ce que le serveur applique

- `server/v1/middlewares.ts` — `emailVerifieRequis` : refus `403` avec
  `code: "email-non-verifie"` et un message unique.
- `server/v1/routes.ts` — garde globale posée après `attacherCompteV1`, avec
  une liste d'exceptions strictement limitée à ce qui permet de sortir de
  l'impasse : `/me`, `/me/email*` (renvoi du lien), `/preferences`,
  `/capabilities`, `/ai/usage`, `/me/sessions*`, `/me/password`.
  Un compte non confirmé peut donc **renvoyer le lien, se déconnecter,
  consulter et révoquer ses sessions, changer son mot de passe** — il n'est
  jamais enfermé.
- `server/api.ts` — `/me` renvoie `verificationEmail` ; `/chat` répond
  `403 email-non-verifie` ; l'inscription renvoie `503 mail-indisponible`
  quand la confirmation est exigée sans fournisseur.
- Les sessions existantes ne sont pas invalidées : un compte déjà confirmé
  (`emailVerifie: true`) traverse la garde comme avant.

## Ce que l'interface fait

- `src/app/session.tsx` — `verificationEmail` fait partie de l'état de
  session (défaut prudent : `obligatoire` tant que `/api/me` n'a pas répondu ;
  `facultative` en simulation, où aucun e-mail ne circule).
- `src/app/gardes.tsx` — `confirmationRequise(compte, verificationEmail)`,
  fonction pure et testée, puis l'écran `AttenteConfirmation` : titre, adresse
  (coupable si trop longue), renvoi du lien, déconnexion. Mise en page dans
  `src/index.css` (`.page-confirmation`), empilée sous 420 px.
- `/verifier-email` (`src/pages/VerifierEmailPage.tsx`) reste la cible des
  liens envoyés par e-mail.
- Sous `facultative` et `impossible`, le bandeau informatif de la mission 08
  subsiste : il n'ouvre ni ne ferme l'accès, il informe.

## Codes HTTP ajoutés

| Code | Corps | Sens |
|---|---|---|
| `403` | `{ code: "email-non-verifie" }` | adresse non confirmée, espace fermé |
| `503` | `{ code: "mail-indisponible" }` | confirmation exigée, aucun fournisseur pour envoyer le lien |

## Vérification

`tests/verification-email.test.ts` (7 tests) couvre les trois états, le
refus d'inscription à `503`, les routes réellement fermées (`/v1/conversations`,
`/v1/studio/jobs`, `/v1/projets`, `/v1/missions`, `/chat`), le renvoi qui
reste accessible, l'ouverture après confirmation, et la règle d'interface
`confirmationRequise`. Aucun e-mail réel n'est envoyé : le fournisseur est
simulé par une adresse locale fermée.

## Pour rendre la règle bloquante en production

1. Configurer `AURA_MAIL_PROVIDER`, `AURA_MAIL_API_KEY`, `AURA_MAIL_FROM`,
   `AURA_PUBLIC_ORIGIN` (Resend, domaine vérifié).
2. Redéployer (une variable ajoutée ne s'applique qu'après **Redeploy**).
3. Vérifier `/api/me` : `verificationEmail` doit valoir `obligatoire`.
4. Créer un compte de test : l'espace doit rester fermé jusqu'au clic sur le
   lien reçu, et le lien doit expirer en 24 h.
