/**
 * ZipGameBoard renders the interactive puzzle grid. State lives in the
 * Zustand store; this component only wires user gestures to store actions.
 */

import { cellKey, getWallSegments } from '../logic/zipLogic';
import { useTranslation } from 'react-i18next';
import { useZipStore } from '../store/useZipStore';
import ZipCell from './ZipCell';

/** Resolve the grid cell under a DOM element via its data attributes. */
const readCellFromElement = (element) => {
  const target = element?.closest?.('[data-cell]');
  if (!target) return null;
  return { row: Number(target.dataset.row), col: Number(target.dataset.col) };
};

const PATH_COLOR = '#6366f1'; // indigo-500
const WALL_COLOR = '#0f172a'; // slate-900
const CHECKPOINT_FILL = '#1e293b'; // slate-800

/** The continuous snake line drawn through the centre of every visited cell. */
const ZipPathLine = ({ path }) => {
  if (path.length === 0) return null;
  const points = path
    .map((step) => `${step.col + 0.5},${step.row + 0.5}`)
    .join(' ');
  return (
    <polyline
      points={points}
      fill="none"
      stroke={PATH_COLOR}
      strokeWidth={0.58}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.9}
    />
  );
};

/** Thick barriers the path is not allowed to cross. */
const ZipWalls = ({ segments }) =>
  segments.map((segment, index) => (
    <line
      key={index}
      x1={segment.x1}
      y1={segment.y1}
      x2={segment.x2}
      y2={segment.y2}
      stroke={WALL_COLOR}
      strokeWidth={0.16}
      strokeLinecap="round"
    />
  ));

/** Numbered bubbles that must be visited in ascending order. */
const ZipCheckpoints = ({ checkpoints }) =>
  checkpoints.map((checkpoint) => (
    <g key={`${checkpoint.row},${checkpoint.col}`}>
      <circle
        cx={checkpoint.col + 0.5}
        cy={checkpoint.row + 0.5}
        r={0.32}
        fill={CHECKPOINT_FILL}
      />
      <text
        x={checkpoint.col + 0.5}
        y={checkpoint.row + 0.5}
        dy="0.4em"
        fill="#ffffff"
        fontSize={0.42}
        fontWeight="700"
        textAnchor="middle"
      >
        {checkpoint.order}
      </text>
    </g>
  ));

const ZipGameBoard = () => {
  const { t } = useTranslation();
  const grid = useZipStore((state) => state.grid);
  const puzzle = useZipStore((state) => state.puzzle);
  const currentPath = useZipStore((state) => state.currentPath);
  const beginPath = useZipStore((state) => state.beginPath);
  const extendPath = useZipStore((state) => state.extendPath);
  const endPath = useZipStore((state) => state.endPath);

  const size = grid.length;
  const activeKeys = new Set(
    currentPath.map((step) => cellKey(step.row, step.col)),
  );
  const wallSegments = getWallSegments(puzzle.walls);
  const gridTemplate = `repeat(${size}, minmax(0, 1fr))`;

  const handleTouchMove = (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = readCellFromElement(element);
    if (cell) extendPath(cell);
  };

  return (
    <div
      className="relative aspect-square w-full touch-none select-none overflow-hidden rounded-xl border border-slate-300 bg-white"
      onMouseUp={endPath}
      onMouseLeave={endPath}
      onTouchEnd={endPath}
      onTouchCancel={endPath}
      onTouchMove={handleTouchMove}
    >
      <div
        role="grid"
        aria-label={t('zipGame.gridLabel')}
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: gridTemplate,
          gridTemplateRows: gridTemplate,
        }}
      >
        {grid.flat().map((cell) => {
          const key = cellKey(cell.row, cell.col);
          return (
            <ZipCell
              key={key}
              cell={cell}
              isActive={activeKeys.has(key)}
              onPointerDown={() => beginPath(cell)}
              onPointerEnter={() => extendPath(cell)}
            />
          );
        })}
      </div>

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${size} ${size}`}
        preserveAspectRatio="none"
      >
        <ZipPathLine path={currentPath} />
        <ZipWalls segments={wallSegments} />
        <ZipCheckpoints checkpoints={puzzle.checkpoints} />
      </svg>
    </div>
  );
};

export default ZipGameBoard;
