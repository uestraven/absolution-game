import { describe, expect, it } from 'vitest';
import { begin, progressOf, type, typeAll } from '../testing/harness';
import { resolve } from './reducer';
import { getAffordances, type Affordance } from './affordances';
import type { GameAction, GameState } from './types';
import { FLAGS } from '../content/flags';
import { OBJECTIVES } from '../content/text';

/**
 * Selectable mode plays by finding a button and clicking it. These helpers do
 * exactly what the panel does — look up the affordance list the engine
 * produced, then dispatch its action — so a passing test means the buttons
 * really can finish the chapter.
 */
function click(state: GameState, find: (a: Affordances) => Affordance | undefined): GameState {
  const affordances = getAffordances(state);
  const affordance = find(affordances);
  if (!affordance) {
    throw new Error(
      `No such button available at ${state.locationId}. ` +
        `Objects: ${affordances.objects.map((o) => o.id).join(', ')}. ` +
        `Exits: ${affordances.exits.map((e) => e.key).join(', ')}.`
    );
  }
  return resolve(state, affordance.action).state;
}

type Affordances = ReturnType<typeof getAffordances>;

const exit = (label: string) => (a: Affordances) =>
  a.exits.find((e) => e.key === `exit-${label}`);
const objectVerb = (objectId: string, verb: string) => (a: Affordances) =>
  a.objects.find((o) => o.id === objectId)?.actions.find((x) => x.key === `${objectId}-${verb}`);
const objectExtra = (objectId: string, key: string) => (a: Affordances) =>
  a.objects.find((o) => o.id === objectId)?.actions.find((x) => x.key === key);
const useOn = (item: string, target: string) => (a: Affordances) =>
  a.items.find((i) => i.id === item)?.useTargets.find((t) => t.key === `use-${item}-${target}`);
const placeIn = (item: string, target: string) => (a: Affordances) =>
  a.items.find((i) => i.id === item)?.placeTargets.find((t) => t.key === `place-${item}-${target}`);
const itemVerb = (item: string, verb: string) => (a: Affordances) =>
  a.items.find((i) => i.id === item)?.actions.find((x) => x.key === `item-${item}-${verb}`);
const person = (id: string) => (a: Affordances) => a.people.find((p) => p.key === `talk-${id}`);
const topic = (id: string) => (a: Affordances) => a.topics?.find((t) => t.key === `topic-${id}`);

describe('the two input modes are the same game', () => {
  it('reaches identical progress from identical intent, step for step', () => {
    const steps: Array<{ typed: string; chosen: (a: Affordances) => Affordance | undefined }> = [
      { typed: 'take lantern', chosen: objectVerb('home.lantern', 'take') },
      { typed: 'go down', chosen: exit('to_square') },
      { typed: 'examine plank', chosen: objectVerb('square.plank', 'examine') },
      { typed: 'go east', chosen: exit('to_workshop') },
      { typed: 'take wedge', chosen: objectVerb('workshop.wedge', 'take') },
      { typed: 'go west', chosen: exit('to_square') },
      { typed: 'go west', chosen: exit('to_cave_path') },
      { typed: 'examine stump', chosen: objectVerb('path.stump', 'examine') },
      { typed: 'go west', chosen: exit('to_entrance') },
      { typed: 'examine rope', chosen: objectVerb('entrance.rope', 'examine') },
      { typed: 'go in', chosen: exit('to_gallery') },
      { typed: 'examine relief', chosen: objectVerb('gallery.relief', 'examine') },
      { typed: 'go east', chosen: exit('to_sealed') },
      { typed: 'use wedge on shutter', chosen: useOn('wedge', 'sealed.shutter') },
      { typed: 'place lantern in alcove', chosen: placeIn('lantern', 'sealed.alcove') },
      { typed: 'light lantern', chosen: objectExtra('sealed.alcove', 'light-lantern-in-place') },
      { typed: 'examine wall', chosen: objectVerb('sealed.wall', 'examine') },
      { typed: 'open seam', chosen: objectVerb('sealed.seam', 'open') },
      { typed: 'take lantern', chosen: objectExtra('sealed.alcove', 'retrieve-lantern') },
      { typed: 'take wedge', chosen: objectExtra('sealed.shutter', 'retrieve-wedge') },
      { typed: 'go down', chosen: exit('to_deep') },
      { typed: 'examine threshold', chosen: objectVerb('deep.threshold', 'examine') },
      { typed: 'enter threshold', chosen: objectVerb('deep.threshold', 'cross') },
      { typed: 'go up', chosen: exit('to_entrance') },
      { typed: 'go east', chosen: exit('to_square') },
      { typed: 'talk to saffra', chosen: person('saffra') },
      { typed: 'cave', chosen: topic('cave') },
      { typed: 'wanderer', chosen: topic('wanderer') },
    ];

    let typed = begin('basilia');
    let selected = begin('basilia');

    for (const step of steps) {
      typed = type(typed, step.typed).state;
      selected = click(selected, step.chosen);
      expect(progressOf(selected), `after "${step.typed}"`).toEqual(progressOf(typed));
    }

    expect(typed.ended).toBe(true);
    expect(selected.ended).toBe(true);
  });
});

