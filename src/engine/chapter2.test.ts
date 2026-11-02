import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CROSS_FIRST,
  FENN_ROUTE,
  GO_FORWARD,
  PAST_TO_SQUARE,
  READ_PANEL,
  RECITE,
  SAFFRA_REALISATION,
  SAFFRA_ROUTE,
  SOLVE_RELIEF,
  SQUARE_TO_WORKSITE,
  TO_SEALED,
  WATER_ROUTE,
  WORKSITE_TO_SQUARE,
  begin,
  lastText,
  progressOf,
  type,
  typeAll,
} from '../testing/harness';
import { resolve } from './reducer';
import { getAffordances } from './affordances';
import { FLAGS } from '../content/flags';
import { PROPHECY_LINES, PROPHECY_TEXT } from '../content/prophecy';
import { OBJECTIVES } from '../content/text';
import { OBJECTS } from '../content/objects';
import { stripMarkup } from '../content/markup';
import { hintContext, nextHint } from '../content/hints';
import { loadBest, readSlot, writeAutosave, writeCheckpoint } from '../persistence/storage';
import { validateSave } from '../persistence/validate';
import type { GameState } from './types';

/**
 * Chapter 2: the past village, the recitation, the three heights, and the
 * arrival at the end of the built content.
 *
 * Each block names the behaviour a player would notice.
 */

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

/** In the square, a century earlier, with the realisation behind them. */
function inTheSquare(): GameState {
  return typeAll(begin(), [
    ...TO_SEALED,
    ...SOLVE_RELIEF,
    ...CROSS_FIRST,
    ...PAST_TO_SQUARE,
    ...SAFFRA_REALISATION,
  ]);
}

/* ================================================================ *
 * 1. The recitation
 * ================================================================ */

