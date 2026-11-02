import type { GameState, ItemId } from '../engine/types';
import { FLAGS } from './flags';

export interface ItemDef {
  id: ItemId;
  name: string;
  nouns: string[];
  /** Line shown in the inventory list. */
  inventoryLine: (state: GameState) => string;
  description: (state: GameState) => string;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  lantern: {
    id: 'lantern',
    name: 'hooded lantern',
    nouns: ['lantern', 'lamp', 'hooded lantern', 'light'],
    inventoryLine: (state) =>
      state.flags[FLAGS.lanternLit]
        ? 'a hooded lantern, lit'
        : 'a hooded lantern, unlit',
    description: (state) => {
      const flame = state.flags[FLAGS.lanternLit]
        ? 'The wick is burning, and the hood throws the light forward in a narrow wedge.'
        : 'The wick is trimmed and dry. A small striker is fixed to the base on a short chain, so you need nothing else to light it.';
      return (
        'An ordinary hooded lantern, the kind every house keeps by the door. Tin, dented, ' +
        'with a horn pane on one side and a sliding hood on the other. ' +
        flame
      );
    },
  },
  stone: {
    id: 'stone',
    name: 'pebble',
    nouns: ['stone', 'pebble', 'rock', 'cave stone'],
    inventoryLine: () => 'a pebble off the gallery floor',
    description: () =>
      'A water-rounded pebble the size of a thumb joint, dull grey with a pale band through ' +
      'it. There are thousands like it on the gallery floor and nothing whatever remarkable ' +
      'about this one, which is not the point of it.',
  },
  water_skins: {
    id: 'water_skins',
    name: 'water skins',
    nouns: ['skins', 'water skins', 'waterskins', 'skin', 'water', 'yoke'],
    inventoryLine: (state) =>
      state.flags[FLAGS.skinsFilled]
        ? 'a yoke of water skins, full and heavy'
        : 'a yoke of water skins, empty',
    description: (state) =>
      'Four goatskins on a shoulder yoke, stitched and pitched, with wooden bungs on thongs. ' +
      (state.flags[FLAGS.skinsFilled]
        ? 'They are full, and they weigh what four skins of water weigh, which is more than ' +
          'you expected and all of it on your collarbone.'
        : 'They are empty, and they smell faintly of goat and strongly of pitch.'),
  },
  mallet: {
    id: 'mallet',
    name: "mason's mallet",
    nouns: ['mallet', 'hammer', 'mason mallet', "mason's mallet", 'maul'],
    inventoryLine: () => "a mason's mallet, not yours",
    description: () =>
      'A short-hafted mallet with a head of some close-grained wood, bound at both ends. The ' +
      'haft is worn to a shape that is not your hand. Somebody has cut three notches into the ' +
      'end of it, for a reason they never wrote down.\n\n' +
      'It is Lovage\'s, and you are holding it.',
  },
  wedge: {
    id: 'wedge',
    name: 'wooden wedge',
    nouns: ['wedge', 'wooden wedge', 'block', 'chock', 'shim'],
    inventoryLine: () => 'a wooden wedge, oak, the size of your palm',
    description: () =>
      'A tapered block of oak, cut off-square so it bites rather than slides. One face is ' +
      'scored with saw marks. It would hold a door, or a shutter, or anything else that wanted ' +
      'to come down.',
  },
};

export const ALL_ITEM_IDS: ItemId[] = ['lantern', 'wedge', 'stone', 'water_skins', 'mallet'];

const ITEM_ID_SET: ReadonlySet<string> = new Set<ItemId>(ALL_ITEM_IDS);

export function isItemId(value: unknown): value is ItemId {
  return typeof value === 'string' && ITEM_ID_SET.has(value);
}
