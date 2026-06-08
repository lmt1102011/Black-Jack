import { RANKS, SUITS } from './constants.js';

export function createShoe(deckCount = 6, rng = Math.random) {
  const cards = [];
  let sequence = 0;

  for (let deck = 0; deck < deckCount; deck += 1) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({
          id: `${deck}-${suit}-${rank}-${sequence}`,
          deck,
          suit,
          rank
        });
        sequence += 1;
      }
    }
  }

  return shuffle(cards, rng);
}

export function shuffle(cards, rng = Math.random) {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function rankValue(rank) {
  if (rank === 'A') return 11;
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  return Number(rank);
}

export function splitValue(card) {
  return Math.min(rankValue(card.rank), 10);
}

export function handScore(cards) {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === 'A') {
      aces += 1;
      total += 11;
    } else {
      total += rankValue(card.rank);
    }
  }

  let softAces = aces;
  while (total > 21 && softAces > 0) {
    total -= 10;
    softAces -= 1;
  }

  return {
    total,
    soft: softAces > 0,
    busted: total > 21,
    blackjack: cards.length === 2 && total === 21,
    label: total > 21 ? 'Bust' : `${total}${softAces > 0 ? ' soft' : ''}`
  };
}

export function isBlackjack(cards) {
  return handScore(cards).blackjack;
}

export function canDouble(hand, chips = 0) {
  return hand.cards.length === 2
    && !hand.stood
    && !hand.surrendered
    && !hand.doubled
    && chips >= hand.bet;
}

export function canSplit(hand, chips = 0, maxHands = 4) {
  return hand.cards.length === 2
    && !hand.stood
    && !hand.surrendered
    && hand.splitDepth < maxHands - 1
    && splitValue(hand.cards[0]) === splitValue(hand.cards[1])
    && chips >= hand.bet;
}

export function canSurrender(hand) {
  return hand.cards.length === 2 && !hand.stood && !hand.doubled && !hand.splitFromAces;
}

export function createHand(cards = [], bet = 0, extra = {}) {
  return {
    id: extra.id ?? cryptoSafeId('hand'),
    cards,
    bet,
    insuranceBet: 0,
    doubled: false,
    stood: false,
    surrendered: false,
    splitDepth: 0,
    splitFromAces: false,
    result: null,
    payout: 0,
    ...extra
  };
}

export function settleHand(hand, dealerCards) {
  const playerScore = handScore(hand.cards);
  const dealerScore = handScore(dealerCards);
  const dealerBlackjack = isBlackjack(dealerCards);
  const playerBlackjack = isBlackjack(hand.cards) && hand.splitDepth === 0;
  let result = 'lose';
  let payout = 0;

  if (hand.surrendered) {
    result = 'surrender';
    payout = hand.bet / 2;
  } else if (playerScore.busted) {
    result = 'bust';
  } else if (playerBlackjack && dealerBlackjack) {
    result = 'push';
    payout = hand.bet;
  } else if (playerBlackjack) {
    result = 'blackjack';
    payout = hand.bet * 2.5;
  } else if (dealerBlackjack) {
    result = 'lose';
  } else if (dealerScore.busted) {
    result = 'win';
    payout = hand.bet * 2;
  } else if (playerScore.total > dealerScore.total) {
    result = 'win';
    payout = hand.bet * 2;
  } else if (playerScore.total === dealerScore.total) {
    result = 'push';
    payout = hand.bet;
  }

  let insurancePayout = 0;
  if (hand.insuranceBet > 0 && dealerBlackjack) {
    insurancePayout = hand.insuranceBet * 3;
  }

  return {
    result,
    payout,
    insurancePayout,
    totalPayout: payout + insurancePayout,
    playerScore,
    dealerScore
  };
}

export function sanitizeTableForClient(table, viewerId = null) {
  const revealDealer = ['dealer', 'settled'].includes(table.phase);

  return {
    ...table,
    shoe: undefined,
    discard: undefined,
    timers: {
      turnDeadline: table.turnDeadline ?? null,
      settleAt: table.settleAt ?? null
    },
    dealer: {
      ...table.dealer,
      cards: table.dealer.cards.map((card, index) => (
        revealDealer || index === 0
          ? card
          : { id: `hidden-${table.roundId ?? 'waiting'}`, hidden: true }
      )),
      score: revealDealer ? handScore(table.dealer.cards) : null
    },
    seats: table.seats.map((seat) => ({
      ...seat,
      isViewer: seat.playerId === viewerId,
      hands: seat.hands.map((hand) => ({
        ...hand,
        score: handScore(hand.cards)
      }))
    }))
  };
}

export function missionTemplates(now = new Date()) {
  const daySeed = now.toISOString().slice(0, 10);
  return [
    {
      id: `play-5-${daySeed}`,
      title: 'Play 5 Matches',
      target: 5,
      reward: { xp: 250, chips: 1200 }
    },
    {
      id: `win-3-${daySeed}`,
      title: 'Win 3 Matches',
      target: 3,
      reward: { xp: 350, chips: 1800 }
    },
    {
      id: `blackjack-2-${daySeed}`,
      title: 'Get 2 Blackjacks',
      target: 2,
      reward: { xp: 500, chips: 2500 }
    }
  ];
}

function cryptoSafeId(prefix) {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${randomPart}`;
}
