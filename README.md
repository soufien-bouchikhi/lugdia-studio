# Lugdia Studio

L’agence Lugdia dans Claude Code : les règles de la maison, le démarrage d’un projet client à partir de son brief, les MCP de design et de contrôle, et les skills tiers retenus, figés sur une version relue.

Dépôt privé. Une seule installation par ordinateur ; chaque projet client en profite, et chaque amélioration du studio profite à tous les projets.

## Contenu (version 0.1, socle)

| Élément | Rôle |
|---|---|
| Skill `regles-lugdia` | Règles communes : rien d’inventé, médias tracés, AA, mouvement réduit, 3D et son, performance, référencement, RGPD, AI Act, points de validation, outils. |
| Skill `demarrer-projet` | `/lugdia-studio:demarrer-projet <dossier du brief>` : crée le dépôt d’un client à partir des fichiers de brief.lugdia.fr. |
| Rappel au démarrage | Dans un projet client (`.lugdia/projet.json`), Claude reçoit l’étape, les points de validation et les règles à chaque session. Silencieux ailleurs. |
| MCP `21st` | Composants et idées d’interface de 21st.dev, logos de marques. |
| MCP `playwright` | Captures à plusieurs largeurs, parcours au clavier, formulaires. |
| MCP `chrome-devtools` | Traces de performance, console, réseau. |
| MCP `context7` | Documentation à jour des bibliothèques. |
| Plugins tiers | `taste-skill` (direction artistique), `impeccable` (audit et finition), `gsap-skills` (animation), installés avec le studio. |

À venir : l’équipe d’agents (S2), les parcours A et B avec leurs commandes (S3), Lugdia Médias pour les images, vidéos et voix via n8n et OpenRouter (S4).

## Installation sur le Mac

Prérequis : Claude Code à jour, Node.js 20 ou plus, Google Chrome, un accès GitHub au dépôt `soufien-bouchikhi/lugdia-studio`.

1. Dans Claude Code :

   ```
   /plugin marketplace add soufien-bouchikhi/lugdia-studio
   /plugin install lugdia-studio@lugdia
   ```

   Les plugins `taste-skill`, `impeccable` et `gsap-skills` s’installent avec lui.

2. Clé 21st.dev : créer une clé sur https://21st.dev/mcp, puis la saisir quand Claude Code la demande (ou plus tard avec `/config`). Elle est rangée dans le trousseau du Mac, jamais dans un fichier.

3. Redémarrer Claude Code, puis vérifier avec `/mcp` que `21st`, `playwright`, `chrome-devtools` et `context7` sont connectés.

Facultatif : l’application de bureau Spline (version 2) ajoute son propre MCP pour la 3D éditable dès qu’elle est ouverte.

## Démarrer un projet client

1. Créer un dossier vide pour le client (par exemple `~/Lugdia/clients/sofiane-khelil`) et y ouvrir Claude Code.
2. Lancer `/lugdia-studio:demarrer-projet ~/Téléchargements/brief-sofiane-khelil` (le dossier où sont les fichiers du brief).
3. Claude range le brief, crée la structure du projet, relève les manques et suggère un parcours, puis s’arrête.

## Mettre à jour

- Le studio : `/plugin marketplace update lugdia`, puis `/plugin update lugdia-studio@lugdia`.
- Les plugins tiers : `node scripts/etat-des-tiers.mjs` montre s’il existe une version plus récente. On relit la nouvelle version (licence, hooks, scripts téléchargés) avant de changer son `sha` dans `.claude-plugin/marketplace.json`.

## Maintenir le studio

Voir `CLAUDE.md`. Avant chaque commit : `node scripts/verifier.mjs`.
