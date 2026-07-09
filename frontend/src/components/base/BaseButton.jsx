import { useState } from 'react';
import BaseIcon from './BaseIcon';

/** Minimal inline spinner so BaseButton doesn't depend on BaseSpinner's react-i18next requirement. */
const ButtonSpinner = ({ size }) => (
  <svg
    className="animate-spin"
    style={{
      width: size === 'large' ? 20 : 16,
      height: size === 'large' ? 20 : 16,
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
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const colorClasses = {
  primary: {
    contained:
      'bg-btn-primary dark:bg-btn-primary-dark text-white hover:bg-btn-primary-hover dark:hover:bg-btn-primary-hover',
    outlined:
      'border border-btn-primary hover:bg-btn-primary/10 active:bg-btn-primary/20 rounded-full text-sm font-semibold px-4 py-2.5 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
    text: 'dark:text-btn-primary text-btn-primary-dark hover:underline hover:bg-transparent',
  },
  secondary: {
    contained:
      'bg-btn-secondary text-white hover:bg-btn-secondary-hover active:bg-btn-secondary-active',
    outlined:
      'border border-btn-secondary hover:bg-btn-secondary/10 active:bg-btn-secondary/20 rounded-full text-sm font-semibold px-4 py-2.5 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
    text: 'dark:text-btn-secondary text-btn-secondary-dark hover:text-white hover:bg-btn-secondary dark:hover:text-white',
  },
  success: {
    contained:
      'bg-success text-white hover:bg-success-hover active:bg-success-active',
    outlined:
      'border border-success text-success hover:bg-success/10 active:bg-success/20',
    text: 'dark:text-success text-success hover:underline hover:bg-transparent',
  },
  warning: {
    contained:
      'bg-warning text-white hover:bg-warning-hover active:bg-warning-active',
    outlined:
      'border border-warning text-warning hover:bg-warning/10 active:bg-warning/20',
    text: 'dark:text-warning text-warning hover:underline hover:bg-transparent',
  },
  danger: {
    contained:
      'bg-error text-white hover:bg-error-hover active:bg-error-active',
    outlined:
      'border border-error text-error hover:bg-error/10 active:bg-error/20',
    text: 'dark:text-error text-error hover:underline hover:bg-transparent',
  },
  info: {
    contained:
      'bg-info text-white hover:bg-info-hover dark:hover:bg-info-hover-dark active:bg-info-active hover:bg-info/10 active:bg-info/20',
    outlined:
      'border border-info text-info hover:bg-info-hover dark:hover:bg-info-hover-dark hover:text-white',
    text: 'dark:text-info text-info hover:underline hover:bg-transparent',
  },
  help: {
    contained:
      'bg-btn-secondary text-white hover:bg-btn-secondary-hover active:bg-btn-secondary-active',
    outlined:
      'border border-btn-secondary text-btn-secondary hover:bg-btn-secondary/10 active:bg-btn-secondary/20',
    text: 'dark:text-btn-secondary-dark text-btn-secondary hover:underline hover:bg-transparent',
  },
};

const sizes = ['small', 'large'];
const types = ['button', 'submit', 'reset'];
const tooltipPositions = ['top', 'bottom', 'left', 'right'];
const iconPositions = ['left', 'right', 'top', 'bottom'];

const determineStyle = (variant, outlined, text) => {
  if (text) return 'text';
  if (outlined) return 'outlined';
  if (variant === 'secondary') return 'outlined';
  return 'contained';
};

export const AppButton = ({
  label,
  type = types[0] || 'button',
  size = sizes[0] || 'small',
  className = '',
  loading = false,
  disabled = false,
  variant = 'primary',
  outlined = false,
  text = false,
  tooltip,
  tooltipPosition = tooltipPositions[0] || 'top',
  tooltipDisabled = false,
  tooltipShowDelay = 100,
  tooltipHideDelay = 0,
  icon,
  iconPosition = iconPositions[0] || 'left',
  iconSize,
  iconColor,
  iconClassName = '',
  htmlFor,
  children,
  onClick,
  ...rest
}) => {
  const buttonStyle = determineStyle(variant, outlined, text);

  const hasPaddingOverride =
    className.includes('p-') ||
    className.includes('px-') ||
    className.includes('py-');

  const getPaddingClasses = () => {
    if (text) return 'p-0 bg-transparent shadow-none';
    if (hasPaddingOverride) return '';
    return 'px-3 py-2';
  };

  const getIconSize = () => {
    if (iconSize) return iconSize;
    return size === 'large' ? 'large' : 'md';
  };

  const getFlexDirection = () => {
    if (iconPosition === 'top') return 'flex-col';
    if (iconPosition === 'bottom') return 'flex-col-reverse';
    if (iconPosition === 'right') return 'flex-row-reverse';
    return 'flex-row';
  };

  const renderIcon = () => {
    if (!icon) return null;
    return (
      <BaseIcon
        icon={icon}
        size={getIconSize()}
        color={iconColor || 'currentColor'}
        className={iconClassName}
      />
    );
  };

  const renderContent = () => (
    <>
      {loading && <ButtonSpinner size={size} />}
      {!loading &&
        icon &&
        (iconPosition === 'left' || iconPosition === 'top') &&
        renderIcon()}
      {label || children}
      {!loading &&
        icon &&
        (iconPosition === 'right' || iconPosition === 'bottom') &&
        renderIcon()}
    </>
  );

  const contentButton = htmlFor ? (
    <label
      htmlFor={htmlFor}
      className={`flex items-center gap-2 ${getFlexDirection()} ${
        hasPaddingOverride ? '' : 'px-3 py-2'
      } ${className} ${
        size === 'large' ? 'px-6 py-3 text-lg font-semibold' : ''
      } ${
        disabled || loading
          ? 'pointer-events-none opacity-50 cursor-not-allowed'
          : 'cursor-pointer'
      }`}
      {...rest}
    >
      {renderContent()}
    </label>
  ) : (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded text-sm font-medium transition-colors cursor-pointer ${getFlexDirection()} ${getPaddingClasses()} ${(colorClasses[variant] || colorClasses.primary)[buttonStyle] || ''} ${className} ${
        !text && size === 'large' ? 'px-6 py-3 text-lg font-semibold' : ''
      } ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...rest}
    >
      {renderContent()}
    </button>
  );

  if (!tooltip || tooltipDisabled) {
    return contentButton;
  }

  const [showTooltip, setShowTooltip] = useState(false);

  const tooltipPlacementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {contentButton}
      {showTooltip && (
        <span
          className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap pointer-events-none ${tooltipPlacementClasses[tooltipPosition] || tooltipPlacementClasses.top}`}
        >
          {tooltip}
        </span>
      )}
    </span>
  );
};

export default AppButton;
