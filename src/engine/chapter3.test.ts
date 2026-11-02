import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CROSS_FIRST,
  FENN_ROUTE,
  FUTURE_TO_SQUARE,
  GATHER_EVIDENCE,
  GO_FORWARD,
  OPEN_THE_SEAL,
  PAST_TO_SQUARE,
  READ_PANEL,
  RECITE,
  SAFFRA_REALISATION,
  SOLVE_RELIEF,
  TO_SEALED,
  begin,
  finishChapterThree,
  hasReturned,
  lastText,
  progressOf,
  type,
  typeAll,
} from '../testing/harness';
import { resolve } from './reducer';
import { getAffordances } from './affordances';
import { FLAGS } from '../content/flags';
import { PROPHECY_LINES } from '../content/prophecy';
import { OBJECTIVES } from '../content/text';
import { OBJECTS } from '../content/objects';
import { stripMarkup } from '../content/markup';
import { hintContext, nextHint } from '../content/hints';
import { importFromText, loadBest, readSlot, serialize, writeAutosave, writeCheckpoint } from '../persistence/storage';
import { validateSave } from '../persistence/validate';
import type { GameState } from './types';

/**
 * Chapter 3: the ruined century, the evidence, the seal, and the way back.
 */

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

/** Standing on the floor of the broken chamber, just arrived. */
function arrived(): GameState {
  return typeAll(begin(), [
    ...TO_SEALED,
    ...SOLVE_RELIEF,
    ...CROSS_FIRST,
    ...PAST_TO_SQUARE,
    ...SAFFRA_REALISATION,
    'leave',
    ...RECITE,
    ...FENN_ROUTE,
    ...READ_PANEL,
    ...GO_FORWARD,
  ]);
}

/** In the settlement, with every source read and the tools in hand. */
function informed(): GameState {
  return typeAll(arrived(), [...FUTURE_TO_SQUARE, ...GATHER_EVIDENCE, 'examine shell', 'take maul']);
}

/* ================================================================ *
 * 1. Getting out, and the geography
 * ================================================================ */

describe('the hill is two spaces and the seal guards the one that matters', () => {
  it('reaches the settlement through the tear without touching the seal', () => {
    const out = typeAll(arrived(), FUTURE_TO_SQUARE);
    expect(out.locationId).toBe('future.square');
    expect(out.flags[FLAGS.leftTheHill]).toBe(true);
    expect(out.flags[FLAGS.sealOpened]).toBeUndefined();
    expect(out.objective).toBe(OBJECTIVES.settlement);
  });

  it('cannot get to the portal chamber round the back of the seal', () => {
    const inside = arrived();
    // The stair the hero walked twice is closed, and pulling at it says why.
    const stair = type(inside, 'clear stair');
    expect(stair.accepted).toBe(false);
    expect(stair.state.locationId).toBe('future.deep_chamber');

    // No exit toward the chamber exists from this side, typed or dispatched.
    for (const guess of ['west', 'down', 'sealed chamber', 'to_sealed', 'future.sealed_chamber']) {
      const tried = type(inside, `go ${guess}`);
      expect(tried.state.locationId, guess).toBe('future.deep_chamber');
    }
    const direct = resolve(inside, { type: 'GO', target: 'to_sealed' });
    expect(direct.accepted).toBe(false);

    // And from the hillside, the way in is shut until the seal is down.
    const outside = typeAll(inside, ['up', 'west']);
    expect(outside.locationId).toBe('future.entrance');
    expect(getAffordances(outside).exits.some((e) => e.key === 'exit-to_sealed')).toBe(false);
    expect(type(outside, 'west').state.locationId).toBe('future.entrance');
  });

  it('opens the seal onto the chamber that actually holds the middle dish', () => {
    const opened = typeAll(informed(), ['reflect', ...OPEN_THE_SEAL]);
    expect(opened.flags[FLAGS.sealOpened]).toBe(true);
    const inside = typeAll(opened, ['west']);
    expect(inside.locationId).toBe('future.sealed_chamber');
    expect(getAffordances(inside).objects.map((o) => o.id)).toContain('futuresealed.fill');
  });

  it('leaves the seal open, and the way back and forth working', () => {
    const opened = typeAll(informed(), ['reflect', ...OPEN_THE_SEAL, 'west']);
    const wandered = typeAll(opened, ['east', 'east', 'east', 'west', 'west', 'west']);
    expect(wandered.locationId).toBe('future.sealed_chamber');
    expect(wandered.flags[FLAGS.sealOpened]).toBe(true);
  });
});

