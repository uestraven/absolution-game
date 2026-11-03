import { describe, expect, it } from 'vitest';
import {
  CROSS_FIRST,
  SOLVE_RELIEF,
  TO_SEALED,
  begin,
  lastText,
  type,
  typeAll,
} from '../testing/harness';
import { getAffordances } from './affordances';
import { parse } from './parser';
import { resolve as resolveNoun } from './selectors';
import { OBJECTS } from '../content/objects';
import { LOCATIONS } from '../content/locations';
import { FLAGS } from '../content/flags';
import { PHYSICAL_VERBS } from './types';
import { stripMarkup } from '../content/markup';
import type { GameState, LocationId } from './types';

/**
 * The interaction contract.
 *
 * Two rules, from the audit that prompted this:
 *
 *  1. A concrete noun the prose puts in a room must resolve in that room.
 *  2. A sensible attempted action must get an answer **that names the thing**.
 *     "You cannot do that here" in a room with a stool in it, and "you cannot
 *     see any dough here" while reading about dough, are both the defect.
 *
 * So these tests check referents and wording, not keyword counts.
 */

const say = (state: GameState, cmd: string) => stripMarkup(lastText(type(state, cmd)));
const home = () => begin();
const square = () => typeAll(begin(), ['take lantern', 'down']);
const pastBasin = () => typeAll(begin(), [...TO_SEALED, ...SOLVE_RELIEF, ...CROSS_FIRST]);

describe('the physical vocabulary exists at all', () => {
  it('parses every verb in the family, with and without its preposition', () => {
    const pairs: Array<[string, string]> = [
      ['eat bread', 'eat'],
      ['bite the bread', 'eat'],
      ['drink water', 'drink'],
      ['drink from the spring', 'drink'],
      ['taste salt', 'taste'],
      ['lick the salt', 'taste'],
      ['touch wall', 'touch'],
      ['feel the wall', 'touch'],
      ['smell bread', 'smell'],
      ['sniff at the bread', 'smell'],
      ['sit on stool', 'sit'],
      ['listen to echo', 'listen'],
      ['untie the laces', 'untie'],
      ['knock on the door', 'knock'],
    ];
    for (const [typed, verb] of pairs) {
      const action = parse(typed);
      expect(action.type, typed).toBe('PHYSICAL');
      if (action.type === 'PHYSICAL') {
        expect(action.verb, typed).toBe(verb);
        expect(action.target.length, typed).toBeGreaterThan(0);
      }
    }
  });

  it('never answers a physical attempt with the unsupported-command line', () => {
    /*
     * The specific regression. `eat bread` used to say "You cannot do that
     * here. HELP lists everything this story understands", which is a claim
     * about the game rather than about the bread.
     */
    for (const verb of PHYSICAL_VERBS) {
      const text = say(home(), `${verb} bread`);
      expect(text, verb).not.toMatch(/cannot do that here/i);
      expect(text, verb).not.toMatch(/HELP lists/i);
    }
  });

  it('names the thing even where nobody authored a response', () => {
    // The floor of the contract: the default lines all mention the object.
    const text = say(home(), 'knock on the lantern');
    expect(text).toMatch(/lantern/);
    expect(say(home(), 'drink the lantern')).toMatch(/lantern/);
  });

  it('still says so plainly when the noun really is not here', () => {
    // Not a licence to invent objects: absence is still an honest answer.
    expect(say(home(), 'eat the goat')).toMatch(/cannot see any goat here/i);
  });

  it('points a physical verb aimed at a person back at talking', () => {
    const text = say(square(), 'touch sage');
    expect(text).toMatch(/TALK TO SAGE/);
  });
});

