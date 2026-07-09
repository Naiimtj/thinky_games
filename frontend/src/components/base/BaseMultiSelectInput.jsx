import { useState, useEffect } from 'react';
import BaseLabel from './BaseLabel';

const BaseMultiSelectInput = ({
  options = [],
  label,
  selectedValues = [],
  tooltip,
  mandatory = false,
  disabled = false,
  display = 'chip',
  onSelect,
}) => {
  const [localSelected, setLocalSelected] = useState(selectedValues);

  useEffect(() => {
    setLocalSelected(selectedValues);
  }, [selectedValues]);

  const handleChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setLocalSelected(selectedOptions);
    if (onSelect) {
      onSelect(selectedOptions);
    }
  };

  const getSelectedLabels = () => {
    return options
      .filter((option) => localSelected.includes(option.value))
      .map((option) => option.label);
  };

  return (
    <div className="flex flex-col items-start w-full gap-1">
      <BaseLabel label={label} tooltip={tooltip} mandatory={mandatory} />

      <div className="w-full relative">
        <select
          multiple
          value={localSelected}
          onChange={handleChange}
          disabled={disabled}
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-md outline-none focus:border-textPrimary transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-white"
        >
          {options && options.length > 0 ? (
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          ) : (
            <option disabled>No options available</option>
          )}
        </select>
      </div>

      {display === 'chip' && localSelected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {getSelectedLabels().map((label, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1 bg-lightPrimary/50 text-darkPrimary rounded-full text-sm font-medium border border-lightPrimary"
            >
              {label}
            </div>
          ))}
        </div>
      )}

      {display === 'comma' && localSelected.length > 0 && (
        <div className="text-sm text-gray-600 mt-2">
          {getSelectedLabels().join(', ')}
        </div>
      )}
    </div>
  );
};

export default BaseMultiSelectInput;
