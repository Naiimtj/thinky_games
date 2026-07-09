import { useState, useRef, useEffect, useMemo } from 'react';

const BaseSelectInput = ({
  options = [],
  label,
  selectedValue = '',
  placeholder,
  mandatory = false,
  disabled = false,
  noDataText = 'No data available',
  warningMessages = [],
  errorMessages = [],
  error = null,
  loading = false,
  onSelect,
  enableSearch = true,
  disableSort = false,
  freeSolo = false,
  onInputChange,
}) => {
  const displayLabel = label || placeholder || 'Select';
  const hasError = errorMessages?.length > 0 || !!error;
  const errorMessage = error?.message || errorMessages?.[0] || '';

  const sortedOptions = useMemo(() => {
    return disableSort
      ? [...options]
      : [...options].sort((a, b) => a.label.localeCompare(b.label));
  }, [options, disableSort]);

  const selectedOption =
    sortedOptions.find((opt) => opt.value === selectedValue) || null;
  const [inputValue, setInputValue] = useState(selectedOption?.label || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    setInputValue(selectedOption?.label || (freeSolo ? selectedValue : ''));
  }, [selectedValue, selectedOption, freeSolo]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (onInputChange) return options;
    if (!enableSearch || !inputValue) return sortedOptions;
    const lower = inputValue.toLowerCase();
    return sortedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(lower),
    );
  }, [sortedOptions, options, inputValue, enableSearch, onInputChange]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    setHighlightIndex(-1);
    if (onInputChange) onInputChange(val);
  };

  const handleSelect = (opt) => {
    if (onSelect) onSelect(opt.value);
    setInputValue(opt.label);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightIndex((prev) =>
        Math.min(prev + 1, filteredOptions.length - 1),
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && filteredOptions[highlightIndex]) {
        handleSelect(filteredOptions[highlightIndex]);
      } else if (freeSolo && inputValue) {
        const matched = sortedOptions.find(
          (opt) => opt.label.toLowerCase() === inputValue.toLowerCase(),
        );
        if (onSelect) onSelect(matched ? matched.value : inputValue);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleBlur = () => {
    // Delay to allow click on option
    setTimeout(() => {
      if (freeSolo && inputValue && onSelect) {
        const matched = sortedOptions.find(
          (opt) => opt.label.toLowerCase() === inputValue.toLowerCase(),
        );
        if (matched) onSelect(matched.value);
        else onSelect(inputValue);
      }
    }, 150);
  };

  const selectedIcon = selectedOption?.icon;

  return (
    <div className="w-full" ref={containerRef}>
      {displayLabel && (
        <label
          className={`block text-sm font-medium mb-1 ${hasError ? 'text-input-label-error' : 'text-input-label'}`}
        >
          {displayLabel}
          {mandatory && ' *'}
        </label>
      )}
      <div className="relative">
        {selectedIcon && (
          <img
            src={selectedIcon}
            alt=""
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-4 object-cover rounded-sm pointer-events-none z-10"
          />
        )}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={!enableSearch && !freeSolo}
          required={mandatory}
          className={`w-full ${selectedIcon ? 'pl-9' : 'px-3'} py-1.5 text-base sm:text-sm border rounded outline-none transition-colors pr-8 ${
            hasError
              ? 'border-input-error focus:border-input-error focus:ring-1 focus:ring-input-error'
              : 'border-input-border focus:border-input-focus focus:ring-1 focus:ring-input-focus'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white dark:bg-gray-900 dark:text-white'}`}
        />
        {loading && (
          <svg
            className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin w-4 h-4 text-gray-400"
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
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {!loading && (
          <svg
            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}

        {isOpen && !disabled && (
          <ul
            ref={listRef}
            className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg"
          >
            {filteredOptions.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">{noDataText}</li>
            )}
            {filteredOptions.map((opt, i) => (
              <li
                key={opt.value}
                onMouseDown={() => handleSelect(opt)}
                className={`px-3 py-2 text-sm cursor-pointer ${
                  i === highlightIndex
                    ? 'bg-btn-primary/10 text-btn-primary'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${opt.value === selectedValue ? 'font-medium bg-btn-primary/10' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {opt.icon && (
                    <img
                      src={opt.icon}
                      alt=""
                      className="w-5 h-4 object-cover rounded-sm shrink-0"
                    />
                  )}
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    {opt.subtitle && (
                      <span className="text-xs text-gray-500">
                        {opt.subtitle}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {hasError && (
        <p className="mt-1 text-xs text-input-label-error">{errorMessage}</p>
      )}
      {warningMessages?.length > 0 && (
        <p className="mt-1 text-xs text-yellow-600">
          {warningMessages.map((message, index) => (
            <span key={index}>{message}</span>
          ))}
        </p>
      )}
    </div>
  );
};

export default BaseSelectInput;
