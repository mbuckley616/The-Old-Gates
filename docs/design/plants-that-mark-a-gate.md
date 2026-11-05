# Plants that mark a gate: reading a gate before you go in

*The systems designer, 5 Nov 2026. A proposal: nothing here is a spec until `docs/decisions.md` carries a `Michael:` line under it. Backlog L8, OG-026.*

## The problem in Michael's words
Backlog L, *Plants that mark a gate* (systems; OG-026), from his review of the concept art on 12 Oct:

> "Gatelotus, Gate Resin and Lichenbloom grow near old gates, a sign to read; Caverglow lights caves. The two-ingredient recipes and the known-and-hidden study loop (the game already has `knownDesc`/`hiddenDesc`) for when brewing is built."

Brewing is built now (Survival B, session 1), so the part still open is *a sign to read*. What should the sign say, and what should reading it be worth?

## Today
There are 26 herbs in `HERB_DEF` (`30-plants.js`), each with four effects in `HERB_FX` (`50-travel.js`). You learn them by eating and brewing, and what you know is kept in `herbsKnown()`, which belongs to the character. `spawnChunkHerbs` (`82-world-structures.js`) places 8 to 16 herbs in each 64 m chunk, chosen by biome and ground, and keys each one `<chunk>:herb:<i>`. A mainland cell of 2,400 m holds 10 to 17 old gates (`c.doors`, four on an island cell). A gate is discovered when you come within 34 m of its door (`tickDiscovery`, `worldState.wdisc`). Each gate's seed already fixes everything about it before it is built. Its school comes from `gateSchool(e)`: the theme, or Gaoth one time in six. Its condition comes from `gateCondRoll(seed)`: steady 50%, failing 35%, catastrophic 15%. One gate in three (`gateOrbDue`) holds an orb. From outside you can learn none of this: the map gives a name. You find out a gate's school, and whether it is broken, only once you are inside. No herb grows in a gate, lair or den, and the dark there is lit only by the light pool and your torch. The canon already has the sign itself: the Greenmeadow, "where heartroot, firemoss, and silverleaf grow in unusual concentrations … Plants grow slightly too large … It is directly above a dungeon network."

What it would inform: magic B puts a school's words in its own gates' carvings, and a failing or catastrophic gate holds floating stones, gone spans and the gate stone figurehead (S1734). Today the choice of gate is made blind.

## Direction A: three more herbs
**The loop.** Near a gate you find three new herbs, and Caverglow grows on cave walls. Each is an ingredient with four effects. They tell you nothing; they are just rarer things to pick near gates.

**Rules.** Each old gate gets 6 to 10 plants of one kind (chosen by its seed) in a ring 20 to 80 m from the door, keyed `<seed>:gp:<i>`. They are spawned with the door's stamp, not by the chunk, so they never depend on what has loaded (S533's rule). Caverglow grows 4 to 8 to a lair or den floor, keyed `<seed>:<floor>:cg:<i>`. Every one takes four effects from the fifteen that sit on only four herbs today (Night Eye, Water Breathing, Featherfall, Quiet and the rest), so `herbpool`'s 4 to 7 still holds. None is sold.

**Touches.** `HERB_DEF`, `HERB_FX`, `HERB_PLACE`; the door placement in `82-world-structures.js`; `furnBuild` for Caverglow; `worldState.picked` (the world's) for picked dungeon plants. **Cost.** One systems session, plus the bodies builder's four meshes.

## Direction B: the ground tells you the gate (recommended)
**The loop.** Crossing country, you walk into gold lichen in flower on the stones; last time that meant a quiet Solas gate, every span whole. Two valleys over, blue lotus blooms in dry grass and the herbs stand a hand too tall: a failing gate of Uisce, its carvings Uisce words, its floors broken. Before you see either door, you choose which gets your evening.

**Rules.**

| What the plant says | How | Why |
|---|---|---|
| The condition | **Lichenbloom** for steady, **Gatelotus** for failing, **Gate Resin** for catastrophic | Three plants for three conditions. The backlog names exactly three. |
| The school | the bloom or bead takes the school's colour: Tine red, Uisce blue, Cloch brown, Scáth purple, Solas gold, Gaoth grey | These are the implements' emblem colours (Session 1856), which the player has already seen at the guild. |
| The one wrong thing | lichen flowering; a water lotus blooming on dry ground; resin weeping out of bare stone as well as trunks. Nothing lit | This is Michael's B on small wrongnesses (#1005): one impossible element each, found by looking. |
| Where | 6 to 10 plants, 20 to 80 m from the door, on the plant's ground (Lichenbloom on rock, Gatelotus in the open, Resin on trees and rock) | They are seen before the 34 m discovery: a gate is near, and it is this kind. |
| The Greenmeadow | around a failing or catastrophic gate, ordinary herbs within 60 m grow at ×1.3; around a catastrophic one Gate Resin's ring reaches 120 m | This is the canon's sign, word for word. The scale is cosmetic and changes no outcome. |
| Learning to read | the first time you enter a gate after picking its plant within the hour, you learn that plant's meaning (`herbsKnown().read`, the character's) | This is Morrowind's habit of learning by doing. The examine line changes from "a lotus, blooming in dry grass" to "Gatelotus, blue: a failing gate of Uisce is near". |
| What reading gives | once you know a plant, a discovered gate's hover card and map entry show its condition and school | The world's notes get written in by what you have learned, not handed out free. |
| What it never tells | whether the gate keeps an orb, or which word its carving holds | The prize stays a find (see *Not asked*). |
| Effects | four from the pool for each plant. Each carries **Night Eye** or **Featherfall**, the two a gate's dark and broken floors ask for, so a gate's own ground stocks you for it | `herbpool` holds at 4 to 7 per effect: 15 effects sit at 4 today. |
| Caverglow | grows on the walls of lairs, dens and caverns, 4 to 8 patches to a floor, **along the path from the entrance to the deepest room** (`bfs` in cells, then `dAt`). It is lit from its own parts and adds no point light (the pool stays at 8) | It lights caves, and it shows the way in. Picking it gives you Night Eye and takes away the way back. That is a small choice with a visible cost. |
| Price | Lichenbloom 12, Gatelotus 20, Gate Resin 30, Caverglow 15; none of them in shops | Rarity follows condition. At the apothecary's sale rate (40% for a brew) they are never a money printer. |

