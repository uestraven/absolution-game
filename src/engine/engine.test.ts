import { describe, expect, it } from 'vitest';
import { begin, lastText, type, typeAll } from '../testing/harness';
import { FLAGS } from '../content/flags';
import { OBJECTS_BY_LOCATION } from '../content/objects';
import { resolve } from './reducer';
import { resolve as resolveNoun, undiscoveredObjects, visibleExits } from './selectors';
import { OBJECTIVES } from '../content/text';

/** Walk from home to the sealed chamber carrying lantern and wedge. */
const TO_SEALED = [
  'take lantern',
  'down',
  'east',
  'take wedge',
  'west',
  'west',
  'west',
  'in',
  'east',
];

describe('opening', () => {
  it('starts at home with the objective set and nothing carried', () => {
    const state = begin();
    expect(state.locationId).toBe('present.home');
    expect(state.chapter).toBe('rite');
    expect(state.inventory).toEqual([]);
    expect(state.objective).toBe(OBJECTIVES.rite);
    expect(state.transcript.some((e) => e.heading === 'Your Room')).toBe(true);
  });

  it('refuses to act before a character is chosen', () => {
    const blank = { ...begin(), chapter: 'select' as const, character: null };
    const result = resolve(blank, { type: 'LOOK' });
    expect(result.accepted).toBe(false);
    expect(lastText(result)).toContain('Choose who you are');
  });
});

describe('hidden things stay hidden', () => {
  it('does not let a guessed id reach an undiscovered object', () => {
    const state = typeAll(begin(), TO_SEALED);
    expect(state.locationId).toBe('present.sealed_chamber');
    expect(state.discovered).not.toContain('sealed.alcove');

    for (const guess of ['alcove', 'sealed.alcove', 'recess', 'niche', 'seam', 'sealed.seam']) {
      const result = type(state, `examine ${guess}`);
      expect(result.accepted, guess).toBe(false);
      expect(lastText(result), guess).toContain('cannot see');
      expect(result.state.discovered, guess).not.toContain('sealed.alcove');
      expect(result.state.flags[FLAGS.shutterTried], guess).toBeUndefined();
    }
  });

  it('refuses the same ids dispatched directly as actions, not just typed', () => {
    const state = typeAll(begin(), TO_SEALED);
    const direct = resolve(state, { type: 'EXAMINE', target: 'sealed.alcove' });
    expect(direct.accepted).toBe(false);
    expect(direct.state.discovered).not.toContain('sealed.alcove');

    const place = resolve(state, { type: 'PLACE', item: 'lantern', target: 'sealed.alcove' });
    expect(place.accepted).toBe(false);
    expect(place.state.flags[FLAGS.lanternInAlcove]).toBeUndefined();
  });

  it('gives the same refusal for a hidden exit as for a wrong direction', () => {
    const state = typeAll(begin(), TO_SEALED);
    const hidden = type(state, 'down');
    const nonsense = type(state, 'north');
    expect(hidden.accepted).toBe(false);
    expect(lastText(hidden)).toBe(lastText(nonsense));
    expect(visibleExits(state).some((e) => e.id === 'to_deep')).toBe(false);
  });

  it('hides exactly the things an examination reveals, and nothing else', () => {
    const hiddenIds = Object.values(OBJECTS_BY_LOCATION)
      .flat()
      .filter((o) => !o.initiallyVisible)
      .map((o) => o.id)
      .sort();
    expect(hiddenIds).toEqual(
      [
        'home.tag',
        'sealed.alcove',
        'sealed.passage',
        'sealed.seam',
        // The three lamp positions are addressable only once the hero has
        // actually looked at the panel, so guessing "high dish" before then
        // behaves exactly like guessing a nonsense word.
        'worksite.highdish',
        'worksite.lowdish',
        'worksite.outline',
      ].sort()
    );
  });
});

