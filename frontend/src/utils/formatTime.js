/** Games whose scores and in-game timer are measured in milliseconds (all others use seconds). */
const MILLISECOND_GAMES = new Set(['pinpoint']);

export const usesMilliseconds = (gameId) => MILLISECOND_GAMES.has(gameId);

/** Format a whole number of seconds as `mm:ss`, used by the leaderboard and the in-game timer. */
export const formatTime = (totalSeconds) => {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

/** Format a time stored in milliseconds as `mm:ss.mmm`. */
export const formatTimeWithMs = (totalMilliseconds) => {
  const millis = String(totalMilliseconds % 1000).padStart(3, '0');
  return `${formatTime(Math.floor(totalMilliseconds / 1000))}.${millis}`;
};

/** Format a time using the unit the given game stores it in. */
export const formatGameTime = (gameId, value) =>
  usesMilliseconds(gameId) ? formatTimeWithMs(value) : formatTime(value);
