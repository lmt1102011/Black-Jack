import http from 'node:http';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { CLIENT_EVENTS, SERVER_EVENTS } from '@blackjack/shared';
import { env, isProduction } from './config/env.js';
import { resolveSocketPlayer } from './auth/socketAuth.js';
import { TableManager } from './game/tableManager.js';
import {
  betSchema,
  cardPeekSchema,
  chatSchema,
  joinTableSchema,
  parsePayload,
  playerActionSchema,
  roomCodeSchema
} from './security/validators.js';
import { guardSocketRate } from './security/socketRateLimit.js';

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: env.clientOrigins,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({
  windowMs: 60_000,
  limit: isProduction ? 120 : 500,
  standardHeaders: true,
  legacyHeaders: false
}));

const io = new Server(server, {
  cors: {
    origin: env.clientOrigins,
    credentials: true
  },
  transports: ['websocket', 'polling'],
  connectionStateRecovery: {
    maxDisconnectionDuration: 120_000,
    skipMiddlewares: false
  }
});

const manager = new TableManager(io);

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'black-jack-api',
    uptime: process.uptime(),
    tables: manager.listTables().length
  });
});

app.get('/api/tables', (_req, res) => {
  res.json(manager.listTables());
});

io.use(async (socket, next) => {
  try {
    const player = await resolveSocketPlayer(socket);
    socket.data.player = manager.registerConnection(player);
    next();
  } catch (error) {
    next(error);
  }
});

io.on('connection', (socket) => {
  const player = socket.data.player;
  socket.emit(SERVER_EVENTS.lobbyUpdate, manager.listTables());
  socket.emit(SERVER_EVENTS.toast, {
    type: 'success',
    title: 'Connected',
    message: `Welcome, ${player.username}.`
  });

  socket.on(CLIENT_EVENTS.lobbyList, withSocketGuard(socket, 'lobby', () => {
    socket.emit(SERVER_EVENTS.lobbyUpdate, manager.listTables());
  }));

  socket.on(CLIENT_EVENTS.quickMatch, withSocketGuard(socket, 'quick', () => {
    const table = manager.quickMatch(player);
    socket.join(table.id);
    manager.emitTable(table.id);
  }));

  socket.on(CLIENT_EVENTS.createPrivate, withSocketGuard(socket, 'createPrivate', () => {
    const table = manager.createPrivateTable(player);
    socket.join(table.id);
    manager.emitTable(table.id);
  }));

  socket.on(CLIENT_EVENTS.joinTable, withSocketGuard(socket, 'joinTable', (payload) => {
    const { tableId } = parsePayload(joinTableSchema, payload);
    const table = manager.joinSeat(tableId, player);
    socket.join(table.id);
    manager.emitTable(table.id);
  }));

  socket.on('table:joinCode', withSocketGuard(socket, 'joinCode', (payload) => {
    const { code } = parsePayload(roomCodeSchema, payload);
    const table = manager.joinByCode(code, player);
    socket.join(table.id);
    manager.emitTable(table.id);
  }));

  socket.on(CLIENT_EVENTS.spectateTable, withSocketGuard(socket, 'spectate', (payload) => {
    const { code } = parsePayload(roomCodeSchema, payload);
    const table = manager.spectateByCode(code, player);
    socket.join(table.id);
    manager.emitTable(table.id);
  }));

  socket.on(CLIENT_EVENTS.leaveTable, withSocketGuard(socket, 'leave', (payload) => {
    const { tableId } = parsePayload(joinTableSchema, payload);
    manager.leaveTable(tableId, player.id);
    socket.leave(tableId);
  }));

  socket.on(CLIENT_EVENTS.placeBet, withSocketGuard(socket, 'bet', (payload) => {
    const { tableId, amount } = parsePayload(betSchema, payload);
    manager.placeBet(player.id, tableId, amount);
  }));

  socket.on(CLIENT_EVENTS.playerAction, withSocketGuard(socket, 'action', (payload) => {
    const { tableId, action } = parsePayload(playerActionSchema, payload);
    manager.playerAction(player.id, tableId, action);
  }));

  socket.on(CLIENT_EVENTS.cardPeek, withSocketGuard(socket, 'peek', (payload) => {
    guardSocketRate(socket, 'peekPulse', 18, 2_000);
    const { tableId, handId, cardIndex, active } = parsePayload(cardPeekSchema, payload);
    const peek = manager.describePeek(player.id, tableId, handId, cardIndex);
    socket.to(tableId).emit(SERVER_EVENTS.cardPeek, {
      ...peek,
      active
    });
  }));

  socket.on(CLIENT_EVENTS.chatMessage, withSocketGuard(socket, 'chat', (payload) => {
    guardSocketRate(socket, 'chatSpam', 8, 12_000);
    const { tableId, text } = parsePayload(chatSchema, payload);
    manager.addChatMessage(player.id, tableId, text);
  }));

  socket.on('disconnect', () => {
    manager.disconnect(player.id);
  });
});

server.listen(env.port, () => {
  console.log(`Black Jack API listening on :${env.port}`);
});

function withSocketGuard(socket, rateKey, handler) {
  return (...args) => {
    try {
      guardSocketRate(socket, rateKey);
      handler(...args);
    } catch (error) {
      socket.emit(SERVER_EVENTS.tableError, {
        message: error.message ?? 'Something went wrong.'
      });
    }
  };
}
