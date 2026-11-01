import type { GameState, PersonDef } from '../engine/types';
import { FLAGS } from './flags';

const f = (state: GameState, key: string): boolean => Boolean(state.flags[key]);

const PERSON_LIST: PersonDef[] = [
  /* ================================================================ *
   * The square
   * ================================================================ */
  {
    id: 'orla',
    name: 'Orla',
    nouns: ['orla', 'woman with the chalk', 'chalk woman'],
    locationId: 'present.square',
    listAs: 'Orla, going over the chalk lines again',
    appearance: () =>
      'Fifty-odd, grey at the temples, with chalk to the wrist on her right hand and none at ' +
      'all on her left. She keeps the plank because somebody has to and because she does not ' +
      'trust anyone else to keep it accurately.',
    greeting: () =>
      'Orla straightens up with the chalk still in her fist. "There {they} is," she says — ' +
      'not to you, to nobody — and then, to you: "Sixteen today. Right."',
    topics: [
      {
        id: 'prophecy',
        label: 'the prophecy',
        aliases: ['wanderer', 'plank', 'lines', 'chalk'],
        response: () =>
          '"It came to Hanne in the winter, three times the same, and she is not a woman who ' +
          'invents things." Orla taps the plank. "A wanderer. One eye in the middle of its ' +
          'face, like the old carvings. It comes, and what stands does not stand after."\n\n' +
          '"That is the part people repeat. The part they do not repeat is the last line. ' +
          'Someone who braves the Cave of Absolution will have the power to turn it aside." ' +
          'She wipes chalk off her thumb. "Which is why the whole village has opinions about ' +
          'you this morning, and why I would rather you heard it from the plank than from ' +
          'Marda."',
        effects: {
          flags: { [FLAGS.heardProphecy]: true },
          journal: [
            {
              id: 'j.prophecy',
              text:
                'The prophecy on the plank: a one-eyed monster called the Wanderer brings a ' +
                'cataclysm, and someone who braves the Cave of Absolution will have the power ' +
                'to turn it aside.',
            },
          ],
        },
      },
      {
        id: 'how_old',
        label: 'how old the prophecy is',
        aliases: ['age', 'old', 'how long'],
        response: () =>
          '"Older than the plank." Orla shrugs. "People have said the Wanderer-words at ' +
          'midwinter since my grandmother was small, and she had them from hers. Nobody ever ' +
          'thought they were about next year."\n\n' +
          '"Then Hanne dreamed a date in them. That is all that has changed. The words have not ' +
          'changed at all." She looks at the plank as though it has personally inconvenienced ' +
          'her. "They are very old words. They have simply become rude."',
        effects: {
          journal: [
            {
              id: 'j.prophecy_age',
              text:
                'The Wanderer-words are generations old and said at midwinter. What is new is ' +
                'that Hanne dreamed a date for them.',
            },
          ],
        },
      },
      {
        id: 'lanterns',
        label: 'the lanterns and the salt',
        aliases: ['salt', 'preparations', 'vigil'],
        response: () =>
          '"The lanterns are for a vigil. We light them on the night, and we sit up, and in the ' +
          'morning we take them down and feel foolish, and that is a good outcome and I will ' +
          'take it."\n\n' +
          '"The salt is Edda\'s idea and it does nothing and it costs us a bowl of salt." A ' +
          'small exhalation. "People need something to put their hands to. I would rather it ' +
          'was salt than something expensive."',
      },
      {
        id: 'rite',
        label: 'the rite, and whether you should go',
        aliases: ['cave', 'going in', 'should i go', 'me'],
        response: () =>
          '"You are allowed. That is the whole of it. Sixteen and you are allowed, and you go ' +
          'in and you come out and you are the same person with one more thing in you."\n\n' +
          'She points the chalk at you. "Three of your year have gone in already. Jens turned ' +
          'round at the gallery. Mira sat down and came out again. Hal walked to the end of the ' +
          'rope and counted to a hundred and that was his lot. None of them came back with a ' +
          'power. Nobody expects you to either."\n\n' +
          '"Go in because you are sixteen. Not because of a plank."',
      },
    ],
  },
  {
    id: 'marda',
    name: 'Marda',
    nouns: ['marda', 'baker'],
    locationId: 'present.square',
    listAs: 'Marda, with flour to her elbows and views to match',
    appearance: () =>
      'Broad, floured, and entirely unhurried. She has the forearms of someone who has worked ' +
      'dough every morning for thirty years and the expression of someone who has heard the ' +
      'end of the world announced before.',
    greeting: () =>
      'Marda does not stop what she is doing. "Birthday," she says. "Good. Eat something."',
    topics: [
      {
        id: 'prophecy',
        label: 'what she makes of the prophecy',
        aliases: ['wanderer', 'plank', 'nonsense'],
        response: () =>
          '"I make bread of it." She slaps the dough over. "I have lived here fifty-one years. ' +
          'In that time we have had two ends of the world. One was a comet and one was a sick ' +
          'cow, and both times somebody strung up lanterns."\n\n' +
          '"I am not saying Hanne lies. I am saying that eleven days of unlit lanterns is ' +
          'eleven days of people not mending their roofs." She points at the strung cord with ' +
          'her chin. "When it rains in the autumn, that is what will have come for us."',
        effects: {
          flags: { [FLAGS.heardProphecy]: true },
        },
      },
      {
        id: 'cave',
        label: 'the cave',
        aliases: ['absolution', 'rite'],
        response: () =>
          '"The cave is a hole and the hole is fine. I went in at sixteen like everybody." She ' +
          'wipes her hands. "It is cold, it is boring, and about halfway along you stop ' +
          'performing for anyone and you have a think. That is the use of it. That is all the ' +
          'use of it, and it is a real one."\n\n' +
          '"What it is not is a cupboard with a sword in it."',
      },
      {
        id: 'advice',
        label: 'advice for going in',
        aliases: ['tips', 'help', 'what should i do'],
        response: () =>
          '"Keep a hand on the rope. Come out before you are tired rather than after. And do ' +
          'not take anything in there you would be sorry to put down." She finally looks at ' +
          'you properly. "And you come back and tell me it was boring. That is what I want to ' +
          'hear this evening. Boring."',
      },
    ],
  },
  {
    id: 'hesk',
    name: 'Hesk',
    nouns: ['hesk', 'boy'],
    locationId: 'present.square',
    listAs: 'Hesk, twelve and vibrating',
    appearance: () =>
      'Twelve, with a stick he has not decided the purpose of yet. He has clearly been told to ' +
      'leave you alone today and has interpreted this generously.',
    greeting: (state) =>
      'Hesk arrives at your elbow at speed. "Is it today? Orla, it\'s today, ' +
      (f(state, FLAGS.heardProphecy) ? '{they} read the plank and everything—"' : '{name}\'s going up—"'),
    topics: [
      {
        id: 'excited',
        label: 'why he is so excited',
        aliases: ['excited', 'you', 'him'],
        response: () =>
          '"Because it\'s *the* one." He counts on his fingers, which does not help. "The ' +
          'plank says someone who braves the cave gets the power. And four people have gone ' +
          'this year and none of them braved it properly, they all came out, so it has to be ' +
          'someone who—"\n\n' +
          'He runs out of logic and finishes at volume: "It could be you!"\n\n' +
          'Behind him, Orla says, without turning round, "Hesk."',
      },
      {
        id: 'others',
        label: 'the others who went in',
        aliases: ['jens', 'mira', 'hal', 'who else'],
        response: () =>
          '"Jens got to the gallery and came straight back and said it was *atmospheric*." ' +
          'Hesk\'s opinion of this word is total. "Mira stayed ages. Hal counted to a hundred. ' +
          'And Bren didn\'t go at all, he just said no, in front of everyone, and nothing ' +
          'happened to him."\n\n' +
          'He considers that last one for a second longer than the others. "Four years and I ' +
          'can go. I\'ve already decided I\'m going right to the back."',
      },
    ],
  },

  /* ================================================================ *
   * The workshop
   * ================================================================ */
  {
    id: 'tolv',
    name: 'Tolv',
    nouns: ['tolv', 'joiner'],
    locationId: 'present.workshop',
    listAs: 'Tolv at the bench',
    appearance: () =>
      'Forty, maybe. Sawdust in the creases of his knuckles, a pencil behind his ear that he ' +
      'will not need because he has already measured it. He talks while he works and the work ' +
      'does not suffer.',
    greeting: () =>
      'Tolv looks up long enough to place you, then back down at the joint. "Sixteen, then." ' +
      'A pause the length of two strokes of the plane. "Take a wedge from the basket if you ' +
      'want one. Most of them do."',
    topics: [
      {
        id: 'wedge',
        label: 'the wedge',
        aliases: ['wedges', 'basket', 'offcuts', 'why a wedge'],
        response: () =>
          '"Because there are doors in there." He does not look up. "Not doors. Slabs. Things ' +
          'that sit in a groove and come down when you stop holding them. I spent an afternoon ' +
          'holding one up with my shoulder, aged sixteen, and learned what a wedge is for."\n\n' +
          '"Take two if you like. They cost me nothing and they are the only useful thing ' +
          'anybody has ever handed out at that cave."',
        effects: {
          reveals: ['workshop.wedge'],
          journal: [
            {
              id: 'j.tolv_wedge',
              text:
                'Tolv says there are slab doors in the cave that sit in grooves and come down ' +
                'when you let go. He offers a wedge for it.',
            },
          ],
        },
      },
      {
        id: 'his_attempt',
        label: 'his own attempt at the rite',
        aliases: ['his rite', 'when he went', 'found nothing', 'attempt'],
        response: () =>
          '"I went the whole way. Rope, gallery, the crawl, the little square room at the back ' +
          'with the fish-scale walls." The plane goes along the edge. "I was in there most of a ' +
          'day. I had a torch and a lot of ideas."\n\n' +
          '"And I found nothing. Not nothing-as-in-I-failed. Nothing as in there is nothing ' +
          'there. I went over that square room twice. Good stonework, no door, no hole, nothing ' +
          'behind anything." He blows the shaving off. "Whoever cut it cut it and left it empty. ' +
          'People do that. Half the things I make are boxes nobody ever puts anything in."\n\n' +
          '"So. Go in. Enjoy the stonework. Expect nothing and you will not be disappointed, ' +
          'which is the only guarantee I am in a position to offer."',
        effects: {
          flags: { [FLAGS.heardFoundNothing]: true },
          journal: [
            {
              id: 'j.tolv',
              text:
                'Tolv reached the square chamber with the scale-patterned walls, searched it ' +
                'for most of a day with a torch, and found nothing.',
            },
          ],
        },
      },
      {
        id: 'square_room',
        label: 'the square room at the back',
        aliases: ['sealed chamber', 'fish-scale', 'scale walls', 'stonework'],
        available: (state) => f(state, FLAGS.heardFoundNothing),
        response: () =>
          '"Best work in there by a long way. Three walls cut in scales, every one the same, ' +
          'and whoever did it never once lost the row." Grudging respect, which from Tolv is a ' +
          'significant quantity. "I ran a candle along every join. Nothing."\n\n' +
          '"There is a slab low down on the fourth wall. That is the one that taught me about ' +
          'wedges. I got it up, had a look, there is a hole behind it about as deep as your ' +
          'arm and black with smoke, and it is at ankle height, so it is nobody\'s lamp ' +
          'bracket, and it is nobody\'s cupboard either because there is nothing in it."\n\n' +
          'He shrugs. "Hands got tired. It came down. I had looked."',
        effects: {
          journal: [
            {
              id: 'j.tolv_slab',
              text:
                'Tolv got the low slab up once: behind it is a smoke-blackened hollow at ankle ' +
                'height, arm-deep and empty. His hands got tired and it came down.',
            },
          ],
        },
      },
      {
        id: 'prophecy',
        label: 'the prophecy',
        aliases: ['wanderer', 'plank'],
        response: () =>
          'The plane stops. "I have a roof to finish before autumn and a lad coming to be ' +
          'apprenticed at midwinter." He starts again. "I am behaving as though there will be a ' +
          'midwinter. You can read that however you like."',
      },
    ],
  },

  /* ================================================================ *
   * The cave path
   * ================================================================ */
  {
    id: 'nessa',
    name: 'Nessa',
    nouns: ['nessa'],
    locationId: 'present.cave_path',
    listAs: 'Nessa on the stump, boots off',
    appearance: () =>
      'A few years older than you, sitting with her boots beside her and her heels in the grass. ' +
      'She is not waiting for anything. She comes up here and sits on the stump, and the village ' +
      'has decided not to find that remarkable.',
    greeting: () =>
      'Nessa sees the lantern before she sees your face. "Ah," she says. "Today, is it." She ' +
      'moves along the stump to make room.',
    topics: [
      {
        id: 'her_rite',
        label: 'what happened when she went in',
        aliases: ['rescued', 'lost', 'her rite', 'what happened'],
        response: () =>
          '"I got lost, and they came and got me out, and I was in there one night and most of ' +
          'a day." She says it flatly, like a date. "You will hear it as a funny story in the ' +
          'square. It is not one, but I do not mind it being told."\n\n' +
          '"Here is the part that is actually useful. I did not get lost in the dark. I got ' +
          'lost because I let go of the rope to look at something, and then I walked six paces ' +
          'to see it better, and then I could not have told you which way I had come. Six ' +
          'paces. That is the whole distance between fine and not fine."\n\n' +
          'She taps the stump. "Keep the way out in your head as a thing with a shape. Not as a ' +
          'feeling."',
        effects: {
          flags: { [FLAGS.heardRescued]: true },
          journal: [
            {
              id: 'j.nessa',
              text:
                'Nessa was lost in the cave for a night and a day. She let go of the rope to ' +
                'look at something and walked six paces.',
            },
          ],
        },
      },
      {
        id: 'what_she_saw',
        label: 'the thing she let go of the rope for',
        aliases: ['what she saw', 'the thing', 'looked at'],
        available: (state) => f(state, FLAGS.heardRescued),
        response: () =>
          'She takes long enough answering that you think she has decided not to.\n\n' +
          '"The old picture. On the right-hand wall of the first gallery, the one with the ' +
          'water run over it." She frowns at her own feet. "I could not make it out. There is a ' +
          'person in it doing something very deliberate and I wanted to know what, and I kept ' +
          'moving the torch about to get the shadow off it, and the more I moved it the flatter ' +
          'it went."\n\n' +
          '"Then I had walked away from the rope. So that is my advice and my one regret in the ' +
          'same sentence: go and look at it properly. With both feet still on the rope."',
        effects: {
          journal: [
            {
              id: 'j.nessa_relief',
              text:
                'Nessa let go of the rope to study the worn relief on the gallery\'s right-hand ' +
                'wall. Moving a torch around only flattened it.',
            },
          ],
        },
      },
      {
        id: 'afraid',
        label: 'whether you should be afraid',
        aliases: ['afraid', 'scared', 'fear'],
        response: () =>
          '"No. Yes. Not of the cave." She pulls a boot on. "Nothing in there has ever hurt ' +
          'anyone. Everyone who has ever been hurt at that cave was hurt by their own ' +
          'decisions, including me."\n\n' +
          '"So be afraid of your decisions. They are the only dangerous thing you are bringing ' +
          'in."',
      },
    ],
  },
  {
    id: 'aldren',
    name: 'Aldren',
    nouns: ['aldren', 'man with the rope', 'keeper'],
    locationId: 'present.cave_path',
    listAs: 'Aldren, coiling rope and watching the sky',
    appearance: () =>
      'Weathered, deliberate, with a coil of hemp over one shoulder and the stance of a man who ' +
      'has stood on this path in every kind of weather. He keeps the entrance. It is not a title ' +
      'anyone gave him.',
    greeting: () =>
      'Aldren finishes the coil before he speaks, which takes a while. "Right. Lantern. Good. ' +
      'Show me it lights."',
    topics: [
      {
        id: 'entrance',
        label: 'the entrance and the way back',
        aliases: ['rope', 'way out', 'way back', 'mouth'],
        response: () =>
          '"Rope runs from the ring at the mouth to the pillar in the gallery. Knots every ' +
          'arm-span. You can walk it out blind and people have." He slaps the coil. "Past the ' +
          'pillar there is no rope, because past the pillar there are only two ways and both of ' +
          'them come back to the pillar. That is the honest layout of the place."\n\n' +
          '"And from the gallery you can still see the mouth. Little bright slot, back over ' +
          'your shoulder. Look for it now and then. If you can see it, you are not lost; you ' +
          'are just somewhere dark."',
        effects: {
          flags: { [FLAGS.heardKeeper]: true },
          journal: [
            {
              id: 'j.aldren',
              text:
                'Aldren: past the gallery pillar there is no rope, but both ways on come back ' +
                'to the pillar, and the cave mouth stays visible from the gallery.',
            },
          ],
        },
      },
      {
        id: 'layout',
        label: 'what is actually in there',
        aliases: ['inside', 'rooms', 'layout', 'map'],
        response: () =>
          '"Four rooms and a hole in a hill." He counts them off on the rope. "Mouth. Gallery. ' +
          'Then the crawl north into the round room that throws your voice at you, which is ' +
          'where people get a fright and that is all it is. Then the squeeze east into the ' +
          'little square cut room."\n\n' +
          '"Thirty-odd years I have kept this path. Nobody has ever found a fifth room. I will ' +
          'say that plainly so nobody has to go looking for one on my account."',
        effects: {
          journal: [
            {
              id: 'j.layout',
              text:
                'Known layout: mouth, gallery, the echoing round room north, the small cut ' +
                'chamber east. Aldren says nobody has ever found a fifth room.',
            },
          ],
        },
      },
      {
        id: 'come_back',
        label: 'coming back out for more gear',
        aliases: ['gear', 'supplies', 'return', 'preparation'],
        response: () =>
          '"You can come and go as you like. It is not a trial and nobody is timing you." He ' +
          'nods down the hill. "People walk back down for a second lantern, a coat, their ' +
          'dinner. Hal went back for his dinner and nobody thinks less of him."\n\n' +
          '"The only rule I keep is this one: tell me when you go in, and I will be here when ' +
          'you come out. That is the job."',
        effects: {
          journal: [
            {
              id: 'j.comeback',
              text:
                'Aldren: you can leave the cave and come back as often as you like. It is not ' +
                'timed.',
            },
          ],
        },
      },
      {
        id: 'prophecy',
        label: 'the prophecy',
        aliases: ['wanderer', 'plank', 'power'],
        response: () =>
          '"Thirty years I have handed people a rope at that mouth, and not one of them has ' +
          'come out of it with a power." He says it without any edge. "I am not telling you ' +
          'there is nothing. I am telling you I have never seen it, and I have had the best ' +
          'seat."\n\n' +
          'He looks up the hill. "Go in as yourself. Come out as yourself. If the village wants ' +
          'more than that from a child\'s birthday, the village can go in itself."',
      },
    ],
  },

  /* ================================================================ *
   * The square, earlier
   * ================================================================ */
  {
    id: 'sabra',
    name: 'Sabra',
    nouns: ['sabra', 'mason', 'woman', 'woman on the plank'],
    locationId: 'past.square',
    listAs: 'Sabra on the plank with a trowel',
    appearance: () =>
      'A mason, up on a scaffold plank with her sleeves rolled and lime dust to the elbow. She ' +
      'works and talks at the same pace. You have never seen her before in your life and you ' +
      'cannot stop looking at her, because she is standing in the joiner\'s doorway.',
    greeting: () =>
      'The woman on the plank notices you at last and rests the trowel on the course. "You are ' +
      'not one of ours," she says, friendly enough, and entirely certain. "Up from the ford?"',
    topics: [
      {
        id: 'village',
        label: 'where you are',
        aliases: ['here', 'place', 'name', 'ford'],
        response: () =>
          'You say something vague that could be a yes.\n\n' +
          '"Well. You have come at a loud week." She nods at the frame of green timber under ' +
          'her. "That is going to be a workshop, if the third course ever dries. Lodge with ' +
          'Edda if you need a roof, she is the one with the goat on the path and she will talk ' +
          'at you about the goat."\n\n' +
          'Behind her, Pell shifts the mortar board to his other hip, and some of it goes on ' +
          'his foot, and he does not notice.',
      },
      {
        id: 'cave',
        label: 'the cave on the hill',
        aliases: ['hill', 'absolution', 'the cave'],
        response: () =>
          '"The cave." She says it the way you would say *the barn*. "Aye. Lonn and his boys are ' +
          'in it now, cutting the stair down to the water. Third season on it."\n\n' +
          '"You can go up and look, everyone does. Young ones walk in on a dare and walk out ' +
          'again and are very pleased with themselves." She scrapes the trowel clean. "Mind ' +
          'where Lonn has the chalk lines and do not touch his mallet."',
        effects: {
          journal: [
            {
              id: 'j.sabra_cave',
              text:
                'Here the cave is ordinary. A man called Lonn and his sons are cutting the ' +
                'stair down to the water, third season on it. Young ones walk in on a dare.',
            },
          ],
        },
      },
      {
        id: 'absolution',
        label: 'whether the cave has a name',
        aliases: ['name of the cave', 'called'],
        available: (state) => state.discovered.includes('topic.sabra.cave'),
        response: () =>
          '"A name? It is the cave." She squints at you. "Up the hill there. What would we call ' +
          'it, the other cave?"\n\n' +
          'Pell, helpfully: "Lonn calls it the wet hole."\n\n' +
          '"Lonn calls everything something. Do not learn your words off Lonn."',
        effects: {
          journal: [
            {
              id: 'j.no_name',
              text: 'Here the cave has no name. It is "the cave", or worse, Lonn\'s word for it.',
            },
          ],
        },
      },
      {
        id: 'wanderer',
        label: 'whether anything is coming',
        aliases: ['wanderer', 'prophecy', 'vigil', 'lanterns', 'warning', 'danger'],
        available: (state) => state.discovered.includes('topic.sabra.cave'),
        response: () =>
          'You try to ask it without asking it. Whether they keep a vigil, in this village. ' +
          'Whether they string the lanterns up on a cord between the eaves and sit out a night, ' +
          'any night, for anything.\n\n' +
          'Sabra looks at you with the patience of a woman on a plank.\n\n' +
          '"Lanterns on a cord? Over the square? In this wind?" She laughs once. "Whose ' +
          'lanterns?"\n\n' +
          'You ask, more carefully, whether she has ever heard of the Wanderer.\n\n' +
          'It lands on nothing at all. Not fear, not caution, not the flicker people in your ' +
          'square get when the word comes up. She turns it over as a word she has not been ' +
          'given before, decides it is probably a ford-village thing, and hands it back.\n\n' +
          '"No," says Sabra. "Should I have?"\n\n' +
          'Pell says, "Is it a dog?"',
        effects: {
          flags: { [FLAGS.heardNoProphecy]: true },
          journal: [
            {
              id: 'j.no_prophecy',
              text:
                'Nobody here has heard the word Wanderer. There is no vigil, no cord of ' +
                'lanterns, no plank by the well.',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'pell',
    name: 'Pell',
    nouns: ['pell', 'boy'],
    locationId: 'past.square',
    listAs: 'Pell, holding the mortar board badly',
    appearance: () =>
      'Eleven or twelve, barefoot, with mortar on one foot and no awareness of it. He is holding ' +
      'the board at the exact angle that will cost him, and watching you instead.',
    greeting: () =>
      'The boy looks you over with frank interest, mortar board tilting. "Are you from the ' +
      'ford?"',
    topics: [
      {
        id: 'tree',
        label: 'the tree',
        aliases: ['great tree', 'swing'],
        response: () =>
          '"That\'s our tree." Absolute ownership. "There\'s a swing. You can have a go if you ' +
          'put the board down for me."\n\n' +
          'He says it has always been there, in the tone twelve-year-olds use for *always*, and ' +
          'then, when you ask again, he says his grandfather climbed it, so it must be older ' +
          'than his grandfather, which he clearly regards as the outer limit of time.',
        effects: {
          flags: { [FLAGS.sawTree]: true },
          journal: [
            {
              id: 'j.tree_age',
              text: 'Pell says the great tree is older than his grandfather, who climbed it.',
            },
          ],
        },
      },
      {
        id: 'cave',
        label: 'whether he has been in the cave',
        aliases: ['been in', 'hill', 'dare'],
        response: () =>
          '"Twice." A pause that costs him something. "Once properly."\n\n' +
          '"It\'s all stair now, Lonn\'s cut it right down, and there\'s a basin at the bottom ' +
          'with water in and Mirri put a coin in it and Lonn shouted." He brightens. "You can ' +
          'walk the whole thing before a candle burns down. It\'s not even far."',
      },
    ],
  },
];

export const PEOPLE: Record<string, PersonDef> = Object.fromEntries(
  PERSON_LIST.map((p) => [p.id, p])
);

export const PEOPLE_BY_LOCATION: Record<string, PersonDef[]> = PERSON_LIST.reduce<
  Record<string, PersonDef[]>
>((acc, p) => {
  (acc[p.locationId] ??= []).push(p);
  return acc;
}, {});

/** Topics currently offerable for a person, in authored order. */
export function availableTopics(person: PersonDef, state: GameState, heard: string[]): typeof person.topics {
  return person.topics.filter((topic) => {
    if (topic.available && !topic.available(state)) return false;
    if (topic.once && heard.includes(topic.id)) return false;
    return true;
  });
}
