# Produit — état fonctionnel AURA Workspace

Identité conservée : « Rubans & sculpture » (Fraunces + Manrope, dégradé
ruban lime→vert→or→feu, logo officiel inchangé). AURA est un environnement
de travail numérique, pas un clone de chatbot.

## Modules — état réel

| Module | État | Réalité |
|---|---|---|
| Vue d'ensemble | ✅ opérationnel | salutation, composeur, actions rapides, continuité de travail sur données persistées ; zéro statistique fictive |
| Assistant | ✅ opérationnel | conversations persistées serveur, streaming SSE + arrêt + régénération + copie, Markdown/tables/code sûrs, contexte visible (mémoires utilisées), saisie vocale et lecture voix (navigateur), états d'erreur honnêtes |
| Projets | ✅ opérationnel | CRUD, objectif/catégorie/instructions, espace projet (conversations, missions, créations, recherches, mémoire), isolation serveur |
| Missions | ✅ opérationnel | persistance API, vues liste/tableau/échéances, sous-tâches, priorités ; aide IA = **proposition validée par l'utilisateur avant enregistrement** |
| Mémoire | ✅ opérationnel | consultation/ajout/modification/désactivation/effacement ; pas de mémorisation automatique ; usage dans les réponses contrôlé par préférence |
| Studio | ✅ opérationnel (si moteur configuré) | génération réelle, versions successives, révision, export Markdown ; aucun pourcentage inventé, aucun contenu prédéfini présenté comme généré |
| Explorer | ⚠️ conditionnel | recherche sourcée réelle (grounding) uniquement si la clé serveur y accède ; sinon **indisponible affichée**, jamais de recherche simulée |
| AURA Local | ✅ opérationnel | profil pays/ville/langue/devise/fuseau/unités/domaine + préférences de réponse ; utilisé comme préférences, jamais présenté comme faits vérifiés |
| Voix | ✅ capacités réelles du navigateur | dictation (SpeechRecognition si disponible), lecture (speechSynthesis) ; sinon boutons absents — aucune reconnaissance simulée |
| Images / fichiers | ❌ non disponible | capacité déclarée `false`, interface ne propose rien |

## Mode simulation

Permanent et étiqueté (bannière + badges « Démonstration »), **désactivé par
défaut en production**, entrée volontaire uniquement. Il utilise les mêmes
contrats que l'API (`src/services/local.ts`) et refuse explicitement de
simuler la recherche réelle.

## Règles d'interface tenues

- Aucune mention publique de « gratuits », « free tier » ou de stratégie de
  modèles à bas coût.
- Aucun bouton sans comportement réel ; aucune statistique inventée.
- Limitations affichées honnêtement (« Assistant non configuré »,
  « Stockage non configuré », « Recherche indisponible »).
- Confidentialité : note affichée sur la mémoire ; documentation complète
  dans `docs/ai/` et `docs/database/`.

## Parcours de référence (§23) — vérifié

Inscription → vue d'ensemble → création de projet → conversation dans le
projet → échange → décomposition IA validée → document rattaché →
persistance après actualisation → retour ultérieur avec les données.
Automatisé dans `tests/parcours-acceptation.cjs` (13/13 vérifications,
captures dans `docs/analyse/`).
