# Absolution — proposed full-game walkthrough

> **SPOILERS**, and a **design document**. Chapter 1 is implemented and runs at
> commit `aad3a60`. Chapters 2–4 are **proposed and not implemented**; the
> commands below are a specification of intended play, not a record of a
> session. Nothing here has been executed except Chapter 1.

Companion to `docs/FULL_GAME_DESIGN.md`. Status labels there apply here.
**Revision 2**, after owner review of `8ed3d96` — see that document's §0 for
the nine corrections.

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

Recommended fuller route, for the relationships Chapters 3–4 depend on:

```
examine lantern · examine tag · take lantern · examine window · down
examine plank · talk to sage → the prophecy / how old the prophecy is / leave
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
examine stump · west · examine lintel · examine rope · light lantern · in
examine scratches · examine relief
[PROPOSED addition] take stone        ← for Parsie, optional, §9 of the design
north · examine words · examine boot · south
east · examine shutter · open shutter · examine alcove · examine eye
wedge shutter · place lantern in alcove · examine wall · open seam
take lantern · take wedge · down
examine threshold · examine steps
enter threshold
```

**Essentials leaving Chapter 1:** `lantern`, `wedge`. **Knowledge:** the
prophecy's wording, that the relief is instructions, that the basin has a
depth it cannot have. **Optional:** a stone for Parsie; the echo chamber
account. **State:** seam open; basin depth recorded in the journal
*(proposed addition)*.

---

## Chapter 2 — The past *(proposed)*

**Entry:** `past.deep_chamber`. Carrying lantern and wedge. The basin is a hand
deep; coins and a bone pin in the silt.

```
examine basin                    ← the depth is gone; this is not the way back
take pin                         ← optional; the only object from −140 that is
                                   portable and legible later
examine tool work                ← chalk setting-out line, bucket, mallet
examine gauge                    ← numbered marks cut into the stair; reads 31
                                   ⇒ journal records it
up                               → past.entrance (a worked stair, no gallery)
examine mouth · examine village
east                             → past.square
talk to saffra → where you are / the cave on the hill /
                 whether the cave has a name
talk to fenn → the tree / whether he has been in the cave
```

### P2 · Getting onto the worksite

```
ask fenn about the stair          ← he mentions who carries the water up
west                             → past.cave_path   (NEW ROOM)
examine crew · examine rope       ← Lovage has the stair roped off
talk to lovage → the stair        ← "Come back when you are somebody."
             → the water          ← "We are not digging for a pool. We are
                                    digging until we hit the water, and that
                                    is the water the village drinks."
south                            → past.spring      (NEW ROOM)
examine spring                    ← running hard
talk to saffra → the spring       ← "When the hill is full, the spring runs."
take skins · fill skins
north · west                     → past.entrance
give skins to lovage              ← he takes them and stops looking at you
                                 ⇒ flag past_worksite_access
```

*Selectable equivalents:* **Fenn** → *the stair* · exits as buttons ·
**water skins** → *Take* / *Fill* · **Lovage** → *Give the water skins*.

### P3 · The worksite and the aiming

```
in                               → past.worksite    (NEW ROOM)
examine aperture                  ← half-cut; thinned panel; no camouflage yet
examine niche                     ← rough, not yet dished
examine drawing                   ← THE POWER: a lamp at three heights,
                                    three fans of light, numbers beside them.
                                    Complete. No missing marks.
examine inscription               ← "WHAT HAS CROSSED IS OUT OF THE RIVER.
                                     IT DOES NOT FLOW WITH IT."
examine note                      ← cut, not chalked: "CUT SO IT CAN BE UNMADE"
examine floor                     ← chisel scars, a fresh step, spoil heaped
ask lovage about the numbers      ← "Off the floor." He means the finished one.
ask lovage about the floor        ← "Another hand off it before the dish goes
                                    in." Nobody here knows the final depth;
                                    it is the last thing cut, from a plan
                                    handed down.
measure niche                     ⇒ flags read_setting_out, knows_aiming
                                    journal records all three heights, measured
                                    from the floor that exists
```

**Foreshadowing beat, optional but recommended:** `place lantern in niche` →
`light lantern` → `take lantern`. Water is heard coming back **up** the stair.
One line. This is closure, demonstrated on water: what the tear was holding is
given back the moment it stops being addressed.

Also here, and required reading for the finale:

```
examine inscription    "WHAT HAS CROSSED IS OUT OF THE RIVER AND DOES NOT
                        FLOW WITH IT. WHAT IS SWALLOWED IS OWED BACK."
examine note           cut, not chalked: "CUT SO IT CAN BE UNMADE"
```

### P4 · The warning

