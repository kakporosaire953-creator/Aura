# Couche IA — AURA

## 1. Interface fournisseur (`server/ai/types.ts`)

```ts
interface FournisseurAi {
  id: string; modele: string;
  getCapabilities(): CapacitesAi;        // texte, streaming, sortieStructuree, outils, …
  checkAvailability(): Promise<{ ok, raison? }>;
  generateResponse(req): Promise<ReponseAi>;
  streamResponse(req, onChunk, signal?): Promise<ReponseAi>;
  generateStructuredOutput<T>(req): Promise<T>;
}
```

L'application (routes, services) **ne parle jamais aux SDK des fournisseurs** ;
elle passe par le registre (`server/ai/registre.ts`).

## 2. Registre et routage

- Enregistrement des fournisseurs (`gemini` par défaut, `mock` si
  `AURA_AI_PROVIDER=mock`, réservé aux tests).
- Sélection par **capacités requises** + disponibilité.
- **Repli unique** : un second fournisseur compatible peut être essayé une
  fois en cas d'erreur technique (5xx/429) ; les erreurs de saisie ou de
  blocage ne déclenchent pas de repli ; jamais de boucle.
- État exposé via `/api/v1/capabilities` (sans aucun secret).

## 3. Adaptateur Gemini (`server/ai/gemini.ts`)

- REST `generateContent` / `streamGenerateContent?alt=sse` ;
  modèle par défaut `gemini-3.8-flash` (surcharge `AURA_MODELE`,
  base URL `AURA_MODELE_URL` — utilisé pour les tests sans réseau).
- Sortie structurée : `responseMimeType: application/json` + `responseSchema`
  (décomposition de missions).
- Recherche sourcée : `tools: [{ google_search: {} }]` + extraction des URLs
  depuis `groundingMetadata.groundingChunks` — **les liens proviennent du
  moteur, jamais de l'imagination du modèle**.
- Gestion des erreurs : 429 → `limite-modele`, blocage → `bloque`,
  réponse vide → `vide`, annulation utilisateur → texte partiel conservé.

## 4. Sécurité et confidentialité

- `GEMINI_API_KEY` **uniquement serveur** (`.env`, jamais `VITE_*`, jamais
  dans le bundle, jamais dans une réponse API, jamais dans les logs).
- Aucun contenu de conversation ni clé dans les journaux (les événements
  `usage_events` ne contiennent que des compteurs techniques).
- Timeout implicite : durée de la fonction serverless (30 s) ; l'annulation
  utilisateur (AbortController) coupe aussi l'appel amont.

## 5. Contexte transmis au modèle (`server/services/contexte.ts`)

Ordre : instruction système (identité + honnêteté) → profil contextuel
(champs renseignés uniquement, présentés comme **préférences non vérifiées**)
→ ton préféré → instructions du projet actif → mémoires actives (max 10,
ids enregistrés dans `meta.memoiresUtilisees` et affichés à l'utilisateur).
Jamais : autres conversations, autres projets, mots de passe, clés.

## 6. Limites documentées

- Multimodal (images, audio) : **non branché** — capacités déclarées `false`.
- Recherche : nécessite une clé avec accès grounding ; sinon `503` honnête.
- Régénération remplace la dernière réponse (pas d'empilement de versions
  côté conversation — le Studio, lui, garde ses versions).
- Le fournisseur `mock` est réservé aux tests (`AURA_AI_PROVIDER=mock`) ;
  il n'apparaît jamais dans l'interface produit.
