import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { GAMES, getGameIcon } from '../games/registry';
import { useDailyCountdown } from '../games/useDailyCountdown';
import { useAuthStore } from '../store/useAuthStore';
import { useDailyGamesStore } from '../store/useDailyGamesStore';

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

const GameName = ({ game }) => {
  const { t } = useTranslation();
  return t(`games.${game.id}.name`, game.name);
};

const GameTagline = ({ game }) => {
  const { t } = useTranslation();
  return t(`games.${game.id}.tagline`, game.tagline);
};

const ComingSoonCard = ({ game }) => (
  <div className="flex flex-col rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 opacity-70 dark:border-slate-600 dark:bg-slate-800/60">
    <GameIcon game={game} />
    <h3 className="text-lg font-black text-slate-700 dark:text-slate-200">
      <GameName game={game} />
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400">
      <GameTagline game={game} />
    </p>
    <span className="mt-4 inline-block w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
      <ComingSoonLabel />
    </span>
  </div>
);

const ComingSoonLabel = () => {
  const { t } = useTranslation();
  return t('home.comingSoon');
};

const PlayableCard = ({ game, isAuthenticated, completedToday }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleCardClick = () => {
    navigate(`/games/${game.id}/${isAuthenticated ? 'daily' : 'demo'}`);
  };

  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {completedToday && (
        <span
          title={t('home.dailyCompleted')}
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow"
        >
          ✓
        </span>
      )}
      <GameIcon game={game} />
      <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
        <GameName game={game} />
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        <GameTagline game={game} />
      </p>
      <div className="mt-4 flex gap-2">
        {!isAuthenticated && (
          <Link
            to={`/games/${game.id}/demo`}
            onClick={(event) => event.stopPropagation()}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {t('home.playDemo')}
          </Link>
        )}
        {isAuthenticated ? (
          <Link
            to={`/games/${game.id}/daily`}
            onClick={(event) => event.stopPropagation()}
            className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-600"
          >
            {completedToday
              ? `${t('home.dailyChallenge')} ✓`
              : t('home.dailyChallenge')}
          </Link>
        ) : null}
      </div>
    </div>
  );
};

const HomePage = () => {
  const { t } = useTranslation();
  const isAuthenticated = Boolean(useAuthStore((state) => state.user));
  const countdown = useDailyCountdown();
  const playedGameIds = useDailyGamesStore((state) => state.playedGameIds);
  const loadGamesCatalog = useDailyGamesStore(
    (state) => state.loadGamesCatalog,
  );
  const loadPlayedGames = useDailyGamesStore((state) => state.loadPlayedGames);
  const [games, setGames] = useState(FALLBACK_GAMES);

  useEffect(() => {
    let cancelled = false;
    loadGamesCatalog().then((list) => {
      if (!cancelled && Array.isArray(list) && list.length > 0) setGames(list);
    });
    return () => {
      cancelled = true;
    };
  }, [loadGamesCatalog]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadPlayedGames();
  }, [isAuthenticated, loadPlayedGames]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">
          {t('home.title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {isAuthenticated
            ? t('home.subtitle.authenticated')
            : t('home.subtitle.guest')}
        </p>
        <p className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          {t('home.nextDaily', { countdown })}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) =>
          game.playable ? (
            <PlayableCard
              key={game.id}
              game={game}
              isAuthenticated={isAuthenticated}
              completedToday={isAuthenticated && playedGameIds.has(game.id)}
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
