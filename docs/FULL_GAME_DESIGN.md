# Absolution — full-game design

> **SPOILERS.** The entire plot, including the ending. Not player-facing, and
> not referenced from anything the game shows.

---

## 0. Revision 3 — reconciled to the owner's decisions

Rewritten against `31866e6` to apply five **APPROVED OWNER DECISIONS**. The
superseded material is gone, not parked beside the new plan.

| Superseded | Replaced by |
| --- | --- |
| Universal "anchoring" rule for water, objects and people; the two-rule inscription | **Decision 1.** The protagonist alone is a singularity. Never explained, never ancestral. Object transport is a gameplay rule, not cosmic law |
| −140 / +40 years; a forty-year ledger; five generations; Parsie alive at 51 | **Decision 2.** Exactly ∓100 years. No opening acquaintance survives the extra century; descendants carry the connection |
| Quantified water displacement, a 180-year aquifer leak, a numbered gauge, proof by arithmetic | **Decision 3.** A causal rupture. **Never scientifically explain the mechanism; present observations and character theories only.** Water loss is one symptom among several. Evidence is testimony and inference |
| Three selectable warning clauses, `warning_text_a/b/c`, the plank rewritten to match player choice | **Decision 4.** One fixed text, recited word for word from memory, after the hero is shocked that nobody has heard it |
| Cooperative ending; both survive; the sacrificial variant; the walk-home epilogue | **Decision 5.** The hero kills their earlier self, then dies destroying the cave. One ending |
| The forced mis-aim (an obscured mark) | **Proposed.** An established limitation: three fixed settings, and the dish for the home setting has not been cut yet |

Kept, because the owner kept them: the chapter structure, the builders'
drawing as the promised power, landmarks changing across eras, Tyme's payoff
(now carried by his successors), a finale built from collected objects and
knowledge, and a hero who stays sixteen.

### Revision 4 — five contradictions closed

Found in owner review of revision 3. All five were real.

| Finding | Correction |
| --- | --- |
| The settings did not add up: "one century on" from −100 is year 0, not +100 | **Fixed destinations, not offsets.** Three heights reach three fixed points: −100, year 0, +100. Every crossing re-derived from that. §3D, §5 P3 |
| Transmission still lost an apologetic qualifier and turned *a wanderer* into *the Wanderer*, though the recitation is now the opening text verbatim | **The text never changes.** What grows around it is illustration, commentary and ceremony. §6 |
| Future testimony described a one-eyed stranger in year 0, which has no source: the intervention has not happened, and in that history it never does | **Removed.** The inherited story is now about a child who went into the hill and did not come out — which *is* in that history, and is the hero |
| The future walkthrough passed through a sealed cave mouth before breaking the seal | **The seal guards the portal chamber, not the hillside.** The hero leaves the deep chamber by a fissure the subsidence opened, and must break the seal to get *back in* to the dish. §4, §5 P6 |
| The finale's pillar was "loosened by a century of rupture" — a century that lies in a future which never happens | **Ordinary load-bearing stone, foreshadowed in two eras.** Lovage cut it and says it is the only thing holding the roof; by year 0 it has a settlement crack at its base. §8, §9 |

### Status legend

| Label | Meaning |
| --- | --- |
| **APPROVED** | Settled by the owner. Not negotiable here. |
| **PROPOSED** | This document's recommendation, awaiting approval. |
| **OPEN** | Deliberately unsettled; listed in `M2_DECISIONS.md`. |

Source reviewed: `31866e6`, where `tsc --noEmit` is clean and 210 tests pass —
**those figures describe the shipped Chapter 1, not this design.** No M3 story
code exists. **Nothing in this document is implemented or tested**, and the
command sequences in it are specifications, not records of play.

---

## 1. Premise

A sixteen-year-old is the first person in living memory to look at the cave's
old relief properly, and works out that it is a set of instructions. Noticing
is the whole problem. Everything that follows — the prophecy their village has
feared all their life, the end of the world, and the two bodies in the chamber
at the end — begins with a clever child putting a light where it belongs.

### Design goals

1. **Observation, never eligibility.** The hero is first because they looked.
2. **Mystery without mechanism.** **Never scientifically explain the
   mechanism; present observations and character theories only.** Nobody in
   this world can explain the rupture, so nobody does — not a mason, not an
   inscription, not the narration, not a journal entry, not an omniscient
   survivor. The player still gets certainty about *responsibility*, which is
   a different thing and is never softened to protect the mystery.
3. **Responsibility, not surprise.** A player who guesses "I am the Wanderer"
   in chapter one still has the real questions ahead: what they did, whether
   it can be undone, and what undoing it costs.
4. **Short.** Four chapters, seven puzzles, a small cast.

---

## 2. Ending first, then the path to it

### The ending — APPROVED (decision 5)

The returning Basil/Basilia comes back through the fold at the one moment it
can be entered from the far side: the second their earlier self sets the lit
lamp in the alcove and the seam appears.

They are three days older, missing an eye, filthy, and carrying a mason's
mallet a hundred years out of its century. The person in front of them has
just solved the puzzle nobody has ever solved, is twenty minutes from the
proudest moment of their life, and has spent eleven days being told that
someone who braves this cave will have the power to turn aside a one-eyed
monster.

Every proof of identity the returning hero can offer is also proof, on the
plank's own authority, that they are the thing the village is afraid of.

The player can try talking, showing the journal, showing the matching lantern,
blocking the threshold, and physically restraining them. Each fails for a
stated reason (§8). The earlier self is exactly as determined, knows the same
tricks, and does not stay stopped. In the end the returning hero does the only
thing that stops them before they cross, and **kills them.**

Then they bring the hill down on the chamber, from inside, and die doing it.

**Why both.** Stopping one crossing stops one journey. The prophecy the hero
themselves put into this village's history is a written promise that braving
this cave grants the power to save everyone — and sixteen-year-olds attempt it
every year, forever. The tear in causality cannot be repaired. It can only be
denied a door. So the door has to go, and the only way to bring that chamber
down is to be in it.

**Why they are still there to do it.** Decision 1. The hero is a singularity;
their experience does not stop because their own history did. The game never
explains this and nobody in it understands it. It is simply true, and the hero
has three days of impossible experience telling them so.

**Aftermath — PROPOSED.** A short authored epilogue in the original era, seen
from the village. The vigil is three nights off. The hill comes down at dusk
and the sound reaches the square. Tyme is on the bench at the mouth with a
coil of rope and nobody to hand it to. The rite ends because the cave does.
The prophecy is fulfilled exactly — someone who braved the Cave of Absolution
turned the Wanderer aside — and nobody will ever know how, or that both of
them were the same child.

### Chapter 1 — The village and the first cave *(implemented)*