/* ================================================================ *
 * 2. The investigation
 * ================================================================ */

describe('responsibility is inferred from separate sources, never explained', () => {
  it('needs all four sources, in whatever order the player finds them', () => {
    const orders: Array<[string, string[]]> = [
      [
        'memorial first',
        [
          'examine memorial',
          'journal',
          'talk to rue',
          'what she is sitting against',
          'the oldest thing she knows',
          'leave',
          'examine account',
        ],
      ],
      [
        'journal first',
        [
          'journal',
          'talk to rue',
          'what she is sitting against',
          'leave',
          'examine account',
          'talk to rue',
          'the oldest thing she knows',
          'leave',
          'examine memorial',
        ],
      ],
    ];

    for (const [name, order] of orders) {
      const square = typeAll(arrived(), FUTURE_TO_SQUARE);
      const done = typeAll(square, order);
      expect(done.flags[FLAGS.readAccount], name).toBe(true);
      expect(done.flags[FLAGS.readMemorial], name).toBe(true);
      expect(done.flags[FLAGS.heardMissingChild], name).toBe(true);
      expect(done.flags[FLAGS.checkedJournal], name).toBe(true);
      const concluded = type(done, 'reflect');
      expect(concluded.accepted, name).toBe(true);
      expect(concluded.state.flags[FLAGS.knowsResponsibility], name).toBe(true);
    }
  });

  it('refuses the inference while anything is missing, and says what', () => {
    const square = typeAll(arrived(), FUTURE_TO_SQUARE);
    const partial = typeAll(square, ['examine memorial', 'journal']);
    const tooSoon = type(partial, 'reflect');
    expect(tooSoon.accepted).toBe(false);
    expect(tooSoon.state.flags[FLAGS.knowsResponsibility]).toBeUndefined();
    // Not an invisible checklist: the hero names what they have not read.
    expect(lastText(tooSoon)).toContain('Account');
    // And it is not offered as an action in selectable mode yet either.
    expect(getAffordances(partial).meta.some((m) => m.key === 'reflect')).toBe(false);
  });

  it('fires once and keeps every source readable afterwards', () => {
    const concluded = typeAll(informed(), ['reflect']);
    expect(concluded.journal.filter((e) => e.id === 'j.responsibility')).toHaveLength(1);

    const again = typeAll(concluded, ['reflect', 'reflect']);
    expect(again.journal.filter((e) => e.id === 'j.responsibility')).toHaveLength(1);

    for (const line of ['examine account', 'examine memorial', 'journal']) {
      expect(type(again, line).accepted, line).toBe(true);
    }
    const re = typeAll(again, ['talk to rue', 'the oldest thing she knows']);
    expect(re.transcript.map((e) => e.text).join('\n')).toContain('did not come out');
  });

  it('never explains the mechanism, anywhere in the chapter', () => {
    const end = finishChapterThree(arrived()).state;
    const readable = end.transcript.map((e) => stripMarkup(e.text)).join('\n');
    for (const pattern of [
      /paradox/i,
      /paradoxical/i,
      /space-?time/i,
      /causal/i,
      /causality/i,
      /timeline/i,
      /the rupture/i,
      /tore a hole/i,
      /because you travelled/i,
    ]) {
      expect(readable, `player-facing text matches ${pattern}`).not.toMatch(pattern);
    }
    // The one person who keeps the records says outright that she does not know.
    const asked = typeAll(end, []);
    expect(asked.journal.some((e) => e.id === 'j.responsibility')).toBe(true);
  });

  it('marks the Account\'s out-of-the-hill claim as commentary, not a sighting', () => {
    const asked = typeAll(informed(), ['talk to rue', 'what she thinks came']);
    const text = asked.transcript.map((e) => stripMarkup(e.text)).join('\n');
    expect(text).toContain('That is in the commentary, not the words');
    expect(text).toContain('Nobody saw anything come out of anywhere');
  });

  it('keeps the canonical text identical in all three places it appears', () => {
    const state = informed();
    const plank = stripMarkup(OBJECTS['square.plank']!.description(state));
    const account = stripMarkup(OBJECTS['futuresquare.account']!.description(state));
    const spoken = stripMarkup(state.transcript.map((e) => e.text).join('\n'));
    for (const line of PROPHECY_LINES) {
      expect(plank, `plank: ${line}`).toContain(line);
      expect(account, `account: ${line}`).toContain(line);
      expect(spoken, `recitation: ${line}`).toContain(line);
    }
  });

  it('will not let the hero go home without a reason to', () => {
    // Everything done except the thinking.
    const square = typeAll(arrived(), [...FUTURE_TO_SQUARE, ...GATHER_EVIDENCE, 'examine shell', 'take maul']);
    expect(square.flags[FLAGS.knowsResponsibility]).toBeUndefined();
    const opened = typeAll(square, [...OPEN_THE_SEAL, 'west', 'examine fill', 'clear fill']);
    const stood = type(opened, 'place lantern in middle dish');
    expect(stood.accepted).toBe(true);
    const refused = type(stood.state, 'enter aperture');
    expect(refused.accepted).toBe(false);
    expect(refused.state.chapter).toBe('future');
    expect(lastText(refused)).toContain('not finished with either of them');
  });
});

