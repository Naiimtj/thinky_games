import { useEffect, useMemo } from 'react';

import BaseButton from '../../components/base/BaseButton';
import ZipGameBoard from '../../components/ZipGameBoard';
import { coordsEqual, isPuzzleSolved, solveZip } from '../../logic/zipLogic';
import { useZipStore } from '../../store/useZipStore';
import { GameShell, RulesSection } from '../GameShell';
import { buildStorageKey, readStorage, writeStorage } from '../gamePersistence';
import { PuzzleGate } from '../PuzzleGate';
import { useDailyPuzzle } from '../useDailyPuzzle';
import { GAME_STATE, useGameSession } from '../useGameSession';

const ZipBoard = ({ puzzle: targetPuzzle, mode, meta }) => {
  const initGame = useZipStore((state) => state.initGame);
  const activeId = useZipStore((state) => state.puzzle?.id);
  const puzzle = useZipStore((state) => state.puzzle);
  const currentPath = useZipStore((state) => state.currentPath);
  const resetGame = useZipStore((state) => state.resetGame);
  const restorePath = useZipStore((state) => state.restorePath);

  const boardKey = buildStorageKey('zip', mode, targetPuzzle.id, 'board');

  // Load the puzzle only when it changes, restoring any persisted path so a
  // page reload resumes mid-game instead of resetting.
  useEffect(() => {
    if (activeId !== targetPuzzle.id) {
      initGame(targetPuzzle);
      restorePath(readStorage(boardKey));
    }
  }, [activeId, targetPuzzle, initGame, boardKey, restorePath]);

  // Persist the drawn path as it grows.
  useEffect(() => {
    writeStorage(boardKey, currentPath);
  }, [boardKey, currentPath]);

  const solved = useMemo(
    () => isPuzzleSolved(puzzle, currentPath),
    [puzzle, currentPath],
  );
  const solution = useMemo(() => solveZip(puzzle), [puzzle]);
  const session = useGameSession({
    gameId: 'zip',
    mode,
    puzzleId: targetPuzzle.id,
    isSolved: solved,
    getSolution: () => currentPath,
  });

  const handleReset = () => {
    resetGame();
    session.reset();
  };

  // Reveal the next correct cell: keep the longest prefix of the drawn path
  // that still matches the solution, then extend it by one step.
  const handleHint = () => {
    if (!solution) return;
    let matchLength = 0;
    while (
      matchLength < currentPath.length &&
      matchLength < solution.length &&
      coordsEqual(currentPath[matchLength], solution[matchLength])
    ) {
      matchLength += 1;
    }
    restorePath(solution.slice(0, matchLength + 1));
    session.addSeconds(10);
  };

  return (
    <GameShell
      title={meta?.name ?? 'Zip'}
      tagline="Une los números en un solo trazo"
      mode={mode}
      elapsed={session.elapsed}
      state={session.state}
      onReset={handleReset}
      hint="Empieza en el 1 y arrastra para conectar los números en orden, llenando todas las casillas."
    >
      <ZipGameBoard />

      <BaseButton
        variant="warning"
        outlined
        onClick={handleHint}
        disabled={session.state === GAME_STATE.WON || !solution}
        className="mt-3 w-full rounded-full disabled:cursor-not-allowed"
      >
        Pista: letra (+10s)
      </BaseButton>

      <RulesSection>
        <li>
          Empieza en el número <span className="font-bold">1</span> y traza un
          camino hasta el número más alto, en orden.
        </li>
        <li>Debes pasar por todas las casillas del tablero.</li>
        <li>El camino no puede cruzarse a sí mismo.</li>
      </RulesSection>
    </GameShell>
  );
};

/** Fetches the backend-generated puzzle, then renders the board once ready. */
const ZipGame = ({ mode, meta }) => {
  const { puzzle, loading, error } = useDailyPuzzle('zip', mode);
  const targetPuzzle = useMemo(
    () => (puzzle ? { id: puzzle.id, ...puzzle.payload } : null),
    [puzzle],
  );
  return (
    <PuzzleGate loading={loading} error={error}>
      {targetPuzzle && (
        <ZipBoard puzzle={targetPuzzle} mode={mode} meta={meta} />
      )}
    </PuzzleGate>
  );
};

export default ZipGame;
