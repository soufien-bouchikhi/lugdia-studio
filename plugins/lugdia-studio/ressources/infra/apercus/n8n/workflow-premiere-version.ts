import { workflow, node, trigger, ifElse, expr } from '@n8n/workflow-sdk';

// Route 1 : servir un fichier d'aperçu (nginx relaie chaque adresse vers ce webhook, avec cache).
const getFichier = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: { name: 'GET fichier', parameters: { httpMethod: 'GET', path: 'lugdia-apercu-fichier', responseMode: 'responseNode', options: {} } }
});
const lire = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Lire le fichier', parameters: { mode: 'runOnceForAllItems', jsCode: "// Sert un fichier d'un aper\u00e7u : site et chemin viennent de nginx (map de l'h\u00f4te, URI demand\u00e9e).\nconst q = $input.first().json.query || {};\nconst site = String(q.site || '');\nlet chemin = String(q.chemin || '').replace(/^\\/+/, '');\nif (chemin === '' || chemin.endsWith('/')) chemin = chemin + 'index.html';\nconst sd = $getWorkflowStaticData('global');\nconst valide = /^[a-z0-9-]{2,40}$/.test(site) && /^[a-z0-9][a-z0-9._\\/-]{0,200}$/.test(chemin) && chemin.indexOf('..') === -1;\nconst apercu = valide && sd.apercus ? sd.apercus[site] : null;\nconst f = apercu && apercu.fichiers ? apercu.fichiers[chemin] : null;\nif (!f) return [{ json: { trouve: false } }];\nreturn [{ json: { trouve: true, type: f.type, b64: f.b64, nom: chemin.split('/').pop() } }];\n" } }
});
const trouve = ifElse({
  version: 2.3,
  config: { name: 'Trouvé ?', parameters: { conditions: { combinator: 'and', options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ leftValue: expr('{{ $json.trouve }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }] } } }
});
const enFichier = node({
  type: 'n8n-nodes-base.convertToFile', version: 1.1,
  config: { name: 'En fichier', parameters: { operation: 'toBinary', sourceProperty: 'b64', options: { fileName: expr('{{ $json.nom }}'), mimeType: expr('{{ $json.type }}') } } }
});
const repFichier = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Répondre fichier', parameters: { respondWith: 'binary', responseDataSource: 'automatically', options: { responseHeaders: { entries: [{ name: 'Content-Type', value: expr('{{ $(\'Lire le fichier\').item.json.type }}') }, { name: 'Cache-Control', value: 'public, max-age=300' }] } } } }
});
const rep404 = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Répondre introuvable', parameters: { respondWith: 'text', responseBody: 'Introuvable', options: { responseCode: 404, responseHeaders: { entries: [{ name: 'Content-Type', value: 'text/plain; charset=utf-8' }] } } } }
});

