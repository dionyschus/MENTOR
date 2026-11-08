// VORLAGE für eine neue Variante.
// 1. Datei kopieren, z. B. nach js/variants/meine-idee.js
// 2. id, name, Texte anpassen und in build() die Form bauen
// 3. In js/variants/index.js importieren und in die Liste eintragen
//
// Einheit: Millimeter. Y zeigt nach oben, +Z ist die Front (dort schaut MENTOR hin).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export default {
  id: 'vorlage',
  name: 'Platzhalter',
  tagline: 'Technischer Test – noch kein Entwurf',
  status: 'Vorlage',
  description: 'Neutraler Block, um Ansicht, Oberflächen, Röntgen und Explosion zu testen. Wird ersetzt, sobald die ersten Skizzen umgesetzt sind.',
  pros: [],
  cons: [],
  sketch: null, // Pfad zur Skizze, z. B. 'skizzen/meine-idee.jpg'

  // ctx: { mats, createFace, makeHW, geo }
  //  mats.case / mats.accent / mats.dark / mats.grille / mats.glass  → reagieren auf die Oberflächen-Steuerung
  //  createFace({ aspect, round })  → Canvas-Textur mit animiertem Gesicht
  //  makeHW('unoR3', { position, rotation })  → Bauteil-Platzhalter (siehe js/hardware.js)
  //  geo.part(geometry, material, { position, rotation, explode })  → explode = Versatz in der Explosionsansicht
  build({ mats, createFace, makeHW, geo }) {
    const root = new THREE.Group();

    root.add(geo.part(new RoundedBoxGeometry(120, 140, 90, 5, 20), mats.case, { position: [0, 70, 0] }));

    const tex = createFace({ aspect: 1, round: true });
    root.add(geo.part(new THREE.CircleGeometry(30, 48), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), {
      position: [0, 90, 45.3], explode: [0, 0, 30],
    }));

    root.add(makeHW('round21', { position: [0, 90, 38], rotation: [Math.PI / 2, 0, 0] }));
    root.add(makeHW('unoR3', { position: [0, 40, 0] }));

    return {
      root,
      // optional, wird jeden Frame aufgerufen. face.mode, face.pose, face.glitch …
      update({ t, dt, face }) {},
    };
  },
};
