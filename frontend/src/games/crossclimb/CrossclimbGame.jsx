import { Fragment, useEffect, useState } from 'react';

import BaseButton from '../../components/base/BaseButton';
import { GameShell, RulesSection } from '../GameShell';
import { buildStorageKey, usePersistedState } from '../gamePersistence';
import { PuzzleGate } from '../PuzzleGate';
import { useDailyPuzzle } from '../useDailyPuzzle';
import { useGameSession } from '../useGameSession';
import {
  differsByOne,
  isValidLadder,
  moveInOrder,
  sanitizeInput,
  scrambleOrder,
} from './crossclimbLogic';

const Connector = ({ active }) => (
  <div className="flex h-3 items-center justify-center">
    <div
      className={`h-full w-1 rounded ${active ? 'bg-emerald-400' : 'bg-slate-200'}`}
    />
  </div>
);

const Rung = ({
  clue,
  value,
  onChange,
  solved,
  length,
  draggable,
  isDragging,
  onGrab,
  index,
}) => (
  <div
    data-rung={draggable ? '' : undefined}
    data-index={index}
    className={`flex items-center gap-2 rounded-lg border px-2 py-2 ${
      solved ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'
    } ${isDragging ? 'opacity-60 ring-2 ring-indigo-400' : ''}`}
  >
    {draggable ? (
      <BaseButton
        variant="secondary"
        text
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onGrab();
        }}
        className="cursor-grab touch-none px-1 text-lg text-slate-400 hover:no-underline"
        aria-label="Arrastrar para reordenar"
      >
        ⠿
      </BaseButton>
    ) : (
      <span className="px-1 text-slate-300">★</span>
    )}
    <span className="flex-1 text-sm text-slate-600">{clue}</span>
    <input
      value={value}
      onChange={(event) => onChange(sanitizeInput(event.target.value, length))}
      readOnly={solved}
      maxLength={length}
      placeholder={'·'.repeat(length)}
      aria-label={`Respuesta (${length} letras)`}
      className={`w-24 rounded-md border px-2 py-1 text-center font-mono text-lg font-bold uppercase tracking-[0.3em] outline-none placeholder:text-slate-300 ${
        solved
          ? 'border-emerald-300 bg-white text-emerald-700'
          : 'border-slate-300 focus:border-indigo-400'
      }`}
    />
  </div>
);

