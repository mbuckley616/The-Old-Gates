# What a place sounds like — the build sheet

*The systems designer, 27 Nov 2026. The numbers for Michael's B on #2071. The design is decided; this page settles what the proposal left to the build, and asks nothing.*

## What Michael chose

> **A, plus sound that tells you something** (B). (2026-11-26, `docs/decisions.md`, #2071)

The page is [what a place sounds like](what-a-place-sounds-like.md): A's palette (an Ambience bus, beds by island and hour, rooms' echo, eight grounds underfoot), and B's sound that tells you something (a gate heard by its condition, each school's bed inside, the undertone, the ground in the hearing rule, the music's rest). All in code; the download grows by nothing.

## Today

`initAudio` (`72-audio.js`) makes `masterGain` over `musicGain`, `sfxGain` and `uiGain`, set by `volLevel` times `volKind(k)` from `SETTINGS` (`10-player.js`: master, music, effects, voices, in `localStorage['og.settings']`). The exploring orchestra (`explorePlay`, `76-music.js`) starts its next piece 2.2 s after the last one ends. Inside a dungeon `_musicDungeon` plays one of six drones keyed by `_currentDungeonTheme`, so a gate's school and condition change nothing you hear. Weather is one noise loop (`wxAudio`); the falls a panned loop to 140 m (`tickFallsSound`, ticked each quarter second). `tickFootsteps` (`78-placeholder-zones.js`) chooses one of four steps: hollow slab, snow, hobnails or plain. Herbs (`sndPick`, five voices, S2704) and items (`itemVoice`, S2710) already sound by kind, so the proposal's herb line is done. A foe hears you walk at `HEARING_WALK` 3 m and sneak at `HEARING_SNEAK` 1 m, never under `HEARING_RADIUS` 0.9. Rain scales both by `wxHearScale` (rain and snow ⅔, a storm ½), and noisy hobnails replace both with `HOBNAIL.walk` 4 and `.sneak` 1.5 (`hearingRadius`). A gate's condition is `gateCondRoll(seed)` (half steady, 35% failing, 15% catastrophic), its school is `gateSchool(e)`, and the world's corruption is `corruptionLevel()`, which counts the torn great gates.

## The numbers

### The bus

| | Value | Why |
|---|---|---|
| `ambGain` | `VOL_SFX[volLevel] × 0.6 × volKind('ambience')` | under the effects: a bed should never cover a footstep or a foe's tell |
| `SETTINGS.ambience` | 100, its own row under Effects | a setting, not save data |
| Duck while a piece plays | ambience × 0.7, eased over 3 s | the orchestra and the bed fight in the 200–800 Hz band; while the music rests the place comes up |
| Damping filter (one lowpass on the bus) | clear 18 kHz; fog 2,000 Hz at × 0.7; rain 1,200 Hz at × 0.6; snow 3,000 Hz at × 0.8; storm 900 Hz at × 0.5 | read from `WX.type` and `WX.k` and eased the way `wxHearScale` eases; snow damps the high end, which is why a snowy field is quiet |
| Tick | `tickAmbience(dt)` in the main loop, every 0.25 s on the page's clock | `WORLD.tick` stops indoors (the weather gotcha); a quarter second is the falls' rate |
| Live nodes | at most 40 on the bus | the beds take 9, the spots 16, the gate voice 8, and calls come and go |

Every roll on the bus (when a bird calls, a whisper's pitch, a hammer's stroke) is cosmetic and uses `Math.random`, as the co-op rules allow. Nothing on the bus writes `worldState`.

### The beds (outdoors)

There is one 4 s noise buffer, shared by every loop.

| Bed | Level | Shape |
|---|---|---|
| Wind | 0.05 at sea level, + 0.03 per 50 m of height, capped at 0.14 | Gatelands: bandpass 500 Hz and soft. The Mark: a gust LFO with a 5–10 s period, swinging × 0.5 to × 1.6, stronger over 150 m. Aurenne: lowpass 350 Hz and low. Under a wood's canopy (`specBiome` forest) × 0.6, with the leaves' hiss added at 4 kHz |
| Water | 0.10 at the edge, falling as (1 − d/80)² to nothing at 80 m | the nearest of: a carved river (`riverSample`), a lake, or the sea (`worldH < SEA_Y`), sampled on 8 bearings at 10, 25, 50 and 80 m (32 reads a tick). A river is a 900 Hz bandpass, a lake lapping at 0.5 Hz, the sea's surf a 9–12 s swell. The falls keep their own loop |
| Town murmur | 0.01 for each townsperson within 40 m, capped at 0.12 | read from the town's rigs. A full market square is loud and a plagued or burned town falls quiet with no rule of its own; at night the murmur is the inn's |

### Spots and calls

The nearest 4 spots within 40 m sound; the bell and the horn carry to 400 m and do not count against the 4.