| Field | Detail |
| --- | --- |
| **Entry state** | `present` era, `present.home`, nothing carried, nothing known, uninjured. Sixteen today. |
| **Immediate objective** | Undertake the rite of the Cave of Absolution. |
| **Motivation** | They are allowed to, as of this morning, and have wanted to since they were nine. |
| **Main activity** | Village exploration; four contrasting accounts of the cave; the shuttered-relief puzzle. |
| **Complication** | The village is eleven days into a vigil for a prophecy that names this cave and, by implication, them. |
| **Discovery** | *Inferred:* the relief is instructions. *Confirmed:* a passage nobody has found, and a basin with a depth it cannot have. |
| **Exit action** | `ENTER THRESHOLD` in `present.deep_chamber`. |
| **Consequences** | Crossing 1. The tear opens. Carried items travel. |

Unchanged except three small additions in §9.

### Chapter 2 — The past, year −100

| Field | Detail |
| --- | --- |
| **Entry state** | `past` era, `past.deep_chamber`, lantern and wedge, knows only that this village has no prophecy, uninjured. |
| **Immediate objective** | Get home. |
| **Motivation** | They are a stranger a hundred years from their own bed and the water they came out of is now a hand deep and ordinary. |
| **Main activity** | A village that does not know them; earning the worksite; the builders' drawing; **the recitation.** |
| **Complication** | Two things at once. The recitation makes them fascinating and then frightening. And the first symptoms of the rupture begin while they are standing in it — small, wrong, unexplainable — and the village connects them to the stranger, correctly, without understanding anything. |
| **Discovery** | *Inferred:* the fold answers to a lamp at a measured height, and the heights are fixed places rather than distances. *Confirmed:* there are three and no more; the low one is this century; the dish for the middle one is not cut. **And:** nobody here has ever heard the prophecy they have known since school. |
| **Exit action** | `PLACE LANTERN IN HIGH DISH` → `LIGHT LANTERN` → `ENTER APERTURE`. Forward, because forward is the only setting that works. |
| **Consequences** | Crossing 2 — the one that shatters it. The recitation enters the village's keeping. Lovage's mallet travels. |

### Chapter 3 — The future, year +100

| Field | Detail |
| --- | --- |
| **Entry state** | `future` era, `future.deep_chamber`, lantern, wedge, mallet, journal. Uninjured on arrival. |
| **Immediate objective** | Find out where they are, and get out of a chamber the hill has closed. |
| **Motivation** | They lit the one position they could, knowing only that one of the three was home. It was not this one. They need to know where they have come out before they can do anything about it. |
| **Main activity** | A surviving settlement in their own square; two people who help them; reading what is left. |
| **Complication** | Breaking back *in* through the sealed mouth costs them an eye — struck by a stone from a rockfall that has not happened yet. The next person who sees them backs away from a one-eyed figure coming out of the hill and names them from a text the hero themselves wrote. |
| **Discovery** | *Inferred, immediately:* the world ended. *Confirmed, by testimony and dates:* it began the year they went into the cave; the settlement's oldest story is of a child who went up to the hill that night and never came out; and the account they live by is word for word the thing the hero recited a hundred years before that. |
| **Exit action** | `PLACE LANTERN IN LOW DISH` → `LIGHT LANTERN` → `ENTER APERTURE`. Back, one century, to the moment the seam opens. |
| **Consequences** | Eye lost. Responsibility established. Carries the mallet home. |

### Chapter 4 — The return, the confrontation, the end

| Field | Detail |
| --- | --- |
| **Entry state** | `present` era, `present.sealed_chamber`, three days of lived experience, one eye, lantern, wedge, mallet, journal. |
| **Immediate objective** | Stop the person in front of you from crossing. |
| **Motivation** | They have seen the century their next step produces. |
| **Main activity** | A staged turn-based confrontation that the player cannot talk their way out of. |
| **Complication** | The evidence that proves who they are is the evidence that they are the cyclops. |
| **Discovery** | *Confirmed:* why the cave cannot simply be left shut. |
| **Exit action** | The killing, then `BREAK PILLAR WITH MALLET`. |
| **Consequences** | Both selves dead. The cave gone. The catastrophe never happens. |

---

## 3. Time, causality, and what accumulates

### The design's causal sequence — APPROVED (decisions 1 and 3), never shown to the player

1. The hero crosses into the past. A century-deep displacement of a person is
   the first tear.
2. In the past they become the source of the prophecy they grew up inside. A
   fact with no origin outside itself is the tear widening.
3. Instead of returning home, they travel onward to the future. **That is what
   shatters it**, and the shattering is the catastrophe.
4. The hero themselves is exempt from the consequences of changed history. No
   reason is given for this anywhere in the game.

**Nobody in the world knows any of this.** There are no scientists. There are
witnesses, inheritors, believers and guessers, and the design must never put a
correct technical account in any of their mouths — including a narrator's, a
journal's, or an inscription's.

### What the player is allowed to see — PROPOSED

Three escalating kinds of symptom, all presented as observation.

**Nothing is wrong in Chapter 1.** The tear does not exist until the hero
crosses at the end of it, so the opening era is simply itself — which is also
why the chamber's one blemish there is an ordinary settlement crack and not a
portent (§9).

| Kind | Looks like | Where |
| --- | --- | --- |
| **Out of sequence** | A sound arrives before its cause. Weather that un-happens. A bell heard, then rung. | Faint in Ch2 while the hero is standing in it; everywhere in Ch3 |
| **Will not stay put** | A tally is wrong in a way nobody can account for. A chalk mark is not where it was left. | Ch2 and Ch3 only |
| **Absence** | Water goes first, then light, then the seasons. | Ch3 mainly: a dying sky, a cold summer, a sea that came up and stayed |

**Water is a symptom, not the mechanism.** The shipped plank already says *the
water will answer*, which reads as prophecy rather than hydrology, and that is
exactly the register to stay in.

### Why previous rite participants caused nothing

They never crossed. Oreg got the shutter up once, looked into an empty alcove
and let it fall. Dilly never reached the room. The cost attaches to the
crossing, not to merit, and the hero is not more deserving — only first.

### A. The hero's subjective order — PROPOSED

| # | Where | Elapsed | Carried out | Injury |
| --- | --- | --- | --- | --- |
| 1 | Village and first cave | day 1, morning to dusk | lantern, wedge | — |
| 2 | The past (year −100) | day 1 evening to day 2 | + Lovage's mallet | — |
| 3 | The future (year +100) | day 2 to day 3 | + the journal's record of it | **left eye, mid-chapter** |
| 4 | The sealed chamber, year 0 | day 3, the same dusk as (1) | — | — |

**About three days.** The hero is sixteen throughout; a distant destination
does not age them. By chapter 4 they are filthy, thin, half-healed and
one-eyed — enough that the earlier self does not know them at once.

### B. The world's calendar order — APPROVED dates

