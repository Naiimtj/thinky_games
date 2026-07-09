import { useState } from 'react';
import { SearchIcon } from './icons';
import BaseIcon from './BaseIcon';

const BaseSearchBar = ({
  placeholder = 'Search...',
  iconPosition = 'left',
  disabled = false,
  disableIcon = false,
  clearable = false,
  onSearch,
  value: controlledValue,
}) => {
  const isControlled = controlledValue !== undefined;
  const [internalInput, setInternalInput] = useState('');
  const searchInput = isControlled ? controlledValue : internalInput;

  const handleChange = (e) => {
    const value = e.target.value;
    if (!isControlled) setInternalInput(value);
    if (onSearch) onSearch(value);
  };

  const handleClear = () => {
    if (!isControlled) setInternalInput('');
    if (onSearch) onSearch('');
  };

  return (
    <div className="flex items-center w-full px-3 py-2 border-2 border-gray-400 hover:border-primary rounded-md focus-within:border-textPrimary transition-colors">
      {!disableIcon && iconPosition === 'left' && !searchInput && (
        <SearchIcon className="text-gray-400 mr-2" />
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={searchInput}
        onChange={handleChange}
        className="flex-1 bg-transparent outline-none text-base sm:text-sm text-gray-900 placeholder-gray-400"
        disabled={disabled}
      />
      {clearable && searchInput && (
        <BaseIcon
          icon="close"
          size="small"
          className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
          onClick={handleClear}
        />
      )}
      {!disableIcon && iconPosition === 'right' && !searchInput && (
        <SearchIcon className="text-gray-400 ml-2" />
      )}
    </div>
  );
};

export default BaseSearchBar;
