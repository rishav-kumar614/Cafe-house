import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { FoodModel } from './FoodModel.jsx';
import { StudioLights } from '../StudioLights.jsx';
import { useUI } from '../../store/ui.js';
import { QUALITY } from '../../lib/device.js';

/** Moves the camera to frame the dish; re-run when the dish or exploded state changes. */
function CameraRig({ def, exploded, resetId, controlsRef }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const controls = controlsRef.current;
    if (!def || !controls) return;
    const extra = exploded && def.parts.length ? Math.max(...def.parts.map((p) => p.explode[1])) : 0;
    const height = def.height + extra;
    const aspect = size.width / Math.max(1, size.height);
    const span = Math.max(def.radius * 2 / Math.min(1.2, aspect), height) * 1.1;
    const dist = THREE.MathUtils.clamp(span / (2 * Math.tan((camera.fov * Math.PI) / 360)) + 0.6, 2.2, 9);
    const target = new THREE.Vector3(0, height * 0.45, 0);
    const dir = camera.position.clone().sub(controls.target).normalize();
    if (resetId || dir.lengthSq() < 0.1) dir.set(0.55, 0.5, 0.85).normalize();
    const pos = target.clone().add(dir.multiplyScalar(dist));
    gsap.to(controls.target, { x: target.x, y: target.y, z: target.z, duration: 0.8, ease: 'power2.inOut', onUpdate: () => controls.update() });
    gsap.to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: 0.8, ease: 'power2.inOut' });
    controls.minDistance = Math.max(1.2, dist * 0.45);
    controls.maxDistance = dist * 2.2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def, exploded, resetId]);
  return null;
}

function ZoomBridge({ zoomRef, controlsRef }) {
  const { camera } = useThree();
  zoomRef.current = (factor) => {
    const c = controlsRef.current;
    if (!c) return;
    const offset = camera.position.clone().sub(c.target);
    const len = THREE.MathUtils.clamp(offset.length() * factor, c.minDistance, c.maxDistance);
    const next = c.target.clone().add(offset.setLength(len));
    gsap.to(camera.position, { x: next.x, y: next.y, z: next.z, duration: 0.35, ease: 'power2.out', onUpdate: () => c.update() });
  };
  return null;
}

/**
 * Interactive product showcase: drag to rotate, scroll/pinch or buttons to zoom,
 * "Ingredients" explodes the dish into labelled parts, "Replay" runs its preparation animation.
 */
export default function FoodViewer({ product, compact = false }) {
  const qualityKey = useUI((s) => s.quality);
  const reducedMotion = useUI((s) => s.reducedMotion);
  const q = QUALITY[qualityKey];
  const [def, setDef] = useState(null);
  const [exploded, setExploded] = useState(false);
  const [playId, setPlayId] = useState(1);
  const [autoRotate, setAutoRotate] = useState(!reducedMotion);
  const [resetId, setResetId] = useState(0);
  const controlsRef = useRef();
  const zoomRef = useRef(() => {});
  const spinRef = useRef();

  useEffect(() => {
    setExploded(false);
    setPlayId((n) => n + 1);
  }, [product.slug]);

  const onDef = useCallback((d) => setDef(d), []);
  const canExplode = def && def.parts.length > 0;

  const rotateModel = (dir) => {
    if (!spinRef.current) return;
    gsap.to(spinRef.current.rotation, { y: spinRef.current.rotation.y + dir * (Math.PI / 8), duration: reducedMotion ? 0 : 0.35, ease: 'power2.out' });
  };

  const onKeyDown = (e) => {
    const keys = {
      ArrowLeft: () => rotateModel(-1),
      ArrowRight: () => rotateModel(1),
      ArrowUp: () => zoomRef.current(0.8),
      ArrowDown: () => zoomRef.current(1.25),
      '+': () => zoomRef.current(0.8),
      '-': () => zoomRef.current(1.25),
      i: () => canExplode && setExploded((v) => !v),
      p: () => setPlayId((n) => n + 1),
      r: () => setResetId((n) => n + 1),
    };
    const fn = keys[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  const category = product.categories?.[0]?.slug;

  return (
    <div className={`viewer ${compact ? 'viewer-compact' : ''}`}>
      <div
        className="viewer-stage"
        tabIndex={0}
        role="img"
        aria-label={`Interactive 3D model of ${product.name}. Use arrow keys to rotate and zoom, I to show ingredients, P to replay the animation.`}
        onKeyDown={onKeyDown}
      >
        <Canvas
          shadows={q.shadows}
          dpr={q.dpr}
          gl={{ antialias: q.antialias, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [2.4, 2.4, 3.8], fov: 32, near: 0.1, far: 60 }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
          }}
        >
          <StudioLights shadows={q.shadows} shadowMapSize={q.shadowMapSize} />
          <group ref={spinRef}>
            <FoodModel
              key={product.slug}
              model={product.model}
              category={category}
              quality={q.detail}
              mode="assemble"
              playId={playId}
              exploded={exploded}
              showLabels={exploded}
              reducedMotion={reducedMotion}
              onDef={onDef}
            />
          </group>
          <ContactShadows position={[0, -0.005, 0]} opacity={0.5} scale={7} blur={2.5} far={3} resolution={q.detail === 'low' ? 256 : 512} color="#3b2414" />
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            autoRotate={autoRotate && !exploded}
            autoRotateSpeed={1.1}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
          <CameraRig def={def} exploded={exploded} resetId={resetId} controlsRef={controlsRef} />
          <ZoomBridge zoomRef={zoomRef} controlsRef={controlsRef} />
        </Canvas>
        <p className="viewer-hint" aria-hidden="true">
          Drag to rotate · Scroll or pinch to zoom
        </p>
      </div>

      <div className="viewer-toolbar" role="toolbar" aria-label="3D view controls">
        <button type="button" className="chip-btn" onClick={() => setPlayId((n) => n + 1)} title="Replay preparation (P)">
          <span aria-hidden="true">▶</span> {def?.anim || 'Replay'}
        </button>
        {canExplode && (
          <button type="button" className={`chip-btn ${exploded ? 'active' : ''}`} aria-pressed={exploded} onClick={() => setExploded((v) => !v)} title="Show ingredients (I)">
            {exploded ? 'Hide ingredients' : 'Show ingredients'}
          </button>
        )}
        <button type="button" className={`chip-btn ${autoRotate ? 'active' : ''}`} aria-pressed={autoRotate} onClick={() => setAutoRotate((v) => !v)}>
          Auto-rotate
        </button>
        <span className="toolbar-spacer" />
        <button type="button" className="icon-btn" onClick={() => rotateModel(-1)} aria-label="Rotate left">
          ⟲
        </button>
        <button type="button" className="icon-btn" onClick={() => rotateModel(1)} aria-label="Rotate right">
          ⟳
        </button>
        <button type="button" className="icon-btn" onClick={() => zoomRef.current(0.8)} aria-label="Zoom in">
          +
        </button>
        <button type="button" className="icon-btn" onClick={() => zoomRef.current(1.25)} aria-label="Zoom out">
          −
        </button>
        <button type="button" className="icon-btn" onClick={() => setResetId((n) => n + 1)} aria-label="Reset view">
          ⤾
        </button>
      </div>
    </div>
  );
}
