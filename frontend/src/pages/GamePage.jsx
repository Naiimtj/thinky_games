import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import Leaderboard from '../components/Leaderboard';
import { getGame } from '../games/registry';
import { useDailyCountdown } from '../games/useDailyCountdown';
import { useAuthStore } from '../store/useAuthStore';
import { useDailyGamesStore } from '../store/useDailyGamesStore';

const VALID_MODES = new Set(['demo', 'daily']);
// How long the win celebration (confetti + banner, rendered by GameShell,
// which also freezes the board) stays on screen before swapping to the
// locked notice/leaderboard. Without this, `playedGameIds` flips to
// "locked" as soon as the score submit resolves — often near-instantly —
// which used to swap the board out from under the celebration before the
// player could even see it.
const CELEBRATION_MS = 5_000;

/** Shown instead of the board once today's daily challenge is already solved. */
const DailyLockedNotice = ({ game }) => {
  const countdown = useDailyCountdown();
  return (
    <div className="mx-auto max-w-md">
      <div className="text-center">
        <img src={game.icon} alt="" className="mx-auto mb-3 h-16 w-16" />
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200">
          {game.name}
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-300">
          Ya jugaste el reto diario de hoy. Vuelve en{' '}
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
            {countdown}
          </span>{' '}
          por un nuevo reto.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block font-semibold text-indigo-600"
        >
          ← Volver a los juegos
        </Link>
      </div>
      <div className="mt-6">
        <Leaderboard gameType={game.id} />
      </div>
    </div>
  );
};

const GamePage = () => {
  const { gameId, mode } = useParams();
  const user = useAuthStore((state) => state.user);
  const game = getGame(gameId);

  const playedGameIds = useDailyGamesStore((state) => state.playedGameIds);
  const dailyPlayedLoadedAt = useDailyGamesStore(
    (state) => state.dailyPlayedLoadedAt,
  );
  const dailyError = useDailyGamesStore((state) => state.dailyError);
  const loadPlayedGames = useDailyGamesStore((state) => state.loadPlayedGames);

  useEffect(() => {
    if (mode !== 'daily' || !user || !game) return;
    loadPlayedGames();
  }, [mode, user, game, loadPlayedGames]);

  // 'checking' | 'locked' | 'unlocked'; only relevant for the daily mode.
  // Fails open (unlocked) on a transient network error, same as before.
  const getDailyStatus = () => {
    if (mode !== 'daily' || !user) return 'unlocked';
    if (dailyError) return 'unlocked';
    if (dailyPlayedLoadedAt === null) return 'checking';
    return playedGameIds.has(gameId) ? 'locked' : 'unlocked';
  };
  const dailyStatus = getDailyStatus();

  // Detect the unlocked -> locked transition that happens right after a win
  // (as opposed to loading a game that was already played before this
  // visit), and keep the board mounted — frozen, still showing the solved
  // state, with its win celebration — for a bit before swapping to the
  // locked notice.
  const [celebrating, setCelebrating] = useState(false);
  const previousStatusRef = useRef(dailyStatus);
  const wasPlayingRef = useRef(false);

  // Record that this page actually rendered the active board. This lets the
  // first locked render after a win keep the board mounted synchronously;
  // waiting for the effect below would unmount it before `celebrating` flips.
  if (dailyStatus === 'unlocked') wasPlayingRef.current = true;
  const justCompleted =
    dailyStatus === 'locked' && wasPlayingRef.current && !celebrating;

  useEffect(() => {
    const justWon =
      previousStatusRef.current === 'unlocked' && dailyStatus === 'locked';
    previousStatusRef.current = dailyStatus;
    if (!justWon) return undefined;

    setCelebrating(true);
    const timer = setTimeout(() => {
      wasPlayingRef.current = false;
      setCelebrating(false);
    }, CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [dailyStatus]);

  if (!game) return <Navigate to="/" replace />;

  if (!game.playable) {
    return (
      <div className="mx-auto max-w-md text-center">
        <img src={game.icon} alt="" className="mx-auto mb-3 h-16 w-16" />
        <h1 className="text-2xl font-black text-slate-800">{game.name}</h1>
        <p className="mt-2 text-slate-500">
          Este juego estará disponible próximamente.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block font-semibold text-indigo-600"
        >
          ← Volver a los juegos
        </Link>
      </div>
    );
  }

  if (!VALID_MODES.has(mode)) {
    return <Navigate to={`/games/${gameId}/demo`} replace />;
  }

  // The daily challenge is only for authenticated players.
  if (mode === 'daily' && !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `/games/${gameId}/daily` }}
      />
    );
  }

  const renderContent = () => {
    if (
      mode === 'daily' &&
      dailyStatus === 'locked' &&
      !celebrating &&
      !justCompleted
    ) {
      return <DailyLockedNotice game={game} />;
    }
    if (mode === 'daily' && dailyStatus === 'checking') {
      return <p className="text-center text-slate-400">Cargando…</p>;
    }
    const GameComponent = game.Component;
    return <GameComponent mode={mode} meta={game} />;
  };

  return (
    <div>
      <Link
        to="/"
        className="mb-4 inline-block text-sm font-semibold text-slate-500 hover:text-slate-700"
      >
        ← Todos los juegos
      </Link>
      {renderContent()}
    </div>
  );
};

export default GamePage;
