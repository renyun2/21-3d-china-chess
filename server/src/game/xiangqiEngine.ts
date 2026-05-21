import { Xiangqi, type XiangqiInstance } from './xiangqiImport.js';
import { START_FEN } from '@xq/shared';
import type { GameResult, MoveUci, Side } from '@xq/shared';

export interface MoveResult {
  ok: boolean;
  fen?: string;
  turn?: Side;
  inCheck?: Side | null;
  isGameOver?: boolean;
  result?: GameResult;
  reason?: string;
  error?: string;
}

function sideFromTurn(turn: 'r' | 'b'): Side {
  return turn === 'r' ? 'red' : 'black';
}

export class XiangqiEngine {
  private game: XiangqiInstance;

  constructor(fen = START_FEN) {
    this.game = new Xiangqi(fen);
  }

  fen(): string {
    return this.game.fen();
  }

  turn(): Side {
    return sideFromTurn(this.game.turn());
  }

  legalMoves(): MoveUci[] {
    return this.game.moves({ verbose: false }) as MoveUci[];
  }

  move(uci: MoveUci): MoveResult {
    const before = this.game.fen();
    const m = this.game.move(uci);
    if (!m) {
      return { ok: false, error: 'illegal move' };
    }

    const inCheck = this.game.in_check()
      ? sideFromTurn(this.game.turn())
      : null;

    if (this.game.game_over()) {
      const result = this.resolveResult();
      return {
        ok: true,
        fen: this.game.fen(),
        turn: this.turn(),
        inCheck,
        isGameOver: true,
        result: result.result,
        reason: result.reason,
      };
    }

    return {
      ok: true,
      fen: this.game.fen(),
      turn: this.turn(),
      inCheck,
      isGameOver: false,
    };
  }

  private resolveResult(): { result: GameResult; reason: string } {
    if (this.game.in_checkmate()) {
      const winner: Side = this.turn() === 'red' ? 'black' : 'red';
      return {
        result: winner === 'red' ? 'red_win' : 'black_win',
        reason: 'checkmate',
      };
    }
    if (this.game.in_draw()) {
      return { result: 'draw', reason: 'stalemate' };
    }
    return { result: 'draw', reason: 'unknown' };
  }

  load(fen: string): boolean {
    return this.game.load(fen);
  }

  history(): MoveUci[] {
    return this.game.history() as MoveUci[];
  }

  isCheck(): boolean {
    return this.game.in_check();
  }

  reset(): void {
    this.game.load(START_FEN);
  }
}

export function createEngine(fen?: string): XiangqiEngine {
  return new XiangqiEngine(fen);
}
