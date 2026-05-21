import { Xiangqi, type XiangqiInstance } from './xiangqiImport';
import { START_FEN } from '@xq/shared';
import type { MoveUci, Side } from '@xq/shared';

export class LocalXiangqi {
  private game: XiangqiInstance;

  constructor(fen = START_FEN) {
    this.game = new Xiangqi(fen);
  }

  fen(): string {
    return this.game.fen();
  }

  turn(): Side {
    return this.game.turn() === 'r' ? 'red' : 'black';
  }

  legalMoves(from?: string): MoveUci[] {
    const moves = this.game.moves({ verbose: true }) as Array<{ from: string; to: string; san: string }>;
    if (!from) return moves.map((m) => `${m.from}${m.to}` as MoveUci);
    return moves.filter((m) => m.from === from).map((m) => `${m.from}${m.to}` as MoveUci);
  }

  move(uci: MoveUci): boolean {
    return Boolean(this.game.move(uci));
  }

  load(fen: string): boolean {
    return this.game.load(fen);
  }

  inCheck(): boolean {
    return this.game.in_check();
  }

  board(): Array<Array<{ type: string; color: 'r' | 'b' } | null>> {
    return this.game.board();
  }
}

export const localEngine = new LocalXiangqi();
