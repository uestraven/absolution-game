import { m } from './markup';

/**
 * The canonical prophecy text — one source, every display.
 *
 * The plank in the opening square and the hero's recitation a century earlier
 * are the same words, because the recitation is where the plank's words come
 * from. Nothing may paraphrase, shorten, reorder or re-tone them:
 *
 *  - **No player choice touches this text.** Agency lives in the surrounding
 *    questions, the tone taken, how much is explained and who is told the
 *    truth. There are no wording variants and no flags recording wording.
 *  - **Transmission does not edit it either.** Ceremony, carvings, glosses and
 *    commentary accumulate around the words over the hundred years between the
 *    two scenes; the words themselves arrive unchanged, because a second
 *    author would break the only origin the story has.
 *
 * Kept as plain lines, with annotation applied at display time, so that
 * comparing the two scenes is a comparison of text rather than of markup.
 */
export const PROPHECY_LINES: readonly string[] = [
  'The Wanderer comes one-eyed and without mercy.',
  'The hill will open. The water will answer.',
  'What stands will not stand.',
  'One who braves the Cave of Absolution will have the power to turn it aside.',
];

/** The canonical text as one plain block, unannotated and unindented. */
export const PROPHECY_TEXT: string = PROPHECY_LINES.join('\n');

/**
 * The canonical text laid out for display, with the one annotation the visual
 * spec allows on it: the Wanderer is a significant story term.
 */
export function prophecyBlock(indent = '    '): string {
  return PROPHECY_LINES.map((line, i) =>
    i === 0 ? `${indent}${line.replace('The Wanderer', m('The Wanderer'))}` : `${indent}${line}`
  ).join('\n');
}
