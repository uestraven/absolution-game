# Walkthrough and verification notes

**Not for players.** This spoils the whole prototype.

## The map

Location ids are era-qualified. `present.` and `past.` are internal prefixes;
the player never sees either word used as an era label.

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
                past.deep_chamber
                     | up
                past.entrance
                     | east
                past.square         (end of the prototype)
```

Every exit has a reverse route; `src/content/content.test.ts` asserts that, and
that the connection set matches exactly the pairs in the brief. The only gated
exit in the game is `present.sealed_chamber:to_deep`.

## Shortest completion

Twenty commands, from the character screen:

```
take lantern
down
east
take wedge
west
west
west
in
east
use wedge on shutter
place lantern in alcove
light lantern
open seam
down
enter threshold
up
east
talk to sabra
cave
whether anything is coming
```

The lantern does not need to be lit to navigate, and the items do not need to be
recovered before going down. Nothing in the echo chamber is required.

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
  it reads as neither a torch bracket nor a cupboard. Tolv found it, looked in it,
  found it empty, and his hands got tired.
- The shutter will not stay up. Tolv's dialogue is where the wedge comes from.
- The scale pattern flattens under any light held in the hand. The seam is only
  a shadow when the light comes from below, through the eye, crossing the wall
  almost edge-on. Nessa's account says the same thing from the other side: she
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

## The endpoint

Changed landmarks, each with its own description: intact tool-work with a chalk
setting-out line, a squared hand-cut mouth with no bench, no iron ring and no
lintel inscription, a new well with an unworn cap, a roofless half-built wall on
the joiner's exact footprint, and a living tree where the stump is.

The prototype ends when `heard_no_prophecy` is set in `past.square` — Sabra's
"whether anything is coming" topic, which needs her "the cave on the hill" topic
heard first. She knows the cave perfectly well: Lonn and his sons are cutting
the stair down to the water, third season on it, and young ones walk in on a
dare. Only the Wanderer prophecy is missing, so no established tradition is
accidentally erased.

The hero asks; the hero does not warn. Nothing in this build implements the
warning, the eye injury, the ruined future or the confrontation.

After the ending the player keeps full control: look around, read the journal,
or restart from the checkpoint. The objective reads *End of the opening chapter.*

## Everything worth seeing

Full route for content review, in `src/engine/equivalence.test.ts` as the typed
end-to-end test. It visits all twelve locations, hears every person, and asserts
that no command in the run was rejected.

| Location | Objects | People |
| --- | --- | --- |
| `present.home` | lantern, cloth tag (hidden until the lantern is examined), window, bread | — |
| `present.square` | chalked plank, strung lanterns, bowl of salt, well | Orla, Marda, Hesk |
| `present.workshop` | offcut basket, wedge, bench | Tolv |
| `present.cave_path` | old stump, chalk marks | Nessa, Aldren |
| `present.entrance` | knotted rope, lintel, bench | — |
| `present.outer_gallery` | scratches, relief, pillar, old ash | — |
| `present.echo_chamber` | scratched account, boot, standing water | — |
| `present.sealed_chamber` | shutter, alcove*, eye, patterned wall, seam*, passage* | — |
| `present.deep_chamber` | threshold, cut steps | — |
| `past.deep_chamber` | basin, fresh tool-work | — |
| `past.entrance` | cave mouth, the village below | — |
| `past.square` | great tree, unfinished building, new well | Sabra, Pell |

`*` starts undiscovered.

## Automated coverage

147 tests across seven files.

| File | Covers |
| --- | --- |
| `engine/parser.test.ts` | Synonyms, case, punctuation, articles, directions, the crossing phrasings, topic numbers and names, disambiguation answers, cancel, every unparsed reason |
| `engine/engine.test.ts` | Hidden-object access (typed *and* dispatched directly), identical refusal for hidden exits, ambiguity, the four distinct puzzle failures, order independence, latching, item recovery, optional branch, the crossing, the endpoint, journal contents, the hint ladder, useless-input invariants |
| `engine/equivalence.test.ts` | Step-for-step state equality between typed and clicked play; one end-to-end completion per input mode; the twenty-command route above, run verbatim; completion after crossing with both items left behind; selectable labels giving nothing away; undiscovered things absent from the panel |
| `content/content.test.ts` | Map matches the brief, era/id agreement, reverse routes, unique ids and directions, only the deep exit gated, flag and reveal references valid, journal id consistency, no placeholder prose, no later reveals in player-facing text |
| `content/characters.test.ts` | Both names and pronoun sets, pronoun substitution in NPC lines, identical progress for either character, no unrendered placeholders anywhere |
| `persistence/persistence.test.ts` | Round trip, export/import, reload mid-puzzle, resuming pending conversations and questions, atomic crossing, backup and checkpoint fallbacks, quarantine, storage-failure reporting, preferences kept apart from progress, 22 rejected-import cases, transcript sanitising |
| `ui/app.dom.test.tsx` | Title screen states, both modes end to end in the DOM, mode switching preserving state and transcript, option lists per mode, live region carrying only new output, focus not stolen |

## Manual and browser verification

`scripts/verify-browser.mjs` drives the built bundle in Chromium (see the README
for how to run it). Last run: **26 of 26 checks passed.**

360px with no horizontal scrolling, before and during play · touch targets at
least 40px tall · buttons alone move the story · the transcript is the scroller
and follows new output · reading history is not yanked back to the bottom · no
console or page errors in either mode · New Game reachable by tabbing · command
field focused on arrival · the whole chapter completed with the keyboard alone ·
objective updated at the end · inspection still possible after the ending · era
palette applied · Continue after reload restores place and transcript · mode
switch preserves all 78 stored transcript entries and the player's position ·
export downloads `adventure-save.json` containing the finished state · that file
imports back · a malformed file is refused and the game is untouched · New Game
confirms before overwriting and cancelling keeps progress · checkpoint restart
returns to the start of the current chapter (and to the bedroom mid-rite) ·
storage failure shows a persistent warning and play continues · reduced motion
collapses transitions.

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
