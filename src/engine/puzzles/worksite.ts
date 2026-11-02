import type { GameState, NarrativeEvent, ResolveResult } from '../types';
import { FLAGS } from '../../content/flags';
import { CROSSING_FORWARD, END_OF_CONTENT, FUTURE_ARRIVAL, OBJECTIVES } from '../../content/text';
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
 * The builders' three heights.
 *
 * ## The rule, for implementors only
 *
 * A lamp at one of three heights makes the fold answer, and the three heights
 * address **three fixed destinations** — not three distances from wherever the
 * lamp happens to be standing:
 *
 *   low    → year −100, the builders' own century
 *   middle → year 0, the era the hero grew up in
 *   high   → year +100
 *
 * The same three places from any era. Encoded as the table below rather than
 * as arithmetic on a current year, because they are places and not offsets:
 * the first crossing ran year 0 → −100 on the low setting, this one runs
 * −100 → +100 on the high setting, and the eventual return runs +100 → year 0
 * on the middle one. "A century forward" is not a thing any of them does.
 *
 * **This table is implementation guidance and is never stated to the player.**
 * The hero gets one arrival and one craft record and reasons from those, and
 * what they reason is correct and incomplete: the heights are places, one of
 * the three must be home, it is not the low one, and the middle one has no
 * dish. That leaves one setting they can light and no way to know what it is.
 *
 * Taking it is a reasoned gamble on sound evidence. It is not a mistake, it is
 * not an arithmetic error, and nothing in the room steers the player into it:
 * every other thing they can try is answered on its own physical terms.
 *
 * The mechanism is never explained — not here in prose, not by the crew's
 * slate, not by the drawing, and not by the narration. There are observations
 * and there are characters' theories, and no inscription or builder stands in
 * for a scientist.
 */

/** The fixed destination of each cut dish. `null` where no dish exists yet. */
const DISH_DESTINATION = {
  low: 'past.deep_chamber',
  middle: null,
  high: 'future.deep_chamber',
} as const;

export type DishId = keyof typeof DISH_DESTINATION;

/** Everything the hero needs before they can read the panel as a whole. */
function hasAllThreePieces(state: GameState): boolean {
  return (
    f(state, FLAGS.readDrawing) && f(state, FLAGS.readCrewNotes) && f(state, FLAGS.examinedDishes)
  );
}

/**
 * Fires once, when the drawing, the slate and the dishes have all been looked
 * at. The conclusion is the hero's own and it is as far as the evidence goes.
 */
export function noteSettings(draft: Draft, events: NarrativeEvent[]): void {
  if (f(draft, FLAGS.knowsSettings)) return;
  if (!hasAllThreePieces(draft)) return;

  draft.flags[FLAGS.knowsSettings] = true;
  events.push({
    kind: 'narration',
    text:
      'You stand back from the panel with the drawing on your left and the slate on your right ' +
      'and you work it out, and it takes you a long time, and none of it is clever.\n\n' +
      'Caraway stood in the low one and came out of the hole he went in by. The crew wrote that ' +
      'down as *it does nothing*, and they were being careful rather than stupid: from where ' +
      'they are standing, that is precisely what it does.\n\n' +
      'But you came into this century on a lamp at that height. You crouched in a dished alcove ' +
      'with your knee on the stone and you came out *here*.\n\n' +
      'So the heights are not distances. They are not *back* and *further back*. They are ' +
      'places — the same three places, whichever one of them you happen to be standing in — ' +
      'and that is why the low one did nothing for Caraway and everything for you.\n\n' +
      'Which means one of these three is home.\n\n' +
      'It is not the low one; the low one is this. The middle one is a chalk ellipse on rough ' +
      'rock that nobody is going to cut this season.\n\n' +
      'That leaves the high one, and there is no possible way to find out what the high one is ' +
      'except to stand a lamp in it and go.',
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.settings',
        text:
          'The three heights are places, not distances — the same three from any of them. The ' +
          'low one is this century, which is why it did nothing for the man who tried it and ' +
          'everything for me. One of the other two must be home. The middle has no dish. That ' +
          'leaves the high one, and no way to know what it is without using it.',
      },
    ]),
    events
  );
  setObjective(draft, OBJECTIVES.settings, events);
}

/* ------------------------------------------------------------------ *
 * Standing the lamp somewhere
 * ------------------------------------------------------------------ */

/**
 * Putting the lantern in a dish. Each refusal follows the room's own physical
 * description rather than a blanket "you cannot do that".
 */
