import type { GameState, LocationDef, LocationId } from '../engine/types';
import { FLAGS } from './flags';
import { OUT_THROUGH_THE_TEAR } from './text';

/** Shorthand for "is this flag set". */
const f = (state: GameState, key: string): boolean => Boolean(state.flags[key]);

/**
 * Cave rooms mention the lantern without ever depending on it.
 *
 * There is no darkness mechanic and no light fuel: an unlit or absent lantern
 * is uncomfortable, never blocking, so nothing here can soft-lock. The outer
 * rooms get real daylight from the mouth; the inner rooms are honest about
 * being dark, which is also the nudge to strike the striker.
 */
function lightNote(state: GameState, depth: 'outer' | 'inner'): string {
  const carried = state.inventory.includes('lantern');
  const lit = f(state, FLAGS.lanternLit);

  // The description has to follow where the lantern actually is. A lantern
  // burning in the alcove two rooms away is not in the hero's hand, and saying
  // so was a real contradiction.
  if (carried && lit) {
    return 'Your lantern throws a moving wedge of light wherever you turn your shoulder.';
  }
  if (carried) {
    return depth === 'outer'
      ? 'Your lantern hangs cold and unlit from your hand. Daylight still reaches this far, so ' +
          'there is no hurry about it.'
      : 'Your lantern is still cold in your hand. You are managing by whatever light finds its ' +
          'way round the corners behind you, and by touch — enough to move about, not enough to ' +
          'look properly at anything.';
  }

  const lanternElsewhere = lit ? ', burning where you left it,' : '';
  return depth === 'outer'
    ? `Your lantern is not with you${lanternElsewhere} and daylight still reaches this far, so ` +
        'for the moment it does not matter.'
    : `Your lantern is not with you${lanternElsewhere} and you are going by hand. You can find ` +
        'the walls and the way back. You cannot examine stone.';
}


