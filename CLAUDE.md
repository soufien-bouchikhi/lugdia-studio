# CLAUDE.md : dépôt Lugdia Studio

Ce dépôt est une place de marché Claude Code (`lugdia`) qui publie le plugin `lugdia-studio` et référence trois plugins tiers figés sur un commit. Il ne contient pas de site : les sites des clients vivent chacun dans leur propre dépôt, créé avec `/lugdia-studio:demarrer-projet`.

## Structure

- `.claude-plugin/marketplace.json` : la place de marché. Les plugins tiers y sont figés par `sha` (40 caractères).
- `plugins/lugdia-studio/` : le plugin.
  - `.claude-plugin/plugin.json` : version, dépendances, `userConfig` (clé 21st.dev, sensible).
  - `.mcp.json` : MCP, versions figées (jamais `@latest`).
  - `hooks/hooks.json` et `scripts/contexte-projet.mjs` : rappel au démarrage, seulement dans un projet client.
  - `scripts/initialiser-projet.mjs` et `scripts/dossier-crm.mjs` : démarrage et mise à jour d’un projet client à partir du dossier du studio préparé par le CRM (format version 1, contrat avec `app/src/lib/dossier-site.ts` du CRM) ou des seuls fichiers du brief.
  - `skills/` : un dossier par skill (`SKILL.md` + `references/`).
  - `agents/` : un fichier par agent (27). Format : celui de `producteur.md` ; chaque agent précharge `regles-lugdia` et `organisation-studio`.
  - `ressources/` : kit 3D, module son, modèles d’infrastructure, copiés dans les projets par les agents.
  - `templates/projet-client/` : modèle copié dans chaque dépôt client (`gitignore` et `env.example` sont renommés avec un point à la copie).
- `scripts/verifier.mjs` : contrôles à lancer avant chaque commit (lance aussi les tests).
- `tests/` : tests `node --test` des scripts ; fixtures produites par le code du CRM (`tests/fixtures/README.md`).
- `scripts/etat-des-tiers.mjs` : versions disponibles des plugins tiers.

## Règles

- Tout en français, casse de phrase, typographie française, tutoiement de Soufien dans les messages des agents, vouvoiement des visiteurs dans les textes des sites.
- Aucun secret dans le dépôt : les clés passent par `userConfig` (sensible) ou vivent dans n8n.
- Le format du dossier du CRM (version 1) ne change pas sans l’accord de Soufien : c’est le seul contrat entre le CRM et le studio.
- Une nouvelle version du plugin = `version` incrémentée dans `plugin.json` (sinon les installations ne se mettent pas à jour), puis `node scripts/verifier.mjs`, puis commit sur une branche et pull request fusionnée dans `main` : d’après l’aide de claude.ai, la copie du compte claude.ai se resynchronise à la fusion d’une pull request qui monte la version, pas sur un push direct dans `main`.
- Un plugin tiers ne change de `sha` qu’après relecture de la nouvelle version (licence, hooks, scripts, téléchargements), notée dans `NOTICE.md`.
- Les règles des sites clients vivent dans `skills/regles-lugdia/` : c’est la seule source. Un agent ou une commande y renvoie, il ne les recopie pas.
- Un agent adapté de The Agency garde la mention de sa source dans `NOTICE.md`.

## Feuille de route

S1 socle (fait) · S2 équipe d’agents (faite, version 0.2) · Dossier du CRM et contrôle anti-générique (fait, version 0.3) · S3 parcours A et B et commandes · S4 Lugdia Médias (n8n et OpenRouter) · S5 projet pilote : site de Sofiane Khelil.
