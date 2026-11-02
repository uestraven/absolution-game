import { useEffect, useRef } from 'react';
import type { InputMode, Prefs } from '../persistence/storage';
import { SAVE_HELP_TEXT } from '../content/help';

export interface SettingsDialogProps {
  prefs: Prefs;
  hasCheckpoint: boolean;
  storageMessage: string | null;
  onSetPrefs: (prefs: Prefs) => void;
  onClose: () => void;
  onExport: () => void;
  onImport: () => void;
  onRestartCheckpoint: () => void;
  onNewGame: () => void;
}

export function SettingsDialog({
  prefs,
  hasCheckpoint,
  storageMessage,
  onSetPrefs,
  onClose,
  onExport,
  onImport,
  onRestartCheckpoint,
  onNewGame,
}: SettingsDialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const closer = useRef<HTMLButtonElement>(null);

  /**
   * A real keyboard modal: focus moves in, Tab cycles inside it, Escape
   * closes, and focus goes back to whatever opened it.
   */
  useEffect(() => {
    const invoker = document.activeElement as HTMLElement | null;
    closer.current?.focus();

    const focusable = (): HTMLElement[] => {
      const root = panel.current;
      if (!root) return [];
      return [
        ...root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        ),
      ].filter((el) => el.offsetParent !== null || el === document.activeElement);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (!panel.current?.contains(active)) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      // Put the caret back where the player left it.
      if (invoker && document.contains(invoker)) invoker.focus();
    };
  }, [onClose]);

  function setMode(mode: InputMode) {
    onSetPrefs({ ...prefs, inputMode: mode });
  }

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="dialog"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="dialog-head">
          <h2 id="settings-title">Settings</h2>
          <button ref={closer} type="button" className="btn btn-quiet" onClick={onClose}>
            Close
          </button>
        </div>

        {storageMessage ? (
          <p className="warn" role="alert">
            {storageMessage}
          </p>
        ) : null}

        <fieldset className="dialog-block">
          <legend>Input mode</legend>
          <div className="radio-col">
            <label className="radio">
              <input
                type="radio"
                name="settings-mode"
                checked={prefs.inputMode === 'select'}
                onChange={() => setMode('select')}
              />
              <span>Selectable Actions</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="settings-mode"
                checked={prefs.inputMode === 'type'}
                onChange={() => setMode('type')}
              />
              <span>Type-only</span>
            </label>
          </div>
          <p className="dialog-note">
            Switching keeps your exact position and your transcript. The preference is stored
            separately from your progress.
          </p>
        </fieldset>

        <fieldset className="dialog-block">
          <legend>Reading</legend>
          <label className="check">
            <input
              type="checkbox"
              checked={prefs.largeText}
              onChange={(e) => onSetPrefs({ ...prefs, largeText: e.target.checked })}
            />
            <span>Larger text</span>
          </label>
          <p className="dialog-note">
            Animation already follows your system&rsquo;s reduced-motion setting.
          </p>
        </fieldset>

        <fieldset className="dialog-block">
          <legend>Saves</legend>
          <div className="btn-row">
            <button type="button" className="btn" onClick={onExport}>
              Export Save
            </button>
            <button type="button" className="btn" onClick={onImport}>
              Import Save
            </button>
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="btn"
              onClick={onRestartCheckpoint}
              disabled={!hasCheckpoint}
            >
              Restart from checkpoint
            </button>
            <button type="button" className="btn btn-danger" onClick={onNewGame}>
              New Game
            </button>
          </div>
          <p className="dialog-note dialog-pre">{SAVE_HELP_TEXT}</p>
        </fieldset>
      </div>
    </div>
  );
}
