/**
 * Leaderboard with Daily / Monthly / Global tabs.
 *
 * Times are shown fastest first. The backend already orders ascending, and we
 * sort again defensively so the UI guarantees "lowest time wins".
 */

import { useEffect, useState } from 'react';

import { fetchRankings } from '../api/scoreApi';
import { formatTime } from '../utils/formatTime';
import BaseSegmentedControl from './base/BaseSegmentedControl';

const RANKING_TABS = [
  { value: 'daily', label: 'Diario' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'global', label: 'Global' },
];

/** Return a new array sorted from the fastest to the slowest time. */
const sortByFastest = (entries) =>
  [...entries].sort((a, b) => a.completion_time - b.completion_time);

const RankingRow = ({ entry }) => (
  <li className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0 dark:border-slate-700">
    <span className="flex items-center gap-3">
      <span className="w-6 text-right font-mono text-sm text-slate-400 dark:text-slate-500">
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

const Leaderboard = ({ gameType = 'zip' }) => {
  const [activePeriod, setActivePeriod] = useState(RANKING_TABS[0].value);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <section className="rounded-2xl bg-white p-4 shadow-md dark:bg-slate-800">
      <h2 className="mb-3 text-lg font-black text-slate-800 dark:text-slate-100">
        Clasificación
      </h2>

      <div className="mb-4">
        <BaseSegmentedControl
          variant="rounded"
          options={RANKING_TABS}
          value={activePeriod}
          onChange={setActivePeriod}
        />
      </div>

      {isLoading && (
        <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
          Cargando…
        </p>
      )}

      {error && !isLoading && (
        <p className="py-6 text-center text-sm text-red-500 dark:text-red-400">
          No se pudo cargar la clasificación.
        </p>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
          Aún no hay tiempos registrados.
        </p>
      )}

      {!isLoading && !error && entries.length > 0 && (
        <ol className="flex flex-col">
          {entries.map((entry) => (
            <RankingRow key={`${entry.rank}-${entry.username}`} entry={entry} />
          ))}
        </ol>
      )}
    </section>
  );
};

export default Leaderboard;
