# Splitting index.html — findings and plan (exploration, 30 Sep 2026)

Nothing here was applied. Numbers are from main at fce19f7 (46,308 lines, 3,334,215 bytes).
Analysis tooling used: Node's bundled acorn (`node --expose-internals`, acorn 8.15) parsed the whole inline
script and gave exact top-level statement boundaries, declared names, cross-file references and load-time reach.
The scripts sit in this scratchpad (`ast.mjs`, `cuts.json`, `analysis.txt`, `reach2.txt`, `top.txt`).

## 0. What the file is today

- Lines 1–1128 (94k chars): `<head>`, CSS, the DOM (the build tag `build sNNN</span>` is at line 765, in markup).
- Line 1128: `<script src=three.js r128 from cdnjs>`. Line 1129: the one `<script>`. Line 46308: `</script>`.
- One inline script, lines 1130–46307, 3.24M chars. No other inline blocks. Nothing reads `document.currentScript`,
  `document.scripts`, its own source, `eval` or `new Function`. No `'use strict'`. No `</script>` inside a string.
- 1,379 top-level statements once the one big block (below) is flattened; 1,470 top-level names.
- **The `if(REN){` block, lines 30249–45014** (15k lines, 1.45M chars, 44% of the script) wraps audio, strikes, music,
  the placeholder zones, the whole `WORLD` IIFE, `K`, `PERF`, the main loop, `_enterGame` and the character creator.
  This is the "top-level block" CLAUDE.md's note about `window._K` describes: its 47 `let/const` (K, PERF, prevT, AX,
  masterGain, volLevel, VOL_*, EXPLORE, MODES, VOICES, PIECES, COMBAT*, PEACEFUL_ZONES, _ccState, TUTORIAL_INTROS,
  CCL_IDLE, _ccBeginBtn, _ccNameEl, ...) are block-scoped and invisible to `page.evaluate` and to code outside the block;
  its 126 function declarations and `var WORLD` are globals (sloppy-mode block-function hoisting, Annex B).
  The guard is dead: if the renderer fails, line 1184 `REN.setPixelRatio(...)` throws first and the script never
  reaches line 30249. So `if(REN)` never sees a falsy `REN`.
- The `WORLD` IIFE, lines 35067–42531: 7,465 lines, 795k chars, 1,017 inner declarations, one `return {…}` of 274
  exports on ONE 4,390-char line (42528). It holds most of the code map: rawH/baseH/worldH, groundColor, SETTLE, NAMES,
  makeDef (37966), buildInteriorFor (39031), drawLocalMap (39400), intDoorAt (39565), WX (40380), FP (40452),
  recolourChunk (40486), PEOPLES (41528), enter/tick (42464/42484).
