import * as THREE from 'three';
import { geo, mat, memo, tex, displaced, wobble, rng, M } from '../../kit.js';
import { part, Mesh, Scatter, scatterDisc, scatterDome, Plate, SteelPlate, Bowl, BowlFill, Katori, DipBowl, blob, leafGeometry, leafMat, counter } from '../shapes.jsx';

const grainGeo = () => memo('riceGrain', () => new THREE.SphereGeometry(0.028, 6, 5).scale(1, 0.6, 2.1));

function RiceMound({ r = 0.45, h = 0.3, seed = 'rice', count = 140, colors = ['#f7f2e6', '#f2ead6'] }) {
  const grains = scatterDome(seed, count, r, h, r, { maxPolar: 1.45, s: 1, colors });
  return (
    <group>
      <Mesh g={geo.sphere(r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2)} m={mat(colors[0], { roughness: 0.6 })} s={[1, h / r, 1]} />
      <Scatter g={grainGeo()} m={mat('#ffffff', { roughness: 0.5 })} items={grains} />
    </group>
  );
}

function Flatbread({ r = 0.42, color = '#e3b06a', spot = '#7a3a10', p, rot }) {
  const g = displaced(`roti${r}`, geo.cyl(r, r, 0.03, 32), (v) => {
    v.y += wobble(v.x, 0, v.z, 6) * 0.015;
  });
  return <Mesh g={g} m={mat('#ffffff', { map: tex.baked(color, spot, 120), roughness: 0.7 })} p={p} r={rot} />;
}

// ---------- Street food ----------

export function cholePlate(params = {}, q) {
  const n = counter(q);
  const bhatura = params.bread === 'bhatura';
  const chickpeas = scatterDisc('chickpeas', n(26), 0.24, 0.02, { s: 1, tilt: 3 });
  return {
    parts: [
      part('plate', null, <SteelPlate r={1.3} />, { anim: 'none' }),
      part(
        'chole',
        'Spiced chickpea curry',
        <Katori r={0.4} h={0.26} fill="#a8521f" p={[0.45, 0.04, 0.2]}>
          <Scatter g={geo.sphere(0.05, 10, 8)} m={mat('#c99a55', { roughness: 0.5 })} items={chickpeas} />
        </Katori>,
        { explode: [0.3, 0.4, 0], anim: 'pop', labelSide: 1 }
      ),
      bhatura
        ? part('bread', 'Puffed bhatura', <Mesh g={displaced('bhatura', geo.sphere(0.6, 32, 16), (v) => { v.y *= 0.42; v.multiplyScalar(1 + wobble(v.x, v.y, v.z, 4) * 0.05); })} m={mat('#ffffff', { map: tex.baked('#e8b86a', '#9a5a1a', 60), roughness: 0.5 })} p={[-0.45, 0.28, -0.1]} />, { explode: [-0.4, 0.6, 0] })
        : part('bread', 'Buttered kulcha', <group><Flatbread r={0.42} p={[-0.5, 0.08, -0.1]} rot={[0, 0, 0.05]} /><Flatbread r={0.42} p={[-0.45, 0.12, 0.05]} rot={[0.1, 1, 0]} /></group>, { explode: [-0.4, 0.5, 0] }),
      part('onion', 'Onion & pickle', <group><Scatter g={geo.torus(0.1, 0.02, 6, 16)} m={mat('#e8d4e8')} items={[{ p: [0.2, 0.06, -0.6], r: [Math.PI / 2, 0, 0] }, { p: [0.32, 0.07, -0.55], r: [Math.PI / 2, 0.3, 0] }]} /><Mesh g={geo.sphere(0.1, 12, 8)} m={M.glossy('#b8642a')} p={[0.6, 0.08, -0.4]} s={[1, 0.5, 1]} /></group>, { explode: [0.2, 0.9, -0.2], anim: 'pop' }),
    ],
    height: 0.6,
    radius: 1.3,
    anim: 'Serve it up',
  };
}

