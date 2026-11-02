# Milestone 3 — the past chapter, ending on arrival in the future

**Status: delivered.** Built, tested and verified in the browser. See
[`docs/WALKTHROUGH.md`](WALKTHROUGH.md) for the routes, puzzle states, save
migration and verification results, and the final report in the commit that
delivered it.

What follows is the brief the work was done against, kept as written so the
scope it set can be checked against what shipped.

Milestone 3 implements Chapter 2 — the hero's three days in year −100 — and
ends the moment they arrive in the future. It is the first milestone to add an
era, and the first to need a save migration.

---

## Design dependency

**This brief is subordinate to [`FULL_GAME_DESIGN.md`](FULL_GAME_DESIGN.md) at
commit `6a60b80` or newer**, together with
[`FULL_GAME_WALKTHROUGH.md`](FULL_GAME_WALKTHROUGH.md) and
[`M2_DECISIONS.md`](M2_DECISIONS.md) at the same revision or newer.

Those documents exist and are current. **Any earlier statement that the
Milestone 2 design documents are absent, pending, or yet to be written is
withdrawn** — it was true of the brief's first draft and is not true now. The
design is revision 4; it carries the five approved owner decisions, the four
contradictions closed after owner review, and a continuity audit graded
14 Pass / 3 Partial / 1 Open.

Where this brief and the design disagree, **the design wins** and this brief is
the thing to correct. Where the design marks something *PROPOSED*, it is still
proposed: build it, and expect the owner to revise it. Where it marks something
*APPROVED* or *canonical*, do not quietly reinterpret it.

Two documents are **canon** and are not edited by this milestone:

- the prophecy text in `src/content/objects.ts` (`square.plank`)
- Sage's cyclops and age glosses in `src/content/dialogue.ts`

Both are load-bearing for decision 4. `CANON.md` says so, and says why.

---

## Fixed constraints

These are owner-approved. They are not open for reinterpretation during
implementation, and none of them is ever explained to the player.

### 1. The hero is a singularity

Basil/Basilia's personal experience is **continuous when history changes**.
Altering events does not erase the returning hero, their memories, or their
injuries. Killing the earlier self does not erase the returning hero, who
remains able to perform the final sacrifice. Two temporal versions of the same
protagonist can coexist during the final confrontation.

**This protects the protagonist only.** It is not a universal law about people,
water or objects passing through the cave. There is no obligatory merge, no
automatic disappearance, no parallel universe, and **no future-self meeting in
the original opening**. The final intervention happens for the first time when
the returning hero makes it.

*Milestone 3 consequence:* nothing in Chapter 2 may hint at a rule here. No
inscription, no character theory, no narration about anchoring or continuity.
The hero does not notice anything about themselves. **Never scientifically
explain the mechanism; present observations and character theories only.**

### 2. Exact destinations: −100, year 0, +100

The past is **exactly 100 years before** the opening village. The future is
**exactly 100 years after**. There are no −140/+40 values, no forty-year
ledgers, no five-generation assumptions.

A lamp at one of three heights makes the fold answer, and the three heights
reach **three fixed destinations, the same three from any era**:

| Height | Destination |
| --- | --- |
| **low** | year −100 |
| **middle** | **year 0** — the opening village's year |
| **high** | year +100 |

**Fixed destinations, not relative offsets.** Nobody in the game states this as
a rule; the hero works out as much of it as the available evidence supports
(see *Cave puzzle*). No character has a theory about why the heights behave
this way, and none is authored.

### 3. A mysterious causal catastrophe

The hero's journey into the past, and their role as the prophecy's source,
rupture causality. **Travelling onward to the future instead of returning home
shatters it further, and that is what brings the catastrophe.**

This is behind-the-scenes guidance for the author only. There are no scientists
in this setting. People have observations, inherited accounts, beliefs and
theories — and **no mason, inscription, narrator, journal entry or omniscient
survivor may deliver a technical account in a scientist's place.**

