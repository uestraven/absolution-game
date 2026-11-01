/**
 * Terms the interface tints magenta: unusual phenomena and significant story
 * terms.
 *
 * Magenta is authored rather than derived, because it carries meaning rather
 * than mechanics. Two rules for this list:
 *
 *  - It must never name something the player has not met. Everything here is
 *    either on the plank in the village square, said aloud by a villager, or
 *    standing in front of the player in the room being described.
 *  - It must stay broad. Magenta marks mysteries of every kind, so that seeing
 *    it does not amount to the interface pointing at the chapter's reveal. The
 *    prophecy, the rite's name and the sounds in the cave all get it.
 *
 * Matching is case-insensitive and on whole words, longest phrase first.
 */
export const MAGENTA_TERMS: string[] = [
  // The prophecy, as the village talks about it.
  'Cave of Absolution',
  'Wanderer-words',
  'Wanderer',
  'prophecy',
  'cataclysm',
  'vigil',

  // Things in the cave that do not behave.
  'threshold',
  'carved eye',
  'stone eye',
  'eye',
  'worn relief',
  'relief',

  // Phenomena, named as the narration names them.
  'weather in it',
  'no direction you can name',
  'returns sound strangely',
  'the wrong direction for it',
];

/**
 * Terms that are also ordinary English and would otherwise light up mid-
 * sentence ("as well", "going back"). These only match when an article or
 * possessive is in front of them, so "the well" is tinted and "well, then" is
 * not.
 */
export const REQUIRES_DETERMINER: ReadonlySet<string> = new Set([
  'well',
  'back',
  'view',
  'light',
  'water',
  'stone',
  'wall',
  'walls',
  'words',
  'eye',
  'marks',
  'seam',
  'steps',
  'depth',
  'surface',
  'floor',
  'frame',
  'opening',
  'name',
  'village',
  'mouth',
  'tree',
  'boot',
  'bread',
  'bench',
  'window',
  'rope',
  'pool',
  'basin',
  'relief',
  'passage',
  'salt',
  'plank',
  'stump',
  'shutter',
  'alcove',
  'building',
  'scratches',
  'pillar',
]);

/** Determiners accepted in front of a `REQUIRES_DETERMINER` term. */
export const DETERMINERS = ['the', 'a', 'an', 'your', 'its', 'his', 'her', 'their', 'this', 'that'];

/**
 * Words too short or too common to tint at all, even as an object's own name.
 * Nothing here is ever a useful highlight.
 */
export const NEVER_HIGHLIGHT: ReadonlySet<string> = new Set([
  'in',
  'out',
  'up',
  'down',
  'north',
  'south',
  'east',
  'west',
  'go',
  'it',
  'one',
  'ash',
  'air',
  'below',
  'work',
  'tag',
]);
