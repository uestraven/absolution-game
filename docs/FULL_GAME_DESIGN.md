# Absolution — full-game design

> **SPOILERS.** This document contains the entire plot, including the ending.
> It is not player-facing and is not referenced from anything the game shows.

---

## 0. Revision 2 — what changed and why

Revised after owner review of `8ed3d96`. Nine corrections, all of them
narrowing the design rather than widening it:

| # | Owner's finding | Correction |
| --- | --- | --- |
| 1 | The catastrophe had shrunk to a dry valley | **Scope restored.** The water is the *first* and most measurable symptom of a breach that goes on to tear the continuity of events themselves. §3A, §2 Ch3 |
| 2 | Warning choices rewrote words the player had already read | **The prophecy's core wording is now fixed.** The player chooses explanation, tone, confidant and advice. The *advice* decides which record exists in the future — which is a far better consequence. §5 P4, §6 |
| 3 | The water rules contradicted each other | **Two distinct categories:** *crossed* matter completes a passage and is anchored forever; *swallowed* matter is held inside the breach and is expelled on closure. Only the second is "in transit". §3 |
| 4 | A 40-year ledger cannot date an action 140 years earlier | **Mechanism and instrument specified.** One aquifer, one gauge cut into Lovage's stair, readable in all three eras, and a record series that exists *because the hero advised it*. §5 P5 |
| 5 | The worksite alternate route depended on optional dialogue | **Two unconditional routes** after the warning. §5 P2 |
| 6 | The forced mis-aim made the hero look careless | **The datum moved, not the hero's arithmetic.** The drawing measures from a finished floor that has not been cut yet, and nobody in −140 knows its depth. §5 P3 |
| 7 | Finale retreat resumed an encounter that was never defined | **Retreat is removed.** The slab shuts behind the hero; the earlier self never crosses; every failure is conversational and precisely recoverable. §8 |
| 8 | Two survivors needed a real aftermath | **Written.** The older one takes Tyme's bench and keeps the path, with no name and no record. §8 |
| 9 | The audit called too much "Pass" | Re-graded in `FULL_GAME_WALKTHROUGH.md` with Pass / Partial / Open |

Also corrected: **Milestone 3 now includes a minimal future arrival**, to match
the owner's chapter boundary, which moves `schemaVersion` 2 into M3. §9

Unchanged, because the owner kept them: chapter structure, the builders'
drawing as the promised power, landmarks changing across eras, Tyme's payoff,
a finale built from collected objects and knowledge, and a hero who stays
sixteen.

---

## 1. Status and premise

### Pitch

A sixteen-year-old walks into a cave their village has walked into for
generations, and is the first to notice how it works. Noticing is the whole
problem. By the time they understand what the cave is, they have already
broken the hill their village drinks from, and the monster the village has
been praying about for eleven days turns out to be a tired teenager with one
eye and a mallet.

### Source

- **Reviewed commit:** `aad3a60` — *Milestone 1: correction and presentation
  pass on the opening*.
- **Verified at that commit:** `tsc --noEmit` clean; 208 tests across 9 files
  pass; 12 locations, 8 people, 20 flags as inventoried below. No uncommitted
  changes.
- Nothing in this document has been implemented. Milestone 2 is documentation
  only.

### Status legend

| Label | Meaning |
| --- | --- |
| **APPROVED CANON** | Fixed by the owner in the briefs. Not negotiable here. |
| **PROPOSED** | This document's recommendation. Needs owner approval. |
| **OPEN** | Deliberately not decided; listed for the owner. |

**Existing repository content is evidence of implementation, not proof of
approval.** The opening ships several details that were invented during
prototyping and remain PROPOSED: Hyssop's counted date, the vigil/lanterns/salt
custom, the lintel inscription, the cave-path paragraph naming what is down in
the village, and every character role. `docs/CANON.md` already separates these;
this document does not promote any of them.

### Design goals

1. **Observation, never eligibility.** The hero is first because they looked
   at a relief properly, not because of blood. Every later advantage is a
   thing they learned and can explain.
2. **One history, one change.** No parallel worlds, no obligatory loop, no
   reset that erases consequences.
3. **Responsibility, not surprise.** A player who guesses "I am the Wanderer"
   in chapter one should still have two hours of real mystery: *how* they do
   it, *whether* it can be undone, and *what it costs*.
4. **Short.** Four chapters, seven required puzzles, five recurring people,
   one hour to ninety minutes. Cut before padding.

### Where this draft depends on the owner

Five grouped decisions, set out in `docs/M2_DECISIONS.md`. The largest is
whether the ending is survivable (recommended) or sacrificial.

---

## 2. Ending-first story outline

### The ending, first — PROPOSED

The hero comes back through the fold at the one instant it can be entered from
the far side: the second their *earlier* self sets a lit lamp in the alcove and
the seam appears. They arrive in the sealed chamber, four days older, missing
their left eye, carrying a mason's mallet from a hundred and forty years ago.

They have to stop a sixteen-year-old from taking one more step — and that
sixteen-year-old has spent eleven days being told that someone who braves this
cave will have the power to turn aside a one-eyed monster. A one-eyed stranger
is now telling them to walk away and leave the village undefended. The
evidence of who the stranger is, is also the evidence that they should be
ignored.

What gets through is not proof of identity. It is two lanterns held side by
side with the same dent in the same shoulder, and then the hero reciting the
Wanderer-words — because the earlier self knows them by heart, and because the
hero is the reason they exist.

Then they break the eye. The pierced panel above the alcove is the only thing
in any era that can address the seam; it is the same stone in every era, which
is why it took damage in all of them and why one blow closes it in all of them.
The tear gives back everything it was holding, and the hill refills.
The subsidence never happens. The hill never comes down on the village.

**Cost.** Nothing is undone for the hero. They keep the eye socket, the four
days, and the memory of a valley with no water in it and the names of the
people who died in it — people who will now live and never know. The fold is
gone, so there is no going back and no going home; they are home, out of
sequence, aged four days past their own double. Both of them live. They walk
down the hill together and have to decide what to tell a village that is
expecting either a miracle or a monster, and have brought neither.

Recommended final line of play: they tell Marjoram it was boring.

### Chapter 1 — The village and the first cave

*Implemented. Ends at `past.square` with the prototype's end-of-chapter marker.*

| Field | Detail |
| --- | --- |
| **Entry state** | `present` era, `present.home`, nothing carried, nothing known, uninjured. Sixteen today. |
| **Immediate objective** | Undertake the rite of the Cave of Absolution. |
| **Motivation** | They are allowed to, as of this morning, and they have wanted to since they were nine. Three of their year have been already and found nothing. |
| **Main activity** | Village exploration; four contrasting accounts of the cave; the shuttered-relief puzzle. |
| **Complication** | The village is eleven days into a vigil for a prophecy that names this cave and, by implication, them. |
| **Discovery** | *Inferred:* the relief is instructions. *Confirmed:* a passage nobody has found, and a basin with a depth it has no room for. |
| **Exit action** | `ENTER THRESHOLD` in `present.deep_chamber`. |
| **Consequences** | Crossing #1. Seam opened and left open. Carried items travel. |

**One revision needed — PROPOSED.** Chapter 1 currently has no way to carry a
stone out for Parsie, and no beat where Tyme's "I will be here when you come
out" is cashed. Both are small additions, detailed in §9.

### Chapter 2 — The past

| Field | Detail |
| --- | --- |
| **Entry state** | `past` era, `past.deep_chamber`, whatever was carried, knows only that the village has no prophecy, uninjured. |
| **Immediate objective** | Get home. |
| **Motivation** | They are a stranger a hundred and forty years from their own bed, and the only way back they know of is the water they came out of — which is now a hand deep and perfectly ordinary. |
| **Main activity** | A village that does not know them; earning access to Lovage's worksite; reading the builders' setting-out plan; giving the warning. |
| **Complication** | Giving the warning is what loses them the worksite. Saffra believes them enough to be frightened; Lovage concludes a stranger who knows what the hill will do is a stranger who means to make it do it, and bars the stair. |
| **Discovery** | *Inferred:* the tear answers to light, and the lamp's height decides which era. *Confirmed:* the builders cut the aperture deliberately and cut it so it could be unmade; and that the basin is the hill's water table, not a pool. |
| **Exit action** | `PLACE LANTERN IN NICHE` at the height measured off the floor, `LIGHT LANTERN`, then `ENTER APERTURE`. The drawing measures from a *finished* floor that has not been cut yet, so every height is a hand out. |
| **Consequences** | Crossing #2, a hand out: forty years *past* home rather than back to it. The tear is still open. The warning enters the village's records, and the advice the player gave starts the 180-year water record that will later convict them. Lovage's mallet and the gauge reading are carried out. |

