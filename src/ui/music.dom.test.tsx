import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from './App';
import { KEYS } from '../persistence/storage';
import { TRACK_SOURCES } from '../assets/music';

/**
 * The soundtrack, wired to the real shell.
 *
 * `soundtrack.test.ts` proves the controller behaves; this proves the app asks
 * it for the right thing at the right moment. The seam is `globalThis.Audio`,
 * stubbed with a recording fake — jsdom's own audio element throws on `play()`
 * and reports no duration, so there is nothing to observe through it.
 */

interface StartedSource {
  url: string;
  loop: boolean;
  stopped: boolean;
}

/**
 * A fake audio graph and a fake network.
 *
 * jsdom has neither Web Audio nor a decoder, so the app is given a context it
 * can drive and a `fetch` that hands back a buffer tagged with the URL it came
 * from — which is how a test can say "the present village is playing" without
 * a sound card.
 */
let started: StartedSource[] = [];
let fetched: string[] = [];
let contexts: FakeContext[] = [];
let masterValue = () => contexts.at(-1)?.master?.gain.value ?? null;

const live = () => started.filter((s) => !s.stopped);
const trackOf = (url: string) =>
  (Object.entries(TRACK_SOURCES).find(([, s]) => url.endsWith(s.webm) || url.endsWith(s.mp3)) ?? [
    '?',
  ])[0];
const playing = () => live().map((s) => trackOf(s.url));

/** Buffers carry the URL they were decoded from. */
const bufferUrls = new Map<ArrayBuffer, string>();

class FakeParam {
  value = 1;
  setValueAtTime(v: number) {
    this.value = v;
    return this;
  }
  exponentialRampToValueAtTime() {
    return this;
  }
  cancelScheduledValues() {
    return this;
  }
}

class FakeGain {
  gain = new FakeParam();
  connect() {}
  disconnect() {}
}

class FakeContext {
  state = 'suspended';
  currentTime = 0;
  destination = {};
  master: FakeGain | null = null;
  closed = false;
  suspends = 0;
  constructor() {
    contexts.push(this);
  }
  createGain() {
    const gain = new FakeGain();
    // The first gain made is the master.
    this.master ??= gain;
    return gain;
  }
  createBufferSource() {
    const record: StartedSource = { url: '', loop: false, stopped: false };
    return {
      set buffer(value: { url?: string } | null) {
        record.url = value?.url ?? '';
      },
      get buffer() {
        return { url: record.url };
      },
      set loop(value: boolean) {
        record.loop = value;
      },
      get loop() {
        return record.loop;
      },
      onended: null,
      connect() {},
      disconnect() {},
      start() {
        started.push(record);
      },
      stop() {
        record.stopped = true;
      },
    };
  }
  decodeAudioData(bytes: ArrayBuffer) {
    return Promise.resolve({ url: bufferUrls.get(bytes) ?? '', duration: 60 });
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  suspend() {
    this.suspends += 1;
    this.state = 'suspended';
    return Promise.resolve();
  }
  close() {
    this.closed = true;
    return Promise.resolve();
  }
}

const originalContext = (globalThis as Record<string, unknown>).AudioContext;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  localStorage.clear();
  started = [];
  fetched = [];
  contexts = [];
  bufferUrls.clear();
  (globalThis as Record<string, unknown>).AudioContext = FakeContext;
  globalThis.fetch = (async (input: string) => {
    const url = String(input);
    fetched.push(url);
    const bytes = new ArrayBuffer(8);
    bufferUrls.set(bytes, url);
    return { ok: true, arrayBuffer: async () => bytes } as unknown as Response;
  }) as typeof fetch;
});

afterEach(() => {
  cleanup();
  (globalThis as Record<string, unknown>).AudioContext = originalContext;
  globalThis.fetch = originalFetch;
});

/** Lets the fetch-and-decode chain settle. */
async function settle() {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

/** Starts a game with music enabled from the title screen's own control. */
async function play(mode: 'select' | 'type' = 'select') {
  const user = (await import('@testing-library/user-event')).default.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Enable music' }));
  await user.click(screen.getByRole('button', { name: 'New Game' }));
  if (mode === 'type') {
    await user.click(screen.getByRole('radio', { name: /Type-only/ }));
  }
  await user.click(screen.getByRole('button', { name: 'Play as Basil' }));
  await settle();
  return user;
}

describe('the title screen', () => {
  it('plays nothing at all until asked', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    render(<App />);
    expect(started).toHaveLength(0);
    // Enabling music on the title screen still plays nothing: no track is
    // approved for the title, and this is only the gesture.
    await user.click(screen.getByRole('button', { name: 'Enable music' }));
    await settle();
    expect(started).toHaveLength(0);
  });

  it('offers the control without blocking the way past it', async () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Enable music' })).toBeTruthy();
    // Both ways into the game are reachable with music untouched.
    expect(screen.getByRole('button', { name: 'New Game' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('plays nothing when the player never asks', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'New Game' }));
    await user.click(screen.getByRole('button', { name: 'Play as Basil' }));
    await settle();
    expect(started).toHaveLength(0);
    // And the game is perfectly playable.
    expect(screen.getByRole('log', { name: 'Story so far' }).textContent).toMatch(/sixteen/);
  });
});

