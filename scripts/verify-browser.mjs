// Manual-verification harness. Serves the built dist/ through Playwright's
// request interception on a synthetic https origin, so there is no listening
// socket anywhere and localStorage behaves as it does on a real host.
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = process.argv[2];
const ORIGIN = 'https://cave.test';
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml',
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

/*
 * Playwright is a declared devDependency. Install its browser once with
 *   npx playwright install chromium
 * CHROME_PATH is only an escape hatch for a pre-existing local build.
 */
const EXECUTABLE = process.env.CHROME_PATH;
const browser = await chromium.launch(EXECUTABLE ? { executablePath: EXECUTABLE } : {});

/** Opens the Settings dialog only if it is not already open. */
async function openSettings(page) {
  if (await page.getByRole('dialog', { name: 'Settings' }).count()) return;
  await page.getByRole('button', { name: 'Settings' }).click();
}

async function newPage(viewport) {
  const context = await browser.newContext({ viewport, hasTouch: true });
  const page = await context.newPage();
  await page.route(`${ORIGIN}/**`, async (route) => {
    let rel = new URL(route.request().url()).pathname.replace(/^\//, '') || 'index.html';
    try {
      const body = await readFile(path.join(DIST, rel));
      await route.fulfill({ body, contentType: TYPES[path.extname(rel)] ?? 'application/octet-stream' });
    } catch {
      await route.fulfill({ status: 404, body: 'not found' });
    }
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${ORIGIN}/index.html`);
  return { context, page, errors };
}

/* ---------- 1. Mobile layout at 360px, selectable mode ---------- */
{
  const { context, page, errors } = await newPage({ width: 360, height: 740 });
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: 'Play as Basilia' }).click();

  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  overflow <= 0 ? ok('360px: no horizontal scrolling', `overflow ${overflow}px`)
                : bad('360px: no horizontal scrolling', `overflow ${overflow}px`);

  const small = await page.evaluate(() =>
    [...document.querySelectorAll('button, input, [role=button]')]
      .filter((el) => el.offsetParent !== null && !el.classList.contains('sr-only'))
      .map((el) => ({ t: (el.innerText || el.getAttribute('aria-label') || el.type || '').slice(0, 30),
                      h: Math.round(el.getBoundingClientRect().height) }))
      .filter((b) => b.h > 0 && b.h < 40));
  small.length === 0 ? ok('360px: touch targets >= 40px tall')
                     : bad('360px: touch targets >= 40px tall', JSON.stringify(small));

  // Play a few turns with buttons only and confirm the story moves.
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: /^Things/ }).click();
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: /hooded lantern/ }).click();
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: 'Take', exact: true }).click();
  // Opening Things closed Go; reopen it to walk.
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: /^Go/ }).click();
  // Remembered so the probes below can tell which entries are the response to
  // the walk, rather than guessing from the end of the text.
  const beforeWalk = await page.evaluate(() =>
    document.querySelectorAll('.transcript .entry').length);
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: /lane down to the square/ }).click();
  const place = (await page.locator('.topbar-place').innerText()).toLowerCase();
  place === 'the village square' ? ok('selectable mode: buttons move the story')
                                 : bad('selectable mode: buttons move the story', place);

  const room = await page.evaluate(() => {
    const t = document.querySelector('.transcript');
    const probe = document.createElement('div');
    probe.className = 'para';
    probe.textContent = 'X';
    t.appendChild(probe);
    const lh = parseFloat(getComputedStyle(probe).lineHeight);
    probe.remove();
    const cs = getComputedStyle(t);
    const inner = t.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    return {
      lines: Math.floor(inner / lh),
      share: Math.round((t.clientHeight / window.innerHeight) * 100),
    };
  });
  room.share >= 55
    ? ok('the transcript owns most of the window', `${room.share}%, ${room.lines} lines`)
    : bad('the transcript owns most of the window', JSON.stringify(room));

  const folded = await page.evaluate(() => ({
    toggle: !!document.querySelector('.topbar-toggle'),
    statusShown: !!document.querySelector('.status'),
    place: (document.querySelector('.topbar-place')?.textContent || '').trim().length > 0,
  }));
  folded.toggle && !folded.statusShown && folded.place
    ? ok('location stays visible; subtitle and objective are folded away')
    : bad('status disclosure', JSON.stringify(folded));

  /*
   * The positioning rule, measured on a real response: the transcript is the
   * only scroller, and the response to the last action is shown from its
   * beginning — entire if it fits, otherwise starting near the top edge.
   */
  await page.waitForTimeout(900);
  const probeResponse = (n) => {
    const t = document.querySelector('.transcript');
    const tr = t.getBoundingClientRect();
    const first = t.children[n];
    const last = t.lastElementChild;
    if (!first || !last) return { missing: true };
    const fr = first.getBoundingClientRect();
    const lr = last.getBoundingClientRect();
    return {
      docScrolls:
        document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
      transcriptOverflows: t.scrollHeight > t.clientHeight + 1,
      // Distance from the top edge of the viewport to the start of the response.
      startFromTop: +(fr.top - tr.top).toFixed(2),
      fits: lr.bottom - fr.top <= t.clientHeight + 1,
      wholeVisible: fr.top >= tr.top - 2 && lr.bottom <= tr.bottom + 2,
      startVisible: fr.top >= tr.top - 2 && fr.top < tr.bottom,
    };
  };
  const scrolling = await page.evaluate(probeResponse, beforeWalk);
  const positioned = (p) => p.startVisible && (p.fits ? p.wholeVisible : p.startFromTop <= 24);
  !scrolling.docScrolls && scrolling.transcriptOverflows && positioned(scrolling)
    ? ok(
        'the transcript is the scroller and opens a response at its beginning',
        scrolling.fits ? 'response fits: shown entire' : `starts ${scrolling.startFromTop}px from the top`
      )
    : bad('the transcript is the scroller and opens a response at its beginning', JSON.stringify(scrolling));

  const overflow2 = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  overflow2 <= 0 ? ok('360px: still no horizontal scrolling mid-play')
                 : bad('360px: still no horizontal scrolling mid-play', `${overflow2}px`);

  // Let any earlier glide finish, or it will overwrite the reset below and the
  // samples will describe a one-pixel nudge instead of real motion.
  await page.waitForTimeout(1200);
  const glide = await page.evaluate(async () => {
    const t = document.querySelector('.transcript');
    t.scrollTop = 0;
    await new Promise((r) => requestAnimationFrame(() => r()));
    const before = t.querySelectorAll('.entry').length;
    // A real action, so there is genuinely new output to move to.
    [...document.querySelectorAll('.panel-meta button')]
      .find((b) => b.textContent.trim() === 'look')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const samples = [];
    await new Promise((resolve) => {
      let n = 0;
      const tick = () => {
        samples.push(t.scrollTop);
        if (++n < 80) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    await new Promise((r) => setTimeout(r, 1200));
    const tr = t.getBoundingClientRect();
    const first = t.children[before];
    const last = t.lastElementChild;
    const fr = first.getBoundingClientRect();
    const lr = last.getBoundingClientRect();
    // Deltas between frames: a cubic ease-out decelerates steadily.
    const deltas = samples.slice(1).map((v, i) => Math.abs(v - samples[i])).filter((d) => d > 0);
    return {
      samples: samples.slice(0, 4).map((v) => +v.toFixed(2)),
      deltas: deltas.slice(0, 4),
      frames: deltas.length,
      decelerates: deltas.length >= 2 && deltas[0] > deltas[deltas.length - 1] * 2,
      startFromTop: +(fr.top - tr.top).toFixed(2),
      fits: lr.bottom - fr.top <= t.clientHeight + 1,
      wholeVisible: fr.top >= tr.top - 2 && lr.bottom <= tr.bottom + 2,
      startVisible: fr.top >= tr.top - 2 && fr.top < tr.bottom,
      animated: new Set(samples.map((v) => Math.round(v))).size > 1,
    };
  });
  glide.animated && positioned(glide)
    ? ok(
        'the glide animates and lands on the start of the response',
        `${glide.samples.join(' -> ')} ... start ${glide.startFromTop}px from the top`
      )
    : bad('the kinetic glide', JSON.stringify(glide));

  /*
   * Slower than a snap, and slow enough to follow. The glide is distance-scaled
   * over 320–720 ms, so a move worth animating has to occupy a good many frames
   * rather than one or two.
   */
  glide.frames >= 8
    ? ok('the glide is slow enough to read as motion', `${glide.frames} moving frames`)
    : bad('the glide is slow enough to read as motion', JSON.stringify(glide));
  /*
   * Not asserted here: that a long drop teleports most of the way and glides
   * only the last screenful. The teleport happens inside the same layout
   * effect as the click, before any frame this probe can sample, so from
   * outside it is indistinguishable from a short glide. It is implemented in
   * ui/cascade.ts (MAX_TRAVEL_SCREENS) and verified by eye, not here.
   */
  glide.decelerates
    ? ok(
        'the glide eases out rather than stepping by rows',
        `frame deltas ${glide.deltas.join(', ')}px`
      )
    : bad('the glide eases out', JSON.stringify(glide));

  // A re-render that is not an action leaves the reader where they are.
  await page.evaluate(() => { document.querySelector('.transcript').scrollTop = 0; });
  await page.locator('.topbar-toggle').click();
  await page.waitForTimeout(120);
  const heldOnRerender = await page.evaluate(() => document.querySelector('.transcript').scrollTop);
  await page.locator('.topbar-toggle').click();
  heldOnRerender < 40
    ? ok('a non-action re-render leaves the scroll position alone', `scrollTop ${heldOnRerender}`)
    : bad('a non-action re-render moved the reader', `scrollTop ${heldOnRerender}`);

  // An action opens its response from the start, wherever the reader had got to.
  await page.evaluate(() => { document.querySelector('.transcript').scrollTop = 0; });
  const beforeLook = await page.evaluate(() =>
    document.querySelectorAll('.transcript .entry').length);
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: 'look' }).click();
  await page.waitForTimeout(1200);
  const afterAction = await page.evaluate(probeResponse, beforeLook);
  positioned(afterAction)
    ? ok('an action from the top of the history opens its response, not the end of the text')
    : bad('an action left its response badly placed', JSON.stringify(afterAction));

  /*
   * The branch that matters most, forced: with the viewport shortened, no
   * response can fit, so the response must begin near the top edge rather than
   * running off it. This is the case the old scroll-to-bottom got wrong — the
   * first line of a long answer ended up above the top of the window.
   */
  await page.evaluate(() => {
    const t = document.querySelector('.transcript');
    t.dataset.probeHeight = '1';
    t.style.height = '140px';
    t.style.flex = '0 0 auto';
  });
  const beforeShort = await page.evaluate(() =>
    document.querySelectorAll('.transcript .entry').length);
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: 'look' }).click();
  await page.waitForTimeout(1200);
  const shortView = await page.evaluate(probeResponse, beforeShort);
  await page.evaluate(() => {
    const t = document.querySelector('.transcript');
    t.style.height = '';
    t.style.flex = '';
    delete t.dataset.probeHeight;
  });
  !shortView.fits && shortView.startVisible && shortView.startFromTop <= 24 && shortView.startFromTop >= -2
    ? ok(
        'a response too tall for the viewport starts near the top, not off it',
        `start ${shortView.startFromTop}px from the top`
      )
    : bad('a tall response was not positioned on its start', JSON.stringify(shortView));

  /*
   * Scrolling is never allowed to take the keyboard away from the reader. The
   * action is dispatched synthetically rather than clicked, because a real
   * click moves focus by itself and would prove nothing.
   */
  const focusKept = await page.evaluate(async () => {
    const t = document.querySelector('.transcript');
    t.scrollTop = 0;
    const held = document.querySelector('.topbar-toggle');
    held.focus();
    const before = document.activeElement === held;
    [...document.querySelectorAll('.panel-meta button')]
      .find((b) => b.textContent.trim() === 'look')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 1200));
    return {
      before,
      after: document.activeElement === held,
      moved: +t.scrollTop.toFixed(2),
      who: document.activeElement?.className ?? '',
    };
  });
  focusKept.before && focusKept.after && focusKept.moved > 0
    ? ok('positioning the transcript does not move keyboard focus', `moved ${focusKept.moved}px`)
    : bad('scrolling moved keyboard focus', JSON.stringify(focusKept));

  /*
   * Switching input mode inserts the written-out option lists throughout the
   * history: a UI change, not a story event, so the words under the reader's
   * eye have to stay there.
   */
  // A conversation, so there is a written-out option list for the switch to
  // insert. Without one the transcript does not change and the check is empty.
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: /^People/ }).click();
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: 'Talk to Sage' }).click();
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: /leave/i }).first().click();
  await page.waitForTimeout(1200);
  const anchored = await page.evaluate(() => {
    const t = document.querySelector('.transcript');
    t.scrollTop = Math.round((t.scrollHeight - t.clientHeight) * 0.45);
    // Let the scroll sampler run before the mode switch.
    return new Promise((r) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const tr = t.getBoundingClientRect();
          for (const c of t.children) {
            const rect = c.getBoundingClientRect();
            if (rect.bottom - tr.top > 0) {
              /*
               * Tagged rather than matched on its text: repeated looks at the
               * same place produce identical entries, and the probe has to
               * measure the same element afterwards, not its twin.
               */
              c.dataset.probeAnchor = '1';
              r({ offset: +(rect.top - tr.top).toFixed(2), height: t.scrollHeight });
              return;
            }
          }
          r(null);
        })
      )
    );
  });
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('radio', { name: 'Type-only' }).click();
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Close' }).click();
  await page.waitForTimeout(300);
  const stillAnchored = await page.evaluate(() => {
    const t = document.querySelector('.transcript');
    const c = t.querySelector('[data-probe-anchor]');
    if (!c) return { found: false };
    return {
      found: true,
      offset: +(c.getBoundingClientRect().top - t.getBoundingClientRect().top).toFixed(2),
      height: t.scrollHeight,
    };
  });
  stillAnchored.found &&
  stillAnchored.height > anchored.height &&
  Math.abs(stillAnchored.offset - anchored.offset) <= 4
    ? ok(
        'switching input mode holds the reading position',
        `${anchored.height}px of text -> ${stillAnchored.height}px, anchor ${anchored.offset}px -> ${stillAnchored.offset}px`
      )
    : bad('switching input mode moved the reader', JSON.stringify({ anchored, stillAnchored }));

  errors.length === 0 ? ok('no console or page errors (selectable)')
                      : bad('no console or page errors (selectable)', errors.join(' | '));
  await context.close();
}

/* ---------- 2. Keyboard-only completion of the whole chapter ---------- */
{
  const { context, page, errors } = await newPage({ width: 390, height: 844 });
  // Reach the character screen using only the keyboard.
  await page.keyboard.press('Tab');
  let guard = 0;
  while (guard++ < 12) {
    const label = await page.evaluate(() => document.activeElement?.textContent ?? '');
    if (label.includes('New Game')) break;
    await page.keyboard.press('Tab');
  }
  const reached = await page.evaluate(() => document.activeElement?.textContent ?? '');
  reached.includes('New Game') ? ok('keyboard: can reach New Game by tabbing')
                               : bad('keyboard: can reach New Game by tabbing', reached);
  await page.keyboard.press('Enter');

  // Switch to type-only with the keyboard, then choose a character.
  await page.getByRole('radio', { name: /Type-only/ }).focus();
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Play as Basil', exact: true }).focus();
  await page.keyboard.press('Enter');

  const field = page.getByLabel('What do you do?');
  const focused = await page.evaluate(() => document.activeElement?.id);
  focused === 'command-input' ? ok('type mode: command field is focused on arrival')
                              : bad('type mode: command field is focused on arrival', String(focused));

  // The whole of both chapters, typed, in the documented shortest order.
  const script = [
    'take lantern','down','east','take wedge','west','west','west','in',
    'examine relief','east','open shutter','use wedge on shutter',
    'place lantern in alcove','light lantern','examine wall','open seam',
    'take lantern','take wedge','down','examine threshold','enter threshold',
    'up','east','east','talk to saffra','the cave on the hill','whether anything is coming',
    'why you asked','recite prophecy',
    'talk to fenn','how a boy gets past the foreman','leave',
    'west','west','down','north',
    'examine drawing','examine slate','examine dishes',
    'place lantern in high dish','enter aperture',
    // Chapter 3: out of the hill, the settlement, the evidence, the seal, home.
    'up','examine bird','east',
    'talk to rue','what she is sitting against','the oldest thing she knows','leave',
    'examine account','examine memorial','journal','examine shell','take maul','reflect',
    'west','west','talk to sorrel','why the hill is walled up',
    'whether the wall is as good as it looks','leave',
    'use wedge on seal','break seal','break seal',
    'west','examine fill','clear fill','place lantern in middle dish','enter aperture',
    // Chapter 4: everything said, every hand tried, and then the end.
    'talk to them','say nothing','show self','show lantern','show journal',
    'tell them about the future','tell them about the prophecy',
    'block wall','hold them','take their lantern','wait',
    'kill them','examine pillar','break pillar','break pillar','break pillar','swing',
  ];
  for (const line of script) {
    await field.fill(line);
    await page.keyboard.press('Enter');
  }

  const whole = await page.locator('.transcript').innerText();
  const place = (await page.locator('.topbar-place').innerText()).toLowerCase();
  place === 'the sealed chamber'
    ? ok('keyboard only: the whole story completed to the ending')
    : bad('keyboard only: the whole story completed to the ending', place);

  whole.includes('They turn round')
    ? ok('keyboard only: the return lands on the earlier self')
    : bad('keyboard only: the return lands on the earlier self');

  whole.includes('It takes about nine seconds')
    ? ok('keyboard only: the hill comes down')
    : bad('keyboard only: the hill comes down');
  whole.includes('Somebody is missing, and the whole square knows exactly who')
    ? ok('keyboard only: the epilogue grieves somebody by name')
    : bad('keyboard only: the epilogue grieves somebody');
  whole.includes('sky is doing things')
    ? ok('keyboard only: the saved valley has weather in it')
    : bad('keyboard only: the saved valley has weather in it');

  // The canonical prophecy, spoken in the square a century before the plank.
  whole.includes('One who braves the Cave of Absolution will have the power to turn it aside')
    ? ok('keyboard only: the recitation says the canonical text')
    : bad('keyboard only: the recitation says the canonical text');

  const ended = await page.locator('.entry-system', { hasText: '— The end —' }).count();
  ended > 0 ? ok('keyboard only: the ending marker is shown')
            : bad('keyboard only: the ending marker is shown');

  !/not implemented|coming soon|not written yet/i.test(whole.slice(-2000))
    ? ok('end state: the ending does not promise anything further')
    : bad('end state: the ending does not promise anything further');

  // The objective folds away by default now; open the disclosure to read it.
  if ((await page.locator('.status').count()) === 0) {
    await page.locator('.topbar-toggle').click();
  }
  const objective = await page.getByLabel('Current objective').innerText();
  /The end/.test(objective) ? ok('end state: objective updated')
                            : bad('end state: objective updated', objective);

  // No command line at the ending: a panel, with reading on it.
  const endingPanel = await page.getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Read the ending again' }).count();
  const noField = await page.getByLabel('What do you do?').count();
  endingPanel === 1 && noField === 0
    ? ok('ending: a panel with the ending on it, and no command line')
    : bad('ending: panel', `panel=${endingPanel} field=${noField}`);

  // Reading it again prints it again and changes nothing.
  const beforeReview = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')));
  await page.getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Read the ending again' }).click();
  const afterReview = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')));
  /*
   * The transcript is capped, so "it got longer" is not the test. What matters
   * is that nothing moved and the epilogue is on the page again.
   */
  const reviewedText = await page.locator('.transcript').innerText();
  JSON.stringify(beforeReview.flags) === JSON.stringify(afterReview.flags) &&
  afterReview.chapter === beforeReview.chapter &&
  afterReview.journal.length === beforeReview.journal.length &&
  reviewedText.includes('The village, that evening and after')
    ? ok('ending: reading it again is reading, not replaying')
    : bad('ending: review changed state');

  if ((await page.locator('.status').count()) === 0) {
    await page.locator('.topbar-toggle').click();
  }
  const completed = await page.locator('.objective').getAttribute('class');
  /objective-done/.test(completed || '')
    ? ok('completed objective is marked, not only coloured')
    : bad('completed objective marking', String(completed));

  const palette = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    const hex = (v) => {
      const m = v.match(/\d+/g);
      return m ? '#' + m.slice(0, 3).map((n) => (+n).toString(16).padStart(2, '0')).join('') : v;
    };
    return {
      bg: hex(body.backgroundColor),
      ink: hex(body.color),
      font: body.fontFamily,
      size: body.fontSize,
      line: body.lineHeight,
      magenta: root.getPropertyValue('--magenta').trim(),
      cyan: root.getPropertyValue('--cyan').trim(),
      green: root.getPropertyValue('--green').trim(),
    };
  });
  palette.bg === '#080a0c' && palette.ink === '#dedfda' &&
  palette.magenta === '#eb8fd8' && palette.cyan === '#79dce8' && palette.green === '#a3db96'
    ? ok('palette matches the specification', `${palette.bg} / ${palette.ink}`)
    : bad('palette matches the specification', JSON.stringify(palette));

  /^1[6-8]px$/.test(palette.size) && /mono/i.test(palette.font) &&
  Math.abs(parseFloat(palette.line) / parseFloat(palette.size) - 1.6) < 0.05
    ? ok('typography: monospace, 16-18px, 1.6 line height', `${palette.size} / ${palette.line}`)
    : bad('typography', JSON.stringify(palette));

  const column = await page.evaluate(() => {
    const el = document.querySelector('.entry');
    const probe = document.createElement('span');
    probe.textContent = '0'.repeat(70);
    probe.style.font = getComputedStyle(document.body).font;
    probe.style.position = 'absolute';
    probe.style.whiteSpace = 'pre';
    document.body.appendChild(probe);
    const seventy = probe.getBoundingClientRect().width;
    probe.remove();
    return { entry: el.getBoundingClientRect().width, seventy };
  });
  column.entry <= column.seventy + 2
    ? ok('reading column never exceeds 70 characters', `${Math.round(column.entry)}px at 390px`)
    : bad('reading column width', JSON.stringify(column));

  const tinted = await page.evaluate(() => {
    const log = document.querySelector('.transcript');
    const total = (log.textContent || '').length;
    const coloured = [...log.querySelectorAll('[class^=tint-]')]
      .reduce((n, el) => n + (el.textContent || '').length, 0);
    return { total, coloured, share: coloured / Math.max(total, 1) };
  });
  tinted.coloured > 0 && tinted.share < 0.15
    ? ok('colour stays on short spans', `${(tinted.share * 100).toFixed(1)}% of the transcript`)
    : bad('colour stays on short spans', JSON.stringify(tinted));

  const rawMarkup = await page.evaluate(() => {
    const text = document.body.innerText || '';
    return { braces: text.includes('{{'), pipes: /\{\{[mcg]\|/.test(text) };
  });
  !rawMarkup.braces && !rawMarkup.pipes
    ? ok('annotation syntax is never shown to the player')
    : bad('annotation syntax leaked into the page', JSON.stringify(rawMarkup));

  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll('.transcript [class^=tint-]')].map((el) => el.textContent));
  hidden.every((t) => !/alcove|seam|passage/i.test(t || ''))
    ? ok('nothing undiscovered is tinted')
    : bad('nothing undiscovered is tinted', hidden.join(', '));

  const effects = await page.evaluate(() => {
    const offenders = [];
    for (const el of document.querySelectorAll('body *')) {
      const s = getComputedStyle(el);
      if (s.backgroundImage !== 'none') offenders.push(`bg-image on ${el.className}`);
      if (s.textShadow !== 'none') offenders.push(`text-shadow on ${el.className}`);
      if (s.boxShadow !== 'none') offenders.push(`box-shadow on ${el.className}`);
      // The anchored input's single-shot nudge is intended; anything else
      // animating is not.
      if (s.animationName !== 'none' && s.animationName !== 'anchor-nudge') {
        offenders.push(`animation ${s.animationName} on ${el.className}`);
      }
      if (s.animationName === 'anchor-nudge' && s.animationIterationCount !== '1') {
        offenders.push(`anchor-nudge repeats ${s.animationIterationCount} times`);
      }
    }
    return offenders.slice(0, 5);
  });
  effects.length === 0 ? ok('no gradients, glow, shadows or animation')
                       : bad('no gradients, glow, shadows or animation', effects.join('; '));

  errors.length === 0 ? ok('no console or page errors (type-only full run)')
                      : bad('no console or page errors (type-only full run)', errors.join(' | '));

  /* ---------- 3. Reload mid-story keeps progress ---------- */
  await page.reload();
  await page.getByRole('button', { name: 'Continue' }).click();
  const after = (await page.locator('.topbar-place').innerText()).toLowerCase();
  const endAfter = await page.locator('.entry-system', { hasText: '— The end —' }).count();
  after === 'the sealed chamber' && endAfter > 0
    ? ok('reload: Continue restores place and transcript')
    : bad('reload: Continue restores place and transcript', `${after} / entries ${endAfter}`);

  /* ---------- 4. Mode switch preserves state and transcript ---------- */
  // Compare the stored transcript, not the rendered one: selectable mode hides
  // the written-out choice lists because it shows them as buttons.
  const storedBefore = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')).transcript.length);
  await openSettings(page);
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('radio', { name: 'Selectable Actions' }).click();
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Close' }).click();
  const storedAfter = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')).transcript.length);
  const place2 = (await page.locator('.topbar-place').innerText()).toLowerCase();
  const hasButtons = await page.getByRole('region', { name: 'Actions' }).getByRole('button').count();
  const endingStillShown = await page.locator('.entry-narration', { hasText: 'You are a long way from home' }).count();
  storedAfter === storedBefore && place2 === 'the sealed chamber' && hasButtons > 0 && endingStillShown > 0
    ? ok('mode switch: state and transcript preserved, buttons appear', `${storedAfter} entries kept`)
    : bad('mode switch', `${storedBefore}->${storedAfter} at ${place2}, ${hasButtons} buttons, ending ${endingStillShown}`);

  /* ---------- 5. Export produces a save file ---------- */
  await openSettings(page);
  const download = page.waitForEvent('download');
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Export Save' }).click();
  const file = await download;
  file.suggestedFilename() === 'adventure-save.json'
    ? ok('export: downloads adventure-save.json')
    : bad('export: downloads adventure-save.json', file.suggestedFilename());
  const exported = JSON.parse(await readFile(await file.path(), 'utf8'));
  exported.ended === true &&
  exported.locationId === 'present.sealed_chamber' &&
  exported.chapter === 'ending' &&
  exported.flags['lost_eye'] === true &&
  exported.flags['earlier_self_dead'] === true &&
  exported.flags['hero_dead'] === true &&
  exported.flags['cave_destroyed'] === true &&
  exported.schemaVersion === 4
    ? ok('export: file contains the current state, in the current format')
    : bad('export: file contents', JSON.stringify(exported).slice(0, 140));

  /* ---------- 6. Checkpoint restart ---------- */
  page.once('dialog', (d) => d.accept());
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Restart from checkpoint' }).click();
  const place3 = (await page.locator('.topbar-place').innerText()).toLowerCase();
  // The chapter advanced at each crossing, so the checkpoint is the return
  // rather than the bedroom, the basin or the broken chamber.
  place3 === 'the sealed chamber'
    ? ok('checkpoint restart: back at the start of the current chapter', place3)
    : bad('checkpoint restart: back at the start of the current chapter', place3);

  /* ---------- 5b. Settings is a real keyboard modal ---------- */
  await page.keyboard.press('Escape').catch(() => {});
  const settingsButton = page.getByRole('button', { name: 'Settings' });
  await settingsButton.focus();
  await page.keyboard.press('Enter');
  const dialogOpen = await page.getByRole('dialog', { name: 'Settings' }).count();
  const focusInside = await page.evaluate(() =>
    document.querySelector('.dialog')?.contains(document.activeElement) ?? false);
  dialogOpen === 1 && focusInside
    ? ok('settings: opens with focus inside the dialog')
    : bad('settings: focus on open', `open=${dialogOpen} inside=${focusInside}`);

  // Tab many times: focus must never escape the dialog.
  let escaped = false;
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() =>
      document.querySelector('.dialog')?.contains(document.activeElement) ?? false);
    if (!inside) { escaped = true; break; }
  }
  !escaped ? ok('settings: Tab stays inside the dialog')
           : bad('settings: focus escaped the dialog');

  await page.keyboard.press('Shift+Tab');
  const stillInside = await page.evaluate(() =>
    document.querySelector('.dialog')?.contains(document.activeElement) ?? false);
  stillInside ? ok('settings: Shift+Tab stays inside the dialog')
              : bad('settings: Shift+Tab escaped');

  await page.keyboard.press('Escape');
  const closed = await page.getByRole('dialog', { name: 'Settings' }).count();
  const returned = await page.evaluate(() =>
    (document.activeElement?.textContent || '').includes('Settings'));
  closed === 0 && returned
    ? ok('settings: Escape closes and focus returns to the button that opened it')
    : bad('settings: Escape/focus return', `closed=${closed} returned=${returned}`);

  /* ---------- 6b. Import the exported save back ---------- */
  await openSettings(page);
  page.once('dialog', (d) => d.accept());
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Import Save' }).click();
  await (await chooser).setFiles(await file.path());
  await page.waitForTimeout(150);
  const placeImported = (await page.locator('.topbar-place').innerText()).toLowerCase();
  const endedImported = await page.locator('.entry-system', { hasText: '— The end —' }).count();
  placeImported === 'the sealed chamber' && endedImported > 0
    ? ok('import: the exported save is restored')
    : bad('import: the exported save is restored', `${placeImported} / entries ${endedImported}`);

  /* ---------- 6c. A malformed import is refused and changes nothing ---------- */
  const badFile = path.join(DIST, '..', 'tmp-bad-save.json');
  await (await import('node:fs/promises')).writeFile(badFile, '{"schemaVersion":1}');
  await openSettings(page);
  const chooser2 = page.waitForEvent('filechooser');
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Import Save' }).click();
  await (await chooser2).setFiles(badFile);
  await page.waitForTimeout(150);
  const toast = await page.locator('.toast').innerText().catch(() => '');
  const placeAfterBad = (await page.locator('.topbar-place').innerText()).toLowerCase();
  /Import refused/.test(toast) && placeAfterBad === 'the sealed chamber'
    ? ok('import: a malformed file is refused and the game is untouched', toast.split('\n')[0].slice(0, 60))
    : bad('import: a malformed file is refused', `${toast} / ${placeAfterBad}`);
  await (await import('node:fs/promises')).rm(badFile, { force: true });

  /* ---------- 6d. New Game asks before overwriting ---------- */
  let asked = '';
  page.once('dialog', (d) => { asked = d.message(); d.dismiss(); });
  await openSettings(page);
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'New Game' }).click();
  await page.waitForTimeout(100);
  const placeAfterCancel = (await page.locator('.topbar-place').innerText()).toLowerCase();
  /overwrite your saved progress/.test(asked) && placeAfterCancel === 'the sealed chamber'
    ? ok('new game: confirms before overwriting, and cancelling keeps progress')
    : bad('new game: confirms before overwriting', `${asked} / ${placeAfterCancel}`);
  await context.close();
}

/* ---------- 6e. Checkpoint in the first chapter is the bedroom ---------- */
{
  const { context, page } = await newPage({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('radio', { name: /Type-only/ }).click();
  await page.getByRole('button', { name: 'Play as Basil', exact: true }).click();
  const field = page.getByLabel('What do you do?');
  for (const line of ['take lantern', 'down', 'east', 'take wedge']) {
    await field.fill(line);
    await page.keyboard.press('Enter');
  }
  await openSettings(page);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Restart from checkpoint' }).click();
  await page.waitForTimeout(100);
  const place = (await page.locator('.topbar-place').innerText()).toLowerCase();
  place === 'your room'
    ? ok('checkpoint restart mid-rite: back in the bedroom')
    : bad('checkpoint restart mid-rite', place);
  await context.close();
}

/* ---------- 7. Storage failure feedback ---------- */
{
  const { context, page } = await newPage({ width: 390, height: 844 });
  await page.evaluate(() => {
    const proto = Object.getPrototypeOf(window.localStorage);
    proto.setItem = function () { throw new DOMException('full', 'QuotaExceededError'); };
  });
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: 'Play as Basil', exact: true }).click();
  const warned = await page.locator('[role=alert]').count();
  const text = warned ? await page.locator('[role=alert]').first().innerText() : '';
  warned > 0 && /not being saved/.test(text)
    ? ok('storage failure: persistent warning shown', text.slice(0, 60))
    : bad('storage failure: persistent warning shown', text || 'no alert');

  // And the game is still playable while unsaved.
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: /lane down to the square/ }).click();
  const place = (await page.locator('.topbar-place').innerText()).toLowerCase();
  place === 'the village square' ? ok('storage failure: play continues')
                                 : bad('storage failure: play continues', place);
  await context.close();
}

/* ---------- 8. Reduced motion honoured ---------- */
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.route(`${ORIGIN}/**`, async (route) => {
    let rel = new URL(route.request().url()).pathname.replace(/^\//, '') || 'index.html';
    try {
      const body = await readFile(path.join(DIST, rel));
      await route.fulfill({ body, contentType: TYPES[path.extname(rel)] ?? 'application/octet-stream' });
    } catch { await route.fulfill({ status: 404, body: '' }); }
  });
  await page.goto(`${ORIGIN}/index.html`);
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: 'Play as Basil', exact: true }).click();
  const jumped = await page.evaluate(async () => {
    const t = document.querySelector('.transcript');
    t.scrollTop = 0;
    [...document.querySelectorAll('.panel-meta button')]
      .find((b) => b.textContent.trim() === 'look')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    // One frame only: with motion reduced there must be nothing left to animate.
    await new Promise((r) => requestAnimationFrame(() => r()));
    return t.scrollHeight - t.scrollTop - t.clientHeight;
  });
  jumped < 2
    ? ok('reduced motion: the glide is replaced by a jump', `${jumped.toFixed(2)}px after one frame`)
    : bad('reduced motion: glide not suppressed', String(jumped));

  const duration = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.btn')).transitionDuration);
  /^0\.?0*0?0?1?m?s?$|^0s$/.test(duration) || parseFloat(duration) < 0.01
    ? ok('reduced motion: transitions collapsed', duration)
    : bad('reduced motion: transitions collapsed', duration);
  await context.close();
}

/* ---------- 9. Wide viewport: one centred ~70 character column ---------- */
{
  const { context, page } = await newPage({ width: 1280, height: 900 });
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: 'Play as Basil', exact: true }).click();
  const layout = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.textContent = '0'.repeat(70);
    probe.style.font = getComputedStyle(document.body).font;
    probe.style.position = 'absolute';
    probe.style.whiteSpace = 'pre';
    document.body.appendChild(probe);
    const seventy = probe.getBoundingClientRect().width;
    probe.remove();
    const entry = document.querySelector('.entry').getBoundingClientRect();
    return {
      seventy,
      width: entry.width,
      leftGap: Math.round(entry.left),
      rightGap: Math.round(window.innerWidth - entry.right),
      fontSize: getComputedStyle(document.body).fontSize,
    };
  });
  Math.abs(layout.width - layout.seventy) / layout.seventy < 0.08
    ? ok('wide screen: column is about 70 characters', `${Math.round(layout.width)}px`)
    : bad('wide screen: column width', JSON.stringify(layout));
  Math.abs(layout.leftGap - layout.rightGap) <= 2
    ? ok('wide screen: the column is centred')
    : bad('wide screen: the column is centred', JSON.stringify(layout));
  layout.fontSize === '18px'
    ? ok('wide screen: 18px body text')
    : bad('wide screen: body text size', layout.fontSize);
  await context.close();
}

