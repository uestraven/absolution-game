import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  KEYS,
  clearProgress,
  exportBlob,
  hasAnySave,
  importFromText,
  loadBest,
  readPrefs,
  readSlot,
  serialize,
  storageAvailable,
  storageReadable,
  writeAutosave,
  writeCheckpoint,
  writePrefs,
} from './storage';
import { MAX_SAVE_BYTES, validateSave } from './validate';
import { begin, progressOf, type, typeAll } from '../testing/harness';
import { SCHEMA_VERSION } from '../engine/types';
import { FLAGS } from '../content/flags';

const MID_PUZZLE = [
  'take lantern',
  'down',
  'east',
  'take wedge',
  'west',
  'west',
  'west',
  'in',
  'examine relief',
  'east',
  'use wedge on shutter',
];

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('round trip', () => {
  it('survives serialise, parse and validate unchanged', () => {
    const state = typeAll(begin('basilia'), MID_PUZZLE);
    const result = validateSave(JSON.parse(serialize(state)), serialize(state).length);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state).toEqual(state);
  });

  it('survives export and import', async () => {
    const state = typeAll(begin('basil'), MID_PUZZLE);
    const text = await exportBlob(state).text();
    const imported = importFromText(text);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.state).toEqual(state);
  });

  it('resumes play identically after a reload mid-puzzle', () => {
    const before = typeAll(begin('basil'), MID_PUZZLE);
    expect(before.flags[FLAGS.shutterHeld]).toBe(true);
    expect(before.flags[FLAGS.passageOpen]).toBeUndefined();

    expect(writeAutosave(before).working).toBe(true);
    const reloaded = loadBest();
    expect(reloaded.state).not.toBeNull();
    expect(progressOf(reloaded.state!)).toEqual(progressOf(before));

    // Finishing the puzzle after the reload works exactly as before it would.
    const finishedFresh = typeAll(before, ['place lantern in alcove', 'light lantern', 'open seam']);
    const finishedAfterReload = typeAll(reloaded.state!, [
      'place lantern in alcove',
      'light lantern',
      'open seam',
    ]);
    expect(finishedAfterReload.flags[FLAGS.passageOpen]).toBe(true);
    expect(progressOf(finishedAfterReload)).toEqual(progressOf(finishedFresh));
  });

  it('resumes a pending conversation, keeping the topics it had', () => {
    const talking = typeAll(begin(), ['take lantern', 'down', 'east', 'talk to oreg']);
    expect(talking.pending?.kind).toBe('conversation');
    writeAutosave(talking);
    const reloaded = loadBest().state!;
    expect(reloaded.pending).toEqual(talking.pending);
    const answered = type(reloaded, 'his own attempt at the rite');
    expect(answered.accepted).toBe(true);
    expect(answered.state.flags[FLAGS.heardFoundNothing]).toBe(true);
  });

  it('resumes a pending disambiguation and still accepts a number', () => {
    const sealed = typeAll(begin(), MID_PUZZLE);
    const asked = type(sealed, 'examine stone');
    expect(asked.state.pending?.kind).toBe('clarification');
    writeAutosave(asked.state);
    const reloaded = loadBest().state!;
    expect(reloaded.pending).toEqual(asked.state.pending);
    const chosen = type(reloaded, '1');
    expect(chosen.accepted).toBe(true);
    expect(chosen.state.pending).toBeNull();
  });

  it('crosses eras atomically: the stored save is never half-crossed', () => {
    const atThreshold = typeAll(begin(), [
      ...MID_PUZZLE,
      'place lantern in alcove',
      'light lantern',
      'open seam',
      'down',
    ]);
    const crossed = type(atThreshold, 'enter threshold').state;
    expect(writeAutosave(crossed).working).toBe(true);
    const reloaded = loadBest().state!;
    expect(reloaded.era).toBe('past');
    expect(reloaded.locationId).toBe('past.deep_chamber');
    expect(reloaded.chapter).toBe('crossing');
    expect(reloaded.flags[FLAGS.crossed]).toBe(true);
  });
});

