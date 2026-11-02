import { beforeEach, describe, expect, it } from 'vitest';
import {
  CROSS_FIRST,
  FENN_ROUTE,
  GO_FORWARD,
  PAST_TO_SQUARE,
  READ_PANEL,
  RECITE,
  SAFFRA_REALISATION,
  SOLVE_RELIEF,
  TO_SEALED,
  begin,
  finishChapterThree,
  hasReturned,
  type,
  typeAll,
} from '../testing/harness';
import { KEYS, importFromText, loadBest, serialize, writeAutosave } from './storage';
import { validateSave } from './validate';
import { SCHEMA_VERSION } from '../engine/types';
import { FLAGS } from '../content/flags';
import { OBJECTIVES } from '../content/text';
import type { GameState } from '../engine/types';

/**
 * The 1 → 2 save migration.
 *
 * Format 2 is the first time this project has had to migrate anything, and the
 * thing it has to get right is a save that stopped where the prototype
 * stopped: `ended: true` in the past square. That position is playable now, so
 * it has to come back as a game in progress and not as a finished one — without
 * clearing anything else, and without replaying the chapter.
 */

beforeEach(() => {
  localStorage.clear();
});

/** A real state, written back out as the format-1 file it would have been. */
function asFormat1(state: GameState): Record<string, unknown> {
  return { ...JSON.parse(serialize(state)), schemaVersion: 1 };
}

/** Where a format-1 save could be mid-opening: in the cave, puzzle half-done. */
function midOpeningV1(): Record<string, unknown> {
  return asFormat1(typeAll(begin('basilia'), [...TO_SEALED, 'use wedge on shutter']));
}

/**
 * Where a format-1 save could be at the old end-of-prototype marker.
 *
 * The current engine does not produce this any more, so it is built the way a
 * real one was: the full opening, the crossing, the square, the conversation
 * that used to end the chapter — and then the two fields the old build set.
 */
function prototypeEndV1(): Record<string, unknown> {
  const real = typeAll(begin(), [
    ...TO_SEALED,
    ...SOLVE_RELIEF,
    ...CROSS_FIRST,
    ...PAST_TO_SQUARE,
    ...SAFFRA_REALISATION,
  ]);
  const file = asFormat1(real);
  file.ended = true;
  file.objective = 'End of the opening chapter.';
  (file.transcript as Array<Record<string, unknown>>).push({
    id: 'tLEGACY',
    kind: 'system',
    text: '— End of the opening chapter —\n\nThis is as far as the prototype goes.',
  });
  return file;
}

