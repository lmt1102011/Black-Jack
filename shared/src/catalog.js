import { COSMETIC_CATEGORIES, RANK_TIERS } from './constants.js';

export const achievementCatalog = [
  { id: 'first-victory', title: 'First Victory', reward: { xp: 150, chips: 500 } },
  { id: 'first-blackjack', title: 'First Blackjack', reward: { xp: 250, chips: 1000 } },
  { id: 'win-10', title: 'Win 10 Games', reward: { xp: 800, chips: 3000 } },
  { id: 'win-100', title: 'Win 100 Games', reward: { xp: 3000, chips: 15000 } },
  { id: 'blackjack-master', title: 'Blackjack Master', reward: { xp: 5000, chips: 25000 } },
  { id: 'lucky-streak', title: 'Lucky Streak', reward: { xp: 1600, chips: 7000 } },
  { id: 'casino-legend', title: 'Casino Legend', reward: { xp: 10000, chips: 75000 } }
];

export const shopCatalog = COSMETIC_CATEGORIES.flatMap((category, index) => [
  {
    id: `${category.toLowerCase().replaceAll(' ', '-')}-classic`,
    category,
    name: `Classic ${category}`,
    rarity: 'Rare',
    price: 1200 + index * 200
  },
  {
    id: `${category.toLowerCase().replaceAll(' ', '-')}-royale`,
    category,
    name: `Royale ${category}`,
    rarity: 'Epic',
    price: 3200 + index * 400
  }
]);

export const battlePassRewards = Array.from({ length: 20 }, (_, index) => ({
  tier: index + 1,
  free: index % 2 === 0 ? { chips: 500 + index * 100 } : { xp: 250 + index * 60 },
  premium: index % 3 === 0
    ? { cosmetic: shopCatalog[index % shopCatalog.length].id }
    : { coins: 100 + index * 25 }
}));

export function rankFromPoints(points) {
  return [...RANK_TIERS].reverse().find((tier) => points >= tier.min) ?? RANK_TIERS[0];
}
