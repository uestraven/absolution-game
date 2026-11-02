# Walkthrough and verification notes

**Not for players.** This spoils everything that is built.

## The map

Location ids are era-qualified. `present.` and `past.` are internal prefixes;
the player never sees either word used as an era label.

Location ids are era-qualified. `present.`, `past.` and `future.` are internal
prefixes; the player never sees any of them used as an era label.

```
                present.home
                     | down / north
                present.square ──east── present.workshop
                     | west
                present.cave_path
                     | west
                present.entrance
                     | in / out
                present.outer_gallery ──north── present.echo_chamber
                     | east                       (optional branch)
                present.sealed_chamber
                     | down          (hidden until the puzzle is solved)
                present.deep_chamber
                     ¦
                     ¦  ENTER THRESHOLD — one explicit action
                     v
                past.deep_chamber ──north── past.worksite
                     | up            (gated on past_worksite_access)
                past.entrance                    ¦
                     | east                      ¦  ENTER APERTURE
                past.cave_path ──north── past.spring
                     | east                      v
                past.square                 future.deep_chamber
                                            (end of the built content)
```

Every exit has a reverse route; `src/content/content.test.ts` asserts that, and
that the connection set matches exactly the pairs the tests declare. Two exits
are gated: `present.sealed_chamber:to_deep` on the relief puzzle, and
`past.deep_chamber:to_worksite` on worksite access.

`future.deep_chamber` is deliberately connected to nothing. It is the arrival
room and the boundary of what exists; the tear in its wall is described as the
way out and is not an exit, because the hillside beyond it is Milestone 4.

## Shortest completion

Thirty-six commands, from the character screen. This is the
recitation-first order, which is the shorter of the two: it never needs the
water, so both of the recovery routes into the workings are load-bearing.

```
take lantern              ·  1
down                      ·  2
east                      ·  3
take wedge                ·  4
west                      ·  5
west                      ·  6
west                      ·  7
in                        ·  8
east                      ·  9
use wedge on shutter      · 10
place lantern in alcove   · 11
light lantern             · 12
open seam                 · 13   ← the opening chapter's puzzle is solved here
take lantern              · 14   ← needed for the second crossing
down                      · 15
enter threshold           · 16   ← crossing 1
up                        · 17
east                      · 18
east                      · 19
talk to saffra            · 20
cave                      · 21
whether anything is coming· 22   ← the realisation
why you asked             · 23
recite prophecy           · 24   ← P4
talk to fenn              · 25
how a boy gets past the foreman · 26   ← P2, recovery route
leave                     · 27
west                      · 28
west                      · 29
down                      · 30
north                     · 31   ← into the workings
examine drawing           · 32
examine slate             · 33
examine dishes            · 34   ← P3, the deduction fires here
place lantern in high dish· 35
enter aperture            · 36   ← crossing 2
```

Run verbatim as a test in `src/engine/equivalence.test.ts`, so this list cannot
drift away from the game.

The lantern does not need to be lit to navigate, and neither item needs to be
recovered before going down to the first threshold — but the second crossing
needs a lamp, and a player who left theirs in the alcove borrows one of the
crew's in the workings (`TAKE LAMP`). Nothing in the echo chamber is required,
and nothing optional is.

## The shuttered relief, state by state

Five content pieces:

| Id | Where | Role |
| --- | --- | --- |
| `gallery.relief` | outer gallery | The instruction: a traveller setting a lamp into a squared recess, a pierced eye directly above it, lines fanning up |
| `sealed.shutter` | sealed chamber | Slides up its grooves, falls the moment you let go |
| `sealed.alcove` | sealed chamber | Hidden until the shutter has been raised once |
| `sealed.eye` | sealed chamber | In plain sight from the first visit. A hole light is meant to pass up through |
| `sealed.wall` / `sealed.seam` | sealed chamber | Scale pattern; the seam only exists to the eye under grazing light |

Flags, in dependency order:

1. `relief_examined` — examining the relief.
2. `shutter_tried` — raising the shutter at all. Reveals `sealed.alcove`.
3. `relief_matched` — set the moment the player has both examined the relief and
   discovered the alcove. Adds the journal line that the two shapes match.
4. `shutter_held` — `USE WEDGE ON SHUTTER`. Moves the wedge to the shutter
   fixture. Lifting and holding are one interaction, never a timing exercise.
