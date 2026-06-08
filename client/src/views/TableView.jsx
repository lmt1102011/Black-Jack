import clsx from 'clsx';
import { DoorOpen, MessageCircle, Send, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PLAYER_ACTIONS, TABLE_PHASES } from '@blackjack/shared';
import { ChipButton } from '../components/ChipButton.jsx';
import { PlayingCard } from '../components/PlayingCard.jsx';
import { assets } from '../lib/assets.js';
import { formatNumber } from '../lib/format.js';

const chipValues = [100, 250, 500, 1000, 2500, 5000];

export function TableView({ table, profile, connected, actions, goLobby }) {
  const [bet, setBet] = useState(100);
  const [chatText, setChatText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [revealedCards, setRevealedCards] = useState(() => new Set());
  const [dealtCards, setDealtCards] = useState(() => new Set());
  const previousOwnCardsRef = useRef(new Set());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const viewerSeat = useMemo(() => table?.seats?.find((seat) => seat.playerId === profile.id), [profile.id, table]);
  const otherSeats = useMemo(() => table?.seats?.filter((seat) => seat.playerId !== profile.id) ?? [], [profile.id, table]);
  const activeSeat = useMemo(() => table?.seats?.find((seat) => seat.id === table.activeSeatId), [table]);
  const myTurn = Boolean(viewerSeat && activeSeat?.id === viewerSeat.id && table?.phase === TABLE_PHASES.playing);
  const timerSeconds = table?.timers?.turnDeadline ? Math.max(0, Math.ceil((table.timers.turnDeadline - now) / 1000)) : 0;
  const canBet = Boolean(viewerSeat && [TABLE_PHASES.betting, TABLE_PHASES.waiting, TABLE_PHASES.settled].includes(table?.phase));
  const activeHand = myTurn ? viewerSeat.hands?.[table.activeHandIndex] : null;
  const canUseAction = Boolean(activeHand && myTurn);
  const dealerUpcardAce = table?.dealer?.cards?.[0]?.rank === 'A';
  const roundKey = `${table?.id ?? 'none'}:${table?.roundId ?? 'waiting'}`;
  const ownCardIds = useMemo(() => (
    viewerSeat?.hands?.flatMap((hand) => hand.cards.map((card) => card.id)) ?? []
  ), [viewerSeat]);
  const ownCardSignature = ownCardIds.join('|');

  useEffect(() => {
    setRevealedCards(new Set());
    setDealtCards(new Set());
    previousOwnCardsRef.current = new Set();
  }, [roundKey]);

  useEffect(() => {
    const previous = previousOwnCardsRef.current;
    const added = ownCardIds.filter((id) => !previous.has(id));

    if (added.length) {
      setDealtCards((current) => {
        const next = new Set(current);
        for (const id of added) next.add(id);
        return next;
      });

      window.setTimeout(() => {
        setDealtCards((current) => {
          const next = new Set(current);
          for (const id of added) next.delete(id);
          return next;
        });
      }, 700);
    }

    previousOwnCardsRef.current = new Set(ownCardIds);
  }, [ownCardSignature, ownCardIds]);

  function revealCard(cardId) {
    setRevealedCards((current) => {
      const next = new Set(current);
      next.add(cardId);
      return next;
    });
  }

  function sendChat(event) {
    event.preventDefault();
    if (!chatText.trim() || !table) return;
    actions.sendChat(table.id, chatText);
    setChatText('');
  }

  if (!table) {
    return (
      <section className="table-felt flex h-[calc(100vh-1rem)] min-h-[560px] flex-col items-center justify-center rounded-md border border-brass/25 p-6 text-center shadow-table">
        <img src={assets.dealerBadge} alt="" className="h-24 w-24" />
        <h1 className="mt-6 text-3xl font-black sm:text-5xl">Vào bàn</h1>
        <p className="mt-3 max-w-xl text-white/[0.62]">Chọn bàn hoặc vào nhanh để chơi.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" disabled={!connected} onClick={actions.quickMatch} className="btn btn-primary">
            <DoorOpen className="h-5 w-5" />
            Vào nhanh
          </button>
          <button type="button" onClick={goLobby} className="btn btn-secondary">
            Lobby
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="table-felt relative h-[calc(100vh-1rem)] min-h-[560px] overflow-hidden rounded-md border border-brass/25 p-3 shadow-table sm:p-4">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
        <TableTopBar
          activeSeat={activeSeat}
          myTurn={myTurn}
          openSeats={Math.max(0, table.limits.maxPlayers - table.seats.length)}
          setShowChat={setShowChat}
          showChat={showChat}
          table={table}
          timerSeconds={timerSeconds}
          viewerSeat={viewerSeat}
          onLeave={() => actions.leaveTable(table.id)}
        />

        <div className="felt-rail min-h-0 rounded-md p-3">
          <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
              <DealerArea cards={table.dealer.cards} score={table.dealer.score} />
              <DeckButton disabled={!canUseAction} onDraw={() => actions.playerAction(table.id, PLAYER_ACTIONS.hit)} />
              <RoundStatus activeSeat={activeSeat} myTurn={myTurn} table={table} />
            </div>

            <div className="min-h-0">
              <div className="grid h-full grid-cols-2 gap-2 overflow-hidden md:grid-cols-3 xl:grid-cols-6">
                {otherSeats.length ? otherSeats.map((seat) => (
                  <PlayerSpot
                    key={seat.id}
                    active={seat.id === table.activeSeatId}
                    dealtCards={dealtCards}
                    revealCard={revealCard}
                    revealedCards={revealedCards}
                    seat={seat}
                    tablePhase={table.phase}
                    viewer={false}
                  />
                )) : (
                  <div className="col-span-full flex items-center justify-center rounded-md border border-dashed border-white/10 bg-black/20 text-sm font-semibold text-white/40">
                    Đang chờ người chơi khác
                  </div>
                )}
              </div>
            </div>

            <div className="min-h-0">
              {viewerSeat ? (
                <PlayerSpot
                  active={viewerSeat.id === table.activeSeatId}
                  dealtCards={dealtCards}
                  revealCard={revealCard}
                  revealedCards={revealedCards}
                  seat={viewerSeat}
                  tablePhase={table.phase}
                  viewer
                  large
                />
              ) : (
                <div className="rounded-md border border-dashed border-white/10 bg-black/20 p-4 text-center text-sm font-semibold text-white/[0.42]">
                  Bạn đang xem bàn này.
                </div>
              )}
            </div>
          </div>
        </div>

        {canBet ? (
          <BettingPanel bet={bet} setBet={setBet} viewerSeat={viewerSeat} connected={connected} table={table} actions={actions} />
        ) : (
          <ActionDock
            canUseAction={canUseAction}
            dealerUpcardAce={dealerUpcardAce}
            myTurn={myTurn}
            tableId={table.id}
            actions={actions}
            viewerSeat={viewerSeat}
          />
        )}
      </div>

      {showChat ? (
        <ChatPanel
          table={table}
          profile={profile}
          chatText={chatText}
          setChatText={setChatText}
          sendChat={sendChat}
        />
      ) : null}
    </section>
  );
}

function TableTopBar({ activeSeat, myTurn, openSeats, setShowChat, showChat, table, timerSeconds, viewerSeat, onLeave }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="truncate text-lg font-black sm:text-xl">{table.name}</h1>
          <span className="badge">{table.code}</span>
          <span className="badge capitalize">{table.phase}</span>
          {timerSeconds ? <span className="badge border-brass/40 bg-brass/[0.12] text-brass">{timerSeconds}s</span> : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-white/50">
          {myTurn ? 'Lượt của bạn' : activeSeat ? `Lượt ${activeSeat.username}` : `${openSeats} ghế trống`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <HudPill label="Chips" value={formatNumber(viewerSeat?.chips ?? 0)} />
        <HudPill label="Rank" value={viewerSeat?.rank ?? 'View'} />
        <button type="button" onClick={() => setShowChat((value) => !value)} className={showChat ? 'icon-btn bg-brass text-ink' : 'icon-btn'} aria-label="Chat" title="Chat">
          <MessageCircle className="h-4 w-4" />
        </button>
        <button type="button" onClick={onLeave} className="icon-btn" aria-label="Leave table" title="Leave table">
          <Undo2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DealerArea({ cards, score }) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-black/20 p-3">
      <div className="mb-2 flex items-center gap-2">
        <img src={assets.dealerBadge} alt="" className="h-9 w-9" />
        <div className="min-w-0">
          <p className="truncate text-sm font-black">Nhà cái</p>
          <p className="truncate text-xs text-white/50">{score?.label ?? 'Một lá đang úp'}</p>
        </div>
      </div>
      <div className="flex min-h-[116px] items-center gap-2">
        {cards?.length ? cards.map((card) => (
          <PlayingCard key={card.id} card={card} compact={cards.length > 2} />
        )) : (
          <div className="text-xs font-semibold text-white/35">Chưa chia bài</div>
        )}
      </div>
    </div>
  );
}

function DeckButton({ disabled, onDraw }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onDraw}
      className="deck-button mt-5"
      style={{ backgroundImage: `url("${assets.cardBack}")` }}
      aria-label="Rút bài"
      title="Rút bài"
    >
      <span className="rounded-full bg-ink/75 px-3 py-1 text-xs font-black uppercase text-brass">Rút</span>
    </button>
  );
}

function RoundStatus({ activeSeat, myTurn, table }) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-black/20 p-3 text-right">
      <p className="text-xs font-semibold uppercase text-white/[0.42]">Sì lát mode</p>
      <p className="mt-1 truncate text-sm font-black text-ivory">{myTurn ? 'Bạn quyết định' : activeSeat?.username ?? 'Đang chờ'}</p>
      <p className="mt-1 text-xs text-white/45">{table.seats.length}/{table.limits.maxPlayers} người</p>
    </div>
  );
}

