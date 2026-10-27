import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { geo, mat, M, tex, rng, memo } from '../kit.js';
import { Mesh, Scatter } from '../food/shapes.jsx';
import { Clickable, SceneFood, Steam, Fire } from './interactive.jsx';
import { Pendant, WallShelf, Artwork, FURNITURE_MATERIALS as W } from './Furniture.jsx';
import { useMenu, productsInCategory } from '../../store/menu.js';
import { money } from '../../lib/format.js';

const steelTop = () => mat('#d5d8dc', { roughness: 0.25, metalness: 0.85 });

function Counter({ p, size, top = 'marble', front = 'walnut', r = 0 }) {
  const [w, h, d] = size;
  const topMat = top === 'marble' ? W.marble() : top === 'steel' ? steelTop() : W.oak();
  const frontMat = front === 'walnut' ? W.walnut() : front === 'steel' ? M.steel() : W.oak();
  const slats = Math.floor(w / 0.18);
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Mesh g={geo.box(w, h - 0.05, d)} m={frontMat} p={[0, (h - 0.05) / 2, 0]} />
      <Mesh g={geo.box(w + 0.06, 0.05, d + 0.08)} m={topMat} p={[0, h - 0.025, 0.02]} />
      {front === 'walnut' &&
        Array.from({ length: slats }, (_, i) => (
          <Mesh key={i} g={geo.box(0.02, h - 0.2, 0.02)} m={W.black()} p={[-w / 2 + 0.09 + i * 0.18, (h - 0.05) / 2, d / 2 + 0.01]} cast={false} />
        ))}
    </group>
  );
}

function useMenuBoard(categorySlugs, limit = 7) {
  const products = useMenu((s) => s.products);
  return useMemo(() => {
    const rows = [];
    for (const slug of categorySlugs) for (const p of productsInCategory(products, slug)) if (rows.length < limit && !rows.some((r) => r[0] === p.name)) rows.push([p.name, money(p.basePrice)]);
    return rows;
  }, [products, categorySlugs, limit]);
}

