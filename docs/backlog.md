# The Old Gates — Backlog (as of Session 148, 17 Sep 2026)

Pulled from every "owed", "not yet" and "flagged" note in the devlog, sessions 93–124, plus the items raised at session close. Grouped by area; within each, roughly in the order they'd pay off.

## A. Story and quests
- **Playtest 16 Sep (Michael)** — ~~the home province re-laid~~ (Session 134: hand layout, Portclare a port, gates spread, POIs off roads, bridges); ~~world enemies to dungeon parity~~ (Session 135: bars, loot, detection, the pack, flanking, archers). Also: ~~the green sheet at a river's end~~ (Session 134); weather by eye.
- ~~Tutorial questlines feeding Act II~~ — **done, Session 125** (optional; *A Town Worth Keeping* from any lord, *Salt Water* from Corwin; Act II reads the sea line).
- ~~Authored faction questlines~~ — **done, Session 128** (nine services each, set pieces: the Silent Survey, the Duel at Caer Slige, the Black Sail). Owed: a real duel (a ring, a yield); the spire to hold after the League's finale.
- **Consequence hooks still open**: shrines remembering (three prayers → the boon permanent); *"someone says one of the three descriptions to you and goes back to their bread"* in the open ending; Varek's list found in the first gate after the unbound ending.
- **Lore objects**: the Guest lorebook, defaced niches, the Church's line on the Guest; sigil-lore books in the guilds.
- **The Root's cavern** wants authored rooms (a set piece at the root itself), not only the *deep* generator.
- **The Reader's discoveries** in real play: *the map* (fast travel before walking a road) is untested outside the harness; *the held breath* wants a check across a real six-hour gap.
- ~~A recurring rival~~ — **done, Session 128**: Hesket Rowe, through all three faction lines (mentioned at 2, present at 4, found at 6, the duel or the coda at 9).
- **Docs purge**: the 318 flagged lines in `lore_canon.md` / `quest_writing.md` are the author's text; the audit lists each with its rule.

