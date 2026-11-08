// Platzhalter für Elektronik-Bauteile (Masse in mm), um Gehäusevolumen früh zu prüfen.
// approx: true = Richtwert, vor dem CAD mit Datenblatt verifizieren.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export const HW = {
  unoR3: { label: 'Arduino Uno R3', size: [68.6, 15, 53.4], color: '#2a8fa6' },
  nano: { label: 'Arduino Nano', size: [45, 8, 18], color: '#2a8fa6' },
  nanoEsp32: { label: 'Arduino Nano ESP32', size: [45, 8, 18], color: '#2a8fa6' },
  gigaR1: { label: 'Arduino GIGA R1 WiFi', size: [101.6, 15, 53.3], color: '#2a8fa6' },
  gigaDisplay: { label: 'GIGA Display Shield 3.97"', size: [100, 8, 62], color: '#d9534f', approx: true },
  tft35: { label: 'TFT 3.5" (ILI9488)', size: [98, 6, 56], color: '#d9534f', approx: true },
  barDisplay: { label: 'Streifen-Display hochkant (Bar-LCD)', size: [60, 130, 6], color: '#d9534f', approx: true },
  round128: { label: 'Rund-Display 1.28" (GC9A01)', d: 39, h: 5, color: '#d9534f', approx: true },
  round21: { label: 'Rund-Display 2.1"', d: 60, h: 6, color: '#d9534f', approx: true },
  speaker40: { label: 'Lautsprecher Ø40', d: 40, h: 6, color: '#c58b2c', approx: true },
  speaker28: { label: 'Lautsprecher Ø28', d: 28, h: 5, color: '#c58b2c', approx: true },
  speaker20: { label: 'Lautsprecher Ø20', d: 20, h: 4, color: '#c58b2c', approx: true },
  dfplayer: { label: 'Audio-Modul (DFPlayer Mini)', size: [20, 8, 20], color: '#c58b2c', approx: true },
  mic: { label: 'Mikrofon (MAX9814)', size: [27, 6, 15], color: '#7fbf6a', approx: true },
  servo: { label: 'Servo SG90', size: [22.8, 22.7, 12.2], color: '#4a6fd1' },
  ledRing: { label: 'LED-Ring (WS2812, 12 LEDs)', d: 37, h: 3, color: '#b06ad1', approx: true },
  usbc: { label: 'USB-C-Buchse (Strom/Daten)', size: [12, 6, 15], color: '#8a8a8a', approx: true },
};

export function hwDims(spec) {
  return spec.d ? `Ø${spec.d} × ${spec.h}` : spec.size.join(' × ');
}

// Erzeugt einen Platzhalter. Zylinder stehen standardmässig auf der Y-Achse:
// für Displays/Lautsprecher nach vorne gerichtet → rotation: [Math.PI / 2, 0, 0].
export function makeHW(key, { position = [0, 0, 0], rotation = [0, 0, 0] } = {}) {
  const spec = HW[key];
  const geom = spec.d
    ? new THREE.CylinderGeometry(spec.d / 2, spec.d / 2, spec.h, 40)
    : new THREE.BoxGeometry(...spec.size);
  const mat = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.5, metalness: 0.1 });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.userData.hw = key;

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geom, 30),
    new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55 }),
  );
  mesh.add(edges);

  const el = document.createElement('div');
  el.className = 'hw-label';
  el.style.setProperty('--c', spec.color);
  el.textContent = spec.label;
  const label = new CSS2DObject(el);
  mesh.add(label);
  mesh.userData.label = label;
  return mesh;
}
