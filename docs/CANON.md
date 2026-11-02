# Canon, provisional content, and open questions

**Not for players.** This states the story's reveals.

Three tiers, kept strictly apart:

1. **Canon** — approved. The prototype is built to be consistent with all of it.
2. **Provisional** — invented for this build to make it playable. Revisable
   without touching canon.
3. **Undecided** — explicitly not settled. This build makes no claim either way,
   and nothing in it should be read as having settled any of it.

---

## 1. Canon

### The opening situation

- The protagonist has just turned sixteen. The player chooses **Basil**
  (he/him) or **Basilia** (she/her). Both have the same opportunities, puzzles
  and central story.
- Sixteen-year-olds are permitted to attempt the Cave of Absolution as a village
  rite of passage.
- Some people decline it. Others enter and flee, get lost and need rescuing, or
  find nothing. Basil/Basilia alone works out the puzzles and finds a route
  deeper in.
- The village is preparing for an end-of-world prophecy. It describes a monster
  called **the Wanderer** as a cyclops who brings a cataclysm, and says someone
  who braves the Cave of Absolution will have the power to stop it.

### The shape of the whole story

- The adventure eventually takes the hero to the **same village in the past**,
  before it has this prophecy. Their attempt to warn the villagers becomes the
  original source of the prophecy already known in the opening.
- A later crossing reaches the **future**, after the catastrophe. Damage
  accumulates through the hero's adventure and culminates in that future.
- During the adventure the hero **loses an eye** and comes to embody the
  Wanderer, while also holding the power to stop the catastrophe.
- The hero eventually returns to their original period to **stop their earlier
  self**. Both believe they are doing what is right.
- The hero's original journey did **not** include meeting their future self. The
  final intervention happens for the first time. There is no opening encounter
  with the future hero, no obligatory repeating cycle, and no branching
  universes.
- The hero **retains their experiences** even when intervening in their earlier
  journey. The warning was always part of the original village's history.
- The final confrontation takes place in the cave and should result in **closing
  its portal**.
- The cave differs in each era. Age, inhabitants, water, damage and access
  routes should eventually affect exploration and puzzles.

### How this build honours each of those

| Canon point | In the prototype |
| --- | --- |
| Rite at sixteen, open to all | `present.home` establishes the birthday; Sage states plainly that being allowed is the whole of it |
| Mixed outcomes for others | Oreg found nothing; Dilly was lost and rescued; "H." fled the echo chamber; Bren declined and nothing happened to him; Jens turned back, Mira sat down, Hal counted to a hundred |
| The hero figures it out by observation, not destiny | The puzzle is relief → alcove → support → light → seam. Sage and Bay both push back explicitly on the chosen-one reading |
| The prophecy's content | The chalked plank and Sage's dialogue: one-eyed, a cataclysm, and the one who braves the cave gaining the power to turn it aside |
| The hero can later *become* what the prophecy describes | The authoritative text says only **one-eyed**. It does not say where the eye sits. The familiar central-eye image is attributed in-world to the old carvings, and Sage says so: "That is the carvers' idea, not the words'." A hero who loses one of two eyes still satisfies the words |
| The prophecy already old in the opening | Sage says the Wanderer-words are generations old and said at midwinter; what is *new* is Hyssop dreaming a date for them. This is what makes a warning given in the past consistent with the opening |
| The cave differs by era | The past cave has no gallery, no crawl, no squeeze, no rope: a worked stair straight down, still being cut, with daylight reaching further in. The route out is correspondingly shorter |
| Landmarks echo with differences | Living tree where the stump is; unworn well cap; roofless frame on the workshop's footprint; no lintel inscription; no cord of lanterns |
| The twist is not pre-announced | Asserted by test: no player-facing string names time travel, the Wanderer's identity, the eye, a future self or a paradox |
| No future-self encounter | There is none, and no mechanism implying one |

### Deliberately avoided, because not approved

- **No evacuation plan.** The village's preparations are observance, not
  logistics: unlit lanterns strung for a vigil, a bowl of salt nobody can
  justify, a chalked plank people keep re-reading. Marjoram's complaint is that
  eleven days of this is eleven days of roofs not being mended.
- **No portal-sustained damage.** The threshold is described as unnatural depth
  and a second room's weather bleeding through. No cost, drain or decay is
  attached to it.
