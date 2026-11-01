import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CharacterId, GameAction, GameState } from '../engine/types';
import { echoCommand, resolve } from '../engine/reducer';
import { getAffordances } from '../engine/affordances';
import { parse } from '../engine/parser';
import { activeTopics, currentLocation } from '../engine/selectors';
import { CHARACTERS } from '../content/characters';
import { LOCATIONS } from '../content/locations';
import {
  DEFAULT_PREFS,
  EXPORT_FILENAME,
  clearProgress,
  exportBlob,
  importFromText,
  loadBest,
  readPrefs,
  readSlot,
  writeAutosave,
  writeCheckpoint,
  writePrefs,
  type Prefs,
  type StorageStatus,
} from '../persistence/storage';
import { Transcript } from './Transcript';
import { TypeInput } from './TypeInput';
import { SelectPanel } from './SelectPanel';
import { SettingsDialog } from './SettingsDialog';
import { SetupScreen, TitleScreen } from './StartScreens';

type Screen = 'title' | 'setup' | 'play';

export function App() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [state, setState] = useState<GameState | null>(null);
  const [screen, setScreen] = useState<Screen>('title');
  const [canContinue, setCanContinue] = useState(false);
  const [hasCheckpoint, setHasCheckpoint] = useState(false);
  const [startNotes, setStartNotes] = useState<string[]>([]);
  const [storage, setStorage] = useState<StorageStatus>({ working: true, message: null });
  const [notice, setNotice] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const loaded = useRef(false);

  /* --- Boot ------------------------------------------------------- */
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    setPrefs(readPrefs());
    const outcome = loadBest();
    setStartNotes(outcome.notes);
    setCanContinue(outcome.state !== null);
    setHasCheckpoint(readSlot('checkpoint').state !== null);
    if (outcome.state) setState(outcome.state);
  }, []);

  const updatePrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    writePrefs(next);
  }, []);

  /* --- Persistence ------------------------------------------------ */
  const persist = useCallback((next: GameState, chapterChanged: boolean) => {
    if (chapterChanged) {
      const result = writeCheckpoint(next);
      if (result.working) setHasCheckpoint(true);
    }
    const result = writeAutosave(next);
    setStorage(result);
    if (result.working) setCanContinue(true);
  }, []);

  /* --- Dispatch --------------------------------------------------- */
  const act = useCallback(
    (action: GameAction, echo?: string) => {
      setState((current) => {
        if (!current) return current;
        const base = echo ? echoCommand(current, echo) : current;
        const result = resolve(base, action);
        const chapterChanged = result.state.chapter !== current.chapter;
        persist(result.state, chapterChanged);
        setAnnouncement(result.events.map((e) => e.text).join('\n\n'));
        return result.state;
      });
    },
    [persist]
  );

  const topics = useMemo(() => (state ? activeTopics(state) : []), [state]);

  const submitTyped = useCallback(
    (raw: string) => {
      if (!state) return;
      const action = parse(raw, {
        topics: state.pending?.kind === 'conversation' ? topics : undefined,
        clarificationLabels:
          state.pending?.kind === 'clarification'
            ? state.pending.options.map((o) => o.label)
            : undefined,
      });
      act(action, raw.trim());
    },
    [act, state, topics]
  );

  /* --- Starting and restarting ------------------------------------ */
  const chooseCharacter = useCallback(
    (character: CharacterId) => {
      const result = resolve({ ...blankSelectState(), character: null }, {
        type: 'SELECT_CHARACTER',
        character,
      });
      setState(result.state);
      setScreen('play');
      setAnnouncement(result.events.map((e) => e.text).join('\n\n'));
      const checkpoint = writeCheckpoint(result.state);
      if (checkpoint.working) setHasCheckpoint(true);
      const saved = writeAutosave(result.state);
      setStorage(saved);
      if (saved.working) setCanContinue(true);
    },
    []
  );

  const startNewGame = useCallback(() => {
    if (canContinue) {
      const ok = window.confirm(
        'Starting a new game will overwrite your saved progress in this browser. ' +
          'Export your save first if you want to keep it.\n\nStart a new game?'
      );
      if (!ok) return;
    }
    clearProgress();
    setCanContinue(false);
    setHasCheckpoint(false);
    setState(null);
    setStartNotes([]);
    setSettingsOpen(false);
    setScreen('setup');
  }, [canContinue]);

  const restartCheckpoint = useCallback(() => {
    const { state: checkpoint, error } = readSlot('checkpoint');
    if (!checkpoint) {
      setNotice(error ?? 'There is no checkpoint stored for this chapter.');
      return;
    }
    const ok = window.confirm(
      'Restart from the start of the chapter? Anything you have done since will be lost.'
    );
    if (!ok) return;
    setState(checkpoint);
    setScreen('play');
    setSettingsOpen(false);
    setNotice('Restarted from the chapter checkpoint.');
    setStorage(writeAutosave(checkpoint));
  }, []);

  /* --- Export / import -------------------------------------------- */
  const doExport = useCallback(() => {
    if (!state) return;
    const url = URL.createObjectURL(exportBlob(state));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = EXPORT_FILENAME;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`Save exported as ${EXPORT_FILENAME}.`);
  }, [state]);

  const doImport = useCallback(() => fileInput.current?.click(), []);

  const onFileChosen = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      let text: string;
      try {
        text = await file.text();
      } catch {
        setNotice('That file could not be read.');
        return;
      }
      const result = importFromText(text);
      if (!result.ok) {
        // Nothing has been touched: the current game is exactly as it was.
        setNotice(`Import refused. ${result.error}`);
        return;
      }
      if (state || canContinue) {
        const ok = window.confirm(
          'Importing will replace the progress saved in this browser.\n\nImport anyway?'
        );
        if (!ok) return;
      }
      setState(result.state);
      setScreen('play');
      setSettingsOpen(false);
      setStorage(writeAutosave(result.state));
      const checkpoint = writeCheckpoint(result.state);
      if (checkpoint.working) setHasCheckpoint(true);
      setCanContinue(true);
      setNotice('Save imported.');
    },
    [state, canContinue]
  );

  /* --- Screens ---------------------------------------------------- */
  if (screen === 'title') {
    return (
      <>
        <TitleScreen
          canContinue={canContinue && state !== null}
          notes={startNotes}
          onContinue={() => setScreen('play')}
          onNewGame={startNewGame}
          onImport={doImport}
        />
        <FilePicker inputRef={fileInput} onFile={onFileChosen} />
        {notice ? <Toast message={notice} onDismiss={() => setNotice(null)} /> : null}
      </>
    );
  }

  if (screen === 'setup' || !state || state.chapter === 'select') {
    return (
      <>
        <SetupScreen
          inputMode={prefs.inputMode}
          onSetMode={(mode) => updatePrefs({ ...prefs, inputMode: mode })}
          onChoose={chooseCharacter}
          onBack={() => setScreen('title')}
        />
        <FilePicker inputRef={fileInput} onFile={onFileChosen} />
        {notice ? <Toast message={notice} onDismiss={() => setNotice(null)} /> : null}
      </>
    );
  }

  const location = currentLocation(state);
  const affordances = getAffordances(state);
  const character = state.character ? CHARACTERS[state.character] : null;
  const placeHint =
    state.pending?.kind === 'clarification'
      ? 'A number, a name, or CANCEL'
      : state.pending?.kind === 'conversation'
        ? 'A topic, its number, or LEAVE'
        : 'look, examine relief, go west…';

  return (
    <div
      className={`app ${prefs.largeText ? 'large-text' : ''}`}
      data-tone={LOCATIONS[state.locationId].tone}
    >
      <a className="skip-link" href="#main-controls">
        Skip to actions
      </a>

      <header className="topbar">
        <div className="topbar-where">
          <p className="topbar-place">{location.name}</p>
          <p className="topbar-sub">{location.subtitle(state)}</p>
        </div>
        <div className="topbar-right">
          <p className="topbar-who">
            {character ? character.name : ''}
            {state.inventory.length > 0 ? ` · carrying ${state.inventory.length}` : ''}
          </p>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => setSettingsOpen(true)}
            aria-haspopup="dialog"
          >
            Settings
          </button>
        </div>
      </header>

      <p className="objective" aria-label="Current objective">
        <span className="objective-tag">Objective</span> {state.objective}
      </p>

      {!storage.working && storage.message ? (
        <p className="warn" role="alert">
          {storage.message}
        </p>
      ) : null}

      <main className="main">
        <Transcript
          entries={state.transcript}
          showOptionLists={prefs.inputMode === 'type'}
        />
      </main>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <section className="controls" id="main-controls" aria-label="Actions">
        {prefs.inputMode === 'type' ? (
          <TypeInput
            label="What do you do?"
            placeholder={placeHint}
            onSubmit={submitTyped}
          />
        ) : (
          <SelectPanel affordances={affordances} onAct={(action, label) => act(action, label)} />
        )}
      </section>

      {settingsOpen ? (
        <SettingsDialog
          prefs={prefs}
          hasCheckpoint={hasCheckpoint}
          storageMessage={storage.working ? null : storage.message}
          onSetPrefs={updatePrefs}
          onClose={() => setSettingsOpen(false)}
          onExport={doExport}
          onImport={doImport}
          onRestartCheckpoint={restartCheckpoint}
          onNewGame={startNewGame}
        />
      ) : null}

      <FilePicker inputRef={fileInput} onFile={onFileChosen} />
      {notice ? <Toast message={notice} onDismiss={() => setNotice(null)} /> : null}
    </div>
  );
}

function blankSelectState(): GameState {
  // SELECT_CHARACTER builds a fresh state itself; this is only the shell it
  // needs to be dispatched against.
  return {
    schemaVersion: 1,
    contentVersion: '0.0.0',
    character: null,
    chapter: 'select',
    era: 'present',
    locationId: 'present.home',
    inventory: [],
    placements: {},
    discovered: [],
    flags: {},
    journal: [],
    transcript: [],
    visited: [],
    objective: '',
    pending: null,
    turn: 0,
    ended: false,
    seq: 0,
  };
}

function FilePicker({
  inputRef,
  onFile,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <input
      ref={inputRef}
      className="sr-only"
      type="file"
      accept="application/json,.json"
      aria-label="Choose a save file to import"
      onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        onFile(file);
      }}
    />
  );
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 9000);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);
  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button type="button" className="btn btn-small btn-quiet" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
