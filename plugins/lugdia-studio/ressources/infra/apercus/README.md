# Aperçus clients commentables

Un sous-domaine de lugdia.fr par aperçu (premier : skpatrimoine.lugdia.fr). Le client y voit les maquettes ou le site en cours et laisse des commentaires sur une zone précise.

## Pièces

- `docker-compose.yml` : projet Docker « lugdia-apercus » du VPS (nginx derrière Traefik, réseau de n8n). Le `map` relie chaque hôte à son identifiant d'aperçu ; la règle Traefik liste les hôtes.
- Workflow n8n « Lugdia · Aperçus clients » (dossier Lugdia CRM) : `n8n/*.js` sont ses nœuds Code, `n8n/workflow-premiere-version.ts` sa première version en code SDK (sans la gestion des fichiers identiques, ajoutée ensuite : voir `lire.js` et `depot.js`).
  - `GET /webhook/lugdia-apercu-fichier?site=&chemin=` : sert un fichier déposé ;
  - `POST /webhook/lugdia-apercu-depot` (en-tête `x-depot`) : dépose les fichiers d'un aperçu ; `mode: "remplacer"` vide d'abord l'aperçu, `alias` évite de renvoyer un fichier identique, `supprimer: true` retire l'aperçu ;
  - `POST /webhook/lugdia-apercu-commentaire` et `GET /webhook/lugdia-apercu-commentaires?site=` : commentaires, rangés dans la table « Lugdia · Commentaires des aperçus » (statut `masque` pour retirer un commentaire de la page).
- Côté page : le module `commentaires.js` et `commentaires.css` (exemple dans le dépôt du client, `docs/validations/apercu-v1/`).

## Ajouter un aperçu

1. DNS de lugdia.fr : enregistrements A et AAAA du nouveau sous-domaine vers le VPS (ne rien toucher d'autre dans la zone).
2. `docker-compose.yml` : une ligne dans le `map`, l'hôte ajouté à la règle Traefik (`Host(...) || Host(...)`), puis redéploiement du projet par l'API Hostinger.
3. Dépôt des fichiers avec le script du projet client (`construire.py --deposer`).

## Sécurité

- La clé du dépôt est fixée au premier dépôt (32 caractères au moins) et gardée dans les données statiques du workflow ; elle ne figure ni dans le code ni dans ce dépôt (côté poste : `LUGDIA_CLE_DEPOT` ou `~/.lugdia/cle-depot`). Clé perdue : dupliquer le workflow (les données statiques ne suivent pas), le publier, puis déposer avec une nouvelle clé.
- Pages en `noindex`, CSP stricte (rien hors du domaine), débit limité par Traefik et, pour les commentaires, 10 envois par minute et par adresse avec un pot de miel.
- Exécutions réussies non conservées dans n8n.