- Only other multi-line top-level blocks: the `try{}` at 1176–1183 (renderer), four named IIFEs for potions and sigil
  quests (26848–27385), one anonymous IIFE at 29261–29272, two at 44923/44956 (creator's look canvas), and
  `buildAnimDebugPanel` at 46005–46307. All are self-contained; none needs cutting.
- Duplicate top-level function names (last one wins, exactly as now across files): `sndDoorOpen`, `sndDoorClose`,
  `sndDoorUnlock` (stubs at 29045–29047, real ones at 30647–30680) and `sndHitEnemy` (29049 / 30534).

## 1. Seams

Regions below are the natural cut points: each starts at a top-level statement, and the acorn pass confirmed every
one. "uses" counts distinct globals of other regions referenced anywhere in the region (from `analysis.txt`).

| # | region (proposed file) | lines | lines n | chars | globals defined | what it is | uses most from |
|---|---|---|---|---|---|---|---|
| 1 | player | 1130–2273 | 1,144 | 68k | 200 | `_debugResetBurn`, REN, CAM, VM_SCENE, resize; player state (px/pz/PHP/…); roll, posture, lock-on, sneak, bow/arrows, power attack, ANIM_PARAMS | zone-state 7, items 6, dungeon-gen 4 |
| 2 | character | 2274–2556 | 283 | 18k | 18 | ATTRS, ARCHETYPES, STARTER_WEAPONS, level-up | player 7 |
| 3 | items | 2557–3301 | 745 | 50k | 52 | EQ, BAG, MATERIALS, WEAPON_TYPES, ARMOR_TYPES, BOOKS, enchants, makeItem, loot tables | player 5 |
| 4 | viewmodel | 3302–4047 | 746 | 45k | 25 | first-person hands/arms, buildViewmodel, buildShieldViewmodel | player 8 |
| 5 | legacy-terrain-portals | 4048–4425 | 378 | 25k | 31 | mkTex/TX/MAT/showMsg/doFade; OW heightmap; WORLD_DUNGEONS, PORTALS | player |
| 6 | quests | 4426–6025 | 1,600 | 102k | 34 | QUEST_DEFS, QS, journal, compass, sundial, markers, waypoints | player 15 |
| 7 | dialogue | 6026–7221 | 1,196 | 86k | 29 | NPC_DEF, SHOP_DIALOG, TTS, openDialog, quest topics, talkNPC | player 12 |
| 8 | zone-state | 7222–7688 | 467 | 35k | 41 | HOUSES, SHOP_STOCK, OW_NPCS, worldState, ZONES, MAP_NODES/EDGES, activeZoneId | — |
| 9 | fort-exteriors | 7689–9325 | 1,637 | 84k | 4 | FORT_EXTERIORS data, portal meshes | — |
| 10 | plants | 9326–9775 | 450 | 37k | 19 | HERB_DEF, Plant kit, mkHerbMesh | — |
| 11 | people | 9776–10478 | 703 | 80k | 49 | SK, personGenome, buildPerson, weapons, buildFoe, poses, tickPeople, shadow-LOD swap | — |
| 12 | creatures | 10479–11049 | 571 | 58k | 55 | wolves, spiders (kits, gaits, tickCreatures) | — |
| 13 | legacy-zones-a | 11050–14340 | 3,291 | 180k | 46 | gates, ASHENMOOR_CONFIG, textures, buildVillage, Hearthwick, Bealach, Ashenmoor burned | — |
| 14 | legacy-bosses-enemies | 14341–16103 | 1,763 | 112k | 26 | BOSSES, Faolchú, buildZoneEnemy, tickZoneEnemies, killZoneEnemy, strike resolve | player 21 |
| 15 | legacy-zones-b | 16104–18842 | 2,739 | 158k | 20 | PROP_BUILDERS, wilderness, forest, buildTown, Ironhaven, ZONE_BUILDERS, registerPlaceholderZone | — |
| 16 | travel-clock | 18843–19904 | 1,062 | 56k | 71 | goToZone, fast travel, buffs, herbs, clock, forceTime, day/night, respawn | player 19 |
| 17 | interact | 19905–20210 | 306 | 19k | 1 | `interact()` | 18 regions |
| 18 | dungeon-gen | 20211–21248 | 1,038 | 56k | 49 | FOOTHOLDS, INT_BEDS, makeDungeon, fort interiors, dScene state, dSolid | — |
| 19 | thirdperson | 21249–21529 | 281 | 27k | 44 | TP, look, tpBuild/tpPose/tpCamera | player 11 |
| 20 | dungeon-build | 21530–24746 | 3,217 | 227k | 24 | dun shell, furnBuild (600 lines), buildDungeon (2,278 lines), goToDungeon, goToOW | — |
| 21 | interiors-legacy | 24747–25349 | 603 | 37k | 23 | legacy room kits, buildInterior, goToInterior, exitInterior | — |
| 22 | shop-loot-stash | 25350–26199 | 850 | 44k | 62 | shop, loot, stash, sleep, qty modal, buy/sell, armour bonuses | player 15 |
| 23 | combat-actions | 26200–27085 | 886 | 53k | 20 | doBash, attack, fireArrow, killE, castSpell, potions, useItem, updateHUD | player 22 |
| 24 | minimap | 27086–27227 | 142 | 9k | 2 | drawMM | — |
| 25 | spells-sigils | 27228–28045 | 818 | 49k | 51 | SPELLS, sigils, quest popups, spell fx | player 11 |
| 26 | hub-ui | 28046–28881 | 836 | 51k | 45 | book reader, log, hub, inventory, tooltips | player 15 |
| 27 | dungeon-misc | 28882–29131 | 250 | 41k | 32 | crosshair, dungeon decoration, traps, sound stubs, portal fx | — |
| 28 | lockpick-lair | 29132–29411 | 280 | 24k | 33 | LP, openLockpick, lairFinish, dragons, playerDead, reloadActiveSlot | player 17 |
| 29 | saves | 29412–30252 | 841 | 59k | 61 | SS, ss*, _applyLoadData (400 lines), save/load menu | player 20 |
| 30 | audio-sfx | 30253–30764 | 512 | 24k | 54 | AX, volume, sfx* and snd* | — |
| 31 | strikes | 30765–31296 | 532 | 28k | 24 | applyMeleeDamage, executeStrike, VARIANTS, caor blast | player 14 |
| 32 | music | 31297–32398 | 1,102 | 66k | 59 | sndSpell…, EXPLORE/PIECES, the music by place | — |
| 33 | placeholder-zones | 32399–35066 | 2,668 | 160k | 2 | tickFootsteps; 33 `registerPlaceholderZone({…})` data calls | — |
| 34 | world | 35067–42531 | 7,465 | 795k | 1 | the WORLD IIFE | 29 regions |
| 35 | main | 42532–44126 | 1,595 | 101k | 8 | boot calls (42533), dev helpers, K, PERF, `loop` (42558–44120, one function), rAF start, ssMigrate | 31 regions |
| 36 | creator | 44127–45018 | 892 | 53k | 25 | _enterGame, character creator, look canvas, title buttons | 22 regions |
| 37 | worldmap | 45019–46004 | 986 | 57k | 30 | WM, MAP_LAYOUT, renderWorldMapSVG, wm* | — |
| 38 | animdebug | 46005–46307 | 303 | 14k | 0 | the backtick panel IIFE | — |

Recent editing heat (hunks in the last 14 merges to main, by branch): auto/backlog (look) 182 hunks — world 92,
dungeon-build 15, placeholder-zones 11, people 10, interiors-legacy 10, legacy-bosses-enemies 8, dungeon-gen 7.
auto/systems 193 hunks — world 70, legacy-bosses-enemies 21, shop-loot-stash 15, main 13, audio-sfx 10, player 8,
saves 7. Over 21 days on main: world 371 hunks, player 233, people 81, dungeon-build 59, plants 49.
Inside `world` the two builders mostly work in different sections (look: fort compounds 19, generator/interiors 18,
ships 7; systems: investment and the deed 13, fort compounds 8, generator 6, sigils, factions, crime) — but 38 of the
last 21 days' commits changed the one-line `return {…}` at 42528. That line is where the merges actually collide.

## 2. Hazards for a plain-script split

1. **The `if(REN){` block (30249–45014).** A classic script must parse on its own, so no cut can fall inside it, and it
   holds 44% of the code including the two hottest regions. Keeping it whole defeats the split. The way out: drop the
   wrapper (line 30249 `if(REN){` and line 45014 `} // close if(REN)`). Consequences, checked:
   - The guard is dead (line 1184 throws first when WebGL is missing), so no behaviour path is lost. A page without
     WebGL still shows the overlay; afterwards each later file throws at its first `REN.`/`CAM.` use instead of being
     skipped — more console noise, same screen.
   - The 47 block-level `let/const` become global lexical bindings. None collides with an outer top-level name
     (the only block/outer duplicates are the four `snd*` functions, legal). `K` becomes reachable as `K` from tests;
     `window._K` keeps working. Code outside the block that names `K` or `volLevel` freely (today a ReferenceError if
     ever reached) would start resolving — none of it is on a load path.
   - `var WORLD` and the block's functions are already globals; unchanged.
   - Byte-for-byte reassembly stays exact only if the two wrapper lines are recorded as glue (see §4) — or removed
     from main in a two-line commit before the split day, which I recommend (§5, Q4).
2. **Load order and hoisting.** A function declared in a later file does not exist while an earlier file's top-level
   code runs. The acorn pass found **no** synchronous load-time call that reaches a later region (strict call-graph
   reach from every top-level statement; the only conservative flags were function values stored for later —
   `registerPlaceholderZone` stores its builder, `lockChest` stores handlers). Async work registered at load —
   `requestAnimationFrame(loop)` at 44121 (loop references nothing from creator/worldmap/animdebug),
   `ssMigrate().then(…)` at 44124 (uses hasAnySave, earlier), the `setTimeout` at 27946 (CAM, earlier) — is safe, but
   note the rule: a microtask runs between two `<script src>` files, and a frame can too while the parser waits on
   the next file, so a callback registered in file N must not touch file N+1's names. Add to CLAUDE.md.
3. **Top-level `let/const/class` are shared across classic scripts** — good (that is what makes the split a no-op) —
   but a duplicate across two files is a SyntaxError in the second file, which `node --check` on single files cannot
   see. parsecheck must also check the flattened concatenation (§4).
4. **The `WORLD` IIFE cannot be cut** by this method; it stays one 795k file. The 274-export return line stays the
   conflict magnet until step 2 (§6). Its inner names clash with outer globals in four places (`DOORS`, `KEYS`,
   `SG`, `tickNPCs`), which matters only when the IIFE is dissolved.
5. **The `//` comment hazard** (CLAUDE.md) is unchanged per file, and the split adds a new one: a cut must never
   land inside a multi-line statement or template literal. Using acorn statement boundaries (not regex) removes the risk.
6. **`tests/lib/game.mjs` copies index.html to `tests/tmp/index.local.html`** (to swap the cdnjs three.js for
   `../vendor/three.min.js`). After the split the relative `js/…` tags would resolve under tests/tmp and 404. Fix:
   write the local copy beside the file it was made from (`<dir>/index.local.html`, gitignored) so `js/` resolves;
   or rewrite `src="js/` to `src="../../js/` in the same replace. `people.test.mjs` line 104 boots the previous build
   from `git show HEAD:index.html` — it must become `git archive HEAD index.html js | tar -x -C tests/tmp/old`.
   34 `docs/prototypes/**/shoot.mjs` import `boot()` and need nothing.
7. **Branches not merged before the split cannot be merged after it** (their diffs target index.html lines that
   moved to js/). Hence the freeze in the backlog plan. A stray late branch can be rescued by cherry-picking onto
   the pre-split commit and re-running the split script on the result, then diffing js/ — worth writing down.
8. **History.** `git log --follow` cannot follow one file into 30. `git log -L` and blame on the pre-split
   index.html still work; note in CLAUDE.md that history before the split is under `index.html`.
9. **Hot single lines.** Beyond 42528, many lines hold several statements; two builders editing the same long line
   conflict whatever the file layout. The file split reduces CI cost and human confusion more than merge conflicts
   (git conflicts are per hunk, not per file). Say so plainly to Michael.
10. **file:// must keep working**: classic `<script src>` with relative paths does on file:// in Chromium, Firefox and
    Safari; modules and `fetch` do not. The tests already boot from file://, so the suite proves it every run.

## 3. Proposed layout

Folder `js/`, load order = source order = tag order in index.html. Names carry a two-digit prefix so `ls` shows
the order and a new file can slot in (gaps of 10). Sizes are today's.

```
index.html                       94k  markup + CSS + 31 <script src> tags (three.js tag first, unchanged)
js/10-player.js                  68k  1130–2273   renderer boot, player state, combat rules        (systems)
js/12-character.js               18k  2274–2556                                                     (systems)
js/14-items.js                   50k  2557–3301                                                     (systems)
js/16-viewmodel.js               45k  3302–4047                                                     (look)
js/20-quests.js                 127k  4048–6025   helpers + legacy terrain/portals + quests          (quests/systems)
js/22-dialogue.js               121k  6026–7688   dialogue + zone state/worldState/ZONES             (quests/systems)
js/24-forts.js                   84k  7689–9325   FORT_EXTERIORS data                                (cold)
js/30-plants.js                  37k  9326–9775                                                     (look)
js/32-people.js                  80k  9776–10478                                                    (look)
js/34-creatures.js               58k  10479–11049                                                   (look)
js/40-legacy-zones.js           180k  11050–14340                                                   (look)
js/42-zone-enemies.js           112k  14341–16103                                                   (systems)
js/44-legacy-towns.js           158k  16104–18842                                                   (look)
js/50-travel.js                  75k  18843–20210 goToZone, buffs, clock, day/night, interact        (systems)
js/52-dungeon-gen.js             56k  20211–21248                                                   (look)
js/54-thirdperson.js             27k  21249–21529                                                   (look)
js/56-dungeon-build.js          227k  21530–24746                                                   (look)
js/58-interiors-legacy.js        37k  24747–25349                                                   (look)
js/60-shop.js                    44k  25350–26199                                                   (systems)
js/62-actions.js                 62k  26200–27227 attack, cast, potions, HUD, minimap                (systems)
js/64-spells.js                  49k  27228–28045                                                   (systems)
js/66-hub.js                     51k  28046–28881                                                   (systems)
js/68-dungeon-misc.js            65k  28882–29411 decor, traps, portal fx, lockpick, lair, death     (mixed)
js/70-saves.js                   59k  29412–30252                                                   (systems)
js/72-audio.js                   24k  30253–30764   <- if(REN){ glue sits before this file            (systems)
js/74-strikes.js                 28k  30765–31296                                                   (systems)
js/76-music.js                   66k  31297–32398                                                   (systems)
js/78-placeholder-zones.js      160k  32399–35066 data                                              (quests/look)
js/80-world.js                  795k  35067–42531 the IIFE, whole                                   (both)
js/90-main.js                   101k  42532–44126 boot calls, K, PERF, loop                          (both)
js/92-creator.js                 53k  44127–45018   <- } close if(REN) glue sits after this file     (systems)
js/94-worldmap.js                57k  45019–46004                                                   (cold)
js/96-animdebug.js               14k  46005–46307                                                   (cold)
```

31 files, 3.24M total; the largest 795k, the median ~57k. Every cut is on a top-level statement boundary and
none splits a comment run: the cut goes above the contiguous comment/blank lines that introduce the region
(e.g. 42532 is blank, 45015–45018 is the "WORLD MAP SYSTEM" banner and goes with worldmap).
Two cuts are "clean but untidy": `68-dungeon-misc` mixes portal fx with lockpicking and the death screen;
`74-strikes` sits between two audio files because that is where the code is. Moving code is a rewrite; not in step 1.

Coarser alternative (Q1 option A, 12 files): player+character+items+viewmodel (181k); quests+dialogue+forts (332k);
plants+people+creatures (175k); legacy zones a/b+enemies (450k); travel+dungeon-gen+thirdperson+dungeon-build+
interiors (422k); shop..hub (206k); dungeon-misc+saves (124k); audio+strikes+music (118k); placeholder-zones (160k);
world (795k); main (101k); creator+worldmap+animdebug (124k).

## 4. The split script and the tooling around it

**`scripts/split.py`** (Python, like parsecheck and tag; it shells out to `node --expose-internals` for acorn, which
Node 22/24 bundle — CI has Node 22, no npm package needed).

1. Reads index.html, finds the single inline `<script>`…`</script>` (refuses if there is not exactly one), parses it.
2. Cut points are **patterns, not markers**: a table of `(file name, anchor)` where the anchor is the exact first
   line of the region's first statement (`const QUEST_DEFS=[`, `const PEOPLE_RIGS=new Set();`, `var WORLD=(()=>{`,
   `function _enterGame(){`, …). Each anchor must match exactly one line and that line must begin a Program-level
   statement in acorn's AST; otherwise the script stops and names the anchor. Main can keep moving until the day: an
   anchor that drifts fails loudly rather than cutting wrong. Markers in the code would need a commit on main now
   and would be one more thing for builders to keep; patterns need nothing.
