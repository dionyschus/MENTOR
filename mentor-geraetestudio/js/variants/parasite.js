// Holo V2 – «Parasite»: abgerundeter Chrom-Sockel mit Glasprisma, getragen von vier runden Beinen mit spitzen Enden.
// Skizze: skizzen/holo-varianten.jpg (unten)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { buildHoloPrism, hatchMaterial } from './shared/holo-prism.js';
import { addMentorLabel } from './shared/label.js';

// ---------- Sockel + Beinansätze als eine verschmolzene Form ----------
// Signed-Distance-Felder (mm): negativ = innen. Glatte Vereinigung (smin) erzeugt die Hohlkehle
// zwischen Sockel und Bein. Das Feld wird per Marching Cubes in ein Mesh verwandelt.
const smin = (a, b, k) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
function sdRoundBox(px, py, pz, hx, hy, hz, r) {
  const qx = Math.abs(px) - hx + r, qy = Math.abs(py) - hy + r, qz = Math.abs(pz) - hz + r;
  const ox = Math.max(qx, 0), oy = Math.max(qy, 0), oz = Math.max(qz, 0);
  return Math.hypot(ox, oy, oz) + Math.min(Math.max(qx, qy, qz), 0) - r;
}
// Kette aus Kegelstümpfen (Punkte + Radien) → Abstand zur Bein-Oberfläche
function sdChain(px, py, pz, pts, rad) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const bax = b.x - a.x, bay = b.y - a.y, baz = b.z - a.z;
    const pax = px - a.x, pay = py - a.y, paz = pz - a.z;
    const h = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
    const dist = Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - (rad[i] + (rad[i + 1] - rad[i]) * h);
    if (dist < d) d = dist;
  }
  return d;
}

