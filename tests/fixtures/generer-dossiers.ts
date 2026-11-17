// Fabrique les dossiers d'essai avec le code du CRM lui-même (composerDossier et ecrireZip), jamais à la main.
// Lancer depuis app/ du CRM (chargeur des tests du CRM) :
//   node --experimental-strip-types --import ./tests/chargeur.mjs <ce fichier> <dossier app du CRM> <dossier de sortie>
// Rien n'est écrit dans le CRM.
import { createWriteStream, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { crc32 } from 'node:zlib';

const [app, sortie] = process.argv.slice(2).map((x) => resolve(x));
if (!app || !sortie) throw new Error('Usage : generer-dossiers.ts <dossier app du CRM> <dossier de sortie>');
const { composerDossier } = await import(pathToFileURL(join(app, 'src/lib/dossier-site.ts')).href);
const { ecrireZip } = await import(pathToFileURL(join(app, 'src/lib/zip.ts')).href);

const AFFAIRE = '6f1c2a9e-3b4d-4e5f-8a7b-1c2d3e4f5a6b';
const CLIENT = 'Ébénisterie Exemple';
const T = '2026-11-10T09:00:00.000Z';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const JPG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==',
  'base64',
);

const BRIEF = {
  'cahier-des-charges.md': [
    `# Cahier des charges : site internet de ${CLIENT}`,
    '',
    'Référence CDC-ebenisterie-exemple-20261110-AB12',
    '',
    '## 8. Contenus et médias',
    '',
    '**Plan de collecte**',
    '',
    '- Photos des réalisations récentes',
    '- Liste des essences de bois travaillées',
    '',
    '## 9. Référencement',
    '',
  ].join('\n'),
  'brief.json': `${JSON.stringify(
    {
      schema: 'lugdia-brief/2',
      ref: 'CDC-ebenisterie-exemple-20261110-AB12',
      entreprise: { nom: CLIENT, slug: 'ebenisterie-exemple', ville: 'Lyon' },
      technique: { domaine: 'ebenisterie-exemple.fr' },
      editorial: { interdits: ['pas cher', 'numéro 1'] },
    },
    null,
    2,
  )}\n`,
  'tokens.json': `${JSON.stringify({ schema: 'lugdia-tokens/1', couleurs: { fond: '#f4efe6', texte: '#2b2118', accent: '#8a4b2a' } }, null, 2)}\n`,
  'identite.png': PNG,
};

const DECOUVERTE = {
  histoire: 'Atelier ouvert en 1998 à Lyon par un compagnon du devoir ; deux ébénistes aujourd’hui.',
  clientsTypes: ['Propriétaires d’appartements anciens', 'Architectes d’intérieur'],
  momentsDeclencheurs: ['Rénovation d’un appartement haussmannien'],
  objections: ['Peur d’un prix trop élevé'],
  motsDuClient: ['du sur-mesure qui dure', 'le bois a sa mémoire'],
  concurrents: ['Menuiserie du Rhône'],
  preuves: [
    { texte: 'Label Entreprise du patrimoine vivant', type: 'label', source: 'certificat vu le 12/11/2026', confirmee: true, origine: 'SAISIE' },
    { texte: '400 cuisines posées', type: 'chiffre', source: 'Entretien du 12/11/2026, dit par le client', confirmee: false, origine: 'IA' },
    { texte: 'Prix régional de l’artisanat', type: 'label', source: null, confirmee: false, origine: 'SAISIE' },
  ],
};
const DECOUVERTE_MINIMALE = {
  histoire: 'Atelier ouvert en 2010.',
  clientsTypes: ['Particuliers'],
  momentsDeclencheurs: ['Déménagement'],
  objections: [],
  motsDuClient: ['fait main'],
  concurrents: [],
  preuves: [],
};

const ref = (id: string, rang: number, statutCapture: string, extra: object = {}) => ({
  id, projetId: 'p1', rang, adresse: `https://reference-${rang}.example/`, aime: null, naimePas: null, statutCapture, erreur: null,
  couleurs: null, polices: null, demandeeLe: T, captureeLe: T, createdAt: T, updatedAt: T, ...extra,
});
const REFERENCES = [
  ref('r1', 1, 'PRETE', { aime: 'le bois en grand, peu de texte', naimePas: 'les carrousels', couleurs: [{ role: 'fond', hex: '#f4efe6' }], polices: [{ role: 'titres', famille: 'Fraunces' }] }),
  ref('r2', 2, 'PRETE', { aime: 'les photos d’atelier' }),
  ref('r3', 3, 'ECHEC', { naimePas: 'trop sombre', erreur: 'délai dépassé' }),
];