3. Each cut is moved up over the comment/blank lines directly above the anchor (never past the end of the previous
   statement, which acorn gives).
4. Glue: the table also lists the two wrapper lines (`if(REN){` at the top of `72-audio`, `} // close if(REN)` at the
   foot of `92-creator`) as glue that is dropped from the pieces and recorded in `js/manifest.json` (or removed on
   main beforehand — Q4). Also the `<script>`/`</script>` lines themselves.
5. Writes `js/NN-name.js` (each piece is the exact byte range, newline-terminated as in the source), and rewrites
   index.html: lines 1–1128 unchanged, then one `<script src="js/NN-name.js"></script>` per file, then the rest.
6. Writes `js/manifest.json`: file order, glue, the source sha256 and the line ranges — the record of what was done.
7. **`scripts/join.py`** reads index.html's tag order and the manifest, concatenates `<script>` + pieces (+ glue) +
   `</script>` with the untouched head and tail, and compares sha256 with the pre-split file. `split.py --check`
   runs split into a temp dir and join back and prints the hash match. This is the byte-for-byte proof, run on the
   day on the frozen main, and the joined file is `node --check`ed too.
8. `--dry-run` prints the table of files, ranges and sizes (what §3 shows) without writing.

**parsecheck.py** becomes: (a) any remaining inline blocks, as now; (b) every `js/*.js` named by a `<script src>` in
index.html, `node --check` each, in tag order; (c) the concatenation of those files in tag order, `node --check`
once — this is what catches a `let`/`const` declared in two files; (d) fails if a `js/*.js` exists that no tag
names, or a tag names a missing file. Still two seconds.