describe('ambiguity', () => {
  it('asks which one, then acts on the chosen option', () => {
    // In the sealed chamber, "stone" could mean the shutter or the walls.
    const sealed = typeAll(begin(), TO_SEALED);
    const ambiguous = type(sealed, 'examine stone');
    expect(ambiguous.accepted).toBe(false);
    expect(ambiguous.state.pending?.kind).toBe('clarification');
    expect(lastText(ambiguous)).toContain('Which one do you mean?');

    const chosen = type(ambiguous.state, '1');
    expect(chosen.accepted).toBe(true);
    expect(chosen.state.pending).toBeNull();

    // And the precise name works just as well as the number.
    const byName = type(ambiguous.state, 'patterned wall');
    expect(byName.accepted).toBe(true);
    expect(lastText(byName)).toContain('Overlapping scales');
  });

  it('can be cancelled, leaving the world untouched', () => {
    const sealed = typeAll(begin(), TO_SEALED);
    const ambiguous = type(sealed, 'examine stone');
    expect(ambiguous.state.pending?.kind).toBe('clarification');
    const cancelled = type(ambiguous.state, 'cancel');
    expect(cancelled.state.pending).toBeNull();
    expect(cancelled.state.locationId).toBe('present.sealed_chamber');
    expect(cancelled.state.turn).toBe(sealed.turn);
  });

  it('lets a complete command replace the question', () => {
    const sealed = typeAll(begin(), TO_SEALED);
    const ambiguous = type(sealed, 'examine stone');
    const moved = type(ambiguous.state, 'west');
    expect(moved.state.locationId).toBe('present.outer_gallery');
    expect(moved.state.pending).toBeNull();
  });
});

