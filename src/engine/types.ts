/**
 * Core data types for the Cave of Absolution engine.
 *
 * Everything in GameState must be JSON-serializable: the whole state is
 * round-tripped through localStorage and through export/import files.
 * No functions, no class instances, no Maps, no Dates.
 */

export const SCHEMA_VERSION = 1;
export const CONTENT_VERSION = '0.1.0';

/* ------------------------------------------------------------------ *
 * Identity
 * ------------------------------------------------------------------ */

export type CharacterId = 'basil' | 'basilia';

export interface Pronouns {
  /** he / she */
  subject: string;
  /** him / her */
  object: string;
  /** his / her */
  possessive: string;
  /** his / hers */
  possessivePronoun: string;
  /** himself / herself */
  reflexive: string;
  /** is / is — kept for template symmetry with plural pronoun sets */
  isAre: string;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  /** Short player-facing blurb on the selection screen. */
  blurb: string;
  pronouns: Pronouns;
}

/* ------------------------------------------------------------------ *
 * World addressing
 *
 * Location ids are era-qualified strings. The era prefix is part of the id
 * so that `present.square` and `past.square` can never collide, and so that
 * a save's locationId alone is enough to validate era consistency.
 * ------------------------------------------------------------------ */

/**
 * Internal era identifiers. These match the location-id prefix so a save's
 * `era` and `locationId` can be cross-validated. They are never rendered to
 * the player: all player-facing era flavour comes from authored subtitles.
 */
export type Era = 'present' | 'past';

export type LocationId =
  | 'present.home'
  | 'present.square'
  | 'present.workshop'
  | 'present.cave_path'
  | 'present.entrance'
  | 'present.outer_gallery'
  | 'present.echo_chamber'
  | 'present.sealed_chamber'
  | 'present.deep_chamber'
  | 'past.deep_chamber'
  | 'past.entrance'
  | 'past.square';

export type ItemId = 'lantern' | 'wedge';

/** Where a portable item currently is. */
export type ItemPlacement =
  | { kind: 'carried' }
  | { kind: 'room'; locationId: LocationId }
  | { kind: 'fixture'; fixtureId: string };

/** Flag values are restricted to primitives so validation stays cheap. */
export type FlagValue = boolean | number | string;

export interface JournalEntry {
  id: string;
  /** Plain text. Rendered as text, never as markup. */
  text: string;
  /** Turn number the observation was recorded on. */
  turn: number;
}

export type TranscriptKind =
  | 'narration'
  | 'command'
  | 'location'
  | 'dialogue'
  | 'system'
  /**
   * A numbered list of currently-available choices. Type-only play needs it
   * written out; selectable play already shows the same choices as buttons and
   * hides these entries. The entry is recorded either way, so switching mode
   * mid-conversation loses nothing.
   */
  | 'options'
  | 'objective'
  | 'journal'
  | 'failure';

export interface TranscriptEntry {
  id: string;
  kind: TranscriptKind;
  text: string;
  /** Optional heading shown above the text (used for location arrivals). */
  heading?: string;
  /** Optional sub-heading (era-appropriate location subtitle). */
  subheading?: string;
}

/* ------------------------------------------------------------------ *
 * Pending interaction
 *
 * Both conversation and disambiguation state live in GameState so a reload
 * mid-choice can either resume the choice or cancel it with feedback.
 * ------------------------------------------------------------------ */

export interface PendingConversation {
  kind: 'conversation';
  personId: string;
  /** Topic ids already heard in this conversation, for one-shot topics. */
  heard: string[];
}

/** A candidate for an ambiguous noun. */
export interface ClarificationOption {
  /** Display name the player can type back verbatim. */
  label: string;
  /** The action to dispatch if this option is chosen. */
  action: GameAction;
}

export interface PendingClarification {
  kind: 'clarification';
  question: string;
  options: ClarificationOption[];
}

export type PendingState = PendingConversation | PendingClarification;

/* ------------------------------------------------------------------ *
 * Game state
 * ------------------------------------------------------------------ */

export type Chapter = 'select' | 'rite' | 'crossing';

export const MAX_TRANSCRIPT = 240;
export const MAX_JOURNAL = 80;

export interface GameState {
  schemaVersion: number;
  contentVersion: string;

  character: CharacterId | null;
  chapter: Chapter;
  era: Era;
  locationId: LocationId;

  /** Carried item ids, in acquisition order. Mirrors placements for fast reads. */
  inventory: ItemId[];
  /** Authoritative position of every portable item. */
  placements: Record<string, ItemPlacement>;

  /**
   * Ids of objects, fixtures and people the player has actually noticed.
   * Engine-side gate: an undiscovered object cannot be acted on even if its
   * id is guessed, in either input mode.
   */
  discovered: string[];

  flags: Record<string, FlagValue>;
  journal: JournalEntry[];
  transcript: TranscriptEntry[];
  visited: LocationId[];

  objective: string;
  pending: PendingState | null;

  turn: number;
  /** True once the prototype's end-of-content marker has been shown. */
  ended: boolean;
  /** Monotonic counter used to mint unique transcript/journal ids. */
  seq: number;
}

