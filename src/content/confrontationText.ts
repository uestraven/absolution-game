import { m } from './markup';

/**
 * The confrontation, the sacrifice and the epilogue.
 *
 * Second person present, as everywhere else, until the epilogue — which is
 * explicitly signalled and is not the hero doing anything, because the hero is
 * dead by then.
 *
 * Two people who are the same person, who do not sound the same. The earlier
 * self is sixteen and has had the best day of their life for about twenty
 * minutes; they are frightened, fast, and absolutely certain. The returning
 * hero is sixteen and has had three days and a hundred years and has stopped
 * being able to say anything in a straight line.
 *
 * Nothing in here explains the mechanism. Neither of them knows. The earlier
 * self asks the only question that matters — *how* — and the answer is that
 * nobody knows, and they hear that, and it is not enough for them, and they are
 * not being stupid.
 */

/* ------------------------------------------------------------------ *
 * Talking
 * ------------------------------------------------------------------ */

export const IDENTITY_CLAIMED = `You tell them who you are.

It comes out badly. You have had three days to think of a way to say it and what you actually say is your own name, and then your mother's name, and then the thing about the bread on the stool this morning, which is not an argument, it is just a thing only two people in the world know.

They do not move away from the pillar.

"Anybody could have been told that," they say. Their voice is doing something at the edges. "Somebody could have told you all of that."

And then, quieter, because they are not stupid and they have been looking at your face the whole time: "Who *told* you that."`;

export const IDENTITY_AGAIN = `You say it again. It does not get better with practice.

"I heard you," they say.`;

export const LANTERN_SHOWN = `You hold your lantern up.

Then you nod at the alcove, and they look, and for a long moment nobody says anything at all.

Two hooded lanterns. Tin, dented along the same shoulder, the same horn pane, the same sliding hood. The same striker on the same short chain off the base, because Oreg's father made forty of them one winter and the dent is where this one went off the windowsill when you were nine.

They look at theirs, in the dish, burning. They look at yours, in your hand, burning.

"That's mine," they say.

"Right." They say it twice. "Right."

Then they wipe their face with the back of their wrist.

"Then it works," says ${m('your own voice')}, sixteen years old and steadier than it has any business being. "Then the cave *works*."`;

export const NO_LANTERN_TO_SHOW = `You go to hold your lantern up and you are not holding it.

You put it down somewhere in this room, which was a reasonable thing to do with both hands full and is not a reasonable thing to have done now.`;

export const LANTERN_AGAIN = `You hold it up again. They do not look at it.

"I know," they say. "I said I know."`;

export const JOURNAL_SHOWN = `You hold the journal open in front of them, at the page with the date on it, and they take it off you with both hands and read it properly, the way you would read a thing you were going to be asked about.

They are quick. You remember being this quick.

"This is you going forward," they say, with a finger on it. "Here. You went *forward*. From a hole in the ground a hundred years back, and you had a choice of holes, and you went forward."

They give it back.

"I am not going forward. I am going down there, and I am coming back out, and I am coming back out *here*." A beat. "You did not do that. So I am not doing what you did."

It is the best argument either of you makes, and it is wrong, and you cannot say why.`;

export const JOURNAL_AGAIN = `They have read it. They have read the date twice.

"It is your handwriting," they say. "I know. That is not the part I am arguing with."`;

export const FUTURE_DESCRIBED = `You tell them what the valley looks like.

Not all of it. You tell them about the well, capped with a slab and sealed round the edge, and the pump bolted through it, and the four people queuing with one bucket each and somebody keeping the count on a stick. You tell them that the workshop is three walls and two goats. You tell them that the tree at the turn is gone, and the turn is gone, because the whole shoulder of the hill came down.

You tell them that there were thirty people in the square.

They have stopped moving.

"Thirty," they say.

"Thirty."

"Out of—" They cannot finish it, so you do.

"Two hundred and eleven."

Something goes out of their face and comes straight back into it.

"${m('How')}," they say. "How does that happen. What *does* that."

And you have had three days to find an answer to that and there is not one. Nobody in that village knows. Four hands on a hide roll have four reasons and all of them are wrong in different directions and the woman who keeps the roll says so herself.

"I do not know," you say.

They look at you for a second longer than is comfortable.

"No," they say. "You don't."`;

