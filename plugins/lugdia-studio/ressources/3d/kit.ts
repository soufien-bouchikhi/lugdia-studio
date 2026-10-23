// Kit 3D Lugdia Studio : outils communs des scènes Three.js des sites clients.
// Tiré des scènes de lugdia.fr, rendu générique : la palette vient toujours des jetons du client
// (brief/tokens.json), jamais d'ici. À copier dans src/scenes/kit.ts du projet.

import * as THREE from 'three';

/** Palette de la scène, construite depuis les jetons du client. */
export interface Palette {
  fond: number;
  primaire: number;
  accent: number;
  clair: number;
  [role: string]: number;
}

/** Convertit une couleur CSS « #rrggbb » des jetons en entier pour Three.js. */
export const hex = (css: string): number => parseInt(css.replace('#', '').slice(0, 6), 16);

/** Palette par défaut à partir de tokens.json (thème clair ou sombre). */
export function paletteDepuisJetons(jetons: { couleurs: Record<string, string>; couleursSombre?: Record<string, string> }, sombre = false): Palette {
  const c = sombre && jetons.couleursSombre ? jetons.couleursSombre : jetons.couleurs;
  return { fond: hex(c.fond), primaire: hex(c.primaire), accent: hex(c.accent), clair: hex(c.surface ?? c.fond) };
}

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smooth = (e0: number, e1: number, v: number) => {
  const t = clamp((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
/** Monte entre a et b, redescend entre c et d : une fenêtre d'apparition sur une progression 0 → 1. */
export const bump = (a: number, b: number, c: number, d: number, v: number) => smooth(a, b, v) * (1 - smooth(c, d, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeIn = (t: number) => t * t * t;

/** Générateur pseudo-aléatoire reproductible : la même graine donne toujours la même scène. */
export function prng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Texture radiale dessinée en canevas (halos, points lumineux) : aucun fichier image à charger. */
export function radialTexture(stops: [number, string][], size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const h = size / 2;
  const grad = g.createRadialGradient(h, h, 0, h, h, h);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Halo d'une couleur des jetons, par exemple glowTexture('#ff912b'). */
export function glowTexture(css: string, alpha = 0.55) {
  const c = new THREE.Color(css);
  const rgba = (a: number) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
  return radialTexture([
    [0, 'rgba(255,255,255,1)'],
    [0.16, rgba(0.9)],
    [0.45, rgba(alpha * 0.35)],
    [1, 'rgba(0,0,0,0)'],
  ]);
}

export const dotTexture = () =>
  radialTexture([
    [0, 'rgba(255,255,255,1)'],
    [0.22, 'rgba(255,255,255,0.9)'],
    [0.42, 'rgba(255,255,255,0.12)'],
    [0.6, 'rgba(255,255,255,0)'],
    [1, 'rgba(255,255,255,0)'],
  ]);

export function sprite(tex: THREE.Texture, scale: number, opacity = 1) {
  const m = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(scale);
  return s;
}

/** Rend les matériaux d'un groupe transparents et règle leur opacité d'un coup (fondu d'un décor à l'autre). */
export function fader(group: THREE.Object3D) {
  const mats: { m: THREE.Material & { opacity: number }; base: number }[] = [];
  group.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!m) return;
    for (const x of Array.isArray(m) ? m : [m]) {
      const mm = x as THREE.Material & { opacity: number };
      if (mm instanceof THREE.ShaderMaterial || mats.some((k) => k.m === mm)) continue;
      mm.transparent = true;
      mats.push({ m: mm, base: mm.opacity ?? 1 });
    }
  });
  let last = -1;
  return (v: number) => {
    const k = clamp(v);
    group.visible = k > 0.002;
    if (Math.abs(k - last) < 0.002) return;
    last = k;
    for (const x of mats) x.m.opacity = x.base * k;
  };
}

/** Libère la mémoire graphique d'un groupe (géométries, matériaux, textures). */
export function liberer(group: THREE.Object3D) {
  group.traverse((o) => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose();
    const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
    for (const x of m ? (Array.isArray(m) ? m : [m]) : []) {
      for (const v of Object.values(x as unknown as Record<string, unknown>)) if (v instanceof THREE.Texture) v.dispose();
      x.dispose();
    }
  });
}

export const isMobile = () => window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
export const prefersReduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export function webglDisponible() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}
