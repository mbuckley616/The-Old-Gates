# Build sheet: the three quality levels and the first-run probe (F3)

*The systems designer, 22 Oct 2026. A build sheet for a design Michael has chosen: it settles the numbers and does not re-ask the design. No number is left open, so it raises no decision.*

## What Michael chose

On #543 (`docs/design/streaming-and-quality.md`), 21 Oct: **"Player picks, plus a one-time probe that can set Low"** (B). So: the quality table on that page, with Middle as the default and the player picking the level; one measurement on the first entry to the world in a browser that can set Low and say so once; it never picks High and never runs again. The page's rule stands under it: **quality changes what is drawn, never what exists.** The chunk ring, the solids, the herbs and the foes are the same at every level, and the level is never saved in a slot. The budgets are Michael's 3 A of 13 Oct (`v2-scope.md` §5): 45 fps at Middle on his laptop in Portclare's square at noon, and under 1,000 draw calls in the busiest town view.

## Today

`SETTINGS.quality` (0, 1 or 2; `SETTINGS_DEF` in `10-player.js`, kept in this browser under `og.settings` by `settingsSave`) is the settings sheet's *Quality* row. That row appears on the new look only (`92-creator.js`) and now reads *Middle suits most machines, Low a slow one* (Finding 33, Session 1282). Changing it calls `landQuality()`, which reads `LAND_Q` through `landQ()` (`89-world-land.js`). That covers the grass, the flowers, the sun's shadow map, the clouds and the bloom, and nothing else. Every other drawing number is a constant in its own file, the same at every level:
- the pixel ratio: `REN.setPixelRatio(min(devicePixelRatio, 1.5))`, `10-player.js`
- the shadow box: `S=70` in `buildLights`, `80-world-terrain.js`
- the pooled point lights: `LPOOL_N=24`, also in `buildLights`
- the bodies' levels: `HBODY.near/mid` 16/42, `32-people.js`, and `HC_BODY` 12/40, `34-creatures.js`
- the houses' swap: `HOUSE_LOD` 70/80, `83-world-generator.js`
- the herbs': `HERB_LOD` 100/45, `82-world-structures.js`

The ring is `RADIUS=4` (`80-world-terrain.js`). The chunk builds run in a 4 ms slice a frame and the cells' jobs in their own budget (`81-world-cells.js`). No suite measures draw calls outside Dunmore at noon (`f3land`). The tests boot a fresh browser, so they all run at Middle.

## The numbers

### The table

One table, `QUALITY`, takes the place of `LAND_Q` and holds every knob in the proposal. It sits beside `SETTINGS_DEF` in `10-player.js`, because the pixel ratio is read there first and every later file may read it (the load-order rule). `landQ()` keeps its name and returns the level's row, so the land's code is unchanged. One function, `qualityApply()`, writes the row into the objects that already hold the numbers (`HBODY.near/mid`, `HC_BODY.near/mid`, `HOUSE_LOD`, `HERB_LOD`, the sun's shadow camera, the renderer's pixel ratio) and then calls `landQuality()`. So no builder's file changes how it reads its own distances. Nothing in `32-people.js` or `34-creatures.js` is edited.

