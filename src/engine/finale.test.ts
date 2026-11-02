import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CROSS_FIRST,
  FENN_ROUTE,
  GO_FORWARD,
  PAST_TO_SQUARE,
  READ_PANEL,
  RECITE,
  SAFFRA_REALISATION,
  SOLVE_RELIEF,
  THE_ARGUMENT,
  THE_HANDS,
  TO_SEALED,
  begin,
  finishChapterThree,
  finishTheStory,
  hasFinished,
  hasReturned,
  lastText,
  progressOf,
  type,
  typeAll,
} from '../testing/harness';
import { resolve } from './reducer';
import { getAffordances } from './affordances';
import { FLAGS } from '../content/flags';
import { PROPHECY_LINES } from '../content/prophecy';
import { OBJECTIVES } from '../content/text';
import { stripMarkup } from '../content/markup';
import * as FINALE_TEXT from '../content/confrontationText';
import { hintContext, nextHint } from '../content/hints';
import {
  importFromText,
  loadBest,
  readSlot,
  serialize,
  writeAutosave,
  writeCheckpoint,
} from '../persistence/storage';
import { validateSave } from '../persistence/validate';
import type { GameState } from './types';

/**
 * The confrontation, the sacrifice and the ending.
 */

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

/** On hands and knees on the floor of the sealed chamber, just come through. */
function arrived(character: 'basil' | 'basilia' = 'basil'): GameState {
  return finishChapterThree(
    typeAll(begin(character), [
      ...TO_SEALED,
      ...SOLVE_RELIEF,
      ...CROSS_FIRST,
      ...PAST_TO_SQUARE,
      ...SAFFRA_REALISATION,
      'leave',
      ...RECITE,
      ...FENN_ROUTE,
      ...READ_PANEL,
      ...GO_FORWARD,
    ])
  ).state;
}

/** Everything said, and they have decided and are moving. */
function moving(): GameState {
  const state = typeAll(arrived(), THE_ARGUMENT);
  expect(state.flags[FLAGS.finaleStage]).toBe('rush');
  return state;
}

/** Moving, and one nonlethal attempt has been made and has failed. */
function handsTried(): GameState {
  const state = typeAll(moving(), ['hold them']);
  expect(state.flags[FLAGS.triedToStopThem]).toBe(true);
  return state;
}

/** Them dead, the hero alive, the pillar untouched. */
function afterTheKilling(): GameState {
  return typeAll(handsTried(), ['kill them']);
}

/* ================================================================ *
 * 1. The room, and the two of them
 * ================================================================ */

describe('the room holds two of the same person and keeps them apart', () => {
  it('starts with them alive, alarmed, and the seam not yet open', () => {
    const state = arrived();
    expect(hasReturned(state)).toBe(true);
    expect(state.flags[FLAGS.finaleStage]).toBe('arrival');
    expect(state.flags[FLAGS.earlierSelfDead]).toBeUndefined();
    expect(state.flags[FLAGS.passageOpen]).toBe(true); // the hero's own history
    const described = stripMarkup(type(state, 'look').events.map((e) => e.text).join('\n'));
    expect(described).toContain('reading as a shadow instead of a cut');
    expect(described).toContain('The pivoted wall is not open');
  });

  it('keeps the two lanterns distinguishable and separately owned', () => {
    const state = arrived();
    expect(state.inventory).toContain('lantern');
    // One lantern record in the save, and it is the hero's.
    expect(Object.keys(state.placements).filter((k) => k === 'lantern')).toHaveLength(1);
    expect(state.placements['lantern']).toEqual({ kind: 'carried' });

    // Bare "lantern" is the hero's, and the refusal points at the other one.
    const mine = type(state, 'take lantern');
    expect(mine.accepted).toBe(false);
    expect(lastText(mine)).toContain('THEIR LANTERN');

    // Theirs is addressable, examinable, and not an inventory entry.
    expect(type(state, 'examine their lantern').accepted).toBe(true);
    const taken = type(state, 'take their lantern');
    expect(taken.accepted).toBe(true);
    expect(taken.state.inventory.filter((i) => i === 'lantern')).toHaveLength(1);
    expect(taken.state.flags[FLAGS.tookTheirLamp]).toBe(true);
  });

  it('describes the hero\'s own lantern where it actually is', () => {
    const state = arrived();
    const held = stripMarkup(type(state, 'look').events.map((e) => e.text).join('\n'));
    expect(held).toContain('Your own lantern is in your hand');

    const down = typeAll(state, ['drop lantern']);
    const put = stripMarkup(type(down, 'look').events.map((e) => e.text).join('\n'));
    expect(put).toContain('wherever you put it down');
    expect(put).not.toContain('is in your hand');
    // And it is recoverable, in both modes.
    const chip = getAffordances(down).objects.find((o) => o.id === 'lantern');
    expect(chip).toBeDefined();
    expect(resolve(down, chip!.actions.find((a) => a.label === 'Take')!.action).state.inventory).toContain(
      'lantern'
    );
  });

  it('puts the earlier self here and only here, with both eyes and no journey', () => {
    const state = arrived();
    expect(getAffordances(state).people.map((p) => p.key)).toEqual(['talk-earlier_self']);
    const look = stripMarkup(lastText(type(state, 'examine them')));
    expect(look).toContain('Two eyes');
    // Nothing they are wearing can have come from a journey they have not made.
    for (const pattern of [/lime dust/i, /linen/i, /one eye/i, /mallet/i]) {
      expect(look, `their appearance matches ${pattern}`).not.toMatch(pattern);
    }

    // And nobody is in that room during the opening.
    const opening = typeAll(begin(), TO_SEALED);
    expect(getAffordances(opening).people).toEqual([]);
  });

  it('keeps the injury, and never puts it in the interface', () => {
    const state = arrived();
    expect(state.flags[FLAGS.lostEye]).toBe(true);
    const everything = stripMarkup(state.transcript.map((e) => e.text).join('\n'));
    // The jaw was never injured; the pressure in it is the fold, as in every era.
    expect(everything).not.toMatch(/still has a hinge|side that still has one/);
    expect(everything).not.toMatch(/breathing like a man/);
  });
});

