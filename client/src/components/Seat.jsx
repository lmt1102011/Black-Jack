import clsx from 'clsx';
import { Crown, WifiOff } from 'lucide-react';
import { formatNumber, resultLabel } from '../lib/format.js';
import { PlayingCard } from './PlayingCard.jsx';

export function Seat({ seat, active, viewer }) {
  const mainHand = seat.hands?.[0];
  const hasResult = seat.hands?.some((hand) => hand.result);

  return (
    <div className={clsx(
      'min-w-0 rounded-md border p-3 transition',
      active ? 'border-brass bg-brass/15 shadow-glow' : viewer ? 'border-ruby/60 bg-ruby/10' : 'border-white/10 bg-black/[0.26]'
    )}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-black">
          {seat.username?.[0]?.toUpperCase() ?? 'P'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1">
            {active ? <Crown className="h-4 w-4 shrink-0 text-brass" /> : null}
            <p className="truncate text-sm font-bold">{seat.username}</p>
          </div>
          <p className="truncate text-xs text-white/50">{seat.rank} · {formatNumber(seat.chips)} chips</p>
        </div>
        {!seat.connected ? <WifiOff className="h-4 w-4 text-ruby" /> : null}
      </div>

      <div className="mt-3 flex min-h-24 flex-wrap gap-2">
        {seat.hands?.length ? seat.hands.map((hand, index) => (
          <div key={hand.id} className="min-w-0 rounded-md border border-white/10 bg-white/[0.045] p-2">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-white/60">Hand {index + 1}</span>
              <span className={clsx('font-black', hand.result === 'win' || hand.result === 'blackjack' ? 'text-brass' : hand.result === 'lose' || hand.result === 'bust' ? 'text-ruby' : 'text-white/70')}>
                {hand.result ? resultLabel(hand.result) : hand.score?.label}
              </span>
            </div>
            <div className="flex gap-1">
              {hand.cards.map((card) => <PlayingCard key={card.id} card={card} compact />)}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-white/55">
              <span>Bet {formatNumber(hand.bet)}</span>
              {hand.payout ? <span>+{formatNumber(hand.payout)}</span> : null}
            </div>
          </div>
        )) : (
          <div className="flex min-h-20 w-full items-center justify-center rounded-md border border-dashed border-white/10 text-xs font-semibold text-white/35">
            {seat.pendingBet ? `Ready · ${formatNumber(seat.pendingBet)}` : 'Waiting'}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-white/45">
        <span>{seat.lastAction ?? seat.status}</span>
        {hasResult && mainHand?.score ? <span>{mainHand.score.label}</span> : null}
      </div>
    </div>
  );
}
