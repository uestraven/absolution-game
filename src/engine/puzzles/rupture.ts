import type { NarrativeEvent } from '../types';
import { FLAGS } from '../../content/flags';
import { addJournal, flag as f, journalEvents, type Draft } from '../mechanics';

/**
 * The small wrongnesses, and nothing else.
 *
 * Three authored observations, each with a stated trigger and each fired once.
 * **Nothing here explains anything.** There is no narrator account of
 * causality, no inscription that diagnoses it, no builder who works it out and
 * no journal entry that theorises: the hero sees a thing happen in the wrong
 * order and writes down that it happened in the wrong order. Characters have
 * opinions about it, and the opinions are wrong or partial or frightened, which
 * is what opinions are.
 *
 * Deliberately not a system. There is no random roll, no counter, no escalation
 * clock and no timer that a hint or a wrong guess could burn. Each symptom is a
 * flag that latches, so it survives a reload and never repeats, and the room
 * descriptions afterwards show the aftermath rather than re-staging the event.
 */

/** The first one: fired by the recitation itself, in the square. */
export function soundSymptom(draft: Draft, events: NarrativeEvent[]): void {
  if (f(draft, FLAGS.symptomSound)) return;
  draft.flags[FLAGS.symptomSound] = true;

  events.push({
    kind: 'narration',
    text:
      'Somewhere behind the half-built wall a door goes shut. Not a slam — the flat wooden ' +
      'knock of a door being pulled to by the wind, a sound you have heard ten thousand times ' +
      'and never once thought about.\n\n' +
      'Then the wind arrives.\n\n' +
      'It comes over the roofline and down into the square and lifts the lime dust off the ' +
      'course Saffra is working and flattens the grass by the well, and it is the wind that ' +
      'shut that door, and it gets there afterwards.\n\n' +
      'Fenn says, "That was backwards."\n\n' +
      'Saffra says nothing at all. She looks at the doorway, and then at the grass, and then at ' +
      'the board in her hand, and she does not say anything, and she does not put the board ' +
      'down.',
  });

  journalEvents(
    addJournal(draft, [
      {
        id: 'j.symptom_sound',
        text:
          'A door shut in the wind, and then the wind came. In that order. Fenn noticed it too, ' +
          'so it was not me.',
      },
    ]),
    events
  );
}

/**
 * Fired on arrival in the workings or the basin chamber, once the words are
 * out. The crew's own chalk line is the one thing down here that was supposed
 * to be beyond argument.
 */
function markSymptom(draft: Draft, events: NarrativeEvent[]): void {
  draft.flags[FLAGS.symptomMark] = true;
  events.push({
    kind: 'narration',
    text:
      'Two of the crew are standing over the chalk line with a string between them, and they ' +
      'have been standing there long enough to have stopped talking.\n\n' +
      'There are two lines on the floor. The sharp one and, a hand\'s width off it, a fainter ' +
      'one in the same blue chalk. The plumb-bob hangs over neither.\n\n' +
      'The older of the two snaps the string again, looks at where it lands, and says, to ' +
      'nobody: "Then one of them is not mine."\n\n' +
      'They both know the handwriting of their own work. That is the part they cannot get past, ' +
      'and they go round it twice while you stand there, and then they stop and look at you ' +
      'instead.',
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.symptom_mark',
        text:
          'There are two chalk lines on the floor of the workings, a hand apart, in the same ' +
          'chalk and the same hand. The crew cannot account for the second one and they have ' +
          'started looking at me.',
      },
    ]),
    events
  );
}

/** Fired on the hillside, where weather is something you can watch happen. */
function weatherSymptom(draft: Draft, events: NarrativeEvent[]): void {
  draft.flags[FLAGS.symptomWeather] = true;
  events.push({
    kind: 'narration',
    text:
      'It starts to rain, briefly and hard, in a band you can see the edges of.\n\n' +
      'It comes across the shale and soaks a strip of it dark and goes over you cold enough to ' +
      'make you hunch, and you stand there with water running off your chin, and then it has ' +
      'not rained.\n\n' +
      'Not stopped. The strip of wet shale is drying from both ends at once, inward, fast, the ' +
      'way a thing dries in a fire rather than in the sun, and your hair is dry, and the drops ' +
      'are off the back of your hand before you have got it up to look at it.\n\n' +
      'The last of the dark on the stone closes like an eye.\n\n' +
      'Below you, in the square, nobody has run for anything. Nobody is pulling washing in. It ' +
      'did not rain down there, and up here you are the only person who will ever be able to ' +
      'say that it did.',
  });
  journalEvents(
    addJournal(draft, [
      {
        id: 'j.symptom_weather',
        text:
          'It rained on the track hard enough to soak me, and then it un-rained: the wet dried ' +
          'inward from both ends and nothing in the village got wet at all.',
      },
    ]),
    events
  );
}

/**
 * Called after a room has been described. Returns true when a symptom fired,
 * so the caller can keep the beat out of the same breath as the arrival.
 *
 * Nothing fires before the recitation: in this chapter the wrongnesses begin
 * while the hero is standing in the century, and the opening era never sees
 * one at all.
 */
export function maybeSymptom(draft: Draft, events: NarrativeEvent[]): boolean {
  if (!f(draft, FLAGS.recitedProphecy)) return false;

  const where = draft.locationId;
  if (!f(draft, FLAGS.symptomMark) && (where === 'past.worksite' || where === 'past.deep_chamber')) {
    markSymptom(draft, events);
    return true;
  }
  if (!f(draft, FLAGS.symptomWeather) && (where === 'past.cave_path' || where === 'past.spring')) {
    weatherSymptom(draft, events);
    return true;
  }
  return false;
}
