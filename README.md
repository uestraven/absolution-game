# Absolution

A short, text-led adventure, complete from the first morning to the last line.

**Chapter 1** — character selection, a village to explore, contrasting accounts
of the cave, one real puzzle, the discovery of a passage nobody else found, and
a crossing.

**Chapter 2** — the same village a hundred years earlier: landmarks you know laid
out wrong, a building site with a foreman on the door, a question you are asked
and have to answer, and the builders' three lamp positions — one of which you
can light.

**Chapter 3** — the same valley a hundred years the other way. Thirty people
where there were two hundred, a hill somebody has walled up, a chest of records
with a woman sitting against it, and four separate things that have to be put
together before the way home is worth taking.

**Chapter 4** — four paces of rock, two people, and one of them has to decide.

The story has an ending and the build reaches it. First playthrough is roughly
90–110 minutes.

**Spoiler warning for the documentation.** `docs/WALKTHROUGH.md`,
`docs/CANON.md` and the full-game design describe the whole plot including the
ending. The player-facing text does not.

- **Working title.** Nothing here is a final name.
- **No backend.** No accounts, database, API keys, paid services or runtime AI.
  The build is static files and client-side JavaScript only.
- **Two input modes.** Type-only and Selectable Actions, interchangeable at any
  time, both driving the same engine. Both are verified to complete both
  chapters on their own.

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

### Where the transcript looks

**The transcript does not chase the bottom of the text.** Once an action's whole
output has rendered, the scroller is positioned on the *start* of that output:

- **If the response fits in the viewport, all of it is revealed.**
- **If it does not, its first line is placed a little below the top edge**, with
  the rest below it to read down into.

Chasing the bottom is wrong for a text game. A long response ends with its last
paragraph against the input and its first paragraph somewhere off the top of the
window, so the reader has to scroll *up* to find the beginning of what they just
asked for — and the longer the response, the worse it gets, which is backwards.
The arrival in a new place, the recitation and the epilogue are exactly the
passages that need to start at the start.

There is **one position change per action**, taken after the whole response is
in the DOM. Individual blocks within a response — narration, then a journal
entry, then an objective — never scroll separately.

Entering play follows the same idea. **A new game opens at the top of the
opening** — it is the first response, and the reader has not read a word yet.
**Continue, an import or a checkpoint opens at the end** of what was restored,
because resuming is not reading something new. The transcript cannot tell these
apart from the state, since both arrive with a full history and no actions
taken, so the shell says which door was used.

Re-renders that are *not* actions hold the reader's place: folding the status
bar and opening settings move nothing, and switching input mode, which inserts
or removes the written-out option lists throughout the history, puts the
anchored entry back at the offset it had. Scrolling **never moves keyboard
focus** — every move is an assignment to `scrollTop`, and neither
`scrollIntoView` nor `focus()` is used, so a reader who has focused the history
to arrow-key through it keeps it.

### Motion

New text appears immediately. What moves is the scroll position, on a cubic
ease-out driven from `requestAnimationFrame` rather than CSS so the target can
be re-read while content settles. A heavy block also nudges the anchored command
line 3px and back, so it reads as being pushed by the text rather than as a
separate widget.

Two things keep it legible:

- **320–720 ms, scaled by distance.** Earlier envelopes of 60–100 ms and then
  170–380 ms were both quick enough to read as a snap with a smear on it. At
  this length the eye can follow the text to its resting place, which is the
  point of animating it at all.
- **Travel is bounded to three quarters of a screen.** A long move covers
  everything beyond that instantly and glides the rest, so the eye always
  follows the same readable distance however far the position moved. Animating a
  three-thousand-pixel jump is illegible at any duration.