### Chapter 3 — The ruined future

| Field | Detail |
| --- | --- |
| **Entry state** | `future` era, `future.deep_chamber` (buried), carrying lantern, wedge, mallet; believes the fold is steerable but has just proved they cannot steer it; uninjured on arrival. |
| **Immediate objective** | Find out where they are and how far wrong, then get out of a chamber full of fallen roof. |
| **Motivation** | They aimed for home and did not arrive at it. Until they know how far wrong they are, they cannot correct it. |
| **Main activity** | Reading a ruin; the water record; two conversations with people who were children when they left. |
| **Complication** | The damage is not a dry valley. It is a tear that has moved on from water to stone to the order of events, and it is spreading valley by valley. Partway through clearing the aperture, a struck spall takes their left eye; the next person who sees them backs away from a one-eyed figure walking out of the hill, and names them. |
| **Discovery** | *Inferred, early:* the valley has no water and the days near the hill are repeating. *Confirmed:* one gauge, four readings and a 180-year record agree that the hill began losing water the year a stranger told the village to start counting it, and that it fell two marks in one night — the night in the hero's own journal. |
| **Exit action** | `PLACE LANTERN IN APERTURE` at the third height, read off the aperture's own rim, then `LIGHT LANTERN` and `ENTER APERTURE`. |
| **Consequences** | Crossing #3, aimed correctly, arriving at the only instant the far side is addressable. Eye lost. Causation established. |

### Chapter 4 — The return and the finale

| Field | Detail |
| --- | --- |
| **Entry state** | `present` era, `present.sealed_chamber`, four days of subjective experience, one eye, lantern, wedge, mallet, journal. |
| **Immediate objective** | Stop the person in front of you from opening the passage. |
| **Motivation** | They have seen what the next forty years do to everyone they know, and they are standing next to the moment it starts. |
| **Main activity** | A staged, turn-based encounter: being believed, then being argued with, then being helped. |
| **Complication** | The earlier self's own conclusion from the evidence is that the Wanderer has come to disarm its only opponent. |
| **Discovery** | *Confirmed:* the prophecy's provenance, out loud, by the two people who between them wrote it. |
| **Exit action** | `BREAK PANEL WITH MALLET`, with the earlier self bracing the slab. |
| **Consequences** | Seam closed in every era. Water settles. Both selves persist. Hero keeps the injury and the memory. |

---

## 3. Time and causality ledger

### Story rules, stated once — PROPOSED

Two rules. They are different, and conflating them was the first draft's worst
error.

> **1. Crossing.** Matter that completes a passage through the breach — all
> the way out the other side — comes **out of the river**. It persists as it
> is, whatever happens to the history that produced it, and it stays where it
> arrived. Water, objects and people alike. Closure does not recall it.
>
> **2. Swallowing.** The breach is a tear with volume, not a doorway. Matter
> that falls *into* it and does not come out the other side is **held**:
> neither in the era it left nor in any other. Closure collapses the tear and
> expels everything it was holding back into the era it fell from.

Everything that has not crossed and is not held is **anchored**, and changes
when history changes.

That distinction does all the work:

- The hero **crossed**, three times. They are anchored out of the river: they
  keep their memories, their eye socket and their existence after preventing
  their own journey. **This is rule 1, not an exception to it.**
- Lovage's mallet **crossed**. It stays in the hero's hand after its maker's
  century is rewritten.
- The hill's water was **swallowed** — it fell into the tear over 180 years
  and never arrived anywhere. Closing the tear gives it back. **This is the
  closure rule, and it is why closing the breach in any one era repairs every
  era.**
- The three crossings each carried a few litres through as well. That water is
  gone for good, and is negligible — the design says so out loud, through
  Lovage's gauge, so the player is not left wondering.
- The earlier self is **anchored**: the new history is simply their life, and
  they remember the encounter because it happened to them.
- Nobody else retains anything. No global memory. No second traveller.

### What the catastrophe actually is — PROPOSED

The owner is right that a dry valley is not the end of the world. It is the
first thing you can measure.

The hill is a place where the continuity of events is thin — that is why a lamp
and an aperture can address it at all. A breach left open does not stay the
same size. It takes whatever will fall into it, and it takes the most mobile
thing first.

| Stage | What falls in | Where the player sees it |
| --- | --- | --- |
| **Water**, from year −140 | The aquifer, continuously | Lovage's gauge; the journal; the 180-year record; a dry valley in +40 |
| **Stone**, from roughly year +10 | The hill's own mass, slumping toward the tear | The subsidence that buries the cave and the village |
| **Sequence**, from roughly year +30 | The order of events near the hill | **The margins of Chapter 3** |

The third stage is the end of the world, and it is observable rather than
announced:

- The survivors keep a calendar with repeated days on it, because some days
  repeat. They are matter-of-fact about this; it is just a thing that happens
  near the hill now.
- Rain near the mouth falls upward for a few seconds at a time.
- A bell is heard that has not been rung yet. Later in the chapter, it is rung.
- Parsie says it reached the next valley five years ago, and the one beyond
  that last winter. He has no theory. He has a map with a shaded edge on it.

So: the village's destruction is the **leading edge** of a tear that is
spreading through history, and the prophecy's "what stands will not stand" is
accurate about everything, not just a hillside. Closure stops it at the stage
it has reached and expels what was held.

**Scope control.** This is three or four descriptive beats and one map prop in
Chapter 3. It does not add a system, a mechanic or a room. It restores the
premise's stakes at the cost of about four hundred words.

### A. The hero's subjective order

| # | Where | Elapsed | Carried out | Injury |
| --- | --- | --- | --- | --- |
| 1 | Village and first cave | day 1, morning–evening | lantern, wedge | — |
| 2 | Past (year −140) | days 1–3 | + Lovage's mallet, + bone pin (optional) | — |
| 3 | Ruined future (year +40) | day 3–4 | + the record's figures, copied | left eye, mid-chapter |
| 4 | The sealed chamber, finale | day 4, the same evening as (1) | — | — |

Four days lived. They are sixteen throughout. **They do not become an adult**
because a destination is distant.

### B. The world's calendar order

| Calendar | Event | Who knows |
| --- | --- | --- |
| year −140 | Lovage's crew are three seasons into cutting the stair. The aperture is cut; the camouflage is not. | the past village |
| year −140 | A stranger arrives out of the basin, earns the worksite, and warns the village. It is written down. | the past village |
| year −140 | The stranger leaves through the half-cut aperture. The seam is left open. | nobody |
| −140 → 0 | The warning is copied, shortened, chanted at midwinter, and carved. "A wanderer" becomes "the Wanderer". **The village keeps an annual water record the whole time, because the stranger told them to.** The tear swallows water the whole time. | everyone, as tradition |
| year 0, morning | Basil/Basilia turns sixteen. Hyssop has counted a date out of the old lines; the village is eleven days into a vigil. | the village |
| year 0, evening | The earlier self solves the relief, lights the lamp, and the seam appears. | the player |
| **year 0, evening, the same second** | **The intervention.** A one-eyed stranger arrives. The eye is broken. The seam closes. The water returns. | both selves |
| year 0 onward | No subsidence. The vigil ends. The prophecy is never fulfilled and was never wrong. | the village |
| ~~year +10 onward~~ | ~~The hill begins slumping toward the tear.~~ | **overwritten** |
| ~~year +30 onward~~ | ~~The order of events near the hill starts to fail. Repeated days. The effect spreads valley by valley.~~ | **overwritten** |
| ~~year +40~~ | ~~The hill subsides onto the village. The valley is dry. The tear is still widening.~~ | **overwritten** |

### C. How the warning is already historical while the finale is new

The two are different kinds of event, and the asymmetry is the point.

- **The warning** happened on the hero's first pass through year −140. From the
  village's side it had already happened five generations before the hero was
  born. Nothing was changed by it: the history the hero grew up in already
  contained it. When they give it, they are not altering anything — they are
  finding out they were always the author. The player's recognition beat is
  that the hero is *quoting the plank they read that morning* (§6).
- **The finale** targets a minute the hero has already lived from the other
  side, and adds a second person to it. Their own memory of that minute
  contains no stranger. So this one is a change, and it is the only one.

**No future self appears in Chapter 1 as played.** Chapter 1 *is* the
unchanged history. The player will recognise the room and the moment when they
arrive in Chapter 4; that recognition is the design, and it requires nothing to
be retrofitted into the opening.

### D. Crossings and damaging actions

