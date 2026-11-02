#!/usr/bin/env python3
"""Inspect WAV masters: duration, level, silence, and the loop seam.

Standard library only — no audio package, and nothing installed. Run it on the
masters to reproduce the numbers in `art/music/README.md`:

    python3 scripts/inspect-audio.py art/music/*.wav

What each column means:

  peak        highest sample, in dBFS. All eight arrived at exactly -3.0.
  lead/tail   leading and trailing silence, in ms, at a -60 dBFS threshold.
              Zero on all eight, so no loop can gap from padding in the source.
  seam        the level step across the wrap point: the last 50 ms against the
              first 50 ms, in dB. Small means the loop is continuous; it says
              nothing about a click, which needs ears.
  tail trace  half-second windows over the final four seconds. A track with a
              composed ending decays here. None of these do, which is why the
              epilogue loops rather than playing once.
"""

from __future__ import annotations

import array
import math
import os
import sys
import wave

SILENCE_DBFS = -60.0
FULL_SCALE = 32768.0


def mono(path: str) -> tuple[array.array, int]:
    """Reads a 16-bit WAV as a single channel, mixing stereo down."""
    with wave.open(path, "rb") as handle:
        if handle.getsampwidth() != 2:
            raise SystemExit(f"{path}: expected 16-bit PCM, got {handle.getsampwidth() * 8}-bit")
        frames = handle.readframes(handle.getnframes())
        channels = handle.getnchannels()
        rate = handle.getframerate()
    samples = array.array("h")
    samples.frombytes(frames)
    if channels == 2:
        samples = array.array(
            "h", [(samples[i] + samples[i + 1]) // 2 for i in range(0, len(samples), 2)]
        )
    return samples, rate


def rms(window: array.array | memoryview) -> float:
    if not len(window):
        return 0.0
    total = sum(value * value for value in window)
    return math.sqrt(total / len(window))


def dbfs(amplitude: float) -> float:
    return -120.0 if amplitude <= 0 else 20 * math.log10(amplitude / FULL_SCALE)


def silence_run(samples: array.array, rate: int, from_end: bool) -> int:
    """Milliseconds of silence at one end, at the threshold above."""
    window = max(1, rate // 100
                 )
    limit = FULL_SCALE * (10 ** (SILENCE_DBFS / 20))
    run = 0
    if from_end:
        cursor = len(samples)
        while cursor - window >= 0 and rms(samples[cursor - window : cursor]) < limit:
            run += window
            cursor -= window
    else:
        cursor = 0
        while cursor + window <= len(samples) and rms(samples[cursor : cursor + window]) < limit:
            run += window
            cursor += window
    return run * 1000 // rate


def inspect(path: str) -> None:
    samples, rate = mono(path)
    seconds = len(samples) / rate
    peak = max(max(samples), -min(samples))
    half = max(1, rate // 20)
    seam = abs(dbfs(rms(samples[-half:])) - dbfs(rms(samples[:half])))
    step = max(1, rate // 2)
    tail = [
        round(dbfs(rms(samples[i : i + step])), 1)
        for i in range(max(0, len(samples) - step * 8), len(samples), step)
    ]
    print(
        f"{os.path.basename(path):<22}"
        f"{int(seconds // 60)}:{int(seconds % 60):02d}  "
        f"peak {dbfs(peak):>6.1f}  "
        f"lead {silence_run(samples, rate, False):>4}ms  "
        f"tail {silence_run(samples, rate, True):>4}ms  "
        f"seam {seam:>4.1f}dB"
    )
    print(f"{'':22}tail trace (0.5s windows, dBFS): {tail}")


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    for path in argv[1:]:
        inspect(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