A glide is cancelled the instant a reader touches the wheel, a scrollbar or the
screen. A restored transcript snaps rather than replaying. Under
`prefers-reduced-motion` the glide becomes the jump, with the positioning rule
unchanged.

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
| [`docs/WALKTHROUGH.md`](docs/WALKTHROUGH.md) | **Spoilers.** Shortest and fullest routes, every puzzle state, the save migration, verification checklist. |
| [`docs/CANON.md`](docs/CANON.md) | **Spoilers.** What is approved canon, what is provisional, what is explicitly undecided. |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Cloudflare Pages settings, verified against current docs. |
| [`docs/FULL_GAME_DESIGN.md`](docs/FULL_GAME_DESIGN.md) | **Spoilers. Proposed, not approved.** The complete adventure: ending, causal model, maps, puzzles. |
| [`docs/FULL_GAME_WALKTHROUGH.md`](docs/FULL_GAME_WALKTHROUGH.md) | **Spoilers. Proposed.** Critical path for the whole game, plus a continuity audit. |
| [`docs/M2_DECISIONS.md`](docs/M2_DECISIONS.md) | The five decisions the owner has settled, and what is still proposed. |
| [`docs/M3_BRIEF.md`](docs/M3_BRIEF.md) | **Spoilers.** The Milestone 3 build brief this chapter was built from. |
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
    puzzles/        one module per puzzle or set piece
      shutteredRelief.ts   chapter 1's puzzle
      water.ts             worksite access, the ordinary route
      recitation.ts        the fixed scene in the square
      worksite.ts          the three lamp positions and the second crossing
      rupture.ts           the authored wrongnesses
      evidence.ts          the four sources, and the hero's inference
      futureSeal.ts        breaking back in, and the eye
      futureReturn.ts      the middle position, and the way home
      confrontation.ts     the finale's stage table, and the killing
      sacrifice.ts         the pillar, the ending, and what a finished save does
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
(`cave-of-absolution:*`).

### Save compatibility

| Format | Written by | Status |
| --- | --- | --- |
| 1 | the opening-chapter builds | **Loads.** Migrated on read |
| 2 | the builds that ended at the ruined-future arrival | **Loads.** Migrated on read |
| 3 | the builds that ended at the return | **Loads.** Migrated on read |
| 4 | this build | Current |

Each step only *widens* what `era`, `chapter` and `locationId` may hold, and
adds items and flags. No field has ever been removed or retyped, so every
migration is a value fix-up — and each has one thing to fix: **a save that
stopped where that build stopped.**

| Step | The save it fixes | What it does |
| --- | --- | --- |
| 1 → 2 | marked complete in the past square | Un-ends it; sets the objective the rest of Chapter 2 answers |
| 2 → 3 | marked complete at the arrival in the broken chamber | Un-ends it; sets the objective the rest of Chapter 3 answers |
| 3 → 4 | marked complete at the return | Un-ends it; sets the objective the last chapter answers; **and makes sure the hero is carrying the mallet** |

The save comes back as a game in progress, with one line appended to the
transcript saying the story continues past that point now. The historical
end-of-content entry is left exactly where it is rather than silently
contradicted, and a format-1 file that has not been opened since goes through
all three steps in order.

**The mallet.** The build that wrote format 3 let a player come back through
the wall without it, and the last chapter needs it. So a return-endpoint save
that has not got it is given it, with a line in the transcript saying so. That
recovery is deliberately narrow: it only fires for `chapter: 'return'`, it
*moves* an existing record rather than copying one so nothing is duplicated, and
it never touches a current game — a player who puts the mallet down in the
finale can simply pick it back up.

Nothing else is touched. No other completion flag is cleared, no progress is
reset, and every migration is idempotent. `ended` now means the story is over,
and a save that disagrees with itself about that is refused as an edited file
rather than quietly repaired.

The version is the right hook for this precisely *because* the state shape did
not change: `ended` at an old boundary is indistinguishable from a legitimate
current state by inspection alone, so the rule is "the previous format said the
story stopped here, this one says it does not", and it runs once per file on
the way in.

Internal person and topic ids were deliberately left alone when the cast was
renamed, so a save from before that still loads too.

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
  whole transcript. Focus is never taken from someone reading history — moving
  the transcript's position does not move the keyboard.
- Entry kinds are conveyed by text as well as colour, and no meaning depends on
  hue: see **Look and feel** above.
- Comfortable 44px touch targets where the pointer is coarse, left compact for a
  mouse.
- `prefers-reduced-motion` and `prefers-contrast: more` are both honoured; the
  glide degrades to an instant jump, which lands in the same place.
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