describe('a mid-opening format-1 save keeps every bit of its progress', () => {
  it('loads with inventory, flags, journal and position untouched', () => {
    const file = midOpeningV1();
    const result = validateSave(file);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const state = result.state;
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.character).toBe('basilia');
    expect(state.locationId).toBe('present.sealed_chamber');
    expect(state.era).toBe('present');
    expect(state.chapter).toBe('rite');
    expect(state.flags[FLAGS.shutterHeld]).toBe(true);
    expect(state.inventory).toEqual(file.inventory);
    expect(state.placements).toEqual(file.placements);
    expect(state.discovered).toEqual(file.discovered);
    expect(state.journal.map((e) => e.id)).toEqual(
      (file.journal as Array<{ id: string }>).map((e) => e.id)
    );
    expect(state.visited).toEqual(file.visited);
    expect(state.turn).toBe(file.turn);
    expect(state.ended).toBe(false);
  });

  it('carries on from exactly where it was, all the way to the new ending', () => {
    const loaded = validateSave(midOpeningV1());
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const end = typeAll(loaded.state, [
      'place lantern in alcove',
      'light lantern',
      'open seam',
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
    expect(hasReturned(finishChapterThree(end).state)).toBe(true);
  });

  it('does not add new item records to an old inventory', () => {
    const loaded = validateSave(midOpeningV1());
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    // The three items this chapter adds exist, but an old save has never seen
    // them and must not come back holding or positioning any of them.
    for (const added of ['stone', 'water_skins', 'mallet']) {
      expect(loaded.state.inventory).not.toContain(added);
      expect(loaded.state.placements[added]).toBeUndefined();
    }
  });
});

describe('a save that stopped at the old prototype marker becomes playable', () => {
  it('comes back as a game in progress, in the place it stopped', () => {
    const result = validateSave(prototypeEndV1());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const state = result.state;
    expect(state.ended, 'the story continues past this point now').toBe(false);
    expect(state.locationId).toBe('past.square');
    expect(state.era).toBe('past');
    expect(state.chapter).toBe('crossing');
    expect(state.objective).toBe(OBJECTIVES.home);
  });

  it('keeps the transcript it had, and corrects it rather than contradicting it', () => {
    const file = prototypeEndV1();
    const result = validateSave(file);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const text = result.state.transcript.map((e) => e.text).join('\n');
    // The historical entry is still there: it is what the player read.
    expect(text).toContain('This is as far as the prototype goes');
    // Followed by one line saying it is no longer true.
    expect(text).toContain('The story continues past this point now');
    expect(result.state.transcript[result.state.transcript.length - 1]!.id).toBe('t.m3.continues');
  });

  it('loses nothing else: every flag, journal line and discovery survives', () => {
    const file = prototypeEndV1();
    const result = validateSave(file);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.state.flags).toEqual(file.flags);
    expect(result.state.discovered).toEqual(file.discovered);
    expect(result.state.journal.map((e) => e.id)).toEqual(
      (file.journal as Array<{ id: string }>).map((e) => e.id)
    );
    expect(result.state.visited).toEqual(file.visited);
    expect(result.state.flags[FLAGS.heardNoProphecy]).toBe(true);
    expect(result.state.flags[FLAGS.crossed]).toBe(true);
  });

  it('does not replay the realisation the player has already read', () => {
    const result = validateSave(prototypeEndV1());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const looked = type(result.state, 'look');
    const text = looked.events.map((e) => e.text).join('\n');
    expect(text).not.toContain('You are a long way from home');
    expect(
      looked.state.journal.filter((e) => e.id === 'j.another_time'),
      'the realisation is latched on its journal entry'
    ).toHaveLength(1);
  });

  it('carries straight on into the new chapter', () => {
    const result = validateSave(prototypeEndV1());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const end = typeAll(result.state, [
      'talk to saffra',
      'why you asked',
      'recite prophecy',
      ...FENN_ROUTE,
      ...READ_PANEL,
      ...GO_FORWARD,
    ]);
    expect(end.locationId).toBe('future.deep_chamber');
    expect(end.chapter).toBe('future');
    expect(hasReturned(finishChapterThree(end).state)).toBe(true);
  });

  it('is idempotent: migrating the result again changes nothing', () => {
    const once = validateSave(prototypeEndV1());
    expect(once.ok).toBe(true);
    if (!once.ok) return;

    // Round-trip the migrated save back through the loader as a format-1 file,
    // which is the worst case: the fix-up must not fire a second time.
    const asOldAgain = { ...JSON.parse(serialize(once.state)), schemaVersion: 1 };
    const twice = validateSave(asOldAgain);
    expect(twice.ok).toBe(true);
    if (!twice.ok) return;
    expect(twice.state).toEqual(once.state);

    // And through the current format, which is the ordinary case.
    const asCurrent = validateSave(JSON.parse(serialize(once.state)));
    expect(asCurrent.ok).toBe(true);
    if (!asCurrent.ok) return;
    expect(asCurrent.state).toEqual(once.state);
    expect(
      asCurrent.state.transcript.filter((e) => e.id === 't.m3.continues'),
      'the notice is appended at most once'
    ).toHaveLength(1);
  });

  it('does not clear completion flags wholesale', () => {
    /*
     * The migration un-ends one specific position. A save that is `ended` for
     * some other reason is an edited file, and must be refused rather than
     * quietly repaired.
     */
    const elsewhere = { ...midOpeningV1(), ended: true };
    const result = validateSave(elsewhere);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/marked complete somewhere the current content cannot end/);
  });
});

