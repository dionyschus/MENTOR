import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

import { VARIANTS } from './variants/index.js';
import { FaceController, FaceScreen, MODES } from './face.js';
import { createMaterials, applyFinish, applyAccent } from './materials.js';
import { makeHW } from './hardware.js';
import * as geo from './geometry.js';

// Tastenkürzel (keine sichtbare Steuerung):
// 1–5 Modus · G Glitch · B Seitenblick · L Lächeln halten · S Sprechen an/aus
// R Drehen an/aus · X Röntgen · E Explosionsansicht · I Panel «Umsetzung & 3D-Druck»

const VIEW_OFFSET = new THREE.Vector3(250, 90, 470);
const BG = '#161618';   // gleich wie --bg in style.css: weiches Schwarz, Chrom hebt sich besser ab

const $ = (id) => document.getElementById(id);

// ---------- Renderer & Szene ----------
const viewport = $('viewport');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(BG, 1);
viewport.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
Object.assign(labelRenderer.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
viewport.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);

// Studio-Umgebung für Chrom: Raum mit Grauverlauf (unten dunkel, oben hell) plus Softboxen
// und Lichtstreifen. Chrom zeigt nur seine Umgebung – der Verlauf gibt den Flächen Helligkeit,
// die Streifen erzeugen die klaren Glanzkanten. Der sichtbare Hintergrund bleibt schwarz.
function studioEnvironment() {
  const env = new THREE.Scene();
  const roomGeo = new THREE.SphereGeometry(20, 48, 24);
  const colors = [];
  const pos = roomGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 20; // -1 … 1
    const v = y < 0 ? THREE.MathUtils.lerp(0.1, 0.01, -y) : THREE.MathUtils.lerp(0.1, 0.32, y);
    colors.push(v, v, v);
  }
  roomGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  env.add(new THREE.Mesh(roomGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));

  const light = (w, h, intensity, pos, lookAt = [0, 0, 0]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(...lookAt);
    env.add(m);
  };
  light(5, 5, 1.2, [0, 12, 0]);              // Softbox oben (gedämpft, sonst überstrahlt die Deckplatte)
  light(1, 10, 5, [-9, 2, 4]);               // Streifen links
  light(1, 10, 5, [9, 2, 4]);                // Streifen rechts
  light(10, 0.8, 4, [0, 2, -9]);             // Kante hinten
  light(12, 0.9, 3, [0, 5, 10]);             // schmaler Streifen vorne oben
  light(12, 0.5, 2, [0, 1, 10]);             // zweiter Streifen vorne, tiefer
  light(14, 0.4, 2.5, [0, -0.5, 9]);         // dünne Bodenkante vorne
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.02).texture;
  pmrem.dispose();
  return tex;
}
scene.environment = studioEnvironment();

const camera = new THREE.PerspectiveCamera(28, 1, 1, 6000);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 150;
controls.maxDistance = 1400;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;

const key = new THREE.DirectionalLight('#ffffff', 1.2);
key.position.set(200, 400, 300);
scene.add(key);

// ---------- Zustand ----------
const mats = createMaterials();
const SHARED_MATS = new Set(Object.values(mats));
const face = new FaceController();

const state = {
  variant: null,
  built: null,
  faces: [],
  explodeParts: [],
  hwMeshes: [],
  xray: false,
  explode: 0,
  explodeTarget: 0,
  center: new THREE.Vector3(0, 90, 0),
  radius: 150,
};

// ---------- Varianten ----------
function disposeVariant() {
  if (!state.built) return;
  state.built.root.traverse((o) => {
    if (o.isCSS2DObject) o.element.remove();
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (!SHARED_MATS.has(m)) m.dispose(); });
    }
  });
  scene.remove(state.built.root);
  state.faces.forEach((f) => f.dispose());
  state.faces = [];
}

function isHW(o) {
  for (let p = o; p; p = p.parent) if (p.userData.hw) return true;
  return false;
}

// Umgebung wie ein Monitor (userData.context) zählt nicht zur Grösse des Geräts.
function isContext(o) {
  for (let p = o; p; p = p.parent) if (p.userData.context) return true;
  return false;
}

function measure(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const b = new THREE.Box3();
  root.traverse((o) => {
    if (!o.isMesh || isHW(o) || isContext(o)) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
    box.union(b);
  });
  return box;
}

// Eine Variante kann ihr Standard-Aussehen mitbringen (Finish, Farbe, Akzente, Display-Farbe).
function applyDefaults(d = {}) {
  applyFinish(mats.case, d.finish ?? 'chrome');
  mats.case.color.set(d.color ?? '#ffffff');
  applyAccent(mats, d.accent ?? 'black');
  face.palette = d.palette ?? 'holo';
}

function loadVariant(id) {
  const v = VARIANTS.find((x) => x.id === id) ?? VARIANTS[0];
  disposeVariant();
  state.variant = v;
  applyDefaults(v.defaults);

  const built = v.build({
    mats,
    geo,
    makeHW,
    createFace: (opts) => {
      const f = new FaceScreen(opts);
      state.faces.push(f);
      return f.texture;
    },
  });
  state.built = built;
  scene.add(built.root);

  state.explodeParts = [];
  state.hwMeshes = [];
  built.root.traverse((o) => {
    if (o.userData.explode) {
      o.userData.basePos = o.position.clone();
      state.explodeParts.push(o);
    }
    if (o.userData.hw) state.hwMeshes.push(o);
  });

  const box = measure(built.root);
  box.getCenter(state.center);
  state.radius = box.getSize(new THREE.Vector3()).length() / 2;
  fitCamera();

  applyXray();
  applyExplode();
  document.querySelectorAll('#variant-nav a').forEach((a) => a.classList.toggle('active', a.dataset.id === v.id));
  renderInfo();
  if (location.hash.slice(1) !== v.id) history.replaceState(null, '', `#${v.id}`);
}

