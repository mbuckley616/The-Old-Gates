# Cooking B: the build sheet

*The systems designer, 9 Nov 2026. A build sheet for a design Michael has chosen. It settles the numbers the page left open and asks one.*

## What Michael chose

Cooking (backlog L8, OG-023, OG-108), DECISION #1296. Michael: **"B, the pot and a second ingredient."** (8 Nov 2026). The page is `docs/design/cooking.md`. A main plus one of an island's three seconds makes a dish. The dish lasts longer than a roast and carries one rider. You learn it by eating it at an inn, asking a cook, or trying the pair. A campfire roasts, a hearth stews, a clay oven bakes, and meals turn. The plan is three systems sessions, one look session and one quest-writer run.

## Today

Survival B's second session built the fire and the meal (Session 1486, `50-travel.js`). `lightFire` puts a campfire in `CAMPFIRES` for one game hour, and `hearthHere` counts an inn's or a home's hearth, or a ship's galley, as a fire. Together they make `atFire`. `cookAt(id, herb)` turns one food from `COOK_RECIPES` into a meal through `mealItem`: meat makes Roast Meat (Hearty), Fresh Fish makes Baked Fish (Steady), and Root Vegetables make Pottage (Clear). It counts as a Cooking use of 6. `eatMeal` calls `setFed(kind, s)`, which writes `worldState.fed` (the character's: `{kind, until, s}`) for `FED_MIN` = 120 game minutes × `skillMult('cooking')` (×0.64 at 5, ×1.4 at 100). The perks are live: *Two portions* (25), *Full belly* (75, `fedSleep`) and *Seasoned* (100, `seasonOf`). `warmthNow` counts Hearty as Warmth 1, and `coolNow` counts Clear as Cool 1. The suite is `tests/cookfed`.

There are two faults to fix on the way. First, `COOK_RECIPES` asks `b.food==='fish'`, which only the shop's Fresh Fish carries, so a trout, a pike, a salmon or a sea catch (`_typeKey:'fish'`) cannot be cooked. Second, a correction to the page. Its "a filled stew carries a whole dungeon" assumed game hours were real ones. The clock runs one game hour to the real minute (`advanceClock`), so today's meal lasts about two real minutes and the page's dish about three. That is the one open number below.

## The numbers

### Lengths

Every length is a multiple of `FED_MIN`, so the open number moves all of them together.

| Thing | Length | Why |
|---|---|---|
| A roast (today's meals) | ×1 `FED_MIN` × the curve | As built |
| A dish (main + second) | **×1.5** | The page's 3 h against 2: two items pay in time |
| Filling (the grain) | the dish ×1.5 again, so **×2.25** | The page's 4.5 h |
| A drink | **×0.5**, beside *fed*, not instead | A cup is half a bowl; it never replaces your meal |

### The seconds

There are nine seconds, three to an island. Each is sold at its own island's goods shop and inn and nowhere else (`survivalFor` by `nationKeyOf`, as the canteen and the flask are). Each weighs 0.3. The quest writer names them; the keys are working names.

| Island | Grain (Filling) | Sweet (Restoring) | Its own |
|---|---|---|---|
| Gatelands | oats, 2 gold | apples, 3 | butter, 4: **Rich** |
| Mark | rye, 2 | berries, 3 | curd, 4: **Warmth +1** |
| Aurenne | wheat, 2 | dates, 3 | olives, 4: **Cool +1** |

None is gathered yet. The page hoped for one gathered second an island, from a bush that already bears it, but no bush in `HERB_DEF` bears food: Thornberry and Rimeberry are herbs with their own four effects. Gathering waits for L8's fields and orchards. Selling the seconds only on their own island keeps the page's point that carrying them is the choice.

### The riders

| Rider | Effect | Why |
|---|---|---|
| Filling | length ×1.5 | Above |
| Restoring | **30 health and 30 stamina** when eaten, but only if you are not already fed by a Restoring dish | 30 is a cheap potion's worth. The guard stops *Two portions* turning one pot into 120 health between blows |
| Rich | the kind's number ×1.25: Hearty +18.75% stamina, Clear +12.5% mana regeneration, Steady 0.25 health a second | The Gatelands has no climate, so its own rider is strength |
| Warmth +1 | counts in `warmthNow` beside Hearty | A curd stew from meat is Warmth 2, which cancels Bitter (Michael's A on #1211). A curd dish of fish is Warmth 1 |
| Cool +1 | counts in `coolNow` beside Clear | The olives' mirror |

Climate's cap of 2 stays. A curd stew under a fur cloak is still 2.

### The 27 dishes

Every main (meat, fish, produce) with every second makes a dish, so 3 × 9 = 27, nine of them with each island's seconds. No pair fails. The page's "failed pair" had nothing to fail on once every second was edible, so trying a pair always succeeds, and it teaches you that dish.

- The dish's kind is its main's (Hearty, Steady, Clear), as built.
- *Seasoned* adds a herb on top of the second, so a master's pot holds three things.
- *Two portions* doubles a dish too.

### Fires

| Fire | Roasts | Dishes | Bakes |
|---|---|---|---|
| Campfire | yes | with a **mess kit** (8 gold, weight 1, at every goods shop) | no |
| Hearth (an inn or a home) and a ship's galley | yes | yes | no |
| Clay oven: **every inn** on every island, and **every Aurennais home** | (the inn's hearth) | (the inn's hearth) | yes |

The spit is how the campfire looks (the look builder's), not a rule. `ovenHere` is a check on the house's type, as `hearthHere` is, so the rule does not wait on the prop.

### Bakes and keeping

A bake is a grain dish cooked at an oven: produce with a grain makes a bread, and meat or fish with a grain makes a pie. It is the same dish, with the same kind and the same Filling, but it **keeps 15 game days**. The same pair cooked at a hearth is a stew that keeps 3.

| Food | Turns after | Turned |
|---|---|---|
| Roast or dish | **3 game days** (72 real minutes) | half its length, rider kept, *(turned)* in its name |
| Bake | **15 game days** (6 real hours) | the same |
| A meal from before this build (no day on it) | never | No migration: the old stacks run out on their own |

Tinctures turn at 5 days (`TINCTURE_TURN_DAYS`). A roast should turn sooner than a tincture, and bread much later. Nothing is lost, only halved.

### Learning

`worldState.dishesKnown` is `{ "<main>:<second>": 1 }`, the **character's**. It is added to `SS_CHAR_WS` beside `herbsKnown` and to the S242 list in `_applyLoadData`. There are three ways to learn a dish:

- **Eat one at an inn.** Each inn sells a **dish of the day**, one of its island's nine, drawn by `seededRng('dish', site + ':' + day)`. It costs **20 gold**, against Hot Stew's 14, for 1.5 times the length plus a rider.
- **Ask the innkeeper.** A topic, *What's cooking?*, teaches one dish a day an inn: a second seeded draw, `('dishtalk', site:day)`, that never matches the dish of the day. It needs no saved key, because asking twice teaches the same dish twice.
- **Cook the pair.** Any pair, known or not.

You can cook a dish you do not know. Before you know it, the page shows its kind and *"?"* for its rider. Once you know any dish with a given second, that second's tooltip and every pair with it show the rider. So learning means finding out what the nine seconds do, which is herbs' discovery at a ninth of the size.

### The inn's table

| Item | Price | Why |
|---|---|---|
| Dish of the day | 20 | Above |
| Its island's three seconds | 2 / 3 / 4 | Where you buy them, beside the goods shop |
| Three drinks of its island, one per second: the grain's (an ale), the sweet's (a cider or mead), its own | **12** each | One drink per rider. The grain's drink adds ×0.5 `FED_MIN` to the meal you are eating (nothing if you are not fed). The sweet's restores 15 and 15. The island's own gives Rich, Warmth or Cool for ×0.5 `FED_MIN` (Rich needs a meal to multiply) |
| Hot Stew, Mulled Cider | as now | Canon's inn staples (`lore_canon.md`, *Common*). `cookfed` tests them |

A drink is `worldState.cup = {r, until}`, the character's (`SS_CHAR_WS`, S242). Watered stays its own buff (water B), so a cup and a waterskin both count toward Cool, up to the cap of 2.

### Skill uses

A roast is still 6. A dish or a bake is **9**. Two items and a rider earn half again.

## What it touches

- **`50-travel.js`** (the systems builder):
  - `COOK_RECIPES` built from the mains, and the fish row asking `_typeKey` too.
  - `cookAt(id, second, herb)`, and `mealItem` carrying `meal.r`, `meal.pair`, `made` (the game day) and `bake`, with the pair and the day in its `brewKey` so stacks keep apart.
  - New `mealTurned(it)` beside `brewTurned`.
  - `setFed(kind, s, r)` writing `fed.r`, which `fedStamMult`, `fedManaMult`, `tickSurvival` (Steady's rate), `warmthNow` and `coolNow` read.
  - New `ovenHere()` and `hasMessKit()`.
  - New `cupNow()`, read by the same five places.
  - `survivalFor` for the seconds and the mess kit.
  - The cooking page (`openCookPage`) gets a second column for the seconds and a Stew/Bake choice when there is an oven. Its rider row shows *"?"* until the dish is known.
  - Every new name gets a grep first; the world files' names are global.
- **`22-dialogue.js`**: the inn's stock by island (dish of the day, the drinks), and the innkeeper's topic through `innTopics` (`83-world-generator.js`).
- **The save**: `dishesKnown` and `cup` go in `SS_CHAR_WS` and the S242 list. `fed` gains `r`, inside a key that is already saved. No world key. The dish of the day is a seeded roll keyed by place and day, so a friend in a shared world sees the same menu.
- **The quest writer**: names for the 27 dishes, the six bakes' bread and pie forms, the nine seconds and the nine drinks, in the canon's register. They go in one table the builder reads (`DISH_NAMES`), so the builder can ship with working names and the writer can replace them.
- **The look builder**: the clay oven in each inn and Aurennais home, the mess kit hung on the campfire's spit, and two dish props (a bowl, a loaf).

## The suites

The tests stay basic (Michael, 20 Oct): extend `cookfed`, and add one suite for keeping and the save.

| Rule | Where | Sets up | Measures | Pass |
|---|---|---|---|---|
| Fish by kind | `cookfed` +1 | a Trout at a hearth | `cookAt('fish')` | a Baked Fish |
| A dish's length and Filling | `cookfed` +2 | meat + butter, meat + oats at Cooking 5 | the minutes on `fed` | 1.5 and 2.25 × `FED_MIN` × 0.64, ±1 |
| Riders | `cookfed` +3 | curd stew in the Mark's winter night; produce + olives at Aurenne's noon; meat + butter's stamina | `climateGrade()`, `effMaxStamina` | grade 0, grade 0, ×1.1875 |
| Restoring, once | `cookfed` +1 | two apple dishes eaten one after the other | health gained | 30, then 0 |
| Fires | `cookfed` +1 | a campfire without and with a mess kit; an inn's oven | which pairs the page offers | roasts / dishes / bakes as the table |
| Keeping and the save | new `cookkeep` | a stew and a bread, the clock moved 4 and 16 days; save, reload | length on eating; `dishesKnown`, `cup` | half at 4 days for the stew only; both half at 16; the keys survive |
| The menu is seeded | `cookkeep` +1 | one inn, two loads of the same day | dish of the day | the same |

## Sessions

1. **Systems: the pot.** The fish fault, the nine seconds, the 27 pairs, the riders, `dishesKnown` by cooking, the page's second column, and `FED_MIN` as Michael answers below. `cookfed` extended.
2. **Systems: the fires and keeping.** The mess kit, `ovenHere`, bakes, `made` and `mealTurned`. `cookkeep`.
3. **Systems: the inn's table.** The dish of the day, the drinks and `cup`, and the innkeeper's topic. `cookkeep` +1.
4. **Look: the oven, the spit and the props.** Any time after session 2.
5. **Quest writer: the names.** Any time. Session 1 ships working names.

## The open number

How long *fed* lasts in real time. Every other length in the sheet is a multiple of it.

- **A.** As built: `FED_MIN` 120 game minutes. A roast is 2 real minutes, a dish 3, a filled one 4.5. Food is a snack before a fight, and Warmth from a meal hardly lasts a walk in the Mark.
- **B (recommended).** Ten times: `FED_MIN` 1,200. A roast is 20 real minutes, a dish 30, a filled one 45, and a cup 10. A filled stew carries a gate, which is what the page meant. Skyrim's soups last 12 real minutes.
- **C.** Four times: `FED_MIN` 480. A roast is 8 minutes, a dish 12 and a filled one 18, at Skyrim's scale.

Recommendation: B. It makes the page's argument true, and it makes the curd and the olives a real way through climate B. *Full belly* still matters, because a night's sleep is 8 game hours.