| Knob | Low | Middle | High | Reasoning |
|---|---|---|---|---|
| Pixel ratio cap | 1.0 | 1.5 | 2.0 | Fill rate is the first wall on a laptop's integrated GPU. A 1.5 screen at 1.0 draws 44% of the pixels. |
| Shadow map, box | 1,024, ±45 m | 2,048, ±70 m | 4,096, ±100 m | A texel is 8.8, 6.8 and 4.9 cm, so Low is coarser but not blocky. Fewer casters fall in Low's box, and that box is the second pass's cost. |
| Grass, flowers | 0 | 6,000 a chunk, ring 1, 4% | 12,000, ring 1, 5% | As built (`LAND_Q`) |
| Clouds | 6 | 14 | 30 | One instanced draw at any count. The critic found Low's empty sky barer than the old look's, so Low gets 6 instead of 0. |
| Bloom | off | on | on | Six passes; as built |
| People, full / middle level | 10 / 28 m | 16 / 42 m | 24 / 60 m | `HBODY`. Middle's 16 m is conversation distance. Low keeps the face you talk to (10 m is past the 3 m greeting) and drops the market crowd to the 17-bone driver. |
| Creatures, full / middle | 8 / 28 m | 12 / 40 m | 18 / 56 m | `HC_BODY`, in the people's ratio. 8 m is still a wolf's lunge range with room to spare. |
| Houses, full / far | 50 / 60 m | 70 / 80 m | 100 / 110 m | `HOUSE_LOD`. 50 m is a town square's width, so the square you stand in is always full-built. |
| Herbs drawn / shadowed | 70 / 30 m | 100 / 45 m | 140 / 60 m | `HERB_LOD`. A herb is picked within 2 m and seen within 70, so Low loses only the far ones. |
| Point lights | 12 | 24 | 24 | `LPOOL_N` is compiled into every lit shader, so it takes effect at the next load. The sheet then says *on the next start*. A night street keeps its nearest 12 lamps. |
| Chunk ring, fog, far terrain | 4, same | 4, same | 4, same | The rule above. Morrowind kept its active grid of cells fixed whatever the view distance; Skyrim's `uGridsToLoad`, raised for the view, broke its scripts. |

Middle keeps every number it has today, so nothing a tester or a player knows changes unless they move the row.

### The ceilings

Counted by `REN.info` on the world's frame (the bloom's passes included) in five views: Dunmore's street and the field west of it at noon, the field at dawn, the street at midnight, and Portclare's square at noon.

| Level | Draw calls | Triangles | Frame rate (measured by hand) |
|---|---|---|---|
| Low | 700 | 1.2 M | 30 fps on a five-year-old integrated laptop GPU |
| Middle | 1,000 | 2.0 M | 45 fps on Michael's laptop, Portclare at noon (§5) |
| High | 1,300 | 4.0 M | 60 fps on a discrete GPU |

Calls and triangles are counts, so a headless run measures them exactly. Frame rates are not, and no suite claims them: the 45 at Middle is Michael's one reading once the table is in.

### The probe

| Number | Value | Reasoning |
|---|---|---|
| When | The first entry to the world on the new look in this browser, once the world has settled: no chunk queued, no cell job, no body building. If it has not settled after 15 s, it starts anyway. | Before that, the frame times are the builds', not the machine's. Session 1294's spread build leaves 8 ms slices that would bias a fast machine toward Low. |
| Skipped | The first 30 frames after it starts | The first sight of the scene compiles programs (`hbWarm` covers the bodies; the land's and the houses' are not warmed). |
| Measured | The median of the next 120 frame times, read from `performance.now()` | 2 s at 60 fps, 4 s at 30. The median ignores the odd stall. The clock, not the frame count, is what the co-op rules require. |
| Discarded | Any frame over 250 ms, and every frame while the tab is hidden or a panel is open | A tab switch or a pause is not the machine. If fewer than 60 frames are left after 10 s, it gives up without deciding and tries again on the next entry. |
| Threshold | Median over 28 ms (under about 36 fps): set Low | Low's ceiling is built for 30 fps. A machine at 36 or better can hold Middle's 45 in quieter places and gets to choose. |
| Message | Once, on parchment (`showMsg`): *Set to Low for this machine. Settings can change it.* | The quest writer may reword it. It is the only line this build adds. |
| Never | It never chooses Middle or High over a lower level, and never runs twice | High is a choice, not a guess. A level the player picked is never moved under them. |
| Record | `SETTINGS.qualityProbed = true`, saved in `og.settings` whether or not it set Low. Moving the *Quality* row before the probe has run also sets it. | The level is the browser's, not the slot's. |
| Skipped in tests | When `navigator.webdriver` is true, unless the suite calls the dev hook `qualityProbe({force:true})` | Software GL would always read Low, and every suite would then run at a level no one chose. This keeps `tests/lib/` (the pipeline) untouched. |

When the probe sets Low, `qualityApply()` runs at once. Everything changes on that frame except the lights, which drop to 12 on the next load.

### Streaming

