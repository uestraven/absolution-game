import type { GameState, NarrativeEvent, ResolveResult } from '../types';
import { FLAGS } from '../../content/flags';
import { OBJECTIVES } from '../../content/text';
import * as T from '../../content/confrontationText';
import {
  addJournal,
  commit,
  discover,
  flag as f,
  journalEvents,
  setObjective,
  type Draft,
} from '../mechanics';

/**
 * The confrontation.
 *
 * ## The transition table
 *
 * `flags.finale_stage` is the finale's only state machine. It is never derived
 * from the transcript, from a count of questions, or from how long the player
 * has taken; it moves only where this table says it moves.
 *
 * | Stage | What is happening | Moves on | To |
 * | --- | --- | --- | --- |
 * | `arrival` | They are on their feet with the pillar between you, and neither of you has said anything | the hero addresses them at all — TALK, SHOW, or any attempt | `talking` |
 * | `talking` | The argument. SHOW and the topics each do something different | the hero tells them where the words came from **or** what the century looks like, *and* they have accepted the identity | `rush` |
 * | `rush` | They have decided, and they are going for the wall. Hands work here; so does the mallet | the hero kills them — which the game refuses until one nonlethal attempt has been made and failed | `dead` |
 * | `dead` | Their lamp still burning in the alcove, the seam still on the wall, the prophecy still on a plank in a square | the first blow on the pillar | `pillar` |
 * | `pillar` | Three blows, the last one taken deliberately with its cost stated | the third blow | *chapter* `ending` |
 *
 * **Nothing advances on a clock.** There is no timer anywhere in the finale.
 * Examining, reading, the journal, hints, help, settings and mode switching
 * change nothing: the player can stop in the middle of this for as long as they
 * like, and the prose says so rather than pretending otherwise.
 *
 * `their_reach` (0–3) is the earlier self's distance from the wall. It moves
 * **only** on the hero's physical interventions, which are visible acts with
 * narrated consequences, and it caps at 3. They never cross: at full reach they
 * have a hand on the panel and the moment holds, because the hero is the one
 * who has to end it.
 *
 * ## What this is not
 *
 * Not a combat system. No hit points, no rolls, no reflexes, no stats. Every
 * outcome in here is authored and deterministic.
 *
 * And not a branch. The ending is settled: the earlier self dies and the hero
 * destroys the cave. What the player chooses is whether they tried everything
 * first, and the game's job is to make every one of those attempts land
 * somewhere real rather than bounce off the same refusal.
 *
 * One of them is required, though. Not a checklist — any single one will do —
 * but the killing is not available to somebody who has talked them round and
 * then reached straight for the mallet, because the reason Basil ends up doing
 * it is that their hands were not enough, and that has to have been played
 * rather than assumed. See `killRefusal`.
 */

export const FINALE_STAGES = ['arrival', 'talking', 'rush', 'dead', 'pillar'] as const;
export type FinaleStage = (typeof FINALE_STAGES)[number];

export function isFinaleStage(value: unknown): value is FinaleStage {
  return typeof value === 'string' && (FINALE_STAGES as readonly string[]).includes(value);
}

export function stageOf(state: GameState): FinaleStage {
  const raw = state.flags[FLAGS.finaleStage];
  return isFinaleStage(raw) ? raw : 'arrival';
}

export function reachOf(state: GameState): number {
  const raw = state.flags[FLAGS.theirReach];
  return typeof raw === 'number' && Number.isFinite(raw) ? Math.max(0, Math.min(3, raw)) : 0;
}

/** True while the earlier self is alive and in the room. */
export function theyAreHere(state: GameState): boolean {
  return state.chapter === 'return' && !f(state, FLAGS.earlierSelfDead);
}

/** The hero is alive until they bring the roof down on themselves. */
export function heroIsAlive(state: GameState): boolean {
  return !f(state, FLAGS.heroDead);
}

function setStage(draft: Draft, stage: FinaleStage): void {
  draft.flags[FLAGS.finaleStage] = stage;
}

