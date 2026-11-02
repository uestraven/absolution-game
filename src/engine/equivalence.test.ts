import { describe, expect, it } from 'vitest';
import {
  begin,
  finishChapterThree,
  finishTheStory,
  hasFinished,
  progressOf,
  type,
  typeAll,
} from '../testing/harness';
import { resolve } from './reducer';
import { getAffordances, type Affordance } from './affordances';
import type { GameAction, GameState } from './types';
import { FLAGS } from '../content/flags';
import { OBJECTIVES } from '../content/text';

/**
 * Selectable mode plays by finding a button and clicking it. These helpers do
 * exactly what the panel does — look up the affordance list the engine
 * produced, then dispatch its action — so a passing test means the buttons
 * really can finish the chapter.
 */
function click(state: GameState, find: (a: Affordances) => Affordance | undefined): GameState {
  const affordances = getAffordances(state);
  const affordance = find(affordances);
  if (!affordance) {
    throw new Error(
      `No such button available at ${state.locationId}. ` +
        `Objects: ${affordances.objects.map((o) => o.id).join(', ')}. ` +
        `Exits: ${affordances.exits.map((e) => e.key).join(', ')}.`
    );
  }
  return resolve(state, affordance.action).state;
}

type Affordances = ReturnType<typeof getAffordances>;

const exit = (label: string) => (a: Affordances) =>
  a.exits.find((e) => e.key === `exit-${label}`);
const objectVerb = (objectId: string, verb: string) => (a: Affordances) =>
  a.objects.find((o) => o.id === objectId)?.actions.find((x) => x.key === `${objectId}-${verb}`);
const objectExtra = (objectId: string, key: string) => (a: Affordances) =>
  a.objects.find((o) => o.id === objectId)?.actions.find((x) => x.key === key);
const useOn = (item: string, target: string) => (a: Affordances) =>
  a.items.find((i) => i.id === item)?.useTargets.find((t) => t.key === `use-${item}-${target}`);
const placeIn = (item: string, target: string) => (a: Affordances) =>
  a.items.find((i) => i.id === item)?.placeTargets.find((t) => t.key === `place-${item}-${target}`);
const itemVerb = (item: string, verb: string) => (a: Affordances) =>
  a.items.find((i) => i.id === item)?.actions.find((x) => x.key === `item-${item}-${verb}`);
const person = (id: string) => (a: Affordances) => a.people.find((p) => p.key === `talk-${id}`);
const meta = (key: string) => (a: Affordances) => a.meta.find((m) => m.key === key);
const clarification = (label: string) => (a: Affordances) =>
  a.clarification?.options.find((o) => o.label === label);
const topic = (id: string) => (a: Affordances) => a.topics?.find((t) => t.key === `topic-${id}`);
/** Handing something over is a target in the item's "use on…" list. */
const giveTo = (item: string, personId: string) => (a: Affordances) =>
  a.items.find((i) => i.id === item)?.useTargets.find((t) => t.key === `give-${item}-${personId}`);
/** The recitation sits at the head of the topic list, or among the meta actions. */
const recite = () => (a: Affordances) =>
  a.topics?.find((t) => t.key === 'recite-prophecy') ??
  a.meta.find((m) => m.key === 'recite-prophecy');
/**
 * The panel renders "Leave the conversation" unconditionally whenever a
 * conversation is open, rather than taking it from the affordance list, so the
 * click helper has to do the same.
 */
const leave = () => (a: Affordances) =>
  a.topics === null
    ? undefined
    : { key: 'leave', label: 'Leave the conversation', action: { type: 'END_CONVERSATION' } as GameAction };