| # | Motive | Trigger | Destination | Transported (**crossed**, kept) | Immediate symptom | Lasting effect | Later evidence | Expelled by closure? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Find what the cave is for | `ENTER THRESHOLD` (basin, lit alcove) | year −140, basin chamber | lantern, wedge, clothing, a few litres of water | Gauge drops one mark; a hairline opens in the patterned wall | **The tear is left open** | Journal reading before and after | No — this water crossed |
| 2 | Get home | Lamp in the half-cut aperture, measured from the wrong datum | year +40, buried chamber | + mallet | Past gauge drops a mark; Lovage's crew hit dry rock the next week | Tear still open | Ledger's opening entries | No |
| 3 | Reach the moment it starts | Lamp in the cleared aperture, third height | year 0, sealed chamber, the instant the seam appears | + journal | Future basin empties | — (closed minutes later) | — | No |
| — | **The open tear itself** | Leaving it open from year −140 | — | nothing arrives anywhere | Nothing noticeable in a day | **This is the catastrophe:** 180 years of water, then stone, then sequence, all *swallowed* and held | The gauge's total fall; the record's slope; the repeated days | **Yes — all of it** |

The three crossings cost four marks on the gauge between them. The tear costs
the whole hill. **The hero's crime is not the travelling; it is leaving the
door open behind them**, and the design says so in those words once, in
Chapter 3.

**Why ordinary rite participants caused nothing.** They never crossed and
never opened the tear. Oreg got the shutter up once, looked into an empty
alcove and let it fall. Dilly never reached the room. Rose went to the end of
the rope. The hero is not more deserving; they are the first to put a light in
the right place, and the cost attaches to *that*.

### E. Player knowledge vs. character knowledge

| Beat | Player may suspect | Hero knows |
| --- | --- | --- |
| Ch1, reading the plank | "one-eyed" is aimed at me | nothing |
| Ch2, giving the warning | the warning *is* the prophecy | realises it mid-sentence — they are quoting the plank |
| Ch3, arrival | this is the cataclysm | sees a dry valley; does not yet know why |
| Ch3, the record | I did this | reads two records that agree with their own journal |
| Ch3, after the injury | I am the Wanderer | hears a stranger name them |
| Ch4 | — | everything, and has to make it persuade someone |

### F. Honest residue

**One acknowledged bootstrap.** The specific detail *one-eyed* has no first
author. The hero reads it on the plank in year 0 and speaks it in year −140;
the village carries it forward to the plank. It is a closed information loop,
it makes consistent predictions, and the design **owns it rather than
inventing an unseen original author** — which the brief forbids. The hero
notices it and finds it obscene; a short exchange in Chapter 4 is the only
place it is discussed.

Note what is *not* a loop: the hero does not lose the eye because the prophecy
said so. They lose it to their own mallet, doing something necessary, and the
resemblance is a cruelty of the fold rather than a cause.

---

## 4. Map by era

Conceptual IDs with era variants. Existing implemented IDs are marked.

### Village

| Concept | `present` | `past` | `future` | Notes |
| --- | --- | --- | --- | --- |
| `home` | ✅ `present.home` | — | `future.home` ruin | Future: roofless, the sill still there |
| `square` | ✅ `present.square` | ✅ `past.square` | `future.square` | The well is the anchor landmark in all three |
| `workshop` | ✅ `present.workshop` | *(the half-built wall in `past.square`)* | — | Past: unroofed frame on the same footprint |
| `cave_path` | ✅ `present.cave_path` | `past.cave_path` | `future.cave_path` | Tree → stump → fallen trunk under rubble |
| `spring` | — | `past.spring` | `future.spring` | **New.** The village's water. High in the past, dry in the future. Not present in `present` (it is simply the well) |

### Cave

| Concept | `present` | `past` | `future` | Notes |
| --- | --- | --- | --- | --- |
| `entrance` | ✅ `present.entrance` | ✅ `past.entrance` | `future.entrance` | Slot with a bench → squared doorway → choked with fallen hill |
| `outer_gallery` | ✅ `present.outer_gallery` | *(does not exist yet)* | *(collapsed)* | The relief is here |
| `echo_chamber` | ✅ `present.echo_chamber` **optional** | — | — | Stays optional |
| `sealed_chamber` | ✅ `present.sealed_chamber` | `past.worksite` | `future.rubble` | Same stone, three states: finished and camouflaged / being cut / crushed |
| `deep_chamber` | ✅ `present.deep_chamber` | ✅ `past.deep_chamber` | `future.deep_chamber` | The basin. Deep fold / hand of water / dry |

### Compact map

```
VILLAGE                          CAVE
home ─ square ─ workshop         entrance ─ gallery ─┬─ echo (optional, present only)
         │                           │               └─ sealed/worksite/rubble
      cave_path ───────────────── entrance                     │
         │                                                 deep (basin)
      spring (past, future)                                    ╎  the seam
```

