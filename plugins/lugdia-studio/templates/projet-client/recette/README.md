# Recette

Remplie pendant la phase 5, avant le point V3, puis vérifiée avant la mise en ligne. Chaque rapport finit par un verdict : « bon pour validation » ou « à reprendre ».

| Fichier | Agent | Contenu |
|---|---|---|
| `accessibilite.md` | auditeur-accessibilite | Audit AA : outil automatique, clavier, arbre d’accessibilité, contrastes, zoom, mouvement réduit, procédure VoiceOver pour Soufien |
| `performance.md` | testeur-performance | Lighthouse téléphone par page (médiane de trois passages), LCP, CLS, INP, poids, traces |
| `formulaires.md` | developpeur-back | Un envoi réel de chaque formulaire jusqu’à n8n, marqué « test » : date, formulaire, réponse, ligne reçue |
| `tests.md` | ingenieur-tests | Ce que couvrent les tests Playwright de `tests/` (pages, liens, formulaires, mentions, noindex, axe) et le dernier résultat |
| `preuves.md`, `captures/` | collecteur-preuves | Captures à 390, 768 et 1440 px, mouvement réduit, thème sombre, et ce que chacune prouve |
| `finition.md` | relecteur-finition | Dernière passe visuelle, corrections classées |
| `inclusion.md` | garant-inclusion | Représentation, images générées, textes alternatifs, langage |
| `verite.md` | controleur-verite | Chaque affirmation du site contre sa source, mots à éviter, mentions, données structurées, registre des médias ; verdict final |
