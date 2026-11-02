import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../engine/types';
import { trackFor } from '../content/music';
import { TRACK_SOURCES, pickSources } from '../assets/music';
import { createSoundtrack, type Soundtrack } from './soundtrack';

/**
 * The one place the story and the soundtrack meet.
 *
 * Music follows state, in one direction only: this hook reads `chapter` and
 * `locationId` and tells the controller what to play. Nothing it does can
 * reach back into the engine, and the return value carries no story meaning.
 *
 * Everything about *restarting* is handled by `setTrack` being idempotent, so
 * this effect can run as often as React likes — on every rerender, every room
 * description, every settings dialog — and the music only changes when the
 * answer to "what should be playing" changes.
 */
export interface MusicControls {
  /** True when a browser refused playback and wants another interaction. */
  blocked: boolean;
  /** Call from a real click. */
  enable: () => void;
}

export interface UseSoundtrackArgs {
  state: GameState | null;
  /** False on the title and character screens: no track is approved for them. */
  playing: boolean;
  enabled: boolean;
  volume: number;
  /** Test seam. Left undefined in the app. */
  make?: typeof createSoundtrack;
}

export function useSoundtrack({
  state,
  playing,
  enabled,
  volume,
  make = createSoundtrack,
}: UseSoundtrackArgs): MusicControls {
  const [blocked, setBlocked] = useState(false);
  const deck = useRef<Soundtrack | null>(null);

  /*
   * One controller for the life of the app.
   *
   * Created in an effect with no dependencies and destroyed in its cleanup, so
   * React's development double-invoke tears the first one down completely
   * before the second exists — two elements playing the same track over each
   * other is exactly the bug that behaviour is there to expose.
   */
  useEffect(() => {
    const soundtrack = make({
      resolve: (track) => pickSources(TRACK_SOURCES[track]),
      onBlockedChange: setBlocked,
    });
    deck.current = soundtrack;
    return () => {
      deck.current = null;
      soundtrack.destroy();
    };
  }, [make]);

  // Mute and volume, live, without restarting anything.
  useEffect(() => {
    deck.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    const soundtrack = deck.current;
    if (!soundtrack) return;
    if (enabled) soundtrack.enable();
    else soundtrack.disable();
  }, [enabled]);

  // What should be playing. `playing` is false on the start screens, where
  // returning to the title has to stop the music rather than keep the last
  // room's theme running under it.
  const track = playing ? trackFor(state) : null;
  useEffect(() => {
    deck.current?.setTrack(track);
  }, [track]);

  /*
   * A hidden tab should be quiet. `visibilitychange` is the only signal that
   * works for a backgrounded tab, a locked phone and a switched desktop alike.
   */
  useEffect(() => {
    const doc = globalThis.document;
    if (!doc?.addEventListener) return;
    const onChange = () => deck.current?.setPageVisible(doc.visibilityState !== 'hidden');
    doc.addEventListener('visibilitychange', onChange);
    return () => doc.removeEventListener('visibilitychange', onChange);
  }, []);

  return {
    blocked,
    enable: () => deck.current?.enable(),
  };
}
