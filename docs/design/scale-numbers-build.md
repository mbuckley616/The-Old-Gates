# F2b — the gameplay numbers at true scale (build sheet)

*The systems designer, 14 Oct 2026. A build sheet: it turns a design Michael has already chosen into numbers. It re-asks nothing; its one open number is at the foot, with a DECISION.*

## What Michael chose

> **Michael (12 Oct 2026):** "be mindful of the proportions of our humanoids meshing well with the proportions of everything else in the world. Houses and buildings especially need to match."

The rule that came of it is `visual-foundation.md` §1: one unit is one metre, people are 1.55 to 1.95 m with the eye at 1.65, and the world's distances and speeds stay as they are. On 13 Oct Michael's **3 A** on *What ships in 2.0?* accepted the split of F2 (`v2-scope.md` §3). **F2a**, a deep-work card, makes the `SCALE` table, the people, the eye, the camera and the interiors. **F2b**, this page, re-measures every number the game tuned in units against a 1.1 m person. F2b runs after F2a merges and after combat's resolver (`v2-scope.md` §7), so the resolver's attack table takes this page's reach column once and is not tuned twice.

## Today

The player is a 1.1 m body with the eye at `EYE_STAND` 0.92. Melee is one number for every weapon: a hit lands within 2.2 units of your centre inside a 117° cone (`_resolveZoneStrike`, `_resolveDungeonStrike`), 3.0 against a boss; the shove (`BASH_RANGE`) reaches 2.0. A foe engages inside 1.1 and its blow lands within `STRIKE_ARC` (1.6, 90°) or `STRIKE_SWEEP` (2.4, 140°) (`74-strikes.js`). Every distance is centre to centre, so a troll's body counts for nothing.

Sight and sound are tuned to the world: foes see 20 in the open world, 9 in the legacy zones, 8 in dungeons (`canSeePlayer`), and hear you at 3 walking, 1 sneaking, 0.5 still; a witness sees 12 (11 hooded), 6 indoors, and hears within 2 (`witnessOf`); lock-on takes 14 and breaks at 20. Movement is near metres already: the jump (`JUMP_VEL` 5.5, `GRAVITY` 18) peaks at 0.84 in 0.61 s, falls are free to 4 and then 6% a unit (`FALL_FREE`, Session 429), the roll goes 2.6. `STEP_UP` is 0.62, so you walk onto a bench. You swim where the floor lies 0.40 under the surface (`SWIM_Y`, `85-world-sea.js`): knee-deep on a 1.8 m person. A dungeon cell is one unit, so a corridor is 1 wide under a 3.2 ceiling (`makeDungeon`, `dSolid`, `DUN_FLOOR_H`), props padded by a `PLAYER_R` of 0.22. A deck stands 1.0 over the sea (`DECK_Y`); the wheel answers within 2.4 (`nearWheel`), the hatch within 2.2.

## The rule

Every number is one of three kinds:
- **The body's.** It follows the person: reach, touch, step, stance in the water, the corridor a body fits. These change, and they are all measured from the edge of a body (its *hull*, the capsule radius the builder gives every genome in F4), never centre to centre.
- **The world's.** Sight, hearing, lock-on and the speeds are distances a real person would judge in real metres, so they keep their values. A witness 12 m away is a witness across a street.
- **Physics.** The jump and the falls are already in metres for a heroic person. They keep their values, and the places are built to them (platforming B).

## The numbers

### Reach (the resolver's attack table, one column)

Reach is from your hull to the target's hull. The cone stays at 117°. The hulls: you 0.30; a townsperson, bandit or skeleton 0.30; a goblin 0.25; a wolf 0.35; a spider or a bear 0.6; a troll 0.8. F4 gives each family's real value, and the test reads it from the built body.

