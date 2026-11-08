// Glasprisma mit Hologramm (Pepper's Ghost), von allen Holo-Varianten gemeinsam genutzt.
// Das Display liegt flach unter dem Prisma und strahlt nach oben; eine 45°-Scheibe
// spiegelt das Bild nach vorne, sodass MENTOR frei im Glas zu schweben scheint.
//
// Ursprung der Gruppe = Mitte der Unterkante des Prismas (dort, wo es aufliegt).
import * as THREE from 'three';

// Kreuzgitter als Alpha-Maske (weiss = Material, schwarz = Loch) – für Lautsprecher/Mikrofon
export function hatchMaterial() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  for (let x = -64; x < 320; x += 12) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 64, 64); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 64, 0); ctx.lineTo(x, 64); ctx.stroke();
  }
  return new THREE.MeshStandardMaterial({
    color: '#1a1a1a', metalness: 0.6, roughness: 0.4, alphaMap: new THREE.CanvasTexture(c), alphaTest: 0.5,
  });
}

export function buildHoloPrism({ geo, createFace, makeHW, size = 110, explode = [0, 90, 0] }) {
  const C = size;
  const group = geo.group({ explode, name: 'Prisma' });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#e8fff4', roughness: 0.03, transparent: true, opacity: 0.14, clearcoat: 1,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const cube = geo.part(new THREE.BoxGeometry(C, C, C), glassMat, { position: [0, C / 2, 0] });
  cube.renderOrder = 1;
  group.add(cube);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(cube.geometry),
    new THREE.LineBasicMaterial({ color: '#dffff0', transparent: true, opacity: 0.45 }),
  );
  edges.position.y = C / 2;
  group.add(edges);

  // 45°-Spiegelscheibe (Beam-Splitter), kaum sichtbar
  const splitterMat = new THREE.MeshPhysicalMaterial({
    color: '#9fffd0', roughness: 0.05, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false,
  });
  group.add(geo.part(new THREE.PlaneGeometry(C - 2, (C - 2) * Math.SQRT2), splitterMat, {
    position: [0, C / 2, 0], rotation: [Math.PI / 4, 0, 0],
  }));

  // Hologramm (virtuelles Bild)
  const HW = 60, HH = 96;
  const tex = createFace({ aspect: HW / HH, style: 'bust', holo: true });
  const holoMat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
  const holoBaseY = 6 + HH / 2;
  const holo = geo.part(new THREE.PlaneGeometry(HW, HH), holoMat, { position: [0, holoBaseY, 0] });
  holo.renderOrder = 2;
  group.add(holo);

  // Leuchtende Displayfläche am Boden des Prismas
  group.add(geo.part(new THREE.PlaneGeometry(HW, HH), new THREE.MeshBasicMaterial({ map: tex, color: '#6a6a6a', toneMapped: false }), {
    position: [0, 0.2, 0], rotation: [-Math.PI / 2, 0, 0],
  }));

  group.add(makeHW('gigaDisplay', { position: [0, -6, 0], rotation: [0, Math.PI / 2, 0] }));

  return {
    group,
    update({ t, face }) {
      // Hologramm schwebt leicht und flackert; beim Glitch springt es seitlich
      holo.position.y = holoBaseY + Math.sin(t * 1.3) * 0.8;
      holo.position.x = face.glitch > 0 ? (Math.random() - 0.5) * 4 : 0;
      holoMat.opacity = 0.88 + Math.random() * 0.12;
      splitterMat.opacity = 0.05 + 0.02 * Math.sin(t * 3);
    },
  };
}
