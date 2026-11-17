import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE, PLUGIN, FIXTURES, temporaire } from './outils.mjs';

const SCRIPT = join(PLUGIN, 'scripts', 'contexte-projet.mjs');
const INIT = join(PLUGIN, 'scripts', 'initialiser-projet.mjs');

const contexte = (script, projet) => spawnSync(process.execPath, [script], { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: projet } }).stdout;
const texte = (sortie) => JSON.parse(sortie).hookSpecificOutput.additionalContext;
const demarrer = (source) => {
  const cible = temporaire();
  execFileSync(process.execPath, [INIT, '--source', source, '--cible', cible]);
  return cible;
};

test('projet démarré depuis le dossier du CRM : une ligne sur le dossier et ce qui reste à fournir', () => {
  const p = demarrer(join(FIXTURES, 'dossier-v1.zip'));
  const lignes = texte(contexte(SCRIPT, p)).split('\n');
  assert.ok(lignes.includes('Dossier du CRM du 16/11/2026 11:00 : découverte, références et médias du client dans brief/ ; 9 éléments à fournir (docs/a-fournir.md).'), lignes.join('\n'));
  assert.equal(lignes.some((l) => l.startsWith('Originaux absents')), false);
  rmSync(p, { recursive: true });
});

test('clone sans les originaux : le rappel dit comment les restaurer', () => {
  const p = demarrer(join(FIXTURES, 'dossier-v1.zip'));
  rmSync(join(p, 'brief', 'medias', 'fichiers'), { recursive: true });
  const lignes = texte(contexte(SCRIPT, p)).split('\n');
  assert.ok(
    lignes.includes('Originaux absents de brief/ (3 fichiers, hors de git) : relance lugdia-studio:demarrer-projet avec le dossier du CRM du 16/11/2026 11:00 pour les restaurer.'),
    lignes.join('\n'),
  );
  rmSync(p, { recursive: true });
});

test('projet sans dossier du CRM : sortie identique à la 0.2.4', () => {
  const p = demarrer(join(FIXTURES, 'brief-seul'));
  const ancien = join(temporaire(), 'contexte-024.mjs');
  writeFileSync(ancien, execFileSync('git', ['show', '03d214c:plugins/lugdia-studio/scripts/contexte-projet.mjs'], { cwd: RACINE }));
  assert.equal(contexte(SCRIPT, p), contexte(ancien, p));
  rmSync(p, { recursive: true });
});

test('hors d’un projet client : aucune sortie', () => {
  const d = temporaire();
  assert.equal(contexte(SCRIPT, d), '');
  rmSync(d, { recursive: true });
});
