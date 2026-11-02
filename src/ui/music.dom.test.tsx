import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from './App';
import { KEYS } from '../persistence/storage';
import { TRACK_SOURCES } from '../assets/music';
import { FADE_MS } from './soundtrack';

/**
 * The soundtrack, wired to the real shell.
 *
 * `soundtrack.test.ts` proves the controller behaves; this proves the app asks
 * it for the right thing at the right moment. The seam is `globalThis.Audio`,
 * stubbed with a recording fake — jsdom's own audio element throws on `play()`
 * and reports no duration, so there is nothing to observe through it.
 */

interface Spy {
  src: string;
  loop: boolean;
  volume: number;
  plays: number;
  pauses: number;
  cleared: boolean;
}

/*
 * Every element the app built. The format probe (`canPlayType`) makes one and
 * never gives it a source, so "a voice" means one with a source.
 */
let built: Spy[] = [];
const elements = () => built.filter((el) => el.src !== '');
const live = () => elements().filter((el) => !el.cleared);
/** The track name inside whatever URL Vite gave the import. */
const trackOf = (el: Spy) =>
  (Object.entries(TRACK_SOURCES).find(
    ([, s]) => el.src.endsWith(s.webm) || el.src.endsWith(s.mp3)
  ) ?? ['?'])[0];
const playing = () => live().map(trackOf);

class FakeAudio {
  src = '';
  loop = false;
  volume = 1;
  preload = '';
  private spy: Spy;
  constructor() {
    this.spy = { src: '', loop: false, volume: 1, plays: 0, pauses: 0, cleared: false };
    built.push(this.spy);
    // Keep the spy in step with whatever the controller assigns.
    return new Proxy(this, {
      set: (target, key, value) => {
        (target as unknown as Record<string, unknown>)[key as string] = value;
        if (key === 'src') this.spy.src = String(value);
        if (key === 'loop') this.spy.loop = Boolean(value);
        if (key === 'volume') this.spy.volume = Number(value);
        return true;
      },
    });
  }
  canPlayType(type: string) {
    return type.includes('webm') ? 'probably' : 'maybe';
  }
  play() {
    this.spy.plays += 1;
    return Promise.resolve();
  }
  pause() {
    this.spy.pauses += 1;
  }
  load() {}
  removeAttribute() {
    this.spy.cleared = true;
  }
  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
  remove() {}
  hidden = false;
  dataset: Record<string, string> = {};
}

const original = globalThis.Audio;

beforeEach(() => {
  localStorage.clear();
  built = [];
  globalThis.Audio = FakeAudio as unknown as typeof Audio;
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  globalThis.Audio = original;
});

const settle = () => vi.advanceTimersByTime(FADE_MS + 200);

/** Starts a game with music enabled from the title screen's own control. */
async function play(mode: 'select' | 'type' = 'select') {
  const user = (await import('@testing-library/user-event')).default.setup({
    advanceTimers: vi.advanceTimersByTime,
  });
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Enable music' }));
  await user.click(screen.getByRole('button', { name: 'New Game' }));
  if (mode === 'type') {
    await user.click(screen.getByRole('radio', { name: /Type-only/ }));
  }
  await user.click(screen.getByRole('button', { name: 'Play as Basil' }));
  settle();
  return user;
}

