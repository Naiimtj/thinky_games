import { useState, useMemo } from 'react';
import BaseLabel from './BaseLabel';

const BaseAutocompleteInput = ({
  options = [],
  label,
  selectedValue,
  tooltip,
  placeholder,
  mandatory = false,
  disabled = false,
  onSelect,
  onSearch,
  ...props
}) => {
  const [inputId] = useState(() => crypto.randomUUID());
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Derive selectedOption from selectedValue instead of keeping it in state
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === selectedValue) || null,
    [selectedValue, options],
  );

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (options.length === 0) return [];
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, options]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleSelectOption = (option) => {
    setSearchTerm(option.label);
    setShowSuggestions(false);
    if (onSelect) {
      onSelect(option.value);
    }
  };

  const displayValue = selectedOption?.label || searchTerm;
  const displayPlaceholder = placeholder || label || 'Select';
  const listboxId = `${inputId}-listbox`;

  return (
    <div className="flex flex-col items-start w-full gap-1">
      {label && (
        <BaseLabel
          label={label}
          tooltip={tooltip}
          mandatory={mandatory}
          htmlFor={inputId}
        />
      )}

      <div className="relative w-full">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showSuggestions && filteredOptions.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          placeholder={displayPlaceholder}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          disabled={disabled}
          className="w-full px-3 py-2 border-2 border-input-border rounded-md outline-none focus:border-input-focus transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-white"
          {...props}
        />

        {showSuggestions && filteredOptions.length > 0 && (
          <div
            id={listboxId}
            className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-300 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
          >
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                aria-current={
                  option.value === selectedValue ? 'true' : undefined
                }
                onClick={() => handleSelectOption(option)}
                className="w-full px-3 py-2 text-left hover:bg-btn-primary/10 border-b border-gray-100 last:border-b-0 transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-btn-primary focus-visible:outline-none"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {showSuggestions && filteredOptions.length === 0 && searchTerm && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-300 rounded-md shadow-lg z-50 p-3 text-gray-500 text-center">
            No options found
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseAutocompleteInput;
