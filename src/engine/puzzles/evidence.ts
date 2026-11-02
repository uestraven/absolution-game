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
  events.push({
    kind: 'narration',
    text:
      'You sit down on the end of the long shed with your back against the metal and you put ' +
      'it in an order.\n\n' +
      'The stone by the well says the year. Not a season, not *in living memory* — a year, cut ' +
      'by somebody who wanted it to be exact, in the notation you were taught at a slate. It ' +
      'is the year you turned sixteen.\n\n' +
      'Rue has it off her mother off hers: a child of this village went up to that hill on ' +
      'that night to do the rite, went in, and did not come out. They argue about whether it ' +
      'was a boy or a girl. They do not argue about the going in.\n\n' +
      'Your journal says you went in. It says the date. It says what you did on the other side ' +
      'of it, in a square with a half-built wall in it, in front of a woman on a plank who ' +
      'asked you a straight question and wrote your answer on the back of a board.\n\n' +
      'And the Account — the thing this whole settlement has been arguing with for a hundred ' +
      'years, the thing they shut the hill because of — has that answer in the middle of it, ' +
      'word for word, in the oldest hand on the roll, copied from a board.\n\n' +
      'There is nobody else it can have come from. There was nowhere for it to come from before ' +
      'you said it.\n\n' +
      'You do not know what you broke. You do not know how a thing like that breaks, or why a ' +
      'door shuts before the wind arrives, or what the sky is doing, and nobody here knows ' +
      'either and the four people who wrote down why on Rue\'s roll are all wrong in different ' +
      'directions.\n\n' +
      'What you know is the shape of your own part in it, and the shape is this: it started in ' +
      'your year, at your hill, on the night you went in, and the words they live by are in ' +
      'your voice.',
  });

  journalEvents(
    addJournal(draft, [
      {
        id: 'j.responsibility',
        text:
          'The memorial dates it to my year. Rue\'s story is a child who went in that night ' +
          'and did not come out. My journal is that child. And the words at the middle of the ' +
          'Account are the ones I said in the square a hundred years before, copied off a ' +
          'board. I do not know what I broke or how. I know it was me.',
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
