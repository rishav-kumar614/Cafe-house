import * as THREE from 'three';
import { geo, mat, memo, tex, displaced, wobble, rng, M } from '../../kit.js';
import { part, Mesh, Scatter, scatterDisc, scatterDome, Plate, Bowl, BowlFill, DipBowl, blob, leafGeometry, leafMat, counter } from '../shapes.jsx';

function noodleNest(seed, count, radius) {
  return memo(`noodles|${seed}|${count}|${radius}`, () => {
    const r = rng(seed);
    return Array.from({ length: count }, () => {
      const pts = [];
      let a = r() * Math.PI * 2;
      for (let i = 0; i < 10; i++) {
        a += 0.7 + r() * 0.8;
        const d = 0.1 + r() * 0.5;
        pts.push(new THREE.Vector3(Math.cos(a) * d, 0.1 + r() * 0.35 * (1 - d * 0.9), Math.sin(a) * d));
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 70, radius, 5, false);
    });
  });
}

const VEG_COLORS = ['#e8823a', '#cfe3a4', '#3c8d2f', '#c7362a'];

export function noodles(params = {}, q) {
  const n = counter(q);
  const thick = params.style === 'stirfry';
  const nest = noodleNest(thick ? 'thick' : 'hakka', n(thick ? 12 : 18), thick ? 0.04 : 0.024);
  const noodleMat = mat(thick ? '#9a5a25' : '#d8a548', { roughness: 0.3 });
  const veg = scatterDome('noodleVeg', n(36), 0.55, 0.42, 0.55, { y0: 0.1, maxPolar: 1.3, s: 1, colors: thick ? ['#6b4a2a', '#4f8a3a', '#2f6e2a'] : VEG_COLORS });
  const onion = scatterDome('springOnion', n(18), 0.5, 0.45, 0.5, { y0: 0.12, maxPolar: 1.1, s: 1 });
  return {
    parts: [
      part('bowl', null, <Bowl r={1.0} h={0.55} m={mat('#2c2b2a', { roughness: 0.3 })} />, { anim: 'none' }),
      part('noodles', thick ? 'Thick wok noodles' : 'Hakka noodles', <group>{nest.map((g, i) => <Mesh key={i} g={g} m={noodleMat} />)}</group>, { pos: [0, 0.03, 0], explode: [0, 0.35, 0] }),
      part('veg', thick ? 'Mushroom & bok choy' : 'Cabbage, carrot & capsicum', <Scatter g={geo.box(0.16, 0.025, 0.04)} m={mat('#ffffff', { roughness: 0.45 })} items={veg} />, { pos: [0, 0.03, 0], explode: [0, 0.8, 0], anim: 'pop', labelSide: 1 }),
      part('onion', 'Spring onion', <Scatter g={geo.torus(0.035, 0.012, 6, 12)} m={mat('#5fae3c')} items={onion} />, { pos: [0, 0.03, 0], explode: [0, 1.15, 0], anim: 'pop' }),
      part(
        'chopsticks',
        null,
        <group rotation={[0, 0.5, 0]}>
          <Mesh g={geo.cyl(0.018, 0.03, 2.1, 8)} m={mat('#c79a5d', { roughness: 0.6 })} p={[0, 0.6, 0.08]} r={[0, 0, Math.PI / 2 - 0.1]} />
          <Mesh g={geo.cyl(0.018, 0.03, 2.1, 8)} m={mat('#c79a5d', { roughness: 0.6 })} p={[0, 0.6, -0.08]} r={[0, 0, Math.PI / 2 - 0.12]} />
        </group>,
        { anim: 'slide', explode: [0, 1.0, 0.6] }
      ),
    ],
    height: 0.8,
    radius: 1.1,
    anim: 'Toss in the wok',
  };
}

