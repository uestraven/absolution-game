# Blind playtest plan

**Status: PENDING.** No human has played this game. Nobody has been contacted,
no invitation has been sent, and no session has been run or scheduled. Every
result recorded anywhere in this repository is from automated checks and from
the people who wrote the thing. Nothing below may be reported as feedback until
a real person has sat down with it.

This document has two halves, and the line between them matters:

1. **[The tester sheet](#1-tester-sheet)** — spoiler-free. Safe to hand to a
   player. Copy it out on its own; do not send the file.
2. **[Observer guidance](#2-observer-guidance-spoilers)** — **SPOILERS.** For
   whoever is watching. Never show this to a tester before they finish.

A third section, [the feedback template](#3-feedback-template), is also
spoiler-free and goes to the tester afterwards.

> **Do not send a tester a link to this repository.** It contains the canon, the
> full walkthrough and the ending. Give them the deployed address and the sheet.

---

## 1. Tester sheet

*(Spoiler-free. Copy from here to the end of this section.)*

### Absolution — playtest

Thank you for playing. It is a short text adventure in a browser: you read what
is happening and say what you do. There is no combat, no timer, no way to die by
being slow, and nothing in it is trying to catch you out.

**It takes somewhere between forty minutes and two hours**, depending on how
much you poke at things. You can stop whenever you like — it saves as you go, in
your browser, and the same browser on the same device will offer to continue.

#### Before you start

- **Use one browser and one device for the whole run.** Your progress is stored
  in that browser only, so switching loses it. If you need to move, use
  **Settings › Export Save** first.
- **Pick an input mode when the game asks.** You can switch at any time in
  Settings, and switching loses nothing.
  - **Selectable actions** — everything is a button. No typing.
  - **Type-only** — you type what you do (`look`, `take lantern`, `go west`,
    `talk to the sage`). `help` lists what the game understands.
- Either mode can finish the whole game. Use whichever you would use if nobody
  were watching.

#### What we want from you

**Play normally.** Please do not try to be a good tester:

- Do not read the help unless you would anyway.
- Do not try to break it. (If you break it by accident, brilliant — tell us.)
- Do not hunt for the "right" answer. If you are stuck, be stuck for a bit, then
  do whatever you would actually do — including using **Hint**, which is built
  in and is not cheating.

**Note the moments you are confused.** A scrap is enough: *"no idea what I was
supposed to do in the square"*, *"thought the lantern mattered and it didn't"*,
*"lost my place after a long bit of text"*. Those notes are the whole point of
this. We cannot tell which parts are unclear from the inside.

If you hit something that looks like a bug — text that contradicts itself, a
command the game clearly should understand, lost progress, a layout that will
not fit your screen — write down **what you had just done**. That is usually
enough to find it.

#### Afterwards

Answer the questions on the feedback sheet. Short answers are fine. "I don't
know" is a real answer and a useful one.

---

## 2. Observer guidance (SPOILERS)

**Do not read this if you intend to play.** It gives away the whole story.

### Ground rules

- **Watch; do not coach.** Silence while somebody is stuck is the data. The
  built-in **Hint** is the game's own escalating help — let them find it and use
  it, and note when they do.
- **Do not explain a solution** until they have given up on it out loud, or
  thirty minutes have gone by on one obstacle. Then note what you had to say.
- **A player guessing the twist early is not a failure.** Several clues are
  deliberately legible. What matters is whether the *earlier self's resistance*
  and the *killing* land, not whether the reveal surprised them.
- **Taste is not a blocker.** "I found the villagers chatty" is taste. "I did
  not know the workshop existed" is a blocker. Record both; prioritize the
  second.

### What the story actually is

The protagonist turns sixteen and is allowed into the Cave of Absolution. A
passage nobody found leads to a basin that moves them exactly one hundred years:
first back, where they recite the village's familiar prophecy to a mason named
Saffra, who writes it down — **making them the prophecy's own source, and the
Wanderer of the legend**. Then forward, to a valley with thirty people left in
it and a world dying everywhere. Their own crossing caused it. **The mechanism is
never explained and must not be explained** — the game only ever offers
observation and competing theories.

They lose an eye breaking back into the sealed cave, return to the night they
set out, meet their earlier self about to make the first crossing, fail to talk
them out of it, **kill them**, and then **bring the pillar down on themselves**
to destroy the cave for ever. The epilogue is the village: a missing
sixteen-year-old nobody can account for, and then the same square a century
later with two hundred and sixty-one people in it and weather in the sky.

### Timings and counts to record

| Measure | How |
| --- | --- |
| Time to first meaningful action | From the opening to the first thing that changes the world (usually taking the lantern) |
| Time to the first crossing | The moment they step into the low dish |
| Time to the recitation | Saying the prophecy in the past square |
| Time to the synthesis | `reflect` in the ruined future |
| Time to the ending | Total |
| Hint uses | Count, and where |
| Repeated commands | The same command or topic tried 3+ times — a sign the game is not answering the question they asked |
| Topic fishing | Opening a conversation and reading every topic looking for the useful one |
| Lost progress | Any reload, crash, or "where did my game go" |

### Moments to watch specifically

Note the reaction, in their words if they say anything:

1. **The first crossing.** Do they understand *when* they are before the game
   tells them? Do they try to go back immediately?
2. **The recitation.** Do they realise what they have just done? The game does
   not say it outright.
3. **The ruined future.** Do they go looking for an explanation, and are they
   satisfied by being told nobody knows?
4. **The synthesis (`reflect`).** Does the chain land, or do they need to be
   told what they just read?
5. **The eye.** Does it read as a cost, or as the game being unfair?
6. **The recognition** — the moment a villager in the future calls them the
   Wanderer.
7. **The confrontation.** This is the one that matters most:
   - Do they try to talk their earlier self out of it, or go straight for the
     mallet?
   - Does the earlier self's refusal make sense to them, or read as the game
     being stubborn? The intent is that the younger one *accepts the identity
     proof and still disagrees about the remedy* — the prophecy's last line
     reads to them as instructions.
   - Do they try the nonlethal options? Which first? (The game requires one
     failed attempt before the killing is available.)
   - **Does the killing feel earned?** Record their face and their words.
8. **The pillar.** Do they notice the way out closing after the first blow? Do
   they go and look at the squeeze? Do they understand the third blow kills them
   *before* confirming it?
9. **The epilogue.** Do they understand that both selves are dead and that the
   future is saved?

### Music

Optional, off until enabled, and eight tracks that change by place. Worth
noting:

- Did they turn it on? At the title screen, or later in Settings, or never?
- Did they change the volume, and to what? The default is 25%.
- **Did a room change ever land in silence?** The crossfade makes a second
  audio element mid-play, which iOS Safari may refuse without a fresh gesture.
- **Can you hear the loop?** Each track is 25–64 seconds, so a player who
  lingers will hear it wrap several times. A click, a bump in loudness, or an
  obvious restart is worth reporting — nobody has listened for one.
- Did any track feel wrong for its place?
- Did audio ever interrupt reading with a notice or an error?

Ask afterwards whether they noticed the music changing between the eras, and
whether the last chapter sounded different from the rest of the cave. Both are
intended; neither is signposted.

### Scroll placement

A specific thing to watch, because it was just rebuilt: **when a long response
arrives, do they ever scroll upward to find its beginning?** They should never
need to. If you see a player hunting backwards after the recitation, the injury
or the ending, that is a defect — note which response and what device.

### What counts as a blocker

In rough priority order:

1. Lost progress, a crash, or a save that will not load.
2. Being unable to proceed at all for 30+ minutes, hints included.
3. Not understanding what to do in an era *at all* (as opposed to being stuck on
   one puzzle).
4. The killing or the sacrifice reading as arbitrary or forced.
5. Text that cannot be read or navigated on their device.
6. A contradiction in the story that they noticed.

### When revising afterwards

- **Recurring confusion beats individual taste.** Two testers lost in the same
  room is a design problem; one tester who wanted more combat is not.
- **Canon does not move.** The ending, the hundred-year distances, the
  unexplained mechanism, the fixed prophecy text and both deaths are settled.
  Improve how they are *earned and communicated*.
- **Record the reason for every revision**, with the session it came from, in
  `docs/KNOWN_ISSUES.md` or the commit message. A change with no traceable
  reason is how a story gets sanded down.

---

## 3. Feedback template

*(Spoiler-free. Send after they finish or give up.)*

### Absolution — feedback

**Your setup**

- Device and browser:
- Which input mode did you use? Did you switch?
- Roughly how long did you play? Did you finish?
- Have you played text adventures before?

**The questions**

1. **What did you think your goal was in each part of the game?** Answer for
   each place you found yourself, in your own words.

2. **Where did you get stuck, and what did you try?** List every spot you
   remember, even briefly. What did you do to get unstuck?

3. **When did you start to suspect who the Wanderer was?** What gave it away? If
   you never did, say so — that is just as useful.

4. **What convinced you that the journey caused the catastrophe?** Was there a
   specific thing, or did you never quite believe it?

5. **Did the earlier self's resistance make sense to you?** Did you understand
   why they would not listen, or did it feel like the game refusing you?

6. **Did the killing and the sacrifice feel earned, forced, or unclear? Why?**
   Please be blunt. This is the question we most need an honest answer to.

7. **Was the text easy to read and move around on your device?** Did you ever
   have to scroll back up to find the start of something?

8. **If you turned the music on:** did it suit the places? Did it ever cut out,
   restart oddly, or get in the way of reading? If you turned it off again, what
   made you?

**Anything else**

- Anything you noticed that looked like a mistake:
- Anything you expected to be able to do and could not:
- The best bit:
- The bit that dragged:
