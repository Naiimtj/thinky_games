import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseButton from '../../components/base/BaseButton';
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
  isCrosswordSolved,
  normalizeLetter,
} from './crosswordLogic';

const cellKey = (row, col) => `${row},${col}`;

const directionLabel = (direction, t) =>
  t(`crosswordGame.directions.${direction}`);

const CrosswordBoard = ({ puzzle, puzzleId, puzzleLocale, mode, meta }) => {
  const { t } = useTranslation();
  const { entries, size } = puzzle;
  const boardKey = buildStorageKey('crossword', mode, puzzleId, 'board');
  const [board, setBoard] = usePersistedState(boardKey, () => ({ cells: {} }));
  const [activeEntryId, setActiveEntryId] = useState(entries[0]?.id ?? null);
  const inputRefs = useRef({});
  const cells = board.cells ?? {};
  const grid = useMemo(() => buildGrid(entries, size), [entries, size]);
  const activeEntry = entries.find((entry) => entry.id === activeEntryId);
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

  const moveToNextCell = (key) => {
    if (!activeEntry) return;
    const entryCellKeys = entryCells(activeEntry).map((cell) =>
      cellKey(cell.row, cell.col),
    );
    const nextKey = entryCellKeys[entryCellKeys.indexOf(key) + 1];
    inputRefs.current[nextKey]?.focus();
  };

  const handleCellChange = (key, value) => {
    const letter = normalizeLetter(value);
    setCell(key, value);
    if (letter) moveToNextCell(key);
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
      <div
        className="grid overflow-hidden rounded-lg border-2 border-slate-700 bg-slate-700"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        role="grid"
        aria-label={t('crosswordGame.gridLabel')}
      >
        {grid.map((cell) => {
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
                <span className="pointer-events-none absolute left-0.5 top-0 text-[10px] font-bold leading-none text-slate-500">
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
                className={`h-full w-full border bg-transparent pt-1 text-center font-mono text-lg font-bold uppercase text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${isIncorrect ? 'border-red-500' : 'border-slate-300'} ${isActive ? 'bg-amber-100' : ''}`}
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

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                .map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => setActiveEntryId(entry.id)}
                      className={`w-full rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${activeEntry?.id === entry.id ? 'bg-amber-100 font-semibold' : 'bg-slate-50 hover:bg-slate-100'}`}
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
