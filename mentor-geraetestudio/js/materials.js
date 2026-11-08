// Gemeinsame Materialien + Oberflächen-Finishes für 3D-gedruckte Gehäuse.
import * as THREE from 'three';

// Normal-Map mit horizontalen Rillen = sichtbare Druckschichten (visuell übertrieben).
function layerLineNormalMap() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 64;
  const ctx = c.getContext('2d');
  for (let y = 0; y < 64; y++) {
    const n = Math.sin((y / 64) * Math.PI * 2 * 8);
    ctx.fillStyle = `rgb(128,${Math.round(128 + n * 90)},255)`;
    ctx.fillRect(0, y, 4, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 6);
  return tex;
}

const LAYER_LINES = layerLineNormalMap();

// Normal-Map mit feinen vertikalen Schleifspuren = gebürstetes Metall.
function brushedNormalMap() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 4;
  const ctx = c.getContext('2d');
  for (let x = 0; x < 512; x++) {
    const n = (Math.random() - 0.5) * 2;
    ctx.fillStyle = `rgb(${Math.round(128 + n * 60)},128,255)`;
    ctx.fillRect(x, 0, 1, 4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const BRUSHED = brushedNormalMap();

export const FINISHES = {
  pla_raw: {
    label: 'PLA roh (Layerlines sichtbar)',
    desc: 'Direkt vom Drucker. Schichten sichtbar, seidenmatt. Aufwand: keiner. Gut für frühe Prototypen.',
    props: { roughness: 0.55, metalness: 0, clearcoat: 0, sheen: 0, normalMap: LAYER_LINES, normalScale: 0.35 },
  },
  primed_matte: {
    label: 'Geschliffen + Füller, matt',
    desc: 'Schleifen (120 → 400), Füller-Primer, Zwischenschliff. Glatte, ruhige Oberfläche. Aufwand: mittel.',
    props: { roughness: 0.75, metalness: 0, clearcoat: 0, sheen: 0 },
  },
  gloss_lacquer: {
    label: 'Lackiert, Hochglanz (Emaille-Look)',
    desc: 'Wie oben, dann Farblack + 2K-Klarlack, nass geschliffen und poliert. Wirkt wie 50er-Haushaltsgerät. Aufwand: hoch.',
    props: { roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, sheen: 0 },
  },
  soft_touch: {
    label: 'Soft-Touch / Gummilack',
    desc: 'Soft-Touch-Sprühlack auf grundierter Fläche. Samtig, schluckt Licht, wirkt hochwertig-modern. Aufwand: mittel.',
    props: { roughness: 0.95, metalness: 0, clearcoat: 0, sheen: 0.6, sheenRoughness: 0.8 },
  },
  bakelite: {
    label: 'Bakelit-Look (Harz, satiniert)',
    desc: 'Epoxid-Beschichtung (z. B. XTC-3D) oder Resin-Druck, leicht satiniert poliert. Tiefer Glanz wie altes Radio. Aufwand: mittel–hoch.',
    props: { roughness: 0.3, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.25, sheen: 0 },
  },
  metallic: {
    label: 'Metallic-Lack',
    desc: 'Grundierung + Metallic-Effektlack + Klarlack. Futuristisch, Autolack-Anmutung. Aufwand: hoch.',
    props: { roughness: 0.32, metalness: 0.75, clearcoat: 0.8, clearcoatRoughness: 0.1, sheen: 0 },
  },
  dark_chrome: {
    label: 'Dunkles Chrom, gebürstet',
    desc: 'Schwarzer Hochglanzgrund, Chromlack, dann leicht in eine Richtung angeschliffen und mit getöntem Klarlack versiegelt. Aufwand: sehr hoch.',
    props: { roughness: 0.22, metalness: 1, clearcoat: 0.4, clearcoatRoughness: 0.15, sheen: 0, normalMap: BRUSHED, normalScale: 0.25, anisotropy: 0.7, anisotropyRotation: Math.PI / 2 },
  },
  black_chrome: {
    label: 'Dunkles Chrom, hochglanzpoliert',
    desc: 'Schwarzer Hochglanzgrund, Spiegelchrom-Lack, darüber getönter (rauchschwarzer) 2K-Klarlack, poliert. Dunkler Spiegel-Look. Aufwand: sehr hoch.',
    props: { roughness: 0.04, metalness: 1, clearcoat: 1, clearcoatRoughness: 0.02, sheen: 0 },
  },
  chrome: {
    label: 'Chrom-Spiegel (Galvanik / Spiegellack)',
    desc: 'Spiegelchrom-Spray auf schwarzem Hochglanz-Grund oder galvanisch beschichtet. Sehr empfindlich, eher für Akzente. Aufwand: sehr hoch.',
    props: { roughness: 0.015, metalness: 1, clearcoat: 1, clearcoatRoughness: 0, sheen: 0 },
  },
};

export const COLORS = [
  { label: 'Creme', hex: '#e9dcc3' },
  { label: 'Elfenbein', hex: '#f4efe4' },
  { label: 'Mintgrün', hex: '#a9d8c2' },
  { label: 'Pastell-Türkis', hex: '#7cc4c4' },
  { label: 'Signalrot', hex: '#b8322a' },
  { label: 'Senfgelb', hex: '#d9a53a' },
  { label: 'Bakelit-Braun', hex: '#4a2a18' },
  { label: 'Anthrazit', hex: '#2f2f31' },
];

export const ACCENTS = {
  chrome: { label: 'Chrom', color: '#dcdcdc', roughness: 0.08, metalness: 1 },
  brass: { label: 'Messing', color: '#c9a25a', roughness: 0.22, metalness: 1 },
  copper: { label: 'Kupfer', color: '#c27a52', roughness: 0.25, metalness: 1 },
  black: { label: 'Schwarz matt', color: '#1c1b1a', roughness: 0.7, metalness: 0 },
  same: { label: 'Wie Gehäuse', color: null, roughness: null, metalness: null },
};

export function createMaterials() {
  return {
    case: new THREE.MeshPhysicalMaterial({ color: COLORS[0].hex }),
    accent: new THREE.MeshPhysicalMaterial({ color: ACCENTS.chrome.color }),
    dark: new THREE.MeshStandardMaterial({ color: '#1b1a19', roughness: 0.65, metalness: 0.1 }),
    grille: new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.8, metalness: 0.3 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#ffffff', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.12,
      clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false,
    }),
  };
}

