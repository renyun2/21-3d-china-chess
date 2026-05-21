import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { CameraPreset } from '@xq/shared';
import { XiangqiBoard3D, type BoardPieceView } from './XiangqiBoard3D';

const CAMERA_PRESETS: Record<CameraPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  top: { position: [0, 14, 0.01], target: [0, 0, 0] },
  side: { position: [0, 8, 12], target: [0, 0, 0] },
  fpv: { position: [0, 2.2, -7], target: [0, 0.5, 2] },
};

interface SceneProps {
  pieces: BoardPieceView[];
  highlights: string[];
  selectedSquare?: string | null;
  pieceStyle: 'classic' | 'minimal' | 'cartoon';
  cameraPreset: CameraPreset;
  onSelectSquare: (square: string) => void;
}

export function GameScene(props: SceneProps) {
  const controlsRef = useRef<any>(null);
  const preset = useMemo(() => CAMERA_PRESETS[props.cameraPreset], [props.cameraPreset]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.position.set(...preset.position);
    controls.target.set(...preset.target);
    controls.update();
  }, [preset]);

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-stone-700 bg-stone-950">
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={['#1c1917']} />
        <PerspectiveCamera makeDefault fov={45} near={0.1} far={100} position={preset.position} />
        <ambientLight intensity={0.55} />
        <directionalLight castShadow position={[6, 12, 4]} intensity={1.1} shadow-mapSize={[1024, 1024]} />
        <hemisphereLight intensity={0.35} groundColor="#3e2723" color="#fff8e1" />
        <XiangqiBoard3D {...props} />
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={5}
          maxDistance={22}
          target={new THREE.Vector3(...preset.target)}
        />
      </Canvas>
    </div>
  );
}