describe('the shuttered relief', () => {
  it('describes the lamp, the eye and their arrangement when examined', () => {
    const gallery = typeAll(begin(), ['take lantern', 'down', 'west', 'west', 'in']);
    const result = type(gallery, 'examine relief');
    const text = lastText(result);
    expect(text).toContain('lamp');
    expect(text).toContain('eye');
    expect(text).toMatch(/squared recess/);
    expect(result.state.flags[FLAGS.reliefExamined]).toBe(true);
    expect(result.state.journal.some((e) => e.id === 'j.relief')).toBe(true);
  });

  it('records the relief/alcove relationship once both have been seen', () => {
    let state = typeAll(begin(), ['take lantern', 'down', 'west', 'west', 'in', 'examine relief']);
    expect(state.flags[FLAGS.reliefMatched]).toBeUndefined();
    state = typeAll(state, ['east', 'open shutter']);
    expect(state.flags[FLAGS.reliefMatched]).toBe(true);
    expect(state.journal.some((e) => e.id === 'j.match')).toBe(true);
  });

  it('distinguishes missing support, covered alcove, unlit lantern and success', () => {
    let state = typeAll(begin(), TO_SEALED);

    const noSupport = type(state, 'open shutter');
    expect(noSupport.accepted).toBe(true);
    expect(lastText(noSupport)).toContain('driven in under the bottom edge');
    expect(noSupport.state.flags[FLAGS.shutterHeld]).toBeUndefined();
    state = noSupport.state;

    const covered = type(state, 'place lantern in alcove');
    expect(covered.accepted).toBe(false);
    expect(lastText(covered)).toContain('shutter is down over the alcove');
    expect(covered.state.flags[FLAGS.lanternInAlcove]).toBeUndefined();

    const wedged = type(state, 'use wedge on shutter');
    expect(wedged.accepted).toBe(true);
    expect(wedged.state.flags[FLAGS.shutterHeld]).toBe(true);
    state = wedged.state;

    const unlit = type(state, 'place lantern in alcove');
    expect(unlit.accepted).toBe(true);
    expect(lastText(unlit)).toContain('wick is not lit');
    expect(unlit.state.flags[FLAGS.seamRevealed]).toBeUndefined();
    state = unlit.state;

    const lit = type(state, 'light lantern');
    expect(lit.accepted).toBe(true);
    expect(lit.state.flags[FLAGS.seamRevealed]).toBe(true);
    expect(lastText(lit)).toContain('seam');

    // Four distinct explanations, not one generic refusal.
    const messages = [lastText(noSupport), lastText(covered), lastText(unlit), lastText(lit)];
    expect(new Set(messages).size).toBe(4);
  });

  it('needs no particular order between lighting and placing', () => {
    const base = typeAll(begin(), TO_SEALED);
    const lightFirst = typeAll(base, [
      'light lantern',
      'use wedge on shutter',
      'place lantern in alcove',
    ]);
    const placeFirst = typeAll(base, [
      'use wedge on shutter',
      'place lantern in alcove',
      'light lantern',
    ]);
    expect(lightFirst.flags[FLAGS.seamRevealed]).toBe(true);
    expect(placeFirst.flags[FLAGS.seamRevealed]).toBe(true);
  });

  it('refuses to open the wall before the light has shown the seam', () => {
    const state = typeAll(begin(), TO_SEALED);
    const result = type(state, 'open wall');
    expect(result.accepted).toBe(false);
    expect(lastText(result)).toContain('does not give anywhere');
    expect(result.state.flags[FLAGS.passageOpen]).toBeUndefined();
  });

  it('cannot be wedged without the wedge', () => {
    const state = typeAll(begin(), ['take lantern', 'down', 'west', 'west', 'in', 'east']);
    expect(state.inventory).not.toContain('wedge');
    const result = type(state, 'wedge shutter');
    expect(result.accepted).toBe(false);
    expect(lastText(result)).toContain('no wedge with you');
  });

  it('opens the passage, updates the objective, and keeps it open', () => {
    let state = typeAll(begin(), [
      ...TO_SEALED,
      'use wedge on shutter',
      'place lantern in alcove',
      'light lantern',
    ]);
    const opened = type(state, 'open seam');
    expect(opened.accepted).toBe(true);
    expect(opened.state.flags[FLAGS.passageOpen]).toBe(true);
    expect(opened.state.objective).toBe(OBJECTIVES.passage);
    state = opened.state;

    // Recovering both items must not undo the discovery.
    state = typeAll(state, ['take lantern', 'take wedge']);
    expect(state.inventory).toEqual(expect.arrayContaining(['lantern', 'wedge']));
    expect(state.flags[FLAGS.passageOpen]).toBe(true);
    expect(visibleExits(state).some((e) => e.id === 'to_deep')).toBe(true);
  });

  it('lets the wedge and the lantern always be recovered', () => {
    let state = typeAll(begin(), [
      ...TO_SEALED,
      'use wedge on shutter',
      'place lantern in alcove',
    ]);
    // Pull the wedge with the lantern still inside: the shutter shuts on it.
    state = type(state, 'take wedge').state;
    expect(state.inventory).toContain('wedge');
    expect(state.flags[FLAGS.shutterHeld]).toBe(false);

    const blocked = type(state, 'take lantern');
    expect(blocked.accepted).toBe(false);
    expect(lastText(blocked)).toContain('shutter is down over the alcove');

    // And it is recoverable, because the wedge is in hand.
    state = typeAll(state, ['use wedge on shutter', 'take lantern']);
    expect(state.inventory).toContain('lantern');
  });

  it('never leaves an item somewhere it cannot be picked up again', () => {
    const dropped = typeAll(begin(), ['take lantern', 'drop lantern']);
    expect(dropped.inventory).not.toContain('lantern');
    expect(resolveNoun(dropped, 'lantern').length).toBe(1);
    const back = type(dropped, 'take lantern');
    expect(back.accepted).toBe(true);
    expect(back.state.inventory).toContain('lantern');
  });
});

describe('preparation can be revisited', () => {
  it('allows leaving the cave and coming back', () => {
    const state = typeAll(begin(), [
      'take lantern',
      'down',
      'west',
      'west',
      'in',
      'out',
      'east',
      'east',
      'east',
      'take wedge',
      'west',
      'west',
      'west',
      'in',
      'east',
    ]);
    expect(state.locationId).toBe('present.sealed_chamber');
    expect(state.inventory).toEqual(expect.arrayContaining(['lantern', 'wedge']));
  });

});

describe('the echo chamber is optional', () => {
  it('is reachable and safe, and is not needed for the puzzle', () => {
    const echo = typeAll(begin(), ['take lantern', 'down', 'west', 'west', 'in', 'north']);
    expect(echo.locationId).toBe('present.echo_chamber');
    const read = type(echo, 'examine words');
    expect(read.accepted).toBe(true);
    expect(read.state.flags[FLAGS.readFledAccount]).toBe(true);
    expect(lastText(read)).toContain('could not stay');

    const solved = typeAll(begin(), [
      ...TO_SEALED,
      'use wedge on shutter',
      'place lantern in alcove',
      'light lantern',
      'open seam',
    ]);
    expect(solved.flags[FLAGS.passageOpen]).toBe(true);
    expect(solved.visited).not.toContain('present.echo_chamber');
  });
});

