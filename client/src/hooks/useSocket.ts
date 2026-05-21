import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, GameSnapshot, ServerToClientEvents, Side } from '@xq/shared';
import { useAuthStore, useGameStore } from '@/store/gameStore';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<AppSocket | null>(null);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket: AppSocket = io('/', {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('matchmaking:matched', ({ game, side }) => {
      useGameStore.getState().setSnapshot(game);
      useGameStore.getState().setMySide(side);
    });

    socket.on('game:move_applied', ({ snapshot }) => {
      useGameStore.getState().setSnapshot(snapshot);
      useGameStore.getState().setSelection(null, []);
    });

    socket.on('game:state', (snapshot) => {
      useGameStore.getState().setSnapshot(snapshot);
    });

    socket.on('game:ended', () => {
      useGameStore.getState().setSelection(null, []);
    });

    socket.on('error', ({ message }) => {
      console.error('[socket]', message);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [token]);

  return socketRef;
}

export function emitMove(
  socket: AppSocket | null,
  gameId: string,
  move: string,
  onDone?: (snapshot: GameSnapshot) => void,
) {
  if (!socket) return;
  socket.emit('game:move', { gameId, move }, (res) => {
    if (res.ok && res.snapshot) {
      useGameStore.getState().setSnapshot(res.snapshot);
      onDone?.(res.snapshot);
    }
  });
}

export function startMatchmaking(socket: AppSocket | null, timeControl: 'bullet' | 'blitz' | 'rapid') {
  socket?.emit('matchmaking:join', { timeControl });
}

export function createRoom(
  socket: AppSocket | null,
  timeControl: 'bullet' | 'blitz' | 'rapid',
  cb: (room: { code: string; snapshot?: GameSnapshot }) => void,
) {
  socket?.emit('room:create', { timeControl }, (res) => {
    if ('error' in res) return;
    useGameStore.getState().setSnapshot(res.snapshot ?? null);
    useGameStore.getState().setMySide('red');
    cb({ code: res.code, snapshot: res.snapshot });
  });
}

export function joinRoom(socket: AppSocket | null, code: string, cb: (ok: boolean) => void) {
  socket?.emit('room:join', { code }, (res) => {
    if ('error' in res) {
      cb(false);
      return;
    }
    useGameStore.getState().setSnapshot(res.snapshot ?? null);
    useGameStore.getState().setMySide('black');
    cb(true);
  });
}

export function startAiGame(
  socket: AppSocket | null,
  depth: number,
  timeControl: 'bullet' | 'blitz' | 'rapid',
  side: Side,
) {
  socket?.emit('ai:start', { depth, timeControl, side }, (res) => {
    if ('error' in res) return;
    useGameStore.getState().setSnapshot(res);
    useGameStore.getState().setMySide(side);
  });
}