export function pavBhaji(params, q) {
  const n = counter(q);
  const pav = mat('#ffffff', { map: tex.baked('#d68f3e', '#7a3a10', 50), roughness: 0.35 });
  const onion = scatterDisc('pbOnion', n(30), 0.2, 0.02, { s: 1, tilt: 1 });
  return {
    parts: [
      part('plate', null, <SteelPlate r={1.3} />, { anim: 'none' }),
      part('bhaji', 'Buttery vegetable bhaji', <Mesh g={blob('bhaji', 0.55, 0.32, 0.08)} m={mat('#c4532a', { roughness: 0.35 })} p={[0.3, 0.04, 0.1]} />, { explode: [0.2, 0.3, 0], anim: 'spread' }),
      part('butter', 'Butter', <Mesh g={geo.rbox(0.18, 0.1, 0.18, 0.03)} m={M.glossy('#f6dc7a')} p={[0.3, 0.26, 0.1]} r={[0.1, 0.5, 0]} />, { explode: [0.2, 0.8, 0], anim: 'drop', labelSide: 1 }),
      part('pav', 'Toasted pav', <Scatter g={geo.rbox(0.42, 0.26, 0.42, 0.12, 4)} m={pav} items={[{ p: [-0.55, 0.17, -0.15], r: [0, 0.2, 0] }, { p: [-0.55, 0.17, 0.3], r: [0, 0.2, 0] }]} />, { explode: [-0.4, 0.5, 0] }),
      part('garnish', 'Onion, coriander & lemon', <group><Scatter g={geo.box(0.04, 0.04, 0.04)} m={mat('#efe3ef')} items={onion.map((o) => ({ ...o, p: [o.p[0] + 0.55, o.p[1] + 0.04, o.p[2] - 0.6] }))} /><Mesh g={geo.sphere(0.13, 16, 10, 0, Math.PI)} m={mat('#f2d23a', { roughness: 0.4 })} p={[0.85, 0.06, -0.35]} r={[Math.PI / 2, 0, 0.6]} /></group>, { explode: [0.4, 0.9, -0.2], anim: 'pop' }),
    ],
    height: 0.5,
    radius: 1.3,
    anim: 'Plate the pav bhaji',
  };
}

export function dosa() {
  const dosaMat = mat('#ffffff', { map: tex.baked('#d99a48', '#8a4a12', 260), roughness: 0.6, side: THREE.DoubleSide });
  const leaf = memo('bananaLeaf', () => {
    const s = new THREE.Shape();
    s.moveTo(-1.5, -0.7);
    s.quadraticCurveTo(0, -0.85, 1.5, -0.6);
    s.lineTo(1.6, 0.6);
    s.quadraticCurveTo(0, 0.8, -1.5, 0.7);
    s.closePath();
    const g = new THREE.ShapeGeometry(s, 12);
    g.rotateX(-Math.PI / 2);
    return g;
  });
  return {
    parts: [
      part('leaf', null, <Mesh g={leaf} m={mat('#3f8a3a', { roughness: 0.4, side: THREE.DoubleSide })} p={[0, 0.01, 0]} />, { anim: 'none' }),
      part('dosa', 'Crisp rice-lentil dosa', <group><Mesh g={geo.cyl(0.24, 0.24, 2.2, 32, true, 0, Math.PI * 1.75)} m={dosaMat} r={[0, 0, Math.PI / 2]} s={[1, 1, 0.75]} p={[0, 0.2, -0.15]} /></group>, { explode: [0, 0.4, 0], anim: 'slide' }),
      part('masala', 'Potato masala', <Mesh g={blob('dosaMasala', 0.25, 0.7, 0.1)} m={mat('#e8c34a', { roughness: 0.6 })} p={[0, 0.2, -0.15]} s={[2.4, 1, 1]} />, { explode: [0, 0.9, 0.2], anim: 'none', hidden: true, labelSide: 1 }),
      part('sambar', 'Sambar', <Katori r={0.3} h={0.22} fill="#b8642a" p={[-0.55, 0.01, 0.42]} />, { explode: [-0.3, 0.3, 0.3], anim: 'pop' }),
      part('chutney', 'Coconut chutney', <Katori r={0.26} h={0.2} fill="#f2ecda" p={[0.2, 0.01, 0.45]} />, { explode: [0.2, 0.3, 0.3], anim: 'pop', labelSide: 1 }),
    ],
    height: 0.6,
    radius: 1.5,
    anim: 'Roll the dosa',
  };
}

