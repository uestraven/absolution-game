import type { CharacterDef, CharacterId, GameState } from '../engine/types';

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  basil: {
    id: 'basil',
    name: 'Basil',
    blurb: 'A boy of sixteen, as of this morning.',
    pronouns: {
      subject: 'he',
      object: 'him',
      possessive: 'his',
      possessivePronoun: 'his',
      reflexive: 'himself',
      isAre: 'is',
    },
  },
  basilia: {
    id: 'basilia',
    name: 'Basilia',
    blurb: 'A girl of sixteen, as of this morning.',
    pronouns: {
      subject: 'she',
      object: 'her',
      possessive: 'her',
      possessivePronoun: 'hers',
      reflexive: 'herself',
      isAre: 'is',
    },
  },
};

export const CHARACTER_ORDER: CharacterId[] = ['basil', 'basilia'];

export function isCharacterId(value: unknown): value is CharacterId {
  return value === 'basil' || value === 'basilia';
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1);
}

/**
 * Substitutes {name}, {they}, {them}, {their}, {theirs}, {themself} and their
 * capitalized forms. Used by authored NPC lines; narration stays second-person
 * and needs none of these.
 *
 * Unknown placeholders are left verbatim so a typo is visible in testing
 * rather than silently swallowed.
 */
export function renderText(template: string, state: Pick<GameState, 'character'>): string {
  const character = state.character ? CHARACTERS[state.character] : null;
  if (!character) return template;
  const p = character.pronouns;
  const table: Record<string, string> = {
    name: character.name,
    they: p.subject,
    them: p.object,
    their: p.possessive,
    theirs: p.possessivePronoun,
    themself: p.reflexive,
    // Pronouns carries this already, for lines that need agreement.
    is: p.isAre,
  };
  return template.replace(/\{([A-Za-z]+)\}/g, (match, rawKey: string) => {
    const key = rawKey.toLowerCase();
    const value = table[key];
    if (value === undefined) return match;
    return rawKey[0] === rawKey[0]!.toUpperCase() ? capitalize(value) : value;
  });
}
