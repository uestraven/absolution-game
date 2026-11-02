# Absolution — opening chapter prototype

A short, text-led adventure. This build contains one complete, playable opening
chapter: character selection, a village to explore, contrasting accounts of the
cave, one real puzzle, the discovery of a passage nobody else found, and a
single crossing — then it stops, on purpose, with a clear end-of-prototype
message.

First playthrough is roughly 20–30 minutes.

- **Working title.** Nothing here is a final name.
- **No backend.** No accounts, database, API keys, paid services or runtime AI.
  The build is static files and client-side JavaScript only.
- **Two input modes.** Type-only and Selectable Actions, interchangeable at any
  time, both driving the same engine.

## Running it

```bash
npm install
npm run dev          # local dev server
npm run typecheck    # tsc --noEmit
npm run test         # vitest
npm run build        # typecheck, then a static bundle in dist/
npm run check        # typecheck + test + build
```

`npm run build` writes the whole app to `dist/` — `index.html` plus hashed
assets, served from relative paths, so it works from any URL path.

## Look and feel

### Layout

The transcript gets the window. Measured in Chromium on the built bundle:

| | Story share | Visible lines |
| --- | --- | --- |
| Desktop, type-only (1280×900) | 84% | 25 |
| Laptop, type-only (1440×800) | 83% | 22 |
| Mobile, type-only (390×844) | 81% | 25 |
| Desktop, selectable (1280×900) | 76% | 22 |
| Mobile, selectable (360×740) | 57% | 14 |

Three things pay for that. The **location folds**: the room name stays on
screen with a disclosure button, and the subtitle and objective live behind it
(remembered per browser; the objective is reprinted in the transcript whenever
it changes, so nothing is lost by leaving it shut). The **command line is two
lines**, with its label for screen readers only and the verb reminder shown
only while the field is empty. And in selectable mode the actions are **one row
of categories** — Go, People, Things, with counts — opening one at a time,
because showing all three at once takes eleven buttons and half of a phone.

Selectable mode on a narrow screen is the weakest case and is floor-limited:
legible exit names at 44px tap height cannot be made much smaller.

### Motion

New text appears immediately. What moves is the scroll position: when a block
lands, the transcript glides up to meet it over 60–100 ms on an exponential
ease-out, driven from `requestAnimationFrame` rather than CSS so the target can
be re-read while content settles. Measured frame deltas on a long block:
637, 328, 104, 32 px — deceleration, not a row-by-row jump. A heavy block also
nudges the anchored command line down 3px and back, so it reads as being pushed
by the text.

Nothing waits on it: any glide is cancelled the moment a reader touches the
wheel, a scrollbar or the screen, a reader who has scrolled up is never
animated at all, and a restored transcript snaps rather than replaying. Under
`prefers-reduced-motion` the glide becomes the jump, verified as settling
within one frame.

A minimal terminal: soft white on near-black, one monospace face at 18px
(16–18px on mobile) with 1.6 line spacing, and a single centred reading column
about 70 characters wide. Text appears immediately — no typewriter effect,
flicker, scanlines, glow, gradients or decorative panels.

Colour is sparse and always means the same thing, in narration, inventory,
journal and both input modes alike:

| | Colour | Meaning |
| --- | --- | --- |
| magenta | `#EB8FD8` | Unusual phenomena and significant story terms |
| cyan | `#79DCE8` | Exits, interactive objects, conversation topics |
| green | `#A3DB96` | Successful actions, acquired items, completed objectives |

Background `#080A0C`, body text `#DEDFDA`, supporting text and previous
commands `#A0A6AD`.

Two rules keep the tinting honest, and both are enforced by tests:

- **Colour is authored, not inferred.** Each tint is written into the prose a
  phrase at a time with the `{{tag|text}}` annotations in
  `src/content/markup.ts`. Nothing matches substrings: "eye" is scenery in one
  sentence, anatomy in another and a clue in a third, and only the author can
  tell those apart. The engine also annotates the lists it generates — exits,
  things here, people here, inventory, topics — from state, so those can never
  name something undiscovered. Plain text is always recoverable with
  `stripMarkup`, which is what the screen-reader announcement uses, and the
  syntax is never shown to a player.
- **Nothing is carried by colour alone.** Every tint sits on wording that
  already says the same thing, each transcript entry is announced by kind to a
  screen reader, exits are labelled with their direction, and a completed
  objective gets a class as well as a colour. Focused and selected controls
  take an underline in addition to a border. No puzzle needs colour to solve.

Colour stays on short spans, measuring about 2% of the transcript in practice.

## Documentation

| Document | Contents |
| --- | --- |
| [`docs/COMMANDS.md`](docs/COMMANDS.md) | Full command reference for type-only play. |
| [`docs/WALKTHROUGH.md`](docs/WALKTHROUGH.md) | **Spoilers.** Shortest and fullest routes, every puzzle state, verification checklist. |
| [`docs/CANON.md`](docs/CANON.md) | **Spoilers.** What is approved canon, what is provisional, what is explicitly undecided. |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Cloudflare Pages settings, verified against current docs. |
| [`docs/FULL_GAME_DESIGN.md`](docs/FULL_GAME_DESIGN.md) | **Spoilers. Proposed, not approved.** The complete adventure: ending, causal model, maps, puzzles. |
| [`docs/FULL_GAME_WALKTHROUGH.md`](docs/FULL_GAME_WALKTHROUGH.md) | **Spoilers. Proposed.** Critical path for the whole game, plus a continuity audit. |
| [`docs/M2_DECISIONS.md`](docs/M2_DECISIONS.md) | The five decisions the owner needs to settle before Milestone 3. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Module layout, state shape, the rules the engine enforces. |

