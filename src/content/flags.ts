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

  /* ---- Chapter 1, optional ---------------------------------------- */
  /** Looked at the worked pillar holding the sealed chamber's roof. */
  sawPillar: 'saw_pillar',
  /** Picked up a stone from the gallery floor. */
  tookStone: 'took_stone',
  /** Actually put that stone in Parsie's hand. */
  gaveStone: 'gave_stone',

  /* ---- Chapter 2: worksite access (P2) ---------------------------- */
  /** Knows the crew have run out of water and cannot spare a man to fetch it. */
  knowsWaterNeeded: 'knows_water_needed',
  /** The skins have been filled at the spring. */
  skinsFilled: 'skins_filled',
  /** Carried water to Lovage and was given the run of the workings. */
  carriedWater: 'carried_water',
  /** Fenn has shown the gap behind the spoil heap. */
  fennRoute: 'fenn_route',
  /** Saffra has walked the hero up past Lovage. */
  saffraEscort: 'saffra_escort',
  /** The worksite can be entered, however that was earned. Latches true. */
  worksiteAccess: 'past_worksite_access',
  /** Lovage has decided the wrongnesses arrived with the stranger. */
  lovageDistrust: 'lovage_distrust',

  /* ---- Chapter 2: the recitation (P4) ----------------------------- */
  /** The villagers have asked what the words actually are. */
  askedForWords: 'asked_for_words',
  /** The prophecy has been spoken aloud, word for word. One-way. */
  recitedProphecy: 'recited_prophecy',
  /** Saffra has written it on the back of a board. */
  prophecyRecorded: 'prophecy_recorded',
  /** Declined to recite, at least once. Nothing is lost by it. */
  declinedRecital: 'declined_recital',
  /** Told Fenn where the hero is really from. */
  toldFennTruth: 'told_fenn_truth',
  /** Tried to take the words back afterwards. */
  triedToRetract: 'tried_to_retract',

  /* ---- Chapter 2: the three heights (P3) -------------------------- */
  /** Read the builders' drawing of the three positions. */
  readDrawing: 'read_drawing',
  /** Read the crew's craft record. */
  readCrewNotes: 'read_crew_notes',
  /** Looked at the two cut dishes and the uncut outline. */
  examinedDishes: 'examined_dishes',
  /** Has all three pieces, and has drawn the conclusion. */
  knowsSettings: 'knows_settings',
  /** Heard Lovage warn the hero off the worked pillar. */
  pillarWarning: 'pillar_warning',
  /** The lantern is standing in the high dish. */
  lanternInHighDish: 'lantern_in_high_dish',
  /** Tried the low dish, and found out what it does. */
  triedLowDish: 'tried_low_dish',
  /** The second crossing has been made. */
  crossedForward: 'crossed_forward',

  /* ---- Chapter 2: rupture symptoms -------------------------------- */
  /** A sound that arrived before the thing that made it. */
  symptomSound: 'symptom_sound',
  /** A chalk line that is not where it was left. */
  symptomMark: 'symptom_mark',
  /** Weather that un-happened. */
  symptomWeather: 'symptom_weather',

  /* ---- Chapter 2: the low position, tried on purpose --------------- */
  /** The lantern is standing in the low dish. */
  lanternInLowDish: 'lantern_in_low_dish',

  /* ---- Chapter 3: out of the hill ---------------------------------- */
  /** Climbed out through the subsidence tear onto the hillside. */
  leftTheHill: 'left_the_hill',
  /** Tried the old stair and found it closed. */
  triedBlockedStair: 'tried_blocked_stair',

  /* ---- Chapter 3: the evidence (P5) ------------------------------- */
  /** Read the settlement's Account, with the canonical text inside it. */
  readAccount: 'read_account',
  /** Read the memorial stone and the year on it. */
  readMemorial: 'read_memorial',
  /** Heard the inherited story of the child who went up to the hill. */
  heardMissingChild: 'heard_missing_child',
  /** Went back through their own journal while standing in this century. */
  checkedJournal: 'checked_journal',
  /** Saw something here behave the way things behaved in the past. */
  sawFutureSymptom: 'saw_future_symptom',
  /** Put it together. The hero's inference, not a proof. */
  knowsResponsibility: 'knows_responsibility',

  /* ---- Chapter 3: the seal (P6) ----------------------------------- */
  /** Sorrel has named the course that is loose. */
  knowsLooseCourse: 'knows_loose_course',
  /** Something is holding the course off the stone below it. */
  coursePropped: 'course_propped',
  /** Swung at the seal without bracing it first. A setback, nothing more. */
  sealSettled: 'seal_settled',
  /** One good blow has landed on a braced course. */
  sealStruck: 'seal_struck',
  /** The seal is down. Latches: it does not close again. */
  sealOpened: 'seal_opened',
  /** Asked Rue whether the hill may be opened. */
  askedRue: 'asked_rue',
  /** The left eye is gone. */
  lostEye: 'lost_eye',
  /** Somebody at the mouth put a name to what they were looking at. */
  namedWanderer: 'named_wanderer',
  /** Somebody cleaned and bound it. */
  eyeTreated: 'eye_treated',

  /* ---- Chapter 3: the way home ------------------------------------ */
  /** The fill over the middle dish has been looked at closely. */
  examinedFill: 'examined_fill',
  /** The fill is off and the middle dish is reachable. */
  fillCleared: 'fill_cleared',
  /** The lantern is standing in the middle dish. */
  lanternInMiddleDish: 'lantern_in_middle_dish',
  /** The third crossing has been made. */
  crossedBack: 'crossed_back',

  /* ---- Chapter 4: the confrontation -------------------------------- *
   * The stage is the finale's only state machine. Everything else here is
   * a fact about the room or about what has been said, and the stage is
   * derived from none of them — it moves only where the table in
   * engine/puzzles/confrontation.ts says it moves.
   * ------------------------------------------------------------------ */
  /** Which beat of the confrontation is running. See FINALE_STAGES. */
  finaleStage: 'finale_stage',
  /** How close the earlier self has got to the wall. 0–3, and it caps. */
  theirReach: 'their_reach',

  /* ---- what has been said, and what it achieved -------------------- */
  /** The hero has said who they are. */
  claimedIdentity: 'claimed_identity',
  /** The two lanterns have been held side by side. */
  showedLantern: 'showed_lantern',
  /** They have accepted that the stranger is another version of them. */
  identityAccepted: 'identity_accepted',
  /** The journal has been held open in front of them. */
  showedJournal: 'showed_journal',
  /** The hero has described the ruined century. */
  describedFuture: 'described_future',
  /** The hero has told them where the prophecy came from. */
  toldOrigin: 'told_origin',

  /* ---- what has been tried with hands ------------------------------ */
  /** The hero is standing between them and the patterned wall. */
  blockingWall: 'blocking_wall',
  /** Their lamp has been taken out of the alcove at least once. */
  tookTheirLamp: 'took_their_lamp',
  /** The hero has had hold of them. */
  restrainedThem: 'restrained_them',

  /* ---- Chapter 4: the terminal facts ------------------------------- */
  /** The earlier self is dead. Latches, once, for ever. */
  earlierSelfDead: 'earlier_self_dead',
  /** How many blows the pillar has taken. 0–3. */
  pillarStruck: 'pillar_struck',
  /** The squeeze west is closed by the roof coming down a hair. */
  escapeClosed: 'escape_closed',
  /** The chamber is down and the fold is under it. */
  caveDestroyed: 'cave_destroyed',
  /** The returning hero is dead. */
  heroDead: 'hero_dead',
  /** The epilogue has been shown, and the story is over. */
  storyComplete: 'story_complete',
  /** How many hints deep the player has gone in the current hint context. */
  hintStage: 'hint_stage',
  /** Which hint ladder the last hint came from, so a new context restarts it. */
  hintContext: 'hint_context',
} as const;

