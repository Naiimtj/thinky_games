/**
 * A single grid cell. Purely presentational: it renders its state and forwards
 * pointer intent upward. Exposing `data-*` attributes lets the board resolve
 * which cell a touch is currently over via `document.elementFromPoint`.
 */

const cellClasses = (isActive) => {
  const base = 'h-full w-full border border-slate-200 transition-colors';
  return isActive
    ? `${base} bg-indigo-100`
    : `${base} bg-white hover:bg-slate-50`;
};

const ZipCell = ({ cell, isActive, onPointerDown, onPointerEnter }) => {
  const handleMouseDown = (event) => {
    event.preventDefault();
    onPointerDown();
  };

  const handleTouchStart = (event) => {
    event.preventDefault();
    onPointerDown();
  };

  return (
    <div
      data-cell
      data-row={cell.row}
      data-col={cell.col}
      role="gridcell"
      aria-label={`Fila ${cell.row + 1}, columna ${cell.col + 1}`}
      className={cellClasses(isActive)}
      onMouseDown={handleMouseDown}
      onMouseEnter={onPointerEnter}
      onTouchStart={handleTouchStart}
    />
  );
};

export default ZipCell;
