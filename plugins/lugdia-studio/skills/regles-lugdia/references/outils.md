# Les outils de l’agence : lequel, quand

| Moment | Outil | Usage |
|---|---|---|
| Avant de coder avec une bibliothèque | MCP **context7** | Documentation à jour de la version installée (Astro, GSAP, Three.js, React Three Fiber, Lenis…). Toujours avant d’écrire un appel d’API dont tu n’es pas sûr. |
| Direction artistique (V1) | skill **taste-skill** (`design-taste-frontend`) | Tirer des directions documentées, choisir celle qui porte l’idée du métier du client, puis la boucle « capture, critique, correction ». Ses règles de style s’adaptent à la charte du client, jamais l’inverse. |
| Direction et critique | skill **impeccable** | `/impeccable shape` pour cadrer une page, `/impeccable critique` sur une maquette, `/impeccable audit` avant chaque point de validation, `/impeccable polish` pour la finition, `/impeccable animate` et `/impeccable delight` avec mesure. |
| Composants | MCP **21st** | `search` et `get_inspiration` pour trouver un composant ou une idée d’interaction, `get_component` pour lire son code, `search_logo` pour un logo de marque **autorisé**. Le composant est réécrit avec les jetons du client, son accessibilité vérifiée ; il n’est jamais collé tel quel. `generate` seulement si l’accès IA du compte est actif (`get_usage`). |
| Animation | skills **gsap-skills** | `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-performance`, `gsap-react`. GSAP et tous ses plugins (SplitText, ScrollSmoother, Flip…) sont gratuits, y compris en usage commercial. |
| Captures et parcours | MCP **playwright** | Captures à 390, 768 et 1440 px, parcours au clavier, test des formulaires, capture sous mouvement réduit (`emulateMedia`). Les captures vont dans `recette/captures/`. |
| Mesures | MCP **chrome-devtools** | Traces de performance, LCP, CLS, INP, requêtes réseau, console. À utiliser sur le site construit (`npm run preview`). |
| 3D éditable | **Spline** (application de bureau, si installée) | Son MCP s’ajoute tout seul quand l’application est ouverte. Export Three.js ou React Three Fiber, puis règles 3D de `accessibilite-mouvement.md`. |
| Images, vidéos, voix | **Lugdia Médias** (à venir) | Workflow n8n relié à OpenRouter, avec plafond de dépense par projet. En attendant : visuels en code, fichiers fournis par le client, ou « à fournir ». |

## Pile technique par défaut

- **Astro** (site statique), TypeScript strict, CSS natif construit sur `brief/tokens.json`.
- Îlots **React** seulement pour un composant interactif qui en a besoin (composant issu de 21st.dev, simulateur, scène React Three Fiber).
- **GSAP** et **Lenis** pour le mouvement, **Three.js** pour la 3D.
- Formulaires vers le webhook n8n, hébergement par Lugdia en Europe, aperçus en `noindex`.

Une autre pile (Next.js pour une application, une boutique) se décide au point V1 et s’écrit dans `docs/strategie.md`.
