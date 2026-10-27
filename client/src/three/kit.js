import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Geometries, materials and textures are cached for the lifetime of the page and shared by
// every food model and scene object. The set is bounded (keys come from code, not user data),
// so nothing here is disposed per component.
const cache = new Map();

export function memo(key, factory) {
  let value = cache.get(key);
  if (value === undefined) {
    value = factory();
    cache.set(key, value);
  }
  return value;
}

/** Deterministic PRNG so procedural details look identical on every render and thumbnail. */
export function rng(seed = 1) {
  let a = typeof seed === 'string' ? [...seed].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0), 7) : seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Materials ----------

function keyOf(o) {
  return JSON.stringify(o, (k, v) => (v && v.isTexture ? `tex:${v.uuid}` : v));
}

/** Shared MeshStandardMaterial (or MeshPhysicalMaterial when `physical: true`). */
export function mat(color, opts = {}) {
  return memo(`mat|${color}|${keyOf(opts)}`, () => {
    const { physical, ...rest } = opts;
    const Ctor = physical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
    return new Ctor({ color, roughness: 0.6, metalness: 0, ...rest });
  });
}

export const M = {
  glass: () => mat('#e9f4f7', { roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false }),
  glassThick: () => mat('#dceef0', { roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.35, depthWrite: false }),
  ceramic: (c = '#f7f4ee') => mat(c, { roughness: 0.25 }),
  steel: () => mat('#c9ccd0', { roughness: 0.28, metalness: 0.9 }),
  darkSteel: () => mat('#4a4d52', { roughness: 0.35, metalness: 0.8 }),
  brass: () => mat('#b8893a', { roughness: 0.3, metalness: 0.85 }),
  copper: () => mat('#b8673f', { roughness: 0.32, metalness: 0.85 }),
  glossy: (c) => mat(c, { roughness: 0.15 }),
  matte: (c) => mat(c, { roughness: 0.85 }),
  emissive: (c, intensity = 2) => mat(c, { emissive: c, emissiveIntensity: intensity, roughness: 0.4 }),
};

// ---------- Geometry ----------