export function applyFinish(mat, finishKey) {
  const f = FINISHES[finishKey].props;
  mat.roughness = f.roughness;
  mat.metalness = f.metalness;
  mat.clearcoat = f.clearcoat ?? 0;
  mat.clearcoatRoughness = f.clearcoatRoughness ?? 0;
  mat.sheen = f.sheen ?? 0;
  mat.sheenRoughness = f.sheenRoughness ?? 1;
  mat.sheenColor.set('#ffffff');
  mat.normalMap = f.normalMap ?? null;
  mat.normalScale.set(f.normalScale ?? 1, f.normalScale ?? 1);
  mat.anisotropy = f.anisotropy ?? 0;
  mat.anisotropyRotation = f.anisotropyRotation ?? 0;
  mat.needsUpdate = true;
}

export function applyAccent(mats, accentKey) {
  const a = ACCENTS[accentKey];
  const m = mats.accent;
  if (a.color === null) {
    m.color.copy(mats.case.color);
    m.roughness = mats.case.roughness;
    m.metalness = mats.case.metalness;
    m.clearcoat = mats.case.clearcoat;
  } else {
    m.color.set(a.color);
    m.roughness = a.roughness;
    m.metalness = a.metalness;
    m.clearcoat = 0;
  }
  m.needsUpdate = true;
}
