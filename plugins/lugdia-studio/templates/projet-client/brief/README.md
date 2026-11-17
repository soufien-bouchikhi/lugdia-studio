# Brief du client

Fichiers produits par brief.lugdia.fr, en lecture seule :

- `cahier-des-charges.md` : le cahier des charges complet (14 sections).
- `brief.json` : la même commande, structurée (`schema: lugdia-brief/2`).
- `tokens.json` : les jetons de design (`schema: lugdia-tokens/1`). `mode` vaut `clair`, `sombre` ou `les-deux` (thème clair et thème sombre, couleurs du sombre dans `couleursSombre`).
- `identite.png` : la planche d’identité visuelle.
- `fichiers-client/` : documents déposés ou envoyés par le client (logo, flyer, photos).

Quand le projet vient du dossier du studio préparé par le CRM (onglet « Site » de la fiche), s’y ajoutent :

- `dossier.json` : affaire, date du dossier, état de chaque bloc.
- `decouverte/` : l’entretien de découverte (`decouverte.md` à lire, `decouverte.json` structuré).
- `references/` : les sites que le client aime (`references.json`) et leurs captures (`captures/`, usage interne).
- `medias/` : l’inventaire des médias (`medias.json`, droits et prises de vue manquantes) et les originaux (`fichiers/`).
- `charte/` : logo, charte et polices du client.

Ces fichiers sont rangés par `lugdia-studio:demarrer-projet`, qui les met à jour quand un nouveau dossier arrive. Les originaux (`medias/fichiers/`, `charte/`, `references/captures/`) sont hors de git : le CRM les garde.

Une erreur ou un manque dans ces fichiers se note dans `docs/journal.md` et se signale au point de validation suivant ; on ne modifie pas l’original.
