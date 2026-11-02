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

/** Shortest and longest glide. Height-scaled between the two. */
const MIN_MS = 60;
const MAX_MS = 100;

/** Past this much new content, the input gets a nudge as well. */
export const BOUNCE_THRESHOLD_PX = 120;

export function prefersReducedMotion(): boolean {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}

/** Exponential ease-out: fast departure, long settle, no overshoot. */
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
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
    const from = el.scrollTop;
    const target = Math.max(0, el.scrollHeight - el.clientHeight);
    const distance = target - from;

    // Nothing to do, no animation frames available, or motion is unwanted.
    if (distance <= 1 || prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
      el.scrollTop = target;
      return Math.max(0, distance);
    }

    // Longer glides for bigger drops, inside the 60–100 ms envelope.
    const duration = Math.min(MAX_MS, MIN_MS + Math.min(distance, 600) / 600 * (MAX_MS - MIN_MS));
    const started = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      // Re-read the target: content can still be settling (fonts, images).
      const live = Math.max(0, el.scrollHeight - el.clientHeight);
      el.scrollTop = from + (live - from) * easeOutExpo(t);
      if (t < 1) {
        frame = requestAnimationFrame(step);
      } else {
        frame = 0;
        el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
      }
    };

    frame = requestAnimationFrame(step);
    return distance;
  };

  return { toBottom, snapToBottom, cancel };
}