The past has no gallery and no echo chamber: a worked stair runs straight from
the mouth to the worksite. The future has no gallery either — it is under the
hill. **Both facts are already true in the shipped Chapter 1 text** ("There is
no gallery... cut stone with a handrail groove").

### Scope

- **Unique rooms to build:** 8 (`past.cave_path`, `past.spring`,
  `past.worksite`, `future.entrance`, `future.cave_path`, `future.square`,
  `future.rubble`, `future.deep_chamber`). `future.home` is optional.
- **Required puzzles:** 7, including the shipped opening and the finale.
- **Recurring characters:** 5.
- **Optional rooms:** `present.echo_chamber` (shipped), `future.home`.

---

## 5. Puzzle specifications and dependency graph

### Dependency graph

```
            ┌─ optional: echo chamber, Parsie's stone, bone pin
            │
P1 shuttered relief ──► crossing 1 ──► P2 worksite access ─┐
   (Ch1, shipped)                                          ├─► P3 aiming ──► crossing 2
                                      P4 the warning ──────┘      (Ch2)
                                         (Ch2)
                                            │
                          ┌─────────────────┘ (the warning is what bars the stair,
                          │                     so P4 gates P2's second route)
                          ▼
   crossing 2 ──► P5 the record ──► P6 clearing the aperture ──► crossing 3
                    (Ch3)              (Ch3, eye lost)
                          │                    │
                          └────────────────────┴──► P7 the finale (Ch4)
                             (both feed the evidence the finale needs)
```

No cycles. No critical clue sits behind missable optional dialogue: every
required fact has at least two sources (§6).

---

### P1 — The shuttered relief · `present.sealed_chamber` · **shipped**

Unchanged. See `docs/WALKTHROUGH.md`. Listed here only as the dependency root.

---

### P2 — Getting onto the worksite · `past.cave_path` / `past.worksite`

| | |
| --- | --- |
| **Purpose** | Establish the hero as a stranger with no standing, and make the past a place with its own rules rather than a diorama. |
| **Prerequisites** | Crossing 1. |
| **Visible first** | Lovage's crew on the path with barrows; a rope across the mouth; chalk tallies on a board. |
| **Clues** | Fenn says his brother carries water up and nobody checks the water-carrier. Saffra says Lovage will not have strangers on the stair "while the chalk is wet". The barrow of empty skins by the spring. |
| **Why the solution follows** | The one person who goes up and down unchallenged is the one carrying something they need. |
| **Solution** | `GO TO SPRING` → `TAKE SKINS` → `FILL SKINS` → `GO TO ENTRANCE` → `GIVE SKINS TO LOVAGE`. Selectable: *Spring* → *water skins* → *Take* / *Fill* → *Entrance* → *Give the water skins to Lovage*. |
| **Items** | `water_skins` (recoverable; Lovage keeps them, which is the point). |
| **Flags** | `past_worksite_access`. |
| **Wrong but reasonable** | Asking Lovage directly: *"No. Come back when you are somebody."* Climbing: the shale gives and you slide back down, unhurt, and he watches you do it. Showing him the lantern: he admires it, and still says no. |
| **Hints** | 1. Somebody goes up that stair all day and nobody stops them. 2. Fenn mentioned who carries the water. 3. Fill the skins at the spring and carry them up yourself. |
| **Recovery** | The skins cannot be lost; if dropped they stay where dropped. If the player gives the warning (P4) first, this route closes and the alternative below applies. |
| **Cross-era consequence** | None. |

**After P4, the water route is barred** — Lovage pulls the rope across and
posts his eldest on it. **Two replacement routes, both unconditional:**

- `TALK TO FENN` → topic *the old way*. This topic **appears the moment
  `gave_warning` is set and never disappears**, with no prerequisite on any
  earlier conversation. Fenn comes and finds the hero; he is frightened and
  wants to be useful, and he knows a crawl behind the spoil heap.
- `TALK TO SAFFRA` → topic *get me up there*. She walks the hero past Lovage
  herself. She does not enjoy it and he does not forgive her.

**No dialogue in this chapter is a prerequisite for progress.** Every topic
that gates anything is either always available or appears on a flag that the
required path sets. Order-independent: whichever of P2 and P4 happens first,
the other has a route.

---

### P3 — Aiming the lamp · `past.worksite`

| | |
| --- | --- |
| **Purpose** | Teach, as a usable mechanic, the thing the prophecy calls *the power*: the fold answers to light, and the lamp's **height** selects the era. This is the chapter's real prize and the hero's only asset in Chapter 3. |
| **Prerequisites** | P2 (access). |
| **Visible first** | A half-cut aperture in a thinned panel. No camouflage yet — the scale-pattern is chalked out but not carved. Below it a rough niche, not yet dished. A setting-out drawing in chalk on the floor, **complete**, with a scale and all three heights marked. |
| **Clues** | The drawing: a lamp at three heights with three different lines fanning up through the aperture. Lovage's note beside it, cut not chalked: *CUT SO IT CAN BE UNMADE* (§6). Beside the drawing, the figure the hero has already seen on the gallery relief — the same traveller, the same lamp, but here it is a working diagram with numbers on it. |
| **Why the solution follows** | The relief in Chapter 1 showed one height. The drawing shows three, with numbers. The hero has spent a day looking at an instruction sheet with two thirds of it weathered off. |
| **Solution** | `EXAMINE DRAWING` → `MEASURE NICHE` → `PLACE LANTERN IN NICHE` → `LIGHT LANTERN` → `ENTER APERTURE`. Selectable: *Chalk drawing* → *Examine*; *Niche* → *Measure*; *hooded lantern* → *Put in…* → *niche*; *Light it*; *aperture* → *Step into it*. |
| **Items** | Lantern (recovered automatically on crossing, as in Ch1). Journal auto-records the three heights — **this is the record P6 depends on.** |
| **Flags** | `read_setting_out`, `knows_aiming`. |
| **Wrong but reasonable** | Placing the wedge in the niche: *"Oak in a hole in a wall. The dish is cut for something that burns."* Hammering the aperture now: *"Lovage would kill you, and it is the only way out you have."* Asking Lovage what the numbers are measured from: he tells you — *off the floor* — and goes back to work. |
| **Hints** | 1. The drawing is not decoration; it has numbers on it. 2. Three heights, three destinations. The relief at home only ever showed you one. 3. Measure from the floor, set the lamp at the height you want, light it, and step through. |
| **Recovery** | The drawing cannot be destroyed. If the lantern is lost in the past, Lovage's crew have oil lamps; `ASK LOVAGE FOR A LAMP` after `past_worksite_access`. |
| **Cross-era consequence** | **Yes, and the player sees it.** The basin in `past.deep_chamber` drops a hand's width when the hero arrives, and the player can go and look. Lovage's crew hit dry rock the next week and say so. |

**The authored mis-aim — revised.** The drawing is complete and the hero's
arithmetic is correct. **The datum moves.**

The heights are measured from the chamber's *finished* floor. The floor is not
finished: Lovage's crew are still cutting it down, and will take another hand's
depth out of it before they dish the niche. So the only floor that exists to
measure from is a hand too high, every height the hero sets is a hand too high
relative to the plan, and the lamp addresses the wrong era.

This is not carelessness, and the player can check all of it:

- `ASK LOVAGE ABOUT THE NUMBERS` → *"Off the floor."* He is telling the truth.
  He does not add *the finished floor*, because to him there is only one floor
  and he is standing in the middle of making it.
- `ASK LOVAGE ABOUT THE FLOOR` → *"Another hand off it before the dish goes
  in. Why?"* **Available, and still not enough**, because the drawing gives no
  datum mark and nobody in year −140 knows the finished depth: it is the last
  thing cut, and Lovage is working to a plan handed down to him.
- `EXAMINE FLOOR` → chisel scars, a fresh step, spoil heaped at the wall. The
  floor is visibly mid-cut. **A thorough player will feel the unease without
  being able to act on it**, which is the right shape for a mistake the story
  requires.

The hero realises it on the way through — one line, too late: *the floor is not
finished*. In Chapter 3 the finished floor exists, and the aperture's rim
carries the datum mark, so the third height is finally readable. **The failure
teaches the mechanic it needed to teach, and nobody involved was sloppy.**

---

### P4 — The warning · `past.square`

| | |
| --- | --- |
| **Purpose** | The story's hinge, played as a conversation with real authorship. The hero chooses what to say; what they say is what the plank says in year 0. |
| **Prerequisites** | Crossing 1. Reaching `past.square`. |
| **Visible first** | Saffra on her plank; Fenn; a village with no cord between the eaves and no bowl of salt. |
| **Clues** | The hero already has them all: the plank, Sage's gloss, the vigil. The question is not what is true but what to pass on. |
| **Why the solution follows** | They are the only person alive who knows the hill is going to fail. |
| **Solution** | `TALK TO SAFFRA` → topic *the hill* → then a **three-part authored choice**, each part a selectable topic / typed phrase: **(a) what is coming** — *the hill will open* / *the water will fail* / *what stands will not stand*; **(b) who brings it** — *a wanderer* / *a stranger from the ford* / *I do*; **(c) what to do about it** — *keep a vigil* / *watch the water* / *send someone into the cave*. |
| **Items** | None. |
| **Flags** | `gave_warning`, plus `warning_text_a/b/c` recording the choices. |
| **Required content** | At least one option from each part must be chosen. The hero cannot refuse the warning — it is already in the history they came from — but **every option is authored, none is wrong, and the player owns the wording.** |
| **Wrong but reasonable** | Trying to explain time travel: Saffra hears a stranger describing a hole in the year and goes back to her mortar. The hero may try; it costs nothing and lands nowhere. Warning Fenn instead: he believes it completely and nobody believes him, which is its own small tragedy and does not satisfy the flag. |
| **Hints** | 1. You know something about this hill that nobody here does. 2. Saffra is the one who will be believed. 3. Tell Saffra about the hill, say who brings it, and say what to do. |
| **Recovery** | Saffra is in the square all chapter. |
| **Cross-era consequence** | **Yes, three ways.** The year-0 plank's wording, the carving on the gallery relief, and the future's records all reflect the player's choices. Checked in Chapter 4 when the hero recites it. |

**The recognition beat.** Whichever options the player picks, the hero hears
themselves and stops. One line of narration: these are not their words. They
read them on a plank this morning.

---

### P5 — The water record · `future.square`

| | |
| --- | --- |
| **Purpose** | Establish causation by evidence the player assembles. No announcement from anybody. |
| **Prerequisites** | Crossing 2, and getting out of `future.deep_chamber`. |

#### The physical relationship, established on screen in Chapter 2

The first draft asked the player to compare water levels in two different
places. That proves nothing. Fixed as follows, and **all of it is established
in Chapter 2, before it is needed**:

1. **One body of water.** The hill holds a single aquifer. The basin in the
   deep chamber is not a pool; it is the aquifer's surface, showing at the
   lowest point anyone has cut down to. Lovage says this in one sentence,
   because it is his whole job: *"We are not digging for a pool. We are digging
   until we hit the water, and that is the water the village drinks."*
2. **One instrument.** Lovage's crew track it. Cut into the stair beside the
   basin is a **numbered gauge** — marks at a hand's spacing, with the
   numbers chiselled, because a chalk mark would not last the season. The hero
   reads it in Chapter 2 and the journal records the number.
3. **The same gauge in every era.** It is cut into the same stone. In year 0 it
   is there, worn; the player can be shown it on a return visit to the deep
   chamber. In year +40 it is there, dry, with every mark exposed.
4. **The spring is fed from the same body**, lower down the hill. Flow at the
   spring is a function of the head in the hill. Saffra states it plainly:
   *"When the hill is full, the spring runs. When it is not, it does not."*

So the chain is one instrument, one body of water, four readings.

#### The readings the player actually holds

| When | Reading | How the player gets it |
| --- | --- | --- |
| Year −140, before crossing 2 | gauge **31** | Ch2, `EXAMINE GAUGE`; journal records it |
| Year 0, evening, before crossing 1 | gauge **12** | Ch1, journal records it *(proposed addition, §9)* |
| Year 0, evening, after crossing 1 | gauge **11** | Ch1/Ch2 |
| Year +40 | gauge **0**, and two marks of silt above the floor | Ch3, `EXAMINE GAUGE` |

**What that gives, and what it does not.** It gives a 180-year fall of 31
marks, and two sharp single-mark steps on one evening in year 0. It does
**not** by itself date anything to year −140 — the owner is right about that.
The dating comes from the record series, below.

#### The record series, and why it is long enough

A 40-year ledger cannot reach back 140 years. **A 180-year one can, and it
exists because the hero asked for it.**

Whatever advice the player gives in P4, the village starts keeping an annual
record of the hill's water, and keeps it for 180 years, because that is what
villages do with instructions from a frightening stranger who turned out to be
right about everything else:

| Advice chosen in P4 | The record it creates | Who holds it in year +40 |
| --- | --- | --- |
| *watch the water* | A ledger of the spring's flow, one line a year | Parsie, who inherited the job |
| *keep a vigil* | The midwinter minutes, which note the state of the well each year | Parsie, from the vigil chest |
| *send someone into the cave* | The keepers' log — Tyme's predecessors, recording the gauge every year | Parsie, from the bench at the mouth |

All three are a dated annual series of water observations. **The choice changes
who kept it, what it is called and what else is in it — not whether the
evidence exists.** This is the P4 consequence that replaces the discarded
idea of rewriting the plank, and it is better: the hero's own advice is what
builds the case against them.

#### Solution

```
EXAMINE RECORD          the series: a slow fall for 180 years, and one year
                        with a two-mark drop in a single night
READ JOURNAL            your own gauge readings: 31, then 12, then 11
COMPARE RECORD WITH JOURNAL
TALK TO PARSIE          topic: the night the well dropped
```

| | |
| --- | --- |
| **Why the solution follows** | Three things agree. The series falls from the year the record starts, which is the year a stranger told them to start it. The only night in 180 years that it fell two marks at once is the night in the hero's own journal. And the hero's year −140 reading is the top of the series. |
| **New verb** | `COMPARE X WITH Y`, narrowly scoped to `record` × `journal`. Justified: this is the one puzzle whose answer is an inference between two documents, and making the player state it is what turns exposition into discovery. Everything else gets *"They have nothing to do with each other."* |
| **Flags** | `read_record`, `knows_cause`. |
| **Wrong but reasonable** | Asking Parsie outright what happened: he tells the story of the hill coming down and blames the hill. He has the whole case in his lean-to and has never had the fourth number. **The omniscient-NPC route is explicitly closed.** |
| **Hints** | 1. Somebody has been counting the water since long before you were born. 2. You have been counting it too, without meaning to — look at your journal. 3. Compare the record with your journal, then ask Parsie about the night the well dropped. |
| **Recovery** | The record is fixed scenery and cannot be taken, lost or destroyed. Parsie is in the square for the whole chapter. |
| **Cross-era consequence** | None; this is where consequence is read. |

**What the player concludes, precisely.** Not "the hill failed". That the hill
has been losing water since the year someone first opened something in it, that
the someone was them, and that **the two sharp steps are the two doors they
opened and did not shut.**

### P6 — Clearing the aperture · `future.rubble`

| | |
| --- | --- |
| **Purpose** | The return route, the third aiming figure, and the eye. |
| **Prerequisites** | `knows_aiming` (P3), the mallet, and `knows_cause` is **not** required — a player can attempt this before understanding why, and the game lets them. |
| **Visible first** | The sealed chamber, crushed. The pivoting slab is down and broken. Of the pierced panel, one edge shows. |
| **Clues** | The journal's two measured heights, and the fact that one was missing. The exposed waterline on Lovage's stair, far below where it used to be. |
| **Why the solution follows** | The aperture is the only thing that addresses the seam, and it is under a yard of fallen roof. |
| **Solution** | `WEDGE SLAB` → `BREAK RUBBLE WITH MALLET` (×2, authored, with escalating description) → **the spall** → `EXAMINE APERTURE` (the third height is cut into its rim, where it always was) → `PLACE LANTERN IN APERTURE` → `LIGHT LANTERN` → `ENTER APERTURE`. Selectable throughout: *broken slab* → *Wedge it*; *fallen rubble* → *Use the mallet on this*; *aperture* → *Examine* / *Step into it*. |
| **Items** | Mallet (required; carried from Ch2). Wedge (required; prevents the slab dropping). |
| **Flags** | `aperture_cleared`, `lost_eye`, `knows_third_height`. |
| **The injury** | On the second mallet blow. Two sentences, no spectacle: a chip of stone comes off the hill at the speed he swung it, and afterwards the left side of everything is gone. The hero sits down for a while. The interface does not change — **no half-blanked screen, no monocular gimmick**; the brief rules those out and they would break accessibility. One journal line: *My left eye is gone. I did it myself, with Lovage's mallet, getting at the hole in the wall.* |
| **Wrong but reasonable** | Hammering without wedging the slab: it drops, nothing is hurt, and you have to lift it again — a recoverable setback, not a death. Hammering with the wedge: *"Oak on stone. The oak loses."* Digging by hand: hours of it, described, and the rubble does not move. |
| **Hints** | 1. The thing you need is under that. You are carrying a mason's mallet. 2. Wedge the slab before you swing, or it will come down on the hole you are opening. 3. Wedge the slab, break the rubble with the mallet, then look at the rim of the aperture. |
| **Recovery** | **If the mallet was left behind in Chapter 2**, the future has one: the ruin of Oreg's workshop in `future.square` yields a maul. Slower, described as such, same outcome. No softlock. |
| **Cross-era consequence** | The injury is permanent and is the identity evidence the finale turns on. |

**Confirmation of identity, done by the world.** On walking out of the hill
one-eyed, the hero meets whoever is left at the mouth, and they back away and
say the word. Narration never states that the hero is the Wanderer; a
frightened sixty-year-old does.

---

### P7 — The finale · `present.sealed_chamber`

Full flow in §8. Summary: a staged conversation whose currency is physical
evidence, ending in a two-person physical action.

---

## 6. Prophecy and clue plan

### The two texts, side by side — PROPOSED, **core wording fixed**

The owner's correction: the player must not rewrite words they have already
read. **The prophecy's core lines are fixed**, and they are the shipped
plank text. The hero speaks those lines because they are the only words they
have. What the player chooses is everything around them.

| The warning (year −140) | Fixed? | The plank (year 0, shipped) |
| --- | --- | --- |
| "The hill will open." | **Fixed** | *The hill will open.* |
| "The water will answer." | **Fixed** | *The water will answer.* |
| "What stands will not stand." | **Fixed** | *What stands will not stand.* |
| "A wanderer brings it. One-eyed, and without mercy to it." | **Fixed** | *The Wanderer comes one-eyed and without mercy.* |
| "Someone who braves the cave can turn it aside." | **Fixed** | *One who braves the Cave of Absolution will have the power to turn it aside.* |

**What the player chooses — four things, none of which touches the text:**

| Choice | Options | Consequence |
| --- | --- | --- |
| **Explanation** | the hill is hollow and leaking · there is a hole in the year · I will not tell you how I know | What the village believes it is *about*, which shapes how the chant is glossed at midwinter. Sage's gloss in Chapter 1 is already written to accommodate any of them. |
| **Tone** | warning · confession · plea | Whether the carved figure 180 years later is a monster, a penitent or a supplicant. The gallery relief's traveller already reads as all three. |
| **Confidant** | Saffra · Lovage · Fenn | Who is credited in the record, and whose handwriting is at the bottom of it — found in Chapter 4's aftermath. |
| **Advice** | watch the water · keep a vigil · send someone into the cave | **Which 180-year record exists in year +40**, which is the evidence in P5. The load-bearing choice. |

**The recognition beat does not depend on any choice**, because the lines are
fixed: whatever the hero wraps around them, the five sentences in the middle
are the ones off the plank they read that morning, and they hear it.

**Transmission.** Four mundane moves: the confidant writes it on the back of a
board; it is read at midwinter because that is when the village reads things;
it is shortened to fit the chant, and the qualifier *to it* — the thing that
made "without mercy" an apology rather than a threat — is the first casualty;
a carver two generations later works from the chant, which is where the
central-eye picture Sage already blames on "the carvings" comes from.

**The cyclops stays plausible with no false statement from narration.** The
authoritative text says *one-eyed* and nothing about placement; Sage's shipped
line already attributes the middle-of-the-face image to the carvers. That line
is load-bearing and must not be edited.

### Hanne → Hyssop's counted date — PROPOSED: **retain, as implemented**

The prototype's original prophetic dream was already removed in Milestone 1;
Hyssop now counts a date out of the existing lines "the way you would count a
debt". **Retain that.** It introduces no second supernatural system, it is
ordinary human arithmetic on old words, and she turns out to be right by luck —
year 0 *is* when it starts. Nobody ever learns she was guessing. **No
foreknowledge exists anywhere in this design.**

### Clue table

| Clue | First appears | Taken to mean | Actually means | Confirmed | Status | Spoiler risk |
| --- | --- | --- | --- | --- | --- | --- |
| *one-eyed* on the plank | Ch1 square | a monster's anatomy | the hero, later | Ch3, after the injury | required | **High** — accept it; a player who guesses still does not know the cost |
| "the water will answer" | Ch1 square | poetry | the aquifer | Ch3 record | required | low |
| Basin "a depth it has no room for" | Ch1 deep chamber | wonder | a seam, leaking | Ch2 drawing | required | low |
| The gauge drops a mark after a crossing | Ch1/Ch2 | odd | the damage, measured, in numbers | Ch3 comparison | required | medium |
| Hairline in the patterned wall | Ch1→Ch4, grows each crossing | weathering | strain in one continuous stone | Ch4 | optional | low |
| *CUT SO IT CAN BE UNMADE* | Ch2 worksite | builders' pride | the closure rule | Ch4 | **required** | low |
| "out of the river" inscription | Ch2 worksite | a riddle | the anchoring rule | Ch4, applied to a person | **required** | medium |
| The three-height drawing | Ch2 worksite | decoration | the power | Ch3 return | required | low |
| Tree → stump → fallen trunk | Ch1/Ch2/Ch3 | scenery | 180 years, one hillside | Ch3 | optional | low |
| Two identical lanterns | Ch4 | — | the only evidence that works | Ch4 | required | low |
| The numbered gauge | Ch1 deep chamber *(proposed addition)* | old cave furniture | the instrument the whole case rests on | Ch2, when Lovage explains it | **required** | low |
| The 180-year water record | Ch3 square | a local grievance | the hero's own itinerary, kept at the hero's own request | Ch3 | **required** | medium |
| Repeated days on the survivors' calendar | Ch3, early | survivors being strange | the tear has reached sequence; this is the end of the world | Ch3, when the bell is rung | **required** | medium |
| Rain falling upward at the mouth | Ch3, early | wonder | same | Ch3 | optional | low |
| Parsie's map with a shaded edge | Ch3 square | a local map | the spread, two valleys in five years | Ch3 | optional | medium |
| Parsie's stone | Ch1 optional → Ch3 | a kid's errand | he kept it forty years | Ch3 | optional | none |

**Multiple sources for every central revelation.** Identity: the plank, the
injury, a stranger's reaction, two lanterns. Causation: the gauge, the journal,
the 180-year record, Parsie's memory. Scope: repeated days, the upward rain,
the bell, the shaded map. Closure: the cut note, the two-rule inscription, and
watching water come back up the stair when the lamp is lifted in Chapter 2.

**No compulsory disastrous action.** The hero never has to do something they
already know is ruinous to move the plot. Crossings 1 and 2 happen before they
know the cost; crossing 3 is the one that lets them fix it.

---

## 7. Character and choice plan

Five recurring people. Four are already implemented.

| Name | Era(s) | Role | Relationship | Wants | On the rite/prophecy | Memorable beat | Payoff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Tyme** | present, future | Keeps the entrance and the rope | The adult who takes the hero seriously | For nobody to get hurt on his path | Thirty years of handing out rope; never seen a power | *"Tell me when you go in, and I will be here when you come out. That is the job."* | **He was.** In the future he is dead — he was at the mouth when the hill came down, because he was always at the mouth. The player learns this from a mark on the bench |
| **Parsie** | present, future | Eleven; wants his turn in five years | The one who believes in the hero completely | To go further than whoever went last | Asks for a stone and promises to draw the map | Fifty-one, alive, keeps whichever water record the hero's advice created, still has the stone if the player brought it |
| **Marjoram** | present | The baker | Feeds them, unimpressed by prophecy | Eleven days of roofs not being mended | *"You come back and tell me it was boring."* | The last line of the game |
| **Saffra** | past | A mason on a plank | A stranger who decides to believe them | A third course that will dry | Has never heard of any of it | Writes the warning down | Her handwriting is under the chant |
| **Fenn** | past | Eleven or twelve | The only one who believes a stranger on sight | To be useful | Thinks the cave is "the wet hole" | Shows them the old way behind the spoil heap | — |

**Lovage** (past, foreman) is a **supporting** character, not a sixth
recurring one: present only in Chapter 2, with one want (finish the stair) and
one function (the gate). **Rose and Mary** — PROPOSED as the twins who went in
this year, met once on the cave path as a single paired conversation that
disagrees with itself (eager / unimpressed), with one future payoff: only one
of them is in the future square. *Cut candidate* if scope tightens; their
Chapter 1 function is already covered by Sage's summary.

### Choices with visible consequences

| Choice | Where | Variation | Branch? |
| --- | --- | --- | --- |
| The warning's three clauses | Ch2 P4 | The year-0 plank, the relief carving and the future records use the player's wording; the hero recites their own version in Ch4 | **No** — approach, not plot |
| Bring Parsie a stone | Ch1 optional | He has it at fifty-one | No |
| Tell Fenn the truth | Ch2 optional | He gives you the old way; he is frightened for the rest of the chapter | No |
| Reveal the eye early in Ch4 | Ch4 stage 1 | Costs a stage; recoverable | No |
| Who breaks the eye | Ch4 stage 5 | Together (recommended) or alone (the sacrificial variant) | **The one real branch** |

Neither gender choice changes competence, access, puzzles or dialogue
availability — only pronouns, as already implemented and tested.

---

## 8. The final encounter as gameplay

`present.sealed_chamber`, year 0, the second the seam appears. Turn-based,
authored, no reflex component, no combat.

**The room is shut.** The hero arrives through the panel, and the pivoting slab
settles back across the opening behind them. There is one way out of this
chamber and the other person is standing in it. **Retreat is not offered** —
the first draft allowed it and then failed to define what happened next, which
the owner correctly flagged. A `GO`/`UP`/`OUT` attempt gets one honest line:

> You are not leaving this room. Neither of you is.

**The earlier self never crosses during the encounter.** They have not opened
the passage yet, they are holding a lamp and staring at a stranger, and nothing
the player does sends them through. This removes the undefined sequence
entirely, and there is no timer: stalling costs nothing, so a player can read,
re-read and think.

### Three jobs, three kinds of evidence

Per the owner's simplification. Each job has its own instrument and they do not
substitute for each other.

| Job | Instrument | Why it works |
| --- | --- | --- |
| **Identity** | The two lanterns | Physical and checkable in the hero's hand. Same dents, same striker chain, one four days more worn. The earlier self is holding the other one. |
| **Danger** | The journal, and the gauge | The journal has four numbers in the hero's own handwriting — and the earlier self can **walk down and read the gauge themselves**, which has dropped a mark since this morning. They verify it; they are not asked to take it on trust. |
| **Resistance** | Their attachment to the village | Not an argument, and evidence cannot touch it. They are being asked to walk out and tell forty people who have sat up eleven nights that there was nothing in the hill and no part in it for them. |

**Reciting the prophecy is no longer the persuasion mechanic.** The owner is
right that two people who both know a text by heart cannot establish
authorship between them. The provenance realisation survives, but as a *quiet
beat after* the argument is over — one exchange in which both of them work out
where the words came from, and neither of them enjoys it. It persuades nobody
of anything; it is just the worst thing either of them has ever noticed.

### Stage flow

| Stage | Player can | What happens |
| --- | --- | --- |
| **0. Arrival** | `LOOK`, `EXAMINE SELF`, `EXAMINE PANEL`, `EXAMINE SLAB` | They turn round with the lamp still in their hand. Their own name, in their own voice, from someone else. |
| **1. Identity** | `TALK TO BASIL/BASILIA` → *who I am*; `SHOW LANTERN` | Claiming it fails: *"Anybody could say that."* `SHOW LANTERN` lands. They hold both, find the same dent, and stop talking. ⇒ stage 2 |
| **2. Danger** | `SHOW JOURNAL`; topic *the water*; `EXAMINE GAUGE` *(they go down and look — the hero can suggest it)* | The numbers, then the gauge. They accept that the hill is losing water and that it started tonight. ⇒ stage 3 |
| **3. Resistance** | topics *the village*, *the vigil*, *the prophecy*, *Tyme*; `TELL ABOUT TYME` | The hard one. They raise the plank — *"then it is about you, and it says I stop you"* — and the hero has no clean answer and should not pretend to. What moves them is **`TELL ABOUT TYME`**: what the bench at the mouth looks like in forty years, and who put the mark on it. ⇒ stage 4 |
| **4. The mechanism** | `EXAMINE PANEL`, `TELL ABOUT TEAR`, topic *cut so it can be unmade* | The hero explains the aperture. The earlier self solved this puzzle twenty minutes ago and gets there at once — then objects: breaking it means nobody ever reaches whatever is through there, ever. The hero agrees. **The cost is stated plainly before it is paid.** ⇒ stage 5 |
| **5. Closing it** | `BREAK PANEL WITH MALLET` | Two people: the slab has to be braced or it drops across the alcove. Together, both get clear. Alone (`WEDGE SLAB` first), the chamber comes in — the sacrificial variant. |
| **Terminal** | — | The seam collapses. Water comes back up the stair for an hour, audibly, and keeps coming. |

### Failure, precisely defined

Two actions lose ground. Both are recoverable in exactly one turn, and neither
ends the encounter.

| Mistake | What happens | Recovery |
| --- | --- | --- |
| `REMOVE HOOD` at stage 0–1 | They see the socket, reach the plank's conclusion, and put themselves between the hero and the alcove with the lamp held like something they might throw. The conversation is suspended. | `PUT DOWN MALLET`, then `STEP BACK`. Then stage 1 resumes, and `SHOW LANTERN` still works. The hero has spent their calm, which is noted and costs nothing mechanical. |
| `BREAK PANEL WITH MALLET` before stage 4 | They tackle the hero. Nobody is hurt; the mallet skids to the back of the chamber. | `TAKE MALLET`, then continue from the stage reached. |

No other action loses ground. No action is scored. No stage can be skipped
except by doing the thing that passes it.

### Aftermath — PROPOSED, and written

The owner is right that two identical sixteen-year-olds in a forty-person
village is a consequence that needs a real answer rather than a shrug.

It is roughly eight minutes of play, in the village, with no puzzles.

**The immediate problem.** They come down the hill together at dusk and Tyme is
on the bench, and he looks at the two of them for a long time. He is the first
test, and he is the easy one: he does not need to understand it, he needs to
know whether anyone is hurt.

**The village.** The square is strung with forty unlit lanterns and the vigil
is three nights off. The player chooses what is said, and all three are
authored and none is scored:

- **The truth.** Most of them do not believe it. Sage writes it down anyway,
  because writing things down is her job, and the record goes in the chest with
  the midwinter minutes — where, a hundred and eighty years earlier, Saffra put
  the other one.
- **The useful part.** The cave is empty, the hill is safe, the vigil can end.
  True, and it leaves the stranger unexplained.
- **Nothing.** They say nothing, and the village arrives at its own
  explanation, which is worse than the truth and more comfortable.

**Where the older one goes.** They cannot be Basil or Basilia: that name is
taken, by someone standing next to them, and the village's accounting has no
room for two. So they take the only unoccupied place that fits a person who
knows what is in the hill.

**They take Tyme's bench.** Not immediately, and not by asking — Tyme offers,
some weeks later, in the way he offers everything, which is by handing over a
coil of rope and not making a speech about it. *Tell me when you go in, and I
will be here when you come out. That is the job.* It becomes theirs. They keep
the path, refresh the chalk every spring, hand rope to sixteen-year-olds, and
never once tell any of them what is behind the fourth wall, because it is not
there any more.

**What it costs, itemised.** No name in the village's reckoning. No family, no
record, no birthday. One eye. Sole possession of forty years of other people's
futures, including the ones that were deaths. And the certain knowledge that
the person they saved will have an ordinary life and will slowly stop thinking
about this, which is the best outcome available and still a loss.

**What the village keeps.** The prophecy. Nobody repeals it. They go on saying
the Wanderer-words at midwinter, about a one-eyed figure who brings the end of
everything — and there is a one-eyed stranger on the cave path who turned up
the night the vigil was called off and never explained himself, and the village
decides, collectively and without discussing it, not to put those two things
next to each other.

**Final beat.** Marjoram, with flour to her elbows, asks how it was.

> "Boring," you tell her.

### The sacrificial variant

Reached from stage 4 or later by `WEDGE SLAB` then `BREAK PANEL WITH MALLET`
alone. The hero does not come out. The seam closes, the water returns, the
village is saved and never learns why, and a sixteen-year-old walks down the
hill on their own and spends a life not being certain what happened to them in
that room.

Costs about three hundred words of alternative aftermath. **The recommendation
remains the survivable ending**, because the cost itemised above is heavier
than a death and because the aftermath is worth playing. The variant exists so
that the last decision in the game is the player's.

## 9. Scope and implementation handoff

### New content, by milestone

| Milestone | Chapter | New rooms | New people | New puzzles | New flags (approx.) |
| --- | --- | --- | --- | --- | --- |
| **3** | Past, **ending at the future-arrival checkpoint** | `past.cave_path`, `past.spring`, `past.worksite`, **`future.deep_chamber` (arrival only)** | Lovage (+ Saffra, Fenn extended) | P2, P3, P4 | ~12 |
| **4** | Future investigation | `future.entrance`, `future.cave_path`, `future.square`, `future.rubble` | Parsie (older), one survivor | P5, P6 | ~10 |
| **5** | Finale and aftermath | *(reuses `present.sealed_chamber`, `present.entrance`, `present.square`)* | the earlier self | P7 | ~10 |

**Boundary corrected.** The first draft ended Milestone 3 in the past and said
it needed no `future` era; the owner's brief ends it at a future **arrival**.
The owner's boundary wins, because a chapter that ends on a crossing with
nowhere to land is not playable. So Milestone 3 builds `future.deep_chamber`
as an arrival room only — the buried chamber, the dry basin, the gauge reading
zero, and a `look`-and-stop endpoint exactly like the one Chapter 1 ships
today. **All investigation stays in Milestone 4.**

The consequence is that **`schemaVersion` goes to 2 in Milestone 3, not 4**,
because a save can now hold `era: 'future'`.

### Types and engine

- **`Era`** gains `'future'`; **`LocationId`** gains the prefixed ids above.
  `eraOf()` and the validator's era/location cross-check already key off the
  prefix, so both extend by one case.
- **`Chapter`** gains `'future'` and `'return'`. The chapter/era coherence
  rules in `persistence/validate.ts` need the new pairs.
- **One new item type** (`mallet`, `water_skins`) and **one new verb**
  (`COMPARE X WITH Y`, narrowly scoped — §5 P5).
- **Puzzles** go in `engine/puzzles/` beside `shutteredRelief.ts`, same
  `(draft, events) => ResolveResult` shape. The finale is a staged encounter
  and wants its own module with an explicit stage flag rather than being
  spread across verbs.
- **No new systems.** No combat, economy, levelling, timers or survival. The
  finale's "clock" is conversational state.

### Save-format implications

- `schemaVersion` **goes to 2 in Milestone 3**, because that is when a save can
  first hold `era: 'future'` and the current build would refuse it. The
  migration 1 → 2 is trivial — no field changes, every old value still valid —
  and is the first real migration the project has had. It must be written and
  tested in Milestone 3, not deferred.
- Existing saves keep loading. Internal person/topic ids stay stable, as in
  Milestone 1.
- Journal entries become load-bearing in P5: the gauge readings must be
  recorded as **structured data**, not only prose, so `COMPARE` can be resolved
  by the engine. Proposal: an optional `data?: Record<string, number>` on
  `JournalEntry`, additive and easy to validate. **This lands in Milestone 3**,
  because Chapter 1's and Chapter 2's readings are what Chapter 4 compares.

### Opening clues needing revision — PROPOSED, minimal

| Change | Why |
| --- | --- |
| Add an optional `TAKE STONE` in `present.outer_gallery` | Parsie already asks for one; there is currently no way to oblige. Optional, no gate. |
| **Add the gauge** to `present.deep_chamber`, and have the journal record its reading | The whole causation chain in P5 is four readings off one instrument. Without this in Chapter 1 there is no baseline. Worn, numbered, unremarkable — it reads as old cave furniture until Chapter 2 explains it. |
| Add the growing hairline to `present.sealed_chamber`'s description | The damage must be visible in the era the player starts in. |
| Add one Tyme topic: *what he does while you are inside* | His Chapter 4 payoff needs the bench established as *his*, and the finale's `TELL ABOUT TYME` needs something to refer back to. |

None of these touches the shuttered-relief puzzle, the crossing, or the
past-arrival endpoint.

Everything else in Chapter 1 stands. **The opening puzzle and the past-arrival
endpoint are unchanged.**

### Risks

1. **The bootstrap** (§3F) is the one logical knot. It is owned, not patched,
   but a player may find it unsatisfying. Mitigation: the hero finds it
   unsatisfying too, out loud, once.
2. **Chapter 3 is the heaviest to write** — a whole ruined era for one
   investigation and one physical puzzle. First cut candidate.
3. **The finale is dialogue-dense.** Risk of becoming the cutscene the brief
   forbids. Mitigation: every stage has a physical object as its currency.
4. **Scope.** Eight new rooms is already the ceiling for a 1–2 hour game.

### Cut list, in order, core plot preserved

1. Rose and Mary (and their future payoff).
2. `future.home` and `future.cave_path` — fold their content into
   `future.square` and `future.entrance`.
3. `past.spring` — move the water skins to `past.square`, losing the
   waterline-level foreshadowing.
4. The Chapter 4 aftermath becomes narrated rather than walkable.
5. P2's second route (Fenn's old way) — make P4 strictly after P2.