/* ================================================================ *
 * 2. Nothing is on a clock
 * ================================================================ */

describe('nothing in the finale advances on its own', () => {
  it('leaves the scene exactly where it was through looking and reading', () => {
    const start = moving();
    const idle = typeAll(start, [
      'look',
      'examine them',
      'examine pillar',
      'examine seam',
      'examine their lantern',
      'journal',
      'inventory',
      'hint',
      'hint',
      'hint',
      'help',
      'exits',
      'wait',
      'wait',
      'look',
    ]);
    expect(idle.flags[FLAGS.theirReach]).toBe(start.flags[FLAGS.theirReach]);
    expect(idle.flags[FLAGS.finaleStage]).toBe('rush');
    expect(idle.flags[FLAGS.earlierSelfDead]).toBeUndefined();
    expect(idle.flags[FLAGS.passageOpen]).toBe(start.flags[FLAGS.passageOpen]);
    expect(idle.locationId).toBe('present.sealed_chamber');
  });

  it('says plainly that waiting is allowed and does not help', () => {
    const waited = type(moving(), 'wait');
    expect(waited.accepted).toBe(true);
    expect(lastText(waited)).toContain('as much time as you want');
  });

  it('never lets them cross, however long the player leaves it', () => {
    const state = typeAll(moving(), [
      ...THE_HANDS,
      ...THE_HANDS,
      ...THE_HANDS,
      'wait',
      'wait',
      'wait',
    ]);
    // Reach caps. The moment holds, and the hero is still the one who has to end it.
    expect(state.flags[FLAGS.theirReach]).toBe(3);
    expect(state.flags[FLAGS.earlierSelfDead]).toBeUndefined();
    expect(state.chapter).toBe('return');
    expect(state.flags[FLAGS.caveDestroyed]).toBeUndefined();
  });

  it('answers leaving in fiction at every stage, and keeps the scene', () => {
    for (const [name, state, expected] of [
      ['before they move', arrived(), /came a hundred years for the next three minutes/],
      ['while they move', moving(), /stone grinding on stone/],
      ['afterwards', afterTheKilling(), /does not take that plank down/],
    ] as const) {
      const left = type(state, 'west');
      expect(left.accepted, name).toBe(false);
      expect(left.state.locationId, name).toBe('present.sealed_chamber');
      expect(lastText(left), name).toMatch(expected);
    }
  });
});

/* ================================================================ *
 * 3. The argument
 * ================================================================ */

describe('every attempt to reach them lands somewhere different', () => {
  it('doubts the claim, and then accepts the lantern', () => {
    const said = type(typeAll(arrived(), ['talk to them']), 'show self');
    expect(said.accepted).toBe(true);
    expect(said.state.flags[FLAGS.claimedIdentity]).toBe(true);
    expect(said.state.flags[FLAGS.identityAccepted]).toBeUndefined();
    expect(lastText(said)).toContain('Anybody could have been told that');

    const shown = type(said.state, 'show lantern');
    expect(shown.state.flags[FLAGS.identityAccepted]).toBe(true);
    expect(stripMarkup(lastText(shown))).toContain("That's mine");
  });

  it('settles who without settling what either of them should do', () => {
    const shown = typeAll(arrived(), ['talk to them', 'show lantern']);
    expect(shown.flags[FLAGS.identityAccepted]).toBe(true);
    // Identity accepted, and they are more certain rather than less.
    expect(stripMarkup(shown.transcript.map((e) => e.text).join('\n'))).toContain(
      'Then the cave *works*'
    );
    // And it has not ended the argument or started the rush on its own.
    expect(shown.flags[FLAGS.finaleStage]).toBe('talking');
  });

  it('gives the journal and the ruined valley their own answers, not one refusal', () => {
    const base = typeAll(arrived(), ['talk to them', 'show lantern']);
    const journal = stripMarkup(lastText(type(base, 'show journal')));
    const future = stripMarkup(lastText(type(base, 'tell them about the future')));
    const origin = stripMarkup(lastText(type(base, 'tell them about the prophecy')));

    // Each one is a different objection, and none of them is "it is a trick".
    expect(journal).toContain('You went *forward*');
    expect(future).toContain('How');
    expect(origin).toContain("Then the last one's mine as well");
    expect(new Set([journal, future, origin]).size).toBe(3);
    for (const text of [journal, future, origin]) {
      expect(text).not.toMatch(/a trick|you are lying|I do not believe you/i);
    }
  });

  it('admits the hero cannot explain the mechanism, and is heard', () => {
    const told = typeAll(arrived(), ['talk to them', 'tell them about the future']);
    const text = stripMarkup(told.transcript.map((e) => e.text).join('\n'));
    expect(text).toContain('I do not know');
    expect(text).toContain("No,");
    // And nothing anywhere in the finale explains it either.
    const whole = stripMarkup(finishTheStory(arrived()).transcript.map((e) => e.text).join('\n'));
    for (const pattern of [
      /paradox/i,
      /space-?time/i,
      /causal/i,
      /timeline/i,
      /singularit/i,
      /anchor/i,
      /because you travelled/i,
    ]) {
      expect(whole, `the finale matches ${pattern}`).not.toMatch(pattern);
    }
  });

  it('makes them decide only once they know who you are and what you claim', () => {
    // Identity alone is not enough.
    const identityOnly = typeAll(arrived(), ['talk to them', 'show self', 'show lantern', 'show journal']);
    expect(identityOnly.flags[FLAGS.finaleStage]).toBe('talking');

    // The claim alone is not enough either.
    const claimOnly = typeAll(arrived(), ['talk to them', 'tell them about the prophecy']);
    expect(claimOnly.flags[FLAGS.finaleStage]).toBe('talking');

    // Both, and they go.
    const both = typeAll(claimOnly, ['show lantern']);
    expect(both.flags[FLAGS.finaleStage]).toBe('rush');
    expect(both.objective).toBe(OBJECTIVES.stopThem);
    expect(stripMarkup(both.transcript.map((e) => e.text).join('\n'))).toContain('And they move');
  });

  it('does not repeat itself when the player repeats themselves', () => {
    const twice = typeAll(arrived(), ['talk to them', 'show lantern', 'show lantern', 'show lantern']);
    const occurrences = stripMarkup(twice.transcript.map((e) => e.text).join('\n')).split(
      "That's mine"
    ).length;
    expect(occurrences).toBe(2); // said once
    expect(twice.journal.filter((e) => e.id === 'j.lanterns')).toHaveLength(1);
  });
});

