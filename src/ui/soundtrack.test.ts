import { beforeEach, describe, expect, it } from 'vitest';
import type { TrackId } from '../content/music';
import { DEFAULT_VOLUME, FADE_MS, createSoundtrack } from './soundtrack';
import { pickSources } from '../assets/music';

/**
 * The controller, on a fake audio graph.
 *
 * jsdom has no Web Audio and no decoder, so these tests supply a context —
 * which is better than a real one anyway, because the things worth testing are
 * *how many* sources exist, what their gain ramps were scheduled to do, and
 * what happens when a resume is refused or a decode throws. None of that is
 * visible from outside a real `AudioContext`.
 *
 * Fades are scheduled on `AudioParam`s rather than stepped by a timer, so the
 * assertions are about the schedule: a ramp to 1 for the voice coming in, a
 * ramp to silence and a stop for the one going out, both over `FADE_MS`.
 */

const FADE_S = FADE_MS / 1000;

class FakeParam {
  value = 1;
  readonly schedule: Array<{ kind: string; value: number; at: number }> = [];
  setValueAtTime(value: number, at: number) {
    this.value = value;
    this.schedule.push({ kind: 'set', value, at });
    return this as unknown as AudioParam;
  }
  exponentialRampToValueAtTime(value: number, at: number) {
    this.schedule.push({ kind: 'ramp', value, at });
    return this as unknown as AudioParam;
  }
  cancelScheduledValues(at: number) {
    this.schedule.push({ kind: 'cancel', value: 0, at });
    return this as unknown as AudioParam;
  }
  /** The last ramp target: where the fade is heading. */
  get heading(): number | null {
    const ramps = this.schedule.filter((e) => e.kind === 'ramp');
    return ramps.length === 0 ? null : ramps[ramps.length - 1]!.value;
  }
}

class FakeGain {
  gain = new FakeParam();
  connectedTo: unknown = null;
  connect(node: unknown) {
    this.connectedTo = node;
  }
  disconnect() {}
}

class FakeSource {
  buffer: unknown = null;
  loop = false;
  onended: (() => void) | null = null;
  startedAt: number | null = null;
  stoppedAt: number | null = null;
  connectedTo: unknown = null;
  connect(node: unknown) {
    this.connectedTo = node;
  }
  disconnect() {}
  start(at: number) {
    this.startedAt = at;
  }
  stop(at?: number) {
    if (this.stoppedAt !== null) throw new Error('already stopped');
    this.stoppedAt = at ?? 0;
  }
}

class FakeContext {
  state: AudioContextState = 'suspended';
  currentTime = 10;
  destination = { id: 'destination' };
  readonly sources: FakeSource[] = [];
  readonly gains: FakeGain[] = [];
  resumes = 0;
  suspends = 0;
  closed = false;
  /** Flipped to exercise the autoplay policy. */
  resumeOutcome: 'resolve' | 'reject' = 'resolve';
  createGain() {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain as unknown as GainNode;
  }
  createBufferSource() {
    const source = new FakeSource();
    this.sources.push(source);
    return source as unknown as AudioBufferSourceNode;
  }
  decodeAudioData() {
    return Promise.resolve({ duration: 60, length: 2646000 } as unknown as AudioBuffer);
  }
  resume() {
    this.resumes += 1;
    if (this.resumeOutcome === 'reject') return Promise.reject(new Error('blocked'));
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
    this.state = 'closed';
    return Promise.resolve();
  }
}

let ctx: FakeContext;
let fetched: string[] = [];
let fetchFails = false;

/** The sources that are playing: started, and not yet told to stop. */
const live = () => ctx.sources.filter((s) => s.startedAt !== null && s.stoppedAt === null);
/** The master gain is the first one made, before any voice. */
const masterGain = () => ctx.gains[0]!;
/** Voice gains, in creation order. */
const voiceGains = () => ctx.gains.slice(1);

function deck(overrides: Partial<Parameters<typeof createSoundtrack>[0]> = {}) {
  return createSoundtrack({
    resolve: (track) => [`/${track}.webm`, `/${track}.mp3`],
    createContext: () => ctx as unknown as AudioContext,
    fetchAudio: async (url) => {
      fetched.push(url);
      if (fetchFails) throw new Error('404');
      return new ArrayBuffer(8);
    },
    ...overrides,
  });
}

/** Lets the decode promise chain settle. */
async function settle() {
  for (let i = 0; i < 12; i++) await Promise.resolve();
}

beforeEach(() => {
  ctx = new FakeContext();
  fetched = [];
  fetchFails = false;
});