/** Any address at all opens the argument. Idempotent. */
export function openTheArgument(draft: Draft): void {
  if (stageOf(draft) === 'arrival') setStage(draft, 'talking');
}

/**
 * Moves them a step nearer the wall, and describes it.
 *
 * Called by the hero's *physical* interventions only. Capped, so the scene can
 * hold indefinitely at full reach without anybody crossing and without the
 * player being hurried.
 */
function closeIn(draft: Draft, events: NarrativeEvent[]): void {
  if (stageOf(draft) !== 'rush') return;
  const next = Math.min(3, reachOf(draft) + 1);
  if (next === reachOf(draft)) {
    events.push({ kind: 'narration', text: T.REACH_HELD });
    return;
  }
  draft.flags[FLAGS.theirReach] = next;
  events.push({ kind: 'narration', text: T.REACH[next - 1]! });
}

/**
 * They decide. This is the hinge: the hero's best argument is the thing that
 * makes them move, because from where they are standing it makes the quest
 * more urgent rather than less.
 */
function theyDecide(draft: Draft, events: NarrativeEvent[]): void {
  if (stageOf(draft) !== 'talking') return;
  if (!f(draft, FLAGS.identityAccepted)) return;
  if (!f(draft, FLAGS.toldOrigin) && !f(draft, FLAGS.describedFuture)) return;

  setStage(draft, 'rush');
  draft.flags[FLAGS.theirReach] = 0;
  events.push({ kind: 'narration', text: T.THEY_DECIDE });
  setObjective(draft, OBJECTIVES.stopThem, events);
}

/* ================================================================ *
 * Talking
 * ================================================================ */

/** Who the hero says they are. Doubted, and then not. */
export function claimIdentity(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  openTheArgument(draft);
  if (f(draft, FLAGS.claimedIdentity)) {
    events.push({ kind: 'dialogue', text: T.IDENTITY_AGAIN });
    return commit(draft, events, true);
  }
  draft.flags[FLAGS.claimedIdentity] = true;
  events.push({ kind: 'dialogue', text: T.IDENTITY_CLAIMED });
  return commit(draft, events, true);
}

/**
 * The two lanterns, side by side.
 *
 * This settles identity and nothing else — which is the point. Knowing who the
 * stranger is tells them nothing about which of the two of them is right about
 * what to do next.
 */
export function showLantern(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  openTheArgument(draft);
  if (!draft.inventory.includes('lantern')) {
    events.push({ kind: 'failure', text: T.NO_LANTERN_TO_SHOW });
    return commit(draft, events, false);
  }
  if (f(draft, FLAGS.showedLantern)) {
    events.push({ kind: 'dialogue', text: T.LANTERN_AGAIN });
    return commit(draft, events, true);
  }
  draft.flags[FLAGS.showedLantern] = true;
  draft.flags[FLAGS.identityAccepted] = true;
  events.push({ kind: 'dialogue', text: T.LANTERN_SHOWN });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.lanterns',
        text:
          'Held the two lanterns up together. They stopped arguing about who I am and started ' +
          'arguing about what to do, which is worse.',
      },
    ]),
    events
  );
  theyDecide(draft, events);
  return commit(draft, events, true);
}

/** The journal. They read one line and find the thing to doubt in it. */
export function showJournal(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  openTheArgument(draft);
  if (f(draft, FLAGS.showedJournal)) {
    events.push({ kind: 'dialogue', text: T.JOURNAL_AGAIN });
    return commit(draft, events, true);
  }
  draft.flags[FLAGS.showedJournal] = true;
  events.push({ kind: 'dialogue', text: T.JOURNAL_SHOWN });
  theyDecide(draft, events);
  return commit(draft, events, true);
}

/** What the valley looks like in a hundred years. */
export function describeFuture(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  openTheArgument(draft);
  if (f(draft, FLAGS.describedFuture)) {
    events.push({ kind: 'dialogue', text: T.FUTURE_AGAIN });
    return commit(draft, events, true);
  }
  draft.flags[FLAGS.describedFuture] = true;
  events.push({ kind: 'dialogue', text: T.FUTURE_DESCRIBED });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.told_them',
        text:
          'Told them what the valley looks like in a hundred years. They asked me how it ' +
          'happened and I do not know, and they heard that.',
      },
    ]),
    events
  );
  theyDecide(draft, events);
  return commit(draft, events, true);
}

