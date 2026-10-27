import * as THREE from 'three';
import { geo, mat, memo, tex, displaced, wobble, M } from '../../kit.js';
import { part, Mesh, Scatter, scatterDome, scatterDisc, Board, Plate, DipBowl, lettuceGeometry, droopySlice, leafGeometry, leafMat, counter, Composite } from '../shapes.jsx';
import { fries } from './snacks.jsx';

const PATTY = {
  chicken: { label: 'Grilled chicken patty', color: '#7c4a27', spot: '#2e1608' },
  veg: { label: 'Vegetable patty', color: '#8f7540', spot: '#3d6b2a' },
  paneer: { label: 'Paneer tikka slab', color: '#efd9ae', spot: '#9a4a1a' },
  crispy: { label: 'Crispy fried chicken', color: '#c98a3a', spot: '#7a4a12' },
};

function pattyGeometry(kind) {
  if (kind === 'paneer') return geo.rbox(1.12, 0.17, 0.98, 0.05);
  if (kind === 'crispy') {
    return displaced('crispyPatty', geo.cyl(0.7, 0.7, 0.2, 40, false), (v) => {
      v.multiplyScalar(1 + wobble(v.x, v.y, v.z, 14) * 0.05);
    });
  }
  return displaced(`patty|${kind}`, geo.cyl(0.68, 0.68, 0.17, 40, false), (v) => {
    const n = wobble(v.x, v.y, v.z, 9, kind === 'veg' ? 3 : 1);
    v.y += n * 0.015;
    v.x *= 1 + n * 0.03;
    v.z *= 1 + n * 0.03;
  });
}

