import type {
  ContentEffects,
  GameState,
  ItemId,
  NarrativeEvent,
  ResolveResult,
  TranscriptEntry,
} from './types';
import { MAX_JOURNAL, MAX_TRANSCRIPT } from './types';

/**
 * Shared engine mechanics.
 *
 * The small operations every action and every puzzle needs: cloning a state,
 * noticing a thing, recording a journal line, committing narrative events to
 * the transcript, and moving items about. They live here so that a puzzle
 * module can use them without importing the reducer, which would be circular.
 *
 * Nothing in this file knows about any particular puzzle, room or item.
 */

/** A state being built up during one action. Still a plain GameState. */
export type Draft = GameState;

/** Reads a flag as a boolean. */
export const flag = (state: GameState, key: string): boolean => Boolean(state.flags[key]);

export function clone(state: GameState): Draft {
  return structuredClone(state);
}

export function discover(draft: Draft, ids: string[]): void {
  for (const id of ids) {
    if (!draft.discovered.includes(id)) draft.discovered.push(id);
  }
}

export function addJournal(draft: Draft, entries: Array<{ id: string; text: string }>): string[] {
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
export function applyEffects(draft: Draft, effects: ContentEffects | undefined): string[] {
  if (!effects) return [];
  if (effects.flags) {
    for (const [key, value] of Object.entries(effects.flags)) {
      draft.flags[key] = value;
    }
  }
  if (effects.reveals) discover(draft, effects.reveals);
  return effects.journal ? addJournal(draft, effects.journal) : [];
}

export function setObjective(draft: Draft, objective: string, events: NarrativeEvent[]): void {
  if (draft.objective === objective) return;
  draft.objective = objective;
  events.push({ kind: 'objective', text: `New objective: ${objective}` });
}

export function journalEvents(lines: string[], events: NarrativeEvent[]): void {
  for (const line of lines) {
    events.push({ kind: 'journal', text: `Journal: ${line}` });
  }
}

export function commit(draft: Draft, events: NarrativeEvent[], accepted: boolean): ResolveResult {
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

export function giveItem(draft: Draft, item: ItemId): void {
  if (!draft.inventory.includes(item)) draft.inventory.push(item);
  draft.placements[item] = { kind: 'carried' };
}

export function removeFromInventory(draft: Draft, item: ItemId): void {
  draft.inventory = draft.inventory.filter((i) => i !== item);
}

export function itemIsIn(state: GameState, item: ItemId, fixtureId: string): boolean {
  const placement = state.placements[item];
  return placement?.kind === 'fixture' && placement.fixtureId === fixtureId;
}
