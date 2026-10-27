import * as THREE from 'three';
import { geo, mat, memo, tex, displaced, wobble, rng, M } from '../../kit.js';
import { part, Mesh, Scatter, scatterDisc, scatterDome, Board, Plate, Bowl, blob, leafGeometry, leafMat, counter } from '../shapes.jsx';

// ---------- Pizza ----------

const TOPPINGS = {
  basil: { label: 'Fresh basil', count: 7 },
  tomato: { label: 'Tomato', count: 8 },
  pepperoni: { label: 'Chicken pepperoni', count: 14 },
  corn: { label: 'Sweet corn', count: 50 },
  paneer: { label: 'Paneer tikka', count: 14 },
  capsicum: { label: 'Capsicum', count: 14 },
  onion: { label: 'Onion', count: 12 },
  olive: { label: 'Black olives', count: 14 },
  mushroom: { label: 'Mushroom', count: 12 },
};

function toppingMesh(kind, items) {
  switch (kind) {
    case 'basil':
      return <Scatter g={leafGeometry()} m={leafMat('#2f7d32')} items={items.map((i) => ({ ...i, s: 1.2 }))} />;
    case 'tomato':
      return <Scatter g={geo.cyl(0.12, 0.12, 0.03, 20)} m={mat('#d0402a', { roughness: 0.35 })} items={items} />;
    case 'pepperoni':
      return <Scatter g={geo.cyl(0.14, 0.14, 0.028, 24)} m={mat('#ffffff', { map: tex.baked('#a8321f', '#5a1208', 120), roughness: 0.4 })} items={items} />;
    case 'corn':
      return <Scatter g={geo.sphere(0.035, 8, 6)} m={mat('#f5c842', { roughness: 0.4 })} items={items} />;
    case 'paneer':
      return <Scatter g={geo.rbox(0.11, 0.09, 0.11, 0.02)} m={mat('#ffffff', { map: tex.baked('#f1dfba', '#b0521c', 40), roughness: 0.6 })} items={items} />;
    case 'capsicum':
      return <Scatter g={geo.torus(0.09, 0.022, 6, 12, Math.PI * 0.9)} m={mat('#3c8d2f', { roughness: 0.35 })} items={items.map((i) => ({ ...i, r: [Math.PI / 2, 0, i.r[1]] }))} />;
    case 'onion':
      return <Scatter g={geo.torus(0.1, 0.015, 6, 12, Math.PI * 0.8)} m={mat('#a65b8f', { roughness: 0.4 })} items={items.map((i) => ({ ...i, r: [Math.PI / 2, 0, i.r[1]] }))} />;
    case 'olive':
      return <Scatter g={geo.torus(0.045, 0.022, 8, 16)} m={M.glossy('#1d1a1a')} items={items.map((i) => ({ ...i, r: [Math.PI / 2, 0, 0] }))} />;
    case 'mushroom':
      return <Scatter g={geo.cyl(0.09, 0.09, 0.028, 16, false, 0, Math.PI)} m={mat('#cdb48f', { roughness: 0.6 })} items={items} />;
    default:
      return null;
  }
}

