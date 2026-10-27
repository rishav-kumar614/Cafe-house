import * as THREE from 'three';
import { geo, mat, memo, tex, displaced, wobble, rng, M } from '../../kit.js';
import { part, Mesh, Scatter, scatterDisc, scatterDome, Plate, Bowl, Whip, blob, leafGeometry, leafMat, counter } from '../shapes.jsx';

function Scoop({ color, p, s = 1 }) {
  const g = displaced('scoop', geo.ico(0.3, 3), (v) => {
    if (v.y < -0.1) v.y = -0.1 + (v.y + 0.1) * 0.3;
    v.multiplyScalar(1 + wobble(v.x, v.y, v.z, 14) * 0.04);
  });
  return <Mesh g={g} m={mat(color, { roughness: 0.55 })} p={p} s={s} />;
}

export function brownie(params, q) {
  const n = counter(q);
  const block = displaced('brownie', geo.rbox(0.6, 0.32, 0.6, 0.04, 3), (v) => {
    if (v.y > 0.1) v.y += wobble(v.x, 0, v.z, 12) * 0.02;
  });
  const top = mat('#ffffff', { map: tex.baked('#3a1d10', '#1e0d06', 80), roughness: 0.35 });
  return {
    parts: [
      part('plate', null, <Plate r={1.05} />, { anim: 'none' }),
      part('brownie', 'Fudgy dark-chocolate brownie', <Scatter g={block} m={top} items={[{ p: [-0.22, 0.2, 0.05], r: [0, 0.3, 0] }, { p: [0.3, 0.2, -0.12], r: [0, -0.4, 0] }]} />, { explode: [0, 0.35, 0] }),
      part('walnut', 'Walnuts', <Scatter g={geo.dodeca(0.05, 0)} m={mat('#a8743a', { roughness: 0.6 })} items={scatterDisc('walnut', n(8), 0.45, 0.38, { s: 1, tilt: 2 })} />, { explode: [0, 0.75, 0], anim: 'pop', labelSide: 1 }),
      part('sugar', 'Cocoa dusting', <Scatter g={geo.box(0.02, 0.005, 0.02)} m={mat('#f4efe6')} items={scatterDisc('dust', n(70), 0.6, 0.37, { s: 1 })} />, { explode: [0, 1.0, 0], anim: 'pop' }),
    ],
    height: 0.5,
    radius: 1.0,
    anim: 'Slice the brownie',
  };
}

export function cheesecake(params, q) {
  const n = counter(q);
  const wedge = (r, h) => geo.cyl(r, r, h, 24, false, 0, Math.PI / 3.2);
  const berries = scatterDisc('ccBerries', n(6), 0.18, 0, { s: 1 }).map((b) => ({ ...b, p: [b.p[0] + 0.45, 0, b.p[2] + 0.25] }));
  return {
    parts: [
      part('plate', null, <Plate r={1.05} />, { anim: 'none' }),
      part('base', 'Biscuit base', <Mesh g={wedge(0.9, 0.1)} m={mat('#ffffff', { map: tex.baked('#b8803e', '#6b3a12', 120), roughness: 0.85 })} p={[0, 0.05, 0]} />, { pos: [-0.35, 0.05, -0.2], explode: [0, 0, 0] }),
      part('cheese', 'Vanilla cream cheese', <Mesh g={wedge(0.88, 0.4)} m={mat('#f4e3b8', { roughness: 0.45 })} p={[0, 0.2, 0]} />, { pos: [-0.35, 0.15, -0.2], explode: [0, 0.3, 0], labelSide: 1 }),
      part('compote', 'Berry compote', <Mesh g={wedge(0.89, 0.05)} m={M.glossy('#9a1a2a')} p={[0, 0.025, 0]} />, { pos: [-0.35, 0.55, -0.2], explode: [0, 0.6, 0], anim: 'spread' }),
      part('berries', 'Fresh berries', <Scatter g={geo.sphere(0.07, 12, 10)} m={M.glossy('#7a1028')} items={berries} />, { pos: [-0.35, 0.65, -0.2], explode: [0, 0.9, 0], anim: 'pop', labelSide: 1 }),
    ],
    height: 0.8,
    radius: 1.0,
    anim: 'Plate the cheesecake',
  };
}

