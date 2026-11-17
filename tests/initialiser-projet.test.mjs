import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PLUGIN, FIXTURES, temporaire, extraire, fichiers, empreintes, lireJson, ecrireJson } from './outils.mjs';

const SCRIPT = join(PLUGIN, 'scripts', 'initialiser-projet.mjs');
const V1 = join(FIXTURES, 'dossier-v1.zip');
const MAJ = join(FIXTURES, 'dossier-v1-maj.zip');
const AFFAIRE = '6f1c2a9e-3b4d-4e5f-8a7b-1c2d3e4f5a6b';
const REFUS_BRIEF = (manque) =>
  `Le brief manque dans ce dossier (${manque}) : fais remplir le brief sur brief.lugdia.fr, puis prépare de nouveau le dossier dans l’onglet « Site » de la fiche. Rien n’est créé.`;

function lancer(source, cible) {
  const r = spawnSync(process.execPath, [SCRIPT, '--source', source, '--cible', cible], { encoding: 'utf8' });
  return { code: r.status, json: JSON.parse(r.stdout), stderr: r.stderr };
}
const lire = (cible, rel) => readFileSync(join(cible, rel), 'utf8');
const lignesAFournir = (cible) => lire(cible, 'docs/a-fournir.md').split('\n').filter((l) => /^- \[[ x]\] /.test(l));

test('démarrage depuis l’archive du CRM : rangement dans brief/', () => {
  const cible = temporaire();
  const r = lancer(V1, cible);
  assert.equal(r.code, 0, JSON.stringify(r.json));
  for (const f of [
    'brief/cahier-des-charges.md', 'brief/brief.json', 'brief/tokens.json', 'brief/identite.png', 'brief/dossier.json',
    'brief/decouverte/decouverte.json', 'brief/decouverte/decouverte.md',
    'brief/references/references.json', 'brief/references/captures/1-1440.png', 'brief/references/captures/1-390.png', 'brief/references/captures/2-1440.png',
    'brief/medias/medias.json', 'brief/medias/fichiers/atelier.jpg', 'brief/medias/fichiers/equipe.jpg', 'brief/medias/fichiers/etabli-genere.png',
    'brief/charte/logo.svg', 'brief/charte/marque-titres.woff2',
  ]) assert.ok(existsSync(join(cible, f)), f);
  assert.ok(existsSync(join(cible, 'brief', 'fichiers-client')));
  assert.equal(existsSync(join(cible, 'brief', 'projet.json')), false);
  assert.equal(lire(cible, 'brief/dossier.json'), execFileSync('unzip', ['-p', V1, 'projet.json'], { encoding: 'utf8' }), 'dossier.json identique à projet.json');
  const projet = lireJson(join(cible, '.lugdia', 'projet.json'));
  assert.deepEqual(projet.crm, { affaire: AFFAIRE, dossier: '2026-11-16T10:00:00.000Z' });
  assert.deepEqual([projet.client, projet.slug, projet.ref, projet.domaine], ['Ébénisterie Exemple', 'ebenisterie-exemple', 'CDC-ebenisterie-exemple-20261110-AB12', 'ebenisterie-exemple.fr']);
  rmSync(cible, { recursive: true });
});

test('démarrage depuis l’archive du CRM : à fournir, journal et résumé', () => {
  const cible = temporaire();
  const r = lancer(V1, cible);
  assert.deepEqual(lignesAFournir(cible), [
    '- [ ] Photos des réalisations récentes',
    '- [ ] Liste des essences de bois travaillées',
    '- [ ] Prise de vue : Les mains de l’ébéniste au rabot (dossier du CRM)',
    '- [ ] Prise de vue : La façade de l’atelier (dossier du CRM)',
    '- [ ] Droits d’usage et accord des personnes : brief/medias/fichiers/equipe.jpg (dossier du CRM)',
    '- [ ] Preuve à confirmer : 400 cuisines posées (source : Entretien du 12/11/2026, dit par le client)',
    '- [ ] Preuve à confirmer : Prix régional de l’artisanat (sans source)',
    '- [ ] Dossier du CRM : bloc références « en cours »',
    '- [ ] Dossier du CRM : bloc médias « en cours »',
  ]);
  assert.match(lire(cible, 'docs/journal.md'), /^- \d{4}-\d{2}-\d{2} · Projet démarré à partir du dossier du CRM du 2026-11-16 \(affaire 6f1c2a9e\) · Lugdia Studio$/m);
  const j = r.json;
  assert.equal(j.ok, true);
  assert.equal(j.mode, 'dossier');
  assert.equal(j.affaire, AFFAIRE);
  assert.deepEqual(j.blocs, { brief: 'prêt', decouverte: 'prêt', references: 'en cours', medias: 'en cours' });
  assert.equal(j.references, 3);
  assert.deepEqual(j.medias, { client: 4, genere: 1, droitsAConfirmer: 1 });
  assert.deepEqual(j.preuves, { affichables: 1, aConfirmer: 2 });
  assert.equal(j.prisesDeVueManquantes, 2);
  assert.deepEqual(j.avertissements, []);
  assert.deepEqual(j.manquants, []);
  rmSync(cible, { recursive: true });
});