/* ================================================================ *
 * 3. The world beyond the valley
 * ================================================================ */

describe('the catastrophe is bigger than the valley and nobody has seen all of it', () => {
  it('separates what inhabitants witnessed from what they inherited', () => {
    const asked = typeAll(informed(), [
      'talk to rue',
      'the writing from other places',
      'leave',
      'west',
      'west',
      'talk to sorrel',
      'what is left anywhere else',
    ]);
    const text = asked.transcript.map((e) => stripMarkup(e.text)).join('\n');
    // Rue has documents from elsewhere; Sorrel has been as far as she has been.
    expect(text).toContain('Eleven places wrote to us');
    expect(text).toContain("I've been to the water and the burnt place and that's it");
    // Nobody claims to know the state of everywhere.
    expect(text).toContain('I do not know about the other');
  });

  it('shows the settlement living rather than waiting to explain things', () => {
    const square = typeAll(arrived(), FUTURE_TO_SQUARE);
    const described = stripMarkup(type(square, 'look').events.map((e) => e.text).join('\n'));
    for (const sign of ['hand pump', 'queuing', 'patched', 'mending']) {
      expect(described, `the square should show ${sign}`).toContain(sign);
    }
    expect(stripMarkup(lastText(type(square, 'examine well')))).toContain('tally stick');
  });

  it('gives the hero one impossible thing to watch, and no account of it', () => {
    const hill = typeAll(arrived(), ['up']);
    const bird = type(hill, 'examine bird');
    expect(bird.accepted).toBe(true);
    expect(bird.state.flags[FLAGS.sawFutureSymptom]).toBe(true);
    const text = stripMarkup(lastText(bird));
    expect(text).toContain('Same line');
    for (const pattern of [/because/i, /which means/i, /explains/i]) {
      expect(text, `the bird text matches ${pattern}`).not.toMatch(pattern);
    }
  });
});

/* ================================================================ *
 * 4. The seal, and the eye
 * ================================================================ */

