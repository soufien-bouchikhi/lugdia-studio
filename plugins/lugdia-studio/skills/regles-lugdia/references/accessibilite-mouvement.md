# Accessibilité, mouvement et 3D

## Accessibilité AA : liste de contrôle

- Contrastes : texte 4,5 : 1, grands textes (24 px, ou 18,66 px en gras) 3 : 1, bordures de champs et composants 3 : 1. Mesurés, pas estimés, dans les deux thèmes si le site a un mode sombre.
- Focus visible partout, d’au moins 2 px, contrasté à 3 : 1 avec ce qui l’entoure. Jamais `outline: none` sans remplacement.
- Tout au clavier : menus, carrousels, fenêtres, boutons de son, cartes cliquables. Échap ferme ce qui s’ouvre. Pas de piège au clavier.
- Une barre fixe sur téléphone ne masque jamais l’élément qui a le focus (`scroll-padding-bottom`).
- Structure : un `h1` par page, des niveaux de titres sans saut, des zones (`header`, `nav`, `main`, `footer`), un lien d’évitement vers le contenu.
- Images : `alt` qui dit ce que l’image apporte, `alt=""` pour la décoration.
- Formulaires : chaque champ a une étiquette visible, les erreurs sont écrites en clair et reliées au champ (`aria-describedby`), le bouton d’envoi dit ce qu’il fait.
- Cibles tactiles d’au moins 44 × 44 px.
- `lang="fr"` (et `lang` sur tout passage dans une autre langue).
- Rien qui ne dépende du seul survol, de la seule couleur ou du seul son.

## Mouvement : ce que le visiteur choisit d’abord

Sous `prefers-reduced-motion: reduce` :
- Aucune section figée (`position: sticky` désactivé), aucun défilement scénarisé : le contenu se lit à la suite.
- Les scènes 3D sont remplacées par une image fixe de même style.
- Aucun flash, aucun clignotement, aucune parallaxe, aucune vidéo en lecture automatique.
- Les apparitions deviennent instantanées : le contenu est là, visible, dès le chargement.

Pour tous les visiteurs :
- Rien ne clignote plus de 3 fois par seconde.
- Une animation qui dure plus de 5 secondes se met en pause (bouton ou fin naturelle).
- Le texte est dans le HTML, lisible et indexable sans JavaScript ; l’animation l’accompagne, elle ne le fabrique pas.

## Défilement scénarisé

- Défilement natif préservé. Lenis est permis, désactivé sous mouvement réduit et compatible avec les ancres, le clavier et le retour arrière.
- ScrollTrigger : `invalidateOnRefresh`, nettoyage au démontage, pas de déclencheur créé dans une boucle d’animation.
- Jamais `overflow: hidden` ou `clip` sur `html` ou `body` avec des sections en `position: sticky`.
- Les liens de navigation arrivent au début de ce qu’ils annoncent, même dans un chapitre figé.
- Téléphone : même récit, mis en page en hauteur, avec des durées raccourcies. Jamais d’expérience « ordinateur seulement ».

## 3D (Three.js, React Three Fiber, export Spline)

- Détecter WebGL avant de charger la scène ; sans WebGL, repli 2D au même style, avec le même appel à l’action.
- Charger la bibliothèque et les modèles après le premier affichage (import dynamique), jamais dans le chemin critique.
- Qualité adaptative : si l’image tombe sous 30 images par seconde pendant 2 secondes, baisser la résolution, puis couper les effets coûteux (post-traitement, particules). Un paramètre d’adresse (`?hq`) peut forcer la qualité maximale pour les captures.
- Mettre la boucle de rendu en pause quand la scène sort de l’écran ou que l’onglet est masqué.
- Libérer les géométries, matériaux et textures au démontage.
- Les étiquettes de la scène sont du HTML par-dessus le canevas, jamais du texte dessiné dans la 3D : il doit rester lisible, traduisible et accessible.

## Son

- Coupé par défaut, jamais lancé sans geste du visiteur.
- Bouton visible avec `aria-pressed` et une étiquette claire (« Activer le son »).
- Coupé quand l’onglet est masqué, choix retenu pour la visite suivante.
- Aucune information portée par le seul son.