The rule from the proposal, measured rather than rebuilt:
- At a gallop (12 m/s, the horse's top speed) along a straight road for 60 s, every chunk within two of the player's is loaded on every frame.
- No frame spends more than 12 ms on chunk and cell work together, which is about half of a 45 fps frame.

Today's 4 ms slice and the cells' budget should already fit. If the suite finds otherwise, the fix is to the slices' size and never to the ring.

## What it touches

- **Functions:** `SETTINGS_DEF` (gains `qualityProbed:false`); `QUALITY` and `qualityApply` beside it in `10-player.js`; `landQ`, `landQuality` and the deleted `LAND_Q` (`89-world-land.js`); `buildLights` (`80-world-terrain.js`, the box and `LPOOL_N` from the table); the settings sheet's row (`92-creator.js`, which calls `qualityApply` in place of `landQuality`); the probe, `qualityProbe`, in `89-world-land.js` beside the other new-look hooks, called from the world's first `enter`. `landRender`'s targets must follow a change of pixel ratio (they are sized from the canvas; the session checks that they are rebuilt).
- **The save:** nothing. The level and `qualityProbed` live in `og.settings`, outside both rows. No `worldState` key, nothing on the S242 list or `SS_CHAR_WS`. A host at High and a friend at Low share one world, because nothing in it reads the level.
- **Panels:** the settings sheet's *Quality* row (its note stays Finding 33's), and the one message.
- **The old look:** untouched. `qualityApply` returns at once unless `OG_LOOK` is `'new'`, as every land hook does.

## The suites

| Suite | Sets up | Measures | Passes when |
|---|---|---|---|
| `qualitysame` | One seed. Walk the same 400 m at Low, then at High (the setting moved mid-run, then on a fresh boot) | Every chunk's id, its solids' count, its herbs by id and its foes by key, within the ring | Identical at both levels. The ring is 4 at both. |
| `qualityknobs` (can extend `f3land`) | Set each level in turn | The table's numbers as the game holds them: pixel ratio, shadow box, `HBODY`, `HC_BODY`, `HOUSE_LOD`, `HERB_LOD`, the grass | Every number equals its row. Middle equals today's. |
| `qualityprobe` | `qualityProbe({force:true})` with a frame time held at 40 ms, then at 16 ms, then after the row was moved | The level, the message, `qualityProbed` | 40 ms gives Low and one message. 16 ms leaves Middle, says nothing and marks it probed. A moved row is never probed. A second entry does nothing. |
| `budget` (QA) | The five views at each level, the clock set by `forceTime` | `REN.info` calls and triangles | Under the level's ceilings, with a ledger of calls by kind (land, houses, bodies, shadow, post) written to `docs/qa/budget.md`. |
| `streamgallop` (QA) | 60 s along the north road at 12 m/s, driven by `g.spin()` | Missing chunks within two; chunk and cell ms per tick | No chunk missing, and no tick over 12 ms. |

`budget` will be red at first: Middle is at 1,002 calls at dawn and 1,025 at midnight. Its ledger is what the look builder works from, so it is not skipped. It lands red-allowed: QA names it in `tests/skip.json` with its QA card until the counts come down, which needs Michael's approval as any skip does. If he declines, it lands after the look builder's sessions instead.

## Sessions

1. **Systems builder:** `QUALITY`, `qualityApply`, `buildLights` from the table, the row; `qualitysame` and `qualityknobs`. One ordinary session, no freeze needed (FREEZE #583 names none of these files).
2. **Systems builder:** the probe, its message, `qualityProbed`, `qualityprobe`. One ordinary session.
3. **QA:** `budget` with its ledger, and `streamgallop`. One run, in parallel with session 2.
4. **Look builder (bodies builder if the ledger puts the bodies first):** Middle under 1,000 at dawn and midnight, then Low under 700, from the ledger. One or two sessions.
5. **Michael:** Portclare's square at noon at Middle, the frame rate read once. If it is under 45, the ledger says which row of the table to lower.

Four to five sessions in all, none of them deep work.

## The open number

None. The proposal set the threshold (28 ms) and the levels' rows, and Michael's B took them. Everything this sheet adds (the settle rule, the discards, the skip under `navigator.webdriver`) is mechanics a player does not feel.