describe('the recitation is fixed, deliberate and unrepeatable', () => {
  it('speaks exactly the text the opening plank carries', () => {
    const said = type(typeAll(inTheSquare(), ['leave', 'talk to saffra', 'why you asked']), 'recite prophecy');
    expect(said.accepted).toBe(true);

    const spoken = stripMarkup(said.events.map((e) => e.text).join('\n'));
    for (const line of PROPHECY_LINES) {
      expect(spoken, `the recitation should contain "${line}"`).toContain(line);
    }

    // And the same words, from the same source, are on the plank in the square
    // the hero grew up in. One canonical text, two displays.
    const plank = stripMarkup(OBJECTS['square.plank']!.description(said.state));
    for (const line of PROPHECY_LINES) {
      expect(plank, `the plank should contain "${line}"`).toContain(line);
    }
    expect(stripMarkup(PROPHECY_TEXT)).toBe(PROPHECY_TEXT);
  });

  it('cannot be reached before the villagers have asked for it', () => {
    const fresh = typeAll(begin(), [...TO_SEALED, ...SOLVE_RELIEF, ...CROSS_FIRST, ...PAST_TO_SQUARE]);
    const early = type(fresh, 'recite prophecy');
    expect(early.accepted).toBe(false);
    expect(early.state.flags[FLAGS.recitedProphecy]).toBeUndefined();

    // After the shock, but before they ask, it is still refused.
    const shocked = typeAll(fresh, SAFFRA_REALISATION);
    expect(shocked.flags[FLAGS.heardNoProphecy]).toBe(true);
    const stillEarly = type(shocked, 'recite prophecy');
    expect(stillEarly.accepted).toBe(false);
    expect(stillEarly.state.flags[FLAGS.recitedProphecy]).toBeUndefined();
  });

  it('cannot be spoken anywhere but the square', () => {
    const asked = typeAll(inTheSquare(), ['leave', 'talk to saffra', 'why you asked', 'leave']);
    const uphill = typeAll(asked, ['west']);
    expect(uphill.locationId).toBe('past.cave_path');
    const out = type(uphill, 'recite prophecy');
    expect(out.accepted).toBe(false);
    expect(out.state.flags[FLAGS.recitedProphecy]).toBeUndefined();
  });

  it('fires once, and records the witness writing it down', () => {
    const said = typeAll(inTheSquare(), ['leave', ...RECITE]);
    expect(said.flags[FLAGS.recitedProphecy]).toBe(true);
    expect(said.flags[FLAGS.prophecyRecorded]).toBe(true);
    expect(said.journal.filter((e) => e.id === 'j.recited')).toHaveLength(1);

    const again = type(said, 'recite prophecy');
    expect(again.state.journal.filter((e) => e.id === 'j.recited')).toHaveLength(1);
    expect(again.state.flags[FLAGS.recitedProphecy]).toBe(true);
  });

  it('leaves the opportunity open when the player walks away from it', () => {
    const asked = typeAll(inTheSquare(), ['leave', 'talk to saffra', 'why you asked']);
    expect(asked.flags[FLAGS.askedForWords]).toBe(true);

    const walked = type(asked, 'leave');
    expect(walked.accepted).toBe(true);
    expect(walked.state.flags[FLAGS.declinedRecital]).toBe(true);
    expect(walked.state.flags[FLAGS.recitedProphecy]).toBeUndefined();

    // Nothing is lost: it is still there, in both modes, on the next visit.
    const back = typeAll(walked.state, ['west', 'east', 'talk to saffra']);
    expect(getAffordances(back).topics?.some((t) => t.key === 'recite-prophecy')).toBe(true);
    const later = type(back, 'recite prophecy');
    expect(later.accepted).toBe(true);
    expect(later.state.flags[FLAGS.recitedProphecy]).toBe(true);
  });

  it('is never spoken on the player\'s behalf by anything else', () => {
    const asked = typeAll(inTheSquare(), ['leave', 'talk to saffra', 'why you asked', 'leave']);
    // Everything else a player might plausibly do in the square, and a lap of
    // the map. None of it may say the words.
    const busy = typeAll(asked, [
      'look',
      'examine well',
      'examine tree',
      'examine building',
      'take skins',
      'talk to fenn',
      'the tree',
      'leave',
      'wait',
      'west',
      'north',
      'fill skins',
      'south',
      'west',
      'down',
      'up',
      'east',
      'east',
      'journal',
      'wait',
    ]);
    expect(busy.flags[FLAGS.recitedProphecy]).toBeUndefined();
  });

  it('reloads correctly before, during and after the scene', () => {
    const before = typeAll(inTheSquare(), ['leave']);
    const during = typeAll(before, ['talk to saffra', 'why you asked']);
    const after = typeAll(during, ['recite prophecy']);

    for (const [name, state] of [
      ['before', before],
      ['during', during],
      ['after', after],
    ] as const) {
      expect(writeAutosave(state).working, name).toBe(true);
      const reloaded = loadBest().state!;
      expect(progressOf(reloaded), name).toEqual(progressOf(state));
      localStorage.clear();
    }

    // Mid-scene, the pending conversation survives and the action is still offered.
    expect(writeAutosave(during).working).toBe(true);
    const resumed = loadBest().state!;
    expect(resumed.pending?.kind).toBe('conversation');
    expect(getAffordances(resumed).topics?.some((t) => t.key === 'recite-prophecy')).toBe(true);
    expect(type(resumed, 'recite prophecy').state.flags[FLAGS.recitedProphecy]).toBe(true);
  });

  it('keeps the villagers aware afterwards that they have heard it', () => {
    const said = typeAll(inTheSquare(), ['leave', ...RECITE]);
    const retract = typeAll(said, ['talk to saffra', 'taking it back']);
    expect(retract.flags[FLAGS.triedToRetract]).toBe(true);
    const truth = typeAll(retract, ['leave', 'talk to fenn', 'where you are really from']);
    expect(truth.flags[FLAGS.toldFennTruth]).toBe(true);
  });
});

/* ================================================================ *
 * 2. Worksite access, in either order, by any of three routes
 * ================================================================ */