export function tikka(params = {}) {
  const chicken = params.protein === 'chicken';
  const proteinMat = mat('#ffffff', { map: tex.baked(chicken ? '#c4572b' : '#efcf9a', '#3a1406', 120), roughness: 0.5 });
  const pieces = [];
  const veg = [];
  [-0.25, 0.25].forEach((z, s) => {
    for (let i = 0; i < 6; i++) {
      const x = -0.75 + i * 0.3;
      if (i % 2 === 0) pieces.push({ p: [x, 0.3, z], r: [0, s + i * 0.3, 0.1] });
      else veg.push({ p: [x, 0.3, z], r: [0, i, 0], c: i % 4 === 1 ? '#3c8d2f' : '#e8d4e8' });
    }
  });
  return {
    parts: [
      part('plate', null, <Mesh g={geo.rbox(2.4, 0.08, 1.4, 0.04)} m={M.darkSteel()} p={[0, 0.04, 0]} />, { anim: 'none' }),
      part('skewers', null, <Scatter g={geo.cyl(0.015, 0.015, 2.3, 6)} m={M.steel()} items={[{ p: [0, 0.3, -0.25], r: [0, 0, Math.PI / 2] }, { p: [0, 0.3, 0.25], r: [0, 0, Math.PI / 2] }]} />, { anim: 'slide' }),
      part('protein', chicken ? 'Chicken tikka' : 'Chargrilled paneer', <Scatter g={chicken ? displaced('chickenChunk', geo.rbox(0.24, 0.22, 0.24, 0.06), (v) => v.multiplyScalar(1 + wobble(v.x, v.y, v.z, 12) * 0.1)) : geo.rbox(0.24, 0.24, 0.24, 0.04)} m={proteinMat} items={pieces} />, { explode: [0, 0.5, 0], anim: 'pop' }),
      part('veg', 'Capsicum & onion', <Scatter g={geo.rbox(0.2, 0.2, 0.06, 0.02)} m={mat('#ffffff', { roughness: 0.4 })} items={veg} />, { explode: [0, 0.9, 0], anim: 'pop', labelSide: 1 }),
      part('chutney', 'Mint chutney', <DipBowl color="#4f9a35" p={[0.85, 0.08, 0.6]} r={0.22} />, { explode: [0.2, 0.2, 0.3], anim: 'pop' }),
    ],
    height: 0.6,
    radius: 1.3,
    anim: 'Fire up the tandoor',
  };
}

const GRAVY = {
  dal: { color: '#5a2e1a', label: 'Black lentils', garnish: 'Butter & cream' },
  paneer: { color: '#d9682b', label: 'Tomato-butter gravy', garnish: 'Paneer, cream & coriander' },
  veg: { color: '#b8642a', label: 'Onion-tomato gravy', garnish: 'Seasonal vegetables' },
  rajma: { color: '#7a2a1c', label: 'Rajma curry', garnish: 'Kidney beans & coriander' },
  chole: { color: '#a8521f', label: 'Chole curry', garnish: 'Chickpeas & onion' },
};

