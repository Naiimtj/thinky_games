import CrosswordGame from './crossword/CrosswordGame';
import PatchesGame from './patches/PatchesGame';
import PinpointGame from './pinpoint/PinpointGame';
import QueensGame from './queens/QueensGame';
import SudokuGame from './sudoku/SudokuGame';
import TangoGame from './tango/TangoGame';
import WendGame from './wend/WendGame';
import ZipGame from './zip/ZipGame';

/**
 * Single source of truth for the games shown on the homepage and routed to.
 * Games marked `playable: false` appear as "coming soon".
 */
export const GAMES = [
  {
    id: 'zip',
    name: 'Zip',
    tagline: 'Une los números en un solo trazo',
    icon: '/images/Zip_icon.png',
    Component: ZipGame,
    playable: true,
  },
  {
    id: 'queens',
    name: 'Queens',
    tagline: 'Corona cada región',
    icon: '/images/Queens_icon.png',
    Component: QueensGame,
    playable: true,
  },
  {
    id: 'tango',
    name: 'Tango',
    tagline: 'Armoniza la rejilla',
    icon: '/images/Tango_icon.svg',
    Component: TangoGame,
    playable: true,
  },
  {
    id: 'sudoku',
    name: 'Mini Sudoku',
    tagline: 'Rellena del 1 al 6',
    icon: '/images/Sudoku_icon.svg',
    Component: SudokuGame,
    playable: true,
  },
  {
    id: 'pinpoint',
    name: 'Pinpoint',
    tagline: 'Adivina la categoría',
    icon: '/images/Pinpoint_icon.png',
    Component: PinpointGame,
    playable: true,
  },
  {
    id: 'crossword',
    name: 'Crucigrama',
    tagline: 'Completa la rejilla',
    icon: '/images/Crossword_icon.svg',
    Component: CrosswordGame,
    playable: true,
  },
  {
    id: 'wend',
    name: 'Wend',
    tagline: 'Ábrete paso entre palabras',
    icon: '/images/Wend_icon.svg',
    Component: WendGame,
    playable: true,
  },
  {
    id: 'patches',
    name: 'Patches',
    tagline: '¡A darle forma!',
    icon: '/images/Parches_icon.svg',
    Component: PatchesGame,
    playable: true,
  },
];

export const getGame = (id) => GAMES.find((game) => game.id === id);

export const PLAYABLE_GAMES = GAMES.filter((game) => game.playable);

/** Icon path for a game id (from static/images), or undefined if unmapped. */
export const getGameIcon = (id) => getGame(id)?.icon;
