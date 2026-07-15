/** Loading / error placeholder shown while a backend puzzle is being fetched. */

import { useTranslation } from 'react-i18next';

export const PuzzleGate = ({ loading, error, children }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-md py-16 text-center text-slate-400">
        <div className="mb-3 animate-pulse text-4xl">🧩</div>
        <p className="text-sm font-medium">{t('puzzleGate.loading')}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto w-full max-w-md py-16 text-center">
        <div className="mb-3 text-4xl">😵</div>
        <p className="text-sm font-medium text-slate-600">
          {t('puzzleGate.error')}
        </p>
      </section>
    );
  }

  return children;
};
