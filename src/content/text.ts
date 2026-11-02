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
  /** The future arrival. */
  future: 'Get out of this hill and find out where you are.',
  /** Once the settlement has been found. */
  settlement: 'Find out what happened here.',
  /** Once the hero has put the evidence together. */
  responsible: 'Get back to the night it started.',
  /** The return, and the end of what is built. */
  returned: 'Stop yourself going through.',
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

Not all of it. Not the lanterns on the cord, or the salt on the well-cap, or the eleven days. Just the words, because the words are what they asked for.

You get it right. You have never once had to try.`;

export const RECITE_SPOKEN = `${prophecyBlock()}`;

export const RECITE_AFTER = `Nobody says anything for long enough that you hear the wind come over the roof.

Fenn says, "Is it a *poem*?"

Saffra does not answer him. The trowel is still in her hand and she has not moved it.

Then she comes down off the plank, wipes her hands on her apron, goes into the shell of the workshop, and comes back out with an offcut of board and a stub of char.

"Again," she says. "Slower."

You say it again. Slower. She writes it on the back of the board, ${m('with her tongue between her teeth')}, and goes over two of the lines twice where the char has worn thin.

Then she holds the board out at arm's length and reads it to herself, and does not put it down.

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

This is as far as the story is built. What the two of you say to each other, and what it costs, is the last chapter, and it is not written yet.

This is not the ending. Nothing here is the end of the story.

You can keep looking around, read your JOURNAL, or use Settings to restart from the checkpoint at the start of this chapter. Settings will tell you whether this browser is keeping your progress, and Export Save works either way.`;

/**
 * Shown once to a player continuing a save that stopped at an older
 * end-of-content marker, so the transcript they are looking at — which still
 * says the story stops there — is corrected rather than silently contradicted.
 *
 * One of these per boundary that has ever shipped. Each is appended under a
 * fixed transcript id so it cannot land twice.
 */
export const CONTINUATION_NOTICE = `— The story continues past this point now —

Your saved game ended where the prototype used to stop. The chapter carries on from here: everything above is still yours, and nothing has been reset.

You are in the square, a hundred years before the one you grew up in, and you need to get home.`;

/* ------------------------------------------------------------------ *
 * The ruined century
 * ------------------------------------------------------------------ */

export const CONTINUATION_FUTURE = `— The story continues past this point now —

Your saved game ended where the previous build stopped. The chapter carries on from here: everything above is still yours, and nothing has been reset.

You are on the floor of a broken chamber with a tear in the wall above you and daylight coming through it, and you do not yet know where you are.`;

export const OUT_THROUGH_THE_TEAR = `You get a shoulder and then a hip through, and the rock lets you out onto the side of the hill about the height of a house above where the mouth used to be.

Then you stop, with one hand still on the stone, and you look at it.

${m('The valley is the valley')}. That is the first thing, and it is the worst thing: the shape of the ridge, the bend where the track should go, the flat place by the water where the village is. You could draw this from memory. You have drawn this from memory, on a slate, for a woman who wanted to know what was over the ford.

The roofs are wrong. There are fewer of them and they are lower and the colours are wrong, and something has been burned a long time ago and grown over since.

And the sky. The sky is doing the thing you saw from the chamber and it is worse out here, because out here there is a lot of it: an even, steady, wrong colour, with no weather in it at all. Not cloud. Not haze. A ceiling.

Below you, somebody is walking up the track with a bucket, and they have not seen you yet.`;

export const SEAL_FIRST_BLOW = `You set the mallet against the stone the way you watched men set mallets for three days, and you swing.

The sound is enormous and goes nowhere. It comes out of the hill, hits the hillside, and stops dead, and the silence afterwards is the loudest part of it.

The course shifts. Dust goes out of the joint in a thin grey breath, and the stone above it drops a hair's width onto the wedge and stays there.

Sorrel, from four paces back, says nothing at all.`;

export const SEAL_SECOND_BLOW = `You swing again.

The course goes. It comes out of the wall in three pieces and the fitted stone above it slumps into the gap and the whole seal opens along its own courses like a book falling off a shelf, and there is cold air out of the hill and the smell of a closed room.

Then something hits you on the left side of the face.

It is a stone the size of a fist and it comes from above and slightly behind, and it is not a stone you loosened, and you are on your knees on the shale with your hand over your eye before you have understood that you have been hit.

${m('The fall it came out of starts afterwards')}.

