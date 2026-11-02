import type { GameAction, GameState, NarrativeEvent, ResolveResult } from '../types';
import { FLAGS } from '../../content/flags';
import { OBJECTIVES } from '../../content/text';
import * as T from '../../content/confrontationText';
import {
  addJournal,
  commit,
  flag as f,
  journalEvents,
  removeFromInventory,
  setObjective,
  type Draft,
} from '../mechanics';

/**
 * The pillar, and the end.
 *
 * ## Why the hero has to stay
 *
 * Physically, and stated in the prose before the commitment rather than
 * asserted afterwards:
 *
 *  - The crack is on the face of the pillar that looks into the room. There is
 *    nowhere else to stand to hit it.
 *  - The second blow brings the roof down a hand, and the squeeze west closes
 *    to a gap you can get two fingers through. That is an actual state change —
 *    `escapeClosed` — and the exit stops being listed because it is full of
 *    hill, not because the finale needs it not to be there.
 *
 * So after the second blow the game has told the player plainly — in the hero's
 * own words, as three physical facts rather than a summary of them — that one
 * more swing brings the hill down on this chamber with them under it, and that
 * the squeeze is shut. The third blow is then taken
 * through an explicit confirmation, which exists in both input modes because it
 * is the engine's ordinary clarification prompt.
 *
 * ## What cannot happen
 *
 * The pillar cannot be touched while the earlier self is alive — not because
 * of a flag check dressed up as fiction, but because they would be under it,
 * and the hero says so. So there is no route to the destruction that skips the
 * required order of the two deaths.
 *
 * Nothing survives. No rescue, no replacement fold, no version of either of
 * them anywhere. The hero is a singularity and the game never says the word.
 */

/** What the confirmed third blow carries, to tell it from an unconfirmed one. */
export const COMMIT_MARKER = 'the last one';

export function struckCount(state: GameState): number {
  const raw = state.flags[FLAGS.pillarStruck];
  return typeof raw === 'number' && Number.isFinite(raw) ? Math.max(0, Math.min(3, raw)) : 0;
}

/** Why the pillar will not take a blow, or null when it will. */
export function pillarRefusal(state: GameState): string | null {
  if (f(state, FLAGS.caveDestroyed)) return T.LEAVE_CLOSED;
  if (!f(state, FLAGS.earlierSelfDead)) return T.PILLAR_ALIVE;
  if (!state.inventory.includes('mallet')) return T.PILLAR_NO_TOOL;
  return null;
}

/**
 * One blow. The first two change the room; the third is the end, and is only
 * reached through the confirmation below.
 */
export function strikePillar(
  draft: Draft,
  events: NarrativeEvent[],
  confirmed: boolean
): ResolveResult {
  const refusal = pillarRefusal(draft);
  if (refusal !== null) {
    events.push({ kind: 'failure', text: refusal });
    return commit(draft, events, false);
  }

  const struck = struckCount(draft);

  if (struck >= 2) {
    if (!confirmed) {
      /*
       * The commitment, through the engine's own clarification prompt — so it
       * is a button in selectable mode and a typed answer in type-only mode,
       * with no new machinery and no way to take it by accident.
       */
      draft.pending = {
        kind: 'clarification',
        question: T.COMMIT_QUESTION,
        options: [
          {
            label: T.COMMIT_YES,
            // The marker that distinguishes the answered prompt from an
            // ordinary BREAK PILLAR. A player who types it out has said the
            // same thing in words, which is fine: it is a confirmation, not a
            // lock.
            action: {
              type: 'BREAK',
              target: 'sealed.pillar',
              using: COMMIT_MARKER,
            } as GameAction,
          },
          { label: T.COMMIT_NO, action: { type: 'CANCEL' } as GameAction },
        ],
      };
      events.push({
        kind: 'options',
        text: `${T.COMMIT_QUESTION}\n  1. ${T.COMMIT_YES}\n  2. ${T.COMMIT_NO}\n\nType a number or a name, or CANCEL.`,
      });
      return commit(draft, events, false);
    }
    return bringItDown(draft, events);
  }

  draft.flags[FLAGS.pillarStruck] = struck + 1;
  // The table in confrontation.ts says the first blow moves the stage on.
  draft.flags[FLAGS.finaleStage] = 'pillar';
  events.push({ kind: 'narration', text: T.PILLAR_BLOW[struck]! });

  if (struck + 1 === 2) {
    draft.flags[FLAGS.escapeClosed] = true;
    journalEvents(
      addJournal(draft, [
        {
          id: 'j.escape_closed',
          text:
            'Two blows. The roof came down a hand and the squeeze is shut, and the crack is on ' +
            'the face of the pillar that looks into the room, so the next one has to be struck ' +
            'from in here. There is no way out of this room.',
        },
      ]),
      events
    );
    setObjective(draft, OBJECTIVES.finish, events);
  } else {
    journalEvents(
      addJournal(draft, [
        {
          id: 'j.first_blow',
          text:
            'First blow at the foot of the pillar, where the crack is. It opened to a ' +
            'finger-width and the hill settled overhead, and the squeeze west is narrower ' +
            'than it was. Another one and that gap is shut with me inside it.',
        },
      ]),
      events
    );
  }
  return commit(draft, events, true);
}