- **No chosen-one bloodline.** Nothing about the protagonist's lineage is
  mentioned at all, and the two characters who have most authority on the
  subject both say nobody has ever come out of that cave with a power.
- **No cult.** The villagers disagree with each other: Sage keeps the plank
  accurately while finding the salt useless, Marjoram thinks it is nonsense and
  still wants the hero home safe, Parsie is thrilled, Oreg is simply behaving as
  though there will be a midwinter, Bay refuses to ask more of a child's
  birthday than the birthday.

---

## 2. Provisional

All of this is invention for playability. None of it constrains canon.

### Names

**The convention is locked: everyone is named for a herb or a spice.** The
individual names are provisional; the convention is not, and a character
outside it fails a test.

Internal `id`s are deliberately the earlier provisional ones. Saves reference
them — directly in `pending.personId`, and inside the `topic.<person>.<topic>`
entries in `discovered` — so renaming a display name must not move them. The
old names also stay in each person's `nouns`, so a player's typing habits and
an older save's expectations both keep working.

| Internal id | Display name | Where | Role |
| --- | --- | --- | --- |
| `orla` | **Sage** | square | Keeps the plank, the midwinter words and the order of the vigil. Twenty-three, inherited the job from an aunt |
| `marda` | **Marjoram** | square | The baker. Outspoken, thinks it is nonsense, still wants the hero home safe |
| `hesk` | **Parsie** | square | Eleven, fascinated by the expedition |
| `tolv` | **Oreg** | workshop | The joiner. Practical, gives away wedges, searched the sealed chamber and found nothing |
| `nessa` | **Dilly** | cave path | Was lost and rescued, and dislikes the embellished version the square tells |
| `aldren` | **Tyme** | cave path | Keeps the entrance and the rope. Went in after Dilly |
| `sabra` | **Saffra** | past square | A mason, building what will be the joiner's workshop |
| `pell` | **Fenn** | past square | Eleven or twelve, holding the mortar board badly |

Mentioned but never met, same convention: **Hyssop**, who counted the date out
of the lines; **Nettle**, whose idea the salt was — and, quietly, the "N." who
scratched the account in the echo chamber and fled; **Lovage** and his sons,
cutting the stair in the past; **Cress**, who dropped a coin in the basin;
**Chervil** and **Borage**, who went in this year; **Mint**, who declined the
rite in front of everyone.

**Rose and Mary are reserved.** Approved as twins for the full-game design and
deliberately not spent on filling out the opening's roster. A test asserts they
appear nowhere in player-facing text, so they stay available.

Nobody remarks on anyone's name, nobody makes a pun, and no behaviour is
derived from a name's meaning. **Tyme's dialogue is kept clear of the time
register** — no time, times, timing, clock, hours, minutes, years, "the past",
future, era, age — so the name never reads as a wink at what the chapter turns
out to be about. A test enforces it.

Three additions were built and then removed as unapproved cast expansion. They
are listed here for Milestone 2 review, and are in git history: a standalone
**Mint** as a talkable villager; **Rose and Mary** as a single paired
conversation whose every answer disagreed with itself; and a **Tyme** who was
the hero's childhood friend waiting at the cave mouth rather than the entrance
keeper. The last of those carried the opening's clearest personal stake.

**The village has no name anywhere in the build**, because that is undecided —
see below. Player-facing text says "the village", "the square", "home".

**The prophecy's exact wording**, including the lines *The hill will open. The
water will answer. What stands will not stand.* and the second hand writing
*and will they, though.* underneath. The canonical claims are the one eye, the
cataclysm and the power; the rest is texture.

**How the prophecy came to name this year.** Hyssop counted a date out of the
existing lines, "the way you would count a debt", and brought it to Sage. This
is deliberately *not* foreknowledge: an earlier draft had her dream the date
three times, which would have introduced a supernatural mechanism nobody has
approved. The current version is a woman doing arithmetic on old words and
being believed. If genuine foreknowledge is wanted, that is a decision to make
on purpose — see below.

**The old carvings** that give everyone the central-eye picture of the
Wanderer, and Sage's view that half of what people know about it they know off
a wall.

**The vigil, the strung lanterns and the bowl of salt** as the specific form the
village's preparation takes, including that the salt arrived this spring.

