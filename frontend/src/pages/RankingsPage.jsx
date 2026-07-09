import { useState } from 'react';

import BaseSelect from '../components/base/BaseSelect';
import Leaderboard from '../components/Leaderboard';
import { PLAYABLE_GAMES } from '../games/registry';

const GAME_OPTIONS = PLAYABLE_GAMES.map((game) => ({
  value: game.id,
  label: game.name,
}));

const RankingsPage = () => {
  const [gameId, setGameId] = useState(PLAYABLE_GAMES[0].id);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-2xl font-black text-slate-800 dark:text-slate-100">
        Rankings
      </h1>
      <div className="mb-4">
        <BaseSelect
          label="Juego"
          options={GAME_OPTIONS}
          value={gameId}
          onChange={setGameId}
        />
      </div>
      <Leaderboard gameType={gameId} />
    </div>
  );
};

export default RankingsPage;
