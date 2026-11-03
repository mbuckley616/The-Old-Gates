# Naval combat: the fight between two hulls

*The systems designer, 3 Nov 2026. A proposal: nothing here is a spec until `docs/decisions.md` carries a `Michael:` line under it.*

## The problem in Michael's words

Backlog L, *Naval combat, more of it* (OG-017): "grapple and board, rams, weapon arcs, four damage states; shot types (chain, explosive, grape) only on gunned top-tier ships, ballista and fire pots for the rest; harbour defences (booms, chains, towers); fog and ice seas in the Mark; distress calls and merchant traffic." Beside it: his 7 A ("guns stay cannon on the top ships") and 4 C (crew without morale).

## Today

A black sail (`spawnOtherShip`, `85-world-sea.js`) is a sloop at 6.5 m/s with three Pirates. She hunts whoever `targetOf` names from 300 m. Within 70 m her living archers loose a volley every 2.2–3.2 s (`volley`), and one that lands on your deck costs 2 hull and 3 rig. Within 30 m, if she is faster, she rams (`PIRATE_RAM`). On first touch your hull takes the closing speed × 3, half if your bow is on her (`tickHullCollisions`). You end it by climbing her net (`boardOther`) and clearing her deck for the captain's chest. If you flee with her crew alive they take half your hold (`pirateFled`). Merchantmen are 4.5 m/s cogs whose chests you can empty with no consequence. **Neither kind of ship has a hull: nothing you do from your deck hurts her, and your rams hurt only you.** Your own ship has the bars (`SHIP_CLASSES`: sloop 100, cog 140, galleon 200, cutter 80, caravel 130; rig 100), the slowdowns (×0.8 under half, ×0.6 under a quarter) and sailing A's sea state 0–3. The galleon's gun ports are paint.

