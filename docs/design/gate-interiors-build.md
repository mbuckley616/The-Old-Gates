# Build sheet: the gate interiors as spaces (F5's inside, with #421's cell)

*The designer, 20 Oct 2026. A build sheet for a design Michael has chosen: it settles the numbers and does not re-ask the design. One number is left open, at the foot.*

## What Michael chose

On #448 (`docs/design/gate-interiors.md`), 19 Oct: **"Spaces first, rooms after, on one grid."** Every gate is a chain of great spaces from six types, the fights in pockets of 15 to 30 m, ordinary rooms off them; a lesser gate 1 to 4 spaces, a great gate 6 to 9. On #421, 18 Oct: **"A, gates 3 m (6 m ceiling), forts and lairs 2.5 m."** On #417, 18 Oct: a broken gate's floating stones **hang still, and you can stand on them.** This sheet builds #421 and #448 as one, since both rewrite the same three files.

## Today

`makeDungeon(size, seed)` (`52-dungeon-gen.js`) drops 3 to 36 rooms of 3 to 12 cells on a square grid of 14 to 54 cells and joins each to the next in x order with an L-shaped corridor one cell wide. `buildDungeon(portal)` (`56-dungeon-build.js`) picks the generator through `FORT_INTERIORS` by `fortShapeFor(portal)` (a gate is `cave`, a fort one of three `fort_*`), adds a floor (`addUpperFloor`), walls every open cell under one flat ceiling (`dunFloorHeight`: 3.2, or 4.4 in a dragon's lair) and places foes, traps, chests, doors and keys. A cell is one unit: `dSolid` reads `map[floor(z+.5)][floor(x+.5)]`, so a corridor is 1 m wide for a 1.8 m body. Foes wake on `canSeePlayer(e, dist, 8)` with a line of sight stepped through `dSolid`, and forget you past 14 (the dungeon foe tick in `90-main.js`); unaware, they wander 2 m round `homeX/homeZ`. A gate's school is `portal.theme` (`GATE_SCHOOLS`, five built). A gate has no condition: steady, failing and catastrophic exist only in the canon and the gate kit's prototype (`gatekit.js`, every piece at the nave's measures in all three).

## The numbers

### The cell and the ceilings (#421)

| Kind | Cell | Ceiling | Reasoning |
|---|---|---|---|
| Old gate, side rooms and corridors | 3 m | 6 m | a corridor 3 m, a room 9 to 36 m |
| Old gate, great spaces | 3 m | by type (below) | the spaces sit on the same grid; only the ceiling differs |
| Fort interiors (`fort_*`) | 2.5 m | 3.6 | Michael's A; 3.6 clears a jump to 2.6 (F2b) |
| Lairs and dens (`portal.lair`, the cloak's den) | 2.5 m | 3.6; 5.5 with a dragon | the F2b sheet's lair height for a wyrm that stands 4.5 |

The build follows F2a's rooms: everything is laid out in cells, and at the end of `buildDungeon` one pass scales the dungeon whole by its cell, with every record of it (solids, `FOOTHOLDS`, `DUNGEON_COLUMNS`, `DUNGEON_PROPS`, foes' places and homes, traps, chests, doors, keys, stairs, the entrance). `dSolid` and the minimap divide by the cell before they read the map. The cell comes from the portal's kind: two constants, not a saved field.

### The six spaces, in cells of 3 m

