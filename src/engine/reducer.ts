import type {
  CharacterId,
  ContentEffects,
  GameAction,
  GameState,
  ItemId,
  LocationId,
  NarrativeEvent,
  ResolveResult,
  TranscriptEntry,
} from './types';
import type { Ref } from './selectors';
import { MAX_JOURNAL, MAX_TRANSCRIPT, CONTENT_VERSION, SCHEMA_VERSION } from './types';
import { LOCATIONS } from '../content/locations';
import { OBJECTS, OBJECTS_BY_LOCATION, objectVerbs } from '../content/objects';
import { ALL_ITEM_IDS, ITEMS, isItemId } from '../content/items';
import { PEOPLE, PEOPLE_BY_LOCATION, availableTopics } from '../content/dialogue';
import { FLAGS } from '../content/flags';
import { renderText } from '../content/characters';
import { HELP_TEXT } from '../content/help';
import { nextHint } from '../content/hints';
import {
  CROSSING,
  ENDING,
  END_OF_PROTOTYPE,
  OBJECTIVES,
  OPENING,
  THRESHOLD_SPENT,
} from '../content/text';
import { unparsedMessage } from './parser';
import {
  activeTopics,
  currentLocation,
  peopleHere,
  resolve as resolveNoun,
  roomContentLines,
  visibleExits,
  visibleObjects,
} from './selectors';

/* ------------------------------------------------------------------ *
 * State construction
 * ------------------------------------------------------------------ */

export function createInitialState(): GameState {
  return {
    schemaVersion: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    character: null,
    chapter: 'select',
    era: 'present',
    locationId: 'present.home',
    inventory: [],
    placements: {},
    discovered: [],
    flags: {},
    journal: [],
    transcript: [],
    visited: [],
    objective: OBJECTIVES.rite,
    pending: null,
    turn: 0,
    ended: false,
    seq: 0,
  };
}

/** Era implied by a location id. The two must always agree. */
export function eraOf(locationId: LocationId): GameState['era'] {
  return locationId.startsWith('past.') ? 'past' : 'present';
}

/* ------------------------------------------------------------------ *
 * Internal helpers
 * ------------------------------------------------------------------ */

type Draft = GameState;

function clone(state: GameState): Draft {
  return structuredClone(state);
}

const f = (state: GameState, key: string): boolean => Boolean(state.flags[key]);

function discover(draft: Draft, ids: string[]): void {
  for (const id of ids) {
    if (!draft.discovered.includes(id)) draft.discovered.push(id);
  }
}

function addJournal(draft: Draft, entries: Array<{ id: string; text: string }>): string[] {
  const added: string[] = [];
  for (const entry of entries) {
    if (draft.journal.some((e) => e.id === entry.id)) continue;
    draft.journal.push({ id: entry.id, text: entry.text, turn: draft.turn });
    added.push(entry.text);
  }
  if (draft.journal.length > MAX_JOURNAL) {
    draft.journal.splice(0, draft.journal.length - MAX_JOURNAL);
  }
  return added;
}

/** Applies authored effects and returns the journal lines that were new. */
function applyEffects(draft: Draft, effects: ContentEffects | undefined): string[] {
  if (!effects) return [];
  if (effects.flags) {
    for (const [key, value] of Object.entries(effects.flags)) {
      draft.flags[key] = value;
    }
  }
  if (effects.reveals) discover(draft, effects.reveals);
  return effects.journal ? addJournal(draft, effects.journal) : [];
}

function setObjective(draft: Draft, objective: string, events: NarrativeEvent[]): void {
  if (draft.objective === objective) return;
  draft.objective = objective;
  events.push({ kind: 'objective', text: `New objective: ${objective}` });
}

function journalEvents(lines: string[], events: NarrativeEvent[]): void {
  for (const line of lines) {
    events.push({ kind: 'journal', text: `Journal: ${line}` });
  }
}

