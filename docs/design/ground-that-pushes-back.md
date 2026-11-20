# Ground that pushes back

*The systems designer, 20 Nov 2026. A proposal, not a spec: nothing here is built until docs/decisions.md carries a `Michael:` line under it.*

## The problem in Michael's words
Backlog L11, from his review of the concept art (OG-131, his note): "**Moving through the world**: armour weight changing the roll, mantling low obstacles, ladders, swimming with a breath bar and places under water to search, the schools as traversal (magic B's table), and ground that pushes back: poor footing on ice, mud that slows, a rope bridge that may give, falling rocks. Not climbable cliffs or rope climbs (platforming C); mounts stay undesigned."

Most of that list is built. What is left is the last clause, which the kit's page (#1504) handed on: its footing "belongs to the movement proposal". The road's own ground (fords, frozen lakes, passes) was the road page's A, and Michael chose B; this page does not ask it again.

## Today
The run is 3.83 m/s (4.2 at Athletics 100), a sprint ×1.225 (`90-main.js`, the line that builds `spd`); that multiplier reads the load, the sneak, the buffs and the stagger, never the ground. The roll (`startRoll`) is 2.6 m in 0.45 s, or 1.8 m in 0.6 s past 70% of your carry, and `rollLoad` already counts armour: Michael's first item is done. The mantle, falls, the double jump and air dash, the 40 s breath bar (`diveTick`), and ladders, ice and swimming in rooms (#1083 A, Sessions 1805–1808) are in. The weather already keeps what this page needs: `WX.cover`, the snow lying where you are (0 to 1; the far north keeps 0.30), and `worldState.wxSeen`, the last minute it rained and stormed. Ice you stand on: a gate's frozen pool, Sioc's floe and frozen-wave bridge (6.2 × 1.6 m), the Mark's ice caves. Steep ground does not slow you; no rope bridge is built (platforming B's gorge crossings are owed); nothing falls from a cliff.

## Direction A: weather underfoot
**The loop.** The ground answers the weather you saw fall. After rain the fields are mud and the road is quicker; after a Mark snowfall the drifts cost pace and breath; in a gate, the pool Sioc froze is a floor that does not stop when you do. You choose the road or the straight line, nailed boots or quiet ones.

**The rules.** One function, `footingAt(x, z)`, gives the ground's kind and multiplier, read only from what is saved or seeded (the cell's biome and climate through `getCell`, `roadInfo`, the town stamps, `WX.cover`, `worldState.wxSeen`). The worst one applies, never two, and nothing goes below ×0.8.

| Ground | Where and when | Run | Sprint's drain | Roll | Why |
|---|---|---|---|---|---|
| Firm | roads' beds, town stamps, rock, sand, floors | ×1 | ×1 | as now | the road answers all of it |
| Snow | off a road, `WX.cover` 0.5 to 0.8 | ×0.9 | ×1.2 | as now | 3.45 m/s, felt over a field, not in a fight; the north's 0.30 floor never slows |
| Deep snow | off a road, `WX.cover` over 0.8 (a blizzard's or a long fall's) | ×0.8 | ×1.4 | ×0.85 | 3.06 m/s; a blizzard's second edge after the cold grade |
| Mud | off a road, on soil (not rock, sand or snow), while it rains and 120 game minutes after (360 after a storm), the specimens' own windows; Aurenne only after a storm | ×0.9 (×0.85 in heavy rain or a storm) | ×1.2 | ×0.85 | the wet island's ground (autumn rain ×1.5, `seasonWx`); prints as in snow (`FP`) |
| Ice | a frozen pool, Sioc's floe and bridge, an ice cave's lake | ×1 | ×1 | ×1.3 (3.4 m light) | not slow, but it does not let go: you gain and lose speed at 6 m/s², so a stop slides 1.2 m (1.8 from a sprint); a stagger knocks you 1.5× as far |

