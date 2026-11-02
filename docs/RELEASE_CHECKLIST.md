# Release checklist — M6 candidate

**Dated 2026-11-02.** Every number here was measured on that date, on this
revision. Revised the same day after an owner review of `ab21a1c` found one
scrolling bug and two stale strings — see [the review fixes](#0-review-of-ab21a1c). It is a record of one run, not a standing claim: re-run the commands
and write a new section rather than editing these figures.

| | |
| --- | --- |
| Reviewed at the start of M6 | `55da4a2` (M5 at `6a5c6cb`, plus the four commits after it) |
| Engineering pass committed as | `6616fd8` and the commits following it |
| Published | **No.** Not deployed, not pushed, no account configured, no domain touched |
| Human blind playtest | **PENDING.** Nobody outside the authors has played it — see [`PLAYTEST_PLAN.md`](PLAYTEST_PLAN.md) |
| Environment | Node v22.23.3, npm 10.9.9, Linux x86-64; Chromium 1234 via the pinned `playwright@1.64.1` |

---

## 0. Review of `ab21a1c`

Three findings, all fixed.

| Finding | Correction |
| --- | --- |
| **Imported histories could open at the wrong response.** Entry ids are `t<seq>` and `seq` restarts every game, so an imported transcript longer than the current one contains the id being used as the "last entry before this action" mark. Replacement was *deduced* from that id's absence, so a collision read as "not replaced" and everything after the imported id was treated as newly printed output | Replacement is now **declared** by the shell: `historyEpoch` is bumped on import and checkpoint restart, and the transcript never infers it from ids. Stored reading positions carry the `seq` of the save they came from, so a mark from another playthrough cannot resolve against a reused id. The positioning policy was extracted into a pure `decidePosition` so every case is unit-testable without a layout engine |
| **The checkpoint confirmation contradicted import behaviour** — it promised "the start of the chapter" | Now asks *"Restart from the saved checkpoint?"*. The ending panel's button and the notice match, and the save help text explains the import exception |
| **`package.json` still called this an "Opening-chapter prototype"** | Describes the completed adventure |

Added for the bug: ten unit tests over `decidePosition` — including one that
asserts the **old deduction gets it wrong**, so the reason the signal exists is
written down as a test rather than a comment — and an end-to-end browser check
that reproduces the collision (two playthroughs both containing `t7`), imports
the longer history, and measures where it opens. Result: the imported history's
own last response at entry 24, fully visible, with the stale mark's entry 7 now
4533px above the viewport.

---

## 1. Automated checks actually run

| Command | Result |
| --- | --- |
| `npm ci` | clean install from `package-lock.json`, 0 vulnerabilities |
| `npm run typecheck` (`tsc --noEmit`) | clean, no diagnostics |
| `npm run test` (vitest) | **511 passed / 511**, 17 files |
| `npm run build:only` (vite) | built; emits the 500kB chunk-size advisory, [discussed below](#5-bundle-and-packaging) |
| `node scripts/verify-browser.mjs dist` | **127 passed / 127** |
| `node scripts/verify-served.mjs dist` | **31 passed / 31** |

`npm run verify` runs the build and both browser passes in sequence.

### What the two browser passes are for

They are not redundant.

- **`verify:browser`** serves `dist/` through Playwright's request interception
  on a synthetic `https://cave.test` origin. No listening socket. It is where
  the gameplay, accessibility, layout, save-compatibility and storage-failure
  checks live, because it can fabricate conditions (a full quota, a legacy save
  file) that a real host cannot.
- **`verify:served`** serves `dist/` over real HTTP from **127.0.0.1 on an
  ephemeral port** and watches the wire. It exists because interception answers
  whatever the page asks for and therefore cannot prove the built asset paths
  resolve the way a static host serves them.

Neither is a substitute for a person playing the game.

---

## 2. The M6 assignment, item by item

### Response positioning — done

| Requirement | Evidence |
| --- | --- |
| One action's whole output is one response batch | `src/ui/Transcript.tsx`: the position effect is keyed on `actionCount` alone. `app.dom.test.tsx` counts writes to `scrollTop`: exactly one per action |
| Short response: reveal in full, move only as much as needed | `responseTarget` returns the content end when the response fits; `cascade.test.ts` sweeps every response height from 20px to 3000px |
| Long response: first substantive output near the top | 16px margin. Measured in the browser: recitation at 15.7px, injury at 16.2px, ending at 16.3px |
| Not the journal notice, end marker, command echo or last paragraph | `responseStart` skips `kind: 'command'` and takes the first new entry, not the last. Two unit tests |
| Commit output, then measure and reposition once | A single `useLayoutEffect`, after the render that carries the whole batch |
| Never per block, never on rerender | Write counter: 2 writes for 2 actions, 0 for opening settings, 0 for folding the status bar |
| Stable entry identity, not array length | Entry ids throughout; the mark is an id, and `responseStart` returns `null` when the id is gone rather than guessing. Identity alone is **not** used to detect replacement — ids are reused across playthroughs, so the shell declares it (`historyEpoch`) and the stored reading position is stamped with the save's `seq` |
| Import / new game / checkpoint / review / restored history handled deliberately | New game → top. Restored → stored position (if it belongs to this playthrough), else the last response's start. Import and checkpoint are **declared** replacements and open at the restored history's own last response, ignoring the stored mark, which describes the history just discarded. Review is an ordinary action |
| No artificial empty screen below a short response | The target is clamped to `maxScroll`; the short-response branch returns the content end |
| Reading position preserved across non-story UI changes | Input-mode switch restores the anchored entry: measured 7391px→7585px of text, anchor held at −439.25px exactly. Settings and status-bar folding write nothing |
| Hidden option blocks → nearest meaningful position | If the anchored entry was an option list that has just been hidden, nothing moves |
| Focus never moved to scroll | Only `scrollTop` assignment; no `scrollIntoView`, no `focus()`. Browser check focuses the status toggle, dispatches an action synthetically, confirms focus survives a 5988px move |
| Announcement limited to new output | One live region. The transcript log is now `aria-live="off"` — see [accessibility](#4-accessibility) |
| Brief gentle motion; reduced motion disables it | 320–720ms cubic ease-out, distance-scaled, capped at ¾ screen. 38 moving frames measured. `prefers-reduced-motion` → jump, same destination |
| Wheel/touch/scrollbar cancels motion | Listeners on `wheel`, `touchstart`, `pointerdown` |
| Command-line bounce removed | Removed, with the keyframe and the CSS class. It animated the input on the premise that text was pushing it down — true only while every action scrolled to the bottom |
| Reading position restored on reload, in UI preferences | A separate `cave-of-absolution:reading` key holding `{id, offset}`. Served-build check: resumed within **1px** (−671.5 → −672.5). Verified the save file does **not** contain it |
| Fall back to the latest response's beginning | `lastResponseStart` finds the entry after the last command echo |
| Never resume at the end of an unread epilogue | Browser check: a finished save reloads with 3187px of the ending still below the fold, and the first line of what is on screen flush to the top |
| The final action's first passage visible | Measured: opens on *"You take your time over the last one…"* at 16.3px, with 4323px still to read |

**The Continue/Read-Aftermath beat was not built.** The brief says to prefer the
simple response-start fix first, and the measurement above shows the ending now
opens on its first line with the rest below it. Adding a presentation-only gate
would be a change made on a guess; it should wait for a blind session that shows
the epilogue being missed.

### Confrontation escalation — done

| Requirement | Evidence |
| --- | --- |
| A serious attempt to communicate identity/danger, with a distinct response | Unchanged and already required: the earlier self must have *accepted the identity* **and** been told either where the words came from or what the century looks like. Each has its own authored response and its own repeat response |
| At least one failed nonlethal intervention | `tried_to_stop_them`, latched by restraint, taking their lamp, or blocking the wall |
| …and their continued attempt toward the passage | The gate also requires `their_reach >= 1` — every attempt moves them nearer the wall, so the flag cannot be set without a visible consequence |
| No exhaustive checklist | Any one of the three. Tested individually, all three |
| An unrelated earlier flag must not unlock it | An attempt made during the argument does **not** count: `restrainThem` and `takeTheirLamp` only latch the flag at stage `rush`. A separate refusal says so instead of pretending nothing happened |
| Intent explicit in both modes | Typed `kill them`; the button reads *"Kill them with the mallet"*, and is absent from the panel until the gate opens |
| Two-death order and deliberate sacrifice preserved | Pillar refuses while they are alive, in fiction. Third blow goes through the engine's clarification prompt |
| No timer, RNG, stats, extra branch | `confrontation.ts` transition table: nothing advances on a clock. Inspecting, hints, settings and reading move nothing |
| Escape-closing foreshadowed before it happens | **New.** After the first blow: *"the squeeze is narrower than it was… One more of these and you will not be walking out of here."* `west` reports the narrowing and says a further swing ends it. `examine pillar` says it too. The journal records it |
| Legacy confrontation save stays viable | No schema change, no fabricated attempt: every intervention is still available in that room, so an old `rush` save unlocks the kill the same way a new one does. Tested. A save with the death already committed is untouched by the gate |

### Prose and continuity — done

| Defect | Fix |
| --- | --- |
| The plank bearing the hero's handwriting | Saffra wrote it; the words are the hero's. `LEAVE_AFTER` now reads *"your four lines, in Saffra's careful hand"*. A test scans every finale passage mentioning the plank for a handwriting claim. The journal, which genuinely is the hero's hand, is untouched |
| "Three chapters" in the ending copy | Says *Four*, and a test derives the expectation from the shipped marker |
| Sacrifice narrating putting down a lantern already dropped | Conditional. Tested both ways; the lamp stays where it was left |
| Opening wording | *"You turn sixteen today. You're finally allowed into the Cave of Absolution."* The setup screen no longer pre-empts it; the duplicate clause in paragraph 2 is gone |
| `SUBTITLE = 'The opening chapters'` | **Found during M6.** Now *"Sixteen years old, and allowed in at last"* — no count to go stale |
| `<meta name="description">` said "Opening chapter prototype" | **Found during M6.** Rewritten. This is what a link preview shows |
| Missing favicon → a 404 and a console error on every load | **Found during M6.** Inline SVG data URI: no request, no 404 |
| Over-explained reactions | Nine passages cut across the confrontation, the sacrifice and the epilogue. "Arithmetic" is gone from the finale entirely |
| Epilogue moralizing | Sage writes one line, *They came true*, and stops. Which sentence is accurate and how the lines map are gone; a test asserts they stay gone |
| Mannered constructions | Three `which is` chains unpicked in the finale. No blanket replacement |

Checked and found already correct, so not changed: the evidence synthesis (short
and location-neutral since M5); the injury aftermath (one interpretive line
removed, the rest left); Parsie's stone, whose follow-up topic is gated on
`gave_stone` and is therefore never assumed delivered; the canonical prophecy,
verbatim in both eras.

Both protagonists: a full playthrough as each now asserts no unsubstituted
`{placeholder}` anywhere in the transcript, and that neither is ever called by
the other's name. The existing "never calls the hero a man" check stands.

---

## 3. Behavioural coverage

| Required | Where | Result |
| --- | --- | --- |
| Full route, typed, both protagonists | `equivalence.test.ts` (Basilia, step for step against the clicking run), the documented shortest route (Basil, 73 steps), `finale.test.ts` finishes as both | pass |
| Full route, selectable, both protagonists | `equivalence.test.ts` clicking-only run as Basil; browser check *"selectable mode: the whole story completed with no typing at all"* as Basilia | pass |
| Worksite-before-recitation and recitation-before-worksite | `equivalence.test.ts` *"takes the recitation-first order"* | pass |
| Alternate order of future evidence | `chapter3`/`finale` evidence tests; `missingEvidence` is order-free | pass |
| Optional content skipped and visited | *"does not require the echo chamber or any conversation before the cave"*; the full typed run visits every location | pass |
| Drop/recover tools, leave essentials before crossings, substitutes | *"still completes if the player crosses having left both items behind"*, the crew lamp, *"can still finish after dropping and recovering both items"*, the mallet gate before the return | pass |
| Mode switch during ambiguity and conversation | Browser: *"switching to buttons mid-puzzle"*, *"switching to typing mid-conversation"*, *"a conversation started by clicking can be finished by typing"* | pass |
| Repeat completed actions, wrong-but-plausible items | *"offers a modest set of plausible item targets, several of them wrong"*; every puzzle's repeat path is authored | pass |
| Cancel the final confirmation | *"the last blow asks, and takes no for an answer"*, in both modes | pass |
| Reload at every milestone | Browser passes reload and Continue at the opening, recitation, each era arrival, the synthesis, after the injury, the return, mid-argument, after the death, before the commitment, and after the ending | pass |
| Checkpoint after completion is the finale checkpoint | *"the ending keeps a checkpoint at the start of the chapter, not over it"* — restarts to `return` with both deaths un-set and the mallet in hand | pass |
| Import states its checkpoint limit | **Added in M6.** The notice now says Restart will return to the imported point, not the chapter start | pass |
| Legacy format chains and old prototype endpoints | Migration tests 1→2→3→4 plus browser runs of an M2-endpoint save and a legacy save, each resuming in place, corrected rather than contradicted, and playing on | pass |
| Missing-tool recovery narrow and idempotent | The 3→4 mallet recovery applies only to a `return`-chapter save that lacks it; migration tests cover re-running it | pass |
| Newer/inconsistent saves refused without overwriting | `migration.test.ts` *"rejects a newer format clearly, without touching it"*; terminal-coherence refusals; a bad save is quarantined under its own key | pass |
| Storage full / write-blocked / unavailable | Browser: persistent warning shown, play continues, no false save claim | pass |
| Bounded transcript trimming | `MAX_TRANSCRIPT = 240`, exercised by the full runs; the positioning code treats a vanished id as "not identifiable" rather than guessing | pass |
| Backup recovery | `loadBest` prefers the save, falls back to the backup; persistence tests | pass |
| Terminal effects happen once | `j.killed` and `j.the_end` appear exactly once across reloads; review re-prints without moving a flag; the dead cannot talk, move, or be killed again | pass |
| No route skips the approved order | The pillar refuses while they live; the kill refuses before the escalation; the ending latches in one commit | pass |

### Manual inspection

Done by reading measured output from the browser passes at 360×740, 390×844,
640×540 and 1280×860, and by reading the code paths. Honestly:

- **Checked by measurement:** no horizontal scrolling at 360px, before or after
  the injury; touch targets ≥40px; the transcript owning ≥55% of the window;
  response-start placement on every long response; palette values; monospace at
  16–18px with 1.6 line height; the reading column at ~70 characters; focus
  rings; modal focus trapping, `Tab`/`Shift+Tab` containment and `Escape`
  returning focus to the opening button; reduced-motion collapsing the glide;
  larger text at 360px with no overflow or clipping; 200% desktop zoom (640×540)
  keeping the controls on screen.
- **Not checked, and not claimed:** real iOS and Android browsers; a real
  software keyboard appearing and resizing the viewport; an actual screen reader
  (VoiceOver, NVDA, TalkBack) reading a session aloud; any physical device at
  all. Chromium at a phone-sized viewport is not a phone. See
  [`KNOWN_ISSUES.md`](KNOWN_ISSUES.md).

---

## 4. Accessibility

| Requirement | State |
| --- | --- |
| Keyboard-only completion | Verified end to end in the browser pass, by tabbing from the title screen to the ending |
| Selectable completion with no text entry | Verified end to end, both protagonists |
| Semantic controls, visible focus | Buttons, radios, checkboxes, labelled inputs; focus rings checked |
| Modal behaviour | Focus enters the dialog, is trapped, and returns to the opener on `Escape` |
| No colour-only clues | Every entry kind carries a screen-reader-only name; the completed objective is marked as well as tinted |
| Reduced motion | The glide becomes a jump with the same destination |
| Duplicate screen-reader output | **Fixed in M6.** `role="log"` is implicitly a polite live region, so the history and the dedicated announcer were both reading every response — each answer twice. The log is now `aria-live="off"`, keeping the role so the history is still navigable, with announcing done in one place. A browser check asserts exactly one live region and that it is not the log |

---

## 5. Bundle and packaging

Measured on 2026-11-02:

| | raw | gzip | brotli |
| --- | --- | --- | --- |
| `index.html` | 1.3kB | 0.7kB | — |
| `assets/index-*.css` | 10.4kB | 2.9kB | 2.5kB |
| `assets/index-*.js` | 570.5kB | 176.1kB | 144.0kB |
| `assets/title-*.png` | 17.5kB | — | 17.3kB |
| **first-load transfer** | **586.0kB** | **191.9kB** | **164.8kB** |

**Audio is not in that total, and is not loaded at startup.** Sixteen files —
eight tracks, two formats — are stored (4.26 MB WebM/Opus, 5.17 MB MP3), and a
player downloads one track at a time, only after enabling music, only for the
place they are in. A visitor who never touches the control downloads none of
it. Both facts are checked on the wire.

The PNG is the title wordmark, and it is counted here because the page fetches
it: the served harness now measures every same-origin response rather than only
what the HTML links. It is already deflate-compressed, so brotli buys 0.2kB.

Startup on a served loopback origin: `domContentLoaded` 58ms, `load` 58ms, first
contentful paint 84ms. The install, typecheck, test and build figures came from
a run after `npm ci` on a clean `node_modules`; the bundle and startup figures
were re-measured after the review fixes (raw 560.1kB, gzip 171.9kB, brotli
145.2kB — the +0.3kB is the review's new code).

**Decision: no code splitting, and the warning is not suppressed.** 141kB brotli
is what a browser downloads; Cloudflare compresses automatically. Splitting would
buy nothing measurable and would put an `await` in front of save loading, which
currently assumes the whole content graph is present. Revisit past ~250kB
brotli, with a measurement. Reasoning in full in
[`DEPLOYMENT.md`](DEPLOYMENT.md#on-the-bundle-size-warning).

Other packaging checks:

- No missing assets, no stale source paths, no 4xx/5xx: 3 requests, all served.
- **Nothing fetched from any origin but its own** — no CDN, no font host, no
  analytics, no API.
- No absolute asset URLs; `base: './'` confirmed in the emitted HTML.
- No credentials in the static output: scanned for AWS key ids, private-key
  blocks, `sk-` secrets and credential literals.
- No console or page errors on a served origin.
- `.node-version` pins **22.23.4**, the current Pages v3 default;
  `engines.node` declares `>=22.12 <23`. Local runs were on **22.23.3**, one
  patch behind — stated rather than glossed.
- Dev and preview servers bind **127.0.0.1** explicitly in `vite.config.ts`. The
  verification host binds loopback on an ephemeral port and is closed in a
  `finally`. A project-wide sweep for `0.0.0.0`, `[::]`, `--host` and `listen(`
  found exactly one listener, loopback-bound.

---

## 5b. The soundtrack

Eight supplied tracks, mapped to the eight places and phases named in the
assignment. Filenames matched the slots one to one, so **no part of the mapping
is a guess** and there is nothing to refer back for clarification.

The one judgement call, stated rather than buried: **the cave theme starts at
the mouth.** `cave_path` is the open hill and keeps the village theme;
`entrance` is where the change happens. Full mapping with location ids in
`src/content/music.ts`; the player-facing table is in the README.

| Requirement | Evidence |
| --- | --- |
| One app-level controller, separate from the engine | `ui/soundtrack.ts` plus `ui/useSoundtrack.ts`. No import path from either into the engine; the mapping in `content/music.ts` is a pure function of `chapter` and `locationId` |
| Music never changes story state | Nothing in those files dispatches an action, sets a flag or writes to the transcript. 17 unit tests drive the controller with no engine present at all |
| Playback only after an explicit interaction | Nothing is created before `enable()`, which is only reached from a click. Checked on the wire: **no audio request at all** before the player asks, and none from the title screen |
| A clear, nonblocking "Enable music" before starting or continuing | A button beside New Game and Continue, `aria-pressed`, 44px tall, no dialog. Proceeding with it untouched is tested |
| Preference remembered; another interaction handled after reload | Stored in prefs; on reload the control reads *Start music* and a one-tap prompt appears in play, because a stored "yes" is not a gesture. A rejected `play()` flips a `blocked` flag once and never retries in a loop |
| Default volume 25% | `DEFAULT_VOLUME = 0.25`. Measured on the served build: `volume 0.25` |
| Re-entering a room, inspecting, settings, mode switch, rerender do not restart | `setTrack` is idempotent. Twenty repeat calls produce one element and one `play()`; verified in the browser that walking home → square → hill keeps a single source |
| ~1.5s crossfade | `FADE_MS = 1500`. Measured mid-fade on the served build: two audible sources at 0.167 and 0.083 against a 0.25 master, then one at 0.25 |
| Rapid room changes: obsolete fades cancelled, nothing orphaned | Seven changes a fifth of a fade apart never exceed two voices and settle on one. A separate test counts `clearInterval` calls to prove the old fade is cancelled rather than left running |
| Never more than the two sources a crossfade needs | Asserted at every step of the rapid-change test, and on the wire during a real transition |
| Pause when hidden, resume when visible | Pauses rather than releasing, so the position is kept. Measured: paused at 2.48s, resumed from 3.08s |
| Stop and clean up on teardown | `destroy()` pauses, clears sources, removes elements and kills the timer; the controller is inert afterwards. A test mounts, destroys and mounts again — React's development double-invoke — and finds one source, not two |
| Title screen stops gameplay music; no title theme | `playing` is false outside play, so `trackFor` is never consulted there. Enabling music on the title screen plays nothing, by design and by test |
| Seven area tracks loop; epilogue inspected | All eight loop. The epilogue has **no composed ending** — its level holds flat through the final four seconds — so playing it once would end the game mid-phrase. Measurements and the method in `art/music/README.md` |
| Looping works on iOS | **Fixed after a real-device report.** Media elements cannot do this job on iOS: Apple documents one audio stream at a time (so a crossfade is impossible) and `volume` as unsettable from script (so the 25% default, the fades and the slider were silently no-ops). The controller now decodes to an `AudioBuffer` and loops an `AudioBufferSourceNode` — sample-exact over PCM, no container, no seek, nothing to stall. Verified by playing a real track past its own length: peak 0.107 across twelve windows, no silent window. **Not yet confirmed on a device** |
| There is a signal, not just a running clock | An analyser tapped onto the master bus during a real playthrough: peak 0.1344 |
| Looping does not depend on `loop = true` | The flag is set **and** `ended` restarts the track by hand, because Safari has a long history of ignoring it on `audio`. Guarded so a released voice, a muted controller, a hidden page or a destroyed controller is never restarted by a late event. Eight unit tests, plus a served-build check that provokes `ended` against the real asset: 12.13s → 0.62s, still playing |
| Loop seams inspected, not assumed | No leading or trailing silence on any track; the level step across the wrap is 0.2–1.6 dB; the MP3s carry correct gapless tags (a decode round-trip returns the master's exact frame count). Observed in the browser: the clock wraps and playback continues, with the stall across a natural wrap measured at ~17ms (WebM/Opus) and ~33ms (MP3). **Not established: whether a browser honours the gapless tag when looping, and nobody has listened.** See [`KNOWN_ISSUES.md`](KNOWN_ISSUES.md) #11 |
| No musical material cut or altered | The conversions are whole-file encodes. Nothing trimmed, faded, re-normalised or re-timed |
| Ending review keeps the epilogue playing | Reviewing produces no new element and no second `play()`; the same element carries on |
| A completed save reloads to the epilogue, still asking permission | Tested as a save written to storage and resumed with Continue |
| Music on/off and a labelled volume slider with its number | Settings has both. The slider is labelled *Volume*, shows `25%` as text, and is tied to it with `aria-describedby`. 44px tall and keyboard-focusable |
| Persisted as UI preferences, apart from saves and exports | The `prefs` key. Not in the save, not in an export |
| Older preferences load with safe defaults | A pref written before the soundtrack existed keeps the player's choices and arrives music-off at 25%. A volume that is not a 0–1 number is refused |
| Mute immediate; volume live without restarting | Muting stops playback at once; the slider changes an element's volume with no new `play()`, including mid-crossfade, where only the master scales |
| Playable without audio; no clue depends on sound | A full playthrough with music never enabled creates no element. Nothing in the content layer refers to sound as a clue |
| Audio failures do not block input or repeat notices | Every path — rejected `play()`, a format it cannot play, a throwing constructor, a load error — is swallowed and reported at most once. Six tests |
| Same-origin static assets, base-path-safe | Imported, so Vite hashes them and rewrites against `base`. Verified: the page fetches from no origin but its own |
| Not in the JS bundle | `grep -c "data:audio" dist/assets/*.js` → 0. The JS grew 8.6kB for the controller and sixteen URL strings |
| Only the current track and its partner; not all eight at startup | After a full transition, exactly two files had ever been requested |
| Masters preserved | `art/music/*.wav`, 38 MB, not bundled |

## 6. Pending, and what it blocks

| Item | Status | What it affects |
| --- | --- | --- |
| **Human blind playtest** | **PENDING** — no sessions run, nobody contacted | Pacing, difficulty, whether the killing and the sacrifice land, whether the epilogue needs its own beat. **None of this is verified.** Code readiness does not speak to it |
| Real mobile browsers and devices | Not done | Software-keyboard behaviour, iOS Safari quirks, touch scrolling feel |
| A real screen reader | Not done | Whether the announcements are usable in practice, as opposed to structurally correct |
| **Soundtrack attribution and licence** | **MISSING — blocker** | No author, source or licence was supplied with the eight tracks, and none was invented. Must be settled or the tracks replaced before any deployment |
| Listening to the music | Not done | Loop seams, crossfade feel, per-track loudness, and whether 25% is right. Machine checks confirm it plays, not that it sounds right |
| Mobile audio | Not done | iOS Safari requires a gesture per element, which the crossfade's second source may not have. Most likely place for audio to fail, untested |
| Deployment | Not done, not authorized | Nothing published; no account, project or domain exists |
| Push | Not done | Commits are local. **If a Pages Git integration is ever connected, pushing the production branch deploys** — see `DEPLOYMENT.md` |

## 7. Before deploying

1. `npm ci`
2. `npm run check` — typecheck, tests, build
3. `npx playwright install chromium` if needed, then `npm run verify`
4. Read [`KNOWN_ISSUES.md`](KNOWN_ISSUES.md) and decide whether anything in it
   blocks the release
5. Decide the production address, and tell testers to use **only** that one —
   preview origins have separate saves
6. Deploy per [`DEPLOYMENT.md`](DEPLOYMENT.md), with the build command, output
   directory and root setting exactly as listed there
7. Load the deployed address, start a game, take one action, reload, press
   Continue. If that works, the origin works
8. Keep the spoiler documents out of anything a player is pointed at
