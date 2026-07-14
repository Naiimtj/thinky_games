import { useMemo, useState } from 'react';

import BaseButton from '../../components/base/BaseButton';
import BaseToggleSwitch from '../../components/base/BaseToggleSwitch';
import { Queen } from '../../components/icons/Queen';
import { GameShell, RulesSection } from '../GameShell';
import { buildStorageKey, usePersistedState } from '../gamePersistence';
import { PuzzleGate } from '../PuzzleGate';
import { useDailyPuzzle } from '../useDailyPuzzle';
import { useGameSession } from '../useGameSession';
import {
  CELL,
  REGION_COLORS,
  autoMarkKeys,
  isQueensSolved,
  nextCellState,
  queenHasConflict,
  queensFromState,
  solveQueens,
} from './queensLogic';

const key = (row, col) => `${row},${col}`;

/** Thicker borders on the sides where the colour region changes. */
const regionBorders = (regions, row, col, size) => {
  const id = regions[row][col];
  const differs = (r, c) =>
    r < 0 || c < 0 || r >= size || c >= size || regions[r][c] !== id;
  return [
    differs(row - 1, col)
      ? 'border-t-2 border-t-slate-700'
      : 'border-t border-t-black/10',
    differs(row, col + 1)
      ? 'border-r-2 border-r-slate-700'
      : 'border-r border-r-black/10',
    differs(row + 1, col)
      ? 'border-b-2 border-b-slate-700'
      : 'border-b border-b-black/10',
    differs(row, col - 1)
      ? 'border-l-2 border-l-slate-700'
      : 'border-l border-l-black/10',
  ].join(' ');
};

const renderMark = ({ isQueen, isManualMark, isAutoMark, solved }) => {
  if (isQueen)
    return (
      <Queen
        className={`h-1/2 w-1/2 ${solved ? 'text-amber-400 stroke-black' : 'text-slate-800'}`}
      />
    );
  if (isManualMark) return <span className="text-slate-700/70">✕</span>;
  if (isAutoMark) return <span className="text-slate-500/40">✕</span>;
  return null;
};

const Toggle = ({ checked, onChange, label }) => (
  <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
    <span className="text-sm font-medium text-slate-600">{label}</span>
    <BaseToggleSwitch value={checked} onChange={onChange} />
  </div>
);

const QueensBoard = ({ puzzle, puzzleId, mode, meta }) => {
  const { size, regions } = puzzle;

  const boardKey = buildStorageKey('queens', mode, puzzleId, 'board');
  const [cellState, setCellState] = usePersistedState(boardKey, () => ({}));
  const [autoFill, setAutoFill] = useState(true);

  const queens = useMemo(
    () => queensFromState(cellState, size),
    [cellState, size],
  );
  const autoMarks = useMemo(
    () => autoMarkKeys(queens, regions, size),
    [queens, regions, size],
  );
  const solution = useMemo(
    () => solveQueens(regions, size) ?? [],
    [regions, size],
  );
  const solved = useMemo(
    () => isQueensSolved(queens, regions, size),
    [queens, regions, size],
  );

  const session = useGameSession({
    gameId: 'queens',
    mode,
    puzzleId,
    isSolved: solved,
    getSolution: () => queens,
  });

  const cycle = (row, col) =>
    setCellState((prev) => ({
      ...prev,
      [key(row, col)]: nextCellState(prev[key(row, col)] ?? CELL.EMPTY),
    }));

  const handleReset = () => {
    setCellState({});
    session.reset();
  };

  const revealHint = () => {
    const target = solution.find(
      (cell) => cellState[key(cell.row, cell.col)] !== CELL.QUEEN,
    );
    if (!target) return;
    setCellState((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((existing) => {
        if (next[existing] !== CELL.QUEEN) return;
        const parts = existing.split(',');
        if (
          Number(parts[0]) === target.row ||
          Number(parts[1]) === target.col
        ) {
          delete next[existing];
        }
      });
      next[key(target.row, target.col)] = CELL.QUEEN;
      return next;
    });
    session.addSeconds(10);
  };

  return (
    <GameShell
      title={meta?.name ?? 'Queens'}
      tagline="Una corona por fila, columna y color; sin tocarse."
      mode={mode}
      elapsed={session.elapsed}
      state={session.state}
      onReset={handleReset}
      hint="Toca una vez para marcar ✕, otra para la corona."
    >
      <div className="relative mb-3">
        <div
          className="grid overflow-hidden rounded-xl"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {regions.flatMap((regionRow, row) =>
            regionRow.map((regionId, col) => {
              const cellId = key(row, col);
              const base = cellState[cellId] ?? CELL.EMPTY;
              const isQueen = base === CELL.QUEEN;
              const isManualMark = base === CELL.MARK;
              const isAutoMark =
                !isQueen && !isManualMark && autoFill && autoMarks.has(cellId);
              const conflict =
                isQueen && queenHasConflict({ row, col }, queens, regions);
              return (
                <button
                  key={cellId}
                  type="button"
                  onClick={() => cycle(row, col)}
                  className={`flex aspect-square items-center justify-center text-xl ${regionBorders(regions, row, col, size)} ${conflict ? 'ring-2 ring-inset ring-red-500' : ''}`}
                  style={{
                    backgroundColor:
                      REGION_COLORS[regionId % REGION_COLORS.length],
                  }}
                >
                  {renderMark({ isQueen, isManualMark, isAutoMark, solved })}
                </button>
              );
            }),
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-slate-700" />
      </div>
      <Toggle
        checked={autoFill}
        onChange={() => setAutoFill((value) => !value)}
        label="Rellenar ✕ automáticamente"
      />
      <BaseButton
        variant="warning"
        outlined
        onClick={revealHint}
        disabled={solved}
        className="mt-3 w-full rounded-full"
      >
        Pista (+10 s)
      </BaseButton>

      <RulesSection>
        <li>
          Tu objetivo es tener{' '}
          <span className="font-bold">exactamente una</span> 👑 en cada{' '}
          <span className="font-bold">fila, columna y región con color</span>.
        </li>
        <li>
          Toca una vez para colocar ✕ y dos veces para colocar 👑. Usa ✕ para
          marcar dónde no puede ir una 👑.
        </li>
        <li>Las 👑 no pueden tocarse, ni siquiera en diagonal.</li>
      </RulesSection>
    </GameShell>
  );
};

/** Fetches the backend-generated puzzle, then renders the board once ready. */
const QueensGame = ({ mode, meta }) => {
  const { puzzle, loading, error } = useDailyPuzzle('queens', mode);
  return (
    <PuzzleGate loading={loading} error={error}>
      {puzzle && (
        <QueensBoard
          puzzle={puzzle.payload}
          puzzleId={puzzle.id}
          mode={mode}
          meta={meta}
        />
      )}
    </PuzzleGate>
  );
};

export default QueensGame;
