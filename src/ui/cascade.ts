/**
 * The kinetic line-feed, for the transcript.
 *
 * An old terminal teleports its text up by a whole row. The scroll position
 * here is animated instead: when a new block lands, the text glides up to meet
 * the bottom over 60–100 ms on an exponential ease-out, at sub-pixel precision.
 * The letters themselves still appear immediately — nothing is typed out, held
 * back or faded in, because the visual spec forbids that and because a reader
 * should never be waiting on an animation to find out what happened.
 *
 * Two rules it has to keep:
 *
 *  - **`prefers-reduced-motion` wins.** The glide is replaced by the jump, with
 *    no residue.
 *  - **It never fights the reader.** Any in-flight glide is cancelled when a
 *    new one starts, and a reader who has scrolled up is not animated at all.
 */

/**
 * Glide envelope, distance-scaled.
 *
 * The first version ran 60–100 ms, which over a thousand pixels is not a
 * glide, it is a blur with a stop at the end. Longer and gentler reads as
 * motion you can follow.
 */
const MIN_MS = 170;
const MAX_MS = 380;

/**
 * How much of the window the eye is asked to follow, at most.
 *
 * Animating a three-thousand-pixel jump is illegible however long it takes, so
 * a long drop teleports most of the way and glides the last three quarters of
 * a screen. The motion then has a consistent, readable speed no matter how
 * much text arrived.
 */
const MAX_TRAVEL_SCREENS = 0.75;

/** Past this much new content, the input gets a nudge as well. */
export const BOUNCE_THRESHOLD_PX = 120;

export function prefersReducedMotion(): boolean {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}

/**
 * Cubic ease-out: decelerates without the violent opening of an exponential.
 * No overshoot, so text never appears to go past and come back.
 */
function easeOutCubic(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(1 - t, 3);
}

export interface Cascade {
  /** Glide to the bottom. Returns the distance it will travel. */
  toBottom: (el: HTMLElement) => number;
  /** Jump to the bottom with no animation. */
  snapToBottom: (el: HTMLElement) => void;
  /** Stop any glide in flight. */
  cancel: () => void;
}

/**
 * Creates a cascade controller. One per scroller; the caller owns its
 * lifetime and must `cancel()` on unmount.
 */
export function createCascade(): Cascade {
  let frame = 0;

  const cancel = () => {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  const snapToBottom = (el: HTMLElement) => {
    cancel();
    el.scrollTop = el.scrollHeight;
  };

  const toBottom = (el: HTMLElement) => {
    cancel();
    const target = Math.max(0, el.scrollHeight - el.clientHeight);
    const total = target - el.scrollTop;

    // Nothing to do, no animation frames available, or motion is unwanted.
    if (total <= 1 || prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
      el.scrollTop = target;
      return Math.max(0, total);
    }

    // Cover everything beyond one screenful instantly, then glide the rest.
    const maxTravel = Math.max(120, el.clientHeight * MAX_TRAVEL_SCREENS);
    if (total > maxTravel) el.scrollTop = target - maxTravel;

    const from = el.scrollTop;
    const travel = target - from;
    const duration =
      MIN_MS + (Math.min(travel, maxTravel) / maxTravel) * (MAX_MS - MIN_MS);
    const started = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      // Re-read the target: content can still be settling (fonts, wrapping).
      const live = Math.max(0, el.scrollHeight - el.clientHeight);
      el.scrollTop = from + (live - from) * easeOutCubic(t);
      if (t < 1) {
        frame = requestAnimationFrame(step);
      } else {
        frame = 0;
        el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
      }
    };

    frame = requestAnimationFrame(step);
    return travel;
  };

  return { toBottom, snapToBottom, cancel };
}
