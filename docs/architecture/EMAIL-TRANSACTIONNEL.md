# E-mails transactionnels — architecture

Mission 08. Deux messages seulement : **confirmation d'adresse** et
**réinitialisation de mot de passe**. Ce document décrit le transport, la
configuration, les garanties et le comportement en l'absence de fournisseur.

## 1. Principe : un fournisseur, une abstraction, zéro simulation

```
server/mail/adaptateur.ts   transport HTTP + configuration + garde-fous
server/mail/gabarits.ts     modèles FR/EN (texte + HTML)
server/mail/service.ts      liens + envois des deux messages
```

L'application n'appelle qu'`envoyer()` et `envoyerVerification()` /
`envoyerReinitialisation()`. Changer de fournisseur se limite à
`adaptateur.ts` ; les routes et les gabarits n'ont pas à changer.

Aucun paquet n'a été ajouté : Resend expose une API REST simple, appelée avec
`fetch` (natif Node 18+). Justification : une dépendance npm supplémentaire
pour un `POST` JSON n'apportait rien, et alourdissait la surface d'audit.

## 2. Configuration

| Variable | Rôle | Défaut |
|---|---|---|
| `AURA_MAIL_PROVIDER` | fournisseur pris en charge (`resend` uniquement) | — (obligatoire) |
| `AURA_MAIL_API_KEY` | clé serveur, jamais exposée au navigateur | — (obligatoire) |
| `AURA_MAIL_FROM` | expéditeur, `AURA <bonjour@domaine>` (domaine vérifié chez le fournisseur) | — (obligatoire) |
| `AURA_MAIL_REPLY_TO` | adresse de réponse | absente |
| `AURA_PUBLIC_ORIGIN` | origine des liens (`https://…`, `http://localhost` toléré) | — (obligatoire) |
| `AURA_MAIL_API_URL` | point d'entrée du fournisseur | `https://api.resend.com` |
| `AURA_MAIL_TIMEOUT_MS` | délai maximal d'un envoi | `8000` (borné 1 000–20 000) |

`AURA_PUBLIC_ORIGIN` est **obligatoire et déclarative** : un lien de
réinitialisation ne doit jamais être construit à partir de l'en-tête `Host`
d'une requête, sous peine de rediriger l'utilisateur vers un domaine
contrôlé par un attaquant.

### État sur cet environnement

Le fournisseur **n'est pas configuré** dans l'environnement de développement
utilisé pour cette mission (aucune clé réelle n'a été demandée ni créée).
Conséquence assumée et vérifiée par les tests : les routes concernées
répondent `503 { code: "mail-indisponible" }`, aucun jeton n'est créé, aucun
message n'est annoncé comme envoyé. **Aucun envoi réel n'a été effectué.**

## 3. Contrat d'envoi

```json
POST {AURA_MAIL_API_URL}/emails
{
  "from": "AURA <bonjour@domaine>",
  "to": ["claire@exemple.test"],
  "subject": "Réinitialisez votre mot de passe AURA",
  "html": "…",
  "text": "…",
  "reply_to": "optionnel"
}
```

- Un seul essai, pas de file d'attente : un échec est rendu à l'appelant.
- Statut non 2xx → `{ ok: false, code: 'mail-refuse' }` ; l'interface l'affiche.
- Délai dépassé (`AbortController`) → même refus, message distinct.
- Journaux : **statut HTTP uniquement**. Jamais l'adresse, jamais le jeton,
  jamais le corps du message.

## 4. Contenu des messages

Direction artistique respectée : ivoire `#FBFAF5`, encre `#12211B`, accent
lime `#A5E838`, titres serif (Fraunces côté site, Georgia en repli côté
messagerie), mise en page en tableaux et styles en ligne, **aucune image
distante** (donc aucun pixel de suivi, aucune requête vers un tiers).

Chaque message contient :

- une salutation et une phrase d'intention (pas de jargon) ;
- un bouton d'action (lime, texte encre) ;
- la durée de validité et la mention « une seule fois » ;
- le lien en clair, pour les clients qui bloquent les boutons ;
- une phrase explicite pour celui qui n'a rien demandé ;
- une version texte pour les clients sans HTML.

Le nom du fournisseur d'envoi n'apparaît **jamais** dans le message.

## 5. Sécurité du rendu

- Le nom du destinataire est échappé (`&`, `<`, `>`, `"`) avant insertion :
  un nom de compte ne peut pas injecter de balise dans l'e-mail.
- Le lien est construit côté serveur depuis la configuration, et passé dans
  l'échappement HTML comme les autres valeurs.
- Aucune balise `<script>`, aucun formulaire, aucune iframe.

## 6. Erreurs et honnêteté

| Situation | Réponse de l'API | Message à l'utilisateur |
|---|---|---|
| Fournisseur absent | `503 mail-indisponible` | « L'envoi d'e-mails n'est pas configuré sur cet environnement. » |
| Fournisseur en échec | `503 mail-indisponible` | « Le service d'e-mails ne répond pas. » |
| Demande acceptée | `202 { ok: true }` | « Si un compte est associé à cette adresse, un e-mail vient de partir. » |

Le `202` est volontairement conditionnel dans sa formulation : c'est la même
réponse pour une adresse connue et inconnue.

## 7. Tests

`tests/mail.test.ts` (18 tests) couvre, sans réseau (fetch bouchonné) :

- absence de configuration → refus, zéro requête sortante ;
- configuration incomplète (clé, expéditeur, origine) → refus ;
- origine non HTTPS hors localhost → refus ; identifiants dans l'URL → refus ;
- requête conforme (URL, `Authorization`, `from`, `to`, `subject`, corps) ;
- `reply_to` seulement s'il est configuré ;
- 403 fournisseur → `mail-refuse` ; panne réseau → `mail-refuse` ;
- délai maximal respecté (AbortController) ;
- modèles FR/EN : sujet, lang, durée, mention de non-demande, échappement,
  absence du nom du fournisseur ;
- liens `/verifier-email` et `/reinitialiser` issus de l'origine configurée.

`tests/recuperation.test.ts` vérifie de bout en bout que, sans fournisseur,
aucun jeton ne subsiste en base et qu'aucun e-mail n'est capturé.
