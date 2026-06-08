import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canSplit,
  createHand,
  handScore,
  isBlackjack,
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
