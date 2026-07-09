import { useEffect, useMemo, useRef, useState } from 'react';

import BaseButton from '../../components/base/BaseButton';
import { GameShell, RulesSection } from '../GameShell';
import { buildStorageKey, usePersistedState } from '../gamePersistence';
import { PuzzleGate } from '../PuzzleGate';
import { useDailyPuzzle } from '../useDailyPuzzle';
import { GAME_STATE, useGameSession } from '../useGameSession';
import {
  buildSudokuGrid,
  givenMask,
  hasConflict,
  isGroupComplete,
  isSudokuSolved,
  solveSudoku,
} from './sudokuLogic';

const FLASH_DURATION_MS = 2000;

const setCellValue = (grid, row, col, value) =>
  grid.map((r, ri) =>
    ri === row ? r.map((v, ci) => (ci === col ? value : v)) : r,
  );

const withoutIds = (set, ids) =>
  new Set([...set].filter((id) => !ids.includes(id)));

const cellTone = (isFixed, conflict) => {
  if (isFixed) return 'text-slate-800';
  if (conflict) return 'bg-red-50 text-red-600';
  return 'bg-white text-indigo-600';
};

const SudokuBoard = ({ puzzle, puzzleId, mode, meta }) => {
  const { size, boxHeight, boxWidth } = puzzle;
  const fixed = useMemo(() => givenMask(puzzle), [puzzle]);

  const boardKey = buildStorageKey('sudoku', mode, puzzleId, 'board');
  const [grid, setGrid] = usePersistedState(boardKey, () =>
    buildSudokuGrid(puzzle),
  );

  const [flash, setFlash] = useState({
    rows: new Set(),
    cols: new Set(),
    boxes: new Set(),
  });
  const prevCompleteRef = useRef({ rows: [], cols: [], boxes: {} });

  useEffect(() => {
    const rowsComplete = grid.map((row) => isGroupComplete(row, size));
    const colsComplete = Array.from({ length: size }, (_, c) =>
      isGroupComplete(
        grid.map((row) => row[c]),
        size,
      ),
    );
    const boxesComplete = {};
    for (let br = 0; br < size; br += boxHeight) {
      for (let bc = 0; bc < size; bc += boxWidth) {
        const box = [];
        for (let i = 0; i < boxHeight; i++)
          for (let j = 0; j < boxWidth; j++) box.push(grid[br + i][bc + j]);
        boxesComplete[`${br},${bc}`] = isGroupComplete(box, size);
      }
    }

    const prev = prevCompleteRef.current;
    const newRows = rowsComplete.flatMap((complete, i) =>
      complete && !prev.rows[i] ? [i] : [],
    );
    const newCols = colsComplete.flatMap((complete, i) =>
      complete && !prev.cols[i] ? [i] : [],
    );
    const newBoxes = Object.keys(boxesComplete).filter(
      (key) => boxesComplete[key] && !prev.boxes[key],
    );
    prevCompleteRef.current = {
      rows: rowsComplete,
      cols: colsComplete,
      boxes: boxesComplete,
    };

    if (newRows.length || newCols.length || newBoxes.length) {
      setFlash((current) => ({
        rows: new Set([...current.rows, ...newRows]),
        cols: new Set([...current.cols, ...newCols]),
        boxes: new Set([...current.boxes, ...newBoxes]),
      }));
      setTimeout(() => {
        setFlash((current) => ({
          rows: withoutIds(current.rows, newRows),
          cols: withoutIds(current.cols, newCols),
          boxes: withoutIds(current.boxes, newBoxes),
        }));
      }, FLASH_DURATION_MS);
    }
  }, [grid, size, boxHeight, boxWidth]);

  const solved = useMemo(
    () => isSudokuSolved(grid, size, boxHeight, boxWidth),
    [grid, size, boxHeight, boxWidth],
  );
  const solution = useMemo(
    () => solveSudoku(puzzle.given, size, boxHeight, boxWidth),
    [puzzle, size, boxHeight, boxWidth],
  );
  const session = useGameSession({
    gameId: 'sudoku',
    mode,
    puzzleId,
    isSolved: solved,
    getSolution: () => grid,
  });

  const setCell = (row, col, raw) => {
    if (fixed[row][col]) return;
    const digit = raw.replace(/[^1-6]/g, '').slice(-1);
    const value = digit ? Number(digit) : 0;
    setGrid((prev) => setCellValue(prev, row, col, value));
  };

  const handleReset = () => {
    setGrid(buildSudokuGrid(puzzle));
    session.reset();
  };

  // Reveal the next incorrect or empty non-fixed cell with its correct value.
  const handleHint = () => {
    if (!solution) return;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (fixed[row][col] || grid[row][col] === solution[row][col]) {
          continue;
        }
        setGrid((prev) => setCellValue(prev, row, col, solution[row][col]));
        session.addSeconds(10);
        return;
      }
    }
  };

  const boxBorders = (row, col) =>
    [
      (col + 1) % boxWidth === 0 && col !== size - 1
        ? 'border-r-2 border-r-slate-500'
        : 'border-r border-r-slate-200',
      (row + 1) % boxHeight === 0 && row !== size - 1
        ? 'border-b-2 border-b-slate-500'
        : 'border-b border-b-slate-200',
    ].join(' ');

  const cellPercent = 100 / size;
  const groupOverlays = [
    ...[...flash.rows].map((r) => ({
      key: `row-${r}`,
      top: r * cellPercent,
      left: 0,
      width: 100,
      height: cellPercent,
    })),
    ...[...flash.cols].map((c) => ({
      key: `col-${c}`,
      top: 0,
      left: c * cellPercent,
      width: cellPercent,
      height: 100,
    })),
    ...[...flash.boxes].map((key) => {
      const [br, bc] = key.split(',').map(Number);
      return {
        key: `box-${key}`,
        top: br * cellPercent,
        left: bc * cellPercent,
        width: boxWidth * cellPercent,
        height: boxHeight * cellPercent,
      };
    }),
  ];

  return (
    <GameShell
      title={meta?.name ?? 'Mini Sudoku'}
      tagline="Del 1 al 6 sin repetir en fila, columna ni caja."
      mode={mode}
      elapsed={session.elapsed}
      state={session.state}
      onReset={handleReset}
      hint="Escribe un número del 1 al 6 en cada casilla."
    >
      <div className="relative overflow-hidden rounded-xl border-2 border-slate-500">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {grid.flatMap((r, row) =>
            r.map((value, col) => {
              const isFixed = fixed[row][col];
              const conflict = hasConflict(
                grid,
                size,
                boxHeight,
                boxWidth,
                row,
                col,
              );
              return (
                <input
                  key={`${row},${col}`}
                  value={value === 0 ? '' : value}
                  onChange={(event) => setCell(row, col, event.target.value)}
                  readOnly={isFixed}
                  inputMode="numeric"
                  aria-label={`Fila ${row + 1}, columna ${col + 1}`}
                  className={`aspect-square w-full text-center text-xl font-bold outline-none transition-colors duration-300 focus:bg-indigo-50 ${boxBorders(row, col)} ${cellTone(isFixed, conflict)}`}
                />
              );
            }),
          )}
        </div>
        {groupOverlays.map((overlay) => (
          <div
            key={overlay.key}
            className="pointer-events-none absolute rounded-sm border-2 border-green-500"
            style={{
              top: `${overlay.top}%`,
              left: `${overlay.left}%`,
              width: `${overlay.width}%`,
              height: `${overlay.height}%`,
            }}
          />
        ))}
      </div>

      <BaseButton
        variant="warning"
        outlined
        onClick={handleHint}
        disabled={session.state === GAME_STATE.WON || !solution}
        className="mt-3 w-full"
      >
        💡 Pista (+10 s)
      </BaseButton>

      <RulesSection>
        <li>Completa la cuadrícula con números del 1 al 6.</li>
        <li>Ningún número puede repetirse en una fila, columna o caja.</li>
        <li>Las casillas sombreadas ya están fijas y no se pueden editar.</li>
      </RulesSection>
    </GameShell>
  );
};

/** Fetches the backend-generated puzzle, then renders the board once ready. */
const SudokuGame = ({ mode, meta }) => {
  const { puzzle, loading, error } = useDailyPuzzle('sudoku', mode);
  return (
    <PuzzleGate loading={loading} error={error}>
      {puzzle && (
        <SudokuBoard
          puzzle={puzzle.payload}
          puzzleId={puzzle.id}
          mode={mode}
          meta={meta}
        />
      )}
    </PuzzleGate>
  );
};

export default SudokuGame;