/* ================================================================ *
 * 4. Hands
 * ================================================================ */

describe('the physical attempts work, and are answered', () => {
  it('blocks the wall, and is gone round', () => {
    const start = moving();
    const blocked = type(start, 'block wall');
    expect(blocked.accepted).toBe(true);
    expect(blocked.state.flags[FLAGS.blockingWall]).toBe(true);
    expect(stripMarkup(lastText(blocked))).toContain('for a second it works');
    expect(blocked.state.flags[FLAGS.theirReach]).toBe(1);
  });

  it('takes their light, which works completely and is undone', () => {
    const took = type(moving(), 'take their lantern');
    expect(took.accepted).toBe(true);
    const text = stripMarkup(lastText(took));
    expect(text).toContain('the seam stops existing');
    // Answered on the object's own terms: the striker is bolted to the base.
    expect(text).toContain('bolted to the base');
    expect(took.state.flags[FLAGS.tookTheirLamp]).toBe(true);
  });

  it('gets hold of them, and loses them for a stated reason', () => {
    const held = type(moving(), 'hold them');
    expect(held.accepted).toBe(true);
    expect(held.state.flags[FLAGS.restrainedThem]).toBe(true);
    const text = stripMarkup(lastText(held));
    expect(text).toContain('you have them');
    expect(text).toContain('not the same strength');
  });

  it('leaves every nonlethal attempt recoverable, and none of them fatal', () => {
    const tried = typeAll(moving(), THE_HANDS);
    expect(tried.flags[FLAGS.earlierSelfDead]).toBeUndefined();
    expect(tried.inventory).toContain('mallet');
    expect(tried.chapter).toBe('return');
    // And the ending is still reachable afterwards.
    expect(hasFinished(typeAll(tried, ['kill them', 'break pillar', 'break pillar', 'break pillar', 'swing']))).toBe(
      true
    );
  });

  it('does not create a way for both of them to live', () => {
    // Everything nonlethal, several times over.
    const exhausted = typeAll(moving(), [...THE_HANDS, ...THE_HANDS, ...THE_HANDS]);
    expect(exhausted.flags[FLAGS.earlierSelfDead]).toBeUndefined();
    expect(exhausted.flags[FLAGS.caveDestroyed]).toBeUndefined();
    expect(exhausted.chapter).toBe('return');
    // The pillar will not take a blow while they are alive.
    const swung = type(exhausted, 'break pillar');
    expect(swung.accepted).toBe(false);
    expect(lastText(swung)).toContain('would be under it');
    expect(swung.state.flags[FLAGS.pillarStruck]).toBeUndefined();
  });
});

/* ================================================================ *
 * 5. The killing
 * ================================================================ */

