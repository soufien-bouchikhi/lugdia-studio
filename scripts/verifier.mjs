// Contrôles du dépôt Lugdia Studio, à lancer avant chaque commit et chaque version :
// JSON lisibles, sources tierces figées sur un commit complet, skills avec nom et description,
// aucun secret ni chemin personnel, version du plugin cohérente, validation officielle de Claude Code.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const racine = new URL('..', import.meta.url).pathname;
const erreurs = [];
const avertissements = [];

const tous = lister(racine).filter((f) => !f.includes('/.git/') && !f.includes('/node_modules/'));

// 1. JSON lisibles.
for (const f of tous.filter((f) => f.endsWith('.json'))) {
  try { JSON.parse(readFileSync(f, 'utf8')); } catch (e) { erreurs.push(rel(f) + ' : JSON illisible (' + e.message + ')'); }
}

// 2. Sources tierces figées sur un commit.
const marche = JSON.parse(readFileSync(join(racine, '.claude-plugin/marketplace.json'), 'utf8'));
for (const p of marche.plugins) {
  if (typeof p.source === 'string') continue;
  if (!/^[0-9a-f]{40}$/.test(p.source.sha || '')) erreurs.push('marketplace : « ' + p.name + ' » doit être figé sur un commit complet (sha de 40 caractères).');
  if (!p.license) avertissements.push('marketplace : « ' + p.name + ' » sans licence indiquée.');
}

// 3. Dépendances déclarées présentes dans la place de marché.
const plugin = JSON.parse(readFileSync(join(racine, 'plugins/lugdia-studio/.claude-plugin/plugin.json'), 'utf8'));
const noms = new Set(marche.plugins.map((p) => p.name));
for (const d of plugin.dependencies || []) if (!noms.has(typeof d === 'string' ? d.split('@')[0] : d.name)) erreurs.push('plugin.json : dépendance « ' + JSON.stringify(d) + ' » absente de la place de marché.');

// 4. Skills et agents : nom et description dans l'en-tête.
for (const f of tous.filter((f) => /\/skills\/[^/]+\/SKILL\.md$/.test(f) || /\/agents\/.+\.md$/.test(f))) {
  const t = readFileSync(f, 'utf8');
  const tete = (t.match(/^---\n([\s\S]*?)\n---/) || [])[1];
  if (!tete) { erreurs.push(rel(f) + ' : en-tête YAML absent.'); continue; }
  if (!/^name: [a-z0-9-]+$/m.test(tete)) erreurs.push(rel(f) + ' : « name » absent ou pas en kebab-case.');
  if (!/^description: .{40,}/m.test(tete)) erreurs.push(rel(f) + ' : « description » absente ou trop courte.');
}

// 4 bis. Agents : nom = nom du fichier, description YAML sûre, couleur permise, skills préchargés existants,
// chemins ${CLAUDE_PLUGIN_ROOT} existants.
const PLUGIN = join(racine, 'plugins/lugdia-studio');
const skillsPlugin = new Set(readdirSync(join(PLUGIN, 'skills')).map((s) => 'lugdia-studio:' + s));
const COULEURS = new Set(['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan']);
for (const f of tous.filter((f) => f.startsWith(join(PLUGIN, 'agents') + '/') && f.endsWith('.md'))) {
  const t = readFileSync(f, 'utf8');
  const tete = (t.match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
  const nom = (tete.match(/^name: (.+)$/m) || [])[1];
  if (nom && nom + '.md' !== f.split('/').pop()) erreurs.push(rel(f) + ' : « name » (' + nom + ') différent du nom de fichier.');
  const desc = (tete.match(/^description: (.+)$/m) || [])[1] || '';
  if (/: /.test(desc) || /^["']/.test(desc)) erreurs.push(rel(f) + ' : la description contient « : » ou commence par un guillemet (YAML fragile).');
  const couleur = (tete.match(/^color: (.+)$/m) || [])[1];
  if (couleur && !COULEURS.has(couleur.trim())) erreurs.push(rel(f) + ' : couleur « ' + couleur + ' » non permise.');
  for (const s of tete.matchAll(/^\s+- (lugdia-studio:[a-z0-9-]+)$/gm)) if (!skillsPlugin.has(s[1])) erreurs.push(rel(f) + ' : skill préchargé inconnu ' + s[1]);
  if (!/lugdia-studio:regles-lugdia/.test(tete)) erreurs.push(rel(f) + ' : ne précharge pas lugdia-studio:regles-lugdia.');
  for (const m of t.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^\s`)]+)/g)) if (!existsSync(join(PLUGIN, m[1]))) erreurs.push(rel(f) + ' : chemin introuvable ' + m[1]);
  if (!/## Remise/.test(t)) erreurs.push(rel(f) + ' : section « Remise » absente.');
}

// 5. Liens relatifs des skills vers des fichiers existants.
for (const f of tous.filter((f) => f.endsWith('.md') && f.includes('/skills/'))) {
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/\]\((?!https?:|#)([^)]+)\)/g)) {
    const cible = join(f, '..', m[1]);
    if (!existsSync(cible)) erreurs.push(rel(f) + ' : lien cassé vers ' + m[1]);
  }
}

// 6. Aucun secret, aucun chemin personnel.
const MOTIFS = [
  [/sk-[A-Za-z0-9_-]{20,}/, 'clé API'],
  [/(?:api[_-]?key|token|secret|password)["']?\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i, 'secret en clair'],
  [/\/Users\/[a-z]+\/|\/home\/claude\//, 'chemin personnel']
];
for (const f of tous.filter((f) => /\.(json|md|mjs|js|ts|sh|txt|example)$/.test(f) && !f.endsWith('verifier.mjs'))) {
  const t = readFileSync(f, 'utf8');
  for (const [re, quoi] of MOTIFS) if (re.test(t)) erreurs.push(rel(f) + ' : ' + quoi + ' détecté.');
}

// 7. Validation officielle de Claude Code (place de marché, puis plugin).
for (const cible of ['.', 'plugins/lugdia-studio']) {
  try {
    const sortie = execFileSync('claude', ['plugin', 'validate', join(racine, cible)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (/warning/i.test(sortie)) avertissements.push('claude plugin validate ' + cible + ' :\n' + sortie.trim());
  } catch (e) {
    if (e.code === 'ENOENT') avertissements.push('claude introuvable : validation officielle non lancée.');
    else erreurs.push('claude plugin validate ' + cible + ' :\n' + ((e.stdout || '') + (e.stderr || '')).trim());
  }
}

for (const a of avertissements) console.log('Attention : ' + a);
for (const e of erreurs) console.log('Erreur : ' + e);
console.log(erreurs.length ? erreurs.length + ' erreur(s).' : 'Lugdia Studio : tous les contrôles passent.');
process.exit(erreurs.length ? 1 : 0);

function lister(d) {
  return readdirSync(d).flatMap((n) => {
    const c = join(d, n);
    return statSync(c).isDirectory() ? (n === '.git' || n === 'node_modules' ? [] : lister(c)) : [c];
  });
}
function rel(f) { return relative(racine, f); }