/* ---------- 8. Selectable mode plays both chapters, no typing ---------- */
{
  const { context, page, errors } = await newPage({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: 'Play as Basilia' }).click();

  const panel = page.getByRole('region', { name: 'Actions' });
  /** Opens a category, then clicks a chip or action inside the panel. */
  const tap = async (name, exact = false) => {
    await panel.getByRole('button', exact ? { name, exact: true } : { name }).first().click();
  };
  const category = async (which) => {
    const chip = panel.getByRole('button', { name: new RegExp(`^${which}`) }).first();
    if ((await chip.getAttribute('aria-expanded')) !== 'true') await chip.click();
  };
  const go = async (label) => { await category('Go'); await tap(label); };
  /**
   * Open a thing's chip and click one of its verbs.
   *
   * The chip is a toggle, so it is only clicked when it is not already the
   * open one — the chip carries aria-expanded, which is what the panel uses to
   * render its action row, so that is the honest thing to read.
   */
  const thing = async (name, verb) => {
    await category('Things');
    const chip = panel.getByRole('button', { name }).first();
    if ((await chip.getAttribute('aria-expanded')) !== 'true') await chip.click();
    await panel
      .getByRole('button', verb instanceof RegExp ? { name: verb } : { name: verb, exact: true })
      .first()
      .click();
  };
  const talkTo = async (who) => { await category('People'); await tap(`Talk to ${who}`); };

  await thing('hooded lantern', 'Take');
  await go(/lane down to the square/);
  await go(/joiner/);
  await thing('wooden wedge', 'Take');
  await go(/the square/);
  await go(/cave path/);
  await go(/cave mouth/);
  await go(/outer gallery/);
  await go(/smaller chamber/);

  // The puzzle, with the item flows.
  await category('Things');
  await panel.getByRole('button', { name: /wooden wedge/ }).first().click();
  await panel.getByRole('button', { name: 'Use on...' }).click();
  await panel.getByRole('button', { name: /stone shutter/ }).click();
  await panel.getByRole('button', { name: /hooded lantern/ }).first().click();
  await panel.getByRole('button', { name: 'Put in...' }).click();
  await panel.getByRole('button', { name: /alcove/ }).click();
  await thing('alcove', /Light the/);
  await thing(/patterned wall|scale/, 'Examine');
  await thing('seam', 'Open');
  await thing('alcove', /Take back the/);
  await thing('stone shutter', /Take back the/);
  await go(/opened passage/);
  await thing(/threshold/, 'Step into it');

  const crossed = (await page.locator('.topbar-place').innerText()).toLowerCase();
  crossed === 'the basin chamber'
    ? ok('selectable mode: the first crossing works by clicking')
    : bad('selectable mode: the first crossing works by clicking', crossed);

  await go(/stair up and out/);
  await go(/track down the hill/);
  await go(/village square/);
  await talkTo('Saffra');
  await panel.getByRole('button', { name: /the cave on the hill/ }).click();
  await panel.getByRole('button', { name: /whether anything is coming/ }).click();
  await panel.getByRole('button', { name: /why you asked/ }).click();

  const reciteButton = panel.getByRole('button', { name: /Recite the prophecy/ });
  (await reciteButton.count()) > 0
    ? ok('selectable mode: the recitation is offered as an action')
    : bad('selectable mode: the recitation is offered as an action');
  await reciteButton.click();

  await talkTo('Fenn');
  await panel.getByRole('button', { name: /how a boy gets past the foreman/ }).click();
  await panel.getByRole('button', { name: 'Leave the conversation' }).click();
  await go(/track up the hill/);
  await go(/cave mouth/);
  await go(/stair back down|back down/);
  await go(/spoil heap/);

  const inside = (await page.locator('.topbar-place').innerText()).toLowerCase();
  inside === 'the workings'
    ? ok("selectable mode: Fenn's route opens the workings")
    : bad("selectable mode: Fenn's route opens the workings", inside);

  await thing(/drawing/, 'Examine');
  await thing(/slate/, 'Examine');
  await thing(/cut dishes/, 'Examine');

  await category('Things');
  await panel.getByRole('button', { name: /hooded lantern/ }).first().click();
  await panel.getByRole('button', { name: 'Put in...' }).click();
  await panel.getByRole('button', { name: 'high dish', exact: true }).click();
  await thing(/aperture/, 'Step into it');

  const arrived = (await page.locator('.topbar-place').innerText()).toLowerCase();
  arrived === 'the broken chamber'
    ? ok('selectable mode: the second crossing works by clicking')
    : bad('selectable mode: the second crossing works by clicking', arrived);

  /* ---- Chapter 3, still without typing ---- */
  await go(/tear in the wall/);
  await thing('bird', 'Examine');
  await go(/village below/);

  await talkTo('Rue');
  await panel.getByRole('button', { name: /what she is sitting against/ }).click();
  await panel.getByRole('button', { name: /the oldest thing she knows/ }).click();
  await panel.getByRole('button', { name: 'Leave the conversation' }).click();
  await thing('Account', 'Examine');
  await thing(/memorial/, 'Examine');
  // Journal lives in the header nav, not the actions panel.
  await page.getByRole('navigation', { name: 'Game information' })
    .getByRole('button', { name: 'journal' })
    .click();
  await thing(/roofless shell/, 'Examine');
  await thing('maul', 'Take');

  const reflect = panel.getByRole('button', { name: 'add it up' });
  (await reflect.count()) > 0
    ? ok('selectable mode: the synthesis is offered once the pieces are in')
    : bad('selectable mode: the synthesis is offered once the pieces are in');
  await reflect.click();

  await go(/the hill/);
  await go(/sealed mouth/);
  await talkTo('Sorrel');
  await panel.getByRole('button', { name: /why the hill is walled up/ }).click();
  await panel.getByRole('button', { name: /whether the wall is as good as it looks/ }).click();
  await panel.getByRole('button', { name: 'Leave the conversation' }).click();

  await category('Things');
  await panel.getByRole('button', { name: /wooden wedge/ }).first().click();
  await panel.getByRole('button', { name: 'Use on...' }).click();
  await panel.getByRole('button', { name: /^seal/ }).click();
  await thing(/^seal/, 'Break it open');
  await thing(/^seal/, 'Break it open');

  const injured = await page.locator('.transcript').innerText();
  injured.includes('The fall it came out of starts afterwards')
    ? ok('selectable mode: the seal opens and the stone arrives first')
    : bad('selectable mode: the seal opens and the stone arrives first');

  await go(/opened mouth/);
  await thing(/cracked fill/, 'Examine');
  await thing(/cracked fill/, 'Clear it away');
  await category('Things');
  await panel.getByRole('button', { name: /hooded lantern/ }).first().click();
  await panel.getByRole('button', { name: 'Put in...' }).click();
  await panel.getByRole('button', { name: 'middle dish', exact: true }).click();
  await thing(/gap in the panel/, 'Step into it');

  const returned = (await page.locator('.topbar-place').innerText()).toLowerCase();
  returned === 'the sealed chamber'
    ? ok('selectable mode: the return works by clicking')
    : bad('selectable mode: the return works by clicking', returned);

  const noExits = await panel.getByRole('button', { name: /^Go/ }).count();
  noExits === 0
    ? ok('the return offers no way out of the room, which is the point')
    : bad('the return offers no way out of the room, which is the point', String(noExits));

  await category('People');
  const onlyPerson = await panel.getByRole('button', { name: /^Talk to/ }).count();
  onlyPerson === 1
    ? ok('the only person in the room is the one with the lantern')
    : bad('the only person in the room is the one with the lantern', String(onlyPerson));

  /* ---- Chapter 4, still without typing ---- */
  await panel.getByRole('button', { name: 'Talk to the one with the lantern' }).click();
  await panel.getByRole('button', { name: /say nothing/ }).click();

  // The lethal action is not on offer yet, and nothing is labelled "use the mallet".
  const tooEarly = await panel.getByRole('button', { name: /Kill them/ }).count();
  tooEarly === 0
    ? ok('selectable mode: the lethal action is not offered before the scene supports it')
    : bad('selectable mode: lethal action offered too early');

  await panel.getByRole('button', { name: 'Tell them who you are' }).click();
  await panel.getByRole('button', { name: 'Hold up your lantern' }).click();
  await panel.getByRole('button', { name: 'Show them the journal' }).click();
  await panel.getByRole('button', { name: 'Describe the ruined valley' }).click();
  await panel.getByRole('button', { name: 'Tell them where the words came from' }).click();
  await panel.getByRole('button', { name: 'Stand in front of the wall' }).click();
  await panel.getByRole('button', { name: 'Get hold of them' }).click();

  const nowOffered = panel.getByRole('button', { name: 'Kill them with the mallet' });
  (await nowOffered.count()) === 1
    ? ok('selectable mode: the lethal action appears, labelled with what it does')
    : bad('selectable mode: lethal action not offered');
  await nowOffered.click();

  const dead = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')));
  dead.flags['earlier_self_dead'] === true && dead.flags['hero_dead'] === undefined
    ? ok('selectable mode: the earlier self dies and the hero does not')
    : bad('selectable mode: the killing', JSON.stringify(dead.flags).slice(0, 120));

  await thing(/pillar/, 'Examine');
  await thing(/pillar/, 'Break it open');
  await thing(/pillar/, 'Break it open');
  await thing(/pillar/, 'Break it open');
  const swing = panel.getByRole('button', { name: 'Swing', exact: true });
  (await swing.count()) === 1
    ? ok('selectable mode: the last blow asks first, as a button')
    : bad('selectable mode: no confirmation button');
  await swing.click();

  const finished = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')));
  finished.chapter === 'ending' && finished.flags['hero_dead'] === true &&
  finished.flags['cave_destroyed'] === true && finished.ended === true
    ? ok('selectable mode: the whole story completed with no typing at all')
    : bad('selectable mode: completion', JSON.stringify(finished.flags).slice(0, 140));

  const endingText = await page.locator('.transcript').innerText();
  endingText.includes('The village, that evening and after')
    ? ok('selectable mode: the epilogue is shown')
    : bad('selectable mode: the epilogue is shown');

  errors.length === 0 ? ok('selectable mode: no console errors across the whole story')
                      : bad('selectable mode: console errors', errors.join(' | ').slice(0, 200));
  await context.close();
}