function listSentence(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join('; ')}; and ${items[items.length - 1]}`;
}

function commit(draft: Draft, events: NarrativeEvent[], accepted: boolean): ResolveResult {
  for (const event of events) {
    draft.seq += 1;
    const entry: TranscriptEntry = { id: `t${draft.seq}`, kind: event.kind, text: event.text };
    if (event.heading) entry.heading = event.heading;
    if (event.subheading) entry.subheading = event.subheading;
    draft.transcript.push(entry);
  }
  if (draft.transcript.length > MAX_TRANSCRIPT) {
    draft.transcript.splice(0, draft.transcript.length - MAX_TRANSCRIPT);
  }
  return { state: draft, events, accepted };
}

/* ------------------------------------------------------------------ *
 * Location entry
 * ------------------------------------------------------------------ */

function describeLocation(draft: Draft, events: NarrativeEvent[], firstVisit: boolean): void {
  const loc = currentLocation(draft);
  const chunks: string[] = [loc.description(draft)];
  if (firstVisit && loc.firstVisit) chunks.push(loc.firstVisit(draft));

  const things = roomContentLines(draft);
  if (things.length > 0) chunks.push(`You can make out ${listSentence(things)}.`);
  const folk = peopleHere(draft).map((p) => p.listAs);
  if (folk.length > 0) chunks.push(`People here: ${listSentence(folk)}.`);

  events.push({
    kind: 'location',
    heading: loc.name,
    subheading: loc.subtitle(draft),
    text: chunks.join('\n\n'),
  });
}

function enterLocation(draft: Draft, locationId: LocationId, events: NarrativeEvent[]): void {
  draft.locationId = locationId;
  draft.era = eraOf(locationId);
  draft.pending = null;

  // Noticing a room means noticing whatever is in plain sight in it.
  discover(
    draft,
    (OBJECTS_BY_LOCATION[locationId] ?? []).filter((o) => o.initiallyVisible).map((o) => o.id)
  );
  discover(draft, (PEOPLE_BY_LOCATION[locationId] ?? []).map((p) => p.id));

  const firstVisit = !draft.visited.includes(locationId);
  if (firstVisit) draft.visited.push(locationId);
  describeLocation(draft, events, firstVisit);
}

/* ------------------------------------------------------------------ *
 * The shuttered relief
 * ------------------------------------------------------------------ */

/**
 * Recomputes whether light is reaching the patterned wall, and narrates the
 * transition. Called after anything that could change it.
 *
 * `seamRevealed` latches: once seen, the player knows where the seam is even
 * with the lantern taken back out. `passageOpen` latches independently, so the
 * discovery can never be undone.
 */
function checkIllumination(draft: Draft, events: NarrativeEvent[]): void {
  if (draft.locationId !== 'present.sealed_chamber') return;
  const lit =
    f(draft, FLAGS.shutterHeld) && f(draft, FLAGS.lanternInAlcove) && f(draft, FLAGS.lanternLit);
  if (!lit) return;

  if (f(draft, FLAGS.seamRevealed)) {
    events.push({
      kind: 'narration',
      text:
        'The light climbs out through the carved eye again and lays the same long fan across ' +
        'the patterned wall. The seam is exactly where it was.',
    });
    return;
  }

  draft.flags[FLAGS.seamRevealed] = true;
  discover(draft, ['sealed.seam']);
  events.push({
    kind: 'narration',
    text:
      'The flame settles into the dish, and the chamber changes.\n\n' +
      'All the light in the room is now coming from a hand\'s breadth above the floor, out of a ' +
      'hole the size of your palm, going up. It leaves the carved eye as a flat fan and crosses ' +
      'the patterned wall almost edge-on.\n\n' +
      'And every one of those thousands of little scales throws its shadow the same way at ' +
      'last, all together, in one direction — and in the middle of all that agreement there is ' +
      'one line that does not behave. It does not throw a shadow. It is one.\n\n' +
      'A seam. Up from the floor to shoulder height, then a turn, then across, the width of a ' +
      'door.\n\n' +
      'You have been standing in front of it with a lantern in your hand. So has everyone else ' +
      'who ever came in here.',
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.seam',
        text:
          'With a lit lamp in the alcove and the shutter held up, light through the carved eye ' +
          'crosses the patterned wall edge-on and shows a door-sized seam in it.',
      },
    ]),
    events
  );
}

function openPassage(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (f(draft, FLAGS.passageOpen)) {
    events.push({ kind: 'narration', text: 'The passage already stands open. The steps go down.' });
    return commit(draft, events, true);
  }
  if (!f(draft, FLAGS.seamRevealed)) {
    events.push({
      kind: 'failure',
      text:
        'You run your hands over the scales, pressing and pulling at a dozen of them. They are ' +
        'all the same depth and all the same surface, and the wall does not give anywhere. If ' +
        'there is a join in this, you are not going to find it by feel.',
    });
    return commit(draft, events, false);
  }

  draft.flags[FLAGS.passageOpen] = true;
  discover(draft, ['sealed.passage']);
  events.push({
    kind: 'success',
    text:
      'You get your fingertips into the seam, set your shoulder below the turn, and push across ' +
      'rather than in.\n\n' +
      'A door-sized slab of patterned wall swings. It is pivoted — one cut socket in the floor, ' +
      'one in the lintel above — and balanced so well that once it is moving you could keep it ' +
      'going with one hand. Grit grinds for the first hand\'s width and then nothing at all. It ' +
      'has not been opened in a very long time, and it was made by somebody who expected it to ' +
      'be opened often.\n\n' +
      'Behind it the rock has been cut into steps, going down and bending right. The air that ' +
      'comes up is still, and warmer than the room you are standing in.',
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.passage',
        text:
          'A door-sized slab of the sealed chamber\'s patterned wall is pivoted and swings. ' +
          'Behind it, cut steps go down.',
      },
    ]),
    events
  );
  setObjective(draft, OBJECTIVES.passage, events);
  return commit(draft, events, true);
}

/* ------------------------------------------------------------------ *
 * Item placement helpers
 * ------------------------------------------------------------------ */

function giveItem(draft: Draft, item: ItemId): void {
  if (!draft.inventory.includes(item)) draft.inventory.push(item);
  draft.placements[item] = { kind: 'carried' };
}

function removeFromInventory(draft: Draft, item: ItemId): void {
  draft.inventory = draft.inventory.filter((i) => i !== item);
}

function itemIsIn(state: GameState, item: ItemId, fixtureId: string): boolean {
  const placement = state.placements[item];
  return placement?.kind === 'fixture' && placement.fixtureId === fixtureId;
}

/* ------------------------------------------------------------------ *
 * Clarification
 * ------------------------------------------------------------------ */

function askWhich(
  draft: Draft,
  events: NarrativeEvent[],
  question: string,
  options: Array<{ label: string; action: GameAction }>
): ResolveResult {
  draft.pending = { kind: 'clarification', question, options };
  const list = options.map((o, i) => `  ${i + 1}. ${o.label}`).join('\n');
  events.push({
    kind: 'options',
    text: `${question}\n${list}\n\nType a number or a name, or CANCEL.`,
  });
  return commit(draft, events, false);
}

function refLabel(ref: Ref): string {
  return ref.label;
}

/* ------------------------------------------------------------------ *
 * The resolver
 * ------------------------------------------------------------------ */

const CONVERSATION_SAFE: ReadonlySet<GameAction['type']> = new Set<GameAction['type']>([
  'TOPIC',
  'END_CONVERSATION',
  'JOURNAL',
  'HINT',
  'HELP',
  'INVENTORY',
  'LOOK',
  'EXITS',
  'CHOOSE',
  'CANCEL',
  'UNPARSED',
]);

const NON_TURN: ReadonlySet<GameAction['type']> = new Set<GameAction['type']>([
  'JOURNAL',
  'HINT',
  'HELP',
  'INVENTORY',
  'LOOK',
  'EXITS',
]);

/**
 * The single pure entry point. Returns the next state plus the narrative
 * events the action produced. Never mutates the state it is given.
 *
 * Both input modes call only this. The UI has no other way to change the
 * world, which is what keeps typed and selected actions equivalent.
 */
export function resolve(state: GameState, action: GameAction): ResolveResult {
  if (action.type === 'SELECT_CHARACTER') {
    if (state.chapter !== 'select') {
      const draft = clone(state);
      return commit(
        draft,
        [{ kind: 'failure', text: 'You have already chosen who you are.' }],
        false
      );
    }
    return startGame(action.character);
  }
  if (state.chapter === 'select' || state.character === null) {
    const draft = clone(state);
    return commit(draft, [{ kind: 'failure', text: 'Choose who you are first.' }], false);
  }

  /* --- A pending disambiguation ----------------------------------- */
  if (state.pending?.kind === 'clarification') {
    if (action.type === 'CHOOSE') {
      const option = state.pending.options.find(
        (o) => o.label.toLowerCase() === action.value.toLowerCase()
      );
      if (!option) {
        const draft = clone(state);
        return commit(
          draft,
          [{ kind: 'failure', text: 'That is not one of the options. Type a number, or CANCEL.' }],
          false
        );
      }
      const cleared = clone(state);
      cleared.pending = null;
      return resolve(cleared, option.action);
    }
    if (action.type === 'CANCEL') {
      const draft = clone(state);
      draft.pending = null;
      return commit(draft, [{ kind: 'system', text: 'Never mind, then.' }], false);
    }
    if (action.type !== 'UNPARSED') {
      // A complete command replaces the question rather than being swallowed.
      const cleared = clone(state);
      cleared.pending = null;
      return resolve(cleared, action);
    }
  }

  const draft = clone(state);
  const events: NarrativeEvent[] = [];

  /* --- Doing something else mid-conversation ---------------------- */
  if (draft.pending?.kind === 'conversation' && !CONVERSATION_SAFE.has(action.type)) {
    const person = PEOPLE[draft.pending.personId];
    draft.pending = null;
    if (person) {
      events.push({ kind: 'dialogue', text: `You turn away from ${person.name}.` });
    }
  }

  const result = dispatch(draft, action, events);
  if (result.accepted && !NON_TURN.has(action.type)) {
    result.state.turn += 1;
  }
  return result;
}

function dispatch(draft: Draft, action: GameAction, events: NarrativeEvent[]): ResolveResult {
  switch (action.type) {
    case 'LOOK':
      describeLocation(draft, events, false);
      return commit(draft, events, true);

    case 'EXITS':
      return doExits(draft, events);

    case 'GO':
      return doGo(draft, action.target, events);

    case 'EXAMINE':
      return doExamine(draft, action.target, events);

    case 'TAKE':
      return doTake(draft, action.target, events);

    case 'DROP':
      return doDrop(draft, action.target, events);

    case 'INVENTORY':
      return doInventory(draft, events);

    case 'USE':
      return doUse(draft, action.item, action.target, events);

    case 'PLACE':
      return doPlace(draft, action.item, action.target, events);

    case 'OPEN':
      return doOpen(draft, action.target, events);

    case 'CLOSE':
      return doClose(draft, action.target, events);

    case 'LIGHT':
      return doLight(draft, action.target, events);

    case 'TALK':
      return doTalk(draft, action.target, events);

    case 'TOPIC':
      return doTopic(draft, action.topic, events);

    case 'END_CONVERSATION':
      return doEndConversation(draft, events);

    case 'CROSS_THRESHOLD':
      return doCross(draft, events);

    case 'JOURNAL':
      return doJournal(draft, events);

    case 'HINT':
      return doHint(draft, events);

    case 'HELP':
      events.push({ kind: 'system', text: HELP_TEXT });
      return commit(draft, events, true);

    case 'CANCEL':
      events.push({ kind: 'system', text: 'There is nothing to cancel.' });
      return commit(draft, events, false);

    case 'CHOOSE':
      events.push({ kind: 'failure', text: 'There is nothing to choose between right now.' });
      return commit(draft, events, false);

    case 'UNPARSED':
      events.push({ kind: 'failure', text: unparsedMessage(action.reason, action.raw) });
      return commit(draft, events, false);

    case 'SELECT_CHARACTER':
      events.push({ kind: 'failure', text: 'You have already chosen who you are.' });
      return commit(draft, events, false);

    default: {
      const exhaustive: never = action;
      events.push({ kind: 'failure', text: String(exhaustive) });
      return commit(draft, events, false);
    }
  }
}

/**
 * Appends an echo of what the player typed or chose.
 *
 * This exists so the UI never has to touch state itself: it is a transcript
 * append and nothing else — no flags, no inventory, no turn.
 */
export function echoCommand(state: GameState, text: string): GameState {
  const draft = clone(state);
  return commit(draft, [{ kind: 'command', text }], false).state;
}

/* ------------------------------------------------------------------ *
 * Start
 * ------------------------------------------------------------------ */

export function startGame(character: CharacterId): ResolveResult {
  const draft = createInitialState();
  draft.character = character;
  draft.chapter = 'rite';
  draft.objective = OBJECTIVES.rite;
  const events: NarrativeEvent[] = [{ kind: 'narration', text: OPENING }];
  enterLocation(draft, 'present.home', events);
  events.push({ kind: 'objective', text: `Objective: ${draft.objective}` });
  return commit(draft, events, true);
}

/* ------------------------------------------------------------------ *
 * Action handlers
 * ------------------------------------------------------------------ */

function doExits(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  const exits = visibleExits(draft);
  const lines = exits.map((exit) =>
    exit.direction ? `  ${exit.direction} — ${exit.label}` : `  ${exit.label}`
  );
  events.push({ kind: 'system', text: `Ways out:\n${lines.join('\n')}` });
  return commit(draft, events, true);
}

function doGo(draft: Draft, target: string, events: NarrativeEvent[]): ResolveResult {
  const exits = visibleExits(draft);
  const wanted = target.trim().toLowerCase();

  const byDirection = exits.filter((e) => e.direction === wanted);
  const matches =
    byDirection.length > 0
      ? byDirection
      : resolveNoun(draft, target, ['exit'])
          .map((ref) => exits.find((e) => e.id === ref.id))
          .filter((e): e is NonNullable<typeof e> => Boolean(e));

  if (matches.length === 0) {
    // Deliberately identical whether the direction is simply wrong or an exit
    // exists there but has not been discovered: probing must not reveal it.
    events.push({ kind: 'failure', text: 'You cannot go that way.' });
    return commit(draft, events, false);
  }
  if (matches.length > 1) {
    return askWhich(
      draft,
      events,
      'Which way do you mean?',
      matches.map((e) => ({ label: e.label, action: { type: 'GO', target: e.id } as GameAction }))
    );
  }

  enterLocation(draft, matches[0]!.to, events);
  return commit(draft, events, true);
}

function doExamine(draft: Draft, target: string, events: NarrativeEvent[]): ResolveResult {
  const refs = resolveNoun(draft, target);
  if (refs.length === 0) {
    events.push({ kind: 'failure', text: `You cannot see any ${target.trim()} here.` });
    return commit(draft, events, false);
  }
  if (refs.length > 1) {
    return askWhich(
      draft,
      events,
      'Which one do you mean?',
      refs.map((r) => ({
        label: refLabel(r),
        action: { type: 'EXAMINE', target: r.id } as GameAction,
      }))
    );
  }

  const ref = refs[0]!;
  switch (ref.kind) {
    case 'item': {
      events.push({ kind: 'narration', text: ITEMS[ref.id as ItemId].description(draft) });
      return commit(draft, events, true);
    }
    case 'person': {
      const person = PEOPLE[ref.id]!;
      events.push({ kind: 'narration', text: renderText(person.appearance(draft), draft) });
      return commit(draft, events, true);
    }
    case 'exit': {
      const exit = visibleExits(draft).find((e) => e.id === ref.id)!;
      const label = `${exit.label[0]!.toUpperCase()}${exit.label.slice(1)}`;
      events.push({
        kind: 'narration',
        text: `${label}. That way lies ${LOCATIONS[exit.to].name}.`,
      });
      return commit(draft, events, true);
    }
    case 'object': {
      const def = OBJECTS[ref.id]!;
      events.push({ kind: 'narration', text: renderText(def.description(draft), draft) });
      journalEvents(applyEffects(draft, def.onExamine), events);
      noteReliefMatch(draft, ref.id, events);
      return commit(draft, events, true);
    }
  }
}

/**
 * Records the relief/alcove relationship once the player has genuinely seen
 * both halves of it. This is an observation they have established, not a
 * solution: it says the shapes match, not what to do about it.
 */
function noteReliefMatch(draft: Draft, objectId: string, events: NarrativeEvent[]): void {
  if (objectId !== 'gallery.relief' && objectId !== 'sealed.alcove') return;
  if (!f(draft, FLAGS.reliefExamined)) return;
  if (!draft.discovered.includes('sealed.alcove')) return;

  if (!f(draft, FLAGS.reliefMatched)) {
    draft.flags[FLAGS.reliefMatched] = true;
    events.push({
      kind: 'narration',
      text:
        'The squared recess at the bottom of the relief and the hollow behind the shutter are ' +
        'the same shape, in the same proportion, at the same height off the floor. Somebody cut ' +
        'a picture of that alcove on that wall.',
    });
  }
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.match',
        text:
          'The squared recess in the gallery relief matches the alcove behind the sealed ' +
          'chamber\'s shutter: same shape, same height off the floor.',
      },
    ]),
    events
  );
}

function doTake(draft: Draft, target: string, events: NarrativeEvent[]): ResolveResult {
  const refs = resolveNoun(draft, target);
  if (refs.length === 0) {
    events.push({ kind: 'failure', text: `You cannot see any ${target.trim()} here.` });
    return commit(draft, events, false);
  }
  if (refs.length > 1) {
    return askWhich(
      draft,
      events,
      'Take which one?',
      refs.map((r) => ({ label: refLabel(r), action: { type: 'TAKE', target: r.id } as GameAction }))
    );
  }

  const ref = refs[0]!;

  if (ref.kind === 'person') {
    events.push({ kind: 'failure', text: `${ref.label} is a person, not luggage.` });
    return commit(draft, events, false);
  }
  if (ref.kind === 'exit') {
    events.push({ kind: 'failure', text: 'That is a way out, not a thing.' });
    return commit(draft, events, false);
  }
  if (ref.kind === 'item') {
    const item = ref.id as ItemId;
    if (draft.inventory.includes(item)) {
      events.push({ kind: 'failure', text: `You already have the ${ITEMS[item].name}.` });
      return commit(draft, events, false);
    }
    return retrieveItem(draft, item, events);
  }

  const def = OBJECTS[ref.id]!;
  if (!def.item) {
    events.push({ kind: 'failure', text: `The ${def.name} is not something you can carry off.` });
    return commit(draft, events, false);
  }

  giveItem(draft, def.item);
  if (def.item === 'lantern') draft.flags[FLAGS.hasLantern] = true;
  events.push({
    kind: 'success',
    text:
      def.item === 'lantern'
        ? 'You lift the lantern off the sill. It is heavier than it looks, the way full things ' +
          'are, and the striker chinks against the base.'
        : 'You take a wedge out of the basket and put it in your pocket, where it immediately ' +
          'becomes the most sensible thing you own.',
  });
  return commit(draft, events, true);
}

/** Recovering an item from a fixture or from the floor. Always possible. */
function retrieveItem(draft: Draft, item: ItemId, events: NarrativeEvent[]): ResolveResult {
  const placement = draft.placements[item];

  if (placement?.kind === 'room') {
    giveItem(draft, item);
    events.push({ kind: 'success', text: `You pick the ${ITEMS[item].name} back up.` });
    return commit(draft, events, true);
  }

  if (item === 'lantern' && itemIsIn(draft, 'lantern', 'sealed.alcove')) {
    if (!f(draft, FLAGS.shutterHeld)) {
      events.push({
        kind: 'failure',
        text:
          'The shutter is down over the alcove with your lantern behind it. Get the shutter up ' +
          'and held again and you can reach straight in.',
      });
      return commit(draft, events, false);
    }
    giveItem(draft, item);
    draft.flags[FLAGS.lanternInAlcove] = false;
    events.push({
      kind: 'success',
      text:
        'You reach in to the elbow and lift the lantern out of the dish. The fan of light comes ' +
        'off the patterned wall, and the room goes back to being flatly lit from wherever you ' +
        'are holding it.' +
        (f(draft, FLAGS.passageOpen)
          ? ' The opened passage stays open. That is not going anywhere.'
          : f(draft, FLAGS.seamRevealed)
            ? ' You know exactly where the seam is now, even with it invisible again.'
            : ''),
    });
    return commit(draft, events, true);
  }

  if (item === 'wedge' && itemIsIn(draft, 'wedge', 'sealed.shutter')) {
    giveItem(draft, item);
    draft.flags[FLAGS.shutterHeld] = false;
    const trapped = itemIsIn(draft, 'lantern', 'sealed.alcove');
    events.push({
      kind: 'success',
      text:
        'You knock the wedge out with the side of your foot and catch it. The shutter runs down ' +
        'the grooves and sits closed with a flat, final sound.' +
        (trapped
          ? '\n\nYour lantern is behind it. You will need to wedge the shutter up again to get ' +
            'it back — which you can do whenever you like, since you are holding the wedge.'
          : ''),
    });
    return commit(draft, events, true);
  }

  giveItem(draft, item);
  events.push({ kind: 'success', text: `You take the ${ITEMS[item].name}.` });
  return commit(draft, events, true);
}

function doDrop(draft: Draft, target: string, events: NarrativeEvent[]): ResolveResult {
  const refs = resolveNoun(draft, target, ['item']);
  const item = refs[0]?.id as ItemId | undefined;
  if (!item || !draft.inventory.includes(item)) {
    events.push({ kind: 'failure', text: `You are not carrying any ${target.trim()}.` });
    return commit(draft, events, false);
  }
  removeFromInventory(draft, item);
  draft.placements[item] = { kind: 'room', locationId: draft.locationId };
  events.push({
    kind: 'success',
    text: `You put the ${ITEMS[item].name} down. It will still be here if you want it.`,
  });
  return commit(draft, events, true);
}

function doInventory(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  const carried = draft.inventory.map((item) => `  ${ITEMS[item].inventoryLine(draft)}`);
  const elsewhere: string[] = [];
  for (const [id, placement] of Object.entries(draft.placements)) {
    if (!isItemId(id) || draft.inventory.includes(id)) continue;
    if (placement.kind === 'fixture') {
      const fixture = OBJECTS[placement.fixtureId];
      elsewhere.push(`  ${ITEMS[id].name} — in the ${fixture ? fixture.name : 'cave'}`);
    } else if (placement.kind === 'room') {
      elsewhere.push(`  ${ITEMS[id].name} — left in ${LOCATIONS[placement.locationId].name}`);
    }
  }

  const parts: string[] = [
    carried.length > 0 ? `You are carrying:\n${carried.join('\n')}` : 'You are carrying nothing.',
  ];
  if (elsewhere.length > 0) parts.push(`Left elsewhere:\n${elsewhere.join('\n')}`);
  events.push({ kind: 'system', text: parts.join('\n\n') });
  return commit(draft, events, true);
}

/** Resolves an item name to a held item, explaining the fix when it is not held. */
function requireHeldItem(
  draft: Draft,
  raw: string,
  events: NarrativeEvent[]
): ItemId | ResolveResult {
  const itemRefs = resolveNoun(draft, raw, ['item']);
  const item = itemRefs[0]?.id as ItemId | undefined;
  if (item && draft.inventory.includes(item)) return item;

  if (item) {
    events.push({
      kind: 'failure',
      text: `You are not holding the ${ITEMS[item].name}. TAKE it first.`,
    });
    return commit(draft, events, false);
  }

  // The thing may be lying around as a room object that becomes an item.
  const objectRefs = resolveNoun(draft, raw, ['object']);
  const asObject = objectRefs[0] ? OBJECTS[objectRefs[0].id] : undefined;
  if (asObject?.item) {
    events.push({
      kind: 'failure',
      text: `You would have to be holding the ${asObject.name} first. TAKE it.`,
    });
    return commit(draft, events, false);
  }

  // Naming an item of the story that is simply not with you: say where it
  // comes from, rather than pretending the word means nothing.
  const wanted = raw.trim().toLowerCase();
  const known = ALL_ITEM_IDS.find(
    (id) => id === wanted || ITEMS[id].nouns.some((noun) => noun.toLowerCase() === wanted)
  );
  if (known === 'wedge') {
    events.push({
      kind: 'failure',
      text:
        'You have no wedge with you. Oreg keeps a basket of them under the bench in his ' +
        'workshop and hands them out to anyone who asks.',
    });
    return commit(draft, events, false);
  }
  if (known === 'lantern') {
    events.push({ kind: 'failure', text: 'You have no lantern with you.' });
    return commit(draft, events, false);
  }

  events.push({ kind: 'failure', text: `You have no ${raw.trim()} to use.` });
  return commit(draft, events, false);
}

function doUse(
  draft: Draft,
  rawItem: string,
  rawTarget: string | undefined,
  events: NarrativeEvent[]
): ResolveResult {
  const held = requireHeldItem(draft, rawItem, events);
  if (typeof held !== 'string') return held;
  const item = held;

  if (rawTarget === undefined || rawTarget.trim().length === 0) {
    if (item === 'lantern') return doLight(draft, 'lantern', events);
    const plausible = visibleObjects(draft).filter((o) => objectVerbs(o, draft).includes('use'));
    if (plausible.length === 0) {
      events.push({
        kind: 'failure',
        text:
          'There is nothing here the wedge would do anything for. It holds up things that want ' +
          'to come down.',
      });
      return commit(draft, events, false);
    }
    return askWhich(
      draft,
      events,
      `Use the ${ITEMS[item].name} on what?`,
      plausible.map((o) => ({
        label: o.name,
        action: { type: 'USE', item, target: o.id } as GameAction,
      }))
    );
  }

  const targetRefs = resolveNoun(draft, rawTarget);
  if (targetRefs.length === 0) {
    events.push({ kind: 'failure', text: `You cannot see any ${rawTarget.trim()} here.` });
    return commit(draft, events, false);
  }
  if (targetRefs.length > 1) {
    return askWhich(
      draft,
      events,
      `Use the ${ITEMS[item].name} on which one?`,
      targetRefs.map((r) => ({
        label: refLabel(r),
        action: { type: 'USE', item, target: r.id } as GameAction,
      }))
    );
  }
  const target = targetRefs[0]!;

  // "use lantern in alcove" and "place lantern in alcove" are the same act.
  if (item === 'lantern' && target.kind === 'object' && target.id === 'sealed.alcove') {
    return doPlace(draft, 'lantern', target.id, events);
  }
  if (item === 'wedge' && target.kind === 'object' && target.id === 'sealed.shutter') {
    return wedgeShutter(draft, events);
  }

  if (target.kind === 'person') {
    events.push({
      kind: 'failure',
      text: `${target.label} looks at the ${ITEMS[item].name}, then at you, and declines to comment.`,
    });
    return commit(draft, events, false);
  }

  if (item === 'wedge') {
    events.push({
      kind: 'failure',
      text:
        `You try the wedge against the ${target.label}. There is nothing here that is trying to ` +
        'close, and no gap to drive it into. It is a wedge. It needs something that is holding ' +
        'itself up badly.',
    });
    return commit(draft, events, false);
  }

  events.push({
    kind: 'failure',
    text:
      `You hold the lantern up against the ${target.label} and look at it from two or three ` +
      'angles. Holding a light next to a thing is not, on its own, doing anything to it.',
  });
  return commit(draft, events, false);
}

function wedgeShutter(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (f(draft, FLAGS.shutterHeld)) {
    events.push({
      kind: 'failure',
      text: 'The wedge is already in under the shutter, and the shutter is already up.',
    });
    return commit(draft, events, false);
  }
  if (!draft.inventory.includes('wedge')) {
    events.push({ kind: 'failure', text: 'You have nothing to hold it up with.' });
    return commit(draft, events, false);
  }

  const firstTime = !f(draft, FLAGS.shutterTried);
  draft.flags[FLAGS.shutterTried] = true;
  draft.flags[FLAGS.shutterHeld] = true;
  removeFromInventory(draft, 'wedge');
  draft.placements['wedge'] = { kind: 'fixture', fixtureId: 'sealed.shutter' };
  discover(draft, ['sealed.alcove']);

  events.push({
    kind: 'success',
    text:
      'You get your fingers under the lip, lift the shutter up its grooves with your back ' +
      'rather than your arms, hold it there one-handed, and kick the wedge in under the bottom ' +
      'edge with the other hand.\n\n' +
      'Then you let go.\n\n' +
      'It settles half a finger\'s width onto the oak and stops. The wedge bites. The shutter ' +
      'stays up.' +
      (firstTime
        ? '\n\nBehind it is a squared hollow cut back into the rock, deeper than your forearm, ' +
          'black with old smoke, with a flat, slightly dished floor to it. It is at ankle ' +
          'height. Nothing is in it.'
        : ''),
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.alcove',
        text:
          'Behind the sealed chamber\'s shutter is an arm-deep, smoke-blackened alcove at ankle ' +
          'height with a dished floor. The shutter will not stay up on its own; a wedge under ' +
          'the lip holds it.',
      },
    ]),
    events
  );
  noteReliefMatch(draft, 'sealed.alcove', events);
  checkIllumination(draft, events);
  return commit(draft, events, true);
}

function doPlace(
  draft: Draft,
  rawItem: string,
  rawTarget: string,
  events: NarrativeEvent[]
): ResolveResult {
  const held = requireHeldItem(draft, rawItem, events);
  if (typeof held !== 'string') return held;
  const item = held;

  const targetRefs = resolveNoun(draft, rawTarget);
  if (targetRefs.length === 0) {
    events.push({ kind: 'failure', text: `You cannot see any ${rawTarget.trim()} here.` });
    return commit(draft, events, false);
  }
  if (targetRefs.length > 1) {
    return askWhich(
      draft,
      events,
      `Put the ${ITEMS[item].name} where?`,
      targetRefs.map((r) => ({
        label: refLabel(r),
        action: { type: 'PLACE', item, target: r.id } as GameAction,
      }))
    );
  }
  const target = targetRefs[0]!;

  if (target.kind === 'object' && target.id === 'sealed.alcove') {
    if (!f(draft, FLAGS.shutterHeld)) {
      events.push({
        kind: 'failure',
        text:
          'The shutter is down over the alcove. You can get it up with one hand, but the moment ' +
          'you reach in with the other it comes back down on your wrist. The shutter has to be ' +
          'held open by something that is not you.',
      });
      return commit(draft, events, false);
    }
    if (item === 'wedge') {
      events.push({
        kind: 'failure',
        text:
          'You go to put the wedge in the alcove, and stop, because the wedge is the only thing ' +
          'currently holding the shutter up. A block of oak in the hollow would also achieve ' +
          'nothing. The dish in the floor of it is shaped for something else.',
      });
      return commit(draft, events, false);
    }

    removeFromInventory(draft, 'lantern');
    draft.placements['lantern'] = { kind: 'fixture', fixtureId: 'sealed.alcove' };
    draft.flags[FLAGS.lanternInAlcove] = true;
    events.push({
      kind: 'success',
      text:
        'You reach in to the elbow and set the lantern down in the dished floor of the alcove. ' +
        'It seats itself with a small rock and sits level. Whoever cut that dish cut it for ' +
        'something about this size.' +
        (f(draft, FLAGS.lanternLit)
          ? ''
          : '\n\nThe wick is not lit. The alcove now holds an unlit lantern in the dark, which ' +
            'is exactly as useful as it sounds.'),
    });
    checkIllumination(draft, events);
    return commit(draft, events, true);
  }

  if (target.kind === 'person') {
    events.push({ kind: 'failure', text: `${target.label} does not want your ${ITEMS[item].name}.` });
    return commit(draft, events, false);
  }

  events.push({
    kind: 'failure',
    text: `There is nowhere on the ${target.label} for the ${ITEMS[item].name} to go.`,
  });
  return commit(draft, events, false);
}

function doOpen(draft: Draft, target: string, events: NarrativeEvent[]): ResolveResult {
  const refs = resolveNoun(draft, target);
  if (refs.length === 0) {
    events.push({ kind: 'failure', text: `You cannot see any ${target.trim()} here.` });
    return commit(draft, events, false);
  }
  if (refs.length > 1) {
    return askWhich(
      draft,
      events,
      'Open which one?',
      refs.map((r) => ({ label: refLabel(r), action: { type: 'OPEN', target: r.id } as GameAction }))
    );
  }
  const ref = refs[0]!;

  if (ref.kind === 'object') {
    switch (ref.id) {
      case 'sealed.shutter':
        return liftShutter(draft, events);
      case 'sealed.seam':
      case 'sealed.wall':
        return openPassage(draft, events);
      case 'sealed.passage':
        events.push({ kind: 'narration', text: 'It is already open. The steps go down.' });
        return commit(draft, events, true);
      default:
        break;
    }
  }
  if (ref.kind === 'item' && ref.id === 'lantern') {
    events.push({
      kind: 'narration',
      text:
        'You slide the hood back. The lantern throws light in every direction instead of one. ' +
        'You slide it forward again, because that was worse.',
    });
    return commit(draft, events, true);
  }
  if (ref.kind === 'exit') {
    events.push({ kind: 'failure', text: 'There is nothing there to open. You can just walk it.' });
    return commit(draft, events, false);
  }

  events.push({ kind: 'failure', text: `The ${ref.label} does not open.` });
  return commit(draft, events, false);
}

function liftShutter(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (f(draft, FLAGS.shutterHeld)) {
    events.push({ kind: 'narration', text: 'It is already up, with the wedge under it.' });
    return commit(draft, events, true);
  }

  const firstTime = !f(draft, FLAGS.shutterTried);
  draft.flags[FLAGS.shutterTried] = true;
  discover(draft, ['sealed.alcove']);

  events.push({
    kind: 'narration',
    text:
      'You get your fingers under the worn lip and lift. It is heavy, but the grooves are clean, ' +
      'and it goes up a good arm\'s length and stays there exactly as long as you hold it.' +
      (firstTime
        ? '\n\nBehind it is a squared hollow cut back into the rock, deeper than your forearm, ' +
          'black with old smoke, with a flat, slightly dished floor to it. It is at ankle ' +
          'height, set a long way back, and nothing is in it.'
        : '') +
      '\n\nThen your grip goes, the way a grip does, and the shutter runs straight back down the ' +
      'grooves and sits closed.\n\n' +
      'Nothing in this room holds it up. It would need something driven in under the bottom edge.',
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.alcove',
        text:
          'Behind the sealed chamber\'s shutter is an arm-deep, smoke-blackened alcove at ankle ' +
          'height with a dished floor. The shutter will not stay up on its own; a wedge under ' +
          'the lip holds it.',
      },
    ]),
    events
  );
  noteReliefMatch(draft, 'sealed.alcove', events);
  return commit(draft, events, true);
}

function doClose(draft: Draft, target: string, events: NarrativeEvent[]): ResolveResult {
  const refs = resolveNoun(draft, target);
  if (refs.length === 0) {
    events.push({ kind: 'failure', text: `You cannot see any ${target.trim()} here.` });
    return commit(draft, events, false);
  }
  const ref = refs[0]!;
  if (ref.kind === 'object' && ref.id === 'sealed.shutter') {
    if (!f(draft, FLAGS.shutterHeld)) {
      events.push({ kind: 'narration', text: 'The shutter is already down.' });
      return commit(draft, events, true);
    }
    return retrieveItem(draft, 'wedge', events);
  }
  if (ref.kind === 'object' && ref.id === 'sealed.passage') {
    events.push({
      kind: 'narration',
      text:
        'You push the slab back the way it came until the scales line up and the seam ' +
        'disappears, and stand there looking at a blank patterned wall. Then you open it again, ' +
        'because you are not finished with it.',
    });
    return commit(draft, events, true);
  }
  events.push({ kind: 'failure', text: `The ${ref.label} does not close.` });
  return commit(draft, events, false);
}

function doLight(draft: Draft, target: string, events: NarrativeEvent[]): ResolveResult {
  const refs = resolveNoun(draft, target);
  if (refs.length === 0) {
    events.push({ kind: 'failure', text: `You cannot see any ${target.trim()} here to light.` });
    return commit(draft, events, false);
  }
  const ref = refs[0]!;

  if (ref.kind === 'object' && OBJECTS[ref.id]?.item === 'lantern') {
    events.push({
      kind: 'failure',
      text: 'Pick the lantern up first — TAKE LANTERN — and then you can light it.',
    });
    return commit(draft, events, false);
  }
  if (ref.kind !== 'item' || ref.id !== 'lantern') {
    events.push({
      kind: 'failure',
      text: `The ${ref.label} will not light, and you would not want it to.`,
    });
    return commit(draft, events, false);
  }
  if (f(draft, FLAGS.lanternLit)) {
    events.push({ kind: 'narration', text: 'The lantern is already burning.' });
    return commit(draft, events, true);
  }

  draft.flags[FLAGS.lanternLit] = true;
  events.push({
    kind: 'success',
    text: itemIsIn(draft, 'lantern', 'sealed.alcove')
      ? 'You reach in to the elbow, pull the striker round on its chain, and scrape it. Second ' +
        'try. The wick takes, blues, and steadies.'
      : 'You pull the striker round on its chain and scrape it against the base. Second try. The ' +
        'wick takes, blues, and steadies into a flame the size of a thumbnail, and the hood ' +
        'throws it forward in a wedge.',
  });
  checkIllumination(draft, events);
  return commit(draft, events, true);
}

function topicListEvent(draft: Draft, events: NarrativeEvent[]): void {
  const topics = activeTopics(draft);
  if (topics.length === 0) {
    events.push({
      kind: 'options',
      text: 'There is nothing else you can think of to ask. (LEAVE to finish.)',
    });
    return;
  }
  const lines = topics.map((t, i) => `  ${i + 1}. ${t.label}`).join('\n');
  events.push({ kind: 'options', text: `You could ask about:\n${lines}\n  0. leave` });
}

function doTalk(draft: Draft, target: string, events: NarrativeEvent[]): ResolveResult {
  const refs = resolveNoun(draft, target, ['person']);
  if (refs.length === 0) {
    events.push({ kind: 'failure', text: `There is nobody here called ${target.trim()}.` });
    return commit(draft, events, false);
  }
  if (refs.length > 1) {
    return askWhich(
      draft,
      events,
      'Talk to whom?',
      refs.map((r) => ({ label: refLabel(r), action: { type: 'TALK', target: r.id } as GameAction }))
    );
  }
  const person = PEOPLE[refs[0]!.id]!;
  if (draft.pending?.kind === 'conversation' && draft.pending.personId === person.id) {
    topicListEvent(draft, events);
    return commit(draft, events, false);
  }
  draft.pending = { kind: 'conversation', personId: person.id, heard: [] };
  events.push({ kind: 'dialogue', text: renderText(person.greeting(draft), draft) });
  topicListEvent(draft, events);
  return commit(draft, events, true);
}

function doTopic(draft: Draft, topicId: string, events: NarrativeEvent[]): ResolveResult {
  if (draft.pending?.kind !== 'conversation') {
    events.push({ kind: 'failure', text: 'You are not talking to anyone.' });
    return commit(draft, events, false);
  }
  const person = PEOPLE[draft.pending.personId];
  if (!person) {
    draft.pending = null;
    events.push({ kind: 'failure', text: 'That conversation has gone. Try again.' });
    return commit(draft, events, false);
  }
  const topic = availableTopics(person, draft, draft.pending.heard).find((t) => t.id === topicId);
  if (!topic) {
    events.push({ kind: 'failure', text: 'That is not something you can ask about just now.' });
    topicListEvent(draft, events);
    return commit(draft, events, false);
  }

  events.push({ kind: 'dialogue', text: renderText(topic.response(draft), draft) });
  draft.pending.heard.push(topic.id);
  // Heard topics are remembered permanently, so later topics can depend on them
  // across separate conversations.
  discover(draft, [`topic.${person.id}.${topic.id}`]);
  journalEvents(applyEffects(draft, topic.effects), events);

  const ended = maybeEndPrototype(draft, events);
  if (!ended) topicListEvent(draft, events);
  return commit(draft, events, true);
}

function doEndConversation(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (draft.pending?.kind !== 'conversation') {
    events.push({ kind: 'failure', text: 'You are not talking to anyone.' });
    return commit(draft, events, false);
  }
  const person = PEOPLE[draft.pending.personId];
  draft.pending = null;
  events.push({
    kind: 'dialogue',
    text: person ? `You take your leave of ${person.name}.` : 'You turn away.',
  });
  return commit(draft, events, true);
}

function doCross(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (draft.locationId === 'past.deep_chamber') {
    events.push({ kind: 'narration', text: THRESHOLD_SPENT });
    return commit(draft, events, true);
  }
  if (draft.locationId !== 'present.deep_chamber') {
    events.push({ kind: 'failure', text: 'There is nothing here to step into.' });
    return commit(draft, events, false);
  }

  // One transition: era, chapter, location, objective and journal all change
  // together, and the caller writes the result as a single save.
  draft.flags[FLAGS.crossed] = true;
  draft.chapter = 'crossing';
  events.push({ kind: 'narration', text: CROSSING });
  enterLocation(draft, 'past.deep_chamber', events);
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.crossed',
        text:
          'I stepped into the basin in the deep chamber and came down dry, in a chamber that is ' +
          'the same room and is not the same room.',
      },
    ]),
    events
  );
  setObjective(draft, OBJECTIVES.crossed, events);
  return commit(draft, events, true);
}

/** Returns true when this call ended the prototype. */
function maybeEndPrototype(draft: Draft, events: NarrativeEvent[]): boolean {
  if (draft.ended) return false;
  if (!f(draft, FLAGS.heardNoProphecy)) return false;
  if (draft.locationId !== 'past.square') return false;

  draft.ended = true;
  draft.pending = null;
  events.push({ kind: 'narration', text: ENDING });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.another_time',
        text:
          'This village is my village before the prophecy existed. The well is unworn, the ' +
          'workshop is unbuilt, the stump is a living tree, and nobody has heard the word.',
      },
    ]),
    events
  );
  setObjective(draft, OBJECTIVES.ended, events);
  events.push({ kind: 'system', text: END_OF_PROTOTYPE });
  return true;
}

function doJournal(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (draft.journal.length === 0) {
    events.push({
      kind: 'system',
      text: 'Your journal is empty. It fills up as you establish things.',
    });
    return commit(draft, events, true);
  }
  const lines = draft.journal.map((e) => `  • ${e.text}`).join('\n');
  events.push({ kind: 'system', text: `What you have established:\n${lines}` });
  return commit(draft, events, true);
}

function doHint(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  const hint = nextHint(draft);
  draft.flags[FLAGS.hintStage] = hint.nextStage;
  draft.flags[FLAGS.hintContext] = hint.context;
  events.push({
    kind: 'system',
    text:
      `Hint ${hint.step} of ${hint.total}:\n\n${hint.text}` +
      (hint.step < hint.total ? '\n\nAsk again for more.' : ''),
  });
  return commit(draft, events, true);
}
