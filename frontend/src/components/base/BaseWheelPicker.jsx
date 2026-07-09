import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const ITEM_H = 40; // px, matches h-10

function pad2(n) {
  return String(n).padStart(2, '0');
}

function dayKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Single scrolling wheel column (Apple-style). Scroll-snap driven.
 */
function WheelColumn({
  items,
  value,
  onChange,
  align = 'center',
  flex = 'flex-1',
}) {
  const ref = useRef(null);
  const timer = useRef(null);
  const index = Math.max(
    0,
    items.findIndex((it) => it.value === value),
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = index * ITEM_H;
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTop = target;
  }, [index]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const i = Math.min(
        items.length - 1,
        Math.max(0, Math.round(el.scrollTop / ITEM_H)),
      );
      const it = items[i];
      if (it && it.value !== value) onChange(it.value);
      el.scrollTop = i * ITEM_H;
    }, 90);
  };

  const alignMap = {
    left: 'justify-start pl-4',
    right: 'justify-end pr-4',
    center: 'justify-center',
  };
  const alignClass = alignMap[align] || alignMap.center;

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className={`${flex} relative z-10 h-44 overflow-y-auto snap-y snap-mandatory scrollbar-none`}
    >
      <div className="h-17" />
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={`w-full h-10 flex items-center ${alignClass} snap-center text-lg transition-colors ${
            it.value === value
              ? 'font-semibold text-gray-900 dark:text-gray-100'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {it.label}
        </button>
      ))}
      <div className="h-17" />
    </div>
  );
}

/**
 * Reusable Apple-style wheel picker.
 *
 * Modes:
 *  - 'datetime' : day + hour + minute  (value/onChange use Date)
 *  - 'date'     : day only             (value/onChange use Date)
 *  - 'time'     : hour + minute        (value/onChange use Date)
 *  - 'number'   : single number column (value/onChange use number)
 *  - 'custom'   : pass `columns` array of { items, value, onChange, align, flex }
 */
export default function BaseWheelPicker({
  mode = 'datetime',
  value,
  onChange,
  minuteStep = 5,
  numberMin = 0,
  numberMax = 59,
  numberStep = 1,
  numberUnit = '',
  columns,
  dayRangePast = 365,
  dayRangeFuture = 730,
  showHeader = true,
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language || undefined;

  const date = useMemo(
    () =>
      value instanceof Date && !Number.isNaN(value.getTime())
        ? value
        : new Date(),
    [value],
  );

  const dayFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
    [locale],
  );

  const headerDateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    [locale],
  );

  const dayItems = useMemo(() => {
    if (mode !== 'date' && mode !== 'datetime') return [];
    const arr = [];
    const base = new Date();
    base.setHours(12, 0, 0, 0);
    for (let off = -dayRangePast; off <= dayRangeFuture; off += 1) {
      const d = new Date(base);
      d.setDate(base.getDate() + off);
      let label = dayFmt.format(d).replaceAll(',', '');
      label = label.charAt(0).toUpperCase() + label.slice(1);
      arr.push({ value: dayKey(d), label });
    }
    return arr;
  }, [mode, dayFmt, dayRangePast, dayRangeFuture]);

  const hourItems = useMemo(
    () => Array.from({ length: 24 }, (_, h) => ({ value: h, label: pad2(h) })),
    [],
  );

  const minuteItems = useMemo(() => {
    const arr = [];
    for (let m = 0; m < 60; m += minuteStep)
      arr.push({ value: m, label: pad2(m) });
    return arr;
  }, [minuteStep]);

  const numberItems = useMemo(() => {
    if (mode !== 'number') return [];
    const arr = [];
    for (let n = numberMin; n <= numberMax; n += numberStep) {
      arr.push({ value: n, label: numberUnit ? `${n} ${numberUnit}` : `${n}` });
    }
    return arr;
  }, [mode, numberMin, numberMax, numberStep, numberUnit]);

  const emit = (parts) => {
    const d = new Date(date);
    if (parts.day) {
      const [y, m, da] = parts.day.split('-').map(Number);
      d.setFullYear(y, m - 1, da);
    }
    if (parts.hour != null) d.setHours(parts.hour);
    if (parts.minute != null) d.setMinutes(parts.minute);
    d.setSeconds(0, 0);
    onChange(d);
  };

  let cols = [];
  if (mode === 'number') {
    cols = [{ key: 'num', items: numberItems, value, onChange }];
  } else if (mode === 'custom') {
    cols = columns || [];
  } else {
    const built = [];
    if (mode === 'date' || mode === 'datetime') {
      built.push({
        key: 'day',
        items: dayItems,
        value: dayKey(date),
        onChange: (v) => emit({ day: v }),
        flex: 'flex-[2]',
      });
    }
    if (mode === 'time' || mode === 'datetime') {
      const selMinute =
        (Math.round(date.getMinutes() / minuteStep) * minuteStep) % 60;
      built.push(
        {
          key: 'hour',
          items: hourItems,
          value: date.getHours(),
          onChange: (v) => emit({ hour: v }),
        },
        {
          key: 'minute',
          items: minuteItems,
          value: selMinute,
          onChange: (v) => emit({ minute: v }),
        },
      );
    }
    cols = built;
  }

  const showSummary = showHeader && mode !== 'number' && mode !== 'custom';

  return (
    <div className="flex flex-col gap-3">
      {showSummary && (
        <div className="flex items-center justify-between px-2">
          {(mode === 'date' || mode === 'datetime') && (
            <span className="text-primary-dark dark:text-btn-primary font-medium text-base">
              {headerDateFmt.format(date)}
            </span>
          )}
          {(mode === 'time' || mode === 'datetime') && (
            <span className="text-primary-dark dark:text-btn-primary font-medium text-base ml-auto">
              {pad2(date.getHours())} : {pad2(date.getMinutes())}
            </span>
          )}
        </div>
      )}
      <div className="relative flex h-44 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-gray-200/80 dark:bg-gray-700/80 rounded-lg z-0" />
        {cols.map((c, i) => (
          <WheelColumn key={c.key ?? `col-${i}`} {...c} />
        ))}
      </div>
    </div>
  );
}
