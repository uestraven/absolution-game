import type { NarrativeEvent, ResolveResult } from '../types';
import { FLAGS } from '../../content/flags';
import { OBJECTIVES } from '../../content/text';
import {
  addJournal,
  commit,
  flag as f,
  journalEvents,
  removeFromInventory,
  setObjective,
  type Draft,
} from '../mechanics';

/**
 * Worksite access, the ordinary way: carry the crew some water.
 *
 * This is the route that is open before the recitation, and it closes after
 * it, because by then Lovage has decided the wrongnesses arrived with the
 * stranger. It is never the only route — see the two recovery routes in
 * content/dialogue (Fenn's gap behind the spoil, and Saffra walking the hero
 * up) — and access latches once granted, so nothing can take it back.
 *
 * Nothing here is consumed that the hero needs again. The skins stay at the
 * mouth, visible and recoverable.
 */

export function fillSkins(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (!draft.inventory.includes('water_skins')) {
    events.push({
      kind: 'failure',
      text:
        'You cup your hands under it and drink until your teeth hurt, which is worth doing and ' +
        'is not what you came up here for. You have nothing with you to fill.',
    });
    return commit(draft, events, false);
  }
  if (f(draft, FLAGS.skinsFilled)) {
    events.push({
      kind: 'narration',
      text: 'They are already full, and they already weigh more than you would like.',
    });
    return commit(draft, events, true);
  }

  draft.flags[FLAGS.skinsFilled] = true;
  events.push({
    kind: 'success',
    text:
      'You pull the bungs and hold each skin under the fall in turn, and it takes longer than ' +
      'you expect, because a thumb-thick rope of water is a lot of water to watch and not very ' +
      'much to catch.\n\n' +
      'The necks soften as they fill. You bung them, lift the yoke, and discover what four ' +
      'skins of water actually weigh, which is a thing you now know for the rest of your life.',
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.filled',
        text: 'Filled the skins at the spring. Four of them, and they are not light.',
      },
    ]),
    events
  );
  return commit(draft, events, true);
}

/**
 * Hands the water over. The only place this works is the mouth, where the crew
 * and their split barrel are.
 */
export function giveWater(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (!draft.inventory.includes('water_skins')) {
    events.push({ kind: 'failure', text: 'You are not carrying them.' });
    return commit(draft, events, false);
  }
  if (!f(draft, FLAGS.skinsFilled)) {
    events.push({
      kind: 'failure',
      text:
        'You offer Lovage four empty goatskins.\n\n' +
        'He looks at them. He looks at you. He does not take them, and he does not say any of ' +
        'the things he is clearly deciding between.\n\n' +
        '"The spring," he says eventually, "is up past the tree."',
    });
    return commit(draft, events, false);
  }

  if (f(draft, FLAGS.lovageDistrust)) {
    /*
     * The route is closed, and it closes honestly: the goods are not taken and
     * not destroyed, and the player is told plainly that this will not work
     * now rather than left to wonder whether they are a step short.
     */
    events.push({
      kind: 'failure',
      text:
        'You hold out four full skins of cold water to five men and a boy who have been dry for ' +
        'four days.\n\n' +
        'Lovage looks at them for a long moment, and you watch him want them, and you watch him ' +
        'decide.\n\n' +
        '"No," he says. "Not off you. Not today."\n\n' +
        'One of the younger men says something from the dark behind him and Lovage says a ' +
        'single word back without turning round, and that is the end of the discussion.\n\n' +
        '"You will want to put those down somewhere that is not my mouth."\n\n' +
        'Whatever that door was worth this morning, it is shut, and water is not going to open ' +
        'it again.',
    });
    return commit(draft, events, false);
  }

  removeFromInventory(draft, 'water_skins');
  draft.placements['water_skins'] = { kind: 'room', locationId: 'past.entrance' };
  draft.flags[FLAGS.carriedWater] = true;
  draft.flags[FLAGS.worksiteAccess] = true;

  events.push({
    kind: 'success',
    text:
      'He is off the basket before you have got the yoke off your shoulder.\n\n' +
      'There is no ceremony about it at all. He takes two skins himself, shouts one word down ' +
      'the stair, and three men come up it faster than men come up a stair, and for about two ' +
      'minutes nobody says anything to anybody because they are all drinking.\n\n' +
      'The oldest of them tips a capful over the back of his own neck and laughs at nothing.\n\n' +
      'Lovage hangs the last skin on a peg beside the split barrel and wipes his mouth with the ' +
      'back of his wrist and looks at you with an expression of frank reassessment.\n\n' +
      '"Right," he says. "Go on, then. Down the stair, round the heap, and you can put your ' +
      'head in and see what a job looks like."\n\n' +
      '"Touch nothing with an edge on it. Stand where I put you. And if I say out, you are out, ' +
      'and we will not be having a conversation about it."',
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.water_bought',
        text:
          'Carried four skins of water up to Lovage and his crew. He has given me the run of ' +
          'the workings, with conditions.',
      },
    ]),
    events
  );
  setObjective(draft, OBJECTIVES.worksite, events);
  return commit(draft, events, true);
}
