import * as THREE from 'three';
import { geo, mat, memo, tex, canvasTexture, M } from '../../kit.js';
import { part, Mesh, Scatter, scatterDisc, Whip, leafGeometry, leafMat, counter } from '../shapes.jsx';

/** Liquid column whose origin is at its bottom, so scale.y fills it from below. */
function Liquid({ rb, rt, h, color, opacity = 1, seg = 32 }) {
  const g = memo(`liquid|${rb}|${rt}|${h}|${seg}`, () => {
    const c = new THREE.CylinderGeometry(rt, rb, h, seg);
    c.translate(0, h / 2, 0);
    return c;
  });
  return <Mesh g={g} m={mat(color, { roughness: 0.18, ...(opacity < 1 ? { transparent: true, opacity } : {}) })} />;
}

/** Thin stream hanging down from the part origin (pour animation). */
function Stream({ length = 1.6, r = 0.035, color }) {
  const g = memo(`stream|${length}|${r}`, () => {
    const c = new THREE.CylinderGeometry(r, r * 0.8, length, 10, 1, true);
    c.translate(0, -length / 2, 0);
    return c;
  });
  return <Mesh g={g} m={mat(color, { roughness: 0.2 })} cast={false} />;
}

const citrusTexture = (color) =>
  canvasTexture(`citrus|${color}`, 128, 128, (ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 6, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2);
      ctx.arc(w / 2, h / 2, w / 2 - 10, (i / 10) * Math.PI * 2 + 0.05, ((i + 1) / 10) * Math.PI * 2 - 0.05);
      ctx.closePath();
      ctx.fill();
    }
  });

// ---------- Hot coffee ----------

const COFFEE = {
  espresso: { liquid: '#3a1d0e', top: 'crema', small: true, milk: false, label: 'Espresso shot' },
  americano: { liquid: '#2b170c', top: 'crema', milk: false, label: 'Espresso & hot water' },
  cappuccino: { liquid: '#7a4a2a', top: 'foam', milk: true, label: 'Espresso & steamed milk' },
  latte: { liquid: '#a8703f', top: 'art', milk: true, label: 'Espresso & steamed milk' },
  flatwhite: { liquid: '#96602f', top: 'art', milk: true, small: true, label: 'Ristretto & velvety milk' },
  mocha: { liquid: '#5a2f1a', top: 'whip', milk: true, label: 'Espresso, chocolate & milk' },
  hotchocolate: { liquid: '#5a2f1a', top: 'marshmallow', milk: true, label: 'Melted chocolate & milk' },
};