export function placeLanternInDish(
  draft: Draft,
  dish: DishId,
  events: NarrativeEvent[]
): ResolveResult {
  if (dish === 'middle') {
    events.push({
      kind: 'failure',
      text:
        'There is nothing to put it in. You hold the lantern up against the chalk at the height ' +
        'of your own chest and there is no seat, no lip and no level: the rock behind the ' +
        'ellipse is as the quarry left it, and the base of the lantern rests on two high points ' +
        'and rocks on them.\n\n' +
        'You try it anyway, with your hand under it, because you have to. It sits where you ' +
        'hold it and nowhere else, and holding a lamp is not the same as a dish holding one — ' +
        'the dishes are undercut and dressed to a depth you could not guess at, and this is a ' +
        'chalk line drawn round the idea of one.\n\n' +
        'The panel does nothing. There is no pressure, no held note, nothing in your teeth.',
    });
    return commit(draft, events, false);
  }

  if (dish === 'low') {
    draft.flags[FLAGS.triedLowDish] = true;
    events.push({
      kind: 'narration',
      text:
        'You crouch and set the lantern into the low dish, and it seats itself with the small ' +
        'rock you have felt once before in your life, in a chamber a hundred years from here.\n\n' +
        'The panel answers. It is unmistakable and it is exactly what it was: pressure in the ' +
        'back of your teeth, the hinges of your jaw, a held note you cannot hear.\n\n' +
        'You put your head and shoulder into the half-cut aperture.\n\n' +
        'On the far side is this chamber. The basket of cold chisels, the trestle, the drawing ' +
        'on the wall with four iron nails in it. The same unfinished third wall. You are ' +
        'looking at the room you are standing in, from a thumb inside its own wall, and the ' +
        'longer you look the more certain you are that it is not a reflection.\n\n' +
        'Caraway came out of the hole he went in by. Of course he did.\n\n' +
        'You take the lantern back out.',
    });
    journalEvents(
      addJournal(draft, [
        {
          id: 'j.low_dish',
          text:
            'Used the low dish. It answers, and it comes out in this same chamber, in this same ' +
            'season. Exactly what the crew wrote down. It is not a way home.',
        },
      ]),
      events
    );
    return commit(draft, events, true);
  }

  // high
  if (!f(draft, FLAGS.knowsSettings)) {
    events.push({
      kind: 'failure',
      text:
        'You get the trestle under the high dish and stand on it with the lantern in both ' +
        'hands, and then you stop, because you do not know what you are doing.\n\n' +
        'Three dishes, two cut, and a man who went into one of them and came out of the same ' +
        'hole. There is a drawing on that wall and a slate beside it and you have not sat down ' +
        'with either of them properly, and this is not a thing to guess at while standing on a ' +
        'trestle.\n\n' +
        'You get down.',
    });
    return commit(draft, events, false);
  }

  removeFromInventory(draft, 'lantern');
  draft.placements['lantern'] = { kind: 'fixture', fixtureId: 'worksite.highdish' };
  draft.flags[FLAGS.lanternInHighDish] = true;
  events.push({
    kind: 'success',
    text:
      'You drag the trestle under the high dish, climb up with the lantern held against your ' +
      'chest, and set it into the socket at the full stretch of your arms.\n\n' +
      'It seats with the same small rock. Whoever dressed these cut all three for the same ' +
      'object.' +
      (f(draft, FLAGS.lanternLit)
        ? '\n\nThe panel answers. The pressure arrives in your jaw and stays there.'
        : '\n\nThe wick is cold. Nothing happens, and nothing is going to until it is lit.'),
  });
  return commit(draft, events, true);
}

/* ------------------------------------------------------------------ *
 * Going
 * ------------------------------------------------------------------ */

/** Why the aperture will not take the hero yet, or null when it will. */
export function apertureRefusal(state: GameState): string | null {
  if (!f(state, FLAGS.recitedProphecy)) {
    return (
      'You stand in front of the half-cut aperture with your hand flat on the thinned panel, ' +
      'and you do not do it.\n\n' +
      'Down in that square there is a woman on a plank who stopped working to ask you a ' +
      'straight question, and a boy who wanted to know if it was a poem, and you have not ' +
      'answered either of them. Whatever is on the other side of this stone, you are not going ' +
      'through it with that still owed.'
    );
  }
  if (!f(state, FLAGS.knowsSettings)) {
    return (
      'You put your shoulder into the opening and the rock is a thumb from your face, and ' +
      'there is nothing in the air at all.\n\n' +
      'It is a hole that stops. Something has to be standing in one of those dishes, and you ' +
      'have not understood the dishes yet.'
    );
  }
  if (!f(state, FLAGS.lanternInHighDish)) {
    return (
      'Nothing is standing in the high dish, and the panel is just a panel: cold, thin, and a ' +
      'thumb of hill behind it.'
    );
  }
  if (!f(state, FLAGS.lanternLit)) {
    return (
      'The lantern is up in the high dish and the wick is dark, and the aperture is a hole in ' +
      'a wall with rock behind it.\n\n' +
      'It was never the lamp. It was the light.'
    );
  }
  return null;
}

/**
 * The second crossing, and the arrival. One commit: era, chapter, location,
 * carried items, objective, journal, the end-of-content marker and the
 * checkpoint all move together, so no reload can catch the transition halfway
 * and no reload can fire the arrival twice.
 */
export function enterAperture(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  const refusal = apertureRefusal(draft);
  if (refusal !== null) {
    events.push({ kind: 'failure', text: refusal });
    return commit(draft, events, false);
  }

  // The lamp comes out of the dish and into the hero's hands as they go: it is
  // the one thing they cannot leave behind, and the chapter after this needs it.
  draft.flags[FLAGS.lanternInHighDish] = false;
  giveItem(draft, 'lantern');

  draft.flags[FLAGS.crossedForward] = true;
  draft.chapter = 'future';
  draft.pending = null;

  events.push({ kind: 'narration', text: CROSSING_FORWARD });

  draft.locationId = DISH_DESTINATION.high;
  draft.era = 'future';
  discover(draft, ['futuredeep.basin', 'futuredeep.stair', 'futuredeep.tear']);
  if (!draft.visited.includes('future.deep_chamber')) draft.visited.push('future.deep_chamber');

  events.push({ kind: 'narration', text: FUTURE_ARRIVAL });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.crossed_forward',
        text:
          'I used the high dish. It was not home. The chamber is broken, the basin has been ' +
          'dry for a very long time, the stair is closed by a fall, and the hill has torn ' +
          'itself open above the rim with daylight the wrong colour coming through it.',
      },
    ]),
    events
  );

  setObjective(draft, OBJECTIVES.future, events);
  draft.ended = true;
  events.push({ kind: 'system', text: END_OF_CONTENT });
  return commit(draft, events, true);
}
