/** 标准初始 FEN（xiangqi.js 格式） */
export const START_FEN =
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR r - - 0 1';

/** 9 列 a-i，10 行 0-9 */
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] as const;
export const RANKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function squareToIndex(file: string, rank: number): { x: number; y: number } {
  const x = FILES.indexOf(file as (typeof FILES)[number]);
  return { x, y: rank };
}

export function indexToSquare(x: number, y: number): string {
  return `${FILES[x]}${y}`;
}

/** 3D 棋盘坐标：红方在下方 (z 小)，黑方在上方 */
export function squareToWorld(square: string, cellSize = 1): [number, number, number] {
  const file = square.charAt(0);
  const rank = parseInt(square.slice(1), 10);
  const { x, y } = squareToIndex(file, rank);
  const offsetX = (FILES.length - 1) / 2;
  const offsetZ = (RANKS.length - 1) / 2;
  return [(x - offsetX) * cellSize, 0, (y - offsetZ) * cellSize];
}

export function worldToSquare(x: number, z: number, cellSize = 1): string | null {
  const offsetX = (FILES.length - 1) / 2;
  const offsetZ = (RANKS.length - 1) / 2;
  const ix = Math.round(x / cellSize + offsetX);
  const iy = Math.round(z / cellSize + offsetZ);
  if (ix < 0 || ix > 8 || iy < 0 || iy > 9) return null;
  return indexToSquare(ix, iy);
}

export const PIECE_LABELS: Record<string, string> = {
  rk: '帅', ra: '仕', rb: '相', rn: '马', rr: '车', rc: '炮', rp: '兵',
  bk: '将', ba: '士', bb: '象', bn: '馬', br: '車', bc: '砲', bp: '卒',
};

export function pieceKey(color: 'red' | 'black', type: string): string {
  return `${color[0]}${type}`;
}
