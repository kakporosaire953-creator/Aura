# Aura Multi-Model & Media Workflow Architecture

Ce plan détaille l’intégration dans la page Workflow (Workspace) d’une gamme complète d’au moins **5 modèles natifs Aura**, des **modèles gratuits/accessibles de Google Gemini, OpenAI GPT et Anthropic Claude**, ainsi que de trois nouveaux moteurs de création multimédia (**Génération d’Images**, **Génération de Vidéos**, et **Génération de Slides / Présentations**) directement connectés à **Aura Studio**.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Voici les choix d’architecture retenus par défaut pour garantir que **tous les modèles et tous les formats (Texte, Code, Images, Vidéos, Slides)** fonctionnent immédiatement sans erreur bloquante :

- **Continuité d’exécution GPT & Claude (Relais intelligent)** : Si tu configures `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` ou une clé gratuite `OPENROUTER_API_KEY`, le serveur appelle directement les API officielles correspondantes. Si ces clés tierces ne sont pas renseignées, Aura route automatiquement la requête via le moteur **Gemini 3.8 Flash** configuré sur le serveur avec le profil de raisonnement adapté, en indiquant clairement le moteur utilisé.
- **Visionneuse interactive de Slides dans Aura Studio** : Le mode **Slides** génère une présentation interactive complète (navigation par diapositives, miniatures, raccourcis clavier `←` / `→`, plein écran et export HTML/PDF) affichée dans le panneau droit d’Aura Studio.
- **Gestion des modèles d’Images et de Vidéos** : Les modèles natifs **Gemini Image (`gemini-3.1-flash-lite-image`, `gemini-nano-banana-2.1`)** et **Veo (`veo-3.1-lite-generate-preview`)** sont intégrés côté serveur. Si la clé API active ne dispose pas de la facturation requise pour Veo ou Imagen, Aura propose d’associer une clé payante ou génère instantanément un visuel vectoriel HD / une animation web interactive de remplacement dans Aura Studio.

---

### 1. Overview & Core Concept

- **Ce que fait cette évolution** :
  1. **Au moins 5 Modèles Aura spécialisés** : *Aura 3.8 Flash*, *Aura 3.1 Lite*, *Aura 3.1 Pro*, *Aura Studio Architect* (Web & Design) et *Aura Deep Research* (Recherche vérifiée).
  2. **Catalogue des modèles gratuits Gemini, GPT & Claude** : Accès rapide depuis le sélecteur du workflow aux modèles *Gemini 3.8 Flash*, *Gemini 3.1 Flash Lite*, *GPT-4o mini*, *GPT-4o*, *o3-mini*, *Claude 3.5 Haiku* et *Claude 3.7 Sonnet*.
  3. **Moteurs de création Image, Vidéo & Slides** : Ajout des workflows dédiés dans le compositeur de prompt et dans **Aura Studio** pour créer, prévisualiser, modifier itérativement et télécharger des images, des séquences vidéo et des présentations professionnelles.
- **Valeur clé pour l’utilisateur** : Transformer le Workspace Aura en un studio multimodal complet où l’on peut passer d’une discussion ou d’une recherche web à la génération d’une image, d’un clip vidéo ou d’un pitch deck complet sans quitter la conversation.

---

### 2. User Experience & Visual Design

