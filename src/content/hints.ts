import type { GameState } from '../engine/types';
import { FLAGS } from './flags';
import { missingEvidence } from '../engine/puzzles/evidence';

const f = (state: GameState, key: string): boolean => Boolean(state.flags[key]);

export type HintContext =
  | 'prep'
  | 'puzzle'
  | 'threshold'
  | 'past'
  | 'access'
  | 'recite'
  | 'worksite'
  | 'future_out'
  | 'investigate'
  | 'seal'
  | 'home'
  | 'confront'
  | 'finish'
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
  if (state.chapter === 'ending') return 'done';
  if (state.chapter === 'return') {
    return f(state, FLAGS.earlierSelfDead) ? 'finish' : 'confront';
  }
  if (state.era === 'future') {
    if (state.locationId === 'future.sealed_chamber') return 'home';
    if (f(state, FLAGS.sealOpened)) return 'home';
    if (f(state, FLAGS.knowsResponsibility)) return 'seal';
    if (f(state, FLAGS.leftTheHill)) return 'investigate';
    return 'future_out';
  }
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

/** Out of a broken room with one way out of it. */
const FUTURE_OUT_LADDER: Array<(state: GameState) => string> = [
  () =>
    'The stair you came up this morning is closed and it is not going to open. The other thing ' +
    'in this room is a tear in the wall with daylight in it.',
  () =>
    'EXAMINE TEAR, if you want to know what you are getting into. Then go UP, or OUT, or CLIMB ' +
    '— they all mean the same thing here.',
  () =>
    'Up through the tear onto the hillside, and then EAST and down to the village. Everything ' +
    'in this chapter is down there.',
];

/** The evidence, and the thing the hero has to do with it. */
const INVESTIGATE_LADDER: Array<(state: GameState) => string> = [
  () =>
    'There is a woman sitting against a chest in that square, and a standing stone by the well. ' +
    'Those two are most of it.',
  (state) => {
    const missing = missingEvidence(state);
    if (missing.length === 0) {
      return (
        'You have everything. Stop and put it together: REFLECT, or *add it up* in the list of ' +
        'actions. It is a deliberate thing the hero does, and nothing will do it for you.'
      );
    }
    return (
      'Four things, and you can find them in any order:\n\n' +
      "1. Rue's records — ask her what she is sitting against, and read the Account she hands " +
      'over.\n' +
      '2. The memorial by the well, and the year at the foot of it.\n' +
      '3. The oldest thing Rue knows, which is not written down. Ask her, after the chest.\n' +
      '4. Your own JOURNAL, read here, with the other three in your head.\n\n' +
      `Still missing: ${missing.join('; ')}.`
    );
  },
  (state) => {
    const steps: string[] = [];
    if (!f(state, FLAGS.readAccount)) {
      steps.push('TALK TO RUE, ask what she is sitting against, LEAVE, then EXAMINE ACCOUNT.');
    }
    if (!f(state, FLAGS.heardMissingChild)) {
      steps.push('TALK TO RUE again and ask about the oldest thing she knows.');
    }
    if (!f(state, FLAGS.readMemorial)) steps.push('EXAMINE MEMORIAL.');
    if (!f(state, FLAGS.checkedJournal)) steps.push('JOURNAL, standing here.');
    steps.push('Then REFLECT.');
    steps.push(
      'While you are in the square: EXAMINE SHELL, where the workshop was. There are things ' +
        'in it you are going to want.'
    );
    return 'The full solution:\n\n' + steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  },
];

/** The wall somebody built on purpose. */
const SEAL_LADDER: Array<(state: GameState) => string> = [
  () =>
    'The way home is behind the stone wall under the overhang, and the stair to it from the ' +
    'inside is gone. You are going to have to open the wall.',
  (state) =>
    f(state, FLAGS.knowsLooseCourse)
      ? 'Third course up, left-hand end. Put something under it before you swing, or the whole ' +
        'wall settles onto it and you have made it worse.'
      : 'A dry wall has one bad course and the whole job is knowing which. Somebody sits on ' +
        'that rubble every day with a knife and a tally stick. Ask her.',
  (state) => {
    const steps: string[] = [];
    if (!state.inventory.includes('mallet')) {
      steps.push('EXAMINE SHELL in the square and TAKE MAUL. A mason\'s mallet would do too.');
    }
    if (!state.inventory.includes('wedge')) {
      steps.push('TAKE BLOCKS from the hollow in the shell — the old oak wedges.');
    }
    if (!f(state, FLAGS.knowsLooseCourse)) {
      steps.push(
        'TALK TO SORREL at the mouth: ask why the hill is walled up, then whether the wall is ' +
          'as good as it looks.'
      );
    }
    if (!f(state, FLAGS.coursePropped)) steps.push('USE WEDGE ON SEAL.');
    steps.push('BREAK SEAL. Twice.');
    return 'The full solution:\n\n' + steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  },
];

