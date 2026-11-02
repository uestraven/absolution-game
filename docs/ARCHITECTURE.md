# Architecture

## Layers

```
content/      authored data and prose          (knows about engine types only)
engine/       pure game logic                  (knows about content; no React, no DOM)
persistence/  localStorage + save validation   (knows about engine + content ids)
ui/           React                            (knows about everything; owns nothing)
```

The engine never imports from `ui/`. The UI never writes to game state except
through `resolve`.

## The one entry point

```ts
resolve(state: GameState, action: GameAction): {
  state: GameState;          // next state, transcript already appended
  events: NarrativeEvent[];  // what this action produced
  accepted: boolean;         // false when the action was refused
}
```

`resolve` deep-clones its input and never mutates it, so the same state can be
dispatched against repeatedly — which is how the equivalence tests compare typed
and clicked play step for step.

Two rules follow from this and are the reason the design holds together:

- **Both input modes speak only `GameAction`.** The parser turns text into one;
  `getAffordances` builds them for buttons. Neither can express anything the
  other cannot.
- **Validation lives in the engine, not the UI.** Noun resolution only ever
  considers things in `state.discovered`, so a guessed object id — typed, or
  dispatched directly as `{ type: 'EXAMINE', target: 'sealed.alcove' }` — is
  refused exactly like a nonsense word. Hidden exits give the same refusal as
  a wrong direction, so probing cannot reveal one. Both are asserted by test.

The one exception is `echoCommand`, which appends a `command` transcript entry
so the UI can show what the player typed or clicked. It touches nothing else:
no flags, no inventory, no turn counter.

## State

Everything in `GameState` is JSON-serialisable: no functions, class instances,
`Map`s or `Date`s. The whole state round-trips through `localStorage` and
through export files.

| Field | Purpose |
| --- | --- |
| `schemaVersion`, `contentVersion` | Save-format and content identity |
| `character`, `chapter`, `era`, `locationId` | Where and who. `era` must always agree with the `locationId` prefix; `eraOf()` is the single source of that truth and validation rejects disagreement |
| `inventory`, `placements` | What is carried, and where every portable item actually is (`carried` / `room` / `fixture`). Validation rejects a save where the two disagree |
| `discovered` | Ids of objects, people and heard topics the player has actually noticed. The engine's visibility gate |
| `flags` | Primitives only, keys declared in `content/flags.ts`. Unknown keys are rejected on import |
| `journal` | Established observations, deduplicated by id |
| `transcript` | Bounded display history (240 entries) |
| `visited` | For first-visit prose |
| `objective` | Current objective text |
| `pending` | A conversation or a disambiguation question, in serialisable form, so a reload can resume the exact choice |
| `turn`, `seq`, `ended` | Counters and the end-of-content marker |

Heard conversation topics are recorded twice on purpose: in
`pending.heard` for the current conversation, and permanently in `discovered` as
`topic.<person>.<topic>`, so a topic can depend on something heard in an earlier
conversation.

## Content

Authored data is plain objects with functions for text, so descriptions can
reflect state (`listAs`, `description`, `subtitle`, `verbs` all take state).
Effects are declarative:

```ts
onExamine: {
  flags:   { relief_examined: true },
  reveals: ['sealed.seam'],
  journal: [{ id: 'j.relief', text: '…' }],
}
```

`content/content.test.ts` checks every `reveals` target exists, every flag key is
declared, and that a journal id always carries the same text wherever it is
authored.

Objects marked `acceptsItems: true` are the plausible places the selectable UI
offers to try an item. The set deliberately includes wrong-but-reasonable
targets, so the buttons are not solution-shaped — and each wrong target has a
real explanation rather than a shrug.

## Parser

A fixed verb table with authored synonyms. It imports nothing from `content/`:
the caller passes in the currently-offered conversation topics and
disambiguation labels, which is what lets bare numbers resolve. Unrecognised
input becomes `{ type: 'UNPARSED', raw, reason }` and the reducer renders the
reason. No LLM, and no promise of unrestricted natural language.

## Persistence

Four namespaced keys plus preferences:

