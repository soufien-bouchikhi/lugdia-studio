# Points de validation

Quatre arrêts obligatoires. À chacun : écrire `docs/validations/Vn.md`, mettre `.lugdia/projet.json` à jour (`"statut": "en attente"`), puis **s’arrêter** et demander l’accord de Soufien. Il répond « validé » (statut `validée`, date du jour) ou donne ses retours (statut `à reprendre`, retours recopiés dans le fichier).

## V1 · Direction artistique

À présenter :
- Le résumé stratégique en 5 lignes (`docs/strategie.md`) : cible principale, promesse, objectif mesurable, parcours choisi (A à E) et pourquoi.
- **Trois pistes** visuelles distinctes, chacune avec : l’idée tirée du métier du client, la composition de l’accueil, le duo typographique (dans le respect de la charte du client), la palette (dans le respect des jetons), le principe de mouvement, et une capture de la zone haute de l’accueil à 1440 et 390 px.
- Le budget de performance si le parcours est immersif.

Règle : si le client a une charte (« à respecter » dans le brief), les trois pistes la respectent toutes ; elles varient la composition, le mouvement et l’imagerie, pas la marque.

## V2 · Page d’accueil

À présenter :
- L’accueil codé, avec la piste retenue, ses vrais textes (ou « à fournir »), en version ordinateur et téléphone.
- Captures à 390, 768 et 1440 px, et une capture sous `prefers-reduced-motion`.
- Premier passage Lighthouse téléphone et premier audit impeccable, avec ce qui reste à corriger.

## V3 · Aperçu complet

À présenter :
- L’adresse de l’aperçu (en `noindex`).
- Le dossier `recette/` complet : Lighthouse par page, contrastes, clavier, lecteur d’écran sur l’accueil, formulaires testés jusqu’à leur destination, mentions présentes, données structurées valides, recherche des mots à éviter, registre des médias complet.
- La liste de ce qui reste « à fournir » par le client.

C’est après V3, et seulement après, que Soufien peut envoyer l’aperçu au client.

## V4 · Mise en ligne

À présenter :
- Les retours du client et leur traitement.
- La liste de contrôle de mise en ligne : domaine, HTTPS, redirections, `noindex` retiré, mesure d’audience active, sitemap déclaré, fiche Google prête, sauvegarde.

Rien n’est publié sur le domaine du client avant l’accord de Soufien à ce point.