// Route 2 : dépôt des fichiers (clé fixée au premier dépôt).
const postDepot = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: { name: 'POST dépôt', parameters: { httpMethod: 'POST', path: 'lugdia-apercu-depot', responseMode: 'responseNode', options: {} } }
});
const depot = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Enregistrer le dépôt', parameters: { mode: 'runOnceForAllItems', jsCode: "// D\u00e9p\u00f4t des fichiers d'un aper\u00e7u. La cl\u00e9 est fix\u00e9e au premier d\u00e9p\u00f4t (32 caract\u00e8res au moins), puis exig\u00e9e.\nconst req = $input.first().json;\nconst h = req.headers || {};\nconst cle = String(h['x-depot'] || '');\nconst sd = $getWorkflowStaticData('global');\nif (!sd.cleDepot && cle.length >= 32) sd.cleDepot = cle;\nif (!cle || cle !== sd.cleDepot) return [{ json: { code: 401, corps: { ok: false, motif: 'cle' } } }];\nconst b = req.body || {};\nconst site = String(b.site || '');\nif (!/^[a-z0-9-]{2,40}$/.test(site)) return [{ json: { code: 422, corps: { ok: false, motif: 'site' } } }];\nif (!sd.apercus) sd.apercus = {};\nif (b.mode === 'remplacer' || !sd.apercus[site]) sd.apercus[site] = { fichiers: {} };\nconst cible = sd.apercus[site];\nconst fichiers = Array.isArray(b.fichiers) ? b.fichiers : [];\nlet n = 0;\nlet octets = 0;\nconst refuses = [];\nfor (const f of fichiers) {\n  const chemin = String(f && f.chemin || '');\n  const b64 = f && typeof f.b64 === 'string' ? f.b64 : '';\n  if (!/^[a-z0-9][a-z0-9._\\/-]{0,200}$/.test(chemin) || chemin.indexOf('..') !== -1 || !/^[A-Za-z0-9+\\/]*={0,2}$/.test(b64)) { refuses.push(chemin); continue; }\n  cible.fichiers[chemin] = { type: String(f.type || 'application/octet-stream').slice(0, 80), b64 };\n  n += 1;\n  octets += Math.floor(b64.length * 3 / 4);\n}\nif (Array.isArray(b.retirer)) for (const c of b.retirer) delete cible.fichiers[String(c)];\nif (b.supprimer === true) delete sd.apercus[site];\nconst reste = sd.apercus[site];\nif (reste) reste.majLe = new Date().toISOString();\nreturn [{ json: { code: 200, corps: { ok: true, site, n, octets, refuses, fichiers: reste ? Object.keys(reste.fichiers).sort() : [] } } }];\n" } }
});
const repDepot = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Répondre dépôt', parameters: { respondWith: 'text', responseBody: expr('{{ JSON.stringify($json.corps) }}'), options: { responseCode: expr('{{ $json.code }}'), responseHeaders: { entries: [{ name: 'Content-Type', value: 'application/json' }] } } } }
});

// Route 3 : enregistrer un commentaire.
const postComm = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: { name: 'POST commentaire', parameters: { httpMethod: 'POST', path: 'lugdia-apercu-commentaire', responseMode: 'responseNode', options: {} } }
});
const verifier = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Vérifier le commentaire', parameters: { mode: 'runOnceForAllItems', jsCode: "// V\u00e9rifie un commentaire avant de l'enregistrer. Le site vient de l'en-t\u00eate pos\u00e9 par nginx.\nconst req = $input.first().json;\nconst b = req.body || {};\nconst h = req.headers || {};\nconst txt = (v, max) => String(v == null ? '' : v).replace(/[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]/g, '').trim().slice(0, max);\nconst num = (v) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(n, 200000)) : 0; };\nconst refus = (motif) => [{ json: { ok: false, corps: JSON.stringify({ ok: false, motif }) } }];\nconst site = txt(h['x-apercu-site'], 40);\nif (txt(b.fax, 50) !== '') return refus('robot');\nif (!/^[a-z0-9-]{2,40}$/.test(site)) return refus('site');\nconst sd = $getWorkflowStaticData('global');\nif (!sd.apercus || !sd.apercus[site]) return refus('site');\nconst piste = txt(b.piste, 10);\nif (!/^[a-z]$/.test(piste)) return refus('piste');\nconst appareil = txt(b.appareil, 10);\nif (['ordi', 'tel'].indexOf(appareil) === -1) return refus('appareil');\nconst theme = txt(b.theme, 10);\nif (['light', 'dark'].indexOf(theme) === -1) return refus('theme');\nconst auteur = txt(b.auteur, 60);\nif (auteur.length < 1) return refus('auteur');\nconst texte = txt(b.texte, 2000);\nif (texte.length < 2) return refus('texte');\nreturn [{ json: { ok: true, ligne: { site, page: txt(b.page, 40) || 'accueil', piste, appareil, theme, x: num(b.x), y: num(b.y), l: num(b.l), h: num(b.h), cible: txt(b.cible, 160), auteur, texte, statut: 'ouvert' } } }];\n" } }
});
const valide = ifElse({
  version: 2.3,
  config: { name: 'Valide ?', parameters: { conditions: { combinator: 'and', options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ leftValue: expr('{{ $json.ok }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }] } } }
});
const inserer = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Enregistrer le commentaire', parameters: { resource: 'row', operation: 'insert', dataTableId: { __rl: true, mode: 'id', value: 'jzPfcCz32CBiMDOt', cachedResultName: 'Lugdia · Commentaires des aperçus' }, columns: { mappingMode: 'defineBelow', value: { site: expr('{{ $json.ligne.site }}'), page: expr('{{ $json.ligne.page }}'), piste: expr('{{ $json.ligne.piste }}'), appareil: expr('{{ $json.ligne.appareil }}'), theme: expr('{{ $json.ligne.theme }}'), x: expr('{{ $json.ligne.x }}'), y: expr('{{ $json.ligne.y }}'), l: expr('{{ $json.ligne.l }}'), h: expr('{{ $json.ligne.h }}'), cible: expr('{{ $json.ligne.cible }}'), auteur: expr('{{ $json.ligne.auteur }}'), texte: expr('{{ $json.ligne.texte }}'), statut: expr('{{ $json.ligne.statut }}') }, schema: [{ id: 'site', displayName: 'site', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'page', displayName: 'page', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'piste', displayName: 'piste', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'appareil', displayName: 'appareil', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'theme', displayName: 'theme', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'x', displayName: 'x', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true }, { id: 'y', displayName: 'y', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true }, { id: 'l', displayName: 'l', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true }, { id: 'h', displayName: 'h', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true }, { id: 'cible', displayName: 'cible', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'auteur', displayName: 'auteur', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'texte', displayName: 'texte', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'statut', displayName: 'statut', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }] }, options: {} } }
});
const repComm = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Répondre commentaire', parameters: { respondWith: 'text', responseBody: expr('{{ JSON.stringify({ ok: true, commentaire: { id: $json.id, creeLe: $json.createdAt } }) }}'), options: { responseCode: 201, responseHeaders: { entries: [{ name: 'Content-Type', value: 'application/json' }] } } } }
});
const repRefus = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Répondre refus', parameters: { respondWith: 'text', responseBody: expr('{{ $json.corps }}'), options: { responseCode: 422, responseHeaders: { entries: [{ name: 'Content-Type', value: 'application/json' }] } } } }
});

