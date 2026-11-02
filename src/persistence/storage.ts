import type { GameState } from '../engine/types';
import { validateSave, MAX_SAVE_BYTES } from './validate';

/**
 * Browser persistence.
 *
 * Three slots, all namespaced:
 *   save        the autosave, rewritten after every accepted action
 *   backup      the previous autosave, kept as a last-known-good
 *   checkpoint  the state at the start of the current chapter
 *
 * A fourth slot, `quarantine`, holds the raw bytes of a save that failed to
 * load, so a broken file is never silently replaced by a new game.
 *
 * Saves are per browser origin. They do not sync between devices or browsers,
 * and a preview deployment address has its own separate storage.
 */

const NS = 'cave-of-absolution';
export const KEYS = {
  save: `${NS}:save`,
  backup: `${NS}:backup`,
  checkpoint: `${NS}:checkpoint`,
  quarantine: `${NS}:quarantine`,
  prefs: `${NS}:prefs`,
  /**
   * Where the reader had got to. A UI preference, not story progress: it is
   * never written to a save, never exported, and losing it costs a scroll
   * position and nothing else.
   */
  reading: `${NS}:reading`,
} as const;

export type StorageSlot = 'save' | 'backup' | 'checkpoint';

export interface StorageStatus {
  /** False once a write has failed; the UI shows a persistent warning. */
  working: boolean;
  /** Player-facing reason the last write failed, if any. */
  message: string | null;
}

export interface LoadOutcome {
  state: GameState | null;
  /** Which slot the state came from. */
  slot: StorageSlot | null;
  /** Non-fatal notes worth telling the player about. */
  notes: string[];
  /** True when bytes existed but none of them could be read. */
  quarantined: boolean;
}

/**
 * Reading and writing are deliberately separated.
 *
 * A full or write-blocked store can still be read perfectly well, and a player
 * in that position must keep being able to Continue an existing save and export
 * it. Probing with a write before every read would hide their progress at
 * exactly the moment they most need to get it out.
 */
