# Streaming and the three quality levels

*The systems designer, 21 Oct 2026. A proposal: nothing here is a spec until `decisions.md` carries a `Michael:` line under it. For card F3 and the cutover (F14), against the budgets Michael accepted on 13 Oct (`v2-scope.md` §5, his 3 A).*

## The problem in Michael's words

Michael's A on the new look (decisions.md, *the vertical slice*): "Stream them with the chunks, at three quality levels. The old look stays playable until the new one is whole." The brief: "As polished and realistic as a browser can carry without becoming heavyweight … The build must stay playable on a laptop in a browser." And the budgets he accepted: 45 fps or better at the middle level on his laptop in Portclare's square at noon, under 1,000 draw calls in the busiest town view, a first load under 40 MB. The vertical slice left the rest open: "Streaming's three levels are a proposal still to come."

It matters now because #529 makes the new look the default: from that merge, every new player gets it, on whatever machine they have.

## Today

There is one knob, `SETTINGS.quality` (0, 1, 2; Middle by default), on the settings sheet's *Quality* row, and it reaches only the land: `LAND_Q` in `89-world-land.js` sets the grass (0, 6,000 or 12,000 blades a chunk, one ring of chunks), the flowers, the sun's shadow map (1,024, 2,048, 4,096), the clouds (0, 14, 30 heaps) and the bloom (off, on, on). Everything else costs the same at every level: the chunk ring (`RADIUS`=4, a 9 × 9 square of 64 m chunks, built in a 4 ms slice a frame, the cells' jobs in another 6 ms), the shadow camera's ±70 m box, the pixel ratio (`min(devicePixelRatio, 1.5)`), the 24 pooled point lights (`LPOOL_N`), the builder bodies' levels (`HBODY` at 16 and 42 m, the creatures' `HC_BODY` at 12 and 40), the houses' swap (`HOUSE_LOD` 70/80) and the herbs' (100 m, shadows to 45). The critic counted the result on 20 Oct at Middle: 909 draw calls on Dunmore's street at noon, 886 in the field, **1,002 at dawn and 1,025 at midnight**, against 763–851 on the old look; 1.9–2.0 million triangles against 1.0–1.2. Low brings the noon field only to 768 calls, because the costly parts (the kit's houses, the bodies, the shadow pass) do not move with it. `f3land` measures only Dunmore at noon, so it passes.

## The rule that holds in every direction

