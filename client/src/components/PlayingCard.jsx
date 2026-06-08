import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { assets } from '../lib/assets.js';
import { suitSymbol } from '../lib/format.js';

const faceRanks = new Set(['J', 'Q', 'K']);
const cornerVectors = {
  tl: { x: -1, y: -1 },
  tr: { x: 1, y: -1 },
  bl: { x: -1, y: 1 },
  br: { x: 1, y: 1 }
};
const idlePeek = {
  active: false,
  returning: false,
  corner: 'tr',
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  progress: 0,
  vp: 0
};
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
  dealt = false,
  onPeekChange,
  remotePeek = false,
  peekLabel = 'Peek'
}) {
  const serverHidden = !card || card.hidden;
  const hidden = Boolean(faceDown ?? serverHidden);
  const red = card?.suit === 'hearts' || card?.suit === 'diamonds';
  const canPeek = interactive && hidden && !serverHidden;
  const [peek, setPeek] = useState(idlePeek);
  const startRef = useRef(null);
  const lastMoveRef = useRef(null);
  const peekRef = useRef(idlePeek);
  const returnFrameRef = useRef(0);
  const audioRef = useRef(null);
  const progress = canPeek ? clamp(peek.progress, 0, 1) : 0;
  const corner = cornerVectors[peek.corner] ? peek.corner : 'tr';
  const cornerVector = cornerVectors[corner];
  const cut = (compact ? 14 : 18) + progress * (compact ? 104 : 154);
  const foldSize = Math.max(compact ? 24 : 30, cut * 0.72);
  const rotateZ = clamp(peek.x * 0.16 + cornerVector.x * progress * 3.2, -8, 8);
  const rotateX = clamp(-cornerVector.y * progress * 18 + peek.y * 0.045, -20, 20);
  const rotateY = clamp(cornerVector.x * progress * 18 + peek.x * 0.045, -20, 20);
  const foldX = (cornerVector.y < 0 ? 42 : -42) * progress;
  const foldY = (cornerVector.x > 0 ? 34 : -34) * progress;
  const foldZ = (corner === 'tl' || corner === 'br' ? -4 : 4) * progress;
  const cardStyle = canPeek
    ? {
        '--peek-progress': progress,
        '--peek-cut': `${cut}px`,
        '--peek-fold-size': `${foldSize}px`,
        '--peek-x': `${peek.x}px`,
        '--peek-y': `${peek.y}px`,
        '--peek-back-shift-x': `${peek.x * 0.15}px`,
        '--peek-back-shift-y': `${peek.y * 0.15}px`,
        '--peek-fold-shift-x': `${peek.x * 0.28}px`,
        '--peek-fold-shift-y': `${peek.y * 0.28}px`,
        '--peek-rotate-z': `${rotateZ}deg`,
        '--peek-rotate-x': `${rotateX}deg`,
        '--peek-rotate-y': `${rotateY}deg`,
        '--peek-fold-x': `${foldX}deg`,
        '--peek-fold-y': `${foldY}deg`,
        '--peek-fold-z': `${foldZ}deg`,
        '--peek-shadow-y': `${8 + progress * 22}px`,
        '--peek-shadow-blur': `${12 + progress * 28}px`,
        '--peek-light': 0.18 + progress * 0.48,
        '--peek-groove-opacity': 0.18 + progress * 0.36,
        '--peek-light-opacity': progress * 0.55,
        '--peek-fold-shine': 0.22 + progress * 0.38,
        '--peek-halo-opacity': progress * 0.42,
        '--peek-halo-scale': 0.92 + progress * 0.13,
        '--peek-bend': progress,
        '--peek-fold-opacity': progress > 0.02 ? 1 : 0
      }
    : undefined;

  useEffect(() => () => {
    cancelAnimationFrame(returnFrameRef.current);
    audioRef.current?.stopFriction();
  }, []);

  function setPeekFrame(next) {
    peekRef.current = next;
    setPeek(next);
  }

  function stopReturnAnimation() {
    cancelAnimationFrame(returnFrameRef.current);
    returnFrameRef.current = 0;
  }

  function handlePointerDown(event) {
    if (!canPeek) return;
    stopReturnAnimation();
    const cornerName = getNearestCorner(event.currentTarget, event.clientX, event.clientY);
    const now = performance.now();
    startRef.current = {
      x: event.clientX,
      y: event.clientY,
      corner: cornerName
    };
    lastMoveRef.current = {
      time: now,
      x: 0,
      y: 0,
      progress: 0.035
    };
    audioRef.current = audioRef.current ?? getCardAudio();
    audioRef.current?.playContact(0.35);
    audioRef.current?.startFriction();
    onPeekChange?.(true);
    setPeekFrame({
      ...idlePeek,
      active: true,
      corner: cornerName,
      progress: 0.035
    });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!startRef.current || !canPeek) return;
    event.preventDefault();
    const rawX = event.clientX - startRef.current.x;
    const rawY = event.clientY - startRef.current.y;
    const next = movementToPeek(rawX, rawY, startRef.current.corner, compact);
    const now = performance.now();
    const previous = lastMoveRef.current ?? { time: now, x: 0, y: 0, progress: next.progress };
    const dt = Math.max(0.012, (now - previous.time) / 1000);
    const vx = (next.x - previous.x) / dt;
    const vy = (next.y - previous.y) / dt;
    const vp = (next.progress - previous.progress) / dt;
    lastMoveRef.current = {
      time: now,
      x: next.x,
      y: next.y,
      progress: next.progress
    };
    audioRef.current?.updateFriction(Math.hypot(vx, vy), next.progress);
    setPeekFrame({
      ...peekRef.current,
      active: true,
      returning: false,
      corner: startRef.current.corner,
      x: next.x,
      y: next.y,
      vx,
      vy,
      progress: next.progress,
      vp
    });
  }

  function handlePointerUp(event) {
    if (!startRef.current || !canPeek) return;
    startRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    startReturn();
  }

  function handlePointerCancel() {
    if (!startRef.current) return;
    startRef.current = null;
    startReturn();
  }

  function handleKeyDown(event) {
    if ((event.key === 'Enter' || event.key === ' ') && canPeek && !peekRef.current.active) {
      event.preventDefault();
      stopReturnAnimation();
      audioRef.current = audioRef.current ?? getCardAudio();
      audioRef.current?.playContact(0.35);
      audioRef.current?.startFriction();
      onPeekChange?.(true);
      setPeekFrame({
        ...idlePeek,
        active: true,
        corner: 'tr',
        x: compact ? 8 : 12,
        y: compact ? -7 : -10,
        progress: 0.5
      });
    }
  }

  function handleKeyUp(event) {
    if ((event.key === 'Enter' || event.key === ' ') && canPeek) {
      event.preventDefault();
      startReturn();
    }
  }

  function startReturn() {
    const current = peekRef.current;
    if (current.active) onPeekChange?.(false);
    audioRef.current?.stopFriction();
    audioRef.current?.playContact(Math.min(1, 0.35 + Math.abs(current.vp) * 0.14));
    let frame = {
      ...current,
      active: false,
      returning: true,
      vx: clamp(current.vx, -520, 520) * 0.42,
      vy: clamp(current.vy, -520, 520) * 0.42,
      vp: clamp(current.vp, -5, 5) * 0.28
    };
    let previousTime = performance.now();

    stopReturnAnimation();

    function tick(time) {
      const dt = Math.min(0.032, Math.max(0.001, (time - previousTime) / 1000));
      previousTime = time;
      frame.vx += -frame.x * 115 * dt;
      frame.vy += -frame.y * 115 * dt;
      frame.vp += -frame.progress * 18 * dt;
      const drag = Math.exp(-13 * dt);
      frame = {
        ...frame,
        x: frame.x + frame.vx * dt,
        y: frame.y + frame.vy * dt,
        vx: frame.vx * drag,
        vy: frame.vy * drag,
        progress: clamp(frame.progress + frame.vp * dt, 0, 1),
        vp: frame.vp * Math.exp(-8 * dt)
      };

      if (
        Math.abs(frame.x) < 0.25
        && Math.abs(frame.y) < 0.25
        && Math.abs(frame.vx) < 3
        && Math.abs(frame.vy) < 3
        && frame.progress < 0.004
        && Math.abs(frame.vp) < 0.04
      ) {
        setPeekFrame({ ...idlePeek, corner: frame.corner });
        returnFrameRef.current = 0;
        return;
      }

      setPeekFrame(frame);
      returnFrameRef.current = requestAnimationFrame(tick);
    }

    returnFrameRef.current = requestAnimationFrame(tick);
  }

  return (
    <div
      role={canPeek ? 'slider' : undefined}
      tabIndex={canPeek ? 0 : undefined}
      aria-label={canPeek ? peekLabel : undefined}
      aria-valuemin={canPeek ? 0 : undefined}
      aria-valuemax={canPeek ? 100 : undefined}
      aria-valuenow={canPeek ? revealMilestone(progress) : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      style={cardStyle}
      data-peek-step={canPeek ? revealMilestone(progress) : undefined}
      className={clsx(
        'real-card-wrap',
        compact ? 'real-card-compact' : 'real-card-large',
        canPeek && 'real-card-interactive',
        canPeek && progress > 0.01 && 'is-peeking',
        remotePeek && 'is-remote-peeking',
        dealt && 'deal-from-deck'
      )}
    >
      <div className={clsx(
        'real-card-core',
        hidden ? 'is-hidden' : 'is-visible',
        canPeek && 'is-peekable',
        canPeek && progress > 0.01 && 'is-peeking-local',
        peek.returning && 'is-returning',
        canPeek && `peek-corner-${corner}`
      )}
      >
        <div className={clsx('real-card-face real-card-front', red ? 'card-red' : 'card-black')}>
          {card && (!hidden || canPeek) ? <CardFront card={card} compact={compact} /> : null}
        </div>
        <div className="real-card-face real-card-back" style={{ backgroundImage: `url("${assets.cardBack}")` }}>
          {canPeek ? (
            <>
              <span className="peek-groove" aria-hidden="true" />
              <span className="peek-light" aria-hidden="true" />
            </>
          ) : null}
        </div>
        {canPeek ? <span className="peek-fold" style={{ backgroundImage: `url("${assets.cardBack}")` }} aria-hidden="true" /> : null}
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

function getNearestCorner(element, clientX, clientY) {
  const rect = element.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const horizontal = localX < rect.width / 2 ? 'l' : 'r';
  const vertical = localY < rect.height / 2 ? 't' : 'b';
  return `${vertical}${horizontal}`;
}

function movementToPeek(rawX, rawY, corner, compact) {
  const vector = cornerVectors[corner] ?? cornerVectors.tr;
  const travel = Math.hypot(rawX, rawY);
  const outward = Math.max(0, rawX * vector.x + rawY * vector.y);
  const upwardLift = rawY < 0 ? Math.abs(rawY) * 0.82 : 0;
  const revealDistance = Math.max(outward, travel * 0.72, upwardLift);
  const maxDistance = compact ? 92 : 132;
  const progress = clamp(revealDistance / maxDistance, 0, 1);
  const dragScale = 0.12 + progress * 0.08;
  return {
    x: clamp(rawX * dragScale, compact ? -18 : -26, compact ? 18 : 26),
    y: clamp(rawY * dragScale, compact ? -18 : -26, compact ? 18 : 26),
    progress
  };
}

function revealMilestone(progress) {
  if (progress >= 0.985) return 100;
  if (progress >= 0.75) return 75;
  if (progress >= 0.5) return 50;
  if (progress >= 0.25) return 25;
  if (progress >= 0.1) return 10;
  return 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

let sharedAudioEngine = null;

function getCardAudio() {
  if (typeof window === 'undefined') return null;
  sharedAudioEngine = sharedAudioEngine ?? createCardAudioEngine();
  return sharedAudioEngine;
}

function createCardAudioEngine() {
  let context = null;
  let noiseBuffer = null;
  let friction = null;

  function ensureContext() {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;
    context = context ?? new AudioContextConstructor();
    if (context.state === 'suspended') context.resume();
    noiseBuffer = noiseBuffer ?? createNoiseBuffer(context);
    return context;
  }

  function createNoiseBuffer(audioContext) {
    const length = Math.floor(audioContext.sampleRate * 0.8);
    const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * 0.75;
    }
    return buffer;
  }

  function playContact(intensity = 0.5) {
    const audioContext = ensureContext();
    if (!audioContext || !noiseBuffer) return;
    const now = audioContext.currentTime;
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    source.buffer = noiseBuffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(620 + intensity * 520, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.015 + intensity * 0.018, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    source.start(now);
    source.stop(now + 0.09);
  }

  function startFriction() {
    const audioContext = ensureContext();
    if (!audioContext || !noiseBuffer || friction) return;
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    source.buffer = noiseBuffer;
    source.loop = true;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(920, audioContext.currentTime);
    filter.Q.setValueAtTime(0.9, audioContext.currentTime);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    source.start();
    friction = { source, filter, gain };
  }

  function updateFriction(speed, progress) {
    if (!context || !friction) return;
    const now = context.currentTime;
    const targetGain = clamp(0.003 + speed * 0.000025 + progress * 0.011, 0.002, 0.025);
    friction.gain.gain.cancelScheduledValues(now);
    friction.gain.gain.linearRampToValueAtTime(targetGain, now + 0.04);
    friction.filter.frequency.linearRampToValueAtTime(760 + progress * 720 + Math.min(speed, 420) * 0.7, now + 0.045);
  }

  function stopFriction() {
    if (!context || !friction) return;
    const current = friction;
    const now = context.currentTime;
    current.gain.gain.cancelScheduledValues(now);
    current.gain.gain.linearRampToValueAtTime(0.0001, now + 0.08);
    current.source.stop(now + 0.09);
    friction = null;
  }

  return {
    playContact,
    startFriction,
    stopFriction,
    updateFriction
  };
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
