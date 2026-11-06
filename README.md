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

Il n'existe pas encore de suite de tests automatisés ; la validation se fait
par `tsc`, le build et des parcours manuels/navigateur.

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` | Clés serveur des fournisseurs IA (jamais exposées au client — voir `docs/architecture/AI-MULTI-PROVIDER.md`) |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Persistance des comptes (Vercel KV). Sans elles, l'API répond honnêtement un 503 « non configuré » |

Aucun secret n'est stocké dans le code ni dans une variable `VITE_*`.

## Architecture et routes

| Route | Page | État |
|---|---|---|
| `/` | Accueil (hero, fil narratif, capacités, galerie, tarifs) | Réel |
| `/login`, `/register` | Authentification (+ entrée volontaire en démonstration) | Réel (serveur) / démo badgée |
| `/documentation` | 6 rubriques avec statut honnête (en rédaction / à venir) | Partiel |
| `/app` | Espace de travail (accueil, composeur, récents) | Réel + démo badgée |
| `/chat` | Conversation (moteur IA multi-fournisseurs côté serveur, historique local) | Réel |
| `/historique` | Fils conservés dans le navigateur | Réel (local) |
| `/explore` | Recherche | **Simulée** (résultats de démonstration badgés) |
| `/studio` | Génération de visuels | **Simulée** (aperçus prédéfinis badgés) |
| `/missions` | Tableau de projets (créer, déplacer, progresser, supprimer) | Réel (local) |
| `/parametres` | Langue, thème, simulation, session | Réel |
| `*` | 404 | Réel |

Points d'API : `GET /api/status` (état honnête du moteur), `POST /api/chat`,
`/api/auth/*`, `/api/me` (+ onboarding).

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
