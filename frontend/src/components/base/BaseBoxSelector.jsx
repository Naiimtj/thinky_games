import BaseCheckbox from './BaseCheckbox';

const BaseBoxSelector = ({
  title,
  options = [],
  selectedValue = null,
  disabled = false,
  cardClasses = '',
  onSelect,
  ...props
}) => {
  const handleSelection = (key) => {
    if (!disabled && onSelect) {
      onSelect(key);
    }
  };

  return (
    <div className="rounded-sm flex flex-col gap-4" {...props}>
      <div className="flex flex-row items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
      </div>

      <div
        role="radiogroup"
        aria-label={title}
        className="flex flex-wrap gap-4 w-full max-w-full"
      >
        {options.map((option) => (
          <div
            key={option.key}
            role="radio"
            aria-checked={selectedValue === option.key}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onClick={() => handleSelection(option.key)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelection(option.key);
              }
            }}
            className={`border border-gray-300 bg-gray-50 hover:bg-gray-100 p-4 rounded-sm flex flex-row items-start gap-8 w-full cursor-pointer shadow-md max-w-fit transition-colors focus-visible:ring-2 focus-visible:ring-textPrimary focus-visible:outline-none ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${cardClasses}`}
          >
            <div className="flex flex-col items-start gap-2">
              <span className="text-lg truncate text-gray-900 font-medium">
                {option.label}
              </span>
              {option.description && (
                <span className="text-sm text-gray-600">
                  {option.description}
                </span>
              )}
            </div>
            <BaseCheckbox
              value={selectedValue === option.key}
              id={option.key}
              disabled={disabled}
              aria-hidden={true}
              tabIndex={-1}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BaseBoxSelector;