export const FUTURE_AGAIN = `"You told me," they say. "Thirty. I heard you."`;

export const ORIGIN_TOLD = `So you tell them the rest of it, because there is nothing else left to tell.

That there is no prophecy. That there never was one. That a hundred years ago a frightened sixteen-year-old stood in that square in front of a woman on a scaffold plank and said four lines out loud because she asked, and she wiped her hands and went and found a board and a stub of char and wrote them down, and that board became the plank by the well, and the plank became midwinter, and midwinter became the thing that is currently making the whole village look at them like that.

"The words are mine," you say. "I said them. There was nowhere for them to come from before I said them."

They go absolutely still.

It takes them about four seconds.

"Then the last one's mine as well," they say.

*One who braves the Cave of Absolution will have the power to turn it aside.*

"That's not a prophecy. That's a—" They are groping for the word, and they find it. "That's *instructions*. Somebody went in and came back out with the power. You just told me it was me. Why are you standing in front of the wall?"`;

export const ORIGIN_AGAIN = `"You said," they say. "The words are yours. I have got that."

They have not moved off it.`;

export const THEY_DECIDE = `They stop arguing.

Not shouting. Not crying. They look past you at the fan of light on the patterned wall, and at the line in it that is reading as a shadow instead of a cut.

"Eleven days," they say. "There is a cord of lanterns up over that square and nobody has lit them and Marjoram is making bread for tomorrow."

They pick their feet up off the floor, properly, the way you stand up when you have decided.

"I am going to go and get it and I am going to come back."

And they move.`;

/* ------------------------------------------------------------------ *
 * The scene holding
 * ------------------------------------------------------------------ */

export const REACH = [
  `They come round the pillar on the side you are not on. You get a hand out and they go under it.

Three steps from the wall now, with the lantern still in the alcove behind them throwing the fan up over their shoulder.`,

  `They get past you again. They are not fighting you — that is the awful part, they are *going round* you, the way you go round somebody in a doorway — and now they are at the wall with one hand flat on the patterned stone, feeling along the row for the top of the seam.

They find it. You watch them find it.`,

  `Both hands on the wall above the seam, shoulders set, weight going forward onto it.

The slab moves. Not much — a thumb, maybe, grinding on the pivot cut into the floor — and then it stops, because it is a slab of worked stone the size of a door and they are sixteen and leaning on it with both arms.

They put their head down and set their feet.`,
] as const;

export const REACH_HELD = `They are already at the wall with both hands on it, leaning, feet set.

Nothing more is going to happen to the geometry of this room until one of you does something about it.`;

/* ------------------------------------------------------------------ *
 * Hands
 * ------------------------------------------------------------------ */

export const BLOCK_EARLY = `You put yourself between them and the patterned wall.

They watch you do it, and they do not try to get past, because they have not decided to yet. But they clock it — where you are standing, and what you are standing in front of — and whatever they were about to say they do not say.

"Why are you standing there," they say.`;

export const BLOCK_RUSH = `You get between them and the wall again, both arms out, and for a second it works.`;

export const LAMP_TAKEN = `You reach past them into the alcove and lift their lantern out of the dish.

It works immediately and completely. The fan of light comes off the patterned wall, the room goes flat and ordinary, and the seam stops existing — not hidden, not shadowed: gone, the way it was gone for every person who ever stood in this room with a torch in their hand.

For about two seconds you think you have solved it.

Then they take it back off you. Not violently. They get both hands on it and you let go, because the alternative is two people pulling on a lit lamp, and they put it back in the dish and crouch down and ${m('pull the striker round on its chain')} and scrape it, and it did not even go out.

It is bolted to the base. It is bolted to the base of yours too. You have had it in your hand all day.`;

export const LAMP_TAKEN_AGAIN = `You take it out again and they put it back, and this time neither of you says anything about it.`;