describe('slots', () => {
  it('keeps a backup of the previous autosave', () => {
    const first = begin();
    writeAutosave(first);
    const second = type(first, 'take lantern').state;
    writeAutosave(second);

    expect(readSlot('save').state!.inventory).toEqual(['lantern']);
    expect(readSlot('backup').state!.inventory).toEqual([]);
  });

  it('keeps a chapter checkpoint that restart can go back to', () => {
    const start = begin();
    writeCheckpoint(start);
    const later = typeAll(start, MID_PUZZLE);
    writeAutosave(later);

    const checkpoint = readSlot('checkpoint').state!;
    expect(checkpoint.locationId).toBe('present.home');
    expect(checkpoint.inventory).toEqual([]);
    expect(readSlot('save').state!.locationId).toBe('present.sealed_chamber');
  });

  it('falls back to the backup when the autosave is corrupt', () => {
    const first = begin();
    writeAutosave(first);
    const second = type(first, 'take lantern').state;
    writeAutosave(second);
    localStorage.setItem(KEYS.save, '{ this is not json');

    const outcome = loadBest();
    expect(outcome.slot).toBe('backup');
    expect(outcome.state!.inventory).toEqual([]);
    expect(outcome.notes.join(' ')).toContain('backup save');
  });

  it('falls back to the checkpoint when autosave and backup are both corrupt', () => {
    const start = begin();
    writeCheckpoint(start);
    localStorage.setItem(KEYS.save, 'nonsense');
    localStorage.setItem(KEYS.backup, '{}');

    const outcome = loadBest();
    expect(outcome.slot).toBe('checkpoint');
    expect(outcome.state!.locationId).toBe('present.home');
  });

  it('quarantines unreadable bytes instead of replacing them with a new game', () => {
    localStorage.setItem(KEYS.save, '{"schemaVersion":1,"character":"nobody"}');
    const outcome = loadBest();
    expect(outcome.state).toBeNull();
    expect(outcome.quarantined).toBe(true);
    expect(localStorage.getItem(KEYS.quarantine)).toBe(
      '{"schemaVersion":1,"character":"nobody"}'
    );

    clearProgress();
    expect(localStorage.getItem(KEYS.save)).toBeNull();
    // The broken bytes are still there to be recovered.
    expect(localStorage.getItem(KEYS.quarantine)).not.toBeNull();
  });

  it('reports no save when nothing has ever been written', () => {
    expect(hasAnySave()).toBe(false);
    const outcome = loadBest();
    expect(outcome.state).toBeNull();
    expect(outcome.quarantined).toBe(false);
    expect(outcome.notes).toEqual([]);
  });
});

describe('storage failure is reported, never pretended away', () => {
  it('says progress is not being saved when writing throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const result = writeAutosave(begin());
    expect(result.working).toBe(false);
    expect(result.message).toContain('not being saved');
    expect(result.message).toContain('Export Save');
    spy.mockRestore();
  });

  it('reports unavailable storage rather than claiming success', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(storageAvailable()).toBe(false);
    const result = writeAutosave(begin());
    expect(result.working).toBe(false);
    expect(result.message).toContain('not being saved');
    spy.mockRestore();
  });

  it('still loads an existing save when writing is impossible', () => {
    // The player's progress must stay reachable precisely when saving breaks:
    // that is when they need Continue and Export most.
    const saved = typeAll(begin(), MID_PUZZLE);
    expect(writeAutosave(saved).working).toBe(true);

    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    expect(storageAvailable()).toBe(false);
    expect(storageReadable()).toBe(true);

    const outcome = loadBest();
    expect(outcome.state).not.toBeNull();
    expect(outcome.slot).toBe('save');
    expect(progressOf(outcome.state!)).toEqual(progressOf(saved));
    expect(readSlot('save').state).not.toBeNull();
    expect(readSlot('checkpoint').state).toBeNull();

    spy.mockRestore();
  });

  it('can still export what it loaded while writing is impossible', async () => {
    const saved = typeAll(begin(), MID_PUZZLE);
    writeAutosave(saved);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const loaded = loadBest().state!;
    const text = await exportBlob(loaded).text();
    const reimported = importFromText(text);
    expect(reimported.ok).toBe(true);
    spy.mockRestore();
  });

  it('reports unreadable storage separately from unwritable storage', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(loadBest().state).toBeNull();
    expect(loadBest().quarantined).toBe(false);
    spy.mockRestore();
  });
});

