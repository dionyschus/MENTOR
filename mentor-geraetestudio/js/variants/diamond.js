// Screen V3 – «DIAMOND»: Diamantform aus Pyramide (oben) und Kegelstumpf (unten, abgeschnitten,
// damit sie steht), in dunklem, hochglanzpoliertem Chrom. Hochformat-Screen auf der Frontfacette,
// darunter das schwarze Lautsprechergitter, unter der Gürtelkante dezent der Schriftzug.
// Skizze: skizzen/diamond.jpg
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { hatchMaterial } from './shared/holo-prism.js';
import { addMentorLabel } from './shared/label.js';

const G = 150;          // Gürtel (breiteste Stelle), quadratisch
const LOW_H = 70;       // Unterteil bis zur Gürtelkante
const BASE = 90;        // abgeschnittene Standfläche, quadratisch
const BAND = 3;         // schmales Gürtelband
const TOP_H = 170;      // Höhe der Pyramide über dem Gürtel

export default {
  id: 'diamond',
  name: 'DIAMOND',
  tagline: 'Diamant in dunklem Spiegelchrom',
  status: 'Entwurf',
  description:
    'Eine Diamantform aus spitzer Pyramide und abgeschnittenem Unterteil, ganz in dunklem, hochglanzpoliertem Chrom. Auf der Frontfacette sitzt ein länglicher Screen, darunter das schwarze Lautsprechergitter, unter der Gürtelkante dezent der Schriftzug MENTOR.',
  pros: [],
  cons: [],
  sketch: 'skizzen/diamond.jpg',
  defaults: { finish: 'black_chrome', color: '#727a86', accent: 'black', palette: 'holo' },
  printing: {
    requirements: [
      `<b>Masse</b> ${G} × ${G} × ${LOW_H + BAND + TOP_H} mm – passt am Stück aufs Bambu-Druckbett.`,
      '<b>Teilung am Gürtel:</b> Unterteil mit der Standfläche nach unten, Pyramide mit dem Gürtel nach unten drucken – beide Schrägen (ca. 23°) ohne Stützen.',
      '<b>Screen</b> 52 × 86 mm (GIGA Display Shield, hochkant) in der Frontfacette, ca. 24° nach hinten geneigt – schaut leicht nach oben zum Nutzer.',
      '<b>Innenraum:</b> Display schräg hinter der Facette, Arduino GIGA R1 liegend im Unterteil (Standfläche 90 mm, weiter oben breiter), Lautsprecher Ø28 hinter dem Gitter, Mikrofon daneben, USB-C hinten unten.',
      '<b>Verbindung</b> Ober-/Unterteil über Steckrand und Gewindeeinsätze, so bleibt die Elektronik zugänglich.',
      '<b>Finish:</b> Spiegelchrom-Lack auf schwarzem Hochglanzgrund, darüber getönter Klarlack für den dunklen Look; Schriftzug Ton in Ton.',
    ],
    pros: [
      'Nur ebene Facetten – ideal zum Schleifen und Polieren auf Spiegelglanz',
      'Klare, ikonische Silhouette; schwarzes Chrom wirkt edel und etwas bedrohlich',
      'Kein Stützmaterial nötig, zwei einfache Druckteile',
      'Geneigter Screen ist am Schreibtisch gut ablesbar',
    ],
    challenges: [
      '<b>Scharfe Kanten</b> beim Schleifen nicht verrunden – Facettenkanten sind das Gestaltungsmerkmal',
      '<b>Dunkles Spiegelchrom</b> ist das aufwendigste Finish (Schichtaufbau, Staubfreiheit), zeigt Fingerabdrücke stark',
      'Pyramide wird nach oben schnell eng: Display und Kabel müssen im unteren Drittel Platz finden',
      'Spitze ist empfindlich – ggf. separat drucken oder abgerundet ausführen',
    ],
  },

  build({ mats, createFace, makeHW, geo }) {
    const root = new THREE.Group();
    const girdleY = LOW_H + BAND;

    // ---------- Körper ----------
    root.add(geo.part(geo.frustumGeometry(BASE, BASE, G, G, LOW_H), mats.case, { name: 'Unterteil' }));
    root.add(geo.part(new THREE.BoxGeometry(G, BAND, G), mats.case, { position: [0, LOW_H + BAND / 2, 0], name: 'Gürtel' }));
    const top = geo.part(geo.frustumGeometry(G, G, 0.01, 0.01, TOP_H), mats.case, {
      position: [0, girdleY, 0], explode: [0, 45, 0], name: 'Pyramide',
    });
    root.add(top);

    // ---------- Frontfacette oben: Screen + Lautsprechergitter ----------
    const tilt = Math.atan2(G / 2, TOP_H);                 // Neigung der Facette nach hinten
    const face = geo.group({ position: [0, girdleY, G / 2], explode: [0, 45, 25] });
    face.rotation.x = -tilt;                               // lokales +y läuft die Facette hinauf
    root.add(face);

    const SW = 52, SH = 86, scrS = 24 + SH / 2;            // s = Abstand entlang der Facette ab Gürtel
    face.add(geo.part(new RoundedBoxGeometry(SW + 6, SH + 6, 1.2, 2, 0.5), mats.dark, { position: [0, scrS, 0.2] }));
    const tex = createFace({ aspect: SW / SH, style: 'bust' });
    face.add(geo.part(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), { position: [0, scrS, 0.85] }));
    face.add(geo.part(new THREE.PlaneGeometry(SW + 4, SH + 4), mats.glass, { position: [0, scrS, 1.0] }));

    const GW = 70, GH = 9, grS = 11;
    face.add(geo.part(new RoundedBoxGeometry(GW + 4, GH + 4, 1, 2, 0.4), mats.dark, { position: [0, grS, 0.1] }));
    face.add(geo.part(new THREE.PlaneGeometry(GW, GH), hatchMaterial(), { position: [0, grS, 0.65] }));

    // ---------- Untere Frontfacette: dezenter Schriftzug ----------
    const lowTilt = Math.atan2((G - BASE) / 2, LOW_H);     // Facette kippt nach vorne
    const lowFace = geo.group({ position: [0, LOW_H / 2, (G + BASE) / 4] });
    lowFace.rotation.x = lowTilt;
    root.add(lowFace);
    addMentorLabel(lowFace, mats.case, { position: [0, 14, 0.2], size: 6.5, depth: 0.8 });

    // ---------- Hardware ----------
    const onFace = (s, depth) => new THREE.Vector3(0, girdleY + s * Math.cos(tilt), G / 2 - s * Math.sin(tilt) - depth);
    root.add(makeHW('gigaDisplay', { position: onFace(scrS, 8).toArray(), rotation: [-tilt, Math.PI / 2, Math.PI / 2] }));
    root.add(makeHW('gigaR1', { position: [0, 40, 0], rotation: [0, Math.PI / 4, 0] }));
    root.add(makeHW('speaker28', { position: onFace(grS, 10).toArray(), rotation: [Math.PI / 2 - tilt, 0, 0] }));
    root.add(makeHW('mic', { position: onFace(grS, 6).add(new THREE.Vector3(26, 0, 0)).toArray(), rotation: [-tilt, 0, 0] }));
    root.add(makeHW('usbc', { position: [0, 12, -BASE / 2 - 4] }));

    return { root };
  },
};
