# Éléments de tiers

## Plugins référencés (installés depuis leur dépôt d’origine, non copiés ici)

| Plugin | Dépôt | Commit figé | Licence |
|---|---|---|---|
| taste-skill 2.1.4 | https://github.com/Leonxlnx/taste-skill | `6010f91a9935` | MIT, © 2026 Leonxlnx |
| impeccable 4.7.0 | https://github.com/pbakaus/impeccable (dossier `plugin`) | `8644175285` | Apache 2.0, © Paul Bakaus |
| gsap-skills 1.0.0 | https://github.com/greensock/gsap-skills | `aed9cfd32777` | MIT, © 2026 GreenSock |

Notes de relecture (22 octobre 2026) :
- impeccable déclare des hooks (`SessionStart`, `PostToolUse` sur Edit et Write, `Stop`) qui lancent son moteur ; le moteur est téléchargé depuis les publications GitHub du projet au premier usage et vérifié par empreinte SHA-256 avant exécution.
- taste-skill lance des scripts Node (`draw.mjs`, `inspect.mjs`) depuis son dossier, sans téléchargement.
- gsap-skills ne contient que des instructions.

## MCP utilisés

| Serveur | Origine | Licence |
|---|---|---|
| 21st | https://21st.dev/api/mcp (service hébergé, compte et clé Lugdia) | conditions de 21st.dev |
| @playwright/mcp 0.0.83 | Microsoft | Apache 2.0 |
| chrome-devtools-mcp 1.11.0 | Google | Apache 2.0 |
| Context7 | https://mcp.context7.com/mcp (Upstash) | conditions d’Upstash |

## Agents adaptés (à partir de S2)

Les agents de Lugdia Studio seront adaptés de The Agency (https://github.com/msitarzewski/agency-agents, commit `4e3ac3ca6604`), licence MIT, © 2025 AgentLand Contributors. La notice MIT d’origine sera reproduite ici avec la liste des agents adaptés.
