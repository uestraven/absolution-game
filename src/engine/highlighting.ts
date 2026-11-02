import type { GameState } from './types';
import { ITEMS } from '../content/items';
import { MAGENTA_TERMS, NEVER_HIGHLIGHT } from '../content/highlights';
import { peopleHere, reachableItems, visibleExits, visibleObjects } from './selectors';

/**
 * The words the interface is allowed to tint, and in which role.
 *
 * Interactive terms are **derived from `state.discovered`**, which is the whole
 * point: an object the player has not noticed contributes nothing, so the
 * narration can never glow at something hidden. Reveal the alcove and its name
 * starts being tinted; until then it is ordinary text like any other word.
 *
 * Only curated `name` fields are used, never the loose `nouns` arrays a parser
 * accepts, so the tinting stays sparse and meaningful rather than lighting up
 * every third word.
 */
export interface Vocabulary {
  /** Unusual phenomena and significant story terms. */
  mystery: string[];
  /** Exits, interactive objects and carried items the player knows of. */
  interactive: string[];
  /**
   * People present. Held apart because these are proper nouns and are matched
   * case-sensitively: several of this village's names are also ordinary
   * English words, and "the ground rose" must not light up merely because Rose
   * is standing on the path.
   */
  people: string[];
}

function usable(term: string): boolean {
  const trimmed = term.trim();
  if (trimmed.length < 3) return false;
  return !NEVER_HIGHLIGHT.has(trimmed.toLowerCase());
}

/**
 * Adds a name and its head noun.
 *
 * Objects carry descriptive names — "stone shutter", "hooded lantern" — but
 * prose says "the shutter" and "the lantern" once the thing has been
 * introduced. Head nouns that are also ordinary English are listed in
 * `REQUIRES_DETERMINER`, so they only tint behind an article.
 */
function addName(into: Set<string>, name: string): void {
  if (usable(name)) into.add(name);
  const words = name.split(/\s+/);
  if (words.length < 2) return;
  const head = words.at(-1);
  if (head && usable(head)) into.add(head);
}

export function vocabulary(state: GameState): Vocabulary {
  const interactive = new Set<string>();

  for (const def of visibleObjects(state)) {
    addName(interactive, def.name);
  }
  const people = new Set<string>();
  for (const person of peopleHere(state)) {
    if (!usable(person.name)) continue;
    people.add(person.name);
    // "Rose and Mary" is one person entry with two names in it.
    for (const part of person.name.split(/\s+and\s+/)) {
      if (usable(part)) people.add(part);
    }
  }
  for (const itemId of new Set(reachableItems(state))) {
    addName(interactive, ITEMS[itemId].name);
  }
  for (const exit of visibleExits(state)) {
    // Exit labels read as "the lane down to the square". Tint the place it
    // names, not the whole phrase, so the colour stays on short spans.
    const label = exit.label.replace(/^the\s+/i, '');
    if (usable(label)) interactive.add(label);
  }

  const mystery = MAGENTA_TERMS.filter(usable);

  return {
    mystery,
    // Longest first, so "stone shutter" wins over "shutter".
    interactive: [...interactive].sort((a, b) => b.length - a.length),
    people: [...people].sort((a, b) => b.length - a.length),
  };
}
