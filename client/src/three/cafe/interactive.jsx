import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { FoodModel } from '../food/FoodModel.jsx';
import { useMenu } from '../../store/menu.js';
import { geo } from '../kit.js';

function setCursor(value) {
  document.body.style.cursor = value;
}

/** Wraps scene objects so they react to hover and click (mouse and touch). */
export function Clickable({ onClick, label, children, tooltipOffset = [0, 0.4, 0], ...groupProps }) {
  const [hovered, setHovered] = useState(false);
  useEffect(() => () => setCursor(''), []);
  return (
    <group
      {...groupProps}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        setCursor('pointer');
      }}
      onPointerOut={() => {
        setHovered(false);
        setCursor('');
      }}
    >
      {children}
      {hovered && label && (
        <Html position={tooltipOffset} center zIndexRange={[40, 20]} style={{ pointerEvents: 'none' }}>
          <span className="scene-tooltip">{label}</span>
        </Html>
      )}
    </group>
  );
}

/** A menu dish placed in the cafe. Uses the live product model; clicking opens the dish. */
export function SceneFood({ slug, fallback, p, r, s = 0.12, quality = 'medium', mode = 'idle', playId = 0, reducedMotion, onOpen }) {
  const product = useMenu((st) => st.bySlug.get(slug));
  const model = product?.model || fallback;
  return (
    <Clickable position={p} rotation={r} onClick={() => onOpen?.(slug)} label={product ? `${product.name} – view in 3D` : null} tooltipOffset={[0, 0.25, 0]}>
      <group scale={s}>
        <FoodModel model={model} category={product?.categories?.[0]?.slug} quality={quality} mode={mode} playId={playId} reducedMotion={reducedMotion} />
      </group>
    </Clickable>
  );
}

// ---------- Ambient effects ----------

/** Rising, fading puffs (coffee steam, grill smoke). */
export function Steam({ p, count = 4, color = '#ffffff', spread = 0.05, rise = 0.35, size = 0.05, opacity = 0.35, reducedMotion }) {
  const puffs = useRef([]);
  const seeds = useRef(Array.from({ length: count }, (_, i) => i / count));
  useFrame((_, dt) => {
    if (reducedMotion) return;
    puffs.current.forEach((m, i) => {
      if (!m) return;
      seeds.current[i] = (seeds.current[i] + dt * 0.45) % 1;
      const t = seeds.current[i];
      m.position.set(Math.sin(t * 6 + i) * spread, t * rise, Math.cos(t * 5 + i * 2) * spread);
      m.scale.setScalar(size * (0.6 + t * 1.6));
      m.material.opacity = opacity * Math.sin(t * Math.PI);
    });
  });
  if (reducedMotion) return null;
  return (
    <group position={p}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} ref={(el) => (puffs.current[i] = el)} geometry={geo.sphere(1, 8, 6)}>
          <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Flickering fire glow: an emissive core plus an optional real point light. */
export function Fire({ p, scale = 1, light = true, intensity = 2.5, reducedMotion }) {
  const core = useRef();
  const lamp = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const f = reducedMotion ? 1 : 0.8 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.1 + Math.sin(t * 23) * 0.05;
    if (core.current) {
      core.current.scale.set(scale, scale * (0.9 + f * 0.3), scale);
      core.current.material.emissiveIntensity = 2.5 * f;
    }
    if (lamp.current) lamp.current.intensity = intensity * f;
  });
  return (
    <group position={p}>
      <mesh ref={core} geometry={geo.cone(0.18, 0.4, 10)} position={[0, 0.2 * scale, 0]}>
        <meshStandardMaterial color="#ff8a2a" emissive="#ff6a1a" emissiveIntensity={2.5} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      {light && <pointLight ref={lamp} color="#ff8a3a" intensity={intensity} distance={4} decay={2} position={[0, 0.3, 0.3]} />}
    </group>
  );
}