describe('the workings can be opened three ways and closed by none', () => {
  it('opens on carried water before the words are said', () => {
    const state = typeAll(inTheSquare(), WATER_ROUTE);
    expect(state.flags[FLAGS.carriedWater]).toBe(true);
    expect(state.flags[FLAGS.worksiteAccess]).toBe(true);
    const inside = typeAll(state, ['down', 'north']);
    expect(inside.locationId).toBe('past.worksite');
  });

  it('closes the water route once the words are said, and says so plainly', () => {
    const said = typeAll(inTheSquare(), ['leave', ...RECITE]);
    expect(said.flags[FLAGS.lovageDistrust]).toBe(true);

    const carried = typeAll(said, [
      'take skins',
      'west',
      'north',
      'fill skins',
      'south',
      'west',
    ]);
    const offered = type(carried, 'give skins to lovage');
    expect(offered.accepted).toBe(false);
    // Refused, not consumed: the hero still has the water.
    expect(offered.state.inventory).toContain('water_skins');
    expect(offered.state.flags[FLAGS.skinsFilled]).toBe(true);
    expect(offered.state.flags[FLAGS.worksiteAccess]).toBeUndefined();
    expect(lastText(offered)).toContain('Not off you');
  });

  for (const [name, route] of [
    ["Fenn's gap", FENN_ROUTE],
    ['Saffra walking up', SAFFRA_ROUTE],
  ] as const) {
    it(`opens on ${name} with no earlier optional conversation at all`, () => {
      /*
       * Straight down the required path: the realisation, the recitation, and
       * then this route. Nothing optional has been heard — in particular not
       * Saffra's topic about Lovage, which is the one a player could miss.
       */
      const minimal = typeAll(inTheSquare(), ['leave', ...RECITE]);
      expect(minimal.flags[FLAGS.knowsWaterNeeded]).toBeUndefined();

      const opened = typeAll(minimal, route);
      expect(opened.flags[FLAGS.worksiteAccess]).toBe(true);
      expect(opened.locationId).toBe('past.entrance');
      const inside = typeAll(opened, ['down', 'north']);
      expect(inside.locationId).toBe('past.worksite');
    });
  }

  it('completes the second crossing in the worksite-first order as well', () => {
    const readFirst = typeAll(inTheSquare(), [...WATER_ROUTE, ...READ_PANEL]);
    expect(readFirst.flags[FLAGS.knowsSettings]).toBe(true);
    expect(readFirst.flags[FLAGS.recitedProphecy]).toBeUndefined();

    // The aperture will not take them until the square is answered.
    const early = type(readFirst, 'enter aperture');
    expect(early.accepted).toBe(false);
    expect(early.state.era).toBe('past');

    const end = typeAll(readFirst, [
      ...WORKSITE_TO_SQUARE,
      ...RECITE,
      ...SQUARE_TO_WORKSITE,
      ...GO_FORWARD,
    ]);
    expect(end.locationId).toBe('future.deep_chamber');
    expect(end.era).toBe('future');
    expect(end.chapter).toBe('future');
  });

  it('never revokes access once it has been earned', () => {
    const opened = typeAll(inTheSquare(), WATER_ROUTE);
    expect(opened.flags[FLAGS.worksiteAccess]).toBe(true);
    // Say the words, which turns Lovage against them, and take the skins back.
    const after = typeAll(opened, [
      'take skins',
      'down',
      'up',
      'east',
      'east',
      ...RECITE,
      'west',
      'west',
    ]);
    expect(after.flags[FLAGS.lovageDistrust]).toBe(true);
    expect(after.flags[FLAGS.worksiteAccess]).toBe(true);
    expect(typeAll(after, ['down', 'north']).locationId).toBe('past.worksite');
  });

  it('hides the gap entirely until it is earned, in both modes', () => {
    const outside = typeAll(inTheSquare(), ['leave', 'west', 'west', 'down']);
    expect(outside.locationId).toBe('past.deep_chamber');
    expect(outside.flags[FLAGS.worksiteAccess]).toBeUndefined();

    // Not offered as a button.
    expect(getAffordances(outside).exits.some((e) => e.key === 'exit-to_worksite')).toBe(false);

    // And guessing it, typed or dispatched directly, does not move the hero.
    for (const guess of ['north', 'gap', 'worksite', 'to_worksite', 'past.worksite']) {
      const tried = type(outside, `go ${guess}`);
      expect(tried.accepted, guess).toBe(false);
      expect(tried.state.locationId, guess).toBe('past.deep_chamber');
    }
    const direct = resolve(outside, { type: 'GO', target: 'to_worksite' });
    expect(direct.accepted).toBe(false);
    expect(direct.state.locationId).toBe('past.deep_chamber');
  });
});

/* ================================================================ *
 * 3. The three heights are fixed destinations
 * ================================================================ */

