# Aura — Plateforme d'Intelligence Artificielle Multimodale

> **« Plus qu'une IA. Un espace pour créer demain. »**

Aura est une plateforme d'intelligence artificielle tout-en-un et un espace de travail intelligent conçu pour aider les étudiants, développeurs, entrepreneurs, créateurs de contenu et équipes (en Afrique francophone et à l'international) à réfléchir, apprendre, rechercher, programmer et créer depuis une seule interface.

---

## 1. Lancer le projet

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur full-stack (Express + Vite sur le port 3000)
npm run dev

# 3. Compiler pour la production
npm run build
```

---

## 2. Architecture de la plateforme

- **Frontend (`/src`)** :
  - `src/components/brand/AuraLogo.tsx` : Symbole propriétaire Aura (rubans organiques entrelacés vert `#078348` → vert lumineux `#8CCB4A` → jaune `#EACB37` → orange `#FF790D`) en version icône, logo horizontal et sculpture centrale 3D.
  - `src/components/workspace/PromptComposer.tsx` : Composant de saisie unifié aux 4 modes avec gestion réelle des pièces jointes (images, documents, code).
  - `src/components/workspace/MessageList.tsx` : Rendu conversationnel avec blocs de code, **aperçu HTML/CSS/JS interactif en direct (sandbox)**, citations de sources web vérifiées et sauvegarde dans la bibliothèque.
  - `src/pages/` : `LandingPage` (`/`), `WorkspacePage` (`/app`, `/app/chat/:conversationId`), `LibraryPage` (`/app/history`), `ProjectsPage` (`/app/projects`), `ExplorePage` (`/app/explore`), `UsagePage` (`/app/usage`), `SettingsPage` (`/app/settings`), `AuthPage` (`/login`, `/register`, `/forgot-password`) + pages marketing (`/features`, `/features/:module`, `/about`, `/contact`, 404).
- **Aura Studio (produit créatif de première classe)** :
  - `src/pages/studio/` : `StudioGalleryPage` (`/app/studio` — galerie des créations réelles), `StudioNewPage` (`/app/studio/new` — workflow de génération), `StudioPreviewPage` (`/app/studio/:id/preview` — aperçu immersif plein écran avec viewports ordinateur/tablette/mobile réels), `StudioDevelopPage` (`/app/studio/:id/develop` — Developer Mode : explorateur de fichiers, éditeur CodeMirror, aperçu en direct).
  - `src/components/studio/` : `StudioPreviewFrame` (iframe **sandboxée sans `allow-same-origin`** — le code généré n'accède jamais à l'application Aura), `StudioFileExplorer`, `StudioCodeEditor` (CodeMirror 6, chargé dynamiquement), `StudioProjectCard`, `StudioIterateBar`.
  - `src/shared/studio.ts` : helpers partagés (composition d'aperçu isolé, extraction de fichiers, validation de compilation) — utilisés par le serveur et le client.
  - `src/services/studioService.ts` : client API Studio (CRUD, versions, export ZIP, itérations IA).
- **Backend (`/server.ts` & `/src/server`)** :
  - `src/server/ai/` : Couche d'abstraction multi-fournisseurs (`AIProviderAdapter`) avec `GeminiProviderAdapter` (actif via `@google/genai`), `OpenAIProviderAdapter` et `AnthropicProviderAdapter`.
  - `src/server/ai/studioGenerator.ts` : prompts de génération/édition Studio et ré-export des helpers de fichiers (indépendant du fournisseur).
  - `src/server/zip.ts` : générateur d'archives ZIP (sans dépendance) pour l'export réel des projets.
  - `src/server/dataStore.ts` : Persistance serveur (`.data/aura-store.json`), hachage cryptographique des mots de passe (`crypto.scryptSync`), contrôle strict des quotas (réservation / engagement / libération des unités d'usage) et projets Studio versionnés.

---

## 2.1 API Aura Studio (extrait)

| Méthode | Route | Description |
| --- | --- | --- |
| GET | `/api/studio/projects` | Galerie (résumés + aperçus miniatures + quota de stockage) |
| POST | `/api/studio/projects` | Crée un projet **et lance une vraie génération IA** (réservation d'usage `studio_creation`) |
| GET | `/api/studio/projects/:id` | Projet complet + HTML d'aperçu composé |
| PATCH | `/api/studio/projects/:id` | Renommer / description / type |
| DELETE | `/api/studio/projects/:id` | Suppression confirmée côté client |
| POST | `/api/studio/projects/:id/duplicate` | Dupliquer |
| PUT | `/api/studio/projects/:id/files` | Sauvegarde des fichiers (Developer Mode) + version + validation de compilation |
| POST | `/api/studio/projects/:id/iterate` | Modification IA ciblée (réservation `studio_modification`, fusion fichiers par chemins) |
| POST | `/api/studio/projects/:id/versions/:versionId/restore` | Restauration d'une version réelle |
| GET | `/api/studio/projects/:id/export` | Téléchargement ZIP des fichiers réels |
| POST | `/api/studio/projects/:id/build` | Validation structurelle persistée (statut de compilation honnête) |

Toutes les routes sont authentifiées et strictement isolées par utilisateur. En cas d'échec du fournisseur IA, les unités réservées sont **libérées** (aucun débit) et le projet passe en statut `failed` avec l'erreur réelle affichée.

---

## 3. Fonctionnalités opérationnelles vs Configuration externe

### Fonctionnalités immédiatement opérationnelles
1. **Landing page publique (`/`)** fidèle aux maquettes desktop et mobile, avec aperçu interactif et démonstrations exécutables des 4 modes.
2. **Espace de travail Aura (`/app`)** fidèle à la maquette de référence, bilingue (Français / Anglais) et bimode (Ivoire chaud / Sombre).
3. **Les 4 Modes d'Aura propulsés côté serveur par Google Gemini (`gemini-3.8-flash`)** :
   - **Chat** : Conversation, apprentissage, synthèse et rédaction.
   - **Recherche** : Recherche web vérifiée via **Google Search Grounding** avec extraction automatique des sources et liens vérifiés.
   - **Code** : Génération de code, explication et **aperçu interactif HTML/CSS/JS en temps réel** intégré.
   - **Créer** : Conception de plans, briefs créatifs, palettes et prompts visuels.
4. **Bibliothèque (`/app/library`)**, **Projets (`/app/projects`)**, **Explorer (`/app/explore`)**, **Quotas (`/app/usage`)** et **Paramètres (`/app/settings`)** avec persistance serveur.

### Fonctionnalités nécessitant une configuration externe (Variables d'environnement)
- `OPENAI_API_KEY` : Active l'adaptateur externe OpenAI (GPT-4o) dans le registre multi-fournisseurs.
- `ANTHROPIC_API_KEY` : Active l'adaptateur externe Anthropic Claude.
- `SUPABASE_URL` & `SUPABASE_ANON_KEY` : Permet de connecter une instance Supabase PostgreSQL & Auth externe en remplacement du magasin de persistance serveur local.
