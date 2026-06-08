import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TABLE_PHASES,
  canSplit,
  createHand,
  handScore,
  isBlackjack,
  sanitizeTableForClient,
  settleHand
} from '../src/index.js';

const card = (rank, suit = 'spades') => ({ id: `${rank}-${suit}`, rank, suit });

test('aces count as 1 or 11', () => {
  assert.deepEqual(handScore([card('A'), card('9')]).total, 20);
  assert.equal(handScore([card('A'), card('9'), card('5')]).total, 15);
});

test('blackjack is only a two-card 21', () => {
  assert.equal(isBlackjack([card('A'), card('K')]), true);
  assert.equal(isBlackjack([card('A'), card('5'), card('5')]), false);
});

test('settles blackjack at 3:2', () => {
  const result = settleHand(createHand([card('A'), card('Q')], 100), [card('9'), card('7')]);
  assert.equal(result.result, 'blackjack');
  assert.equal(result.payout, 250);
});

test('settles push when totals tie', () => {
  const result = settleHand(createHand([card('10'), card('8')], 100), [card('K'), card('8')]);
  assert.equal(result.result, 'push');
  assert.equal(result.payout, 100);
});

test('allows splitting equal ten-value cards', () => {
  assert.equal(canSplit(createHand([card('K'), card('10')], 100), 100), true);
});

test('sanitizes private player cards per viewer during play', () => {
  const table = {
    id: 'table-1',
    roundId: 'round-1',
    phase: TABLE_PHASES.playing,
    turnDeadline: null,
    settleAt: null,
    dealer: { cards: [card('9'), card('K')] },
    seats: [
      {
        id: 'seat-1',
        playerId: 'player-1',
        hands: [createHand([card('A', 'hearts'), card('7', 'clubs')], 100)]
      },
      {
        id: 'seat-2',
        playerId: 'player-2',
        hands: [createHand([card('Q', 'diamonds'), card('3', 'clubs')], 100)]
      }
    ],
    shoe: [card('2')],
    discard: [card('4')]
  };

  const state = sanitizeTableForClient(table, 'player-1');

  assert.equal(state.shoe, undefined);
  assert.equal(state.discard, undefined);
  assert.equal(state.seats[0].isViewer, true);
  assert.equal(state.seats[0].hands[0].cards[0].rank, 'A');
  assert.equal(state.seats[0].hands[0].score.total, 18);
  assert.equal(state.seats[1].isViewer, false);
  assert.equal(state.seats[1].hands[0].cards[0].hidden, true);
  assert.equal(state.seats[1].hands[0].cards[0].rank, undefined);
  assert.equal(state.seats[1].hands[0].score, null);
});