**Never scientifically explain the mechanism; present observations and
character theories only.** In Chapter 2 that means the rupture's first faint
symptoms are *things the hero sees* and *things villagers believe about them*,
and nothing more. The water loss is one environmental symptom among several,
never a quantified model. Review every line of symptom prose against this
constraint before it ships.

### 4. A word-for-word recitation

The prophecy's core text is fixed. See *Warning scene*.

### 5. The required tragic ending

One ending, already approved and **not reachable in this milestone**: the
returning hero kills their earlier self, then sacrifices their own life to
destroy the Cave of Absolution forever. No cooperative ending, no
both-survive outcome, no walk-home epilogue, no survival, resurrection, hidden
escape, surviving duplicate or sequel portal.

*Milestone 3 consequence:* Chapter 2 must not author anything that makes that
ending harder to reach or softer when it lands — no bond with Lovage that would
make the finale's mallet feel borrowed, no promise to anyone the hero could
return to keep. It must also plant what the finale needs; see *M3
foreshadowing*.

---

## Scope

| In | Out |
| --- | --- |
| `past.cave_path`, `past.spring`, `past.worksite` | every `future.*` room except the arrival |
| **`future.deep_chamber` — arrival only** | Chapter 3's investigation, Rue, Sorrel |
| Lovage, new; Saffra and Fenn extended | the eye injury, the seal, the return crossing |
| P2 (worksite access), P3 (the three settings), P4 (the recitation) | P5, P6, P7 |
| Three minimal Chapter 1 additions | the confrontation and the epilogue |

The shuttered-relief puzzle, crossing 1 and the past-arrival endpoint are
**unchanged**. Chapter 1 as shipped *is* the unchanged history and nothing is
retrofitted into it.

---

## Warning scene — P4, `past.square`

The story's hinge, and the one scene whose shape is approved rather than
proposed. Author it as this **specific sequence**, in this order:

1. **Basil assumes familiarity.** They refer to the prophecy the way you refer
   to something everyone present has known since school — glancingly, as common
   ground, without explaining it.
2. **They are shocked by the villagers' ignorance.** Nobody has heard of it.
   Not a variant of it, not an older version — nothing. The shock is the beat
   the scene turns on, and it is the hero's, not the player's.
3. **They answer the villagers' curiosity.** The villagers become curious and
   ask. The hero explains what it is, where they heard it, what the village
   does with it at midwinter — ordinary answers to ordinary questions.
4. **They recite the prophecy word for word from memory.** That recitation is
   the origin of the prophecy the opening village inherits.

**The recited text is the five canonical lines, verbatim, every time.** No
variants, no selectable clauses, no flags recording wording, no paraphrase, no
abbreviation, no stumbling over a line. The hero knows it extremely well — it
was taught in school and talked about all through their childhood — so there is
no in-fiction reason for it to come out wrong, and a second author would break
the loop the owner chose as the prophecy's origin.

**Choices surround the recitation; they never change it.** Player agency lives
in:

- the surrounding **questions** the hero asks and answers
- the **tone** they take — frightened, careful, defiant, apologetic
- how much they **explain** about where they come from, and to whom
- **who is told the truth**, and whether they try to take it back afterwards
  (`told_fenn_truth`, `tried_to_retract`)

Agency never touches the words. Remove any mechanism that would let it: the
`warning_text_a/b/c` flags from the first draft, the three selectable wording
clauses, and any retroactive rewriting of the opening plank are all deleted and
must not reappear.

**The hero's realisation that they are the source** — *PROPOSED.* Partial here:
one line, as they hear their own voice saying the words to people who are
writing them down. The full weight lands in Chapter 3. Their shock at the
prophecy's absence is approved; instant complete understanding is not.

**Never scientifically explain the mechanism; present observations and
character theories only.** The villagers' reaction is belief and fear, not
analysis. Nobody in the square works out what has just happened to causality,
and the narration does not either.

---

## Cave puzzle — P3, `past.worksite`

The chapter's real prize: the fold answers to a lamp, and its height decides
where you come out.

### The revised fixed destinations

