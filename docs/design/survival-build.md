# Survival B: the build sheet

*The systems designer, 27 Oct 2026. Builds Michael's B on* Survival skills and alchemy *(30 Sep 2026). It does not re-ask the design. One number a player would feel is left open, at the foot.*

## What Michael chose
The page was `survival-and-alchemy.md`. He took **B**, not the recommended A:

> "**B** — Alchemy should have 3-4 effects per harvestable item / herb, like elder scrolls. Unlocked on successful combinations. If we are going to have mining we will also need smithing / joinery. Woodcutting also has fletching for bows and arrows. I am envisioning a player sailing for a long while, and having to stop to cut wood to repair their ship, maybe to collect materials to make arrows / collect herbs and food."

The skills sheet (`skills-and-perks-build.md`) already gave the six land skills their attributes, their uses and their perks, and it put Smithing in as the 22nd skill. Sailing's A (`sailing.md`) already gave the plank, the spar, the pitch, the patch and the splice. This sheet fills in the rest: the four effects, the ore, the forge, the fire and the logs, and the order to build them.

## Today
- **Herbs.** `HERB_DEF` (`30-plants.js`) holds 23 land herbs and `ensureSeaHerbs` three sea ones, two effects each: the known one (`knownDesc`) from the first eat, the hidden one (`hiddenDesc`) after 15 eats (`HERB_CONSUME_COUNTS`, saved with the character). `harvestHerb` already calls `skillUse('alchemy',1,h)`; `useHerb` applies effects through `_applyBuff`. Nothing combines herbs, and the 21 hidden effects are all different, so no two herbs share one.
- **Skills.** The six land skills are in `SKILL_DEF` (`12-character.js`) and the archetypes' rows; nothing but a pick raises them, and `PERK_DEF` has no rows for them.
- **Making things.** Nothing can be made. `MATERIALS` (`14-items.js`) has ten metals gated by `SKILL_GATE`; a counter buys a piece back at 45% of `buyPrice`. Loot's metal is capped by the place (`lootLevel`, Michael's A on #394): Bronze in tier 1, Steel in 2, Adamant in 3, Draconic in 4; enchant chance 6.5% a tier past the first, to 55%.
- **Food and fire.** Hot Stew and Mulled Cider are `type:'potion'` shop stock. No campfires; the kit rooms' hearths are dressing. No veins, no felling. The ship's field patch is owed, waiting on this build.

## The numbers

### Herbs: four effects, found by brewing
Skyrim's rule, with the canon's folk register laid over it.

| Rule | Value | Why |
|---|---|---|
| Effects a herb | **4** | Michael said "3–4". Four is the Elder Scrolls count, and it gives 104 effect slots over 26 herbs, enough that each effect sits on 4–7 herbs. |
| The effect pool | **22 effects** (table below) | 104 ÷ 22 ≈ 4.7 herbs an effect. Every herb then pairs with at least four others, which keeps the search from running dry. |
| Learning by eating | 1st on the first eat (today), 2nd at 15 eats (today; *Tell* makes it 5) | This keeps what Session 237 built. |
| Learning by brewing | the 3rd and 4th, and any not yet known | This is Michael's "unlocked on successful combinations". |
| A brew | 2 herbs (3 from *Third hand*, Alchemy 50) | The brew carries **every effect that at least two of its herbs share**. |
| No shared effect | nothing is made, **the herbs are kept**, and the pair is marked *nothing between them* | Skyrim eats the herbs. The brief says *not punishing*, and the mark is information too. |
| Strength | base × the skill curve (×0.64 at 5, ×1.0 at 50, ×1.4 at 100) × (1 + 1% an Intelligence point) | This is the skills sheet's curve, and attributes stay at ≤1% a point. Restore Health base 20, so 13 at 5 and 28 at 100. A fortify lasts 60 s base. |
| Turning | after **5 game-days** a tincture works at half strength; *Stoppered* (75) prevents it | The canon says folk work is "stronger at peak, less shelf-stable". A shop's elixir stays the thing you take on a long dungeon. |
| Where | anywhere, with a **mortar** (40 gold, weight 1), from apothecaries and the Mages' Guild | Brewing on the road is the voyage Michael describes. |
| Sale | **40%** of the shop elixir with the same effect | Alchemy is never Oblivion's money printer. |
| Harmful brews | if a shared effect is harmful, the brew is a **poison**: it coats the blade for 3 blows | Otherwise the harmful effects would only be bad luck. This is Morrowind's and Skyrim's use for them. |