| Calendar | Event | Who knows |
| --- | --- | --- |
| year −100 | Lovage's crew are three seasons into cutting the stair down to the water. They have found that a lamp at three heights makes the air answer, cut dishes at two, tried the low one, and recorded that it does nothing. The middle dish is uncut. **Nobody in this century has been anywhere.** | the past village |
| year −100 | A stranger comes up out of the basin, earns the worksite, is shocked that nobody has heard the Wanderer-words, and **recites them word for word.** It is written down. | the past village |
| year −100 | Small wrongnesses begin. The village blames the stranger. The stranger leaves forward, because forward is the only setting that works. **The tear is left open.** | nobody understands it |
| −100 → 0 | The recitation is copied, read at midwinter, carved, glossed and dated by commentary, and taught to children. **The canonical prophecy text is never altered** — the layers grow on top of it. | everyone, as tradition |
| −100 → 0 | The builders finish the chamber: camouflaged, the middle and high dishes filled, the low one left behind a shutter, the relief cut to show that one height. | nobody by year 0 |
| −100 → 0 | The chamber's one worked pillar settles. By year 0 it is cracked at the base. | unremarked |
| year 0, morning | Basil/Basilia turns sixteen. Hyssop has counted a date out of the old lines; the village is eleven days into a vigil. | the village |
| year 0, dusk | The earlier self solves the relief, lights the lamp, and the seam opens. | the player |
| **year 0, dusk, the same minute** | **The intervention.** A one-eyed stranger arrives. The earlier self is killed. The hill comes down on the chamber with the stranger inside. | nobody survives it |
| year 0, that night | The sound reaches the square. The cave is gone. The rite ends. | the village |
| ~~year 0 onward~~ | ~~Causality shatters. A century of collapse: water, then light, then seasons. Civilisation fractures. A few survive.~~ | **never happens** |

### C. The warning is already historical; the finale is new

They are different kinds of event.

- **The recitation** happened on the hero's only pass through year −100. From
  the village's side it had already happened four generations before the hero
  was born. Nothing was changed by it: the history the hero grew up in already
  contained it. When they recite it they are not altering anything — they are
  finding out, slowly, that they were always the source.
- **The finale** targets a minute the hero has already lived from the other
  side, and adds a second person to it. Their own memory of that minute
  contains no stranger. **This one is the change, and it is the only one.**

**No future self appears in Chapter 1 as played.** Chapter 1 *is* the
unchanged history. The recognition the player feels on arriving in Chapter 4 is
the whole effect and needs nothing retrofitted into the opening.

### D. Crossings — PROPOSED rules

**The three settings are fixed destinations, not offsets.** A lamp at one of
three heights makes the fold answer, and the three places it reaches are the
same three places from any era:

| Height | Reaches | Called |
| --- | --- | --- |
| **low** | year −100 | the builders' own century |
| **middle** | **year 0** | the opening village's year |
| **high** | year +100 | — |

Nobody in the game knows this as a rule. The hero works it out, incompletely,
from one arrival and one craft record (§5 P3).

| # | Motive | Height | From → to | Carried | Design consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Find what the cave is for | the alcove — the one height the relief depicts, and the **low** one | year 0 → **−100** | lantern, wedge | The first tear |
| 2 | Reasoned gamble: one of the two untried heights must be home, and the home dish is uncut | **high** | −100 → **+100** | + mallet | **The shattering** |
| 3 | Now knows which height is which | **middle** | +100 → **year 0**, the instant the seam opens | + journal | Makes the intervention possible |

**Why year 0's chamber offers only one height.** The builders cut three dishes;
when they finished the chamber they filled two and left the low one behind a
shutter, which is why the relief depicts a single position. In year +100 the
collapse cracks the fill open again, which is how the hero reaches the middle
dish at all.

**Object transport** is a gameplay rule and is not presented as law: what the
hero is holding comes with them, nothing is confiscated, and nothing arrives
that they did not carry. The lantern is auto-recovered on arrival, exactly as
the shipped Chapter 1 crossing already does.

**Why the fold can be entered from the far side only at that minute:** it
answers to light through the aperture, and in year 0 the aperture is lit for
the few minutes the earlier self's lamp is in the alcove. The hero does not
choose the minute; it is the only one available. **The earlier self's own
action is what lets them come back** — and it is the thing they come back to
prevent.

### E. Player knowledge versus character knowledge

| Beat | Player may suspect | Hero knows |
| --- | --- | --- |
| Ch1, the plank | "one-eyed" is aimed at me | nothing |
| Ch2, the shock | the prophecy has no source but me | that nobody here has heard it, which is impossible |
| Ch2, the recitation | I am writing it | something is very wrong; not yet what |
| Ch3, arrival | this is the cataclysm | the world ended |
| Ch3, the account | I did this | reads their own words in a stranger's keeping, dated to the year they went in |
| Ch3, after the injury | I am the Wanderer | hears a frightened stranger name them |
| Ch4 | — | everything that matters, and none of the mechanism |

### F. Honest residue

**The information loop is deliberate.** The detail *one-eyed* has no first
author: the hero learns it at school in year 0 and speaks it in year −100, and
the village carries it forward to the plank they learned it from. Decision 4
makes this the chosen origin, not a defect. The design's only job is to let
the hero notice it and to never explain it. There is **no earlier prophet, no
unseen author, and no record predating the recitation.**

**Nothing else is patched.** No parallel universe, no reset, no manipulator,
and no scientific account anywhere.

---

## 4. Map by era

Existing implemented IDs are marked ✅.

### Village

| Concept | `present` | `past` (−100) | `future` (+100) |
| --- | --- | --- | --- |
| `home` | ✅ `present.home` | — | — |
| `square` | ✅ `present.square` | ✅ `past.square` | `future.square` — the settlement, perhaps thirty people |
| `workshop` | ✅ `present.workshop` | *(the half-built wall in `past.square`)* | *(a roofless shell in `future.square`)* |
| `cave_path` | ✅ `present.cave_path` | `past.cave_path` | `future.cave_path` — the hillside, with **the fissure** and, below it, the sealed mouth |
| `spring` | — | `past.spring` | *(cut; the dry spring is described from the square)* |

### Cave

| Concept | `present` | `past` | `future` |
| --- | --- | --- | --- |
| `entrance` | ✅ `present.entrance` | ✅ `past.entrance` | `future.entrance` — **sealed by the village**, their mark on it |
| *(the fissure)* | — | — | `future.cave_path` → `future.deep_chamber`: a subsidence crack, the hero's **only** way out of the hill and back into it |
| `outer_gallery` | ✅ `present.outer_gallery` | *(not cut yet)* | *(gone)* |
| `echo_chamber` | ✅ optional | — | — |
| `sealed_chamber` | ✅ `present.sealed_chamber` | `past.worksite` | *(crushed; **behind the seal**, and the only place the middle dish exists)* |
| `deep_chamber` | ✅ `present.deep_chamber` | ✅ `past.deep_chamber` | `future.deep_chamber` |

The past has no gallery and no crawl: a worked stair runs from the mouth to the
worksite. **Both facts are already true in the shipped Chapter 1 text.** The
future has no gallery either — the hill has moved.

#### The future cave is two separate spaces, and that is the point

A century of subsidence has split the inside of the hill in two, and **the seal
guards one half only.**

| | Route | State |
| --- | --- | --- |
| **The lower half** | `future.cave_path` ⇄ *the fissure* ⇄ `future.deep_chamber` | A crack the hill opened by itself, well above the old mouth. The hero arrives in the deep chamber and **leaves this way**, which is why they reach the settlement without touching the seal |
| **The upper half** | `future.entrance` → the crushed chamber and **the middle dish** | Shut with fitted stone and the village's mark. **The only way to the dish**, and the reason P6 exists |
| **Between the two** | the old stair | Choked with fall. Impassable, examinable, and stated the first time the hero tries it |

