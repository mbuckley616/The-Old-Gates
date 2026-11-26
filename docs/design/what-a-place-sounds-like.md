# What a place sounds like

*The systems designer, 26 Nov 2026. A proposal for backlog L12's* What a place sounds like *(OG-144). Nothing here is a spec until `docs/decisions.md` carries a `Michael:` line under it.*

## The problem in Michael's words

The backlog's note on OG-144: "a palette per island (wind in grass, streams and church bells; howling gusts, ravens and creaking timber; surf, gulls and a market); a village, a tavern, a keep in layers; rain muffling the world, fog damping it; footsteps by ground (stone, wood, mud, snow); a stable gate's low hum and an unstable gate's distorted whispers, so a gate's condition is heard before it is seen … The rest of the palette waits on its page." His 25 Nov notes in section D ask for a sound when picking herbs and item sounds by type.

## Today

Every sound in the game is made in code with WebAudio; the repository holds no audio file. Outside a fight, one playlist, the exploring orchestra (`EXPLORE`, `explorePlay` in `76-music.js`), plays through every peaceful place, indoors too, with the island's band on its lead voices (`ISLAND_BAND`, `musicIsland`, Session 1901) and a 2.2 s gap between pieces. Under it there is little: rain and snow as one noise loop muffled by walls (`wxAudio`, ×0.22 indoors, ×0.05 underground), thunder, the ship's sounds (`tickSeaSounds`), the falls (`tickFallsSound`, to 140 m) and foes' idle cries within 14 m (`tickMonsterSounds`). Footsteps come in four kinds: plain, snow, the hollow slab and hobnails (`tickFootsteps` in `78-placeholder-zones.js`). A dungeon has a drone by its old theme (`_musicDungeon`'s six: undead, goblin, elemental, deep, haunted, ruins), never by its school or condition, and a sigil hums within 6 m (`updateSigilHum`). Two sounds already carry a rule: a foe hears you walk at 3 m and sneak at 1 m, rain covers your steps to 2 m (1.5 m in a storm; `hearingRadius` in `10-player.js`, Michael's B on #1511), and hobnails are loud on stone and planks.

## Directions

### A. The palette: a place has a bed

**The loop.** You hear where you are before you read the map: a town 60 m out, a stream before you see it. Nothing new to do; the world is less empty to walk.

**The rules.** One new bus, *Ambience*, with its own slider on the settings sheet beside Music and Effects. Three layers, all made in code as today's rain is:

| Layer | What | How many at once |
|---|---|---|
| Bed | wind by island and height, water (the nearest stream, lake or surf within 80 m), a town's murmur | 3 loops, crossfaded over 2 s |
| Spots | a forge's hammer, a tavern's door, a bell, a mill, a fall (today's) | the nearest 4 within 40 m |
| Calls | a bird, a raven, a gull, a dog, an owl, crickets | one every 4–20 s, by palette |

The palettes, by island and hour (dawn 5–8, day, dusk 18–21, night):

| | Wind | Calls by day | Night | Town |
|---|---|---|---|---|
| Gatelands | soft, in grass and hedges | skylark, blackbird, rooks; a dawn chorus ×2 | crickets, an owl one in four | the church bell at 6, 12 and 18; a cart |
| The Mark | gusts that rise and fall every 5–10 s, stronger over 150 m | ravens, a hawk | wind alone | creaking timber, a horn at the guard's change |
| Aurenne | warm and low | gulls on the coast, cicadas from 11 to 16 in the heat | crickets, the surf | the market's voices, a fountain |

A town's murmur follows its people: the townsfolk within 40 m set its level (a hundredth each, at most 0.12), so a full square on market day is loud and a plagued town is quiet without a rule of its own. The forge's hammer keeps the forge's hours (`SHOP_HRS`, 7–17); the tavern's door spills its band's lead through a 900 Hz filter from 17 to 21 (`HRS.inn`). Rain filters the bed to 1,200 Hz at 0.6, fog to 2,000 Hz at 0.7 and halves a call's reach; a storm stops the birds. Indoors, the bed is the room: a hearth's crackle, rain on the roof as today, and the room's size as its echo (0.4 s for a cottage room, 1.2 s for a hall or a church; Skyrim's interiors do this and it is most of why a cave sounds like a cave).

Footsteps by ground, eight kinds where today has four: grass, stone, wood, gravel and shingle, sand, mud, snow, shallow water. The ground is already read (`footingAt`, `stampAt`, `specBiome`, `isInterior`, the water's depth). A herb picked sounds by its kind: a leaf torn, a root pulled, a stalk snapped.

**What it touches.** `72-audio.js` (the bus in `initAudio`, `applyVolumes`, the voices), `78-placeholder-zones.js`' `tickFootsteps`, a new `tickAmbience` in the main loop (not in `WORLD.tick`, which stops indoors: CLAUDE.md's weather gotcha), the settings sheet. No `worldState` key: the slider is a setting, and every roll is cosmetic (`Math.random`, per the co-op rules). WebAudio mixes on its own thread; the tick reads the place four times a second, as the falls do.

**Cost.** Three ordinary systems sessions: the bus, the beds and the palettes; the spots and the town; footsteps by ground and the herbs.

### B. A, and sound that tells you something *(recommended)*

**The loop.** Sound becomes a sense. You hear a failing gate before you crest the hill. You leave the shingle for the grass because the bandits are close. A torn great gate puts a faint note under the island; sealed, it goes.

**The rules,** on top of A:

| | Heard to | What |
|---|---|---|
| A steady gate | 80 m | a low hum, 55–70 Hz by school, steady |
| A failing gate | 120 m | the hum beating (two tones 4–7 Hz apart) and a whisper every 6–12 s |
| A catastrophic gate | 160 m | the beat at 3 Hz, the whispers backwards, a rumble under them |

The condition is the gate's own (`gateCondRoll`: half steady, 35% failing, 15% catastrophic), so a friend in your world hears the same gate. Inside, the drone is the school's, not the old theme's: Tine fire and ticking metal, Uisce drips and lapping water, Cloch grinding stone, Scáth near silence and whispers, Solas a high ringing, Gaoth draughts moaning through the halls (today's `sndDraught`). The condition sets how often the whispers come.

The world's undertone follows `corruptionLevel()`: nothing at 0 to 2, then a far, low note at 0.02 a level from 3 to 6, in the horizon colour's school (`corruptionTorn()`).

Your steps feed the hearing rule. Today a foe hears your walk at 3 m and your sneak at 1 m on every ground. B scales both by what is underfoot: grass, moss, sand and snow ×0.8, earth and mud ×1, stone and wood ×1.15, gravel, shingle and shallow water ×1.3. A walk on gravel is heard at 3.9 m and a sneak at 1.3; a sneak on grass is never under today's 0.9 m floor. Rain's cover multiplies with it as now, and hobnails keep their own numbers. Oblivion's and Skyrim's sneak ignore the ground (only boots' weight counts); the ground is what makes a sneak a route rather than a key held down.

The music rests. Today a piece ends and the next starts 2.2 s later, so the palette is never heard alone. B leaves 45–90 s of the place between pieces outdoors, as Morrowind and Skyrim do; indoors and in a fight it is unchanged.

**What it touches,** past A: `hearingRadius` (a ground factor beside `wxHearScale`), `_musicDungeon` (beds by school), `explorePlay`'s gap, a spot at each ring gate. No new `worldState` key: the condition and the corruption level are already the world's.

**Cost.** Five ordinary systems sessions: A's three, then the gates heard and the beds by school, then the ground in the hearing rule and the music's rest. The hearing change re-reads `sneak`, `witnessrange` and the weather suites' numbers, since every sneak in the game passes through it.

### C. B, played from recordings

As B, but birds, footsteps, crowds and the forge from about 120 CC0 field recordings (Opus at 48 kbps, 6–8 MB), bundled as `vendor/mh-pack.js` is and decoded at boot; code is good at wind, drones and hums and poor at birds and feet. It fits the 40 MB budget (`vendor/` is about 15 MB) but is the game's first weight for sound, and each clip's licence needs checking. B's five sessions plus one deep-work session for the pack and its CI check.

## Recommendation

B. A gives the world its air. B turns it into play for two sessions more: the gate heard at 120 m and the gravel under a sneak are the brief's first and second feelings in sound, and the music's rest lets three islands sound like three places. C sounds better but buys it with download; judge it once B has been walked. B's sounds are made in code, so a pack could replace them later one at a time without changing a rule.

## What must be true first

Nothing blocks A. B's gate hum wants the gates in the world (OG-037's rings, built) and reads `gateCondRoll` and `corruptionLevel()`, both built. B's hearing factor should land after F2b's ranges have settled (they have: the hearing radii are read in metres since S1035). Michael's two notes of 25 Nov (a herb's sound, items by type) need no decision and can be built before any of this; A's footstep and herb kinds give them their table.

## Not asked

Full 3D sound (HRTF): panning, as the falls do, is enough on laptop speakers. Voiced speech: the lines are text, and voices are a far larger job. A piece of music per town: the island's band does that much. A noise meter foes track over time: the hearing radius is Michael's rule on #190, and B only scales it.
