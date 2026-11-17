import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ouvrirDossier, estDossierCrm, lireDossier, SCHEMAS } from '../plugins/lugdia-studio/scripts/dossier-crm.mjs';
import { FIXTURES, temporaire, extraire, fabriquerZip, nomsDansZip, ecrireJson, lireJson } from './outils.mjs';

const ZIP = join(FIXTURES, 'dossier-v1.zip');
const ATTENDUS = [
  'brief/brief.json', 'brief/cahier-des-charges.md', 'brief/identite.png', 'brief/tokens.json',
  'charte/logo.svg', 'charte/marque-titres.woff2',
  'decouverte/decouverte.json', 'decouverte/decouverte.md',
  'medias/fichiers/atelier.jpg', 'medias/fichiers/equipe.jpg', 'medias/fichiers/etabli-genere.png', 'medias/medias.json',
  'projet.json',
  'references/captures/1-1440.png', 'references/captures/1-390.png', 'references/captures/2-1440.png', 'references/references.json',
];
const temporairesDuModule = () => readdirSync(tmpdir()).filter((n) => n.startsWith('lugdia-dossier-'));

test('SCHEMAS : les quatre schémas du format version 1', () => {
  assert.deepEqual(SCHEMAS, { dossier: 'lugdia-dossier/1', decouverte: 'lugdia-decouverte/1', references: 'lugdia-references/1', medias: 'lugdia-medias/1' });
});

test('ouvrirDossier : l’archive du CRM s’ouvre dans un dossier temporaire que nettoyer() efface', () => {
  const { racine, nettoyer } = ouvrirDossier(ZIP);
  assert.ok(existsSync(join(racine, 'projet.json')));
  assert.equal(estDossierCrm(racine), true);
  nettoyer();
  assert.equal(existsSync(racine), false);
});

test('ouvrirDossier : archive recompressée par le Finder (enveloppe, __MACOSX, .DS_Store, deflate) = même contenu', () => {
  const d = temporaire();
  execFileSync('unzip', ['-q', ZIP, '-d', join(d, 'dossier-x-1')]);
  writeFileSync(join(d, 'dossier-x-1', '.DS_Store'), 'x');
  mkdirSync(join(d, '__MACOSX', 'dossier-x-1'), { recursive: true });
  writeFileSync(join(d, '__MACOSX', 'dossier-x-1', '._projet.json'), 'x');
  execFileSync('zip', ['-r', '-q', '-9', 'finder.zip', 'dossier-x-1', '__MACOSX'], { cwd: d });
  const { racine, nettoyer } = ouvrirDossier(join(d, 'finder.zip'));
  const lu = lireDossier(racine);
  assert.equal(lu.ok, true, JSON.stringify(lu.erreurs));
  assert.deepEqual(lu.dossier.fichiers, ATTENDUS);
  assert.deepEqual(lu.avertissements, []);
  nettoyer();
  rmSync(d, { recursive: true });
});

test('ouvrirDossier : un dossier décompressé est accepté tel quel, nettoyer() ne l’efface pas', () => {
  const d = extraire(ZIP);
  const { racine, nettoyer } = ouvrirDossier(d);
  assert.equal(racine, d);
  nettoyer();
  assert.ok(existsSync(join(d, 'projet.json')));
  rmSync(d, { recursive: true });
});

for (const [cas, entree] of [
  ['chemin qui remonte', { nom: '../hors.txt' }],
  ['chemin absolu', { nom: '/tmp/absolu-lugdia.txt' }],
  ['lien symbolique', { nom: 'lien', contenu: '/etc/passwd', lien: true }],
]) {
  test(`ouvrirDossier : archive piégée (${cas}) refusée en entier, rien n’est écrit`, () => {
    const d = temporaire();
    const zip = fabriquerZip(join(d, 'piege.zip'), [{ nom: 'projet.json', contenu: '{}' }, entree]);
    assert.ok(nomsDansZip(zip).includes(entree.nom), 'l’archive contient bien l’entrée piégée');
    const avant = temporairesDuModule();
    assert.throws(() => ouvrirDossier(zip), { message: `Archive refusée : ${entree.nom} sort du dossier ou est un lien.` });
    assert.deepEqual(temporairesDuModule(), avant);
    assert.equal(existsSync(join(d, '..', 'hors.txt')), false);
    assert.equal(existsSync('/tmp/absolu-lugdia.txt'), false);
    rmSync(d, { recursive: true });
  });
}

