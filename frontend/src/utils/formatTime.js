/** Format a whole number of seconds as `mm:ss`, used by the leaderboard and the in-game timer. */
export const formatTime = (totalSeconds) => {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};