describe('end to end', () => {
  const EXPECTED_ORDER = [
    'present.home',
    'present.square',
    'present.workshop',
    'present.cave_path',
    'present.entrance',
    'present.outer_gallery',
    'present.echo_chamber',
    'present.sealed_chamber',
    'present.deep_chamber',
    'past.deep_chamber',
    'past.entrance',
    'past.square',
  ];

  it('completes the chapter by typing, visiting every location', () => {
    const state = typeAll(begin('basil'), [
      'examine lantern',
      'examine tag',
      'take lantern',
      'examine window',
      'down',
      'examine plank',
      'talk to sage',
      'the prophecy',
      'how old the prophecy is',
      'leave',
      'talk to marjoram',
      '2',
      'leave',
      'talk to mint',
      'why she said no',
      'whether the prophecy changes it',
      'what she thinks you should do',
      'leave',
      'talk to parsie',
      'why he is so excited',
      'the others who went in',
      'what he wants you to bring back',
      'leave',
      'east',
      'talk to oreg',
      'his own attempt at the rite',
      'the square room at the back',
      'leave',
      'take wedge',
      'west',
      'west',
      'talk to dilly',
      '1',
      '2',
      'leave',
      'talk to bay',
      '1',
      'the night he went in after dilly',
      'leave',
      'talk to rose and mary',
      'what it was actually like',
      'how far each of them got',
      'whether they found anything',
      'the plank, and whether it matters',
      'leave',
      'examine stump',
      'west',
      'examine lintel',
      'talk to tyme',
      'why they came up',
      'what it was like for them',
      'the prophecy',
      'anything you should know',
      'leave',
      'light lantern',
      'in',
      'examine scratches',
      'examine relief',
      'north',
      'examine words',
      'examine boot',
      'south',
      'east',
      'examine shutter',
      'open shutter',
      'examine alcove',
      'examine eye',
      'wedge shutter',
      'place lantern in alcove',
      'examine wall',
      'open seam',
      'take lantern',
      'take wedge',
      'down',
      'examine threshold',
      'enter threshold',
      'examine tool work',
      'up',
      'examine mouth',
      'east',
      'examine tree',
      'examine well',
      'examine building',
      'talk to saffra',
      'the cave on the hill',
      'whether the cave has a name',
      'whether anything is coming',
    ]);

    expect(state.ended).toBe(true);
    expect(state.era).toBe('past');
    expect(state.locationId).toBe('past.square');
    expect(state.objective).toBe(OBJECTIVES.ended);
    expect([...state.visited].sort()).toEqual([...EXPECTED_ORDER].sort());
    expect(state.journal.length).toBeGreaterThan(12);
    // Nothing in this run should have been rejected as nonsense.
    expect(state.transcript.filter((e) => e.kind === 'failure')).toEqual([]);
  });

  it('completes the chapter by clicking, with no typing at all', () => {
    let state = begin('basilia');
    const path: Array<(a: Affordances) => Affordance | undefined> = [
      objectVerb('home.lantern', 'take'),
      exit('to_square'),
      objectVerb('square.plank', 'examine'),
      person('sage'),
      topic('prophecy'),
      person('mint'),
      topic('declined'),
      exit('to_workshop'),
      person('oreg'),
      topic('his_attempt'),
      objectVerb('workshop.wedge', 'take'),
      exit('to_square'),
      exit('to_cave_path'),
      person('dilly'),
      topic('her_rite'),
      topic('how_lost'),
      topic('what_she_saw'),
      person('rose_and_mary'),
      topic('what_its_like'),
      exit('to_entrance'),
      person('tyme'),
      topic('their_rite'),
      itemVerb('lantern', 'light'),
      exit('to_gallery'),
      objectVerb('gallery.relief', 'examine'),
      exit('to_echo'),
      objectVerb('echo.account', 'examine'),
      exit('to_gallery'),
      exit('to_sealed'),
      objectVerb('sealed.shutter', 'open'),
      objectVerb('sealed.alcove', 'examine'),
      useOn('wedge', 'sealed.shutter'),
      placeIn('lantern', 'sealed.alcove'),
      objectVerb('sealed.wall', 'examine'),
      objectVerb('sealed.seam', 'open'),
      objectExtra('sealed.alcove', 'retrieve-lantern'),
      objectExtra('sealed.shutter', 'retrieve-wedge'),
      exit('to_deep'),
      objectVerb('deep.threshold', 'examine'),
      objectVerb('deep.threshold', 'cross'),
      exit('to_entrance'),
      exit('to_square'),
      person('saffra'),
      topic('cave'),
      topic('wanderer'),
    ];
    for (const step of path) state = click(state, step);

    expect(state.ended).toBe(true);
    expect(state.locationId).toBe('past.square');
    expect([...state.visited].sort()).toEqual([...EXPECTED_ORDER].sort());
  });
});

