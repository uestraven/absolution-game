import type { GameState, NarrativeEvent, ResolveResult } from '../types';
import { FLAGS } from '../../content/flags';
import {
  CROSSING_BACK,
  END_OF_CONTENT_RETURN,
  OBJECTIVES,
  RETURN_ARRIVAL,
} from '../../content/text';
import {
  addJournal,
  commit,
  discover,
  flag as f,
  giveItem,
  journalEvents,
  removeFromInventory,
  setObjective,
  type Draft,
} from '../mechanics';

/**
 * The middle dish, and the way back.
 *
 * ## The destination
 *
 * The same fixed table as every other crossing — low is year −100, middle is
 * the original era, high is year +100, and they are the same three places from
 * wherever the lamp is standing. There is no arithmetic on a current year here
 * and there is no dial: the hero is not choosing a date, they are lighting the
 * one position they have never been able to reach.
 *
 * **They are still guessing.** They have been right about the rule twice now,
 * which is not the same as knowing it, and the prose says so in their own
 * voice rather than confirming it for them. Nothing in this chapter explains
 * why the heights behave this way, and nobody in it has a theory worth having.
 *
 * ## The moment it lands on
 *
 * Fixed, and not chosen: the instant the younger self's lamp picks the seam
 * out of the patterned wall. The hero recognises it because they lived it from
 * the other side an hour ago in their own time — not because anybody told them,
 * and not because a future self was ever inserted into the opening chapter.
 * There was nobody else in that room the first time. There is now.
 */

/** The three positions, as places. Not offsets. */
const MIDDLE_DESTINATION = 'present.sealed_chamber' as const;

/** Why the fill will not come off yet, or null when it will. */
export function fillRefusal(state: GameState): string | null {
  if (f(state, FLAGS.fillCleared)) return null;
  if (!f(state, FLAGS.examinedFill)) {
    return (
      'You put a hand flat on the panel and work across it. Three patches, floated on flush ' +
      'and smoothed over, and you cannot tell by feel which of them is which.\n\n' +
      'Look at them properly before you start pulling at a wall that has a hill resting on it.'
    );
  }
  return null;
}

/** Getting the cracked fill off the middle position. */
export function clearFill(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (f(draft, FLAGS.fillCleared)) {
    events.push({
      kind: 'narration',
      text: 'It is already off. The pieces are round your feet.',
    });
    return commit(draft, events, false);
  }
  const refusal = fillRefusal(draft);
  if (refusal !== null) {
    events.push({ kind: 'failure', text: refusal });
    return commit(draft, events, false);
  }

  const withMallet = draft.inventory.includes('mallet');
  draft.flags[FLAGS.fillCleared] = true;
  discover(draft, ['futuresealed.middledish']);
  events.push({
    kind: 'success',
    text: withMallet
      ? 'You get your fingers into the crack and pull, and nothing happens, and then you tap ' +
        'along the split with the mallet — gently, which is a thing you have learned to be ' +
        'this week — and the fill comes off the panel in two curved slabs and a shower of ' +
        'grit.\n\n' +
        'Behind it the stone is dressed smooth and undercut at the lip and has never had ' +
        'anything in it.'
      : 'You get your fingers into the crack and pull. It holds, and holds, and then lets go ' +
        'all at once and takes the skin off two knuckles, and the fill comes away in two ' +
        'curved slabs that you only half catch.\n\n' +
        'Behind it the stone is dressed smooth and undercut at the lip and has never had ' +
        'anything in it.',
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.fill_off',
        text:
          'Took the cracked fill off the middle position. The dish behind it is dressed, ' +
          'undercut and unused.',
      },
    ]),
    events
  );
  return commit(draft, events, true);
}

/** Standing the lamp in the middle dish. */
export function placeLanternInMiddleDish(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (!f(draft, FLAGS.fillCleared)) {
    events.push({
      kind: 'failure',
      text: 'There is a hand\'s breadth of lime fill where the dish should be.',
    });
    return commit(draft, events, false);
  }
  if (f(draft, FLAGS.lanternInMiddleDish)) {
    events.push({ kind: 'narration', text: 'It is already standing in it.' });
    return commit(draft, events, false);
  }

  removeFromInventory(draft, 'lantern');
  draft.placements['lantern'] = { kind: 'fixture', fixtureId: 'futuresealed.middledish' };
  draft.flags[FLAGS.lanternInMiddleDish] = true;
  events.push({
    kind: 'success',
    text:
      'You lift the lantern in with both hands and set it down, and it seats itself with the ' +
      'small rock you have now felt three times in your life, in three centuries, in the same ' +
      'four square paces of rock.' +
      (f(draft, FLAGS.lanternLit)
        ? '\n\nThe panel answers. The pressure arrives in the hinges of your jaw, and under ' +
          'the linen as well, which it has no business doing.'
        : '\n\nThe wick is cold, and the panel is a panel, and nothing is going to happen ' +
          'until there is a light in it.'),
  });
  return commit(draft, events, true);
}

