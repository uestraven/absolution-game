import type { TrackId } from '../content/music';
import { loops } from '../content/music';

/**
 * The soundtrack controller.
 *
 * One of these for the whole app. It owns an `AudioContext` and at most **two**
 * playing sources — the one playing and the one it is crossfading to — and
 * nothing else in the program is allowed to make a sound.
 *
 * ## It follows the story and never touches it
 *
 * Everything here is driven by `setTrack(id | null)`, called from an effect
 * that watches game state. There is no path from this file into the engine: no
 * action is dispatched, no flag is set, no turn is taken, and nothing that
 * happens to audio appears in the transcript. A context that will not start, a
 * 404 on a track, a decoder that gives up — all of it is swallowed here, and
 * the game carries on in silence. No puzzle, clue or exit depends on sound.
 *
 * ## Why Web Audio, and not two media elements
 *
 * It was two `HTMLAudioElement`s crossfaded with `volume`. That is simpler, it
 * works on desktop, and it is **unfixably wrong on iOS**, where Apple's
 * documented behaviour is:
 *
 *  - *"Only one audio or video stream can play at a time."* A crossfade needs
 *    two. Starting the second stops the first, and the second's `play()` has no
 *    user gesture behind it, so it is refused — which is silence from then on.
 *  - `volume` *"is not settable in JavaScript"* and reading it always returns 1.
 *    So the quiet 25% default did nothing, the crossfade did nothing, and the
 *    volume slider did nothing: music played flat out or not at all.
 *  - `loop` is honoured from iOS 5, but an element that stops for any other
 *    reason — a stalled seek at the wrap — stops for good *without* firing
 *    `ended`, so a hand-rolled `ended` listener cannot rescue it either.
 *
 * Web Audio has none of those problems. A gain node is real gain on iOS,
 * mixing happens inside one output stream so a crossfade is one stream and not
 * two, and `AudioBufferSourceNode.loop` is a sample-exact loop over decoded
 * PCM — no container, no seek, no gap, nothing to stall.
 *
 * What it costs is memory: a decoded minute of 44.1kHz mono is about 10MB of
 * float32, so two live tracks are about 21MB. Buffers for anything not playing
 * are dropped. That is the trade, made deliberately and reversed from the
 * earlier decision because the earlier decision was wrong on a real device.
 *
 * ## Autoplay
 *
 * A context starts `suspended` and `resume()` needs a real gesture — the same
 * shape the media elements needed. `enable()` is only ever reached from a
 * click, and resuming there unlocks the context for every later programmatic
 * start, including the second voice of a crossfade. If the resume is refused,
 * `blocked` flips and the UI offers the control again: once, never in a loop.
 */

/** Quiet by default: music under prose, not over it. */
export const DEFAULT_VOLUME = 0.25;

/** Crossfade length. The brief asks for about a second and a half. */
export const FADE_MS = 1500;
const FADE_S = FADE_MS / 1000;

/** Floor for a ramp: an exponential ramp cannot reach or pass zero. */
const SILENT = 0.0001;

type AudioContextCtor = new () => AudioContext;

export interface SoundtrackOptions {
  /** Resolves a track to the URLs to try, best first. */
  resolve: (track: TrackId) => string[];
  /** Injected so tests need neither a decoder nor a network. */
  createContext?: () => AudioContext | null;
  fetchAudio?: (url: string) => Promise<ArrayBuffer>;
  /** Called whenever `blocked` changes, so the shell can offer the control. */
  onBlockedChange?: (blocked: boolean) => void;
  /** Notified once per distinct failure, for diagnostics only. */
  onError?: (message: string) => void;
}

interface Voice {
  track: TrackId;
  source: AudioBufferSourceNode;
  gain: GainNode;
  /** Set once it has been told to stop, so it is never counted or reused. */
  dying: boolean;
}

