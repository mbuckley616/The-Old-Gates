# Platforming

*The systems designer, 2 Oct 2026. A proposal, not a spec: nothing here is built until docs/decisions.md carries a `Michael:` line under it.*

## The problem in Michael's words
> "Platforming: with better movement, places that need it — scaling a tower, crossing a chasm, jumping a dungeon trap." (backlog J)

The brief's third feeling asks for "movement good enough to build platforming on", and the second for progression you can feel. Acrobatics' perks (your Morrowind book), magic B's movement words (Éan, the Cloch pillar, the Gaoth updraft, the frozen wave) and survival B's felled trunk all need places that ask for them, and the world has none.

## Today
The jump is `JUMP_VEL` 5.5 against `GRAVITY` 18 in the loop (`90-main.js`): an apex of 0.84 units (eye height is 0.92) and 0.61 s in the air, so 2.3 units of gap at a run (3.83 u/s) and 2.9 at a sprint. Nothing hurts on landing: a drop of any height ends in `sndLand` and a 0.06 shake. Indoors and in dungeons the ground has height: `FOOTHOLDS` and `footholdY` pick the highest surface within `STEP_UP` (0.62) of your feet, and `INT_SOL` solids carry a `y0/y1` band, so you can jump onto a table or fall off a gallery. In the open world the ground has no height of its own: a chunk's `sol` boxes and `STATIC_SOL` are flat footprints that only block (`solidAt`), so a rock, a wall or a fallen pillar cannot be stood on, and `ZONES.world.platforms` (the bridges, the spire's roof) are regions that lift you to their height wherever you stand under them. Dungeon corridors have spike plates and swinging blades (`D_TRAPS`), walked round rather than jumped. No ledge grab, no climbing, no skill behind any of it yet.

## The numbers every direction shares

| Who | Jump speed | Apex | Gap at a sprint |
|---|---|---|---|
| Anyone today | 5.5 | 0.84 | 2.9 |
| Acrobatics 100 (the skills page) | 6.6 | 1.21 | 3.4 |
| + *Second wind* (Acrobatics 50: 4.5 more at the top) | — | 1.77 | 5.0 |
| Éan worn (+70% height) | 7.2 | 1.43 | 3.7 |

The world is then built to steps of that table, so a gap reads: under 2.5 anyone, 3–3.4 a trained jumper, 4–5 the double jump or a word, over 5.5 a trunk, a frozen wave or the long way round.

- **The mantle**, everyone's: jump at an edge whose top is 0.62–1.1 units above your feet and you pull up onto it in 0.5 s (no stamina). *Catch* at Acrobatics 25 raises it to 1.6 and catches an edge while falling. Reach with everything: 1.77 + 1.6, about 3.4 units, so town walls and fort curtains stay at 3.6 or more, or carry a no-mantle flag, and the night watch keeps its gates.
- **Falls** hurt: free up to 4 units (four times the apex: nobody is hurt by their own jump), then 6% of your health a unit beyond, so a drop of about 21 units from full is death and a reload. A roll begun within 0.2 s of landing halves it. *Cat's fall* at Acrobatics 75 moves the free height to 8; Éan's *Wingless* removes it, as the canon says.
- **Acrobatics 100**, *Light foot*: at a sprint, pressure plates and crumbling floors do not trigger.
- A use for Acrobatics is a jump that lands higher than it left or clears a gap over 2 units, once a second, as the skills page set.

## Directions

