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
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Define allowed file types by category
    const allowedMimeTypes = {
      images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'],
      videos: ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-flv'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/x-wav'],
      documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 
        'text/rtf',
        'application/rtf',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ]
    };

    const allAllowedTypes = [
      ...allowedMimeTypes.images,
      ...allowedMimeTypes.videos,
      ...allowedMimeTypes.audio,
      ...allowedMimeTypes.documents
    ];

    // Check file extension as backup
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|mp4|avi|mov|wmv|webm|mp3|wav|ogg|aac|flac|pdf|doc|docx|txt|rtf|zip|rar|7z|xls|xlsx|ppt|pptx)$/i;
    
    const hasAllowedMimeType = allAllowedTypes.includes(file.mimetype.toLowerCase());
    const hasAllowedExtension = allowedExtensions.test(file.originalname.toLowerCase());
    
    if (hasAllowedMimeType || hasAllowedExtension) {
      return cb(null, true);
    } else {
      cb(new Error(`File type "${file.mimetype}" is not supported. Please upload images, videos, audio files, or documents only.`));
    }
  }
});

app.use(cors());
app.use(express.json());
app.use(pinoHttp());

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Basic health
app.get('/health', async (_req, res) => {
  res.json({ ok: true });
});

// Auth verification endpoint
app.get('/auth/verify', auth, async (req, res) => {
  const userId = (req as any).userId as string;
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      select: { id: true, phone: true, displayName: true, isAdmin: true } 
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ valid: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
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
import crypto from 'crypto';

function signToken(userId: string) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change';
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
}

app.post('/auth/register', async (req, res) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const hash = await bcrypt.hash(body.password, 10);
    const makeAdmin = (await prisma.user.count()) === 0; // first user becomes admin
    const user = await prisma.user.create({
      data: {
        phone: body.phone,
        displayName: body.displayName,
        passwordHash: hash,
        identityKey: body.identityKey,
        preKeys: body.preKeys ?? {},
        isAdmin: makeAdmin,
      },
      select: { id: true, phone: true, displayName: true, identityKey: true, preKeys: true, isAdmin: true },
    });

    // Notify connected clients about the new user
    broadcast({
      type: 'user-registered',
      user: { id: user.id, phone: user.phone, displayName: user.displayName, identityKey: user.identityKey },
    });

    const token = signToken(user.id);
    res.json({ token, user });
  } catch (e: any) {
    req.log.error(e);
    res.status(400).json({ error: e.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const body = LoginSchema.parse(req.body);
    const envPhone = (process.env.ADMIN_PHONE || '').trim();
    const envPass = process.env.ADMIN_PASSWORD || '';

    // If matches bootstrap admin credentials
    if (envPhone && envPass && (body.phone === envPhone || body.phone === `+${envPhone}`) && body.password === envPass) {
      // Ensure user exists and is admin
      let adminUser = await prisma.user.findUnique({ where: { phone: body.phone.startsWith('+') ? body.phone : envPhone.startsWith('+') ? envPhone : envPhone }, select: { id: true, phone: true, displayName: true, identityKey: true, preKeys: true, passwordHash: true, isAdmin: true } });
      if (!adminUser) {
        const hash = await bcrypt.hash(envPass, 10);
        // simple random identity key
        const rand = Buffer.from(crypto.randomUUID().replace(/-/g,'').slice(0,32)).toString('base64');
        adminUser = await prisma.user.create({
          data: {
            phone: body.phone.startsWith('+') ? body.phone : envPhone,
            displayName: 'Admin',
            passwordHash: hash,
            identityKey: rand,
            preKeys: {},
            isAdmin: true,
          },
          select: { id: true, phone: true, displayName: true, identityKey: true, preKeys: true, passwordHash: true, isAdmin: true }
        });
      } else if (!adminUser.isAdmin) {
        await prisma.user.update({ where: { id: adminUser.id }, data: { isAdmin: true } });
        adminUser.isAdmin = true;
      }
      const token = signToken(adminUser.id);
      const { passwordHash, ...publicUser } = adminUser;
      return res.json({ token, user: publicUser });
    }

    const user = await prisma.user.findUnique({ where: { phone: body.phone }, select: { id: true, phone: true, displayName: true, passwordHash: true, identityKey: true, preKeys: true, isAdmin: true } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const { passwordHash, ...publicUser } = user;
    const token = signToken(user.id);
    res.json({ token, user: publicUser });
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

// File upload endpoint
app.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, filename, mimetype, size } = req.file;
    const fileUrl = `/uploads/${filename}`;
    
    // Get file type category with more precise detection
    let fileType = 'file';
    const mimeType = mimetype.toLowerCase();
    const fileName = originalname.toLowerCase();
    
    if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(fileName)) {
      fileType = 'image';
    } else if (mimeType.startsWith('video/') || /\.(mp4|avi|mov|wmv|webm|mkv|flv|m4v)$/.test(fileName)) {
      fileType = 'video';
    } else if (mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|aac|flac|m4a|wma)$/.test(fileName)) {
      fileType = 'audio';
    } else if (
      mimeType.includes('pdf') || 
      mimeType.includes('document') || 
      mimeType.includes('text') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation') ||
      mimeType.includes('zip') ||
      /\.(pdf|doc|docx|txt|rtf|odt|xls|xlsx|ppt|pptx|zip|rar|7z)$/.test(fileName)
    ) {
      fileType = 'document';
    }

    res.json({
      success: true,
      file: {
        originalName: originalname,
        fileName: filename,
        url: fileUrl,
        mimeType: mimetype,
        size: size,
        type: fileType
      }
    });
  } catch (error: any) {
    logger.error(error, 'File upload error');
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// Admin guard
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = (req as any).userId as string;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  if (!u?.isAdmin) return res.status(403).json({ error: 'Forbidden' });
  next();
}

// Admin: list all users (including self) with pagination
app.get('/admin/users', auth, requireAdmin, async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
  const cursor = (req.query.cursor as string | undefined) || undefined;
  const list = await prisma.user.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: { id: true, phone: true, displayName: true, createdAt: true, isAdmin: true },
  });
  const hasNext = list.length > limit;
  const items = hasNext ? list.slice(0, -1) : list;
  const nextCursor = hasNext ? items[items.length - 1].id : null;
  res.json({ items, nextCursor });
});

