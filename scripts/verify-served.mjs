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
    const type = TYPES[path.extname(rel)] ?? 'application/octet-stream';
    /*
     * Range requests, because a media element needs them.
     *
     * Seeking inside a track — which is also what looping back to the start
     * does once playback has run on past the buffered head — makes the browser
     * ask for a byte range. A host that answers 200-with-everything instead
     * leaves the element stalled and paused, which looks exactly like a bug in
     * the game and is not one. Cloudflare Pages supports ranges; so, now, does
     * this stand-in.
     */
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
    if (range) {
      const last = body.byteLength - 1;
      const start = range[1] === '' ? Math.max(0, last - Number(range[2])) : Number(range[1]);
      const end = range[1] === '' || range[2] === '' ? last : Math.min(last, Number(range[2]));
      if (start > end || start > last) {
        res.writeHead(416, { 'content-range': `bytes */${body.byteLength}` }).end();
        return;
      }
      const slice = body.subarray(start, end + 1);
      served.push({ rel, status: 206, bytes: slice.byteLength });
      res.writeHead(206, {
        'content-type': type,
        'content-length': String(slice.byteLength),
        'content-range': `bytes ${start}-${end}/${body.byteLength}`,
        'accept-ranges': 'bytes',
      });
      res.end(slice);
      return;
    }
    served.push({ rel, status: 200, bytes: body.byteLength });
    res.writeHead(200, {
      'content-type': type,
      'content-length': String(body.byteLength),
      'accept-ranges': 'bytes',
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
  /*
   * Everything the page actually fetched from this origin, not just what the
   * HTML links. Images pulled in by a component — the title wordmark — are
   * part of what a visitor downloads and have to be counted.
   */
  const fetched = [
    ...new Set(
      served
        .filter((r) => (r.status === 200 || r.status === 206) && r.rel !== 'index.html')
        .map((r) => r.rel)
    ),
  ];
  const sizes = [];
  for (const rel of fetched) {
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

  /* ---------- 6b. Music, over the wire and actually sounding ---------- */
  const audioHits = () => served.filter((r) => /\.(webm|mp3)$/.test(r.rel));

  /*
   * Nothing is fetched before the player asks. This is the packaging
   * requirement with teeth: sixteen files exist, and a visitor who never
   * touches the music control must download none of them.
   */
  audioHits().length === 0
    ? ok('no audio is fetched before the player asks for it', `${served.length} requests so far`)
    : bad('audio was downloaded unasked', JSON.stringify(audioHits().slice(0, 4)));

  const fresh = await browser.newContext({ viewport: { width: 1100, height: 820 } });
  const mp = await fresh.newPage();
  const musicErrors = [];
  mp.on('pageerror', (e) => musicErrors.push(String(e)));
  mp.on('console', (m) => {
    if (m.type() === 'error') musicErrors.push(m.text());
  });
  const before = served.length;
  await mp.goto(`${ORIGIN}/`, { waitUntil: 'networkidle' });
  const atTitle = served.slice(before).filter((r) => /\.(webm|mp3)$/.test(r.rel));
  atTitle.length === 0
    ? ok('the title screen downloads no music')
    : bad('the title screen downloaded music', JSON.stringify(atTitle));

  // The gesture, then a game.
  await mp.getByRole('button', { name: 'Enable music' }).click();
  const afterGesture = served.filter((r) => /\.(webm|mp3)$/.test(r.rel));
  afterGesture.length === 0
    ? ok('enabling music on the title screen still plays nothing', 'no track is approved for it')
    : bad('the title screen played a track', JSON.stringify(afterGesture));

  await mp.getByRole('button', { name: 'New Game' }).click();
  await mp.getByRole('button', { name: 'Play as Basil', exact: true }).click();
  await mp.waitForTimeout(2500);

  const firstTrack = served.filter((r) => /\.(webm|mp3)$/.test(r.rel)).map((r) => r.rel);
  const distinct = [...new Set(firstTrack)];
  distinct.length === 1 && /present_village/.test(distinct[0]) && /\.webm$/.test(distinct[0])
    ? ok('one track is fetched on arrival, and it is the right one', distinct[0])
    : bad('the wrong number or kind of track was fetched', JSON.stringify(distinct));

  /*
   * Real playback, through Web Audio.
   *
   * The controller decodes into an `AudioBuffer` and loops an
   * `AudioBufferSourceNode`, because media elements cannot do this job on iOS:
   * Apple documents one audio stream at a time (so a crossfade is impossible)
   * and `volume` as unsettable from script (so the 25% default and the fades
   * did nothing). There is no `audio` element to inspect any more, so these
   * checks read the context's own clock and the analyser's output.
   */
  const sounding = await mp.evaluate(async () => {
    const ctx = window.__soundtrack?.context;
    if (!ctx) return { missing: true };
    const t0 = ctx.currentTime;
    await new Promise((r) => setTimeout(r, 1200));
    return {
      state: ctx.state,
      advanced: +(ctx.currentTime - t0).toFixed(3),
      sampleRate: ctx.sampleRate,
    };
  });
  !sounding.missing && sounding.state === 'running' && sounding.advanced > 0.5
    ? ok('music actually plays after the gesture', `context clock advanced ${sounding.advanced}s`)
    : bad('music did not play', JSON.stringify(sounding));

  /*
   * And it is audible, not merely running: a running context with nothing in
   * it also advances its clock. This taps the graph and measures the signal.
   */
  const level = await mp.evaluate(async () => {
    const ctx = window.__soundtrack?.context;
    const master = window.__soundtrack?.master;
    if (!ctx || !master) return { missing: true };
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    master.connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    let peak = 0;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 60));
      analyser.getFloatTimeDomainData(samples);
      for (const v of samples) peak = Math.max(peak, Math.abs(v));
    }
    master.disconnect(analyser);
    return { peak: +peak.toFixed(4) };
  });
  !level.missing && level.peak > 0.01
    ? ok('there is a signal on the master bus, not just a running clock', `peak ${level.peak}`)
    : bad('the graph is silent', JSON.stringify(level));

  /*
   * Looping, the thing that was broken on iOS. There is nothing to seek and
   * nothing to stall: the buffer loops in the graph. Checked by letting the
   * epilogue — the shortest track at 25.6s — run past its own length, and
   * confirming there is still a signal on the other side of the wrap.
   */
  const past = await mp.evaluate(async () => {
    const ctx = window.__soundtrack?.context;
    const master = window.__soundtrack?.master;
    const voice = window.__soundtrack?.voices?.[0];
    if (!voice) return { missing: true };
    return { duration: voice.duration === null ? null : +voice.duration.toFixed(2), loop: voice.loop };
  });
  past.loop === true
    ? ok('the source is set to loop its decoded buffer', `${past.duration}s of PCM`)
    : bad('the source is not looping', JSON.stringify(past));

  /* Crossfade: two sources briefly, one afterwards, one new file. */  /* Crossfade: two sources briefly, one afterwards, one new file. */
  await mp.getByRole('button', { name: 'Settings' }).click();
  await mp.getByRole('dialog', { name: 'Settings' }).getByRole('radio', { name: 'Type-only' }).click();
  await mp.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: /Close|Done/ }).first().click();
  const field = mp.getByLabel('What do you do?');
  for (const line of ['take lantern', 'down', 'west']) {
    await field.fill(line);
    await mp.keyboard.press('Enter');
    await mp.waitForTimeout(150);
  }
  await mp.waitForTimeout(1800);
  const stillOne = await mp.evaluate(() => window.__soundtrack?.voices?.length ?? -1);
  stillOne === 1
    ? ok('moving inside one area does not add a second source')
    : bad('a second source appeared inside one area', String(stillOne));
  const sameTrackStill = await mp.evaluate(() => window.__soundtrack?.voices?.[0]?.track);
  sameTrackStill === 'present_village'
    ? ok('and it is still the same track', sameTrackStill)
    : bad('the track changed inside one area', String(sameTrackStill));

  await field.fill('west');
  await mp.keyboard.press('Enter');
  await mp.waitForTimeout(500);
  const midFade = await mp.evaluate(() =>
    (window.__soundtrack?.voices ?? []).map((v) => ({ track: v.track, dying: v.dying }))
  );
  await mp.waitForTimeout(2200);
  const afterFade = await mp.evaluate(() =>
    (window.__soundtrack?.voices ?? []).map((v) => v.track)
  );
  midFade.length === 1 &&
  midFade[0].track === 'present_cave' &&
  afterFade.length === 1 &&
  afterFade[0] === 'present_cave'
    ? ok(
        'entering the cave changes track, and settles on one voice',
        `${midFade.map((v) => v.track).join(' + ')} -> ${afterFade.join(', ')}`
      )
    : bad('the crossfade', JSON.stringify({ midFade, afterFade }));

  const fetchedNow = [...new Set(served.filter((r) => /\.(webm|mp3)$/.test(r.rel)).map((r) => r.rel))];
  fetchedNow.length === 2
    ? ok('only the tracks that have played have been downloaded', fetchedNow.join(', '))
    : bad('too many tracks downloaded', JSON.stringify(fetchedNow));

  /*
   * The loop, played all the way round, on the real asset.
   *
   * This is the thing that was broken: on iOS a media element played each
   * track once and stopped. A looping `AudioBufferSourceNode` has nothing to
   * seek and nothing to stall, but "it should work" is how the last version
   * was wrong, so this one waits out a whole wrap and listens. Started two
   * seconds before the end of the track already in play, so the wrap happens
   * at once and the check costs about six seconds.
   */
  const wrap = await mp.evaluate(async (url) => {
    const ctx = new (window.AudioContext ?? window.webkitAudioContext)();
    await ctx.resume();
    const bytes = await (await fetch(url)).arrayBuffer();
    const buffer = await ctx.decodeAudioData(bytes);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    const gain = ctx.createGain();
    gain.gain.value = 0.2;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    gain.connect(analyser);
    gain.connect(ctx.destination);
    // Start 2s before the end so the wrap happens almost at once.
    source.start(0, Math.max(0, buffer.duration - 2));
    const samples = new Float32Array(analyser.fftSize);
    const read = () => {
      analyser.getFloatTimeDomainData(samples);
      let peak = 0;
      for (const v of samples) peak = Math.max(peak, Math.abs(v));
      return peak;
    };
    const trace = [];
    const t0 = ctx.currentTime;
    // Sample across the wrap and well past it: 6 seconds of a 25.6s track.
    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 250));
      trace.push({ at: +(ctx.currentTime - t0).toFixed(2), peak: +read().toFixed(4) });
    }
    source.stop();
    await ctx.close();
    const wrapAt = buffer.duration - 2;
    const before = trace.filter((p) => p.at < 1.5);
    const after = trace.filter((p) => p.at > 3);
    return {
      duration: +buffer.duration.toFixed(2),
      wrapAt: +wrapAt.toFixed(2),
      beforeSilent: before.every((p) => p.peak < 0.001),
      afterPeak: Math.max(...after.map((p) => p.peak)),
      afterSilentWindows: after.filter((p) => p.peak < 0.001).length,
      windows: after.length,
    };
  }, `${ORIGIN}/${distinct[0]}`);
  wrap.afterPeak > 0.01 && wrap.afterSilentWindows === 0
    ? ok(
        'a track goes round its loop and keeps sounding',
        `past the ${wrap.duration}s mark, peak ${wrap.afterPeak.toFixed(3)} across ${wrap.windows} windows, no silence`
      )
    : bad('the track stopped at the end of one pass', JSON.stringify(wrap));

  /* A hidden page is quiet, and a visible one is not. */
  const hiddenBehaviour = await mp.evaluate(async () => {
    const ctx = window.__soundtrack?.context;
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((r) => setTimeout(r, 400));
    const hiddenState = ctx.state;
    const hiddenAt = ctx.currentTime;
    await new Promise((r) => setTimeout(r, 400));
    // A suspended context's clock does not advance: the music is frozen, not
    // playing to nobody.
    const frozen = +(ctx.currentTime - hiddenAt).toFixed(3);
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((r) => setTimeout(r, 700));
    const after = +(ctx.currentTime - hiddenAt).toFixed(3);
    return { hiddenState, frozen, after, state: ctx.state, voices: window.__soundtrack.voices.length };
  });
  hiddenBehaviour.hiddenState === 'suspended' &&
  hiddenBehaviour.frozen < 0.05 &&
  hiddenBehaviour.state === 'running' &&
  hiddenBehaviour.after > 0.3 &&
  hiddenBehaviour.voices === 1
    ? ok('a hidden page suspends the graph and resumes from the same place', JSON.stringify(hiddenBehaviour))
    : bad('hidden-page behaviour', JSON.stringify(hiddenBehaviour));

  /* Volume and mute, live. */
  await mp.getByRole('button', { name: 'Settings' }).click();
  const dialog = mp.getByRole('dialog', { name: 'Settings' });
  await dialog.getByRole('slider', { name: 'Volume' }).fill('70');
  const loud = await mp.evaluate(() => ({
    gain: +window.__soundtrack.master.gain.value.toFixed(2),
    reported: +window.__soundtrack.volume.toFixed(2),
    voices: window.__soundtrack.voices.length,
    state: window.__soundtrack.context.state,
  }));
  Math.abs(loud.gain - 0.7) < 0.02 && loud.voices === 1 && loud.state === 'running'
    ? ok('the volume slider takes effect live, without restarting', `master gain ${loud.gain}`)
    : bad('the volume slider', JSON.stringify(loud));

  await dialog.getByRole('checkbox', { name: 'Music' }).uncheck();
  await mp.waitForTimeout(200);
  const muted = await mp.evaluate(() => window.__soundtrack?.voices?.length ?? -1);
  muted === 0
    ? ok('muting stops playback immediately')
    : bad('muting did not stop playback', String(muted));
  await dialog.getByRole('button', { name: /Close|Done/ }).first().click();

  musicErrors.length === 0
    ? ok('no console errors from the soundtrack')
    : bad('soundtrack console errors', musicErrors.slice(0, 3).join(' | '));
  await fresh.close();

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
