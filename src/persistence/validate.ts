import type {
  Chapter,
  CharacterId,
  Era,
  FlagValue,
  GameState,
  ItemId,
  ItemPlacement,
  JournalEntry,
  LocationId,
  PendingState,
  TranscriptEntry,
  TranscriptKind,
} from '../engine/types';
import { SCHEMA_VERSION } from '../engine/types';
import { isLocationId, LOCATIONS } from '../content/locations';
import { isItemId } from '../content/items';
import { isCharacterId } from '../content/characters';
import { ALL_FLAG_KEYS, FLAGS, FLAG_TYPES } from '../content/flags';
import {
  CONTINUATION_FINALE,
  CONTINUATION_FUTURE,
  CONTINUATION_NOTICE,
  MALLET_RECOVERY,
  OBJECTIVES,
} from '../content/text';
import { OBJECTS } from '../content/objects';
import { PEOPLE } from '../content/dialogue';
import { chaptersForEra, eraOf } from '../engine/reducer';
import { isFinaleStage } from '../engine/puzzles/confrontation';

/** Hard ceiling on an imported save, well above anything this chapter produces. */
export const MAX_SAVE_BYTES = 512 * 1024;

export type ValidationResult = { ok: true; state: GameState } | { ok: false; error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function isFlagValue(value: unknown): value is FlagValue {
  return typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string';
}

function isChapter(value: unknown): value is Chapter {
  return (
    value === 'select' ||
    value === 'rite' ||
    value === 'crossing' ||
    value === 'future' ||
    value === 'return' ||
    value === 'ending'
  );
}

function isEra(value: unknown): value is Era {
  return value === 'present' || value === 'past' || value === 'future';
}

function isPlacement(value: unknown): value is ItemPlacement {
  if (!isPlainObject(value)) return false;
  if (value.kind === 'carried') return true;
  if (value.kind === 'room') return isLocationId(value.locationId);
  if (value.kind === 'fixture')
    return typeof value.fixtureId === 'string' && value.fixtureId in OBJECTS;
  return false;
}

/** Fields each action type requires, beyond `type`. */
const ACTION_SHAPES: Record<string, { strings?: string[]; optional?: string[] }> = {
  LOOK: {},
  EXITS: {},
  INVENTORY: {},
  JOURNAL: {},
  HINT: {},
  HELP: {},
  CANCEL: {},
  END_CONVERSATION: {},
  CROSS_THRESHOLD: {},
  GO: { strings: ['target'] },
  EXAMINE: { strings: ['target'] },
  TAKE: { strings: ['target'], optional: ['from'] },
  DROP: { strings: ['target'] },
  OPEN: { strings: ['target'] },
  CLOSE: { strings: ['target'] },
  BREAK: { strings: ['target'], optional: ['using'] },
  CLEAR: { strings: ['target'] },
  FILL: { strings: ['target'], optional: ['item'] },
  GIVE: { strings: ['item', 'target'] },
  SHOW: { strings: ['subject'], optional: ['target'] },
  RESTRAIN: { strings: ['target'] },
  BLOCK: { strings: ['target'] },
  KILL: { strings: ['target'], optional: ['using'] },
  RECITE: {},
  REFLECT: {},
  REVIEW: {},
  WAIT: {},
  LIGHT: { strings: ['target'] },
  TALK: { strings: ['target'] },
  USE: { strings: ['item'], optional: ['target'] },
  PLACE: { strings: ['item', 'target'] },
  TOPIC: { strings: ['topic'] },
  CHOOSE: { strings: ['value'] },
  UNPARSED: { strings: ['raw', 'reason'] },
  SELECT_CHARACTER: {},
};

/**
 * Checks that a stored action is one the engine actually has, with the fields
 * that action needs.
 *
 * A pending disambiguation stores the action each option would dispatch, so an
 * imported save gets to hand the reducer an action directly. The reducer's own
 * discovery checks already stop a crafted target reaching a hidden object, but
 * a malformed action would still be a crash waiting to happen, so the shape is
 * verified before the save is accepted at all.
 */
function isGameAction(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  if (typeof value.type !== 'string') return false;
  const shape = ACTION_SHAPES[value.type];
  if (!shape) return false;
  if (value.type === 'SELECT_CHARACTER' && !isCharacterId(value.character)) return false;
  for (const field of shape.strings ?? []) {
    if (typeof value[field] !== 'string') return false;
  }
  for (const field of shape.optional ?? []) {
    if (value[field] !== undefined && typeof value[field] !== 'string') return false;
  }
  return true;
}

function isPending(value: unknown): value is PendingState | null {
  if (value === null || value === undefined) return true;
  if (!isPlainObject(value)) return false;
  if (value.kind === 'conversation') {
    if (typeof value.personId !== 'string') return false;
    const person = PEOPLE[value.personId];
    if (!person || !isStringArray(value.heard)) return false;
    // Heard topics must be topics this person actually has.
    const known = new Set(person.topics.map((topic) => topic.id));
    return value.heard.every((id) => known.has(id));
  }
  if (value.kind === 'clarification') {
    if (typeof value.question !== 'string' || !Array.isArray(value.options)) return false;
    if (value.options.length === 0) return false;
    return value.options.every(
      (option: unknown) =>
        isPlainObject(option) && typeof option.label === 'string' && isGameAction(option.action)
    );
  }
  return false;
}

const TRANSCRIPT_KINDS: ReadonlySet<string> = new Set<TranscriptKind>([
  'narration',
  'command',
  'location',
  'dialogue',
  'success',
  'system',
  'options',
  'objective',
  'journal',
  'failure',
]);

function isJournalEntry(value: unknown): value is JournalEntry {
  return (
    isPlainObject(value) &&
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.turn === 'number'
  );
}

/**
 * Format 1 → 2.
 *
 * No field was added, removed or retyped: 2 only widens what `era`, `chapter`
 * and `locationId` are allowed to hold. So the migration is a value fix-up, and
 * exactly one value needs fixing.
 *
 * **The old end-of-prototype marker.** A format-1 save could be `ended: true`
 * standing in `past.square`, because that is where the prototype stopped. The
 * story now continues from there, so that save must come back as a playable
 * position rather than a finished one — and the transcript the player is
 * looking at still ends in "the story does not continue past this point yet",
 * so it gets one appended line correcting that rather than being silently
 * contradicted.
 *
 * Two rules this follows deliberately:
 *
 *  - **Only eligible saves.** `ended` is cleared only for a save that is in
 *    `past.square` and has the flag the old ending required. Every other
 *    completion flag is left exactly as it is: nothing here clears progress
 *    wholesale.
 *  - **Idempotent.** After the fix-up the save is no longer `ended`, so
 *    re-running it is a no-op, and the notice is keyed on a fixed transcript id
 *    so it cannot be appended twice.
 */
const CONTINUATION_ENTRY_ID = 't.m3.continues';
const CONTINUATION_FUTURE_ID = 't.m4.continues';
const CONTINUATION_FINALE_ID = 't.m5.continues';
const MALLET_RECOVERY_ID = 't.m5.mallet';

function migrateV1toV2(data: Record<string, unknown>): Record<string, unknown> {
  const next = { ...data };
  const wasPrototypeEnd =
    next.ended === true &&
    next.locationId === 'past.square' &&
    isPlainObject(next.flags) &&
    next.flags[FLAGS.heardNoProphecy] === true;

  if (wasPrototypeEnd) {
    next.ended = false;
    next.objective = OBJECTIVES.home;

    const transcript = Array.isArray(next.transcript) ? [...next.transcript] : [];
    const alreadyTold = transcript.some(
      (entry: unknown) => isPlainObject(entry) && entry.id === CONTINUATION_ENTRY_ID
    );
    if (!alreadyTold) {
      transcript.push({
        id: CONTINUATION_ENTRY_ID,
        kind: 'system',
        text: CONTINUATION_NOTICE,
      });
    }
    next.transcript = transcript;
  }

  return next;
}

/**
 * Format 2 → 3.
 *
 * Same shape again. 3 only widens `chapter` by one value — `return`, which is
 * the original era for the second time — and adds the flags and locations the
 * ruined century needs. So this is a value fix-up with one thing to fix, and it
 * is the same thing as last time one boundary further on: **a save that stopped
 * where the previous build stopped.**
 *
 * That save is `ended: true` in `future.deep_chamber`, having just arrived.
 * The chapter continues from there now, so it comes back as a game in progress
 * with the objective the rest of the chapter answers.
 *
 * The version is the right hook for this precisely because the state shape did
 * not change: `ended` at the future arrival is indistinguishable from a
 * legitimate format-3 state by inspection alone, so the rule is "format 2 said
 * the story stopped here, format 3 says it does not", and it runs exactly once
 * per file on the way in.
 *
 * Same two properties as the 1 → 2 step:
 *
 *  - **Only eligible saves.** Conditioned on the location, on `ended`, and on
 *    the crossing that is the only way to be standing there. Nothing else is
 *    cleared, and a save marked complete anywhere the current content cannot
 *    end is refused as an edited file rather than repaired.
 *  - **Idempotent.** After the fix-up the save is not `ended`, so a second run
 *    does nothing, and the notice is keyed on a fixed transcript id.
 */
function migrateV2toV3(data: Record<string, unknown>): Record<string, unknown> {
  const next = { ...data };
  const wasFutureArrival =
    next.ended === true &&
    next.locationId === 'future.deep_chamber' &&
    isPlainObject(next.flags) &&
    next.flags[FLAGS.crossedForward] === true;

  if (wasFutureArrival) {
    next.ended = false;
    next.objective = OBJECTIVES.future;

    const transcript = Array.isArray(next.transcript) ? [...next.transcript] : [];
    const alreadyTold = transcript.some(
      (entry: unknown) => isPlainObject(entry) && entry.id === CONTINUATION_FUTURE_ID
    );
    if (!alreadyTold) {
      transcript.push({
        id: CONTINUATION_FUTURE_ID,
        kind: 'system',
        text: CONTINUATION_FUTURE,
      });
    }
    next.transcript = transcript;
  }

  return next;
}

/**
 * Format 3 → 4.
 *
 * Same shape again, and the same single thing to fix one boundary further on:
 * **a save that stopped where the previous build stopped.** That one is
 * `ended: true` in `present.sealed_chamber` with `chapter: 'return'`, having
 * just come back. The confrontation runs from there now.
 *
 * It also has one thing of its own to put right. The previous build let a
 * player cross back without the mallet, and the finale needs it — so a
 * return-endpoint save that has not got it is given it, with a line saying so.
 *
 * That recovery is deliberately narrow:
 *
 *  - **Only identified endpoint saves.** Conditioned on `chapter === 'return'`,
 *    which is a state only the previous build's boundary produced.
 *  - **It is a move, not a copy.** If the mallet exists anywhere in the save it
 *    is moved to carried, so nothing is duplicated; only a save that never had
 *    a record for it gets one created.
 *  - **It is announced.** One transcript line, under a fixed id, rather than an
 *    item appearing in the inventory out of nowhere.
 *
 * Current games are untouched: a player who puts the mallet down in the finale
 * can pick it back up, and nothing here rewrites that.
 */
function migrateV3toV4(data: Record<string, unknown>): Record<string, unknown> {
  const next = { ...data };
  if (next.chapter !== 'return') return next;

  const transcript = Array.isArray(next.transcript) ? [...next.transcript] : [];
  const told = (id: string) =>
    transcript.some((entry: unknown) => isPlainObject(entry) && entry.id === id);
  const say = (id: string, text: string) => {
    if (!told(id)) transcript.push({ id, kind: 'system', text });
  };

  if (next.ended === true) {
    next.ended = false;
    next.objective = OBJECTIVES.returned;
    say(CONTINUATION_FINALE_ID, CONTINUATION_FINALE);
  }

  const inventory = Array.isArray(next.inventory) ? [...next.inventory] : [];
  if (!inventory.includes('mallet')) {
    const placements = isPlainObject(next.placements) ? { ...next.placements } : {};
    inventory.push('mallet');
    placements['mallet'] = { kind: 'carried' };
    next.inventory = inventory;
    next.placements = placements;
    say(MALLET_RECOVERY_ID, MALLET_RECOVERY);
  }

  next.transcript = transcript;
  return next;
}

/**
 * Save-format migrations, oldest first, each one feeding the next.
 *
 * A format-1 save that has never been opened since goes through both steps, in
 * order, which is why they are written as fall-through rather than a switch.
 * No step is invented for a version that was never shipped.
 */
function migrate(
  data: Record<string, unknown>,
  version: number
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  let working = data;
  let at = version;

  if (at === 1) {
    working = migrateV1toV2(working);
    at = 2;
  }
  if (at === 2) {
    working = migrateV2toV3(working);
    at = 3;
  }
  if (at === 3) {
    working = migrateV3toV4(working);
    at = 4;
  }

  if (at === SCHEMA_VERSION) return { ok: true, data: working };
  return {
    ok: false,
    error: `Save format ${version} is not one this build knows how to read.`,
  };
}

/**
 * Validates an untrusted save payload before it goes anywhere near live state.
 *
 * Everything is checked: size, format version, character, location, the
 * agreement between era and location, item ids, flag keys and value types, and
 * the consistency of inventory with item placements. Failures are reported,
 * not repaired.
 *
 * The returned state is rebuilt field by field, so nothing in the file that is
 * not named here can reach the running game.
 */
export function validateSave(input: unknown, rawBytes?: number): ValidationResult {
  if (rawBytes !== undefined && rawBytes > MAX_SAVE_BYTES) {
    return {
      ok: false,
      error: `That file is ${Math.round(rawBytes / 1024)} KB. A save for this story cannot be larger than ${MAX_SAVE_BYTES / 1024} KB.`,
    };
  }
  if (!isPlainObject(input)) {
    return { ok: false, error: 'That is not a save file: its contents are not an object.' };
  }

  const rawVersion = input.schemaVersion;
  if (typeof rawVersion !== 'number' || !Number.isInteger(rawVersion)) {
    return { ok: false, error: 'That file has no usable save-format version.' };
  }
  if (rawVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      error: `That save was written by a newer version of the game (format ${rawVersion}; this build reads up to ${SCHEMA_VERSION}).`,
    };
  }
  const migrated = migrate(input, rawVersion);
  if (!migrated.ok) return migrated;
  const data = migrated.data;

  const character: unknown = data.character;
  if (!isCharacterId(character)) {
    return { ok: false, error: 'That save does not name a character this story has.' };
  }

  const locationId: unknown = data.locationId;
  if (!isLocationId(locationId)) {
    return { ok: false, error: 'That save is set somewhere this story does not have.' };
  }

  const era: unknown = data.era;
  if (!isEra(era)) {
    return { ok: false, error: 'That save has an unreadable era.' };
  }
  if (era !== eraOf(locationId) || LOCATIONS[locationId].era !== era) {
    return { ok: false, error: 'That save is inconsistent: its era and its location disagree.' };
  }

  const chapter: unknown = data.chapter;
  if (!isChapter(chapter)) {
    return { ok: false, error: 'That save has an unknown chapter.' };
  }
  if (chapter === 'select') {
    // Nothing is ever saved before a character is chosen.
    return { ok: false, error: 'That save was written before the story started.' };
  }
  /*
   * Each crossing moves chapter and era together, so the two can only disagree
   * in a file that has been edited.
   *
   * Not one chapter per era any more: the original era is both the opening and
   * the return, so this checks membership of the legal pairs rather than
   * equality against a single answer.
   */
  if (!chaptersForEra(era).includes(chapter)) {
    return {
      ok: false,
      error: 'That save is inconsistent: its chapter and its era disagree about the crossing.',
    };
  }

  const rawInventory: unknown = data.inventory;
  if (!Array.isArray(rawInventory) || !rawInventory.every((v: unknown) => isItemId(v))) {
    return { ok: false, error: 'That save lists an item this story does not have.' };
  }
  const inventory = rawInventory as ItemId[];

  const rawPlacements: unknown = data.placements;
  if (!isPlainObject(rawPlacements)) {
    return { ok: false, error: 'That save has unreadable item positions.' };
  }
  const placements: Record<string, ItemPlacement> = {};
  for (const [id, placement] of Object.entries(rawPlacements)) {
    if (!isItemId(id)) {
      return { ok: false, error: `That save positions an item this story does not have ("${id}").` };
    }
    if (!isPlacement(placement)) {
      return { ok: false, error: `That save has an unreadable position for "${id}".` };
    }
    placements[id] = placement;
  }

  const discovered: unknown = data.discovered;
  if (!isStringArray(discovered)) {
    return { ok: false, error: 'That save has an unreadable list of discovered things.' };
  }

  const rawFlags: unknown = data.flags;
  if (!isPlainObject(rawFlags)) {
    return { ok: false, error: 'That save has unreadable flags.' };
  }
  const flags: Record<string, FlagValue> = {};
  for (const [key, value] of Object.entries(rawFlags)) {
    if (!ALL_FLAG_KEYS.includes(key)) {
      return { ok: false, error: `That save sets a flag this story does not have ("${key}").` };
    }
    if (!isFlagValue(value)) {
      return { ok: false, error: `That save has a non-primitive value for flag "${key}".` };
    }
    const expected = FLAG_TYPES[key];
    if (expected && typeof value !== expected) {
      return {
        ok: false,
        error: `That save has a ${typeof value} in flag "${key}", which holds a ${expected}.`,
      };
    }
    if (expected === 'number' && !Number.isFinite(value as number)) {
      return { ok: false, error: `That save has an unusable number in flag "${key}".` };
    }
    flags[key] = value;
  }

  const rawJournal: unknown = data.journal;
  if (!Array.isArray(rawJournal) || !rawJournal.every((e: unknown) => isJournalEntry(e))) {
    return { ok: false, error: 'That save has an unreadable journal.' };
  }
  const journal = (rawJournal as JournalEntry[]).map((e) => ({
    id: e.id,
    text: e.text,
    turn: e.turn,
  }));

  const rawVisited: unknown = data.visited;
  if (!Array.isArray(rawVisited) || !rawVisited.every((v: unknown) => isLocationId(v))) {
    return { ok: false, error: 'That save lists a place this story does not have.' };
  }
  const visited = rawVisited as LocationId[];

  const objective: unknown = data.objective;
  if (typeof objective !== 'string') {
    return { ok: false, error: 'That save has an unreadable objective.' };
  }

  const pending: unknown = data.pending ?? null;
  if (!isPending(pending)) {
    return { ok: false, error: 'That save has an unreadable pending choice.' };
  }

  const turn: unknown = data.turn;
  const seq: unknown = data.seq;
  if (
    typeof turn !== 'number' ||
    typeof seq !== 'number' ||
    !Number.isFinite(turn) ||
    !Number.isFinite(seq)
  ) {
    return { ok: false, error: 'That save has unreadable counters.' };
  }

  const ended: unknown = data.ended;
  if (typeof ended !== 'boolean') {
    return { ok: false, error: 'That save has an unreadable completion state.' };
  }
  /*
   * `ended` marks the boundary of the content that exists, which is now the
   * return: the sealed chamber, at dusk, with two of them in it. Saves that
   * were `ended` at either previous boundary have already been un-ended by the
   * migrations above, so reaching here with `ended` set anywhere else means an
   * edited file.
   */
  /*
   * `ended` now means the story is over, not that the build ran out. The main
   * path has no content boundary left, so the only legitimate `ended` save is
   * the ending — and saves that were `ended` at either of the two previous
   * boundaries have been un-ended by the migrations above.
   */
  if (ended !== (chapter === 'ending')) {
    return {
      ok: false,
      error: 'That save disagrees with itself about whether the story is over.',
    };
  }
  /*
   * `crossed` latches on the first crossing and stays true afterwards, so it
   * means "has been somewhere else" rather than "is somewhere else now" — and
   * the original era is reachable both before any crossing and after all three
   * of them, so the chapter is what distinguishes those.
   */
  const hasCrossed = era !== 'present' || chapter === 'return' || chapter === 'ending';
  if (Boolean(flags[FLAGS.crossed]) !== hasCrossed) {
    return {
      ok: false,
      error: 'That save is inconsistent: its crossing flag and its era disagree.',
    };
  }
  /*
   * `crossedForward` latches at the second crossing and stays set afterwards,
   * so it means "has been to the ruined century" rather than "is there now".
   * The chapter is what says where they are.
   */
  if (flags[FLAGS.crossedForward] !== true && (era === 'future' || chapter === 'return')) {
    return {
      ok: false,
      error: 'That save is inconsistent: its second crossing and its era disagree.',
    };
  }
  if (Boolean(flags[FLAGS.crossedBack]) !== (chapter === 'return' || chapter === 'ending')) {
    return {
      ok: false,
      error: 'That save is inconsistent: its last crossing and its chapter disagree.',
    };
  }
  /*
   * An eye does not grow back and is not lost early. It happens once, at the
   * seal, and the seal cannot be open without it — so a file claiming one
   * without the other has been edited.
   */
  if (Boolean(flags[FLAGS.lostEye]) !== Boolean(flags[FLAGS.sealOpened])) {
    return {
      ok: false,
      error: 'That save is inconsistent about the seal and the injury.',
    };
  }
  const inTheFinale = chapter === 'return' || chapter === 'ending';
  if (inTheFinale && flags[FLAGS.lostEye] !== true) {
    return { ok: false, error: 'That save returns without the injury that got it there.' };
  }
  if (inTheFinale && flags[FLAGS.knowsResponsibility] !== true) {
    return { ok: false, error: 'That save returns without the reason for returning.' };
  }

  /*
   * The finale's terminal facts, and the order they can only have happened in.
   *
   * Each of these is a state the engine cannot produce, so reaching here means
   * an edited file. They are checked rather than repaired.
   */
  const stage: unknown = flags[FLAGS.finaleStage];
  if (stage !== undefined && !isFinaleStage(stage)) {
    return { ok: false, error: 'That save is at a stage of the last chapter that does not exist.' };
  }
  if (stage !== undefined && chapter !== 'return' && chapter !== 'ending') {
    return { ok: false, error: 'That save is in the last chapter without being in it.' };
  }
  const theyAreDead = flags[FLAGS.earlierSelfDead] === true;
  if (theyAreDead && chapter !== 'return' && chapter !== 'ending') {
    return { ok: false, error: 'That save kills somebody who is not in it.' };
  }
  if (theyAreDead !== (stage === 'dead' || stage === 'pillar' || chapter === 'ending')) {
    return {
      ok: false,
      error: 'That save disagrees with itself about whether the earlier self is alive.',
    };
  }
  if (isPlainObject(pending) && pending.kind === 'conversation' && pending.personId === 'earlier_self' && theyAreDead) {
    return { ok: false, error: 'That save is mid-conversation with somebody who is dead.' };
  }
  if (flags[FLAGS.caveDestroyed] === true && !theyAreDead) {
    return {
      ok: false,
      error: 'That save brings the hill down with the earlier self still alive in it.',
    };
  }
  if (flags[FLAGS.heroDead] === true && flags[FLAGS.caveDestroyed] !== true) {
    return { ok: false, error: 'That save kills the hero without the thing that killed them.' };
  }
  if (chapter === 'ending') {
    for (const [flag, complaint] of [
      [FLAGS.earlierSelfDead, 'both deaths'],
      [FLAGS.caveDestroyed, 'the destruction'],
      [FLAGS.heroDead, 'both deaths'],
      [FLAGS.storyComplete, 'the ending'],
    ] as const) {
      if (flags[flag] !== true) {
        return { ok: false, error: `That save is at the ending without ${complaint}.` };
      }
    }
    if (locationId !== 'present.sealed_chamber') {
      return { ok: false, error: 'That save ends somewhere the story does not end.' };
    }
  }
  if (flags[FLAGS.heroDead] === true && chapter !== 'ending') {
    return { ok: false, error: 'That save has a dead hero walking around in it.' };
  }
  const struck = flags[FLAGS.pillarStruck];
  if (typeof struck === 'number' && (struck < 0 || struck > 3 || !Number.isInteger(struck))) {
    return { ok: false, error: 'That save has an impossible number of blows on the pillar.' };
  }
  if (typeof struck === 'number' && struck > 0 && !theyAreDead) {
    return { ok: false, error: 'That save swings at the pillar with somebody under it.' };
  }
  if (flags[FLAGS.caveDestroyed] === true && struck !== 3) {
    return { ok: false, error: 'That save destroys the cave without finishing the pillar.' };
  }
  const reach = flags[FLAGS.theirReach];
  if (typeof reach === 'number' && (reach < 0 || reach > 3 || !Number.isInteger(reach))) {
    return { ok: false, error: 'That save has an impossible position in the last chapter.' };
  }
  if (flags[FLAGS.sealOpened] === true && era === 'present' && chapter === 'rite') {
    return { ok: false, error: 'That save is inconsistent: its era and its history disagree.' };
  }
  // Access latches, and the three ways of earning it are the only ways it can
  // be set, so a file claiming access with none of them has been edited.
  if (
    flags[FLAGS.worksiteAccess] === true &&
    !flags[FLAGS.carriedWater] &&
    !flags[FLAGS.fennRoute] &&
    !flags[FLAGS.saffraEscort]
  ) {
    return {
      ok: false,
      error: 'That save has the workings open without any of the ways of opening them.',
    };
  }

  const contentVersion: unknown = data.contentVersion;
  if (typeof contentVersion !== 'string') {
    return { ok: false, error: 'That save has no content version.' };
  }

  // Inventory and placements must agree in BOTH directions, or an item could
  // be carried and sitting in an alcove at the same time, or be marked carried
  // while the player is not holding it — which would leave it unreachable.
  for (const item of inventory) {
    if (placements[item]?.kind !== 'carried') {
      return { ok: false, error: `That save both carries and stores "${item}".` };
    }
  }
  for (const [item, placement] of Object.entries(placements)) {
    if (placement.kind === 'carried' && !inventory.includes(item as ItemId)) {
      return {
        ok: false,
        error: `That save marks "${item}" as carried but does not list it in the inventory.`,
      };
    }
  }
  if (new Set(inventory).size !== inventory.length) {
    return { ok: false, error: 'That save lists the same item in the inventory twice.' };
  }

  // The transcript is display history, not progress. Keep only well-shaped
  // entries, and keep only their text, so an edited file cannot smuggle
  // anything but words onto the page.
  const rawTranscript: unknown = data.transcript;
  const transcript: TranscriptEntry[] = (Array.isArray(rawTranscript) ? rawTranscript : [])
    .filter(
      (entry: unknown): entry is Record<string, unknown> =>
        isPlainObject(entry) &&
        typeof entry.id === 'string' &&
        typeof entry.text === 'string' &&
        typeof entry.kind === 'string' &&
        TRANSCRIPT_KINDS.has(entry.kind)
    )
    .map((entry) => {
      const out: TranscriptEntry = {
        id: String(entry.id),
        kind: entry.kind as TranscriptKind,
        text: String(entry.text),
      };
      if (typeof entry.heading === 'string') out.heading = entry.heading;
      if (typeof entry.subheading === 'string') out.subheading = entry.subheading;
      return out;
    });

  const state: GameState = {
    schemaVersion: SCHEMA_VERSION,
    contentVersion,
    character: character as CharacterId,
    chapter,
    era,
    locationId,
    inventory: inventory.slice(),
    placements,
    discovered: discovered.slice(),
    flags,
    journal,
    transcript,
    visited: visited.slice(),
    objective,
    pending,
    turn,
    ended,
    seq,
  };

  return { ok: true, state };
}