| Key | Contents |
| --- | --- |
| `cave-of-absolution:save` | Autosave, rewritten after every action |
| `cave-of-absolution:backup` | The previous autosave |
| `cave-of-absolution:checkpoint` | State at the start of the current chapter |
| `cave-of-absolution:quarantine` | Raw bytes of a save that failed to load |
| `cave-of-absolution:prefs` | Input mode and text size — stored apart from progress, so clearing progress or switching mode never disturbs the other |
| `cave-of-absolution:reading` | `{id, offset, seq}`: the transcript entry the reader was looking at, where it sat, and the `seq` of the save it came from. The stamp is load-bearing — ids are reused across playthroughs, so without it a mark naming `t3` resolves against a different game's `t3`. A UI preference, not progress — never written into a save, never exported, and a stale or missing mark degrades to "the start of the last response". Cleared by `clearProgress`, since a position into a transcript that no longer exists is worse than none |

`loadBest()` tries autosave, then backup, then checkpoint, reporting which one it
used. If bytes exist but none validate, the raw autosave is copied to
`quarantine` and nothing is overwritten — `clearProgress()` deliberately leaves
that key alone.

Writes report success or failure honestly; the UI surfaces a persistent banner
rather than claiming a save that did not happen.

`validateSave` rebuilds the state field by field from an untrusted payload, so
nothing not named there can reach the running game. Transcript entries are
reduced to `{ id, kind, text, heading?, subheading? }` strings, and the UI
renders text as React nodes — never `innerHTML` — so an edited save cannot
inject markup.

### Migrations

`SCHEMA_VERSION` is **4**. Format 1 was the opening-chapter builds; 2 added the
ruined-future era; 3 added `chapter: 'return'`, the original era for the second
time; 4 adds `chapter: 'ending'` and the finale's stage and terminal flags.

`migrate` runs the steps oldest-first and feeds each into the next — a format-1
file that has not been opened since goes through all three — and invents no step
for a version that never shipped. A newer format is refused by name and an
unknown one as unreadable.

Each step only *widens* `era`, `chapter` and `locationId`, and adds items and
flags. No field has ever been removed or retyped, so every migration is a value
fix-up, and each has one thing to fix: **a save marked `ended` at the boundary
that build stopped at.**

| Step | Fixes | Sets |
| --- | --- | --- |
| 1 → 2 | `ended` in `past.square` with the flag the old ending required | `ended: false`, the objective the rest of Chapter 2 answers, one appended transcript line |
| 2 → 3 | `ended` in `future.deep_chamber` with `crossed_forward` | `ended: false`, the objective the rest of Chapter 3 answers, one appended transcript line |
| 3 → 4 | `chapter: 'return'` | `ended: false` and the finale's objective if it was `ended`; **and the mallet in hand** if it is missing |

The version is the right hook for these precisely because the state shape did
not change: `ended` at an old boundary is indistinguishable from a legitimate
current state by inspection alone, so the rule is "the previous format said the
story stopped here, this one says it does not", and it runs once per file on the
way in. Each notice is keyed on a fixed transcript id so it cannot land twice.

**The mallet step** is the only migration that has ever added an item, and it is
narrow on purpose. The build that wrote format 3 let the hero come back through
the wall without the one tool the ending needs. So: it fires only for
`chapter: 'return'`, a state only that build's boundary produced; it *moves* an
existing placement rather than copying one, so nothing is duplicated; it creates
a record only when the save never had one; and it says so in the transcript
rather than letting an item appear from nowhere. A current game that put the
mallet down is untouched — it is a room item and can be picked back up.

Two properties every step holds to, all tested in
`persistence/migration.test.ts`:

- **Only eligible saves.** Each fix-up is conditioned on the location, the
  chapter, and the flags that state could only have been reached with. No other
  completion flag is cleared; nothing is reset wholesale; a save marked complete
  anywhere the story does not end is refused as an edited file rather than
  repaired.
- **Idempotent.** After each fix-up the condition no longer holds, so running it
  again is a no-op — including the worst case of a migrated save being
  re-presented in the older format.

## UI