/* ---------- 12. A save from the previous build, at the future arrival ---------- */
{
  const { context, page } = await newPage({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('radio', { name: /Type-only/ }).click();
  await page.getByRole('button', { name: 'Play as Basil', exact: true }).click();
  const field = page.getByLabel('What do you do?');
  for (const line of [
    'take lantern','down','east','take wedge','west','west','west','in','east',
    'use wedge on shutter','place lantern in alcove','light lantern','open seam',
    'take lantern','take wedge','down','enter threshold','up','east','east',
    'talk to saffra','the cave on the hill','whether anything is coming',
    'why you asked','recite prophecy',
    'talk to fenn','how a boy gets past the foreman','leave',
    'west','west','down','north',
    'examine drawing','examine slate','examine dishes',
    'place lantern in high dish','enter aperture',
  ]) {
    await field.fill(line);
    await page.keyboard.press('Enter');
  }
  const atArrival = (await page.locator('.topbar-place').innerText()).toLowerCase();
  if (atArrival !== 'the broken chamber') bad('m3 endpoint save: setup', atArrival);

  /*
   * Rewrite it as the format-2 file the previous build left: ended, with its
   * objective, and the old marker still at the bottom of the transcript.
   */
  const KEY2 = 'cave-of-absolution:save';
  await page.evaluate((key) => {
    const save = JSON.parse(localStorage.getItem(key));
    save.schemaVersion = 2;
    save.ended = true;
    save.objective = 'Find out what happened here.';
    save.transcript.push({
      id: 'tLEGACY2',
      kind: 'system',
      text: '— End of the current content —\n\nThis is as far as the story is built.',
    });
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.removeItem('cave-of-absolution:backup');
    localStorage.removeItem('cave-of-absolution:checkpoint');
  }, KEY2);

  await page.reload();
  await page.getByRole('button', { name: /^Continue/ }).click();

  const place = (await page.locator('.topbar-place').innerText()).toLowerCase();
  place === 'the broken chamber'
    ? ok('m3 endpoint save: resumes in place, without replaying two chapters')
    : bad('m3 endpoint save: resumes in place', place);

  const shown = await page.locator('.transcript').innerText();
  shown.includes('This is as far as the story is built')
    ? ok('m3 endpoint save: the transcript the player read is still there')
    : bad('m3 endpoint save: the transcript the player read is still there');
  shown.includes('The story continues past this point now')
    ? ok('m3 endpoint save: and it is corrected rather than contradicted')
    : bad('m3 endpoint save: and it is corrected rather than contradicted');

  if ((await page.locator('.status').count()) === 0) await page.locator('.topbar-toggle').click();
  const objective = await page.getByLabel('Current objective').innerText();
  /out of this hill/.test(objective)
    ? ok('m3 endpoint save: the objective is what the hero needs next')
    : bad('m3 endpoint save: the objective is what the hero needs next', objective);

  const field2 = page.getByLabel('What do you do?');
  for (const line of ['up', 'east']) {
    await field2.fill(line);
    await page.keyboard.press('Enter');
  }
  const walked = (await page.locator('.topbar-place').innerText()).toLowerCase();
  walked === 'the settlement'
    ? ok('m3 endpoint save: plays on into content that did not exist when it was written')
    : bad('m3 endpoint save: plays on', walked);

  const version = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).schemaVersion, KEY2);
  version === 4 ? ok('m3 endpoint save: written back out in the current format')
                : bad('m3 endpoint save: written back out in the current format', String(version));
  await context.close();
}

