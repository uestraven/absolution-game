import type {
  ExitDef,
  GameState,
  ItemId,
  LocationDef,
  PersonDef,
  TopicDef,
  WorldObjectDef,
} from './types';
import { LOCATIONS } from '../content/locations';
import { OBJECTS, OBJECTS_BY_LOCATION, objectListLine } from '../content/objects';
import { PEOPLE, PEOPLE_BY_LOCATION, availableTopics } from '../content/dialogue';
import { ALL_ITEM_IDS, ITEMS } from '../content/items';

/* ------------------------------------------------------------------ *
 * World reads
 * ------------------------------------------------------------------ */

export function currentLocation(state: GameState): LocationDef {
  const def = LOCATIONS[state.locationId];
  if (!def) throw new Error(`Unknown location: ${state.locationId}`);
  return def;
}

/** Objects at the current location the player has noticed and that are not hidden. */
export function visibleObjects(state: GameState): WorldObjectDef[] {
  const here = OBJECTS_BY_LOCATION[state.locationId] ?? [];
  return here.filter(
    (def) => state.discovered.includes(def.id) && !(def.hiddenWhen?.(state) ?? false)
  );
}

/** Objects at the current location the player has NOT yet noticed. */
export function undiscoveredObjects(state: GameState): WorldObjectDef[] {
  const here = OBJECTS_BY_LOCATION[state.locationId] ?? [];
  return here.filter((def) => !state.discovered.includes(def.id));
}

/**
 * People at the current location the player has noticed and who are here now.
 *
 * `available` matters because a room can be revisited in a different chapter
 * with different people in it, and `discovered` latches: once the hero has met
 * somebody they stay met, so presence has to be a separate question from
 * acquaintance.
 */
export function peopleHere(state: GameState): PersonDef[] {
  return (PEOPLE_BY_LOCATION[state.locationId] ?? []).filter(
    (p) => state.discovered.includes(p.id) && (p.available?.(state) ?? true)
  );
}

/** Exits that can actually be taken right now. */
export function visibleExits(state: GameState): ExitDef[] {
  const loc = currentLocation(state);
  return loc.exits.filter((exit) => !exit.requires || exit.requires(state));
}

/** Every exit authored for the room, taken or not — used for blocked feedback. */
export function allExits(state: GameState): ExitDef[] {
  return currentLocation(state).exits;
}

export function carriedItems(state: GameState): ItemId[] {
  return state.inventory.slice();
}

/** Items the player has put down in this room. */
export function roomItems(state: GameState): ItemId[] {
  return ALL_ITEM_IDS.filter((id) => {
    const placement = state.placements[id];
    return placement?.kind === 'room' && placement.locationId === state.locationId;
  });
}

/** Items resting in a fixture that is part of this room. */
export function fixtureItems(state: GameState): Array<{ item: ItemId; fixtureId: string }> {
  const out: Array<{ item: ItemId; fixtureId: string }> = [];
  for (const id of ALL_ITEM_IDS) {
    const placement = state.placements[id];
    if (placement?.kind !== 'fixture') continue;
    if (OBJECTS[placement.fixtureId]?.locationId !== state.locationId) continue;
    out.push({ item: id, fixtureId: placement.fixtureId });
  }
  return out;
}

/** Everything the player can name as an item from where they are standing. */
export function reachableItems(state: GameState): ItemId[] {
  return [
    ...state.inventory,
    ...roomItems(state),
    ...fixtureItems(state).map((f) => f.item),
  ];
}

/** Human-readable "you can make out" lines for the current room. */
export function roomContentLines(state: GameState): string[] {
  const lines: string[] = [];
  for (const def of visibleObjects(state)) {
    const line = objectListLine(def, state);
    if (line) lines.push(line);
  }
  for (const id of roomItems(state)) {
    lines.push(`${ITEMS[id].name}, where you put it down`);
  }
  return lines;
}

/* ------------------------------------------------------------------ *
 * Conversation reads
 * ------------------------------------------------------------------ */

export function activePerson(state: GameState): PersonDef | null {
  if (state.pending?.kind !== 'conversation') return null;
  return PEOPLE[state.pending.personId] ?? null;
}

