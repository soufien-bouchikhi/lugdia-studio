// Démarre un projet client Lugdia à partir du dossier du studio préparé par le CRM (archive ou dossier décompressé)
// ou des fichiers produits par brief.lugdia.fr. Met aussi à jour un projet déjà démarré avec un dossier plus récent.
// Usage : node initialiser-projet.mjs --source <archive, dossier du CRM ou fichiers du brief> [--cible <dossier du projet>]
// Copie le modèle de projet sans rien écraser, range le brief et le dossier sous des noms fixes,
// remplit .lugdia/projet.json et les fichiers du modèle, extrait le plan de collecte et ce qui manque.
// Écrit un résumé JSON sur la sortie standard. Aucun appel réseau, aucune commande git.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync, statSync, appendFileSync } from 'node:fs';
import { join, dirname, extname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ouvrirDossier, estDossierCrm, lireDossier, aFournirDuDossier, rangerDossier } from './dossier-crm.mjs';

const ici = dirname(fileURLToPath(import.meta.url));
const MODELE = join(ici, '..', 'templates', 'projet-client');
const RENOMMER = { gitignore: '.gitignore', 'env.example': '.env.example' };
let crm = null; // dossier du CRM ouvert (racine, nettoyer, temporaire), sinon null
let lu = null; // dossier lu et validé
let reprise = false; // démarrage depuis le dossier du CRM interrompu, repris par la même commande
// Toute erreur imprévue (disque plein, dossier non inscriptible, fichier illisible) rend un message JSON et efface
// le dossier temporaire ; le démarrage se reprend en relançant la même commande.
process.on('uncaughtException', (e) => arreter('Arrêt imprévu : ' + e.message + '. Relance la même commande : elle reprend où le démarrage s’est arrêté.'));

const args = lireArguments(process.argv.slice(2));
if (!args.source) arreter('Indique l’archive du dossier du CRM ou le dossier des fichiers du brief : --source <chemin>.');
const source = resolve(args.source);
const cible = resolve(args.cible || process.cwd());
if (!existsSync(source)) arreter('Introuvable : ' + source);

// 0. Dossier du studio préparé par le CRM (archive ou dossier décompressé), reconnu par son projet.json.
try {
  crm = ouvrirDossier(source);
} catch (e) {
  arreter(e.message);
}
if (!estDossierCrm(crm.racine)) {
  crm.nettoyer();
  crm = null;
  if (!statSync(source).isDirectory()) arreter(basename(source) + ' n’est pas un dossier du CRM (projet.json absent).');
}
if (crm) {
  lu = lireDossier(crm.racine);
  if (!lu.ok) arreter(lu.erreurs.join(' '));
  const manque = ['cahier-des-charges.md', 'brief.json'].filter((f) => !lu.dossier.retenus.includes('brief/' + f));
  if (manque.length) arreter('Le brief manque dans ce dossier (' + manque.join(', ') + ') : fais remplir le brief sur brief.lugdia.fr, puis prépare de nouveau le dossier dans l’onglet « Site » de la fiche. Rien n’est créé.');
  const existant = join(cible, '.lugdia', 'projet.json');
  if (existsSync(existant)) {
    const e = JSON.parse(readFileSync(existant, 'utf8'));
    reprise = Boolean(e.crm && e.crm.demarrage === 'en cours' && e.crm.affaire === lu.dossier.projet.affaire);
    if (!reprise) mettreAJour(e, existant);
  }
}