export function coffeeCup(params = {}, q) {
  const n = counter(q);
  const kind = COFFEE[params.drink] ? params.drink : 'latte';
  const c = COFFEE[kind];
  const k = c.small ? 0.72 : 1;
  const cupColor = kind === 'espresso' ? '#2a1d15' : '#f7f4ee';
  const cup = geo.lathe(`cup${k}`, [[0, 0], [0.3 * k, 0], [0.36 * k, 0.04 * k], [0.46 * k, 0.32 * k], [0.52 * k, 0.62 * k], [0.49 * k, 0.63 * k], [0.43 * k, 0.34 * k], [0.32 * k, 0.08 * k], [0, 0.08 * k]], 48);
  const saucer = geo.lathe('saucer', [[0, 0], [0.5, 0], [0.55, 0.03], [0.82, 0.08], [0.84, 0.1], [0.8, 0.1], [0.55, 0.06], [0, 0.06]], 48);
  const cupY = 0.07;
  const liquidH = 0.48 * k;
  const surfaceY = cupY + 0.08 * k + liquidH;
  const surfaceR = 0.47 * k;

  let topNode;
  let topLabel;
  if (c.top === 'art') {
    topLabel = 'Microfoam latte art';
    topNode = <Mesh g={geo.circle(surfaceR, 40)} m={mat('#ffffff', { map: tex.latteArt(c.liquid), roughness: 0.35 })} r={[-Math.PI / 2, 0, 0]} />;
  } else if (c.top === 'foam') {
    topLabel = 'Milk foam & cocoa';
    topNode = <Mesh g={geo.sphere(surfaceR, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2)} m={mat('#ffffff', { map: tex.baked('#efe2cc', '#6b4426', 40), roughness: 0.7 })} s={[1, 0.25, 1]} />;
  } else if (c.top === 'whip') {
    topLabel = 'Whipped cream & cocoa';
    topNode = <Whip r={0.22} layers={4} />;
  } else if (c.top === 'marshmallow') {
    topLabel = 'Marshmallows';
    topNode = <Scatter g={geo.rbox(0.1, 0.08, 0.1, 0.02)} m={mat('#ffffff', { roughness: 0.6 })} items={scatterDisc('marsh', n(7), 0.3, 0.02, { s: 1, tilt: 1, colors: ['#fbeef2', '#ffffff', '#f6d6e0'] })} />;
  } else {
    topLabel = 'Golden crema';
    topNode = <Mesh g={geo.circle(surfaceR, 40)} m={mat('#ffffff', { map: tex.baked('#c08040', '#7a4a1a', 80), roughness: 0.3 })} r={[-Math.PI / 2, 0, 0]} />;
  }

  const parts = [
    part('saucer', null, <Mesh g={saucer} m={M.ceramic(cupColor)} />, { anim: 'none' }),
    part(
      'cup',
      null,
      <group>
        <Mesh g={cup} m={M.ceramic(cupColor)} />
        <Mesh g={geo.torus(0.15 * k, 0.035 * k, 10, 24, Math.PI * 1.25)} m={M.ceramic(cupColor)} p={[0.5 * k, 0.36 * k, 0]} r={[0, 0, -Math.PI * 0.62]} />
      </group>,
      { pos: [0, cupY, 0], anim: 'none' }
    ),
    part('coffee-stream', null, <Stream color="#3a1d0e" length={1.7} r={0.03} />, { pos: [0, surfaceY + 1.75, 0], anim: 'stream', at: 0, dur: 1.4 }),
    part('liquid', c.label, <Liquid rb={0.33 * k} rt={surfaceR} h={liquidH} color={c.liquid} />, { pos: [0, cupY + 0.08 * k, 0], anim: 'fill', at: 0.15, dur: c.milk ? 1.2 : 1.5, explode: [0, 0.25, 0] }),
  ];
  if (c.milk) {
    parts.push(part('milk-stream', null, <Stream color="#f7f1e6" length={1.7} r={0.04} />, { pos: [0.12, surfaceY + 1.75, 0], anim: 'stream', at: 1.5, dur: 1.0 }));
  }
  parts.push(part('top', topLabel, topNode, { pos: [0, surfaceY + 0.005, 0], anim: 'pop', at: c.milk ? 2.3 : 1.7, explode: [0, 0.7, 0], labelSide: 1 }));
  parts.push(part('spoon', null, <group position={[0.42, 0.11, 0.45]} rotation={[0, -0.7, 0]}><Mesh g={geo.box(0.04, 0.012, 0.42)} m={M.steel()} /><Mesh g={geo.sphere(0.07, 16, 8)} m={M.steel()} p={[0, 0, 0.24]} s={[0.8, 0.25, 1]} /></group>, { anim: 'slide', at: c.milk ? 2.6 : 2.0 }));
  return { parts, height: (surfaceY + 0.15) * 1.1, radius: 0.9, anim: c.milk ? 'Pour the coffee & milk' : 'Pull the shot' };
}

