import { useEffect, useLayoutEffect, useRef } from 'react';
import type { TranscriptEntry } from '../engine/types';
import { RichText } from './RichText';

/** Spoken name for each entry kind, so nothing depends on colour alone. */
const KIND_NAME: Record<TranscriptEntry['kind'], string> = {
  narration: 'Narration',
  command: 'Your command',
  location: 'Arrival',
  dialogue: 'Conversation',
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
}

export function Transcript({ entries, showOptionLists }: TranscriptProps) {
  const shown = showOptionLists ? entries : entries.filter((e) => e.kind !== 'options');
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  // Only follow new output when the reader is already at the bottom. Someone
  // who has scrolled up to read history is left exactly where they are.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !pinned.current) return;
    el.scrollTop = el.scrollHeight;
  }, [entries, showOptionLists]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

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
              <span aria-hidden="true">› </span>
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
