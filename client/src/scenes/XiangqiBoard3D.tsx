import '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { FILES, RANKS, squareToWorld } from '@xq/shared';

const CELL = 1.1;
const BOARD_W = 8 * CELL;
const BOARD_D = 9 * CELL;

function BoardLines() {
  const horizontal: [number, number, number][][] = [];
  const vertical: [number, number, number][][] = [];

  for (let r = 0; r < RANKS.length; r++) {
    const z = (r - 4.5) * CELL;
    horizontal.push([
      [-BOARD_W / 2, 0.02, z],
      [BOARD_W / 2, 0.02, z],
    ]);
  }
  for (let f = 0; f < FILES.length; f++) {
    const x = (f - 4) * CELL;
    vertical.push([
      [x, 0.02, -BOARD_D / 2],
      [x, 0.02, BOARD_D / 2],
    ]);
  }

  const palaceLines: [number, number, number][][] = [
    [
      [3 * CELL - 4 * CELL, 0.021, -1.5 * CELL],
      [5 * CELL - 4 * CELL, 0.021, 1.5 * CELL],
    ],
    [
      [5 * CELL - 4 * CELL, 0.021, -1.5 * CELL],
      [3 * CELL - 4 * CELL, 0.021, 1.5 * CELL],
    ],
    [
      [3 * CELL - 4 * CELL, 0.021, 7.5 * CELL],
      [5 * CELL - 4 * CELL, 0.021, 4.5 * CELL],
    ],
    [
      [5 * CELL - 4 * CELL, 0.021, 7.5 * CELL],
      [3 * CELL - 4 * CELL, 0.021, 4.5 * CELL],
    ],
  ];

  return (
    <group>
      {horizontal.map((pts, i) => (
        <Line key={`h-${i}`} points={pts} color="#3E2723" lineWidth={1.5} />
      ))}
      {vertical.map((pts, i) => (
        <Line key={`v-${i}`} points={pts} color="#3E2723" lineWidth={1.5} />
      ))}
      {palaceLines.map((pts, i) => (
        <Line key={`p-${i}`} points={pts} color="#5D4037" lineWidth={1.2} dashed dashSize={0.15} gapSize={0.08} />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[BOARD_W + 0.6, BOARD_D + 0.6]} />
        <meshStandardMaterial color="#8B5A2B" roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <boxGeometry args={[BOARD_W + 1.4, 0.16, BOARD_D + 1.4]} />
        <meshStandardMaterial color="#4E342E" roughness={0.8} />
      </mesh>
    </group>
  );
}

function HighlightCell({ square }: { square: string }) {
  const [x, , z] = squareToWorld(square, CELL);
  return (
    <mesh position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.38, 24]} />
      <meshBasicMaterial color="#FFD54F" transparent opacity={0.45} />
    </mesh>
  );
}

interface PieceMeshProps {
  square: string;
  label: string;
  color: 'red' | 'black';
  style: 'classic' | 'minimal' | 'cartoon';
  selected?: boolean;
  onPointerDown?: () => void;
}

function PieceMesh({ square, label, color, style, selected, onPointerDown }: PieceMeshProps) {
  const ref = useRef<THREE.Group>(null);
  const [x, , z] = squareToWorld(square, CELL);
  const radius = style === 'minimal' ? 0.32 : style === 'cartoon' ? 0.42 : 0.38;
  const height = style === 'cartoon' ? 0.28 : 0.18;
  const pieceColor = color === 'red' ? '#C62828' : '#212121';
  const rimColor = color === 'red' ? '#FF8A80' : '#9E9E9E';

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FBE9E7';
    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = pieceColor;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = pieceColor;
    ctx.font = 'bold 52px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 64, 66);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [label, pieceColor]);

  return (
    <group ref={ref} position={[x, height / 2 + 0.04, z]} onPointerDown={onPointerDown}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.05, height, 32]} />
        <meshStandardMaterial color={rimColor} roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, height / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.78, 32]} />
        <meshStandardMaterial map={texture} roughness={0.4} />
      </mesh>
      {selected && (
        <mesh position={[0, -height / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 0.9, radius * 1.15, 32]} />
          <meshBasicMaterial color="#FFEB3B" transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
}

export interface BoardPieceView {
  square: string;
  label: string;
  color: 'red' | 'black';
  type: string;
}

interface XiangqiBoard3DProps {
  pieces: BoardPieceView[];
  highlights: string[];
  selectedSquare?: string | null;
  pieceStyle: 'classic' | 'minimal' | 'cartoon';
  onSelectSquare: (square: string) => void;
}

export function XiangqiBoard3D({
  pieces,
  highlights,
  selectedSquare,
  pieceStyle,
  onSelectSquare,
}: XiangqiBoard3DProps) {
  return (
    <group>
      <BoardLines />
      {highlights.map((sq) => (
        <HighlightCell key={sq} square={sq} />
      ))}
      {pieces.map((p) => (
        <PieceMesh
          key={`${p.square}-${p.type}-${p.color}`}
          square={p.square}
          label={p.label}
          color={p.color}
          style={pieceStyle}
          selected={selectedSquare === p.square}
          onPointerDown={() => onSelectSquare(p.square)}
        />
      ))}
    </group>
  );
}

export { CELL };