Nothing on this list touches the causal model, the ending, or any of the
twelve required decisions.

---

## Appendix — the twelve required decisions

All **PROPOSED** unless marked otherwise.

**1. What does the hero believe the cave will accomplish, and how does that
become what the earlier self defends?**
At first, nothing grand: the rite is the rite, and they want to find what
everyone else missed. Reading the plank adds a second belief — that reaching
the end grants *the power to turn aside the Wanderer*. Opening the passage
seems to confirm both. By the finale the earlier self's position is simple and
hard to argue with: **the power is on the other side of that threshold, and
walking away from it means leaving the village with nothing.** They are not
defending a prophecy; they are defending the only useful thing they have ever
been offered. §2, §8 stage 3.

**2. Who matters, and is it established before it is mourned?**
**Tyme** and **Parsie**, both already implemented with multiple topics in
Chapter 1. Tyme's *"I will be here when you come out — that is the job"* ships
today; Parsie's request for a stone and a map ships today. Two small Chapter 1
additions (§9) make the bench his and let the player actually take the stone.
Mourning is in Chapter 3, after four conversations' worth of acquaintance. §7.

**3. Era distance and subjective time?**
Past: **140 years back** — far enough that the warning is immemorial and the
cave is still being cut, close enough for one tree to become one stump. Future:
**40 years forward** — Parsie 11 → 51, Tyme dead, Marjoram dead. Hero's lived
time: **about four days.** They stay sixteen. §3A, §3B.

