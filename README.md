# AURA — De l'idée au résultat.

AURA est une plateforme d'intelligence artificielle française qui réunit
conversation, recherche sourcée, création et exécution dans un seul fil de
pensée — du prompt au livrable.

> **Chantier en cours.** Le produit est reconstruit par incréments autour de
> l'identité **« Rubans & sculpture »** dérivée du logo officiel. Ce qui est
> annoncé comme vivre fonctionne réellement ; ce qui est simulé est marqué
> comme simulé (bannière et badges « Simulé »).

## Stack

- **Front** : React 19, React Router 7, Vite 8, TypeScript, GSAP + ScrollTrigger, Three.js (sculpture 3D), Lottie (`@lottiefiles/dotlottie-react`), Font Awesome.
- **Serveur** : Express (dev) + fonction serverless Vercel (`api/index.ts`), source unique `server/`.
- **Authentification réelle** : comptes persistés (Vercel KV), mots de passe hachés avec **scrypt** (sel par utilisateur, comparaison à temps constant).
- **Déploiement** : Vercel (SPA + API serverless, `vercel.json`).

## Démarrer

```bash
npm install --legacy-peer-deps
npm run dev      # http://localhost:3000
npm run build    # build de production
npm run lint     # vérification TypeScript (tsc --noEmit)
```

```bash
npm test           # tests unitaires, d'intégration et d'interaction (base de test isolée)
                   # 176 tests ; l'interface est testée dans un DOM simulé (jsdom),
                   # pas dans un vrai navigateur — voir docs/analyse/015-tests-navigateur.md
npm run verif:prod # construit, puis vérifie que la production ne peut pas
                   # activer le mode simulation (voir scripts/verifier-prod.cjs)
npm run diagnostic -- https://votre-site
                   # état réel de l'authentification en ligne (lecture seule,
                   # aucun compte créé) — voir docs/operations/ACTIVER-COMPTES-ET-EMAILS.md
```

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` | Clés serveur des fournisseurs IA (jamais exposées au client — voir `docs/architecture/AI-MULTI-PROVIDER.md`) |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Persistance des comptes (Vercel KV). Sans elles, l'API répond honnêtement un 503 « non configuré » |
| `AURA_DATA_DIR` | Dossier du pilote fichier (développement, auto-hébergement) |
| `AURA_TRUST_PROXY=1` | À poser seulement derrière un proxy de confiance (Vercel le fait automatiquement). Sans proxy, aucune confiance n'est accordée à `x-forwarded-for` |
| `AURA_MAIL_PROVIDER`, `AURA_MAIL_API_KEY`, `AURA_MAIL_FROM`, `AURA_PUBLIC_ORIGIN` | Envoi des e-mails de vérification et de récupération (Resend en REST). Sans configuration complète, ces routes répondent `503` — aucun envoi simulé (voir `docs/architecture/EMAIL-TRANSACTIONNEL.md`) |
| `AURA_JETON_VERIFICATION_HEURES`, `AURA_JETON_REINITIALISATION_MINUTES` | Durées de vie des jetons (24 h / 30 min par défaut, bornées côté serveur) |

Aucun secret n'est stocké dans le code ni dans une variable `VITE_*`.

## Architecture et routes

| Route | Page | État |
|---|---|---|
| `/` | Accueil (hero, fil narratif, capacités, galerie, tarifs) | Réel |
| `/login`, `/register` | Authentification (entrée en démonstration en développement seulement) | Réel (serveur) |
| `/mot-de-passe-oublie` | Demande de réinitialisation (réponse identique quelle que soit l'adresse) | Réel (serveur) |
| `/reinitialiser` | Nouveau mot de passe depuis le lien reçu (usage unique) | Réel (serveur) |
| `/verifier-email` | Confirmation d'adresse depuis le lien reçu | Réel (serveur) |
| `/documentation` | 6 rubriques avec statut honnête (en rédaction / à venir) | Partiel |
| `/app` | Espace de travail (accueil, composeur, récents) | Réel + démo badgée |
| `/chat` | Conversation (moteur IA multi-fournisseurs côté serveur, historique local) | Réel |
| `/historique` | Fils conservés dans le navigateur | Réel (local) |
| `/explore` | Recherche | **Simulée** (résultats de démonstration badgés) |
| `/studio` | Génération de visuels | **Simulée** (aperçus prédéfinis badgés) |
| `/missions` | Tableau de projets (créer, déplacer, progresser, supprimer) | Réel (local) |
| `/parametres` | Langue, thème, simulation, session, sécurité (mot de passe, sessions actives, adresse) | Réel |
| `*` | 404 | Réel |

Points d'API : `GET /api/status` (état honnête du moteur), `POST /api/chat`,
`/api/auth/*` (dont `forgot-password`, `reset-password`, `verify-email`,
`resend-verification`), `/api/me` (+ onboarding), et côté v1 `POST /me/password`,
`GET /me/sessions`, `DELETE /me/sessions/:id`, `POST /me/sessions/revoquer-autrui`,
`POST /me/email/renvoyer`. Détail : `docs/api/README.md`.

## Modes : réel et démonstration

- En **développement**, le mode simulation est actif par défaut (bascule
  dans la barre de navigation) ; en **production**, il est désactivé par
  défaut et s'active uniquement par une action volontaire (bouton « Voir la
  démonstration » ou bascule).
- Le mode démonstration ne stocke **aucun mot de passe** et ne donne accès à
  aucun privilège réel : ses comptes vivent dans le stockage local du
  navigateur, clairement séparés des comptes serveur.
- Les données locales (historique, missions, récents) restent dans le
  navigateur utilisé : ce n'est pas une synchronisation cloud.

## Identité

- Logo officiel : `public/assets/` (ne jamais redessiner, recolorer ni déformer).
- Palette dérivée du logo : vert `#43BC2C`, lime `#A5E838`, or `#EACB37`, feu `#FF790D`.
- Typographie : Fraunces (titres) + Manrope (textes).
- Direction artistique : rubans fluides, lumière solaire, éditorial sculptural.
