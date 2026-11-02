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
   * Increments once per player action. Any change scrolls to the bottom,
   * wherever the reader had got to — they just did something and want to see
   * what happened. Re-renders that are not actions (opening settings, folding
   * the status bar, switching input mode) leave the position alone.
   */
  actionCount: number;
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
  onHeavyFeed,
}: TranscriptProps) {
  const shown = showOptionLists ? entries : entries.filter((e) => e.kind !== 'options');
  const scroller = useRef<HTMLDivElement>(null);
  const cascade = useRef(createCascade());
  const firstPaint = useRef(true);

  // Every action goes to the bottom. A reader who scrolled up to check
  // something and then typed a command is asking to see the result of it.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (firstPaint.current) {
      // Arriving at a restored transcript should not play a glide.
      firstPaint.current = false;
      cascade.current.snapToBottom(el);
      return;
    }
    const travelled = cascade.current.toBottom(el);
    if (travelled >= BOUNCE_THRESHOLD_PX) onHeavyFeed?.(travelled);
  }, [actionCount, onHeavyFeed]);

  // Switching input mode changes what is rendered but is not an action, so the
  // position is kept rather than reset.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || firstPaint.current) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (atBottom) cascade.current.snapToBottom(el);
  }, [showOptionLists]);

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
