import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export type XiangqiInstance = {
  fen(): string;
  turn(): 'r' | 'b';
  move(move: string): unknown;
  moves(options?: { verbose?: boolean }): string[] | Array<{ from: string; to: string; san: string }>;
  load(fen: string): boolean;
  history(): string[];
  in_check(): boolean;
  in_checkmate(): boolean;
  in_draw(): boolean;
  game_over(): boolean;
  board(): Array<Array<{ type: string; color: 'r' | 'b' } | null>>;
};

export type XiangqiConstructor = new (fen?: string) => XiangqiInstance;

const mod = require('xiangqi') as { Xiangqi: XiangqiConstructor };

export const Xiangqi: XiangqiConstructor = mod.Xiangqi;
