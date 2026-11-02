# Absolution — proposed full-game walkthrough

> **SPOILERS**, and a **design document**. Chapter 1 is implemented and runs at
> `31866e6`. Chapters 2–4 are **proposed and not implemented**: the commands
> below specify intended play, they are not a record of a session. Only
> Chapter 1 has been executed.

**Revision 3**, reconciled to the five approved owner decisions. See
`docs/FULL_GAME_DESIGN.md` §0 for what was superseded, and
`docs/M2_DECISIONS.md` for the decisions themselves.

---

## Chapter 1 — The village and the first cave *(implemented)*

Shortest completion, verified against the shipped build:

```
take lantern
down                    → the square
east                    → the workshop
take wedge
west / west / west      → square, cave path, cave mouth
in                      → outer gallery
east                    → sealed chamber
use wedge on shutter
place lantern in alcove
light lantern
open seam
down                    → deep chamber
enter threshold         → CROSSING 1
```

Recommended fuller route, for the relationships and clues the later chapters
rely on:

```
examine lantern · examine tag · take lantern · examine window · down
examine plank                       ← the five lines. The hero has known them
                                      since school; this is a re-reading
talk to sage → the prophecy / how old the prophecy is / leave
talk to marjoram → the cave / advice for going in / leave
talk to parsie → why he is so excited / the others who went in /
                 what he wants you to bring back / leave
east · talk to oreg → the wedge / his own attempt at the rite /
                      the square room at the back / leave · take wedge
west · west
talk to dilly → what happened when she went in / how she got lost /
                the thing she let go of the rope for / leave
talk to tyme → the entrance and the way back / what is actually in there /
               coming back out for more gear / leave
               [PROPOSED] what he does while you are inside
examine stump · west · examine lintel · examine rope · light lantern · in
examine scratches · examine relief
[PROPOSED] take stone                ← for Parsie. Optional. It ends up in a
                                       record chest a century later
north · examine words · examine boot · south
east · examine shutter · open shutter · examine alcove · examine eye
[PROPOSED] examine crack             ← unremarked. It will be a different
                                       length the next time it is measured
wedge shutter · place lantern in alcove · examine wall · open seam
take lantern · take wedge · down
examine threshold · examine steps
enter threshold
```

**Leaving Chapter 1:** `lantern`, `wedge`. **Knowledge:** the prophecy, that
the relief is instructions, that the basin has a depth it cannot have.
**Optional:** a stone for Parsie; the echo chamber.

---

## Chapter 2 — The past, one century back *(proposed)*

**Entry:** `past.deep_chamber`. The basin is a hand deep; two coins and a bone
pin in the silt.

```
examine basin · examine tool work     ← chalk setting-out line, bucket, mallet
take mallet                           ← Lovage's. It is the tool that ends the game
up                                    → past.entrance (a worked stair, no gallery)
examine mouth · examine village
east                                  → past.square
talk to saffra → where you are / the cave on the hill /
                 whether the cave has a name
talk to fenn   → the tree / whether he has been in the cave
```

### P4 · The recitation — the chapter's hinge

This can be done before or after the worksite; the design supports both orders.

```
talk to saffra → the Wanderer          ← the hero mentions it the way you
                                         mention a holiday
                                       ⇒ SHE HAS NEVER HEARD OF IT.
                                         The hero's shock is the beat.
               → what it says          ← she and Fenn both want to know
recite prophecy                        ⇒ NEW VERB. The five canonical lines,
                                         verbatim, every time. No variants.
                                       ⇒ flag recited_prophecy
                                       ⇒ one line of realisation: the hero
                                         hears their own voice saying it to
                                         people who are writing it down
```

Optional, and none of it changes the recited text:

```
talk to saffra → how I know            ← warn / confess / refuse
talk to fenn   → the truth             ⇒ told_fenn_truth
recite prophecy                        ← again, if the player refused first.
                                         They ask. And ask. It is required,
                                         and the player sets the spirit of it
talk to saffra → take it back          ⇒ tried_to_retract. She has already
                                         written it on a board
```

### P2 · Getting onto the worksite

