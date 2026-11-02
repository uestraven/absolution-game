import { describe, expect, it } from 'vitest';
import {
  TOP_GAP_PX,
  lastResponseStart,
  responseStart,
  responseTarget,
  type EntryRef,
} from './cascade';

/** Shorthand: `'c:take lantern'` is a command echo, anything else is prose. */
function refs(...spec: string[]): EntryRef[] {
  return spec.map((id) =>
    id.startsWith('c:') ? { id: id.slice(2), kind: 'command' } : { id, kind: 'narration' }
  );
}

function ids(...spec: string[]): string[] {
  return spec.map((id) => (id.startsWith('c:') ? id.slice(2) : id));
}

/**
 * The positioning rule, on its own.
 *
 * These two functions are the whole of the decision the transcript makes after
 * an action: which entry begins the response, and where the scroller has to sit
 * to show it from there. Everything else in `cascade.ts` is measurement and
 * animation, which needs a real layout engine and is checked in the browser
 * pass instead.
 */

describe('finding the start of a response', () => {
  it('treats everything as the response when nothing came before', () => {
    expect(responseStart(refs('a', 'b'), ids('a', 'b'), null)).toBe(0);
  });

  it('starts at the first entry added since the mark', () => {
    expect(responseStart(refs('a', 'b', 'c', 'd'), ids('a', 'b', 'c', 'd'), 'b')).toBe(2);
  });

  it('skips the echo of the player\'s own command', () => {
    // They typed it. Putting it at the top of the screen pushes the first real
    // line of the answer down for nothing.
    const rendered = refs('a', 'c:take lantern', 'b');
    expect(responseStart(rendered, ids('a', 'c:take lantern', 'b'), 'a')).toBe(2);
  });

  it('uses the echo when it is the only new thing on screen', () => {
    const rendered = refs('a', 'c:look');
    expect(responseStart(rendered, ids('a', 'c:look'), 'a')).toBe(1);
  });

  it('finds the start even when the mark names an entry that is not rendered', () => {
    // 'opts' is an option list: written out in type-only mode, drawn as
    // buttons in selectable mode, so it can be the last entry and still be
    // absent from the screen.
    expect(responseStart(refs('a', 'c', 'd'), ids('a', 'opts', 'c', 'd'), 'opts')).toBe(1);
  });

  it('skips over hidden entries inside the response', () => {
    // The response is ['opts', 'c']; only 'c' is on screen.
    expect(responseStart(refs('a', 'b', 'c'), ids('a', 'b', 'opts', 'c'), 'b')).toBe(2);
  });

  it('reports nothing identifiable when the action added nothing visible', () => {
    expect(responseStart(refs('a', 'b'), ids('a', 'b', 'opts'), 'b')).toBeNull();
  });

  it('reports nothing identifiable when the action added nothing at all', () => {
    expect(responseStart(refs('a', 'b'), ids('a', 'b'), 'b')).toBeNull();
  });

  it('reports nothing identifiable when the history was replaced', () => {
    /*
     * An import or a checkpoint restart swaps the whole transcript, so the
     * mark names an entry that is simply gone. Answering 0 would fling the
     * reader to the top of a history they did not ask to re-read; answering
     * with the end would drop them at the bottom of it. The caller handles it.
     */
    expect(responseStart(refs('c', 'd'), ids('c', 'd'), 'gone')).toBeNull();
  });
});

describe('opening a transcript nobody watched arrive', () => {
  it('starts at the response after the last command echo', () => {
    expect(lastResponseStart(refs('a', 'c:look', 'b', 'c'))).toBe(2);
  });

  it('uses the echo itself when the response is only the echo', () => {
    expect(lastResponseStart(refs('a', 'b', 'c:look'))).toBe(2);
  });

  it('reads the whole thing from the top when no command was ever echoed', () => {
    // The opening of a new game, restored before the first action.
    expect(lastResponseStart(refs('a', 'b'))).toBe(0);
    expect(lastResponseStart([])).toBe(0);
  });

  it('is never the end of the transcript', () => {
    /*
     * The point of the fallback: a player who closed the tab on an unread
     * epilogue must not resume at the bottom of it.
     */
    const restored = refs('earlier', 'c:swing', 'sacrifice', 'cave', 'journal', 'epilogue', 'end');
    const start = lastResponseStart(restored);
    expect(start).toBe(2);
    expect(start).toBeLessThan(restored.length - 1);
  });
});

describe('where the scroller sits to show a response', () => {
  const viewport = 500;

  it('reveals a response that fits in the viewport entire', () => {
    // 2000px of content, the last 300 of it this response.
    const target = responseTarget(1700, viewport, 2000);
    expect(target).toBe(1500);
    // Visible band is [target, target + viewport]: the response is inside it.
    expect(1700).toBeGreaterThanOrEqual(target);
    expect(2000).toBeLessThanOrEqual(target + viewport);
  });

  it('puts the start of a response too tall to fit near the top', () => {
    // The same content, but this response is 800px of it.
    const target = responseTarget(1200, viewport, 2000);
    expect(target).toBe(1200 - TOP_GAP_PX);
    // Its first line is on screen, a small gap below the top edge.
    expect(1200 - target).toBe(TOP_GAP_PX);
  });

  it('shows the start of the response on screen whatever its height', () => {
    const scrollHeight = 4000;
    for (let height = 20; height <= 3000; height += 20) {
      const responseTop = scrollHeight - height;
      const target = responseTarget(responseTop, viewport, scrollHeight);
      // Never above the band, never below it.
      expect(responseTop).toBeGreaterThanOrEqual(target);
      expect(responseTop).toBeLessThan(target + viewport);
      // And when it fits, all of it is in the band.
      if (height <= viewport) expect(scrollHeight).toBeLessThanOrEqual(target + viewport);
    }
  });

  it('never asks for a position the scroller cannot take', () => {
    expect(responseTarget(10, 500, 2000)).toBe(0);
    expect(responseTarget(0, 500, 2000)).toBe(0);
    // Content shorter than the viewport cannot scroll at all.
    expect(responseTarget(400, 500, 300)).toBe(0);
    expect(responseTarget(5000, 500, 2000)).toBe(1500);
  });
});
