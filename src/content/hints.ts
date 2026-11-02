import type { GameState } from '../engine/types';
import { FLAGS } from './flags';

const f = (state: GameState, key: string): boolean => Boolean(state.flags[key]);

export type HintContext =
  | 'prep'
  | 'puzzle'
  | 'threshold'
  | 'past'
  | 'access'
  | 'recite'
  | 'worksite'
  | 'done';

/**
 * Which hint ladder applies right now.
 *
 * Ordered most-specific first, so a player standing in the workings gets the
 * workings and not the village. Every ladder ends at the full solution: hints
 * never run out, never cost anything and never consume a timer, because there
 * is no timer.
 */
export function hintContext(state: GameState): HintContext {
  if (state.era === 'future' || f(state, FLAGS.crossedForward)) return 'done';
  // Standing in the workings beats everything: that is what the player is
  // looking at. Otherwise an open question in the square comes first, because
  // it is the thing the aperture is waiting on.
  if (state.locationId === 'past.worksite') return 'worksite';
  if (f(state, FLAGS.askedForWords) && !f(state, FLAGS.recitedProphecy)) return 'recite';
  if (f(state, FLAGS.worksiteAccess)) return 'worksite';
  if (state.era === 'past' && f(state, FLAGS.heardNoProphecy)) return 'access';
  if (state.era === 'past') return 'past';
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
      steps.push("Take a wedge from the basket in the joiner's workshop — Oreg gives them away.");
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
    'in the village have something specifically useful to hand over: Oreg in the workshop, and ' +
    'Tyme on the path.',
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
  () => 'There is daylight up the stair. Go up, down the track, and on down to the roofs.',
  () =>
    'The square is full of things you know, laid out wrong. Look at the well, the half-built ' +
    'wall, and the tree on the way past.',
  () =>
    'Talk to Saffra on the plank. Ask her about the cave first, then whether the cave has a ' +
    'name, and then whether anything is coming.',
];

/** Two independent routes in, and a third before the words are said. */
const ACCESS_LADDER: Array<(state: GameState) => string> = [
  () =>
    'Whatever is going to get you home is up the hill, and the hill is a building site with a ' +
    'foreman on the door. Go up and talk to Lovage, and ask Saffra about him first.',
  (state) =>
    f(state, FLAGS.recitedProphecy)
      ? 'Lovage will not take anything off you now. There are two other ways in and neither of ' +
        'them needs him: ask Fenn how a boy gets past a foreman, or ask Saffra to walk up with ' +
        'you. Either one is enough on its own.'
      : 'His water barrel split four days ago and he will not spare a man to fetch more. There ' +
        'is a yoke of empty skins against the half-built wall in the square, and a spring up ' +
        'the track, north of the tree.',
  (state) => {
    if (f(state, FLAGS.recitedProphecy)) {
      return (
        'Pick either:\n\n' +
        '1. TALK TO FENN in the square, and ask how a boy gets past the foreman. He will tell ' +
        'you about the gap behind the spoil heap.\n' +
        '2. TALK TO SAFFRA, and ask her to walk up with you.\n\n' +
        'Then go up to the mouth, down the stair to the basin chamber, and NORTH past the heap.'
      );
    }
    const steps: string[] = [];
    if (!state.inventory.includes('water_skins')) {
      steps.push('TAKE SKINS in the square — the yoke against the half-built wall.');
    }
    if (!f(state, FLAGS.skinsFilled)) {
      steps.push('Go west to the track, NORTH to the spring, and FILL SKINS.');
    }
    steps.push('Back south, west to the mouth, and GIVE SKINS TO LOVAGE.');
    steps.push('Then down the stair to the basin chamber, and NORTH past the spoil heap.');
    return 'The full solution:\n\n' + steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  },
];

const RECITE_LADDER: Array<(state: GameState) => string> = [
  () =>
    'They have stopped working and asked you a straight question. There is no clever way round ' +
    'this one and nothing else in the chapter moves until you answer it.',
  () =>
    'You know the words. You have known them since you were small enough to be lifted up to ' +
    'see the plank, and you are the only person on this hillside who has ever heard them.',
  () =>
    'RECITE PROPHECY, in the square. In selectable mode it is the first entry in the list of ' +
    'things you can say.\n\n' +
    'You can walk away instead and come back to it. Nothing is lost by waiting and nothing ' +
    'else will say it for you.',
];

const WORKSITE_LADDER: Array<(state: GameState) => string> = [
  (state) =>
    f(state, FLAGS.knowsSettings)
      ? 'You have worked out what the three heights are. The only one of them you can actually ' +
        'use is the high one.'
      : 'There are three things on that panel wall worth your time and you need all three: the ' +
        'drawing on hide, the slate beside it, and the dishes themselves.',
  (state) =>
    f(state, FLAGS.knowsSettings)
      ? 'The trestle under the high dish is there because that is how the dish was cut. Stand ' +
        'the lamp in it, light it, and then go through the aperture deliberately — the light ' +
        'alone will not take you anywhere.'
      : 'EXAMINE DRAWING, EXAMINE SLATE, EXAMINE DISHES. The drawing gives you the heights, the ' +
        'slate gives you what the crew found out, and the dishes tell you which of the three ' +
        'you have already used in your life.',
  (state) => {
    const steps: string[] = [];
    if (!f(state, FLAGS.readDrawing)) steps.push('EXAMINE DRAWING.');
    if (!f(state, FLAGS.readCrewNotes)) steps.push('EXAMINE SLATE.');
    if (!f(state, FLAGS.examinedDishes)) steps.push('EXAMINE DISHES.');
    if (!f(state, FLAGS.recitedProphecy)) {
      steps.push('Go back down to the square and RECITE PROPHECY. You owe them that first.');
    }
    if (!state.inventory.includes('lantern') && !f(state, FLAGS.lanternInHighDish)) {
      steps.push('Get your lantern back — INVENTORY will tell you where you left it.');
    }
    if (!f(state, FLAGS.lanternInHighDish)) steps.push('PLACE LANTERN IN HIGH DISH.');
    if (!f(state, FLAGS.lanternLit)) steps.push('LIGHT LANTERN.');
    steps.push('ENTER APERTURE.');
    return (
      'The full solution:\n\n' +
      steps.map((s, i) => `${i + 1}. ${s}`).join('\n') +
      '\n\nThe low dish is worth trying first if you want to see for yourself what it does. It ' +
      'costs nothing and it does not take you anywhere.'
    );
  },
];

const LADDERS: Record<HintContext, Array<(state: GameState) => string>> = {
  prep: PREP_LADDER,
  puzzle: PUZZLE_LADDER,
  threshold: THRESHOLD_LADDER,
  past: PAST_LADDER,
  access: ACCESS_LADDER,
  recite: RECITE_LADDER,
  worksite: WORKSITE_LADDER,
  done: [
    () =>
      'This is as far as the story is built. There is nothing here left to solve, and this is ' +
      'not the ending — the chapters that follow it are simply not written yet.',
  ],
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