### A. The honest jump — the movement, and the three places you named
**The loop.** The world gets tops: climb rubble to a broken wall, run along it, drop behind the bandits. Three places are built by hand to Michael's three examples: Greywatch's broken tower climbed from outside to a cache at the top; a gorge on the Bealach where the old road's bridge is down to three stones (gaps of 2.4, 3.2 and 4.6); one dungeon room type, the pit of pillars, where a miss drops you to the floor below (5 units: about 6% of your health and the stairs back up).
**Touches.** The world's solids get heights: every builder in `80-world.js` that pushes to a chunk's `sol` gives it a top, `solidAt` and `camSolid` take your feet's height, and `ZONES.world.platforms` take the foothold rule (highest within a step of your feet). That is the indoor rule of Session 11 carried outdoors. The jump block in `90-main.js` (the mantle, the fall), `startRoll` for the landing roll, `tpPose` and the viewmodel for a mantle pose.
**Conflicts.** None decided. Three places is a showcase, not a world: the perks would open three things.
**Cost.** One Fable session (heights for the world's solids, cross-cutting every builder) and two Opus sessions (the mantle, falls and landing roll; the three places).

### B. Places by the generator, each with more than one way across
**The loop.** A, then the continent and the dungeons are seeded with places that ask, as the rocks and shrines are seeded now. You see a cache on a cliff shelf or a broken bridge, read the gap against what you have (a sprint, the double jump, Éan, a felled tree, the ford a mile down) and pick. Nothing on the main quest's path needs a skill, only offers a shorter way; what sits at the end is optional: a cache from the loot tables, a carving for the magic quest, a view that marks the sites within 400 units on the compass.

| Kind | Where | What it asks | Seeding |
|---|---|---|---|
| Broken tower | the existing `tower` and `ruin` sites, forts | a climb of 6–12 units by rubble, beams and mantles | every tower and fort |
| Gorge crossing | a road over a river channel | one to three gaps from the table | one in four river crossings off the main roads |
| Cliff shelf | ridges and coast cliffs | a ledge 1.6–3.4 up, then a step | 1–2 a cell |
| Pit of pillars | dungeon room type | gaps of 2–3.4; a miss is a fall to the floor below | one in five dungeons |
| Crumbling floor | dungeon corridor | plates that fall 0.6 s after you step on; sprint across or jump the plate | with the spike plates in `D_TRAPS` |
| Blade run | dungeon corridor | today's swinging blade, timed, over a gap | one in three corridors with a blade |

**Rules.** Each place is built from the table's steps, never between them, so it reads. A crumbling floor regrows when you leave the dungeon. A friend in your world sees the same fallen plates: they are the host's state, as doors are.
**Touches.** A's, plus the cell generator's site kinds (`gorge`, `shelf`), `buildTower` and the fort exteriors in `24-forts.js` for the outside climb, `makeDungeon` and `buildDungeon` for two room types, `D_TRAPS` and `tickDungeonTraps` for the crumbling floor. The caches' looted flags in `worldState`, which means the S242 list in `_applyLoadData`.
**Conflicts.** The skills session must land Acrobatics before the places can teach it; until then they are built to today's numbers plus the mantle, and the long gaps wait.
**Cost.** One Fable session and five Opus: A's three, then dungeon rooms and traps, then the world's site kinds.

### C. Climbing
**The loop.** B, plus surfaces you climb: ivy, rough-hewn stone, rope and the cliffs, at 1 unit a second against a climb stamina drain of 8 a second (Athletics lowers it), a jump off the wall at the top. Precedent: Breath of the Wild's anywhere-climb is what made its world a puzzle.
**Conflicts.** Every wall stops being an answer: town walls, the guards' gates, a burgled house's upper window, a fort's single door. Each would need a rule against it, and the decisions-with-consequences feeling lives in those doors. Climbing is a new family of poses on the 17-bone rig and one more state to sync for a friend.
**Cost.** One Fable and seven Opus sessions, and a look session for the poses.

## Recommendation
**B.** It is the only one where your Acrobatics perks, the movement words of magic B and the felled trunk of survival B each open something across the whole continent, and where the same gap has three answers, so the skill you trained is a way through rather than a gate. A is B's first three sessions; alone it gives the perks nothing to do. C costs the walls the town systems stand on. Precedent: Elden Ring has no climb and no double jump until Torrent, yet its ruins are platforming because the ruins were built to its jump; that is the move here.

## What must be true first
- **Heights for the world's solids** (the Fable session) comes before any place: without it nothing outdoors can be stood on.
- **The skills sessions** for Acrobatics and its perks; the places can be built first to today's numbers.
- **Magic B's words and Woodcutting 25** are answers, not prerequisites.
- Town and fort walls kept above the reach of the table, checked in the Fable session.

## Not asked
No climbing anywhere (C, and why). No grappling hook or rope item: the trunk and the frozen wave already make bridges. No timed jump puzzles on the main quest's path, and no death traps: a fall in a dungeon costs health, not a reload, unless it is over twenty units. No swimming changes; the skills page owns them. No platforming on ships, whose deck rolls under sailing A.