export function friedRice(params, q) {
  const n = counter(q);
  const grainGeo = memo('riceGrain', () => new THREE.SphereGeometry(0.028, 6, 5).scale(1, 0.6, 2.1));
  const grains = scatterDome('friedRice', n(260), 0.62, 0.42, 0.62, { y0: 0.1, maxPolar: 1.45, s: 1, colors: ['#f0dcaa', '#e7c98a', '#f4e6c2'] });
  const peas = scatterDome('peas', n(18), 0.62, 0.43, 0.62, { y0: 0.1, maxPolar: 1.4, s: 1 });
  const carrot = scatterDome('carrot', n(18), 0.62, 0.43, 0.62, { y0: 0.1, maxPolar: 1.4, s: 1 });
  return {
    parts: [
      part('bowl', null, <Bowl r={1.0} h={0.5} color="#f5f1ea" />, { anim: 'none' }),
      part('rice', 'Wok-fried rice', <group><Mesh g={geo.sphere(0.62, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)} m={mat('#e7c98a', { roughness: 0.6 })} s={[1, 0.68, 1]} p={[0, 0.1, 0]} /><Scatter g={grainGeo} m={mat('#ffffff', { roughness: 0.5 })} items={grains} /></group>, { explode: [0, 0.3, 0] }),
      part('peas', 'Peas & beans', <Scatter g={geo.sphere(0.04, 10, 8)} m={M.glossy('#4f9a35')} items={peas} />, { explode: [0, 0.75, 0], anim: 'pop', labelSide: 1 }),
      part('carrot', 'Carrot & spring onion', <Scatter g={geo.box(0.06, 0.06, 0.06)} m={mat('#e8823a', { roughness: 0.4 })} items={carrot} />, { explode: [0, 1.1, 0], anim: 'pop' }),
    ],
    height: 0.75,
    radius: 1.05,
    anim: 'Fry the rice',
  };
}

export function manchurian(params, q) {
  const n = counter(q);
  const ball = displaced('manchurianBall', geo.ico(0.2, 3), (v) => v.multiplyScalar(1 + wobble(v.x, v.y, v.z, 22) * 0.08));
  const balls = [[0, 0.33, 0], ...Array.from({ length: 6 }, (_, i) => [Math.cos(i * 1.047) * 0.42, 0.28, Math.sin(i * 1.047) * 0.42])].map((p, i) => ({ p, r: [i, i * 2, 0] }));
  const onion = scatterDisc('manOnion', n(16), 0.6, 0.45, { s: 1, tilt: 1 });
  return {
    parts: [
      part('bowl', null, <Bowl r={1.0} h={0.5} m={mat('#2c2b2a', { roughness: 0.3 })} />, { anim: 'none' }),
      part('gravy', 'Soy-garlic gravy', <BowlFill r={1.0} h={0.5} level={0.6} color="#5a2a14" bump={0.02} />, { explode: [0, 0.1, 0], anim: 'fill' }),
      part('balls', 'Vegetable balls', <Scatter g={ball} m={M.glossy('#7a3a1a')} items={balls} />, { explode: [0, 0.6, 0], labelSide: 1 }),
      part('onion', 'Spring onion', <Scatter g={geo.torus(0.035, 0.012, 6, 12)} m={mat('#5fae3c')} items={onion} />, { explode: [0, 1.0, 0], anim: 'pop' }),
    ],
    height: 0.7,
    radius: 1.05,
    anim: 'Simmer the Manchurian',
  };
}