| Height | Destination | State in year −100 |
| --- | --- | --- |
| **low** | **year −100** — the builders' own century | dish cut; tried; recorded as doing nothing |
| **middle** | **the original era, year 0** | **chalk outline on rough rock — no dish, unavailable** |
| **high** | year +100 | dish cut, never tried |

The low setting reaches −100. **The middle setting reaches the hero's original
era, and is unavailable in the past** — the dish for it is the last thing
Lovage's crew will cut, and the lamp must stand in a cut dish to hold the
height. That unavailability is the puzzle's binding constraint and must be
stated plainly and be checkable by the player.

### What the hero can work out, and where the information stops

The crew's craft record says the low height *does nothing* here. The hero
arrived at this worksite by a lamp at that same low height, from year 0. So the
heights are not distances — they are **three fixed places, the same three from
any century** — and **one of the three must be home**. It is not the low one.
The middle one cannot be used.

That leaves **one setting they can light and no way to know whether it is
home.** The reasoning is correct at every step and the information genuinely
runs out there.

### The high-setting gamble

The hero takes the high setting as an **even gamble on sound reasoning**. It is
not a mistake, not a mis-aim, and not something the player is steered into:

- they deduce the right rule from the one arrival and the one record they have
- they correctly conclude home is reachable
- they find the only usable setting is the one they cannot identify
- they light it believing it is as likely to be home as not

The alternative is staying in year −100 for the rest of their life, in a
village that has decided the wrongnesses arrived with them. **Author the weight
of taking the chance, not the sting of having been tricked.**

Every obvious way around the limitation gets an authored answer: improvising a
stand, wedging the lantern, asking Lovage to cut the dish early, and waiting.
The design's P3 table lists all four and their replies. `WAIT` is available,
and the reason it fails is the chapter's complication.

**Never scientifically explain the mechanism; present observations and
character theories only.** The crew's record is a craft log — *where we were,
what we tried, what happened* — with no theory attached, because they have
none. The hero's deduction is about heights and places, never about causality.

---

## Future endpoint

**Milestone 3 ends on arrival.** Crossing 2 lands the hero in
`future.deep_chamber`, and the chapter stops there — a `look`-and-stop endpoint
exactly like the one Chapter 1 ships today.

| In M3 | In M4 |
| --- | --- |
| The arrival room: the buried chamber, the dry basin, the weight of the hill overhead | the fissure out, `future.cave_path`, `future.entrance`, `future.square` |
| Era and chapter transition, autosave, checkpoint | **the eye injury** |
| A closing beat and a stop | the seal, the settlement, Rue and Sorrel, P5 and P6 |

**The eye injury stays in Milestone 4**, following the current design: it
happens at the sealed cave mouth, on the second blow, in the open, from a stone
out of a rockfall that has not happened yet. **It is not in Milestone 3 at
all.** The hero arrives in the future **uninjured**, and the design's Chapter 3
entry state says so.

No exploration. No investigation. No injury. The player arrives, reads the
room, and the milestone is over. **The old claim that Milestone 3 needs no
future-era support is withdrawn** — a chapter that ends on a crossing with
nowhere to land is not playable — but support means one arrival room and
nothing else.

---

## M3 foreshadowing — the worked support pillar

Chapter 2 must plant the finale's pillar, because the finale's only
justification for it is what the hero sees and hears here.

**Lovage warns the hero off it, to their face.** The pillar is new and pale,
freshly cut, and it is the thing he is most careful about:

> *"That is the roof. Not the stone over your head — that. Keep your mallet off
> it."*

One throwaway line in the chapter the player plays before the one where it
matters. It is the reason the returning hero knows where to swing in Chapter 4,
and it replaces the withdrawn claim that they knew because a century of rupture
had loosened it — that century never happens.

### Two different pillars; do not conflate them

| | Which | Where | Status |
| --- | --- | --- | --- |
| **The natural pillar** | a natural rock pillar | `present.outer_gallery` | **Shipped.** The knotted rope from the iron ring at the mouth is tied to it, and Bay keeps that path |
| **The worked pillar** | cut by Lovage's crew to hold the chamber roof | `past.worksite` → `present.sealed_chamber` → struck in Ch4 | **New in M3** |