export const geo = {
  box: (w, h, d) => memo(`box|${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d)),
  rbox: (w, h, d, r = 0.05, s = 3) => memo(`rbox|${w}|${h}|${d}|${r}|${s}`, () => new RoundedBoxGeometry(w, h, d, s, r)),
  cyl: (rt, rb, h, seg = 32, open = false, ts = 0, tl = Math.PI * 2) =>
    memo(`cyl|${rt}|${rb}|${h}|${seg}|${open}|${ts}|${tl}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open, ts, tl)),
  sphere: (r, ws = 24, hs = 16, ps = 0, pl = Math.PI * 2, ts = 0, tl = Math.PI) =>
    memo(`sph|${r}|${ws}|${hs}|${ps}|${pl}|${ts}|${tl}`, () => new THREE.SphereGeometry(r, ws, hs, ps, pl, ts, tl)),
  torus: (r, t, rs = 12, ts = 32, arc = Math.PI * 2) => memo(`tor|${r}|${t}|${rs}|${ts}|${arc}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc)),
  cone: (r, h, seg = 24, open = false) => memo(`cone|${r}|${h}|${seg}|${open}`, () => new THREE.ConeGeometry(r, h, seg, 1, open)),
  capsule: (r, len, cs = 6, rs = 12) => memo(`cap|${r}|${len}|${cs}|${rs}`, () => new THREE.CapsuleGeometry(r, len, cs, rs)),
  plane: (w, h, ws = 1, hs = 1) => memo(`pl|${w}|${h}|${ws}|${hs}`, () => new THREE.PlaneGeometry(w, h, ws, hs)),
  circle: (r, seg = 32) => memo(`cir|${r}|${seg}`, () => new THREE.CircleGeometry(r, seg)),
  ring: (ri, ro, seg = 32) => memo(`ring|${ri}|${ro}|${seg}`, () => new THREE.RingGeometry(ri, ro, seg)),
  ico: (r, d = 1) => memo(`ico|${r}|${d}`, () => new THREE.IcosahedronGeometry(r, d)),
  dodeca: (r, d = 0) => memo(`dod|${r}|${d}`, () => new THREE.DodecahedronGeometry(r, d)),
  /** Lathe from [x, y] pairs; `key` must uniquely identify the profile. */
  lathe: (key, points, seg = 40) =>
    memo(`lathe|${key}|${seg}`, () => new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg)),
  custom: (key, factory) => memo(`custom|${key}`, factory),
};

/** Clones a geometry and moves each vertex with fn(vector, index). Seams are welded first. */
export function displaced(key, base, fn) {
  return memo(`disp|${key}`, () => {
    let g = base.clone();
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    g = mergeVertices(g, 1e-4);
    const pos = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      fn(v, i);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  });
}

/** Smooth-ish value noise from sin waves; cheap and deterministic. */
export function wobble(x, y, z, f = 6, seed = 0) {
  return (
    Math.sin(x * f + seed) * Math.cos(z * f * 1.3 + seed * 0.7) * 0.5 +
    Math.sin(y * f * 1.7 + x * 2.1 + seed * 1.3) * 0.3 +
    Math.sin((x + z) * f * 2.9 + seed * 2.1) * 0.2
  );
}

// ---------- Procedural canvas textures ----------

export function canvasTexture(key, w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  return memo(`tex|${key}`, () => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    draw(ctx, w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
    t.anisotropy = 4;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}

export const tex = {
  woodPlanks: () =>
    canvasTexture('woodPlanks', 512, 512, (ctx, w, h) => {
      const r = rng(11);
      const rows = 8;
      for (let i = 0; i < rows; i++) {
        const y = (i * h) / rows;
        let x = -r() * 200;
        while (x < w) {
          const len = 180 + r() * 220;
          const tone = 120 + r() * 40;
          ctx.fillStyle = `rgb(${tone + 38}, ${tone - 8}, ${tone - 52})`;
          ctx.fillRect(x, y, len, h / rows);
          ctx.globalAlpha = 0.18;
          for (let g = 0; g < 14; g++) {
            ctx.strokeStyle = r() > 0.5 ? '#5a3418' : '#d9a066';
            ctx.beginPath();
            const gy = y + r() * (h / rows);
            ctx.moveTo(x, gy);
            ctx.bezierCurveTo(x + len * 0.3, gy + r() * 6 - 3, x + len * 0.6, gy + r() * 6 - 3, x + len, gy);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          ctx.fillStyle = 'rgba(40,20,8,0.55)';
          ctx.fillRect(x, y, 2, h / rows);
          x += len;
        }
        ctx.fillStyle = 'rgba(40,20,8,0.6)';
        ctx.fillRect(0, y, w, 2);
      }
    }),
  wood: (base = '#8a5a35') =>
    canvasTexture(`wood|${base}`, 256, 256, (ctx, w, h) => {
      const r = rng(5);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.16;
      for (let i = 0; i < 70; i++) {
        ctx.strokeStyle = r() > 0.5 ? '#2d1608' : '#e0b080';
        ctx.lineWidth = 1 + r() * 2;
        ctx.beginPath();
        const y = r() * h;
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y + r() * 10 - 5, w * 0.7, y + r() * 10 - 5, w, y);
        ctx.stroke();
      }
    }),
  tiles: (a = '#f1ebe0', b = '#2f2a26') =>
    canvasTexture(`tiles|${a}|${b}`, 256, 256, (ctx, w, h) => {
      const n = 8;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          ctx.fillStyle = (i + j) % 2 ? a : b;
          ctx.fillRect((i * w) / n, (j * h) / n, w / n, h / n);
        }
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      for (let i = 0; i <= n; i++) {
        ctx.beginPath();
        ctx.moveTo((i * w) / n, 0);
        ctx.lineTo((i * w) / n, h);
        ctx.moveTo(0, (i * h) / n);
        ctx.lineTo(w, (i * h) / n);
        ctx.stroke();
      }
    }),
  hexTiles: () =>
    canvasTexture('hexTiles', 256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#d9d3c7';
      ctx.fillRect(0, 0, w, h);
      const r = rng(3);
      const s = 16;
      for (let y = 0; y < h + s; y += s * 1.5)
        for (let x = 0; x < w + s; x += s * Math.sqrt(3)) {
          const ox = (Math.round(y / (s * 1.5)) % 2) * ((s * Math.sqrt(3)) / 2);
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (Math.PI / 3) * k + Math.PI / 6;
            ctx.lineTo(x + ox + Math.cos(a) * (s - 1.5), y + Math.sin(a) * (s - 1.5));
          }
          const t = 225 + r() * 25;
          ctx.fillStyle = r() > 0.93 ? '#4f7a6b' : `rgb(${t},${t - 4},${t - 12})`;
          ctx.fill();
        }
    }),
  brick: () =>
    canvasTexture('brick', 512, 256, (ctx, w, h) => {
      const r = rng(9);
      ctx.fillStyle = '#d8cbbb';
      ctx.fillRect(0, 0, w, h);
      const bh = 32;
      const bw = 96;
      for (let row = 0; row < h / bh; row++) {
        const off = row % 2 ? bw / 2 : 0;
        for (let x = -off; x < w; x += bw) {
          const t = r();
          ctx.fillStyle = `rgb(${150 + t * 50}, ${70 + t * 30}, ${50 + t * 20})`;
          ctx.fillRect(x + 3, row * bh + 3, bw - 6, bh - 6);
          ctx.fillStyle = 'rgba(0,0,0,0.08)';
          ctx.fillRect(x + 3, row * bh + bh - 9, bw - 6, 6);
        }
      }
    }),
  plaster: (base = '#efe4d4') =>
    canvasTexture(`plaster|${base}`, 256, 256, (ctx, w, h) => {
      const r = rng(21);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1800; i++) {
        ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(90,60,30,0.05)';
        const s = 2 + r() * 8;
        ctx.fillRect(r() * w, r() * h, s, s);
      }
    }),
  marble: () =>
    canvasTexture('marble', 512, 512, (ctx, w, h) => {
      const r = rng(4);
      ctx.fillStyle = '#f2efe9';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        ctx.strokeStyle = `rgba(120,110,100,${0.08 + r() * 0.18})`;
        ctx.lineWidth = 0.5 + r() * 2.5;
        ctx.beginPath();
        let x = r() * w;
        let y = 0;
        ctx.moveTo(x, y);
        while (y < h) {
          x += (r() - 0.5) * 60;
          y += 20 + r() * 40;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }),
  fabric: (base) =>
    canvasTexture(`fabric|${base}`, 128, 128, (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.12;
      for (let i = 0; i < w; i += 3) {
        ctx.fillStyle = i % 6 ? '#000' : '#fff';
        ctx.fillRect(i, 0, 1, h);
        ctx.fillRect(0, i, w, 1);
      }
    }),
  stripes: (a, b, n = 8) =>
    canvasTexture(`stripes|${a}|${b}|${n}`, 256, 64, (ctx, w, h) => {
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = i % 2 ? b : a;
        ctx.fillRect((i * w) / n, 0, w / n, h);
      }
    }),
  /** Toasted / baked surface with darker speckles. */
  baked: (base, spot = '#6b3b16', density = 160) =>
    canvasTexture(`baked|${base}|${spot}|${density}`, 256, 256, (ctx, w, h) => {
      const r = rng(13);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < density; i++) {
        const x = r() * w;
        const y = r() * h;
        const rad = 2 + r() * 10;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, spot);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.25 + r() * 0.4;
        ctx.fillStyle = g;
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      ctx.globalAlpha = 1;
    }),
  grillMarks: (base) =>
    canvasTexture(`grill|${base}`, 256, 256, (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(50,22,8,0.75)';
      ctx.lineWidth = 9;
      for (let i = -w; i < w * 2; i += 46) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + h, h);
        ctx.stroke();
      }
    }),
  waffle: () =>
    canvasTexture('waffleCone', 128, 128, (ctx, w, h) => {
      ctx.fillStyle = '#d99a4e';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#a8662a';
      ctx.lineWidth = 4;
      for (let i = -w; i < w * 2; i += 22) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + h, h);
        ctx.moveTo(i + h, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
    }),
  latteArt: (base = '#b07a4a') =>
    canvasTexture(`latte|${base}`, 256, 256, (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f7ecdc';
      // Rosetta leaves
      for (let i = 0; i < 6; i++) {
        const y = 60 + i * 24;
        const s = 70 - i * 8;
        ctx.beginPath();
        ctx.ellipse(w / 2, y, s, 11, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.ellipse(w / 2, 52, 26, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(w / 2 - 2, 52, 4, 150);
    }),
  label: (key, lines, { bg = '#2a1d15', fg = '#f7f1e8', accent = '#e07a3f', font = 'Fraunces', w = 1024, h = 256, border = true } = {}) =>
    canvasTexture(`label|${key}`, w, h, (ctx) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      if (border) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = Math.max(4, h * 0.03);
        ctx.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((line, i) => {
        ctx.fillStyle = line.color || fg;
        ctx.font = `${line.weight || 600} ${line.size}px ${line.font || font}, Georgia, serif`;
        ctx.fillText(line.text, w / 2, line.y ?? h / 2 + (i - (lines.length - 1) / 2) * line.size * 1.2);
      });
    }),
  chalkboard: (key, title, rows) =>
    canvasTexture(`chalk|${key}`, 1024, 640, (ctx, w, h) => {
      ctx.fillStyle = '#26302b';
      ctx.fillRect(0, 0, w, h);
      const r = rng(2);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = `rgba(255,255,255,${r() * 0.03})`;
        ctx.fillRect(r() * w, r() * h, 6, 2);
      }
      ctx.fillStyle = '#f3ecd9';
      ctx.textAlign = 'center';
      ctx.font = '600 72px Fraunces, Georgia, serif';
      ctx.fillText(title, w / 2, 100);
      ctx.strokeStyle = '#e8a46b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, 130);
      ctx.lineTo(w * 0.7, 130);
      ctx.stroke();
      ctx.font = '500 40px Inter, Arial, sans-serif';
      rows.forEach((row, i) => {
        const y = 200 + i * 62;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#f3ecd9';
        ctx.fillText(row[0], 90, y);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#e8c27a';
        ctx.fillText(row[1], w - 90, y);
      });
    }),
  art: (key, palette) =>
    canvasTexture(`art|${key}`, 256, 320, (ctx, w, h) => {
      const r = rng(key);
      ctx.fillStyle = palette[0];
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = palette[1 + (i % (palette.length - 1))];
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        const kind = r();
        if (kind < 0.4) ctx.arc(r() * w, r() * h, 20 + r() * 70, 0, Math.PI * 2);
        else if (kind < 0.7) ctx.rect(r() * w * 0.8, r() * h * 0.8, 30 + r() * 90, 30 + r() * 120);
        else {
          ctx.moveTo(r() * w, r() * h);
          ctx.quadraticCurveTo(r() * w, r() * h, r() * w, r() * h);
          ctx.lineWidth = 10 + r() * 16;
          ctx.strokeStyle = ctx.fillStyle;
          ctx.stroke();
          continue;
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }),
};

/** Same texture image with a different tiling (clones share the uploaded image). */
export function repeated(texture, rx, ry) {
  return memo(`rep|${texture.uuid}|${rx}|${ry}`, () => {
    const t = texture.clone();
    t.repeat.set(rx, ry);
    t.needsUpdate = true;
    return t;
  });
}

export const DEG = Math.PI / 180;