## B. Systems
- ~~Prosperity: wall tiers, plague, siege and occupation, pirates sacking ports, the ruin variant~~ — **done, Session 129**. Owed: soldier models of their own; occupation effects from the canon (tithe, duels); a word from a town you own when it's besieged.
- **Coach lines**: enterable coaching inns; a midpoint stop. ~~The coach halts when a camp breaks the road~~ — done, Session 129.
- **Trade routes**: the caravan visibly attacked when a route breaks.
- **Cargo trading** between ports with prices by island; **skills by use** (the Morrowind model). ~~Inn single-room rental vs the whole inn~~ — **done, Session 141**: the innkeeper lets one named room, other guests hold the others, the rest of the landing turns you away.
- ~~Lockpicking as a minigame~~ — **done, Session 142** (Oblivion's lock: a pin per tumbler, set it at the shear, a mistimed press snaps the pick; difficulty steady per door, finesse widens the window). Owed: locks on chests and on world doors — only dungeon doors are locked today.

## C. Combat and creatures
- ~~Third-person~~ — **done, Session 126** (jointed body, kit on the body, poses from combat state, collision-aware camera). Owed: arrows/spells from the hands rather than the eye; weapon trails; drink/loot poses.
- ~~Dungeon enemies' attack animation~~ — done, Session 130 (one shared pose).
- ~~Mesh cleanup, second pass~~ — done, Session 130 (spider family, dragon, humanoid pivots). There are no rats; the note was wrong.
- ~~Boss tuning by level~~ — done, Session 130 (the master scales; the charge into a wall dazes; captains guard). Owed: a mechanic for the dungeon master beyond numbers.
- ~~Dragons outside the Salt Mouth~~ — done, Session 130 (a rare tundra/wasteland encounter with its own shape).

## D. World and presentation
- ~~Fort compound~~ — **fixed, Session 131**: every fort was at NaN (roadPoint's changed return); all eight are back and the ring probes solid. **Session 132**: the legacy zones were building the old exterior kit on top of each compound; forts are filtered out of them now; the fort's landmark impostor (a 48u grey cylinder) was never hidden under the compound — that was the "inner ring"; hidden now.
- **Weather visuals** by eye (rain streaks at speed, snow on tundra, thunder timing). ~~Fog thickness~~, ~~rain loudness and indoor muffling~~, ~~snow's sound~~ — **Session 145**. To trigger: `devWeather('rain'|'storm'|'snow'|'fog'|'overcast'|'clear')` in the console, in the open world; it blends over ~25s and holds ~4 minutes.
- ~~**Snow that settles**~~ — **done, Session 146**: cover builds while it snows and melts after, blended into the ground colour (flat ground holds it, steep sheds it, altitude thickens it), repainted six chunks a frame; the far north keeps a .30 covering. ~~Roads and paths stayed bare~~ and ~~footprints~~ and ~~a softer step on snow~~ — **Session 147** (the bare strip was the road ribbons, not a town ground mesh; the S146 note was wrong). Owed: trees, rocks and roofs stay bare; cover is one world-wide depth rather than per-cell; the trail judged by eye.
- ~~**Weather strength by place**~~ — **done, Session 146**: per-biome rain/snow/fog multipliers blended across regions, stronger at sea; tundra snows hard, dunes barely rain, fens fog.
- ~~**Sun, moon and stars**~~ — **done, Session 148**: sun and moon ride the same angle as the sun light (so the disc agrees with the shadows), moon phase over a 29-day cycle, 760 stars fading in on the night factor, and weather hides all three. Owed: the sun's and moon's size judged by eye; they're decorative rather than an ephemeris.
- **The Guest's chapel**: the black-screen prayer checked in the real DOM.
- **Performance**: NPC part merging if towns of forty NPCs ever stutter.

## E. Interface
- **The look, later**: a barber/tailor in towns to change hair and dyes after the creator; NPCs could draw from the same tunic dyes by nation.
- **Pause menu**: ~~an equipment summary on the sheet~~ (Session 131); keyboard navigation of folders.
- **Map**: ~~a legend toggle~~ (the Key, Session 131); route/coach lines labelled.
- ~~**Buildings coloured by type**~~ — **done, Session 138**: one `BLD` table drives the Local view, the minimap and the Key. Michael's scheme plus inn orange, smith/armourer charcoal, apothecary green, goods brown, shipwright teal, barracks dark red, tan *Other*. The lord is a gold dot (most towns have no keep); your own house is outlined. *Owed:* the colours judged by eye at night and on snow.
- ~~**Directions from townsfolk**~~ — **done, Session 138**: a *Where can I find …* folder on every townsperson and guild head — the lord and the nearest of each building — answered from where you stand, marked on the compass with its glyph and ringed on the Local view until you arrive or leave town. *Owed:* whether it should also name places outside the walls.
- ~~Compass quest markers taking the place glyph set~~ — done, Session 138.

## G. Playtest checks (built, verified only headless)
- **Sky (Session 148)**: sun and moon size at real distance; a clear night versus an overcast one; sunrise colour on the horizon.
- **Snow tracks (Session 147)**: a line of prints across a snowy field at walking height — size, darkness and how long they last; a road under deep snow.
- **Weather by place (Session 146)**: whether tundra snow and fen fog feel different enough as you travel; how the snow line looks where open ground meets a town.
- **Weather (Session 145)**: fog at 36 steps of sight — atmospheric or claustrophobic; rain indoors at a fifth of outdoor volume; snow's low wind.
- **Map colour (Session 144)**: the biome tints at a real zoom — especially moor and swamp together.
- **Interior doors (Session 143)**: open and shut a door in an inn room and a shop's back room — height against the ceiling, the swing against the furniture, and whether a shut door traps an NPC awkwardly.
- **Lockpicking (Session 142)**: pick a dungeon door by feel — whether the hold window is fair, and whether losing a set pin on a snap is too harsh.
- **Inn rooms (Session 141)**: rent a room, sleep in it, try another guest's door; whether being turned away reads as fair.
- **Export/import (Session 139)**: export a character in real Chrome on `file://` and import it back; a file kept outside the browser is also the way to hand me a save to debug.
- **Wayfinding (Session 138)**: the town colours by eye in a real town, at night and in snow; ask a few people for directions and see whether the bands (*a short walk* / *across the town*) match what the walk feels like; the compass glyph at real size.
- **Saves first (Session 137)**: a slot, an overwrite, an autosave and Continue, in real Chrome on `file://`. Sacking beside a village camp; kobold cowards and the boss half-health phase by feel; the Guest's chapel black screen; the held breath across a real six-hour gap; the tutorial lines in real play — Corwin at a pre-commission quay, the discounted hull, a live boarding; the forts in real play — one fort per door now: ring, gate, keep, barracks, and the keep door's prompt; the interior partitions; the creatures in real play — the pose, the daze, the captain's guard; the war in real play — a siege camp on a road, a garrison on a plaza, occupied colours on the gate; the faction lines in real play — Rowe at the seat, the duel on the yard, the black sail; third person in real play — poses in real lighting, the camera on a ship's deck and the coach seat, the swing's timing against hits; the creator's look preview canvas (WebGL, unverifiable headless).

## F. Saves
- ~~Storage full; delete; autosave ring; character groups~~ — **done, Session 136** (IndexedDB store, per-character groups, a ring of five, delete). ~~A storage-used line on the menu~~ (Session 137); ~~export/import a character as a file~~ (Session 139: one JSON per character, import lands as a new character rather than overwriting, bad rows skipped and counted). **Nothing owed on saves.**
- ~~Saves silently doing nothing; Continue broken~~ — **fixed, Session 137**: the payload skips live scene handles; every store failure settles with a named reason on screen; Continue's stale `slotN`; quests and guild tasks re-spawn their NPC, pickup or camp after a load. **Playtest first:** the Save tab's top line says *IndexedDB*, a slot writes, an autosave appears; *Where is Gráinne?*: she stands again when you walk back.
- Saves are **by location** now (world / house by id / dungeon by seed and floor). Old saves without `where` fall back to the last outdoor position, then the spawn. Nothing owed; watch for a place that fails to regenerate (a house id that changed).