describe('the bread is food', () => {
  it('can be eaten, once, and says so afterwards', () => {
    const start = home();
    const eaten = type(start, 'eat bread');
    expect(eaten.accepted).toBe(true);
    expect(stripMarkup(lastText(eaten))).toMatch(/you eat it standing up/i);
    expect(eaten.state.flags[FLAGS.ateBread]).toBe(true);

    const again = type(eaten.state, 'eat bread');
    expect(again.accepted).toBe(false);
    expect(stripMarkup(lastText(again))).toMatch(/no more bread/i);
    expect(again.state.journal.filter((e) => e.id === 'j.bread')).toHaveLength(1);
  });

  it('leaves crumbs that can still be examined', () => {
    // Eating must not make the noun vanish: the crumbs are described.
    const after = typeAll(home(), ['eat bread']);
    expect(say(after, 'examine bread')).toMatch(/crumbs/i);
    expect(say(after, 'examine crumbs')).toMatch(/crumbs/i);
  });

  it('is gone from the room description, not just from the object', () => {
    // Rule 4: the room must not keep describing breakfast nobody ate.
    const before = say(home(), 'look');
    expect(before).toMatch(/bread set out on the stool/i);
    const after = say(typeAll(home(), ['eat bread']), 'look');
    expect(after).toMatch(/crumbs on the stool/i);
    expect(after).not.toMatch(/bread set out/i);
  });

  it('survives a reload as eaten', () => {
    const after = typeAll(home(), ['eat bread']);
    expect(after.flags[FLAGS.ateBread]).toBe(true);
    // The flag is the whole of the state, so a round trip keeps it.
    const reloaded = JSON.parse(JSON.stringify(after)) as GameState;
    expect(reloaded.flags[FLAGS.ateBread]).toBe(true);
    expect(say(reloaded, 'examine bread')).toMatch(/crumbs/i);
  });

  it('is offered as a button, so both modes can eat it', () => {
    const chips = getAffordances(home()).objects.find((o) => o.id === 'home.bread');
    expect(chips?.actions.some((a) => a.label === 'Eat it')).toBe(true);
    const eaten = typeAll(home(), ['eat bread']);
    // And is not offered once there is nothing left to eat.
    const after = getAffordances(eaten).objects.find((o) => o.id === 'home.bread');
    expect(after?.actions.some((a) => a.label === 'Eat it')).toBe(false);
  });
});

describe('the stool is not the bread', () => {
  it('has its own description and can be sat on', () => {
    // `stool` used to be an alias on the loaf, so `sit on stool` answered
    // about bread.
    expect(say(home(), 'examine stool')).toMatch(/three legs/i);
    expect(say(home(), 'sit on stool')).toMatch(/you sit down on it/i);
  });
});