export function chai() {
  const clay = mat('#ffffff', { map: tex.baked('#b5643c', '#6b2a12', 70), roughness: 0.9 });
  const kulhad = geo.lathe('kulhad', [[0, 0], [0.28, 0], [0.3, 0.05], [0.36, 0.45], [0.41, 0.78], [0.38, 0.79], [0.33, 0.47], [0.26, 0.07], [0, 0.07]], 40);
  return {
    parts: [
      part('coaster', null, <Mesh g={geo.cyl(0.6, 0.6, 0.06, 40)} m={mat('#ffffff', { map: tex.wood('#7a4a2a'), roughness: 0.7 })} p={[0, 0.03, 0]} />, { anim: 'none' }),
      part('kulhad', 'Clay kulhad', <Mesh g={kulhad} m={clay} />, { pos: [0, 0.06, 0], anim: 'none' }),
      part('stream', null, <Stream color="#c08a5a" length={1.7} r={0.03} />, { pos: [0, 2.5, 0], anim: 'stream', at: 0, dur: 1.4 }),
      part('chai', 'Spiced milk tea', <Liquid rb={0.27} rt={0.37} h={0.62} color="#c99a6a" />, { pos: [0, 0.13, 0], anim: 'fill', at: 0.15, dur: 1.3, explode: [0, 0.3, 0] }),
      part('spice', 'Cardamom & ginger', <Scatter g={memo('cardamom', () => new THREE.SphereGeometry(0.05, 10, 8).scale(1, 0.6, 1.8))} m={mat('#8aa04a', { roughness: 0.6 })} items={[{ p: [0.45, 0.08, 0.25], r: [0, 0.5, 0] }, { p: [0.5, 0.08, 0.1], r: [0, 1.4, 0] }]} />, { anim: 'pop', at: 1.6, explode: [0.2, 0.5, 0], labelSide: 1 }),
    ],
    height: 1.0,
    radius: 0.7,
    anim: 'Pour the chai',
  };
}

export function teaCup(params = {}) {
  const green = params.tea !== 'herbal';
  const glass = geo.lathe('teaGlass', [[0, 0], [0.36, 0], [0.38, 0.03], [0.42, 0.7], [0.4, 0.71], [0.36, 0.06], [0, 0.05]], 40);
  return {
    parts: [
      part('saucer', null, <Mesh g={geo.lathe('saucer', [[0, 0], [0.5, 0], [0.55, 0.03], [0.82, 0.08], [0.84, 0.1], [0.8, 0.1], [0.55, 0.06], [0, 0.06]], 48)} m={M.ceramic()} />, { anim: 'none' }),
      part('glass', null, <group><Mesh g={glass} m={M.glassThick()} cast={false} /><Mesh g={geo.torus(0.15, 0.03, 8, 20, Math.PI * 1.2)} m={M.glassThick()} p={[0.43, 0.4, 0]} r={[0, 0, -Math.PI * 0.6]} cast={false} /></group>, { pos: [0, 0.07, 0], anim: 'none' }),
      part('stream', null, <Stream color={green ? '#c9c25a' : '#c2543a'} length={1.7} />, { pos: [0, 2.45, 0], anim: 'stream', at: 0, dur: 1.3 }),
      part('tea', green ? 'Green tea' : 'Herbal infusion', <Liquid rb={0.35} rt={0.4} h={0.56} color={green ? '#b8c25a' : '#b8402a'} opacity={0.7} />, { pos: [0, 0.12, 0], anim: 'fill', at: 0.1, dur: 1.3, explode: [0, 0.3, 0] }),
      part('tag', 'Tea bag', <group><Mesh g={geo.cyl(0.004, 0.004, 0.5, 4)} m={mat('#f4efe6')} p={[0.38, 0.6, 0]} r={[0, 0, 0.3]} /><Mesh g={geo.box(0.12, 0.14, 0.01)} m={mat(green ? '#7aa04a' : '#c2543a')} p={[0.47, 0.35, 0.02]} /></group>, { anim: 'pop', at: 1.4, explode: [0.3, 0.4, 0], labelSide: 1 }),
      ...(green ? [part('lemon', 'Lemon slice', <Mesh g={geo.cyl(0.16, 0.16, 0.03, 24)} m={mat('#ffffff', { map: citrusTexture('#f2d23a'), roughness: 0.4 })} p={[-0.25, 0.68, 0]} r={[0.2, 0, 0.3]} />, { anim: 'drop', at: 1.6, explode: [-0.3, 0.5, 0] })] : []),
    ],
    height: 1.0,
    radius: 0.85,
    anim: 'Brew the tea',
  };
}

