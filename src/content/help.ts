export const HELP_TEXT = `COMMANDS

Looking
  LOOK (L)                    describe where you are again
  EXAMINE <thing> (X, INSPECT, LOOK AT, STUDY, READ)
  EXITS                       list the ways out

Moving
  GO <exit or direction> (MOVE, WALK, HEAD, CLIMB, ENTER)
  NORTH / SOUTH / EAST / WEST / UP / DOWN / IN / OUT  (N, S, E, W, U, D)
  ENTER THRESHOLD             only where there is one

Handling things
  TAKE <thing> (GET, PICK UP, RETRIEVE)
  TAKE <thing> FROM <place>
  DROP <thing> (PUT DOWN)
  INVENTORY (I, INV)
  OPEN <thing> / CLOSE <thing>
  LIGHT <thing> (KINDLE, IGNITE)
  USE <thing> ON <thing> (USE ... WITH / UNDER)
  PLACE <thing> IN <thing> (PUT, SET, STAND)

People
  TALK TO <person> (SPEAK TO, ASK)
  then type a topic, or its number
  LEAVE                       end the conversation

Other
  JOURNAL                     what you have established so far
  HINT                        nudge, then more, then the answer
  HELP                        this list

Case, punctuation and "the" do not matter. This is a small, fixed vocabulary,
not free-form English: if a phrasing is not recognised, nothing happens and
nothing changes.

Both input modes understand exactly the same actions. You can switch between
Type-only and Selectable Actions in Settings at any time without losing your
place.`;

export const SAVE_HELP_TEXT = `SAVING

Your progress is saved automatically in this browser after every action, along
with a backup and a checkpoint from the start of the chapter.

Saves live in this browser, on this web address only. They do not sync between
devices or browsers, and a preview address has its own separate storage. Use
Export Save to get a file you can keep or move, and Import Save to load it
back.`;