No Elder Scrolls game fights at sea (Daggerfall's ship is a fast-travel ticket), so the page keeps it small: two hulls, one deck, the bars the game has.

## Directions

### A. Board and be boarded

**The loop.** You turn into a black sail, throw hooks and fight her crew on her deck while the hulls ride lashed; she does the same to you. A ram into her side now hurts her.

**The rules.**
- **Every ship gets the bars** (a pirate sloop 100/100, a merchant cog 140/100). There are four damage states for every hull. *Intact* is 75% or more. *Light* is 50–75%: holed sails, no penalty. *Heavy* is 25–50%: ×0.8. *Sinking* is under 25%: ×0.6, and she loses 1 hull every 10 s until mended or gone.
- **Rams both ways.** A bow-on ram (the hull test's `bow`) deals her the closing speed × 4 and you × 1.5. At 6 m/s that takes a pirate sloop from intact to heavy in one blow and costs your sloop 9.
- **Hooks.** To throw them, aim at her rail within 10 m while you close under 3 m/s and press E. The throw takes 1.0 s, and 4 s later the two hulls are lashed at 0 m/s. Cutting a line is E at its cleat: 1.5 s for you, 6 s for her hand if he reaches it unhurt.
- **Repel boarders.** A pirate whose ram is spent hooks you. Her crew cross in 6 s unless both lines are cut first. Once over, they stand on your deck as `pirateBoardersHold` already handles. At rough sea a throw fails one time in two. At storm nobody grapples.

**Touches.** `OTHER`'s ships gain `hull` and `rig`. `shipWear` takes a ship. New named actions `throwHooks`, `cutLine` and `damageShip`, for the host. Other ships are never saved, so the save is unchanged. **Cost:** three systems sessions and one look session (hooks, lines, the states' holes and list).

### B. A, with weapons on their arcs *(recommended)*

**The loop.** As A, but the approach is a fight too. A ballista at bow or stern, or fire pots from the rail, wear her down as you close. On the galleon, the helm becomes the aim: you bring her abeam to fire. Each fight ends in a choice. Sinking her is quicker and safer, but her chest goes to the bottom as a wreck to dive. Boarding her wins the chest and the crates she took.

| Weapon | On | Arc, range | Effect | Cost |
|---|---|---|---|---|
| Ballista | any hull: a fitting of 5 hold (#979 B) | bow or stern, 60°, 90 m | a bolt every 6 s: 10 hull, or a heavy arrow at a hand on Bow's multiplier | 350 gold or the bench at Joinery 50; 20 bolts to 1 hold, 2 gold each |
| Fire bolt | the ballista | as above | 4 hull; her rig burns 2/s for 8 s unless a hand douses it | a bolt and a pitch |
| Fire pot | your hand | thrown, 20 m | rig 3/s for 6 s; 12 fire to a hand within 2 m | a clay pot and a pitch, Alchemy 25 |
| Broadside | the galleon only (7 A), six guns a side on her ports | ±25° abeam, 150 m | six guns in a 0.6 s ripple; 20 s to reload a side | with the hull |
| Round / chain / grape | | | 6 hull a ball / 6 rig a ball / 20 to every hand in the cone to 60 m | 1 / 2 / 2 gold, 20 to 1 hold |
| Shell | | | 8 hull and the fire bolt's burn | 15 gold, the Mark's yards only (saltpeter, canon) |

A pirate sloop's 100 hull takes ten bolts (a minute of fire) or three broadsides: faster with guns, never instant, and every round costs hold space. The ballista reads Bow, so a skill that grows by use carries the fight (feeling 2). The guns read no skill: they are the galleon's virtue. You fire from the helm, one key a side and one for the ballista, and a side is ready only when she bears, so the aim is in the steering.

- **Foes by tier.** At tiers 1–3, today's sloop. At 4–6, a black-sail cutter (12 m/s, 80 hull) with a bow ballista. At 7 and up, one sail in five is a black galleon with guns. Merchantmen carry nothing and flee at heavy.
- **Sinking.** A ship that reaches 0 hull founders over 8 s. Her chest becomes one of `spawnWreck`'s wrecks at her depth, keyed by her id, and her crates are lost.
- **Quest ships strike, never sink.** *The Black Sail* asks you to clear a deck. A quest's ship lies to at 25% for boarding.
- **A hit on a merchantman is piracy.** Her crew are witnesses to the crime system, her nation's bounty applies as for a witnessed theft, and she flees., a consequence where today there is none (feeling 1).
- **Co-op.** A shot's hit and damage roll on `seededRng('shot', <ship id>:<volley>)`. A foe's gun aims through `targetOf`. Every change goes through `damageShip`.

**Touches.** A's, plus `SHIP_FITS` (the ballista; the galleon's guns belong to her class), new shot keys in `worldState.ship.hold` (the world row, already on the S242 list), `fireBroadside`, `fireBallista`, `throwPot`, two arc marks and a reload on the helm's HUD (#198's place), and `spawnWreck`. The budget holds: shot and fire are pooled particles and a fight is two hulls in sight, far inside §5's 1,000 draw calls. **Cost:** six systems sessions (A's three; ballista and pots; broadside and shot; foes by tier with sinking) and two look sessions (the ballista and the gun deck's guns; shot, fire and foundering).

### C. B, and a sea that answers

**The loop.** B's fight in a sea with people on it: Crown patrols on the Gatelands' lanes chase black sails, one cutter a lane, met on one crossing in three. Merchant traffic runs between real ports by the cargo prices. A distress call comes on one crossing in four, and you have 90 s before her hull goes. A port that has built its harbour (`portProtected`) gets a boom and a tower, a ballista at 120 m. The Mark's open sea has fog banks (60 m, #679 C) and ice floes that cost the closing speed × 2 in hull.

**Conflicts.** Patrols that stop you need a banner that means something, which is #979 C, set aside. How hard they patrol is the war's Act II question. Fog and ice need F11's sea. **Cost:** B's eight sessions, plus four systems sessions, one quest-writer run (the distress calls' people) and one look session.

## Recommendation

**B.** A makes boarding a fight, but the closing is still empty, and a sea fight that is all deck is a land fight on planks. B arms the closing and gives the end a choice: sinking is safe and costs the prize, boarding is risky and pays. Every hull has the ballista and the pots, and the guns stay the galleon's (7 A). Each weapon costs hold space against cargo, which makes it a trade rather than *buy more/better*, and the ballista grows with Bow. C is where this should end up, but its patrols wait on the banner and the war. It should be a proposal of its own once both exist.

## What must be true first

- Making a ship yours, sessions 2–5 (`making-a-ship-yours-build.md`): the fittings' places and weight, so the ballista has a place to stand.
- F11's decks at true size and the galleon's gun deck under her painted ports.
- Survival B's pitch (built, Session 1486).

## Not asked

- **Morale, or a crew that fights or sails:** 4 C says no morale, and a fighting crew is #85's C, which Michael set aside.
- **Prizes:** sailing a captured ship to a yard to sell would open a second ship economy.
- **Fleet battles:** more than two hostile hulls in sight is a laptop budget nobody has measured.
- **Ballast shot at the rudder:** it is chain shot under another name.
- **Firearms in hand:** 7 A.
