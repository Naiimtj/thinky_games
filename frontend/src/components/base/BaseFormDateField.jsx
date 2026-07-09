import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslate } from '../../hooks/useTranslate';
import { useDateRangeLogic } from '../../hooks/useDateRangeLogic';
import BaseIcon from './BaseIcon';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function parseDate(value) {
  if (!value) return null;
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  const year = Number.parseInt(parts[0], 10);
  const month = Number.parseInt(parts[1], 10) - 1; // 0-indexed
  const day = Number.parseInt(parts[2], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day))
    return null;
  return { year, month, day };
}

function formatToISO(year, month, day) {
  const y = String(year).padStart(4, '0');
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const NEXT_VIEW_MODE = { days: 'months', months: 'years', years: 'months' };

function getDayButtonClass(isSelected, isToday) {
  if (isSelected) return 'bg-textPrimary text-white font-semibold';
  if (isToday) return 'border border-textPrimary text-textPrimary font-medium';
  return 'text-gray-700 hover:bg-gray-100';
}

function parseUserInput(text) {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (!match) return null;
  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > getDaysInMonth(year, month - 1)
  )
    return null;
  return formatToISO(year, month - 1, day);
}

export default function BaseFormDateField({
  name,
  control,
  rules,
  required,
  label,
  disabled = false,
  fullWidth = false,
  ...rest
}) {
  const { t } = useTranslate();
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState('days');
  const [inputText, setInputText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const mergedRules = {
    ...(required ? { required } : {}),
    ...rules,
  };
  const displayLabel = required ? `${label} *` : label;

  const monthNames = useMemo(
    () => Array.from({ length: 12 }, (_, i) => t(`dateTime.months.${i}`)),
    [t],
  );

  const { getMonthAbbr, formatDisplayDate } = useDateRangeLogic(monthNames);

  const dayHeaders = useMemo(
    () =>
      // Mon–Sun abbreviated
      Array.from({ length: 7 }, (_, i) => {
        const full = t(`dateTime.days.${(i + 1) % 7}`); // Mon=1, ..., Sun=0
        return full.slice(0, 2);
      }),
    [t],
  );

  return (
    <Controller
      name={name}
      control={control}
      rules={mergedRules}
      render={({ field, fieldState: { error } }) => {
        const displayValue = formatDisplayDate(field.value);

        const handleBlur = () => {
          if (!isEditing) return;
          const result = parseUserInput(inputText);
          if (result !== null) {
            field.onChange(result);
          }
          setIsEditing(false);
          field.onBlur();
        };

        return (
          <>
            <div
              ref={anchorRef}
              className={`relative flex items-center gap-1${fullWidth ? ' w-full' : ''}`}
            >
              <div className="flex-1 flex flex-col">
                {displayLabel && (
                  <label
                    className={`block text-sm font-medium mb-1 ${error ? 'text-input-label-error' : 'text-input-label'}`}
                  >
                    {displayLabel}
                  </label>
                )}
                <input
                  value={isEditing ? inputText : displayValue}
                  onChange={(e) => {
                    setIsEditing(true);
                    setInputText(e.target.value);
                  }}
                  onFocus={() => {
                    if (!disabled) {
                      const p = parseDate(field.value);
                      setInputText(
                        p
                          ? `${String(p.day).padStart(2, '0')}/${String(p.month + 1).padStart(2, '0')}/${p.year}`
                          : '',
                      );
                      setIsEditing(true);
                    }
                  }}
                  onBlur={handleBlur}
                  placeholder={t('dateTime.placeholderDate')}
                  disabled={disabled}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleBlur();
                    }
                  }}
                  size={10}
                  className={`w-full px-3 py-2 text-sm border rounded outline-none transition-colors pr-10 ${
                    error
                      ? 'border-input-error focus:border-input-error focus:ring-1 focus:ring-input-error'
                      : 'border-input-border focus:border-input-focus focus:ring-1 focus:ring-input-focus'
                  } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white'}`}
                  {...rest}
                />
                {error?.message && (
                  <p className="mt-1 text-xs text-input-label-error">
                    {error.message}
                  </p>
                )}
              </div>
              {!disabled && (
                <BaseIcon
                  icon="calendar"
                  className="absolute w-10 right-0 bottom-2 stroke-gray-400 hover:stroke-textPrimary transition-colors"
                  onClick={() => setOpen((prev) => !prev)}
                />
              )}
            </div>

            {open && (
              <DateFieldDropdown
                anchorRef={anchorRef}
                onClose={() => {
                  setOpen(false);
                  setViewMode('days');
                }}
              >
                <CalendarPanel
                  value={field.value}
                  onChange={(newValue) => {
                    field.onChange(newValue);
                    setOpen(false);
                    setViewMode('days');
                  }}
                  monthNames={monthNames}
                  getMonthAbbr={getMonthAbbr}
                  dayHeaders={dayHeaders}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />
              </DateFieldDropdown>
            )}
          </>
        );
      }}
    />
  );
}