/* ------------------------------------------------------------------ *
 * Actions
 *
 * The single vocabulary both input modes speak. The parser produces these;
 * the selectable UI constructs these directly. The reducer is the only place
 * that resolves names, checks visibility, or mutates flags.
 * ------------------------------------------------------------------ */

export type GameAction =
  | { type: 'SELECT_CHARACTER'; character: CharacterId }
  | { type: 'LOOK' }
  | { type: 'EXITS' }
  | { type: 'GO'; target: string }
  | { type: 'EXAMINE'; target: string }
  | { type: 'TAKE'; target: string; from?: string }
  | { type: 'DROP'; target: string }
  | { type: 'INVENTORY' }
  | { type: 'USE'; item: string; target?: string }
  | { type: 'OPEN'; target: string }
  | { type: 'CLOSE'; target: string }
  | { type: 'LIGHT'; target: string }
  | { type: 'PLACE'; item: string; target: string }
  | { type: 'TALK'; target: string }
  | { type: 'TOPIC'; topic: string }
  | { type: 'END_CONVERSATION' }
  | { type: 'CROSS_THRESHOLD' }
  | { type: 'JOURNAL' }
  | { type: 'HINT' }
  | { type: 'HELP' }
  | { type: 'CHOOSE'; value: string }
  | { type: 'CANCEL' }
  | { type: 'UNPARSED'; raw: string; reason: string };

/** A narrative event produced by resolving one action. */
export interface NarrativeEvent {
  kind: TranscriptKind;
  text: string;
  heading?: string;
  subheading?: string;
}

export interface ResolveResult {
  state: GameState;
  events: NarrativeEvent[];
  /** False when the action was rejected outright (no turn consumed). */
  accepted: boolean;
}

/* ------------------------------------------------------------------ *
 * Content definitions (authored data, never serialized into saves)
 * ------------------------------------------------------------------ */

export interface ExitDef {
  /** Stable id, unique within its location. */
  id: string;
  /** Player-facing name, e.g. "the village square". */
  label: string;
  to: LocationId;
  /** Directional alias, if the geography supports one. */
  direction?: string;
  /** Extra nouns accepted for this exit. */
  aliases?: string[];
  /** Hidden until this predicate passes. */
  requires?: (state: GameState) => boolean;
}

/** Changes an authored interaction may apply. */
export interface ContentEffects {
  flags?: Record<string, FlagValue>;
  journal?: Array<{ id: string; text: string }>;
  /** Object/person ids this interaction makes visible. */
  reveals?: string[];
}

export interface WorldObjectDef {
  id: string;
  /** Player-facing name. */
  name: string;
  /** Nouns that resolve to this object. */
  nouns: string[];
  locationId: LocationId;
  /** Visible on arrival (false for things found only by examining something else). */
  initiallyVisible: boolean;
  /**
   * Hides the object even once discovered — used for fixtures whose existence
   * depends on puzzle state (a revealed seam stops being listed once the
   * passage it hid has been swung open).
   */
  hiddenWhen?: (state: GameState) => boolean;
  /** Short line in the "you can see" list; omit to keep it out of the list. */
  listAs?: string | ((state: GameState) => string);
  description: (state: GameState) => string;
  /** Applied the first time the object is examined. */
  onExamine?: ContentEffects;
  /** Verbs the selectable UI should offer for this object. */
  verbs?: (state: GameState) => SelectableVerb[];
  /**
   * Marks this as a plausible place to try an item, so the selectable UI
   * offers "use X on this" / "put X in this" for it. Deliberately includes
   * wrong-but-reasonable targets: the list must not be solution-shaped.
   */
  acceptsItems?: boolean;
  /** Portable item this object represents, if any. */
  item?: ItemId;
}

export type SelectableVerb = 'examine' | 'take' | 'open' | 'light' | 'use' | 'retrieve' | 'cross';

export interface PersonDef {
  id: string;
  name: string;
  nouns: string[];
  locationId: LocationId;
  /** Line shown when the conversation opens. */
  greeting: (state: GameState) => string;
  /** Shown for EXAMINE on the person. */
  appearance: (state: GameState) => string;
  listAs: string;
  topics: TopicDef[];
}

export interface TopicDef {
  id: string;
  /** Short label shown in the numbered list and typed by type-only players. */
  label: string;
  /** Extra nouns accepted when typing the topic. */
  aliases?: string[];
  available?: (state: GameState) => boolean;
  /** Removed from the list once heard. */
  once?: boolean;
  response: (state: GameState) => string;
  /** Applied after the topic is heard. */
  effects?: ContentEffects;
}

export interface LocationDef {
  id: LocationId;
  era: Era;
  /** Player-facing location name. */
  name: string;
  /** Era-appropriate subtitle. Never says "present". */
  subtitle: (state: GameState) => string;
  /** Palette family for the UI. */
  tone: 'village' | 'approach' | 'cave' | 'deep';
  /** Full room description. */
  description: (state: GameState) => string;
  /** Extra paragraph shown only on first arrival. */
  firstVisit?: (state: GameState) => string;
  exits: ExitDef[];
}