describe('the killing requires the moment, and happens once', () => {
  it('refuses on arrival, with the reason', () => {
    const early = type(arrived(), 'kill them');
    expect(early.accepted).toBe(false);
    expect(early.state.flags[FLAGS.earlierSelfDead]).toBeUndefined();
    expect(lastText(early)).toContain('not said a word to them');
  });

  it('refuses while they are still talking to you', () => {
    const talking = type(typeAll(arrived(), ['talk to them', 'show lantern']), 'kill them');
    expect(talking.accepted).toBe(false);
    expect(lastText(talking)).toContain('while they are *talking* to you');
  });

  it('attributes the plank to the hand that actually wrote it', () => {
    /*
     * Saffra asked for the words a second time, slower, and took them down in
     * char on an offcut of board. The words are Basil's; the handwriting is
     * hers. Nothing in the finale may claim Basil wrote the plank — the whole
     * point of the origin is that they only ever said it out loud.
     */
    const finale = Object.values(FINALE_TEXT)
      .flatMap((value) =>
        typeof value === 'string' ? [value] : Array.isArray(value) ? value : []
      )
      .filter((value): value is string => typeof value === 'string')
      .map(stripMarkup);
    for (const passage of finale) {
      if (!/plank|board/i.test(passage)) continue;
      expect(passage, passage.slice(0, 60)).not.toMatch(/your own handwriting/i);
      expect(passage, passage.slice(0, 60)).not.toMatch(/their own handwriting/i);
    }
    expect(stripMarkup(FINALE_TEXT.LEAVE_AFTER)).toContain("Saffra's careful hand");
  });

  it('refuses until one nonlethal attempt has been made and failed', () => {
    const untried = type(moving(), 'kill them');
    expect(untried.accepted).toBe(false);
    expect(untried.state.flags[FLAGS.earlierSelfDead]).toBeUndefined();
    // The refusal is Basil's, and it names what there is to try.
    const text = stripMarkup(lastText(untried));
    expect(text).toContain('not laid a hand on them');
    expect(text).toMatch(/get hold of them/i);
  });

  it('leaves an old confrontation save viable without fabricating anything', () => {
    /*
     * A save written before the attempt was required sits at `rush` with no
     * `tried_to_stop_them`. The right answer is neither to migrate a failure
     * the player never made nor to strand them: every intervention is still
     * available in that room, so one of them unlocks it exactly as it would in
     * a new game. No schema change, no invented history.
     */
    const legacy = { ...moving() };
    delete legacy.flags[FLAGS.triedToStopThem];
    delete legacy.flags[FLAGS.theirReach];

    const stuck = type(legacy, 'kill them');
    expect(stuck.accepted).toBe(false);

    const unstuck = typeAll(legacy, ['block wall']);
    expect(unstuck.flags[FLAGS.triedToStopThem]).toBe(true);
    const killed = type(unstuck, 'kill them');
    expect(killed.accepted).toBe(true);
    expect(hasFinished(typeAll(killed.state, ['break pillar', 'break pillar', 'break pillar', 'swing']))).toBe(true);
  });

  it('never reopens a death that a save already committed', () => {
    // The gate is a prerequisite for killing, not a condition for staying dead.
    const dead = { ...afterTheKilling() };
    delete dead.flags[FLAGS.triedToStopThem];
    expect(dead.flags[FLAGS.earlierSelfDead]).toBe(true);
    expect(getAffordances(dead).people).toEqual([]);
    expect(type(dead, 'kill them').accepted).toBe(false);
    expect(hasFinished(typeAll(dead, ['break pillar', 'break pillar', 'break pillar', 'swing']))).toBe(
      true
    );
  });

  it('does not accept an attempt made before they had decided anything', () => {
    /*
     * Grabbing them or lifting their lamp out of the dish during the argument
     * failed at nothing that matters: they were not going anywhere yet. The
     * refusal says so rather than pretending nothing was tried, and the kill
     * stays shut until they are moving and an attempt has visibly failed.
     */
    for (const early of ['hold them', 'take their lantern']) {
      const before = typeAll(arrived(), ['talk to them', 'show lantern', early]);
      expect(before.flags[FLAGS.triedToStopThem], early).toBeUndefined();

      const nowMoving = typeAll(before, ['tell them about the prophecy']);
      expect(nowMoving.flags[FLAGS.finaleStage], early).toBe('rush');
      const refused = type(nowMoving, 'kill them');
      expect(refused.accepted, early).toBe(false);
      expect(stripMarkup(lastText(refused))).toContain('before they had decided anything');
      expect(getAffordances(nowMoving).meta.some((m) => m.key === 'kill'), early).toBe(false);

      // Doing it again, now that it means something, opens it.
      const again = typeAll(nowMoving, [early]);
      expect(again.flags[FLAGS.triedToStopThem], early).toBe(true);
      expect(type(again, 'kill them').accepted, early).toBe(true);
    }
  });

  it('is unlocked by any one of the three, and does not require all of them', () => {
    for (const attempt of ['hold them', 'take their lantern', 'block wall']) {
      const after = typeAll(moving(), [attempt]);
      expect(after.flags[FLAGS.triedToStopThem], attempt).toBe(true);
      const killed = type(after, 'kill them');
      expect(killed.accepted, attempt).toBe(true);
      expect(killed.state.flags[FLAGS.earlierSelfDead], attempt).toBe(true);
    }
  });

  it('does not count standing in front of the wall before they move', () => {
    /*
     * Blocking the wall while they are still talking is not a failed attempt —
     * they have not tried to get past, so nothing has been tested. The same
     * verb counts once they are moving, which is the previous test.
     */
    const early = typeAll(arrived(), ['talk to them', 'block wall']);
    expect(early.flags[FLAGS.blockingWall]).toBe(true);
    expect(early.flags[FLAGS.triedToStopThem]).toBeUndefined();
  });

  it('is not reachable through a generic use of the tool', () => {
    const state = moving();
    const used = type(state, 'use mallet on them');
    // It either refuses or routes to the named act — it never does it quietly.
    if (used.accepted) {
      expect(used.state.flags[FLAGS.earlierSelfDead]).toBe(true);
      expect(stripMarkup(lastText(used))).toContain('One blow');
    } else {
      expect(used.state.flags[FLAGS.earlierSelfDead]).toBeUndefined();
    }
  });

  it('needs the tool, and says so', () => {
    const empty = typeAll(handsTried(), ['drop mallet']);
    const bare = type(empty, 'kill them');
    expect(bare.accepted).toBe(false);
    expect(lastText(bare)).toContain('not going to do this with your hands');
    // Recoverable.
    const back = typeAll(empty, ['take mallet']);
    expect(back.inventory).toContain('mallet');
    expect(type(back, 'kill them').accepted).toBe(true);
  });

  it('is offered as a labelled action in selectable mode, and only when eligible', () => {
    expect(getAffordances(arrived()).meta.some((m) => m.key === 'kill')).toBe(false);
    const talking = typeAll(arrived(), ['talk to them', 'show lantern']);
    expect(getAffordances(talking).meta.some((m) => m.key === 'kill')).toBe(false);

    // Moving, but nothing tried: still not offered.
    expect(getAffordances(moving()).meta.some((m) => m.key === 'kill')).toBe(false);

    const ready = getAffordances(handsTried()).meta.find((m) => m.key === 'kill');
    expect(ready).toBeDefined();
    // The label says what it does. No button anywhere reads "use the mallet".
    expect(ready!.label).toBe('Kill them with the mallet');
    const done = resolve(handsTried(), ready!.action);
    expect(done.state.flags[FLAGS.earlierSelfDead]).toBe(true);
  });

  it('does not appear as a button anywhere before the finale', () => {
    for (const state of [begin(), typeAll(begin(), TO_SEALED), arrived()]) {
      const labels = getAffordances(state).meta.map((m) => m.label.toLowerCase());
      expect(labels.some((l) => l.includes('kill'))).toBe(false);
    }
  });

  it('happens once, with restraint, and leaves the hero standing', () => {
    const dead = afterTheKilling();
    expect(dead.flags[FLAGS.earlierSelfDead]).toBe(true);
    expect(dead.flags[FLAGS.finaleStage]).toBe('dead');
    expect(dead.flags[FLAGS.heroDead]).toBeUndefined();
    expect(dead.objective).toBe(OBJECTIVES.destroy);
    expect(dead.journal.filter((e) => e.id === 'j.killed')).toHaveLength(1);

    const text = stripMarkup(dead.transcript.map((e) => e.text).join('\n'));
    expect(text).toContain('One blow');
    expect(text).toContain('You are still here');
    // No triumph, no reward, no gore, and no account of why they persist.
    for (const pattern of [/victor/i, /triumph/i, /you win/i, /blood everywhere/i, /singularit/i, /score/i]) {
      expect(text, `the killing matches ${pattern}`).not.toMatch(pattern);
    }
  });

  it('cannot be done twice, and ends the conversation for good', () => {
    const dead = afterTheKilling();
    const again = typeAll(dead, ['kill them', 'kill them', 'talk to them', 'show lantern', 'hold them']);
    expect(again.journal.filter((e) => e.id === 'j.killed')).toHaveLength(1);
    expect(again.pending).toBeNull();
    expect(getAffordances(again).people).toEqual([]);
    expect(getAffordances(again).meta.some((m) => m.key === 'kill')).toBe(false);

    // And they cannot cross: there is nobody to do it.
    expect(again.flags[FLAGS.finaleStage]).toBe('dead');
  });

  it('survives a reload without replaying', () => {
    const dead = afterTheKilling();
    expect(writeAutosave(dead).working).toBe(true);
    const reloaded = loadBest().state!;
    expect(progressOf(reloaded)).toEqual(progressOf(dead));
    const after = typeAll(reloaded, ['look', 'kill them']);
    expect(after.journal.filter((e) => e.id === 'j.killed')).toHaveLength(1);
  });
});

