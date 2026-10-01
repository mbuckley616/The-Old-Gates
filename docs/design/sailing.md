# Sailing as a loop

*The systems designer, 1 Oct 2026. A proposal, not a spec: nothing here is built until docs/decisions.md carries a `Michael:` line under it.*

## The problem in Michael's words
> "Sailing as a loop: real waves, especially in open water (the boat pitches and rolls on them; the look is the builder's, H.5b); hull damage from storms, rocks, rams and pirates; a hull and mast repair system tied to skills — woodcutting for timber, a crafting skill for the work — and a shipwright who does it for coin. Ties to the skills proposal and the survival skills." (backlog J, 27 Sep 2026)
>
> "I am envisioning a player sailing for a long while, and having to stop to cut wood to repair their ship, maybe to collect materials to make arrows / collect herbs and food." (Michael's B on survival skills, 30 Sep 2026)

## Today
You buy a sloop at a port's shipwright (`buyShip`, 400 gold) and sail her with W/S and A/D (`tickShip`) toward the class's top speed (sloop 7.5, cog 8.5, galleon 9.5 u/s, +1.2 a sail tier, `shipTopSpeed`); shallows stop her dead with *Aground*, at any speed, for nothing. She cannot be hurt: she bobs and rolls a fixed few hundredths on a timer whatever the sea (`shipUpdatePlacement`), the water's swell is ±0.36 everywhere, calm or storm (`waterShader`), and hulls that touch only push apart (`tickHullCollisions`). Pirates close, loose volleys at *you* (6 + level × 0.8 a hit) and send two boarders (`tickOtherShips`, `volley`, `tickBoarding`). The shipwright sells refits (`upgradeTopics`: cog 900, galleon 2,200, sail and hold tiers). The wind (`windDir`) trims the sails, look only (your 1 on #57). One real second is a game minute; a weather lasts 150–330 s, storms 2–14% of the time. So the sea has no state and the ship no condition: a voyage costs only time.

## Shared ground
**The sea's state**, 0 to 3, read where the ship is: calm (0), moderate (1), rough (2), storm (3). It is the weather (clear and fog 0, overcast and rain 1, storm 3) plus one in **open water** (bed below −8, 150 units from shore), capped at 3. The shader's wave function moves to one place the shader and the ship both read, scaled by state ×0.6, ×1, ×2.2, ×4 (a storm swell of about 1.4). The ship samples it at bow, stern and beams and takes pitch and roll from the differences (rough about 6°, storm 12°), smoothed over half a second; on the hull's local offsets, never world coordinates in float32. The water's look at each state is H.5b's.

**Two bars on the ship**, kept in `worldState.ship` (already on the save): **hull** (sloop 100, cog 140, galleon 200) and **rig** (100 on every class). Under 50 hull she ships water and loses 20% of her speed; under 25, 40%. Speed is also × (0.5 + 0.5 × rig/100), so a shredded rig halves her. A small parchment panel shows both while you are aboard.

## Directions

### A. Wear and mend — the hull takes the sea, Joinery puts it back
**The loop.** Fair-weather coasting costs nothing; open water wears her, storms hard, pirates and rocks bite. When she is low you heave to and patch at the cabin's bench from the planks and pitch you carry; when they run out you land on a wooded shore and fell a tree. In port the shipwright does it for coin, to full.

**Damage.**

| Source | Hull | Rig | Notes |
|---|---|---|---|
| Rough sea, under sail | 1 a minute | 1 a minute | none at moderate or calm |
| Storm, full sail (W held) | 1 every 6 s | 1 every 4 s | half under reduced sail (no key held, speed drifting down); none hove to |
| Grounding | (speed − 2) × 4 | — | 30 at a galleon's full 9.5; below 2 u/s you just stop, as now |
| Ram (hull on hull) | closing speed × 3 | — | bow-on, you take half and give double |
| Pirate volley | 2 a volley that reaches the deck | 3 | the volley still also aims at you |

A storm is 150–330 s, so a sloop held under full sail loses 25–55 of her 100; shortening sail is the decision it asks. Pirates gain a ram when faster and within 30 units, so the black sail is something to turn from, not only to board.

**Repairs at sea or ashore (Joinery).** At the cabin's bench a log makes 2 **planks** (weight 2), a pine or heartwood log a **spar** (weight 6); **pitch** is boiled from pine at any fire (3 a log, weight 0.5) or bought at 8 gold. A **patch** is a plank and a pitch: +8 + Joinery/5 hull (9 at 5, 13 at 25, 28 at 100) in 8 s of work, hove to. A **splice** is a spar and a pitch: +20 rig. Field work reaches 60% + 0.4% a Joinery point (62% at 5, 80% at 50, 100% at 100); past that, the yard. A patch is a Joinery use, a felled tree a Woodcutting one. Perks at the skills page's ranks: 25 *Under way* (patch at speed, at half the effect), 50 *Any timber* (a spar from any log), 75 *Second patch* (one in four patches costs no pitch), 100 *Sound* (field work to full).

A long voyage: a sloop at Joinery 25 held under full sail through a four-minute storm and fifteen minutes of rough water loses about 55; two patches bring her back to her field cap of 70. An evening along a far coast meets three or four storms, each three patches held or one shortened. Three held are nine planks and nine pitch, 22 weight, half a new character's carry; the hold tiers (+25, +50 aboard) make that a choice, not a wall. Two felled trees refill the kit: your *stop to cut wood*, a consequence of the numbers rather than a timer.

**The shipwright.** 4 gold a hull point, 3 a rig point, an hour a 20 points; a plank you bring takes 12 off. A sloop at 45 costs 220 gold and three hours. He sells planks (15), spars (60) and pitch (8), so a player who never lifts an axe still sails, at a price.

**Foundering.** At 0 hull she is waterlogged (speed capped at 2.5) and can limp to a shore; further damage sinks her, and the wreck lies where she went down, marked on the map. Any shipwright raises her again, class and tiers, for 30% of what they cost (a full galleon: 1,330 gold), at his quay three game days later. The stash is untouched (it is shared with the safehouse). A bill and a wait, not a game over.

**Touches.** `tickShip`, `shipUpdatePlacement`, `waterShader`, `tickHullCollisions` (rams), `tickOtherShips` and `volley` (the pirate's ram, the deck hit), `upgradeTopics` (repairs, timber), the cabin interior (a bench), `worldState.ship` (hull, rig, wreck; already saved), the HUD, `skillUse`.
**Conflicts.** None decided; the waves' look is H.5b's and the pitch and roll must not fight the third-person camera (`tpCamera`), which reads the deck.
**Cost.** Four Opus sessions: sea state, motion and the shared wave; the bars and the four damage sources; planks, pitch, the bench, the patch and the shipwright; foundering and the wreck., and one look session under H.5b.

### B. A, with the helm as a skill — Seamanship
**The loop.** A, and steering is a skill: Seamanship, a 22nd, under Finesse. A use is 100 units sailed at state 1 or more, a storm wave met bow-on, a ram that lands. Its perks: 25 *Reads the water* (shallows within 60 units tinted on the minimap), 50 *Reefed* (storm damage halved at full sail), 75 *Ram* (the bow-on bonus doubled again), 100 *Rides it* (+1 u/s at state 2 and 3).
**Conflicts.** Your skills list (the Morrowind book) closed at 21; a 22nd thins major and minor choice, and levels a sailor by hours at the wheel, as Morrowind's Athletics did.
**Cost.** A's four plus one Opus session: five.

### C. Voyages with a crew
**The loop.** B, plus hands: hired at the harbourmaster (sloop 2, cog 4, galleon 6), 5 gold a hand a day, who pump (a leaking hull loses no speed while they are aboard), fight boarders beside you, and patch at sea at your Joinery. They eat: the hold carries stores, a day a hand a unit, and a long crossing needs landfall for food as well as timber.
**Conflicts.** Upkeep by another name: you chose survival B over C's hunger, and stores are hunger for the crew. Six NPCs on a deck are skinned meshes in the shadow pass and people to sync when hosting, and crewing is the summoned friends' job in co-op.
**Cost.** One Fable session (crew, stores, wages, the AI aboard) and B's five: six, plus the look of the hands.

## Recommendation
**A.** It is your list taken item by item: waves that move her, damage from storms, rocks, rams and pirates, timber from Woodcutting and the work from Joinery, a shipwright for coin. The numbers make the voyage you described: an evening at sea wears her past the planks she carries, so a wooded shore becomes a place to look for, and sailing and the land skills feed each other. A storm asks a real decision (shorten sail and arrive late, or hold on and pay in planks), and losing her costs gold and days, never progress. Joinery's perks carry the curve, so the skills list stays as you decided it; B's perks can move into Joinery later, and C's crew is where friends will stand.

## What must be true first
- **The skills build** (Michael's A): `skillUse`, Joinery and Woodcutting, their perks at 25/50/75/100.
- **The survival build** (Michael's B): felled trees, fires, and Joinery's bench; the plank and spar are two more recipes beside its bows and arrows.
- **H.5b**: the look of the water by sea state, built on the shared wave.
- **Enemies by place**: the pirate's volley still scales with your level (`6 + level × 0.8`); it should move to the sea's region with the rest.

## Not asked
The wind setting your speed: your 1 on #57 kept it look-only. Cannon and broadsides (pirates fight with bows and boarders; a gun deck is another age). Crew (C). Cargo trading by port, already its own backlog line under B. The far continents themselves: this page makes the crossing cost something, not what is at the end of it. Sinking another ship (pirates are boarded and their chests taken, as now). Navigation by sextant or chart.
