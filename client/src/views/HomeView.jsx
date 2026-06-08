import { BadgeDollarSign, Crown, Trophy, Users } from 'lucide-react';
import { formatNumber } from '../lib/format.js';

export function HomeView({ profile, table, lobby, onPlay, setActiveView }) {
  const viewerSeat = table?.seats?.find((seat) => seat.playerId === profile.id);
  const chips = viewerSeat?.chips ?? 25000;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <section className="table-felt flex min-h-[520px] flex-col justify-between overflow-hidden rounded-md border border-brass/30 p-6 shadow-table sm:p-8">
        <div className="max-w-2xl">
          <span className="badge border-brass/30 bg-brass/[0.12] text-brass">Online Blackjack</span>
          <h1 className="mt-5 text-4xl font-black text-ivory sm:text-6xl">AAA Blackjack</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/[0.68]">
            Simple table-first Blackjack with server-side cards, fast room matching, and clean casino visuals.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={onPlay} className="btn btn-primary">
            <Crown className="h-5 w-5" />
            Quick Match
          </button>
          <button type="button" onClick={() => setActiveView('lobby')} className="btn btn-secondary">
            <Users className="h-5 w-5" />
            Lobby
          </button>
        </div>
      </section>

      <aside className="surface rounded-md p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brass text-xl font-black text-ink">
            {profile.username?.[0]?.toUpperCase() ?? 'P'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-black">{profile.username}</p>
            <p className="text-sm text-white/55">{profile.isGuest ? 'Guest mode' : 'Firebase account'}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <MiniLine icon={BadgeDollarSign} label="Chips" value={formatNumber(chips)} />
          <MiniLine icon={Trophy} label="Rank" value={viewerSeat?.rank ?? 'Bronze'} />
          <MiniLine icon={Users} label="Live Tables" value={lobby.length} />
        </div>

        {table ? (
          <button type="button" onClick={() => setActiveView('table')} className="btn btn-primary mt-5 w-full">
            Return to Table
          </button>
        ) : null}
      </aside>
    </div>
  );
}

function MiniLine({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.055] px-3 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white/60">
        <Icon className="h-4 w-4 text-brass" />
        <span>{label}</span>
      </div>
      <span className="font-black text-ivory">{value}</span>
    </div>
  );
}
