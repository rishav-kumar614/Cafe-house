import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { geo, mat, M, tex, rng, repeated } from '../kit.js';
import { Mesh, Scatter, leafGeometry, leafMat } from '../food/shapes.jsx';

// Shared materials for furniture and decor.
const W = {
  oak: () => mat('#ffffff', { map: tex.wood('#a06a3c'), roughness: 0.55 }),
  walnut: () => mat('#ffffff', { map: tex.wood('#5a3620'), roughness: 0.5 }),
  marble: () => mat('#ffffff', { map: tex.marble(), roughness: 0.18 }),
  black: () => mat('#1f1a17', { roughness: 0.4, metalness: 0.6 }),
  leather: () => mat('#7a3e22', { roughness: 0.45 }),
  fabric: (c) => mat('#ffffff', { map: tex.fabric(c), roughness: 0.95 }),
  pot: (c = '#c2673e') => mat(c, { roughness: 0.85 }),
  soil: () => mat('#3b2a1e', { roughness: 1 }),
};

// ---------- Seating ----------

export function Chair({ p, r = 0, color = '#5a3620' }) {
  const wood = color === '#5a3620' ? W.walnut() : mat(color, { roughness: 0.55 });
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Mesh g={geo.rbox(0.44, 0.05, 0.44, 0.02)} m={wood} p={[0, 0.46, 0]} />
      {[[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].map(([x, z], i) => (
        <Mesh key={i} g={geo.cyl(0.02, 0.018, 0.46, 8)} m={wood} p={[x, 0.23, z]} />
      ))}
      <Mesh g={geo.cyl(0.018, 0.018, 0.42, 8)} m={wood} p={[-0.19, 0.69, -0.2]} />
      <Mesh g={geo.cyl(0.018, 0.018, 0.42, 8)} m={wood} p={[0.19, 0.69, -0.2]} />
      <Mesh g={geo.rbox(0.44, 0.12, 0.03, 0.012)} m={wood} p={[0, 0.84, -0.2]} />
    </group>
  );
}

