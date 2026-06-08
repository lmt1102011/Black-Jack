export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const TABLE_LIMITS = {
  minPlayers: 2,
  maxPlayers: 7,
  minBet: 100,
  maxBet: 5000,
  startingChips: 25000,
  turnSeconds: 24,
  settleSeconds: 7
};

export const CLIENT_EVENTS = {
  lobbyList: 'lobby:list',
  quickMatch: 'table:quickMatch',
  createPrivate: 'table:createPrivate',
  joinTable: 'table:join',
  leaveTable: 'table:leave',
  spectateTable: 'table:spectate',
  placeBet: 'game:bet',
  playerAction: 'game:action',
  cardPeek: 'card:peek',
  chatMessage: 'chat:message'
};

export const SERVER_EVENTS = {
  lobbyUpdate: 'lobby:update',
  tableState: 'table:state',
  cardPeek: 'card:peek',
  tableError: 'table:error',
  toast: 'ui:toast',
  chatMessage: 'chat:message'
};

export const PLAYER_ACTIONS = {
  hit: 'hit',
  stand: 'stand',
  double: 'double',
  split: 'split',
  insurance: 'insurance',
  surrender: 'surrender'
};

export const TABLE_PHASES = {
  waiting: 'waiting',
  betting: 'betting',
  playing: 'playing',
  dealer: 'dealer',
  settled: 'settled'
};

export const RANK_TIERS = [
  { name: 'Bronze', min: 0, color: '#b77945' },
  { name: 'Silver', min: 700, color: '#bac4d2' },
  { name: 'Gold', min: 1500, color: '#f4c542' },
  { name: 'Platinum', min: 2600, color: '#8fe6ff' },
  { name: 'Diamond', min: 4200, color: '#7dd3fc' },
  { name: 'Master', min: 6200, color: '#f472b6' },
  { name: 'Grandmaster', min: 9000, color: '#c084fc' },
  { name: 'Legend', min: 12500, color: '#fb7185' }
];

export const COSMETIC_CATEGORIES = [
  'Card Backs',
  'Table Themes',
  'Avatars',
  'Profile Frames',
  'Nameplates',
  'Dealer Skins',
  'Emotes'
];