export function pizza(params = {}, q) {
  const n = counter(q);
  const { toppings = ['basil'], cheese = 'mozzarella' } = params;
  const four = cheese === 'four';
  const crust = geo.lathe('pizzaCrust', [[0, 0], [0.92, 0], [1.0, 0.035], [1.05, 0.1], [1.01, 0.16], [0.93, 0.13], [0.88, 0.08], [0, 0.08]], 56);
  const crustMat = mat('#ffffff', { map: tex.baked('#e2ad66', '#6b3010', 140), roughness: 0.75 });
  const cheeseGeo = displaced('pizzaCheese', geo.cyl(0.87, 0.87, 0.03, 48, false), (v) => {
    if (v.y > 0) v.y += Math.max(0, wobble(v.x, 0, v.z, 8)) * 0.03;
  });
  const cheeseMat = mat('#ffffff', { map: tex.baked(four ? '#f4e3a8' : '#f6d77c', '#c9802e', 70), roughness: 0.35 });

  const parts = [
    part('board', null, <Board w={2.6} round h={0.08} color="#8a5530" />, { anim: 'none' }),
    part('base', 'Stone-baked base', <Mesh g={crust} m={crustMat} />, { pos: [0, 0.08, 0], anim: 'pop' }),
    part('sauce', four ? 'White sauce' : 'Tomato sauce', <Mesh g={geo.cyl(0.88, 0.88, 0.02, 48)} m={mat(four ? '#efe3c8' : '#b5341c', { roughness: 0.4 })} />, { pos: [0, 0.17, 0], explode: [0, 0.35, 0], anim: 'spread' }),
    part('cheese', four ? 'Mozzarella base' : 'Mozzarella', <Mesh g={cheeseGeo} m={cheeseMat} />, { pos: [0, 0.19, 0], explode: [0, 0.7, 0], anim: 'spread' }),
  ];

  if (four) {
    const patches = [
      ['Cheddar', '#f0a43a'],
      ['Parmesan-style', '#f3ecd2'],
      ['Blue cheese', '#cfd6dc'],
    ];
    patches.forEach(([label, color], i) => {
      const items = scatterDisc(`fourcheese${i}`, n(10), 0.78, 0.015, { s: 1, tilt: 0.1 });
      parts.push(part(`cheese-${i}`, label, <Scatter g={blob(`patch${i}`, 0.11, 0.25, 0.2, 1)} m={mat(color, { roughness: 0.4 })} items={items} />, { pos: [0, 0.21, 0], explode: [0, 1.0 + i * 0.3, 0], anim: 'pop', labelSide: i % 2 }));
    });
  }

  toppings.forEach((kind, i) => {
    const def = TOPPINGS[kind];
    if (!def) return;
    const items = scatterDisc(`top-${kind}`, n(def.count), 0.78, 0.02, { s: 1, tilt: 0.15 });
    parts.push(part(`top-${kind}`, def.label, toppingMesh(kind, items), { pos: [0, 0.21, 0], explode: [0, 1.05 + i * 0.32, 0], anim: 'pop', labelSide: i % 2 }));
  });

  return { parts, height: 0.4, radius: 1.35, anim: 'Add the toppings' };
}

// ---------- Pasta ----------

const SAUCE = {
  alfredo: { color: '#f2e5c0', label: 'Creamy alfredo sauce', pasta: '#f0d690' },
  arrabbiata: { color: '#c0422a', label: 'Spicy arrabbiata sauce', pasta: '#e3a456' },
  pesto: { color: '#7fa843', label: 'Basil pesto', pasta: '#d9cf7a' },
  cheese: { color: '#f2b84b', label: 'Three-cheese sauce', pasta: '#f2c25c' },
};

function spaghettiNest(seed, count) {
  return memo(`spaghetti|${seed}|${count}`, () => {
    const r = rng(seed);
    const geos = [];
    for (let c = 0; c < count; c++) {
      const pts = [];
      let a = r() * Math.PI * 2;
      for (let i = 0; i < 9; i++) {
        a += 0.9 + r() * 0.6;
        const d = 0.15 + r() * 0.45;
        pts.push(new THREE.Vector3(Math.cos(a) * d, 0.12 + r() * 0.3 * (1 - d), Math.sin(a) * d));
      }
      geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.022, 5, false));
    }
    return geos;
  });
}

export function pasta(params = {}, q) {
  const n = counter(q);
  const { sauce = 'arrabbiata', shape = 'penne' } = params;
  const s = SAUCE[sauce] || SAUCE.arrabbiata;
  const coated = mat(new THREE.Color(s.pasta).lerp(new THREE.Color(s.color), 0.45).getStyle(), { roughness: 0.35 });
  const r = rng(`pasta${shape}`);
  let pastaNode;
  if (shape === 'spaghetti') {
    pastaNode = (
      <group>
        {spaghettiNest('spag', n(16)).map((g, i) => (
          <Mesh key={i} g={g} m={coated} />
        ))}
      </group>
    );
  } else {
    const items = Array.from({ length: n(shape === 'elbow' ? 90 : 60) }, () => {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * 0.6;
      return { p: [Math.cos(a) * d, 0.1 + r() * 0.35 * (1 - d / 0.7), Math.sin(a) * d], r: [r() * 3, r() * 3, r() * 3], s: 0.9 + r() * 0.2 };
    });
    const g = shape === 'elbow' ? geo.torus(0.07, 0.03, 8, 12, Math.PI * 0.75) : geo.cyl(0.055, 0.055, 0.3, 10, true);
    pastaNode = <Scatter g={g} m={mat(coated.color.getStyle(), { roughness: 0.35, side: THREE.DoubleSide })} items={items} />;
  }

  const garnish =
    sauce === 'pesto'
      ? scatterDome('pestoTom', n(5), 0.5, 0.35, 0.5, { y0: 0.12, maxPolar: 1.2, s: 1 })
      : scatterDome('parsley', n(40), 0.55, 0.4, 0.55, { y0: 0.1, maxPolar: 1.3, s: 1 });

  return {
    parts: [
      part('bowl', null, <Bowl r={1.05} h={0.45} color="#f5f1ea" />, { anim: 'none' }),
      part('sauce', s.label, <Mesh g={blob(`sauce${sauce}`, 0.72, 0.32, 0.06)} m={mat(s.color, { roughness: 0.3 })} />, { pos: [0, 0.1, 0], explode: [0, 0.2, 0], anim: 'spread' }),
      part('pasta', { penne: 'Penne', spaghetti: 'Spaghetti', elbow: 'Macaroni' }[shape] || 'Pasta', pastaNode, { pos: [0, 0.02, 0], explode: [0, 0.7, 0], anim: 'drop', labelSide: 1 }),
      part(
        'garnish',
        sauce === 'pesto' ? 'Cherry tomatoes' : sauce === 'cheese' ? 'Toasted crumbs' : 'Parsley & parmesan',
        sauce === 'pesto' ? (
          <Scatter g={geo.sphere(0.08, 14, 10)} m={M.glossy('#d63c25')} items={garnish} />
        ) : (
          <Scatter g={geo.box(0.04, 0.012, 0.03)} m={mat(sauce === 'cheese' ? '#c98a3a' : '#3f8f3a')} items={garnish} />
        ),
        { pos: [0, 0.05, 0], explode: [0, 1.15, 0], anim: 'pop' }
      ),
    ],
    height: 0.75,
    radius: 1.1,
    anim: 'Plate the pasta',
  };
}