/**
 * The last one.
 *
 * Everything terminal latches here, in one commit: the pillar, the chamber, the
 * fold, the hero. Nothing after this is a living person doing things.
 */
function bringItDown(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  draft.flags[FLAGS.pillarStruck] = 3;
  draft.flags[FLAGS.caveDestroyed] = true;
  draft.flags[FLAGS.heroDead] = true;
  draft.flags[FLAGS.storyComplete] = true;
  draft.flags[FLAGS.lanternLit] = false;
  draft.pending = null;

  /*
   * The lamp goes down by the pillar before the swing — but only if it is still
   * in hand. A player who put it down somewhere in this room earlier does not
   * get told they are doing it again.
   */
  const carried = draft.inventory.includes('lantern');
  if (carried) {
    removeFromInventory(draft, 'lantern');
    draft.placements['lantern'] = { kind: 'room', locationId: 'present.sealed_chamber' };
  }

  events.push({
    kind: 'narration',
    text: [T.THE_SACRIFICE_OPEN, ...(carried ? [T.THE_SACRIFICE_LAMP] : []), T.THE_SACRIFICE].join(
      '\n\n'
    ),
  });
  events.push({ kind: 'narration', text: T.THE_END_OF_THE_CAVE });

  journalEvents(
    addJournal(draft, [
      {
        id: 'j.the_end',
        text:
          'Three blows. The pillar went and the hill came down on the chamber and the basin ' +
          'and whatever the basin was. Nobody is going to stand in that room again, because ' +
          'there is no room.',
      },
    ]),
    events
  );

  // The viewpoint change is explicit, and it is not the hero doing anything.
  events.push({
    kind: 'narration',
    heading: T.EPILOGUE_HEADING,
    subheading: T.EPILOGUE_SUBHEADING,
    text: T.EPILOGUE,
  });

  draft.chapter = 'ending';
  draft.ended = true;
  setObjective(draft, OBJECTIVES.over, events);
  events.push({ kind: 'system', text: T.ENDING_MARKER });
  return commit(draft, events, true);
}

/** Re-prints the epilogue. Reading, not replaying: no flag moves. */
export function reviewEnding(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (!f(draft, FLAGS.storyComplete)) {
    events.push({ kind: 'failure', text: 'There is nothing to review yet.' });
    return commit(draft, events, false);
  }
  events.push({
    kind: 'narration',
    heading: T.EPILOGUE_HEADING,
    subheading: T.EPILOGUE_SUBHEADING,
    text: T.EPILOGUE,
  });
  events.push({ kind: 'system', text: T.ENDING_MARKER });
  return commit(draft, events, false);
}

/**
 * What a finished save will accept.
 *
 * Everything except reading is refused, because there is nobody left to do it.
 * The refusal says so once rather than per-verb, and it does not pretend the
 * story is unfinished.
 */
export function afterTheEnd(action: GameAction['type']): string | null {
  const readable: ReadonlySet<GameAction['type']> = new Set<GameAction['type']>([
    'JOURNAL',
    'HELP',
    'REVIEW',
    'LOOK',
    'UNPARSED',
  ]);
  if (readable.has(action)) return null;
  return (
    'There is nobody left in that room to do anything, and there is no room.\n\n' +
    'You can read the ending again, look through the journal, export the save, or start again ' +
    'from the beginning — or from the checkpoint at the start of the last chapter, if you want ' +
    'to try that conversation another way.'
  );
}