They are different stones in different rooms. **The rope is never tied to the
one that matters**, and no description should let a player merge them. `CANON.md`
carries this distinction.

In year 0 the worked pillar has a crack at its base and a litter of grit at its
foot — **ordinary settlement, not a portent.** The rupture does not exist
during Chapter 1, so there is nothing for it to be a symptom of. **Never
scientifically explain the mechanism; present observations and character
theories only** — and here there is no mechanism to explain, just old stone
carrying a roof it was never thick enough for.

---

## Engine and persistence work

- **`Era` gains `'future'`**; `LocationId` gains the `future.*` prefixes.
  `eraOf()` and the validator's era/location cross-check key off the prefix, so
  each extends by one case.
- **`Chapter` gains `'future'`.** The chapter/era coherence rules in
  `persistence/validate.ts` need the new pairs: `future` chapter ⟺ `future`
  era, exactly as `crossing` ⟺ `past` works now.
- **`schemaVersion` goes to 2**, because this is when a save can first hold
  `era: 'future'` and the current build would correctly refuse it. The 1 → 2
  migration is trivial — no field changes, every old value still valid — and
  must be **written and tested in this milestone**, not deferred. It is the
  project's first real migration.
- **Legacy save keys are kept.** The `cave-of-absolution:*` namespace stays as
  shipped; a player's existing save must still load.
- **New flags**, roughly twelve: `past_worksite_access`, `read_drawing`,
  `knows_settings`, `recited_prophecy`, `told_fenn_truth`, `tried_to_retract`,
  plus the rupture-symptom flags. Each needs its `FLAG_TYPES` entry.
- **New items:** `water_skins`, `mallet`.
- **New verb:** `RECITE PROPHECY`, narrowly scoped to P4, with a selectable
  form as a *Recite it* action on the conversation topic so both input modes
  can perform it.
- **Puzzle modules** in `engine/puzzles/` beside `shutteredRelief.ts`, same
  `(draft, events) => ResolveResult` shape.

The architectural rules from Milestone 1 hold unchanged: the UI never changes
story flags directly, visibility and validation live in the engine so guessing
a hidden ID cannot bypass discovery, `resolve` stays pure, and both input modes
dispatch the same typed actions.

---

## Chapter 1 additions — minimal

| Change | Why |
| --- | --- |
| Optional `TAKE STONE` in `present.outer_gallery` | Parsie asks for one and there is no way to oblige. Pays off in Ch3's record chest. Optional, gates nothing |
| **The worked pillar** in `present.sealed_chamber`'s description, cracked at the base | The finale needs it visible a chapter early. Unremarked in Ch1. Plain geology, no portent |
| One Tyme topic: *what he does while you are inside* | The epilogue and Rue's inherited role both lean on the bench being his |

**Withdrawn and not to be built:** the numbered gauge in `present.deep_chamber`
and the structured journal data (`data?: Record<string, number>`). Both existed
to serve the quantified water proof that decision 3 removes. Neither was ever
implemented.

---

## Verification

Same bar as Milestones 1 and 2, extended:

- Unit and DOM tests for every new puzzle, flag and verb; the parser's new
  vocabulary; and **the 1 → 2 migration, including a real version-1 save**.
- An equivalence test per puzzle proving the typed and selectable paths reach
  the same state, since both modes must be able to perform every solution.
- A browser check that the chapter is completable end to end, driving the built
  `dist/` through request interception on the synthetic origin — **no listening
  socket**.
- The walkthrough's Chapter 2 critical path, replayed as a regression test.

**Report honestly.** If a test fails, say so with the output. Do not record a
Pass for a chain that was only read, and do not claim gameplay is verified
because documentation was updated.

---

## Out of scope, restated

No backend, accounts, database, paid services, API keys or runtime AI
generation. No publishing, no external repository, no account configuration,
and no pushing — unless separately instructed. No promoting a *PROPOSED* item
into `CANON.md` without the owner saying so.
