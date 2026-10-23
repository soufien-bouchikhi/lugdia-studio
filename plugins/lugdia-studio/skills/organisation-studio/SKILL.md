---
name: organisation-studio
description: Organisation de l’équipe Lugdia Studio pour un projet client - les 26 agents, les phases du projet, qui produit quel fichier, à quel point de validation, et le format de remise entre agents. À charger par chaque agent du studio et par toute session qui pilote un projet client Lugdia.
---

# Organisation du studio

Un projet client se mène comme une opération : une maîtrise d’ouvrage (le client, représenté par Soufien), une maîtrise d’œuvre (le studio), un pilotage (le producteur, notre OPC), un contrôle extérieur (le contrôleur de vérité) et une réception par étapes (les points de validation V1 à V4). Chaque agent a un lot, il le livre complet, il ne touche pas au lot des autres.

## L’équipe

Les agents s’appellent `lugdia-studio:<nom>`.

| Pôle | Agent | Lot |
|---|---|---|
| Pilotage | `producteur` | Planning, état du projet, dossiers de validation, seul à tenir `.lugdia/projet.json` |
| | `chef-orchestre` | Enchaîne les agents d’une phase, contrôle chaque remise, relance les corrections |
| | `chef-de-projet` | Découpe le travail en lots et tâches avec critères d’acceptation (`docs/plan.md`) |
| | `controleur-verite` | Contrôle extérieur : rien d’inventé, mots à éviter, mentions, preuves avant chaque validation |
| Stratégie et marque | `chercheur-ux` | Personas, moments déclencheurs, freins, parcours, tirés du seul brief |
| | `veilleur` | Concurrents cités, sites de référence du métier, tendances utiles |
| | `gardien-marque` | Plateforme de marque, ton, charte et jetons tenus comme un contrat |
| | `redacteur` | Textes de chaque page, dans les mots du client |
| | `referenceur` | Mots-clés, titres, descriptions, maillage, données structurées, pages locales |
| | `architecte-aeo` | Site lisible et citable par les moteurs de réponse (llms.txt, FAQ, entités) |
| | `stratege-citations-ia` | Présence hors site : fiche Google, annuaires, cohérence des coordonnées, plan après lancement |
| Design | `architecte-ux` | Arborescence, zonages, parcours de conversion |
| | `designer-ui` | Trois pistes de direction artistique, puis le système visuel retenu |
| | `scenariste-visuel` | Récit du défilement et des chapitres (parcours immersif) |
| | `designer-interactions` | Micro-interactions, survols, états, petits moments de plaisir, avec mesure |
| | `directeur-images` | Invites de génération, cohérence des visuels, registre des médias |
| | `garant-inclusion` | Représentation juste, biais des images générées, textes alternatifs |
| Fabrication | `developpeur-front` | Site Astro : pages, composants, intégration, performance |
| | `developpeur-creatif-3d` | Scènes 3D, shaders, défilement scénarisé, qualité adaptative |
| | `designer-sonore` | Sons d’interface synthétisés, bouton son, règles d’écoute |
| | `developpeur-back` | Formulaires vers n8n, en-têtes de sécurité, configuration de mise en ligne |
| Contrôle | `relecteur-finition` | Dernière passe visuelle avant chaque validation |
| | `auditeur-accessibilite` | Audit AA complet, clavier, lecteur d’écran, mouvement réduit |
| | `testeur-performance` | Lighthouse, Core Web Vitals, poids, traces |
| | `collecteur-preuves` | Captures à 390, 768 et 1440 px, mouvement réduit, preuves de chaque validation |
| | `ingenieur-tests` | Tests Playwright automatisés : parcours, formulaires, liens, mentions |

## Les phases

Notation : `→` veut dire « après », `+` veut dire « en même temps ». Entre crochets, ce qui ne s’applique qu’à certains parcours.