describe('the crossing', () => {
  const TO_THRESHOLD = [
    ...TO_SEALED,
    'use wedge on shutter',
    'place lantern in alcove',
    'light lantern',
    'open seam',
    'take lantern',
    'take wedge',
    'down',
  ];

  it('requires an explicit action and nothing else', () => {
    const state = typeAll(begin(), TO_THRESHOLD);
    expect(state.locationId).toBe('present.deep_chamber');
    expect(state.flags[FLAGS.crossed]).toBeUndefined();

    // Looking, examining and walking about do not cross.
    const poked = typeAll(state, ['look', 'examine threshold', 'examine steps', 'up', 'down']);
    expect(poked.era).toBe('present');
    expect(poked.flags[FLAGS.crossed]).toBeUndefined();

    const crossed = type(poked, 'enter threshold');
    expect(crossed.accepted).toBe(true);
    expect(crossed.state.flags[FLAGS.crossed]).toBe(true);
  });

  it('changes era, chapter, location and objective together', () => {
    const before = typeAll(begin(), TO_THRESHOLD);
    const after = type(before, 'enter threshold').state;
    expect(after.era).toBe('past');
    expect(after.locationId).toBe('past.deep_chamber');
    expect(after.chapter).toBe('crossing');
    expect(after.objective).toBe(OBJECTIVES.crossed);
    expect(after.journal.some((e) => e.id === 'j.crossed')).toBe(true);
    // Carried items come across.
    expect(after.inventory).toEqual(expect.arrayContaining(['lantern', 'wedge']));
  });

  it('explains plainly that the crossing is not there to use again', () => {
    const past = type(typeAll(begin(), TO_THRESHOLD), 'enter threshold').state;
    const again = type(past, 'enter threshold');
    expect(again.accepted).toBe(true);
    expect(lastText(again)).toContain('is not here');
    expect(again.state.era).toBe('past');
  });

  it('refuses to cross where there is nothing to cross', () => {
    const home = begin();
    const result = type(home, 'enter threshold');
    expect(result.accepted).toBe(false);
    expect(lastText(result)).toContain('nothing here to step into');
  });

  it('shows the changed landmarks and turns the realisation into a problem', () => {
    let state = type(typeAll(begin(), TO_THRESHOLD), 'enter threshold').state;
    expect(lastText(type(state, 'examine tool work'))).toContain('chalk');

    state = typeAll(state, ['up', 'east', 'east']);
    expect(state.locationId).toBe('past.square');
    expect(state.ended).toBe(false);

    expect(lastText(type(state, 'examine tree'))).toContain('cart');
    expect(lastText(type(state, 'examine well'))).toContain('unworn');
    expect(lastText(type(state, 'examine building'))).toContain('No roof');

    state = typeAll(state, ['talk to saffra', 'cave']);
    const realisation = type(state, 'wanderer');
    expect(realisation.accepted).toBe(true);
    expect(realisation.state.flags[FLAGS.heardNoProphecy]).toBe(true);
    // The beat still lands. It is no longer a full stop: the chapter continues
    // from it, and the objective says what the problem now is.
    expect(realisation.state.ended).toBe(false);
    expect(lastText(realisation)).toContain('You are a long way from home');
    expect(realisation.state.objective).toBe(OBJECTIVES.home);
    // And the conversation is still open, so walking away is the player's choice.
    expect(realisation.state.pending?.kind).toBe('conversation');
  });

  it('keeps the village aware of its own cave while lacking the prophecy', () => {
    let state = type(typeAll(begin(), TO_THRESHOLD), 'enter threshold').state;
    state = typeAll(state, ['up', 'east', 'east', 'talk to saffra']);
    const aboutCave = type(state, 'cave');
    const text = lastText(aboutCave);
    // They know it, they work in it, and young people go in: the tradition is intact.
    expect(text).toContain('cutting the stair');
    expect(text).toMatch(/walk in on a dare/);
    expect(text).not.toContain('Wanderer');
  });
});

