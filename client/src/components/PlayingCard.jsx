import clsx from 'clsx';
import { useRef, useState } from 'react';
import { assets } from '../lib/assets.js';
import { suitSymbol } from '../lib/format.js';

const faceRanks = new Set(['J', 'Q', 'K']);
const pipLayouts = {
  2: ['top-center', 'bottom-center'],
  3: ['top-center', 'middle-center', 'bottom-center'],
  4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  5: ['top-left', 'top-right', 'middle-center', 'bottom-left', 'bottom-right'],
  6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
  7: ['top-left', 'top-right', 'upper-center', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
  8: ['top-left', 'top-right', 'upper-center', 'middle-left', 'middle-right', 'lower-center', 'bottom-left', 'bottom-right'],
  9: ['top-left', 'top-right', 'upper-left', 'upper-right', 'middle-center', 'lower-left', 'lower-right', 'bottom-left', 'bottom-right'],
  10: ['top-left', 'top-right', 'upper-left', 'upper-right', 'middle-left', 'middle-right', 'lower-left', 'lower-right', 'bottom-left', 'bottom-right']
};

export function PlayingCard({
  card,
  compact = false,
  faceDown,
  interactive = false,
  onReveal,
  dealt = false,
  peekLabel = 'Flip',
  stackedCard = null,
  weightLevel = 0
}) {
  const serverHidden = !card || card.hidden;
  const hidden = Boolean(faceDown ?? serverHidden);
  const red = card?.suit === 'hearts' || card?.suit === 'diamonds';
  const canReveal = interactive && hidden && !serverHidden;
  const cardWeight = canReveal ? Math.min(3, Math.max(0, Number(weightLevel) || 0)) : 0;
  const dragResistance = Math.max(0.24, 0.42 - cardWeight * 0.055);
  const startRef = useRef(null);
  const movedRef = useRef(false);
  const [drag, setDrag] = useState({ active: false, x: 0, y: 0 });
  const peekStrength = Math.min(1, Math.max(Math.abs(drag.x) / 42, Math.abs(drag.y) / 42));
  const dragStyle = drag.active
    ? {
        transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x * 0.04}deg)`,
        transition: 'none',
        '--peek-strength': peekStrength,
        '--peek-rotate': `${Math.max(-10, Math.min(10, drag.x * 0.08))}deg`,
        '--stack-weight': cardWeight
      }
    : undefined;

  function reveal() {
    if (canReveal) onReveal?.(card.id);
  }

  function handlePointerDown(event) {
    if (!canReveal) return;
    startRef.current = { x: event.clientX, y: event.clientY };
    movedRef.current = false;
    setDrag({ active: true, x: 0, y: 0 });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!startRef.current || !canReveal) return;
    const rawX = event.clientX - startRef.current.x;
    const rawY = event.clientY - startRef.current.y;
    const x = rawX * dragResistance;
    const y = rawY * dragResistance;
    if (Math.abs(rawX) > 6 || Math.abs(rawY) > 6) movedRef.current = true;
    setDrag({ active: true, x, y });
  }

  function handlePointerUp(event) {
    if (!startRef.current) return;
    const rawX = event.clientX - startRef.current.x;
    const rawY = event.clientY - startRef.current.y;
    const shouldReveal = Math.abs(rawX) > 62 || rawY < -42 || Math.abs(rawY) > 74;
    startRef.current = null;
    setDrag({ active: false, x: 0, y: 0 });
    if (shouldReveal || !movedRef.current) reveal();
  }

  function handleKeyDown(event) {
    if ((event.key === 'Enter' || event.key === ' ') && canReveal) {
      event.preventDefault();
      reveal();
    }
  }

  return (
    <div
      role={canReveal ? 'button' : undefined}
      tabIndex={canReveal ? 0 : undefined}
      aria-label={canReveal ? `${peekLabel} ${card.rank} ${card.suit}` : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        startRef.current = null;
        setDrag({ active: false, x: 0, y: 0 });
      }}
      onKeyDown={handleKeyDown}
      style={dragStyle}
      className={clsx(
        'real-card-wrap',
        compact ? 'real-card-compact' : 'real-card-large',
        canReveal && 'real-card-interactive',
        canReveal && drag.active && 'is-peeking',
        canReveal && stackedCard && 'has-weight-stack',
        dealt && 'deal-from-deck'
      )}
    >
      {canReveal && stackedCard ? (
        <CardWeightStack card={stackedCard} compact={compact} weightLevel={cardWeight} />
      ) : null}
      <div className={clsx('real-card-core', hidden ? 'is-hidden' : 'is-visible')}>
        <div className={clsx('real-card-face real-card-front', red ? 'card-red' : 'card-black')}>
          {card && !serverHidden ? <CardFront card={card} compact={compact} /> : null}
        </div>
        <div className="real-card-face real-card-back" style={{ backgroundImage: `url("${assets.cardBack}")` }}>
          {canReveal && card ? (
            <div className={clsx('card-peek-corner', red ? 'card-red' : 'card-black')}>
              <Corner rank={card.rank} suit={suitSymbol(card.suit)} />
            </div>
          ) : null}
          {canReveal ? <span className="peek-tag">{peekLabel}</span> : null}
        </div>
      </div>
    </div>
  );
}

function CardWeightStack({ card, compact, weightLevel }) {
  const red = card?.suit === 'hearts' || card?.suit === 'diamonds';
  const suit = suitSymbol(card.suit);

  return (
    <div
      className={clsx('card-weight-stack', compact && 'card-weight-stack-compact', red ? 'card-red' : 'card-black')}
      style={{ '--weight-count': weightLevel }}
      aria-hidden="true"
    >
      <div className="card-weight-paper">
        <Corner rank={card.rank} suit={suit} />
        <span className="card-weight-suit">{suit}</span>
      </div>
    </div>
  );
}

function CardFront({ card, compact }) {
  const suit = suitSymbol(card.suit);
  return (
    <div className="real-card-inner">
      <Corner rank={card.rank} suit={suit} />
      <div className={clsx('pip-field', compact && 'pip-field-compact')}>
        {renderCenter(card.rank, suit)}
      </div>
      <div className="rotate-180">
        <Corner rank={card.rank} suit={suit} />
      </div>
    </div>
  );
}

function Corner({ rank, suit }) {
  return (
    <div className="card-corner">
      <span>{rank}</span>
      <span>{suit}</span>
    </div>
  );
}

function renderCenter(rank, suit) {
  if (rank === 'A') {
    return <span className="ace-pip">{suit}</span>;
  }

  if (faceRanks.has(rank)) {
    return (
      <div className="face-card-mark">
        <span className="face-card-rank">{rank}</span>
        <span>{suit}</span>
      </div>
    );
  }

  const count = Number(rank);
  return (
    <div className="pip-layout">
      {(pipLayouts[count] ?? []).map((slot, index) => (
        <span key={`${slot}-${index}`} className={clsx('pip', `pip-${slot}`)}>{suit}</span>
      ))}
    </div>
  );
}