**scripts/tag.py**: unchanged — the build tag is markup at line 765 of index.html.

**tests/lib/game.mjs**: `localBuild(src)` writes `index.local.html` next to `src` (repo root for the default;
gitignore `index.local.html`) so relative `js/` resolves; the cdnjs→`tests/vendor/three.min.js` replace becomes a
path computed relative to that location. Header comment "single-file build" goes. `people.test.mjs`: extract HEAD's
`index.html` and `js/` with `git archive` into `tests/tmp/old/`. Nothing else in `tests/` reads the source.

**tests/run.mjs**: unchanged for step 1 (same 8 shards, same SECS). Step 4's "only the suites a change touches"
needs a suite→files map; see Q5.

**.github/workflows/check.yml**: unchanged in step 1 (`parse` job runs the new parsecheck; `headless` unchanged).
`merge.yml` never looks at index.html. Later: a `paths` filter can skip the headless job for docs-only pushes.

**CLAUDE.md**: "The files" — index.html is markup and CSS with the script tags; `js/` holds the code, one file per
area, load order is the tag order, never add or reorder a tag by hand; the Session section says which file(s) a
feature lives in and that `parsecheck.py` now checks js/ and their concatenation; the Code map gains a file column
(WORLD internals all in `80-world.js` until step 2); "Things that have bitten us" gains: (i) a later file's function
is not there for an earlier file's load-time code or for a microtask/frame registered there; (ii) a top-level
`let/const` name is shared by all files — a duplicate is a SyntaxError in the later file, and parsecheck's
concatenation check finds it; (iii) `K` and the rest of the old `if(REN)` block's constants are plain globals now,
`window._K` still works; (iv) history before Session N is under `index.html` (`git log -L`), not under js/.
README's "one HTML file" line changes; itch uploads become the folder (index.html + js/, later + three.min.js).

