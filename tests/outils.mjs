// Outils communs aux tests : chemins, dossiers temporaires, archives fabriquées, empreintes.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PLUGIN = join(RACINE, 'plugins', 'lugdia-studio');
export const FIXTURES = join(RACINE, 'tests', 'fixtures');

// Chaque fichier de tests tourne dans son propre processus : il reçoit son propre dossier temporaire (TMPDIR, hérité
// par les scripts lancés), pour que les contrôles « aucun dossier temporaire ne reste » ne se gênent pas entre eux.
process.env.TMPDIR = mkdtempSync(join(tmpdir(), 'lugdia-tests-'));

export const temporaire = (prefixe = 'lugdia-test-') => mkdtempSync(join(tmpdir(), prefixe));

// Décompresse une fixture dans un dossier temporaire (pour la modifier ensuite).
export function extraire(zip) {
  const d = temporaire();
  execFileSync('unzip', ['-q', zip, '-d', d]);
  return d;
}

// Archive fabriquée par Python (zipfile), pour les cas que le CRM ne produit jamais : chemins piégés, liens.
export function fabriquerZip(sortie, entrees) {
  const script = [
    'import sys, json, zipfile',
    'out, spec = sys.argv[1], json.loads(sys.argv[2])',
    "with zipfile.ZipFile(out, 'w') as z:",
    '    for e in spec:',
    "        zi = zipfile.ZipInfo(e['nom'])",
    "        if e.get('lien'):",
    "            zi.create_system = e.get('systeme', 3)",
    '            zi.external_attr = 0o120777 << 16',
    "        z.writestr(zi, e.get('contenu', 'x'))",
  ].join('\n');
  execFileSync('python3', ['-I', '-c', script, sortie, JSON.stringify(entrees)]);
  return sortie;
}

export const nomsDansZip = (zip) => execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).split('\n').filter(Boolean);

// Fichiers d'un dossier, chemins relatifs triés.
export function fichiers(dossier, base = '') {
  const liste = [];
  for (const nom of readdirSync(join(dossier, base)).sort()) {
    const rel = base ? `${base}/${nom}` : nom;
    if (statSync(join(dossier, rel)).isDirectory()) liste.push(...fichiers(dossier, rel));
    else liste.push(rel);
  }
  return liste;
}

// Empreinte SHA-256 de chaque fichier : prouve qu'une arborescence n'a pas changé.
export const empreintes = (dossier) =>
  Object.fromEntries(fichiers(dossier).map((f) => [f, createHash('sha256').update(readFileSync(join(dossier, f))).digest('hex')]));

export const lireJson = (f) => JSON.parse(readFileSync(f, 'utf8'));
export const ecrireJson = (f, objet) => writeFileSync(f, `${JSON.stringify(objet, null, 2)}\n`);
