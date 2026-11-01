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
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: /hooded lantern/ }).click();
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: 'Take', exact: true }).click();
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: /lane down to the square/ }).click();
  const place = await page.locator('.topbar-place').innerText();
  place === 'The Village Square' ? ok('selectable mode: buttons move the story')
                                 : bad('selectable mode: buttons move the story', place);

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

  await page.evaluate(() => { document.querySelector('.transcript').scrollTop = 0; });
  await page.getByRole('region', { name: 'Actions' }).getByRole('button', { name: 'Look around' }).click();
  await page.waitForTimeout(80);
  const held = await page.evaluate(() => document.querySelector('.transcript').scrollTop);
  held < 40 ? ok('reading history is not yanked back to the bottom', `scrollTop ${held}`)
            : bad('reading history is not yanked back to the bottom', `scrollTop ${held}`);

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

  const script = [
    'take lantern','down','east','take wedge','west','west','west','in',
    'examine relief','east','open shutter','use wedge on shutter',
    'place lantern in alcove','light lantern','examine wall','open seam',
    'take lantern','take wedge','down','examine threshold','enter threshold',
    'up','east','talk to sabra','the cave on the hill','whether anything is coming',
  ];
  for (const line of script) {
    await field.fill(line);
    await page.keyboard.press('Enter');
  }

  const ended = await page.locator('.entry-system', { hasText: 'End of the opening chapter' }).count();
  ended > 0 ? ok('keyboard only: chapter completed to the end-of-prototype message')
            : bad('keyboard only: chapter completed to the end-of-prototype message');

  const objective = await page.getByLabel('Current objective').innerText();
  objective.includes('End of the opening chapter') ? ok('end state: objective updated')
                                                   : bad('end state: objective updated', objective);

  // The player can keep looking around after the end.
  await field.fill('examine tree');
  await page.keyboard.press('Enter');
  const stillPlayable = await page.locator('.transcript').innerText();
  stillPlayable.includes('rope swing') ? ok('end state: inspection still possible')
                                       : bad('end state: inspection still possible');

  const tone = await page.locator('.app').getAttribute('data-tone');
  tone === 'village' ? ok('era tone applied (village palette in the past square)')
                     : bad('era tone applied', String(tone));

  errors.length === 0 ? ok('no console or page errors (type-only full run)')
                      : bad('no console or page errors (type-only full run)', errors.join(' | '));

  /* ---------- 3. Reload mid-story keeps progress ---------- */
  await page.reload();
  await page.getByRole('button', { name: 'Continue' }).click();
  const after = await page.locator('.topbar-place').innerText();
  const endAfter = await page.locator('.entry-system', { hasText: 'End of the opening chapter' }).count();
  after === 'The Village Square' && endAfter > 0
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
  const place2 = await page.locator('.topbar-place').innerText();
  const hasButtons = await page.getByRole('region', { name: 'Actions' }).getByRole('button').count();
  const endingStillShown = await page.locator('.entry-narration', { hasText: 'You are a long way from home' }).count();
  storedAfter === storedBefore && place2 === 'The Village Square' && hasButtons > 0 && endingStillShown > 0
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
  exported.ended === true && exported.locationId === 'past.square'
    ? ok('export: file contains the finished state')
    : bad('export: file contents', JSON.stringify(exported).slice(0, 120));

  /* ---------- 6. Checkpoint restart ---------- */
  page.once('dialog', (d) => d.accept());
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Restart from checkpoint' }).click();
  const place3 = await page.locator('.topbar-place').innerText();
  // The chapter advanced at the crossing, so the checkpoint is the arrival in
  // the past rather than the bedroom.
  place3 === 'The Basin Chamber'
    ? ok('checkpoint restart: back at the start of the current chapter', place3)
    : bad('checkpoint restart: back at the start of the current chapter', place3);

  /* ---------- 6b. Import the exported save back ---------- */
  await openSettings(page);
  page.once('dialog', (d) => d.accept());
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Import Save' }).click();
  await (await chooser).setFiles(await file.path());
  await page.waitForTimeout(150);
  const placeImported = await page.locator('.topbar-place').innerText();
  const endedImported = await page.locator('.entry-system', { hasText: 'End of the opening chapter' }).count();
  placeImported === 'The Village Square' && endedImported > 0
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
  const placeAfterBad = await page.locator('.topbar-place').innerText();
  /Import refused/.test(toast) && placeAfterBad === 'The Village Square'
    ? ok('import: a malformed file is refused and the game is untouched', toast.split('\n')[0].slice(0, 60))
    : bad('import: a malformed file is refused', `${toast} / ${placeAfterBad}`);
  await (await import('node:fs/promises')).rm(badFile, { force: true });

  /* ---------- 6d. New Game asks before overwriting ---------- */
  let asked = '';
  page.once('dialog', (d) => { asked = d.message(); d.dismiss(); });
  await openSettings(page);
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'New Game' }).click();
  await page.waitForTimeout(100);
  const placeAfterCancel = await page.locator('.topbar-place').innerText();
  /overwrite your saved progress/.test(asked) && placeAfterCancel === 'The Village Square'
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
  const place = await page.locator('.topbar-place').innerText();
  const inv = await page.locator('.topbar-who').innerText();
  place === 'Your Room' && !/carrying/.test(inv)
    ? ok('checkpoint restart mid-rite: back in the bedroom with nothing carried')
    : bad('checkpoint restart mid-rite', `${place} / ${inv}`);
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
  const place = await page.locator('.topbar-place').innerText();
  place === 'The Village Square' ? ok('storage failure: play continues')
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
  const duration = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.btn')).transitionDuration);
  /^0\.?0*0?0?1?m?s?$|^0s$/.test(duration) || parseFloat(duration) < 0.01
    ? ok('reduced motion: transitions collapsed', duration)
    : bad('reduced motion: transitions collapsed', duration);
  await context.close();
}

await browser.close();

const failures = results.filter(([s]) => s === 'FAIL').length;
console.log(`\n${results.length - failures}/${results.length} checks passed`);
process.exit(failures ? 1 : 0);
