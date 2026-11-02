import type { GameState, LocationDef, LocationId } from '../engine/types';
import { FLAGS } from './flags';

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
    description: () =>
      'Your room is the width of two arm-spans and smells of woodsmoke from the flue that ' +
      'runs up through the corner. Someone has been up before you: there is bread set out on ' +
      'the stool by the door, and the shutter is already hooked back.\n\n' +
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
      f(state, FLAGS.passageOpen) ? 'Not as sealed as its name' : 'Small, square, and finished',
    description: (state) => {
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
      },
      {
        id: 'to_deep',
        label: 'the opened passage',
        to: 'present.deep_chamber',
        direction: 'down',
        aliases: ['passage', 'opening', 'seam', 'in', 'through', 'deeper'],
        requires: (state) => f(state, FLAGS.passageOpen),
      },
    ],
  },

  'present.deep_chamber': {
    id: 'present.deep_chamber',
    era: 'present',
    name: 'The Deep Chamber',
    subtitle: () => 'Below the part of the cave that has a name',
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
        aliases: ['steps', 'sealed chamber', 'back', 'out', 'west', 'chamber'],
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
      lightNote(state, 'outer') +
      '\n\nA worked stair goes up and out.',
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
      'The stair goes back down. The track down to the roofs goes east.',
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
        id: 'to_square',
        label: 'the track down to the village',
        to: 'past.square',
        direction: 'east',
        aliases: ['village', 'track', 'square', 'roofs'],
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
      parts.push('The track back up to the cave mouth is west.');
      return parts.join('\n\n');
    },
    firstVisit: () =>
      'Nobody looks up. You are a stranger on the path, which in a village this size is worth ' +
      'exactly one glance, and you have not even had that yet.',
    exits: [
      {
        id: 'to_entrance',
        label: 'the track up to the cave mouth',
        to: 'past.entrance',
        direction: 'west',
        aliases: ['track', 'cave', 'up', 'entrance', 'mouth', 'hill'],
      },
    ],
  },
};

export const ALL_LOCATION_IDS = Object.keys(LOCATIONS) as LocationId[];

export function isLocationId(value: unknown): value is LocationId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(LOCATIONS, value);
}
