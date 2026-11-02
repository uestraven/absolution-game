import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrackId } from '../content/music';
import { DEFAULT_VOLUME, FADE_MS, createSoundtrack } from './soundtrack';
import { pickSource } from '../assets/music';

/**
 * The controller, on a fake sound card.
 *
 * jsdom has no audio: `play()` is not implemented and `volume` is inert. So
 * these tests supply their own element — which is better than a real one
 * anyway, because the things worth testing are *how many* sources exist, what
 * their volumes are mid-fade, and what happens when `play()` is rejected. All
 * of that is invisible from the outside of a real element.
 */

interface FakeAudio {
  src: string;
  loop: boolean;
  preload: string;
  volume: number;
  currentTime: number;
  plays: number;
  pauses: number;
  cleared: number;
  listeners: Record<string, Array<() => void>>;
  play: () => Promise<void>;
  pause: () => void;
  load: () => void;
  removeAttribute: (name: string) => void;
  addEventListener: (type: string, fn: () => void) => void;
  setAttribute: (name: string, value: string) => void;
  remove: () => void;
  hidden: boolean;
  dataset: Record<string, string>;
}

/** Elements made during a test, in order, including released ones. */
let made: FakeAudio[] = [];
/** How `play()` resolves. Flipped to exercise the autoplay policy. */
let playOutcome: 'resolve' | 'reject' = 'resolve';

function fakeAudio(src: string): HTMLAudioElement {
  const el: FakeAudio = {
    src,
    loop: false,
    preload: '',
    volume: 1,
    currentTime: 0,
    plays: 0,
    pauses: 0,
    cleared: 0,
    listeners: {},
    play() {
      el.plays += 1;
      return playOutcome === 'resolve' ? Promise.resolve() : Promise.reject(new Error('blocked'));
    },
    pause() {
      el.pauses += 1;
    },
    load() {},
    removeAttribute() {
      el.cleared += 1;
    },
    addEventListener(type, fn) {
      (el.listeners[type] ??= []).push(fn);
    },
    setAttribute() {},
    remove() {},
    hidden: false,
    dataset: {},
  };
  made.push(el);
  return el as unknown as HTMLAudioElement;
}

/** Elements that have not been released: the ones that can make a sound. */
const live = () => made.filter((el) => el.cleared === 0);

function deck(overrides: Partial<Parameters<typeof createSoundtrack>[0]> = {}) {
  return createSoundtrack({
    resolve: (track) => `/${track}.webm`,
    create: fakeAudio,
    ...overrides,
  });
}

/** Runs a whole crossfade. */
const finishFade = () => vi.advanceTimersByTime(FADE_MS + 100);

beforeEach(() => {
  made = [];
  playOutcome = 'resolve';
  vi.useFakeTimers();
});

describe('nothing plays until the player asks', () => {
  it('makes no sound and fetches nothing before it is enabled', () => {
    const music = deck();
    music.setTrack('present_village');
    // Not even an element: no element means no network request.
    expect(made).toHaveLength(0);
    expect(music.voices()).toBe(0);
  });

  it('starts the track the story already wanted, once enabled', () => {
    const music = deck();
    music.setTrack('present_village');
    music.enable();
    expect(live()).toHaveLength(1);
    expect(live()[0]!.plays).toBe(1);
    expect(live()[0]!.src).toBe('/present_village.webm');
    expect(music.current()).toBe('present_village');
  });

  it('starts quiet, and comes up over the fade rather than at full volume', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    expect(live()[0]!.volume).toBe(0);
    vi.advanceTimersByTime(FADE_MS / 2);
    expect(live()[0]!.volume).toBeGreaterThan(0);
    expect(live()[0]!.volume).toBeLessThan(DEFAULT_VOLUME);
    finishFade();
    expect(live()[0]!.volume).toBeCloseTo(DEFAULT_VOLUME, 5);
  });

  it('loops what it plays', () => {
    const music = deck();
    music.enable();
    music.setTrack('epilogue');
    expect(live()[0]!.loop).toBe(true);
  });
});