// Admin: delete user
app.delete('/admin/users/:id', auth, requireAdmin, async (req, res) => {
  const targetId = req.params.id;
  // Prevent self-deletion if only admin (optional safeguard)
  const adminCount = await prisma.user.count({ where: { isAdmin: true } });
  if (targetId === (req as any).userId && adminCount === 1) {
    return res.status(400).json({ error: 'Cannot delete the only admin' });
  }
  try {
    await prisma.message.deleteMany({ where: { OR: [{ senderId: targetId }, { receiverId: targetId }] } });
    await prisma.conversation.deleteMany({ where: { OR: [{ aId: targetId }, { bId: targetId }] } });
    await prisma.user.delete({ where: { id: targetId } });
    res.json({ ok: true });
  } catch (e: any) {
    return res.status(400).json({ error: 'Delete failed' });
  }
});

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
  const adminPhoneRaw = (process.env.ADMIN_PHONE || '').replace(/^\+/, '');

  const users = await prisma.user.findMany({
    select: { id: true, phone: true, displayName: true, identityKey: true, createdAt: true },
    where: { id: { not: meId } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  const hasNext = users.length > limit;
  let items = hasNext ? users.slice(0, -1) : users;
  // Filter out admin bootstrap account by phone
  if (adminPhoneRaw) {
    items = items.filter(u => u.phone.replace(/^\+/, '') !== adminPhoneRaw);
  }
  const nextCursor = hasNext ? items[items.length - 1]?.id || null : null;
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
    mediaUrl: m.mediaUrl,
    mediaType: m.mediaType,
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
          // msg: { type, toUserId, conversationId?, ciphertext(base64), dedupeKey?, mediaUrl?, mediaType?, fileName?, fileSize? }
          const { toUserId, conversationId, ciphertext, dedupeKey, mediaUrl, mediaType, fileName, fileSize } = msg;
          if (!toUserId || (!ciphertext && !mediaUrl)) return;
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
              ciphertext: ciphertext ? Buffer.from(ciphertext, 'base64') : Buffer.from(''),
              mediaUrl,
              mediaType,
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
              mediaUrl,
              mediaType,
              fileName,
              fileSize,
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
