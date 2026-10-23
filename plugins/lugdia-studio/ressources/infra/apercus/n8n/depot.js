// Dépôt des fichiers d'un aperçu. La clé est fixée au premier dépôt (32 caractères au moins), puis exigée.
const req = $input.first().json;
const h = req.headers || {};
const cle = String(h['x-depot'] || '');
const sd = $getWorkflowStaticData('global');
if (!sd.cleDepot && cle.length >= 32) sd.cleDepot = cle;
if (!cle || cle !== sd.cleDepot) return [{ json: { code: 401, corps: { ok: false, motif: 'cle' } } }];
const b = req.body || {};
const site = String(b.site || '');
if (!/^[a-z0-9-]{2,40}$/.test(site)) return [{ json: { code: 422, corps: { ok: false, motif: 'site' } } }];
if (!sd.apercus) sd.apercus = {};
if (b.mode === 'remplacer' || !sd.apercus[site]) sd.apercus[site] = { fichiers: {} };
const cible = sd.apercus[site];
const fichiers = Array.isArray(b.fichiers) ? b.fichiers : [];
let n = 0;
let octets = 0;
const refuses = [];
for (const f of fichiers) {
  const chemin = String(f && f.chemin || '');
  const b64 = f && typeof f.b64 === 'string' ? f.b64 : '';
  const alias = f && typeof f.alias === 'string' ? f.alias : '';
  if (!/^[a-z0-9][a-z0-9._\/-]{0,200}$/.test(chemin) || chemin.indexOf('..') !== -1 || !/^[A-Za-z0-9+\/]*={0,2}$/.test(b64)) { refuses.push(chemin); continue; }
  if (alias) { if (!cible.fichiers[alias] || cible.fichiers[alias].alias) { refuses.push(chemin); continue; } cible.fichiers[chemin] = { alias }; n += 1; continue; }
  cible.fichiers[chemin] = { type: String(f.type || 'application/octet-stream').slice(0, 80), b64 };
  n += 1;
  octets += Math.floor(b64.length * 3 / 4);
}
if (Array.isArray(b.retirer)) for (const c of b.retirer) delete cible.fichiers[String(c)];
if (b.supprimer === true) delete sd.apercus[site];
const reste = sd.apercus[site];
if (reste) reste.majLe = new Date().toISOString();
return [{ json: { code: 200, corps: { ok: true, site, n, octets, refuses, fichiers: reste ? Object.keys(reste.fichiers).sort() : [] } } }];