5. `lantern_in_alcove` — `PLACE LANTERN IN ALCOVE`, requires `shutter_held`.
6. `lantern_lit` — `LIGHT LANTERN`, allowed at any point, in hand or in the alcove.
7. `seam_revealed` — latched by `checkIllumination` when held + placed + lit all
   hold. Reveals `sealed.seam`.
8. `passage_open` — `OPEN SEAM` or `OPEN WALL` once the seam is revealed.
   Latched independently, reveals `sealed.passage`, opens the `to_deep` exit,
   updates the objective.

Steps 4–6 are order-independent. Steps 7 and 8 both latch, so taking the lantern
and the wedge back out cannot undo the discovery.

### Why previous participants missed it

Stated briefly in the descriptions, not in author's notes:

- The alcove is at ankle height and set back beyond arm's reach from the room, so
  it reads as neither a torch bracket nor a cupboard. Oreg found it, looked in it,
  found it empty, and his hands got tired.
- The shutter will not stay up. Oreg's dialogue is where the wedge comes from.
- The scale pattern flattens under any light held in the hand. The seam is only
  a shadow when the light comes from below, through the eye, crossing the wall
  almost edge-on. Dilly's account says the same thing from the other side: she
  kept moving her torch and the relief kept going flatter.

### Distinct failure messages

Four states, four explanations — asserted distinct in
`src/engine/engine.test.ts`:

| Attempt | Feedback |
| --- | --- |
| `OPEN SHUTTER` with no wedge | It goes up, you see the alcove, it runs back down: "it would need something driven in under the bottom edge" |
| `PLACE LANTERN IN ALCOVE` with the shutter down | "The shutter has to be held open by something that is not you" |
| Lantern placed but unlit | "The alcove now holds an unlit lantern in the dark, which is exactly as useful as it sounds" |
| All three conditions met | The seam appears, with a journal entry |

Other experiments that fail usefully: the wedge against anything with no gap;
the lantern held up against anything; `OPEN WALL` before the seam exists;
putting the wedge in the alcove (which would also drop the shutter).

### Hints

Three steps, identical text in both modes, driven by `flags.hint_stage` plus
`flags.hint_context` so the ladder restarts when the player moves on.

1. Points at the relief (or back to it, if already examined).
2. Explains the relief's relationship to the alcove and the eye.
3. The full ordered solution, listing only the steps not yet done.

There are separate three-step ladders for preparation, the threshold and the
past, so `HINT` is never useless.

## The crossing

`present.deep_chamber` describes an unnatural depth and an audible change
without naming time travel. Examining the threshold expands on both. Crossing
requires `CROSS_THRESHOLD`, produced only by `ENTER THRESHOLD` and its
synonyms, or by the threshold's "Step into it" button. Looking, examining,
walking in and out of the room, and every other action leave `flags.crossed`
unset.

The transition is one state change: era, chapter, location, objective, journal
and flag all move together, and `App` writes the result as a single autosave plus
a new chapter checkpoint. A reload can never land half-crossed.

In the past the basin is a hand deep with two coins and a bone pin in it.
`ENTER THRESHOLD` there gives a plain explanation — the water is water and
whatever carried you down is not there — rather than a silent refusal.

## Dilly's rescue, in one version

The owner found this told two ways. There is one version now, and
`content/content.test.ts` asserts all three places agree:

**Two people went in. One of them was Tyme. They found her sitting down with
her back to a wall and her hands up her sleeves.** She did not walk out on her
own, and there were never four men, and there was no dog — the four-men-and-a-dog
version is the square's, and Dilly resents it.

Tyme's bench topic used to have her come round the corner by herself while he
was still putting a boot into the dark. It now says only that twice in his life
he has not sat on that bench and one of those was Dilly, which leaves the
account itself to his `dilly` topic.

## The realisation

Changed landmarks, each with its own description: intact tool-work with a chalk
setting-out line, a squared hand-cut mouth with no bench, no iron ring and no
lintel inscription, cart ruts and a standing tree with a swing on the track, a
new well with an unworn cap, a roofless half-built wall on the joiner's exact
footprint.

The beat fires when `heard_no_prophecy` is set in `past.square` — Saffra's
"whether anything is coming" topic, which needs her "the cave on the hill" topic
heard first. She knows the cave perfectly well: Lovage and his sons are cutting
the stair down to the water, third season on it, and young ones walk in on a
dare. Only the Wanderer prophecy is missing, so no established tradition is
accidentally erased.