```
out · east                       → past.square
talk to saffra → the hill         ← the five core lines are FIXED; the hero
                                    speaks the plank's own words because they
                                    are the only words they have
  (a) explanation : "the hill is hollow and leaking" /
                    "there is a hole in the year" /
                    "I will not tell you how I know"
  (b) tone        : warning / confession / plea
  (c) confidant   : Saffra / Lovage / Fenn   ← whose handwriting ends up on it
  (d) advice      : "watch the water" / "keep a vigil" /
                    "send someone into the cave"
                                 ⇒ flags gave_warning, warning_explain/tone/
                                   confidant/advice
                                 ⇒ the ADVICE decides which 180-year record
                                   exists in Chapter 3. All three produce a
                                   dated annual water series.
```

The hero hears themselves quoting the plank. One line of narration; no
explanation.

**Consequence:** Lovage pulls the rope across the stair. If P3 is not yet
done, **two routes, both unconditional** — neither depends on any earlier
dialogue choice:

```
talk to fenn → the old way        ← this topic appears the moment the warning
                                    is given and never goes away. He finds you.
west · in                         → past.worksite, behind the spoil heap
```
```
talk to saffra → get me up there  ← she walks you past Lovage herself
```

### Leaving

```
place lantern in niche            ← at the height you measured, correctly,
                                    off the floor that exists
light lantern
enter aperture                    → CROSSING 2
                                    One line on the way through: the floor is
                                    not finished.
```

**Leaving Chapter 2:** lantern, wedge, **mallet** *(take it — Lovage's,
from `past.deep_chamber` or the worksite)*, optional bone pin. **Knowledge:**
the tear answers to light; height selects era; the aperture was built to be
unmade; what has crossed is out of the river and what is swallowed is owed
back; the basin is the hill's water table; gauge reading 31. **Recovery if the mallet is
missed:** a maul in the future ruin of Oreg's workshop (§5 P6 of the design).

---

## Chapter 3 — The ruined future *(proposed)*

**Entry:** `future.deep_chamber`, buried, a gap in the fallen roof.

```
look · examine basin              ← dry. Tool marks, two coins, no water.
examine gauge                     ← reads 0, every mark exposed, silt two
                                    marks up the stone
                                   ⇒ journal records it
examine roof · out                → future.rubble    (NEW ROOM)
examine slab                      ← the pivot slab is down and broken
examine panel                     ← one edge of the pierced aperture shows
up                                → future.entrance (NEW ROOM)
examine mouth                     ← choked; the hill has moved
wait                              ← rain near the mouth falls upward for a
                                    few seconds. Nobody comments.
examine bench                     ← Tyme's bench, and the mark on it
east                              → future.cave_path (NEW ROOM)
examine trunk                     ← the great tree, down, under rubble
east                              → future.square    (NEW ROOM)
examine calendar                  ← the survivors' calendar has repeated days
                                    on it. They are matter-of-fact about this.
examine map                       ← Parsie's, with a shaded edge: two valleys
                                    in five years
```

### P5 · The water record

```
examine well                      ← no rope, no water
examine record                     ← 180 years of annual entries, in whichever
                                    form your Chapter 2 advice created:
                                    the ledger / the midwinter minutes /
                                    the keepers' log
journal                            ← your own gauge readings: 31 (−140),
                                    12 and then 11 (year 0), 0 (now)
compare record with journal        ⇒ NEW VERB. Three things agree:
                                    · the fall starts the year the record
                                      starts — the year a stranger told them
                                      to start it
                                    · exactly one night in 180 years shows a
                                      two-mark drop, and it is the night in
                                      your journal
                                    · your −140 reading is the top of the
                                      series
                                   ⇒ flags read_record, knows_cause
talk to parsie → the night the well dropped
              → the hill coming down
              → the shaded edge of the map   ← it is still spreading
              → the stone                     ← if you brought him one
              → Tyme                          ← how the bench got its mark
```

*Selectable equivalents:* **the record** → *Examine* / *Compare with my
journal* · **Journal** in the header · **Talk to Parsie** → topics.

Parsie never accuses anyone. He holds the whole case in his lean-to and has
never had the fourth number. The player supplies it.

**A bell is heard that has not been rung.** Later in the chapter, somebody
rings it. That is the confirmation that the tear has reached sequence, and
nobody explains it.

### P6 · Clearing the aperture, and the eye

```
west · west · down                → future.rubble
wedge slab                        ← or it drops across the alcove
break rubble with mallet          ← first blow
break rubble with mallet          ← second blow; the spall
                                  ⇒ flag lost_eye
                                    journal: "My left eye is gone. I did it
                                    myself, with Lovage's mallet."
examine aperture                  ← the finished floor exists now, and the
                                    datum mark is cut into the rim. The
                                    heights finally mean what the drawing
                                    said they meant.
                                  ⇒ flag knows_datum
```

