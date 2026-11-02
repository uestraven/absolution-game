import type { GameState, NarrativeEvent, ResolveResult } from '../types';
import { FLAGS } from '../../content/flags';
import {
  EYE_AFTERMATH,
  SEAL_FIRST_BLOW,
  SEAL_SECOND_BLOW,
  WANDERER_NAMED,
} from '../../content/text';
import {
  addJournal,
  commit,
  discover,
  flag as f,
  journalEvents,
  removeFromInventory,
  type Draft,
} from '../mechanics';

/**
 * Breaking back into the hill, and what it costs.
 *
 * The hero left this hill through a tear the subsidence opened, which goes to
 * the dry basin and nowhere else. The old stair up to the portal chamber is
 * closed by a fall that set solid a century ago. So the only route to the one
 * dish that might go home is through a wall the settlement built on purpose,
 * and the chapter's last obstacle is a rule somebody else made.
 *
 * ## The injury
 *
 * One authored event, inside the successful opening, outside, in front of
 * witnesses. It fires once and latches on `lostEye`, so revisiting the mouth
 * or swinging again never replays it.
 *
 * Two things it is careful not to be. It is not a punishment for
 * experimentation — nothing the player can do wrong causes it, and the only
 * way to reach it is the correct solution. And the stone arriving before the
 * sound of the fall is an **observation**, not an argument: nobody in the text
 * concludes anything from it, the narration offers no account of it, and
 * Sorrel's version of it is the closest thing to an explanation anybody gets,
 * which is that things do that here.
 *
 * There is no interface consequence either: no visual filter, no half-hidden
 * screen, no altered controls, no accessibility penalty. The hero loses an eye
 * in the fiction and the game remains exactly as playable.
 */

/** Why the seal will not come down yet, or null when it will. */
export function sealRefusal(state: GameState): string | null {
  if (f(state, FLAGS.sealOpened)) return null;
  if (!state.inventory.includes('mallet')) {
    return (
      'You put both hands on the third course and pull, and then get a shoulder against the ' +
      'course above it and push, and the wall does what a dry-laid wall does, which is ' +
      'nothing at all.\n\n' +
      'Nine courses of squared stone, every one bedded on the one below. You are not going to ' +
      'do this with your hands and you are not going to do it with a lantern. It wants ' +
      'something heavy swung at it.'
    );
  }
  if (!f(state, FLAGS.knowsLooseCourse)) {
    return (
      'You stand in front of nine courses of good stone with a mallet in your hand.\n\n' +
      'You could start anywhere. Starting anywhere on a dry wall means hitting the strongest ' +
      'part of it until something in your wrist gives out, and you have watched enough men at ' +
      'enough stone this week to know that a wall has one bad course and the whole job is ' +
      'knowing which.\n\n' +
      'Somebody who sits on this rubble every day would know.'
    );
  }
  if (!f(state, FLAGS.coursePropped)) {
    return (
      'You get the mallet up and then stop, with the head about a foot off the stone.\n\n' +
      'The third course is loose. It is also carrying eight courses of squared stone, and the ' +
      'moment you shift it the whole weight above comes down a hair and sits on it, and then ' +
      'it is not loose any more — it is the tightest stone in the wall with a hill on top of ' +
      'it.\n\n' +
      'Sorrel said it. *Put something under it first.*'
    );
  }
  return null;
}

/**
 * One swing. The first lands and does the work; the second opens it, and that
 * is where the stone comes down.
 */
