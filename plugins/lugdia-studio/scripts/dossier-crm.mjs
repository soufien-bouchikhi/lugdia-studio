// Dossier du studio préparé par le CRM Lugdia (onglet « Site » de la fiche) : format version 1, seul contrat entre
// le CRM et ce plugin (CRM : app/src/lib/dossier-site.ts). Ouvre l'archive, la valide, la range dans brief/ du projet.
// Sans dépendance. L'archive est décompressée par unzip du système, après contrôle de chaque entrée.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, openSync, readdirSync, readFileSync, readSync, renameSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

export const SCHEMAS = { dossier: 'lugdia-dossier/1', decouverte: 'lugdia-decouverte/1', references: 'lugdia-references/1', medias: 'lugdia-medias/1' };

const VERSION = 1;
const ETATS = ['vide', 'en cours', 'prêt'];
const BLOCS = ['brief', 'decouverte', 'references', 'medias'];
export const FICHIERS_BRIEF = ['cahier-des-charges.md', 'brief.json', 'tokens.json', 'identite.png'];
const IGNORES = new Set(['.DS_Store', '__MACOSX']);

// ---- Ouverture ----------------------------------------------------------------------------------------------------

export function ouvrirDossier(source) {
  const chemin = resolve(source);
  if (!existsSync(chemin)) throw new Error(`Introuvable : ${source}`);
  if (statSync(chemin).isDirectory()) {
    const lien = premierLien(chemin);
    if (lien) throw new Error(`Dossier refusé : ${lien} est un lien.`);
    return { racine: sansEnveloppe(chemin), nettoyer: () => {}, temporaire: false };
  }
  if (!estZip(chemin)) throw new Error(`${source} n’est ni une archive ZIP ni un dossier.`);
  for (const e of entreesZip(chemin)) {
    if (!cheminSur(e.nom) || e.lien) throw new Error(`Archive refusée : ${e.nom} sort du dossier ou est un lien.`);
  }
  const temp = mkdtempSync(join(tmpdir(), 'lugdia-dossier-'));
  const nettoyer = () => rmSync(temp, { recursive: true, force: true });
  try {
    execFileSync('unzip', ['-q', '-o', chemin, '-d', temp], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    nettoyer();
    throw new Error(`Archive illisible : ${source} (${String(e.stderr || e.message).trim().split('\n')[0]}).`);
  }
  // Un lien peut être déclaré par d'autres systèmes que Unix (unzip les crée aussi) : on le cherche après extraction.
  const lien = premierLien(temp);
  if (lien) {
    nettoyer();
    throw new Error(`Archive refusée : ${lien} sort du dossier ou est un lien.`);
  }
  return { racine: sansEnveloppe(temp), nettoyer, temporaire: true };
}

export function estDossierCrm(racine) {
  try {
    const p = JSON.parse(readFileSync(join(racine, 'projet.json'), 'utf8'));
    return typeof p.schema === 'string' && p.schema.startsWith('lugdia-dossier/');
  } catch {
    return false;
  }
}

// Une archive recompressée par le Finder met tout dans un dossier enveloppe : on descend dedans.
function sansEnveloppe(dossier) {
  if (existsSync(join(dossier, 'projet.json'))) return dossier;
  const noms = readdirSync(dossier).filter((n) => !IGNORES.has(n));
  if (noms.length === 1 && statSync(join(dossier, noms[0])).isDirectory() && existsSync(join(dossier, noms[0], 'projet.json'))) return join(dossier, noms[0]);
  return dossier;
}

// Premier élément qui n'est ni un fichier ni un dossier (lien symbolique surtout), chemin relatif ; sinon null.
function premierLien(dossier, base = '') {
  for (const nom of readdirSync(join(dossier, base)).sort()) {
    const rel = base ? `${base}/${nom}` : nom;
    const s = lstatSync(join(dossier, rel));
    if (s.isDirectory()) {
      const l = premierLien(dossier, rel);
      if (l) return l;
    } else if (!s.isFile()) return rel;
  }
  return null;
}

function estZip(chemin) {
  const fd = openSync(chemin, 'r');
  const tete = Buffer.alloc(4);
  readSync(fd, tete, 0, 4, 0);
  closeSync(fd);
  return tete.readUInt32LE(0) === 0x04034b50 || tete.readUInt32LE(0) === 0x06054b50;
}

// Lit le répertoire central de l'archive (sans la charger en mémoire) : nom et nature de chaque entrée.
function entreesZip(chemin) {
  const fd = openSync(chemin, 'r');
  try {
    const taille = statSync(chemin).size;
    const fin = Buffer.alloc(Math.min(taille, 65557));
    readSync(fd, fin, 0, fin.length, taille - fin.length);
    const i = fin.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    if (i < 0) throw new Error(`Archive illisible : ${chemin} (fin d’archive introuvable).`);
    const nombre = fin.readUInt16LE(i + 10);
    const longueur = fin.readUInt32LE(i + 12);
    const debut = fin.readUInt32LE(i + 16);
    if (nombre === 0xffff || debut === 0xffffffff) throw new Error(`Archive trop grande pour être lue ici : décompresse-la et indique le dossier.`);
    const central = Buffer.alloc(longueur);
    readSync(fd, central, 0, longueur, debut);
    const entrees = [];
    for (let p = 0, n = 0; n < nombre; n++) {
      if (central.readUInt32LE(p) !== 0x02014b50) throw new Error(`Archive illisible : ${chemin} (répertoire abîmé).`);
      const systeme = central.readUInt8(p + 5);
      const drapeaux = central.readUInt16LE(p + 8);
      const lNom = central.readUInt16LE(p + 28);
      const lExtra = central.readUInt16LE(p + 30);
      const lComm = central.readUInt16LE(p + 32);
      const mode = central.readUInt32LE(p + 38) >>> 16;
      const nom = central.toString(drapeaux & 0x0800 ? 'utf8' : 'latin1', p + 46, p + 46 + lNom);
      entrees.push({ nom, lien: systeme === 3 && (mode & 0o170000) === 0o120000 });
      p += 46 + lNom + lExtra + lComm;
    }
    return entrees;
  } finally {
    closeSync(fd);
  }
}

function cheminSur(nom) {
  if (!nom || nom.startsWith('/') || nom.includes('\\') || /^[A-Za-z]:/.test(nom)) return false;
  return nom.replace(/\/$/, '').split('/').every((s) => s && s !== '.' && s !== '..');
}

// ---- Lecture et validation ----------------------------------------------------------------------------------------

export function lireDossier(racine) {
  const erreurs = [];
  const lire = (rel, schema) => {
    const f = join(racine, rel);
    if (!existsSync(f)) return void erreurs.push(`${rel} manque dans le dossier.`);
    let j;
    try {
      j = JSON.parse(readFileSync(f, 'utf8'));
    } catch {
      return void erreurs.push(`${rel} est illisible (JSON invalide).`);
    }
    if (schema && j.schema !== schema) return void erreurs.push(`${rel} : schéma « ${j.schema} » au lieu de « ${schema} ».`);
    return j;
  };

  const projet = lire('projet.json');
  if (!projet) return { ok: false, erreurs };
  if (typeof projet.schema !== 'string' || !projet.schema.startsWith('lugdia-dossier/')) return { ok: false, erreurs: [`projet.json n’est pas celui d’un dossier du CRM (schéma « ${projet.schema} »).`] };
  if (projet.version !== VERSION || projet.schema !== SCHEMAS.dossier) {
    return { ok: false, erreurs: [`Ce dossier est au format version ${projet.version} ; ce plugin lit la version ${VERSION}. Mets à jour le plugin lugdia-studio.`] };
  }
  if (typeof projet.affaire !== 'string' || !projet.affaire) erreurs.push('projet.json : affaire manquante.');
  if (typeof projet.client !== 'string' || !projet.client.trim()) erreurs.push('projet.json : client manquant.');
  if (typeof projet.date !== 'string' || Number.isNaN(Date.parse(projet.date))) erreurs.push(`projet.json : date invalide (« ${projet.date} »).`);
  for (const b of BLOCS) {
    const etat = projet.blocs && projet.blocs[b];
    if (!ETATS.includes(etat)) erreurs.push(`projet.json : état du bloc ${b} inconnu (« ${etat} »).`);
  }

  const decouverte = lire('decouverte/decouverte.json', SCHEMAS.decouverte);
  const references = lire('references/references.json', SCHEMAS.references);
  const medias = lire('medias/medias.json', SCHEMAS.medias);
  const connus = new Set(['projet.json', 'decouverte/decouverte.json', 'decouverte/decouverte.md', 'references/references.json', 'medias/medias.json', ...FICHIERS_BRIEF.map((f) => `brief/${f}`)]);
  const cite = (de, rel, prefixes, suite = '') => {
    if (typeof rel !== 'string' || !cheminSur(rel) || !prefixes.some((p) => rel.startsWith(p))) return void erreurs.push(`${de} cite un chemin refusé : « ${rel} ».`);
    if (!existsSync(join(racine, rel))) return void erreurs.push(`${de} cite ${rel}, absent du dossier.${suite}`);
    connus.add(rel);
  };

  for (const p of (decouverte && decouverte.preuves) || []) {
    if (p.confirmee === true && !(typeof p.source === 'string' && p.source.trim())) erreurs.push(`decouverte/decouverte.json : la preuve « ${p.texte} » est confirmée sans source.`);
  }
  for (const r of (references && references.references) || []) {
    for (const l of ['1440', '390']) if (r.captures && r.captures[l] !== null && r.captures[l] !== undefined) cite('references/references.json', r.captures[l], ['references/captures/']);
  }
  for (const m of (medias && medias.medias) || []) {
    cite('medias/medias.json', m.fichier, ['medias/fichiers/', 'charte/'], ' Vérifie ce média dans l’onglet « Site » de la fiche, puis prépare de nouveau le dossier.');
  }
  if (erreurs.length) return { ok: false, erreurs };

  const fichiers = listerFichiers(racine);
  return {
    ok: true,
    dossier: {
      projet: { version: projet.version, affaire: projet.affaire, client: projet.client.trim(), date: projet.date, blocs: projet.blocs },
      decouverte,
      references: references.references || [],
      medias: medias.medias || [],
      prisesDeVueManquantes: medias.prisesDeVueManquantes || [],
      fichiers,
      retenus: fichiers.filter((f) => connus.has(f)),
    },
    avertissements: fichiers.filter((f) => !connus.has(f)).map((f) => `ignoré : ${f}`),
  };
}

// ---- Lignes « à fournir » -----------------------------------------------------------------------------------------

const NOMS_BLOCS = { brief: 'brief', decouverte: 'découverte', references: 'références', medias: 'médias' };

export function aFournirDuDossier(dossier) {
  const l = [];
  for (const p of dossier.prisesDeVueManquantes) l.push(`- [ ] Prise de vue : ${p} (dossier du CRM)`);
  for (const m of dossier.medias) if (m.droits !== true) l.push(`- [ ] Droits d’usage et accord des personnes : brief/${m.fichier} (dossier du CRM)`);
  for (const p of (dossier.decouverte && dossier.decouverte.preuves) || []) {
    if (p.confirmee !== true) l.push(`- [ ] Preuve à confirmer : ${p.texte} (${p.source ? `source : ${p.source}` : 'sans source'})`);
  }
  for (const b of BLOCS) if (dossier.projet.blocs[b] !== 'prêt') l.push(`- [ ] Dossier du CRM : bloc ${NOMS_BLOCS[b]} « ${dossier.projet.blocs[b]} »`);
  return l;
}

// ---- Rangement dans le projet client ------------------------------------------------------------------------------

// Où va chaque fichier du dossier dans le projet : tout sous brief/, projet.json renommé en dossier.json.
export function destination(rel) {
  if (rel === 'projet.json') return 'brief/dossier.json';
  if (rel.startsWith('brief/') && FICHIERS_BRIEF.includes(rel.slice(6))) return rel;
  if (/^(decouverte|references|medias|charte)\//.test(rel)) return `brief/${rel}`;
  return null;
}
const venuDuCrm = (rel) => rel === 'brief/dossier.json' || FICHIERS_BRIEF.some((f) => rel === `brief/${f}`) || /^brief\/(decouverte|references|medias|charte)\//.test(rel);

// mode : « demarrage » (un fichier déjà présent et différent est gardé), « mise-a-jour » (il est remplacé, et ce que
// le nouveau dossier n'a plus est retiré), « restauration » (seuls les fichiers absents sont recréés).
// deplacer : vrai quand la source est le dossier temporaire de l'archive (déplacement plutôt que copie).
export function rangerDossier(dossier, racine, cible, { mode, deplacer }) {
  const r = { crees: [], remplaces: [], retires: [], inchanges: [], gardes: [] };
  const voulus = new Set();
  for (const rel of dossier.retenus) {
    const dest = destination(rel);
    if (!dest) continue;
    voulus.add(dest);
    const de = join(racine, rel);
    const vers = join(cible, dest);
    if (!existsSync(vers)) {
      poser(de, vers, deplacer);
      r.crees.push(dest);
    } else if (memeContenu(de, vers)) r.inchanges.push(dest);
    else if (mode === 'mise-a-jour') {
      poser(de, vers, deplacer);
      r.remplaces.push(dest);
    } else if (mode === 'demarrage') r.gardes.push(dest);
    else r.inchanges.push(dest);
  }
  if (mode === 'mise-a-jour' && existsSync(join(cible, 'brief'))) {
    for (const rel of listerFichiers(cible, 'brief').filter((f) => venuDuCrm(f) && !voulus.has(f))) {
      rmSync(join(cible, rel));
      r.retires.push(rel);
    }
  }
  for (const k of Object.keys(r)) r[k].sort();
  return r;
}

function poser(de, vers, deplacer) {
  mkdirSync(dirname(vers), { recursive: true });
  if (!deplacer) return copyFileSync(de, vers);
  try {
    renameSync(de, vers);
  } catch (e) {
    if (e.code !== 'EXDEV') throw e;
    copyFileSync(de, vers);
    rmSync(de);
  }
}

function memeContenu(a, b) {
  return statSync(a).size === statSync(b).size && empreinte(a) === empreinte(b);
}

// SHA-256 lu par morceaux : un fichier de 2 Go ne passe jamais en mémoire.
function empreinte(f) {
  const h = createHash('sha256');
  const fd = openSync(f, 'r');
  try {
    const morceau = Buffer.alloc(1 << 20);
    for (let n; (n = readSync(fd, morceau, 0, morceau.length, null)) > 0; ) h.update(morceau.subarray(0, n));
  } finally {
    closeSync(fd);
  }
  return h.digest('hex');
}

function listerFichiers(dossier, base = '') {
  const liste = [];
  for (const nom of readdirSync(join(dossier, base)).sort()) {
    if (IGNORES.has(nom)) continue;
    const rel = base ? `${base}/${nom}` : nom;
    if (statSync(join(dossier, rel)).isDirectory()) liste.push(...listerFichiers(dossier, rel));
    else liste.push(rel);
  }
  return liste;
}
