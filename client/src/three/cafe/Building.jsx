import { forwardRef, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { geo, mat, M, tex, repeated } from '../kit.js';
import { Mesh } from '../food/shapes.jsx';

export const ROOM = { minX: -10, maxX: 10, minZ: -8, maxZ: 8, height: 4.2 };
const T = 0.2; // wall thickness

const materials = () => ({
  floor: mat('#ffffff', { map: repeated(tex.woodPlanks(), 5, 4), roughness: 0.55 }),
  kitchenFloor: mat('#ffffff', { map: repeated(tex.hexTiles(), 6, 2), roughness: 0.35 }),
  plaster: mat('#ffffff', { map: repeated(tex.plaster('#efe4d4'), 4, 2), roughness: 0.9 }),
  sage: mat('#ffffff', { map: repeated(tex.plaster('#7f9a7a'), 4, 2), roughness: 0.9 }),
  brick: mat('#ffffff', { map: repeated(tex.brick(), 4, 3), roughness: 0.85 }),
  whiteTiles: mat('#ffffff', { map: repeated(tex.tiles('#f4f1ea', '#e9e4da'), 6, 2), roughness: 0.3 }),
  exterior: mat('#ffffff', { map: repeated(tex.plaster('#d9c9b2'), 6, 2), roughness: 0.9 }),
  frame: mat('#2a1d15', { roughness: 0.5, metalness: 0.3 }),
  ceiling: mat('#ffffff', { map: repeated(tex.wood('#6b4428'), 6, 4), roughness: 0.8 }),
  beam: mat('#ffffff', { map: tex.wood('#4a2c18'), roughness: 0.75 }),
  glass: M.glass(),
});

/** Box helper: centre (x,y,z) and size (w,h,d). */
function Block({ c, s, m, cast = true, receive = true, ...rest }) {
  return <Mesh g={geo.box(...s)} m={m} p={c} cast={cast} receive={receive} {...rest} />;
}

/** Double door hinged on its outer edges, swinging inward when `open`. */
function Doors({ open, frame, glass, z, reducedMotion }) {
  const leaves = useRef([]);
  useEffect(() => {
    leaves.current.forEach((g, i) => {
      if (!g) return;
      const side = i === 0 ? -1 : 1;
      gsap.to(g.rotation, { y: open ? -side * 1.45 : 0, duration: reducedMotion ? 0 : 1.2, ease: 'power2.inOut' });
    });
  }, [open, reducedMotion]);
  return [-1, 1].map((side, i) => (
    <group key={side} ref={(el) => (leaves.current[i] = el)} position={[side * 1.0, 0, z]}>
      <group position={[-side * 0.5, 0, 0]}>
        <Block c={[0, 1.4, 0]} s={[1.0, 2.8, 0.06]} m={frame} />
        <Mesh g={geo.box(0.76, 2.3, 0.02)} m={glass} p={[0, 1.45, 0.025]} cast={false} />
        <Mesh g={geo.box(0.76, 2.3, 0.02)} m={glass} p={[0, 1.45, -0.025]} cast={false} />
        <Mesh g={geo.cyl(0.02, 0.02, 0.6, 8)} m={M.brass()} p={[-side * 0.38, 1.2, 0.08]} />
        <Mesh g={geo.cyl(0.02, 0.02, 0.6, 8)} m={M.brass()} p={[-side * 0.38, 1.2, -0.08]} />
      </group>
    </group>
  ));
}

export const Building = forwardRef(function Building({ cafeName = 'Ember & Bean', doorOpen = false, quality, reducedMotion }, colliderRef) {
  const m = useMemo(materials, []);
  const { minX, maxX, minZ, maxZ, height: H } = ROOM;

  // Front (street) wall: low band, transom, mullions and glass with a double door in the middle.
  const mullionXs = [-9.9, -7.4, -4.9, -2.4, -1.05, 1.05, 2.4, 4.9, 7.4, 9.9];
  const panes = [];
  for (let i = 0; i < mullionXs.length - 1; i++) {
    const a = mullionXs[i];
    const b = mullionXs[i + 1];
    if (a === -1.05) continue; // doorway
    panes.push([(a + b) / 2, b - a]);
  }

  const sign = tex.label(`sign|${cafeName}`, [
    { text: cafeName, size: 130, y: 112 },
    { text: 'CAFE · KITCHEN · BAKERY', size: 40, weight: 500, font: 'Inter', color: '#e8a46b', y: 205 },
  ]);
  const signMat = mat('#ffffff', { map: sign, emissiveMap: sign, emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 0.6 });
  const awning = mat('#ffffff', { map: repeated(tex.stripes('#c4622d', '#f3e7cf', 10), 3, 1), roughness: 0.8, side: THREE.DoubleSide });

  return (
    <group>
      {/* Floors */}
      <Mesh g={geo.plane(maxX - minX, maxZ - minZ)} m={m.floor} r={[-Math.PI / 2, 0, 0]} p={[0, 0, 0]} cast={false} />
      <Mesh g={geo.plane(11.6, 2.9)} m={m.kitchenFloor} r={[-Math.PI / 2, 0, 0]} p={[4.0, 0.004, -6.55]} cast={false} />

      {/* Walls that also stop the camera passing through */}
      <group ref={colliderRef}>
        <Block c={[minX - T / 2, H / 2, 0]} s={[T, H, maxZ - minZ + T * 2]} m={[m.exterior, m.plaster, m.plaster, m.plaster, m.plaster, m.plaster]} />
        <Block c={[maxX + T / 2, H / 2, 0]} s={[T, H, maxZ - minZ + T * 2]} m={[m.sage, m.exterior, m.sage, m.sage, m.sage, m.sage]} />
        <Block c={[-6.2, H / 2, minZ - T / 2]} s={[7.6, H, T]} m={m.brick} />
        <Block c={[3.8, H / 2, minZ - T / 2]} s={[12.4, H, T]} m={m.whiteTiles} />
        <Block c={[0, H + 0.1, 0]} s={[maxX - minX + T * 2, 0.2, maxZ - minZ + T * 2]} m={m.ceiling} cast={false} />
        {/* Front wall solid parts */}
        <Block c={[-5.5, 0.25, maxZ]} s={[9, 0.5, T]} m={m.frame} />
        <Block c={[5.5, 0.25, maxZ]} s={[9, 0.5, T]} m={m.frame} />
        <Block c={[0, 3.7, maxZ]} s={[maxX - minX + T * 2, 1.0, T]} m={m.exterior} />
        {/* Partition between coffee bar and kitchen */}
        <Block c={[-2.4, 1.6, -6.5]} s={[0.16, 3.2, 3.0]} m={m.brick} />
      </group>

      {/* Mullions and glazing */}
      {mullionXs.map((x) => (
        <Block key={x} c={[x, 1.85, maxZ]} s={[0.12, 2.7, 0.16]} m={m.frame} />
      ))}
      <Block c={[0, 3.18, maxZ]} s={[maxX - minX, 0.08, 0.18]} m={m.frame} />
      {panes.map(([x, w]) => (
        <Mesh key={x} g={geo.box(w - 0.12, 2.7, 0.03)} m={m.glass} p={[x, 1.85, maxZ]} cast={false} receive={false} />
      ))}

      <Doors open={doorOpen} frame={m.frame} glass={m.glass} z={maxZ} reducedMotion={reducedMotion} />
      <Block c={[0, 2.95, maxZ]} s={[2.2, 0.3, T + 0.02]} m={m.frame} />

      {/* Ceiling beams */}
      {[-6, -2, 2, 6].map((z) => (
        <Block key={z} c={[0, H - 0.15, z]} s={[maxX - minX, 0.3, 0.25]} m={m.beam} cast={false} />
      ))}

      {/* Facade: sign, awnings, wall lamps, roof */}
      <Block c={[0, 3.72, maxZ + 0.18]} s={[6.2, 0.86, 0.12]} m={m.frame} />
      <Mesh g={geo.plane(6, 0.72)} m={signMat} p={[0, 3.72, maxZ + 0.25]} cast={false} />
      {[-5.6, 5.6].map((x) => (
        <Mesh key={x} g={geo.plane(8.2, 1.6)} m={awning} p={[x, 3.0, maxZ + 0.7]} r={[-1.1, 0, 0]} />
      ))}
      <Mesh g={geo.plane(2.6, 1.1)} m={awning} p={[0, 3.05, maxZ + 0.5]} r={[-1.15, 0, 0]} />
      {[-1.5, 1.5].map((x) => (
        <group key={x} position={[x, 2.45, maxZ + 0.15]}>
          <Mesh g={geo.box(0.16, 0.28, 0.16)} m={m.frame} />
          <Mesh g={geo.box(0.11, 0.2, 0.17)} m={M.emissive('#ffcf8a', 2.2)} cast={false} />
        </group>
      ))}
      <Block c={[0, H + 0.45, 0.1]} s={[maxX - minX + 0.8, 0.5, maxZ - minZ + 0.8]} m={m.exterior} cast={false} />
      {quality?.decor && <Block c={[0, H + 0.9, maxZ + 0.2]} s={[maxX - minX + 0.8, 0.4, 0.25]} m={m.frame} cast={false} />}
    </group>
  );
});
