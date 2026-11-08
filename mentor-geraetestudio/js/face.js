// Animiertes MENTOR-Gesicht, gezeichnet in ein <canvas> und als Textur auf das Display gelegt.
// Die Modi entsprechen den [MODUS: …]-Tags aus dem Systemprompt.
import * as THREE from 'three';

export const MODES = {
  THERAPEUT: {
    label: 'Therapeut', tag: 'Grundmodus',
    eyeOpen: .78, happy: 0, smile: .35, mouthW: .9, browY: 0, browTilt: .18,
    gazeDrift: .3, gazeY: 0, glow: .85, rays: 0, talkAmp: .45,
    nodAmp: .6, nodSpeed: 1.1, pitch: .03, roll: 0, crooked: 0, blinkEvery: 4,
  },
  BELOHNUNG: {
    label: 'Belohnung', tag: '50er-Werbesprecher',
    eyeOpen: 1, happy: 1, smile: 1, mouthW: 1.25, browY: 1, browTilt: 0,
    gazeDrift: .1, gazeY: 0, glow: 1.3, rays: 1, talkAmp: .9,
    nodAmp: .35, nodSpeed: 3, pitch: -.08, roll: 0, crooked: 0, blinkEvery: 6,
  },
  ENTTAEUSCHUNG: {
    label: 'Enttäuschung', tag: 'Widerstand 2',
    eyeOpen: .55, happy: 0, smile: -.45, mouthW: .75, browY: -.3, browTilt: .6,
    gazeDrift: .12, gazeY: .6, glow: .55, rays: 0, talkAmp: .25,
    nodAmp: .15, nodSpeed: .6, pitch: .18, roll: .04, crooked: 0, blinkEvery: 3,
  },
  RISS: {
    label: 'Der Riss', tag: 'Widerstand 3',
    eyeOpen: .7, happy: 0, smile: .55, mouthW: 1, browY: -.15, browTilt: -.25,
    gazeDrift: 0, gazeY: 0, glow: .9, rays: 0, talkAmp: .35,
    nodAmp: 0, nodSpeed: 1, pitch: .02, roll: .07, crooked: .8, blinkEvery: 20,
  },
  NEUTRAL: {
    label: 'Neutral', tag: 'Rolle verlassen',
    eyeOpen: .85, happy: 0, smile: .1, mouthW: .8, browY: 0, browTilt: 0,
    gazeDrift: .2, gazeY: 0, glow: .7, rays: 0, talkAmp: .4,
    nodAmp: 0, nodSpeed: 1, pitch: 0, roll: 0, crooked: 0, blinkEvery: 4,
  },
};

// Wechsel in diese Modi passiert schlagartig («wie ein Schalter»), alle anderen blenden kurz über.
const SNAP_MODES = new Set(['BELOHNUNG', 'RISS']);

export const PALETTES = {
  holo: { label: 'Holo-Grün (Röhre)', fg: '#86ffbf', bg: '#000000' },
  amber: { label: 'Bernstein (Röhre)', fg: '#ffb54a', bg: '#0b0703' },
  cream: { label: 'Creme / Warmweiss', fg: '#fff0d2', bg: '#0b0907' },
  green: { label: 'Phosphor-Grün', fg: '#8dffb4', bg: '#030a05' },
  ice: { label: 'Eisblau', fg: '#bfe4ff', bg: '#03070b' },
};

const COLD_COLOR = '#d6eeff';

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Zustand des Gesichts – einmal global, damit alle Displays einer Variante synchron bleiben.
export class FaceController {
  constructor() {
    this.mode = 'THERAPEUT';
    this.p = { ...MODES.THERAPEUT };
    this.talking = true;
    this.palette = 'amber';
    this.t = 0;
    this.blink = 0;
    this.blinkT = 0;
    this.nextBlink = 2;
    this.glitch = 0;
    this.glance = 0;
    this.glanceDir = 1;
    this.smileHold = 0;
    this.gazeX = 0;
    this.gazeY = 0;
    this.mouthOpen = 0;
    this.nod = 0;
    this.listeners = new Set();
  }

  onChange(fn) { this.listeners.add(fn); }
  emit() { this.listeners.forEach((fn) => fn(this)); }

  setMode(mode) {
    if (!MODES[mode]) return;
    this.mode = mode;
    if (SNAP_MODES.has(mode)) this.p = { ...MODES[mode] };
    this.emit();
  }

  setTalking(on) { this.talking = on; this.emit(); }

  triggerGlitch(duration = 0.14) { this.glitch = duration; }

  // «MENTORs Augen zucken kurz zur Seite.»
  triggerGlance() {
    this.glance = 0.7;
    this.glanceDir = Math.random() < 0.5 ? -1 : 1;
  }