export function tiramisu() {
  const layers = [
    ['Coffee-soaked sponge', '#8a5a33', 0.14],
    ['Mascarpone-style cream', '#f3e6cf', 0.12],
    [null, '#8a5a33', 0.14],
    [null, '#f3e6cf', 0.12],
  ];
  const parts = [part('plate', null, <Plate r={1.0} />, { anim: 'none' })];
  let y = 0.05;
  layers.forEach(([label, color, h], i) => {
    parts.push(part(`l${i}`, label, <Mesh g={geo.box(0.75, h, 0.75)} m={mat(color, { roughness: 0.65 })} p={[0, h / 2, 0]} />, { pos: [0, y, 0], explode: [0, i * 0.22, 0], labelSide: i % 2 }));
    y += h;
  });
  parts.push(part('cocoa', 'Cocoa dusting', <Mesh g={geo.box(0.76, 0.02, 0.76)} m={mat('#ffffff', { map: tex.baked('#5a3420', '#2a140a', 300), roughness: 0.95 })} p={[0, 0.01, 0]} />, { pos: [0, y, 0], explode: [0, 0.95, 0], anim: 'spread' }));
  parts.push(part('beans', 'Espresso beans', <Scatter g={memo('beanGeo', () => new THREE.SphereGeometry(0.05, 10, 8).scale(1, 0.6, 0.75))} m={M.glossy('#2a160c')} items={[{ p: [0.1, 0, 0.05] }, { p: [-0.12, 0, -0.08], r: [0, 1, 0] }]} />, { pos: [0, y + 0.04, 0], explode: [0, 1.2, 0], anim: 'pop', labelSide: 1 }));
  return { parts, height: y + 0.2, radius: 0.95, anim: 'Layer the tiramisu' };
}

export function lavaCake() {
  const cake = geo.cyl(0.38, 0.45, 0.5, 40);
  const lava = blob('lava', 0.45, 0.12, 0.2);
  return {
    parts: [
      part('plate', null, <Plate r={1.05} color="#f4efe6" />, { anim: 'none' }),
      part('lava', 'Molten chocolate centre', <Mesh g={lava} m={mat('#3a1408', { roughness: 0.12 })} p={[0.25, 0.05, 0.25]} />, { explode: [0.4, 0, 0.3], anim: 'spread', at: 1.0 }),
      part('cake', 'Warm chocolate cake', <Mesh g={cake} m={mat('#ffffff', { map: tex.baked('#3a1d10', '#1a0a04', 120), roughness: 0.7 })} p={[0, 0.3, 0]} />, { explode: [0, 0.35, 0], at: 0 }),
      part('sugar', 'Powdered sugar', <Scatter g={geo.box(0.02, 0.005, 0.02)} m={mat('#ffffff')} items={scatterDisc('lavaSugar', 60, 0.36, 0.56, { s: 1 })} />, { explode: [0, 0.8, 0], anim: 'pop', labelSide: 1 }),
      part('berry', 'Raspberry & mint', <group><Mesh g={geo.ico(0.07, 2)} m={M.glossy('#c41e3a')} p={[0, 0.62, 0]} /><Mesh g={leafGeometry()} m={leafMat('#3f8f3a')} p={[0.05, 0.62, 0]} s={0.5} /></group>, { explode: [0, 1.1, 0], anim: 'pop' }),
    ],
    height: 0.8,
    radius: 1.0,
    anim: 'Cut into the lava cake',
  };
}

