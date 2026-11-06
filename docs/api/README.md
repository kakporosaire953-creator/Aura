# API AURA

Toutes les réponses sont JSON. Les routes privées exigent le cookie de
session — `aura_session` en développement, `__Host-aura_session` en
production (HttpOnly, SameSite=Lax, Secure, Path=/). Les deux noms sont
acceptés en lecture : une session ouverte avant le changement de nom reste
valide.

Refus distincts, jamais confondus :

| Situation | Réponse |
|---|---|
| Aucune session | `401 { code: "anonyme" }` |
| Cookie présent, session inconnue ou expirée | `401 { code: "session-expiree" }` |
| Stockage injoignable | `503 { code: "stockage-indisponible" }` |
| Tentatives trop nombreuses | `429 { code: "limite" }` |

Les ressources sont toujours résolues dans le périmètre du compte connecté
(un identifiant d'un autre compte renvoie `404`, sans fuite d'existence).

Erreurs uniformes : `{ "error": string, "code": string, "champs"?: { champ: message } }`.

Limitation de débit (compteur partagé dans le stockage, repli mémoire si le
stockage tombe) : connexion 20 / 10 min par IP et 10 / 10 min par adresse,
inscription 30 / 10 min par IP et 10 / heure par adresse, suppression de
compte 5 / 15 min, chat 40 / 5 min par compte, mot de passe oublié
10 / 15 min par IP et 3 / heure par adresse, renvoi de vérification
5 / 15 min par IP et 3 / heure par adresse, vérification 30 / 10 min,
réinitialisation 20 / 10 min, changement de mot de passe 5 / 15 min par compte.

## Historique (compatibilité conservée)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/status` | état honnête : features, setup requis, config.moteur |
| POST | `/api/auth/register` | inscription (email, password ≥ 8, nom) → cookie |
| POST | `/api/auth/login` | connexion → cookie (message d'erreur unique) |
| POST | `/api/auth/logout` | déconnexion (session supprimée serveur) |
| POST | `/api/auth/forgot-password` | `{ email, langue? }` → **202 identique** dans tous les cas ; `503 mail-indisponible` sans fournisseur |
| POST | `/api/auth/reset-password` | `{ token, password }` → mot de passe changé, **toutes les sessions fermées** |
| POST | `/api/auth/verify-email` | `{ token }` → adresse confirmée (usage unique) |
| POST | `/api/auth/resend-verification` | `{ email, langue? }` → **202 identique**, même sans compte |
| GET | `/api/me` | compte courant |
| PATCH | `/api/me/onboarding` | objectif de première utilisation |
| POST | `/api/chat` | message → réponse (non persistée) |

## API v1 — `/api/v1`

### Capacités (publique)
| GET | `/capabilities` | `comptes`, `persistance`, `assistant{ok,streaming,sortieStructuree}`, `recherche{ok,connecteur}`, `studio`, `images`, `fichiers` |

### Compte
| GET | `/me` | compte complet (profil contextuel + préférences) |
| DELETE | `/me` | **suppression de compte** (irréversible) — `{ password }` requis ; efface données, sessions, compte, index email ; `401 identifiants` si mot de passe incorrect ; rate-limit 5 / 15 min |
| PATCH | `/me` | `nom`, `profil{pays,region,languePrincipale,languesSecondaires,devise,fuseau,unites,domaine}` |
| GET | `/preferences` | préférences de réponse |
| PATCH | `/preferences` | `tonReponse`, `utiliserMemoire`, `langueReponse` |

### Sécurité du compte
| GET | `/me/sessions` | sessions ouvertes : `id` (préfixe d'empreinte), `libelle`, `courante`, `cree`, `derniereActivite`, `expire` |
| DELETE | `/me/sessions/:id` | ferme une session distante ; `400 session-courante` pour la sienne, `404` sinon |
| POST | `/me/sessions/revoquer-autrui` | ferme toutes les sessions sauf l'appareil courant → `{ sessionsFermees }` |
| POST | `/me/password` | `{ actuel, nouveau }` ; `401 mot-de-passe` si l'actuel est faux, `400 identique` ; ferme les autres sessions |
| POST | `/me/email/renvoyer` | renvoie le lien de confirmation ; `409 deja-verifie`, `503 mail-indisponible` |

Réponses propres à la récupération : `400 { code: "jeton-invalide" }`
(inexistant ou déjà utilisé), `400 { code: "jeton-expire" }` (lien périmé),
`503 { code: "mail-indisponible" }` (aucun fournisseur configuré — aucun
jeton n'est créé et aucun e-mail n'est annoncé comme parti).

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