describe('the documented shortest route', () => {
  /**
   * Kept identical to the twenty-command route in docs/WALKTHROUGH.md, so the
   * walkthrough cannot drift away from the game.
   */
  const SHORTEST = [
    'take lantern',
    'down',
    'east',
    'take wedge',
    'west',
    'west',
    'west',
    'in',
    'east',
    'use wedge on shutter',
    'place lantern in alcove',
    'light lantern',
    'open seam',
    'down',
    'enter threshold',
    'up',
    'east',
    'talk to saffra',
    'cave',
    'whether anything is coming',
  ];

  it('finishes the chapter with nothing refused along the way', () => {
    let state = begin('basil');
    for (const line of SHORTEST) {
      const result = type(state, line);
      expect(result.accepted, `"${line}" was refused at ${state.locationId}`).toBe(true);
      state = result.state;
    }
    expect(SHORTEST).toHaveLength(20);
    expect(state.ended).toBe(true);
    expect(state.locationId).toBe('past.square');
    expect(state.objective).toBe(OBJECTIVES.ended);
  });

  it('does not require the lantern to be lit to get through the cave', () => {
    const atSealed = typeAll(begin(), SHORTEST.slice(0, 9));
    expect(atSealed.locationId).toBe('present.sealed_chamber');
    expect(atSealed.flags[FLAGS.lanternLit]).toBeUndefined();
  });

  it('still completes if the player crosses having left both items behind', () => {
    // Leaving the lantern in the alcove and the wedge under the shutter puts
    // both of them permanently out of reach once the crossing is made. Nothing
    // after the crossing may need either of them.
    let state = typeAll(begin(), SHORTEST.slice(0, 13));
    expect(state.flags[FLAGS.passageOpen]).toBe(true);
    expect(state.inventory).toEqual([]);
    state = typeAll(state, ['down', 'enter threshold']);
    expect(state.inventory).toEqual([]);
    state = typeAll(state, ['up', 'east', 'talk to saffra', 'cave', 'whether anything is coming']);
    expect(state.ended).toBe(true);
  });

  it('does not require the echo chamber or any conversation before the cave', () => {
    const solved = typeAll(begin(), SHORTEST.slice(0, 13));
    expect(solved.flags[FLAGS.passageOpen]).toBe(true);
    expect(solved.visited).not.toContain('present.echo_chamber');
    expect(solved.discovered.filter((id) => id.startsWith('topic.'))).toEqual([]);
  });
});