So the hero can get out of the hill and cannot get back to the portal, which is
exactly the shape the chapter needs: the village's seal is not scenery the
walkthrough walks through, it is the last obstacle in the chapter.

### Compact map

```
VILLAGE                        CAVE
home — square — workshop       entrance — gallery —┬— echo (optional, present only)
          |                        |               └— sealed / worksite / crushed
      cave_path ───────────── entrance                      |
          |                                            deep (basin)
       spring (past)                                        ╎  the fold
```

### Scope

- **Rooms to build:** 8 — `past.cave_path`, `past.spring`, `past.worksite`,
  `future.deep_chamber`, `future.entrance`, `future.cave_path`,
  `future.square`, and the Chapter 4 epilogue reusing `present.*`.
- **Required puzzles:** 7, including the shipped opening and the finale.
- **Recurring characters:** 7 across three eras, of whom 4 are shipped.
- **Optional rooms:** `present.echo_chamber` (shipped).

---

## 5. Puzzles and dependencies

```
         ┌─ optional: echo chamber, Parsie's stone
         │
P1 shuttered relief ──► crossing 1 ──► P2 worksite access ──► P3 the three settings ──┐
   (Ch1, shipped)                            │                                        │
                                             └──► P4 the recitation ──────────────────┤
                                                        │                             │
                                                        │ (the recitation is what     │
                                                        │  bars the stair, so P4      │
                                                        │  gates P2's second route)   │
                                                        ▼                             ▼
                                                                          crossing 2 (forward)
                                                                                  │
                           P5 the settlement's account ◄─────────────────────────┘
                                      │
                                      ▼
                           P6 in through the seal   ──► crossing 3 ──► P7 the confrontation
                              (Ch3, eye lost)                            (Ch4)
```

No cycles. Every required fact has at least two sources (§6). Nothing required
sits behind optional dialogue.

---

### P1 — The shuttered relief · `present.sealed_chamber` · **shipped**

Unchanged. See `docs/WALKTHROUGH.md`. Listed as the dependency root.

---

### P2 — Getting onto the worksite · `past.cave_path` / `past.spring`

| | |
| --- | --- |
| **Purpose** | Make the past a place with its own rules, and the hero a stranger with no standing in it. |
| **Visible first** | Lovage's crew with barrows; a rope across the mouth; chalk tallies. |
| **Clues** | Fenn: nobody ever stops the person carrying the water. Saffra: Lovage will not have strangers on the stair "while the chalk is wet". A barrow of empty skins by the spring. |
| **Solution** | `GO TO SPRING` → `TAKE SKINS` → `FILL SKINS` → `GO TO ENTRANCE` → `GIVE SKINS TO LOVAGE`. Selectable: *Spring* → *water skins* → *Take* / *Fill* → *Entrance* → *Give the water skins to Lovage*. |
| **Items** | `water_skins`. Lovage keeps them, which is the point. |
| **Flags** | `past_worksite_access` |
| **Wrong but reasonable** | Asking outright: *"No. Come back when you are somebody."* Climbing: the shale gives and he watches you slide down. Showing the lantern: he admires it and still says no. |
| **Hints** | 1. Somebody goes up that stair all day and nobody stops them. 2. Fenn said who carries the water. 3. Fill the skins at the spring and carry them up. |
| **Recovery** | The skins cannot be lost. If dropped they stay dropped. |

#### After the recitation, the water route closes — and two replacements are guaranteed

Lovage pulls the rope across and posts his eldest. **Both of these appear on
the `recited_prophecy` flag, with no prerequisite on any earlier
conversation**, so no dialogue order can strand the player:

- `TALK TO FENN` → topic *the old way*. Fenn comes and finds the hero. He is
  frightened and wants to be useful, and he knows a crawl behind the spoil
  heap. **The topic never disappears once it has appeared.**
- `TALK TO SAFFRA` → topic *get me up there*. She walks the hero past Lovage
  herself. She does not enjoy it and he does not forgive her.

**No conversation in this chapter is a prerequisite for progress.** Every
gating topic is either always available or appears on a flag the required path
sets.

---

### P3 — The builders' three settings · `past.worksite`

| | |
| --- | --- |
| **Purpose** | Deliver the thing the prophecy calls *the power*: the fold answers to a lamp, and its height decides where you come out. This is the chapter's real prize and the hero's only asset afterwards. |
| **Prerequisites** | P2 |
| **Visible first** | A half-cut aperture in a thinned panel. The scale pattern chalked out but not carved. **Three positions marked up the panel in chalk — and only two dishes cut.** Where the middle one will go there is rough rock and a chalk outline. The low one, the hero may notice, is the height they arrived at. |
| **Clues** | The drawing, complete and numbered. Lovage's crew's own notes, kept as a craft record and not as a theory, because they have none: *the air answers a lamp at three heights. We cut dishes at two. Hoyt stood in the low one and came out of the same hole he went into, so the low one does nothing. We have not tried the other.* |
| **Why the solution follows** | The relief in Chapter 1 showed one height. The drawing shows three, with the dishes to prove it. The hero has spent a day reading a weathered third of an instruction sheet. |
| **The limitation, stated plainly and checkable** | The lamp must stand in a cut dish. The dish holds it at the exact height and nothing else does. **The middle dish is the last thing the crew will cut**, and Lovage will not cut it early. Low and high exist; middle is a chalk outline on rough rock. |
| **What the hero can actually work out** | The crew's record says the low setting *does nothing* — and the hero arrived here by a lamp at that same low height, in their own year. So the heights are not distances; they are **places**, the same three places from any century. One of the three must therefore be home. It is not the low one. The middle one cannot be used. **That leaves one usable setting and no way to know in advance whether it is home.** The reasoning is sound and the information genuinely runs out there. |
| **Every obvious attempt is answered** | `EXAMINE OUTLINE` — chalk on rough rock, no dish. `PLACE LANTERN ON RUBBLE` — it will not sit level, and the light wanders; the fold does not answer. `ASK LOVAGE TO CUT IT` — *"That is a week with two men, and I would not give you an hour."* `WEDGE LANTERN` — the wedge props a shutter, not a lamp at a hand's tolerance; and the dish is cut to a depth you cannot guess at. `WAIT` — available, and the reason it fails is the chapter's complication: the wrongnesses are starting, the village has decided they came in with the stranger, and by the second day the hero is not going to be allowed near the hill at all. |
| **Solution (to leave at all)** | `EXAMINE DRAWING` → `EXAMINE DISHES` → `PLACE LANTERN IN HIGH DISH` → `LIGHT LANTERN` → `ENTER APERTURE`. |
| **Flags** | `read_drawing`, `knows_settings` |
| **Hints** | 1. The drawing is not decoration; there are three positions on it. 2. Three heights, three places — the same three places from any year. You came in by the low one. 3. One of the other two is home. The middle has no dish and nobody will cut it for you. |
| **Cross-era consequence** | **Yes, and it is the catastrophe.** The player is not told that. They are told, correctly, that one of these two is home and only one can be lit. |