describe('the two input modes are the same game', () => {
  it('reaches identical progress from identical intent, step for step', () => {
    const steps: Array<{ typed: string; chosen: (a: Affordances) => Affordance | undefined }> = [
      { typed: 'take lantern', chosen: objectVerb('home.lantern', 'take') },
      { typed: 'go down', chosen: exit('to_square') },
      { typed: 'examine plank', chosen: objectVerb('square.plank', 'examine') },
      { typed: 'go east', chosen: exit('to_workshop') },
      { typed: 'take wedge', chosen: objectVerb('workshop.wedge', 'take') },
      { typed: 'go west', chosen: exit('to_square') },
      { typed: 'go west', chosen: exit('to_cave_path') },
      { typed: 'examine stump', chosen: objectVerb('path.stump', 'examine') },
      { typed: 'go west', chosen: exit('to_entrance') },
      { typed: 'examine rope', chosen: objectVerb('entrance.rope', 'examine') },
      { typed: 'go in', chosen: exit('to_gallery') },
      { typed: 'examine relief', chosen: objectVerb('gallery.relief', 'examine') },
      { typed: 'go east', chosen: exit('to_sealed') },
      { typed: 'use wedge on shutter', chosen: useOn('wedge', 'sealed.shutter') },
      { typed: 'place lantern in alcove', chosen: placeIn('lantern', 'sealed.alcove') },
      { typed: 'light lantern', chosen: objectExtra('sealed.alcove', 'light-lantern-in-place') },
      { typed: 'examine wall', chosen: objectVerb('sealed.wall', 'examine') },
      { typed: 'open seam', chosen: objectVerb('sealed.seam', 'open') },
      { typed: 'take lantern', chosen: objectExtra('sealed.alcove', 'retrieve-lantern') },
      { typed: 'take wedge', chosen: objectExtra('sealed.shutter', 'retrieve-wedge') },
      { typed: 'go down', chosen: exit('to_deep') },
      { typed: 'examine threshold', chosen: objectVerb('deep.threshold', 'examine') },
      { typed: 'enter threshold', chosen: objectVerb('deep.threshold', 'cross') },
      { typed: 'go up', chosen: exit('to_entrance') },
      { typed: 'go east', chosen: exit('to_path') },
      { typed: 'go east', chosen: exit('to_square') },
      { typed: 'talk to saffra', chosen: person('sabra') },
      { typed: 'cave', chosen: topic('cave') },
      { typed: 'wanderer', chosen: topic('wanderer') },
      // P4: they ask, and the hero answers. The words are fixed; only the
      // decision to say them is the player's.
      { typed: 'why you asked', chosen: topic('why_you_asked') },
      { typed: 'recite prophecy', chosen: recite() },
      // P2, the recovery route: Lovage will not take anything off them now.
      { typed: 'talk to fenn', chosen: person('pell') },
      { typed: 'how a boy gets past the foreman', chosen: topic('spoil_gap') },
      { typed: 'leave', chosen: leave() },
      { typed: 'go west', chosen: exit('to_path') },
      { typed: 'go west', chosen: exit('to_entrance') },
      { typed: 'go down', chosen: exit('to_deep') },
      { typed: 'go north', chosen: exit('to_worksite') },
      // P3: all three pieces, then the one setting that can be lit.
      { typed: 'examine drawing', chosen: objectVerb('worksite.drawing', 'examine') },
      { typed: 'examine slate', chosen: objectVerb('worksite.notes', 'examine') },
      { typed: 'examine dishes', chosen: objectVerb('worksite.dishes', 'examine') },
      { typed: 'examine pillar', chosen: objectVerb('worksite.pillar', 'examine') },
      { typed: 'place lantern in high dish', chosen: placeIn('lantern', 'worksite.highdish') },
      { typed: 'enter aperture', chosen: objectVerb('worksite.aperture', 'cross') },
      // Chapter 3
      { typed: 'go up', chosen: exit('to_path') },
      { typed: 'examine bird', chosen: objectVerb('futurepath.bird', 'examine') },
      { typed: 'go east', chosen: exit('to_square') },
      { typed: 'talk to rue', chosen: person('rue') },
      { typed: 'what she is sitting against', chosen: topic('the_chest') },
      { typed: 'the oldest thing she knows', chosen: topic('the_child') },
      { typed: 'leave', chosen: leave() },
      { typed: 'examine account', chosen: objectVerb('futuresquare.account', 'examine') },
      { typed: 'examine memorial', chosen: objectVerb('futuresquare.memorial', 'examine') },
      { typed: 'journal', chosen: meta('meta-journal') },
      { typed: 'examine shell', chosen: objectVerb('futuresquare.workshop', 'examine') },
      { typed: 'take maul', chosen: objectVerb('futuresquare.maul', 'take') },
      // The synthesis, offered as an action in both modes.
      { typed: 'reflect', chosen: meta('reflect') },
      { typed: 'go west', chosen: exit('to_path') },
      { typed: 'go west', chosen: exit('to_entrance') },
      { typed: 'talk to sorrel', chosen: person('sorrel') },
      { typed: 'why the hill is walled up', chosen: topic('the_seal') },
      { typed: 'whether the wall is as good as it looks', chosen: topic('loose_course') },
      { typed: 'leave', chosen: leave() },
      { typed: 'use wedge on seal', chosen: useOn('wedge', 'futureentrance.seal') },
      { typed: 'break seal', chosen: objectVerb('futureentrance.seal', 'break') },
      { typed: 'break seal', chosen: objectVerb('futureentrance.seal', 'break') },
      { typed: 'go west', chosen: exit('to_sealed') },
      { typed: 'examine fill', chosen: objectVerb('futuresealed.fill', 'examine') },
      { typed: 'clear fill', chosen: objectVerb('futuresealed.fill', 'clear') },
      {
        typed: 'place lantern in middle dish',
        chosen: placeIn('lantern', 'futuresealed.middledish'),
      },
      { typed: 'enter aperture', chosen: objectVerb('futuresealed.aperture', 'cross') },
      // Chapter 4
      { typed: 'talk to them', chosen: person('earlier_self') },
      { typed: 'say nothing', chosen: topic('say_nothing') },
      { typed: 'show self', chosen: meta('show-self') },
      { typed: 'show lantern', chosen: meta('show-lantern') },
      { typed: 'show journal', chosen: meta('show-journal') },
      { typed: 'tell them about the future', chosen: meta('show-future') },
      { typed: 'tell them about the prophecy', chosen: meta('show-origin') },
      { typed: 'block wall', chosen: meta('block-wall') },
      { typed: 'hold them', chosen: meta('restrain') },
      { typed: 'kill them', chosen: meta('kill') },
      { typed: 'examine pillar', chosen: objectVerb('sealed.pillar', 'examine') },
      { typed: 'break pillar', chosen: objectVerb('sealed.pillar', 'break') },
      { typed: 'break pillar', chosen: objectVerb('sealed.pillar', 'break') },
      { typed: 'break pillar', chosen: objectVerb('sealed.pillar', 'break') },
      { typed: 'swing', chosen: clarification('Swing') },
    ];

    let typed = begin('basilia');
    let selected = begin('basilia');

    for (const step of steps) {
      typed = type(typed, step.typed).state;
      selected = click(selected, step.chosen);
      expect(progressOf(selected), `after "${step.typed}"`).toEqual(progressOf(typed));
    }

    expect(hasFinished(typed)).toBe(true);
    expect(hasFinished(selected)).toBe(true);
  });
});