| Weapon class | Today, centre to centre | Reach, hull to hull | Why |
|---|---|---|---|
| Fists | 2.2 | 0.9 | an arm and a half-step; a punch is a close thing |
| Dagger | 2.2 | 1.2 | the shortest blade asks you in, which is the dagger's trade |
| Sword, scimitar, mace | 2.2 | 1.6 | arm 0.75 plus blade 0.8, with a lean |
| Longsword, flail | 2.2 | 1.8 | longer haft or chain |
| Great club, war hammer | 2.2 | 1.9 | two hands, a longer haft, a slower swing |
| Claymore, great axe | 2.2 | 2.2 | the two-handers' reach, which the cleave already pays for |
| Shove (`BASH_RANGE`) | 2.0 | 0.8 | shield to chest |
| Against a boss | 3.0 | the boss's hull plus the weapon's reach | the troll's 0.8 hull does what the flat 3.0 did |

Against a townsperson a sword now lands at 2.2 centre to centre, which is today's number. One-handers stay where they feel right, the two-handers gain 0.6, and the dagger loses 0.4. Precedent: Skyrim's melee is about 2 m with a 1.3 multiplier on the greatsword. Elden Ring's straight sword against its greatsword is the same ratio. The weapons differ by reach, as combat B's attack table wants.

### Foes' reach

| Foe | Today | Engage at (hull to hull) | Blow lands within | Why |
|---|---|---|---|---|
| Armed humanoid | engage 1.1, hit 1.6 / 90° | 1.2 | weapon's reach above, 90° | they swing your weapons |
| Wolf | 1.1 / 1.6 | 0.6, then a lunge of 1.5 | 0.9 / 70° | the bite is close; the lunge is its reach |
| Spider, bear | 1.1 / 1.6 | 0.8 | 1.2 / 100° | a forelimb's length |
| Troll's sweep | 1.1 / 2.4 / 140° | 1.6 | 2.4 / 140° | a 3 m body with a club; the sweep keeps its arc |
| Faolchú (`biteRange` 2.0 to 2.8) | centre to centre | `biteRange` − 0.9 | the same | its snout is about 1.8 forward of its centre |

The tells, the parry window and the 150 ms floor are angles and times, and they do not change.

### Touch and talk

| What | Today | True scale | Why |
|---|---|---|---|
| Talk (E, plain) | 2.2 | 2.2 | a conversation's distance is real |
| Talk aimed (`keeperAimed`) | 3.2, crosshair 3.6 | 3.2, 3.6 | the same |
| Doors, boards, chairs, beds, pickups, the barber's chair | 1.1 to 1.5, by function | 1.6, one constant | an arm and a step; one number in place of eight |
| The wheel (`nearWheel`) | 2.4 | 1.6 plus aimed | you put your hands on it |
| The cabin hatch | 2.2 aimed | 2.2 aimed | unchanged |
| Floor-level things | horizontal distance | horizontal 1.6, and the eye-to-box ray within 2.4 | with the eye at 1.65, a coin at your feet is 1.7 from your eye |

### Movement

| What | Today | True scale | Why |
|---|---|---|---|
| Jump apex, time aloft | 0.84, 0.61 s | the same | about knee height, heroic and readable; the gaps at a run (2.3) and a sprint (2.9) keep platforming B's table |
| `STEP_UP` | 0.62 | 0.40 | over a stair (0.18) and a kerb, but not onto a chair (0.45), a bed (0.5) or a table (0.75), which you now jump onto |
| The mantle (platforming B, not built) | 0.62 to 1.1 | 0.40 to 1.6 | a ledge at the chest, pulled up from a jump; 0.5 s, no stamina |
| *Catch*, Acrobatics 25 | 1.6 | 2.2 | the hands at full stretch above a jump |
| Highest ledge anyone reaches | about 3.4 | about 4.0 (apex 1.77 with *Second wind*, plus 2.2) | the double jump's own numbers are the next sheet |
| Town walls, fort curtains | 3.6 or a flag | 4.5 or the no-mantle flag | half a metre over the highest reach |
| Fall damage | free to 4, 6% a unit, death about 21 | the same | 4 m is four apexes, and 21 m is a seven-storey fall |
| Roll | 2.6 in 0.45 s | the same | the speeds stay |
| Body radius (`PLAYER_R`) | 0.22 | 0.30 | shoulders 0.45 wide, with clearance |
| Crouched sight line indoors (`intSightLine`, eye at 1.1) | 1.1 | 1.6 standing, 1.1 crouched | a counter (0.95) hides you only crouched |

