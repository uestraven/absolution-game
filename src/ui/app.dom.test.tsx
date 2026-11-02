import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from './App';
import { KEYS } from '../persistence/storage';

beforeEach(() => {
  localStorage.clear();
});

/** Walks the title screen through character selection into play. */
async function startPlaying(mode: 'select' | 'type') {
  const user = (await import('@testing-library/user-event')).default.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'New Game' }));
  if (mode === 'type') {
    await user.click(screen.getByRole('radio', { name: /Type-only/ }));
  }
  await user.click(screen.getByRole('button', { name: 'Play as Basil' }));
  return user;
}

describe('the interface', () => {
  it('offers New Game but not Continue on a clean browser', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'New Game' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  });

  it('offers Continue once a save exists', () => {
    // As written by a previous session.
    localStorage.setItem(
      KEYS.save,
      JSON.stringify({
        schemaVersion: 1,
        contentVersion: '0.1.0',
        character: 'basil',
        chapter: 'rite',
        era: 'present',
        locationId: 'present.square',
        inventory: ['lantern'],
        placements: { lantern: { kind: 'carried' } },
        discovered: [],
        flags: {},
        journal: [],
        transcript: [],
        visited: ['present.home', 'present.square'],
        objective: 'Undertake the rite of the Cave of Absolution.',
        pending: null,
        turn: 3,
        ended: false,
        seq: 9,
      })
    );
    render(<App />);
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
  });
});

describe('selectable mode', () => {
  it('plays with buttons only, and shows no text input', async () => {
    const user = await startPlaying('select');

    expect(screen.queryByLabelText('What do you do?')).toBeNull();
    expect(screen.getAllByText('Your Room').length).toBeGreaterThan(0);

    const panel = screen.getByRole('region', { name: 'Actions' });
    await user.click(within(panel).getByRole('button', { name: /lane down to the square/ }));

    expect(screen.getAllByText('The Village Square').length).toBeGreaterThan(0);
  });

  it('expands a thing to reveal its ordinary verbs', async () => {
    const user = await startPlaying('select');
    const panel = screen.getByRole('region', { name: 'Actions' });
    // Things are behind their category now, so the story gets the screen.
    await user.click(within(panel).getByRole('button', { name: /^Things/ }));
    await user.click(within(panel).getByRole('button', { name: /hooded lantern/ }));
    expect(within(panel).getByRole('button', { name: 'Take' })).toBeTruthy();
    await user.click(within(panel).getByRole('button', { name: 'Take' }));
    const log = screen.getByRole('log', { name: 'Story so far' });
    expect(log.textContent).toMatch(/lift the lantern off the sill/);
  });
});

describe('type-only mode', () => {
  it('shows a labelled command field and no room-action buttons', async () => {
    const user = await startPlaying('type');
    expect(screen.getByLabelText('What do you do?')).toBeTruthy();
    const panel = screen.queryByRole('region', { name: 'Actions' });
    expect(panel).toBeTruthy();
    expect(within(panel!).queryByRole('button', { name: /lane down to the square/ })).toBeNull();

    await user.type(screen.getByLabelText('What do you do?'), 'take lantern{Enter}');
    const log = screen.getByRole('log', { name: 'Story so far' });
    expect(log.textContent).toMatch(/lift the lantern off the sill/);
    // The command itself is echoed back into the transcript.
    expect(within(log).getByText('take lantern')).toBeTruthy();
  });

  it('reports unrecognised input without changing anything', async () => {
    const user = await startPlaying('type');
    await user.type(screen.getByLabelText('What do you do?'), 'xyzzy{Enter}');
    const log = screen.getByRole('log', { name: 'Story so far' });
    expect(within(log).getByText(/HELP lists everything this story understands/)).toBeTruthy();
  });
});