export function activeTopics(state: GameState): TopicDef[] {
  if (state.pending?.kind !== 'conversation') return [];
  const person = PEOPLE[state.pending.personId];
  if (!person) return [];
  return availableTopics(person, state, state.pending.heard);
}

/* ------------------------------------------------------------------ *
 * Noun resolution
 *
 * Only ever returns things the player has discovered. An undiscovered
 * object's nouns resolve to nothing, so a guessed id behaves exactly like a
 * nonsense word in both input modes.
 * ------------------------------------------------------------------ */

export type RefKind = 'object' | 'person' | 'item' | 'exit';

export interface Ref {
  kind: RefKind;
  id: string;
  /** Player-facing name, usable verbatim in a disambiguation prompt. */
  label: string;
}

/**
 * The one spelling the matcher works in.
 *
 * Hyphens become spaces on both sides of the comparison, so `plumb bob` finds
 * `plumb-bob` and `well cap` finds `well-cap` without either having to be
 * written out twice. Hyphens only: no stemming, which would cheerfully
 * conflate nouns that have nothing to do with each other, and no stripping of
 * full stops, which are part of every object id the selectable UI sends.
 */
function norm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-\u2010-\u2015]/g, ' ')
    .replace(/\s+/g, ' ');
}

interface Candidate extends Ref {
  nouns: string[];
}

function candidates(state: GameState): Candidate[] {
  const out: Candidate[] = [];

  for (const itemId of new Set(reachableItems(state))) {
    const def = ITEMS[itemId];
    out.push({ kind: 'item', id: itemId, label: def.name, nouns: def.nouns.map(norm) });
  }
  for (const def of visibleObjects(state)) {
    out.push({ kind: 'object', id: def.id, label: def.name, nouns: def.nouns.map(norm) });
  }
  for (const person of peopleHere(state)) {
    out.push({ kind: 'person', id: person.id, label: person.name, nouns: person.nouns.map(norm) });
  }
  for (const exit of visibleExits(state)) {
    const nouns = [exit.id, exit.label, ...(exit.aliases ?? [])];
    if (exit.direction) nouns.push(exit.direction);
    out.push({ kind: 'exit', id: exit.id, label: exit.label, nouns: nouns.map(norm) });
  }

  return out;
}

/**
 * Resolves a typed or selected noun to zero, one, or several references.
 *
 * Match order: id, exact noun, then whole-word containment. Several matches at
 * the same strength mean genuine ambiguity, which the reducer turns into a
 * clarification prompt.
 *
 * ## There is deliberately no substring fallback
 *
 * There used to be one, and it was worse than failing. `examine oil` in the
 * worksite returned the description of *the gap back to the basin chamber*,
 * because `oil` is a substring of that exit's alias `spoil`. A player gets a
 * confident answer about the wrong thing, which is harder to recover from than
 * being told the noun is not here.
 *
 * The right fix for a noun that should work is an alias on the thing it names
 * — including benign plurals and hyphenations — not a matcher that will accept
 * any fragment. Missing nouns are a content bug and should look like one.
 */
export function resolve(state: GameState, rawNoun: string, kinds?: RefKind[]): Ref[] {
  const noun = norm(rawNoun);
  if (noun.length === 0) return [];
  const pool = candidates(state).filter((c) => !kinds || kinds.includes(c.kind));

  // Direct id match wins outright — this is how the selectable UI addresses things.
  const byId = pool.filter((c) => c.id.toLowerCase() === noun);
  if (byId.length > 0) return dedupe(byId);

  const exact = pool.filter((c) => c.nouns.includes(noun));
  if (exact.length > 0) return dedupe(exact);

  /*
   * Whole words only. `(^| )noun( |$)` also matches across a hyphen once
   * `norm` has turned it into a space, so `plumb bob` finds `plumb-bob`.
   */
  const wordBoundary = new RegExp(`(^| )${escapeRegExp(noun)}( |$)`);
  return dedupe(pool.filter((c) => c.nouns.some((n) => wordBoundary.test(n))));
}

function dedupe(list: Candidate[]): Ref[] {
  const seen = new Set<string>();
  const out: Ref[] = [];
  for (const c of list) {
    const key = `${c.kind}:${c.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: c.kind, id: c.id, label: c.label });
  }
  return out;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
