# Formulaires des sites clients : contrat avec n8n

Contrat Lugdia, version 1. Il reprend celui de lugdia.fr. Tout formulaire d’un site client l’applique ; un champ propre au métier s’ajoute dans `donnees`, jamais à la racine.

## Envoi

`POST` en JSON vers `PUBLIC_WEBHOOK_URL` (variable publique du site, fournie par Lugdia), délai d’attente de 15 secondes, aucun nouvel essai automatique.

```json
{
  "id": "identifiant unique de l’envoi, créé à l’ouverture du formulaire",
  "site": "slug du projet (.lugdia/projet.json)",
  "page": "/chemin/de/la/page",
  "type": "rendez-vous | contact | estimation | questionnaire | …",
  "date": "2026-10-23T14:05:00.000Z",
  "dureeMs": 34210,
  "contact": { "prenom": "", "nom": "", "email": "", "telephone": "", "message": "" },
  "donnees": { },
  "consentement": true,
  "fax": ""
}
```

- `fax` est le pot de miel : champ caché aux humains (hors écran, `tabindex="-1"`, `autocomplete="off"`, étiquette neutre), toujours vide pour un visiteur réel.
- `dureeMs` : temps passé entre l’ouverture et l’envoi ; n8n refuse en dessous du minimum (par défaut 3 secondes pour un formulaire court).
- `id` permet à n8n d’écarter un double envoi.
- `consentement` n’existe que si le formulaire demande un accord explicite (lettre d’information par exemple), jamais coché d’avance.

## Réponses de n8n

| Code | Corps | Cause |
|---|---|---|
| 200 | `{ "ok": true }` | Reçu |
| 200 | `{ "ok": true, "deja": true }` | Même `id` déjà reçu : afficher le même succès |
| 422 | `{ "ok": false, "motif": "email" }` | Adresse invalide |
| 422 | `{ "ok": false, "motif": "champs" }` | Champ obligatoire vide ou trop long |
| 422 | `{ "ok": false, "motif": "robot" }` | Pot de miel rempli ou envoi trop rapide |
| 429 | `{ "ok": false, "motif": "limite" }` | Trop d’envois depuis cette adresse |
| 5xx, délai dépassé, réseau | — | Serveur ou connexion indisponible |

## Messages au visiteur (un par cause)

| Cause | Message (à adapter au ton du client, sans changer le sens) |
|---|---|
| Succès | « Merci, votre demande est bien envoyée. » suivi de ce qui va se passer et du délai de réponse **seulement s’il figure dans le brief** |
| `email` | « Cette adresse e-mail semble incomplète. Pouvez-vous la vérifier ? » (relié au champ) |
| `champs` | Le message du champ concerné, relié par `aria-describedby` |
| `robot` | « L’envoi n’a pas pu aboutir. Merci de réessayer dans un instant. » |
| `limite` | « Vous avez déjà envoyé plusieurs demandes. Merci de patienter quelques minutes. » |
| Réseau ou serveur | « La connexion a échoué. Vos réponses sont conservées : vous pouvez réessayer, ou nous écrire à <e-mail public du client>. » |

Règles communes : le bouton d’envoi est verrouillé pendant l’envoi (`aria-busy`), l’état « envoyé » ne s’affiche qu’après `ok: true`, le message est annoncé (`role="status"` pour un succès, `role="alert"` pour une erreur) et le focus va sur lui, les champs saisis restent en place en cas d’échec.

## Côté n8n

Un workflow par site, ou un workflow commun qui lit `site`, avec les origines autorisées limitées au domaine du client et à l’adresse de l’aperçu. Il est créé par Lugdia, pas par l’agent : si le webhook n’existe pas encore, l’agent le signale dans sa remise et teste avec une adresse fictive.
