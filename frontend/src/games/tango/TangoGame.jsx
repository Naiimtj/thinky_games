import { useEffect, useMemo, useState } from 'react';

import BaseButton from '../../components/base/BaseButton';
import { Moon } from '../../components/icons/Moon';
import { Sun } from '../../components/icons/Sun';
import { GameShell, RulesSection } from '../GameShell';
import { buildStorageKey, usePersistedState } from '../gamePersistence';
import { PuzzleGate } from '../PuzzleGate';
import { useDailyPuzzle } from '../useDailyPuzzle';
import { useGameSession } from '../useGameSession';
import {
  EMPTY,
  MOON,
  SUN,
  buildTangoGrid,
  constraintMarkers,
  cycleSymbol,
  findTangoErrors,
  givenKeys,
  isTangoSolved,
  solveTango,
} from './tangoLogic';

const SYMBOL = {
  [SUN]: <Sun className="h-10 w-10 text-amber-500" />,
  [MOON]: <Moon className="h-10 w-10 text-slate-500" />,
};
const key = (row, col) => `${row},${col}`;

const toggleSymbol = (grid, row, col) =>
  grid.map((r, ri) =>
    ri === row ? r.map((v, ci) => (ci === col ? cycleSymbol(v) : v)) : r,
  );

const setCellValue = (grid, row, col, value) =>
  grid.map((r, ri) =>
    ri === row ? r.map((v, ci) => (ci === col ? value : v)) : r,
  );

const TangoBoard = ({ puzzle, puzzleId, mode, meta }) => {
  const { size, constraints } = puzzle;
  const fixed = useMemo(() => givenKeys(puzzle), [puzzle]);
  const markers = useMemo(() => constraintMarkers(constraints), [constraints]);

  const boardKey = buildStorageKey('tango', mode, puzzleId, 'board');
  const [grid, setGrid] = usePersistedState(boardKey, () =>
    buildTangoGrid(puzzle),
  );

  const liveErrors = useMemo(
    () => findTangoErrors(grid, size, constraints),
    [grid, size, constraints],
  );
  const [errorCells, setErrorCells] = useState(() => new Set());
  useEffect(() => {
    if (liveErrors.size === 0) {
      setErrorCells(liveErrors);
      return undefined;
    }
    const timer = setTimeout(() => setErrorCells(liveErrors), 2000);
    return () => clearTimeout(timer);
  }, [liveErrors]);

  const solved = useMemo(
    () => isTangoSolved(grid, size, constraints),
    [grid, size, constraints],
  );
  const solution = useMemo(() => solveTango(puzzle), [puzzle]);
  const session = useGameSession({
    gameId: 'tango',
    mode,
    puzzleId,
    isSolved: solved,
    getSolution: () => grid,
  });

  const gridTemplate = `repeat(${size}, minmax(0, 1fr))`;

  const cycle = (row, col) => {
    if (fixed.has(key(row, col))) return;
    setGrid((prev) => toggleSymbol(prev, row, col));
  };

  const handleReset = () => {
    setGrid(buildTangoGrid(puzzle));
    session.reset();
  };

  const handleHint = () => {
    if (!solution) return;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (fixed.has(key(row, col))) continue;
        if (grid[row][col] !== solution[row][col]) {
          const value = solution[row][col];
          setGrid((prev) => setCellValue(prev, row, col, value));
          session.addSeconds(10);
          return;
        }
      }
    }
  };

  return (
    <GameShell
      title={meta?.name ?? 'Tango'}
      tagline="Tres ☀️ y tres 🌙 por fila y columna; nunca tres seguidos."
      mode={mode}
      elapsed={session.elapsed}
      state={session.state}
      onReset={handleReset}
      hint="= iguales · × opuestos. Toca para cambiar ☀️/🌙."
    >
      <p role="status" aria-live="polite" className="sr-only">
        {errorCells.size > 0 ? 'Hay una regla incumplida en el tablero.' : ''}
      </p>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border-2 border-slate-600 bg-white">
        <div
          className="grid h-full w-full"
          style={{
            gridTemplateColumns: gridTemplate,
            gridTemplateRows: gridTemplate,
          }}
        >
          {grid.flatMap((r, row) =>
            r.map((value, col) => {
              const isFixed = fixed.has(key(row, col));
              const hasError = errorCells.has(key(row, col));
              return (
                <button
                  key={key(row, col)}
                  type="button"
                  onClick={() => cycle(row, col)}
                  aria-invalid={hasError}
                  className={`flex items-center justify-center border border-slate-200 ${isFixed ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'} ${hasError ? 'bg-red-100 ring-2 ring-inset ring-red-500' : ''}`}
                >
                  {value === EMPTY ? null : SYMBOL[value]}
                </button>
              );
            }),
          )}
        </div>
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${size} ${size}`}
          preserveAspectRatio="none"
        >
          {markers.map((marker) => (
            <g key={`${marker.label}-${marker.x}-${marker.y}`}>
              <text
                x={marker.x}
                y={marker.y}
                fontSize={0.26}
                fontWeight="700"
                fill="#475569"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {marker.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <BaseButton
        variant="warning"
        outlined
        onClick={handleHint}
        disabled={solved || !solution}
        className="mt-3 w-full"
      >
        💡 Pista (+10 s)
      </BaseButton>

      <RulesSection>
        <li>Cada fila y columna debe tener tres ☀️ y tres 🌙.</li>
        <li>No puede haber tres símbolos iguales seguidos.</li>
        <li>
          <span className="font-bold">=</span> obliga a que las celdas sean
          iguales; <span className="font-bold">×</span> obliga a que sean
          opuestas.
        </li>
        <li>Usa Pista para revelar una casilla correcta (+10 s).</li>
      </RulesSection>
    </GameShell>
  );
};

/** Fetches the backend-generated puzzle, then renders the board once ready. */
const TangoGame = ({ mode, meta }) => {
  const { puzzle, loading, error } = useDailyPuzzle('tango', mode);
  return (
    <PuzzleGate loading={loading} error={error}>
      {puzzle && (
        <TangoBoard
          puzzle={puzzle.payload}
          puzzleId={puzzle.id}
          mode={mode}
          meta={meta}
        />
      )}
    </PuzzleGate>
  );
};

export default TangoGame;
