# Camp and rest: beds by grade, a bedroll you carry, a night in the open

*The systems designer, 10 Nov 2026. A proposal: nothing here is a spec until `docs/decisions.md` carries a `Michael:` line under it.*

## The problem in Michael's words

Backlog L8, *Camp and rest* (systems; OG-023): "lean-to, tent, bedrolls of three grades, better beds giving stronger rest." The same line's second half, climate, has its build sheet (`climate-build.md`) and is built (Sessions 1917, 1918, 1934). This page is the first half. Its neighbour, *The adventurer's kit* (OG-098), lists "a bedroll and a tent (rest anywhere, and safely outdoors)"; this page takes those two things from it and leaves the rest of the kit to its own page.

## Today

You sleep only at a bed: a rented inn room (5 to 25 gold, `innPrice`), your own house, a guild's bed, a fort's cot (`fortCotNear`), your ship's berth (`berthNear`), or a roadside camp's bedroll, one every 260 m or so of road (`buildCampsFor`). Each opens the same rest slip (`openRestSlip`, `60-shop.js`). Six hours fill health, mana and stamina, fewer fill a share (`restPreview`); sleep takes a banked level (`takeLevelIfReady`) and autosaves. Health has no regeneration of its own (`90-main.js`), so the bed is how you heal. Every bed does the same thing, nothing you carry lets you sleep, and no night carries a risk. The kit already draws a lean-to, tents and a bedroll for the camps (`38-kit.js`); the campfire, logs and the climate grade (`climateGrade`) are built.

## Directions

### A. Beds by grade

**The loop.** You sleep where you sleep today. Each bed has a comfort, and a good night leaves you *Rested* for a while afterwards. The inn and your own house now give you something the camp's bedroll does not.

**The rules.** Comfort by bed: a roadside camp's bedroll 1, a fort's cot 1, your ship's berth 3, an inn room 4, a guild bed 4, your own bed 5. Six hours or more of sleep gives the state in the table below. Fewer hours heal a share, as today, and give no state.

| Comfort | State | Skill gain | Stamina regeneration | Lasts (real minutes, = game hours) |
|---|---|---|---|---|
| 0 to 1 | slept | ×1.00 | ×1.00 | — |
| 2 to 3 | *Rested* | ×1.10 | ×1.00 | 45 |
| 4 to 5 | *Well rested* | ×1.15 | ×1.10 | 90 |

Skyrim's Rested is +10% skill progression and its Lover's Comfort +15%. Valheim's Rested lasts 8 minutes plus one a point of comfort; a session here is one to three hours with a bed about once an hour, so 45 and 90 minutes cover the stretch to the next one. The gain is on skill use (feeling 2), never damage, so no bed makes you stronger in a fight than the place you are in.