`docs/WALKTHROUGH.md` and `docs/CANON.md` describe later events in the story and
are not meant for players.

### On spoilers and static builds

Story-wide reveals are kept out of player-facing text, journal entries, UI
labels and save filenames. They are **not** hidden from anyone who reads the
source: this is a static client-side app, every string ships to the browser, and
no amount of care in the content files changes that. Treat the source as public
if the build is.

## Shape of the code

```
src/
  engine/       pure TypeScript game engine, no React
    types.ts        state, actions, content interfaces
    reducer.ts      the one impure-free resolver: (state, action) -> state + events
    parser.ts       text -> action, fixed vocabulary, no LLM
    selectors.ts    derived reads: visible things, noun resolution
    affordances.ts  the selectable-mode action list, engine-computed

  engine/
    mechanics.ts    shared state helpers used by the reducer and by puzzles
    puzzles/        one module per puzzle; the opening's is shutteredRelief
  content/      authored data: locations, objects, dialogue, items, flags,
                hints, markup helpers, prose
  persistence/  localStorage slots, export/import, save validation
  ui/           React: transcript, both input modes, settings, styles
  testing/      test harness shared by the suites
```

The engine knows nothing about React, the DOM or the input mode. Both input
modes construct the same `GameAction` values and dispatch them through the same
`resolve`. The UI has no way to set a story flag, move the player or reveal an
object; visibility and validation live in the engine, so a guessed object id
behaves exactly like a nonsense word whether it is typed or clicked.

## Saves

Progress autosaves to `localStorage` after every action, with a last-known-good
backup and a checkpoint from the start of the current chapter. Title screen and
Settings offer Continue, New Game, Export Save, Import Save and
*Restart from checkpoint*.

Saves are per browser **origin**. They do not sync between devices or browsers,
and a preview deployment address has its own separate storage. Export produces a
plain JSON file named `adventure-save.json`.

Reading and writing are independent: a browser that has run out of room can
still load an existing save, so Continue and Export Save keep working when new
saves do not. Storage keys are unchanged from the first prototype
(`cave-of-absolution:*`), and saves written by it still load — internal
person and topic ids were deliberately left alone when the cast was renamed, so
no migration is needed.

If storage is unavailable or full, the game says so in a banner that stays up —
it never claims a save succeeded when the write failed — and play continues with
Export Save available.

Imports are validated completely before anything is touched: size, format
version, character, location, era-versus-location agreement, item ids, flag keys
and value types, and the consistency of inventory with item placements. A
refused import leaves the current game and the stored save exactly as they were.
An existing save that cannot be read is copied aside to a quarantine key rather
than overwritten.

## Accessibility

- Works down to a 360px viewport with no horizontal scrolling.
- The command field stays visible when a phone keyboard opens.
- Semantic controls and labelled inputs throughout; visible focus rings.
- New output is announced through a small live region, not by re-reading the
  whole transcript. Focus is never taken from someone reading history.
- Entry kinds are conveyed by text as well as colour, and no meaning depends on
  hue: see **Look and feel** above.
- Comfortable 44px touch targets where the pointer is coarse, left compact for a
  mouse.
- `prefers-reduced-motion` and `prefers-contrast: more` are both honoured; the
  kinetic scroll degrades to an instant jump.
- Type-only mode is completable with the keyboard alone; Selectable Actions mode
  is completable without typing anything.

In type-only mode the room, object and dialogue **buttons** are hidden and the
numbered dialogue options are written into the transcript instead. Settings,
accessibility controls and the non-story meta commands (journal, hint, help) stay
available as controls in both modes, since they change nothing in the world.

## Deliberately not in this build

No combat, levelling, hunger, durability, item decay, real-time pressure, random
death or consumable light fuel. No critical item can be destroyed or dropped
somewhere unreachable; the wedge and the lantern can always be recovered, and the
discovered passage stays discovered. The player can walk back out of the cave for
preparation at any time. Darkness never soft-locks anything.

Offline caching and PWA support are deferred. There is no cross-device sync, and
the story does not continue past the end-of-chapter marker.

## Verification

`npm run check` covers types, tests and the production build. There is also an
optional browser pass over the built output:

```bash
npx playwright install chromium   # once; playwright is a devDependency
npm run build
npm run verify:browser
```

It drives the real built bundle in Chromium through Playwright request
interception — no server and no listening socket — and checks the 360px layout,
touch target sizes, keyboard-only completion of the whole chapter, scrolling
behaviour, mode switching, reload, export, import, refused import, checkpoint
restart, the New Game confirmation, storage-failure feedback, reduced motion,
and the visual specification itself — exact palette values, monospace metrics,
the 70-character column on both narrow and wide viewports, how little of the
transcript is coloured, that nothing undiscovered is tinted, and the absence of
gradients, shadows, glow and animation.
Playwright is a pinned devDependency, so only its browser binary needs the
one-off install above. See [`docs/WALKTHROUGH.md`](docs/WALKTHROUGH.md) for what each check
asserts and for the results of the last run.
