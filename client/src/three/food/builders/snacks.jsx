import * as THREE from 'three';
import { geo, mat, memo, tex, displaced, wobble, rng, M } from '../../kit.js';
import { part, Mesh, Scatter, scatterDisc, Plate, DipBowl, blob, counter } from '../shapes.jsx';

export function fries(params = {}, q) {
  const n = counter(q);
  const style = params.style || 'plain';
  const loaded = style === 'loaded';
  const r = rng(`fries${style}`);
  const sticks = Array.from({ length: n(34) }, () => {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * (loaded ? 0.55 : 0.3);
    return loaded
      ? { p: [Math.cos(a) * d, 0.18 + r() * 0.15, Math.sin(a) * d], r: [Math.PI / 2 + (r() - 0.5) * 0.6, 0, r() * Math.PI] }
      : { p: [Math.cos(a) * d * 1.3, 0.75 + r() * 0.35, Math.sin(a) * d * 0.7], r: [(r() - 0.5) * 0.45, r() * 3, (r() - 0.5) * 0.45] };
  });
  const friesMat = mat('#ffffff', { map: tex.baked('#e8b552', style === 'peri' ? '#c7362a' : '#b8742a', style === 'peri' ? 200 : 40), roughness: 0.6 });
  const carton = geo.custom('friesCarton', () => {
    const g = new THREE.CylinderGeometry(0.55, 0.4, 0.95, 4, 1, true);
    g.rotateY(Math.PI / 4);
    g.scale(1, 1, 0.55);
    return g;
  });
  const parts = [part('plate', null, <Plate r={1.1} color="#f3ede4" />, { anim: 'none' })];
  if (loaded) {
    parts.push(part('fries', 'Crisp fries', <Scatter g={geo.box(0.07, 0.55, 0.07)} m={friesMat} items={sticks} />, { pos: [0, 0.02, 0], explode: [0, 0.3, 0] }));
    parts.push(part('cheese', 'Cheese sauce', <Mesh g={blob('loadedCheese', 0.5, 0.18, 0.15)} m={M.glossy('#f2b233')} p={[0, 0.38, 0]} />, { explode: [0, 0.7, 0], anim: 'spread', labelSide: 1 }));
    parts.push(part('jalapeno', 'Jalapeños & spring onion', <Scatter g={geo.torus(0.05, 0.02, 6, 14)} m={mat('#4f9a35', { roughness: 0.35 })} items={scatterDisc('jal', n(12), 0.45, 0.45, { s: 1, tilt: 0.8 }).map((j) => ({ ...j, r: [Math.PI / 2 + j.r[0], 0, j.r[2]] }))} />, { explode: [0, 1.05, 0], anim: 'pop' }));
  } else {
    parts.push(part('carton', null, <Mesh g={carton} m={mat('#ffffff', { map: tex.stripes('#c4362a', '#c4362a', 2), roughness: 0.6, side: THREE.DoubleSide })} p={[0, 0.52, 0]} />, { anim: 'none' }));
    parts.push(part('fries', style === 'peri' ? 'Fries with peri-peri dust' : 'Salted fries', <Scatter g={geo.box(0.07, 0.6, 0.07)} m={friesMat} items={sticks} />, { explode: [0, 0.5, 0], anim: 'rise' }));
    parts.push(part('dip', 'Dip', <DipBowl color={style === 'peri' ? '#f4efe4' : '#c7362a'} p={[0.72, 0.05, 0.45]} r={0.22} />, { explode: [0.3, 0.2, 0.2], anim: 'pop', labelSide: 1 }));
  }
  return { parts, height: loaded ? 0.6 : 1.3, radius: 1.1, anim: 'Fry & serve' };
}

function chipGeometry() {
  return memo('nachoChip', () => {
    const s = new THREE.Shape();
    s.moveTo(-0.16, -0.12);
    s.lineTo(0.16, -0.12);
    s.lineTo(0, 0.18);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.015, bevelEnabled: false });
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) + pos.getX(i) ** 2 * 0.8);
    g.computeVertexNormals();
    return g;
  });
}

export function nachos(params, q) {
  const n = counter(q);
  const r = rng('nachos');
  const chips = Array.from({ length: n(40) }, () => {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 0.75;
    return { p: [Math.cos(a) * d, 0.1 + (0.75 - d) * 0.35 + r() * 0.06, Math.sin(a) * d], r: [r() * 1.4 - 0.7 - Math.PI / 2, r() * 6, r() * 1.4 - 0.7] };
  });
  return {
    parts: [
      part('plate', null, <Plate r={1.25} color="#2f2c2a" />, { anim: 'none' }),
      part('chips', 'Corn tortilla chips', <Scatter g={chipGeometry()} m={mat('#ffffff', { map: tex.baked('#e5b04a', '#9a5a1a', 50), roughness: 0.6 })} items={chips} />, { explode: [0, 0.3, 0], anim: 'drop' }),
      part('cheese', 'Cheese sauce', <Scatter g={blob('nachoCheese', 0.18, 0.4, 0.2)} m={M.glossy('#f2b233')} items={scatterDisc('nc', n(7), 0.5, 0.3, { s: 1 })} />, { explode: [0, 0.65, 0], anim: 'pop', labelSide: 1 }),
      part('salsa', 'Salsa & jalapeños', <Scatter g={geo.rbox(0.07, 0.05, 0.07, 0.015)} m={M.glossy('#c7362a')} items={scatterDisc('ns', n(24), 0.55, 0.34, { s: 1, tilt: 1, colors: ['#c7362a', '#c7362a', '#4f9a35'] })} />, { explode: [0, 0.95, 0], anim: 'pop' }),
      part('cream', 'Sour cream', <Mesh g={blob('sourCream', 0.15, 0.7, 0.1)} m={mat('#f8f4ec', { roughness: 0.35 })} p={[0, 0.4, 0]} />, { explode: [0, 1.25, 0], anim: 'pop', labelSide: 1 }),
    ],
    height: 0.6,
    radius: 1.25,
    anim: 'Load the nachos',
  };
}

