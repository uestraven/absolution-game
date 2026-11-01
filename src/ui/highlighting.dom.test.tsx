import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { RichText } from './RichText';
import { vocabulary } from '../engine/highlighting';
import { begin, typeAll } from '../testing/harness';
import { MAGENTA_TERMS } from '../content/highlights';
import type { Vocabulary } from '../engine/highlighting';

/** Renders text and reports what ended up in each tint. */
function tints(text: string, vocab: Vocabulary, interactiveTint?: 'interactive' | 'success') {
  const { container } = render(
    <RichText
      text={text}
      vocabulary={vocab}
      {...(interactiveTint ? { interactiveTint } : {})}
    />
  );
  const pick = (cls: string) =>
    [...container.querySelectorAll(`.tint-${cls}`)].map((el) => el.textContent ?? '');
  return {
    mystery: pick('mystery'),
    interactive: pick('interactive'),
    success: pick('success'),
    plain: container.textContent ?? '',
  };
}

const AT_SEALED = [
  'take lantern',
  'down',
  'east',
  'take wedge',
  'west',
  'west',
  'west',
  'in',
  'east',
];

describe('what the interface is allowed to tint', () => {
  it('never tints an object the player has not discovered', () => {
    const state = typeAll(begin(), AT_SEALED);
    expect(state.discovered).not.toContain('sealed.alcove');
    const vocab = vocabulary(state);

    expect(vocab.interactive).not.toContain('alcove');
    expect(vocab.interactive).not.toContain('seam');
    expect(vocab.interactive).not.toContain('opened passage');

    // Even if those words appear in text, nothing lights up.
    const out = tints('You think about the alcove and the seam behind it.', vocab);
    expect(out.interactive).toEqual([]);
    expect(out.plain).toBe('You think about the alcove and the seam behind it.');
  });

  it('starts tinting an object the moment it is discovered', () => {
    const before = typeAll(begin(), AT_SEALED);
    const after = typeAll(before, ['open shutter']);
    expect(after.discovered).toContain('sealed.alcove');
    expect(vocabulary(after).interactive).toContain('alcove');
    expect(tints('the alcove', vocabulary(after)).interactive).toEqual(['alcove']);
  });

  it('tints things that are present: objects, people, exits and carried items', () => {
    const square = typeAll(begin(), ['take lantern', 'down']);
    const vocab = vocabulary(square);
    expect(vocab.interactive).toContain('chalked plank');
    expect(vocab.interactive).toContain('Orla');
    expect(vocab.interactive).toContain('lantern');
    expect(vocab.interactive.some((t) => t.includes('cave path'))).toBe(true);
  });

  it('keeps colour on short spans, leaving most of a paragraph plain', () => {
    const square = typeAll(begin(), ['take lantern', 'down']);
    const text =
      'The square is busier than a working morning should be. Orla is at the plank with a stub ' +
      'of chalk, correcting something that does not need correcting.';
    const out = tints(text, vocabulary(square));
    const tinted = [...out.mystery, ...out.interactive].join('').length;
    expect(tinted).toBeGreaterThan(0);
    expect(tinted / text.length).toBeLessThan(0.25);
  });
});

describe('each colour keeps its meaning', () => {
  it('uses magenta for story terms and phenomena, not only for the twist', () => {
    const vocab = vocabulary(typeAll(begin(), ['take lantern', 'down']));
    expect(tints('the Wanderer is coming', vocab).mystery).toEqual(['Wanderer']);
    expect(tints('the prophecy on the plank', vocab).mystery).toEqual(['prophecy']);
    expect(tints('the Cave of Absolution', vocab).mystery).toEqual(['Cave of Absolution']);
    // Broad enough that magenta does not amount to pointing at the reveal.
    expect(MAGENTA_TERMS.length).toBeGreaterThan(10);
  });

  it('prefers magenta over cyan where a term is both', () => {
    const gallery = typeAll(begin(), ['take lantern', 'down', 'west', 'west', 'in']);
    const vocab = vocabulary(gallery);
    expect(vocab.interactive).toContain('worn relief');
    const out = tints('You look at the worn relief again.', vocab);
    expect(out.mystery).toEqual(['worn relief']);
    expect(out.interactive).toEqual([]);
  });

  it('turns an interactive term green inside a successful action', () => {
    const home = begin();
    const vocab = vocabulary(home);
    expect(vocab.interactive).toContain('lantern');
    const asNarration = tints('You lift the lantern off the sill.', vocab, 'interactive');
    const asSuccess = tints('You lift the lantern off the sill.', vocab, 'success');
    expect(asNarration.interactive).toEqual(['lantern']);
    expect(asNarration.success).toEqual([]);
    expect(asSuccess.success).toEqual(['lantern']);
    expect(asSuccess.interactive).toEqual([]);
  });

  it('leaves ordinary English alone when a term is also a common word', () => {
    const square = typeAll(begin(), ['take lantern', 'down']);
    const vocab = vocabulary(square);
    expect(vocab.interactive).toContain('well');
    // "the well" is the thing in the square; "as well" is not.
    expect(tints('You lean on the well.', vocab).interactive).toEqual(['well']);
    expect(tints('It went badly, as well it might.', vocab).interactive).toEqual([]);
  });

  it('matches whole words only, and not across a hyphen', () => {
    const square = typeAll(begin(), ['take lantern', 'down']);
    const vocab = vocabulary(square);
    expect(tints('a wellspring of regret', vocab).interactive).toEqual([]);
    expect(tints('a bowl of salt on the well-cap', vocab).interactive).not.toContain('well');
  });

  it('tints each term once per paragraph, not on every mention', () => {
    const square = typeAll(begin(), ['take lantern', 'down']);
    const vocab = vocabulary(square);
    const once = tints('the well, and then the well again, and the well a third time.', vocab);
    expect(once.interactive).toEqual(['well']);

    // A later paragraph gets its own chance, so the short summary lines at the
    // end of a room description are still marked.
    const twoParagraphs = tints('You lean on the well.\n\nYou can see the well.', vocab);
    expect(twoParagraphs.interactive).toEqual(['well', 'well']);
  });

  it('renders plain soft white when no vocabulary is supplied', () => {
    const { container } = render(<RichText text="The Wanderer and the well." />);
    expect(container.querySelectorAll('[class^=tint-]')).toHaveLength(0);
    expect(container.textContent).toBe('The Wanderer and the well.');
  });
});

describe('text rendering safety', () => {
  it('renders markup in text as literal characters, never as HTML', () => {
    const { container } = render(
      <RichText text={'<img src=x onerror="boom"> <b>bold?</b>'} vocabulary={{ mystery: [], interactive: [] }} />
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror="boom">');
  });

  it('still honours authored emphasis', () => {
    const { container } = render(<RichText text={'and *will they, though.*'} />);
    expect(container.querySelector('em')?.textContent).toBe('will they, though.');
  });

  it('keeps paragraph breaks', () => {
    const { container } = render(<RichText text={'One.\n\nTwo.\n\nThree.'} />);
    expect(container.querySelectorAll('p.para')).toHaveLength(3);
  });
});
