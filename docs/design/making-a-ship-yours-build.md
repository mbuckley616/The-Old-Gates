# Making a ship yours: the build sheet

*The systems designer, 2 Nov 2026. This sheet builds Michael's B on* Making a ship yours *(#979, 1 Nov 2026) from its second session on. Session 1726 has already built the first. The sheet does not re-ask the design and leaves no number open. Every value is the proposal's or is settled here, with the reason.*

## What Michael chose

The page is `making-a-ship-yours.md`. He took the recommendation:

> "**Fittings take hold space; figureheads and crew found** (B)." (2026-11-01, on the control room)

So: every fitting except stowage costs hold weight, which means a ship can be a trader or a home but rarely both. A fitting can be bought at the yard, or built at her bench with Joinery for about a third of the gold. The yard sells paint, sail cloth, a banner, a name and its own island's carved figurehead. Five figureheads with small virtues can only be found. The carpenter, the cook and the navigator are people you meet, not hire. They work at a fixed skill of 50 from their stations below deck. C, where the banner has consequences, stays with the naval combat proposal.

## Today

Session 1726 (`86-world-crime.js`) built the first of the page's five sessions:
- `SHIP_PLACES` gives each hull its fitting places: sloop 2, cutter 2, cog 3, caravel 3, galleon 5.
- `SHIP_FITS` holds the five fittings at the page's prices and weights.
- Stowage is still the old hold tier, `st.cargo`. It now takes a place.
- `holdCap` (`84-world-interiors.js`) takes the fittings' weight off the hold (`shipFitWeight`).
- The named actions are `fitShip`, `unfitShip` and `shipFitToHull`.
- The yard keeps a store of taken-out fittings, `st.stored`.
- The yard panel shows *Her hold now*, *Places* and *Fitted*.

A fitting does nothing yet; it only takes room. The rest of the ship:
- **The bench.** `BENCH_RECIPES` (`50-travel.js`) makes planks, spars, bows, bucklers and arrows. It also patches and splices her, shown only at the ship (`shipWorkHere`, `cabinBench`). How far you can mend her at sea is set by Joinery: `fieldCap` (60% of her hull, +0.4% a level) and `patchAmt` (8 + Joinery ÷ 5, ×1.5 with the 50 perk).
- **Cooking** wants a fire (`atFire`, `cookAt`). **Brewing** wants only a mortar (`openBrewPage`) at `alchStrength` = `skillMult('alchemy')` × (1 + 1% a point of Intelligence).
- **The minimap** draws 58 m (`drawLocalMap(…,58,…)`). The oilskin's *ahead* line is `seaHint`.
- **Pirates** close in and shoot from 300 m, or 600 m with the Drowned Bell aboard (`85-world-sea.js`). Boarders are `BOARDERS` (`87-world-quests.js`).
- **The Drowned Bell** halves the sea's wear (`bellAboard`).

## The numbers

### What each fitting does

Every fitting does something on its own, so that a player who never meets the crew still gets something for the weight. A crew member then adds to it.

| Fitting | Weight | Alone | With its crew | Why |
|---|---|---|---|---|
| Stowage | — | +25 hold (as today) | — | Built. |
| Still | 10 | Brewing at the still: ×1.10 `alchStrength` | — (no crew) | A mortar already brews anywhere, so the still has to add something. 10% is about 12 Alchemy levels: worth the weight, but under a perk. Skyrim's lab is a station for the same reason. |
| Galley | 10 | A fire aboard: `atFire` is true within 2 m of it, so you can cook at sea | Cook's station | The page's "cooking at sea". A campfire on deck is not allowed, so this is the only fire at sea. |
| Chart table | 5 | Shoals under 2 m appear on the world map while you read it at the table | Navigator's station | The table is light and does little alone. The shoals come from the bed height the sea already reads. |
| Crew bunks | 10 | Two crew sleep aboard | Any two of the three crew | Bunks for two is the page's number. With three crew to choose from, the choice is the point (see below). |
| Arms rack | 5 | Three weapons kept on deck. If boarders land while your hands are empty, the first weapon on the rack is drawn for you. | — | The page's "you start the fight armed from it". It is a stash for weapons only, so it adds no new inventory rule. |

### The bench's fittings (session 2)

Fittings are built at her own bench only (`shipWorkHere`), because they are built into her. Each one adds `skillUse('joinery', 12)`, which is twice a patch: it is bigger work and happens rarely. The page priced a fitting at about a third of the yard's gold. The bench price here is the materials at the shipwright's own prices: planks 15, spars 60, an iron ingot about 40.

