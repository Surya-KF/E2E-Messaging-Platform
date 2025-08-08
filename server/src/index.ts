import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

app.use(cors());
app.use(express.json());
app.use(pinoHttp());

// Basic health
app.get('/health', async (_req, res) => {
  res.json({ ok: true });
});

// Auth schemas
const RegisterSchema = z.object({
  phone: z.string().min(6),
  displayName: z.string().min(1),
  password: z.string().min(6),
  identityKey: z.string().min(24), // base64 public key
  preKeys: z.any().optional(),
});

const LoginSchema = z.object({
  phone: z.string(),
  password: z.string(),
});

import bcrypt from 'bcryptjs';

function signToken(userId: string) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change';
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
}

app.post('/auth/register', async (req, res) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const hash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        phone: body.phone,
        displayName: body.displayName,
        passwordHash: hash,
        identityKey: body.identityKey,
        preKeys: body.preKeys ?? {},
      },
    });

    // Notify connected clients about the new user
    broadcast({
      type: 'user-registered',
      user: { id: user.id, phone: user.phone, displayName: user.displayName, identityKey: user.identityKey },
    });

    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, phone: user.phone, displayName: user.displayName, identityKey: user.identityKey } });
  } catch (e: any) {
    req.log.error(e);
    res.status(400).json({ error: e.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const body = LoginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, phone: user.phone, displayName: user.displayName, identityKey: user.identityKey } });
  } catch (e: any) {
    req.log.error(e);
    res.status(400).json({ error: e.message });
  }
});

// Middleware
function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const hdr = req.headers.authorization;
  if (!hdr) return res.status(401).json({ error: 'Missing token' });
  const token = hdr.replace('Bearer ', '');
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret-change';
    const payload = jwt.verify(token, secret) as any;
    (req as any).userId = payload.sub as string;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Minimal directory service to fetch public identity keys
app.get('/users/:phone', auth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { phone: req.params.phone } });
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ id: user.id, phone: user.phone, displayName: user.displayName, identityKey: user.identityKey, preKeys: user.preKeys });
});

// List users (for chat list)
app.get('/users', auth, async (req, res) => {
  const meId = (req as any).userId as string;
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const cursor = (req.query.cursor as string | undefined) || undefined;

  const users = await prisma.user.findMany({
    select: { id: true, phone: true, displayName: true, identityKey: true, createdAt: true },
    where: { id: { not: meId } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  const hasNext = users.length > limit;
  const items = hasNext ? users.slice(0, -1) : users;
  const nextCursor = hasNext ? items[items.length - 1].id : null;
  res.json({ items, nextCursor });
});

// Conversation helpers
app.get('/conversations/:peerId', auth, async (req, res) => {
  const meId = (req as any).userId as string;
  const peerId = req.params.peerId;
  if (meId === peerId) return res.status(400).json({ error: 'Cannot chat with self' });
  const ids = [meId, peerId].sort();
  const existing = await prisma.conversation.findFirst({ where: { aId: ids[0], bId: ids[1] } });
  const conv = existing ?? (await prisma.conversation.create({ data: { aId: ids[0], bId: ids[1] } }));
  res.json({ conversationId: conv.id });
});

app.get('/conversations/:peerId/messages', auth, async (req, res) => {
  const meId = (req as any).userId as string;
  const peerId = req.params.peerId;
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const cursor = (req.query.cursor as string | undefined) || undefined;
  if (meId === peerId) return res.status(400).json({ error: 'Cannot chat with self' });
  const ids = [meId, peerId].sort();
  const conv = await prisma.conversation.findFirst({ where: { aId: ids[0], bId: ids[1] } });
  if (!conv) return res.json({ items: [], nextCursor: null });

  const list = await prisma.message.findMany({
    where: { conversationId: conv.id },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  const hasNext = list.length > limit;
  const items = (hasNext ? list.slice(0, -1) : list).map((m: typeof list[number]) => ({
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    receiverId: m.receiverId,
    ciphertext: (m.ciphertext as any as Buffer).toString('base64'),
    createdAt: m.createdAt,
    deliveredAt: m.deliveredAt,
    readAt: m.readAt,
  }));
  const nextCursor = hasNext ? items[items.length - 1].id : null;
  res.json({ items, nextCursor });
});

// WebSocket auth and routing
import type { WebSocket } from 'ws';

const socketsByUser = new Map<string, Set<WebSocket>>();

function sendToUser(userId: string, msg: any) {
  const set = socketsByUser.get(userId);
  if (!set) return;
  const data = JSON.stringify(msg);
  for (const ws of set) {
    if (ws.readyState === ws.OPEN) ws.send(data);
  }
}

function broadcast(msg: any) {
  const data = JSON.stringify(msg);
  for (const set of socketsByUser.values()) {
    for (const ws of set) {
      if (ws.readyState === ws.OPEN) ws.send(data);
    }
  }
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', 'http://localhost');
  const token = url.searchParams.get('token');
  if (!token) {
    ws.close(4401, 'Missing token');
    return;
  }
  let userId: string | null = null;
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret-change';
    const payload = jwt.verify(token, secret) as any;
    userId = payload.sub as string;
  } catch {
    ws.close(4401, 'Invalid token');
    return;
  }

  if (!socketsByUser.has(userId)) socketsByUser.set(userId, new Set());
  socketsByUser.get(userId)!.add(ws);
  ws.on('close', () => socketsByUser.get(userId!)?.delete(ws));

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(String(raw));
      switch (msg.type) {
        case 'send-message': {
          // msg: { type, toUserId, conversationId?, ciphertext(base64), dedupeKey? }
          const { toUserId, conversationId, ciphertext, dedupeKey } = msg;
          if (!toUserId || !ciphertext) return;
          let convId = conversationId as string | undefined;
          if (!convId) {
            // ensure conversation exists
            const ids = [userId!, toUserId].sort();
            const existing = await prisma.conversation.findFirst({
              where: { aId: ids[0], bId: ids[1] },
            });
            const conv = existing ?? (await prisma.conversation.create({ data: { aId: ids[0], bId: ids[1] } }));
            convId = conv.id;
          }
          const created = await prisma.message.create({
            data: {
              senderId: userId!,
              receiverId: toUserId,
              conversationId: convId!,
              ciphertext: Buffer.from(ciphertext, 'base64'),
              dedupeKey,
            },
          });
          sendToUser(toUserId, {
            type: 'message',
            message: {
              id: created.id,
              conversationId: created.conversationId,
              senderId: created.senderId,
              receiverId: created.receiverId,
              ciphertext,
              createdAt: created.createdAt,
            },
          });
          break;
        }
        case 'receipt': {
          // msg: { type, messageId, kind: 'delivered'|'read' }
          const { messageId, kind } = msg;
          if (!messageId || !['delivered', 'read'].includes(kind)) return;
          const update = await prisma.message.update({
            where: { id: messageId },
            data: kind === 'delivered' ? { deliveredAt: new Date() } : { readAt: new Date() },
          });
          if (update.senderId !== userId) sendToUser(update.senderId, { type: 'receipt', messageId, kind });
          break;
        }
        default:
          break;
      }
    } catch (e) {
      logger.error(e, 'ws message error');
    }
  });

  ws.send(JSON.stringify({ type: 'ready' }));
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  logger.info(`Server listening on http://localhost:${port}`);
});
