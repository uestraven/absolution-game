import { describe, expect, it } from 'vitest';
import { ALL_LOCATION_IDS, LOCATIONS } from './locations';
import { OBJECTS, OBJECTS_BY_LOCATION } from './objects';
import { PEOPLE } from './dialogue';
import { ALL_FLAG_KEYS, FLAGS } from './flags';
import { begin } from '../testing/harness';
import { eraOf } from '../engine/reducer';
import type { GameState, LocationId } from '../engine/types';

const state = begin();

/** The map as the brief specifies it, with directions where geography allows. */
const EXPECTED_CONNECTIONS: Array<[LocationId, LocationId]> = [
  ['present.home', 'present.square'],
  ['present.square', 'present.workshop'],
  ['present.square', 'present.cave_path'],
  ['present.cave_path', 'present.entrance'],
  ['present.entrance', 'present.outer_gallery'],
  ['present.outer_gallery', 'present.echo_chamber'],
  ['present.outer_gallery', 'present.sealed_chamber'],
  ['present.sealed_chamber', 'present.deep_chamber'],
  ['past.deep_chamber', 'past.entrance'],
  ['past.entrance', 'past.square'],
];

function exitsFrom(id: LocationId) {
  return LOCATIONS[id].exits;
}

describe('the map', () => {
  it('has every location the brief lists, and no duplicates', () => {
    expect(ALL_LOCATION_IDS.sort()).toEqual(
      [
        'past.deep_chamber',
        'past.entrance',
        'past.square',
        'present.cave_path',
        'present.deep_chamber',
        'present.echo_chamber',
        'present.entrance',
        'present.home',
        'present.outer_gallery',
        'present.sealed_chamber',
        'present.square',
        'present.workshop',
      ].sort()
    );
  });

  it('keeps each location in the era its id claims', () => {
    for (const id of ALL_LOCATION_IDS) {
      expect(LOCATIONS[id].era, id).toBe(eraOf(id));
    }
  });

  it('connects exactly the pairs the brief specifies', () => {
    const pairs = new Set<string>();
    for (const id of ALL_LOCATION_IDS) {
      for (const exit of exitsFrom(id)) {
        pairs.add([id, exit.to].sort().join('|'));
      }
    }
    const expected = new Set(EXPECTED_CONNECTIONS.map((p) => [...p].sort().join('|')));
    expect([...pairs].sort()).toEqual([...expected].sort());
  });

  it('has a consistent reverse route for every exit', () => {
    for (const id of ALL_LOCATION_IDS) {
      for (const exit of exitsFrom(id)) {
        const back = exitsFrom(exit.to).some((e) => e.to === id);
        expect(back, `${id} -> ${exit.to} has no way back`).toBe(true);
      }
    }
  });

  it('gives each exit a unique id and unambiguous direction within its room', () => {
    for (const id of ALL_LOCATION_IDS) {
      const exits = exitsFrom(id);
      const ids = exits.map((e) => e.id);
      expect(new Set(ids).size, id).toBe(ids.length);
      const directions = exits.map((e) => e.direction).filter(Boolean);
      expect(new Set(directions).size, id).toBe(directions.length);
    }
  });

  it('gates only the deep passage, and gates it on the puzzle', () => {
    const gated: string[] = [];
    for (const id of ALL_LOCATION_IDS) {
      for (const exit of exitsFrom(id)) {
        if (exit.requires) gated.push(`${id}:${exit.id}`);
      }
    }
    expect(gated).toEqual(['present.sealed_chamber:to_deep']);

    const exit = exitsFrom('present.sealed_chamber').find((e) => e.id === 'to_deep')!;
    expect(exit.requires!(state)).toBe(false);
    const solved: GameState = { ...state, flags: { [FLAGS.passageOpen]: true } };
    expect(exit.requires!(solved)).toBe(true);
  });
});

