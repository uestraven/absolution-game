import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, begin, progressOf, type, typeAll } from '../testing/harness';
import { getAffordances } from './affordances';
import { resolve } from './reducer';
import { ALL_LOCATION_IDS, LOCATIONS } from '../content/locations';
import { ALL_ITEM_IDS } from '../content/items';
import { PEOPLE } from '../content/dialogue';
import { FLAGS } from '../content/flags';
import {
  KEYS,
  loadBest,
  readSlot,
  serialize,
  storageAvailable,
  storageReadable,
  writeAutosave,
  writeCheckpoint,
} from '../persistence/storage';
import { validateSave } from '../persistence/validate';
import type { ItemId } from './types';

/**
 * Regression tests for the Milestone 1 defect list.
 *
 * Each block names the behaviour a player would notice, not the code that
 * implements it.
 */

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

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

/* ================================================================ *
 * 1. Loose items are recoverable in both modes
 * ================================================================ */

describe('a put-down item can always be picked back up', () => {
  function takeButtonFor(state: ReturnType<typeof begin>, item: ItemId) {
    const entry = getAffordances(state).objects.find((o) => o.id === item);
    return entry?.actions.find((a) => a.label === 'Take');
  }

  for (const item of ALL_ITEM_IDS) {
    it(`offers Examine and Take for a dropped ${item} in selectable mode`, () => {
      // Get both items in hand first, so either can be dropped anywhere.
      let state = typeAll(begin(), ['take lantern', 'down', 'east', 'take wedge', 'west']);
      state = type(state, `drop ${item}`).state;
      expect(state.inventory).not.toContain(item);

      const entry = getAffordances(state).objects.find((o) => o.id === item);
      expect(entry, `${item} should be listed among the things here`).toBeDefined();
      expect(entry!.actions.map((a) => a.label).sort()).toEqual(['Examine', 'Take']);

      const examined = resolve(state, entry!.actions[0]!.action);
      expect(examined.accepted).toBe(true);

      const taken = resolve(state, takeButtonFor(state, item)!.action);
      expect(taken.accepted).toBe(true);
      expect(taken.state.inventory).toContain(item);
    });

    it(`keeps a dropped ${item} recoverable after leaving and coming back`, () => {
      let state = typeAll(begin(), ['take lantern', 'down', 'east', 'take wedge', 'west']);
      state = type(state, `drop ${item}`).state;
      // Walk away, two rooms, then return.
      state = typeAll(state, ['north', 'down', 'up', 'south']);
      expect(state.locationId).toBe('present.square');
      expect(takeButtonFor(state, item), 'still takeable on return').toBeDefined();
      state = resolve(state, takeButtonFor(state, item)!.action).state;
      expect(state.inventory).toContain(item);
    });

    it(`keeps a dropped ${item} recoverable across a reload`, () => {
      let state = typeAll(begin(), ['take lantern', 'down', 'east', 'take wedge', 'west']);
      state = type(state, `drop ${item}`).state;
      expect(writeAutosave(state).working).toBe(true);

      const reloaded = loadBest().state!;
      expect(progressOf(reloaded)).toEqual(progressOf(state));
      expect(takeButtonFor(reloaded, item), 'takeable after reload').toBeDefined();
      const taken = resolve(reloaded, takeButtonFor(reloaded, item)!.action);
      expect(taken.state.inventory).toContain(item);
    });

    it(`lists a dropped ${item} only where it was left`, () => {
      let state = typeAll(begin(), ['take lantern', 'down', 'east', 'take wedge', 'west']);
      state = type(state, `drop ${item}`).state;
      state = typeAll(state, ['north']);
      expect(getAffordances(state).objects.some((o) => o.id === item)).toBe(false);
    });
  }

  it('does not expose an item resting in a fixture as a loose room item', () => {
    const state = typeAll(begin(), [...TO_SEALED, 'use wedge on shutter']);
    // The wedge is in the shutter; it is reachable through the shutter, not as
    // a loose item lying on the floor.
    const loose = getAffordances(state).objects.find((o) => o.id === 'wedge');
    expect(loose).toBeUndefined();
    const host = getAffordances(state).objects.find((o) => o.id === 'sealed.shutter')!;
    expect(host.actions.some((a) => a.key === 'retrieve-wedge')).toBe(true);
  });

  it('can light the lantern in place, from the alcove, with a button', () => {
    const state = typeAll(begin(), [
      ...TO_SEALED,
      'use wedge on shutter',
      'place lantern in alcove',
    ]);
    const alcove = getAffordances(state).objects.find((o) => o.id === 'sealed.alcove')!;
    const light = alcove.actions.find((a) => a.key === 'light-lantern-in-place');
    expect(light).toBeDefined();
    const lit = resolve(state, light!.action);
    expect(lit.state.flags[FLAGS.lanternLit]).toBe(true);
    expect(lit.state.flags[FLAGS.seamRevealed]).toBe(true);
  });
});

/* ================================================================ *
 * 2. Nothing essential can be stranded by the crossing
 * ================================================================ */

