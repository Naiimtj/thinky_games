const BaseToggle = ({
  label,
  value = false,
  disabled = false,
  onChange,
  ...props
}) => {
  const handleChange = () => {
    if (onChange) {
      onChange(!value);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={handleChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
          value ? 'bg-darkPrimary' : 'bg-gray-300'
        } ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:opacity-80'
        }`}
        {...props}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-1 ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {label && (
        <label className="text-sm font-medium text-darkPrimary">{label}</label>
      )}
    </div>
  );
};

export default BaseToggle;
