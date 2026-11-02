import type { TrackId } from '../../content/music';

/*
 * Where the audio actually lives.
 *
 * The files are decoded into memory by the controller rather than handed to an
 * `audio` element, so what matters here is only that the URL is right.
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
 * - **WebM/Opus** is preferred: smaller, and the better encode. Chrome,
 *   Firefox and Edge.
 * - **MP3** is the fallback that makes Safari and every iOS browser work at
 *   all. Safari supports neither Vorbis nor Opus in Ogg or WebM — only Opus in
 *   CAF, which is not a format produced here. Every browser on iOS is WebKit,
 *   so this is the iOS path too.
 *
 * `canPlayType` orders them, and the controller fetches the first that decodes,
 * so exactly one variant of a track is ever downloaded.
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
 * The variants this browser is likely to manage, best first.
 *
 * A list rather than one choice, because `canPlayType` is a guess: it answers
 * `'probably'`, `'maybe'` or `''`, and a `'maybe'` that then fails to decode
 * should fall through to the other format instead of becoming silence. The
 * controller tries them in order and only one is ever fetched.
 *
 * An empty list means the browser claims it can play neither, which the
 * controller reports once and then leaves alone.
 */
export function pickSources(
  sources: TrackSources,
  probe: (type: string) => string = defaultProbe
): string[] {
  const order: string[] = [];
  if (probe('audio/webm; codecs="opus"') !== '') order.push(sources.webm);
  if (probe('audio/mpeg') !== '') order.push(sources.mp3);
  /*
   * Nothing claimed? Try both anyway rather than giving up: `canPlayType` is
   * allowed to be pessimistic, and a failed decode costs one request.
   */
  return order.length > 0 ? order : [sources.webm, sources.mp3];
}

function defaultProbe(type: string): string {
  try {
    if (typeof Audio !== 'function') return '';
    return new Audio().canPlayType(type);
  } catch {
    return '';
  }
}
