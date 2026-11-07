# Water: something you carry, not a meter you feed

The systems designer, 7 Nov 2026. A proposal. Nothing here is a spec until `docs/decisions.md` carries a `Michael:` line under it.

## The problem in Michael's words

Backlog L8, *Water* (systems; OG-023, OG-035), from his review of the concept art on 12 Oct:

> "containers with uses (waterskin 4, canteen 3, flask 2, bottle 1), filled at rivers, wells and rain, boiled or filtered."

The note says what water is made of. It does not say what water is *for*. The brief limits the answer: survival skills are "part of the progression", but the game must never be "a punishing Souls-like", and death costs a reload and nothing more. Climate B's sheet (`climate-build.md`, *Not settled here*) left water and thirst to this page, and said heat does not wait on it.

## Today

There is no water to drink. Food has a full loop (survival B, Session 1486): at a fire (`atFire`) `cookAt` makes a meal, and eating it (`eatMeal`, through the potion's 0.8 s `startDrink`) sets `worldState.fed` to one kind for 120 game minutes (`FED_MIN`; two real minutes at 60 to 1): Hearty (Warmth 1), Steady or Clear (Cool 1). The same fire makes Charcoal from two logs. Climate B (Session 1917) grades exposure 0 to 2 (`exposureNow`), subtracts protection (`warmthNow`, `coolNow`, at most 2 each) and slows stamina regeneration by the grade (`climateRegenMult`). Every plaza has a well (`wellGeo`), only a mesh; you can swim in the routed rivers and lakes (`isSwimming`). A town takes the `plague` flag when a nearby gate is left uncleared (`tickPlagueDay`) and loses it when the gate is cleared or 20 days pass. Gates have a condition (`gateCondition`: steady, failing, catastrophic), and some have flooded halls.

## Directions

### A. Thirst, gentle

**The loop.** A thirst clock, as in Skyrim's Survival mode. You drink every few minutes of play, and a long dungeon means carrying more water.

**The rules.** After 8 game hours (8 real minutes) without a drink you are *Thirsty*: stamina regeneration ×0.85. After 16 you are *Parched*: ×0.7. Neither ever touches health. Hot and Scorching run the clock twice as fast. One use of any container resets it. The containers, sources and kinds are as in B below.

**Touches.** A new clock in `tickSurvival`, a chip in `updateHUD` beside climate's, `worldState.thirst` (the character's: `SS_CHAR_WS` and the S242 list).

**Conflicts.** A meter is a chore you pay whether or not anything interesting is happening. In Aurenne it stacks a second stamina tax on climate's, so the same sun is paid for twice. It walks closest to the brief's *not punishing*, and Skyrim's players turned Survival off for that reason.

**Cost.** Three ordinary systems sessions, and one for the look builder's four containers.

### B. Water as a carried draught *(recommended)*

**The loop.** There is no thirst. Water is a short buff you choose to carry, like a meal: fill a skin at a well or a stream, drink before a climb, a fight or the noon sand. Well water and rain are clean; river water is usually fine; a plague town's well is foul until someone clears the gate behind the sickness.

**A drink.** One use, drunk through `startDrink` (0.8 s, like a potion), makes you *Watered* for 2 game hours, the same length as being fed. While Watered, stamina regeneration is ×1.1, and you have **Cool 1** while you are Hot or Scorching. Watered is its own slot beside fed, so a Clear meal and a drink cancel Scorching without a tincture. A drink gives no stamina at once, so the Stamina Draught keeps its place in a fight.

**The containers.** The backlog's four, by island, so the vessel is a choice as the cloak is (`cloaksFor`):

| Container | Uses | Weight, empty / a use | Price | Sold | Its own virtue | Why |
|---|---|---|---|---|---|---|
| Waterskin | 4 | 0.3 / 0.25 | 12 | every general store and inn | none | Sold everywhere, so the rule works on the home island. |
| Canteen | 3 | 0.6 / 0.25 | 25 | the Mark | boiled water stays hot 3 game hours: Warmth 1, not Cool 1 | The Mark's answer to its cold, and a reason to boil there. |
| Flask | 2 | 0.4 / 0.25 | 30 | Aurenne | Watered lasts 4 game hours, not 2 | Fewer uses, each twice as long under the sun. |
| Bottle | 1 | 0.3 / 0.25 | found, 2 gold | barrels, chests, inns' cellars | none | The one you find rather than buy. |