describe('the seal comes down once, and takes an eye with it', () => {
  function atTheMouth(): GameState {
    return typeAll(informed(), ['reflect', 'west', 'west']);
  }

  it('answers every wrong way at it without costing anything', () => {
    const start = atTheMouth();

    // Hands alone.
    const bare = typeAll(start, ['drop mallet']);
    const hands = type(bare, 'break seal');
    expect(hands.accepted).toBe(false);
    expect(lastText(hands)).toContain('not going to do this with your hands');

    // Armed, but no idea where.
    const armed = typeAll(bare, ['take mallet']);
    const blind = type(armed, 'break seal');
    expect(blind.accepted).toBe(false);
    expect(lastText(blind)).toContain('one bad course');

    // Knows where, has not braced it.
    const knows = typeAll(armed, [
      'talk to sorrel',
      'why the hill is walled up',
      'whether the wall is as good as it looks',
      'leave',
    ]);
    const unbraced = type(knows, 'break seal');
    expect(unbraced.accepted).toBe(false);
    expect(unbraced.state.flags[FLAGS.sealSettled]).toBe(true);
    expect(unbraced.state.flags[FLAGS.sealOpened]).toBeUndefined();
    expect(unbraced.state.flags[FLAGS.lostEye]).toBeUndefined();

    // Nothing has been consumed, and the route is still open.
    expect(unbraced.state.inventory).toEqual(expect.arrayContaining(['mallet', 'wedge']));
    const end = typeAll(unbraced.state, ['use wedge on seal', 'break seal', 'break seal']);
    expect(end.flags[FLAGS.sealOpened]).toBe(true);
  });

  it('lets the hero take the wedge back out before the wall comes down', () => {
    const braced = typeAll(atTheMouth(), [
      'talk to sorrel',
      'why the hill is walled up',
      'whether the wall is as good as it looks',
      'leave',
      'use wedge on seal',
    ]);
    expect(braced.flags[FLAGS.coursePropped]).toBe(true);
    const back = type(braced, 'take wedge');
    expect(back.accepted).toBe(true);
    expect(back.state.inventory).toContain('wedge');
    expect(back.state.flags[FLAGS.coursePropped]).toBe(false);
  });

  it('refuses permission without blocking the way', () => {
    const asked = typeAll(informed(), ['talk to rue', 'asking to open the hill']);
    expect(asked.flags[FLAGS.askedRue]).toBe(true);
    expect(lastText(type(asked, 'look')).length).toBeGreaterThan(0);
    const end = typeAll(asked, ['leave', 'reflect', ...OPEN_THE_SEAL]);
    expect(end.flags[FLAGS.sealOpened]).toBe(true);
  });

  it('takes the eye once, in the right place, with witnesses', () => {
    const opened = typeAll(informed(), ['reflect', ...OPEN_THE_SEAL]);
    expect(opened.locationId).toBe('future.entrance');
    expect(opened.flags[FLAGS.lostEye]).toBe(true);
    expect(opened.flags[FLAGS.eyeTreated]).toBe(true);
    expect(opened.flags[FLAGS.namedWanderer]).toBe(true);
    expect(opened.journal.filter((e) => e.id === 'j.lost_eye')).toHaveLength(1);

    const text = stripMarkup(opened.transcript.map((e) => e.text).join('\n'));
    // The stone arrives before the sound of the fall. Observed, not argued.
    expect(text).toContain('The fall it came out of starts afterwards');
    // Treated, by somebody, without interrogation.
    expect(text).toContain('nobody has asked');
    // Named by a witness, out of what they believe.
    expect(text).toContain('he says a word');
  });

  it('does not replay the injury on a revisit, a second swing or a reload', () => {
    const opened = typeAll(informed(), ['reflect', ...OPEN_THE_SEAL]);
    const again = typeAll(opened, ['break seal', 'east', 'west', 'look', 'break seal']);
    expect(again.journal.filter((e) => e.id === 'j.lost_eye')).toHaveLength(1);
    expect(again.flags[FLAGS.lostEye]).toBe(true);

    expect(writeAutosave(again).working).toBe(true);
    const reloaded = loadBest().state!;
    expect(progressOf(reloaded)).toEqual(progressOf(again));
    expect(reloaded.flags[FLAGS.lostEye]).toBe(true);
    const after = typeAll(reloaded, ['look', 'break seal']);
    expect(after.journal.filter((e) => e.id === 'j.lost_eye')).toHaveLength(1);
  });

  it('cannot be triggered by experimenting, only by solving it', () => {
    const start = atTheMouth();
    const poking = typeAll(start, [
      'examine seal',
      'examine mark',
      'break seal',
      'break mark',
      'use mallet on mark',
      'break seal',
      'clear seal',
      'wait',
    ]);
    expect(poking.flags[FLAGS.lostEye]).toBeUndefined();
    expect(poking.flags[FLAGS.sealOpened]).toBeUndefined();
  });

  it('changes what people say without making everything about the eye', () => {
    const opened = typeAll(informed(), ['reflect', ...OPEN_THE_SEAL]);
    const sorrel = typeAll(opened, ['talk to sorrel', 'what she saw']);
    expect(sorrel.transcript.map((e) => e.text).join('\n')).toContain('The stone came first');

    const rue = typeAll(opened, ['east', 'east', 'talk to rue', 'what she is looking at']);
    expect(rue.flags[FLAGS.namedWanderer]).toBe(true);
    const text = stripMarkup(rue.transcript.map((e) => e.text).join('\n'));
    expect(text).toContain('cannot tell you it does not fit');
    // Her own judgement, not the narration certifying a monster.
    expect(text).toContain('did not promise');

    // Other topics are still themselves.
    const ordinary = typeAll(rue, ['the writing from other places']);
    expect(ordinary.transcript.map((e) => e.text).join('\n')).toContain('Eleven places');
  });

  it('will not let the hero go back without something heavy', () => {
    const ready = typeAll(informed(), [
      'reflect',
      ...OPEN_THE_SEAL,
      'west',
      'examine fill',
      'clear fill',
      'place lantern in middle dish',
    ]);
    expect(ready.inventory).toContain('mallet');

    // Put it down in this very room and try to leave.
    const empty = typeAll(ready, ['drop mallet']);
    expect(empty.inventory).not.toContain('mallet');
    const refused = type(empty, 'enter aperture');
    expect(refused.accepted).toBe(false);
    expect(refused.state.chapter).toBe('future');
    // Motivated, and specific about what it is for.
    expect(lastText(refused)).toContain('One worked pillar');
    expect(lastText(refused)).toContain('Go and get something heavy');

    // Recoverable where it was dropped, in both modes.
    const listed = getAffordances(empty).objects.find((o) => o.id === 'mallet');
    expect(listed).toBeDefined();
    const back = resolve(empty, listed!.actions.find((a) => a.label === 'Take')!.action);
    expect(back.state.inventory).toContain('mallet');
    expect(type(back.state, 'enter aperture').accepted).toBe(true);
  });

  it('lets the hero fetch it back from anywhere in the century', () => {
    const ready = typeAll(informed(), [
      'reflect',
      ...OPEN_THE_SEAL,
      'west',
      'examine fill',
      'clear fill',
      'place lantern in middle dish',
    ]);
    // Left on the floor of the basin chamber, three rooms and a climb away.
    const stranded = typeAll(ready, ['east', 'east', 'in', 'drop mallet']);
    expect(stranded.locationId).toBe('future.deep_chamber');
    const walked = typeAll(stranded, ['up', 'west', 'west']);
    expect(type(walked, 'enter aperture').accepted).toBe(false);

    const fetched = typeAll(walked, ['east', 'east', 'in', 'take mallet', 'up', 'west', 'west']);
    expect(fetched.inventory).toContain('mallet');
    expect(fetched.locationId).toBe('future.sealed_chamber');
    const gone = type(fetched, 'enter aperture');
    expect(gone.accepted).toBe(true);
    expect(gone.state.chapter).toBe('return');
  });

  it('substitutes both tools for a hero who left them behind', () => {
    // Crossing with neither the mallet nor the wedge in hand.
    const bare = typeAll(begin(), [
      ...TO_SEALED,
      ...SOLVE_RELIEF,
      'take lantern',
      'down',
      'enter threshold',
      ...PAST_TO_SQUARE,
      ...SAFFRA_REALISATION,
      'leave',
      ...RECITE,
      ...FENN_ROUTE,
      ...READ_PANEL,
      ...GO_FORWARD,
    ]);
    expect(bare.inventory).not.toContain('wedge');
    expect(bare.inventory).not.toContain('mallet');

    const end = finishChapterThree(bare);
    // Both substitutes were picked up along the way. The wedge itself ends up
    // under nine courses of stone, which is what a wedge is for.
    expect(end.lines).toContain('take maul');
    expect(end.lines).toContain('take blocks');
    expect(end.state.inventory).toContain('mallet');
    expect(end.state.placements['wedge']).toEqual({
      kind: 'room',
      locationId: 'future.entrance',
    });
    expect(hasReturned(end.state)).toBe(true);
  });
});

