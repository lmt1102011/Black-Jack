import { achievementCatalog, battlePassRewards, missionTemplates, shopCatalog } from '@blackjack/shared';

export const missions = missionTemplates().map((mission, index) => ({
  ...mission,
  progress: index === 0 ? 3 : index === 1 ? 1 : 0
}));

export const achievements = achievementCatalog.map((achievement, index) => ({
  ...achievement,
  unlocked: index < 2,
  progress: Math.min(100, (index + 1) * 13)
}));

export const shopItems = shopCatalog.slice(0, 10);

export const passRewards = battlePassRewards;

export const friendRows = [
  { id: 'maya', name: 'Maya', status: 'Online', rank: 'Gold', streak: 4 },
  { id: 'kai', name: 'Kai', status: 'In Table', rank: 'Platinum', streak: 7 },
  { id: 'linh', name: 'Linh', status: 'Away', rank: 'Silver', streak: 2 }
];

export const leaderboardRows = [
  { name: 'Velvet Ace', score: 12840, blackjacks: 91 },
  { name: 'Royal Stand', score: 11920, blackjacks: 78 },
  { name: 'Neon Split', score: 10440, blackjacks: 72 },
  { name: 'Lucky Seven', score: 9380, blackjacks: 65 },
  { name: 'Golden Queen', score: 8700, blackjacks: 59 }
];
