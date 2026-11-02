# Known issues

Real remaining defects and limitations as of **2026-11-02**. Nothing
hypothetical, and nothing already fixed. If an entry here turns out not to
reproduce, delete it rather than softening it.

Severity: **blocker** stops a release · **major** spoils a playthrough for some
players · **minor** is visible but survivable · **limitation** is a deliberate
boundary, not a bug.

There is **one blocker**: the soundtrack has no attribution or licence
([#10](#10-the-soundtrack-has-no-attribution-or-licence--blocker-for-release)).

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
inside the file to recover. The import notice says so explicitly, the
confirmation dialog now asks *"Restart from the saved checkpoint?"* rather than
promising the start of a chapter, and the save help text explains the exception.
It is listed here because it still surprises people who read none of those.

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

**Mitigated, not removed:** the positioning *policy* is now a pure function,
`decidePosition`, returning a placement value rather than moving anything. That
is fully unit-tested, including every replacement and stale-mark case. What
still needs a browser is the measurement: which pixel a placement resolves to.

**Consequence:** a change to the measuring or animating half of `cascade.ts`
that passes `npm run test` is not verified. Run `npm run verify` after touching
it.

---

## 10. The soundtrack has no attribution or licence — *blocker for release*

**What:** Eight audio masters were supplied with no author, source or licence.
None is stated anywhere, because none was given and none may be invented.

**Reproduce:** Not applicable; it is an absence.

**Why it blocks:** if the tracks are not original work made for this project,
shipping them is a licensing problem. The game is otherwise releasable; this is
the one item that is not an engineering question.

**Workaround:** none. Record the terms in `art/music/README.md` and add a
player-visible credit before any deployment, or replace the tracks.

---

## 11. Nobody has listened to the music in the game — *limitation*

> **One real defect found here and fixed:** the soundtrack played each track
> once and then fell silent on iOS. Cause: two media elements crossfaded with
> `volume`, which iOS forbids on both counts — one audio stream at a time, and
> `volume` not settable from script. The controller now decodes to an
> `AudioBuffer` and loops in the audio graph. Reported on iOS Chrome (WebKit)
> against the deployed site; **not yet confirmed fixed on a device.**


**What:** Playback is verified by machine, not by ear. The served-build pass
confirms that the right track is fetched, that the clock advances, that the
volume is 0.25, that a crossfade has two audible sources and then one, that the
loop wraps instead of ending, and that a hidden tab pauses. It cannot hear a
click at a loop seam, a jarring crossfade, or a track that is simply wrong for
its room.

**Specifically unverified:**

- **Whether the loop seams are audible.** The masters have no leading or
  trailing silence and the level step across the wrap is 0.2–1.6 dB, so there
  is no hole — but three of the eight step by over a decibel, which may be
  heard as a bump. That is a property of the recordings, not of playback: the
  loop itself is now sample-exact. Measurements in `art/music/README.md`.
- **Whether iOS is actually fixed.** The cause is understood, the mechanism
  that caused it is gone, and the replacement is what Apple's own documented
  constraints leave available. **It was fixed from documentation and reasoning,
  not from a reproduction**, because there is no iOS browser here.
- **Whether the wrap is audible.** Measured in Chromium across a natural loop,
  with the whole file buffered, the stall is **~17 ms (WebM/Opus)** and **~33 ms
  (MP3)** — one or two frames. A media element seeks to loop (`seeking`,
  `waiting`, `seeked`), so it is not zero, and nobody has heard it.
- **Whether looping works on a browser that ignores `loop`.** The flag is set
  *and* the controller listens for `ended` and restarts the track by hand,
  because Safari has a long history of ignoring it on `audio`. The fallback is
  unit-tested and provoked once against the real asset — but it has never been
  exercised by a browser that actually needs it, because Chromium does not.
- **Whether 25% is the right default**, and whether the eight tracks sit at
  comparable loudness in practice. They share a −3.0 dBFS peak, which is not
  the same as sounding equally loud.

**Workaround:** listen to it. Added to the observer checklist in
`PLAYTEST_PLAN.md`.

---

## 12. Mobile audio is untested, and has known platform limits — *limitation*

**What:** No real phone has played a note. All audio verification is headless
Chromium on Linux.

**Known platform limits that apply regardless:**

- **One gesture unlocks the whole graph**, which is why Web Audio is the right
  shape here: the `AudioContext` is resumed inside the click, and every later
  programmatic start — including the second voice of a crossfade — runs inside
  the unlocked context. A second *media element* could never get that, which is
  what broke it the first time.
- **iOS respects the hardware mute switch** in some configurations, so music
  can be silent with everything set correctly in the game.
- **Backgrounding on mobile** suspends audio by OS policy as well as by the
  `visibilitychange` handling here; the two should agree, and that has not been
  observed on a device.
- **MP3 is the format every iOS browser gets**, since WebKit supports neither
  Vorbis nor Opus in Ogg or WebM. It decodes to the same PCM, so the loop is
  the same loop.
- **Memory.** Two decoded minutes is about 21MB of float32. Comfortable on
  desktop; untested against a low-memory phone.

**Workaround:** none needed to play — music is optional everywhere. Test on a
real iPhone and a real Android device before claiming mobile audio works.

---

## No open defects in the game itself

Everything found during the M6 pass and its review was fixed: the obsolete
`SUBTITLE`, the "Opening-chapter prototype" meta description and `package.json`
description, the missing favicon (a 404 and a console error on every load), the
transcript and the announcer both reading new output to screen readers, the
command echo being targeted as a response start, the unstated import-checkpoint
consequence, the checkpoint confirmation that promised the start of a chapter,
and — the one real bug in the review — **an imported history opening at the
wrong response when its entry ids collided with the ones it replaced**.

That last one is worth recording in full, because the shape of the mistake is
reusable. Entry ids are `t<seq>` and `seq` restarts at zero every new game, so
two playthroughs both contain a `t8`. Replacement was being *deduced* — "is the
id I was using still present?" — and an imported transcript longer than the
current one still contains it, so the answer came back "not replaced" and
everything after the imported `t8` was treated as newly printed output. The fix
is to stop deducing: the shell bumps a `historyEpoch` when it replaces a
history, and the stored reading position carries the `seq` of the save it was
taken from. Both are tested, including a test that asserts the old deduction
gets it wrong.

The four earlier continuity defects — the plank's handwriting, "three
chapters", the sacrifice's lantern, and the opening wording — were fixed before
M6 and are each covered by a test.