**The pool.** *Restoring:* Restore Health, Restore Stamina, Restore Mana, Regenerate Health, Regenerate Mana. *Fortifying:* Fortify Melee (+10%), Fortify Block, Fortify Bow, Fortify Carry (+20), Swiftness (+10% move), Quiet (sight on you −20%), Featherfall (falls free to 8 m). *Resisting:* Resist Cold, Resist Heat (both for climate B, Michael's 5 B), Cure Poison, Water Breathing, Night Eye. *Hidden:* Vanish (unseen 5 s while still; today this is Veilwort's). *Harmful:* Damage Health (today Briarweed's), Drain Stamina, Slow, Weaken (−25% posture).

**Assigning them.** Each herb's 1st effect is today's known one. Its 2nd is today's hidden one, renamed to the nearest pool effect (Firemoss's +10% melee becomes Fortify Melee). A hidden effect with no kin in the pool (Luibh Uisce's full mana, for one) stays the herb's own: it works when the herb is eaten and never brews. The 3rd and 4th are dealt out so that every effect sits on 4 to 7 herbs and no two herbs share more than two effects. The table is data in `HERB_DEF`. The builder writes it, and the suite proves the two counts.

**The pace.** A forager who picks 60 herbs and brews 20 tinctures an hour makes about 220 Alchemy uses (a pick 1, a brew 8, a new pairing 25). That climbs 15 → 50 in about nine and a half hours, the same pace the skills sheet set for weapons.

### Fire and food

| Rule | Value | Why |
|---|---|---|
| A campfire | 1 log, with a **tinderbox** (5 gold, never used up); burns 1 game-hour | Logs come from Woodcutting, so the fire ties the loop together. Hearths in inns, homes and the kit rooms count as fires. |
| A meal | 1 food (meat, fish or produce) at a fire; Cooking use 6 | |
| *Fed* | one at a time, 2 game-hours × the skill curve: **Hearty** (+15% stamina) from meat, **Steady** (+1 HP every 5 s) from fish, **Clear** (+10% mana regeneration) from produce | A gift, never a debt: there is no hunger (Michael passed over C). |
| Food | meat from a bear, a boar or a wolf (1–3 a body, seeded by the corpse's key); produce and fish from grocers and quays | There is no fishing yet (below). |
| At a fire, too | **charcoal**: 2 logs make 1 (for steel). **Pitch**: from a pine log, 3 (sailing's number) | |
| Hot Stew and Mulled Cider | become meals (Hearty, Clear) in the shop tables | |

### Ore and the forge
The place sets the metal you can dig, exactly as #394 set the metal you find. That is what keeps loot's point (below).

| Danger tier | Veins | Ingot you can make | Loot's cap there |
|---|---|---|---|
| 1 (home, coast) | copper and tin, iron 1 in 4 | Bronze; Iron | Bronze |
| 2 | iron, silver | Iron; **Steel** (2 iron ore + 1 charcoal) | Steel |
| 3 (highlands) | iron, mithril | Mithril | Adamant |
| 4 (wastes; Aurenne's volcanic south) | mithril, adamant, obsidian | Adamant, Obsidian | Draconic |
| — | Draconic, Demonic, Cosmic: no veins. One **rare material** for one piece: a dragon's scale from a dragon's lair, a sigil stone from a gate's ring chamber, star iron (L8's) | | |

| Rule | Value | Why |
|---|---|---|
| Veins | 2–5 a 64 m chunk in rock and on steep ground, by the dice as `spawnChunkHerbs` places herbs; each holds **3 ore** (*Seam*, 100: 5) and returns in **7 game-days** | About ten seconds a vein at Mining 25. |
| A strike | every 0.9 s with a **pick** (40 gold, weight 4); breaks an ore at 35% + 0.5% a Mining point; the roll is seeded by the vein's id and the strike's count | Co-op rule: an outcome roll comes from a keyed stream. |
| Weights | ore 2, ingot 1, log 3, plank 2, spar 6 | Against `maxCarry`'s 50 + 5 a Might point, a haul is a choice. |
| Smelting | 2 ore → 1 ingot (*Smelter*, 25: 3 → 2) at a forge: a smith's (5 gold a use), a dungeon's smelter, or the ship's workshop when it is built | |
| A piece | ingots by type: dagger 1, one-handed 2, two-handed 4, shield 3, helm 2, chest 5, legs 3, feet 2, hands 1; plus 1 plank for a grip or a haft; 30 game-minutes at the forge | |
| The gate | `SKILL_GATE`: Iron 15, Steel 30, Mithril 45, Adamant 55, Obsidian 65, Draconic 75, Demonic 90, Cosmic 100 | This is the skills sheet's, and it also gates wearing the piece. |
| A made piece | `makeItem` at its metal, **never enchanted**, flagged `made`, sold back at **20%** (not 45%) | Enchanting is magic's. The low resale stops a forge loop from printing gold, the way Skyrim's iron daggers did. |
| Quality | Plain; **Fine** +10% attack or defence (*Fine work*, 50); **Masterwork** +20% and a name, one a tier (*Masterwork*, 100) | This is the open number. |
| Tempering | at any forge: 3 ore of the piece's own metal, +8% each time, three tempers (*Temper*, 75: four); the smith does it for 20 gold × tier without the skill | A's temper carried into B, so a found sword can be kept up too. |

**Why loot keeps its point.** B's risk was that "every chest loses its point". Three rules hold it. First, the forge can't run ahead of the place, because the place caps the ore. Second, only a found piece carries an enchantment: up to 55% at the top tiers, against none for a made one. Third, the top three metals come one piece at a time from a boss's or a gate's material. Within a tier, a Fine made sword beats a plain found one by 10% and loses to any enchanted one. Nothing in the loot tables or prices needs a retune, so the Fable session that B's estimate carried is no longer needed.

### Logs, joinery and fletching

| Rule | Value | Why |
|---|---|---|
| A tree | a **hatchet** (30 gold, weight 3; a war axe works at half pace); a strike every 0.9 s, felled at the 6th strike −1 a 20 Woodcutting; **2–4 logs**, +1 at 100 | |
| The stump | stays where you cut, regrows in **10 game-days** | This follows Michael's A on picked herbs (S237): what you took stays visibly taken. |
| Pine, and the great trees | pine for pitch and spars; heartwood from a great tree at 75, for masts | Sailing's numbers. |
| Joinery at a bench (the cabin's, a carpenter's, or a joiner's kit, 25 gold) | a log → 2 planks; a pine log → 1 spar; a patch +8 + Joinery/5 hull in 8 s; a splice +20 rig; a field cap of 60% + 0.4% a level | `sailing.md` A, unchanged. |
| Bows and shields | a bow is 2 planks + 1 ingot for its fittings, and takes the ingot's metal; the longbow and the war bow need *Bowyer* (75); a wooden shield is 3 planks | Same gates and quality as the forge. |
| Fletching (Woodcutting) | 1 log + 10 feathers + 1 ingot → **10 arrows** of that metal (*Fletcher*, 50: 15); feathers 1 gold for 10 at a fletcher or hunter | A dozen arrows sell for 2 gold, so fletching saves little money. Its point is having arrows at sea and on a far coast. |

### Michael's voyage, worked
A sloop at Joinery 25 sails one evening down a far coast. Sailing's sheet puts the wear at three or four storms: about nine planks and nine pitch. Twenty-two weight of those leave port. By the third storm the carpenter's planks are gone. She is beached on a wooded shore. Three pines (about 40 s of strikes) give 9 logs: 12 planks from four of them, a fire from one, 6 pitch from two at the fire, and 10 arrows from the last, with the feathers she carried. A bear on the shore is supper, Hearty for the night. Twenty minutes ashore, and she is at 70 again. That is the loop he described, and every step of it is a skill use.

## What it touches
- **Functions.** `HERB_DEF`, `ensureSeaHerbs`, `useHerb`, `harvestHerb`; `_applyBuff` and `_stackBuffs` for the effects and *fed*; `makeItem` (the `made` flag and quality); `sellPrice` (20% for a made piece); `MATERIALS` (an ore and ingot per metal); `skillUse` for every use above; `PERK_DEF` and `PERK_LIVE` (the 24 land perks from the skills sheet); `scatterChunk` and `landTrees` for a felled tree; the chunk's dice for veins; `WORLD.guild.onHarvest` (gather tasks can ask for ore and logs); the shops' stock (the mortar, the pick, the hatchet, the tinderbox, feathers; Hot Stew and Mulled Cider become meals); `spawnShip`'s cabin for the bench.
- **`worldState`, by the co-op rules.**
  - `veins` (`<cx,cz>:<i>` → the day taken) and `felled` (`<cx,cz>:<i>` → the day felled) are **the world's**.
  - `herbsKnown` (each herb's four flags and the pairs marked) replaces nothing; it sits beside `HERB_CONSUME_COUNTS`. It is **the character's**: it goes into `SS_CHAR_WS`.
  - A tincture's `brewDay` and a piece's `made`, `quality` and `tempers` ride on the item in `BAG`, which is the character's already.
  - Every key goes on the S242 list in `_applyLoadData`.
- **Ids.** Veins and trees get the place-and-index keys above, the first of the things with no id that the co-op rules ask for. Ore and log rolls run on `seededRng('ore'|'log', key)`.
- **Panels** (parchment, Michael's A on the interface): a brewing page with the herbs' four rows (known, unknown, marked pairs); a cooking page at a fire; a forge page (smelt, make, temper); a bench page (planks, spar, patch, splice, bow, shield, arrows). These are four pages on one layout: a list on the left, the recipe and its gate on the right.

## The suites
| Suite | Sets up | Measures | Pass |
|---|---|---|---|
| `herbpool` | none | the `HERB_DEF` table | every herb has 4 effects; every pool effect is on 4–7 herbs; no two herbs share more than 2 |
| `brew` | Alchemy 5, then 50 and 100; two herbs that share one effect, a pair that shares none | the tincture's effects and strength; what became known; the herbs kept on no share | strength ×0.64 / ×1.0 / ×1.4 of base ±1; a no-share keeps both herbs; a turned tincture (day + 5) is at half |
| `cookfed` | a fire from a log; a bear's meat | *fed* kind and length; a second meal replaces the first | Hearty for 2 h × the curve; one *fed* at a time |
| `veins` | a tier-1 and a tier-3 chunk | the ores found; 3 ore then none; back after 7 days; the same ore at the same strike on a reload | the table's metals by tier; the seeded outcome repeats |
| `forge` | Smithing 14 and 15, iron ingots | an Iron sword refused, then made; its `made` flag and 20% sale; no enchant; a temper's +8% | the gate holds at 15; the sale is 20% of `buyPrice` |
| `felling` | a hatchet beside a tree | strikes to fell; logs; the stump; back in 10 days; saved across a reload | 2–4 logs; the stump stays after reload |
| `fieldpatch` | a sloop at 40 hull, 2 planks and 2 pitch, Joinery 25 | the hull after two patches; the cap | 40 + 13 + 13 = 66; never above 60% + 10 at the field cap |
| `fletch` | a log, 10 feathers, an iron ingot | arrows made | 10 Iron arrows (15 with *Fletcher*) |

## Sessions
Seven, in this order. Each one lands on its own and is worth having alone.
1. **Herbs and brewing** (systems, Opus): the pool, the four effects, `herbsKnown`, the mortar, the brewing page, turning, poisons. `herbpool`, `brew`.
2. **Fires and meals** (systems, Opus): the tinderbox and campfire, hearths as fires, *fed*, charcoal and pitch, the shop's meals. `cookfed`.
3. **Veins and ore** (systems, Opus): veins by the dice, the pick, the seeded break, `veins` saved. `veins`.
4. **Felling** (deep work): a tree taken out of `landTrees`' instances and `scatterChunk`'s solids, the stump, `felled` saved, logs. It reaches into the world's terrain files and F3's tree kit, so it takes the world FREEZE's paths for one session. `felling`.
5. **The forge** (systems, Opus): smelting, pieces, gates, quality, tempering, the 20% sale. `forge`.
6. **The bench** (systems, Opus): planks, spars, the cabin's patch and splice (sailing's owed item), bows, shields, fletching. `fieldpatch`, `fletch`.
7. **The land perks and the trunk** (systems, Opus): the 24 perks into `PERK_DEF` and `PERK_LIVE`, *Felling*'s fallen trunk as a walkable solid for 10 minutes, ore and logs in the guilds' gather tasks.

The look builder owes the props: the vein, the stump, the fire, the forge, the bench and the mortar, in the kit. They are cards in their own lane and block none of the sessions above; a session can use a plain stand-in until they arrive.

## The open number
**How strong is a made piece against a found one?** This is the one thing a player feels on every trip to the forge.
- **A.** *(recommended)* **Quality steps, never enchanted.** As above: Plain, Fine +10% at 50, one named Masterwork +20% a tier at 100. Loot keeps its enchantments.
- **B.** **Equal to loot, no steps.** A made piece is a plain piece of its metal. *Fine work* and *Masterwork* become something else (two pieces from one set of ingots, say).
- **C.** **One metal ahead.** At Smithing 50 you can make one metal above the place's cap, so the forge is how you get ahead of the world. That needs loot retuned, B's Fable session.

A is what the skills sheet's Smithing perks assume, makes 100 worth reaching, and leaves the enchanted find as the prize. Skyrim's smithing broke its balance by stacking on enchanting; A keeps the two apart.
