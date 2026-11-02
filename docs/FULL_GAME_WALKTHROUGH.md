# Absolution — proposed full-game walkthrough

> **SPOILERS**, and a **design document**. Chapter 1 is implemented and runs at
> commit `aad3a60`. Chapters 2–4 are **proposed and not implemented**; the
> commands below are a specification of intended play, not a record of a
> session. Nothing here has been executed except Chapter 1.

Companion to `docs/FULL_GAME_DESIGN.md`. Status labels there apply here.

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
south                            → past.spring      (NEW ROOM)
examine spring                    ← high water; a waterline well above today's
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
                                    three fans of light, numbers beside them
examine inscription               ← "WHAT HAS CROSSED IS OUT OF THE RIVER.
                                     IT DOES NOT FLOW WITH IT."
examine note                      ← cut, not chalked: "CUT SO IT CAN BE UNMADE"
measure niche                     ⇒ flags read_setting_out, knows_aiming
                                    journal records heights 1 and 2;
                                    height 3 is under Lovage's wet chalk
```

**Foreshadowing beat, optional but recommended:** `place lantern in niche` →
`light lantern` → `take lantern`. Water is heard settling back down the stair.
One line. This is the closure rule, demonstrated on water.

### P4 · The warning

```
out · east                       → past.square
talk to saffra → the hill
  (a) what is coming  : "the hill will open" / "the water will fail" /
                        "what stands will not stand"
  (b) who brings it   : "a wanderer" / "a stranger from the ford" / "I do"
  (c) what to do      : "keep a vigil" / "watch the water" /
                        "send someone into the cave"
                                 ⇒ flags gave_warning, warning_text_a/b/c
```

The hero hears themselves quoting the plank. One line of narration; no
explanation.

**Consequence:** Lovage pulls the rope across the stair. If P3 is not yet done:

```
talk to fenn → the old way        ← he will, because you told him the truth
west · in                         → past.worksite, behind the spoil heap
```

### Leaving

```
place lantern in niche            ← at the measured height
light lantern
enter aperture                    → CROSSING 2 — aimed a hand too low
```

**Leaving Chapter 2:** lantern, wedge, **mallet** *(take it — Lovage's,
from `past.deep_chamber` or the worksite)*, optional bone pin. **Knowledge:**
the fold answers to light; height selects era; the aperture was built to be
unmade; what has crossed is out of the river. **Recovery if the mallet is
missed:** a maul in the future ruin of Oreg's workshop (§5 P6 of the design).

---

## Chapter 3 — The ruined future *(proposed)*

**Entry:** `future.deep_chamber`, buried, a gap in the fallen roof.

```
look · examine basin              ← dry. Tool marks, two coins, no water.
examine roof · out                → future.rubble    (NEW ROOM)
examine slab                      ← the pivot slab is down and broken
examine panel                     ← one edge of the pierced aperture shows
up                                → future.entrance (NEW ROOM)
examine mouth                     ← choked; the hill has moved
examine bench                     ← Tyme's bench, and the mark on it
east                              → future.cave_path (NEW ROOM)
examine trunk                     ← the great tree, down, under rubble
east                              → future.square    (NEW ROOM)
```

### P5 · The water ledger

```
examine well                      ← no rope, no water
examine ledger                    ← forty years of tallies under a lean-to
journal                           ← your own basin depths, Ch1 and Ch2
compare ledger with journal       ⇒ NEW VERB. The dates and the steps agree.
                                    flags read_ledger, knows_cause
talk to parsie → the hill coming down
              → the year the spring failed   ← the autumn after you went in
              → the stone                     ← if you brought him one
talk to parsie → Tyme                         ← how the bench got its mark
```

*Selectable equivalents:* **water ledger** → *Examine* / *Compare with my
journal* · **Journal** in the header · **Talk to Parsie** → topics.

Parsie never accuses anyone. He blames the hill. The player does the
arithmetic.

### P6 · Clearing the aperture, and the eye

```
west · west · down                → future.rubble
wedge slab                        ← or it drops across the alcove
break rubble with mallet          ← first blow
break rubble with mallet          ← second blow; the spall
                                  ⇒ flag lost_eye
                                    journal: "My left eye is gone. I did it
                                    myself, with Lovage's mallet."
examine aperture                  ← the third height, cut into the rim,
                                    where it has always been
                                  ⇒ flag knows_third_height
```

**Identity confirmed by the world, not the narration:** go up and out, and
whoever is at the mouth backs away and says the word.

```
up · examine survivor             ← they will not come closer
down
place lantern in aperture         ← at the third height
light lantern
enter aperture                    → CROSSING 3
```

---

## Chapter 4 — The return and the finale *(proposed)*

**Entry:** `present.sealed_chamber`, year 0, the instant the seam appears.
Carrying lantern, wedge, mallet, journal. One eye. The earlier self is holding
a lit lamp.

```
look · examine basil / examine basilia
talk to basil → who I am          ← "Anybody could say that."
show lantern                      ← the one that works: two lanterns,
                                    same dent, same chain, four days apart
                                  ⇒ stage 2
talk to basil → the prophecy      ← "Then it says I am the one who stops you."
recite warning                    ← your own wording, from Chapter 2
                                  ⇒ stage 3
talk to basil → the village
show journal                      ← the ledger figures, your handwriting
tell about tyme                   ← what the bench looks like in forty years
                                  ⇒ stage 4
