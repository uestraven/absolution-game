/**
 * Where the transcript looks after an action, and how it gets there.
 *
 * ## The rule
 *
 * The transcript does **not** chase the bottom of the text. Once an action's
 * whole output has rendered, the scroller is positioned on the *start* of that
 * output: if the response fits in the viewport it is revealed entire, and if it
 * does not, its first line is placed near the top of the viewport so the reader
 * begins at the beginning and reads down.
 *
 * Chasing the bottom is the wrong behaviour for a text game. A long response
 * ends with its last paragraph against the input and its first paragraph
 * somewhere above the top edge, so the reader has to scroll up to find out what
 * they are reading — and the longer and more important the response, the worse
 * it gets. Which is exactly backwards: the arrival in a new place, the
 * recitation, the epilogue are the passages a reader most needs to start at the
 * start of.
 *
 * ## One scroll per action
 *
 * The engine returns an action's events as one list and the shell commits them
 * in one state update, so there is exactly one position change per action,
 * taken after the whole response is in the DOM. Individual blocks within a
 * response — narration, then a journal entry, then an objective — never scroll
 * separately. The effect that drives this is keyed on the action counter alone,
 * never on the entries, so a re-render that is not an action moves nothing.
 *
 * ## The motion
 *
 * The position is animated rather than teleported: an old terminal moves its
 * text by a whole row, and this moves it at sub-pixel precision on a cubic
 * ease-out. The letters themselves still appear immediately — nothing is typed
 * out, held back or faded in, because the visual spec forbids it and because a
 * reader should never wait on an animation to find out what happened.
 *
 * Three rules it has to keep:
 *
 *  - **`prefers-reduced-motion` wins.** The glide is replaced by the jump, with
 *    no residue.
 *  - **It never fights the reader.** Any in-flight glide is cancelled when a
 *    new one starts or when the reader touches the scroller.
 *  - **It never moves focus.** Every move here is an assignment to `scrollTop`.
 *    `scrollIntoView` and `focus()` are deliberately not used: scrolling is not
 *    allowed to take the keyboard away from whatever the reader was using.
 */

/**
 * Glide envelope, distance-scaled.
 *
 * Earlier versions ran 60–100 ms and then 170–380 ms. Both were quick enough
 * that the motion read as a snap with a smear on it. At this length the eye can
 * actually follow the text to its resting place, which is the whole point of
 * animating it, and it gives the reader a moment to register that the position
 * moved rather than that the screen changed.
 */
const MIN_MS = 320;
const MAX_MS = 720;

/**
 * How much of the window the eye is asked to follow, at most.
 *
 * Animating a three-thousand-pixel jump is illegible however long it takes, so
 * a long move teleports most of the way and glides the last three quarters of
 * a screen. The motion then has a consistent, readable speed no matter how far
 * the position actually moved.
 */
const MAX_TRAVEL_SCREENS = 0.75;

/**
 * The breathing space left above a response placed at the top.
 *
 * Flush against the edge reads as clipped — as though the response has
 * something above it that has been cut off. A line's worth of gap reads as a
 * beginning.
 */
export const TOP_GAP_PX = 16;

/** Treated as "the reader is at the bottom" when deciding what to preserve. */
export const AT_BOTTOM_PX = 80;

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

/* ================================================================ *
 * Finding the response
 * ================================================================ */

/** What the positioning logic needs to know about one transcript entry. */
export interface EntryRef {
  id: string;
  /** `'command'` is the echo of what the player typed or chose. */
  kind: string;
}

/**
 * Index of the first *substantive* rendered entry of the newest response.
 *
 * `mark` is the id of the last entry that existed *before* the action, taken
 * from the unfiltered list; `all` is the unfiltered list now; `rendered` is
 * what is actually on screen, which in selectable mode omits the written-out
 * option lists. Resolving the mark against `all` and then looking for the first
 * of those new ids in `rendered` is what keeps the two in step — a mark that
 * happens to name a hidden entry still locates the response.
 *
 * The echo of the player's own command is skipped: they typed it, they do not
 * need it put at the top of the screen, and anchoring on it pushes the first
 * real line of the answer down by a line for no reason. If the echo is the only
 * new thing on screen it is used anyway, because it is still better than
 * nothing.
 *
 * Returns `null` for "not identifiable here": the action added nothing visible,
 * or the mark is not in `all` because the whole history was replaced (import,
 * checkpoint restart). Callers handle those separately rather than being handed
 * a misleading index — pointing at 0 would fling the reader to the top of the
 * entire history.
 */
