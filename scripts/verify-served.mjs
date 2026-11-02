/*
 * Verification against a normally served production build.
 *
 * The other harness (verify-browser.mjs) fulfils every request from disk
 * through Playwright's interception. That is fast and needs no socket, but it
 * cannot tell you whether the built asset paths actually resolve the way a
 * static host will serve them — interception answers whatever the page asks
 * for. This one serves `dist/` over real HTTP and watches the wire.
 *
 * ## Exposure
 *
 * The server binds **127.0.0.1 only**, on an ephemeral port, for the lifetime
 * of this script, and is closed in a `finally`. Nothing here is reachable from
 * another machine, and the game needs no backend in production: this process
 * exists to stand in for Cloudflare Pages for a few seconds, not to host
 * anything. There is deliberately no `--host`, no `0.0.0.0`, and no fixed port.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { gzipSync, brotliCompressSync } from 'node:zlib';

const DIST = process.argv[2] ?? 'dist';
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

const results = [];
const ok = (name, detail = '') => {
  results.push(['PASS', name, detail]);
  console.log(`PASS  ${name}${detail ? `  — ${detail}` : ''}`);
};
const bad = (name, detail = '') => {
  results.push(['FAIL', name, detail]);
  console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`);
};

/* ---------- a plain static host, on loopback only ---------- */

const served = [];
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const rel = url.pathname.replace(/^\/+/, '') || 'index.html';
  const file = path.join(DIST, rel);
  // No traversal out of the build, the same as any sane static host.
  if (!path.resolve(file).startsWith(path.resolve(DIST))) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    const body = await readFile(file);
    served.push({ rel, status: 200, bytes: body.byteLength });
    res.writeHead(200, {
      'content-type': TYPES[path.extname(rel)] ?? 'application/octet-stream',
      'content-length': String(body.byteLength),
    });
    res.end(body);
  } catch {
    /*
     * Cloudflare Pages serves index.html for unknown paths only when asked to.
     * This host does not: a 404 here is a real missing asset, which is exactly
     * what this harness is for.
     */
    served.push({ rel, status: 404, bytes: 0 });
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
  }
});

await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const { address, port, family } = server.address();
const ORIGIN = `http://127.0.0.1:${port}`;
console.log(`serving ${DIST} at ${ORIGIN} (bound ${address}, ${family})`);
address === '127.0.0.1'
  ? ok('the verification host is bound to loopback only', `${address}:${port}`)
  : bad('the verification host is not loopback', `${address}:${port}`);

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}
);

