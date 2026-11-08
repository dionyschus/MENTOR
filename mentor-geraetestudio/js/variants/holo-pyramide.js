// Holo V1 – «Pyramide»: Glasprisma mit Hologramm auf einem verchromten Pyramidenstumpf.
// Skizze: skizzen/holo-varianten.jpg (oben)
//
// Funktionsprinzip (Pepper's Ghost): Das Display liegt flach im Sockel und strahlt nach oben.
// Eine 45°-Scheibe im Prisma spiegelt das Bild nach vorne – es scheint frei im Glas zu schweben.
import * as THREE from 'three';
import { buildHoloPrism, hatchMaterial } from './shared/holo-prism.js';
import { addMentorLabel } from './shared/label.js';

export default {
  id: 'holo-pyramide',
  name: 'PYRAMIDE',
  tagline: 'Glasprisma auf Chrom-Pyramide',
  status: 'Entwurf',
  description:
    'MENTOR erscheint als grünes Röhren-Hologramm in einem Glaswürfel. Der Würfel sitzt auf einem flachen Pyramidenstumpf in Chrom-Optik (3D-gedruckt, verchromt). Vorne auf der Schräge: Gitter für Lautsprecher und Mikrofon, darunter der abstehende Schriftzug MENTOR.',
  pros: [
    'Hologramm wirkt «körperlos» – passt zu «Ich existiere, weil es dich gibt»',
    'Starkes Retro-Futurismus-Bild: Chrom, Röhrengrün, Gentleman im Glas',
    'Sockel ist ein einfaches Druckteil, Elektronik bleibt verdeckt',
  ],
  cons: [
    'Pepper\'s Ghost braucht helles Display und eher gedämpftes Umgebungslicht',
    'Hologramm nur von vorne gut sichtbar',
    'Chrom-Finish auf Druckteil ist aufwendig (Schleifen, Hochglanzgrund, Chromlack)',
  ],
  sketch: 'skizzen/holo-varianten.jpg',
  defaults: { finish: 'chrome', color: '#f4f4f4', accent: 'black', palette: 'holo' },

  build({ mats, createFace, makeHW, geo }) {
    const root = new THREE.Group();

    // ---------- Sockel ----------
    // Deckfläche ohne Absatz, Prisma mit 10 mm Rand auf allen Seiten
    const C = 110, MARGIN = 10;
    // Quadratisch und zentriert → alle vier Schrägen und Kanten gleich
    const BW = 200, BD = 200, TW = C + 2 * MARGIN, TD = C + 2 * MARGIN, BH = 42, OFF = 0;
    root.add(geo.part(geo.frustumGeometry(BW, BD, TW, TD, BH, OFF), mats.case, { name: 'Sockel' }));
    const topY = BH;

    // ---------- Schräge Front: Gitter + Schriftzug ----------
    const frontBottomZ = BD / 2, frontTopZ = TD / 2 + OFF;
    const phi = Math.atan2(frontBottomZ - frontTopZ, BH);
    const front = geo.group({ explode: [0, 15, 40] });
    front.position.set(0, BH / 2, (frontBottomZ + frontTopZ) / 2);
    front.rotation.x = -phi;
    root.add(front);

    const GW = 66, GH = 15, gy = 9;
    front.add(geo.part(new THREE.PlaneGeometry(GW, GH), mats.dark, { position: [0, gy, 0.3] }));
    const hatchMat = hatchMaterial();
    front.add(geo.part(new THREE.PlaneGeometry(GW, GH), hatchMat, { position: [0, gy, 0.9] }));
    front.add(geo.part(geo.rectBezelGeometry(GW + 4, GH + 4, 2, GW, GH, 1, 0.8, 0.5), mats.accent, { position: [0, gy, 0] }));

    addMentorLabel(front, mats.accent, { position: [0, -12, 0.2] });

    // ---------- Prisma mit Hologramm ----------
    const prism = buildHoloPrism({ geo, createFace, makeHW, size: C });
    prism.group.position.set(0, topY, OFF);
    root.add(prism.group);

    // ---------- Hardware ----------
    root.add(makeHW('gigaR1', { position: [0, 16, OFF], rotation: [0, Math.PI / 2, 0] }));
    root.add(makeHW('speaker40', { position: [-14, 24, 68], rotation: [Math.PI / 2 - phi, 0, 0] }));
    root.add(makeHW('mic', { position: [26, 26, 70], rotation: [-phi, 0, 0] }));
    root.add(makeHW('usbc', { position: [0, 10, -BD / 2 + 10] }));

    return {
      root,
      update: prism.update,
    };
  },
};
