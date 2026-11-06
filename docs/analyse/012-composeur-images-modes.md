# 012 — Composeur : images jointes, mode de travail, libellé de saisie

Date : 2026-11-06 · Branche : `arena/f4e9eb82-aura` · Base : `ca78c6d4` (main après PR #25)

> Branche imposée par la plateforme. **Aucune fusion, aucun déploiement** sans
> autorisation explicite.

## 1. Demande

> « Je n'ai pas vu les modifications. La barre dans laquelle les utilisateurs vont écrire
> leur premier message doit avoir un petit truc pour importer des images, une autre partie
> de sélection des modèles et tout. »

Trois attentes : **import d'images**, **sélection de modèle**, et le reste de ce que montre
la capture de référence (« + », sélecteur, micro, envoi).

## 2. Pourquoi les changements précédents semblaient absents

Le déploiement contenait bien le code (`ca78c6d4`, déploiement Production `success`, les
règles `.chat-barre` sont dans le CSS livré). Mais le changement de libellé était **trop
discret** pour se voir : sur mobile, le texte d'invite ne passait que de ~16,8 px à ~17 px.

Mesures avant / après cette PR :

| | Avant | Après |
|---|---|---|
| Taille du texte d'invite (mobile) | ~16,8 px | **21,8 px** |
| Disposition | pilule « Aura » seule | **`+` · mode · envoi à droite** |
| Texte coupé dans le champ | oui à 320 px | non (hauteur garantie sur 3 lignes) |

## 3. Sélection de « modèle » : ce qui a été fait, et pourquoi pas des noms de modèles

Une consigne explicite du propriétaire interdit d'afficher **noms de fournisseurs ou de
modèles** dans l'interface ordinaire. La « sélection de modèle » est donc un **sélecteur de
mode de travail**, qui pilote réellement le routage serveur :

| Mode affiché | Tâche de routage | Effet réel |
|---|---|---|
| Aura | `conversation` | défaut, texte + streaming |
| Réflexion | `raisonnement` | politique de raisonnement |
| Code | `code` | exige la capacité « code » |
| Recherche | `recherche` | exige une recherche sourcée réelle |

Ce n'est pas décoratif : le serveur journalise `generation(code)`, `stream(image)`… selon le
mode choisi (vérifié dans les tests ci-dessous). Quand **aucun** moteur ne couvre le mode,
la réponse le dit clairement au lieu d'échouer en silence :

> « La recherche sourcée n'est pas disponible sur cet environnement. »

**Limite assumée** : avec une image jointe, c'est la tâche `image` qui route (il faut un
moteur qui sache lire une image). Le sélecteur est alors **désactivé avec une infobulle
explicite**, plutôt que de laisser croire qu'il agit.

## 4. Import d'images — réel, pas une façade

| Étape | Mise en œuvre |
|---|---|
| Choix du fichier | bouton `+` → sélecteur natif, `accept` PNG/JPEG/WEBP/GIF, 3 images max |
| Réduction | **dans le navigateur** : 1280 px de côté max, JPEG 82 % (les fichiers déjà légers sont conservés tels quels) |
| Aperçu | vignettes 56 px avec bouton de retrait |
| Envoi | `POST /api/v1/conversations/:id/messages` avec `piecesJointes[]` (data URL) |
| Validation serveur | type MIME réel, 1,8 Mo max par image, 4 Mo au total, 3 images max — messages d'erreur explicites |
| Conservation | data URL stockée dans la méta du message (aucun fichier sur disque, aucun service tiers) |
| Transmission au moteur | `images: [{ mime, data }]` — le fournisseur les reçoit réellement (Gemini `inlineData`) |
| Affichage | images rendues dans la bulle, y compris à la réouverture de la conversation |
| Message sans texte | possible : une image seule suffit (le titre de conversation reprend le nom du fichier) |

Aucune génération d'images n'est proposée : `/api/v1/capabilities` indique toujours
`images: { ok: false }` et rien dans l'interface ne prétend le contraire. On **lit** une
image fournie, on n'en **produit** pas.

## 5. Défauts corrigés en chemin

| # | Défaut | Preuve | Correction |
|---|---|---|---|
| 1 | **413 Payload Too Large** à l'envoi d'une image | `POST …/messages` → 413 (limiteur global 32 Ko) | limiteur dédié de 6 Mo sur cette seule route, avant le limiteur général |
| 2 | **Message envoyé deux fois** depuis le tableau de bord | capture : deux bulles identiques, deux conversations | garde-fou par clé de navigation (`envoiAutoFait`) |
| 3 | Vignette d'image à 285 px dans la bulle | mesure navigateur | `max-width/height: 180px` appliqués et vérifiés (180 × 180) |
| 4 | Texte d'invite coupé par la hauteur du champ à 390 px | capture `11` | hauteur minimale portée à 96 px sur mobile |
| 5 | Erreur générique « Le modèle ne répond pas » quand un mode n'a pas de moteur | test mode `recherche` | message spécifique par tâche (`messageErreur`) |

## 6. Vérifications réellement exécutées

| Vérification | Résultat |
|---|---|
| `tsc --noEmit` | 0 erreur |
| `npm test` | **61/61** |
| `tests/parcours-acceptation.cjs` | **13/13** |
| `tests/parcours-experience.cjs` | **28/28** |
| Joindre une image depuis le tableau de bord → vignette | ✅ 1 vignette |
| Envoi image + texte → réponse | ✅ 200, image affichée, réponse indique « 1 image reçue » |
| Image sans texte | ✅ 200 |
| Type non supporté (`text/plain`) | ✅ 400 « Format d'image non pris en charge (PNG, JPEG, WEBP, GIF). » |
| 4 images | ✅ 400 « Trois images au maximum par message. » |
| Mode `code` transmis | ✅ `meta.mode = "code"`, journal `generation(code)` |
| Images transmises au moteur | ✅ journal `generation(image)` |
| Mode indisponible | ✅ 503 « La recherche sourcée n'est pas disponible sur cet environnement. » |
| Envoi unique depuis le tableau de bord | ✅ 1 message utilisateur, 1 image |

Captures : `/home/user/audit-captures/composeur-012/` (mobile tableau de bord, image jointe,
bureau, chat).

Note d'environnement : tests lancés avec `AI_DEFAULT_PROVIDER=mock` (tests uniquement),
faute de `.env` et de réseau fournisseur dans le bac à sable. Le fournisseur simulé déclare
la lecture d'images pour que le parcours soit vérifiable de bout en bout.

## 7. Limites assumées

- **Pas de test sur appareil physique** : le sélecteur de fichiers natif et l'appareil photo
  d'un téléphone réel ne peuvent pas être exercés ici.
- Une image **transmise** n'est pas garantie **comprise** : cela dépend du moteur réellement
  configuré ; sans moteur capable de lire les images, l'application le dit.
- Les images sont stockées dans la base (data URL) : 3 × 1,8 Mo maximum par message. Ce n'est
  pas un stockage de fichiers, et il n'y a ni vignette serveur ni galerie.
- Le mode « Recherche » exige un moteur avec recherche sourcée ; dans le bac à sable il est
  indisponible et le message le dit.

## 8. Reste ouvert

Droits d'usage des logos de tiers, textes légaux, droits d'abonnement, test tactile réel,
choix d'un stockage de fichiers dédié si les pièces jointes doivent dépasser les limites
actuelles.
