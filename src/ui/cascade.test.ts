import { describe, expect, it } from 'vitest';
import { TOP_GAP_PX, responseStart, responseTarget } from './cascade';

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
    expect(responseStart(['a', 'b'], ['a', 'b'], null)).toBe(0);
  });

  it('starts at the first entry added since the mark', () => {
    const all = ['a', 'b', 'c', 'd'];
    expect(responseStart(all, all, 'b')).toBe(2);
  });

  it('finds the start even when the mark names an entry that is not rendered', () => {
    // 'opts' is an option list: written out in type-only mode, drawn as
    // buttons in selectable mode, so it can be the last entry and still be
    // absent from the screen.
    const all = ['a', 'opts', 'c', 'd'];
    const rendered = ['a', 'c', 'd'];
    expect(responseStart(rendered, all, 'opts')).toBe(1);
  });

  it('skips over hidden entries inside the response', () => {
    const all = ['a', 'b', 'opts', 'c'];
    const rendered = ['a', 'b', 'c'];
    // The response is ['opts', 'c']; only 'c' is on screen.
    expect(responseStart(rendered, all, 'b')).toBe(2);
  });

  it('reports no rendered start when the action added nothing visible', () => {
    const all = ['a', 'b', 'opts'];
    const rendered = ['a', 'b'];
    expect(responseStart(rendered, all, 'b')).toBe(rendered.length);
  });

  it('reports no rendered start when the action added nothing at all', () => {
    const all = ['a', 'b'];
    expect(responseStart(all, all, 'b')).toBe(all.length);
  });

  it('falls back to the end rather than the top when the mark has aged out', () => {
    // The cap drops entries from the front. Answering 0 here would fling the
    // reader to the very beginning of the history.
    const all = ['c', 'd'];
    expect(responseStart(all, all, 'gone')).toBe(all.length);
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
