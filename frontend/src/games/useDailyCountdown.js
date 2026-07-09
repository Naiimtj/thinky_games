/** Ticking countdown until the next daily puzzle rotation (UTC midnight). */

import { useEffect, useState } from 'react';

const msUntilNextUtcMidnight = () => {
  const now = new Date();
  const nextMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return nextMidnight - now.getTime();
};

const formatCountdown = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
    2,
    '0',
  );
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/** Returns "HH:MM:SS" remaining until the next daily puzzle, updated every second. */
export const useDailyCountdown = () => {
  const [remainingMs, setRemainingMs] = useState(msUntilNextUtcMidnight);

  useEffect(() => {
    const intervalId = setInterval(
      () => setRemainingMs(msUntilNextUtcMidnight()),
      1000,
    );
    return () => clearInterval(intervalId);
  }, []);

  return formatCountdown(remainingMs);
};