function PlayerSpot({ active, dealtCards, large = false, revealCard, revealedCards, seat, tablePhase, viewer }) {
  const revealAll = tablePhase === TABLE_PHASES.dealer || tablePhase === TABLE_PHASES.settled || seat.hands?.some((hand) => hand.result);
  const visibleHands = seat.hands ?? [];

  return (
    <div className={clsx(
      'min-w-0 rounded-md border transition',
      large ? 'bg-black/30 p-3' : 'bg-black/[0.24] p-2',
      active ? 'border-brass shadow-glow' : viewer ? 'border-ruby/55' : 'border-white/10'
    )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={clsx('truncate font-black', large ? 'text-base' : 'text-sm')}>{viewer ? 'Bạn' : seat.username}</p>
          <p className="truncate text-xs text-white/45">{seat.rank} - {formatNumber(seat.chips)} chips</p>
        </div>
        {active ? <span className="rounded-full bg-brass px-2 py-1 text-[10px] font-black uppercase text-ink">Lượt</span> : null}
      </div>

      {visibleHands.length ? (
        <div className={clsx('grid gap-2', large && visibleHands.length > 1 && 'sm:grid-cols-2')}>
          {visibleHands.map((hand, handIndex) => {
            const revealedCount = hand.cards.filter((card) => revealAll || revealedCards.has(card.id)).length;
            const allCardsVisible = revealedCount === hand.cards.length;
            const shouldShowScore = revealAll || (viewer && allCardsVisible);
            return (
              <div key={hand.id} className="rounded-md border border-white/10 bg-white/[0.045] p-2">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-white/[0.52]">{large ? `Tay ${handIndex + 1}` : `T${handIndex + 1}`}</span>
                  <span className={clsx('font-black', hand.result ? resultTone(hand.result) : 'text-white/65')}>
                    {hand.result ? resultText(hand.result) : shouldShowScore ? slatScoreLabel(hand) : revealedCount ? `${revealedCount} lá mở` : 'Úp bài'}
                  </span>
                </div>
                <div className={clsx('flex min-h-[82px] items-center', large ? 'gap-2' : 'gap-1')}>
                  {hand.cards.map((card) => {
                    const faceDown = !(revealAll || (viewer && revealedCards.has(card.id)));
                    return (
                      <PlayingCard
                        key={card.id}
                        card={card}
                        compact={!large}
                        dealt={viewer && dealtCards.has(card.id)}
                        faceDown={faceDown}
                        interactive={viewer && faceDown && !revealAll}
                        onReveal={revealCard}
                        peekLabel="Lật"
                      />
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-white/[0.48]">
                  <span>Cược {formatNumber(hand.bet)}</span>
                  {viewer && !revealAll ? <span>{revealedCount}/{hand.cards.length} lật</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={clsx('flex items-center justify-center rounded-md border border-dashed border-white/10 text-xs font-semibold text-white/35', large ? 'min-h-28' : 'min-h-20')}>
          {seat.pendingBet ? `Sẵn sàng - ${formatNumber(seat.pendingBet)}` : 'Đang chờ'}
        </div>
      )}
    </div>
  );
}

function BettingPanel({ bet, setBet, viewerSeat, connected, table, actions }) {
  return (
    <div className="rounded-md border border-white/10 bg-ink/80 p-3 backdrop-blur-xl">
      <div className="grid items-center gap-3 md:grid-cols-[1fr_auto]">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {chipValues.map((value) => (
            <ChipButton key={value} value={value} selected={bet === value} disabled={viewerSeat?.chips < value} onClick={setBet} />
          ))}
        </div>
        <button type="button" disabled={!connected || !viewerSeat || viewerSeat.chips < bet} onClick={() => actions.placeBet(table.id, bet)} className="btn btn-primary w-full md:w-36">
          Chia {formatNumber(bet)}
        </button>
      </div>
    </div>
  );
}

function ActionDock({ canUseAction, dealerUpcardAce, myTurn, tableId, actions, viewerSeat }) {
  return (
    <div className="rounded-md border border-white/10 bg-ink/80 p-3 backdrop-blur-xl">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center">
        <p className="text-sm font-semibold text-white/[0.58]">
          {!viewerSeat ? 'Đang xem bàn' : myTurn ? 'Bấm bộ bài để rút, hoặc dằn bài.' : 'Đang chờ lượt.'}
        </p>
        <ActionButton disabled={!canUseAction} label="Dằn" action={PLAYER_ACTIONS.stand} actions={actions} tableId={tableId} />
        <ActionButton disabled={!canUseAction} label="X2" action={PLAYER_ACTIONS.double} actions={actions} tableId={tableId} />
        <ActionButton disabled={!canUseAction} label="Tách" action={PLAYER_ACTIONS.split} actions={actions} tableId={tableId} />
        <ActionButton disabled={!canUseAction || !dealerUpcardAce} label="Bảo hiểm" action={PLAYER_ACTIONS.insurance} actions={actions} tableId={tableId} />
      </div>
    </div>
  );
}

function ChatPanel({ table, profile, chatText, setChatText, sendChat }) {
  return (
    <aside className="surface absolute bottom-4 right-4 top-20 z-30 flex w-[min(340px,calc(100%-2rem))] flex-col rounded-md p-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-brass" />
        <h2 className="section-title">Chat bàn</h2>
      </div>
      <div className="scrollbar-thin mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {table.chat?.length ? table.chat.map((message) => (
          <div key={message.id} className={clsx('rounded-md border p-3', message.playerId === profile.id ? 'border-brass/35 bg-brass/10' : 'border-white/10 bg-white/[0.045]')}>
            <p className="text-xs font-bold text-brass">{message.username}</p>
            <p className="mt-1 text-sm text-white/[0.78]">{message.text}</p>
          </div>
        )) : (
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-white/10 text-sm text-white/35">Chưa có tin nhắn</div>
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

function HudPill({ label, value }) {
  return (
    <div className="hidden rounded-md border border-white/10 bg-black/25 px-3 py-2 text-right sm:block">
      <p className="text-[10px] font-semibold uppercase text-white/[0.42]">{label}</p>
      <p className="text-sm font-black text-ivory">{value}</p>
    </div>
  );
}

function ActionButton({ label, action, actions, tableId, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => actions.playerAction(tableId, action)}
      className="btn btn-secondary min-h-10 px-3"
    >
      {label}
    </button>
  );
}

function slatScoreLabel(hand) {
  const cards = hand.cards ?? [];
  const score = hand.score;
  if (cards.length === 2 && cards.every((card) => card.rank === 'A')) return 'Xì bàn';
  if (score?.blackjack) return 'Xì dách';
  if (cards.length >= 5 && !score?.busted) return 'Ngũ linh';
  if (score?.busted) return 'Quắc';
  return score?.label ?? '';
}

function resultText(result) {
  return {
    blackjack: 'Xì dách',
    bust: 'Quắc',
    lose: 'Thua',
    push: 'Hòa',
    surrender: 'Bỏ bài',
    win: 'Thắng'
  }[result] ?? result;
}

function resultTone(result) {
  if (result === 'win' || result === 'blackjack') return 'text-brass';
  if (result === 'lose' || result === 'bust' || result === 'surrender') return 'text-ruby';
  return 'text-white/70';
}
