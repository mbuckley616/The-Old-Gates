# The Old Gates — working conventions

A browser-based open-world RPG in a single self-contained HTML file. Michael designs and playtests;
Claude implements. This file is what Claude reads first in every session.

## The files
- `index.html` — the whole game. ~41k lines. Deployed as-is (GitHub Pages serves it at the repo URL).
- `docs/devlog.md` — one entry per session, appended at the end of the session. Never rewrite old entries.
- `docs/backlog.md` — the open work, grouped by area, with `~~strikethrough~~ — done, Session N` when finished.
- `docs/lore_canon.md`, `docs/quest_writing.md` — the author's text. Do not edit without being asked.
- `tests/` — Playwright suites against a headless Chromium. `node tests/run.mjs` runs them all.
- `scripts/parsecheck.py` — syntax-checks every inline script block. `scripts/tag.py bump` bumps the build tag.

## A session
1. Read the last devlog entry and the backlog before touching code.
2. One feature or bug per session. Ask before building anything whose design is open.
3. Edit `index.html` with targeted edits. The file has literal Unicode in strings (’ — · 🗝); match it,
   don't assume `\u` escapes. Never put a `//` comment on a line that has code after it.
4. `python3 scripts/parsecheck.py` after every edit batch. It takes two seconds.
5. Verify in headless Chromium, not by reading the code: add or extend a test in `tests/`.
   The scene runs at a few fps on software GL, so drive time with `g.spin()` (fixed 1/60 ticks), not timeouts.
6. `python3 scripts/tag.py bump` — the tag shows in the controls line at the bottom of the screen and is
   how Michael confirms which build he's running.
7. Append the devlog entry (format below), update the backlog, commit.

## Devlog entry format
```
## v80 — Session N — <title>
<what was asked, what was wrong, what changed — with the reasons, in prose>
### Verified (headless Chromium)
<what the tests showed, with numbers>
### Needs eyes
<what only a real playtest can judge; what was left owed>
```
Corrections to earlier entries go in the new entry, named as corrections. History is useful.

## Code map (line numbers drift; grep for the names)
- Save store: `SS`, `ssWrite/ssLoad/ssPut/ssGet`, `ssStringify` (skips live scene handles), `ssSanitizeLoaded`, export/import `ssExportChar/ssImportFile`.
- World module: the big IIFE returning `WORLD` (`return {SIZE,CHUNK,SEA_Y,...`). Settlements in `SETTLE`, roads in cells, weather `WX`, sky `SKY`, snow cover `WX.cover`, footprints `FP`.
- Terrain: `rawH` → `baseH` (site stamps flatten) → `worldH` (roads). Colour: `groundColor()`; chunks recoloured by `recolourChunk`.
- Interiors: `buildInteriorFor`, `partition()` cuts doorways, `intDoorAt` hangs a door, `INT_BEDS/INT_DOORS/INT_NPCS`.
- Dialogue: `makeDef` builds a town NPC, `topics` is a getter; folders are `{label, folder:true, follow:[...]}`.
- Maps: `drawLocalMap` (Local view + minimap), `mapPixel` (world map), `BLD` (building colours), `MAPBIO` (biome tints).
- Lockpicking: `LP`, `openLockpick`, `lpPhase()` reads the clock.
- Console helpers for testing: `devWeather('rain')`, `forceTime(h)`, `WORLD.devUnlockAll()`.

## Things that have bitten us
- `WORLD.tick` only runs in the open world: anything that must keep running indoors (weather sound) goes in the main loop.
- An authored day/night curve rewrites fog density every frame outside the world; the world owns its fog.
- `ROAD_MAT` is `VC_MAT` — shared with buildings. Tint road *vertex colours*, never the material.
- Site stamps are applied after rivers are carved: a pad over a river fills it in.
- `BAG` is a `const`; mutate it, don't reassign.
- A dropped animation frame must never change an outcome (lockpicking, doors): read `performance.now()`.

## Roles
- Michael makes the design calls; Claude flags risks and asks when the design is open.
- Cross-cutting rewrites (roads, terracing, rivers, skills-by-use, splitting this file) are Fable sessions.
  Contained features and bug hunts are Opus sessions.