const media = (id: string, categorie: string, nomFichier: string, extra: object = {}) => ({
  id, projetId: 'p1', categorie, nomOrigine: nomFichier, nomFichier, typeMime: '', taille: 0, crc32: 0, origine: 'CLIENT',
  droitsConfirmes: true, droitsConfirmesPar: 'Soufien', droitsConfirmesLe: T, personnes: 'NON', legende: '', invite: null, modele: null,
  deposePar: 'Soufien', createdAt: T, updatedAt: T, ...extra,
});
const CONTENUS: Record<string, Buffer | string> = {
  'atelier.jpg': JPG,
  'atelier-2.jpg': JPG,
  'equipe.jpg': JPG,
  'etabli-genere.png': PNG,
  'logo.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#8a4b2a"/></svg>\n',
  'marque-titres.woff2': Buffer.from('wOF2-fixture'),
};
const MEDIAS = [
  media('m1', 'PHOTO', 'atelier.jpg', { legende: 'L’atelier, établi central' }),
  media('m2', 'PHOTO', 'equipe.jpg', { droitsConfirmes: false, droitsConfirmesPar: null, droitsConfirmesLe: null, personnes: 'OUI', legende: 'Les deux ébénistes' }),
  media('m3', 'PHOTO', 'etabli-genere.png', { origine: 'GENERE', invite: 'Un établi en chêne sous une verrière, lumière du matin', modele: 'google/gemini-3.1-flash-image', legende: 'Image générée par IA : établi', droitsConfirmesPar: 'image générée pour Lugdia' }),
  media('m4', 'LOGO', 'logo.svg'),
  media('m5', 'POLICE', 'marque-titres.woff2', { legende: 'Police des titres, licence web fournie' }),
];

function projet(o: { brief: string[]; decouverte: object; references: object[]; medias: object[]; prisesDeVue: string[] }) {
  return {
    projet: {
      id: 'p1', affaireId: AFFAIRE, entrepriseId: 'e1', rdvId: null, briefRef: 'CDC-ebenisterie-exemple-20261110-AB12', briefRecuLe: T, guide: null,
      guideDemandeLe: null, guideRecuLe: null, notesEntretien: null, decouverte: o.decouverte, propositionIa: null, decouverteDemandeeLe: null,
      decouverteRecueLe: T, decouverteRelueLe: T, entretienLe: '2026-11-12T09:00:00.000Z', entretienEnregistre: true, decouverteReluePar: 'Soufien',
      prisesDeVue: o.prisesDeVue, dossierNumero: 0, dossierLe: null, dossierPar: null, modifieLe: T, creePar: 'Soufien', createdAt: T, updatedAt: T,
    },
    affaire: { id: AFFAIRE, name: 'Site internet', etapeLugdia: 'RDV_REALISE' },
    references: o.references,
    medias: o.medias,
    brief: o.brief,
  };
}

const temp = mkdtempSync(join(tmpdir(), 'fixtures-dossier-'));
const source = (nom: string, contenu: Buffer | string) => {
  const chemin = join(temp, nom);
  writeFileSync(chemin, contenu);
  const octets = readFileSync(chemin);
  return { fichier: chemin, taille: statSync(chemin).size, crc32: crc32(octets) };
};
const sourcesBrief = Object.fromEntries(Object.entries(BRIEF).map(([nom, c]) => [nom, source(`brief-${nom}`, c)]));
const sourcesMedias = Object.fromEntries(Object.entries(CONTENUS).map(([nom, c]) => [nom, source(`media-${nom}`, c)]));
const avecTailles = (liste: ReturnType<typeof media>[]) =>
  liste.map((m) => ({ ...m, taille: sourcesMedias[m.nomFichier].taille, crc32: sourcesMedias[m.nomFichier].crc32 }));

async function ecrire(nom: string, p: ReturnType<typeof projet>, date: string) {
  const fichiers = {
    brief: Object.fromEntries(p.brief.map((n) => [n, sourcesBrief[n]])),
    captures: {
      r1: { '1440': source('r1-1440.png', PNG), '390': source('r1-390.png', PNG) },
      r2: { '1440': source('r2-1440.png', PNG) },
      r3: {},
    },
    medias: Object.fromEntries((p.medias as { id: string; nomFichier: string }[]).map((m) => [m.id, sourcesMedias[m.nomFichier].fichier])),
  };
  const entrees = composerDossier(p, CLIENT, new Date(date), fichiers);
  await ecrireZip(entrees, createWriteStream(join(sortie, nom)), new Date(date));
}

