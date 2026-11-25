# The sea that pushes back: the build sheet

The systems designer, 25 Nov 2026. The numbers for Michael's B on #1925, for the systems builder, the look builder and the quest
writer. The design is decided; this page settles the numbers the proposal left loose and raises one, the serpent's speed.

## What Michael chose

> **A, plus the sea serpent** (B). (2026-11-24)

The page is `docs/design/the-sea-that-pushes-back.md`: tidal races in the narrow straits, reefs off the headlands, and a serpent that
rises in open water. It is backlog L11's *At sea* (OG-135), the sea's half of *Ground that pushes back* (#1800 A).

## Today

The sea is flat. `seaState(x,z)` (`86-world-crime.js`) is the weather's 0 to 2 plus one in `openWater` (a bed under −7.9 m with no land
within 150 m), capped at 3, and `tickSeaWear` costs hull and rig from it. The sailing tick (`85-world-sea.js`) probes ahead of her bow:
a bed shallower than 1.4 m, or a `wonder` solid by `hullStoneAhead`, stops her, and over 2 m/s she loses (v − 2) × 4 hull through
`shipWear`. The navigator draws beds under `SHOAL_D` (2 m). `isTideOut()` (`50-travel.js`) is a boolean in 6-hour blocks.

Three facts from the code change the page's arithmetic:
- **The clock runs one game minute a real second** (`gameTimeMinutes += dt`). A tide's six hours are six real minutes. Slack water is never
  more than three minutes off. The
  page's "never twice within 20 game minutes" was 20 real seconds; it is corrected below to 20 game hours.
- **Bare speeds are the floor, not the ship.** `SHIP_CLASSES` gives the sloop 7.5, the cog 8.5, the galleon 9.5, the caravel 11 and
  the cutter 12; each sail tier adds 12% of bare (`SAIL_TIERS`, four tiers, 2,500 gold in all), so full sails make 11.1, 12.6, 14.1,
  16.3 and 17.8. The page's 9 m/s serpent is outrun by a sloop with two tiers of sail. That is the open number.