export function strikeSeal(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (f(draft, FLAGS.sealOpened)) {
    events.push({
      kind: 'narration',
      text:
        'There is nothing left to hit. The courses are on the shale and the hole is a hole.',
    });
    return commit(draft, events, false);
  }

  const refusal = sealRefusal(draft);
  if (refusal !== null) {
    /*
     * Every refusal is a setback and nothing more. Nothing is consumed, no
     * route closes, and the one that can actually happen twice — swinging at
     * an unbraced course — leaves a mark on the stone and a flag, so the room
     * can describe what the player did without penalising them for it.
     */
    if (f(draft, FLAGS.knowsLooseCourse) && !f(draft, FLAGS.coursePropped)) {
      draft.flags[FLAGS.sealSettled] = true;
    }
    events.push({ kind: 'failure', text: refusal });
    return commit(draft, events, false);
  }

  // Braced, armed, and in the right place. Two blows, authored.
  if (!f(draft, FLAGS.sealStruck)) {
    draft.flags[FLAGS.sealStruck] = true;
    events.push({ kind: 'narration', text: SEAL_FIRST_BLOW });
    return commit(draft, events, true);
  }

  draft.flags[FLAGS.sealOpened] = true;
  draft.flags[FLAGS.lostEye] = true;
  draft.flags[FLAGS.eyeTreated] = true;
  draft.flags[FLAGS.namedWanderer] = true;
  draft.flags[FLAGS.coursePropped] = false;
  draft.pending = null;

  // The wedge was under the course the wall came down on.
  removeFromInventory(draft, 'wedge');
  draft.placements['wedge'] = { kind: 'room', locationId: 'future.entrance' };

  discover(draft, ['futureentrance.seal']);

  events.push({ kind: 'narration', text: SEAL_SECOND_BLOW });
  events.push({ kind: 'narration', text: EYE_AFTERMATH });
  events.push({ kind: 'narration', text: WANDERER_NAMED });

  journalEvents(
    addJournal(draft, [
      {
        id: 'j.seal_opened',
        text: 'The seal is down. Nine courses of dry-laid stone, and the hill is open again.',
      },
      {
        id: 'j.lost_eye',
        text:
          'A stone off the hillside took my left eye, and the fall it came out of began ' +
          'afterwards. I heard it start. An older woman cleaned the socket and bound it and ' +
          'did not ask me a single question.',
      },
      {
        id: 'j.named',
        text:
          'A man on the track put down his bucket, backed away from me, and said the word off ' +
          'the plank.',
      },
    ]),
    events
  );
  return commit(draft, events, true);
}

/** Wedging the loose course so the wall cannot settle back onto it. */
export function propCourse(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (f(draft, FLAGS.sealOpened)) {
    events.push({ kind: 'failure', text: 'There is nothing left to hold up.' });
    return commit(draft, events, false);
  }
  if (!f(draft, FLAGS.knowsLooseCourse)) {
    events.push({
      kind: 'failure',
      text:
        'You go along the courses with the wedge in your hand, trying it at joints, and every ' +
        'joint you try is tight. There will be one that is not. Somebody here will know which.',
    });
    return commit(draft, events, false);
  }
  if (f(draft, FLAGS.coursePropped)) {
    events.push({
      kind: 'narration',
      text: 'It is already in, and the stone above it is already sitting on it.',
    });
    return commit(draft, events, false);
  }

  removeFromInventory(draft, 'wedge');
  draft.placements['wedge'] = { kind: 'fixture', fixtureId: 'futureentrance.seal' };
  draft.flags[FLAGS.coursePropped] = true;
  events.push({
    kind: 'success',
    text:
      'You lie down on the shale with your cheek against the stone and get the wedge into the ' +
      'gap under the left-hand end of the third course, and then kick it the rest of the way ' +
      'in with your heel.\n\n' +
      'The wall settles onto it and stops. There is now a block of oak between eight courses ' +
      'of squared stone and the course underneath them, which means that when the third one ' +
      'goes, the weight has somewhere to go that is not down.\n\n' +
      'It is what a wedge is for. A man told you that in a workshop that is three walls and ' +
      'two goats.',
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.propped',
        text: 'Wedged the loose course at the seal so the weight above cannot settle onto it.',
      },
    ]),
    events
  );
  return commit(draft, events, true);
}

/** Taking the wedge back out before the wall comes down. Always allowed. */
export function unpropCourse(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  draft.flags[FLAGS.coursePropped] = false;
  events.push({
    kind: 'success',
    text:
      'You work the wedge back out with your fingers and the side of your boot. The wall comes ' +
      'down the hair it came up and sits where it was sitting.',
  });
  return commit(draft, events, true);
}
