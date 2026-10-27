import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Html, useGLTF } from '@react-three/drei';
import { buildFood, resolveProcedural } from './library.js';

/**
 * Renders a product's 3D model.
 *  - procedural models are built from parts and support assembly + exploded-ingredient views
 *  - uploaded .glb models are normalised to the same size; if loading fails we fall back
 *    to the procedural model for the product's category so the page never breaks
 */
export function FoodModel({ model, category, ...rest }) {
  const procedural = <ProceduralFood model={model} category={category} {...rest} />;
  if (model?.kind === 'glb' && model.url) {
    return (
      <ModelErrorBoundary fallback={procedural} resetKey={model.url}>
        <Suspense fallback={null}>
          <GlbFood url={model.url} scale={model.scale || 1} {...rest} />
        </Suspense>
      </ModelErrorBoundary>
    );
  }
  return procedural;
}

class ModelErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    console.warn('[3d] Could not load model, using procedural fallback:', err?.message || err);
  }
  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function restPose(def, groups, exploded) {
  def.parts.forEach((p, i) => {
    const g = groups[i];
    if (!g) return;
    const e = exploded ? p.explode : [0, 0, 0];
    g.position.set(p.pos[0] + e[0], p.pos[1] + e[1], p.pos[2] + e[2]);
    g.scale.set(1, 1, 1);
    g.rotation.set(...(p.rot || [0, 0, 0]));
    g.visible = p.anim !== 'stream' && (!p.hidden || exploded);
  });
}

function assembleTimeline(def, groups, onComplete) {
  const tl = gsap.timeline({ onComplete });
  let t = 0;
  def.parts.forEach((p, i) => {
    const g = groups[i];
    if (!g) return;
    const [x, y, z] = p.pos;
    const rot = p.rot || [0, 0, 0];
    g.position.set(x, y, z);
    g.scale.set(1, 1, 1);
    g.rotation.set(...rot);
    g.visible = p.anim !== 'stream' && !p.hidden;
    if (p.anim === 'none' || p.hidden) return;

    const at = p.at ?? t;
    t = at + 0.22;
    g.visible = false;
    tl.set(g, { visible: true }, at);
    switch (p.anim) {
      case 'drop':
        tl.fromTo(g.position, { y: y + 2.2 }, { y, duration: 0.6, ease: 'bounce.out' }, at);
        break;
      case 'pop':
        tl.fromTo(g.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: 1, y: 1, z: 1, duration: 0.45, ease: 'back.out(2)' }, at);
        break;
      case 'spread':
        tl.fromTo(g.scale, { x: 0.001, z: 0.001 }, { x: 1, z: 1, duration: 0.55, ease: 'power2.out' }, at);
        break;
      case 'rise':
        tl.fromTo(g.position, { y: y - 0.45 }, { y, duration: 0.6, ease: 'power2.out' }, at);
        tl.fromTo(g.scale, { x: 0.7, y: 0.7, z: 0.7 }, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'power2.out' }, at);
        break;
      case 'fill':
        tl.fromTo(g.scale, { y: 0.001 }, { y: 1, duration: p.dur || 1.2, ease: 'power1.inOut' }, at);
        break;
      case 'stream': {
        const dur = p.dur || 1.2;
        tl.fromTo(g.scale, { y: 0.001 }, { y: 1, duration: 0.25, ease: 'power1.in' }, at);
        tl.to(g.scale, { y: 0.001, duration: 0.2, ease: 'power1.out' }, at + dur);
        tl.set(g, { visible: false }, at + dur + 0.2);
        break;
      }
      case 'spin':
        tl.fromTo(g.rotation, { y: rot[1] - Math.PI * 1.5 }, { y: rot[1], duration: 1.0, ease: 'power3.out' }, at);
        tl.fromTo(g.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(1.7)' }, at);
        break;
      case 'slide':
        tl.fromTo(g.position, { x: x + 2.4 }, { x, duration: 0.6, ease: 'power3.out' }, at);
        break;
      default:
        break;
    }
  });
  return tl;
}