**Touches.** `restAtBed`, `restSlipDraw` (one line: *Inn room · comfort 4 · Well rested for 90 minutes*), `bedInteract` (the bed's owner gives its comfort), `skillUse` (a multiplier beside `xpBoost`), the stamina line in `90-main.js`. One new key, `worldState.rested` (`{until, k}`), is the character's: it goes in `SS_CHAR_WS` and on the S242 list.

**Displaces.** Nothing. **Cost:** one ordinary systems session.

### B. A bedroll you carry, shelter you make, a night in the open *(recommended)*

**The loop.** A's beds, and you can sleep anywhere in the open. You choose a bedroll for its comfort and weight, pitch a tent or cut a lean-to, light a fire before it, and read the land: the cold, and how dangerous the place is. A good camp is as good as your own bed; a bad one heals you badly or gets you woken by something hungry.

**The rules.** You need a bedroll to sleep in the open (E on it in the bag: *Lay out your bedroll*), then the rest slip opens as it does at a bed. Your comfort for the night is your bed, plus your shelter, plus a fire, minus the cold or heat.

| Thing | Comfort | Weight | Price | Where |
|---|---|---|---|---|
| Blanket roll | 1 | 1.5 kg | 8 | any general store |
| Wool bedroll | 2 | 2.5 kg | 25 | general stores, tailors |
| The island's own roll | 3 | 3.5 kg | 70 | its own island's towns only |
| Lean-to | +1 | — (3 logs) | — | cut where you stand, with a hatchet; left standing until the cell unloads |
| Tent | +1, and the cold or heat one grade less | 4 kg | 45 | general stores |
| A lit fire within 4 m | +1 | — | — | `campfireNear` (a lean-to with a fire before it also takes one grade off the cold) |
| Climate grade where you lie | −1 a grade | | | `climateGrade`, read with your protection |

The island's roll is where the grades meet climate: the Gatelands' quilted plaid roll, the Mark's fur sleeping sack (Warmth +1 asleep), Aurenne's linen hammock (Cool +1, 2 kg). A camp at its best (roll 3, roof 1, fire 1) is comfort 5, your own bed's, for 7.5 kg carried and logs burned: the house wins on ease, the camp on reach. A roadside camp is its bedroll 1 and its tents +1: a free *Rested* every 260 m of road, so the road stays the easy way.

**A bad night.** At comfort below 0 (a blanket roll in a Mark blizzard, grade 3: 1 − 3 = −2), you wake having healed only half of what the hours would have healed, with the climate's ceiling still on your stamina. That is the climate rule's consequence, met once, and it is why the island's roll exists.

**The open has a risk.** A night outside a camp, a town's pad, a building or your ship rolls once, on a stream keyed by the cell and the game day (the co-op rule: a friend in the same world gets the same night).

| Danger tier where you lie | Woken | With a fire |
|---|---|---|
| 1 (the coast, Ashen, Bealach, Royale) | never | never |
| 2 | 1 in 10 | 1 in 20 |
| 3 | 1 in 5 | 1 in 10 |
| 4 | 1 in 3 | 1 in 6 |

Woken, at a seeded hour, one group from the place's table (enemies by place, `worldTierAt`) arrives at 25 m; you keep what the hours slept gave you, and no *Rested*. Morrowind's *rest interrupted* is the precedent. Tier 1 never rolls, so the pleasant country stays pleasant (the tone line); the wastes push back.

**Skills.** Cutting a lean-to is a Woodcutting use (`skillUse('woodcutting')`), as felling is. Nothing rises from sleeping itself, because a skill that rose from lying down would reward pressing a key.

**Touches.** A's, plus `useItem` (the bedroll), `makeItem` and the general stores' `SHOP_STOCK` (three rolls and the tent), `lightFire` and `campfireNear`, `climateGrade` (protection while asleep), `wildSpawnChunk`'s tables for the night's foes, `restSlipDraw` (the night's sum shown before you sleep: *Wool bedroll 2 · tent +1 · fire +1 · Bitter −1 = 3: Rested*, and *Tier 3: 1 in 10 you are woken*). The lean-to and the pitched tent are not saved: they stand while the cell is loaded, so there is no world key and no id to give. `worldState.rested` is A's.

**Displaces.** The adventurer's kit's bedroll and tent, settled here. **Cost:** three ordinary systems sessions (A's grades and *Rested*; the bedroll, tent, lean-to and the night's sum; the night's roll and the waking), one look session (the three island rolls and their tent, from the camp props the kit already draws), and a few lines for the rest slip and the shopkeepers from the quest writer.

### C. B, and the camp as a place you keep

**The loop.** B, and a pitched tent stays where you left it: it goes on the map, the map's fast travel reaches it, and it holds a 20 kg stash. When co-op comes, friends share its comfort.

**The rules.** One camp at a time. It has a world key, `<cell>:camp`, saved in the world row. Striking it returns the tent. A camp left in a tier-3 or tier-4 cell is found and robbed one night in ten.

**Displaces.** The house: a camp that stores and travels is a free house anywhere, and fast travel to any field undoes the road. **Cost:** B's, plus two systems sessions and one look.

## Recommendation

**B.** It builds all of the note, and each piece is a trade, not an upgrade: the island's roll costs weight, the tent gold and weight, the lean-to and fire logs and a hatchet. The best camp only equals your own bed, so the house, the inn and the road keep their places and nothing reduces to *buy better*. It puts the climate rule and the danger tiers to work where you lie down, a decision with a consequence you can see (feeling 1), and its reward is skill gain (feeling 2), never a fight's numbers. A leaves the bedroll and tent unbuilt; C makes a camp a house.

## What must be true first

- The climate build (done), the campfire and logs (survival B, done) and the danger tiers (`worldTierAt`, enemies by place, built).
- A host's sleep in co-op (all players lie down before the clock jumps, as in Valheim) is the online page's to settle when co-op is built. Nothing here blocks it: *Rested* is the character's, and the night's roll is keyed by place and day.

## Not asked

- **A fatigue clock** (sleep or suffer, as in Fallout New Vegas's hardcore mode). Michael chose B on water, a draught with no thirst meter, on 8 Nov. A tiredness meter is the same tax on every evening.
- **Pack capacity and the rest of the kit** (rope, shovel, sextant, the island variants): *The adventurer's kit*'s page.
- **Dreams.** What a sleeper sees is the canon's and the quest writer's, not a system's.
- **Beds you furnish in your house** (a better bed bought for a home): L9's *Homes as rooms*. Your own bed is 5 here and has nowhere further to rise.
- **Health regenerating on its own.** A rest system leans on the bed being how you heal. Changing that is a combat question, not a camping one.
