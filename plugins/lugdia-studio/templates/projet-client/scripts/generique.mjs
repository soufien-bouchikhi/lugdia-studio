// Cherche les tournures toutes faites (docs/tournures-generiques.txt) dans les fichiers donnés : des phrases que
// n'importe quel concurrent pourrait signer. Usage : node scripts/generique.mjs [fichiers ou dossiers…]
// (par défaut : docs/contenus src public). Sort avec le code 1 si une tournure est trouvée. Règle complète :
// references/singularite.md des règles de l'agence. Une expression justifiée va dans docs/mots-admis.txt.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const LISTE = 'docs/tournures-generiques.txt';
const lignes = (f) => (existsSync(f) ? readFileSync(f, 'utf8').split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean) : []);
const tournures = lignes(LISTE);
if (!tournures.length) {
  console.log(`Aucune tournure dans ${LISTE}.`);
  process.exit(0);
}

const TEXTES = new Set(['.md', '.mdx', '.astro', '.html', '.ts', '.tsx', '.js', '.mjs', '.json', '.txt', '.xml', '.yml', '.yaml', '.svg']);
const IGNORES = new Set(['node_modules', '.git', '.astro', 'brief', 'dist', 'test-results', 'playwright-report']);
const cibles = process.argv.slice(2).length ? process.argv.slice(2) : ['docs/contenus', 'src', 'public'];

const plat = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[  ]/g, ' ').replace(/[’']/g, "'").replace(/\s+/g, ' ');
const echapper = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const motifs = tournures.map((t) => ({ t, re: new RegExp(`(^|[^a-z0-9])${echapper(plat(t))}($|[^a-z0-9])`) }));
const admises = lignes('docs/mots-admis.txt').map(plat);
const sansAdmises = (l) => admises.reduce((s, a) => s.split(a).join(' '), l);

const fichiers = [];
const parcourir = (c) => {
  if (!existsSync(c) || IGNORES.has(basename(c))) return;
  if (statSync(c).isDirectory()) {
    for (const n of readdirSync(c)) if (!IGNORES.has(n)) parcourir(join(c, n));
  } else if (TEXTES.has(extname(c).toLowerCase())) fichiers.push(c);
};
cibles.forEach(parcourir);

let n = 0;
for (const f of fichiers) {
  readFileSync(f, 'utf8').split('\n').forEach((ligne, i) => {
    const l = sansAdmises(plat(ligne));
    for (const m of motifs) {
      if (m.re.test(l)) {
        n++;
        console.log(`${f}:${i + 1} « ${m.t} »\n    ${ligne.trim().slice(0, 160)}`);
      }
    }
  });
}
console.log(n ? `${n} tournure(s) toute(s) faite(s) à reprendre dans ${fichiers.length} fichier(s).` : `Aucune tournure toute faite dans ${fichiers.length} fichier(s).`);
process.exit(n ? 1 : 0);