/** Why the panel will not take the hero yet, or null when it will. */
export function returnRefusal(state: GameState): string | null {
  if (!f(state, FLAGS.knowsResponsibility)) {
    return (
      'You stand in front of the gap in the panel with your hand on the stone, and you do not ' +
      'do it.\n\n' +
      'If this is the way home then it is the only one you will ever get, and you would be ' +
      'taking it with a bound head and a bad feeling and nothing you could say out loud. ' +
      'There is a village down that hill with everything that is known about this written down ' +
      'in a box, and an old woman sitting against the box, and you have not finished with ' +
      'either of them.'
    );
  }
  if (!f(state, FLAGS.lanternInMiddleDish)) {
    return (
      'Nothing is standing in the middle dish. The panel is cold, and there is a thumb of ' +
      'dead hill behind it.'
    );
  }
  if (!f(state, FLAGS.lanternLit)) {
    return (
      'The lantern is in the dish and the wick is dark, and the gap in the panel is a hole in ' +
      'a wall with rock behind it.\n\n' +
      'It was never the lamp. It was the light. You have known that since you were kneeling at ' +
      'an alcove with a striker in your hand.'
    );
  }
  /*
   * The one thing the hero cannot go back without.
   *
   * It is deliberately the last refusal, with the panel already answering,
   * because that is the point at which a person actually thinks about what
   * they are carrying. The reason is the hero's own and it is specific: they
   * have stood under that chamber and watched its one support crush itself,
   * and they know what it is going to take.
   *
   * It cannot strand anybody. Dropped anywhere in this century it is a room
   * item, and every room here reaches every other; left a century earlier,
   * the shell where the workshop used to be has a maul in it.
   */
  if (!state.inventory.includes('mallet')) {
    return (
      'You are a step from it and you stop, with one hand on the stone, because your hands are ' +
      'the wrong weight.\n\n' +
      'You have been in that chamber twice today — once with a roof on it and once with the ' +
      'roof on the floor — and you have seen what took it down. One worked pillar, cracked at ' +
      'the foot, crushing from the base up because it had been carrying more than it should ' +
      'for a hundred years.\n\n' +
      'You are not going back there to have a conversation. You are going back to make sure ' +
      'that nobody ever walks into that hill again, and that is not a thing you do with your ' +
      'hands and a lantern.\n\n' +
      'Go and get something heavy.'
    );
  }
  return null;
}

/**
 * The third crossing, and the arrival.
 *
 * One commit. Era, chapter, location, the lamp out of the dish and back into
 * the hero's hands, the objective, the journal, the end-of-content marker and
 * the people in the room all move together, so no reload lands halfway and no
 * reload fires the arrival twice.
 *
 * The returning hero keeps everything: the eye, the mallet, the journal, every
 * discovery. Reusing `present.*` must not read as the opening chapter starting
 * again, which is why `chapter` becomes `return` in the same commit and the
 * room has its own description for it.
 */
export function enterPanel(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  const refusal = returnRefusal(draft);
  if (refusal !== null) {
    events.push({ kind: 'failure', text: refusal });
    return commit(draft, events, false);
  }

  draft.flags[FLAGS.lanternInMiddleDish] = false;
  giveItem(draft, 'lantern');

  draft.flags[FLAGS.crossedBack] = true;
  draft.chapter = 'return';
  draft.era = 'present';
  draft.locationId = MIDDLE_DESTINATION;
  draft.pending = null;

  events.push({ kind: 'narration', text: CROSSING_BACK });
  /*
   * The arrival prose is pushed here rather than left to the room's
   * `firstVisit`, which could never fire: the hero visited this room on their
   * sixteenth birthday and `visited` has said so ever since. LOOK afterwards
   * gives the chapter's own room description.
   */
  events.push({ kind: 'narration', text: RETURN_ARRIVAL });
  discover(draft, ['returnsealed.lamp', 'sealed.seam', 'earlier_self']);
  if (!draft.visited.includes(MIDDLE_DESTINATION)) draft.visited.push(MIDDLE_DESTINATION);

  journalEvents(
    addJournal(draft, [
      {
        id: 'j.crossed_back',
        text:
          'The middle position was home. I came out in the sealed chamber at the moment the ' +
          'light found the seam, and there is somebody kneeling in front of that wall who is ' +
          'sixteen years old and has both eyes.',
      },
    ]),
    events
  );

  setObjective(draft, OBJECTIVES.returned, events);
  draft.ended = true;
  events.push({ kind: 'system', text: END_OF_CONTENT_RETURN });
  return commit(draft, events, true);
}

/**
 * What the returning hero may not do yet.
 *
 * The confrontation is the last chapter and it is not written. Refusing is
 * honest about that rather than pretending the actions do not exist, and it
 * never implies the story is over.
 */
export function returnBoundary(state: GameState, what: 'violence' | 'leave' | 'cross'): string {
  if (state.chapter !== 'return') return '';
  switch (what) {
    case 'violence':
      return (
        'Not yet.\n\n' +
        'You are standing in a room with a mallet in your hand and a reason, and what happens ' +
        'next is the last chapter of this story, and it is not written yet. It is not going to ' +
        'be written carelessly either.'
      );
    case 'leave':
      return (
        'You do not go anywhere.\n\n' +
        'You came back a hundred years for the next minute and a half, and it is happening now, ' +
        'and it is happening in this room.'
      );
    case 'cross':
    default:
      return (
        'There is nothing to step into. The seam is a shadow on a wall and the passage behind ' +
        'it has not been opened yet, and the only reason you know it is there is that you are ' +
        'the one who opened it.'
      );
  }
}
