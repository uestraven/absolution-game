import { describe, expect, it } from 'vitest';
import { CHARACTERS, renderText } from './characters';
import { begin, lastText, type, typeAll } from '../testing/harness';
import { PEOPLE } from './dialogue';
import { OBJECTS } from './objects';
import { LOCATIONS } from './locations';
import { stripMarkup } from './markup';

describe('both characters', () => {
  it('are named correctly in the interface and the prose', () => {
    expect(begin('basil').character).toBe('basil');
    expect(begin('basilia').character).toBe('basilia');
    expect(CHARACTERS.basil.name).toBe('Basil');
    expect(CHARACTERS.basilia.name).toBe('Basilia');
  });

  it('take the right pronouns in authored lines', () => {
    const template = '{Name} is here. {They} knows {their} way. Ask {them} {themself}.';
    expect(renderText(template, { character: 'basil' })).toBe(
      'Basil is here. He knows his way. Ask him himself.'
    );
    expect(renderText(template, { character: 'basilia' })).toBe(
      'Basilia is here. She knows her way. Ask her herself.'
    );
  });

  it('leaves unknown placeholders alone rather than guessing', () => {
    expect(renderText('{nope} {Name}', { character: 'basil' })).toBe('{nope} Basil');
  });

  it('substitutes pronouns in the NPC greetings that use them', () => {
    const boyPath = ['take lantern', 'down', 'examine plank', 'talk to parsie'];
    const boy = type(typeAll(begin('basil'), boyPath.slice(0, -1)), 'talk to parsie');
    const girl = type(typeAll(begin('basilia'), boyPath.slice(0, -1)), 'talk to parsie');
    expect(lastText(boy)).toContain('he read the plank');
    expect(lastText(girl)).toContain('she read the plank');
    // No unrendered pronoun placeholder. Semantic annotations legitimately
    // use doubled braces, so check for the single-brace template form.
    expect(lastText(boy)).not.toMatch(/\{[A-Za-z]+\}/);
    expect(lastText(girl)).not.toMatch(/\{[A-Za-z]+\}/);
  });

  it('plays the same chapter either way', () => {
    const run = (character: 'basil' | 'basilia') =>
      typeAll(begin(character), [
        'take lantern',
        'down',
        'east',
        'take wedge',
        'west',
        'west',
        'west',
        'in',
        'east',
        'use wedge on shutter',
        'place lantern in alcove',
        'light lantern',
        'open seam',
        'take lantern',
        'down',
        'enter threshold',
        'up',
        'east',
        'east',
        'talk to saffra',
        'cave',
        'wanderer',
        'why you asked',
        'recite prophecy',
        'talk to fenn',
        'how a boy gets past the foreman',
        'leave',
        'west',
        'west',
        'down',
        'north',
        'examine drawing',
        'examine slate',
        'examine dishes',
        'place lantern in high dish',
        'enter aperture',
      ]);
    const boy = run('basil');
    const girl = run('basilia');
    expect(boy.ended).toBe(true);
    expect(girl.ended).toBe(true);
    expect(boy.flags).toEqual(girl.flags);
    expect(boy.discovered).toEqual(girl.discovered);
    expect(boy.journal.map((e) => e.id)).toEqual(girl.journal.map((e) => e.id));
  });
});

describe('no unrendered placeholders anywhere', () => {
  const states = [begin('basil'), begin('basilia')];

  it('in object descriptions', () => {
    for (const state of states) {
      for (const def of Object.values(OBJECTS)) {
        const text = renderText(def.description(state), state);
        expect(text, def.id).not.toMatch(/\{[A-Za-z]+\}/);
      }
    }
  });

  it('in location descriptions and subtitles', () => {
    for (const state of states) {
      for (const def of Object.values(LOCATIONS)) {
        expect(stripMarkup(renderText(def.description(state), state)), def.id).not.toMatch(/\{[A-Za-z]+\}/);
        expect(stripMarkup(renderText(def.subtitle(state), state)), def.id).not.toMatch(/\{[A-Za-z]+\}/);
      }
    }
  });

  it('in greetings, appearances and every topic response', () => {
    for (const state of states) {
      for (const person of Object.values(PEOPLE)) {
        expect(stripMarkup(renderText(person.greeting(state), state)), person.id).not.toMatch(
          /\{[A-Za-z]+\}/
        );
        expect(stripMarkup(renderText(person.appearance(state), state)), person.id).not.toMatch(
          /\{[A-Za-z]+\}/
        );
        for (const topic of person.topics) {
          expect(renderText(topic.response(state), state), `${person.id}/${topic.id}`).not.toMatch(
            /\{[A-Za-z]+\}/
          );
        }
      }
    }
  });
});