## 5. Sequence on the day (fits the backlog's steps 2–3)

1. Merge auto/systems and auto/backlog; every other open code branch merged or abandoned.
2. Optional two-line commit: remove `if(REN){` (30249) and `} // close if(REN)` (45014); parsecheck; run the suite
   (this is the only semantic change and it gets its own commit and tag).
3. `python3 scripts/split.py --check` (hash match printed), then `python3 scripts/split.py`.
4. `python3 scripts/parsecheck.py`; `node tests/run.mjs smoke` locally, then the full suite in CI on the PR.
5. `scripts/tag.py bump`, devlog, backlog, CLAUDE.md, README, commit, merge. Delete `join.py` afterwards or keep it
   as the reversible proof (I'd keep it one release).
6. Michael updates the builders' prompts with the file list.

## 6. Step 2 — the WORLD IIFE (the conflict that the file split does not fix)

Both builders live in `80-world.js`, and 38 commits in three weeks changed line 42528. Options for a later Fable
session, all rewrites and so outside step 1:
- A. Break the return line only: one export per line (`WORLD.x=x;` assignments after a `var WORLD={}` or a
  multi-line object). Mechanical, an hour, removes the single most-conflicting line. Recommend first.
- B. Dissolve the IIFE into files: inner declarations become top-level in 8–10 files cut at the banner sections
  (height/colour 35067–35366, geometry 35367–36248, forts+buildings 36249–37915, dialog pools+generator 37916–38845,
  settlements/interiors/maps 38846–39769, ships+sea 39770–40448, footprints+crime 40449–41046, quests/sigils/
  factions/war/investment 41047–42337, ticks 42338–42527). Needs the four clashes renamed (`DOORS`, `KEYS`, `SG`,
  `tickNPCs`) and a check that no inner name shadows any of the 1,470 outer globals or is shadowed by a `var` —
  the acorn pass can list it exactly. Cost: a day and a full playtest; benefit: builders stop sharing a file.
- C. Keep it whole and accept it.

## 7. Open questions for Michael

**Q1. How many files?**
A. ~12 coarse files (each 100–800k; fewer tags, less to learn, but a builder's session still touches a 400k file).
B. ~31 files at the natural seams (§3; each is one area, median 57k; a session touches one to three).
C. All 38 seams (also splits character/items, minimap, strikes, the two zone halves further).
Recommendation: **B**. It matches the code map's names, and a coarser layout can always be made by joining.

**Q2. Folder and naming.**
A. `js/NN-name.js` with numbered prefixes (order visible in `ls`, room to insert).
B. `js/name.js`, order only in index.html.
C. `src/…` (later home for a CSS file too).
Recommendation: **A**, `js/`; the number is the load order and nothing else.

**Q3. Cut points: patterns or markers?**
A. Anchor patterns in `split.py`, verified by the parser (no change to main before the day).
B. `// @file name` marker comments committed to main now, so the builders see the boundaries while they work.
Recommendation: **A**. Markers would be one more line to conflict on for three weeks; the parser check makes drift
fail loudly, and the script is run once.

**Q4. The `if(REN){` wrapper.**
A. Remove it on main in its own two-line commit the morning of the split (suite run), so the split is byte-pure.
B. Record it as glue in the manifest; the split's join proof includes the glue.
C. Keep it and give up on splitting anything inside it (audio, world, main, creator stay one 1.45M file). Not viable.
Recommendation: **A**. The guard is dead code (line 1184 fails first); the change is honest and separately tagged.

**Q5. CI after the split: run only the suites a change touches?**
A. Keep running all 165 suites in 8 shards on every PR (today; ~25 min wall).
B. Each test names its files in a header line (`// files: 32-people, 80-world`), `run.mjs --changed` reads git diff
   against main and picks those plus `smoke`; pushes to main still run everything.
C. A hand-kept `tests/touches.json`.
D. Automatic from coverage — no: almost every suite executes world, main and player, so it selects everything.
Recommendation: **B**, but only after the split has settled (a week), because the mapping is a guess until the files exist.

**Q6. Should the CSS move to `style.css` in the same step?**
A. No — index.html keeps the markup and 94k of CSS; only the script moves. (Recommend: one change, one proof.)
B. Yes, `css/game.css` too.

**Q7. Step 2 for the WORLD IIFE (§6)** — A (return line first), B (dissolve), C (leave). Recommend A soon after the
split, B as its own Fable session when a quiet week comes.
