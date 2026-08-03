import { useState } from 'react';
import BaseLabel from './BaseLabel';

const BaseTextInput = ({
  label,
  value = '',
  tooltip,
  placeholder,
  hideDetails = false,
  mandatory = false,
  disabled = false,
  hint,
  variant = 'outlined',
  appendIcon,
  prependIcon,
  appendIconComponent,
  prependIconComponent,
  appendIconAriaLabel,
  prependIconAriaLabel,
  onAppendIconClick,
  onPrependIconClick,
  updateOnBlur = false,
  backgroundColor,
  warningMessages = [],
  errorMessages = [],
  error,
  maxLength,
  showCharCount = false,
  helperText,
  onChange,
  onEnter,
  onBlur,
  ref,
  ...props
}) => {
  const [tempValue, setTempValue] = useState(value ?? '');

  // Handle both controlled and uncontrolled inputs
  const displayValue = props.field ? props.field.value : tempValue;

  const handleChange = (e) => {
    const inputValue = e.target.value;

    // If using react-hook-form field prop
    if (props.field) {
      props.field.onChange(inputValue);
    } else {
      setTempValue(inputValue);
      if (!updateOnBlur && onChange) {
        onChange(inputValue);
      }
    }
  };

  const handleBlur = () => {
    // For react-hook-form
    if (props.field) {
      props.field.onBlur();
    }

    // For legacy usage
    if (updateOnBlur && onChange && !props.field) {
      onChange(tempValue);
    }
    if (onBlur) {
      onBlur();
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === 'Enter') {
      if (updateOnBlur && onChange && !props.field) {
        onChange(tempValue);
      }
      if (onEnter) {
        onEnter();
      }
    }
  };

  // Determine error state (from react-hook-form or legacy prop)
  const hasError = !!error || errorMessages?.length > 0;
  const errorMessage = error?.message || errorMessages?.[0] || '';

  const variantClasses = {
    filled:
      'bg-gray-100 border-b-2 border-gray-300 focus-within:border-textPrimary',
    underlined:
      'bg-white border-b-2 border-gray-300 focus-within:border-textPrimary',
    outlined:
      'bg-white border-2 border-gray-300 rounded-md focus-within:border-textPrimary',
    plain: 'bg-white border-none',
    solo: 'bg-white border-2 border-gray-300 rounded-md focus-within:border-textPrimary',
    'solo-inverted':
      'bg-gray-100 border-2 border-gray-300 rounded-md focus-within:border-textPrimary',
    'solo-filled':
      'bg-gray-100 border-none rounded-md focus-within:ring-2 focus-within:ring-blue-500',
  };

  const hasPrependAction = Boolean(prependIconComponent || onPrependIconClick);
  const hasAppendAction = Boolean(appendIconComponent || onAppendIconClick);
  const useContainerLayout = Boolean(
    prependIcon || appendIcon || hasPrependAction || hasAppendAction,
  );

  // Styling for input when inside container (with icons)
  const inputInContainerClass = `flex-1 bg-transparent outline-none border-none text-base sm:text-sm text-gray-900 placeholder-gray-400 ${
    disabled ? 'cursor-not-allowed opacity-60' : ''
  } ${hasError ? 'border-alert focus:border-alert' : ''} ${
    prependIconComponent || appendIconComponent || prependIcon || appendIcon
      ? 'p-2'
      : 'px-3 py-2'
  }`;

  // Styling for standalone input (no icons)
  const standaloneInputClass = `w-full px-3 py-2 text-base sm:text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors ${
    variantClasses[variant] || variantClasses.outlined
  } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''} ${
    hasError ? 'border-alert focus:border-alert' : ''
  } ${backgroundColor || ''}`;

  return (
    <div className="flex flex-col items-start w-full gap-1">
      <BaseLabel label={label} tooltip={tooltip} mandatory={mandatory} />

      <div className="w-full relative">
        {useContainerLayout && (
          <div
            className={`flex items-center w-full ${
              variantClasses[variant] || variantClasses.outlined
            } ${hasError ? 'border-alert' : ''} transition-colors`}
          >
            {prependIcon && (
              <i
                className={`${prependIcon} text-gray-400 dark:text-gray-500 ml-2`}
              />
            )}
            {prependIconComponent && (
              <button
                type="button"
                onClick={onPrependIconClick}
                disabled={disabled}
                aria-label={prependIconAriaLabel}
                className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-60"
              >
                {prependIconComponent}
              </button>
            )}
            <input
              ref={ref}
              type="text"
              value={displayValue}
              placeholder={placeholder}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyUp={handleKeyUp}
              disabled={disabled}
              maxLength={maxLength}
              className={inputInContainerClass}
              {...(props.field ? {} : { ...props })}
            />
            {appendIcon && (
              <i
                className={`${appendIcon} text-gray-400 dark:text-gray-500 mr-2 `}
              />
            )}
            {appendIconComponent && (
              <button
                type="button"
                onClick={onAppendIconClick}
                disabled={disabled}
                aria-label={appendIconAriaLabel}
                className="mr-2 text-gray-500 dark:text-gray-400 transition-colors disabled:opacity-60 cursor-pointer hover:text-textPrimary dark:hover:text-btn-primary"
              >
                {appendIconComponent}
              </button>
            )}
          </div>
        )}

        {!useContainerLayout && (
          <input
            ref={ref}
            type="text"
            value={displayValue}
            placeholder={placeholder}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyUp={handleKeyUp}
            disabled={disabled}
            maxLength={maxLength}
            className={standaloneInputClass}
            {...(props.field ? {} : { ...props })}
          />
        )}
      </div>

      {/* Character Count */}
      {showCharCount && maxLength && (
        <div className="w-full flex justify-end text-xs text-gray-500 dark:text-gray-400">
          {displayValue?.length || 0}/{maxLength}
        </div>
      )}

      {/* Error Messages - Priority: react-hook-form error > custom error prop > legacy errorMessages */}
      {hasError && (
        <em className="text-alert text-sm flex items-start gap-1">
          <i className="pi pi-exclamation-circle mt-0.5" />
          <span>{errorMessage}</span>
        </em>
      )}

      {/* Warning Messages */}
      {warningMessages?.length > 0 && !hasError && (
        <em className="text-yellow-600 dark:text-yellow-400 text-sm flex items-start gap-1">
          <i className="pi pi-exclamation-circle mt-0.5" />
          <span>
            {warningMessages.map((message) => (
              <span key={message}>{message}</span>
            ))}
          </span>
        </em>
      )}

      {/* Helper Text / Hint */}
      {(helperText || hint) && !hideDetails && (
        <small className="text-gray-500 dark:text-gray-400 text-xs">
          {helperText || hint}
        </small>
      )}
    </div>
  );
};

export default BaseTextInput;