export function curryBowl(params = {}, q) {
  const n = counter(q);
  const gravy = GRAVY[params.gravy] ? params.gravy : 'dal';
  const g = GRAVY[gravy];
  const pot = mat('#b8673f', { roughness: 0.3, metalness: 0.8 });
  let garnish;
  if (gravy === 'paneer') garnish = <Scatter g={geo.rbox(0.13, 0.11, 0.13, 0.02)} m={mat('#f6efe0', { roughness: 0.5 })} items={scatterDisc('cbPaneer', n(10), 0.45, 0.02, { s: 1, tilt: 0.4 })} />;
  else if (gravy === 'rajma') garnish = <Scatter g={geo.capsule(0.035, 0.05, 4, 8)} m={M.glossy('#5a1a12')} items={scatterDisc('cbRajma', n(24), 0.5, 0.02, { s: 1, tilt: 3 })} />;
  else if (gravy === 'veg') garnish = <Scatter g={geo.rbox(0.09, 0.07, 0.09, 0.02)} m={mat('#ffffff', { roughness: 0.5 })} items={scatterDisc('cbVeg', n(18), 0.5, 0.02, { s: 1, tilt: 1, colors: ['#e8823a', '#4f9a35', '#f2d6a0'] })} />;
  else if (gravy === 'chole') garnish = <Scatter g={geo.sphere(0.05, 10, 8)} m={mat('#c99a55')} items={scatterDisc('cbChole', n(22), 0.5, 0.02, { s: 1 })} />;
  else garnish = <group><Mesh g={geo.torus(0.25, 0.04, 8, 32, Math.PI * 1.6)} m={mat('#f6efe0', { roughness: 0.4 })} r={[Math.PI / 2, 0, 0]} p={[0, 0.02, 0]} /><Mesh g={geo.rbox(0.14, 0.07, 0.14, 0.02)} m={M.glossy('#f6dc7a')} p={[0.05, 0.05, 0.05]} /></group>;
  const coriander = scatterDisc('coriander', n(14), 0.5, 0.04, { s: 1 });
  const withRice = !!params.withRice;
  return {
    parts: [
      ...(withRice ? [part('plate', null, <Plate r={1.35} />, { anim: 'none' })] : []),
      part('pot', null, <group position={withRice ? [0.35, 0.04, 0] : [0, 0, 0]}><Bowl r={0.85} h={0.5} m={pot} /><Mesh g={geo.torus(0.12, 0.025, 8, 16, Math.PI)} m={pot} p={[0.92, 0.42, 0]} r={[0, Math.PI / 2, 0]} /><Mesh g={geo.torus(0.12, 0.025, 8, 16, Math.PI)} m={pot} p={[-0.92, 0.42, 0]} r={[0, -Math.PI / 2, 0]} /></group>, { anim: 'none' }),
      part('gravy', g.label, <group position={withRice ? [0.35, 0.04, 0] : [0, 0, 0]}><BowlFill r={0.85} h={0.5} level={0.78} color={g.color} bump={0.02} /></group>, { anim: 'fill', explode: [0, 0.15, 0] }),
      part('garnish', g.garnish, <group position={withRice ? [0.35, 0.43, 0] : [0, 0.39, 0]}>{garnish}<Scatter g={leafGeometry()} m={leafMat('#3f8f3a')} items={coriander.map((c) => ({ ...c, s: 0.4 }))} /></group>, { anim: 'pop', explode: [0, 0.6, 0], labelSide: 1 }),
      ...(withRice ? [part('rice', 'Steamed rice', <group position={[-0.6, 0.05, 0]}><RiceMound r={0.42} h={0.32} count={n(150)} /></group>, { explode: [-0.3, 0.4, 0] })] : []),
    ],
    height: 0.65,
    radius: withRice ? 1.35 : 1.0,
    anim: 'Simmer the curry',
  };
}

export function biryani(params = {}, q) {
  const n = counter(q);
  const clay = mat('#ffffff', { map: tex.baked('#a8552f', '#5a2410', 80), roughness: 0.85 });
  const handi = geo.lathe('handi', [[0, 0], [0.55, 0], [0.75, 0.15], [0.85, 0.38], [0.78, 0.6], [0.72, 0.68], [0.78, 0.74], [0.74, 0.76], [0.66, 0.68], [0.7, 0.4], [0.6, 0.2], [0, 0.08]], 40);
  const saffron = ['#f7f2e6', '#f7f2e6', '#f2b14a', '#e8822a', '#f7f2e6'];
  const onions = scatterDome('biryaniOnion', n(30), 0.55, 0.3, 0.55, { y0: 0.55, maxPolar: 1.2, s: 1 });
  const mint = scatterDome('biryaniMint', n(8), 0.5, 0.3, 0.5, { y0: 0.56, maxPolar: 1.0, s: 0.7 });
  const meat = scatterDome('biryaniMeat', 5, 0.42, 0.28, 0.42, { y0: 0.55, maxPolar: 1.0, s: 1 });
  return {
    parts: [
      part('handi', null, <Mesh g={handi} m={clay} />, { anim: 'none' }),
      part('rice', 'Saffron basmati', <group position={[0, 0.55, 0]}><RiceMound r={0.62} h={0.3} seed="biryani" count={n(240)} colors={saffron} /></group>, { explode: [0, 0.4, 0] }),
      ...(params.meat ? [part('chicken', 'Dum-cooked chicken', <Scatter g={displaced('biryaniChicken', geo.ico(0.16, 2), (v) => v.multiplyScalar(1 + wobble(v.x, v.y, v.z, 10) * 0.12))} m={mat('#ffffff', { map: tex.baked('#a8552a', '#3a1406', 60), roughness: 0.5 })} items={meat} />, { explode: [0, 0.8, 0], anim: 'pop', labelSide: 1 })] : []),
      part('onion', 'Fried onions', <Scatter g={geo.torus(0.05, 0.012, 5, 10, Math.PI)} m={mat('#7a3a12', { roughness: 0.5 })} items={onions} />, { explode: [0, 1.1, 0], anim: 'pop' }),
      part('mint', 'Mint', <Scatter g={leafGeometry()} m={leafMat('#3f8f3a')} items={mint} />, { explode: [0, 1.4, 0], anim: 'pop', labelSide: 1 }),
      part('raita', 'Raita', <Katori r={0.28} h={0.2} fill="#f4f0e4" p={[1.05, 0, 0.55]} />, { explode: [0.3, 0.2, 0.2], anim: 'pop' }),
    ],
    height: 1.0,
    radius: 1.2,
    anim: 'Open the dum',
  };
}

