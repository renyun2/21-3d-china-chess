import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  PublicUser,
  ServerToClientEvents,
  Side,
  SocketData,
} from '@xq/shared';
import { nextRating } from '@xq/shared';
import { verifyToken } from '../auth/jwt.js';
import { prisma } from '../db/prisma.js';
import {
  checkDrawRules,
  createGame,
  createRoom,
  getGame,
  joinRoom,
  listSpectatableGames,
  toSnapshot,
  trackPosition,
} from '../game/gameManager.js';
import { dequeue, enqueue, queuePosition, tryMatch } from '../matchmaking/queue.js';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type AppServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

async function loadUser(userId: string): Promise<PublicUser | null> {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return null;
  return { id: u.id, username: u.username, elo: u.elo, avatarUrl: u.avatarUrl ?? undefined };
}

function sideForUser(game: ReturnType<typeof getGame>, userId: string): Side | null {
  if (!game) return null;
  if (game.red?.id === userId) return 'red';
  if (game.black?.id === userId) return 'black';
  return null;
}

export function attachSocketHandlers(io: AppServer): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('auth required'));
      return;
    }
    const payload = verifyToken(token);
    if (!payload) {
      next(new Error('invalid token'));
      return;
    }
    socket.data.userId = payload.sub;
    socket.data.username = payload.username;
    next();
  });

  io.on('connection', (socket: AppSocket) => {
    const userId = socket.data.userId;
    void socket.join(userId);

    socket.on('matchmaking:join', async ({ timeControl }) => {
      const user = await loadUser(userId);
      if (!user) return;
      enqueue(userId, user.elo, timeControl);
      socket.emit('matchmaking:queued', {
        position: queuePosition(userId),
        estimatedMs: 3000,
      });

      const opponentId = tryMatch(userId);
      if (!opponentId) return;

      const opponent = await loadUser(opponentId);
      const self = await loadUser(userId);
      if (!opponent || !self) return;

      const game = createGame({
        mode: 'pvp',
        timeControlPreset: timeControl,
        red: self,
        black: opponent,
      });

      const snap = toSnapshot(game);
      io.to(userId).emit('matchmaking:matched', { game: snap, side: 'red' });
      io.to(opponentId).emit('matchmaking:matched', { game: snap, side: 'black' });
    });

    socket.on('matchmaking:leave', () => dequeue(userId));

    socket.on('room:create', async ({ timeControl }, ack) => {
      const user = await loadUser(userId);
      if (!user) {
        ack({ error: 'user not found' });
        return;
      }
      const { roomCode, game } = createRoom(user, timeControl);
      await socket.join(game.id);
      ack({
        id: game.id,
        code: roomCode,
        hostId: userId,
        timeControl: game.timeControl,
        status: 'open',
        snapshot: toSnapshot(game),
      });
    });

    socket.on('room:join', async ({ code }, ack) => {
      const user = await loadUser(userId);
      if (!user) {
        ack({ error: 'user not found' });
        return;
      }
      const game = joinRoom(code, user);
      if (!game) {
        ack({ error: 'room unavailable' });
        return;
      }
      await socket.join(game.id);
      const room = {
        id: game.id,
        code: game.roomCode!,
        hostId: game.red!.id,
        timeControl: game.timeControl,
        status: 'playing' as const,
        snapshot: toSnapshot(game),
      };
      io.to(game.id).emit('room:updated', room);
      ack(room);
    });

    socket.on('game:move', async ({ gameId, move }, ack) => {
      const game = getGame(gameId);
      if (!game) {
        ack({ ok: false, error: 'game not found' });
        return;
      }
      const side = sideForUser(game, userId);
      if (!side || side !== game.engine.turn()) {
        ack({ ok: false, error: 'not your turn' });
        return;
      }

      const beforePieces = game.engine.fen();
      const result = game.engine.move(move);
      if (!result.ok) {
        ack({ ok: false, error: result.error });
        return;
      }

      const captured = beforePieces !== result.fen && move.length >= 4;
      trackPosition(game, captured);
      game.lastMove = move;
      game.status = result.inCheck ? 'check' : 'playing';

      const drawReason = checkDrawRules(game);
      if (drawReason) {
        game.status = 'finished';
        io.to(gameId).emit('game:ended', { gameId, result: 'draw', reason: drawReason });
      } else if (result.isGameOver) {
        game.status = 'finished';
        io.to(gameId).emit('game:ended', {
          gameId,
          result: result.result!,
          reason: result.reason ?? 'checkmate',
        });
        await persistGame(game);
      }

      const snap = toSnapshot(game);
      io.to(gameId).emit('game:move_applied', { gameId, move, snapshot: snap });
      ack({ ok: true, snapshot: snap });
    });

    socket.on('game:resign', ({ gameId }) => {
      const game = getGame(gameId);
      const side = sideForUser(game, userId);
      if (!game || !side) return;
      game.status = 'finished';
      const result = side === 'red' ? 'black_win' : 'red_win';
      io.to(gameId).emit('game:ended', { gameId, result, reason: 'resign' });
      void persistGame(game);
    });

    socket.on('game:offer_draw', ({ gameId }) => {
      const game = getGame(gameId);
      const side = sideForUser(game, userId);
      if (!game || !side) return;
      game.drawOffer = side;
      io.to(gameId).emit('game:state', toSnapshot(game));
    });

    socket.on('game:respond_draw', ({ gameId, accept }) => {
      const game = getGame(gameId);
      if (!game || !game.drawOffer) return;
      if (accept) {
        game.status = 'finished';
        io.to(gameId).emit('game:ended', { gameId, result: 'draw', reason: 'agreement' });
        void persistGame(game);
      } else {
        game.drawOffer = null;
        io.to(gameId).emit('game:state', toSnapshot(game));
      }
    });

    socket.on('game:sync', ({ gameId }, ack) => {
      const game = getGame(gameId);
      if (!game) {
        ack({ error: 'not found' });
        return;
      }
      ack(toSnapshot(game));
    });

    socket.on('spectate:list', (ack) => ack(listSpectatableGames()));

    socket.on('spectate:join', async ({ gameId }, ack) => {
      const game = getGame(gameId);
      if (!game) {
        ack({ error: 'not found' });
        return;
      }
      game.spectators.add(userId);
      await socket.join(gameId);
      ack(toSnapshot(game));
    });

    socket.on('spectate:leave', ({ gameId }) => {
      const game = getGame(gameId);
      game?.spectators.delete(userId);
      void socket.leave(gameId);
    });

    socket.on('chat:send', async ({ roomId, text }) => {
      const user = await loadUser(userId);
      if (!user || !text.trim()) return;
      await prisma.chatMessage.create({ data: { roomId, userId, text: text.trim() } });
      io.to(roomId).emit('chat:message', { roomId, user, text: text.trim(), at: Date.now() });
    });

    socket.on('ai:start', async ({ depth, timeControl, side }, ack) => {
      const user = await loadUser(userId);
      if (!user) {
        ack({ error: 'user not found' });
        return;
      }
      const game = createGame({
        mode: 'ai',
        timeControlPreset: timeControl,
        red: side === 'red' ? user : undefined,
        black: side === 'black' ? user : undefined,
        aiDepth: Math.min(20, Math.max(1, depth)),
      });
      if (side === 'red') game.red = user;
      else game.black = user;
      await socket.join(game.id);
      ack(toSnapshot(game));
    });

    socket.on('disconnect', () => dequeue(userId));
  });
}

async function persistGame(game: NonNullable<ReturnType<typeof getGame>>): Promise<void> {
  if (!game.red || !game.black) return;
  const result = game.status === 'finished' ? 'finished' : null;
  await prisma.game.create({
    data: {
      id: game.id,
      fen: game.engine.fen(),
      moves: game.engine.history().join(' '),
      pgn: game.engine.history().join(' '),
      result: result ?? undefined,
      timeControl: game.timeControl.preset,
      mode: game.mode,
      whiteUserId: game.red.id,
      blackUserId: game.black.id,
      finishedAt: new Date(),
    },
  });

  if (game.red && game.black && result) {
    // Elo update placeholder — real impl needs parsed result
  }
}

export async function getLeaderboard(limit = 20) {
  const users = await prisma.user.findMany({
    orderBy: { elo: 'desc' },
    take: limit,
  });
  return users.map((u, i) => ({
    id: u.id,
    username: u.username,
    elo: u.elo,
    rank: i + 1,
  }));
}