describe('the three lamp positions are places, not distances', () => {
  function atThePanel(): GameState {
    return typeAll(inTheSquare(), ['leave', ...RECITE, ...FENN_ROUTE, ...READ_PANEL]);
  }

  it('needs all three pieces of evidence before the hero concludes anything', () => {
    const inside = typeAll(inTheSquare(), ['leave', ...RECITE, ...FENN_ROUTE, 'down', 'north']);
    expect(inside.flags[FLAGS.knowsSettings]).toBeUndefined();

    const drawing = typeAll(inside, ['examine drawing']);
    expect(drawing.flags[FLAGS.knowsSettings]).toBeUndefined();
    const slate = typeAll(drawing, ['examine slate']);
    expect(slate.flags[FLAGS.knowsSettings]).toBeUndefined();
    const dishes = typeAll(slate, ['examine dishes']);
    expect(dishes.flags[FLAGS.knowsSettings]).toBe(true);
    expect(dishes.objective).toBe(OBJECTIVES.settings);
  });

  it('sends the low position back to the era it came from, and nowhere', () => {
    const state = atThePanel();
    const stood = type(state, 'place lantern in low dish');
    expect(stood.accepted).toBe(true);
    // Standing the lamp moves nobody. Going through is its own decision.
    expect(stood.state.locationId).toBe('past.worksite');
    expect(stood.state.flags[FLAGS.lanternInLowDish]).toBe(true);
    expect(stood.state.flags[FLAGS.triedLowDish]).toBeUndefined();

    const low = type(stood.state, 'enter aperture');
    expect(low.accepted).toBe(true);
    // It answers, and it leads to this same chamber in this same season: it is
    // the position the hero arrived by, from year 0, and from here it is here.
    expect(low.state.locationId).toBe('past.worksite');
    expect(low.state.era).toBe('past');
    expect(low.state.flags[FLAGS.triedLowDish]).toBe(true);
    expect(low.state.flags[FLAGS.crossedForward]).toBeUndefined();
    // The lamp is back in the hero's hand afterwards; nothing is consumed.
    expect(low.state.inventory).toContain('lantern');
  });

  it('refuses the middle position because there is no dish to stand a lamp in', () => {
    const state = atThePanel();
    const middle = type(state, 'place lantern in outline');
    expect(middle.accepted).toBe(false);
    expect(middle.state.inventory).toContain('lantern');
    expect(middle.state.era).toBe('past');
    // Refused on the room's own physical terms, not with a blanket no.
    expect(lastText(middle)).toContain('no seat');
  });

  it('reaches the later era on the high position, by a deliberate crossing', () => {
    const stood = type(atThePanel(), 'place lantern in high dish');
    expect(stood.accepted).toBe(true);
    expect(stood.state.flags[FLAGS.lanternInHighDish]).toBe(true);
    // Standing the lamp does not move anybody, and neither does lighting it.
    expect(stood.state.locationId).toBe('past.worksite');
    expect(stood.state.era).toBe('past');

    const lit = type(stood.state, 'light lantern');
    expect(lit.state.locationId).toBe('past.worksite');
    expect(lit.state.era).toBe('past');

    const gone = type(lit.state, 'enter aperture');
    expect(gone.accepted).toBe(true);
    expect(gone.state.locationId).toBe('future.deep_chamber');
    expect(gone.state.era).toBe('future');
    expect(gone.state.chapter).toBe('future');
  });

  it('refuses the aperture for a stated reason at every missing step', () => {
    const inside = typeAll(inTheSquare(), ['leave', ...RECITE, ...FENN_ROUTE, 'down', 'north']);

    const unread = type(inside, 'enter aperture');
    expect(unread.accepted).toBe(false);
    expect(lastText(unread)).toContain('not understood the dishes');

    const read = typeAll(inside, READ_PANEL.slice(2));
    const noLamp = type(read, 'enter aperture');
    expect(noLamp.accepted).toBe(false);
    expect(lastText(noLamp)).toContain('Nothing is standing in the high dish');
  });

  it('will not let the hero leave with the square still unanswered', () => {
    const owed = typeAll(inTheSquare(), [...WATER_ROUTE, ...READ_PANEL, 'place lantern in high dish']);
    expect(owed.flags[FLAGS.recitedProphecy]).toBeUndefined();
    const refused = type(owed, 'enter aperture');
    expect(refused.accepted).toBe(false);
    expect(refused.state.era).toBe('past');
  });

  it('refuses in the right terms for what has actually been said down there', () => {
    /*
     * Worksite access does not run through Saffra, so a player can be standing
     * at this panel having been asked a question, having only found out that
     * nobody here knows the words, or having never raised it at all. The
     * refusal has to know which.
     */
    const crossed = typeAll(begin(), [...TO_SEALED, ...SOLVE_RELIEF, ...CROSS_FIRST]);

    // 1. Never discussed. Straight past Saffra to the water and the workings.
    const silent = typeAll(crossed, [
      'up',
      'east',
      'east',
      'take skins',
      'west',
      'north',
      'fill skins',
      'south',
      'west',
      'give skins to lovage',
      ...READ_PANEL,
    ]);
    expect(silent.flags[FLAGS.heardNoProphecy]).toBeUndefined();
    expect(silent.flags[FLAGS.askedForWords]).toBeUndefined();
    const neverAsked = lastText(type(silent, 'enter aperture'));
    expect(neverAsked).toContain('not once asked them');
    expect(neverAsked, 'nothing has been owed yet').not.toContain('waiting on you');

    // 2. Asked them, found nothing, and let it go.
    const shocked = typeAll(inTheSquare(), [...WATER_ROUTE, ...READ_PANEL]);
    expect(shocked.flags[FLAGS.heardNoProphecy]).toBe(true);
    expect(shocked.flags[FLAGS.askedForWords]).toBeUndefined();
    const unfinished = lastText(type(shocked, 'enter aperture'));
    expect(unfinished).toContain('finish the conversation');
    expect(unfinished, 'they have not asked anything yet').not.toContain('waiting on you');

    // 3. Asked a straight question, and not answered it.
    const asked = typeAll(shocked, [
      ...WORKSITE_TO_SQUARE,
      'talk to saffra',
      'why you asked',
      'leave',
      ...SQUARE_TO_WORKSITE,
    ]);
    expect(asked.flags[FLAGS.askedForWords]).toBe(true);
    expect(asked.locationId).toBe('past.worksite');
    const owing = lastText(type(asked, 'enter aperture'));
    expect(owing).toContain('waiting on you');
    expect(owing).toContain('owing them');

    // All three are distinct, and none of them lets the hero through.
    expect(new Set([neverAsked, unfinished, owing]).size).toBe(3);
  });

  it('keeps the deduction a working conclusion rather than a fact', () => {
    const concluded = type(
      typeAll(inTheSquare(), ['leave', ...RECITE, ...FENN_ROUTE, 'down', 'north', 'examine drawing', 'examine slate']),
      'examine dishes'
    );
    expect(concluded.state.flags[FLAGS.knowsSettings]).toBe(true);
    const text = stripMarkup(lastText(concluded));

    // Hedged, and says out loud that it is a guess off very little.
    expect(text).toContain('perhaps');
    expect(text).toContain('It is a guess');
    expect(text).toContain('If you have it right');
    // Not asserted as established fact.
    expect(text).not.toContain('So the heights are not distances');
    expect(text).not.toMatch(/They are places —/);

    // And the journal records it as a guess too, not as something known.
    const entry = concluded.state.journal.find((e) => e.id === 'j.settings')!;
    expect(entry.text).toContain('it is a guess');
    expect(entry.text).toContain('may not be distances');
  });

  it('keeps the three positions unaddressable until the panel has been read', () => {
    const inside = typeAll(inTheSquare(), ['leave', ...RECITE, ...FENN_ROUTE, 'down', 'north']);
    for (const guess of ['high dish', 'low dish', 'outline', 'worksite.highdish']) {
      const tried = type(inside, `place lantern in ${guess}`);
      expect(tried.accepted, guess).toBe(false);
      expect(tried.state.flags[FLAGS.lanternInHighDish], guess).toBeUndefined();
    }
    const direct = resolve(inside, {
      type: 'PLACE',
      item: 'lantern',
      target: 'worksite.highdish',
    });
    expect(direct.accepted).toBe(false);
    expect(direct.state.flags[FLAGS.lanternInHighDish]).toBeUndefined();
  });

  it('asks which position when the player just says "dish"', () => {
    const state = typeAll(inTheSquare(), ['leave', ...RECITE, ...FENN_ROUTE, ...READ_PANEL]);
    const asked = type(state, 'place lantern in dish');
    expect(asked.accepted).toBe(false);
    expect(asked.state.pending?.kind).toBe('clarification');
    expect(asked.state.pending).toMatchObject({
      options: expect.arrayContaining([expect.objectContaining({ label: 'high dish' })]),
    });
  });
});