describe('nothing plays until the player asks', () => {
  it('makes no context, no graph and no request before it is enabled', () => {
    const music = deck();
    music.setTrack('present_village');
    expect(fetched).toEqual([]);
    expect(ctx.sources).toHaveLength(0);
    expect(music.voices()).toBe(0);
  });

  it('starts the track the story already wanted, once enabled', async () => {
    const music = deck();
    music.setTrack('present_village');
    music.enable();
    await settle();
    expect(fetched).toEqual(['/present_village.webm']);
    expect(live()).toHaveLength(1);
    expect(music.current()).toBe('present_village');
  });

  it('resumes the context from inside the gesture', async () => {
    const music = deck();
    music.enable();
    expect(ctx.resumes).toBeGreaterThan(0);
    expect(ctx.state).toBe('running');
    await settle();
    expect(music.isBlocked()).toBe(false);
  });

  it('comes up from silence over the fade, not in at full volume', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();
    const gain = voiceGains()[0]!;
    const start = gain.gain.schedule.find((e) => e.kind === 'set')!;
    const ramp = gain.gain.schedule.find((e) => e.kind === 'ramp')!;
    expect(start.value).toBeLessThan(0.001);
    expect(ramp.value).toBe(1);
    expect(ramp.at - start.at).toBeCloseTo(FADE_S, 5);
  });

  it('loops in the buffer rather than in the container', async () => {
    const music = deck();
    music.enable();
    music.setTrack('epilogue');
    await settle();
    /*
     * The fix for iOS. `AudioBufferSourceNode.loop` is a sample-exact loop
     * over decoded PCM: no media element to stall, no seek at the wrap, and no
     * dependence on a browser honouring `loop` on `audio`.
     */
    expect(live()[0]!.loop).toBe(true);
    expect(live()[0]!.buffer).not.toBeNull();
  });

  it('plays at the quiet default through one master gain', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();
    expect(masterGain().gain.value).toBeCloseTo(DEFAULT_VOLUME, 5);
    expect(masterGain().connectedTo).toBe(ctx.destination);
    expect(voiceGains()[0]!.connectedTo).toBe(masterGain());
  });
});

describe('the same track is never restarted', () => {
  it('ignores a repeat of the track already playing', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_cave');
    await settle();
    for (let i = 0; i < 20; i++) music.setTrack('present_cave');
    await settle();
    expect(ctx.sources).toHaveLength(1);
    expect(fetched).toHaveLength(1);
    expect(music.voices()).toBe(1);
  });

  it('keeps playing when the room changes within one area', async () => {
    const music = deck();
    music.enable();
    music.setTrack('past_village');
    await settle();
    music.setTrack('past_village');
    await settle();
    expect(ctx.sources).toHaveLength(1);
  });
});

describe('crossfading between tracks', () => {
  it('ramps the new one up and the old one out over the same interval', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();
    ctx.currentTime = 30;
    music.setTrack('present_cave');
    await settle();

    const [first, second] = voiceGains();
    expect(second!.gain.heading).toBe(1);
    // Out, to silence, and stopped when it gets there.
    expect(first!.gain.heading).toBeLessThan(0.001);
    expect(ctx.sources[0]!.stoppedAt).toBeCloseTo(30 + FADE_S, 5);
    expect(ctx.sources[1]!.stoppedAt).toBeNull();
  });

  it('settles on one voice, and names it', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();
    music.setTrack('present_cave');
    await settle();
    expect(ctx.sources).toHaveLength(2);
    expect(music.voices()).toBe(1);
    expect(music.current()).toBe('present_cave');
  });

  it('never has more than two voices, however fast the rooms change', async () => {
    const music = deck();
    music.enable();
    const route: TrackId[] = [
      'present_village',
      'present_cave',
      'past_cave',
      'past_village',
      'future_village',
      'future_cave',
      'final_boss',
    ];
    for (const track of route) {
      music.setTrack(track);
      await settle();
      expect(music.voices()).toBeLessThanOrEqual(2);
    }
    expect(music.current()).toBe('final_boss');
  });

  it('drops the work for a room the player has already left', async () => {
    /*
     * The decode is asynchronous, so three doorways in quick succession start
     * three loads. Only the last is still wanted when its buffer arrives; the
     * others must not start a voice nobody asked for.
     */
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    music.setTrack('present_cave');
    music.setTrack('future_cave');
    await settle();
    expect(music.current()).toBe('future_cave');
    expect(music.voices()).toBe(1);
    expect(live()).toHaveLength(1);
  });

  it('holds decoded audio only for what is playing or wanted', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();
    music.setTrack('present_cave');
    await settle();
    music.setTrack('future_cave');
    await settle();
    // A decoded minute is ~10MB; this is bounded on purpose.
    expect(music.cached()).toBeLessThanOrEqual(2);
  });

  it('fetches each track once even when asked twice in a hurry', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    music.setTrack('present_cave');
    music.setTrack('present_village');
    await settle();
    expect(fetched.filter((u) => u.includes('present_village'))).toHaveLength(1);
  });
});