describe('looping does not depend on the browser honouring loop=true', () => {
  /*
   * `loop = true` is set, and where it works `ended` never fires. Where it
   * does not — Safari has a long history of ignoring it on `audio`, and a
   * stalled wrap stops playback anywhere — the element reaches its end and
   * just stops. These cover the hand-rolled fallback.
   */
  const end = (el: FakeAudio) => {
    for (const fn of el.listeners['ended'] ?? []) fn();
  };

  it('sets the flag as well, for the browsers that honour it', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    expect(live()[0]!.loop).toBe(true);
  });

  it('starts the track again when it ends anyway', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    const el = live()[0]!;
    el.currentTime = 42;

    end(el);

    // Back to the beginning, playing, and no second element.
    expect(el.currentTime).toBe(0);
    expect(el.plays).toBe(2);
    expect(made).toHaveLength(1);
    expect(music.voices()).toBe(1);
  });

  it('goes round as many times as it has to', () => {
    const music = deck();
    music.enable();
    music.setTrack('final_boss');
    finishFade();
    const el = live()[0]!;
    for (let i = 0; i < 5; i++) end(el);
    expect(el.plays).toBe(6);
    expect(made).toHaveLength(1);
  });

  it('does not restart a voice that has been faded out and released', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    const old = made[0]!;
    music.setTrack('present_cave');
    finishFade();
    const playsWhenReleased = old.plays;

    // A late `ended` from the element we have finished with.
    end(old);
    expect(old.plays).toBe(playsWhenReleased);
    expect(music.voices()).toBe(1);
    expect(music.current()).toBe('present_cave');
  });

  it('does not restart while the page is hidden', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    const el = live()[0]!;
    music.setPageVisible(false);
    end(el);
    expect(el.plays).toBe(1);
  });

  it('does not restart once music is turned off', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    const el = made[0]!;
    music.disable();
    end(el);
    expect(el.plays).toBe(1);
  });

  it('does not restart after teardown', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    const el = made[0]!;
    music.destroy();
    end(el);
    expect(el.plays).toBe(1);
  });

  it('survives an element that refuses to seek', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    const el = live()[0]!;
    Object.defineProperty(el, 'currentTime', {
      configurable: true,
      get: () => 10,
      set: () => {
        throw new Error('no seeking');
      },
    });
    expect(() => end(el)).not.toThrow();
    // It still tries to play rather than giving up silently.
    expect(el.plays).toBe(2);
  });
});

describe('the same track is never restarted', () => {
  /*
   * The requirement this covers: re-entering a room, examining an object,
   * opening settings, switching input mode and every React rerender all end up
   * calling `setTrack` with the track that is already playing.
   */
  it('ignores a repeat of the track already playing', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_cave');
    finishFade();
    const el = live()[0]!;
    const playsBefore = el.plays;

    for (let i = 0; i < 20; i++) music.setTrack('present_cave');

    expect(live()).toHaveLength(1);
    expect(live()[0]).toBe(el);
    expect(el.plays).toBe(playsBefore);
    expect(made).toHaveLength(1);
  });

  it('keeps playing when the room changes within one area', () => {
    // Two rooms, one track: the controller is only ever told the track.
    const music = deck();
    music.enable();
    music.setTrack('past_village');
    finishFade();
    music.setTrack('past_village');
    expect(made).toHaveLength(1);
    expect(live()[0]!.volume).toBeCloseTo(DEFAULT_VOLUME, 5);
  });
});

describe('crossfading between tracks', () => {
  it('fades the old one down while the new one comes up', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    music.setTrack('present_cave');

    expect(live()).toHaveLength(2);
    const [outgoing, incoming] = live();
    vi.advanceTimersByTime(FADE_MS / 2);
    expect(incoming!.volume).toBeGreaterThan(0);
    expect(outgoing!.volume).toBeGreaterThan(0);
    expect(outgoing!.volume).toBeLessThan(DEFAULT_VOLUME);
    // They cross: together they stay near the master volume.
    expect(incoming!.volume + outgoing!.volume).toBeCloseTo(DEFAULT_VOLUME, 1);
  });

  it('releases the old source when the fade finishes', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    music.setTrack('present_cave');
    finishFade();

    expect(live()).toHaveLength(1);
    expect(music.voices()).toBe(1);
    expect(music.current()).toBe('present_cave');
    // The old element is paused and its source dropped, so it stops fetching.
    expect(made[0]!.pauses).toBeGreaterThan(0);
    expect(made[0]!.cleared).toBeGreaterThan(0);
  });

  it('never has more than two sources, however fast the rooms change', () => {
    const music = deck();
    music.enable();
    const route: TrackId[] = [
      'present_village',
      'present_cave',
      'past_cave',
      'past_village',
      'future_village',
      'future_cave',
      'final_boss',
    ];
    for (const track of route) {
      music.setTrack(track);
      // A fifth of a fade apart: every change lands mid-crossfade.
      vi.advanceTimersByTime(FADE_MS / 5);
      expect(music.voices()).toBeLessThanOrEqual(2);
      expect(live().length).toBeLessThanOrEqual(2);
    }
    finishFade();
    expect(music.voices()).toBe(1);
    expect(music.current()).toBe('final_boss');
  });

  it('leaves no orphan stuck at a half volume', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    vi.advanceTimersByTime(FADE_MS / 3);
    music.setTrack('present_cave');
    vi.advanceTimersByTime(FADE_MS / 3);
    music.setTrack('future_cave');
    finishFade();

    expect(live()).toHaveLength(1);
    expect(live()[0]!.src).toBe('/future_cave.webm');
    expect(live()[0]!.volume).toBeCloseTo(DEFAULT_VOLUME, 5);
    // Everything else is silent and released, not merely quiet.
    for (const el of made.slice(0, -1)) {
      expect(el.cleared).toBeGreaterThan(0);
    }
  });

  it('cancels an obsolete fade instead of letting two run at once', () => {
    const cleared: number[] = [];
    const music = deck({
      setInterval: ((fn: () => void, ms: number) =>
        globalThis.setInterval(fn, ms) as unknown as number) as never,
      clearInterval: ((h: number) => {
        cleared.push(h);
        globalThis.clearInterval(h);
      }) as never,
    });
    music.enable();
    music.setTrack('present_village');
    music.setTrack('present_cave');
    music.setTrack('past_village');
    // Each new fade cancels the one before starting, so there is never a
    // second timer stepping the same volumes in the other direction.
    expect(cleared.length).toBeGreaterThanOrEqual(2);
    finishFade();
    expect(music.voices()).toBe(1);
  });

  it('goes back to a track it was fading away from without making a third source', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    music.setTrack('present_cave');
    vi.advanceTimersByTime(FADE_MS / 2);
    music.setTrack('present_village');
    finishFade();
    expect(music.voices()).toBe(1);
    expect(music.current()).toBe('present_village');
    expect(made).toHaveLength(2);
  });
});