export function Stool({ p }) {
  return (
    <group position={p}>
      <Mesh g={geo.cyl(0.19, 0.17, 0.07, 20)} m={W.leather()} p={[0, 0.76, 0]} />
      <Mesh g={geo.cyl(0.025, 0.025, 0.72, 8)} m={W.black()} p={[0, 0.37, 0]} />
      <Mesh g={geo.cyl(0.2, 0.22, 0.03, 20)} m={W.black()} p={[0, 0.015, 0]} />
      <Mesh g={geo.torus(0.15, 0.012, 6, 20)} m={W.black()} p={[0, 0.3, 0]} r={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

export function Sofa({ p, r = 0, length = 2.2, color = '#4d6b5a' }) {
  const f = W.fabric(color);
  const cushions = Math.max(1, Math.round(length / 0.75));
  const cushionW = (length - 0.4) / cushions;
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Mesh g={geo.rbox(length, 0.35, 0.9, 0.06)} m={f} p={[0, 0.28, 0]} />
      <Mesh g={geo.rbox(length, 0.55, 0.2, 0.08)} m={f} p={[0, 0.65, -0.37]} />
      <Mesh g={geo.rbox(0.2, 0.5, 0.9, 0.08)} m={f} p={[-length / 2 + 0.1, 0.5, 0]} />
      <Mesh g={geo.rbox(0.2, 0.5, 0.9, 0.08)} m={f} p={[length / 2 - 0.1, 0.5, 0]} />
      {Array.from({ length: cushions }, (_, i) => (
        <Mesh key={i} g={geo.rbox(cushionW - 0.04, 0.14, 0.62, 0.06)} m={f} p={[-length / 2 + 0.2 + (i + 0.5) * cushionW, 0.52, 0.05]} />
      ))}
      <Mesh g={geo.rbox(0.4, 0.38, 0.12, 0.08)} m={W.fabric('#d9a35a')} p={[-length / 2 + 0.45, 0.78, -0.22]} r={[-0.25, 0.2, 0]} />
      <Mesh g={geo.rbox(0.4, 0.38, 0.12, 0.08)} m={W.fabric('#c4622d')} p={[length / 2 - 0.45, 0.78, -0.22]} r={[-0.25, -0.2, 0]} />
      {[-1, 1].map((s) => (
        <Mesh key={s} g={geo.cyl(0.03, 0.02, 0.1, 8)} m={W.black()} p={[s * (length / 2 - 0.12), 0.05, 0.3]} />
      ))}
    </group>
  );
}

// ---------- Tables ----------

export function Table({ p, round = false, size = 0.75, marble = false, children }) {
  const top = marble ? W.marble() : W.oak();
  return (
    <group position={p}>
      {round ? (
        <Mesh g={geo.cyl(size / 2, size / 2, 0.04, 40)} m={top} p={[0, 0.75, 0]} />
      ) : (
        <Mesh g={geo.rbox(size, 0.04, size, 0.01)} m={top} p={[0, 0.75, 0]} />
      )}
      <Mesh g={geo.cyl(0.04, 0.04, 0.72, 10)} m={W.black()} p={[0, 0.37, 0]} />
      <Mesh g={geo.cyl(0.26, 0.28, 0.03, 24)} m={W.black()} p={[0, 0.015, 0]} />
      <group position={[0, 0.77, 0]}>{children}</group>
    </group>
  );
}

/** Small things that make a table feel used: vase, condiments, number card. */
export function TableSet({ number, flower = '#e8584a' }) {
  return (
    <group>
      <Mesh g={geo.cyl(0.035, 0.045, 0.14, 12)} m={M.glassThick()} p={[0, 0.07, 0]} cast={false} />
      <Mesh g={geo.cyl(0.004, 0.004, 0.22, 4)} m={mat('#3f6b2a')} p={[0, 0.17, 0]} />
      <Mesh g={geo.ico(0.035, 1)} m={mat(flower, { roughness: 0.6 })} p={[0, 0.28, 0]} />
      <Mesh g={geo.cyl(0.018, 0.018, 0.07, 10)} m={M.ceramic()} p={[0.09, 0.035, 0.03]} />
      <Mesh g={geo.cyl(0.018, 0.018, 0.07, 10)} m={mat('#2a2522')} p={[0.13, 0.035, 0.03]} />
      {number && <Mesh g={geo.box(0.1, 0.07, 0.005)} m={mat('#ffffff', { map: tex.label(`table${number}`, [{ text: `${number}`, size: 160 }], { w: 256, h: 192 }) })} p={[-0.1, 0.04, 0.04]} r={[-0.3, 0.4, 0]} />}
    </group>
  );
}

// ---------- Plants ----------

function Foliage({ count = 30, radius = 0.4, height = 0.9, seed = 'plant', color = '#3f7d3a', leafScale = 2.2 }) {
  const items = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => {
      const a = r() * Math.PI * 2;
      const h = r();
      const d = (0.2 + r() * 0.8) * radius * (1 - h * 0.5);
      return { p: [Math.cos(a) * d, h * height, Math.sin(a) * d], r: [-0.6 - r() * 0.6, -a + Math.PI / 2, 0], s: leafScale * (0.7 + r() * 0.6) };
    });
  }, [count, radius, height, seed, leafScale]);
  return <Scatter g={leafGeometry()} m={leafMat(color)} items={items} />;
}

export function Plant({ p, size = 1, pot = '#c2673e', seed = 'p', sway = true, reducedMotion }) {
  const group = useRef();
  useFrame(({ clock }) => {
    if (!sway || reducedMotion || !group.current) return;
    group.current.rotation.z = Math.sin(clock.elapsedTime * 0.7 + p[0]) * 0.025;
  });
  return (
    <group position={p} scale={size}>
      <Mesh g={geo.cyl(0.26, 0.2, 0.42, 20)} m={W.pot(pot)} p={[0, 0.21, 0]} />
      <Mesh g={geo.cyl(0.24, 0.24, 0.02, 20)} m={W.soil()} p={[0, 0.41, 0]} />
      <group ref={group} position={[0, 0.4, 0]}>
        <Mesh g={geo.cyl(0.015, 0.02, 0.6, 6)} m={mat('#5a4a2a')} p={[0, 0.3, 0]} />
        <Foliage seed={seed} />
      </group>
    </group>
  );
}

