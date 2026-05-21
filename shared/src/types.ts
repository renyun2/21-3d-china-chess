/** 棋子阵营 */
export type Side = 'red' | 'black';

/** 计时模式 */
export type TimeControlPreset = 'bullet' | 'blitz' | 'rapid';

export interface TimeControl {
  preset: TimeControlPreset;
  /** 初始秒数 */
  initialSeconds: number;
  /** 每步加时秒数 */
  incrementSeconds: number;
}

export const TIME_CONTROLS: Record<TimeControlPreset, TimeControl> = {
  bullet: { preset: 'bullet', initialSeconds: 180, incrementSeconds: 0 },
  blitz: { preset: 'blitz', initialSeconds: 300, incrementSeconds: 5 },
  rapid: { preset: 'rapid', initialSeconds: 900, incrementSeconds: 10 },
};

/** 对局模式 */
export type GameMode = 'pvp' | 'ai' | 'spectate' | 'replay';

/** 对局状态 */
export type GameStatus =
  | 'waiting'
  | 'playing'
  | 'check'
  | 'finished'
  | 'draw';

/** 对局结果 */
export type GameResult =
  | 'red_win'
  | 'black_win'
  | 'draw'
  | 'aborted';

export type EndReason =
  | 'checkmate'
  | 'resign'
  | 'agreement'
  | 'timeout'
  | 'repetition'
  | 'sixty_move_rule'
  | 'perpetual_check'
  | 'perpetual_chase'
  | 'stalemate';

/** ICCS 坐标，如 a0、b9 */
export type Square = string;

/** ICCS 着法，如 h2e2 */
export type MoveUci = string;

export interface BoardPiece {
  type: 'k' | 'a' | 'b' | 'n' | 'r' | 'c' | 'p';
  color: Side;
  square: Square;
}

export interface PublicUser {
  id: string;
  username: string;
  elo: number;
  avatarUrl?: string;
}

export interface GameSnapshot {
  id: string;
  fen: string;
  turn: Side;
  status: GameStatus;
  mode: GameMode;
  timeControl: TimeControl;
  redTimeMs: number;
  blackTimeMs: number;
  moveHistory: MoveUci[];
  red?: PublicUser;
  black?: PublicUser;
  spectators: number;
  lastMove?: MoveUci;
  inCheck?: Side;
  drawOffer?: Side | null;
}

export interface RoomInfo {
  id: string;
  code: string;
  hostId: string;
  timeControl: TimeControl;
  status: 'open' | 'playing' | 'closed';
  snapshot?: GameSnapshot;
}

export interface MatchmakingTicket {
  userId: string;
  elo: number;
  timeControl: TimeControlPreset;
  enqueuedAt: number;
}

export interface ReplayMove {
  uci: MoveUci;
  san?: string;
  eval?: number;
  annotation?: '?' | '!' | '??' | '!!' | '!?' | '?!';
}

export interface ReplayRecord {
  id: string;
  pgn: string;
  moves: ReplayMove[];
  result: GameResult;
  white: PublicUser;
  black: PublicUser;
  createdAt: string;
}

export type PieceStyle = 'classic' | 'minimal' | 'cartoon';
export type CameraPreset = 'top' | 'side' | 'fpv';

export interface AuthTokenPayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
}
