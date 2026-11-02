import { describe, expect, it } from 'vitest';
import { parse, normalizeInput } from './parser';

describe('normalisation', () => {
  it('ignores case, punctuation, articles and extra spacing', () => {
    const forms = [
      'examine the relief',
      'EXAMINE RELIEF',
      '  examine   a relief.  ',
      'Examine the relief!',
      'x the relief',
      'look at the relief',
      'inspect relief',
      'study the relief',
    ];
    for (const form of forms) {
      expect(parse(form), form).toEqual({ type: 'EXAMINE', target: 'relief' });
    }
  });

  it('strips smart quotes and trailing punctuation', () => {
    expect(normalizeInput('Open the “shutter”?')).toBe('open the shutter');
  });
});

describe('movement', () => {
  it('accepts bare directions and their abbreviations', () => {
    expect(parse('north')).toEqual({ type: 'GO', target: 'north' });
    expect(parse('n')).toEqual({ type: 'GO', target: 'north' });
    expect(parse('w')).toEqual({ type: 'GO', target: 'west' });
    expect(parse('down')).toEqual({ type: 'GO', target: 'down' });
    expect(parse('out')).toEqual({ type: 'GO', target: 'out' });
  });

  it('accepts go/move/walk/head with directions and named exits', () => {
    for (const verb of ['go', 'move', 'walk', 'head', 'travel', 'climb']) {
      expect(parse(`${verb} west`), verb).toEqual({ type: 'GO', target: 'west' });
    }
    expect(parse('go to the workshop')).toEqual({ type: 'GO', target: 'workshop' });
    expect(parse('enter the gallery')).toEqual({ type: 'GO', target: 'gallery' });
  });
});

describe('the crossing', () => {
  it('recognises the explicit crossing action and its synonyms', () => {
    for (const form of [
      'enter threshold',
      'enter the threshold',
      'cross threshold',
      'cross the threshold',
      'step into the threshold',
      'step through the threshold',
      'go into the threshold',
    ]) {
      expect(parse(form), form).toEqual({ type: 'CROSS_THRESHOLD' });
    }
  });
});

describe('items', () => {
  it('parses taking, dropping and the inventory', () => {
    expect(parse('take wedge')).toEqual({ type: 'TAKE', target: 'wedge' });
    expect(parse('get the wedge')).toEqual({ type: 'TAKE', target: 'wedge' });
    expect(parse('pick up the wedge')).toEqual({ type: 'TAKE', target: 'wedge' });
    expect(parse('retrieve lantern')).toEqual({ type: 'TAKE', target: 'lantern' });
    expect(parse('take lantern from alcove')).toEqual({
      type: 'TAKE',
      target: 'lantern',
      from: 'alcove',
    });
    expect(parse('drop wedge')).toEqual({ type: 'DROP', target: 'wedge' });
    expect(parse('put down the wedge')).toEqual({ type: 'DROP', target: 'wedge' });
    for (const form of ['i', 'inv', 'inventory']) {
      expect(parse(form), form).toEqual({ type: 'INVENTORY' });
    }
  });

  it('parses use with a target, and the wedge shorthands', () => {
    const expected = { type: 'USE', item: 'wedge', target: 'shutter' };
    for (const form of [
      'use wedge on shutter',
      'use the wedge on the shutter',
      'use wedge with shutter',
      'use wedge under the shutter',
      'wedge shutter',
      'wedge the shutter',
      'wedge the shutter open',
      'prop the shutter open',
      'wedge the shutter with the wedge',
    ]) {
      expect(parse(form), form).toEqual(expected);
    }
  });

  it('parses placing an item in a target', () => {
    const expected = { type: 'PLACE', item: 'lantern', target: 'alcove' };
    for (const form of [
      'place lantern in alcove',
      'put the lantern in the alcove',
      'set lantern in alcove',
      'stand the lantern in the alcove',
      'put lantern into alcove',
    ]) {
      expect(parse(form), form).toEqual(expected);
    }
  });

  it('parses lighting, with the lantern as the default', () => {
    expect(parse('light lantern')).toEqual({ type: 'LIGHT', target: 'lantern' });
    expect(parse('light the lamp')).toEqual({ type: 'LIGHT', target: 'lamp' });
    expect(parse('light')).toEqual({ type: 'LIGHT', target: 'lantern' });
    expect(parse('kindle lantern')).toEqual({ type: 'LIGHT', target: 'lantern' });
  });
});

