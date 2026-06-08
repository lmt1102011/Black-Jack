export function formatNumber(value = 0) {
  return new Intl.NumberFormat('en-US').format(Math.floor(value));
}

export function formatShort(value = 0) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
}

export function resultLabel(result) {
  const labels = {
    win: 'Win',
    lose: 'Lose',
    push: 'Push',
    blackjack: 'Blackjack',
    bust: 'Bust',
    surrender: 'Surrender'
  };
  return labels[result] ?? 'Playing';
}

export function suitSymbol(suit) {
  return {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  }[suit] ?? '♠';
}
