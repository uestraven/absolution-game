import { describe, expect, it } from 'vitest';
import { AREA_TRACKS, TRACK_IDS, loops, trackFor } from './music';
import { LOCATIONS } from './locations';
import { chaptersForEra } from '../engine/reducer';
import type { Chapter, Era, GameState, LocationId } from '../engine/types';

/**
 * Which track plays where.
 *
 * The mapping is a pure function of game state, so all of it is testable
 * without a sound card. Whether anything is *audible* is `soundtrack.test.ts`.
 */

const where = (chapter: Chapter, locationId: LocationId) =>
  ({ chapter, locationId }) as Pick<GameState, 'chapter' | 'locationId'>;

describe('every location has a track', () => {
  it('covers every location in the game, and invents none', () => {
    // The two lists must agree exactly: a room with no track would fall silent
    // mid-game, and a track for a room that does not exist is a stale entry.
    expect(Object.keys(AREA_TRACKS).sort()).toEqual(Object.keys(LOCATIONS).sort());
  });

  it('uses only the eight supplied tracks', () => {
    for (const [location, track] of Object.entries(AREA_TRACKS)) {
      expect(TRACK_IDS, location).toContain(track);
    }
  });

  it('names a track for every location, in every chapter that location belongs to', () => {
    for (const location of Object.keys(LOCATIONS) as LocationId[]) {
      const era = location.split('.')[0] as Era;
      for (const chapter of chaptersForEra(era)) {
        if (chapter === 'select' || chapter === 'ending') continue;
        expect(trackFor(where(chapter, location)), `${chapter}/${location}`).not.toBeNull();
      }
    }
  });
});

describe('the areas each get their own theme', () => {
  /*
   * The rule, stated once: the cave theme covers the mouth and everything
   * inward, the village theme covers the settlement and the open hill. These
   * assertions are the rule, so a reshuffle has to be deliberate.
   */
  const expected: Record<string, LocationId[]> = {
    present_village: ['present.home', 'present.square', 'present.workshop', 'present.cave_path'],
    present_cave: [
      'present.entrance',
      'present.outer_gallery',
      'present.echo_chamber',
      'present.sealed_chamber',
      'present.deep_chamber',
    ],
    past_village: ['past.square', 'past.spring', 'past.cave_path'],
    past_cave: ['past.entrance', 'past.deep_chamber', 'past.worksite'],
    future_village: ['future.square', 'future.cave_path'],
    future_cave: ['future.entrance', 'future.deep_chamber', 'future.sealed_chamber'],
  };

  for (const [track, locations] of Object.entries(expected)) {
    it(`plays ${track} in ${locations.length} rooms`, () => {
      for (const location of locations) {
        expect(AREA_TRACKS[location], location).toBe(track);
      }
    });
  }

  it('gives nearby rooms in one area the same track', () => {
    // Walking the hill in the original era: one theme above ground, one below.
    const above = ['present.home', 'present.square', 'present.workshop', 'present.cave_path'];
    const below = ['present.entrance', 'present.outer_gallery', 'present.deep_chamber'];
    expect(new Set(above.map((l) => AREA_TRACKS[l as LocationId])).size).toBe(1);
    expect(new Set(below.map((l) => AREA_TRACKS[l as LocationId])).size).toBe(1);
    expect(AREA_TRACKS['present.cave_path']).not.toBe(AREA_TRACKS['present.entrance']);
  });

  it('keeps the three eras apart', () => {
    const villages = ['present.square', 'past.square', 'future.square'] as LocationId[];
    expect(new Set(villages.map((l) => AREA_TRACKS[l])).size).toBe(3);
    const caves = [
      'present.deep_chamber',
      'past.deep_chamber',
      'future.deep_chamber',
    ] as LocationId[];
    expect(new Set(caves.map((l) => AREA_TRACKS[l])).size).toBe(3);
  });
});

describe('the story phases take precedence over the room', () => {
  it('plays the confrontation theme for the last chapter, not the cave theme', () => {
    /*
     * The whole of chapter `return` happens in `present.sealed_chamber`, which
     * would otherwise take the ordinary present-cave theme. The brief's
     * precedence rule.
     */
    expect(trackFor(where('return', 'present.sealed_chamber'))).toBe('final_boss');
    expect(AREA_TRACKS['present.sealed_chamber']).toBe('present_cave');
    expect(trackFor(where('rite', 'present.sealed_chamber'))).toBe('present_cave');
  });

  it('plays the epilogue for a finished story, whatever the room says', () => {
    expect(trackFor(where('ending', 'present.sealed_chamber'))).toBe('epilogue');
    // Including a finished save reloaded from disk, which is the same state.
    expect(trackFor(where('ending', 'future.square'))).toBe('epilogue');
  });

  it('puts the ending above the confrontation', () => {
    // Order matters: the final chapter's room is also the ending's room.
    expect(trackFor(where('ending', 'present.sealed_chamber'))).not.toBe('final_boss');
  });

  it('is silent before a character is chosen, and for nothing at all', () => {
    expect(trackFor(where('select', 'present.home'))).toBeNull();
    expect(trackFor(null)).toBeNull();
  });

  it('is silent rather than guessing for a room it does not know', () => {
    // A save from a build with a room this one does not have.
    expect(trackFor(where('rite', 'present.attic' as LocationId))).toBeNull();
  });
});

describe('looping', () => {
  it('loops all eight, including the epilogue', () => {
    /*
     * The epilogue was inspected for a composed ending, which would have meant
     * a single playback. It has none: its level holds at about -13 dBFS
     * through the final four seconds, with no decay and no trailing silence,
     * exactly like the seven loops. Playing it once would end the game in
     * silence partway through a held phrase.
     */
    for (const track of TRACK_IDS) {
      expect(loops(track), track).toBe(true);
    }
  });
});
