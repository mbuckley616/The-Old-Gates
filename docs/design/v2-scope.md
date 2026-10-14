# The Old Gates 2.0: the scope

*Claude, Session 829, 13 Oct 2026, asked by Michael in chat ("write up the 2.0 scope"). A proposal: the cards below are drafts until Michael approves them, and what 2.0 includes is his call (`decisions.md`, *What ships in 2.0?*). The look's brief is `visual-foundation.md`; this page is everything around it.*

## 1. What 2.0 is

**2.0 is the day the new look becomes the game.** On that day `?look=new` is the default, three.js r128 and every builder that only the old look uses are deleted, and the game a new player opens is the new one. It is one release, not a rolling change. Until then, main ships the old look as today and the new one sits behind its switch (F1, merged 13 Oct).

It is done when all of these hold:
1. The full suite (453 suites today) passes under `--look=new`, and the suites that measured the old look's numbers have been re-measured at true scale, not deleted.
2. Every place a player can reach is drawn by the new kit: the open world, towns, interiors, gates great and lesser, the places that are not gates, ships and the sea.
3. Every body a player can see comes from the builder's genome: townsfolk, foes, animals and the player in first and third person.
4. A save made before 2.0 loads into 2.0 and plays on.
5. It runs at an agreed frame rate on Michael's laptop at the middle quality level, and the download stays under an agreed size (§5).
6. The mechanics Michael puts in 2.0 (§4) are built and pass their suites.

## 2. What is planned: F1 to F7

