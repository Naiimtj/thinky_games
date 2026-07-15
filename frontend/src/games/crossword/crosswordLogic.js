const cellKey = (row, col) => `${row},${col}`;

export const entryCells = ({ row, col, answer, direction }) =>
  [...answer].map((_, offset) =>
    direction === 'across'
      ? { row, col: col + offset }
      : { row: row + offset, col },
  );

export const buildGrid = (entries, size) => {
  const cells = new Map();

  entries.forEach((entry) => {
    entryCells(entry).forEach((cell, index) => {
      const key = cellKey(cell.row, cell.col);
      const existing = cells.get(key) ?? { ...cell, entryIds: [] };
      cells.set(key, {
        ...existing,
        entryIds: [...existing.entryIds, entry.id],
        number: index === 0 ? entry.number : existing.number,
      });
    });
  });

  return Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const col = index % size;
    return cells.get(cellKey(row, col)) ?? { row, col, entryIds: [] };
  });
};

export const normalizeLetter = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-zÑñ]/g, '')
    .slice(-1)
    .toUpperCase();

export const answersFromCells = (entries, cells) =>
  Object.fromEntries(
    entries.map((entry) => [
      entry.id,
      entryCells(entry)
        .map((cell) => cells[cellKey(cell.row, cell.col)] ?? '')
        .join(''),
    ]),
  );

export const isCrosswordSolved = (entries, cells) =>
  entries.every(
    (entry) => answersFromCells(entries, cells)[entry.id] === entry.answer,
  );

export const firstEmptyLetter = (entries, cells) => {
  for (const entry of entries) {
    for (const [index, cell] of entryCells(entry).entries()) {
      const key = cellKey(cell.row, cell.col);
      if (!cells[key]) return { key, letter: entry.answer[index] };
    }
  }
  return null;
};
