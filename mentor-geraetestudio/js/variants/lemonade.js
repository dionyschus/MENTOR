// Screen V2 – «LEMONADE»: gerippter Tropfenkopf in poliertem Chrom auf drei Spinnenbeinen,
// angelehnt an die ikonische Designer-Zitronenpresse. Runder Screen vorne im Kopf.
// Skizze: skizzen/screen-varianten.jpg (unten), Referenz: Zitronenpresse.png
//
// Proportionen der Referenz (Gesamthöhe ≙ 290 mm):
//  – Kopf ca. 48 % der Höhe, am breitesten im oberen Viertel, unten voll und erst zuletzt spitz
//  – tiefe Rippen mit scharfen Graten, die zur Spitze zusammenlaufen
//  – Beine treten bei ca. 63 % Höhe aus, steigen zur spitzen Knie-Ecke (≈ 74 %) und fallen konvex zum Tisch
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const TOTAL_H = 290;
const HEAD_L = 140;               // Länge Kopf (Spitze → Scheitel)
const TIP_Y = TOTAL_H - HEAD_L;   // Höhe der Spitze
const R = 36;                     // grösster Radius
const T_W = 0.78;                 // Lage der breitesten Stelle (0 = Spitze, 1 = Scheitel)
const RIBS = 14;
const RIB_DEPTH = 0.12;           // Rillentiefe relativ zum Radius

// Radius des Kopfs (ohne Rippen) an relativer Höhe t
function radiusAt(t) {
  if (t <= 0) return 0;
  if (t < T_W) return R * Math.pow(Math.sin((Math.PI / 2) * (t / T_W)), 0.95);   // voller Bauch, erst unten spitz
  const u = Math.min(1, (t - T_W) / (1 - T_W));
  return R * Math.pow(Math.max(0, 1 - Math.pow(u, 1.8)), 0.75);   // Geschossform oben
}

// Rippen: scharfe Grate, dazwischen runde Rillen (siehe build)

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
    'Ein tief gerippter Tropfenkopf in poliertem Chrom, getragen von drei langen Spinnenbeinen. Vorne im Kopf sitzt der runde Screen in einem polierten Ring. Lautsprecher und Mikrofon hören durch feine Löcher in den Rillen unter dem Screen.',
  pros: [
    'Skulpturale, ikonische Silhouette – wirkt wie ein Designobjekt, nicht wie Technik',
    'Rundes Display = Gesicht, kein Bildschirm',
    'Insektenhafte Beine geben der freundlichen Figur etwas Unheimliches',
  ],
  cons: [
    'Tiefe Rippen + Spiegelchrom: aufwendigste Nachbearbeitung aller Varianten',
    'Wenig Platz im Kopf: nur kleines Rund-Display (1.28") und kompakte Elektronik',
    'Kopf sitzt hoch, Beine müssen steif und sauber verbunden sein',
  ],
  sketch: 'skizzen/screen-varianten.jpg',
  defaults: { finish: 'chrome', color: '#f4f4f4', accent: 'black', palette: 'holo' },

  build({ mats, createFace, makeHW, geo }) {
    const root = new THREE.Group();

    // ---------- Kopf ----------
    const profile = [];
    const STEPS = 180;
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      profile.push(new THREE.Vector2(Math.max(radiusAt(t), 0.001), t * HEAD_L));
    }
    const headGeo = new THREE.LatheGeometry(profile, RIBS * 18);

    // Screen-Position: knapp unter der breitesten Stelle, vorne (+Z) – dort ist der Kopf gleichmässig gewölbt
    const SCR_R = 17;                       // aktive Fläche GC9A01 ≈ Ø32
    const RING_R = SCR_R + 1.4;             // feiner Chromrand
    const scrLocalY = T_W * HEAD_L - 8;
    const smooth = THREE.MathUtils.smoothstep;
    // Glatte Kopfoberfläche (ohne Rippen) an Position x / lokaler Höhe y
    const surfaceZ = (x, y) => Math.sqrt(Math.max(0, radiusAt(y / HEAD_L) ** 2 - x * x));

    const pos = headGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), z = pos.getZ(i);
      // Rippen laufen rund um den Screen sanft aus → glatte, gewölbte Fläche für das «Glas»
      const dist = z > 0 ? Math.hypot(x, pos.getY(i) - scrLocalY) : Infinity;
      const ribs = smooth(dist, RING_R + 1, RING_R + 9);
      const k = 1 - RIB_DEPTH * ribs * Math.abs(Math.sin((RIBS * Math.atan2(x, z)) / 2));
      pos.setXYZ(i, x * k, pos.getY(i), z * k);
    }
    headGeo.computeVertexNormals();
    root.add(geo.part(headGeo, mats.case, { position: [0, TIP_Y, 0], name: 'Kopf' }));

    // ---------- Runder Screen, folgt der Wölbung (Display hinter gewölbter Glaslinse) ----------
    const scrY = TIP_Y + scrLocalY;
    const conform = (g, lift) => {
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        p.setZ(i, surfaceZ(p.getX(i), scrLocalY + p.getY(i)) + lift);
      }
      g.computeVertexNormals();
      return g;
    };
    const screen = geo.group({ position: [0, scrY, 0], explode: [0, 0, 30] });
    const tex = createFace({ aspect: 1, round: true, res: 384 });
    screen.add(geo.part(conform(new THREE.RingGeometry(0.01, SCR_R, 64, 16), 0.25),
      new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 })));
    screen.add(geo.part(conform(new THREE.RingGeometry(0.01, SCR_R, 64, 16), 0.5), mats.glass));
    // Chromrand als feiner Wulst auf der Oberfläche
    const rim = [];
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      const x = Math.cos(a) * RING_R, y = Math.sin(a) * RING_R;
      rim.push(new THREE.Vector3(x, y, surfaceZ(x, scrLocalY + y)));
    }
    screen.add(geo.part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim, true), 192, 1.1, 12, true), mats.case));
    root.add(screen);

    // ---------- Löcher in den vorderen Rillen (Lautsprecher + Mikrofon) ----------
    const holeSpots = [];
    for (const g of [-3, -1, 1, 3]) {
      const th = (g * Math.PI) / RIBS;                 // Rillenmitte
      for (let j = 0; j < 4; j++) {
        const y = scrY - RING_R - 10 - j * 6;
        const r = radiusAt((y - TIP_Y) / HEAD_L) * (1 - RIB_DEPTH);
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
    root.add(makeHW('round128', { position: [0, scrY, surfaceZ(0, scrLocalY) - 8], rotation: [Math.PI / 2, 0, 0] }));
    root.add(makeHW('nanoEsp32', { position: [0, scrY - 2, -8], rotation: [0, 0, Math.PI / 2] }));
    root.add(makeHW('speaker20', { position: [0, scrY - RING_R - 18, 14], rotation: [Math.PI / 2, 0, 0] }));
    root.add(makeHW('mic', { position: [0, scrY + 20, 0], rotation: [Math.PI / 2, 0, 0] }));
    root.add(makeHW('usbc', { position: [0, 6, -FOOT_R] }));

    // Skulptur bleibt ruhig – der Ausdruck liegt ganz im Screen.
    return { root };
  },
};