export const RESTRAIN_FIRST = `You get hold of them.

Both arms round from behind, hands locked, the way you would hold somebody out of a fight — and for a moment you have them, and they go rigid and make a sound you have never heard yourself make.

Then they get a heel down and twist and you lose them, and the reason you lose them is simple and you knew it before you tried: they have had breakfast and eleven days of being looked after and both eyes. You have had three days, a hundred years, a hill, and a hole in your face that is bleeding again now.

You are the same height. You are not the same strength any more.`;

export const RESTRAIN_AGAIN = `You get hold of them again. It goes the same way and it costs you more.`;

/* ------------------------------------------------------------------ *
 * Leaving, and waiting
 * ------------------------------------------------------------------ */

export const LEAVE_EARLY = `You get two steps into the squeeze and stop.

West is the gallery, and the rope, and the slot of sky, and a man on a bench with a coil of hemp who will stand up when he sees you. And behind you, in that room, there is a sixteen-year-old with a lit lamp and four lines of their own words on a plank at the bottom of the hill, and the moment you are out of the doorway they are going through that wall.

You came a hundred years for the next three minutes.

You go back in.`;

export const LEAVE_RUSH = `You get one step into the squeeze and you can hear stone grinding on stone behind you.

No.`;

export const LEAVE_AFTER = `You get as far as the squeeze.

Then you stand in it for a while with one hand on each side of the rock, and you think about Tyme on the bench with his rope, and what he will do with his face when he sees you, and what he will do with the rest of his life once somebody has gone down and looked in this room.

And you think about the plank by the well — your four lines, in Saffra's careful hand, a hundred years rubbed into the board — promising two hundred and eleven people that whoever braves this cave gets the power to turn it aside. It says it every midwinter. It will go on saying it to every sixteen-year-old in that square for as long as the words last.

Walking down this hill does not take that plank down.

You go back in.`;

export const LEAVE_CLOSED = `The squeeze is a hand's width of air with a hill sitting on it.

That stopped being a way out two blows ago, and you knew it when you swung.`;

export const WAIT_EARLY = `You wait.

Nothing in this room is in a hurry except the person in it with you, and they are not in a hurry yet either. The lamp burns in the dish. The fan of light sits on the wall. Somebody's breathing is too loud and it might be yours.`;

export const WAIT_RUSH = `You wait.

You have time. That is the horrible part, and you would not have believed it this morning: you have as much time as you want, standing in a four-pace room with a mallet in your hand, and not one second of it helps.

They are still going for the wall. You are still the only thing between them and it.`;

export const WAIT_AFTER = `You wait, in a room with a lamp burning in an alcove and nobody to have put it there.

Nothing comes. Nothing is going to come. There is a thing that still has to be done and there is one person left in this hill who can do it.`;

/* ------------------------------------------------------------------ *
 * The killing
 * ------------------------------------------------------------------ */

export const KILL_TOO_EARLY = `You have been in this room for about nine seconds and you have not said a word to them.

Put the mallet down. Or do not put it down, but say something first. You did not come a hundred years to walk in and do that to somebody's back.`;

export const KILL_STILL_TALKING = `They are standing behind a pillar on the far side of a room four paces across, talking to you.

You cannot. Not while they are *talking* to you. You have tried to work out, on three days of walking, what it would take, and it turns out that what it would take is for them to stop.`;

export const KILL_UNTRIED = `You get the mallet up behind them and your arm does not finish it.

Not yet. Not when you have not laid a hand on them. You are standing in a four-pace room with both arms working and their lamp in a dish an arm's length away, and you have not so much as tried.

Try to stop them. Get hold of them, or get the light off that wall, or put yourself in front of it. Then see what you have got left.`;

export const KILL_NO_TOOL = `Your hands are empty.

You are not going to do this with your hands. You have thought about that too, somewhere on that hillside, and the answer was no.`;

export const ALREADY_DEAD = `There is nothing left to do to them.`;