/* ================================================================ *
 * 6. The pillar, and the end
 * ================================================================ */

describe('the destruction is paid for and deliberate', () => {
  it('gives the hero the pillar\'s evidence here, even if they skipped it before', () => {
    // A run that never examined the pillar in Chapter 1 or the workings.
    const dead = afterTheKilling();
    expect(dead.flags[FLAGS.sawPillar]).toBeUndefined();
    const looked = type(dead, 'examine pillar');
    expect(looked.accepted).toBe(true);
    const text = stripMarkup(lastText(looked));
    expect(text).toContain('crack');
    expect(text).toContain('holding the roof');
    // Still ordinary stone: no century of rupture, no portent.
    for (const pattern of [/century/i, /rupture/i, /destin/i, /omen/i]) {
      expect(text, `the pillar matches ${pattern}`).not.toMatch(pattern);
    }
  });

  it('warns that the way out is closing before the blow that closes it', () => {
    const dead = afterTheKilling();
    const one = type(dead, 'break pillar');
    expect(one.accepted).toBe(true);
    expect(one.state.flags[FLAGS.pillarStruck]).toBe(1);
    expect(one.state.flags[FLAGS.escapeClosed]).toBeUndefined();

    /*
     * The risk has to be legible before it is taken, not explained once it is
     * irreversible. Three places say it after the first blow and before the
     * second: the blow's own narration, the exit itself, and the pillar.
     */
    const blow = stripMarkup(lastText(one));
    expect(blow).toContain('the hill speaks');
    expect(blow).toContain('the squeeze is narrower than it was');
    expect(blow).toMatch(/one more of these and you will not be walking out/i);

    const west = type(one.state, 'west');
    expect(west.accepted).toBe(false);
    const exit = stripMarkup(lastText(west));
    expect(exit).toContain('It is narrower');
    expect(exit).toMatch(/if you swing again you will not be able to/i);

    const looked = stripMarkup(lastText(type(one.state, 'examine pillar')));
    expect(looked).toMatch(/hit it again and the way out closes/i);

    // The journal carries it too, for a player who comes back to this later.
    expect(
      one.state.journal.some((e) => /squeeze west is narrower/.test(e.text)),
      'the first blow is journalled with the cost'
    ).toBe(true);
  });

  it('escalates, and closes the way out physically before the commitment', () => {
    const one = type(afterTheKilling(), 'break pillar');

    const two = type(one.state, 'break pillar');
    expect(two.state.flags[FLAGS.pillarStruck]).toBe(2);
    expect(two.state.flags[FLAGS.escapeClosed]).toBe(true);
    const text = stripMarkup(lastText(two));
    // The cost is stated plainly before the commitment, as physical facts.
    expect(text).toContain('the squeeze is shut');
    expect(text).toContain('Including you');
    expect(two.state.objective).toBe(OBJECTIVES.finish);

    // And now the exit is shut, physically, not by assertion.
    const shut = type(two.state, 'west');
    expect(shut.accepted).toBe(false);
    expect(lastText(shut)).toContain("hand's width of air");

    // The pillar agrees with the room.
    expect(stripMarkup(lastText(type(two.state, 'examine pillar')))).toContain(
      'no way out of this room'
    );
  });

  it('asks before the last one, in both modes, and takes no for an answer', () => {
    const two = typeAll(afterTheKilling(), ['break pillar', 'break pillar']);
    const asked = type(two, 'break pillar');
    expect(asked.accepted).toBe(false);
    expect(asked.state.pending?.kind).toBe('clarification');
    expect(asked.state.flags[FLAGS.caveDestroyed]).toBeUndefined();

    // Selectable mode gets the same question as buttons.
    const options = getAffordances(asked.state).clarification;
    expect(options?.options.map((o) => o.label)).toEqual(['Swing', 'Not yet']);

    // Declining leaves everything exactly where it was.
    const declined = typeAll(asked.state, ['not yet']);
    expect(declined.pending).toBeNull();
    expect(declined.flags[FLAGS.pillarStruck]).toBe(2);
    expect(declined.flags[FLAGS.caveDestroyed]).toBeUndefined();
    expect(declined.chapter).toBe('return');

    // And it can be asked again, and answered.
    const committed = typeAll(declined, ['break pillar', 'swing']);
    expect(committed.flags[FLAGS.caveDestroyed]).toBe(true);
  });

  it('ends it: both dead, the cave gone, and no play afterwards', () => {
    const end = finishTheStory(arrived());
    expect(hasFinished(end)).toBe(true);
    expect(end.flags[FLAGS.pillarStruck]).toBe(3);
    expect(end.objective).toBe(OBJECTIVES.over);
    expect(end.locationId).toBe('present.sealed_chamber');
    expect(validateSave(JSON.parse(serialize(end))).ok).toBe(true);

    const text = stripMarkup(end.transcript.map((e) => e.text).join('\n'));
    expect(text).toContain('It takes about nine seconds');
    // Nothing survives and nothing is explained away.
    for (const pattern of [/rescued/i, /pulled .* out/i, /another portal/i, /somehow survived/i]) {
      expect(text, `the ending matches ${pattern}`).not.toMatch(pattern);
    }

    // Ordinary play does not resume.
    for (const line of ['look', 'west', 'take mallet', 'break pillar', 'examine them', 'wait']) {
      const tried = type(end, line);
      if (line === 'look') continue;
      expect(tried.accepted, line).toBe(false);
      expect(tried.state.chapter, line).toBe('ending');
      expect(tried.state.flags[FLAGS.pillarStruck], line).toBe(3);
    }
  });

  it('cannot reach the destruction without the death, in any order', () => {
    const alive = moving();
    for (const line of ['break pillar', 'break pillar with the last one', 'swing']) {
      const tried = type(alive, line);
      expect(tried.state.flags[FLAGS.caveDestroyed], line).toBeUndefined();
      expect(tried.state.flags[FLAGS.pillarStruck], line).toBeUndefined();
      expect(tried.state.chapter, line).toBe('return');
    }
    // And dispatched directly, not just typed.
    const direct = resolve(alive, { type: 'BREAK', target: 'sealed.pillar', using: 'the last one' });
    expect(direct.accepted).toBe(false);
    expect(direct.state.flags[FLAGS.caveDestroyed]).toBeUndefined();
  });
});

