import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseButton from '../../components/base/BaseButton';
import BaseToggleSwitch from '../../components/base/BaseToggleSwitch';
import { GameShell, RulesSection } from '../GameShell';
import { buildStorageKey, usePersistedState } from '../gamePersistence';
import { PuzzleGate } from '../PuzzleGate';
import { useDailyPuzzle } from '../useDailyPuzzle';
import { useGameSession } from '../useGameSession';
import {
  answersFromCells,
  buildGrid,
  entryCells,
  firstEmptyLetter,
  gridBounds,
  isCrosswordSolved,
  normalizeLetter,
} from './crosswordLogic';

const cellKey = (row, col) => `${row},${col}`;

const directionLabel = (direction, t) =>
  t(`crosswordGame.directions.${direction}`);

const Toggle = ({ checked, onChange, label }) => (
  <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
    <span className="text-sm font-medium text-slate-600">{label}</span>
    <BaseToggleSwitch value={checked} onChange={onChange} />
  </div>
);

const CrosswordBoard = ({ puzzle, puzzleId, puzzleLocale, mode, meta }) => {
  const { t } = useTranslation();
  const { entries, size } = puzzle;
  const boardKey = buildStorageKey('crossword', mode, puzzleId, 'board');
  const sortSelectedFirstKey = buildStorageKey(
    'crossword',
    mode,
    puzzleId,
    'sortSelectedFirst',
  );
  const [board, setBoard] = usePersistedState(boardKey, () => ({ cells: {} }));
  const [sortSelectedFirst, setSortSelectedFirst] = usePersistedState(
    sortSelectedFirstKey,
    () => false,
  );
  const [activeEntryId, setActiveEntryId] = useState(entries[0]?.id ?? null);
  const inputRefs = useRef({});
  const cells = board.cells ?? {};
  const grid = useMemo(() => buildGrid(entries, size), [entries, size]);
  const gridByKey = useMemo(
    () => new Map(grid.map((cell) => [cellKey(cell.row, cell.col), cell])),
    [grid],
  );
  const bounds = useMemo(() => gridBounds(grid, size), [grid, size]);
  const visibleRows = useMemo(
    () =>
      Array.from(
        { length: bounds.maxRow - bounds.minRow + 3 },
        (_, index) => bounds.minRow - 1 + index,
      ),
    [bounds],
  );
  const visibleCols = useMemo(
    () =>
      Array.from(
        { length: bounds.maxCol - bounds.minCol + 3 },
        (_, index) => bounds.minCol - 1 + index,
      ),
    [bounds],
  );
  const visibleGrid = useMemo(
    () =>
      visibleRows.flatMap((row) =>
        visibleCols.map(
          (col) =>
            gridByKey.get(cellKey(row, col)) ?? { row, col, entryIds: [] },
        ),
      ),
    [gridByKey, visibleCols, visibleRows],
  );
  const activeEntry = entries.find((entry) => entry.id === activeEntryId);
  const compareEntries = (a, b) => {
    if (sortSelectedFirst) {
      if (a.id === activeEntryId) return -1;
      if (b.id === activeEntryId) return 1;
    }
    return a.number - b.number;
  };
  const answers = answersFromCells(entries, cells);
  const isComplete = entries.every(
    (entry) => answers[entry.id].length === entry.answer.length,
  );
  const incorrectEntryIds = new Set(
    isComplete
      ? entries
          .filter((entry) => answers[entry.id] !== entry.answer)
          .map((entry) => entry.id)
      : [],
  );
  const isSolved = isCrosswordSolved(entries, cells);

  const session = useGameSession({
    gameId: 'crossword',
    mode,
    puzzleId,
    locale: puzzleLocale,
    isSolved,
    getSolution: () => answersFromCells(entries, cells),
  });

  const setCell = (key, value) =>
    setBoard((previous) => ({
      ...previous,
      cells: { ...previous.cells, [key]: normalizeLetter(value) },
    }));

  const moveToNextCell = (key, cellMap = cells) => {
    if (!activeEntry) return;
    const entryCellKeys = entryCells(activeEntry).map((cell) =>
      cellKey(cell.row, cell.col),
    );
    const currentIndex = entryCellKeys.indexOf(key);
    const nextKey = entryCellKeys
      .slice(currentIndex + 1)
      .find((entryKey) => !cellMap[entryKey]);
    if (nextKey) inputRefs.current[nextKey]?.focus();
  };

  const handleCellChange = (key, value) => {
    const letter = normalizeLetter(value);
    setBoard((previous) => {
      const nextCells = { ...previous.cells, [key]: letter };
      if (letter) moveToNextCell(key, nextCells);
      return { ...previous, cells: nextCells };
    });
  };

  const handleReset = () => {
    setBoard({ cells: {} });
    setActiveEntryId(entries[0]?.id ?? null);
    session.reset();
  };

  const handleHint = () => {
    const hint = firstEmptyLetter(entries, cells);
    if (!hint) return;
    setCell(hint.key, hint.letter);
    session.addSeconds(10);
  };

  const selectCell = (cell) => {
    const nextEntryId = cell.entryIds.includes(activeEntryId)
      ? (cell.entryIds.find((id) => id !== activeEntryId) ?? activeEntryId)
      : cell.entryIds[0];
    setActiveEntryId(nextEntryId);
  };

  return (
    <GameShell
      title={meta?.name ?? t('games.crossword.name')}
      tagline={t('crosswordGame.tagline')}
      mode={mode}
      elapsed={session.elapsed}
      state={session.state}
      onReset={handleReset}
      hint={t('crosswordGame.hint')}
    >
      <Toggle
        checked={sortSelectedFirst}
        onChange={() => setSortSelectedFirst((value) => !value)}
        label={t('crosswordGame.sortSelectedFirst')}
      />

      <div
        className="grid overflow-hidden rounded-md border border-slate-700 bg-slate-700 justify-center items-center"
        style={{
          gridTemplateColumns: `repeat(${visibleCols.length}, minmax(0, 0.1fr))`,
        }}
        role="grid"
        aria-label={t('crosswordGame.gridLabel')}
      >
        {visibleGrid.map((cell) => {
          const key = cellKey(cell.row, cell.col);
          if (cell.entryIds.length === 0) {
            return (
              <div
                key={key}
                className="aspect-square bg-slate-700"
                aria-hidden="true"
              />
            );
          }
          const isActive = cell.entryIds.includes(activeEntryId);
          const isIncorrect = cell.entryIds.some((id) =>
            incorrectEntryIds.has(id),
          );
          const label = cell.entryIds
            .map((id) => entries.find((entry) => entry.id === id)?.number)
            .join(' y ');
          return (
            <div
              key={key}
              role="gridcell"
              className="relative aspect-square bg-white"
            >
              {cell.number && (
                <span className="pointer-events-none absolute left-0.5 top-0 text-[10px] font-bold leading-none text-slate-500 sm:text-[10px]">
                  {cell.number}
                </span>
              )}
              <input
                id={`crossword-${key}`}
                ref={(element) => {
                  inputRefs.current[key] = element;
                }}
                value={cells[key] ?? ''}
                onFocus={() =>
                  setActiveEntryId((current) =>
                    cell.entryIds.includes(current)
                      ? current
                      : cell.entryIds[0],
                  )
                }
                onClick={() => selectCell(cell)}
                onChange={(event) => handleCellChange(key, event.target.value)}
                maxLength={1}
                inputMode="text"
                autoComplete="off"
                aria-label={t('crosswordGame.cellLabel', { numbers: label })}
                className={`h-full w-full border bg-transparent text-center font-mono text-[8px] font-bold uppercase leading-none text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 sm:text-sm ${isIncorrect ? 'border-red-500' : 'border-slate-300'} ${isActive ? 'bg-amber-100' : ''}`}
              />
            </div>
          );
        })}
      </div>

      <BaseButton
        variant="warning"
        outlined
        onClick={handleHint}
        disabled={isSolved}
        className="mt-3 w-full"
      >
        {t('crosswordGame.hintButton')}
      </BaseButton>

      <div className="mt-3 hidden gap-3 sm:grid sm:grid-cols-2">
        {['across', 'down'].map((direction) => (
          <section key={direction} aria-labelledby={`crossword-${direction}`}>
            <h2
              id={`crossword-${direction}`}
              className="mb-1 text-sm font-bold text-slate-700"
            >
              {directionLabel(direction, t)}
            </h2>
            <ol className="space-y-1">
              {entries
                .filter((entry) => entry.direction === direction)
                .sort(compareEntries)
                .map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => setActiveEntryId(entry.id)}
                      className={`w-full rounded-lg px-2 py-1 text-left text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${activeEntry?.id === entry.id ? 'bg-amber-100 font-semibold' : 'bg-slate-50 hover:bg-slate-100'}`}
                    >
                      <span className="mr-1 font-bold">{entry.number}.</span>
                      {entry.clue}
                    </button>
                  </li>
                ))}
            </ol>
          </section>
        ))}
      </div>

      <div className="mt-2 sm:hidden">
        <ol className="space-y-1">
          {[...entries].sort(compareEntries).map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => setActiveEntryId(entry.id)}
                className={`w-full rounded-lg px-2 py-1 text-left text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${activeEntry?.id === entry.id ? 'bg-amber-100 font-semibold' : 'bg-slate-50 hover:bg-slate-100'}`}
              >
                <span className="mr-1 font-bold">{entry.number}.</span>
                <span className="mr-1 inline-block w-3 text-xs text-slate-400">
                  {directionLabel(entry.direction, t).charAt(0)}
                </span>
                {entry.clue}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <RulesSection>
        <li>{t('crosswordGame.rules.select')}</li>
        <li>{t('crosswordGame.rules.write')}</li>
        <li>{t('crosswordGame.rules.complete')}</li>
        <li>{t('crosswordGame.rules.hint')}</li>
      </RulesSection>
    </GameShell>
  );
};

const CrosswordGame = ({ mode, meta }) => {
  const { puzzle, loading, error } = useDailyPuzzle('crossword', mode);
  return (
    <PuzzleGate loading={loading} error={error}>
      {puzzle && (
        <CrosswordBoard
          puzzle={puzzle.payload}
          puzzleId={puzzle.id}
          puzzleLocale={puzzle.locale}
          mode={mode}
          meta={meta}
        />
      )}
    </PuzzleGate>
  );
};

export default CrosswordGame;