describe('silence', () => {
  it('stops everything when the story asks for no track', () => {
    // Returning to the title screen.
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    music.setTrack(null);
    expect(live()).toHaveLength(0);
    expect(music.voices()).toBe(0);
    expect(made[0]!.pauses).toBeGreaterThan(0);
  });

  it('turning music off stops it at once and keeps the choice of track', () => {
    const music = deck();
    music.enable();
    music.setTrack('future_cave');
    finishFade();
    music.disable();
    expect(live()).toHaveLength(0);

    // Turning it back on resumes the track the story is still in.
    music.enable();
    expect(live()).toHaveLength(1);
    expect(music.current()).toBe('future_cave');
  });
});

describe('volume', () => {
  it('takes effect immediately, without restarting', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    const el = live()[0]!;
    const plays = el.plays;

    music.setVolume(0.8);
    expect(el.volume).toBeCloseTo(0.8, 5);
    music.setVolume(0);
    expect(el.volume).toBe(0);
    expect(el.plays).toBe(plays);
  });

  it('scales a crossfade in progress without disturbing it', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    music.setTrack('present_cave');
    vi.advanceTimersByTime(FADE_MS / 2);
    music.setVolume(1);
    const [outgoing, incoming] = live();
    // Still crossed, now against a louder master.
    expect(incoming!.volume + outgoing!.volume).toBeCloseTo(1, 1);
    finishFade();
    expect(live()).toHaveLength(1);
    expect(live()[0]!.volume).toBeCloseTo(1, 5);
  });

  it('refuses a volume that is not a fraction', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    music.setVolume(Number.NaN);
    expect(live()[0]!.volume).toBeCloseTo(DEFAULT_VOLUME, 5);
    music.setVolume(5);
    expect(live()[0]!.volume).toBe(1);
    music.setVolume(-2);
    expect(live()[0]!.volume).toBe(0);
  });
});

describe('a browser that will not play', () => {
  it('reports being blocked when play() is rejected, and does not retry in a loop', async () => {
    playOutcome = 'reject';
    const blocked: boolean[] = [];
    const music = deck({ onBlockedChange: (b) => blocked.push(b) });
    music.enable();
    music.setTrack('present_village');
    await vi.waitFor(() => expect(music.isBlocked()).toBe(true));
    expect(blocked).toEqual([true]);
    const plays = live()[0]!.plays;
    finishFade();
    // One attempt per request, not a retry loop.
    expect(live()[0]!.plays).toBe(plays);
  });

  it('clears the blocked flag once a gesture works', async () => {
    playOutcome = 'reject';
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await vi.waitFor(() => expect(music.isBlocked()).toBe(true));

    playOutcome = 'resolve';
    music.enable();
    await vi.waitFor(() => expect(music.isBlocked()).toBe(false));
  });

  it('says so once, not once per track, when it can play neither format', () => {
    const errors: string[] = [];
    const music = deck({ resolve: () => null, onError: (m) => errors.push(m) });
    music.enable();
    for (const track of ['present_village', 'present_cave', 'past_village'] as TrackId[]) {
      music.setTrack(track);
    }
    // One notice. A player reading prose must not be interrupted repeatedly.
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/cannot play/i);
    expect(made).toHaveLength(0);
  });

  it('survives an element that throws on construction', () => {
    const errors: string[] = [];
    const music = deck({
      create: () => {
        throw new Error('no audio for you');
      },
      onError: (m) => errors.push(m),
    });
    music.enable();
    expect(() => music.setTrack('present_village')).not.toThrow();
    expect(errors).toHaveLength(1);
    expect(music.voices()).toBe(0);
  });

  it('reports a load failure once and keeps going', () => {
    const errors: string[] = [];
    const music = deck({ onError: (m) => errors.push(m) });
    music.enable();
    music.setTrack('present_village');
    const el = live()[0]!;
    for (const fn of el.listeners['error'] ?? []) fn();
    for (const fn of el.listeners['error'] ?? []) fn();
    expect(errors).toHaveLength(1);
    // And a later track still works.
    music.setTrack('present_cave');
    finishFade();
    expect(music.current()).toBe('present_cave');
  });
});

