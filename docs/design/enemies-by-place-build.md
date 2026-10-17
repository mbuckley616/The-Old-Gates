# Enemies by place — the build sheet

*The designer, 17 Oct 2026. Fourth in the build-sheet queue. It turns Michael's A on DECISION #373 into what the systems builder types in. The design is not re-asked. One number a player would feel is left open, at the foot.*

## What Michael chose

> **Michael: A danger tier per region, plus the dungeon floor.** (16 Oct 2026, on the control room; decisions.md, DECISION #373)

Option A as asked: Home's regions are authored. The coast, Ashen, Bealach and Royale are tier 1. Deepwood, the Foothills and Greywood are tier 2. The Wastes are tier 3. The far islands take a tier from their biome: tundra, swamp and wasteland are 3, the rest 2. Each dungeon floor below the first adds one, to a cap of 4. A tier is worth what the level curve gives today at levels 1, 6, 11 and 16. A gate's school does not change its tier. Behind it are #51 (C, "not yet", 29 Sep), lifted when skills landed, and the skills sheet's promise (`skills-and-perks-build.md`): levelling by alchemy is never punished, "because enemies scale by place". Combat's resolver, which rewrites the same two functions, merged on 16 Oct (`60d74230`), so nothing waits.

## Today

Six things read your level when a foe is made:

1. `enemyHpScale()` (`74-strikes.js`) gives 1 + 0.15 a level, capped at ×3 from level 14. `enemyDmgScale()` gives `blowRef(level)/blowRef(1)`, the resolver's reference blow. Both are applied in `buildZoneEnemy` (`42-zone-enemies.js`), in the dungeon's `spawnFloorEnemies` (`56-dungeon-build.js`) and in the lair master's line in `68-dungeon-misc.js`.
2. `pickVariant(name, level, grade, rnd)` gates *Greater* at level 5 and *Frost* and *Shadow* at 10 (with a hard grade). Above the gate, each level adds 15% to the chance, to 50%.
3. Each kind's `minLevel` keeps a wild foe *latent*: hidden, never ticked and never hit until you reach it (`tickZoneEnemies`). The dungeon's theme roster is filtered the same way.
4. In the chunk spawn (`82-world-structures.js`), a pack grows by one past level 6, and a Bandit or Highwayman pack gets a Captain past level 5. The caravan ambush (`87-world-quests.js`) has the same Captain rule.
5. `levelDiffKey()` (`20-quests.js`) grades every dungeon door by your level: very easy at 1–2, easy at 3–5, normal at 6–9, hard at 10–14, very hard from 15. A lair adds one grade and a wyrm two. The grade sets health, blow and pace (`DIFF_SCALE`), and the variants' `minDiff`.
6. `rollLoot()` (`14-items.js`) caps the material at 1 + 0.4 × level + 1.2 × the grade's health.

Which kinds a place fields is already set by place: `ENC` by Home's region, `ENC_BIOME` by the far islands' biome, `NIGHT_EXTRA` by climate. This sheet keeps those tables.

## The numbers

### The tier of a place

| Place | Tier | Why |
|---|---|---|
| Coastal, Ashen, Bealach, Royale | 1 | The start (Ashenmoor), the road country and the capital: where the first evenings are spent |
| Deepwood, Foothills, Greywood | 2 | Trolls, bears and ogres are on their tables already |
| The Wastes | 3 | Ash Hounds and the Hollowed, the canon's burnt country |
| Far islands: tundra, swamp, wasteland | 3 | Dragons, Frost Trolls, Marsh Hags and Ash Wights stand on these tables |
| Far islands: every other biome | 2 | A sea voyage is the gate to them; nothing out there is a beginner's coast |
| At sea, sharks and other ships' crews | the nearest land's, else 2 | The search `lairBiome` already does, out to three cells |
| A town's guards | 3, everywhere | Morrowind's precedent: the law outclasses a new character, and a late one can defy it |
| Legacy zones, until the purge | Ashenmoor, Hearthwick, Bealach South, Ironhaven 1; the Deepwood zone 2; placeholder zones 1 | The home region each one stands for |

**One place, one answer.** `placeTier(x, z)` reads the dominant region of the cell and its eight neighbours through `getCell`, the way `lairBiome` does, and never reads `REGIONS` (the loaded set). CLAUDE.md records that 6 of 14 lairs near the start changed biome with load order (S701). Where two regions meet, the line is hard: the tier is the dominant region's. A pack takes its tier at its anchor, so one pack never straddles two tiers. A foe keeps its tier for life (`e.tier`), so a wolf that chases you over a border does not change.

### What a tier is worth

| Tier | Its level | Health | Blow (`blowRef` ÷ `blowRef(1)`) | Open-world loot cap | Dungeon grade |
|---|---|---|---|---|---|
| 1 | 1 | ×1.00 | ×1.00 | Bronze (2) | very easy |
| 2 | 6 | ×1.75 | ×2.09 | Steel (4) | normal |
| 3 | 11 | ×2.50 | ×3.99 | Adamant (6) | hard |
| 4 | 16 | ×3.00 | ×7.47 | — (dungeons only) | very hard |

The health and blow columns are today's curves read at the tier's level, as Michael's A says. The blow is the resolver's reference blow at that level, so a tier's ordinary blow lands at the resolver's sixth of the health of a character of the tier's level in that level's kit. The grade is `levelDiffKey` read at the tier's level, so a dungeon at tier *n* keeps the grade a character of that level meets in it today. The lair's +1 and the wyrm's +2 stand, as #230 A says. The loot column applies only if the open number goes A.

**What it feels like.** This is the share of your health that one ordinary blow takes, in the reference kit for your level, with the blows to fall in brackets:

| Your level | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---|---|---|---|
| 1 | 17% (6) | 35% (3) | 68% (2) | 127% (1) |
| 6 | 8% (13) | 17% (6) | 32% (4) | 61% (2) |
| 10 | 5% (23) | 9% (11) | 18% (6) | 34% (3) |
| 16 | 2% (44) | 5% (22) | 9% (12) | 17% (6) |
| 25 | 1% (113) | 2% (54) | 4% (29) | 7% (15) |

Under skills B, level 10 comes at about 7 hours and 25 at about 45. On the diagonal, tier *n* at its own level, every fight is the resolver's six blows. Below the diagonal you outgrow a place, as you outgrow Seyda Neen's mudcrabs in Morrowind. Above it, the Wastes kill a first-evening character in two blows, which is Elden Ring's Caelid. A late character outgrows everything by about level 25, since the cap is 4. That is the price of Michael's A. Tier 4 at level 25 still takes 15 blows, so the deep floors stay worth a fight.

### The floor

Floor 2 adds one tier to health and blow, to a cap of 4. It replaces today's ×1.5 health, ×1.5 blow and ×1.1 pace on floor 2 (`fm` in `68-dungeon-misc.js`, `dmgMult` in `spawnFloorEnemies`), which would otherwise count twice. The **grade stays the door's**: pace, the variants' `minDiff` and the loot's grade are read once, at the door. If the floor also raised the grade, floor 2 of a tier-1 crypt would jump ×3.9 in health over floor 1 (1.75 × 1.0 against 1 × 0.45). With the grade kept, it rises ×1.75 and its blow ×2.09, a step above today's ×1.5 that a player feels on the stair. No generator plan has a third floor (`floors` is at most 2 in `52-dungeon-gen.js`), so the cap of 4 is reached only by floor 2 below a tier-3 door, by a lair, or by a wyrm.

### The rest of the level's reach, retired

| Rule today | Under tiers | Reason |
|---|---|---|
| `pickVariant`'s level | the tier's level (1, 6, 11, 16): Greater 0%, 11.5%, 19%, 26.5% | The same ramp, read off the place |
| Latent kinds (`minLevel`) | Gone. A kind needs a minimum tier: `minLevel` 1–3 is tier 1, 4–6 is tier 2, 7 and up is tier 3. The tables are filtered *before* the pick | Every Home table passes as written. The filter only takes the warm night's Cultist out of a tier-1 place, and keeps Wraiths, Gargoyles and Mimics out of a tier-1 dungeon, as they are kept from a level-1 character today. No foe is ever hidden on the field |
| Pack +1 past level 6 | at tier 2 and up | A wild place has bigger packs |
| Captain past level 5 (packs, caravans) | at tier 2 and up | The same |
| Guild commissions (`'hard'`, ×1.6 health) | the place's tier; its variant grade is one above the place's; the ×1.6 stays | It is a named quarry, harder than the country around it |
| Raids, road quests, the rival's duel | the tier where they stand | — |
| The tutorial gate's ×0.5 | stays, at tier 1 | It is the first fight |
| Map and *Anything dangerous nearby?* | A door's grade shows again on the map's subtitle. The townsfolk's line grades the country by tier (quest writer's words, four lines per people) | Session 64 took the grades off the map because they followed you. Fixed grades are worth reading again |

