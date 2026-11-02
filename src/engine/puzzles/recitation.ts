import type { GameState, NarrativeEvent, ResolveResult } from '../types';
import { FLAGS } from '../../content/flags';
import {
  OBJECTIVES,
  RECITE_AFTER,
  RECITE_PREAMBLE,
  RECITE_REFUSED,
  RECITE_SPOKEN,
} from '../../content/text';
import { addJournal, commit, flag as f, journalEvents, setObjective, type Draft } from '../mechanics';
import { soundSymptom } from './rupture';

/**
 * The recitation.
 *
 * An authored story event, not a puzzle and not a branch. The scene runs in
 * one fixed order — the hero mentions the prophecy assuming it is common
 * ground, finds that nobody recognises it, is asked what the words are, and
 * then, by a deliberate action the player takes, says them.
 *
 * **The words themselves are never variable.** They come from
 * content/prophecy.ts, which is also where the plank in the opening square
 * gets them, because the plank's words come from this moment. There are no
 * wording options, no clauses to select and no flag recording what was said:
 * a second author would break the only origin the story has for the text. What
 * the player controls is everything around it — the tone they take, how much
 * they explain, who they tell the truth to, and whether they try to take it
 * back afterwards.
 *
 * Declining is not a branch either. It leaves the opportunity exactly where it
 * was, repeatable for as long as the hero is in the square, and nothing else
 * the player does will ever say the words on their behalf.
 */

/** True when the scene has reached the point where the hero can speak. */
export function canRecite(state: GameState): boolean {
  return (
    state.locationId === 'past.square' &&
    f(state, FLAGS.askedForWords) &&
    !f(state, FLAGS.recitedProphecy)
  );
}

/** True when the hero has been asked and has not answered — in or out of talk. */
export function reciteIsPending(state: GameState): boolean {
  return canRecite(state);
}

/**
 * Narrates a declined recitation. Called when the player walks away from the
 * conversation with the question still open. Costs nothing and closes nothing.
 */
export function declineRecital(draft: Draft, events: NarrativeEvent[]): void {
  if (f(draft, FLAGS.declinedRecital)) return;
  draft.flags[FLAGS.declinedRecital] = true;
  events.push({ kind: 'narration', text: RECITE_REFUSED });
}

export function doRecite(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (f(draft, FLAGS.recitedProphecy)) {
    events.push({
      kind: 'narration',
      text:
        'You say it again, to yourself, under your breath, and it comes out identical because ' +
        'it always does.\n\n' +
        'It is on a board in the doorway of a half-built workshop now. Saying it twice does not ' +
        'put it back.',
    });
    return commit(draft, events, true);
  }

  if (draft.locationId !== 'past.square') {
    events.push({
      kind: 'failure',
      text:
        'You say the first line out loud, to nobody, and it sounds exactly as foolish as it ' +
        'is. There is no one here it would mean anything to.',
    });
    return commit(draft, events, false);
  }

  if (!f(draft, FLAGS.askedForWords)) {
    events.push({
      kind: 'failure',
      text: f(draft, FLAGS.heardNoProphecy)
        ? 'You could stand in a strange square and recite at people. You have watched somebody ' +
          'do that at a fair and it did not go well for them.\n\n' +
          'Saffra is three feet away with a trowel in her hand and she has already noticed that ' +
          'you asked her something odd. Let her ask you why.'
        : 'Not yet, and not cold. You have not even found out whether these people know it ' +
          'already, and you are not going to start by announcing the end of the world to a ' +
          'woman on a plank.',
    });
    return commit(draft, events, false);
  }

  /*
   * One commit for the whole scene: the words, the witness writing them down,
   * the flags, the journal and the first wrongness all land together, so a
   * reload can never catch the chapter half-said.
   */
  events.push({ kind: 'narration', text: RECITE_PREAMBLE });
  events.push({ kind: 'dialogue', text: RECITE_SPOKEN });
  events.push({ kind: 'narration', text: RECITE_AFTER });

  draft.flags[FLAGS.recitedProphecy] = true;
  draft.flags[FLAGS.prophecyRecorded] = true;
  // Lovage's goodwill is spent from here: the ordinary water-carrier route
  // into the workings closes, and the two recovery routes open.
  draft.flags[FLAGS.lovageDistrust] = true;
  draft.pending = null;

  journalEvents(
    addJournal(draft, [
      {
        id: 'j.recited',
        text:
          'They asked me what was coming and I told them, word for word, the way I was taught ' +
          'it. Saffra wrote it on the back of a board and read it back to herself and then put ' +
          'the board somewhere dry.',
      },
    ]),
    events
  );

  soundSymptom(draft, events);
  setObjective(draft, OBJECTIVES.worksite, events);
  return commit(draft, events, true);
}
