import XiangqiModule from 'xiangqi/xiangqi.js';

export type XiangqiInstance = {
  fen(): string;
  turn(): 'r' | 'b';
  move(move: string): unknown;
  moves(options?: { verbose?: boolean }): string[] | Array<{ from: string; to: string; san: string }>;
  load(fen: string): boolean;
  in_check(): boolean;
  board(): Array<Array<{ type: string; color: 'r' | 'b' } | null>>;
};

export type XiangqiConstructor = new (fen?: string) => XiangqiInstance;

const mod = XiangqiModule as unknown as { Xiangqi?: XiangqiConstructor; default?: XiangqiConstructor };

export const Xiangqi: XiangqiConstructor =
  mod.Xiangqi ?? mod.default ?? (XiangqiModule as unknown as XiangqiConstructor);
