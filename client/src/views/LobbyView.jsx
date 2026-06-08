import { DoorOpen, Eye, Lock, Plus, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatNumber } from '../lib/format.js';

export function LobbyView({ lobby, connected, actions, openTable }) {
  const [code, setCode] = useState('');

  useEffect(() => {
    actions.requestLobby();
  }, [actions]);

  return (
    <div className="space-y-6">
      <section className="surface rounded-md p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-black">Casino Lobby</h1>
            <p className="muted mt-1">Public rooms, private room codes, and spectator seats.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!connected} onClick={openTable} className="btn btn-primary">
              <DoorOpen className="h-5 w-5" />
              Quick Match
            </button>
            <button type="button" disabled={!connected} onClick={() => actions.createPrivate()} className="btn btn-secondary">
              <Plus className="h-5 w-5" />
              Private Table
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-white/35" />
            <input className="input pl-10 uppercase" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="ROOM CODE" maxLength={8} />
          </div>
          <button type="button" disabled={!code || !connected} onClick={() => actions.joinCode(code)} className="btn btn-secondary">
            <Lock className="h-5 w-5" />
            Join
          </button>
          <button type="button" disabled={!code || !connected} onClick={() => actions.spectate(code)} className="btn btn-secondary">
            <Eye className="h-5 w-5" />
            Watch
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {lobby.length ? lobby.map((table) => (
          <article key={table.id} className="surface-soft rounded-md p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-lg font-black">{table.name}</h2>
                  {table.type === 'private' ? <Lock className="h-4 w-4 text-brass" /> : null}
                </div>
                <p className="mt-1 text-sm text-white/50">{table.code} · {table.phase}</p>
              </div>
              <span className="badge">
                <Users className="h-3.5 w-3.5" />
                {table.players}/{table.maxPlayers}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <MiniStat label="Min" value={formatNumber(table.minBet)} />
              <MiniStat label="Max" value={formatNumber(table.maxBet)} />
              <MiniStat label="Viewers" value={table.spectators} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" disabled={!connected || table.players >= table.maxPlayers} onClick={() => actions.joinTable(table.id)} className="btn btn-primary">
                Sit
              </button>
              <button type="button" disabled={!connected} onClick={() => actions.spectate(table.code)} className="btn btn-secondary">
                Spectate
              </button>
            </div>
          </article>
        )) : (
          <div className="surface-soft rounded-md p-8 text-center lg:col-span-2">
            <p className="text-lg font-black">No tables yet</p>
            <button type="button" disabled={!connected} onClick={openTable} className="btn btn-primary mt-4">
              Start First Table
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/[0.18] p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}