/** Where the words on the plank came from. The one they cannot un-hear. */
export function tellOrigin(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  openTheArgument(draft);
  if (f(draft, FLAGS.toldOrigin)) {
    events.push({ kind: 'dialogue', text: T.ORIGIN_AGAIN });
    return commit(draft, events, true);
  }
  draft.flags[FLAGS.toldOrigin] = true;
  events.push({ kind: 'dialogue', text: T.ORIGIN_TOLD });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.told_origin',
        text:
          'Told them the words are mine. They worked out faster than I did what that means for ' +
          'the last line, and it did not stop them. It aimed them.',
      },
    ]),
    events
  );
  theyDecide(draft, events);
  return commit(draft, events, true);
}

/* ================================================================ *
 * Hands
 * ================================================================ */

/** Standing between them and the wall. Works, and is got round. */
export function blockWall(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  const stage = stageOf(draft);
  if (stage === 'arrival' || stage === 'talking') {
    draft.flags[FLAGS.blockingWall] = true;
    openTheArgument(draft);
    events.push({ kind: 'narration', text: T.BLOCK_EARLY });
    return commit(draft, events, true);
  }
  draft.flags[FLAGS.blockingWall] = true;
  // They are going for the wall, so standing in front of it is a real attempt
  // and it is about to fail.
  draft.flags[FLAGS.triedToStopThem] = true;
  events.push({ kind: 'narration', text: T.BLOCK_RUSH });
  closeIn(draft, events);
  return commit(draft, events, true);
}

/**
 * Taking the light out of the alcove.
 *
 * It works: no light in the dish, no fan on the wall, no seam. And it is
 * answered, because the striker is bolted to the base of the lamp and they are
 * holding the only thing that needs doing.
 */
export function takeTheirLamp(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  openTheArgument(draft);
  if (f(draft, FLAGS.tookTheirLamp)) {
    // Doing it again while they are moving is still a real attempt that fails.
    if (stageOf(draft) === 'rush') draft.flags[FLAGS.triedToStopThem] = true;
    events.push({ kind: 'narration', text: T.LAMP_TAKEN_AGAIN });
    closeIn(draft, events);
    return commit(draft, events, true);
  }
  draft.flags[FLAGS.tookTheirLamp] = true;
  if (stageOf(draft) === 'rush') draft.flags[FLAGS.triedToStopThem] = true;
  events.push({ kind: 'narration', text: T.LAMP_TAKEN });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.their_lamp',
        text:
          'Took their lamp out of the alcove. The striker is bolted to the base of it, the way ' +
          'it is bolted to mine. They had it lit again before I had put it down.',
      },
    ]),
    events
  );
  closeIn(draft, events);
  return commit(draft, events, true);
}

/**
 * Getting hold of them.
 *
 * Credible and recoverable. Both of them are sixteen; one of them has three
 * days, a hundred years and one eye on the other, and it is not the one with
 * the advantage.
 */
export function restrainThem(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  openTheArgument(draft);
  const first = !f(draft, FLAGS.restrainedThem);
  draft.flags[FLAGS.restrainedThem] = true;
  if (stageOf(draft) === 'rush') draft.flags[FLAGS.triedToStopThem] = true;
  events.push({ kind: 'narration', text: first ? T.RESTRAIN_FIRST : T.RESTRAIN_AGAIN });
  closeIn(draft, events);
  return commit(draft, events, true);
}

