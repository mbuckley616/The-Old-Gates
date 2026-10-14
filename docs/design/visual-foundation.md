# The new visual foundation

*Claude, Session 771, 12 Oct 2026. Michael approved the slices and so A, the rebuild (decisions.md, "A new visual foundation"). This page is the brief for the Fable session that builds it. The two rules below, scale and the gates, are Michael's call-outs of 12 Oct written as measurements.*

> **Michael (12 Oct 2026):** "I also approve of the slices, but want to call out and be mindful of the proportions of our humanoids meshing well with the proportions of everything else in the world. Houses and buildings especially need to match. My only other callout is that the Interior and Exteriors of the gates are too small. They should be shockingly large, like what we see in the concept art. Forget the 'dungeon with cobblestone walls' feel of the previous version. I want to be as true to the concept art as we can be for the Gates."

The slices are in `docs/prototypes/levelup/` and live at *Gatelands live slices* (claude.ai). The order of work and the people are in backlog K; the builder for people and creatures is `character-builder.md`.

## 1. Scale: one unit is one metre, and everything is measured against a 1.8 m person

### What the game does today (measured in headless Chromium, Session 771, Dunmore at noon)
| Thing | Today | In metres, if a door is a door |
|---|---|---|
| A townsperson, top of the head | 1.05 to 1.15 units (the head bone 0.91 to 1.04 above the feet) | about 1.1 m |
| The player's eye (`EYE_STAND`) | 0.92 units | a child's eye height |
| A house door (the leaf) | 0.92 × 1.85 units | a real door |
| A cottage's eaves (`STYLE.irish.h`) | 2.4 units (3.3 for the stone town houses) | a real cottage |
| Interiors | the footprint × 1.8, ceilings 2.0 to 2.6 units, furniture heights × 0.62 | rooms built big to fit a small camera |
| A jog (`basespd`) | 3.83 units a second | a brisk jog |

So the buildings are already close to true metres, and the people are about 60% of the size their doors expect. Everyone is child-sized next to their own house. Interiors were blown up by 1.8 to feel right from a camera at 0.92, which is why rooms feel cavernous and furniture squat. This is the mismatch Michael felt. The slices are the other way round, and right: their people are 1.6 to 1.9 m, their doors 2.05 m, their eaves 3.5 to 4 m.

### The rule
**One unit is one metre. People are the measure; the buildings mostly stay; the camera and the interiors move.**

