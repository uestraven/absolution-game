# Absolution — full-game design

> **SPOILERS.** This document contains the entire plot, including the ending.
> It is not player-facing and is not referenced from anything the game shows.

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
The hill's water stops being in transit and settles back where it belongs.
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
| **Discovery** | *Inferred:* the fold answers to light, and *where* the light sits decides *when* you arrive. *Confirmed:* the builders cut the aperture deliberately, and cut it so it could be unmade. |
| **Exit action** | `PLACE LANTERN IN NICHE` at the measured height, `LIGHT LANTERN`, then `ENTER APERTURE` — with the height a hand low, because the third figure was under wet chalk. |
| **Consequences** | Crossing #2, aimed badly: forty years *past* home rather than back to it. Seam still open. The warning enters the village's records. Lovage's mallet is carried out. |

### Chapter 3 — The ruined future

| Field | Detail |
| --- | --- |
| **Entry state** | `future` era, `future.deep_chamber` (buried), carrying lantern, wedge, mallet; believes the fold is steerable but has just proved they cannot steer it; uninjured on arrival. |
| **Immediate objective** | Find out where they are, then get out of a chamber that is full of fallen roof. |
| **Motivation** | They aimed for home and did not arrive at it. Until they know how far wrong they are, they cannot correct it. |
| **Main activity** | Reading a ruin; the water ledger; two conversations with people who were children when they left. |
| **Complication** | Partway through clearing the aperture, a struck spall takes their left eye. The next person who sees them backs away from a one-eyed figure walking out of the hill, and names them. |
| **Discovery** | *Inferred, early:* the valley has no water. *Confirmed, by two independent records:* the spring failed on the dates in their own journal, and it failed first in the autumn after they went in. |
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

### Story rule, stated once — PROPOSED

> **Anchoring.** Anything that goes through the seam comes out of the river.
> It no longer flows with history: it persists as it is, whatever happens to
> the history that produced it. Water, objects and people alike.
>
> Anything that has *not* gone through is anchored, and changes when history
> changes.

That is the whole mechanism. It is stated by the builders, in the past, cut
into the wall of the chamber they are still making (§6), and the player gets
to watch it work on water in Chapter 2 before it matters for a person in
Chapter 4. It predicts consistently:

- The hero keeps their memories, their injury, and their existence after the
  change, because they have crossed. **This is the rule, not an exception.**
- The earlier self is anchored, so the new history is simply their life: they
  remember the encounter because it happened to them.
- Displaced water is in transit, not relocated, so closing the seam returns
  it. This is the closure rule, and it is why closing it *in any era* fixes
  *every* era.
- The mallet stays in the hero's hand after its maker's century is rewritten.
- Nobody else retains anything. No global memory. No second traveller.

### A. The hero's subjective order

| # | Where | Elapsed | Carried out | Injury |
| --- | --- | --- | --- | --- |
| 1 | Village and first cave | day 1, morning–evening | lantern, wedge | — |
| 2 | Past (year −140) | days 1–3 | + Lovage's mallet, + bone pin (optional) | — |
| 3 | Ruined future (year +40) | day 3–4 | + the water ledger's figures, copied | left eye, mid-chapter |
| 4 | The sealed chamber, finale | day 4, the same evening as (1) | — | — |

Four days lived. They are sixteen throughout. **They do not become an adult**
because a destination is distant.

### B. The world's calendar order

| Calendar | Event | Who knows |
| --- | --- | --- |
| year −140 | Lovage's crew are three seasons into cutting the stair. The aperture is cut; the camouflage is not. | the past village |
| year −140 | A stranger arrives out of the basin, earns the worksite, and warns the village. It is written down. | the past village |
| year −140 | The stranger leaves through the half-cut aperture. The seam is left open. | nobody |
| −140 → 0 | The warning is copied, shortened, chanted at midwinter, and carved. "A wanderer" becomes "the Wanderer". The seam leaks the whole time. | everyone, as tradition |
| year 0, morning | Basil/Basilia turns sixteen. Hyssop has counted a date out of the old lines; the village is eleven days into a vigil. | the village |
| year 0, evening | The earlier self solves the relief, lights the lamp, and the seam appears. | the player |
| **year 0, evening, the same second** | **The intervention.** A one-eyed stranger arrives. The eye is broken. The seam closes. The water returns. | both selves |
| year 0 onward | No subsidence. The vigil ends. The prophecy is never fulfilled and was never wrong. | the village |
| ~~year 0, +1 autumn~~ | ~~The spring fails for the first time.~~ | **overwritten** |
| ~~year +40~~ | ~~The hill subsides onto the village.~~ | **overwritten** |

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

