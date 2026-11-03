/**
 * Core data types for the Cave of Absolution engine.
 *
 * Everything in GameState must be JSON-serializable: the whole state is
 * round-tripped through localStorage and through export/import files.
 * No functions, no class instances, no Maps, no Dates.
 */

/**
 * Save format.
 *
 * 2 adds the future era: `era: 'future'`, `chapter: 'future'`, the
 * `future.*` location ids, and the items and flags Chapter 2 introduces.
 *
 * 3 adds the return: `chapter: 'return'`, which is the original era for the
 * second time.
 *
 * 4 adds the finale and the ending: `chapter: 'ending'`, the stage flag the
 * confrontation runs on, and the flags recording both deaths and the
 * destruction. Every step has been a value fix-up rather than a reshape — no
 * field has ever been removed or retyped — and each is the hook its own
 * end-of-content normalisation hangs on. See persistence/validate.ts.
 */
export const SCHEMA_VERSION = 4;
export const CONTENT_VERSION = '1.0.0';

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
export type Era = 'present' | 'past' | 'future';

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
  | 'past.worksite'
  | 'past.entrance'
  | 'past.cave_path'
  | 'past.spring'
  | 'past.square'
  | 'future.deep_chamber'
  | 'future.cave_path'
  | 'future.entrance'
  | 'future.sealed_chamber'
  | 'future.square';

export type ItemId = 'lantern' | 'wedge' | 'stone' | 'water_skins' | 'mallet';

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
  /**
   * An action that achieved something: an item acquired or put down, a
   * mechanism worked, a way opened. Separate from `narration` so the interface
   * can mark success without guessing, and so the wording stays explicit for
   * anyone who cannot see the colour.
   */
  | 'success'
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

/**
 * Which chapter the save is in.
 *
 * Chapter and era move together, but the pairing is no longer one-to-one: the
 * original era happens twice, once going out and once coming back, and the two
 * are different chapters in the same place. `chaptersForEra` in
 * engine/reducer.ts is the single declaration of which pairs are legal, and
 * save validation checks membership rather than equality.
 *
 *   rite      → present   the opening
 *   crossing  → past
 *   future    → future
 *   return    → present   the same rooms, a hero with one eye, and two of them
 *   ending    → present   after both of them are dead. Terminal: the hero is
 *                         not alive in it, and ordinary play does not resume
 */
export type Chapter = 'select' | 'rite' | 'crossing' | 'future' | 'return' | 'ending';

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
  /**
   * True once the end-of-current-content marker has been shown.
   *
   * This is the boundary of what is built, not the end of the story. It is not
   * the final ending and must not be presented as one.
   */
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
  | { type: 'FILL'; target: string; item?: string }
  | { type: 'GIVE'; item: string; target: string }
  /**
   * Speak the prophecy, word for word. A story action rather than a puzzle
   * verb: the engine checks the scene has reached the point where the
   * villagers have asked, and the text it produces is the one canonical text.
   */
  | { type: 'RECITE' }
  | { type: 'WAIT' }
  /** Swing something heavy at something that is in the way. */
  | { type: 'BREAK'; target: string; using?: string }
  /**
   * Show somebody something you are carrying, or tell them something you know.
   *
   * Separate from GIVE because nothing changes hands, and separate from TOPIC
   * because the thing being shown *is* the argument.
   */
  | { type: 'SHOW'; subject: string; target?: string }
  /** Put hands on somebody and try to stop them moving. */
  | { type: 'RESTRAIN'; target: string }
  /** Stand between somebody and the thing they are going for. */
  | { type: 'BLOCK'; target: string }
  /**
   * Kill. Spelled out, with its own verb, so no generic "use the tool on the
   * person" can conceal what it means — and so the command the player types is
   * the decision they are making.
   */
  | { type: 'KILL'; target: string; using?: string }
  /**
   * Re-print the epilogue. Touches nothing: reading, not replaying, and the
   * only story action a finished save accepts.
   */
  | { type: 'REVIEW' }
  /** Shift loose material out of the way of something behind it. */
  | { type: 'CLEAR'; target: string }
  /**
   * Stop and put together what has been found. A deliberate action rather
   * than an automatic unlock: the hero draws the inference, the player
   * chooses when.
   */
  | { type: 'REFLECT' }
  | { type: 'TALK'; target: string }
  | { type: 'TOPIC'; topic: string }
  | { type: 'END_CONVERSATION' }
  | { type: 'CROSS_THRESHOLD' }
  | { type: 'JOURNAL' }
  | { type: 'HINT' }
  | { type: 'HELP' }
  | { type: 'CHOOSE'; value: string }
  | { type: 'CANCEL' }
  /**
   * A small physical attempt: eat, touch, listen, sit, and so on.
   *
   * One action for the whole family rather than ten, so the vocabulary the
   * parser, the affordances and the save validator all share stays small.
   */
  | { type: 'PHYSICAL'; verb: PhysicalVerb; target: string }
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
  /**
   * What picking it up is like, when the item's default line would be wrong.
   * Two objects can stand for the same item — the hero's own lantern on the
   * windowsill and a borrowed crew lamp a century earlier — and taking them is
   * not the same experience.
   */
  takeText?: (state: GameState) => string;
  /**
   * What happens when somebody tries to eat, touch, listen to or sit on it.
   *
   * Authored per verb, and optional: a verb with no entry still gets a line
   * that names this object rather than a generic refusal. Where a response
   * changes the world — bread being eaten — it returns effects alongside the
   * text, and the engine applies them exactly once.
   */
  responses?: Partial<Record<PhysicalVerb, (state: GameState) => PhysicalResponse>>;
  /**
   * Why this cannot be picked up, when "not something you can carry off" is
   * the wrong answer.
   *
   * An owner objecting, an offering left deliberately, stonework that is part
   * of the hill: the refusal is where the writing goes, and a refusal that
   * knows what it is refusing is an interaction. Only consulted for objects
   * with no `item`.
   */
  cannotTake?: (state: GameState) => string;
}

