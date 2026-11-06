# Climate B: the build sheet

The systems designer, 6 Nov 2026. A build sheet for a design Michael has already chosen. It settles the numbers and asks one of them.

## What Michael chose

The concept art's open questions (Session 767, `docs/decisions.md`, *The concept art's open questions*), question 5:

> **Climate** (OG-023, OG-039). **B.** A moderate rule: the Mark's cold and Aurenne's heat wear your stamina without the right clothes, and a few herbs and meals resist them.

> Michael: **1 B, 2 B, 3 A, 4 C, 5 B, …**, every recommendation. (12 Oct 2026, in chat)

Backlog L, *Camp and rest*, repeats it, and says that climate gear by island follows from it. Survival B's sheet (`survival-build.md`) put Resist Cold and Resist Heat into the brewing pool *for climate B*. Session 1483 built both effects, but there was no climate to read them. The pending #1202 (the Mark's and Aurenne's new herbs) argues from this rule as well. Nothing more was proposed than the one line, so there is no separate design page. This sheet is the page.

## Today

The canon has climate by island, not by latitude (`lore_canon.md`, *Climate by island*): the Gatelands are temperate, the Mark is cold and Aurenne is warm. The code has it as `climateOfCell(i,j)` (`84-world-interiors.js`), read from `nationOf(i,j).climate` (`87-world-quests.js`). That value already drives the biome weights (`81-world-cells.js`), the snow line (`snowLineAt`: 18 m cold, 130 temperate, 160 warm) and the weather (`weatherWeights`, including S1433's blizzard, which only the Mark rolls, in winter).

Cold and heat change no rule yet, apart from two small reads:
- **The fur-lined cloak.** `furWarm()` in `60-shop.js` gives +10% stamina regeneration in falling snow, or at night above the snow line. A Resist Cold tincture counts as the cloak (S1483).
- **Resist Heat.** It takes a quarter off fire damage, in `_warded` (`50-travel.js`).

Stamina regenerates in the loop (`90-main.js`) at 3 + 0.4 a level past the first + 0.3 × Resolve, plus enchant bonuses, × 0.8 when burdened. A fresh character has 100 stamina and refills from empty in about 26 s. Sprinting drains 14 a second. Being fed is one kind at a time, kept in `worldState.fed`: Hearty (meat), Steady (fish) or Clear (produce). There is no hunger.

## The numbers

### Exposure: two grades a side, read each frame

Exposure is a grade from 0 to 2: **Cold** and **Bitter** in the Mark, **Hot** and **Scorching** in Aurenne. It is read from where you stand, the hour (`gameHour`), the season (`calDay`) and the weather (`WX`). The Gatelands never expose you. The home island is where you learn the game, and the canon calls it temperate.

There is no exposure indoors, in a dungeon or gate, within reach of a fire (`atFire`, 2.5 m), in your ship's cabin, or in the inspector. At sea you are exposed by the island whose cell you are in.

| The Mark, outside | Grade | Why |
|---|---|---|
| Summer, 6h–20h, below the snow line (18 m) | 0 | The Mark's one easy season. It is short, and the lowland fjords are where its towns stand. |
| Anywhere else, any time | 1 Cold | The Mark is cold. With a snow line at 18 m, most of its ground is above the line most of the year. |
| A blizzard; a winter night (20h–6h); in the water outside summer | 2 Bitter | The three moments the canon and the weather already mark as dangerous. A blizzard is 7.5% of a Mark winter's rolls. |

| Aurenne, outside | Grade | Why |
|---|---|---|
| 17h–9h; any hour in winter; rain or storm | 0 | Heat is a midday thing. Nights in the dunes stay free, so the rule stays one sentence (see *Not settled here*). |
| 9h–17h in spring, summer and autumn | 1 Hot | The working day. A traveller who moves at dawn and dusk is never touched, as in the real desert. |
| Summer, 11h–16h, on dunes, wasteland or the wastes | 2 Scorching | The open sand at noon. On the other biomes summer stays Hot. |
| A heavy chest piece worn (mail or plate) while Hot or Scorching | +1, to at most 2 | Metal in the sun. This makes Aurenne the one place where the light line or a robe is the better choice, which is a real choice rather than a stat line. |

The biome is `dominantRegion(px,pz)` at the player. CLAUDE.md warns against reading that at a fixed spot, but the cell you stand in is always loaded, and the weather already reads it the same way. A 2 m band at the snow line stops the grade flickering as you walk along it. A grade rises at once and falls 3 s later by `performance.now()`, so a dropped frame changes nothing.

### What a grade costs

| Grade (after protection) | Stamina regeneration | Stamina ceiling | Health |
|---|---|---|---|
| 0 | ×1 | 100% | never touched |
| 1 Cold / Hot | ×0.75 | 100% | never touched |
| 2 Bitter / Scorching | ×0.5 | 80% (the open number) | never touched |

Both multiply the existing regeneration line, beside the burdened ×0.8. At grade 1 a fresh character refills in about 35 s instead of 26 s. At grade 2 it takes about 42 s to reach the 80 ceiling. You feel it in a long fight or a sprint up a slope, but it never stops you. The brief rules out a punishing game and says death costs only a reload, so **climate never takes health**. Skyrim's Survival mode is the counter-example: there the cold eats your health and the island becomes a chore. Elden Ring's snowfield costs nothing, so it is only a colour. Climate B sits between the two: a cost you dress for.

### Protection: each point takes a grade off

Exposure minus protection, never below 0. Warmth counts only against cold, and Cool only against heat. At most 2 of each count, which is enough to cancel a Bitter or a Scorching grade.

| Source | Warmth | Cool | Why |
|---|---|---|---|
| Fur-lined Cloak (`back`) | 1 | — | The Mark's own cloak, sold only there (`cloaksFor`). Its +10% from `furWarm` stays as it is, so `tests/cloaks` stands. |
| Aurennais Short Cape (`back`) | — | 1 | Aurenne's own cut. Its +2% barter stays. Now the cloak slot is a choice you make each time you land on a new island. |
| A robe piece worn as the chest | — | 1 | Loose cloth, the way Aurenne dresses. The robe line gets a second reason to exist. |
| Resist Cold (tincture, or herb eaten) | 1 | — | As brewed (S1483); the effect lasts as long as it does now. |
| Resist Heat (tincture, or herb eaten) | — | 1 | It keeps its quarter off fire as well. |
| Fed: Hearty (meat; Hot Stew) | 1 | — | A hot meal. These are the "meals" in Michael's line, and they need no new food. |
| Fed: Clear (produce; Mulled Cider) | — | 1 | A light meal or a drink. Mulled Cider counts as Clear because the game already files it under that kind. |
| Steady (fish) | — | — | Fish keeps its health tick. It is neither warm nor light. |

A heavy-armoured fighter at Aurenne's noon on the sand is at grade 3, capped at 2. A Clear meal and a Resist Heat tincture bring them to 0. A robed mage in a Mark blizzard in a fur cloak, fed Hearty, is at 0. Wearing none of it, they cross at half regeneration and live.

### What you see

- **The HUD.** A chip in the buff row: ❄ *Cold*, ❄❄ *Bitter*, ☀ *Hot*, ☀☀ *Scorching*. When protection cancels the grade, the chip is dimmed and its tooltip names what is doing it (*warmed: fur cloak, Hearty*).
- **The stamina bar.** At grade 2, the lost fifth is hatched in frost or in heat.
- **The tooltips.** Each piece and meal says what it gives: *Warmth 1*, *Cool 1*, and *heavy in the sun* on mail and plate chests.
- **First time.** The first time you reach each of the four grades, one line is written in the log. These are the quest writer's lines (see *Sessions*). Until they are written, the chip's name stands alone.

## What it touches

- **New:** `exposureNow()` (the raw grade and its reason), `warmthNow()` and `coolNow()`, `climateGrade()` (exposure after protection, with the 3 s fall), and `climateRegenMult()` and `climateStamCap()`. All of them go in `50-travel.js` beside `tickSurvival` and the fed state, since they read `atFire`, `fedKind` and the buffs. Their names are new to `js/`; grep before naming.
- **Read in:** the stamina line in `loop` (`90-main.js`), the ceiling in `effMaxStamina` (`60-shop.js`), the buff row and the stamina bar in `updateHUD` (`62-actions.js`), and the item tooltips in the inventory (`66-hub.js`). `CLOAK_KINDS.cape.virtue` gets its new text.
- **worldState:** one key, `exposureSeen` (`{cold, bitter, hot, scorching}`, the first-time lines). It describes the character, so it goes in `SS_CHAR_WS` and in the S242 list in `_applyLoadData`. It must **not** be called `cold`: that key is the canon's Cold, the Mastery's cost, already in `SS_CHAR_WS`. The grade itself is never saved, because it is derived each frame.
- **Co-op:** exposure reads the character's own position, kit and fed state, so with two players each has their own. No roll is involved. Nothing is shared, so no named action is needed beyond the log line's.

## The suites

One suite, `tests/climate.test.mjs`, under the smoke budget. Every check teleports the player and drives time with `g.spin()`.

| Check | Set-up | Measures | Pass |
|---|---|---|---|
| The map | One point in each island's cell; summer noon and winter night | `exposureNow()` | Gatelands 0 both times. Mark summer noon below 18 m: 0; winter night: 2. Aurenne summer noon on dunes: 2; at 18h: 0 |
| Shelter | A Mark winter night, then indoors, then beside a lit campfire | grade | 2, 0, 0 |
| The cost | Bitter, unprotected, stamina 0, 600 ticks | stamina gained, and the ceiling | half of grade 0's gain (±5%); never above 80% of the maximum |
| Protection | Bitter; add the fur cloak, then Hearty | grade | 2 → 1 → 0 |
| Metal | Aurenne Hot, then a plate chest worn | grade | 1 → 2; a Resist Heat tincture brings it back to 1 |
| Health | 60 game minutes Scorching, unprotected | PHP | unchanged |
| The save | `exposureSeen.bitter` set, then save and load | the key | it survives, in the character row |

## Sessions

1. **Systems (Opus):** the grade, protection, the regeneration and ceiling reads, the HUD chip and the hatched bar, `exposureSeen`, and `tests/climate`.
2. **Systems:** the tooltips, the cape's and the robe's text, and the heavy chest's line. An innkeeper in the Mark and one in Aurenne each get a topic that names what to wear, as the place to learn the rule in the world rather than from a page.
3. **The quest writer (one run, for approval):** the four first-time lines and the two innkeepers' topics, in each island's register.

Owed afterwards, not part of this sheet: breath in the cold and shimmer over the sand (look builder); and climate gear by island, which backlog L says follows from this rule and which would become a proposal of its own once the rule is played.

## Not settled here

- **Desert nights.** A cold night in the dunes would be true to life, but it would make the rule two-sided in Aurenne. Better left until the rule has been played.
- **Water and thirst.** Backlog L's *Water* is a separate item, and heat does not wait on it.
- **The Gatelands' peaks in winter.** They are left free, because the canon has the home island temperate.

## The open number

How hard grade 2 bites. Grade 1 (×0.75 regeneration) is mild enough to settle here. Grade 2 is what a player feels in a Mark blizzard or on Aurenne's noon sand.

- **A (recommended).** Regeneration ×0.5, and stamina capped at 80%. You can see the cost on the bar, and a fight still has four fifths of your stamina.
- **B.** Regeneration ×0.5 only. Gentler, but grade 2 then shows only as slower refilling, which is easy not to notice.
- **C.** Regeneration ×0.5, and stamina capped at 60%. Harsher: Bitter becomes something you dress against before you set out.
