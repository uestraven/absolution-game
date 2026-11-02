import type { CharacterId } from '../engine/types';
import { CHARACTERS, CHARACTER_ORDER } from '../content/characters';
import { SELECT_PROMPT, SUBTITLE, TITLE } from '../content/text';
import type { InputMode } from '../persistence/storage';
// Imported rather than referenced from a public directory, so the build fails
// loudly if it goes missing and the emitted filename is content-hashed.
import titleArt from '../assets/title.png';

/**
 * The wordmark, as the page's heading.
 *
 * The `h1` stays an `h1` and takes its accessible name from the `alt`, so the
 * document outline and a screen reader read "Absolution" exactly as they did
 * when this was text. If the image fails to load, the alt text is what shows.
 */
function Wordmark() {
  return (
    <h1 className="start-title">
      <img className="start-logo" src={titleArt} alt={TITLE} width={530} height={179} />
    </h1>
  );
}

export interface MusicOfferProps {
  /** The player's stored preference. */
  on: boolean;
  /** A browser refused playback and wants another interaction. */
  blocked: boolean;
  /** Turn the preference on or off. Called from a real click. */
  onToggle: (on: boolean) => void;
}

/**
 * The music offer.
 *
 * Deliberately a button and not a dialog: it sits next to New Game and
 * Continue, says plainly what it will do, and the player can walk straight
 * past it. The game is fully playable with it never touched.
 *
 * It is also the gesture. Browsers will not start audio without one, and a
 * stored "yes" from a previous session is not a gesture — so after a reload
 * this reads *Start music* rather than claiming to be on already.
 */
function MusicOffer({ on, blocked, onToggle }: MusicOfferProps) {
  const needsGesture = on && blocked;
  return (
    <div className="start-music">
      <button
        type="button"
        className="btn btn-quiet"
        aria-pressed={on && !blocked}
        onClick={() => onToggle(needsGesture ? true : !on)}
      >
        {on && !blocked ? 'Music on' : needsGesture ? 'Start music' : 'Enable music'}
      </button>
      <p className="start-music-note">
        {needsGesture
          ? 'Music is on, but this browser needs a tap before it will play.'
          : on
            ? 'Eight tracks, quiet by default. Volume is in Settings.'
            : 'Optional. Nothing in the game depends on sound.'}
      </p>
    </div>
  );
}

export interface TitleScreenProps {
  canContinue: boolean;
  notes: string[];
  music: MusicOfferProps;
  onContinue: () => void;
  onNewGame: () => void;
  onImport: () => void;
}

export function TitleScreen({
  canContinue,
  notes,
  music,
  onContinue,
  onNewGame,
  onImport,
}: TitleScreenProps) {
  return (
    <main className="start">
      <Wordmark />
      <p className="start-sub">{SUBTITLE}</p>
      <MusicOffer {...music} />
      <div className="start-actions">
        {canContinue ? (
          <button type="button" className="btn" onClick={onContinue}>
            Continue
          </button>
        ) : null}
        <button
          type="button"
          className="btn"
          onClick={onNewGame}
        >
          New Game
        </button>
        <button type="button" className="btn btn-quiet" onClick={onImport}>
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
      <Wordmark />
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
                className="btn character-btn"
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