| Component | Role |
| --- | --- |
| `App` | Owns state, persistence, preferences and screen routing. The only place `resolve` is called |
| `Transcript` | Scrolling log. Positions on the **start** of each action's complete output — one move per action, tracked by an `actionCount` the shell bumps once per committed action — skipping the echo of the player's own command. Holds the reader's place on re-renders that are not actions, restoring the anchored entry when switching input mode changes what is rendered. Opens a new game at the top; opens a restored one at the stored reading position, or at the start of its last response, never at the end. A **replaced** history (import, checkpoint restart) is declared by the shell's `historyEpoch`, never deduced from entry ids — ids are `t<seq>` and `seq` restarts every game, so an imported history usually contains the ids it replaced. `role="log"` with `aria-live="off"`, because the shell has a dedicated announcer and two live regions read every response twice. Hides `options` entries in selectable mode, where the same choices are buttons |
| `cascade.ts` | Where the transcript looks and how it gets there. **`decidePosition` is the whole policy as a pure function**, returning `top` / `entry` / `response` / `hold` — separated from the measuring so the policy is testable without a layout engine, since jsdom reports every dimension as zero and cannot tell one outcome from another. Underneath: `responseStart` finds the first *substantive* rendered entry of a response; `lastResponseStart` finds the start of the last response in a transcript nobody watched arrive; `responseTarget` reveals a response entire if it fits and otherwise puts its first line a 16px gap below the top edge; `sampleAnchor`/`restoreAnchor` hold a reading position across a re-render that is not an action. The move is `requestAnimationFrame` interpolation of `scrollTop` on a cubic ease-out, 320–720 ms scaled by distance, travel bounded to three quarters of a screen. Cancels on reader input, jumps on first paint, becomes a jump under `prefers-reduced-motion`, and never calls `focus()` or `scrollIntoView` |
| `TypeInput` | Labelled command field, command history on Up/Down. Focuses once on mount, never again |
| `SelectPanel` | Renders the engine's affordance list as one row of categories (Go / People / Things) opening one at a time. Holds only transient menu state: the open category, the open thing, and which item is mid-"use on…". Chips show a shortened label and keep the full one as their accessible name |
| `SettingsDialog` | Input mode, text size, saves, checkpoint restart |
| `RichText` | Paragraphs, `*emphasis*`, and all colour — as React nodes |

## Where new content goes

The puzzle-specific code has been lifted out of the reducer:

| File | Holds |
| --- | --- |
| `engine/mechanics.ts` | Shared state helpers — `clone`, `discover`, `addJournal`, `commit`, `setObjective`, item movement. Knows about no particular puzzle, room or item |
| `engine/puzzles/shutteredRelief.ts` | Chapter 1's puzzle, including its prose |
| `engine/puzzles/water.ts` | Worksite access by carrying the crew their water, and the authored refusal once that route closes |
| `engine/puzzles/recitation.ts` | The fixed scene in the square: when it can happen, what declining costs, and the one commit that lands it |
| `engine/puzzles/worksite.ts` | The three lamp positions — including the destination table, which is the only place the mapping lives — and the second crossing |
| `engine/puzzles/rupture.ts` | The authored wrongnesses, their triggers, and nothing that explains any of them |
| `engine/puzzles/evidence.ts` | The four sources, which are missing, and the hero's inference |
| `engine/puzzles/futureSeal.ts` | Breaking back into the hill, and the one authored injury |
| `engine/puzzles/futureReturn.ts` | The middle position, and the crossing home |
| `engine/puzzles/confrontation.ts` | The finale's stage table — the authoritative copy — and the killing |
| `engine/puzzles/sacrifice.ts` | The pillar, the commitment, the ending, and what a finished save will accept |
| `engine/reducer.ts` | The action pipeline, noun resolution and the generic verbs |

The destination table deserves a note, because it is the thing most likely to be
re-derived wrongly. The three lamp heights address **three fixed destinations**,
not three offsets from wherever the lamp is standing: low is year −100, middle is
year 0, high is year +100, and they are the same three places from any era. The
first crossing runs year 0 → −100 on the low setting and the second runs
−100 → +100 on the high one, so neither of them is "a century forward". There is
no arithmetic on a current year anywhere in the code, and there should not be.

Adding to the game:

- **A room.** One entry in `content/locations.ts` with its exits, plus its
  objects in `content/objects.ts`. Nothing else needs to change; `enterLocation`
  discovers whatever is `initiallyVisible`.