describe('end to end', () => {
  const EXPECTED_ORDER = [
    'present.home',
    'present.square',
    'present.workshop',
    'present.cave_path',
    'present.entrance',
    'present.outer_gallery',
    'present.echo_chamber',
    'present.sealed_chamber',
    'present.deep_chamber',
    'past.deep_chamber',
    'past.entrance',
    'past.cave_path',
    'past.spring',
    'past.square',
    'past.worksite',
    'future.deep_chamber',
    'future.cave_path',
    'future.square',
    'future.entrance',
    'future.sealed_chamber',
  ];

  it('completes the chapter by typing, visiting every location', () => {
    const state = typeAll(begin('basil'), [
      'examine lantern',
      'examine tag',
      'take lantern',
      'examine window',
      'down',
      'examine plank',
      'talk to sage',
      'the prophecy',
      'how old the prophecy is',
      'leave',
      'talk to marjoram',
      '2',
      'leave',
      'talk to parsie',
      'why he is so excited',
      'the others who went in',
      'what he wants you to bring back',
      'leave',
      'east',
      'talk to oreg',
      'his own attempt at the rite',
      'the square room at the back',
      'leave',
      'take wedge',
      'west',
      'west',
      'talk to dilly',
      '1',
      '2',
      'leave',
      'talk to tyme',
      '1',
      'the night he went in after dilly',
      'leave',
      'examine stump',
      'west',
      'examine lintel',
      'light lantern',
      'in',
      'examine scratches',
      'examine relief',
      'north',
      'examine words',
      'examine boot',
      'south',
      'east',
      'examine shutter',
      'open shutter',
      'examine alcove',
      'examine eye',
      'wedge shutter',
      'place lantern in alcove',
      'examine wall',
      'open seam',
      'take lantern',
      'take wedge',
      'down',
      'examine threshold',
      'enter threshold',
      'examine tool work',
      'up',
      'examine mouth',
      'talk to lovage',
      'why nobody is working',
      'the pillar he mentioned',
      'leave',
      'east',
      'examine tree',
      'examine ruts',
      'east',
      'examine tree',
      'examine well',
      'examine building',
      'talk to saffra',
      'the cave on the hill',
      'whether the cave has a name',
      'whether anything is coming',
      // P2, the ordinary way: carry the crew their water. Available because
      // the words have not been said yet.
      'the foreman up at the cave',
      'leave',
      'take skins',
      'west',
      'north',
      'examine spring',
      'fill skins',
      'south',
      'west',
      'give skins to lovage',
      'down',
      'examine spoil',
      'north',
      // P3
      'examine drawing',
      'examine slate',
      'examine dishes',
      'examine low dish',
      'examine high dish',
      'examine outline',
      'examine pillar',
      'examine aperture',
      'take mallet',
      // The low position, tried on purpose. Standing the lamp and going
      // through are separate acts; it costs nothing, and it is the cleanest
      // confirmation the hero can get that the heights are places.
      'place lantern in low dish',
      'enter aperture',
      // P4: still owed, and the aperture will not take them until it is paid.
      'south',
      'up',
      'east',
      'east',
      'talk to saffra',
      'why you asked',
      'recite prophecy',
      'west',
      'west',
      'down',
      'north',
      'place lantern in high dish',
      'enter aperture',
      'examine basin',
      'examine stair',
      'examine tear',
      // Chapter 3: out of the hill, the settlement, the evidence, the seal.
      'up',
      'examine sky',
      'examine bird',
      'examine ground',
      'east',
      'examine well',
      'examine memorial',
      'examine chest',
      'talk to rue',
      'what she is sitting against',
      'the writing from other places',
      'asking to open the hill',
      'leave',
      // Read it before asking her about it: her opinions are gated on having
      // seen the thing she has opinions about.
      'examine account',
      'talk to rue',
      'the oldest thing she knows',
      'what she thinks came',
      'how any of it works',
      'leave',
      'journal',
      'examine shell',
      'reflect',
      'west',
      'west',
      'examine seal',
      'examine mark',
      'talk to sorrel',
      'where you have come from',
      'why the hill is walled up',
      'whether the wall is as good as it looks',
      'what is left anywhere else',
      'leave',
      'use wedge on seal',
      'break seal',
      'break seal',
      'west',
      'examine fill',
      'clear fill',
      'examine middle dish',
      'examine pillar',
      'place lantern in middle dish',
      'enter aperture',
      'examine them',
      'examine their lantern',
      'examine seam',
      'examine pillar',
      // Chapter 4: everything said, every hand tried, and then the end.
      'talk to them',
      'say nothing',
      'show self',
      'show lantern',
      'show journal',
      'tell them about the future',
      'tell them about the prophecy',
      'block wall',
      'hold them',
      'take their lantern',
      'wait',
      'kill them',
      'break pillar',
      'break pillar',
      'break pillar',
      'swing',
      'review',
    ]);

    expect(hasFinished(state)).toBe(true);
    expect(state.objective).toBe(OBJECTIVES.over);
    expect([...state.visited].sort()).toEqual([...EXPECTED_ORDER].sort());
    expect(state.journal.length).toBeGreaterThan(34);
    // Nothing in this run should have been rejected as nonsense.
    expect(state.transcript.filter((e) => e.kind === 'failure')).toEqual([]);
  });

  it('completes the chapter by clicking, with no typing at all', () => {
    let state = begin('basilia');
    const path: Array<(a: Affordances) => Affordance | undefined> = [
      objectVerb('home.lantern', 'take'),
      exit('to_square'),
      objectVerb('square.plank', 'examine'),
      person('orla'),
      topic('prophecy'),
      exit('to_workshop'),
      person('tolv'),
      topic('his_attempt'),
      objectVerb('workshop.wedge', 'take'),
      exit('to_square'),
      exit('to_cave_path'),
      person('nessa'),
      topic('her_rite'),
      topic('how_lost'),
      topic('what_she_saw'),
      exit('to_entrance'),
      itemVerb('lantern', 'light'),
      exit('to_gallery'),
      objectVerb('gallery.relief', 'examine'),
      exit('to_echo'),
      objectVerb('echo.account', 'examine'),
      exit('to_gallery'),
      exit('to_sealed'),
      objectVerb('sealed.shutter', 'open'),
      objectVerb('sealed.alcove', 'examine'),
      useOn('wedge', 'sealed.shutter'),
      placeIn('lantern', 'sealed.alcove'),
      objectVerb('sealed.wall', 'examine'),
      objectVerb('sealed.seam', 'open'),
      objectExtra('sealed.alcove', 'retrieve-lantern'),
      objectExtra('sealed.shutter', 'retrieve-wedge'),
      exit('to_deep'),
      objectVerb('deep.threshold', 'examine'),
      objectVerb('deep.threshold', 'cross'),
      exit('to_entrance'),
      person('lovage'),
      topic('why_stopped'),
      leave(),
      exit('to_path'),
      exit('to_square'),
      person('sabra'),
      topic('cave'),
      topic('wanderer'),
      topic('lovage'),
      leave(),
      objectVerb('pastsquare.skins', 'take'),
      exit('to_path'),
      exit('to_spring'),
      objectVerb('pastspring.spring', 'fill'),
      exit('to_path'),
      exit('to_entrance'),
      giveTo('water_skins', 'lovage'),
      exit('to_deep'),
      exit('to_worksite'),
      objectVerb('worksite.drawing', 'examine'),
      objectVerb('worksite.notes', 'examine'),
      objectVerb('worksite.dishes', 'examine'),
      objectVerb('worksite.mallet', 'take'),
      exit('to_deep'),
      exit('to_entrance'),
      exit('to_path'),
      exit('to_square'),
      person('sabra'),
      topic('why_you_asked'),
      recite(),
      exit('to_path'),
      exit('to_entrance'),
      exit('to_deep'),
      exit('to_worksite'),
      placeIn('lantern', 'worksite.highdish'),
      objectVerb('worksite.aperture', 'cross'),
      exit('to_path'),
      objectVerb('futurepath.sky', 'examine'),
      objectVerb('futurepath.bird', 'examine'),
      exit('to_square'),
      person('rue'),
      topic('the_chest'),
      topic('the_child'),
      leave(),
      objectVerb('futuresquare.account', 'examine'),
      objectVerb('futuresquare.memorial', 'examine'),
      meta('meta-journal'),
      objectVerb('futuresquare.workshop', 'examine'),
      meta('reflect'),
      exit('to_path'),
      exit('to_entrance'),
      person('sorrel'),
      topic('the_seal'),
      topic('loose_course'),
      leave(),
      useOn('wedge', 'futureentrance.seal'),
      objectVerb('futureentrance.seal', 'break'),
      objectVerb('futureentrance.seal', 'break'),
      exit('to_sealed'),
      objectVerb('futuresealed.fill', 'examine'),
      objectVerb('futuresealed.fill', 'clear'),
      placeIn('lantern', 'futuresealed.middledish'),
      objectVerb('futuresealed.aperture', 'cross'),
      person('earlier_self'),
      topic('say_nothing'),
      meta('show-lantern'),
      meta('show-origin'),
      meta('block-wall'),
      meta('restrain'),
      meta('kill'),
      objectVerb('sealed.pillar', 'examine'),
      objectVerb('sealed.pillar', 'break'),
      objectVerb('sealed.pillar', 'break'),
      objectVerb('sealed.pillar', 'break'),
      clarification('Swing'),
      meta('review'),
    ];
    for (const step of path) state = click(state, step);

    expect(hasFinished(state)).toBe(true);
    expect([...state.visited].sort()).toEqual([...EXPECTED_ORDER].sort());
  });
});