export function burger(params = {}, q) {
  const n = counter(q);
  const { patty = 'chicken', cheese = false, double = false, gourmet = false } = params;
  const pk = PATTY[patty] ? patty : 'chicken';
  const bunColor = gourmet ? '#b5652a' : '#d79447';
  const bunMat = mat('#ffffff', { map: tex.baked(bunColor, '#7a3d12', 50), roughness: gourmet ? 0.32 : 0.55 });
  const pattyMat = mat('#ffffff', {
    map: pk === 'paneer' ? tex.grillMarks(PATTY.paneer.color) : tex.baked(PATTY[pk].color, PATTY[pk].spot, 220),
    roughness: pk === 'crispy' ? 0.7 : 0.55,
  });

  const parts = [part('board', null, <Board w={2.3} round h={0.1} color="#8a5530" />, { anim: 'none' })];
  let y = 0.1;
  let k = 0;
  const add = (id, label, node, h, opts = {}) => {
    parts.push(part(id, label, node, { pos: [0, y, 0], explode: [0, k * 0.34, 0], ...opts }));
    y += h;
    k++;
  };

  const bottomBun = geo.lathe('bunBottom', [[0, 0], [0.56, 0], [0.65, 0.05], [0.68, 0.13], [0.67, 0.2], [0, 0.2]], 40);
  add('bun-bottom', gourmet ? 'Toasted brioche-style bun' : 'Toasted bun', <Mesh g={bottomBun} m={bunMat} />, 0.2);
  add('sauce', gourmet ? 'Smoky sauce' : pk === 'paneer' ? 'Tikka mayo' : 'House sauce', <Mesh g={geo.cyl(0.6, 0.62, 0.03, 32)} m={M.glossy(pk === 'paneer' ? '#e7d6b0' : '#f0c13c')} p={[0, 0.015, 0]} />, 0.03, { anim: 'pop' });
  add('lettuce', gourmet ? 'Rocket & lettuce' : 'Lettuce', <Mesh g={lettuceGeometry(0.8, 2)} m={mat('#6dbb45', { roughness: 0.5, side: THREE.DoubleSide })} p={[0, 0.03, 0]} />, 0.05, { anim: 'pop' });

  const pattyH = pk === 'paneer' ? 0.17 : 0.18;
  const pattyNode = <Mesh g={pattyGeometry(pk)} m={pattyMat} p={[0, pattyH / 2, 0]} />;
  const cheeseMat = M.glossy(gourmet ? '#e2952a' : '#f5b52e');
  add('patty', PATTY[pk].label, pattyNode, pattyH);
  if (cheese) add('cheese', gourmet ? 'Smoked cheese' : 'Cheddar slice', <Mesh g={droopySlice(1.25, 0.22)} m={cheeseMat} />, 0.03, { anim: 'pop' });
  if (double) {
    add('patty-2', null, pattyNode, pattyH);
    if (cheese) add('cheese-2', null, <Mesh g={droopySlice(1.25, 0.22)} m={cheeseMat} />, 0.03, { anim: 'pop' });
  }

  if (pk === 'crispy') {
    const slaw = scatterDisc('slaw', n(60), 0.6, 0.02, { s: 1, tilt: 1.2, colors: ['#f4f0e0', '#f4f0e0', '#9b5aa0', '#e8823a'] });
    add('slaw', 'Coleslaw', <Scatter g={geo.box(0.16, 0.02, 0.03)} m={mat('#ffffff', { roughness: 0.5 })} items={slaw} />, 0.06, { anim: 'pop' });
  } else {
    const tomatoes = [0, 1, 2].map((i) => ({ p: [Math.cos(i * 2.1) * 0.3, 0.03, Math.sin(i * 2.1) * 0.3], r: [0, i, 0] }));
    add('tomato', 'Tomato', <Scatter g={geo.cyl(0.27, 0.27, 0.06, 24)} m={mat('#d63c25', { roughness: 0.35 })} items={tomatoes} />, 0.06, { anim: 'pop' });
  }

  if (gourmet) {
    const onion = scatterDisc('caramel', n(10), 0.5, 0.03, { s: 1, tilt: 0.6 });
    add('onion', 'Caramelised onion', <Scatter g={geo.torus(0.14, 0.03, 6, 14, Math.PI * 1.3)} m={M.glossy('#8a4a1c')} items={onion.map((o) => ({ ...o, r: [Math.PI / 2 + o.r[0], o.r[1], 0] }))} />, 0.05, { anim: 'pop' });
    const rocket = scatterDisc('rocket', n(9), 0.62, 0.02, { minR: 0.35, s: 1.1, tilt: 0.5 });
    add('rocket', null, <Scatter g={leafGeometry()} m={leafMat('#3c7a2c')} items={rocket} />, 0.02, { anim: 'pop' });
  } else {
    const rings = [0, 1, 2].map((i) => ({ p: [Math.cos(i * 2 + 1) * 0.25, 0.02, Math.sin(i * 2 + 1) * 0.25], r: [Math.PI / 2, 0, 0] }));
    add('onion', 'Onion rings', <Scatter g={geo.torus(0.2, 0.025, 8, 24)} m={mat('#efe0f0', { roughness: 0.4 })} items={rings} />, 0.04, { anim: 'pop' });
    if (cheese && !double) {
      const pickles = scatterDisc('pickle', 4, 0.35, 0.01, { s: 1 });
      add('pickles', 'Pickles', <Scatter g={geo.cyl(0.13, 0.13, 0.025, 16)} m={mat('#7a9a3a', { roughness: 0.4 })} items={pickles} />, 0.03, { anim: 'pop' });
    }
  }

  const dome = geo.sphere(0.69, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  const seeds = scatterDome('sesame', n(70), 0.69, 0.43, 0.69, { maxPolar: 1.15, s: 1, sJitter: 0.4 });
  const seedGeo = memo('sesameGeo', () => new THREE.SphereGeometry(0.028, 8, 6).scale(1, 0.45, 0.62));
  add(
    'bun-top',
    gourmet ? 'Glazed brioche-style bun' : 'Sesame bun',
    <group>
      <Mesh g={dome} m={bunMat} s={[1, 0.62, 1]} />
      {!gourmet && <Scatter g={seedGeo} m={mat('#f5e7c4', { roughness: 0.5 })} items={seeds} />}
    </group>,
    0.43
  );

  return { parts, height: y, radius: 1.15, anim: 'Assemble the burger' };
}

// ---------- Sandwich ----------

const FILLINGS = {
  cheese: [['Cheddar', '#f2b233', 0.07], ['Mozzarella', '#f6e7b5', 0.05]],
  club: [['Lettuce', '#6dbb45', 0.04], ['Chicken', '#e9d2a8', 0.1], ['Tomato', '#d63c25', 0.05], ['Cheese', '#f2b233', 0.04]],
  paneer: [['Mint chutney', '#5a9a3a', 0.03], ['Paneer tikka', '#e08a3c', 0.11], ['Onion', '#efe0f0', 0.03], ['Cheese', '#f2b233', 0.04]],
  veg: [['Green chutney', '#5a9a3a', 0.025], ['Cucumber', '#9cc97a', 0.04], ['Tomato', '#d63c25', 0.04], ['Potato', '#e8cf8f', 0.05]],
  chicken: [['Lettuce', '#6dbb45', 0.04], ['Herb mayo', '#f4f0dc', 0.03], ['Pulled chicken', '#ead7b0', 0.11]],
  corn: [['Corn & cheese', '#f4d35e', 0.12]],
};

function triangleGeometry(key, depth, inflate = 0) {
  return memo(`tri|${key}|${depth}|${inflate}`, () => {
    const s = 1.35 + inflate;
    const shape = new THREE.Shape();
    shape.moveTo(-s / 2, -s / 2);
    shape.lineTo(s / 2, -s / 2);
    shape.lineTo(-s / 2, s / 2);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.025, bevelSegments: 2, curveSegments: 4 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, 0);
    return g;
  });
}

