import { useEffect, useLayoutEffect, useRef } from 'react';
import type { TranscriptEntry } from '../engine/types';
import { RichText } from './RichText';
import {
  BOUNCE_THRESHOLD_PX,
  bottomOf,
  contentTopOf,
  createCascade,
  responseStart,
  responseTarget,
  restoreAnchor,
  sampleAnchor,
  type ReadingAnchor,
} from './cascade';

/**
 * Spoken name for each entry kind. Every colour in the transcript is backed by
 * one of these, so the meaning survives without colour.
 */
const KIND_NAME: Record<TranscriptEntry['kind'], string> = {
  narration: 'Narration',
  command: 'Your command',
  location: 'Arrival',
  dialogue: 'Conversation',
  success: 'Done',
  system: 'Information',
  options: 'Choices',
  objective: 'Objective',
  journal: 'Journal entry',
  failure: 'Nothing happens',
};

export interface TranscriptProps {
  entries: TranscriptEntry[];
  /**
   * Selectable mode renders the same choices as buttons, so the written-out
   * numbered list would be duplicate noise there.
   */
  showOptionLists: boolean;
  /**
   * Increments once per player action.
   *
   * This is the only thing that moves the scroll position, and it moves it
   * once, after the action's whole output has rendered — to the beginning of
   * that output, not to the bottom of the text. Re-renders that are not actions
   * (opening settings, folding the status bar, switching input mode) hold the
   * reader's place instead.
   */
  actionCount: number;
  /**
   * True when this transcript was restored — Continue, an import, a checkpoint
   * — rather than begun. It decides where the first paint sits, and is fixed
   * for the life of the mount.
   */
  resumed?: boolean;
  /**
   * Called when a block large enough to be felt lands. The shell uses it to
   * nudge the anchored input, so the command line reads as being pushed down
   * by the text rather than as a separate widget.
   */
  onHeavyFeed?: (pixels: number) => void;
}

export function Transcript({
  entries,
  showOptionLists,
  actionCount,
  resumed = false,
  onHeavyFeed,
}: TranscriptProps) {
  const shown = showOptionLists ? entries : entries.filter((e) => e.kind !== 'options');
  const scroller = useRef<HTMLDivElement>(null);
  const cascade = useRef(createCascade());
  const firstPaint = useRef(true);

  /*
   * Latest-value refs, so the effects below can read what is on screen without
   * taking the entries as dependencies — which would make them fire per render
   * instead of per action, and scroll for individual blocks.
   */
  const renderedIds = useRef<string[]>([]);
  renderedIds.current = shown.map((e) => e.id);
  const allIds = useRef<string[]>([]);
  allIds.current = entries.map((e) => e.id);

  /** Id of the last entry that existed before the current action's output. */
  const mark = useRef<string | null>(null);
  /** The reader's own position, sampled as they move. */
  const anchor = useRef<ReadingAnchor | null>(null);

  // One position change per action, on the start of what the action produced.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const rendered = renderedIds.current;
    const all = allIds.current;
    const remember = () => {
      mark.current = all[all.length - 1] ?? null;
      anchor.current = sampleAnchor(el, rendered);
    };

    if (firstPaint.current) {
      firstPaint.current = false;
      /*
       * Neither case glides: there is nowhere to glide from on the first paint.
       *
       *  - **A new game starts at the top.** The opening is the first response
       *    and the reader has not read a word yet, so it begins where it begins.
       *    This is what the positioning rule returns on its own for a response
       *    that starts the transcript — `responseTarget(0, …)` is 0 whether or
       *    not the opening fits — so it is stated here as the plain number.
       *  - **A restored transcript shows its end.** The reader is resuming, not
       *    reading a new response: what they want is the last thing that
       *    happened before they closed the tab.
       */
      if (resumed) cascade.current.snapToBottom(el);
      else cascade.current.jumpTo(el, 0);
      remember();
      return;
    }

    const start = responseStart(rendered, all, mark.current);
    const targetOf =
      start >= rendered.length
        ? // Nothing new is on screen — an action whose only output was an
          // option list that selectable mode draws as buttons. Fall back to the
          // end of the text, which is where the reader already is.
          () => bottomOf(el)
        : () => {
            const top = contentTopOf(el, start);
            return top === null ? bottomOf(el) : responseTarget(top, el.clientHeight, el.scrollHeight);
          };

    const travelled = cascade.current.glideTo(el, targetOf);
    remember();
    if (travelled >= BOUNCE_THRESHOLD_PX) onHeavyFeed?.(travelled);
  }, [actionCount, resumed, onHeavyFeed]);

  /*
   * Switching input mode inserts or removes the written-out option lists
   * throughout the history. That is a UI change, not a story event, so the
   * reader's place is put back rather than reset: the words that were under
   * their eye stay under their eye.
   */
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || firstPaint.current) return;
    restoreAnchor(el, renderedIds.current, anchor.current);
    anchor.current = sampleAnchor(el, renderedIds.current);
  }, [showOptionLists]);

  /*
   * Reader-driven scrolling: it takes over any glide in flight immediately, and
   * it keeps the reading anchor current. Sampling is coalesced to one frame
   * because a scroll fires far more often than it needs measuring.
   */
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let pending = 0;
    const onScroll = () => {
      if (pending || typeof requestAnimationFrame !== 'function') return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        anchor.current = sampleAnchor(el, renderedIds.current);
      });
    };
    const takeOver = () => {
      cascade.current.cancel();
      onScroll();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', takeOver, { passive: true });
    el.addEventListener('touchstart', takeOver, { passive: true });
    el.addEventListener('pointerdown', takeOver, { passive: true });
    return () => {
      if (pending) cancelAnimationFrame(pending);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', takeOver);
      el.removeEventListener('touchstart', takeOver);
      el.removeEventListener('pointerdown', takeOver);
    };
  }, []);

  useEffect(() => () => cascade.current.cancel(), []);

  /*
   * `tabIndex` makes the history keyboard-scrollable, which is the only reason
   * it is focusable. Nothing in here calls `focus()` or `scrollIntoView`:
   * moving the position must never move the keyboard off whatever the reader
   * was using.
   */
  return (
    <div className="transcript" ref={scroller} tabIndex={0} role="log" aria-label="Story so far">
      {shown.map((entry) => (
        <article className={`entry entry-${entry.kind}`} key={entry.id}>
          {entry.heading ? (
            <header className="entry-head">
              <h2 className="entry-title">{entry.heading}</h2>
              {entry.subheading ? <p className="entry-sub">{entry.subheading}</p> : null}
            </header>
          ) : null}
          <span className="sr-only">{KIND_NAME[entry.kind]}: </span>
          {entry.kind === 'command' ? (
            <p className="para command-line">
              <span aria-hidden="true">&gt; </span>
              {entry.text}
            </p>
          ) : (
            <RichText text={entry.text} />
          )}
        </article>
      ))}
    </div>
  );
}