export function waffle(params, q) {
  const n = counter(q);
  const waffleMat = mat('#ffffff', { map: tex.baked('#d99a45', '#9a5a1a', 60), roughness: 0.55 });
  const ridges = [];
  for (let i = 0; i < 6; i++) {
    const o = -0.5 + i * 0.2;
    ridges.push({ p: [o, 0.11, 0], s: [1, 1, 1] });
    ridges.push({ p: [0, 0.11, o], r: [0, Math.PI / 2, 0] });
  }
  return {
    parts: [
      part('plate', null, <Plate r={1.1} />, { anim: 'none' }),
      part('waffle', 'Belgian-style waffle', <group><Mesh g={geo.rbox(1.1, 0.1, 1.1, 0.04)} m={waffleMat} p={[0, 0.05, 0]} /><Scatter g={geo.box(0.05, 0.07, 1.08)} m={waffleMat} items={ridges} /></group>, { pos: [0, 0.05, 0], rot: [0, 0.4, 0], explode: [0, 0.2, 0] }),
      part('syrup', 'Syrup', <Mesh g={blob('waffleSyrup', 0.4, 0.06, 0.25)} m={mat('#b8661a', { roughness: 0.1, transparent: true, opacity: 0.9 })} p={[0, 0.2, 0]} />, { explode: [0, 0.55, 0], anim: 'spread', labelSide: 1 }),
      part('topping', 'Berries & cream', <group><Whip r={0.14} layers={3} p={[0, 0.22, 0]} /><Scatter g={geo.sphere(0.06, 12, 10)} m={M.glossy('#7a1028')} items={scatterDisc('waffleBerry', n(6), 0.35, 0.24, { minR: 0.18, s: 1 })} /></group>, { explode: [0, 0.95, 0], anim: 'pop' }),
    ],
    height: 0.6,
    radius: 1.05,
    anim: 'Top the waffle',
  };
}

export function pancakes(params, q) {
  const n = counter(q);
  const cake = displaced('pancake', geo.cyl(0.55, 0.55, 0.11, 40), (v) => {
    const a = Math.atan2(v.z, v.x);
    const k = 1 + Math.sin(a * 5) * 0.02;
    v.x *= k;
    v.z *= k;
  });
  const cakeMat = mat('#ffffff', { map: tex.baked('#d9a050', '#9a5a1a', 30), roughness: 0.6 });
  const parts = [part('plate', null, <Plate r={1.05} />, { anim: 'none' })];
  for (let i = 0; i < 4; i++) {
    parts.push(part(`cake${i}`, i === 0 ? 'Fluffy pancakes' : null, <Mesh g={cake} m={cakeMat} r={[0, i, 0]} />, { pos: [0, 0.1 + i * 0.12, 0], explode: [0, i * 0.18, 0] }));
  }
  parts.push(part('syrup', 'Syrup', <group><Mesh g={geo.cyl(0.5, 0.52, 0.03, 40)} m={mat('#b8661a', { roughness: 0.1, transparent: true, opacity: 0.85 })} /><Scatter g={geo.capsule(0.03, 0.12, 4, 8)} m={mat('#b8661a', { roughness: 0.1 })} items={[0, 1.7, 3.6, 5].map((a) => ({ p: [Math.cos(a) * 0.53, -0.06, Math.sin(a) * 0.53] }))} /></group>, { pos: [0, 0.57, 0], explode: [0, 0.9, 0], anim: 'spread', labelSide: 1 }));
  parts.push(part('butter', 'Butter & berries', <group><Mesh g={geo.rbox(0.18, 0.1, 0.18, 0.03)} m={M.glossy('#f6dc7a')} r={[0, 0.6, 0]} /><Scatter g={geo.sphere(0.05, 10, 8)} m={M.glossy('#2b2c6a')} items={scatterDisc('pcBerry', n(5), 0.3, 0, { minR: 0.15, s: 1 })} /></group>, { pos: [0, 0.65, 0], explode: [0, 1.25, 0], anim: 'pop' }));
  return { parts, height: 0.85, radius: 1.0, anim: 'Stack the pancakes' };
}

export function iceCream() {
  const cone = geo.cone(0.28, 0.9, 32, true);
  return {
    parts: [
      part('cone', 'Waffle cone', <Mesh g={cone} m={mat('#ffffff', { map: tex.waffle(), roughness: 0.7, side: THREE.DoubleSide })} p={[0, 0.45, 0]} r={[Math.PI, 0, 0]} />, { anim: 'pop' }),
      part('scoop1', 'Ice cream', <Scoop color="#f6eedb" p={[0, 0, 0]} />, { pos: [0, 0.98, 0], explode: [0, 0.35, 0] }),
      part('scoop2', null, <Scoop color="#5a3020" p={[0, 0, 0]} s={0.9} />, { pos: [0.02, 1.38, 0], explode: [0, 0.7, 0] }),
    ],
    height: 1.7,
    radius: 0.6,
    anim: 'Scoop the ice cream',
  };
}

