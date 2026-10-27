import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { geo, mat, M, memo, rng, tex, displaced, wobble } from '../kit.js';

// ---------- Part descriptors ----------

/**
 * A food model is a list of parts. Each part is animated independently (assembly, explode
 * into ingredients) and may carry an ingredient label.
 *   anim: drop | pop | rise | fill | stream | spin | none
 */
export function part(id, label, node, { pos = [0, 0, 0], rot, explode = [0, 0, 0], anim = 'drop', at, dur, labelSide, hidden = false } = {}) {
  // hidden: only shown in the exploded "ingredients" view (e.g. a filling that is inside the dish).
  return { id, label, node, pos, rot, explode, anim, at, dur, labelSide, hidden };
}

// ---------- Basic mesh helpers ----------

export function Mesh({ g, m, p, r, s, cast = true, receive = true, ...rest }) {
  return <mesh geometry={g} material={m} position={p} rotation={r} scale={s} castShadow={cast} receiveShadow={receive} {...rest} />;
}

const tmpObj = new THREE.Object3D();
const tmpColor = new THREE.Color();

/** Instanced copies of one geometry. items: [{ p:[x,y,z], r:[x,y,z], s:number|[x,y,z], c?:color }] */
export function Scatter({ g, m, items, cast = true }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach((it, i) => {
      tmpObj.position.set(...it.p);
      tmpObj.rotation.set(...(it.r || [0, 0, 0]));
      const s = it.s ?? 1;
      if (Array.isArray(s)) tmpObj.scale.set(...s);
      else tmpObj.scale.setScalar(s);
      tmpObj.updateMatrix();
      mesh.setMatrixAt(i, tmpObj.matrix);
      if (it.c) mesh.setColorAt(i, tmpColor.set(it.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return <instancedMesh ref={ref} args={[g, m, items.length]} castShadow={cast} receiveShadow />;
}

/** Random points on a disc of `radius` at height y. */
export function scatterDisc(seed, count, radius, y = 0, { minR = 0, s = 1, sJitter = 0.3, tilt = 0.25, colors } = {}) {
  const r = rng(seed);
  return Array.from({ length: count }, () => {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r() * (1 - (minR / radius) ** 2) + (minR / radius) ** 2) * radius;
    return {
      p: [Math.cos(a) * d, y + r() * 0.01, Math.sin(a) * d],
      r: [(r() - 0.5) * tilt, r() * Math.PI * 2, (r() - 0.5) * tilt],
      s: s * (1 - sJitter / 2 + r() * sJitter),
      ...(colors ? { c: colors[Math.floor(r() * colors.length)] } : {}),
    };
  });
}

/** Random points on the upper part of an ellipsoid, oriented outward. */
export function scatterDome(seed, count, rx, ry, rz, { y0 = 0, minPolar = 0, maxPolar = Math.PI / 2, s = 1, sJitter = 0.3, colors, lift = 0 } = {}) {
  const r = rng(seed);
  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  return Array.from({ length: count }, () => {
    const a = r() * Math.PI * 2;
    const cosMin = Math.cos(minPolar);
    const cosMax = Math.cos(maxPolar);
    const ct = cosMax + r() * (cosMin - cosMax);
    const st = Math.sqrt(1 - ct * ct);
    const n = new THREE.Vector3((st * Math.cos(a)) / rx, ct / ry, (st * Math.sin(a)) / rz).normalize();
    q.setFromUnitVectors(up, n);
    const spin = new THREE.Quaternion().setFromAxisAngle(n, r() * Math.PI * 2);
    e.setFromQuaternion(spin.multiply(q));
    return {
      p: [st * Math.cos(a) * (rx + lift), y0 + ct * (ry + lift), st * Math.sin(a) * (rz + lift)],
      r: [e.x, e.y, e.z],
      s: s * (1 - sJitter / 2 + r() * sJitter),
      ...(colors ? { c: colors[Math.floor(r() * colors.length)] } : {}),
    };
  });
}

// ---------- Tableware ----------

export function Plate({ r = 1.2, color = '#f7f4ee', p = [0, 0, 0] }) {
  const g = geo.lathe(`plate${r}`, [
    [0, 0],
    [r * 0.72, 0],
    [r * 0.78, 0.025],
    [r * 0.97, 0.1],
    [r, 0.115],
    [r * 0.985, 0.125],
    [r * 0.8, 0.06],
    [r * 0.72, 0.045],
    [0, 0.045],
  ], 48);
  return <Mesh g={g} m={M.ceramic(color)} p={p} />;
}

export function SteelPlate({ r = 1.25, p = [0, 0, 0] }) {
  const g = geo.lathe(`steelplate${r}`, [
    [0, 0],
    [r * 0.88, 0],
    [r * 0.92, 0.02],
    [r, 0.12],
    [r * 0.99, 0.13],
    [r * 0.9, 0.04],
    [0, 0.035],
  ], 48);
  return <Mesh g={g} m={M.steel()} p={p} />;
}

/** Bowl from a simple profile. Returns its inner radius at a fill height via bowlRadiusAt. */
export function bowlProfile(r, h) {
  return [
    [0, 0],
    [r * 0.45, 0],
    [r * 0.5, 0.02],
    [r * 0.82, h * 0.45],
    [r, h],
    [r * 0.94, h + 0.01],
    [r * 0.77, h * 0.48],
    [r * 0.43, 0.07],
    [0, 0.07],
  ];
}
export const bowlRadiusAt = (r, h, y) => {
  const t = Math.min(1, Math.max(0, y / h));
  return r * (0.43 + (0.94 - 0.43) * Math.sqrt(t));
};

export function Bowl({ r = 0.95, h = 0.55, color = '#f7f4ee', m, p = [0, 0, 0] }) {
  const g = geo.lathe(`bowl${r}|${h}`, bowlProfile(r, h), 48);
  return <Mesh g={g} m={m || M.ceramic(color)} p={p} />;
}

/** Flat fill surface inside a bowl (gravy, soup...). */
export function BowlFill({ r, h, level = 0.75, color, m, bump = 0 }) {
  const y = h * level;
  const rad = bowlRadiusAt(r, h, y) * 0.98;
  const g = bump
    ? displaced(`fill${r}|${h}|${level}|${bump}`, geo.cyl(rad, rad * 0.6, y - 0.05, 40), (v) => {
        if (v.y > 0) v.y += wobble(v.x, 0, v.z, 5) * bump;
      })
    : geo.cyl(rad, rad * 0.6, y - 0.05, 40);
  return <Mesh g={g} m={m || mat(color, { roughness: 0.3 })} p={[0, 0.05 + (y - 0.05) / 2, 0]} />;
}

export function Katori({ r = 0.32, h = 0.22, fill, p = [0, 0, 0], fillLevel = 0.8, children }) {
  const g = geo.lathe(`katori${r}|${h}`, [
    [0, 0],
    [r * 0.8, 0],
    [r, h * 0.2],
    [r, h],
    [r * 0.93, h],
    [r * 0.93, h * 0.22],
    [r * 0.75, 0.03],
    [0, 0.03],
  ], 32);
  const fy = h * fillLevel;
  return (
    <group position={p}>
      <Mesh g={g} m={M.steel()} />
      {fill && <Mesh g={geo.cyl(r * 0.92, r * 0.8, fy, 28)} m={mat(fill, { roughness: 0.35 })} p={[0, fy / 2, 0]} />}
      {children && <group position={[0, fy, 0]}>{children}</group>}
    </group>
  );
}

export function Board({ w = 2.4, d = 1.6, h = 0.1, round = false, color = '#9a6438', p = [0, 0, 0] }) {
  const m = mat('#ffffff', { map: tex.wood(color), roughness: 0.7 });
  if (round) return <Mesh g={geo.cyl(w / 2, w / 2, h, 48)} m={m} p={[p[0], p[1] + h / 2, p[2]]} />;
  return (
    <group position={p}>
      <Mesh g={geo.rbox(w, h, d, 0.04)} m={m} p={[0, h / 2, 0]} />
      <Mesh g={geo.cyl(0.08, 0.08, h * 1.01, 20)} m={mat('#3b2414')} p={[w / 2 - 0.2, h / 2, 0]} />
    </group>
  );
}

export function DipBowl({ color = '#b8321e', p = [0, 0, 0], r = 0.26 }) {
  return (
    <group position={p}>
      <Bowl r={r} h={0.18} />
      <BowlFill r={r} h={0.18} level={0.75} color={color} />
    </group>
  );
}

// ---------- Small edible shapes ----------

export const leafGeometry = () =>
  memo('leafGeo', () => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.12, 0.08, 0.12, 0.26, 0, 0.36);
    s.bezierCurveTo(-0.12, 0.26, -0.12, 0.08, 0, 0);
    const g = new THREE.ShapeGeometry(s, 6);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, Math.abs(pos.getX(i)) * 0.35 + Math.sin(pos.getZ(i) * 6) * 0.01);
    g.computeVertexNormals();
    return g;
  });