| Spot | When | What |
|---|---|---|
| Forge | the smith's `SHOP_HRS` (7–17) | a hammer stroke every 0.8–1.4 s in runs of 4–9, then 3–8 s of quiet |
| Tavern door | `HRS.inn`, 17–21 | the island band's lead playing a reel, with a crowd, through a 900 Hz lowpass |
| Church bell (Gatelands) | 6, 12 and 18 | three strokes three times, 2.5 s apart, a 9 s tail |
| Horn (the Mark) | at the guard's change, from `handoverGate` | one call of 2.5 s |
| Fountain (Aurenne) | always, on the square | a 2 kHz trickle at 0.06 |

Calls come one every 4–20 s (dawn 5–8 doubles it; dusk 18–21, night 21–5). Rain halves the rate, fog halves a call's reach, a storm stops them.

| Island | Day | Night |
|---|---|---|
| Gatelands | skylark, blackbird, rooks | crickets; an owl one call in four |
| The Mark | ravens, a hawk | none: the wind alone |
| Aurenne | gulls within 300 m of the sea; cicadas 11–16 | crickets, and the surf |

### Indoors

The world's beds fade over 1 s at the door; a room with a fire crackles at 0.04; the rain on the roof stays as now. The echo is one ConvolverNode on decaying noise made in code, the sfx and ambience buses sent to it at 0.22 wet, its decay by the room:

| Room | Decay |
|---|---|
| A cottage, a shop or a cellar | 0.4 s |
| An inn's common room or a guild hall | 0.8 s |
| A keep's hall, a church or a courthouse | 1.2 s |
| A gate's nave or crossing (`gen.spaces`, vaults to 50 m) | 1.8 s, at a wet level of 0.30 |
| A gate's side room, a fort or a lair | 0.7 s |

Skyrim gives a cave most of its character this way; five sizes are enough.

### Footsteps and the ground

`groundKind(x,z)` returns one of eight new voices, today's plain step becoming **earth**, from what is already read: `footingAt`, `stampAt`, `roadInfo`, `slopeNormalY`, `specBiome`, the shore, the water's depth, `isInterior`, the deck.

| Ground | Where | Hearing × |
|---|---|---|
| Grass | open land off the road, moss, a forest floor | 0.8 |
| Sand | Aurenne's shore, a desert biome | 0.8 |
| Snow | `WX.cover` ≥ 0.5 (both snow kinds) | 0.8 |
| Earth | roads, a town's pad where there is no paving, a lair's cavern | 1.0 |
| Mud | `footingAt` mud | 1.0 |
| Stone | paved streets and the square, steep rock, a stone bridge, a church, keep or guild hall inside, a gate's or fort's floor | 1.15 |
| Wood | a house's floor, a deck, a pier, a wooden bridge | 1.15 |
| Gravel | the Gatelands' and the Mark's shingle (S2714), the Mark's scree above the snow line (S2702) | 1.3 |
| Shallow water | 0.1 m deep up to the depth at which you swim | 1.3 |

The rule becomes walk `3 × g × w`, sneak `max(0.9, 1 × g × w)`, `g` the ground's and `w` the weather's as now: gravel 3.9 and 1.3 m, a meadow's sneak at the 0.9 floor, gravel in a storm 1.95. It is read where you stand, so each co-op player carries their own.

Noisy hobnails (on stone and wood) keep their 4 and 1.5 m unmultiplied, since they already are the ground's; elsewhere they take the factor like any boots.

Meant: a gate's stone hears a sneak at 1.15 m, not 1.0, still inside a long sword's reach; a lair's earth is the quieter way in. Oblivion and Skyrim count only the boots; the ground makes a sneak a route.

### A gate heard

The hum is a fundamental with harmonics 2–5 at 0.5, 0.35, 0.25 and 0.15: laptop speakers give almost nothing under 150 Hz, and the ear rebuilds a missing fundamental from its harmonics, so a pure 60 Hz hum would be silent on the brief's machine. By school: Cloch 55, Uisce 58, Scáth 61, Gaoth 64, Solas 67, Tine 70 Hz. Only the nearest gate sounds.

| Condition (`gateCondRoll`) | Heard to | Level at the door | Voice |
|---|---|---|---|
| Steady | 80 m | 0.10 | the hum, steady |
| Failing | 120 m | 0.12 | a second voice 4–7 Hz above, seeded by the gate's seed, so it beats; a whisper every 6–12 s (bandpassed noise through two moving formants, 0.6–1.2 s) |
| Catastrophic | 160 m | 0.14 | the beat at 3 Hz; each whisper's envelope reversed (it swells and is cut off); a rumble of noise under 120 Hz at 0.05 |

The level falls as (1 − d/R)² and is panned, as the falls are, through the bus's damping (rain shortens it by ear, not by rule). A great gate is heard to 240 m: untouched a steady hum, torn the catastrophic voice, sealed silent (`greatGateState`). Seeded and the world's, so a friend beside you hears the same gate.

### Inside a gate, and the world's undertone

Inside an old gate the school's bed replaces `_musicDungeon`, on the Ambience bus, so a player who mutes the music still hears the gate. Forts and lairs keep the six drones.