/** The one position nobody has ever lit. */
const HOME_LADDER: Array<(state: GameState) => string> = [
  () =>
    'Three positions up that panel. Two of them are plastered flat and solid. The third is ' +
    'cracked.',
  (state) =>
    'EXAMINE FILL, then CLEAR FILL. Then the dish behind it takes a lamp like the other two ' +
    'did, and the lamp has to be lit, and going through is its own separate decision.' +
    (state.inventory.includes('mallet')
      ? ''
      : '\n\nAnd take something heavy with you. You will not step through without it, and the ' +
        'hero will tell you why.'),
  (state) => {
    const steps: string[] = [];
    if (!f(state, FLAGS.examinedFill)) steps.push('EXAMINE FILL.');
    if (!f(state, FLAGS.fillCleared)) steps.push('CLEAR FILL.');
    if (!state.inventory.includes('lantern') && !f(state, FLAGS.lanternInMiddleDish)) {
      steps.push('Find your lantern — INVENTORY will say where you left it.');
    }
    if (!f(state, FLAGS.lanternInMiddleDish)) steps.push('PLACE LANTERN IN MIDDLE DISH.');
    if (!f(state, FLAGS.lanternLit)) steps.push('LIGHT LANTERN.');
    if (!state.inventory.includes('mallet')) {
      steps.push(
        'Get the mallet or the maul back in your hand — INVENTORY will say where it is. The ' +
          'hero will not go back without it.'
      );
    }
    steps.push('ENTER APERTURE.');
    return 'The full solution:\n\n' + steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  },
];

/** The confrontation. Nothing here is on a clock, and the ladder says so. */
const CONFRONT_LADDER: Array<(state: GameState) => string> = [
  () =>
    'Nothing in this room is on a timer. You can look at anything, read the journal, ask for ' +
    'this again, and nothing moves while you do.\n\n' +
    'They are frightened of you and they are between you and the wall. Talk to them.',
  (state) =>
    f(state, FLAGS.identityAccepted)
      ? 'They know who you are now. That settled who, and it settled nothing about what either ' +
        'of you should do next — which is the argument you are actually having.\n\n' +
        'There are two things left you have not told them: what the valley looks like in a ' +
        'hundred years, and where the words on the plank came from.'
      : 'They will not take your word for who you are, and they are right not to. You are ' +
        'carrying the one thing that settles it.\n\n' +
        'SHOW LANTERN.',
  (state) => {
    const steps: string[] = [];
    if (!f(state, FLAGS.showedLantern)) steps.push('SHOW LANTERN — it settles who you are.');
    if (!f(state, FLAGS.showedJournal)) steps.push('SHOW JOURNAL — they will find the flaw in it.');
    if (!f(state, FLAGS.describedFuture)) {
      steps.push('TELL THEM ABOUT THE FUTURE — thirty people where there were two hundred.');
    }
    if (!f(state, FLAGS.toldOrigin)) {
      steps.push('TELL THEM ABOUT THE PROPHECY — that the words are yours.');
    }
    steps.push(
      'When they stop arguing and go for the wall, your hands are worth trying: BLOCK WALL, ' +
        'HOLD THEM, TAKE THEIR LANTERN. Each of those does something and none of them is ' +
        'enough.'
    );
    steps.push(
      'And then there is the thing you carried up the hill. The game will not let you do it ' +
        'until the moment supports it, and it will not do it by accident.'
    );
    return 'What there is:\n\n' + steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  },
];

/** After. */
const FINISH_LADDER: Array<(state: GameState) => string> = [
  () =>
    'Their death stops their journey. It does not take the plank down from beside the well, ' +
    'and it does not stop the next sixteen-year-old being allowed in here.',
  () =>
    'EXAMINE PILLAR. Lovage told you what it was a hundred years ago and you have seen what ' +
    'became of it a hundred years the other way.',
  (state) => {
    const steps: string[] = [];
    if (!state.inventory.includes('mallet')) {
      steps.push('Pick the mallet back up — INVENTORY will say where it is.');
    }
    steps.push('BREAK PILLAR. Three times.');
    steps.push(
      'The second one closes the way out, and the game tells you so before the third. The ' +
        'third asks you to confirm.'
    );
    return 'The full solution:\n\n' + steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
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
  future_out: FUTURE_OUT_LADDER,
  investigate: INVESTIGATE_LADDER,
  seal: SEAL_LADDER,
  home: HOME_LADDER,
  confront: CONFRONT_LADDER,
  finish: FINISH_LADDER,
  done: [() => 'That is the end of the story. There is nothing left to solve.'],
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
