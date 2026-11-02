import { m } from './markup';
import { prophecyBlock } from './prophecy';

/**
 * Set-piece narration. Second person, present tense.
 *
 * Nothing here states or implies the story's larger reveals. The mechanism
 * behind any of it is never explained: there are observations and there are
 * characters' theories, and no narrator, inscription, builder or journal entry
 * stands in for a scientist.
 */

export const TITLE = 'Absolution';
export const SUBTITLE = 'The opening chapters';

export const SELECT_PROMPT = `You turned sixteen at some point in the night, which means that today you are allowed into the cave.

Who are you?`;

export const OPENING = `You wake up sixteen.

Nothing about the room has changed to mark it. The same angle of light across the same floorboards, the same cold patch where the flue is. The difference is entirely administrative: yesterday you were not allowed into the Cave of Absolution, and today you are, and the village has had the better part of a year to look forward to telling you so.

Somebody has been up before you. There is bread on the stool. The shutter is already hooked back.

And there is a lantern on the windowsill, which is not where lanterns live.`;

export const OBJECTIVES = {
  rite: 'Undertake the rite of the Cave of Absolution.',
  passage: 'Follow the passage that nobody else found.',
  crossed: 'Get out of the cave and find the village.',
  /** Once the hero has worked out where, rather than what, they are. */
  home: 'Find the way back to your own village.',
  /** Once they know the cave has the answer and Lovage has the cave. */
  worksite: 'Get into the part of the workings Lovage has closed to strangers.',
  /** Once the villagers have asked what the words are. */
  recite: 'Answer them.',
  /** Once the three positions are understood. */
  settings: 'Use the one position you can light, and hope.',
  /** The future arrival, and the end of what is built. */
  future: 'Find out what happened here.',
} as const;

export const CROSSING = `You do not jump, and you do not fall. You put a hand flat on the rim, and then a foot over it, the way you would get into a cold river in the dark — testing for a bottom you have already been told is not there.

There is no surface to break.

Your foot goes through where the water should be and keeps going, and the cold of it is not cold, it is the feeling of a door opening somewhere behind your ribs. The hush of the big room comes up around you all at once and is not above you any more; it is the room you are in. Somewhere in it a bird crosses, unhurried, in daylight.

You go down with both hands out and nothing to hold.

Then stone. Flat, dry stone under your palms, and the ordinary ache of landing badly from a height of about your own waist.

You are kneeling on the floor of the chamber.

You are kneeling on the floor of a chamber.`;

export const THRESHOLD_SPENT = `You crouch at the rim and put your hand in.

Water. A hand deep, cold, with silt under it that clouds and settles. Your fingers find the cut stone of the bottom almost at once, and the tool marks on it, and a coin.

Whatever you came down through is not here. Not closed, not hidden — not here, the way weather is not in a room. You sit back on your heels and let that be true.`;

/**
 * The realisation in the square. This used to be where the prototype stopped;
 * it is now the hinge into the rest of the chapter, so it ends on a problem
 * rather than on a full stop.
 */
export const ENDING = `You do not answer her.

You stand in the square with your hand still half-raised from a question you have decided not to finish asking, and you add it up, because it will not stop adding itself up.

The well is the same well, stone for stone, and the cap is unworn.

The workshop is a frame of green timber on the footprint you could walk blind.

The stump is a tree, in leaf, with a swing on it.

And nobody here has heard the word.

Not *nobody believes it*. Not *nobody speaks of it*. You watched it land on her and find nothing to land on, the way a word does when it has not been given out yet. At home that word empties a doorway. At home there is a plank by the well with it chalked on, and forty unlit lanterns on a cord, and a bowl of salt that nobody can explain and nobody will move.

Words like that have to start somewhere. They have not started here.

Above you, the hill holds its cave, and the cave holds a stair that Lovage and his boys are still cutting, down to a basin with two coins in it, and behind you, up the track, there is no rope and no bench and no letters on the lintel because there is no lintel yet.

Saffra scrapes her trowel and waits, patiently, for you to say something sensible.

You are a long way from home. You have not moved an inch.

So the question is not where you are. You know where you are; you have known the shape of this square since you could walk. The question is how a person gets back up that hill and out the other side of it, and the only thing on this hill that was not here yesterday is a hole full of men with chalk lines and a foreman who does not like strangers.`;

/* ------------------------------------------------------------------ *
 * The recitation
 * ------------------------------------------------------------------ */