export function onionRings() {
  const ring = displaced('onionRing', geo.torus(0.27, 0.085, 12, 32), (v) => v.multiplyScalar(1 + wobble(v.x, v.y, v.z, 20) * 0.03));
  const rings = [
    { p: [-0.3, 0.12, 0.1], r: [Math.PI / 2, 0, 0] },
    { p: [0.25, 0.12, -0.1], r: [Math.PI / 2, 0, 0] },
    { p: [0, 0.26, 0.05], r: [Math.PI / 2 + 0.25, 0.3, 0] },
    { p: [-0.1, 0.12, -0.5], r: [Math.PI / 2, 0, 0] },
    { p: [0.15, 0.4, 0.15], r: [Math.PI / 2 - 0.3, 0, 0.2] },
  ];
  return {
    parts: [
      part('plate', null, <Plate r={1.15} />, { anim: 'none' }),
      part('rings', 'Battered onion rings', <Scatter g={ring} m={mat('#ffffff', { map: tex.baked('#d99a45', '#8a4a12', 160), roughness: 0.55 })} items={rings} />, { explode: [0, 0.4, 0] }),
      part('dip', 'Dip', <DipBowl color="#f4efe4" p={[0.65, 0.05, 0.55]} r={0.22} />, { explode: [0.3, 0.2, 0.2], anim: 'pop', labelSide: 1 }),
    ],
    height: 0.6,
    radius: 1.15,
    anim: 'Fry the rings',
  };
}

export function nuggets(params, q) {
  const nug = displaced('nugget', geo.rbox(0.3, 0.14, 0.24, 0.07, 3), (v) => v.multiplyScalar(1 + wobble(v.x, v.y, v.z, 16) * 0.1));
  const r = rng('nuggets');
  const items = Array.from({ length: 7 }, (_, i) => ({ p: [Math.cos(i) * 0.4 * (i % 2 ? 1 : 0.5), 0.12 + (i > 4 ? 0.12 : 0), Math.sin(i) * 0.35], r: [r() * 0.3, r() * 3, r() * 0.3] }));
  return {
    parts: [
      part('plate', null, <Plate r={1.1} />, { anim: 'none' }),
      part('nuggets', 'Crumbed chicken nuggets', <Scatter g={nug} m={mat('#ffffff', { map: tex.baked('#d9a050', '#8a4a12', 200), roughness: 0.6 })} items={items} />, { explode: [0, 0.4, 0] }),
      part('dip', 'Dip', <DipBowl color="#d98a2a" p={[0.65, 0.05, 0.5]} r={0.22} />, { explode: [0.3, 0.2, 0.2], anim: 'pop', labelSide: 1 }),
    ],
    height: 0.5,
    radius: 1.1,
    anim: 'Fry the nuggets',
  };
}

export function cheeseBalls() {
  const ball = displaced('cheeseBall', geo.ico(0.18, 3), (v) => v.multiplyScalar(1 + wobble(v.x, v.y, v.z, 26) * 0.06));
  const items = [...Array.from({ length: 6 }, (_, i) => ({ p: [Math.cos(i * 1.047) * 0.38, 0.2, Math.sin(i * 1.047) * 0.38] })), { p: [0, 0.4, 0] }];
  return {
    parts: [
      part('plate', null, <Plate r={1.1} />, { anim: 'none' }),
      part('balls', 'Crisp cheese balls', <Scatter g={ball} m={mat('#ffffff', { map: tex.baked('#dca04a', '#8a4a12', 220), roughness: 0.55 })} items={items} />, { explode: [0, 0.4, 0] }),
      part('centre', 'Molten cheese centre', <Mesh g={geo.sphere(0.11, 16, 12)} m={M.glossy('#f6d26a')} p={[0, 0.8, 0]} />, { explode: [0.7, 0.4, 0], anim: 'none', hidden: true, labelSide: 1 }),
      part('dip', 'Dip', <DipBowl color="#c7362a" p={[0.68, 0.05, 0.5]} r={0.22} />, { explode: [0.3, 0.2, 0.2], anim: 'pop' }),
    ],
    height: 0.6,
    radius: 1.1,
    anim: 'Fry the cheese balls',
  };
}
