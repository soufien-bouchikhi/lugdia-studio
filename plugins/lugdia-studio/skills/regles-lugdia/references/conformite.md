# Conformité, référencement et sécurité

## Mentions et pages obligatoires

- **Mentions légales** : éditeur (dénomination, forme, SIREN, adresse du siège, contact), directeur de la publication, hébergeur (nom, adresse, contact). Les informations manquantes sont « à fournir », jamais inventées.
- **Mentions du métier** : celles de la section 11 du cahier des charges, aux endroits indiqués (pied de page, page dédiée, près des formulaires). Une mention marquée « Règle » s’applique dès que le sujet apparaît sur le site. Une mention marquée « À vérifier » est affichée avec la valeur fournie par le client, sinon « à fournir ».
- **Politique de confidentialité** : responsable du traitement, finalités, base légale, durées de conservation, destinataires, droits et comment les exercer, droit de réclamation auprès de la CNIL.
- **Accessibilité** : une déclaration d’accessibilité courte (niveau visé, contact pour signaler un problème).

## Formulaires

- Une phrase d’information sous chaque formulaire : qui reçoit les données, pour quoi faire, combien de temps, lien vers la politique de confidentialité.
- Aucune case précochée, aucun champ inutile.
- Envoi vers le webhook n8n prévu par Lugdia (variable publique `PUBLIC_WEBHOOK_URL`), selon le contrat de `formulaires.md` (charge, réponses, un message par cause), jamais vers un service tiers non prévu au brief.
- Pot de miel et durée minimale contre les robots ; aucun CAPTCHA tiers par défaut.
- Aucune donnée de santé collectée.

## Cookies et traceurs

- Mesure d’audience sans cookie (Umami ou équivalent), donc sans bandeau.
- Carte, vidéo, agenda, réseaux sociaux : chargés au clic, avec une phrase qui dit ce qui sera chargé.
- Aucun cookie tiers, aucun pixel publicitaire sans consentement explicite et sans accord de Soufien.

## Intelligence artificielle (AI Act)

- Un chatbot ou un assistant sur le site se présente comme une IA dès le premier message (article 50).
- Les images, vidéos ou voix générées réalistes sont signalées (voir `medias.md`).

## Référencement et moteurs de réponse

- Une balise `title` (≤ 60 caractères) et une `meta description` (≤ 155 caractères) propres à chaque page, rédigées avec les mots-clés du brief, sans bourrage.
- Données structurées JSON-LD selon l’activité indiquée dans le brief (par exemple `FinancialService`, `RealEstateAgent`, `LocalBusiness`, `EducationalOrganization`), validées, sans aucune information absente du brief (pas d’`aggregateRating` sans vrais avis).
- `sitemap.xml`, `robots.txt`, URL canoniques, image de partage 1200 × 630, favicon et icônes.
- `llms.txt` : qui est l’entreprise, ce qu’elle fait, où, comment la contacter, avec les seules informations du brief.
- Pages locales : une par adresse réelle, avec un texte propre (jamais une copie en changeant la ville).
- Aperçus et préproductions : `noindex, nofollow` et `X-Robots-Tag`.

## Sécurité

- Aucun secret dans le dépôt : seules des variables `PUBLIC_*` non sensibles côté site. Les clés (OpenRouter, e-mail, CRM) vivent dans n8n.
- `.env` jamais commité ; `.env.example` à jour.
- En-têtes : `Content-Security-Policy` stricte, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Dépendances : versions figées, `npm audit` propre avant la mise en ligne.
