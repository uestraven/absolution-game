import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { KEYS } from '../persistence/storage';

/**
 * One user action must commit once.
 *
 * React deliberately double-invokes render functions and state updaters in
 * StrictMode to surface impure calculations. When persistence lived inside a
 * `setState` updater, that meant two writes and two backup rotations per
 * action. These tests pin the fix to the behaviour a player would notice:
 * one command, one transcript line, one save.
 */

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

async function startStrict(mode: 'type' | 'select') {
  const user = userEvent.setup();
  render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  await user.click(screen.getByRole('button', { name: 'New Game' }));
  if (mode === 'type') {
    await user.click(screen.getByRole('radio', { name: /Type-only/ }));
  }
  await user.click(screen.getByRole('button', { name: 'Play as Basil' }));
  return user;
}

describe('under StrictMode', () => {
  it('records one transcript entry per typed command', async () => {
    const user = await startStrict('type');
    const field = screen.getByLabelText('What do you do?');
    await user.type(field, 'take lantern{Enter}');

    const log = screen.getByRole('log', { name: 'Story so far' });
    expect(within(log).getAllByText('take lantern')).toHaveLength(1);
    const stored = JSON.parse(localStorage.getItem(KEYS.save)!);
    const echoes = stored.transcript.filter(
      (e: { kind: string; text: string }) => e.kind === 'command' && e.text === 'take lantern'
    );
    expect(echoes).toHaveLength(1);
    // And the action itself ran once: one lantern, one turn.
    expect(stored.inventory).toEqual(['lantern']);
    expect(stored.turn).toBe(1);
  });

  it('writes the save once per action', async () => {
    const writes: string[] = [];
    const real = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string
    ) {
      writes.push(key);
      real.call(this, key, value);
    });

    const user = await startStrict('type');
    writes.length = 0;

    await user.type(screen.getByLabelText('What do you do?'), 'look{Enter}');
    const saveWrites = writes.filter((k) => k === KEYS.save);
    expect(saveWrites).toHaveLength(1);
    // And nothing rotated the backup twice off one action.
    expect(writes.filter((k) => k === KEYS.backup).length).toBeLessThanOrEqual(1);
  });

  it('does not rotate the backup more than once per action', async () => {
    const user = await startStrict('type');
    const field = screen.getByLabelText('What do you do?');
    await user.type(field, 'take lantern{Enter}');
    await user.type(field, 'look{Enter}');

    // The backup holds the state from exactly one action ago, not two.
    const backup = JSON.parse(localStorage.getItem(KEYS.backup)!);
    const save = JSON.parse(localStorage.getItem(KEYS.save)!);
    expect(save.turn).toBe(1);
    expect(backup.turn).toBe(1);
    expect(backup.inventory).toEqual(['lantern']);
  });

  it('keeps rapid consecutive commands in order and against fresh state', async () => {
    const user = await startStrict('type');
    const field = screen.getByLabelText('What do you do?');
    // Four commands with no waiting in between; the third depends on the
    // second having already been applied.
    await user.type(field, 'take lantern{Enter}');
    await user.type(field, 'down{Enter}');
    await user.type(field, 'east{Enter}');
    await user.type(field, 'take wedge{Enter}');

    const stored = JSON.parse(localStorage.getItem(KEYS.save)!);
    expect(stored.locationId).toBe('present.workshop');
    expect(stored.inventory).toEqual(['lantern', 'wedge']);
    expect(stored.turn).toBe(4);

    const commands = stored.transcript
      .filter((e: { kind: string }) => e.kind === 'command')
      .map((e: { text: string }) => e.text);
    expect(commands).toEqual(['take lantern', 'down', 'east', 'take wedge']);
  });

  it('commits one action per click in selectable mode', async () => {
    const user = await startStrict('select');
    const panel = () => within(screen.getByRole('region', { name: 'Actions' }));
    await user.click(panel().getByRole('button', { name: /hooded lantern/ }));
    await user.click(panel().getByRole('button', { name: 'Take' }));

    const stored = JSON.parse(localStorage.getItem(KEYS.save)!);
    expect(stored.inventory).toEqual(['lantern']);
    expect(stored.turn).toBe(1);
    const log = screen.getByRole('log', { name: 'Story so far' });
    expect(within(log).getAllByText(/lift the lantern off the sill/)).toHaveLength(1);
  });
});
