# Spells as keys, and secrets (proposal)

*The systems designer, 17 Nov 2026. A proposal: nothing here is a spec until `decisions.md` carries a `Michael:` line under it.*

## The problem in Michael's words

Backlog L, OG-122: "one key a school: Tine heats a mechanism and melts ice, Uisce raises and lowers water, Cloch moves masonry, Scáth shows a path through shadow, Solas turns light onto a pillar, Gaoth drives an air platform. Mechanisms (a counterweight lift that lowers a bridge, a sluice, pressure plates in sequence), hidden architecture (a sliding wall, a rotating chamber, a stair under the floor), quiet tells (a draught, an echo, an object out of place) and wordless stories (an explorer's last camp, a barricade). A puzzle of the sigil script costs what reading costs (§3.1), never a free cipher." This page also answers his line in section J about wanting "spells that change how you move through the world".

## Today

`gateThings` (`52-dungeon-gen.js`) lays braziers at every threshold and the ring's dais, a web across the mouth of one side room in three, and a pool in one in four. `lairBrush` chokes one lair passage in three. `touchThing` (`64-spells.js`) lets Caor light a brazier and burn a web, Sioc freeze a pool, and Loscadh fire the brush. The web and the brush do hide part of a floor, but a lit brazier only gives light, and a frozen pool leads nowhere. The laid forms (`layWord`: Cloch's pillar, Séideán's updraft) are built to the step table, but nothing in a gate is placed for them. The only thing saved about a gate is `worldState.gatesWalked`, and every visit rebuilds it from its seed. The canon's Weavers forbade *reading*: "touching is permitted; understanding is not." Reading at Mastery costs an Old Blood player Cold (`worldState.cold`), and the Mages' Guild pays in readings (`worldState.register.readings`, spent by `readWord`).

## Three rules, every direction

- **The way on never needs a word.** §7 keeps Mastery on a gate's last floor, and a warrior with no magic must be able to reach every carving. A key opens a secret, a side room or a shortcut, never the way to the carving.
- **Every secret has a tell.** Skyrim's claw doors, with the answer printed on the claw, are the free cipher. Elden Ring's illusory walls, found by striking every wall, are the opposite failure.
- **Seeded, keyed, kept.** Each secret's place and kind come from the gate's seed, with the id `<seed>:<floor>:<index>`. Once opened it stays open, and once taken it stays taken. Without that, a gate rebuilt from its seed would hand out the same reward on every visit. The record is a new world key, `worldState.gateSecrets` (`{seed:{o:[…],t:[…]}}`), which goes on the S242 list and not in `SS_CHAR_WS`.

## A. The things wired: one key a school

**The loop.** A lesser gate has one side room whose sealed way in you can see. If you hold the word, you open it. If not, you come back once the gate's own carving has taught you the word. Inside are the gate's things, by Michael's choice on #1092: a crystal vein, a broken relic, and a chest one tier above the gate (a rich chest for the 1-in-20 implement roll).

| School | The seal | The key |
|---|---|---|
| Tine | a stone leaf between two cold braziers | Caor touched on both within 20 s (the play clock) |
| Uisce | a room of water with the chest on a far ledge | Sioc touched freezes it, as built |
| Cloch | a doorway choked by one fallen block | Cloch laid under it lifts it 1.2 m for the pillar's 20 s |
| Scáth | a wall darker than its neighbours | worn Oíche shows a doorway, which you can walk through while the word is worn |
| Solas | a pale pillar with a crystal face | Solas laid within 3 m for 3 s lights its script, and a niche turns open |
| Gaoth | a gallery 3.8 m up with no stair | Séideán's updraft rises 2.2 m, which reaches the ledge (the step table's 3.4 to 3.8 m band) |

**How many.** One in a small or medium gate and two in a large one. The first uses the gate's own school.

**Cost.** Three systems sessions: the seal kind and its save, the six keys, and the reward with a suite. One look session for five props. No new panel.

**What it lacks.** There are no mechanisms, tells or stories. Every secret is a door you can see.

## B. A, plus mechanisms, hidden architecture and the script (recommended)

**The loop.** Gates become places you read. A torch flame leans in still air. Footsteps ring hollow on one slab. One stone is a shade off its neighbours. A fighter opens most of these with a lever, the miner's pick or patience. A word opens them faster, and the script needs a reading.