describe('the crossing cannot strand anything the player still needs', () => {
  const FINISH = [
    'up',
    'east',
    'talk to saffra',
    'the cave on the hill',
    'whether anything is coming',
  ];

  /** Every way the two items can be arranged at the moment of crossing. */
  const ARRANGEMENTS: Array<{ name: string; setup: string[] }> = [
    { name: 'both carried', setup: ['take lantern', 'take wedge'] },
    { name: 'both left in the fixtures', setup: [] },
    { name: 'lantern carried, wedge left in the shutter', setup: ['take lantern'] },
    { name: 'wedge carried, lantern left in the alcove', setup: ['take wedge'] },
    {
      name: 'both dropped on the deep chamber floor',
      setup: ['take lantern', 'take wedge', 'down', 'drop lantern', 'drop wedge'],
    },
    {
      name: 'both dropped back in the village',
      setup: ['take lantern', 'take wedge', 'west', 'out', 'drop lantern', 'drop wedge', 'in', 'east'],
    },
  ];

  for (const { name, setup } of ARRANGEMENTS) {
    it(`completes the chapter with ${name}`, () => {
      const solved = typeAll(begin(), [
        ...TO_SEALED,
        'use wedge on shutter',
        'place lantern in alcove',
        'light lantern',
        'open seam',
      ]);
      let state = typeAll(solved, setup);
      // Reach the threshold wherever the setup left us.
      if (state.locationId === 'present.sealed_chamber') state = typeAll(state, ['down']);
      expect(state.locationId).toBe('present.deep_chamber');

      const crossed = type(state, 'enter threshold');
      expect(crossed.accepted).toBe(true);
      const finished = typeAll(crossed.state, FINISH);
      expect(finished.ended, `could not finish with ${name}`).toBe(true);
    });
  }

  it('needs no item at all once the crossing is made', () => {
    const past = type(
      typeAll(begin(), [
        ...TO_SEALED,
        'use wedge on shutter',
        'place lantern in alcove',
        'light lantern',
        'open seam',
        'down',
      ]),
      'enter threshold'
    ).state;
    expect(past.inventory).toEqual([]);
    const finished = typeAll(past, FINISH);
    expect(finished.ended).toBe(true);
  });
});

/* ================================================================ *
 * 5. Fallback recovery and truthful write reporting
 * ================================================================ */

describe('a corrupt autosave never costs the player their backup', () => {
  it('keeps the good backup when the next autosave rotates', () => {
    const first = begin();
    writeAutosave(first);
    const second = type(first, 'take lantern').state;
    writeAutosave(second);
    expect(readSlot('backup').state).not.toBeNull();

    // Something corrupts the autosave slot. The player is served the backup.
    localStorage.setItem(KEYS.save, '{ not json');
    const loaded = loadBest();
    expect(loaded.slot).toBe('backup');

    // Playing on must not rotate those corrupt bytes over the good backup.
    const next = type(loaded.state!, 'look').state;
    expect(writeAutosave(next).working).toBe(true);
    const backup = readSlot('backup');
    expect(backup.state, 'the backup must still be loadable').not.toBeNull();
    expect(backup.error).toBeNull();
  });

  it('does not claim a quarantine that could not be written', () => {
    localStorage.setItem(KEYS.save, '{"schemaVersion":1,"character":"nobody"}');
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const outcome = loadBest();
    expect(outcome.state).toBeNull();
    expect(outcome.notes.join(' ')).toMatch(/could not be copied aside/);
    expect(outcome.notes.join(' ')).not.toMatch(/has been kept aside/);
    spy.mockRestore();
    // And the unreadable bytes are untouched.
    expect(localStorage.getItem(KEYS.save)).toBe('{"schemaVersion":1,"character":"nobody"}');
  });

  it('reports a failed checkpoint truthfully, and separately from the autosave', () => {
    const state = begin();
    const store = new Map<string, string>();
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation((key: string, value: string) => {
        // Only the checkpoint slot is refused.
        if (key === KEYS.checkpoint) throw new DOMException('full', 'QuotaExceededError');
        store.set(key, value);
      });

    const autosave = writeAutosave(state);
    const checkpoint = writeCheckpoint(state);

    expect(autosave.working, 'the autosave itself succeeded').toBe(true);
    expect(checkpoint.working, 'the checkpoint did not').toBe(false);
    expect(checkpoint.message).toBeTruthy();
    spy.mockRestore();
  });
});

describe('storage that can be read but not written', () => {
  it('still offers the save, keeps play going, and says so', () => {
    const saved = typeAll(begin(), TO_SEALED);
    expect(writeAutosave(saved).working).toBe(true);

    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    expect(storageReadable()).toBe(true);
    expect(storageAvailable()).toBe(false);

    const loaded = loadBest();
    expect(loaded.state).not.toBeNull();
    expect(progressOf(loaded.state!)).toEqual(progressOf(saved));

    // Play continues in memory, and the attempt is reported as failed.
    const next = type(loaded.state!, 'open shutter');
    expect(next.accepted).toBe(true);
    const report = writeAutosave(next.state);
    expect(report.working).toBe(false);
    expect(report.message).toMatch(/not being saved|not accepting/i);

    spy.mockRestore();
  });
});

