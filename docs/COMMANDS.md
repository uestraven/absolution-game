# Command reference

For type-only play. Selectable Actions mode offers the same actions as buttons —
both modes build identical engine actions, so nothing here is unavailable to a
player who never types.

Case, punctuation, extra spaces and the words *the*, *a*, *an*, *some*, *my*,
*your*, *this*, *that* are all ignored. `EXAMINE THE RELIEF!` and
`examine relief` are the same input.

This is a fixed vocabulary with authored synonyms, not free-form English. Input
the parser does not recognise prints an explanation and changes nothing — no
turn passes, no flag moves, no item changes hands.

## Looking

| Command | Synonyms |
| --- | --- |
| `LOOK` | `L` |
| `EXAMINE <thing>` | `X`, `INSPECT`, `LOOK AT`, `STUDY`, `READ`, `SEARCH`, `LOOK <thing>` |
| `EXITS` | — |

## Moving

| Command | Notes |
| --- | --- |
| `GO <exit or direction>` | `MOVE`, `WALK`, `HEAD`, `TRAVEL`, `CLIMB`, `ENTER`, `GO TO`, `GO INTO`, `GO THROUGH` |
| `NORTH` `SOUTH` `EAST` `WEST` | `N` `S` `E` `W` |
| `UP` `DOWN` `IN` `OUT` | `U` `D`, `INSIDE`, `OUTSIDE` |
| `BACK` | Where a room authors it as a way back |
| `ENTER THRESHOLD` | Only where there is one. `CROSS`, `STEP INTO`, `STEP THROUGH`, `GO INTO THE THRESHOLD` |
| `ENTER APERTURE` | The same verbs, for the other crossings. `CROSS APERTURE`, `STEP THROUGH THE APERTURE`. Standing a light somewhere never moves you; crossing is always its own command |

Named exits work too: `GO WORKSHOP`, `GO TO THE GALLERY`, `ENTER THE CAVE`.
Every room's ways out are listed in its description and by `EXITS`.

## Touching things

A small physical vocabulary, for the things the prose invites you to try.

| Command | Synonyms |
| --- | --- |
| `TOUCH <thing>` | `FEEL`, `POKE` |
| `SMELL <thing>` | `SNIFF` |
| `TASTE <thing>` | `LICK` |
| `EAT <thing>` | `BITE` |
| `DRINK <thing>` | `SIP`; `DRINK FROM <thing>` |
| `SIT ON <thing>` | `SIT <thing>` |
| `LISTEN` | what you can hear from where you are |
| `LISTEN TO <thing>` | |
| `KNOCK ON <thing>` | |
| `UNTIE <thing>` | `UNFASTEN` |
| `PULL <thing>` | the same verb as `CLEAR` |

**None of these is a simulation**, and none of them is required to finish the
game. They exist so that a thing the story describes can be addressed: there is
bread on a stool in the opening, and `EAT BREAD` should be about the bread.

Two things worth knowing:

- **The answer always names the thing.** Where nobody has written a specific
  response, you get a line about that object rather than a line about the game.
  "You could not eat the stool" is an answer; "you cannot do that here" is not.
- **A refusal is an interaction.** Marjoram stops you putting a finger in her
  dough; the offerings in the basin stay in the basin and the game says why.
  Not everything can be picked up, and the ones that cannot should tell you
  something.

Only one of these changes the world: the bread can be eaten, once, and stays
eaten.

## Handling things