**Quality changes what is drawn, never what exists.** The chunk ring is a gameplay number: a chunk carries its solids, its herbs and its foes (`despawnChunkEncounters` runs when it drops), so a Low player with a smaller ring would meet fewer wolves and walk through trees a High player bumps into. That breaks the fixed difficulty ("one tuned experience, the same for everyone in a shared world") and the co-op door (a host at High and a friend at Low must share one world). Skyrim's `uGridsToLoad` is the warning (players raised it for the view and broke scripts and AI); Oblivion's fixed grid with distant land drawn beyond it as scenery is the answer. So `RADIUS` stays 4 at every level, the save never holds the level (it lives in the browser's settings, neither the character's row nor the world's), and nothing outside the renderer reads it.

## The table, at every level

All three directions share it: `LAND_Q` becomes one `QUALITY` table every builder reads, and Middle keeps today's numbers.

| Knob | Low | Middle | High | Why |
|---|---|---|---|---|
| Pixel ratio cap | 1.0 | 1.5 | 2.0 | Fill rate is a laptop's first wall; Middle keeps today's |
| Shadow map | 1,024 | 2,048 | 4,096 | As built |
| Shadow box | ±45 m | ±70 m | ±100 m | Fewer casters in the second pass at Low; the box is half the cost of shadows |
| Grass blades, ring | 0 | 6,000, 1 | 12,000, 1 | As built |
| Clouds | 6 | 14 | 30 | One draw call whatever the count; the critic found Low's empty sky emptier than the old look |
| Bloom | off | on | on | Six passes; as built |
| People, full / middle level | 10 / 28 m | 16 / 42 m | 24 / 60 m | `HBODY`; beyond the middle distance a body is the 17-bone driver |
| Creatures, full / middle | 8 / 28 m | 12 / 40 m | 18 / 56 m | `HC_BODY`, in the same ratio |
| Houses, full / far | 50 / 60 m | 70 / 80 m | 100 / 110 m | `HOUSE_LOD` |
| Herbs drawn / shadowed | 70 / 30 m | 100 / 45 m | 140 / 60 m | `HERB_LOD` |
| Point lights | 12 | 24 | 24 | `LPOOL_N` compiles into every lit shader, so it changes on the next load only |
| Chunk ring, fog, far terrain | same | same | same | The rule above; the fog is the weather's, not the machine's |

**The ceilings**, measured in five views (Dunmore's street and the field west of it at noon, the field at dawn, the street at midnight, Portclare's square at noon, the critic's worst spot):

| Level | Draw calls | Triangles | Frame rate | Machine |
|---|---|---|---|---|
| Low | 700 | 1.2 M | 30 fps | an integrated laptop GPU of five years ago |
| Middle | 1,000 | 2.0 M | 45 fps | Michael's laptop (§5) |
| High | 1,300 | 4.0 M | 60 fps | a discrete GPU |

Low's ceiling is the old look's own count, so no player who could run 1.x is shut out by 2.0. High adds triangles freely (instanced grass, finer levels) but few calls, because calls cost the CPU, which a better graphics card does not buy back. Middle's 1,000 holds at dawn and midnight too: that is where it fails today, and a player plays the night.

**Streaming** keeps its ring and gets one rule: the ring two chunks out is never missing a chunk at a gallop (12 m/s, past a sprint), and no frame spends more than 12 ms on chunk and cell builds together, so a 45 fps frame (22 ms) never doubles. Today's 4 ms and 6 ms slices fit that rule already; the suite proves it rather than the code changing.

## Directions

### A. The table, chosen by the player

The table above, Middle by default, the *Quality* row now naming what it changes ("Middle suits most machines, Low a slow one", the quest writer's line of 20 Oct). The loop for the player is none at all, which is the point: they pick once. **Costs:** three ordinary Opus sessions, no deep work, since each knob already lives in one builder: the systems builder moves every knob onto the table with a `budget` suite (the five views at each level, calls and triangles under the ceilings, and a ledger of calls by kind in `docs/qa/budget.md`, so the first fix can see where dawn's 116 extra calls come from) and a `qualitysame` suite (Low and High on one seed hold the same chunks, solids, herbs and foes by id); then the look builder brings Middle under 1,000 at dawn and midnight, and Low under 700. A `streamgallop` suite proves the streaming rule. **Against it:** the slow laptop opens a new game at Middle, plays its first minutes at 15 fps, and decides the game is broken before finding the setting. The brief puts "a heavyweight download" under *Not this*, and a game that runs like one is the same failure.

### B. The table, and a first-run probe *(recommended)*

A, plus one measurement. On the first entry to the world in this browser (behind the opening fade, where the cells already load), the frame is drawn at Middle for two seconds and its median time read. Over 28 ms (under about 36 fps): the level is set to Low, and the game says so once, on parchment: *Set to Low for this machine. Settings can change it.* Otherwise it stays Middle. It never chooses High on its own: High is a choice, not a guess, and it never runs again once it has run, so the level a player picked is never moved under them. Skyrim's launcher did this with its *Detect* button; Elden Ring and most PC releases of the last decade do it on first boot. **Costs:** A's three sessions and one more, small: the probe, its message, `SETTINGS.qualityProbed`, and a `qualityprobe` suite (a slowed frame sets Low and says so once; a pinned or probed level is never moved). **Against it:** a probe on a busy first frame can read slow on a fast machine (a shader compile, a cell build). It measures the median of 120 frames after the first 30, which skips the compile stall `hourhitch` already knows about. Headless Chromium's software GL would always read Low, so tests pin the level at boot and the probe skips a pinned one.

### C. A live governor

A, plus a loop that watches the frame time and moves the cheap knobs (pixel ratio first, then the people's and houses' distances, then the grass ring) to hold 45 fps, the way consoles scale resolution. **Costs:** A's sessions and two more, and a suite that cannot be deterministic, since what is drawn then depends on the machine's speed in that second. **Against it:** the brief wants a painterly world, and a governor shows itself as bodies swapping level and grass shrinking back whenever a town fills; the dropped-frame rule keeps outcomes safe from it, but not the picture. It solves a problem the probe solves once, at a cost paid every frame.

## Recommendation

**B.** The table is what F3 owes and every direction needs; the probe is the cheapest thing that keeps a slow laptop from meeting 2.0 at 15 fps, and it is the one place the game should guess, since the first minutes are when a player decides whether it runs. A governor (C) can be added later on the pixel ratio alone if Michael's laptop shows Middle dipping in towns, but it is not worth its flicker before then.

## What must be true first

#529 (the new look as the default) landed and FREEZE #528 lifted. The bodies' distances are in `32-people.js` and `34-creatures.js`, so the first session waits on any freeze that names them. And the 45 fps at Middle can only be measured on Michael's laptop: once the table is in, he stands in Portclare's square at noon and reads the frame rate, once. No headless run can stand in for that.

## Not asked

A fourth level (Ultra) or a slider for every knob: three levels is what the look's brief named, and each extra one is another column of ceilings to keep green. A view-distance slider: ruled out by the rule above. The grass's look at Middle (the critic's dark spikes) and the clouds' drift: both are the look builder's, not the budget's. The download's 40 MB: nothing streams over the network (the page loads whole, then builds in code), so it is a ceiling for QA to measure at the cutover, not a design question.
