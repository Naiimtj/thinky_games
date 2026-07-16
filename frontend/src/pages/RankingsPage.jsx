import { useTranslation } from 'react-i18next';

import DailyGamesSummary from '../components/DailyGamesSummary';

const RankingsPage = () => {
  const { t } = useTranslation();

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