/* ================================================================ *
 * 5. The way home
 * ================================================================ */

describe('the middle position is the last guess the hero gets', () => {
  function atThePanel(): GameState {
    return typeAll(informed(), ['reflect', ...OPEN_THE_SEAL, 'west']);
  }

  it('needs the fill looked at before it comes off', () => {
    const inside = atThePanel();
    const blind = type(inside, 'clear fill');
    expect(blind.accepted).toBe(false);
    expect(blind.state.flags[FLAGS.fillCleared]).toBeUndefined();
    const looked = typeAll(inside, ['examine fill']);
    expect(looked.flags[FLAGS.examinedFill]).toBe(true);
    const cleared = type(looked, 'clear fill');
    expect(cleared.accepted).toBe(true);
    expect(cleared.state.flags[FLAGS.fillCleared]).toBe(true);
  });

  it('will not take a lamp into the dish while the fill is on it', () => {
    const inside = atThePanel();
    const early = type(inside, 'place lantern in middle dish');
    expect(early.accepted).toBe(false);
    expect(early.state.flags[FLAGS.lanternInMiddleDish]).toBeUndefined();
  });

  it('separates standing the lamp from going through, and needs it lit', () => {
    const ready = typeAll(atThePanel(), ['examine fill', 'clear fill']);

    // Put it out first, so the light is genuinely required.
    const dark = { ...ready, flags: { ...ready.flags, [FLAGS.lanternLit]: false } };
    const stood = type(dark, 'place lantern in middle dish');
    expect(stood.accepted).toBe(true);
    // Standing it moves nobody.
    expect(stood.state.locationId).toBe('future.sealed_chamber');
    expect(stood.state.chapter).toBe('future');

    const unlit = type(stood.state, 'enter aperture');
    expect(unlit.accepted).toBe(false);
    expect(unlit.state.chapter).toBe('future');
    expect(lastText(unlit)).toContain('It was never the lamp');

    const lit = type(stood.state, 'light lantern');
    expect(lit.state.flags[FLAGS.lanternLit]).toBe(true);
    // Lighting it moves nobody either.
    expect(lit.state.locationId).toBe('future.sealed_chamber');

    const gone = type(lit.state, 'enter aperture');
    expect(gone.accepted).toBe(true);
    expect(gone.state.locationId).toBe('present.sealed_chamber');
  });

  it('arrives in the original era, not by arithmetic and not at a chosen date', () => {
    const end = finishChapterThree(arrived()).state;
    expect(end.era).toBe('present');
    expect(end.chapter).toBe('return');
    expect(end.locationId).toBe('present.sealed_chamber');
    // There is no dial. Nothing in the chapter offers a date.
    const readable = end.transcript.map((e) => stripMarkup(e.text)).join('\n');
    for (const pattern of [/a hundred years back/i, /minus one hundred/i, /set the dial/i, /choose a year/i]) {
      expect(readable, `return text matches ${pattern}`).not.toMatch(pattern);
    }
    // And the hero still presents it as a guess.
    expect(readable).toContain('This is a guess');
  });

  it('keeps the lamp out of the dish and in the hero\'s hands afterwards', () => {
    const end = finishChapterThree(arrived()).state;
    expect(end.inventory).toContain('lantern');
    expect(end.flags[FLAGS.lanternInMiddleDish]).toBe(false);
  });
});

