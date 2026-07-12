import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import DailyGamesSummary from '../components/DailyGamesSummary';
import Leaderboard from '../components/Leaderboard';
import { getGame } from '../games/registry';
import { useDailyCountdown } from '../games/useDailyCountdown';
import { useAuthStore } from '../store/useAuthStore';
import { useDailyGamesStore } from '../store/useDailyGamesStore';

const VALID_MODES = new Set(['demo', 'daily']);
// How long the win celebration (confetti + banner, rendered by GameShell)
// stays on screen before swapping to the daily summary. Without this,
// `playedGameIds` flips to "locked" as soon as the score submit resolves —
// often near-instantly — which used to swap the board out from under the
// celebration before the player could see it.
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
  const token = useAuthStore((state) => state.token);
  const game = getGame(gameId);

  const playedGameIds = useDailyGamesStore((state) => state.playedGameIds);
  const dailyLoadedAt = useDailyGamesStore((state) => state.dailyLoadedAt);
  const dailyError = useDailyGamesStore((state) => state.dailyError);
  const loadDailyData = useDailyGamesStore((state) => state.loadDailyData);

  useEffect(() => {
    if (mode !== 'daily' || !token || !game) return;
    loadDailyData();
  }, [mode, token, game, loadDailyData]);

  // 'checking' | 'locked' | 'unlocked'; only relevant for the daily mode.
  // Fails open (unlocked) on a transient network error, same as before.
  const getDailyStatus = () => {
    if (mode !== 'daily' || !token) return 'unlocked';
    if (dailyError) return 'unlocked';
    if (dailyLoadedAt === null) return 'checking';
    return playedGameIds.has(gameId) ? 'locked' : 'unlocked';
  };
  const dailyStatus = getDailyStatus();

  // Detect the unlocked -> locked transition that happens right after a win
  // (as opposed to loading an already-played game), and keep the game
  // mounted — with its win celebration — for a bit before showing the
  // summary instead of the locked notice.
  const [celebrating, setCelebrating] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const previousStatusRef = useRef(dailyStatus);

  useEffect(() => {
    const justWon =
      previousStatusRef.current === 'unlocked' && dailyStatus === 'locked';
    previousStatusRef.current = dailyStatus;
    if (!justWon) return undefined;

    setCelebrating(true);
    const timer = setTimeout(() => {
      setCelebrating(false);
      setShowSummary(true);
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
  if (mode === 'daily' && !token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `/games/${gameId}/daily` }}
      />
    );
  }

  const renderContent = () => {
    if (mode === 'daily' && showSummary) {
      return <DailyGamesSummary />;
    }
    if (mode === 'daily' && dailyStatus === 'locked' && !celebrating) {
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
