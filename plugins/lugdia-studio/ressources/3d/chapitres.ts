// Chapitres figés pilotés par le défilement, comme le voyage de lugdia.fr.
// Chaque section `[data-ch]` est haute de plusieurs écrans ; son contenu `.stick` reste figé
// (position: sticky) pendant que la page calcule l'avancée `--p` (0 → 1) du chapitre et `--x`
// (0 → 1 pendant l'écran qui suit, pour le passage au chapitre suivant). La scène 3D lit le même état.
// CSS associé : chapitres.css. À copier dans src/scenes/ du projet.

import { clamp } from './kit';

export interface EtatChapitres {
  /** Défilement en hauteurs d'écran depuis le haut de la page. */
  s: number;
  /** Avancée de chaque chapitre, par identifiant. */
  p: Record<string, number>;
  /** Passage vers le chapitre suivant, par identifiant. */
  x: Record<string, number>;
}

interface Boite {
  id: string;
  el: HTMLElement;
  haut: number;
  hauteur: number;
}

/**
 * Suit les chapitres `[data-ch]` du document. Appelle `surChange` à chaque image où le défilement a bougé.
 * Sous mouvement réduit, les chapitres ne sont pas figés (voir le CSS) : `--p` vaut 1 et le contenu se lit à la suite.
 */
export function suivreChapitres(surChange?: (etat: EtatChapitres) => void) {
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const etat: EtatChapitres = { s: 0, p: {}, x: {} };
  let boites: Boite[] = [];

  const mesurer = () => {
    const y = window.scrollY;
    boites = Array.from(document.querySelectorAll<HTMLElement>('[data-ch]')).map((el) => {
      const r = el.getBoundingClientRect();
      return { id: el.dataset.ch || el.id, el, haut: r.top + y, hauteur: r.height };
    });
  };

  const calculer = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    etat.s = y / vh;
    for (const b of boites) {
      const p = reduit ? 1 : clamp((y - b.haut) / Math.max(1, b.hauteur - vh));
      const x = reduit ? 0 : clamp((y - (b.haut + b.hauteur - vh)) / vh);
      etat.p[b.id] = p;
      etat.x[b.id] = x;
      b.el.style.setProperty('--p', p.toFixed(4));
      b.el.style.setProperty('--x', x.toFixed(4));
    }
    surChange?.(etat);
  };

  let prevu = false;
  const planifier = () => {
    if (prevu) return;
    prevu = true;
    requestAnimationFrame(() => {
      prevu = false;
      calculer();
    });
  };

  mesurer();
  calculer();
  window.addEventListener('scroll', planifier, { passive: true });
  window.addEventListener('resize', () => {
    mesurer();
    planifier();
  });
  // Les polices et les images peuvent changer les hauteurs après le chargement.
  new ResizeObserver(() => {
    mesurer();
    planifier();
  }).observe(document.body);

  return etat;
}
