# The soundtrack masters

Eight supplied WAV masters. **Not bundled** — Vite emits only what `src/`
imports, so these cost nothing in the deployed site and exist so the delivery
copies can be regenerated rather than recovered.

## Attribution and licence

**Not supplied, and not invented here.** No author, source or licence came with
these files, so none is stated anywhere in the repository or the game.

If the tracks are not original work made for this project, the attribution and
licence terms need filling in — in this file and in a player-visible credit —
**before release**. Shipping audio with unknown provenance is a licensing
problem, not a documentation one. It is recorded as an open item in
[`docs/KNOWN_ISSUES.md`](../../docs/KNOWN_ISSUES.md).

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

**What has not been established:** whether a given browser honours that tag
when *looping a media element*, as opposed to decoding the file. A browser that
ignores it will insert roughly 20–30 ms of encoder delay at each wrap on the MP3
path. That is the main reason WebM/Opus is preferred where it is available, and
it is why the loop is described here as measured rather than as seamless.

**Nobody has listened to a loop wrap.** The automated check confirms the clock
wraps and playback continues; it cannot hear a click. See
[`docs/KNOWN_ISSUES.md`](../../docs/KNOWN_ISSUES.md).

## Measuring again

The analysis used Python's `wave` module only — no audio library:

```bash
# Duration, channels, peak, leading/trailing silence, and the wrap-point step.
python3 scripts/inspect-audio.py art/music/*.wav
```
