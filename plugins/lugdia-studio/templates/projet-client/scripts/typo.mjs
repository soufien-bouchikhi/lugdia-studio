// Contrôle de la typographie française dans les textes du site.
// Usage : node scripts/typo.mjs [--corriger] [fichiers ou dossiers…]   (par défaut : docs/contenus)
// Repère : espace ordinaire avant « : ; ? ! » » et après « « » (il faut une espace insécable),
// apostrophe droite dans le texte, points de suspension en trois points.
// --corriger : corrige ces trois points, seulement dans les fichiers Markdown, hors code.
// Sort avec le code 1 s'il reste un défaut.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const args = process.argv.slice(2);
const corriger = args.includes('--corriger');
const cibles = args.filter((a) => a !== '--corriger');
const fichiers = [];
const parcourir = (c) => {
  if (!existsSync(c)) return;
  if (statSync(c).isDirectory()) {
    for (const n of readdirSync(c)) if (!['node_modules', '.git'].includes(n)) parcourir(join(c, n));
  } else if (['.md', '.mdx', '.astro', '.html', '.txt'].includes(extname(c).toLowerCase())) fichiers.push(c);
};
(cibles.length ? cibles : ['docs/contenus']).forEach(parcourir);

const NBSP = ' ';
const REGLES = [
  { nom: 'espace ordinaire avant : ; ? ! »', re: / ([:;?!»])/g, corr: (s) => s.replace(/ ([:;?!»])/g, NBSP + '$1') },
  { nom: 'espace ordinaire après «', re: /« /g, corr: (s) => s.replace(/« /g, '«' + NBSP) },
  { nom: 'apostrophe droite', re: /(\p{L})'(\p{L})/gu, corr: (s) => s.replace(/(\p{L})'(\p{L})/gu, '$1’$2') },
  { nom: 'trois points au lieu de …', re: /(?<!\.)\.\.\.(?!\.)/g, corr: (s) => s.replace(/(?<!\.)\.\.\.(?!\.)/g, '…') },
];

// Ne touche jamais au code : blocs ```, `code`, balises et attributs HTML, adresses.
const proteger = (ligne) => {
  const morceaux = [];
  const texte = ligne.replace(/`[^`]*`|<[^>]+>|https?:\/\/\S+|\{[^}]*\}/g, (m) => {
    morceaux.push(m);
    return '\u0000' + (morceaux.length - 1) + '\u0000';
  });
  return { texte, rendre: (s) => s.replace(/\u0000(\d+)\u0000/g, (_, i) => morceaux[i]) };
};

let defauts = 0;
for (const f of fichiers) {
  const md = /\.mdx?$/.test(f);
  let dansCode = false;
  let change = false;
  const lignes = readFileSync(f, 'utf8').split('\n').map((ligne, i) => {
    if (/^\s*(```|~~~)/.test(ligne)) { dansCode = !dansCode; return ligne; }
    if (dansCode || /^\s*(import|export|const|let|---)/.test(ligne)) return ligne;
    const p = proteger(ligne);
    let t = p.texte;
    for (const r of REGLES) {
      r.re.lastIndex = 0;
      if (!r.re.test(t)) continue;
      if (corriger && md) { t = r.corr(t); change = true; }
      else { defauts++; console.log(`${f}:${i + 1} ${r.nom}\n    ${ligne.trim().slice(0, 160)}`); }
    }
    return p.rendre(t);
  });
  if (change) writeFileSync(f, lignes.join('\n'));
}
console.log(defauts ? `${defauts} défaut(s) de typographie.` : `Typographie correcte dans ${fichiers.length} fichier(s).`);
process.exit(defauts ? 1 : 0);
