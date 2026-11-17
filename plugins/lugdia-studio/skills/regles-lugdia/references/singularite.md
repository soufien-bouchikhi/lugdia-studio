# Singularité : le contrôle anti-générique

Un site Lugdia n’appartient qu’à son client. Ce contrôle vérifie ce que taste-skill et impeccable ne savent pas voir : que le site parle de ce client-là, et pas d’un métier en général. Les clichés visuels (polices par défaut, dégradés et mises en page usés) restent du ressort de leurs propres contrôles : lint et inspecteur de taste-skill, audit et critique d’impeccable.

Le verdict est rendu par l’agent `controleur-singularite`, seul, aux points V1 (chaque piste), V2 (accueil construit) et V3 (chaque page), dans `recette/singularite.md`. Les autres agents s’en servent pour se relire avant de rendre ; ils ne rendent pas de verdict.

## 1. Le test d’échange

Remplace le nom et la ville du client par ceux d’un concurrent de `docs/recherche/concurrents.md` (à défaut, un concurrent cité dans la découverte). Un bloc qui reste vrai mot pour mot est **interchangeable**. Un titre, une accroche ou une zone haute interchangeable est à reprendre ; une phrase de liaison peut l’être sans gravité.

## 2. Les éléments propres au client

Comptent seulement les éléments tirés de ses sources (brief, découverte, médias), chacun cité avec sa source :

- son histoire (une date, un lieu, un geste fondateur racontés par lui) ;
- son lieu (quartier, ville, paysage, adresse publique) ;
- ses matières, ses outils, ses gestes de métier ;
- ses mots (ceux de la découverte ou de « en ses mots » du brief), en vocabulaire et en ton, jamais en fausse citation ;
- ses vraies photos (`droits: true`) ;
- ses preuves affichables (`confirmee: true`).

Seuils : **au moins 2** dans la zone haute de l’accueil, **au moins 1** sur chaque page. Une piste de V1 se juge sur sa maquette et sur sa section « Ce qui n’appartient qu’à ce client ».

## 3. Les tournures toutes faites

```bash
node scripts/generique.mjs            # docs/contenus, src et public par défaut ; code 1 si une tournure est trouvée
```

La liste est dans `docs/tournures-generiques.txt`, modifiable pour le projet. Aucune occurrence ne reste sans justification. Une expression que le brief rend juste (une offre réellement « clé en main ») va dans `docs/mots-admis.txt`, avec sa raison au journal.

## Verdict

Pour chaque piste ou page : **« singulier »** ou **« à reprendre »**, avec le bloc, la raison et l’agent qui reprend (designer-ui pour une composition, redacteur pour un texte). Zone haute de l’accueil sous le seuil : **bloquant**. Un écart accepté par Soufien est écrit au journal et rappelé dans le dossier de validation.
