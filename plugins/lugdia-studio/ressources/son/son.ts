// Sons d'interface Lugdia Studio : synthétisés dans le navigateur (Web Audio), sans fichier ni licence.
// Coupé par défaut, jamais lancé sans geste du visiteur, coupé quand l'onglet est masqué,
// choix retenu pour la visite suivante. À copier dans src/son/son.ts du projet.

export type Signal = 'survol' | 'clic' | 'transition' | 'succes' | 'erreur';

export interface OptionsSon {
  /** Clé de mémorisation du choix du visiteur (une par site). */
  cle: string;
  /** Volume général, de 0 à 1. Rester discret : 0,12 à 0,2. */
  volume?: number;
  /** Fréquence de base des signaux, accordée à la marque (en Hz). */
  base?: number;
}

export interface Son {
  actif: () => boolean;
  /** À appeler depuis un geste du visiteur (clic sur le bouton son). */
  activer: () => Promise<void>;
  couper: () => void;
  jouer: (signal: Signal) => void;
  /** Ambiance continue très douce, facultative ; s'arrête avec couper(). */
  ambiance: (marche: boolean) => void;
  /** Prévient quand le son s'active ou se coupe (par le bouton ou par la réactivation au premier geste). */
  surChange: (f: (actif: boolean) => void) => void;
}

export function creerSon(opts: OptionsSon): Son {
  const volume = opts.volume ?? 0.15;
  const base = opts.base ?? 440;
  let ctx: AudioContext | null = null;
  let maitre: GainNode | null = null;
  let actif = false;
  let nappe: { arreter: () => void } | null = null;
  let dernierSurvol = 0;
  const abonnes: ((actif: boolean) => void)[] = [];
  const prevenir = () => abonnes.forEach((f) => f(actif));

  const lire = () => {
    try { return localStorage.getItem(opts.cle) === '1'; } catch { return false; }
  };
  const ecrire = (v: boolean) => {
    try { localStorage.setItem(opts.cle, v ? '1' : '0'); } catch { /* stockage indisponible : le choix vaut pour la visite */ }
  };

  const preparer = () => {
    if (ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    maitre = ctx.createGain();
    maitre.gain.value = volume;
    maitre.connect(ctx.destination);
  };

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (actif) void ctx.resume();
  });

  const note = (freq: number, debut: number, duree: number, type: OscillatorType = 'sine', gain = 1) => {
    if (!ctx || !maitre) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    const t = ctx.currentTime + debut;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g).connect(maitre);
    o.start(t);
    o.stop(t + duree + 0.02);
  };

  const souffle = (duree: number) => {
    if (!ctx || !maitre) return;
    const n = Math.floor(ctx.sampleRate * duree);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / n);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 0.8;
    const t = ctx.currentTime;
    f.frequency.setValueAtTime(base * 0.6, t);
    f.frequency.exponentialRampToValueAtTime(base * 4, t + duree);
    const g = ctx.createGain();
    g.gain.value = 0.35;
    src.connect(f).connect(g).connect(maitre);
    src.start();
  };

  const son: Son = {
    actif: () => actif,
    async activer() {
      preparer();
      if (!ctx) return;
      await ctx.resume();
      actif = true;
      ecrire(true);
      prevenir();
    },
    couper() {
      actif = false;
      ecrire(false);
      nappe?.arreter();
      nappe = null;
      if (ctx) void ctx.suspend();
      prevenir();
    },
    jouer(signal) {
      if (!actif || !ctx || document.hidden) return;
      switch (signal) {
        case 'survol': {
          const maintenant = performance.now();
          if (maintenant - dernierSurvol < 90) return; // pas de rafale au balayage
          dernierSurvol = maintenant;
          note(base * 2, 0, 0.06, 'sine', 0.25);
          break;
        }
        case 'clic':
          note(base * 1.5, 0, 0.05, 'triangle', 0.5);
          break;
        case 'transition':
          souffle(0.6);
          break;
        case 'succes':
          note(base, 0, 0.25, 'sine', 0.5);
          note(base * 1.5, 0.09, 0.35, 'sine', 0.45);
          break;
        case 'erreur':
          note(base * 0.75, 0, 0.18, 'triangle', 0.4);
          note(base * 0.7, 0.1, 0.22, 'triangle', 0.35);
          break;
      }
    },
    ambiance(marche) {
      if (!marche) {
        nappe?.arreter();
        nappe = null;
        return;
      }
      if (!actif || !ctx || !maitre || nappe) return;
      const g = ctx.createGain();
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = base;
      const oscs = [0.5, 0.75, 1.0045].map((k) => {
        const o = ctx!.createOscillator();
        o.type = 'sine';
        o.frequency.value = (base / 2) * k;
        o.connect(f);
        o.start();
        return o;
      });
      f.connect(g).connect(maitre);
      nappe = {
        arreter: () => {
          if (!ctx) return;
          g.gain.cancelScheduledValues(ctx.currentTime);
          g.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
          for (const o of oscs) o.stop(ctx.currentTime + 2);
        },
      };
    },
    surChange(f) {
      abonnes.push(f);
    },
  };

  // Le choix « son activé » d'une visite précédente est retenu, mais le contexte audio ne démarre
  // qu'au premier geste du visiteur sur la page (règle des navigateurs) ; le bouton est alors repeint.
  if (lire()) {
    const premierGeste = () => {
      void son.activer();
      window.removeEventListener('pointerdown', premierGeste);
      window.removeEventListener('keydown', premierGeste);
    };
    window.addEventListener('pointerdown', premierGeste, { once: true });
    window.addEventListener('keydown', premierGeste, { once: true });
  }

  return son;
}

/**
 * Relie un bouton au son : nom fixe (« Son du site ») et état porté par aria-pressed, ce qui se lit
 * « Son du site, bouton bascule, activé » ou « … désactivé ». Le bouton se repeint à chaque changement.
 */
export function brancherBouton(bouton: HTMLButtonElement, son: Son, nom = 'Son du site') {
  const peindre = () => {
    const actif = son.actif();
    bouton.setAttribute('aria-pressed', String(actif));
    bouton.title = actif ? 'Couper le son' : 'Activer le son';
  };
  bouton.type = 'button';
  if (!bouton.textContent?.trim()) bouton.setAttribute('aria-label', nom);
  bouton.addEventListener('click', async () => {
    if (son.actif()) son.couper();
    else {
      await son.activer();
      son.jouer('clic');
    }
  });
  son.surChange(peindre);
  peindre();
  return peindre;
}
