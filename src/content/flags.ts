/**
 * Every flag key the content and engine may set, in one place.
 *
 * Save validation rejects unknown flag keys, so adding a flag means adding it
 * here. Values are primitives only.
 */
export const FLAGS = {
  /** The lantern has been taken from the windowsill at home. */
  hasLantern: 'has_lantern',
  /** The lantern's wick is burning. */
  lanternLit: 'lantern_lit',
  /** Heard the prophecy's core claims in the square. */
  heardProphecy: 'heard_prophecy',
  /** Spoke with the joiner who attempted the rite and found nothing. */
  heardFoundNothing: 'heard_found_nothing',
  /** Spoke with the participant who had to be rescued. */
  heardRescued: 'heard_rescued',
  /** Spoke with the adult who keeps the entrance. */
  heardKeeper: 'heard_keeper',
  /** Read the account of the one who fled, in the echo chamber. */
  readFledAccount: 'read_fled_account',
  /** Examined the relief closely enough to register the lamp and the eye. */
  reliefExamined: 'relief_examined',
  /** Noticed that the relief's lower edge matches the sealed chamber alcove. */
  reliefMatched: 'relief_matched',
  /** The shutter has been raised at least once (so the alcove is known). */
  shutterTried: 'shutter_tried',
  /** The wedge is holding the shutter up. */
  shutterHeld: 'shutter_held',
  /** The lantern is sitting in the alcove. */
  lanternInAlcove: 'lantern_in_alcove',
  /** Light has passed through the relief's eye at least once. */
  seamRevealed: 'seam_revealed',
  /** The narrow opening has been pushed open and stays open. */
  passageOpen: 'passage_open',
  /** Stood at the threshold and looked into it. */
  thresholdExamined: 'threshold_examined',
  /** The crossing has been made. */
  crossed: 'crossed',
  /** Saw the living tree where the old stump stands. */
  sawTree: 'saw_tree',
  /** Heard that this village keeps no Wanderer prophecy. */
  heardNoProphecy: 'heard_no_prophecy',
  /** How many hints deep the player has gone in the current hint context. */
  hintStage: 'hint_stage',
  /** Which hint ladder the last hint came from, so a new context restarts it. */
  hintContext: 'hint_context',
} as const;

export type FlagKey = (typeof FLAGS)[keyof typeof FLAGS];

export const ALL_FLAG_KEYS: string[] = Object.values(FLAGS);