export const RECITE_REFUSED = `You open your mouth and nothing comes out of it that you are willing to let go.

Saffra waits. Fenn waits, with the mortar board sliding. Then she shrugs, not unkindly, and goes back to her course, and the trowel starts up again.

"Well," she says to the wall. "When you have got it straight."

You can tell them whenever you want. They are not going anywhere, and neither, it is becoming clear, are you.`;

export const RECITE_PREAMBLE = `You tell them.

Not all of it — not the lanterns on the cord or the salt on the well-cap or the eleven days or the fact that you have known these four lines since you were small enough to be lifted up to see the plank. You tell them the words, because the words are what they asked for, and because the only answer you have to *what is coming* is a thing you were taught in a room with a slate in it.

You get it right. You could not get it wrong. It has been in your mouth your whole life, the way a step you have climbed ten thousand times is in your knee.`;

export const RECITE_SPOKEN = `${prophecyBlock()}`;

export const RECITE_AFTER = `Nobody says anything for long enough that you hear the wind come over the roof.

Fenn says, "Is it a *poem*?"

Saffra does not answer him. She is still up on the plank with the trowel in her hand and she has not moved it, and she is looking at you the way you look at a thing you are going to have to deal with later.

Then she comes down off the plank, wipes her hands on her apron, goes into the shell of the workshop, and comes back out with an offcut of board and a stub of char.

"Again," she says. "Slower."

You say it again. Slower. She writes it on the back of the board, in a careful hand, ${m('with her tongue between her teeth')}, and goes over two of the lines twice where the char has worn thin.

When she is done she holds the board at arm's length and reads it to herself, and her face does a thing you have seen on exactly one other face: your own, every midwinter, standing in a cold square while somebody reads this out.

"Right," says Saffra. "Well. That is not a poem."`;

/* ------------------------------------------------------------------ *
 * The second crossing
 * ------------------------------------------------------------------ */

export const CROSSING_FORWARD = `You stand the lantern in the high dish, and the dish takes it the way a socket takes a bone.

The light goes up the thinned panel and the panel answers — not a sound, exactly. A pressure, the way a held note in a stone room is a pressure, arriving in your back teeth and the hinges of your jaw.

You could still take it out. You are aware of that, in detail, for about four breaths.

One of the three is home. It is not the low one, and the middle one is a chalk line on rough rock that nobody is going to cut for you this season, and you have perhaps a day left before they stop you coming up this hill at all.

So: this one, and hope.

You pick the lantern back up in both hands, and you put your shoulder through the half-cut aperture into a pressure that is not air, and the hill lets you.

There is no falling this time. There is a long moment of being somewhere with no weather in it at all.

Then stone, and your own breath, very loud.`;

export const FUTURE_ARRIVAL = `You come down badly on a floor that is not level any more.

It takes you a while to understand what you are looking at, because you are looking at a room you have been in twice and it has been broken. The roof has come part of the way down and stopped, propped on its own wreckage. The stair you walked up this morning, the one with the handrail groove worn into the wall, goes up four treads and ends in a wall of fallen hill.

The basin is here. The rim is here, cracked clean through in two places, and there is no water in it, and there has been no water in it for a very long time. The silt in the bottom is dry and cracked into plates and there is dust on top of the dust.

High on the wall behind you, where no opening has ever been, the hill has torn itself open. Daylight comes through it. ${m('Not very much, and the wrong colour')}.

You are not in your own village. You know that before you have got your feet under you, and you know it from the quality of the light.`;

export const END_OF_CONTENT = `— End of the current content —

This is as far as the story is built. What happens in this place, who is still living in it, and how a person gets home from here are the next chapters, and they are not written yet.

This is not the ending. Nothing here is the end of the story.

You can keep looking around, read your JOURNAL, or use Settings to restart from the checkpoint at the start of this chapter. Settings will tell you whether this browser is keeping your progress, and Export Save works either way.`;

/**
 * Shown once to a player continuing a save that stopped at the old
 * end-of-prototype marker, so the transcript they are looking at — which still
 * ends in "the story does not continue past this point yet" — is corrected
 * rather than silently contradicted.
 */
export const CONTINUATION_NOTICE = `— The story continues past this point now —

Your saved game ended where the prototype used to stop. The chapter carries on from here: everything above is still yours, and nothing has been reset.

You are in the square, a hundred years before the one you grew up in, and you need to get home.`;
