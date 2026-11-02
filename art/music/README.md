# The soundtrack masters

Eight WAV masters. **Not bundled** — Vite emits only what `src/` imports, so
these cost nothing in the deployed site and exist so the delivery copies can be
regenerated rather than recovered.

## Attribution

**Original work, written for this game by the project's owner** — stated by them
on 2026-11-02. All eight tracks, solely.

So there is no third-party licence to honour and nothing to clear: the game
ships the owner's own music. Nothing further is required before release, and
this file does not invent terms that were not given.

Two things that remain the owner's choice rather than an obligation:

- **A credit in the game.** There is none at present. Worth one if the music is
  to be attributed to a person by name anywhere a player can see.
- **A licence, if the files are ever published separately** from the game — in
  a repository, a soundtrack release, or anywhere a third party might reuse
  them. Not needed for shipping them inside the game.

## What was supplied

All eight: **mono, 44.1 kHz, 16-bit PCM**, peak exactly −3.0 dBFS (so they
arrived normalised to a common ceiling), with **no leading or trailing
silence** on any of them.

| Track | Length | Master WAV | WebM/Opus | MP3 |
| --- | --- | --- | --- | --- |
| `epilogue` | 0:25 | 2.1 MB | **247 kB** | 300 kB |
| `final_boss` | 1:03 | 5.4 MB | **617 kB** | 749 kB |
| `future_cave` | 1:03 | 5.4 MB | **617 kB** | 749 kB |
| `future_village` | 0:57 | 4.8 MB | **556 kB** | 675 kB |
| `past_cave` | 0:59 | 5.0 MB | **576 kB** | 699 kB |
| `past_village` | 1:03 | 5.4 MB | **617 kB** | 749 kB |
| `present_cave` | 0:57 | 4.8 MB | **556 kB** | 675 kB |
| `present_village` | 0:59 | 5.0 MB | **576 kB** | 699 kB |
| **total** | | 38.0 MB | **4.26 MB** | 5.17 MB |

Only one variant of one track is ever downloaded at a time. The totals are what
the repository stores, not what a player transfers.

**Nothing was cut, trimmed, faded, normalised or re-timed.** The conversions
below are encodes of the whole file, start to finish.

## Conversions

Two formats, because no single one covers every browser:

- **WebM/Opus, 64 kbit/s** — preferred. Opus carries its own pre-skip, so a
  looping media element has no container padding to stumble over, and it is
  about 18% smaller than the MP3. Chrome, Firefox, Edge.
- **MP3, 96 kbit/s mono (LAME `-q 2`)** — the fallback, and the only reason
  Safari gets music at all. Per MDN's audio codec guide (read 2026-11-02),
  Safari supports neither Vorbis nor Opus in Ogg or WebM; it supports Opus only
  in CAF. MP3 it is.

`src/assets/music/index.ts` picks between them with `canPlayType`, so exactly
one is requested.

To regenerate (GStreamer for Opus, LAME for MP3):

```bash
for f in art/music/*.wav; do
  n=$(basename "$f" .wav)
  gst-launch-1.0 -q filesrc location="$PWD/$f" ! wavparse ! audioconvert \
    ! audioresample ! opusenc bitrate=64000 ! webmmux \
    ! filesink location="$PWD/src/assets/music/$n.webm"
  lame --quiet -m m -b 96 -q 2 "$f" "src/assets/music/$n.mp3"
done
```

## Loops

Seven tracks loop by design. The eighth — the epilogue — **also loops**, and
that was a measurement rather than an assumption.

### The epilogue has no composed ending

The brief asks for a single playback if it has one. Sampled in half-second
windows, its final four seconds read:

```
-13.8  -13.4  -13.2  -14.0  -12.8  -14.5  -14.4  -13.6  dBFS
```

That is a level holding flat to the last sample: no decay, no ritardando, no
trailing silence. Playing it once would end the game in silence partway through
a held phrase. So it loops, like the rest.

### What the loop seam actually is

Measured, not assumed:

- **No track has leading or trailing silence**, so no loop can gap because of
  padding in the source material.
- **Level across the wrap point** (last 50 ms against first 50 ms) differs by
  0.2–1.6 dB depending on the track. Continuous, with a small step on three of
  them — audible as a slight change in loudness at the seam, not as a hole.
- **The MP3s carry correct gapless metadata.** Decoding `final_boss.mp3` back
  to PCM returns 2,817,770 frames against the master's 2,817,770 — exactly
  equal, so LAME's Xing/LAME tag is present and its own decoder honours it.

### None of that governs playback any more

**This is where the first implementation was wrong, and it was wrong only on
iOS.** It crossfaded two `HTMLAudioElement`s using `volume`, which works on
desktop and cannot work on iOS, where Apple documents that *"only one audio or
video stream can play at a time"* and that `volume` *"is not settable in
JavaScript"*. On a real iPhone each track played once and then stopped.

The controller now decodes each track into an `AudioBuffer` and loops an
`AudioBufferSourceNode`. That loop is sample-exact over PCM: no container, no
seek at the wrap, no encoder padding, nothing to stall. So the gapless-tag
question above no longer affects anything — the measurements are kept because
they describe the *files*, which are unchanged.

For the record, the media-element behaviour that was measured before the
change: Chromium wrapped cleanly, with a stall of ~17 ms (WebM/Opus) and ~33 ms
(MP3) — one or two frames, since looping an element performs a real seek
(`seeking`, `waiting`, `seeked`).

**Verified after the change:** a real track played past its own length keeps
sounding — peak 0.107 across twelve sampling windows past the 59.6 s mark, with
no silent window — and **confirmed working on iOS Chrome** against the deployed
site by the owner, which is where the original report came from. **Nobody has
listened for a seam** at the wrap. See
[`docs/KNOWN_ISSUES.md`](../../docs/KNOWN_ISSUES.md).

## Measuring again

The analysis used Python's `wave` module only — no audio library:

```bash
# Duration, channels, peak, leading/trailing silence, and the wrap-point step.
python3 scripts/inspect-audio.py art/music/*.wav
```