examine panel · tell about seam
talk to basil → cut so it can be unmade
                                  ⇒ stage 5
break panel with mallet           ← they brace the slab; you swing
```

**Then:** water comes back up the stair for an hour, audibly.

```
up · west · out                   → present.entrance
talk to tyme                      ← he does not understand what he is seeing
east · east                       → present.square
tell the village → the truth / the useful part / nothing
talk to marjoram                  ← "Boring," you tell her.
```

### Alternative branch — the sacrificial variant

At stage 4 or later, instead of persuading:

```
wedge slab
break panel with mallet           ← alone; the chamber comes in
```

The seam closes, the water returns, the village is saved and never knows. The
earlier self walks out alone and spends a life not being sure what happened.
**One real branch; both endings are authored. Recommendation is the
survivable one.**

### Deliberate dead ends, all recoverable

| Attempt | Outcome |
| --- | --- |
| `remove hood` at stage 0–1 | They read you as the Wanderer and go for the passage. Costs a stage. |
| `break panel with mallet` before stage 4 | They tackle you. Nobody hurt; the mallet ends up at the back of the chamber. |
| `up` / `out` (retreat) | They cross. The basin is deep again and the seam is wider: one more crossing of damage, visible in the wall. Climb back and the encounter resumes at stage 2, harder. |
| Arguing from the plank's authority | Fails by design. The plank is the hero's own words. |

---

## Continuity audit

Traced across all three documents: the critical path, the map, the clue order,
the item flow and both timeline tables.

| Check | Result |
| --- | --- |
| **Every required action is motivated before its result is known** | **Pass.** Crossing 1: curiosity about a threshold nobody has reached. Crossing 2: getting home. Crossing 3: getting to the moment it starts. P4: they are the only person who knows. P6: the only route out. No action requires foreknowledge of its own consequence. |
| **The warning is the prophecy's original source, consistent with the opening** | **Pass, with one acknowledged loop.** The shipped plank text is reproduced verbatim as the warning's descendant (design §6). Sage's shipped line — the central eye is "the carvers' idea, not the words'" — is what keeps the cyclops plausible. *Residue:* the detail **one-eyed** has no first author. Owned explicitly, not patched. |
| **Eye injury and identity evidence in a coherent order** | **Pass.** Injury (Ch3 mid), then a stranger names them (Ch3 late), then the hero has to *argue against* the identity they now fit (Ch4). The evidence that convinces is the lantern, not the eye — the eye is the obstacle. |
| **Temporal damage has observable cause and cumulative effect** | **Pass.** Five observable symptoms across three eras, two of which the player records themselves. Discrete per-crossing loss plus a 180-year leak, so the total is not a mystery. |
| **The final intervention implies no future-self meeting in the opening** | **Pass.** Chapter 1 as played *is* the unchanged history. Nothing is retrofitted. The player's recognition of the room is the whole effect. |
| **The closure rule solves the actual causal problem and is foreshadowed** | **Pass.** Problem: water in transit through an open seam. Rule: unmake the aperture, the seam cannot be addressed, the water settles. Foreshadowed twice in Ch2 — the cut note, and water audibly returning when the lamp is lifted. |
| **Both selves' fates and memory retention accounted for** | **Pass.** One rule (anchoring), stated by an inscription in Ch2, demonstrated on water before it is applied to a person. Hero persists with memory and injury; earlier self is anchored and simply lived the new version. No global memory for anyone else. No merge, no vanishing, no reset. |
| **No prerequisite needs an inaccessible item or a permanently missed clue** | **Pass.** Mallet has a future substitute. Lantern has a past substitute. Every required fact has ≥2 sources. The three-height drawing cannot be destroyed. Nothing required sits behind optional dialogue. |
| **Both input modes can perform every solution** | **Pass by construction**, with one item to watch: `COMPARE LEDGER WITH JOURNAL` needs a selectable equivalent, specified as a *Compare with my journal* action on the ledger object. The finale's `recite warning`, `show lantern`, `tell about tyme` are all conversation topics, which both modes already render. |
| **Pacing fits a short adventure** | **Borderline, honestly.** Ch1 ≈ 25 min (measured), Ch2 ≈ 25, Ch3 ≈ 20, Ch4 ≈ 15, aftermath ≈ 5 — about 90 minutes. Chapter 2 carries three puzzles and the warning and is the most likely to bloat. The cut list in design §9 exists for this. |

### Unresolved and honest

1. **The one-eyed bootstrap.** Not solvable within the fixed canon without
   inventing an original author, which is forbidden. Mitigated by owning it in
   dialogue. **The strongest residual issue in the design.**
2. **Does the hero's existence survive the change?** The anchoring rule says
   yes, and it is foreshadowed — but a reader may still feel that if the
   earlier self never crosses, the traveller cannot be there to prevent it.
   The rule is a *story* rule and is stated as such. Alternative considered and
   rejected: have the earlier self cross anyway and close the seam from the far
   side, which contradicts "the portal closes" and strands them.
3. **Chapter 3's population.** One named survivor (Parsie) plus one unnamed
   frightened one. Thin, and deliberately so; adding a third costs 20 minutes
   of writing for atmosphere.
4. **The finale's retreat penalty** adds a crossing of damage after the hero
   knows the cost. Defensible as a *player* choice rather than a required
   action, but it is the one place the game lets you do harm knowingly.