function readArea(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Write access, confirmed by probe: Safari in private mode throws on write. */
function writeArea(): Storage | null {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    const probe = `${NS}:probe`;
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

/** True when a save could be written. Reads may work regardless. */
export function storageAvailable(): boolean {
  return writeArea() !== null;
}

/** True when stored saves can be read, even if nothing can be written. */
export function storageReadable(): boolean {
  return readArea() !== null;
}

function readRaw(key: string): string | null {
  try {
    return readArea()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): StorageStatus {
  const store = writeArea();
  if (!store) {
    return {
      working: false,
      message:
        'This browser is not letting the game store anything, so progress is not being saved. ' +
        'Use Export Save to keep a copy.',
    };
  }
  try {
    store.setItem(key, value);
    return { working: true, message: null };
  } catch (error) {
    const quota =
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    return {
      working: false,
      message: quota
        ? 'Browser storage is full, so progress is not being saved. Use Export Save to keep a ' +
          'copy, then clear some site data.'
        : 'Saving failed, so progress is not being saved. Use Export Save to keep a copy.',
    };
  }
}

function removeRaw(key: string): void {
  try {
    readArea()?.removeItem(key);
  } catch {
    /* nothing to do: removal failing is not worth reporting */
  }
}

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

/**
 * Writes the autosave, rotating the previous one into the backup slot first.
 * Reports failure honestly: the caller must not claim a save succeeded.
 */
export function writeAutosave(state: GameState): StorageStatus {
  const previous = readRaw(KEYS.save);
  const payload = serialize(state);
  if (payload.length > MAX_SAVE_BYTES) {
    return {
      working: false,
      message: 'This save has grown too large to store. Use Export Save to keep a copy.',
    };
  }
  const result = writeRaw(KEYS.save, payload);
  if (result.working && previous !== null && previous !== payload) {
    /*
     * Only rotate bytes that are actually loadable.
     *
     * If the autosave slot held something corrupt — which is exactly when the
     * player was served from the backup — rotating it forward would overwrite
     * the one good save they had left. Best effort either way: a failed
     * rotation does not invalidate the autosave just written.
     */
    if (isLoadable(previous)) writeRaw(KEYS.backup, previous);
  }
  return result;
}

/** True when these bytes parse and validate as a save. */
function isLoadable(raw: string): boolean {
  try {
    return validateSave(JSON.parse(raw), raw.length).ok;
  } catch {
    return false;
  }
}

export function writeCheckpoint(state: GameState): StorageStatus {
  const payload = serialize(state);
  if (payload.length > MAX_SAVE_BYTES) {
    return {
      working: false,
      message: 'The chapter checkpoint is too large to store.',
    };
  }
  return writeRaw(KEYS.checkpoint, payload);
}

export function readSlot(slot: StorageSlot): { state: GameState | null; error: string | null } {
  const raw = readRaw(KEYS[slot]);
  if (raw === null) return { state: null, error: null };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { state: null, error: 'The stored save is not readable JSON.' };
  }
  const result = validateSave(parsed, raw.length);
  return result.ok ? { state: result.state, error: null } : { state: null, error: result.error };
}

/**
 * Loads the best available state, trying the autosave, then the backup, then
 * the chapter checkpoint. If bytes exist but none of them validate, the raw
 * autosave is copied to the quarantine slot so it can still be recovered by
 * hand, and nothing is overwritten.
 */
export function loadBest(): LoadOutcome {
  const notes: string[] = [];
  const order: StorageSlot[] = ['save', 'backup', 'checkpoint'];
  const labels: Record<StorageSlot, string> = {
    save: 'autosave',
    backup: 'backup save',
    checkpoint: 'chapter checkpoint',
  };

  let sawBytes = false;
  for (const slot of order) {
    const raw = readRaw(KEYS[slot]);
    if (raw !== null) sawBytes = true;
    const { state, error } = readSlot(slot);
    if (state) {
      if (slot !== 'save' && sawBytes) {
        notes.push(`Your most recent save could not be read, so the ${labels[slot]} was loaded.`);
      }
      return { state, slot, notes, quarantined: false };
    }
    if (error) notes.push(`The ${labels[slot]} could not be read: ${error}`);
  }

  if (sawBytes) {
    const raw = readRaw(KEYS.save);
    let quarantined = false;
    if (raw !== null && readRaw(KEYS.quarantine) === null) {
      // Claim this only once the write has actually succeeded.
      quarantined = writeRaw(KEYS.quarantine, raw).working;
      notes.push(
        quarantined
          ? 'The unreadable save has been kept aside rather than deleted, in case it can be ' +
              'recovered. Starting a new game will not erase it.'
          : 'The unreadable save could not be copied aside, because this browser is not ' +
              'accepting writes. It has been left exactly where it is and nothing will ' +
              'overwrite it.'
      );
    } else if (raw !== null) {
      quarantined = true;
    }
    return { state: null, slot: null, notes, quarantined };
  }

  return { state: null, slot: null, notes, quarantined: false };
}

export function hasAnySave(): boolean {
  return (
    readRaw(KEYS.save) !== null ||
    readRaw(KEYS.backup) !== null ||
    readRaw(KEYS.checkpoint) !== null
  );
}

export function clearProgress(): void {
  // The quarantine slot is deliberately left alone.
  removeRaw(KEYS.save);
  removeRaw(KEYS.backup);
  removeRaw(KEYS.checkpoint);
  // A reading position into a transcript that no longer exists is worse than
  // none: it would resolve against whatever entry happens to reuse the id.
  removeRaw(KEYS.reading);
}

/* ------------------------------------------------------------------ *
 * Preferences — stored apart from story progress, so switching input
 * mode or restarting the chapter never touches the other.
 * ------------------------------------------------------------------ */

export type InputMode = 'type' | 'select';

export interface Prefs {
  inputMode: InputMode;
  /** Larger body text for comfort, independent of browser zoom. */
  largeText: boolean;
  /**
   * Whether the subtitle and objective are expanded under the location.
   * Collapsed by default: those two lines are worth about two lines of story,
   * and the objective is repeated in the transcript whenever it changes.
   */
  showStatus: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  inputMode: 'select',
  largeText: false,
  showStatus: false,
};

export function readPrefs(): Prefs {
  const raw = readRaw(KEYS.prefs);
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_PREFS };
    const record = parsed as Record<string, unknown>;
    return {
      inputMode: record.inputMode === 'type' || record.inputMode === 'select'
        ? record.inputMode
        : DEFAULT_PREFS.inputMode,
      largeText: typeof record.largeText === 'boolean' ? record.largeText : false,
      showStatus: typeof record.showStatus === 'boolean' ? record.showStatus : false,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function writePrefs(prefs: Prefs): void {
  writeRaw(KEYS.prefs, JSON.stringify(prefs));
}

/* ------------------------------------------------------------------ *
 * Reading position
 *
 * Kept beside preferences rather than in the save, because it describes the
 * window and not the world. A save stays byte-identical whether the reader
 * scrolled or not, exports do not carry it, and a stale or missing mark
 * degrades to "the start of the last response" instead of breaking anything.
 * ------------------------------------------------------------------ */

export interface ReadingMark {
  /** Transcript entry id the reader was looking at. */
  id: string;
  /** Its offset from the top of the viewport, in CSS pixels. Usually <= 0. */
  offset: number;
  /**
   * The `seq` of the save this was taken from.
   *
   * Entry ids are `t<seq>` and `seq` restarts at zero every new game, so `t3`
   * names a different paragraph in every playthrough. Without this, a mark left
   * by one game resolves cheerfully against another one's `t3` — after an
   * import, a new game, or a checkpoint restart — and opens the reader
   * somewhere plausible and wrong.
   *
   * A mark is rewritten after every action and flushed on `pagehide`, so a
   * genuine reload always matches. Anything else does not, and falls back to
   * the start of the restored transcript's last response.
   */
  seq: number;
}

export function readReadingMark(): ReadingMark | null {
  const raw = readRaw(KEYS.reading);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record.id !== 'string' || record.id === '') return null;
    if (typeof record.offset !== 'number' || !Number.isFinite(record.offset)) return null;
    if (typeof record.seq !== 'number' || !Number.isFinite(record.seq)) return null;
    return { id: record.id, offset: record.offset, seq: record.seq };
  } catch {
    return null;
  }
}

/**
 * Stores the reading position, failing silently.
 *
 * A browser that will not take this write is not worth a warning banner: the
 * reader loses a scroll position on reload, and the save has its own honest
 * reporting for the thing that actually matters.
 */
export function writeReadingMark(mark: ReadingMark): void {
  writeRaw(KEYS.reading, JSON.stringify(mark));
}

export function clearReadingMark(): void {
  removeRaw(KEYS.reading);
}

/* ------------------------------------------------------------------ *
 * Export / import
 * ------------------------------------------------------------------ */

/** Deliberately generic: the filename gives nothing about the story away. */
export const EXPORT_FILENAME = 'adventure-save.json';

export function exportBlob(state: GameState): Blob {
  return new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
}

export function importFromText(
  text: string
): { ok: true; state: GameState } | { ok: false; error: string } {
  if (text.length > MAX_SAVE_BYTES) {
    return {
      ok: false,
      error: `That file is too large to be a save for this story (limit ${MAX_SAVE_BYTES / 1024} KB).`,
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON, so it cannot be a save.' };
  }
  const result = validateSave(parsed, text.length);
  return result.ok ? { ok: true, state: result.state } : { ok: false, error: result.error };
}
