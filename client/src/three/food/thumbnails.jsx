import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FoodModel } from './FoodModel.jsx';
import { StudioLights } from '../StudioLights.jsx';
import { hasWebGL } from '../../lib/device.js';
import { useThumbs } from './thumbStore.js';

// Menu cards show a snapshot of each dish's real 3D model. Snapshots are rendered one at a
// time by a single hidden canvas, so the menu needs one WebGL context instead of one per card.

function Snapshot({ job }) {
  const { gl, scene, camera } = useThree();
  const [def, setDef] = useState(null);
  const frames = useRef(0);
  const finished = useRef(false);

  useEffect(() => {
    if (!def) return;
    const r = def.radius;
    const h = def.height;
    const span = Math.max(r * 2, h) * 1.05;
    const dist = span / (2 * Math.tan((camera.fov * Math.PI) / 360)) + 0.4;
    const target = new THREE.Vector3(0, h * 0.4, 0);
    camera.position.copy(target).add(new THREE.Vector3(0.55, 0.62, 0.85).normalize().multiplyScalar(dist));
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }, [def, camera]);

  useFrame(() => {
    if (!def || finished.current) return;
    frames.current += 1;
    // Give GLB textures/materials a few frames to compile before capturing.
    if (frames.current < (def.glb ? 6 : 3)) return;
    finished.current = true;
    gl.render(scene, camera);
    let url = '';
    try {
      url = gl.domElement.toDataURL('image/webp', 0.82);
    } catch {
      url = '';
    }
    useThumbs.getState().done(job.key, url || 'failed');
  });

  return <FoodModel model={job.model} category={job.category} quality="medium" onDef={setDef} />;
}

export function ThumbnailStudio() {
  const job = useThumbs((s) => s.queue[0]);
  const [supported] = useState(() => hasWebGL());
  if (!supported) return null;
  return (
    <div className="thumb-studio" aria-hidden="true">
      <Canvas
        frameloop={job ? 'always' : 'never'}
        dpr={1}
        gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
        camera={{ fov: 30, near: 0.1, far: 50, position: [2, 2, 3] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
        }}
      >
        <StudioLights shadows={false} />
        {job && <Snapshot key={job.key} job={job} />}
      </Canvas>
    </div>
  );
}
