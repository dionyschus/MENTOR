// Screen V2 – «LEMONADE»: gerippter Tropfenkopf in poliertem Chrom auf drei Spinnenbeinen,
// angelehnt an die ikonische Designer-Zitronenpresse. Runder Screen vorne im Kopf.
// Skizze: skizzen/screen-varianten.jpg (unten), Referenz: Zitronenpresse.png
//
// Proportionen der Referenz (Gesamthöhe ≙ 290 mm):
//  – Kopf ca. 48 % der Höhe, am breitesten im oberen Viertel, unten voll und erst zuletzt spitz
//  – glatte, polierte Oberfläche (bewusst ohne Rippen: erinnert an die Presse, ist aber keine)
//  – Beine treten bei ca. 63 % Höhe aus, steigen zur spitzen Knie-Ecke (≈ 74 %) und fallen konvex zum Tisch
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { addMentorLabel } from './shared/label.js';

const TOTAL_H = 290;
const HEAD_L = 140;               // Länge Kopf (Spitze → Scheitel)
const TIP_Y = TOTAL_H - HEAD_L;   // Höhe der Spitze
const R = 36;                     // grösster Radius
const T_W = 0.78;                 // Lage der breitesten Stelle (0 = Spitze, 1 = Scheitel)
// Radius des Kopfs an relativer Höhe t
function radiusAt(t) {
  if (t <= 0) return 0;
  if (t < T_W) return R * Math.pow(Math.sin((Math.PI / 2) * (t / T_W)), 0.95);   // voller Bauch, erst unten spitz
  const u = Math.min(1, (t - T_W) / (1 - T_W));
  return R * Math.pow(Math.max(0, 1 - Math.pow(u, 1.8)), 0.75);   // Geschossform oben
}


// Bein als Umriss in seiner Ebene (x = radial nach aussen, y = hoch), mit Materialstärke und
// gerundeten Kanten wie ein Gussteil. Aussen spitze Knie-Ecke, innen weiche Rundung,
// Breite läuft zum Fuss aus. Masse in mm.
const KNEE = new THREE.Vector2(60, 213);   // spitze Knie-Ecke aussen
const FOOT_R = 110;                        // Fussabstand von der Mitte (≈ 3 × Kopfradius, wie Referenz)
const ARM_W = 9, LEG_W = 9.4, FOOT_W = 3.2;

function legShape() {
  const P0 = new THREE.Vector2(0, 181);                                   // Oberkante Oberarm (im Kopf)
  const up = KNEE.clone().sub(P0).normalize();                            // Richtung Oberarm
  const down = new THREE.Vector2(0.36, -1).normalize();                   // Startrichtung Unterschenkel
  const nUp = new THREE.Vector2(up.y, -up.x);                             // Unterseite Oberarm
  const nDown = new THREE.Vector2(-down.y, down.x);                       // Aussenseite Unterschenkel
  const along = (p, d, x) => p.clone().addScaledVector(d, (x - p.x) / d.x); // Punkt auf Gerade bei gegebenem x

  const outerFoot = FOOT_R + FOOT_W / 2, innerFoot = FOOT_R - FOOT_W / 2;
  const cOuter = along(KNEE, down, outerFoot);                            // → unten senkrecht = konvex

  // Innenkante: parallel zur Aussenkante, trifft die Unterseite des Oberarms
  const inner0 = KNEE.clone().addScaledVector(nDown, -LEG_W);
  const under0 = P0.clone().addScaledVector(nUp, ARM_W);
  const det = down.x * -up.y - down.y * -up.x;
  const q = ((under0.x - inner0.x) * -up.y - (under0.y - inner0.y) * -up.x) / det;
  const X = inner0.clone().addScaledVector(down, q);                      // innere Ecke
  const I2 = X.clone().addScaledVector(down, 8);
  const J2 = X.clone().addScaledVector(up, -8);
  const cInner = along(I2, down, innerFoot);

  const s = new THREE.Shape();
  s.moveTo(P0.x, P0.y);
  s.lineTo(KNEE.x, KNEE.y);
  s.quadraticCurveTo(cOuter.x, cOuter.y, outerFoot, 0.5);
  s.quadraticCurveTo(FOOT_R, -1.2, innerFoot, 0.5);                      // abgerundeter Fuss
  s.quadraticCurveTo(cInner.x, cInner.y, I2.x, I2.y);
  s.quadraticCurveTo(X.x, X.y, J2.x, J2.y);                              // weiche Rundung innen im Knie
  s.lineTo(under0.x, under0.y);
  s.lineTo(0, under0.y - 2);
  s.closePath();
  return s;
}

