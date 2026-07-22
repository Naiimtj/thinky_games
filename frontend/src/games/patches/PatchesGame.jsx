import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseButton from '../../components/base/BaseButton';
import { GameShell, RulesSection } from '../GameShell';
import { buildStorageKey, usePersistedState } from '../gamePersistence';
import { PuzzleGate } from '../PuzzleGate';
import { useDailyPuzzle } from '../useDailyPuzzle';
import { useGameSession } from '../useGameSession';
import { range } from '../../utils/range';
import {
  buildInitialOwner,
  cellKey,
  isPatchesSolved,
  seedCellMap,
} from './patchesLogic';

const hexToRgba = (hex, alpha) => {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Solid border drawn only on the outer edges of a figure (cells sharing groupSeed). */
const getPerimeterBorder = (row, col, rows, cols, owner, groupSeed, color) => {
  const sameGroup = (r, c) =>
    r >= 0 &&
    r < rows &&
    c >= 0 &&
    c < cols &&
    owner[cellKey(r, c)] === groupSeed;
  const radius = '10px';
  const top = !sameGroup(row - 1, col);
  const bottom = !sameGroup(row + 1, col);
  const left = !sameGroup(row, col - 1);
  const right = !sameGroup(row, col + 1);
  return {
    borderStyle: 'solid',
    borderColor: color,
    borderTopWidth: top ? 3 : 0,
    borderBottomWidth: bottom ? 3 : 0,
    borderLeftWidth: left ? 3 : 0,
    borderRightWidth: right ? 3 : 0,
    // Only round a corner when both edges meeting there are actual outer edges.
    borderTopLeftRadius: top && left ? radius : 0,
    borderTopRightRadius: top && right ? radius : 0,
    borderBottomLeftRadius: bottom && left ? radius : 0,
    borderBottomRightRadius: bottom && right ? radius : 0,
  };
};

const parseCell = (key) => key.split(',').map(Number);

const getRegionBounds = (owner, seedIndex) => {
  let minR = Infinity;
  let maxR = -Infinity;
  let minC = Infinity;
  let maxC = -Infinity;
  Object.entries(owner).forEach(([key, value]) => {
    if (value !== seedIndex) return;
    const [r, c] = parseCell(key);
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minC = Math.min(minC, c);
    maxC = Math.max(maxC, c);
  });
  if (minR === Infinity) return null;
  return { minR, maxR, minC, maxC };
};

const canKeepShapeConstraint = (shape, size, width, height) => {
  const area = width * height;
  if (size != null && area > size) return false;
  if (shape === 'HRECT' && width < height) return false;
  if (shape === 'VRECT' && height < width) return false;
  if (shape === 'SQUARE' && size != null) {
    const side = Math.sqrt(size);
    if (!Number.isInteger(side)) return false;
    if (width > side || height > side) return false;
  }
  return true;
};

/** Renders a clue's shape as filled rect(s) matching its color; ANY is a horizontal+vertical cross. */
const ClueGlyph = ({ shape, size, color }) => {
  const rectClass = 'absolute rounded-sm border-2';
  const style = { backgroundColor: hexToRgba(color, 0.4), borderColor: color };
  return (
    <span className="relative flex h-full w-full items-center justify-center">
      {shape === 'SQUARE' && (
        <span className={`${rectClass} inset-[14%]`} style={style} />
      )}
      {shape === 'HRECT' && (
        <span
          className={`${rectClass} inset-x-[6%] inset-y-[26%]`}
          style={style}
        />
      )}
      {shape === 'VRECT' && (
        <span
          className={`${rectClass} inset-y-[6%] inset-x-[26%]`}
          style={style}
        />
      )}
      {shape === 'ANY' && (
        <>
          <span
            className={`${rectClass} inset-x-[6%] inset-y-[26%]`}
            style={style}
          />
          <span
            className={`${rectClass} inset-y-[6%] inset-x-[26%]`}
            style={style}
          />
        </>
      )}
      {size != null && (
        <span className="relative z-10 text-sm font-black text-white drop-shadow">
          {size}
        </span>
      )}
    </span>
  );
};

const LEGEND_COLOR = '#64748b';

const LEGEND = [
  { shape: 'SQUARE', labelKey: 'square' },
  { shape: 'VRECT', labelKey: 'vertical' },
  { shape: 'HRECT', labelKey: 'horizontal' },
  { shape: 'ANY', labelKey: 'any' },
];

const Legend = () => {
  const { t } = useTranslation();
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-center text-sm font-bold text-slate-700">
        {t('patchesGame.legend.title')}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {LEGEND.map(({ shape, labelKey }) => (
          <span
            key={shape}
            className="flex items-center gap-2 text-sm text-slate-700"
          >
            <span className="h-6 w-6 shrink-0">
              <ClueGlyph shape={shape} size={null} color={LEGEND_COLOR} />
            </span>
            <span className="font-semibold">
              {t(`patchesGame.legend.${labelKey}`)}
            </span>
          </span>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">
        {t('patchesGame.legend.size')}
      </p>
    </div>
  );
};

const PatchesBoard = ({ puzzle, puzzleId, mode, meta }) => {
  const { t } = useTranslation();
  const { rows, cols, seeds, solution } = puzzle;
  const seedMap = useMemo(() => seedCellMap(seeds), [seeds]);
  const colorOf = (index) => seeds[index]?.color;

  const boardKey = buildStorageKey('patches', mode, puzzleId, 'board');
  const [owner, setOwner] = usePersistedState(boardKey, () =>
    buildInitialOwner(seeds),
  );
  const [activeSeed, setActiveSeed] = useState(null);
  const [history, setHistory] = useState([]);

  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  const strokeRef = useRef(null);
  const snapshotRef = useRef(null);
  const pendingClearRef = useRef(false);

  useEffect(() => {
    setActiveSeed(null);
    setHistory([]);
    strokeRef.current = null;
    pendingClearRef.current = false;
    return undefined;
  }, [puzzle, seeds]);

  const solved = useMemo(
    () => isPatchesSolved(owner, seeds, rows, cols),
    [owner, seeds, rows, cols],
  );
  const session = useGameSession({
    gameId: 'patches',
    mode,
    puzzleId,
    isSolved: solved,
    getSolution: () => owner,
  });

  /** Whether a seed currently owns any non-seed (painted) cells. */
  const hasOwnedCells = (index) =>
    Object.entries(ownerRef.current).some(
      ([key, value]) => value === index && seedMap[key] === undefined,
    );

  /** Clears every painted cell belonging to a seed, back to its initial state. */
  const clearSeed = (index) => {
    const before = ownerRef.current;
    const next = { ...before };
    let changed = false;
    Object.keys(next).forEach((key) => {
      if (next[key] === index && seedMap[key] === undefined) {
        delete next[key];
        changed = true;
      }
    });
    if (changed) {
      setHistory((h) => [...h, before]);
      setOwner(next);
    }
  };

  /** Stroke can only begin on the seed itself or already owned cells. */
  const beginStroke = (seed) => {
    snapshotRef.current = ownerRef.current;
    strokeRef.current = { seed, moved: false };
  };

  /**
   * While dragging, the figure expands to a solid rectangle that includes the
   * current region and the hovered cell. Irregular shapes are never allowed.
   */
  const applyRect = (row, col) => {
    const stroke = strokeRef.current;
    if (!stroke) return;
    const current = ownerRef.current;
    const bounds = getRegionBounds(current, stroke.seed);
    if (!bounds) return;

    const r1 = Math.min(bounds.minR, row);
    const r2 = Math.max(bounds.maxR, row);
    const c1 = Math.min(bounds.minC, col);
    const c2 = Math.max(bounds.maxC, col);
    const width = c2 - c1 + 1;
    const height = r2 - r1 + 1;
    const seed = seeds[stroke.seed];
    if (!canKeepShapeConstraint(seed?.shape, seed?.size, width, height)) {
      return;
    }

    const next = { ...current };
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const key = cellKey(r, c);
        const fixedSeed = seedMap[key];
        if (fixedSeed !== undefined && fixedSeed !== stroke.seed) {
          return;
        }
        if (current[key] !== undefined && current[key] !== stroke.seed) {
          return;
        }
        next[key] = stroke.seed;
      }
    }

    const changed = JSON.stringify(next) !== JSON.stringify(current);
    if (!changed) return;
    stroke.moved = true;
    setOwner(next);
  };

  const endStroke = () => {
    const stroke = strokeRef.current;
    if (!stroke) return;
    // A tap (no drag) on a seed that already owns cells clears its whole figure;
    // a real drag from the seed must extend it instead, even on the untouched side.
    if (!stroke.moved && pendingClearRef.current) {
      pendingClearRef.current = false;
      strokeRef.current = null;
      snapshotRef.current = null;
      clearSeed(stroke.seed);
      return;
    }
    pendingClearRef.current = false;
    const before = snapshotRef.current;
    const after = ownerRef.current;
    const changed = before && JSON.stringify(before) !== JSON.stringify(after);
    if (changed) {
      setHistory((h) => [...h, before]);
    }
    strokeRef.current = null;
    snapshotRef.current = null;
  };

  const handleCellDown = (r, c, event) => {
    event.preventDefault();
    if (solved) return;
    const key = cellKey(r, c);
    const selectedSeed = owner[key];
    if (selectedSeed === undefined) {
      pendingClearRef.current = false;
      return;
    }
    setActiveSeed(selectedSeed);
    pendingClearRef.current = hasOwnedCells(selectedSeed);
    beginStroke(selectedSeed);
    applyRect(r, c);
  };

  const handleMove = (event) => {
    if (!strokeRef.current) return;
    const element = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest('[data-cell]');
    if (element?.dataset.row === undefined) return;
    applyRect(Number(element.dataset.row), Number(element.dataset.col));
  };

  const undo = () => {
    if (history.length === 0) return;
    setOwner(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  };

  const seedIsCorrect = (index) => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((solution[r][c] === index) !== (owner[cellKey(r, c)] === index)) {
          return false;
        }
      }
    }
    return true;
  };

  const revealHint = () => {
    if (solved) return;
    const target = seeds.findIndex((_, index) => !seedIsCorrect(index));
    if (target === -1) return;
    setHistory((h) => [...h, ownerRef.current]);
    setOwner((prev) => {
      const next = { ...prev };
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const key = cellKey(r, c);
          if (solution[r][c] === target) next[key] = target;
          else if (next[key] === target) delete next[key];
        }
      }
      return next;
    });
    session.addSeconds(10);
  };

  const handleReset = () => {
    setOwner(buildInitialOwner(seeds));
    setActiveSeed(null);
    setHistory([]);
    strokeRef.current = null;
    pendingClearRef.current = false;
    session.reset();
  };

  const activeCount =
    activeSeed === null
      ? 0
      : Object.values(owner).filter((v) => v === activeSeed).length;

  const activeCenter = useMemo(() => {
    if (activeSeed === null) return null;
    let minR = Infinity;
    let maxR = -Infinity;
    let minC = Infinity;
    let maxC = -Infinity;
    Object.entries(owner).forEach(([key, value]) => {
      if (value !== activeSeed) return;
      const [r, c] = key.split(',').map(Number);
      minR = Math.min(minR, r);
      maxR = Math.max(maxR, r);
      minC = Math.min(minC, c);
      maxC = Math.max(maxC, c);
    });
    if (minR === Infinity) return null;
    return {
      top: `${((minR + maxR + 1) / 2 / rows) * 100}%`,
      left: `${((minC + maxC + 1) / 2 / cols) * 100}%`,
    };
  }, [owner, activeSeed, rows, cols]);

  return (
    <GameShell
      title={meta?.name ?? t('games.patches.name')}
      tagline={t('patchesGame.tagline')}
      mode={mode}
      elapsed={session.elapsed}
      state={session.state}
      onReset={handleReset}
      hint={t('patchesGame.hint')}
    >
      <div className="relative mx-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
        <div
          className="grid touch-none select-none"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          onPointerMove={handleMove}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
        >
          {range(rows * cols).map((index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const key = cellKey(row, col);
            const ownerIndex = owner[key];
            const seedIndex = seedMap[key];
            const isSeed = seedIndex !== undefined;
            const filled = ownerIndex !== undefined;
            const seed = isSeed ? seeds[seedIndex] : null;
            const highlightSeed = activeSeed;
            const highlightColor = colorOf(activeSeed);
            const isActiveCell =
              highlightSeed !== null && ownerIndex === highlightSeed;
            const activeBorderStyle = isActiveCell
              ? getPerimeterBorder(
                  row,
                  col,
                  rows,
                  cols,
                  owner,
                  highlightSeed,
                  highlightColor,
                )
              : undefined;
            return (
              <button
                key={key}
                type="button"
                data-cell
                data-row={row}
                data-col={col}
                aria-label={t('patchesGame.cellLabel', {
                  row: row + 1,
                  column: col + 1,
                })}
                onPointerDown={(event) => handleCellDown(row, col, event)}
                className="relative flex aspect-square items-center justify-center bg-white"
              >
                <span className="pointer-events-none absolute inset-0 border border-dashed border-slate-300" />
                {filled && !isSeed && (
                  <span
                    className="absolute inset-0"
                    style={{
                      backgroundColor: hexToRgba(colorOf(ownerIndex), 0.4),
                    }}
                  />
                )}
                {isSeed && (
                  <>
                    <span
                      className="absolute inset-0"
                      style={{
                        backgroundColor: hexToRgba(colorOf(seedIndex), 0.4),
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <ClueGlyph
                        shape={seed.shape}
                        size={seed.size}
                        color={colorOf(seedIndex)}
                      />
                    </span>
                  </>
                )}
                {isActiveCell && (
                  <span
                    className="pointer-events-none absolute inset-0"
                    style={activeBorderStyle}
                  />
                )}
              </button>
            );
          })}
        </div>
        {activeCenter && (
          <div
            className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={{ top: activeCenter.top, left: activeCenter.left }}
          >
            <span className="rounded-sm  px-2 text-4xl font-black text-slate-900/10">
              {activeCount}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <BaseButton
          variant="secondary"
          outlined
          onClick={undo}
          disabled={history.length === 0}
          className="flex-1 rounded-full"
        >
          {t('patchesGame.undo')}
        </BaseButton>
        <BaseButton
          variant="warning"
          outlined
          onClick={revealHint}
          disabled={solved}
          className="flex-1 rounded-full"
        >
          {t('patchesGame.hintButton')}
        </BaseButton>
      </div>

      <Legend />

      <RulesSection>
        <li>{t('patchesGame.rules.paint')}</li>
        <li>{t('patchesGame.rules.shape')}</li>
        <li>{t('patchesGame.rules.erase')}</li>
      </RulesSection>
    </GameShell>
  );
};

/** Fetches the backend-generated puzzle, then renders the board once ready. */
const PatchesGame = ({ mode, meta }) => {
  const { puzzle, loading, error } = useDailyPuzzle('patches', mode);
  return (
    <PuzzleGate loading={loading} error={error}>
      {puzzle && (
        <PatchesBoard
          puzzle={puzzle.payload}
          puzzleId={puzzle.id}
          mode={mode}
          meta={meta}
        />
      )}
    </PuzzleGate>
  );
};

export default PatchesGame;
