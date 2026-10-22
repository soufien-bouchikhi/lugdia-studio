// Compare le commit figé de chaque plugin tiers au dernier commit de sa branche par défaut.
// Ne modifie rien : une mise à jour se relit (licence, hooks, scripts téléchargés) avant de changer le sha.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const marche = JSON.parse(readFileSync(new URL('../.claude-plugin/marketplace.json', import.meta.url), 'utf8'));
for (const p of marche.plugins) {
  if (typeof p.source === 'string') continue;
  const url = p.source.url || 'https://github.com/' + p.source.repo + '.git';
  let dernier = '?';
  try { dernier = execFileSync('git', ['ls-remote', url, 'HEAD'], { encoding: 'utf8' }).split('\t')[0]; } catch { dernier = 'inaccessible'; }
  const etat = dernier === p.source.sha ? 'à jour' : 'nouvelle version disponible : ' + dernier;
  console.log(p.name.padEnd(14) + ' figé sur ' + p.source.sha.slice(0, 12) + ' · ' + etat);
}
