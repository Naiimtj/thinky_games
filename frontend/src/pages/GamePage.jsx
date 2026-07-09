import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { fetchDailyStatus } from '../api/scoreApi';
import { getGame } from '../games/registry';
import { useDailyCountdown } from '../games/useDailyCountdown';
import { useAuthStore } from '../store/useAuthStore';

const VALID_MODES = new Set(['demo', 'daily']);

/** Shown instead of the board once today's daily challenge is already solved. */
const DailyLockedNotice = ({ game }) => {
  const countdown = useDailyCountdown();
  return (
    <div className="mx-auto max-w-md text-center">
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
      <Link to="/" className="mt-4 inline-block font-semibold text-indigo-600">
        ← Volver a los juegos
      </Link>
    </div>
  );
};

const GamePage = () => {
  const { gameId, mode } = useParams();
  const token = useAuthStore((state) => state.token);
  const game = getGame(gameId);

  // 'checking' | 'locked' | 'unlocked'; only relevant for the daily mode.
  const [dailyStatus, setDailyStatus] = useState('checking');

  useEffect(() => {
    if (mode !== 'daily' || !token || !game) return undefined;

    let cancelled = false;
    setDailyStatus('checking');
    fetchDailyStatus(gameId)
      .then(({ played_today: playedToday }) => {
        if (!cancelled) setDailyStatus(playedToday ? 'locked' : 'unlocked');
      })
      .catch(() => {
        // Fail open: a transient network error should not block play.
        if (!cancelled) setDailyStatus('unlocked');
      });

    return () => {
      cancelled = true;
    };
  }, [mode, token, gameId, game]);

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
    if (mode === 'daily' && dailyStatus === 'locked') {
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
