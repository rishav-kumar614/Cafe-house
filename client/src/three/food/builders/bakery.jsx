import * as THREE from 'three';
import { geo, mat, memo, tex, displaced, wobble, rng, M } from '../../kit.js';
import { part, Mesh, Scatter, scatterDisc, scatterDome, Plate, Whip, counter } from '../shapes.jsx';

export function croissant() {
  const glaze = mat('#ffffff', { map: tex.baked('#c8792e', '#6b3010', 90), roughness: 0.3 });
  // Overlapping lobes along an arc give the laminated crescent silhouette.
  const lobes = Array.from({ length: 7 }, (_, i) => {
    const t = i / 6 - 0.5;
    const a = t * 2.3;
    const size = 1 - Math.abs(t) * 1.15;
    return { p: [Math.sin(a) * 0.62, 0.12 + size * 0.1, -Math.cos(a) * 0.62 + 0.6], r: [0, -a, 0.15], s: [0.55 * (0.5 + size), 0.35 * (0.6 + size), 0.42 * (0.6 + size)] };
  });
  return {
    parts: [
      part('plate', null, <Plate r={1.1} />, { anim: 'none' }),
      part('croissant', 'Laminated butter pastry', <Scatter g={geo.sphere(0.5, 24, 16)} m={glaze} items={lobes} />, { pos: [0, 0.04, -0.15], explode: [0, 0.4, 0], anim: 'spin' }),
    ],
    height: 0.5,
    radius: 1.0,
    anim: 'Bake the croissant',
  };
}

export function muffin(params = {}, q) {
  const n = counter(q);
  const choc = params.flavor !== 'blueberry';
  const cup = displaced('muffinCup', geo.cyl(0.42, 0.32, 0.45, 48, true), (v) => {
    const a = Math.atan2(v.z, v.x);
    const k = 1 + Math.sin(a * 24) * 0.025;
    v.x *= k;
    v.z *= k;
  });
  const top = displaced(`muffinTop${choc}`, geo.sphere(0.52, 40, 20, 0, Math.PI * 2, 0, Math.PI / 1.7), (v) => {
    v.y *= 0.75;
    v.multiplyScalar(1 + wobble(v.x, v.y, v.z, 9) * 0.05);
  });
  const dots = scatterDome(`muffinDots${choc}`, n(choc ? 24 : 14), 0.5, 0.38, 0.5, { maxPolar: 1.3, s: 1, lift: -0.01 });
  return {
    parts: [
      part('plate', null, <Plate r={0.95} />, { anim: 'none' }),
      part('cup', 'Paper cup', <Mesh g={cup} m={mat(choc ? '#7a4a2a' : '#f4ecdc', { roughness: 0.8, side: THREE.DoubleSide })} p={[0, 0.27, 0]} />, { anim: 'pop' }),
      part('top', choc ? 'Cocoa sponge' : 'Vanilla sponge', <Mesh g={top} m={mat('#ffffff', { map: tex.baked(choc ? '#4a2a1a' : '#e3b56a', choc ? '#2a140a' : '#a8662a', 60), roughness: 0.65 })} />, { pos: [0, 0.45, 0], explode: [0, 0.45, 0], anim: 'rise' }),
      part('dots', choc ? 'Chocolate chips' : 'Blueberries', <Scatter g={geo.sphere(choc ? 0.035 : 0.05, 10, 8)} m={M.glossy(choc ? '#24130a' : '#2b2c6a')} items={dots} />, { pos: [0, 0.45, 0], explode: [0, 0.85, 0], anim: 'pop', labelSide: 1 }),
    ],
    height: 0.9,
    radius: 0.9,
    anim: 'Bake the muffin',
  };
}

export function cookies(params, q) {
  const n = counter(q);
  const cookie = displaced('cookie', geo.cyl(0.38, 0.4, 0.09, 40), (v) => {
    const a = Math.atan2(v.z, v.x);
    const k = 1 + Math.sin(a * 7) * 0.03 + Math.sin(a * 13) * 0.015;
    v.x *= k;
    v.z *= k;
    if (v.y > 0) v.y += wobble(v.x, 0, v.z, 10) * 0.012;
  });
  const placed = [
    { p: [-0.3, 0.1, 0.1], r: [0, 0, 0] },
    { p: [0.35, 0.1, -0.1], r: [0, 1, 0] },
    { p: [0.02, 0.22, 0.05], r: [0.15, 2, 0.1] },
  ];
  const chips = placed.flatMap((c, i) => scatterDisc(`chips${i}`, n(9), 0.3, 0, { s: 1 }).map((d) => ({ ...d, p: [c.p[0] + d.p[0], c.p[1] + 0.05 + d.p[2] * c.r[0], c.p[2] + d.p[2]] })));
  return {
    parts: [
      part('plate', null, <Plate r={1.05} />, { anim: 'none' }),
      part('cookies', 'Brown-butter cookies', <Scatter g={cookie} m={mat('#ffffff', { map: tex.baked('#c98a45', '#7a4a1a', 100), roughness: 0.75 })} items={placed} />, { explode: [0, 0.3, 0] }),
      part('chips', 'Chocolate chips', <Scatter g={geo.rbox(0.07, 0.05, 0.07, 0.02)} m={M.glossy('#2a140a')} items={chips} />, { explode: [0, 0.7, 0], anim: 'pop', labelSide: 1 }),
    ],
    height: 0.4,
    radius: 1.0,
    anim: 'Bake the cookies',
  };
}

