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

/* ------------------------------------------------------------------ *
 * Chapter 3: the ruined century, and the way back
 * ------------------------------------------------------------------ */

/** Out of the hill and down to the settlement, noticing the sky on the way. */
export const FUTURE_TO_SQUARE = ['up', 'examine bird', 'east'];

/** The four sources the inference needs. */
export const GATHER_EVIDENCE = [
  'talk to rue',
  'what she is sitting against',
  'the oldest thing she knows',
  'leave',
  'examine account',
  'examine memorial',
  'journal',
];

/** The shell where the workshop was, and what is still lying in it. */
export const FIND_THE_TOOLS = ['examine shell'];

/** The synthesis. A deliberate action, after the four sources are in. */
export const ADD_IT_UP = ['reflect'];

/** Up to the mouth, learn the course, brace it, and open it. */
export const OPEN_THE_SEAL = [
  'west',
  'west',
  'talk to sorrel',
  'why the hill is walled up',
  'whether the wall is as good as it looks',
  'leave',
  'use wedge on seal',
  'break seal',
  'break seal',
];

/** In, clear the fill, stand the lamp, and go. */
export const GO_BACK = [
  'west',
  'examine fill',
  'clear fill',
  'place lantern in middle dish',
  'enter aperture',
];

/**
 * The rest of Chapter 3, played adaptively.
 *
 * A route list cannot be a constant here: whether the hero needs the maul and
 * the oak block out of the goat shed depends on whether they still have the
 * mallet and the wedge they could have picked up two centuries earlier, and
 * naming a tool they are already holding is a refusal. So this takes what is
 * missing and nothing else, which is what a player would do.
 *
 * Returns every line it issued, so a caller can assert that none of them was
 * refused.
 */
export function finishChapterThree(state: GameState): { state: GameState; lines: string[] } {
  const lines: string[] = [...FUTURE_TO_SQUARE, ...GATHER_EVIDENCE, ...FIND_THE_TOOLS];
  let current = typeAll(state, lines);

  if (!current.inventory.includes('mallet')) {
    lines.push('take maul');
    current = type(current, 'take maul').state;
  }
  if (!current.inventory.includes('wedge')) {
    lines.push('take blocks');
    current = type(current, 'take blocks').state;
  }

  const tail = [...ADD_IT_UP, ...OPEN_THE_SEAL, ...GO_BACK];
  lines.push(...tail);
  return { state: typeAll(current, tail), lines };
}

/** True when the hero is standing in the sealed chamber, on the way back. */
export function hasReturned(state: GameState): boolean {
  return (
    state.locationId === 'present.sealed_chamber' &&
    state.chapter === 'return' &&
    state.era === 'present'
  );
}

/** True when the story is over: both of them dead and the hill on top of it. */
export function hasFinished(state: GameState): boolean {
  return (
    state.chapter === 'ending' &&
    state.ended &&
    state.flags['earlier_self_dead'] === true &&
    state.flags['cave_destroyed'] === true &&
    state.flags['hero_dead'] === true &&
    state.flags['story_complete'] === true
  );
}

/* ------------------------------------------------------------------ *
 * Chapter 4: the confrontation and the end
 * ------------------------------------------------------------------ */

/** Everything the hero can say, in the order that makes them decide last. */
export const THE_ARGUMENT = [
  'talk to them',
  'say nothing',
  'show self',
  'show lantern',
  'show journal',
  'tell them about the future',
  'tell them about the prophecy',
];

/** Every nonlethal thing the hands can try, once they are moving. */
export const THE_HANDS = ['block wall', 'hold them', 'take their lantern', 'west', 'wait'];

/** The killing, and then the pillar, and then the end. */
export const THE_END = [
  'kill them',
  'examine pillar',
  'break pillar',
  'break pillar',
  'break pillar',
  'swing',
];

/** The finale, played out in full. */
export function finishTheStory(state: GameState): GameState {
  return typeAll(state, [...THE_ARGUMENT, ...THE_HANDS, ...THE_END]);
}
