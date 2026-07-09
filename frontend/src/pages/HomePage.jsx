import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchGames } from '../api/gamesApi';
import { fetchDailyPlayedGames } from '../api/scoreApi';
import { GAMES, getGameIcon } from '../games/registry';
import { useDailyCountdown } from '../games/useDailyCountdown';
import { useAuthStore } from '../store/useAuthStore';

/** Metadata-only fallback from the local registry if the API is unreachable. */
const FALLBACK_GAMES = GAMES.map(({ id, name, tagline, playable }) => ({
  id,
  name,
  tagline,
  playable,
}));

const GameIcon = ({ game }) => {
  const icon = getGameIcon(game.id);
  return icon ? (
    <img src={icon} alt="" className="mb-2 h-10 w-10" />
  ) : (
    <div className="mb-2 text-3xl">{game.emoji}</div>
  );
};

const ComingSoonCard = ({ game }) => (
  <div className="flex flex-col rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 opacity-70 dark:border-slate-600 dark:bg-slate-800/60">
    <GameIcon game={game} />
    <h3 className="text-lg font-black text-slate-700 dark:text-slate-200">
      {game.name}
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400">{game.tagline}</p>
    <span className="mt-4 inline-block w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
      Próximamente
    </span>
  </div>
);

const PlayableCard = ({ game, isAuthenticated, completedToday }) => (
  <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
    {completedToday && (
      <span
        title="Reto diario completado hoy"
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow"
      >
        ✓
      </span>
    )}
    <GameIcon game={game} />
    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
      {game.name}
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400">{game.tagline}</p>
    <div className="mt-4 flex gap-2">
      {!isAuthenticated && (
        <Link
          to={`/games/${game.id}/demo`}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Jugar demo
        </Link>
      )}
      {isAuthenticated ? (
        <Link
          to={`/games/${game.id}/daily`}
          className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-600"
        >
          {completedToday ? 'Reto diario ✓' : 'Reto diario'}
        </Link>
      ) : (
        <Link
          to="/login"
          className="rounded-lg border border-indigo-200 px-3 py-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-indigo-500/40 dark:text-indigo-400 dark:hover:bg-slate-700"
        >
          Diario 🔒
        </Link>
      )}
    </div>
  </div>
);

const HomePage = () => {
  const isAuthenticated = Boolean(useAuthStore((state) => state.token));
  const countdown = useDailyCountdown();
  const [completedGameIds, setCompletedGameIds] = useState(new Set());
  const [games, setGames] = useState(FALLBACK_GAMES);

  useEffect(() => {
    let cancelled = false;
    fetchGames()
      .then((list) => {
        if (!cancelled && Array.isArray(list) && list.length > 0)
          setGames(list);
      })
      .catch(() => {
        // Keep the local fallback list on a transient failure.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setCompletedGameIds(new Set());
      return undefined;
    }

    let cancelled = false;
    fetchDailyPlayedGames()
      .then(({ game_types: gameTypes }) => {
        if (!cancelled) setCompletedGameIds(new Set(gameTypes));
      })
      .catch(() => {
        // Best-effort only: leave the checkmarks off on a transient failure.
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">
          Elige tu juego
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Juega la demo libremente.{' '}
          {isAuthenticated
            ? 'O compite en el reto diario.'
            : 'Inicia sesión para el reto diario y los rankings.'}
        </p>
        <p className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          Próximo reto diario en {countdown}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) =>
          game.playable ? (
            <PlayableCard
              key={game.id}
              game={game}
              isAuthenticated={isAuthenticated}
              completedToday={completedGameIds.has(game.id)}
            />
          ) : (
            <ComingSoonCard key={game.id} game={game} />
          ),
        )}
      </div>
    </div>
  );
};

export default HomePage;
