# Rare specimens and the field guide

*The systems designer, 12 Nov 2026. A proposal: nothing here is a spec until `docs/decisions.md` carries a `Michael:` line under it. Backlog L8, OG-097.*

## The problem in Michael's words
Backlog L8, *Rare specimens and the field guide* (systems, and the look builder for the plates; OG-097), from his review of the concept art (all sixteen of the second round marked KEEP, 12 Oct):

> "thirty specimens drawn as field-guide plates with a rarity and a habitat, six an island plus fungi and minerals (Gate Resin, Saltcrystal, Skyshard, Sunglass, Pearlweed); the game's herbs keep their names and may take their looks from here. Each has one known effect and one hidden, learned by study (the loop above); the equipment runs from a field kit and mortar to an alembic, a cauldron and a drying rack."

Most of the sheet's plants are in the game already. What is missing is the *guide*, a place where what you have found is kept, and the *rare* in rare specimens.

## Today
`HERB_DEF` (`30-plants.js`) holds 50 herbs: the 23 old land herbs, the sea's three, the four that mark a gate (S1886, S1896) and the atlas's twenty by island (S1939, #1202 A). Each has four effects in `HERB_FX` (`50-travel.js`), drawn from the 22 of `ALCH_FX`, every effect on 4 to 10 herbs (`tests/herbpool`). The first is learned by eating, the second after 15 eats (5 with the Tell perk, Alchemy 25), and the rest by grinding pairs in the mortar (`brewHerbs`); all of it lives in `herbsKnown()`, the character's. `spawnChunkHerbs` puts 8 to 16 herbs in every 64 m chunk by island, biome and ground; only Wolf's Bane is flagged `rare` (a third of the weight). Fourteen of OG-097's names already grow (Heartroot, Gatelotus, Gate Resin, Icebloom, Stormthistle, Glacier Lily, Stonecress, Frostcap, Amberbloom, Sandlotus, Spicethorn, Jade Aloe, Shadowcap, Pearlweed). Nowhere in the game can you see the herbs you are not carrying: the brew page lists the bag, and a herb you sold is forgotten by every screen but the mortar's memory of failed pairs. No herb depends on the hour, the weather or the season; a pick is 1 Alchemy mark. Time runs 60 game minutes to a real minute, so a game day is 24 real minutes and a season (84 days) about 34 real hours, a fortnight of evenings.

## Direction A: the field guide alone
**The loop.** Any herbalist or apothecary sells *A Field Guide to the Three Islands* (20 gold; Edna gives one free the first time you ask her about herbs). It opens in the book reader as a page for each island and one for the sea and the gates. Each plant you have ever picked gets its plate, its name, where it grows, its rarity, and its four effects as far as you know them. Plants never picked show an empty frame. The header counts what you have found: *31 of 50*.

**The rules.**

| Line | Rule | Why |
|---|---|---|
| Where it grows | written from `HERB_PLACE` in words: the island, the ground (rock, open, by water, under trees, by houses) and the biomes | It is already data. The guide states it, never a map spot. |
| Rarity | Common in 4 or more biomes, Uncommon in 2 or 3, Rare in 1, or flagged `rare`, or a gate's plant | Computed from the same table, so a new herb is graded without a hand list. |
| First pick | the first time you pick a kind, 10 Alchemy marks instead of 1 | A new plant is worth ten ordinary picks: it rewards going somewhere new, which the brief's progression wants. |
| Effects | as `herbFxKnown` reads them | No new knowledge rule, only a place to see it. |
| Plates | the plant kit's own mesh drawn once to a small canvas, in ink and wash | The look builder's; a text entry with the icon works until it lands. |

**Touches.** `herbsKnown()` gains `seen` (picks by kind), the character's, already in `SS_CHAR_WS` and on the S242 list. A `BOOKS` entry whose pages are drawn live; `harvestHerb` and the Caverglow pick call one named action, `notePlant(k)`. **Cost.** One systems session, one look session for the plates.

**Against.** It keeps a record but adds nothing to find. Every one of the 50 is a pick you will make anyway walking the roads.

## Direction B: the guide and nine rare specimens that keep their hours (recommended)
**The loop.** A as above, and nine specimens that are not herbs. Each grows in a few patches in a cell of its own island and opens only under one condition: an hour, a weather, snow. Outside it, it is a closed bud you can examine but not take. The first examine writes its condition into the guide ("opens at night under a clear sky"), so the second time you know to come back after dark. You live with a short list of *things to come back for*: the fen at night, the fells after a storm. You cannot buy them; at most, an apothecary will say where she last saw one.

**The nine.** Three an island, from OG-097's names the game lacks.

| Specimen | Island | Ground | Opens | Catalyst (hidden) |
|---|---|---|---|---|
| Whispercap (a fungus) | Gatelands | old wood, under trees | dusk, 19 to 22h | **Revealing**: the brew teaches every effect of every herb in it, not only the shared ones |
| Moonfen Orchid | Gatelands | moor and swamp, by water | night, 22 to 4h, a clear sky | **Steeping**: strength ×1.25 |
| Bloodreed | Gatelands | river margins | in rain, and 2 game hours after | **Venom**: a poison coats for 6 blows, not 3 |
| Ironleaf | Mark | rock on tundra | under snow (`WX.cover` 0.5 or more) | **Lasting**: a buff's or a sense's time ×2 |
| Snowshroom (a fungus) | Mark | spruce forest | dawn, 5 to 8h | **Clean**: a harmful effect is left out, so a pair that would make a poison makes a tincture of the rest |
| Skyshard (a crystal) | Mark | fells above 250 m | for 6 game hours after a storm | **Steeping**: strength ×1.4 |
| Miragebloom | Aurenne | dunes | noon, 11 to 15h, clear | **Lasting**: ×2 |
| Sunglass (a fused glass) | Aurenne | dunes and wastes | for 6 game hours after a storm | **Revealing** |
| Saltcrystal | Aurenne | salt pans and coast sand | after 2 dry game days | **Binding**: two herbs with nothing shared make a tincture of each one's first effect |

**The rules.**

| What | Number | Why |
|---|---|---|
| How many | 4 to 6 patches a cell of each of its island's three, 2 to 4 plants a patch; placed from the cell's hash when the cell is made, keyed `<cell>:sp:<kind>:<i>` | A mainland cell is 2.4 km across; at a run's 5 m/s that is 5 to 10 patches crossed on a long walk if you are out at the right hour. Placed by cell, never by chunk (S533's rule). |
| Open windows | 3 to 6 game hours, or a weather | 3 to 6 real minutes: short enough to be a choice of when, never long enough to wait out. No season: a season is two weeks of evenings, too long to ask. |
| Seen in the dark | open, each lights from its own parts (#855), never a point light | An orchid you came at night for must read at 40 m. |
| Regrow | a picked patch regrows in 7 game days (`worldState.picked`, the world's) | About three real hours, one evening. |
| Eaten | a small restore (15 HP, 20 stamina or 25 mana, as `islandHerbEat`), never in `HERB_FX` | They stay outside the pool, so `herbpool`'s 4 to 10 holds untouched. |
| In the mortar | a catalyst rides with the herbs and does not take a herb's place (`brewMax` stays 2, or 3 with Third hand); one catalyst a grinding | It changes how a brew comes out without changing what it can be: the four-effect rules stay the game. |
| Learning the catalyst | any of three, as OG-097 draws: **observe** (pick 3 open ones), **study** (1 game hour at an alchemist's table, a ship's still or a house's bench, spending one), **experiment** (grind with it once) | Morrowind's learning by doing, three ways to the same line, none of them bought. |
| Price | 45 to 90 (Skyshard and Sunglass the top); no shop sells one, an apothecary buys at her rate | Worth carrying home; at a few a night, never a money press. |
| First pick | 10 Alchemy marks, as A | |

**What it touches.** `HERB_DEF` grows a `spec` flag and a `when(x, z, t, wx)` condition; the cell's load (`81-world-cells.js`, beside the gate rings) places the patches; `harvestHerb` checks the condition; `brewHerbs` and the brew page take one catalyst slot. `herbsKnown()` gains `seen`, `cond` and `cat` (the character's, already saved). `worldState.picked` carries the patches (the world's). Named actions: `notePlant`, `learnSpecimen`, `studySpecimen`. The bodies builder owes nine meshes in the plant kit, each open and closed. Co-op: what you know is yours, the patches are the host's, and the conditions read the host's clock and weather.

**Conflicts.** None with a decision. Venom and Lasting lean on Alchemy's perks (Stoppered, Double measure) without copying them.

**Cost.** Three systems sessions: (1) the guide, rarity, first picks; (2) the specimens' placement, conditions and buds; (3) the catalysts and the study. One bodies session for the nine, one look session for the plates. All ordinary sessions.

## Direction C: B and the apparatus
**The loop.** B, and the equipment row of OG-097 as Morrowind's apparatus: an alembic (strength ×1.10), a retort (time ×1.25) and a cauldron (two tinctures from a grinding), bought in three grades and carried, or fitted in a house.

**Against.** It is a ladder of better tools bought with gold, which is the brief's *Not this* in plain words, and Morrowind's own apparatus was the first thing its players learned to exploit. The ship's still (×1.10) and the house's fittings (#1420 B) already put apparatus where you live; Double measure already gives two tinctures. Two more systems sessions on top of B.

## Recommendation
**B.** The guide alone records a walk you were going to take anyway; the nine give the walk a reason and an hour. Coming back to the fen at night for an orchid you saw shut at noon is the brief's progression in miniature: the land rewards someone who pays attention, and the reward changes how your brews come out, not which buttons you press. It keeps the four-effect pool and its suite untouched, adds no shop item but the book, and costs three ordinary sessions.

## What must be true first
- Survival B's brewing and Alchemy's perks (built). Resources B's house bench, if study is to work there (session 3 can open study at shop tables first).
- Weather's storm and `WX.cover` read the same for the host and a guest (they do: weather is world state).
- The quest writer's yes on two names: Skyshard (it must not read as star metal from the sky, which OG-123 left unsettled) and Saltcrystal beside the salt that resources A sells.

## Not asked
- **Weaver's Moss.** OG-097's sixth Gatelands plant names the Weavers, who built the gates (canon §3.1). A plant called for them is the quest writer's call, not mine.
- **Seasons.** No specimen keys on one: at 34 real hours a season, a plant missed would be gone for weeks of play.
- **A prize for a full guide.** The first-pick marks are the reward; a completion bonus turns the guide into a checklist.
- **The eight named recipes** (Frostguard Tonic and the rest). The pool already makes them; names are the quest writer's if wanted, as the gate plants' page said.