**Identity confirmed by the world, not the narration:** go up and out, and
whoever is at the mouth backs away and says the word.

```
up · examine survivor             ← they will not come closer
down
place lantern in aperture         ← at the third height, from the real datum
light lantern
enter aperture                    → CROSSING 3
```

---

## Chapter 4 — The return and the finale *(proposed)*

**Entry:** `present.sealed_chamber`, year 0, the instant the seam appears.
Carrying lantern, wedge, mallet, journal. One eye. The earlier self is holding
a lit lamp. **The slab settles shut behind you.** There is one way out of this
chamber and the other person is standing in it.

```
look · examine self · examine slab
go up                             ← "You are not leaving this room.
                                    Neither of you is."

talk to basil → who I am          ← "Anybody could say that."
show lantern                      ← IDENTITY. Two lanterns, same dent, same
                                    striker chain, four days apart. They hold
                                    both.                        ⇒ stage 2

show journal                      ← DANGER. Four readings, your handwriting.
talk to basil → the water         ← they go down the steps and read the gauge
                                    themselves: it has dropped a mark since
                                    this morning.               ⇒ stage 3

talk to basil → the prophecy      ← "Then it is about you, and it says I stop
                                    you." You have no clean answer. Say so.
talk to basil → the village
talk to basil → the vigil
tell about tyme                   ← RESISTANCE. What the bench looks like in
                                    forty years, and who put the mark on it.
                                                                ⇒ stage 4

examine panel · tell about tear
talk to basil → cut so it can be unmade
                                  ← they solved this puzzle twenty minutes
                                    ago and get there at once — then object:
                                    nobody ever reaches it again. You agree.
                                                                ⇒ stage 5

break panel with mallet           ← they brace the slab; you swing
```

**Then:** the seam collapses, and water comes back up the stair for an hour,
audibly, and keeps coming.

**The quiet beat, after.** Not a lever, and it persuades nobody: the two of
them work out between them where the Wanderer-words came from. Neither enjoys
it. One exchange; then they climb out.

### Aftermath — about eight minutes, no puzzles

```
up · west · out                   → present.entrance
talk to tyme                      ← he looks at the two of you for a long
                                    time. He does not need to understand it;
                                    he needs to know if anyone is hurt.
east · east                       → present.square
tell the village → the truth / the useful part / nothing
talk to sage                      ← if you told the truth, she writes it down,
                                    because that is her job, and it goes in
                                    the chest with the midwinter minutes —
                                    where Saffra put the other one
talk to marjoram                  ← "Boring," you tell her.
```

**Where the older one goes.** They cannot be Basil or Basilia; that name is
standing next to them. Some weeks later Tyme hands over a coil of rope without
making a speech about it, and the bench becomes theirs. They keep the path,
refresh the chalk every spring, hand rope to sixteen-year-olds, and never tell
any of them what used to be behind the fourth wall.

**Cost, itemised:** no name in the village's reckoning, no family, no record,
no birthday, one eye, sole possession of forty years of other people's
futures, and the knowledge that the person they saved will have an ordinary
life and will slowly stop thinking about this.

**What the village keeps:** the prophecy, unrepealed, and a one-eyed stranger
on the cave path who arrived the night the vigil was called off. They decline,
collectively and without discussing it, to put those two things together.

### Alternative branch — the sacrificial variant

At stage 4 or later:

```
wedge slab
break panel with mallet           ← alone; the chamber comes in
```

The seam closes, the water returns, the village is saved and never learns why,
and a sixteen-year-old walks down the hill on their own. **One real branch;
both endings authored. Recommendation is the survivable one.**

### Deliberate dead ends — all recoverable in one turn

| Attempt | Outcome | Recovery |
| --- | --- | --- |
| `remove hood` at stage 0–1 | They see the socket, reach the plank's conclusion, and put themselves between you and the alcove with the lamp held like something they might throw. Conversation suspended. | `put down mallet`, then `step back`. Stage 1 resumes; `show lantern` still works. |
| `break panel with mallet` before stage 4 | They tackle you. Nobody hurt; the mallet skids to the back of the chamber. | `take mallet`, continue from the stage you had reached. |
| `go up` / `out` / `west` | Refused in one line. | — |
| Arguing from the plank's authority | Fails by design. | — |

**The earlier self never crosses during the encounter**, there is no timer, and
stalling costs nothing. Every failure is conversational and bounded.

## Continuity audit

Re-graded for revision 2. The first draft called ten of ten checks **Pass**,
which the owner correctly read as over-claiming. Grades here are **Pass**
(traced, no gap found), **Partial** (works, with a named weakness) and **Open**
(not settled, and the owner has to settle it).