export type FlagKey = (typeof FLAGS)[keyof typeof FLAGS];

export const ALL_FLAG_KEYS: string[] = Object.values(FLAGS);

/**
 * The type each flag is actually allowed to hold.
 *
 * Accepting "any primitive" for every flag let a save put a string where the
 * engine reads a boolean, or a number where it reads a context name. Save
 * validation checks against this instead.
 */
export const FLAG_TYPES: Record<string, 'boolean' | 'number' | 'string'> = {
  [FLAGS.hasLantern]: 'boolean',
  [FLAGS.lanternLit]: 'boolean',
  [FLAGS.heardProphecy]: 'boolean',
  [FLAGS.heardFoundNothing]: 'boolean',
  [FLAGS.heardRescued]: 'boolean',
  [FLAGS.heardKeeper]: 'boolean',
  [FLAGS.readFledAccount]: 'boolean',
  [FLAGS.reliefExamined]: 'boolean',
  [FLAGS.reliefMatched]: 'boolean',
  [FLAGS.shutterTried]: 'boolean',
  [FLAGS.shutterHeld]: 'boolean',
  [FLAGS.lanternInAlcove]: 'boolean',
  [FLAGS.seamRevealed]: 'boolean',
  [FLAGS.passageOpen]: 'boolean',
  [FLAGS.thresholdExamined]: 'boolean',
  [FLAGS.crossed]: 'boolean',
  [FLAGS.sawTree]: 'boolean',
  [FLAGS.heardNoProphecy]: 'boolean',
  [FLAGS.sawPillar]: 'boolean',
  [FLAGS.tookStone]: 'boolean',
  [FLAGS.gaveStone]: 'boolean',
  [FLAGS.knowsWaterNeeded]: 'boolean',
  [FLAGS.skinsFilled]: 'boolean',
  [FLAGS.carriedWater]: 'boolean',
  [FLAGS.fennRoute]: 'boolean',
  [FLAGS.saffraEscort]: 'boolean',
  [FLAGS.worksiteAccess]: 'boolean',
  [FLAGS.lovageDistrust]: 'boolean',
  [FLAGS.askedForWords]: 'boolean',
  [FLAGS.recitedProphecy]: 'boolean',
  [FLAGS.prophecyRecorded]: 'boolean',
  [FLAGS.declinedRecital]: 'boolean',
  [FLAGS.toldFennTruth]: 'boolean',
  [FLAGS.triedToRetract]: 'boolean',
  [FLAGS.readDrawing]: 'boolean',
  [FLAGS.readCrewNotes]: 'boolean',
  [FLAGS.examinedDishes]: 'boolean',
  [FLAGS.knowsSettings]: 'boolean',
  [FLAGS.pillarWarning]: 'boolean',
  [FLAGS.lanternInHighDish]: 'boolean',
  [FLAGS.triedLowDish]: 'boolean',
  [FLAGS.crossedForward]: 'boolean',
  [FLAGS.symptomSound]: 'boolean',
  [FLAGS.symptomMark]: 'boolean',
  [FLAGS.symptomWeather]: 'boolean',
  [FLAGS.lanternInLowDish]: 'boolean',
  [FLAGS.leftTheHill]: 'boolean',
  [FLAGS.triedBlockedStair]: 'boolean',
  [FLAGS.readAccount]: 'boolean',
  [FLAGS.readMemorial]: 'boolean',
  [FLAGS.heardMissingChild]: 'boolean',
  [FLAGS.checkedJournal]: 'boolean',
  [FLAGS.sawFutureSymptom]: 'boolean',
  [FLAGS.knowsResponsibility]: 'boolean',
  [FLAGS.knowsLooseCourse]: 'boolean',
  [FLAGS.coursePropped]: 'boolean',
  [FLAGS.sealSettled]: 'boolean',
  [FLAGS.sealStruck]: 'boolean',
  [FLAGS.sealOpened]: 'boolean',
  [FLAGS.askedRue]: 'boolean',
  [FLAGS.lostEye]: 'boolean',
  [FLAGS.namedWanderer]: 'boolean',
  [FLAGS.eyeTreated]: 'boolean',
  [FLAGS.examinedFill]: 'boolean',
  [FLAGS.fillCleared]: 'boolean',
  [FLAGS.lanternInMiddleDish]: 'boolean',
  [FLAGS.crossedBack]: 'boolean',
  [FLAGS.finaleStage]: 'string',
  [FLAGS.theirReach]: 'number',
  [FLAGS.claimedIdentity]: 'boolean',
  [FLAGS.showedLantern]: 'boolean',
  [FLAGS.identityAccepted]: 'boolean',
  [FLAGS.showedJournal]: 'boolean',
  [FLAGS.describedFuture]: 'boolean',
  [FLAGS.toldOrigin]: 'boolean',
  [FLAGS.blockingWall]: 'boolean',
  [FLAGS.tookTheirLamp]: 'boolean',
  [FLAGS.restrainedThem]: 'boolean',
  [FLAGS.earlierSelfDead]: 'boolean',
  [FLAGS.pillarStruck]: 'number',
  [FLAGS.escapeClosed]: 'boolean',
  [FLAGS.caveDestroyed]: 'boolean',
  [FLAGS.heroDead]: 'boolean',
  [FLAGS.storyComplete]: 'boolean',
  [FLAGS.hintStage]: 'number',
  [FLAGS.hintContext]: 'string',
};