  // «Das Lächeln hält eine Sekunde länger als natürlich.»
  triggerSmileHold(duration = 2.6) { this.smileHold = duration; }

  get smile() { return this.smileHold > 0 ? Math.max(this.p.smile, 0.85) : this.p.smile; }

  // Kopfhaltung für Varianten mit Servo (Nicken / Neigen), in Radiant.
  get pose() {
    return { pitch: this.p.pitch + this.nod * 0.06, roll: this.p.roll };
  }

  update(dt) {
    this.t += dt;
    const t = this.t;
    const target = MODES[this.mode];
    const k = 1 - Math.exp(-dt * 7);
    for (const key in target) {
      if (typeof target[key] === 'number') this.p[key] += (target[key] - this.p[key]) * k;
    }
    const p = this.p;
    const staring = this.smileHold > 0;

    // Blinzeln
    this.nextBlink -= dt;
    if (this.nextBlink <= 0 && !staring) {
      this.blinkT = 0.16;
      this.nextBlink = p.blinkEvery * (0.6 + Math.random() * 0.8);
    }
    if (this.blinkT > 0) {
      this.blinkT -= dt;
      this.blink = Math.sin((Math.max(0, this.blinkT) / 0.16) * Math.PI);
    } else this.blink = 0;

    // Blickrichtung
    let gx = (Math.sin(t * 0.7) + Math.sin(t * 1.9 + 1) * 0.5) * 0.4 * p.gazeDrift;
    let gy = Math.sin(t * 0.5 + 2) * 0.2 * p.gazeDrift + p.gazeY;
    if (staring) { gx = 0; gy = 0; }
    if (this.glance > 0) {
      this.glance -= dt;
      this.gazeX = this.glanceDir * 0.95;
      this.gazeY = 0.05;
    } else {
      const kg = 1 - Math.exp(-dt * 8);
      this.gazeX += (gx - this.gazeX) * kg;
      this.gazeY += (gy - this.gazeY) * kg;
    }

    // Mund beim Sprechen (Pseudo-Lipsync mit Pausen)
    const inPhrase = Math.sin(t * 1.3) > -0.45;
    const talkTarget = this.talking && !staring && inPhrase
      ? p.talkAmp * (0.3 + 0.7 * Math.abs(Math.sin(t * 9.3) * Math.sin(t * 4.1 + 0.5)))
      : 0;
    this.mouthOpen += (talkTarget - this.mouthOpen) * (1 - Math.exp(-dt * 20));

    // Langsames, verständnisvolles Nicken
    this.nod = Math.sin(t * p.nodSpeed * 2) * p.nodAmp;

    if (this.smileHold > 0) this.smileHold -= dt;
    if (this.glitch > 0) this.glitch -= dt;
    if (this.mode === 'RISS' && Math.random() < dt * 0.35) this.triggerGlitch();
  }
}

// Ein Display. Jede Variante erzeugt so viele davon, wie sie Bildschirme hat.
// style: 'face' = nur Gesicht, 'bust' = Gentleman-Büste mit Anzug (für Hochformat/Hologramm)
// holo: true = Hologramm-Effekte (rollender Lichtbalken, Ausblenden nach unten)
export class FaceScreen {
  constructor({ aspect = 1, res = 512, round = false, style = 'face', holo = false } = {}) {
    this.w = Math.round(aspect >= 1 ? res * aspect : res);
    this.h = Math.round(aspect >= 1 ? res : res / aspect);
    this.round = round;
    this.style = style;
    this.holo = holo;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
  }

  dispose() { this.texture.dispose(); }