**This is a reasoned gamble, not a mistake.** The hero deduces the right
rule from the one arrival and the one craft record they have, concludes
correctly that home is reachable, and finds that the only setting they can
physically use is the one they cannot identify. They light it believing it is
as likely to be home as not. **The player is never nudged into an avoidable
error, and never told the answer the hero could not have had.**

The alternative is staying in year −100 for the rest of their life, in a
village that has already decided the wrongnesses arrived with them. The design
should let the player feel the weight of taking the chance, not the sting of
having been tricked.

---

### P4 — The recitation · `past.square` · **APPROVED shape** (decision 4)

| | |
| --- | --- |
| **Purpose** | The story's hinge. The prophecy enters history here, out of the hero's mouth, word for word. |
| **Prerequisites** | Reaching `past.square`. |
| **Visible first** | Saffra on her plank; Fenn; a village with no cord between the eaves, no bowl of salt, no plank by the well. |
| **The shape** | The hero assumes everyone knows the Wanderer-words — it is the thing their whole childhood was arranged around. They mention it the way you mention a holiday. **Nobody has heard of it.** The hero's shock is the beat. The villagers get curious and ask what it says. And the hero, who has recited it in a schoolroom every midwinter since they were five, recites it. |
| **Fixed content** | **The canonical prophecy text in §6, verbatim, every time.** No variants, no selectable clauses, no flags recording wording. |
| **Where the agency is** | The questions the player asks before and after; how much the hero explains; whether they warn, confess or refuse to say how they know; whether they tell Fenn the truth; and whether they try to take it back once they realise. **None of it changes the recited text.** |
| **Solution** | `TALK TO SAFFRA` → topic *the Wanderer* → (shock) → topic *what it says* → `RECITE PROPHECY`. Selectable: **Saffra** → *the Wanderer* → *what it says* → *Recite it*. |
| **New verb** | `RECITE PROPHECY`. Justified: the act is the hinge of the game and the player should perform it, not watch it. Narrowly scoped; valid only here. |
| **Flags** | `recited_prophecy`, plus `told_fenn_truth` and `tried_to_retract` for flavour |
| **Wrong but reasonable** | Explaining time travel: Saffra hears a stranger describe a hole in the year and goes back to her mortar. Refusing to recite: available, and they ask again, and again, and Fenn asks, and the hero eventually does — **the recitation is required and the design does not pretend otherwise**, but the player chooses how long it takes and in what spirit. |
| **Hints** | 1. They have never heard of it. Sit with that for a moment. 2. They want to know what it says. 3. You know it by heart. Say it. |
| **Recovery** | Saffra is in the square all chapter. |

**The realisation — PROPOSED.** Partial here: one line, as the hero hears
their own voice saying the words to people who are writing them down. The full
weight lands in Chapter 3, when they read it back in a stranger's keeping.

---

### P5 — The settlement's account · `future.square` · **replaces the water ledger**

| | |
| --- | --- |
| **Purpose** | Establish responsibility by testimony and inference. **No measurement, no arithmetic, no diagnosis of mechanism.** |
| **Prerequisites** | Crossing 2, and getting out of `future.deep_chamber` **through the fissure** (not a puzzle; the choked stair is described once so the player knows the portal is now behind them). |
| **Visible first** | Thirty people in a square the hero crossed this morning. The well capped with stone. A roofless shell where the workshop stands. A dying sky. |

#### The four pieces of evidence

| Piece | What it is | What it establishes |
| --- | --- | --- |
| **The Account** | The settlement's version of the Wanderer-words, kept by Rue: no longer a prophecy but their history of how the world ended. Longer than the plank, with a century of gloss grown onto it — and the five original lines still in the middle of it, word for word. It says plainly that **the Wanderer came out of the hill.** | That the hero's recitation is this world's founding text, and that the text now describes *them* |
| **The family story** | Rue's, inherited and worn smooth: **on the night it began, a child of the village went up to the hill for the rite and did not come out.** Nobody went in after them. Three versions exist and they disagree about the name. | A witness account, uncertain in the way real inheritance is — **and the hero is the child** |
| **The memorial** | A stone in the square naming the year the world started going wrong. | A date — **the year the hero went into the cave** |
| **The hero's journal** | Their own entries from Chapters 1 and 2: names, the date of their birthday, what they said in the square a hundred years before that. | The match. The player makes it; nobody states it |

#### Solution

```
TALK TO SORREL                     who takes the hero in, and will answer anything
EXAMINE MEMORIAL                   the year
EXAMINE ACCOUNT                    the canonical text, in the middle of a century of gloss
READ JOURNAL                       their own words, and their own birthday
TALK TO RUE   → the account        where it came from: "a stranger said it"
              → the child          the family story, and the name nobody agrees on
              → the year           what their grandmother's grandmother was told
```

| | |
| --- | --- |
| **Why the solution follows** | Four independent things agree on a person, a night and a year, and the hero is the only one who can see that the person is them. |
| **Flags** | `read_account`, `heard_family_story`, `knows_responsibility` |
| **Wrong but reasonable** | Asking Rue what caused it: she tells the hero what her family believes, which is that the Wanderer did it, and she is right without knowing anything. **Asking her how it works: she has no idea, and says so.** There is no omniscient survivor and no technical account anywhere in the chapter. |
| **Hints** | 1. Rue keeps the account. Read it before you ask her about it. 2. The lines in the middle of it are not hers. 3. Compare the year on the memorial with the date in your own journal. 4. Ask her about the child. |
| **Recovery** | The Account and the memorial are fixed scenery and cannot be taken, lost or destroyed. Rue and Sorrel are in the square for the whole chapter. |

**What the hero concludes, precisely.** Not a mechanism. That the world ended
starting in the year they walked into the hill; that the text everyone here
lives by came out of their own mouth; and that the missing child in this
settlement's oldest story is them. **They do not learn why, and neither does
the player.**

**Nothing here is a record of something that has not happened.** This history
contains the hero's recitation in year −100 and their disappearance into the
hill in year 0, because both of those have occurred. It contains **no witness
to a one-eyed figure in the opening era**, because in this version of events
the hero never goes back: the final intervention happens for the first time
when the returning hero makes it (decision 1). The Account calls the Wanderer
one-eyed **because the hero's own recitation said so** — the description is
inherited text, not testimony, and the settlement has never matched it to
anybody. The one person who will ever meet that figure is the hero's earlier
self, in a chapter the future cannot know about.

---

### P6 — In through the seal · `future.entrance` · the eye