// Testansicht per URL, z. B. ?cam=1,0.2,0&zoom=3&ty=250 (Blickrichtung, Vergrösserung, Zielhöhe; Drehteller aus)
const params = new URLSearchParams(location.search);
const CAM_DIR = params.get('cam') ? new THREE.Vector3(...params.get('cam').split(',').map(Number)) : null;
const ZOOM = parseFloat(params.get('zoom')) || 1;
const TARGET_Y = params.has('ty') ? parseFloat(params.get('ty')) : null;
if (CAM_DIR) controls.autoRotate = false;

// Kamera so weit zurück, dass die ganze Variante (Umkugel) mit etwas Luft ins Bild passt.
function fitCamera() {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const dist = (state.radius * 1.15) / Math.sin(Math.min(vFov, hFov) / 2) / ZOOM;
  const target = state.center.clone();
  if (TARGET_Y !== null) target.y = TARGET_Y;
  controls.target.copy(target);
  camera.position.copy(target).addScaledVector((CAM_DIR ?? VIEW_OFFSET).clone().normalize(), dist);
}

// ---------- Röntgen & Explosion ----------
function applyXray() {
  const seen = new Set();
  state.built.root.traverse((o) => {
    if (!o.isMesh || isHW(o) || isContext(o)) return;
    const m = o.material;
    if (seen.has(m) || m.isMeshBasicMaterial) return;
    seen.add(m);
    if (m.userData.orig === undefined) m.userData.orig = { transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite };
    const orig = m.userData.orig;
    m.transparent = state.xray ? true : orig.transparent;
    m.opacity = state.xray ? Math.min(orig.opacity, 0.16) : orig.opacity;
    m.depthWrite = state.xray ? false : orig.depthWrite;
    m.needsUpdate = true;
  });
  state.hwMeshes.forEach((h) => {
    h.visible = state.xray;
    h.userData.label.visible = state.xray;
  });
}

function applyExplode() {
  state.explodeParts.forEach((o) => {
    o.position.copy(o.userData.basePos).addScaledVector(o.userData.explode, state.explode);
  });
}

// ---------- Panel «Umsetzung & 3D-Druck» ----------
// Inhalt kommt aus dem Feld `printing` der Variante: { requirements, pros, challenges } (Arrays mit HTML-Text).
const INFO_SECTIONS = [
  ['requirements', 'Anforderungen', ''],
  ['pros', 'Pro', 'pro'],
  ['challenges', 'Herausforderungen', 'con'],
];

function renderInfo() {
  const v = state.variant;
  const info = v.printing ?? {};
  $('info-title').textContent = v.name;
  $('info-body').innerHTML = INFO_SECTIONS.map(([key, title, cls]) => `
    <details class="info-section ${cls}" open>
      <summary>${title}</summary>
      <ul>${(info[key] ?? ['Noch offen.']).map((t) => `<li>${t}</li>`).join('')}</ul>
    </details>`).join('');
}

function setInfoOpen(open) {
  $('info-panel').hidden = !open;
  $('info-toggle').setAttribute('aria-expanded', String(open));
  try { localStorage.setItem('mentor-info-open', open ? '1' : '0'); } catch {}
}
$('info-toggle').addEventListener('click', () => setInfoOpen(true));
$('info-close').addEventListener('click', () => setInfoOpen(false));
// ?info=1 in der Adresse öffnet das Panel direkt (z. B. für geteilte Links)
let infoOpen = params.get('info') === '1';
try { infoOpen ||= localStorage.getItem('mentor-info-open') === '1'; } catch {}
setInfoOpen(infoOpen);

// ---------- Navigation ----------
function renderNav() {
  $('variant-nav').innerHTML = VARIANTS.map((v, i) =>
    `<a href="#${v.id}" data-id="${v.id}" title="Variante ${i + 1}">${v.name}</a>`).join('');
  window.addEventListener('hashchange', () => loadVariant(location.hash.slice(1)));
}

// ---------- Tastatur ----------
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const modeKeys = Object.keys(MODES);
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= modeKeys.length) { face.setMode(modeKeys[n - 1]); return; }
  switch (e.key.toLowerCase()) {
    case 'g': face.triggerGlitch(0.2); break;
    case 'b': face.triggerGlance(); break;
    case 'l': face.triggerSmileHold(); break;
    case 's': face.setTalking(!face.talking); break;
    case 'r': controls.autoRotate = !controls.autoRotate; break;
    case 'x': state.xray = !state.xray; applyXray(); break;
    case 'e': state.explodeTarget = state.explodeTarget > 0 ? 0 : 1; break;
    case 'i': setInfoOpen($('info-panel').hidden); break;
  }
});

function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);

// ---------- Loop ----------
const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  face.update(dt);
  state.faces.forEach((f) => f.render(face));
  state.built?.update?.({ t, dt, face });

  if (Math.abs(state.explode - state.explodeTarget) > 0.001) {
    state.explode += (state.explodeTarget - state.explode) * (1 - Math.exp(-dt * 5));
    applyExplode();
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(loop);
}

renderNav();
resize();
loadVariant(location.hash.slice(1));
loop();