```
ask fenn about the stair               ← nobody stops the water-carrier
west                                   → past.cave_path   (NEW ROOM)
examine crew · examine rope
talk to lovage → the stair             ← "Come back when you are somebody."
               → the water             ← they are cutting down to a cistern
south                                  → past.spring      (NEW ROOM)
take skins · fill skins
north · west                           → past.entrance
give skins to lovage                   ⇒ past_worksite_access
```

**If the recitation came first, the water route is barred** — and two
replacements appear on the `recited_prophecy` flag, with **no prerequisite on
any earlier conversation**:

```
talk to fenn   → the old way           ← he comes and finds you. The topic
                                         appears with the flag and never goes
west · in                              → past.worksite, behind the spoil heap
```
```
talk to saffra → get me up there       ← she walks you past Lovage herself
```

### P3 · The builders' three settings

```
in                                     → past.worksite    (NEW ROOM)
examine aperture                        ← half-cut, in a thinned panel
examine drawing                         ← THE POWER: three positions, numbered.
                                          Complete. Nothing obscured
examine notes                           ← the crew's craft record: where we
                                          were, how long, what we found. No
                                          theory, because they have none
examine dishes                          ← TWO are cut. The low one and the
                                          high one
examine outline                         ← chalk on rough rock where the middle
                                          one will go
                                        ⇒ read_drawing, knows_settings
```

Every obvious way out of the limitation, and its answer:

```
place lantern on rubble                 ← will not sit level; the light
                                          wanders; the fold does not answer
wedge lantern                           ← the wedge props a shutter, not a
                                          lamp at a hand's tolerance
ask lovage to cut it                    ← "A week with two men, and I would
                                          not give you an hour."
wait                                    ← available. And over the next day the
                                          wrongnesses start, the village
                                          decides they came in with the
                                          stranger, and the hill is closed to
                                          them for good
```

### Leaving — forward, knowingly

```
place lantern in high dish
light lantern
enter aperture                          → CROSSING 2
                                          The hero knows this is the wrong
                                          direction. It is the only one open.
```

**Leaving Chapter 2:** lantern, wedge, **mallet**, optional bone pin.
**Knowledge:** the fold answers to a lamp at a height; three settings and no
more; the middle dish is uncut; **nobody in this century had ever heard the
prophecy until the hero said it.** **Recovery if the mallet is missed:** a maul
in the ruined workshop in Chapter 3.

---

## Chapter 3 — The future, one century on *(proposed)*

