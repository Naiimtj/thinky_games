const BaseNumberInput = ({
  label,
  value,
  placeholder,
  hideDetails = false,
  mandatory = false,
  disabled = false,
  hint,
  helperText,
  error = false,
  errorMessages = [],
  warningMessages = [],
  onChange,
  onBlur,
  field,
  formatSeparator,
  formatEvery = 3,
  maxDigits,
  ref,
  ...props
}) => {
  const currentValue = field?.value ?? value ?? '';

  const formatWithSeparator = (numString, separator, every) => {
    if (!separator || !numString) return numString;
    const cleaned = numString.replaceAll(/[-.]/g, '');
    if (!cleaned) return '';
    const groups = [];
    for (let i = 0; i < cleaned.length; i += every) {
      groups.push(cleaned.slice(i, i + every));
    }
    return groups.join(separator);
  };

  const removeFormat = (str) => (str ? str.replaceAll(/[-.]/g, '') : '');

  const handleChange = (e) => {
    const inputValue = e.target.value;

    if (inputValue === '') {
      if (field) field.onChange('');
      else if (onChange) onChange('');
      return;
    }

    const cleanValue = removeFormat(inputValue);
    if (!/^\d*$/.test(cleanValue)) return;
    if (maxDigits && cleanValue.length > maxDigits) return;

    const formattedValue = formatSeparator
      ? formatWithSeparator(cleanValue, formatSeparator, formatEvery)
      : cleanValue;

    if (field) field.onChange(formattedValue);
    else if (onChange) onChange(formattedValue);
  };

  const handleBlur = (e) => {
    if (field) field.onBlur();
    if (onBlur) onBlur(e);
  };

  const hasError = error || errorMessages.length > 0;
  const displayHelperText =
    errorMessages[0] || warningMessages[0] || helperText || hint;
  const displayLabel = mandatory && label ? `${label} *` : label;

  return (
    <div className="w-full">
      {displayLabel && (
        <label
          className={`block text-sm font-medium mb-1 ${hasError ? 'text-input-label-error' : 'text-input-label'}`}
        >
          {displayLabel}
        </label>
      )}
      <input
        {...props}
        ref={ref}
        value={currentValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        type="text"
        inputMode="numeric"
        required={mandatory}
        className={`w-full px-3 py-2 text-base sm:text-sm border rounded outline-none transition-colors ${
          hasError
            ? 'border-input-error focus:border-input-error focus:ring-1 focus:ring-input-error'
            : 'border-input-border focus:border-input-focus focus:ring-1 focus:ring-input-focus'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white'}`}
      />
      {!hideDetails && displayHelperText && (
        <p
          className={`mt-1 text-xs ${hasError ? 'text-input-label-error' : 'text-input-helper'}`}
        >
          {displayHelperText}
        </p>
      )}
    </div>
  );
};

export default BaseNumberInput;