/* ================================================================ *
 * 6. Names, pronouns, and old saves
 * ================================================================ */

describe('the renamed cast', () => {
  it('answers to the new display name and to the old one', () => {
    const square = typeAll(begin(), ['take lantern', 'down']);
    for (const [typed, personId] of [
      ['talk to sage', 'orla'],
      ['talk to orla', 'orla'],
      ['talk to marjoram', 'marda'],
      ['talk to marda', 'marda'],
      ['talk to parsie', 'hesk'],
      ['talk to hesk', 'hesk'],
    ] as const) {
      const result = type(square, typed);
      expect(result.accepted, typed).toBe(true);
      expect(result.state.pending).toMatchObject({ kind: 'conversation', personId });
    }
  });

  it('loads a save written before the renaming, including a heard topic', () => {
    // A save from the earlier build: old person ids, no markup in the
    // transcript, and a topic recorded under the old id.
    const legacy = typeAll(begin(), ['take lantern', 'down', 'east', 'talk to oreg']);
    const payload = JSON.parse(serialize(legacy)) as Record<string, unknown>;
    payload.transcript = [{ id: 't1', kind: 'narration', text: 'Tolv looks up from the bench.' }];
    payload.discovered = [...(payload.discovered as string[]), 'topic.tolv.wedge'];

    const result = validateSave(payload, JSON.stringify(payload).length);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.pending).toMatchObject({ kind: 'conversation', personId: 'tolv' });
    expect(result.state.transcript[0]!.text).toBe('Tolv looks up from the bench.');

    // And it keeps playing.
    const continued = type(result.state, 'his own attempt at the rite');
    expect(continued.accepted).toBe(true);
    expect(continued.state.flags[FLAGS.heardFoundNothing]).toBe(true);
  });

  it('keeps the gating topic id that past-era saves depend on', () => {
    const past = typeAll(begin(), [
      ...TO_SEALED,
      'use wedge on shutter',
      'place lantern in alcove',
      'light lantern',
      'open seam',
      'down',
      'enter threshold',
      'up',
      'east',
      'talk to saffra',
      'the cave on the hill',
    ]);
    expect(past.discovered).toContain('topic.sabra.cave');
  });
});

/* ================================================================ *
 * 7. Direction aliases
 * ================================================================ */

describe('ways out of a room are unambiguous', () => {
  it('never lets two exits in one room answer to the same word', () => {
    for (const id of ALL_LOCATION_IDS) {
      const claims = new Map<string, string[]>();
      for (const exit of LOCATIONS[id].exits) {
        const words = [exit.direction, ...(exit.aliases ?? [])].filter(
          (w): w is string => typeof w === 'string'
        );
        for (const word of words) {
          claims.set(word, [...(claims.get(word) ?? []), exit.id]);
        }
      }
      for (const [word, owners] of claims) {
        expect(owners, `"${word}" is claimed by ${owners.join(' and ')} in ${id}`).toHaveLength(1);
      }
    }
  });

  it('never lets an alias name a compass direction another exit uses', () => {
    for (const id of ALL_LOCATION_IDS) {
      const exits = LOCATIONS[id].exits;
      const directions = new Map(
        exits.filter((e) => e.direction).map((e) => [e.direction as string, e.id])
      );
      for (const exit of exits) {
        for (const alias of exit.aliases ?? []) {
          const owner = directions.get(alias);
          if (owner && owner !== exit.id) {
            throw new Error(
              `${id}: "${alias}" is an alias of ${exit.id} but the direction of ${owner}`
            );
          }
        }
      }
    }
  });

  it('resolves every authored word to the exit that authored it', () => {
    // Walk the map and check each word actually moves where it claims.
    const start = typeAll(begin(), ['take lantern']);
    for (const id of ALL_LOCATION_IDS) {
      for (const exit of LOCATIONS[id].exits) {
        if (exit.requires && !exit.requires(start)) continue;
        const words = [exit.direction, ...(exit.aliases ?? [])].filter(
          (w): w is string => typeof w === 'string'
        );
        for (const word of words) {
          const here = { ...start, locationId: id, era: LOCATIONS[id].era, visited: [id] };
          const moved = act(here, { type: 'GO', target: word });
          expect(moved.state.locationId, `"${word}" from ${id}`).toBe(exit.to);
        }
      }
    }
  });
});

/* ================================================================ *
 * 6b. Pronouns survive the rename
 * ================================================================ */

describe('both characters', () => {
  it('are addressed correctly by the renamed cast', () => {
    const path = ['take lantern', 'down', 'examine plank'];
    const boy = type(typeAll(begin('basil'), path), 'talk to parsie');
    const girl = type(typeAll(begin('basilia'), path), 'talk to parsie');
    expect(boy.events.map((e) => e.text).join()).toContain('he read the plank');
    expect(girl.events.map((e) => e.text).join()).toContain('she read the plank');
  });

  it('keeps every person reachable under their display name', () => {
    for (const person of Object.values(PEOPLE)) {
      expect(person.nouns, person.name).toContain(person.name.toLowerCase());
    }
  });
});
