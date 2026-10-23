// Cherche les mots à éviter du brief (brief.json, editorial.interdits) dans les fichiers donnés.
// Usage : node scripts/mots-a-eviter.mjs [fichiers ou dossiers…]   (par défaut : docs/contenus src public)
// Sort avec le code 1 si un mot est trouvé. Chaque occurrence est à relire : certains mots sont admis
// dans un contexte précis (par exemple « garanti » pour un produit réellement garanti, garantie précisée).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const brief = JSON.parse(readFileSync('brief/brief.json', 'utf8'));
const interdits = ((brief.editorial && brief.editorial.interdits) || [])
  .map((x) => (typeof x === 'string' ? { mot: x, pourquoi: '' } : x))
  .filter((x) => x.mot);
if (!interdits.length) {
  console.log('Aucun mot à éviter dans brief/brief.json.');
  process.exit(0);
}

const TEXTES = new Set(['.md', '.mdx', '.astro', '.html', '.ts', '.tsx', '.js', '.mjs', '.json', '.txt', '.xml', '.yml', '.yaml', '.svg']);
const IGNORES = new Set(['node_modules', '.git', '.astro', 'brief', 'test-results', 'playwright-report']);
const cibles = process.argv.slice(2).length ? process.argv.slice(2) : ['docs/contenus', 'src', 'public'];

const plat = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[  ]/g, ' ').replace(/[’']/g, "'");
const motifs = interdits.map((x) => ({ ...x, re: new RegExp('(^|[^a-z0-9])' + plat(x.mot).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }));

const fichiers = [];
const parcourir = (c) => {
  if (!existsSync(c)) return;
  const s = statSync(c);
  if (s.isDirectory()) {
    for (const n of readdirSync(c)) if (!IGNORES.has(n)) parcourir(join(c, n));
  } else if (TEXTES.has(extname(c).toLowerCase())) fichiers.push(c);
};
cibles.forEach(parcourir);

let n = 0;
for (const f of fichiers) {
  readFileSync(f, 'utf8').split('\n').forEach((ligne, i) => {
    const l = plat(ligne);
    for (const m of motifs) {
      if (m.re.test(l)) {
        n++;
        console.log(`${f}:${i + 1} « ${m.mot} »${m.pourquoi ? ' (' + m.pourquoi + ')' : ''}\n    ${ligne.trim().slice(0, 160)}`);
      }
    }
  });
}
console.log(n ? `${n} occurrence(s) à relire dans ${fichiers.length} fichier(s).` : `Aucun mot à éviter dans ${fichiers.length} fichier(s).`);
process.exit(n ? 1 : 0);