| | |
| --- | --- |
| **Purpose** | The return route, and the injury. **The hero has to break *into* the hill**: the fissure they climbed out of leads only to the dry basin, and the old stair up to the portal is choked. The dish is behind the village's seal. |
| **Prerequisites** | P5, `knows_settings` (P3), and the mallet. |
| **Visible first** | The mouth closed with fitted stone and the village's mark cut into it, downhill from the crack they came out of. |
| **Clues** | The three heights, remembered, and the arithmetic now closed (below). Rue: the seal was put there by her people and is not to be opened. Sorrel knows a loose course near the bottom. |
| **Which setting, and how the hero knows** | They arrived in −100 by the **low** height and came out here by the **high** one. So the heights are three fixed places: −100, here, and one more — **and the one more is the middle.** The deduction the hero gambled on in P3 is confirmed by the gamble itself having worked. **The middle dish only exists here**: the builders filled it when they finished the chamber, and the collapse has cracked the fill open. |
| **Solution** | `WEDGE COURSE` → `BREAK SEAL WITH MALLET` (×2, authored, escalating) → **the stone** → `IN` → `EXAMINE FILL` → the middle dish behind it → `PLACE LANTERN IN MIDDLE DISH` → `LIGHT LANTERN` → `ENTER APERTURE`. |
| **The injury — PROPOSED** | On the second blow, **outside, in the open, in front of witnesses**. A stone comes down and takes the left eye, **and it is not a stone the hero loosened** — it falls from a rockfall that has not happened yet, and the hero hears the fall begin after it has already hit them. Two sentences. No spectacle, no interface gimmick, no half-blanked screen. The rupture wounds them directly, which is the only time it touches a person in the whole game. One journal line. |
| **Flags** | `seal_opened`, `lost_eye` |
| **Wrong but reasonable** | Breaking the seal without wedging the course: it settles and has to be lifted again — a setback, not a death. Asking Rue's permission: refused, kindly, and she does not stop them. Digging by hand: hours of it, described, and the stone does not move. |
| **Hints** | 1. The crack you climbed out of goes down to the water, not up to the aperture, and the stair is gone. 2. The mouth is sealed and you are carrying a mason's mallet. Sorrel said which course is loose; wedge it before you swing. 3. Inside, the dish you want is the middle one, and the fill over it is cracked. |
| **Recovery** | **If the mallet was left in the past**, the shell of the workshop in `future.square` yields a maul. Slower, described as such, same outcome. No softlock. |

**Identity confirmed by the world, not by narration.** The seal comes down in
daylight with people watching, and a one-eyed stranger standing over it with a
mallet is the thing their history warned them about. Somebody backs away and
says the word.
Narration never states that the hero is the Wanderer; a frightened stranger
does, out of a text the hero wrote.

---

### P7 — The confrontation · `present.sealed_chamber`

Full flow in §8.

---

## 6. The prophecy — one canonical text

### The canonical text — the shipped plank, unchanged

```
    The Wanderer comes one-eyed and without mercy.
    The hill will open. The water will answer.
    What stands will not stand.
    One who braves the Cave of Absolution will have the power to turn it aside.
```

This is **already implemented** in `present.square` (`square.plank`) and is
declared canonical. **It is not edited.** The hero's recitation in Chapter 2 is
these lines, verbatim; the settlement's Account in Chapter 3 contains these
lines, verbatim, inside a century of accreted gloss; the journal summary
already shipped is consistent with all three.

**Where "cyclops" comes from.** The plank says *one-eyed*. Sage's shipped
dialogue supplies the village's gloss — *"A cyclops. One eye."* — and adds, in
lines already written, that the central-eye picture everybody carries is "the
carvers' idea, not the words'." So the approved claim that the prophecy
describes a cyclops is satisfied **without any authoritative text making an
anatomical statement**, and a hero who later loses one of two eyes still
matches it. Those lines are load-bearing and must not be edited.

### Transmission — PROPOSED

**The words themselves never change.** The hero recites the canonical text
from memory; Saffra writes that text down; the plank in year 0 carries it; the
Account in year +100 carries it. Any drift in the
wording would be a second author, and decision 4 forbids one — the information
paradox only closes if the text that arrives is the text that left.

So the hundred years do not edit the words. They **pile things on top of
them**, and each layer is somebody's honest attempt to understand a text they
did not write:

| Step | What is added | What is not touched |
| --- | --- | --- |
| 1 | **Saffra writes it down** the evening it is said, on the back of a board, because a stranger who came out of the hill said something frightening and that is what you do with it | the canonical text |
| 2 | **It is read at midwinter**, because midwinter is when this village reads things out — and a reading becomes a ceremony, with a standing and a silence and an order of who speaks | the canonical text |
| 3 | **A carver renders it** two generations later and gives the figure a single eye in the middle of its face, because that is what *one-eyed* sounds like if you have never seen one. Sage already blames the carvings for exactly this | the canonical text |
| 4 | **Glosses accumulate**: *the hill* is this hill, *the water* is the spring, *one who braves the cave* is the rite every sixteen-year-old now walks. By year 0 these readings feel like part of the prophecy and are not in it | the canonical text |
| 5 | **Hyssop counts a date onto it** — PROPOSED, §7 — which is a commentary nobody can source and everybody repeats | the canonical text |

By year 0 the text is taught in school, said every midwinter, carved, argued
over and worn smooth with handling — which is why the hero knows it well enough
to recite it cold a hundred years earlier, **and why what they recite is
exactly what Saffra writes down.** The loop is tight because nothing in it is
creative.

**For the player this is a payoff, not a lecture.** The interpretations the
hero grew up with are the things that turn out to be wrong — the central eye,
the monster, the rite — while the canonical text turns out to be exactly, literally
true.

### Clue table

| Clue | First appears | Taken to mean | Actually means | Confirmed | Status |
| --- | --- | --- | --- | --- | --- |
| *one-eyed* on the plank | Ch1 square | a monster's anatomy | the hero, later | Ch3, after the injury | required |
| "the water will answer" | Ch1 square | poetry | one symptom among several | Ch3 | required |
| Basin with a depth it cannot have | Ch1 deep chamber | wonder | the fold | Ch2 | required |
| The crack at the foot of the pillar | Ch1, unremarked; Ch2, being cut; Ch4 | weathering | the chamber has one support and it is already tired | Ch4, when the hero swings at it | optional |
| Nobody in year −100 has heard the prophecy | Ch2 | they are ignorant | there is nothing to have heard yet | Ch3 | **required** |
| Three heights, three fixed places | Ch2 worksite | a craft record | the power | Ch3 return | required |
| *The low one does nothing* | Ch2 worksite | the same craft record | proves the heights are places, not distances | Ch2 | **required** |
| The uncut middle dish | Ch2 worksite | unfinished work | why only one setting is usable | Ch2 | **required** |
| Things out of sequence | Ch2 faintly; Ch3 everywhere | local strangeness | the rupture | never explained | required |
| The Account's five middle lines | Ch3 square | scripture | the hero's own voice | Ch3 | **required** |
| The memorial's year | Ch3 square | when it started | the hero's sixteenth birthday | Ch3, against the journal | **required** |
| Two identical lanterns | Ch4 | — | the only proof of identity that works | Ch4 | required |
| Parsie's stone in the record chest | Ch1 optional → Ch3 | a kid's errand | it was kept, and handed down | Ch3 | optional |

**Multiple sources for every central revelation.** Identity: the plank, the
injury, a stranger's reaction, two lanterns. Responsibility: the Account, the
family story, the memorial, the journal. Scope: the sky, the sealed cave, the
capped well, accounts of roads and a sea that came up and stayed.

