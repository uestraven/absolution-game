import type { GameState, SelectableVerb, WorldObjectDef } from '../engine/types';
import { FLAGS } from './flags';

const f = (state: GameState, key: string): boolean => Boolean(state.flags[key]);

const OBJECT_LIST: WorldObjectDef[] = [
  /* ================================================================ *
   * present.home
   * ================================================================ */
  {
    id: 'home.lantern',
    name: 'hooded lantern',
    nouns: ['lantern', 'lamp', 'hooded lantern', 'light'],
    locationId: 'present.home',
    initiallyVisible: true,
    hiddenWhen: (state) => state.inventory.includes('lantern'),
    listAs: 'a hooded lantern on the windowsill',
    item: 'lantern',
    verbs: () => ['examine', 'take'],
    description: () =>
      'A hooded lantern, tin, dented along one shoulder, with a horn pane and a sliding hood. ' +
      'The wick has been trimmed by somebody who knew to do it. A striker hangs from the base ' +
      'on a short chain — fixed on, so it cannot be left behind.\n\n' +
      'There is a strip of cloth knotted round the handle, with writing on it.',
    onExamine: {
      reveals: ['home.tag'],
      journal: [
        {
          id: 'j.lantern',
          text: 'A hooded lantern was left on my windowsill. It has a striker fixed to the base.',
        },
      ],
    },
  },
  {
    id: 'home.tag',
    name: 'cloth tag',
    nouns: ['tag', 'cloth', 'strip', 'writing', 'cloth tag', 'note'],
    locationId: 'present.home',
    initiallyVisible: false,
    listAs: 'a cloth tag knotted to the lantern handle',
    verbs: () => ['examine'],
    description: () =>
      'Three words in ink that has run a little:\n\n    Sixteen. Go carefully.\n\n' +
      'No name on it. Nobody in this house signs things.',
  },
  {
    id: 'home.window',
    name: 'window',
    nouns: ['window', 'sill', 'windowsill', 'shutter'],
    locationId: 'present.home',
    initiallyVisible: true,
    listAs: 'the open window',
    verbs: () => ['examine'],
    description: () =>
      'From up here you can see most of the square and all of the hill behind it. Somebody is ' +
      'stringing cord between the eaves across the way, working out along a ladder, and ' +
      'somebody at the bottom is telling them how to do it.\n\n' +
      'Further up, above the roofs, the cave path shows as a pale scar in the thistle.',
  },
  {
    id: 'home.bread',
    name: 'bread',
    nouns: ['bread', 'stool', 'breakfast', 'food'],
    locationId: 'present.home',
    initiallyVisible: true,
    listAs: 'bread set out on a stool',
    verbs: () => ['examine'],
    description: () =>
      'Yesterday\'s loaf, cut thick, with the good end facing up. Someone wanted you to find ' +
      'it and did not want to be there when you did.',
  },

  /* ================================================================ *
   * present.square
   * ================================================================ */
  {
    id: 'square.plank',
    name: 'chalked plank',
    nouns: ['plank', 'board', 'chalk', 'chalked plank', 'writing', 'prophecy', 'words'],
    locationId: 'present.square',
    initiallyVisible: true,
    listAs: 'a chalked plank propped by the well',
    verbs: () => ['examine'],
    description: () =>
      'A door-plank set on its edge and written over in a careful hand. Some lines have been ' +
      'gone over twice where the chalk wore thin.\n\n' +
      '    The Wanderer comes one-eyed and without mercy.\n' +
      '    The hill will open. The water will answer.\n' +
      '    What stands will not stand.\n' +
      '    One who braves the Cave of Absolution will have the power to turn it aside.\n\n' +
      'Underneath, in a different hand and smaller: *and will they, though.*',
    onExamine: {
      flags: { [FLAGS.heardProphecy]: true },
      journal: [
        {
          id: 'j.prophecy',
          text:
            'The prophecy on the plank: a one-eyed monster called the Wanderer brings a ' +
            'cataclysm, and someone who braves the Cave of Absolution will have the power to ' +
            'turn it aside.',
        },
      ],
    },
  },
  {
    id: 'square.lanterns',
    name: 'strung lanterns',
    nouns: ['lanterns', 'cord', 'strung lanterns', 'lights', 'eaves'],
    locationId: 'present.square',
    initiallyVisible: true,
    listAs: 'lanterns strung unlit on cord',
    verbs: () => ['examine'],
    description: () =>
      'Forty-odd lanterns on a cord between the eaves, every one of them filled and trimmed ' +
      'and not lit. They have been up for eleven days.\n\n' +
      'Nobody has said what night they are for. Asking has stopped being a thing people do.',
  },
  {
    id: 'square.salt',
    name: 'bowl of salt',
    nouns: ['salt', 'bowl', 'bowl of salt', 'well cap', 'wellcap'],
    locationId: 'present.square',
    initiallyVisible: true,
    listAs: 'a bowl of salt on the well-cap',
    verbs: () => ['examine'],
    description: () =>
      'Coarse grey salt in a wooden bowl, heaped and smoothed flat on top. It is not a village ' +
      'custom you grew up with. It arrived this spring, fully formed, the way customs do when ' +
      'people are frightened and busy.',
  },
  {
    id: 'square.well',
    name: 'well',
    nouns: ['well', 'windlass', 'bucket'],
    locationId: 'present.square',
    initiallyVisible: true,
    listAs: 'the well',
    verbs: () => ['examine'],
    description: () =>
      'The well is the oldest thing in the square and acts like it. The cap is worn into a dish ' +
      'where buckets have been dragged across it for longer than anyone has been counting. The ' +
      'rope is grey and soft with handling.',
  },

  /* ================================================================ *
   * present.workshop
   * ================================================================ */
  {
    id: 'workshop.basket',
    name: 'basket of offcuts',
    nouns: ['basket', 'offcuts', 'scraps', 'basket of offcuts'],
    locationId: 'present.workshop',
    initiallyVisible: true,
    listAs: 'a basket of offcuts under the bench',
    verbs: () => ['examine'],
    description: (state) =>
      'Dowel ends, triangles of oak and ash, a few pieces with the bark still on. ' +
      (state.inventory.includes('wedge')
        ? 'There are plenty more wedges in here, cut the same way.'
        : 'Near the top, a handful of tapered blocks — wedges, cut off-square so they bite. ' +
          'Oreg waves a hand at the basket without looking up. "Help yourself. That\'s what ' +
          'it\'s for."'),
    onExamine: {
      reveals: ['workshop.wedge'],
    },
  },
  {
    id: 'workshop.wedge',
    name: 'wooden wedge',
    nouns: ['wedge', 'wooden wedge', 'block', 'chock', 'shim'],
    locationId: 'present.workshop',
    initiallyVisible: true,
    hiddenWhen: (state) => state.inventory.includes('wedge'),
    listAs: 'a wooden wedge, free for the taking',
    item: 'wedge',
    verbs: () => ['examine', 'take'],
    description: () =>
      'A tapered block of oak about the size of your palm, cut off-square so it bites rather ' +
      'than slides. Saw marks on one face. The sort of thing that holds a door open all ' +
      'afternoon and gets kicked loose at dusk.',
    onExamine: {
      journal: [
        {
          id: 'j.wedge',
          text: 'Oreg gives away oak wedges from the offcut basket. They bite rather than slide.',
        },
      ],
    },
  },
  {
    id: 'workshop.bench',
    name: 'bench',
    nouns: ['bench', 'workbench', 'tools', 'joint'],
    locationId: 'present.workshop',
    initiallyVisible: true,
    listAs: "Oreg's bench",
    verbs: () => ['examine'],
    description: () =>
      'Elm, four inches thick, scarred to a map of itself. A row of chisels stand in a rack ' +
      'with their edges turned in. The joint under Oreg\'s hands is a housed dovetail and it ' +
      'is going together without being forced.',
  },

  /* ================================================================ *
   * present.cave_path
   * ================================================================ */
  {
    id: 'path.stump',
    name: 'old stump',
    nouns: ['stump', 'old stump', 'tree stump', 'seat'],
    locationId: 'present.cave_path',
    initiallyVisible: true,
    listAs: 'an old stump at the turn of the path',
    verbs: () => ['examine'],
    description: () =>
      'A stump the width of a cart wheel, cut level and polished to a shine on top. The rings ' +
      'are too weathered to count. Nobody alive remembers the tree; the word for this spot is ' +
      'just "the stump".\n\n' +
      'The grain on the cut face spirals slightly, which means it was a big one and it grew ' +
      'leaning.',
    onExamine: {
      journal: [
        {
          id: 'j.stump',
          text:
            'The stump at the turn of the cave path is cart-wheel wide. Nobody alive remembers ' +
            'the tree it came from.',
        },
      ],
    },
  },
  {
    id: 'path.marks',
    name: 'chalk marks',
    nouns: ['marks', 'chalk', 'chalk marks', 'rocks'],
    locationId: 'present.cave_path',
    initiallyVisible: true,
    listAs: 'chalk marks counting off the rocks',
    verbs: () => ['examine'],
    description: () =>
      'Someone has chalked numerals on the shale at intervals, counting down to the mouth. ' +
      'They are refreshed every spring. It is the sort of kindness that looks like fussing ' +
      'until the one time you need it.',
  },

  /* ================================================================ *
   * present.entrance
   * ================================================================ */
  {
    id: 'entrance.rope',
    name: 'knotted rope',
    nouns: ['rope', 'knotted rope', 'ring', 'iron ring', 'line'],
    locationId: 'present.entrance',
    initiallyVisible: true,
    listAs: 'a knotted rope running into the dark',
    verbs: () => ['examine'],
    description: () =>
      'Hemp, as thick as two fingers, spliced onto an iron ring set in the floor. Knots every ' +
      'arm-span, each one worn smooth and slightly flattened.\n\n' +
      'It runs in along the slope and ends, you are told, at a pillar in the first gallery. ' +
      'Hand over hand, in the dark, with your eyes shut, you could follow it back out of here. ' +
      'That is the whole point of it.',
    onExamine: {
      journal: [
        {
          id: 'j.rope',
          text:
            'A knotted rope runs from an iron ring at the cave mouth to a pillar in the outer ' +
            'gallery. Followed by hand, it leads back out.',
        },
      ],
    },
  },
  {
    id: 'entrance.lintel',
    name: 'lintel',
    nouns: ['lintel', 'letters', 'inscription', 'carving', 'words'],
    locationId: 'present.entrance',
    initiallyVisible: true,
    listAs: 'letters cut into the lintel',
    verbs: () => ['examine'],
    description: () =>
      'Cut deep and kept clear of moss:\n\n    GO IN. COME OUT. BE EASIER WITH YOURSELF.\n\n' +
      'The letters are old-fashioned and the sentiment is not. Nobody knows who cut it. It is ' +
      'read aloud at every rite and it has never once needed explaining.',
    onExamine: {
      journal: [
        {
          id: 'j.lintel',
          text: 'The lintel at the cave mouth reads: GO IN. COME OUT. BE EASIER WITH YOURSELF.',
        },
      ],
    },
  },
  {
    id: 'entrance.bench',
    name: 'bench',
    nouns: ['bench', 'seat', 'hook'],
    locationId: 'present.entrance',
    initiallyVisible: true,
    listAs: 'a bench, and a hook with spare rope',
    verbs: () => ['examine'],
    description: () =>
      'A plank bench on two stones, the kind of furniture that exists because people wait here. ' +
      'Above it, a hook holds a spare coil.\n\n' +
      'Somebody has scratched a shallow line into the bench for every rite kept this year. You ' +
      'count eleven, which with yours makes twelve.',
  },

  /* ================================================================ *
   * present.outer_gallery
   * ================================================================ */
  {
    id: 'gallery.scratches',
    name: 'scratches',
    nouns: ['scratches', 'names', 'tallies', 'wall', 'left wall', 'left-hand wall', 'marks', 'dates'],
    locationId: 'present.outer_gallery',
    initiallyVisible: true,
    listAs: 'scratched names and tallies on the left-hand wall',
    verbs: () => ['examine'],
    description: () =>
      'Two generations of handwriting, at every height a person can reach.\n\n' +
      'Most of it is names and a year. Some of it is arithmetic — tallies of how many paces, ' +
      'how many turns, how long the candle lasted. A few are honest in a way that stops you: ' +
      '*got this far. didn\'t like it.* And a dozen times over, in a dozen hands, the same ' +
      'short word scratched hard: *nothing.*\n\n' +
      'You know about a third of these names. One of them taught you to swim.',
    onExamine: {
      journal: [
        {
          id: 'j.scratches',
          text:
            'The gallery wall is covered in names, tallies and turn-back notes. The commonest ' +
            'word scratched there is "nothing".',
        },
      ],
    },
  },
  {
    id: 'gallery.relief',
    name: 'worn relief',
    nouns: [
      'relief',
      'worn relief',
      'carving',
      'right wall',
      'right-hand wall',
      'picture',
      'traveller',
      'traveler',
    ],
    acceptsItems: true,
    locationId: 'present.outer_gallery',
    initiallyVisible: true,
    listAs: 'a worn relief, older than the scratches',
    verbs: () => ['examine'],
    description: (state) => {
      const parts: string[] = [];
      parts.push(
        'It is cut flat into the rock, about the size of a door, and water has been running ' +
          'over the top half of it for a very long time. Nobody has scratched a name across ' +
          'it, which tells you people have always known it was older than they were.'
      );
      parts.push(
        'What survives is this. A figure — a traveller, with a roll of bedding on their back — ' +
          'kneeling. They are not praying. They are setting a lamp down, with both hands, into ' +
          'a squared recess at the very bottom of the picture, a recess cut low and deep, at ' +
          'ankle height to the figure.'
      );
      parts.push(
        'Directly above the recess, the stone opens in a round eye: a hole cut right through ' +
          'the relief, rimmed like a lid. From the eye, straight lines fan upward and outward ' +
          'across the rock, widening as they go.'
      );
      parts.push(
        'The lamp is below. The eye is above the lamp. The light goes up through the eye and ' +
          'spreads. Whoever cut this was not decorating. They were describing how to do ' +
          'something.'
      );
      if (f(state, FLAGS.reliefMatched)) {
        parts.push(
          'And you have seen that squared recess since. Low on a wall, set deep, with a shutter ' +
            'in a grooved frame over it, four steps and one squeeze away from here.'
        );
      }
      return parts.join('\n\n');
    },
    onExamine: {
      flags: { [FLAGS.reliefExamined]: true },
      journal: [
        {
          id: 'j.relief',
          text:
            'The relief in the outer gallery shows a traveller setting a lamp into a squared ' +
            'recess low on a wall, with a round eye cut through the stone above the recess and ' +
            'lines fanning up from it.',
        },
      ],
    },
  },
  {
    id: 'gallery.pillar',
    name: 'pillar',
    nouns: ['pillar', 'column', 'rope', 'rope end'],
    locationId: 'present.outer_gallery',
    initiallyVisible: true,
    listAs: 'the pillar the rope is tied to',
    verbs: () => ['examine'],
    description: () =>
      'A natural column where a drip has been building and a pool has been eating for a few ' +
      'thousand years, and they have met in the middle. The rope is round it twice and tied ' +
      'off with something sensible.\n\n' +
      'Behind you up the slope, the entrance is still a bright slot. You could put your thumb ' +
      'over it.',
  },
  {
    id: 'gallery.ash',
    name: 'old ash',
    nouns: ['ash', 'old ash', 'floor', 'torches', 'soot'],
    locationId: 'present.outer_gallery',
    initiallyVisible: true,
    listAs: 'patches of old ash on the floor',
    verbs: () => ['examine'],
    description: () =>
      'Torch ash, trodden into the floor in a dozen patches. They cluster here, under the ' +
      'scratches, and thin out fast towards the crawl and the squeeze.\n\n' +
      'People came in with a burning torch in one hand, stood about here, held it up, looked ' +
      'round the room, and went home. The ash is a map of exactly that.',
  },

  /* ================================================================ *
   * present.echo_chamber
   * ================================================================ */
  {
    id: 'echo.account',
    name: 'scratched words',
    nouns: ['words', 'scratched words', 'account', 'writing', 'wall', 'inscription'],
    locationId: 'present.echo_chamber',
    initiallyVisible: true,
    listAs: 'words scratched at sitting height',
    verbs: () => ['examine'],
    description: () =>
      'Scratched with something soft — a buckle, maybe — in a hand that starts neat and ends ' +
      'in a scrawl:\n\n' +
      '    I am going to write this down and then I am going to go out.\n' +
      '    It is the sound. It comes from over your head. There is nothing\n' +
      '    over your head. I sat down because my legs went and then I could\n' +
      '    not get up for a while and I want that written somewhere.\n' +
      '    Nothing happened to me. Nothing is here. I just could not stay.\n' +
      '    — H.\n\n' +
      'Below it, much later and much steadier, the same initial again: *came back and read ' +
      'this. still true. still fine.*',
    onExamine: {
      flags: { [FLAGS.readFledAccount]: true },
      journal: [
        {
          id: 'j.fled',
          text:
            'Someone signing themselves H. scratched an account in the echo chamber: they fled ' +
            'because of the sound overhead, and came back later to confirm it.',
        },
      ],
    },
  },
  {
    id: 'echo.boot',
    name: 'boot',
    nouns: ['boot', 'shoe'],
    locationId: 'present.echo_chamber',
    initiallyVisible: true,
    listAs: 'a single boot by the water',
    verbs: () => ['examine'],
    description: () =>
      'A left boot, child-sized or near it, lying on its side with the laces still tied in a ' +
      'bow. The leather has gone hard and pale.\n\n' +
      'It has been here long enough that the water has moved away from it. Whoever walked out ' +
      'of here did it one-shod and in a hurry, and lived, because somebody tied that bow and ' +
      'nobody unties a bow in a panic.',
  },
  {
    id: 'echo.water',
    name: 'standing water',
    nouns: ['water', 'standing water', 'pool', 'dish', 'drip'],
    acceptsItems: true,
    locationId: 'present.echo_chamber',
    initiallyVisible: true,
    listAs: 'a shallow dish of standing water',
    verbs: () => ['examine'],
    description: () =>
      'An ankle-deep dish of water with a floor of fine silt, so clear it reads as empty until ' +
      'you put a hand in it. Cold enough to ache.\n\n' +
      'The drip you can hear is not falling into this. It is falling into something else, ' +
      'somewhere behind the wall, with a lower note.',
  },

  /* ================================================================ *
   * present.sealed_chamber
   * ================================================================ */
  {
    id: 'sealed.shutter',
    name: 'stone shutter',
    nouns: ['shutter', 'stone shutter', 'slab', 'frame', 'grooved frame', 'stone'],
    acceptsItems: true,
    locationId: 'present.sealed_chamber',
    initiallyVisible: true,
    listAs: (state) =>
      f(state, FLAGS.shutterHeld)
        ? 'the stone shutter, wedged up'
        : 'a stone shutter low on the fourth wall',
    verbs: (state) => (f(state, FLAGS.shutterHeld) ? ['examine', 'use'] : ['examine', 'open', 'use']),
    description: (state) => {
      const parts: string[] = [];
      parts.push(
        'A slab of the same grey rock as the wall, a hand\'s span thick, sitting in a pair of ' +
          'cut grooves so that it slides straight up and straight down. There is a lip along ' +
          'the bottom edge, worn, that your fingers fit under.'
      );
      parts.push(
        'It is heavy but not unmanageable. The grooves are clean. This was made to be opened.'
      );
      if (f(state, FLAGS.shutterHeld)) {
        parts.push('The oak wedge is jammed in under the lip. The shutter stays where it is put.');
      } else if (f(state, FLAGS.shutterTried)) {
        parts.push(
          'Nothing holds it up. The moment your hands come off the lip, it runs back down the ' +
            'grooves and sits closed.'
        );
      }
      return parts.join('\n\n');
    },
    onExamine: {
      journal: [
        {
          id: 'j.shutter',
          text:
            'The sealed chamber has a stone shutter in cut grooves, low on the fourth wall. It ' +
            'slides up, and nothing holds it there.',
        },
      ],
    },
  },
  {
    id: 'sealed.alcove',
    name: 'alcove',
    nouns: ['alcove', 'recess', 'niche', 'squared recess', 'hollow'],
    acceptsItems: true,
    locationId: 'present.sealed_chamber',
    initiallyVisible: false,
    listAs: (state) =>
      f(state, FLAGS.shutterHeld) ? 'the open alcove behind the shutter' : 'the alcove behind the shutter',
    verbs: () => ['examine'],
    description: (state) => {
      const parts: string[] = [];
      parts.push(
        'A squared hollow cut back into the rock, deeper than it looks — you could lose your ' +
          'whole forearm in it. The back and sides are smoke-black. The floor of it is flat and ' +
          'slightly dished, as if something round was meant to sit there and not roll.'
      );
      parts.push(
        'It is at ankle height. It is a long way back from the room. You could not light a ' +
          'torch in here and get any good of it, and you certainly could not warm your hands.'
      );
      if (!f(state, FLAGS.shutterHeld)) {
        parts.push('The shutter is down over it now. You are working from memory.');
      } else if (f(state, FLAGS.lanternInAlcove)) {
        parts.push(
          f(state, FLAGS.lanternLit)
            ? 'Your lantern is standing in it, lit, seated in the dish.'
            : 'Your lantern is standing in it, unlit.'
        );
      }
      return parts.join('\n\n');
    },
  },
  {
    id: 'sealed.eye',
    name: 'carved eye',
    nouns: ['eye', 'carved eye', 'hole', 'stone eye', 'opening in the wall'],
    acceptsItems: true,
    locationId: 'present.sealed_chamber',
    initiallyVisible: true,
    listAs: 'a carved eye pierced through the wall above the shutter',
    verbs: () => ['examine'],
    description: () =>
      'A round hole, a hand across, cut clean through a thinned panel of the wall and rimmed ' +
      'all round like a lid half-lifted. Put your eye to it and there is nothing behind but ' +
      'more rock, a finger\'s depth back.\n\n' +
      'So it is not a window and not a spyhole. It is a hole that light is supposed to go ' +
      'through, from below, going up.\n\n' +
      'It is at face height, in plain view, and it has been looked at by everyone who ever ' +
      'came in here.',
    onExamine: {
      journal: [
        {
          id: 'j.eye',
          text:
            'Above the sealed chamber\'s shutter, a carved eye is pierced through a thin panel ' +
            'of wall. Nothing is behind it. Light would pass up through it.',
        },
      ],
    },
  },
  {
    id: 'sealed.wall',
    name: 'patterned wall',
    nouns: [
      'wall',
      'patterned wall',
      'pattern',
      'scales',
      'scale pattern',
      'walls',
      'far wall',
      'carved wall',
      'stone',
    ],
    acceptsItems: true,
    locationId: 'present.sealed_chamber',
    initiallyVisible: true,
    listAs: 'walls cut in a pattern of overlapping scales',
    verbs: (state) => (f(state, FLAGS.seamRevealed) && !f(state, FLAGS.passageOpen) ? ['examine', 'open'] : ['examine']),
    description: (state) => {
      const parts: string[] = [];
      parts.push(
        'Overlapping scales, each about the width of two fingers, cut shallow and repeated ' +
          'across three walls without a single break in the rhythm. Thousands of them. It must ' +
          'have taken a season.'
      );
      parts.push(
        f(state, FLAGS.lanternLit)
          ? 'Held up close, your lantern flattens the whole thing. Every cut throws the same ' +
              'short shadow in every direction at once, and the wall reads as one continuous ' +
              'surface. That is exactly what the pattern is for.'
          : 'In this light you cannot take in more than a hand\'s width at a time, so you go ' +
              'over it by touch instead: the same depth, the same spacing, the same surface, ' +
              'everywhere your palm goes. That is exactly what the pattern is for.'
      );
      if (f(state, FLAGS.passageOpen)) {
        parts.push(
          'A door-sized section of it now stands swung back on a pivot, and the scales run on ' +
            'across the join as if nothing had ever opened there.'
        );
      } else if (f(state, FLAGS.seamRevealed)) {
        parts.push(
          'Not now, though. With the light coming from down in the alcove and up through the ' +
            'eye, it arrives across this wall at a long flat angle, and one line of scales — ' +
            'floor to shoulder height, then a turn, then across — stops casting a shadow and ' +
            'starts being one.\n\n' +
            'It is a seam. You can get your fingertips into it.'
        );
      }
      return parts.join('\n\n');
    },
  },
  {
    id: 'sealed.seam',
    name: 'seam',
    nouns: ['seam', 'line', 'crack', 'joint', 'edge'],
    locationId: 'present.sealed_chamber',
    initiallyVisible: false,
    hiddenWhen: (state) => f(state, FLAGS.passageOpen),
    listAs: 'a seam in the pattern, picked out by the light',
    verbs: () => ['examine', 'open'],
    description: () =>
      'It runs up from the floor to shoulder height, turns, runs level for the width of a door, ' +
      'and turns down again. Where the light crosses it the gap is the thickness of a knife.\n\n' +
      'The scale-pattern has been laid out so that the seam falls exactly along the edge of one ' +
      'row. Straight on, under a torch, it is invisible. You have been standing in front of it ' +
      'for several minutes.',
  },
  {
    id: 'sealed.passage',
    name: 'opened passage',
    nouns: ['passage', 'opening', 'opened passage', 'doorway', 'door', 'steps'],
    locationId: 'present.sealed_chamber',
    initiallyVisible: false,
    listAs: 'the opened passage, going down',
    verbs: () => ['examine'],
    description: () =>
      'A slab of patterned wall standing open on a pivot cut into the floor and the lintel. ' +
      'Beyond it the rock has been cut into steps, going down and bending right.\n\n' +
      'The air coming up the steps is still, and warmer than the room you are in.',
  },

  /* ================================================================ *
   * present.deep_chamber
   * ================================================================ */
  {
    id: 'deep.threshold',
    name: 'threshold',
    nouns: ['threshold', 'basin', 'water', 'pool', 'rim', 'surface', 'depth'],
    acceptsItems: true,
    locationId: 'present.deep_chamber',
    initiallyVisible: true,
    listAs: 'the basin, and the depth in it',
    verbs: () => ['examine', 'cross'],
    description: () => {
      return (
        'You crouch at the rim and look in, and you do not need a light to do it.\n\n' +
        'The surface does not move. Your reflection is there, and under your reflection the ' +
        'water goes down. Pale stone sides, falling away in straight courses, past the depth ' +
        'the rim could hold, past the floor you are kneeling on, past the foot of the hill, ' +
        'and still going, clear the whole way, lit from no direction you can name.\n\n' +
        'You put a hand flat on the floor beside it to be sure of the floor.\n\n' +
        'And the sound changes. Not louder. Nearer. The hush of a big room arrives up out of ' +
        'the basin and sits over the top of this one — wind moving through something, a bird, ' +
        'a long way off, in daylight.\n\n' +
        'There is no softer way to say it: the hole in the floor has weather in it.'
      );
    },
    onExamine: {
      flags: { [FLAGS.thresholdExamined]: true },
      journal: [
        {
          id: 'j.threshold',
          text:
            'The basin in the deep chamber holds a depth it has no room for, and the sound of ' +
            'somewhere else comes up out of it.',
        },
      ],
    },
  },
  {
    id: 'deep.steps',
    name: 'cut steps',
    nouns: ['steps', 'cut steps', 'stair', 'stairs', 'walls', 'floor'],
    locationId: 'present.deep_chamber',
    initiallyVisible: true,
    listAs: 'the cut steps you came down',
    verbs: () => ['examine'],
    description: () =>
      'Cut, not worn — each tread still square at the front edge after however long this has ' +
      'been shut. You can get back up them in four strides.\n\n' +
      'There is no dust on them either. Nothing has fallen in here since whoever cut the last ' +
      'step walked out.',
  },

  /* ================================================================ *
   * past.deep_chamber
   * ================================================================ */
  {
    id: 'pastdeep.basin',
    name: 'basin',
    nouns: ['basin', 'water', 'pool', 'rim', 'threshold', 'surface'],
    acceptsItems: true,
    locationId: 'past.deep_chamber',
    initiallyVisible: true,
    listAs: 'the basin, a hand deep',
    verbs: () => ['examine', 'cross'],
    description: () =>
      'A hand\'s depth of water over pale cut stone. You can see the tool marks on the bottom ' +
      'of it. Two copper coins and a bone pin lie in the silt in the corner where people drop ' +
      'things on purpose.\n\n' +
      'You put your hand in. It is water. It is cold. It stops.\n\n' +
      'Whatever you came down through is not here, or is not here now, or was never a thing ' +
      'that stayed in one place to be used twice.',
    onExamine: {
      journal: [
        {
          id: 'j.pastbasin',
          text:
            'In this version of the chamber the basin is a hand deep, with coins and a bone pin ' +
            'in the silt. Nothing goes down past the stone.',
        },
      ],
    },
  },
  {
    id: 'pastdeep.carvings',
    name: 'fresh tool-work',
    nouns: ['carvings', 'tool work', 'toolwork', 'tool-work', 'walls', 'stone', 'chisel marks', 'wall'],
    locationId: 'past.deep_chamber',
    initiallyVisible: true,
    listAs: 'tool-work with the edges still on it',
    verbs: () => ['examine'],
    description: () =>
      'Chisel marks in overlapping rows, so crisp that you can see where the worker changed ' +
      'hands and the angle shifted. A line of chalk still runs along the wall at waist height, ' +
      'a setting-out line, uneffaced.\n\n' +
      'In the corner, a leather bucket. Beside it a mallet with its head still tight.\n\n' +
      'They have not finished. They were here this week.',
    onExamine: {
      journal: [
        {
          id: 'j.fresh',
          text:
            'The chamber beyond the basin is still being cut: a chalk setting-out line, a ' +
            'leather bucket, a mallet with a tight head.',
        },
      ],
    },
  },

  /* ================================================================ *
   * past.entrance
   * ================================================================ */
  {
    id: 'pastentrance.mouth',
    name: 'cave mouth',
    nouns: ['mouth', 'cave mouth', 'entrance', 'opening', 'lintel', 'rock'],
    locationId: 'past.entrance',
    initiallyVisible: true,
    listAs: 'the squared cave mouth',
    verbs: () => ['examine'],
    description: () =>
      'Narrower than the mouth you walked into this morning, and squared off at the head with ' +
      'a chisel rather than left as a slot under an overhang. Somebody shaped this to be a ' +
      'doorway.\n\n' +
      'No bench. No hook. No iron ring in the floor, and no rope, because there is nothing here ' +
      'yet that a person could get lost in.\n\n' +
      'The rock above the opening is bare. There are no letters on it.',
    onExamine: {
      journal: [
        {
          id: 'j.pastmouth',
          text:
            'This cave mouth is narrow and squared by hand, with no bench, no iron ring, no ' +
            'rope, and nothing cut into the rock above it.',
        },
      ],
    },
  },
  {
    id: 'pastentrance.view',
    name: 'the village below',
    nouns: ['village', 'view', 'roofs', 'hill', 'valley', 'below'],
    locationId: 'past.entrance',
    initiallyVisible: true,
    listAs: 'the village below',
    verbs: () => ['examine'],
    description: () =>
      'Fewer roofs. The lane is the same lane — it has to go where the ground lets it — and it ' +
      'bends at the same place, round a rock you have barked your shin on.\n\n' +
      'No cord between the eaves. Nothing strung up and waiting.\n\n' +
      'And at the turn of the track below you, where the stump is, there is a tree in full ' +
      'leaf, and it is enormous.',
    onExamine: {
      flags: { [FLAGS.sawTree]: true },
      journal: [
        {
          id: 'j.tree',
          text:
            'Where the old stump sits at the turn of the path, there is a living tree in full ' +
            'leaf, big enough to shade a cart.',
        },
      ],
    },
  },

  /* ================================================================ *
   * past.square
   * ================================================================ */
  {
    id: 'pastsquare.tree',
    name: 'great tree',
    nouns: ['tree', 'great tree', 'leaves', 'branches', 'stump'],
    locationId: 'past.square',
    initiallyVisible: true,
    listAs: 'a great tree at the turn of the path',
    verbs: () => ['examine'],
    description: () =>
      'You walk up to it and put your hand on it, because you have to.\n\n' +
      'The bark is deep-furrowed and warm on the south side. The trunk is the width of a cart ' +
      'wheel. It leans, slightly, the way a big tree does when it has spent its whole life ' +
      'reaching out of the shade of the hill — and the grain of the bark spirals as it goes up.\n\n' +
      'There is a rope swing on the low branch. The seat is an offcut of plank, worn pale in ' +
      'the middle.',
    onExamine: {
      flags: { [FLAGS.sawTree]: true },
      journal: [
        {
          id: 'j.tree',
          text:
            'Where the old stump sits at the turn of the path, there is a living tree in full ' +
            'leaf, big enough to shade a cart.',
        },
      ],
    },
  },
  {
    id: 'pastsquare.building',
    name: 'unfinished building',
    nouns: [
      'building',
      'unfinished building',
      'frame',
      'wall',
      'timber',
      'workshop',
      'half-built wall',
      'mortar',
    ],
    locationId: 'past.square',
    initiallyVisible: true,
    listAs: 'a half-built wall where the workshop stands',
    verbs: () => ['examine'],
    description: () =>
      'A frame of green oak, pegged, two walls filled in and the third going up course by ' +
      'course. No roof. A pile of reed bundles under a cloth, waiting for one.\n\n' +
      'It is standing exactly where the joiner\'s workshop stands. Same footprint, same ' +
      'doorway on the same side, the doorway you lean in at to say good morning. You could ' +
      'walk it blind.',
    onExamine: {
      journal: [
        {
          id: 'j.building',
          text:
            'A building is going up on the exact footprint of the joiner\'s workshop, roofless, ' +
            'with its doorway on the same side.',
        },
      ],
    },
  },
  {
    id: 'pastsquare.well',
    name: 'new well',
    nouns: ['well', 'new well', 'cap', 'windlass', 'rope'],
    locationId: 'past.square',
    initiallyVisible: true,
    listAs: 'the well, new',
    verbs: () => ['examine'],
    description: () =>
      'The same well. The stones are the same stones in the same order; you have sat on the ' +
      'third one from the lane a thousand times.\n\n' +
      'And the cap is pale and square-edged, with no dish worn into it at all, and the rope is ' +
      'white and stiff and squeaks on the windlass.\n\n' +
      'No bowl of salt. Nowhere for one to go.',
    onExamine: {
      journal: [
        {
          id: 'j.pastwell',
          text:
            'The well is the same well, stone for stone, but the cap is unworn and the rope is ' +
            'new and white.',
        },
      ],
    },
  },
];

export const OBJECTS: Record<string, WorldObjectDef> = Object.fromEntries(
  OBJECT_LIST.map((o) => [o.id, o])
);

export const OBJECTS_BY_LOCATION: Record<string, WorldObjectDef[]> = OBJECT_LIST.reduce<
  Record<string, WorldObjectDef[]>
>((acc, o) => {
  (acc[o.locationId] ??= []).push(o);
  return acc;
}, {});

/** Verb list for an object, defaulting to examine only. */
export function objectVerbs(def: WorldObjectDef, state: GameState): SelectableVerb[] {
  return def.verbs ? def.verbs(state) : ['examine'];
}

/** Resolves `listAs`, which may be static or state-dependent. */
export function objectListLine(def: WorldObjectDef, state: GameState): string | undefined {
  if (def.listAs === undefined) return undefined;
  return typeof def.listAs === 'function' ? def.listAs(state) : def.listAs;
}