// Route 4 : liste des commentaires d'un site.
const getComms = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: { name: 'GET commentaires', parameters: { httpMethod: 'GET', path: 'lugdia-apercu-commentaires', responseMode: 'responseNode', options: {} } }
});
const lireComms = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Lire les commentaires', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: 'jzPfcCz32CBiMDOt', cachedResultName: 'Lugdia · Commentaires des aperçus' }, matchType: 'allConditions', filters: { conditions: [{ keyName: 'site', condition: 'eq', keyValue: expr('{{ $json.query.site }}') }] }, returnAll: true, orderBy: true, orderByColumn: 'createdAt', orderByDirection: 'ASC' } }
});
const assembler = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Assembler la liste', parameters: { mode: 'runOnceForAllItems', jsCode: "// Liste des commentaires d'un site, dans l'ordre de cr\u00e9ation ; statut \u00ab masque \u00bb = retir\u00e9 de la page.\nconst lignes = $input.all().map((i) => i.json).filter((r) => r && r.id != null && r.statut !== 'masque');\nconst commentaires = lignes.map((r) => ({ id: r.id, page: r.page, piste: r.piste, appareil: r.appareil, theme: r.theme, x: r.x, y: r.y, l: r.l, h: r.h, cible: r.cible, auteur: r.auteur, texte: r.texte, statut: r.statut, creeLe: r.createdAt }));\nreturn [{ json: { corps: JSON.stringify({ ok: true, commentaires }) } }];\n" } }
});
const repComms = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Répondre liste', parameters: { respondWith: 'text', responseBody: expr('{{ $json.corps }}'), options: { responseHeaders: { entries: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Cache-Control', value: 'no-store' }] } } } }
});

export default workflow('lugdia-apercus', 'Lugdia · Aperçus clients')
  .add(getFichier).to(lire).to(trouve.onTrue(enFichier.to(repFichier)).onFalse(rep404))
  .add(postDepot).to(depot).to(repDepot)
  .add(postComm).to(verifier).to(valide.onTrue(inserer.to(repComm)).onFalse(repRefus))
  .add(getComms).to(lireComms).to(assembler).to(repComms);
