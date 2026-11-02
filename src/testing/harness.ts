import type { GameAction, GameState, ResolveResult } from '../engine/types';
import { resolve, startGame } from '../engine/reducer';
import { parse } from '../engine/parser';
import { activeTopics } from '../engine/selectors';
import type { CharacterId } from '../engine/types';

/** Starts a game and returns the state after the opening. */
export function begin(character: CharacterId = 'basil'): GameState {
  return startGame(character).state;
}

/** Dispatches one typed line, exactly as the type-only UI does. */
export function type(state: GameState, raw: string): ResolveResult {
  const action = parse(raw, {
    topics: state.pending?.kind === 'conversation' ? activeTopics(state) : undefined,
    clarificationLabels:
      state.pending?.kind === 'clarification'
        ? state.pending.options.map((o) => o.label)
        : undefined,
  });
  return resolve(state, action);
}

/** Dispatches a run of typed lines, returning the final state. */
export function typeAll(state: GameState, lines: string[]): GameState {
  return lines.reduce((acc, line) => type(acc, line).state, state);
}

/** Last narrative text produced, joined. */
export function lastText(result: ResolveResult): string {
  return result.events.map((e) => e.text).join('\n');
}

export function act(state: GameState, action: GameAction): ResolveResult {
  return resolve(state, action);
}

/** Everything that is progress, with display-only fields dropped. */
export function progressOf(state: GameState) {
  const { transcript: _transcript, seq: _seq, ...rest } = state;
  return rest;
}

/* ------------------------------------------------------------------ *
 * Shared routes
 *
 * The chapter's critical path, in pieces, so that every test drives the
 * same commands a player would type and a change to the map breaks one
 * list rather than nine.
 * ------------------------------------------------------------------ */

/** Home to the sealed chamber, both items in hand. */
export const TO_SEALED = [
  'take lantern',
  'down',
  'east',
  'take wedge',
  'west',
  'west',
  'west',
  'in',
  'east',
];

/** The shuttered relief, from inside the sealed chamber. */
export const SOLVE_RELIEF = [
  'use wedge on shutter',
  'place lantern in alcove',
  'light lantern',
  'open seam',
];

/** Recover both items, then cross. Leaves the hero in past.deep_chamber. */
export const CROSS_FIRST = ['take lantern', 'take wedge', 'down', 'enter threshold'];

/** Up out of the hill and down to the square, a century earlier. */
export const PAST_TO_SQUARE = ['up', 'east', 'east'];

/** The conversation that establishes where the hero is. */
export const SAFFRA_REALISATION = [
  'talk to saffra',
  'the cave on the hill',
  'whether anything is coming',
];

/** Learn what the crew need, then carry it up. Grants worksite access. */
export const WATER_ROUTE = [
  'the foreman up at the cave',
  'leave',
  'take skins',
  'west',
  'north',
  'fill skins',
  'south',
  'west',
  'give skins to lovage',
];

/** The first recovery route: Fenn's gap. Grants worksite access. */
export const FENN_ROUTE = [
  'talk to fenn',
  'how a boy gets past the foreman',
  'leave',
  'west',
  'west',
];

/** The second recovery route: Saffra walks the hero up. */
export const SAFFRA_ROUTE = [
  'talk to saffra',
  'asking her to walk up with you',
  'leave',
  'west',
  'west',
];

/** From the mouth, down and into the workings, and read all three pieces. */
export const READ_PANEL = [
  'down',
  'north',
  'examine drawing',
  'examine slate',
  'examine dishes',
];

/**
 * The recitation, from the square. No "leave" on the end: the scene closes
 * itself, because Saffra walking off to find a board and a stub of char is
 * where the conversation stops.
 */
export const RECITE = ['talk to saffra', 'why you asked', 'recite prophecy'];

/** Square to the workings, once access has been earned. */
export const SQUARE_TO_WORKSITE = ['west', 'west', 'down', 'north'];

/** Workings back to the square. */
export const WORKSITE_TO_SQUARE = ['south', 'up', 'east', 'east'];

/** Stand the lamp and go. From inside the workings. */
export const GO_FORWARD = ['place lantern in high dish', 'light lantern', 'enter aperture'];