No `level` is read anywhere in a foe's making once this lands. That is the co-op rule: two friends of levels 4 and 22 meet the same wolf.

## What it touches

- **Functions.** New: `placeTier(x, z)`, in the world files beside `lairBiome` (`87-world-quests.js`, or `81-world-cells.js` if the builder wants it nearer `getCell`), and `TIER_LEVEL = [1, 6, 11, 16]` in `74-strikes.js`. Each gets a grep of `js/` before naming (CLAUDE.md). Changed: `enemyHpScale(tier)` and `enemyDmgScale(tier)` take the tier; `pickVariant` takes the tier's level; `levelDiffKey(up)` becomes `tierDiffKey(tier, up)`, and `makePortalDef`'s `diff` and `diffScale` getters read the door's tier; `buildZoneEnemy` takes the tier in `zOpts` (default: `placeTier` at x, z); the chunk spawn, `spawnFloorEnemies`, the lair master's line, the caravans, commissions, raids, the sea's crews and the guards (`86-world-crime.js`). The `minLevel` lock goes from `buildZoneEnemy` and `tickZoneEnemies`; `unlockFoe` stays as a no-op for callers. `rollLoot` takes the tier if the open number goes A.
- **Save.** Nothing. The tier is derived from the place every time, so there is no `worldState` key, nothing for the S242 list, nothing for `SS_CHAR_WS`. Foes are not saved. A save made before the change loads, and its next spawn is by place.
- **Panels.** The map's door subtitle (the grade's label and colour from `DIFF_SCALE`) and the dialogue line. No new panel.
- **Legacy zones** take the table's tiers until the purge. Nothing new is built for them.