/* ================================================================ *
 * 4. Wrong attempts cost nothing
 * ================================================================ */

describe('wrong but reasonable attempts never take anything away', () => {
  function atThePanel(): GameState {
    return typeAll(inTheSquare(), ['leave', ...RECITE, ...FENN_ROUTE, ...READ_PANEL]);
  }

  it('answers every obvious way round the uncut dish without closing anything', () => {
    const start = atThePanel();
    const attempts = [
      'place lantern in outline',
      'use wedge on outline',
      'place wedge in high dish',
      'use lantern on pillar',
      'wait',
      'wait',
      'wait',
      'examine outline',
      'examine drawing',
      'examine slate',
    ];
    let state = start;
    for (const line of attempts) {
      const result = type(state, line);
      // Each one is answered: no crash, no silent nothing.
      expect(lastText(result).length, line).toBeGreaterThan(40);
      state = result.state;
    }

    // Nothing consumed, nothing closed, and the solution is still available.
    expect(state.inventory).toEqual(expect.arrayContaining(['lantern']));
    expect(state.flags[FLAGS.knowsSettings]).toBe(true);
    expect(state.flags[FLAGS.worksiteAccess]).toBe(true);
    const end = typeAll(state, GO_FORWARD);
    expect(end.locationId).toBe('future.deep_chamber');
  });

  it('refuses to take a mallet to the pillar, and keeps the mallet', () => {
    const state = typeAll(atThePanel(), ['take mallet']);
    expect(state.inventory).toContain('mallet');
    const swung = type(state, 'use mallet on pillar');
    expect(swung.accepted).toBe(false);
    expect(swung.state.inventory).toContain('mallet');
  });

  it('asks Lovage for the dish and is refused without losing access', () => {
    const state = typeAll(inTheSquare(), [...WATER_ROUTE, ...READ_PANEL]);
    const asked = typeAll(state, ['south', 'up', 'talk to lovage', 'asking him to cut the middle dish']);
    expect(asked.flags[FLAGS.worksiteAccess]).toBe(true);
    expect(asked.journal.some((e) => e.id === 'j.lovage_refuses')).toBe(true);
  });

  it('keeps every hint repeatable and never charges for one', () => {
    const state = typeAll(inTheSquare(), ['leave', ...RECITE, ...FENN_ROUTE, 'down', 'north']);
    expect(hintContext(state)).toBe('worksite');

    let current = state;
    const texts: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      const asked = type(current, 'hint');
      expect(asked.accepted).toBe(true);
      texts.push(lastText(asked));
      current = asked.state;
    }
    // The ladder walks to the end and then stays there, repeatably.
    expect(texts[texts.length - 1]).toBe(texts[texts.length - 2]);
    // And nothing about asking changed the world.
    expect(current.inventory).toEqual(state.inventory);
    expect(current.locationId).toBe(state.locationId);

    // The required clue objects can be read as many times as the player likes.
    for (let i = 0; i < 3; i += 1) {
      expect(type(current, 'examine slate').accepted).toBe(true);
      expect(type(current, 'examine drawing').accepted).toBe(true);
    }
  });

  it('lets waiting happen anywhere without a clock behind it', () => {
    const state = inTheSquare();
    const waited = typeAll(state, ['wait', 'wait', 'wait', 'wait', 'wait']);
    expect(waited.flags).toEqual(state.flags);
    expect(waited.inventory).toEqual(state.inventory);
    expect(waited.locationId).toBe(state.locationId);
  });
});