**Touches.** `HERB_DEF`, `HERB_FX`, `HERB_PLACE`. The gate plants are placed beside `dungeonWorldPos` in the door's placement, reading the school and condition from the seed (`gateSchool`, `gateCondRoll`). The size is read from neighbouring cells through `getCell`, never from `CELL_DOORS` (S533). Caverglow goes in `56-dungeon-build.js`, and is kept away from the gate kit's spaces (gates are lit by the condition's light, #1147). `learnHerbFx` gets a sibling, `learnGateRead(kind)`, the named action. `herbsKnown` is already in `SS_CHAR_WS` and on the S242 list, so `read` rides in it and needs no new key. Picked gate plants respawn like any herb. Picked Caverglow uses `worldState.picked` (the world's) keyed by seed, floor and index. The hover card and `drawLocalMap` read `read`. The brewing page needs nothing new. Co-op: the reading is the character's, the gates the host's.

**Conflicts.** None with a decision; L7's gate compass finds gates, while B reads one you are already near.

**Cost.** Two systems sessions: (1) the plants, placement, effects, Greenmeadow scale and `read`; (2) Caverglow on the path, its keys, and the hover card and map lines. The bodies builder owes four plant meshes in the plant kit at #855 C's lifted size, six tints each. That is one session, and it blocks nothing: stand-ins work until it lands.

## Direction C: B, and a brew that finds gates
**The loop.** It is B, plus the plants carrying a 23rd effect, **Gate Sense**. Any two gate plants brewed together make it. For 10 game-minutes × the Alchemy curve, the compass shows the nearest undiscovered old gate within 600 m.

**Rules.** Gate Sense is on all four gate plants, and only on them. It ends early when you discover the gate. Its price is 45.

**Touches.** Everything in B, plus a new `ALCH_FX` row, the compass's marker code (`88-world-ticks.js` markers), and the `herbpool` suite's pool size. **Cost.** Two and a half systems sessions.

**Against.** With 10 to 17 gates to a cell, a 600 m pointer turns finding gates into a fetch. The brief says an inferred world, never spoon-fed, and the gate compass is already a candidate object for L7.

## Recommendation
**B.** It turns four plants into a decision. You pick your gate by its school and its state before you commit an evening to it. That is the brief's first feeling, at the size of one night's play. It makes reading the land a skill the character learns (Morrowind), not a label the map gives out. It writes the canon's Greenmeadow into the rules as it stands. And it obeys Michael's two calls on the world's strangeness: one wrong element, nothing lit (#1005); glow only from the herb's own parts (#855). A has no sign in it; C's pointer works against the exploration B rewards.

## What must be true first
- Survival B's brewing (built), and `herbpool`'s counts kept at 4 to 7.
- `gateSchool` and `gateCondRoll` stay readable from the seed without building the gate. They are today. The great gates take their school from `greatSchoolOf` and their condition from the two paths, and they get no ring; their own approach is F5's.
- #1147, the light a gate's condition casts. It does not block B: the plants stand outside, and Caverglow is kept out of gate spaces whichever way #1147 goes.

## Not asked
- **Plants that tell the orb or the carving's word.** One gate in three keeps an orb, and the guild sells the word list. If the field read those too, the inside of a gate would be a receipt.
- **Plants that change with the two paths.** A torn great gate's leak is the corruption stage's (`visual-foundation.md`). Tying lesser gates' plants to it would reach into the great gates' sheet, so it waits for that sheet's builder.
- **Recipes by name** (OG-097's eight samples). The four-effect pool already makes recipes. Names are the quest writer's, if wanted.
