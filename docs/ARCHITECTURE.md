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

Migrations: `SCHEMA_VERSION` is 1 and no other version has shipped, so the
`migrate` switch handles the current version and rejects everything else. It
invents no steps for versions that never existed.

## UI

| Component | Role |
| --- | --- |
| `App` | Owns state, persistence, preferences and screen routing. The only place `resolve` is called |
| `Transcript` | Scrolling log. Follows new output only when the reader is already at the bottom. Hides `options` entries in selectable mode, where the same choices are buttons |
| `TypeInput` | Labelled command field, command history on Up/Down. Focuses once on mount, never again |
| `SelectPanel` | Renders the engine's affordance list. Holds only transient menu state (which thing is expanded, which item is mid-"use on…") |
| `SettingsDialog` | Input mode, text size, saves, checkpoint restart |
| `RichText` | Paragraphs, `*emphasis*`, and all colour — as React nodes |

## Where new content goes

The puzzle-specific code has been lifted out of the reducer:

| File | Holds |
| --- | --- |
| `engine/mechanics.ts` | Shared state helpers — `clone`, `discover`, `addJournal`, `commit`, `setObjective`, item movement. Knows about no particular puzzle, room or item |
| `engine/puzzles/shutteredRelief.ts` | Everything that knows about the opening's puzzle, including its prose |
| `engine/reducer.ts` | The action pipeline, noun resolution and the generic verbs |

Adding to the game:

- **A room.** One entry in `content/locations.ts` with its exits, plus its
  objects in `content/objects.ts`. Nothing else needs to change; `enterLocation`
  discovers whatever is `initiallyVisible`.
- **An era.** A new `LocationId` prefix, the matching `Era` value, and a case in
  `eraOf`. Validation already cross-checks `era` against the location prefix,
  so a new era is covered by the existing coherence checks.
- **A puzzle.** A new module beside `shutteredRelief.ts`, exporting handlers of
  the same `(draft, events) => ResolveResult` shape, wired in from the relevant
  `case` in the reducer's `doOpen` / `doUse` / `doPlace`. Its flags go in
  `content/flags.ts` with their types in `FLAG_TYPES`.
- **A chapter transition.** Follow `doCross`: set the flag, set `chapter`, call
  `enterLocation`, add the journal line and `setObjective`, all in one
  `resolve`. `App.persist` writes a fresh checkpoint whenever `chapter` changes.
  Add the chapter to the `Chapter` union and to the chapter/era coherence rules
  in `persistence/validate.ts`.

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
