# Source art

Masters. **Nothing in here is bundled** — Vite only emits what `src/` imports,
so these files cost nothing in the deployed site and exist so the shipped
versions can be regenerated rather than recovered.

| Master | Shipped as | How |
| --- | --- | --- |
| `title-source.png` — 2172×724, 870kB | `src/assets/title.png` — 530×179, 18kB | see below |
| `music/*.wav` — eight tracks, 38 MB | `src/assets/music/*.{webm,mp3}` — 4.26 MB + 5.17 MB | [`music/README.md`](music/README.md) |

The soundtrack has its own notes, because the conversions, the loop
measurements and the **missing attribution and licence** all need recording:
see [`music/README.md`](music/README.md).

## The title wordmark

The master is a 4×-upscaled export with soft edges and ~50,000 unique colours,
which is why it is 870kB for a word. The shipped asset is the same artwork at
its native pixel grid, which the browser then scales back up with
`image-rendering: pixelated` — so it renders as hard blocks at any size and on
any display density, rather than as a blurry large bitmap.

To regenerate it (ImageMagick):

```bash
convert art/title-source.png -trim +repage \
        -filter point -resize 25% \
        -strip -colors 64 PNG8:src/assets/title.png
```

- `-trim` drops the transparent margin; the layout controls spacing instead.
- `-resize 25%` with `-filter point` is nearest-neighbour at the art's own
  scale factor. The factor was found by round-tripping candidates and measuring
  RMSE against the master: ÷2 and ÷4 are near-lossless, ÷3 and ÷6 are not, so
  the grid is a power of two.
- `-colors 64` is where almost all of the saving is. The result uses 55.

Keep the master if the wordmark is ever re-cut. Do not import from this
directory.
