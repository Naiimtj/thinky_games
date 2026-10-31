/** Shared chrome for every game: header (title, mode badge, timer) + win banner. */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseButton from '../components/base/BaseButton';
import { formatGameTime } from '../utils/formatTime';
import { range } from '../utils/range';
import { GAME_STATE } from './useGameSession';
import { useDailyCountdown } from './useDailyCountdown';

const CONFETTI_COLORS = [
  '#f87171',
  '#fbbf24',
  '#34d399',
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
];

const CONFETTI_PIECE_COUNT = 36;

const CONFETTI_DIMENSIONS = [
  [1.02, 1.02],
  [0.52, 1.72],
  [1.4, 0.76],
  [1, 1.5],
  [1, 1.5],
  [1, 1.5],
];

const confettiShapeClass = (index) => {
  const shape = index % 6;
  if (shape === 0) return 'confetti-piece--circle';
  if (shape === 1) return 'confetti-piece--slim';
  if (shape === 2) return 'confetti-piece--wide';
  return 'confetti-piece--rect';
};

const buildConfettiStyle = (index) => {
  const base = index + 1;
  const left = (base * 37) % 100;
  const direction = base % 2 === 0 ? 1 : -1;
  const drift = 18 + ((base * 29) % 34);
  const spin = direction * (540 + ((base * 53) % 540));
  const duration = 2.6 + ((base * 11) % 12) / 10;
  const delay = ((base * 7) % 10) * 0.06;
  const size = 0.36 + ((base * 19) % 18) / 100;
  const opacity = 0.82 + ((base * 13) % 16) / 100;
  const [widthScale, heightScale] =
    CONFETTI_DIMENSIONS[index % CONFETTI_DIMENSIONS.length];

  return {
    left: `${left}%`,
    width: `${(size * widthScale).toFixed(3)}rem`,
    height: `${(size * heightScale).toFixed(3)}rem`,
    backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    '--confetti-start-x': `${Math.round(drift * direction * -0.25)}px`,
    '--confetti-end-x': `${drift * direction}px`,
    '--confetti-spin': `${spin}deg`,
    '--confetti-duration': `${duration}s`,
    '--confetti-delay': `${delay}s`,
    '--confetti-opacity': opacity,
  };
};

const CONFETTI_PIECES = range(CONFETTI_PIECE_COUNT).map((index) => ({
  className: confettiShapeClass(index),
  id: index,
  style: buildConfettiStyle(index),
}));

const Confetti = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
  >
    {CONFETTI_PIECES.map(({ className, id, style }) => (
      <span key={id} className={`confetti-piece ${className}`} style={style} />
    ))}
  </div>
);

const ModeBadge = ({ mode }) => {
  const { t } = useTranslation();
  return mode === 'daily' ? (
    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
      {t('gameShell.mode.daily')}
    </span>
  ) : (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
      {t('gameShell.mode.demo')}
    </span>
  );
};

/** Collapsible "How to play" block; each game supplies its own rule items. */
export const RulesSection = ({ children }) => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-600">
      <BaseButton
        variant="secondary"
        text
        onClick={() => setShow((value) => !value)}
        className="flex w-full items-center justify-between px-3 py-2 font-semibold text-slate-700 hover:no-underline"
      >
        <span>{t('gameShell.howToPlay')}</span>
        <span className="text-slate-400">{show ? '▲' : '▼'}</span>
      </BaseButton>
      {show && (
        <ol className="list-decimal space-y-1 px-3 pb-3 pl-8">{children}</ol>
      )}
    </div>
  );
};

export const GameShell = ({
  gameId,
  title,
  tagline,
  mode,
  elapsed,
  state,
  onReset,
  hint,
  children,
}) => {
  const { t } = useTranslation();
  const countdown = useDailyCountdown();

  return (
    <section className="mx-auto w-full px-0 sm:max-w-md">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200">
            {title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {tagline}
          </p>
        </div>
        <div className="text-right">
          <BaseButton
            variant="primary"
            onClick={onReset}
            disabled={state === GAME_STATE.WON}
            className="shrink-0 rounded-lg disabled:cursor-not-allowed"
          >
            {t('gameShell.restart')}
          </BaseButton>
          <div className="font-mono text-2xl font-bold tabular-nums dark:text-slate-200 text-slate-800">
            {formatGameTime(gameId, elapsed)}
          </div>
          {mode === 'daily' && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t('gameShell.nextChallenge', { countdown })}
            </p>
          )}
        </div>
      </div>

      {/* Frozen once solved: still shows the board exactly as the player
          left it, but blocks further interaction while the win celebration
          (confetti + banner) plays and the parent page holds this view. */}
      <div className={state === GAME_STATE.WON ? 'pointer-events-none' : ''}>
        {children}
      </div>

      {state === GAME_STATE.WON && <Confetti />}

      {state === GAME_STATE.WON && (
        <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-emerald-700">
          <p className="font-bold">
            {t('gameShell.solvedIn', { time: formatGameTime(gameId, elapsed) })}
          </p>
          <p className="text-sm">
            {mode === 'daily'
              ? t('gameShell.rankingMessage.daily')
              : t('gameShell.rankingMessage.demo')}
          </p>
        </div>
      )}
    </section>
  );
};
