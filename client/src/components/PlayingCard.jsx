import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
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
  weightLevel = 0,
  coverDrag = false
}) {
  const serverHidden = !card || card.hidden;
  const hidden = Boolean(faceDown ?? serverHidden);
  const red = card?.suit === 'hearts' || card?.suit === 'diamonds';
  const canReveal = interactive && hidden && !serverHidden;
  const cardWeight = canReveal ? Math.min(3, Math.max(0, Number(weightLevel) || 0)) : 0;
  const dragResistance = Math.max(0.2, 0.34 - cardWeight * 0.045);
  const startRef = useRef(null);
  const movedRef = useRef(false);
  const revealTimerRef = useRef(null);
  const [drag, setDrag] = useState({ active: false, committed: false, x: 0, y: 0 });
  const pullDistance = Math.hypot(drag.x, drag.y);
  const pullStrength = drag.committed ? 1 : Math.min(1, pullDistance / 62);
  const pullRotate = Math.max(-9, Math.min(9, drag.x * 0.075));
  const coverTransform = coverDrag && (drag.active || drag.committed)
    ? `translate3d(${drag.x}px, ${drag.y}px, 0) rotate(${pullRotate}deg)`
    : undefined;
  const cardStyle = canReveal
    ? {
        transform: coverTransform,
        transition: coverDrag && drag.active ? 'none' : undefined,
        '--pull-x': `${drag.x}px`,
        '--pull-y': `${drag.y}px`,
        '--pull-strength': pullStrength,
        '--pull-rotate': `${pullRotate}deg`,
        '--stack-x': `${drag.x * 0.16 - 7 - cardWeight * 2}px`,
        '--stack-y': `${drag.y * 0.16 + 7 + cardWeight * 2}px`,
        '--stack-rotate': `${-3 - cardWeight + pullRotate * 0.24}deg`,
        '--stack-opacity': 0.32 + pullStrength * 0.5,
        '--cover-shadow-y': `${12 + pullStrength * 16}px`,
        '--cover-shadow-blur': `${18 + pullStrength * 20}px`,
        '--front-ring': `${pullStrength}px`,
        '--groove-opacity': 0.28 + pullStrength * 0.32,
        '--halo-opacity': pullStrength * 0.56,
        '--halo-scale': 0.9 + pullStrength * 0.12,
        '--stack-weight': cardWeight
      }
    : undefined;

  useEffect(() => () => window.clearTimeout(revealTimerRef.current), []);

  function reveal() {
    if (canReveal) onReveal?.(card.id);
  }

  function commitReveal(rawX = 1, rawY = -0.2) {
    if (!canReveal) return;
    const angle = Math.atan2(rawY, rawX || 1);
    const finalDistance = compact ? 62 : 86;
    const finalX = Math.cos(angle) * finalDistance;
    const finalY = Math.sin(angle) * finalDistance - (compact ? 4 : 8);

    window.clearTimeout(revealTimerRef.current);
    setDrag({ active: false, committed: true, x: finalX, y: finalY });
    revealTimerRef.current = window.setTimeout(() => {
      reveal();
      setDrag({ active: false, committed: false, x: 0, y: 0 });
    }, 170);
  }

  function handlePointerDown(event) {
    if (!canReveal) return;
    window.clearTimeout(revealTimerRef.current);
    startRef.current = { x: event.clientX, y: event.clientY };
    movedRef.current = false;
    setDrag({ active: true, committed: false, x: 0, y: 0 });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!startRef.current || !canReveal) return;
    const rawX = event.clientX - startRef.current.x;
    const rawY = event.clientY - startRef.current.y;
    const x = rawX * dragResistance;
    const y = rawY * dragResistance;
    if (Math.abs(rawX) > 6 || Math.abs(rawY) > 6) movedRef.current = true;
    setDrag({ active: true, committed: false, x, y });
  }

  function handlePointerUp(event) {
    if (!startRef.current) return;
    const rawX = event.clientX - startRef.current.x;
    const rawY = event.clientY - startRef.current.y;
    const shouldReveal = Math.hypot(rawX, rawY) > 96 || rawY < -74;
    startRef.current = null;
    if (shouldReveal || !movedRef.current) {
      commitReveal(rawX || 1, rawY || -0.2);
      return;
    }

    setDrag({ active: false, committed: false, x: 0, y: 0 });
  }

  function handleKeyDown(event) {
    if ((event.key === 'Enter' || event.key === ' ') && canReveal) {
      event.preventDefault();
      commitReveal(1, -0.2);
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
        setDrag({ active: false, committed: false, x: 0, y: 0 });
      }}
      onKeyDown={handleKeyDown}
      style={cardStyle}
      className={clsx(
        'real-card-wrap',
        compact ? 'real-card-compact' : 'real-card-large',
        canReveal && 'real-card-interactive',
        canReveal && (drag.active || drag.committed) && 'is-peeking',
        canReveal && stackedCard && 'has-weight-stack',
        canReveal && coverDrag && 'is-cover-drag-card',
        dealt && 'deal-from-deck'
      )}
    >
      {canReveal && stackedCard ? (
        <CardWeightStack card={stackedCard} compact={compact} weightLevel={cardWeight} />
      ) : null}
      <div className={clsx(
        'real-card-core',
        hidden ? 'is-hidden' : 'is-visible',
        canReveal && 'is-manual-reveal',
        canReveal && coverDrag && 'is-cover-drag',
        drag.committed && 'is-revealing',
        drag.active && 'is-held'
      )}
      >
        <div className={clsx('real-card-face real-card-front', red ? 'card-red' : 'card-black')}>
          {card && !serverHidden ? <CardFront card={card} compact={compact} /> : null}
        </div>
        <div className="real-card-face real-card-back" style={{ backgroundImage: `url("${assets.cardBack}")` }}>
          {canReveal ? <span className="peek-groove" aria-hidden="true" /> : null}
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