| Check | Grade | Notes |
| --- | --- | --- |
| Every required action is motivated before its result is known | **Pass** | Crossing 1: curiosity. Crossing 2: getting home, with correct arithmetic off the only floor that exists. Crossing 3: reaching the moment it starts. P4: they are the only person who knows. P6: the only route out. No action needs foreknowledge of its own consequence. |
| The warning is the prophecy's source, consistent with the opening | **Partial** | The five core lines are now **fixed** and are the shipped plank text, so nothing the player reads is retrofitted — that defect is closed. The weakness that remains is the bootstrap: *one-eyed* has no first author. Owned in dialogue, not patched. |
| The eye injury and identity evidence are in a coherent order | **Pass** | Injury (Ch3 mid) → a stranger names them (Ch3 late) → the hero argues *against* the identity they now fit (Ch4). The evidence that convinces is the lantern; the eye is the obstacle. |
| Temporal damage has observable cause and cumulative effect | **Pass** | One instrument (the gauge), four readings, a 180-year series, and three stages of symptom — water, stone, sequence. The player does the arithmetic; nobody announces it. |
| The catastrophe matches the premise's scope | **Partial** | Restored from "a dry valley" to a tear that has reached the order of events and is spreading valley by valley. But it is shown in **four descriptive beats and one map prop**, which is cheap in scope and correspondingly thin in weight. A reader may still feel the end of the world deserves more than that. Deliberate trade, flagged. |
| The final intervention implies no future-self meeting in the opening | **Pass** | Chapter 1 as played *is* the unchanged history. Nothing is retrofitted into it; the player's recognition of the room is the whole effect. |
| The closure rule solves the actual causal problem and is foreshadowed | **Pass** | Two distinct rules, *crossed* and *swallowed*, replacing the first draft's contradiction. Closure expels only what was held. Foreshadowed twice in Ch2 — the two-rule inscription, and water audibly returning when the lamp is lifted. |
| Both selves' fates and memory retention are accounted for | **Partial** | Rule 1 covers it and is demonstrated on water before it is applied to a person. The aftermath is now written rather than gestured at. **The residual objection stands:** if the earlier self never crosses, a reader may still feel the traveller cannot be there to prevent it. This is a story rule and the draft says so. |
| No prerequisite needs an inaccessible item or a permanently missed clue | **Pass** | Mallet has a future substitute; lantern has a past substitute; the drawing cannot be destroyed; the record is fixed scenery. **The Ch2 dependency trap is closed:** after the warning there are two unconditional routes onto the worksite, neither gated on earlier dialogue. |
| Both input modes can perform every solution | **Pass, with one item to build** | `COMPARE RECORD WITH JOURNAL` needs its selectable form specified — a *Compare with my journal* action on the record object. The finale's `show lantern`, `show journal`, `tell about tyme` are conversation topics, which both modes already render. |
| Pacing fits a short adventure | **Partial** | Ch1 ≈ 25 min (measured), Ch2 ≈ 25, Ch3 ≈ 20, Ch4 ≈ 15, aftermath ≈ 8 — about 95 minutes, which is over the first draft's estimate because the aftermath is now real. Chapter 2 still carries three puzzles and the warning and is the likeliest to bloat. |
| Is the ending settled? | **Open** | Survivable is recommended; sacrificial is a real branch. Owner decision 5. |
| Is the bootstrap acceptable? | **Open** | Owner decision 4. The alternative — a mundane origin for *one-eyed* in a carver's invention — removes the loop and costs the best moment in Chapter 2. |

### Unresolved, and honest

1. **The one-eyed bootstrap.** Still the strongest residual issue. Not
   solvable inside the fixed canon without inventing an original author, which
   the brief forbids. Mitigated by having the hero notice it. **Open for the
   owner.**
2. **The hero's persistence after the change.** Rule 1 asserts it and
   foreshadows it on water. It remains an assertion about people. The
   alternative considered and rejected: let the earlier self cross and close
   the tear from the far side, which contradicts "the portal closes" and
   strands them.
3. **The catastrophe's weight versus its cost.** Four beats and a map prop
   restore the *scope* but not necessarily the *felt scale*. Spending another
   room on it is the obvious upgrade and the obvious scope risk.
4. **Chapter 3's population is thin** — one named survivor and one unnamed
   frightened one. Deliberate; a third costs twenty minutes of writing for
   atmosphere.
5. **Chapter 2 is the fattest chapter** and the first place to cut.

### What the owner's review closed

For the record, these were real defects in revision 1 and are no longer open:
the shrunken catastrophe; warning choices rewriting the plank; the
crossed-versus-in-transit contradiction; a 40-year ledger asked to date a
140-year-old action; the optional-dialogue dependency trap; a mis-aim that made
the hero look careless; an undefined retreat-and-resume in the finale; an
aftermath that was asserted rather than written; and a persuasion sequence that
used prophecy recitation to prove authorship.