/* ---------- 9. Switching mode mid-conversation and mid-puzzle ---------- */
{
  const { context, page } = await newPage({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('radio', { name: /Type-only/ }).click();
  await page.getByRole('button', { name: 'Play as Basil', exact: true }).click();
  const field = page.getByLabel('What do you do?');
  const run = async (lines) => {
    for (const line of lines) {
      await field.fill(line);
      await page.keyboard.press('Enter');
    }
  };

  // Mid-puzzle: the wedge is in, the lamp is not.
  await run([
    'take lantern','down','east','take wedge','west','west','west','in','east',
    'use wedge on shutter',
  ]);
  await openSettings(page);
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('radio', { name: /Selectable/ }).click();
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: /Close|Done/ }).first().click();
  const panel = page.getByRole('region', { name: 'Actions' });
  await panel.getByRole('button', { name: /^Things/ }).click();
  const puzzleIntact = await panel.getByRole('button', { name: /hooded lantern/ }).count();
  puzzleIntact > 0
    ? ok('switching to buttons mid-puzzle keeps the puzzle state')
    : bad('switching to buttons mid-puzzle keeps the puzzle state');

  // Finish the puzzle by clicking, then cross and open a conversation.
  await panel.getByRole('button', { name: /hooded lantern/ }).first().click();
  await panel.getByRole('button', { name: 'Put in...' }).click();
  await panel.getByRole('button', { name: /alcove/ }).click();
  await panel.getByRole('button', { name: /alcove/ }).first().click();
  await panel.getByRole('button', { name: /Light the/ }).click();
  await panel.getByRole('button', { name: /seam/ }).first().click();
  await panel.getByRole('button', { name: 'Open', exact: true }).click();
  await panel.getByRole('button', { name: /alcove/ }).first().click();
  await panel.getByRole('button', { name: /Take back the/ }).click();
  await panel.getByRole('button', { name: /^Go/ }).click();
  await panel.getByRole('button', { name: /opened passage/ }).click();
  await panel.getByRole('button', { name: /^Things/ }).click();
  await panel.getByRole('button', { name: /threshold/ }).first().click();
  await panel.getByRole('button', { name: 'Step into it' }).click();
  await panel.getByRole('button', { name: /^Go/ }).click();
  await panel.getByRole('button', { name: /stair up and out/ }).click();
  await panel.getByRole('button', { name: /track down the hill/ }).click();
  await panel.getByRole('button', { name: /village square/ }).click();
  await panel.getByRole('button', { name: /^People/ }).click();
  await panel.getByRole('button', { name: 'Talk to Saffra' }).click();

  // Mid-conversation: switch back to typing. The topics must still be there.
  await openSettings(page);
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('radio', { name: /Type-only/ }).click();
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: /Close|Done/ }).first().click();
  const listed = await page.locator('.transcript').innerText();
  listed.includes('You could ask about')
    ? ok('switching to typing mid-conversation keeps the topic list readable')
    : bad('switching to typing mid-conversation keeps the topic list readable');

  await run(['the cave on the hill', 'whether anything is coming', 'why you asked', 'recite prophecy']);
  const said = await page.locator('.transcript').innerText();
  said.includes('What stands will not stand')
    ? ok('a conversation started by clicking can be finished by typing')
    : bad('a conversation started by clicking can be finished by typing');
  await context.close();
}

