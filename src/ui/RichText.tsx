import { Fragment, type ReactNode } from 'react';

/**
 * Renders authored text as React nodes.
 *
 * The only markup understood is *emphasis*. Everything else is text, and the
 * output is React elements rather than HTML, so text from an imported save
 * cannot inject anything into the page. Whitespace is preserved by CSS
 * (`white-space: pre-wrap`), which keeps the indented inscriptions readable.
 */
export function RichText({ text }: { text: string }): ReactNode {
  const paragraphs = text.split('\n\n');
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p className="para" key={index}>
          {emphasise(paragraph)}
        </p>
      ))}
    </>
  );
}

function emphasise(input: string): ReactNode[] {
  const parts = input.split(/(\*[^*\n]+\*)/g);
  return parts.map((part, index) => {
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}
