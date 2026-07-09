import { useEffect, useMemo, useRef, useState } from 'react';

import BaseButton from '../../components/base/BaseButton';
import { GameShell, RulesSection } from '../GameShell';
import { buildStorageKey, usePersistedState } from '../gamePersistence';
import { PuzzleGate } from '../PuzzleGate';
import { useDailyPuzzle } from '../useDailyPuzzle';
import { useGameSession } from '../useGameSession';
import {
  areAdjacent,
  cellKey,
  findWordPath,
  pathIncludes,
  wordFromPath,
} from './wendLogic';

const readCell = (element) => {
  const target = element?.closest?.('[data-cell]');
  if (!target) return null;
  return { row: Number(target.dataset.row), col: Number(target.dataset.col) };
};

const cellTone = (isFound, isActive, isWrong) => {
  if (isWrong) return 'bg-red-300 text-red-900 animate-pulse';
  if (isActive) return 'bg-indigo-300 text-indigo-900';
  if (isFound) return 'bg-emerald-200 text-emerald-900';
  return 'bg-white text-slate-700 hover:bg-slate-50';
};

const WendBoard = ({ puzzle, puzzleId, mode, meta }) => {
  const { size, grid, words, definitions } = puzzle;
  const answers = useMemo(() => new Set(words), [words]);

  const boardKey = buildStorageKey('wend', mode, puzzleId, 'board');
  const [found, setFound] = usePersistedState(boardKey, () => []);
  const defsKey = buildStorageKey('wend', mode, puzzleId, 'defs');
  const [revealedDefs, setRevealedDefs] = usePersistedState(defsKey, () => []);
  const [path, setPath] = useState([]);
  const [wrong, setWrong] = useState([]);
  const drawing = useRef(false);
  const wrongTimer = useRef(null);

  useEffect(() => {
    setPath([]);
    setWrong([]);
  }, [puzzle]);

  useEffect(() => () => clearTimeout(wrongTimer.current), []);

  const solved = found.length === words.length;
  const session = useGameSession({
    gameId: 'wend',
    mode,
    puzzleId,
    isSolved: solved,
    getSolution: () => found,
  });

  const foundKeys = useMemo(() => {
    const keys = new Set();
    found.forEach((entry) =>
      entry.cells.forEach(({ row, col }) => keys.add(cellKey(row, col))),
    );
    return keys;
  }, [found]);
  const activeKeys = new Set(path.map(({ row, col }) => cellKey(row, col)));
  const wrongKeys = new Set(wrong.map(({ row, col }) => cellKey(row, col)));

  const begin = (cell) => {
    if (foundKeys.has(cellKey(cell.row, cell.col))) return;
    drawing.current = true;
    setWrong([]);
    setPath([cell]);
  };

  const extend = (cell) => {
    if (!drawing.current) return;
    setPath((current) => {
      if (current.length === 0) return current;
      const last = current[current.length - 1];
      if (last.row === cell.row && last.col === cell.col) return current;
      const secondLast = current[current.length - 2];
      if (
        secondLast &&
        secondLast.row === cell.row &&
        secondLast.col === cell.col
      ) {
        return current.slice(0, -1);
      }
      if (
        !areAdjacent(last, cell) ||
        pathIncludes(current, cell) ||
        foundKeys.has(cellKey(cell.row, cell.col))
      )
        return current;
      return [...current, cell];
    });
  };

  const finish = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setPath((current) => {
      const word = wordFromPath(grid, current);
      const alreadyFound = found.some((entry) => entry.word === word);
      if (current.length > 1 && answers.has(word) && !alreadyFound) {
        setFound((prev) => [...prev, { word, cells: current }]);
      } else if (current.length > 1) {
        setWrong(current);
        clearTimeout(wrongTimer.current);
        wrongTimer.current = setTimeout(() => setWrong([]), 500);
      }
      return [];
    });
  };

  const handlePointerMove = (event) => {
    if (!drawing.current) return;
    const cell = readCell(
      document.elementFromPoint(event.clientX, event.clientY),
    );
    if (cell) extend(cell);
  };

  const handleReset = () => {
    setFound([]);
    setRevealedDefs([]);
    setPath([]);
    setWrong([]);
    drawing.current = false;
    session.reset();
  };

  const handleUndo = () => {
    drawing.current = false;
    setPath((current) => current.slice(0, -1));
  };

  const handleLetterHint = () => {
    const nextWord = words.find(
      (word) => !found.some((entry) => entry.word === word),
    );
    if (!nextWord) return;

    const hintPath = findWordPath(grid, nextWord, foundKeys);
    if (!hintPath) return;

    drawing.current = false;
    setWrong([]);
    clearTimeout(wrongTimer.current);
    session.addSeconds(10);

    setPath((current) => {
      const matches = current.every(
        (cell, index) =>
          hintPath[index] &&
          cell.row === hintPath[index].row &&
          cell.col === hintPath[index].col,
      );
      const base = matches ? current : [];
      const next = hintPath.slice(0, base.length + 1);
      if (next.length === hintPath.length) {
        setFound((prev) => [...prev, { word: nextWord, cells: next }]);
        return [];
      }
      return next;
    });
  };

  const nextDefinitionWord = words.find(
    (word) =>
      !found.some((entry) => entry.word === word) &&
      definitions?.[word] &&
      !revealedDefs.includes(word),
  );

  const handleDefinitionHint = () => {
    if (!nextDefinitionWord) return;
    setRevealedDefs((prev) => [...prev, nextDefinitionWord]);
    session.addSeconds(5);
  };

  const forming = wordFromPath(grid, path);

  return (
    <GameShell
      title={meta?.name ?? 'Wend'}
      tagline="Encuentra 5 palabras ocultas entre las letras, en horizontal y vertical."
      mode={mode}
      elapsed={session.elapsed}
      state={session.state}
      onReset={handleReset}
      hint="Arrastra por letras contiguas en horizontal y vertical (sin diagonales)."
    >
      <div className="mb-2 h-6 text-center font-mono text-lg font-bold tracking-widest text-indigo-600">
        {forming}
      </div>

      <div
        className="mx-auto grid touch-none select-none gap-2"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          maxWidth: `${size * 4}rem`,
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={finish}
        onPointerLeave={finish}
      >
        {grid.flatMap((letters, row) =>
          letters.map((letter, col) => {
            const key = cellKey(row, col);
            if (!letter) {
              return (
                <div key={key} aria-hidden="true" className="aspect-square" />
              );
            }
            return (
              <button
                key={key}
                type="button"
                data-cell
                data-row={row}
                data-col={col}
                onPointerDown={(event) => {
                  event.preventDefault();
                  begin({ row, col });
                }}
                className={`flex aspect-square items-center justify-center rounded-lg border border-slate-200 text-2xl font-black transition-colors ${cellTone(
                  foundKeys.has(key),
                  activeKeys.has(key),
                  wrongKeys.has(key),
                )}`}
              >
                {letter}
              </button>
            );
          }),
        )}
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <BaseButton
          variant="secondary"
          outlined
          onClick={handleUndo}
          disabled={path.length === 0}
          className="disabled:cursor-not-allowed"
        >
          Deshacer
        </BaseButton>
        <BaseButton
          variant="warning"
          outlined
          onClick={handleLetterHint}
          disabled={solved}
          className="flex-1 rounded-full disabled:cursor-not-allowed"
        >
          Pista: letra (+10s)
        </BaseButton>
        <BaseButton
          variant="warning"
          outlined
          onClick={handleDefinitionHint}
          disabled={solved || !nextDefinitionWord}
          className="flex-1 rounded-full disabled:cursor-not-allowed"
        >
          Pista: definición (+5s)
        </BaseButton>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {words.map((word) => {
          const isFound = found.some((entry) => entry.word === word);
          const definition = definitions?.[word];
          return (
            <div key={word} className="flex flex-col gap-1">
              <span
                className={`self-start rounded-full px-3 py-1 text-sm font-semibold ${isFound ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
              >
                {isFound ? word : `${word.length} letras`}
              </span>
              {(solved || revealedDefs.includes(word)) && definition && (
                <p className="px-3 text-sm leading-snug text-slate-600 dark:text-primary">
                  {definition}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <RulesSection>
        <li>
          Hay 5 palabras ocultas entre letras de relleno: encuéntralas
          arrastrando por letras contiguas en horizontal y vertical (sin
          diagonales).
        </li>
        <li>Cada trazo debe formar una de las palabras de la lista.</li>
        <li>
          Las palabras no se solapan y sobran letras sueltas, como en una sopa
          de letras.
        </li>
        <li>
          «Pista: letra» revela la siguiente letra correcta (+10 s). «Pista:
          definición» muestra la definición de una palabra (+5 s).
        </li>
        <li>
          Al completar el puzzle verás la definición de cada palabra debajo de
          su nombre.
        </li>
      </RulesSection>
    </GameShell>
  );
};

/** Fetches the backend-generated puzzle, then renders the board once ready. */
const WendGame = ({ mode, meta }) => {
  const { puzzle, loading, error } = useDailyPuzzle('wend', mode);
  return (
    <PuzzleGate loading={loading} error={error}>
      {puzzle && (
        <WendBoard
          puzzle={puzzle.payload}
          puzzleId={puzzle.id}
          mode={mode}
          meta={meta}
        />
      )}
    </PuzzleGate>
  );
};

export default WendGame;