const TOUT = ['cahier-des-charges.md', 'brief.json', 'tokens.json', 'identite.png'];
const PRISES = ['Les mains de l’ébéniste au rabot', 'La façade de l’atelier'];
mkdirSync(sortie, { recursive: true });
await ecrire('dossier-v1.zip', projet({ brief: TOUT, decouverte: DECOUVERTE, references: REFERENCES, medias: avecTailles(MEDIAS), prisesDeVue: PRISES }), '2026-11-16T10:00:00.000Z');
await ecrire(
  'dossier-v1-maj.zip',
  projet({
    brief: TOUT,
    decouverte: { ...DECOUVERTE, histoire: 'Atelier ouvert en 1998 à Lyon par un compagnon du devoir ; trois ébénistes depuis 2026.' },
    references: REFERENCES,
    medias: avecTailles([...MEDIAS.filter((m) => m.id !== 'm2'), media('m6', 'PHOTO', 'atelier-2.jpg', { legende: 'Un buffet en noyer' })]),
    prisesDeVue: [...PRISES, 'Le buffet en noyer posé chez le client'],
  }),
  '2026-11-20T09:30:00.000Z',
);
await ecrire('dossier-v1-sans-brief.zip', projet({ brief: [], decouverte: DECOUVERTE, references: REFERENCES, medias: avecTailles(MEDIAS), prisesDeVue: PRISES }), '2026-11-16T10:00:00.000Z');
await ecrire('dossier-v1-minimal.zip', projet({ brief: TOUT, decouverte: DECOUVERTE_MINIMALE, references: [], medias: [], prisesDeVue: [] }), '2026-11-16T10:00:00.000Z');

