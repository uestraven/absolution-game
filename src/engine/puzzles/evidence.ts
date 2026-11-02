import type { GameState, NarrativeEvent, ResolveResult } from '../types';
import { FLAGS } from '../../content/flags';
import { OBJECTIVES } from '../../content/text';
import { addJournal, commit, flag as f, journalEvents, setObjective, type Draft } from '../mechanics';

/**
 * What the hero works out in the ruined century, and how.
 *
 * ## The shape of it
 *
 * Four separate sources, inspectable in any order, each recorded by its own
 * flag. None of them is a proof and none of them explains anything. The
 * inference is a **deliberate action the player takes** once they have the
 * pieces — not an automatic unlock, and not something the narration announces
 * on their behalf.
 *
 * ## What is deliberately not here
 *
 * No mechanism. There is no account anywhere in this chapter of why any of it
 * happened: Rue says outright that four hands on her roll give four
 * explanations and she believes none of them, and the narration does not know
 * either. The hero ends up certain about **responsibility** and no better off
 * about physics, which is the whole point.
 *
 * No eyewitness to the intervention, either. In this history the hero never
 * came back, so nothing here can have seen them do it — and the Account's
 * claim that something came *out of the hill* is explicitly marked as later
 * commentary on a line, which Rue says in as many words.
 *
 * ## Why these four
 *
 * The inference has to be better than *the villagers blame a monster, so they
 * are right*. So the sources have to corroborate each other without being
 * copies of each other:
 *
 *  - **The Account** carries the hero's own words, verbatim, inside a century
 *    of argument. Independent of them in the sense that matters: it is the
 *    downstream end of something they did.
 *  - **The memorial** dates the beginning, in stone, cut by people with no
 *    interest in the prophecy at all.
 *  - **Rue's inherited story** is a missing child on that night — an event the
 *    hero knows happened, because it was them.
 *  - **Their own journal** is the only thing that ties the other three to one
 *    person, and only they can read it that way.
 */

/** The sources the inference needs, and what each one is. */
export const EVIDENCE: ReadonlyArray<{ flag: string; what: string }> = [
  { flag: FLAGS.readAccount, what: "the settlement's Account" },
  { flag: FLAGS.readMemorial, what: 'the memorial by the well' },
  { flag: FLAGS.heardMissingChild, what: "Rue's story about the child" },
  { flag: FLAGS.checkedJournal, what: 'your own journal, read here' },
];

/** Which sources are still missing. */
export function missingEvidence(state: GameState): string[] {
  return EVIDENCE.filter((piece) => !f(state, piece.flag)).map((piece) => piece.what);
}

export function hasAllEvidence(state: GameState): boolean {
  return missingEvidence(state).length === 0;
}

/** True when the hero is somewhere and someone-enough to be able to think. */
export function canReflect(state: GameState): boolean {
  return state.era === 'future' && !f(state, FLAGS.knowsResponsibility) && hasAllEvidence(state);
}

/**
 * The synthesis. One commit, fired once, and the conclusion is the hero's own
 * and is about them rather than about how the world works.
 */
export function doReflect(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (f(draft, FLAGS.knowsResponsibility)) {
    events.push({
      kind: 'narration',
      text:
        'You go round it again, because you cannot not. It comes out the same way it came out ' +
        'the first time.',
    });
    return commit(draft, events, true);
  }

  if (draft.era !== 'future') {
    events.push({
      kind: 'failure',
      text: 'There is nothing to add up yet, and this is not the place to be standing still.',
    });
    return commit(draft, events, false);
  }

  const missing = missingEvidence(draft);
  if (missing.length > 0) {
    /*
     * Say what is missing. The player is not being asked to guess which
     * invisible checkbox is unticked: the hero knows perfectly well which
     * things they have not looked at yet.
     */
    events.push({
      kind: 'failure',
      text:
        'You sit down on something and try to put it in an order, and it will not go into an ' +
        'order, because there are pieces of it you have not looked at.\n\n' +
        `You have not read ${listOf(missing)}.`,
    });
    return commit(draft, events, false);
  }

  draft.flags[FLAGS.knowsResponsibility] = true;
  /*
   * Short, and only the joins.
   *
   * The four sources have each already been read, in their own prose, in their
   * own rooms. Recapping them here would be telling the player a fourth time
   * what they have been told three times. What is actually new is which two
   * things touch: the child in Rue's story is the hero, and the words at the
   * middle of the Account are theirs. The rest of it stays in the journal
   * entry, where a player who wants the chain laid out can go and read it.
   *
   * No location in it either. Reflecting is allowed anywhere in this century,
   * so nothing here can put the hero against a particular wall.
   */
  events.push({
    kind: 'narration',
    text:
      'You stop walking and put it in an order, and it goes into an order on the second try.\n\n' +
      'The year on that stone is the year you turned sixteen. The child who went up to the ' +
      'hill that night and did not come out is in your journal, with the date, because it is ' +
      'you.\n\n' +
      'And the words in the middle of their Account — the thing a hundred years of this ' +
      'settlement has argued with, the thing they shut the hill because of — are the ones you ' +
      'said out loud in that square, to a woman who went and found a board to write them on.\n\n' +
      'There was nowhere for them to come from before you said them.\n\n' +
      'You do not know what you broke, or how, and nobody here does either. You know whose it ' +
      'is.',
  });

  journalEvents(
    addJournal(draft, [
      {
        id: 'j.responsibility',
        text:
          'Putting it together: the memorial dates the beginning to the year I turned sixteen. ' +
          'Rue has it off her mother that a child of this village went up to the rite that ' +
          'night, went in, and did not come out — they argue about whether it was a boy or a ' +
          'girl and not about the going in. My own journal has that date and that child. And ' +
          'the words set apart in the middle of the Account, in the oldest hand on the roll, ' +
          'copied from a board that is named and is gone, are word for word the ones I recited ' +
          'in the square a hundred years before. Nobody wrote four explanations of why on that ' +
          'roll and got it right. I do not know what I broke or how. I know it was me.',
      },
    ]),
    events
  );
  setObjective(draft, OBJECTIVES.responsible, events);
  return commit(draft, events, true);
}

function listOf(items: string[]): string {
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]!}`;
}