/* ---------- 10. A save from the old prototype keeps playing ---------- */
{
  const { context, page } = await newPage({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('radio', { name: /Type-only/ }).click();
  await page.getByRole('button', { name: 'Play as Basil', exact: true }).click();
  const field = page.getByLabel('What do you do?');
  for (const line of [
    'take lantern','down','east','take wedge','west','west','west','in','east',
    'use wedge on shutter','place lantern in alcove','light lantern','open seam',
    'take lantern','down','enter threshold','up','east','east',
    'talk to saffra','the cave on the hill','whether anything is coming',
  ]) {
    await field.fill(line);
    await page.keyboard.press('Enter');
  }

  /*
   * Rewrite the stored save as the format-1 file the old build would have
   * left: schemaVersion 1, ended, the old objective, and the old marker still
   * at the bottom of the transcript the player is looking at.
   */
  const KEY = 'cave-of-absolution:save';
  await page.evaluate((key) => {
    const save = JSON.parse(localStorage.getItem(key));
    save.schemaVersion = 1;
    save.ended = true;
    save.objective = 'End of the opening chapter.';
    save.transcript.push({
      id: 'tLEGACY',
      kind: 'system',
      text: '— End of the opening chapter —\n\nThis is as far as the prototype goes.',
    });
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.removeItem('cave-of-absolution:backup');
    localStorage.removeItem('cave-of-absolution:checkpoint');
  }, KEY);

  await page.reload();
  const continueButton = page.getByRole('button', { name: /^Continue/ });
  (await continueButton.count()) > 0
    ? ok('legacy save: Continue is offered')
    : bad('legacy save: Continue is offered');
  await continueButton.click();

  const place = (await page.locator('.topbar-place').innerText()).toLowerCase();
  place === 'the village square'
    ? ok('legacy save: resumes in place without replaying the opening')
    : bad('legacy save: resumes in place without replaying the opening', place);

  const shown = await page.locator('.transcript').innerText();
  shown.includes('This is as far as the prototype goes')
    ? ok('legacy save: the transcript the player read is still there')
    : bad('legacy save: the transcript the player read is still there');
  shown.includes('The story continues past this point now')
    ? ok('legacy save: and it is corrected rather than contradicted')
    : bad('legacy save: and it is corrected rather than contradicted');

  if ((await page.locator('.status').count()) === 0) await page.locator('.topbar-toggle').click();
  const objective = await page.getByLabel('Current objective').innerText();
  /back to your own village/.test(objective)
    ? ok('legacy save: the objective points at the rest of the chapter')
    : bad('legacy save: the objective points at the rest of the chapter', objective);

  // And it plays on from there, into content that did not exist when it was written.
  const field2 = page.getByLabel('What do you do?');
  for (const line of ['talk to saffra', 'why you asked', 'recite prophecy']) {
    await field2.fill(line);
    await page.keyboard.press('Enter');
  }
  const carried = await page.locator('.transcript').innerText();
  carried.includes('That is not a poem')
    ? ok('legacy save: plays on into the new chapter')
    : bad('legacy save: plays on into the new chapter');

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).schemaVersion, KEY);
  stored === 4 ? ok('legacy save: written back out in the current format')
               : bad('legacy save: written back out in the current format', String(stored));
  await context.close();
}

