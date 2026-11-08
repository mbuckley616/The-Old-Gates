# Cooking: the island's table

*The systems designer, 8 Nov 2026. A proposal: nothing here is a spec until `docs/decisions.md` carries a `Michael:` line under it.*

## The problem in Michael's words

Backlog L8, *Cooking* (systems; OG-023): "regional dishes, campfire, hearth, spit and clay oven, meals with buffs (stew, grilled fish, smoked trout, flatbread and olives). OG-108's plates give each island nine dishes and three drinks (stews, soda bread and apple tart with ale and cider; venison, skyr with berries and mead; tagine, flatbread with olives, baklava and spiced tea); in the game the names take the canon's register, not the real-world ones."

The water page (`water.md`, 7 Nov) left recipes to this one.

## Today

Survival B's second session (Session 1486, `50-travel.js`) built the fire and the meal. A tinderbox lights a campfire from one log for a game hour (`lightFire`, `CAMPFIRES`), and an inn's or a home's hearth (or a ship's galley) counts as a fire too (`hearthHere`, `atFire`). At a fire, `cookAt` turns one food into one meal (Cooking use 6): meat into Roast Meat, Fresh Fish into Baked Fish, Root Vegetables into Pottage. Eating one (`eatMeal`) sets `worldState.fed`, the character's, to one kind for 2 game hours × the Cooking curve (`skillMult`, ×0.64 at 5 to ×1.4 at 100). Hearty gives +15% stamina and Warmth 1, Steady +1 health every 5 s, Clear +10% mana regeneration and Cool 1. The perks are built: two portions at 25, *fed* lasting through sleep at 75, a herb seasoning at 100 (`seasonOf`); *Shared pot* at 50 waits for a second player. The inn sells Hot Stew (Hearty) and Mulled Cider (Clear). There is no hunger.

So the loop works but is three rows deep: every island eats the same three dishes, the fire makes no difference, a meal never turns, nothing is learned. And `COOK_RECIPES` takes only `food:'fish'`, which only the shop's Fresh Fish carries: a trout, pike or salmon you catch (`_typeKey:'fish'`) can be sold but not cooked.

## Directions

### A. The island's table: names, no new rule

**The loop.** As today. The pot's three meals take the island's name for them: a Gatelands roast is one dish, a Markish one another, Aurenne's a third. Each inn sells its island's nine dishes and three drinks. Every dish is one of the three fed kinds at today's strength.

**Rules.** A meal's kind still comes from its main ingredient; the island you cook on sets only its name and icon. The inn's dishes cost what Hot Stew does (14) and drinks what Mulled Cider does (18). Caught fish become cookable.

