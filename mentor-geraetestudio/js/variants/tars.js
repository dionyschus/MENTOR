// Screen V1 – «TARS»: Monolith aus Metallblöcken in dunklem, gebürstetem Chrom.
// Mittelteil mit Screen, Lautsprecher und Mikrofon; zwei schmale Seitenbalken, oben gelagert
// und gegeneinander gekippt, sodass das Gerät wie ein Dreibein ausbalanciert steht.
// Skizze: skizzen/screen-varianten.jpg (oben)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { hatchMaterial } from './shared/holo-prism.js';
import { addMentorLabel } from './shared/label.js';

// Block mit horizontalen Fugen (Segment-Look). Ursprung = Mitte der Unterkante.
function segmentedBlock(geo, mats, w, h, d, joints) {
  const g = new THREE.Group();
  g.add(geo.part(new RoundedBoxGeometry(w, h, d, 2, 1.2), mats.case, { position: [0, h / 2, 0] }));
  for (const f of joints) {
    g.add(geo.part(new THREE.BoxGeometry(w + 0.3, 0.9, d + 0.3), mats.dark, { position: [0, h * f, 0] }));
  }
  return g;
}

export default {
  id: 'tars',
  name: 'TARS',
  tagline: 'Monolith mit Screen im Mittelteil',
  status: 'Entwurf',
  description:
    'Drei Metallblöcke in dunklem, gebürstetem Chrom. Der Mittelteil trägt den Screen, darunter das Gitter für Lautsprecher und Mikrofon. Die beiden schmalen Seitenbalken sind oben gelagert und gegeneinander gekippt – so steht MENTOR ausbalanciert wie ein Dreibein.',
  pros: [
    'Ruhige, monolithische Präsenz neben dem Monitor',
    'Gerade Flächen = einfach zu drucken und zu schleifen',
    'Gekippte Balken können per Servo «Gesten» machen',
  ],
  cons: [
    'Hoch und schmal: Schwerpunkt tief legen (Gewicht im Mittelteil unten)',
    'Dunkles Chrom zeigt Fingerabdrücke und Kratzer stark',
  ],
  sketch: 'skizzen/screen-varianten.jpg',
  defaults: { finish: 'dark_chrome', color: '#8d96a2', accent: 'black', palette: 'holo' },
  printing: {
    requirements: [
      '<b>Mittelteil</b> 68 × 200 × 34 mm, <b>Seitenbalken</b> 24 × ca. 200 × 24 mm – alles passt einzeln aufs Bambu-Druckbett.',
      '<b>Druckrichtung:</b> Teile liegend drucken (Front nach oben), so werden die grossen Sichtflächen am saubersten; Mittelteil als zwei Schalen (vorne/hinten), verschraubt.',
      '<b>Innenraum</b> Mittelteil ca. 64 × 30 mm: GIGA R1 (53 mm breit) passt hochkant hinter das Display; Lautsprecher Ø20 + Mikrofon hinter dem schmalen Gitter unten.',
      '<b>Display:</b> Das Screenfeld 52 × 120 mm braucht ein Streifen-Display (Bar-LCD). Mit Arduino-kompatiblem Treiber selten – Alternative: GIGA Display (52 × 86 mm) und Screen kürzer.',
      '<b>Gelenk:</b> Achse durch alle drei Blöcke (M4-Gewindestange oder Messingrohr); optional Servo für Balken-Gesten.',
      '<b>Balance:</b> Gewicht (z. B. Stahlplatte) unten im Mittelteil, damit das Dreibein sicher steht.',
    ],
    pros: [
      'Nur gerade Flächen – einfach zu drucken, zu schleifen und zu lackieren',
      'Kleine Einzelteile, Druck und Nacharbeit gut aufteilbar',
      'Gelenk ermöglicht echte Bewegung (Servo) als zusätzlicher Ausdruck',
    ],
    challenges: [
      '<b>Passendes langes Display</b> finden, das sich mit Arduino ansteuern lässt',
      '<b>Dunkles, gebürstetes Chrom</b> ist ein aufwendiges Finish (Chromlack, anschleifen, getönter Klarlack); zeigt Fingerabdrücke',
      'Schmales Gehäuse: wenig Luft für Kabel, Stecker und Wärme',
      'Hohe, schmale Form kippt leichter – Gewicht und Kippwinkel testen',
    ],
  },

  build({ mats, createFace, makeHW, geo }) {
    const root = new THREE.Group();

    const H = 200, W = 68, D = 34;     // Mittelteil
    const BW = 24, BD = 24;            // Seitenbalken
    const pivotY = H - 14;             // Lagerachse oben
    const tilt = 0.17;                 // Kippwinkel der Balken (rad)
    const joints = [0.06, 0.2, 0.93];   // Fugen ausserhalb von Screen und Gitter

    // ---------- Mittelteil ----------
    const center = segmentedBlock(geo, mats, W, H, D, joints);
    root.add(center);

    // Screen: schwarzes Glasfeld, Display darin
    const SW = 52, SH = 120, scrY = 108;
    const panel = geo.group({ position: [0, scrY, D / 2], explode: [0, 0, 30] });
    panel.add(geo.part(new RoundedBoxGeometry(SW + 8, SH + 8, 2, 2, 0.8), mats.dark, { position: [0, 0, 0.4] }));
    const tex = createFace({ aspect: SW / SH, style: 'bust' });
    panel.add(geo.part(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), { position: [0, 0, 1.45] }));
    panel.add(geo.part(new THREE.PlaneGeometry(SW + 6, SH + 6), mats.glass, { position: [0, 0, 1.7] }));
    center.add(panel);

    // Gitter für Lautsprecher + Mikrofon
    const GW = 52, GH = 12, grY = 24;
    const grille = geo.group({ position: [0, grY, D / 2], explode: [0, 0, 22] });
    grille.add(geo.part(new RoundedBoxGeometry(GW + 6, GH + 6, 1.6, 2, 0.6), mats.dark, { position: [0, 0, 0.2] }));
    grille.add(geo.part(new THREE.PlaneGeometry(GW, GH), hatchMaterial(), { position: [0, 0, 1.1] }));
    center.add(grille);

    // Schriftzug hinten im untersten Segment: Ton in Ton, nur leicht erhaben (wie bei Parasite)
    addMentorLabel(center, mats.case, { position: [0, H * (joints[0] + joints[1]) / 2, -D / 2 - 0.2], rotation: [0, Math.PI, 0], size: 6.5, depth: 0.8 });

    // ---------- Seitenbalken (oben gelagert, gegeneinander gekippt) ----------
    const barLen = pivotY / Math.cos(tilt);  // Unterkante gekippt genau auf dem Tisch
    const bars = [];
    for (const side of [-1, 1]) {
      const pivot = geo.group({ position: [side * (W / 2 + BW / 2 + 1), pivotY, 0], explode: [side * 40, 0, 0] });
      const bar = segmentedBlock(geo, mats, BW, barLen + 14, BD, [0.1, 0.55, 0.6, 0.9]);
      bar.position.y = -barLen;
      pivot.add(bar);
      // Lagerkappe aussen
      pivot.add(geo.part(new THREE.CylinderGeometry(6, 6, 2, 32), mats.dark, {
        position: [side * (BW / 2 + 1), 0, 0], rotation: [0, 0, Math.PI / 2],
      }));
      // links nach hinten, rechts nach vorne → stabiles Dreibein
      pivot.userData.baseTilt = side < 0 ? tilt : -tilt;
      pivot.rotation.x = pivot.userData.baseTilt;
      root.add(pivot);
      bars.push(pivot);
    }

    // ---------- Hardware ----------
    root.add(makeHW('barDisplay', { position: [0, scrY, D / 2 - 5] }));
    root.add(makeHW('gigaR1', { position: [0, scrY - 10, -4], rotation: [0, Math.PI / 2, Math.PI / 2] }));
    root.add(makeHW('speaker20', { position: [-12, grY, D / 2 - 5], rotation: [Math.PI / 2, 0, 0] }));
    root.add(makeHW('mic', { position: [14, grY, D / 2 - 5], rotation: [Math.PI / 2, 0, 0] }));
    root.add(makeHW('servo', { position: [W / 2 - 14, pivotY, 0] }));
    root.add(makeHW('usbc', { position: [0, 8, -D / 2 + 6] }));

    return {
      root,
      update({ t, face }) {
        // Balken «atmen» minimal mit; in der Belohnung ein kleiner Schwung
        const swing = face.mode === 'BELOHNUNG' ? 0.03 * Math.sin(t * 6) : 0.006 * Math.sin(t * 1.2);
        bars.forEach((b, i) => { b.rotation.x = b.userData.baseTilt + (i ? -swing : swing); });
      },
    };
  },
};