export function HangingPlant({ p, seed = 'hang' }) {
  return (
    <group position={p}>
      <Mesh g={geo.cyl(0.004, 0.004, 0.8, 4)} m={mat('#2a1d15')} p={[0, 0.4, 0]} />
      <Mesh g={geo.sphere(0.17, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)} m={W.pot('#efe4d4')} />
      <group rotation={[Math.PI, 0, 0]} position={[0, 0.05, 0]}>
        <Foliage seed={seed} count={22} radius={0.3} height={0.6} color="#4f8f3a" leafScale={1.6} />
      </group>
    </group>
  );
}

export function Tree({ p, seed = 'tree', size = 1 }) {
  const crowns = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: 6 }, () => [(r() - 0.5) * 1.2, 2.4 + r() * 1.0, (r() - 0.5) * 1.2, 0.6 + r() * 0.4]);
  }, [seed]);
  return (
    <group position={p} scale={size}>
      <Mesh g={geo.cyl(0.1, 0.16, 2.6, 10)} m={mat('#5a4030', { roughness: 0.95 })} p={[0, 1.3, 0]} />
      {crowns.map(([x, y, z, s], i) => (
        <Mesh key={i} g={geo.ico(1, 1)} m={mat(i % 2 ? '#4f7d3a' : '#5f8f45', { roughness: 0.9, flatShading: true })} p={[x, y, z]} s={s} />
      ))}
    </group>
  );
}

export function Planter({ p, length = 3, seed = 'planter' }) {
  const shrubs = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: Math.round(length * 2) }, (_, i) => [-length / 2 + 0.25 + i * 0.5, 0.65 + r() * 0.1, (r() - 0.5) * 0.15, 0.28 + r() * 0.12, r() > 0.75]);
  }, [seed, length]);
  return (
    <group position={p}>
      <Mesh g={geo.box(length, 0.5, 0.6)} m={W.walnut()} p={[0, 0.25, 0]} />
      {shrubs.map(([x, y, z, s, flower], i) => (
        <group key={i}>
          <Mesh g={geo.ico(1, 1)} m={mat(i % 2 ? '#4f7d3a' : '#5f8f45', { roughness: 0.9, flatShading: true })} p={[x, y, z]} s={s} />
          {flower && <Mesh g={geo.ico(0.06, 0)} m={mat(i % 3 ? '#f2c14e' : '#e8584a')} p={[x + 0.1, y + s * 0.9, z]} />}
        </group>
      ))}
    </group>
  );
}

// ---------- Lighting fixtures ----------

export function Pendant({ p, color = '#c4622d', drop = 1.2 }) {
  return (
    <group position={p}>
      <Mesh g={geo.cyl(0.006, 0.006, drop, 4)} m={W.black()} p={[0, -drop / 2, 0]} cast={false} />
      <Mesh g={geo.cone(0.22, 0.24, 24, true)} m={mat(color, { roughness: 0.4, metalness: 0.4, side: THREE.DoubleSide })} p={[0, -drop - 0.08, 0]} cast={false} />
      <Mesh g={geo.sphere(0.07, 12, 8)} m={M.emissive('#ffd59a', 4)} p={[0, -drop - 0.17, 0]} cast={false} />
    </group>
  );
}

export function FloorLamp({ p }) {
  return (
    <group position={p}>
      <Mesh g={geo.cyl(0.18, 0.2, 0.03, 20)} m={W.black()} p={[0, 0.015, 0]} />
      <Mesh g={geo.cyl(0.015, 0.015, 1.5, 8)} m={W.black()} p={[0, 0.76, 0]} />
      <Mesh g={geo.cyl(0.18, 0.26, 0.32, 24, true)} m={mat('#f3e7cf', { roughness: 0.8, side: THREE.DoubleSide, emissive: '#ffcf8a', emissiveIntensity: 0.5 })} p={[0, 1.6, 0]} cast={false} />
    </group>
  );
}

