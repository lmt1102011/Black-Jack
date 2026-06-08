import { TABLE_LIMITS } from '@blackjack/shared';
import { verifyFirebaseToken } from '../firebase/admin.js';

const guestNames = [
  'Velvet Ace',
  'Neon Split',
  'Lucky Seven',
  'Golden Queen',
  'Royal Stand',
  'Midnight Chip'
];

export async function resolveSocketPlayer(socket) {
  const token = socket.handshake.auth?.token;
  const guestName = socket.handshake.auth?.guestName;
  const decoded = await verifyFirebaseToken(token);

  if (decoded) {
    return {
      id: decoded.uid,
      username: decoded.name || decoded.email?.split('@')[0] || 'Casino Player',
      avatar: decoded.picture || '',
      emailVerified: decoded.email_verified ?? false,
      chips: TABLE_LIMITS.startingChips,
      coins: 1200,
      premiumTokens: 25,
      level: 1,
      xp: 0,
      rankPoints: 0,
      isGuest: false
    };
  }

  const fallbackName = guestName?.trim().slice(0, 24)
    || guestNames[Math.floor(Math.random() * guestNames.length)];

  return {
    id: socket.handshake.auth?.guestId || `guest_${socket.id}`,
    username: fallbackName,
    avatar: '',
    emailVerified: false,
    chips: TABLE_LIMITS.startingChips,
    coins: 1200,
    premiumTokens: 0,
    level: 1,
    xp: 0,
    rankPoints: 0,
    isGuest: true
  };
}