- **An era.** A new `LocationId` prefix, the matching `Era` value, and a case in
  `eraOf`. Validation already cross-checks `era` against the location prefix,
  so a new era is covered by the existing coherence checks — and `chaptersForEra`
  is the single place the chapter/era pairing is declared, so adding a case
  there covers both directions of that check too. The pairing is **one era to
  many chapters**: the original era is both the opening and the return. A save that could not have
  been written by the previous build needs `SCHEMA_VERSION` bumped and a
  migration step written and tested in the same pass, not deferred.
- **A puzzle.** A new module beside `shutteredRelief.ts`, exporting handlers of
  the same `(draft, events) => ResolveResult` shape, wired in from the relevant
  `case` in the reducer's `doOpen` / `doUse` / `doPlace`. Its flags go in
  `content/flags.ts` with their types in `FLAG_TYPES`.
- **A verb.** A member of the `GameAction` union, a `case` in `dispatch`, a
  `case` in the parser, and an entry in `ACTION_SHAPES` so a save holding it in
  a pending clarification validates. If selectable play needs it, it also needs
  an affordance — either a `SelectableVerb` on the object or an entry built in
  `getAffordances`, which is how `RECITE` is reachable without typing.
- **An item.** An entry in `ITEMS` and in `ALL_ITEM_IDS`, plus a `WorldObjectDef`
  with `item:` set somewhere it can be picked up. Give it `takeText` if the
  item's default line would be wrong for that particular object — two objects
  can stand for the same item, as the hero's lantern and the crew's lamp do.
  Check it against the loose-item regression block, which iterates every item.
- **A chapter transition.** Follow `doCross`: set the flag, set `chapter`, call
  `enterLocation`, add the journal line and `setObjective`, all in one
  `resolve`. `App.persist` writes a fresh checkpoint whenever `chapter` changes.
  Add the chapter to the `Chapter` union and to the chapter/era coherence rules
  in `persistence/validate.ts`.

## The finale's state

One string flag, `finale_stage`, and nothing derived. It is never read out of
the transcript, never inferred from how many questions have been asked, and
never advanced by time: the table in `engine/puzzles/confrontation.ts` is the
only thing that moves it, and the only thing that moves `their_reach` is the
hero's own physical interventions.

The terminal facts are separate flags, checked against each other rather than
trusted:

| Flag | Means | Validated as |
| --- | --- | --- |
| `earlier_self_dead` | once, for ever | ⟺ stage `dead`/`pillar` or chapter `ending`; no conversation with them may be pending |
| `pillar_struck` | 0–3 | above zero only once they are dead; must be 3 if the cave is down |
| `escape_closed` | the squeeze is full of hill | set by the second blow |
| `cave_destroyed` | the chamber and the fold are under the hill | requires them dead |
| `hero_dead` | the returning hero | requires the destruction |
| `story_complete` | the epilogue has been shown | with the three above, ⟺ chapter `ending` |

`ended` means **the story is over**, not that the build ran out, and a save that
disagrees with itself about that is refused. Each of the three
end-of-content markers that have shipped is un-ended by its own migration, so
the only legitimate `ended` save is a finished one.

The third blow goes through the engine's ordinary clarification prompt, which is
why it needs no new UI: a button in selectable mode, a typed answer in type-only
mode. The confirmed action carries a marker so an answered prompt can be told
from a fresh `BREAK PILLAR`.

A checkpoint is written on every chapter change **except** into `ending`, so the
last one the game holds is the start of the finale — the one place a player
might actually want to go back to.

## Revisiting a room in a different chapter

The sealed chamber is entered in two chapters, a hundred years apart in the
fiction and twenty minutes apart in the hero's life. Four mechanisms make that
work, and they are the pattern for any room that has to do it again:

- **The room branches on `chapter`.** `present.sealed_chamber`'s description has
  its own branch for `return`, because the opening's branch reads the player's
  own `lanternInAlcove` / `lanternLit` flags and on the return that lamp is
  somebody else's.
- **Objects that describe player state are hidden.** The shutter, alcove, eye,
  wall and passage carry `hiddenWhen: chapter === 'return'`, and the return has
  its own object for the lamp. One object can serve both chapters where it is
  genuinely the same thing — the seam does, with a second description.
- **`getAffordances` will not offer to take something out of a hidden host.** A
  fixture that is not currently part of the room is not a place to reach into,
  which is what stops the return offering the earlier self's wedge.
