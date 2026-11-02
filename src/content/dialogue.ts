import type { GameState, PersonDef } from '../engine/types';
import { FLAGS } from './flags';
import { c, m } from './markup';

/**
 * The village cast.
 *
 * Everyone here is named for a herb or a spice — the convention, not a joke.
 * Nobody remarks on anybody's name, nobody makes a pun, and no behaviour is
 * derived from a name's meaning, and nobody makes a pun.
 *
 * Internal `id`s are deliberately the earlier provisional ones. Saves store
 * them — directly in `pending.personId`, and inside the `topic.<person>.<id>`
 * entries in `discovered` — so keeping them stable means a save made before
 * the renaming still loads. The display `name` is the only thing that changed.
 * Old names stay in `nouns`, so a player's typing habits keep working too.
 *
 * All names are provisional content. See docs/CANON.md.
 */

const f = (state: GameState, key: string): boolean => Boolean(state.flags[key]);

const PERSON_LIST: PersonDef[] = [
  /* ================================================================ *
   * The square
   * ================================================================ */
  {
    id: 'orla',
    name: 'Sage',
    nouns: ['sage', 'orla', 'woman with the chalk', 'chalk woman'],
    locationId: 'present.square',
    listAs: c('Sage, going over the chalk lines again'),
    appearance: () =>
      'Twenty-three or so, with chalk to the wrist on her right hand and none at all on her ' +
      'left. She keeps the plank, the midwinter words, the order of the vigil and which house ' +
      'owes which a roof-beam, because her aunt kept all of it before her and handed it over ' +
      'without asking whether she wanted it.\n\n' +
      'She is very good at it. She is also the youngest person in this square who can tell you ' +
      'what any of it is for, and you can see that sitting on her.',
    greeting: () =>
      'Sage straightens up with the chalk still in her fist. "There {they} is," she says — not ' +
      'to you, to nobody — and then, to you: "Sixteen today. Right."',
    topics: [
      {
        id: 'prophecy',
        label: 'the prophecy',
        aliases: ['wanderer', 'plank', 'lines', 'chalk'],
        response: () =>
          '"Hyssop put the lines together with the year and came to me about it in the winter, ' +
          'and she is not a woman who invents things." Sage taps the plank. "A ' + m('cyclops') +
          '. One eye. It comes, and what stands does not stand after."\n\n' +
          '"Mind, the words only say the one eye. The old carvings put it in the middle of the ' +
          'face, big as a dish, and everyone has had that picture in their head since they were ' +
          'four. That is the carvers\' idea, not the words\'." She shrugs. "Half of what people ' +
          '*know* about the ' + m('Wanderer') + ', they know off a wall."\n\n' +
          '"And the part they do not repeat is the last line. Someone who braves the ' +
          m('Cave of Absolution') + ' will have the power to turn it aside." She wipes chalk ' +
          'off her thumb. ' +
          '"Which is why the whole village has opinions about you this morning, and why I would ' +
          'rather you heard it from the plank than from Marjoram."',
        effects: {
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
        id: 'how_old',
        label: 'how old the prophecy is',
        aliases: ['age', 'old', 'how long'],
        response: () =>
          '"Older than the plank. Older than the chalk, older than me, older than my aunt, and ' +
          'she had them from hers." Sage says it the way you would recite a list you have been ' +
          'made to learn. "The ' + m('Wanderer-words') + ' get said at midwinter. They have been said at ' +
          'midwinter for as long as anybody has been counting midwinters. Nobody ever thought ' +
          'they were about next year."\n\n' +
          '"Then Hyssop read a date out of them — counted it off the lines, the way you would ' +
          'count a debt. That is all that has changed. The words have not changed at all." She ' +
          'looks at the plank as though it has personally inconvenienced her. "They are very ' +
          'old words. They have simply become rude."',
        effects: {
          journal: [
            {
              id: 'j.prophecy_age',
              text:
                'The ' + m('Wanderer-words') + ' are generations old and said every ' +
                'midwinter. What is new ' +
                'is that Hyssop has counted a date out of them.',
            },
          ],
        },
      },
      {
        id: 'lanterns',
        label: 'the lanterns and the salt',
        aliases: ['salt', 'preparations', 'vigil'],
        response: () =>
          '"The lanterns are for the vigil. We light them on the night, and we sit up, and in ' +
          'the morning we take them down and feel foolish, and that is a good outcome and I ' +
          'will take it."\n\n' +
          '"The salt is Nettle\'s idea and it does nothing and it costs us a bowl of salt." A ' +
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
          'She points the chalk at you. "Three of your year have gone already. Chervil went to ' +
          'the end of the rope and loved every minute. Borage went because you are supposed to ' +
          'came back out at the gallery. Mint said no, out loud, in front of everyone." A beat. ' +
          '"None of them came back with a power. Nobody expects you to either."\n\n' +
          '"Go in because you are sixteen. Not because of a plank."',
      },
    ],
  },
  {
    id: 'marda',
    name: 'Marjoram',
    nouns: ['marjoram', 'marda', 'baker'],
    locationId: 'present.square',
    listAs: c('Marjoram, with flour to her elbows and views to match'),
    appearance: () =>
      'Broad, floured, and entirely unhurried. She has the forearms of someone who has worked ' +
      'dough every morning for thirty years and the expression of someone who has heard the ' +
      'end of the world announced before.',
    greeting: () =>
      'Marjoram does not stop what she is doing. "Birthday," she says. "Good. Eat something."',
    topics: [
      {
        id: 'prophecy',
        label: 'what she makes of the prophecy',
        aliases: ['wanderer', 'plank', 'nonsense'],
        response: () =>
          '"I make bread of it." She slaps the dough over. "I have lived here fifty-one years. ' +
          'In that time we have had two ends of the world. One was a comet and one was a sick ' +
          'cow, and both times somebody strung up lanterns."\n\n' +
          '"I am not saying Hyssop lies. I am saying that eleven days of unlit lanterns is ' +
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
    name: 'Parsie',
    nouns: ['parsie', 'hesk', 'child', 'kid'],
    locationId: 'present.square',
    listAs: c('Parsie, eleven and vibrating'),
    appearance: () =>
      'Eleven, with a stick he has not decided the purpose of yet. He has clearly been told to ' +
      'leave you alone today and has interpreted this generously.',
    greeting: (state) =>
      'Parsie arrives at your elbow at speed. "Is it today? Sage, it\'s today, ' +
      (f(state, FLAGS.heardProphecy)
        ? '{they} read the plank and everything—"'
        : '{name}\'s going up—"'),
    topics: [
      {
        id: 'excited',
        label: 'why he is so excited',
        aliases: ['excited', 'you', 'him'],
        response: () =>
          '"Because it\'s *the* one." He counts on his fingers, which does not help. "The plank ' +
          'says someone who braves the cave gets the power. And three people have gone this ' +
          'year and none of them braved it properly, they all came out, so it has to be ' +
          'someone who—"\n\n' +
          'He runs out of logic and finishes at volume: "It could be you!"\n\n' +
          'Behind him, Sage says, without turning round, "Parsie."',
      },
      {
        id: 'others',
        label: 'the others who went in',
        aliases: ['chervil', 'borage', 'mint', 'who else'],
        response: () =>
          '"Chervil went right to the end of the rope and said it was *brilliant*. Borage went in ' +
          'after her and came back out at the gallery and said it was *atmospheric*." Parsie\'s ' +
          'opinion of this word is total. "They were in there together and they came out with ' +
          'two completely different caves."\n\n' +
          '"And Mint didn\'t go at all. She just said no. In front of everyone." He lowers his ' +
          'voice for this part, which is the only time he lowers it. "And nothing happened to ' +
          'her."\n\n' +
          'He considers that one for a second longer than the others. "Five years and I can go. ' +
          'I\'ve already decided I\'m going right to the back."',
      },
      {
        id: 'the_stone',
        label: 'the stone in his hand',
        aliases: ['stone', 'pebble', 'map'],
        available: (state) => f(state, FLAGS.gaveStone),
        response: () =>
          'He has it in both hands and he is not going to put it down.\n\n' +
          '"Past the names. *Past* the names." He is already drawing the map in the air with ' +
          'one elbow. "Right, so when I go, I have to get past where you got it, and you got it ' +
          'past the names, so I have to go—"\n\n' +
          'He stops. A thought arrives and visibly costs him something.\n\n' +
          '"How far does it go?"\n\n' +
          'You tell him you do not know, which is true, and which he accepts with the ' +
          'seriousness of a boy being told a real thing by an adult for the first time.',
      },
      {
        id: 'bring_back',
        label: 'what he wants you to bring back',
        aliases: ['bring', 'souvenir', 'proof'],
        response: () =>
          '"A stone. Not a normal one." He has clearly thought about this. "And you have to ' +
          'tell me where in it you got the stone, and I\'ll draw the map, and then when I go I ' +
          'can go further than where you got it."\n\n' +
          'He looks up at you with the stick held like a measuring pole. "That\'s how it works. ' +
          'Everyone has to go a bit further than the last one or it\'s not a proper rite."\n\n' +
          'Nobody has told him that is not how it works, and you find you are not going to be ' +
          'the one.',
      },
    ],
  },

  /* ================================================================ *
   * The workshop
   * ================================================================ */
  {
    id: 'tolv',
    name: 'Oreg',
    nouns: ['oreg', 'tolv', 'joiner'],
    locationId: 'present.workshop',
    listAs: c('Oreg at the bench'),
    appearance: () =>
      'Forty, maybe. Sawdust in the creases of his knuckles, a pencil behind his ear that he ' +
      'will not need because he has already measured it. He talks while he works and the work ' +
      'does not suffer.',
    greeting: () =>
      'Oreg looks up long enough to place you, then back down at the joint. "Sixteen, then." ' +
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
              id: 'j.oreg_wedge',
              text:
                'Oreg says there are slab doors in the cave that sit in grooves and come down ' +
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
              id: 'j.oreg',
              text:
                'Oreg reached the square chamber with the scale-patterned walls, searched it ' +
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
          'and whoever did it never once lost the row." Grudging respect, which from Oreg is a ' +
          'significant quantity. "I ran a candle along every join. Nothing."\n\n' +
          '"There is a slab low down on the fourth wall. That is the one that taught me about ' +
          'wedges. I got it up, had a look, there is a hole behind it about as deep as your ' +
          'arm and black with smoke, and it is at ankle height, so it is nobody\'s lamp ' +
          'bracket, and it is nobody\'s cupboard either because there is nothing in it."\n\n' +
          'He shrugs. "Hands got tired. It came down. I had looked."',
        effects: {
          journal: [
            {
              id: 'j.oreg_slab',
              text:
                'Oreg got the low slab up once: behind it is a smoke-blackened hollow at ankle ' +
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
    name: 'Dilly',
    nouns: ['dilly', 'nessa'],
    locationId: 'present.cave_path',
    listAs: c('Dilly on the stump, boots off'),
    appearance: () =>
      'A few years older than you, sitting with her boots beside her and her heels in the ' +
      'grass. She is not waiting for anything. She comes up here and sits on the stump, and ' +
      'the village has decided not to find that remarkable.',
    greeting: () =>
      'Dilly sees the lantern before she sees your face. "Ah," she says. "Today, is it." She ' +
      'moves along the stump to make room.',
    topics: [
      {
        id: 'her_rite',
        label: 'what happened when she went in',
        aliases: ['rescued', 'lost', 'her rite', 'what happened'],
        response: () =>
          '"I got lost, and they came and got me out, and I was in there one night and most of ' +
          'a day." She says it flatly, like a date. "You will have heard it as a funny story. ' +
          'I would rather you had not."\n\n' +
          '"In the square version I am screaming, and there are four men with ropes, and ' +
          'somebody\'s dog finds me. There was no dog. There were two people, one of them was ' +
          'Tyme, and I was sitting down with my back against a wall being extremely quiet ' +
          'because I had worked out that shouting was using me up."\n\n' +
          'She picks at the stump. "I do not mind it being told. I mind it being told wrong, ' +
          'because the wrong version is about being frightened, and the true one is about ' +
          'arithmetic."',
        effects: {
          flags: { [FLAGS.heardRescued]: true },
          journal: [
            {
              id: 'j.dilly',
              text:
                'Dilly was lost in the cave for a night and a day, and was found sitting still ' +
                'and keeping quiet on purpose. The version told in the square is wrong.',
            },
          ],
        },
      },
      {
        id: 'how_lost',
        label: 'how she got lost',
        aliases: ['rope', 'six paces', 'arithmetic'],
        available: (state) => f(state, FLAGS.heardRescued),
        response: () =>
          '"I let go of the rope to look at something." She holds up a hand before you can say ' +
          'anything. "Not in the dark. I had a light. I was fine. I let go of the rope, and ' +
          'then I walked six paces to see the thing better, and then I could not have told you ' +
          'which way I had come in."\n\n' +
          '"Six paces. That is the whole distance between fine and not fine, and nobody tells ' +
          'you that because it does not sound like a danger."\n\n' +
          'She taps the stump. "Keep the way out in your head as a thing with a shape. Not as a ' +
          'feeling. Feelings turn round when you do."',
        effects: {
          journal: [
            {
              id: 'j.dilly_rope',
              text:
                'Dilly let go of the rope and walked six paces to see something better. That ' +
                'was the whole distance between fine and lost.',
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
          '"So that is my advice and my one regret in the same sentence: go and look at it ' +
          'properly. With both feet still on the rope."',
        effects: {
          journal: [
            {
              id: 'j.dilly_relief',
              text:
                'Dilly let go of the rope to study the worn relief on the gallery\'s right-hand ' +
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
          '"Not of the cave." She pulls a boot on. "Everyone who has ever come to harm at that ' +
          'cave came to it by way of a decision they made. Including me. That is not comfort, ' +
          'it is just where the danger actually is."\n\n' +
          '"So be careful with your decisions. They are the only thing you are bringing in ' +
          'that can hurt you."',
      },
    ],
  },
  {
    id: 'aldren',
    name: 'Tyme',
    nouns: ['tyme', 'bay', 'aldren', 'man with the rope', 'keeper'],
    locationId: 'present.cave_path',
    listAs: c('Tyme, coiling rope and watching the sky'),
    appearance: () =>
      'Weathered, deliberate, with a coil of hemp over one shoulder and the stance of a man who ' +
      'has stood on this path in every kind of weather. He keeps the entrance. It is not a ' +
      'title anyone gave him.',
    greeting: () =>
      'Tyme finishes the coil before he speaks, which takes a while. "Right. Lantern. Good. ' +
      'Show me it lights."',
    topics: [
      {
        id: 'bench',
        label: 'what he does while you are inside',
        aliases: ['bench', 'wait', 'waiting', 'outside'],
        response: () =>
          'He looks at the bench as though he has not thought about it, which cannot be true.\n\n' +
          '"Sit there. Coil that." The rope. "Watch the slot."\n\n' +
          'He is quiet for a bit. "You get a feel for how long is long. Dilly was long. I had ' +
          'the rope off my shoulder and one boot in the dark before she came round the corner, ' +
          'and she was fine, and I sat back down and coiled it again."\n\n' +
          '"I will be on that bench when you come out. That is the whole of my job and I am ' +
          'very good at it."',
        effects: {
          journal: [
            {
              id: 'j.tyme_bench',
              text: 'Tyme sits on the bench by the mouth with his rope the whole time anyone is inside.',
            },
          ],
        },
      },
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
              id: 'j.bay',
              text:
                'Tyme: past the gallery pillar there is no rope, but both ways on come back to ' +
                'the pillar, and the cave mouth stays visible from the gallery.',
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
          '"For most of my life I have kept this path. Nobody has ever found a fifth room. I will ' +
          'say that plainly so nobody has to go looking for one on my account."',
        effects: {
          journal: [
            {
              id: 'j.layout',
              text:
                'Known layout: mouth, gallery, the echoing round room north, the small cut ' +
                'chamber east. Tyme says nobody has ever found a fifth room.',
            },
          ],
        },
      },
      {
        id: 'dilly',
        label: 'the night he went in after Dilly',
        aliases: ['rescue', 'dilly', 'lost girl'],
        available: (state) => f(state, FLAGS.heardRescued),
        response: () =>
          'He stops coiling. "Two of us. Not four, whatever the square says."\n\n' +
          '"She had done the one sensible thing available to her, which was to sit down and ' +
          'stop spending herself. Found her with her back to a wall and her hands in her ' +
          'sleeves, and she said *you took the scenic route* at me, which under the ' +
          'circumstances I ' +
          'thought was fair."\n\n' +
          'He starts coiling again. "She comes up and sits on that stump most weeks. I have ' +
          'never once asked her why and I would advise you to extend her the same courtesy."',
      },
      {
        id: 'come_back',
        label: 'coming back out for more gear',
        aliases: ['gear', 'supplies', 'return', 'preparation'],
        response: () =>
          '"You can come and go as you like. It is not a trial and nobody is counting." He ' +
          'nods down the hill. "People walk back down for a second lantern, a coat, their ' +
          'dinner. Chervil went back for her dinner and nobody thinks less of her."\n\n' +
          '"The only rule I keep is this one: tell me when you go in, and I will be here when ' +
          'you come out. That is the job."',
        effects: {
          journal: [
            {
              id: 'j.comeback',
              text:
                'Tyme: you can leave the cave and come back as often as you like. It is not ' +
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
          '"I have handed people a rope at that mouth for most of my life, and not one of them has ' +
          'come out of it with a power." He says it without any edge. "I am not telling you ' +
          'there is nothing. I am telling you I have never seen it, and I have had the best ' +
          'seat."\n\n' +
          'He looks up the hill. "Go in as yourself. Come out as yourself. If the village wants ' +
          'more than that from a child\'s birthday, the village can go in itself."',
      },
    ],
  },

  /* ================================================================ *
   * The cave mouth
   * ================================================================ */

  /* ================================================================ *
   * The square, earlier
   * ================================================================ */
  {
    id: 'sabra',
    name: 'Saffra',
    nouns: ['saffra', 'sabra', 'mason', 'woman', 'woman on the plank'],
    locationId: 'past.square',
    listAs: c('Saffra on the plank with a trowel'),
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
          'Nettle if you need a roof, she is the one with the goat on the path and she will ' +
          'talk at you about the goat."\n\n' +
          'Behind her, Fenn shifts the mortar board to his other hip, and some of it goes on ' +
          'his foot, and he does not notice.',
      },
      {
        id: 'cave',
        label: 'the cave on the hill',
        aliases: ['hill', 'absolution', 'the cave'],
        response: () =>
          '"The cave." She says it the way you would say *the barn*. "Aye. Lovage and his boys ' +
          'are in it now, cutting the stair down to the water. Third season on it."\n\n' +
          '"You can go up and look, everyone does. Young ones walk in on a dare and walk out ' +
          'again and are very pleased with themselves." She scrapes the trowel clean. "Mind ' +
          'where Lovage has the chalk lines and do not touch his mallet."',
        effects: {
          journal: [
            {
              id: 'j.saffra_cave',
              text:
                'Here the cave is ordinary. A man called Lovage and his sons are cutting the ' +
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
          'Fenn, helpfully: "Lovage calls it the wet hole."\n\n' +
          '"Lovage calls everything something. Do not learn your words off Lovage."',
        effects: {
          journal: [
            {
              id: 'j.no_name',
              text: 'Here the cave has no name. It is "the cave", or worse, Lovage\'s word for it.',
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
          'Saffra looks at you with the patience of a woman on a plank.\n\n' +
          '"Lanterns on a cord? Over the square? In this wind?" She laughs once. "Whose ' +
          'lanterns?"\n\n' +
          'You ask, more carefully, whether she has ever heard of the ' + m('Wanderer') +
          '.\n\n' +
          'It lands on nothing at all. Not fear, not caution, not the flicker people in your ' +
          'square get when the word comes up. She turns it over as a word she has not been ' +
          'given before, decides it is probably a ford-village thing, and hands it back.\n\n' +
          '"No," says Saffra. "Should I have?"\n\n' +
          'Fenn says, "Is it a dog?"',
        effects: {
          flags: { [FLAGS.heardNoProphecy]: true },
          journal: [
            {
              id: 'j.no_prophecy',
              text:
                'Nobody here has heard the word ' + m('Wanderer') + '. There is no vigil, no cord of ' +
                'lanterns, no plank by the well.',
            },
          ],
        },
      },
      {
        id: 'why_you_asked',
        label: 'why you asked',
        aliases: ['explain', 'what it says', 'the words', 'coming'],
        available: (state) => f(state, FLAGS.heardNoProphecy) && !f(state, FLAGS.recitedProphecy),
        once: true,
        response: () =>
          'She has stopped working. That is the thing you notice: the trowel is resting on the ' +
          'course and her hands are still, and you have been talking to her for a quarter of an ' +
          'hour and they have not been still once.\n\n' +
          '"You did not ask me that like somebody asking after a story," she says. "You asked ' +
          'me like somebody checking a date."\n\n' +
          'Fenn has come round the end of the plank and is standing where he can see your face.\n\n' +
          '"So." Saffra wipes her thumb along the trowel. "Something is coming. That is what you ' +
          'came down that hill to find out whether we knew." She says it flatly, without any ' +
          'drama in it at all, which is worse. "What is it, then. What are the words."',
        effects: {
          flags: { [FLAGS.askedForWords]: true },
        },
      },
      {
        id: 'took_it_back',
        label: 'taking it back',
        aliases: ['retract', 'unsay', 'never mind it', 'forget it'],
        available: (state) => f(state, FLAGS.recitedProphecy),
        once: true,
        response: () =>
          'You tell her to forget it. You tell her it is a thing people say where you come from, ' +
          'a rhyme, the sort of thing that gets chalked up at midwinter and taken down again, ' +
          'and that she should not write it on a board and she certainly should not read it out ' +
          'to anybody.\n\n' +
          'Saffra listens to all of it with her arms folded.\n\n' +
          '"Right," she says. "And do you believe it?"\n\n' +
          'You do not answer that quickly enough.\n\n' +
          '"Thought so." She puts the board inside the doorway of the half-built workshop, out ' +
          'of the weather, where a thing goes that you are keeping. "Then it stays."',
        effects: {
          flags: { [FLAGS.triedToRetract]: true },
          journal: [
            {
              id: 'j.retract',
              text:
                'I tried to tell Saffra to forget the words. She asked whether I believed them, ' +
                'and then she put the board somewhere dry.',
            },
          ],
        },
      },
      {
        id: 'lovage',
        label: 'the foreman up at the cave',
        aliases: ['lovage', 'foreman', 'crew', 'get in', 'workings'],
        available: (state) => state.discovered.includes('topic.sabra.cave'),
        response: () =>
          '"Lovage? He is up there now. He will be up there when it is dark and he will be up ' +
          'there before I am tomorrow." She says it with the particular tiredness of somebody ' +
          'describing a man she likes. "You will not get past him into the workings. Not to ' +
          'look, not to be nosy, and not because you asked nicely."\n\n' +
          'You ask whether anything would.\n\n' +
          '"Water." She laughs at your face. "I am not being clever. His barrel split four days ' +
          'ago and he will not send a man down for water because that is a man off the stone, ' +
          'so they are working a hole in a hill on what they can carry up in the morning, and ' +
          'they are all in a filthy mood about it."\n\n' +
          'She nods at the wall behind you, and the yoke of empty skins propped against it. ' +
          '"Those are nobody\'s. The spring is up past the tree."',
        effects: {
          flags: { [FLAGS.knowsWaterNeeded]: true },
          journal: [
            {
              id: 'j.lovage_water',
              text:
                'Lovage the foreman will not let a stranger into the workings. His water barrel ' +
                'split four days ago and he will not spare a man to fetch more. There are empty ' +
                'skins by the wall and a spring up past the tree.',
            },
          ],
        },
      },
      {
        id: 'walk_me_up',
        label: 'asking her to walk up with you',
        aliases: ['escort', 'come with me', 'vouch', 'take me up'],
        available: (state) => f(state, FLAGS.recitedProphecy) && !f(state, FLAGS.worksiteAccess),
        response: () =>
          'She looks at the course she is halfway through, and at the light, and at you.\n\n' +
          '"You are asking me to leave a wet course and walk up a hill," she says. "On the day ' +
          'you told me the world has a thing coming for it."\n\n' +
          'Then she wipes the trowel, lays it on the plank, and climbs down.\n\n' +
          'The walk up takes no time at all and she does not ask you a single question, which ' +
          'you understand is deliberate. At the mouth she goes in ahead of you, and there is a ' +
          'short exchange out of your hearing in which Lovage says something short and she says ' +
          'something shorter.\n\n' +
          'She comes back out. "Go on. Touch nothing with an edge on it and come out when he ' +
          'tells you to." And, over her shoulder, going back down: "He is not wrong about you. ' +
          'He is just wrong about what you are."',
        effects: {
          flags: {
            [FLAGS.saffraEscort]: true,
            [FLAGS.worksiteAccess]: true,
          },
          journal: [
            {
              id: 'j.saffra_escort',
              text:
                'Saffra came off her wall and walked me up to the mouth and said something to ' +
                'Lovage that I was not allowed to hear. I can get into the workings.',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'pell',
    name: 'Fenn',
    nouns: ['fenn', 'pell', 'boy'],
    locationId: 'past.square',
    listAs: c('Fenn, holding the mortar board badly'),
    appearance: () =>
      'Eleven or twelve, barefoot, with mortar on one foot and no awareness of it. He is ' +
      'holding the board at the exact angle that will cost him, and watching you instead.',
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
          'He says it has always been there, in the tone eleven-year-olds use for *always*, and ' +
          'then, when you ask again, he says his grandfather climbed it, so it must be older ' +
          'than his grandfather, which he clearly regards as the outer limit of time.',
        effects: {
          flags: { [FLAGS.sawTree]: true },
          journal: [
            {
              id: 'j.tree_age',
              text: 'Fenn says the great tree is older than his grandfather, who climbed it.',
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
          '"It\'s all stair now, Lovage has cut it right down, and there\'s a basin at the ' +
          'bottom with water in and Cress put a coin in it and Lovage shouted." He brightens. ' +
          '"You can walk the whole thing before a candle burns down. It\'s not even far."',
      },
      {
        id: 'spoil_gap',
        label: 'how a boy gets past the foreman',
        aliases: ['gap', 'spoil', 'sneak', 'way in', 'behind the heap'],
        /*
         * Available on required-path state, so neither recovery route can be
         * lost by not having exhausted an optional topic earlier. Talking to
         * Fenn at all is enough, and the chapter forces a conversation with
         * him nowhere: it offers two independent routes and both open here.
         */
        available: (state) =>
          !f(state, FLAGS.worksiteAccess) &&
          (f(state, FLAGS.recitedProphecy) || f(state, FLAGS.knowsWaterNeeded)),
        response: () =>
          'Fenn puts the mortar board down, which he has not done once, and looks at you with ' +
          'the expression of a boy being asked for the one thing he actually knows.\n\n' +
          '"You don\'t *get past* him," he says. "That\'s the whole thing about him."\n\n' +
          'Then, lower: "There\'s a gap behind the spoil. Where they\'ve heaped the waste up ' +
          'against the north wall, at the bottom, by the basin. It\'s not hidden, it\'s just ' +
          'behind. Cress got through it and Lovage never knew and Cress is fatter than you."\n\n' +
          'He picks the board back up. "You go down the stair like you\'re going to look at the ' +
          'water, because everybody goes to look at the water. Then you go round the heap."\n\n' +
          'A beat. "If he catches you he will put you out on the track and he will not shout. ' +
          'That\'s worse."',
        effects: {
          flags: {
            [FLAGS.fennRoute]: true,
            [FLAGS.worksiteAccess]: true,
          },
          journal: [
            {
              id: 'j.fenn_gap',
              text:
                'Fenn says there is a gap behind the spoil heap at the bottom of the stair, ' +
                'by the basin, that the boys use. Go down as if to look at the water, then ' +
                'round the heap.',
            },
          ],
        },
      },
      {
        id: 'truth',
        label: 'where you are really from',
        aliases: ['truth', 'tell him', 'home', 'really'],
        available: (state) => f(state, FLAGS.recitedProphecy),
        once: true,
        response: () =>
          'You tell him. Not well — there is no good order to put it in — but you tell him that ' +
          'you were born in that house, the one that is not built, and that you have sat on the ' +
          'stump that is his tree, and that this morning you were somewhere else entirely and ' +
          'it was the same square.\n\n' +
          'Fenn does not laugh and he does not run and tell anybody. He thinks about it with ' +
          'his whole face.\n\n' +
          '"Is the swing still there?"\n\n' +
          'You tell him no.\n\n' +
          '"Oh," says Fenn, and that is the part that lands on him, out of all of it. Then: ' +
          '"Don\'t tell Saffra the house bit. She\'ll want to know who built it wrong."',
        effects: {
          flags: { [FLAGS.toldFennTruth]: true },
          journal: [
            {
              id: 'j.fenn_truth',
              text:
                'I told Fenn where I am from. He believed me, and the part that upset him was ' +
                'that the swing is gone.',
            },
          ],
        },
      },
    ],
  },

  /* ================================================================ *
   * The workings
   * ================================================================ */
  {
    id: 'lovage',
    name: 'Lovage',
    nouns: ['lovage', 'foreman', 'mason', 'man in the mouth'],
    locationId: 'past.entrance',
    listAs: c('Lovage, sitting in the mouth with his arms folded'),
    appearance: () =>
      'A short, wide man of about fifty with lime burns on both forearms and stone dust in ' +
      'every crease of him. He is sitting on an upturned basket in the mouth of his own ' +
      'workings doing absolutely nothing, which is clearly costing him more than the work ' +
      'would.',
    greeting: (state) =>
      f(state, FLAGS.lovageDistrust)
        ? 'He sees you coming up the track and gets off the basket, which is not a welcome.\n\n' +
          '"No," says Lovage, before you have said anything at all.'
        : 'He watches you come up the last of the track without moving his head.\n\n' +
          '"You are the one from the ford," he says. "You have had a look. Good. That is the ' +
          'mouth, that is the stair, there is water at the bottom. Now you have seen it."',
    topics: [
      {
        id: 'why_stopped',
        label: 'why nobody is working',
        aliases: ['stopped', 'sitting', 'barrel', 'water', 'thirsty'],
        response: () =>
          'He tips his head back at the dark behind him without looking at it.\n\n' +
          '"Barrel split." He holds up four fingers. "Four days. I have five men and a boy down ' +
          'there on what they can carry up at first light, and by the middle of the day they are ' +
          'making the kind of mistakes you cannot take back out of stone."\n\n' +
          '"So we stop at the middle of the day. Which means the job runs into next season, ' +
          'which means I have to go and explain that to people who do not cut stone." He ' +
          'resettles himself on the basket. "And no, I will not send a man down to the spring. ' +
          'A man on a path is a man off the face."',
        effects: {
          flags: { [FLAGS.knowsWaterNeeded]: true },
          journal: [
            {
              id: 'j.lovage_barrel',
              text:
                'Lovage\'s water barrel split four days ago. Five men and a boy are working on ' +
                'what they carry up at dawn, and he will not spare anybody to fetch more.',
            },
          ],
        },
      },
      {
        id: 'let_me_in',
        label: 'asking to go in',
        aliases: ['in', 'let me in', 'look', 'see the workings', 'please'],
        available: (state) => !f(state, FLAGS.worksiteAccess),
        response: (state) =>
          f(state, FLAGS.lovageDistrust)
            ? '"I said no, and you have made me say it twice."\n\n' +
              'He is not angry. That is the difficulty. He is standing in his own doorway being ' +
              'reasonable at you.\n\n' +
              '"Four days we have been dry and nothing else has been wrong. You come up the ' +
              'track, you stand in my square telling people what is going to happen to them, ' +
              'and now my line has moved and Caraway heard a door shut before the wind came."\n\n' +
              '"I do not say you did it. I say I do not want you in my hole." He sits back down. ' +
              '"Go and be somebody else\'s weather."'
            : '"No." He says it without heat, the way you would say *east*.\n\n' +
              '"It is not a cave down there yet, it is a job. There are chalk lines that mean ' +
              'something and a panel I have got down to a finger thick and a pillar I would ' +
              'rather you did not even look at hard." He folds his arms. "You are not a mason ' +
              'and you are not from here, and I have no idea which of those worries me more."\n\n' +
              '"Come back when you are useful to me."',
      },
      {
        id: 'pillar',
        label: 'the pillar he mentioned',
        aliases: ['pillar', 'column', 'support', 'roof'],
        response: () =>
          'The question gets you the first thing resembling approval you have had off him.\n\n' +
          '"That," he says, "is the roof."\n\n' +
          'He points up at the hill over both your heads with one blunt finger. "Not the stone ' +
          'over your head. *That.* We took the room out from round it and we left it standing ' +
          'and everything above us is on it. One pillar, because that is what the rock gave ' +
          'us."\n\n' +
          '"Keep your mallet off it. Keep your elbows off it. If I see a chisel within a hand ' +
          'of it I will take the chisel and the hand." He is entirely serious and then, ' +
          'abruptly, less so. "I do not like it. I have told people I do not like it. I have ' +
          'been told that the hill has had an opinion about this for longer than I have."',
        effects: {
          flags: { [FLAGS.pillarWarning]: true },
          journal: [
            {
              id: 'j.lovage_pillar',
              text:
                'Lovage: the single worked pillar in the workings is the roof. They cut the ' +
                'room out from round it and left it standing, and everything above is on it. ' +
                'He does not like it.',
            },
          ],
        },
      },
      {
        id: 'cut_the_dish',
        label: 'asking him to cut the middle dish',
        aliases: ['cut', 'dish', 'middle', 'outline', 'second'],
        available: (state) => f(state, FLAGS.knowsSettings),
        response: () =>
          'You ask him for the middle one. The chalk ellipse with the cross in it, at the ' +
          'height of your chest. You ask whether it could be cut.\n\n' +
          'He looks at you for a long moment, and what is in his face is not suspicion. It is a ' +
          'man doing a sum.\n\n' +
          '"That is a week," he says. "Two men, a week, on a dressed seat in a panel I have ' +
          'already got down to a finger thick, which is the most dangerous bit of stone in the ' +
          'hill. And it is the last thing on the job, and it is the last thing on the job ' +
          'because when it is cut we are finished and the scaffold comes down."\n\n' +
          '"So. A week with two men." He lets that sit. "And I would not give you an hour."\n\n' +
          'Then, because he is not a cruel man and he has watched you look at that wall: "What ' +
          'is it you think is in there?"\n\n' +
          'You find you have no answer that would survive being said out loud.',
        effects: {
          journal: [
            {
              id: 'j.lovage_refuses',
              text:
                'Lovage will not cut the middle dish. A week with two men on the thinnest ' +
                'stone in the hill, and it is the last job because finishing it ends the work.',
            },
          ],
        },
      },
      {
        id: 'wrongnesses',
        label: 'the things that have been going wrong',
        aliases: ['wrong', 'line', 'strange', 'moved', 'door'],
        available: (state) =>
          f(state, FLAGS.symptomSound) || f(state, FLAGS.symptomMark) || f(state, FLAGS.symptomWeather),
        response: () =>
          'He does not pretend not to know what you mean, which you had been counting on.\n\n' +
          '"My line has moved," says Lovage. "A line I snapped myself, and I checked it, and ' +
          'then I checked it with a different string because I thought I had gone soft. It has ' +
          'moved a hand."\n\n' +
          '"Caraway heard a door shut and then felt the wind that shut it. He is not a fanciful ' +
          'man. He is barely a talkative one."\n\n' +
          'He spits, neatly, off to the side. "Now. I have been in holes in the ground for ' +
          'thirty-one years and holes in the ground do strange things and most of them are ' +
          'water. I have had a working breathe at me. I have had one knock."\n\n' +
          '"I have not had one be in the wrong order." He looks out and down the track, at the ' +
          'roofs. "I do not know what that is. I am not going to pretend I do, and I would not ' +
          'believe a man who said he did."',
        effects: {
          journal: [
            {
              id: 'j.lovage_wrong',
              text:
                'Lovage: his chalk line has moved a hand\'s width, and Caraway heard a door shut ' +
                'before the wind that shut it. Thirty-one years underground and he has never ' +
                'had one be in the wrong order. He says he has no idea what it is.',
            },
          ],
        },
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
export function availableTopics(
  person: PersonDef,
  state: GameState,
  heard: string[]
): PersonDef['topics'] {
  return person.topics.filter((topic) => {
    if (topic.available && !topic.available(state)) return false;
    if (topic.once && heard.includes(topic.id)) return false;
    return true;
  });
}