describe('the salt and the things around it', () => {
  it('answers to the names a player would use', () => {
    for (const noun of ['salt', 'bowl', 'salt bowl', 'bowl of salt', 'wooden bowl']) {
      expect(say(square(), `examine ${noun}`), noun).toMatch(/coarse grey salt/i);
    }
  });

  it('can be tasted, and explains why it stays where it is', () => {
    expect(say(square(), 'taste salt')).toMatch(/taste salt, which is what it is/i);
    const refused = type(square(), 'take salt');
    expect(refused.accepted).toBe(false);
    expect(stripMarkup(lastText(refused))).toMatch(/Sage put it there/i);
    expect(stripMarkup(lastText(refused))).not.toMatch(/not something you can carry off/i);
  });

  it('gives the well-cap its own answers instead of describing the bowl', () => {
    // `well cap` used to resolve to the bowl standing on it.
    const cap = say(square(), 'examine well cap');
    expect(cap).toMatch(/lifting notch/i);
    expect(cap).not.toMatch(/coarse grey salt/i);
    expect(say(square(), 'examine well-cap')).toMatch(/lifting notch/i);
    expect(say(square(), 'pull the cap')).toMatch(/what it weighs/i);
  });

  it("answers for Marjoram's dough, which she is standing over", () => {
    const here = square();
    expect(say(here, 'examine dough')).toMatch(/floured board/i);
    expect(say(here, 'touch dough')).toMatch(/catches your wrist/i);
    expect(say(here, 'eat dough')).toMatch(/It is raw/i);
    expect(say(here, 'take dough')).toMatch(/tomorrow's/i);
  });
});

describe('the offerings in the basin', () => {
  it('can be examined in the century they were left', () => {
    const here = pastBasin();
    expect(say(here, 'examine coins')).toMatch(/two of them, in the silt/i);
    expect(say(here, 'examine coin')).toMatch(/two of them/i);
    expect(say(here, 'examine bone pin')).toMatch(/hand's length of bone/i);
    expect(say(here, 'examine pin')).toMatch(/bone/i);
    expect(say(here, 'examine silt')).toMatch(/fine pale dust/i);
  });

  it('refuses to be pocketed, in character rather than generically', () => {
    const here = pastBasin();
    const coins = type(here, 'take coins');
    expect(coins.accepted).toBe(false);
    expect(stripMarkup(lastText(coins))).toMatch(/down an unfinished stair/i);
    expect(stripMarkup(lastText(coins))).not.toMatch(/not something you can carry off/i);
    expect(stripMarkup(lastText(type(here, 'take pin')))).toMatch(/not yours/i);
    // And nothing enters the inventory, in either case.
    expect(coins.state.inventory).toEqual(here.inventory);
  });

  it('can be touched, with an answer about the thing touched', () => {
    expect(say(pastBasin(), 'touch coins')).toMatch(/turn the face-up one over/i);
    expect(say(pastBasin(), 'touch pin')).toMatch(/smooth/i);
  });
});

describe('listening', () => {
  it('answers a bare LISTEN with something about this room', () => {
    const text = say(square(), 'listen');
    expect(text).toMatch(/hammer/i);
    expect(text).not.toMatch(/cannot see/i);
  });

  it('says something different in a room named for its sound', () => {
    const here = { ...begin(), locationId: 'present.echo_chamber' as LocationId };
    expect(say(here, 'listen')).toMatch(/comes back to you as somebody else/i);
  });

  it('has an answer everywhere, even where nothing was authored', () => {
    for (const id of Object.keys(LOCATIONS) as LocationId[]) {
      const here = { ...begin(), locationId: id };
      const text = say(here, 'listen');
      expect(text.length, id).toBeGreaterThan(20);
      expect(text, id).not.toMatch(/cannot see|cannot do that/i);
    }
  });
});

describe('the resolver does not guess', () => {
  it('no longer answers a noun with an unrelated substring match', () => {
    /*
     * The verified defect: `examine oil` in the worksite returned the
     * description of the gap back to the basin chamber, because `oil` is a
     * substring of that exit's alias `spoil`.
     */
    const worksite = { ...begin(), locationId: 'past.worksite' as LocationId, era: 'past' as const };
    const refs = resolveNoun(worksite, 'oil');
    expect(refs.map((r) => r.id)).not.toContain('to_deep');
  });

  it('matches whole words across a hyphen, in both spellings', () => {
    const here = square();
    expect(resolveNoun(here, 'well cap').map((r) => r.id)).toEqual(['square.wellcap']);
    expect(resolveNoun(here, 'well-cap').map((r) => r.id)).toEqual(['square.wellcap']);
  });

  it('still resolves every visible object by its own id, which is how buttons work', () => {
    // The ids contain full stops, so normalisation must leave those alone.
    const here = home();
    for (const def of Object.values(OBJECTS)) {
      if (def.locationId !== here.locationId) continue;
      // Things found by examining something else are not addressable yet, by
      // design; the discovery gate is the engine's and not the matcher's.
      if (!here.discovered.includes(def.id)) continue;
      expect(resolveNoun(here, def.id).map((r) => r.id), def.id).toContain(def.id);
    }
  });
});

describe('every authored response is reachable', () => {
  /*
   * The two-modes rule for the new family, checked as an invariant on the
   * content rather than through a synthetic game state: an authored response
   * selectable mode cannot reach is half-implemented, and a button that falls
   * through to a default line is a button promising writing that is not there.
   */
  it('only authors verbs the family actually has', () => {
    for (const def of Object.values(OBJECTS)) {
      for (const verb of Object.keys(def.responses ?? {})) {
        expect(PHYSICAL_VERBS, `${def.id}.${verb}`).toContain(verb);
      }
    }
  });

  it('never offers a physical button with no authored response behind it', () => {
    const states: GameState[] = [begin(), typeAll(begin(), ['eat bread'])];
    for (const def of Object.values(OBJECTS)) {
      for (const state of states) {
        for (const verb of def.verbs?.(state) ?? []) {
          if (!(PHYSICAL_VERBS as readonly string[]).includes(verb)) continue;
          expect(def.responses?.[verb as (typeof PHYSICAL_VERBS)[number]], `${def.id}.${verb}`).toBeDefined();
        }
      }
    }
  });

  it('maps a physical button to the same action the typed verb produces', () => {
    const chips = getAffordances(home()).objects.find((o) => o.id === 'home.stool');
    const sit = chips?.actions.find((a) => a.label === 'Sit on it');
    expect(sit?.action).toEqual({ type: 'PHYSICAL', verb: 'sit', target: 'home.stool' });
    expect(parse('sit on stool')).toEqual({ type: 'PHYSICAL', verb: 'sit', target: 'stool' });
  });
});
