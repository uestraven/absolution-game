import type { GameAction } from './types';

/**
 * A deliberately small, authored-synonym parser.
 *
 * It recognises a fixed command vocabulary plus explicitly listed synonyms.
 * It is not a natural-language parser and makes no attempt to be one: input
 * it does not recognise becomes an UNPARSED action, which the reducer turns
 * into feedback without advancing the story or touching inventory.
 */

export interface ParseTopic {
  id: string;
  label: string;
  aliases?: string[];
}

export interface ParseContext {
  /** Conversation topics currently offered, in display order (1-based to the player). */
  topics?: ParseTopic[];
  /** Disambiguation options currently offered, in display order. */
  clarificationLabels?: string[];
}

const ARTICLES = new Set(['the', 'a', 'an', 'some', 'my', 'your', 'that', 'this']);

const DIRECTIONS: Record<string, string> = {
  n: 'north',
  north: 'north',
  s: 'south',
  south: 'south',
  e: 'east',
  east: 'east',
  w: 'west',
  west: 'west',
  ne: 'northeast',
  northeast: 'northeast',
  nw: 'northwest',
  northwest: 'northwest',
  se: 'southeast',
  southeast: 'southeast',
  sw: 'southwest',
  southwest: 'southwest',
  u: 'up',
  up: 'up',
  d: 'down',
  down: 'down',
  in: 'in',
  inside: 'in',
  out: 'out',
  outside: 'out',
  back: 'back',
};

const THRESHOLD_NOUNS = new Set([
  'threshold',
  'basin',
  'water',
  'pool',
  'depth',
  'the threshold',
  'deep.threshold',
  'pastdeep.basin',
  // The second crossing goes through the half-cut aperture rather than into a
  // basin, and the same verbs have to reach it.
  'aperture',
  'opening',
  'panel',
  'half-cut aperture',
  'thinned panel',
  'worksite.aperture',
  'gap in the panel',
  'middle dish',
  'futuresealed.middledish',
]);

/** Nouns that mean "the prophecy" when the hero is being asked for it. */
const PROPHECY_NOUNS = new Set([
  'prophecy',
  'it',
  'the prophecy',
  'words',
  'the words',
  'warning',
  'the warning',
  'wanderer words',
  'prophecy word for word',
]);

/** Everything the help text lists, used to spot a verb typed with no object. */
const KNOWN_VERBS = new Set([
  'look',
  'l',
  'examine',
  'inspect',
  'x',
  'study',
  'read',
  'search',
  'go',
  'move',
  'walk',
  'head',
  'travel',
  'climb',
  'enter',
  'cross',
  'take',
  'get',
  'grab',
  'pick',
  'drop',
  'put',
  'place',
  'set',
  'stand',
  'use',
  'wedge',
  'prop',
  'open',
  'close',
  'shut',
  'light',
  'kindle',
  'ignite',
  'strike',
  'talk',
  'speak',
  'ask',
  'inventory',
  'i',
  'inv',
  'journal',
  'log',
  'notes',
  'hint',
  'help',
  'commands',
  'exits',
  'retrieve',
  'remove',
  'fill',
  'give',
  'hand',
  'offer',
  'recite',
  'say',
  'tell',
  'wait',
  'break',
  'smash',
  'hit',
  'swing',
  'clear',
  'pull',
  'think',
  'reflect',
  'consider',
]);