- **The serpent has a body.** The bodies builder put `SWIMMER['Sea Serpent']` in the game in Session 2626 (22 m, 19 bones, 7,256
  triangles, on the gate eel's slither). The page's bodies session is done.

A ballista bolt is `BALLISTA.hull` 10 to a ship's hull, every 6 s, in ±30° of her bow out to 90 m. The figurehead table is
`SHIP_HEADS` (five found, `skull` already the Beast's Skull).

## The numbers

### The races

| Number | Value | Why |
|---|---|---|
| Where | a strait between two landmasses (`landMasses()`) whose narrowest water is under 700 m | the page's width.. Corryvreckan, 1 km across, runs 4 m/s |
| How found | once per seed, after `routeWorld`: for each pair of masses with cells within two of each other, sea samples on a 100 m grid over the cells between them, eight rays each to 400 m; a sample with land within the ray pairs on opposite sides is in the gap. The narrowest line is the race's throat | cheap, and the coast's own shape decides it, not the 2,400 m cell |
| If a seed finds few | under three races, the width steps to 1,000 m, then 1,400 m, until it has three | every world gets some; the suite reports the count |
| Its shape | a band along the channel's axis, 2 × the throat's width long, centred on it; full set in the middle half, falling linearly to 0 at the ends and to 60% within 50 m of either shore | the taper makes the edge a line to choose, not a wall |
| Peak set | 2.5 m/s at a throat of 300 m or less, falling linearly to 1.5 at 700 m (1.0 at 1,400) | a third of a bare sloop; a wide strait runs slower |
| By the hour | set × sin(π × (h mod 6) / 6), flooding one way in `isTideOut`'s blocks and ebbing the other: slack at 00, 06, 12, 18, strongest at 03, 09, 15, 21 | the page's clock, on the tide the ferry already reads |
| On a ship | the set added to her drift each tick, never to her speed over the water: `SHIP.speed` and the log dial stay the water's | the log dial stays the hull's truth |
| The race's sea | `seaState` +1 inside a race at over 1.5 m/s (still capped at 3) | the canon's strait "too rough for the boat at high tide", on the wear there is |
| A swimmer | carried at the full set | `swimSpeed` is 1.7 to 4.2: an unskilled swimmer crosses only near slack, an Athletics 100 swimmer across the set |

### The reefs

| Number | Value | Why |
|---|---|---|
| Where | one coastal chunk in six that is a headland (land on three or fewer of eight rays of 300 m from the chunk's sea edge), by `hash01` keyed on the chunk | the page's one in six; headlands are where reefs are and where a player cuts the corner |
| What | 3 to 7 rocks over 20 to 40 m, 60 to 400 m off the point, heads 0.6 to 1.2 m under the surface | under her 1.4 m probe; over a swimmer's footing |
| Grounding | a reef rock is a hull stone (a `reef` flag `hullStoneAt` reads beside `wonder`): the rule as it is, (v − 2) × 4 hull | the price already charged; no second rule |
| Held fast | on a reef she cannot sail ahead; S held 3 s at half astern backs her off | the page's; a reef costs time as well as hull |
| A swimmer | stands on a rock's head | a rest in a crossing |
| Seen | breakers when `seaState` ≥ 1 and the reef's paler water by day: drawn to 120 m in clear or overcast, 40 m at night or in rain, not at all in fog | night and fog are the danger; at 7.5 m/s 40 m is five seconds |
| Wrecks | `wreckSpot` reads the reef first: a reef's chunk holds a wreck one time in three | the tell a diver learns |

### The serpent

| Number | Value | Why |
|---|---|---|
| Where it rises | only where `openWater` holds, never within 300 m of a port, never while a black sail is within `PIRATE_REACH` (140 m) or you are boarding or boarded | it needs depth, and it must not stack on the sea fight that exists |
| Where it follows | any bed deeper than 4 m; at the 4 m line it turns along it | the shallows and the reefs are shelter |
| The roll | once per open-water chunk entered, from a seeded stream keyed `serpent:<cx,cz>:<day>:<hour>`, 1 in 250; ×2 at `seaState` 3; ×3 within 1,500 m of an Uisce gate on the coast; ×0.5 with its skull at her bow | 47 chunks in a 3,000 m crossing give about one crossing in six. The key includes the day and hour, so circling a chunk does not reroll it (co-op rules) |
| Rest | never within 20 game hours (20 real minutes) of its last rise | the page meant an evening's rhythm; 20 game minutes was 20 seconds |
| A rise | up for 60 s, then down 90 s; if she is still in open water within 600 m of where it dove, it rises once more; after the second dive it is gone | an event of two to three minutes, not a siege |
| The tell | the water humps for 2.5 s; the strike lands in a 9 m circle round the point her centre would reach 1.0 s into the tell on her course | far over the 150 ms floor. A ship holding her course at over 6 m/s is clear (1.5 s × 6 = 9 m), the page's rule; a hard turn or a stop inside the tell clears it too |
| How often | a tell every 10 s while it is within 25 m of her | six in a surfacing: 90 hull if she dodges none, so a bare sloop at full hull lives through one rise she reads badly, never two |
| The strike | 15 hull through `shipWear` | seven sink the sloop |
| The coil | if it reaches her beam while she makes under 3 m/s: held 6 s, speed 0, 3 rig a second; broken by any one hit of 30 or more to its head | sitting still is the mistake |
| Health | 400; a ballista bolt 40, a fire bolt 40 × 1.5; an arrow or a spell its own damage at the head while up; Tine ×1.5, Uisce ×0.5 | ten bolts, a minute at the 6 s reload, the pirate sloop's measure |
| Driven off | at 200 it dives for good and leaves one Serpent Scale floating for 60 s | about 30 s of fire: the common win |
| Slain | three scales and the Serpent's Skull | the rare win |
| The scale | an ingredient, weight 0.5, 120 gold; its four effects Water Breathing, Resist Cold, Fortify Block and Slow, found by brewing (survival B) | the sea's, the cold deep's, a hide's and a poison's, from the pool there is |
| The skull | a sixth found figurehead, `serpent`, *the Serpent's Skull*: the serpent's roll ×0.5 | a choice: the slot is one, and it competes with the Bell's and the Stone's |
| Its target | `targetOf(e)`, which gives your ship solo | co-op rules |

## What it touches

- **`81-world-cells.js`**: the race finder after `routeWorld`, its output on `WORLD.routed.races`. The world's, from the seed; nothing saved.
- **`85-world-sea.js`**: the drift in the sailing tick, held fast and backing off, `hullStoneAt`'s `reef`, the reef rocks per chunk,
  `wreckSpot`, the serpent's tick beside `tickOtherShips` with its body from `SWIMMER['Sea Serpent']`, `shipBallistaTick` laying on its head.
- **`86-world-crime.js`**: `seaState`'s +1, `SHIP_HEADS.serpent`, the shoal map's set arrows (with the navigator aboard).
- **The swim tick** (`90-main.js`' movement while `WORLD.isSwimming()`): the drift on `px/pz`.
- **`worldState`**: no new key. The skull rides `worldState.ship.heads` (the world's, as now); the scale and the skull in the bag and
  `herbsKnown` (the character's); two counts, `stats.serpentsDriven` and `stats.serpentsSlain`, in `stats` (the character's,
  already in `SS_CHAR_WS`). Nothing goes on the S242 list.
- **Named actions**: the strike goes through `shipWear`, hits on its head through `damageFoe`; the roll is a seeded stream.
- **UI**: two log lines and the navigator's arrows; the scale in `50-travel.js`' herb table.
- **The quest writer**: three lines of quay talk about the serpent and one about the race, in the dialog pools (`83-world-generator.js`).

## The suites

Three, each booting the world once.
- **`searace`**: on the default seed, the finder's races (at least three, each throat under its threshold); her drift at 03:00 and
  09:00 in a race's middle within 5% of the peak and opposite in sign; under 0.05 m/s at 06:00; `seaState` +1 in it on a clear day;
  a swimmer at the peak carried 2.5 m in a second of no input.
- **`seareef`**: a reef chunk found by the hash; a sloop driven at 6 m/s onto a rock loses 16 hull and cannot go ahead; 3 s astern
  frees her; a swimmer stands on a head; `wreckSpot` on a reef chunk; the shoal map's pixel over a rock is shoal.
- **`serpent`**: the roll over 10,000 keys at 1 in 250 (±15%), ×2 and ×3 where they apply, none inside 140 m of a black sail; a tell
  then a strike on a still ship costs 15, a ship at 7 m/s on her course costs 0; the coil at 2 m/s holds 6 s and costs 18 rig; ten
  bolts to kill, five to drive off; it will not cross 4 m; the skull halves the roll. Driven by `g.spin()`, never a timeout.

## Sessions

| # | Who | What | Suite |
|---|---|---|---|
| 1 | systems | the race finder, the set by the clock, her drift, a swimmer's, `seaState` +1 | `searace` |
| 2 | systems | reefs: headlands, rocks as hull stones, held fast, backing off, the wreck | `seareef` |
| 3 | look | breakers and pale water on the reefs at the sight distances; the race's surface streaked by its set | `seareef` +1 (drawn at 120 m, not at 130) |
| 4 | systems | the serpent's roll, rise, tell, strike, speed, dives and its shallows | `serpent` |
| 5 | systems | the coil, its health, the ballista, arrows and spells at its head | `serpent` + |
| 6 | systems | driven off and slain, the scale, the skull, the counts; the navigator's set arrows | `serpent` +, `searace` + |
| 7 | quest writer | the quay's four lines and the two log lines | none |

Sessions 1, 2 and 4 need nothing of each other. A look builder's check that no race crosses
the Gate Isles' or the Drowned Spires' landings rides session 3: it moves the landing, not the race.

## The open number: the serpent's speed

The page set it at 9 m/s to be outrun by the cutter alone, but sails make every hull faster than that: a sloop runs from it with
700 gold of sail. Its speed decides whether running is the answer or one answer among three (the shallows, the ballista).

| Its speed | Who runs from it |
|---|---|
| **A.** 9 m/s, as the page | the sloop with two tiers of sail, the cog with one, every other hull bare |
| **B.** 11 m/s *(recommended)* | the cutter bare; the caravel with one tier; the galleon with two, the cog with three, the sloop only with all four |
| **C.** 13 m/s | the cutter and caravel with a tier or two, the galleon with four; the sloop and cog never |

**Recommendation: B.** At 9 the serpent is a toll paid once, until the first refit; after that it can never catch you, which is
*buy better* in the brief's words. At 11 the page's intent holds (the fast hulls run, the bare sloop reads the tell or finds the
shallows), and running is earned with the full investment in sail, not the first. C makes the two common hulls fight every rise,
which turns an event into a tax.