export function chilliPaneer(params, q) {
  const n = counter(q);
  const r = rng('chilliPaneer');
  const cubes = Array.from({ length: n(11) }, (_, i) => {
    const a = (i / 11) * Math.PI * 2 + r();
    const d = 0.15 + r() * 0.45;
    return { p: [Math.cos(a) * d, 0.2 + r() * 0.12, Math.sin(a) * d], r: [r() * 0.6, r() * 3, r() * 0.6] };
  });
  const peppers = scatterDisc('cpPepper', n(14), 0.7, 0.25, { s: 1, tilt: 1.6, colors: ['#3c8d2f', '#c7362a', '#3c8d2f'] });
  const onions = scatterDisc('cpOnion', n(9), 0.7, 0.25, { s: 1, tilt: 1.2 });
  return {
    parts: [
      part('plate', null, <Plate r={1.25} />, { anim: 'none' }),
      part('sauce', 'Chilli-soy glaze', <Mesh g={blob('cpSauce', 0.8, 0.12, 0.05)} m={M.glossy('#8a2a14')} p={[0, 0.05, 0]} />, { explode: [0, 0.1, 0], anim: 'spread' }),
      part('paneer', 'Crisp paneer', <Scatter g={geo.rbox(0.26, 0.22, 0.26, 0.05)} m={mat('#ffffff', { map: tex.baked('#e3b76a', '#8a3a12', 60), roughness: 0.25 })} items={cubes} />, { explode: [0, 0.5, 0] }),
      part('peppers', 'Capsicum', <Scatter g={geo.rbox(0.2, 0.03, 0.17, 0.012)} m={mat('#ffffff', { roughness: 0.3 })} items={peppers} />, { explode: [0, 0.9, 0], anim: 'pop', labelSide: 1 }),
      part('onion', 'Onion petals', <Scatter g={geo.torus(0.14, 0.02, 6, 12, Math.PI * 0.6)} m={mat('#e8d4e8', { roughness: 0.4 })} items={onions} />, { explode: [0, 1.25, 0], anim: 'pop' }),
    ],
    height: 0.6,
    radius: 1.25,
    anim: 'Toss the paneer',
  };
}

export function springRolls() {
  const roll = mat('#ffffff', { map: tex.baked('#d79a45', '#8a4a12', 200), roughness: 0.55 });
  const rolls = [-0.45, -0.15, 0.15, 0.45].map((x, i) => ({ p: [x * 1.2, 0.2, 0.05 - i * 0.04], r: [Math.PI / 2, 0, 0.35] }));
  return {
    parts: [
      part('plate', null, <Plate r={1.25} />, { anim: 'none' }),
      part('lettuce', 'Lettuce', <Mesh g={leafGeometry()} m={leafMat('#6dbb45')} p={[-0.4, 0.06, 0.4]} s={3} r={[0, 2.4, 0]} />, { anim: 'pop' }),
      part('rolls', 'Crispy spring rolls', <Scatter g={geo.capsule(0.13, 0.7, 6, 14)} m={roll} items={rolls} />, { explode: [0, 0.5, 0] }),
      part('dip', 'Sweet chilli dip', <DipBowl color="#d9542a" p={[0.75, 0.05, 0.55]} />, { explode: [0.3, 0.2, 0.3], anim: 'pop', labelSide: 1 }),
    ],
    height: 0.5,
    radius: 1.25,
    anim: 'Plate the rolls',
  };
}

export function crispyVeg(params, q) {
  const n = counter(q);
  const piece = displaced('crispyPiece', geo.dodeca(0.17, 1), (v) => v.multiplyScalar(1 + wobble(v.x, v.y, v.z, 18) * 0.12));
  const pieces = scatterDisc('crispy', n(16), 0.65, 0.2, { s: 1, tilt: 3 }).map((p, i) => ({ ...p, p: [p.p[0], 0.18 + (i % 3) * 0.1, p.p[2]], s: [1.3, 0.8, 0.9] }));
  const sesame = scatterDisc('crispySes', n(50), 0.7, 0.38, { s: 1, tilt: 2 });
  return {
    parts: [
      part('plate', null, <Plate r={1.25} />, { anim: 'none' }),
      part('veg', 'Battered vegetables', <Scatter g={piece} m={mat('#ffffff', { map: tex.baked('#d49040', '#8a3a12', 80), roughness: 0.3 })} items={pieces} />, { explode: [0, 0.4, 0] }),
      part('sesame', 'Sesame & honey-chilli glaze', <Scatter g={memo('sesameGeo', () => new THREE.SphereGeometry(0.028, 8, 6).scale(1, 0.45, 0.62))} m={mat('#f5e7c4')} items={sesame} />, { explode: [0, 0.85, 0], anim: 'pop', labelSide: 1 }),
    ],
    height: 0.6,
    radius: 1.25,
    anim: 'Fry & glaze',
  };
}

// ---------- Momos ----------