| # | Motive | Trigger | Destination | Transported | Immediate symptom | Lasting effect | Later evidence | Undone by closure? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Find what the cave is for | `ENTER THRESHOLD` (basin, lit alcove) | year −140, basin chamber | lantern, wedge, clothing | Basin level drops a visible hand's width; a hairline opens in the patterned wall | Seam left open, leaking | Journal records the depth before and after | **Yes** |
| 2 | Get home | Lamp in the half-cut aperture, height guessed | year +40, buried chamber | + mallet | Past basin drops; Lovage's crew hit dry rock the following week | Seam still open | Future ledger's first entry | **Yes** |
| 3 | Reach the moment it starts | Lamp in the cleared aperture, height copied from journal | year 0, sealed chamber, the instant the seam appears | + journal figures | Future basin empties completely | — (closed moments later) | — | **Yes** |
| — | *The open seam itself* | Leaving it open from year −140 | — | — | None noticeable in a day | **This is the bulk of the damage:** 140 years of slow loss before year 0, forty more after | The ledger's slope; the exposed waterline on Lovage's stair | **Yes** |

**Why ordinary rite participants caused nothing.** They never crossed, and
they never opened the seam. Oreg got the shutter up once, looked into an empty
alcove and let it fall. Dilly never reached the room. Rose went to the end of
the rope. The hero is not more deserving; they are the first to put a light in
the right place, and the cost is attached to *that*, not to merit.

### E. Player knowledge vs. character knowledge

| Beat | Player may suspect | Hero knows |
| --- | --- | --- |
| Ch1, reading the plank | "one-eyed" is aimed at me | nothing |
| Ch2, giving the warning | the warning *is* the prophecy | realises it mid-sentence — they are quoting the plank |
| Ch3, arrival | this is the cataclysm | sees a dry valley; does not yet know why |
| Ch3, the ledger | I did this | reads two records that agree with their own journal |
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
   crossing 2 ──► P5 the ledger ──► P6 clearing the aperture ──► crossing 3
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

**After P4, this route is barred.** Lovage pulls the rope across and posts
Fenn's brother on it. Second route: `ASK FENN ABOUT THE OLD WAY` → a crawl
behind the spoil heap → `past.worksite`. Fenn will do it because the hero told
him the truth and nobody else does. **Order-independent:** whichever of P2/P4
happens first, the other's route exists.

---

### P3 — Aiming the lamp · `past.worksite`

