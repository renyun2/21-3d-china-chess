import { randomBytes } from 'crypto';
import type {
  GameMode,
  GameSnapshot,
  GameStatus,
  PublicUser,
  Side,
  TimeControl,
  TimeControlPreset,
} from '@xq/shared';
import { START_FEN, TIME_CONTROLS } from '@xq/shared';
import { createEngine } from './xiangqiEngine.js';

export interface ActiveGame {
  id: string;
  engine: ReturnType<typeof createEngine>;
  mode: GameMode;
  timeControl: TimeControl;
  redTimeMs: number;
  blackTimeMs: number;
  red?: PublicUser;
  black?: PublicUser;
  spectators: Set<string>;
  status: GameStatus;
  drawOffer?: Side | null;
  lastMove?: string;
  roomCode?: string;
  aiDepth?: number;
  movesWithoutCapture: number;
  positionCounts: Map<string, number>;
}

const games = new Map<string, ActiveGame>();
const roomByCode = new Map<string, string>();

function genCode(): string {
  return randomBytes(3).toString('hex').toUpperCase();
}

export function toSnapshot(game: ActiveGame): GameSnapshot {
  return {
    id: game.id,
    fen: game.engine.fen(),
    turn: game.engine.turn(),
    status: game.status,
    mode: game.mode,
    timeControl: game.timeControl,
    redTimeMs: game.redTimeMs,
    blackTimeMs: game.blackTimeMs,
    moveHistory: game.engine.history(),
    red: game.red,
    black: game.black,
    spectators: game.spectators.size,
    lastMove: game.lastMove,
    inCheck: game.engine.isCheck() ? game.engine.turn() : undefined,
    drawOffer: game.drawOffer ?? null,
  };
}

export function createGame(opts: {
  mode: GameMode;
  timeControlPreset: TimeControlPreset;
  red?: PublicUser;
  black?: PublicUser;
  aiDepth?: number;
}): ActiveGame {
  const id = randomBytes(8).toString('hex');
  const tc = TIME_CONTROLS[opts.timeControlPreset];
  const game: ActiveGame = {
    id,
    engine: createEngine(START_FEN),
    mode: opts.mode,
    timeControl: tc,
    redTimeMs: tc.initialSeconds * 1000,
    blackTimeMs: tc.initialSeconds * 1000,
    red: opts.red,
    black: opts.black,
    spectators: new Set(),
    status: 'playing',
    aiDepth: opts.aiDepth,
    movesWithoutCapture: 0,
    positionCounts: new Map([[START_FEN, 1]]),
  };
  games.set(id, game);
  return game;
}

export function getGame(id: string): ActiveGame | undefined {
  return games.get(id);
}

export function listSpectatableGames(): GameSnapshot[] {
  return [...games.values()]
    .filter((g) => g.status === 'playing' && g.mode === 'pvp')
    .map(toSnapshot);
}

export function createRoom(host: PublicUser, preset: TimeControlPreset): { roomCode: string; game: ActiveGame } {
  const game = createGame({ mode: 'pvp', timeControlPreset: preset, red: host });
  const roomCode = genCode();
  game.roomCode = roomCode;
  roomByCode.set(roomCode, game.id);
  return { roomCode, game };
}

export function joinRoom(code: string, guest: PublicUser): ActiveGame | null {
  const gameId = roomByCode.get(code.toUpperCase());
  if (!gameId) return null;
  const game = games.get(gameId);
  if (!game || game.black) return null;
  game.black = guest;
  return game;
}

export function leaveRoom(gameId: string): void {
  const game = games.get(gameId);
  if (!game?.roomCode) return;
  roomByCode.delete(game.roomCode);
}

export function trackPosition(game: ActiveGame, captured: boolean): void {
  if (captured) game.movesWithoutCapture = 0;
  else game.movesWithoutCapture += 1;

  const fenKey = game.engine.fen().split(' ')[0];
  const count = (game.positionCounts.get(fenKey) ?? 0) + 1;
  game.positionCounts.set(fenKey, count);
}

export function checkDrawRules(game: ActiveGame): string | null {
  if (game.movesWithoutCapture >= 120) return 'sixty_move_rule';
  for (const count of game.positionCounts.values()) {
    if (count >= 3) return 'repetition';
  }
  return null;
}

export function removeGame(id: string): void {
  const game = games.get(id);
  if (game?.roomCode) roomByCode.delete(game.roomCode);
  games.delete(id);
}

export function allGames(): ActiveGame[] {
  return [...games.values()];
}
