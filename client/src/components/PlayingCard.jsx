import clsx from 'clsx';
import { assets } from '../lib/assets.js';
import { suitSymbol } from '../lib/format.js';

export function PlayingCard({ card, compact = false }) {
  const hidden = !card || card.hidden;
  const red = card?.suit === 'hearts' || card?.suit === 'diamonds';

  return (
    <div
      style={hidden ? { backgroundImage: `url("${assets.cardBack}")` } : undefined}
      className={clsx(
        'card-enter relative shrink-0 overflow-hidden rounded-md border shadow-lg',
        compact ? 'h-20 w-14 sm:h-24 sm:w-16' : 'h-24 w-16 sm:h-32 sm:w-24',
        hidden
          ? 'border-brass/60 bg-cover bg-center'
          : 'border-black/10 bg-ivory'
      )}
    >
      {!hidden ? (
        <div className={clsx('flex h-full flex-col justify-between p-2 font-bold', red ? 'card-red' : 'card-black')}>
          <div className="leading-none">
            <div className={compact ? 'text-base' : 'text-lg sm:text-xl'}>{card.rank}</div>
            <div className={compact ? 'text-sm' : 'text-base sm:text-lg'}>{suitSymbol(card.suit)}</div>
          </div>
          <div className={clsx('self-center leading-none', compact ? 'text-2xl' : 'text-4xl sm:text-5xl')}>
            {suitSymbol(card.suit)}
          </div>
          <div className="rotate-180 self-end leading-none">
            <div className={compact ? 'text-base' : 'text-lg sm:text-xl'}>{card.rank}</div>
            <div className={compact ? 'text-sm' : 'text-base sm:text-lg'}>{suitSymbol(card.suit)}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
