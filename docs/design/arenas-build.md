# Arenas: the build sheet

*The systems designer, 31 Oct 2026. This sheet builds Michael's B on* Arenas in the Mark *(#914, 30 Oct 2026). It does not re-ask the design, and it leaves no number open: every value below comes from the proposal or is settled here, with the reason given.*

## What Michael chose

The page was `arenas.md`. He took the recommendation:

> "**A, plus the ring's ladder across the Mark** (B)." (2026-10-30, on the control room)

So there are two layers. A **training yard** behind every Markish Fighters' Guild hall, with spars and evening brawls. Over it, **one ladder of twelve bouts** across the Mark's rings, ending in the title at Caer Slige. The sellsword's hall (C) is out. Jora runs a yard (OG-089), and Red Finn's legend is that he was never beaten in the rings (OG-079). Both are the quest writer's to name and voice. The builders use placeholders until then.

## Today

- **The one bout in the game** is the Yard at Caer Slige (Session 373, `87-world-quests.js`). `DUEL` holds the ring's state. `duelBuild` lays a roped ring of `DUEL_R` 5 m from 6h to 12h. `duelStart` swaps Rowe the person for a keyed Bandit Captain (`keyFoe`, `unlockFoe`, `_duel`). `tickDuel` runs the fight: over the rope by 1 m is a loss, and at a quarter of her health she yields (`duelYield`). Unstruck for three seconds she is spared (`duelWon`). A blow after the yield is murder (`duelMurder`), except one begun within `DUEL_CHECK` 0.4 s, which is held (`duelCheck`, S408). `duelKill` in `killZoneEnemy` stops a kill from taking her below the quarter. `duelDown` in `playerDead` holds you at 1 health. Below 30% health she offers you the yield (`duelOffer`). The watchers' barks are `DUEL_BARKS`. All of this is one quest's code. Nothing else can call it.
- **Foes by place.** `foeTier` and `worldTierAt` read the region. `tierLevel` maps tiers 1 to 4 onto `DANGER_LV` levels 1, 6, 11 and 16. Health is `enemyHpScale` (×1, 1.75, 2.5, 3) and the blow is `enemyDmgScale` (×1, 2.09, 3.99, 7.47).
- **A humanoid's moves.** Every wind-up goes through `foeWindUp`: a heavy blow one in four (`foeHeavyRoll`, S1136), else a feint (`foeFeintRoll`, S1140). Both rolls are seeded on the foe's id. The parry window is `parryWindowS()`: 160 ms plus 1 ms per Guard level (S1047). Posture is `applyPostureDamage` on foes and `PPOST` on you.
- **Skills** rise only through `skillUse(id, weight)`. Hand-to-hand is `hand`.
- **Crime.** `seenCrime` charges `CRIME_PTS` (lock 1, theft 2, assault 3) in favour and 25 gold a point. A guard's death costs five favour (`86-world-crime.js`). `addFavor(site, n)` is the town's named action.
- **The guild hall.** `guild_f` stands in every generated town and city (`83-world-generator.js`). On the new look it is the kit's hall (`G.PLANS.guildhall`). Nothing stands behind it.

## The numbers

### The bout: one rule set for Rowe, the yard and the ladder

Session 1 lifts the ring's rules out of `DUEL` into one bout that takes a ring (centre, radius, hours) and a fighter. Rowe's quest then calls it with her own numbers. Her endings must come out byte-for-byte the same, and `duel`, `duelrhythm` and `yardplay` are the proof.

| Rule | Rowe | Yard brawl | Ladder | Why |
|---|---|---|---|---|
| Ring radius | 5 m | 5 m | **8 m** | The ladder allows bows and the spear's 2.4 m line. 8 m gives a bow three paces of range. |
| Over the rope | 1 m past = loss | same | same | Today's rule. |
| The fighter yields | ¼ health | ¼ | ¼ | Today's rule. |
| You are held at | 1 health | 1 | 1 | Today's rule. Death in a ring is never a reload. |
| The held blow | 0.4 s | 0.4 s | 0.4 s | Michael's B on #96. A swing already in the air is not murder. |
| Spared after | 3 s unstruck | 3 s | 3 s | Today's rule. |
| The yield offered to you | below 30% | below 30% | below 30% | Today's rule. Taking it is a loss. |
| A loss costs | 7 days | the stake | **the rest of the day** | Proposal B. Losing a ladder bout costs you a day and nothing else. |

### The yard (A)