export interface Soundtrack {
  /** The player has asked for music, from a real interaction. */
  enable: () => void;
  /** Mute and stop. Keeps the selected track, so enabling resumes it. */
  disable: () => void;
  setVolume: (volume: number) => void;
  /** Choose what should be playing. Idempotent: the same id does nothing. */
  setTrack: (track: TrackId | null) => void;
  /** The page became hidden or visible again. */
  setPageVisible: (visible: boolean) => void;
  /** Stop everything and release the context. */
  destroy: () => void;
  /** Playback was refused and needs another interaction. */
  isBlocked: () => boolean;
  /** For tests and diagnostics. */
  current: () => TrackId | null;
  voices: () => number;
  /** Decoded tracks held in memory. Bounded on purpose. */
  cached: () => number;
}

function defaultContext(): AudioContext | null {
  try {
    const scope = globalThis as {
      AudioContext?: AudioContextCtor;
      webkitAudioContext?: AudioContextCtor;
    };
    // `webkitAudioContext` is still how older iOS spells it.
    const Ctor = scope.AudioContext ?? scope.webkitAudioContext;
    return Ctor ? new Ctor() : null;
  } catch {
    return null;
  }
}

export function createSoundtrack(options: SoundtrackOptions): Soundtrack {
  const {
    resolve,
    createContext = defaultContext,
    fetchAudio = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(String(response.status));
      return response.arrayBuffer();
    },
    onBlockedChange,
    onError,
  } = options;

  /** The track the story currently asks for, whether or not it is audible. */
  let wanted: TrackId | null = null;
  let enabled = false;
  let visible = true;
  let volume = DEFAULT_VOLUME;
  let blocked = false;
  let destroyed = false;
  let reported: string | null = null;

  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  /** At most two: the one playing, and the one fading in over it. */
  let voices: Voice[] = [];
  /**
   * Decoded audio, for the tracks in play only.
   *
   * A decoded minute is about 10MB, so this is deliberately not a cache that
   * grows: anything no longer playing or wanted is dropped on the next change.
   */
  const buffers = new Map<TrackId, AudioBuffer>();
  /** Decodes in flight, so a fast double-change does not fetch twice. */
  const loading = new Map<TrackId, Promise<AudioBuffer | null>>();
  /** Guards an async start against the story having moved on. */
  let generation = 0;

  /**
   * A window on the graph, for the browser verification pass.
   *
   * Nothing in the app reads this. It exists because the controller no longer
   * uses `audio` elements, so there is nothing in the DOM to inspect — and a
   * check that cannot see whether a signal is actually on the bus is a check
   * that cannot tell playing from pretending.
   */
  const expose = () => {
    try {
      (globalThis as Record<string, unknown>).__soundtrack = {
        context: ctx,
        master,
        volume,
        blocked,
        enabled,
        wanted,
        voices: voices.map((v) => ({
          track: v.track,
          loop: v.source.loop,
          dying: v.dying,
          duration: v.source.buffer?.duration ?? null,
        })),
        cached: [...buffers.keys()],
      };
    } catch {
      /* a frozen global, or a test double */
    }
  };

  const setBlocked = (value: boolean) => {
    if (blocked === value) return;
    blocked = value;
    onBlockedChange?.(value);
  };

  const fail = (message: string) => {
    // Once per distinct message. A track that will not load must not turn into
    // a stream of notices while the player is trying to read.
    if (reported === message) return;
    reported = message;
    onError?.(message);
  };

  const context = (): AudioContext | null => {
    if (destroyed) return null;
    if (ctx) return ctx;
    const made = createContext();
    if (!made) {
      fail('This browser has no audio support the game can use.');
      return null;
    }
    try {
      const gain = made.createGain();
      gain.gain.value = volume;
      gain.connect(made.destination);
      ctx = made;
      master = gain;
    } catch {
      fail('The audio could not be started.');
      return null;
    }
    return ctx;
  };

  /** Fetches and decodes a track, keeping at most one attempt in flight. */
  const load = (track: TrackId): Promise<AudioBuffer | null> => {
    const ready = buffers.get(track);
    if (ready) return Promise.resolve(ready);
    const already = loading.get(track);
    if (already) return already;

    const attempt = (async (): Promise<AudioBuffer | null> => {
      const sources = resolve(track);
      if (sources.length === 0) {
        fail('This browser cannot play either of the audio formats the game ships.');
        return null;
      }
      const live = context();
      if (!live) return null;
      /*
       * Each candidate in turn. `canPlayType` upstream is a good guess and not
       * a promise, so a format that turns out not to decode falls through to
       * the next one rather than becoming silence.
       */
      for (const url of sources) {
        try {
          const bytes = await fetchAudio(url);
          const decoded = await live.decodeAudioData(bytes);
          buffers.set(track, decoded);
          return decoded;
        } catch {
          continue;
        }
      }
      fail('A music track could not be loaded.');
      return null;
    })();

    loading.set(track, attempt);
    void attempt.finally(() => loading.delete(track));
    return attempt;
  };

  /** Stops a voice, ramping it out if asked, and forgets it. */
  const kill = (voice: Voice, fade: boolean) => {
    if (voice.dying) return;
    voice.dying = true;
    voices = voices.filter((v) => v !== voice);
    const live = ctx;
    try {
      // Let the graph go whenever it actually ends.
      voice.source.onended = () => {
        try {
          voice.source.disconnect();
          voice.gain.disconnect();
        } catch {
          /* already gone */
        }
      };
      if (live && fade) {
        const now = live.currentTime;
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(Math.max(SILENT, voice.gain.gain.value), now);
        voice.gain.gain.exponentialRampToValueAtTime(SILENT, now + FADE_S);
        voice.source.stop(now + FADE_S);
      } else {
        voice.source.stop();
      }
    } catch {
      /* a source that never started, or a test double */
    }
  };

  /** Drops decoded audio for anything not playing and not wanted. */
  const trim = () => {
    const keep = new Set<TrackId>(voices.map((v) => v.track));
    if (wanted !== null) keep.add(wanted);
    for (const track of [...buffers.keys()]) {
      if (!keep.has(track)) buffers.delete(track);
    }
  };

  /**
   * Starts a track and fades everything else out.
   *
   * The decode is awaited, so this is asynchronous — and `generation` is what
   * makes that safe. Three doorways in two seconds produce three calls; only
   * the last one's generation still matches when its buffer arrives, and the
   * others drop their work rather than starting a voice nobody asked for. The
   * outgoing track keeps playing meanwhile, so a slow decode costs a late
   * crossfade rather than a gap.
   */
  const swapTo = async (track: TrackId) => {
    const mine = ++generation;
    const buffer = await load(track);
    if (destroyed || mine !== generation || !enabled || wanted !== track || !buffer) return;

    const live = context();
    if (!live || !master) return;

    /*
     * Resume first. A context can drop back to `suspended` on its own — iOS
     * does it when the page has been in the background — and starting a source
     * into a suspended context is indistinguishable from silence.
     */
    if (live.state === 'suspended') {
      try {
        await live.resume();
      } catch {
        if (!destroyed) setBlocked(true);
        return;
      }
      if (destroyed || mine !== generation || wanted !== track) return;
    }
    setBlocked(false);

    let voice: Voice;
    try {
      const source = live.createBufferSource();
      source.buffer = buffer;
      // The loop, such as it is: decoded PCM, sample-exact, nothing to stall.
      source.loop = loops(track);
      const gain = live.createGain();
      source.connect(gain);
      gain.connect(master);
      voice = { track, source, gain, dying: false };
    } catch {
      fail('The audio could not be started.');
      return;
    }

    const now = live.currentTime;
    const outgoing = voices.slice();
    try {
      // Up from silence over the fade, so nothing arrives at full volume.
      voice.gain.gain.setValueAtTime(SILENT, now);
      voice.gain.gain.exponentialRampToValueAtTime(1, now + FADE_S);
      voice.source.start(now);
    } catch {
      fail('The audio could not be started.');
      return;
    }
    voices.push(voice);

    // Everything else out over the same interval: two sources, briefly.
    for (const old of outgoing) kill(old, true);
    trim();
    expose();
  };

  const stopEverything = (fade: boolean) => {
    generation += 1;
    for (const voice of voices.slice()) kill(voice, fade);
    voices = [];
    expose();
  };

  const setTrack = (track: TrackId | null) => {
    if (destroyed) return;
    // The whole no-restart rule, in one line: re-entering a room, examining
    // something, opening settings, switching input mode and every rerender all
    // arrive here with the track they already asked for.
    if (track === wanted) return;
    wanted = track;

    if (track === null) {
      // Silence — the title screen, or a state with no track.
      stopEverything(true);
      trim();
      return;
    }
    if (!enabled) return;
    void swapTo(track);
  };

  return {
    enable() {
      if (destroyed) return;
      enabled = true;
      const live = context();
      if (!live) return;
      /*
       * This runs inside the click, which is what iOS and Chrome's autoplay
       * policy are waiting for. Resuming here unlocks the context for every
       * later programmatic start — including the second voice of a crossfade,
       * which is the thing a second media element could never get on iOS.
       */
      try {
        const resumed: unknown = live.state === 'suspended' ? live.resume() : null;
        if (resumed && typeof (resumed as Promise<void>).then === 'function') {
          (resumed as Promise<void>).then(
            () => {
              if (!destroyed) setBlocked(false);
            },
            () => {
              if (!destroyed) setBlocked(true);
            }
          );
        } else {
          setBlocked(false);
        }
      } catch {
        setBlocked(true);
      }
      expose();
      if (wanted !== null && voices.length === 0) void swapTo(wanted);
    },

    disable() {
      enabled = false;
      stopEverything(false);
      setBlocked(false);
      trim();
    },

    setVolume(next) {
      volume = Math.max(0, Math.min(1, Number.isFinite(next) ? next : DEFAULT_VOLUME));
      /*
       * One master gain, so this is live and immediate and does not disturb a
       * crossfade in progress: the per-voice ramps are untouched and only what
       * they feed into changes. This is also the part that simply did not work
       * on iOS with media elements, where `volume` is read-only.
       */
      if (!master) return;
      try {
        /*
         * A plain assignment, not `setValueAtTime`.
         *
         * The master carries no automation — every ramp is on a voice gain —
         * so the baseline *is* the value, and assigning it takes effect on the
         * next render quantum. Scheduling at `currentTime` instead leaves
         * `gain.value` reading the old number for the current quantum, which
         * is how the volume slider was silently a no-op.
         */
        master.gain.value = volume;
      } catch {
        /* a test double */
      }
      expose();
    },

    setTrack,

    setPageVisible(next) {
      if (visible === next) return;
      visible = next;
      if (destroyed || !ctx) return;
      /*
       * Suspending the context stops its clock where it is, so coming back
       * resumes mid-bar rather than restarting the track. Nothing is torn down
       * and nothing is fetched again.
       */
      if (!next) {
        try {
          void ctx.suspend();
        } catch {
          /* ignore */
        }
        return;
      }
      if (!enabled) return;
      try {
        const resumed: unknown = ctx.resume();
        if (resumed && typeof (resumed as Promise<void>).then === 'function') {
          (resumed as Promise<void>).then(
            () => {
              if (!destroyed) setBlocked(false);
            },
            () => {
              // Some browsers want a fresh gesture after a spell in the
              // background. Ask for one, once.
              if (!destroyed) setBlocked(true);
            }
          );
        }
      } catch {
        /* ignore */
      }
      // A track the story moved to while we were away.
      if (wanted !== null && !voices.some((v) => v.track === wanted)) void swapTo(wanted);
    },

    destroy() {
      destroyed = true;
      enabled = false;
      stopEverything(false);
      buffers.clear();
      loading.clear();
      const live = ctx;
      ctx = null;
      master = null;
      try {
        void live?.close();
      } catch {
        /* already closed */
      }
      expose();
    },

    isBlocked: () => blocked,
    current: () => {
      const live = voices.filter((v) => !v.dying);
      return live.length === 0 ? null : live[live.length - 1]!.track;
    },
    voices: () => voices.length,
    cached: () => buffers.size,
  };
}