**The answer you buy.** *Hobnails*: any boots taken to a smith in the Gatelands or the Mark come back nailed, 25 gold, an hour (the smith's page, as the light line's leather). Nailed, ice grips at 20 m/s² (a stop slides 0.37 m) and deep snow is only snow. The price is noise: on stone and planks, indoors and in gates, a foe hears you walking at 4 m, not 3, and sneaking at 1.5, not 1 (#1511's numbers, which the rain lowers outdoors as now). Draw the nails at the smith for 5 gold. Mud has no answer but the road. Precedent: Valheim makes the weather a reason to take the track; Skyrim leaves its snow as paint, crossed at a meadow's pace.

**The foes.** A foe on the same ground goes at the same multiplier, through the same function, so a muddy field slows the chase as well as the flight. The Mark's own (the Snow Wolf, the reindeer, the Frost Troll) ignore snow; nothing ignores ice. Foes still treat a frozen pool as a wall (Session 1682), so ice stays the player's ground.

**Touches.** `90-main.js` (the multiplier and, on ice only, a velocity that eases), `startRoll`, `tickCreatures` and `tickZoneEnemies` (the foe's step), `85-world-sea.js` and `86-world-crime.js` (`FP` in mud), the hearing radius in `86-world-crime.js`, the smith's page in `60-shop.js`, and a footing word beside the climate pill (`climatePill`): *Snow*, *Deep snow*, *Mud*, *Ice*. No new `worldState` key: `wxSeen` is the world's and saved; the nails are a field on the boots, so they ride in the character row with `EQ` and `BAG`.

**Cost.** Three ordinary systems sessions: snow and mud with the foes and the pill; ice's momentum and the roll on it; hobnails, the smith and the noise. No look session (the mud's prints reuse the snow's).

## Direction B: A, plus the land's shape
**The loop.** A, and the land has a grain: a steep face sends you round by the shoulder or the path, the Mark's scree runs under you, platforming B's gorges are rope spans with a rotten plank you can see if you look, and under cliffs in rain stones come down.

**The rules.**
- **Slope.** Up to 30° as now; 30° to 40° uphill ×0.7 and a sprint drains ×1.5; past 40° you cannot step up and slide back at 3 m/s; on scree (the rock band above the Mark's tree line) the slide starts at 32°. Elden Ring's steep ground is the precedent: a wall you read.
- **The rope bridge.** Every gorge crossing in platforming B is a rope span; one plank in eight is rotten, seeded by the bridge's id, darker and split along its grain. It holds a walk and breaks under a sprint or a load past 70%: a fall into the gorge by the falls' rule (free to 4 m, then 6% a metre; the roll halves it). It is mended a game-week later, the world's flag.
- **Falling rocks.** Below a face steeper than 55° within 20 m, in rain, a storm or the last 7 days of winter, a fall rolls once in 10 game minutes while you stand in its lee: a crack and dust 1.2 s before (over the 150 ms floor), 15% of your health, none if you roll or step out. Never on a road, never a death: platforming's "no death traps".

**Touches and cost.** A's, plus a terrain normal in the movement step, the camera on a slide, the foes' paths, the gorge in the generator, the bridge in the kit and a slide pose: A's three sessions, one deep-work (the slope in the movement code everything leans on), two systems, one look, one bodies. **Displaces** the straight line across the world, and the far terrain must show steepness at a glance, which F3's land does not yet do.

## Direction C: B, plus the body's load in every movement
B, and plate changes every movement, not only the roll: a run ×0.93, a jump 0.85 as high, a swim ×0.7 draining 4 stamina a second (Morrowind's encumbrance, Dark Souls' equip load). The roll and the air step already read the load, the Armour perks are priced against that, and a plate fighter slowed at a walk is the stiffness combat B set out to lose. Two more systems sessions and a retune of the Armour perks.

## Recommendation
**A.** A world that pushes back (feeling 2) with a choice at each edge: the road or the field, the nails or the quiet. It reads only weather already saved and seeded, so a friend stands in the same mud, and it is one function and three ordinary sessions. B's slope should wait until F3's land shows steepness at a distance and platforming B's gorges exist; its bridge and rocks can come then as that page's places. C makes heavy armour stiff, against the third feeling.

## What must be true first
Nothing blocks A: the weather's history, the cover, the climate and the frozen pools are built. B waits on platforming B's generated places (the gorge crossing) and on F3's land at a distance. The ice's momentum must keep the dropped-frame rule (eased by the loop's clock, never by frames).

## Not asked
- **Fords, frozen lakes and the passes**: the road's A, which Michael did not choose (#1587). A's ice is the ice that already exists.
- **Wear on boots**: the kit's C; the nails never wear.
- **Climbing, ropes, the grapple**: platforming C, declined.
- **Mounts on mud**: mounts are undesigned.
