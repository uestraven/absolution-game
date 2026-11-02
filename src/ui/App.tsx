import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CharacterId, GameAction, GameState } from '../engine/types';
import { SCHEMA_VERSION } from '../engine/types';
import { echoCommand, resolve } from '../engine/reducer';
import { getAffordances, type Affordances } from '../engine/affordances';
import { parse } from '../engine/parser';
import { stripMarkup } from '../content/markup';
import { activeTopics, currentLocation } from '../engine/selectors';
import {
  DEFAULT_PREFS,
  EXPORT_FILENAME,
  clearProgress,
  exportBlob,
  importFromText,
  loadBest,
  readPrefs,
  readSlot,
  storageAvailable,
  storageReadable,
  writeAutosave,
  writeCheckpoint,
  writePrefs,
  type Prefs,
  type StorageStatus,
} from '../persistence/storage';
import { MAX_SAVE_BYTES } from '../persistence/validate';
import { Transcript } from './Transcript';
import { TypeInput } from './TypeInput';
import { SelectPanel } from './SelectPanel';
import { SettingsDialog } from './SettingsDialog';
import { SetupScreen, TitleScreen } from './StartScreens';

type Screen = 'title' | 'setup' | 'play';

/**
 * Meta actions promoted into the header, so they are reachable compactly in
 * both input modes without a persistent menu competing with the narrative.
 */