/* ---------- 11. Checkpoint after the second crossing ---------- */
{
  const { context, page } = await newPage({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('radio', { name: /Type-only/ }).click();
  await page.getByRole('button', { name: 'Play as Basil', exact: true }).click();
  const field = page.getByLabel('What do you do?');
  for (const line of [
    'take lantern','down','east','take wedge','west','west','west','in','east',
    'use wedge on shutter','place lantern in alcove','light lantern','open seam',
    'take lantern','down','enter threshold','up','east','east',
    'talk to saffra','the cave on the hill','whether anything is coming',
    'why you asked','recite prophecy',
    'talk to fenn','how a boy gets past the foreman','leave',
    'west','west','down','north',
    'examine drawing','examine slate','examine dishes',
    'place lantern in high dish','enter aperture',
    'up','examine bird','east',
    'talk to rue','what she is sitting against','the oldest thing she knows','leave',
    'examine account','examine memorial','journal',
    // This route left the wedge under the shutter a century ago, so both tools
    // come out of the goat shed where the workshop used to be.
    'examine shell','take maul','take blocks','reflect',
    'west','west','talk to sorrel','why the hill is walled up',
    'whether the wall is as good as it looks','leave',
    'use wedge on seal','break seal','break seal',
    'west','examine fill','clear fill','place lantern in middle dish','enter aperture',
    'examine them','journal','inventory',
  ]) {
    await field.fill(line);
    await page.keyboard.press('Enter');
  }
  await openSettings(page);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Restart from checkpoint' }).click();
  await page.waitForTimeout(150);
  const place = (await page.locator('.topbar-place').innerText()).toLowerCase();
  place === 'the sealed chamber'
    ? ok('checkpoint restart after the last crossing: back at the return')
    : bad('checkpoint restart after the last crossing', place);
  // Suitable for continuing from: the eye and the reason are both still there.
  const resumed = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')));
  resumed.chapter === 'return' &&
  resumed.flags['lost_eye'] === true &&
  resumed.flags['knows_responsibility'] === true
    ? ok('the checkpoint is a state the last chapter could continue from')
    : bad('the checkpoint is continuable', JSON.stringify(resumed.flags).slice(0, 120));
  await context.close();
}

/* ---------- 13. Reloads at each stage, and 360px with one eye ---------- */
{
  const { context, page, errors } = await newPage({ width: 360, height: 740 });
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('radio', { name: /Type-only/ }).click();
  await page.getByRole('button', { name: 'Play as Basilia' }).click();
  const field = () => page.getByLabel('What do you do?');
  const run = async (lines) => {
    for (const line of lines) {
      await field().fill(line);
      await page.keyboard.press('Enter');
    }
  };
  /** Reload, Continue, and report where we ended up. */
  const reloadAndContinue = async () => {
    await page.reload();
    await page.getByRole('button', { name: /^Continue/ }).click();
    return (await page.locator('.topbar-place').innerText()).toLowerCase();
  };

  await run([
    'take lantern','down','east','take wedge','west','west','west','in','east',
    'use wedge on shutter','place lantern in alcove','light lantern','open seam',
    'take lantern','take wedge','down','enter threshold','up','east','east',
    'talk to saffra','the cave on the hill','whether anything is coming',
    'why you asked','recite prophecy',
    'talk to fenn','how a boy gets past the foreman','leave',
    'west','west','down','north',
    'examine drawing','examine slate','examine dishes',
    'place lantern in high dish','enter aperture',
    'up','examine bird','east',
    'talk to rue','what she is sitting against','the oldest thing she knows','leave',
    'examine account',
  ]);

  // Mid-investigation.
  const midway = await reloadAndContinue();
  const midFlags = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')).flags);
  midway === 'the settlement' && midFlags['read_account'] === true &&
  midFlags['heard_missing_child'] === true && midFlags['knows_responsibility'] === undefined
    ? ok('reload mid-investigation: evidence kept, conclusion not jumped to')
    : bad('reload mid-investigation', `${midway} / ${JSON.stringify(midFlags).slice(0, 120)}`);

  await run(['examine memorial','journal','examine shell','take maul','reflect']);
  const concluded = await page.locator('.transcript').innerText();
  concluded.includes('I know it was me') || concluded.includes('the shape is this')
    ? ok('the inference is the hero putting it together, not a lecture')
    : bad('the inference reads as the hero');

  await run([
    'west','west','talk to sorrel','why the hill is walled up',
    'whether the wall is as good as it looks','leave',
    'use wedge on seal','break seal','break seal',
  ]);

  // After the injury.
  const afterInjury = await reloadAndContinue();
  const injuredFlags = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')).flags);
  afterInjury === 'the sealed mouth' && injuredFlags['lost_eye'] === true &&
  injuredFlags['seal_opened'] === true
    ? ok('reload after the injury: it persists, and is not replayed')
    : bad('reload after the injury', `${afterInjury} / ${JSON.stringify(injuredFlags).slice(0, 120)}`);

  const beforeCount = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save'))
      .journal.filter((e) => e.id === 'j.lost_eye').length);
  await run(['break seal', 'look']);
  const afterCount = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save'))
      .journal.filter((e) => e.id === 'j.lost_eye').length);
  beforeCount === 1 && afterCount === 1
    ? ok('swinging again after the seal is open does not take a second eye')
    : bad('the injury is once only', `${beforeCount} -> ${afterCount}`);

  // No interface penalty: the whole screen is still there and still usable.
  const chrome = await page.evaluate(() => {
    const t = document.querySelector('.transcript');
    const cs = getComputedStyle(document.body);
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      transcriptVisible: t.clientHeight > 0,
      filters: [...document.querySelectorAll('body *')].some(
        (el) => getComputedStyle(el).filter !== 'none'
      ),
      /*
       * Visually-hidden helpers legitimately clip themselves to a point; that
       * is how a screen-reader-only label works. Anything else clipping or
       * masking would be a monocular effect, which this game does not have.
       */
      clipped: [...document.querySelectorAll('body *')]
        .filter((el) => !el.classList.contains('sr-only'))
        .map((el) => {
          const s = getComputedStyle(el);
          return s.clipPath !== 'none' || s.mask !== 'none'
            ? `${el.tagName}.${el.className}`
            : null;
        })
        .filter(Boolean),
      opacity: cs.opacity,
    };
  });
  chrome.overflow <= 0 && chrome.transcriptVisible && !chrome.filters &&
  chrome.clipped.length === 0 && chrome.opacity === '1'
    ? ok('360px after the injury: no filter, no mask, no accessibility penalty')
    : bad('360px after the injury', JSON.stringify(chrome));

  await run(['west','examine fill','clear fill','place lantern in middle dish']);

  // The hero will not go back without something heavy, and says why.
  await run(['drop mallet', 'enter aperture']);
  const withoutTool = await page.locator('.transcript').innerText();
  const stillHere = (await page.locator('.topbar-place').innerText()).toLowerCase();
  withoutTool.includes('Go and get something heavy') && stillHere === 'the crushed chamber'
    ? ok('crossing back is refused without the tool the last chapter needs')
    : bad('mallet gate', `${stillHere}`);

  await run(['take mallet', 'enter aperture']);

  // At the return, with the confrontation ahead of them.
  const atReturn = await reloadAndContinue();
  const returnState = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')));
  atReturn === 'the sealed chamber' && returnState.chapter === 'return' &&
  returnState.era === 'present' && returnState.ended === false &&
  returnState.flags['finale_stage'] === 'arrival'
    ? ok('reload at the return: chapter, era, place and stage all survive')
    : bad('reload at the return', `${atReturn} / ${returnState.chapter}/${returnState.era}`);

  // Mid-argument.
  await run(['talk to them', 'show self', 'show lantern']);
  await reloadAndContinue();
  const midArgument = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')));
  midArgument.flags['identity_accepted'] === true &&
  midArgument.flags['finale_stage'] === 'talking' &&
  midArgument.flags['earlier_self_dead'] === undefined
    ? ok('reload mid-argument: what has been said survives, and nothing has advanced')
    : bad('reload mid-argument', JSON.stringify(midArgument.flags).slice(0, 140));

  // After the killing.
  await run(['tell them about the prophecy', 'block wall', 'hold them', 'kill them']);
  await reloadAndContinue();
  const afterKill = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')));
  const killCount = afterKill.journal.filter((e) => e.id === 'j.killed').length;
  afterKill.flags['earlier_self_dead'] === true &&
  afterKill.flags['hero_dead'] === undefined && killCount === 1
    ? ok('reload after the killing: it persists, is not replayed, and the hero is alive')
    : bad('reload after the killing', `dead=${afterKill.flags['earlier_self_dead']} n=${killCount}`);

  // Before the commitment.
  await run(['break pillar', 'break pillar']);
  await reloadAndContinue();
  const beforeCommit = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')));
  beforeCommit.flags['pillar_struck'] === 2 &&
  beforeCommit.flags['escape_closed'] === true &&
  beforeCommit.flags['cave_destroyed'] === undefined
    ? ok('reload before the commitment: two blows in, and nothing committed')
    : bad('reload before the commitment', JSON.stringify(beforeCommit.flags).slice(0, 140));

  // The confirmation, declined and then taken.
  await run(['break pillar', 'not yet']);
  const declined = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')));
  declined.flags['cave_destroyed'] === undefined && declined.chapter === 'return'
    ? ok('the last blow asks, and takes no for an answer')
    : bad('the commitment', JSON.stringify(declined.flags).slice(0, 120));

  await run(['break pillar', 'swing']);

  // After completion.
  const atEnd = await reloadAndContinue();
  const endState = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')));
  atEnd === 'the sealed chamber' && endState.chapter === 'ending' &&
  endState.ended === true && endState.flags['hero_dead'] === true &&
  endState.flags['cave_destroyed'] === true
    ? ok('reload after the ending: it reloads as finished, not as a living hero')
    : bad('reload after the ending', `${atEnd} / ${endState.chapter}`);

  const stillPanel = await page.getByRole('region', { name: 'Actions' })
    .getByRole('button', { name: 'Read the ending again' }).count();
  stillPanel === 1
    ? ok('a finished save reloads into the ending, not a fresh confrontation')
    : bad('finished save reloads into the ending', String(stillPanel));

  // One lantern record all the way through, and it is the hero's.
  returnState.placements.lantern.kind === 'carried' &&
  Object.keys(returnState.placements).filter((k) => k === 'lantern').length === 1
    ? ok("the earlier self's belongings are not in the hero's inventory")
    : bad('item records at the return', JSON.stringify(returnState.placements).slice(0, 140));

  // Back to the start of the chapter: the ending must not have written over it.
  await openSettings(page);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('dialog', { name: 'Settings' })
    .getByRole('button', { name: 'Restart from checkpoint' }).click();
  await page.waitForTimeout(150);
  const restarted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cave-of-absolution:save')));
  restarted.chapter === 'return' &&
  restarted.flags['earlier_self_dead'] === undefined &&
  restarted.flags['hero_dead'] === undefined &&
  restarted.inventory.includes('mallet')
    ? ok('the ending keeps a checkpoint at the start of the chapter, not over it')
    : bad('finale checkpoint', `${restarted.chapter} ${JSON.stringify(restarted.inventory)}`);

  errors.length === 0
    ? ok('no console errors across three chapters and four reloads')
    : bad('console errors', errors.join(' | ').slice(0, 200));
  await context.close();
}

await browser.close();

const failures = results.filter(([s]) => s === 'FAIL').length;
console.log(`\n${results.length - failures}/${results.length} checks passed`);
process.exit(failures ? 1 : 0);