describe('objects and people', () => {
  it('give every object a unique id and at least one noun', () => {
    const ids = Object.keys(OBJECTS);
    expect(new Set(ids).size).toBe(ids.length);
    for (const def of Object.values(OBJECTS)) {
      expect(def.nouns.length, def.id).toBeGreaterThan(0);
      expect(def.name.length, def.id).toBeGreaterThan(0);
    }
  });

  it('place every object and person in a location that exists', () => {
    for (const def of Object.values(OBJECTS)) {
      expect(ALL_LOCATION_IDS, def.id).toContain(def.locationId);
    }
    for (const person of Object.values(PEOPLE)) {
      expect(ALL_LOCATION_IDS, person.id).toContain(person.locationId);
    }
  });

  it('avoid two objects in one room answering to the same single noun unintentionally', () => {
    // Ambiguity is allowed, but it must be deliberate: anything shared here is
    // listed, so a new content edit cannot introduce one silently.
    const deliberate = new Set(['stone']);
    for (const [locationId, defs] of Object.entries(OBJECTS_BY_LOCATION)) {
      const counts = new Map<string, string[]>();
      for (const def of defs) {
        for (const noun of def.nouns) {
          counts.set(noun, [...(counts.get(noun) ?? []), def.id]);
        }
      }
      for (const [noun, owners] of counts) {
        if (owners.length > 1 && !deliberate.has(noun)) {
          throw new Error(`"${noun}" is shared in ${locationId} by ${owners.join(', ')}`);
        }
      }
    }
  });

  it('only reveal object ids that exist', () => {
    for (const def of Object.values(OBJECTS)) {
      for (const id of def.onExamine?.reveals ?? []) {
        expect(OBJECTS[id], `${def.id} reveals ${id}`).toBeDefined();
      }
    }
    for (const person of Object.values(PEOPLE)) {
      for (const topic of person.topics) {
        for (const id of topic.effects?.reveals ?? []) {
          expect(OBJECTS[id], `${person.id}/${topic.id} reveals ${id}`).toBeDefined();
        }
      }
    }
  });

  it('only set flags that are declared', () => {
    for (const def of Object.values(OBJECTS)) {
      for (const key of Object.keys(def.onExamine?.flags ?? {})) {
        expect(ALL_FLAG_KEYS, `${def.id} sets ${key}`).toContain(key);
      }
    }
    for (const person of Object.values(PEOPLE)) {
      for (const topic of person.topics) {
        for (const key of Object.keys(topic.effects?.flags ?? {})) {
          expect(ALL_FLAG_KEYS, `${person.id}/${topic.id} sets ${key}`).toContain(key);
        }
      }
    }
  });

  it('keeps journal ids consistent: the same id always means the same text', () => {
    const texts = new Map<string, string>();
    const record = (id: string, text: string, where: string) => {
      const seen = texts.get(id);
      if (seen !== undefined) {
        expect(text, `${id} differs at ${where}`).toBe(seen);
      } else {
        texts.set(id, text);
      }
    };
    for (const def of Object.values(OBJECTS)) {
      for (const entry of def.onExamine?.journal ?? []) record(entry.id, entry.text, def.id);
    }
    for (const person of Object.values(PEOPLE)) {
      for (const topic of person.topics) {
        for (const entry of topic.effects?.journal ?? []) {
          record(entry.id, entry.text, `${person.id}/${topic.id}`);
        }
      }
    }
  });

  it('gives every topic a label and a non-trivial response', () => {
    for (const person of Object.values(PEOPLE)) {
      expect(person.topics.length, person.id).toBeGreaterThan(0);
      const ids = person.topics.map((t) => t.id);
      expect(new Set(ids).size, person.id).toBe(ids.length);
      for (const topic of person.topics) {
        expect(topic.label.length, `${person.id}/${topic.id}`).toBeGreaterThan(2);
        expect(topic.response(state).length, `${person.id}/${topic.id}`).toBeGreaterThan(80);
      }
    }
  });

  it('has real authored prose everywhere, with no placeholder copy', () => {
    const banned = /coming soon|TODO|TBD|lorem ipsum|placeholder|\[.*\]/i;
    for (const def of Object.values(LOCATIONS)) {
      const text = def.description(state);
      expect(text.length, def.id).toBeGreaterThan(200);
      expect(text, def.id).not.toMatch(banned);
    }
    for (const def of Object.values(OBJECTS)) {
      const text = def.description(state);
      expect(text.length, def.id).toBeGreaterThan(80);
      expect(text, def.id).not.toMatch(banned);
    }
  });
});

/** Every string the player can read, paired with where it came from. */
function allPlayerText(): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const def of Object.values(LOCATIONS)) {
    out.push([`${def.id}/description`, def.description(state)]);
    out.push([`${def.id}/subtitle`, def.subtitle(state)]);
    if (def.firstVisit) out.push([`${def.id}/firstVisit`, def.firstVisit(state)]);
  }
  for (const def of Object.values(OBJECTS)) {
    out.push([`${def.id}/description`, def.description(state)]);
    out.push([`${def.id}/name`, def.name]);
    for (const entry of def.onExamine?.journal ?? []) out.push([entry.id, entry.text]);
  }
  for (const person of Object.values(PEOPLE)) {
    out.push([`${person.id}/greeting`, person.greeting(state)]);
    out.push([`${person.id}/appearance`, person.appearance(state)]);
    out.push([`${person.id}/listAs`, person.listAs]);
    for (const topic of person.topics) {
      out.push([`${person.id}/${topic.id}`, topic.response(state)]);
      out.push([`${person.id}/${topic.id}/label`, topic.label]);
      for (const entry of topic.effects?.journal ?? []) out.push([entry.id, entry.text]);
    }
  }
  return out;
}

