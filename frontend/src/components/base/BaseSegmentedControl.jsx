/**
 * BaseSegmentedControl — pill or rounded segmented tab selector.
 *
 * Props:
 *   options  – [{ value, label }]
 *   value    – currently selected value
 *   onChange – (value) => void
 *   variant  – 'pill' (default) | 'rounded'
 */
export default function BaseSegmentedControl({
  options,
  value,
  onChange,
  variant = 'pill',
}) {
  const isPill = variant === 'pill';

  const wrapperClass = isPill
    ? 'flex rounded-full p-0.5 bg-gray-200 dark:bg-gray-700'
    : 'flex rounded-lg p-0.5 bg-gray-200 dark:bg-gray-800';

  const activeClass = isPill
    ? 'bg-gray-600 dark:bg-gray-500 text-white'
    : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm dark:shadow-none';

  const inactiveClass = isPill
    ? 'text-gray-500 dark:text-gray-300'
    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200';

  const btnBase = isPill
    ? 'flex-1 py-1.5 px-4 text-sm font-medium rounded-full transition-colors'
    : 'flex-1 py-2 px-3 text-sm rounded-md font-medium transition-colors';

  return (
    <div className={wrapperClass}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`cursor-pointer ${btnBase} ${value === opt.value ? activeClass : inactiveClass}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
