/**
 * Personal per-game summary shown on the Rankings page: today's time (if
 * played), highlighted green when it's a new personal best, the player's
 * all-time best/worst times, and their daily/monthly/global rank. Every game
 * is listed, even ones the player has never played. Clicking a row opens the
 * full leaderboard for that game in a modal.
 */

import { useEffect, useState } from 'react';

import { fetchDailySummary, fetchMyRanks } from '../api/scoreApi';
import { PLAYABLE_GAMES } from '../games/registry';
import { formatTime } from '../utils/formatTime';
import BaseModal from './base/BaseModal';
import Leaderboard from './Leaderboard';

/** Merge the backend stats/ranks (only for games with history) with every playable game. */
const mergeWithAllGames = (stats, ranks) => {
  const statsByGameType = new Map(stats.map((stat) => [stat.game_type, stat]));
  const ranksByGameType = new Map(ranks.map((rank) => [rank.game_type, rank]));
  return PLAYABLE_GAMES.map((game) => ({
    ...(statsByGameType.get(game.id) ?? {
      game_type: game.id,
      played_today: false,
      today_time: null,
      best_time: null,
      worst_time: null,
    }),
    ...(ranksByGameType.get(game.id) ?? {
      daily_rank: null,
      monthly_rank: null,
      global_rank: null,
    }),
  }));
};

const RankBadge = ({ label, rank }) => (
  <span className="text-slate-400 dark:text-slate-500">
    {label}: <span className="font-mono">{rank ?? '-'}</span>
  </span>
);

const GameSummaryRow = ({ game, stat, onClick }) => {
  const hasHistory = stat.best_time !== null;
  const isNewBest = stat.played_today && stat.today_time <= stat.best_time;

  return (
    <li className="w-full border-b border-slate-100 last:border-0 dark:border-slate-700">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col gap-2 border-b border-slate-100 py-3 text-left last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex md:flex-row flex-col md:justify-start justify-center items-center gap-3">
          {game?.icon && (
            <img src={game.icon} alt="" className="h-8 w-8 flex-shrink-0" />
          )}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {game?.name ?? stat.game_type}
          </span>
        </div>
        <div className="flex md:flex-row flex-col items-center gap-x-4 gap-y-1 text-sm">
          <span
            className={`font-mono font-semibold tabular-nums ${
              isNewBest
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {stat.played_today ? formatTime(stat.today_time) : '-'}
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-slate-400 dark:text-slate-500 font-bold">
              Mejor:{' '}
              <span className="font-normal">
                {hasHistory ? formatTime(stat.best_time) : '-'}
              </span>
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-bold">
              Peor:{' '}
              <span className="font-normal">
                {hasHistory ? formatTime(stat.worst_time) : '-'}
              </span>
            </span>
          </div>
        </div>
      </button>
    </li>
  );
};

const DailyGamesSummary = () => {
  const [stats, setStats] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [summaryData, rankData] = await Promise.all([
          fetchDailySummary(),
          fetchMyRanks(),
        ]);
        if (!isCancelled) {
          setStats(summaryData);
          setRanks(rankData);
        }
      } catch (loadError) {
        if (!isCancelled) setError(loadError.message);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      isCancelled = true;
    };
  }, []);

  const rows = mergeWithAllGames(stats, ranks);
  const selectedGame = PLAYABLE_GAMES.find(
    (game) => game.id === selectedGameId,
  );

  return (
    <section className="rounded-2xl bg-white p-4 shadow-md dark:bg-slate-800 w-full">
      <h2 className="mb-3 text-lg font-black text-slate-800 dark:text-slate-100">
        Tu resumen de hoy
      </h2>

      {isLoading && (
        <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
          Cargando…
        </p>
      )}

      {error && !isLoading && (
        <p className="py-6 text-center text-sm text-red-500 dark:text-red-400">
          No se pudo cargar tu resumen.
        </p>
      )}

      {!isLoading && !error && (
        <ul className="flex flex-col">
          {rows.map((stat) => (
            <GameSummaryRow
              key={stat.game_type}
              game={PLAYABLE_GAMES.find((game) => game.id === stat.game_type)}
              stat={stat}
              onClick={() => setSelectedGameId(stat.game_type)}
            />
          ))}
        </ul>
      )}

      <BaseModal
        visible={Boolean(selectedGame)}
        title={selectedGame?.name}
        onClose={() => setSelectedGameId(null)}
      >
        {selectedGame && <Leaderboard gameType={selectedGame.id} />}
      </BaseModal>
    </section>
  );
};

export default DailyGamesSummary;
