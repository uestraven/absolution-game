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

export const ALL_ITEM_IDS: ItemId[] = ['lantern', 'wedge'];

export function isItemId(value: unknown): value is ItemId {
  return value === 'lantern' || value === 'wedge';
}
