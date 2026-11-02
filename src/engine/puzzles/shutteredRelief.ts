import type { NarrativeEvent, ResolveResult } from '../types';
import { FLAGS } from '../../content/flags';
import { OBJECTIVES } from '../../content/text';
import {
  addJournal,
  commit,
  discover,
  flag as f,
  journalEvents,
  removeFromInventory,
  setObjective,
  type Draft,
} from '../mechanics';

/**
 * The shuttered relief — the opening chapter's only puzzle.
 *
 * Everything that knows about *this* puzzle is here. It reaches the rest of
 * the engine only through flags, `discover` and pushed narrative events, which
 * is why it lifted out of the reducer without touching the shared action
 * pipeline.
 *
 * Adding a second puzzle: new module beside this one, exporting handlers of the
 * same `(draft, events) => ResolveResult` shape, wired in from the relevant
 * `case` in the reducer's `doOpen` / `doUse` / `doPlace`. See
 * docs/ARCHITECTURE.md for where a new era, room or chapter transition goes.
 */

/**
 * Recomputes whether light is reaching the patterned wall, and narrates the
 * transition. Called after anything that could change it.
 *
 * `seamRevealed` latches: once seen, the player knows where the seam is even
 * with the lantern taken back out. `passageOpen` latches independently, so the
 * discovery can never be undone.
 */
export function checkIllumination(draft: Draft, events: NarrativeEvent[]): void {
  if (draft.locationId !== 'present.sealed_chamber') return;
  const lit =
    f(draft, FLAGS.shutterHeld) && f(draft, FLAGS.lanternInAlcove) && f(draft, FLAGS.lanternLit);
  if (!lit) return;

  if (f(draft, FLAGS.seamRevealed)) {
    events.push({
      kind: 'narration',
      text:
        'The light climbs out through the carved eye again and lays the same long fan across ' +
        'the patterned wall. The seam is exactly where it was.',
    });
    return;
  }

  draft.flags[FLAGS.seamRevealed] = true;
  discover(draft, ['sealed.seam']);
  events.push({
    kind: 'narration',
    text:
      'The flame settles into the dish, and the chamber changes.\n\n' +
      'All the light in the room is now coming from a hand\'s breadth above the floor, out of a ' +
      'hole the size of your palm, going up. It leaves the carved eye as a flat fan and crosses ' +
      'the patterned wall almost edge-on.\n\n' +
      'And every one of those thousands of little scales throws its shadow the same way at ' +
      'last, all together, in one direction — and in the middle of all that agreement there is ' +
      'one line that does not behave. It does not throw a shadow. It is one.\n\n' +
      'A seam. Up from the floor to shoulder height, then a turn, then across, the width of a ' +
      'door.\n\n' +
      'You have been standing in front of it with a lantern in your hand. So has everyone else ' +
      'who ever came in here.',
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.seam',
        text:
          'With a lit lamp in the alcove and the shutter held up, light through the carved eye ' +
          'crosses the patterned wall edge-on and shows a door-sized seam in it.',
      },
    ]),
    events
  );
}

export function openPassage(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (f(draft, FLAGS.passageOpen)) {
    events.push({ kind: 'narration', text: 'The passage already stands open. The steps go down.' });
    return commit(draft, events, true);
  }
  if (!f(draft, FLAGS.seamRevealed)) {
    events.push({
      kind: 'failure',
      text:
        'You run your hands over the scales, pressing and pulling at a dozen of them. They are ' +
        'all the same depth and all the same surface, and the wall does not give anywhere. If ' +
        'there is a join in this, you are not going to find it by feel.',
    });
    return commit(draft, events, false);
  }

  draft.flags[FLAGS.passageOpen] = true;
  discover(draft, ['sealed.passage']);
  events.push({
    kind: 'success',
    text:
      'You get your fingertips into the seam, set your shoulder below the turn, and push across ' +
      'rather than in.\n\n' +
      'A door-sized slab of patterned wall swings. It is pivoted — one cut socket in the floor, ' +
      'one in the lintel above — and balanced so well that once it is moving you could keep it ' +
      'going with one hand. Grit grinds for the first hand\'s width and then nothing at all. It ' +
      'has not been opened in a very long time, and it was made by somebody who expected it to ' +
      'be opened often.\n\n' +
      'Behind it the rock has been cut into steps, going down and bending right. The air that ' +
      'comes up is still, and warmer than the room you are standing in.',
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.passage',
        text:
          'A door-sized slab of the sealed chamber\'s patterned wall is pivoted and swings. ' +
          'Behind it, cut steps go down.',
      },
    ]),
    events
  );
  setObjective(draft, OBJECTIVES.passage, events);
  return commit(draft, events, true);
}