**4. What triggers each crossing, where does it lead, what can the player
control, and what comes back?**
All three crossings are the same mechanism: **a lit lamp at a measured height,
light through the pierced aperture, then an explicit `ENTER` action.** Control
increases: crossing 1 is blind, crossing 2 is informed but short one figure,
crossing 3 is exact. Carried objects travel; nothing is confiscated; the
lantern is auto-recovered on arrival as in the shipped Chapter 1. Return access
is never automatic — each chapter has to earn its own aperture. §3D, §5 P3/P6.

**5. What accumulates, with what symptoms, and why was everyone else
harmless?**
**An open tear, swallowing whatever is most mobile.** Water first, for 180
years, measured on one numbered gauge cut into Lovage's stair and readable in
all three eras. Then the hill's own mass, which is the subsidence. Then **the
order of events**, which is the end of the world and is shown rather than
announced: repeated days on the survivors' calendar, rain falling upward at the
mouth, a bell heard before it is rung, and a map with a shaded edge that has
grown two valleys in five years. The three crossings cost four marks between
them; **the open door costs the hill.** Previous participants never crossed and
never opened it. §3, §3D.

**6. The eye?**
Chapter 3, on the **second mallet blow** while clearing the buried aperture — a
spall off stone the hero struck themselves, doing the only thing that gets them
home. Two sentences, no spectacle, **no interface gimmick** (the brief rules
those out and they would break accessibility). It lands *before* the identity
question has to be settled, and the confirmation is delivered by a frightened
stranger at the cave mouth rather than by narration. §5 P6.

