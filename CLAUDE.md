# CLAUDE.md : dépôt Lugdia Studio

Ce dépôt est une place de marché Claude Code (`lugdia`) qui publie le plugin `lugdia-studio` et référence trois plugins tiers figés sur un commit. Il ne contient pas de site : les sites des clients vivent chacun dans leur propre dépôt, créé avec `/lugdia-studio:demarrer-projet`.

## Structure

- `.claude-plugin/marketplace.json` : la place de marché. Les plugins tiers y sont figés par `sha` (40 caractères).
- `plugins/lugdia-studio/` : le plugin.
  - `.claude-plugin/plugin.json` : version, dépendances, `userConfig` (clé 21st.dev, sensible).
  - `.mcp.json` : MCP, versions figées (jamais `@latest`).
  - `hooks/hooks.json` et `scripts/contexte-projet.mjs` : rappel au démarrage, seulement dans un projet client.
  - `skills/` : un dossier par skill (`SKILL.md` + `references/`).
  - `agents/` : à partir de S2, un fichier par agent.
  - `templates/projet-client/` : modèle copié dans chaque dépôt client (`gitignore` et `env.example` sont renommés avec un point à la copie).
- `scripts/verifier.mjs` : contrôles à lancer avant chaque commit.
- `scripts/etat-des-tiers.mjs` : versions disponibles des plugins tiers.

## Règles

- Tout en français, casse de phrase, typographie française, tutoiement de Soufien dans les messages des agents, vouvoiement des visiteurs dans les textes des sites.
- Aucun secret dans le dépôt : les clés passent par `userConfig` (sensible) ou vivent dans n8n.
- Une nouvelle version du plugin = `version` incrémentée dans `plugin.json` (sinon les installations ne se mettent pas à jour), puis `node scripts/verifier.mjs`, puis commit.
- Un plugin tiers ne change de `sha` qu’après relecture de la nouvelle version (licence, hooks, scripts, téléchargements), notée dans `NOTICE.md`.
- Les règles des sites clients vivent dans `skills/regles-lugdia/` : c’est la seule source. Un agent ou une commande y renvoie, il ne les recopie pas.
- Un agent adapté de The Agency garde la mention de sa source dans `NOTICE.md`.

## Feuille de route

S1 socle (fait) · S2 équipe d’agents · S3 parcours A et B et commandes · S4 Lugdia Médias (n8n et OpenRouter) · S5 projet pilote : site de Sofiane Khelil.
