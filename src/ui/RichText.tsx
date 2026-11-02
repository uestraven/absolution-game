import { Fragment, type ReactNode } from 'react';
import { type MarkupTag } from '../content/markup';

const TINT_CLASS: Record<string, string> = {
  m: 'tint-mystery',
  c: 'tint-interactive',
  g: 'tint-success',
};

export interface RichTextProps {
  text: string;
}

/**
 * Renders authored text as React nodes.
 *
 * Two kinds of markup, both authored and both tiny: `*emphasis*` and the
 * `{{tag|text}}` semantic annotations from content/markup. Everything else is
 * literal text, and the output is React elements rather than HTML, so a string
 * from an imported save cannot inject anything into the page.
 *
 * An unrecognised tag renders as its inner text, so a content typo shows prose
 * rather than braces. Whitespace is preserved by CSS (`white-space: pre-wrap`),
 * which keeps the indented inscriptions readable.
 */
export function RichText({ text }: RichTextProps) {
  return (
    <>
      {text.split('\n\n').map((paragraph, index) => (
        <p className="para" key={index}>
          {renderParagraph(paragraph)}
        </p>
      ))}
    </>
  );
}

function renderParagraph(input: string): ReactNode[] {
  const out: ReactNode[] = [];
  input.split(/(\*[^*\n]+\*)/g).forEach((part, index) => {
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      out.push(<em key={`e${index}`}>{renderTints(part.slice(1, -1), `e${index}`)}</em>);
      return;
    }
    out.push(...renderTints(part, `p${index}`));
  });
  return out;
}

function renderTints(text: string, keyPrefix: string): ReactNode[] {
  // Any brace group, so an unknown tag is consumed rather than shown.
  const anyTag = /\{\{([^{}|]*)\|([^{}]*)\}\}/g;
  const out: ReactNode[] = [];
  let cursor = 0;
  let index = 0;

  for (const match of text.matchAll(anyTag)) {
    const start = match.index;
    if (start > cursor) {
      out.push(<Fragment key={`${keyPrefix}t${index}`}>{text.slice(cursor, start)}</Fragment>);
    }
    const tag = (match[1] ?? '') as MarkupTag;
    const body = match[2] ?? '';
    const className = TINT_CLASS[tag];
    out.push(
      className ? (
        <span className={className} key={`${keyPrefix}h${index}`}>
          {body}
        </span>
      ) : (
        <Fragment key={`${keyPrefix}h${index}`}>{body}</Fragment>
      )
    );
    cursor = start + match[0].length;
    index += 1;
  }

  if (cursor < text.length) {
    out.push(<Fragment key={`${keyPrefix}end`}>{text.slice(cursor)}</Fragment>);
  }
  return out;
}
