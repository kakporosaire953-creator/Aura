# 004 — Rapport de mission « AURA WORKSPACE »

Date : 2026-11-05 · Branche : `arena/3bf5199b-aura` · Base : `c8069b7`

## 1. Architecture initiale → finale

Initiale : pages React + un seul dépôt JSON de comptes, chat Gemini non
persisté, missions/historique en localStorage, aucune couche service, aucune
API versionnée. Finale : API `/api/v1` versionnée, entrepôts avec isolation
par compte et migrations, couche IA abstraite (registre + routage + repli
unique), services frontend typés, modules Projets/Mémoire ajoutés,
conversations et missions persistées serveur. Schémas :
`docs/architecture/000-proposition-technique.md`, `001-architecture-cible.md`.

## 2. Fonctionnalités livrées

Vue d'ensemble réelle (continuité de travail), Assistant (streaming, arrêt,
régénération, copie, Markdown sûr, contexte visible, voix navigateur),
Projets (CRUD + espace + instructions), Missions (3 vues, sous-tâches, aide IA
validable), Mémoire (contrôle total), Studio (versions + export), Explorer
(sourcé réel, honnête sans moteur), AURA Local (profil contextuel), navigation
modulaire (groupes Principal/Personnel), système de capacités honnête.

## 3. Fichiers créés / modifiés

Créés : `server/db/{types,base,entrepots}.ts`, `server/ai/{types,gemini,mock,registre}.ts`,
`server/search/connecteurs.ts`, `server/services/contexte.ts`,
`server/v1/{middlewares,routes,routesTravail,routesCreation}.ts`,
`src/services/{types,api,local}.ts`, `src/components/ui/{Markdown,Primitives}.tsx`,
`src/pages/{ProjetsPage,MemoirePage}.tsx`, `tests/{api,entrepots}.test.ts`,
`tests/parcours-acceptation.cjs`, `docs/**`, `.env.example`.
Modifiés : `server/api.ts` (auth unifiée sur entrepôts + montage v1),
`server/accounts.ts` (crypto/sessions/cookies uniquement),
`src/pages/{EspacePage,ChatPage,MissionsPage,StudioPage,ExplorePage,ParametresPage,HistoriquePage}.tsx`,
`src/components/layout/WorkspaceLayout.tsx`, `src/App.tsx`, `src/app/dictionaries.ts`,
`src/index.css`, `package.json`.

## 4. Backend

Express partagé dev/Vercel ; routes = validation + statuts, services =
règles métier (contexte), db/ai/search = infrastructure. Sessions opaques
empreintées, rate limiting, validation systématique, erreurs uniformes.

## 5. Frontend

Migration progressive (pas de déplacement brutal) : logique d'accès aux
données isolée dans `src/services/`, composants UI réutilisables, logique
métier hors composants. Réponses lues via `ReponseApi<T>` uniforme.

## 6. Modèle de données

18 entités logiques (voir `docs/database/`) ; projection physique : agrégat
JSON par utilisateur + index globaux d'auth, schéma versionné avec migrations,
plafonds anti-démesure, migration automatique des anciens comptes.

## 7. API

`/api/v1` (compte, préférences, capacités, conversations+messages+SSE,
projets, missions (+aide/batch), mémoire, recherche, studio) + routes
historiques conservées. Contrat d'erreur uniforme, isolation 404 sans fuite.

## 8. Intégrations IA

Interface `FournisseurAi` + registre + routage par capacité avec repli unique ;
adaptateurs Gemini (REST, SSE, responseSchema, grounding) et mock (tests).
Clés serveur uniquement. Contexte : profil + préférences + projet + mémoires
(sélection, ids affichés).

## 9. Sécurité

Cookies HttpOnly SameSite=Lax (+Secure prod), scrypt + comparaison à temps
constant, sessions révocables, validation serveur, rate limiting, CORS
inchangé (même origine), prompts : séparation instruction/contenu, limites
de taille, confirmation avant suppressions et effacement de mémoire.

## 10. Tests

Commande : `npm test` (node:test + tsx, fournisseur mock, aucun appel payant).
**Réalisés et verts le 2026-11-05 : 21/21** (entrepôts 6, auth 3,
conversations 2, isolation 1, projets 1, missions 2, mémoire 1, capacités 3,
profil 2). Parcours navigateur `tests/parcours-acceptation.cjs` : **13/13**
(serveur réel + persistance réelle, moteur mock). `tsc --noEmit` ✓,
`vite build` ✓. Échecs corrigés en cours de route : titre auto, cookies des
tests SSE, focus du dialogue (bug produit réel : la barre d'espace activait le
bouton de fermeture — corrigé dans `Primitives.tsx`).

## 11. Captures d'écran

`/home/user/audit-captures/workspace/` (16 captures + `resultats.json`) :
inscription, vue d'ensemble, création de projet, espace projet, conversation,
aide IA, propositions, missions, studio, projet rempli, retour ultérieur,
mémoire, paramètres, explore, mobile (2).

## 12. Indisponibles (non masqués)

Images générées, pièces jointes (pas de stockage objet), recherche sans
clé grounding, voix hors capacités navigateur. Chacun déclaré via
`/api/v1/capabilities` et affiché honnêtement dans l'UI.

## 13. Limites connues

Valeur KV plafonnée (agrégat par utilisateur, plafonds documentés) ; durée
serverless 30 s (streaming court) ; pas de suppression de compte en UI
(l'API de suppression complète reste à écrire) ; régénération = remplacement
(pas d'historique de versions côté conversation) ; tests de régression
visuelle non rejoués à chaque tour (outillage headless externe).

## 14. Prochaines étapes

1. Suppression de compte (API + UI confirmée).
2. Pilote SQL (`BaseDeDonnees`) si volume KV réel.
3. Connecteurs de recherche additionnels ; export PDF des créations.
4. Lazy-loading de routes React (code-splitting) et tests e2e dans CI.
5. Pièces jointes dès qu'un stockage objet est disponible.

## 15. Critères d'acceptation (§23)

Parcours complet vérifié automatiquement (13/13) avec API réelles et base
persistée : login → vue d'ensemble → projet → conversation dans projet →
échange → décomposition IA validée → document rattaché → persistance →
reprise ultérieure. Design identitaire conservé ; responsive vérifié (captures
mobile) ; a11y : focus visibles, labels ARIA, dialogue accessible (Escape,
focus), `prefers-reduced-motion` respecté ; aucune donnée inter-utilisateurs
(tests d'isolation) ; aucune clé dans le bundle.

## 16. État git

Branche `arena/3bf5199b-aura`, commits : `d853bd7` (fondations backend),
`96dded4` (frontend workspace), `92df8a3` (tests), + commit final
(documentation + corrections). Build `vite build` ✓. **Non fusionné, non
déployé — en attente de votre validation explicite.**
