declare module 'xiangqi/xiangqi.js' {
  export class Xiangqi {
    constructor(fen?: string);
    fen(): string;
    turn(): 'r' | 'b';
    move(move: string): unknown;
    moves(options?: { verbose?: boolean }): string[] | Array<{ from: string; to: string; san: string }>;
    load(fen: string): boolean;
    in_check(): boolean;
    board(): Array<Array<{ type: string; color: 'r' | 'b' } | null>>;
  }
  export default typeof Xiangqi;
}