describe('a hidden page', () => {
  it('pauses rather than releasing, so coming back does not restart', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    const el = live()[0]!;

    music.setPageVisible(false);
    expect(el.pauses).toBe(1);
    // Still the same element, still loaded: the position is kept.
    expect(el.cleared).toBe(0);
    expect(music.voices()).toBe(1);

    music.setPageVisible(true);
    expect(live()[0]).toBe(el);
    expect(el.plays).toBe(2);
    expect(made).toHaveLength(1);
  });

  it('stays silent on return when music has been turned off', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    music.setPageVisible(false);
    music.disable();
    music.setPageVisible(true);
    expect(live()).toHaveLength(0);
  });

  it('does not fight the autoplay policy on return', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    music.setPageVisible(false);
    playOutcome = 'reject';
    music.setPageVisible(true);
    await vi.waitFor(() => expect(music.isBlocked()).toBe(true));
    // Blocked, offered again, and not retried in a loop.
    expect(live()).toHaveLength(1);
  });

  it('ignores a repeat of the visibility it already has', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    const el = live()[0]!;
    music.setPageVisible(true);
    music.setPageVisible(true);
    expect(el.plays).toBe(1);
    expect(el.pauses).toBe(0);
  });
});

describe('teardown', () => {
  it('stops and releases everything', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    music.setTrack('present_cave');
    expect(live()).toHaveLength(2);

    music.destroy();
    expect(live()).toHaveLength(0);
    expect(music.voices()).toBe(0);
    for (const el of made) expect(el.pauses).toBeGreaterThan(0);
  });

  it('is inert afterwards, so a torn-down controller cannot start playing', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    music.destroy();
    const count = made.length;
    music.setTrack('future_cave');
    music.enable();
    music.setPageVisible(true);
    expect(made).toHaveLength(count);
    expect(music.voices()).toBe(0);
  });

  it('does not leave a fade timer running', () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    finishFade();
    music.setTrack('present_cave');
    vi.advanceTimersByTime(FADE_MS / 4);
    const volumes = made.map((el) => el.volume);
    music.destroy();
    finishFade();
    // Nothing moved after destroy: the interval is gone, not merely ignored.
    expect(made.map((el) => el.volume)).toEqual(volumes);
  });

  it('two controllers in sequence never play over each other', () => {
    /*
     * React's development double-invoke: mount, cleanup, mount. The first
     * controller must be completely silent before the second starts, or the
     * same track plays twice over itself.
     */
    const first = deck();
    first.enable();
    first.setTrack('present_village');
    finishFade();
    first.destroy();

    const second = deck();
    second.enable();
    second.setTrack('present_village');
    finishFade();

    expect(live()).toHaveLength(1);
    expect(second.voices()).toBe(1);
    expect(first.voices()).toBe(0);
  });
});

describe('choosing a format', () => {
  it('prefers WebM/Opus where it is supported', () => {
    const src = pickSource({ webm: 'a.webm', mp3: 'a.mp3' }, (type) =>
      type.includes('webm') ? 'probably' : 'maybe'
    );
    expect(src).toBe('a.webm');
  });

  it('falls back to MP3, which is what makes Safari work at all', () => {
    // Safari supports neither Vorbis nor Opus in Ogg or WebM.
    const src = pickSource({ webm: 'a.webm', mp3: 'a.mp3' }, (type) =>
      type === 'audio/mpeg' ? 'maybe' : ''
    );
    expect(src).toBe('a.mp3');
  });

  it('answers null rather than guessing when neither will play', () => {
    expect(pickSource({ webm: 'a.webm', mp3: 'a.mp3' }, () => '')).toBeNull();
  });
});
