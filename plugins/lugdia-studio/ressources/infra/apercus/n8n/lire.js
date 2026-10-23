// Sert un fichier d'un aperçu : site et chemin viennent de nginx (map de l'hôte, URI demandée).
const q = $input.first().json.query || {};
const site = String(q.site || '');
let chemin = String(q.chemin || '').replace(/^\/+/, '');
if (chemin === '' || chemin.endsWith('/')) chemin = chemin + 'index.html';
const sd = $getWorkflowStaticData('global');
const valide = /^[a-z0-9-]{2,40}$/.test(site) && /^[a-z0-9][a-z0-9._\/-]{0,200}$/.test(chemin) && chemin.indexOf('..') === -1;
const apercu = valide && sd.apercus ? sd.apercus[site] : null;
let f = apercu && apercu.fichiers ? apercu.fichiers[chemin] : null;
if (f && f.alias) f = apercu.fichiers[f.alias] || null; // fichier identique déposé une seule fois
if (!f) return [{ json: { trouve: false } }];
return [{ json: { trouve: true, type: f.type, b64: f.b64, nom: chemin.split('/').pop() } }];