test('ouvrirDossier : lien symbolique déclaré par un autre système (5) refusé, rien ne reste', () => {
  const d = temporaire();
  const zip = fabriquerZip(join(d, 'piege5.zip'), [{ nom: 'projet.json', contenu: '{}' }, { nom: 'lien', contenu: '/etc/hosts', lien: true, systeme: 5 }]);
  const avant = temporairesDuModule();
  assert.throws(() => ouvrirDossier(zip), { message: 'Archive refusée : lien sort du dossier ou est un lien.' });
  assert.deepEqual(temporairesDuModule(), avant);
  rmSync(d, { recursive: true });
});

test('ouvrirDossier : dossier décompressé qui contient un lien symbolique refusé', () => {
  const d = extraire(ZIP);
  rmSync(join(d, 'decouverte', 'decouverte.md'));
  symlinkSync('/etc/hosts', join(d, 'decouverte', 'decouverte.md'));
  assert.throws(() => ouvrirDossier(d), { message: 'Dossier refusé : decouverte/decouverte.md est un lien.' });
  rmSync(d, { recursive: true });
});

test('ouvrirDossier : source introuvable ou fichier qui n’est pas une archive', () => {
  assert.throws(() => ouvrirDossier('/nulle/part.zip'), { message: 'Introuvable : /nulle/part.zip' });
  const d = temporaire();
  writeFileSync(join(d, 'texte.zip'), 'pas une archive');
  assert.throws(() => ouvrirDossier(join(d, 'texte.zip')), /n’est ni une archive ZIP ni un dossier/);
  rmSync(d, { recursive: true });
});

test('estDossierCrm : faux pour les fichiers du brief seuls', () => {
  assert.equal(estDossierCrm(join(FIXTURES, 'brief-seul')), false);
});

test('lireDossier : contenu du dossier version 1', () => {
  const { racine, nettoyer } = ouvrirDossier(ZIP);
  const lu = lireDossier(racine);
  nettoyer();
  assert.equal(lu.ok, true, JSON.stringify(lu.erreurs));
  const { projet, decouverte, references, medias, prisesDeVueManquantes, fichiers } = lu.dossier;
  assert.deepEqual(projet, {
    version: 1, affaire: '6f1c2a9e-3b4d-4e5f-8a7b-1c2d3e4f5a6b', client: 'Ébénisterie Exemple', date: '2026-11-16T10:00:00.000Z',
    blocs: { brief: 'prêt', decouverte: 'prêt', references: 'en cours', medias: 'en cours' },
  });
  assert.equal(decouverte.preuves.length, 3);
  assert.equal(decouverte.preuves.filter((p) => p.confirmee).length, 1, 'une seule preuve affichable');
  assert.deepEqual(references.map((r) => [r.n, r.captures['1440'], r.captures['390']]), [
    [1, 'references/captures/1-1440.png', 'references/captures/1-390.png'],
    [2, 'references/captures/2-1440.png', null],
    [3, null, null],
  ]);
  assert.deepEqual(medias.map((m) => m.fichier), ['medias/fichiers/atelier.jpg', 'medias/fichiers/equipe.jpg', 'medias/fichiers/etabli-genere.png', 'charte/logo.svg', 'charte/marque-titres.woff2']);
  assert.equal(prisesDeVueManquantes.length, 2);
  assert.deepEqual(fichiers, ATTENDUS);
  assert.deepEqual(lu.avertissements, []);
});

// Refus : chacun sur une copie modifiée de la fixture.
function avecModification(modifier) {
  const d = extraire(ZIP);
  modifier(d);
  const lu = lireDossier(d);
  rmSync(d, { recursive: true });
  return lu;
}