/* ================================================================ *
 * 5. The rupture is observed and never explained
 * ================================================================ */

describe('the wrongnesses are observations, fired once each', () => {
  it('shows none of them before the words are said', () => {
    const before = typeAll(inTheSquare(), [...WATER_ROUTE, ...READ_PANEL, 'south', 'up', 'east', 'north']);
    expect(before.flags[FLAGS.symptomSound]).toBeUndefined();
    expect(before.flags[FLAGS.symptomMark]).toBeUndefined();
    expect(before.flags[FLAGS.symptomWeather]).toBeUndefined();
  });

  it('shows none of them anywhere in the opening era', () => {
    const opening = typeAll(begin(), [...TO_SEALED, ...SOLVE_RELIEF, 'down', 'look']);
    expect(opening.flags[FLAGS.symptomSound]).toBeUndefined();
    expect(opening.flags[FLAGS.symptomMark]).toBeUndefined();
    expect(opening.flags[FLAGS.symptomWeather]).toBeUndefined();
  });

  it('fires the first one with the recitation and never again', () => {
    const said = typeAll(inTheSquare(), ['leave', ...RECITE]);
    expect(said.flags[FLAGS.symptomSound]).toBe(true);
    expect(said.journal.filter((e) => e.id === 'j.symptom_sound')).toHaveLength(1);

    const lapped = typeAll(said, ['west', 'east', 'west', 'east', 'look', 'look']);
    expect(lapped.journal.filter((e) => e.id === 'j.symptom_sound')).toHaveLength(1);
  });

  it('fires the hillside one and the workings one once apiece', () => {
    const said = typeAll(inTheSquare(), ['leave', ...RECITE]);
    const uphill = typeAll(said, ['west']);
    expect(uphill.flags[FLAGS.symptomWeather]).toBe(true);

    const toAndFro = typeAll(uphill, ['north', 'south', 'east', 'west']);
    expect(toAndFro.journal.filter((e) => e.id === 'j.symptom_weather')).toHaveLength(1);

    const inside = typeAll(said, FENN_ROUTE.concat(['down']));
    expect(inside.flags[FLAGS.symptomMark]).toBe(true);
    const again = typeAll(inside, ['north', 'south', 'north', 'south']);
    expect(again.journal.filter((e) => e.id === 'j.symptom_mark')).toHaveLength(1);
  });

  it('survives a reload without replaying', () => {
    const said = typeAll(inTheSquare(), ['leave', ...RECITE, 'west']);
    expect(said.flags[FLAGS.symptomWeather]).toBe(true);
    expect(writeAutosave(said).working).toBe(true);
    const reloaded = loadBest().state!;
    const walked = typeAll(reloaded, ['east', 'west']);
    expect(walked.journal.filter((e) => e.id === 'j.symptom_weather')).toHaveLength(1);
  });

  it('lets the only person with a theory say he has none', () => {
    const said = typeAll(inTheSquare(), ['leave', ...RECITE, 'west', 'west']);
    const asked = typeAll(said, ['talk to lovage', 'the things that have been going wrong']);
    const text = asked.transcript.map((e) => stripMarkup(e.text)).join('\n');
    expect(text).toContain('I do not know what that is');
    // Nothing anywhere in the chapter explains the mechanism.
    for (const pattern of [/paradox/i, /causal/i, /space-?time/i, /rupture/i, /timeline/i]) {
      expect(text, `player-facing text matches ${pattern}`).not.toMatch(pattern);
    }
  });
});

