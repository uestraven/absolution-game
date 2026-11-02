import type {
  CharacterId,
  GameAction,
  GameState,
  ItemId,
  LocationId,
  NarrativeEvent,
  ResolveResult,
} from './types';
import type { Ref } from './selectors';
import {
  addJournal,
  applyEffects,
  clone,
  commit,
  discover,
  flag as f,
  giveItem,
  itemIsIn,
  journalEvents,
  removeFromInventory,
  setObjective,
  type Draft,
} from './mechanics';
import {
  checkIllumination,
  liftShutter,
  noteReliefMatch,
  openPassage,
  wedgeShutter,
} from './puzzles/shutteredRelief';
import { canRecite, declineRecital, doRecite } from './puzzles/recitation';
import { maybeSymptom } from './puzzles/rupture';
import { fillSkins, giveWater } from './puzzles/water';
import {
  enterAperture,
  noteSettings,
  placeLanternInDish,
  type DishId,
} from './puzzles/worksite';
import { CONTENT_VERSION, SCHEMA_VERSION } from './types';
import { LOCATIONS } from '../content/locations';
import { OBJECTS, OBJECTS_BY_LOCATION, objectVerbs } from '../content/objects';
import { ALL_ITEM_IDS, ITEMS, isItemId } from '../content/items';
import { PEOPLE, PEOPLE_BY_LOCATION, availableTopics } from '../content/dialogue';
import { FLAGS } from '../content/flags';
import { c, g } from '../content/markup';
import { renderText } from '../content/characters';
import { HELP_TEXT } from '../content/help';
import { nextHint } from '../content/hints';
import { CROSSING, ENDING, OBJECTIVES, OPENING, THRESHOLD_SPENT } from '../content/text';
import { unparsedMessage } from './parser';
import {
  activeTopics,
  allExits,
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

/**
 * Era implied by a location id. The two must always agree, and save validation
 * cross-checks them, which is why the era is a function of the id rather than
 * an independent field anybody has to remember to set.
 */
export function eraOf(locationId: LocationId): GameState['era'] {
  if (locationId.startsWith('past.')) return 'past';
  if (locationId.startsWith('future.')) return 'future';
  return 'present';
}

/** The chapter that belongs with an era. Enforced by the validator. */
export function chapterForEra(era: GameState['era']): GameState['chapter'] {
  if (era === 'past') return 'crossing';
  if (era === 'future') return 'future';
  return 'rite';
}

/* ------------------------------------------------------------------ *
 * Internal helpers
 * ------------------------------------------------------------------ */







/** Which position each addressable dish object is. */
const DISH_OF: Record<string, DishId | undefined> = {
  'worksite.lowdish': 'low',
  'worksite.outline': 'middle',
  'worksite.highdish': 'high',
};

/**
 * "Put the lantern in the dish" names three things. Ask, rather than guessing
 * which one the player meant — guessing wrong here is the difference between a
 * century.
 */
function askWhichDish(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  const options = Object.keys(DISH_OF)
    .filter((id) => draft.discovered.includes(id))
    .map((id) => ({
      label: OBJECTS[id]!.name,
      action: { type: 'PLACE', item: 'lantern', target: id } as GameAction,
    }));
  if (options.length === 0) {
    events.push({
      kind: 'failure',
      text: 'Look at the dishes properly first. There are three positions and they are not the same.',
    });
    return commit(draft, events, false);
  }
  return askWhich(draft, events, 'Which position?', options);
}

function listSentence(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join('; ')}; and ${items[items.length - 1]}`;
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

  // Beats that belong to arriving somewhere, in a fixed order and each one
  // latched so a reload cannot replay it.
  maybePastRealisation(draft, events);
  maybeSymptom(draft, events);
}



/* ------------------------------------------------------------------ *
 * Item placement helpers
 * ------------------------------------------------------------------ */




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
  const list = options.map((o, i) => `  ${i + 1}. ${c(o.label)}`).join('\n');
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
  // Said to the people in front of you: it belongs inside the conversation
  // rather than turning away from it.
  'RECITE',
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

    case 'FILL':
      return doFill(draft, action.target, events);

    case 'GIVE':
      return doGive(draft, action.item, action.target, events);

    case 'RECITE':
      return doRecite(draft, events);

    case 'WAIT':
      return doWait(draft, events);

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
    exit.direction ? `  ${c(exit.direction)} — ${c(exit.label)}` : `  ${c(exit.label)}`
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
    /*
     * The spoil heap and the opening behind it are openly described, so
     * refusing with "you cannot go that way" would be a lie about a wall the
     * player can see. Answered on its own terms instead.
     *
     * Everything else keeps the blank refusal, which is deliberate: for a
     * genuinely hidden way on, the message must be identical whether the
     * direction is wrong or the exit exists and has not been found, or probing
     * would reveal it.
     */
    const blocked = allExits(draft).find(
      (exit) =>
        exit.requires !== undefined &&
        !exit.requires(draft) &&
        (exit.direction === wanted ||
          exit.id === wanted ||
          exit.label.toLowerCase().includes(wanted) ||
          (exit.aliases ?? []).some((alias) => alias.toLowerCase() === wanted))
    );
    if (blocked?.id === 'to_worksite' && draft.locationId === 'past.deep_chamber') {
      events.push({
        kind: 'failure',
        text:
          'You go round the end of the spoil heap, and you get a shoulder into the gap, and the ' +
          'stair behind you is a long straight tube of daylight with a man sitting at the top ' +
          'of it.\n\n' +
          'He has not moved. He does not have to. You would be in there with no way out past ' +
          'him and nothing to say for yourself, and you have watched him be reasonable at ' +
          'people and you do not want it.\n\n' +
          'You come back out. There has to be a reason to be in there, or a reason he is not ' +
          'at the top of that stair.',
      });
      return commit(draft, events, false);
    }
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
      // Fires the first time the drawing, the slate and the dishes have all
      // been read, whichever order the player read them in.
      noteSettings(draft, events);
      return commit(draft, events, true);
    }
  }
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
  if (def.item === 'lantern') {
    draft.flags[FLAGS.hasLantern] = true;
    // The lamp is in a hand now, so it is not in a dish or an alcove. Only
    // written when it was actually set, so an ordinary take does not litter
    // every save with flags that were never true.
    if (f(draft, FLAGS.lanternInAlcove)) draft.flags[FLAGS.lanternInAlcove] = false;
    if (f(draft, FLAGS.lanternInHighDish)) draft.flags[FLAGS.lanternInHighDish] = false;
  }
  if (def.item === 'stone') draft.flags[FLAGS.tookStone] = true;
  events.push({
    kind: 'success',
    text: def.takeText ? def.takeText(draft) : TAKE_TEXT[def.item],
  });
  return commit(draft, events, true);
}

/** What it is like to pick each thing up. */
const TAKE_TEXT: Record<ItemId, string> = {
  lantern:
    'You lift the lantern off the sill. It is heavier than it looks, the way full things are, ' +
    'and the striker chinks against the base.',
  wedge:
    'You take a wedge out of the basket and put it in your pocket, where it immediately becomes ' +
    'the most sensible thing you own.',
  stone:
    'You pick one out of the drift — grey, a pale band through it, indistinguishable from every ' +
    'other pebble in the hill — and put it in your pocket.\n\n' +
    'You note where you are standing, because you have been told you will be asked.',
  water_skins:
    'You get the yoke up onto one shoulder. Empty, it is nothing: four stiff bags and a bar of ' +
    'wood.\n\n' +
    'Nobody stops you, and the absence of anybody stopping you is its own small indignity.',
  mallet:
    'You pick up a man\'s mallet off a basket of his chisels, in his workings, while he is ' +
    'sitting outside in the mouth of them.\n\n' +
    'It is heavier at the head than you expected and the haft turns a quarter-turn in your ' +
    'hand before you grip it properly. You put it through your belt, where it hangs like ' +
    'something that does not belong to you, because it does not.',
};

/** Recovering an item from a fixture or from the floor. Always possible. */
function retrieveItem(draft: Draft, item: ItemId, events: NarrativeEvent[]): ResolveResult {
  const placement = draft.placements[item];

  if (placement?.kind === 'room') {
    giveItem(draft, item);
    events.push({ kind: 'success', text: `You pick the ${g(ITEMS[item].name)} back up.` });
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

  if (item === 'lantern' && itemIsIn(draft, 'lantern', 'worksite.highdish')) {
    giveItem(draft, item);
    draft.flags[FLAGS.lanternInHighDish] = false;
    events.push({
      kind: 'success',
      text:
        'You get back up on the trestle and lift the lantern out of the high dish, and the ' +
        'pressure in your jaw goes out like a held breath let go.\n\n' +
        'The aperture is a hole in a wall again, with a thumb of hill behind it. You can put ' +
        'the lamp back whenever you decide to.',
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
  events.push({ kind: 'success', text: `You take the ${g(ITEMS[item].name)}.` });
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
    text: `You put the ${g(ITEMS[item].name)} down. It will still be here if you want it.`,
  });
  return commit(draft, events, true);
}

function doInventory(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  const carried = draft.inventory.map((item) => `  ${c(ITEMS[item].inventoryLine(draft))}`);
  const elsewhere: string[] = [];
  for (const [id, placement] of Object.entries(draft.placements)) {
    if (!isItemId(id) || draft.inventory.includes(id)) continue;
    if (placement.kind === 'fixture') {
      const fixture = OBJECTS[placement.fixtureId];
      elsewhere.push(`  ${c(ITEMS[id].name)} — in the ${fixture ? fixture.name : 'cave'}`);
    } else if (placement.kind === 'room') {
      elsewhere.push(`  ${c(ITEMS[id].name)} — left in ${LOCATIONS[placement.locationId].name}`);
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
  if (known === 'water_skins') {
    events.push({
      kind: 'failure',
      text:
        'You have no skins with you. There is a yoke of empty ones propped against the ' +
        'half-built wall down in the square.',
    });
    return commit(draft, events, false);
  }
  if (known === 'mallet') {
    events.push({
      kind: 'failure',
      text: 'You are not carrying a mallet. Lovage keeps his on the chisel basket in the workings.',
    });
    return commit(draft, events, false);
  }
  if (known === 'stone') {
    events.push({
      kind: 'failure',
      text: 'You have no stone in your pocket.',
    });
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
  // Standing the lamp in a position is the same act however it is phrased.
  if (
    item === 'lantern' &&
    target.kind === 'object' &&
    DISH_OF[target.id] !== undefined
  ) {
    return doPlace(draft, 'lantern', target.id, events);
  }
  if (item === 'lantern' && target.kind === 'object' && target.id === 'worksite.dishes') {
    return askWhichDish(draft, events);
  }
  if (item === 'water_skins' && target.kind === 'object' && target.id === 'pastspring.spring') {
    return fillSkins(draft, events);
  }
  if (item === 'water_skins' && target.kind === 'person' && target.id === 'lovage') {
    return giveWater(draft, events);
  }
  if (item === 'mallet' && target.kind === 'object' && target.id === 'worksite.pillar') {
    events.push({
      kind: 'failure',
      text:
        'You get as far as lifting it.\n\n' +
        'Then you put it down, because you are standing under a hill with five men and a boy ' +
        'somewhere above you in it, and the man whose mallet this is has told you to your face ' +
        'what this pillar is holding up, and he was not being dramatic. He was being a mason.\n\n' +
        'Whatever you are here for, it is not that.',
    });
    return commit(draft, events, false);
  }

  if (target.kind === 'person') {
    if (item === 'stone' || item === 'water_skins' || item === 'mallet') {
      return doGive(draft, item, target.id, events);
    }
    events.push({
      kind: 'failure',
      text: `${target.label} looks at the ${ITEMS[item].name}, then at you, and declines to comment.`,
    });
    return commit(draft, events, false);
  }

  if (item === 'mallet') {
    events.push({
      kind: 'failure',
      text:
        `You weigh the mallet in your hand in front of the ${target.label} and then do not use ` +
        'it on anything.\n\n' +
        'It is a tool for persuading dressed stone a finger at a time in the hands of somebody ' +
        'who has done it for thirty years. In yours it is a heavy stick, and this is somebody ' +
        'else\'s work.',
    });
    return commit(draft, events, false);
  }

  if (item === 'water_skins') {
    events.push({
      kind: 'failure',
      text: `There is nothing the ${target.label} wants with four skins of water.`,
    });
    return commit(draft, events, false);
  }

  if (item === 'stone') {
    events.push({
      kind: 'failure',
      text:
        `You hold the pebble against the ${target.label}, which achieves what holding a pebble ` +
        'against a thing achieves. It is a pebble. Its entire value is where it came from.',
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

  const dish = target.kind === 'object' ? DISH_OF[target.id] : undefined;
  if (dish !== undefined) {
    if (item !== 'lantern') {
      events.push({
        kind: 'failure',
        text:
          `The dishes are cut for a lamp — dressed, undercut, and the exact size of the base ` +
          `of one. The ${ITEMS[item].name} is not that, and putting it there would do nothing ` +
          'at all.',
      });
      return commit(draft, events, false);
    }
    return placeLanternInDish(draft, dish, events);
  }
  if (target.kind === 'object' && target.id === 'worksite.dishes' && item === 'lantern') {
    return askWhichDish(draft, events);
  }

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
  if (f(draft, FLAGS.lanternInHighDish)) {
    events.push({
      kind: 'narration',
      text:
        'The flame takes up there above your head, and the panel answers it.\n\n' +
        'Pressure, in the back of your teeth and the hinges of your jaw: a held note in a stone ' +
        'room that you cannot actually hear. The same thing the alcove did, from a different ' +
        'height, in a different century.\n\n' +
        'The half-cut aperture is a thumb of rock and then nothing, and the nothing is doing ' +
        'something.',
    });
  }
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
  const lines = topics.map((t, i) => `  ${i + 1}. ${c(t.label)}`).join('\n');
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

  // A beat that fires on a topic stays inside the conversation: the list comes
  // back afterwards so the player is never left without a way to carry on.
  maybePastRealisation(draft, events);
  maybeSymptom(draft, events);
  topicListEvent(draft, events);
  return commit(draft, events, true);
}

function doEndConversation(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (draft.pending?.kind !== 'conversation') {
    events.push({ kind: 'failure', text: 'You are not talking to anyone.' });
    return commit(draft, events, false);
  }
  const person = PEOPLE[draft.pending.personId];
  const owed = canRecite(draft);
  draft.pending = null;
  events.push({
    kind: 'dialogue',
    text: person ? `You take your leave of ${person.name}.` : 'You turn away.',
  });
  // Walking away with the question still open costs nothing and closes
  // nothing: the opportunity stays exactly where it was.
  if (owed) declineRecital(draft, events);
  return commit(draft, events, true);
}

function doCross(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  // The second crossing: through the half-cut aperture, explicitly, as its own
  // action. Lighting the lamp never moves anybody.
  if (draft.locationId === 'past.worksite') {
    return enterAperture(draft, events);
  }
  if (draft.locationId === 'past.deep_chamber') {
    events.push({ kind: 'narration', text: THRESHOLD_SPENT });
    return commit(draft, events, true);
  }
  if (draft.locationId === 'future.deep_chamber') {
    events.push({
      kind: 'narration',
      text:
        'You get down at the rim out of habit and there is nothing in it but dry plates of ' +
        'silt and dust, and under the dust cut stone, and under the cut stone the hill.\n\n' +
        'Whatever this basin was, it is a hole in a floor now.',
    });
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

/**
 * The realisation in the square.
 *
 * This used to be where the prototype stopped. It is now the hinge into the
 * rest of the chapter: it fires once, on the same trigger as before, and sets
 * the objective that the rest of the chapter answers. The conversation is left
 * open, because walking away from Saffra mid-sentence was never the point.
 *
 * Latched on its own journal entry rather than on `ended`, so a legacy save
 * that has already seen it does not see it again.
 */
function maybePastRealisation(draft: Draft, events: NarrativeEvent[]): boolean {
  if (!f(draft, FLAGS.heardNoProphecy)) return false;
  if (draft.locationId !== 'past.square') return false;
  if (draft.journal.some((e) => e.id === 'j.another_time')) return false;

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
  setObjective(draft, OBJECTIVES.home, events);
  return true;
}

/* ------------------------------------------------------------------ *
 * Chapter 2 verbs
 * ------------------------------------------------------------------ */

function doFill(draft: Draft, target: string, events: NarrativeEvent[]): ResolveResult {
  const refs = resolveNoun(draft, target);
  if (refs.length === 0) {
    events.push({ kind: 'failure', text: `You cannot see any ${target.trim()} here to fill from.` });
    return commit(draft, events, false);
  }
  const ref = refs[0]!;
  if (ref.kind === 'object' && ref.id === 'pastspring.spring') {
    return fillSkins(draft, events);
  }
  if (ref.kind === 'item' && ref.id === 'water_skins') {
    // "fill the skins" names the thing being filled, not the source.
    if (draft.locationId === 'past.spring') return fillSkins(draft, events);
    events.push({
      kind: 'failure',
      text: 'There is nothing here to fill them from. The spring is up the track, north of the tree.',
    });
    return commit(draft, events, false);
  }
  events.push({
    kind: 'failure',
    text: `There is no water in the ${ref.label}, and nothing you could fill from it.`,
  });
  return commit(draft, events, false);
}

function doGive(
  draft: Draft,
  rawItem: string,
  rawTarget: string,
  events: NarrativeEvent[]
): ResolveResult {
  const held = requireHeldItem(draft, rawItem, events);
  if (typeof held !== 'string') return held;
  const item = held;

  const targetRefs = resolveNoun(draft, rawTarget, ['person']);
  if (targetRefs.length === 0) {
    events.push({ kind: 'failure', text: `There is nobody here called ${rawTarget.trim()}.` });
    return commit(draft, events, false);
  }
  if (targetRefs.length > 1) {
    return askWhich(
      draft,
      events,
      `Give the ${ITEMS[item].name} to whom?`,
      targetRefs.map((r) => ({
        label: refLabel(r),
        action: { type: 'GIVE', item, target: r.id } as GameAction,
      }))
    );
  }
  const person = targetRefs[0]!;

  if (item === 'water_skins' && person.id === 'lovage') return giveWater(draft, events);

  if (item === 'stone' && person.id === 'hesk') {
    if (f(draft, FLAGS.gaveStone)) {
      events.push({
        kind: 'narration',
        text: 'He has it. He is not going to need a second one.',
      });
      return commit(draft, events, false);
    }
    removeFromInventory(draft, 'stone');
    /*
     * It is his now. Dropped from placements rather than parked on a fixture:
     * a placement means "somewhere in the world the hero can get it back
     * from", and this is a thing that has been given away. Save validation
     * only ever checks placements that exist, so an absent one is simply an
     * item that is no longer anywhere.
     */
    delete draft.placements['stone'];
    draft.flags[FLAGS.gaveStone] = true;
    events.push({
      kind: 'success',
      text:
        'You put the pebble in his hand and tell him where it came from: the drift against the ' +
        'gallery wall, past the scratched names, further in than the ash goes.\n\n' +
        'Parsie holds it in both hands and looks at it with an attention that nothing about it ' +
        'deserves, and then he closes his fist round it and says "*Past the names*" in the ' +
        'voice of a boy filing something permanently.',
    });
    journalEvents(
      addJournal(draft, [
        {
          id: 'j.stone_given',
          text:
            'Gave Parsie a pebble from past the scratched names in the gallery, and told him ' +
            'where it came from. He is going to go further.',
        },
      ]),
      events
    );
    return commit(draft, events, true);
  }

  events.push({
    kind: 'failure',
    text: `${person.label} looks at the ${ITEMS[item].name} and does not take it.`,
  });
  return commit(draft, events, false);
}

/**
 * Waiting.
 *
 * Authored, and deliberately not a clock. Nothing is consumed, no path closes,
 * and the pressure the hero feels is described rather than counted down. The
 * chapter's tension is in what people have decided about them, which is a flag
 * that has already been set or has not.
 */
function doWait(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (draft.locationId === 'past.worksite') {
    events.push({
      kind: 'narration',
      text:
        'You sit down on the trestle and wait, and the hill is extremely patient about it.\n\n' +
        'Nothing changes. The chalk outline does not become a dish. Nobody comes down with a ' +
        'chisel and a free week. Somewhere above you the crew are working stone they will still ' +
        'be working at the end of the season, because that is how long a season is.\n\n' +
        'What you can hear yourself doing is waiting for somebody else to solve it, and the ' +
        'list of people who could is one name long, and he has told you what he thinks.',
    });
    return commit(draft, events, true);
  }
  if (draft.era === 'past') {
    events.push({
      kind: 'narration',
      text:
        'You wait. The light moves the way light moves.\n\n' +
        'Nobody is counting your hours and nothing is going to come and find you. But you are a ' +
        'stranger with no bed and no name in a village of perhaps sixty people, and you have ' +
        'begun to notice how fast a thing travels here: Saffra told one person about the ford ' +
        'and by the afternoon a child you had never met asked you about it.\n\n' +
        'Whatever you are going to do, it is not going to get easier by being done later.',
    });
    return commit(draft, events, true);
  }
  events.push({
    kind: 'narration',
    text:
      'You wait, and nothing uses the time. Whatever is going to happen today is going to ' +
      'happen because you went and did it.',
  });
  return commit(draft, events, true);
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