test('démarrage : les originaux du client restent hors de git (Q3)', () => {
  const cible = temporaire();
  lancer(V1, cible);
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: cible });
  execFileSync('git', ['add', '-A'], { cwd: cible });
  const suivis = execFileSync('git', ['ls-files'], { cwd: cible, encoding: 'utf8' }).split('\n');
  assert.deepEqual(suivis.filter((f) => /^brief\/(medias\/fichiers|charte|references\/captures)\//.test(f)), []);
  for (const f of ['brief/dossier.json', 'brief/decouverte/decouverte.json', 'brief/references/references.json', 'brief/medias/medias.json']) assert.ok(suivis.includes(f), f);
  rmSync(cible, { recursive: true });
});

test('brief obligatoire (Q4) : dossier sans brief refusé, rien n’est créé', () => {
  const cible = temporaire();
  const r = lancer(join(FIXTURES, 'dossier-v1-sans-brief.zip'), cible);
  assert.equal(r.code, 1);
  assert.deepEqual(r.json, { ok: false, erreur: REFUS_BRIEF('cahier-des-charges.md, brief.json') });
  assert.deepEqual(readdirSync(cible), []);
  const d = extraire(V1);
  rmSync(join(d, 'brief', 'brief.json'));
  assert.deepEqual(lancer(d, cible).json, { ok: false, erreur: REFUS_BRIEF('brief.json') });
  assert.deepEqual(readdirSync(cible), []);
  rmSync(cible, { recursive: true });
  rmSync(d, { recursive: true });
});

test('brief obligatoire (Q4) : refus aussi à la mise à jour, projet inchangé', () => {
  const cible = temporaire();
  lancer(V1, cible);
  const avant = empreintes(cible);
  const d = extraire(MAJ);
  rmSync(join(d, 'brief'), { recursive: true });
  const r = lancer(d, cible);
  assert.equal(r.code, 1);
  assert.equal(r.json.erreur, REFUS_BRIEF('cahier-des-charges.md, brief.json'));
  assert.deepEqual(empreintes(cible), avant);
  rmSync(cible, { recursive: true });
  rmSync(d, { recursive: true });
});

test('dossier minimal (brief seul, sans référence ni média) : démarrage normal, blocs vides à fournir', () => {
  const cible = temporaire();
  const r = lancer(join(FIXTURES, 'dossier-v1-minimal.zip'), cible);
  assert.equal(r.code, 0, JSON.stringify(r.json));
  const lignes = lignesAFournir(cible);
  assert.ok(lignes.includes('- [ ] Dossier du CRM : bloc références « vide »'));
  assert.ok(lignes.includes('- [ ] Dossier du CRM : bloc médias « vide »'));
  assert.deepEqual([r.json.references, r.json.medias, r.json.prisesDeVueManquantes], [0, { client: 0, genere: 0, droitsAConfirmer: 0 }, 0]);
  rmSync(cible, { recursive: true });
});