test('lireDossier : dossier d’une version plus récente que le plugin', () => {
  const lu = avecModification((d) => ecrireJson(join(d, 'projet.json'), { ...lireJson(join(d, 'projet.json')), schema: 'lugdia-dossier/2', version: 2 }));
  assert.deepEqual(lu, { ok: false, erreurs: ['Ce dossier est au format version 2 ; ce plugin lit la version 1. Mets à jour le plugin lugdia-studio.'] });
});

test('lireDossier : schéma faux ou JSON illisible, l’erreur nomme le fichier', () => {
  const schema = avecModification((d) => ecrireJson(join(d, 'decouverte/decouverte.json'), { ...lireJson(join(d, 'decouverte/decouverte.json')), schema: 'autre/1' }));
  assert.equal(schema.ok, false);
  assert.match(schema.erreurs.join('\n'), /decouverte\/decouverte\.json/);
  const illisible = avecModification((d) => writeFileSync(join(d, 'references/references.json'), '{'));
  assert.equal(illisible.ok, false);
  assert.match(illisible.erreurs.join('\n'), /references\/references\.json est illisible/);
});

test('lireDossier : fichier cité absent du dossier', () => {
  const lu = avecModification((d) => rmSync(join(d, 'medias/fichiers/atelier.jpg')));
  assert.equal(lu.ok, false);
  assert.ok(lu.erreurs[0].startsWith('medias/medias.json cite medias/fichiers/atelier.jpg, absent du dossier.'), lu.erreurs[0]);
  const capture = avecModification((d) => rmSync(join(d, 'references/captures/2-1440.png')));
  assert.ok(capture.erreurs[0].startsWith('references/references.json cite references/captures/2-1440.png, absent du dossier.'));
});

test('lireDossier : preuve confirmée sans source refusée', () => {
  const lu = avecModification((d) => {
    const f = join(d, 'decouverte/decouverte.json');
    const j = lireJson(f);
    j.preuves[2].confirmee = true;
    ecrireJson(f, j);
  });
  assert.equal(lu.ok, false);
  assert.match(lu.erreurs.join('\n'), /Prix régional de l’artisanat.*sans source/);
});

test('lireDossier : état de bloc inconnu refusé', () => {
  const lu = avecModification((d) => {
    const j = lireJson(join(d, 'projet.json'));
    j.blocs.medias = 'presque';
    ecrireJson(join(d, 'projet.json'), j);
  });
  assert.equal(lu.ok, false);
  assert.match(lu.erreurs.join('\n'), /medias.*presque/);
});

test('lireDossier : chemin cité qui sort du dossier refusé', () => {
  const lu = avecModification((d) => {
    const f = join(d, 'medias/medias.json');
    const j = lireJson(f);
    j.medias[0].fichier = '../../etc/hosts';
    ecrireJson(f, j);
  });
  assert.equal(lu.ok, false);
  assert.match(lu.erreurs.join('\n'), /\.\.\/\.\.\/etc\/hosts/);
});

test('lireDossier : champ inconnu accepté sans avertissement, fichier hors du format signalé', () => {
  const lu = avecModification((d) => {
    ecrireJson(join(d, 'projet.json'), { ...lireJson(join(d, 'projet.json')), nouveauChamp: true });
    writeFileSync(join(d, 'notes.txt'), 'x');
  });
  assert.equal(lu.ok, true, JSON.stringify(lu.erreurs));
  assert.deepEqual(lu.avertissements, ['ignoré : notes.txt']);
});

test('lireDossier : copie de la fixture sans médias ni références reste lisible', () => {
  const d = extraire(join(FIXTURES, 'dossier-v1-minimal.zip'));
  const lu = lireDossier(d);
  assert.equal(lu.ok, true, JSON.stringify(lu.erreurs));
  assert.deepEqual([lu.dossier.references, lu.dossier.medias], [[], []]);
  rmSync(d, { recursive: true });
});