function legGeometry() {
  const DEPTH = 3.2, BT = 2.4, BS = 1.2;
  let g = new THREE.ExtrudeGeometry(legShape(), {
    depth: DEPTH, bevelEnabled: true, bevelThickness: BT, bevelSize: BS, bevelOffset: -BS,
    bevelSegments: 6, curveSegments: 48,
  });
  g.translate(0, 0, -DEPTH / 2);
  // Materialstärke quer zur Beinebene: am Knie ~8 mm, zum Fuss hin halb so dick
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const f = THREE.MathUtils.lerp(0.5, 1, THREE.MathUtils.clamp(pos.getY(i) / 200, 0, 1));
    pos.setZ(i, pos.getZ(i) * f);
  }
  // Nähte verschmelzen → durchgehend weiche Schattierung (wichtig für Chrom)
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g, 0.01);
  g.computeVertexNormals();
  return g;
}

export default {
  id: 'lemonade',
  name: 'LEMONADE',
  tagline: 'Gerippter Tropfenkopf auf drei Spinnenbeinen',
  status: 'Entwurf',
  description:
    'Ein glatter Tropfenkopf in poliertem Chrom, getragen von drei langen Spinnenbeinen. Vorne im Kopf sitzt der flache, runde Screen wie ein Uhrglas in einer Chrom-Lünette, eingebettet in eine ebene Sitzfläche. Lautsprecher und Mikrofon hören durch feine Löcher unter dem Screen.',
  pros: [
    'Skulpturale, ikonische Silhouette – wirkt wie ein Designobjekt, nicht wie Technik',
    'Rundes Display = Gesicht, kein Bildschirm',
    'Insektenhafte Beine geben der freundlichen Figur etwas Unheimliches',
  ],
  cons: [
    'Grosse gewölbte Spiegelchrom-Fläche: jede Unebenheit im Druck wird sichtbar, viel Schleifarbeit',
    'Wenig Platz im Kopf: rundes Display (~2") und kompakte Elektronik müssen eng verbaut werden',
    'Kopf sitzt hoch, Beine müssen steif und sauber verbunden sein',
  ],
  sketch: 'skizzen/screen-varianten.jpg',
  defaults: { finish: 'chrome', color: '#f4f4f4', accent: 'black', palette: 'holo' },
  printing: {
    requirements: [
      '<b>Gesamthöhe 290 mm</b> – zu hoch für einen Druck am Stück (Bauraum 256 mm). Kopf und Beine werden getrennt gedruckt.',
      '<b>Beine</b> (ca. 213 mm hoch) liegen flach in einer Ebene → flach aufs Bett, ohne Stützen, maximal stabil.',
      '<b>Kopf</b> (140 × Ø72 mm) in zwei Teilen: obere Kuppe mit Screen und untere Spitze, auf Höhe der Beinansätze getrennt; Spitze mit Stützen drucken.',
      '<b>Innenraum</b> sehr eng: rundes Display (Ø41 sichtbar → 1.8–2.1"-Klasse, meist ESP32-S3-basiert), Nano ESP32, Lautsprecher Ø20 und Mikrofon hinter dem Lochfeld.',
      '<b>Verbindung</b> Beine–Kopf mit Steckzapfen und Schrauben/Gewindeeinsätzen; Kabel durch einen Kanal (ca. 4 mm) in einem Bein.',
      '<b>Display:</b> Flaches Rund-Display liegt plan in der Lünette; die ebene Sitzfläche ist bereits im Kopf modelliert.',
    ],
    pros: [
      'Skulpturale Silhouette – wirkt wie ein Designobjekt, nicht wie Technik',
      'Beine flach gedruckt = einfach, stabil, ohne Stützen',
      'Rundes Display liest sich sofort als Gesicht',
    ],
    challenges: [
      '<b>Zu hoch für einen Druck</b> – Fugen zwischen Kopfteilen und an den Beinansätzen müssen beim Verchromen verschwinden',
      '<b>Grosse gewölbte Spiegelfläche:</b> Druckschichten auf der Rundung sehr sichtbar, aufwendigstes Schleifen aller Varianten',
      'Sehr wenig Platz im Kopf für Display, Board, Lautsprecher und Kabel',
      'Kopf sitzt hoch auf dünnen Beinen – Steifigkeit und Kippsicherheit testen',
      'Arduino-taugliches rundes 2"-Display mit genug Leistung für Animationen wählen',
    ],
  },

  build({ mats, createFace, makeHW, geo }) {
    const root = new THREE.Group();

    // ---------- Kopf ----------
    const profile = [];
    const STEPS = 180;
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      profile.push(new THREE.Vector2(Math.max(radiusAt(t), 0.001), t * HEAD_L));
    }
    const headGeo = new THREE.LatheGeometry(profile, 256);

    // Screen-Position: knapp unter der breitesten Stelle, vorne (+Z)
    const SCR_R = 20.5;                     // Ø41 → rundes Display der 1.8–2.1"-Klasse (flach wie ein Uhrglas)
    const RING_R = SCR_R + 1.6;             // flache Chrom-Lünette
    const scrLocalY = T_W * HEAD_L - 8;
    // Kopfoberfläche an Position x / lokaler Höhe y
    const surfaceZ = (x, y) => Math.sqrt(Math.max(0, radiusAt(y / HEAD_L) ** 2 - x * x));

    // Ebene Sitzfläche für das flache Display: Höhe zwischen Kopfmitte und tiefstem Randpunkt,
    // damit die Fläche weder als Krater einsinkt noch vorsteht. Rundum weicher Übergang in die Kopfform.
    let ringMin = Infinity;
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      ringMin = Math.min(ringMin, surfaceZ(Math.cos(a) * RING_R, scrLocalY + Math.sin(a) * RING_R));
    }
    const flatZ = (surfaceZ(0, scrLocalY) + ringMin) / 2;
    const BLEND = 12;                        // Breite des weichen Übergangs (mm)
    const pos = headGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      if (z <= 0) continue;
      const d = Math.hypot(pos.getX(i), pos.getY(i) - scrLocalY);
      const w = 1 - THREE.MathUtils.smoothstep(d, RING_R + 1.5, RING_R + 1.5 + BLEND);
      pos.setZ(i, THREE.MathUtils.lerp(z, flatZ, w));
    }
    headGeo.computeVertexNormals();
    root.add(geo.part(headGeo, mats.case, { position: [0, TIP_Y, 0], name: 'Kopf' }));

    // ---------- Runder, flacher Screen in Lünette (wie ein Uhrglas) ----------
    const scrY = TIP_Y + scrLocalY;
    const screen = geo.group({ position: [0, scrY, flatZ], explode: [0, 0, 30] });
    screen.add(geo.part(geo.ringGeometry(RING_R, SCR_R, 0.8, 0.4), mats.case));
    const tex = createFace({ aspect: 1, round: true, res: 384 });
    screen.add(geo.part(new THREE.CircleGeometry(SCR_R, 96),
      new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }), { position: [0, 0, 0.3] }));
    screen.add(geo.part(new THREE.CircleGeometry(SCR_R, 96), mats.glass, { position: [0, 0, 0.6] }));
    root.add(screen);

    // ---------- Schriftzug hinten: klein, Ton in Ton, folgt der Wölbung ----------
    addMentorLabel(root, mats.case, {
      position: [0, scrY, 0], rotation: [0, Math.PI, 0], size: 4.5, depth: 0.5,
      conform: (x, y) => surfaceZ(x, scrLocalY + y) - 0.15,
    });

    // ---------- Lochfeld unter dem Screen (Lautsprecher + Mikrofon) ----------
    const holeSpots = [];
    for (const g of [-1.5, -0.5, 0.5, 1.5]) {
      const th = g * 0.2;                              // Spalten im Winkelabstand von ~11°
      for (let j = 0; j < 4; j++) {
        const y = scrY - RING_R - 10 - j * 6;
        const r = radiusAt((y - TIP_Y) / HEAD_L);
        holeSpots.push([th, y, r]);
      }
    }
    const holes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.9, 0.9, 2, 10), mats.dark, holeSpots.length);
    const m = new THREE.Matrix4();
    holeSpots.forEach(([th, y, r], i) => {
      m.makeRotationFromEuler(new THREE.Euler(Math.PI / 2, th, 0, 'YXZ'));
      m.setPosition(Math.sin(th) * (r - 0.6), y, Math.cos(th) * (r - 0.6));
      holes.setMatrixAt(i, m);
    });
    root.add(holes);

    // ---------- Drei Spinnenbeine ----------
    // Oberarm steigt aus dem Kopf zur spitzen Knie-Ecke, Unterschenkel konvex zum Tisch.
    const legGeo = legGeometry();
    for (const deg of [180, 60, -60]) {
      const a = THREE.MathUtils.degToRad(deg);
      const leg = geo.part(legGeo, mats.case, {
        rotation: [0, a - Math.PI / 2, 0],             // lokales +x zeigt radial nach aussen
        explode: [Math.sin(a) * 35, -15, Math.cos(a) * 35],
      });
      root.add(leg);
    }

    // ---------- Hardware ----------
    root.add(makeHW('round21', { position: [0, scrY, flatZ - 5], rotation: [Math.PI / 2, 0, 0] }));
    root.add(makeHW('nanoEsp32', { position: [0, scrY - 2, -8], rotation: [0, 0, Math.PI / 2] }));
    root.add(makeHW('speaker20', { position: [0, scrY - RING_R - 18, 14], rotation: [Math.PI / 2, 0, 0] }));
    root.add(makeHW('mic', { position: [0, scrY + 20, 0], rotation: [Math.PI / 2, 0, 0] }));
    root.add(makeHW('usbc', { position: [0, 6, -FOOT_R] }));

    // Skulptur bleibt ruhig – der Ausdruck liegt ganz im Screen.
    return { root };
  },
};