// ---------- Cold drinks ----------

const GLASSES = {
  tall: {
    profile: [[0, 0], [0.34, 0], [0.36, 0.02], [0.43, 1.6], [0.41, 1.6], [0.33, 0.07], [0, 0.07]],
    liquid: { y: 0.07, rb: 0.32, rt: 0.39, h: 1.32 },
  },
  mason: {
    profile: [[0, 0], [0.42, 0], [0.44, 0.04], [0.44, 1.2], [0.4, 1.25], [0.4, 1.38], [0.38, 1.38], [0.38, 1.25], [0.41, 1.2], [0.41, 0.07], [0, 0.07]],
    liquid: { y: 0.07, rb: 0.4, rt: 0.4, h: 1.12 },
  },
  shake: {
    profile: [[0, 0], [0.34, 0], [0.34, 0.04], [0.08, 0.12], [0.07, 0.35], [0.22, 0.5], [0.4, 0.95], [0.46, 1.45], [0.44, 1.46], [0.38, 0.96], [0.2, 0.53], [0, 0.5]],
    liquid: { y: 0.5, rb: 0.18, rt: 0.43, h: 0.88 },
  },
};

export function coldDrink(params = {}, q) {
  const n = counter(q);
  const { liquid = '#b07a4f', whipped = false, ice = false, glass = 'tall', garnish = 'none', layered = false } = params;
  const G = GLASSES[glass] || GLASSES.tall;
  const L = G.liquid;
  const top = L.y + L.h;
  const parts = [part('glass', null, <Mesh g={geo.lathe(`glass${glass}`, G.profile, 40)} m={M.glassThick()} cast={false} />, { anim: 'none' })];

  parts.push(part('stream', null, <Stream color={layered ? '#f1e6d6' : liquid} length={1.8} r={0.04} />, { pos: [0, top + 1.9, 0], anim: 'stream', at: 0, dur: layered ? 1.0 : 1.5 }));
  if (layered) {
    parts.push(part('milk', 'Cold milk', <Liquid rb={L.rb} rt={L.rb + (L.rt - L.rb) * 0.55} h={L.h * 0.55} color="#f1e6d6" opacity={0.95} />, { pos: [0, L.y, 0], anim: 'fill', at: 0.1, dur: 0.9, explode: [0, 0.1, 0] }));
    parts.push(part('stream2', null, <Stream color="#3a1d0e" length={1.8} r={0.03} />, { pos: [0, top + 1.9, 0], anim: 'stream', at: 1.1, dur: 1.0 }));
    parts.push(part('coffee', 'Espresso', <Liquid rb={L.rb + (L.rt - L.rb) * 0.55} rt={L.rt} h={L.h * 0.45} color={liquid} opacity={0.95} />, { pos: [0, L.y + L.h * 0.55, 0], anim: 'fill', at: 1.25, dur: 0.8, explode: [0, 0.5, 0], labelSide: 1 }));
  } else {
    parts.push(part('drink', 'Drink', <Liquid rb={L.rb} rt={L.rt} h={L.h} color={liquid} opacity={0.94} />, { pos: [0, L.y, 0], anim: 'fill', at: 0.15, dur: 1.4, explode: [0, 0.2, 0] }));
  }
  let t = layered ? 2.1 : 1.7;

  if (ice) {
    const cubes = scatterDisc('ice', n(6), L.rt * 0.55, 0, { s: 1, tilt: 1.2 }).map((c, i) => ({ ...c, p: [c.p[0], top - 0.12 - (i % 3) * 0.14, c.p[2]] }));
    parts.push(part('ice', 'Ice', <Scatter g={geo.rbox(0.2, 0.2, 0.2, 0.04)} m={mat('#eef7fb', { roughness: 0.05, transparent: true, opacity: 0.55 })} items={cubes} cast={false} />, { anim: 'drop', at: t, explode: [0, 0.6, 0] }));
    t += 0.4;
  }
  if (whipped) {
    parts.push(part('whip', 'Whipped cream', <Whip r={L.rt * 0.75} layers={4} />, { pos: [0, top + 0.02, 0], anim: 'pop', at: t, explode: [0, 0.9, 0], labelSide: 1 }));
    t += 0.35;
  }
  const garnishY = top + (whipped ? 0.45 : 0.05);
  const garnishes = {
    lemon: ['Lemon wheel', <Mesh g={geo.cyl(0.22, 0.22, 0.04, 28)} m={mat('#ffffff', { map: citrusTexture('#f2d23a'), roughness: 0.4 })} p={[L.rt, 0, 0]} r={[Math.PI / 2, 0, 0.2]} />],
    orange: ['Orange wheel', <Mesh g={geo.cyl(0.24, 0.24, 0.04, 28)} m={mat('#ffffff', { map: citrusTexture('#f39c2b'), roughness: 0.4 })} p={[L.rt, 0, 0]} r={[Math.PI / 2, 0, 0.2]} />],
    mint: ['Fresh mint & lime', <group><Scatter g={leafGeometry()} m={leafMat('#3f8f3a')} items={[0, 1, 2, 3].map((i) => ({ p: [0.05, i * 0.03, 0], r: [-0.6, i * 1.6, 0], s: 1.1 }))} /><Mesh g={geo.cyl(0.15, 0.15, 0.03, 24)} m={mat('#ffffff', { map: citrusTexture('#7ac34a'), roughness: 0.4 })} p={[L.rt * 0.9, -0.05, 0]} r={[Math.PI / 2, 0, 0.3]} /></group>],
    berry: ['Strawberry', <group position={[L.rt * 0.7, -0.02, 0]}><Mesh g={geo.sphere(0.14, 16, 12)} m={M.glossy('#d6203a')} s={[1, 1.25, 1]} /><Mesh g={geo.cone(0.1, 0.06, 6)} m={mat('#3f8f3a')} p={[0, 0.17, 0]} /></group>],
    cookie: ['Chocolate sandwich cookie', <group position={[0.1, 0.05, 0]} rotation={[0.3, 0, 1.1]}><Mesh g={geo.cyl(0.17, 0.17, 0.04, 24)} m={mat('#1e1410', { roughness: 0.6 })} p={[0, 0.035, 0]} /><Mesh g={geo.cyl(0.15, 0.15, 0.03, 24)} m={mat('#f4efe6')} /><Mesh g={geo.cyl(0.17, 0.17, 0.04, 24)} m={mat('#1e1410', { roughness: 0.6 })} p={[0, -0.035, 0]} /></group>],
    chocolate: ['Chocolate shavings', <Scatter g={geo.box(0.06, 0.012, 0.03)} m={M.glossy('#3a1a0c')} items={scatterDisc('shave', n(16), 0.2, 0, { s: 1, tilt: 2 })} />],
    cherry: ['Cherry', <group><Mesh g={geo.sphere(0.09, 16, 12)} m={M.glossy('#b0101e')} /><Mesh g={geo.cyl(0.008, 0.008, 0.22, 6)} m={mat('#4a6a2a')} p={[0.03, 0.13, 0]} r={[0, 0, -0.4]} /></group>],
  };
  if (garnishes[garnish]) {
    const [label, node] = garnishes[garnish];
    parts.push(part('garnish', label, node, { pos: [0, garnishY, 0], anim: 'drop', at: t, explode: [0, 1.2, 0] }));
    t += 0.35;
  }
  const straw = glass === 'shake' ? '#c4362a' : '#e0b070';
  parts.push(part('straw', null, <Mesh g={geo.cyl(0.035, 0.035, 2.0, 10)} m={mat('#ffffff', { map: tex.stripes('#f7f1e8', straw, 10), roughness: 0.5 })} p={[-0.12, top - 0.2, 0.05]} r={[0.05, 0, 0.18]} />, { anim: 'drop', at: t }));
  return { parts, height: top + 0.9, radius: 0.85, anim: 'Pour the drink' };
}
