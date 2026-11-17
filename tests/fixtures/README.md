# Fixtures des tests

Les dossiers `dossier-v1*.zip` et le dossier `brief-seul/` sont fabriqués par le code du CRM lui-même (`composerDossier` et `ecrireZip`, dépôt `lugdia-crm`, commit `e7978c0`), jamais écrits à la main. Pour les refaire, depuis `app/` du CRM :

```bash
F=<copie de travail du plugin>/tests/fixtures
node --experimental-strip-types --import ./tests/chargeur.mjs "$F/generer-dossiers.ts" "$PWD" "$F"
```

| Fichier | Contenu |
|---|---|
| `dossier-v1.zip` | Client fictif « Ébénisterie Exemple » : brief complet, découverte avec trois preuves (confirmée, à confirmer avec source, sans source), trois références (deux captures, capture 1440 seule, capture impossible), photo du client avec droits, photo sans droits avec personnes reconnaissables, image générée avec son invite, logo et police dans `charte/`, deux prises de vue manquantes. |
| `dossier-v1-maj.zip` | Le même, préparé plus tard : histoire changée, photo `equipe.jpg` retirée, `atelier-2.jpg` ajoutée, une prise de vue manquante en plus. |
| `dossier-v1-sans-brief.zip` | Le même sans aucun fichier du brief (refusé par le studio). |
| `dossier-v1-minimal.zip` | Brief complet, découverte réduite à ce que le CRM exige, sans référence ni média. |
| `dossier-v1-complet.zip` | Le dossier de `dossier-v1.zip` avec un brief complet en 14 sections : sert seulement à la recette de bout en bout (cadrage complet). |
| `brief-seul/` | Les quatre fichiers du brief, pour le démarrage sans dossier du CRM. |
| `attendu-brief-seul.json` | Résumé et fichiers créés par la version 0.2.4 sur `brief-seul/`, relevés avant le lot (non-régression). |