| Phase | Entrée | Agents | Sortie | Arrêt |
|---|---|---|---|---|
| 1. Cadrage | projet démarré | producteur → chercheur-ux + veilleur + gardien-marque (`docs/marque.md`, puis `PRODUCT.md` tiré du brief et de la marque) → producteur (`docs/strategie.md`, cohérence avec `PRODUCT.md` vérifiée) | `docs/strategie.md` complet | — |
| 2. Direction artistique | cadrage fini | architecte-ux → designer-ui [+ scenariste-visuel si 3D ou défilement scénarisé] [+ directeur-images si des visuels sont prévus, fournis ou générés] → gardien-marque (relecture) + garant-inclusion → controleur-verite → producteur | 3 pistes, arborescence, zonages | **V1** |
| 3. Page d’accueil | V1 validée | designer-ui (`retenue.md`, `DESIGN.md`) → gardien-marque (relecture de `DESIGN.md`) + designer-interactions (spécification) [+ scenariste-visuel : scénario final] [+ directeur-images : images de l’accueil] → redacteur (accueil) → developpeur-front [+ developpeur-back si l’accueil a un formulaire] → [developpeur-creatif-3d + designer-sonore] → designer-interactions (contrôle) [+ scenariste-visuel (contrôle)] → developpeur-back (aperçu) → testeur-performance (accueil) + ingenieur-tests (accueil) + collecteur-preuves + garant-inclusion → relecteur-finition → controleur-verite → producteur | accueil codée, aperçu publié | **V2** |
| 4. Fabrication | V2 validée | chef-de-projet (`docs/plan.md`) → directeur-images (fiches et classement de toutes les images) → redacteur → referenceur → architecte-aeo → redacteur (reprise des titres, de la FAQ et de la structure citable) → developpeur-front + developpeur-back → [developpeur-creatif-3d + designer-sonore] → designer-interactions (contrôle) → directeur-images (registre à jour) + garant-inclusion → producteur (étape `recette`) | toutes les pages | — |
| 5. Recette | étape `recette` | developpeur-back (aperçu à jour) → auditeur-accessibilite + testeur-performance + ingenieur-tests + collecteur-preuves + referenceur (données structurées sur le site construit) + architecte-aeo (contrôle de `dist/`) → corrections par les agents concernés → developpeur-back (aperçu à jour, envoi réel de chaque formulaire jusqu’à n8n marqué « test ») → auditeur-accessibilite + testeur-performance + ingenieur-tests + collecteur-preuves (deuxième passage, pages corrigées) + garant-inclusion → relecteur-finition → controleur-verite → producteur | `recette/` complet, aperçu en `noindex` | **V3** |
| 6. Retours du client | V3 validée et aperçu envoyé au client par Soufien | producteur (`retours-client.md`, étape `retours-client`) → chef-de-projet (lots de corrections) → agents concernés → ingenieur-tests + collecteur-preuves (pages touchées) → relecteur-finition (si des pages ont changé) → developpeur-back (liste de mise en ligne prête) + referenceur (fiche Google préparée) → controleur-verite → producteur | site prêt à publier | **V4** |
| 7. Bascule | V4 validée | developpeur-back (DNS, `PUBLIC_INDEXABLE=true`, déploiement, envoi réel depuis la production) → referenceur (contrôles après la bascule) + ingenieur-tests (suite sur la production) → producteur (étape `livre`) | site en ligne | — |
| 8. Après | étape `livre` | stratege-citations-ia | plan de présence et de citations | — |

Une phase se mène depuis la session principale avec le skill `lugdia-studio:phase` (« lance la phase 2 ») ; le `chef-orchestre` peut aussi la mener seul quand il dispose de l’outil Agent. Dans les deux cas, en phase 4, on suit les dépendances de `docs/plan.md`. Soufien peut aussi appeler un agent seul pour une tâche précise. Seul le producteur change l’étape dans `.lugdia/projet.json`.

## Relais avec Soufien

Un agent lancé par un autre ne peut pas poser de question à Soufien ni attendre sa réponse. Le relais passe donc par la session principale :
1. le producteur rend le dossier de validation et s’arrête ; le chef-orchestre rend la main ;
2. la session principale présente le dossier à Soufien et recueille sa réponse ;
3. elle relance le producteur en citant cette réponse mot pour mot ; sans citation, rien n’est validé.

Même chose pour tout résultat que seul Soufien peut produire (test au lecteur d’écran VoiceOver, envoi de l’aperçu au client, création d’un dépôt ou d’un compte) : la session principale le demande, puis relance l’agent concerné avec le résultat.

## Commits

Le dépôt garde une version par remise acceptée, pour que chaque rapport de contrôle désigne la version qu’il a testée (`git rev-parse --short HEAD`) :
- celui qui mène la phase (session principale ou chef-orchestre) commite après chaque remise acceptée : `git add` des fichiers cités dans la remise, plus `docs/journal.md` et `docs/a-fournir.md` s’ils ont changé, message `<agent> : <ce qui est livré>` ;
- un agent appelé seul commite lui-même les fichiers de son lot, avec le même format ;
- on ne pousse que si le dépôt distant existe, et jamais vers une branche de production sans V4.

## Qui écrit quoi