export function normalizeInput(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[`'"‘’“”]/g, '')
    .replace(/[.,!?;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripArticles(words: string[]): string[] {
  return words.filter((w) => !ARTICLES.has(w));
}

function joinRest(words: string[], from: number): string {
  return stripArticles(words.slice(from)).join(' ').trim();
}

/** Splits on the first occurrence of any of the given separator words. */
function splitOn(words: string[], separators: string[]): { left: string; right: string } | null {
  for (let i = 1; i < words.length - 1; i += 1) {
    if (separators.includes(words[i]!)) {
      return {
        left: stripArticles(words.slice(0, i)).join(' '),
        right: stripArticles(words.slice(i + 1)).join(' '),
      };
    }
  }
  return null;
}

function matchTopic(input: string, topics: ParseTopic[]): string | null {
  const asNumber = Number.parseInt(input, 10);
  if (String(asNumber) === input && asNumber >= 1 && asNumber <= topics.length) {
    return topics[asNumber - 1]!.id;
  }
  const exact = topics.find(
    (t) =>
      t.id === input ||
      normalizeInput(t.label) === input ||
      (t.aliases ?? []).some((a) => normalizeInput(a) === input)
  );
  if (exact) return exact.id;

  const partial = topics.filter(
    (t) =>
      normalizeInput(t.label).includes(input) ||
      (t.aliases ?? []).some((a) => normalizeInput(a).includes(input))
  );
  return partial.length === 1 ? partial[0]!.id : null;
}

function matchClarification(input: string, labels: string[]): string | null {
  const asNumber = Number.parseInt(input, 10);
  if (String(asNumber) === input && asNumber >= 1 && asNumber <= labels.length) {
    return labels[asNumber - 1]!;
  }
  const exact = labels.find((l) => normalizeInput(l) === input);
  if (exact) return exact;
  const partial = labels.filter((l) => normalizeInput(l).includes(input));
  return partial.length === 1 ? partial[0]! : null;
}

const CANCEL_WORDS = new Set(['cancel', 'nevermind', 'never mind', 'none', 'neither', 'forget it']);
const LEAVE_WORDS = new Set([
  'leave',
  'bye',
  'goodbye',
  'stop',
  'stop talking',
  'end',
  'done',
  'nothing',
  'back',
]);

/**
 * Parses one line of player input into a single engine action.
 *
 * `context` supplies the currently-offered conversation topics and
 * disambiguation options so that bare numbers and topic names resolve. It is
 * derived from state by the caller, keeping this module free of content
 * imports.
 */
export function parse(raw: string, context: ParseContext = {}): GameAction {
  const input = normalizeInput(raw);
  if (input.length === 0) {
    return { type: 'UNPARSED', raw, reason: 'empty' };
  }

  const { topics, clarificationLabels } = context;

  /* --- Pending disambiguation ------------------------------------- */
  if (clarificationLabels && clarificationLabels.length > 0) {
    if (CANCEL_WORDS.has(input)) return { type: 'CANCEL' };
    const chosen = matchClarification(input, clarificationLabels);
    if (chosen) return { type: 'CHOOSE', value: chosen };
    // Fall through: a complete command replaces the pending question.
  }

  /* --- Pending conversation --------------------------------------- */
  if (topics && topics.length > 0) {
    if (LEAVE_WORDS.has(input) || CANCEL_WORDS.has(input)) {
      return { type: 'END_CONVERSATION' };
    }
    const topicId = matchTopic(input, topics);
    if (topicId) return { type: 'TOPIC', topic: topicId };
    if (/^\d+$/.test(input)) {
      return { type: 'UNPARSED', raw, reason: 'bad-topic-number' };
    }
    // Fall through: other commands work mid-conversation and end it.
  }

  const words = input.split(' ');
  const verb = words[0]!;
  const rest = joinRest(words, 1);

  /* --- Bare directions -------------------------------------------- */
  if (words.length === 1 && DIRECTIONS[verb]) {
    return { type: 'GO', target: DIRECTIONS[verb]! };
  }

  switch (verb) {
    case 'look':
    case 'l': {
      if (rest.length === 0) return { type: 'LOOK' };
      if (words[1] === 'at' || words[1] === 'in' || words[1] === 'inside') {
        const target = joinRest(words, 2);
        if (target.length === 0) return { type: 'UNPARSED', raw, reason: 'no-object' };
        return { type: 'EXAMINE', target };
      }
      if (words[1] === 'around') return { type: 'LOOK' };
      return { type: 'EXAMINE', target: rest };
    }

    case 'examine':
    case 'inspect':
    case 'x':
    case 'study':
    case 'read':
    case 'search': {
      if (rest.length === 0) return { type: 'UNPARSED', raw, reason: 'no-object' };
      return { type: 'EXAMINE', target: rest };
    }

    case 'exits':
      return { type: 'EXITS' };

    case 'go':
    case 'move':
    case 'walk':
    case 'head':
    case 'travel':
    case 'climb': {
      let target = rest;
      const leading = words[1];
      if (leading === 'to' || leading === 'into' || leading === 'through' || leading === 'towards') {
        target = joinRest(words, 2);
      }
      if (target.length === 0) return { type: 'UNPARSED', raw, reason: 'no-direction' };
      if (
        (leading === 'into' || leading === 'through') &&
        THRESHOLD_NOUNS.has(target)
      ) {
        return { type: 'CROSS_THRESHOLD' };
      }
      return { type: 'GO', target: DIRECTIONS[target] ?? target };
    }

    case 'enter': {
      if (rest.length === 0) return { type: 'UNPARSED', raw, reason: 'no-direction' };
      if (THRESHOLD_NOUNS.has(rest)) return { type: 'CROSS_THRESHOLD' };
      return { type: 'GO', target: DIRECTIONS[rest] ?? rest };
    }

    case 'cross':
    case 'dive':
    case 'descend': {
      if (rest.length === 0 || THRESHOLD_NOUNS.has(rest)) {
        return { type: 'CROSS_THRESHOLD' };
      }
      return { type: 'GO', target: DIRECTIONS[rest] ?? rest };
    }

    case 'step': {
      const target = words[1] === 'into' || words[1] === 'through' || words[1] === 'in'
        ? joinRest(words, 2)
        : rest;
      if (THRESHOLD_NOUNS.has(target)) return { type: 'CROSS_THRESHOLD' };
      if (target.length === 0) return { type: 'UNPARSED', raw, reason: 'no-direction' };
      return { type: 'GO', target: DIRECTIONS[target] ?? target };
    }

    case 'take':
    case 'get':
    case 'grab':
    case 'retrieve':
    case 'remove':
    case 'pick': {
      const start = verb === 'pick' && words[1] === 'up' ? 2 : 1;
      const body = words.slice(start);
      if (body.length === 0) return { type: 'UNPARSED', raw, reason: 'no-object' };
      const split = splitOn(body, ['from', 'out', 'off']);
      if (split && split.left.length > 0) {
        const from = split.right.replace(/^of /, '');
        return { type: 'TAKE', target: split.left, from };
      }
      const target = stripArticles(body).join(' ');
      if (target.length === 0) return { type: 'UNPARSED', raw, reason: 'no-object' };
      return { type: 'TAKE', target };
    }

    case 'drop': {
      if (rest.length === 0) return { type: 'UNPARSED', raw, reason: 'no-object' };
      return { type: 'DROP', target: rest };
    }

    case 'inventory':
    case 'i':
    case 'inv':
      return { type: 'INVENTORY' };

    case 'use': {
      const body = words.slice(1);
      if (body.length === 0) return { type: 'UNPARSED', raw, reason: 'no-object' };
      const split = splitOn(body, ['on', 'with', 'in', 'into', 'under', 'beneath', 'against', 'to']);
      if (split && split.left.length > 0 && split.right.length > 0) {
        return { type: 'USE', item: split.left, target: split.right };
      }
      return { type: 'USE', item: stripArticles(body).join(' ') };
    }

    case 'wedge':
    case 'prop': {
      // "wedge shutter" / "prop shutter open" / "wedge the shutter with the wedge"
      const body = words.slice(1).filter((w) => w !== 'open' && w !== 'up');
      const split = splitOn(body, ['with', 'using']);
      const target = split ? split.left : stripArticles(body).join(' ');
      if (target.length === 0) return { type: 'UNPARSED', raw, reason: 'no-object' };
      return { type: 'USE', item: 'wedge', target };
    }

    case 'put':
    case 'place':
    case 'set':
    case 'stand': {
      const body = words.slice(1);
      if (body[0] === 'down' && verb === 'put') {
        const target = joinRest(words, 2);
        if (target.length === 0) return { type: 'UNPARSED', raw, reason: 'no-object' };
        return { type: 'DROP', target };
      }
      const split = splitOn(body, ['in', 'into', 'inside', 'on', 'onto', 'under', 'beneath', 'at']);
      if (split && split.left.length > 0 && split.right.length > 0) {
        return { type: 'PLACE', item: split.left, target: split.right };
      }
      const only = stripArticles(body).join(' ');
      if (only.length === 0) return { type: 'UNPARSED', raw, reason: 'no-object' };
      return { type: 'UNPARSED', raw, reason: 'place-needs-target' };
    }

    case 'open': {
      if (rest.length === 0) return { type: 'UNPARSED', raw, reason: 'no-object' };
      return { type: 'OPEN', target: rest };
    }

    case 'close':
    case 'shut': {
      if (rest.length === 0) return { type: 'UNPARSED', raw, reason: 'no-object' };
      return { type: 'CLOSE', target: rest };
    }

    case 'light':
    case 'kindle':
    case 'ignite':
    case 'strike': {
      const target = rest.length === 0 ? 'lantern' : rest;
      return { type: 'LIGHT', target };
    }

    case 'talk':
    case 'speak': {
      const body = words.slice(1);
      const start = body[0] === 'to' || body[0] === 'with' ? 1 : 0;
      const target = stripArticles(body.slice(start)).join(' ');
      if (target.length === 0) return { type: 'UNPARSED', raw, reason: 'no-person' };
      return { type: 'TALK', target };
    }

    case 'ask': {
      const body = words.slice(1);
      const split = splitOn(body, ['about']);
      const target = stripArticles(split ? split.left.split(' ') : body).join(' ');
      if (target.length === 0) return { type: 'UNPARSED', raw, reason: 'no-person' };
      return { type: 'TALK', target };
    }

    case 'topic': {
      if (rest.length === 0) return { type: 'UNPARSED', raw, reason: 'no-topic' };
      if (topics) {
        const topicId = matchTopic(rest, topics);
        if (topicId) return { type: 'TOPIC', topic: topicId };
      }
      return { type: 'UNPARSED', raw, reason: 'no-topic' };
    }

    case 'fill': {
      const body = words.slice(1);
      const split = splitOn(body, ['from', 'at', 'in', 'with']);
      // "fill the skins at the spring" and "fill the skins" both work; the
      // reducer decides from where the hero is standing.
      const target = split && split.right.length > 0 ? split.right : stripArticles(body).join(' ');
      if (target.length === 0) {
        return { type: 'FILL', target: 'spring' };
      }
      return { type: 'FILL', target };
    }

    case 'give':
    case 'hand':
    case 'offer': {
      const body = words.slice(1);
      const split = splitOn(body, ['to']);
      if (split && split.left.length > 0 && split.right.length > 0) {
        return { type: 'GIVE', item: split.left, target: split.right };
      }
      if (body.length === 0) return { type: 'UNPARSED', raw, reason: 'no-object' };
      return { type: 'UNPARSED', raw, reason: 'give-needs-person' };
    }

    case 'recite': {
      if (rest.length === 0 || PROPHECY_NOUNS.has(rest)) return { type: 'RECITE' };
      return { type: 'UNPARSED', raw, reason: 'recite-what' };
    }

    case 'say':
    case 'tell': {
      // Only "say the prophecy" is a command. Everything else is conversation,
      // which goes through topics.
      const body = rest.replace(/^(them|her|him|it|us|saffra|fenn) /, '');
      if (PROPHECY_NOUNS.has(body) || PROPHECY_NOUNS.has(rest)) return { type: 'RECITE' };
      return { type: 'UNPARSED', raw, reason: 'recite-what' };
    }

    case 'break':
    case 'smash':
    case 'hit':
    case 'swing': {
      const body = words.slice(1).filter((w) => w !== 'at' && w !== 'into' && w !== 'down');
      const split = splitOn(body, ['with', 'using']);
      const target = split ? split.left : stripArticles(body).join(' ');
      if (target.length === 0) return { type: 'UNPARSED', raw, reason: 'no-object' };
      const action: GameAction = { type: 'BREAK', target };
      return split && split.right.length > 0 ? { ...action, using: split.right } : action;
    }

    case 'clear':
    case 'pull': {
      const body = words.slice(1).filter((w) => w !== 'off' && w !== 'away' && w !== 'out');
      const target = stripArticles(body).join(' ');
      if (target.length === 0) return { type: 'UNPARSED', raw, reason: 'no-object' };
      return { type: 'CLEAR', target };
    }

    case 'think':
    case 'reflect':
    case 'consider':
      return { type: 'REFLECT' };

    case 'wait':
    case 'z':
      return { type: 'WAIT' };

    case 'journal':
    case 'log':
    case 'notes':
      return { type: 'JOURNAL' };

    case 'hint':
    case 'hints':
      return { type: 'HINT' };

    case 'help':
    case 'commands':
    case '?':
      return { type: 'HELP' };

    case 'cancel':
      return { type: 'CANCEL' };

    default:
      break;
  }

  if (LEAVE_WORDS.has(input)) return { type: 'END_CONVERSATION' };
  if (KNOWN_VERBS.has(verb)) return { type: 'UNPARSED', raw, reason: 'no-object' };
  return { type: 'UNPARSED', raw, reason: 'unknown-verb' };
}

/** Player-facing explanation for an UNPARSED action. */
export function unparsedMessage(reason: string, raw: string): string {
  switch (reason) {
    case 'empty':
      return 'Type something, or type HELP for the list of commands.';
    case 'no-object':
      return `"${raw.trim()}" needs something to act on — try naming a thing, as in EXAMINE RELIEF.`;
    case 'no-direction':
      return `"${raw.trim()}" needs somewhere to go. Try EXITS to see the ways out.`;
    case 'no-person':
      return 'Name who you want to talk to, as in TALK TO BAY.';
    case 'no-topic':
      return 'That is not one of the things you can ask about just now.';
    case 'bad-topic-number':
      return 'There is no option with that number. Type the number of a listed topic, or LEAVE.';
    case 'place-needs-target':
      return 'Say where it goes, as in PLACE LANTERN IN ALCOVE.';
    case 'give-needs-person':
      return 'Say who you are giving it to, as in GIVE SKINS TO LOVAGE.';
    case 'recite-what':
      return 'RECITE PROPHECY is the only thing you can recite.';
    case 'unknown-verb':
    default:
      return `You cannot do that here. HELP lists everything this story understands.`;
  }
}
