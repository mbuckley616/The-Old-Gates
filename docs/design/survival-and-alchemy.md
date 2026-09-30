# Survival skills and alchemy

*The systems designer, 30 Sep 2026. A proposal, not a spec: nothing here is built until docs/decisions.md carries a `Michael:` line under it.*

## The problem in Michael's words
> "Survival skills: mining, woodcutting, cooking; finish alchemy as a skill (never completed)." (backlog J)
>
> "Survival skills (mining, woodcutting, cooking, alchemy) as part of the progression." (design brief, *Keep the door open for*)

The brief also says what they must not become: *buy more/better*, or *a punishing Souls-like*. The skills decision (Michael's A) holds five names on the land row: Alchemy, Cooking, Mining, Woodcutting, Joinery. This page says what each does.

## Today
Alchemy is half built. `HERB_DEF` holds 23 land herbs and `ensureSeaHerbs` three sea ones; `spawnChunkHerbs` puts 8–16 in each 64-unit chunk by biome, `harvestHerb` bags one and leaves the picked stub (your A of Session 237), and it regrows after `respawn`. Eating a herb (`useHerb`) gives its known effect: heal (7 herbs), mana (7), stamina (5), regeneration (3) or damage (Briarweed). After 15 eats `HERB_CONSUME_COUNTS` reveals a hidden effect, and each of the 21 hidden effects is different (Firemoss +10% melee, Veilwort vanish, Coldmoss block…). Nothing combines herbs. Cooking is shop stock: Hot Stew and Mulled Cider are `type:'potion'`. Mining and woodcutting do not exist: `ore_pile` is scenery, the one smelter is a dungeon room's prop, trees cannot be cut. There are no skills in the build yet (`lvAct` still feeds the attributes).

The canon gives alchemy its rule already (lore §*Consumables and the register system*): raw herbs are the deep register, folk tinctures the common one, the apothecaries' elixirs the institutional. "The folk version is stronger at peak… but less shelf-stable." Whatever the player brews is folk work.

## Directions

All three use the skill curve from the skills page (a level costs 0.9 × L^1.2 uses; ×0.64 at skill 5, ×1.0 at 50, ×1.4 at 100) and its automatic perks at 25/50/75/100.

### A. The still and the fire — each skill feeds a system that exists
**The loop.** You pick as you travel (each pick is an Alchemy use). At an apothecary's bench, the Mages' Guild, or anywhere with a mortar (40 gold, weight 1) you grind two herbs into a tincture: the first gives its **known** effect, the second its **hidden** one, which you must already know. Silverleaf with Firemoss is 30 stamina and +10% melee for a minute; Deepmoss with Veilwort a regeneration that also hides you. It is the magic page's grammar again: a body and a rider. At any fire you cook what you killed or bought into a meal: one *fed* effect at a time, long and mild. With a pick you break ore from veins; with an axe you fell a tree for logs. You don't make gear: the smith tempers your weapon with the ore; logs feed a campfire and the shipwright's repairs.

**Rules.**

| Skill | A use | What it makes | Perks (automatic) |
|---|---|---|---|
| Alchemy | a pick 1; a brew 8; a pair brewed the first time 25 | tinctures: strength and length × the skill curve × (1 + 1% an Intelligence point) | 25 *Tell*: a hidden effect after 5 eats, not 15 · 50 *Third hand*: a third herb, a second rider · 75 *Stoppered*: tinctures don't turn · 100 *Double measure*: two from one grinding |
| Cooking | a meal 6 | *fed* for 2 game-hours × the curve: Hearty (+15% stamina), Steady (+1 HP every 5 s), Clear (+10% mana regeneration), by the main ingredient | 25 two portions · 50 *Shared pot*: everyone at the fire is fed (co-op) · 75 *fed* lasts through sleep · 100 a herb seasoning adds its known effect at a third |
| Mining | a strike 1; an ore 4 | iron anywhere in rock; silver at 25; mithril at 50 in the highlands; La Grise's magnetic ore at 75 | 25 *Prospector*: veins on the minimap within 40 units · 50 one ore in four comes double · 75 the magnetic ore |
| Woodcutting | a strike 1; a log 4 | 2–4 logs a tree; a stump that regrows in 10 game-days | 25 a trunk falls the way you face and lies, walkable, for 10 minutes: a bridge over a stream or gap · 50 one more log · 75 heartwood from the great trees, for masts |

The reasons. A tincture **turns** after 5 game-days (half strength): the canon's "less shelf-stable" as a rule, so the shop's elixirs stay the reliable thing for a long dungeon and your brews are for the road. A tincture sells for 40% of the nearest elixir's price, so alchemy is never the money-printer it was in Oblivion and Skyrim. Brewing needs no failure roll; the skill sets strength, as Oblivion Remastered does. A vein holds 3 ore and returns in 7 game-days; a strike lands every 0.9 s and breaks an ore at 35% + 0.5% a Mining point, about ten seconds a vein at 25. Ore weighs 2 and a log 3 against `maxCarry`'s 50 + 5 a Might point: a haul is a choice. The smith's temper takes 3 ore of the weapon's own metal and 20 gold × tier, +8% damage, up to three tempers; it is the one place ore buys power, and the metal must be dug, not bought. An alchemist who picks 60 herbs and brews 20 tinctures an hour makes about 220 uses, so Alchemy climbs 15 → 50 in about nine and a half hours, the weapons' pace on the skills page. No hunger: *fed* is a gift, never a debt.

**Touches.** `HERB_DEF` and `useHerb` (a tincture is a herb-type item carrying two effects), `_applyBuff`/`_stackBuffs` (a tincture and an elixir of the same effect keep the stronger, as now), `HERB_CONSUME_COUNTS`, a brewing page and a cooking page on the parchment kit in the hub, the bench as an interaction in `potion` shops and `guild_m`, veins spawned per chunk by the dice as `spawnChunkHerbs` does, a felled-tree set per chunk (a new `worldState` key, so it goes on the S242 list in `_applyLoadData`), the smith's dialogue for tempering, Hot Stew and Mulled Cider moved from `potion` to meals in the shop tables, `WORLD.guild.onHarvest` (gather tasks can ask for ore and logs), and `skillUse` from the skills build.
**Conflicts.** Magic B's Slán mends too; tinctures heal slowly or a little, so healing spells and potions stay distinct. The lying trunk is a new walkable solid on the world grid, the one real engineering risk here.
**Cost.** Four Opus sessions: brewing and tinctures; cooking and fires; mining and tempering; woodcutting, stumps and the trunk.

### B. Gather, work, make — RuneScape's chain
**The loop.** A plus two making skills. Ore is smelted to ingots at a forge (the town smith's for 5 gold, or a dungeon's smelter), and **Smithing** makes weapons and armour, their tier gated by the skill (Iron 15, Steel 30, Mithril 45 … Cosmic 100, the gates the skills page gave `reqCheck`). **Joinery** makes bows, staves, shields and arrows, and later ship parts. At equal skill a made item matches the best shop stock of its tier; with perks it passes loot by one quality step.
**Conflicts.** Every chest, shop and quest reward loses its point once the forge makes the best sword; the loot tables and prices need retuning across all tiers. RuneScape carries the chain because the chain is the game; Skyrim's smithing, alchemy and enchanting fed each other and broke its balance. It turns *buy more/better* into *grind more/better*.
**Cost.** One Fable session (materials and recipes across every item, the forge page, loot and prices retuned) plus A's four and two more Opus sessions: seven.

### C. Survival in earnest — a body that needs things
**The loop.** A, plus needs. Hunger falls from 100 to 0 over 12 game-hours and below 25 halves stamina regeneration; the tundra and highlands at night drain a warmth bar that fire, furs and meals restore; a day without sleep slows you. The survival skills matter because the body asks for them.
**Conflicts.** The brief: not punishing, one tuned difficulty, an evening of one to three hours. Skyrim made this an opt-in mode because most players did not want it; fixed difficulty leaves no opt-in. A long dungeon becomes a food count.
**Cost.** A's four and two more Opus sessions: six.

## Recommendation
**A.** Every one of the five skills lands in a system that already exists or is already decided: tinctures in the buff stack, meals at the fires the camps and inns already have, ore at the smith, logs at the campfire and the shipwright, the felled trunk in the platforming to come. It reads the canon's registers as written (the folk brew strong and short-lived beside the elixir), and its brewing shares magic's body-and-rider grammar, so the game has one way of making things. B spends its seven sessions making loot pointless; C adds upkeep the brief rules out. Nothing in A closes B: if a forge for the player is wanted later, the ore is already dug.

## What must be true first
- **The skills build** (Michael's A on skills and perks): `skillUse`, the skills table and the automatic perks. Nothing here lands before it.
- **The sailing proposal** (next in the order) decides Joinery and what timber and heartwood repair; A only digs and cuts.
- **The quest writer** names the tinctures in the common register, the meals, and what La Grise's magnetic ore is for (the canon says only that it is strange).
- The stump follows your A on the picked herbs (Session 237): a felled tree stays visible where you cut it.

## Not asked
Hunger, warmth and fatigue (C, and the brief). Player smithing and joinery of gear (B). Fishing, farming, a herb garden, a house. Enchanting (magic's). Skinning and leather. Brews that fail. A third effect per herb: the 21 hidden ones are riders enough.