A full waterskin weighs 1.3, a little over three meals.

**The sources.** E fills every container in the bag:

| Source | Kind | Rule |
|---|---|---|
| A town's well | clean | within 2 m of `wellGeo`'s solid |
| Rain or storm, outdoors | clean | each container gains one use every 10 game minutes, without a key, as long as you are outside |
| Snow, at a fire | clean | `WX.cover` above 0.3 and `atFire`: melt one container |
| A river, lake or pond | raw | standing in fresh water at least 0.3 m deep; never the sea (salt: *"It would not slake a gull."*) |
| A plague town's well | foul | while the town has its `plague` flag; clean again the day the flag goes |
| Water inside a failing or catastrophic gate | foul | a steady gate's flooded hall is raw |

**The kinds.** Raw water works, but **one drink in eight** also leaves you *Queasy*: stamina regeneration ×0.8 for 20 game minutes, never health. Foul water always does, for 60, and you are not Watered. **Boil** raw water at a fire (a row on the cooking page, one Cooking use) or **filter** it anywhere with 1 Charcoal. Nothing cleans foul water: pour it out and go and clear the gate. A container holds the worst kind it was filled with.

**The roll.** The one-in-eight is an outcome, so under the co-op rules it is seeded: by the fill's place and day (`<cx,cz>:<day>`) and the use's index.

**Touches.** `50-travel.js`: the drink (`drinkWater`, beside `eatMeal`), `wateredNow` read in the stamina line (`90-main.js`) and in `coolNow`/`warmthNow`, a boil row in `COOK_RECIPES`, the rain tick in `tickSurvival`; the fill prompt in `interact`; the containers in `SHOP_STOCK` by island and the bottle in the loot tables. A container is a `BAG` item carrying `water:{kind, uses, fill, hot}`, so it is the character's with no new key. `worldState.watered` and `worldState.queasy` are the character's (`SS_CHAR_WS`, the S242 list); a well's kind derives from the town's saved flag. Two chips in the buff row, and the kind and uses in the bag's tooltip.

**Conflicts.** None with the decided systems: it reads climate's protection, food's fires and the plague's flag, and changes none of them. Mulled Cider stays a Clear meal and is not water.

**Cost.** Two ordinary systems sessions (1: containers, sources, the drink, Watered, the save; 2: the kinds, boiling, the filter, Queasy, the canteen's and flask's virtues, the stock by island). One for the look builder: the four containers in the hand and on the hip, and the well's prompt.

### C. Water at the source

**The loop.** No containers to manage. You drink with E at a well, a stream or a spring and are *Refreshed*, which works as B's Watered and lasts 3 game hours. One waterskin, sold everywhere, carries one Refreshed for the dry places. There are no kinds, no boiling and no filter.

**The rules.** As B's drink, with a single kind of water. Wells, rivers and lakes all count, and the sea does not.

**Touches.** `interact`, one buff, one item, `worldState.watered`.

**Conflicts.** It drops half of Michael's note (four containers, boiling or filtering), and water reads nothing of the world's state.

**Cost.** One ordinary session, plus the waterskin's mesh.

## Recommendation

**B.** It builds all of Michael's note without a meter: water is a buff you choose to carry, not a debt that grows while you play, so the brief's *never punishing* holds where A would tax every evening. The containers differ by island, like the cloaks, and B is the first answer to Aurenne's sun a fighter in plate can carry (a drink and a light meal, no tincture, no robe). And water reads the world: a plague town's well is foul until you clear the gate behind it, the brief's first feeling at the scale of a bucket. C saves one session but drops the parts of the note that make water worth having.

## What must be true first

- Climate B is built (Session 1917): `coolNow` and `warmthNow` exist for Watered to add to.
- Survival B's fires and Charcoal are built (Session 1486).
- The plague flag and the gates' condition are built. Nothing waits on another proposal or an open decision.

## Not asked

- **Water in recipes.** It would change the built meals and `tests/cookfed` for little gain; left for L8's *Cooking* dishes.
- **Uisce filling a skin.** It would fit, but magic's forms are decided (`magic-build.md`).
- **Springs at the gates.** A fourth source near steady gates is look work, after B is played.
- **A perk.** Boiling is a Cooking use; the perk tree is decided.