export function sundae(params, q) {
  const n = counter(q);
  const glass = geo.lathe('sundaeGlass', [[0, 0], [0.32, 0], [0.32, 0.04], [0.07, 0.1], [0.06, 0.3], [0.3, 0.42], [0.55, 0.7], [0.62, 1.0], [0.6, 1.01], [0.52, 0.72], [0.28, 0.46], [0, 0.4]], 40);
  const nuts = scatterDome('sundaeNuts', n(24), 0.4, 0.35, 0.4, { y0: 1.3, maxPolar: 1.1, s: 1 });
  const drizzle = memo('sundaeDrizzle', () => {
    const r = rng('drz');
    return Array.from({ length: 4 }, (_, i) => {
      const pts = [];
      for (let k = 0; k <= 10; k++) {
        const a = k * 0.6 + i * 1.5;
        const rad = 0.35 - k * 0.02;
        pts.push(new THREE.Vector3(Math.cos(a) * rad, 1.32 - k * 0.04 + r() * 0.02, Math.sin(a) * rad));
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.025, 6, false);
    });
  });
  return {
    parts: [
      part('glass', 'Sundae glass', <Mesh g={glass} m={M.glassThick()} cast={false} />, { anim: 'none' }),
      part('scoops', 'Three scoops', <group><Scoop color="#f6eedb" p={[-0.18, 1.0, 0.05]} s={0.85} /><Scoop color="#f2a1b3" p={[0.2, 1.0, -0.05]} s={0.85} /><Scoop color="#5a3020" p={[0, 1.22, 0]} s={0.8} /></group>, { explode: [0, 0.4, 0] }),
      part('sauce', 'Chocolate sauce', <group>{drizzle.map((g, i) => <Mesh key={i} g={g} m={M.glossy('#2a120a')} />)}</group>, { explode: [0, 0.8, 0], anim: 'pop', labelSide: 1 }),
      part('whip', 'Whipped cream & nuts', <group><Whip r={0.2} layers={4} p={[0, 1.42, 0]} /><Scatter g={geo.dodeca(0.03, 0)} m={mat('#c48a4a')} items={nuts} /></group>, { explode: [0, 1.2, 0], anim: 'pop' }),
      part('cherry', 'Cherry', <group><Mesh g={geo.sphere(0.08, 16, 12)} m={M.glossy('#b0101e')} p={[0, 1.86, 0]} /><Mesh g={geo.cyl(0.008, 0.008, 0.2, 6)} m={mat('#4a6a2a')} p={[0.03, 1.98, 0]} r={[0, 0, -0.4]} /></group>, { explode: [0, 1.6, 0], anim: 'drop', labelSide: 1 }),
    ],
    height: 2.0,
    radius: 0.8,
    anim: 'Build the sundae',
  };
}

export function fruitBowl(params, q) {
  const n = counter(q);
  const fruit = [
    ['Watermelon', geo.rbox(0.13, 0.13, 0.13, 0.02), '#e8484a'],
    ['Kiwi', geo.cyl(0.1, 0.1, 0.04, 16), '#8cbf3a'],
    ['Banana', geo.cyl(0.09, 0.09, 0.05, 16), '#f4e7b0'],
    ['Grapes', geo.sphere(0.07, 12, 10), '#6a2a6a'],
    ['Orange', geo.sphere(0.12, 16, 12, 0, Math.PI), '#f39c2b'],
  ];
  const parts = [part('bowl', null, <Bowl r={0.95} h={0.45} m={M.glassThick()} />, { anim: 'none' })];
  fruit.forEach(([label, g, color], i) => {
    const items = scatterDome(`fruit${i}`, n(9), 0.55, 0.3, 0.55, { y0: 0.18, maxPolar: 1.3, s: 1 });
    parts.push(part(`f${i}`, label, <Scatter g={g} m={M.glossy(color)} items={items} />, { explode: [0, 0.3 + i * 0.25, 0], anim: 'drop', labelSide: i % 2 }));
  });
  parts.push(part('cream', 'Cream', <Whip r={0.16} layers={3} p={[0, 0.5, 0]} />, { explode: [0, 1.65, 0], anim: 'pop' }));
  return { parts, height: 0.8, radius: 1.0, anim: 'Fill the fruit bowl' };
}