/* ================================================================ *
 * 6. The return, and the boundary
 * ================================================================ */

describe('the return is an arrival, and the last chapter runs from it', () => {
  function returned(): GameState {
    return finishChapterThree(arrived()).state;
  }

  it('commits the whole transition at once, and validates', () => {
    const state = returned();
    expect(state.chapter).toBe('return');
    expect(state.era).toBe('present');
    expect(state.locationId).toBe('present.sealed_chamber');
    expect(state.objective).toBe(OBJECTIVES.returned);
    // Not the end of anything: the confrontation starts here.
    expect(state.ended).toBe(false);
    expect(state.flags[FLAGS.finaleStage]).toBe('arrival');
    expect(state.flags[FLAGS.crossed]).toBe(true);
    expect(state.flags[FLAGS.crossedForward]).toBe(true);
    expect(state.flags[FLAGS.crossedBack]).toBe(true);
    expect(state.flags[FLAGS.lostEye]).toBe(true);
    expect(state.flags[FLAGS.knowsResponsibility]).toBe(true);
    expect(validateSave(JSON.parse(serialize(state))).ok).toBe(true);
  });

  it('does not read as the opening chapter starting again', () => {
    const state = returned();
    const described = stripMarkup(type(state, 'look').events.map((e) => e.text).join('\n'));
    // Their lamp is in the alcove and the hero's is in their hand. Not both.
    expect(described).toContain('a hooded lantern is standing level in the dish, lit');
    expect(described).toContain('Your own lantern is in your hand');
    expect(described).toContain('kneeling');
    // And the opening's own fixtures are not offered: they are somebody else's.
    const ids = getAffordances(state).objects.map((o) => o.id);
    expect(ids).not.toContain('sealed.alcove');
    expect(ids).not.toContain('sealed.shutter');
    expect(ids).toContain('returnsealed.lamp');
  });

  it('puts the earlier self in the room, and only on the return', () => {
    const state = returned();
    expect(getAffordances(state).people.map((p) => p.key)).toEqual(['talk-earlier_self']);

    // And not during the opening, in the same room.
    const opening = typeAll(begin(), TO_SEALED);
    expect(getAffordances(opening).people).toEqual([]);
    expect(type(opening, 'talk to them').accepted).toBe(false);
  });

  it('keeps their belongings out of the hero\'s inventory', () => {
    const state = returned();
    const before = [...state.inventory];
    const tried = typeAll(state, ['take their lantern', 'take lantern', 'examine their lantern']);
    expect(tried.inventory).toEqual(before);
    // One lantern record, and it is the hero's, carried.
    expect(tried.placements['lantern']).toEqual({ kind: 'carried' });
  });

  it('allows looking, reading and talking without advancing anything', () => {
    const state = returned();
    for (const line of ['look', 'journal', 'inventory', 'examine them', 'examine seam', 'examine pillar']) {
      expect(type(state, line).accepted, line).toBe(true);
    }
    const spoken = typeAll(state, ['talk to them', 'say nothing']);
    expect(spoken.transcript.map((e) => e.text).join('\n')).toContain(
      'The lamp goes on burning in the alcove'
    );
  });

  it('writes a checkpoint suitable for continuing from', () => {
    const before = typeAll(informed(), ['reflect', ...OPEN_THE_SEAL, 'west', 'examine fill', 'clear fill', 'place lantern in middle dish']);
    const crossing = type(before, 'enter aperture');
    expect(crossing.state.chapter).not.toBe(before.chapter);
    expect(writeCheckpoint(crossing.state).working).toBe(true);

    const stored = readSlot('checkpoint');
    expect(stored.error).toBeNull();
    expect(stored.state?.chapter).toBe('return');
    expect(stored.state?.locationId).toBe('present.sealed_chamber');
    expect(stored.state?.flags[FLAGS.lostEye]).toBe(true);
    expect(stored.state?.flags[FLAGS.knowsResponsibility]).toBe(true);
  });

  it('survives export and import with the injury and both crossings intact', () => {
    const state = returned();
    const round = importFromText(serialize(state));
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    expect(progressOf(round.state)).toEqual(progressOf(state));
    expect(round.state.flags[FLAGS.lostEye]).toBe(true);
    expect(round.state.chapter).toBe('return');
  });

  it('refuses an import that is incoherent about the injury or the crossings', () => {
    const state = returned();
    const cases: Array<[string, (d: Record<string, unknown>) => void, RegExp]> = [
      [
        'the eye back',
        (d) => delete (d.flags as Record<string, unknown>)[FLAGS.lostEye],
        /inconsistent about the seal and the injury/,
      ],
      [
        'returned without the reason',
        (d) => delete (d.flags as Record<string, unknown>)[FLAGS.knowsResponsibility],
        /returns without the reason/,
      ],
      [
        'returned without the crossing',
        (d) => {
          delete (d.flags as Record<string, unknown>)[FLAGS.crossedBack];
          d.ended = false;
        },
        /last crossing and its chapter disagree/,
      ],
      [
        // Back-dated to the opening with the ruined century still in its
        // history. Every crossing flag stripped, so the check under test is
        // the last line of defence rather than the first.
        'the opening with a broken seal in its history',
        (d) => {
          const flags = d.flags as Record<string, unknown>;
          d.chapter = 'rite';
          d.ended = false;
          delete flags[FLAGS.crossedBack];
          delete flags[FLAGS.crossedForward];
          delete flags[FLAGS.crossed];
          delete flags[FLAGS.finaleStage];
          delete flags[FLAGS.theirReach];
        },
        /era and its history disagree/,
      ],
    ];
    for (const [name, corrupt, expected] of cases) {
      const file = JSON.parse(serialize(state)) as Record<string, unknown>;
      corrupt(file);
      const result = validateSave(file);
      expect(result.ok, name).toBe(false);
      if (result.ok) continue;
      expect(result.error, name).toMatch(expected);
    }
  });
});

