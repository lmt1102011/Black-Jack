import { randomInt } from 'node:crypto';

const randomScale = 1_000_000_000;

export function secureRandom() {
  return randomInt(0, randomScale) / randomScale;
}