| Fitting | Joinery | Materials | At the shipwright's prices | Yard | Change from the page |
|---|---|---|---|---|---|
| Stowage | 25 | 6 planks, 2 spars | 210 | 200 / 400 | — |
| Still | 25 | 4 planks, 2 iron ingots | 140 | 400 | 4 planks added, so it is still joinery |
| Galley | 25 | 4 planks, 1 iron ingot | 100 | 300 | **4 stone dropped**: there is no stone item, and adding one for a single recipe is not worth it |
| Chart table | 50 | 4 planks | 60 | 300 | — |
| Crew bunks | 25 | 8 planks | 120 | 250 | — |
| Arms rack | 50 | 4 planks, 1 iron ingot | 100 | 200 | 4 planks added (the page listed only the ingot) |

An iron ingot is tier 3 (`INGOT_DEF`). A recipe never asks for a better metal than iron, because a fitting has no quality. A first stowage costs about what the yard charges. That is deliberate: hold tiers sold at the yard are what an old save holds, and the bench should beat the yard on rooms, not on cargo. A fitting built at the bench goes straight in if she has a free place and the weight fits. If not, the bench refuses and says why, the same way `fitShip` does.

### The crew (session 4)

The page's table stands. Here are the numbers that make it buildable.

| Crew | Needs | Rule | Value | Why |
|---|---|---|---|---|
| Carpenter | bunks | One patch every 90 s of play-clock while she is under way and below her cap. It takes a plank and a pitch from her sea chest's stash. | `PATCH_BASE` + 10 = **18** hull a patch, cap `fieldCap` at Joinery 50 = **80%** | That is your own patch at Joinery 50 without the perk. A player at Joinery 50 with the perk patches 27, so the craftsman keeps his edge. With an empty chest he says so once and waits. |
| Cook | bunks, galley | At 6h each game day, cooks one raw meat or fresh fish from the sea chest | `mealItem` at `skillMult` 1.0 (skill 50), one portion | Cooking 25's two portions are the player's perk, not his. Fish comes before meat because fish is what the sea gives you. |
| Navigator | bunks, chart table | While you are at sea: the minimap draws **116 m** (twice 58), shoals show on the minimap, and `seaHint`'s *ahead* line works without the oilskin | the oilskin's line verbatim | 116 m is still within the sea's loaded cells. The oilskin keeps its other use, staying dry. |

**Two bunks for three crew.** Only two of the three sail with you. The third waits at the port where you met them, and you can swap at any shipwright for free. That is the brief's first feeling in miniature: on a long run the cook and the carpenter go, and on a hunt for wrecks the navigator does. A galleon cannot fit two sets of bunks, because each fitting is one of a kind (Session 1726's rule), and the sheet keeps it that way.

A crew member lives below at their station, as the page says: one body in a small room, posed by the builder's `hbPose`. They never stand on deck and never enter the deck's shadow pass. They cannot be hurt and cannot leave unless you send them. If she sinks (`st.sunk`), the crew swim to the nearest port and wait there, because the brief says nothing is ever depressing to play.

### The figureheads (session 3)

The yard carves its own island's figurehead for 150 gold, with no virtue: the harp, the dragon prow, the sun (#839 A's dress). Found figureheads come as a token in the bag (weight 0, *to be fitted at a yard*). You fit one at any shipwright for free. One rides on her at a time, and the others wait in the yard's store with the fittings.

| Figurehead | Where, settled | Virtue, settled | Why |
|---|---|---|---|
| The Sea's hull | An Mhuir's shrine task (quest writer, session 5) | +5% top speed while `WX.type` is rain or storm | Rain and storm are the rough seas the weather already keeps. |
| A wreck's maiden | One wreck per island, the deepest-lying by bed height, picked by the world's seed when that island is first routed | A pirate within 300 m holds off for **10 s** before closing in, and the hail line says so | CLAUDE.md's rule (S533): keyed by place, never by what has loaded. When L10's depths land she stays in that same wreck. |
| The beast's skull | The hoard of the first lair beast you kill (`lairBeast`) | Merchantmen and fishing boats give way; other ships keep **30 m** off | The first kill makes it a trophy without making it a grind. |
| A gate stone | The vault of the first lesser gate you clear whose `gateCondition` is failing or catastrophic | Storm wear ×0.8. It does not stack with the Bell's ×0.5: the better of the two counts. | The Bell stays the best thing for storms. The stone is for a player who has not found it. |
| The Weaver's shuttle | The main quest, after the first great gate | The navigator's *ahead* line also points to the nearest wreck you have not visited. Without a navigator it does nothing. | It rewards the crew you met. |