export interface PhysicalResponse {
  text: string;
  /** Flags and journal entries to apply. Applied once, after the text. */
  effects?: ContentEffects;
  /** True when this changed the world, so the turn counts as an action. */
  accepted?: boolean;
}

/**
 * The small physical vocabulary.
 *
 * Deliberately short, and deliberately only verbs the prose invites: the game
 * describes bread on a stool, a bowl of salt, a spring, a stool to sit on. A
 * player who tries `eat bread` should not be told the story does not
 * understand the idea of eating.
 *
 * These are **not** a simulation. Each one resolves a noun and prints a line.
 * The default line names the object, so attempting any of them against
 * anything present gets an answer about that thing rather than "you cannot do
 * that here" — which is the whole point. Authored responses override, and are
 * where the actual writing goes.
 */
export const PHYSICAL_VERBS = [
  'eat',
  'drink',
  'taste',
  'touch',
  'smell',
  'listen',
  'sit',
  'pull',
  'untie',
  'knock',
] as const;

export type PhysicalVerb = (typeof PHYSICAL_VERBS)[number];

export function isPhysicalVerb(value: unknown): value is PhysicalVerb {
  return typeof value === 'string' && (PHYSICAL_VERBS as readonly string[]).includes(value);
}

export type SelectableVerb =
  | 'examine'
  | 'take'
  | 'open'
  | 'light'
  | 'use'
  | 'retrieve'
  | 'cross'
  | 'fill'
  | 'break'
  | 'clear'
  | PhysicalVerb;

export interface PersonDef {
  id: string;
  name: string;
  nouns: string[];
  locationId: LocationId;
  /**
   * Whether this person is here at all right now.
   *
   * Needed because a room can be revisited in a different chapter with
   * different people in it: the sealed chamber has nobody in it during the
   * opening and somebody very specific in it on the return.
   */
  available?: (state: GameState) => boolean;
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
  /**
   * What a bare `LISTEN` hears here.
   *
   * A sensory affordance rather than an object: the echo chamber is named for
   * a sound, the basin carries weather down from outside, and a settlement of
   * thirty people is quiet in a way a village of two hundred is not. Optional;
   * rooms without one get a line saying there is nothing to hear.
   */
  sounds?: (state: GameState) => string;
  /** Full room description. */
  description: (state: GameState) => string;
  /** Extra paragraph shown only on first arrival. */
  firstVisit?: (state: GameState) => string;
  exits: ExitDef[];
}