export function cinnamonRoll() {
  const spiral = memo('cinnamonSpiral', () => {
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const t = i / 200;
      const a = t * Math.PI * 2 * 3.2;
      const r = 0.06 + t * 0.48;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 260, 0.1, 10, false);
  });
  const icing = memo('icingDrizzle', () => {
    const r = rng('icing');
    return Array.from({ length: 5 }, () => {
      const pts = [];
      const z0 = (r() - 0.5) * 0.8;
      for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector3(-0.55 + i * 0.14, 0.05 + Math.sin(i) * 0.02, z0 + Math.sin(i * 1.7 + r() * 3) * 0.12));
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.025, 6, false);
    });
  });
  const icingMat = mat('#fbf6ee', { roughness: 0.3 });
  return {
    parts: [
      part('plate', null, <Plate r={1.05} />, { anim: 'none' }),
      part('roll', 'Cinnamon-sugar swirl', <Mesh g={spiral} m={mat('#ffffff', { map: tex.baked('#d39a55', '#7a3a12', 120), roughness: 0.55 })} s={[1, 1.7, 1]} />, { pos: [0, 0.22, 0], explode: [0, 0.3, 0], anim: 'spin' }),
      part('icing', 'Cream cheese icing', <group>{icing.map((g, i) => <Mesh key={i} g={g} m={icingMat} />)}</group>, { pos: [0, 0.36, 0], explode: [0, 0.75, 0], anim: 'pop', labelSide: 1 }),
    ],
    height: 0.6,
    radius: 1.0,
    anim: 'Swirl & ice',
  };
}

const GLAZE = { chocolate: '#4a2414', strawberry: '#f08aa8', sugar: '#f4e3c0' };

export function donut(params = {}, q) {
  const n = counter(q);
  const glazeColor = GLAZE[params.glaze] || GLAZE.chocolate;
  const sprinkles = scatterDome('sprinkles', n(70), 0.62, 0.2, 0.62, { maxPolar: 1.3, s: 1, colors: ['#f2c14e', '#5fb3d9', '#e8584a', '#f7f1e8', '#7ac36a'] })
    .filter((s) => Math.hypot(s.p[0], s.p[2]) > 0.22)
    .map((s) => ({ ...s, p: [s.p[0], 0.2, s.p[2]] }));
  return {
    parts: [
      part('plate', null, <Plate r={1.05} />, { anim: 'none' }),
      part('dough', 'Fried dough ring', <Mesh g={geo.torus(0.42, 0.22, 20, 48)} m={mat('#ffffff', { map: tex.baked('#d9a05a', '#a8662a', 40), roughness: 0.6 })} r={[Math.PI / 2, 0, 0]} s={[1, 1, 0.85]} />, { pos: [0, 0.22, 0], explode: [0, 0.2, 0] }),
      part('glaze', 'Glaze', <Mesh g={geo.torus(0.42, 0.205, 20, 48)} m={M.glossy(glazeColor)} r={[Math.PI / 2, 0, 0]} s={[1.01, 1.01, 0.62]} />, { pos: [0, 0.3, 0], explode: [0, 0.6, 0], anim: 'spread', labelSide: 1 }),
      part('sprinkles', 'Sprinkles', <Scatter g={geo.capsule(0.012, 0.05, 2, 6)} m={mat('#ffffff', { roughness: 0.4 })} items={sprinkles.map((s) => ({ ...s, r: [Math.PI / 2, 0, s.r[1]] }))} />, { pos: [0, 0.2, 0], explode: [0, 1.0, 0], anim: 'pop' }),
    ],
    height: 0.6,
    radius: 1.0,
    anim: 'Glaze the donut',
  };
}

const PASTRY = {
  chocolate: { sponge: '#4a2618', cream: '#6b3a22', top: '#2a140a', label: 'Chocolate truffle', topper: '#3a1a0c' },
  pineapple: { sponge: '#f2d9a0', cream: '#f8f1dc', top: '#f5d04a', label: 'Pineapple cream', topper: '#c7362a' },
  redvelvet: { sponge: '#a8242a', cream: '#f6efe4', top: '#f6efe4', label: 'Red velvet', topper: '#a8242a' },
};

export function pastry(params = {}) {
  const p = PASTRY[params.flavor] || PASTRY.chocolate;
  const layers = [
    ['sponge', 'Sponge', p.sponge, 0.16],
    ['cream', 'Cream', p.cream, 0.07],
    ['sponge', null, p.sponge, 0.16],
    ['cream', null, p.cream, 0.07],
  ];
  const parts = [part('plate', null, <Plate r={0.95} />, { anim: 'none' })];
  let y = 0.05;
  layers.forEach(([kind, label, color, h], i) => {
    parts.push(part(`l${i}`, label, <Mesh g={geo.box(0.7, h, 0.55)} m={mat(color, { roughness: kind === 'cream' ? 0.4 : 0.75 })} p={[0, h / 2, 0]} />, { pos: [0, y, 0], explode: [0, i * 0.2, 0], labelSide: i % 2 }));
    y += h;
  });
  parts.push(part('top', `${p.label} frosting`, <Mesh g={geo.rbox(0.72, 0.06, 0.57, 0.02)} m={M.glossy(p.top)} p={[0, 0.03, 0]} />, { pos: [0, y, 0], explode: [0, 0.85, 0], anim: 'spread' }));
  parts.push(
    part(
      'decor',
      'Decoration',
      <group>
        <Whip r={0.08} layers={3} color={p.cream === '#6b3a22' ? '#f6efe4' : p.cream} p={[0, 0, 0]} />
        <Mesh g={geo.sphere(0.06, 14, 10)} m={M.glossy(p.topper)} p={[0, 0.16, 0]} />
      </group>,
      { pos: [0, y + 0.06, 0], explode: [0, 1.1, 0], anim: 'pop', labelSide: 1 }
    )
  );
  return { parts, height: y + 0.35, radius: 0.9, anim: 'Layer the pastry' };
}