/* ================================================================ *
 * 7. The epilogue and the ending state
 * ================================================================ */

describe('the ending is an ending', () => {
  it('shows the aftermath once, from the village, and says it is doing so', () => {
    const end = finishTheStory(arrived());
    const epilogue = end.transcript.filter((e) => e.heading === 'Afterwards');
    expect(epilogue).toHaveLength(1);
    const text = stripMarkup(epilogue[0]!.text);
    expect(text).toContain('The village, that evening and after');
    // Somebody is missing and the village knows who.
    expect(text).toContain('Somebody is missing, and the whole square knows exactly who');
    expect(text).not.toMatch(/nobody is missing/i);
    // Tyme waits and digs.
    expect(text).toContain('Tyme');
    expect(text).toContain('shovels');
    // The rite ends because the cave is gone.
    expect(text).toContain('The rite ends');
  });

  it('contrasts the saved valley with the one the hero walked through', () => {
    const text = stripMarkup(
      finishTheStory(arrived()).transcript.filter((e) => e.heading === 'Afterwards')[0]!.text
    );
    // Each of these is a thing the ruined century explicitly did not have.
    expect(text).toContain('no cap on it'); // there, capped and pumped, one bucket each
    expect(text).toContain('two hundred and sixty-one'); // there, thirty
    expect(text).toContain('swing'); // there, the tree and the turn were gone
    expect(text).toContain('sky is doing things'); // there, a ceiling with no weather in it
    // And no account of why.
    for (const pattern of [/because the hero/i, /paradox/i, /restored/i, /timeline/i]) {
      expect(text, `the epilogue matches ${pattern}`).not.toMatch(pattern);
    }
  });

  it('only narrates putting the lantern down if it is still in hand', () => {
    const ready = typeAll(afterTheKilling(), ['break pillar', 'break pillar']);

    const carried = typeAll(ready, ['break pillar', 'swing']);
    const carriedText = stripMarkup(carried.transcript.map((e) => e.text).join('\n'));
    expect(carried.inventory).not.toContain('lantern');
    expect(carriedText).toContain('set your own lantern on the floor');

    // Already put down earlier: the hero does not do it twice.
    const dropped = typeAll(ready, ['drop lantern']);
    expect(dropped.inventory).not.toContain('lantern');
    const after = typeAll(dropped, ['break pillar', 'swing']);
    const afterSacrifice = stripMarkup(
      after.transcript
        .slice(dropped.transcript.length)
        .map((e) => e.text)
        .join('\n')
    );
    expect(afterSacrifice).not.toContain('set your own lantern on the floor');
    // And it still ends, with the lamp lying where they left it.
    expect(hasFinished(after)).toBe(true);
    expect(after.placements['lantern']).toEqual({
      kind: 'room',
      locationId: 'present.sealed_chamber',
    });
  });

  it('counts the chapters it actually has', () => {
    const end = finishTheStory(arrived());
    const marker = end.transcript.filter((e) => e.kind === 'system').at(-1)!.text;
    expect(marker).toContain('Four chapters');
  });

  it('keeps the prophecy exact and does not explain how it fits', () => {
    const end = finishTheStory(arrived());
    const whole = stripMarkup(end.transcript.map((e) => e.text).join('\n'));
    for (const line of PROPHECY_LINES) {
      expect(whole, line).toContain(line);
    }
    const epilogue = stripMarkup(
      end.transcript.filter((e) => e.heading === 'Afterwards')[0]!.text
    );
    // Sage writes her one line and stops.
    expect(epilogue).toContain('They came true');
    /*
     * And the epilogue does not rate that line or arrange the facts into a fit
     * on the reader's behalf. Which part came true is the reader's problem,
     * which is the only place it can honestly sit.
     */
    for (const pattern of [
      /entirely accurate/i,
      /which part/i,
      /work it out/i,
      /no arrangement/i,
    ]) {
      expect(epilogue, `the epilogue matches ${pattern}`).not.toMatch(pattern);
    }
    // No tidy moral, no absolution, no explanation of every clue.
    for (const pattern of [/forgive/i, /at peace/i, /learned that/i, /the lesson/i, /redeem/i]) {
      expect(epilogue, `the epilogue matches ${pattern}`).not.toMatch(pattern);
    }
  });

  it('offers reading, not replaying', () => {
    const end = finishTheStory(arrived());
    const before = {
      flags: { ...end.flags },
      journal: end.journal.map((e) => e.id),
      chapter: end.chapter,
    };
    const reviewed = type(end, 'review');
    expect(reviewed.state.flags).toEqual(before.flags);
    expect(reviewed.state.journal.map((e) => e.id)).toEqual(before.journal);
    expect(reviewed.state.chapter).toBe(before.chapter);
    // The text is printed again.
    expect(reviewed.state.transcript.filter((e) => e.heading === 'Afterwards')).toHaveLength(2);

    // And the panel offers it, with no command line.
    const meta = getAffordances(end).meta.map((m) => m.key);
    expect(meta).toContain('review');
    expect(getAffordances(end).exits).toEqual([]);
    expect(getAffordances(end).people).toEqual([]);
  });

  it('does not pretend anything is coming', () => {
    const end = finishTheStory(arrived());
    const system = end.transcript.filter((e) => e.kind === 'system').map((e) => e.text).join('\n');
    expect(system).toContain('— The end —');
    for (const pattern of [/not implemented/i, /coming soon/i, /not written yet/i, /end of the current content/i]) {
      expect(system, `the ending marker matches ${pattern}`).not.toMatch(pattern);
    }
  });

  it('reloads as finished, and keeps the finale checkpoint to go back to', () => {
    const before = typeAll(afterTheKilling(), ['break pillar', 'break pillar']);
    // The checkpoint this game last wrote is the start of the last chapter.
    expect(writeCheckpoint(arrived()).working).toBe(true);
    const end = typeAll(before, ['break pillar', 'swing']);
    expect(writeAutosave(end).working).toBe(true);

    const reloaded = loadBest().state!;
    expect(hasFinished(reloaded)).toBe(true);
    expect(progressOf(reloaded)).toEqual(progressOf(end));
    // Finished, not a fresh confrontation and not a living hero.
    expect(reloaded.flags[FLAGS.finaleStage]).toBe('pillar');
    expect(type(reloaded, 'west').accepted).toBe(false);

    const checkpoint = readSlot('checkpoint');
    expect(checkpoint.error).toBeNull();
    expect(checkpoint.state?.chapter).toBe('return');
    expect(checkpoint.state?.flags[FLAGS.earlierSelfDead]).toBeUndefined();
    expect(checkpoint.state?.flags[FLAGS.heroDead]).toBeUndefined();
    expect(checkpoint.state?.inventory).toContain('mallet');
  });

  it('exports and imports a finished save as finished', () => {
    const end = finishTheStory(arrived());
    const round = importFromText(serialize(end));
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    expect(hasFinished(round.state)).toBe(true);
    expect(progressOf(round.state)).toEqual(progressOf(end));
  });

  it('points the hint ladder at the end, and does not pretend otherwise', () => {
    expect(hintContext(arrived())).toBe('confront');
    expect(hintContext(afterTheKilling())).toBe('finish');
    const end = finishTheStory(arrived());
    expect(hintContext(end)).toBe('done');
    expect(nextHint(end).text).toContain('end of the story');
    expect(nextHint(end).text).not.toContain('not written');
  });
});

