import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { CameraControls, Environment, Html, Lightformer, PerformanceMonitor, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { Building } from './Building.jsx';
import { Interior } from './Interior.jsx';
import { Outdoor } from './Outdoor.jsx';
import { CoffeeBar, PastryCase, Kitchen, Reception } from './Stations.jsx';
import { ZONE_BY_ID, STATIONS } from './zones.js';

const SUN = [-10, 16, 24];
const INTERIOR_LIGHTS = [
  [1.4, 3.3, 0.4],
  [-6.4, 3.2, -4.6],
  [4.2, 3.2, -5.2],
  [-8.2, 2.8, 0.0],
  [8.0, 3.0, -1.4],
  [7.3, 3.1, 4.4],
];

/** Owns CameraControls: flies to zones, keeps the camera out of walls, exposes move/zoom. */
const Navigator = forwardRef(function Navigator({ zone, colliders, reducedMotion }, ref) {
  const controls = useRef();
  const first = useRef(true);
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);

  // Viewpoints are composed for landscape screens; on portrait phones pull the camera back
  // so the same counter still fits horizontally.
  const viewFor = (z) => {
    const k = aspect < 1 ? Math.min(1.9, 1 / Math.sqrt(aspect)) : 1;
    const pos = z.pos.map((v, i) => z.target[i] + (v - z.target[i]) * k);
    return [pos, z.target];
  };

  useEffect(() => {
    const c = controls.current;
    const z = ZONE_BY_ID[zone] || ZONE_BY_ID.exterior;
    if (!c) return;
    const [pos, target] = viewFor(z);
    c.smoothTime = reducedMotion ? 0.05 : 0.65;
    c.maxDistance = (z.max || 10) * (aspect < 1 ? 1.6 : 1);
    c.setLookAt(...pos, ...target, !first.current && !reducedMotion);
    first.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone, reducedMotion, aspect < 1]);

  useEffect(() => {
    const c = controls.current;
    if (!c || !colliders.current) return;
    c.colliderMeshes = colliders.current.children;
  }, [colliders]);

  useImperativeHandle(ref, () => ({
    move(forward, right) {
      const c = controls.current;
      if (!c) return;
      c.forward(forward, true);
      c.truck(right, 0, true);
    },
    rotate(azimuth, polar = 0) {
      controls.current?.rotate(azimuth, polar, true);
    },
    zoom(amount) {
      controls.current?.dolly(amount, true);
    },
    reset() {
      const [pos, target] = viewFor(ZONE_BY_ID[zone] || ZONE_BY_ID.exterior);
      controls.current?.setLookAt(...pos, ...target, !reducedMotion);
    },
    camera,
  }));

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={0.3}
      maxDistance={12}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2 - 0.04}
      dollySpeed={0.6}
      truckSpeed={1.2}
      boundaryEnclosesCamera={false}
      onStart={() => document.body.classList.add('grabbing')}
      onEnd={() => document.body.classList.remove('grabbing')}
    />
  );
});

function Hotspots({ zone, onStation }) {
  const z = ZONE_BY_ID[zone];
  if (!z || zone === 'exterior' || zone === 'patio') return null;
  const inKitchen = zone === 'kitchen' || z.parent === 'kitchen';
  return Object.entries(STATIONS).map(([key, s]) => {
    const isKitchen = ['pizza-oven', 'grill', 'wok', 'tandoor'].includes(key);
    // Inside the kitchen only kitchen stations are labelled; elsewhere every counter is.
    if (inKitchen && !isKitchen) return null;
    return (
      <Html key={key} position={s.pos} center zIndexRange={[15, 5]} distanceFactor={4.5}>
        <button type="button" className={`hotspot ${z.station === key ? 'active' : ''}`} onClick={() => onStation(key)}>
          <span className="hotspot-dot" aria-hidden="true" />
          {s.label}
        </button>
      </Html>
    );
  });
}

function EnterHotspot({ onEnter }) {
  return (
    <Html position={[0, 1.4, 8.6]} center zIndexRange={[15, 5]} distanceFactor={14}>
      <button type="button" className="hotspot hotspot-big" onClick={onEnter}>
        <span className="hotspot-dot" aria-hidden="true" />
        Enter the cafe
      </button>
    </Html>
  );
}

function SceneContents({ zone, q, reducedMotion, onStation, onOpen, onEnter, demo, info, specials, navRef }) {
  const colliders = useRef();
  const shared = { q, reducedMotion, onStation, onOpen };
  return (
    <>
      <color attach="background" args={['#cfe0ea']} />
      <fog attach="fog" args={['#e8dccb', 40, 120]} />
      <Sky distance={300} sunPosition={SUN} turbidity={5} rayleigh={1.2} mieCoefficient={0.004} mieDirectionalG={0.85} />
      <hemisphereLight args={['#fff2de', '#6b5040', 0.85]} />
      <ambientLight intensity={0.18} color="#ffe9d0" />
      <directionalLight
        position={SUN}
        intensity={2.6}
        color="#ffe2b8"
        castShadow={q.shadows}
        shadow-mapSize={[q.shadowMapSize, q.shadowMapSize]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      {INTERIOR_LIGHTS.slice(0, q.pointLights).map((p, i) => (
        <pointLight key={i} position={p} intensity={9} distance={9} decay={1.8} color="#ffc488" />
      ))}
      <Environment resolution={q.detail === 'low' ? 32 : 128} frames={1}>
        <Lightformer form="rect" intensity={1.6} color="#ffe6c8" position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 12, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#cfe0ff" position={[0, 2, 10]} scale={[12, 3, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#ffb070" position={[-10, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#ffd8a8" position={[10, 2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 3, 1]} />
      </Environment>

      <Building ref={colliders} cafeName={info?.cafeName} doorOpen={zone !== 'exterior' && zone !== 'patio'} quality={q} reducedMotion={reducedMotion} />
      <Interior {...shared} />
      <CoffeeBar {...shared} demoId={demo.station === 'coffee-bar' ? demo.id : 0} />
      <PastryCase {...shared} demoId={demo.station === 'pastry-case' ? demo.id : 0} />
      <Kitchen {...shared} demo={demo} />
      <Reception onStation={onStation} cafeName={info?.cafeName || 'Ember & Bean'} />
      <Outdoor {...shared} specials={specials} />

      <Hotspots zone={zone} onStation={onStation} />
      {zone === 'exterior' && <EnterHotspot onEnter={onEnter} />}
      <Navigator ref={navRef} zone={zone} colliders={colliders} reducedMotion={reducedMotion} />
    </>
  );
}

export default function CafeScene({ paused, q, onReady, ...props }) {
  const [dpr, setDpr] = useState(q.dpr[1]);
  useEffect(() => setDpr(q.dpr[1]), [q]);
  return (
    <Canvas
      className="cafe-canvas"
      shadows={q.shadows}
      dpr={dpr}
      frameloop={paused ? 'never' : 'always'}
      gl={{ antialias: q.antialias, powerPreference: 'high-performance' }}
      camera={{ fov: 50, near: 0.05, far: 400, position: [0, 3.6, 27] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        requestAnimationFrame(() => onReady?.());
      }}
    >
      <PerformanceMonitor
        bounds={() => [40, 75]}
        onDecline={() => setDpr((d) => Math.max(q.dpr[0], +(d - 0.25).toFixed(2)))}
        onIncline={() => setDpr((d) => Math.min(q.dpr[1], +(d + 0.25).toFixed(2)))}
      />
      <SceneContents q={q} {...props} />
    </Canvas>
  );
}