**Touches.** `FOOD_MEAL` and `mealItem` by island (`dominantRegion` at the fire, or the inn's site); `SHOP_STOCK.inn` by island; the quest writer's names. No new save key.

**Cost.** One systems session and one quest-writer run. It answers the note's words, not its intent: a dish is a label on a buff you already had.

### B. The pot and the second thing (recommended)

**The loop.** Before an evening's dungeon you stop at the inn's hearth with what you carried down from the hills: a hare, a handful of rye, a pot of curd. A roast is what it always was. A *dish*, a main with a second ingredient, lasts longer and carries one more virtue, and each island cooks its mains with its own three seconds. You learn a dish by eating it at an inn, by asking a cook, or by trying a pair at the pot. A failed pair still feeds you as Pottage and is marked tried, the way the brewing page marks pairs (Session 1483). The fire matters too. A campfire roasts and grills. A hearth, or a mess kit over a campfire, stews. A clay oven bakes, and baked food keeps.

**Rules.**

| Piece | Number | Why |
|---|---|---|
| Mains | meat, fish (any caught fish, by `_typeKey`), produce: the fed kind, as today | Built and tested (`tests/cookfed`); the islands vary them |
| Seconds | three an island, nine in all, 2–4 gold, weight 0.3, at the goods shop and the inn of that island; one an island gathered where the plant kit already has a bush that bears it | Carrying another island's second is the point |
| A dish | main + second at a hearth or a pot: fed for **3 h** base (×1.5 a roast's), × the Cooking curve; Cooking use **9** | Two items, so it pays in hours and in uses |
| The grain (oats, rye, wheat) | **Filling:** the dish lasts ×1.5 again (4.5 h) | An evening is one to three hours (the brief); a filled stew carries a whole dungeon |
| The sweet (apples, berries, dates) | **Restoring:** 30 health and 30 stamina when eaten | The one rider you feel at once, the reason to eat in a lull between fights |
| The island's own | Gatelands butter: **Rich** (the kind's number ×1.25: Hearty +19%, Clear +12.5%); the Mark's curd: **Warmth +1**; Aurenne's olives and spice: **Cool +1** | Climate B's cap is two grades: a Hearty curd stew is Warmth 2, the Mark survived without fur. The Gatelands has no climate, so its own is strength |
| Nine dishes an island | 3 mains × 3 seconds, named by the quest writer in the canon's register | OG-108's count, met by the pairs, not by a list |
| Three drinks an island | bought only, an inn's: the island's second's rider alone for 1 h, beside fed, not instead of it | Brewing ale is Resources' or Water's |
| Fires | campfire: roasts only, and dishes with a **mess kit** (8 gold, weight 1, the adventurer's kit, OG-098); hearth and galley: roasts and dishes; **clay oven**: bakes | The note's four fires, each with a job |
| Bakes | produce + grain at an oven: a bread that **keeps**; meat or fish + grain at an oven: a pie that keeps | The reason to find an oven: the inn's and every Aurennais home's (the look builder's one prop) |
| Keeping | a roast or a dish **turns after 3 game days** to half its hours; a bake after 15 | Tinctures turn at 5 (`TINCTURE_TURN_DAYS`). It gives the oven its reason; nothing is lost, only halved |
| Learning | eating an inn's dish teaches it; a cook's or an innkeeper's topic teaches one a visit; trying the pair at the pot teaches it. Known dishes show their rider before you cook | Discovery, not purchase (the brief's *not buy more/better*; magic B's rule) |
| The inn's dish of the day | one of the island's nine, seeded by the site and the day | One roll keyed by place, per the co-op rules |

The perks stand as built. *Two portions* doubles a dish too. *Full belly* carries it through sleep. *Seasoned* adds a herb on top of the second, so a master's pot holds three things.

**Touches.** `50-travel.js`: `COOK_RECIPES` built from the pairs; `cookAt(id, second)`; `mealItem` carries the rider and a `made` day; a `mealTurned` beside `brewTurned`; `setFed` takes the rider (length, Rich, Warmth, Cool), which `warmthNow` and `coolNow` read; the oven in `atFire`'s family (`ovenHere`); the cooking page grows a second column, as the brewing page's pairs. `22-dialogue.js`: `SHOP_STOCK.inn` and the goods shop by island; the cook's topic. A new `worldState.dishesKnown` and `dishesTried`, the **character's** (added to `SS_CHAR_WS` beside `herbsKnown`, and to the S242 list). The quest writer names 27 dishes, 9 seconds and 9 drinks.

**Conflicts.** Nine more shop items. Under water B, *Watered* stays its own buff and these drinks stay the inn's.

**Cost.** Three systems sessions (the pairs, riders and learning; the fires and keeping; the inn's table and the page), one look session (the clay oven, the mess kit hung over a fire, the dish props), and one quest-writer run.

### C. B, and the table as a deed

**The loop and rules.** B, and what you cook is also something you give. A dish of a person's own island, handed to them, raises their disposition by 10 once a person (`worldState.met` keys them). An innkeeper buys up to three of your dishes a day at their worth (about 30 gold a day). On a feast day, six dishes brought to the square's table add +1 favour with the town, once a feast (`feastMeals` is already the character's).

**Touches, conflicts, cost.** B's, plus `talkNPC`'s give row, the inn's buy list and the feast table in `86-world-crime.js`. Cooking becomes a money skill, and a gift's disposition walks around Speech's rows. Five systems sessions, one look, one quest-writer run.

## Recommendation

**B.** It is the note in full: nine dishes an island, four kinds of fire each with a job, and drinks, built on the three fed kinds that already work and are tested. It puts discovery where the brief wants it. You learn a dish by eating it or trying it, the way herbs are learned, and Cooking's growth pays in hours and riders, not in a better thing to buy. The islands differ where it counts: the Mark's curd and Aurenne's olives are how a character survives climate B without the right clothes, so a pantry packed before a crossing is a choice about where you are going. Turning is mild (half, not gone), and it is what gives the oven and the evening's stew their reason. C's gift and trade lines are good, but they reach into Speech and the economy. They can follow B as their own question once B has been played.

## What must be true first

- Climate B (built, Sessions 1917–1934): the curd's and the olives' riders feed `warmthNow` and `coolNow`.
- The brewing page (Session 1483) is the pattern for the pairs and the tried marks.
- Water's answer (#1254) decides only whether a boil row sits beside the dishes; B works either way.
- The adventurer's kit (OG-098) has no page yet. B uses only its mess kit, sold as plain stock.

## Not asked

- **Hunger.** Survival B gives fed as a gift with no meter; water's page argues the same.
- **Smoking, drying and crops.** They want a rack and fields, which are L8's *Resources and crafting*. The oven covers keeping until then.
- **A fourth fed kind.** One kind at a time is the built rule; riders vary a dish without a fourth to balance.
- **Names.** The 27 dishes and nine drinks are the quest writer's, in the canon's register.
