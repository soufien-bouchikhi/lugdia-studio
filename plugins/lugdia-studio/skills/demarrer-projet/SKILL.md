---
name: demarrer-projet
description: Démarre le dépôt d’un projet client Lugdia à partir des fichiers produits par brief.lugdia.fr (cahier des charges, brief.json, tokens.json, planche d’identité). À utiliser quand Soufien dit de démarrer, créer ou préparer le projet ou le site d’un client à partir de son brief.
argument-hint: "<dossier qui contient les fichiers du brief>"
---

# Démarrer un projet client

Argument : le dossier où se trouvent les fichiers du brief (pièces jointes de l’e-mail « brief reçu » ou téléchargements de la page `/cdc`). Sans argument, demande-le.

## Étapes

1. **Vérifier le dossier courant.** Il doit être vide, ou être déjà le dépôt de ce client. S’il contient un autre projet (un `package.json`, un `.lugdia/projet.json` d’un autre client), arrête-toi et demande où créer le projet.

2. **Initialiser** avec le script, qui copie le modèle sans rien écraser et range le brief :

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/initialiser-projet.mjs" --source "<dossier du brief>" --cible .
   ```

   Lis le résumé JSON. Si `manquants` n’est pas vide, dis exactement lesquels manquent et où les trouver (pièces jointes de l’e-mail interne, ou boutons de téléchargement de la page `/cdc` du client). Le projet peut continuer avec le seul cahier des charges, mais `brief.json` et `tokens.json` seront demandés avant le point V1.

3. **Git** : si le dossier n’est pas un dépôt, `git init -b main`, puis un premier commit : `Démarrage du projet <client> à partir du brief <référence>`.

4. **Charger les règles** : le skill `lugdia-studio:regles-lugdia`.

5. **Lire le brief en entier** (`brief/cahier-des-charges.md`, puis `brief/brief.json` et `brief/tokens.json` s’ils sont là, puis la planche) et noter dans `docs/journal.md`, sans rien corriger dans `brief/` :
   - les incohérences (par exemple une preuve annoncée et une autre contradictoire, une page citée dans les hésitations mais absente de l’arborescence, un nom de fichier mal encodé) ;
   - les pages indispensables qui manquent à l’arborescence (accueil, contact ou prise de rendez-vous, à propos si le brief s’y réfère).

6. **Rendre compte** à Soufien en moins de 15 lignes :
   - client, objectif, bouton principal, pages ;
   - ce qui manque dans `brief/` et le nombre d’éléments « à fournir » ;
   - les incohérences relevées à l’étape 5 ;
   - le **parcours suggéré** (A vitrine, B immersif, C réservation ou commerce, D campagne, E refonte) avec sa raison tirée du brief (goût pour les animations, images 3D souhaitées, fonctionnalités, priorités). Le choix définitif se fait au point V1.

Puis **arrête-toi** : la suite (stratégie, puis direction artistique) se lance sur l’accord de Soufien.
