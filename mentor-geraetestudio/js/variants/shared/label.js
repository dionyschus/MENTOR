// Abstehender Schriftzug «MENTOR» (3D-Text). Die Schrift wird einmal geladen und dann wiederverwendet.
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const FONT_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json';
let fontPromise = null;
const loadFont = () => (fontPromise ??= new FontLoader().loadAsync(FONT_URL));

// Der Text steht zentriert auf position und wächst entlang der lokalen +Z-Achse aus der Fläche.
// conform(x, y) → z: legt den Text auf eine gewölbte Fläche (lokale Koordinaten).
export function addMentorLabel(parent, material, { position = [0, 0, 0], rotation = [0, 0, 0], size = 8.5, depth = 2.5, text = 'MENTOR', conform = null } = {}) {
  loadFont().then((font) => {
    const tg = new TextGeometry(text, {
      font, size, height: depth, curveSegments: 6,
      bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.25, bevelSegments: 2,
    });
    tg.computeBoundingBox();
    const bb = tg.boundingBox;
    tg.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, 0);
    if (conform) {
      const p = tg.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + conform(p.getX(i), p.getY(i)));
      tg.computeVertexNormals();
    }
    const mesh = new THREE.Mesh(tg, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    parent.add(mesh);
  });
}