**7. How the warning becomes the prophecy?**
The hero **repeats the plank's own words back into year −140**, because the
plank is all they have. **The five core lines are fixed** and are the shipped
plank text; the player chooses the explanation, the tone, the confidant and the
advice around them. The confidant writes it down; midwinter shortens it and
loses the qualifier that made it an apology; a carver two generations later
turns the chant into a one-eyed figure. The detail *one-eyed* therefore has
**no first author** — an acknowledged information loop, owned rather than
patched. §6, §3F.

**8. How does the future prove causation rather than correlation?**
**One instrument, one body of water, four readings, and a 180-year series.**
The basin *is* the aquifer's surface, not a pool — Lovage says so while digging
for it. A numbered gauge is cut into his stair and survives into every era. The
hero's journal holds readings from year −140 (31), year 0 before and after the
first crossing (12, then 11), and year +40 (0). The village's annual record
runs the whole 180 years **because the hero's own advice in P4 is what started
it**, and it contains exactly one night on which the water fell two marks at
once — the night in the journal. Parsie holds the entire case and has never had
the fourth number. §5 P5.

**9. How is return possible, and why does closing it in year 0 fix
everything?**
Return: the aperture survives, buried, and the hero now has the knowledge to
aim it. Closure: the water was **swallowed, not crossed** — held inside the
tear, never arriving anywhere — so collapsing the tear expels it back where it
fell from. Matter that *completed* a crossing, including the hero, is anchored
and is not recalled. The aperture is **the same stone in every era**, which is
why one blow closes it in all of them. Foreshadowed twice in Chapter 2: the cut
note *CUT SO IT CAN BE UNMADE*, and water audibly coming back up the stair when
the lamp is lifted out of the niche. §3, §6.