- **People have `available`.** `discovered` latches — once met, always met — so
  presence has to be a separate question from acquaintance. `earlier_self` is
  `available: chapter === 'return' && !earlier_self_dead`, which is why that
  room has nobody in it during the opening and nobody in it afterwards.

The other half of the rule is that the other person's belongings are **objects,
not items.** There is one lantern record in the save and it is the hero's. A
second inventory framework is not needed to put somebody in a room with a lamp.

## Dialogue

Six rules, from an owner review of the cast. They are authoring conventions
rather than engine constraints, so the parts that can be checked are checked in
`content/content.test.ts` and the rest is on whoever writes the next scene.

1. **Do not translate an action or a line that already reads.** If a character
   digs a thumbnail into a stump, the narration does not then say what the
   gesture meant. If a question lands, the narration does not name which detail
   landed. The removed instances are listed by pattern in the test, so a later
   edit cannot quietly reintroduce them.
2. **One answer, one purpose.** An ordinary topic gets a few beats and one
   thing to say. Additional detail goes behind a follow-up topic, gated on
   having heard the first — `Sage/last_line` behind `prophecy`,
   `Lovage/the_panel` behind `cut_the_dish`. Budget: 700 characters per
   response, no single paragraph over 330, at most six beats. The paragraph cap
   is the one that catches a monologue; several short beats are a conversation
   and the count alone cannot tell them apart.
3. **Keep memorable lines rare.** A polished closing maxim on every topic makes
   the whole village sound like one witty narrator. A few are earned — Tyme on
   the slot of sky, Sage on words becoming rude, Marjoram on the cupboard with
   a sword in it — and the rest of the answers end on a plain instruction or an
   action.
4. **Physical beats should change the exchange**, not meet a quota. Dilly
   folding six fingers down one at a time is the answer; a trowel scraped for
   the third time in a scene is stage business.
5. **Voices differ.** Dilly is terse and still resentful. Lovage speaks in
   nouns and refuses to be read. Oreg talks while he works. Sage is the one who
   is allowed to be articulate, because keeping the words is her job.
6. **Puzzle instructions stay explicit.** Making the emotional content indirect
   must not make the practical content vague: Fenn still says exactly where the
   gap is, Dilly still says to go and look at the relief, and Saffra still names
   the spring and the skins.

Two kinds of text are **not** subject to this pass. The canonical prophecy in
`content/prophecy.ts` is fixed, and the lines `docs/CANON.md` marks load-bearing
— Sage's cyclops gloss and her age gloss — may be re-paragraphed but not
reworded. Basil's authored responses stay: this game has a protagonist who
speaks, and the recitation is the whole hinge of the story.

## Colour

One palette, applied by `RichText` and nowhere else. Three meanings, used
identically in narration, inventory, journal and both input modes: magenta for
unusual phenomena and significant story terms, cyan for exits, interactive
objects and conversation topics, green for successful actions, acquired items
and completed objectives.

Colour is **authored**, using the `{{tag|text}}` annotations defined in
`content/markup.ts`:

```ts
m('the Wanderer')   // magenta: significant story term or phenomenon
c('the relief')     // cyan: exit, interactable object, conversation topic
g('the wedge')      // green: acquired item, successful action
```

There is no substring matching. An earlier version derived cyan from
`state.discovered` and magenta from a term list, which was safe about discovery
but could not tell one sense of a word from another — "eye" is scenery, anatomy
and a clue in three different sentences. Annotation is per-phrase and
deliberate.

Two sources of annotation:

- **Authored prose** carries it inline: object `listAs` lines, person `listAs`
  lines, the prophecy text, and the phenomena in the deep chamber.
- **Engine-generated lists** are wrapped as they are built — exits, "you can
  make out", "people here", inventory, conversation topics, disambiguation
  options. These derive from state, so they can never name something the player
  has not discovered.

`stripMarkup` recovers the plain words, and is what the screen-reader live
region announces. Transcript strings saved before annotation existed contain no
tags, strip to themselves, and render as plain soft white — so no save
migration was needed.

Nothing is carried by colour alone: every tint sits on wording that already says
the same thing, each entry is announced by kind to a screen reader, and focus
and selection add an underline as well as a border.
