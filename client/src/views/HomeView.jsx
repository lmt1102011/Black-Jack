import { motion } from 'framer-motion';
import { BadgeDollarSign, Crown, Gift, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react';
import { StatPill } from '../components/StatPill.jsx';
import { formatNumber } from '../lib/format.js';

export function HomeView({ profile, table, lobby, onPlay, setActiveView }) {
  const viewerSeat = table?.seats?.find((seat) => seat.playerId === profile.id);
  const chips = viewerSeat?.chips ?? 25000;

  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[1.45fr_.55fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="table-felt min-h-[420px] overflow-hidden rounded-md border border-brass/30 p-6 shadow-table sm:p-8"
        >
          <div className="flex h-full max-w-2xl flex-col justify-between">
            <div>
              <span className="badge border-brass/30 bg-brass/[0.12] text-brass">Season Royale</span>
              <h1 className="mt-5 text-4xl font-black text-ivory sm:text-6xl">AAA Blackjack</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/[0.68]">
                Multiplayer tables, ranked chips, social rooms, and the full Blackjack action set.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={onPlay} className="btn btn-primary">
                <Crown className="h-5 w-5" />
                Quick Match
              </button>
              <button type="button" onClick={() => setActiveView('lobby')} className="btn btn-secondary">
                <Users className="h-5 w-5" />
                Browse Tables
              </button>
            </div>
          </div>
        </motion.div>

        <aside className="surface rounded-md p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brass text-xl font-black text-ink">
              {profile.username?.[0]?.toUpperCase() ?? 'P'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-black">{profile.username}</p>
              <p className="text-sm text-white/55">{profile.isGuest ? 'Guest account' : 'Verified player'}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <StatPill icon={BadgeDollarSign} label="Chips" value={formatNumber(chips)} />
            <StatPill icon={Trophy} label="Rank" value={viewerSeat?.rank ?? 'Bronze'} />
            <StatPill icon={Sparkles} label="Level" value={viewerSeat?.level ?? 1} />
          </div>
        </aside>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatPill icon={Users} label="Live Tables" value={lobby.length} />
        <StatPill icon={ShieldCheck} label="Authority" value="Server" />
        <StatPill icon={Gift} label="Daily Missions" value="3" />
        <StatPill icon={Trophy} label="Season" value="Legend Path" />
      </section>
    </div>
  );
}
