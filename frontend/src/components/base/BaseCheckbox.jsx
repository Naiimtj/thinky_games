const generateId = () => crypto.randomUUID();

const sizeMap = {
  small: 'w-4 h-4',
  medium: 'w-5 h-5',
  large: 'w-6 h-6',
};

const colorAccent = {
  primary: 'accent-btn-primary',
  secondary: 'accent-btn-secondary',
  success: 'accent-success',
  warning: 'accent-warning',
  error: 'accent-error',
};

const BaseCheckbox = ({
  label,
  value = false,
  checked,
  id,
  labelPosition = 'right',
  disabled = false,
  onChange,
  children,
  color = 'primary',
  size = 'medium',
  className = '',
  labelClassName = '',
  ...rest
}) => {
  const inputId = id ? String(id) : generateId();
  const isChecked = checked !== undefined ? checked : value;

  const handleChange = (event) => {
    const newChecked = event.target.checked;

    if (onChange) {
      onChange(newChecked, {
        value: newChecked,
        id,
        event,
      });
    }
  };

  const checkbox = (
    <input
      type="checkbox"
      id={inputId}
      checked={isChecked}
      onChange={handleChange}
      disabled={disabled}
      className={`${sizeMap[size] || sizeMap.medium} ${colorAccent[color] || colorAccent.primary} cursor-pointer disabled:cursor-not-allowed`}
      {...rest}
    />
  );

  if (label) {
    const isLeft = labelPosition === 'left';

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isLeft && (
          <label
            htmlFor={inputId}
            className={`cursor-pointer select-none ${disabled ? 'opacity-50' : ''} ${labelClassName}`}
          >
            {label}
          </label>
        )}
        {checkbox}
        {!isLeft && (
          <label
            htmlFor={inputId}
            className={`cursor-pointer select-none ${disabled ? 'opacity-50' : ''} ${labelClassName}`}
          >
            {label}
          </label>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      {checkbox}
      {children}
    </div>
  );
};

export default BaseCheckbox;
