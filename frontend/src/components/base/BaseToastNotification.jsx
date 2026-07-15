import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BaseIcon from './BaseIcon';

const BaseToastNotification = ({
  message,
  type = 'info',
  duration = 3000,
  display = false,
  onClose,
  ...props
}) => {
  const { t } = useTranslation();
  useEffect(() => {
    if (display && duration) {
      const timer = setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [display, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check';
      case 'warn':
      case 'warning':
        return 'alert';
      case 'info':
        return 'info';
      case 'error':
        return 'alert';
      default:
        return 'info';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'stroke-darkGreen'; // Green
      case 'warn':
      case 'warning':
        return 'stroke-warning'; // Yellow
      case 'error':
        return 'stroke-alert'; // Red
      case 'info':
      default:
        return 'stroke-darkBlue'; // Blue
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-success-active border-l-4 border-success-active';
      case 'warn':
      case 'warning':
        return 'bg-yellow-100 text-warning border-l-4 border-warning';
      case 'error':
        return 'bg-red-100 text-alert border-l-4 border-alert';
      case 'info':
      default:
        return 'bg-blue-100 text-info-active border-l-4 border-info-active';
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed w-full p-4 transition-all duration-500 z-50 ${
        display
          ? 'bottom-0 opacity-100'
          : '-bottom-40 opacity-0 pointer-events-none'
      }`}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      {...props}
    >
      <div className="w-2/3 mx-auto flex flex-row items-center justify-between gap-6 h-full relative">
        <div
          className={`flex flex-row items-center justify-between gap-4 h-full p-8 w-full text-lg font-bold rounded-sm ${getColorClasses()}`}
          role="alert"
        >
          <BaseIcon
            icon={getIcon()}
            size="large"
            className={getIconColor()}
            aria-hidden="true"
          />

          {message && <div className="w-full">{message}</div>}

          <button
            onClick={handleClose}
            aria-label={t('shared.closeNotification')}
            className="absolute right-1 top-1 text-current hover:opacity-70 transition-opacity"
          >
            <BaseIcon
              icon="close"
              size="md"
              className={getIconColor()}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BaseToastNotification;