describe('people and meta commands', () => {
  it('parses talking', () => {
    for (const form of ['talk to oreg', 'talk oreg', 'speak to oreg', 'speak with oreg', 'ask oreg']) {
      expect(parse(form), form).toEqual({ type: 'TALK', target: 'oreg' });
    }
    expect(parse('ask oreg about the wedge')).toEqual({ type: 'TALK', target: 'oreg' });
  });

  it('parses the meta commands', () => {
    expect(parse('journal')).toEqual({ type: 'JOURNAL' });
    expect(parse('notes')).toEqual({ type: 'JOURNAL' });
    expect(parse('hint')).toEqual({ type: 'HINT' });
    expect(parse('help')).toEqual({ type: 'HELP' });
    expect(parse('exits')).toEqual({ type: 'EXITS' });
    expect(parse('look')).toEqual({ type: 'LOOK' });
    expect(parse('l')).toEqual({ type: 'LOOK' });
  });
});

describe('conversation input', () => {
  const topics = [
    { id: 'wedge', label: 'the wedge', aliases: ['why a wedge'] },
    { id: 'his_attempt', label: 'his own attempt at the rite' },
  ];

  it('accepts a topic number', () => {
    expect(parse('1', { topics })).toEqual({ type: 'TOPIC', topic: 'wedge' });
    expect(parse('2', { topics })).toEqual({ type: 'TOPIC', topic: 'his_attempt' });
  });

  it('accepts a topic label, an alias, and a unique partial', () => {
    expect(parse('the wedge', { topics })).toEqual({ type: 'TOPIC', topic: 'wedge' });
    expect(parse('why a wedge', { topics })).toEqual({ type: 'TOPIC', topic: 'wedge' });
    expect(parse('attempt', { topics })).toEqual({ type: 'TOPIC', topic: 'his_attempt' });
  });

  it('rejects a number with no topic behind it, without advancing anything', () => {
    expect(parse('9', { topics })).toEqual({
      type: 'UNPARSED',
      raw: '9',
      reason: 'bad-topic-number',
    });
  });

  it('leaves on the leave words', () => {
    for (const form of ['leave', 'bye', 'goodbye', 'stop', 'nothing', 'done']) {
      expect(parse(form, { topics }), form).toEqual({ type: 'END_CONVERSATION' });
    }
  });

  it('still allows other commands mid-conversation', () => {
    expect(parse('look', { topics })).toEqual({ type: 'LOOK' });
    expect(parse('journal', { topics })).toEqual({ type: 'JOURNAL' });
    expect(parse('go west', { topics })).toEqual({ type: 'GO', target: 'west' });
  });
});

describe('disambiguation input', () => {
  const clarificationLabels = ['stone shutter', 'alcove'];

  it('accepts a number or a precise name', () => {
    expect(parse('1', { clarificationLabels })).toEqual({ type: 'CHOOSE', value: 'stone shutter' });
    expect(parse('alcove', { clarificationLabels })).toEqual({ type: 'CHOOSE', value: 'alcove' });
    expect(parse('shutter', { clarificationLabels })).toEqual({
      type: 'CHOOSE',
      value: 'stone shutter',
    });
  });

  it('can always be cancelled', () => {
    for (const form of ['cancel', 'nevermind', 'none', 'neither']) {
      expect(parse(form, { clarificationLabels }), form).toEqual({ type: 'CANCEL' });
    }
  });
});

describe('unrecognised input', () => {
  it('reports why, and produces no world action', () => {
    expect(parse('xyzzy')).toEqual({ type: 'UNPARSED', raw: 'xyzzy', reason: 'unknown-verb' });
    expect(parse('')).toEqual({ type: 'UNPARSED', raw: '', reason: 'empty' });
    expect(parse('examine')).toEqual({ type: 'UNPARSED', raw: 'examine', reason: 'no-object' });
    expect(parse('go')).toEqual({ type: 'UNPARSED', raw: 'go', reason: 'no-direction' });
    expect(parse('talk to')).toEqual({ type: 'UNPARSED', raw: 'talk to', reason: 'no-person' });
    expect(parse('please open the secret door for me')).toEqual({
      type: 'UNPARSED',
      raw: 'please open the secret door for me',
      reason: 'unknown-verb',
    });
  });
});