**No compulsory disastrous action after the hero knows better.** Crossings 1
and 2 happen before they understand anything. Crossing 3 is the one that lets
them end it.

---

## 7. Characters

Four of the seven are shipped.

| Name | Era | Role | Relationship | Wants | Payoff |
| --- | --- | --- | --- | --- | --- |
| **Tyme** ✅ | present | Keeps the entrance and the rope | The adult who takes the hero seriously | Nobody hurt on his path | *"Tell me when you go in, and I will be here when you come out."* He is on the bench in the epilogue with a coil of rope and nobody to hand it to |
| **Parsie** ✅ | present | Eleven; wants his turn in five years | Believes in the hero completely | To go further than whoever went last | Asks for a stone. A century later it is in the record chest |
| **Marjoram** ✅ | present | The baker | Feeds them, unimpressed by prophecy | Roofs mended instead of lanterns hung | — |
| **Sage** ✅ | present | Keeps the plank and the midwinter words | Hands the hero the prophecy | The words kept accurately | Her shipped gloss is what keeps the cyclops claim honest |
| **Saffra** ✅ | past | A mason on a plank | A stranger who decides to write it down | A third course that will dry | **Her handwriting is under the Account a century later** |
| **Fenn** ✅ | past | Eleven or twelve | Believes a stranger on sight | To be useful | Shows them the old way behind the spoil heap |
| **Lovage** | past | Foreman | The gate | To finish the stair | Will not cut the middle dish. Warns the hero off the new pillar — *"That is the roof"* — which is how they know where to swing in Ch4. His mallet kills two people |
| **Rue** — PROPOSED | future | Keeps the Account and the seal on the hill | A descendant of the line that has always kept the hill | The seal to stay shut | Gives the hero the evidence and the family story. **Never learns who they are** |
| **Sorrel** — PROPOSED | future | A child of the settlement | Takes the hero in; the warmth of the chapter | To hear about anywhere else | Knows which course of the seal is loose |
| **The earlier self** | present | Chapter 4 | — | To be the one who mattered | Dies |

**Rue carries Tyme's payoff.** She keeps the hill a century on — not handing
out rope now but keeping a seal shut — and does not know she is doing the same
job. The connection is the player's to feel; she never recognises anything.

### Choices with visible consequences

| Choice | Where | Variation | Branch? |
| --- | --- | --- | --- |
| Bring Parsie a stone | Ch1, optional | It is in the record chest in Ch3 | No |
| Tell Fenn the truth | Ch2, optional | He gives you the old way; he is frightened for the rest of the chapter | No |
| How long the recitation takes, and in what spirit | Ch2 | Tone and surrounding dialogue only. **Never the text** | No |
| How much the hero explains to Saffra | Ch2 | What the gloss on the Account emphasises a century later | No |
| What the player tries in the confrontation, and in what order | Ch4 | Which refusals they hear; how much they understand before the end | No |

**One ending. No plot branches.** Neither gender choice changes competence,
access, puzzles or dialogue availability — only pronouns, as already shipped
and tested.

---

## 8. The final encounter — PROPOSED

`present.sealed_chamber`, year 0, the minute the seam opens. Turn-based,
authored, no reflex component, no combat engine, no timer.

**The room is shut.** The hero arrives through the aperture and the pivoting
slab settles back across it. There is one way out and the other person is
standing in it. `GO`/`UP`/`OUT` gets one line: *You are not leaving this room.
Neither of you is.*

**There is no clock.** The pressure is the earlier self's next attempt on the
threshold, which happens in response to what the player does, not to elapsed
time. A player can stop and read.

### What each approach achieves, and why it fails

| Approach | Action | Result |
| --- | --- | --- |
| **Talk** | `TALK TO BASIL/BASILIA` → *who I am* | *"Anybody could say that."* |
| **Prove identity** | `SHOW LANTERN` | **Works, and makes it worse.** Two lanterns, same dent, same striker chain, three days apart. They believe it — and the plank says the Wanderer is one-eyed and comes to stop the one who could stop it. Being believed converts them from startled to resolved |
| **Prove danger** | `SHOW JOURNAL` | They read a century of other people's deaths in their own handwriting and conclude it is the cyclops' trick. Nothing in the chamber can corroborate it, because the catastrophe has not happened yet |
| **Warn them off the prophecy** | topic *the prophecy* | The hero can tell them where the words came from. The earlier self has recited those words in a schoolroom every midwinter of their life. **It does not land as an argument; it lands as blasphemy** |
| **Block the way** | `STAND IN THRESHOLD` | Holds for one exchange. Then they go for it, and the hero has to choose between letting go and not |
| **Restrain** | `GRAB BASIL`, `TIE BASIL WITH ROPE` | The rope is at the mouth, not here. The hold does not keep: they are the same size, the same strength and the same stubbornness, and they get free. Twice |
| **Destroy the fold first** | `BREAK PILLAR WITH MALLET` | They tackle the hero. Nobody is hurt. The mallet skids to the back of the chamber and has to be fetched |

**The terminal action.** After the player has tried and been answered, the only
action left that stops the crossing is lethal. The design handles it with
restraint: it is one line, it is the mallet because that is what is in the
hero's hand, and the narration does not dwell. What it does spend words on is
the four seconds afterwards.

**Then:** `BREAK PILLAR WITH MALLET`. Three blows, authored, with the hill
answering each one. The last is a separate, deliberate action with its cost
stated before it is taken.

**Why one pillar brings down a hill, and how the hero knows.** Nothing
temporal, and nothing the hero could not have learned with their own eyes:

- **It is the only support there is.** Lovage's crew cut the chamber out of the
  rock and left one worked pillar standing in the middle of it to hold the
  roof. That is ordinary quarrying and it is ordinary masonry practice to hate
  it.
- **The hero watched it being cut.** In Chapter 2 the pillar is new, pale, and
  the thing Lovage is most careful about: *"That is the roof. Not the stone
  over your head — that. Keep your mallet off it."* A throwaway line in the
  chapter the player plays before the one where it matters.
- **A hundred years of ordinary settlement have followed.** By year 0 there is
  a crack at its base and a litter of grit at its foot, present in Chapter 1
  and unremarked (§9). **Not a portent and not a rupture symptom** — the tear
  does not exist until the hero crosses at the end of that chapter, so there is
  nothing for it to be a symptom of. Just old stone, carrying a roof it was
  never really thick enough for.

So the hero is not acting on knowledge of a future that no longer happens. They
are acting on a warning they were given to their face in year −100, about a
pillar they have seen cracked in year 0, with a mason's mallet in their hand.

**Why the hero is still there to do it.** Decision 1, and the game never
explains it. The hero notices, in one line, that they have not stopped
existing, and does not have time to wonder why.

### Aftermath — PROPOSED

Not playable, and not from the hero. A short authored epilogue from the
village, perhaps a page:

- The sound reaches the square at dusk. People come out.
- By full dark it is clear the hill has moved and the cave mouth is gone.
- Tyme is found sitting on the bench with a coil of rope in his hands. He had
  been told somebody was going in. He does not know who, and the village
  decides, over years, that he was mistaken.