function ProceduralFood({ model, category, quality = 'high', mode = 'idle', playId = 0, exploded = false, showLabels = false, reducedMotion = false, onDef, onDone, ...groupProps }) {
  const { key, params } = resolveProcedural(model, category);
  const paramsKey = JSON.stringify(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const def = useMemo(() => buildFood(key, params, quality), [key, paramsKey, quality]);
  const groups = useRef([]);
  const timeline = useRef(null);
  const explodedRef = useRef(exploded);
  const mounted = useRef(false);

  useEffect(() => {
    onDef?.(def);
  }, [def, onDef]);

  useLayoutEffect(() => {
    timeline.current?.kill();
    if (mode !== 'assemble' || reducedMotion) {
      restPose(def, groups.current, explodedRef.current);
      return undefined;
    }
    timeline.current = assembleTimeline(def, groups.current, () => onDone?.());
    return () => timeline.current?.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def, playId, mode, reducedMotion]);

  useEffect(() => {
    explodedRef.current = exploded;
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (timeline.current) {
      timeline.current.progress(1);
      timeline.current.kill();
      timeline.current = null;
    }
    def.parts.forEach((p, i) => {
      const g = groups.current[i];
      if (!g) return;
      gsap.killTweensOf(g.position);
      const e = exploded ? p.explode : [0, 0, 0];
      if (p.anim === 'stream') {
        g.visible = false;
        return;
      }
      if (p.hidden && exploded) g.visible = true;
      gsap.to(g.position, {
        x: p.pos[0] + e[0],
        y: p.pos[1] + e[1],
        z: p.pos[2] + e[2],
        duration: reducedMotion ? 0 : 0.8,
        delay: reducedMotion ? 0 : exploded ? i * 0.03 : 0,
        ease: 'power3.inOut',
        onComplete: () => {
          if (p.hidden && !exploded) g.visible = false;
        },
      });
    });
  }, [exploded, def, reducedMotion]);

  return (
    <group {...groupProps}>
      {def.parts.map((p, i) => (
        <group
          key={p.id}
          ref={(el) => {
            groups.current[i] = el;
          }}
          position={p.pos}
          rotation={p.rot}
          visible={p.anim !== 'stream' && !p.hidden}
        >
          {p.node}
          {showLabels && p.label && (
            <Html position={[(p.labelSide ?? i % 2) ? def.radius * 0.95 : -def.radius * 0.95, 0.12, 0]} center zIndexRange={[30, 10]} style={{ pointerEvents: 'none' }}>
              <span className={`ingredient-label ${(p.labelSide ?? i % 2) ? 'right' : 'left'}`}>{p.label}</span>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

function GlbFood({ url, scale = 1, mode = 'idle', playId = 0, reducedMotion = false, onDef, onDone, quality, exploded, showLabels, ...groupProps }) {
  const { scene } = useGLTF(url, '/draco/');
  const prepared = useMemo(() => {
    const object = scene.clone(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const s = (1.4 / Math.max(size.x, size.y, size.z, 1e-3)) * scale;
    object.scale.setScalar(s);
    box.setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    object.position.set(-center.x, -box.min.y, -center.z);
    object.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    // Bounding-sphere radius so boxy models (whose corners stick out) are framed fully.
    return { object, height: box.max.y - box.min.y, radius: size.length() * s * 0.5 + 0.1 };
  }, [scene, scale]);
  const ref = useRef();

  useEffect(() => {
    onDef?.({ parts: [], height: prepared.height, radius: prepared.radius, anim: 'Reveal the dish', glb: true });
  }, [prepared, onDef]);

  useLayoutEffect(() => {
    if (mode !== 'assemble' || reducedMotion || !ref.current) return undefined;
    const tl = gsap.timeline({ onComplete: () => onDone?.() });
    tl.fromTo(ref.current.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: 1, y: 1, z: 1, duration: 0.7, ease: 'back.out(1.6)' });
    tl.fromTo(ref.current.rotation, { y: -Math.PI }, { y: 0, duration: 1.0, ease: 'power3.out' }, 0);
    return () => tl.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playId, mode, reducedMotion]);

  return (
    <group {...groupProps}>
      <group ref={ref}>
        <primitive object={prepared.object} />
      </group>
    </group>
  );
}