| | |
| --- | --- |
| **Purpose** | Teach, as a usable mechanic, the thing the prophecy calls *the power*: the fold answers to light, and the lamp's **height** selects the era. This is the chapter's real prize and the hero's only asset in Chapter 3. |
| **Prerequisites** | P2 (access). |
| **Visible first** | A half-cut aperture in a thinned panel. No camouflage yet — the scale-pattern is chalked out but not carved. Below it a rough niche, not yet dished. A setting-out drawing in chalk on the floor, with a scale and three marked heights. |
| **Clues** | The drawing: a lamp at three heights with three different lines fanning up through the aperture. Lovage's note beside it, cut not chalked: *CUT SO IT CAN BE UNMADE* (§6). Beside the drawing, the figure the hero has already seen on the gallery relief — the same traveller, the same lamp, but here it is a working diagram with numbers on it. |
| **Why the solution follows** | The relief in Chapter 1 showed one height. The drawing shows three. The hero has been looking at an instruction sheet with two thirds of it weathered off. |
| **Solution** | `EXAMINE DRAWING` → `MEASURE NICHE` → `PLACE LANTERN IN NICHE` → `LIGHT LANTERN` → `ENTER APERTURE`. Selectable: *Chalk drawing* → *Examine*; *Niche* → *Measure*; *hooded lantern* → *Put in…* → *niche*; *Light it*; *aperture* → *Step into it*. |
| **Items** | Lantern (recovered automatically on crossing, as in Ch1). Journal auto-records the three heights — **this is the record P6 depends on.** |
| **Flags** | `read_setting_out`, `knows_aiming`. |
| **Wrong but reasonable** | Placing the lamp without measuring: it works, and sends you wrong, which is the authored outcome (see below). Placing the wedge in the niche: *"Oak in a hole in a wall. The dish is cut for something that burns."* Hammering the aperture now: *"Lovage would kill you, and it is the only way out you have."* |
| **Hints** | 1. The drawing is not decoration; it has numbers on it. 2. Three heights, three destinations. The relief at home only ever showed you one. 3. Measure the niche, set the lamp at the height you want, and step through. |
| **Recovery** | The drawing cannot be destroyed. If the lantern is lost in the past, Lovage's crew have oil lamps; `ASK LOVAGE FOR A LAMP` after `past_worksite_access`. |
| **Cross-era consequence** | **Yes, and the player sees it.** The basin in `past.deep_chamber` drops a hand's width when the hero arrives, and the player can go and look. Lovage's crew hit dry rock the next week and say so. |

**The authored mis-aim.** The hero can only measure two of the three heights:
the third mark is under the chalk line Lovage has not finished. So the aiming
is *informed but incomplete*, and the lamp goes a hand too low. The player is
told what they did not know, not punished for a guess. In Chapter 3 they
recover the missing figure from the aperture itself and can then aim exactly.

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

### P5 — The water ledger · `future.square`

| | |
| --- | --- |
| **Purpose** | Establish causation by evidence the player assembles, with no announcement from anybody. |
| **Prerequisites** | Crossing 2, and getting out of `future.deep_chamber` (a short physical opening, not a puzzle: the fallen roof has a gap). |
| **Visible first** | A dry valley. A well with no rope. A board under a lean-to with forty years of tallies on it. |
| **Clues** | **Three independent records that agree.** (1) The ledger: a dated tally of the spring's flow, kept because it started failing. (2) The hero's own journal, which has recorded basin depths since Chapter 1 — the player can open it and compare. (3) Parsie, fifty-one, who remembers the year Basil/Basilia went into the hill and did not come out, and remembers the spring failing that same autumn. |
| **Why the solution follows** | The ledger's first bad year is the autumn after the hero went in. Its steps down match the hero's own recorded depths. Nobody says "you did this"; the dates do. |
| **Solution** | `EXAMINE LEDGER` → `READ JOURNAL` → `COMPARE LEDGER WITH JOURNAL` → `TALK TO PARSIE` → topic *the year the spring failed*. Selectable: *water ledger* → *Examine*; *Journal*; *water ledger* → *Compare with my journal*; *Talk to Parsie*. |
| **New verb** | `COMPARE X WITH Y`. **Justified:** this is the only puzzle whose solution is an inference between two records, and making the player state the comparison is what turns it from exposition into a discovery. Defined narrowly: valid only for `ledger` × `journal`; everything else gets *"They have nothing to do with each other."* |
| **Items** | Journal (always present). Ledger is scenery; it cannot be taken. |
| **Flags** | `read_ledger`, `knows_cause`. |
| **Wrong but reasonable** | Asking Parsie outright what happened: he tells the story of the hill coming down, and blames the hill. He has no idea. That is the point — the omniscient-NPC route is explicitly closed. |
| **Hints** | 1. Somebody has been keeping count of the water for forty years. 2. You have been keeping count too, without meaning to. 3. Compare the ledger with your journal; then ask Parsie about the year the spring failed. |
| **Recovery** | The ledger is fixed scenery and cannot be missed or destroyed. Parsie is in the square all chapter. |
| **Cross-era consequence** | None; this is where consequence is *read*. |

---

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

### The two texts, side by side — PROPOSED

The hero's warning in year −140, in the options as written (§5 P4), and the
plank in year 0 as it is already implemented. The plank's current wording is
shipped; the warning is drafted to produce it.

