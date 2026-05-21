import { PIECE_LABELS } from '@xq/shared';
import { Xiangqi } from '@/engine/xiangqiImport';
import type { BoardPieceView } from '@/scenes/XiangqiBoard3D';

const TYPE_MAP: Record<string, string> = {
  k: 'k', a: 'a', b: 'b', n: 'n', r: 'r', c: 'c', p: 'p',
};

export function piecesFromFen(fen: string): BoardPieceView[] {
  const game = new Xiangqi(fen);
  const board = game.board() as Array<Array<{ type: string; color: 'r' | 'b' } | null>>;
  const pieces: BoardPieceView[] = [];

  for (let rank = 0; rank < board.length; rank++) {
    for (let file = 0; file < board[rank].length; file++) {
      const cell = board[rank][file];
      if (!cell) continue;
      const square = `${String.fromCharCode(97 + file)}${rank}`;
      const color = cell.color === 'r' ? 'red' : 'black';
      const type = TYPE_MAP[cell.type] ?? cell.type;
      const key = `${color[0]}${type}`;
      pieces.push({
        square,
        label: PIECE_LABELS[key] ?? type,
        color,
        type,
      });
    }
  }
  return pieces;
}

export function legalTargetsFromFen(fen: string, from: string): string[] {
  const game = new Xiangqi(fen);
  const moves = game.moves({ verbose: true }) as Array<{ from: string; to: string }>;
  return moves.filter((m) => m.from === from).map((m) => m.to);
}
