// Démarre un projet client Lugdia à partir des fichiers produits par brief.lugdia.fr.
// Usage : node initialiser-projet.mjs --source <dossier des fichiers du brief> [--cible <dossier du projet>]
// Copie le modèle de projet sans rien écraser, range les fichiers du brief sous des noms fixes,
// remplit .lugdia/projet.json et les fichiers du modèle, extrait le plan de collecte.
// Écrit un résumé JSON sur la sortie standard. Aucun appel réseau, aucune commande git.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import { join, dirname, extname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const MODELE = join(ici, '..', 'templates', 'projet-client');
const RENOMMER = { gitignore: '.gitignore', 'env.example': '.env.example' };

const args = lireArguments(process.argv.slice(2));
if (!args.source) arreter('Indique le dossier des fichiers du brief : --source <dossier>.');
const source = resolve(args.source);
const cible = resolve(args.cible || process.cwd());
if (!existsSync(source) || !statSync(source).isDirectory()) arreter('Dossier introuvable : ' + source);

// 1. Fichiers du brief reconnus par leur contenu, pas seulement par leur nom.
const trouves = { cdc: null, brief: null, tokens: null, planche: null, autres: [] };
for (const nom of readdirSync(source)) {
  const chemin = join(source, nom);
  if (!statSync(chemin).isFile() || nom.startsWith('.')) continue;
  const ext = extname(nom).toLowerCase();
  if (ext === '.md' && /cahier/i.test(nom) && !trouves.cdc) trouves.cdc = chemin;
  else if (ext === '.json') {
    const schema = schemaDe(chemin);
    if (schema === 'lugdia-brief/2' && !trouves.brief) trouves.brief = chemin;
    else if (schema === 'lugdia-tokens/1' && !trouves.tokens) trouves.tokens = chemin;
    else trouves.autres.push(chemin);
  } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext) && /identit|planche/i.test(nom) && !trouves.planche) trouves.planche = chemin;
  else trouves.autres.push(chemin);
}
if (!trouves.cdc && !trouves.brief) arreter('Ni cahier des charges (.md) ni brief.json (schema lugdia-brief/2) dans ' + source + '.');

// 2. Informations du projet : brief.json d'abord, cahier des charges ensuite.
const cdc = trouves.cdc ? readFileSync(trouves.cdc, 'utf8') : '';
const brief = trouves.brief ? JSON.parse(readFileSync(trouves.brief, 'utf8')) : null;
const client = (brief && brief.entreprise && brief.entreprise.nom) || (cdc.match(/^# Cahier des charges : site internet de (.+)$/m) || [])[1] || 'Client';
const ref = (brief && brief.ref) || (cdc.match(/Référence (CDC-[A-Za-z0-9-]+)/) || [])[1] || '';
const slug = (brief && brief.entreprise && brief.entreprise.slug) || (ref.match(/^CDC-(.+)-\d{8}-[A-Za-z0-9]{4}$/) || [])[1] || slugifier(client);
const domaineBrief = brief && brief.technique && brief.technique.domaine;
const domaine = String(
  (domaineBrief && typeof domaineBrief === 'object' ? domaineBrief.nom : domaineBrief) ||
  (cdc.match(/\*\*Nom de domaine\*\* : .*?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/i) || [])[1] ||
  'à définir'
).trim().toLowerCase();
const date = new Date().toISOString().slice(0, 10);
const valeurs = { CLIENT: client, SLUG: slug, REF: ref || 'sans référence', DOMAINE: domaine, DATE: date };

// 3. Modèle copié sans rien écraser.
const crees = [];
const gardes = [];
copierModele(MODELE, cible);

// 4. Fichiers du brief sous des noms fixes (un original existant n'est jamais remplacé).
const brut = join(cible, 'brief');
mkdirSync(join(brut, 'fichiers-client'), { recursive: true });
ranger(trouves.cdc, join(brut, 'cahier-des-charges.md'));
ranger(trouves.brief, join(brut, 'brief.json'));
ranger(trouves.tokens, join(brut, 'tokens.json'));
ranger(trouves.planche, join(brut, 'identite' + (trouves.planche ? extname(trouves.planche).toLowerCase() : '.png')));
for (const f of trouves.autres) ranger(f, join(brut, 'fichiers-client', basename(f)));

// 5. Plan de collecte du cahier des charges → docs/a-fournir.md.
const collecte = (cdc.split(/\*\*Plan de collecte\*\*/)[1] || '').split(/\n## /)[0]
  .split('\n').map((l) => l.trim()).filter((l) => l.startsWith('- '))
  .map((l) => l.slice(2).replace(/\\([\\`*_{}[\]()#+\-.!|>])/g, '$1'));
const aFournir = join(cible, 'docs', 'a-fournir.md');
if (!existsSync(aFournir)) {
  const lignes = ['# À fournir par le client', '', 'Repris du plan de collecte du cahier des charges ' + valeurs.REF + '. Cocher quand c’est reçu, avec la date.', ''];
  for (const l of collecte) lignes.push('- [ ] ' + l);
  if (!collecte.length) lignes.push('- [ ] (plan de collecte absent du cahier des charges : à établir en rendez-vous)');
  writeFileSync(aFournir, lignes.join('\n') + '\n');
  crees.push('docs/a-fournir.md');
}

const manquants = ['cahier-des-charges.md', 'brief.json', 'tokens.json']
  .filter((f) => !existsSync(join(brut, f)));
if (!existsSync(join(brut, 'identite.png')) && !existsSync(join(brut, 'identite.jpg')) && !existsSync(join(brut, 'identite.webp'))) manquants.push('identite.png');

process.stdout.write(JSON.stringify({ ok: true, cible, client, slug, ref, domaine, crees, gardes, manquants, aFournir: collecte.length }, null, 2) + '\n');

function copierModele(de, vers) {
  for (const nom of readdirSync(de)) {
    const src = join(de, nom);
    const nomCible = RENOMMER[nom] || nom;
    const dst = join(vers, nomCible);
    if (statSync(src).isDirectory()) {
      mkdirSync(dst, { recursive: true });
      copierModele(src, dst);
      continue;
    }
    const relatif = dst.slice(cible.length + 1);
    if (existsSync(dst)) { gardes.push(relatif); continue; }
    let texte = readFileSync(src, 'utf8');
    texte = texte.replace(/\{\{(CLIENT|SLUG|REF|DOMAINE|DATE)\}\}/g, (_, k) => (nom.endsWith('.json') ? JSON.stringify(valeurs[k]).slice(1, -1) : valeurs[k]));
    mkdirSync(dirname(dst), { recursive: true });
    writeFileSync(dst, texte);
    crees.push(relatif);
  }
}

function ranger(de, vers) {
  if (!de) return;
  const relatif = vers.slice(cible.length + 1);
  if (existsSync(vers)) { gardes.push(relatif); return; }
  copyFileSync(de, vers);
  crees.push(relatif);
}

function schemaDe(chemin) {
  try { return JSON.parse(readFileSync(chemin, 'utf8')).schema || ''; } catch { return ''; }
}

function slugifier(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'client';
}

function lireArguments(liste) {
  const r = {};
  for (let i = 0; i < liste.length; i++) {
    if (liste[i] === '--source') r.source = liste[++i];
    else if (liste[i] === '--cible') r.cible = liste[++i];
  }
  return r;
}

function arreter(message) {
  process.stdout.write(JSON.stringify({ ok: false, erreur: message }) + '\n');
  process.exit(1);
}