  render(c) {
    const { ctx, w, h } = this;
    const s = Math.min(w, h);
    const cx = w / 2;
    const cy = (this.style === 'bust' ? h * 0.33 : h / 2) + c.nod * s * 0.012;
    const pal = PALETTES[c.palette];
    const p = c.p;

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, w, h);

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.62);
    g.addColorStop(0, rgba(pal.fg, 0.17 * p.glow));
    g.addColorStop(1, rgba(pal.fg, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Strahlenkranz im Belohnungsmodus (50er-Werbeplakat)
    if (p.rays > 0.02) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(c.t * 0.25);
      ctx.fillStyle = rgba(pal.fg, 0.1 * p.rays);
      const n = 16;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, Math.max(w, h), a, a + Math.PI / n);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    this.drawCharacter(cx, cy, s, c, pal, false);

    // Glitch: für wenige Frames der kalte Ausdruck, mit verschobenen Bildzeilen
    if (c.glitch > 0) {
      ctx.fillStyle = rgba(pal.bg, 0.88);
      ctx.fillRect(0, 0, w, h);
      this.drawCharacter(cx, cy, s, c, pal, true);
      for (let i = 0; i < 6; i++) {
        const y = Math.random() * h;
        const hh = Math.random() * s * 0.07 + 2;
        const dx = (Math.random() - 0.5) * s * 0.18;
        ctx.drawImage(this.canvas, 0, y, w, hh, dx, y, w, hh);
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,30,60,.12)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Scanlines + Vignette
    ctx.fillStyle = 'rgba(0,0,0,.26)';
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);
    const v = ctx.createRadialGradient(cx, h / 2, s * (this.round ? 0.3 : 0.38), w / 2, h / 2, Math.hypot(w, h) * (this.round ? 0.36 : 0.55));
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,.7)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);

    if (this.holo) {
      // Rollender Lichtbalken
      const by = ((c.t * 140) % (h + 160)) - 80;
      const band = ctx.createLinearGradient(0, by - 50, 0, by + 50);
      band.addColorStop(0, rgba(pal.fg, 0));
      band.addColorStop(0.5, rgba(pal.fg, 0.1));
      band.addColorStop(1, rgba(pal.fg, 0));
      ctx.fillStyle = band;
      ctx.fillRect(0, by - 50, w, 100);
      // Projektion läuft nach unten und zu den Rändern aus
      const fade = ctx.createLinearGradient(0, h * 0.72, 0, h);
      fade.addColorStop(0, 'rgba(0,0,0,0)');
      fade.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, w, h);
    }

    this.texture.needsUpdate = true;
  }

  drawCharacter(cx, cy, s, c, pal, cold) {
    if (this.style !== 'bust') {
      this.drawFace(cx, cy, s, c, pal, cold);
      return;
    }
    const fs = this.w / 1.3;
    this.drawBust(cx, cy, fs, c, pal, cold);
    this.drawFace(cx, cy, fs * 0.9, c, pal, cold);
  }

  // Retro-Gentleman: Kopfumriss, zurückgekämmtes Haar, Anzug mit Revers und schmaler Krawatte.
  // Koordinaten in Einheiten von fs relativ zur Kopfmitte.
  drawBust(cx, cy, fs, c, pal, cold) {
    const { ctx } = this;
    const color = cold ? COLD_COLOR : pal.fg;
    const X = (x) => cx + x * fs;
    const Y = (y) => cy + y * fs;
    const line = (pts) => {
      ctx.beginPath();
      ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(X(pts[i][0]), Y(pts[i][1]));
    };

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = fs * 0.03 * c.p.glow;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = fs * 0.016;

    // Hals
    line([[-0.11, 0.33], [-0.12, 0.5]]); ctx.stroke();
    line([[0.11, 0.33], [0.12, 0.5]]); ctx.stroke();

    // Anzug: Schultern und Revers
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(X(sd * 0.12), Y(0.5));
      ctx.quadraticCurveTo(X(sd * 0.5), Y(0.52), X(sd * 0.6), Y(0.7));
      ctx.lineTo(X(sd * 0.66), Y(1.25));
      ctx.stroke();
      line([[sd * 0.12, 0.5], [sd * 0.26, 0.74], [sd * 0.17, 0.8], [sd * 0.04, 1.12]]); ctx.stroke();
    }
    // Hemdkragen
    line([[-0.12, 0.47], [-0.03, 0.6], [0, 0.56], [0.03, 0.6], [0.12, 0.47]]); ctx.stroke();
    // Krawatte
    ctx.globalAlpha = 0.85;
    line([[-0.03, 0.6], [0.03, 0.6], [0.022, 0.66], [-0.022, 0.66]]); ctx.closePath(); ctx.fill();
    line([[-0.022, 0.67], [0.022, 0.67], [0.045, 1.0], [0, 1.06], [-0.045, 1.0]]); ctx.closePath(); ctx.fill();
    // Einstecktuch
    line([[0.3, 0.86], [0.42, 0.86], [0.38, 0.8], [0.35, 0.84], [0.33, 0.79]]); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;

    // Kopf + Ohren
    ctx.beginPath();
    ctx.ellipse(cx, cy, fs * 0.3, fs * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(X(sd * 0.3), Y(0.0), fs * 0.035, fs * 0.07, 0, sd > 0 ? -Math.PI / 2 : Math.PI / 2, sd > 0 ? Math.PI / 2 : Math.PI * 1.5);
      ctx.stroke();
    }

    // Zurückgekämmtes Haar mit Seitenscheitel
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(X(-0.3), Y(-0.04));
    ctx.bezierCurveTo(X(-0.33), Y(-0.36), X(-0.12), Y(-0.48), X(0.04), Y(-0.46));
    ctx.bezierCurveTo(X(0.24), Y(-0.44), X(0.34), Y(-0.3), X(0.3), Y(-0.04));
    ctx.bezierCurveTo(X(0.27), Y(-0.16), X(0.22), Y(-0.26), X(0.1), Y(-0.28));
    ctx.bezierCurveTo(X(-0.02), Y(-0.3), X(-0.16), Y(-0.24), X(-0.24), Y(-0.2));
    ctx.quadraticCurveTo(X(-0.28), Y(-0.14), X(-0.3), Y(-0.04));
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = fs * 0.01;
    for (const o of [0, 0.05, 0.1]) {
      ctx.beginPath();
      ctx.moveTo(X(-0.16 + o), Y(-0.29 + o * 0.2));
      ctx.quadraticCurveTo(X(0.0 + o), Y(-0.44), X(0.2 + o * 0.4), Y(-0.36 + o));
      ctx.stroke();
    }

    // Nase + Altersfältchen
    ctx.lineWidth = fs * 0.012;
    line([[0.005, -0.03], [-0.03, 0.08], [0.01, 0.09]]); ctx.stroke();
    for (const sd of [-1, 1]) {
      line([[sd * 0.235, -0.05], [sd * 0.265, -0.07]]); ctx.stroke();
      line([[sd * 0.235, -0.03], [sd * 0.262, -0.03]]); ctx.stroke();
    }
    ctx.restore();
  }

  drawFace(cx, cy, s, c, pal, cold) {
    const { ctx } = this;
    const p = c.p;
    const color = cold ? COLD_COLOR : pal.fg;
    const open = cold ? 0.32 : p.eyeOpen;
    const happy = cold ? 0 : p.happy;
    const smile = cold ? -0.05 : c.smile;
    const browY = cold ? -0.4 : p.browY;
    const browTilt = cold ? -0.7 : p.browTilt;
    const crooked = cold ? 0 : p.crooked;
    const gazeX = cold ? 0 : c.gazeX;
    const gazeY = cold ? 0 : c.gazeY;
    const mouthOpen = cold ? 0 : c.mouthOpen;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = s * 0.035 * p.glow;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const eyeY = cy - s * 0.07;
    const eyeDX = s * 0.165;
    const er = s * 0.072;

    for (const side of [-1, 1]) {
      const ex = cx + side * eyeDX;
      const o = Math.max(0.05, open * (1 - c.blink));

      if (happy < 0.99) {
        ctx.globalAlpha = 1 - happy;
        ctx.beginPath();
        ctx.ellipse(ex, eyeY, er, er * o, 0, 0, Math.PI * 2);
        ctx.fill();
        // Pupille, auf das Auge zugeschnitten
        ctx.save();
        ctx.clip();
        ctx.shadowBlur = 0;
        ctx.fillStyle = pal.bg;
        ctx.beginPath();
        ctx.arc(ex + gazeX * er * 0.5, eyeY + gazeY * er * 0.4, er * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (happy > 0.01) {
        ctx.globalAlpha = happy;
        ctx.lineWidth = s * 0.032;
        ctx.beginPath();
        ctx.arc(ex, eyeY + er * 0.45, er * 0.85, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Augenbrauen
      const by = eyeY - er - s * 0.06 - browY * s * 0.03;
      const innerX = ex - side * er * 0.95;
      const outerX = ex + side * er * 0.95;
      const innerY = by - browTilt * s * 0.035;
      const outerY = by + browTilt * s * 0.012;
      ctx.lineWidth = s * 0.022;
      ctx.beginPath();
      ctx.moveTo(innerX, innerY);
      ctx.quadraticCurveTo(ex, Math.min(innerY, outerY) - s * 0.012, outerX, outerY);
      ctx.stroke();
    }

    // Mund
    const my = cy + s * 0.17;
    const mw = s * 0.15 * p.mouthW;
    const cornerY = my - smile * s * 0.045;
    const lx = cx - mw, rx = cx + mw;
    const ly = cornerY + crooked * s * 0.012;
    const ry = cornerY - crooked * s * 0.045;
    const ctrlY = my + smile * s * 0.06;
    const openPx = mouthOpen * s * 0.09 + happy * s * 0.035;

    if (openPx < s * 0.008) {
      ctx.lineWidth = s * 0.024;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.quadraticCurveTo(cx + crooked * mw * 0.3, ctrlY, rx, ry);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.quadraticCurveTo(cx, ctrlY - openPx * 0.2, rx, ry);
      ctx.quadraticCurveTo(cx, ctrlY + openPx, lx, ly);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
