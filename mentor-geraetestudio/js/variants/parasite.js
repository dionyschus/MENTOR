// Holo V2 – «Parasite»: abgerundeter Chrom-Sockel mit Glasprisma, getragen von vier runden Beinen mit spitzen Enden.
// Skizze: skizzen/holo-varianten.jpg (unten)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buildHoloPrism, hatchMaterial } from './shared/holo-prism.js';
import { addMentorLabel } from './shared/label.js';

export default {
  id: 'parasite',
  name: 'PARASITE',
  tagline: 'Chrom-Sockel auf vier Spitzbeinen',
  status: 'Entwurf',
  description:
    'Das Glasprisma mit MENTOR liegt auf einem weich abgerundeten Chrom-Sockel. Vier runde Beine mit spitzen Enden heben das Ganze an – wie ein Wesen, das auf dem Schreibtisch steht. Vorne am Sockel sitzt das Gitter-Modul für Lautsprecher und Mikrofon.',
  pros: [
    'Spitze Beine geben dem freundlichen Hologramm etwas Unheimliches',
    'Steht frei auf dem Tisch, wirkt lebendig statt wie ein Gerät',
    'Einfacher Sockel, Beine als separate Druckteile',
  ],
  cons: [
    'Spitze Beinenden: Kippstabilität und Kratzer auf dem Tisch beachten',
    'Kabel muss unauffällig durch ein Bein oder den Sockel geführt werden',
  ],
  sketch: 'skizzen/holo-varianten.jpg',
  defaults: { finish: 'chrome', color: '#f4f4f4', accent: 'black', palette: 'holo' },

  build({ mats, createFace, makeHW, geo }) {
    const root = new THREE.Group();

    // ---------- Sockel ----------
    const C = 110;
    const SW = 170, SH = 34, SD = 150;
    const legH = 70;                 // Höhe Unterkante Sockel über dem Tisch
    const sockelY = legH + SH / 2;
    root.add(geo.part(new RoundedBoxGeometry(SW, SH, SD, 8, 15), mats.case, { position: [0, sockelY, 0], name: 'Sockel' }));
    const topY = legH + SH;

    // ---------- Prisma ----------
    const prism = buildHoloPrism({ geo, createFace, makeHW, size: C });
    prism.group.position.set(0, topY, 0);
    root.add(prism.group);

    // ---------- Lautsprecher-/Mikrofon-Gitter vorne ----------
    const mod = geo.group({ position: [0, sockelY, SD / 2], explode: [0, 0, 30] });
    mod.add(geo.part(new RoundedBoxGeometry(56, 16, 6, 3, 2.5), mats.accent, { position: [0, 0, 0.5] }));
    mod.add(geo.part(new THREE.PlaneGeometry(50, 11), mats.dark, { position: [0, 0, 3.6] }));
    mod.add(geo.part(new THREE.PlaneGeometry(50, 11), hatchMaterial(), { position: [0, 0, 3.9] }));
    root.add(mod);

    // ---------- Schriftzug hinten ----------
    // Ton in Ton (Chrom auf Chrom), nur leicht erhaben → dezent
    addMentorLabel(root, mats.case, { position: [0, sockelY, -SD / 2 + 0.2], rotation: [0, Math.PI, 0], size: 6.5, depth: 0.8 });

    // ---------- Vier Beine ----------
    // Wachsen aus der Unterseite, bogen nach aussen und laufen zur Spitze auf dem Tisch zu.
    const legs = [];
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const leg = geo.group({ position: [sx * 55, legH + 4, sz * 45], explode: [sx * 25, -30, sz * 25] });
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(sx * 22, -14, sz * 18),
          new THREE.Vector3(sx * 38, -42, sz * 30),
          new THREE.Vector3(sx * 44, -legH - 4, sz * 35),
        ]);
        leg.add(geo.part(geo.taperedTube(curve, 9, 0.5, 40, 16), mats.case));
        leg.userData.phase = (sx + 1) * 0.9 + (sz + 1) * 0.4;
        root.add(leg);
        legs.push(leg);
      }
    }

    // ---------- Hardware ----------
    root.add(makeHW('gigaR1', { position: [0, sockelY - 4, -10], rotation: [0, Math.PI / 2, 0] }));
    root.add(makeHW('speaker28', { position: [-16, sockelY, SD / 2 - 12], rotation: [Math.PI / 2, 0, 0] }));
    root.add(makeHW('mic', { position: [20, sockelY, SD / 2 - 8] }));
    root.add(makeHW('usbc', { position: [0, sockelY - 6, -SD / 2 + 8] }));

    return {
      root,
      update({ t, dt, face }) {
        prism.update({ t, dt, face });
        // Beine: kaum merkliches Tasten, im Riss/Glitch ein nervöses Zucken
        const nervous = face.glitch > 0 ? 0.06 : face.mode === 'RISS' ? 0.02 : 0.006;
        legs.forEach((l) => {
          const twitch = face.glitch > 0 ? Math.random() - 0.5 : Math.sin(t * 1.7 + l.userData.phase);
          l.rotation.z = nervous * twitch;
        });
      },
    };
  },
};
