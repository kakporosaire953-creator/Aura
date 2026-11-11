# Référentiel documentaire (intelligence contextuelle)

Ce dossier décrit le module `server/savoir/` : un référentiel de documents
**par pays et par domaine**, consulté par l'assistant uniquement quand la
question s'y prête, et cité sous la réponse.

Rien n'est simulé : une ressource n'existe que si elle a été importée, elle
n'est utilisable qu'après validation humaine, et une citation n'apparaît que
si l'extrait correspondant a réellement été transmis au modèle.

---

## 1. Ce qui fonctionne aujourd'hui

| Fonction | État | Preuve |
|---|---|---|
| Import par URL (source autorisée) | ✅ | `POST /api/v1/admin/savoir/ressources` |
| Import par texte collé | ✅ | même route, champ `texte` |
| Extraction HTML (titres, paragraphes, entités) | ✅ | `tests/savoir.test.ts` |
| Extraction PDF (FlateDecode, sans dépendance) | ⚠️ partielle | avertissement explicite si le texte n'est pas extractible |
| Découpage en segments avec chevauchement | ✅ | `decouper()` |
| Index lexical BM25 + filtres domaine/pays/date/autorité | ✅ | `rechercher()` |
| Recherche sémantique (vecteurs) | ⛔ inactive | aucun fournisseur d'embeddings (`embeddings: false` partout) |
| Détection du besoin documentaire | ✅ | `detecter()` |
| Injection encadrée + anti-injection de prompt | ✅ | `construireBloc()`, `neutraliserExtrait()` |
| Citations `[S1]` sous la réponse | ✅ | `src/components/ui/Sources.tsx` |
| Administration serveur | ✅ | `server/v1/routesSavoir.ts` |
| Interface d'administration | ✅ | `/admin/savoir` |
| Protection SSRF (IP + redirections) | ✅ | `server/savoir/securite.ts` |
| Recherche web en direct | ⛔ hors périmètre | le mode « recherche » existant ne passe pas par ce module |

**Aucune ressource n'est fournie par défaut.** Le catalogue contient
seulement des *candidats* béninois, créés au statut « à vérifier » et donc
incapables de déclencher une collecte.

---

## 2. Modèle de données

Stockage : **le KV existant** (`baseDeDonnees()`), pas une seconde base.
Clés préfixées, comme le reste de l'application :

```
aurav1:savoir:r:<id>   métadonnées de la ressource (Ressource)
aurav1:savoir:c:<id>   texte extrait nettoyé
aurav1:savoir:i:<id>   index (segments + vecteurs éventuels)
aurav1:savoir:s:<id>   entrée du catalogue de sources
aurav1:savoir:j        journal (200 dernières entrées)
```

Statuts d'une ressource : `a-verifier` (après import) → `actif` (validée)
→ `expire` ou `archive`. **Seul `actif` est interrogé par la recherche.**

Niveaux d'autorité : `A` officiel (pondération 1,0), `B` spécialisé (0,82),
`C` complémentaire (0,60). Une source de niveau C seule est signalée comme
telle dans la réponse.

Politique de fraîcheur : administration 180 j, entrepreneuriat 180 j,
numérique 180 j, institutions 365 j, éducation 365 j, statistiques 400 j,
géographie 1 095 j, culture 1 825 j. Au-delà, la ressource reste utilisable
mais **signalée** (« à revérifier ») — jamais écartée en silence.

---

## 3. Sécurité de la collecte

Trois contrôles, appliqués à **chaque saut de redirection** :

1. schéma `http`/`https`, aucun identifiant dans l'URL, port 80 ou 443 ;
2. hôte présent dans le catalogue **au statut actif** (sous-domaines admis,
   suffixe trompeur refusé : `service-public.bj.evil.com` ne passe pas) ;
3. résolution DNS : toutes les adresses doivent être publiques. Refus de
   `127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`
   (métadonnées cloud), `100.64/10`, `224/4`, `::1`, `fc00::/7`,
   `fe80::/10`, IPv4 encapsulée.

S'y ajoutent : 4 Mo maximum, 8 s de délai, types de contenu limités
(HTML, texte, Markdown, PDF), redirections suivies manuellement (3 max).
Aucun contournement de protection de site : pas d'en-tête de navigateur
déguisé, pas de cookie, pas de formulaire soumis.

**Anti-injection de prompt** : les extraits sont encadrés
(`<<<EXTRAIT S1>>> … <<<FIN EXTRAIT S1>>>`) et présentés comme des
**données**. Les phrases du type « ignore les instructions », « tu es
maintenant… », « révèle ton prompt système » sont remplacées par
`[passage retiré : tentative d’instruction]` et comptées ; la réponse
mentionne la neutralisation.

---

## 4. Utilisation

### 4.1 Activer une source