This used to be where the prototype stopped. It is now the hinge: the objective
becomes *Find the way back to your own village*, the conversation stays open,
and the beat is latched on its journal entry (`j.another_time`) rather than on
`ended`, so a legacy save that has already read it does not read it twice.

## Chapter 2, state by state

### P2 — worksite access

`past_worksite_access` is one flag, latching, reachable three independent ways.
Nothing revokes it once set.

| Route | How | Flag | Available |
| --- | --- | --- | --- |
| **Water** | `TAKE SKINS` in the square, `FILL SKINS` at the spring, `GIVE SKINS TO LOVAGE` at the mouth | `carried_water` | Until the recitation |
| **Fenn's gap** | `TALK TO FENN` → *how a boy gets past the foreman* | `fenn_route` | On `recited_prophecy` **or** `knows_water_needed` |
| **Saffra's escort** | `TALK TO SAFFRA` → *asking her to walk up with you* | `saffra_escort` | On `recited_prophecy` |

Both recovery routes are available from required-path state alone: a player who
never heard Saffra's optional topic about Lovage still gets both. The water
route closes after the recitation, and it closes by telling the player so —
Lovage refuses the water in front of them, the skins are not taken, and the
flag is not set.

Until access is earned, `to_worksite` does not exist as an exit, so guessing the
id in either mode is refused exactly as a wall would be. Trying to go north
anyway gets an authored refusal rather than *you cannot go that way*, because
the spoil heap and the opening behind it are openly described — unlike the
sealed chamber's hidden passage, which keeps the identical blank refusal so that
probing cannot reveal it.

### P4 — the recitation

A fixed four-step scene, in this order and no other:

1. The hero mentions the prophecy assuming it is common ground (Saffra's
   *whether anything is coming* topic, which sets `heard_no_prophecy`).
2. Nobody recognises it. The hero is shocked. This is the realisation above.
3. They are asked what the words are (*why you asked* → `asked_for_words`).
4. `RECITE PROPHECY`, which the player chooses, sets `recited_prophecy`.

The text comes from `src/content/prophecy.ts`, which is also where the plank in
`present.square` gets it, because the plank's words come from this moment. There
are no wording variants, no selectable clauses and no flag recording what was
said. Agency is in the tone taken, how much is explained, who is told the truth
(`told_fenn_truth`) and whether the hero tries to take it back
(`tried_to_retract`).

`RECITE` is refused with a stated reason before step 3, and anywhere but the
square. Walking away sets `declined_recital`, narrates it, and closes nothing:
the action is computed from state, so it is still offered on the next visit in
both modes. Nothing else in the game ever says the words on the player's behalf.

The recitation also sets `lovage_distrust` and fires the first wrongness.

### P3 — the three heights

**Implementation rule, never stated to the player.** Three fixed destinations,
not three offsets, and the same three from any era:

| Height | Reaches |
| --- | --- |
| low | year −100, the builders' own century |
| middle | year 0, the era the hero grew up in |
| high | year +100 |

So the first crossing is year 0 → −100 on the low setting, this one is
−100 → +100 on the high setting, and the eventual return is +100 → year 0 on the
middle one. No arithmetic on a current year appears anywhere in the code; the
table in `src/engine/puzzles/worksite.ts` is the whole of it.

What the hero actually gets is three pieces of evidence — the drawing
(`read_drawing`), the crew's slate (`read_crew_notes`) and the dishes
(`examined_dishes`) — and when all three are in, in any order, `knows_settings`
fires with the hero's reasoning.

**That reasoning is a working conclusion, and the prose keeps it one.** All they
have is one arrival of their own and one sentence on somebody else's slate, and
they say so: *one arrival, and one man's sentence about another man.* The low
height did nothing for Caraway and everything for them, so *perhaps* the heights
are places rather than distances — it is the only thing they can think of that
accounts for both, and they tell themselves plainly that it is a guess, and that
fitting is not the same as being so. Everything after it is conditional: *if you
have it right*, one of the three is home, it is not the low one, and the middle
one has no dish. The journal entry records it the same way.

That leaves one setting they can light, and no way to check any of it without
using it. **A reasoned gamble on thin evidence, not a mistake and not an
arithmetic error** — and the game never confirms the rule to the player, in this
chapter or at the arrival.