test('mise à jour (Q5) : un dossier plus récent remplace ce qui vient du CRM, rien d’autre', () => {
  const cible = temporaire();
  lancer(V1, cible);
  writeFileSync(join(cible, 'brief', 'fichiers-client', 'flyer.pdf'), 'flyer');
  const aFournir = lire(cible, 'docs/a-fournir.md').replace('- [ ] Photos des réalisations récentes', '- [x] Photos des réalisations récentes (reçues le 17/11)');
  writeFileSync(join(cible, 'docs', 'a-fournir.md'), aFournir);
  const journal = lire(cible, 'docs/journal.md');
  const r = lancer(MAJ, cible);
  assert.equal(r.code, 0, JSON.stringify(r.json));
  assert.equal(r.json.mode, 'mise-a-jour');
  assert.deepEqual(r.json.crees, ['brief/medias/fichiers/atelier-2.jpg']);
  assert.deepEqual(r.json.retires, ['brief/medias/fichiers/equipe.jpg']);
  assert.deepEqual(r.json.remplaces, ['brief/decouverte/decouverte.json', 'brief/decouverte/decouverte.md', 'brief/dossier.json', 'brief/medias/medias.json']);
  assert.equal(lire(cible, 'brief/fichiers-client/flyer.pdf'), 'flyer');
  assert.equal(lireJson(join(cible, '.lugdia', 'projet.json')).crm.dossier, '2026-11-20T09:30:00.000Z');
  const ajout = lire(cible, 'docs/journal.md').slice(journal.length).trim().split('\n');
  assert.equal(ajout.length, 1);
  assert.match(ajout[0], /^- \d{4}-\d{2}-\d{2} · Dossier du CRM du 2026-11-20 reçu : 1 créé, 4 remplacés, 1 retiré · Lugdia Studio$/);
  const lignes = lignesAFournir(cible);
  assert.ok(lignes.includes('- [x] Photos des réalisations récentes (reçues le 17/11)'), 'case cochée gardée');
  assert.equal(lignes.filter((l) => l.includes('Photos des réalisations récentes')).length, 1, 'pas de doublon');
  assert.equal(lignes.filter((l) => l.includes('Les mains de l’ébéniste')).length, 1, 'pas de doublon');
  assert.equal(lignes.at(-1), '- [ ] Prise de vue : Le buffet en noyer posé chez le client (dossier du CRM)');
  rmSync(cible, { recursive: true });
});

for (const [cas, preparer, message] of [
  [
    'autre affaire',
    (cible) => {
      lancer(V1, cible);
      const d = extraire(MAJ);
      ecrireJson(join(d, 'projet.json'), { ...lireJson(join(d, 'projet.json')), affaire: '0a0b0c0d-0000-4000-8000-000000000000' });
      return d;
    },
    'Ce dossier est celui d’une autre affaire (0a0b0c0d) : rien n’est changé.',
  ],
  [
    'dossier plus ancien',
    (cible) => {
      lancer(MAJ, cible);
      return V1;
    },
    'Ce dossier (16/11/2026 11:00) est plus ancien que celui du projet (20/11/2026 10:30) : rien n’est changé.',
  ],
  [
    'projet démarré sans dossier du CRM',
    (cible) => {
      lancer(join(FIXTURES, 'brief-seul'), cible);
      return V1;
    },
    'Ce dossier contient déjà le projet Ébénisterie Exemple, démarré sans dossier du CRM : rien n’est changé.',
  ],
]) {
  test(`mise à jour refusée (${cas}) : arborescence identique avant et après`, () => {
    const cible = temporaire();
    const source = preparer(cible);
    const avant = empreintes(cible);
    const r = lancer(source, cible);
    assert.equal(r.code, 1);
    assert.deepEqual(r.json, { ok: false, erreur: message });
    assert.deepEqual(empreintes(cible), avant);
    rmSync(cible, { recursive: true });
  });
}

test('restauration (Q3) : le même dossier recrée les originaux absents après un clone, sans rien changer d’autre', () => {
  const cible = temporaire();
  lancer(V1, cible);
  const complet = empreintes(cible);
  rmSync(join(cible, 'brief', 'medias', 'fichiers'), { recursive: true });
  rmSync(join(cible, 'brief', 'charte'), { recursive: true });
  const r = lancer(V1, cible);
  assert.equal(r.code, 0, JSON.stringify(r.json));
  assert.equal(r.json.mode, 'restauration');
  assert.equal(r.json.message, 'Dossier du 16/11/2026 11:00 déjà en place : 5 fichiers absents restaurés.');
  assert.deepEqual(empreintes(cible), complet);
  const encore = lancer(V1, cible);
  assert.equal(encore.json.message, 'Dossier du 16/11/2026 11:00 déjà en place : rien à restaurer.');
  assert.deepEqual(empreintes(cible), complet);
  rmSync(cible, { recursive: true });
});

// Seuls ajouts voulus depuis la 0.2.4 : les deux fichiers du contrôle anti-générique dans le modèle (tâche 7).
const AJOUTS_DU_MODELE = ['docs/tournures-generiques.txt', 'scripts/generique.mjs'];