describe('the title screen', () => {
  it('plays nothing at all until asked', async () => {
    const user = (await import('@testing-library/user-event')).default.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    render(<App />);
    expect(elements()).toHaveLength(0);
    // Enabling music on the title screen still plays nothing: no track is
    // approved for the title, and this is only the gesture.
    await user.click(screen.getByRole('button', { name: 'Enable music' }));
    settle();
    expect(elements()).toHaveLength(0);
  });

  it('offers the control without blocking the way past it', async () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Enable music' })).toBeTruthy();
    // Both ways into the game are reachable with music untouched.
    expect(screen.getByRole('button', { name: 'New Game' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('plays nothing when the player never asks', async () => {
    const user = (await import('@testing-library/user-event')).default.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'New Game' }));
    await user.click(screen.getByRole('button', { name: 'Play as Basil' }));
    settle();
    expect(elements()).toHaveLength(0);
    // And the game is perfectly playable.
    expect(screen.getByRole('log', { name: 'Story so far' }).textContent).toMatch(/sixteen/);
  });
});

describe('the track follows the place', () => {
  it('starts the present village on arrival, looping and quiet', async () => {
    await play();
    expect(playing()).toEqual(['present_village']);
    expect(live()[0]!.loop).toBe(true);
    expect(live()[0]!.volume).toBeCloseTo(0.25, 2);
  });

  it('keeps playing while the room changes inside one area', async () => {
    const user = await play();
    const panel = () => within(screen.getByRole('region', { name: 'Actions' }));
    await user.click(panel().getByRole('button', { name: /lane down to the square/ }));
    settle();
    // home -> square is one area: the same element, never replayed.
    expect(elements()).toHaveLength(1);
    expect(live()[0]!.plays).toBe(1);
  });

  it('crossfades at the cave mouth, with two sources and then one', async () => {
    const user = await play('type');
    const field = screen.getByLabelText('What do you do?');
    // Home, square, and up the hill: all one area, so one track all the way.
    for (const line of ['take lantern', 'down', 'west']) {
      await user.clear(field);
      await user.type(field, `${line}{Enter}`);
    }
    settle();
    expect(playing()).toEqual(['present_village']);
    expect(elements()).toHaveLength(1);

    // Into the mouth: the cave theme takes over.
    await user.clear(field);
    await user.type(field, 'west{Enter}');
    expect(live()).toHaveLength(2);
    expect(playing()).toEqual(['present_village', 'present_cave']);
    settle();
    expect(playing()).toEqual(['present_cave']);
  });
});

describe('the ending', () => {
  /** A finished story, reached through the engine the way a player would. */
  /** On the floor of the sealed chamber, just come back: chapter `return`. */
  async function atTheReturn() {
    const h = await import('../testing/harness');
    const state = h.finishChapterThree(
      h.typeAll(h.begin(), [
        ...h.TO_SEALED,
        ...h.SOLVE_RELIEF,
        ...h.CROSS_FIRST,
        ...h.PAST_TO_SQUARE,
        ...h.SAFFRA_REALISATION,
        'leave',
        ...h.RECITE,
        ...h.FENN_ROUTE,
        ...h.READ_PANEL,
        ...h.GO_FORWARD,
      ])
    ).state;
    // Fail here rather than three assertions later if a route drifts.
    expect(h.hasReturned(state), 'the route reached the return').toBe(true);
    return state;
  }

  async function finishedState() {
    const h = await import('../testing/harness');
    const end = h.finishTheStory(await atTheReturn());
    expect(h.hasFinished(end), 'the route reached the ending').toBe(true);
    return end;
  }

  it('plays the epilogue for a completed save, and keeps it through a review', async () => {
    const { serialize } = await import('../persistence/storage');
    // Writing a finished state as the save is exactly the reload case: a
    // completed game has to select the epilogue, and still ask permission.
    localStorage.setItem(KEYS.save, serialize(await finishedState()));

    const user = (await import('@testing-library/user-event')).default.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Enable music' }));
    expect(elements()).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: /^Continue/ }));
    settle();
    expect(playing()).toEqual(['epilogue']);
    const el = live()[0]!;

    // Reading it again is reading, not replaying: the track carries on.
    await user.click(
      within(screen.getByRole('region', { name: 'Actions' })).getByRole('button', {
        name: 'Read the ending again',
      })
    );
    settle();
    expect(elements()).toHaveLength(1);
    expect(live()[0]).toBe(el);
    expect(el.plays).toBe(1);
  });

  it('crossfades from the confrontation to the epilogue, not from the cave', async () => {
    const { serialize } = await import('../persistence/storage');
    localStorage.setItem(KEYS.save, serialize(await atTheReturn()));

    const user = (await import('@testing-library/user-event')).default.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Enable music' }));
    await user.click(screen.getByRole('button', { name: /^Continue/ }));
    settle();
    // The last chapter's room would otherwise take the present-cave theme.
    expect(playing()).toEqual(['final_boss']);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Settings' })).getByRole('button', {
        name: /Close|Done/,
      })
    );
    settle();
    // Opening and closing settings is not a change of place.
    expect(elements()).toHaveLength(1);
  });
});

describe('settings', () => {
  it('mutes at once and resumes the same track', async () => {
    const user = await play();
    const el = live()[0]!;

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const dialog = () => screen.getByRole('dialog', { name: 'Settings' });
    await user.click(within(dialog()).getByRole('checkbox', { name: 'Music' }));
    expect(live()).toHaveLength(0);
    expect(el.pauses).toBeGreaterThan(0);

    await user.click(within(dialog()).getByRole('checkbox', { name: 'Music' }));
    settle();
    expect(playing()).toEqual(['present_village']);
  });

  it('changes volume live, without restarting', async () => {
    const user = await play();
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    const slider = within(dialog).getByRole('slider', { name: 'Volume' });
    const el = live()[0]!;
    const plays = el.plays;

    // A range input is moved, not typed in: fireEvent sets the value through
    // React's own value tracker, which a raw dispatch does not.
    fireEvent.change(slider, { target: { value: '70' } });
    expect(el.volume).toBeCloseTo(0.7, 2);
    expect(el.plays).toBe(plays);
    expect(within(dialog).getByText('70%')).toBeTruthy();
  });

  it('remembers the preference, and asks for a gesture again on reload', async () => {
    await play();
    expect(JSON.parse(localStorage.getItem(KEYS.prefs)!).music).toBe(true);
    expect(JSON.parse(localStorage.getItem(KEYS.prefs)!).musicVolume).toBe(0.25);
    cleanup();
    built = [];

    // A reload with the preference on. The control says "Music on" because the
    // stored answer is yes, and the track starts from the stored preference —
    // a real browser may still refuse, which the Start music prompt covers.
    render(<App />);
    expect(screen.getByRole('button', { name: 'Music on' })).toBeTruthy();
  });
});

describe('teardown', () => {
  it('stops when the app unmounts', async () => {
    await play();
    expect(live()).toHaveLength(1);
    cleanup();
    expect(live()).toHaveLength(0);
    expect(elements()[0]!.pauses).toBeGreaterThan(0);
  });

  it('does not double up under React development double-invoke', async () => {
    const user = (await import('@testing-library/user-event')).default.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    await user.click(screen.getByRole('button', { name: 'Enable music' }));
    await user.click(screen.getByRole('button', { name: 'New Game' }));
    await user.click(screen.getByRole('button', { name: 'Play as Basil' }));
    settle();
    /*
     * StrictMode mounts, tears down and mounts again. If the first controller
     * were not destroyed, its element would still be playing the same track
     * over the second one's.
     */
    expect(live()).toHaveLength(1);
    expect(playing()).toEqual(['present_village']);
  });
});
