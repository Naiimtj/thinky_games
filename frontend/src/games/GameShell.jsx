/** Shared chrome for every game: header (title, mode badge, timer) + win banner. */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseButton from '../components/base/BaseButton';
import { formatTime } from '../utils/formatTime';
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

const Confetti = () => (
  <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
    {range(48).map((i) => (
      <span
        key={i}
        className="confetti-piece"
        style={{
          left: `${(i * 97) % 100}%`,
          backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          animationDelay: `${(i % 12) * 0.12}s`,
        }}
      />
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
    <section className="mx-auto w-full px-3 sm:max-w-md sm:px-0">
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
            {formatTime(elapsed)}
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
            {t('gameShell.solvedIn', { time: formatTime(elapsed) })}
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