describe('selectable mode can reach everything typing can', () => {
  it('can pick an item back up after putting it down', () => {
    // A player who only ever clicks must not be able to lose the lantern.
    let state = typeAll(begin(), ['take lantern', 'down']);
    state = click(state, itemVerb('lantern', 'drop'));
    expect(state.inventory).toEqual([]);

    const dropped = getAffordances(state).objects.find((o) => o.id === 'lantern');
    expect(dropped, 'the dropped lantern is listed among the things here').toBeDefined();
    expect(dropped!.actions.map((a) => a.label)).toEqual(['Examine', 'Take']);

    state = click(state, objectVerb('lantern', 'take'));
    expect(state.inventory).toEqual(['lantern']);
  });

  it('lists a dropped item only in the room it was left in', () => {
    let state = typeAll(begin(), ['take lantern', 'down', 'drop lantern']);
    expect(getAffordances(state).objects.some((o) => o.id === 'lantern')).toBe(true);
    state = typeAll(state, ['east']);
    expect(getAffordances(state).objects.some((o) => o.id === 'lantern')).toBe(false);
    state = typeAll(state, ['west']);
    expect(getAffordances(state).objects.some((o) => o.id === 'lantern')).toBe(true);
  });

  it('can still finish the chapter after dropping and recovering both items', () => {
    let state = typeAll(begin(), ['take lantern', 'down', 'east', 'take wedge']);
    state = typeAll(state, ['drop lantern', 'drop wedge']);
    state = click(state, objectVerb('lantern', 'take'));
    state = click(state, objectVerb('wedge', 'take'));
    expect(state.inventory).toEqual(expect.arrayContaining(['lantern', 'wedge']));
    const finished = typeAll(state, [
      'west',
      'west',
      'west',
      'in',
      'east',
      'use wedge on shutter',
      'place lantern in alcove',
      'light lantern',
      'open seam',
      'down',
      'enter threshold',
      'up',
      'east',
      'talk to saffra',
      'cave',
      'whether anything is coming',
    ]);
    expect(finished.ended).toBe(true);
  });
});

describe('selectable mode gives nothing away', () => {
  it('offers no label phrased in terms of what it will achieve', () => {
    const sealed = typeAll(begin(), [
      'take lantern',
      'down',
      'east',
      'take wedge',
      'west',
      'west',
      'west',
      'in',
      'east',
    ]);
    const labels = collectLabels(getAffordances(sealed));
    for (const label of labels) {
      expect(label.toLowerCase(), label).not.toMatch(
        /secret|hidden|reveal|solve|passage|solution|unlock/
      );
    }
  });

  it('shows only discovered things', () => {
    const sealed = typeAll(begin(), ['take lantern', 'down', 'west', 'west', 'in', 'east']);
    const ids = getAffordances(sealed).objects.map((o) => o.id);
    expect(ids).toContain('sealed.shutter');
    expect(ids).not.toContain('sealed.alcove');
    expect(ids).not.toContain('sealed.seam');
    expect(ids).not.toContain('sealed.passage');
  });

  it('offers a modest set of plausible item targets, several of them wrong', () => {
    const sealed = typeAll(begin(), [
      'take lantern',
      'down',
      'east',
      'take wedge',
      'west',
      'west',
      'west',
      'in',
      'east',
      'open shutter',
    ]);
    const targets = getAffordances(sealed).items.find((i) => i.id === 'wedge')!.useTargets;
    const ids = targets.map((t) => t.key.replace('use-wedge-', ''));
    expect(ids).toContain('sealed.shutter');
    expect(ids).toContain('sealed.alcove');
    expect(ids).toContain('sealed.eye');
    expect(ids.length).toBeLessThanOrEqual(6);

    // The wrong ones must fail with an explanation, not silently.
    const wrong = resolve(sealed, { type: 'USE', item: 'wedge', target: 'sealed.eye' });
    expect(wrong.accepted).toBe(false);
    expect(wrong.events[0]!.text.length).toBeGreaterThan(40);
  });

  it('keeps the crossing an explicit choice rather than a side effect', () => {
    const deep = typeAll(begin(), [
      'take lantern',
      'down',
      'east',
      'take wedge',
      'west',
      'west',
      'west',
      'in',
      'east',
      'use wedge on shutter',
      'place lantern in alcove',
      'light lantern',
      'open seam',
      'down',
    ]);
    const threshold = getAffordances(deep).objects.find((o) => o.id === 'deep.threshold')!;
    const crossing = threshold.actions.find((a) => a.key === 'deep.threshold-cross')!;
    expect(crossing.action).toEqual<GameAction>({ type: 'CROSS_THRESHOLD' });
    expect(deep.flags[FLAGS.crossed]).toBeUndefined();
  });
});

function collectLabels(a: Affordances): string[] {
  const labels = [
    ...a.exits.map((x) => x.label),
    ...a.people.map((x) => x.label),
    ...a.meta.map((x) => x.label),
    ...(a.topics ?? []).map((x) => x.label),
  ];
  for (const object of a.objects) {
    labels.push(object.name, ...object.actions.map((x) => x.label));
  }
  for (const item of a.items) {
    labels.push(
      item.name,
      ...item.actions.map((x) => x.label),
      ...item.useTargets.map((x) => x.label),
      ...item.placeTargets.map((x) => x.label)
    );
  }
  return labels;
}
