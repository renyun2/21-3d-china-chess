import type {
  GameResult,
  GameSnapshot,
  MoveUci,
  PublicUser,
  ReplayRecord,
  RoomInfo,
  Side,
  TimeControlPreset,
} from './types.js';

/** Client → Server */
export interface ClientToServerEvents {
  'matchmaking:join': (payload: { timeControl: TimeControlPreset; eloRange?: number }) => void;
  'matchmaking:leave': () => void;
  'room:create': (payload: { timeControl: TimeControlPreset }, ack: (res: RoomInfo | { error: string }) => void) => void;
  'room:join': (payload: { code: string }, ack: (res: RoomInfo | { error: string }) => void) => void;
  'room:leave': () => void;
  'game:move': (payload: { gameId: string; move: MoveUci }, ack: (res: { ok: boolean; snapshot?: GameSnapshot; error?: string }) => void) => void;
  'game:resign': (payload: { gameId: string }) => void;
  'game:offer_draw': (payload: { gameId: string }) => void;
  'game:respond_draw': (payload: { gameId: string; accept: boolean }) => void;
  'game:sync': (payload: { gameId: string }, ack: (res: GameSnapshot | { error: string }) => void) => void;
  'spectate:list': (ack: (games: GameSnapshot[]) => void) => void;
  'spectate:join': (payload: { gameId: string }, ack: (res: GameSnapshot | { error: string }) => void) => void;
  'spectate:leave': (payload: { gameId: string }) => void;
  'chat:send': (payload: { roomId: string; text: string }) => void;
  'ai:start': (payload: { depth: number; timeControl: TimeControlPreset; side: Side }, ack: (res: GameSnapshot | { error: string }) => void) => void;
  'ai:move': (payload: { gameId: string }) => void;
  'replay:load': (payload: { id: string }, ack: (res: ReplayRecord | { error: string }) => void) => void;
  'replay:import': (payload: { pgn: string }, ack: (res: ReplayRecord | { error: string }) => void) => void;
}

/** Server → Client */
export interface ServerToClientEvents {
  'matchmaking:queued': (payload: { position: number; estimatedMs: number }) => void;
  'matchmaking:matched': (payload: { game: GameSnapshot; side: Side }) => void;
  'room:updated': (room: RoomInfo) => void;
  'game:state': (snapshot: GameSnapshot) => void;
  'game:move_applied': (payload: { gameId: string; move: MoveUci; snapshot: GameSnapshot }) => void;
  'game:ended': (payload: { gameId: string; result: GameResult; reason: string }) => void;
  'spectate:update': (snapshot: GameSnapshot) => void;
  'chat:message': (payload: { roomId: string; user: PublicUser; text: string; at: number }) => void;
  'leaderboard:update': (rows: Array<PublicUser & { rank: number }>) => void;
  'error': (payload: { code: string; message: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  username: string;
}

export const SOCKET_EVENTS = {
  MATCHMAKING_JOIN: 'matchmaking:join',
  MATCHMAKING_LEAVE: 'matchmaking:leave',
  MATCHMAKING_QUEUED: 'matchmaking:queued',
  MATCHMAKING_MATCHED: 'matchmaking:matched',
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_UPDATED: 'room:updated',
  GAME_MOVE: 'game:move',
  GAME_RESIGN: 'game:resign',
  GAME_OFFER_DRAW: 'game:offer_draw',
  GAME_RESPOND_DRAW: 'game:respond_draw',
  GAME_SYNC: 'game:sync',
  GAME_STATE: 'game:state',
  GAME_MOVE_APPLIED: 'game:move_applied',
  GAME_ENDED: 'game:ended',
  SPECTATE_LIST: 'spectate:list',
  SPECTATE_JOIN: 'spectate:join',
  SPECTATE_LEAVE: 'spectate:leave',
  SPECTATE_UPDATE: 'spectate:update',
  CHAT_SEND: 'chat:send',
  CHAT_MESSAGE: 'chat:message',
  AI_START: 'ai:start',
  AI_MOVE: 'ai:move',
  REPLAY_LOAD: 'replay:load',
  REPLAY_IMPORT: 'replay:import',
  LEADERBOARD_UPDATE: 'leaderboard:update',
  ERROR: 'error',
} as const;