function fusedSockel(material, { SW, SH, SD, CR, sockelY, legs, fillet = 9, res = 150 }) {
  // Feld-Bereich: Sockel + oberer Teil der Beine
  const min = new THREE.Vector3(-SW / 2 - 12, sockelY - SH / 2 - 44, -SD / 2 - 12);
  const max = new THREE.Vector3(SW / 2 + 12, sockelY + SH / 2 + 3, SD / 2 + 12);
  const center = min.clone().add(max).multiplyScalar(0.5);
  const half = max.clone().sub(min).multiplyScalar(0.5);

  const mc = new MarchingCubes(res, material, false, false, 300000);
  mc.isolation = 0;
  const hs = mc.halfsize;
  const bboxes = legs.map(({ pts, rad }) => {
    const b = new THREE.Box3().setFromPoints(pts);
    return b.expandByScalar(Math.max(...rad) + fillet);
  });
  const p = new THREE.Vector3();
  for (let z = 0; z < res; z++) {
    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        p.set(center.x + ((x - hs) / hs) * half.x, center.y + ((y - hs) / hs) * half.y, center.z + ((z - hs) / hs) * half.z);
        let d = sdRoundBox(p.x, p.y - sockelY, p.z, SW / 2, SH / 2, SD / 2, CR);
        legs.forEach((leg, i) => {
          if (bboxes[i].containsPoint(p)) d = smin(d, sdChain(p.x, p.y, p.z, leg.pts, leg.rad), fillet);
        });
        mc.field[x + y * res + z * res * res] = -d;   // positiv = innen
      }
    }
  }
  mc.update();
  mc.position.copy(center);
  mc.scale.copy(half);
  mc.frustumCulled = false;
  return mc;
}

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
  printing: {
    requirements: [
      '<b>Masse</b> ca. 216 × 196 × 104 mm (ohne Prisma) – passt am Stück auf den X2D.',
      '<b>Druckrichtung:</b> kopfüber (Oberseite aufs Bett), Beine zeigen nach oben – Tree-Supports in Bambu Studio, mit der <b>zweiten Düse</b> als Trennschicht aus Stützmaterial (Support for PLA/PETG) – die Beinbögen lösen sich sauber.',
      '<b>Alternative:</b> Sockel und Beine getrennt drucken und mit Metallstiften verbinden; dann sieht man aber eine Fuge in der Hohlkehle.',
      '<b>Innenraum</b> nur ca. 28 mm hoch: Arduino GIGA R1 liegt flach, GIGA Display liegt unter dem Prisma, Lautsprecher Ø28 + Mikrofon hinter dem Frontgitter.',
      '<b>Prisma:</b> Acrylwürfel 110 mm mit 45°-Scheibe (wie bei PYRAMIDE), nicht gedruckt.',
      '<b>Service:</b> abnehmbare Bodenplatte zwischen den Beinen; USB-C hinten.',
    ],
    pros: [
      'Organische Form mit Hohlkehlen – wirkt wie gegossen, sehr starkes Bild',
      'Kompakt: Sockel nicht grösser als nötig',
      'Steht frei auf vier Punkten, kippsicher',
      '<b>X2D mit zwei Düsen</b> löst das schwierigste Problem dieser Form: Stützen an den Beinen lassen sich sauber ablösen',
      '<b>X2D-Kammer (65 °C):</b> ASA/ABS druckbar – mit Aceton-Dampf geglättet, braucht die Oberfläche viel weniger Schleifen vor dem Chrom',
    ],
    challenges: [
      '<b>Stützkontakt</b> an den Beinbögen: dank Trennschicht der zweiten Düse kaum Spuren, vor dem Verchromen trotzdem nachschleifen',
      '<b>Hohlkehlen</b> schwer zu schleifen (enge Rundungen) – Chrom zeigt jede Unebenheit',
      'Beinspitzen sind Schwachstellen: mindestens 4 Wände bzw. 100 % Infill in den Beinen',
      'Wenig Bauhöhe im Sockel – Kabel und Stecker sauber planen',
      'Prisma (ca. 250 g) sitzt oben: Schwerpunkt prüfen, ggf. Gewicht im Sockel',
    ],
  },

  build({ mats, createFace, makeHW, geo }) {
    const root = new THREE.Group();

    // ---------- Sockel ----------
    const C = 110;
    const SW = 170, SH = 34, SD = 150;
    const legH = 70;                 // Höhe Unterkante Sockel über dem Tisch
    const sockelY = legH + SH / 2;
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

    // ---------- Vier Beine, verschmolzen mit dem Sockel ----------
    // Jedes Bein wächst aus der unteren Hälfte einer gerundeten Ecke (oben bleibt die Ecke schlank):
    // zuerst senkrecht, dann Bogen nach aussen zur abgerundeten Spitze. Der obere Teil gehört zur
    // verschmolzenen Sockelform (mit Hohlkehle), der untere Teil ist eine Röhre, die nahtlos weiterläuft.
    const CR = 15;                                   // Eckradius des Sockels
    // Kräftige Beine: gleichmässiger Verlauf, enden in einer abgerundeten Spitze (Ø7 mm)
    const LEG_R0 = CR - 2, LEG_TIP = 3.5;
    const radiusAt = (u) => LEG_TIP + (LEG_R0 - LEG_TIP) * Math.pow(1 - u, 1.3);
    const U_TUBE = 0.3;                              // ab hier übernimmt die Röhre (unterhalb der Hohlkehle)
    const U_FIELD = 0.4;                             // bis hier reicht das Bein im Feld (Überlappung)
    const legDefs = [];
    const legs = [];
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const b = new THREE.Vector3(sx, 0, sz).normalize();      // Eckdiagonale
        const origin = new THREE.Vector3(sx * (SW / 2 - CR), sockelY, sz * (SD / 2 - CR));
        const at = (out, y) => b.clone().multiplyScalar(out).setY(y).add(origin);
        const curve = new THREE.CubicBezierCurve3(at(0, -7), at(0, -30), at(30, -52), at(54, -sockelY + LEG_TIP));

        // Feldanteil: Kette entlang der Kurve, minimal dünner als die Röhre (Röhre deckt die Naht)
        const pts = [], rad = [];
        for (let i = 0; i <= 40; i++) {
          const u = (i / 40) * U_FIELD;
          pts.push(curve.getPointAt(u));
          // ab der Übergabe wird das Feld-Bein sanft dünner und verschwindet in der Röhre
          rad.push(radiusAt(u) * (1 - 0.06 * THREE.MathUtils.smoothstep(u, U_TUBE + 0.02, U_TUBE + 0.07)));
        }
        legDefs.push({ pts, rad });

        // Röhre ab U_TUBE bis zur Spitze; dreht sich beim Zucken um ihren Ansatzpunkt
        const start = curve.getPointAt(U_TUBE);
        const sub = new THREE.Curve();
        sub.getPoint = (t, target = new THREE.Vector3()) => curve.getPointAt(U_TUBE + t * (1 - U_TUBE), target).sub(start);
        const r0 = radiusAt(U_TUBE), r1 = radiusAt(1);
        const leg = geo.group({ position: start.toArray(), explode: [sx * 25, -30, sz * 25] });
        // Röhre beginnt etwas dünner (im Ansatz versteckt) und erreicht nach wenigen mm den vollen Radius
        const sleeve = (t) => 1 - 0.08 * (1 - THREE.MathUtils.smoothstep(t, 0, 0.06));
        leg.add(geo.part(geo.taperedTube(sub, r0, r1, 120, 40, (t) => (r0 - radiusAt(U_TUBE + t * (1 - U_TUBE)) * sleeve(t)) / (r0 - r1)), mats.case));
        leg.userData.phase = (sx + 1) * 0.9 + (sz + 1) * 0.4;
        leg.add(geo.part(new THREE.SphereGeometry(LEG_TIP, 24, 16), mats.case, { position: sub.getPoint(1).toArray() }));
        root.add(leg);
        legs.push(leg);
      }
    }
    root.add(fusedSockel(mats.case, { SW, SH, SD, CR, sockelY, legs: legDefs }));

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
        const nervous = face.glitch > 0 ? 0.03 : face.mode === 'RISS' ? 0.012 : 0.004;
        legs.forEach((l) => {
          const twitch = face.glitch > 0 ? Math.random() - 0.5 : Math.sin(t * 1.7 + l.userData.phase);
          l.rotation.z = nervous * twitch;
        });
      },
    };
  },
};