export function CeilingFan({ p, reducedMotion }) {
  const blades = useRef();
  useFrame((_, dt) => {
    if (!reducedMotion && blades.current) blades.current.rotation.y += dt * 2.2;
  });
  return (
    <group position={p}>
      <Mesh g={geo.cyl(0.02, 0.02, 0.4, 6)} m={W.black()} p={[0, -0.2, 0]} cast={false} />
      <Mesh g={geo.cyl(0.12, 0.1, 0.12, 16)} m={W.black()} p={[0, -0.44, 0]} cast={false} />
      <group ref={blades} position={[0, -0.46, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <Mesh key={i} g={geo.rbox(0.7, 0.015, 0.14, 0.005)} m={W.walnut()} p={[Math.cos((i * Math.PI) / 2) * 0.45, 0, Math.sin((i * Math.PI) / 2) * 0.45]} r={[0, (-i * Math.PI) / 2, 0.06]} cast={false} />
        ))}
      </group>
    </group>
  );
}

export function StringLights({ from, to, sag = 0.5, count = 14, reducedMotion }) {
  const { curve, points } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const mid = a.clone().lerp(b, 0.5);
    mid.y -= sag;
    const c = new THREE.QuadraticBezierCurve3(a, mid, b);
    return { curve: new THREE.TubeGeometry(c, 24, 0.008, 4), points: Array.from({ length: count }, (_, i) => c.getPoint((i + 0.5) / count)) };
  }, [from, to, sag, count]);
  const bulbs = useRef([]);
  useFrame(({ clock }) => {
    if (reducedMotion) return;
    bulbs.current.forEach((b, i) => {
      if (b) b.scale.setScalar(0.85 + Math.sin(clock.elapsedTime * 2 + i * 1.7) * 0.15);
    });
  });
  return (
    <group>
      <mesh geometry={curve} material={W.black()} />
      {points.map((pt, i) => (
        <mesh key={i} ref={(el) => (bulbs.current[i] = el)} geometry={geo.sphere(0.045, 8, 6)} material={M.emissive('#ffcf7a', 3)} position={pt} />
      ))}
    </group>
  );
}

// ---------- Decor ----------

export function Artwork({ p, r = 0, w = 0.9, h = 1.15, seed = 'art', palette = ['#efe4d4', '#c4622d', '#2a1d15', '#7f9a7a', '#e8a46b'] }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Mesh g={geo.box(w + 0.08, h + 0.08, 0.04)} m={W.walnut()} />
      <Mesh g={geo.plane(w, h)} m={mat('#ffffff', { map: tex.art(seed, palette), roughness: 0.8 })} p={[0, 0, 0.022]} cast={false} />
    </group>
  );
}

export function WallShelf({ p, r = 0, length = 1.8, items = 'jars' }) {
  const things = useMemo(() => {
    const rr = rng(`shelf${p.join(',')}`);
    return Array.from({ length: Math.floor(length / 0.22) }, (_, i) => ({ x: -length / 2 + 0.15 + i * 0.22, h: 0.14 + rr() * 0.16, c: ['#c4622d', '#e8a46b', '#7f9a7a', '#f3e7cf', '#5a3620'][Math.floor(rr() * 5)], kind: rr() }));
  }, [p, length]);
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Mesh g={geo.box(length, 0.04, 0.28)} m={W.walnut()} />
      {things.map((t, i) =>
        items === 'books' ? (
          <Mesh key={i} g={geo.box(0.05, t.h + 0.08, 0.2)} m={mat(t.c, { roughness: 0.8 })} p={[t.x, (t.h + 0.08) / 2 + 0.02, 0]} r={[0, 0, t.kind > 0.8 ? 0.2 : 0]} />
        ) : t.kind > 0.5 ? (
          <group key={i} position={[t.x, 0.02, 0]}>
            <Mesh g={geo.cyl(0.07, 0.07, t.h, 14)} m={M.glassThick()} p={[0, t.h / 2, 0]} cast={false} />
            <Mesh g={geo.cyl(0.065, 0.065, t.h * 0.7, 14)} m={mat(t.c, { roughness: 0.9 })} p={[0, t.h * 0.35, 0]} />
            <Mesh g={geo.cyl(0.075, 0.075, 0.03, 14)} m={W.oak()} p={[0, t.h + 0.015, 0]} />
          </group>
        ) : (
          <Mesh key={i} g={geo.rbox(0.14, t.h + 0.05, 0.1, 0.02)} m={mat(t.c, { roughness: 0.7 })} p={[t.x, (t.h + 0.05) / 2 + 0.02, 0]} />
        )
      )}
    </group>
  );
}