**The lintel inscription** — `GO IN. COME OUT. BE EASIER WITH YOURSELF.` — and
the idea that nobody knows who cut it. This is the only place the prototype
leans on the cave's name meaning anything.

**The knotted rope** from an iron ring at the mouth to a pillar in the gallery,
and Bay's role keeping the path.

**The whole first puzzle.** The relief's imagery, the sliding shutter in cut
grooves, the ankle-height smoke-blackened alcove with a dished floor, the
pierced eye, the scale pattern, the pivoted slab. Also the oak wedge as the
freely-offered tool and the striker fixed to the lantern's base.

**Location names and era subtitles**, e.g. *The Sealed Chamber*, *The Basin
Chamber*, "The same room, and nothing like it".

**Everything about the past era's detail**: the stair being cut in its third
season, the coins and bone pin in the basin, the chalk setting-out line, the
leather bucket and tight-headed mallet, the great tree with a rope swing, the
new well, the roofless frame, Saffra calling the cave just "the cave".

**The household at home.** Bread on a stool, a hooked-back shutter, a cloth tag
reading *Sixteen. Go carefully.* and the line "Nobody in this house signs
things." Chosen to imply someone cares without asserting any family facts.

**All opening dialogue.**

---

## 3. Undecided — do not read this build as settling any of it

- The village's name.
- The protagonist's family details.
- The ultimate rescue plan.
- The cause and timing of the eye injury.
- The full physical rules of temporal damage.
- The return crossing from the future.
- The closure mechanism for the portal, and its cost.
- The ending.
- Full combat and progression systems.
- **Whether anyone in this world has real foreknowledge.** The prototype
  carefully does not say. Hyssop reads a date out of old lines and may simply be
  wrong; the prophecy itself is generations old and, per canon, originates with
  the hero's own warning. Nothing here establishes a mechanism by which the
  original words could have been predictive, and nothing here rules one out.
- **Why the protagonist is personally invested in these particular people.**
  The prototype builds this out of named villagers — Marjoram's dough for
  tomorrow, Parsie waiting four years for his own turn, somebody up a ladder
  being told how to hang a lantern. That is as far as it can honestly go while
  the protagonist's family remains undecided, which is the obvious place deeper
  stakes would come from.

The prototype contains no combat, levelling, hunger, durability, timers or
consumable resources, so nothing here presumes a system for any of them.

---

## Milestone 1 housekeeping

**Title.** The game is **Absolution**. The place inside it remains the **Cave of
Absolution**. Storage keys are unchanged (`cave-of-absolution:*`), kept
deliberately so that saves from the first prototype still load.

**Save compatibility.** `schemaVersion` is still 1 and `contentVersion` is
still `0.1.0`: the state shape did not change, and neither did any id a save
records. Renaming the cast touched display names only. Transcript strings may
now contain `{{tag|text}}` annotations; strings saved before that contain none,
strip to themselves, and render as plain text, so there is nothing to migrate.

**Still provisional, and due for Milestone 2 review:** Hyssop's counted date
for the prophecy; the vigil, lanterns and salt as the village's preparation;
the lintel inscription; the whole first puzzle; and the cave-path paragraph that
names what is down in the village in order to give the hero something to lose.

## Spoiler hygiene, and its limit

Reveals are kept out of player-facing descriptions, journal entries, UI labels,
objective text and save filenames. `content/content.test.ts` enforces the first
of those with a pattern list, and the export filename is the deliberately
anonymous `adventure-save.json`.

The interface's magenta highlight is held to the same standard. Its term list
(`content/highlights.ts`) is deliberately broad — the prophecy, the Wanderer,
the rite's name, the cataclysm, the vigil, the threshold, the carved eye, the
relief, and the odd sounds in the cave — so that seeing magenta does not amount
to the interface pointing at the chapter's twist. Every term on it is something
the player has already read on the plank, heard from a villager, or is standing
in front of. Cyan highlighting is derived from `state.discovered`, so it cannot
mark anything the player has not found.

This is presentation only. The build is static client-side JavaScript: every
string, every flag name and every location id ships to the browser and can be
read by anyone who opens the bundle or this repository. No claim is made that
the source conceals anything. If the build is public, treat the source as
public.