export function wedgeShutter(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (f(draft, FLAGS.shutterHeld)) {
    events.push({
      kind: 'failure',
      text: 'The wedge is already in under the shutter, and the shutter is already up.',
    });
    return commit(draft, events, false);
  }
  if (!draft.inventory.includes('wedge')) {
    events.push({ kind: 'failure', text: 'You have nothing to hold it up with.' });
    return commit(draft, events, false);
  }

  const firstTime = !f(draft, FLAGS.shutterTried);
  draft.flags[FLAGS.shutterTried] = true;
  draft.flags[FLAGS.shutterHeld] = true;
  removeFromInventory(draft, 'wedge');
  draft.placements['wedge'] = { kind: 'fixture', fixtureId: 'sealed.shutter' };
  discover(draft, ['sealed.alcove']);

  events.push({
    kind: 'success',
    text:
      'You get your fingers under the lip, lift the shutter up its grooves with your back ' +
      'rather than your arms, hold it there one-handed, and kick the wedge in under the bottom ' +
      'edge with the other hand.\n\n' +
      'Then you let go.\n\n' +
      'It settles half a finger\'s width onto the oak and stops. The wedge bites. The shutter ' +
      'stays up.' +
      (firstTime
        ? '\n\nBehind it is a squared hollow cut back into the rock, deeper than your forearm, ' +
          'black with old smoke, with a flat, slightly dished floor to it. It is at ankle ' +
          'height. Nothing is in it.'
        : ''),
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.alcove',
        text:
          'Behind the sealed chamber\'s shutter is an arm-deep, smoke-blackened alcove at ankle ' +
          'height with a dished floor. The shutter will not stay up on its own; a wedge under ' +
          'the lip holds it.',
      },
    ]),
    events
  );
  noteReliefMatch(draft, 'sealed.alcove', events);
  checkIllumination(draft, events);
  return commit(draft, events, true);
}

export function liftShutter(draft: Draft, events: NarrativeEvent[]): ResolveResult {
  if (f(draft, FLAGS.shutterHeld)) {
    events.push({ kind: 'narration', text: 'It is already up, with the wedge under it.' });
    return commit(draft, events, true);
  }

  const firstTime = !f(draft, FLAGS.shutterTried);
  draft.flags[FLAGS.shutterTried] = true;
  discover(draft, ['sealed.alcove']);

  events.push({
    kind: 'narration',
    text:
      'You get your fingers under the worn lip and lift. It is heavy, but the grooves are clean, ' +
      'and it goes up a good arm\'s length and stays there exactly as long as you hold it.' +
      (firstTime
        ? '\n\nBehind it is a squared hollow cut back into the rock, deeper than your forearm, ' +
          'black with old smoke, with a flat, slightly dished floor to it. It is at ankle ' +
          'height, set a long way back, and nothing is in it.'
        : '') +
      '\n\nThen your grip goes, the way a grip does, and the shutter runs straight back down the ' +
      'grooves and sits closed.\n\n' +
      'Nothing in this room holds it up. It would need something driven in under the bottom edge.',
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.alcove',
        text:
          'Behind the sealed chamber\'s shutter is an arm-deep, smoke-blackened alcove at ankle ' +
          'height with a dished floor. The shutter will not stay up on its own; a wedge under ' +
          'the lip holds it.',
      },
    ]),
    events
  );
  noteReliefMatch(draft, 'sealed.alcove', events);
  return commit(draft, events, true);
}

/**
 * Records the relief/alcove relationship once the player has genuinely seen
 * both halves of it. This is an observation they have established, not a
 * solution: it says the shapes match, not what to do about it.
 */
export function noteReliefMatch(draft: Draft, objectId: string, events: NarrativeEvent[]): void {
  if (objectId !== 'gallery.relief' && objectId !== 'sealed.alcove') return;
  if (!f(draft, FLAGS.reliefExamined)) return;
  if (!draft.discovered.includes('sealed.alcove')) return;

  if (!f(draft, FLAGS.reliefMatched)) {
    draft.flags[FLAGS.reliefMatched] = true;
    events.push({
      kind: 'narration',
      text:
        'The squared recess at the bottom of the relief and the hollow behind the shutter are ' +
        'the same shape, in the same proportion, at the same height off the floor. Somebody cut ' +
        'a picture of that alcove on that wall.',
    });
  }
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.match',
        text:
          'The squared recess in the gallery relief matches the alcove behind the sealed ' +
          'chamber\'s shutter: same shape, same height off the floor.',
      },
    ]),
    events
  );
}
