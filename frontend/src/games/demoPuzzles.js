/**
 * Hardcoded demo puzzles, one per game.
 *
 * Demo mode never calls the backend: these boards are fixed and ship with the
 * frontend so unauthenticated players always get the same, reliable puzzle.
 * Values mirror the backend's stable demo generation (fixed seed) at the time
 * they were captured; update them here if a game's generator changes.
 */

export const DEMO_PUZZLES = {
  queens: {
    id: 'queens-demo',
    game_type: 'queens',
    mode: 'demo',
    date: null,
    seed: 1,
    fallback: false,
    payload: {
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
    },
  },
  zip: {
    id: 'zip-demo',
    game_type: 'zip',
    mode: 'demo',
    date: null,
    seed: 1,
    fallback: false,
    payload: {
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
    },
  },
  tango: {
    id: 'tango-demo',
    game_type: 'tango',
    mode: 'demo',
    date: null,
    seed: 1,
    fallback: false,
    payload: {
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
    },
  },
  sudoku: {
    id: 'sudoku-demo',
    game_type: 'sudoku',
    mode: 'demo',
    date: null,
    seed: 1,
    fallback: false,
    payload: {
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
    },
  },
  pinpoint: {
    id: 'pinpoint-demo',
    game_type: 'pinpoint',
    mode: 'demo',
    date: null,
    seed: 1,
    fallback: false,
    payload: {
      clues: ['Zumo', 'Té', 'Vino', 'Cerveza', 'Refresco'],
      answer: 'Bebidas',
      options: [
        'Días de la semana',
        'Flores',
        'Bebidas',
        'Instrumentos musicales',
        'Meses',
      ],
    },
  },
  crossclimb: {
    id: 'crossclimb-demo',
    game_type: 'crossclimb',
    mode: 'demo',
    date: null,
    seed: 1,
    fallback: false,
    payload: {
      length: 4,
      top: { word: 'CASA', clue: 'Vivienda donde se vive' },
      rungs: [
        { word: 'CASO', clue: 'Suceso o asunto que se examina' },
        { word: 'PASO', clue: 'Movimiento que se hace al andar' },
        { word: 'PASE', clue: 'Autorización para entrar o usar algo' },
        { word: 'PESE', clue: 'Aunque (pese a que)' },
        { word: 'PESO', clue: 'Cuánto pesa algo' },
      ],
      bottom: { word: 'BESO', clue: 'Muestra de cariño con los labios' },
    },
  },
  wend: {
    id: 'wend-demo',
    game_type: 'wend',
    mode: 'demo',
    date: null,
    seed: 1,
    fallback: false,
    payload: {
      size: 8,
      // Every word here runs along a straight line (horizontal, vertical or
      // diagonal, never bent) so it matches the real word-search rules —
      // generated with the same backend algorithm as the live daily puzzle.
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
        UVA: 'Baya o grano más o menos redondo y jugoso, fruto de la vid, que forma racimos',
        HOJA: 'Cada una de las láminas, generalmente verdes, planas y delgadas, de que se visten los vegetales, unidas al tallo o a las ramas por el pecíolo',
        SALTAR: 'Salvar de un salto un espacio o distancia',
        BOSQUE: 'Sitio poblado de árboles y matas',
        PERRO:
          'Mamífero doméstico de la familia de los cánidos, de tamaño, forma y pelaje muy diversos, según las razas, que tiene olfato muy fino y es inteligente y muy leal a su dueño',
      },
    },
  },
  patches: {
    id: 'patches-demo',
    game_type: 'patches',
    mode: 'demo',
    date: null,
    seed: 1,
    fallback: false,
    payload: {
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
    },
  },
};