| Fichier | Responsable | Les autres |
|---|---|---|
| `brief/` | personne ne modifie (lecture seule) | le producteur ajoute les fichiers reçus du client dans `brief/fichiers-client/` |
| `.lugdia/projet.json` | producteur | lisent |
| `docs/strategie.md` | producteur (assemble) | chercheur-ux, veilleur, gardien-marque y contribuent par leurs fichiers |
| `docs/recherche/personas.md`, `parcours.md` | chercheur-ux | |
| `docs/recherche/concurrents.md`, `docs/recherche/captures/` | veilleur | |
| `docs/marque.md` | gardien-marque | |
| `PRODUCT.md` (racine du projet, lu par impeccable) | gardien-marque, en fin de cadrage | |
| `docs/plan.md` | chef-de-projet | producteur y lit les jalons |
| `docs/architecture.md` | architecte-ux | |
| `docs/direction-artistique/` (`piste-a.md`, `piste-b.md`, `piste-c.md`, `retenue.md`, captures) | designer-ui | |
| `DESIGN.md` (racine du projet, lu par impeccable) | designer-ui, au début de la phase 3 | gardien-marque relit |
| `docs/direction-artistique/scenario.md` | scenariste-visuel | |
| `docs/direction-artistique/interactions.md` | designer-interactions | |
| `docs/direction-artistique/images.md` | directeur-images | |
| `docs/contenus/<page>.md` | redacteur | referenceur annote titres et descriptions |
| `docs/seo.md` (dont la fiche Google préparée pour V4 et les contrôles après la bascule) | referenceur | |
| `docs/aeo.md`, `public/llms.txt` | architecte-aeo | |
| `public/robots.txt` | developpeur-front l’écrit | à partir de `docs/seo.md` (referenceur) et du bloc des robots d’IA de `docs/aeo.md` (architecte-aeo) |
| Textes alternatifs (`alt`) | redacteur les écrit dans `docs/contenus/` | directeur-images classe chaque image (informative ou décorative), garant-inclusion relit |
| `docs/citations-ia.md` (dont le suivi de la fiche Google après la mise en ligne) | stratege-citations-ia | |
| `docs/medias.md` | directeur-images | tout agent qui ajoute un média y ajoute sa ligne |
| `docs/3d.md`, `src/scenes/` | developpeur-creatif-3d | |
| `docs/son.md`, `src/son/` | designer-sonore | |
| `src/` (sauf `scenes/`, `son/` et `formulaires/`), `public/` (sauf `llms.txt`), `scripts/jetons.mjs`, `astro.config.mjs`, `tsconfig.json`, sections « Pile technique » et « Commandes » du `CLAUDE.md` du projet | developpeur-front | |
| `package.json` | developpeur-front | ingenieur-tests y ajoute ses dépendances de test et le script `test` |
| `src/formulaires/`, `infra/` (nginx, Traefik), `.env.example`, `docs/mise-en-ligne.md`, `recette/formulaires.md`, publication de l’aperçu, bascule en production | developpeur-back | l’adresse de l’aperçu est notée dans `docs/mise-en-ligne.md` |
| `recette/accessibilite.md` | auditeur-accessibilite | |
| `recette/performance.md` | testeur-performance | |
| `recette/captures/`, `recette/preuves.md` | collecteur-preuves | |
| `tests/`, `recette/tests.md` | ingenieur-tests | |
| `recette/finition.md` | relecteur-finition | |
| `recette/verite.md` | controleur-verite | |
| `recette/inclusion.md` | garant-inclusion | |
| `docs/validations/Vn.md`, `docs/validations/retours-client.md` | producteur | |
| `docs/journal.md` | tous, une ligne datée par décision, toujours ajoutée en bas (ordre chronologique) | |
| `docs/a-fournir.md` | tous, une ligne par manque constaté | producteur coche ce qui est reçu |

Un agent qui voit un problème dans le lot d’un autre ne le corrige pas : il le note dans sa remise, avec le fichier et la ligne, et le chef-orchestre l’envoie au bon agent.

## Règles de travail

- Les textes de `docs/contenus/` portent déjà la typographie française complète (espaces insécables, apostrophes, guillemets) : developpeur-front les intègre tels quels. Les documents internes gardent des espaces simples.
- Dossiers de travail des outils (`.taste-skill/`, `.impeccable/`, `test-results/`) : jamais versionnés ; ce qui compte est recopié dans `docs/`.
- Maquettes et captures de la direction artistique : `docs/direction-artistique/maquettes/` et `docs/direction-artistique/captures/`.
- Jetons de mouvement (`--duree-courte`, `--duree-moyenne`, `--courbe-sortie`…) : posés par designer-ui dans `DESIGN.md`, utilisés par designer-interactions, developpeur-front et developpeur-creatif-3d.
- Les contrôles de texte se font avec les scripts du projet, pas avec des commandes recopiées : `node scripts/mots-a-eviter.mjs <fichiers ou dossiers>` (mots à éviter du brief) et `node scripts/typo.mjs <fichiers ou dossiers>` (typographie française).

- Lire avant d’écrire : le brief, `docs/strategie.md`, `docs/journal.md`, puis les fichiers d’entrée de son lot.
- Une hypothèse se signale (« hypothèse : … ») et part dans la remise ; une information manquante devient « à fournir ».
- Les messages à Soufien le tutoient ; les textes du site vouvoient le visiteur.
- Avant de rendre : relire son lot contre les règles de `lugdia-studio:regles-lugdia`, et contre les mots à éviter du brief.

## Format de remise

Chaque agent termine par ce bloc, et rien d’autre après :

```
## Remise · <agent>
- Fait : <ce qui est livré, en une ou deux lignes>
- Fichiers : <chemins créés ou modifiés>
- Contrôles passés : <ce qui a été vérifié et comment>
- À fournir : <informations manquantes, ou « rien »>
- Questions pour Soufien : <décisions qui lui reviennent, ou « aucune »>
- Problèmes vus ailleurs : <fichier, ligne, problème, agent concerné ; ou « aucun »>
- Suite : <agent ou étape suivante>
```
