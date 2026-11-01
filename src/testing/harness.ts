import type { GameAction, GameState, ResolveResult } from '../engine/types';
import { resolve, startGame } from '../engine/reducer';
import { parse } from '../engine/parser';
import { activeTopics } from '../engine/selectors';
import type { CharacterId } from '../engine/types';

/** Starts a game and returns the state after the opening. */
export function begin(character: CharacterId = 'basil'): GameState {
  return startGame(character).state;
}

/** Dispatches one typed line, exactly as the type-only UI does. */
export function type(state: GameState, raw: string): ResolveResult {
  const action = parse(raw, {
    topics: state.pending?.kind === 'conversation' ? activeTopics(state) : undefined,
    clarificationLabels:
      state.pending?.kind === 'clarification'
        ? state.pending.options.map((o) => o.label)
        : undefined,
  });
  return resolve(state, action);
}

/** Dispatches a run of typed lines, returning the final state. */
export function typeAll(state: GameState, lines: string[]): GameState {
  return lines.reduce((acc, line) => type(acc, line).state, state);
}

/** Last narrative text produced, joined. */
export function lastText(result: ResolveResult): string {
  return result.events.map((e) => e.text).join('\n');
}

export function act(state: GameState, action: GameAction): ResolveResult {
  return resolve(state, action);
}

/** Everything that is progress, with display-only fields dropped. */
export function progressOf(state: GameState) {
  const { transcript: _transcript, seq: _seq, ...rest } = state;
  return rest;
}
