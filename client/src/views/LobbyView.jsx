import { DoorOpen, Eye, Lock, Plus, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatNumber } from '../lib/format.js';

export function LobbyView({ lobby, connected, actions, openTable }) {
  const [code, setCode] = useState('');

  useEffect(() => {
    actions.requestLobby();
  }, [actions]);

  return (
    <div className="space-y-4">
      <section className="surface rounded-md p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-black">Sảnh bàn</h1>
            <p className="muted mt-1">Chọn bàn hoặc nhập mã riêng.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!connected} onClick={openTable} className="btn btn-primary min-h-9 px-3 text-xs">
              <DoorOpen className="h-4 w-4" />
              Vào nhanh
            </button>
            <button type="button" disabled={!connected} onClick={() => actions.createPrivate()} className="btn btn-secondary min-h-9 px-3 text-xs">
              <Plus className="h-4 w-4" />
              Bàn riêng
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-white/35" />
            <input className="input pl-9 uppercase" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="MÃ BÀN" maxLength={8} />
          </div>
          <button type="button" disabled={!code || !connected} onClick={() => actions.joinCode(code)} className="btn btn-secondary min-h-9 px-3 text-xs">
            <Lock className="h-4 w-4" />
            Vào
          </button>
          <button type="button" disabled={!code || !connected} onClick={() => actions.spectate(code)} className="btn btn-secondary min-h-9 px-3 text-xs">
            <Eye className="h-4 w-4" />
            Xem
          </button>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        {lobby.length ? lobby.map((table) => (
          <article key={table.id} className="surface-soft rounded-md p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-black">{table.name}</h2>
                  {table.type === 'private' ? <Lock className="h-4 w-4 text-brass" /> : null}
                </div>
                <p className="mt-1 text-xs uppercase text-white/45">{table.code} - {table.phase}</p>
              </div>
              <span className="badge">
                <Users className="h-3.5 w-3.5" />
                {table.players}/{table.maxPlayers}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <MiniStat label="Min" value={formatNumber(table.minBet)} />
              <MiniStat label="Max" value={formatNumber(table.maxBet)} />
              <MiniStat label="Xem" value={table.spectators} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={!connected || table.players >= table.maxPlayers} onClick={() => actions.joinTable(table.id)} className="btn btn-primary min-h-9 px-3 text-xs">
                Ngồi
              </button>
              <button type="button" disabled={!connected} onClick={() => actions.spectate(table.code)} className="btn btn-secondary min-h-9 px-3 text-xs">
                <Eye className="h-4 w-4" />
                Xem
              </button>
            </div>
          </article>
        )) : (
          <div className="surface-soft rounded-md p-6 text-center lg:col-span-2">
            <p className="text-base font-black">Chưa có bàn</p>
            <button type="button" disabled={!connected} onClick={openTable} className="btn btn-primary mt-4 min-h-9 px-3 text-xs">
              Mở bàn
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/[0.16] px-3 py-2">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-0.5 text-sm font-black">{value}</p>
    </div>
  );
}