- **The village loses a child that night, and knows it.** A sixteen-year-old
  was eleven days into the vigil and went up to the hill at dusk, and the hill
  is now on top of the cave. There is a name, there are parents, and there is
  no body to bring down.
- **What the village never learns is that it lost that child twice**, and that
  the second one came back first. Two people are under the hill. Nobody in
  year 0 has ever met the other one, and nobody ever will. That is the cost
  nobody in the story is in a position to grieve.
- This is the one fact both versions of history agree on. In the future the
  hero walked through in Chapter 3, the oldest story Rue's family keeps is of
  a child who went up to the hill for the rite and did not come out — **the
  same child, the same night, remembered by a world that was wrong about
  everything else.** The design should not point at this. The player will
  arrive at it on their own or not at all.
- The vigil is called off. The rite ends, because there is no cave to walk
  into. Sage puts the Wanderer-words in the chest with the midwinter minutes
  and writes beside them that they came true, which is the only entirely
  accurate thing anyone says about it.

**How the player sees the world is saved — PROPOSED.** The epilogue closes on
one ordinary detail doing the work: a hundred years on, in a square the player
has stood in twice, something small and unremarkable is happening that the
player knows cannot happen in the other version. The recommendation is the
simplest available: **it rains, and the water stays where it falls.**

---

## 9. Scope and implementation handoff

### Milestone boundaries — corrected

> Milestone 3's build brief is [`M3_BRIEF.md`](M3_BRIEF.md). It is subordinate
> to this document: where the two disagree, this one wins.

| Milestone | Chapter | Rooms | People | Puzzles |
| --- | --- | --- | --- | --- |
| **3** | The past, **ending at a minimal future arrival** | `past.cave_path`, `past.spring`, `past.worksite`, **`future.deep_chamber` (arrival only)** | Lovage; extended Saffra and Fenn | P2, P3, P4 |
| **4** | The future investigation | `future.entrance`, `future.cave_path`, `future.square` | Rue, Sorrel | P5, P6 |
| **5** | The confrontation and the epilogue | reuses `present.*` | the earlier self | P7 |

**The old claim that Milestone 3 needs no future-era support is withdrawn.** A
chapter that ends on a crossing with nowhere to land is not playable, so M3
builds `future.deep_chamber` as an arrival room only: the buried chamber, the
dry basin, the hill overhead, and a `look`-and-stop endpoint exactly like the
one Chapter 1 ships today. **All investigation stays in Milestone 4.**

### What that endpoint requires

- **`Era` gains `'future'`** and `LocationId` gains the `future.*` prefixes.
  `eraOf()` and the validator's era/location cross-check both key off the
  prefix, so each extends by one case.
- **`Chapter` gains `'future'`** (and later `'return'`). The chapter/era
  coherence rules in `persistence/validate.ts` need the new pairs: `future`
  chapter ⟺ `future` era, exactly as `crossing` ⟺ `past` works now.
- **`schemaVersion` goes to 2 in Milestone 3**, because that is when a save can
  first hold `era: 'future'` and the current build would correctly refuse it.
  The 1 → 2 migration is trivial — no field changes, every old value still
  valid — and must be **written and tested in M3**, not deferred. It is the
  project's first real migration.
- **New flags** for Chapter 2, roughly twelve: `past_worksite_access`,
  `read_drawing`, `knows_settings`, `recited_prophecy`, `told_fenn_truth`,
  `tried_to_retract`, plus the rupture-symptom flags. Each needs its entry in
  `FLAG_TYPES`.
- **New items:** `water_skins`, `mallet`.
- **New verb:** `RECITE PROPHECY`, narrowly scoped to P4.
- **Puzzle modules** in `engine/puzzles/` beside `shutteredRelief.ts`, same
  `(draft, events) => ResolveResult` shape.

### Chapter 1 additions needed — PROPOSED, minimal

| Change | Why |
| --- | --- |
| Optional `TAKE STONE` in `present.outer_gallery` | Parsie asks for one and there is no way to oblige. Pays off in Ch3's record chest. Optional, gates nothing |
| **The pillar**, in `present.sealed_chamber`'s description | The chamber needs one visible support, cracked at the base, with grit at its foot. Unremarked in Ch1, cut in front of the hero in Ch2, struck in Ch4. **Plain geology, no portent**: the rupture does not exist yet in Chapter 1, so there is nothing for it to foreshadow except the pillar's own weakness |
| One Tyme topic: *what he does while you are inside* | The epilogue and Rue's inherited role both lean on the bench being his |

**Withdrawn from the earlier proposal list:** the numbered gauge and the
structured journal data. Both existed to serve the quantified water proof that
decision 3 removes. Neither was built.

**The shuttered-relief puzzle, the crossing and the past-arrival endpoint are
unchanged.**

### Audit of the current implementation

Checked at `31866e6`. **Nothing shipped contradicts the approved decisions.**

| Checked | Finding |
| --- | --- |
| Prophecy text (`src/content/objects.ts`, `square.plank`) | Matches the fixed claims. No date, no anatomy. **Declared canonical; do not edit** |
| Sage's age gloss (`src/content/dialogue.ts`) | *"older than me, older than my aunt, and she had them from hers"* — about three generations, **consistent with exactly 100 years. No edit needed** |
| Sage's cyclops gloss | *"A cyclops. One eye."* plus the carvers' attribution. **Load-bearing for decision 4; do not edit** |
| Rote learning | Sage's *"the way you would recite a list you have been made to learn"* already implies it |
| Hard dates anywhere | None. The "forty" references are lanterns |
| Universal-rule inscriptions | Never implemented |
| Gauge / aquifer / ledger machinery | Never implemented |
| `past.square` Saffra: "cutting the stair down to the water" | Compatible — the crew are digging a cistern and found the fold on the way |
| Save compatibility | Unaffected by this pass. `schemaVersion` stays 1 until M3 |

**No code changes are made in this documentation pass.**

### Risks

1. **The rupture must stay mysterious without feeling arbitrary.** The guard is
   that every symptom is an observation and every explanation is somebody's
   belief. The temptation to let one character "know" must be resisted in
   review.
2. **Chapter 3 is the heaviest to write** — a whole ruined era for one
   investigation and one physical puzzle.
3. **The confrontation is the hardest scene in the game** and must not become
   a cutscene. The guard is that every stage has a physical object as its
   currency and the player chooses the order.
4. **Lethality handled badly would wreck the tone.** Restraint is a
   requirement, not a preference.

### Cut list, in order, core plot preserved

1. ~~`future.cave_path` — fold into `future.entrance`.~~ **Withdrawn at
   revision 4.** That room now carries the fissure the hero climbs out of, and
   the seal is at `future.entrance`. Merging them merges the two halves of the
   hill and puts the hero through a sealed mouth before they open it, which is
   the bug this revision fixed. **If a room has to go, cut the fissure's own
   description down to two lines instead.**
2. `past.spring` — move the skins to `past.square`, losing a little texture.
3. Sorrel — give her lines to Rue, losing the chapter's warmth.
4. The epilogue becomes narration rather than a scene.
5. P2's second route (Saffra's), keeping Fenn's.

Nothing on this list touches the five approved decisions.