export function Rug({ p, w = 3, d = 2, color = '#c4622d', border = '#3a2a20' }) {
  return (
    <group position={p} rotation={[-Math.PI / 2, 0, 0]}>
      <Mesh g={geo.plane(w, d)} m={mat(border, { roughness: 1 })} cast={false} />
      <Mesh g={geo.plane(w - 0.24, d - 0.24)} m={mat('#ffffff', { map: repeated(tex.fabric(color), Math.round(w * 2), Math.round(d * 2)), roughness: 1 })} p={[0, 0, 0.002]} cast={false} />
    </group>
  );
}

export function Umbrella({ p, color = '#c4622d' }) {
  return (
    <group position={p}>
      <Mesh g={geo.cyl(0.03, 0.03, 2.4, 8)} m={W.black()} p={[0, 1.2, 0]} />
      <Mesh g={geo.cone(1.3, 0.5, 8, true)} m={mat('#ffffff', { map: tex.stripes(color, '#f3e7cf', 8), roughness: 0.85, side: THREE.DoubleSide })} p={[0, 2.35, 0]} />
    </group>
  );
}

export function Bench({ p, r = 0 }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      {[0, 1, 2].map((i) => (
        <Mesh key={i} g={geo.box(1.6, 0.04, 0.12)} m={W.oak()} p={[0, 0.45, -0.15 + i * 0.15]} />
      ))}
      <Mesh g={geo.box(1.6, 0.3, 0.04)} m={W.oak()} p={[0, 0.75, -0.24]} r={[-0.15, 0, 0]} />
      {[-0.7, 0.7].map((x) => (
        <Mesh key={x} g={geo.box(0.06, 0.45, 0.5)} m={W.black()} p={[x, 0.22, 0]} />
      ))}
    </group>
  );
}

export function AFrameSign({ p, r = 0, title = 'Today', lines = [] }) {
  const board = tex.chalkboard(`aframe|${title}`, title, lines);
  return (
    <group position={p} rotation={[0, r, 0]}>
      {[-1, 1].map((s) => (
        <group key={s} rotation={[s * 0.18, s === 1 ? 0 : Math.PI, 0]}>
          <Mesh g={geo.box(0.62, 0.95, 0.03)} m={W.walnut()} p={[0, 0.48, 0.08]} />
          <Mesh g={geo.plane(0.54, 0.84)} m={mat('#ffffff', { map: board, roughness: 0.9 })} p={[0, 0.5, 0.1]} cast={false} />
        </group>
      ))}
    </group>
  );
}

export function StreetLamp({ p }) {
  return (
    <group position={p}>
      <Mesh g={geo.cyl(0.06, 0.09, 4.2, 10)} m={W.black()} p={[0, 2.1, 0]} />
      <Mesh g={geo.box(0.6, 0.06, 0.06)} m={W.black()} p={[0.25, 4.1, 0]} />
      <Mesh g={geo.cyl(0.12, 0.22, 0.25, 12)} m={W.black()} p={[0.5, 3.95, 0]} />
      <Mesh g={geo.sphere(0.1, 10, 8)} m={M.emissive('#ffe2a8', 2)} p={[0.5, 3.83, 0]} cast={false} />
    </group>
  );
}

export const FURNITURE_MATERIALS = W;