| Attempt | Result |
| --- | --- |
| `PLACE LANTERN IN LOW DISH` | Works, answers, and comes out in the same chamber in the same season. Costs nothing, confirms the rule, sets `tried_low_dish` |
| `PLACE LANTERN IN OUTLINE` | Refused on the room's terms: chalk on unworked rock, no seat, no undercut, the lantern rocks on two high points |
| `PLACE LANTERN IN HIGH DISH` | Needs `knows_settings` first, or the hero gets down off the trestle rather than guess |
| `PLACE LANTERN IN DISH` | Asks which position, through the ordinary clarification prompt |
| `ASK LOVAGE TO CUT IT` | *A week with two men, and I would not give you an hour.* Access is unaffected |
| `USE MALLET ON PILLAR` | Refused. The mallet is kept |
| `WAIT` | Authored, anywhere. No clock, nothing consumed, nothing closed |

The three positions are `initiallyVisible: false` and revealed by examining the
dishes, so addressing one before looking at the panel behaves like a nonsense
word in both modes.

### Crossing 2, and the aperture's four refusals

`ENTER APERTURE` produces `CROSS_THRESHOLD` at `past.worksite`. Lighting the
lamp never moves anybody; the crossing is its own explicit action. It refuses
with a different stated reason at each missing step: the square still unanswered
(`recited_prophecy`), the panel not understood (`knows_settings`), nothing
standing in the dish (`lantern_in_high_dish`), or the wick cold
(`lantern_lit`).

The first of those is itself three refusals, because worksite access does not
run through Saffra and a player can arrive at this panel in any of three states:

| State | What the hero is refusing over |
| --- | --- |
| `asked_for_words` | They were asked a straight question and are walking away holding the answer |
| `heard_no_prophecy` only | They found out the words are not here yet and let the conversation move on to trowels |
| neither | They never raised it at all, having assumed — and they do not actually know whether these people keep it |

All three are distinct and all three send the player back down the hill;
`engine/chapter2.test.ts` reaches the panel in each state and asserts the
wording is the right one.

### The wrongnesses

Three authored observations, each fired once by a stated trigger, each latched
on a flag so a reload cannot replay it. **None of them is explained**, by
anything: there is no narrator account, no diagnostic inscription and no
character who works it out. Lovage says outright that he has no idea and would
not believe a man who said he did.

| Flag | Trigger | What |
| --- | --- | --- |
| `symptom_sound` | the recitation itself | A door shuts in the wind, and then the wind arrives |
| `symptom_mark` | arriving in `past.worksite` or `past.deep_chamber` afterwards | Two chalk lines a hand apart, in the same hand |
| `symptom_weather` | arriving on `past.cave_path` or `past.spring` afterwards | Rain that un-happens, drying inward from both ends |

Nothing fires before the recitation, and nothing fires in the opening era at
all.

## The endpoint

`future.deep_chamber`. The transition is one commit: era, chapter, location, the
lamp coming out of the dish and into the hero's hands, objective, journal, the
end-of-content marker and the chapter checkpoint all move together, so no reload
can land half-crossed and no reload can fire the arrival twice.

Three things to examine — the dry cracked basin, the stair closed by a fall, the
tear in the wall with daylight in it — and no exits, because there is nowhere
built to go. The room states the Milestone 4 boundary without opening it: the
tear is the way out, the stair toward the portal chamber is closed, and the
village's seal is not something the player has already walked through.

The hero arrives **uninjured**. There is no eye injury here, no identity reveal,
no settlement, and no usable return setting. The marker says *End of the current
content* and then *This is not the ending*, and the objective reads *Find out
what happened here* rather than anything that sounds like a conclusion.

After it the player keeps full control: look around, read the journal, export,
or restart from the checkpoint — which is now the arrival in the broken chamber,
because the chapter advanced at the crossing.

## Everything worth seeing

Full route for content review, in `src/engine/equivalence.test.ts` as the typed
end-to-end test. It visits all sixteen locations, hears every person, and
asserts that no command in the run was rejected.

