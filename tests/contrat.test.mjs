// Contrat entre les textes du plugin et le projet démarré : chaque chemin brief/… cité par un skill ou un agent
// existe dans un projet démarré depuis le dossier du CRM (attrape une faute de chemin dans un agent).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { PLUGIN, FIXTURES, temporaire } from './outils.mjs';

const textes = (dossier) =>
  readdirSync(dossier, { recursive: true })
    .filter((f) => f.endsWith('.md'))
    .map((f) => [join(dossier, f), readFileSync(join(dossier, f), 'utf8')]);

test('chaque chemin brief/… cité dans les skills et les agents existe dans un projet démarré', () => {
  const projet = temporaire();
  execFileSync(process.execPath, [join(PLUGIN, 'scripts', 'initialiser-projet.mjs'), '--source', join(FIXTURES, 'dossier-v1.zip'), '--cible', projet]);
  const absents = [];
  for (const [f, t] of [...textes(join(PLUGIN, 'skills')), ...textes(join(PLUGIN, 'agents'))]) {
    for (const [, chemin] of t.matchAll(/`(brief\/[^`\s]*)`/g)) {
      const fixe = chemin.split(/[<*{]/)[0].replace(/\/$/, '');
      if (!existsSync(join(projet, fixe))) absents.push(`${f.slice(PLUGIN.length + 1)} : ${chemin}`);
    }
  }
  rmSync(projet, { recursive: true });
  assert.deepEqual(absents, []);
});

test('organisation du studio : 27 agents, chaque agent cité dans les phases existe', () => {
  const agents = readdirSync(join(PLUGIN, 'agents')).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));
  assert.equal(agents.length, 27);
  const org = readFileSync(join(PLUGIN, 'skills', 'organisation-studio', 'SKILL.md'), 'utf8');
  const phases = org.split('\n').filter((l) => /^\| \d\. /.test(l));
  const cites = new Set(phases.flatMap((l) => l.match(/\b[a-z]+(?:-[a-z0-9]+)+\b|\b(?:producteur|veilleur|redacteur|referenceur)\b/g) || []));
  for (const a of agents) assert.ok(org.includes(`| \`${a}\` |`), `agent absent du tableau de l’équipe : ${a}`);
  for (const c of cites) if (/^(chef|controleur|designer|developpeur|architecte|chercheur|gardien|directeur|garant|scenariste|auditeur|testeur|collecteur|ingenieur|relecteur|stratege)-/.test(c)) assert.ok(agents.includes(c), `agent inconnu dans les phases : ${c}`);
  assert.match(org, /les 27 agents/);
});

test('controleur-singularite passe juste avant controleur-verite aux phases 2, 3 et 5', () => {
  const org = readFileSync(join(PLUGIN, 'skills', 'organisation-studio', 'SKILL.md'), 'utf8');
  for (const n of [2, 3, 5]) {
    const ligne = org.split('\n').find((l) => l.startsWith(`| ${n}. `));
    assert.match(ligne, /→ controleur-singularite → controleur-verite → producteur/, `phase ${n}`);
  }
  const quatre = org.split('\n').find((l) => l.startsWith('| 6. '));
  assert.doesNotMatch(quatre, /controleur-singularite/);
});