| Command | Synonyms |
| --- | --- |
| `TAKE <thing>` | `GET`, `GRAB`, `PICK UP`, `RETRIEVE`, `REMOVE` |
| `TAKE <thing> FROM <place>` | also `OUT OF`, `OFF` |
| `DROP <thing>` | `PUT DOWN` |
| `INVENTORY` | `I`, `INV` |
| `OPEN <thing>` / `CLOSE <thing>` | `SHUT` |
| `LIGHT <thing>` | `KINDLE`, `IGNITE`, `STRIKE`. Bare `LIGHT` means the lantern. |
| `USE <thing> ON <thing>` | also `WITH`, `IN`, `INTO`, `UNDER`, `BENEATH`, `AGAINST` |
| `USE <thing>` | Asks which visible target you mean |
| `PLACE <item> IN <thing>` | `PUT`, `SET`, `STAND`; also `ON`, `ONTO`, `INTO`, `INSIDE` |
| `WEDGE <thing>` | Shorthand for using the wedge on it. `PROP`, and a trailing `OPEN`/`UP` is ignored |
| `FILL <thing>` | Where there is something to fill from. `FILL SKINS`, `FILL SKINS AT THE SPRING` |
| `GIVE <thing> TO <person>` | `HAND`, `OFFER` |
| `BREAK <thing>` | `SMASH`, `HIT`, `SWING AT`. Also `BREAK <thing> WITH <thing>`. You need something heavy in hand |
| `CLEAR <thing>` | `PULL`, `PULL OFF`. Shifts what is loose off whatever is behind it |

The lantern has a striker fixed to its base, so `LIGHT LANTERN` needs nothing
else. Anything you put down or set into something can always be taken back.

## People

| Command | Notes |
| --- | --- |
| `TALK TO <person>` | `SPEAK TO`, `SPEAK WITH`, `TALK <person>`, `ASK <person>`, `ASK <person> ABOUT ...` |
| `<topic>` or `<number>` | Once a conversation is open: a topic's name, a unique part of it, or its number |
| `TOPIC <name>` | Explicit form, if a topic name collides with a command |
| `LEAVE` | `BYE`, `GOODBYE`, `STOP`, `DONE`, `NOTHING` |
| `RECITE PROPHECY` | Only where you have been asked for it. `RECITE`, `SAY THE PROPHECY`, `SAY THE WORDS` |

Conversations are authored topics with numbered replies. Any other command works
mid-conversation and ends it. An unrecognised topic number says so and changes
nothing.

People answer to their name — `TALK TO SAGE`, `TALK TO OREG`, `TALK TO DILLY`,
`TALK TO TYME`, `TALK TO SAFFRA`, `TALK TO FENN`, `TALK TO LOVAGE`,
`TALK TO RUE`, `TALK TO SORREL`. A few also answer to a description, such as
`TALK TO BAKER`, `TALK TO JOINER`, `TALK TO FOREMAN` or `TALK TO KEEPER`.

## When the game asks "which one do you mean?"

Answer with the number, or with a name precise enough to pick one option. Typing
a different complete command instead replaces the question. `CANCEL`
(`NEVERMIND`, `NONE`, `NEITHER`) backs out.

## Other

| Command | Notes |
| --- | --- |
| `JOURNAL` | `LOG`, `NOTES`. Observations you have established — never an unexplored solution. |
| `HINT` | Nudge, then more, then the full answer. Three steps, identical in both input modes. Ask again to go deeper; the ladder restarts when you move on to the next problem. Hints are free and repeatable, and asking for one never uses anything up. |
| `SHOW <thing>` | Show somebody something, or tell them something. `SHOW LANTERN`, `SHOW JOURNAL`, `TELL THEM ABOUT THE PROPHECY`, `TELL THEM ABOUT THE FUTURE` |
| `BLOCK <thing>` | Stand between somebody and what they are going for. Also `STAND IN FRONT OF <thing>` |
| `RESTRAIN <person>` | `HOLD`. Get hold of somebody |
| `KILL <person>` | Spelled out, with its own verb, so nothing else can mean it by accident. Only available where the scene supports it |
| `REVIEW` | Read the ending again, once there is one |
| `REFLECT` | `THINK`, `CONSIDER`. Stop and put together what you have found. Offered as an action once there is something to put together, and it says what is still missing if there is not. |
| `WAIT` | `Z`. Lets a moment pass. Nothing in this story is on a clock, so waiting never costs anything and never closes a way forward. |
| `HELP` | `COMMANDS`. This list, in-game. |

**Up** and **Down** arrows in the command field recall what you typed before.