/** Leaving. Answered per stage, and it never ends the scene. */
export function tryToLeave(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (f(draft, FLAGS.escapeClosed)) {
    events.push({ kind: 'failure', text: T.LEAVE_CLOSED });
    return commit(draft, events, false);
  }
  const stage = stageOf(draft);
  /*
   * One blow in, the way out is measurably worse and the player can go and
   * check it. That is the whole point of this branch: the cost of the next
   * swing is inspectable before it is paid, not explained afterwards.
   */
  const struck = typeof draft.flags[FLAGS.pillarStruck] === 'number'
    ? (draft.flags[FLAGS.pillarStruck] as number)
    : 0;
  const text =
    struck >= 1
      ? T.LEAVE_NARROWED
      : stage === 'dead' || stage === 'pillar'
        ? T.LEAVE_AFTER
        : stage === 'rush'
          ? T.LEAVE_RUSH
          : T.LEAVE_EARLY;
  events.push({ kind: 'failure', text });
  return commit(draft, events, false);
}

/** Waiting. Nothing happens, and the game says so plainly. */
export function waitHere(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  const stage = stageOf(draft);
  if (stage === 'rush') {
    events.push({ kind: 'narration', text: T.WAIT_RUSH });
    return commit(draft, events, true);
  }
  if (stage === 'dead' || stage === 'pillar') {
    events.push({ kind: 'narration', text: T.WAIT_AFTER });
    return commit(draft, events, true);
  }
  events.push({ kind: 'narration', text: T.WAIT_EARLY });
  return commit(draft, events, true);
}

/* ================================================================ *
 * The killing
 * ================================================================ */

/**
 * Why the hero will not do it yet, or null when they will.
 *
 * Deliberately not "exhaust every option". It opens the moment the earlier
 * self has decided and is moving, because that is when it becomes a thing a
 * person could decide to do — and it refuses before that with the reason, so
 * nobody can arrive in this room and swing at a stranger on turn one.
 */
export function killRefusal(state: GameState): string | null {
  if (f(state, FLAGS.earlierSelfDead)) return T.ALREADY_DEAD;
  switch (stageOf(state)) {
    case 'arrival':
      return T.KILL_TOO_EARLY;
    case 'talking':
      return T.KILL_STILL_TALKING;
    default:
      /*
       * One failed attempt, not a checklist.
       *
       * Talking them out of it and then going straight to the mallet skips the
       * only thing that makes the killing legible: that the hero tried to stop
       * them with their hands and could not. Any one of the three is enough —
       * each fails on its own terms, and the hero is not required to exhaust
       * them.
       *
       * It has to be an attempt made *while they are going for the wall*. A
       * grab during the argument, before they have decided anything, failed at
       * nothing that matters and cannot stand in for the moment this scene is
       * about — see `restrainThem` and `takeTheirLamp`, which only latch the
       * flag in `rush`. And it has to have visibly failed, which is what the
       * reach is: every attempt moves them nearer the passage, and the refusal
       * below holds until one has.
       */
      if (!f(state, FLAGS.triedToStopThem) || reachOf(state) < 1) {
        // Something was tried, but during the argument, when nothing was at
        // stake. The refusal says that rather than claiming it never happened.
        return f(state, FLAGS.restrainedThem) || f(state, FLAGS.tookTheirLamp)
          ? T.KILL_TRIED_TOO_EARLY
          : T.KILL_UNTRIED;
      }
      return state.inventory.includes('mallet') ? null : T.KILL_NO_TOOL;
  }
}

export function killThem(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  const refusal = killRefusal(draft);
  if (refusal !== null) {
    events.push({ kind: 'failure', text: refusal });
    return commit(draft, events, false);
  }

  draft.flags[FLAGS.earlierSelfDead] = true;
  draft.flags[FLAGS.restrainedThem] = false;
  draft.flags[FLAGS.blockingWall] = false;
  setStage(draft, 'dead');
  draft.pending = null;

  events.push({ kind: 'narration', text: T.THE_KILLING });
  events.push({ kind: 'narration', text: T.AFTER_THE_KILLING });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.killed',
        text: 'I killed them at the wall, before they could put a hand on it. It took one blow.',
      },
    ]),
    events
  );
  setObjective(draft, OBJECTIVES.destroy, events);
  discover(draft, ['sealed.pillar']);
  return commit(draft, events, true);
}
