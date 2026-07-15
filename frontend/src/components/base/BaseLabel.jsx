import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const BaseLabel = ({
  label,
  tooltip,
  mandatory = false,
  htmlFor,
  className = '',
  ...props
}) => {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!label) return null;

  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}
      {...props}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {mandatory && (
          <span className="text-alert" aria-label={t('shared.required')}>
            {' '}
            *
          </span>
        )}
        {tooltip && (
          <div className="relative inline-block group">
            <button
              type="button"
              aria-label={t('shared.moreInformation', { tooltip })}
              className="pi pi-question-circle text-gray-400 cursor-help text-xs bg-none border-none p-0 inline-flex items-center justify-center"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              onClick={(e) => e.stopPropagation()}
            />
            {showTooltip && (
              <div
                role="tooltip"
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none"
              >
                {tooltip}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </label>
  );
};

export default BaseLabel;