export function thali(params, q) {
  const n = counter(q);
  const bowls = [
    ['dal', 'Dal', '#e2a83a'],
    ['paneer', 'Paneer curry', '#d9682b'],
    ['sabzi', 'Seasonal vegetable', '#7a9a3a'],
    ['raita', 'Raita', '#f4f0e4'],
    ['sweet', 'Sweet', '#f1e2c4'],
  ];
  const parts = [part('plate', null, <SteelPlate r={1.45} />, { anim: 'none' })];
  bowls.forEach(([id, label, color], i) => {
    const a = Math.PI * 0.95 + (i / (bowls.length - 1)) * Math.PI * 0.95;
    const p = [Math.cos(a) * 0.95, 0.03, Math.sin(a) * 0.95];
    const inner = id === 'sweet' ? <Scatter g={geo.sphere(0.08, 14, 10)} m={M.glossy('#7a3a14')} items={[{ p: [-0.07, 0.03, 0] }, { p: [0.08, 0.03, 0.03] }]} /> : null;
    parts.push(part(`k-${id}`, label, <Katori r={0.26} h={0.18} fill={color} p={p}>{inner}</Katori>, { anim: 'pop', explode: [p[0] * 0.3, 0.45, p[2] * 0.3], at: 0.2 + i * 0.18, labelSide: i % 2 }));
  });
  parts.push(part('rice', 'Steamed rice', <group position={[0.35, 0.03, 0.4]}><RiceMound r={0.32} h={0.25} count={n(110)} /></group>, { anim: 'pop', explode: [0.2, 0.5, 0.3], labelSide: 1 }));
  parts.push(part('roti', 'Roti', <group><Flatbread r={0.36} p={[0.55, 0.06, -0.15]} rot={[0.05, 0, 0.1]} /><Flatbread r={0.36} p={[0.6, 0.1, -0.05]} rot={[0.1, 1, 0.12]} /></group>, { anim: 'drop', explode: [0.4, 0.6, -0.1] }));
  parts.push(part('salad', 'Salad', <Scatter g={geo.cyl(0.09, 0.09, 0.02, 16)} m={mat('#ffffff', { roughness: 0.4 })} items={[0, 1, 2, 3].map((i) => ({ p: [-0.25 + i * 0.12, 0.06 + i * 0.01, 0.75], r: [0.2, 0, 0], c: i % 2 ? '#c7362a' : '#a8d07a' }))} />, { anim: 'pop', explode: [0, 0.4, 0.4] }));
  return { parts, height: 0.5, radius: 1.45, anim: 'Fill the thali' };
}

