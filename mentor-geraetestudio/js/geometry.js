// Kleine Geometrie-Helfer für Gehäuseteile. Einheit: Millimeter.
import * as THREE from 'three';

export function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// Flache Display-Fläche mit UVs 0..1 (für die Gesichtstextur).
export function rectScreenGeometry(w, h, r) {
  const g = new THREE.ShapeGeometry(roundedRectShape(w, h, r), 16);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  return g;
}

// Rahmen (Lünette) um ein rechteckiges Display. Extrudiert entlang +Z.
export function rectBezelGeometry(outerW, outerH, outerR, innerW, innerH, innerR, depth, bevel = 1.5) {
  const shape = roundedRectShape(outerW, outerH, outerR);
  shape.holes.push(roundedRectShape(innerW, innerH, innerR));
  return new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 16,
  });
}

// Runder Ring mit Fase, extrudiert entlang +Z.
export function ringGeometry(rOuter, rInner, depth, bevel = 1.2) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, rInner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 64,
  });
}

// Pyramidenstumpf mit flachen Facetten. Unterseite bei y = 0.
// bw/bd = Breite/Tiefe unten, tw/td = oben, offsetZ verschiebt die Deckfläche nach hinten (−) oder vorne (+).
export function frustumGeometry(bw, bd, tw, td, h, offsetZ = 0) {
  const b = [[-bw / 2, 0, -bd / 2], [bw / 2, 0, -bd / 2], [bw / 2, 0, bd / 2], [-bw / 2, 0, bd / 2]];
  const t = [[-tw / 2, h, -td / 2 + offsetZ], [tw / 2, h, -td / 2 + offsetZ], [tw / 2, h, td / 2 + offsetZ], [-tw / 2, h, td / 2 + offsetZ]];
  const quads = [[t[3], t[2], t[1], t[0]], [b[0], b[1], b[2], b[3]]];
  for (let i = 0; i < 4; i++) quads.push([b[i], t[i], t[(i + 1) % 4], b[(i + 1) % 4]]);

  const pos = [], uv = [];
  for (const [a, b2, c, d] of quads) {
    for (const v of [a, b2, c, a, c, d]) {
      pos.push(...v);
      uv.push((v[0] + v[2]) / bw + 0.5, v[1] / h);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// Röhre entlang einer Kurve, die von r0 auf r1 zuläuft (Beine, Krallen, Fühler).
export function taperedTube(curve, r0, r1, segments = 32, radial = 12) {
  const g = new THREE.TubeGeometry(curve, segments, r0, radial, false);
  const pos = g.attributes.position;
  const c = new THREE.Vector3(), v = new THREE.Vector3();
  for (let j = 0; j <= segments; j++) {
    const u = j / segments;
    curve.getPointAt(u, c);
    const k = THREE.MathUtils.lerp(r0, r1, u) / r0;
    for (let i = 0; i <= radial; i++) {
      const idx = j * (radial + 1) + i;
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  return g;
}

// Mesh erzeugen und optional als Bauteil der Explosionsansicht markieren.
// explode: Versatz in mm bei voller Explosion, relativ zum Elternobjekt.
export function part(geometry, material, { position = [0, 0, 0], rotation = [0, 0, 0], explode = null, name = '' } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position);
  m.rotation.set(...rotation);
  m.name = name;
  if (explode) m.userData.explode = new THREE.Vector3(...explode);
  return m;
}

// Gruppe, die als Ganzes explodiert (z. B. Kopf mit allem drin).
export function group({ position = [0, 0, 0], explode = null, name = '' } = {}) {
  const g = new THREE.Group();
  g.position.set(...position);
  g.name = name;
  if (explode) g.userData.explode = new THREE.Vector3(...explode);
  return g;
}