| Location | Objects | People |
| --- | --- | --- |
| `present.home` | lantern, cloth tag (hidden until the lantern is examined), window, bread | — |
| `present.square` | chalked plank, strung lanterns, bowl of salt, well | Sage, Marjoram, Parsie |
| `present.workshop` | offcut basket, wedge, bench | Oreg |
| `present.cave_path` | old stump, chalk marks | Dilly, Tyme |
| `present.entrance` | knotted rope, lintel, bench | — |
| `present.outer_gallery` | scratches, relief, pillar, old ash | — |
| `present.echo_chamber` | scratched account, boot, standing water | — |
| `present.sealed_chamber` | shutter, alcove*, eye, patterned wall, seam*, passage* | — |
| `present.deep_chamber` | threshold, cut steps | — |
| `present.sealed_chamber` *(addition)* | worked pillar, cracked at the base | — |
| `present.outer_gallery` *(addition)* | drift of loose stones (takeable) | — |
| `past.deep_chamber` | basin, fresh tool-work, spoil heap, chalk line | — |
| `past.entrance` | cave mouth, the village below, the crew's kit | Lovage |
| `past.cave_path` | great tree, cart ruts | — |
| `past.spring` | the spring | — |
| `past.square` | great tree, unfinished building, new well, water skins | Saffra, Fenn |
| `past.worksite` | drawing, slate, cut dishes, low dish*, high dish*, chalk outline*, aperture, worked pillar, crew lamp, mallet | — |
| `future.deep_chamber` | dry basin, blocked stair, tear in the rock | — |

`*` starts undiscovered.

### Items

| Item | First available | Needed for |
| --- | --- | --- |
| `lantern` | `present.home` windowsill | Both crossings. Recoverable from the alcove, the high dish, or the crew's ledge |
| `wedge` | `present.workshop` basket | The relief puzzle only |
| `stone` | `present.outer_gallery` drift | Optional. `GIVE STONE TO PARSIE` is the whole of its payoff |
| `water_skins` | `past.square` wall | The water route into the workings. Optional |
| `mallet` | `past.worksite` chisel basket | Nothing yet. Carried forward for Milestone 4, which has a substitute if it was left |

## Automated coverage

287 tests across eleven files.