| Rule | Value | Why |
|---|---|---|
| Where | behind each `guild_f` hall in a settlement whose people are `markman` | Proposal B. The Compact scorns duels (canon §1.3), and the Crown has none. |
| Spar hours | 8h–18h, the trainer present | Daylight. The brawl takes the evening. |
| A spar | first to **3 clean hits**. Both sides fight with a yard staff from the rack. Your kit is held at the rack and handed back after. | A clean hit is one that lands unblocked and unparried. |
| What a staff does | posture only, on both sides. **No health is lost.** A posture break counts as a clean hit. | It is safe to learn on, and the brief says *never punishing*. |
| The trainer's tier | the town's tier (`worldTierAt`) | A tier-3 town's trainer feints and swings heavy. |
| The calls | parried inside `parryWindowS()`: ***Good.*** Up to 0.15 s before the window: ***Early.*** Up to 0.15 s after it: ***Late.*** On a roll through a blow: ***Good roll.*** | This is the one place the game names its own timing. 0.15 s is the co-op floor (no window under 150 ms), so a call is never finer than a friend's latency. |
| Skill use | half the weight of a real fight, through `skillUse(id, w×0.5)` | Proposal A. A real fight teaches more, and the spar still pays. |
| A spar pays | nothing | You come for the lesson. |
| Brawl hours | 18h–22h | Proposal A. |
| A brawl | fists only. Your weapon is sheathed. The foe is a townsperson or off-duty soldier at the town's tier, with the humanoid row and its fists. The bout's rules apply in the 5 m ring. | |
| The stake | **50 gold a side** at tier 1, then **+50 a tier** (100, 150, 200) | Skyrim's brawl paid 100 at any level. Here the stake follows the town, the way the guild's tasks pay 60 + 50 a tier. |
| Brawls a night | one per town | It keeps the yard an evening's errand, not a mill. |
| A blow after a brawler yields | **assault** (3 points, as `CRIME_PTS`), not murder | Fists rarely kill. If the blow does kill, that is the ladder's murder below. |

### The ladder (B)

Where the rings stand: Caer Slige, plus every Markish settlement of kind `city`. If that makes fewer than four rings, add the largest Markish towns until there are four. Any ring gives you your next bout. The twelfth is fought only at Caer Slige.

| Bouts | Tier (level) | Health, blow | Moves | Purse |
|---|---|---|---|---|
| 1–3 | 1 (1) | ×1, ×1 | light blows only: heavy and feint off | 50, 60, 70 |
| 4–6 | 2 (6) | ×1.75, ×2.09 | the feint | 120, 140, 160 |
| 7–9 | 3 (11) | ×2.5, ×3.99 | the feint and the heavy | 250, 280, 310 |
| 10–11 | 4 (16) | ×3, ×7.47 | the feint and the heavy, with a shield on one of the two | 450, 500 |
| 12, the title | 4 (16), the champion | ×4.8, ×7.47 | the full row and a shield | 1,000 |