export function responseStart(
  rendered: readonly EntryRef[],
  all: readonly string[],
  mark: string | null
): number | null {
  // No mark: nothing preceded this response, so all of it is the response.
  if (mark === null) return rendered.length === 0 ? null : 0;
  const i = all.indexOf(mark);
  if (i === -1) return null;
  const fresh = new Set(all.slice(i + 1));
  if (fresh.size === 0) return null;
  let firstFresh: number | null = null;
  for (let at = 0; at < rendered.length; at++) {
    const entry = rendered[at]!;
    if (!fresh.has(entry.id)) continue;
    if (firstFresh === null) firstFresh = at;
    if (entry.kind !== 'command') return at;
  }
  return firstFresh;
}

/**
 * Index of the start of the last response in a transcript nobody watched
 * arrive — a restored save, an import, a checkpoint.
 *
 * The echo of the player's last command is the boundary: it is written for
 * every action in both input modes, so the entries after the last one of them
 * are the last response. Without one, the whole transcript is treated as the
 * response and read from the top.
 *
 * This is the fallback the reader gets when there is no stored reading
 * position, and it is deliberately not the bottom: resuming at the end of a
 * long passage that was never read is the thing this whole module exists to
 * stop.
 */
export function lastResponseStart(rendered: readonly EntryRef[]): number {
  for (let at = rendered.length - 1; at >= 0; at--) {
    if (rendered[at]!.kind !== 'command') continue;
    // The first substantive entry after the echo, or the echo if it is last.
    for (let next = at + 1; next < rendered.length; next++) {
      if (rendered[next]!.kind !== 'command') return next;
    }
    return at;
  }
  return 0;
}

/**
 * The scroll position that shows a response from its beginning.
 *
 * The response is always the last thing in the content, so its height is the
 * distance from its top to the end, and there are exactly two cases:
 *
 *  - **It fits.** Scroll to the end of the content. That is the only position
 *    where all of it is on screen, and it leaves as much of what came before
 *    visible above it as there is room for.
 *  - **It does not fit.** Put its first line a gap below the top edge, with the
 *    rest of it below that to read down into.
 *
 * The clamp on the second case matters: it keeps the result inside what the
 * scroller can actually take when the measurement is odd — a response taller
 * than the whole history, or a transcript that cannot scroll at all.
 */
export function responseTarget(
  responseTop: number,
  viewport: number,
  scrollHeight: number
): number {
  const maxScroll = Math.max(0, scrollHeight - viewport);
  if (scrollHeight - responseTop <= viewport) return maxScroll;
  return Math.max(0, Math.min(maxScroll, responseTop - TOP_GAP_PX));
}

export function bottomOf(el: HTMLElement): number {
  return Math.max(0, el.scrollHeight - el.clientHeight);
}

export function isAtBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight < AT_BOTTOM_PX;
}

/**
 * Distance from the top of the scrollable content to the top of one child, in
 * the scroller's own coordinates.
 *
 * Measured from rectangles rather than `offsetTop` so it does not depend on
 * which ancestor happens to be the offset parent. Returns null when there is
 * nothing to measure, including under a test renderer with no layout.
 */
export function contentTopOf(el: HTMLElement, index: number): number | null {
  const child = el.children.item(index);
  if (!(child instanceof HTMLElement)) return null;
  if (typeof child.getBoundingClientRect !== 'function') return null;
  return child.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
}

/* ================================================================ *
 * Holding the reader's place
 * ================================================================ */

/**
 * Where the reader is reading: the topmost entry still in view, and how far
 * above the viewport's top edge it begins.
 */
