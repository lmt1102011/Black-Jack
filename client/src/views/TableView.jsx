import clsx from 'clsx';
import { DoorOpen, MessageCircle, Send, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PLAYER_ACTIONS, TABLE_PHASES } from '@blackjack/shared';
import { ChipButton } from '../components/ChipButton.jsx';
import { PlayingCard } from '../components/PlayingCard.jsx';
import { Seat } from '../components/Seat.jsx';
import { assets } from '../lib/assets.js';
import { formatNumber } from '../lib/format.js';

const chipValues = [100, 250, 500, 1000, 2500, 5000];

export function TableView({ table, profile, connected, actions, goLobby }) {
  const [bet, setBet] = useState(100);
  const [chatText, setChatText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const viewerSeat = useMemo(() => table?.seats?.find((seat) => seat.playerId === profile.id), [profile.id, table]);
  const activeSeat = useMemo(() => table?.seats?.find((seat) => seat.id === table.activeSeatId), [table]);
  const myTurn = Boolean(viewerSeat && activeSeat?.id === viewerSeat.id && table?.phase === TABLE_PHASES.playing);
  const timerSeconds = table?.timers?.turnDeadline ? Math.max(0, Math.ceil((table.timers.turnDeadline - now) / 1000)) : 0;
  const canBet = Boolean(viewerSeat && [TABLE_PHASES.betting, TABLE_PHASES.waiting, TABLE_PHASES.settled].includes(table?.phase));
  const activeHand = myTurn ? viewerSeat.hands?.[table.activeHandIndex] : null;
  const canUseAction = Boolean(activeHand && myTurn);
  const dealerUpcardAce = table?.dealer?.cards?.[0]?.rank === 'A';
  const openSeats = table ? Math.max(0, table.limits.maxPlayers - table.seats.length) : 0;

  function sendChat(event) {
    event.preventDefault();
    if (!chatText.trim() || !table) return;
    actions.sendChat(table.id, chatText);
    setChatText('');
  }

  if (!table) {
    return (
      <section className="table-felt flex min-h-[620px] flex-col items-center justify-center rounded-md border border-brass/25 p-6 text-center shadow-table">
        <img src={assets.dealerBadge} alt="" className="h-24 w-24" />
        <h1 className="mt-6 text-3xl font-black sm:text-5xl">Take a Seat</h1>
        <p className="mt-3 max-w-xl text-white/[0.62]">Join a table and start playing in guest mode or with Firebase login.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" disabled={!connected} onClick={actions.quickMatch} className="btn btn-primary">
            <DoorOpen className="h-5 w-5" />
            Quick Match
          </button>
          <button type="button" onClick={goLobby} className="btn btn-secondary">
            Lobby
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className={clsx('grid gap-5', showChat && 'xl:grid-cols-[minmax(0,1fr)_320px]')}>
      <section className="table-felt min-h-[680px] overflow-hidden rounded-md border border-brass/25 p-4 shadow-table sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black">{table.name}</h1>
              <span className="badge">{table.code}</span>
              <span className="badge capitalize">{table.phase}</span>
            </div>
            <p className="mt-1 text-sm text-white/55">
              {table.seats.length}/{table.limits.maxPlayers} seats - {formatNumber(table.limits.minBet)} to {formatNumber(table.limits.maxBet)} chips
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <HudPill label="Chips" value={formatNumber(viewerSeat?.chips ?? 0)} />
            <HudPill label="Rank" value={viewerSeat?.rank ?? 'Spectator'} />
            {timerSeconds ? <HudPill label="Turn" value={`${timerSeconds}s`} tone="gold" /> : null}
            <button type="button" onClick={() => setShowChat((value) => !value)} className={showChat ? 'btn btn-primary min-h-10 px-3' : 'btn btn-secondary min-h-10 px-3'}>
              <MessageCircle className="h-4 w-4" />
              Chat
            </button>
            <button type="button" onClick={() => actions.leaveTable(table.id)} className="icon-btn" aria-label="Leave table" title="Leave table">
              <Undo2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-md border border-white/10 bg-black/20 p-4">
          <DealerArea cards={table.dealer.cards} score={table.dealer.score} />
        </div>

        <div className="mt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="section-title">Players</h2>
            <span className="text-sm font-semibold text-white/45">{openSeats} open seats</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {table.seats.map((seat) => (
              <Seat
                key={seat.id}
                seat={seat}
                active={seat.id === table.activeSeatId}
                viewer={seat.playerId === profile.id}
              />
            ))}
          </div>
        </div>

        <div className="mt-5">
          {canBet ? (
            <BettingPanel bet={bet} setBet={setBet} viewerSeat={viewerSeat} connected={connected} table={table} actions={actions} />
          ) : (
            <ActionPanel
              activeSeat={activeSeat}
              canUseAction={canUseAction}
              dealerUpcardAce={dealerUpcardAce}
              myTurn={myTurn}
              tableId={table.id}
              actions={actions}
              viewerSeat={viewerSeat}
            />
          )}
        </div>
      </section>

      {showChat ? (
        <ChatPanel
          table={table}
          profile={profile}
          chatText={chatText}
          setChatText={setChatText}
          sendChat={sendChat}
        />
      ) : null}
    </div>
  );
}

function DealerArea({ cards, score }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <img src={assets.dealerBadge} alt="" className="h-14 w-14" />
        <div>
          <p className="text-lg font-black">Dealer</p>
          <p className="text-sm text-white/55">{score?.label ?? 'Hole card hidden'}</p>
        </div>
      </div>
      <div className="flex min-h-32 flex-wrap gap-2">
        {cards?.length ? cards.map((card) => <PlayingCard key={card.id} card={card} />) : (
          <div className="flex h-32 w-24 items-center justify-center rounded-md border border-dashed border-white/10 text-xs font-semibold text-white/[0.32]">
            Deck
          </div>
        )}
      </div>
    </div>
  );
}

function BettingPanel({ bet, setBet, viewerSeat, connected, table, actions }) {
  return (
    <div className="surface-soft rounded-md p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="section-title">Place Bet</h2>
          <p className="mt-1 text-sm text-white/50">Selected {formatNumber(bet)} chips</p>
        </div>
        <button type="button" disabled={!connected || !viewerSeat || viewerSeat.chips < bet} onClick={() => actions.placeBet(table.id, bet)} className="btn btn-primary">
          Deal
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {chipValues.map((value) => (
          <ChipButton key={value} value={value} selected={bet === value} disabled={viewerSeat?.chips < value} onClick={setBet} />
        ))}
      </div>
    </div>
  );
}

function ActionPanel({ activeSeat, canUseAction, dealerUpcardAce, myTurn, tableId, actions, viewerSeat }) {
  const title = !viewerSeat ? 'Spectating' : myTurn ? 'Your Turn' : activeSeat ? `${activeSeat.username}'s Turn` : 'Round';

  return (
    <div className="surface-soft rounded-md p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="mt-1 text-sm text-white/50">{myTurn ? 'Choose an action.' : 'Waiting for the table.'}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <ActionButton disabled={!canUseAction} label="Hit" action={PLAYER_ACTIONS.hit} actions={actions} tableId={tableId} />
        <ActionButton disabled={!canUseAction} label="Stand" action={PLAYER_ACTIONS.stand} actions={actions} tableId={tableId} />
        <ActionButton disabled={!canUseAction} label="Double" action={PLAYER_ACTIONS.double} actions={actions} tableId={tableId} />
        <ActionButton disabled={!canUseAction} label="Split" action={PLAYER_ACTIONS.split} actions={actions} tableId={tableId} />
        <ActionButton disabled={!canUseAction || !dealerUpcardAce} label="Insurance" action={PLAYER_ACTIONS.insurance} actions={actions} tableId={tableId} />
        <ActionButton disabled={!canUseAction} label="Surrender" action={PLAYER_ACTIONS.surrender} actions={actions} tableId={tableId} danger />
      </div>
    </div>
  );
}

function ChatPanel({ table, profile, chatText, setChatText, sendChat }) {
  return (
    <aside className="surface rounded-md p-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-brass" />
        <h2 className="section-title">Table Chat</h2>
      </div>
      <div className="scrollbar-thin mt-4 flex max-h-[560px] min-h-72 flex-col gap-3 overflow-y-auto pr-1">
        {table.chat?.length ? table.chat.map((message) => (
          <div key={message.id} className={clsx('rounded-md border p-3', message.playerId === profile.id ? 'border-brass/35 bg-brass/10' : 'border-white/10 bg-white/[0.045]')}>
            <p className="text-xs font-bold text-brass">{message.username}</p>
            <p className="mt-1 text-sm text-white/[0.78]">{message.text}</p>
          </div>
        )) : (
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-white/10 text-sm text-white/35">No messages</div>
        )}
      </div>
      <form onSubmit={sendChat} className="mt-4 flex gap-2">
        <input className="input" value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Message" maxLength={280} />
        <button type="submit" className="icon-btn h-11 w-11" aria-label="Send chat">
          <Send className="h-5 w-5" />
        </button>
      </form>
    </aside>
  );
}

function HudPill({ label, value, tone = 'default' }) {
  return (
    <div className={clsx(
      'rounded-md border px-3 py-2 text-right',
      tone === 'gold' ? 'border-brass/40 bg-brass/[0.12]' : 'border-white/10 bg-black/20'
    )}
    >
      <p className="text-[11px] font-semibold uppercase text-white/45">{label}</p>
      <p className="text-sm font-black text-ivory">{value}</p>
    </div>
  );
}

function ActionButton({ label, action, actions, tableId, disabled, danger }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => actions.playerAction(tableId, action)}
      className={danger ? 'btn btn-danger w-full' : 'btn btn-secondary w-full'}
    >
      {label}
    </button>
  );
}
