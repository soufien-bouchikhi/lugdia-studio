// Au démarrage d'une session Claude Code : si le dossier est un projet client Lugdia
// (présence de .lugdia/projet.json), rappelle à Claude où en est le projet et quelles règles s'appliquent.
// Ailleurs, n'écrit rien : le plugin reste silencieux dans les autres projets.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const racine = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const fichier = join(racine, '.lugdia', 'projet.json');
if (!existsSync(fichier)) process.exit(0);

let p;
try {
  p = JSON.parse(readFileSync(fichier, 'utf8'));
} catch (e) {
  sortir('Projet client Lugdia : le fichier .lugdia/projet.json est illisible (' + e.message + '). Corrige-le avant toute autre action.');
}

const NOMS = {
  V1: 'direction artistique',
  V2: 'page d’accueil',
  V3: 'aperçu complet',
  V4: 'mise en ligne'
};
const validations = p.validations || {};
const etatV = Object.keys(NOMS).map((k) => {
  const v = validations[k] || {};
  const statut = v.statut || 'à faire';
  return k + ' ' + NOMS[k] + ' : ' + statut + (v.le ? ' (' + v.le + ')' : '');
});
const prochaine = Object.keys(NOMS).find((k) => (validations[k] || {}).statut !== 'validée');

const brief = ['cahier-des-charges.md', 'brief.json', 'tokens.json']
  .map((f) => (existsSync(join(racine, 'brief', f)) ? null : f))
  .filter(Boolean);

const lignes = [
  'Projet client Lugdia : ' + (p.client || '(nom manquant)') + (p.ref ? ' · ' + p.ref : '') + '.',
  'Parcours : ' + (p.parcours || 'à choisir') + ' · étape : ' + (p.etape || 'cadrage') + '.',
  'Points de validation : ' + etatV.join(' ; ') + '.',
  prochaine
    ? 'Prochain point de validation : ' + prochaine + ' (' + NOMS[prochaine] + '). Arrête-toi et demande l’accord de Soufien avant de le franchir.'
    : 'Tous les points de validation sont franchis.',
  brief.length
    ? 'Fichiers du brief manquants dans brief/ : ' + brief.join(', ') + '. Signale-le avant de produire quoi que ce soit.'
    : 'Le brief du client est dans brief/ : c’est la source de vérité, avant toute supposition.',
  'Avant tout travail sur ce site, charge le skill lugdia-studio:regles-lugdia et respecte-le : rien d’inventé, AA, mouvement réduit, son coupé par défaut, budget de performance, aucun envoi au client sans validation.'
];
sortir(lignes.join('\n'));

function sortir(texte) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: texte } }));
  process.exit(0);
}
