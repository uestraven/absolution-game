import type { GameState, LocationId } from '../engine/types';

/*
 * Which track plays where.
 *
 * Authored data, like everything else in `content/`. Nothing in here knows
 * about audio elements, playback or the DOM: it answers "what should be
 * playing, given this state", and the controller in `ui/soundtrack.ts` is what
 * makes a sound. That separation is the point — the mapping is a pure function
 * of game state and is tested as one, and no part of the story can be affected
 * by whether anything is audible.
 *
 * ## The eight tracks
 *
 * Supplied as eight mono 44.1kHz WAV masters whose filenames name their slot
 * unambiguously, so no part of this mapping is a guess about which file is
 * which. Masters are in `art/music/`; the delivery copies that ship are in
 * `src/assets/music/`.
 *
 * ## Where the cave begins
 *
 * The one judgement call. Each era has a settlement, an open hillside and a
 * cave, and the rule used throughout is: **the cave theme covers the mouth and
 * everything inward; the village theme covers the settlement and the open
 * hill.** So `cave_path` ("Above the roofs, where the grass gives up", "The
 * same turn of the hill", "The Hillside") is village, and `entrance` — the
 * Cave Mouth, "the part everyone sees" — is where the cave theme starts. It is
 * the threshold the whole rite is about; hearing the change there is the point
 * of having two themes.
 */

/** The eight supplied tracks. */
export type TrackId =
  | 'present_village'
  | 'present_cave'
  | 'past_village'
  | 'past_cave'
  | 'future_village'
  | 'future_cave'
  | 'final_boss'
  | 'epilogue';

export const TRACK_IDS: readonly TrackId[] = [
  'present_village',
  'present_cave',
  'past_village',
  'past_cave',
  'future_village',
  'future_cave',
  'final_boss',
  'epilogue',
] as const;

/**
 * Every location, with the track for the area it belongs to.
 *
 * Exhaustive by type: adding a location without giving it a track will not
 * compile, which is the point of writing it out rather than deriving it from
 * the id. A test asserts the two lists agree.
 */
export const AREA_TRACKS: Record<LocationId, TrackId> = {
  /* --- The original era, above ground --- */
  'present.home': 'present_village',
  'present.square': 'present_village',
  'present.workshop': 'present_village',
  'present.cave_path': 'present_village',

  /* --- The original era, from the mouth inward --- */
  'present.entrance': 'present_cave',
  'present.outer_gallery': 'present_cave',
  'present.echo_chamber': 'present_cave',
  'present.sealed_chamber': 'present_cave',
  'present.deep_chamber': 'present_cave',

  /* --- A hundred years back --- */
  'past.square': 'past_village',
  'past.spring': 'past_village',
  'past.cave_path': 'past_village',
  'past.entrance': 'past_cave',
  'past.deep_chamber': 'past_cave',
  // Lovage's dig is inside the workings, and is the slot's other half.
  'past.worksite': 'past_cave',

  /* --- A hundred years on --- */
  'future.square': 'future_village',
  'future.cave_path': 'future_village',
  'future.entrance': 'future_cave',
  'future.deep_chamber': 'future_cave',
  'future.sealed_chamber': 'future_cave',
};

/**
 * What should be playing, or null for silence.
 *
 * Precedence, highest first:
 *
 * 1. **The ending** — the epilogue track, for a finished story. Checked before
 *    anything else so a completed save reloads into it, and so reviewing the
 *    ending does not hand the room's own theme back.
 * 2. **The confrontation** — `final_boss` for the whole of the last chapter,
 *    which happens in `present.sealed_chamber` and would otherwise take the
 *    ordinary present-cave theme. The brief's precedence rule, and the reason
 *    chapter is consulted before location.
 * 3. **The area**, from the table above.
 *
 * Returns null before a character is chosen, and for a state whose location is
 * not in the table — a save from a build with a room this one does not have.
 * Silence is the correct answer there, not a guess.
 */
export function trackFor(state: Pick<GameState, 'chapter' | 'locationId'> | null): TrackId | null {
  if (state === null) return null;
  if (state.chapter === 'ending') return 'epilogue';
  if (state.chapter === 'select') return null;
  if (state.chapter === 'return') return 'final_boss';
  return AREA_TRACKS[state.locationId] ?? null;
}

/**
 * Whether a track plays once or round and round.
 *
 * All eight loop. The epilogue was inspected for a composed ending — the brief
 * asks for a single playback if it has one — and it does not have one: its
 * level holds at about −13 dBFS through the final four seconds with no decay,
 * no ritardando and no trailing silence, exactly like the seven loops. Playing
 * it once would end the game in silence partway through a held phrase, so it
 * loops. Measurements are in `art/music/README.md`.
 */
export function loops(_track: TrackId): boolean {
  return true;
}
