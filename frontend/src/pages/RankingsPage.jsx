import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseSelect from '../components/base/BaseSelect';
import DailyGamesSummary from '../components/DailyGamesSummary';
import Leaderboard from '../components/Leaderboard';
import { PLAYABLE_GAMES } from '../games/registry';

const RankingsPage = () => {
  const { t } = useTranslation();
  const [gameId, setGameId] = useState(PLAYABLE_GAMES[0].id);

  const gameOptions = PLAYABLE_GAMES.map((game) => ({
    value: game.id,
    label: t(`games.${game.id}.name`, game.name),
  }));

  return (
    <div className="">
      <h1 className="mb-4 text-2xl font-black text-slate-800 dark:text-slate-100">
        {t('rankingsPage.title')}
      </h1>
      <div className="mb-6">
        <DailyGamesSummary />
      </div>
    </div>
  );
};

export default RankingsPage;