describe('the track follows the place', () => {
  it('starts the present village on arrival, looping and quiet', async () => {
    await play();
    expect(playing()).toEqual(['present_village']);
    expect(live()[0]!.loop).toBe(true);
    expect(masterValue()).toBeCloseTo(0.25, 2);
  });

  it('keeps playing while the room changes inside one area', async () => {
    const user = await play();
    const panel = () => within(screen.getByRole('region', { name: 'Actions' }));
    await user.click(panel().getByRole('button', { name: /lane down to the square/ }));
    await settle();
    // home -> square is one area: the same source, never restarted.
    expect(started).toHaveLength(1);
    expect(fetched).toHaveLength(1);
  });

  it('crossfades at the cave mouth, with two sources and then one', async () => {
    const user = await play('type');
    const field = screen.getByLabelText('What do you do?');
    // Home, square, and up the hill: all one area, so one track all the way.
    for (const line of ['take lantern', 'down', 'west']) {
      await user.clear(field);
      await user.type(field, `${line}{Enter}`);
    }
    await settle();
    expect(playing()).toEqual(['present_village']);
    expect(started).toHaveLength(1);

    // Into the mouth: the cave theme takes over.
    await user.clear(field);
    await user.type(field, 'west{Enter}');
    expect(playing()).toEqual(['present_cave']);
    expect(started).toHaveLength(2);
    // The outgoing one was told to stop when its ramp lands.
    expect(started[0]!.stopped).toBe(true);
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

    const user = (await import('@testing-library/user-event')).default.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Enable music' }));
    expect(started).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: /^Continue/ }));
    await settle();
    expect(playing()).toEqual(['epilogue']);
    const source = live()[0]!;

    // Reading it again is reading, not replaying: the track carries on.
    await user.click(
      within(screen.getByRole('region', { name: 'Actions' })).getByRole('button', {
        name: 'Read the ending again',
      })
    );
    await settle();
    expect(started).toHaveLength(1);
    expect(live()[0]).toBe(source);
    expect(fetched).toHaveLength(1);
  });

  it('crossfades from the confrontation to the epilogue, not from the cave', async () => {
    const { serialize } = await import('../persistence/storage');
    localStorage.setItem(KEYS.save, serialize(await atTheReturn()));

    const user = (await import('@testing-library/user-event')).default.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Enable music' }));
    await user.click(screen.getByRole('button', { name: /^Continue/ }));
    await settle();
    // The last chapter's room would otherwise take the present-cave theme.
    expect(playing()).toEqual(['final_boss']);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Settings' })).getByRole('button', {
        name: /Close|Done/,
      })
    );
    await settle();
    // Opening and closing settings is not a change of place.
    expect(started).toHaveLength(1);
  });
});

describe('settings', () => {
  it('mutes at once and resumes the same track', async () => {
    const user = await play();
    const source = live()[0]!;

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const dialog = () => screen.getByRole('dialog', { name: 'Settings' });
    await user.click(within(dialog()).getByRole('checkbox', { name: 'Music' }));
    expect(live()).toHaveLength(0);
    expect(source.stopped).toBe(true);

    await user.click(within(dialog()).getByRole('checkbox', { name: 'Music' }));
    await settle();
    expect(playing()).toEqual(['present_village']);
  });

  it('changes volume live, without restarting', async () => {
    const user = await play();
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    const slider = within(dialog).getByRole('slider', { name: 'Volume' });
    const sources = started.length;

    // A range input is moved, not typed in: fireEvent sets the value through
    // React's own value tracker, which a raw dispatch does not.
    fireEvent.change(slider, { target: { value: '70' } });
    // One master gain, so nothing restarts.
    expect(masterValue()).toBeCloseTo(0.7, 2);
    expect(started).toHaveLength(sources);
    expect(within(dialog).getByText('70%')).toBeTruthy();
  });

  it('remembers the preference, and asks for a gesture again on reload', async () => {
    await play();
    expect(JSON.parse(localStorage.getItem(KEYS.prefs)!).music).toBe(true);
    expect(JSON.parse(localStorage.getItem(KEYS.prefs)!).musicVolume).toBe(0.25);
    cleanup();
    started = [];

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
    expect(started[0]!.stopped).toBe(true);
    expect(contexts.at(-1)!.closed).toBe(true);
  });

  it('does not double up under React development double-invoke', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    await user.click(screen.getByRole('button', { name: 'Enable music' }));
    await user.click(screen.getByRole('button', { name: 'New Game' }));
    await user.click(screen.getByRole('button', { name: 'Play as Basil' }));
    await settle();
    /*
     * StrictMode mounts, tears down and mounts again. If the first controller
     * were not destroyed, its element would still be playing the same track
     * over the second one's.
     */
    expect(live()).toHaveLength(1);
    expect(playing()).toEqual(['present_village']);
  });
});
