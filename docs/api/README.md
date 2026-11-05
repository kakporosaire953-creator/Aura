# API AURA

Toutes les réponses sont JSON. Les routes privées exigent le cookie de
session `aura_session` (HttpOnly, SameSite=Lax, Secure en production) ; sans
session valide : `401 { error, code: "anonyme" }`. Les ressources sont
toujours résolues dans le périmètre du compte connecté (un identifiant
d'un autre compte renvoie `404`, sans fuite d'existence).

Erreurs uniformes : `{ "error": string, "code": string, "champs"?: { champ: message } }`.

## Historique (compatibilité conservée)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/status` | état honnête : features, setup requis, config.moteur |
| POST | `/api/auth/register` | inscription (email, password ≥ 8, nom) → cookie |
| POST | `/api/auth/login` | connexion → cookie (message d'erreur unique) |
| POST | `/api/auth/logout` | déconnexion (session supprimée serveur) |
| GET | `/api/me` | compte courant |
| PATCH | `/api/me/onboarding` | objectif de première utilisation |
| POST | `/api/chat` | message → réponse (non persistée) |

## API v1 — `/api/v1`

### Capacités (publique)
| GET | `/capabilities` | `comptes`, `persistance`, `assistant{ok,streaming,sortieStructuree}`, `recherche{ok,connecteur}`, `studio`, `images`, `fichiers` |

### Compte
| GET | `/me` | compte complet (profil contextuel + préférences) |
| PATCH | `/me` | `nom`, `profil{pays,region,languePrincipale,languesSecondaires,devise,fuseau,unites,domaine}` |
| GET | `/preferences` | préférences de réponse |
| PATCH | `/preferences` | `tonReponse`, `utiliserMemoire`, `langueReponse` |

### Conversations
| GET | `/conversations` | `?q=`, `?projectId=`, `?archivees=1` |
| POST | `/conversations` | `{ titre?, projectId? }` |
| GET | `/conversations/:id` | conversation + messages |
| PATCH | `/conversations/:id` | `{ titre?, archive?, projectId? }` |
| DELETE | `/conversations/:id` | suppression (messages inclus) |
| POST | `/conversations/:id/messages` | `{ contenu }` → `{ message, reponse }` ; `{ regenerer: true }` régénère ; `stream: true` (ou `Accept: text/event-stream`) → flux SSE `chunk`/`done`/`error` |

### Projets
| GET | `/projets` | `?archives=1` |
| POST | `/projets` | `{ nom, description?, objectif?, categorie?, instructions? }` |
| GET | `/projets/:id` | projet + conversations/missions/mémoires/créations/recherches rattachées |
| PATCH | `/projets/:id` | champs + `statut: actif\|archive` |
| DELETE | `/projets/:id` | suppression (éléments rattachés détachés) |

### Missions
| GET | `/missions` | `?projectId=`, `?statut=` |
| POST | `/missions` | `{ titre, description?, priorite?, statut?, echeance?, projectId?, sousTaches?: string[], notes? }` |
| POST | `/missions/batch` | création groupée après validation utilisateur |
| POST | `/missions/aide` | `{ objectif }` → `proposition[]` **non enregistrée** (l'utilisateur valide) |
| PATCH | `/missions/:id` | dont `sousTaches[{id?,titre,fait}]` |
| DELETE | `/missions/:id` |

Statuts : `a_faire`, `en_cours`, `en_attente`, `terminee`, `archivee`.
Priorités : `basse`, `moyenne`, `haute`, `urgente`.

### Mémoire
| GET | `/memoires` | `?actives=1`, `?projectId=` |
| POST | `/memoires` | `{ contenu, type?, projectId? }` |
| PATCH | `/memoires/:id` | `{ contenu?, type?, actif? }` |
| DELETE | `/memoires/:id` | |
| DELETE | `/memoires` | effacement complet (destructif, confirmé côté UI) |

### Explorer
| GET | `/search` | recherches sauvegardées |
| GET | `/search/:id` | + sources |
| POST | `/search` | `{ requete, projectId?, langue? }` → synthèse + sources réelles ; `503` honnête sans moteur |
| DELETE | `/search/:id` |

### Studio
| GET | `/studio/jobs` | créations (versions sans corps) |
| POST | `/studio/jobs` | `{ type, instruction, titre?, projectId?, langue? }` → génération réelle |
| GET | `/studio/jobs/:id` | + versions complètes |
| POST | `/studio/jobs/:id/versions` | `{ instruction? }` → nouvelle version |
| GET | `/studio/artifacts/:id` | export Markdown (dernière version) |
| DELETE | `/studio/jobs/:id` |

Types de création : `document`, `resume`, `rapport`, `texte_professionnel`,
`publication`, `presentation`, `code`, `plan`, `creatif`.

### Limites et rate limiting
- Messages : 40 / 5 min / compte ; aide IA et recherches : 12 / 5 min ;
  créations : 12 / 10 min. Réponse `429 { code: "limite" }`.
- Corps JSON limité (32–64 ko) ; contenu de message limité à 8000 caractères.
- Erreurs moteur typées : `cle-manquante` (503), `limite-modele` (429),
  `bloque` (422), `modele-indisponible` (502), `annule`, `timeout`.