describe('preferences are stored apart from progress', () => {
  it('survives clearing progress', () => {
    writePrefs({ inputMode: 'type', largeText: true });
    writeAutosave(begin());
    clearProgress();
    expect(readPrefs()).toEqual({ inputMode: 'type', largeText: true });
    expect(hasAnySave()).toBe(false);
  });

  it('falls back to defaults for junk', () => {
    localStorage.setItem(KEYS.prefs, 'not json');
    expect(readPrefs().inputMode).toBe('select');
    localStorage.setItem(KEYS.prefs, '{"inputMode":"telepathy","largeText":"yes"}');
    expect(readPrefs()).toEqual({ inputMode: 'select', largeText: false });
  });
});

describe('imports are validated before anything is touched', () => {
  const valid = () => typeAll(begin(), MID_PUZZLE);

  function corrupt(change: (data: Record<string, unknown>) => void): string {
    const data = JSON.parse(serialize(valid())) as Record<string, unknown>;
    change(data);
    return JSON.stringify(data);
  }

  const cases: Array<[string, string, RegExp]> = [
    ['not JSON at all', 'definitely not json', /not valid JSON/],
    ['a JSON array', '[1,2,3]', /not a save file/],
    ['a bare number', '42', /not a save file/],
    [
      'no schema version',
      corrupt((d) => delete d.schemaVersion),
      /no usable save-format version/,
    ],
    [
      'a newer schema version',
      corrupt((d) => (d.schemaVersion = SCHEMA_VERSION + 1)),
      /newer version of the game/,
    ],
    [
      'an unshipped older version',
      corrupt((d) => (d.schemaVersion = 0)),
      /not one this build knows/,
    ],
    ['an unknown character', corrupt((d) => (d.character = 'basilisk')), /name a character/],
    ['no character', corrupt((d) => (d.character = null)), /name a character/],
    ['an unknown location', corrupt((d) => (d.locationId = 'present.dungeon')), /somewhere this story/],
    [
      'an era that contradicts the location',
      corrupt((d) => (d.era = 'past')),
      /era and its location disagree/,
    ],
    ['an unknown chapter', corrupt((d) => (d.chapter = 'finale')), /unknown chapter/],
    ['an unknown item', corrupt((d) => (d.inventory = ['sword'])), /item this story does not have/],
    [
      'an unknown item position',
      corrupt((d) => (d.placements = { sword: { kind: 'carried' } })),
      /positions an item this story does not have/,
    ],
    [
      'a position in a fixture that does not exist',
      corrupt((d) => (d.placements = { lantern: { kind: 'fixture', fixtureId: 'nope' } })),
      /unreadable position/,
    ],
    [
      'an undeclared flag',
      corrupt((d) => ((d.flags as Record<string, unknown>).wish_granted = true)),
      /flag this story does not have/,
    ],
    [
      'a flag holding an object',
      corrupt((d) => ((d.flags as Record<string, unknown>)[FLAGS.lanternLit] = { a: 1 })),
      /non-primitive value/,
    ],
    ['an unreadable journal', corrupt((d) => (d.journal = ['just a string'])), /unreadable journal/],
    ['an unknown visited place', corrupt((d) => (d.visited = ['present.moon'])), /place this story/],
    ['unreadable counters', corrupt((d) => (d.turn = 'five')), /unreadable counters/],
    ['an unreadable ended flag', corrupt((d) => (d.ended = 'yes')), /unreadable completion state/],
    [
      'a pending conversation with nobody',
      corrupt((d) => (d.pending = { kind: 'conversation', personId: 'ghost', heard: [] })),
      /unreadable pending choice/,
    ],
    [
      'an item carried without being in the inventory',
      corrupt((d) => {
        d.inventory = [];
        d.placements = { lantern: { kind: 'carried' } };
      }),
      /marks "lantern" as carried but does not list it/,
    ],
    [
      'the same item listed twice',
      corrupt((d) => {
        d.inventory = ['lantern', 'lantern'];
        d.placements = { lantern: { kind: 'carried' } };
      }),
      /same item in the inventory twice/,
    ],
    [
      'a pending option with an action the engine does not have',
      corrupt((d) => {
        d.pending = {
          kind: 'clarification',
          question: 'Which one?',
          options: [{ label: 'x', action: { type: 'LAUNCH_MISSILES' } }],
        };
      }),
      /unreadable pending choice/,
    ],
    [
      'a pending option whose action is missing its target',
      corrupt((d) => {
        d.pending = {
          kind: 'clarification',
          question: 'Which one?',
          options: [{ label: 'x', action: { type: 'EXAMINE' } }],
        };
      }),
      /unreadable pending choice/,
    ],
    [
      'a pending conversation claiming a topic that person does not have',
      corrupt((d) => {
        d.pending = { kind: 'conversation', personId: 'oreg', heard: ['the_moon'] };
      }),
      /unreadable pending choice/,
    ],
    [
      'an item both carried and stored',
      corrupt((d) => {
        d.inventory = ['lantern'];
        d.placements = { lantern: { kind: 'fixture', fixtureId: 'sealed.alcove' } };
      }),
      /both carries and stores/,
    ],
  ];

  for (const [name, payload, expected] of cases) {
    it(`refuses ${name}`, () => {
      const result = importFromText(payload);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(expected);
    });
  }

  it('refuses an oversized file without parsing it', () => {
    const huge = 'x'.repeat(MAX_SAVE_BYTES + 1);
    const result = importFromText(huge);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/too large/);
  });

  it('leaves the stored save untouched when an import is refused', () => {
    const good = valid();
    writeAutosave(good);
    const before = localStorage.getItem(KEYS.save);
    const result = importFromText('{"schemaVersion":1}');
    expect(result.ok).toBe(false);
    expect(localStorage.getItem(KEYS.save)).toBe(before);
    expect(readSlot('save').state!.locationId).toBe('present.sealed_chamber');
  });

  it('strips anything but text out of an imported transcript', () => {
    const payload = corrupt((d) => {
      d.transcript = [
        { id: 't1', kind: 'narration', text: '<img src=x onerror=alert(1)>' },
        { id: 't2', kind: 'narration', text: 'fine', extra: { nasty: true } },
        { id: 't3', kind: 'not-a-kind', text: 'dropped' },
        'not an entry',
      ];
    });
    const result = importFromText(payload);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.transcript).toEqual([
      { id: 't1', kind: 'narration', text: '<img src=x onerror=alert(1)>' },
      { id: 't2', kind: 'narration', text: 'fine' },
    ]);
  });

  it('accepts a save that merely has an empty transcript', () => {
    const payload = corrupt((d) => (d.transcript = []));
    const result = importFromText(payload);
    expect(result.ok).toBe(true);
  });
});

describe('export file naming', () => {
  it('uses a filename that gives nothing about the story away', async () => {
    const { EXPORT_FILENAME } = await import('./storage');
    expect(EXPORT_FILENAME).toBe('adventure-save.json');
    expect(EXPORT_FILENAME).not.toMatch(/cave|wanderer|prophecy|absolution|past/i);
  });
});