describe('switching modes', () => {
  it('keeps the exact position and the transcript', async () => {
    const user = await startPlaying('type');
    await user.type(screen.getByLabelText('What do you do?'), 'take lantern{Enter}');
    await user.type(screen.getByLabelText('What do you do?'), 'down{Enter}');
    expect(screen.getAllByText('The Village Square').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    await user.click(within(dialog).getByRole('radio', { name: 'Selectable Actions' }));
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));

    // Same place, same history, now with buttons.
    expect(screen.getAllByText('The Village Square').length).toBeGreaterThan(0);
    const log = screen.getByRole('log', { name: 'Story so far' });
    expect(log.textContent).toMatch(/lift the lantern off the sill/);
    expect(screen.queryByLabelText('What do you do?')).toBeNull();
    const panel = screen.getByRole('region', { name: 'Actions' });
    expect(within(panel).getByRole('button', { name: /joiner's workshop/ })).toBeTruthy();
  });
});

describe('dialogue options in each mode', () => {
  it('writes the numbered list out for type-only play', async () => {
    const user = await startPlaying('type');
    const field = screen.getByLabelText('What do you do?');
    for (const line of ['take lantern', 'down', 'talk to sage']) {
      await user.clear(field);
      await user.type(field, `${line}{Enter}`);
    }
    const log = screen.getByRole('log', { name: 'Story so far' });
    // The topic label is a tinted span, so the line is split across elements.
    expect(log.textContent).toMatch(/1\. the prophecy/);
    expect(log.textContent).toMatch(/0\. leave/);
  });

  it('shows them as buttons instead for selectable play, without duplicating the text', async () => {
    const user = await startPlaying('select');
    const panel = () => within(screen.getByRole('region', { name: 'Actions' }));
    await user.click(panel().getByRole('button', { name: /lane down to the square/ }));
    await user.click(panel().getByRole('button', { name: /^People/ }));
    await user.click(panel().getByRole('button', { name: 'Talk to Sage' }));

    expect(panel().getByRole('button', { name: '1. the prophecy' })).toBeTruthy();
    const log = screen.getByRole('log', { name: 'Story so far' });
    expect(log.textContent).not.toMatch(/0\. leave/);

    // Switching to typing reveals the same list in the transcript: it was
    // recorded all along, only hidden.
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    await user.click(within(dialog).getByRole('radio', { name: 'Type-only' }));
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('log', { name: 'Story so far' }).textContent).toMatch(/0\. leave/);
  });
});

describe('accessibility affordances', () => {
  it('has a live region that carries only the newest output', async () => {
    const user = await startPlaying('type');
    const live = document.querySelector('[aria-live="polite"]');
    expect(live).toBeTruthy();
    await user.type(screen.getByLabelText('What do you do?'), 'take lantern{Enter}');
    expect(live!.textContent).toMatch(/lift the lantern off the sill/);
    // Not the whole history.
    expect(live!.textContent).not.toMatch(/You turn sixteen today/);
  });

  it('labels the transcript as a log and keeps it focusable', async () => {
    await startPlaying('select');
    const log = screen.getByRole('log', { name: 'Story so far' });
    expect(log.getAttribute('tabindex')).toBe('0');
  });

  it('keeps the location visible without spending lines on the rest', async () => {
    await startPlaying('select');
    // The location stays on screen; the subtitle and objective fold away, so
    // the story gets those lines back.
    expect(screen.getByRole('button', { name: /show subtitle and objective/ })).toBeTruthy();
    expect(screen.getAllByText('Your Room').length).toBeGreaterThan(0);
    expect(screen.queryByLabelText('Current objective')).toBeNull();
  });

  it('shows the objective as text, one keystroke away, when expanded', async () => {
    const user = await startPlaying('select');
    const toggle = screen.getByRole('button', { name: /show subtitle and objective/ });
    await user.click(toggle);
    const objective = screen.getByLabelText('Current objective');
    expect(objective.textContent).toContain('Undertake the rite');
    // And the choice is remembered, so it is not a per-session nuisance.
    expect(JSON.parse(localStorage.getItem('cave-of-absolution:prefs')!).showStatus).toBe(true);
  });

  it('reaches the disclosure with the keyboard', async () => {
    const user = await startPlaying('select');
    const toggle = screen.getByRole('button', { name: /show subtitle and objective/ });
    toggle.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByLabelText('Current objective')).toBeTruthy();
  });

  /*
   * jsdom has no layout, so the arithmetic of where to sit is tested in
   * cascade.test.ts and the measurement in the browser pass. What is worth
   * testing here is the wiring: how often the position is written to, and when.
   */
  it('moves the reading position once per action, and not for other renders', async () => {
    const user = await startPlaying('type');
    const log = screen.getByRole('log', { name: 'Story so far' });

    // Count writes to scrollTop on this element only.
    let writes = 0;
    let value = 0;
    Object.defineProperty(log, 'scrollTop', {
      configurable: true,
      get: () => value,
      set: (next: number) => {
        writes++;
        value = next;
      },
    });

    const input = screen.getByLabelText('What do you do?');
    await user.type(input, 'look{Enter}');
    // One action, one move — however many narration, objective and journal
    // blocks it produced.
    expect(writes).toBe(1);

    await user.type(input, 'journal{Enter}');
    expect(writes).toBe(2);

    // Opening and closing settings is not an action, so the reader stays put.
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Settings' })).getByRole('button', {
        name: 'Close',
      })
    );
    expect(writes).toBe(2);

    // Nor is folding the status bar.
    await user.click(screen.getByRole('button', { name: /show subtitle and objective/ }));
    expect(writes).toBe(2);
  });

  /**
   * A stand-in layout, and a record of where the transcript gets put.
   *
   * jsdom reports every dimension as zero and ignores writes to `scrollTop`,
   * so the two first-paint positions are indistinguishable without this. The
   * patch has to be on the prototype rather than the element, because the
   * position is set in the layout effect of the render that creates it —
   * there is no moment in between to attach a spy to.
   */
  function withLayout(scrollHeight: number, clientHeight: number) {
    const names = ['scrollTop', 'scrollHeight', 'clientHeight'] as const;
    const originals = names.map((n) => [n, Object.getOwnPropertyDescriptor(Element.prototype, n)] as const);
    const writes: number[] = [];
    const tops = new WeakMap<Element, number>();
    Object.defineProperty(Element.prototype, 'scrollTop', {
      configurable: true,
      get(this: Element) {
        return tops.get(this) ?? 0;
      },
      set(this: Element, next: number) {
        tops.set(this, next);
        if (this.classList.contains('transcript')) writes.push(next);
      },
    });
    Object.defineProperty(Element.prototype, 'scrollHeight', {
      configurable: true,
      get: () => scrollHeight,
    });
    Object.defineProperty(Element.prototype, 'clientHeight', {
      configurable: true,
      get: () => clientHeight,
    });
    return {
      writes,
      restore: () => {
        for (const [name, descriptor] of originals) {
          if (descriptor) Object.defineProperty(Element.prototype, name, descriptor);
        }
      },
    };
  }

  it('opens a new game at the top of the opening', async () => {
    const { writes, restore } = withLayout(5000, 400);
    try {
      const user = (await import('@testing-library/user-event')).default.setup();
      render(<App />);
      await user.click(screen.getByRole('button', { name: 'New Game' }));
      await user.click(screen.getByRole('button', { name: 'Play as Basil' }));
      // The opening is the first page of the story, and it is read from the top.
      expect(writes.length).toBeGreaterThan(0);
      expect(writes[0]).toBe(0);
      expect(screen.getByRole('log', { name: 'Story so far' }).scrollTop).toBe(0);
    } finally {
      restore();
    }
  });

  it('does not resume at the end of a transcript nobody has read', async () => {
    // A save mid-play, as Continue would find it.
    const first = await startPlaying('select');
    await first.click(
      within(screen.getByRole('region', { name: 'Actions' })).getByRole('button', { name: 'look' })
    );
    cleanup();

    const { writes, restore } = withLayout(5000, 400);
    try {
      const user = (await import('@testing-library/user-event')).default.setup();
      render(<App />);
      await user.click(screen.getByRole('button', { name: 'Continue' }));
      /*
       * Where exactly it lands needs a layout engine and is measured in the
       * browser pass. What is testable here is that it is not the bottom:
       * `snapToBottom` asked for the whole content height, and resuming at the
       * end of an unread passage is the thing the rule exists to prevent.
       */
      expect(writes.length).toBeGreaterThan(0);
      expect(writes[0]).not.toBe(5000);
    } finally {
      restore();
    }
  });

  it('does not move focus when it moves the transcript', async () => {
    await startPlaying('select');
    const log = screen.getByRole('log', { name: 'Story so far' });
    // A reader who has focused the history to arrow-key through it keeps it.
    log.focus();
    expect(document.activeElement).toBe(log);
    /*
     * Dispatched rather than clicked through user-event, because a real click
     * focuses the button it lands on and would hide the thing being tested.
     */
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Actions' })).getByRole('button', { name: 'look' })
    );
    expect(document.activeElement).toBe(log);
  });

  it('does not steal focus from the transcript while reading', async () => {
    const user = await startPlaying('type');
    const log = screen.getByRole('log', { name: 'Story so far' });
    log.focus();
    expect(document.activeElement).toBe(log);
    // Re-rendering because of a tick elsewhere must not grab focus back.
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Settings' })).getByRole('button', {
        name: 'Close',
      })
    );
    expect(document.activeElement).not.toBe(screen.getByLabelText('What do you do?'));
  });
});