const CrossclimbBoard = ({ puzzle, puzzleId, mode, meta }) => {
  const { length, rungs, top, bottom } = puzzle;
  const count = rungs.length;

  const boardKey = buildStorageKey('crossclimb', mode, puzzleId, 'board');
  const [board, setBoard] = usePersistedState(boardKey, () => ({
    order: scrambleOrder(count),
    answers: {},
    topAnswer: '',
    bottomAnswer: '',
  }));
  const { order, answers, topAnswer, bottomAnswer } = board;
  const setOrder = (next) =>
    setBoard((prev) => ({
      ...prev,
      order: typeof next === 'function' ? next(prev.order) : next,
    }));
  const setAnswers = (next) =>
    setBoard((prev) => ({
      ...prev,
      answers: typeof next === 'function' ? next(prev.answers) : next,
    }));
  const setTopAnswer = (value) =>
    setBoard((prev) => ({ ...prev, topAnswer: value }));
  const setBottomAnswer = (value) =>
    setBoard((prev) => ({ ...prev, bottomAnswer: value }));
  const [dragging, setDragging] = useState(null);

  useEffect(() => {
    setDragging(null);
  }, [puzzle]);

  const rungSolved = (id) => (answers[id] ?? '') === rungs[id].word;
  const topSolved = topAnswer === top.word;
  const bottomSolved = bottomAnswer === bottom.word;
  const allSolved =
    topSolved && bottomSolved && rungs.every((_, id) => rungSolved(id));
  const orderedWords = order.map((id) => rungs[id].word);
  const ladderValid = isValidLadder([top.word, ...orderedWords, bottom.word]);
  const solved = allSolved && ladderValid;

  const session = useGameSession({
    gameId: 'crossclimb',
    mode,
    puzzleId,
    isSolved: solved,
    getSolution: () => [top.word, ...orderedWords, bottom.word],
  });

  const handlePointerMove = (event) => {
    if (dragging === null) return;
    const element = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest('[data-rung]');
    if (element?.dataset.index === undefined) return;
    setOrder((current) =>
      moveInOrder(current, dragging, Number(element.dataset.index)),
    );
  };
  const stopDrag = () => setDragging(null);

  const handleReset = () => {
    setBoard({
      order: scrambleOrder(count),
      answers: {},
      topAnswer: '',
      bottomAnswer: '',
    });
    setDragging(null);
    session.reset();
  };

  const handleHint = () => {
    if (!topSolved) {
      setTopAnswer(top.word);
      session.addSeconds(10);
      return;
    }
    const nextRung = rungs.findIndex((_, id) => !rungSolved(id));
    if (nextRung !== -1) {
      setAnswers((prev) => ({ ...prev, [nextRung]: rungs[nextRung].word }));
      session.addSeconds(10);
      return;
    }
    if (!bottomSolved) {
      setBottomAnswer(bottom.word);
      session.addSeconds(10);
    }
  };

  const linkActive = (aWord, aOk, bWord, bOk) =>
    aOk && bOk && differsByOne(aWord, bWord);

  return (
    <GameShell
      title={meta?.name ?? 'Crossclimb'}
      tagline={`Adivina ${count + 2} palabras de ${length} letras y ordénalas en una escalera.`}
      mode={mode}
      elapsed={session.elapsed}
      state={session.state}
      onReset={handleReset}
      hint={`Cada casilla admite ${length} letras (· = espacio vacío). Arrastra ⠿ para reordenar.`}
    >
      <div
        className="flex touch-none flex-col"
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerLeave={stopDrag}
      >
        <Rung
          clue={top.clue}
          value={topAnswer}
          onChange={setTopAnswer}
          solved={topSolved}
          length={length}
        />
        <Connector
          active={linkActive(
            top.word,
            topSolved,
            orderedWords[0],
            rungSolved(order[0]),
          )}
        />
        {order.map((id, idx) => (
          <Fragment key={id}>
            <Rung
              clue={rungs[id].clue}
              value={answers[id] ?? ''}
              onChange={(next) =>
                setAnswers((prev) => ({ ...prev, [id]: next }))
              }
              solved={rungSolved(id)}
              length={length}
              draggable
              isDragging={dragging === id}
              onGrab={() => setDragging(id)}
              index={idx}
            />
            {idx < count - 1 && (
              <Connector
                active={linkActive(
                  rungs[id].word,
                  rungSolved(id),
                  rungs[order[idx + 1]].word,
                  rungSolved(order[idx + 1]),
                )}
              />
            )}
          </Fragment>
        ))}
        <Connector
          active={linkActive(
            orderedWords[count - 1],
            rungSolved(order[count - 1]),
            bottom.word,
            bottomSolved,
          )}
        />
        <Rung
          clue={bottom.clue}
          value={bottomAnswer}
          onChange={setBottomAnswer}
          solved={bottomSolved}
          length={length}
        />
      </div>

      <BaseButton
        variant="warning"
        outlined
        onClick={handleHint}
        disabled={solved}
        className="mt-3 w-full"
      >
        💡 Pista (+10 s)
      </BaseButton>

      <RulesSection>
        <li>
          Cada palabra de la escalera tiene{' '}
          <span className="font-bold">{length} letras</span>; los puntos · en
          cada casilla marcan las letras que faltan por escribir.
        </li>
        <li>
          Lee la pista de cada peldaño (★ arriba y abajo, ⠿ en el medio) y
          escribe la palabra que corresponde.
        </li>
        <li>
          Arrastra ⠿ para reordenar los peldaños del medio hasta que cada
          palabra difiera en <span className="font-bold">una sola letra</span>{' '}
          de la palabra que va justo arriba y de la que va justo abajo.
        </li>
        <li>
          Cuando toda la escalera quede bien ordenada y conectada (arriba ↔
          medio ↔ abajo), el puzzle se resuelve.
        </li>
        <li>Usa Pista para revelar la siguiente palabra (+10 s).</li>
      </RulesSection>
    </GameShell>
  );
};

/** Fetches the backend-generated puzzle, then renders the board once ready. */
const CrossclimbGame = ({ mode, meta }) => {
  const { puzzle, loading, error } = useDailyPuzzle('crossclimb', mode);
  return (
    <PuzzleGate loading={loading} error={error}>
      {puzzle && (
        <CrossclimbBoard
          puzzle={puzzle.payload}
          puzzleId={puzzle.id}
          mode={mode}
          meta={meta}
        />
      )}
    </PuzzleGate>
  );
};

export default CrossclimbGame;