function DateFieldDropdown({ anchorRef, onClose, children }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorRef]);

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 mt-1 bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-200"
      style={{ minWidth: 280 }}
    >
      {children}
    </div>
  );
}

function CalendarPanel({
  value,
  onChange,
  monthNames,
  getMonthAbbr,
  dayHeaders,
  viewMode,
  setViewMode,
}) {
  const parsed = parseDate(value);
  const today = new Date();

  const initialYear = parsed?.year ?? today.getFullYear();
  const initialMonth = parsed?.month ?? today.getMonth();

  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  // Year range for year picker (centered on current viewYear)
  const yearRangeStart = viewYear - 6;

  const handlePrev = useCallback(() => {
    if (viewMode === 'days') {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    } else if (viewMode === 'years') {
      setViewYear((y) => y - 12);
    }
  }, [viewMode, viewMonth]);

  const handleNext = useCallback(() => {
    if (viewMode === 'days') {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    } else if (viewMode === 'years') {
      setViewYear((y) => y + 12);
    }
  }, [viewMode, viewMonth]);

  const handleSelectDay = useCallback(
    (day) => {
      onChange(formatToISO(viewYear, viewMonth, day));
    },
    [viewYear, viewMonth, onChange],
  );

  const handleSelectMonth = useCallback(
    (month) => {
      setViewMonth(month);
      setViewMode('days');
    },
    [setViewMode],
  );

  const handleSelectYear = useCallback(
    (year) => {
      setViewYear(year);
      setViewMode('months');
    },
    [setViewMode],
  );

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const todayISO = formatToISO(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return (
    <div className="p-3 select-none" style={{ minWidth: 280 }}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-2 ">
        <BaseIcon
          icon="arrowLeft"
          size="small"
          className="text-gray-500"
          onClick={handlePrev}
        />

        <button
          type="button"
          onClick={() => setViewMode(NEXT_VIEW_MODE[viewMode])}
          className="text-sm font-semibold text-gray-800 hover:text-textPrimary transition-colors px-2 py-1 rounded cursor-pointer"
        >
          {
            {
              days: `${monthNames[viewMonth]} ${viewYear}`,
              months: `${viewYear}`,
              years: `${yearRangeStart} – ${yearRangeStart + 11}`,
            }[viewMode]
          }
        </button>

        <BaseIcon
          icon="arrowRight"
          size="small"
          className="text-gray-500"
          onClick={handleNext}
        />
      </div>

      {/* Days view */}
      {viewMode === 'days' && (
        <>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {dayHeaders.map((day, i) => (
              <div
                key={`${i}-${day}`}
                className="text-center text-xs font-medium text-gray-400 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="p-1" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const iso = formatToISO(viewYear, viewMonth, day);
              const isSelected = value === iso;
              const isToday = todayISO === iso;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`w-9 h-9 mx-auto flex items-center justify-center rounded-full text-sm transition-colors cursor-pointer ${getDayButtonClass(isSelected, isToday)}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Months view */}
      {viewMode === 'months' && (
        <div className="grid grid-cols-3 gap-1">
          {monthNames.map((name, i) => {
            const isSelected = parsed?.month === i && parsed?.year === viewYear;

            return (
              <button
                key={`${i}-${name}`}
                type="button"
                onClick={() => handleSelectMonth(i)}
                className={`py-2 px-1 rounded-lg text-sm transition-colors cursor-pointer ${isSelected ? 'bg-textPrimary text-white font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {getMonthAbbr(i)}
              </button>
            );
          })}
        </div>
      )}

      {/* Years view */}
      {viewMode === 'years' && (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, i) => {
            const year = yearRangeStart + i;
            const isSelected = parsed?.year === year;

            return (
              <button
                key={`year-${year}`}
                type="button"
                onClick={() => handleSelectYear(year)}
                className={`py-2 px-1 rounded-lg text-sm transition-colors cursor-pointer ${isSelected ? 'bg-textPrimary text-white font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
