import { useTranslation } from 'react-i18next';

import { useDailyPuzzle } from '../useDailyPuzzle';

/** Today's Wend words with their definitions, shown once the daily is finished. */
const WendWords = () => {
  const { t } = useTranslation();
  const { puzzle } = useDailyPuzzle('wend', 'daily');
  const words = puzzle?.payload?.words;
  const definitions = puzzle?.payload?.definitions;

  if (!words?.length) return null;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-md dark:bg-slate-800">
      <h2 className="mb-3 text-lg font-black text-slate-800 dark:text-slate-100">
        {t('wendGame.wordsTitle')}
      </h2>
      <ul className="flex flex-col gap-3">
        {words.map((word) => (
          <li key={word} className="flex flex-col gap-1">
            <span className="self-start rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              {word}
            </span>
            {definitions?.[word] && (
              <p className="px-3 text-sm leading-snug text-slate-600 dark:text-slate-300">
                {definitions[word]}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default WendWords;
