import type { GameState, SelectableVerb, WorldObjectDef } from '../engine/types';
import { c, m } from './markup';
import { prophecyBlock } from './prophecy';
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
    listAs: c('a hooded lantern on the windowsill'),
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
    listAs: c('a cloth tag knotted to the lantern handle'),
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
    listAs: c('the open window'),
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
    listAs: c('bread set out on a stool'),
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
    listAs: c('a chalked plank propped by the well'),
    verbs: () => ['examine'],
    description: () =>
      'A door-plank set on its edge and written over in a careful hand. Some lines have been ' +
      'gone over twice where the chalk wore thin.\n\n' +
      /*
       * One source for the canonical text. The plank and the hero's
       * recitation a century earlier must be the same words, because the
       * recitation is where these words come from.
       */
      prophecyBlock() + '\n\n' +
      'Underneath, in a different hand and smaller: *and will they, though.*',
    onExamine: {
      flags: { [FLAGS.heardProphecy]: true },
      journal: [
        {
          id: 'j.prophecy',
          text:
            'The ' + m('prophecy') + ' on the plank: a one-eyed monster called the ' +
            m('Wanderer') + ' brings a ' + m('cataclysm') + ', and someone who braves the ' +
            m('Cave of Absolution') + ' will have the power to turn it aside.',
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
    listAs: c('lanterns strung unlit on cord'),
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
    listAs: c('a bowl of salt on the well-cap'),
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
    listAs: c('the well'),
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
    listAs: c('a basket of offcuts under the bench'),
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
    listAs: c('a wooden wedge, free for the taking'),
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
    listAs: c('an old stump at the turn of the path'),
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
    listAs: c('chalk marks counting off the rocks'),
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
    listAs: c('a knotted rope running into the dark'),
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
    listAs: c('letters cut into the lintel'),
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
    listAs: c('a bench, and a hook with spare rope'),
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
    listAs: c('scratched names and tallies on the left-hand wall'),
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
    listAs: c('a worn relief, older than the scratches'),
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
    listAs: c('the pillar the rope is tied to'),
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
    listAs: c('patches of old ash on the floor'),
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
    listAs: c('words scratched at sitting height'),
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
    listAs: c('a single boot by the water'),
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
    listAs: c('a shallow dish of standing water'),
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
    /*
     * Hidden on the return. The same stone, but the lamp in that alcove and
     * the wedge under that shutter belong to somebody else now, and these
     * descriptions read the player's own placement flags. The return gets its
     * own objects rather than borrowing ones that would describe the wrong
     * person's belongings.
     */
    hiddenWhen: (state) => state.chapter === 'return',
    initiallyVisible: true,
    listAs: (state) =>
      f(state, FLAGS.shutterHeld)
        ? c('the stone shutter, wedged up')
        : c('a stone shutter low on the fourth wall'),
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
    hiddenWhen: (state) => state.chapter === 'return',
    initiallyVisible: false,
    listAs: (state) =>
      f(state, FLAGS.shutterHeld)
        ? c('the open alcove behind the shutter')
        : c('the alcove behind the shutter'),
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
    hiddenWhen: (state) => state.chapter === 'return',
    initiallyVisible: true,
    listAs: c('a carved eye pierced through the wall above the shutter'),
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
    hiddenWhen: (state) => state.chapter === 'return',
    initiallyVisible: true,
    listAs: c('walls cut in a pattern of overlapping scales'),
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
    /*
     * One seam, in two chapters. On the return it is the same cut in the same
     * wall with the same light on it, so it is this object with a second
     * description rather than a duplicate the room would have to disambiguate.
     */
    hiddenWhen: (state) => state.chapter !== 'return' && f(state, FLAGS.passageOpen),
    listAs: (state) =>
      state.chapter === 'return'
        ? c('the seam, picked out in the fan of light')
        : c('a seam in the pattern, picked out by the light'),
    verbs: (state) => (state.chapter === 'return' ? ['examine'] : ['examine', 'open']),
    description: (state) =>
      state.chapter === 'return'
        ? 'One line of the scale-pattern, inside the bright fan, reading as a shadow instead ' +
          'of a cut. Floor to shoulder height, along the edge of one row.\n\n' +
          'You know exactly how long it takes from here. You get up, you put both hands flat ' +
          'on the wall above it, you lean, and the whole panel swings back on stone that was ' +
          'cut to pivot, and there is a passage going down.\n\n' +
          'It takes about a minute. There is about a minute.'
        : 'It runs up from the floor to shoulder height, turns, runs level for the width of a ' +
          'door, and turns down again. Where the light crosses it the gap is the thickness of ' +
          'a knife.\n\n' +
          'The scale-pattern has been laid out so that the seam falls exactly along the edge ' +
          'of one row. Straight on, under a torch, it is invisible. You have been standing in ' +
          'front of it for several minutes.',
  },
  {
    id: 'sealed.passage',
    name: 'opened passage',
    nouns: ['passage', 'opening', 'opened passage', 'doorway', 'door', 'steps'],
    locationId: 'present.sealed_chamber',
    hiddenWhen: (state) => state.chapter === 'return',
    initiallyVisible: false,
    listAs: c('the opened passage, going down'),
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
    listAs: c('the basin, and the depth in it'),
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
        'There is no softer way to say it: ' +
        m('the hole in the floor has weather in it') + '.'
      );
    },
    onExamine: {
      flags: { [FLAGS.thresholdExamined]: true },
      journal: [
        {
          id: 'j.threshold',
          text:
            'The basin in the deep chamber holds ' + m('a depth it has no room for') +
            ', and the sound of somewhere else comes up out of it.',
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
    listAs: c('the cut steps you came down'),
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
    listAs: c('the basin, a hand deep'),
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
    listAs: c('tool-work with the edges still on it'),
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
    listAs: c('the squared cave mouth'),
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
    listAs: c('the village below'),
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
    listAs: c('a great tree at the turn of the path'),
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
    listAs: c('a half-built wall where the workshop stands'),
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
    listAs: c('the well, new'),
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
  /* ================================================================ *
   * Chapter 1 additions
   * ================================================================ */
  {
    id: 'gallery.stones',
    name: 'loose stones',
    nouns: ['stones', 'stone', 'pebbles', 'pebble', 'gravel', 'loose stones'],
    locationId: 'present.outer_gallery',
    initiallyVisible: true,
    listAs: (state) =>
      state.flags[FLAGS.tookStone]
        ? c('the drift of loose stones you took one from')
        : c('a drift of loose stones against the wall'),
    item: 'stone',
    verbs: (state) => (state.inventory.includes('stone') ? ['examine'] : ['examine', 'take']),
    description: () =>
      'Water-rounded pebbles banked against the foot of the wall, thousands of them, every one ' +
      'of them grey with a pale band through it. They have come off the roof over a very long ' +
      'time and rolled downhill to here.\n\n' +
      'Parsie wanted one. He was extremely specific that it had to be from properly inside, ' +
      'and that he would know.',
  },
  {
    id: 'sealed.pillar',
    name: 'worked pillar',
    nouns: ['pillar', 'column', 'support', 'worked pillar', 'post'],
    locationId: 'present.sealed_chamber',
    initiallyVisible: true,
    listAs: (state) =>
      state.chapter === 'return' && Number(state.flags[FLAGS.pillarStruck] ?? 0) > 0
        ? c('the pillar, and what is left of its base')
        : c('a worked pillar holding the roof'),
    /*
     * Swinging at it is offered only in the last chapter, so no button
     * anywhere in the opening carries the finale in its label.
     */
    verbs: (state) =>
      state.chapter === 'return' && f(state, FLAGS.earlierSelfDead)
        ? ['examine', 'break']
        : ['examine'],
    description: (state) => {
      const struck = Number(state.flags[FLAGS.pillarStruck] ?? 0);
      if (struck >= 1) {
        /*
         * After a blow the description is a report on the way out, because that
         * is the decision in front of the player and it has to be inspectable
         * before the next swing rather than explained after it.
         */
        return (
          'Standing on less than it had. The crack at the foot has opened from a hair to a ' +
          'finger-width and there is a heap of its own grit round it, and the whole thing is ' +
          'carrying the roof on the part that has not split yet.\n\n' +
          (struck >= 2
            ? 'The roof came down a hand on the last one and the squeeze west is shut. There ' +
              'is no way out of this room, and the crack is on the face that looks into it, ' +
              'so the next blow is struck from in here with you in here.'
            : 'The squeeze west is narrower than it was when you came through it. That is the ' +
              'roof, and the roof is what this is holding, and it will come down further ' +
              'before it comes down for good. Hit it again and the way out closes.')
        );
      }
      return (
        'A square-dressed pillar of the same stone as the walls, standing where the middle of ' +
        'the room would be if anybody wanted a pillar in the middle of a room. It was not built ' +
        'here. It was left here: the chamber was cut away from around it, and this is the part ' +
        'they did not cut.\n\n' +
        'At the foot of it the stone has opened in a crack about the length of your forearm, and ' +
        'there is a small grey fan of grit on the floor underneath, the way there is under ' +
        'anything that has been taking a load for longer than it meant to.\n\n' +
        'It is holding the roof up. Everything in here that is not holding the roof up has had a ' +
        'pattern cut into it.'
      );
    },
    onExamine: {
      flags: { [FLAGS.sawPillar]: true },
      journal: [
        {
          id: 'j.pillar',
          text:
            'The sealed chamber stands on one worked pillar, cracked at the base with grit ' +
            'under it. It is the only thing holding that roof.',
        },
      ],
    },
  },

  /* ================================================================ *
   * past.cave_path
   * ================================================================ */
  {
    id: 'pastpath.tree',
    name: 'great tree',
    nouns: ['tree', 'great tree', 'swing', 'shade', 'limb'],
    locationId: 'past.cave_path',
    initiallyVisible: true,
    listAs: c('the tree, and the swing on it'),
    verbs: () => ['examine'],
    description: () =>
      'Close up it is absurd. The trunk is wider than you can reach round and the bark is in ' +
      'deep grey plates, and the low limb comes out horizontally at the height of your chest ' +
      'with a rope over it and a plank seat tied on.\n\n' +
      'You find the place on the north side where a letter has been cut into the bark, scarred ' +
      'over and spread with growth until it is barely a shape.\n\n' +
      'It is not your letter. Somebody else cut theirs into this tree and never told anybody ' +
      'either.',
    onExamine: {
      journal: [
        {
          id: 'j.pastpath_tree',
          text:
            'There is a letter cut into the great tree on the track, scarred over with age. ' +
            'Not mine. Somebody else did the same thing I did.',
        },
      ],
    },
  },
  {
    id: 'pastpath.ruts',
    name: 'cart ruts',
    nouns: ['ruts', 'cart ruts', 'track', 'tracks', 'wheels'],
    locationId: 'past.cave_path',
    initiallyVisible: true,
    listAs: c('cart ruts, deep and recent'),
    verbs: () => ['examine'],
    description: () =>
      'Two ruts worn down through the thin soil to the shale beneath, with a hoof-churned ' +
      'strip between them. There is cut stone dust in the bottom of both, pale against the ' +
      'grey, and a scatter of fresh chippings where a load has shifted and somebody has not ' +
      'come back for what fell.\n\n' +
      'A season of hauling, at least. At home the path is a footpath and nothing has ever ' +
      'come down it on wheels.',
  },

  /* ================================================================ *
   * past.spring
   * ================================================================ */
  {
    id: 'pastspring.spring',
    name: 'spring',
    nouns: ['spring', 'water', 'cleft', 'rock', 'basin', 'runnel'],
    locationId: 'past.spring',
    initiallyVisible: true,
    acceptsItems: true,
    listAs: c('the spring, running cold out of the rock'),
    verbs: () => ['examine', 'fill'],
    description: (state) =>
      'The cleft is a hand wide and the water comes out of it with enough push to arch clear ' +
      'of the rock before it falls. It is glass-clear and it hurts to hold a hand in.\n\n' +
      'The scooped basin below it is lined with flat stones laid by somebody patient, and the ' +
      'cup-marks on the lip are worn deep enough to lay a thumb in.\n\n' +
      (state.flags[FLAGS.skinsFilled]
        ? 'Your skins are full. There is nothing more this place can do for you.'
        : 'Anything you wanted to fill, you would fill here.'),
    onExamine: {
      journal: [
        {
          id: 'j.spring',
          text:
            'The spring above the village runs hard and cold, into a stone-lined basin with ' +
            'cup-marks worn into the lip. At home that cleft is dry.',
        },
      ],
    },
  },

  /* ================================================================ *
   * past.square
   * ================================================================ */
  {
    id: 'pastsquare.skins',
    name: 'water skins',
    nouns: ['skins', 'water skins', 'waterskins', 'yoke', 'goatskins'],
    locationId: 'past.square',
    initiallyVisible: true,
    hiddenWhen: (state) => state.inventory.includes('water_skins'),
    listAs: c('a yoke of empty water skins against the wall'),
    item: 'water_skins',
    verbs: () => ['examine', 'take'],
    description: () =>
      'Four goatskins on a shoulder yoke, propped against the half-built wall where somebody ' +
      'dropped them rather than put them. They are empty and they have been empty long enough ' +
      'to have dried stiff at the necks.\n\n' +
      'Nobody is watching them. In a village this size nobody needs to.',
  },

  /* ================================================================ *
   * past.entrance — the crew's gear, and the gate
   * ================================================================ */
  {
    id: 'pastentrance.kit',
    name: "crew's kit",
    nouns: ['kit', 'gear', 'crew kit', 'tools', 'baskets', 'barrow'],
    locationId: 'past.entrance',
    initiallyVisible: true,
    acceptsItems: true,
    listAs: c("the crew's kit stacked in the mouth"),
    verbs: () => ['examine'],
    description: (state) =>
      'Everything a stone gang needs, stacked out of the weather just inside the lip: a ' +
      'barrow with a mended wheel, two baskets of broken chisels waiting for a smith, a coil ' +
      'of tarred line, and a row of wooden bowls turned upside down on a plank.\n\n' +
      'There is a water barrel on its side with the head out of it and a crack you could post ' +
      'a letter through. Somebody has been meaning to deal with that.' +
      (state.flags[FLAGS.carriedWater]
        ? '\n\nThe skins you carried up are hanging from a peg beside it, dripping gently.'
        : ''),
    onExamine: {
      flags: { [FLAGS.knowsWaterNeeded]: true },
      journal: [
        {
          id: 'j.crew_water',
          text:
            'The crew\'s water barrel at the cave mouth is split and empty. They are working ' +
            'a hole in a hill with nothing to drink.',
        },
      ],
    },
  },

  /* ================================================================ *
   * past.deep_chamber — the workings
   * ================================================================ */
  {
    id: 'pastdeep.spoil',
    name: 'spoil heap',
    nouns: ['spoil', 'spoil heap', 'heap', 'rubble', 'cut stone'],
    locationId: 'past.deep_chamber',
    initiallyVisible: true,
    acceptsItems: true,
    listAs: c('a spoil heap against the north wall'),
    verbs: () => ['examine'],
    description: (state) =>
      'Shoulder-high, squared off at the ends by somebody who squares things off out of habit. ' +
      'All of it is cut waste — flakes and wedges and failed blocks, the dry stony smell of a ' +
      'quarry.\n\n' +
      (state.flags[FLAGS.worksiteAccess]
        ? 'Behind it, where the wall has been opened, there is a gap a boy could get through ' +
          'sideways and so, with some loss of dignity, can you.'
        : 'It is piled against an opening in the wall. Not blocking it — nobody stacks spoil ' +
          'to block a door they use — but you would have to go round it, in full view of ' +
          'anybody sitting up in the mouth.'),
  },
  {
    id: 'pastdeep.chalkline',
    name: 'chalk line',
    nouns: ['chalk line', 'line', 'chalk', 'plumb', 'plumb-bob', 'bob'],
    locationId: 'past.deep_chamber',
    initiallyVisible: true,
    listAs: (state) =>
      state.flags[FLAGS.symptomMark]
        ? c('a chalk line across the floor, and a second one beside it')
        : c('a chalk line snapped across the floor'),
    verbs: () => ['examine'],
    description: (state) =>
      'A string line, blued with chalk and snapped hard against the floor so it has left a ' +
      'sharp mark straight across the chamber. A plumb-bob hangs over it from a nail driven ' +
      'into the roof, dead still.\n\n' +
      'This is how you keep a hole in a hill honest. Somebody comes back to this line every ' +
      'morning and checks that the world has not moved.' +
      (state.flags[FLAGS.symptomMark]
        ? '\n\nThere are two lines. The faint one is a hand\'s width from the sharp one, and it ' +
          'is in the same chalk and the same hand, and the plumb-bob hangs over neither of them.'
        : ''),
  },

  /* ================================================================ *
   * past.worksite — the three heights
   * ================================================================ */
  {
    id: 'worksite.drawing',
    name: 'drawing on hide',
    nouns: ['drawing', 'hide', 'plan', 'diagram', 'sketch'],
    locationId: 'past.worksite',
    initiallyVisible: true,
    listAs: c('a drawing on hide, nailed to the finished wall'),
    verbs: () => ['examine'],
    description: () =>
      'Scraped hide, gone amber with lamp smoke, drawn on in a hard neat point by somebody who ' +
      'was measuring rather than illustrating.\n\n' +
      'It is this panel, in elevation. The three dishes are on it, each one numbered, each one ' +
      'with its height off the floor written beside it in thumbs and knuckles. The half-cut ' +
      'opening is on it too, dotted where it is not finished.\n\n' +
      'And that is all it is. There is no figure, no eye, no scale pattern, no instruction ' +
      'and nothing a person could call a warning. It is a working drawing of a wall with three ' +
      'holes in it, and whoever made it did not know what they were drawing.\n\n' +
      'The lowest dish is marked ' + m('one') + '. You stand with your heel against the panel ' +
      'and your hand flat at that height, and it is the height the alcove was at home.',
    onExamine: {
      flags: { [FLAGS.readDrawing]: true },
      journal: [
        {
          id: 'j.drawing',
          text:
            'The builders\' drawing shows three dishes up the thinned panel, numbered, with ' +
            'their heights written beside them. The lowest is the height of the alcove at home.',
        },
      ],
    },
  },
  {
    id: 'worksite.notes',
    name: 'slate',
    nouns: ['slate', 'notes', 'record', 'writing', 'chalk notes'],
    locationId: 'past.worksite',
    initiallyVisible: true,
    listAs: c('a slate with notes chalked on it'),
    verbs: () => ['examine'],
    description: () =>
      'A roofing slate propped on a ledge, written over in a cramped hand and rubbed out and ' +
      'written over again. It is a craft record. Somebody is keeping track of a thing they do ' +
      'not understand, in the only way they know, which is to write down what happened.\n\n' +
      '    *Air answers a lamp set at three heights. Not at any other height.*\n' +
      '    *Cut dishes at one and three. Three is above a man\'s reach, used the trestle.*\n' +
      '    *Two not cut. Last job.*\n' +
      '    *Caraway stood in one with the lamp and went in and come out the same hole he went in ' +
      'by, so one does nothing.*\n' +
      '    *Have not tried three. Nobody wants to.*\n\n' +
      'Underneath, in a different and angrier hand: *and nobody is going to, so leave it.*',
    onExamine: {
      flags: { [FLAGS.readCrewNotes]: true },
      journal: [
        {
          id: 'j.crew_notes',
          text:
            'The crew\'s slate: the air answers a lamp at three heights and no others. They ' +
            'cut dishes at the first and third. A man called Caraway used the first and came out ' +
            'of the same hole he went in by, so they wrote down that it does nothing. Nobody ' +
            'has tried the third.',
        },
      ],
    },
  },
  {
    id: 'worksite.dishes',
    name: 'cut dishes',
    nouns: ['dishes', 'dish', 'cut dishes', 'sockets', 'panel face'],
    locationId: 'past.worksite',
    initiallyVisible: true,
    listAs: c('two cut dishes in the panel, and a chalk outline where a third is not'),
    verbs: () => ['examine'],
    description: () =>
      'Shallow saucers cut into the face of the thinned panel, one above another up its full ' +
      'height, each one dressed smooth inside and undercut at the lip so that something ' +
      'standing in it cannot be knocked out.\n\n' +
      'There are three positions and two dishes.\n\n' +
      'The ' + c('low dish') + ' is at about the height of your knee. The ' + c('high dish') +
      ' is above your head, at the stretch of a tall man on a trestle, and there is a trestle ' +
      'folded against the wall under it. Between them, at about the height of your chest, ' +
      'there is a ' + c('chalk outline') + ' on unworked rock with a cross through it where ' +
      'the centre goes.',
    onExamine: {
      flags: { [FLAGS.examinedDishes]: true },
      reveals: ['worksite.lowdish', 'worksite.highdish', 'worksite.outline'],
      journal: [
        {
          id: 'j.dishes',
          text:
            'Three positions up the thinned panel and only two dishes cut: low, at knee ' +
            'height, and high, above my head. The middle one is a chalk outline on rough rock.',
        },
      ],
    },
  },
  {
    id: 'worksite.lowdish',
    name: 'low dish',
    nouns: ['low dish', 'low', 'lowest dish', 'bottom dish', 'first dish', 'one'],
    locationId: 'past.worksite',
    initiallyVisible: false,
    acceptsItems: true,
    listAs: c('the low dish, at knee height'),
    verbs: () => ['examine'],
    description: () =>
      'At the height of your knee, dressed smooth, undercut at the lip. You crouch in front of ' +
      'it without deciding to.\n\n' +
      'You know this height. You have knelt at exactly this height with a lantern in both hands ' +
      'and watched a fan of light climb out of a hole in a floor and cross a patterned wall, ' +
      'and the dish that lamp was sitting in was cut by the same hands as this one, a week ' +
      'from now, with the same undercut and the same depth.\n\n' +
      'This is the one marked *one* on the drawing. This is the one Caraway used.',
  },
  {
    id: 'worksite.highdish',
    name: 'high dish',
    nouns: ['high dish', 'high', 'highest dish', 'top dish', 'upper dish', 'third dish', 'three'],
    locationId: 'past.worksite',
    initiallyVisible: false,
    acceptsItems: true,
    listAs: (state) =>
      state.flags[FLAGS.lanternInHighDish]
        ? c('the high dish, with your lantern standing in it')
        : c('the high dish, above your head'),
    verbs: () => ['examine'],
    description: (state) =>
      'Above your head, at the full stretch of a tall man standing on something. The trestle ' +
      'folded against the wall under it has paint on the top rail and chalk dust on the ' +
      'treads, which is how you know it lives there.\n\n' +
      'Reaching up, you can get two fingers over the lip. It is dressed exactly like the other ' +
      'one: same undercut, same depth, same care.\n\n' +
      'Somebody cut this at the stretch of their arms, on a trestle, in a hole in a hill, and ' +
      'then wrote on a slate that nobody wanted to try it.' +
      (state.flags[FLAGS.lanternInHighDish]
        ? '\n\nYour lantern is standing in it now.'
        : ''),
  },
  {
    id: 'worksite.outline',
    name: 'chalk outline',
    nouns: ['outline', 'chalk outline', 'ellipse', 'middle', 'middle dish', 'second dish', 'two'],
    locationId: 'past.worksite',
    initiallyVisible: false,
    acceptsItems: true,
    listAs: c('the chalk outline of the dish nobody has cut'),
    verbs: () => ['examine'],
    description: () =>
      'Chalk on rough rock. The ellipse is drawn freehand and gone over twice, and the cross ' +
      'through the middle of it is the centre mark, and that is the whole of it. There is no ' +
      'dish. There is no dressing, no undercut, no seat, nothing to stand anything in: the ' +
      'rock behind the chalk is exactly as the quarry left it, humped and flaked and no more ' +
      'level than a ploughed field.\n\n' +
      'You put your palm flat on it, at the height of your own chest, and feel nothing but ' +
      'cold stone and a fine grit that comes away on your hand.\n\n' +
      'Somebody has written *2* beside it and left it for the end of the job.',
  },
  {
    id: 'worksite.aperture',
    name: 'half-cut aperture',
    nouns: ['aperture', 'opening', 'panel', 'half-cut aperture', 'thinned panel', 'gap in the panel'],
    locationId: 'past.worksite',
    initiallyVisible: true,
    listAs: c('the half-cut aperture through the thinned panel'),
    verbs: () => ['examine', 'cross'],
    description: (state) =>
      'The panel has been worked down from the inside until it is no thicker than a flagstone, ' +
      'and then an opening has been begun through the middle of it — low, wide, and stopped ' +
      'halfway, with the waste still lying under it where it fell.\n\n' +
      'You can get your head and one shoulder through it. On the far side is the rest of the ' +
      'hill, solid rock, a thumb from your face.\n\n' +
      'There is no draught through it, and there should be. It is a hole in the ground going ' +
      'nowhere and the air in it is doing something that air in a hole does not do.' +
      (state.flags[FLAGS.lanternInHighDish] && state.flags[FLAGS.lanternLit]
        ? '\n\nWith the lamp standing where it is standing, the opening has a ' +
          m('pressure in it like a held note') + ', and the rock a thumb from your face is no ' +
          'longer the nearest thing.'
        : ''),
  },
  {
    id: 'worksite.pillar',
    name: 'worked pillar',
    nouns: ['pillar', 'column', 'support', 'worked pillar', 'post'],
    locationId: 'past.worksite',
    initiallyVisible: true,
    acceptsItems: true,
    listAs: c('the pillar left standing in the middle of the floor'),
    verbs: () => ['examine'],
    description: (state) =>
      'Pale, square-dressed, and new: the dressing marks run in neat diagonal courses from top ' +
      'to bottom and there is stone dust still in the bottom of them. Somebody finished this ' +
      'last week.\n\n' +
      'It is the only thing in the room standing between the floor and the ceiling. The scale ' +
      'pattern goes round three walls and stops a hand short of it on both sides, because you ' +
      'do not put a chisel to the thing that is holding the roof.' +
      (state.flags[FLAGS.pillarWarning]
        ? '\n\n*That is the roof,* Lovage said. *Not the stone over your head — that.*'
        : ''),
    onExamine: {
      journal: [
        {
          id: 'j.worksite_pillar',
          text:
            'The workings stand on one worked pillar, left in the middle of the floor when the ' +
            'chamber was cut away from around it. New, pale, and the only support in the room.',
        },
      ],
    },
  },
  {
    id: 'worksite.crewlamp',
    name: 'crew lamp',
    nouns: ['crew lamp', 'lamp', 'lantern', 'their lamp', 'hooded lantern', 'light'],
    locationId: 'past.worksite',
    initiallyVisible: true,
    /*
     * The way back from leaving your own lamp behind.
     *
     * A player can cross the first threshold having left the lantern burning
     * in an alcove a hundred years away, in a room that will be sealed for a
     * century. Nothing can fetch it, and nothing should pretend to. So the
     * crew have lamps, because men cutting stone underground have lamps, and
     * one of them is on the ledge.
     *
     * It occupies the same inventory slot, which is the honest model: the item
     * is "a hooded lantern, the kind every house keeps by the door", and this
     * is one of those. It is visible only when the hero has not got one.
     */
    hiddenWhen: (state) => state.inventory.includes('lantern'),
    listAs: c('a crew lamp on the ledge'),
    item: 'lantern',
    verbs: () => ['examine', 'take'],
    takeText: () =>
      'You take one of the crew\'s lamps off the ledge.\n\n' +
      'It is not yours and it is not the one from your windowsill, which is burning in a ' +
      'sealed room a long way from here and is going to go on burning until it does not. This ' +
      'one is tin, dented, hooded, with a horn pane and a wick somebody else trimmed, and it ' +
      'is the same object in every way that matters.\n\n' +
      'You will put it back. You are fairly sure you will put it back.',
    description: () =>
      'A hooded lamp of exactly the pattern every house keeps by the door — tin, dented along ' +
      'one shoulder, horn pane, sliding hood. There are three more beside it and a flask of ' +
      'oil, because five men and a boy working a hole in a hill get through lamps.\n\n' +
      'The wick has been trimmed by somebody who knew to do it. They all have.',
  },
  {
    id: 'worksite.mallet',
    name: "mason's mallet",
    nouns: ['mallet', 'hammer', 'maul', "mason's mallet"],
    locationId: 'past.worksite',
    initiallyVisible: true,
    hiddenWhen: (state) => state.inventory.includes('mallet'),
    listAs: c("a mason's mallet left on the chisel basket"),
    item: 'mallet',
    verbs: () => ['examine', 'take'],
    description: () =>
      'Short-hafted, head bound at both ends, laid across the basket of cold chisels with the ' +
      'care of a man who will be back for it before dark. The haft has been worn to the shape ' +
      'of somebody else\'s grip, and there are three notches cut into the butt end.\n\n' +
      'Saffra told you not to touch it. She said it in the tone people use for the one rule ' +
      'that is actually a rule.',
  },

  /* ================================================================ *
   * future.deep_chamber — arrival only
   * ================================================================ */
  {
    id: 'futuredeep.basin',
    name: 'dry basin',
    nouns: ['basin', 'rim', 'dry basin', 'silt', 'crack'],
    locationId: 'future.deep_chamber',
    initiallyVisible: true,
    listAs: c('the basin, dry and cracked through'),
    verbs: () => ['examine'],
    description: () =>
      'You get down on your heels at the rim the way you have twice before, and there is ' +
      'nothing to put a hand into.\n\n' +
      'The silt has dried into curled grey plates with gaps between them, and in the gaps ' +
      'there is more dry silt, and on top of all of it a soft even coat of dust. Two copper ' +
      'coins lie in it, green to the colour of a leaf, and something slender that was a bone ' +
      'pin and is now mostly a stain in the shape of one.\n\n' +
      'The rim is cracked through in two places and one of the pieces has dropped a finger\'s ' +
      'width. Whatever this room is resting on has moved, and then stopped, and then stayed ' +
      'stopped long enough for dust to settle on the evidence.',
    onExamine: {
      journal: [
        {
          id: 'j.future_basin',
          text:
            'The basin here is dry, cracked through, and under so much dust that it has been ' +
            'dry for a very long time. The two coins are still in it, gone green.',
        },
      ],
    },
  },
  {
    id: 'futuredeep.stair',
    name: 'blocked stair',
    nouns: ['stair', 'stairs', 'steps', 'blocked stair', 'fall', 'rubble'],
    locationId: 'future.deep_chamber',
    initiallyVisible: true,
    listAs: c('the stair, stopped four treads up'),
    verbs: () => ['examine'],
    description: () =>
      'Four treads, square-edged, with the handrail groove worn into the wall beside them — ' +
      'and then the hill. Not a doorway with rubble in it. The rock itself has come down and ' +
      'closed the passage from roof to floor, and the face of the fall has had time to set ' +
      'into something as solid as the wall it used to be.\n\n' +
      'You put your hands on it anyway, because you have to, and you work along it to both ' +
      'sides, and there is no gap, no draught and no sound through it.\n\n' +
      'The way you came out of this hill twice is not a way any more.',
    onExamine: {
      journal: [
        {
          id: 'j.future_stair',
          text:
            'The worked stair is closed by a fall that has set solid. The way out of the hill ' +
            'that I have used twice does not exist here.',
        },
      ],
    },
  },
  {
    id: 'futuredeep.tear',
    name: 'tear in the rock',
    nouns: ['tear', 'fissure', 'crack in the wall', 'opening', 'daylight', 'rift'],
    locationId: 'future.deep_chamber',
    initiallyVisible: true,
    listAs: c('a tear in the rock with daylight in it'),
    verbs: () => ['examine'],
    description: () =>
      'The wall has not been cut or broken. It has parted, floor to shoulder height, along a ' +
      'line that runs up and off to the side like something tearing under its own weight, and ' +
      'the two faces of it still match each other tooth for tooth.\n\n' +
      'There is daylight in it. You could get through it — not comfortably, and not quickly, ' +
      'but you could get a shoulder and then a hip through and come out somewhere up the side ' +
      'of the hill, well above where the mouth used to be.\n\n' +
      'The light coming down it is the wrong colour for any hour of any day you have stood in. ' +
      'It is the colour of the sky through smoke, except that it is even, and steady, and it ' +
      'is clearly just what the sky is.',
    onExamine: {
      journal: [
        {
          id: 'j.future_tear',
          text:
            'The hill has torn itself open above the basin and there is daylight in the tear. ' +
            'It would take me out onto the hillside above where the mouth used to be.',
        },
      ],
    },
  },
  /* ================================================================ *
   * future.cave_path
   * ================================================================ */
  {
    id: 'futurepath.sky',
    name: 'sky',
    nouns: ['sky', 'light', 'colour', 'ceiling', 'air'],
    locationId: 'future.cave_path',
    initiallyVisible: true,
    listAs: c('the sky, and whatever is the matter with it'),
    verbs: () => ['examine'],
    description: () =>
      'You stand on the shale and look at it properly, which takes a while, because there is ' +
      'nothing in it to look at.\n\n' +
      'No cloud. No haze, no smoke-edge, no horizon-colour different from the colour overhead. ' +
      'An even, steady, faintly wrong brown-grey from one side of the valley to the other, with ' +
      'the sun somewhere behind it as a brighter patch you could cover with your hand.\n\n' +
      'It does not move. You watch it for the length of about fifty breaths and it does not ' +
      'move at all, and that is the thing that makes your scalp go tight: a sky is the one ' +
      'thing you have never had to wonder about.',
    onExamine: {
      journal: [
        {
          id: 'j.future_sky',
          text:
            'The sky here has no cloud, no edge and no weather in it. The same wrong colour ' +
            'everywhere, and it does not move. The sun is a brighter patch behind it.',
        },
      ],
    },
  },
  {
    id: 'futurepath.bird',
    name: 'bird',
    nouns: ['bird', 'crow', 'something flying'],
    locationId: 'future.cave_path',
    initiallyVisible: false,
    listAs: c('a bird going over, again'),
    verbs: () => ['examine'],
    description: () =>
      'It comes over the ridge from the north, crosses the whole width of the sky at an even ' +
      'height, and goes out of sight behind the shoulder of the hill to the south.\n\n' +
      'Then it comes over the ridge from the north.\n\n' +
      'Same line. Same height. Same unhurried four beats and a glide, and you have watched it ' +
      'do this five times now, and nothing has come back the other way.\n\n' +
      'You have seen one thing like this before, in a village square a hundred years ago, with ' +
      'a door and the wind that shut it arriving in the wrong order.',
    onExamine: {
      flags: { [FLAGS.sawFutureSymptom]: true },
      journal: [
        {
          id: 'j.future_bird',
          text:
            'A bird crosses the sky on the same line at the same height over and over and ' +
            'never comes back the other way. It is the same kind of wrongness as the door and ' +
            'the wind in the square.',
        },
      ],
    },
  },
  {
    id: 'futurepath.ground',
    name: 'the ground',
    nouns: ['ground', 'shale', 'hillside', 'turn', 'stump', 'tree'],
    locationId: 'future.cave_path',
    initiallyVisible: true,
    listAs: c('the shale where the turn in the path should be'),
    verbs: () => ['examine'],
    description: () =>
      'You pace it out. Twenty-two from the tear to where the turn is, and the turn is not ' +
      'there, and neither is anything else: no stump, no root-plate, no hollow where a ' +
      'root-plate rotted out.\n\n' +
      'The whole shoulder of the hill has dropped. You can see the line of it running away ' +
      'east, a long shallow step in the ground with grass grown over the lip, the way ground ' +
      'looks a lifetime after it has moved.\n\n' +
      'So the tree went with it, and so did the chalk marks, and so did the path everybody in ' +
      'your life has walked up to be told to mind the loose bit.',
  },

  /* ================================================================ *
   * future.entrance
   * ================================================================ */
  {
    id: 'futureentrance.seal',
    name: 'seal',
    nouns: ['seal', 'wall', 'stone', 'fitted stone', 'courses', 'masonry'],
    locationId: 'future.entrance',
    initiallyVisible: true,
    acceptsItems: true,
    listAs: (state) =>
      state.flags[FLAGS.sealOpened]
        ? c('the seal, down in courses where it fell')
        : c('the seal across the mouth'),
    verbs: (state) =>
      state.flags[FLAGS.sealOpened] ? ['examine'] : ['examine', 'break'],
    description: (state) => {
      if (state.flags[FLAGS.sealOpened]) {
        return (
          'Nine courses of good stone in a heap, and the hole they were keeping shut.\n\n' +
          'You can see the beds now that they are apart: every one of them laid dry, no mortar ' +
          'anywhere, every stone cut to sit on the one below it. Somebody closed this hill ' +
          'without a bucket of lime, which means they did it in a hurry, and did it properly ' +
          'anyway.'
        );
      }
      return (
        'Nine courses, laid dry — no mortar in any joint, every stone squared and bedded so it ' +
        'sits on the one below it and nothing else. It fills the mouth from the floor to the ' +
        'rock.\n\n' +
        'You put a hand on it and work along it. The top courses are tight enough that you ' +
        'cannot get a fingernail in.' +
        (state.flags[FLAGS.knowsLooseCourse]
          ? '\n\nThe third course from the bottom is not tight. There is a gap under the ' +
            'left-hand end of it you could lay two fingers in, and the stone rocks a hair when ' +
            'you lean on it.'
          : '\n\nSomewhere in it there will be a course that is not, because there always is. ' +
            'You have no idea which.') +
        (state.flags[FLAGS.coursePropped]
          ? '\n\nYour wedge is driven in under the loose course, holding it off the stone below.'
          : '') +
        (state.flags[FLAGS.sealSettled]
          ? '\n\nThere is a bright bruise on the face of the third course where you hit it, and ' +
            'the whole wall is sitting a little more comfortably than it was.'
          : '')
      );
    },
    onExamine: {
      journal: [
        {
          id: 'j.future_seal',
          text:
            'The mouth has been closed with nine courses of dry-laid stone, no mortar, every ' +
            'stone squared and bedded. Deliberate work, done in a hurry and done well.',
        },
      ],
    },
  },
  {
    id: 'futureentrance.mark',
    name: 'cut mark',
    nouns: ['mark', 'cut mark', 'sign', 'writing', 'carving'],
    locationId: 'future.entrance',
    initiallyVisible: true,
    listAs: c('a mark cut into the face of the seal'),
    verbs: () => ['examine'],
    description: () =>
      'Cut into the flat of the middle course, deep, with a chisel, by somebody who took their ' +
      'time.\n\n' +
      'It is not words. It is a shape: a ring, and a line through the ring, and three strokes ' +
      'under it like rain.\n\n' +
      'You have never seen it before in your life. It means something to whoever cut it and it ' +
      'means something to whoever has walked past it since, and it does not mean anything to ' +
      'you at all, and that is the loneliest thing that has happened to you today.',
    onExamine: {
      journal: [
        {
          id: 'j.future_mark',
          text:
            'There is a mark cut into the seal: a ring, a line through it, three strokes under ' +
            'it. Not writing. I have never seen it before.',
        },
      ],
    },
  },

  /* ================================================================ *
   * future.sealed_chamber
   * ================================================================ */
  {
    id: 'futuresealed.fill',
    name: 'cracked fill',
    nouns: ['fill', 'cracked fill', 'plaster', 'render', 'patch'],
    locationId: 'future.sealed_chamber',
    initiallyVisible: true,
    acceptsItems: true,
    hiddenWhen: (state) => Boolean(state.flags[FLAGS.fillCleared]),
    listAs: c('the cracked fill over the middle position'),
    verbs: () => ['examine', 'clear'],
    description: () =>
      'Lime and stone dust and hair, floated on flush with the panel and smoothed over with a ' +
      'wet trowel by somebody who did not want anybody to find it.\n\n' +
      'They did it to all three. You can see where the low one was done, and the high one, and ' +
      'both of those are solid — you knock on them and the hill knocks back.\n\n' +
      'This one has cracked. A single split runs right across it from edge to edge where the ' +
      'panel has flexed, and the two halves are standing a little proud of each other, and ' +
      'there is a dark line of air behind.\n\n' +
      'It is holding on out of habit. You could get your fingers into that crack.',
    onExamine: {
      flags: { [FLAGS.examinedFill]: true },
      journal: [
        {
          id: 'j.future_fill',
          text:
            'The crew filled all three positions when they finished and smoothed them over. ' +
            'The fill on the middle one has cracked right across and is loose.',
        },
      ],
    },
  },
  {
    id: 'futuresealed.middledish',
    name: 'middle dish',
    nouns: ['middle dish', 'middle', 'dish', 'second dish', 'two', 'socket'],
    locationId: 'future.sealed_chamber',
    initiallyVisible: false,
    acceptsItems: true,
    listAs: (state) =>
      state.flags[FLAGS.lanternInMiddleDish]
        ? c('the middle dish, with your lantern standing in it')
        : c('the middle dish, cut and never used'),
    verbs: () => ['examine'],
    description: () =>
      'Dressed smooth inside, undercut at the lip, at about the height of your chest. The same ' +
      'depth as the other two and the same careful undercut, cut by the same hands in the same ' +
      'week.\n\n' +
      'And new. Not worn anywhere. No smoke on the stone above it, no scuff on the lip, no ' +
      'grease in the grain. A hundred and more years and nobody has ever stood anything in it.\n\n' +
      'The chalk ellipse is still faintly there, under the dressing, where somebody drew it ' +
      'round the idea of this.',
    onExamine: {
      journal: [
        {
          id: 'j.future_middledish',
          text:
            'The middle dish is cut, dressed and completely unused — no smoke, no wear. They ' +
            'finished it and then filled it in.',
        },
      ],
    },
  },
  {
    id: 'futuresealed.aperture',
    name: 'gap in the panel',
    nouns: ['gap', 'aperture', 'panel', 'thinned panel', 'gap in the panel', 'opening'],
    locationId: 'future.sealed_chamber',
    initiallyVisible: true,
    listAs: c('the gap in the thinned panel'),
    verbs: () => ['examine', 'cross'],
    description: (state) =>
      'The same half-cut opening, low and wide, with the waste still under it where it fell a ' +
      'hundred years ago. Nobody ever finished it and nobody ever will.\n\n' +
      'You get your head and one shoulder into it. On the far side is the rest of the hill, a ' +
      'thumb from your face.\n\n' +
      'There is no draught through it. There was no draught through it the last time either, ' +
      'and the time before that, and you are the only person alive who knows that is the point.' +
      (state.flags[FLAGS.lanternInMiddleDish] && state.flags[FLAGS.lanternLit]
        ? '\n\nWith the lamp standing where it is standing, the opening has a pressure in it ' +
          'like a held note, and the rock a thumb from your face is no longer the nearest thing.'
        : ''),
  },
  {
    id: 'futuresealed.pillar',
    name: 'broken pillar',
    nouns: ['pillar', 'column', 'support', 'broken pillar', 'pieces'],
    locationId: 'future.sealed_chamber',
    initiallyVisible: true,
    listAs: c('the pillar, in two pieces under the fall'),
    verbs: () => ['examine'],
    description: () =>
      'It went at about chest height. The lower piece is still standing on its own footprint ' +
      'and the upper piece is lying across the rubble with its dressed faces up.\n\n' +
      'You get close enough to see the break. It did not shear clean: it crushed, from the ' +
      'base upward, the way a thing goes when it has been carrying more than it should for a ' +
      'long time and then stops.\n\n' +
      'The crack you know at the foot of it has opened into a hand\'s width of crumbled stone.',
    onExamine: {
      journal: [
        {
          id: 'j.future_pillar',
          text:
            'The worked pillar failed. It crushed from the base up, where the crack was, and ' +
            'the roof came down on this chamber.',
        },
      ],
    },
  },

  /* ================================================================ *
   * future.square
   * ================================================================ */
  {
    id: 'futuresquare.memorial',
    name: 'memorial stone',
    nouns: ['memorial', 'stone', 'memorial stone', 'writing', 'inscription', 'names'],
    locationId: 'future.square',
    initiallyVisible: true,
    listAs: c('a standing stone by the well with writing cut into it'),
    verbs: () => ['examine'],
    description: () =>
      'A slab set upright beside the well-cap, about shoulder high, cut over in three different ' +
      'hands in three different centuries of weathering.\n\n' +
      'The oldest cutting, at the top, is the deepest and the plainest:\n\n' +
      '    IN THE YEAR THE WATER TURNED\n' +
      '    AND THE SKY SHUT\n' +
      '    AND IT DID NOT STOP AFTER\n\n' +
      'Under it, in a shallower hand, a list of about forty names. Under that, a second list, ' +
      'longer, and less carefully cut. Under that, scratches.\n\n' +
      'And at the foot of the stone, worn almost out, the thing you came over here to read ' +
      'without knowing it: a year, counted from something, in a notation you were taught at ' +
      'school.\n\n' +
      'You do the arithmetic twice. It is the year you turned sixteen.',
    onExamine: {
      flags: { [FLAGS.readMemorial]: true },
      journal: [
        {
          id: 'j.future_memorial',
          text:
            'The memorial by the well dates the beginning — the water turning, the sky ' +
            'shutting — to the year I turned sixteen. Then forty names, then more names, then ' +
            'scratches.',
        },
      ],
    },
  },
  {
    id: 'futuresquare.well',
    name: 'capped well',
    nouns: ['well', 'cap', 'pump', 'capped well', 'slab', 'bucket'],
    locationId: 'future.square',
    initiallyVisible: true,
    listAs: c('the well, capped and pumped'),
    verbs: () => ['examine'],
    description: () =>
      'The same well. The same stones round the top of it, and you could find the chipped one ' +
      'with your foot in the dark.\n\n' +
      'It has been capped with a cut slab and the joint round the edge is sealed with ' +
      'something black and tarry that has been renewed many times. A hand pump is bolted ' +
      'through the middle of the slab, and the four people in the queue are each drawing ' +
      'exactly one bucket and then standing aside, without being told to, and one of them is ' +
      'keeping count on a tally stick.\n\n' +
      'Nobody argues about it. It is older than arguing.',
    onExamine: {
      journal: [
        {
          id: 'j.future_well',
          text:
            'The well is capped and sealed and drawn through a pump, one bucket each, counted ' +
            'on a tally stick. Nobody argues about it.',
        },
      ],
    },
  },
  {
    id: 'futuresquare.workshop',
    name: 'roofless shell',
    nouns: ['shell', 'workshop', 'roofless shell', 'goats', 'ruin'],
    locationId: 'future.square',
    initiallyVisible: true,
    listAs: c("the shell where the joiner's workshop was"),
    verbs: () => ['examine'],
    description: () =>
      'Three walls to shoulder height and no roof, on the footprint you could walk blind. ' +
      'There are two goats in it and a lot of straw and a feed trough made out of a door.\n\n' +
      'You get over the wall and stand where the bench was.\n\n' +
      'The floor is still the floor: beaten earth with sawdust trodden into it so deep and so ' +
      'long ago that it has gone to a dark felt, and under one wall, where the basket lived, ' +
      'the goats have scuffed a hollow and there are tapered blocks of oak in it, grey with ' +
      'age, a dozen of them, that nobody has needed for a century.',
    onExamine: {
      reveals: ['futuresquare.maul', 'futuresquare.chock'],
      journal: [
        {
          id: 'j.future_workshop',
          text:
            "The joiner's workshop is three walls and goats. The sawdust is still in the floor " +
            'and there is a scatter of old oak wedges where the basket used to be.',
        },
      ],
    },
  },
  {
    id: 'futuresquare.maul',
    name: 'maul',
    nouns: ['maul', 'hammer', 'mallet', 'sledge'],
    locationId: 'future.square',
    initiallyVisible: false,
    hiddenWhen: (state) => state.inventory.includes('mallet'),
    listAs: c('a maul leaning in the corner of the shell'),
    item: 'mallet',
    verbs: () => ['examine', 'take'],
    takeText: () =>
      'You take the maul. It is a good deal heavier than a mason\'s mallet and the haft is too ' +
      'long for one hand, and it will do exactly one thing well, which happens to be the thing ' +
      'you want.\n\n' +
      'Nobody comes over to object.',
    description: () =>
      'A long-hafted maul with an iron-banded head, leaning in the corner of the shell with ' +
      'the handle worn pale. Somebody splits wood with this, or did; there is a block beside it ' +
      'with the top chewed out of it.\n\n' +
      'It is not a mason\'s tool and it is not delicate. For getting a dressed stone out of a ' +
      'wall it would be better than nothing and worse than the right thing.',
  },
  {
    id: 'futuresquare.chock',
    name: 'oak blocks',
    nouns: ['blocks', 'oak blocks', 'wedge', 'chock', 'offcuts'],
    locationId: 'future.square',
    initiallyVisible: false,
    hiddenWhen: (state) => state.inventory.includes('wedge'),
    listAs: c('old oak blocks in the hollow the goats have scuffed'),
    item: 'wedge',
    verbs: () => ['examine', 'take'],
    takeText: () =>
      'You pick one out and turn it over. Cut off-square, so it bites rather than slides, with ' +
      'saw marks scored across one face.\n\n' +
      'They cost him nothing and he handed them out to anybody who asked, and there are a ' +
      'dozen of them in a goat shed, and you take one.',
    description: () =>
      'Tapered blocks of oak the size of your palm, grey and silvered on the outside and sound ' +
      'all the way through when you knock two together. A dozen of them, in a hollow under the ' +
      'wall where a basket used to stand.\n\n' +
      'One face of each is scored with saw marks. The same cut, the same angle, the same ' +
      'off-square taper. The same hand.',
  },
  {
    id: 'futuresquare.chest',
    name: 'record chest',
    nouns: ['chest', 'record chest', 'box', 'oilcloth', 'records'],
    locationId: 'future.square',
    initiallyVisible: true,
    listAs: c('a chest under a scrap of oilcloth'),
    verbs: () => ['examine'],
    description: (state) =>
      'Plank-built, iron-cornered, with a lid that has been rehung twice. The oilcloth over it ' +
      'is weighted at the corners with stones and the woman sitting against it does not move ' +
      'when you look at it.\n\n' +
      'It holds what they have kept: boards, slates, a roll of hide, a tally of winters, and ' +
      'the Account.' +
      (state.flags[FLAGS.gaveStone]
        ? '\n\nThere is also a shallow wooden tray of small things, and in the tray, among a ' +
          'copper button and two teeth and a bead, there is a grey pebble with a pale band ' +
          'through it, labelled in a hand that has been copied and recopied: *from past the ' +
          'names, given*.'
        : ''),
    onExamine: {
      journal: [
        {
          id: 'j.future_chest',
          text:
            'The settlement keeps a chest of records under oilcloth: boards, slates, hide, a ' +
            'tally of winters, and the Account. Rue sits against it.',
        },
      ],
    },
  },
  {
    id: 'futuresquare.account',
    name: 'Account',
    nouns: ['account', 'the account', 'roll', 'hide', 'history', 'words'],
    locationId: 'future.square',
    initiallyVisible: false,
    listAs: c('the Account, out of the chest'),
    verbs: () => ['examine'],
    description: () =>
      'A roll of scraped hide, backed onto linen where it has split, written over in four or ' +
      'five hands and read often enough that the edges are furred.\n\n' +
      'Most of it is commentary — long, careful, argued-over, with crossings-out and ' +
      'disagreements in the margins about what the lines mean and what should be done about ' +
      'them. Two different hands have written *this is the hill* beside the same phrase, a ' +
      'century apart.\n\n' +
      'And in the middle of all of it, set apart, in the oldest and plainest hand on the roll, ' +
      'copied from a board that is named and is not here any more:\n\n' +
      prophecyBlock() + '\n\n' +
      'You read it four times. It is not nearly, and it is not mostly. It is the words, in the ' +
      'order you were taught them, with the same stop in the middle of the second line.\n\n' +
      'At the top of the roll, over the whole thing, somebody has written a title: ' +
      m('WHAT CAME, AND WHY') + '.',
    onExamine: {
      flags: { [FLAGS.readAccount]: true },
      journal: [
        {
          id: 'j.future_account',
          text:
            'The Account is a century of commentary wrapped round the prophecy, copied word ' +
            'for word from a named board that is gone. Titled: what came, and why.',
        },
      ],
    },
  },

  /* ================================================================ *
   * present.sealed_chamber, on the return
   *
   * Hidden outside the return chapter, so the opening cannot address them.
   * ================================================================ */
  {
    id: 'returnsealed.lamp',
    name: "their lantern",
    /*
     * Not bare "lantern". There are two identical lanterns in this room and
     * one of them is the hero's, and an item's id is also a word a player
     * types — so bare "lantern" is theirs by the ordinary rule, and this one
     * is addressed as what it is. The room says which is which in as many
     * words, and taking the one already in hand points at the other.
     */
    nouns: ['their lantern', 'their lamp', 'the other lantern', 'alcove lamp', 'lamp in the alcove'],
    locationId: 'present.sealed_chamber',
    initiallyVisible: true,
    hiddenWhen: (state) => state.chapter !== 'return',
    listAs: c('their lantern, burning in the alcove'),
    verbs: () => ['examine'],
    description: () =>
      'Tin, dented along one shoulder, horn pane, sliding hood. The striker hangs off the base ' +
      'on its short chain and the wick is burning at about the size of a thumbnail, and it is ' +
      'standing dead level in the dish because the dish was cut for it.\n\n' +
      'It is the lantern in your hand.\n\n' +
      'You look from one to the other for a moment and then stop, because there is nothing at ' +
      'the end of that.',
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
