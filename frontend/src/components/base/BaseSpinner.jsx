import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const BAHAI_QUOTES = [
  'bahaiQuotes.quote1',
  'bahaiQuotes.quote2',
  'bahaiQuotes.quote3',
  'bahaiQuotes.quote4',
  'bahaiQuotes.quote5',
  'bahaiQuotes.quote6',
  'bahaiQuotes.quote7',
  'bahaiQuotes.quote8',
  'bahaiQuotes.quote9',
  'bahaiQuotes.quote10',
  'bahaiQuotes.quote11',
  'bahaiQuotes.quote12',
  'bahaiQuotes.quote13',
  'bahaiQuotes.quote14',
  'bahaiQuotes.quote15',
  'bahaiQuotes.quote16',
  'bahaiQuotes.quote17',
  'bahaiQuotes.quote18',
  'bahaiQuotes.quote19',
  'bahaiQuotes.quote20',
  'bahaiQuotes.quote21',
  'bahaiQuotes.quote22',
  'bahaiQuotes.quote23',
  'bahaiQuotes.quote24',
  'bahaiQuotes.quote25',
  'bahaiQuotes.quote26',
  'bahaiQuotes.quote27',
  'bahaiQuotes.quote28',
  'bahaiQuotes.quote29',
  'bahaiQuotes.quote30',
  'bahaiQuotes.quote31',
  'bahaiQuotes.quote32',
  'bahaiQuotes.quote33',
  'bahaiQuotes.quote34',
  'bahaiQuotes.quote35',
  'bahaiQuotes.quote36',
  'bahaiQuotes.quote37',
  'bahaiQuotes.quote38',
  'bahaiQuotes.quote39',
  'bahaiQuotes.quote40',
  'bahaiQuotes.quote41',
  'bahaiQuotes.quote42',
  'bahaiQuotes.quote43',
  'bahaiQuotes.quote44',
  'bahaiQuotes.quote45',
];

const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * BAHAI_QUOTES.length);
  return BAHAI_QUOTES[randomIndex];
};

const BaseSpinner = ({ size = 'md', noCurrentQuote = false, ...props }) => {
  const { t } = useTranslation();
  const [currentQuote, setCurrentQuote] = useState(() => getRandomQuote());

  const sizeClasses = {
    xs: 12,
    sm: 16,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 80,
    '3xl': 96,
    '4xl': 112,
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote(getRandomQuote());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div {...props} className="flex flex-col items-center">
      <svg
        className="animate-spin text-btn-primary"
        style={{
          width: sizeClasses[size] || sizeClasses.md,
          height: sizeClasses[size] || sizeClasses.md,
        }}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      {!noCurrentQuote && (
        <div className="mt-4 text-sm italic text-gray-600 max-w-md text-center">
          "{t(currentQuote)}"
        </div>
      )}
    </div>
  );
};

export default BaseSpinner;
