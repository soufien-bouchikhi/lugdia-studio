# Performance

## Budget par défaut

Sauf budget propre fixé dans `docs/strategie.md` (un parcours immersif peut avoir le sien, écrit et validé au point V1) :

| Mesure | Seuil, sur téléphone (Lighthouse, 4G simulée) |
|---|---|
| Lighthouse performance, accessibilité, bonnes pratiques, référencement | ≥ 90 chacun |
| LCP (plus grand élément affiché) | ≤ 2,5 s |
| CLS (décalages de mise en page) | ≤ 0,1 |
| INP (réactivité) | ≤ 200 ms |
| TBT (temps de blocage) | ≤ 200 ms |
| JavaScript au premier chargement | ≤ 150 Ko compressé, hors scène 3D |
| Poids de la page d’accueil au premier affichage | ≤ 1 Mo compressé |

## Méthode

1. Mesurer sur le site construit et servi (`npm run build` puis `npm run preview`), jamais sur le serveur de développement.
2. Lighthouse en mode téléphone, trois passages, retenir la médiane.
3. Trace de performance avec le MCP Chrome DevTools pour toute page sous les seuils : identifier la ressource en cause avant de corriger.
4. Consigner les résultats dans `recette/performance.md` (date, page, scores, LCP, CLS, INP, poids).

## Réflexes

- Site statique par défaut (Astro), îlots interactifs seulement là où il le faut.
- Image principale : format moderne, bonnes dimensions, `fetchpriority="high"`, jamais chargée en différé.
- Polices : une ou deux familles, WOFF2, sous-ensemble, `font-display: swap`, dimensions de repli ajustées (`size-adjust`) pour éviter le décalage.
- Scripts tiers : aucun par défaut ; agenda, carte, vidéo chargés au clic.
- Animations sur `transform` et `opacity` uniquement ; `will-change` posé juste avant l’animation et retiré après.
- 3D : import dynamique après le premier affichage, modèles compressés, textures KTX2, `devicePixelRatio` plafonné à 2 (1,5 sur téléphone).
- En-têtes de cache longs pour les fichiers versionnés, compression Brotli côté serveur.