| School | Bed |
|---|---|
| Tine | a low fire roar, and metal ticking as it cools every 2–5 s |
| Uisce | drips every 1–4 s, and water lapping at 0.4 Hz |
| Cloch | stone grinding in 3 s swells every 15–30 s |
| Scáth | near silence, a 40 Hz floor at 0.02, whispers |
| Solas | a high ring at 1,760 Hz with a slow vibrato, at 0.02 |
| Gaoth | today's `sndDraught` moaning through the halls |

Whispers by condition: steady every 40–60 s, failing 12–20 s, catastrophic 6–10 s.

The undertone, in the open world only, is 0.02 × (`corruptionLevel()` − 2): nothing to two torn, 0.02 to 0.08 from three to six; the last torn school's fundamental (`corruptionTorn()`) with harmonics 2–5 under 400 Hz, swelling over 20 s, felt more than heard.

### The music's rest

Outdoors the next exploring piece starts 45–90 s after the last, not 2.2 s; indoors, in a gate and after a fight it stays 2.2, and a change of place starts at once. Morrowind and Skyrim leave the same quiet; it is what lets three islands sound like three places.

## What it touches

- `72-audio.js`: `initAudio` (the Ambience gain, its damping filter and the convolver), `applyVolumes`, the new voices, and `groundKind`'s eight steps beside `sndFootstep`.
- `76-music.js`: `explorePlay`'s gap, the duck, and the gate's bed in place of `_musicDungeon` for an old gate.
- `78-placeholder-zones.js`: `tickFootsteps` plays by `groundKind`.
- `10-player.js`: `SETTINGS_DEF.ambience` and `hearingRadius`, which gets the ground factor.
- `90-main.js`: `tickAmbience` in the loop. It is the systems builder's tick, but the line sits in the main file.
- The settings sheet (`index.html` and its builder): one slider row.
- Read, never written: `SHOP_HRS`, `HRS.inn`, `handoverGate`, `gateCondRoll`, `gateSchool`, `greatGateState`, `corruptionLevel`, `corruptionTorn`, `footingAt`, `WX`, `RING_GATES`.

No `worldState` key, so nothing for `SS_CHAR_WS` or the S242 list; the slider lives in `og.settings`. The one rule with an outcome, the hearing factor, is a pure function of where you stand.

## The suites

One new suite, `placesound`, reads a state object `AMB` as `falls` reads `FALLS_SND`; the ground goes in `footing`, which already measures `hearingRadius`.

| Rule | Suite | Set up | Measure | Pass |
|---|---|---|---|---|
| The slider | `settingsheet` +1 | set Ambience to 0, then 50 | the bus gain | 0, then half of the value at 100 |
| Beds by place | `placesound` | Dunmore's square at noon; a Mark fell at 160 m; a shore | `AMB.beds` | murmur > 0.04 on the square; the Mark's gust LFO on; water > 0.05 within 20 m of the sea |
| Damping | `placesound` | `devWeather('rain')`, then `'storm'` | the filter's frequency after 3 s | 1,200 ± 100 Hz, then 900 ± 100 Hz; no calls in the storm over 60 s of `g.spin()` |
| Hours | `placesound` | `forceTime(12)` in a Gatelands town, then 14 | the bell's count, the forge's on/off | a bell at 12; the forge on at 14 and off at 18 |
| Ground | `footing` +3 | stand on grass, a road, a paved square, shingle | `groundKind`, `hearingRadius()` walking and sneaking | grass 0.9 sneak, earth 3 walk, stone 3.45, gravel 3.9 and 1.3; noisy nails still 4 and 1.5 |
| A gate heard | `placesound` | `WORLD.enter` 100 m from a failing gate and from a steady one | `AMB.gate` | the failing one sounds at 100 m with a beat of 4–7 Hz; the steady one is silent at 100 m and sounds at 60 m |
| Beds by school | `placesound` | enter a Tine gate and an Uisce gate | the bed's name, the music bus | the school's bed on Ambience; `_musicDungeon` not called |
| The rest | `combatmusic` +1 | end an exploring piece outdoors, then indoors | the gap until the next one starts | 45–90 s outdoors; 2.2 s indoors |
| Not too much | `placesound` | Dunmore on market day at noon, in rain | live nodes on the bus | 40 or fewer |

The hearing change re-reads `weather`, `witness` and `witnessrange`: on a road or pad (earth, ×1) nothing moves; on stone or shingle the expected value moves by the factor in the same session, and no threshold is loosened.

## Sessions

Five ordinary systems sessions. Herbs by kind landed in S2704, so footsteps and the hearing rule share a session, both reading `groundKind`.

1. The bus, the slider, `tickAmbience`, wind and water, the damping and the duck. `placesound` is new; `settingsheet` +1.
2. The town and the hours: murmur, spots, calls, indoors and the rooms' echo.
3. `groundKind`, the eight steps, and the ground in the hearing rule. `footing` +3, and the hearing suites re-read.
4. A gate heard outside, great gates and the undertone.
5. Beds by school inside a gate, the whispers by condition, and the music's rest. `combatmusic` +1.

Nothing waits on another lane.

## The open number

None. The proposal set the ranges and factors and Michael's B took them; the levels above are a mixer's, settled here, and the critic's next walk judges them.
