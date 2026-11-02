import { describe, expect, it } from 'vitest';
import {
  TOP_GAP_PX,
  decidePosition,
  lastResponseStart,
  responseStart,
  responseTarget,
  type EntryRef,
  type PositionInput,
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

describe('deciding where to put the transcript', () => {
  const base: PositionInput = {
    rendered: [],
    all: [],
    mark: null,
    firstPaint: false,
    replaced: false,
    resumed: false,
    stored: null,
    seq: 10,
  };

  it('opens a new game at the top', () => {
    expect(
      decidePosition({ ...base, firstPaint: true, rendered: refs('t0', 't1'), all: ids('t0', 't1') })
    ).toEqual({ kind: 'top' });
  });

  it('opens an appended response at its start, gliding', () => {
    const rendered = refs('t0', 'c:look', 't2', 't3');
    expect(
      decidePosition({ ...base, rendered, all: ids('t0', 'c:look', 't2', 't3'), mark: 't0' })
    ).toEqual({ kind: 'response', index: 2, glide: true });
  });

  it('holds still when an action put nothing new on screen', () => {
    const rendered = refs('t0', 't1');
    expect(decidePosition({ ...base, rendered, all: ids('t0', 't1', 'opts'), mark: 't1' })).toEqual({
      kind: 'hold',
    });
  });

  describe('a replaced history', () => {
    /*
     * The bug this guards. An import or a checkpoint restart swaps the whole
     * transcript — and because ids are `t<seq>` with `seq` restarting at zero
     * every new game, the imported history usually contains the same ids as
     * the one it replaced.
     */
    const rendered = refs('t0', 'c:go west', 't2', 't3', 't4', 't5');
    const all = ids('t0', 'c:go west', 't2', 't3', 't4', 't5');

    it('opens at the start of its own last response, not after the stale mark', () => {
      const placement = decidePosition({ ...base, rendered, all, mark: 't2', replaced: true });
      // The last command echo is at index 1, so the last response starts at 2.
      expect(placement).toEqual({ kind: 'response', index: 2, glide: false });
    });

    it('would get it wrong if replacement were deduced from the ids', () => {
      /*
       * Documenting why `replaced` has to be told to us rather than worked
       * out: the stale mark 't2' is present in the imported history, so the
       * id-based check finds it and reports everything after it as newly
       * printed output. This is the failure, asserted directly.
       */
      expect(responseStart(rendered, all, 't2')).toBe(3);
      expect(decidePosition({ ...base, rendered, all, mark: 't2', replaced: false })).toEqual({
        kind: 'response',
        index: 3,
        glide: true,
      });
    });

    it('ignores a stored reading position, which describes the discarded history', () => {
      const placement = decidePosition({
        ...base,
        rendered,
        all,
        mark: 't2',
        replaced: true,
        resumed: true,
        stored: { id: 't4', offset: -120, seq: 10 },
      });
      expect(placement).toEqual({ kind: 'response', index: 2, glide: false });
    });
  });

  describe('resuming a saved game', () => {
    const rendered = refs('t0', 'c:look', 't2', 't3');
    const all = ids('t0', 'c:look', 't2', 't3');

    it('returns the reader to their own position', () => {
      expect(
        decidePosition({
          ...base,
          firstPaint: true,
          resumed: true,
          rendered,
          all,
          stored: { id: 't3', offset: -240, seq: 10 },
        })
      ).toEqual({ kind: 'entry', index: 3, offset: -240 });
    });

    it('ignores a position left by a different playthrough', () => {
      /*
       * `t3` exists in both games and means something different in each. The
       * seq stamp is what tells them apart — without it this opens the reader
       * at a paragraph they have never seen, in the middle of the history.
       */
      expect(
        decidePosition({
          ...base,
          firstPaint: true,
          resumed: true,
          rendered,
          all,
          seq: 10,
          stored: { id: 't3', offset: -240, seq: 47 },
        })
      ).toEqual({ kind: 'response', index: 2, glide: false });
    });

    it('ignores a position naming an entry that is no longer rendered', () => {
      expect(
        decidePosition({
          ...base,
          firstPaint: true,
          resumed: true,
          rendered,
          all,
          stored: { id: 'opts', offset: -10, seq: 10 },
        })
      ).toEqual({ kind: 'response', index: 2, glide: false });
    });

    it('never opens at the end of an unread passage', () => {
      const ending = refs('t7', 'c:swing', 't9', 't10', 't11', 't12', 't13');
      const placement = decidePosition({
        ...base,
        firstPaint: true,
        resumed: true,
        rendered: ending,
        all: ending.map((e) => e.id),
        stored: null,
      });
      expect(placement.kind).toBe('response');
      if (placement.kind === 'response') {
        expect(placement.index).toBe(2);
        expect(placement.index).toBeLessThan(ending.length - 1);
      }
    });
  });
});
