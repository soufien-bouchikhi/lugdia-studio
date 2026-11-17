import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLUGIN, FIXTURES, temporaire } from './outils.mjs';

// Un projet démarré depuis le modèle : il a scripts/generique.mjs et docs/tournures-generiques.txt.
function projet() {
  const p = temporaire();
  execFileSync(process.execPath, [join(PLUGIN, 'scripts', 'initialiser-projet.mjs'), '--source', join(FIXTURES, 'brief-seul'), '--cible', p]);
  return p;
}
const ecrire = (p, rel, texte) => {
  mkdirSync(join(p, rel, '..'), { recursive: true });
  writeFileSync(join(p, rel), texte);
};
const lancer = (p, ...cibles) => spawnSync(process.execPath, ['scripts/generique.mjs', ...cibles], { cwd: p, encoding: 'utf8' });

test('tournures toutes faites trouvées malgré la casse, l’apostrophe et l’espace insécable', () => {
  const p = projet();
  ecrire(p, 'docs/contenus/accueil.md', '# Accueil\n\nVotre Partenaire de confiance à Lyon.\nN\u0027hésitez pas à nous contacter.\nNous sommes à votre écoute.\nUn atelier qui travaille le chêne depuis 1998.\n');
  const r = lancer(p);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /docs\/contenus\/accueil\.md:3 « votre partenaire de confiance »/);
  assert.match(r.stdout, /docs\/contenus\/accueil\.md:4 « n’hésitez pas à nous contacter »/);
  assert.match(r.stdout, /docs\/contenus\/accueil\.md:5 « à votre écoute »/);
  assert.match(r.stdout, /3 tournure\(s\) toute\(s\) faite\(s\)/);
  rmSync(p, { recursive: true });
});

test('texte propre : code 0 et « Aucune tournure toute faite »', () => {
  const p = projet();
  ecrire(p, 'docs/contenus/accueil.md', 'Un atelier qui travaille le chêne depuis 1998.\n');
  ecrire(p, 'src/pages/index.astro', '<h1>Des meubles qui gardent la mémoire du bois</h1>\n');
  const r = lancer(p);
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /Aucune tournure toute faite dans 2 fichier\(s\)\./);
  rmSync(p, { recursive: true });
});

test('expression de docs/mots-admis.txt ignorée ; node_modules, brief et dist ignorés', () => {
  const p = projet();
  ecrire(p, 'docs/mots-admis.txt', 'clé en main # offre réelle « cuisine clé en main », voir journal du 17/11\n');
  ecrire(p, 'docs/contenus/offre.md', 'Une cuisine clé en main, posée en dix jours.\n');
  ecrire(p, 'src/node_modules/x/readme.md', 'Votre partenaire de confiance\n');
  ecrire(p, 'public/dist/x.html', 'Votre partenaire de confiance\n');
  ecrire(p, 'brief/notes.md', 'Votre partenaire de confiance\n');
  const r = lancer(p, 'docs/contenus', 'src', 'public', 'brief');
  assert.equal(r.status, 0, r.stdout);
  rmSync(p, { recursive: true });
});

test('liste modifiable par projet : une tournure ajoutée est cherchée, une ligne commentée ne l’est pas', () => {
  const p = projet();
  ecrire(p, 'docs/tournures-generiques.txt', '# liste du projet\nartisan passionné\n# clé en main\n');
  ecrire(p, 'docs/contenus/a.md', 'Un artisan passionné. Une offre clé en main.\n');
  const r = lancer(p);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /« artisan passionné »/);
  assert.doesNotMatch(r.stdout, /« clé en main »/);
  rmSync(p, { recursive: true });
});