describe('the naming convention', () => {
  /**
   * The cast is named for herbs and spices. This list is the convention: a new
   * character that does not belong to it fails here on purpose, so the
   * convention cannot drift one name at a time.
   */
  const HERB_NAMES = new Set([
    'Sage',
    'Marjoram',
    'Mint',
    'Parsie',
    'Oreg',
    'Dilly',
    'Bay',
    'Rose and Mary',
    'Tyme',
    'Saffra',
    'Fenn',
  ]);

  /** Named in dialogue but never met. Same convention. */
  const OFFSTAGE = ['Hyssop', 'Nettle', 'Lovage', 'Cress', 'Rose', 'Mary', 'Mint'];

  it('names every character on stage from the herb convention', () => {
    for (const person of Object.values(PEOPLE)) {
      expect(HERB_NAMES, `${person.id} is outside the naming convention`).toContain(person.name);
    }
  });

  it('gives each person an id that matches their name', () => {
    for (const person of Object.values(PEOPLE)) {
      const expected = person.name.toLowerCase().replace(/\s+/g, '_');
      expect(person.id, person.name).toBe(expected);
    }
  });

  it('keeps every offstage name inside the convention too', () => {
    const everything = allPlayerText()
      .map(([, text]) => text)
      .join('\n');
    for (const name of OFFSTAGE) {
      expect(everything, `${name} should be mentioned somewhere`).toContain(name);
    }
    // No survivor of the earlier provisional cast.
    for (const old of ['Orla', 'Marda', 'Hesk', 'Tolv', 'Nessa', 'Aldren', 'Sabra', 'Pell']) {
      expect(everything, `${old} should have been renamed`).not.toMatch(
        new RegExp(`\\b${old}\\b`)
      );
    }
  });

  it('never makes a joke of a name', () => {
    const puns = [
      /rosemary/i,
      /sage advice/i,
      /sage wisdom/i,
      /mint condition/i,
      /in good thyme/i,
      /\bthyme\b/i,
      /parsley/i,
      /herb/i,
      /spice rack/i,
      /well.seasoned/i,
    ];
    for (const [where, text] of allPlayerText()) {
      for (const pun of puns) {
        expect(text, `${where} matches ${pun}`).not.toMatch(pun);
      }
    }
  });

  it('lets the twins register without anyone explaining them', () => {
    const twins = PEOPLE['rose_and_mary']!;
    const theirText = [
      twins.greeting(state),
      twins.appearance(state),
      twins.listAs,
      ...twins.topics.map((t) => t.response(state)),
    ].join('\n');
    // The two names together do the work; nothing points at it.
    expect(twins.name).toBe('Rose and Mary');
    expect(theirText).not.toMatch(/rosemary/i);
    expect(theirText).not.toMatch(/\btwins?\b/i);
    // And they genuinely disagree: both voices in every answer.
    for (const topic of twins.topics) {
      const response = topic.response(state);
      expect(response, `rose_and_mary/${topic.id}`).toMatch(/\bRose\b/);
      expect(response, `rose_and_mary/${topic.id}`).toMatch(/\bMary\b/);
    }
  });

  it('keeps time out of the childhood friend entirely', () => {
    // Tyme must never read as a signal, so their own words avoid the register.
    const tyme = PEOPLE['tyme']!;
    const theirText = [
      tyme.greeting(state),
      tyme.appearance(state),
      tyme.listAs,
      ...tyme.topics.map((t) => t.response(state)),
      ...tyme.topics.map((t) => t.label),
    ].join('\n');
    for (const loaded of [
      /\btimes?\b/i,
      /\btiming\b/i,
      /\bclock\b/i,
      /\bhours?\b/i,
      /\bminutes?\b/i,
      /\byears?\b/i,
      /\bpast\b/i,
      /\bfuture\b/i,
      /\bera\b/i,
      /\bcentury\b/i,
      /\beternit/i,
      /\btemporal\b/i,
      /\bage\b/i,
    ]) {
      expect(theirText, `tyme's dialogue matches ${loaded}`).not.toMatch(loaded);
    }
  });
});

describe('player-facing text keeps the chapter secrets', () => {
  /**
   * Development notes hold the canon. Nothing the player can read in this
   * slice should name the later reveals.
   */
  const FORBIDDEN = [
    /time travel/i,
    /time-travel/i,
    /\bthe past\b.*\byou are\b/i,
    /you are the wanderer/i,
    /lose an eye/i,
    /loses an eye/i,
    /your future self/i,
    /future self/i,
    /paradox/i,
    /evacuat/i,
    /bloodline/i,
    /chosen one/i,
  ];

  it('never names the later reveals', () => {
    for (const [where, text] of allPlayerText()) {
      for (const pattern of FORBIDDEN) {
        expect(text, `${where} matches ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it('never calls the opening era "the present" to the player', () => {
    for (const def of Object.values(LOCATIONS)) {
      expect(def.subtitle(state).toLowerCase(), def.id).not.toContain('present');
      expect(def.subtitle(state).toLowerCase(), def.id).not.toContain('past');
    }
  });
});
