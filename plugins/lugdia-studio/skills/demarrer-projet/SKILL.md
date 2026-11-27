---
name: demarrer-projet
description: Démarre le dépôt d’un projet client Lugdia à partir du dossier du studio préparé par le CRM (archive de l’onglet « Site » de la fiche) ou des seuls fichiers produits par brief.lugdia.fr, et le met à jour quand un nouveau dossier arrive. À utiliser quand Soufien dit de démarrer, créer ou préparer le projet ou le site d’un client, à partir de son dossier du CRM ou de son brief.
argument-hint: "<archive du dossier du CRM, dossier décompressé ou dossier des fichiers du brief>"
---

# Démarrer un projet client

Argument, au choix :
- l’**archive du dossier du studio** (`dossier-<client>-<n>.zip`), téléchargée par Soufien dans l’onglet « Site » de la fiche du CRM (bouton « Préparer le dossier du studio ») ; c’est le cas normal ;
- ce même dossier décompressé ;
- à défaut, le dossier où se trouvent les seuls fichiers du brief (pièces jointes de l’e-mail « brief reçu » ou téléchargements de la page `/cdc`).

Sans argument, demande-le. Le script reconnaît tout seul ce qu’on lui donne.

## Étapes

1. **Vérifier le dossier courant.** Il doit être vide, ne contenir que le `README.md` du dépôt GitHub créé par le CRM (bouton « Créer le dépôt du site » de l’onglet « Site », cloné par Soufien), ou être déjà le dépôt de ce client. S’il contient un autre projet (un `package.json`, un `.lugdia/projet.json` d’un autre client), arrête-toi et demande où créer le projet. S’il contient déjà le projet de ce client, voir « Nouveau dossier du CRM » plus bas. L’archive du dossier (`dossier-<client>-<n>.zip`) ou son dossier décompressé, posés dans le dossier courant, ne sont pas « un autre projet » : ce sont la source ; ils ne sont jamais commités (le `.gitignore` du modèle les exclut).

2. **Initialiser** avec le script, qui copie le modèle sans rien écraser et range le brief et le dossier :

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/initialiser-projet.mjs" --source "<archive ou dossier>" --cible .
   ```

   Lis le résumé JSON.
   - `ok: false` : rends le message `erreur` tel quel à Soufien et ne crée rien à la main. Un dossier sans brief est refusé : il faut faire remplir le brief sur brief.lugdia.fr, puis préparer de nouveau le dossier dans l’onglet « Site ».
   - Sans dossier du CRM, si `manquants` n’est pas vide, dis exactement lesquels manquent et où les trouver (pièces jointes de l’e-mail interne, ou boutons de téléchargement de la page `/cdc` du client). Le projet peut continuer avec le seul cahier des charges, mais `brief.json` et `tokens.json` seront demandés avant le point V1.
   - Avec le dossier du CRM (`mode: "dossier"`), le brief est dans `brief/` comme d’habitude, et le dossier ajoute `brief/dossier.json`, `brief/decouverte/`, `brief/references/`, `brief/medias/` et `brief/charte/`. Ce qui manque (prises de vue, droits, preuves à confirmer, blocs incomplets) est déjà dans `docs/a-fournir.md`.

3. **Git** : si le dossier n’est pas un dépôt, `git init -b main`, puis un premier commit : `Démarrage du projet <client> à partir du brief <référence>` (ou `… à partir du dossier du CRM du <date>`). Les originaux du client (`brief/medias/fichiers/`, `brief/charte/`, `brief/references/captures/`) restent hors de git : le CRM les garde. Dans le dépôt créé par le CRM, le `README.md` reste tel quel et le premier commit s’ajoute au sien ; demande à Soufien avant de l’envoyer (`git push -u origin main`).

4. **Charger les règles** : le skill `lugdia-studio:regles-lugdia`.

5. **Lire le brief et le dossier en entier** (`brief/cahier-des-charges.md`, puis `brief/brief.json` et `brief/tokens.json` s’ils sont là, puis la planche ; avec le dossier du CRM, aussi `brief/decouverte/decouverte.md`, `brief/references/references.json` en regardant chaque capture, et `brief/medias/medias.json`) et noter dans `docs/journal.md`, sans rien corriger dans `brief/` :
   - les incohérences (par exemple une preuve annoncée et une autre contradictoire, une page citée dans les hésitations mais absente de l’arborescence, un nom de fichier mal encodé) ;
   - les écarts entre le brief et la découverte (une cible, un service ou un chiffre qui diffèrent), sans trancher : c’est une question pour Soufien ;
   - les pages indispensables qui manquent à l’arborescence (accueil, contact ou prise de rendez-vous, à propos si le brief s’y réfère).

6. **Rendre compte** à Soufien en moins de 15 lignes :
   - client, objectif, bouton principal, pages ;
   - ce qui manque dans `brief/` et le nombre d’éléments « à fournir » ;
   - avec le dossier du CRM : entretien enregistré ou d’après les notes, nombre de références et de captures, médias du client et images générées, droits à confirmer, prises de vue manquantes, preuves à confirmer ;
   - les incohérences et les écarts relevés à l’étape 5 ;
   - le **parcours suggéré** (A vitrine, B immersif, C réservation ou commerce, D campagne, E refonte) avec sa raison tirée du brief et de la découverte (goût pour les animations, images 3D souhaitées, fonctionnalités, priorités, sites que le client aime). Le choix définitif se fait au point V1.

Puis **arrête-toi** : la suite (stratégie, puis direction artistique) se lance sur l’accord de Soufien.

## Nouveau dossier du CRM

Quand Soufien prépare de nouveau le dossier dans le CRM (n° 2, 3…) pour un projet déjà démarré, la même commande le met à jour :

- **Dossier plus récent de la même affaire** (`mode: "mise-a-jour"`) : ce qui vient du CRM dans `brief/` est remplacé, ce que le nouveau dossier n’a plus est retiré, `brief/fichiers-client/` n’est jamais touché ; les nouvelles lignes vont dans `docs/a-fournir.md` (les cases cochées restent), une ligne va au journal. Fais un commit `Dossier du CRM du <date>`, puis dis au producteur ce qui a changé (`crees`, `remplaces`, `retires`) : il relance les agents concernés. Après le point V1 validé, de nouvelles références ne relancent pas les pistes sans l’accord de Soufien.
- **Même dossier** (`mode: "restauration"`, par exemple après un clone du dépôt sur une autre machine) : seuls les originaux absents sont recréés, rien d’autre ne change, aucun commit (ils sont hors de git).
- **Refus** (autre affaire, dossier plus ancien, projet démarré sans dossier du CRM, dossier sans brief) : rends le message tel quel ; rien n’a changé.
