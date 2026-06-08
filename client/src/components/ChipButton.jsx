import clsx from 'clsx';
import { Coins } from 'lucide-react';
import { formatShort } from '../lib/format.js';

const chipStyles = {
  100: 'from-white to-[#d5d7dc] text-ink',
  250: 'from-[#6ed6ff] to-[#187e9f] text-white',
  500: 'from-[#cf3e4f] to-[#841a27] text-white',
  1000: 'from-[#d8ad5f] to-[#8b6423] text-ink',
  2500: 'from-[#94e25e] to-[#2e8031] text-ink',
  5000: 'from-[#15171a] to-[#050607] text-white'
};

export function ChipButton({ value, selected, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(value)}
      className={clsx(
        'relative flex aspect-square min-w-16 flex-col items-center justify-center rounded-full border-4 bg-gradient-to-br p-2 text-xs font-black shadow-lg transition hover:-translate-y-0.5 disabled:opacity-40',
        chipStyles[value] ?? chipStyles[100],
        selected ? 'border-brass ring-4 ring-brass/25' : 'border-white/70'
      )}
      aria-label={`Bet ${value} chips`}
      title={`Bet ${value} chips`}
    >
      <Coins className="h-4 w-4" />
      <span>{formatShort(value)}</span>
    </button>
  );
}
