# The gate interiors as spaces, for F5

*The designer, 19 Oct 2026. A proposal: nothing here is a spec until `decisions.md` carries a `Michael:` line under its question. It is the first of the proposals after the build sheets, the inside half of card F5 (`visual-foundation.md` §2, "the generator's second scale"), which no page has designed as a system yet.*

## The problem in Michael's words

> "My only other callout is that the Interior and Exteriors of the gates are too small. They should be shockingly large, like what we see in the concept art. Forget the 'dungeon with cobblestone walls' feel of the previous version." (12 Oct 2026)

> "I don't think this cave is expansive enough. This feels pretty underwhelming to me. I hope this isn't the scale we're going for in all of our dungeon interiors, especially Old Gates." (14 Oct, on #305)

> "If by dungeon we mean Old Gates, they should be extremely massive and cavernous. A normal 'dungeon' like a mine, or a cave can be a more typical size." (14 Oct, on #300)

The brief answers the look ("halls, not corridors … spaces, each 30 to 250 m, with the fighting in pockets"). How a generator makes them, and what playing one is like, is this page.

## Today

`makeDungeon(size, seed)` (`52-dungeon-gen.js`) drops 3 to 36 rectangles of 3 to 12 cells on a grid of 14 to 54 cells and joins each to the next with an L-shaped corridor one cell wide; medium and larger add a floor below (`addUpperFloor`). `buildDungeon(portal)` (`56-dungeon-build.js`) walls every open cell under a flat ceiling at `DUN_FLOOR_H` (3.2) and places foes (`en`, 5 to 30), traps, chests, doors and keys. Collision is `dSolid` on the grid plus `DUNGEON_COLUMNS`; heights are `FOOTHOLDS`; the minimap reveals cells. Michael's A on #421 (not built) makes a gate's cell 3 m with a 6 m ceiling: a massive gate becomes 162 m square with rooms to 36 m. That is a Skyrim ruin, roomy but still rooms and corridors. The gate kit (`gatekit.js`, auto/backlog, Sessions 1097 to 1119) already has the pieces at the nave's measures (slabs, a 4 m pier 20 m high, a 10 m arch, an 8 m stair, a 16 m bridge, balconies, vaults, a shaft, a chasm edge), each in three conditions, its floating stones footholds (#417 A).

## Directions

### A. The grid, grown

The player walks rooms and corridors as now, at #421's sizes, with the rooms allowed to grow. **Rules:** in a gate, the room range rises from 3 to 12 cells to 4 to 20 (12 to 60 m), and the ceiling follows the room: 6 m over a corridor, the room's shorter side × 0.6 over a room, up to 30 m. A vault replaces the flat lid, and piers come from `DUNGEON_COLUMNS` every 14 m in any room over 30 m. **Touches:** `makeDungeon`'s config, a ceiling rule in `buildDungeon`. **Cost:** two Opus sessions after #421's build. **What it misses:** the largest hall is 60 m against §2's 250, and every box is still joined to the next by a corridor: the cobblestone dungeon at 1.6 times the size. No stair hall, chasm or crossing, and a great gate is a large lesser one.

### B. Spaces first, rooms after, on one grid (the second scale)

The player walks a chain of great spaces: a nave, a stair hall, a bridge over a chasm, the ring. Each is a long walk under a vault, broken by **pockets** 15 to 30 m across where the fights are (a bay between piers, a chapel, a landing). Off the spaces hang ordinary rooms at #421's 3 m cell, holding the chests, keys and traps. Walking a space is the reward; a pocket is the work. The precedent is Elden Ring's legacy dungeons, Stormveil's long halls broken by guarded landings.

**The catalogue.** A space is drawn from six types, each made of the kit's pieces at §2's measures.

| Space | Footprint | Height | Pockets | Its play |
|---|---|---|---|---|
| Nave | 26 × 100 to 250 m | vault 40 to 50 | a bay between piers every 14 m; 2 to 4 side chapels | the long approach; foes in bays, archers on the balcony |
| Crossing | 40 × 40 m | dome 45 | the four arms' mouths | a hub, shortcuts back (OG-126's hub layout) |
| Stair hall | 30 m wide, 2 to 3 flights | 4.2 m a flight | each landing | up or down a level; a fight on a landing |
| Chasm | 60 to 120 m, bridges of 16 m | the drop is 25 m or more, death past 21 (F2b) | the piers between spans | a crossing; in a failing gate a span is gone and the floating stones are the way over |
| Flooded hall | 30 × 80 m | 30 | islands of slabs | wading at 0.9 m, swimming past 1.4 (F2b); Uisce's own |
| Ring chamber | 60 m across | ring 30 to 40 | the dais | the end: a lesser gate's sigil, or a great gate's knot (#292 A) |

The schools re-dress the six types (OG-119): lava in Tine's aisles, titanic stairs in Cloch's stair hall, Gaoth's chasm a vertical shaft.

**The rules.**
- *One grid.* Spaces are laid first on #421's 3 m grid, then today's code places rooms and corridors round them, so `dSolid`, the minimap, traps, keys and pathing keep working. A nave is a run of cells 9 wide; its piers are `DUNGEON_COLUMNS`; galleries, stairs and bridges are `FOOTHOLDS`. The one new field is a ceiling height per cell. A great gate's grid is 120 cells (360 m).
- *Layouts.* Spaces join as one of OG-126's six graphs, by seed (linear descent, labyrinth, hub with shortcuts, vertical, ring of loops, cave network), through thresholds: a slit door, a stair or a bridge, never a corridor.
- *Size by gate.*

| Gate | Spaces | Side rooms | Foes (`en`) | To clear at a jog, fighting |
|---|---|---|---|---|
| Lesser, tiny/small | 1 and the ring | 3 to 6 | 5 to 9 | 8 to 12 min |
| Lesser, medium/large | 2 to 3 and the ring | 6 to 12 | 14 to 20 | 15 to 25 min |
| Lesser, massive | 4 and the ring, two levels | 12 to 18 | 30 | 30 to 40 min |
| Great | 6 to 9 and the ring, three levels | 18 to 30 | 45 to 60 | 60 to 120 min: an evening, as the brief allows |

A 250 m nave is 65 s at a jog, cut by pockets so no stretch over 50 m is empty.
- *Pockets wake alone.* A foe is leashed to its pocket and 10 m round it; dungeon sight stays 8 (F2b), so a nave wakes a bay at a time. An archer on a balcony sees 20.
- *Condition* (canon Part I) picks the kit's: steady is whole; failing is cracked, one span in three gone; catastrophic is broken, the floating stones the route (#417 A).
- *Light and draws.* Only your space and its neighbours are lit and drawn: about 20 lights and 60 draws each, under 200 for the gate against v2-scope §5's 1,000.
- *Saves.* No new `worldState` key; a gate rebuilds from its seed, and what is opened or killed is keyed `<seed>:<space>:<index>` (the co-op rule).

**Touches:** `makeDungeon` (a space pass), `buildDungeon` (per-cell ceilings; the kit in the new look), foe placement and the dungeon foe tick in `90-main.js` (the leash), `drawMM` (a space as its outline), `68-dungeon-misc.js` (traps in rooms and thresholds only). **Cost:** one deep-work session for the space pass, ceilings and pockets (shared files, under the FREEZE #421's build already wants); two Opus sessions for the minimap, the leash and the suites; one for the great gate's row. Dressing the six types by school is F5's look work, owed anyway. Forts, lairs and caves keep rooms and corridors at 2.5 m (#421, F8).

### C. The six great gates by hand, the lesser gates grown

The six great gates are authored realms laid by hand from OG-119 (Uisce's colossus, Solas's statues, Gaoth's wind wheels); the lesser gates take A. **Cost:** 14 to 20 sessions. **What it misses:** the lesser gates, "the ones you're more likely to come across" (Michael, 12 Oct), stay boxes, and platforming B's generated places with several ways across have nowhere to live.

## Recommendation

**B.** It reaches §2's numbers in every gate, not six, without a second dungeon engine: the spaces sit on #421's grid, so collision, the minimap, keys and pathing carry over. Pockets make the size play rather than an empty walk, the conditions make one nave three crossings, and the broken gates give the floating footholds (#417 A) and the double jump their ground. Each great gate's authored ring and knot (#292 A) ends a generated chain: C's best part at a fraction of its cost.

## What must be true first

- #421's build (3 m cells, scaled whole); B should share its deep-work card or follow it under one FREEZE.
- F2b's sight, wading and fall numbers; the gate kit in the game (F5's look half); combat's resolver before pockets are tuned.

## Not asked

- **The outsides** (§2 has them); **the realms' story** and the act at the ring (#292 A); **foes per school** (#252 A); **forts and caves** (#421, F8).
- **Puzzles and lifts** (OG-120): a later page, once a space exists to put them in.