function MenuBoard({ p, r = 0, w = 2.4, h = 1.5, title, rows }) {
  const key = `${title}|${rows.map((x) => x.join(':')).join('|')}`;
  const board = tex.chalkboard(key, title, rows.length ? rows : [['Menu loading…', '']]);
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Mesh g={geo.box(w + 0.12, h + 0.12, 0.05)} m={W.walnut()} />
      <Mesh g={geo.plane(w, h)} m={mat('#ffffff', { map: board, roughness: 0.9 })} p={[0, 0, 0.03]} cast={false} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Coffee bar: espresso machine, grinder with moving beans, menu board, cold fridge.
// ---------------------------------------------------------------------------

function Grinder({ p, grindingId, reducedMotion }) {
  const beans = useRef();
  const active = useRef(0);
  const offsets = useMemo(() => {
    const r = rng('beans');
    return Array.from({ length: 28 }, () => [r() * 0.07 - 0.035, r(), r() * 0.07 - 0.035, r() * 6]);
  }, []);
  useEffect(() => {
    if (grindingId) active.current = 2.2;
  }, [grindingId]);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, dt) => {
    const mesh = beans.current;
    if (!mesh) return;
    const running = active.current > 0 && !reducedMotion;
    if (running) active.current -= dt;
    offsets.forEach((o, i) => {
      if (running) o[1] = (o[1] + dt * 0.9) % 1;
      const t = o[1];
      // Beans swirl down the hopper, then drop from the spout into the portafilter.
      const inHopper = t < 0.7;
      const k = inHopper ? t / 0.7 : (t - 0.7) / 0.3;
      if (inHopper) {
        const rad = 0.09 * (1 - k * 0.8);
        tmp.position.set(Math.cos(o[3] + k * 5) * rad, 0.78 - k * 0.2, Math.sin(o[3] + k * 5) * rad);
      } else {
        tmp.position.set(o[0] * 0.3, 0.32 - k * 0.12, 0.17 + o[2] * 0.3);
      }
      tmp.rotation.set(o[3], o[3] * 2, 0);
      tmp.scale.setScalar(running || inHopper ? 1 : 0.001);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  const beanGeo = memo('coffeeBean', () => new THREE.SphereGeometry(0.012, 8, 6).scale(1, 0.65, 0.8));
  return (
    <group position={p}>
      <Mesh g={geo.rbox(0.24, 0.42, 0.3, 0.03)} m={mat('#24201d', { roughness: 0.35, metalness: 0.5 })} p={[0, 0.21, 0]} />
      <Mesh g={geo.box(0.06, 0.08, 0.1)} m={M.steel()} p={[0, 0.34, 0.15]} />
      <Mesh g={geo.cyl(0.13, 0.04, 0.32, 20, true)} m={M.glassThick()} p={[0, 0.6, 0]} cast={false} />
      <Mesh g={geo.cyl(0.11, 0.05, 0.16, 20)} m={mat('#3a2010', { roughness: 0.9 })} p={[0, 0.54, 0]} />
      <Mesh g={geo.cyl(0.14, 0.14, 0.03, 20)} m={M.darkSteel()} p={[0, 0.77, 0]} />
      <instancedMesh ref={beans} args={[beanGeo, M.glossy('#3a1d0e'), offsets.length]} frustumCulled={false} />
    </group>
  );
}

function EspressoMachine({ p }) {
  const body = mat('#9e2f1c', { roughness: 0.22, metalness: 0.35 });
  return (
    <group position={p}>
      <Mesh g={geo.rbox(0.95, 0.46, 0.52, 0.05)} m={body} p={[0, 0.33, 0]} />
      <Mesh g={geo.box(0.98, 0.1, 0.55)} m={M.steel()} p={[0, 0.05, 0]} />
      <Mesh g={geo.box(0.9, 0.02, 0.5)} m={M.steel()} p={[0, 0.58, 0]} />
      {[-0.22, 0.22].map((x) => (
        <group key={x} position={[x, 0.24, 0.3]}>
          <Mesh g={geo.cyl(0.06, 0.07, 0.08, 16)} m={M.steel()} />
          <Mesh g={geo.cyl(0.05, 0.05, 0.04, 16)} m={M.darkSteel()} p={[0, -0.06, 0]} />
          <Mesh g={geo.cyl(0.015, 0.02, 0.2, 8)} m={W.black()} p={[0, -0.07, 0.12]} r={[Math.PI / 2, 0, 0]} />
          <Mesh g={geo.circle(0.045, 20)} m={mat('#f4efe6', { roughness: 0.3 })} p={[x > 0 ? 0 : 0, 0.18, 0.0]} r={[0, 0, 0]} />
        </group>
      ))}
      {[-0.3, 0, 0.3].map((x) => (
        <Mesh key={x} g={geo.circle(0.05, 20)} m={mat('#f7f2e6', { roughness: 0.3 })} p={[x * 0.5, 0.45, 0.262]} />
      ))}
      <Mesh g={geo.cyl(0.01, 0.01, 0.3, 6)} m={M.steel()} p={[0.48, 0.2, 0.22]} r={[0.3, 0, 0.2]} />
      {[-0.3, -0.1, 0.1, 0.3].map((x) => (
        <Mesh key={x} g={geo.cyl(0.04, 0.035, 0.07, 12)} m={M.ceramic()} p={[x, 0.625, 0]} />
      ))}
    </group>
  );
}

function ColdFridge({ p }) {
  const bottles = useMemo(() => {
    const items = [];
    const colors = ['#f39c2b', '#7fd6c2', '#c45a7c', '#f2a1b3', '#d98e2f', '#6b3d24'];
    for (let row = 0; row < 4; row++) for (let i = 0; i < 5; i++) items.push({ p: [-0.3 + i * 0.15, 0.35 + row * 0.42, 0], c: colors[(row + i) % colors.length] });
    return items;
  }, []);
  return (
    <group position={p}>
      <Mesh g={geo.box(0.9, 2.0, 0.7)} m={M.darkSteel()} p={[0, 1.0, 0]} />
      <Mesh g={geo.box(0.8, 1.8, 0.02)} m={M.emissive('#eef6ff', 0.6)} p={[0, 1.0, 0.33]} cast={false} />
      <Scatter g={geo.cyl(0.05, 0.05, 0.28, 10)} m={mat('#ffffff', { roughness: 0.2 })} items={bottles.map((b) => ({ ...b, p: [b.p[0], b.p[1], 0.3] }))} cast={false} />
      <Mesh g={geo.box(0.82, 1.82, 0.02)} m={M.glass()} p={[0, 1.0, 0.36]} cast={false} />
      <Mesh g={geo.box(0.03, 0.6, 0.04)} m={M.steel()} p={[0.35, 1.0, 0.39]} />
    </group>
  );
}

export function CoffeeBar({ q, reducedMotion, onStation, onOpen, demoId }) {
  const rows = useMenuBoard(['coffee-hot', 'cold-beverages']);
  return (
    <group>
      <Clickable onClick={() => onStation('coffee-bar')} label="Coffee Bar – see drinks">
        <Counter p={[-6.4, 0, -5.4]} size={[6.4, 1.05, 0.75]} />
        <EspressoMachine p={[-6.9, 1.05, -5.5]} />
        <Grinder p={[-8.3, 1.05, -5.55]} grindingId={demoId} reducedMotion={reducedMotion} />
        <Counter p={[-6.2, 0, -7.55]} size={[6.8, 0.95, 0.6]} top="oak" />
      </Clickable>
      {/* Brewing demo: beans grind, espresso then milk pour into a cup under the group head */}
      <SceneFood slug="cafe-latte" fallback={{ key: 'coffeeCup', params: { drink: 'latte' } }} p={[-6.68, 1.1, -5.15]} s={0.11} mode="assemble" playId={demoId} quality={q.detail} reducedMotion={reducedMotion} onOpen={onOpen} />
      <Steam p={[-6.68, 1.2, -5.15]} reducedMotion={reducedMotion} />
      <SceneFood slug="iced-latte" p={[-5.2, 1.05, -5.3]} s={0.1} quality={q.detail} onOpen={onOpen} />
      <SceneFood slug="oreo-shake" p={[-4.7, 1.05, -5.35]} s={0.1} quality={q.detail} onOpen={onOpen} />
      <SceneFood slug="masala-chai" p={[-4.2, 1.05, -5.3]} s={0.11} quality={q.detail} onOpen={onOpen} />
      <SceneFood slug="cappuccino" p={[-5.7, 1.05, -5.25]} s={0.1} quality={q.detail} onOpen={onOpen} />
      {/* Cup stacks and syrups on the back counter */}
      <Scatter g={geo.cyl(0.045, 0.035, 0.09, 12)} m={M.ceramic()} items={Array.from({ length: 12 }, (_, i) => ({ p: [-8.9 + (i % 4) * 0.12, 0.99 + Math.floor(i / 4) * 0.09, -7.55] }))} />
      <Scatter g={geo.cyl(0.04, 0.04, 0.3, 10)} m={mat('#ffffff', { roughness: 0.2 })} items={['#b8661a', '#7a3e24', '#c45a7c', '#e8c27a', '#4f7d3a'].map((c, i) => ({ p: [-4.6 + i * 0.12, 1.1, -7.6], c }))} />
      <WallShelf p={[-7.4, 1.75, -7.85]} length={2.6} />
      <WallShelf p={[-7.4, 2.25, -7.85]} length={2.6} />
      <WallShelf p={[-4.6, 1.75, -7.85]} length={1.6} />
      <MenuBoard p={[-6.2, 3.0, -7.86]} w={3.0} h={1.6} title="Coffee & Drinks" rows={rows} />
      <ColdFridge p={[-3.2, 0, -7.45]} />
      {[-8.4, -6.4, -4.4].map((x) => (
        <Pendant key={x} p={[x, 4.0, -5.4]} color="#2a1d15" drop={1.3} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Bakery & dessert display case along the left wall.
// ---------------------------------------------------------------------------

const CASE_ITEMS = [
  ['butter-croissant', 'croissant', {}],
  ['chocolate-muffin', 'muffin', { flavor: 'chocolate' }],
  ['donut', 'donut', {}],
  ['cinnamon-roll', 'cinnamonRoll', {}],
  ['cookies', 'cookies', {}],
  ['blueberry-muffin', 'muffin', { flavor: 'blueberry' }],
  ['cheesecake', 'cheesecake', {}],
  ['tiramisu', 'tiramisu', {}],
  ['chocolate-lava-cake', 'lavaCake', {}],
  ['chocolate-pastry', 'pastry', { flavor: 'chocolate' }],
  ['chocolate-brownie', 'brownie', {}],
  ['freshly-baked-pastry', 'pastry', { flavor: 'pineapple' }],
];

function Turntable({ children, p, reducedMotion }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (!reducedMotion && ref.current) ref.current.rotation.y += dt * 0.4;
  });
  return (
    <group position={p}>
      <Mesh g={geo.cyl(0.16, 0.16, 0.02, 24)} m={M.ceramic()} p={[0, 0.16, 0]} />
      <Mesh g={geo.cyl(0.02, 0.06, 0.16, 12)} m={M.ceramic()} p={[0, 0.08, 0]} />
      <group ref={ref} position={[0, 0.17, 0]}>
        {children}
      </group>
      <Mesh g={geo.sphere(0.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)} m={M.glass()} p={[0, 0.17, 0]} s={[1, 1.3, 1]} cast={false} />
    </group>
  );
}

export function PastryCase({ q, reducedMotion, onStation, onOpen, demoId }) {
  const x = -9.25;
  const items = q.detail === 'low' ? CASE_ITEMS.slice(0, 8) : CASE_ITEMS;
  return (
    <group>
      <Clickable onClick={() => onStation('pastry-case')} label="Bakery & Desserts – see the case">
        <Mesh g={geo.box(0.95, 0.9, 5.6)} m={W.walnut()} p={[x, 0.45, -0.2]} />
        <Mesh g={geo.box(0.97, 0.04, 5.62)} m={W.marble()} p={[x, 0.92, -0.2]} />
        {/* Glass case with two shelves and a light strip */}
        <Mesh g={geo.box(0.9, 0.62, 5.5)} m={M.glass()} p={[x + 0.02, 1.25, -0.2]} cast={false} receive={false} />
        <Mesh g={geo.box(0.92, 0.03, 5.52)} m={M.darkSteel()} p={[x, 1.57, -0.2]} />
        <Mesh g={geo.box(0.85, 0.015, 5.4)} m={M.glassThick()} p={[x, 1.24, -0.2]} cast={false} />
        <Mesh g={geo.box(0.6, 0.01, 5.2)} m={M.emissive('#fff1d6', 1.4)} p={[x, 1.55, -0.2]} cast={false} />
      </Clickable>
      {items.map(([slug, key, params], i) => {
        const shelf = i < 6 ? 0 : 1;
        const z = -2.55 + (i % 6) * 0.9;
        return <SceneFood key={slug} slug={slug} fallback={{ key, params }} p={[x + 0.08, shelf ? 1.255 : 0.945, z]} r={[0, Math.PI / 2, 0]} s={0.15} quality={q.detail} onOpen={onOpen} />;
      })}
      <Turntable p={[x, 1.58, 1.6]} reducedMotion={reducedMotion}>
        <group scale={0.13}>
          <SceneFood slug="ice-cream-sundae" fallback={{ key: 'sundae' }} p={[0, 0, 0]} s={0.75} quality={q.detail} mode="assemble" playId={demoId} reducedMotion={reducedMotion} onOpen={onOpen} />
        </group>
      </Turntable>
      <Turntable p={[x, 1.58, -1.9]} reducedMotion={reducedMotion}>
        <SceneFood slug="cheesecake" fallback={{ key: 'cheesecake' }} p={[0, 0, 0]} s={0.14} quality={q.detail} onOpen={onOpen} />
      </Turntable>
      {/* Bread shelves and art on the wall behind */}
      {[1.0, 1.55].map((y) => (
        <group key={y}>
          <Mesh g={geo.box(0.32, 0.04, 4.6)} m={W.walnut()} p={[-9.82, y + 0.9, -0.2]} />
          <Scatter
            g={geo.capsule(0.08, 0.22, 4, 10)}
            m={mat('#ffffff', { map: tex.baked('#c8853e', '#7a3a10', 60), roughness: 0.6 })}
            items={Array.from({ length: 9 }, (_, i) => ({ p: [-9.8, y + 1.0, -2.3 + i * 0.52], r: [Math.PI / 2, 0, 0.2] }))}
          />
        </group>
      ))}
      <Artwork p={[-9.88, 3.2, -1.5]} r={Math.PI / 2} seed="bakery-a" />
      <Artwork p={[-9.88, 3.2, 1.1]} r={Math.PI / 2} seed="bakery-b" w={1.2} h={0.8} palette={['#f3e7cf', '#e8a46b', '#5a3620', '#c4622d']} />
      <Pendant p={[-8.9, 4.0, -1.5]} color="#c4622d" />
      <Pendant p={[-8.9, 4.0, 1.1]} color="#c4622d" />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Open kitchen: pass counter and four cooking stations along the back wall.
// ---------------------------------------------------------------------------

function useDemoTween(demoId, build, deps = []) {
  useEffect(() => {
    if (!demoId) return undefined;
    const tl = build();
    return () => tl?.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoId, ...deps]);
}

function Tandoor({ p, demoId, reducedMotion, q }) {
  const skewers = useRef();
  useDemoTween(demoId, () => {
    if (!skewers.current || reducedMotion) return null;
    return gsap.timeline().to(skewers.current.position, { y: -0.35, duration: 0.8, ease: 'power2.in' }).to(skewers.current.position, { y: 0.15, duration: 0.8, ease: 'power2.out' }, '+=1.4');
  });
  const clay = mat('#ffffff', { map: tex.baked('#b5643c', '#6b2a12', 80), roughness: 0.9 });
  return (
    <group position={p}>
      <Mesh g={geo.lathe('tandoorBody', [[0, 0], [0.5, 0], [0.55, 0.4], [0.48, 0.9], [0.32, 0.95], [0.3, 0.9], [0.4, 0.4], [0, 0.1]], 32)} m={clay} />
      <Mesh g={geo.circle(0.3, 24)} m={M.emissive('#ff6a1a', 1.8)} p={[0, 0.7, 0]} r={[-Math.PI / 2, 0, 0]} cast={false} />
      <Fire p={[0, 0.62, 0]} scale={0.8} light={q.pointLights >= 5} intensity={1.6} reducedMotion={reducedMotion} />
      <group ref={skewers} position={[0, 0.15, 0]}>
        {[-0.08, 0.08].map((x) => (
          <group key={x} position={[x, 1.1, 0]}>
            <Mesh g={geo.cyl(0.008, 0.008, 0.9, 5)} m={M.steel()} />
            <Scatter g={geo.rbox(0.07, 0.07, 0.07, 0.015)} m={mat('#ffffff', { map: tex.baked('#c4572b', '#3a1406', 60) })} items={[0, 1, 2, 3].map((i) => ({ p: [0, -0.3 + i * 0.12, 0], r: [0, i, 0] }))} />
          </group>
        ))}
      </group>
    </group>
  );
}

function WokRange({ p, demoId, reducedMotion, q }) {
  const wok = useRef();
  const toss = useRef();
  useDemoTween(demoId, () => {
    if (!wok.current || reducedMotion) return null;
    const tl = gsap.timeline();
    for (let i = 0; i < 4; i++) {
      tl.to(wok.current.rotation, { x: -0.35, duration: 0.18, ease: 'power2.out' }).to(wok.current.rotation, { x: 0, duration: 0.22, ease: 'power2.in' });
      tl.fromTo(toss.current.position, { y: 0.05 }, { y: 0.35, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 1 }, '<-0.2');
    }
    return tl;
  });
  return (
    <group position={p}>
      <Mesh g={geo.box(1.4, 0.9, 0.9)} m={M.steel()} p={[0, 0.45, 0]} />
      <Mesh g={geo.box(1.42, 0.04, 0.92)} m={M.darkSteel()} p={[0, 0.92, 0]} />
      {[-0.35, 0.35].map((x) => (
        <Fire key={x} p={[x, 0.93, 0]} scale={0.45} light={x < 0 && q.pointLights >= 6} intensity={1.2} reducedMotion={reducedMotion} />
      ))}
      <group ref={wok} position={[-0.35, 1.05, 0]}>
        <Mesh g={geo.sphere(0.32, 24, 10, 0, Math.PI * 2, Math.PI * 0.6, Math.PI * 0.4)} m={mat('#2a2522', { roughness: 0.4, metalness: 0.7, side: THREE.DoubleSide })} p={[0, 0.3, 0]} />
        <Mesh g={geo.cyl(0.02, 0.02, 0.5, 6)} m={W.walnut()} p={[0, 0.06, 0.5]} r={[Math.PI / 2 - 0.2, 0, 0]} />
        <group ref={toss} position={[0, 0.05, 0]}>
          <Scatter g={geo.cyl(0.006, 0.006, 0.18, 4)} m={mat('#d8a548', { roughness: 0.4 })} items={Array.from({ length: 16 }, (_, i) => ({ p: [Math.cos(i) * 0.12, 0, Math.sin(i * 1.3) * 0.12], r: [i, i * 2, 0] }))} />
        </group>
      </group>
      <Mesh g={geo.cyl(0.18, 0.16, 0.28, 20)} m={M.steel()} p={[0.35, 1.08, 0]} />
      <Steam p={[0.35, 1.25, 0]} count={3} reducedMotion={reducedMotion} />
    </group>
  );
}

function Griddle({ p, demoId, reducedMotion }) {
  const patties = useRef();
  useDemoTween(demoId, () => {
    if (!patties.current || reducedMotion) return null;
    return gsap.timeline().to(patties.current.rotation, { x: Math.PI, duration: 0.35, stagger: 0.2 }, 0.4);
  });
  return (
    <group position={p}>
      <Mesh g={geo.box(1.5, 0.9, 0.9)} m={M.steel()} p={[0, 0.45, 0]} />
      <Mesh g={geo.box(1.4, 0.05, 0.8)} m={mat('#1e1b19', { roughness: 0.35, metalness: 0.7 })} p={[0, 0.93, 0]} />
      <group ref={patties} position={[-0.3, 0.98, 0]}>
        <Scatter g={geo.cyl(0.12, 0.12, 0.035, 20)} m={mat('#ffffff', { map: tex.baked('#6e4022', '#2a1206', 120) })} items={[[-0.15, 0], [0.15, 0.05], [0, -0.2]].map(([x, z]) => ({ p: [x, 0, z] }))} />
      </group>
      <Scatter g={geo.sphere(0.12, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)} m={mat('#ffffff', { map: tex.baked('#d79447', '#7a3d12', 40) })} items={[[0.3, 0.1], [0.55, 0.1], [0.42, -0.18]].map(([x, z]) => ({ p: [x, 0.96, z], s: [1, 0.5, 1] }))} />
      <Steam p={[-0.3, 1.0, 0]} count={5} color="#d9d4cc" rise={0.6} size={0.07} opacity={0.22} reducedMotion={reducedMotion} />
    </group>
  );
}

function PizzaOven({ p, q, reducedMotion }) {
  const brick = mat('#ffffff', { map: tex.brick(), roughness: 0.9 });
  const dome = mat('#ffffff', { map: tex.baked('#b5643c', '#6b2a12', 90), roughness: 0.85 });
  return (
    <group position={p}>
      <Mesh g={geo.box(1.8, 0.9, 1.5)} m={brick} p={[0, 0.45, 0]} />
      <Mesh g={geo.sphere(0.85, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)} m={dome} p={[0, 0.9, 0]} s={[1, 0.75, 0.85]} />
      {/* Arched mouth with a fire inside */}
      <Mesh g={geo.cyl(0.3, 0.3, 0.3, 20, false, -Math.PI / 2, Math.PI)} m={mat('#1a0e08', { roughness: 1 })} p={[0, 0.92, 0.62]} r={[Math.PI / 2, 0, 0]} />
      <Mesh g={geo.torus(0.32, 0.05, 8, 20, Math.PI)} m={brick} p={[0, 0.92, 0.75]} />
      <Fire p={[0, 0.92, 0.25]} scale={1.1} light={q.pointLights >= 3} intensity={3} reducedMotion={reducedMotion} />
      <Mesh g={geo.cyl(0.14, 0.14, 2.2, 16)} m={M.darkSteel()} p={[0, 2.5, -0.15]} />
      <group position={[1.05, 0, 0.4]} rotation={[0, 0, -0.12]}>
        <Mesh g={geo.cyl(0.015, 0.015, 1.4, 6)} m={W.oak()} p={[0, 0.75, 0]} />
        <Mesh g={geo.cyl(0.18, 0.18, 0.01, 20)} m={W.oak()} p={[0, 1.5, 0]} r={[Math.PI / 2, 0, 0]} />
      </group>
    </group>
  );
}

function HeatLamp({ p }) {
  return (
    <group position={p}>
      <Mesh g={geo.cyl(0.01, 0.01, 0.7, 4)} m={W.black()} p={[0, 0.35, 0]} cast={false} />
      <Mesh g={geo.box(0.9, 0.08, 0.2)} m={M.darkSteel()} cast={false} />
      <Mesh g={geo.box(0.8, 0.02, 0.14)} m={M.emissive('#ff9a5a', 1.6)} p={[0, -0.045, 0]} cast={false} />
    </group>
  );
}

const KITCHEN = [
  { station: 'tandoor', x: 0.0, slug: 'paneer-tikka', fallback: { key: 'tikka' } },
  { station: 'wok', x: 2.6, slug: 'hakka-noodles', fallback: { key: 'noodles' } },
  { station: 'grill', x: 5.2, slug: 'gourmet-burger', fallback: { key: 'burger', params: { gourmet: true, cheese: true } } },
  { station: 'pizza-oven', x: 8.1, slug: 'signature-special-pizza', fallback: { key: 'pizza', params: { toppings: ['paneer', 'olive', 'capsicum', 'corn'] } } },
];

export function Kitchen({ q, reducedMotion, onStation, onOpen, demo }) {
  const pizzaGroup = useRef();
  const pizzaDemo = demo.station === 'pizza-oven' ? demo.id : 0;
  // After the toppings go on, slide the pizza into the oven and back out.
  useDemoTween(pizzaDemo, () => {
    if (!pizzaGroup.current || reducedMotion) return null;
    pizzaGroup.current.position.set(0, 0, 0);
    return gsap
      .timeline({ delay: 2.6 })
      .to(pizzaGroup.current.position, { z: -0.95, y: -0.08, duration: 0.9, ease: 'power2.inOut' })
      .to(pizzaGroup.current.position, { z: 0, y: 0, duration: 0.9, ease: 'power2.inOut' }, '+=1.6');
  });

  const sideDishes = [
    ['vegetable-biryani', { key: 'biryani' }, -0.9, 0.14],
    ['steamed-momos', { key: 'momos' }, 1.4, 0.14],
    ['french-fries', { key: 'fries' }, 4.1, 0.13],
    ['alfredo-pasta', { key: 'pasta', params: { sauce: 'alfredo' } }, 6.6, 0.14],
  ];

  return (
    <group>
      {/* Pass counter where finished dishes wait under heat lamps */}
      <Counter p={[4.0, 0, -5.0]} size={[11.2, 1.1, 0.55]} top="steel" />
      {[0.0, 2.6, 5.2, 8.1].map((x) => (
        <HeatLamp key={x} p={[x, 1.75, -5.0]} />
      ))}
      {/* Prep counter and storage */}
      <Counter p={[4.0, 0, -6.15]} size={[11.2, 0.9, 0.4]} top="steel" front="steel" />
      <Mesh g={geo.box(10.6, 0.5, 1.2)} m={M.steel()} p={[4.2, 3.35, -7.3]} cast={false} />
      <Mesh g={geo.box(0.85, 2.1, 0.7)} m={M.steel()} p={[-1.55, 1.05, -7.5]} />
      <Mesh g={geo.box(0.02, 1.9, 0.03)} m={M.darkSteel()} p={[-1.25, 1.1, -7.14]} />
      <WallShelf p={[1.3, 2.4, -7.85]} length={2.4} />
      <WallShelf p={[6.6, 2.4, -7.85]} length={2.4} />
      <Scatter
        g={geo.cyl(0.11, 0.11, 0.16, 14)}
        m={M.steel()}
        items={Array.from({ length: 10 }, (_, i) => ({ p: [-0.6 + i * 1.05, 0.98, -6.15] }))}
      />
      <Scatter
        g={geo.cyl(0.1, 0.1, 0.03, 14)}
        m={mat('#ffffff', { roughness: 0.5 })}
        items={Array.from({ length: 10 }, (_, i) => ({ p: [-0.6 + i * 1.05, 1.07, -6.15], c: ['#c7362a', '#4f9a35', '#f2d23a', '#efe3ef', '#e8823a'][i % 5] }))}
      />

      {KITCHEN.map((k) => (
        <Clickable key={k.station} onClick={() => onStation(k.station)} label={`${k.station === 'pizza-oven' ? 'Pizza oven' : k.station[0].toUpperCase() + k.station.slice(1)} – see dishes`}>
          {k.station === 'tandoor' && <Tandoor p={[k.x, 0, -7.2]} q={q} demoId={demo.station === 'tandoor' ? demo.id : 0} reducedMotion={reducedMotion} />}
          {k.station === 'wok' && <WokRange p={[k.x, 0, -7.25]} q={q} demoId={demo.station === 'wok' ? demo.id : 0} reducedMotion={reducedMotion} />}
          {k.station === 'grill' && <Griddle p={[k.x, 0, -7.25]} demoId={demo.station === 'grill' ? demo.id : 0} reducedMotion={reducedMotion} />}
          {k.station === 'pizza-oven' && <PizzaOven p={[k.x, 0, -7.2]} q={q} reducedMotion={reducedMotion} />}
        </Clickable>
      ))}

      {/* Signature dish of each station on the pass; its demo replays the preparation */}
      {KITCHEN.map((k) => {
        const id = demo.station === k.station ? demo.id : 0;
        const node = <SceneFood slug={k.slug} fallback={k.fallback} p={[0, 0, 0]} s={k.station === 'pizza-oven' ? 0.2 : 0.17} mode="assemble" playId={id} quality={q.detail} reducedMotion={reducedMotion} onOpen={onOpen} />;
        return (
          <group key={k.slug} position={[k.x, 1.1, -4.98]}>
            {k.station === 'pizza-oven' ? <group ref={pizzaGroup}>{node}</group> : node}
          </group>
        );
      })}
      {q.decor &&
        sideDishes.map(([slug, fallback, x, s]) => <SceneFood key={slug} slug={slug} fallback={fallback} p={[x, 1.1, -4.95]} s={s} quality={q.detail} onOpen={onOpen} />)}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Reception / billing counter.
// ---------------------------------------------------------------------------

export function Reception({ onStation, cafeName }) {
  const screen = tex.label('posScreen', [
    { text: 'Order here', size: 90, y: 100 },
    { text: 'or tap “Order” anytime', size: 44, weight: 500, font: 'Inter', color: '#e8a46b', y: 180 },
  ], { bg: '#1b2622', border: false, w: 512, h: 256 });
  const rows = useMenuBoard(['burgers', 'pizza', 'indian', 'chinese', 'desserts'], 6);
  return (
    <group>
      <Clickable onClick={() => onStation('reception')} label="Order counter – menu, cart & checkout">
        <Counter p={[7.3, 0, 5.3]} size={[3.4, 1.05, 0.8]} />
        <group position={[6.6, 1.05, 5.25]}>
          <Mesh g={geo.box(0.12, 0.2, 0.12)} m={W.black()} p={[0, 0.1, 0]} />
          <group position={[0, 0.3, 0]} rotation={[-0.35, Math.PI, 0]}>
            <Mesh g={geo.box(0.42, 0.3, 0.03)} m={W.black()} />
            <Mesh g={geo.plane(0.38, 0.26)} m={mat('#ffffff', { map: screen, emissiveMap: screen, emissive: '#ffffff', emissiveIntensity: 0.8 })} p={[0, 0, 0.017]} r={[0, 0, 0]} cast={false} />
          </group>
        </group>
        <Mesh g={geo.rbox(0.18, 0.12, 0.22, 0.02)} m={mat('#efe8dc', { roughness: 0.5 })} p={[7.2, 1.11, 5.3]} />
        <group position={[7.7, 1.05, 5.0]}>
          <Mesh g={geo.cyl(0.07, 0.08, 0.02, 16)} m={W.black()} p={[0, 0.01, 0]} />
          <Mesh g={geo.sphere(0.06, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)} m={M.brass()} p={[0, 0.02, 0]} />
        </group>
        <Mesh g={geo.cyl(0.08, 0.08, 0.18, 16)} m={M.glassThick()} p={[8.2, 1.14, 5.0]} cast={false} />
      </Clickable>
      <MenuBoard p={[7.3, 3.0, 7.7]} r={Math.PI} w={2.8} h={1.5} title={cafeName} rows={rows} />
      <Counter p={[7.3, 0, 7.5]} size={[3.4, 0.95, 0.5]} top="oak" r={Math.PI} />
      <WallShelf p={[9.82, 1.6, 6.2]} r={-Math.PI / 2} length={2.2} />
      <WallShelf p={[9.82, 2.1, 6.2]} r={-Math.PI / 2} length={2.2} />
      <Pendant p={[6.6, 4.0, 5.3]} color="#7f9a7a" />
      <Pendant p={[8.0, 4.0, 5.3]} color="#7f9a7a" />
    </group>
  );
}
