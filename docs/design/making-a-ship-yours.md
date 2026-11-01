# Making a ship yours: fittings, colours, figureheads and the crew

*The designer, 1 Nov 2026. A proposal; backlog L6.*

## The problem in Michael's words
Backlog L, *Making a ship yours* (systems; OG-072): "figurehead, paint, sails and banners, interior dress, upgrades (larger hold, crew quarters, stations). Cannons optional, on the top hulls only." Its neighbour, *Crew as upgrades* (OG-093, OG-027), carries Michael's 4 C of 12 Oct: "a carpenter mends at sea, a cook feeds you, a navigator shows the coast. No morale." His A on #418 put the base below deck "in the hull's own lines", so a bigger ship is a bigger home, and his A on #839 keeps the dress of the island whose yard sold or last refitted her. The brief's *Not this* applies with force here: "systems that reduce to *buy more/better*".

## Today
You buy a sloop at a shipwright (`buyShip`, 400 gold), and she is kept in `worldState.ship`: her class (`cls`), name, dress, hull and rig bars, hold and tiers. The yard panel (`yardOffers`, `86-world-crime.js`) sells refits between the five hulls by worth (`SHIP_CLASSES`, `refitCost`: sloop 400, cog 1,300, cutter 2,000, caravel 3,200, galleon 3,500), four sail tiers at +12% of bare speed each (`SAIL_TIERS`, 250 to 1,100 gold) and two hold tiers at +25 each (`CARGO_TIERS`, 200 and 400, on `CARGO_HOLD` 25 to 90). `upgradeTopics` raises, fetches and mends her. The look builder is putting each hull's base in her own lines (the caravel's berth, `berthNear`, Session 1565; the cabin's bench, `cabinBench`, Sessions 1519–1527). Nothing on her is chosen by you except the hull and the two kinds of tier: her name is rolled from `SHIP_NAMES`, her paint and sails are the yard's, there is no figurehead and no one aboard but you. Note for co-op: `ship` is a world key (not in `SS_CHAR_WS`), so the ship belongs to the host's world, as a house does.

## Directions

### A. The yard's catalogue
**The loop.** At any shipwright you name her, pick a hull paint and a sail cloth from the yard's island palette, a banner, a carved figurehead, and buy fittings for her rooms. Crew are hired at a port tavern once she has bunks. All of it is gold at a counter.