| Secret | Tell | Opened by |
|---|---|---|
| Sliding wall | a draught within 4 m | E on the stone that is out of place; in a large gate one is a **shortcut back** to the entry, opened from the far side |
| Stair under the floor | the footstep turns hollow within 2 m | Cloch laid lifts the slab, or the pick for 20 s, which alerts the floor |
| Counterweight lift | a chain into the dark, a pan on the floor | a lever wound for 6 s, or Séideán sent at the vane in 1 s; it gives a second way across a chasm |
| Sluice | a side bay standing at 0.8 m of water, with a wheel | the wheel for 8 s, or Tonn laid on the gate; the water drains over 10 s |
| Rotating chamber | a ring of floor stones laid in a different course | Solas laid on its pillar, or the plates; the chamber turns 90° to face a room that had no door |
| Plates in sequence | four plates, one already sunk, the order carved above them | the script (below); behind them a sealed cache with the gate's best roll |

**The script costs what reading costs:**

| Way | Cost | Why |
|---|---|---|
| Read it | one banked reading | the guild's price for understanding: a word you could have learned |
| Read it as Old Blood | +1 Cold, by choice | §3.3: reading takes warmth. It is the Weavers' law, priced by the canon |
| Try it | each wrong order fires the plates' dart for 12% of your health; with one plate sunk, 6 orders remain | death costs a reload, so trying is a real way through, paid in blood |

**The wordless stories.** One gate in three holds an earlier delver: a cold camp at a threshold, or the body of #1092's C with a journal. The journal names a tell in the delver's own words ("the air moves in the chapel; I could not find from where") and never says where it is. One gate in four has a barricade of planks that `doBash` breaks, with what it held off behind it. The words are the quest writer's: twelve journal lines and six barricade scenes, picked by the seed.

**How many.** Small 1, medium 2, large 3, massive 4. A's seals count among them, and at least half need no word. A fighter finds most of what a gate hides, and a mage finds all of it. The great gates' own mechanisms, such as the vault's turning rings, belong to the great-gates work.

**Code.** `gateThings` gets the new kinds and their tells. `gateThingsBuild` (`56`) draws them. `TOUCH_THING`, `layWord` and the worn tick find a seal in reach. `tickFootsteps` (`78`) adds the hollow sound. The plates reuse the traps in `68-dungeon-misc.js`. The named actions are `openSecret`, `pullLever`, `pressPlate` and `readScript`. Every timing runs on the play clock, and the shortest is the 20 s brazier pair, well above the co-op floor of 150 ms. F5's generator is untouched: a gate is a tree of side rooms, so every secret is a side room or a cell, and the one shortcut is cut the way `gateBlock` cuts its U.

**Cost.** Six systems sessions: A's three, then the wall, stair and tells, then the lift and sluice, then the plates and script. Two look sessions and one quest-writer run. One suite, `gatesecrets`: seeds give the same secrets on every build; each key opens its seal and the wrong word does not; an opened secret and its taken chest survive a reload; no secret lies on the path from the entry to the carving.

## C. B, plus the gate as a machine

Each lesser gate's way on passes through one mechanism of its school. A Tine stair hall sits behind a heated door, and an Uisce hall must be drained before its far threshold opens. The mundane way round is a lever two rooms off, with an extra pocket of foes and 30 s of winding. This is the Zelda dungeon. It costs B's sessions plus a deep-work session on the generator, because the labyrinth and cave-network layouts have no single choke point to put a mechanism on. It also bends rule one: every gate taxes the fighter, so magic stops being a reward and becomes a rebate.

## Recommendation

**B.** It builds all of OG-122 without making the way on depend on a word, so the canon's carvings stay reachable and every character can finish a gate. It gives the brief's second feeling something the game lacks: a gate worth coming back to once you hold the word it taught, as Morrowind's Levitate made old dungeons new. The script is priced exactly as §3.1 prices it: a reading, Cold for the Old Blood, or blood for everyone else. A is the cheap half of B, and C spends a deep-work session to tax the fighter.

## What must be true first

Magic B's Touched, Laid and Worn forms, `touchThing`, `gateThings`, F5's spaces and the readings are all on main. #1092's delver (C) is the camp's body. One gap: readings stop being earned once you hold all 24 words, so a player who has every word reads the script by Cold or by trial.

## Not asked

- **A Perception skill to show tells.** The book's 22 skills have none, and a tell shown by a skill turns into a detect spell. The brief wants the player to notice for themselves.
- **Lockpicking a seal, or Dul Thart's step through one.** A seal is a word's door. The lock is already its own system, and the step would make Scáth the key to everything.
- **Secrets in forts, lairs and tombs.** Those are F8's places (OG-121). The kinds would carry over once they have been played in a gate.
- **The legacy zones.** 1.0 is frozen.
