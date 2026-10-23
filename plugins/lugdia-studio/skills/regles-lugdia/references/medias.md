# Médias : images, vidéos, sons, polices, 3D

## Registre obligatoire : `docs/medias.md`

Une ligne par fichier publié. Pour une image générée, la colonne « Invite » renvoie à sa fiche dans `docs/direction-artistique/images.md` plutôt que de recopier l’invite :

| Fichier | Type | Source | Licence ou modèle | Invite (si générée) | Date | Pages |
|---|---|---|---|---|---|---|
| `public/img/hero.avif` | image générée | Lugdia Médias | modèle et version | fiche « accueil-hero » de `docs/direction-artistique/images.md` | 2026-10-22 | accueil |

Un fichier absent du registre ne part pas en ligne.

## Ce qu’on peut utiliser

- **Fournis par le client** : photos, logo, plaquettes, avec son accord pour la publication.
- **Générés** (image, vidéo, voix) : décors, ambiances, objets, textures, illustrations, visuels 3D abstraits, pictogrammes.
- **Créés en code** : SVG, scènes 3D, shaders, dégradés, sons d’interface synthétisés (Web Audio). Un visuel pré-calculé (rendu d’une scène en WebP, par exemple) garde sa source dans le dépôt du client, avec la commande qui le reproduit : `docs/direction-artistique/rendu3d/` (scène, `package.json`, `README.md`) tant que le site n’existe pas, puis à côté du code du site. Jamais dans un dossier de travail temporaire.
- **Banques sous licence** : seulement avec la licence notée dans le registre.
- **Icônes** : Lucide (licence ISC) ou un jeu cohérent avec la marque.

## Ce qu’on ne fait jamais

- Une image générée présentée comme une photo réelle du client, de son équipe, de ses locaux, de ses réalisations, de ses biens ou de ses clients.
- Un visage généré qui pourrait passer pour un membre de l’équipe ou un client.
- Un bien immobilier généré présenté comme un bien à vendre ou à louer. Pour un programme neuf, les perspectives portent « visuel non contractuel ».
- Un logo de partenaire, de compagnie ou de média sans l’accord écrit du client.
- Une image récupérée sur un autre site.

## Signalement des contenus générés (AI Act, article 50)

Une image, une vidéo ou une voix générée qui représente de façon réaliste une personne, un lieu ou un objet existant porte une mention visible « image générée par IA » (ou « voix générée par IA »). Les visuels clairement artistiques ou abstraits n’ont pas besoin de mention, mais restent inscrits au registre.

## Formats et poids

- Images : AVIF ou WebP, plusieurs tailles (`srcset`), dimensions déclarées, `loading="lazy"` sauf l’image principale de la page, qui a `fetchpriority="high"`.
- Vidéo d’ambiance : muette, courte, compressée (H.264 et AV1), affiche fixe, pas de lecture automatique sous `prefers-reduced-motion` ni en mode économie de données.
- 3D : glTF 2.0 compressé (Draco ou Meshopt), textures KTX2, chargement après le premier affichage.
- Polices : WOFF2, sous-ensemble latin, `font-display: swap`, préchargement de la seule police du titre principal.

## Son

Sons d’interface courts et doux, synthétisés en code de préférence. Coupé par défaut, bouton visible, choix retenu, coupé quand l’onglet est masqué, volume modéré. Aucune musique sous droits.