### The yard's colours (session 5, with the look builder)

Paint, sail cloth and banner cost 50 gold each, and renaming her is free. Each is chosen from the yard's island, so #839's dress holds: **four hull paints and three sail cloths** an island. The banners are the three nations', your house's once you own one, or none. A banner is only a look until naval combat's C. Changing colours at a yard takes an hour on the clock, the same as a shipwright's mending.

## What it touches

| Piece | Where | Saved as |
|---|---|---|
| `st.fit`, `st.stored`, `st.cargo` | built | `worldState.ship`, the world's |
| `st.head`, `st.heads` (the figureheads she has found), `st.paint`, `st.cloth`, `st.banner`, `st.name` | `86-world-crime.js` | `worldState.ship`, the world's |
| `st.crew` (who is aboard), `st.ashore` (who waits, and where) | `86`, `88` | `worldState.ship`, the world's |
| `st.rack` (three weapons) | `86`, `60-shop.js` | `worldState.ship`, the world's |
| Crew met, figureheads found (the facts of the errands) | `87-world-quests.js` | the quest's own keys, the character's (`SS_CHAR_WS`, beside who you have met) |

`ship` is already on the S242 list, so the new sub-keys travel with it and need no new list entry. Under the co-op rules the ship is the host's world. Crew and figureheads aboard her stay with her. A friend who met the cook in their own game has the meeting in their character row but no cook on the host's ship, the same as a key to a house that is not theirs. The named actions are `fitShip` and `unfitShip` (built), plus `fitHead(k)`, `crewAboard(role)`, `crewAshore(role)`, `paintShip(k, v)` and `rackPut`/`rackTake`. The crew's ticks read the play clock, never the frame count. The panels are the yard panel (heads, colours, crew), the bench page (six rows, `ship:true`) and the brew page (the still's line).

## The suites

Following the basic-tests rule, these extend existing suites. Only one is new.

| Rule | Suite | Set-up | Pass line |
|---|---|---|---|
| Bench fittings | `shiphull` (+) | A sloop with one place free; give 8 planks; Joinery 25, then 24 | At 25, bunks are built and fitted, the hold drops 10 and joinery XP rises. At 24 the bench refuses. With both places full it refuses. |
| Still and galley | `brew` (+), `cookfed` (+) | At sea, by each fitting | The still: brewed strength = ×1.10 the same brew with a mortar. The galley: `cookAt('fish')` succeeds at sea. |
| Figureheads | `yardpanel` (+) | Grant the gate stone and fit it; storm, with and without the Bell | Wear ×0.8; with the Bell, ×0.5 and not 0.4. The swap is free. It survives save and load. |
| Crew | new `shipcrew` | Carpenter and cook aboard, bunks and galley, a sea chest with 2 planks, 2 pitch and 1 fish; `g.spin` 200 s under way at 50% hull | Two patches of 18. The hull stops at 80%. The chest is empty. At 6h one cooked fish. A third crew is refused without a free bunk. Save and load keep them. |
| Navigator | `seahint` (+) | Navigator and chart table, no oilskin, rain | `seaHint` gives the line, and the minimap radius reads 116. |

## Sessions

| # | Who | What |
|---|---|---|
| 2 | Systems | The bench's six fittings; what the still, the galley, the chart table and the rack do alone |
| 3 | Systems | Figureheads: the five places, the virtues, fitting and swapping at the yard |
| 4 | Systems | The three crew: bunks for two, stations, ticks, the sinking rule, `shipcrew` |
| 5 | Systems | The errands' hooks (`crewMet`, the shrine task, the main quest's shuttle); the yard's colours once the swatches land |
| — | Quest writer, two runs | The three crews' errands (carpenter from a pirate's hold, cook at a coaching inn, navigator at a Navigators' hall or a wreck's boat) and An Mhuir's shrine task; drafts to Michael before building |
| — | Look builder | Six fittings by island, six figureheads, 4 paints and 3 cloths an island; their models come from sessions 2 to 4 |

All of these are ordinary sessions; none rewrites shared files. Sessions 2 to 4 can land before the quest writer's drafts: until the errands exist, the crew and the two quest figureheads are reachable only through dev helpers.

## The open number

None. The proposal set the places, weights, prices, crew skill and virtues. This sheet has settled the rest (the bench's materials, the crew's rates, where the figureheads are placed, how many colours each island offers) on precedents already in the game, and each one is a constant a later playtest can tune.
