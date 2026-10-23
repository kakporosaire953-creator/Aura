# AURA — De l'idée au résultat.

AURA est une plateforme d'intelligence artificielle française qui réunit
conversation, recherche sourcée, création et exécution dans un seul fil de
pensée — du prompt au livrable.

> **Chantier en cours.** Le produit est en cours de reconstruction depuis les
> fondations, autour de l'identité **« Rubans & sculpture »** dérivée du logo
> officiel. Ce dépôt est mis à jour en toute transparence : ce qui est
> annoncé comme vivre fonctionne réellement, le reste est annoncé comme en
> reconstruction.

## Ce qui est vivant aujourd'hui

- Site public complet (accueil, authentification visuelle, 404)
- Intro cinématique GSAP autour du logo officiel
- Sculpture 3D temps réel (Three.js) : les trois rubans de la marque
- API d'état honnête (`GET /api/status`) qui décrit l'avancement réel

## En reconstruction (prochaines étapes)

Comptes & profils, chat IA, recherche sourcée (Explore), Studio de génération,
missions & projets, quotas & abonnements, pages légales.

## Identité

- Logo officiel : `public/assets/` (ne jamais redessiner, recolorer ni déformer)
- Palette dérivée du logo : vert `#43BC2C`, lime `#A5E838`, or `#EACB37`, feu `#FF790D`
- Typographie : Fraunces (titres) + Manrope (textes)
- Direction artistique : rubans fluides, lumière solaire, éditorial sculptural

## Démarrer

```bash
npm install --legacy-peer-deps
npm run dev      # http://localhost:3000
npm run build    # build de production
npm run lint     # vérification TypeScript
```

## Déploiement

Configuration Vercel incluse (`vercel.json`). Toute plateforme Node classique
(Railway, Render, Fly.io…) fonctionne avec `npm run build` puis
`npm start`.