export const LOCATIONS: Record<LocationId, LocationDef> = {
  /* ================================================================ *
   * The village
   * ================================================================ */

  'present.home': {
    id: 'present.home',
    era: 'present',
    name: 'Your Room',
    subtitle: () => 'Above the kitchen — early, on your birthday',
    description: (state) =>
      'Your room is the width of two arm-spans and smells of woodsmoke from the flue that ' +
      'runs up through the corner. Someone has been up before you: ' +
      (f(state, FLAGS.ateBread)
        ? 'there are crumbs on the stool by the door where the bread was, and the shutter is ' +
          'already hooked back.'
        : 'there is bread set out on the stool by the door, and the shutter is already hooked ' +
          'back.') +
      '\n\n' +
      'On the windowsill, where nothing is usually left, sits a hooded lantern.\n\n' +
      'The stair goes down to the lane, and the lane goes down to the square.',
    firstVisit: () =>
      'Sixteen. You have been sixteen for about as long as you have been awake, and already ' +
      'the house has arranged itself around the fact.',
    exits: [
      {
        id: 'to_square',
        label: 'the lane down to the square',
        to: 'present.square',
        direction: 'down',
        aliases: ['square', 'lane', 'stair', 'stairs', 'out', 'village', 'south'],
      },
    ],
  },

  'present.square': {
    id: 'present.square',
    era: 'present',
    name: 'The Village Square',
    subtitle: () => 'Hard-packed earth, a well, and more cord strung up than usual',
    sounds: () =>
      'A hammer somewhere behind the workshop, going in threes. Marjoram counting under her ' +
      'breath. Somebody\'s chickens. A cord of lanterns ticking against itself in the wind, ' +
      'which is the only sound in the square that is about you.',
    description: (state) => {
      const board = f(state, FLAGS.heardProphecy)
        ? 'The chalked plank by the well has been read aloud so many times this week that ' +
          'people mouth along with it.'
        : 'A plank has been propped by the well and written over in chalk, and people keep ' +
          'stopping to read it as if it might have changed.';
      return (
        'The square is busier than a working morning should be. Lanterns have been strung on ' +
        'cord between the eaves — unlit, waiting for a night that has not been named out loud. ' +
        'Someone has set a bowl of salt on the well-cap, and somebody else keeps moving it ' +
        'half a hand to the left.\n\n' +
        board +
        '\n\n' +
        'Sage is at the plank with a stub of chalk, correcting something that does not need ' +
        'correcting. Marjoram has her board out in front of the bakehouse and is working dough ' +
        'like it owes her money. Parsie, who is eleven, is orbiting.\n\n' +
        'The lane climbs north to your door. The joiner\'s workshop stands open to the east. ' +
        'West, past the last house, the cave path starts up the hill.'
      );
    },
    firstVisit: () =>
      'Three people wish you a good birthday before you reach the well. Two of them look at ' +
      'you a moment longer than the words need.',
    exits: [
      {
        id: 'to_home',
        label: 'the lane home',
        to: 'present.home',
        direction: 'north',
        aliases: ['home', 'house', 'lane', 'room', 'up'],
      },
      {
        id: 'to_workshop',
        label: "the joiner's workshop",
        to: 'present.workshop',
        direction: 'east',
        aliases: ['workshop', 'joiner', 'shop'],
      },
      {
        id: 'to_cave_path',
        label: 'the cave path',
        to: 'present.cave_path',
        direction: 'west',
        aliases: ['cave path', 'path', 'hill', 'cave'],
      },
    ],
  },

  'present.workshop': {
    id: 'present.workshop',
    era: 'present',
    name: "The Joiner's Workshop",
    subtitle: () => 'Sawdust, glue-pot, and a basket of offcuts',
    description: () =>
      'The workshop is one long room with the big door hooked open for the light. Shavings ' +
      'have drifted into the corners in pale banks. A glue-pot sits off the heat with a skin ' +
      'on it.\n\n' +
      'Oreg the joiner works at the bench with the unhurried rhythm of someone who has made ' +
      'the same joint four thousand times. Under the bench is a basket of offcuts: dowels, ' +
      'tapered blocks, scraps too good to burn.\n\n' +
      'The square is back out to the west.',
    exits: [
      {
        id: 'to_square',
        label: 'the square',
        to: 'present.square',
        direction: 'west',
        aliases: ['square', 'out', 'village'],
      },
    ],
  },

  'present.cave_path': {
    id: 'present.cave_path',
    era: 'present',
    name: 'The Cave Path',
    subtitle: () => 'Above the roofs, where the grass gives up',
    description: () =>
      'The path leaves the last house and climbs through thistle and loose shale. From here ' +
      'the village is all roof-slate and smoke, and you can see the strung lanterns as a ' +
      'single thin line.\n\n' +
      'An old stump sits beside the path at the turn, worn smooth on top by generations of ' +
      'people sitting down to think about it. Chalk marks on the rocks count off the last ' +
      'stretch.\n\n' +
      'Dilly is sitting on the stump with her boots off. Tyme is further up, coiling rope ' +
      'and watching the weather.\n\n' +
      'The square is back down to the east. The cave mouth is up and west.',
    firstVisit: (state) =>
      'From down in the square the hill looks like a hill. From here it looks like a door ' +
      'somebody left in the ground.\n\n' +
      'And from here you can pick out the roofs by who is under them. Marjoram is working dough ' +
      'she means to sell tomorrow. Parsie has five years to wait for his turn at this and has ' +
      'already decided he is going right to the back. Somebody is still up a ladder being told ' +
      'how to hang a lantern.' +
      (f(state, FLAGS.heardProphecy)
        ? '\n\nThat is the list. That is what the plank says is going to stop.'
        : '\n\nIt is an ordinary Tuesday down there, and it is the eleventh day of the lanterns.'),
    exits: [
      {
        id: 'to_square',
        label: 'the village square',
        to: 'present.square',
        direction: 'east',
        aliases: ['square', 'village', 'down', 'back'],
      },
      {
        id: 'to_entrance',
        label: 'the cave mouth',
        to: 'present.entrance',
        direction: 'west',
        aliases: ['entrance', 'cave', 'mouth', 'up', 'cave mouth'],
      },
    ],
  },

  /* ================================================================ *
   * The cave, as it stands
   * ================================================================ */

  'present.entrance': {
    id: 'present.entrance',
    era: 'present',
    name: 'The Cave Mouth',
    subtitle: () => 'The Cave of Absolution — the part everyone sees',
    description: (state) =>
      'The mouth is a wide low slot under an overhang, taller than you and three times as ' +
      'wide. The floor inside is swept earth. There is a bench. There is a hook with a spare ' +
      'coil of rope on it. Somebody, years ago, cut letters into the lintel and somebody else ' +
      'has been keeping them clear of moss.\n\n' +
      'A rope runs from an iron ring by the bench into the dark, knotted at intervals, the ' +
      'knots polished by hands.\n\n' +
      'Daylight reaches a good way in. From the first gallery you will still be able to see ' +
      'this slot of sky behind you.\n\n' +
      lightNote(state, 'outer') +
      '\n\nThe path back down is east. The gallery is in, and down.',
    firstVisit: () =>
      'Somebody swept this floor. Somebody keeps the moss off the letters, and refreshes the ' +
      'chalk on the shale every spring, and spliced that rope onto that ring, and put a bench ' +
      'here because people wait.\n\n' +
      'From the bench you can see the whole roofline below, and the cord strung across it, and ' +
      'the forty lanterns on the cord that nobody has lit.',
    exits: [
      {
        id: 'to_path',
        label: 'the path back down',
        to: 'present.cave_path',
        direction: 'east',
        aliases: ['path', 'out', 'outside', 'down the path', 'village', 'back'],
      },
      {
        id: 'to_gallery',
        label: 'the outer gallery',
        to: 'present.outer_gallery',
        direction: 'in',
        aliases: ['gallery', 'outer gallery', 'down', 'west', 'cave', 'inside'],
      },
    ],
  },

  'present.outer_gallery': {
    id: 'present.outer_gallery',
    era: 'present',
    name: 'The Outer Gallery',
    subtitle: () => 'As far as most people get, and then some',
    description: (state) =>
      'The gallery is a long room with a ceiling that comes down to meet you at the far end. ' +
      'The rope ends here, tied off round a natural pillar. Behind you, back along the slope, ' +
      'the entrance is a bright ragged slot the size of your thumbnail held at arm\'s length.\n\n' +
      'The left-hand wall is covered in scratches: names, tallies, dates, the honest ' +
      'bookkeeping of people who came this far. The right-hand wall has something older on it ' +
      '— a worn relief, cut flat into the rock and half eaten away by water.\n\n' +
      'Two ways on. A low crawl north opens into somewhere that returns sound strangely. A ' +
      'squeeze east gives onto a smaller chamber.\n\n' +
      lightNote(state, 'outer'),
    firstVisit: () =>
      'Your voice, when you try it, comes back a half-beat late and slightly changed, like ' +
      'somebody agreeing with you out of politeness.',
    exits: [
      {
        id: 'to_entrance',
        label: 'the way back to the cave mouth',
        to: 'present.entrance',
        direction: 'out',
        aliases: ['entrance', 'mouth', 'up', 'back', 'daylight'],
      },
      {
        id: 'to_echo',
        label: 'the low crawl',
        to: 'present.echo_chamber',
        direction: 'north',
        aliases: ['crawl', 'echo chamber', 'low crawl', 'left'],
      },
      {
        id: 'to_sealed',
        label: 'the squeeze into the smaller chamber',
        to: 'present.sealed_chamber',
        direction: 'east',
        aliases: ['squeeze', 'smaller chamber', 'sealed chamber', 'chamber', 'right'],
      },
    ],
  },

  'present.echo_chamber': {
    id: 'present.echo_chamber',
    era: 'present',
    name: 'The Echo Chamber',
    subtitle: () => 'A room that answers back',
    sounds: () =>
      'You stand still, and the room gives you back the sound of your standing still, a beat ' +
      'late and from somewhere above your head.\n\nSay anything in here and it comes back to ' +
      'you as somebody else saying it. That is the whole of what the room does, and it is ' +
      'presumably why nobody comes down this far twice.',
    description: (state) =>
      'The crawl opens without warning into a bell of a room, high and round, with a floor ' +
      'that slopes to a shallow dish of standing water. Every sound you make arrives back at ' +
      'you from above, which is the wrong direction for it.\n\n' +
      'Water drips somewhere you cannot find. A single boot lies on its side near the water, ' +
      'laces still tied.\n\n' +
      'Words have been scratched into the wall at sitting height, in a hand that got worse as ' +
      'it went.\n\n' +
      lightNote(state, 'inner') +
      '\n\nThe crawl back to the gallery is south.',
    firstVisit: () =>
      'You say your own name, once, quietly, to hear what the room does with it.\n\n' +
      'It arrives back from above you and a half-beat late, and it is not quite the shape you ' +
      'put into the air. You do not do it again.',
    exits: [
      {
        id: 'to_gallery',
        label: 'the crawl back to the gallery',
        to: 'present.outer_gallery',
        direction: 'south',
        aliases: ['gallery', 'crawl', 'back', 'out'],
      },
    ],
  },

  'present.sealed_chamber': {
    id: 'present.sealed_chamber',
    era: 'present',
    name: 'The Sealed Chamber',
    subtitle: (state) =>
      state.chapter === 'return'
        ? 'Dusk, and there are two of you in it'
        : f(state, FLAGS.passageOpen)
          ? 'Not as sealed as its name'
          : 'Small, square, and finished',
    sounds: (state) =>
      state.chapter === 'return'
        ? 'Two people breathing in a four-pace room, and neither of them is doing it quietly.'
        : 'Nothing, which is the remarkable part. The gallery behind you drips and this room ' +
          'does not, and the pattern on the walls takes the sound of your own feet and puts it ' +
          'somewhere else.',
    description: (state) => {
      /*
       * The same room, twice, in two chapters — and on the return the lamp in
       * the alcove is not the player's. Their own is in their hand, and the
       * flags that track where they put theirs say nothing about this one, so
       * the return gets its own description rather than reusing a branch that
       * reads those flags.
       */
      if (state.chapter === 'return') {
        const parts: string[] = [];
        parts.push(
          'Four steps across. Three walls in overlapping scales, and the worked pillar in the ' +
            'middle of the floor with the crack at its foot and the grit under it.'
        );
        parts.push(
          'The stone shutter on the fourth wall is up in its grooves with an oak wedge driven ' +
            'in under it. In the alcove behind it a hooded lantern is standing level in the ' +
            'dish, lit, and the light goes up through the carved eye and lays a long bright ' +
            'fan across the patterned wall.'
        );
        parts.push(
          'One line of the scale-pattern, inside the fan, is reading as a shadow instead of a ' +
            'cut.'
        );
        parts.push(
          state.inventory.includes('lantern')
            ? 'Your own lantern is in your hand, and it is the same lantern, and you are not ' +
                'going to think about that now.'
            : 'Your own lantern is wherever you put it down, and it is the same lantern, and ' +
                'you are not going to think about that now.'
        );
        parts.push('The pivoted wall is not open. It is about to be.');
        return parts.join('\n\n');
      }

      const parts: string[] = [];
      parts.push(
        'The squeeze lets you out into a chamber small enough to cross in four steps, and it ' +
          'is immediately obvious that people made it. The walls have been worked. Three of ' +
          'them are cut in a pattern of overlapping scales, shallow and repetitive, the sort ' +
          'of work that takes a season and is never looked at again.'
      );
      parts.push(
        'Low on the fourth wall — far lower than anyone would hang a torch, and set too deep ' +
          'back to warm your hands at — a stone shutter sits in a grooved frame. Above it, ' +
          'at about the height of your face, the rock is pierced by a carved eye.'
      );
      if (f(state, FLAGS.shutterHeld)) {
        parts.push('The wedge is in under the shutter, holding it up. The alcove behind it stands open.');
      } else if (f(state, FLAGS.shutterTried)) {
        parts.push('The shutter is down again, the way it always comes down.');
      }
      if (f(state, FLAGS.lanternInAlcove)) {
        parts.push(
          f(state, FLAGS.lanternLit)
            ? 'Your lantern sits in the alcove, burning, and the light goes up through the ' +
                'carved eye and lands on the patterned wall as a long bright fan.'
            : 'Your lantern sits in the alcove, dark, doing nothing at all.'
        );
      }
      if (f(state, FLAGS.passageOpen)) {
        parts.push(
          'The scale-pattern on the far wall stands open along a seam, swung back on stone ' +
            'that was cut to pivot. Beyond it the passage goes down.'
        );
      } else if (f(state, FLAGS.seamRevealed)) {
        parts.push(
          'Where the light falls, one line of the scale-pattern reads as a shadow instead of ' +
            'a cut: a seam, running floor to shoulder height.'
        );
      }
      parts.push(lightNote(state, 'inner'));
      parts.push(
        f(state, FLAGS.passageOpen)
          ? 'The squeeze back to the gallery is west. The open passage goes down.'
          : 'The squeeze back to the gallery is west.'
      );
      return parts.join('\n\n');
    },
    /*
     * No return branch here. The hero visited this room on their sixteenth
     * birthday, so `visited` has included it for three chapters and this can
     * never fire again — the arrival prose is pushed by the crossing itself.
     */
    firstVisit: () =>
      'Somebody cut this room on purpose and then, as far as anyone has ever been able to ' +
      'tell, put nothing in it.',
    exits: [
      {
        id: 'to_gallery',
        label: 'the squeeze back to the gallery',
        to: 'present.outer_gallery',
        direction: 'west',
        aliases: ['gallery', 'squeeze', 'back', 'out'],
        /*
         * On the return the hero does not leave this room. There is nothing
         * authored out there for a one-eyed stranger at dusk, and walking out
         * would abandon the only thing they came back to do.
         */
        requires: (state) => state.chapter !== 'return' && state.chapter !== 'ending',
      },
      {
        id: 'to_deep',
        label: 'the opened passage',
        to: 'present.deep_chamber',
        direction: 'down',
        aliases: ['passage', 'opening', 'seam', 'in', 'through', 'deeper'],
        requires: (state) =>
          state.chapter !== 'return' && state.chapter !== 'ending' && f(state, FLAGS.passageOpen),
      },
    ],
  },

  'present.deep_chamber': {
    id: 'present.deep_chamber',
    era: 'present',
    name: 'The Deep Chamber',
    subtitle: () => 'Below the part of the cave that has a name',
    sounds: () =>
      'Water, and under the water the hill, which is not a sound so much as the absence of ' +
      'every other one. You can hear the weather at the mouth from down here, faintly, coming ' +
      'down the stair like something remembered.',
    description: (state) => {
      const parts: string[] = [];
      parts.push(
        'The passage drops in a short flight of cut steps and ends in a chamber that is not ' +
          'like the others. The air is still and a degree warmer. There is no dust. In a cave ' +
          'that is the detail that will not leave you alone.'
      );
      parts.push(
        'The floor runs level to a low rim of stone, and inside the rim there is water. It is ' +
          'perhaps three paces across and perfectly flat. Looking into it, you can see down ' +
          'and down, past where the floor of the chamber must be, past where the hill must ' +
          'be, into a depth the basin does not have room for.'
      );
      parts.push(
        'Under the drip and the hush, something is going on at the edge of hearing: not an ' +
          'echo. A second sound-room behind this one, with its own weather in it.'
      );
      parts.push(lightNote(state, 'inner'));
      parts.push('The steps go back up and west.');
      return parts.join('\n\n');
    },
    firstVisit: () =>
      'No scratches on these walls. No names, no tallies, no ash. You are the bookkeeping now.',
    exits: [
      {
        id: 'to_sealed',
        label: 'the steps back up',
        to: 'present.sealed_chamber',
        direction: 'up',
        // Not "steps": the cut steps are an object in this room.
        aliases: ['sealed chamber', 'back', 'out', 'west', 'chamber', 'up the steps'],
      },
    ],
  },

  /* ================================================================ *
   * The cave, earlier
   * ================================================================ */

  'past.deep_chamber': {
    id: 'past.deep_chamber',
    era: 'past',
    name: 'The Basin Chamber',
    subtitle: () => 'The same room, and nothing like it',
    description: (state) =>
      'You are standing in the chamber. You are standing in a different chamber.\n\n' +
      'The walls are the walls — the same reach, the same low rim — but the stone is crisp. ' +
      'Every edge has an edge. The cut steps have corners on them. Where the rock was flaked ' +
      'and sanded down to softness there is tool-work so fresh you can read the direction the ' +
      'chisel travelled.\n\n' +
      'The basin holds a hand\'s depth of water and the bottom of it is right there, pale ' +
      'stone, two coins and a bone pin lying in the silt. Nothing goes down past the hill.\n\n' +
      'And there is daylight. Not much, and not from here, but somewhere up the passage there ' +
      'is daylight, which there was not before.\n\n' +
      'This is a place of work. There are tools stacked against the rim, and a heap of cut ' +
      'spoil shoulder-high against the north wall, and a chalk line snapped across the floor ' +
      'with a plumb-bob still hanging over it. Behind the spoil heap the wall has been opened ' +
      'into somewhere else.\n\n' +
      (f(state, FLAGS.worksiteAccess)
        ? 'The gap behind the spoil is yours to use now, and the chalk line is just a chalk ' +
          'line.\n\n'
        : 'The chalk line is the kind of line that means something to whoever snapped it.\n\n') +
      lightNote(state, 'outer') +
      '\n\nA worked stair goes up and out.' +
      (f(state, FLAGS.worksiteAccess) ? ' The gap behind the spoil heap goes north.' : ''),
    firstVisit: () =>
      'You are dry. Whatever you went through, you did not come out of it wet.',
    exits: [
      {
        id: 'to_entrance',
        label: 'the stair up and out',
        to: 'past.entrance',
        direction: 'up',
        aliases: ['stair', 'stairs', 'out', 'passage', 'entrance', 'daylight', 'west'],
      },
      {
        id: 'to_worksite',
        label: 'the gap behind the spoil heap',
        to: 'past.worksite',
        direction: 'north',
        // Not bare "spoil": the heap itself is an object in this room and
        // EXAMINE SPOIL must mean the heap, not a prompt asking which.
        aliases: ['gap', 'behind the spoil', 'workings', 'worksite', 'opening', 'in', 'through'],
        /*
         * Engine-side gate. The room is not merely undescribed without access:
         * the exit does not exist, so a player who guesses the id in either
         * input mode is refused exactly as if they had named a wall.
         */
        requires: (state) => f(state, FLAGS.worksiteAccess),
      },
    ],
  },

  'past.entrance': {
    id: 'past.entrance',
    era: 'past',
    name: 'The Cave Mouth',
    subtitle: () => 'A shorter way out than there should be',
    description: () =>
      'The stair brings you up in four turns and lets you out at the mouth, and the walk takes ' +
      'a fraction of the time it should. There is no gallery. There is no crawl, no squeeze, no ' +
      'rope. The route you came in by does not exist yet; the route you have just walked is ' +
      'cut stone with a handrail groove worn into the wall.\n\n' +
      'The mouth is narrower here, and shaped — squared off at the top by hand. No bench. No ' +
      'iron ring. No letters on the lintel, because there is no lintel, only clean rock.\n\n' +
      'Outside, the hill smells of rain on hot stone, and below it there is a village.\n\n' +
      'The stair goes back down. The track down the hill goes east.',
    firstVisit: () =>
      'You turn round twice looking for the slot of sky you memorised on the way in. It is not ' +
      'that it has moved. It is that nobody has broken it open yet.',
    exits: [
      {
        id: 'to_deep',
        label: 'the stair back down',
        to: 'past.deep_chamber',
        direction: 'down',
        aliases: ['stair', 'stairs', 'in', 'back', 'chamber', 'basin', 'west'],
      },
      {
        id: 'to_path',
        label: 'the track down the hill',
        to: 'past.cave_path',
        direction: 'east',
        // No "down" here: the stair into the hill owns that direction, and a
        // player typing DOWN at the mouth means the stair.
        /*
         * The view down to the village is an object in this room and owns
         * "village", "roofs", "hill" and "valley". The exit keeps the words
         * that mean the walking.
         */
        aliases: ['track', 'path', 'down the track', 'down the hill'],
      },
    ],
  },

  'past.square': {
    id: 'past.square',
    era: 'past',
    name: 'The Village Square',
    subtitle: () => 'Your village, nearly',
    description: () => {
      const parts: string[] = [];
      parts.push(
        'You come down off the track into a square you have crossed every day of your life, ' +
          'laid out wrong.'
      );
      parts.push(
        'The well is in its place, and the well is new: the cap is pale and unworn and the ' +
          'rope on the windlass is white. The lane still climbs north to where your door ' +
          'should be. Where the joiner\'s workshop stands, there is a frame of green timber ' +
          'with two walls up and a third being mortared, and no roof at all.'
      );
      parts.push(
        'At the turn of the path above the roofs, where the old stump sits, there is a tree. ' +
          'A whole one, in leaf, big enough to shade a cart.'
      );
      parts.push(
        'There is no cord strung between the eaves. There are no lanterns waiting. There is no ' +
          'chalked plank by the well, and the well-cap has no bowl of salt on it.'
      );
      parts.push(
        'Saffra is up on a plank at the half-built wall with a trowel. A boy called Fenn is ' +
          'holding the mortar board for her and not watching it.'
      );
      parts.push('The track back up the hill is west.');
      return parts.join('\n\n');
    },
    firstVisit: () =>
      'Nobody looks up. You are a stranger on the path, which in a village this size is worth ' +
      'exactly one glance, and you have not even had that yet.',
    exits: [
      {
        id: 'to_path',
        label: 'the track up the hill',
        to: 'past.cave_path',
        direction: 'west',
        // Not "tree": the great tree is an object in this square, and a
        // player typing EXAMINE TREE means the tree.
        aliases: ['track', 'path', 'up', 'cave', 'hill'],
      },
    ],
  },

  'past.cave_path': {
    id: 'past.cave_path',
    era: 'past',
    name: 'The Track',
    subtitle: () => 'The same turn of the hill, under a tree that is standing',
    description: (state) => {
      const parts: string[] = [];
      parts.push(
        'The track runs where the path runs at home, through the same thistle and the same ' +
          'loose shale, and it is wider and better kept than you have ever seen it. There are ' +
          'cart ruts. Somebody has been bringing stone down this hill all season.'
      );
      parts.push(
        'At the turn, where the stump sits, the tree stands. It is enormous. It throws shade ' +
          'across the whole bend of the track and there is a rope swing on the low limb, and a ' +
          'bare patch underneath it where the grass has been kicked off by feet.'
      );
      parts.push(
        'There are no chalk marks on the rocks counting off the last stretch, because there is ' +
          'nothing up here yet that anybody counts their way to.'
      );
      if (f(state, FLAGS.symptomWeather)) {
        parts.push(
          'The flat wet patch on the shale is still there, drying at the edges, and it has not ' +
            'rained.'
        );
      }
      parts.push(
        'A path cuts off north through the thistle to where the water comes out of the rock. ' +
          'The cave mouth is up and west. The square is down and east.'
      );
      return parts.join('\n\n');
    },
    firstVisit: () =>
      'You come round the turn and stop, because the shade is wrong.\n\n' +
      'You have sat on that stump your entire life. You have eaten bread on it and been sick ' +
      'behind it and carved a letter into it that you have never admitted to. It is a flat ' +
      'grey disc of dead wood about the width of your shoulders.\n\n' +
      'It is a tree. Somebody has hung a swing on it.',
    exits: [
      {
        id: 'to_entrance',
        label: 'the cave mouth',
        to: 'past.entrance',
        direction: 'west',
        aliases: ['cave', 'mouth', 'entrance', 'up', 'workings'],
      },
      {
        id: 'to_spring',
        label: 'the path to the spring',
        to: 'past.spring',
        direction: 'north',
        aliases: ['spring', 'water', 'rock', 'path north'],
      },
      {
        id: 'to_square',
        label: 'the village square',
        to: 'past.square',
        direction: 'east',
        aliases: ['square', 'village', 'down', 'roofs', 'back'],
      },
    ],
  },

  'past.spring': {
    id: 'past.spring',
    era: 'past',
    name: 'The Spring',
    subtitle: () => 'Water coming out of a hillside, as if that were ordinary',
    description: (state) => {
      const parts: string[] = [];
      parts.push(
        'The thistle gives out at a shelf of wet rock, and out of a cleft in it, at about the ' +
          'height of your knee, water comes. Not a trickle. A thumb-thick rope of it, steady, ' +
          'cold enough to ache, falling into a scooped basin somebody has lined with flat ' +
          'stones and then into a runnel that goes off downhill through the grass.'
      );
      parts.push(
        'The whole shelf is green with the kind of moss that only grows where water never ' +
          'stops. There are cup-marks worn into the lip of the basin where generations of ' +
          'hands and vessels have rested.'
      );
      parts.push(
        'You stand there longer than you need to, because at home this is a dry cleft in a ' +
          'rock that children dare each other to put an arm into, and nobody in the village ' +
          'can tell you what it was for.'
      );
      if (f(state, FLAGS.symptomWeather)) {
        parts.push(
          'The runnel below the basin is running clear and full, and for a moment — not long ' +
            'enough to be sure of — it is running the other way.'
        );
      }
      parts.push('The track back is south.');
      return parts.join('\n\n');
    },
    firstVisit: () =>
      'You put your hand under it before you think about it, the way you would at a pump, and ' +
      'the cold goes up your arm to the elbow and makes you laugh out loud on an empty ' +
      'hillside.',
    exits: [
      {
        id: 'to_path',
        label: 'the track back',
        to: 'past.cave_path',
        direction: 'south',
        aliases: ['track', 'path', 'back', 'out', 'hill'],
      },
    ],
  },

  'past.worksite': {
    id: 'past.worksite',
    era: 'past',
    name: 'The Workings',
    subtitle: () => 'A room three-quarters finished, with the plan still on the wall',
    sounds: () =>
      'Chisels, four of them, not in time with each other, and Lovage\'s voice going over the ' +
      'top of them about somebody\'s mother. Behind all of it, water moving somewhere it has ' +
      'not been let out of yet.',
    description: (state) => {
      const parts: string[] = [];
      parts.push(
        'The gap lets you through into a chamber you could cross in four steps, and you know ' +
          'the four steps. You know the corners. Three of the walls are being cut in a pattern ' +
          'of overlapping scales — two of them finished, the third chalked out and barely ' +
          'started, with the lines still crisp and a basket of cold chisels under it.'
      );
      parts.push(
        'In the middle of the floor stands a pillar of pale worked stone, square-dressed, ' +
          'left standing when the rest of the chamber was cut away from around it. It is new. ' +
          'You can see the dressing marks.'
      );
      parts.push(
        'The fourth wall has been thinned to a panel the thickness of a flagstone, and a ' +
          'half-cut opening has been started through the middle of it, low and wide. Cut into ' +
          'the face of the panel, up its full height, are three shallow dishes — except that ' +
          'there are two dishes and one chalk outline on rough rock.'
      );
      parts.push(
        'Pinned to the finished wall with four iron nails is a drawing on hide, and beside it, ' +
          'on a slate, somebody has been keeping notes.'
      );
      if (f(state, FLAGS.symptomMark)) {
        parts.push(
          'The chalk line snapped across this floor has a second chalk line beside it, a ' +
            'hand\'s width off and fainter, and both of them are in the same hand.'
        );
      }
      if (f(state, FLAGS.lanternInHighDish)) {
        parts.push(
          f(state, FLAGS.lanternLit)
            ? 'Your lantern stands in the high dish, burning, and the thinned panel has gone ' +
                'quiet in a way that stone does not go quiet.'
            : 'Your lantern stands in the high dish, dark. The panel is just a panel.'
        );
      }
      parts.push(lightNote(state, 'inner'));
      parts.push('The gap back to the basin chamber is south.');
      return parts.join('\n\n');
    },
    firstVisit: () =>
      'There is no sealed chamber at home. There is a small square room with three patterned ' +
      'walls and nothing in it, and everybody has always said that whoever cut it must have ' +
      'given up.\n\n' +
      'They did not give up. You are standing in the last week of the job.',
    exits: [
      {
        id: 'to_deep',
        label: 'the gap back to the basin chamber',
        to: 'past.deep_chamber',
        direction: 'south',
        aliases: ['gap', 'back', 'out', 'basin', 'chamber', 'spoil'],
      },
    ],
  },

  /* ================================================================ *
   * The cave, later. One room, and the end of what is built.
   * ================================================================ */

  'future.deep_chamber': {
    id: 'future.deep_chamber',
    era: 'future',
    name: 'The Broken Chamber',
    subtitle: () => 'The same room, a third of it on the floor',
    description: (state) => {
      const parts: string[] = [];
      parts.push(
        'The chamber is the chamber and it has been broken. A slab of the roof has come down ' +
          'and jammed against the far rim at an angle, and the rest of the ceiling is resting ' +
          'on that, and has been resting on it long enough to have grown a crust of pale ' +
          'mineral along the join.'
      );
      parts.push(
        'The basin is dry. The rim is cracked through in two places and the silt in the bottom ' +
          'has dried into plates and curled at the edges, and there is dust lying on top of ' +
          'the plates, which means it has been dry a great deal longer than a season.'
      );
      parts.push(
        'The worked stair goes up four treads and stops against a wall of fallen hill. High on ' +
          'the opposite wall, where there has never been an opening, the rock has torn open ' +
          'from floor to shoulder height, and through it comes daylight.'
      );
      parts.push(lightNote(state, 'inner'));
      parts.push(
        f(state, FLAGS.leftTheHill)
          ? 'The tear is a climb and you have done it once. It goes up and out.'
          : 'The tear is the only thing in this room that goes anywhere. It is a climb, and ' +
              'there is daylight at the top of it.'
      );
      return parts.join('\n\n');
    },
    firstVisit: () =>
      'The quiet is the thing. At home this room hums — you noticed it the first time, that ' +
      'second sound-room behind the first one, with its own weather in it.\n\n' +
      'This room has nothing behind it at all.',
    exits: [
      {
        id: 'to_path',
        label: 'the tear in the wall',
        to: 'future.cave_path',
        direction: 'up',
        // Not bare "tear": the tear is an object in this room.
        aliases: ['through the tear', 'out', 'hillside', 'climb'],
      },
    ],
  },

  'future.cave_path': {
    id: 'future.cave_path',
    era: 'future',
    name: 'The Hillside',
    subtitle: () => 'Above where the mouth used to be',
    description: (state) => {
      const parts: string[] = [];
      parts.push(
        'The tear lets you out high on the side of the hill, onto shale that has not had a ' +
          'path on it in a long time. There is no track up here any more. There is no stump ' +
          'and no tree at the turn, because there is no turn: the whole shoulder of the hill ' +
          'has come down a few feet and taken the shape of the ground with it.'
      );
      parts.push(
        'Below you and to the left, under the overhang where the mouth is, the rock has been ' +
          'closed with fitted stone. Not fallen. Built. Somebody squared the courses and ' +
          'bedded them and cut a mark into the face of it.'
      );
      parts.push(
        'The sky is the wrong colour and it is the same wrong colour everywhere you look, from ' +
          'the ridge to the water, with no edge to it.'
      );
      if (f(state, FLAGS.sawFutureSymptom)) {
        parts.push(
          'The bird is still going over, the same bird on the same line, and you have stopped ' +
            'counting how many times.'
        );
      }
      parts.push(
        'The tear goes back into the hill. The sealed mouth is down and west. The village is ' +
          'down and east.'
      );
      return parts.join('\n\n');
    },
    firstVisit: () => OUT_THROUGH_THE_TEAR,
    exits: [
      {
        id: 'to_deep',
        label: 'the tear back into the hill',
        to: 'future.deep_chamber',
        direction: 'in',
        aliases: ['through the tear', 'back', 'chamber', 'basin', 'down into the hill'],
      },
      {
        id: 'to_entrance',
        label: 'the sealed mouth',
        to: 'future.entrance',
        direction: 'west',
        aliases: ['mouth', 'seal', 'entrance', 'cave', 'stone', 'overhang'],
      },
      {
        id: 'to_square',
        label: 'the village below',
        to: 'future.square',
        direction: 'east',
        aliases: ['village', 'settlement', 'square', 'roofs', 'down', 'track'],
      },
    ],
  },

  'future.entrance': {
    id: 'future.entrance',
    era: 'future',
    name: 'The Sealed Mouth',
    subtitle: (state) =>
      f(state, FLAGS.sealOpened) ? 'Open, and not by anybody who lives here' : 'Closed, and marked',
    description: (state) => {
      const parts: string[] = [];
      if (f(state, FLAGS.sealOpened)) {
        parts.push(
          'The seal is down. It came out in courses and it lies where it fell, and the hole ' +
            'behind it is the shape of the mouth you have walked into twice, narrower at the ' +
            'top than you remember because the lintel has dropped.'
        );
        parts.push(
          'Cold air comes out of it steadily, and it smells of a room that has been shut for a ' +
            'hundred years, which is what it is.'
        );
      } else {
        parts.push(
          'The overhang is where the overhang is. Under it, where the mouth should be, there is ' +
            'a wall: fitted stone, squared and bedded, eight or nine courses of it, filling the ' +
            'opening from the floor to the rock above.'
        );
        parts.push(
          'It is good work. Somebody who knew what they were doing closed this hill on purpose ' +
            'and meant it to stay closed, and then cut a mark into the middle of the face so ' +
            'that nobody would mistake it for a rockfall.'
        );
      }
      parts.push(
        'There is no bench. There is no iron ring. The lintel inscription is under the rubble ' +
          'of the lintel.'
      );
      parts.push(lightNote(state, 'outer'));
      parts.push(
        f(state, FLAGS.sealOpened)
          ? 'The hillside goes back up and east. The way in goes west.'
          : 'The hillside goes back up and east.'
      );
      return parts.join('\n\n');
    },
    firstVisit: () =>
      'You put both hands flat on it before you have thought about why.\n\n' +
      'Somebody stood here with a trowel and shut the only thing in this valley that anybody ' +
      'has ever walked up a hill to see.',
    exits: [
      {
        id: 'to_path',
        label: 'the hillside',
        to: 'future.cave_path',
        direction: 'east',
        aliases: ['hillside', 'up', 'back', 'shale', 'path'],
      },
      {
        id: 'to_sealed',
        label: 'the opened mouth',
        to: 'future.sealed_chamber',
        direction: 'west',
        aliases: ['mouth', 'in', 'inside', 'cave', 'hole', 'through'],
        requires: (state) => f(state, FLAGS.sealOpened),
      },
    ],
  },

  'future.sealed_chamber': {
    id: 'future.sealed_chamber',
    era: 'future',
    name: 'The Crushed Chamber',
    subtitle: () => 'The square room, with the hill in it',
    description: (state) => {
      const parts: string[] = [];
      parts.push(
        'Four steps in, the floor stops being floor and becomes the underside of the hill. The ' +
          'roof has come down across the whole back half of the room and jammed, and what is ' +
          'left is a wedge of space with a patterned wall on one side of it and a slope of ' +
          'broken rock on the other.'
      );
      parts.push(
        'The scale-pattern is still there on the wall you can reach, every row of it, dry and ' +
          'perfect. Where the alcove and the shutter should be there is a thousand tons of ' +
          'hill.'
      );
      parts.push(
        'The pillar is not standing. You find it in two pieces under the fall, square-dressed ' +
          'on the faces you can see.'
      );
      parts.push(
        'The thinned panel is on the reachable side and it is intact. Up its face, where you ' +
          'know they are, the three positions: two of them plastered flat and smoothed over, ' +
          'and the middle one the same — except that the fill over the middle one has cracked ' +
          'right across and is holding on by habit.'
      );
      if (f(state, FLAGS.fillCleared)) {
        parts.push(
          'The fill is off the middle position and lying in pieces at your feet. The dish ' +
            'behind it is dressed smooth and undercut at the lip and has never been used.'
        );
      }
      if (f(state, FLAGS.lanternInMiddleDish)) {
        parts.push(
          f(state, FLAGS.lanternLit)
            ? 'Your lantern stands in the middle dish, burning, and the panel has gone quiet ' +
                'the way it goes quiet.'
            : 'Your lantern stands in the middle dish, dark.'
        );
      }
      parts.push(lightNote(state, 'inner'));
      parts.push('The way out is east.');
      return parts.join('\n\n');
    },
    firstVisit: () =>
      'They filled them in. That is the thing you stand there holding.\n\n' +
      'When the work was finished, Lovage\'s crew went up that panel and plastered two of the ' +
      'three positions flat and smoothed them over and left one, low down, behind a shutter, ' +
      'with a picture of it cut on a wall where anybody could find it.\n\n' +
      'They did not know what they had. They knew enough to leave one.',
    exits: [
      {
        id: 'to_entrance',
        label: 'the way out',
        to: 'future.entrance',
        direction: 'east',
        aliases: ['out', 'mouth', 'entrance', 'daylight', 'back'],
      },
    ],
  },

  'future.square': {
    id: 'future.square',
    era: 'future',
    name: 'The Settlement',
    subtitle: () => 'Your square, with about thirty people left in it',
    sounds: () =>
      'The pump handle, and the knock of a bucket on the well-cap, and thirty people being ' +
      'quiet in a space built for two hundred.\n\nNo hammer. No chickens. No cord of lanterns ' +
      'in the wind. You keep listening for the gap where those ought to be.',
    description: (state) => {
      const parts: string[] = [];
      parts.push(
        'It is the square. The well is in the middle of it where the well has always been, ' +
          'capped with a slab and sealed round the edge with something black, and there is a ' +
          'hand pump bolted through the slab that four people are queuing at with buckets.'
      );
      parts.push(
        'The houses are the houses, lower than you remember and patched with anything that ' +
          'came to hand: slate, board, a cart side, a door used as a wall. Where the bakehouse ' +
          'was there is a long shed with a roof of beaten metal and smoke coming out of one ' +
          'end. Where the joiner\'s workshop was there is a shell with no roof at all, and ' +
          'somebody keeps goats in it.'
      );
      parts.push(
        'There is a lot of work going on and all of it is mending. Nobody here is building ' +
          'anything.'
      );
      parts.push(
        'A stone stands by the well with writing cut into it. Beside the shed, under a scrap ' +
          'of oilcloth, there is a chest, and a woman sitting with her back against it.'
      );
      if (f(state, FLAGS.lostEye)) {
        parts.push(
          'People stop what they are doing when you come into the square now, and go back to ' +
            'it slightly too quickly.'
        );
      }
      parts.push('The hill goes back up, west.');
      return parts.join('\n\n');
    },
    firstVisit: () =>
      'Thirty people. You count them twice on the way down because you cannot make it come ' +
      'out higher.\n\n' +
      'Two hundred and eleven live in this square. You know that because Sage keeps it on the ' +
      'back of the plank and corrects it when somebody is born.',
    exits: [
      {
        id: 'to_path',
        label: 'the hill',
        to: 'future.cave_path',
        direction: 'west',
        aliases: ['hill', 'hillside', 'up', 'track', 'cave', 'back'],
      },
    ],
  },
};

export const ALL_LOCATION_IDS = Object.keys(LOCATIONS) as LocationId[];

export function isLocationId(value: unknown): value is LocationId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(LOCATIONS, value);
}
