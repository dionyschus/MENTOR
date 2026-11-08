// Variante «RADIO»: MENTOR als 50er-Jahre-Sprechermikrofon (eigener Entwurf).
// Idee aus dem Systemprompt: Der Belohnungsmodus ist ein 50er-Werbesprecher, und MENTOR hört bei
// Calls mit. Ein Studiomikrofon erzählt beides – es ist die Stimme, und es hört zu.
//  – Pillenförmiger Kopf mit Hochformat-Screen (Gentleman-Büste) und verchromten Gitterstäben
//  – Kopf in einer Gabel, von Hand neigbar (Reibungsgelenk, keine Elektromechanik)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { addMentorLabel } from './shared/label.js';

// Kopf (Breite, Höhe, Tiefe, Rundung) – Rundung so klein, dass Screen und Gitter auf der ebenen Front liegen
const HW = 96, HH = 170, HD = 52, HR = 14;
const BASE_H = 20, STEM_H = 40;

export default {
  id: 'radio',
  name: 'RADIO',
  tagline: '50er-Sprechermikrofon auf Gabelstativ',
  status: 'Entwurf',
  description:
    'MENTOR als Sprechermikrofon aus einem 50er-Radiostudio: ein pillenförmiger Chromkopf mit Screen und verchromten Gitterstäben, gelagert in einer Gabel. Der Kopf lässt sich von Hand neigen, wie bei einem echten Studiomikrofon.',
  pros: [],
  cons: [],
  sketch: null,
  defaults: { finish: 'chrome', color: '#f4f4f4', accent: 'black', palette: 'holo' },
  printing: {
    requirements: [
      `<b>Kopf</b> ${HW} × ${HH} × ${HD} mm als zwei Schalen (vorne/hinten), <b>Fuss</b> Ø130 mm, <b>Gabel</b> und Stiel separat – alles passt einzeln auf den X2D, keine Stützen ausser an der Gabel (dort mit Trennschicht der zweiten Düse).`,
      '<b>Elektronik als ein Modul im Kopf:</b> Arduino GIGA R1 mit aufgestecktem GIGA Display Shield (Screen 52 × 86 mm, hochkant) – offizielle Arduino-Hardware, kein Fremd-Display nötig.',
      '<b>Akustik:</b> Lautsprecher Ø40 hinter den Chromstäben, Mikrofon (MAX9814) seitlich im Gitter, mit Gummi vom Lautsprecher entkoppelt.',
      '<b>Gelenk:</b> Kopf von Hand neigbar über ein Reibungsgelenk (Achse mit Federscheibe oder Rändelschraube) – keine Elektromechanik. Kabel durch eine hohle Achse (Messingrohr Ø6) und den Stiel in den Fuss.',
      '<b>Stand:</b> Stahl-Ballast (Unterlegscheiben) im Fuss, USB-C hinten am Fuss.',
    ],
    pros: [
      '<b>Story auf einen Blick:</b> Studiomikrofon = 50er-Werbesprecher + Lauscher, der bei jedem Call mithört',
      '<b>Einfache Mechanik:</b> kein Servo, keine Motorsteuerung – weniger Fehlerquellen und kein Geräusch in Calls',
      'Kopf lässt sich von Hand auf die Sitzhöhe des Nutzers ausrichten',
      '<b>Gut umsetzbar:</b> GIGA R1 + Display Shield als fertiges Modul, einfache Druckteile, viel Platz im Kopf',
      'Grosser Hochformat-Screen – die Gentleman-Büste ist auch aus Distanz lesbar',
      '<b>Zwei Düsen:</b> schwarzer Gittergrund und Chromstäbe der Front in einem Druck – nur die Stäbe werden verchromt',
      '<b>X2D-Kammer (65 °C):</b> ASA/ABS druckbar – mit Aceton-Dampf geglättet, braucht die Oberfläche viel weniger Schleifen vor dem Chrom',
    ],
    challenges: [
      '<b>Kabel durch das Gelenk:</b> genug Schlaufe lassen bzw. hohle Achse, damit es beim Neigen nicht knickt',
      '<b>Reibungsgelenk</b> muss den schweren Kopf in jeder Lage halten – Federscheibe/Rändelschraube testen',
      '<b>Schwerer Kopf auf dünnem Stiel:</b> Ballast im Fuss und steife Gabel nötig',
      'Die Chromstäbe einzeln schleifen und polieren ist Fleissarbeit – als Teil der Frontschale drucken',
    ],
  },

  build({ mats, createFace, makeHW, geo }) {
    const root = new THREE.Group();

    // ---------- Fuss + Stiel ----------
    root.add(geo.part(new THREE.CylinderGeometry(62, 62, 3, 96), mats.dark, { position: [0, 1.5, 0] }));          // Gummiring
    root.add(geo.part(new THREE.CylinderGeometry(54, 64, BASE_H - 3, 96), mats.case, { position: [0, 3 + (BASE_H - 3) / 2, 0], name: 'Fuss' }));
    root.add(geo.part(new THREE.TorusGeometry(54, 2.5, 16, 96), mats.case, { position: [0, BASE_H, 0], rotation: [Math.PI / 2, 0, 0] }));
    root.add(geo.part(new THREE.CylinderGeometry(7, 9, STEM_H, 32), mats.case, { position: [0, BASE_H + STEM_H / 2, 0], explode: [0, 10, 0] }));

    // ---------- Gabel ----------
    const barY = BASE_H + STEM_H + 4;
    const pivotY = barY + 4 + HH / 2 + 10;
    const armX = HW / 2 + 7;                 // Arm-Innenseite 3 mm neben dem Kopf
    const fork = geo.group({ explode: [0, 20, 0] });
    fork.add(geo.part(new RoundedBoxGeometry(armX * 2 + 8, 8, 18, 3, 3), mats.case, { position: [0, barY, 0] }));
    for (const sx of [-1, 1]) {
      fork.add(geo.part(new RoundedBoxGeometry(8, pivotY - barY + 8, 18, 3, 3), mats.case, { position: [sx * armX, (barY + pivotY) / 2, 0] }));
      fork.add(geo.part(new THREE.CylinderGeometry(10, 10, 6, 40), mats.case, { position: [sx * (armX + 5), pivotY, 0], rotation: [0, 0, Math.PI / 2] }));
      fork.add(geo.part(new THREE.CylinderGeometry(4, 4, 6.4, 24), mats.dark, { position: [sx * (armX + 5), pivotY, 0], rotation: [0, 0, Math.PI / 2] }));
    }
    root.add(fork);

    // ---------- Kopf (dreht um die Gabelachse) ----------
    const head = geo.group({ position: [0, pivotY, 0], explode: [0, 50, 0], name: 'Kopf' });
    head.add(geo.part(new RoundedBoxGeometry(HW, HH, HD, 8, HR), mats.case));
    // Lagernaben links/rechts: füllen den Spalt zum Gabelarm, Achse läuft durch
    for (const sx of [-1, 1]) {
      head.add(geo.part(new THREE.CylinderGeometry(11, 11, 3.2, 40), mats.case, { position: [sx * (HW / 2 + 1.5), 0, 0], rotation: [0, 0, Math.PI / 2] }));
    }
    head.add(geo.part(new THREE.CylinderGeometry(3, 3, armX * 2 + 14, 24), mats.case, { rotation: [0, 0, Math.PI / 2] }));
    const front = HD / 2;

    // Screen (Hochformat) in schwarzer Glasfläche
    const SW = 52, SH = 86, scrY = 20;
    head.add(geo.part(new RoundedBoxGeometry(SW + 10, SH + 10, 1.6, 2, 6), mats.dark, { position: [0, scrY, front + 0.2] }));
    const tex = createFace({ aspect: SW / SH, style: 'bust' });
    head.add(geo.part(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), { position: [0, scrY, front + 1.05] }));
    head.add(geo.part(new THREE.PlaneGeometry(SW + 8, SH + 8), mats.glass, { position: [0, scrY, front + 1.2] }));

    // Mikrofongitter: verchromte Querstäbe auf schwarzem Grund
    const grY = -48;
    head.add(geo.part(new RoundedBoxGeometry(62, 38, 1, 2, 5), mats.dark, { position: [0, grY, front + 0.1] }));
    for (let i = 0; i < 6; i++) {
      head.add(geo.part(new RoundedBoxGeometry(64, 3.2, 3.2, 2, 1.4), mats.case, { position: [0, grY - 15 + i * 6, front + 1.2] }));
    }

    // Schriftzug hinten, dezent
    addMentorLabel(head, mats.case, { position: [0, -40, -front - 0.2], rotation: [0, Math.PI, 0], size: 6.5, depth: 0.8 });

    // Hardware im Kopf: GIGA R1 + Display Shield als Stapel, Lautsprecher hinter dem Gitter
    head.add(makeHW('gigaDisplay', { position: [0, scrY, front - 6], rotation: [0, Math.PI / 2, Math.PI / 2] }));
    head.add(makeHW('gigaR1', { position: [0, scrY - 4, front - 20], rotation: [0, Math.PI / 2, Math.PI / 2] }));
    head.add(makeHW('speaker40', { position: [0, grY, front - 6], rotation: [Math.PI / 2, 0, 0] }));
    head.add(makeHW('mic', { position: [0, grY - 22, front - 8], rotation: [Math.PI / 2, 0, 0] }));
    root.add(head);

    root.add(makeHW('usbc', { position: [0, 10, -58] }));

    // Kopf ist statisch; der Ausdruck liegt ganz im Screen.
    return { root };
  },
};
