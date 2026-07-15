/**
 * Leaderboard with Daily / Monthly / Global tabs, plus a second table with
 * only the authenticated user's own results for the same game.
 *
 * Times are shown fastest first. The backend already orders ascending, and we
 * sort again defensively so the UI guarantees "lowest time wins".
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { fetchMyScores, fetchRankings } from '../api/scoreApi';
import { formatTime } from '../utils/formatTime';
import BaseSegmentedControl from './base/BaseSegmentedControl';

const rankingTabs = (t) => [
  { value: 'daily', label: t('leaderboard.period.daily') },
  { value: 'monthly', label: t('leaderboard.period.monthly') },
  { value: 'global', label: t('leaderboard.period.global') },
];

/** Return a new array sorted from the fastest to the slowest time. */
const sortByFastest = (entries) =>
  [...entries].sort((a, b) => a.completion_time - b.completion_time);

const formatDate = (isoString, locale) =>
  new Date(isoString).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const colorForRank = (rank) => {
  if (rank === 1) return 'text-yellow-500 dark:text-yellow-400';
  if (rank === 2) return 'text-slate-400 dark:text-slate-300';
  if (rank === 3) return 'text-yellow-800 dark:text-yellow-600';
  return 'text-slate-400 dark:text-slate-500';
};

const RankingRow = ({ entry }) => (
  <li className="flex items-center justify-between border-b border-slate-100 py-1 last:border-0 dark:border-slate-700">
    <span className="flex items-center gap-3">
      <span className={`w-6 text-right font-mono ${colorForRank(entry.rank)}`}>
        {entry.rank}
      </span>
      <span className="font-medium text-slate-700 dark:text-slate-200">
        {entry.username}
      </span>
    </span>
    <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-100">
      {formatTime(entry.completion_time)}
    </span>
  </li>
);

const MyScoreRow = ({ entry, locale }) => (
  <li className="flex items-center justify-between border-b border-slate-100 py-1 last:border-0 dark:border-slate-700">
    <span className="flex items-center gap-3">
      <span className={`w-6 text-right font-mono ${colorForRank(entry.rank)}`}>
        {entry.rank}
      </span>
      <span className="text-slate-500 dark:text-slate-400">
        {formatDate(entry.created_at, locale)}
      </span>
    </span>
    <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-100">
      {formatTime(entry.completion_time)}
    </span>
  </li>
);

const Leaderboard = ({ gameType = 'zip' }) => {
  const { t, i18n } = useTranslation();
  const [activePeriod, setActivePeriod] = useState('daily');
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [myScores, setMyScores] = useState([]);
  const [isMyScoresLoading, setIsMyScoresLoading] = useState(false);
  const [myScoresError, setMyScoresError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const loadRankings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchRankings(activePeriod, gameType);
        if (!isCancelled) setEntries(sortByFastest(data));
      } catch (loadError) {
        if (!isCancelled) setError(loadError.message);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadRankings();
    return () => {
      isCancelled = true;
    };
  }, [activePeriod, gameType]);

  useEffect(() => {
    let isCancelled = false;

    const loadMyScores = async () => {
      setIsMyScoresLoading(true);
      setMyScoresError(null);
      try {
        const data = await fetchMyScores(gameType);
        if (!isCancelled) setMyScores(data);
      } catch (loadError) {
        if (!isCancelled) setMyScoresError(loadError.message);
      } finally {
        if (!isCancelled) setIsMyScoresLoading(false);
      }
    };

    loadMyScores();
    return () => {
      isCancelled = true;
    };
  }, [gameType]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-white p-4 shadow-md dark:bg-slate-800">
        <h2 className="mb-3 text-lg font-black text-slate-800 dark:text-slate-100">
          {t('leaderboard.title')}
        </h2>

        <div className="mb-4">
          <BaseSegmentedControl
            variant="rounded"
            options={rankingTabs(t)}
            value={activePeriod}
            onChange={setActivePeriod}
          />
        </div>

        {isLoading && (
          <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
            {t('leaderboard.loading')}
          </p>
        )}

        {error && !isLoading && (
          <p className="py-6 text-center text-sm text-red-500 dark:text-red-400">
            {t('leaderboard.error')}
          </p>
        )}

        {!isLoading && !error && entries.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
            {t('leaderboard.empty')}
          </p>
        )}

        {!isLoading && !error && entries.length > 0 && (
          <ol className="flex flex-col">
            {entries.map((entry) => (
              <RankingRow
                key={`${entry.rank}-${entry.username}`}
                entry={entry}
              />
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-md dark:bg-slate-800">
        <h2 className="mb-3 text-lg font-black text-slate-800 dark:text-slate-100">
          {t('leaderboard.personalTitle')}
        </h2>

        {isMyScoresLoading && (
          <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
            {t('leaderboard.loading')}
          </p>
        )}

        {myScoresError && !isMyScoresLoading && (
          <p className="py-6 text-center text-sm text-red-500 dark:text-red-400">
            {t('leaderboard.personalError')}
          </p>
        )}

        {!isMyScoresLoading && !myScoresError && myScores.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
            {t('leaderboard.personalEmpty')}
          </p>
        )}

        {!isMyScoresLoading && !myScoresError && myScores.length > 0 && (
          <ol className="flex flex-col">
            {myScores.map((entry) => (
              <MyScoreRow
                key={`${entry.rank}-${entry.created_at}`}
                entry={entry}
                locale={i18n.resolvedLanguage ?? 'es'}
              />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};

export default Leaderboard;