describe('the documented shortest route', () => {
  /**
   * Kept identical to the twenty-command route in docs/WALKTHROUGH.md, so the
   * walkthrough cannot drift away from the game.
   */
  const SHORTEST = [
    'take lantern',
    'down',
    'east',
    'take wedge',
    'west',
    'west',
    'west',
    'in',
    'east',
    'use wedge on shutter',
    'place lantern in alcove',
    'light lantern',
    'open seam',
    'take lantern',
    'down',
    'enter threshold',
    'up',
    'east',
    'east',
    'talk to saffra',
    'cave',
    'whether anything is coming',
    'why you asked',
    'recite prophecy',
    'talk to fenn',
    'how a boy gets past the foreman',
    'leave',
    'west',
    'west',
    'down',
    'north',
    'examine drawing',
    'examine slate',
    'examine dishes',
    'place lantern in high dish',
    'enter aperture',
    'up',
    'examine bird',
    'east',
    'talk to rue',
    'what she is sitting against',
    'the oldest thing she knows',
    'leave',
    'examine account',
    'examine memorial',
    'journal',
    'examine shell',
    'take maul',
    'take blocks',
    'reflect',
    'west',
    'west',
    'talk to sorrel',
    'why the hill is walled up',
    'whether the wall is as good as it looks',
    'leave',
    'use wedge on seal',
    'break seal',
    'break seal',
    'west',
    'examine fill',
    'clear fill',
    'place lantern in middle dish',
    'enter aperture',
    'talk to them',
    'show lantern',
    'tell them about the prophecy',
    'kill them',
    'break pillar',
    'break pillar',
    'break pillar',
    'swing',
  ];

  /** Where the opening chapter's own shortest route used to stop. */
  const OPENING_LENGTH = 13;
  /** Where the second chapter's shortest route stopped. */
  const SECOND_LENGTH = 36;

  it('finishes the chapter with nothing refused along the way', () => {
    let state = begin('basil');
    for (const line of SHORTEST) {
      const result = type(state, line);
      /*
       * A line that opens a question rather than acting is not a refusal of
       * the player's intent — and the last blow on the pillar deliberately
       * asks before it is taken.
       */
      const asked = result.state.pending?.kind === 'clarification';
      expect(
        result.accepted || asked,
        `"${line}" was refused at ${state.locationId}`
      ).toBe(true);
      state = result.state;
    }
    expect(SHORTEST).toHaveLength(72);
    expect(hasFinished(state)).toBe(true);
    expect(state.objective).toBe(OBJECTIVES.over);
  });

  it('takes the recitation-first order, so both recovery routes are load-bearing', () => {
    const state = typeAll(begin(), SHORTEST.slice(0, SECOND_LENGTH));
    expect(state.flags[FLAGS.recitedProphecy]).toBe(true);
    // Lovage had already turned against them, so this route never used water.
    expect(state.flags[FLAGS.lovageDistrust]).toBe(true);
    expect(state.flags[FLAGS.carriedWater]).toBeUndefined();
    expect(state.flags[FLAGS.fennRoute]).toBe(true);
  });

  it('does not require the lantern to be lit to get through the cave', () => {
    const atSealed = typeAll(begin(), SHORTEST.slice(0, 9));
    expect(atSealed.locationId).toBe('present.sealed_chamber');
    expect(atSealed.flags[FLAGS.lanternLit]).toBeUndefined();
  });

  it('still completes if the player crosses having left both items behind', () => {
    /*
     * Leaving the lantern in the alcove and the wedge under the shutter puts
     * both of them permanently out of reach once the crossing is made. The
     * second crossing needs a lamp, so the recovery is the crew's — taken in
     * the workings, a century earlier, because the men cutting that hole have
     * lamps. Nothing teleports and nothing is pretended about the hero's own.
     */
    let state = typeAll(begin(), SHORTEST.slice(0, OPENING_LENGTH));
    expect(state.flags[FLAGS.passageOpen]).toBe(true);
    expect(state.inventory).toEqual([]);
    state = typeAll(state, ['down', 'enter threshold']);
    expect(state.inventory).toEqual([]);

    state = typeAll(state, [
      'up',
      'east',
      'east',
      'talk to saffra',
      'cave',
      'whether anything is coming',
      'why you asked',
      'recite prophecy',
      'talk to fenn',
      'how a boy gets past the foreman',
      'leave',
      'west',
      'west',
      'down',
      'north',
      'examine drawing',
      'examine slate',
      'examine dishes',
      'take lamp',
      'place lantern in high dish',
      'light lantern',
      'enter aperture',
    ]);
    expect(state.locationId).toBe('future.deep_chamber');

    // And on through the ruined century, borrowing both tools from the shed.
    const finished = finishChapterThree(state);
    expect(hasFinished(finishTheStory(finished.state))).toBe(true);
  });

  it('does not require the echo chamber or any conversation before the cave', () => {
    const solved = typeAll(begin(), SHORTEST.slice(0, OPENING_LENGTH));
    expect(solved.flags[FLAGS.passageOpen]).toBe(true);
    expect(solved.visited).not.toContain('present.echo_chamber');
    expect(solved.discovered.filter((id) => id.startsWith('topic.'))).toEqual([]);
  });
});

