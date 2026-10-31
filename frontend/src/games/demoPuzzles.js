/**
 * Hardcoded demo puzzles with locale variants.
 *
 * Guest demo mode reads from this file only (offline): no backend call is
 * required before login. Shape mirrors `/games/:game_type/daily?mode=demo`.
 */

const SUPPORTED_LOCALES = ['es', 'en', 'de'];

const createDemoPuzzle = (gameType, locale, payload) => ({
  id: `${gameType}-demo-${locale}`,
  game_type: gameType,
  mode: 'demo',
  date: null,
  seed: 1,
  locale,
  fallback: false,
  payload,
});

const localizeSharedPayload = (gameType, payload) =>
  Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      locale,
      createDemoPuzzle(gameType, locale, payload),
    ]),
  );

const localizePayloads = (gameType, payloadByLocale) =>
  Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      locale,
      createDemoPuzzle(
        gameType,
        locale,
        payloadByLocale[locale] ?? payloadByLocale.es,
      ),
    ]),
  );

const clonePuzzle = (puzzle) => {
  if (!puzzle) return null;
  return structuredClone(puzzle);
};

const queensPayload = {
  size: 8,
  regions: [
    [0, 0, 0, 0, 0, 1, 1, 4],
    [2, 0, 0, 0, 0, 1, 4, 4],
    [2, 2, 0, 3, 3, 3, 4, 4],
    [2, 0, 0, 0, 3, 4, 4, 4],
    [2, 3, 3, 3, 3, 3, 4, 4],
    [2, 3, 3, 5, 7, 4, 4, 4],
    [6, 3, 3, 5, 7, 7, 7, 4],
    [5, 5, 5, 5, 5, 7, 7, 4],
  ],
};

const zipPayload = {
  size: 6,
  checkpoints: [
    { row: 2, col: 4, order: 1 },
    { row: 1, col: 4, order: 2 },
    { row: 0, col: 5, order: 3 },
    { row: 0, col: 1, order: 4 },
    { row: 5, col: 4, order: 5 },
    { row: 5, col: 5, order: 6 },
    { row: 4, col: 3, order: 7 },
    { row: 1, col: 2, order: 8 },
  ],
  walls: [
    { from: { row: 1, col: 1 }, to: { row: 1, col: 2 } },
    { from: { row: 1, col: 5 }, to: { row: 2, col: 5 } },
    { from: { row: 3, col: 2 }, to: { row: 4, col: 2 } },
    { from: { row: 1, col: 2 }, to: { row: 1, col: 3 } },
  ],
};

const tangoPayload = {
  size: 6,
  given: [
    { row: 0, col: 4, value: 1 },
    { row: 1, col: 5, value: 1 },
    { row: 3, col: 1, value: 0 },
    { row: 3, col: 4, value: 0 },
    { row: 3, col: 5, value: 0 },
    { row: 5, col: 0, value: 1 },
  ],
  constraints: [
    { a: { row: 1, col: 1 }, b: { row: 2, col: 1 }, type: '×' },
    { a: { row: 1, col: 2 }, b: { row: 1, col: 3 }, type: '×' },
    { a: { row: 1, col: 5 }, b: { row: 2, col: 5 }, type: '×' },
    { a: { row: 2, col: 3 }, b: { row: 2, col: 4 }, type: '×' },
    { a: { row: 4, col: 0 }, b: { row: 4, col: 1 }, type: '=' },
  ],
};

const sudokuPayload = {
  size: 6,
  boxHeight: 2,
  boxWidth: 3,
  given: [
    [0, 1, 4, 2, 3, 6],
    [0, 0, 0, 4, 0, 0],
    [3, 0, 0, 0, 2, 4],
    [0, 0, 0, 6, 0, 0],
    [2, 0, 0, 5, 0, 0],
    [0, 0, 6, 3, 0, 0],
  ],
};

const pinpointPayloads = {
  es: {
    clues: ['Zumo', 'Te', 'Vino', 'Cerveza', 'Refresco'],
    answer: 'Bebidas',
    options: [
      'Dias de la semana',
      'Flores',
      'Bebidas',
      'Instrumentos musicales',
      'Meses',
    ],
  },
  en: {
    clues: ['Juice', 'Tea', 'Wine', 'Beer', 'Soda'],
    answer: 'Drinks',
    options: ['Weekdays', 'Flowers', 'Drinks', 'Musical instruments', 'Months'],
  },
  de: {
    clues: ['Saft', 'Tee', 'Wein', 'Bier', 'Limo'],
    answer: 'Getranke',
    options: ['Wochentage', 'Blumen', 'Getranke', 'Musikinstrumente', 'Monate'],
  },
};

