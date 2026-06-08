import { z } from 'zod';
import { PLAYER_ACTIONS, TABLE_LIMITS } from '@blackjack/shared';

export const betSchema = z.object({
  tableId: z.string().min(8),
  amount: z.number().int().min(TABLE_LIMITS.minBet).max(TABLE_LIMITS.maxBet)
});

export const roomCodeSchema = z.object({
  code: z.string().trim().min(4).max(8)
});

export const joinTableSchema = z.object({
  tableId: z.string().min(8)
});

export const playerActionSchema = z.object({
  tableId: z.string().min(8),
  action: z.enum(Object.values(PLAYER_ACTIONS))
});

export const cardPeekSchema = z.object({
  tableId: z.string().min(8),
  handId: z.string().min(3),
  cardIndex: z.number().int().min(0).max(10),
  active: z.boolean()
});

export const chatSchema = z.object({
  tableId: z.string().min(8),
  text: z.string().trim().min(1).max(280)
});

export function parsePayload(schema, payload) {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(issue?.message ?? 'Invalid payload');
  }
  return parsed.data;
}