/* ================================================================ *
 * 8. Saves at every stage
 * ================================================================ */

describe('every stage of the finale round-trips', () => {
  it('validates and reloads at each beat', () => {
    const points: Array<[string, GameState]> = [];
    let state = arrived();
    points.push(['arrival', state]);
    state = typeAll(state, ['talk to them', 'show self', 'show lantern']);
    points.push(['mid-argument, mid-conversation', state]);
    state = typeAll(state, ['tell them about the prophecy']);
    points.push(['they have decided', state]);
    state = typeAll(state, ['block wall', 'hold them']);
    points.push(['physical', state]);
    state = typeAll(state, ['kill them']);
    points.push(['after the killing', state]);
    state = typeAll(state, ['break pillar', 'break pillar']);
    points.push(['before the commitment', state]);
    state = typeAll(state, ['break pillar']);
    points.push(['mid-confirmation', state]);
    state = typeAll(state, ['swing']);
    points.push(['finished', state]);

    for (const [name, point] of points) {
      const result = validateSave(JSON.parse(serialize(point)));
      expect(result.ok, `${name} should validate`).toBe(true);
      if (!result.ok) continue;
      expect(result.state, name).toEqual(point);
    }
  });

  it('resumes a pending confirmation coherently', () => {
    const asked = typeAll(afterTheKilling(), ['break pillar', 'break pillar', 'break pillar']);
    expect(asked.pending?.kind).toBe('clarification');
    expect(writeAutosave(asked).working).toBe(true);
    const reloaded = loadBest().state!;
    expect(reloaded.pending?.kind).toBe('clarification');
    // Both answers still work after the reload.
    expect(typeAll(reloaded, ['not yet']).flags[FLAGS.caveDestroyed]).toBeUndefined();
    expect(typeAll(reloaded, ['swing']).flags[FLAGS.caveDestroyed]).toBe(true);
  });

  it('refuses imports that are incoherent about the deaths or the ending', () => {
    const end = finishTheStory(arrived());
    const dead = afterTheKilling();
    const cases: Array<[string, GameState, (d: Record<string, unknown>) => void, RegExp]> = [
      [
        'the cave down with them still alive',
        moving(),
        (d) => {
          const flags = d.flags as Record<string, unknown>;
          flags[FLAGS.caveDestroyed] = true;
          flags[FLAGS.pillarStruck] = 3;
        },
        /with the earlier self still alive/,
      ],
      [
        'a dead hero still walking about',
        dead,
        (d) => ((d.flags as Record<string, unknown>)[FLAGS.heroDead] = true),
        /without the thing that killed them/,
      ],
      [
        'the ending without the deaths',
        end,
        (d) => delete (d.flags as Record<string, unknown>)[FLAGS.earlierSelfDead],
        /disagrees with itself about whether the earlier self is alive/,
      ],
      [
        'finished somewhere else',
        end,
        (d) => (d.locationId = 'present.square'),
        /era and its location disagree|ends somewhere the story does not end/,
      ],
      [
        'a stage that does not exist',
        dead,
        (d) => ((d.flags as Record<string, unknown>)[FLAGS.finaleStage] = 'gloating'),
        /stage of the last chapter that does not exist/,
      ],
      [
        'blows on the pillar with somebody under it',
        moving(),
        (d) => ((d.flags as Record<string, unknown>)[FLAGS.pillarStruck] = 2),
        /swings at the pillar with somebody under it/,
      ],
      [
        'mid-conversation with the dead',
        dead,
        (d) => (d.pending = { kind: 'conversation', personId: 'earlier_self', heard: [] }),
        /mid-conversation with somebody who is dead/,
      ],
    ];

    for (const [name, base, corrupt, expected] of cases) {
      const file = JSON.parse(serialize(base)) as Record<string, unknown>;
      corrupt(file);
      const result = validateSave(file);
      expect(result.ok, name).toBe(false);
      if (result.ok) continue;
      expect(result.error, name).toMatch(expected);
    }
  });

  it('leaves the current game untouched when an import is refused', () => {
    const end = finishTheStory(arrived());
    expect(writeAutosave(end).working).toBe(true);
    const before = loadBest().state!;
    const bad = importFromText('{"schemaVersion":4,"chapter":"ending"}');
    expect(bad.ok).toBe(false);
    expect(progressOf(loadBest().state!)).toEqual(progressOf(before));
  });
});