export const THE_KILLING = `You do it while their back is turned and their weight is on the wall.

One blow, with a mason's mallet, at the back of the head, by somebody who has watched men swing one for three days and has carried this one up a hill knowing what it was for.

They go down against the patterned stone and slide, and their knees fold under them wrong, and that is all. There is no noise to it worth the name. The slab they were leaning on settles back the thumb it had moved and the grinding stops.`;

export const AFTER_THE_KILLING = `You stand there for a while.

The lamp is still burning in the alcove. The fan of light is still on the wall, and the seam is still in it, reading as a shadow instead of a cut, four paces from where you are standing and exactly as findable as it was.

You are still here. You notice that, in a flat way, with your hand on the pillar: you have not gone anywhere and nothing has come to collect you, and the thing lying against the wall is sixteen years old and wearing your shirt, and you are still standing up.

You are going to have to do the rest of it yourself.

Somewhere up the hill and outside, a man is sitting on a bench with a coil of rope across his knees, waiting for you to come out.`;

/* ------------------------------------------------------------------ *
 * The pillar
 * ------------------------------------------------------------------ */

export const PILLAR_NO_TOOL = `You put both hands flat on the pillar and lean on it, which does nothing, because it is a square-dressed pillar of limestone holding up a hill.

You are going to need the mallet.`;

export const PILLAR_ALIVE = `You get the mallet up and then stop, because there is somebody in this room who would be under it.

Not like that. Whatever else is true, not like that.`;

export const PILLAR_BLOW = [
  `You swing at the base of it, where the crack is.

The mallet goes in square and the sound is not a sound, it is a thing that happens in your chest. The crack opens — you can see it open, a line going from a hair to a finger-width while you watch — and a fan of grit comes off the foot of the pillar onto the floor.

Then the hill speaks.

It is not loud. It is a long settling somewhere above the ceiling, moving from one side of the room to the other, like somebody turning over in a bed upstairs. Dust comes down off the roof in three or four places and hangs in the fan of light.

The lamp in the alcove goes on burning.`,

  `The second one takes a piece out of it.

A wedge of dressed stone the size of your forearm comes away from the base and goes over on the floor, and the pillar settles onto what is left of itself with a crack you feel through your boots, and then the roof comes down a hand.

Not falls. *Down a hand*, all of it, at once, with a noise like a door closing in a much bigger building than this one — and the squeeze west that you came in by is now a hand's width of air with a hill sitting on it, and you can see daylight in it, and you could get two fingers through.

You stand still for a moment.

The pillar will go on the next one. The crack is on this face, so the next one has to be struck from in here, from under the span. And the squeeze is shut.

One more swing, from where you are standing, and the hill comes down on this chamber and the fold under it and everything in it.

${m('Including you')}.`,
] as const;

export const PILLAR_READY = `The pillar is standing on about a third of what it had. The crack has gone all the way through the base and opened, and there is a pile of its own stone round its foot, and it is leaning about a thumb off true.

One more. From here. With you here.`;

export const COMMIT_QUESTION = `This is the one. It brings the roof down on this room with you in it, and the squeeze is already shut.`;
export const COMMIT_YES = 'Swing';
export const COMMIT_NO = 'Not yet';

export const COMMIT_DECLINED = `You lower the mallet.

Nothing in this room is going anywhere. It will be exactly this when you pick it up again.`;

export const THE_SACRIFICE_OPEN = `You take your time over the last one, which surprises you.`;

/** Only when it is still in hand. A player who put it down already has. */
export const THE_SACRIFICE_LAMP = `You set your own lantern on the floor by the pillar, where it will be no use to anybody.`;

export const THE_SACRIFICE = `You look at the patterned wall, and at the line in it reading as a shadow. You look at the lamp in the alcove and do not look at what is lying under it.

Then you set your feet where Lovage put his, a hundred years ago, in a room that was three-quarters finished, and you swing.

The pillar goes.

It does not topple. It bursts outward at the base and loses its footing and the entire weight of the hill comes down through where it was, and the ceiling arrives, and the last thing in the room with any light in it is the alcove.`;