test('chemin d’aujourd’hui : fichiers du brief seuls, même résultat qu’en 0.2.4 (aux ajouts du modèle près)', () => {
  const cible = temporaire();
  const r = lancer(join(FIXTURES, 'brief-seul'), cible);
  const attendu = lireJson(join(FIXTURES, 'attendu-brief-seul.json'));
  const { cible: _c, crees, ...resume } = r.json;
  const { crees: creesAvant, ...resumeAvant } = attendu.resume;
  assert.deepEqual(resume, resumeAvant);
  assert.deepEqual([...crees].sort(), [...creesAvant, ...AJOUTS_DU_MODELE].sort());
  assert.deepEqual(fichiers(cible), [...attendu.fichiers, ...AJOUTS_DU_MODELE].sort());
  rmSync(cible, { recursive: true });
});

test('archive qui n’est pas un dossier du CRM : refus clair', () => {
  const d = temporaire();
  mkdirSync(join(d, 'x'));
  writeFileSync(join(d, 'x', 'notes.txt'), 'x');
  execFileSync('zip', ['-r', '-q', 'autre.zip', 'x'], { cwd: d });
  const cible = temporaire();
  const r = lancer(join(d, 'autre.zip'), cible);
  assert.equal(r.code, 1);
  assert.match(r.json.erreur, /n’est pas un dossier du CRM/);
  assert.deepEqual(readdirSync(cible), []);
  rmSync(d, { recursive: true });
  rmSync(cible, { recursive: true });
});

test('démarrage depuis un dossier décompressé : la source est copiée, jamais vidée ; aucun dossier temporaire ne reste', () => {
  const d = extraire(V1);
  const avant = empreintes(d);
  const temporaires = () => readdirSync(tmpdir()).filter((n) => n.startsWith('lugdia-dossier-')).length;
  const n = temporaires();
  const cible = temporaire();
  assert.equal(lancer(d, cible).code, 0);
  assert.deepEqual(empreintes(d), avant);
  const cible2 = temporaire();
  assert.equal(lancer(V1, cible2).code, 0);
  assert.equal(temporaires(), n);
  for (const x of [d, cible, cible2]) rmSync(x, { recursive: true });
});

test('démarrage interrompu (dossier non inscriptible) : message JSON, puis la même commande reprend et finit', () => {
  const cible = temporaire();
  mkdirSync(join(cible, 'brief', 'medias'), { recursive: true });
  chmodSync(join(cible, 'brief', 'medias'), 0o555);
  const n = readdirSync(tmpdir()).filter((x) => x.startsWith('lugdia-dossier-')).length;
  const r = lancer(V1, cible);
  assert.equal(r.code, 1);
  assert.equal(r.json.ok, false);
  assert.match(r.json.erreur, /Relance la même commande : elle reprend où le démarrage s’est arrêté\.$/);
  assert.equal(readdirSync(tmpdir()).filter((x) => x.startsWith('lugdia-dossier-')).length, n, 'dossier temporaire effacé');
  chmodSync(join(cible, 'brief', 'medias'), 0o755);
  const reprise = lancer(V1, cible);
  assert.equal(reprise.code, 0, JSON.stringify(reprise.json));
  assert.equal(reprise.json.mode, 'dossier');
  assert.ok(existsSync(join(cible, 'brief', 'medias', 'fichiers', 'atelier.jpg')));
  assert.deepEqual(lireJson(join(cible, '.lugdia', 'projet.json')).crm, { affaire: AFFAIRE, dossier: '2026-11-16T10:00:00.000Z' });
  assert.equal(lire(cible, 'docs/journal.md').split('\n').filter((l) => l.includes('Projet démarré à partir du dossier du CRM')).length, 1);
  assert.equal(lignesAFournir(cible).length, 9);
  rmSync(cible, { recursive: true });
});

test('archive ou dossier décompressé laissés dans le projet : jamais suivis par git (Q3)', () => {
  const cible = temporaire();
  const archive = join(cible, 'dossier-ebenisterie-exemple-1.zip');
  copyFileSync(V1, archive);
  const decompresse = extraire(V1);
  cpSync(decompresse, join(cible, 'dossier-ebenisterie-exemple-1'), { recursive: true });
  assert.equal(lancer(archive, cible).code, 0);
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: cible });
  execFileSync('git', ['add', '-A'], { cwd: cible });
  const suivis = execFileSync('git', ['ls-files'], { cwd: cible, encoding: 'utf8' }).split('\n');
  assert.deepEqual(suivis.filter((f) => f.startsWith('dossier-')), []);
  rmSync(cible, { recursive: true });
  rmSync(decompresse, { recursive: true });
});