/* ================================================================ *
 * 7. Hints, and the low position M3 left half-done
 * ================================================================ */

describe('the chapter stays navigable', () => {
  it('points the hint ladder at the right part of the ruined century', () => {
    expect(hintContext(arrived())).toBe('future_out');
    const square = typeAll(arrived(), FUTURE_TO_SQUARE);
    expect(hintContext(square)).toBe('investigate');
    const knows = typeAll(informed(), ['reflect']);
    expect(hintContext(knows)).toBe('seal');
    const inside = typeAll(knows, [...OPEN_THE_SEAL, 'west']);
    expect(hintContext(inside)).toBe('home');
    // Across the last crossing, the ladder points at the person in the room.
    const end = typeAll(inside, [
      'examine fill',
      'clear fill',
      'place lantern in middle dish',
      'enter aperture',
    ]);
    expect(hintContext(end)).toBe('confront');
    expect(nextHint(end).text).toContain('is on a timer');
  });

  it('walks each ladder to the end without running out', () => {
    for (const state of [arrived(), typeAll(arrived(), FUTURE_TO_SQUARE), typeAll(informed(), ['reflect'])]) {
      let current = state;
      const seen: string[] = [];
      for (let i = 0; i < 5; i += 1) {
        const asked = type(current, 'hint');
        expect(asked.accepted).toBe(true);
        seen.push(lastText(asked));
        current = asked.state;
      }
      expect(seen[seen.length - 1]).toBe(seen[seen.length - 2]);
    }
  });

  it('makes the low position a real placement that needs a light', () => {
    const panel = typeAll(begin(), [
      ...TO_SEALED,
      ...SOLVE_RELIEF,
      ...CROSS_FIRST,
      ...PAST_TO_SQUARE,
      ...SAFFRA_REALISATION,
      'leave',
      ...RECITE,
      ...FENN_ROUTE,
      ...READ_PANEL,
    ]);

    // Dark: it seats, and nothing answers.
    const dark = { ...panel, flags: { ...panel.flags, [FLAGS.lanternLit]: false } };
    const stood = type(dark, 'place lantern in low dish');
    expect(stood.accepted).toBe(true);
    expect(stood.state.flags[FLAGS.lanternInLowDish]).toBe(true);
    // A real placement: it has left the hero's hands.
    expect(stood.state.inventory).not.toContain('lantern');
    expect(stood.state.placements['lantern']).toEqual({
      kind: 'fixture',
      fixtureId: 'worksite.lowdish',
    });
    expect(lastText(stood)).toContain('wick is cold');

    const unlit = type(stood.state, 'enter aperture');
    expect(unlit.accepted).toBe(false);
    expect(unlit.state.flags[FLAGS.triedLowDish]).toBeUndefined();

    // Lit, and then a separate deliberate step through.
    const lit = type(stood.state, 'light lantern');
    expect(lit.state.locationId).toBe('past.worksite');
    const through = type(lit.state, 'enter aperture');
    expect(through.accepted).toBe(true);
    expect(through.state.flags[FLAGS.triedLowDish]).toBe(true);
    expect(through.state.locationId).toBe('past.worksite');
    expect(through.state.inventory).toContain('lantern');
    // And it cost nothing: the high position still works afterwards.
    const end = typeAll(through.state, ['place lantern in high dish', 'enter aperture']);
    expect(end.locationId).toBe('future.deep_chamber');
  });

  it('recovers the lamp from the low dish without going through', () => {
    const stood = typeAll(begin(), [
      ...TO_SEALED,
      ...SOLVE_RELIEF,
      ...CROSS_FIRST,
      ...PAST_TO_SQUARE,
      ...SAFFRA_REALISATION,
      'leave',
      ...RECITE,
      ...FENN_ROUTE,
      ...READ_PANEL,
      'place lantern in low dish',
    ]);
    const back = type(stood, 'take lantern');
    expect(back.accepted).toBe(true);
    expect(back.state.inventory).toContain('lantern');
    expect(back.state.flags[FLAGS.lanternInLowDish]).toBe(false);
  });
});