try {
  /* ---------- 1. It loads as a static site, over the wire ---------- */
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await context.newPage();
  const errors = [];
  const failed = [];
  const responses = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('requestfailed', (r) => failed.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => responses.push({ url: r.url(), status: r.status() }));

  await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle' });

  const broken = responses.filter((r) => r.status >= 400);
  broken.length === 0
    ? ok('every asset the page asks for is served', `${responses.length} requests, no 4xx/5xx`)
    : bad('assets are missing from the build', JSON.stringify(broken.slice(0, 4)));

  failed.length === 0
    ? ok('no request failed at the transport level')
    : bad('a request failed', failed.slice(0, 3).join(' | '));

  // Nothing may be fetched from anywhere but this origin: no CDN, no font
  // host, no analytics, no API. The game is a static bundle or it is not.
  const offsite = responses.filter((r) => !r.url.startsWith(ORIGIN) && !r.url.startsWith('data:'));
  offsite.length === 0
    ? ok('the built game talks to nothing but its own origin')
    : bad('the built game fetches from elsewhere', JSON.stringify(offsite.slice(0, 4)));

  const titled = await page.getByRole('button', { name: 'New Game' }).count();
  titled === 1
    ? ok('the title screen renders from a normally served build')
    : bad('the title screen did not render', `New Game buttons: ${titled}`);

  /* ---------- 2. Relative asset paths ---------- */
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll('script[src], link[href]')].map(
      (el) => el.getAttribute('src') ?? el.getAttribute('href')
    )
  );
  const absolute = hrefs.filter((h) => h && /^https?:\/\//.test(h));
  absolute.length === 0
    ? ok('no asset is pinned to an absolute external URL', hrefs.join(' '))
    : bad('an asset is pinned to an absolute URL', absolute.join(' '));

  /* ---------- 3. Transfer size, measured rather than guessed ---------- */
  const sizes = [];
  for (const h of hrefs) {
    if (!h) continue;
    const rel = h.replace(/^[./]+/, '');
    try {
      const body = await readFile(path.join(DIST, rel));
      sizes.push({
        rel,
        raw: body.byteLength,
        gzip: gzipSync(body).byteLength,
        brotli: brotliCompressSync(body).byteLength,
      });
    } catch {
      /* reported by the 404 check above */
    }
  }
  const html = await stat(path.join(DIST, 'index.html'));
  const total = sizes.reduce(
    (acc, s) => ({ raw: acc.raw + s.raw, gzip: acc.gzip + s.gzip, brotli: acc.brotli + s.brotli }),
    { raw: html.size, gzip: html.size, brotli: html.size }
  );
  const kb = (n) => `${(n / 1024).toFixed(1)}kB`;
  console.log(
    `transfer: raw ${kb(total.raw)}, gzip ${kb(total.gzip)}, brotli ${kb(total.brotli)}` +
      `\n  ${sizes.map((s) => `${s.rel} ${kb(s.raw)} → br ${kb(s.brotli)}`).join('\n  ')}`
  );
  // A single-request-per-asset static game. The gate is what a phone actually
  // downloads, not what the bundler warns about.
  total.brotli < 250 * 1024
    ? ok('compressed transfer is small enough to not need splitting', `brotli ${kb(total.brotli)}`)
    : bad('compressed transfer is larger than expected', `brotli ${kb(total.brotli)}`);

  /* ---------- 4. Startup cost ---------- */
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
      loaded: Math.round(nav.loadEventEnd - nav.startTime),
      firstPaint: Math.round(
        performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? -1
      ),
    };
  });
  console.log(`startup: ${JSON.stringify(timing)}`);
  timing.loaded >= 0 && timing.loaded < 3000
    ? ok('the built game is interactive quickly on a served origin', `load ${timing.loaded}ms`)
    : bad('startup is slower than expected', JSON.stringify(timing));

  /* ---------- 5. No secrets in the static output ---------- */
  const text = [];
  for (const rel of ['index.html', ...sizes.map((s) => s.rel)]) {
    try {
      text.push(await readFile(path.join(DIST, rel), 'utf8'));
    } catch {
      /* ignore */
    }
  }
  const joined = text.join('\n');
  const secrets = [
    [/AKIA[0-9A-Z]{16}/, 'an AWS access key id'],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
    [/\b(api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{12,}["']/i, 'a credential literal'],
    [/\bsk-[A-Za-z0-9]{20,}/, 'an API secret'],
  ];
  const found = secrets.filter(([re]) => re.test(joined)).map(([, what]) => what);
  found.length === 0
    ? ok('no credentials or keys in the static output')
    : bad('the static output contains a secret', found.join(', '));

  /* ---------- 6. A real playthrough start, and a real reload ---------- */
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: 'Play as Basil', exact: true }).click();
  await page.waitForTimeout(300);

  const opening = await page.evaluate(() => {
    const t = document.querySelector('.transcript');
    return { scrollTop: Math.round(t.scrollTop), text: t.textContent.slice(0, 40) };
  });
  opening.scrollTop === 0
    ? ok('a new game opens at the top over a served origin')
    : bad('a new game did not open at the top', JSON.stringify(opening));

  // Switch to typing and play far enough that the transcript overflows.
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('radio', { name: 'Type-only' }).click();
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Close' }).click();
  for (const line of ['take lantern', 'down', 'look', 'east', 'look', 'west', 'look']) {
    await page.getByLabel('What do you do?').fill(line);
    await page.getByLabel('What do you do?').press('Enter');
    await page.waitForTimeout(140);
  }
  await page.waitForTimeout(900);

  // Put the reader somewhere specific, then reload and Continue.
  const left = await page.evaluate(async () => {
    const t = document.querySelector('.transcript');
    t.scrollTop = Math.round((t.scrollHeight - t.clientHeight) * 0.4);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const tr = t.getBoundingClientRect();
    for (const c of t.children) {
      const rect = c.getBoundingClientRect();
      if (rect.bottom - tr.top > 0) {
        return { text: c.textContent.slice(0, 50), offset: +(rect.top - tr.top).toFixed(1) };
      }
    }
    return null;
  });
  // The mark is throttled; give it a moment and a pagehide to flush.
  await page.waitForTimeout(1800);
  await page.evaluate(() => {
    document.querySelector('.transcript').scrollBy(0, 1);
  });
  await page.waitForTimeout(300);
  const stored = await page.evaluate(() => localStorage.getItem('cave-of-absolution:reading'));
  stored !== null
    ? ok('the reading position is stored outside the save', stored)
    : bad('no reading position was stored');

  const inSave = await page.evaluate(() =>
    (localStorage.getItem('cave-of-absolution:save') ?? '').includes('"offset"')
  );
  !inSave
    ? ok('the save carries no reading position')
    : bad('the reading position leaked into the save');

  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Continue/ }).click();
  await page.waitForTimeout(500);
  const resumedAt = await page.evaluate((want) => {
    const t = document.querySelector('.transcript');
    const tr = t.getBoundingClientRect();
    for (const c of t.children) {
      if (c.textContent.slice(0, 50) === want.text) {
        return {
          found: true,
          offset: +(c.getBoundingClientRect().top - tr.top).toFixed(1),
          fromBottom: +(t.scrollHeight - t.scrollTop - t.clientHeight).toFixed(1),
        };
      }
    }
    return { found: false, fromBottom: +(t.scrollHeight - t.scrollTop - t.clientHeight).toFixed(1) };
  }, left);
  resumedAt.found && Math.abs(resumedAt.offset - left.offset) <= 6
    ? ok('reload resumes where the reader was reading', `${left.offset}px -> ${resumedAt.offset}px`)
    : bad('reload did not resume the reading position', JSON.stringify({ left, resumedAt }));

  errors.length === 0
    ? ok('no console or page errors on a served origin')
    : bad('console errors on a served origin', errors.slice(0, 3).join(' | '));

  /* ---------- 7. Origin isolation, stated honestly ---------- */
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto(`${ORIGIN}/`, { waitUntil: 'networkidle' });
  const sharesStorage = await otherPage.evaluate(
    () => localStorage.getItem('cave-of-absolution:save') !== null
  );
  // A fresh browser profile is a fresh store even on the same origin, which is
  // the honest shape of the claim in DEPLOYMENT.md: saves are per-origin and
  // per-profile, and the only portable copy is an export.
  !sharesStorage
    ? ok('a different browser profile starts with no save, as documented')
    : bad('storage crossed browser profiles', 'unexpected');
  await other.close();
  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

const failures = results.filter((r) => r[0] === 'FAIL');
console.log(`\n${results.length - failures.length}/${results.length} served-build checks passed`);
process.exit(failures.length === 0 ? 0 : 1);
