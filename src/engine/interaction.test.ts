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
import { FLAGS, FLAG_TYPES } from '../content/flags';
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

/* ================================================================ *
 * Tier two: the puzzle-adjacent objects
 *
 * The audit singled these out because a player is most likely to read them as
 * clues or as alternative solutions. So the tests check two things at once:
 * that the noun answers, and that the answer does not open a door.
 * ================================================================ */

/** A room, with the things in it discovered, as arriving there would. */
function standingIn(id: LocationId, chapter: GameState['chapter'] = 'rite'): GameState {
  const base = begin();
  const discovered = Object.values(OBJECTS)
    .filter((def) => def.locationId === id && def.initiallyVisible)
    .map((def) => def.id);
  return {
    ...base,
    locationId: id,
    chapter,
    discovered: [...base.discovered, ...discovered],
  } as GameState;
}

describe('the workings', () => {
  const here = () => standingIn('past.worksite');

  it('answers for the trestle the placement action climbs', () => {
    expect(say(here(), 'examine trestle')).toMatch(/folding frame/i);
    expect(say(here(), 'sit on trestle')).toMatch(/what Lovage's boys do/i);
    expect(say(here(), 'pull the trestle')).toMatch(/drag it a foot/i);
  });

  it('answers the obvious idea about the chisels without granting it', () => {
    const refused = type(here(), 'take chisels');
    expect(refused.accepted).toBe(false);
    const text = stripMarkup(lastText(refused));
    // It knows what the player was thinking, and answers in stone and days.
    expect(text).toMatch(/you know what you are thinking/i);
    expect(text).toMatch(/not going to be with a chisel/i);
    // And nothing is acquired that could cut a third dish.
    expect(refused.state.inventory).toEqual(here().inventory);
  });

  it('answers for the oil the resolver used to get wrong', () => {
    /*
     * The verified defect: `examine oil` returned the description of the gap
     * back to the basin chamber. Both halves are fixed — the matcher does not
     * guess, and the noun now has something to find.
     */
    const text = say(here(), 'examine oil');
    expect(text).toMatch(/clay flask/i);
    expect(text).not.toMatch(/basin chamber/i);
    expect(say(here(), 'drink oil')).toMatch(/^No\.$/);
  });

  it('answers for the rest of the room the prose describes', () => {
    const room = here();
    expect(say(room, 'examine ledge')).toMatch(/course of stone/i);
    expect(say(room, 'examine scales')).toMatch(/overlapping scales/i);
    expect(say(room, 'examine nails')).toMatch(/four of them/i);
    expect(say(room, 'examine waste')).toMatch(/stone that used to be the hole/i);
    expect(say(room, 'examine chalk line')).toMatch(/snapped in blue chalk/i);
  });

  it('does not make the panel passable by any of them', () => {
    // None of the new objects may become a second way through.
    const room = here();
    for (const cmd of ['pull waste', 'pull chisels', 'pull nails', 'touch scales']) {
      const result = type(room, cmd);
      expect(result.state.flags[FLAGS.lanternInHighDish], cmd).toBeUndefined();
      expect(result.state.locationId, cmd).toBe('past.worksite');
    }
  });
});

describe('the crew kit at the past mouth', () => {
  const here = () => standingIn('past.entrance');

  it('answers for the split barrel, which is why the puzzle exists', () => {
    const room = here();
    expect(say(room, 'examine barrel')).toMatch(/post a letter through it/i);
    expect(say(room, 'drink barrel')).toMatch(/nothing in it/i);
    expect(say(room, 'pull barrel')).toMatch(/a cooper could put a new stave in it/i);
  });

  it('knows the barrel is the thing that needs water, when examined', () => {
    // Examining it teaches the same fact examining the kit does.
    const looked = type(here(), 'examine barrel');
    expect(looked.state.flags[FLAGS.knowsWaterNeeded]).toBe(true);
  });

  it('gives the kit its parts', () => {
    const room = here();
    expect(say(room, 'examine barrow')).toMatch(/mended/i);
    expect(say(room, 'examine wheel')).toMatch(/mended/i);
    expect(say(room, 'examine chisels')).toMatch(/waiting for a smith/i);
    expect(say(room, 'examine tarred line')).toMatch(/black with tar/i);
    expect(say(room, 'examine bowls')).toMatch(/upside down/i);
  });

  it('does not let the tarred line become a rope', () => {
    const refused = type(here(), 'take line');
    expect(refused.accepted).toBe(false);
    expect(stripMarkup(lastText(refused))).toMatch(/nothing in this hill you need string for/i);
    expect(refused.state.inventory).toEqual(here().inventory);
  });

  it('hangs the delivered skins on a peg that exists', () => {
    const delivered = {
      ...here(),
      flags: { ...here().flags, [FLAGS.carriedWater]: true },
      placements: {
        ...here().placements,
        water_skins: { kind: 'room', locationId: 'past.entrance' },
      },
    } as GameState;
    expect(say(delivered, 'examine peg')).toMatch(/driven into a crack/i);
    // And the skins themselves say where they are now.
    expect(say(delivered, 'examine skins')).toMatch(/hanging from the peg/i);
  });

  it('keeps the peg out of the room before anything is delivered', () => {
    expect(say(here(), 'examine peg')).toMatch(/cannot see any peg here/i);
  });
});

describe('the basin chamber', () => {
  const here = () => standingIn('past.deep_chamber');

  it('answers for the bucket and the mallet the prose puts there', () => {
    expect(say(here(), 'examine bucket')).toMatch(/stitched hide/i);
    expect(say(here(), 'examine mallet')).toMatch(/still tight on the shaft/i);
  });

  it('does not hand out a second mallet', () => {
    /*
     * The reconciliation the audit asked for. The prose always described a
     * mallet here; the portable one is a different mallet in the workings. A
     * second portable mallet would be a second way to arm the finale.
     */
    const refused = type(here(), 'take mallet');
    expect(refused.accepted).toBe(false);
    expect(refused.state.inventory).not.toContain('mallet');
    expect(stripMarkup(lastText(refused))).toMatch(/the tool they are coming back for/i);
  });

  it('does not let the bucket solve the water problem', () => {
    const refused = type(here(), 'take bucket');
    expect(refused.accepted).toBe(false);
    expect(stripMarkup(lastText(refused))).toMatch(/not a bucket-sized problem/i);
  });
});

describe("Saffra's board, after she writes it", () => {
  const square = (recited: boolean) =>
    ({
      ...standingIn('past.square'),
      flags: { ...begin().flags, ...(recited ? { [FLAGS.recitedProphecy]: true } : {}) },
    }) as GameState;

  it('is not there before the recitation', () => {
    expect(say(square(false), 'examine offcut')).toMatch(/cannot see any offcut here/i);
  });

  it('is there afterwards, in her hand and in the hero\'s words', () => {
    const text = say(square(true), 'examine offcut');
    expect(text).toMatch(/four lines on the back of it in charcoal/i);
    expect(text).toMatch(/they are your words/i);
  });

  it('is not confused with Fenn\'s mortar hawk', () => {
    /*
     * The audit's explicit warning. Both are boards and both are in the
     * square, and the matcher settles it without a prompt: `board` is an exact
     * noun on hers and only a containment match on his, and exact wins. His
     * answers to what it actually is.
     */
    expect(say(square(true), 'examine board')).toMatch(/four lines on the back/i);
    expect(say(square(true), 'examine mortar board')).toMatch(/short handle under it/i);
    expect(say(square(true), 'examine hawk')).toMatch(/short handle under it/i);
    // Before she writes, the only board in the square is his.
    expect(say(square(false), 'examine board')).toMatch(/short handle under it/i);
  });

  it('cannot be carried off, and says what that would mean', () => {
    const refused = type(square(true), 'take board');
    expect(refused.accepted).toBe(false);
    expect(stripMarkup(lastText(refused))).toMatch(/no plank by the well/i);
  });
});

describe('the return chamber keeps its own furniture', () => {
  const here = () => standingIn('present.sealed_chamber', 'return');

  it('answers for the shutter, the wedge, the eye, the wall and the alcove', () => {
    const room = here();
    expect(say(room, 'examine shutter')).toMatch(/held there by an oak wedge/i);
    expect(say(room, 'examine their wedge')).toMatch(/block of oak/i);
    expect(say(room, 'examine eye')).toMatch(/cut through a panel/i);
    expect(say(room, 'examine wall')).toMatch(/overlapping scales/i);
    expect(say(room, 'examine alcove')).toMatch(/shallow dish/i);
  });

  it('reads the scene rather than the hero\'s own placement flags', () => {
    /*
     * The reason the return has its own objects at all: the opening-era
     * shutter and alcove describe what *the player* did with them, and on the
     * return that stone is holding somebody else's wedge and somebody else's
     * lamp.
     */
    const room = here();
    // The hero has placed nothing in this chapter, and the room still
    // describes a wedged shutter — because it is theirs.
    expect(room.flags[FLAGS.shutterHeld]).toBeUndefined();
    expect(say(room, 'examine shutter')).toMatch(/you know the exact depth that wedge has gone/i);
    // And the refusal keeps the two wedges separate.
    expect(stripMarkup(lastText(type(room, 'take their wedge')))).toMatch(/that one is theirs/i);
  });

  it('refuses to undo the arrangement the scene depends on', () => {
    const room = here();
    for (const cmd of ['take shutter', 'take their wedge', 'pull their wedge', 'pull shutter']) {
      const result = type(room, cmd);
      expect(result.accepted, cmd).toBe(false);
      expect(result.state.flags[FLAGS.shutterHeld], cmd).toBeUndefined();
    }
  });

  it('separates the pillar crack from the wall seam', () => {
    const room = here();
    expect(say(room, 'examine pillar crack')).toMatch(/foot of the pillar/i);
    expect(say(room, 'examine grit')).toMatch(/fan of grit/i);
  });

  it('asks which crack, once both are discoverable', () => {
    /*
     * Two cracks in one room is genuine ambiguity, and the audit's answer is
     * the right one: ask, rather than silently pick.
     */
    const room = here();
    const withSeam = { ...room, discovered: [...room.discovered, 'sealed.seam'] } as GameState;
    const asked = type(withSeam, 'examine crack');
    expect(asked.state.pending?.kind).toBe('clarification');
    expect(asked.state.pending?.kind === 'clarification' && asked.state.pending.options.length).toBe(2);
  });

  it('tracks the pillar through each blow', () => {
    const room = here();
    const struck = (n: number) =>
      say({ ...room, flags: { ...room.flags, [FLAGS.pillarStruck]: n } } as GameState, 'examine grit');
    expect(struck(0)).toMatch(/carrying a load for longer than it was meant to/i);
    expect(struck(1)).toMatch(/finger-width now/i);
    expect(struck(2)).toMatch(/all the way through/i);
  });
});

/* ================================================================ *
 * Tier three: the coverage rule itself
 * ================================================================ */

describe('every room answers for what it describes', () => {
  /**
   * Nouns the audit named, room by room, with the answer they must *not* give.
   *
   * This is the audit turned into a test. It is deliberately a list of nouns
   * and not a list of expected sentences: the point is that the word resolves
   * in the room the prose uses it in, and that the reply is about that thing
   * rather than "you cannot see any X here".
   */
  const COVERAGE: Array<[LocationId, string[]]> = [
    [
      'present.home',
      ['stool', 'flue', 'cold patch', 'floorboards', 'door', 'bread', 'window'],
    ],
    [
      'present.square',
      [
        'salt bowl',
        'well cap',
        'bucket',
        'buckets',
        'dough',
        'kneading board',
        'bakehouse',
        'stub of chalk',
        'apron',
        'stick',
        'ladder',
        'well rope',
      ],
    ],
    [
      'present.workshop',
      ['glue pot', 'glue', 'shavings', 'sawdust', 'chisels', 'rack', 'big door', 'joint', 'dovetail'],
    ],
    ['present.cave_path', ['thistles', 'shale', 'grass', 'boots', 'laces', 'coil', 'stump']],
    ['present.entrance', ['moss', 'overhang', 'swept earth', 'spare rope', 'spare coil', 'knots', 'hook']],
    ['present.outer_gallery', ['roof', 'ceiling', 'pillar', 'relief']],
    ['present.echo_chamber', ['boot', 'laces', 'bow', 'water']],
    ['present.sealed_chamber', ['grooves', 'lip', 'pillar crack', 'grit', 'shutter']],
    ['present.deep_chamber', ['reflection', 'my face', 'threshold']],
    ['past.deep_chamber', ['coins', 'bone pin', 'silt', 'bucket', 'mallet', 'plumb bob', 'plumb-bob']],
    [
      'past.entrance',
      ['barrel', 'barrow', 'wheel', 'chisels', 'tarred line', 'bowls', 'handrail groove'],
    ],
    ['past.cave_path', ['swing', 'swing rope', 'plank seat', 'bark', 'carved letter', 'chippings']],
    ['past.spring', ['moss', 'cup marks', 'cup-marks', 'stone lining', 'spring']],
    [
      'past.square',
      ['trowel', 'apron', 'mortar board', 'hawk', 'scaffold', 'standing plank', 'reeds', 'bucket'],
    ],
    [
      'past.worksite',
      ['trestle', 'chisels', 'chisel basket', 'nails', 'ledge', 'lamps', 'oil', 'flask', 'scales', 'waste', 'chalk line'],
    ],
    ['future.deep_chamber', ['coins', 'pin', 'stain', 'slab', 'crust', 'dust']],
    ['future.cave_path', ['tear', 'fissure', 'distant water', 'shoreline', 'sky']],
    [
      'future.square',
      [
        'pump',
        'buckets',
        'tally',
        'sealant',
        'shed',
        'cart side',
        'goats',
        'straw',
        'trough',
        'oilcloth',
        'blanket',
        'her slate',
        'boards',
        'slates',
      ],
    ],
    ['future.entrance', ['knife', 'her tally', 'coat', 'seal', 'mark']],
    ['future.sealed_chamber', ['scales', 'patterned wall', 'pillar']],
  ];

  /** Everything discovered, every flag on: the most generous reading. */
  function fullyExplored(id: LocationId): GameState {
    const base = begin();
    const discovered = Object.values(OBJECTS)
      .filter((def) => def.locationId === id)
      .map((def) => def.id);
    const flagsOn = Object.fromEntries(
      Object.entries(FLAG_TYPES)
        .filter(([, type]) => type === 'boolean')
        .map(([key]) => [key, true])
    );
    return {
      ...base,
      locationId: id,
      era: id.split('.')[0] as GameState['era'],
      discovered: [...base.discovered, ...discovered],
      flags: { ...base.flags, ...flagsOn },
    } as GameState;
  }

  for (const [locationId, nouns] of COVERAGE) {
    it(`resolves the nouns its prose uses in ${locationId}`, () => {
      const here = fullyExplored(locationId);
      for (const noun of nouns) {
        const refs = resolveNoun(here, noun);
        expect(refs.length, `${locationId}: "${noun}" resolves to nothing`).toBeGreaterThan(0);
      }
    });

    it(`answers a physical attempt about each of them in ${locationId}`, () => {
      const here = fullyExplored(locationId);
      for (const noun of nouns) {
        for (const verb of ['touch', 'eat', 'listen to']) {
          const text = say(here, `${verb} ${noun}`);
          expect(text, `${locationId}: ${verb} ${noun}`).not.toMatch(/cannot see any/i);
          expect(text, `${locationId}: ${verb} ${noun}`).not.toMatch(/cannot do that here/i);
        }
      }
    });

    it(`gives a reason rather than a shrug when ${locationId} refuses a take`, () => {
      /*
       * Not everything is portable, and the refusals are where the writing
       * goes. What must not happen is the generic line — that is the shrug the
       * audit objected to.
       */
      const here = fullyExplored(locationId);
      for (const noun of nouns) {
        const refs = resolveNoun(here, noun);
        if (refs.length !== 1 || refs[0]!.kind !== 'object') continue;
        const def = OBJECTS[refs[0]!.id]!;
        if (def.item) continue;
        expect(def.cannotTake, `${locationId}: ${def.id} has no authored take refusal`).toBeDefined();
      }
    });
  }
});

describe('a part travels with the thing it is part of', () => {
  it('keeps the cloth tag reachable once the lantern is carried away', () => {
    /*
     * The audit's attachment gap: the tag is knotted to the handle, and was a
     * room object — so reading it meant walking back to an empty windowsill.
     */
    const read = typeAll(begin(), ['examine lantern']);
    expect(say(read, 'examine tag')).toMatch(/sixteen\. go carefully/i);

    const away = typeAll(read, ['take lantern', 'down']);
    expect(away.locationId).toBe('present.square');
    expect(say(away, 'examine tag')).toMatch(/sixteen\. go carefully/i);
    expect(say(away, 'examine striker')).toMatch(/flint and a curl of steel/i);
  });

  it('leaves it behind with the lantern if the lantern is put down', () => {
    const dropped = typeAll(begin(), ['examine lantern', 'take lantern', 'down', 'drop lantern', 'west']);
    // The lamp is in the square; the tag is on the lamp, so it is there too.
    expect(say(dropped, 'examine tag')).toMatch(/cannot see any tag here/i);
  });
});
