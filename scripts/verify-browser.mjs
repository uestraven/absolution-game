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

  await page.waitForTimeout(700);
  const scrolling = await page.evaluate(() => {
    const t = document.querySelector('.transcript');
    return {
      docScrolls: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
      transcriptOverflows: t.scrollHeight > t.clientHeight + 1,
      atBottom: t.scrollHeight - t.scrollTop - t.clientHeight < 8,
      newestVisible: t.lastElementChild.getBoundingClientRect().bottom <= t.getBoundingClientRect().bottom + 2,
    };
  });
  !scrolling.docScrolls && scrolling.transcriptOverflows && scrolling.atBottom && scrolling.newestVisible
    ? ok('the transcript is the scroller and follows the newest output')
    : bad('the transcript is the scroller and follows the newest output', JSON.stringify(scrolling));

  const overflow2 = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  overflow2 <= 0 ? ok('360px: still no horizontal scrolling mid-play')
                 : bad('360px: still no horizontal scrolling mid-play', `${overflow2}px`);

  // Let any earlier glide finish, or it will overwrite the reset below and the
  // samples will describe a one-pixel nudge instead of real motion.
  await page.waitForTimeout(700);
  const glide = await page.evaluate(async () => {
    const t = document.querySelector('.transcript');
    t.scrollTop = 0;
    await new Promise((r) => requestAnimationFrame(() => r()));
    // A real action, so there is genuinely new output to glide to.
    [...document.querySelectorAll('.panel-meta button')]
      .find((b) => b.textContent.trim() === 'look')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const samples = [];
    await new Promise((resolve) => {
      let n = 0;
      const tick = () => {
        samples.push(t.scrollTop);
        if (++n < 40) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    await new Promise((r) => setTimeout(r, 700));
    const distanceToBottom = t.scrollHeight - t.scrollTop - t.clientHeight;
    // Deltas between frames: a cubic ease-out decelerates steadily.
    const deltas = samples.slice(1).map((v, i) => Math.abs(v - samples[i])).filter((d) => d > 0);
    return {
      samples: samples.slice(0, 4).map((v) => +v.toFixed(2)),
      deltas: deltas.slice(0, 4),
      decelerates: deltas.length >= 2 && deltas[0] > deltas[deltas.length - 1] * 2,
      distanceToBottom: +distanceToBottom.toFixed(2),
      settled: distanceToBottom < 2,
      animated: new Set(samples.map((v) => Math.round(v))).size > 1,
    };
  });
  glide.settled && glide.animated
    ? ok(
        'the kinetic glide animates and lands at the bottom',
        `${glide.samples.join(' -> ')} ... ${glide.distanceToBottom}px`
      )
    : bad('the kinetic glide', JSON.stringify(glide));
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

  // An action always returns to the bottom, wherever the reader had got to.
  await page.evaluate(() => { document.querySelector('.transcript').scrollTop = 0; });
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: 'look' }).click();
  await page.waitForTimeout(700);
  const afterAction = await page.evaluate(() => {
    const t = document.querySelector('.transcript');
    return t.scrollHeight - t.scrollTop - t.clientHeight;
  });
  afterAction < 2
    ? ok('every action scrolls to the bottom, even from the top of the history')
    : bad('an action did not scroll to the bottom', `${afterAction.toFixed(2)}px short`);

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
  ];
  for (const line of script) {
    await field.fill(line);
    await page.keyboard.press('Enter');
  }

  const whole = await page.locator('.transcript').innerText();
  const place = (await page.locator('.topbar-place').innerText()).toLowerCase();
  place === 'the broken chamber'
    ? ok('keyboard only: both chapters completed to the future arrival')
    : bad('keyboard only: both chapters completed to the future arrival', place);

  // The canonical prophecy, spoken in the square a century before the plank.
  whole.includes('One who braves the Cave of Absolution will have the power to turn it aside')
    ? ok('keyboard only: the recitation says the canonical text')
    : bad('keyboard only: the recitation says the canonical text');

  const ended = await page.locator('.entry-system', { hasText: 'End of the current content' }).count();
  ended > 0 ? ok('keyboard only: end-of-current-content marker shown')
            : bad('keyboard only: end-of-current-content marker shown');

  whole.includes('This is not the ending')
    ? ok('end state: the marker does not claim to be the ending')
    : bad('end state: the marker does not claim to be the ending');

  // The objective folds away by default now; open the disclosure to read it.
  if ((await page.locator('.status').count()) === 0) {
    await page.locator('.topbar-toggle').click();
  }
  const objective = await page.getByLabel('Current objective').innerText();
  objective.includes('what happened here') ? ok('end state: objective updated')
                                           : bad('end state: objective updated', objective);

  // The player can keep looking around after the end.
  await field.fill('examine tear');
  await page.keyboard.press('Enter');
  const stillPlayable = await page.locator('.transcript').innerText();
  stillPlayable.includes('daylight in it') ? ok('end state: inspection still possible')
                                           : bad('end state: inspection still possible');

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
  const endAfter = await page.locator('.entry-system', { hasText: 'End of the current content' }).count();
  after === 'the broken chamber' && endAfter > 0
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
  storedAfter === storedBefore && place2 === 'the broken chamber' && hasButtons > 0 && endingStillShown > 0
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
  exported.locationId === 'future.deep_chamber' &&
  exported.schemaVersion === 2
    ? ok('export: file contains the current state, in the current format')
    : bad('export: file contents', JSON.stringify(exported).slice(0, 140));

  /* ---------- 6. Checkpoint restart ---------- */
  page.once('dialog', (d) => d.accept());
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Restart from checkpoint' }).click();
  const place3 = (await page.locator('.topbar-place').innerText()).toLowerCase();
  // The chapter advanced at each crossing, so the checkpoint is the arrival in
  // the broken chamber rather than the bedroom or the basin.
  place3 === 'the broken chamber'
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
  const endedImported = await page.locator('.entry-system', { hasText: 'End of the current content' }).count();
  placeImported === 'the broken chamber' && endedImported > 0
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
  /Import refused/.test(toast) && placeAfterBad === 'the broken chamber'
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
  /overwrite your saved progress/.test(asked) && placeAfterCancel === 'the broken chamber'
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
  const thing = async (name, verb) => {
    await category('Things');
    await tap(name);
    await tap(verb, true);
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
    ? ok('selectable mode: both chapters completed with no typing at all')
    : bad('selectable mode: both chapters completed with no typing at all', arrived);

  const noExits = await panel.getByRole('button', { name: /^Go/ }).count();
  noExits === 0
    ? ok('arrival room offers no way on, because there is not one yet')
    : bad('arrival room offers no way on, because there is not one yet', String(noExits));

  errors.length === 0 ? ok('selectable mode: no console errors across both chapters')
                      : bad('selectable mode: console errors', errors.join(' | ').slice(0, 200));
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
  stored === 2 ? ok('legacy save: written back out in the current format')
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
    'examine basin','examine tear',
  ]) {
    await field.fill(line);
    await page.keyboard.press('Enter');
  }
  await openSettings(page);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Restart from checkpoint' }).click();
  await page.waitForTimeout(150);
  const place = (await page.locator('.topbar-place').innerText()).toLowerCase();
  place === 'the broken chamber'
    ? ok('checkpoint restart after the second crossing: back at the arrival')
    : bad('checkpoint restart after the second crossing', place);
  await context.close();
}

await browser.close();

const failures = results.filter(([s]) => s === 'FAIL').length;
console.log(`\n${results.length - failures}/${results.length} checks passed`);
process.exit(failures ? 1 : 0);
