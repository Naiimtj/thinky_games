/**
 * Personal per-game summary shown on the Rankings page: today's time (if
 * played), highlighted green when it's a new personal best, the player's
 * all-time best/worst times, and their daily/monthly/global rank. Every game
 * is listed, even ones the player has never played. Clicking a row opens the
 * full leaderboard for that game in a modal.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PLAYABLE_GAMES } from '../games/registry';
import { useDailyGamesStore } from '../store/useDailyGamesStore';
import { formatTime } from '../utils/formatTime';
import BaseModal from './base/BaseModal';
import Leaderboard from './Leaderboard';

/** Merge the backend stats/ranks (only for games with history) with every playable game. */
const mergeWithAllGames = (stats, ranks, dailyTop) => {
  const statsByGameType = new Map(stats.map((stat) => [stat.game_type, stat]));
  const ranksByGameType = new Map(ranks.map((rank) => [rank.game_type, rank]));
  const topByGameType = new Map(
    dailyTop.map((entry) => [entry.game_type, entry.entries]),
  );
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
    top_entries: topByGameType.get(game.id) ?? [],
  }));
};

const colorForRank = (rank) => {
  if (rank === 1) return 'text-yellow-500 dark:text-yellow-400';
  if (rank === 2) return 'text-slate-400 dark:text-slate-300';
  if (rank === 3) return 'text-yellow-800 dark:text-yellow-600';
  return 'text-slate-400 dark:text-slate-500';
};

const RankBadge = ({ label, rank }) => (
  <span className="text-slate-400 dark:text-slate-500">
    {label}: <span className="font-mono">{rank ?? '-'}</span>
  </span>
);

const DailyTopMini = ({ entries }) => {
  const entriesByRank = new Map(
    (entries ?? []).map((entry) => [entry.rank, entry]),
  );
  const slots = [1, 2, 3].map(
    (rank) =>
      entriesByRank.get(rank) ?? {
        rank,
        username: null,
        completion_time: null,
      },
  );
  return (
    <ol className="flex flex-col items-start gap-1 text-xs">
      {slots.map((entry) => (
        <li key={entry.rank} className="flex items-center gap-1">
          <span className={`font-mono font-bold ${colorForRank(entry.rank)}`}>
            {entry.rank}
          </span>
          <span className="max-w-[6rem] truncate text-slate-500 dark:text-slate-400">
            {entry.username ?? '-'}
          </span>
          <span className="font-mono text-slate-600 dark:text-slate-300">
            {entry.completion_time !== null
              ? formatTime(entry.completion_time)
              : '-'}
          </span>
        </li>
      ))}
    </ol>
  );
};

const GameSummaryRow = ({ game, stat, onClick, t }) => {
  const hasHistory = stat.best_time !== null;
  const isNewBest = stat.played_today && stat.today_time <= stat.best_time;

  return (
    <li className="w-full border-b border-slate-100 last:border-0 dark:border-slate-700">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col gap-2 border-b border-slate-100 p-3 text-left last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40"
      >
        <div className="flex w-full items-center justify-between">
          <RankBadge label={t('dailySummary.rank')} rank={stat.daily_rank} />
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex md:flex-row flex-col md:justify-start justify-center items-center gap-3">
            {game?.icon && (
              <img src={game.icon} alt="" className="h-8 w-8 flex-shrink-0" />
            )}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {game ? t(`games.${game.id}.name`, game.name) : stat.game_type}
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
            <div className="flex flex-row items-start justify-between gap-4 w-full">
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 dark:text-slate-500 font-bold">
                  {t('dailySummary.best')}:{' '}
                  <span className="font-normal">
                    {hasHistory ? formatTime(stat.best_time) : '-'}
                  </span>
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-bold">
                  {t('dailySummary.worst')}:{' '}
                  <span className="font-normal">
                    {hasHistory ? formatTime(stat.worst_time) : '-'}
                  </span>
                </span>
              </div>

              <DailyTopMini entries={stat.top_entries} />
            </div>
          </div>
        </div>
      </button>
    </li>
  );
};

const DailyGamesSummary = () => {
  const { t } = useTranslation();
  const stats = useDailyGamesStore((state) => state.summary);
  const ranks = useDailyGamesStore((state) => state.ranks);
  const dailyTop = useDailyGamesStore((state) => state.dailyTop);
  const dailyLoadedAt = useDailyGamesStore((state) => state.dailyLoadedAt);
  const isLoadingDaily = useDailyGamesStore((state) => state.isLoadingDaily);
  const dailyError = useDailyGamesStore((state) => state.dailyError);
  const loadDailyData = useDailyGamesStore((state) => state.loadDailyData);
  const [selectedGameId, setSelectedGameId] = useState(null);

  useEffect(() => {
    loadDailyData();
  }, [loadDailyData]);

  const isLoading = dailyLoadedAt === null && isLoadingDaily;
  const error = dailyLoadedAt === null ? dailyError?.message : null;
  const rows = mergeWithAllGames(stats, ranks, dailyTop);
  const selectedGame = PLAYABLE_GAMES.find(
    (game) => game.id === selectedGameId,
  );

  return (
    <section className="rounded-2xl bg-white p-4 shadow-md dark:bg-slate-800 w-full">
      <h2 className="mb-3 text-lg font-black text-slate-800 dark:text-slate-100">
        {t('dailySummary.title')}
      </h2>

      {isLoading && (
        <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
          {t('dailySummary.loading')}
        </p>
      )}

      {error && !isLoading && (
        <p className="py-6 text-center text-sm text-red-500 dark:text-red-400">
          {t('dailySummary.error')}
        </p>
      )}

      {!isLoading && !error && (
        <ul className="flex flex-col">
          {rows.map((stat) => (
            <GameSummaryRow
              key={stat.game_type}
              game={PLAYABLE_GAMES.find((game) => game.id === stat.game_type)}
              stat={stat}
              t={t}
              onClick={() => setSelectedGameId(stat.game_type)}
            />
          ))}
        </ul>
      )}

      <BaseModal
        visible={Boolean(selectedGame)}
        title={
          selectedGame
            ? t(`games.${selectedGame.id}.name`, selectedGame.name)
            : undefined
        }
        onClose={() => setSelectedGameId(null)}
      >
        {selectedGame && <Leaderboard gameType={selectedGame.id} />}
      </BaseModal>
    </section>
  );
};

export default DailyGamesSummary;