function SandwichHalf({ filling, grilled }) {
  const breadTop = grilled ? mat('#ffffff', { map: tex.grillMarks('#d9a35a'), roughness: 0.6 }) : mat('#f4e2bd', { roughness: 0.75 });
  const crust = mat(grilled ? '#a8652a' : '#c98a4a', { roughness: 0.7 });
  const layers = FILLINGS[filling] || FILLINGS.veg;
  const breadH = 0.13;
  const stack = filling === 'club' ? [...layers.slice(0, 2), null, ...layers.slice(2)] : layers;
  let y = 0;
  const nodes = [];
  nodes.push(<Mesh key="b0" g={triangleGeometry('bread', breadH)} m={[breadTop, crust]} p={[0, y, 0]} />);
  y += breadH + 0.04;
  stack.forEach((l, i) => {
    if (!l) {
      nodes.push(<Mesh key={`mid${i}`} g={triangleGeometry('bread', breadH)} m={[breadTop, crust]} p={[0, y, 0]} />);
      y += breadH + 0.04;
      return;
    }
    nodes.push(<Mesh key={`f${i}`} g={triangleGeometry(`fill${l[2]}`, l[2] * 0.6, 0.05)} m={mat(l[1], { roughness: 0.45 })} p={[0, y, 0]} />);
    y += l[2] * 0.6 + 0.05;
  });
  nodes.push(<Mesh key="bt" g={triangleGeometry('bread', breadH)} m={[breadTop, crust]} p={[0, y, 0]} />);
  return { node: <>{nodes}</>, height: y + breadH };
}

export function sandwich(params = {}) {
  const { filling = 'veg', grilled = false } = params;
  const a = SandwichHalf({ filling, grilled });
  const layers = FILLINGS[filling] || FILLINGS.veg;
  const parts = [
    part('plate', null, <Plate r={1.35} />, { anim: 'none' }),
    part('half-a', `${grilled ? 'Grilled' : 'Fresh'} bread`, a.node, { pos: [-0.25, 0.05, 0.1], rot: [0, 0.2, 0], explode: [-0.6, 0.2, 0] }),
    part('half-b', layers.map((l) => l[0]).join(', '), a.node, { pos: [0.35, 0.05, -0.05], rot: [0, Math.PI + 0.35, 0], explode: [0.6, 0.5, 0], labelSide: 1 }),
  ];
  if (filling === 'club') {
    parts.push(
      part('picks', null, <Scatter g={geo.cyl(0.012, 0.012, 0.9, 6)} m={mat('#e6c99a')} items={[{ p: [-0.45, 0.6, 0.05] }, { p: [0.55, 0.6, -0.1] }]} />, { anim: 'drop' })
    );
  }
  return { parts, height: a.height + 0.2, radius: 1.35, anim: 'Stack the sandwich' };
}

// ---------- Wraps & rolls ----------

const WRAP_FILL = {
  paneer: ['#e08a3c', '#f4ecd8'],
  veg: ['#6dbb45', '#d63c25'],
  chicken: ['#e2b880', '#c8642a'],
  beans: ['#7a3e24', '#f4d35e'],
};

