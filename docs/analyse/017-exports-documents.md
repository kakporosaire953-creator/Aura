# 017 — Exports Word et PDF des livrables

**Date** : 2026-10-23 · **Branche** : `arena/7e4763bb-aura`

## Demande

Après la remise en route des comptes, du chat et des e-mails, trois manques
restaient visibles en production :

1. les réponses du chat étaient jugées lentes ;
2. le Studio ne produisait pas d'image ;
3. les livrables ne s'exportaient qu'en Markdown (imprimer → PDF via le
   navigateur), pas en fichier Word.

Ce document traite les points 1 et 3. Le point 2 (génération d'images) n'est
pas un réglage : aucun adaptateur du moteur ne déclare `generationImages`
(voir plus bas).

## 1. Lenteur du chat : ce qui a été constaté

Le streaming est réel (SSE, `text/event-stream`, un événement par morceau) et
l'interface l'utilise. La lenteur perçue ne vient donc pas d'une réponse
« d'un bloc ». Elle vient de la chaîne de repli :

- ordre par défaut `gemini → groq → openrouter` ;
- `AI_REQUEST_TIMEOUT_MS` par défaut à 60 s : un moteur muet bloque une
  minute avant la bascule ;
- `AI_MAX_RETRIES` par défaut à 2 : jusqu'à trois tentatives par message ;
- une erreur `400` (clé invalide) **interrompt** la chaîne
  (`estRecuperable('validation') === false`), elle ne bascule pas.

Remèdes, sans code — variables d'environnement Vercel (Production + Preview) :

| Variable | Valeur conseillée | Effet |
|---|---|---|
| `AI_DEFAULT_PROVIDER` | `groq` | commence par le moteur le plus rapide disponible |
| `AI_REQUEST_TIMEOUT_MS` | `20000` | bascule après 20 s au lieu de 60 |
| `AI_MAX_RETRIES` | `1` | deux moteurs essayés au maximum |

Mesure : les journaux Vercel contiennent `[ia] <tâche> → <fournisseur>/<modèle>
en N ms (k bascule(s))`. `k > 0` désigne le coût du repli, pas celui du modèle.

## 2. Exports Word (`.docx`) et PDF, sans dépendance

### Ce qui a été ajouté

| Fichier | Rôle |
|---|---|
| `server/export/blocs.ts` | Markdown d'une création → blocs typés (titres, listes, citations, code) + nom de fichier sûr |
| `server/export/zip.ts` | écriture ZIP minimale (méthode « stored », CRC-32, répertoire central) |
| `server/export/docx.ts` | assemblage OOXML : `[Content_Types].xml`, `_rels/.rels`, `word/document.xml` |
| `server/export/pdf.ts` | PDF 1.4 : A4, marges 2 cm, Helvetica/Bold/Courier, WinAnsi, pagination, pied de page |

### Routes

| Route | Réponse |
|---|---|
| `GET /api/v1/studio/artifacts/:id` | Markdown (comportement historique conservé) |
| `GET /api/v1/studio/artifacts/:id/docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `GET /api/v1/studio/artifacts/:id/pdf` | `application/pdf` |

`?version=N` cible une version précise ; une version inexistante répond `404`
avec le code `version-introuvable` — jamais un remplacement silencieux par la
dernière version.

### Pourquoi aucune bibliothèque

Le dépôt suit déjà cette règle ailleurs (client KV, client e-mail : aucun SDK).
Un `.docx` est une archive ZIP de trois fichiers XML, un PDF textuel est une
suite d'objets et d'une table `xref` : les deux tiennent en quelques centaines
de lignes, contre plusieurs centaines de kilo-octets de dépendances chargées à
chaque démarrage à froid de la fonction serverless.

### Limites assumées

- Pas d'italique dans le PDF : les polices standard n'en fournissent pas sans
  embarquer un fichier de police. Les citations sont rendues en gris.
- Le PDF ne reprend pas les images d'une création (il n'y en a pas
  actuellement) ni les tableaux Markdown (rendus en texte).
- Le DOCX n'embarque pas de styles nommés : la mise en forme est portée par
  les runs, ce qui reste ouvrable et modifiable dans Word, LibreOffice et
  Google Docs.

## 3. Vérifications exécutées

- `tests/export-documents.test.ts` (13 tests) : structure ZIP relisible et CRC,
  XML échappé (`<`, `&`, guillemets), absence de caractères de contrôle,
  en-tête `%PDF-1.4`, table `xref` dont chaque offset pointe sur `N 0 obj`,
  longueurs de flux exactes, accents en WinAnsi (`\351`), échappement des
  parenthèses, pagination et pied de page, coupe des lignes sans perte de mot.
- `tests/api.test.ts` : parcours réel — création, révision, puis
  téléchargement `.docx` (`PK`), `.pdf` (`%PDF-1.4`), `?version=1`, et refus
  `404 version-introuvable` pour une version absente.
- `npm test` : **202/202** · `tsc --noEmit` : 0 erreur · `npm run verif:prod`.
- Contrôle visuel : PDF rendu (MuPDF) et relu (texte extrait, accents et
  typographie corrects) ; DOCX relu par `python-docx` (15 paragraphes, titre
  en gras 18 pt).

## 4. Génération d'images : état réel

Aucun adaptateur ne la fournit : `generationImages: false` dans
`gemini.ts`, `groq.ts`, `openrouter.ts` et `mock.ts`. Le bloc visuel du Studio
est un **aperçu explicitement badgé « Démonstration »**, dont le texte annonce
qu'aucune image n'est produite par une IA. Ce n'est pas une panne.

Pour la rendre réelle, il faut : un modèle d'image (payant à l'image), un
stockage de fichiers (Vercel Blob ; le KV plafonne à 1 Mo par valeur), le
branchement UI et les tests. Décision produit à prendre, pas une variable
d'environnement à ajouter.
