# Deploying to Cloudflare Pages

The build is a static site: one HTML file, one JS bundle, one stylesheet, and an
inline SVG favicon. No backend, no Pages Functions, no environment secrets, no
runtime network access of any kind — verified on the wire, see
[Verified on a served build](#verified-on-a-served-build).

**Nothing has been published.** No account has been configured, no project
created, no domain touched, and the source has not been pushed. This document is
the instructions and the evidence; performing the deployment is a separate,
explicitly authorized step.

Values below were re-read from current Cloudflare documentation on **2026-11-02**
(*Build image* and *Deploy a React site*). Re-check if significant time has
passed — Cloudflare's build image takes rolling updates.

## Build settings

| Setting | Value |
| --- | --- |
| Build command | **`npm run build`** |
| Build output directory | **`dist`** |
| Root directory | repository root — **leave blank** |
| Production branch | your default branch (Cloudflare's example is `main`) |
| Framework preset | **React** if offered; the three fields above are what actually matter |

`npm run build` runs `tsc --noEmit` and then `vite build`, so a type error fails
the deployment instead of shipping. `npm run build:only` skips the typecheck if
you ever want a build that types do not gate.

`vite.config.ts` sets `base: './'`, so the bundle works from the project root
URL, from a `*.pages.dev` preview address, and from a subpath. Confirmed: the
built HTML references `./assets/…` and nothing absolute.

### No SPA fallback needed

The Pages docs note that Pages assumes a single-page application by default,
meaning unknown paths are served `index.html`. That is harmless here and also
unnecessary: there is no client-side router and no URL the game navigates to.
Everything happens at `/`. If you prefer strict 404s, that is a Pages setting
and the game does not care either way.

## Node version

The current build image (**v3**) defaults to Node **22.23.4**. This repository
pins that version in **`.node-version`**, so the build does not move under you
when Cloudflare rolls the image forward. `package.json` also declares
`engines.node: ">=22.12 <23"` for local development.

To change the pin, edit `.node-version`, or set `NODE_VERSION` under
**Settings › Environment variables** in the Pages project.

Local verification for this release ran on Node **v22.23.3** / npm **10.9.9** —
one patch behind the build image's default. Nothing in the toolchain is sensitive
to that difference, but the build on Cloudflare will be the first run on
22.23.4.

## Reproducible install

```bash
npm ci          # exact versions from package-lock.json
npm run check   # typecheck, unit tests, production build
npm run verify  # build, then both browser verification passes
```

`npm ci` is what Cloudflare runs when it finds a `package-lock.json`, and it is
what you should run locally before trusting a verification number.

Playwright is a pinned devDependency (`1.64.1`); its browser is downloaded
separately and is **not** part of the deployed bundle:

```bash
npx playwright install chromium
```

## Dashboard route

1. **Workers & Pages › Create › Pages › Connect to Git**, and pick the
   repository.
2. Set the fields in [Build settings](#build-settings).
3. Deploy. Pushes to the production branch redeploy; other branches get preview
   deployments.

**If you connect Git, every subsequent push to the production branch deploys
automatically.** That is worth knowing before pushing anything: with a Git
integration in place there is no such thing as pushing without publishing.

## Wrangler route

For a direct upload of an already-built directory, with no Git integration and
therefore no automatic deploys:

```bash
npm ci
npm run build
npx wrangler pages deploy dist --project-name <your-project>
```

## Verified on a served build

`npm run verify:served` builds nothing itself; it serves an existing `dist/`
over real HTTP from **127.0.0.1 on an ephemeral port**, drives Chromium against
it, and watches the network. It exists because the other harness
(`verify:browser`) fulfils requests through Playwright's interception, which
answers whatever the page asks for and therefore cannot prove that the built
asset paths resolve the way a static host serves them.

The loopback bind is deliberate: it is a stand-in for Cloudflare for a few
seconds, and nothing about this project should ever be reachable from another
machine during development. There is no `--host` flag, no `0.0.0.0`, and no
fixed port anywhere in the repository; `vite.config.ts` pins `server.host` and
`preview.host` to `127.0.0.1` for the same reason.

What it establishes: that every asset the page asks for is served, that the
page fetches from no origin but its own, that no asset is pinned to an absolute
URL, that the static output contains no credentials, that there are no console
errors, and that the reading position survives a reload without being written
into the save.

Measured results for a specific revision are recorded in
[`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md), which is dated. This document
does not carry counts or timings that go stale.

### On the bundle-size warning

`vite build` warns that the JS chunk is over 500kB. Measured on 2026-11-02, that
chunk is **549kB raw / 141kB brotli**, which is what a browser actually
downloads from Cloudflare — Pages compresses automatically. The warning is about
a raw byte count that nobody transfers.

So the warning is **left in place and not suppressed**, and no code splitting
was introduced. Splitting would buy nothing measurable here and would cost
something real: the save-compatibility and migration paths assume the whole
content module graph is present when a save loads, and chapter-level lazy chunks
would put an await in front of that. If the bundle grows materially — say past
250kB brotli — revisit it then, with a measurement rather than the warning.

## Save storage across addresses

Saves live in `localStorage`, which is scoped per **origin** *and* per browser
profile. A production address and each preview address are separate origins, so
they have separate saves; a different browser or profile on the same address is
also a separate store. Exporting and importing a save is the only way to move
progress between any of them. This is stated to players in the Settings panel.

Practical consequences, worth saying out loud before a release:

- **Tell testers which address is the real one.** Progress made on a preview
  deployment does not follow them to production.
- **Export before changing origins**, before clearing site data, and before
  switching browsers. Settings › Export Save writes `adventure-save.json`.
- **Do not clear saves to fix a cache or migration problem.** Every shipped save
  format is still loadable and migrated on read; if a save will not load, it is
  quarantined under its own key rather than overwritten, and that is a bug
  report, not a reason to wipe anybody's progress.

## Nothing else is required

No API keys, no database, no serverless functions, no build-time secrets, no
analytics, no fonts or scripts from a CDN. Do not add a backend to deploy this.

If a host other than Cloudflare Pages is ever wanted, the requirements are:
serve `dist/` as static files over HTTPS, and serve `index.html` at the root.
That is the whole of it.

## A note on secrecy

The bundle is public and readable. Minified JavaScript is not obfuscation: the
entire story, every room description, the prophecy and the ending are in plain
strings in `index-*.js`, and anybody can read them with a text editor. Do not
promise testers that the twist is safe from somebody who wants to look for it.
Keep the spoiler documents (`docs/CANON.md`, `docs/FULL_GAME_*.md`,
`docs/WALKTHROUGH.md`) out of anything a player is pointed at — they are in the
repository, not in the deployed site, and the deployed site links to none of
them.