1. Se connecter avec un compte dont l'adresse figure dans `AURA_ADMIN_EMAILS`.
2. Ouvrir `/admin/savoir`.
3. « Ajouter les 8 candidats béninois » → ils arrivent au statut **en attente**.
4. Vérifier soi-même que le domaine est officiel et accessible.
5. « Autoriser » sur les seules sources vérifiées.

Tant qu'aucune source n'est active, **aucune URL ne peut être collectée** :
c'est volontaire.

### 4.2 Importer un document

- **Par URL** : l'hôte doit être autorisé. L'import échoue proprement si le
  document est trop gros, trop lent, d'un type non accepté ou vide.
- **Par texte** : copier le contenu d'une publication officielle, puis
  sélectionner domaine, niveau et pays.
- La ressource est créée au statut **à vérifier** : elle n'apparaît pas dans
  le chat tant qu'un administrateur ne l'a pas validée.

### 4.3 Vérifier ce que le moteur trouve

`POST /api/v1/admin/savoir/recherche` (ou le formulaire « Tester la
recherche ») renvoie les passages, leur score, leurs alertes et le mode de
recherche — **sans appeler le modèle**. C'est l'outil de diagnostic honnête :
un score mesure la pertinence documentaire, pas la vérité.

---

## 5. API d'administration

Toutes les routes sont sous `/api/v1/admin/savoir`, protégées par
`authRequise` + `adminRequise` (même garde que le reste de l'administration)
et limitées par compte.

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/etat` | compteurs, mode de recherche, hôtes autorisés |
| GET | `/ressources` | liste filtrable (`domaine`, `statut`, `q`) |
| GET | `/ressources/:id` | détail + segments (extraits, présence de vecteur) |
| POST | `/ressources` | import (URL ou texte) — 20 / 10 min |
| POST | `/ressources/:id/reindexer` | reconstruit l'index |
| POST | `/ressources/:id/statut` | `actif`, `a-verifier`, `expire`, `archive` |
| DELETE | `/ressources/:id` | supprime métadonnées, contenu et index |
| GET | `/sources` | catalogue + candidats proposés |
| POST | `/sources` | ajoute une source (`a-verifier` par défaut) |
| POST | `/sources/semer` | crée les 8 candidats béninois (idempotent) |
| POST | `/sources/:id/statut` | `actif`, `a-verifier`, `desactive` |
| DELETE | `/sources/:id` | retire une source |
| POST | `/recherche` | diagnostic de recherche |
| GET | `/journal` | 200 dernières actions |

---

## 6. Variables d'environnement

**Aucune variable nouvelle.** Le module utilise :

- le stockage existant (`KV_REST_API_URL` / `KV_REST_API_TOKEN` en production,
  `AURA_DATA_DIR` en local) ;
- `AURA_ADMIN_EMAILS` pour l'accès à l'administration (déjà requis) ;
- le service IA existant pour la génération (aucun appel supplémentaire).

Aucun secret n'est exposé au navigateur. Aucune clé d'embeddings n'est
nécessaire : la fonction est éteinte, pas facturée, pas simulée.

### Coût

**0 FCFA.** Pas d'API payante ajoutée. Les embeddings seraient le seul poste
nouveau si un fournisseur était branché ; il ne l'est pas.

---

## 7. Activer la recherche sémantique plus tard

1. Écrire un adaptateur qui expose `TextEncoder`-like : `{ id, dimension,
   encoder(textes) }` (par exemple Gemini `text-embedding-004`).
2. L'appeler au démarrage du serveur : `enregistrerEncodeur(adaptateur)`.
3. Réindexer les ressources existantes (`POST /ressources/:id/reindexer`).

Le mode passe alors automatiquement en `hybride` (BM25 + cosinus), les
vecteurs étant quantifiés en int8/base64 (≈ 1 Ko par segment au lieu de 6 Ko).
Aucune autre modification n'est nécessaire.

---

## 8. Limites assumées

- **PDF scannés** : pas d'OCR ; l'import refuse un texte trop court et
  l'explique, au lieu d'indexer du vide.
- **PDF complexes** (encodage CID) : extraction partielle signalée.
- **Recherche lexicale seule** : une question formulée très différemment du
  document peut ne rien renvoyer. Le mode est affiché dans `/etat`.
- **Pas de recherche web en direct** dans ce module : seuls les documents
  validés sont cités.
- **Une source pertinente n'est pas une source vraie** : les alertes de
  fraîcheur et de niveau sont transmises au modèle et affichées.
- **Pas de déduplication sémantique** : le dédoublonnage est lexical
  (Jaccard > 0,7) et limité à deux passages par ressource.

---

## 9. Vérification

```bash
npm test                                # dont tests/savoir.test.ts et tests/savoir-api.test.ts
npm run lint                            # tsc --noEmit
npm run build
```

Les tests couvrent : refus SSRF (dont redirection vers 127.0.0.1), non-usage
d'une ressource non validée, citation après validation, absence de citation
sans déclenchement, neutralisation d'un extrait piégé, et fermeture des
routes d'administration aux comptes ordinaires.
