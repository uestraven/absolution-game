# Known issues

Real remaining defects and limitations as of **2026-11-02**. Nothing
hypothetical, and nothing already fixed. If an entry here turns out not to
reproduce, delete it rather than softening it.

Severity: **blocker** stops a release · **major** spoils a playthrough for some
players · **minor** is visible but survivable · **limitation** is a deliberate
boundary, not a bug.

---

## 1. Nobody outside the authors has played the game — *limitation (and the big one)*

**What:** Pacing, difficulty, clarity and emotional effect are unverified. The
automated suite proves the game is *consistent and completable*; it says nothing
about whether the middle drags, whether the confrontation lands, or whether a
stranger can work out what to do in the ruined future.

**Reproduce:** Not applicable. This is an absence of evidence, not a failure.

**Workaround:** Run blind sessions per [`PLAYTEST_PLAN.md`](PLAYTEST_PLAN.md)
before treating the game as finished. A passing test suite is not a playtest,
and an agent that has the design in context is not a blind tester.

---

## 2. No real mobile device or browser has been tested — *limitation*

**What:** All mobile verification is Chromium at phone-sized viewports
(360×740, 390×844) with touch emulation. That catches layout and tap-target
problems. It does not catch iOS Safari behaviour, Android Chrome address-bar
resize, or what a software keyboard does to the viewport when the command field
is focused.

**Specifically unverified:** whether the command line stays visible when a phone
keyboard opens. The CSS uses `viewport-fit=cover` and a flex column intended to
handle it, and it is checked at a fixed short viewport — but a real keyboard
resizing a real visual viewport is a different event.

**Workaround:** Open the deployed address on a phone and type one command before
announcing it. Selectable mode needs no keyboard at all and is the safer default
on mobile, which is why it *is* the default.

---

## 3. No screen reader has read a session aloud — *limitation*

**What:** The accessibility work is structural and verified structurally:
roles, labels, focus order, modal trapping, one live region, no colour-only
meaning, screen-reader-only kind names on every entry. No actual assistive
technology has been run against it.

**Known rough edge:** every transcript entry is prefixed with a hidden kind name
(*"Narration: "*, *"Your command: "*, *"Journal entry: "*). Reading the history
back linearly therefore includes one of those before each entry. That is
deliberate — it is how the entry kinds survive without colour — but whether it
is pleasant to listen to over a long history is untested.

**Workaround:** None needed to play. Report findings against VoiceOver, NVDA or
TalkBack if a session happens.

---

## 4. `vite build` warns that the JS chunk is over 500kB — *minor, accepted*

**What:** The build prints a chunk-size advisory on every run. Logs are
therefore not green.

**Reproduce:** `npm run build:only`.

**Why it is left alone:** measured, the chunk is 561.9kB raw and **141.4kB
brotli**, which is what a browser actually downloads; Cloudflare compresses
automatically, and first contentful paint is 80ms on a served origin. The
warning is about a byte count nobody transfers. Splitting would also put an
`await` in front of save loading, which currently assumes the whole content
graph is present. Suppressing the warning to make logs green would hide a real
signal if the bundle ever grows for a real reason. Revisit past ~250kB brotli.

---

## 5. Importing a save moves the checkpoint to the imported position — *minor, by design and now stated*

**What:** After an import, **Restart from checkpoint** returns to the imported
moment, not to the start of that chapter, and the previous checkpoint is gone.

**Reproduce:** Play into a chapter, export, play further, import the export,
then Restart from checkpoint.

**Why:** An export is a single state, not a history; there is no chapter-start
inside the file to recover. The import notice now says so explicitly. It is
listed here because it still surprises people who have not read the notice.

**Workaround:** Export again from the position you want as your fallback.

---

## 6. Saves do not follow a player between addresses or browsers — *limitation*

**What:** Progress lives in `localStorage`, scoped per origin and per browser
profile. A preview deployment, the production address, a second browser and a
private window are four separate stores.

**Reproduce:** Play on a `*.pages.dev` preview, then open the production
address.

**Workaround:** Settings › **Export Save** before changing anything, and import
on the other side. Tell testers which single address to use. Do not clear site
data to fix a loading problem — every shipped format is still migrated on read,
and an unreadable save is quarantined under its own key rather than destroyed.

---

## 7. The whole story is readable in the shipped bundle — *limitation*

**What:** Minification is not obfuscation. Every room description, the
prophecy, the ending and the epilogue are plain strings in `index-*.js`.

**Consequence:** Do not promise a tester that the twist is spoiler-safe from
somebody who decides to look. The repository's spoiler documents are not
deployed and the site links to none of them, but the text itself is in the
bundle because it has to be.

---

## 8. Two automated checks depend on a locally installed Chromium — *limitation*

**What:** `verify:browser` and `verify:served` need Playwright's Chromium.
Playwright is a pinned devDependency (`1.64.1`) but the browser binary is a
separate download. If it is absent, both passes cannot run.

**Reproduce:** Run either script on a machine that has never run
`npx playwright install chromium`.

**Workaround:** `npx playwright install chromium`. `CHROME_PATH` overrides the
executable for a pre-existing local build. **A missing download is a
verification blocker to report, not evidence that the UI works** — unit tests
run in jsdom, which has no layout engine and cannot establish anything about
scrolling, measurement or rendering.

---

## 9. jsdom cannot test the positioning arithmetic — *limitation*

**What:** jsdom reports every dimension as zero and ignores writes to
`scrollTop`, so the reading-position code cannot be meaningfully exercised in
the unit suite. The DOM tests stub `Element.prototype` to check the *wiring*
(how often the position is written, and that it is not the bottom); the
arithmetic is tested as pure functions in `src/ui/cascade.test.ts`, and the real
measurement happens in the browser passes.

**Consequence:** a change to `cascade.ts` that passes `npm run test` is not
verified. Run `npm run verify` after touching it.

---

## No open defects in the game itself

Everything found during the M6 pass was fixed in it: the obsolete
`SUBTITLE`, the "Opening chapter prototype" meta description, the missing
favicon (a 404 and a console error on every load), the transcript and the
announcer both reading new output to screen readers, the command echo being
targeted as a response start, and the unstated import-checkpoint consequence.
The four reviewed continuity defects — the plank's handwriting, "three
chapters", the sacrifice's lantern, and the opening wording — were fixed before
M6 and are each covered by a test.