| The warning (year −140, hero's mouth) | The plank (year 0, shipped text) |
| --- | --- |
| "The hill will open." | *The hill will open.* |
| "The water will answer." | *The water will answer.* |
| "What stands will not stand." | *What stands will not stand.* |
| "A wanderer brings it. One-eyed, and without mercy to it, because it will not mean to." | *The Wanderer comes one-eyed and without mercy.* |
| "Keep a vigil. And if it starts, send someone into the cave — somebody who will look properly. They can turn it aside." | *One who braves the Cave of Absolution will have the power to turn it aside.* |

**Transmission.** Four moves, each mundane: Saffra writes it on the back of a
board; it is read at midwinter because that is when the village reads things;
it is shortened to fit the chant; the clause *because it will not mean to* is
the first casualty, which is how a frightened apology becomes a monster. The
gallery relief is carved two generations later by someone working from the
chant, which is where *the carvings* that Sage already blames for the
central-eye picture come from.

**The cyclops stays plausible with no false statement from narration.** The
authoritative text says *one-eyed* and nothing about where the eye sits; Sage
already says the middle-of-the-face image is "the carvers' idea, not the
words'". That line is shipped and is now load-bearing.

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
| "the water will answer" | Ch1 square | poetry | the aquifer | Ch3 ledger | required | low |
| Basin "a depth it has no room for" | Ch1 deep chamber | wonder | a seam, leaking | Ch2 drawing | required | low |
| Basin depth drops after a crossing | Ch2 | odd | the damage, measured | Ch3 journal comparison | required | medium |
| Hairline in the patterned wall | Ch1→Ch4, grows each crossing | weathering | strain in one continuous stone | Ch4 | optional | low |
| *CUT SO IT CAN BE UNMADE* | Ch2 worksite | builders' pride | the closure rule | Ch4 | **required** | low |
| "out of the river" inscription | Ch2 worksite | a riddle | the anchoring rule | Ch4, applied to a person | **required** | medium |
| The three-height drawing | Ch2 worksite | decoration | the power | Ch3 return | required | low |
| Tree → stump → fallen trunk | Ch1/Ch2/Ch3 | scenery | 180 years, one hillside | Ch3 | optional | low |
| Two identical lanterns | Ch4 | — | the only evidence that works | Ch4 | required | low |
| Water ledger | Ch3 square | local grievance | the hero's own itinerary | Ch3 | required | medium |
| Parsie's stone | Ch1 optional → Ch3 | a kid's errand | he kept it forty years | Ch3 | optional | none |

**Multiple sources for every central revelation.** Identity: the plank, the
injury, a stranger's reaction, two lanterns. Causation: the ledger, the
journal, Parsie's memory, the exposed waterline. Closure: the cut note, the
anchoring inscription, and watching water seep back when the lamp is lifted in
Chapter 2.

**No compulsory disastrous action.** The hero never has to do something they
already know is ruinous to move the plot. Crossings 1 and 2 happen before they
know the cost; crossing 3 is the one that lets them fix it.

---

## 7. Character and choice plan

Five recurring people. Four are already implemented.

| Name | Era(s) | Role | Relationship | Wants | On the rite/prophecy | Memorable beat | Payoff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Tyme** | present, future | Keeps the entrance and the rope | The adult who takes the hero seriously | For nobody to get hurt on his path | Thirty years of handing out rope; never seen a power | *"Tell me when you go in, and I will be here when you come out. That is the job."* | **He was.** In the future he is dead — he was at the mouth when the hill came down, because he was always at the mouth. The player learns this from a mark on the bench |
| **Parsie** | present, future | Eleven; wants his turn in five years | The one who believes in the hero completely | To go further than whoever went last | Asks for a stone and promises to draw the map | Fifty-one, alive, keeps the water ledger, still has the stone if the player brought it |
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
authored, no reflex component, no combat. The earlier self is a person, not an
obstacle; the hero is tired, not commanding.

**Environment states:** `seam_revealed` true; lantern lit in the alcove; wedge
under the shutter; the pivoting slab shut; the pierced panel intact; the
passage **not** open. The earlier self can open the passage at the end of any
turn in which the hero has lost ground — that is the clock, and it is made of
the conversation, not of seconds.

| Stage | Player can | What happens |
| --- | --- | --- |
| **0. Arrival** | `LOOK`, `EXAMINE SELF`, `EXAMINE PANEL` | They turn round with the lamp in their hand. Neither of them says anything for a moment. The hero's name, said by someone else, in their own voice. |
| **1. Being believed** | `TALK TO BASIL/BASILIA`; topics: *who I am*, *the lantern*, *the journal*, *the mallet* | Claiming identity alone fails: *"Anybody could say that."* **`SHOW LANTERN`** is the one that lands — two lanterns, same dent, same striker chain, one of them four days more worn. They hold both. They go quiet. |
| **1b. Revealing the eye first** | `REMOVE HOOD` | Available from stage 0 and **costs a stage**: they get between the hero and the alcove and reach for the passage. Recoverable — `SHOW LANTERN` still works, but the hero has spent their calm. |
| **2. The competing belief** | topics: *the prophecy*, *the vigil*, *what is through there* | Convinced of identity, they reach the obvious conclusion: *"Then the plank is about you. And it says I am the one who stops you."* Arguing from authority fails. **`RECITE WARNING`** works: the hero says the Wanderer-words as they said them in year −140, in the player's own chosen wording, and the earlier self — who has known them since they were four — hears where they come from. The prophecy stops being a witness. |
| **3. The obligation** | topics: *the village*, *Tyme*, *the water*; `SHOW JOURNAL` | This is the hard one and it is not solved by evidence. They are not being stubborn; they are being asked to walk out and tell forty people who have sat up eleven nights that there was nothing in the hill and nothing to be done and no part for them in it. `SHOW JOURNAL` gives them the ledger figures in the hero's own handwriting. What actually turns them is **`TELL ABOUT TYME`** — what the bench looks like in forty years. |
| **4. The mechanism** | `EXAMINE PANEL`, `TELL ABOUT SEAM`, topic *cut so it can be unmade* | The hero explains the aperture. The earlier self, who solved this puzzle twenty minutes ago, gets there immediately — and objects: breaking it means nobody can ever reach whatever is through there. The hero agrees. That is the cost, and it is stated plainly before it is paid. |
| **5. Closing it** | `BREAK PANEL WITH MALLET` | Needs two: the slab has to be held or it drops across the alcove. **Together** (requires stage 3 passed): the earlier self braces the slab, the hero swings, both get clear. **Alone** (available any time after stage 4): the hero wedges the slab, swings, and the chamber comes in — the sacrificial variant. |
| **Terminal** | — | The seam closes. Water comes back up the stair for an hour, audibly. |

**If the player retreats** (`UP`, `WEST`, `GO OUT`): allowed. The earlier self
opens the passage and crosses, and the hero arrives at the basin to find it
deep again and the seam wider. **Not a loss state** — they can climb back and
the encounter restarts at stage 2, with the earlier self now also four days
older and much harder to talk to. One further crossing of damage, visible in
the wall. This is the authored penalty: expensive, legible, recoverable.

**If the player attacks the mechanism first,** before stage 3: the earlier self
tackles them. Nobody is hurt. The mallet ends up at the back of the chamber and
must be retrieved. One stage lost.

**Aftermath — playable, roughly 5 minutes.** The two of them walk down. Tyme
is on the bench and does not understand what he is looking at. The square is
strung with forty unlit lanterns. The player chooses what to tell the village:
*the truth*, *the useful part*, or *nothing*. All three are authored, none is
scored. Then Marjoram, with flour to her elbows, asks how it was.

---

## 9. Scope and implementation handoff

### New content, by milestone

| Milestone | Chapter | New rooms | New people | New puzzles | New flags (approx.) |
| --- | --- | --- | --- | --- | --- |
| **3** | Past | `past.cave_path`, `past.spring`, `past.worksite` | Lovage (+ Saffra, Fenn extended) | P2, P3, P4 | ~10 |
| **4** | Future | `future.entrance`, `future.cave_path`, `future.square`, `future.rubble`, `future.deep_chamber` | Parsie (older), one survivor | P5, P6 | ~10 |
| **5** | Finale | *(reuses `present.sealed_chamber`)* | the earlier self | P7 | ~8 |

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

- `schemaVersion` **must** go to 2 when `Era`/`Chapter` gain members, because
  a save holding `era: 'future'` is unreadable by the current build. A
  migration from 1 → 2 is trivial (no field changes; the old values stay
  valid) and is the first real migration the project has had.
- Existing saves keep loading. Internal person/topic ids stay stable, as in
  Milestone 1.
- Journal entries become load-bearing in P5: the depth figures must be
  recorded as **structured data**, not only prose, so `COMPARE` can be
  resolved by the engine. Proposal: an optional `data?: Record<string, number>`
  on `JournalEntry`, which is additive and survives validation.

### Opening clues needing revision — PROPOSED, minimal

| Change | Why |
| --- | --- |
| Add an optional `TAKE STONE` in `present.outer_gallery` | Parsie already asks for one; there is currently no way to oblige. Optional, no gate. |
| Journal records the basin's depth in `present.deep_chamber` | P5 compares against it. One line, no new mechanic. |
| Add the growing hairline to `present.sealed_chamber`'s description | The damage must be visible in the era the player starts in. |
| Add one Tyme topic: *what he does while you are inside* | His future payoff needs the bench established as *his*. |

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
**Displaced water.** Each crossing moves a measurable volume out of the hill's
aquifer into another era, and **the seam keeps leaking for as long as it is
open** — which is 180 years, and is most of the damage. Symptoms the player can
see: the basin's depth dropping a hand at a time, the hairline in the patterned
wall growing, Lovage's crew hitting dry rock, the exposed waterline, the
ledger, and finally a valley with no water. Previous participants never crossed
and never opened the seam; Oreg lifted the shutter once and let it fall. The
cost attaches to the act, not to merit. §3D.

**6. The eye?**
Chapter 3, on the **second mallet blow** while clearing the buried aperture — a
spall off stone the hero struck themselves, doing the only thing that gets them
home. Two sentences, no spectacle, **no interface gimmick** (the brief rules
those out and they would break accessibility). It lands *before* the identity
question has to be settled, and the confirmation is delivered by a frightened
stranger at the cave mouth rather than by narration. §5 P6.

**7. How the warning becomes the prophecy?**
The hero **repeats the plank's own words back into year −140**, because the
plank is all they have. Saffra writes it down; midwinter reading shortens it;
the clause *because it will not mean to* is the first thing lost; a later
carver renders the chant as a one-eyed figure. The specific detail *one-eyed*
therefore has **no first author** — an acknowledged information loop, owned
explicitly rather than patched with an unseen original. §6, §3F.

**8. How does the future prove causation rather than correlation?**
**Three records that the player compares themselves**: the village's forty-year
water ledger, the hero's own journal depths from Chapters 1–2, and Parsie's
memory of the autumn the spring first failed. The dates line up; the steps line
up. The only person who could announce the answer — Parsie — blames the hill,
because he does not know. §5 P5.

**9. How is return possible, and why does closing it in year 0 fix
everything?**
Return: the aperture survives, buried, and the hero now has the knowledge to
aim it. Closure: **the displacement is maintained by the open seam** — the
water is in transit, not relocated — so unmaking the aperture lets it settle
back. And the aperture is **the same stone in every era**, which is why one
blow closes it in all of them. Foreshadowed twice in Chapter 2: the cut note
*CUT SO IT CAN BE UNMADE*, and water audibly seeping back when the lamp is
lifted. §3 rule, §6 clue table.

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
braces the slab. Cost: the hero keeps the socket, the four days and the memory
of forty years that now will not happen, and there is no way back and nowhere
else to be. **Both selves persist** — the anchoring rule, applied to a person,
exactly as it was applied to water two chapters earlier. The village keeps a
prophecy it will never need. Recommended ending is survivable; the
**sacrificial variant** (the hero wedges the slab and swings alone) is the one
real branch and is offered as an alternative in `docs/M2_DECISIONS.md`. §8.

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
