import { useState } from 'react';
import type { Affordance, Affordances } from '../engine/affordances';
import type { GameAction } from '../engine/types';

type Category = 'go' | 'people' | 'things';

const CATEGORIES: Category[] = ['go', 'people', 'things'];

const CATEGORY_LABEL: Record<Category, string> = {
  go: 'Go',
  people: 'People',
  things: 'Things',
};

function countFor(category: Category, affordances: Affordances): number {
  if (category === 'go') return affordances.exits.length;
  if (category === 'people') return affordances.people.length;
  return affordances.objects.length + affordances.items.length;
}

export interface SelectPanelProps {
  affordances: Affordances;
  onAct: (action: GameAction, label: string) => void;
}

function ActionButton({
  affordance,
  onAct,
  variant,
  compact,
}: {
  affordance: Affordance;
  onAct: (action: GameAction, label: string) => void;
  variant?: string;
  compact?: boolean;
}) {
  /*
   * Chips drop a leading article and the parenthesised compass direction: a
   * reader who is clicking does not need "(north)", and on a 360px screen
   * three exits with it wrap to three rows instead of two. The full label
   * stays the accessible name and the transcript echo, so screen readers,
   * typed play and the history all still see the direction.
   */
  const shown = compact
    ? affordance.label.replace(/^the\s+/i, '').replace(/\s*\([^)]*\)\s*$/, '')
    : affordance.label;
  return (
    <button
      type="button"
      className={`btn ${variant ?? ''}`}
      {...(shown === affordance.label ? {} : { 'aria-label': affordance.label })}
      onClick={() => onAct(affordance.action, affordance.label)}
    >
      {shown}
    </button>
  );
}

/**
 * Every button here comes from the engine's affordance list, so this component
 * cannot offer an action the typed parser would refuse, and cannot invent a
 * label that gives a puzzle away.
 *
 * Styling is plain text and simple outlines: cyan marks an available
 * interaction, and focus adds an underline as well as a border, so the state
 * is never carried by colour alone.
 */
export function SelectPanel({ affordances, onAct }: SelectPanelProps) {
  /** Which chip is expanded, prefixed `o:` for an object and `i:` for an item. */
  const [openThing, setOpenThing] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<Category | null>('go');
  const [itemFlow, setItemFlow] = useState<{ item: string; mode: 'use' | 'place' } | null>(null);

  const openObjectEntry = affordances.objects.find((o) => `o:${o.id}` === openThing);
  const openItemEntry = affordances.items.find((i) => `i:${i.id}` === openThing);

  if (affordances.clarification) {
    return (
      <div className="panel">
        <h3 className="panel-title">{affordances.clarification.question}</h3>
        <div className="btn-col">
          {affordances.clarification.options.map((option) => (
            <ActionButton key={option.key} affordance={option} onAct={onAct} />
          ))}
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => onAct({ type: 'CANCEL' }, 'Cancel')}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (affordances.topics) {
    return (
      <div className="panel">
        <h3 className="panel-title">You could ask about</h3>
        <div className="btn-col">
          {affordances.topics.length === 0 ? (
            <p className="panel-note">Nothing else comes to mind.</p>
          ) : (
            affordances.topics.map((topic) => (
              <ActionButton key={topic.key} affordance={topic} onAct={onAct} />
            ))
          )}
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => onAct({ type: 'END_CONVERSATION' }, 'Leave the conversation')}
          >
            Leave the conversation
          </button>
        </div>
        <div className="panel-meta">
          {affordances.meta.map((m) => (
            <ActionButton key={m.key} affordance={m} onAct={onAct} variant="btn-plain" />
          ))}
        </div>
      </div>
    );
  }

  const flowItem = itemFlow ? affordances.items.find((i) => i.id === itemFlow.item) : undefined;
  if (itemFlow && flowItem) {
    const targets = itemFlow.mode === 'use' ? flowItem.useTargets : flowItem.placeTargets;
    return (
      <div className="panel">
        <h3 className="panel-title">
          {itemFlow.mode === 'use'
            ? `Use the ${flowItem.name} on what?`
            : `Put the ${flowItem.name} in what?`}
        </h3>
        <div className="btn-col">
          {targets.length === 0 ? (
            <p className="panel-note">Nothing here that would take it.</p>
          ) : (
            targets.map((target) => (
              <button
                key={target.key}
                type="button"
                className="btn"
                onClick={() => {
                  setItemFlow(null);
                  onAct(
                    target.action,
                    itemFlow.mode === 'use'
                      ? `Use the ${flowItem.name} on the ${target.label}`
                      : `Put the ${flowItem.name} in the ${target.label}`
                  );
                }}
              >
                {target.label}
              </button>
            ))
          )}
          <button type="button" className="btn btn-quiet" onClick={() => setItemFlow(null)}>
            Never mind
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      {/*
        One row of categories, one open at a time. Showing Go, People and
        Things all at once takes eleven buttons, which on a narrow screen is
        half the window — and the story needs that half more than the buttons
        do. Go is open by default, because moving is the commonest action.
      */}
      <div className="chip-row category-row">
        {CATEGORIES.map((category) => {
          const count = countFor(category, affordances);
          if (count === 0) return null;
          const open = openCategory === category;
          return (
            <button
              key={category}
              type="button"
              className="btn btn-chip btn-category"
              aria-expanded={open}
              onClick={() => {
                setOpenThing(null);
                setOpenCategory(open ? null : category);
              }}
            >
              {CATEGORY_LABEL[category]} <span className="chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      {openCategory === 'go' ? (
        <div className="chip-row category-open">
          {affordances.exits.map((exit) => (
            <ActionButton
              key={exit.key}
              affordance={exit}
              onAct={onAct}
              variant="btn-chip"
              compact
            />
          ))}
        </div>
      ) : null}

      {openCategory === 'people' ? (
        <div className="chip-row category-open">
          {affordances.people.map((person) => (
            <ActionButton key={person.key} affordance={person} onAct={onAct} variant="btn-chip" />
          ))}
        </div>
      ) : null}

      {openCategory === 'things' ? (
        <>
          <div className="chip-row category-open">
            {affordances.objects.map((object) => (
              <button
                key={object.id}
                type="button"
                className="btn btn-chip"
                aria-expanded={openThing === `o:${object.id}`}
                onClick={() =>
                  setOpenThing(openThing === `o:${object.id}` ? null : `o:${object.id}`)
                }
              >
                {object.name}
              </button>
            ))}
            {affordances.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="btn btn-chip"
                aria-expanded={openThing === `i:${item.id}`}
                onClick={() => setOpenThing(openThing === `i:${item.id}` ? null : `i:${item.id}`)}
              >
                {item.name} <span className="chip-held">(held)</span>
              </button>
            ))}
          </div>
          {openObjectEntry ? (
            <div className="chip-actions">
              {openObjectEntry.actions.map((a) => (
                <ActionButton key={a.key} affordance={a} onAct={onAct} />
              ))}
            </div>
          ) : null}
          {openItemEntry ? (
            <div className="chip-actions">
              {openItemEntry.actions.map((a) => (
                <ActionButton key={a.key} affordance={a} onAct={onAct} />
              ))}
              <button
                type="button"
                className="btn"
                onClick={() => setItemFlow({ item: openItemEntry.id, mode: 'use' })}
              >
                Use on...
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setItemFlow({ item: openItemEntry.id, mode: 'place' })}
              >
                Put in...
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="panel-meta">
        {affordances.meta.map((m) => (
          <ActionButton key={m.key} affordance={m} onAct={onAct} variant="btn-plain" />
        ))}
      </div>
    </div>
  );
}
