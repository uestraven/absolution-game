import type { CharacterId } from '../engine/types';
import { CHARACTERS, CHARACTER_ORDER } from '../content/characters';
import { SELECT_PROMPT, SUBTITLE, TITLE } from '../content/text';
import type { InputMode } from '../persistence/storage';

export interface TitleScreenProps {
  canContinue: boolean;
  notes: string[];
  onContinue: () => void;
  onNewGame: () => void;
  onImport: () => void;
}

export function TitleScreen({
  canContinue,
  notes,
  onContinue,
  onNewGame,
  onImport,
}: TitleScreenProps) {
  return (
    <main className="start">
      <h1 className="start-title">{TITLE}</h1>
      <p className="start-sub">{SUBTITLE}</p>
      <div className="start-actions">
        {canContinue ? (
          <button type="button" className="btn btn-primary btn-big" onClick={onContinue}>
            Continue
          </button>
        ) : null}
        <button
          type="button"
          className={`btn btn-big ${canContinue ? '' : 'btn-primary'}`}
          onClick={onNewGame}
        >
          New Game
        </button>
        <button type="button" className="btn btn-big btn-quiet" onClick={onImport}>
          Import Save
        </button>
      </div>
      {notes.length > 0 ? (
        <div className="start-notes" role="status">
          {notes.map((note, i) => (
            <p key={i}>{note}</p>
          ))}
        </div>
      ) : null}
      <p className="start-foot">
        Saves live in this browser, at this address only. They do not follow you to another
        device.
      </p>
    </main>
  );
}

export interface SetupScreenProps {
  inputMode: InputMode;
  onSetMode: (mode: InputMode) => void;
  onChoose: (character: CharacterId) => void;
  onBack: () => void;
}

export function SetupScreen({ inputMode, onSetMode, onChoose, onBack }: SetupScreenProps) {
  return (
    <main className="start">
      <h1 className="start-title">{TITLE}</h1>
      <div className="setup-block">
        <h2 className="setup-head">{SELECT_PROMPT.split('\n\n')[0]}</h2>
        <p className="setup-prompt">Who are you?</p>
        <div className="start-actions">
          {CHARACTER_ORDER.map((id) => {
            const character = CHARACTERS[id];
            return (
              <button
                key={id}
                type="button"
                className="btn btn-big btn-primary character-btn"
                aria-label={`Play as ${character.name}`}
                onClick={() => onChoose(id)}
              >
                <span className="character-name">{character.name}</span>
                <span className="character-blurb">{character.blurb}</span>
              </button>
            );
          })}
        </div>
        <p className="setup-note">
          Both have the same opportunities, the same puzzles and the same story.
        </p>
      </div>

      <fieldset className="setup-block">
        <legend className="setup-head">How would you like to play?</legend>
        <div className="radio-col">
          <label className="radio">
            <input
              type="radio"
              name="input-mode"
              checked={inputMode === 'select'}
              onChange={() => onSetMode('select')}
            />
            <span>
              <strong>Selectable Actions</strong> — choose from buttons. No typing needed.
            </span>
          </label>
          <label className="radio">
            <input
              type="radio"
              name="input-mode"
              checked={inputMode === 'type'}
              onChange={() => onSetMode('type')}
            />
            <span>
              <strong>Type-only</strong> — type commands, as in a classic text adventure.
            </span>
          </label>
        </div>
        <p className="setup-note">
          You can switch at any time in Settings without losing your place.
        </p>
      </fieldset>

      <button type="button" className="btn btn-quiet" onClick={onBack}>
        Back
      </button>
    </main>
  );
}
