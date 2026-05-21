import http from 'http';
import cors from 'cors';
import express from 'express';
import bcrypt from 'bcryptjs';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from '@xq/shared';
import { config } from './config.js';
import { signToken, verifyToken } from './auth/jwt.js';
import { prisma } from './db/prisma.js';
import { attachSocketHandlers, getLeaderboard } from './socket/handlers.js';

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password || password.length < 6) {
    res.status(400).json({ error: 'username and password (min 6) required' });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    res.status(409).json({ error: 'username taken' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { username, passwordHash } });
  const token = signToken({ sub: user.id, username: user.username });
  res.json({ token, user: { id: user.id, username: user.username, elo: user.elo } });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: 'username and password required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }
  const token = signToken({ sub: user.id, username: user.username });
  res.json({ token, user: { id: user.id, username: user.username, elo: user.elo } });
});

app.get('/api/leaderboard', async (_req, res) => {
  res.json(await getLeaderboard());
});

app.get('/api/games/history', async (req, res) => {
  const auth = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const payload = auth ? verifyToken(auth) : null;
  if (!payload) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  const games = await prisma.game.findMany({
    where: {
      OR: [{ whiteUserId: payload.sub }, { blackUserId: payload.sub }],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(games);
});

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(server, {
  cors: { origin: config.corsOrigin },
});

attachSocketHandlers(io);

server.listen(config.port, () => {
  console.log(`[server] http://localhost:${config.port}`);
  console.log(`[server] socket.io ready`);
});

export { app, io, server };