You hear it begin above you — the long dry rattle of a hillside letting go, pebbles first, then the bigger stuff, running down the rock face to your right and out onto the track and away downhill. You hear all of it. You hear the start of it, clearly, with the thing it sent already in your hand.

Sorrel is shouting for somebody.

The pain arrives properly about four seconds late, and it is not like anything, and your hand is wet and you do not take it away.`;

export const EYE_AFTERMATH = `You lose a while.

Not consciousness. The order of things: you are sitting with your back against the sealed stone that is no longer sealed, and there are three people here now instead of one, and somebody has your chin in their hand and is turning your face towards the light.

"Hold still." Not Sorrel. An older woman, grey, with water and a cloth and the expression of somebody who has done this before and would rather not be doing it now. She does not tell you it will be fine.

The cloth comes away and she looks at it and puts it back and says, to Sorrel rather than to you, "Fetch the other one."

What you understand, over the next little while, is that the eye is gone. Not damaged. Gone, and the socket cleaned and packed and bound with a strip of linen that goes round your head twice, and the woman's hands are steady and quick and she says *sorry* once, quietly, when you make a sound.

Nobody asks you what you were doing. That is the thing you notice through all of it. They have watched a stranger break open the hill they sealed, and nobody has asked.`;

export const WANDERER_NAMED = `You get up, eventually, with a hand on the stone.

There is a fourth person on the track now, a man with a bucket he has not put down, and he has been looking at you since before you stood up.

You turn your head to see him, because turning your head is how you see anything on that side now, and whatever that looks like from four paces away, it is enough.

The bucket goes down. He does not run. He goes backwards two steps, and then another one, and he says a word.

It is a word you have said in a cold square every midwinter of your life, standing between your mother and a bowl of salt, while somebody read it off a plank.

Sorrel says, "Don't." But she says it to him and not to you, and she does not say he is wrong.`;

export const CROSSING_BACK = `The middle dish takes the lantern the way the others took it. Of course it does. They were all cut by the same hands in the same week, by men who did not know what they were cutting.

The panel answers. The pressure arrives in your back teeth and the hinges of your jaw, exactly where it always does, and under the linen on the left side of your face it arrives too, which is new and which you would rather it did not.

You stand there a long time with your hand flat on stone that is a hundred years from both the places you have been.

This is a guess. You want that on the record, in your own head, standing here: low went back, high came here, and so the middle one is the one that is left, and *left* is not the same as *home*. You have been wrong about less.

But the room behind you is dry and the hill is dead and there is a man down in that village who put a name to your face, and the only thing you have left to be wrong about is the way back.

You put your shoulder into the gap in the panel.

There is no falling and no weather. There is a long moment of being nowhere at all, which you are getting used to, and which you hope very much you will never get used to.

Then light. Warm, close, low down, and moving.`;

export const RETURN_ARRIVAL = `You come out onto your hands and knees on a floor you swept your own knee-dust off this morning.

It is a small square room, four steps across, with three walls cut in overlapping scales and a worked pillar in the middle of it holding the roof up. You know the crack at the base of that pillar. You know the grit under it.

Low on the fourth wall, a stone shutter is standing open in its grooves with an oak wedge driven in under it, and in the alcove behind the shutter there is a hooded lantern, lit, sitting level in a dish cut for something about that size.

The light from it goes up through the carved eye above the alcove and lands on the patterned wall as a long bright fan. And in the fan, one line of the scale-pattern is reading as a shadow instead of a cut.

Somebody is kneeling in front of that wall with their back to you.

They are sixteen years old. They have been sixteen for about as long as they have been awake. Both knees are grey from the gallery floor and there is cave dust in the creases of one elbow, and they are leaning forward with one hand half-raised towards the seam, and they have not turned round yet, because the room is doing something to sound that it has never done before and they have not worked out what.

You are not quiet. You land badly, and your breathing is the breathing of somebody who has carried a mason's mallet up a hill with one eye.

They turn round.`;

export const END_OF_CONTENT_RETURN = `— End of the current content —

Everything after this — what the two of you say, what you do about it, and what it costs — is the last chapter, and it is not written yet.

This is not the ending. Nothing here is the end of the story — the last chapter is written down in the design and is not implemented yet, so this build stops in front of it rather than guessing at it.

You can look, read your JOURNAL, check your INVENTORY, or use Settings to restart from the checkpoint at the start of this chapter. Export Save works whether or not this browser is keeping your progress.`;