## The suites

| Suite | Sets up | Measures | Passes when |
|---|---|---|---|
| `tiertable` | `placeTier` at each Home region's centre and at one far-island spot of each biome | the tier | it matches the first table, every row |
| `tierborder` | a spot 20 m inside Deepwood's edge, read with only its cell loaded, then with all nine | the tier | the same both times |
| `tierscale` | a Wolf built at tiers 1–4 | health and blow scale | 18, 32, 45, 54 health; blow ×1.00, 2.09, 3.99, 7.47 (±0.01) |
| `tierlevelfree` | one chunk's spawn and one dungeon floor, same seed, at level 1 and level 30 | every foe's kind, variant, health, blow, count, Captain | identical. This is the sheet's main line |
| `tierfloor` | a tier-1, a tier-3 and a tier-4 door | floor 2's tier and grade | 2, 4, 4; the grade the door's; no ×1.5 left |
| `tiervariant` | 10,000 seeded Greater rolls per tier | the rate | 0, 11.5, 19, 26.5% (±1) |
| `tierkinds` | a level-1 character in the Wastes at night | latent foes; table entries | no foe `locked`; every pack visible and ticking |
| `tiergrade` | a tier-1 crypt, a tier-2 lair, a tier-1 wyrm's cavern | the grade | very easy, hard, normal; the map shows the label |
| `tierguard` | a guard in Ashenmoor and one on a far island | the tier | 3 and 3 |
| `tiermainpath` | the main quest's first-act destinations | the tier of each | all tier 1 or 2. A failure goes to the producer as a list; the quest stays where it is |

## Sessions

Two Opus sessions for the systems builder, then one for the quest writer:
1. `placeTier`, the tier table, the scales, the floor, the grade and its map label, variants, and the kinds filter with the latent lock retired. Suites: `tiertable`, `tierborder`, `tierscale`, `tierfloor`, `tiervariant`, `tierkinds`, `tiergrade`.
2. Packs, Captains, commissions, raids, caravans, the sea, guards and loot (per the open number). Suites: `tierlevelfree`, `tierguard`, `tiermainpath`, `tierloot`.
3. The quest writer: the four danger lines for *Anything dangerous nearby?* in each people's voice. The second session ships a plain placeholder line until then.

No FREEZE is needed. The files are systems files (`74`, `42`, `56`, `68`, `20`, `82`, `86`, `87`), and the look builder's F8 work in `52` and `56` is prototype-only today.

## The open number: does the loot follow the place?

Today the loot's material follows your level (`rollLoot`: 1 + 0.4 × level + 1.2 × the grade). If the foes follow the place and the loot does not, a level-25 character finds Cosmic swords on tier-1 wolves. That is Oblivion's bandit in glass armour, the failure this sheet exists to end. It also breaks the co-op rule: one chest gives two friends different things.

- **A. By place** *(recommended)*: the cap reads the tier's level instead of yours. The open world gives Bronze at tier 1, Steel at 2 and Adamant at 3. Obsidian and above come only from tier-3 and tier-4 dungeons, lairs and hoards (a tier-4 floor's very hard grade reaches Cosmic). A character who stays on the coast tops out at Bronze from drops, and the smith and the shops are the way up.
- **B. By level, as today.** Where you go does not change what you find.
- **C. By place, with a floor of your level less two materials**: a level-25 character finds at least Obsidian everywhere. It softens A late, and keeps half of Oblivion's problem.

Recommendation: **A.** It is Morrowind's and Elden Ring's answer: the good things are somewhere, and you go there for them. That is the brief's "challenging, rewarding progression" and "a world that pushes back", and it is the only option under which one chest is one roll for everyone in a shared world.