// ---------- Lasagna ----------

export function lasagna() {
  const layers = [
    ['sheet', 'Pasta sheets', '#efce83', 0.05],
    ['ragu', 'Vegetable ragù', '#9b3a20', 0.1],
    ['bechamel', 'Béchamel', '#f2e8cf', 0.05],
    ['sheet', null, '#efce83', 0.05],
    ['ragu', null, '#9b3a20', 0.1],
    ['bechamel', null, '#f2e8cf', 0.05],
    ['sheet', null, '#efce83', 0.05],
  ];
  const parts = [part('plate', null, <Plate r={1.25} />, { anim: 'none' })];
  let y = 0.05;
  layers.forEach(([kind, label, color, h], i) => {
    parts.push(part(`layer-${i}`, label, <Mesh g={geo.rbox(1.3, h, 0.95, Math.min(0.02, h / 2.5))} m={mat(color, { roughness: kind === 'ragu' ? 0.45 : 0.6 })} p={[0, h / 2, 0]} />, { pos: [0, y, 0], explode: [0, i * 0.18, 0], labelSide: i % 2 }));
    y += h;
  });
  const top = displaced('lasagnaTop', geo.rbox(1.3, 0.08, 0.95, 0.03, 3), (v) => {
    if (v.y > 0) v.y += Math.max(0, wobble(v.x, 0, v.z, 9)) * 0.03;
  });
  parts.push(part('cheese', 'Baked mozzarella', <Mesh g={top} m={mat('#ffffff', { map: tex.baked('#eab354', '#8a4210', 90), roughness: 0.4 })} p={[0, 0.04, 0]} />, { pos: [0, y, 0], explode: [0, layers.length * 0.18, 0] }));
  parts.push(part('basil', 'Basil', <Scatter g={leafGeometry()} m={leafMat('#2f7d32')} items={[{ p: [0.1, 0, 0], r: [0, 0.4, 0], s: 1.3 }, { p: [-0.12, 0.01, 0.05], r: [0, 2.2, 0], s: 1.1 }]} />, { pos: [0, y + 0.09, 0], explode: [0, layers.length * 0.18 + 0.3, 0], anim: 'pop', labelSide: 1 }));
  return { parts, height: y + 0.2, radius: 1.25, anim: 'Layer the lasagna' };
}

// ---------- Risotto ----------