const HEADER_META = ['meta-inventory', 'meta-journal', 'meta-help'];

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
  /** Bumped once per player action, so the transcript positions on its output. */
  const [actionCount, setActionCount] = useState(0);
  /**
   * Whether entering play is resuming or beginning.
   *
   * A new game opens at the top of its first page; a transcript that came out
   * of storage opens at its end, where the reader left off. The transcript
   * cannot tell these apart from the state — both arrive with a full history
   * and no actions taken — so the shell, which knows which door was used, says.
   */
  const [resumed, setResumed] = useState(false);
  /**
   * Bumped whenever the history is replaced rather than appended to.
   *
   * Importing a save or restarting from a checkpoint swaps the whole
   * transcript for a different one. The transcript cannot reliably tell that
   * from the entries, because ids are `t<seq>` and `seq` restarts every game:
   * an imported history usually contains the same ids as the one it replaced.
   * So the replacement is declared here rather than deduced there.
   */
  const [historyEpoch, setHistoryEpoch] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const loaded = useRef(false);
  /** Mirrors `state` for synchronous reads inside `act`. */
  const stateRef = useRef<GameState | null>(null);
  stateRef.current = state;

  /* --- Boot ------------------------------------------------------- */
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    setPrefs(readPrefs());
    const outcome = loadBest();
    setStartNotes(outcome.notes);
    // Reading works independently of writing, so an existing save stays
    // loadable even on a store that can no longer be written to.
    setCanContinue(outcome.state !== null);
    setHasCheckpoint(readSlot('checkpoint').state !== null);
    if (outcome.state) {
      stateRef.current = outcome.state;
      setState(outcome.state);
    }
    // Say so before the first action is lost, not after.
    if (!storageAvailable()) {
      setStorage({
        working: false,
        message: storageReadable()
          ? 'This browser is not accepting new saves, so progress from here is not being kept. ' +
            'Your existing save still loads, and Export Save still works.'
          : 'This browser is not letting the game store anything, so progress is not being ' +
            'saved. Use Export Save to keep a copy.',
      });
    }
  }, []);

  const updatePrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    writePrefs(next);
  }, []);

  /* --- Persistence ------------------------------------------------ */
  /**
   * Writes a state and reports honestly on both slots.
   *
   * A successful autosave must not hide a failed chapter checkpoint, so the two
   * results are combined rather than the later one winning.
   */
  const persist = useCallback((next: GameState, chapterChanged: boolean) => {
    /*
     * A checkpoint per chapter, except the ending.
     *
     * The ending is a terminal state, and writing it over the checkpoint would
     * destroy the one place a player might actually want to go back to — the
     * moment they came through the wall, with the confrontation still ahead of
     * them. So the last checkpoint this game writes is the start of the last
     * chapter, and that is deliberate.
     */
    const writable = chapterChanged && next.chapter !== 'ending';
    const checkpoint = writable ? writeCheckpoint(next) : null;
    if (checkpoint?.working) setHasCheckpoint(true);

    const autosave = writeAutosave(next);
    if (autosave.working) setCanContinue(true);

    if (!autosave.working) {
      setStorage(autosave);
    } else if (checkpoint && !checkpoint.working) {
      setStorage({
        working: false,
        message:
          'Your position is being saved, but the checkpoint for the start of this chapter ' +
          'could not be written, so Restart from checkpoint may be unavailable or stale. ' +
          (checkpoint.message ?? ''),
      });
    } else {
      setStorage(autosave);
    }
  }, []);

  /* --- Dispatch --------------------------------------------------- */
  /**
   * The only path from an interaction to the engine.
   *
   * `resolve` is pure, so the next state is computed here — once — and the
   * side effects (persisting, announcing) happen after it, outside any
   * updater function. React is free to re-render, and StrictMode is free to
   * double-invoke renders, without that turning into two saves or two
   * transcript entries.
   */
  const act = useCallback(
    (action: GameAction, echo?: string) => {
      const current = stateRef.current;
      if (!current) return;
      const base = echo ? echoCommand(current, echo) : current;
      const result = resolve(base, action);
      // Keep the ref in step immediately, so a second command dispatched
      // before React re-renders still resolves against the newest state.
      stateRef.current = result.state;
      setState(result.state);
      persist(result.state, result.state.chapter !== current.chapter);
      setAnnouncement(result.events.map((e) => stripMarkup(e.text)).join('\n\n'));
      setActionCount((n) => n + 1);
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
  const chooseCharacter = useCallback((character: CharacterId) => {
    const result = resolve(blankSelectState(), { type: 'SELECT_CHARACTER', character });
    stateRef.current = result.state;
    setState(result.state);
    setResumed(false);
    setScreen('play');
    setAnnouncement(result.events.map((e) => stripMarkup(e.text)).join('\n\n'));
    const checkpoint = writeCheckpoint(result.state);
    if (checkpoint.working) setHasCheckpoint(true);
    const saved = writeAutosave(result.state);
    setStorage(saved);
    if (saved.working) setCanContinue(true);
  }, []);

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
    stateRef.current = null;
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
      'Restart from the saved checkpoint? Anything you have done since will be lost.'
    );
    if (!ok) return;
    stateRef.current = checkpoint;
    setState(checkpoint);
    // Not new output: a different history, in place of this one.
    setHistoryEpoch((n) => n + 1);
    setActionCount((n) => n + 1);
    setResumed(true);
    setScreen('play');
    setSettingsOpen(false);
    setNotice('Restarted from the saved checkpoint.');
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
      // Check the declared size before reading any of it, using the same byte
      // limit the validator applies to the parsed text.
      if (file.size > MAX_SAVE_BYTES) {
        setNotice(
          `Import refused. That file is ${Math.round(file.size / 1024)} KB; a save for this ` +
            `story cannot be larger than ${MAX_SAVE_BYTES / 1024} KB.`
        );
        return;
      }
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
      stateRef.current = result.state;
      setState(result.state);
      setHistoryEpoch((n) => n + 1);
      setActionCount((n) => n + 1);
      setResumed(true);
      setScreen('play');
      setSettingsOpen(false);
      setStorage(writeAutosave(result.state));
      /*
       * The imported position becomes the checkpoint, because it is the only
       * state the file contains: an export is one moment, not a history, so
       * there is no chapter-start to recover. That replaces whatever checkpoint
       * this browser had, which is a real consequence and is said out loud
       * rather than discovered later by somebody pressing Restart.
       */
      const checkpoint = writeCheckpoint(result.state);
      if (checkpoint.working) setHasCheckpoint(true);
      setCanContinue(true);
      setNotice(
        'Save imported. Restart from checkpoint will now bring you back to this point, ' +
          'not to the start of the chapter.'
      );
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
          onContinue={() => {
            setResumed(true);
            setScreen('play');
          }}
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
  const headerMeta = affordances.meta.filter((m) => HEADER_META.includes(m.key));
  const panelMeta = affordances.meta.filter((m) => !HEADER_META.includes(m.key));
  const placeHint =
    state.pending?.kind === 'clarification'
      ? 'a number, a name, or cancel'
      : state.pending?.kind === 'conversation'
        ? 'a topic, its number, or leave'
        : 'look, examine relief, go west...';

  return (
    <div className={`app ${prefs.largeText ? 'large-text' : ''}`}>
      <a className="skip-link" href="#main-controls">
        Skip to actions
      </a>

      <header className="topbar">
        <button
          type="button"
          className="btn btn-plain topbar-toggle"
          aria-expanded={prefs.showStatus}
          onClick={() => updatePrefs({ ...prefs, showStatus: !prefs.showStatus })}
        >
          <span className="chev" aria-hidden="true">
            {prefs.showStatus ? '\u25be' : '\u25b8'}
          </span>
          <span className="topbar-place">{location.name}</span>
          <span className="sr-only">
            {prefs.showStatus ? ' — hide details' : ' — show subtitle and objective'}
          </span>
        </button>
        <nav className="topbar-meta" aria-label="Game information">
          {headerMeta.map((m) => (
            <button
              key={m.key}
              type="button"
              className="btn btn-plain"
              onClick={() => act(m.action, m.label)}
            >
              {m.label}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-plain"
            onClick={() => setSettingsOpen(true)}
            aria-haspopup="dialog"
          >
            Settings
          </button>
        </nav>
      </header>

      {prefs.showStatus ? (
        <div className="status">
          <p className="status-sub">{location.subtitle(state)}</p>
          <p
            className={`objective ${state.ended ? 'objective-done' : ''}`}
            aria-label="Current objective"
          >
            <span className="objective-tag">objective:</span>{' '}
            <span className="objective-text">{state.objective}</span>
          </p>
        </div>
      ) : null}

      {!storage.working && storage.message ? (
        <p className="warn" role="alert">
          {storage.message}
        </p>
      ) : null}

      <main className="main">
        <Transcript
          entries={state.transcript}
          showOptionLists={prefs.inputMode === 'type'}
          actionCount={actionCount}
          historyEpoch={historyEpoch}
          seq={state.seq}
          resumed={resumed}
        />
      </main>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/*
        * The command line does not move. It used to bounce 3px when a heavy
        * block landed, on the idea that the text was pushing it down — which
        * was true while every action scrolled to the bottom. Now that a
        * response is opened at its top, the text arrives nowhere near the
        * input, and a widget twitching for no visible reason competes with the
        * one piece of motion that means something.
        */}
      <section
        className={['controls', prefs.inputMode === 'type' ? 'controls-type' : '']
          .filter(Boolean)
          .join(' ')}
        id="main-controls"
        aria-label="Actions"
      >
        {state.chapter === 'ending' ? (
          <EndingPanel
            onReview={() => act({ type: 'REVIEW' }, 'read the ending again')}
            onExport={doExport}
            onNewGame={startNewGame}
            onRestartCheckpoint={hasCheckpoint ? restartCheckpoint : null}
          />
        ) : prefs.inputMode === 'type' ? (
          <TypeInput label="What do you do?" placeholder={placeHint} onSubmit={submitTyped} />
        ) : (
          <SelectPanel
            affordances={{ ...affordances, meta: panelMeta } satisfies Affordances}
            onAct={(action, label) => act(action, label)}
          />
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

/**
 * What a finished save offers.
 *
 * Not a command line, because there is nobody left to give commands to, and
 * not a "coming soon" banner, because nothing is coming: this is the ending.
 * Reading it again is explicitly reading — it appends the text and touches no
 * state — and the checkpoint goes back to the start of the last chapter rather
 * than to a fresh game.
 */
function EndingPanel({
  onReview,
  onExport,
  onNewGame,
  onRestartCheckpoint,
}: {
  onReview: () => void;
  onExport: () => void;
  onNewGame: () => void;
  onRestartCheckpoint: (() => void) | null;
}) {
  return (
    <div className="panel" aria-label="The end">
      <h3 className="panel-title">The end</h3>
      <div className="chip-row">
        <button type="button" className="btn" onClick={onReview}>
          Read the ending again
        </button>
        <button type="button" className="btn" onClick={onExport}>
          Export Save
        </button>
        {onRestartCheckpoint ? (
          <button type="button" className="btn" onClick={onRestartCheckpoint}>
            Back to the saved checkpoint
          </button>
        ) : null}
        <button type="button" className="btn btn-quiet" onClick={onNewGame}>
          New Game
        </button>
      </div>
      <p className="panel-note">
        Reading the ending again prints the text. It does not undo anything.
      </p>
    </div>
  );
}

function blankSelectState(): GameState {
  // SELECT_CHARACTER builds a fresh state itself; this is only the shell it
  // needs to be dispatched against.
  return {
    schemaVersion: SCHEMA_VERSION,
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
      <button type="button" className="btn btn-plain" onClick={onDismiss}>
        dismiss
      </button>
    </div>
  );
}
