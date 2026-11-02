/**
 * Authored semantic annotation.
 *
 * Colour is written into the prose on purpose, one short phrase at a time,
 * rather than inferred by matching substrings. That distinction matters: "eye"
 * is scenery in one sentence, anatomy in another and a clue in a third, and no
 * amount of vocabulary tuning can tell those apart. The author can.
 *
 * Syntax is `{{tag|text}}`:
 *
 *   {{m|the Wanderer}}   significant story terms and unusual phenomena
 *   {{c|the relief}}      exits, interactable objects, conversation topics
 *   {{g|the wedge}}       successful actions, acquired items, objectives met
 *
 * Three properties this has to keep:
 *
 *  - **Plain text is always recoverable.** `stripMarkup` gives the bare words
 *    for screen-reader announcements, the parser, and anything comparing text.
 *  - **It renders as React nodes, never as HTML.** See ui/RichText.
 *  - **Unmarked text is valid.** Transcript strings saved before annotation
 *    existed contain no tags, strip to themselves, and render as plain soft
 *    white. No migration is needed.
 *
 * Doubled braces avoid any collision with the `{they}` pronoun templates in
 * content/characters.
 */

export type MarkupTag = 'm' | 'c' | 'g';

export const MARKUP_PATTERN = /\{\{([mcg])\|([^{}]*)\}\}/g;

/** Significant story term or unusual phenomenon. */
export const m = (text: string): string => `{{m|${text}}}`;

/** Exit, interactable object, or conversation topic. */
export const c = (text: string): string => `{{c|${text}}}`;

/** Successful action, acquired item, or completed objective. */
export const g = (text: string): string => `{{g|${text}}}`;

/**
 * Removes every annotation, leaving the words.
 *
 * Also removes a tag the renderer would not recognise, so a typo degrades to
 * plain prose rather than showing braces to a player.
 */
export function stripMarkup(text: string): string {
  return text.replace(MARKUP_PATTERN, '$2').replace(/\{\{[^{}]*\|([^{}]*)\}\}/g, '$1');
}

/** True when the text carries at least one annotation. */
export function hasMarkup(text: string): boolean {
  MARKUP_PATTERN.lastIndex = 0;
  return MARKUP_PATTERN.test(text);
}