export interface ReadingAnchor {
  id: string;
  /** Offset of that entry's top from the viewport's top edge; usually ≤ 0. */
  offset: number;
  atBottom: boolean;
}

/**
 * Samples the reading position.
 *
 * Taken while the reader scrolls, so that a later re-render which is not an
 * action — switching input mode, which inserts or removes the written-out
 * option lists throughout the history — can put the same words back under the
 * same eye instead of leaving `scrollTop` pointing at different text.
 */
export function sampleAnchor(el: HTMLElement, ids: readonly EntryRef[]): ReadingAnchor | null {
  if (typeof el.getBoundingClientRect !== 'function') return null;
  const top = el.getBoundingClientRect().top;
  const atBottom = isAtBottom(el);
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children.item(i);
    if (!(child instanceof HTMLElement)) continue;
    const entry = ids[i];
    if (entry === undefined) break;
    const rect = child.getBoundingClientRect();
    if (rect.bottom - top > 0) return { id: entry.id, offset: rect.top - top, atBottom };
  }
  return null;
}

/**
 * Puts a sampled reading position back after a non-action re-render.
 *
 * A reader pinned to the bottom stays pinned to the bottom; otherwise the
 * anchored entry is returned to the offset it had. If the anchored entry is no
 * longer rendered at all, nothing moves — a wrong correction is worse than
 * none.
 */
export function restoreAnchor(
  el: HTMLElement,
  ids: readonly EntryRef[],
  anchor: ReadingAnchor | null
): void {
  if (anchor === null) return;
  if (anchor.atBottom) {
    el.scrollTop = el.scrollHeight;
    return;
  }
  const index = ids.findIndex((entry) => entry.id === anchor.id);
  if (index === -1) return;
  const now = contentTopOf(el, index);
  if (now === null) return;
  el.scrollTop = Math.max(0, Math.min(bottomOf(el), now - anchor.offset));
}

/* ================================================================ *
 * The glide
 * ================================================================ */

export interface Cascade {
  /**
   * Glide to a position, re-read every frame so that content still settling —
   * fonts, wrapping, images — does not leave the move short. Returns the
   * distance the position is moving in total, which the shell uses to decide
   * whether the command line gets a nudge.
   */
  glideTo: (el: HTMLElement, targetOf: () => number) => number;
  /** Jump with no animation. */
  jumpTo: (el: HTMLElement, target: number) => void;
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

  const jumpTo = (el: HTMLElement, target: number) => {
    cancel();
    el.scrollTop = target;
  };

  const snapToBottom = (el: HTMLElement) => {
    cancel();
    el.scrollTop = el.scrollHeight;
  };

  const glideTo = (el: HTMLElement, targetOf: () => number) => {
    cancel();
    const start = el.scrollTop;
    const target = targetOf();
    const total = target - start;

    // Nothing to do, no animation frames available, or motion is unwanted.
    if (
      Math.abs(total) <= 1 ||
      prefersReducedMotion() ||
      typeof requestAnimationFrame !== 'function'
    ) {
      el.scrollTop = target;
      return Math.abs(total);
    }

    // Cover everything beyond one screenful instantly, then glide the rest.
    const maxTravel = Math.max(120, el.clientHeight * MAX_TRAVEL_SCREENS);
    if (Math.abs(total) > maxTravel) {
      el.scrollTop = target - Math.sign(total) * maxTravel;
    }

    const from = el.scrollTop;
    const glided = Math.min(Math.abs(target - from), maxTravel);
    const duration = MIN_MS + (glided / maxTravel) * (MAX_MS - MIN_MS);
    const started = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      // Re-read the target: content can still be settling (fonts, wrapping).
      const live = targetOf();
      el.scrollTop = from + (live - from) * easeOutCubic(t);
      if (t < 1) {
        frame = requestAnimationFrame(step);
      } else {
        frame = 0;
        el.scrollTop = targetOf();
      }
    };

    frame = requestAnimationFrame(step);
    // The total move, not the glided remainder: it stands in for how much text
    // arrived, which is what the nudge is reacting to.
    return Math.abs(total);
  };

  return { glideTo, jumpTo, snapToBottom, cancel };
}