| Card | What | State, 13 Oct |
|---|---|---|
| F1. The renderer | three.js 0.170 behind a switch | **Merged** (Session 822). Owed: the full suite under `--look=new` (6 world suites run) |
| F2. The scale pass | one unit a metre, people the measure, interiors at true size | Next; no card on the board yet |
| F3. The land | terrain, grass, trees, sky, water, post, three quality levels | Waits on F1 (done). The grade follows P10b (OG-147) |
| F4. People and creatures | the builder's genome in the game, crowds' level of detail | Builder B1 to B3 done in prototype; hair, wardrobe and heights answered (#272, #274, #276) |
| F5. The gates | outsides by school, insides as spaces of 30 to 250 m | After F2 |
| F6. Buildings as pieces | the piece kit across the three islands | Prototyped: the Gatelands, Aurenne, the Mark's hall; #259, #277, #280 answered |
| F7. The cascade | backlog L in the new kit | After F6; L now runs to L12 with the third round of art |

## 3. What the plan is missing

Measured against what the game contains (the code map in `CLAUDE.md`, the 41 files), these have no card. Each is drafted as one below, in the same shape as F1 to F7.

### F2 is bigger than its card
People grow about 1.6 times; the world's distances and speeds do not (§1 of `visual-foundation.md`). Everything tuned in units against a 1.1 m person moves with them, and the card names only the eye, reach, the camera and interiors. Also owed:
- **Reach and interaction:** melee arcs and hit volumes (`74-strikes.js`), E's reach (2.2 units, 3.2 aimed), lock-on range, pickup and door ranges.
- **Sight and stealth:** witness and guard sight (the dark hood's 11 units), sneak radii, foes' chase sight.
- **Movement:** the platforming page's numbers are in old units: the mantle at 0.62 to 1.1, gaps of 2.5 / 3.4 / 4 to 5 units, fall damage past 4 units. Water depth for wading and swimming.
- **Foes and animals:** each family's size against the player (a wolf, a troll, the Faolchú) and its reach.
- **Places built around the small person:** the dungeon generator's corridors of 2 to 4 m, doors in dungeons and forts, ship decks, the helm and cabin doors, stairs at 0.18 m a rise.
- **Tests:** suites that assert distances (`chasesight`, `sleeperreach`, `witnessrange`, `fortwalk` and others) are re-measured, not loosened.

**Proposal:** split F2 into **F2a** (the `SCALE` table, people, eye, camera, interiors, the ratio test) and **F2b** (the gameplay numbers above, one table of ranges in metres, every suite that measures them). F2b is systems work and can run as Opus sessions after F2a merges.

### Drafted cards

| Card | Who | Starts when | What it is | FREEZE |
|---|---|---|---|---|
| **F8. Places that are not gates** | look builder, systems builder for the generator | F2a merged | Crypts, mines, caverns, ruined forts, smugglers' lairs, wrecks (backlog L10, OG-121), the lairs, camps, barrows and the old gate mounds, all in the new kit; the forts' compounds and their rooms. The generator's room-and-corridor plans stay for these, at true size | no |
| **F9. Rooms** | look builder | F2a merged, F6 begun | The interiors dressed, not only resized: homes, inns and shops by nation (L5, L9, OG-115, OG-108), furniture at the table's heights, light indoors (OG-141: windows by hour, hearths, candles, chandeliers) | no |
| **F10. The player's body** | deep work, then the look builder | F4 merged | The player built by the genome; the first-person hands and weapons (`16-viewmodel.js`) and third person (`54-thirdperson.js`) on the new skeleton; the creator and the barber reading the builder; worn armour, weapons, cloaks and capes on the new body; every animation (swings, the roll, the bind, the parry, ragdolls) moved from the 17-bone rig | yes (`10`, `16`, `32`, `54`) |
| **F11. Ships and the sea** | look builder | F2a and F3 merged | The hull lines by island (L6, OG-004), decks and cabins at true size, sails and rigging, harbours and quays, the sea floor and its wrecks under F3's water | no |
| **F12. Effects and weather** | look builder, systems for the corruption level | F3 merged | Spells by school (`64-spells.js`), fire, sparks and impacts by surface (OG-127), rain, snow and blizzard, footprints, weather on surfaces (OG-138), the gate storms, and **the corruption level 0 to 6** that §2 designs and no card owns: one number read by the grade, the sky, the clouds and the tree kit | no |
| **F13. Old saves into 2.0** | systems builder | F2b and F10 merged | A save's look and people become genomes; positions inside rooms, saved in old units, map to the rooms at true size; a load test over saves made on the last 1.x build | no |
| **F14. The cutover** | deep work | everything else in §1 | The full suite green under `--look=new`; the frame rate measured on Michael's laptop at each quality level; the download measured; the default flipped; r128, `05-compat.js`' shims and the old builders deleted; the legacy zones' code retired (§6, Q2); the mesh inspector and the control room's Meshes tab rebuilt from the new kit; `CLAUDE.md`'s code map updated | yes |

The mesh inspector rides along: every card that adds or renames a mesh adds it to `97-inspector.js` and republishes the Meshes tab, as now.

## 4. The mechanics

Michael has chosen a design for every large system. Several are built, and several are not started. Which of them must be done before 2.0, and which keep shipping on main around it, is not decided (§6, Q1).

| System | Michael's choice | Built | Owed |
|---|---|---|---|
| Combat | B, Elden Ring's shape (28 Sep) | Most: roll, posture, lock-on, parry and riposte, finisher, tells | The attack table and one resolver (a deep-work session, never carded) |
| Skills and perks | A, the Morrowind book (27 Sep) | No | `skillUse`, the skills table, perks at 25/50/75/100, the level page (#142) |
| Enemies by place | the designer's condition on A; C, not yet (29 Sep) | No | Waits on the skills build |
| Magic | B, words of the deep tongue, with a questline to find the sigils (29 Sep) | No | The words, the five forms, the riders, the spell page (A), the questline |
| Survival and alchemy | B, plus 3 to 4 effects a herb found by combining (30 Sep) | No | Waits on the skills build |
| Platforming | A, plus generated places with several ways across (B, 2 Oct) | Fall damage and the landing roll (S429) | Heights for solids (deep work), the mantle, jumps by Acrobatics; **Michael's double jump and air dash** (L11, 13 Oct) |
| Sailing | A, wear and mending (1 Oct); two new hulls (7 Oct) | Wear, mending, rams; hulls in part | Michael's 6 Oct playtest items (backlog I and J: hulls collide, pirates' arrows, browse ships, cargo) |
| Journal and calendar | C, the dated journal, a calendar the world keeps, the topic index (4 Oct) | The dated journal (S486) | The calendar's days, months and years (names answered, #146), market days and feasts |
| Interface | A, parchment everywhere, HUD in Oblivion's places (27 Sep) | The pause leaf's rule; prototypes | Seven panels waiting on a build session (the HUD #198, saves #199, books, counter and chest, lockpick, the fall #243, the spell page) |
| Unique artifacts | B, the Makers' six tools (6 Oct) | Six tools and five trials (S776 to S802) | The cloak's den trial; the props, in the new kit |
| Co-op door | A, keep it open (3 Oct) | Two-row saves, `targetOf`, seeded loot | Ids for what has none, the rest of the rolls (backlog K) |

Two of these touch 2.0 whatever Michael decides:
- **Combat's resolver and the scale pass (F2b) change the same numbers.** Build the resolver before F2b or as part of it, or the reach and hit tables get tuned twice.
- **Skills A unblocks three systems** (enemies by place, survival B, Acrobatics' movement), and the art's third round leans on it (L11). It is the largest mechanical piece not started.

## 5. Budgets to agree

The look's brief names three quality levels but no numbers. Proposed, for Michael to accept or change:
- **Frame rate:** 45 fps or better at the middle level on Michael's laptop in Portclare's square at noon, the critic's worst spot (the 29 Sep run measured 2.0 s a frame there on software GL, which is not a target machine).
- **Download:** under 40 MB for a first load. three.js 0.170 is about 0.7 MB; the builder makes people and creatures in code, so only textures and sounds weigh.
- **Draw calls:** under 1,000 in the busiest town view at the middle level (Dunmore draws 836 at noon on F1).

## 6. Questions for Michael (filed in `decisions.md`)

**Q1. What ships in 2.0?**
- **A. The look only.** 2.0 is §1's checklist without item 6. Mechanics keep landing on main as they are built, before or after the cutover.
- **B. The look and the core loop** *(recommended)*. 2.0 also waits on combat's resolver, skills and perks (A), enemies by place, and magic B with its questline: the systems that decide how every fight and every level feels, and which the third round of art leans on. Survival, platforming's places, sailing's playtest items, the calendar and the parchment panels keep landing on main as they are built.
- **C. The look and everything you have decided.** Everything in §4 is built before the cutover. This makes for the longest wait.

**Q2. The legacy zones.** The open world now plays Ashenmoor and Ironhaven (Sessions 236 to 240), but the legacy builders (`40-legacy-zones.js`, `44-legacy-towns.js`, about 6,000 lines) still exist.
- **A. Retire them at the cutover** *(recommended)*. Q7's old-zone path moves to the world first (it still lives only in the legacy zones), then the files go.
- **B. Rebuild them in the new kit.**

**Q3. Accept F8 to F14, the F2 split and the budgets in §5?** Yes as drafted, or with changes.

## 7. Order

F2a, then F2b and F3 side by side (F3 under its own FREEZE of the world files). F4 then F10. F5, F6 and F8 after F2a. F9 and F11 once their parents are in. F12 after F3. F13 after F2b and F10. F14 last. Combat's resolver before F2b. Skills A whenever a systems builder is free, since nothing in the look blocks it.
