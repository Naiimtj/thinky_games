import BaseButton from '../../components/base/BaseButton';
import { GameShell, RulesSection } from '../GameShell';
import { buildStorageKey, usePersistedState } from '../gamePersistence';
import { PuzzleGate } from '../PuzzleGate';
import { useDailyPuzzle } from '../useDailyPuzzle';
import { useGameSession } from '../useGameSession';

const optionTone = (isAnswer, isWrong) => {
  if (isAnswer) return 'border-emerald-300 bg-emerald-100 text-emerald-800';
  if (isWrong) return 'border-red-200 bg-red-50 text-red-400 line-through';
  return 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
};

const PinpointBoard = ({ puzzle, puzzleId, mode, meta }) => {
  const boardKey = buildStorageKey('pinpoint', mode, puzzleId, 'board');
  const [guessState, setGuessState] = usePersistedState(boardKey, () => ({
    revealed: 1,
    wrong: [],
    solved: false,
  }));
  const { revealed, wrong, solved } = guessState;

  const session = useGameSession({
    gameId: 'pinpoint',
    mode,
    puzzleId,
    isSolved: solved,
    getSolution: () => puzzle.answer,
  });

  const guess = (option) => {
    if (solved || wrong.includes(option)) return;
    if (option === puzzle.answer) {
      setGuessState((prev) => ({ ...prev, solved: true }));
      return;
    }
    setGuessState((prev) => ({
      ...prev,
      wrong: [...prev.wrong, option],
      revealed: Math.min(prev.revealed + 1, puzzle.clues.length),
    }));
  };

  const handleReset = () => {
    setGuessState({ revealed: 1, wrong: [], solved: false });
    session.reset();
  };

  const handleHint = () => {
    if (solved || revealed >= puzzle.clues.length) return;
    setGuessState((prev) => ({
      ...prev,
      revealed: Math.min(prev.revealed + 1, puzzle.clues.length),
    }));
    session.addSeconds(10);
  };

  return (
    <GameShell
      title={meta?.name ?? 'Pinpoint'}
      tagline="Adivina la categoría que conecta las pistas."
      mode={mode}
      elapsed={session.elapsed}
      state={session.state}
      onReset={handleReset}
      hint="Cada fallo revela una pista más."
    >
      <ol className="mb-4 space-y-2">
        {puzzle.clues.map((clue, index) => {
          const visible = index < revealed || solved;
          return (
            <li
              key={clue}
              className={`rounded-lg border px-3 py-2 text-center font-semibold ${
                visible
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                  : 'border-dashed border-slate-200 text-slate-300'
              }`}
            >
              {visible ? clue : '● ● ●'}
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-1 gap-2">
        {puzzle.options.map((option) => {
          const isWrong = wrong.includes(option);
          const isAnswer = solved && option === puzzle.answer;
          return (
            <button
              key={option}
              type="button"
              disabled={isWrong || solved}
              onClick={() => guess(option)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${optionTone(isAnswer, isWrong)}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <BaseButton
        variant="warning"
        outlined
        onClick={handleHint}
        disabled={solved || revealed >= puzzle.clues.length}
        className="mt-3 w-full"
      >
        💡 Pista (+10 s)
      </BaseButton>

      <RulesSection>
        <li>Las pistas comparten una categoría en común.</li>
        <li>Adivina la categoría eligiendo una opción de la lista.</li>
        <li>Cada respuesta incorrecta revela una pista adicional.</li>
        <li>Usa Pista para revelar una pista adicional (+10 s).</li>
      </RulesSection>
    </GameShell>
  );
};

/** Fetches the backend-generated puzzle, then renders the board once ready. */
const PinpointGame = ({ mode, meta }) => {
  const { puzzle, loading, error } = useDailyPuzzle('pinpoint', mode);
  return (
    <PuzzleGate loading={loading} error={error}>
      {puzzle && (
        <PinpointBoard
          puzzle={puzzle.payload}
          puzzleId={puzzle.id}
          mode={mode}
          meta={meta}
        />
      )}
    </PuzzleGate>
  );
};

export default PinpointGame;
