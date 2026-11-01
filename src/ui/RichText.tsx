import { Fragment, type ReactNode } from 'react';
import type { Vocabulary } from '../engine/highlighting';
import { DETERMINERS, REQUIRES_DETERMINER } from '../content/highlights';

export type Tint = 'mystery' | 'interactive' | 'success';

export interface RichTextProps {
  text: string;
  /** Terms allowed to be tinted. Omit for plain soft-white text. */
  vocabulary?: Vocabulary;
  /**
   * Which tint interactive terms take in this entry. Inside a successful
   * action the thing you just acquired or worked reads green; everywhere else
   * the same term reads cyan. Mystery terms are magenta regardless.
   */
  interactiveTint?: Extract<Tint, 'interactive' | 'success'>;
}

/**
 * Renders authored text as React nodes.
 *
 * The only markup understood is *emphasis*. Everything else is text, and the
 * output is React elements rather than HTML, so text from an imported save
 * cannot inject anything into the page. Whitespace is preserved by CSS
 * (`white-space: pre-wrap`), which keeps the indented inscriptions readable.
 *
 * Colour is applied here and nowhere else, over short spans only: most of
 * every paragraph stays soft white.
 */
export function RichText({ text, vocabulary, interactiveTint = 'interactive' }: RichTextProps) {
  const paragraphs = text.split('\n\n');
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p className="para" key={index}>
          {/* A fresh claim set per paragraph: enough to stop a colour
              repeating in one breath, without leaving the short summary
              lines further down an arrival uncoloured. */}
          {renderParagraph(paragraph, vocabulary, interactiveTint, new Set())}
        </p>
      ))}
    </>
  );
}

function renderParagraph(
  input: string,
  vocabulary: Vocabulary | undefined,
  interactiveTint: 'interactive' | 'success',
  claimed: Set<string>
): ReactNode[] {
  const out: ReactNode[] = [];
  const parts = input.split(/(\*[^*\n]+\*)/g);
  parts.forEach((part, index) => {
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      out.push(
        <em key={`e${index}`}>{tint(part.slice(1, -1), vocabulary, interactiveTint, claimed)}</em>
      );
      return;
    }
    out.push(...tint(part, vocabulary, interactiveTint, claimed, index));
  });
  return out;
}

interface Hit {
  start: number;
  end: number;
  tint: Tint;
}

/** Escapes a literal for use inside a RegExp. */
function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds the match pattern for one term.
 *
 * Terms that are also ordinary English only match behind a determiner, so "the
 * well" is tinted and "as well" is not; the determiner itself stays white.
 * Hyphens are treated as part of a word, so "well" does not match inside
 * "well-cap".
 */
function patternFor(term: string): RegExp {
  const body = escape(term);
  const open = `(?<![\\w-])`;
  const close = `(?![\\w-])`;
  if (REQUIRES_DETERMINER.has(term.toLowerCase())) {
    return new RegExp(`(?<=(?<![\\w-])(?:${DETERMINERS.join('|')})\\s)${body}${close}`, 'gi');
  }
  return new RegExp(`${open}${body}${close}`, 'gi');
}

/**
 * Finds tintable spans.
 *
 * Only the **first** occurrence of each term in a paragraph is tinted.
 * Repeating a colour on every mention of the well turns a paragraph into a
 * christmas tree; marking it once per paragraph is enough to say "this is a
 * thing you can act on", and keeps most of the text soft white.
 */
function collect(text: string, terms: string[], as: Tint, hits: Hit[], claimed: Set<string>): void {
  for (const term of terms) {
    const key = term.toLowerCase();
    if (claimed.has(key)) continue;
    for (const match of text.matchAll(patternFor(term))) {
      const start = match.index;
      const end = start + match[0].length;
      // First claim wins, so mystery terms beat interactive ones and longer
      // phrases beat the shorter phrases inside them.
      if (hits.some((hit) => start < hit.end && end > hit.start)) continue;
      hits.push({ start, end, tint: as });
      claimed.add(key);
      break;
    }
  }
}

function tint(
  text: string,
  vocabulary: Vocabulary | undefined,
  interactiveTint: 'interactive' | 'success',
  claimed: Set<string>,
  keyPrefix: number = 0
): ReactNode[] {
  if (!vocabulary || text.length === 0) {
    return [<Fragment key={`t${keyPrefix}`}>{text}</Fragment>];
  }

  const hits: Hit[] = [];
  collect(text, vocabulary.mystery, 'mystery', hits, claimed);
  collect(text, vocabulary.interactive, interactiveTint, hits, claimed);
  if (hits.length === 0) {
    return [<Fragment key={`t${keyPrefix}`}>{text}</Fragment>];
  }
  hits.sort((a, b) => a.start - b.start);

  const out: ReactNode[] = [];
  let cursor = 0;
  hits.forEach((hit, i) => {
    if (hit.start > cursor) {
      out.push(<Fragment key={`p${keyPrefix}-${i}`}>{text.slice(cursor, hit.start)}</Fragment>);
    }
    out.push(
      <span className={`tint-${hit.tint}`} key={`h${keyPrefix}-${i}`}>
        {text.slice(hit.start, hit.end)}
      </span>
    );
    cursor = hit.end;
  });
  if (cursor < text.length) {
    out.push(<Fragment key={`p${keyPrefix}-end`}>{text.slice(cursor)}</Fragment>);
  }
  return out;
}
