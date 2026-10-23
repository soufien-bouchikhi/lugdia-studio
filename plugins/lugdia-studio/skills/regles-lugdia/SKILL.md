---
name: regles-lugdia
description: Règles communes de l’agence Lugdia pour tout site ou contenu livré à un client (contenu, médias, accessibilité, mouvement et 3D, son, performance, référencement, RGPD, AI Act, points de validation). À charger avant tout travail dans un projet client Lugdia, c’est-à-dire un dossier qui contient .lugdia/projet.json, et avant toute relecture ou recette.
---

# Règles de l’agence Lugdia

Lugdia livre des sites qui impressionnent et qui tiennent : beaux, rapides, accessibles, conformes, sans un mot inventé. Ces règles s’appliquent à tous les agents et à toutes les étapes. Quand une règle gêne une idée de design, c’est l’idée qui s’adapte, jamais la règle. Si une règle semble vraiment bloquer le projet, arrête-toi et pose la question à Soufien.

## 1. Le brief est la source de vérité

- Le dossier `brief/` contient le cahier des charges (`cahier-des-charges.md`), sa version structurée (`brief.json`), les jetons de design (`tokens.json`) et la planche d’identité (`identite.png`). Lis-les avant de proposer quoi que ce soit.
- Ce que le client a fourni (textes, accroche, histoire, couleurs, police, mots à éviter) est respecté tel quel. Une correction de fond (une promesse interdite, une faute) se propose, elle ne s’impose pas : note-la dans `docs/journal.md` et signale-la au point de validation suivant.
- Seule exception : la forme. Fautes d’orthographe, typographie française et casse de phrase (« Vos projets, Votre Stratégie » devient « Vos projets, votre stratégie ») sont corrigées d’office dans le site, et la version d’origine est gardée dans `docs/journal.md` pour que Soufien puisse la rétablir.
- Une information manque : écris « à fournir » à l’endroit voulu, ajoute la ligne dans `docs/a-fournir.md`, et continue. N’invente jamais pour boucher un trou.

## 2. Rien d’inventé

Jamais de chiffre, d’avis, de témoignage, de note, de client, de logo de partenaire, de label, de certification, de diplôme, de prix, de délai, de résultat ou de date qui ne vienne pas du brief ou d’une source écrite du client. Pas de faux compteurs (« 500 clients satisfaits »), pas de fausses étoiles, pas de « depuis 1998 » supposé. Les exemples illustratifs sont signalés comme tels. Détail et cas limites : [references/contenu.md](references/contenu.md).

## 3. Les mots du client

- Langue du client, vouvoiement du visiteur, phrases courtes, casse de phrase dans les titres et les boutons, typographie française (espaces insécables avant `: ; ? ! »` et après `«`, apostrophe typographique).
- Le ton et le vocabulaire viennent de la section « Glossaire et ton éditorial » du cahier des charges. Les **mots à éviter** qui y figurent sont interdits partout : textes, `alt`, métadonnées, données structurées.
- Les mentions propres au métier (section « Juridique et conformité ») sont reprises mot pour mot, aux endroits indiqués.

## 4. Les médias

- Chaque image, vidéo, son, police ou modèle 3D est inscrit dans `docs/medias.md` : fichier, source, licence ou modèle de génération, invite utilisée, date, page où il sert.
- Une image générée n’est **jamais** présentée comme une photo du client, de son équipe, de ses locaux, de ses réalisations, de ses biens ou de ses clients. Ni faux portrait, ni fausse équipe, ni fausse réalisation.
- Une image ou une vidéo générée qui montre de façon réaliste une personne, un lieu ou un bien existant porte la mention « image générée par IA » (AI Act, article 50).
- Polices : licence vérifiée, fichiers auto-hébergés, aucun appel à Google Fonts. Détail : [references/medias.md](references/medias.md).

## 5. Accessibilité (niveau AA, sans exception)

