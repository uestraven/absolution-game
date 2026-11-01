# Cave of Absolution — opening chapter prototype

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
npm run test         # vitest, 147 tests
npm run build        # typecheck, then a static bundle in dist/
npm run check        # typecheck + test + build
```

`npm run build` writes the whole app to `dist/` — `index.html` plus hashed
assets, served from relative paths, so it works from any URL path.

## Documentation

| Document | Contents |
| --- | --- |
| [`docs/COMMANDS.md`](docs/COMMANDS.md) | Full command reference for type-only play. |
| [`docs/WALKTHROUGH.md`](docs/WALKTHROUGH.md) | **Spoilers.** Shortest and fullest routes, every puzzle state, verification checklist. |
| [`docs/CANON.md`](docs/CANON.md) | **Spoilers.** What is approved canon, what is provisional, what is explicitly undecided. |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Cloudflare Pages settings, verified against current docs. |
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
  content/      authored data: locations, objects, dialogue, items, flags, hints, prose
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
- Touch targets at least 44px; the command field stays visible when a phone
  keyboard opens.
- Semantic controls and labelled inputs throughout; visible focus rings.
- New output is announced through a small live region, not by re-reading the
  whole transcript. Focus is never taken from someone reading history.
- Entry kinds are conveyed by text as well as colour.
- `prefers-reduced-motion` and `prefers-contrast: more` are both honoured.
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
npx playwright install chromium        # once
npm run build
node scripts/verify-browser.mjs "$PWD/dist"
```

It drives the real built bundle in Chromium through Playwright request
interception — no server and no listening socket — and checks the 360px layout,
touch target sizes, keyboard-only completion of the whole chapter, scrolling
behaviour, mode switching, reload, export, import, refused import, checkpoint
restart, the New Game confirmation, storage-failure feedback and reduced motion.
Playwright is intentionally not a project dependency; install it only if you want
this pass. See [`docs/WALKTHROUGH.md`](docs/WALKTHROUGH.md) for what each check
asserts and for the results of the last run.