| Measure | Target |
|---|---|
| People | 1.55 to 1.95 m; men of the Gatelands about 1.78, Markmen to 1.95, the Old Blood 1.55 to 1.70 (canon §2; Michael's 1 B, the heroic hybrid) |
| The eye, standing | 1.65 m (crouched 1.1) |
| Doors | 2.0 to 2.2 m high, 0.95 to 1.2 m wide; a town gate 4 to 5 m |
| Storeys | 2.6 to 3.0 m floor to floor; cottage eaves 2.4 to 3.0; a two-storey house 5.4 to 6.5 to the eaves |
| Stairs | 0.18 m rise, 0.28 m tread |
| Furniture | table 0.75, chair seat 0.45, bed 0.5, counter 0.95, hearth opening 1.2 |
| Interiors | true size: a cottage room 4 to 6 m across, an inn's hall 10 to 14 m, a church nave 8 to 12 m wide; no × 1.8 |
| Speeds | stay as they are: a jog of 3.83 m/s, a sprint of 4.7 |

### How it is kept
- Every builder takes its numbers from one table, `SCALE`, in metres; no free numbers for a door or a storey.
- The mesh inspector stands a 1.8 m figure beside every building and prop.
- A test measures the ratios on built meshes: door height to person 1.1 to 1.25, storey to person 1.45 to 1.7, eye to door top 0.75 to 0.85.

### What it costs
The people grow (the builder makes them at true size), `EYE_STAND` goes to 1.65, the reach and the camera's collision follow, and the interiors are rebuilt at true size with their furniture. The houses' exteriors barely change. The world's distances and speeds do not change, so a road takes as long to walk as it does now.

### The exception
The gates. The Weavers did not build to a person's size, and the gap is the point.

## 2. The gates: shockingly large, as the concept art draws them

The references are OG-037 (V1: stepped arches in a hillside, a spine of script, a slit door, a camp at the foot), OG-045 (a nave of piers with amber script receding in the dark, a wet floor), OG-U2-009 (the six schools' gates, each a mountainside fortress-cathedral with three interior glimpses) and OG-U2-008 (the ruins, all at the scale of cliffs). Michael: forget the dungeon with cobblestone walls.

### Outside
| Measure | Target (the slice, Session 771) |
|---|---|
| The outer arch | 70 to 100 m high (100), 60 to 80 m across (76) |
| The orders | 4 to 6 stepped pointed arches (5), each 5 to 7 m of face (6) and 5 to 8 m deeper than the last (6.5), a roll moulding on each inner edge |
| The door | a slit 18 to 30 m high (24), 3 to 5 m wide (4), between two pillars of script |
| The spine | 80 to 110 m of dressed stone (104), two columns of glyphs, two ring sigils over the door |
| Its setting | cut into a cliff or a mountain, never free-standing on a lawn; a camp at the foot for scale |

Each school dresses the same skeleton (OG-U2-009): **Tine** in a volcanic range with magma channels and basalt spires; **Uisce** half-sunk in a fjord behind waterfalls, bridges to the door; **Cloch** hewn into snow peaks with titanic stairs and statues flanking; **Scáth** half-ruined on a black coast, the light failing; **Solas** on a sunlit plateau with falls and gold stone; **Gaoth** among cliffs and floating spires. The condition (canon Part I) breaks it: a steady gate is whole; a failing one is OG-037's V3, the broken circle; a catastrophic one is the Scarred Gate (OG-U2-008).

### Inside
Halls, not corridors. The dungeon generator today (`52-dungeon-gen.js`) lays a grid of rooms joined by corridors two to four metres wide. A gate's interior needs a second scale above it: a sequence of **spaces**, each 30 to 250 m, with the fighting in pockets inside them.
| Space | Size (the slice's nave) |
|---|---|
| A nave | 20 to 30 m wide (26), vault 40 to 60 m (50), 150 to 300 m long (250) |
| Its piers | 3 to 5 m thick (4), every 12 to 16 m (14), script up the face, ring sigils at two heights |
| A stair hall | a flight across the whole width, 3 to 6 m of rise (4.2) |
| The far end | a ring 30 to 40 m high, dark at its heart |
| Other spaces | a crossing under a dome, a rotunda, a chasm with a bridge, a flooded hall, galleries above the aisles |
| Floors | great slabs of dark stone, 2 to 3 m, wet in patches and reflecting the light; never cobbles or small flags |
| Light | the script (amber), braziers, the carried torch, one shaft of cold light from a cleft; aisles left dark |

The schools' halls follow OG-U2-009's glimpses: forges and molten depths (Tine), sunken streets and tidal machinery (Uisce), titan halls and shifting foundations (Cloch), corridors that fold (Scáth), archives of light (Solas), floating halls and vertical shafts (Gaoth).

Fights happen in pockets 15 to 30 m across inside the spaces (a side chapel, a bay between piers, a landing), so combat keeps its reach and the scale is for walking in. The generator change (spaces above rooms) belongs to the systems builder and is part of the foundation's gate work.

### The world's corruption (Michael, 13 Oct)
On Varek's path each great gate cleared corrupts the world where the player can see it (lore §9a): the sky's colour, the trees' shapes, colour draining toward black and white. The new renderer makes this cheap if it is planned now: one corruption level, 0 to 6, read by the grade pass (saturation, hue), the sky dome's palette, the cloud tint and the tree kit's crown shapes, so each stage is a set of numbers rather than new art. The level is the number of great gates torn open, so it falls again when the player goes back and seals one (each choice is reversible until all six match, Michael, 13 Oct). Each torn gate may also tint the world by its school (ember for Tine, drowned blue for Uisce). Six sealed hold it at 0 for good.

### Cost
The slice's 250 m nave is about a dozen meshes of merged stone plus about a hundred small glyph quads, and renders like the lane. Scale is cheap; light count is what costs. The slice uses about 20 point lights and one shadowed spot.

## 3. The order of work (backlog K)
1. **The renderer:** three.js 0.170 behind a switch; the old look stays playable until the new one is whole.
2. **The scale pass:** `SCALE`, the eye, the interiors at true size, the ratio test.
3. **The land:** the vista slice's terrain shading, grass, trees, sky, water and post, streamed with the chunks at three quality levels. The grade follows P10b (OG-147), the art direction Michael kept on 13 Oct over P10a (OG-146): warm, painterly and saturated, with the gates kept dark as §2 has them (backlog L12).
4. **People:** the builder (`character-builder.md`), B1 to B6.
5. **The gates:** the outside per school and condition; the inside as spaces; the generator's second scale.
6. **Buildings as pieces:** the lane slice's kit across the three islands.
7. **The cascade:** backlog L built in the new kit.

*What surrounds these cards (the finish line of 2.0, the drafted cards F8 to F14, the split of F2, the mechanics and the budgets) is `v2-scope.md` (Session 829), approved by Michael the same night (1 B, 2 A, 3 A).*

## 4. The sessions, queued (Michael, 12 Oct 2026: "Go with both of your recs")
Asked whether the next sessions were planned, Claude found the plan written but nothing queued. There was no Fable card on the control room and no roadmap epic, and the look builder was still building section H in the old style. Michael took both recommendations: queue the foundation as cards, and move the look builder to work that carries over until the renderer lands.

**For the producer: the cards.**
| Card | Who | Starts when | What it is | FREEZE |
|---|---|---|---|---|
| **F1. The renderer** | Fable | the systems branch's open PR has merged (no code PR in flight); then Michael's Start | three.js r128 → 0.170 behind a switch (`?look=new` and a setting), the old look whole and the default; `skinning: true` and the other removed r128 options moved over; every suite green in the old look | yes: it touches every `js/` file that builds a material |
| **F2. The scale pass** | Fable | F1 merged | §1's `SCALE` table in metres; people at true height; `EYE_STAND`→1.65; reach, camera collision; interiors rebuilt at true size, the × 1.8 gone; the ratio test | yes |
| **F3. The land** | Fable | F1 merged (beside F2 if the files allow) | the vista slice's terrain shading, grass, trees, sky, water and post, streamed with the chunks, three quality levels, in the new look only | yes (the world files) |
| **F4. People and creatures in the game** | Fable | F1 merged; B1–B3 done | the builder's genome read by the game: townsfolk first, then foes; the wolves move to creature plans (`WOLF_KINDS` → `PLANS`); level of detail for crowds | yes (`32-people.js`, `34-creatures.js`) |
| **F5. The gates** | Fable, with the systems builder for the generator's second scale | F2 merged | §2: the outside per school and condition, the inside as spaces of 30 to 250 m | yes |
| **F6. Buildings as pieces** | Fable or the look builder | F2 merged | the lane slice's piece kit across the three islands | — |
| **F7. The cascade** | the builders | F6 | backlog L in the new kit, item by item | — |

**Until F1 lands, the look builder works on what carries over** (its routine prompt was changed to say so, 12 Oct). These are the builder's B1 to B3 in `docs/prototypes/levelup/`:
- B1, the human builder page with genome save and load, and the women's braids;
- B2, the wardrobe kit;
- B3, the four peoples' slider ranges and the named cast's genomes;
- the creature kit's owed parts.

Visual choices still go to Michael as decisions with pictures. Section H's old-style look items wait. Fixing something broken in today's game is still allowed. When F1 merges, the producer gives the look builder back its usual order, now in the new look.