/* ================================================================ *
 * 9. Both protagonists
 * ================================================================ */

describe('both protagonists reach the same ending', () => {
  it('finishes as either, with the two selves matching the choice', () => {
    for (const who of ['basil', 'basilia'] as const) {
      const end = finishTheStory(arrived(who));
      expect(hasFinished(end), who).toBe(true);
      expect(end.character, who).toBe(who);
    }

    const boy = finishTheStory(arrived('basil'));
    const girl = finishTheStory(arrived('basilia'));
    expect(boy.flags).toEqual(girl.flags);
    expect(boy.journal.map((e) => e.id)).toEqual(girl.journal.map((e) => e.id));
  });

  it('substitutes every authored placeholder, for either of them', () => {
    /*
     * An NPC line written with {they} or {name} and never passed through
     * `renderText` would print the braces at the player. Scanning a whole
     * playthrough is the only check that covers every topic in every room.
     */
    for (const who of ['basil', 'basilia'] as const) {
      const text = finishTheStory(arrived(who))
        .transcript.map((e) => [e.text, e.heading ?? '', e.subheading ?? ''].join('\n'))
        .join('\n');
      const leftovers = text.match(/\{[A-Za-z]+\}/g) ?? [];
      expect(leftovers, `${who} has unsubstituted placeholders`).toEqual([]);
    }
  });

  it('never calls either of them by the other one\'s name', () => {
    const boy = finishTheStory(arrived('basil'));
    const girl = finishTheStory(arrived('basilia'));
    const textOf = (s: typeof boy) => stripMarkup(s.transcript.map((e) => e.text).join('\n'));
    expect(textOf(girl)).not.toMatch(/\bBasil\b/);
    // Basil's own run may of course say Basil; Basilia must never appear in it.
    expect(textOf(boy)).not.toMatch(/\bBasilia\b/);
  });

  it('never calls the hero a man', () => {
    for (const who of ['basil', 'basilia'] as const) {
      const text = stripMarkup(finishTheStory(arrived(who)).transcript.map((e) => e.text).join('\n'));
      expect(text, who).not.toMatch(/\blike a man\b/);
    }
  });
});
