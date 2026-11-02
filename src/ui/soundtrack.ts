import type { TrackId } from '../content/music';
import { loops } from '../content/music';

/**
 * The soundtrack controller.
 *
 * One of these for the whole app. It owns at most **two** `HTMLAudioElement`s —
 * the one playing and the one it is crossfading to — and nothing else in the
 * program is allowed to make a sound.
 *
 * ## It follows the story and never touches it
 *
 * Everything here is driven by `setTrack(id | null)`, called from an effect
 * that watches game state. There is no path from this file into the engine: no
 * action is dispatched, no flag is set, no turn is taken, and nothing that
 * happens to audio appears in the transcript. A browser that refuses to play,
 * a 404 on a track, a decoder that gives up — all of it is swallowed here, and
 * the game carries on in silence. No puzzle, clue or exit depends on sound.
 *
 * ## Why media elements and not the Web Audio API
 *
 * `volume` on two elements is all a crossfade needs, media elements stream
 * progressively instead of holding a decoded buffer (a 64-second mono track is
 * ~11MB of float32 once decoded; two live would be ~22MB), teardown is a
 * `pause()` and a dropped reference, and there is no AudioContext to keep in
 * sync with the page's own suspend/resume rules. Web Audio would buy
 * sample-exact loop points, which matters for MP3 and not for Opus; see the
 * loop note in `art/music/README.md` for what was measured.
 *
 * ## Autoplay
 *
 * Nothing starts until `enable()` is called, and `enable()` is only ever
 * reached from a real click. `play()` returns a promise that browsers reject
 * when they do not consider the gesture sufficient — after a reload, most
 * notably — so a rejection flips `blocked` and the UI offers the control
 * again. It never retries in a loop and never reports twice.
 */

/** Quiet by default: music under prose, not over it. */
export const DEFAULT_VOLUME = 0.25;

/** Crossfade length. The brief asks for about a second and a half. */
export const FADE_MS = 1500;

/** How often a fade steps. ~60fps without depending on animation frames. */
const FADE_STEP_MS = 50;

export interface SoundtrackOptions {
  /** Resolves a track to a URL this browser can play, or null if it cannot. */
  resolve: (track: TrackId) => string | null;
  /** Builds an element. Injected so tests do not need a real decoder. */
  create?: (src: string) => HTMLAudioElement;
  /** Called whenever `blocked` changes, so the shell can offer the control. */
  onBlockedChange?: (blocked: boolean) => void;
  /** Notified once per distinct failure, for diagnostics only. */
  onError?: (message: string) => void;
  now?: () => number;
  setInterval?: (fn: () => void, ms: number) => number;
  clearInterval?: (handle: number) => void;
}

interface Voice {
  el: HTMLAudioElement;
  track: TrackId;
  /** Target volume as a fraction of the master volume, 0..1. */
  level: number;
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
  /** Stop everything and release both elements. */
  destroy: () => void;
  /** Playback was refused and needs another interaction. */
  isBlocked: () => boolean;
  /** For tests and diagnostics. */
  current: () => TrackId | null;
  voices: () => number;
}