- **Parcours utilisateur dans la page Workflow (Workspace)** :
  1. **Sélecteur de modèles enrichi par catégories** : En bas à gauche de la barre de prompt, un menu structuré en 4 onglets/groupes clairs :
     - **Gamme Aura (5 modèles)** : *Aura 3.8 Flash*, *Aura 3.1 Lite*, *Aura 3.1 Pro*, *Aura Studio Architect*, *Aura Deep Research*.
     - **Modèles Gratuits & Rapides (Gemini / GPT / Claude)** : *Gemini 3.8 Flash (Gratuit)*, *Gemini 3.1 Flash Lite (Gratuit)*, *GPT-4o mini (Free Tier)*, *o3-mini (Free Tier)*, *Claude 3.5 Haiku (Free Tier)*, *GPT-4o*, *Claude 3.7 Sonnet*.
     - **Génération d’Images** : *Aura Image Flash*, *Nano Banana 2.1 HD*, *Aura Vector Studio*.
     - **Vidéos & Slides** : *Aura Veo 3.1 Lite (Vidéo)*, *Aura Motion Canvas (Animation)*, *Aura Slides Deck Pro (Présentation)*.
  2. **Barre d’actions rapides de Workflow** : En complément des modes *Chat*, *Recherche*, *Code* et *Aura Studio*, ajout des déclencheurs directs **Image**, **Vidéo** et **Slides** avec choix du format (ex. ratio `16:9`, `1:1`, `9:16` ou nombre de diapositives).
  3. **Rendu spécialisé dans Aura Studio (Panneau droit)** :
     - **Vue Image** : Aperçu haute définition sur fond ivoire/ardoise, zoom, sélecteur de ratio, téléchargement PNG et barre d’itération (« Rendre plus minimaliste », « Changer la palette »).
     - **Vue Vidéo** : Lecteur vidéo HTML5 / Canevas d’animation cinématique avec suivi de génération en temps réel, contrôles de lecture et téléchargement.
     - **Vue Slides (Présentation)** : Visionneuse de diapositives 16:9 avec barre de navigation (`Diapositive 1 / 8`), grille de miniatures, mode présentation plein écran et téléchargement du deck autonome.
- **Identité visuelle respectée** :
  - Conservation stricte de la palette officielle **ivoire chaud (`#FAF8F2`)**, **vert émeraude (`#078348`)**, **vert tendre (`#8CCB4A`)**, **jaune solaire (`#EACB37`)** et **orange chaleureux (`#FF790D`)**.
  - Typographie éditoriale existante (`Plus Jakarta Sans` / `Cormorant Garamond` / `JetBrains Mono` avec `tabular-nums` pour les compteurs de diapositives et jetons).

---

### 3. Key Product Decisions & Trade-Offs

- **Décision 1 : Architecture Multi-Fournisseurs Hybride (Direct + OpenRouter + Relais Gemini)**
  - *Approche choisie* : Prise en charge native des appels REST vers OpenAI, Anthropic et OpenRouter (qui propose des endpoints gratuits pour de nombreux modèles), doublée d’un relais automatique vers Gemini 3.8 Flash lorsque seule `GEMINI_API_KEY` est présente.
  - *Pourquoi* : Permet à l’utilisateur de tester immédiatement tous les modèles dans l’interface sans jamais subir d’écran d’erreur bloquant, tout en permettant de brancher de vraies clés OpenAI/Anthropic/OpenRouter à tout moment.
- **Décision 2 : Double moteur pour Images et Vidéos (API Native + Studio Générative)**
  - *Approche choisie* : Appel prioritaire aux modèles officiels `@google/genai` (`gemini-3.1-flash-lite-image` / `veo-3.1-lite-generate-preview`) côté serveur, avec génération automatique d’illustrations SVG haute précision ou d’animations HTML5/Canvas cinématiques si le quota multimédia payant n’est pas activé sur la clé.
  - *Pourquoi* : Garantit qu’une demande d’image ou de vidéo produit **toujours** un résultat visuel immédiat et exploitable dans Aura Studio.
- **Décision 3 : Moteur de Slides structuré + Deck HTML autonome**
  - *Approche choisie* : Chaque présentation génère à la fois une liste structurée de diapositives (titre, sous-titre, points clés, notes d’orateur, visuel/mise en page) pour la visionneuse interactive ET un fichier HTML/CSS autonome téléchargeable.
  - *Pourquoi* : Offre une expérience fluide similaire à Gamma / Pitch directement dans Aura Studio tout en permettant l’export hors-ligne en un clic.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

#### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         AURA WORKSPACE (FRONTEND)                            │
│                                                                              │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │ Conversation & Workflow Composer   │  │      AURA STUDIO (DROITE)      │  │
│  │                                    │  │                                │  │
│  │ • Sélecteur de Modèles (4 groupes) │  │ • Visionneuse Web / Code       │  │
│  │   - 5 Modèles Aura                 │  │ • Galerie & Éditeur d'Images   │  │
│  │   - Gemini / GPT / Claude Gratuits │  │ • Lecteur Vidéo & Motion       │  │
│  │   - Moteurs Image / Vidéo / Slides │  │ • Lecteur de Slides (16:9)     │  │
│  │ • Sélecteur de Workflow & Ratios   │  │ • Barre d'itération continue   │  │
│  └─────────────────┬──────────────────┘  └───────────────▲────────────────┘  │
└────────────────────┼─────────────────────────────────────┼───────────────────┘
                     │ POST /api/ai/chat                   │ Réponse + Livrable
                     │ POST /api/ai/video-status           │ (Image/Vidéo/Slides)
                     ▼                                     │
┌──────────────────────────────────────────────────────────┴───────────────────┐
│                      SERVEUR EXPRESS / VERCEL API                            │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                     ORCHESTRATEUR MULTI-MODÈLES                        │  │
│  │                                                                        │  │
│  │  ┌──────────────────────┐ ┌─────────────────────┐ ┌─────────────────┐  │  │
│  │  │ Gamme Aura & Gemini  │ │ GPT & Claude Free   │ │ Studio Media    │  │  │
│  │  │ • Aura 3.8 Flash     │ │ • GPT-4o mini / 4o  │ │ • Gemini Image  │  │  │
│  │  │ • Aura 3.1 Lite      │ │ • o3-mini           │ │ • Veo 3.1 Video │  │  │
│  │  │ • Aura 3.1 Pro       │ │ • Claude 3.5 Haiku  │ │ • Slides Deck   │  │  │
│  │  │ • Studio Architect   │ │ • Claude 3.7 Sonnet │ │   Generator     │  │  │
│  │  │ • Deep Research      │ │ (Clé ou Relais IA)  │ │                 │  │  │
│  │  └──────────────────────┘ └─────────────────────┘ └─────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Modèle de données & Livrables multimédias

- **Extension des modes et capacités (`AuraMode`)** :
  - Conservation des modes fondamentaux (`chat`, `search`, `code`, `create`) et ajout des modes/capacités de workflow **`image`**, **`video`** et **`slides`**.
- **Nouveaux artefacts supportés dans les messages et dans Aura Studio** :
  - **`imageArtifact`** : URL/base64 de l’image générée (ou SVG haute fidélité), prompt utilisé, modèle, ratio (`1:1`, `16:9`, `9:16`, `4:3`) et palette.
  - **`videoArtifact`** : URL vidéo MP4 ou animation HTML5 autonome, statut d’opération Veo (`operationName`, progression), durée, ratio et storyboard scène par scène.
  - **`slideArtifact`** : Titre de la présentation, thème visuel, tableau structuré de diapositives (`slides[]` avec titre, points clés, métrique mise en avant, disposition et notes) ainsi que le code HTML complet exportable.

#### Mapping des Interactions & États

- **Sélection d’un modèle ou d’un outil média** :
  - Choisir un modèle d’image, de vidéo ou de slides dans le menu active automatiquement le mode correspondant dans le compositeur et ouvre **Aura Studio** à droite dès l’envoi.
- **Modification itérative dans Aura Studio** :
  - Que l’utilisateur visualise une image, une vidéo, un deck de slides ou un site web, la barre d’itération au bas d’Aura Studio transmet le contexte actif (`activeArtifactContext`) au modèle sélectionné pour ajouter une diapositive, modifier le style d’une image ou enrichir une scène vidéo.
