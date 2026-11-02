import { useEffect, useLayoutEffect, useRef } from 'react';
import type { TranscriptEntry } from '../engine/types';
import { RichText } from './RichText';
import { readReadingMark, writeReadingMark } from '../persistence/storage';
import {
  contentTopOf,
  createCascade,
  lastResponseStart,
  responseStart,
  responseTarget,
  restoreAnchor,
  sampleAnchor,
  type EntryRef,
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

/** How often the reading position is written back to storage, at most. */
const MARK_INTERVAL_MS = 1500;

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
}

export function Transcript({
  entries,
  showOptionLists,
  actionCount,
  resumed = false,
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
  const rendered = useRef<EntryRef[]>([]);
  rendered.current = shown.map((e) => ({ id: e.id, kind: e.kind }));
  const allIds = useRef<string[]>([]);
  allIds.current = entries.map((e) => e.id);

  /** Id of the last entry that existed before the current action's output. */
  const mark = useRef<string | null>(null);
  /** The reader's own position, sampled as they move. */
  const anchor = useRef<ReadingAnchor | null>(null);
  /** When the reading position was last written back to storage. */
  const markWritten = useRef(0);

  /** Records where the reader is, for this mount and for the next one. */
  const remember = (el: HTMLElement, force = false) => {
    const sample = sampleAnchor(el, rendered.current);
    anchor.current = sample;
    if (sample === null) return;
    const now = Date.now();
    if (!force && now - markWritten.current < MARK_INTERVAL_MS) return;
    markWritten.current = now;
    writeReadingMark({ id: sample.id, offset: sample.offset });
  };

  // One position change per action, on the start of what the action produced.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const here = rendered.current;
    const all = allIds.current;

    /*
     * Where a transcript nobody watched arrive should open.
     *
     * A stored reading position wins, because the reader chose it. Failing
     * that, the start of the last response — never the bottom, which is how a
     * reader ends up resuming at the end of an epilogue they never read.
     */
    const openRestored = () => {
      const stored = resumed ? readReadingMark() : null;
      if (stored !== null && here.some((entry) => entry.id === stored.id)) {
        restoreAnchor(el, here, { ...stored, atBottom: false });
        return;
      }
      const start = lastResponseStart(here);
      const top = contentTopOf(el, start);
      cascade.current.jumpTo(el, top === null ? 0 : responseTarget(top, el.clientHeight, el.scrollHeight));
    };

    if (firstPaint.current) {
      firstPaint.current = false;
      /*
       * Neither case glides: there is nowhere to glide from on a first paint.
       *
       *  - **A new game starts at the top.** The opening is the first response
       *    and the reader has not read a word yet, so it begins where it begins.
       *  - **A restored transcript opens where it was left**, or at the start of
       *    the last thing that happened.
       */
      if (resumed) openRestored();
      else cascade.current.jumpTo(el, 0);
      mark.current = all[all.length - 1] ?? null;
      remember(el, true);
      return;
    }

    const start = responseStart(here, all, mark.current);
    mark.current = all[all.length - 1] ?? null;

    if (start === null) {
      /*
       * Either the action put nothing new on screen — its only output was an
       * option list that selectable mode draws as buttons — or the history was
       * replaced wholesale by an import or a checkpoint restart. Nothing new to
       * read in the first case; the restored transcript's last response in the
       * second. Neither is "scroll to the bottom".
       */
      if (!here.some((entry) => entry.id === anchor.current?.id)) openRestored();
      remember(el, true);
      return;
    }

    cascade.current.glideTo(el, () => {
      const top = contentTopOf(el, start);
      return top === null
        ? el.scrollTop
        : responseTarget(top, el.clientHeight, el.scrollHeight);
    });
    remember(el, true);
  }, [actionCount, resumed]);

  /*
   * Switching input mode inserts or removes the written-out option lists
   * throughout the history. That is a UI change, not a story event, so the
   * reader's place is put back rather than reset: the words that were under
   * their eye stay under their eye. If the entry they were on was itself an
   * option list that has just been hidden, nothing moves — the nearest
   * meaningful content is what is already on screen.
   */
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || firstPaint.current) return;
    restoreAnchor(el, rendered.current, anchor.current);
    remember(el, true);
  }, [showOptionLists]);

  /*
   * Reader-driven scrolling: it takes over any motion in flight immediately,
   * and it keeps the reading position current. Sampling is coalesced to one
   * frame because a scroll fires far more often than it needs measuring, and
   * the write-back is throttled on top of that.
   */
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let pending = 0;
    const onScroll = () => {
      if (pending || typeof requestAnimationFrame !== 'function') return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        remember(el);
      });
    };
    const takeOver = () => {
      cascade.current.cancel();
      onScroll();
    };
    // Leaving the page is the one moment the position is certainly worth having.
    const onLeave = () => remember(el, true);
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', takeOver, { passive: true });
    el.addEventListener('touchstart', takeOver, { passive: true });
    el.addEventListener('pointerdown', takeOver, { passive: true });
    el.addEventListener('keyup', onScroll, { passive: true });
    globalThis.addEventListener?.('pagehide', onLeave);
    return () => {
      if (pending) cancelAnimationFrame(pending);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', takeOver);
      el.removeEventListener('touchstart', takeOver);
      el.removeEventListener('pointerdown', takeOver);
      el.removeEventListener('keyup', onScroll);
      globalThis.removeEventListener?.('pagehide', onLeave);
    };
  }, []);

  useEffect(() => () => cascade.current.cancel(), []);

  /*
   * `tabIndex` makes the history keyboard-scrollable, which is the only reason
   * it is focusable. Nothing in here calls `focus()` or `scrollIntoView`:
   * moving the position must never move the keyboard off whatever the reader
   * was using.
   *
   * `aria-live="off"` is deliberate and is not a downgrade. `role="log"` is
   * implicitly a polite live region, and the shell already has a dedicated one
   * carrying exactly the newest output — so leaving the default on makes a
   * screen reader read every response twice, once from the log and once from
   * the announcer, with the whole history available to re-read in between. The
   * role is kept because it is what lets a reader navigate to the history on
   * purpose; the announcing is done in one place.
   */
  return (
    <div
      className="transcript"
      ref={scroller}
      tabIndex={0}
      role="log"
      aria-live="off"
      aria-label="Story so far"
    >
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