export function rotiCurry(params, q) {
  const n = counter(q);
  return {
    parts: [
      part('plate', null, <SteelPlate r={1.35} />, { anim: 'none' }),
      part('curry', 'Curry of your choice', <Katori r={0.45} h={0.28} fill="#d9682b" p={[0.4, 0.03, 0]}><Scatter g={geo.rbox(0.11, 0.09, 0.11, 0.02)} m={mat('#f6efe0')} items={scatterDisc('rcPaneer', n(7), 0.28, 0.01, { s: 1 })} /></Katori>, { anim: 'pop', explode: [0.3, 0.4, 0] }),
      part('roti', 'Roti or naan', <group>{[0, 1, 2].map((i) => <Flatbread key={i} r={0.42} p={[-0.45, 0.06 + i * 0.035, -0.05 + i * 0.03]} rot={[0.04 * i, i, 0.05]} />)}</group>, { explode: [-0.3, 0.5, 0], labelSide: 1 }),
      part('salad', 'Salad', <Scatter g={geo.torus(0.1, 0.02, 6, 16)} m={mat('#e8d4e8')} items={[{ p: [0.3, 0.06, -0.75], r: [Math.PI / 2, 0, 0] }, { p: [0.45, 0.07, -0.68], r: [Math.PI / 2, 0, 0] }]} />, { anim: 'pop', explode: [0, 0.4, -0.3] }),
    ],
    height: 0.5,
    radius: 1.35,
    anim: 'Serve the combo',
  };
}

export function riceBowl(params, q) {
  const n = counter(q);
  return {
    parts: [
      part('bowl', null, <Bowl r={1.0} h={0.5} m={mat('#3a3f45', { roughness: 0.4 })} />, { anim: 'none' }),
      part('rice', 'Steamed rice', <group position={[-0.2, 0.15, 0]}><RiceMound r={0.5} h={0.28} count={n(160)} /></group>, { explode: [-0.2, 0.3, 0] }),
      part('topping', 'Topping of your choice', <Mesh g={blob('riceBowlTop', 0.42, 0.4, 0.1)} m={mat('#7a2a1c', { roughness: 0.3 })} p={[0.3, 0.2, 0]} />, { explode: [0.3, 0.6, 0], anim: 'pop', labelSide: 1 }),
      part('salad', 'Salad', <Scatter g={geo.box(0.07, 0.05, 0.07)} m={mat('#ffffff')} items={scatterDisc('rbSalad', n(14), 0.2, 0.42, { s: 1, colors: ['#c7362a', '#a8d07a', '#efe3ef'] }).map((s) => ({ ...s, p: [s.p[0] + 0.1, s.p[1], s.p[2] + 0.45] }))} />, { explode: [0, 0.9, 0.2], anim: 'pop' }),
    ],
    height: 0.65,
    radius: 1.05,
    anim: 'Build the bowl',
  };
}

export function grilledChicken(params, q) {
  const n = counter(q);
  const breast = displaced('chickenBreast', geo.sphere(0.5, 32, 16), (v) => {
    v.y *= 0.32;
    v.x *= 1.35;
    v.multiplyScalar(1 + wobble(v.x, v.y, v.z, 5) * 0.04);
  });
  const broccoli = scatterDisc('broccoli', n(5), 0.25, 0, { s: 1 });
  return {
    parts: [
      part('plate', null, <Plate r={1.35} color="#2f2c2a" />, { anim: 'none' }),
      part('mash', 'Mashed potato', <Mesh g={blob('mash', 0.38, 0.6, 0.08)} m={mat('#f3e6c4', { roughness: 0.6 })} p={[-0.55, 0.06, 0.25]} />, { anim: 'pop', explode: [-0.3, 0.4, 0] }),
      part('chicken', 'Herb-grilled chicken', <Mesh g={breast} m={mat('#ffffff', { map: tex.grillMarks('#c98a4a'), roughness: 0.45 })} p={[0.25, 0.2, -0.05]} r={[0, 0.4, 0]} />, { explode: [0.2, 0.6, 0], labelSide: 1 }),
      part('veg', 'Sautéed vegetables', <group><Scatter g={geo.ico(0.1, 1)} m={mat('#2f6e2a', { roughness: 0.7 })} items={broccoli.map((b) => ({ ...b, p: [b.p[0] - 0.2, 0.15, b.p[2] - 0.6] }))} /><Scatter g={geo.cyl(0.05, 0.05, 0.25, 10)} m={mat('#e8823a', { roughness: 0.4 })} items={[0, 1, 2].map((i) => ({ p: [0.35 + i * 0.12, 0.08, 0.6], r: [Math.PI / 2, 0, i * 0.3] }))} /></group>, { anim: 'pop', explode: [0, 0.9, 0.2] }),
    ],
    height: 0.55,
    radius: 1.35,
    anim: 'Grill & plate',
  };
}
