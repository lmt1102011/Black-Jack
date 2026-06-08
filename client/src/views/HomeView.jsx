import { BadgeDollarSign, Crown, Trophy, Users } from 'lucide-react';
import { formatNumber } from '../lib/format.js';

export function HomeView({ profile, table, lobby, onPlay, setActiveView }) {
  const viewerSeat = table?.seats?.find((seat) => seat.playerId === profile.id);
  const chips = viewerSeat?.chips ?? 25000;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <section className="table-felt flex min-h-[360px] flex-col justify-between overflow-hidden rounded-md border border-brass/25 p-5 shadow-table sm:p-6">
        <div className="max-w-xl">
          <span className="badge border-brass/25 bg-brass/[0.10] text-brass">Bàn live</span>
          <h1 className="mt-4 text-3xl font-black text-ivory sm:text-5xl">Sì Lát Royale</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/[0.62]">
            Vào bàn nhanh, giữ nhịp chơi gọn và tập trung vào lá bài.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={onPlay} className="btn btn-primary min-h-9 px-3 text-xs">
            <Crown className="h-4 w-4" />
            Vào nhanh
          </button>
          <button type="button" onClick={() => setActiveView('lobby')} className="btn btn-secondary min-h-9 px-3 text-xs">
            <Users className="h-4 w-4" />
            Sảnh
          </button>
        </div>
      </section>

      <aside className="surface rounded-md p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brass text-base font-black text-ink">
            {profile.username?.[0]?.toUpperCase() ?? 'P'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-black">{profile.username}</p>
            <p className="text-xs text-white/50">{profile.isGuest ? 'Khách' : 'Tài khoản'}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-2">
          <MiniLine icon={BadgeDollarSign} label="Chips" value={formatNumber(chips)} />
          <MiniLine icon={Trophy} label="Rank" value={viewerSeat?.rank ?? 'Bronze'} />
          <MiniLine icon={Users} label="Bàn live" value={lobby.length} />
        </div>

        {table ? (
          <button type="button" onClick={() => setActiveView('table')} className="btn btn-primary mt-4 min-h-9 w-full text-xs">
            Về bàn
          </button>
        ) : null}
      </aside>
    </div>
  );
}

function MiniLine({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.045] px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-white/58">
        <Icon className="h-4 w-4 text-brass" />
        <span>{label}</span>
      </div>
      <span className="text-sm font-black text-ivory">{value}</span>
    </div>
  );
}
