import BaseLabel from './BaseLabel';
import { AlertIcon } from './icons';

const BaseTextarea = ({
  label,
  value = '',
  placeholder,
  tooltip,
  mandatory = false,
  disabled = false,
  rows = 4,
  errorMessages = [],
  onChange,
  onBlur,
  ...props
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const hasError = errorMessages?.length > 0;

  return (
    <div className="flex flex-col w-full gap-2">
      {label && (
        <BaseLabel label={label} tooltip={tooltip} mandatory={mandatory} />
      )}

      <textarea
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        rows={rows}
        className={`w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded outline-none transition-colors resize-none ${
          disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'bg-white'
        } ${
          hasError
            ? 'border-alert focus:border-alert'
            : 'focus:border-textPrimary'
        }`}
        {...props}
      />

      {hasError && (
        <div className="flex items-center gap-1 text-alert text-sm">
          <AlertIcon />
          <span>{errorMessages[0]}</span>
        </div>
      )}
    </div>
  );
};

export default BaseTextarea;
