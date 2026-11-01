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
import { ALL_FLAG_KEYS } from '../content/flags';
import { OBJECTS } from '../content/objects';
import { PEOPLE } from '../content/dialogue';
import { eraOf } from '../engine/reducer';

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
  return value === 'select' || value === 'rite' || value === 'crossing';
}

function isEra(value: unknown): value is Era {
  return value === 'present' || value === 'past';
}

function isPlacement(value: unknown): value is ItemPlacement {
  if (!isPlainObject(value)) return false;
  if (value.kind === 'carried') return true;
  if (value.kind === 'room') return isLocationId(value.locationId);
  if (value.kind === 'fixture')
    return typeof value.fixtureId === 'string' && value.fixtureId in OBJECTS;
  return false;
}

function isPending(value: unknown): value is PendingState | null {
  if (value === null || value === undefined) return true;
  if (!isPlainObject(value)) return false;
  if (value.kind === 'conversation') {
    return (
      typeof value.personId === 'string' &&
      value.personId in PEOPLE &&
      isStringArray(value.heard)
    );
  }
  if (value.kind === 'clarification') {
    if (typeof value.question !== 'string' || !Array.isArray(value.options)) return false;
    return value.options.every(
      (option: unknown) =>
        isPlainObject(option) &&
        typeof option.label === 'string' &&
        isPlainObject(option.action) &&
        typeof option.action.type === 'string'
    );
  }
  return false;
}

const TRANSCRIPT_KINDS: ReadonlySet<string> = new Set<TranscriptKind>([
  'narration',
  'command',
  'location',
  'dialogue',
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
 * Save-format migrations.
 *
 * Only format 1 has ever existed, so there is nothing to migrate yet. The
 * switch is where the first real migration goes; it deliberately invents no
 * steps for versions that were never shipped.
 */
function migrate(
  data: Record<string, unknown>,
  version: number
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  switch (version) {
    case SCHEMA_VERSION:
      return { ok: true, data };
    default:
      return {
        ok: false,
        error: `Save format ${version} is not one this build knows how to read.`,
      };
  }
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

  const contentVersion: unknown = data.contentVersion;
  if (typeof contentVersion !== 'string') {
    return { ok: false, error: 'That save has no content version.' };
  }

  // Inventory and placements must agree, or an item could be carried and
  // sitting in an alcove at the same time.
  for (const item of inventory) {
    if (placements[item]?.kind !== 'carried') {
      return { ok: false, error: `That save both carries and stores "${item}".` };
    }
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