describe('silence', () => {
  it('fades everything out when the story asks for no track', async () => {
    // Returning to the title screen.
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();
    music.setTrack(null);
    expect(music.voices()).toBe(0);
    expect(ctx.sources[0]!.stoppedAt).not.toBeNull();
  });

  it('turning music off stops it at once and keeps the choice of track', async () => {
    const music = deck();
    music.enable();
    music.setTrack('future_cave');
    await settle();
    music.disable();
    expect(music.voices()).toBe(0);
    // Stopped immediately, not faded.
    expect(ctx.sources[0]!.stoppedAt).toBe(0);

    music.enable();
    await settle();
    expect(music.current()).toBe('future_cave');
  });
});

describe('volume', () => {
  it('takes effect immediately on the master, without restarting', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();
    const sources = ctx.sources.length;

    music.setVolume(0.8);
    expect(masterGain().gain.value).toBeCloseTo(0.8, 5);
    music.setVolume(0);
    expect(masterGain().gain.value).toBe(0);
    expect(ctx.sources).toHaveLength(sources);
  });

  it('does not disturb a crossfade in progress', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();
    music.setTrack('present_cave');
    await settle();
    const before = voiceGains().map((g) => g.gain.schedule.length);

    music.setVolume(1);

    // Only the master moved; the per-voice ramps are untouched.
    expect(masterGain().gain.value).toBe(1);
    expect(voiceGains().map((g) => g.gain.schedule.length)).toEqual(before);
  });

  it('refuses a volume that is not a fraction', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();
    music.setVolume(Number.NaN);
    expect(masterGain().gain.value).toBeCloseTo(DEFAULT_VOLUME, 5);
    music.setVolume(5);
    expect(masterGain().gain.value).toBe(1);
    music.setVolume(-2);
    expect(masterGain().gain.value).toBe(0);
  });

  it('applies a volume set before anything is playing', () => {
    const music = deck();
    music.setVolume(0.6);
    music.enable();
    expect(masterGain().gain.value).toBeCloseTo(0.6, 5);
  });
});

describe('a browser that will not play', () => {
  it('reports being blocked when the resume is refused, once', async () => {
    ctx.resumeOutcome = 'reject';
    const blocked: boolean[] = [];
    const music = deck({ onBlockedChange: (b) => blocked.push(b) });
    music.enable();
    music.setTrack('present_village');
    await settle();
    expect(music.isBlocked()).toBe(true);
    expect(blocked).toEqual([true]);
    // Nothing is sounding into a suspended context.
    expect(live()).toHaveLength(0);
  });

  it('clears the blocked flag once a gesture works', async () => {
    ctx.resumeOutcome = 'reject';
    const music = deck();
    music.enable();
    await settle();
    expect(music.isBlocked()).toBe(true);

    ctx.resumeOutcome = 'resolve';
    music.enable();
    await settle();
    expect(music.isBlocked()).toBe(false);
  });

  it('falls through to the other format when the first will not decode', async () => {
    let attempts = 0;
    const music = deck({
      fetchAudio: async (url) => {
        attempts += 1;
        fetched.push(url);
        if (url.endsWith('.webm')) throw new Error('cannot decode');
        return new ArrayBuffer(8);
      },
    });
    music.enable();
    music.setTrack('present_village');
    await settle();
    expect(attempts).toBe(2);
    expect(fetched[1]).toBe('/present_village.mp3');
    expect(music.current()).toBe('present_village');
  });

  it('says so once, not once per track, when nothing will play', async () => {
    const errors: string[] = [];
    const music = deck({ resolve: () => [], onError: (m) => errors.push(m) });
    music.enable();
    for (const track of ['present_village', 'present_cave', 'past_village'] as TrackId[]) {
      music.setTrack(track);
      await settle();
    }
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/cannot play/i);
  });

  it('survives having no audio support at all', async () => {
    const errors: string[] = [];
    const music = deck({ createContext: () => null, onError: (m) => errors.push(m) });
    music.enable();
    music.setTrack('present_village');
    await settle();
    expect(errors).toHaveLength(1);
    expect(music.voices()).toBe(0);
  });

  it('reports a failed fetch once and keeps going', async () => {
    const errors: string[] = [];
    fetchFails = true;
    const music = deck({ onError: (m) => errors.push(m) });
    music.enable();
    music.setTrack('present_village');
    await settle();
    expect(errors).toHaveLength(1);

    fetchFails = false;
    music.setTrack('present_cave');
    await settle();
    expect(music.current()).toBe('present_cave');
    expect(errors).toHaveLength(1);
  });
});

