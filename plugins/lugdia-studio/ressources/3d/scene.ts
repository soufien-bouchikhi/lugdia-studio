// Socle d'une scène Three.js Lugdia : rendu, qualité adaptative, pauses, mouvement réduit, libération.
// Tiré du voyage 3D de lugdia.fr. À copier dans src/scenes/scene.ts du projet, puis à compléter
// avec le décor propre au client dans la fonction `image`.
//
// Règles tenues ici (voir lugdia-studio:regles-lugdia, references/accessibilite-mouvement.md) :
// - sans WebGL : renvoie null, la page affiche son repli 2D ;
// - mouvement réduit : une seule image, recalculée au redimensionnement et au défilement ;
// - qualité 2 (ordinateur), 1 (téléphone), 0 (appareil qui peine : sans post-traitement) ;
//   sous ~30 images par seconde pendant 2 s, la qualité baisse d'un cran ; `?hq` dans l'adresse l'empêche (captures) ;
// - pause quand l’onglet est masqué ou que le canevas sort de l’écran ;
// - le canevas porte `data-qualite` (0, 1 ou 2) pour les tests et les mesures ;
// - `arreter()` libère tout.

import * as THREE from 'three';
import { isMobile, prefersReduce, webglDisponible, liberer } from './kit';

export interface OptionsScene {
  /** Dessine une image. `dt` en secondes (0 pour une image fixe), `qualite` 0, 1 ou 2. */
  image: (ctx: ContexteScene, dt: number) => void;
  /** Couleur de fond (entier), en général la palette du client. */
  fond: number;
  /** Plafond de densité de pixels par qualité [0, 1, 2]. */
  dprMax?: [number, number, number];
  /** Appelé quand la qualité baisse, pour couper un post-traitement ou des particules. */
  surBaisse?: (qualite: number) => void;
}

export interface ContexteScene {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  qualite: number;
  mobile: boolean;
  reduit: boolean;
  temps: number;
  largeur: number;
  hauteur: number;
}

export interface Scene {
  ctx: ContexteScene;
  /** Redessine une image (à appeler quand l'état du défilement change en mouvement réduit). */
  redessiner: () => void;
  arreter: () => void;
}

export function demarrerScene(canvas: HTMLCanvasElement, opts: OptionsScene): Scene | null {
  if (!webglDisponible()) return null;
  const mobile = isMobile();
  const reduit = prefersReduce();
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance', alpha: false });
  } catch {
    return null;
  }
  renderer.setClearColor(opts.fond, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const dprMax = opts.dprMax ?? [1, 1.25, 1.5];
  const ctx: ContexteScene = {
    renderer,
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(45, 1, 0.1, 200),
    qualite: mobile ? 1 : 2,
    mobile,
    reduit,
    temps: 0,
    largeur: 0,
    hauteur: 0,
  };

  const redimensionner = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    ctx.largeur = w;
    ctx.hauteur = h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprMax[ctx.qualite]));
    // Signal lisible par les tests et les mesures : niveau de qualité courant.
    canvas.dataset.qualite = String(ctx.qualite);
    renderer.setSize(w, h, false);
    ctx.camera.aspect = w / h;
    ctx.camera.fov = h > w ? 60 : 45;
    ctx.camera.updateProjectionMatrix();
  };
  redimensionner();

  const redessiner = () => opts.image(ctx, 0);
  const ecouteurs: [EventTarget, string, EventListener][] = [];
  const ecouter = (cible: EventTarget, type: string, f: EventListener, o?: AddEventListenerOptions) => {
    cible.addEventListener(type, f, o);
    ecouteurs.push([cible, type, f]);
  };

  let arrete = false;
  let observateur: IntersectionObserver | null = null;
  const arreter = () => {
    arrete = true;
    for (const [c, t, f] of ecouteurs) c.removeEventListener(t, f);
    observateur?.disconnect();
    liberer(ctx.scene);
    renderer.dispose();
  };

  ecouter(window, 'resize', () => {
    redimensionner();
    if (reduit) redessiner();
  });

  if (reduit) {
    redessiner();
    ecouter(window, 'scroll', redessiner, { passive: true });
    return { ctx, redessiner, arreter };
  }

  // Pauses : onglet masqué, canevas hors de l'écran.
  let visible = true;
  let masque = document.hidden;
  if ('IntersectionObserver' in window) {
    observateur = new IntersectionObserver((e) => {
      visible = e.some((x) => x.isIntersecting);
      relancer();
    });
    observateur.observe(canvas);
  }
  ecouter(document, 'visibilitychange', () => {
    masque = document.hidden;
    relancer();
  });

  // Qualité adaptative.
  const garderQualite = /[?&]hq\b/.test(window.location.search);
  let lent = 0;
  let chauffe = 0;
  let dernier = performance.now();
  let enCours = false;

  const boucle = (maintenant: number) => {
    if (arrete || masque || !visible) {
      enCours = false;
      return;
    }
    const brut = (maintenant - dernier) / 1000;
    const dt = Math.min(0.05, Math.max(0, brut));
    dernier = maintenant;
    ctx.temps += dt;
    opts.image(ctx, dt);
    if (ctx.qualite > 0 && !garderQualite && chauffe++ > 60) {
      lent = brut > 0.034 && brut < 0.5 ? lent + 1 : Math.max(0, lent - 2);
      if (lent > 120) {
        ctx.qualite -= 1;
        lent = 0;
        redimensionner();
        opts.surBaisse?.(ctx.qualite);
      }
    }
    requestAnimationFrame(boucle);
  };
  function relancer() {
    if (arrete || masque || !visible || enCours) return;
    enCours = true;
    dernier = performance.now();
    requestAnimationFrame(boucle);
  }
  relancer();

  return { ctx, redessiner, arreter };
}