| Space | Footprint | Height | Pockets | Notes |
|---|---|---|---|---|
| Nave | 9 cells wide (27 m) × 34 to 84 (100 to 250 m) | vault 40 to 50 m | a bay between piers every 14 m; 2 to 4 side chapels of 3 × 4 cells | piers are `DUNGEON_COLUMNS` of radius 2 (the kit's 4 m pier); aisles 2 cells either side |
| Crossing | 13 × 13 (39 m) | dome 45 m | the four arms' mouths | the hub, two or more ways out |
| Stair hall | 10 wide (30 m), 2 to 3 flights | 4.2 m a flight | each landing (4 cells deep) | 23 risers of 0.18 on 0.30 treads, 3 cells a flight; `FOOTHOLDS` |
| Chasm | 20 to 40 cells across (60 to 120 m) | drop 25 m or more | the piers between spans | the kit's 16 m bridges; a fall past 21 m kills (F2b), so the floor is never reached alive |
| Flooded hall | 10 × 27 (30 × 80 m) | 30 m | islands of slabs, 2 to 3 per hall | wade 0.9 m on the way, swim past 1.4 in the channels (F2b); half of Uisce's spaces |
| Ring chamber | 20 × 20 (60 m) | ring 30 to 40 m | the dais, 10 m | always last: a lesser gate's sigil, a great gate's knot (#292 A) |

A nave's length is rolled by the gate's size (tiny and small 100 to 130 m, medium and large 130 to 180, massive and great 180 to 250), so the 250 m hall belongs to the big gates. At a jog (3.83 m/s) 250 m is 65 s; with pockets every 50 m at most, no stretch of floor is empty longer than 13 s.

### Grids and counts by gate

| Gate | Grid | Floors | Spaces (and the ring) | Side rooms | Foes | Layouts drawn from |
|---|---|---|---|---|---|---|
| Lesser, tiny/small | 48 cells (144 m) | 1 | 1 | 3 to 6 | 5 to 9 | linear descent |
| Lesser, medium/large | 64 (192 m) | 1 | 2 to 3 | 6 to 12 | 14 to 20 | linear, hub with shortcuts, ring of loops |
| Lesser, massive | 90 (270 m) | 2 | 4 | 12 to 18 | 30 | any of the six |
| Great | 120 (360 m) | 3 | 6 to 9 | 18 to 30 | 45 to 60 | any of the six, the school's first (below) |

The lesser gates keep today's `en`, so enemies by place keeps its tables. Seven foes in ten stand in pockets, 2 to 4 a pocket.

The six layouts are OG-126's graphs: linear descent, branching labyrinth, hub with shortcuts back, vertical complex, ring of loops, cave network, rolled by seed. A great gate takes its school's first: Gaoth vertical, Cloch hub, Scáth labyrinth, Uisce ring of loops, Tine linear descent, Solas hub; a lesser massive gate rolls freely. Spaces join through **thresholds**: a slit door (1 cell wide, 8 m high), a stair hall, or a bridge, never a corridor. Side rooms hang off a space's aisles by today's L corridors at the 3 m cell, so chests, keys and locked doors keep their code.

### Pockets and the leash

| Rule | Value | Reasoning |
|---|---|---|
| Pocket radius | 7.5 to 15 m | a claymore fight with two foes needs about 12 m |
| Spacing along the way | 50 m at most, 25 m at least | 13 s of walking between fights; two pockets never wake as one |
| Waking | dungeon sight stays 8 (F2b); a foe that alerts wakes its pocket | a bay fights together, as Stormveil's landings do in Elden Ring |
| Archers on a balcony | sight 20 | they cover the bay below and the next, so the long hall has a threat at range |
| The leash | the pocket's radius + 10 m | past it the foe walks home, keeping its wounds, so running back and forth never resets a fight |
| Forgetting | today's 14 m, or the leash, whichever comes first | a nave must not drag its whole hall after you |

The leash is new to the dungeon tick (`e.pocket`, set at spawn); a foe leashes from its pocket and chases through `targetOf(e)`, per the co-op rules.

### Condition

A gate's condition is rolled from its seed (an authored or great gate names its own), never saved: `portal.cond`, one of steady, failing, catastrophic.

| Condition | The kit | What it does to the way |
|---|---|---|
| Steady | whole | every span and floor in place |
| Failing | cracked and leaning | one bridge span in three is gone; gaps in the nave's floor of 1 to 2 cells; another way round always exists |
| Catastrophic | broken | spans gone, the floating stones (#417 A) the way over: still footholds keyed by place |

The rule that keeps it fair is platforming's: nothing on the way to the ring needs a skill. Every gap on the one path the generator proves is under 2.5 m (anyone's running jump); gaps of 3 to 3.4 (a trained jump) and 4 to 5 (the double jump or a word) only ever offer a shorter way or a chest. The great gates' foes take their failing and catastrophic forms (canon §5, OG-073) when the bodies builder has made them; until then a catastrophic gate's ring is guarded one tier up.

### Light and draws

Only your space and the spaces joined to it are drawn and lit; the rest are hidden, as a town's houses are by `houseLod`. At most **8 point lights** live at once (the nearest braziers and torches), and the script glows by its emissive colour, not by lights: three.js shades every fragment for every light, and 20 in a nave would spend v2-scope §5's laptop frame rate. A space and its neighbours stay under **200 draw calls**, a fifth of §5's 1,000 town budget, since a gate has no crowd and no sky.

## What it touches

- **Functions:** `makeDungeon` (a space pass before the rooms; the size table above), `addUpperFloor` (two or three floors joined by stair halls), `FORT_INTERIORS` and `fortShapeFor` (unchanged, but they now pick the cell), `buildDungeon` (the per-cell ceiling `dCeil`, the scaling pass, foes into pockets), `dunFloorHeight` (by kind), `dSolid`, `dColumnHit` and `dPropHit` (the cell divide), `footholdY` (stairs, galleries, floating stones), the dungeon foe tick in `90-main.js` (waking, the leash), `drawMM` (a space as its outline, revealed whole on entry), the traps in `68-dungeon-misc.js` (side rooms and thresholds only), and the dungeon's touch checks, which F2b left for this build.
- **Saves:** no new `worldState` key, so the S242 list and `SS_CHAR_WS` are untouched. A gate rebuilds from its seed; what is opened, taken or killed is keyed `<seed>:<floor>:<index>` (the co-op rule); a load inside puts you at the entrance (F2b's rule, until F13).
- **The look:** dressing the spaces by school is F5's look half; this build places plain walls and vaults, and the kit's pieces where `PKIT` has them.

## The suites

| Suite | Sets up | Measures | Passes when |
|---|---|---|---|
| `dungeonscale` (F2b's, extended) | five sizes and seeds; a gate, a fort, a lair | corridor width, room sizes, ceiling, door gap | gate 3 / 9 to 36 / 6, fort and lair 2.5 / 3.6, dragon 5.5, doors 1.2 wide |
| `gatespaces` | 20 seeds a size and the great row | spaces by type, their footprints and heights, how they join | counts and sizes inside the tables; no corridor between two spaces; the ring last |
| `gatepath` | the same seeds in all three conditions | the proven way from the entrance to the ring | it exists; every gap on it is under 2.5 m; its length at a jog, plus a minute a pocket, inside the size table's times |
| `gatepockets` | the same seeds; one nave walked with `g.spin()` | gaps between pockets; foes by pocket; who alerts | no stretch over 50 m; 70% ± 10 in pockets; one pocket wakes at a time, an archer at 20 m; a foe drawn 30 m off walks home |
| `gatedraws` | five spots per gate size, both looks | draw calls and live lights | under 200 draws, at most 8 lights |
| `gatesave` | open a chest, kill a foe, save, reload | keyed by `seed:floor:index` | both stay so; load inside sets you at the entrance |

Re-measured, not loosened: `dungeonchase`, `sleeperreach`, `fortwalk` and every suite that walks a dungeon by cell.

## Sessions

1. **Deep work, under one FREEZE of `52`, `56`, `68` and the dungeon tick:** #421's cell by kind and the scaling pass, the per-cell ceiling, the dungeon's touch checks, `dungeonscale`. This is F2b's owed session 3, carded with the next.
2. **Deep work, same card:** the space pass, the six types as plain geometry, thresholds, the layouts by seed for the lesser gates; `gatespaces`, `gatepath`.
3. **Opus (systems builder):** pockets, waking and the leash; `gatepockets`.
4. **Opus (systems builder):** condition, the failing and broken ways, floating stones as footholds, the minimap's outlines, the draws and lights; `gatedraws`, `gatesave`.
5. **Opus (systems builder):** the great gate's row (three floors, 120 cells, the school's layout, the knot's ring), once backlog A places a great gate in the world.

The look builder dresses the spaces from session 2 on, under F5.

## The open number

How often is a gate failing or broken? It sets how often you climb floating stones over gone spans instead of walking the whole hall.

- **A. Half steady, a third failing, one in seven catastrophic** (50 / 35 / 15) *(recommended)*. The whole hall stays the gate you know, one in three is a climb, and the broken one stays rare enough to mean what the canon says: a place where the binding tore.
- **B. A third each.** The platforming the broken halls offer comes up as often as the whole nave.
- **C. By how near the gate is to a great gate:** steady far off, failing within 2 km, catastrophic within 500 m. The corruption spreads from the six, so the world reads it; it costs a distance check at the roll and ties the lesser gates to backlog A's placing.