export const leafMat = (c = '#3f8f3a') => mat(c, { roughness: 0.55, side: THREE.DoubleSide });

/** Ruffled leaf ring (lettuce) of the given radius. */
export function lettuceGeometry(r = 0.72, seed = 1) {
  return memo(`lettuce|${r}|${seed}`, () => {
    const g = new THREE.RingGeometry(r * 0.35, r, 64, 3);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const d = Math.hypot(x, z) / r;
      pos.setY(i, Math.sin(a * 11 + seed) * 0.05 * d * d + Math.sin(a * 23) * 0.02 * d - d * 0.04);
      const k = 1 + Math.sin(a * 7 + seed) * 0.05;
      pos.setX(i, x * k);
      pos.setZ(i, z * k);
    }
    g.computeVertexNormals();
    return g;
  });
}

/** Bent slice (cheese) whose corners droop over a patty. */
export function droopySlice(size = 1.1, droop = 0.18) {
  return memo(`slice|${size}|${droop}`, () => {
    const g = new THREE.BoxGeometry(size, 0.035, size, 12, 1, 12);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.max(0, Math.hypot(x, z) - size * 0.36);
      pos.setY(i, pos.getY(i) - d * d * droop * 6);
    }
    g.computeVertexNormals();
    g.rotateY(Math.PI / 4);
    return g;
  });
}