/* ================================================================ *
 * 6. The arrival, and the boundary of what is built
 * ================================================================ */

describe('the second crossing arrives, and the chapter carries on', () => {
  function arrived(): GameState {
    return typeAll(inTheSquare(), [
      'leave',
      ...RECITE,
      ...FENN_ROUTE,
      ...READ_PANEL,
      ...GO_FORWARD,
    ]);
  }

  it('commits era, chapter, place and objective in one step', () => {
    const before = typeAll(inTheSquare(), [
      'leave',
      ...RECITE,
      ...FENN_ROUTE,
      ...READ_PANEL,
      'place lantern in high dish',
    ]);
    const crossing = type(before, 'enter aperture');
    expect(crossing.accepted).toBe(true);

    const after = crossing.state;
    expect(after.era).toBe('future');
    expect(after.chapter).toBe('future');
    expect(after.locationId).toBe('future.deep_chamber');
    expect(after.objective).toBe(OBJECTIVES.future);
    // Not the end of anything any more: the chapter continues from here.
    expect(after.ended).toBe(false);
    expect(after.flags[FLAGS.crossed]).toBe(true);
    expect(after.flags[FLAGS.crossedForward]).toBe(true);
    // The lamp comes with them, out of the dish and into their hands.
    expect(after.inventory).toContain('lantern');
    expect(after.flags[FLAGS.lanternInHighDish]).toBe(false);
    // And the whole transition validates as one coherent save.
    expect(validateSave(JSON.parse(JSON.stringify(after))).ok).toBe(true);
  });

  it('does not duplicate the arrival on a reload or a repeated command', () => {
    const state = arrived();
    expect(state.journal.filter((e) => e.id === 'j.crossed_forward')).toHaveLength(1);

    expect(writeAutosave(state).working).toBe(true);
    const reloaded = loadBest().state!;
    expect(progressOf(reloaded)).toEqual(progressOf(state));
    expect(reloaded.journal.filter((e) => e.id === 'j.crossed_forward')).toHaveLength(1);

    const again = typeAll(reloaded, ['enter aperture', 'look', 'enter basin']);
    expect(again.journal.filter((e) => e.id === 'j.crossed_forward')).toHaveLength(1);
    expect(again.locationId).toBe('future.deep_chamber');
  });

  it('arrives with no injury, no identity reveal and no way home yet', () => {
    const state = arrived();
    const readable = state.transcript.map((e) => stripMarkup(e.text)).join('\n');
    for (const pattern of [/your eye/i, /lost an eye/i, /you are the wanderer/i, /cyclops/i]) {
      expect(readable, `arrival text matches ${pattern}`).not.toMatch(pattern);
    }
    expect(state.flags[FLAGS.lostEye]).toBeUndefined();
    expect(state.flags[FLAGS.knowsResponsibility]).toBeUndefined();
    // The only thing in this room that goes anywhere is the tear.
    expect(getAffordances(state).exits.map((e) => e.key)).toEqual(['exit-to_path']);
    expect(getAffordances(state).objects.map((o) => o.id).sort()).toEqual([
      'futuredeep.basin',
      'futuredeep.stair',
      'futuredeep.tear',
    ]);
  });

  it('cannot be bypassed back up the stair the hero came down twice', () => {
    const state = arrived();
    const stair = type(state, 'clear stair');
    expect(stair.accepted).toBe(false);
    expect(stair.state.flags[FLAGS.triedBlockedStair]).toBe(true);
    expect(stair.state.locationId).toBe('future.deep_chamber');
    // And it is not an exit, in either mode.
    expect(getAffordances(state).exits.some((e) => /sealed|stair/.test(e.key))).toBe(false);
  });

  it('writes a chapter checkpoint at the crossing', () => {
    const before = typeAll(inTheSquare(), [
      'leave',
      ...RECITE,
      ...FENN_ROUTE,
      ...READ_PANEL,
      'place lantern in high dish',
    ]);
    const crossing = type(before, 'enter aperture');
    // The UI writes a checkpoint whenever the chapter changes; this is that call.
    expect(crossing.state.chapter).not.toBe(before.chapter);
    expect(writeCheckpoint(crossing.state).working).toBe(true);
    const stored = readSlot('checkpoint');
    expect(stored.state?.locationId).toBe('future.deep_chamber');
    expect(stored.error).toBeNull();
  });
});