describe('a hidden page', () => {
  it('suspends the context rather than tearing anything down', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();

    music.setPageVisible(false);
    expect(ctx.suspends).toBe(1);
    /*
     * The source is untouched: the context's clock stops where it is, so
     * coming back resumes mid-bar instead of restarting the track.
     */
    expect(ctx.sources[0]!.stoppedAt).toBeNull();
    expect(music.voices()).toBe(1);

    const resumesBefore = ctx.resumes;
    music.setPageVisible(true);
    await settle();
    expect(ctx.resumes).toBe(resumesBefore + 1);
    expect(ctx.sources).toHaveLength(1);
  });

  it('stays silent on return when music has been turned off', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();
    music.setPageVisible(false);
    music.disable();
    const resumes = ctx.resumes;
    music.setPageVisible(true);
    await settle();
    expect(ctx.resumes).toBe(resumes);
    expect(music.voices()).toBe(0);
  });

  it('asks for a gesture again if the resume is refused on return', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();
    music.setPageVisible(false);
    ctx.resumeOutcome = 'reject';
    music.setPageVisible(true);
    await settle();
    expect(music.isBlocked()).toBe(true);
  });

  it('picks up a track the story moved to while the page was away', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();
    music.setPageVisible(false);
    music.setTrack('future_cave');
    await settle();
    music.setPageVisible(true);
    await settle();
    expect(music.current()).toBe('future_cave');
  });

  it('ignores a repeat of the visibility it already has', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();
    music.setPageVisible(true);
    music.setPageVisible(true);
    expect(ctx.suspends).toBe(0);
  });
});

describe('teardown', () => {
  it('stops everything and closes the context', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();
    music.setTrack('present_cave');
    await settle();

    music.destroy();
    expect(music.voices()).toBe(0);
    expect(music.cached()).toBe(0);
    expect(ctx.closed).toBe(true);
    for (const source of ctx.sources) expect(source.stoppedAt).not.toBeNull();
  });

  it('is inert afterwards, so a torn-down controller cannot start playing', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    await settle();
    music.destroy();
    const count = ctx.sources.length;
    music.setTrack('future_cave');
    music.enable();
    music.setPageVisible(true);
    await settle();
    expect(ctx.sources).toHaveLength(count);
    expect(music.voices()).toBe(0);
  });

  it('does not let a decode in flight start a voice after teardown', async () => {
    const music = deck();
    music.enable();
    music.setTrack('present_village');
    music.destroy();
    await settle();
    expect(live()).toHaveLength(0);
    expect(music.voices()).toBe(0);
  });

  it('two controllers in sequence never play over each other', async () => {
    /*
     * React's development double-invoke: mount, cleanup, mount. The first
     * controller must be completely silent before the second starts.
     */
    const first = deck();
    first.enable();
    first.setTrack('present_village');
    await settle();
    first.destroy();

    const firstContext = ctx;
    ctx = new FakeContext();
    const second = deck();
    second.enable();
    second.setTrack('present_village');
    await settle();

    expect(firstContext.closed).toBe(true);
    expect(first.voices()).toBe(0);
    expect(second.voices()).toBe(1);
    expect(live()).toHaveLength(1);
  });
});

describe('choosing a format', () => {
  it('prefers WebM/Opus where it is supported', () => {
    const order = pickSources({ webm: 'a.webm', mp3: 'a.mp3' }, (type) =>
      type.includes('webm') ? 'probably' : 'maybe'
    );
    expect(order[0]).toBe('a.webm');
  });

  it('puts MP3 first on WebKit, which is every browser on iOS', () => {
    // Safari supports neither Vorbis nor Opus in Ogg or WebM.
    const order = pickSources({ webm: 'a.webm', mp3: 'a.mp3' }, (type) =>
      type === 'audio/mpeg' ? 'maybe' : ''
    );
    expect(order).toEqual(['a.mp3']);
  });

  it('tries both rather than giving up when the browser claims neither', () => {
    // `canPlayType` is allowed to be pessimistic; a failed decode costs one
    // request, and silence costs the soundtrack.
    expect(pickSources({ webm: 'a.webm', mp3: 'a.mp3' }, () => '')).toEqual(['a.webm', 'a.mp3']);
  });
});