**10. Why does the earlier self resist?**
Because the evidence cuts against the argument. A one-eyed stranger telling
them to stand down is, on the plank's own authority, **the Wanderer disarming
its only opponent.** Under that is the real obstacle, which evidence cannot
touch: eleven nights of vigil, a village watching, and a child who thinks they
are the one. Being persuaded means walking out and saying there was nothing
there and no part in it for them. §8 stages 2–3.

**11. What power did braving the cave actually give?**
**Working knowledge of the mechanism**: the fold answers to light, and the
lamp's height selects the era. Concrete, earned by reading a builders'
setting-out drawing, and **used three times in gameplay** — once badly in
Chapter 2, once exactly in Chapter 3, and once to decide that the right move is
to destroy it. The plank was literally right: the one who braved the cave got
the power to turn it aside. §5 P3.

**12. Closure, cost, and both fates?**
The hero breaks the pierced panel with Lovage's mallet while the earlier self
braces the slab. **Both persist** — rule 1, applied to a person exactly as it
was applied to water two chapters earlier. The aftermath is now written rather
than gestured at (§8): the older one cannot be Basil or Basilia, because that
name is standing next to them, so they take the only place in the village that
fits someone who knows what is in the hill — **Tyme's bench**, handed over some
weeks later with a coil of rope and no speech. Cost, itemised: no name in the
village's reckoning, no family, no record, no birthday, one eye, sole
possession of forty years of other people's futures, and the knowledge that the
person they saved will have an ordinary life and slowly stop thinking about it.
The village keeps the prophecy and declines, collectively, to put it next to the
one-eyed stranger on the cave path. **Recommended ending is survivable;** the
sacrificial variant is the one real branch. §8.

### Disposition of prototype-only additions

| Addition | Disposition | Reason |
| --- | --- | --- |
| Hyssop's **counted** date | **Retain** | Already de-supernaturalised in M1; ordinary arithmetic, right by luck, never explained to anyone |
| The original **dream** version | **Stays removed** | Would be a second supernatural system |
| Vigil, strung lanterns, bowl of salt | **Retain** | The finale's imagery depends on forty unlit lanterns |
| Lintel inscription *GO IN. COME OUT. BE EASIER WITH YOURSELF.* | **Retain** | Becomes quietly devastating in Chapter 3's ruin |
| Cave-path paragraph naming what is below | **Retain** | This is the stake-setting the last review asked for |
| Echo chamber | **Retain, optional** | Good texture, gates nothing |
| Rose and Mary as this year's pair | **PROPOSED** | First on the cut list |
| Chervil and Borage (current cohort names) | **Replace** with Rose and Mary, or keep if the twins are cut | Avoids two unrelated name sets for one function |
| Removed M1 characters (standalone Mint, paired Rose/Mary, Tyme-as-friend) | **Tyme-as-friend material is partly reusable** | Its warmth now belongs to Tyme-the-keeper's new topic (§9) |