/* ================================================================ *
 * 8. The optional stone
 * ================================================================ */

describe('the stone in the record chest', () => {
  it('is only there if the player actually gave it to Parsie', () => {
    const delivered = typeAll(begin(), [
      'take lantern',
      'down',
      'talk to parsie',
      'what he wants you to bring back',
      'leave',
      'west',
      'west',
      'in',
      'take stone',
      'out',
      'east',
      'east',
      'give stone to parsie',
    ]);
    expect(delivered.flags[FLAGS.gaveStone]).toBe(true);
    const chest = stripMarkup(OBJECTS['futuresquare.chest']!.description(delivered));
    expect(chest).toContain('from past the names, given');

    // Carried away and never handed over: nothing materialises in the archive.
    const carried = typeAll(begin(), [
      'take lantern',
      'down',
      'west',
      'west',
      'in',
      'take stone',
    ]);
    expect(carried.flags[FLAGS.tookStone]).toBe(true);
    expect(carried.flags[FLAGS.gaveStone]).toBeUndefined();
    expect(stripMarkup(OBJECTS['futuresquare.chest']!.description(carried))).not.toContain(
      'from past the names'
    );

    // And never picked up at all.
    expect(stripMarkup(OBJECTS['futuresquare.chest']!.description(begin()))).not.toContain(
      'from past the names'
    );
  });
});