// 1. Fichiers du brief reconnus par leur contenu, pas seulement par leur nom.
const trouves = { cdc: null, brief: null, tokens: null, planche: null, autres: [] };
if (crm) {
  const b = (f) => (lu.dossier.retenus.includes('brief/' + f) ? join(crm.racine, 'brief', f) : null);
  Object.assign(trouves, { cdc: b('cahier-des-charges.md'), brief: b('brief.json'), tokens: b('tokens.json'), planche: b('identite.png') });
}
for (const nom of crm ? [] : readdirSync(source)) {
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
const client = (crm && lu.dossier.projet.client) || (brief && brief.entreprise && brief.entreprise.nom) || (cdc.match(/^# Cahier des charges : site internet de (.+)$/m) || [])[1] || 'Client';
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
if (crm) ecrireCrm({ affaire: lu.dossier.projet.affaire, dossier: lu.dossier.projet.date, demarrage: 'en cours' });

// 4. Fichiers du brief sous des noms fixes (un original existant n'est jamais remplacé).
const brut = join(cible, 'brief');
mkdirSync(join(brut, 'fichiers-client'), { recursive: true });
if (crm) {
  const r = rangerDossier(lu.dossier, crm.racine, cible, { mode: reprise ? 'mise-a-jour' : 'demarrage', deplacer: crm.temporaire });
  crees.push(...r.crees);
  gardes.push(...r.gardes);
} else {
  ranger(trouves.cdc, join(brut, 'cahier-des-charges.md'));
  ranger(trouves.brief, join(brut, 'brief.json'));
  ranger(trouves.tokens, join(brut, 'tokens.json'));
  ranger(trouves.planche, join(brut, 'identite' + (trouves.planche ? extname(trouves.planche).toLowerCase() : '.png')));
  for (const f of trouves.autres) ranger(f, join(brut, 'fichiers-client', basename(f)));
}

// 5. Plan de collecte du cahier des charges → docs/a-fournir.md.
const collecte = (cdc.split(/\*\*Plan de collecte\*\*/)[1] || '').split(/\n## /)[0]
  .split('\n').map((l) => l.trim()).filter((l) => l.startsWith('- '))
  .map((l) => l.slice(2).replace(/\\([\\`*_{}[\]()#+\-.!|>])/g, '$1'));
const aFournir = join(cible, 'docs', 'a-fournir.md');
if (!existsSync(aFournir)) {
  const lignes = ['# À fournir par le client', '', 'Repris du plan de collecte du cahier des charges ' + valeurs.REF + '. Cocher quand c’est reçu, avec la date.', ''];
  for (const l of collecte) lignes.push('- [ ] ' + l);
  if (!collecte.length) lignes.push('- [ ] (plan de collecte absent du cahier des charges : à établir en rendez-vous)');
  if (crm) lignes.push(...aFournirDuDossier(lu.dossier));
  writeFileSync(aFournir, lignes.join('\n') + '\n');
  crees.push('docs/a-fournir.md');
}

const manquants = ['cahier-des-charges.md', 'brief.json', 'tokens.json']
  .filter((f) => !existsSync(join(brut, f)));
if (!existsSync(join(brut, 'identite.png')) && !existsSync(join(brut, 'identite.jpg')) && !existsSync(join(brut, 'identite.webp'))) manquants.push('identite.png');

const resume = { ok: true, cible, client, slug, ref, domaine, crees, gardes, manquants, aFournir: collecte.length };
if (crm) {
  // 6. Projet relié à son affaire du CRM (champ crm de .lugdia/projet.json) et noté au journal.
  const d = lu.dossier;
  const ligne = 'Projet démarré à partir du dossier du CRM du ' + jour(d.projet.date) + ' (affaire ' + d.projet.affaire.slice(0, 8) + ')';
  const journal = join(cible, 'docs', 'journal.md');
  if (!(existsSync(journal) && readFileSync(journal, 'utf8').includes(ligne))) noterAuJournal(ligne);
  ecrireCrm({ affaire: d.projet.affaire, dossier: d.projet.date });
  crm.nettoyer();
  Object.assign(resume, { mode: 'dossier', affaire: d.projet.affaire, ...bilan(d), avertissements: lu.avertissements });
}
process.stdout.write(JSON.stringify(resume, null, 2) + '\n');

// Projet déjà démarré : mise à jour par un dossier plus récent de la même affaire, restauration des originaux
// absents par le même dossier (après un clone : ils sont hors de git), refus dans les autres cas.
function mettreAJour(existant, fichierProjet) {
  const d = lu.dossier;
  if (!existant.crm) arreter('Ce dossier contient déjà le projet ' + existant.client + ', démarré sans dossier du CRM : rien n’est changé.');
  if (existant.crm.affaire !== d.projet.affaire) arreter('Ce dossier est celui d’une autre affaire (' + d.projet.affaire.slice(0, 8) + ') : rien n’est changé.');
  const ecart = Date.parse(d.projet.date) - Date.parse(existant.crm.dossier);
  if (ecart < 0) arreter('Ce dossier (' + heure(d.projet.date) + ') est plus ancien que celui du projet (' + heure(existant.crm.dossier) + ') : rien n’est changé.');
  if (ecart === 0) {
    const r = rangerDossier(d, crm.racine, cible, { mode: 'restauration', deplacer: crm.temporaire });
    const message = 'Dossier du ' + heure(d.projet.date) + ' déjà en place : ' + (r.crees.length ? r.crees.length + ' fichiers absents restaurés.' : 'rien à restaurer.');
    terminer({ ok: true, mode: 'restauration', cible, client: existant.client, crees: r.crees, message });
  }
  const r = rangerDossier(d, crm.racine, cible, { mode: 'mise-a-jour', deplacer: crm.temporaire });
  writeFileSync(fichierProjet, JSON.stringify({ ...existant, crm: { ...existant.crm, dossier: d.projet.date } }, null, 2) + '\n');
  const fichierAFournir = join(cible, 'docs', 'a-fournir.md');
  const actuel = existsSync(fichierAFournir) ? readFileSync(fichierAFournir, 'utf8') : '# À fournir par le client\n';
  const dejaLa = actuel.split('\n').filter((l) => /^- \[[ xX]\] /.test(l)).map((l) => l.slice(6));
  const nouvelles = aFournirDuDossier(d).filter((l) => !dejaLa.some((x) => x.startsWith(l.slice(6))));
  if (nouvelles.length) writeFileSync(fichierAFournir, actuel.replace(/\n*$/, '\n') + nouvelles.join('\n') + '\n');
  const n = (k, mot) => r[k].length + ' ' + mot + (r[k].length > 1 ? 's' : '');
  noterAuJournal('Dossier du CRM du ' + jour(d.projet.date) + ' reçu : ' + n('crees', 'créé') + ', ' + n('remplaces', 'remplacé') + ', ' + n('retires', 'retiré'));
  terminer({
    ok: true, mode: 'mise-a-jour', cible, client: existant.client, affaire: d.projet.affaire,
    crees: r.crees, remplaces: r.remplaces, retires: r.retires, aFournirAjoutees: nouvelles.length, ...bilan(d), avertissements: lu.avertissements,
  });
}

// Relie le projet à son affaire du CRM dans .lugdia/projet.json (« demarrage : en cours » tant que le rangement n'est pas fini).
function ecrireCrm(valeur) {
  const fichier = join(cible, '.lugdia', 'projet.json');
  const projet = JSON.parse(readFileSync(fichier, 'utf8'));
  writeFileSync(fichier, JSON.stringify({ ...projet, crm: valeur }, null, 2) + '\n');
}

function bilan(d) {
  const preuves = (d.decouverte && d.decouverte.preuves) || [];
  return {
    blocs: d.projet.blocs,
    references: d.references.length,
    medias: {
      client: d.medias.filter((m) => m.origine !== 'généré').length,
      genere: d.medias.filter((m) => m.origine === 'généré').length,
      droitsAConfirmer: d.medias.filter((m) => m.droits !== true).length,
    },
    preuves: { affichables: preuves.filter((p) => p.confirmee === true).length, aConfirmer: preuves.filter((p) => p.confirmee !== true).length },
    prisesDeVueManquantes: d.prisesDeVueManquantes.length,
  };
}

function noterAuJournal(texte) {
  const f = join(cible, 'docs', 'journal.md');
  if (existsSync(f) && !readFileSync(f, 'utf8').endsWith('\n')) appendFileSync(f, '\n');
  appendFileSync(f, '- ' + jour(new Date().toISOString()) + ' · ' + texte + ' · Lugdia Studio\n');
}

// Dates à l'heure de Lyon : AAAA-MM-JJ pour le journal, JJ/MM/AAAA HH:MM dans les messages.
function jour(iso) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date(iso));
}
function heure(iso) {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
}

function terminer(objet) {
  if (crm) crm.nettoyer();
  process.stdout.write(JSON.stringify(objet, null, 2) + '\n');
  process.exit(0);
}

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
  if (crm) crm.nettoyer();
  process.stdout.write(JSON.stringify({ ok: false, erreur: message }) + '\n');
  process.exit(1);
}