/** Lumpy blob (mash, bhaji, dollops). */
export function blob(key, r = 0.5, flat = 0.55, amount = 0.08, seg = 3) {
  return displaced(`blob|${key}|${r}|${flat}|${amount}`, geo.ico(r, seg), (v) => {
    const n = wobble(v.x, v.y, v.z, 7, key.length);
    v.multiplyScalar(1 + n * amount);
    v.y = Math.max(v.y * flat, -0.02);
  });
}

/** Swirled cream/whip from stacked shrinking tori. */
export function Whip({ r = 0.35, layers = 4, color = '#fbf6ee', p = [0, 0, 0] }) {
  const m = mat(color, { roughness: 0.45 });
  return (
    <group position={p}>
      {Array.from({ length: layers }, (_, i) => {
        const k = 1 - i / layers;
        return <Mesh key={i} g={geo.torus(r * k, r * 0.32 * (0.6 + k * 0.4), 10, 28)} m={m} p={[0, i * r * 0.32, 0]} r={[Math.PI / 2, 0, i * 0.6]} />;
      })}
      <Mesh g={geo.cone(r * 0.25, r * 0.5, 12)} m={m} p={[0, layers * r * 0.32, 0]} />
    </group>
  );
}

/** Count scaled by detail level ('low' | 'medium' | 'high'). */
export function counter(q) {
  const k = q?.detail === 'low' ? 0.4 : q?.detail === 'medium' ? 0.7 : 1;
  return (n) => Math.max(1, Math.round(n * k));
}

/** Renders another builder's parts as one static node (used for combos and scene props). */
export function Composite({ def, skip = [] }) {
  return (
    <>
      {def.parts
        .filter((p) => !skip.includes(p.id) && p.anim !== 'stream')
        .map((p) => (
          <group key={p.id} position={p.pos} rotation={p.rot}>
            {p.node}
          </group>
        ))}
    </>
  );
}