export function wrap(params = {}, q) {
  const n = counter(q);
  const { style = 'wrap', filling = 'paneer' } = params;
  const fat = style === 'burrito';
  const r = fat ? 0.42 : 0.3;
  const len = fat ? 1.7 : 1.45;
  const shell = style === 'kathi' ? tex.baked('#dca25a', '#8a4a16', 140) : tex.baked('#ecd4a0', '#a8722e', 90);
  const shellMat = mat('#ffffff', { map: shell, roughness: 0.7 });
  const [fillA, fillB] = WRAP_FILL[filling] || WRAP_FILL.paneer;
  const fillMat = mat('#ffffff', { map: tex.baked(fillA, fillB, 260), roughness: 0.5 });
  const cylinder = geo.cyl(r, r, len, 32, true);
  const cap = geo.circle(r * 0.96, 32);

  const Half = ({ wrapper }) => (
    <group>
      <Mesh g={cylinder} m={shellMat} r={[0, 0, Math.PI / 2]} />
      <Mesh g={cap} m={fillMat} p={[len / 2 - 0.01, 0, 0]} r={[0, Math.PI / 2, 0]} />
      <Mesh g={cap} m={shellMat} p={[-len / 2, 0, 0]} r={[0, -Math.PI / 2, 0]} />
      {wrapper && <Mesh g={geo.cyl(r + 0.02, r + 0.02, len * 0.55, 32, true)} m={wrapper} p={[-len * 0.22, 0, 0]} r={[0, 0, Math.PI / 2]} />}
    </group>
  );

  const wrapper = fat ? mat('#d9dde2', { roughness: 0.25, metalness: 0.9, side: THREE.DoubleSide }) : style === 'kathi' ? mat('#f2ead8', { roughness: 0.9, side: THREE.DoubleSide }) : null;
  const parts = [
    part('board', null, <Board w={2.5} d={1.7} color="#9a6438" />, { anim: 'none' }),
    part('half-a', style === 'kathi' ? 'Flaky paratha' : 'Soft tortilla', <Half wrapper={wrapper} />, { pos: [-0.2, 0.1 + r, 0.3], rot: [0, -0.5, 0], explode: [-0.4, 0.3, 0.3], anim: 'slide' }),
    part('half-b', null, <Half wrapper={wrapper} />, { pos: [0.25, 0.1 + r * 2.6, -0.15], rot: [0, -0.9, 0.12], explode: [0.4, 0.6, 0], anim: 'slide' }),
  ];

  const fillingLabel = { paneer: 'Paneer tikka filling', veg: 'Grilled vegetable filling', chicken: 'Chicken filling', beans: 'Rice, beans & salsa' }[filling];
  const bits = scatterDisc(`wrapbits${filling}`, n(16), 0.35, 0, { s: 1, tilt: 2 }).map((b, i) => ({ ...b, p: [0.95 + b.p[0] * 0.3, 0.13 + Math.abs(b.p[2]) * 0.2, 0.55 + b.p[2]], c: i % 2 ? fillA : fillB }));
  parts.push(part('filling', fillingLabel, <Scatter g={geo.rbox(0.09, 0.07, 0.09, 0.02)} m={mat('#ffffff', { roughness: 0.5 })} items={bits} />, { anim: 'pop', explode: [0.5, 0.2, 0.4], labelSide: 1 }));

  if (style === 'loaded') {
    const sticks = scatterDisc('loadedfries', n(8), 0.18, 0, { s: 1, tilt: 0.6 }).map((s) => ({ ...s, p: [-0.2 + 0.72 + s.p[0], 0.1 + r + s.p[2], 0.3 + s.p[2] * 0.5], r: [s.r[0], 0, Math.PI / 2 + s.r[2]] }));
    parts.push(part('fries', 'Fries & cheese', <Scatter g={geo.box(0.07, 0.5, 0.07)} m={mat('#e8b552', { roughness: 0.6 })} items={sticks} />, { anim: 'pop', explode: [0.6, 0.6, 0.4] }));
  }
  parts.push(part('dip', style === 'burrito' ? 'Sour cream & salsa' : 'Dip', <DipBowl color={style === 'burrito' ? '#f4efe4' : '#5a9a3a'} p={[0.85, 0.1, 0.45]} />, { anim: 'pop', explode: [0.4, 0, 0.4] }));
  return { parts, height: 1.2, radius: 1.3, anim: 'Roll it up' };
}

// ---------- Meal combo ----------

export function combo(params, q) {
  const b = burger({ patty: 'veg', cheese: true }, q);
  const f = fries({ style: 'plain' }, q);
  const tray = mat('#9a3b25', { roughness: 0.5 });
  const cupMat = mat('#ffffff', { map: tex.stripes('#f7f1e8', '#c4622d', 6), roughness: 0.6 });
  return {
    parts: [
      part('tray', null, <Mesh g={geo.rbox(3, 0.1, 2, 0.04)} m={tray} p={[0, 0.05, 0]} />, { anim: 'none' }),
      part('paper', null, <Mesh g={geo.box(2.7, 0.005, 1.75)} m={mat('#f3e7cf', { roughness: 0.9 })} p={[0, 0.1, 0]} />, { anim: 'none' }),
      part('main', 'Main of your choice', <group scale={0.62}><Composite def={b} skip={['board']} /></group>, { pos: [-0.75, 0.04, 0.2], explode: [-0.4, 0.5, 0] }),
      part('side', 'Side of your choice', <group scale={0.55}><Composite def={f} skip={['plate']} /></group>, { pos: [0.55, 0.1, -0.35], explode: [0.2, 0.6, -0.2], labelSide: 1 }),
      part(
        'drink',
        'Drink of your choice',
        <group>
          <Mesh g={geo.cyl(0.3, 0.24, 0.85, 28)} m={cupMat} p={[0, 0.43, 0]} />
          <Mesh g={geo.cyl(0.32, 0.32, 0.05, 28)} m={mat('#f7f4ee', { roughness: 0.4 })} p={[0, 0.88, 0]} />
          <Mesh g={geo.cyl(0.025, 0.025, 0.6, 8)} m={mat('#c4622d')} p={[0.06, 1.15, 0]} r={[0, 0, 0.15]} />
        </group>,
        { pos: [0.95, 0.1, 0.45], explode: [0.5, 0.4, 0.3], labelSide: 1 }
      ),
    ],
    height: 1.3,
    radius: 1.6,
    anim: 'Build the combo',
  };
}