describe('journal and hints', () => {
  it('records established observations and never a solution', () => {
    const state = typeAll(begin(), [
      'take lantern',
      'down',
      'west',
      'west',
      'in',
      'examine relief',
    ]);
    const relief = state.journal.find((e) => e.id === 'j.relief');
    expect(relief).toBeDefined();
    expect(relief!.text).not.toMatch(/wedge/i);
    expect(relief!.text).not.toMatch(/place the lantern/i);
    for (const entry of state.journal) {
      expect(entry.text, entry.id).not.toMatch(/\bthen open\b/i);
    }
  });

  it('does not record anything about places not yet visited', () => {
    const state = typeAll(begin(), ['examine lantern']);
    expect(state.journal.map((e) => e.id)).toEqual(['j.lantern']);
  });

  it('gives the same three-step ladder in either mode, ending in the answer', () => {
    const state = typeAll(begin(), TO_SEALED);
    const one = type(state, 'hint');
    const two = type(one.state, 'hint');
    const three = type(two.state, 'hint');
    expect(lastText(one)).toContain('Hint 1 of 3');
    expect(lastText(one)).toMatch(/relief/i);
    expect(lastText(two)).toContain('Hint 2 of 3');
    expect(lastText(two)).toMatch(/alcove/i);
    expect(lastText(three)).toContain('Hint 3 of 3');
    expect(lastText(three)).toMatch(/USE WEDGE ON SHUTTER/);

    // Dispatching HINT directly, as the button does, produces identical text.
    const button = resolve(state, { type: 'HINT' });
    expect(lastText(button)).toBe(lastText(one));
  });

  it('restarts the ladder when the player moves on to the next problem', () => {
    const solved = typeAll(begin(), [
      ...TO_SEALED,
      'use wedge on shutter',
      'place lantern in alcove',
      'light lantern',
      'open seam',
    ]);
    const hint = type(solved, 'hint');
    expect(lastText(hint)).toContain('Hint 1 of 3');
    expect(lastText(hint)).toMatch(/DOWN/);
  });
});

describe('unrecognised input', () => {
  it('changes nothing but the transcript', () => {
    const state = typeAll(begin(), ['take lantern', 'down']);
    const result = type(state, 'frobnicate the well with a herring');
    expect(result.accepted).toBe(false);
    expect(result.state.turn).toBe(state.turn);
    expect(result.state.inventory).toEqual(state.inventory);
    expect(result.state.flags).toEqual(state.flags);
    expect(result.state.locationId).toBe(state.locationId);
    expect(result.state.discovered).toEqual(state.discovered);
  });

  it('gives a useful reason rather than a shrug', () => {
    const state = begin();
    expect(lastText(type(state, 'examine'))).toContain('EXAMINE RELIEF');
    expect(lastText(type(state, 'go'))).toContain('EXITS');
    expect(lastText(type(state, 'place lantern'))).toContain('PLACE LANTERN IN ALCOVE');
  });
});

describe('failed experiments explain themselves', () => {
  it('says why the wedge is wrong for an ordinary wall', () => {
    const gallery = typeAll(begin(), [
      'take lantern',
      'down',
      'east',
      'take wedge',
      'west',
      'west',
      'west',
      'in',
    ]);
    const result = type(gallery, 'use wedge on relief');
    expect(result.accepted).toBe(false);
    expect(lastText(result)).toContain('holding itself up badly');
  });

  it('says why holding a lantern up to something is not an action', () => {
    const gallery = typeAll(begin(), ['take lantern', 'down', 'west', 'west', 'in']);
    const result = type(gallery, 'use lantern on relief');
    expect(result.accepted).toBe(false);
    expect(lastText(result)).toContain('not, on its own, doing anything');
  });

  it('will not light things that are not the lantern', () => {
    const gallery = typeAll(begin(), ['take lantern', 'down', 'west', 'west', 'in']);
    expect(lastText(type(gallery, 'light relief'))).toContain('will not light');
  });

  it('asks for a target when the wedge is used with none', () => {
    const sealed = typeAll(begin(), TO_SEALED);
    const result = type(sealed, 'use wedge');
    expect(result.state.pending?.kind).toBe('clarification');
    const names = undiscoveredObjects(sealed).map((o) => o.id);
    expect(names).toContain('sealed.alcove');
  });
});
