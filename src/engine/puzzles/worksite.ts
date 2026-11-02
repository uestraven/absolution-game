import type { GameState, NarrativeEvent, ResolveResult } from '../types';
import { FLAGS } from '../../content/flags';
import { m } from '../../content/markup';
import { CROSSING_FORWARD, FUTURE_ARRIVAL, OBJECTIVES } from '../../content/text';
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
 * at.
 *
 * The conclusion is the hero's, and it is a **working conclusion from thin
 * evidence** — one arrival of their own and one sentence on somebody else's
 * slate. The prose has to stay inside that: it is the best thing that fits
 * what they have, and it is not knowledge. They have no way to check it and
 * nobody to check it with, and they say so to themselves before they act on it.
 */
export function noteSettings(draft: Draft, events: NarrativeEvent[]): void {
  if (f(draft, FLAGS.knowsSettings)) return;
  if (!hasAllThreePieces(draft)) return;

  draft.flags[FLAGS.knowsSettings] = true;
  events.push({
    kind: 'narration',
    text:
      'You sit down on the trestle with the drawing on one side of you and the slate on the ' +
      'other, and you try to make the two of them agree. It takes a long time and none of it ' +
      'is clever.\n\n' +
      'Here is everything you have. Caraway stood in the low one and came out of the hole he ' +
      'went in by, and the crew wrote that down as *it does nothing* — and they were being ' +
      'careful rather than stupid, because from where they are standing that is exactly what ' +
      'it does. And you came into this century on a lamp at that height: crouched at a dished ' +
      'alcove with your knee on the stone, and you came out *here*.\n\n' +
      'One arrival, and one man\'s sentence about another man. That is the whole of it, and you ' +
      'are not going to pretend to yourself that it is much.\n\n' +
      'But if the heights were *distances* — back, and further back again — then the low one ' +
      'ought to have taken Caraway somewhere, and it did not take him anywhere at all.\n\n' +
      'So perhaps they are not distances. Perhaps each height is a ' + m('place') + ' — the ' +
      'same place every time, whoever lights it, and whenever. That would account for the low ' +
      'one doing nothing for him and everything for you, and you sit there a while longer and ' +
      'cannot think of anything else that would.\n\n' +
      'It is a guess. You make yourself say that, because there is nobody down here to say it ' +
      'to you: it is the best thing that fits, and fitting is not the same as being so.\n\n' +
      'If you have it right, one of these three is home.\n\n' +
      'And if you have it right, it is not the low one, because the low one is this. The middle ' +
      'one is a chalk ellipse on rough rock that nobody is going to cut this season.\n\n' +
      'Which leaves the high one — and there is no way to find out what the high one is, or ' +
      'whether any of this holds together at all, except to stand a lamp in it and go.',
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.settings',
        text:
          'Best I can work out, off one arrival and one line on a slate, so it is a guess: the ' +
          'three heights may not be distances but places — the same place each time, whoever ' +
          'lights it. That would explain why the low one did nothing for the man who tried it ' +
          'and everything for me. If I have it right, one of the other two is home; the low one ' +
          'is this, and the middle has no dish. Which leaves the high one, and no way to check ' +
          'any of it without using it.',
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
    /*
     * A real placement, like the other two: the lamp leaves the hero's hands,
     * and the panel only answers if it is actually lit. Going through is a
     * separate explicit action — standing a light somewhere has never moved
     * anybody in this game and does not start here.
     */
    removeFromInventory(draft, 'lantern');
    draft.placements['lantern'] = { kind: 'fixture', fixtureId: 'worksite.lowdish' };
    draft.flags[FLAGS.lanternInLowDish] = true;
    events.push({
      kind: 'success',
      text:
        'You crouch and set the lantern into the low dish, and it seats itself with the small ' +
        'rock you have felt once before in your life, in a chamber a hundred years from here.' +
        (f(draft, FLAGS.lanternLit)
          ? '\n\nThe panel answers. It is unmistakable and it is exactly what it was: pressure ' +
            'in the back of your teeth, the hinges of your jaw, a held note you cannot hear.'
          : '\n\nThe wick is cold. The panel is a panel, and a dark lamp in a dish does what a ' +
            'dark lamp in an alcove did, which is nothing.'),
    });
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

/**
 * The harmless round trip.
 *
 * The low position reaches year −100, and from year −100 that is this chamber,
 * in this season — which is exactly what the crew wrote down about it, and the
 * hero's best evidence that the heights are places rather than distances.
 *
 * Costs nothing, confirms nothing anybody has to take on trust, and puts the
 * lamp back in the hero's hands.
 */
export function stepThroughLowDish(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  draft.flags[FLAGS.triedLowDish] = true;
  draft.flags[FLAGS.lanternInLowDish] = false;
  giveItem(draft, 'lantern');
  events.push({
    kind: 'narration',
    text:
      'You put your head and shoulder into the half-cut aperture.\n\n' +
      'On the far side is this chamber. The basket of cold chisels, the trestle, the drawing on ' +
      'the wall with four iron nails in it. The same unfinished third wall. You are looking at ' +
      'the room you are standing in, from a thumb inside its own wall, and the longer you look ' +
      'the more certain you are that it is not a reflection.\n\n' +
      'Caraway came out of the hole he went in by. Of course he did.\n\n' +
      'You take the lantern back out of the dish.',
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.low_dish',
        text:
          'Used the low dish. It answers, and it comes out in this same chamber in this same ' +
          'season. Exactly what the crew wrote down. It is not a way home.',
      },
    ]),
    events
  );
  return commit(draft, events, true);
}

/**
 * Why the aperture will not take the hero yet, or null when it will.
 *
 * The first refusal is about the square, and it has to know which square it is
 * talking about. Having been asked a straight question and not answered it is
 * a different thing from having found out nobody here has heard the words, and
 * both are different from never having raised it at all — and a player can
 * reach this panel in any of those three states, because worksite access does
 * not run through Saffra.
 */
export function apertureRefusal(state: GameState): string | null {
  if (!f(state, FLAGS.recitedProphecy)) {
    const preamble =
      'You stand in front of the half-cut aperture with your hand flat on the thinned panel, ' +
      'and you do not do it.\n\n';

    // They asked. The hero is holding an answer and walking away from it.
    if (f(state, FLAGS.askedForWords)) {
      return (
        preamble +
        'Down in that square there is a woman who came down off a wet course to ask you a ' +
        'straight question, and a boy who wanted to know whether it was a poem, and they are ' +
        'both still waiting on you.\n\n' +
        'Whatever is on the other side of this stone, you are not going through it owing them ' +
        'that.'
      );
    }

    // They have not asked, but the hero knows the words are not here yet, and
    // walked away from that rather than following it.
    if (f(state, FLAGS.heardNoProphecy)) {
      return (
        preamble +
        'You asked a woman on a plank whether she had ever heard of the ' +
        m('Wanderer') +
        ', and watched the word land on her and find nothing to land on, and then you let the ' +
        'conversation move on to trowels.\n\n' +
        'You have been carrying that around all day without looking straight at it. It is the ' +
        'only thing you have found down here that nobody can explain to you, and you are about ' +
        'to put a hundred years of hill between yourself and the one person who noticed you ' +
        'asking.\n\n' +
        'Not yet. Go back down and finish the conversation.'
      );
    }

    // Nobody has discussed it at all. The hero does not actually know whether
    // these people keep the words, and has not thought to find out.
    return (
      preamble +
      'You have spent a day in a village that is your village, among people who are not your ' +
      'people, and you have talked to them about water and chalk lines and whose tree it is.\n\n' +
      'And you have not once asked them the thing you grew up with. You have no idea whether ' +
      'there is a plank by that well in their year, or a cord of lanterns, or a night in ' +
      'midwinter when somebody reads something out. You never asked, because it did not occur ' +
      'to you that it was a question.\n\n' +
      'Go down and find out. Whatever is behind this panel can wait the length of a ' +
      'conversation.'
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
  // The low position goes somewhere, and that somewhere is here. Handled
  // before the refusals, because taking it is a success and not a mistake.
  if (f(draft, FLAGS.lanternInLowDish) && f(draft, FLAGS.lanternLit)) {
    return stepThroughLowDish(draft, events);
  }
  if (f(draft, FLAGS.lanternInLowDish)) {
    events.push({
      kind: 'failure',
      text:
        'The lamp is in the low dish and the wick is dark, and the aperture is a hole with a ' +
        'thumb of hill behind it.',
    });
    return commit(draft, events, false);
  }
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

  /*
   * No end-of-content marker here any more. This used to be where the build
   * stopped; the chapter carries on, so the arrival sets the objective the
   * hero actually has — get out of this hill and find out where you are — and
   * nothing else.
   */
  setObjective(draft, OBJECTIVES.future, events);
  return commit(draft, events, true);
}
