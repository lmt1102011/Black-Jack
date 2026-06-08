const baseUrl = import.meta.env.BASE_URL || '/';

export function assetUrl(path) {
  return `${baseUrl}${path.replace(/^\/+/, '')}`;
}

export const assets = {
  cardBack: assetUrl('assets/card-back.svg'),
  chip: assetUrl('assets/chip.svg'),
  dealerBadge: assetUrl('assets/dealer-badge.svg'),
  tableFelt: assetUrl('assets/table-felt.svg')
};
