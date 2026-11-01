# Deploying to Cloudflare Pages

The build is a static site: HTML, one JS bundle, one stylesheet. No backend, no
functions, no environment secrets, no runtime network access beyond fetching
those files.

Values below were read from current Cloudflare documentation on 2026-11-01
(*Deploy a React site*, *Git integration*, and *Build image*). **No deployment
has been performed from this repository** — nothing has been published and no
account has been configured. Re-check the docs if significant time has passed.

## Build settings

| Setting | Value |
| --- | --- |
| Framework preset | **React** |
| Build command | **`npm run build`** |
| Build output directory | **`dist`** |
| Root directory | repository root (leave blank) |
| Production branch | your default branch (Cloudflare's example is `main`) |

`npm run build` runs `tsc --noEmit` and then `vite build`, so a type error fails
the deployment rather than shipping. If you would rather types not gate a
deploy, use `npm run build:only`.

`vite.config.ts` sets `base: './'`, so the bundle works from the project root
URL, from a `*.pages.dev` preview address, and from a subpath.

## Node version

The current Cloudflare Pages build image (v3) defaults to Node **22.23.4**,
which satisfies this project's toolchain. The docs note that v3 receives rolling
updates, so pin it if you want reproducibility — either set the `NODE_VERSION`
environment variable in **Settings › Environment variables**, or commit a
`.node-version` or `.nvmrc` file containing a full version number.

## Dashboard route

1. **Workers & Pages › Create › Pages › Connect to Git**, and pick the
   repository.
2. Set the fields above.
3. Deploy. Pushes to the production branch redeploy; other branches get preview
   deployments.

## Wrangler route

For a direct upload of an already-built directory:

```bash
npm run build
npx wrangler pages deploy dist --project-name <your-project>
```

## Save storage across addresses

Saves live in `localStorage`, which is scoped per **origin**. A production
address and each preview address are separate origins, so they have separate
saves. Exporting and importing a save is the only way to move progress between
them. This is stated to players in the Settings panel.

## Nothing else is required

No API keys, no database, no serverless functions, no build-time secrets. Do not
add a backend to deploy this. If a host other than Cloudflare Pages is ever
wanted, the only requirements are: serve `dist/` as static files, and serve
`index.html` for the root path. There is no client-side router, so no SPA
fallback rule is needed.