export function risotto(params, q) {
  const n = counter(q);
  const grains = scatterDome('risoGrains', n(200), 0.62, 0.22, 0.62, { y0: 0.08, maxPolar: 1.4, s: 1, sJitter: 0.4 });
  const mush = scatterDome('risoMush', n(9), 0.5, 0.22, 0.5, { y0: 0.1, maxPolar: 1.2, s: 1 });
  const herbs = scatterDome('risoHerb', n(30), 0.6, 0.24, 0.6, { y0: 0.1, maxPolar: 1.3, s: 1 });
  const grainGeo = memo('riceGrain', () => new THREE.SphereGeometry(0.028, 6, 5).scale(1, 0.6, 2.1));
  return {
    parts: [
      part('bowl', null, <Bowl r={1.1} h={0.32} color="#f2ede4" />, { anim: 'none' }),
      part('cream', 'Creamy arborio-style rice', <group><Mesh g={blob('risoBase', 0.66, 0.3, 0.05)} m={mat('#efe1b5', { roughness: 0.35 })} /><Scatter g={grainGeo} m={mat('#f5ecd2', { roughness: 0.4 })} items={grains} /></group>, { pos: [0, 0.07, 0], explode: [0, 0.2, 0], anim: 'spread' }),
      part('mushroom', 'Sautéed mushrooms', <Scatter g={geo.cyl(0.11, 0.11, 0.03, 16, false, 0, Math.PI)} m={mat('#9a7a55', { roughness: 0.5 })} items={mush} />, { pos: [0, 0.04, 0], explode: [0, 0.6, 0], anim: 'pop', labelSide: 1 }),
      part('herbs', 'Herbs & parmesan', <Scatter g={geo.box(0.04, 0.012, 0.03)} m={mat('#3f8f3a')} items={herbs} />, { pos: [0, 0.05, 0], explode: [0, 0.95, 0], anim: 'pop' }),
    ],
    height: 0.5,
    radius: 1.15,
    anim: 'Stir the risotto',
  };
}

// ---------- Garlic bread & bruschetta ----------

export function garlicBread(params, q) {
  const n = counter(q);
  const crust = mat('#ffffff', { map: tex.baked('#c98a3a', '#6b3010', 80), roughness: 0.6 });
  const butter = mat('#ffffff', { map: tex.baked('#f0c65a', '#4f8a2a', 260), roughness: 0.35 });
  const slices = [-0.75, -0.25, 0.25, 0.75].map((x, i) => ({ x, rot: 0.25 - i * 0.05 }));
  const herbs = slices.flatMap((s, i) => scatterDisc(`gb${i}`, n(14), 0.2, 0, { s: 1 }).map((h) => ({ ...h, p: [s.x + h.p[0] * 1.2, 0.33, h.p[2] * 0.7] })));
  return {
    parts: [
      part('board', null, <Board w={2.6} d={1.4} color="#9a6438" />, { anim: 'none' }),
      ...slices.map((s, i) =>
        part(`slice-${i}`, i === 0 ? 'Toasted baguette' : null, <group rotation={[0, 0, s.rot]}><Mesh g={geo.capsule(0.15, 0.4, 4, 12)} m={crust} r={[Math.PI / 2, 0, 0]} s={[1, 1, 0.8]} /><Mesh g={geo.rbox(0.36, 0.06, 0.58, 0.03)} m={butter} p={[0, 0.12, 0]} /></group>, {
          pos: [s.x, 0.25, 0],
          explode: [0, 0.4 + i * 0.05, 0],
        })
      ),
      part('herbs', 'Garlic butter & herbs', <Scatter g={geo.box(0.03, 0.012, 0.025)} m={mat('#2f6e2a')} items={herbs} />, { explode: [0, 0.9, 0], anim: 'pop', labelSide: 1 }),
    ],
    height: 0.6,
    radius: 1.3,
    anim: 'Toast the bread',
  };
}

export function bruschetta(params, q) {
  const n = counter(q);
  const toast = mat('#ffffff', { map: tex.baked('#d29a4c', '#6b3010', 120), roughness: 0.7 });
  const xs = [-0.8, 0, 0.8];
  const tomato = xs.flatMap((x, i) => scatterDisc(`br${i}`, n(16), 0.24, 0, { s: 1, tilt: 1 }).map((t) => ({ ...t, p: [x + t.p[0] * 1.2, 0.27 + t.p[1], t.p[2]] })));
  const basil = xs.map((x, i) => ({ p: [x + 0.05, 0.33, 0.02], r: [0, i * 1.7, 0], s: 1.2 }));
  return {
    parts: [
      part('board', null, <Board w={2.7} d={1.3} color="#9a6438" />, { anim: 'none' }),
      part('toast', 'Toasted bread', <Scatter g={geo.rbox(0.7, 0.12, 0.42, 0.04)} m={toast} items={xs.map((x, i) => ({ p: [x, 0.17, 0], r: [0, (i - 1) * 0.15, 0] }))} />, { explode: [0, 0.15, 0] }),
      part('tomato', 'Diced tomato & garlic', <Scatter g={geo.rbox(0.08, 0.06, 0.08, 0.015)} m={M.glossy('#cf3b26')} items={tomato} />, { explode: [0, 0.55, 0], anim: 'pop', labelSide: 1 }),
      part('basil', 'Basil & olive oil', <Scatter g={leafGeometry()} m={leafMat('#2f7d32')} items={basil} />, { explode: [0, 0.9, 0], anim: 'pop' }),
    ],
    height: 0.5,
    radius: 1.35,
    anim: 'Top the toasts',
  };
}