export const THE_END_OF_THE_CAVE = `Under the hill, in the dark, the roof of the deep chamber comes down into the basin, and the basin comes down into the fold.

What happens to the fold is not a thing anybody will ever write down. Nobody is going to stand in that room again, because that room is not a room; it is a seam of crushed limestone under four hundred thousand tons of hill, and the water that used to stand in a cut basin at the bottom of it has gone off somewhere into the rock to be ordinary.

It does not close like a door. It stops being a place.

The hill goes on moving for a while after that, downward and outward, taking the gallery and the crawl and the echo chamber and the squeeze and the worked stair, and then the mouth, and then the overhang above the mouth, and then it stops.

It takes about nine seconds.`;

/* ------------------------------------------------------------------ *
 * The epilogue
 * ------------------------------------------------------------------ */

export const EPILOGUE_HEADING = 'Afterwards';
export const EPILOGUE_SUBHEADING = 'The village, that evening and after';

export const EPILOGUE = `— The village, that evening and after —

The sound reaches the square at dusk and everybody comes out of doors at once, which is not a thing that happens, and stands in the middle of the hard-packed earth looking west at the hill with their hands full of whatever they were holding.

Marjoram has dough on both arms to the elbow. She does not go back in for four hours.

Tyme is on the bench when it happens, because he is always on the bench, with the coil over his knees and the slot of sky in front of him. What he says, afterwards, to the three people who ask him and the many who do not, is that the slot shut. Not fell in. Shut, the way a mouth shuts.

He goes up to it in the dark with the rope and a lantern and he gets as far as a slope of raw stone and rubble with grass still on top of it, forty feet of hill where the overhang used to be, and he digs at it with his hands until Sage comes up and puts her coat on him and makes him stop.

He goes back the next day with eleven people and shovels. He goes back the day after that with four. He goes on his own after that, for a long time.

---

Somebody is missing, and the whole square knows exactly who.

There is a name. There is a house with a window that somebody put a lantern on the sill of yesterday morning, and a stool with bread on it that nobody has cleared, and parents who have to be told, and a bakehouse that does not open for a week.

They do not get a body. They do not get an account. What the village has is the eleventh day of the vigil, and a sixteen-year-old who went up that hill at dusk with a lantern because they were allowed to, and a hill that came down on them.

Parsie, who is eleven, stops orbiting. He is not thrilled about anything for a long while, and when he is eleven and a bit he asks Sage whether the plank was about it, and she tells him the truth, which is that she does not know.

---

The rite ends, because there is nothing left to walk into.

There is no vote about it and no announcement. The strung lanterns come down off the cord in the autumn because the cord is in the way of a roof repair. The bowl of salt sits on the well-cap until the following spring and then somebody uses the salt.

Sage puts the Wanderer-words in the chest with the midwinter minutes. Underneath them, in her own hand, she writes: ${m('They came true')}.

Then she sits with the pen a while longer and does not write anything else.

---

A hundred years later, in the same square, at about the same time of the afternoon:

The well has a bucket on a rope and no cap on it. There are two hundred and sixty-one people, and Hyssop's great-great-granddaughter keeps the number on the back of the plank, and corrects it when somebody is born.

At the turn of the track above the roofs, where a stump used to be and then was not, there is a tree. A whole one, in leaf, big enough to shade a cart. Somebody has hung a swing on the low limb, and there is a bare patch underneath it where the grass has been kicked off by feet.

And the ${m('sky is doing things')}.

Weather comes over the ridge from the north all afternoon in long grey bands with light between them, dragging shadows across the valley floor, and nobody looks up at it, because why would they. It rains for twenty minutes and stops. It will rain again tomorrow.

Nobody in that square has ever heard of the Cave of Absolution. There is a hill where it was, with grass on it, and sheep.`;

export const ENDING_MARKER = `— The end —

That is the whole of it. Four chapters, two of them, and one hill.

You can read the ending again, export your save, or start a new game — and if you want to go back to the moment you came through that wall and try the confrontation differently, Settings will take you to the checkpoint at the start of the chapter.`;
