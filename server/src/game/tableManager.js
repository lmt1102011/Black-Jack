import { randomUUID } from 'node:crypto';
import {
  CLIENT_EVENTS,
  PLAYER_ACTIONS,
  SERVER_EVENTS,
  TABLE_LIMITS,
  TABLE_PHASES,
  canDouble,
  canSplit,
  canSurrender,
  createHand,
  createShoe,
  handScore,
  isBlackjack,
  rankFromPoints,
  sanitizeTableForClient,
  settleHand
} from '@blackjack/shared';
import { secureRandom } from './secureRandom.js';
import { upsertProfile, writeMatchResult } from '../firebase/admin.js';

const tableNames = [
  'Monaco Royale',
  'Saigon Sapphire',
  'Atlantic Crown',
  'Neon Macau',
  'Golden Mirage',
  'Diamond Harbor'
];

export class TableManager {
  constructor(io) {
    this.io = io;
    this.tables = new Map();
    this.playerProfiles = new Map();
    this.turnTimers = new Map();
    this.settleTimers = new Map();
  }

  registerConnection(player) {
    const existing = this.playerProfiles.get(player.id);
    const merged = {
      ...player,
      chips: existing?.chips ?? player.chips,
      coins: existing?.coins ?? player.coins,
      premiumTokens: existing?.premiumTokens ?? player.premiumTokens,
      xp: existing?.xp ?? player.xp,
      level: existing?.level ?? player.level,
      rankPoints: existing?.rankPoints ?? player.rankPoints
    };
    this.playerProfiles.set(player.id, merged);
    this.markConnected(player.id, true);
    return merged;
  }

  disconnect(playerId) {
    this.markConnected(playerId, false);
  }

  listTables() {
    return [...this.tables.values()]
      .filter((table) => table.seats.length > 0 || table.type === 'public')
      .map((table) => this.toLobbyRow(table));
  }

  quickMatch(player) {
    const table = [...this.tables.values()].find((candidate) => (
      candidate.type === 'public'
      && candidate.seats.length < TABLE_LIMITS.maxPlayers
      && [TABLE_PHASES.waiting, TABLE_PHASES.betting, TABLE_PHASES.settled].includes(candidate.phase)
    )) ?? this.createTable(player, { type: 'public' });

    this.joinSeat(table.id, player);
    return table;
  }

  createPrivateTable(player) {
    const table = this.createTable(player, { type: 'private' });
    this.joinSeat(table.id, player);
    return table;
  }