// Pour la recette de bout en bout seulement (cadrage complet) : le même client avec un brief complet en 14 sections.
const BRIEF_COMPLET = {
  'cahier-des-charges.md': `# Cahier des charges : site internet de ${CLIENT}

Référence CDC-ebenisterie-exemple-20261110-AB12 · client fictif de recette, aucune donnée réelle.

## 1. Entreprise
Atelier d’ébénisterie à Lyon (Croix-Rousse), deux ébénistes. Meubles sur mesure, cuisines et restauration de meubles anciens. Zone : Lyon et 30 km autour.

## 2. Projet
Premier site. Objectif : recevoir des demandes de devis qualifiées pour des meubles et cuisines sur mesure.

## 3. Cibles
- Propriétaires d’appartements anciens qui rénovent (moment : achat ou rénovation ; frein : peur du prix).
- Architectes d’intérieur qui cherchent un atelier fiable (moment : nouveau chantier ; frein : délais).

Réponses du site à leurs hésitations : montrer des réalisations avec leurs étapes ; expliquer comment se construit un devis ; dire les délais habituels quand le client les donnera.

## 4. Offre
- Service phare : cuisine sur mesure en bois massif.
- Meubles sur mesure (bibliothèques, dressings, tables).
- Restauration de meubles anciens.
Accroche du client, en ses mots : « Des meubles qui gardent la mémoire du bois. »
Ce qui distingue : tout est fait à l’atelier, à la main, avec des bois choisis chez des scieries de la région.
Preuves : label Entreprise du patrimoine vivant (certificat fourni). Aucun avis client fourni.

## 5. Contenu page par page
- Accueil : accroche, trois services, une réalisation, comment se passe un projet, demande de devis. À rédiger par Claude, 250 à 400 mots.
- L’atelier : histoire (fournie en entretien), les deux ébénistes, les bois. À rédiger par Claude, 300 à 500 mots.
- Réalisations : galerie avec légendes (photos à fournir).
- Cuisines sur mesure, Meubles sur mesure, Restauration : une page par service, 300 à 500 mots chacune.
- Demande de devis : formulaire.
- Mentions légales, confidentialité.

## 6. Identité visuelle
Logo fourni (SVG). Pas de charte « à respecter » : jetons proposés. Le client aime le bois en grand, peu de texte, des photos d’atelier ; il n’aime pas les carrousels ni les sites sombres.

## 7. Contact et rendez-vous
Formulaire de demande de devis (projet, pièce, dimensions approximatives, budget indicatif, délai souhaité). Téléphone de l’atelier affiché. Visite de l’atelier sur rendez-vous.

## 8. Contenus et médias
Photos de l’atelier fournies en partie ; photos de réalisations à fournir.

**Plan de collecte**

- Photos des réalisations récentes
- Liste des essences de bois travaillées

## 9. Référencement
Mots-clés : ébéniste Lyon, cuisine sur mesure Lyon, meuble sur mesure Lyon, restauration meuble ancien Lyon. Données structurées : LocalBusiness (HomeAndConstructionBusiness).

## 10. Glossaire et ton éditorial
Ton : simple, précis, chaleureux, « nous ». Vocabulaire : essences, assemblages, tenons et mortaises, finitions à l’huile.
Mots à éviter : « pas cher », « numéro 1 ».

## 11. Juridique et conformité
Mentions légales et politique de confidentialité ; mention du label EPV avec son année d’obtention (à fournir).

## 12. Technique
Domaine : ebenisterie-exemple.fr (à acheter). Site en français. Pas de boutique.

## 13. Planning et priorités
Must : accueil, l’atelier, services, devis. Should : réalisations. Could : actualités.

## 14. Recette
Le formulaire de devis arrive par e-mail ; le site est lisible sur téléphone ; les pages se chargent vite.
`,
  'brief.json': `${JSON.stringify(
    {
      schema: 'lugdia-brief/2',
      ref: 'CDC-ebenisterie-exemple-20261110-AB12',
      entreprise: { nom: CLIENT, slug: 'ebenisterie-exemple', ville: 'Lyon', zone: 'Lyon et 30 km autour', coordonneesPubliques: { telephone: 'à fournir' } },
      activites: { principale: 'Ébénisterie', secondaires: ['Cuisines sur mesure', 'Restauration de meubles anciens'] },
      offre: { servicePhare: 'Cuisine sur mesure en bois massif', services: ['Cuisines sur mesure', 'Meubles sur mesure', 'Restauration de meubles anciens'], accroche: 'Des meubles qui gardent la mémoire du bois.' },
      clients: {
        cibles: ['Propriétaires d’appartements anciens', 'Architectes d’intérieur'],
        moments: ['Achat ou rénovation d’un appartement ancien', 'Nouveau chantier'],
        freins: ['Peur du prix', 'Délais'],
      },
      objectif: { cta: 'Demander un devis', conversions: ['Demande de devis', 'Appel', 'Visite de l’atelier'], indicateur: 'Demandes de devis par mois' },
      pages: [
        { id: 'accueil', titre: 'Accueil' }, { id: 'atelier', titre: 'L’atelier' }, { id: 'realisations', titre: 'Réalisations' },
        { id: 'cuisines', titre: 'Cuisines sur mesure' }, { id: 'meubles', titre: 'Meubles sur mesure' }, { id: 'restauration', titre: 'Restauration' }, { id: 'devis', titre: 'Demande de devis' },
      ],
      contenus: { photos: 'en partie' },
      seo: { motsCles: ['ébéniste Lyon', 'cuisine sur mesure Lyon', 'meuble sur mesure Lyon', 'restauration meuble ancien Lyon'], zones: ['Lyon'], schemaOrg: ['HomeAndConstructionBusiness'] },
      editorial: { ton: 'simple, précis, chaleureux', personne: 'nous', vocabulaire: ['essences', 'assemblages', 'finitions à l’huile'], interdits: ['pas cher', 'numéro 1'] },
      juridique: { mentions: ['Mentions légales', 'Politique de confidentialité', 'Label EPV avec son année (à fournir)'] },
      technique: { domaine: 'ebenisterie-exemple.fr', langues: ['fr'] },
      identite: { logo: true, charte: false, aime: ['le bois en grand', 'peu de texte', 'photos d’atelier'], inspirations: [] },
      concurrents: ['Menuiserie du Rhône'],
      planning: { priorites: ['accueil', 'atelier', 'services', 'devis'] },
      recette: ['Formulaire de devis reçu par e-mail', 'Lisible sur téléphone', 'Pages rapides'],
    },
    null,
    2,
  )}\n`,
  'tokens.json': `${JSON.stringify(
    {
      schema: 'lugdia-tokens/1',
      mode: 'clair',
      couleurs: { fond: '#f4efe6', surface: '#fbf8f2', texte: '#2b2118', texteSecondaire: '#5c4a3a', principale: '#8a4b2a', accent: '#c9a227' },
      typo: { titres: 'à proposer', texte: 'à proposer' },
      formes: { rayon: 'petit', densite: 'aérée', ombres: false },
      images: 'photos d’atelier et de réalisations',
      mouvement: 'discret',
      personnalite: ['artisanal', 'précis', 'chaleureux'],
    },
    null,
    2,
  )}\n`,
  'identite.png': PNG,
};
for (const [nom, c] of Object.entries(BRIEF_COMPLET)) sourcesBrief[nom] = source(`brief-complet-${nom}`, c);
await ecrire('dossier-v1-complet.zip', projet({ brief: TOUT, decouverte: DECOUVERTE, references: REFERENCES, medias: avecTailles(MEDIAS), prisesDeVue: PRISES }), '2026-11-16T10:00:00.000Z');

const briefSeul = join(sortie, 'brief-seul');
mkdirSync(briefSeul, { recursive: true });
for (const [nom, c] of Object.entries(BRIEF)) writeFileSync(join(briefSeul, nom), c);
rmSync(temp, { recursive: true, force: true });
console.log('Fixtures écrites dans', sortie);
