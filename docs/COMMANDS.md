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
| `ENTER APERTURE` | The same verbs, for the other crossing. `CROSS APERTURE`, `STEP THROUGH THE APERTURE` |

Named exits work too: `GO WORKSHOP`, `GO TO THE GALLERY`, `ENTER THE CAVE`.
Every room's ways out are listed in its description and by `EXITS`.

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
`TALK TO TYME`, `TALK TO SAFFRA`, `TALK TO FENN`, `TALK TO LOVAGE`. A few also
answer to a description, such as `TALK TO BAKER`, `TALK TO JOINER` or
`TALK TO FOREMAN`.

## When the game asks "which one do you mean?"

Answer with the number, or with a name precise enough to pick one option. Typing
a different complete command instead replaces the question. `CANCEL`
(`NEVERMIND`, `NONE`, `NEITHER`) backs out.

## Other

| Command | Notes |
| --- | --- |
| `JOURNAL` | `LOG`, `NOTES`. Observations you have established — never an unexplored solution. |
| `HINT` | Nudge, then more, then the full answer. Three steps, identical in both input modes. Ask again to go deeper; the ladder restarts when you move on to the next problem. Hints are free and repeatable, and asking for one never uses anything up. |
| `WAIT` | `Z`. Lets a moment pass. Nothing in this story is on a clock, so waiting never costs anything and never closes a way forward. |
| `HELP` | `COMMANDS`. This list, in-game. |

**Up** and **Down** arrows in the command field recall what you typed before.