**Entry:** `future.deep_chamber`, closed in by the hill, a gap in the fallen
roof. *(Milestone 3 ends here — see the design's §9.)*

```
look · examine basin                    ← dry
examine roof · out                      → future.entrance (NEW ROOM)
examine mouth                           ← SEALED, with a cut mark on the stone
examine mark                            ← the village's own
up / east                               → future.cave_path (NEW ROOM)
examine trunk                           ← the great tree, down
examine sky                             ← wrong, and nobody here remembers it
                                          being otherwise
east                                    → future.square   (NEW ROOM)
```

### P5 · The settlement's account

```
talk to sorrel                          ← a child; takes you in; answers
                                          anything
              → the village             ← thirty people
              → anywhere else           ← the roads stopped. The sea came up
                                          and stayed. Nobody has come through
                                          in her lifetime
examine well                            ← capped with stone
examine memorial                        ← the year it started going wrong
examine account                         ← the settlement's history of the end
                                          of the world. A century of gloss —
                                          and the FIVE LINES in the middle of
                                          it, word for word
read journal                            ← your own entries. Your birthday
talk to rue   → the account             ← "a stranger said it"
              → the stranger            ← the family story: one eye, out of
                                          the hill, would not say who they were
              → the year                ← what her grandmother's grandmother
                                          was told
              → how it works            ← "I have no idea." NOBODY HERE DOES
              → the seal                ← her people put it there
              → the chest               ← if you brought Parsie a stone, it
                                          is in it
                                        ⇒ read_account, heard_family_story,
                                          knows_responsibility
```

The player makes the match. Rue never accuses anyone, and believes the
Wanderer did it — which is correct, and which she cannot possibly know.

### P6 · Out through the seal, and the eye

```
talk to sorrel → the seal               ← which course is loose
west / down                             → future.entrance
wedge course
break seal with mallet                   ← first blow
break seal with mallet                   ← second blow
                                        ⇒ A stone comes down and takes the
                                          left eye — and the fall it came from
                                          begins AFTERWARDS.
                                        ⇒ flag lost_eye. Two sentences.
up                                      ← whoever is at the mouth backs away
                                          and names you, out of a text you
                                          wrote
examine fissure                         ← the low dish, intact behind it
place lantern in low dish
light lantern
enter aperture                          → CROSSING 3
```

---

## Chapter 4 — The return, the confrontation, the end *(proposed)*

**Entry:** `present.sealed_chamber`, year 0, the minute the seam opens.
Lantern, wedge, mallet, journal. One eye, three days, filthy. The earlier self
is holding a lit lamp. **The slab settles shut behind you.**

```
look · examine self · examine slab
go up                                   ← "You are not leaving this room.
                                          Neither of you is."

talk to basil → who I am                ← "Anybody could say that."
show lantern                            ← IDENTITY. Two lanterns, same dent,
                                          three days apart. They believe it —
                                          and the plank says the Wanderer is
                                          one-eyed and comes to stop the one
                                          who could stop it. Believing you
                                          makes them certain
show journal                            ← a century of deaths in their own
                                          handwriting. Nothing here can
                                          corroborate it. It reads as a trick
talk to basil → the prophecy            ← where the words came from. They have
                                          recited those words every midwinter
                                          of their life. It lands as blasphemy
stand in threshold                      ← holds for one exchange
grab basil                              ← they get free
tie basil with rope                     ← the rope is at the mouth, not here
break pillar with mallet                 ← they tackle you. The mallet skids to
                                          the back of the chamber
take mallet
```

Then the only action left that stops the crossing: **the hero kills their
earlier self.** One line, the mallet because it is what is in the hand, and no
dwelling. What the narration spends
words on is the four seconds afterwards.

```
examine basil                            ← four seconds
examine pillar                           ← one worked pillar, and a century of
                                          loosening the hero has seen the far
                                          end of
break pillar with mallet                 ← first blow; the hill answers
break pillar with mallet                 ← second
break pillar with mallet                 ← the last one is its own action. Its
                                          cost is stated before it is taken:
                                          THE HERO DIES HERE, and the cave is
                                          gone for good
```

### Epilogue — not playable, not the hero's

The village, that evening and after: the sound reaching the square; the hill
moved and the mouth gone by full dark; Tyme found on the bench with a coil of
rope in his hands and nobody to give it to; nobody missing, no child
unaccounted for. The vigil called off. The rite ended, because there is no cave
to walk into. Sage filing the Wanderer-words with the midwinter minutes and
writing beside them that they came true.

Closing on one ordinary detail, a century later, in a square the player has
stood in twice: **it rains, and the water stays where it falls.**

---

## The two orderings

### The hero's subjective order

| # | Where | Elapsed | Carried out | Injury |
| --- | --- | --- | --- | --- |
| 1 | Village, first cave | day 1, morning–dusk | lantern, wedge | — |
| 2 | Past, year −100 | day 1 evening – day 2 | + mallet | — |
| 3 | Future, year +100 | day 2 – day 3 | + the journal's record | left eye |
| 4 | Sealed chamber, year 0 | day 3, the same dusk as (1) | — | — |

About three days. Sixteen throughout.

### The world's calendar order

| Calendar | Event |
| --- | --- |
| −100 | Lovage's crew cutting the stair; the fold found; three settings learned; the middle dish uncut |
| −100 | A stranger recites the Wanderer-words. Saffra writes them on a board |
| −100 | Wrongnesses begin. The village turns on the stranger, who leaves forward. **The tear stays open** |
| −100 → 0 | Copied, chanted at midwinter, shortened, carved, taught in school |
| 0, morning | The hero turns sixteen. Eleven days into the vigil |
| 0, dusk | The earlier self opens the seam |
| **0, dusk, same minute** | **The intervention. Both die. The hill comes down** |
| 0, that night | The cave is gone. The rite ends |
| ~~0 → +100~~ | ~~Causality shatters; a century of collapse; a few survive~~ — **never happens** |

---

## Continuity audit

Graded **Pass** (traced, no gap found), **Partial** (works, with a named
weakness) or **Open** (the owner's to settle, and listed in
`M2_DECISIONS.md`).

| Check | Grade | Notes |
| --- | --- | --- |
| Every required action is motivated before its result is known | **Pass** | Crossing 1: curiosity. Crossing 2: the only setting with a dish, taken knowingly as the lesser evil. Crossing 3: reaching the minute it starts. The recitation: they assume everyone knows it and are asked. |
| The warning is the prophecy's only source, consistent with the opening | **Pass** | The canonical text is the shipped plank, unedited. The recitation is those lines verbatim. No earlier prophet, no unseen author, no record predating it. The loop is the owner's chosen origin |
| Player choices never rewrite text the player has read | **Pass** | Decision 4 applied: one fixed recitation; agency is in tone, questions, explanation and who is told the truth |
| The future follows the hero's journey | **Pass** | The memorial's year is the hero's birthday; the collapse runs from it; the Account's middle lines are the hero's own |
| The final intervention is new, with no future self in the opening | **Pass** | Chapter 1 as played *is* the unchanged history. Nothing retrofitted |
| Both deaths and the cave's permanent destruction are accounted for | **Pass** | The earlier self is killed in the chamber; the hero brings the pillar down from inside; the chamber and the fold are under the hill |
| Singularity is applied to the protagonist only | **Pass** | No universal rule anywhere. Objects travel as a gameplay rule, stated as such. Nothing explains it, nobody theorises about it, no ancestry |
| The catastrophe is worldwide and shown, not asserted | **Partial** | The sky, the capped well, the sealed hill, the roads, a sea that came up and stayed, thirty people where there were two hundred — all testimony and observation. **But it is still four or five beats and one chapter.** A reader may want more weight than the scope allows |
| The mechanism is never explained | **Partial** | Every symptom is an observation and every explanation is somebody's belief; Rue says outright she has no idea. **The risk is in review, not in the plan:** the temptation to let one character "know" has to be refused each time a scene is written |
| No prerequisite needs an inaccessible item or a permanently missed clue | **Pass** | Mallet has a future substitute; lantern has a past one; the drawing, Account and memorial are indestructible fixed scenery. **The Ch2 order trap is closed:** after the recitation there are two unconditional routes onto the worksite, each on the flag the required path sets, neither depending on an earlier optional conversation |
| The forced mistake is gone | **Pass** | No obscured mark. Three fixed settings, one uncut dish, and four authored answers to cleaning, improvising, asking and waiting. The hero's arithmetic is never wrong |
| Both input modes can perform every solution | **Pass, with two to build** | Two new things need their selectable forms specified: `RECITE PROPHECY` as a *Recite it* action on the conversation topic, and the evidence reading as ordinary *Examine* on the Account, the memorial and the journal — there is no `COMPARE` verb any more, because the inference is the player's rather than a command. The confrontation's actions are all either verbs on visible objects or conversation topics, which both modes already render |
| Pacing fits a short adventure | **Partial** | Ch1 ≈ 25 min (measured), Ch2 ≈ 25, Ch3 ≈ 20, Ch4 ≈ 15, epilogue ≈ 3 — about 90 minutes. Chapter 2 still carries three puzzles and the hinge and is the likeliest to bloat |
| Lethality is handled with restraint | **Open** | Specified as one line with no dwelling, and four seconds of aftermath given the words instead. Whether that is the right register is the owner's call once it is drafted |

### Unresolved, and honest

1. **The information loop** is deliberate (decision 4) and not a defect. The
   design's only obligations are to let the hero notice it and never explain
   it. Recorded here so no later pass "fixes" it.
2. **The catastrophe's felt scale** versus the scope it is given. The honest
   trade is one more future room; the honest risk is a ninety-minute game
   becoming two hours.
3. **How much the hero understands at the end.** They know they caused it and
   that the cave guarantees repetition. They never know why. Whether a player
   finds that satisfying or thin is the biggest open question in the design.
4. **Chapter 3's population is two named people.** Deliberate; a third costs
   writing time for atmosphere.

### What this revision closed

Real defects in revision 2, now gone: the universal anchoring rule; −140/+40
dates; an opening acquaintance implausibly alive a century on; the quantified
aquifer model and its gauge; a 40-year ledger asked to date a 140-year-old
act; player choices rewriting the plank; the forced mis-aim; the
dependency-trapped alternate route; and a two-survivor ending with a comic
epilogue.