describe('selectable mode can reach everything typing can', () => {
  it('can pick an item back up after putting it down', () => {
    // A player who only ever clicks must not be able to lose the lantern.
    let state = typeAll(begin(), ['take lantern', 'down']);
    state = click(state, itemVerb('lantern', 'drop'));
    expect(state.inventory).toEqual([]);

    const dropped = getAffordances(state).objects.find((o) => o.id === 'lantern');
    expect(dropped, 'the dropped lantern is listed among the things here').toBeDefined();
    expect(dropped!.actions.map((a) => a.label)).toEqual(['Examine', 'Take']);

    state = click(state, objectVerb('lantern', 'take'));
    expect(state.inventory).toEqual(['lantern']);
  });

  it('lists a dropped item only in the room it was left in', () => {
    let state = typeAll(begin(), ['take lantern', 'down', 'drop lantern']);
    expect(getAffordances(state).objects.some((o) => o.id === 'lantern')).toBe(true);
    state = typeAll(state, ['east']);
    expect(getAffordances(state).objects.some((o) => o.id === 'lantern')).toBe(false);
    state = typeAll(state, ['west']);
    expect(getAffordances(state).objects.some((o) => o.id === 'lantern')).toBe(true);
  });

  it('can still finish the chapter after dropping and recovering both items', () => {
    let state = typeAll(begin(), ['take lantern', 'down', 'east', 'take wedge']);
    state = typeAll(state, ['drop lantern', 'drop wedge']);
    state = click(state, objectVerb('lantern', 'take'));
    state = click(state, objectVerb('wedge', 'take'));
    expect(state.inventory).toEqual(expect.arrayContaining(['lantern', 'wedge']));
    const finished = typeAll(state, [
      'west',
      'west',
      'west',
      'in',
      'east',
      'use wedge on shutter',
      'place lantern in alcove',
      'light lantern',
      'open seam',
      'take lantern',
      'down',
      'enter threshold',
      'up',
      'east',
      'east',
      'talk to saffra',
      'cave',
      'whether anything is coming',
      'why you asked',
      'recite prophecy',
      'talk to fenn',
      'how a boy gets past the foreman',
      'leave',
      'west',
      'west',
      'down',
      'north',
      'examine drawing',
      'examine slate',
      'examine dishes',
      'place lantern in high dish',
      'enter aperture',
    ]);
    expect(finished.locationId).toBe('future.deep_chamber');
    const end = finishChapterThree(finished);
    expect(hasFinished(finishTheStory(end.state))).toBe(true);
  });
});

