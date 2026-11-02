import type { TrackId } from '../../content/music';

/*
 * Where the audio actually lives.
 *
 * Imported rather than hand-built from a public path, for three reasons: Vite
 * rewrites each URL against `base`, so it is correct at the site root, on a
 * `*.pages.dev` preview and under a subpath without any `BASE_URL` arithmetic;
 * the emitted filenames are content-hashed, so a changed track can never be
 * served from a stale cache; and a missing file fails the build instead of
 * 404ing in front of a player.
 *
 * **Importing a media file does not bundle it.** Vite emits the file to
 * `assets/` and the bundle holds only the URL string, so all this costs the JS
 * payload is sixteen short strings. Nothing is fetched until the controller
 * assigns one to an `audio` element, which is what keeps startup free of eight
 * music downloads.
 *
 * ## Two formats, picked at runtime
 *
 * - **WebM/Opus** is preferred. Opus carries its own pre-skip, so a looping
 *   media element has no container padding to stumble over, and it is smaller.
 *   Chrome, Firefox and Edge.
 * - **MP3** is the fallback that makes Safari work at all. Safari supports
 *   neither Vorbis nor Opus in Ogg or WebM — only Opus in CAF, which is not a
 *   format produced here.
 *
 * `canPlayType` chooses, so exactly one variant of a track is ever requested.
 */

import epilogueWebm from './epilogue.webm';
import epilogueMp3 from './epilogue.mp3';
import finalBossWebm from './final_boss.webm';
import finalBossMp3 from './final_boss.mp3';
import futureCaveWebm from './future_cave.webm';
import futureCaveMp3 from './future_cave.mp3';
import futureVillageWebm from './future_village.webm';
import futureVillageMp3 from './future_village.mp3';
import pastCaveWebm from './past_cave.webm';
import pastCaveMp3 from './past_cave.mp3';
import pastVillageWebm from './past_village.webm';
import pastVillageMp3 from './past_village.mp3';
import presentCaveWebm from './present_cave.webm';
import presentCaveMp3 from './present_cave.mp3';
import presentVillageWebm from './present_village.webm';
import presentVillageMp3 from './present_village.mp3';

export interface TrackSources {
  webm: string;
  mp3: string;
}

export const TRACK_SOURCES: Record<TrackId, TrackSources> = {
  present_village: { webm: presentVillageWebm, mp3: presentVillageMp3 },
  present_cave: { webm: presentCaveWebm, mp3: presentCaveMp3 },
  past_village: { webm: pastVillageWebm, mp3: pastVillageMp3 },
  past_cave: { webm: pastCaveWebm, mp3: pastCaveMp3 },
  future_village: { webm: futureVillageWebm, mp3: futureVillageMp3 },
  future_cave: { webm: futureCaveWebm, mp3: futureCaveMp3 },
  final_boss: { webm: finalBossWebm, mp3: finalBossMp3 },
  epilogue: { webm: epilogueWebm, mp3: epilogueMp3 },
};

/**
 * The best variant this browser can play, or null if it can play neither.
 *
 * `canPlayType` answers `'probably'`, `'maybe'` or `''`. Anything but the empty
 * string is worth trying: a browser that says `'maybe'` and then fails is
 * handled the same way as one that fails for any other reason — quietly.
 */
export function pickSource(
  sources: TrackSources,
  probe: (type: string) => string = defaultProbe
): string | null {
  if (probe('audio/webm; codecs="opus"') !== '') return sources.webm;
  if (probe('audio/mpeg') !== '') return sources.mp3;
  return null;
}

function defaultProbe(type: string): string {
  try {
    if (typeof Audio !== 'function') return '';
    return new Audio().canPlayType(type);
  } catch {
    return '';
  }
}
