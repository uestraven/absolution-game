import { useState } from 'react';
import type { Affordance, Affordances } from '../engine/affordances';
import type { GameAction } from '../engine/types';

export interface SelectPanelProps {
  affordances: Affordances;
  onAct: (action: GameAction, label: string) => void;
}

function ActionButton({
  affordance,
  onAct,
  variant,
}: {
  affordance: Affordance;
  onAct: (action: GameAction, label: string) => void;
  variant?: string;
}) {
  return (
    <button
      type="button"
      className={`btn ${variant ?? ''}`}
      onClick={() => onAct(affordance.action, affordance.label)}
    >
      {affordance.label}
    </button>
  );
}

/**
 * Every button here comes from the engine's affordance list, so this component
 * cannot offer an action the typed parser would refuse, and cannot invent a
 * label that gives a puzzle away.
 */
export function SelectPanel({ affordances, onAct }: SelectPanelProps) {
  const [openObject, setOpenObject] = useState<string | null>(null);
  const [itemFlow, setItemFlow] = useState<{ item: string; mode: 'use' | 'place' } | null>(null);

  if (affordances.clarification) {
    return (
      <div className="panel">
        <h3 className="panel-title">{affordances.clarification.question}</h3>
        <div className="btn-row">
          {affordances.clarification.options.map((option) => (
            <ActionButton key={option.key} affordance={option} onAct={onAct} />
          ))}
          <button type="button" className="btn btn-quiet" onClick={() => onAct({ type: 'CANCEL' }, 'Cancel')}>
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
            <ActionButton key={m.key} affordance={m} onAct={onAct} variant="btn-quiet" />
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
          {itemFlow.mode === 'use' ? `Use the ${flowItem.name} on what?` : `Put the ${flowItem.name} in what?`}
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
      <section className="panel-section">
        <h3 className="panel-title">Go</h3>
        <div className="btn-row">
          {affordances.exits.map((exit) => (
            <ActionButton key={exit.key} affordance={exit} onAct={onAct} />
          ))}
        </div>
      </section>

      {affordances.people.length > 0 ? (
        <section className="panel-section">
          <h3 className="panel-title">People</h3>
          <div className="btn-row">
            {affordances.people.map((person) => (
              <ActionButton key={person.key} affordance={person} onAct={onAct} />
            ))}
          </div>
        </section>
      ) : null}

      {affordances.objects.length > 0 ? (
        <section className="panel-section">
          <h3 className="panel-title">Things here</h3>
          <ul className="thing-list">
            {affordances.objects.map((object) => {
              const open = openObject === object.id;
              return (
                <li className="thing" key={object.id}>
                  <button
                    type="button"
                    className="btn btn-thing"
                    aria-expanded={open}
                    onClick={() => setOpenObject(open ? null : object.id)}
                  >
                    <span>{object.name}</span>
                    <span className="chev" aria-hidden="true">
                      {open ? '▾' : '▸'}
                    </span>
                  </button>
                  {open ? (
                    <div className="btn-row thing-actions">
                      {object.actions.map((a) => (
                        <ActionButton key={a.key} affordance={a} onAct={onAct} variant="btn-small" />
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {affordances.items.length > 0 ? (
        <section className="panel-section">
          <h3 className="panel-title">Carrying</h3>
          <ul className="thing-list">
            {affordances.items.map((item) => (
              <li className="thing" key={item.id}>
                <span className="thing-name">{item.name}</span>
                <div className="btn-row thing-actions">
                  {item.actions.map((a) => (
                    <ActionButton key={a.key} affordance={a} onAct={onAct} variant="btn-small" />
                  ))}
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => setItemFlow({ item: item.id, mode: 'use' })}
                  >
                    Use on…
                  </button>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => setItemFlow({ item: item.id, mode: 'place' })}
                  >
                    Put in…
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="panel-meta">
        {affordances.meta.map((m) => (
          <ActionButton key={m.key} affordance={m} onAct={onAct} variant="btn-quiet" />
        ))}
      </div>
    </div>
  );
}