Contrastes mesurés (texte 4,5 : 1, grands textes et composants 3 : 1), focus visible, tout au clavier, ordre de lecture logique, `alt` utiles, formulaires étiquetés avec erreurs explicites, cibles d’au moins 44 px sur téléphone, langue déclarée, aucune information portée par la seule couleur ou le seul survol. Détail : [references/accessibilite-mouvement.md](references/accessibilite-mouvement.md).

## 6. Mouvement, 3D et son

- Le spectaculaire est bienvenu, à quatre conditions : le contenu reste lisible et indexable sans JavaScript, `prefers-reduced-motion` donne une version complète sans rien de figé ni de flash, un repli sans WebGL garde le style et le parcours de conversion, et la qualité s’adapte à l’appareil (résolution, puis effets coupés si l’image tombe sous 30 images par seconde).
- Le défilement natif est préservé : clavier, ancres, retour arrière et lecteurs d’écran fonctionnent. Ne jamais mettre `overflow: hidden` ni `clip` sur `html` ou `body` quand des sections sont figées en `position: sticky`.
- Le son est **coupé par défaut**, jamais lancé automatiquement, activable par un bouton visible (`aria-pressed`), coupé quand l’onglet est masqué, et le choix du visiteur est retenu.
Détail : [references/accessibilite-mouvement.md](references/accessibilite-mouvement.md).

## 7. Performance

Par défaut (sauf budget fixé dans `docs/strategie.md`) : Lighthouse mobile ≥ 90 dans les quatre catégories, LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms, JavaScript initial ≤ 150 Ko compressé hors scène 3D, scène 3D chargée après le premier affichage. Détail : [references/performance.md](references/performance.md).

## 8. Référencement et visibilité dans les moteurs de réponse

Titres et descriptions propres à chaque page, un seul `h1`, données structurées valides correspondant à l’activité, plan du site, `robots.txt`, image de partage, favicon, `llms.txt` qui résume l’entreprise avec les seules informations du brief. Les aperçus et préproductions sont en `noindex`. Détail : [references/conformite.md](references/conformite.md).

## 9. Conformité

Mentions légales complètes, mentions du métier, politique de confidentialité, information au plus près de chaque formulaire, formulaires conformes au contrat n8n ([references/formulaires.md](references/formulaires.md)), mesure d’audience sans cookie, contenus tiers (carte, vidéo, agenda) chargés au clic, aucun cookie tiers sans consentement, aucune donnée de santé, tout chatbot se présente comme une IA. Aucun secret dans le code : seules des variables publiques non sensibles côté site, les clés vivent dans n8n. Détail : [references/conformite.md](references/conformite.md).

## 10. Points de validation

Quatre arrêts obligatoires, décrits dans [references/validations.md](references/validations.md) : **V1** direction artistique, **V2** page d’accueil, **V3** aperçu complet après recette, **V4** mise en ligne. À chaque point : prépare le dossier `docs/validations/Vn.md` avec les captures, mets `.lugdia/projet.json` à jour (statut « en attente »), puis **arrête-toi** et demande l’accord de Soufien. Rien ne part chez le client, rien n’est publié sur le domaine du client, sans cet accord.

## 11. Traçabilité

- `docs/journal.md` : une ligne datée par décision (quoi, pourquoi, qui l’a prise).
- `.lugdia/projet.json` : étape et points de validation tenus à jour.
- Commits courts, en français, un sujet par commit.

## 12. Les outils de l’agence

Quel skill ou quel MCP utiliser, et à quel moment : [references/outils.md](references/outils.md). En bref : taste-skill pour la direction artistique, 21st.dev pour s’inspirer de composants (jamais copiés tels quels), gsap-skills pour l’animation, Context7 avant d’utiliser l’API d’une bibliothèque, Playwright pour les captures, Chrome DevTools pour les mesures de performance, impeccable pour l’audit et la finition.
