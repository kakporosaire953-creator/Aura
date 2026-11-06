# 005 — Suppression de compte & export PDF du Studio

Date : 2026-11-06 · Branche : `arena/2b30cf87-aura` · Base : `f4155ef` (main après PR #18)

Suite à la validation de la mission 004 (PR #18 fusionnée et déployée), deux
points actionnables des « prochaines étapes » ont été réalisés. Le pilote SQL
et les pièces jointes restent conditionnés (volume KV réel / stockage objet)
et ne sont pas développés sans justification — conformément à la règle
d'architecture « proportionnée ».

## 1. Suppression de compte (exigence §16, enfin complète)

- **API** : `DELETE /api/v1/me` — confirmation par mot de passe obligatoire
  (`verifierMotDePasse`, scrypt), rate-limit 5 / 15 min. Suppression
  complète : agrégat de données, toutes les sessions, compte, index email.
  Cookie de session invalidé immédiatement. `401 identifiants` si erreur.
- **Entrepôts** : `EntrepotComptes.supprimerCompte` + `EntrepotDonnees.supprimerTout`
  (isolation préservée : un compte ne peut supprimer que le sien).
- **UI** : Paramètres → « Zone sensible » (hors mode simulation) → dialogue
  d'avertissement (irréversible, contenu concerné listé) → mot de passe +
  saisie « SUPPRIMER »/« DELETE » → suppression → redirection vers la
  connexion avec message d'état accessible (`role="status"`).
- **Mode simulation** : effacement du stockage local étiqueté (même contrat).

## 2. Export « Imprimer / PDF » (Studio)

- Bouton dans le panneau de création à côté de l'export Markdown.
- Rendu d'impression réel (`@media print`) : seul le document est imprimé
  (chrome de l'application masqué, couleurs adaptées à l'impression).
- Le PDF est produit par l'impression du navigateur (« Enregistrer au format
  PDF ») — aucun poids ajouté, comportement réel, aucune bibliothèque
  superflue (décision d'architecture « proportionnée »).

## 3. Vérifications réellement exécutées (2026-11-06)

- `npm test` : **23/23** (2 nouveaux tests : confirmation par mot de passe,
  suppression complète + sessions invalidées + compte introuvable ensuite ;
  intégrité des autres comptes préservée).
- Navigateur headless (`tests/verif-005.cjs`) : **8/8** — bouton PDF présent,
  `window.print()` déclenché, zone sensible visible, dialogue affiché, mauvais
  mot de passe refusé avec message, suppression → page de connexion avec
  message d'état, reconnexion impossible (401), aucune erreur JS console.
  Captures : `/home/user/audit-captures/workspace-005/`.
- `tsc --noEmit` ✓ · `vite build` ✓.

## 4. Fichiers

Modifiés : `server/db/entrepots.ts` (suppression complète),
`server/v1/routes.ts` (DELETE /v1/me), `src/services/{api,local}.ts`,
`src/pages/{ParametresPage,StudioPage,AuthPage}.tsx`,
`src/app/dictionaries.ts` (FR/EN), `src/index.css` (impression + zone
sensible + message d'état), `tests/api.test.ts`, `docs/api/`, `docs/product/`.
Créés : `tests/verif-005.cjs`, ce rapport.

## 5. Restant (non fait, volontairement)

- Pilote SQL : à justifier par un volume réel dépassant les plafonds KV.
- Pièces jointes : nécessite un stockage objet (non configuré).
- Lazy-loading des routes React et intégration des tests e2e en CI.