### Water

| What | Today | True scale | Why |
|---|---|---|---|
| Swim when the water is deeper than | 0.40 | 1.40 | chest-deep on a 1.8 m body |
| The feet while swimming (`SWIM_Y`) | `SEA_Y` − 0.35 | `SEA_Y` − 1.45 | the eye 0.20 over the water, as a swimmer's is |
| Under water (`cameraUnderwater`) | `jumpY` + 0.92 | `jumpY` + the eye | the eye, wherever F2a puts it |
| A diver's floor clearance (`DIVE.depth`) | bed + 0.55 | bed + 0.90 | a body lying in the water |
| Wading | none | none | no design asks for a slowdown, and this page adds none |

The sea's shallows are carved in metres already, so a bay with a 1 m floor that you swim across today you will now wade across. That is the rule doing its work, not a bug.

### Sight, hearing, lock-on: unchanged, with one exception

Foe sight (20 / 9 / 8), witness 12 / 11, indoors 6, the night's and sneaking's halves, hearing at 3 and 1 walking, `WIT_HEAR` 2, and lock-on 14 / 20 all keep their values. A witness, a wolf and a guard judge distance in metres. The exception is hearing while you stand still (`HEARING_RADIUS`). It goes from 0.5 to 0.9, because at true scale two bodies touch at 0.6 centre to centre. 0.5 would let you stand inside a guard unheard.

### Places

| What | Today | True scale | Why |
|---|---|---|---|
| Dungeon grid cell | 1 | **the open number**, recommended 2.5 | below |
| Corridor (one cell), rooms (3 to 12 cells) | 1 wide; 3 to 12 | 2.5 wide; 7.5 to 30 | the foundation's fighting pockets are 15 to 30 m |
| Dungeon ceiling (`DUN_FLOOR_H`), lair (`LAIR_FLOOR_H`) | 3.2, 4.4 | 3.6, 5.5 | a 1.8 m body jumping to 2.6 does not brush it; `FLOOR2_Y` −5 still clears |
| Dungeon doors | one cell | 1.2 wide in the cell's middle, 2.2 high | the frame from the `SCALE` table |
| Ship's rail above the deck | varies | 1.0 | waist height, so you cannot walk off a rolling deck |
| Cabin headroom | varies | 2.0 at least | the foundation's door |
| Hull lengths and freeboard | sloop 13 to galleon 22; `DECK_Y` 1.0 | the lengths stay; freeboard is F11's | hulls are F11's lines |

## What it touches

- **Functions and constants:** `_resolveZoneStrike`, `_resolveDungeonStrike`, `BASH_RANGE`, `strikeArc` and `STRIKE_ARC`/`STRIKE_SWEEP`, the engage tests in `tickZoneEnemies` and the dungeon foe tick in `90-main.js`, `canSeePlayer`'s `HEARING_RADIUS`, `STEP_UP`, `PLAYER_R`, the fall block (unchanged; its suite re-runs), `SWIM_Y`, `isSwimming`, `cameraUnderwater`, `DIVE`, `nearWheel`, the touch checks in `interact` and `84-world-interiors.js`, `intSightLine`, `makeDungeon`'s cell and `dSolid`'s cell lookup, `DUN_FLOOR_H`, `LAIR_FLOOR_H`. One new constant, `TOUCH` (1.6), for the eight touch ranges. One new body field, `hullR`, set by the builder on every rig, the player included.
- **Saves:** no new `worldState` key, so the S242 list and `SS_CHAR_WS` are untouched. A dungeon saved mid-run keeps its seed, and the grid rebuilds at the new cell. A position saved inside a dungeon in old cells is F13's work (old saves into 2.0); until then a load inside a dungeon puts you at its entrance.
- **Co-op:** reach and hull are read from the two bodies, so a friend's hits use the same rule. `targetOf` is unchanged.
- **Panels:** none. The lock-on mark and the prompts read the new ranges by name.