**The rules.** Each hull has fitting places by her drawn rooms (#418 A): sloop 2, cutter 2, cog 3, caravel 3, galleon 5. The berth, one sea chest and the bench are every ship's and take none. Fittings: *Stowage* (+25 hold, replaces `CARGO_TIERS`; a save's tiers become fitted stowage, free), *Still* (alchemy at sea), *Galley* (cooking at sea), *Chart table*, *Crew bunks* (two crew). Prices 300 to 600 each. Crew: a carpenter (600), a cook (300), a navigator (800), a one-time fee and no wage (4 C: no morale, and you chose survival B over upkeep on #85). Paint, cloth and banner 50 each, a figurehead 150, renaming free.

**Touches.** `yardOffers`, `worldState.ship` (new keys `fit`, `crew`, `paint`, `cloth`, `banner`, `figure`: the world's, on the S242 list), `buildShipMesh`, `tickShip`.

**Conflicts.** It is the brief's *buy more/better* in its plainest form: every row is a price.

**Cost.** Three ordinary sessions (systems), plus the look builder's figureheads and per-fitting props.

### B. Fittings that cost room, figureheads you find, crew you meet *(recommended)*
**The loop.** The yard still does the plain work: paint, cloth, banner and name (as A, 50 gold each, the palette by the yard's island so #839's dress holds), and the carved figurehead of the yard's island. But the rooms are a choice, the best figureheads are trophies, and the crew are people you come across.

**Fittings take room.** The same places as A (2, 2, 3, 3, 5), and each fitting but Stowage also takes hold weight, so a ship is a trader or a home and rarely both:

| Fitting | Hold weight | What it does | Yard price | Made at the bench |
|---|---|---|---|---|
| Stowage | — | +25 hold | 200 / 400 (as today) | Joinery 25: 6 planks, 2 spars |
| Still | 10 | alchemy at sea | 400 | Joinery 25 + 2 iron ingots |
| Galley | 10 | cooking at sea; a cook's station | 300 | Joinery 25 + 1 iron ingot, 4 stone |
| Chart table | 5 | the navigator's station | 300 | Joinery 50: 4 planks |
| Crew bunks | 10 | two crew sleep aboard | 250 | Joinery 25: 8 planks |
| Arms rack | 5 | three weapons stored; the boarders' fight starts with you armed from it | 200 | Joinery 50 + 1 iron ingot |

A sloop (40) with a galley and bunks carries 20; a galleon (90) with stowage, still, galley, chart table and bunks carries 80. Two fittings halve a sloop as a trader: that is the trade to feel. The bench path is the progression (feeling 2): Joinery already mends her (`patchAmt`, `fieldCap`), and building her rooms yourself costs about a third of the yard's gold in timber you cut. Refitting to another hull keeps every fitting that fits her places; the rest go into the yard's store, refitted free later.

**Figureheads are found** (Michael's capes rule, #148: minimal unless rare). The yard carves its island's (a harp, a dragon prow, a sun) for 150, no virtue. Five more are only found, one each from a place you went:

| Figurehead | Where | Virtue |
|---|---|---|
| The Sea's hull | An Mhuir's shrine task on a coast (the quest writer's) | +5% top speed in a rough sea or storm |
| A wreck's maiden | a wreck chest at the third depth | pirates hail before boarding: 10 s to run |
| The beast's skull | the beast of a lair, once slain | merchantmen and fishing boats give way, other ships keep 30 m off |
| A gate stone | a lesser gate's vault, failing or catastrophic | storm wear ×0.8 (does not stack with the Drowned Bell's ×0.5; the better one counts) |
| The Weaver's shuttle | the main quest, after the first great gate | the navigator's line also points to the nearest unvisited sea wreck |

One figurehead at a time; the others wait in the yard, swapped for free at any shipwright.

**Crew are met, not bought** (4 C, no morale, no wage). Each is a person with one small errand in the quest writer's hand: a carpenter pressed aboard a pirate (beat the boarders and free him), a cook out of work at a coaching inn, a navigator at a Navigators' hall or found in a wreck's boat (OG-093's ports). Each needs bunks and a station and lives below at it, not on deck: one body in a small room, nothing in the deck's shadow pass, nothing for a guest to sync but its place.

| Crew | Station | What they do at sea |
|---|---|---|
| Carpenter | bunks | a patch every 90 s under way, from the sea chest's planks and pitch, to 80% of her hull (Joinery 50's `fieldCap`); you take her higher yourself |
| Cook | galley | once a game day, one raw fish or meat in the chest becomes its cooked dish at Cooking 50's quality |
| Navigator | chart table | the coast on the minimap at twice the range at sea, shoals under 2 m drawn, and the oilskin's *ahead* line (`seaHint`) without the cloak |

None replaces a skill: each works at a fixed 50, below where a player who trained it stands, so they help the sailor who has not and leave the craftsman his edge.

**Touches.** As A, plus `holdCap`, `openBenchPage`'s recipes, `seaHint`, `bagTake` from the sea chest, wreck and lair chests, `BOARDERS`.

**Conflicts.** None decided: the hull ladder (3 A), the dress (#839 A) and the Drowned Bell stand. `CARGO_TIERS` becomes Stowage; old saves keep what they bought.

**Cost.** Five ordinary sessions (systems: places and weight with the save; the bench's fittings; figureheads and their virtues; the three crew; the errands' hooks), two quest-writer runs for the three crew and the shrine task, and the look builder's props (six fittings by island, six figureheads, paint and cloth swatches).

### C. B, and the colours you fly have consequences
**The loop.** As B, and the banner is not a look: you fly the Crown's, the League's, the Compact's, your own house's, or none, and the sea answers it.

**The rules.** Under a nation's colours its ports waive the harbour fetch and its patrol ships let your hold be; the other two nations' ports search you at 1 in 4 landings and take the tithe (`CARGO_TITHE`, 10%) on anything stolen; pirates take a nation's flag as worth robbing (+25% boardings) and your own as nobody's. Changing colours costs a game day in port. Flying a nation's flag with favour ≤ −2 there is a crime at its quays.

**Conflicts.** It leans on naval combat's patrols and harbour defences (L6, *Naval combat, more of it*), which are not designed, and on the war's lines.

**Cost.** B's five, plus two systems sessions after the naval combat proposal.

## Recommendation
**B.** The fittings' weight makes every room a choice between a trader's hold and a home at sea, which is the decision the brief puts first; the bench path ties the ship's growth to Joinery, a skill that rises by use (feeling 2); found figureheads and met crew turn places you went and people you helped into what you see on your own deck. A is the same features as a price list, which the brief rules out. C's colours are the best consequence of the three, but they lean on patrols and harbour defences that are not designed, so they belong in the naval combat proposal, and nothing in B stands in their way: the banner is already a key on her.

## What must be true first
- The base below deck in each hull's lines (#418 A, the look builder's L6, under way): fittings need rooms to stand in. The caravel's cabin is done; the sloop, cutter, cog and galleon follow.
- Wrecks at three depths (L10) and lairs' beasts (built) for the found figureheads; the shrine task and the crews' errands are the quest writer's drafts, approved before they are built.
- Cooking's dishes at a known quality (survival B, built) for the cook.

## Not asked
- **Cannons.** Michael's 7 A keeps guns on the top hulls only; where they mount and what they cost is naval combat's, the next L6 systems item.
- **A crew that sails her.** 4 C says upgrades without morale; a crew that trims sails or fights is #85's C, which he set aside to revisit.
- **Paint from anywhere.** #839 A keeps the yard's island dress on the ship; this page only lets the colours vary inside that dress.
- **More hulls or a second ship.** The ladder is 3 A; one ship at a time stays, as the save holds one.
- **Interior dress as a separate choice.** It follows her dress (#418's pictures), so it is not a second purchase.