const MOMO_STYLE = {
  steamed: { color: '#f3ede1', spot: '#e4dccb', rough: 0.55, label: 'Steamed dumplings' },
  fried: { color: '#d9a050', spot: '#8a4a16', rough: 0.45, label: 'Fried dumplings' },
  tandoori: { color: '#c4572b', spot: '#4a1a08', rough: 0.5, label: 'Tandoori-charred dumplings' },
  schezwan: { color: '#b0301c', spot: '#5a1208', rough: 0.2, label: 'Schezwan-tossed dumplings' },
};

function momoGeometry() {
  return displaced('momo', geo.sphere(0.24, 32, 20), (v) => {
    const a = Math.atan2(v.z, v.x);
    if (v.y < 0) v.y *= 0.45;
    const t = Math.max(0, v.y / 0.24);
    const pinch = 1 - t * t * 0.6;
    const pleat = 1 + Math.sin(a * 10) * 0.07 * t;
    v.x *= pinch * pleat;
    v.z *= pinch * pleat;
    v.y += t * t * 0.06;
  });
}

export function momos(params = {}) {
  const style = MOMO_STYLE[params.style] ? params.style : 'steamed';
  const s = MOMO_STYLE[style];
  const momoMat = mat('#ffffff', { map: tex.baked(s.color, s.spot, style === 'steamed' ? 40 : 160), roughness: s.rough });
  const ring = Array.from({ length: 6 }, (_, i) => ({ p: [Math.cos(i * 1.047) * 0.5, 0.1, Math.sin(i * 1.047) * 0.5], r: [0, i, 0] }));
  const basket = style === 'steamed';
  const fillingLabel = { paneer: 'Spiced paneer filling', chicken: 'Chicken & ginger filling' }[params.filling] || 'Mixed vegetable filling';
  return {
    parts: [
      part(
        'base',
        null,
        basket ? (
          <group>
            <Mesh g={geo.cyl(1.0, 1.0, 0.35, 40, true)} m={mat('#ffffff', { map: tex.stripes('#d9b77a', '#b8915a', 40), roughness: 0.8, side: THREE.DoubleSide })} p={[0, 0.17, 0]} />
            <Mesh g={geo.cyl(0.98, 0.98, 0.04, 40)} m={mat('#c9a56a', { roughness: 0.8 })} p={[0, 0.04, 0]} />
            <Mesh g={geo.torus(1.0, 0.04, 8, 48)} m={mat('#b8915a')} p={[0, 0.35, 0]} r={[Math.PI / 2, 0, 0]} />
          </group>
        ) : (
          <Plate r={1.2} />
        ),
        { anim: 'none' }
      ),
      ...(basket ? [part('leaf', null, <Mesh g={geo.circle(0.9, 32)} m={mat('#9cbf6a', { roughness: 0.6 })} p={[0, 0.065, 0]} r={[-Math.PI / 2, 0, 0]} />, { anim: 'none' })] : []),
      part('momos', s.label, <Scatter g={momoGeometry()} m={momoMat} items={[...ring, { p: [0, 0.1, 0], r: [0, 0.5, 0] }]} />, { pos: [0, 0.03, 0], explode: [0, 0.4, 0] }),
      part('filling', fillingLabel, <Mesh g={blob('momoFill', 0.12, 0.8, 0.2)} m={mat(params.filling === 'paneer' ? '#f1e6cc' : params.filling === 'chicken' ? '#d9b48a' : '#9cbf6a', { roughness: 0.6 })} />, { pos: [0, 0.75, 0], explode: [0.8, 0.5, 0], anim: 'none', labelSide: 1, hidden: true }),
      part('chutney', style === 'tandoori' ? 'Mint chutney' : 'Red momo chutney', <DipBowl color={style === 'tandoori' ? '#4f9a35' : '#c7362a'} p={[0.95, 0.04, 0.85]} />, { explode: [0.3, 0.2, 0.3], anim: 'pop' }),
    ],
    height: 0.6,
    radius: 1.2,
    anim: style === 'steamed' ? 'Steam the momos' : 'Cook the momos',
  };
}