| File | Covers |
| --- | --- |
| `engine/parser.test.ts` | Synonyms, case, punctuation, articles, directions, the crossing phrasings, topic numbers and names, disambiguation answers, cancel, every unparsed reason |
| `engine/engine.test.ts` | Hidden-object access (typed *and* dispatched directly), identical refusal for hidden exits, ambiguity, the four distinct puzzle failures, order independence, latching, item recovery, optional branch, the crossing, the endpoint, journal contents, the hint ladder, useless-input invariants |
| `engine/equivalence.test.ts` | Step-for-step state equality between typed and clicked play, through both chapters to the arrival; one full completion per input mode visiting all sixteen locations; the thirty-six-command route above, run verbatim; completion after crossing with both items left behind, via the crew's lamp; recovering a dropped item with buttons only and finishing afterwards; selectable labels giving nothing away; undiscovered things absent from the panel |
| `engine/chapter2.test.ts` | The recitation (canonical text identical to the plank, refused before the villagers ask and outside the square, fires once, declining costs nothing, never spoken on the player's behalf, reloads before/during/after); worksite access by all three routes and in both orders, with the recovery routes reachable from required-path state alone; the three heights as fixed destinations, the low position's harmless round trip, the uncut middle refused on physical terms, the high gamble; the aperture's four refusals; wrong attempts and waiting consuming nothing; hints free and repeatable; the wrongnesses fired once each and never explained; the arrival as one commit, not duplicated on reload, with no injury, reveal, exploration or return; the opening chapter unaffected and completable without any of the new optional content |
| `persistence/migration.test.ts` | Format 1 → 2: a mid-opening save keeping every field, a save stopped at the old prototype marker becoming playable in place, the historical transcript kept and corrected rather than contradicted, idempotency through both formats, no wholesale clearing of completion flags, the migration running on the autosave, backup, checkpoint and import routes, newer and never-shipped formats refused clearly, and format 2 written back out once played on |
| `content/content.test.ts` | Dialogue discipline (a length and single-paragraph budget per answer, the rescue told one way everywhere, a named list of removed over-explanations that must not come back, follow-up detail actually gated behind a follow-up); map matches the brief, era/id agreement, reverse routes, unique ids and directions, only the deep exit gated, flag and reveal references valid, journal id consistency, no placeholder prose, no later reveals in player-facing text, the herb naming convention (every name on the list, ids matching names, no survivors of the earlier cast, no puns, the twins never explained, and no time vocabulary anywhere in Tyme's dialogue) |
| `content/characters.test.ts` | Both names and pronoun sets, pronoun substitution in NPC lines, identical progress for either character, no unrendered placeholders anywhere |
| `persistence/persistence.test.ts` | Round trip, export/import, reload mid-puzzle, resuming pending conversations and questions, atomic crossing, backup and checkpoint fallbacks, quarantine, storage-failure reporting, loading and exporting while writes are impossible, preferences kept apart from progress, 27 rejected-import cases, transcript sanitising |
| `ui/app.dom.test.tsx` | Title screen states, both modes end to end in the DOM, mode switching preserving state and transcript, option lists per mode, live region carrying only new output, focus not stolen |
| `engine/regressions.test.ts` | The Milestone 1 defect list, extended: every one of the five items recoverable in both modes, after a round trip and across a reload; no item strandable by either crossing in any arrangement; the crew's lamp as the authored recovery when the hero's own is a century away, and hidden when it is not; a corrupt autosave never costing the backup; unclaimed quarantine and checkpoint failures reported truthfully; read-without-write storage; old saves and old names loading; and no two exits in a room answering to the same word |
| `ui/strictmode.dom.test.tsx` | One commit per action under StrictMode: one transcript echo, one save write, at most one backup rotation, and rapid commands keeping order against fresh state |

## Manual and browser verification

`scripts/verify-browser.mjs` drives the built bundle in Chromium (see the README
for how to run it). Last run: **66 of 66 checks passed.**

**Layout and input.** 360px with no horizontal scrolling, before and during play
· touch targets at least 40px tall · buttons alone move the story · the
transcript owns most of the window and is the scroller · it follows new output ·
no console or page errors in either mode · New Game reachable by tabbing ·
command field focused on arrival · reduced motion collapses transitions and
replaces the glide with a jump · Settings is a real modal: focus moves inside,
Tab and Shift+Tab stay inside, Escape closes and returns focus.

**Both chapters, both modes.** The whole of both chapters completed with the
keyboard alone, ending in the broken chamber · the recitation saying the
canonical text · the end-of-current-content marker shown, and not claiming to be
the ending · objective updated · inspection still possible afterwards · the
whole of both chapters completed by clicking with no typing at all, including
the first crossing, the recitation offered as an action, Fenn's route opening the
workings, and the arrival · the arrival room offering no way on · no console
errors across the clicked run.

**Mode switching.** Switching to buttons mid-puzzle keeps the puzzle state ·
switching to typing mid-conversation keeps the topic list readable · a
conversation started by clicking can be finished by typing.

**Saves.** Continue after reload restores place and transcript · mode switch
preserves every stored transcript entry and the player's position · export
downloads `adventure-save.json` containing the current state in format 2 · that
file imports back · a malformed file is refused and the game is untouched · New
Game confirms before overwriting and cancelling keeps progress · checkpoint
restart returns to the start of the current chapter — the bedroom mid-rite, the
broken chamber after the second crossing · storage failure shows a persistent
warning and play continues.

**A save from the old build.** A format-1 file written at the old
end-of-prototype marker is offered as Continue · resumes in place without
replaying the opening · the transcript the player read is still there · and is
corrected rather than contradicted · the objective points at the rest of the
chapter · it plays on into content that did not exist when it was written · and
is written back out in the current format.

**Visual specification.** Exact palette values (`#080A0C` / `#DEDFDA` /
`#EB8FD8` / `#79DCE8` / `#A3DB96`) · monospace at 16px mobile and 18px desktop
with 1.6 line height · the reading column never exceeding 70 characters at 390px
and sitting at about 70 characters, centred, at 1280px · colour on roughly 2% of
the transcript · annotation syntax never shown to the player · nothing
undiscovered tinted · a completed objective carrying a class as well as a colour
· no background images, text shadows, box shadows or animation anywhere in the
document beyond the single-shot anchor nudge.

### Known limitations

- Visual judgement came from Chromium screenshots at 360px and 900px, not from
  real handsets, and not from Safari or Firefox. The layout uses only widely
  supported CSS (`dvh` with a `vh` fallback, `env(safe-area-inset-*)`,
  `color-mix`); `color-mix` is the newest of these and only affects hover
  shading.
- Screen-reader behaviour is implemented to spec and asserted structurally
  (roles, labels, a live region holding only the newest output) but has not been
  tested with an actual screen reader.
- The browser pass needs `npx playwright install chromium`. Playwright is
  deliberately not a project dependency.
- No deployment has been performed. The Cloudflare Pages settings in
  `docs/DEPLOYMENT.md` were read from current Cloudflare documentation, not
  confirmed by deploying.
- **Milestones 4 and 5 are not built.** The future settlement, Rue and Sorrel's
  investigation, breaking the seal, the eye injury, the return crossing, the
  confrontation and the epilogue are all design only. `docs/FULL_GAME_DESIGN.md`
  describes them; nothing in this build implements or tests any of them, and
  reaching the broken chamber is not an ending.
