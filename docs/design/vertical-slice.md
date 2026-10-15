# The 2.0 vertical slice: one town and its country in the new look, with the new fight

*The systems designer, 14 Oct 2026. A proposal: it raises one decision with two questions, which town and which tier. Nothing here is a spec until `decisions.md` carries Michael's line under it.*

## The problem in Michael's words

> **Michael (in chat, 14 Oct 2026):** "have the designer draft a vertical-slice milestone (one region and its town in the new look, plus combat's resolver) and raise it as a decision so I can pick the town and what's in it."

The cutover (F14) is weeks away, and every piece of the new look so far is a prototype page under `docs/prototypes/levelup/`. Michael wants to play the new look and the new fight before the cutover. The slice is a milestone on the road to 2.0, not a fork of it. Everything it builds is part of an F card or the core loop, in `v2-scope.md` §7's order where it can be, so nothing is thrown away at the cutover.

## Today

`?look=new` (F1, Session 822) boots the same game on three.js 0.170. The world, the towns and the bodies are still the old builders' work. F2a, the scale pass (PR #315, under FREEZE #297), is open. Until it merges, every builder works in the prototypes only.

The prototypes already cover much of one island:
- **F6, buildings as pieces:** the Gatelands' coloured towns by lot (Michael's A on #280), the Mark's halls (#277, C), and Aurenne's houses, church, tithe house, warehouse and academy.
- **F8, places that are not gates:** the Markish mine (#305), the Gatelands' round cairn (#309) and the smugglers' sea cave (#314, A). The limestone cave and the sea cave were rebuilt at 64 m and 52 m after Michael's size notes.
- **F9, rooms:** the Gatelands cottage (#303), the Mark's longhouse (#311), and the three inns and Aurenne's dyer's flat, whose decisions are pending.
- **F11, hulls:** the Gatelands sloop (#306), cog and galleon, the Mark's cutter (#312), and Aurenne's caravel.

The game has two strike resolvers, `_resolveZoneStrike` and `_resolveDungeonStrike`. Combat B's attack table and its one resolver are a deep-work card that has not started (`combat.md`; `v2-scope.md` §4).

One fault stands in the way of any slice. On 0.170 every skinned body is culled away (the critic, 14 Oct, filed in backlog I). The people, the foes and your own body vanish because three.js r151+ gives `SkinnedMesh` a bounding sphere in world coordinates. The fix is a few lines in `05-compat.js`, and it must come first.

## Directions

### The town (question 1)

| | **A. Dunmore** | **B. Portclare** | **C. A Markish town** |
|---|---|---|---|
| Island, region | Gatelands, the walled crossroads town east of the Wastes (`HOME_SITES`, 1550, 1400), 95 m pad | Gatelands, the port on the east coast (1950, 1250), 90 m pad, the quay cut through the ridge (#236) | The Mark, a generated town on the north-west island; its name comes from the seed |
| From the start | about 900 m from Ashenmoor by road | about 1,250 m, through Dunmore and down the Coastal Road | across the strait: by ship, or a start point |
| People today | 65 (`townbarrels`' probe) | 37 | not measured |
| Measured | 836 draw calls and 1.47 M triangles at noon on F1 (Session 822) | the critic's worst spot: 2.0 s a frame on software GL (29 Sep) | nothing |
| F6 pieces that serve it | the coloured town: townhouses, merchants' houses, cottages and warehouses | the same, plus the quay's warehouse | the shingle hall, with one hall in three under turf |
| F9 rooms | the cottage; the Gatelander inn (decision pending) | the cottage; the Gatelander inn | the longhouse; the Mark's inn (pending) |
| F8 place | the round cairn | the smugglers' sea cave, on this coast | the silver mine, a working site held by hostiles |
| F11 hull | none (it is inland) | the sloop, the cog and the galleon, all Gatelands, all answered or asked | the cutter |
| F3 land | the vista slice's temperate grade, autumn woods (P10b) | the same, plus the shore and F3's water | a cold grade nobody has prototyped yet |

**Dunmore** is the town nearest the player's start, and it is already measured. It cannot show the sea.

**Portclare** has the most prototypes answered, and every hull it would carry is Gatelands. `v2-scope.md` §5 sets the frame-rate budget in Portclare's square, so a slice built there measures 2.0 at its hardest spot from day one.

**The Mark** gives the best place to fight, the mine. It needs a cold land grade that does not exist, and its town has no fixed name.

### The tiers (question 2)

Every tier includes combat's resolver, the culling fix, and the land (F3) for the slice's region only, at the middle quality level.

| | **A. The town** | **B. The town and its country** | **C. Everything that sails** |
|---|---|---|---|
| The land, F3 | the town's cell and its eight neighbours, about 1.5 km square | the same | the same, plus the sea to the next headland |
| People, F4 | townsfolk from the genome | townsfolk, and the region's foes: bandits, wolves and the lair's people | the same |
| Buildings, F6 | every lot in town from the island's kit | the same, plus the road's farms and the fort on the Coastal Road (7103) | the same |
| Rooms, F9 | one: the inn | three: the inn, the cottage and one shop | three |
| A place that is not a gate, F8 | none | one: the sea cave, the cairn or the mine | one |
| The player's body | the old one, drawn on 0.170 | the old one | F10: the genome's body, first and third person |
| A ship, F11 | none | none: the hulls stand at the quay as scenery | the sloop, sailable from the quay along the coast |
| What you do | walk the town, talk, trade, fight on the road | that, plus one dungeon-length place, a lair to clear and a night at the inn | that, plus sail to the place |

**Tier B is the smallest slice with a whole evening in it.** It has a town, a road, a place to clear and a bed. It holds the brief's first three feelings in one region. It also exercises the resolver against three families, not one.

Tier C pulls F10 forward. F10 is the heaviest freeze on the board (`10`, `16`, `32`, `54`), and it cannot start before F4 merges. It also brings F11 ahead of F3's full sea.

### How Michael reaches it

The slice runs behind `?look=new&slice=1`, which a new row on the settings sheet can also set:
- **The start:** a new character starts at the town's gate at 9h. A loaded save is taken there.
- **The fence:** play is fenced to the nine cells. At the edge a line turns you back ("The road beyond is not yet made"). Fast travel and the coach offer only the slice's places.
- **The saves:** the slice keeps its own saves (slot keys prefixed `slice:`), so a save made inside it never meets a 1.x save before F13 has mapped the old units to metres. The co-op rules are untouched: the slice is a start point and a fence, and no rule of play changes.

After the cutover the fence is deleted and the start point with it. That is one Opus session for the systems builder, in `90-main.js` and `92-creator.js`. It does not fall under the world files' freeze.

The other way is a start point with no fence. It is cheaper by half a session, but outside the region the land draws in F1's old materials, and every walk past the edge breaks the picture. I don't recommend it.

### What must merge first

1. **F2a** (PR #315; FREEZE #297).
2. **The culling fix** in `05-compat.js`: one Opus session, any builder, right after F2a.
3. **Combat's resolver** (deep work, then two Opus sessions for the attack table). `v2-scope.md` §4 puts it before F2b, and this slice does too. F2b's reach column (`scale-numbers-build.md`) is the third session, so the slice fights at true reach.
4. **F6 for the island** goes into `82-world-structures.js` between F2a and F3's freeze of the world files.
5. **F3 for the region**, under its own freeze of the world files.
6. **F4's townsfolk** (FREEZE `32`, `34`), then its foes for tier B.

The slice shares those freezes and adds none of its own.

### Cost, by role, and a date at today's pace

The pace behind the dates: the look builder ran about seven sessions a day this week (Sessions 890 to 896), deep work takes one card at a time from the hourly queue, and F1 took a day.

| Role | A | B | C |
|---|---|---|---|
| Deep work | resolver 1; F3 region 2–3; F4 townsfolk 2 | + F4 foes 1 | + F10 3–4 |
| Systems builder | attack table 2; F2b reach 1; slice start and fence 1 | the same | + the sloop at true size, 1 |
| Look builder | culling fix 1; F6 in the game 3; the inn 1 | + two rooms 2; the F8 place 2; the fort and farms 1 | + F11 sloop and quay 2 |
| Bodies builder | the town's genomes and wardrobe, 2 | + bandits and wolves, 2 | + the player's armour on the new body, 2 |
| QA | the slice's suite, and the budget measured, 1 | 1 | 2 |
| **Total** | about 17 sessions | about 25 | about 35 |
| **Rough date** | 24 Oct | 28 Oct | 6 Nov |

### What it costs 2.0

Not much, because the slice is mostly 2.0's own order with a region chosen:
- F3 does its first region first, which it would do anyway, and the other islands' grades come after.
- F6, F8 and F9 put one island in the game before the rest.
- The resolver keeps its place, ahead of F2b.

The real cost is the fence and the start, one session that the cutover later deletes. Tier B also asks the bodies builder for foes before the wardrobe's other tiers, which delays OG-019's armour line by about two sessions. Tier C delays F5 (the gates) by the length of F10's freeze, about four days, because the two cannot share `32-people.js`.

## Recommendation

**Portclare, tier B.** Portclare has the most answered prototypes, its own coast for the sea cave, and the critic's worst frame. Building the slice there makes it the test of §5's budget: 45 fps at the middle level in the square at noon, measured on Michael's laptop.

Tier B gives an evening of play, the town, a road, a lair and a bed, for about 25 sessions. It touches no freeze that 2.0 was not already going to take. The ship and the new player body are the two pieces that pull heavy cards forward, and both can follow in a second milestone once F4 merges.

## What must be true first

- F2a merged.
- The culling fault fixed.
- The resolver's deep-work card queued behind F2a. The producer queues it, as v2-scope's cards need no Start.
- For tier B, the Gatelander inn's decision answered (pending).

## Not asked

- **Aurenne as the town.** It has the most F6 pieces, but no F8 place, two of its rooms are still pending, and its warm grade is unbuilt. It makes a good second slice.
- **Skills, perks and magic in the slice.** They have no build yet, and the slice must not wait on them. The level-up stays as it is.
- **The gates (F5).** A great gate is a space of 30 to 250 m and a card of its own. The slice's lair is the place to fight.
- **The quality levels' other two settings.** The slice is built at the middle level only. Streaming's three levels are a proposal still to come.