- **Moves by bout, not by kind.** Today every humanoid feints and swings heavy at every tier. A ring fighter carries a flag that turns the rows off for its bout, so the first three bouts teach the light blow alone. Each tier then adds one thing you can see. That is the progression test the proposal argued for.
- **Weapons.** Each fighter's weapon is rolled on its id, from sword, axe, mace, spear and dagger, with no two bouts running the same weapon. The spear is the Spear row (Michael's A on #755). The champion's ×4.8 is the named quarry's ×1.6 over tier 4, as the enemies sheet set it.
- **One bout a game day**, called on the hour from 9h to 17h. You speak to the ring master and the bout starts at the next hour. A loss or a win both use up the day. With a game day at 24 minutes, the ladder runs across two or three evenings of other play.
- **Not levelled.** At level 1, a tier-4 blow is 127% of your health. *Not yet* is the ring's answer.
- **No potions inside the rope.** Drinking a potion, eating a herb or a meal, or reading a scroll inside the rope forfeits the bout. A buff already running when the bout is called stays on. Words (spells) and bows are allowed. Checking buffs at the gate would punish the alchemy loop, and a 60 s fortify runs out mid-bout anyway.
- **The wager.** Before the call you may stake up to the purse on yourself. The odds are 1 + (the fighter's tier level − your level) ÷ 5, clamped from evens to **4 to 1**, and fixed when you place the stake. A win returns the stake × the odds. A loss keeps it. At level 4 against bout 7 the odds are 2.4 to 1. A stake is gold, never a chance at an item, so it stays clear of *buy more/better*.
- **The yield.** Spare a fighter and they salute and stay on the roster, and `addFavor(site, +1)`. A blow after the held 0.4 s is **murder**:
  - the crime system charges 5 points, as a guard's death does, so −5 favour and 125 gold;
  - the guard comes, as built;
  - every ring in the Mark shuts to you for **28 days**;
  - the fighter's name is cut into the ring's post.
  - The ladder does not stall: the bout's next fighter is a new id at the same tier.
- **The fixer.** From bout 4, one bout in three (`seededRng('fix', boutId)`, where the id is the bout and the day) has a bookmaker's man at the ring's gate. He offers **3 × the purse** to go down.
  - **Take it and lose:** you keep the bribe and your rank, and fight again tomorrow. One fix in four is found out (`seededRng('fixout', boutId)`, rolled at the bout's end): a fine of 2 × the bribe, the rings shut 28 days, League standing −1.
  - **Take it and win anyway:** the purse is yours, and two roughs at the ring's tier wait at the gate that dusk. It is a double-cross, and the bribe stays yours if you live.
  - **Report him to the ring master:** the next purse pays **×1.5**, and that ring has no fixer again.
- **The title.** Win bout 12 and the champion's name on every ring's post becomes yours. You also get Markish greetings at every yard and League standing +1. Every 28 game days a challenger (a fresh tier-4 fighter at ×4.8) is called at Caer Slige. Refuse three in a row, or lose one, and the title passes to the challenger. There is no discount and no gear, because the brief rules out *buy more/better*.
- **Occupied towns.** An occupied League town has no ring and no yard. That is canon §12a, and `tickDuel` already reads `TS(site).flags.occupied`.

## What it touches

| Piece | Where | Note |
|---|---|---|
| The bout | `87-world-quests.js`, beside `DUEL` | Rowe's quest becomes its first caller. `duelKill` and `duelDown` keep their hooks in `42-zone-enemies.js` and `68-dungeon-misc.js` and ask the bout instead. |
| The fighter's moves | `foeWindUp` in `74-strikes.js` | A flag on the foe turns the heavy and feint rolls off. The rolls stay seeded. |
| The staff's posture-only hit | `applyMeleeDamage` and the foe's strike | A yard flag routes damage to posture on both sides. |
| The calls | the parry and roll checks in `74-strikes.js` | Read from `playClockS`, never from frames (the dropped-frame rule). |
| Purse, stake, bribe | the gold path in `60-shop.js` | Each is one named action: `payPurse`, `placeStake`, `takeBribe`. |
| Murder, the fix found out | `seenCrime` and `noteCrime` in `86-world-crime.js` | A new kind, `murder`, at 5 points. |
| The yard and the ring | the look builder: the guild hall's back lot in `83-world-generator.js` and the kit | A staff rack, a 5 m rope ring, stands round an 8 m ring, the post with its names. |
| Fighters' bodies | F4's `hbFoeGenome`, keyed `foe:ring:<bout>:<n>` | The `<n>` counts replacements after a murder. |
| `worldState.arena` | **the character's**: add it to `SS_CHAR_WS` and the S242 list | Your rank, the day of your last bout, the ban's end, the open stake, the title and refusals, last night's brawl per town. |
| `worldState.rings` | **the world's**: add it to the S242 list | Per ring: the dead fighters' names, the reported fixer, the next fighter's `<n>`, and the champion's name if not yours. |
| UI | the journal's Factions page (`66-hub.js`) | One line: *The Mark's rings: bout 5 of 12*, or *Champion*. |

The co-op rules hold throughout. Every roll is seeded on a bout's id. Each change goes through a named action. The fighters target through `targetOf(e)`. No window is under 150 ms. With two players in the Mark, each has their own rank (the character's row) and both see the same dead names on the posts (the world's row).

## The suites

Basic tests (Michael, 20 Oct). There are two new suites, because a lost ladder or a broken murder rule would hurt to miss. The rest are checks folded into suites that already exist.

| Suite | Sets up | Measures | Passes when |
|---|---|---|---|
| `duel`, `duelrhythm`, `yardplay` (existing) | as today | Rowe's endings on the shared bout | unchanged and green. This is session 1's gate. |
| `ring` (new) | a Markish city and a forced bout 1 | the call on the hour, the 8 m rope, the yield at ¼, the hold at 1, a potion forfeit, the purse paid, the day used up, bout 4's feint flag on and bout 1's off, then `worldState.arena` and `rings` saved and reloaded | every value in the tables above, and the rank survives a reload |
| `ring` (cont.) | a fighter yielded and struck at 0.5 s | murder: −5 favour, the 28-day ban, the name on the post, a new id for the bout | all four |
| `yardplay` (extended) | a spar with a parry 0.1 s early | *Early.* called, posture lost, health unchanged | the call and the numbers |
| `ring` (cont.) | bout 4 on a seeded day with the fixer | 3 × the purse offered; reporting him gives a ×1.5 next purse | both |

## Sessions

| # | For | What |
|---|---|---|
| 1 | systems builder | The bout lifted out of `DUEL`, with Rowe on it. The yard's spar: staves, posture only, the calls, half-weight skill use. |
| 2 | look builder | The yard behind the hall, the 8 m ring with stands and the post, in the Mark's kit. This can run alongside session 1. |
| 3 | systems builder | The brawl and its stakes. The ladder's roster, the rings' sites, the call, the purses, moves by bout, the potion forfeit, the save. The `ring` suite. |
| 4 | systems builder | The wager, the yield's spare and murder, the ban, the names on the post, the fixer. |
| 5 | systems builder | The title, the challenger every 28 days, the journal's line, Markish greetings. |
| — | quest writer | Jora, Red Finn's legend, the ring masters' and fixers' lines, the watchers' barks. Placeholders until then. |

That is four ordinary sessions for the systems builder and one for the look builder, with no deep work and no freeze. Two dependencies are already met: combat B's feint and heavy (S1136, S1140) and F4's human foes (S1201).

## The open number

None. The proposal set the ladder's numbers and Michael took them whole. This sheet settles the rest: the brawl's stake by tier, a 5-point murder, the call's 0.15 s band and buffs carried in, each with its reason above.