describe('the migration runs on every route into the game', () => {
  it('runs for the autosave slot', () => {
    localStorage.setItem(KEYS.save, JSON.stringify(prototypeEndV1()));
    const outcome = loadBest();
    expect(outcome.state).not.toBeNull();
    expect(outcome.slot).toBe('save');
    expect(outcome.state!.ended).toBe(false);
    expect(outcome.state!.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('runs for the backup and checkpoint slots when the autosave is unreadable', () => {
    localStorage.setItem(KEYS.save, '{ not json');
    localStorage.setItem(KEYS.backup, JSON.stringify(prototypeEndV1()));
    const outcome = loadBest();
    expect(outcome.slot).toBe('backup');
    expect(outcome.state!.ended).toBe(false);
    expect(outcome.notes.join(' ')).toContain('backup save');
  });

  it('runs for an imported file', () => {
    const imported = importFromText(JSON.stringify(prototypeEndV1()));
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.state.ended).toBe(false);
    expect(imported.state.objective).toBe(OBJECTIVES.home);
  });

  it('rejects a newer format clearly, without touching it', () => {
    const future = { ...midOpeningV1(), schemaVersion: SCHEMA_VERSION + 1 };
    const result = validateSave(future);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/newer version of the game/);
    expect(result.error).toContain(String(SCHEMA_VERSION));
  });

  it('rejects a format nobody ever shipped', () => {
    const nonsense = { ...midOpeningV1(), schemaVersion: 0 };
    const result = validateSave(nonsense);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/not one this build knows how to read/);
  });

  it('writes format 2 back out once a migrated save is played on', () => {
    localStorage.setItem(KEYS.save, JSON.stringify(prototypeEndV1()));
    const loaded = loadBest().state!;
    const played = type(loaded, 'look').state;
    expect(writeAutosave(played).working).toBe(true);
    const stored: unknown = JSON.parse(localStorage.getItem(KEYS.save)!);
    expect((stored as { schemaVersion: number }).schemaVersion).toBe(SCHEMA_VERSION);
  });
});

describe('a save from the new chapter round-trips', () => {
  it('validates and reloads at every point in Chapter 2', () => {
    const points: Array<[string, GameState]> = [];
    let state = typeAll(begin(), [...TO_SEALED, ...SOLVE_RELIEF, ...CROSS_FIRST]);
    points.push(['just across', state]);
    state = typeAll(state, [...PAST_TO_SQUARE, ...SAFFRA_REALISATION]);
    points.push(['mid-conversation in the square', state]);
    state = typeAll(state, ['leave', ...RECITE]);
    points.push(['words said', state]);
    state = typeAll(state, FENN_ROUTE);
    points.push(['access earned', state]);
    state = typeAll(state, READ_PANEL);
    points.push(['panel read', state]);
    state = typeAll(state, ['place lantern in high dish']);
    points.push(['lamp standing', state]);
    state = typeAll(state, ['enter aperture']);
    points.push(['arrived', state]);

    for (const [name, point] of points) {
      const result = validateSave(JSON.parse(serialize(point)));
      expect(result.ok, `${name} should validate`).toBe(true);
      if (!result.ok) continue;
      expect(result.state, name).toEqual(point);
    }
  });

  it('refuses a file claiming the workings are open with no way of opening them', () => {
    const opened = typeAll(begin(), [
      ...TO_SEALED,
      ...SOLVE_RELIEF,
      ...CROSS_FIRST,
      ...PAST_TO_SQUARE,
      ...SAFFRA_REALISATION,
      'leave',
      ...RECITE,
      ...FENN_ROUTE,
    ]);
    const file = JSON.parse(serialize(opened)) as { flags: Record<string, unknown> };
    delete file.flags[FLAGS.fennRoute];
    const result = validateSave(file);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/workings open without any of the ways of opening them/);
  });

  it('refuses a file whose two crossings disagree with its era', () => {
    const arrived = typeAll(begin(), [
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
    const file = JSON.parse(serialize(arrived)) as {
      flags: Record<string, unknown>;
      chapter: string;
      ended: boolean;
    };
    delete file.flags[FLAGS.crossedForward];
    // Clear the completion marker too, so the check under test is the one that
    // fires rather than the earlier "complete without the crossing" guard.
    file.ended = false;
    const result = validateSave(file);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/second crossing and its era disagree/);
  });
});