/* ================================================================ *
 * 7. The opening still works, with and without the new additions
 * ================================================================ */

describe('the opening chapter is unchanged by any of this', () => {
  it('still solves the shuttered relief without touching the new content', () => {
    const solved = typeAll(begin(), [...TO_SEALED, ...SOLVE_RELIEF]);
    expect(solved.flags[FLAGS.passageOpen]).toBe(true);
    // Neither optional addition was used.
    expect(solved.flags[FLAGS.sawPillar]).toBeUndefined();
    expect(solved.flags[FLAGS.tookStone]).toBeUndefined();
  });

  it('offers the pillar as ordinary stone and no kind of portent', () => {
    const sealed = typeAll(begin(), TO_SEALED);
    const looked = type(sealed, 'examine pillar');
    expect(looked.accepted).toBe(true);
    expect(looked.state.flags[FLAGS.sawPillar]).toBe(true);
    const text = stripMarkup(lastText(looked));
    expect(text).toContain('crack');
    // Nothing temporal, nothing prophetic, and nothing that gives the finale away.
    for (const pattern of [/century/i, /year/i, /will be/i, /destin/i, /omen/i, /portent/i]) {
      expect(text, `pillar text matches ${pattern}`).not.toMatch(pattern);
    }
  });

  it('lets the stone actually reach the boy who asked for it', () => {
    const taken = typeAll(begin(), [
      'take lantern',
      'down',
      'talk to parsie',
      'what he wants you to bring back',
      'leave',
      'west',
      'west',
      'in',
      'take stone',
    ]);
    expect(taken.inventory).toContain('stone');

    const given = typeAll(taken, ['out', 'east', 'east', 'give stone to parsie']);
    expect(given.flags[FLAGS.gaveStone]).toBe(true);
    expect(given.inventory).not.toContain('stone');
    // Given away, so it is not left lying anywhere for the hero to re-take.
    expect(given.placements['stone']).toBeUndefined();
    expect(validateSave(JSON.parse(JSON.stringify(given))).ok).toBe(true);

    const thanked = typeAll(given, ['talk to parsie', 'the stone in his hand']);
    expect(thanked.transcript.map((e) => e.text).join('\n')).toContain('Past the names');
  });

  it('completes without the stone, the pillar or the bench topic', () => {
    const end = typeAll(begin(), [
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
    expect(end.locationId).toBe('future.deep_chamber');
    expect(end.flags[FLAGS.tookStone]).toBeUndefined();
    expect(end.flags[FLAGS.sawPillar]).toBeUndefined();
  });

  it('keeps the hint ladders pointing at the right part of the story', () => {
    expect(hintContext(begin())).toBe('prep');
    const past = typeAll(begin(), [...TO_SEALED, ...SOLVE_RELIEF, ...CROSS_FIRST]);
    expect(hintContext(past)).toBe('past');
    const square = typeAll(past, [...PAST_TO_SQUARE, ...SAFFRA_REALISATION]);
    expect(hintContext(square)).toBe('access');
    const asked = typeAll(square, ['leave', 'talk to saffra', 'why you asked']);
    expect(hintContext(asked)).toBe('recite');
    const inside = typeAll(asked, ['recite prophecy', ...FENN_ROUTE]);
    expect(hintContext(inside)).toBe('worksite');
    // Across the second crossing, the ladder points at getting out of the hill
    // rather than at an ending, because this is no longer one.
    const future = typeAll(inside, [...READ_PANEL, ...GO_FORWARD]);
    expect(hintContext(future)).toBe('future_out');
    expect(nextHint(future).text).not.toContain('not the ending');
  });
});