const wendPayloads = {
  es: {
    size: 8,
    grid: [
      ['A', 'P', 'A', 'D', 'R', 'A', 'A', 'O'],
      ['N', 'D', 'P', 'A', 'Q', 'R', 'E', 'I'],
      ['O', 'R', 'E', 'E', 'C', 'J', 'J', 'O'],
      ['P', 'D', 'R', 'O', 'F', 'E', 'E', 'E'],
      ['N', 'B', 'R', 'A', 'T', 'L', 'A', 'S'],
      ['C', 'S', 'O', 'U', 'H', 'O', 'J', 'A'],
      ['R', 'I', 'V', 'N', 'T', 'I', 'M', 'U'],
      ['M', 'A', 'B', 'O', 'S', 'Q', 'U', 'E'],
    ],
    words: ['UVA', 'HOJA', 'SALTAR', 'BOSQUE', 'PERRO'],
    definitions: {
      UVA: 'Baya o grano mas o menos redondo y jugoso, fruto de la vid, que forma racimos',
      HOJA: 'Cada una de las laminas, generalmente verdes, planas y delgadas, de que se visten los vegetales, unidas al tallo o a las ramas por el peciolo',
      SALTAR: 'Salvar de un salto un espacio o distancia',
      BOSQUE: 'Sitio poblado de arboles y matas',
      PERRO:
        'Mamifero domestico de la familia de los canidos, de tamano, forma y pelaje muy diversos, que tiene olfato fino y suele ser leal a su dueno',
    },
  },
  en: {
    size: 8,
    grid: [
      ['A', 'P', 'P', 'L', 'E', 'Q', 'M', 'N'],
      ['R', 'T', 'V', 'L', 'S', 'K', 'G', 'H'],
      ['L', 'E', 'A', 'F', 'W', 'Y', 'C', 'D'],
      ['P', 'Q', 'R', 'U', 'I', 'O', 'P', 'A'],
      ['J', 'U', 'M', 'P', 'B', 'C', 'D', 'E'],
      ['N', 'M', 'L', 'K', 'J', 'I', 'H', 'G'],
      ['F', 'O', 'R', 'E', 'S', 'T', 'L', 'X'],
      ['D', 'O', 'G', 'R', 'A', 'I', 'N', 'S'],
    ],
    words: ['APPLE', 'LEAF', 'JUMP', 'FOREST', 'DOG'],
    definitions: {
      APPLE: 'Common round fruit that grows on an apple tree',
      LEAF: 'Flat green part of a plant attached to a stem',
      JUMP: 'To push off the ground and move into the air',
      FOREST: 'Large area covered mainly with trees',
      DOG: 'Domesticated animal known for loyalty and companionship',
    },
  },
  de: {
    size: 8,
    grid: [
      ['A', 'P', 'F', 'E', 'L', 'Q', 'M', 'N'],
      ['B', 'L', 'A', 'T', 'T', 'K', 'G', 'H'],
      ['S', 'P', 'R', 'U', 'N', 'G', 'C', 'D'],
      ['W', 'A', 'L', 'D', 'I', 'O', 'P', 'A'],
      ['H', 'U', 'N', 'D', 'B', 'C', 'D', 'E'],
      ['N', 'M', 'L', 'K', 'J', 'I', 'H', 'G'],
      ['R', 'E', 'G', 'E', 'N', 'X', 'L', 'X'],
      ['S', 'O', 'N', 'N', 'E', 'R', 'N', 'S'],
    ],
    words: ['APFEL', 'BLATT', 'SPRUNG', 'WALD', 'HUND'],
    definitions: {
      APFEL: 'Rundes Obst, das auf Apfelbaumen wachst',
      BLATT: 'Dunner gruner Pflanzenteil am Stiel',
      SPRUNG: 'Schnelle Bewegung vom Boden in die Luft',
      WALD: 'Grosses Gebiet mit vielen Baumen',
      HUND: 'Haustier, bekannt fur Treue und Begleitung',
    },
  },
};

const patchesPayload = {
  rows: 7,
  cols: 7,
  seeds: [
    { row: 0, col: 0, color: '#C49000', shape: 'VRECT', size: 6 },
    { row: 3, col: 0, color: '#EF6C00', shape: 'VRECT', size: 6 },
    { row: 6, col: 0, color: '#0097A7', shape: 'HRECT', size: 2 },
    { row: 0, col: 2, color: '#00A651', shape: 'VRECT', size: 8 },
    { row: 4, col: 2, color: '#7C4DFF', shape: 'VRECT', size: 6 },
    { row: 0, col: 4, color: '#E40101', shape: 'SQUARE', size: 4 },
    { row: 2, col: 4, color: '#00AFFF', shape: 'VRECT', size: 8 },
    { row: 6, col: 4, color: '#546E7A', shape: 'ANY', size: 3 },
    { row: 0, col: 6, color: '#D81B60', shape: 'VRECT', size: 6 },
  ],
  solution: [
    [0, 0, 3, 3, 5, 5, 8],
    [0, 0, 3, 3, 5, 5, 8],
    [0, 0, 3, 3, 6, 6, 8],
    [1, 1, 3, 3, 6, 6, 8],
    [1, 1, 4, 4, 6, 6, 8],
    [1, 1, 4, 4, 6, 6, 8],
    [2, 2, 4, 4, 7, 7, 7],
  ],
};

export const DEMO_PUZZLES = {
  queens: localizeSharedPayload('queens', queensPayload),
  zip: localizeSharedPayload('zip', zipPayload),
  tango: localizeSharedPayload('tango', tangoPayload),
  sudoku: localizeSharedPayload('sudoku', sudokuPayload),
  pinpoint: localizePayloads('pinpoint', pinpointPayloads),
  wend: localizePayloads('wend', wendPayloads),
  patches: localizeSharedPayload('patches', patchesPayload),
};

export const getDemoPuzzle = (gameType, locale = 'es') =>
  clonePuzzle(DEMO_PUZZLES[gameType]?.[locale] ?? DEMO_PUZZLES[gameType]?.es);