## The suites

| Rule | Set up | Measure | Pass |
|---|---|---|---|
| `reachtable` (new) | each weapon class against a townsperson, a wolf and a troll, stepped in by 0.05 | the first distance that lands | within 0.05 of the hull-to-hull table, all 8 classes × 3 foes |
| `foereach` (new) | each family engages a still player | the engage distance and the blow's reach and arc | the foes' table, ±0.05 and ±2° |
| `stepup` (new) | a stair, a chair, a bed, a table in a room | which are walked onto | the stair yes; chair, bed and table no; the table yes from a jump |
| `swimdepth` (new) | the player walked into a shelving shore | the depth where `isSwimming` turns true; the eye over the water | 1.40 ±0.05; 0.20 ±0.05 |
| `touchrange` (new) | a door, a board, a chair, a coin on the floor | the furthest E works | 1.6 ±0.05 horizontal; the coin by the 2.4 ray |
| `dungeonscale` (new) | five dungeon sizes, five seeds | corridor width, room sizes, ceiling, door gap | the cell × 1, 3 to 12 cells, 3.6, 1.2 |
| `stillhear` (new) | a guard facing away, the player still, stepped in | the first distance heard | 0.9 ±0.05 |
| re-measured, not loosened | `chasesight`, `witnessrange`, `streetcone`, `lockon`, `falls`, `roll`, `sleeperreach`, `keepercone`, `intreach`, `fistswing`, `bladehit`, `trolls`, `dungeonchase`, `deckprops`, `blacksail`, `netclimb`, `shipnets`, `fortwalk` | their own numbers | sight, lock-on, falls and the roll pass unchanged; reach, touch, swim and dungeon distances move to this page's values, each change named in the devlog |

## Sessions

Three Opus sessions for the systems builder, after F2a and combat's resolver merge:
1. **Reach and hulls:** the resolver's reach column, the foes' table, `hullR`, the shove and the still-hearing radius; `reachtable`, `foereach`, `stillhear`, and the combat suites re-measured.
2. **The body in the world:** `STEP_UP`, `PLAYER_R`, touch, the wheel, the water and the indoor sight line; `stepup`, `touchrange`, `swimdepth`, and the sea and interior suites.
3. **The dungeon's cell:** the grid at the chosen cell, the ceilings and the door frames; `dungeonscale` and the dungeon suites. It waits on the decision below and rides with F8's look work if that has started.

The mantle and *Catch* stay platforming's sessions, built to the numbers here.

## The open number

### F2b — how wide is a dungeon's grid cell at true scale? (the designer, 2026-10-14)

Today a dungeon's corridor is one grid cell, one unit, which was about 1.6 m for the old 1.1 m person. At true scale the cell must grow. Its size sets how wide every corridor is, how big every room is, and how long a dungeon takes to walk.
- **A. 2 m.** Corridors 2 m and rooms 6 to 24 m: a crypt's squeeze, with the third-person camera tight in a corridor. A spike plate can be jumped at a run (2.3).
- **B. 2.5 m** *(recommended)*. Corridors 2.5 m and rooms 7.5 to 30 m, which matches the foundation's fighting pockets of 15 to 30 m. A claymore swings in a corridor with 1.9 m clear of your shoulders. A plate needs a sprint (2.9), which is platforming B's read for a crumbling floor. A massive dungeon is 135 m across, about 35 s at a jog.
- **C. 3 m.** Corridors 3 m and rooms 9 to 36 m, near Skyrim's ruins (its kit's corridors are about 3.6 m). It is roomy, but walks are 20% longer and the same foe count is sparser.

Recommendation: **B.** It is the smallest cell where a two-hander and the camera both fit a corridor, and it puts the rooms on the foundation's own pocket sizes. A feels cramped once the bodies are full size. C spreads the same twenty foes over a lot of empty floor.
