import { Environment, Lightformer } from '@react-three/drei';

/** Warm studio lighting with a local (no-download) environment map for reflections. */
export function StudioLights({ shadows = true, shadowMapSize = 1024 }) {
  return (
    <>
      <hemisphereLight args={['#fff6ea', '#5a4030', 0.9]} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={2.2}
        color="#fff1dc"
        castShadow={shadows}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-4, 3, -3]} intensity={0.8} color="#ffd9b0" />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2.5} color="#fff3e2" position={[0, 4, 2]} scale={[6, 3, 1]} rotation={[-Math.PI / 3, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#ffd2a1" position={[-4, 1.5, 0]} scale={[3, 3, 1]} rotation={[0, Math.PI / 2, 0]} />
        <Lightformer form="rect" intensity={0.8} color="#cfe1ff" position={[4, 1.5, -1]} scale={[3, 3, 1]} rotation={[0, -Math.PI / 2, 0]} />
        <Lightformer form="circle" intensity={0.6} color="#ffffff" position={[0, -3, 0]} scale={4} rotation={[Math.PI / 2, 0, 0]} />
      </Environment>
    </>
  );
}
