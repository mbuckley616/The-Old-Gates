# Enemies by place — the build sheet

*The designer, 17 Oct 2026. Fourth in the build-sheet queue. The design is Michael's A on DECISION #373, and it is not re-asked. The systems builder built its core overnight (Sessions 1034 and 1036, on PR #353, not yet on main). So this sheet records what that build fixed, and settles every place where a foe or a dungeon still reads your level. One number a player would feel is left open, at the foot.*

## What Michael chose

> **Michael: A danger tier per region, plus the dungeon floor.** (16 Oct 2026, on the control room; decisions.md, DECISION #373)

Option A as asked: Home's regions are authored. The coast, Ashen, Bealach and Royale are tier 1. Deepwood, the Foothills and Greywood are tier 2. The Wastes are tier 3. The far islands take a tier from their biome: tundra, swamp and wasteland are 3, the rest 2. Each dungeon floor below the first adds one, to a cap of 4. A tier is worth what the level curve gives today at levels 1, 6, 11 and 16. A gate's school does not change its tier. Behind it are #51 (C, "not yet", 29 Sep), lifted when skills landed, and the skills sheet's promise: levelling by alchemy is never punished, "because enemies scale by place".

## Today

**Built on `auto/systems` (S1034, S1036), and kept as it is:**
- `REGION_TIER`, `BIOME_TIER` and `LEGACY_ZONE_REGION` hold the table. `worldTierAt(x, z)` reads the dominant region of the cell and its neighbours through `getCell`, never the live `REGIONS`, so the answer does not change with load order (the S701 lesson).
- `zoneTier(id)` gives a legacy zone's tier, and `dungeonTier(portal, floor)` gives the door's tier plus one a floor, to 4. `foeTier` and `tierHere` find the tier where a foe is made.
- `tierLevel(t)` reads `DANGER_LV = [1, 6, 11, 16]`. `enemyHpScale(tier)` and `enemyDmgScale(tier)` take the tier. `pickVariant` takes the tier's level. The lair master, a wraith's orb and drain, and a pirate's volley read the tier's level (`foeTierLevel`).
- The suite is `dangertier`, 14 of 14.

A wolf has 18 health and a blow of 5 on the coast, and 45 and 20 in the Wastes, at level 1 or level 20.

**Still reading your level** on that branch:

| Where | What | File |
|---|---|---|
| The dungeon's grade | `levelDiffKey`: very easy at levels 1–2, easy 3–5, normal 6–9, hard 10–14, very hard from 15. Lair +1, wyrm +2. It sets health, blow and pace (`DIFF_SCALE`), the variants' `minDiff`, and the loot's grade | `20-quests.js` |
| Floor 2 | ×1.5 health and blow, ×1.1 pace (`fm`, `dmgMult`) on top of the tier's +1. The builder flagged that it steps twice | `56`, `68` |
| Latent kinds | `minLevel` hides a wild foe until you reach it; the dungeon's roster is filtered by `minLevel ≤ level` | `42`, `56` |
| Packs | +1 member past level 6; a Captain past level 5 (chunks, caravans), past level 4 (bandit camps) | `82`, `87` |
| Traps | spike 8–15 + 0.8 × level; blade 10 + 1.2 × level | `68` |
| A wyrm's fire | 18 + 1.4 × level | `68` |
| A lair's hoard | gold (60 + 25 × level) × 1.8, or ×3 for a wyrm | `68` |
| Loot | material cap 1 + 0.4 × level + 1.2 × the grade's health | `14-items.js` |

## The numbers

### What a tier is worth (built; kept)

| Tier | Its level | Health | Blow (`blowRef` ÷ `blowRef(1)`) | Dungeon grade (settled here) |
|---|---|---|---|---|
| 1 | 1 | ×1.00 | ×1.00 | very easy |
| 2 | 6 | ×1.75 | ×2.09 | normal |
| 3 | 11 | ×2.50 | ×3.99 | hard |
| 4 | 16 | ×3.00 | ×7.47 | very hard |

**What it feels like.** This is the share of your health that one ordinary blow takes, in the resolver's reference kit for your level. The blows to fall are in brackets.

| Your level | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---|---|---|---|
| 1 | 17% (6) | 35% (3) | 68% (2) | 127% (1) |
| 6 | 8% (13) | 17% (6) | 32% (4) | 61% (2) |
| 10 | 5% (23) | 9% (11) | 18% (6) | 34% (3) |
| 16 | 2% (44) | 5% (22) | 9% (12) | 17% (6) |
| 25 | 1% (113) | 2% (54) | 4% (29) | 7% (15) |

Under skills B, level 10 comes at about 7 hours and level 25 at about 45. On the diagonal, tier *n* at its own level, every fight is the resolver's six blows. Below it you outgrow a place, as you outgrow Seyda Neen's mudcrabs. Above it, the Wastes kill a first-evening character in two blows, which is Elden Ring's Caelid. Because the cap is 4, a late character outgrows everything around level 25. That is the price of A, and it is Morrowind's. A tier-4 floor still takes 15 blows at level 25.

### The grade: the tier's level, read once at the door

`levelDiffKey(up)` becomes `tierDiffKey(tier, up)`, which is the same ladder read at `tierLevel(tier)`. A tier-1 door is very easy, tier 2 normal, tier 3 hard and tier 4 very hard. The lair's +1 and the wyrm's +2 stand (#230 A). Each grade is what a character of the tier's level meets at that door today, so the numbers Michael has played are kept.

The grade is the **door's**, read at `dungeonTier(portal, 1)`, and it does not change on floor 2. If it did, floor 2 of a tier-1 crypt would jump ×3.9 in health over floor 1 (1.75 × 1.0 against 1 × 0.45). With the door's grade, floor 2 rises by the tier's step alone: ×1.75 health and ×2.09 blow, a little above today's ×1.5, which you feel on the stair.

**Floor 2's ×1.5, ×1.5 and ×1.1 go** (`fm` in `68-dungeon-misc.js`, `dmgMult` in `spawnFloorEnemies`). The tier's +1 is the floor's step, and now it is the only one. This answers the systems builder's flag of S1036.

### The rest of the level's reach, retired

| Rule today | Under tiers | Reason |
|---|---|---|
| Latent kinds (`minLevel`) | Gone. A kind's minimum tier is 1 for `minLevel` 1–3, 2 for 4–6, and 3 for 7 and up. The table is filtered *before* the pick, out in the open and in the dungeon's roster | Every Home table passes as written. The filter takes only the warm night's Cultist out of a tier-1 place, and keeps Wraiths, Gargoyles and Mimics out of a tier-1 dungeon, as they are kept from a level-1 character today. No foe is ever hidden on the field |
| Pack +1 past level 6 | at tier 2 and up | A wilder place has bigger packs |
| Captain past level 5 (or 4 at a camp) | at tier 2 and up, every path | One rule, not three |
| Guild commissions (`'hard'`, ×1.6 health) | the place's tier; the variant's grade one above the place's; the ×1.6 stays | It is a named quarry, harder than the country around it |
| A town's guards | tier 3 in every town | Morrowind's precedent: the law outclasses a new character, and a late one can defy it. A guard in Ashenmoor should not be a coast wolf's equal |
| Spike and blade traps | the level in each formula becomes `tierLevel` of the floor: a spike lands 8–15 on a tier-1 floor and 16–23 on a tier-3 floor | A trap is the place's, as its foes are |
| A wyrm's fire | 18 + 1.4 × the cavern's tier's level | The same |
| A hoard's gold, loot's material | with the open number | Both are what a place gives |
| The map and *Anything dangerous nearby?* | a door's grade label shows again on the map's subtitle; the townsfolk grade the country by tier (the quest writer's words, four lines for each people) | Session 64 took the grades off the map because they followed you. A fixed grade is worth reading |

Once these land, no `level` is read anywhere a foe, a trap or a dungeon is made. That is the co-op rule: two friends at levels 4 and 22 meet the same wolf.

## What it touches

- **Functions.** `levelDiffKey` → `tierDiffKey(tier, up)`, and `makePortalDef`'s `diff` and `diffScale` getters read `dungeonTier(entry, 1)`. `spawnFloorEnemies` and the lair master's line lose `fm` and the floor's `dmgMult`. The `minLevel` lock leaves `buildZoneEnemy` and `tickZoneEnemies`, and a `minTier(kind)` filter goes into the chunk spawn (`82`), the site's creatures (`87`) and the dungeon's roster (`56`). `unlockFoe` stays for its callers. The pack, Captain and commission rules (`82`, `87`), the guard (`86-world-crime.js`, `{tier: 3}` in `zOpts`), the traps and the fire (`68`), and `rollLoot` with the hoard (per the open number). Each new name is grepped across `js/` first (CLAUDE.md).
- **Save.** Nothing. The tier comes from the place every time: there is no `worldState` key, nothing for the S242 list, and nothing for `SS_CHAR_WS`. A save from before the change loads, and its next spawn is by place.
- **Panels.** The map's door subtitle and one dialogue line. No new panel.

## The suites

`dangertier` (built) keeps the table, the scales, the variant chance and the floor's tier. Added:

| Suite | Sets up | Measures | Passes when |
|---|---|---|---|
| `tiergrade` | a tier-1 crypt, a tier-2 lair, a tier-1 wyrm's cavern, at level 1 and 20 | the grade, both levels | very easy, hard, normal, the same at both; the map shows the label |
| `tierfloor` | a tier-1 door's two floors | a Skeleton's health, blow and pace on each | floor 2 is ×1.75, ×2.09 and ×1.0 of floor 1 (±0.01); no ×1.5 left |
| `tierkinds` | a level-1 character in the Wastes at night; a tier-1 dungeon roster | latent foes; the roster | no foe `locked`, every pack visible and ticking; no Wraith, Gargoyle or Mimic on the tier-1 roster |
| `tierpack` | one chunk's spawn and one bandit camp at tier 1 and tier 2, each at level 1 and 30 | count and Captain | +1 and the Captain only at tier 2, the same at both levels |
| `tierguard` | a guard in Ashenmoor and one on a far island | the tier | 3 and 3 |
| `tiertrap` | a spike trap on a tier-1 floor and on a tier-3 floor, each at level 1 and 30 | its damage before armour, by seed | 8–15 and 16–23, the same at both levels |
| `tierlevelfree` | one chunk, one dungeon floor, one lair and one commission, same seed, at level 1 and level 30 | every foe's kind, variant, health, blow; the count; the traps; the hoard | identical. This is the sheet's main line |
| `tiermainpath` | the main quest's first-act destinations | the tier of each | all tier 1 or 2. A failure goes to the producer as a list; the quest stays where it is |
| `tierloot` | 2,000 seeded chest rolls at each tier, at level 1 and 30 | the highest material | per the open number |

## Sessions

One Opus session for the systems builder, then the quest writer's lines:
1. The grade, the floor, the kinds filter, packs, Captains, commissions, guards, traps, the fire, the hoard and loot (per the open number), and the map's label. Suites: the eight above. A plain placeholder line stands in for the dialogue until the quest writer's are in.
2. The quest writer: four danger lines for *Anything dangerous nearby?* in each people's voice.

No FREEZE is needed. The files are systems files, and it rides PR #353 behind S1034.

## The open number: does the loot follow the place?

Today the loot's material follows your level (`rollLoot`). If the foes follow the place and the loot does not, a level-25 character finds Cosmic swords on tier-1 wolves. That is Oblivion's bandit in glass armour, which this sheet exists to end. It also breaks the co-op rule, since one chest gives two friends different things.

- **A. By place** *(recommended)*: the cap reads the tier's level instead of yours, and so does a hoard's gold. The open world gives Bronze at tier 1, Steel at 2 and Adamant at 3. Obsidian and above come only from tier-3 and tier-4 dungeons, lairs and hoards; a tier-4 floor's very hard grade reaches Cosmic. A character who stays on the coast tops out at Bronze from drops, and the smith and the shops are the way up.
- **B. By level, as today.** Where you go does not change what you find.
- **C. By place, never more than two materials below your level's cap**: a level-25 character finds at least Obsidian everywhere. It softens A late but keeps half of Oblivion's problem.

Recommendation: **A.** It is Morrowind's and Elden Ring's answer: the good things are somewhere, and you go there for them. That is the brief's "a world that pushes back", and it is the only option under which one chest is one roll for everyone in a shared world.
