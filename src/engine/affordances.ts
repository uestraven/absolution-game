import type { GameAction, GameState, ItemId } from './types';
import { ITEMS } from '../content/items';
import { OBJECTS, objectVerbs } from '../content/objects';
import { FLAGS } from '../content/flags';
import { activeTopics, peopleHere, visibleExits, visibleObjects } from './selectors';

/**
 * The selectable-mode action list, computed by the engine rather than the UI.
 *
 * Two rules shape everything here:
 *
 *  - Only discovered, currently-visible things appear. The UI cannot offer an
 *    action the typed parser would refuse.
 *  - Labels are plain verb-and-noun. Nothing is phrased in terms of what it
 *    will achieve, and the item-target lists deliberately include
 *    wrong-but-reasonable targets, so the buttons never give a puzzle away.
 */

export interface Affordance {
  /** Stable key for React and for tests. */
  key: string;
  label: string;
  action: GameAction;
}

export interface ObjectAffordances {
  id: string;
  name: string;
  actions: Affordance[];
}

export interface ItemAffordances {
  id: ItemId;
  name: string;
  /** Verbs that need no target. */
  actions: Affordance[];
  /** "Use this on…" — one entry per plausible visible target. */
  useTargets: Affordance[];
  /** "Put this in…" — one entry per plausible visible target. */
  placeTargets: Affordance[];
}

export interface Affordances {
  exits: Affordance[];
  people: Affordance[];
  objects: ObjectAffordances[];
  items: ItemAffordances[];
  meta: Affordance[];
  /** Present only during a conversation. */
  topics: Affordance[] | null;
  /** Present only while a disambiguation question is open. */
  clarification: { question: string; options: Affordance[] } | null;
}

const VERB_LABELS: Record<string, string> = {
  examine: 'Examine',
  take: 'Take',
  retrieve: 'Take back',
  open: 'Open',
  light: 'Light',
  cross: 'Step into it',
};

function verbAction(objectId: string, verb: string): GameAction | null {
  switch (verb) {
    case 'examine':
      return { type: 'EXAMINE', target: objectId };
    case 'take':
    case 'retrieve':
      return { type: 'TAKE', target: objectId };
    case 'open':
      return { type: 'OPEN', target: objectId };
    case 'light':
      return { type: 'LIGHT', target: objectId };
    case 'cross':
      return { type: 'CROSS_THRESHOLD' };
    default:
      return null;
  }
}

export function getAffordances(state: GameState): Affordances {
  const clarification =
    state.pending?.kind === 'clarification'
      ? {
          question: state.pending.question,
          options: state.pending.options.map((option, i) => ({
            key: `choose-${i}`,
            label: option.label,
            action: { type: 'CHOOSE', value: option.label } as GameAction,
          })),
        }
      : null;

  const topics =
    state.pending?.kind === 'conversation'
      ? activeTopics(state).map((topic, i) => ({
          key: `topic-${topic.id}`,
          label: `${i + 1}. ${topic.label}`,
          action: { type: 'TOPIC', topic: topic.id } as GameAction,
        }))
      : null;

  const exits = visibleExits(state).map((exit) => ({
    key: `exit-${exit.id}`,
    label: exit.direction ? `${exit.label} (${exit.direction})` : exit.label,
    action: { type: 'GO', target: exit.id } as GameAction,
  }));

  const people = peopleHere(state).map((person) => ({
    key: `talk-${person.id}`,
    label: `Talk to ${person.name}`,
    action: { type: 'TALK', target: person.id } as GameAction,
  }));

  const visible = visibleObjects(state);

  const objects: ObjectAffordances[] = visible.map((def) => ({
    id: def.id,
    name: def.name,
    actions: objectVerbs(def, state)
      .map((verb) => {
        const action = verbAction(def.id, verb);
        if (!action) return null;
        return {
          key: `${def.id}-${verb}`,
          label: VERB_LABELS[verb] ?? verb,
          action,
        } satisfies Affordance;
      })
      .filter((a): a is Affordance => a !== null),
  }));

  // Plausible places to try an item: authored, modest, and including decoys.
  const itemTargets = visible.filter((def) => def.acceptsItems);

  const items: ItemAffordances[] = state.inventory.map((itemId) => {
    const def = ITEMS[itemId];
    const actions: Affordance[] = [
      {
        key: `item-${itemId}-examine`,
        label: 'Examine',
        action: { type: 'EXAMINE', target: itemId },
      },
    ];
    if (itemId === 'lantern' && !state.flags[FLAGS.lanternLit]) {
      actions.push({
        key: `item-${itemId}-light`,
        label: 'Light it',
        action: { type: 'LIGHT', target: itemId },
      });
    }
    actions.push({
      key: `item-${itemId}-drop`,
      label: 'Put it down',
      action: { type: 'DROP', target: itemId },
    });

    return {
      id: itemId,
      name: def.name,
      actions,
      useTargets: itemTargets.map((target) => ({
        key: `use-${itemId}-${target.id}`,
        label: target.name,
        action: { type: 'USE', item: itemId, target: target.id } as GameAction,
      })),
      placeTargets: itemTargets.map((target) => ({
        key: `place-${itemId}-${target.id}`,
        label: target.name,
        action: { type: 'PLACE', item: itemId, target: target.id } as GameAction,
      })),
    };
  });

  const meta: Affordance[] = [
    { key: 'meta-look', label: 'Look around', action: { type: 'LOOK' } },
    { key: 'meta-exits', label: 'Ways out', action: { type: 'EXITS' } },
    { key: 'meta-inventory', label: 'Inventory', action: { type: 'INVENTORY' } },
    { key: 'meta-journal', label: 'Journal', action: { type: 'JOURNAL' } },
    { key: 'meta-hint', label: 'Hint', action: { type: 'HINT' } },
    { key: 'meta-help', label: 'Commands', action: { type: 'HELP' } },
  ];

  // Items resting in a fixture can always be recovered.
  for (const [id, placement] of Object.entries(state.placements)) {
    if (placement.kind !== 'fixture') continue;
    if (OBJECTS[placement.fixtureId]?.locationId !== state.locationId) continue;
    const itemId = id as ItemId;
    const host = objects.find((o) => o.id === placement.fixtureId);
    const entries: Affordance[] = [];
    // Things put down inside the cave stay reachable from where they are.
    if (itemId === 'lantern' && !state.flags[FLAGS.lanternLit]) {
      entries.push({
        key: `light-${itemId}-in-place`,
        label: `Light the ${ITEMS[itemId].name}`,
        action: { type: 'LIGHT', target: itemId },
      });
    }
    entries.push({
      key: `retrieve-${itemId}`,
      label: `Take back the ${ITEMS[itemId].name}`,
      action: { type: 'TAKE', target: itemId },
    });
    for (const entry of entries) {
      if (host) host.actions.push(entry);
      else meta.push(entry);
    }
  }

  return { exits, people, objects, items, meta, topics, clarification };
}
