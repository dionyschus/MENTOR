// Farb-Panel links: Oberfläche (Original / Chrome / Normal / Matt), Farbrad, Helligkeit, Hex und Vorlagen.
// «Original» = Standard-Look der jeweiligen Variante.

export const FINISH_OPTIONS = {
  original: { label: 'Original' },
  chrome: { label: 'Chrome', finish: 'chrome' },
  normal: { label: 'Normal', finish: 'gloss_lacquer' },
  matte: { label: 'Matt', finish: 'primed_matte' },
};

const PRESETS = [
  ['Black', '#26272b'], ['Dunkelblau', '#1f3358'], ['Dunkellila', '#3b2260'], ['Dunkelorange', '#8c4316'],
  ['Flaschengrün', '#21402f'], ['Bordeaux', '#521827'], ['Creme', '#d4c7ab'], ['Silber', '#f4f4f4'],
];

const clamp01 = (x) => Math.min(1, Math.max(0, x));

export function hsvToHex(h, s, v) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return '#' + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

export function hexToHsv(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

// state: { finish: 'original'|'chrome'|'normal'|'matte', h, s, v, open }
export function createPaintPanel(container, { state, onChange }) {
  container.innerHTML = `
    <button class="paint-toggle" aria-expanded="false" aria-label="Farbe wählen"><span class="paint-dot"></span></button>
    <div class="paint-panel" hidden>
      <div class="paint-head">
        <span>Farbe</span>
        <button class="paint-close" aria-label="Einklappen">−</button>
      </div>
      <div class="paint-seg" role="radiogroup" aria-label="Oberfläche">
        ${Object.entries(FINISH_OPTIONS).map(([k, o]) => `<button role="radio" data-finish="${k}">${o.label}</button>`).join('')}
      </div>
      <div class="paint-wheel">
        <canvas width="336" height="336" aria-label="Farbrad"></canvas>
        <span class="paint-marker"></span>
      </div>
      <input class="paint-value" type="range" min="0" max="100" aria-label="Helligkeit" />
      <div class="paint-hex">
        <span class="paint-dot"></span>
        <input type="text" maxlength="7" spellcheck="false" aria-label="Hex-Farbe" />
      </div>
      <div class="paint-presets">
        ${PRESETS.map(([l, c]) => `<button data-hex="${c}" title="${l}" aria-label="${l}" style="--swatch:${c}"></button>`).join('')}
      </div>
    </div>`;

  const $ = (sel) => container.querySelector(sel);
  const toggle = $('.paint-toggle'), panel = $('.paint-panel');
  const canvas = $('canvas'), ctx = canvas.getContext('2d'), marker = $('.paint-marker');
  const valueInput = $('.paint-value'), hexInput = $('.paint-hex input');
  let drawnV = -1;

  function drawWheel() {
    if (drawnV === state.v) return;
    drawnV = state.v;
    const size = canvas.width, R = size / 2;
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - R + 0.5, dy = y - R + 0.5;
        const r = Math.hypot(dx, dy) / R;
        const i = (y * size + x) * 4;
        if (r > 1) continue;
        const hex = hsvToHex((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, r, state.v);
        const n = parseInt(hex.slice(1), 16);
        img.data[i] = (n >> 16) & 255; img.data[i + 1] = (n >> 8) & 255; img.data[i + 2] = n & 255;
        img.data[i + 3] = r > 0.985 ? Math.round((1 - r) / 0.015 * 255) : 255;   // weicher Rand
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function render() {
    const hex = hsvToHex(state.h, state.s, state.v);
    const original = state.finish === 'original';
    container.querySelectorAll('.paint-dot').forEach((d) => {
      d.style.background = original ? 'linear-gradient(135deg,#f5f5f7,#8e8e93 55%,#d1d1d6)' : hex;
    });
    container.querySelectorAll('[data-finish]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.finish === state.finish)));
    panel.classList.toggle('is-original', original);
    drawWheel();
    const a = state.h * Math.PI / 180;
    marker.style.left = `${50 + Math.cos(a) * state.s * 50}%`;
    marker.style.top = `${50 + Math.sin(a) * state.s * 50}%`;
    marker.style.background = hex;
    valueInput.value = Math.round(state.v * 100);
    valueInput.style.setProperty('--track', `linear-gradient(90deg, #000, ${hsvToHex(state.h, state.s, 1)})`);
    if (document.activeElement !== hexInput) hexInput.value = hex;
    toggle.setAttribute('aria-expanded', String(state.open));
    toggle.hidden = state.open;
    panel.hidden = !state.open;
  }

  // Eine Farbe wählen heisst: eigene Farbe – aus «Original» wird dann «Matt»
  const update = (patch, colorChange = true) => {
    Object.assign(state, patch);
    if (colorChange && state.finish === 'original') state.finish = 'matte';
    render();
    onChange(state);
  };

  toggle.addEventListener('click', () => update({ open: true }, false));
  $('.paint-close').addEventListener('click', () => update({ open: false }, false));
  $('.paint-seg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-finish]');
    if (b) update({ finish: b.dataset.finish }, false);
  });

  const pick = (e) => {
    const r = canvas.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    update({ h: (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, s: clamp01(Math.hypot(dx, dy) / (r.width / 2)) });
  };
  canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); pick(e); });
  canvas.addEventListener('pointermove', (e) => { if (canvas.hasPointerCapture(e.pointerId)) pick(e); });

  valueInput.addEventListener('input', () => update({ v: valueInput.value / 100 }));
  hexInput.addEventListener('change', () => {
    const hsv = hexToHsv(hexInput.value.startsWith('#') ? hexInput.value : '#' + hexInput.value);
    if (hsv) update(hsv); else render();
  });
  $('.paint-presets').addEventListener('click', (e) => {
    const b = e.target.closest('[data-hex]');
    if (b) update(hexToHsv(b.dataset.hex));
  });

  render();
  return { render };
}
