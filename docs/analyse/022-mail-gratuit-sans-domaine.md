# 022 — Envoyer les e-mails de confirmation sans domaine payant

**Date** : 2026-11-09 · **Branche** : `arena/b261f5d3-aura`

## Le blocage

Resend exige un **domaine vérifié** pour écrire à n'importe quelle adresse.
Avec l'expéditeur de test `onboarding@resend.dev`, les messages ne partent que
vers l'adresse du titulaire du compte : les nouveaux inscrits ne reçoivent
rien. Vérifier un domaine suppose d'en posséder un — donc de payer.

Or la confirmation obligatoire a besoin d'un envoi réel vers l'adresse de
chaque utilisateur. Sans domaine, la règle reste inapplicable.

## La solution retenue : Brevo, gratuit, sans domaine

Brevo (ex-Sendinblue) **ne demande pas de domaine** pour commencer : il valide
une simple **adresse d'expédition** (un lien est envoyé dans cette boîte, on
clique, c'est validé). L'offre gratuite est permanente : **300 messages par
jour** (≈ 9 000/mois), sans carte bancaire, avec accès complet à l'API REST.

C'est très au-dessus du besoin : 300 confirmations par jour.

### Ce que le code accepte maintenant

`server/mail/adaptateur.ts` gère deux fournisseurs, choisis par
`AURA_MAIL_PROVIDER` :

| Fournisseur | Domaine requis | Gratuit | Point d'entrée |
|---|---|---|---|
| `resend` | **oui** | 100/jour (domaine payant) | `https://api.resend.com/emails` |
| `brevo` | **non** (adresse validée) | 300/jour | `https://api.brevo.com/v3/smtp/email` |

Le contrat Brevo est respecté tel quel : en-tête `api-key`, `sender` séparé en
`{ email, name }`, `to`, `subject`, `htmlContent`, `textContent`, `replyTo`.
Aucune dépendance ajoutée : c'est du `fetch`, comme pour Resend.

### Mise en route (10 minutes, tout est gratuit)

1. Créer un compte sur Brevo (aucune carte bancaire).
2. **Senders & IP → Senders → Add a sender** : mettre l'adresse qui enverra
   les messages (par exemple l'adresse Gmail du projet). Ouvrir la boîte,
   cliquer le lien de validation.
3. **SMTP & API → API keys → Generate a new API key** (commence par
   `xkeysib-`). Copier la clé.
4. Dans Vercel → Settings → Environment Variables (Production) :

   ```
   AURA_MAIL_PROVIDER=brevo
   AURA_MAIL_API_KEY=xkeysib-…
   AURA_MAIL_FROM=AURA <adresse-validée-à-l'étape-2>
   AURA_PUBLIC_ORIGIN=https://aura-seven-mocha-51.vercel.app
   ```
   Supprimer `AURA_MAIL_API_URL` s'il avait été posé pour Resend : l'URL par
   défaut de Brevo est `https://api.brevo.com/v3` (le code ajoute
   `/smtp/email`).
5. **Redeploy** (une variable ajoutée ne s'applique qu'après redéploiement).
6. Vérifier : `npm run verif:mail -- une-autre-adresse@exemple.tld` doit
   répondre « Accepté par le fournisseur ».

### Limites, dites franchement

- **Délivrabilité** : envoyer depuis une adresse Gmail via Brevo fait échouer
  l'alignement DMARC de Gmail ; le message peut arriver en indésirables.
  Un domaine (même à 2–3 €/an) améliorerait nettement la réception. Sans
  budget, c'est le compromis honnête : ça part, ça peut atterrir en spam.
  L'écran d'attente demande donc déjà de vérifier les indésirables.
- **Quota** : 300/jour. Au-delà, Brevo répond 429 → l'interface affiche
  « trop de demandes » et l'envoi échoue proprement (jamais de faux succès).
- **Pas de domaine = pas de DKIM propre** ; Brevo signe avec le sien. Cela
  n'empêche pas l'envoi, seulement la réputation à long terme.

## Vérification

`tests/mail.test.ts` couvre le contrat Brevo (URL, en-tête `api-key`, payload,
refus 401 → `mail-refuse`) et la priorité d'une URL personnalisée.
`npm test` : 272 tests.

## Ce qui ne change pas

- Aucun secret ne sort du serveur, aucune adresse dans les journaux.
- Un refus reste un refus (`502 mail-refuse`), jamais « pas configuré ».
- `npm run verif:mail` fonctionne avec les deux fournisseurs et rappelle la
  validation d'adresse propre à Brevo.
