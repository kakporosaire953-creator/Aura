# 021 — « L'envoi a échoué : l'envoi d'e-mails n'est pas configuré »

**Date** : 2026-11-09 · **Branche** : `arena/33829144-aura`

## Symptôme rapporté

Les variables d'e-mails sont configurées (`/api/status` répond
`mailConfiguree: true`), mais un nouvel inscrit voit, sur l'écran d'attente :

> « L'envoi a échoué : l'envoi d'e-mails n'est pas configuré sur cet
> environnement. »

## Ce qui se passait réellement

Le message venait de la clé de traduction `confirmerEchec`, affichée pour
**n'importe quel** échec du renvoi. Côté serveur, deux causes très différentes
étaient fusionnées :

```
// avant — la cause est perdue
if (!envoi.ok) {
  res.status(503).json({ code: 'mail-indisponible', error: … });
}
```

- configuration absente → `mail-indisponible` (503) : personne ne peut rien
  envoyer ;
- **fournisseur qui refuse** (domaine non vérifié, expéditeur non autorisé,
  quota épuisé, clé invalide, panne) → aussi `mail-indisponible`.

L'interface ne pouvait donc pas distinguer les deux et affichait « pas
configuré » dans les deux cas. La configuration était bonne : c'est le
fournisseur qui refusait, et personne ne pouvait le savoir.

## Correctif

1. **Codes distincts** (`server/v1/routesCompte.ts`) :
   - `503 mail-indisponible` — la configuration manque, aucun envoi tenté ;
   - `502 mail-refuse` — configuration complète, envoi refusé ou injoignable.
2. **Message exact du fournisseur journalisé** (`server/mail/adaptateur.ts`) :
   `[mail] envoi refusé par le fournisseur (403) — The … domain is not
   verified.` Les adresses sont remplacées par `[adresse]` ; ni clé, ni
   destinataire n'apparaissent. C'est cette ligne qui donne la cause dans les
   journaux Vercel.
3. **L'inscription dit la vérité tout de suite** (`server/api.ts`) : l'envoi
   est attendu (au plus 8 s, un seul essai) et la réponse porte
   `envoiMail: { ok: false, code: "mail-refuse" }`. L'écran d'attente ouvre
   alors directement sur le bon message, au lieu d'attendre un clic.
4. **Interface honnête** (`src/app/gardes.tsx`, dictionnaires) :
   `mail-indisponible` → « pas configuré », `mail-refuse` → « le service
   d'e-mails a refusé le message », `limite` → « trop de demandes », tout le
   reste → échec générique. Plus jamais « pas configuré » quand ce n'est pas
   le cas.

## Diagnostiquer un refus en une commande

```bash
npm run verif:mail -- destinataire@exemple.tld
```

Le script `scripts/verifier-mail.ts` utilise **le même code que le serveur**
(aucune règle dupliquée), affiche la configuration effective (clé jamais
affichée, destinataire masqué), tente un envoi réel puis traduit le refus :

| Statut | Cause probable |
|---|---|
| 401 / 403 | clé invalide, **domaine d'envoi non vérifié**, ou expéditeur de test (`onboarding@resend.dev`) qui ne peut écrire qu'au titulaire du compte |
| 422 | expéditeur mal formé (attendu : `AURA <bonjour@domaine.tld>`) |
| 429 | quota atteint (offre gratuite : 100/jour) |
| 5xx | panne du fournisseur |
| aucun statut | réseau, pare-feu ou délai dépassé |

## Le cas le plus probable ici

Avec un expéditeur sur un domaine **non vérifié** chez le fournisseur, ou un
expéditeur de test `onboarding@resend.dev`, les messages vers une adresse
autre que celle du titulaire du compte sont refusés (403). L'envoi vers sa
propre adresse fonctionne, ce qui donne l'impression que « ça marche » — et
c'est exactement le symptôme décrit : *un autre utilisateur* ne reçoit rien.

Marche à suivre : vérifier le domaine chez le fournisseur, poser
`AURA_MAIL_FROM="AURA <bonjour@domaine-vérifié>"`, **Redeploy**, puis relancer
`npm run verif:mail -- une-autre-adresse@exemple.tld`.

## Vérification

`tests/mail-echecs.test.ts` (7 tests) couvre : configuration absente →
`mail-indisponible` sans appel réseau ; refus 403 et quota 429 →
`mail-refuse` ; inscription annonçant `envoiMail` ; renvoi 502/503/202 selon
le cas. `npm test` : 268 tests verts.
