---
name: phase
description: Mène une phase d’un projet client Lugdia depuis la session principale (cadrage, direction artistique, accueil, fabrication, recette, retours du client, bascule, après). À utiliser quand Soufien dit « lance la phase N », « passe à la direction artistique », « fais la recette », ou pour enregistrer sa réponse à un point de validation.
argument-hint: "<numéro de phase, ou « réponse » suivi de la décision de Soufien>"
---

# Mener une phase depuis la session principale

C’est la session principale qui orchestre : elle seule peut lancer les agents du studio à coup sûr, parler à Soufien et lui transmettre les dossiers. Charge d’abord `lugdia-studio:organisation-studio` et `lugdia-studio:regles-lugdia`.

## Méthode

Applique toi-même la méthode du chef-orchestre, décrite dans `${CLAUDE_PLUGIN_ROOT}/agents/chef-orchestre.md` (sections 1 à 6) : lis-la en entier avant de commencer. En bref :

1. **Ouvrir** : lis `.lugdia/projet.json`, vérifie la condition d’entrée de la phase demandée dans le tableau des phases, dresse la liste des agents (conditions entre crochets comprises) et vérifie leurs fichiers d’entrée.
2. **Lancer** chaque agent avec l’outil Agent (`lugdia-studio:<nom>`), avec une consigne complète (dossier, phase, parcours, fichiers d’entrée, fichiers attendus, précision du lot, rappel du bloc de remise). Lance dans un même message les agents reliés par `+`.
3. **Contrôler** chaque remise comme le chef-orchestre (bloc complet, fichiers ouverts et dans le lot, rien de provisoire, contrôles décrits), et renvoyer ce qui manque : deux tours de correction au plus, puis blocage remonté à Soufien.
4. **Commiter** après chaque remise acceptée : les fichiers cités dans la remise, plus `docs/journal.md` et `docs/a-fournir.md` s’ils ont changé ; message `<agent> : <ce qui est livré>`.
5. **Clore** avec le producteur. S’il rend un dossier de validation, présente-le à Soufien en moins de 20 lignes (résumé, captures, décisions demandées sous forme de choix, ta recommandation d’abord), puis **attends sa réponse**.

Tu ne lances jamais la phase suivante dans le même élan : chaque phase commence sur une demande de Soufien.

## Réponse de Soufien à un point de validation

Quand Soufien répond (« validé », des retours, un choix entre des options) : relance le producteur avec sa réponse **citée mot pour mot**, pour qu’il l’enregistre. Puis dis à Soufien ce qui change et quelle phase s’ouvre, sans la lancer.

## Résultats que seul Soufien peut produire

Test au lecteur d’écran VoiceOver, envoi de l’aperçu au client, création d’un dépôt, d’un compte ou d’un webhook : demande-le à Soufien avec la procédure exacte, puis relance l’agent concerné avec son résultat.

## Le chef-orchestre en sous-agent

L’agent `lugdia-studio:chef-orchestre` peut mener une phase seul quand il dispose de l’outil Agent. S’il répond qu’il ne l’a pas, reprends la phase toi-même avec cette méthode, à partir de son plan de lancement.