describe('selectable mode gives nothing away', () => {
  it('offers no label phrased in terms of what it will achieve', () => {
    const sealed = typeAll(begin(), [
      'take lantern',
      'down',
      'east',
      'take wedge',
      'west',
      'west',
      'west',
      'in',
      'east',
    ]);
    const labels = collectLabels(getAffordances(sealed));
    for (const label of labels) {
      expect(label.toLowerCase(), label).not.toMatch(
        /secret|hidden|reveal|solve|passage|solution|unlock/
      );
    }
  });

  it('shows only discovered things', () => {
    const sealed = typeAll(begin(), ['take lantern', 'down', 'west', 'west', 'in', 'east']);
    const ids = getAffordances(sealed).objects.map((o) => o.id);
    expect(ids).toContain('sealed.shutter');
    expect(ids).not.toContain('sealed.alcove');
    expect(ids).not.toContain('sealed.seam');
    expect(ids).not.toContain('sealed.passage');
  });

  it('offers a modest set of plausible item targets, several of them wrong', () => {
    const sealed = typeAll(begin(), [
      'take lantern',
      'down',
      'east',
      'take wedge',
      'west',
      'west',
      'west',
      'in',
      'east',
      'open shutter',
    ]);
    const targets = getAffordances(sealed).items.find((i) => i.id === 'wedge')!.useTargets;
    const ids = targets.map((t) => t.key.replace('use-wedge-', ''));
    expect(ids).toContain('sealed.shutter');
    expect(ids).toContain('sealed.alcove');
    expect(ids).toContain('sealed.eye');
    expect(ids.length).toBeLessThanOrEqual(6);

    // The wrong ones must fail with an explanation, not silently.
    const wrong = resolve(sealed, { type: 'USE', item: 'wedge', target: 'sealed.eye' });
    expect(wrong.accepted).toBe(false);
    expect(wrong.events[0]!.text.length).toBeGreaterThan(40);
  });

  it('keeps the crossing an explicit choice rather than a side effect', () => {
    const deep = typeAll(begin(), [
      'take lantern',
      'down',
      'east',
      'take wedge',
      'west',
      'west',
      'west',
      'in',
      'east',
      'use wedge on shutter',
      'place lantern in alcove',
      'light lantern',
      'open seam',
      'down',
    ]);
    const threshold = getAffordances(deep).objects.find((o) => o.id === 'deep.threshold')!;
    const crossing = threshold.actions.find((a) => a.key === 'deep.threshold-cross')!;
    expect(crossing.action).toEqual<GameAction>({ type: 'CROSS_THRESHOLD' });
    expect(deep.flags[FLAGS.crossed]).toBeUndefined();
  });
});

function collectLabels(a: Affordances): string[] {
  const labels = [
    ...a.exits.map((x) => x.label),
    ...a.people.map((x) => x.label),
    ...a.meta.map((x) => x.label),
    ...(a.topics ?? []).map((x) => x.label),
  ];
  for (const object of a.objects) {
    labels.push(object.name, ...object.actions.map((x) => x.label));
  }
  for (const item of a.items) {
    labels.push(
      item.name,
      ...item.actions.map((x) => x.label),
      ...item.useTargets.map((x) => x.label),
      ...item.placeTargets.map((x) => x.label)
    );
  }
  return labels;
}
