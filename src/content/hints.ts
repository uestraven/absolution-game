import type { GameState } from '../engine/types';
import { FLAGS } from './flags';

const f = (state: GameState, key: string): boolean => Boolean(state.flags[key]);

export type HintContext = 'prep' | 'puzzle' | 'threshold' | 'past' | 'done';

/** Which hint ladder applies right now. */
export function hintContext(state: GameState): HintContext {
  if (state.ended) return 'done';
  if (f(state, FLAGS.crossed)) return 'past';
  if (f(state, FLAGS.passageOpen)) return 'threshold';
  if (state.locationId.startsWith('present.') && isInCave(state)) return 'puzzle';
  return 'prep';
}

function isInCave(state: GameState): boolean {
  return (
    state.locationId === 'present.entrance' ||
    state.locationId === 'present.outer_gallery' ||
    state.locationId === 'present.echo_chamber' ||
    state.locationId === 'present.sealed_chamber' ||
    state.locationId === 'present.deep_chamber'
  );
}

/**
 * The three-step ladder for the shuttered relief: point at the relief, explain
 * its relationship to the alcove, then describe the solution. The same text is
 * produced in both input modes.
 */
const PUZZLE_LADDER: Array<(state: GameState) => string> = [
  (state) =>
    f(state, FLAGS.reliefExamined)
      ? 'Go back to what the relief showed you. Everything about the way on is in that picture ' +
        'and nowhere else. Nothing in the echo chamber is required.'
      : 'The outer gallery has two walls worth looking at, and only one of them is older than ' +
        'the people who wrote on it. EXAMINE the worn relief on the right-hand wall.',
  (state) =>
    (f(state, FLAGS.shutterTried) || f(state, FLAGS.shutterHeld)
      ? 'The relief shows a lamp being set into a squared recess, low down, with a pierced eye ' +
        'in the stone directly above it. You have found that recess: it is the alcove behind ' +
        'the stone shutter in the sealed chamber, and the eye is cut through the wall just ' +
        'above it.'
      : 'The relief shows a lamp being set into a squared recess, low down, with a pierced eye ' +
        'in the stone directly above it. There is a recess that shape in the sealed chamber — ' +
        'an alcove, low on the fourth wall, behind a stone shutter in cut grooves. OPEN the ' +
        'shutter and look at what is behind it.') +
    (f(state, FLAGS.shutterTried) && !f(state, FLAGS.shutterHeld)
      ? ' The shutter will not stay up on its own, so the first problem is holding it.'
      : ''),
  (state) => {
    const steps: string[] = [];
    if (!state.inventory.includes('wedge') && !f(state, FLAGS.shutterHeld)) {
      steps.push('Take a wedge from the basket in the joiner\'s workshop — Tolv gives them away.');
    }
    if (!f(state, FLAGS.shutterHeld)) {
      steps.push('In the sealed chamber: USE WEDGE ON SHUTTER, which lifts it and holds it up.');
    }
    if (!f(state, FLAGS.lanternInAlcove)) {
      steps.push('PLACE LANTERN IN ALCOVE.');
    }
    if (!f(state, FLAGS.lanternLit)) {
      steps.push('LIGHT LANTERN — it has its own striker, so that is all it takes.');
    }
    if (!f(state, FLAGS.seamRevealed)) {
      steps.push('The light goes up through the carved eye and falls across the patterned wall.');
    }
    steps.push('Then EXAMINE WALL, and OPEN the seam the light picks out.');
    return 'The full solution:\n\n' + steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  },
];

const PREP_LADDER: Array<(state: GameState) => string> = [
  (state) =>
    state.inventory.includes('lantern')
      ? 'You have what the rite needs. The cave path leaves the square to the west, and the ' +
        'mouth is up beyond it.'
      : 'Take the hooded lantern from your windowsill before you go anywhere.',
  () =>
    'Nobody is timing you and you can come back down the hill whenever you like. Two people ' +
    'in the village have something specifically useful to hand over: Tolv in the workshop, and ' +
    'Aldren on the path.',
  () =>
    'Minimum to get started: take the lantern at home, take a wedge from the basket in the ' +
    'workshop, then go west from the square to the path, west again to the cave mouth, and in.',
];

const THRESHOLD_LADDER: Array<(state: GameState) => string> = [
  () => 'The passage out of the sealed chamber goes DOWN. Take it.',
  () =>
    'In the deep chamber, the thing worth your attention is the basin and the depth in it. ' +
    'EXAMINE THRESHOLD.',
  () =>
    'When you have looked and you have decided: ENTER THRESHOLD. Nothing else you do in that ' +
    'room will take you any further.',
];

const PAST_LADDER: Array<(state: GameState) => string> = [
  () => 'There is daylight up the stair. Go up, and then go down to the roofs.',
  () =>
    'The square is full of things you know, laid out wrong. Look at the well, the half-built ' +
    'wall, and the tree.',
  () =>
    'Talk to Sabra on the plank. Ask her about the cave first, and then ask her whether ' +
    'anything is coming.',
];

const LADDERS: Record<HintContext, Array<(state: GameState) => string>> = {
  prep: PREP_LADDER,
  puzzle: PUZZLE_LADDER,
  threshold: THRESHOLD_LADDER,
  past: PAST_LADDER,
  done: [() => 'This is as far as the prototype goes. There is nothing further to solve.'],
};

export interface HintResult {
  text: string;
  /** Step shown, 1-based. */
  step: number;
  /** Total steps in this ladder. */
  total: number;
  context: HintContext;
  /** Value to store back into flags.hint_stage. */
  nextStage: number;
}

/**
 * Returns the next hint. Steps advance on each request and reset whenever the
 * player moves on to a different part of the chapter.
 */
export function nextHint(state: GameState): HintResult {
  const context = hintContext(state);
  const sameContext = state.flags[FLAGS.hintContext] === context;
  const stored = sameContext ? Number(state.flags[FLAGS.hintStage] ?? 0) : 0;
  const ladder = LADDERS[context];
  const step = Math.min(stored, ladder.length - 1);
  const body = ladder[step]!(state);
  return {
    text: body,
    step: step + 1,
    total: ladder.length,
    context,
    nextStage: Math.min(step + 1, ladder.length - 1),
  };
}
