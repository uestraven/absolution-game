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
      // The parts the description names, so each of them answers afterwards.
      reveals: ['home.tag', 'home.striker', 'home.lamphood'],
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
    // Knotted to the handle, so it goes where the lantern goes.
    attachedTo: 'lantern',
    listAs: c('a cloth tag knotted to the lantern handle'),
    verbs: () => ['examine', 'touch'],
    description: () =>
      'Three words in ink that has run a little:\n\n    Sixteen. Go carefully.\n\n' +
      'No name on it. Nobody in this house signs things.',
    cannotTake: () =>
      'Untying it would be taking it off, and you are not going to do that. It can stay on the ' +
      'handle.',
    responses: {
      touch: () => ({
        text:
          'Linen, washed thin, with a knot in it that was tied by somebody in a hurry who did ' +
          'not want it coming off.',
      }),
      untie: () => ({
        text:
          'You get a thumbnail into the knot and then stop.\n\nIt is a knot somebody tied this ' +
          'morning, before it was light, standing in a kitchen deciding whether to write ' +
          'anything at all. It can stay where it is.',
      }),
    },
  },
  {
    /*
     * The lantern's parts.
     *
     * Attached, so they travel with it, and deliberately a handful of nouns on
     * two objects rather than one object per screw: the striker is the part a
     * player will reach for (it is how the lamp gets lit, and it reappears in
     * the finale on the earlier self's lamp), and the rest of the ironmongery
     * answers as one.
     */
    id: 'home.striker',
    name: 'striker',
    nouns: ['striker', 'flint', 'steel', 'chain', 'short chain', 'firesteel'],
    locationId: 'present.home',
    initiallyVisible: false,
    attachedTo: 'lantern',
    verbs: () => ['examine', 'touch'],
    description: () =>
      'A flint and a curl of steel on a short chain, bolted through the base of the lamp so it ' +
      'cannot be put down anywhere and lost. Oreg\'s father did that to all forty of them, ' +
      'because he had watched somebody try to find a dropped striker in the dark.',
    cannotTake: () =>
      'It is bolted to the lamp. That is the entire point of it, and you have been grateful for ' +
      'it twice already today without noticing.',
    responses: {
      touch: () => ({
        text:
          'The flint is worn to a flat on one face and the steel is bright along one edge. It ' +
          'has been used a great many times by people who were not in a hurry.',
      }),
      pull: () => ({
        text: 'The chain is short and the bolt is through the base. It goes where the lamp goes.',
      }),
      untie: () => ({ text: 'It is bolted, not tied.' }),
    },
  },
  {
    id: 'home.lamphood',
    name: 'hood and pane',
    nouns: [
      'hood',
      'sliding hood',
      'pane',
      'horn pane',
      'horn',
      'wick',
      'handle',
      'bail',
      'shutter of the lamp',
    ],
    locationId: 'present.home',
    initiallyVisible: false,
    attachedTo: 'lantern',
    verbs: () => ['examine', 'touch'],
    description: (state) =>
      'A pane of scraped horn in a tin frame, gone the colour of weak tea, with a sliding hood ' +
      'above it that comes down over the flame when you want the light off without putting the ' +
      'lamp out. The handle is a wire bail, bent to sit flat.\n\n' +
      (f(state, FLAGS.lanternLit)
        ? 'The wick is up and burning, and the horn has a soft ring of brighter yellow in the ' +
          'middle of it where the flame is.'
        : 'The wick is down and black at the tip, and the horn is cold.'),
    cannotTake: () =>
      'It is all one lamp. Taking it apart in a bedroom on the morning of the rite would be a ' +
      'remarkable way to begin.',
    responses: {
      touch: (state) =>
        f(state, FLAGS.lanternLit)
          ? {
              text:
                'The tin above the pane is hot enough to make you take your hand back. The bail ' +
                'is cool, which is why the bail is where it is.',
            }
          : { text: 'Cold tin and warm-feeling horn, which is a thing horn does.' },
      smell: (state) =>
        f(state, FLAGS.lanternLit)
          ? { text: 'Burning oil, close up, and hot tin.' }
          : { text: 'Cold oil and old smoke. It smells like every lamp in the village.' },
    },
  },
  {
    id: 'home.flue',
    name: 'flue',
    nouns: ['flue', 'chimney', 'cold patch', 'corner', 'warm corner'],
    locationId: 'present.home',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'The kitchen chimney comes up through the corner of your room in a bulge of lime-washed ' +
      'stone, which is the reason this is the warm room and your brother\'s is not. There is a ' +
      'cold patch on the floor beside it where the draught comes in at the joint, and you have ' +
      'known the exact shape of that cold patch since you were four.',
    cannotTake: () => 'It is a chimney.',
    responses: {
      touch: () => ({
        text:
          'Warm, about as warm as a hand, and the lime-wash comes off on your fingers in a fine ' +
          'white dust. It has been doing that your whole life.',
      }),
      smell: () => ({ text: 'Woodsmoke. The whole room smells of it; here it smells of it more.' }),
      listen: () => ({
        text:
          'The kitchen, faintly, through a stone: somebody moving about down there and not ' +
          'saying anything.',
      }),
      sit: () => ({
        text:
          'You sit down on the floor against the warm side of the flue, which is what you did ' +
          'every winter morning until you got too tall for it.\n\nThen you get up, because of ' +
          'the day.',
      }),
    },
  },
  {
    id: 'home.floor',
    name: 'floorboards',
    nouns: ['floorboards', 'floorboard', 'floor', 'boards'],
    locationId: 'present.home',
    initiallyVisible: true,
    description: () =>
      'Wide boards, pegged, with the grain standing up where a hundred years of feet have worn ' +
      'the soft summer wood out from between it. The third one from the window has always ' +
      'creaked and always will.',
    cannotTake: () => 'They are the floor.',
    responses: {
      touch: () => ({ text: 'Cold at the window end and not cold by the flue.' }),
      pull: () => ({
        text:
          'You put your fingers in the gap at the end of the creaking board and lift, out of an ' +
          'old habit from being nine, and it does not come up, because it never did.',
      }),
      knock: () => ({
        text:
          'You stand on the third board from the window and it creaks, exactly as it has every ' +
          'morning of your life. Somebody downstairs now knows you are awake.',
      }),
    },
  },
  {
    id: 'home.door',
    name: 'door',
    nouns: ['door', 'bedroom door', 'latch'],
    locationId: 'present.home',
    initiallyVisible: true,
    description: () =>
      'A plank door on strap hinges, standing half open the way it always does because the ' +
      'frame has dropped and it will not sit shut without being lifted. The stool is beside it. ' +
      'Through the gap, the stair goes down.',
    cannotTake: () => 'It is on its hinges and the hinges are in the frame.',
    responses: {
      touch: () => ({ text: 'Smooth at the height of a hand and rough everywhere else.' }),
      pull: () => ({
        text:
          'You lift it on the latch and swing it, and it grinds on the frame at the same point ' +
          'as always and then stands half open again.',
      }),
      knock: () => ({
        text:
          'You knock on your own bedroom door, which is a strange thing to do. Nobody answers, ' +
          'because nobody is in here but you.',
      }),
      listen: () => ({
        text:
          'Down the stair: the kitchen, and somebody being quiet in it on purpose so as not to ' +
          'wake you, several hours after you woke.',
      }),
    },
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
    cannotTake: () =>
      'It is a window in a wall. The sill is where the lantern was, and that is as much as ' +
      'you need from it.',
  },
  {
    id: 'home.bread',
    name: 'bread',
    nouns: ['bread', 'loaf', 'breakfast', 'food', 'slice', 'crumbs'],
    locationId: 'present.home',
    initiallyVisible: true,
    /*
     * Not hidden once eaten: the crumbs are described, so the noun has to keep
     * answering. Only what it is called changes.
     */
    listAs: (state) => (f(state, FLAGS.ateBread) ? c('crumbs on the stool') : c('bread set out on a stool')),
    verbs: (state) => (f(state, FLAGS.ateBread) ? ['examine'] : ['examine', 'eat']),
    description: (state) =>
      f(state, FLAGS.ateBread)
        ? 'Crumbs, and the dent in the stool where the loaf was.'
        : 'Yesterday\'s loaf, cut thick, with the good end facing up. Someone wanted you to find ' +
          'it and did not want to be there when you did.',
    cannotTake: (state) =>
      f(state, FLAGS.ateBread)
        ? 'You have had it.'
        : 'You could carry it, and then you would be a person walking up a hill holding bread. ' +
          'EAT BREAD.',
    responses: {
      /*
       * The one consumable in the game, and the reason the family exists at
       * all: the opening sets bread on a stool and the player tries to eat it.
       * It latches a flag, so the loaf is gone after a reload and the epilogue
       * does not leave it sitting there uneaten.
       */
      eat: (state) =>
        f(state, FLAGS.ateBread)
          ? { text: 'There is no more bread. You are not going to be hungry for a while yet.' }
          : {
              text:
                'You eat it standing up, which is how you eat everything, and it is better than ' +
                'it has any right to be for yesterday\'s loaf.\n\nSomebody was up before you and ' +
                'did not stay to be thanked. You will want to have eaten, later.',
              accepted: true,
              effects: {
                flags: { [FLAGS.ateBread]: true },
                journal: [
                  {
                    id: 'j.bread',
                    text: 'Ate the bread somebody left out on the stool. Whoever it was had gone.',
                  },
                ],
              },
            },
      taste: () => ({
        text: 'Bread. Yesterday\'s, and better than that suggests. EAT BREAD if you are going to.',
      }),
      smell: (state) =>
        f(state, FLAGS.ateBread)
          ? { text: 'Crumbs, and the cold of the room underneath them.' }
          : { text: 'Bread, and the cold of the room underneath it. It was baked yesterday.' },
      touch: (state) =>
        f(state, FLAGS.ateBread)
          ? { text: 'Crumbs, and the stool is colder than the crumbs.' }
          : { text: 'Still soft under the crust, which means the kitchen fire was going late.' },
    },
  },
  {
    /*
     * Its own object now. It used to be an alias on the bread, so `sit on the
     * stool` answered about a loaf.
     */
    id: 'home.stool',
    name: 'stool',
    nouns: ['stool', 'three legged stool', 'seat'],
    locationId: 'present.home',
    initiallyVisible: true,
    verbs: () => ['examine', 'sit'],
    description: () =>
      'Three legs and a scrubbed top, the one your father made badly and keeps because he made ' +
      'it. It lives under the window and gets dragged about for whatever needs standing on.',
    cannotTake: () =>
      'You are not taking furniture up a hill. Oreg would hear about it before you reached the ' +
      'turn.',
    responses: {
      sit: () => ({
        text:
          'You sit down on it, out of habit, and then get up again, because sitting down is not ' +
          'what today is for.',
      }),
      touch: () => ({ text: 'Scrubbed smooth in the middle and rough at the edges.' }),
    },
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
    nouns: [
      'salt',
      'bowl',
      'bowl of salt',
      'salt bowl',
      'wooden bowl',
      'offering',
      'coarse salt',
    ],
    locationId: 'present.square',
    initiallyVisible: true,
    listAs: c('a bowl of salt on the well-cap'),
    verbs: () => ['examine', 'taste', 'touch'],
    description: () =>
      'Coarse grey salt in a wooden bowl, heaped and smoothed flat on top. It is not a village ' +
      'custom you grew up with. It arrived this spring, fully formed, the way customs do when ' +
      'people are frightened and busy.',
    cannotTake: () =>
      'It is not yours and it is not for anything. Sage put it there in the spring and smoothed ' +
      'the top flat, and she smooths it flat again every time the wind gets at it.',
    responses: {
      taste: () => ({
        text:
          'You put a wet fingertip in the corner of it where the smoothing does not reach, and ' +
          'taste salt, which is what it is.\n\nThen you flatten the dent out with your thumb, ' +
          'because Sage will see it otherwise.',
      }),
      touch: () => ({
        text: 'Dry, coarse, and colder than the wood it sits in.',
      }),
      eat: () => ({
        text: 'It is a bowl of salt, not a meal, and it is somebody else\'s besides.',
      }),
    },
  },
  {
    /*
     * The cap itself. `well cap` used to be an alias on the bowl standing on
     * it, so asking about the cap described the salt.
     */
    id: 'square.wellcap',
    name: 'well-cap',
    nouns: ['well cap', 'wellcap', 'cap', 'well lid', 'lid', 'slab'],
    locationId: 'present.square',
    initiallyVisible: true,
    description: () =>
      'A single slab, cut to overhang the well mouth by a thumb all round, with a lifting notch ' +
      'on the near side worn smooth and pale. It is not locked and never has been. It is heavy ' +
      'enough that children leave it alone, which is the whole of the reason it exists.',
    cannotTake: () =>
      'It is a slab of stone and it is doing a job. You could shift it with two people and a ' +
      'bar, and then there would be an open well in the middle of the square.',
    responses: {
      touch: () => ({
        text: 'Cold, and dusty on top, and damp underneath where your fingers reach the overhang.',
      }),
      pull: () => ({
        text:
          'You get your fingers in the lifting notch and pull, and the cap tells you what it ' +
          'weighs. It would come up for two people. It is not coming up for one, and there is ' +
          'nothing you want down there.',
      }),
      knock: () => ({
        text:
          'You knock on it. There is a well under it, so the sound goes down and comes back ' +
          'wrong, and a little later than you expect.',
      }),
    },
  },
  {
    /*
     * Marjoram's dough. Named in the room description and in her dialogue, and
     * the headline example of prose the parser could not see.
     */
    id: 'square.dough',
    name: 'dough',
    nouns: ['dough', 'bread dough', 'kneading board', 'board of dough', 'marjoram board'],
    locationId: 'present.square',
    initiallyVisible: true,
    description: () =>
      'A grey-white mass on a floured board set across two trestles, worked to the point where ' +
      'it has stopped sticking to her and started pushing back. She turns it a quarter and folds ' +
      'it and leans, and does it again, and talks the whole time without losing the count.',
    cannotTake: () =>
      'Marjoram catches your wrist before your hand is halfway there. "That is tomorrow\'s," she ' +
      'says, not unkindly, and goes back to her count.',
    responses: {
      touch: () => ({
        text:
          'Marjoram catches your wrist before you put a finger in her dough. "Wash first or ' +
          'don\'t at all," she says, and then, having decided: "Don\'t at all."',
      }),
      eat: () => ({
        text:
          '"It is raw," says Marjoram, without looking up. "You would be ill, and I would be ' +
          'short, and your mother would hear about both."',
      }),
      taste: () => ({
        text: '"Raw flour," says Marjoram. "There is nothing in it yet. Come back tomorrow."',
      }),
      smell: () => ({
        text: 'Flour and yeast and the sour edge of a starter somebody has kept alive for years.',
      }),
    },
  },
  {
    id: 'square.well',
    name: 'well',
    nouns: ['well', 'windlass'],
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
    id: 'square.bucket',
    name: 'bucket',
    nouns: ['bucket', 'buckets', 'pail', 'well bucket', 'well rope', 'rope'],
    locationId: 'present.square',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch', 'pull'],
    description: () =>
      'The well bucket, hung on its hook on the windlass frame with the rope coiled over it: ' +
      'oak, iron-bound, black inside with a century of being wet. There is only the one. ' +
      'Everybody brings their own for carrying and uses this one for drawing.',
    cannotTake: () =>
      'It is the village\'s bucket and it lives on the windlass. Walking off up a hill with it ' +
      'would be noticed before you reached the lane.',
    responses: {
      pull: () => ({
        text:
          'You take it off the hook and let it down a turn or two, and the rope goes over the ' +
          'drum with the noise it has always made, and then you wind it back up because you are ' +
          'not thirsty and there is a cap on the well anyway.',
      }),
      touch: () => ({ text: 'Cold iron bands and wet-smelling oak. It is always a little damp.' }),
      drink: () => ({
        text:
          'There is a slab of stone on the well and a bowl of salt on the slab, and your mother ' +
          'filled a jug at the kitchen end of the morning anyway. You are not thirsty.',
      }),
    },
  },
  {
    id: 'square.bakehouse',
    name: 'bakehouse',
    nouns: ['bakehouse', 'bake house', 'oven', 'doorway', 'bakehouse door'],
    locationId: 'present.square',
    initiallyVisible: true,
    description: () =>
      'The long low end of the square, with its door propped and the heat coming out of it in a ' +
      'way you can see as well as feel. Marjoram works outside it in any weather that will let ' +
      'her, because inside it is the temperature of inside an oven.\n\nYou have been sent to ' +
      'fetch things out of there more times than you can count.',
    cannotTake: () => 'It is a building.',
    responses: {
      smell: () => ({
        text:
          'Bread, hot stone, and woodash — the smell of the square, which is a thing you will ' +
          'not notice again until it is not there.',
      }),
      touch: () => ({
        text:
          'The stone of the doorway is warm to the hand on a cold morning, which is why ' +
          'everybody in the village leans on it.',
      }),
      sit: () => ({
        text:
          'You lean on the warm jamb of the bakehouse door for a moment, which is what everyone ' +
          'does, and then remember that today you are going somewhere.',
      }),
      listen: () => ({
        text:
          'The oven, ticking as it cools, and the scrape of a peel on stone somewhere inside.',
      }),
    },
  },
  {
    /*
     * Sage's chalk. `chalk` has always meant the plank's writing, which is
     * right — so this answers to the stub in her hand and to her apron, the two
     * props her dialogue puts there.
     */
    id: 'square.sagekit',
    name: "Sage's chalk and apron",
    nouns: [
      'stub of chalk',
      'chalk stub',
      'her chalk',
      'sage chalk',
      'apron',
      'her apron',
      'sage apron',
      'pocket',
    ],
    locationId: 'present.square',
    initiallyVisible: true,
    description: () =>
      'A stub of white chalk about the length of a thumb joint, carried in the front pocket of ' +
      'a canvas apron that has been white and is now the colour of the plank. She takes the ' +
      'chalk out, writes nothing, and puts it back, four or five times an hour.\n\nThe apron ' +
      'has one pocket, and the pocket has chalk dust in the seam of it a finger deep.',
    cannotTake: () =>
      '"You can ask," says Sage, who has noticed you looking at her pocket. "You will not get ' +
      'it. I have had three of these in forty years and I have lost two."',
    responses: {
      touch: () => ({
        text:
          'You would have to put your hand in a woman\'s apron pocket to do that, and she is ' +
          'standing in it.',
      }),
      taste: () => ({ text: 'You are not eating chalk in front of the whole square.' }),
    },
  },
  {
    id: 'square.stick',
    name: "Parsie's stick",
    nouns: ['stick', 'measuring pole', 'pole', 'his stick', 'parsie stick'],
    locationId: 'present.square',
    initiallyVisible: true,
    description: () =>
      'A straight ash switch as tall as he is, peeled white, with a notch cut round it about a ' +
      'hand from the top. He holds it up like a measuring pole whenever he is explaining ' +
      'something, which is most of the time.\n\nThe notch does not measure anything. He cut it ' +
      'because measuring poles have notches.',
    cannotTake: () =>
      '"That is my pole," says Parsie, with the whole of his eleven years behind it, and takes ' +
      'it back out of reach.',
    responses: {
      touch: () => ({
        text: 'Peeled smooth, and warm from being held all morning by somebody who never sits down.',
      }),
      pull: () => ({
        text:
          'He hangs on to it. There is a brief undignified moment and then you let go, because ' +
          'he is eleven and you are not.',
      }),
    },
  },
  {
    /*
     * Seen, not reached. The audit's rule six: you can look at the far side of
     * the square from here, and you cannot pick anything up from it.
     */
    id: 'square.ladder',
    name: 'ladder',
    nouns: ['ladder', 'boy on the ladder', 'man on the ladder', 'person hanging lanterns'],
    locationId: 'present.square',
    initiallyVisible: true,
    description: () =>
      'A ladder against the gable on the far side of the square, with Hyssop\'s boy at the top ' +
      'of it threading the cord of lanterns along under the eaves. He has been at it since ' +
      'before you came down and has about a third of them up.\n\nNobody will light them until ' +
      'the eleventh day. That is the arrangement, and nobody has said so out loud in weeks.',
    cannotTake: () =>
      'It is across the square with a boy standing on it. You would have to ask him to come ' +
      'down, and then explain what you wanted a ladder for.',
    responses: {
      touch: () => ({ text: 'It is on the other side of the square.' }),
      pull: () => ({ text: 'From here? It is forty paces away with somebody on it.' }),
      listen: () => ({
        text:
          'The knock of the ladder shifting on the cobbles, and the boy swearing quietly at a ' +
          'tangle in the cord.',
      }),
    },
  },
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
    nouns: ['bench', 'workbench', 'tools', 'vice'],
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
    id: 'workshop.gluepot',
    name: 'glue-pot',
    nouns: ['glue pot', 'gluepot', 'glue', 'pot', 'skin on the glue'],
    locationId: 'present.workshop',
    initiallyVisible: true,
    verbs: () => ['examine', 'smell'],
    description: () =>
      'An iron pot in a second pot of water over a brazier turned right down, with a brown skin ' +
      'across the top of the glue and a brush standing in it handle-up. It has to be warm and ' +
      'it must not boil, and Oreg has had it going since before light.',
    cannotTake: () =>
      'It is hot, it is full of hide glue, and the whole room is organised around it being ' +
      'exactly that temperature. Leave it.',
    responses: {
      smell: () => ({
        text:
          'Hide glue, which smells like something that was recently an animal and is now ' +
          'furniture. Everyone in the village knows this smell and nobody describes it kindly.',
      }),
      touch: () => ({
        text:
          'You get a fingertip to the rim and take it away. The skin on the glue dents and ' +
          'closes over, which is unpleasant in a way you cannot name.',
      }),
      taste: () => ({ text: 'It is glue.' }),
      eat: () => ({ text: 'It is glue, and it is hot, and Oreg is standing right there.' }),
    },
  },
  {
    id: 'workshop.shavings',
    name: 'shavings',
    nouns: ['shavings', 'shaving', 'sawdust', 'dust', 'floor of the workshop'],
    locationId: 'present.workshop',
    initiallyVisible: true,
    verbs: () => ['examine', 'smell'],
    description: () =>
      'Long pale curls of it to the depth of your ankle along one side of the bench, and a drift ' +
      'of sawdust under the saw-horse. Oreg sweeps it into sacks on a Saturday and sells it to ' +
      'the bakehouse for lighting the oven.\n\nThere is oak in it, and ash, and something ' +
      'resinous that has come up the valley from somewhere else.',
    cannotTake: () =>
      'You could fill both pockets with wood shavings. You would then be a person going into a ' +
      'cave with two pockets full of wood shavings.',
    responses: {
      smell: () => ({
        text:
          'Cut wood, which is the best smell there is, and which this room has had in it every ' +
          'day of your life.',
      }),
      touch: () => ({
        text: 'They crackle and spring back. The oak ones have an edge to them if you are careless.',
      }),
      pull: () => ({
        text: 'You scuff a drift of them into a heap with your boot and Oreg does not look up.',
      }),
    },
  },
  {
    id: 'workshop.chisels',
    name: 'chisels in their rack',
    nouns: ['chisels', 'chisel', 'rack', 'chisel rack', 'gouges'],
    locationId: 'present.workshop',
    initiallyVisible: true,
    verbs: () => ['examine'],
    description: () =>
      'A rack of them above the bench in order of width, handles up, the leather washers worn ' +
      'flat on the ones he favours. Firmers, bevel-edges, two gouges and a mortice chisel like ' +
      'a crowbar.\n\nEvery edge in the rack will take the hair off your arm. He checks them all ' +
      'on a Sunday whether they need it or not.',
    cannotTake: () =>
      '"Not those," says Oreg, without turning round. "Everything in that rack is sharper than ' +
      'you are expecting and none of it is for stone."',
    responses: {
      touch: () => ({
        text:
          '"Mind." He says it mildly and does not look up, and you put your hand back down by ' +
          'your side.',
      }),
    },
  },
  {
    id: 'workshop.door',
    name: 'big door',
    nouns: ['big door', 'door', 'doors', 'hook', 'hooked door'],
    locationId: 'present.workshop',
    initiallyVisible: true,
    description: () =>
      'The whole of the front of the workshop, hooked back against the wall so the light can get ' +
      'in and the long stuff can get out. There is a worn patch on the flags where the bottom ' +
      'edge has dragged for thirty years before somebody finally planed it.',
    cannotTake: () => 'It is a door the size of a wall.',
    responses: {
      pull: () => ({
        text:
          'You lift it off the hook an inch and the room goes noticeably darker, and Oreg says ' +
          '"leave it" without raising his voice, so you put it back.',
      }),
      touch: () => ({ text: 'Sun-warm on the outside face and cold on the inside one.' }),
    },
  },
  {
    id: 'workshop.joint',
    name: 'housed dovetail',
    nouns: ['joint', 'dovetail', 'housed dovetail', 'his work', 'the work'],
    locationId: 'present.workshop',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'Half-cut, in the vice: a housed dovetail, the socket chopped and the shoulder not yet ' +
      'pared, with the knife lines still showing on either side of the waste. He is working to ' +
      'the lines and leaving them, which is the difference between a joiner and somebody with ' +
      'tools.\n\nIt will go together dry and stay together without the glue. The glue is ' +
      'because he is being thorough.',
    cannotTake: () =>
      'It is in the vice, half-done, and it is the thing he will be doing when you get back.',
    responses: {
      touch: () => ({
        text:
          'The chopped socket is crisp enough to catch a fingernail at every corner. You put ' +
          'your hand back in your pocket before he sees you touching it.',
      }),
      pull: () => ({
        text: 'It is in a vice. Pulling on it would be a way of making Oreg say something.',
      }),
    },
  },
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
    cannotTake: () =>
      'It is the better part of a tree, cut off at the knee and rooted under the whole corner ' +
      'of the track. You tried to move it once, aged about nine, with a bar.',
  },
  {
    /*
     * Tyme's own coil, as distinct from the installed safety rope down in the
     * cave and from the spare on the hook at the mouth. `rope` on the path has
     * always been Tyme — he is the man with the rope — so this answers to what
     * is across his knees.
     */
    id: 'path.coil',
    name: 'coil of rope',
    nouns: ['coil', 'his rope', 'tyme rope', 'hemp', 'coil of rope', 'coil of hemp'],
    locationId: 'present.cave_path',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'Thirty feet of three-strand hemp across his knees, coiled the proper way so it pays out ' +
      'without kinking, with a whipping on each end that somebody has redone recently. He runs ' +
      'it through his hands while he talks without looking at it.\n\nThis is not the rope that ' +
      'is tied off in the cave. This is the one he keeps for the days somebody needs a rope.',
    cannotTake: () =>
      '"There is one down there already," says Tyme, "tied off where it wants to be. This one ' +
      'stays with me."\n\nHe says it kindly, and he does not stop running it through his hands.',
    responses: {
      touch: () => ({
        text:
          'Furred, slightly greasy, and warm from his knees. It has been looked after by ' +
          'somebody with time on their hands and a reason to care.',
      }),
      pull: () => ({
        text: 'He lets out a yard of it, and then takes the yard back. "No," he says, comfortably.',
      }),
      smell: () => ({ text: 'Hemp and tar and a man who has been sitting in the sun.' }),
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
    nouns: ['rope', 'knotted rope', 'ring', 'iron ring', 'line', 'knots', 'knot', 'safety rope'],
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
    cannotTake: () =>
      'It is tied to an iron ring in the floor of the mouth and it goes down into the dark, ' +
      'and it is there so that anybody who gets into trouble has something to find with a ' +
      'hand. Untying it would be the single most selfish act in the history of the village.',
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
    nouns: ['bench', 'seat', 'hook', 'spare rope', 'spare coil', 'coil', 'spare line'],
    locationId: 'present.entrance',
    initiallyVisible: true,
    listAs: c('a bench, and a hook with spare rope'),
    verbs: () => ['examine'],
    description: () =>
      'A plank bench on two stones, the kind of furniture that exists because people wait here. ' +
      'Above it, a hook holds a spare coil.\n\n' +
      'Somebody has scratched a shallow line into the bench for every rite kept this year. You ' +
      'count eleven, which with yours makes twelve.',
    cannotTake: () =>
      'The bench is pegged to the rock, and the coil on the hook is the one that stays here ' +
      'for the day somebody needs a rope and Tyme is not sitting on it.',
  },

  /* ================================================================ *
   * present.outer_gallery
   * ================================================================ */
  {
    id: 'path.scrub',
    name: 'thistles and shale',
    nouns: ['thistles', 'thistle', 'shale', 'grass', 'scree', 'scrub', 'hillside'],
    locationId: 'present.cave_path',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'Where the grass gives up: a slope of grey shale with thistles growing out of it at the ' +
      'angles that thistles choose, and the track cut across the face of it on the only line a ' +
      'cart could take.\n\nYou have rolled down this and been shouted at for it.',
    cannotTake: () => 'A handful of shale and a thistle. You have no use for either.',
    responses: {
      touch: () => ({
        text:
          'The shale comes away in flakes that ring faintly against each other. The thistle you ' +
          'leave alone, having learned.',
      }),
      pull: () => ({
        text:
          'You pull a flake of shale out of the slope and three more come with it, and a small ' +
          'quantity of hill goes down the track ahead of you.',
      }),
      smell: () => ({
        text: 'Hot stone and bruised thistle, which is the smell of the top of this track.',
      }),
    },
  },
  {
    id: 'path.boots',
    name: "Dilly's boots",
    nouns: ['boots', 'boot', 'laces', 'lace', 'her boots', 'dilly boots'],
    locationId: 'present.cave_path',
    initiallyVisible: true,
    description: (state) =>
      'Heavy and much-mended, with the laces of the left one undone where she has been sitting ' +
      'with her foot up on the bank. There is a repair across the toe of the right one that ' +
      'somebody has done with waxed thread and real care.\n\n' +
      (f(state, FLAGS.heardRescued)
        ? 'She was wearing these, or ones like them, the night they went in after her.'
        : 'She keeps looking up the track while she does the lace, and then not saying anything.'),
    cannotTake: () =>
      'They are on her feet, or near enough. There are limits.',
    responses: {
      touch: () => ({ text: 'You are not touching somebody else\'s boots.' }),
      untie: () => ({
        text:
          'One of them is already undone and she is doing it up. Interfering with the other ' +
          'would be the strangest thing anybody has done in this village in years.',
      }),
    },
  },
  {
    id: 'entrance.moss',
    name: 'moss',
    nouns: ['moss', 'overhang', 'swept earth', 'earth', 'threshold'],
    locationId: 'present.entrance',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'Moss round the lintel in a band about a hand wide, where the overhang keeps the rain off ' +
      'but not the damp — bright green at the outer edge and nearly black where it goes under ' +
      'the stone.\n\nUnder the overhang the earth is swept. Somebody does that. Nobody has ' +
      'ever said who, and now that you think about it, it is probably Tyme.',
    cannotTake: () => 'It is moss on a rock.',
    responses: {
      touch: () => ({
        text:
          'Cold and springy and wetter than it looks. It comes away in a sheet if you are rough ' +
          'with it, so you are not.',
      }),
      smell: () => ({
        text: 'Wet stone and green. The outside of the cave smells of this and the inside does not.',
      }),
    },
  },
  {
    id: 'gallery.roof',
    name: 'gallery roof',
    nouns: ['roof', 'ceiling', 'gallery roof', 'overhead'],
    locationId: 'present.outer_gallery',
    initiallyVisible: true,
    description: () =>
      'Two spans above you where the gallery is widest, and close enough to touch where it is ' +
      'not — natural rock, water-cut, with a long shallow dome to it that no mason made. The ' +
      'drips come off the same four places every time and have done long enough to leave ' +
      'stains.',
    cannotTake: () => 'It is the inside of a hill.',
    responses: {
      touch: () => ({
        text:
          'Wet, where you can reach it. You wipe your hand on your shirt and it goes on being ' +
          'wet.',
      }),
      listen: () => ({
        text:
          'Four drips, out of time with each other, and the one furthest off is the loudest, ' +
          'which is the kind of thing this cave does.',
      }),
    },
  },
  {
    /*
     * The things *in* the relief, as opposed to the things they depict.
     *
     * The audit's depiction gap: the carving shows a lamp in a recess, an eye,
     * and a figure asleep, and the nouns either failed or — worse — `lamp`
     * identified the hero's actual lantern. These are pictures of things.
     */
    id: 'gallery.depicted',
    name: 'figures in the relief',
    nouns: [
      'carved eye',
      'pictured lamp',
      'carved lamp',
      'recess',
      'bedding',
      'carved figure',
      'figures',
      'sleeper',
    ],
    locationId: 'present.outer_gallery',
    initiallyVisible: false,
    description: () =>
      'Cut into the stone, not standing in it: a lamp in a recess, an eye above it, and a shape ' +
      'on the floor of the picture that is somebody lying down with bedding over them.\n\n' +
      'None of it is a thing you could pick up. It is a hand\'s depth of relief carving on a ' +
      'wall, and whoever cut it was telling you how to do something, in the only way they had.',
    cannotTake: () =>
      'They are carvings. The lamp in the picture is a picture of a lamp — the one you want is ' +
      'in your own hand.',
    responses: {
      touch: () => ({
        text:
          'You put your fingers into the carved recess, which is exactly as deep as the first ' +
          'joint of your fingers, and there is nothing in it. There has never been anything in ' +
          'it. It is a drawing.',
      }),
    },
  },
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
      // The things the carving shows, so each of them answers as a carving.
      reveals: ['gallery.depicted'],
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
    cannotTake: () =>
      'It is cut into the wall to the depth of a hand. Whoever made it meant it to be here ' +
      'when they were not, and it has been.',
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
    cannotTake: () =>
      'It is a column of hill, floor to roof, made by water out of the hill itself. You could ' +
      'put both arms round it and not shift it by the width of a hair.',
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
    id: 'echo.silt',
    name: 'silt in the water',
    nouns: ['silt', 'sediment', 'bottom', 'mud'],
    locationId: 'present.echo_chamber',
    initiallyVisible: false,
    description: () =>
      'A finger of pale silt over the floor of the standing water, flat and undisturbed except ' +
      'where you have just put your hand in it. It settles slowly and completely, which tells ' +
      'you how long it has been since anything moved down here.',
    cannotTake: () => 'A handful of wet grit. No.',
    responses: {
      touch: () => ({
        text:
          'Soft, and colder than the water above it. It comes up in a slow cloud and takes a ' +
          'long time to go back down, and while it is up you cannot see the bottom at all.',
      }),
    },
  },
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
    nouns: ['boot', 'shoe', 'laces', 'lace', 'bow', 'tied bow'],
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
    cannotTake: () =>
      'You pick it up and the leather creaks like a board.\n\nIt is a child\'s left boot that ' +
      'has been on the floor of a cave for forty years, and it belongs to somebody who is ' +
      'probably still alive and definitely does not want it. You put it back on its side the way ' +
      'it was lying.',
    responses: {
      touch: () => ({
        text:
          'Hard as a shoe-last, and cold, and furred with a century of nothing. The shape of a ' +
          'foot is still in it.',
      }),
      untie: () => ({
        text:
          'You get a thumbnail into the bow and the lace does not give at all. It has set — it ' +
          'is as much a part of the boot as the eyelets are now.\n\nWhich is just as well. ' +
          'Somebody tied that in the dark forty years ago with their hands shaking, and it has ' +
          'held ever since.',
      }),
      pull: () => ({
        text: 'The lace is as hard as the leather. Nothing about this boot is going to move again.',
      }),
      smell: () => ({ text: 'Old leather and cold stone. Nothing worse, which is a mercy.' }),
    },
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
    onExamine: {
      // The silt is the floor of it, and reads as a thing once seen.
      reveals: ['echo.silt'],
    },
    responses: {
      touch: () => ({
        text:
          'Cold enough to ache in the bones of your hand within about four seconds, and the ' +
          'silt comes up off the bottom in a slow cloud where you disturb it.',
      }),
      drink: () => ({
        text:
          'You could. It is clear, it is cold, and there is a cupful of fine grey silt in the ' +
          'bottom of it that will come up the moment you put your hand in.\n\nYou have a full ' +
          'morning\'s water in you and there is a spring on the hill. You leave it.',
      }),
      listen: () => ({
        text:
          'Not this. The drip is behind the wall, lower, and in this room everything you hear ' +
          'is in the wrong place by a moment.',
      }),
    },
    cannotTake: () =>
      'You can put your hands in it, and carry a little of it a short distance in them. There ' +
      'is no sensible version of taking a pool.',
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
    cannotTake: () =>
      'It is a slab of the hill in a pair of cut grooves, and the whole point of it is that it ' +
      'goes up and comes down and stays where the grooves put it.',
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
    /*
     * The opening era's own crack and grit. The return chapter has its own
     * version with the strike state in it; this is the one Lovage's warning a
     * century earlier is about, before anybody has swung at anything.
     */
    id: 'sealed.crackearly',
    name: 'crack at the foot of the pillar',
    nouns: ['pillar crack', 'crack at the base', 'grit', 'fan of grit', 'crack'],
    locationId: 'present.sealed_chamber',
    initiallyVisible: true,
    hiddenWhen: (state) => state.chapter === 'return',
    description: () =>
      'A crack in the dressed stone at the foot of the pillar, about the length of your forearm, ' +
      'running up from the floor and closing to nothing. There is a small grey fan of grit on ' +
      'the flags underneath it.\n\nEverything in this room has been here four hundred years. ' +
      'The grit is what four hundred years looks like when it happens to a pillar.',
    cannotTake: () => 'A handful of grit off the floor of a cave.',
    responses: {
      touch: () => ({
        text: 'Dry, fine, and it gets under your nails. The crack takes a fingertip and narrows.',
      }),
      listen: () => ({
        text: 'You put your ear to the pillar. Nothing. It is a column of rock holding up a hill.',
      }),
    },
  },
  {
    id: 'sealed.grooves',
    name: 'grooves and lip',
    nouns: ['grooves', 'groove', 'lip', 'cut grooves', 'runners'],
    locationId: 'present.sealed_chamber',
    initiallyVisible: true,
    hiddenWhen: (state) => state.chapter === 'return',
    description: (state) =>
      'A pair of channels cut into the jambs either side of the shutter, square and true, so ' +
      'the slab can only go straight up and straight down. There is a lip along the bottom edge ' +
      'of the slab, worn smooth and shallow, that a set of fingers fits under.\n\n' +
      (f(state, FLAGS.shutterHeld)
        ? 'The slab is up in the grooves with the wedge under the lip, and the whole arrangement ' +
          'is doing exactly what it was cut to do.'
        : 'Somebody cut this so that one person could do it alone, and then made the gap under ' +
          'the lip the width of four fingers.'),
    cannotTake: () => 'They are channels cut in a wall.',
    responses: {
      touch: () => ({
        text:
          'The grooves are gritty at the bottom with four hundred years of dust and clean where ' +
          'the slab runs. Somebody meant this to be used.',
      }),
      pull: () => ({
        text:
          'You get your fingers under the lip and lift, which is the right idea and not quite ' +
          'enough on its own — it comes up and it comes straight back down the moment you let ' +
          'go of it.',
      }),
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
    onExamine: {
      // The pivot the whole slab turns on, named here and nowhere else.
      reveals: ['sealed.pivot'],
    },
    responses: {
      touch: () => ({
        text:
          'The edge of the slab is as sharp as the day it was cut on the inside face and worn ' +
          'smooth on the outside one, where four hundred years of nobody has still been enough ' +
          'to round it.',
      }),
      listen: () => ({
        text:
          'Nothing comes up the steps. Not water, not air moving, not an echo of your own ' +
          'breathing. It is the quietest thing you have ever listened to.',
      }),
      smell: () => ({
        text: 'Warmer air than the room, and it smells of nothing at all. Not even of stone.',
      }),
    },
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
    cannotTake: () =>
      'It is the surface of a pool of water in the bottom of a hill. There is nothing there to ' +
      'take hold of, which you have just established with your hand.',
  },
  {
    /*
     * The reflection. State-aware for the obvious reason: the hero's face is
     * not the same face in the last chapter as in the first.
     */
    id: 'deep.reflection',
    name: 'reflection',
    nouns: ['reflection', 'my reflection', 'my face', 'face in the water'],
    locationId: 'present.deep_chamber',
    initiallyVisible: true,
    description: (state) => {
      if (f(state, FLAGS.lostEye)) {
        return (
          'The water gives you back a shape with a lamp beside it and a strip of linen round ' +
          'its head, and you look at it for about as long as you can manage.\n\nThe linen is ' +
          'grey. The face above it is sixteen and does not look it. You put the lamp down on ' +
          'the rim and the shape does the same thing with its own lamp, slightly out of time, ' +
          'because the water is not quite still.'
        );
      }
      return (
        'Black water, dead flat, with your own head and shoulders in it and the lamp beside ' +
        'them, and the roof a long way behind that.\n\nYou look sixteen, which you are, and ' +
        'pleased with yourself, which you also are. The reflection breaks when you put a ' +
        'finger in and takes a surprisingly long time to come back.'
      );
    },
    cannotTake: () => 'It is a reflection.',
    responses: {
      touch: () => ({
        text:
          'You put a fingertip on it and the whole surface answers, and your own face goes into ' +
          'rings and comes slowly back.',
      }),
      listen: () => ({
        text:
          'Nothing from the water. Everything you can hear is coming down the stair behind you ' +
          'from a hillside in weather, several hundred paces and one hill away.',
      }),
      drink: () => ({
        text:
          'You are not drinking out of the bottom of a cave. You have water, there is a spring ' +
          'on the hill, and whatever this is, it has been standing here a very long time.',
      }),
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
    /*
     * The offerings. Named in the arrival prose, in the room description and in
     * the basin's own description, and absent from the parser until now — the
     * audit's headline example. Two objects rather than one, because the future
     * has a different answer for each: the coins go green and the pin does not
     * survive.
     *
     * Not takeable, deliberately and in character. That also means there is
     * nothing to reconcile with the future basin a hundred years later: what is
     * in the silt stays in the silt, in both centuries.
     */
    id: 'pastdeep.coins',
    name: 'two copper coins',
    nouns: ['coins', 'coin', 'copper coins', 'copper coin', 'two coins', 'money', 'offerings'],
    locationId: 'past.deep_chamber',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'Two of them, in the silt in the corner, a hand\'s width apart. Copper, thin, worn almost ' +
      'blank — the kind that stops being money and starts being something you have in a pocket. ' +
      'One is face up. Somebody put them here on purpose and did not throw them.',
    onExamine: {
      journal: [
        {
          id: 'j.offerings',
          text:
            'Two worn copper coins and a bone pin in the silt at the corner of the basin. Placed, ' +
            'not dropped. People were leaving things here before the stair was finished.',
        },
      ],
    },
    cannotTake: () =>
      'You get two fingers into the water and then stop.\n\nSomebody came down an unfinished ' +
      'stair in the dark to leave these, and whatever they wanted, they wanted it enough. You ' +
      'take your hand back out and dry it on your shirt.',
    responses: {
      touch: () =>
        ({
          text:
            'You turn the face-up one over with a fingertip. There is a head on it, worn to a ' +
            'suggestion of a head. The water is cold enough that your hand aches by the time you ' +
            'have done it.',
        }),
      taste: () => ({ text: 'You are not putting somebody\'s offering in your mouth.' }),
    },
  },
  {
    id: 'pastdeep.pin',
    name: 'bone pin',
    nouns: ['bone pin', 'pin', 'bone'],
    locationId: 'past.deep_chamber',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'A hand\'s length of bone, shaped to a point at one end and a flattened knob at the other, ' +
      'the sort of thing that holds a cloak shut. The water has not been unkind to it yet. There ' +
      'is a line of cross-hatching near the knob where somebody\'s thumb has worn it shallow.',
    cannotTake: () =>
      'It would come up easily, and it is not yours. Somebody unpinned their cloak in the cold ' +
      'to put it there.',
    responses: {
      touch: () => ({
        text:
          'Smooth, and not as cold as the coins. The cross-hatching is just deep enough to feel.',
      }),
    },
  },
  {
    id: 'pastdeep.silt',
    name: 'silt',
    nouns: ['silt', 'sediment', 'bottom', 'corner'],
    locationId: 'past.deep_chamber',
    initiallyVisible: true,
    description: () =>
      'A fine pale dust in the low corner of the basin, thin enough to see the cut stone through. ' +
      'The coins and the pin are lying in it. Nothing else is: it is a cut cistern a month old, ' +
      'not a river.',
    cannotTake: () => 'It is silt. There is no use for a handful of silt.',
    responses: {
      touch: () => ({
        text:
          'It lifts in a slow cloud when you disturb it and takes a while to settle, and while ' +
          'it is up you cannot see the coins at all.',
      }),
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

  {
    id: 'pastdeep.bucket',
    name: 'leather bucket',
    nouns: ['bucket', 'leather bucket', 'pail'],
    locationId: 'past.deep_chamber',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'A bucket of stitched hide with a rope bail, standing in the corner with a finger of ' +
      'water in the bottom of it and a grey tide of stone dust round the inside. It is for ' +
      'wetting a cut, not for carrying a drink.',
    cannotTake: () =>
      'It is theirs, and it is wanted here: you cannot cut stone dry. Carrying it off would be ' +
      'taking a working tool out of a working room.\n\nIf it is water you are thinking about, ' +
      'the problem is at the mouth and it is not a bucket-sized problem.',
    responses: {
      touch: () => ({
        text:
          'The hide is stiff and the stitching is waxed. The dust inside has gone to a paste at ' +
          'the bottom where the water is.',
      }),
      drink: () => ({
        text:
          'A finger of water with a week of limestone in it. You are thirsty, and not that ' +
          'thirsty.',
      }),
      pull: () => ({ text: 'It comes a hand\'s width across the floor and slops. You stop.' }),
    },
  },
  {
    /*
     * The mallet in this room, and the reconciliation the audit asked for.
     *
     * The prose has always described a mallet beside the bucket here, while the
     * *takeable* mallet is a different one in the worksite — so the word
     * resolved only once the player happened to be carrying one, which hid the
     * gap. Rather than add a second portable mallet and a second way to arm
     * the finale, this one is explicitly the crew's, in use, and says so.
     */
    id: 'pastdeep.mallet',
    name: "crew's mallet",
    nouns: ['mallet', 'maul', 'hammer', 'their mallet'],
    locationId: 'past.deep_chamber',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'A mason\'s mallet laid down beside the bucket with its head still tight on the shaft — ' +
      'lignum, scarred all round the face, the handle dark where a hand has been. Somebody put ' +
      'it down there this week meaning to pick it up again.',
    cannotTake: () =>
      'You get a hand on the shaft and then let go.\n\nThere are four men up that stair who ' +
      'will be back down here before the week is out, and this is the tool they are coming back ' +
      'for. There is a basket of them in the workings, and Lovage knows you are down here.',
    responses: {
      touch: () => ({
        text:
          'The head is tight and the face is bright in the middle and dull at the edges, which ' +
          'is what a mallet looks like when it is being used properly.',
      }),
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
    nouns: ['tree', 'great tree', 'leaves', 'branches', 'stump', 'swing', 'rope swing'],
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
    /*
     * Saffra's board, after she writes it.
     *
     * The audit's point: a scripted scene introduces a prop and leaves it in
     * the room, so the room has to be able to answer for it. The text on it is
     * the canonical prophecy and nothing here re-words it; the board is the
     * physical object the words are now on, which is the whole of what the
     * hero has just done to this century.
     */
    id: 'pastsquare.board',
    name: 'offcut of board',
    nouns: [
      'board',
      'offcut',
      'offcut of board',
      'her board',
      'written board',
      'saffra board',
      'words',
      'char',
      'stub of char',
      'charcoal',
    ],
    locationId: 'past.square',
    initiallyVisible: true,
    hiddenWhen: (state) => !f(state, FLAGS.recitedProphecy),
    listAs: c('the board Saffra wrote on, propped in the workshop doorway'),
    verbs: () => ['examine', 'touch'],
    description: () =>
      'An offcut of pale board, propped in the doorway of the shell of the workshop where she ' +
      'left it, with four lines on the back of it in charcoal. Two of them have been gone over ' +
      'twice where the char ran thin.\n\nIt is a clean, careful, slightly square hand, the ' +
      'hand of somebody who does not write often and means it when she does. The stub of char ' +
      'is balanced on the top edge.\n\nThey are your words. You said them about four minutes ' +
      'ago, standing where you are standing, because she asked you to say them twice.',
    onExamine: {
      journal: [
        {
          id: 'j.her_board',
          text:
            'Saffra wrote the four lines on the back of an offcut and left it propped in the ' +
            'workshop doorway. Her hand, my words. She went over two of the lines twice.',
        },
      ],
    },
    cannotTake: () =>
      'You put a hand on the edge of it and take the hand away.\n\nYou could carry it off. ' +
      'There is a version of the next hundred years where there is no plank by the well, and ' +
      'you do not know the first thing about what else that changes, and you are not going to ' +
      'find out by guessing with somebody\'s afternoon.\n\nYou leave it where she put it.',
    responses: {
      touch: () => ({
        text:
          'Sawn board, rough on the back and planed on the front, and the charcoal comes off on ' +
          'your fingers if you touch the letters.\n\nYou wipe your fingers on your shirt and ' +
          'then look at the lines again to check you have not smudged one.',
      }),
      smell: () => ({ text: 'Sawdust, charcoal, and the lime off her hands.' }),
    },
  },
  {
    /*
     * The peg the skins hang from once they are delivered.
     *
     * The skins themselves are the portable item, placed in this room by the
     * delivery — so they already answer here, and taking them back is already
     * possible and already deliberate. What was missing was the peg the kit's
     * description hangs them on.
     */
    id: 'pastentrance.peg',
    name: 'peg',
    nouns: ['peg', 'wooden peg', 'pin in the crack'],
    locationId: 'past.entrance',
    initiallyVisible: true,
    hiddenWhen: (state) => !f(state, FLAGS.carriedWater),
    description: () =>
      'A shaped stub of oak driven into a crack in the rock beside the barrel, at about the ' +
      'height of a man\'s shoulder. It has been there long enough to go grey. Somebody put it ' +
      'in so there would be somewhere to hang a yoke, which tells you the barrel has been ' +
      'broken for a while.',
    cannotTake: () =>
      'It is driven into a crack in a hill and it is holding four skins of water. Leave it.',
    responses: {
      pull: () => ({
        text: 'It does not move. Whoever drove it in was expecting to hang a load on it.',
      }),
      touch: () => ({ text: 'Oak gone grey and furry with damp, and immovable.' }),
    },
  },
  {
    id: 'pastsquare.trowel',
    name: "Saffra's trowel",
    nouns: ['trowel', 'her trowel', 'saffra trowel', 'float'],
    locationId: 'past.square',
    initiallyVisible: true,
    description: () =>
      'A pointing trowel with the blade worn narrow and the handle bound in cloth where the ' +
      'ferrule has gone. She holds it the whole time she is talking to you, and rests it on the ' +
      'course when she wants both hands, and picks it up again without looking.',
    cannotTake: () =>
      '"No," says Saffra, pleasantly, and goes on with what she was saying. She does not even ' +
      'move it out of reach; she simply knows you are not going to.',
    responses: {
      touch: () => ({
        text: 'The handle binding is damp with lime and the blade is bright from use.',
      }),
    },
  },
  {
    id: 'pastsquare.apron',
    name: "Saffra's apron",
    nouns: ['apron', 'her apron', 'saffra apron', 'sleeves'],
    locationId: 'past.square',
    initiallyVisible: true,
    description: () =>
      'Canvas, grey-white with lime to the hem, with her sleeves rolled above the elbow and the ' +
      'dust gone into the creases of her forearms the way it does when a person has been at it ' +
      'since first light. She wipes her hands on it about once a minute without noticing.',
    cannotTake: () => 'It is a woman\'s apron and she is wearing it.',
    responses: {
      touch: () => ({ text: 'You are not doing that.' }),
      smell: () => ({ text: 'Lime, mostly, which is a sharp clean smell and not a pleasant one.' }),
    },
  },
  {
    id: 'pastsquare.mortarboard',
    name: "Fenn's mortar board",
    nouns: ['mortar board', 'mortarboard', 'hawk', 'his board', 'fenn board'],
    locationId: 'past.square',
    initiallyVisible: true,
    description: () =>
      'A square of board with a short handle under it — a hawk, for carrying mortar up to the ' +
      'work — and Fenn is holding it at the wrong angle, so a slow tongue of mortar is making ' +
      'its way towards his wrist and he has not noticed.\n\nIt is not the board she writes on. ' +
      'That one comes later, and out of the workshop.',
    cannotTake: () =>
      'He would give it to you. That is the trouble: he would give it to you instantly and then ' +
      'have nothing to do, and Saffra would be short of mortar.',
    responses: {
      touch: () => ({
        text:
          'Wet mortar, gritty, cold. Fenn watches you do it with enormous interest and then ' +
          'looks at his own hand to see whether he should be doing it too.',
      }),
      smell: () => ({ text: 'Lime and sand and water. It smells like a building going up.' }),
    },
  },
  {
    id: 'pastsquare.scaffold',
    name: 'scaffold plank',
    nouns: ['scaffold', 'scaffold plank', 'standing plank', 'staging', 'trestles'],
    locationId: 'past.square',
    initiallyVisible: true,
    description: () =>
      'One plank on two trestles at about the height of your chest, running along the face of ' +
      'the half-built wall, with a bucket of mortar and a pile of stones on it and Saffra ' +
      'standing on the end of it in her boots.\n\nIt is the plainest possible way of getting a ' +
      'person up to the second course, and it is exactly as safe as it looks.',
    cannotTake: () => 'There is a mason standing on it.',
    responses: {
      sit: () => ({
        text:
          '"Not on the staging," says Saffra, before you have properly started. She does not ' +
          'look round.',
      }),
      touch: () => ({
        text:
          'Springy under the hand, and dusted white. It bounces when she shifts her weight, and ' +
          'she does not appear to notice that either.',
      }),
    },
  },
  {
    id: 'pastsquare.reeds',
    name: 'reed bundles',
    nouns: ['reeds', 'reed bundles', 'bundles', 'thatch', 'cloth', 'covering cloth', 'tarpaulin'],
    locationId: 'past.square',
    initiallyVisible: true,
    description: () =>
      'Bundles of cut reed stacked against the inside of the unfinished wall with a cloth over ' +
      'the top of them and stones on the corners of the cloth. They are for the roof that is ' +
      'not on yet.\n\nIn your own century this building has a roof, and has had one for longer ' +
      'than anybody can remember, and nobody has ever once wondered where the reeds came from.',
    cannotTake: () =>
      'It is somebody\'s roof, in bundles, waiting for the weather to be dependable.',
    responses: {
      touch: () => ({
        text: 'Dry and hollow and faintly squeaking against itself. The cloth over them is damp.',
      }),
      smell: () => ({ text: 'Cut reed, dust, and wet canvas.' }),
      pull: () => ({
        text:
          'You lift the corner of the cloth to see what is under it. Reeds. You put the cloth ' +
          'back and the stone back on top of it.',
      }),
    },
  },
  {
    id: 'pastsquare.well',
    name: 'new well',
    nouns: ['well', 'new well', 'cap', 'windlass', 'rope', 'bucket', 'buckets'],
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
    cannotTake: () =>
      'It is a well, three-quarters dug, and it is the thing this village is building its next ' +
      'hundred years around.',
    responses: {
      /*
       * Why the crew walk to the spring instead, asked and answered — the
       * audit's point, and it keeps the water puzzle honest.
       */
      pull: () =>
        ({
          text:
            'You let the bucket down and bring it up, and it comes up about a third full of ' +
            'water with a grey cast to it and grit in the bottom.\n\nThey are still cutting ' +
            'this well. It is down as far as they have got and no further, and what is in it ' +
            'is what has seeped in. Nobody is carrying that up a hill to drink. There is a ' +
            'spring on the hillside that comes out clean.',
        }),
      drink: () =>
        ({
          text:
            'Grey water with grit in it, out of a well that is not finished. The spring is up ' +
            'the hill and it is better in every way.',
        }),
      touch: () => ({ text: 'New stone, square-cut, and not yet worn anywhere at all.' }),
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
    id: 'sealed.pivot',
    name: 'pivot',
    nouns: ['pivot', 'pivot cut', 'hinge', 'socket in the floor', 'floor cut'],
    locationId: 'present.sealed_chamber',
    initiallyVisible: false,
    description: () =>
      'A socket cut into the floor at the near edge of the slab, round, with a matching one ' +
      'above it in the lintel, so the whole weight of the door turns on two points of stone and ' +
      'nothing else.\n\nThere is a worn arc on the flags where the bottom edge has swept, and ' +
      'the arc is clean. Somebody kept this swept once. Nobody has swept it in four hundred ' +
      'years, and it still moves.',
    cannotTake: () => 'It is a socket cut in a floor.',
    responses: {
      touch: () => ({
        text:
          'Smooth inside, and greasy with the fine stone-flour that a pivot makes out of itself ' +
          'over a long enough time.',
      }),
      pull: () => ({
        text:
          'You lean on the edge of the slab and it turns on the pivot, slowly and evenly, with ' +
          'a sound like a millstone a long way off. Then you let it come back.',
      }),
      listen: () => ({
        text: 'Grinding, very faintly, when you lean on the slab. Stone on stone, and no grit in it.',
      }),
    },
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
    nouns: ['tree', 'great tree', 'shade', 'limb', 'trunk'],
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
    id: 'pastpath.swing',
    name: 'rope swing',
    nouns: ['swing', 'rope swing', 'swing rope', 'seat', 'plank seat', 'knot'],
    locationId: 'past.cave_path',
    initiallyVisible: true,
    verbs: () => ['examine', 'sit', 'touch'],
    description: () =>
      'A length of hemp over the low limb, doubled and spliced, with a plank through a hole in ' +
      'each end for a seat. The bark under the rope is worn pale in a band, which takes years, ' +
      'and the grass below is kicked to bare earth in a crescent, which takes a summer.\n\n' +
      'Somebody\'s children use this. The tree it hangs from is a stump in your own century, and ' +
      'the swing is not anything, and there is a bare patch of earth under where it was.',
    cannotTake: () =>
      'It is spliced over the limb and somebody\'s children are expecting it to be there this ' +
      'evening.',
    responses: {
      sit: () => ({
        text:
          'You sit on it, because it is there, and take two swings and stop.\n\nYou are too ' +
          'heavy for it, and sixteen, and a hundred years from home, and this is somebody ' +
          'else\'s swing in a village where you have no business being.',
      }),
      touch: () => ({
        text: 'Hemp, furred with use, warm on the sunny side. The splice is a good one.',
      }),
      pull: () => ({
        text: 'It takes your weight without complaint. Whoever hung it knew what they were doing.',
      }),
      untie: () => ({ text: 'It is spliced, not knotted. You would need a knife and a reason.' }),
    },
  },
  {
    id: 'pastpath.bark',
    name: 'bark',
    nouns: ['bark', 'carved letter', 'letter', 'initial', 'carving on the tree'],
    locationId: 'past.cave_path',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'Grey and ridged, with the band worn pale where the swing rope goes over the limb — and ' +
      'cut into it at about the height of a child on tiptoe, one letter, done with something ' +
      'blunter than a knife.\n\nIt is an H. There is no second letter and no date. It will ' +
      'still be a single letter when this tree is a stump.',
    cannotTake: () => 'It is bark on a living tree.',
    responses: {
      touch: () => ({
        text:
          'The letter is shallow and the edges of it have healed into rolls, which means it was ' +
          'cut years ago and the tree has been growing round it since.',
      }),
      smell: () => ({ text: 'Bark, and the sap where somebody cut a letter into it.' }),
    },
  },
  {
    id: 'pastpath.chippings',
    name: 'stone chippings',
    nouns: ['chippings', 'chips', 'stone chippings', 'gravel'],
    locationId: 'past.cave_path',
    initiallyVisible: true,
    description: () =>
      'Pale angular chippings trodden into the ruts and scattered along the verge, every one of ' +
      'them with a chisel facet on it. Somebody has been bringing stone down this hill all ' +
      'season, and losing a little of it at every rut.',
    cannotTake: () =>
      'A handful of chippings off a cart track. They would be in your pocket for a hundred ' +
      'years and come out as a handful of chippings.',
    responses: {
      touch: () => ({ text: 'Sharp, dry, and faintly warm from the sun.' }),
    },
  },
  {
    id: 'pastpath.wet',
    name: 'wet patch',
    nouns: ['wet patch', 'patch', 'damp', 'wet ground'],
    locationId: 'past.cave_path',
    initiallyVisible: true,
    hiddenWhen: (state) => !f(state, FLAGS.symptomWeather),
    /*
     * No second flag for drying. Nothing in the game dries it, and inventing a
     * timer to make an authored response more granular would be a simulation
     * where a sentence will do: the patch is described as already going.
     */
    description: () =>
      'A patch of the track as wet as if it had rained on it, about four paces across, with a ' +
      'clean dry edge all the way round. Nothing is dripping onto it. Nothing is running off ' +
      'it, and the edge has already started to pull in on itself as it dries.\n\nIt rained ' +
      'here. It rained on this and on nothing else, and you watched the sky while it did not ' +
      'happen.',
    cannotTake: () => 'It is a wet patch on a track.',
    responses: {
      touch: () => ({
        text:
          'Wet. Ordinary cold rainwater on warm stone, and the dry line at the edge is as clean ' +
          'as a drawn line.',
      }),
      taste: () => ({ text: 'Rain. You wish it had tasted of something.' }),
      smell: () => ({
        text: 'Wet dust, which is the smell of the first rain after a dry fortnight, and it is not.',
      }),
    },
  },
  {
    id: 'pastspring.moss',
    name: 'moss and cup-marks',
    nouns: [
      'moss',
      'cup marks',
      'cupmarks',
      'cup-marks',
      'marks',
      'stone lining',
      'lining',
      'basin stones',
    ],
    locationId: 'past.spring',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'The spring comes out between two stones that somebody set there, and round them the moss ' +
      'grows in a bright ring the exact shape of the splash. Cut into the flat of the upper ' +
      'stone are five or six round hollows the size of a thumb-end — cup-marks, old, smoothed ' +
      'by water.\n\nNobody in your century knows what those are for either. They are older ' +
      'than anything, including this.',
    cannotTake: () => 'They are set stones with a spring coming out between them.',
    responses: {
      touch: () => ({
        text:
          'The moss is cold and sodden. The cup-marks are smooth all the way round their rims, ' +
          'which is a very great deal of water.',
      }),
      smell: () => ({ text: 'Wet moss and cold stone. Nothing else at all.' }),
    },
  },
  {
    id: 'pastspring.spring',
    name: 'spring',
    nouns: ['spring', 'water', 'cleft', 'rock', 'basin', 'runnel'],
    responses: {
      /*
       * The one place in the game with drinkable water in it, and the audit's
       * example of a verb the prose invites. Nothing turns on it: there is no
       * thirst, and this is a sentence rather than a system.
       */
      drink: () => ({
        text:
          'You get down on one elbow and drink straight out of the runnel, which is how ' +
          'everybody drinks here and always has been.\n\nIt is so cold it hurts the back of ' +
          'your jaw, and it tastes of stone, and it is the best thing that has happened to you ' +
          'since you came out of the hill.',
      }),
      touch: () => ({
        text:
          'Cold enough to ache. The rock under the runnel is worn into a shallow smooth channel ' +
          'that is nobody\'s work but the water\'s.',
      }),
      taste: () => ({ text: 'Cold, and faintly of stone. DRINK FROM THE SPRING properly.' }),
      listen: () => ({
        text:
          'Water coming out of a hillside: a small continuous noise with no pattern in it, the ' +
          'only thing on this hill that is exactly the same in your own century.',
      }),
    },
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
    cannotTake: () =>
      'It is water coming out of a hillside. You can fill something from it and you can drink ' +
      'out of it, and that is the whole of what it offers.',
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
    nouns: ['kit', 'gear', 'crew kit', 'crew gear', 'tools', 'stack'],
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
  {
    id: 'pastentrance.groove',
    name: 'handrail groove',
    nouns: ['handrail groove', 'groove', 'handrail', 'worked stair'],
    locationId: 'past.entrance',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'A channel cut into the wall beside the stair at about the height of a hand, running the ' +
      'whole way down out of sight — square at the back and rounded at the lip, so a palm sits ' +
      'in it and does not catch.\n\nThere is no groove in your own century. There is no stair ' +
      'either: there is a crawl and a squeeze and a rope. Somebody spent a winter cutting this ' +
      'and the hill took it back.',
    cannotTake: () => 'It is a channel cut into a wall.',
    responses: {
      touch: () => ({
        text:
          'Your hand fits it exactly, which is not a coincidence — it was cut by somebody ' +
          'putting their own hand in it as they went. The lip is smooth all the way down.',
      }),
    },
  },
  {
    /*
     * The split barrel. The reason the water puzzle exists, named in the kit's
     * description and in Lovage's dialogue, and unaddressable until now — so a
     * player who worked out what was wrong could not look at the thing that
     * was wrong with it.
     */
    id: 'pastentrance.barrel',
    name: 'water barrel',
    nouns: ['barrel', 'water barrel', 'cask', 'split barrel', 'crack'],
    locationId: 'past.entrance',
    initiallyVisible: true,
    acceptsItems: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'On its side with the head knocked out, and a crack running two staves\' width from the ' +
      'chime down towards the belly — not a split you could swell shut, a split where the wood ' +
      'has gone. You could post a letter through it.\n\nThere is a dark tide-mark inside it ' +
      'from when it was useful. It has been dry a while.',
    onExamine: {
      flags: { [FLAGS.knowsWaterNeeded]: true },
    },
    cannotTake: () =>
      'It is a barrel, and a broken one. If you were going to carry water up a hill it would ' +
      'not be in this.',
    responses: {
      touch: () => ({
        text:
          'The staves are dry enough to be light. You can get three fingers into the crack, ' +
          'which tells you everything about whether it will hold water again.',
      }),
      pull: () => ({
        text:
          'You get hold of the chime and roll it a quarter turn, and the crack comes round into ' +
          'the light and looks worse.\n\nA cooper could put a new stave in it in an afternoon. ' +
          'There is no cooper up this hill, which is the whole of the problem.',
      }),
      drink: () => ({
        text:
          'There is nothing in it. That is what is wrong with it, and it is why four men are ' +
          'cutting stone today with nothing to drink.',
      }),
      smell: () => ({
        text: 'Dry oak and old water. It has been out of use longer than a day.',
      }),
    },
  },
  {
    id: 'pastentrance.barrow',
    name: 'barrow',
    nouns: ['barrow', 'wheelbarrow', 'wheel', 'mended wheel', 'barrow wheel'],
    locationId: 'past.entrance',
    initiallyVisible: true,
    description: () =>
      'A plank barrow with sides, parked nose-down against the rock so it does not roll. The ' +
      'wheel has been mended — a new felloe spliced into the rim and pegged, the splice still ' +
      'pale against the rest. Somebody fixed it rather than replacing it, which tells you what ' +
      'a wheel is worth up here.',
    cannotTake: () =>
      'It is a barrow full of somebody else\'s afternoon, and it does not go down a stair.',
    responses: {
      pull: () => ({
        text:
          'You lift the handles and the barrow comes up easily, and the mended wheel turns true. ' +
          'You put it back nose-down where it was.',
      }),
      touch: () => ({
        text: 'The splice in the rim is smooth where the rest of the wheel is not.',
      }),
    },
  },
  {
    id: 'pastentrance.chisels',
    name: 'baskets of broken chisels',
    nouns: [
      'baskets',
      'basket',
      'broken chisels',
      'chisels',
      'chisel',
      'baskets of chisels',
      'blunt chisels',
    ],
    locationId: 'past.entrance',
    initiallyVisible: true,
    description: () =>
      'Two shallow baskets of them, waiting for a smith: edges rolled over, edges chipped out, ' +
      'two shanks bent, one head mushroomed so far it has started to split. A fortnight\'s ' +
      'worth of stone, told in iron.\n\nThese are the dead ones. The ones they are using are ' +
      'inside, under the wall they are cutting.',
    cannotTake: () =>
      'They are broken. That is what the baskets are for — they go down the hill to a smith ' +
      'and come back as chisels. A broken chisel is no use to you and no use to anybody until ' +
      'then.',
    responses: {
      touch: () => ({
        text:
          'You pick one up and put it down. Rolled over flat at the edge, and the head is a ' +
          'grey flower. It has been hit a very great many times.',
      }),
    },
  },
  {
    id: 'pastentrance.line',
    name: 'coil of tarred line',
    nouns: ['line', 'tarred line', 'coil', 'coil of line', 'cord', 'string'],
    locationId: 'past.entrance',
    initiallyVisible: true,
    description: () =>
      'A coil of thin line, black with tar, hung over a stub of rock. Too light to hold a ' +
      'person and too long for anything else — this is a line for snapping chalk and plumbing ' +
      'drops, which is what a stone gang does with string.',
    cannotTake: () =>
      'You get a hand on it and then think about it properly. It is a chalk line, and taking ' +
      'it would stop four men cutting straight. There is nothing in this hill you need string ' +
      'for.',
    responses: {
      touch: () => ({ text: 'Tacky with tar, and stiff where it has been coiled wet.' }),
      smell: () => ({ text: 'Tar, strongly, and a little of the rain on the rock outside.' }),
      pull: () => ({
        text: 'It comes off the stub easily and you put it back. It is somebody\'s working line.',
      }),
      untie: () => ({
        text:
          'There is nothing knotted about it. It is coiled, which is not the same thing, and ' +
          'you coil it back the way you found it.',
      }),
    },
  },
  {
    id: 'pastentrance.bowls',
    name: 'wooden bowls',
    nouns: ['bowls', 'bowl', 'wooden bowls', 'plank', 'row of bowls'],
    locationId: 'past.entrance',
    initiallyVisible: true,
    description: () =>
      'Five of them, turned upside down in a row on a plank set across two stones, so the dust ' +
      'settles on the bottoms and not in the insides. Somebody puts them out like that every ' +
      'morning.\n\nThere is nothing in them. There is nothing to put in them.',
    cannotTake: () =>
      'They are the crew\'s bowls, and they are upside down on a plank because that is where ' +
      'the crew can find them at the end of the shift.',
    responses: {
      touch: () => ({
        text:
          'You turn one over. Dry inside, and scoured pale, with a ring of grease at the rim ' +
          'that no amount of scouring gets out of wood.',
      }),
      drink: () => ({
        text:
          'You turn one over and look into it, and there is nothing in it, which is the point ' +
          'of this entire afternoon.',
      }),
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
    cannotTake: () =>
      'It is a line of chalk on a wall, snapped there this week by somebody who is coming back ' +
      'to work to it.',
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
    /*
     * The trestle. Named four times in the worksite's own prose and in the
     * hint ladder, and it is what the placement action drags and climbs — so a
     * player who types CLIMB TRESTLE or MOVE TRESTLE has been invited to.
     *
     * The automatic use stays: placing the lantern in the high dish still
     * drags and climbs it in one action, because that is one intention. What
     * this adds is that the direct commands are answered instead of denied.
     */
    id: 'worksite.trestle',
    name: 'trestle',
    nouns: ['trestle', 'trestles', 'bench', 'stand', 'frame'],
    locationId: 'past.worksite',
    initiallyVisible: true,
    verbs: () => ['examine', 'sit'],
    description: () =>
      'A folding frame of four legs and a plank, grey with stone dust, with the plank worn pale ' +
      'in two patches where boots have gone. It is as tall as your hip. The third dish is cut ' +
      'at a height nobody standing on the floor could have reached, which tells you the trestle ' +
      'was here before the dish was.',
    cannotTake: () =>
      'It is a crew\'s trestle and it is the only way anybody reaches the top of that panel. ' +
      'Even if you could carry it down a stair that does not exist yet, you would not.',
    responses: {
      sit: () => ({
        text:
          'You sit on it, which is what Lovage\'s boys do, facing the wall with the drawing on ' +
          'it. From here you can see the whole panel at once, and the slate, and the place where ' +
          'the third dish is not.',
      }),
      pull: () => ({
        text:
          'You drag it a foot to the left and then a foot back, because it makes no difference ' +
          'where it stands until you have something to put in a dish.\n\nIt will go wherever ' +
          'it needs to go when it needs to go there.',
      }),
      touch: () => ({
        text: 'Rough, dusty, and solid enough to stand on. It has had a lot of boots.',
      }),
    },
  },
  {
    /*
     * The chisels, and the obvious wrong idea.
     *
     * A player who has worked out that there are two dishes and needs a third
     * will try to cut one. The answer has to be physical — the panel is a
     * flagstone's thickness and the hole in it is the thing they are trying to
     * get through — and must not quietly become an easier route.
     */
    id: 'worksite.chisels',
    name: 'basket of cold chisels',
    nouns: [
      'chisels',
      'chisel',
      'cold chisels',
      'cold chisel',
      'basket of chisels',
      'chisel basket',
      'basket',
    ],
    locationId: 'past.worksite',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'A shallow basket of them under the unfinished wall, a dozen or more, laid with their ' +
      'heads all one way the way a man lays tools he is coming back to. Cold chisels, for ' +
      'stone: square shanks, mushroomed heads, edges in every state from new to nearly done.\n\n' +
      'Two of them are the narrow kind you would use to cut a dish.',
    cannotTake: () =>
      'You get your hand round one of the narrow ones and then put it back.\n\nYou know what ' +
      'you are thinking. There are two dishes and a chalk outline, and a chisel in the outline ' +
      'would make a third — in about four days, by somebody who knows how, into a panel the ' +
      'thickness of a flagstone with a half-cut hole already in it. The panel would go. The ' +
      'hole would go with it.\n\nWhatever you are going to do, it is not going to be with a ' +
      'chisel.',
    responses: {
      touch: () => ({
        text:
          'The heads are mushroomed flat and bright where the maul has been landing on them. ' +
          'These are in use today, not stored.',
      }),
      pull: () => ({
        text: 'The basket slides a hand\'s width on the grit and stops. It is full of iron.',
      }),
    },
  },
  {
    id: 'worksite.nails',
    name: 'four iron nails',
    nouns: ['nails', 'nail', 'iron nails', 'pins'],
    locationId: 'past.worksite',
    initiallyVisible: true,
    description: () =>
      'Four of them, one at each corner, driven into the joints of the finished scales so as ' +
      'not to spoil a face. Somebody cared enough about this drawing to hang it where he could ' +
      'see it from the trestle.',
    cannotTake: () =>
      'Pulling the nails would put the drawing on the floor, and the drawing is the only thing ' +
      'in this hill that explains the dishes. Leave them where they are.',
    responses: {
      pull: () => ({
        text:
          'You get a thumbnail under one head and it does not move at all. They were driven by ' +
          'somebody with a hammer and a reason.',
      }),
      touch: () => ({ text: 'Cold square iron, flush to the stone.' }),
    },
  },
  {
    id: 'worksite.ledge',
    name: 'ledge',
    nouns: ['ledge', 'shelf', 'lamps', 'spare lamps'],
    locationId: 'past.worksite',
    initiallyVisible: true,
    description: (state) =>
      'A course of stone left proud of the wall at shoulder height, doing the job a shelf does. ' +
      'On it: ' +
      (state.inventory.includes('lantern')
        ? 'four hooded lamps of the same pattern as your own'
        : 'three hooded lamps of the same pattern as your own, and a space where a fourth was') +
      ', and a flask of oil with a rag stopper, and a tin of something that is probably tallow.' +
      '\n\nA gang working inside a hill keeps spare light where it can find it in the dark.',
    cannotTake: () =>
      'The ledge is a course of the wall. The things standing on it are the crew\'s, and you ' +
      'are not short of light.',
    responses: {
      touch: () => ({
        text: 'Gritty, and greasy at the near end where the flask has been standing.',
      }),
      smell: () => ({
        text:
          'Oil, mostly, and under it the burnt-wick smell of lamps that have been lit and put ' +
          'out a great many times in a small room.',
      }),
      drink: () => ({ text: 'It is lamp oil.' }),
    },
  },
  {
    /*
     * The flask. `examine oil` used to return the description of the exit back
     * to the basin chamber, because `oil` was a substring of `spoil` — the
     * audit's verified resolver defect. The matcher no longer guesses; this is
     * the other half of the fix, which is that the noun now has something to
     * find.
     */
    id: 'worksite.oil',
    name: 'flask of oil',
    nouns: ['flask', 'flask of oil', 'oil', 'lamp oil', 'tallow', 'tin'],
    locationId: 'past.worksite',
    initiallyVisible: true,
    description: () =>
      'A squat clay flask with a rag pushed into the neck, standing in its own small ring of ' +
      'grease on the ledge, and a tin beside it of something paler and stiffer. Lamp oil and ' +
      'tallow: the two things a man underground is most afraid of running out of.',
    cannotTake: () =>
      'Your own lamp is full, and it will outlast anything you are going to do today. Taking a ' +
      'working gang\'s oil down a hole with you is how people end up in the dark.',
    responses: {
      smell: () => ({
        text: 'Rancid, faintly, the way lamp oil goes when it has been standing a season.',
      }),
      drink: () => ({ text: 'No.' }),
      touch: () => ({
        text: 'The flask is cold and the grease ring under it is not. Somebody filled a lamp recently.',
      }),
      pull: () => ({
        text:
          'You work the rag stopper loose a little and push it back in. There is plenty in ' +
          'there, and none of it is a problem you have.',
      }),
    },
  },
  {
    id: 'worksite.scales',
    name: 'patterned walls',
    nouns: [
      'patterned walls',
      'scales',
      'scale pattern',
      'pattern',
      'carving',
      'overlapping scales',
      'finished wall',
      'unfinished wall',
    ],
    locationId: 'past.worksite',
    initiallyVisible: true,
    description: () =>
      'Overlapping scales, cut in rows, each one a shallow dish of stone a hand across with its ' +
      'lower edge standing proud. Two walls are finished and one is chalked out and barely ' +
      'begun, so you can see the whole method at once: scribe the row, sink the field, undercut ' +
      'the lip.\n\nYou have run your hand over the finished version of this your whole life, ' +
      'in a room four hundred paces and a hundred years from here, and nobody at home knows why ' +
      'it is there either. It is decoration. It is extremely good decoration.',
    cannotTake: () => 'They are walls.',
    responses: {
      touch: () => ({
        text:
          'Sharp. The undercut lip catches your fingertip on the way down and not on the way ' +
          'up, exactly as it does at home, except that at home it is worn and here it is new.',
      }),
      knock: () => ({
        text:
          'The finished wall is a hill and sounds like one. The chalked-out wall sounds like a ' +
          'hill as well. The thinned panel is the only thing in this room that answers.',
      }),
    },
  },
  {
    /*
     * The worksite's own chalk line. A separate one exists in the basin
     * chamber; the audit flagged that this room's prose and the rupture scene
     * both mention a line here that no noun reached.
     */
    id: 'worksite.chalkline',
    name: 'chalk line',
    nouns: ['chalk line', 'chalkline', 'line', 'snapped line', 'second line', 'chalk'],
    locationId: 'past.worksite',
    initiallyVisible: true,
    description: (state) =>
      f(state, FLAGS.symptomMark)
        ? 'A line snapped in blue chalk across the floor, square to the panel — and a hand\'s ' +
          'width off it, fainter, a second line in the same hand.\n\nOne of them is where it ' +
          'was put. You have been looking at it for a while now and you cannot make the two of ' +
          'them agree, and neither, you suspect, could the man who snapped it.'
        : 'A line snapped in blue chalk across the floor, square to the panel, with a nail ' +
          'tapped in at each end to hold the string. It is how you keep a cut honest.',
    cannotTake: () => 'It is chalk on a floor.',
    responses: {
      touch: () => ({
        text:
          'Blue chalk comes off on your fingertip. You wipe it on your shirt, where it joins ' +
          'the rest of the day.',
      }),
    },
  },
  {
    id: 'worksite.waste',
    name: 'cut waste',
    nouns: ['waste', 'waste rock', 'rubble', 'chippings', 'cut waste', 'broken stone'],
    locationId: 'past.worksite',
    initiallyVisible: true,
    description: () =>
      'The stone that used to be the hole: a low spread of it under the half-cut aperture, ' +
      'angular, pale, with chisel facets on every piece. Nobody has carried it out yet. There ' +
      'is no reason to until the hole is finished.',
    cannotTake: () =>
      'A handful of broken limestone. You have no use for it and it has no use for you.',
    responses: {
      touch: () => ({
        text: 'Sharp edges and a fine grey dust that gets into the creases of your palm.',
      }),
      pull: () => ({
        text:
          'You clear a little of it away from the foot of the panel with the side of your boot, ' +
          'which makes the hole no bigger and the floor no tidier.',
      }),
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
    /*
     * The same offerings, a hundred years on. The era-specific half of the
     * audit's first finding: the coins are described again in this room, so
     * they have to answer here too — and differently, because copper goes green
     * and bone does not last.
     */
    id: 'futuredeep.coins',
    name: 'green coins',
    nouns: [
      'coins',
      'coin',
      'copper coins',
      'green coins',
      'two coins',
      'money',
      'offerings',
    ],
    locationId: 'future.deep_chamber',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'Two coins in the dry corner of the basin, a hand\'s width apart, gone the flat green of a ' +
      'leaf all over. The copper underneath has swollen as it turned, so they sit proud of the ' +
      'stone now instead of in it. One of them is face up.\n\nYou know which one.',
    onExamine: {
      journal: [
        {
          id: 'j.future_offerings',
          text:
            'The two coins are still in the corner of the dry basin, gone green and swollen. The ' +
            'bone pin is a brown stain in the shape of a pin. Nobody has been down here to tidy ' +
            'in a hundred years.',
        },
      ],
    },
    cannotTake: () =>
      'You could lift them out with a fingernail now, and there is nobody left to mind.\n\nYou ' +
      'leave them where they are. Somebody came down a dark stair to put them there and that is ' +
      'still true, whatever has happened since.',
    responses: {
      touch: () => ({
        text:
          'The green comes off on your fingertip like chalk. Underneath it the metal is pitted ' +
          'and soft, and the coin does not want to come away from the stone.',
      }),
    },
  },
  {
    id: 'futuredeep.pin',
    name: 'stain where the pin was',
    nouns: ['bone pin', 'pin', 'bone', 'stain', 'remnant'],
    locationId: 'future.deep_chamber',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'A brown mark on the pale stone, a hand long, pointed at one end and swollen at the other. ' +
      'Bone does not last in and out of water for a century; the shape of it did.',
    cannotTake: () =>
      'There is nothing to pick up. The pin is the mark, now, and the mark is part of the stone.',
    responses: {
      touch: () => ({
        text: 'Dry stone, and no edge to it at all. Your thumb does not lift any of the colour.',
      }),
    },
  },
  {
    id: 'futuredeep.stair',
    name: 'blocked stair',
    nouns: ['stair', 'stairs', 'steps', 'blocked stair', 'fall', 'rubble', 'handrail groove'],
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
    cannotTake: () => 'It is the sky.',
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
    id: 'futuredeep.slab',
    name: 'fallen roof slab',
    nouns: ['slab', 'fallen slab', 'roof slab', 'fallen roof', 'crust', 'mineral crust', 'dust'],
    locationId: 'future.deep_chamber',
    initiallyVisible: true,
    description: () =>
      'A third of the roof, on the floor, in one piece — a slab you could lie down on with room ' +
      'to spare, tilted against the basin rim where it came to rest.\n\nThere is a crust of ' +
      'pale mineral over everything down here, over the slab and the basin and the floor alike, ' +
      'which is what a century of wet and then dry does to cut limestone. It crunches.',
    cannotTake: () =>
      'It is a third of a ceiling. A gang with bars could move it in a day; you have one eye ' +
      'and an afternoon.',
    responses: {
      touch: () => ({
        text:
          'The crust comes off under your palm in a fine white meal, and underneath it the stone ' +
          'is the same stone you walked on three days ago.',
      }),
      pull: () => ({ text: 'It does not move, and it was never going to.' }),
      knock: () => ({
        text:
          'You rap it with a knuckle and it answers dead, which means it is bedded on the floor ' +
          'and not bridging anything. There is nothing under it.',
      }),
      sit: () => ({
        text:
          'You sit down on the fallen roof of a room you were standing in three days ago, and ' +
          'it is exactly the right height to sit on, and that is somehow the worst detail yet.',
      }),
    },
  },
  {
    /*
     * Seen from the hillside, not reached: the tear is an exit from down there
     * and a thing on a hill from up here. Rule six.
     */
    id: 'futurepath.tear',
    name: 'tear in the hillside',
    nouns: ['tear', 'fissure', 'crack in the hill', 'split', 'gash'],
    locationId: 'future.cave_path',
    initiallyVisible: true,
    description: () =>
      'Below you and to the left, the hill has opened: a long ragged tear running down the face ' +
      'of the slope with grass growing right up to both lips of it, and daylight going a little ' +
      'way into the dark of it and then stopping.\n\nYou came out through that. From up here ' +
      'it is a crack in a hillside that nobody has been down, and the grass on the edges says ' +
      'nobody ever will.',
    cannotTake: () => 'It is a hole in a hill.',
    responses: {
      touch: () => ({
        text:
          'You go to the lip and put a hand on the edge of it. Cold air coming up, and a smell ' +
          'of wet stone, and the grass grows right to the brink as though nothing in the valley ' +
          'minds.',
      }),
      listen: () => ({
        text: 'Air moving in it, and nothing else. No water. The hill is drier than it was.',
      }),
    },
  },
  {
    id: 'futurepath.water',
    name: 'distant water',
    nouns: ['distant water', 'shoreline', 'lake', 'flood', 'water in the valley'],
    locationId: 'future.cave_path',
    initiallyVisible: true,
    description: () =>
      'Away down the valley floor, past where the ford was, a wide flat sheet of standing water ' +
      'with a pale rim round it where it has been wider and gone back. Nothing is growing at ' +
      'the rim.\n\nThe ford is under it. The track to the ford is under it. You have crossed ' +
      'that ford on somebody\'s shoulders.',
    cannotTake: () => 'It is a day\'s walk away and it is a lake.',
    responses: {
      touch: () => ({ text: 'It is most of an hour down the hill. You can look at it from here.' }),
      drink: () => ({
        text:
          'From here? It is a long way off, and there is a pale dead rim round it, and these ' +
          'people are pumping their water out of a sealed well a hundred paces from it.\n\n' +
          'Whatever is wrong with that water, they know and you do not.',
      }),
    },
  },
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
    cannotTake: () =>
      'It is a wall, built into the mouth of the cave by people who meant it to stay. Taking ' +
      'it is not the word for what you are going to have to do to it.',
  },
  {
    /*
     * The props the treatment scene introduces.
     *
     * The audit's rule seven: a cutscene that leaves water, a cloth and a
     * bucket in the room has to make them addressable or remove them. These
     * are addressable, and the prose is explicit that the dressing is already
     * on and the bowl is already going — so no bandage is invented that was
     * never applied.
     */
    id: 'futureentrance.dressing',
    name: 'water and cloth',
    nouns: [
      'water',
      'cloth',
      'bowl',
      'linen',
      'bandage',
      'dressing',
      'strip of linen',
      'older woman',
    ],
    locationId: 'future.entrance',
    initiallyVisible: true,
    hiddenWhen: (state) => !f(state, FLAGS.lostEye),
    description: () =>
      'A shallow bowl of water with a pink cast to it, and a folded cloth beside it, and the ' +
      'grey-haired woman already packing both into a basket because the job is done.\n\nThe ' +
      'dressing is on. It goes round your head twice and over the socket once, and she tied it ' +
      'at the back where you cannot reach it, which was deliberate.',
    cannotTake: () =>
      'She takes the bowl out of your reach without appearing to notice she has done it, and ' +
      'goes on packing.\n\n"It is on," she says, of the dressing. "Leave it on."',
    responses: {
      touch: () => ({
        text:
          'You put a hand up to the linen and she says "don\'t" from four feet away without ' +
          'looking round, and you put your hand down.',
      }),
      drink: () => ({
        text:
          'It is the water she has just washed your face with. She watches you work that out ' +
          'and says nothing, which is how you know she is good at this.',
      }),
      untie: () => ({
        text:
          'She tied it at the back of your head on purpose. You can get a finger to the knot ' +
          'and no further, and she is still in the room.',
      }),
      smell: () => ({ text: 'Clean water and something bitter in it that she put there.' }),
    },
  },
  {
    id: 'futureentrance.bucket',
    name: "the man's bucket",
    nouns: ['his bucket', 'the bucket', 'bucket', 'pail'],
    locationId: 'future.entrance',
    initiallyVisible: true,
    hiddenWhen: (state) => !f(state, FLAGS.namedWanderer),
    description: () =>
      'He put it down when he saw your face and has not picked it up again. It is standing ' +
      'between the two of you on the track, a quarter full, with the water going still.\n\n' +
      'He has gone backwards three steps and said a word, and the bucket is where it was.',
    cannotTake: () =>
      'He is four paces away watching you, and the one thing you could do that would be worse ' +
      'than standing here is picking up his bucket.',
    responses: {
      touch: () => ({ text: 'You do not go near it, and neither does he.' }),
      drink: () => ({
        text:
          'You are not drinking out of the bucket of a man who has just backed away from you ' +
          'saying a word off a plank.',
      }),
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
    cannotTake: () =>
      'It is scratched into the stone. You could not take it if you wanted to, and you do not ' +
      'want to — it is the only thing in this century that was left for you on purpose.',
  },

  /* ================================================================ *
   * future.sealed_chamber
   * ================================================================ */
  {
    id: 'futureentrance.sorrelkit',
    name: "Sorrel's tally and knife",
    nouns: [
      'her tally',
      'sorrel tally',
      'tally stick',
      'knife',
      'her knife',
      'coat',
      'her coat',
      'her boots',
    ],
    locationId: 'future.entrance',
    initiallyVisible: true,
    description: () =>
      'A flat tally stick and a short knife, both on the stone beside her where she has put them ' +
      'down to talk to you, and her coat folded under her instead of on her, and her boots off ' +
      'and standing side by side.\n\nThe knife is for cutting the tally. The blade is a hand ' +
      'long and has been sharpened so many times that the back of it is thicker than the front.',
    cannotTake: () =>
      'She stops talking and looks at the knife, and then at you, and does not say anything at ' +
      'all — which is worse than if she had.\n\nYou take your hand back. There is nothing you ' +
      'need a knife for that is any business of hers.',
    responses: {
      touch: () => ({
        text:
          'She watches you pick the tally stick up and turn it over and put it back, and says ' +
          '"that is this month" and nothing else.',
      }),
    },
  },
  {
    /*
     * After the seal is opened: the stones that came down, and the stone that
     * found the hero's eye. The audit asked for this to be addressable or
     * explicitly accounted for, so it is both.
     */
    id: 'futureentrance.rubble',
    name: 'fallen seal stones',
    nouns: [
      'fallen stones',
      'seal stones',
      'rubble',
      'lintel rubble',
      'course',
      'loose course',
      'inscription',
      'buried inscription',
      'the stone that hit me',
    ],
    locationId: 'future.entrance',
    initiallyVisible: true,
    hiddenWhen: (state) => !f(state, FLAGS.sealOpened),
    description: (state) =>
      'The third course and most of two above it, down in a heap across the threshold: dressed ' +
      'blocks, a hundred years of lime dust, and the lintel stone itself face-down with the ' +
      'letters underneath it where nobody will read them again without a gang and a day.\n\n' +
      (f(state, FLAGS.lostEye)
        ? 'Somewhere in that heap is the one that found you. There is no way of telling which, ' +
          'and you have been standing here for a while not looking for it.'
        : 'It came down more or less where you were standing, which you will think about later.'),
    cannotTake: () =>
      'Dressed blocks, the lightest of them two hands thick. You have already moved as much of ' +
      'this hill as you are going to move today.',
    responses: {
      touch: () => ({
        text:
          'Lime dust, cold stone, and sharp broken edges where the courses have parted. It is ' +
          'all shifting very slightly as it settles.',
      }),
      pull: () => ({
        text:
          'You get a hand to one of the smaller blocks and work it a thumb\'s width before the ' +
          'whole heap grumbles and you take your hand out.\n\nThe way in is open. The way in ' +
          'is enough.',
      }),
    },
  },
  {
    id: 'futuresealed.scales',
    name: 'patterned wall',
    nouns: ['patterned wall', 'scales', 'pattern', 'wall', 'walls', 'carving'],
    locationId: 'future.sealed_chamber',
    initiallyVisible: true,
    description: () =>
      'The same overlapping scales, and most of them still on the wall — but the room has moved ' +
      'since they were cut. A crack runs up through four rows of them from the floor, and along ' +
      'the top course the lips have broken off in a line where something settled.\n\nYou ran ' +
      'your hand along these on the way in. On the way in they were perfect.',
    cannotTake: () => 'It is the wall.',
    responses: {
      touch: () => ({
        text:
          'Sharp where they are whole and crumbling where they are not, and the whole surface is ' +
          'furred with the pale crust that is on everything down here.',
      }),
      knock: () => ({
        text:
          'It sounds like a hill with a crack in it, which is what it is. Nothing in this room ' +
          'answers the way the panel in the workings answered.',
      }),
    },
  },
  {
    id: 'futuresealed.positions',
    name: 'low and high dishes',
    nouns: ['low dish', 'high dish', 'lamp positions', 'positions', 'filled dishes', 'other dishes'],
    locationId: 'future.sealed_chamber',
    initiallyVisible: true,
    hiddenWhen: (state) => !f(state, FLAGS.fillCleared),
    description: () =>
      'Two of the three, and both of them filled: lime mortar packed into each socket flush with ' +
      'the panel face and smoothed off, gone the colour of the stone and hard as the stone, with ' +
      'a hair of a line round each one where the fill meets the cut.\n\nWhoever sealed this ' +
      'room filled two and left the middle. They knew what the three of them were for, and they ' +
      'were not guessing, and that is as much as this room is ever going to tell you about them.',
    cannotTake: () => 'They are holes in a wall, and they are full.',
    responses: {
      touch: () => ({
        text:
          'Hard, and cold, and flush. You can just feel the join with a fingertip and you cannot ' +
          'get a nail into it.',
      }),
      pull: () => ({
        text:
          'You go at the edge of the low one with the point of the mallet and get a smear of ' +
          'lime dust for it.\n\nThis is not a job for one tired person in an afternoon, and ' +
          'you do not want it done. You want the middle one, and the middle one is open.',
      }),
      knock: () => ({
        text: 'Both of them sound solid, and the open middle one sounds like a hole. So they are full.',
      }),
    },
  },
  {
    id: 'futuresealed.debris',
    name: 'broken fill',
    nouns: ['broken fill', 'debris', 'mortar pieces', 'lime', 'hair', 'stone dust', 'mortar'],
    locationId: 'future.sealed_chamber',
    initiallyVisible: true,
    hiddenWhen: (state) => !f(state, FLAGS.fillCleared),
    description: () =>
      'What came out of the middle dish, in a heap at your feet: broken lime mortar in plates ' +
      'and crumbs, with the shape of the socket still readable on the back of the biggest piece.' +
      '\n\nThere is hair in it. Animal hair, chopped short and mixed through the lime to bind ' +
      'it, the way a plasterer does — and a great deal of stone dust, which is what they had ' +
      'instead of sand. Somebody mixed this properly. Somebody who was not in a hurry sealed ' +
      'this hole on purpose and did a good job of it.',
    cannotTake: () =>
      'A double handful of broken mortar. You have carried enough up and down this hill.',
    responses: {
      touch: () => ({
        text:
          'It crumbles further. The hair in it comes away between your fingers in short dark ' +
          'threads, perfectly preserved, from an animal that has been dead a hundred years.',
      }),
      smell: () => ({ text: 'Lime, and cold dust, and very faintly something that was once an animal.' }),
    },
  },
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
    cannotTake: () =>
      'It is in pieces, and the pieces are holding each other up, and above them is a great ' +
      'deal of hill that has already moved once.',
  },

  /* ================================================================ *
   * future.square
   * ================================================================ */
  {
    id: 'futuresquare.oilcloth',
    name: 'oilcloth',
    nouns: ['oilcloth', 'cloth', 'cover', 'weighting stones', 'corner stones'],
    locationId: 'future.square',
    initiallyVisible: true,
    description: () =>
      'A square of waxed cloth over the chest, gone stiff and pale at the folds, with a smooth ' +
      'stone on each corner to keep the wind off it. The stones are river stones, which is ' +
      'interesting, because there is no river.\n\nSomebody re-waxes this. You can see where ' +
      'the last coat went on unevenly.',
    cannotTake: () =>
      'Rue has her shoulders against that chest and the cloth is what keeps a hundred years of ' +
      'writing dry. Ask her, if you are going to.',
    responses: {
      pull: () => ({
        text:
          'Rue puts one hand flat on the cloth without getting up and without looking round, ' +
          'and that is the end of that.',
      }),
      touch: () => ({
        text: 'Waxed canvas, cold and slightly tacky, and the corner stones are river-smooth.',
      }),
    },
  },
  {
    id: 'futuresquare.recordkit',
    name: 'boards and slates in the chest',
    nouns: [
      'boards',
      'slates',
      'slate',
      'winter tally',
      'tally of winters',
    ],
    locationId: 'future.square',
    initiallyVisible: true,
    description: () =>
      'What they have kept, seen past her shoulder with the cloth back: boards written on in ' +
      'charcoal and gone over in charcoal again, slates with the writing half rubbed away and ' +
      'rewritten higher up, and a strip of wood notched once for every winter ' +
      'with the notches getting shallower towards the near end.\n\nIt is a hundred years of ' +
      'people deciding what was worth the slate.',
    cannotTake: () =>
      '"Not those," says Rue, and she is not unfriendly about it, and she does not move. "You ' +
      'can have the roll. You can look at the roll. The rest of it stays in the box."',
    responses: {
      touch: () => ({
        text:
          'She lets you put a hand on the edge of the nearest board and takes the lid out of ' +
          'your other hand while you are doing it.',
      }),
    },
  },
  {
    id: 'futuresquare.ruethings',
    name: "Rue's blanket and slate",
    nouns: [
      'blanket',
      'her blanket',
      'rue blanket',
      'her slate',
      'rue slate',
      'writing nail',
      'nail',
    ],
    locationId: 'future.square',
    initiallyVisible: true,
    description: () =>
      'She has a blanket round her shoulders that was a good one and has been darned by somebody ' +
      'who was not in a hurry, and across her knees a slate with a nail tied to it on a length ' +
      'of thread. She writes on the slate with the nail, in a small fast hand, and rubs it out ' +
      'with the heel of her palm.\n\nShe is keeping the roll up to date. Today she will have ' +
      'something to put on it.',
    cannotTake: () =>
      'It is her blanket and her slate, and she is sitting under one and writing on the other.',
    responses: {
      touch: () => ({ text: 'You keep your hands to yourself. She is an old woman in a cold square.' }),
    },
  },
  {
    /*
     * The keepsake tray. Only in the branch where the player carried Parsie's
     * pebble a hundred years, which is why delivery is never assumed: this
     * exists when that happened and does not when it did not.
     */
    id: 'futuresquare.tray',
    name: 'tray of keepsakes',
    nouns: [
      'tray',
      'keepsakes',
      'shallow tray',
      'button',
      'copper button',
      'teeth',
      'tooth',
      'bead',
      'pebble in the tray',
      'grey pebble',
    ],
    locationId: 'future.square',
    initiallyVisible: true,
    hiddenWhen: (state) => !f(state, FLAGS.gaveStone),
    verbs: () => ['examine', 'touch'],
    description: () =>
      'A shallow wooden tray of things too small to be anything but kept: a copper button gone ' +
      'green, two teeth, a blue glass bead with the hole worn oval.\n\nAnd a grey pebble with ' +
      'a pale band through it, with a label beside it in a hand that has been copied and ' +
      'recopied until the letters have gone square: *from past the names, given*.\n\nYou gave ' +
      'that to a boy of eleven about three days ago. It has been in this box for a hundred ' +
      'years, and somebody has recopied the label, which means somebody thought it mattered ' +
      'enough to do that more than once.',
    onExamine: {
      journal: [
        {
          id: 'j.keepsakes',
          text:
            'The record chest has a tray of keepsakes in it. Parsie\'s pebble is in the tray, ' +
            'labelled "from past the names, given", in a hand that has been recopied.',
        },
      ],
    },
    cannotTake: () =>
      'These are the things thirty people have decided to keep, in a century when almost ' +
      'nothing was kept.\n\nAnd one of them is yours, in a sense that does not survive being ' +
      'said out loud. You put the lid of the tray back where it was.',
    responses: {
      touch: () => ({
        text:
          'You put a fingertip on the pebble and take it off again straight away. It is a stone. ' +
          'It is exactly as warm as the tray.',
      }),
    },
  },
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
    nouns: ['well', 'cap', 'capped well', 'slab'],
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
    nouns: ['shell', 'workshop', 'roofless shell', 'ruin'],
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
    nouns: ['chest', 'record chest', 'box', 'records'],
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
    id: 'futuresquare.pump',
    name: 'hand pump',
    nouns: ['pump', 'hand pump', 'handle', 'pump handle', 'spout'],
    locationId: 'future.square',
    initiallyVisible: true,
    verbs: () => ['examine', 'pull', 'touch'],
    description: () =>
      'Iron, bolted through the slab that caps the well, with a lead spout and a handle polished ' +
      'bright on the underside by a great many hands. It is the only machine in the village and ' +
      'it is maintained like one.\n\nThere is a tally stick on a nail beside it.',
    cannotTake: () =>
      'It is bolted through a stone cap and it is where thirty people get their water. There is ' +
      'no conceivable version of today in which you take it.',
    responses: {
      pull: () => ({
        text:
          'You take the handle and give it two strokes before you think better of it. It is ' +
          'stiff on the up-stroke and the water comes with a knock and a gasp, and about a cup ' +
          'of it goes onto the stone and runs away.\n\nA woman twenty paces off watches you do ' +
          'it and says nothing at all, and you stop. There is a stick on a nail here with marks ' +
          'on it, and you have just made one of them wrong.',
      }),
      drink: () => ({
        text:
          'You could work the handle and put your mouth under the spout. It would be a cup of ' +
          'somebody\'s ration, counted on a stick, in a village of thirty people who have ' +
          'worked out exactly how much there is.\n\nYou are thirsty. You leave it.',
      }),
      touch: () => ({
        text: 'Cold iron, and the underside of the handle is worn to a shine.',
      }),
      listen: () => ({
        text:
          'A slow knock somewhere down in the shaft, a long way down, which is the sound of a ' +
          'well that is nearly deep enough.',
      }),
    },
  },
  {
    id: 'futuresquare.tally',
    name: 'tally stick',
    nouns: ['tally', 'tally stick', 'stick', 'ration stick', 'marks on the stick'],
    locationId: 'future.square',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'A flat stick of pale wood hung on a nail beside the pump, cut across with short notches ' +
      'in groups, and a longer notch every seventh group. Somebody adds to it and somebody else ' +
      'checks it.\n\nYou can read it in about four seconds, and what it says is that these ' +
      'people know precisely how much water there is and precisely how fast it is going.',
    cannotTake: () =>
      'It is the water ration for thirty people, on a stick, on a nail. Taking it would be ' +
      'about the worst single thing you could do in this square.',
    responses: {
      touch: () => ({
        text:
          'The notches are cut sharp and recut where the wood has furred. It has been in use a ' +
          'long time.',
      }),
      pull: () => ({
        text:
          'It lifts off the nail easily and you put it straight back, the same way round. The ' +
          'nail has a bright ring worn round it.',
      }),
    },
  },
  {
    id: 'futuresquare.buckets',
    name: 'buckets',
    nouns: ['buckets', 'bucket', 'villagers buckets', 'pails'],
    locationId: 'future.square',
    initiallyVisible: true,
    description: () =>
      'Four of them in a row by the pump, each a different shape and two of them patched, and ' +
      'none of them matching anything else in the village. People bring their own and stand in ' +
      'the order they arrived in, and nobody is talking while they wait.',
    cannotTake: () =>
      'Every one of them belongs to somebody who is standing in this square waiting their turn ' +
      'with it.',
    responses: {
      touch: () => ({
        text: 'Wet handles, and a patch on one of them that is a strip of hammered tin.',
      }),
    },
  },
  {
    id: 'futuresquare.sealant',
    name: 'tarry sealant',
    nouns: ['sealant', 'tar', 'tarry sealant', 'pitch', 'black stuff', 'seal round the cap'],
    locationId: 'future.square',
    initiallyVisible: true,
    description: () =>
      'A thick black bead run all the way round the joint between the slab and the well mouth, ' +
      'gone matte and crazed on the surface, patched in two places with a darker, newer black.' +
      '\n\nSomebody sealed this well shut and then somebody else has kept the seal up. There ' +
      'is no version of that which is not frightening.',
    cannotTake: () => 'It is set hard into the joint it is sealing.',
    responses: {
      touch: () => ({
        text:
          'Hard, slightly tacky in the sun, and it gives very faintly under a thumbnail. The ' +
          'patches are softer than the rest.',
      }),
      smell: () => ({ text: 'Pitch, faintly, and warm stone.' }),
      pull: () => ({
        text:
          'You get a fingernail to the edge of one of the patches and stop, with a clarity you ' +
          'do not often manage: whatever is being kept out of that water, these people have ' +
          'decided it stays out.',
      }),
    },
  },
  {
    id: 'futuresquare.shed',
    name: 'long shed',
    nouns: ['shed', 'long shed', 'communal shed', 'bakehouse', 'hall', 'cart side', 'door wall'],
    locationId: 'future.square',
    initiallyVisible: true,
    description: () =>
      'The bakehouse, or what the bakehouse has become: the oven end is still standing and the ' +
      'rest of it has been roofed over long and low with whatever there was. One whole wall is ' +
      'the side of a cart. Another stretch is a door, lying on its side, with the latch still ' +
      'on it.\n\nPeople live in there now. Several of them. You can hear it.',
    cannotTake: () =>
      'It is somebody\'s wall, and behind it is somebody\'s home, and the fact that it used to ' +
      'be a cart does not change either of those.',
    responses: {
      knock: () => ({
        text:
          'You get as far as lifting your hand and then do not. You are a stranger with one eye ' +
          'and a mason\'s mallet, and there are children in there.',
      }),
      touch: () => ({
        text:
          'The cart side still has paint on it in the sheltered part, a red that nobody in this ' +
          'village is making any more.',
      }),
      listen: () => ({
        text:
          'Somebody inside, moving about, and a child saying the same word four times and ' +
          'getting no answer.',
      }),
      smell: () => ({ text: 'Smoke, and people, and no bread at all.' }),
    },
  },
  {
    id: 'futuresquare.goats',
    name: 'goats',
    nouns: ['goats', 'goat', 'straw', 'trough', 'feed trough', 'nanny'],
    locationId: 'future.square',
    initiallyVisible: true,
    verbs: () => ['examine', 'touch'],
    description: () =>
      'Two of them, in the roofless shell of what was the workshop, with a trough made out of a ' +
      'door laid on its edge and a handful of poor straw in it. One is a nanny with a rope ' +
      'collar and the other is this year\'s and has not been told about anything yet.\n\nThey ' +
      'are standing where the bench was. You could put your hand on the spot.',
    cannotTake: () => 'They are the village\'s goats and they are two of the village\'s assets.',
    responses: {
      touch: () => ({
        text:
          'The nanny lets you, and leans into it, and goes on chewing. The young one comes over ' +
          'to find out whether you are food and then loses interest.\n\nIt is the first warm ' +
          'living thing you have touched in a hundred years.',
      }),
      smell: () => ({ text: 'Goat. Exactly and entirely goat, which is oddly a relief.' }),
      listen: () => ({
        text: 'Chewing, and the rope collar creaking, and a bell that is not on either of them.',
      }),
      eat: () => ({ text: 'No.' }),
      pull: () => ({
        text:
          'You take hold of the nanny\'s collar and she looks at you until you let go of it. ' +
          'She has met people before.',
      }),
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
    /*
     * The return chapter's own furniture.
     *
     * The opening-era shutter, alcove, eye, wall and passage are all hidden in
     * this chapter, on purpose: their descriptions read the player's own
     * placement flags, and on the return the wedge under that shutter and the
     * lamp in that alcove belong to somebody else. The audit found the
     * consequence — the room describes all of it in prose and none of the
     * nouns answered. These are the return's versions, which read the scene
     * instead of the old flags.
     */
    id: 'returnsealed.shutter',
    name: 'stone shutter',
    nouns: ['shutter', 'stone shutter', 'slab', 'frame', 'grooved frame', 'their shutter'],
    locationId: 'present.sealed_chamber',
    initiallyVisible: true,
    hiddenWhen: (state) => state.chapter !== 'return',
    description: () =>
      'Up in its grooves, held there by an oak wedge driven under the lip. You know the exact ' +
      'depth that wedge has gone in, because you drove it, and watching it hold from this side ' +
      'of the room is the strangest thing that has happened to you today and today has had ' +
      'competition.\n\nBeyond it the relief is lit from underneath, and the fan of light goes ' +
      'up the patterned wall and finds the seam.',
    cannotTake: () =>
      'Leave it. If the shutter comes down the light goes off that wall, and you have already ' +
      'found out what happens when you try that.',
    responses: {
      touch: () => ({
        text:
          'The lip is worn exactly as smooth as you remember, which it would be, because you ' +
          'are the one who remembers it.',
      }),
      pull: () => ({
        text:
          'You get your fingers under the lip and then take them out again. Bringing the ' +
          'shutter down would put this room in the dark with both of you in it.',
      }),
    },
  },
  {
    id: 'returnsealed.wedge',
    name: 'oak wedge under the shutter',
    nouns: ['their wedge', 'oak wedge', 'wedge under the shutter', 'the wedge'],
    locationId: 'present.sealed_chamber',
    initiallyVisible: true,
    hiddenWhen: (state) => state.chapter !== 'return',
    description: () =>
      'A block of oak, cut off square, driven in under the shutter\'s lip at a shallow angle ' +
      'and bearing the whole weight of the slab on one corner.\n\nOreg gave it to you this ' +
      'morning out of a basket of offcuts, and said it would do, and it is doing.',
    cannotTake: () =>
      'You are not pulling the wedge out. The shutter comes down on the relief, the light goes ' +
      'off the wall, and the two of you are standing in the dark having the same argument.\n\n' +
      'Besides — and you notice yourself thinking it — that one is theirs. Yours is in your ' +
      'pocket, and it is the same wedge, and you are not going to think about that now.',
    responses: {
      touch: () => ({
        text:
          'Oak, cross-grained, compressed to a shine on the bearing corner. It has been in ' +
          'about an hour.',
      }),
      pull: () => ({
        text:
          'You put two fingers on it and do not pull. A wedge under a load does not come out ' +
          'gently, and everything on the other side of that shutter is the reason you are here.',
      }),
    },
  },
  {
    id: 'returnsealed.eye',
    name: 'carved eye',
    nouns: ['eye', 'carved eye', 'their eye', 'pierced eye', 'panel above the shutter'],
    locationId: 'present.sealed_chamber',
    initiallyVisible: true,
    hiddenWhen: (state) => state.chapter !== 'return',
    description: () =>
      'The eye above the shutter, cut through a panel of wall thin enough to let light pass, ' +
      'with the relief burning on the other side of it.\n\nIt is doing its work. The light ' +
      'comes up through it and fans across the scales, and the seam sits in the fan reading as ' +
      'a shadow. The whole arrangement took somebody a winter to cut and it took you a day to ' +
      'find, and you are about to put a hill on top of it.',
    cannotTake: () => 'It is a hole in a wall.',
    responses: {
      touch: () => ({
        text:
          'You put a fingertip in the pierced part and feel the warmth of the lamp on the other ' +
          'side. Light, and nothing else, comes through it.',
      }),
      knock: () => ({
        text:
          'You tap the panel beside the eye and it answers thinly, the way a flagstone does. It ' +
          'is as thin as it has to be and no thinner.',
      }),
    },
  },
  {
    id: 'returnsealed.wall',
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
    ],
    locationId: 'present.sealed_chamber',
    initiallyVisible: true,
    hiddenWhen: (state) => state.chapter !== 'return',
    acceptsItems: true,
    description: () =>
      'Overlapping scales, a hand across, the lower lip of each one standing proud — and the ' +
      'fan of lamplight lying across them from below, and the seam in the fan, reading as a ' +
      'shadow in a row of shadows.\n\nYou could put your hand on the top of it from here. ' +
      'Three days ago you did. Somebody in this room is going to do it again in about a minute ' +
      'unless you stop them.',
    cannotTake: () => 'It is a wall, and it is the wall.',
    responses: {
      touch: () => ({
        text:
          'Sharp on the way down and smooth on the way up, and the seam is a hair of cold air ' +
          'under your fingertip where the rest is stone.\n\nYou take your hand off it. You know ' +
          'what is behind it.',
      }),
      knock: () => ({
        text:
          'It sounds like a hill everywhere except along the seam, where it sounds like a door ' +
          'that has been very well made.',
      }),
      listen: () => ({
        text:
          'You put your ear to the scales beside the seam and hear nothing at all, which is not ' +
          'what you expected and is somehow worse.',
      }),
    },
  },
  {
    id: 'returnsealed.alcove',
    name: 'alcove',
    nouns: ['alcove', 'niche', 'dish', 'their alcove', 'cut dish', 'socket'],
    locationId: 'present.sealed_chamber',
    initiallyVisible: true,
    hiddenWhen: (state) => state.chapter !== 'return',
    description: () =>
      'A shallow dish cut into the stone at about the height of a sitting man\'s eye, with a ' +
      'lantern standing dead level in it because the dish was cut for a lantern of exactly that ' +
      'pattern.\n\nYou found this dish by feel, three days ago, in the dark, and the finding ' +
      'of it was the best few seconds of your life.',
    cannotTake: () => 'It is a hole cut in a wall. The lamp standing in it is another matter.',
    responses: {
      touch: () => ({
        text:
          'The inside of the dish is smooth, and warm under the lamp, and gritty at the front ' +
          'lip where generations of nothing have blown into it.',
      }),
    },
  },
  {
    /*
     * The pillar's crack, and the grit under it.
     *
     * Separate from the wall's seam on purpose: the audit found that bare
     * `crack` pointed at the seam even in the chapter where the important
     * crack is at the foot of the pillar. Both own the noun now, so bare
     * `crack` asks which — which is the right answer to a genuinely ambiguous
     * word in a room with two of them.
     */
    id: 'sealed.grit',
    name: 'crack at the foot of the pillar',
    nouns: ['pillar crack', 'crack at the base', 'grit', 'fan of grit', 'dust', 'crack'],
    locationId: 'present.sealed_chamber',
    initiallyVisible: true,
    hiddenWhen: (state) => state.chapter !== 'return',
    description: (state) => {
      const struck = Number(state.flags[FLAGS.pillarStruck] ?? 0);
      if (struck >= 2) {
        return (
          'The crack has gone all the way through the base and opened, and there is a heap of ' +
          'the pillar\'s own stone around its foot — a wedge of dressed limestone the size of ' +
          'your forearm lying on top of the rest of it.\n\nThe grit is not a fan any more. It ' +
          'is a pile.'
        );
      }
      if (struck >= 1) {
        return (
          'The crack is a finger-width now where it was a hair, and there is fresh pale grit ' +
          'fanned out on the floor in front of it that was not there before you swung.\n\n' +
          'You can see up into it. It goes further than it shows.'
        );
      }
      return (
        'A crack in the dressed stone at the foot of the pillar, about the length of your ' +
        'forearm, running up from the floor and closing to nothing. There is a small grey fan ' +
        'of grit on the flags underneath it — the sign of something that has been carrying a ' +
        'load for longer than it was meant to.\n\nLovage told you about this, a hundred years ' +
        'ago, in a room three-quarters finished. He said the pillar was the whole of it.'
      );
    },
    cannotTake: () => 'A handful of grit off the floor is not going to help anybody.',
    responses: {
      touch: () => ({
        text:
          'The grit is dry and fine and gets under your nails. The crack takes your fingertip ' +
          'to the first joint and then narrows.',
      }),
      listen: () => ({
        text:
          'You put your ear against the pillar above the crack. The hill is doing something ' +
          'very slowly, a long way up, and has been for four hundred years.',
      }),
    },
  },
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

/**
 * Objects that are part of a carried item rather than part of a room.
 *
 * The cloth tag is knotted to the lantern's handle, so it is wherever the
 * lantern is. `visibleObjects` consults this so a part travels with its parent
 * instead of staying on the windowsill it was found on.
 */
export const ATTACHED_OBJECTS: WorldObjectDef[] = OBJECT_LIST.filter(
  (o) => o.attachedTo !== undefined
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