  createTable(owner, { type = 'public' } = {}) {
    const id = randomUUID();
    const table = {
      id,
      code: this.generateRoomCode(),
      name: tableNames[this.tables.size % tableNames.length],
      type,
      phase: TABLE_PHASES.betting,
      limits: TABLE_LIMITS,
      seats: [],
      spectators: [],
      dealer: { cards: [] },
      shoe: createShoe(6, secureRandom),
      discard: [],
      roundId: null,
      activeSeatId: null,
      activeHandIndex: 0,
      turnDeadline: null,
      settleAt: null,
      chat: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.tables.set(id, table);
    this.broadcastLobby();
    return table;
  }

  joinSeat(tableId, player) {
    const table = this.requireTable(tableId);
    const existingSeat = table.seats.find((seat) => seat.playerId === player.id);
    if (existingSeat) {
      existingSeat.connected = true;
      existingSeat.lastSeenAt = Date.now();
      return table;
    }

    if (table.seats.length >= TABLE_LIMITS.maxPlayers) {
      throw new Error('This table is full.');
    }

    const profile = this.playerProfiles.get(player.id) ?? player;
    const rank = rankFromPoints(profile.rankPoints);
    table.seats.push({
      id: `seat_${player.id}`,
      playerId: player.id,
      username: profile.username,
      avatar: profile.avatar,
      chips: profile.chips,
      coins: profile.coins,
      premiumTokens: profile.premiumTokens,
      level: profile.level,
      xp: profile.xp,
      rankPoints: profile.rankPoints,
      rank: rank.name,
      rankColor: rank.color,
      connected: true,
      status: 'betting',
      pendingBet: 0,
      hands: [],
      stats: createStats(),
      joinedAt: Date.now(),
      lastSeenAt: Date.now()
    });

    table.updatedAt = Date.now();
    this.broadcastLobby();
    this.emitTable(table.id);
    return table;
  }

  leaveTable(tableId, playerId) {
    const table = this.requireTable(tableId);
    table.spectators = table.spectators.filter((spectator) => spectator.playerId !== playerId);

    const seat = table.seats.find((candidate) => candidate.playerId === playerId);
    if (seat && table.phase === TABLE_PHASES.betting) {
      table.seats = table.seats.filter((candidate) => candidate.playerId !== playerId);
    } else if (seat) {
      seat.connected = false;
    }

    table.updatedAt = Date.now();
    this.cleanupEmptyTable(table);
    this.broadcastLobby();
    this.emitTable(table.id);
    return table;
  }

  joinByCode(code, player) {
    const table = [...this.tables.values()].find((candidate) => candidate.code === code.toUpperCase());
    if (!table) throw new Error('Room code not found.');
    return this.joinSeat(table.id, player);
  }

  spectateByCode(code, player) {
    const table = [...this.tables.values()].find((candidate) => candidate.code === code.toUpperCase());
    if (!table) throw new Error('Room code not found.');

    if (!table.spectators.some((spectator) => spectator.playerId === player.id)) {
      table.spectators.push({
        playerId: player.id,
        username: player.username,
        joinedAt: Date.now()
      });
    }

    this.emitTable(table.id);
    return table;
  }

  placeBet(playerId, tableId, amount) {
    const table = this.requireTable(tableId);
    const seat = this.requireSeat(table, playerId);

    if (table.phase === TABLE_PHASES.settled) {
      this.resetForBetting(table, false);
    }

    if (table.phase !== TABLE_PHASES.betting && table.phase !== TABLE_PHASES.waiting) {
      throw new Error('Betting is closed for this round.');
    }

    if (amount < table.limits.minBet || amount > table.limits.maxBet) {
      throw new Error(`Bet must be between ${table.limits.minBet} and ${table.limits.maxBet}.`);
    }

    if (seat.chips < amount) {
      throw new Error('Not enough chips for this bet.');
    }

    seat.pendingBet = amount;
    seat.status = 'ready';
    table.phase = TABLE_PHASES.betting;
    table.updatedAt = Date.now();

    if (this.canStartRound(table)) {
      this.startRound(table);
    }

    this.broadcastLobby();
    this.emitTable(table.id);
    return table;
  }

  playerAction(playerId, tableId, action) {
    const table = this.requireTable(tableId);
    const seat = this.requireSeat(table, playerId);

    if (table.phase !== TABLE_PHASES.playing) {
      throw new Error('No active hand right now.');
    }

    if (table.activeSeatId !== seat.id) {
      throw new Error('It is not your turn.');
    }

    const hand = seat.hands[table.activeHandIndex];
    if (!hand) throw new Error('Active hand not found.');

    switch (action) {
      case PLAYER_ACTIONS.hit:
        hand.cards.push(this.drawCard(table));
        seat.lastAction = 'Hit';
        if (handScore(hand.cards).busted) {
          hand.stood = true;
          this.advanceTurn(table);
        }
        break;
      case PLAYER_ACTIONS.stand:
        hand.stood = true;
        seat.lastAction = 'Stand';
        this.advanceTurn(table);
        break;
      case PLAYER_ACTIONS.double:
        this.doubleDown(table, seat, hand);
        break;
      case PLAYER_ACTIONS.split:
        this.splitHand(table, seat, hand);
        break;
      case PLAYER_ACTIONS.insurance:
        this.buyInsurance(table, seat, hand);
        break;
      case PLAYER_ACTIONS.surrender:
        this.surrender(table, seat, hand);
        break;
      default:
        throw new Error('Unknown action.');
    }

    table.updatedAt = Date.now();
    this.emitTable(table.id);
    return table;
  }

  addChatMessage(playerId, tableId, text) {
    const table = this.requireTable(tableId);
    const seat = table.seats.find((candidate) => candidate.playerId === playerId);
    const spectator = table.spectators.find((candidate) => candidate.playerId === playerId);
    const name = seat?.username ?? spectator?.username ?? 'Spectator';

    const message = {
      id: randomUUID(),
      playerId,
      username: name,
      text: text.trim().replace(/[<>]/g, ''),
      createdAt: Date.now()
    };

    table.chat = [...table.chat.slice(-39), message];
    this.io.to(table.id).emit(CLIENT_EVENTS.chatMessage, message);
    this.emitTable(table.id);
    return message;
  }

  describePeek(playerId, tableId, handId, cardIndex) {
    const table = this.requireTable(tableId);
    const seat = this.requireSeat(table, playerId);
    if (table.phase !== TABLE_PHASES.playing) {
      throw new Error('Cards can only be peeked during active play.');
    }
    const hand = seat.hands.find((candidate) => candidate.id === handId);
    if (!hand || !hand.cards[cardIndex]) {
      throw new Error('Card not found.');
    }
    return {
      tableId: table.id,
      seatId: seat.id,
      handId,
      cardIndex
    };
  }

  emitTable(tableId) {
    const table = this.tables.get(tableId);
    if (!table) return;
    for (const socket of this.io.sockets.sockets.values()) {
      if (socket.rooms.has(table.id)) {
        socket.emit(SERVER_EVENTS.tableState, sanitizeTableForClient(table, socket.data.player?.id));
      }
    }
  }

  broadcastLobby() {
    this.io.emit(SERVER_EVENTS.lobbyUpdate, this.listTables());
  }

  toLobbyRow(table) {
    return {
      id: table.id,
      code: table.code,
      name: table.name,
      type: table.type,
      phase: table.phase,
      players: table.seats.length,
      maxPlayers: table.limits.maxPlayers,
      spectators: table.spectators.length,
      minBet: table.limits.minBet,
      maxBet: table.limits.maxBet,
      updatedAt: table.updatedAt
    };
  }

  startRound(table) {
    this.clearTableTimers(table.id);
    table.phase = TABLE_PHASES.playing;
    table.roundId = randomUUID();
    table.dealer = { cards: [] };
    table.discard.push(...table.seats.flatMap((seat) => seat.hands.flatMap((hand) => hand.cards)));

    for (const seat of table.seats) {
      if (seat.pendingBet > 0 && seat.chips >= seat.pendingBet) {
        seat.chips -= seat.pendingBet;
        seat.hands = [createHand([], seat.pendingBet, { id: `${seat.id}_hand_1` })];
        seat.pendingBet = 0;
        seat.status = 'playing';
        seat.lastAction = 'Bet';
      } else {
        seat.hands = [];
        seat.status = 'waiting';
      }
    }

    const activeSeats = table.seats.filter((seat) => seat.hands.length > 0);
    for (let round = 0; round < 2; round += 1) {
      for (const seat of activeSeats) {
        seat.hands[0].cards.push(this.drawCard(table));
      }
      table.dealer.cards.push(this.drawCard(table));
    }

    if (isBlackjack(table.dealer.cards) || activeSeats.every((seat) => isBlackjack(seat.hands[0].cards))) {
      this.dealerPlay(table);
      return;
    }

    this.setTurn(table, 0, 0);
  }

  setTurn(table, seatIndex, handIndex) {
    const playable = this.findPlayableHand(table, seatIndex, handIndex);
    if (!playable) {
      this.dealerPlay(table);
      return;
    }

    table.activeSeatId = playable.seat.id;
    table.activeHandIndex = playable.handIndex;
    table.turnDeadline = Date.now() + table.limits.turnSeconds * 1000;

    this.clearTurnTimer(table.id);
    this.turnTimers.set(table.id, setTimeout(() => {
      const liveTable = this.tables.get(table.id);
      if (!liveTable || liveTable.phase !== TABLE_PHASES.playing) return;
      const liveSeat = liveTable.seats.find((seat) => seat.id === liveTable.activeSeatId);
      const liveHand = liveSeat?.hands[liveTable.activeHandIndex];
      if (liveHand) {
        liveHand.stood = true;
        liveSeat.lastAction = 'Auto Stand';
        this.advanceTurn(liveTable);
        this.emitTable(liveTable.id);
      }
    }, table.limits.turnSeconds * 1000));
  }

  findPlayableHand(table, startSeatIndex, startHandIndex) {
    for (let seatIndex = Math.max(0, startSeatIndex); seatIndex < table.seats.length; seatIndex += 1) {
      const seat = table.seats[seatIndex];
      const firstHandIndex = seatIndex === startSeatIndex ? Math.max(0, startHandIndex) : 0;

      for (let handIndex = firstHandIndex; handIndex < seat.hands.length; handIndex += 1) {
        const hand = seat.hands[handIndex];
        if (!this.isTerminalHand(hand)) {
          return { seat, hand, handIndex };
        }
      }
    }

    return null;
  }

  advanceTurn(table) {
    const seatIndex = table.seats.findIndex((seat) => seat.id === table.activeSeatId);
    this.setTurn(table, seatIndex, table.activeHandIndex + 1);
  }

  dealerPlay(table) {
    this.clearTurnTimer(table.id);
    table.phase = TABLE_PHASES.dealer;
    table.activeSeatId = null;
    table.activeHandIndex = 0;
    table.turnDeadline = null;

    const hasLiveHand = table.seats.some((seat) => seat.hands.some((hand) => {
      const score = handScore(hand.cards);
      return !score.busted && !hand.surrendered;
    }));

    if (hasLiveHand) {
      while (handScore(table.dealer.cards).total < 17) {
        table.dealer.cards.push(this.drawCard(table));
      }
    }

    this.settleRound(table);
  }

  settleRound(table) {
    table.phase = TABLE_PHASES.settled;
    table.settleAt = Date.now() + table.limits.settleSeconds * 1000;
    const matchResult = {
      roundId: table.roundId,
      tableId: table.id,
      tableName: table.name,
      dealerCards: table.dealer.cards,
      results: [],
      createdAt: new Date().toISOString()
    };

    for (const seat of table.seats) {
      let bestResult = 'lose';
      for (const hand of seat.hands) {
        const outcome = settleHand(hand, table.dealer.cards);
        hand.result = outcome.result;
        hand.payout = Math.floor(outcome.totalPayout);
        seat.chips += hand.payout;
        updateSeatStats(seat, outcome, hand);
        matchResult.results.push({
          playerId: seat.playerId,
          username: seat.username,
          handId: hand.id,
          bet: hand.bet,
          result: outcome.result,
          payout: hand.payout,
          cards: hand.cards
        });
        bestResult = rankResult(bestResult, outcome.result);
      }

      rewardSeat(seat, bestResult);
      this.playerProfiles.set(seat.playerId, {
        ...this.playerProfiles.get(seat.playerId),
        chips: seat.chips,
        xp: seat.xp,
        level: seat.level,
        rankPoints: seat.rankPoints
      });
      upsertProfile(this.playerProfiles.get(seat.playerId)).catch(() => {});
    }

    writeMatchResult(matchResult).catch(() => {});
    this.clearSettleTimer(table.id);
    this.settleTimers.set(table.id, setTimeout(() => {
      const liveTable = this.tables.get(table.id);
      if (liveTable?.phase === TABLE_PHASES.settled) {
        this.resetForBetting(liveTable);
        this.emitTable(liveTable.id);
        this.broadcastLobby();
      }
    }, table.limits.settleSeconds * 1000));

    this.broadcastLobby();
  }

  resetForBetting(table, emit = true) {
    table.discard.push(...table.dealer.cards);
    for (const seat of table.seats) {
      table.discard.push(...seat.hands.flatMap((hand) => hand.cards));
      seat.hands = [];
      seat.pendingBet = 0;
      seat.status = seat.connected ? 'betting' : 'offline';
      seat.lastAction = null;
    }

    table.dealer = { cards: [] };
    table.roundId = null;
    table.activeSeatId = null;
    table.activeHandIndex = 0;
    table.turnDeadline = null;
    table.settleAt = null;
    table.phase = TABLE_PHASES.betting;
    table.updatedAt = Date.now();

    if (table.shoe.length < 60) {
      table.shoe = createShoe(6, secureRandom);
      table.discard = [];
    }

    if (emit) {
      this.emitTable(table.id);
      this.broadcastLobby();
    }
  }

  doubleDown(table, seat, hand) {
    if (!canDouble(hand, seat.chips)) {
      throw new Error('Double down is not available for this hand.');
    }
    seat.chips -= hand.bet;
    hand.bet *= 2;
    hand.doubled = true;
    hand.cards.push(this.drawCard(table));
    hand.stood = true;
    seat.lastAction = 'Double';
    this.advanceTurn(table);
  }

  splitHand(table, seat, hand) {
    if (!canSplit(hand, seat.chips)) {
      throw new Error('Split is not available for this hand.');
    }

    const [firstCard, secondCard] = hand.cards;
    const splitAces = firstCard.rank === 'A' && secondCard.rank === 'A';
    seat.chips -= hand.bet;

    const firstHand = createHand([firstCard, this.drawCard(table)], hand.bet, {
      id: `${hand.id}_a`,
      splitDepth: hand.splitDepth + 1,
      splitFromAces: splitAces,
      stood: splitAces
    });
    const secondHand = createHand([secondCard, this.drawCard(table)], hand.bet, {
      id: `${hand.id}_b`,
      splitDepth: hand.splitDepth + 1,
      splitFromAces: splitAces,
      stood: splitAces
    });

    seat.hands.splice(table.activeHandIndex, 1, firstHand, secondHand);
    seat.lastAction = 'Split';

    if (splitAces || this.isTerminalHand(firstHand)) {
      this.advanceTurn(table);
    }
  }

  buyInsurance(table, seat, hand) {
    if (table.dealer.cards[0]?.rank !== 'A') {
      throw new Error('Insurance is only available against a dealer ace.');
    }
    if (hand.insuranceBet > 0) {
      throw new Error('Insurance was already placed for this hand.');
    }
    const insuranceBet = Math.ceil(hand.bet / 2);
    if (seat.chips < insuranceBet) {
      throw new Error('Not enough chips for insurance.');
    }
    seat.chips -= insuranceBet;
    hand.insuranceBet = insuranceBet;
    seat.lastAction = 'Insurance';
  }

  surrender(table, seat, hand) {
    if (!canSurrender(hand)) {
      throw new Error('Surrender is not available for this hand.');
    }
    hand.surrendered = true;
    hand.stood = true;
    seat.lastAction = 'Surrender';
    this.advanceTurn(table);
  }

  drawCard(table) {
    if (table.shoe.length === 0) {
      table.shoe = createShoe(6, secureRandom);
      table.discard = [];
    }
    return table.shoe.pop();
  }

  isTerminalHand(hand) {
    const score = handScore(hand.cards);
    return hand.stood || hand.surrendered || score.busted || score.blackjack;
  }

  canStartRound(table) {
    const seated = table.seats.filter((seat) => seat.connected && seat.chips >= table.limits.minBet);
    return seated.length > 0 && seated.every((seat) => seat.pendingBet > 0);
  }

  markConnected(playerId, connected) {
    for (const table of this.tables.values()) {
      const seat = table.seats.find((candidate) => candidate.playerId === playerId);
      if (seat) {
        seat.connected = connected;
        seat.status = connected ? seat.status.replace('offline', 'betting') : 'offline';
        seat.lastSeenAt = Date.now();
        this.emitTable(table.id);
      }
    }
  }

  cleanupEmptyTable(table) {
    if (table.seats.length === 0 && table.spectators.length === 0) {
      this.clearTableTimers(table.id);
      this.tables.delete(table.id);
    }
  }

  clearTurnTimer(tableId) {
    const timer = this.turnTimers.get(tableId);
    if (timer) clearTimeout(timer);
    this.turnTimers.delete(tableId);
  }

  clearSettleTimer(tableId) {
    const timer = this.settleTimers.get(tableId);
    if (timer) clearTimeout(timer);
    this.settleTimers.delete(tableId);
  }

  clearTableTimers(tableId) {
    this.clearTurnTimer(tableId);
    this.clearSettleTimer(tableId);
  }

  requireTable(tableId) {
    const table = this.tables.get(tableId);
    if (!table) throw new Error('Table not found.');
    return table;
  }

  requireSeat(table, playerId) {
    const seat = table.seats.find((candidate) => candidate.playerId === playerId);
    if (!seat) throw new Error('You are not seated at this table.');
    return seat;
  }

  generateRoomCode() {
    let code = '';
    do {
      code = Math.random().toString(36).slice(2, 8).toUpperCase();
    } while ([...this.tables.values()].some((table) => table.code === code));
    return code;
  }
}

function createStats() {
  return {
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
    totalBlackjacks: 0,
    highestWinStreak: 0,
    currentWinStreak: 0,
    largestPotWon: 0,
    totalChipsEarned: 0,
    totalChipsLost: 0,
    averageMatchDuration: 0
  };
}

function updateSeatStats(seat, outcome, hand) {
  seat.stats.totalGames += 1;
  if (['win', 'blackjack'].includes(outcome.result)) {
    seat.stats.totalWins += 1;
    seat.stats.currentWinStreak += 1;
    seat.stats.highestWinStreak = Math.max(seat.stats.highestWinStreak, seat.stats.currentWinStreak);
    seat.stats.largestPotWon = Math.max(seat.stats.largestPotWon, outcome.totalPayout);
    seat.stats.totalChipsEarned += Math.max(0, outcome.totalPayout - hand.bet);
  } else if (outcome.result === 'push') {
    seat.stats.totalDraws += 1;
  } else {
    seat.stats.totalLosses += 1;
    seat.stats.currentWinStreak = 0;
    seat.stats.totalChipsLost += hand.bet;
  }

  if (outcome.result === 'blackjack') {
    seat.stats.totalBlackjacks += 1;
  }
}

function rewardSeat(seat, bestResult) {
  const xpGain = bestResult === 'blackjack' ? 160 : bestResult === 'win' ? 110 : bestResult === 'push' ? 50 : 30;
  const rankGain = bestResult === 'blackjack' ? 28 : bestResult === 'win' ? 18 : bestResult === 'push' ? 4 : -8;

  seat.xp += xpGain;
  seat.rankPoints = Math.max(0, seat.rankPoints + rankGain);
  seat.level = 1 + Math.floor(seat.xp / 1000);
  const rank = rankFromPoints(seat.rankPoints);
  seat.rank = rank.name;
  seat.rankColor = rank.color;
}

function rankResult(current, next) {
  const order = ['lose', 'bust', 'surrender', 'push', 'win', 'blackjack'];
  return order.indexOf(next) > order.indexOf(current) ? next : current;
}
