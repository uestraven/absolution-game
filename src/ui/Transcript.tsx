import { useEffect, useLayoutEffect, useRef } from 'react';
import type { TranscriptEntry } from '../engine/types';
import { RichText } from './RichText';
import { BOUNCE_THRESHOLD_PX, createCascade } from './cascade';

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
   * Called when a block large enough to be felt lands. The shell uses it to
   * nudge the anchored input, so the command line reads as being pushed down
   * by the text rather than as a separate widget.
   */
  onHeavyFeed?: (pixels: number) => void;
}

export function Transcript({ entries, showOptionLists, onHeavyFeed }: TranscriptProps) {
  const shown = showOptionLists ? entries : entries.filter((e) => e.kind !== 'options');
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const cascade = useRef(createCascade());
  const firstPaint = useRef(true);

  // Follow new output only when the reader is already at the bottom. Someone
  // who has scrolled up to read history is left exactly where they are, with
  // no animation at all.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !pinned.current) return;
    if (firstPaint.current) {
      // Arriving at a restored transcript should not play a glide.
      firstPaint.current = false;
      cascade.current.snapToBottom(el);
      return;
    }
    const travelled = cascade.current.toBottom(el);
    if (travelled >= BOUNCE_THRESHOLD_PX) onHeavyFeed?.(travelled);
  }, [entries, showOptionLists, onHeavyFeed]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // A reader touching the scrollbar mid-glide takes it over immediately.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const stop = () => cascade.current.cancel();
    el.addEventListener('wheel', stop, { passive: true });
    el.addEventListener('touchstart', stop, { passive: true });
    el.addEventListener('pointerdown', stop, { passive: true });
    return () => {
      el.removeEventListener('wheel', stop);
      el.removeEventListener('touchstart', stop);
      el.removeEventListener('pointerdown', stop);
    };
  }, []);

  useEffect(() => () => cascade.current.cancel(), []);

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