export function createSoundtrack(options: SoundtrackOptions): Soundtrack {
  const {
    resolve,
    create = (src) => {
      const el = new Audio();
      el.src = src;
      /*
       * Attached to the document, hidden.
       *
       * A media element plays perfectly well detached, so this is not for
       * playback: it is so that what is playing can be *seen* — by the browser
       * verification pass, and by anybody with devtools open. `hidden` keeps
       * it out of the layout and out of the accessibility tree, and there are
       * never more than two.
       */
      try {
        el.hidden = true;
        el.setAttribute('aria-hidden', 'true');
        globalThis.document?.body?.appendChild(el);
      } catch {
        // Attaching is a diagnostic nicety and must never be able to stop the
        // music: a detached element plays just as well.
      }
      return el;
    },
    onBlockedChange,
    onError,
    setInterval: schedule = (fn, ms) => globalThis.setInterval(fn, ms) as unknown as number,
    clearInterval: unschedule = (h) => globalThis.clearInterval(h),
  } = options;

  /** The track the story currently asks for, whether or not it is audible. */
  let wanted: TrackId | null = null;
  let enabled = false;
  let visible = true;
  let volume = DEFAULT_VOLUME;
  let blocked = false;
  let destroyed = false;

  /** At most two: the one playing, and the one fading in over it. */
  let voices: Voice[] = [];
  let fade = 0;
  let reported: string | null = null;

  const setBlocked = (value: boolean) => {
    if (blocked === value) return;
    blocked = value;
    onBlockedChange?.(value);
  };

  const fail = (message: string) => {
    // Once per distinct message. A track that cannot load must not turn into a
    // stream of notices while the player is trying to read.
    if (reported === message) return;
    reported = message;
    onError?.(message);
  };

  const apply = () => {
    for (const voice of voices) {
      try {
        voice.el.volume = Math.max(0, Math.min(1, voice.level * volume));
      } catch {
        /* a test double, or an element that has gone away */
      }
    }
  };

  const stopFade = () => {
    if (fade) {
      unschedule(fade);
      fade = 0;
    }
  };

  /** Drops a voice and releases its buffer, so nothing keeps downloading. */
  const release = (voice: Voice) => {
    try {
      voice.el.pause();
      // Clearing the source is what actually stops a pending network fetch.
      voice.el.removeAttribute('src');
      voice.el.load?.();
      voice.el.remove?.();
    } catch {
      /* nothing to do about an element that will not be quiet */
    }
  };

  const start = (voice: Voice) => {
    if (!enabled || !visible) return;
    let result: unknown;
    try {
      result = voice.el.play?.();
    } catch {
      /*
       * Some environments throw synchronously rather than returning a
       * rejecting promise — jsdom does, and so does a decoder that has given
       * up. Either way the game carries on without music.
       */
      fail('The audio could not be started.');
      return;
    }
    if (result && typeof (result as Promise<void>).then === 'function') {
      (result as Promise<void>).then(
        () => setBlocked(false),
        () => {
          /*
           * Refused. Almost always the autoplay policy deciding the gesture
           * that got us here does not count — a reload, typically. Not an
           * error to shout about: the control comes back and the player can
           * ask again.
           */
          if (!destroyed) setBlocked(true);
        }
      );
    }
  };

  /**
   * Steps every live voice towards its target and tidies up at the end.
   *
   * One timer for the whole fade, so starting a new one cannot leave an old
   * one running: `stopFade` is called first, every time.
   */
  const runFade = (incoming: Voice, outgoing: Voice[]) => {
    stopFade();
    const steps = Math.max(1, Math.round(FADE_MS / FADE_STEP_MS));
    let step = 0;
    const from = outgoing.map((voice) => voice.level);

    const tick = () => {
      step += 1;
      const t = Math.min(1, step / steps);
      incoming.level = t;
      outgoing.forEach((voice, i) => {
        voice.level = from[i]! * (1 - t);
      });
      apply();
      if (t < 1) return;
      stopFade();
      for (const voice of outgoing) {
        release(voice);
      }
      voices = voices.filter((voice) => !outgoing.includes(voice));
      apply();
    };

    fade = schedule(tick, FADE_STEP_MS);
  };

  const setTrack = (track: TrackId | null) => {
    if (destroyed) return;
    // The whole no-restart rule, in one line: re-entering a room, examining
    // something, opening settings, switching input mode and every rerender all
    // arrive here with the track they already asked for.
    if (track === wanted) return;
    wanted = track;

    if (track === null) {
      /*
       * Silence — the title screen, or a state with no track. Fade out rather
       * than cut, and do not leave a voice behind.
       */
      stopFade();
      for (const voice of voices) release(voice);
      voices = [];
      return;
    }

    if (!enabled) return;
    swapTo(track);
  };

  /**
   * Brings a track in and takes everything else out.
   *
   * Cancelling the previous fade before starting is what makes rapid room
   * changes safe: any voice that was still fading is released here rather than
   * left to finish, so three doorways in two seconds cannot stack up four
   * elements or orphan one at a low volume for ever.
   */
  const swapTo = (track: TrackId) => {
    const src = resolve(track);
    if (src === null) {
      fail('This browser cannot play either of the audio formats the game ships.');
      return;
    }

    stopFade();

    const existing = voices.find((voice) => voice.track === track);
    if (existing && voices.length === 1) {
      // Already the only thing playing; just make sure it is up and audible.
      existing.level = 1;
      apply();
      start(existing);
      return;
    }

    /*
     * Never more than two sources: the one coming in, and one to fade from.
     *
     * The voice we are switching *to* is kept even if it is mid-fade-out —
     * turning round in a doorway must not release the element that is already
     * loaded and then make a second one. Everything else beyond the most
     * recent is released now; it is inaudible mid-fade anyway, and keeping it
     * would mean three elements downloading at once.
     */
    const others = voices.filter((voice) => voice !== existing);
    for (const voice of others.slice(0, -1)) release(voice);
    const fadeFrom = others.slice(-1);

    let incoming: Voice;
    if (existing) {
      incoming = existing;
      incoming.level = 0;
      // Incoming last, so `current()` names it.
      voices = [...fadeFrom, incoming];
    } else {
      voices = fadeFrom;
      let el: HTMLAudioElement;
      try {
        el = create(src);
      } catch {
        fail('The audio could not be started.');
        return;
      }
      el.loop = loops(track);
      el.preload = 'auto';
      el.addEventListener?.('error', () => fail('A music track could not be loaded.'));
      if (el.dataset) el.dataset.track = track;
      incoming = { el, track, level: 0 };
      voices.push(incoming);
    }

    const outgoing = voices.filter((voice) => voice !== incoming);
    if (outgoing.length === 0) {
      // Nothing to fade from: come up over the same interval rather than
      // starting at full volume mid-sentence.
      incoming.level = 0;
      apply();
      start(incoming);
      runFade(incoming, []);
      return;
    }

    apply();
    start(incoming);
    runFade(incoming, outgoing);
  };

  return {
    enable() {
      if (destroyed) return;
      enabled = true;
      setBlocked(false);
      if (wanted !== null) swapTo(wanted);
    },

    disable() {
      enabled = false;
      stopFade();
      for (const voice of voices) release(voice);
      voices = [];
      setBlocked(false);
    },

    setVolume(next) {
      volume = Math.max(0, Math.min(1, Number.isFinite(next) ? next : DEFAULT_VOLUME));
      // Live, and without restarting anything — including mid-crossfade, where
      // the per-voice levels are untouched and only the master changes.
      apply();
    },

    setTrack,

    setPageVisible(next) {
      if (visible === next) return;
      visible = next;
      if (destroyed) return;
      if (!next) {
        /*
         * Hidden: pause rather than release, so coming back resumes the same
         * position instead of restarting the track. Any fade in flight is
         * abandoned at its current levels, which is where it would have ended
         * up in a moment anyway.
         */
        stopFade();
        for (const voice of voices) {
          try {
            voice.el.pause();
          } catch {
            /* ignore */
          }
        }
        return;
      }
      if (!enabled || wanted === null) return;
      // Visible again. If a fade was cut short, the voice we want may be at a
      // partial level; put it up and play.
      const live = voices.find((voice) => voice.track === wanted);
      if (live) {
        live.level = 1;
        for (const voice of voices) if (voice !== live) release(voice);
        voices = [live];
        apply();
        start(live);
      } else {
        swapTo(wanted);
      }
    },

    destroy() {
      destroyed = true;
      enabled = false;
      stopFade();
      for (const voice of voices) release(voice);
      voices = [];
    },

    isBlocked: () => blocked,
    current: () => (voices.length === 0 ? null : voices[voices.length - 1]!.track),
    voices: () => voices.length,
  };
}
