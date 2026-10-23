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

## Agents adaptés de The Agency

24 agents de `plugins/lugdia-studio/agents/` sont adaptés (réécrits en français pour Lugdia) d’agents de The Agency, https://github.com/msitarzewski/agency-agents, commit `4e3ac3ca6604c75113f52c695dbddcc7af928b46`. Les agents `developpeur-creatif-3d` et `designer-sonore` sont des créations de Lugdia.

| Agent Lugdia | Agent d’origine | Fichier d’origine |
|---|---|---|
| producteur | Studio Producer | project-management/project-management-studio-producer.md |
| chef-orchestre | Agents Orchestrator | specialized/agents-orchestrator.md |
| chef-de-projet | Senior Project Manager | project-management/project-manager-senior.md |
| controleur-verite | Reality Checker | testing/testing-reality-checker.md |
| chercheur-ux | UX Researcher | design/design-ux-researcher.md |
| veilleur | Trend Researcher | product/product-trend-researcher.md |
| gardien-marque | Brand Guardian | design/design-brand-guardian.md |
| redacteur | Content Creator | marketing/marketing-content-creator.md |
| referenceur | SEO Specialist | marketing/marketing-seo-specialist.md |
| architecte-aeo | AEO Foundations Architect | marketing/marketing-aeo-foundations.md |
| stratege-citations-ia | AI Citation Strategist | marketing/marketing-ai-citation-strategist.md |
| architecte-ux | UX Architect | design/design-ux-architect.md |
| designer-ui | UI Designer | design/design-ui-designer.md |
| scenariste-visuel | Visual Storyteller | design/design-visual-storyteller.md |
| designer-interactions | Whimsy Injector | design/design-whimsy-injector.md |
| directeur-images | Image Prompt Engineer | design/design-image-prompt-engineer.md |
| garant-inclusion | Inclusive Visuals Specialist | design/design-inclusive-visuals-specialist.md |
| developpeur-front | Frontend Developer | engineering/engineering-frontend-developer.md |
| developpeur-back | Backend Architect | engineering/engineering-backend-architect.md |
| relecteur-finition | UI Finish-Gate Reviewer | design/design-ui-finish-gate-reviewer.md |
| auditeur-accessibilite | Accessibility Auditor | testing/testing-accessibility-auditor.md |
| testeur-performance | Performance Benchmarker | testing/testing-performance-benchmarker.md |
| collecteur-preuves | Evidence Collector | testing/testing-evidence-collector.md |
| ingenieur-tests | Test Automation Engineer | testing/testing-test-automation-engineer.md |

Licence d’origine, reproduite comme elle l’exige :

```
MIT License

Copyright (c) 2025 AgentLand Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Code tiré de lugdia.fr

`plugins/lugdia-studio/ressources/3d/` reprend des outils écrits pour le site lugdia.fr (propriété de Lugdia), rendus génériques. Bibliothèque utilisée : Three.js (licence MIT).
