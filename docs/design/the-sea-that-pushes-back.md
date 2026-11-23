# The sea that pushes back: races, reefs and the serpent

A proposal from the systems designer, 23 Nov 2026, for backlog L11's *At sea* (OG-135). Nothing here is a spec until
`docs/decisions.md` carries a `Michael:` line under it.

## The problem in Michael's words

Backlog L11, *At sea* (OG-135): "four controls drawn simply; ship fights by ballista with fire bolts, archers at the rail, the ram and a
caster's fire or wind, cannon only on top ships (7 A); boarding in three beats (grapple, fight on a moving deck, repel); **currents that push
you off course, reefs and shoals, a sea serpent**; a port's shipwright for hulls, sails and recruits (crew as upgrades, no morale). The wind
stays the look (#57)."

Most of that line has a page already. The fight and the three beats of boarding are Michael's B on #1064 (`naval-combat.md`), the
shipwright and the crew are #979 B (`making-a-ship-yours.md`), and the dial is `the-ship-in-hand.md`. What no page has touched is the sea
itself: the currents, the reefs and the serpent. This page is those three. It is the sea's half of *Ground that pushes back* (#1800 A),
which gave the land its footing.

## Today

The sea is flat and empty between its weather and the pirates. `seaState` (`86-world-crime.js`) gives 0 to 3 from the weather plus one for
open water (`openWater`: a bed under 7.9 m with no land within 150 m), and `tickSeaWear` costs hull and rig in a rough sea or a storm. The
only hazard underfoot is grounding. In the sailing tick (`85-world-sea.js`), a bow probe over a bed shallower than 1.4 m, or a sea stone
(`hullStoneAhead`), stops her dead, and over 2 m/s she loses (v − 2) × 4 hull. Since S1780 the navigator draws beds under 2 m on the
minimap (`SHOAL_D`), and the chart table draws them on the world map. Nothing moves the water. `isTideOut()` (`50-travel.js`) is a
boolean in 6-hour blocks, and only Inis Rua's ferry reads it. The canon gives that strait a reason: it "runs too rough for the boat at high
tide" (`lore_canon.md`, Inis Rua). The only thing alive in the water that is a danger is the Shark, and it hunts only swimmers. The gate eel
and the Gate Leviathan exist as plans in the creature kit (S854, L3 *The sea*: "a sea gate's antibodies") and are in no table.

A crossing of 3,000 m takes the sloop 6 min 40 s at 7.5 m/s. All of it is a straight line the player holds with W.

## Directions

### A. Charted water: tidal races and reefs

**The loop.** The sea has places on it. A strait runs with the tide, so the short way between two islands is fast one way and a fight the
other. A headland has a reef off it that you either know or find with your keel. You read the sea before a crossing: the hour, the chart
and the navigator. Then you choose the race at the turn of the tide, or the long way round.

**The rules.**

| Piece | Where | Rule | Why |
|---|---|---|---|
| Race | water under 700 m wide between two landmasses, found once per seed when the rivers are routed (`routeWorld`'s pass, kept in `WORLD.routed`) | sets along the channel at up to 2.5 m/s; floods for six hours and ebbs for six on `isTideOut`'s blocks, as a sine with slack water at each change, so the set is 0 at 00:00, 06:00, 12:00 and 18:00 and strongest at 03:00, 09:00, 15:00 and 21:00 | 2.5 is a third of the sloop's 7.5. Against it she makes 5 m/s, slow but never stopped. With it she makes 10 m/s, faster than a cutter. The slack is when the canon's ferry crosses. |
| The race's sea | inside a race at over 1.5 m/s | `seaState` +1, so a race on a clear day is rough water, and in rain it is a storm's wear | the canon's "too rough for the boat"; it uses wear that already exists |
| Swimming | a swimmer in a race | carried at the full set | a swimmer can swim the channel only at slack |
| Reef | one coastal chunk in six (keyed by chunk, `hash01`), 60 to 400 m off a headland: 3 to 7 rocks over 20 to 40 m, their heads 0.6 to 1.2 m under the surface | a hull stone (`hullStoneAt`) that only a hull meets. The grounding rule as it is, (v − 2) × 4 hull, and she is held fast: S astern at half speed for 3 s backs her off | a swimmer stands on one; the price is the one grounding already charges |
| Seeing one | | breakers on the reef at `seaState` 1 or more, its colour through calm water by day: seen at 120 m in clear or overcast weather, 40 m at night or in rain, not at all in fog (60 m sight already) | night and fog are the danger. The navigator's shoal map (`SHOAL_D`) draws every reef, since their heads are under 2 m. |
| Wrecks | a reef's chunk holds a wreck one time in three (`wreckSpot` reads the reef first) | the existing sea chest | a reef with a wreck on it is the tell a diver learns |

**What it touches.** The routing pass (one more output: the races as segments, the world's, per seed), `hullStoneAt` and the shoal
tiles, `seaState`, the sailing tick's drift (one vector added to `SHIP.x/z`), the swim tick, and the minimap's arrows for the set (with
the navigator aboard). Nothing is saved: the races and reefs come from the seed, and the set comes from the clock.

**Conflicts.** None with #57: the wind stays the look, and the water moves by the tide, not by the wind. Of the decided places, the Gate
Isles (#1791 A, by boat) and the Drowned Spires (#1737) sit where a race would run. That is good, but the look builder must check that a
race does not cut across their quays. **Cost:** three systems sessions (the races and the set; reefs and seeing them; the swimmer, the
minimap arrows and the suites).

### B. A, and the serpent *(recommended)*

**The loop.** As A, and open water is no longer empty. Once or twice in an evening's sailing the sea humps up 60 m off your quarter, and
something as long as a galleon rises. You have the length of its rise to choose what to do: run for water too shallow for it, turn to bring
the ballista to bear, or put her beam-on and take the blow. What decides it is the hull you chose at the yard and the fittings you gave up
hold for.

**What it is.** It is the gate eel grown: an Uisce gate's antibody loose at sea. The kit already plans it. Per §9a's antibodies it is
nothing anyone has words for, so the quays call it *the serpent*. It does not hunt the merchantmen. It rises for your ship, and it is
never said why (§10a: inferred, not told).

**The rules.**

| Number | Value | Why |
|---|---|---|
| Where | open water only (`openWater`, a bed over 5 m deep), never within 300 m of a port | it needs depth. In the sea's 8 to 10 m it can always reach shallows and the coast. |
| How often | rolled once a chunk you sail into, keyed `serpent:<cx,cz>:<game hour>` (a seeded stream, co-op rules): 1 in 250; ×2 at `seaState` 3; ×3 within 1,500 m of an Uisce gate on the coast (the Mouth, the Vault of the Tide); never twice within 20 game minutes | a 3,000 m crossing passes about 47 chunks, so it rises on about one crossing in six, and one in three in a storm or off a sea gate. That makes it an event, not a toll. |
| The rise | the water humps along a wake line for 2.5 s before each strike | a tell read from the helm, far over the 150 ms floor |
| The strike | 15 hull. A ship moving over 6 m/s across the line when it lands takes nothing | the dodge, at sea. Seven strikes sink the sloop's 100, and fewer if she is waterlogged (any hull lost then sinks her, S413). |
| The coil | if it reaches her beam while she makes under 3 m/s: held 6 s, 3 rig a second | sitting still is the mistake. The coil breaks on any hit of 30 or more to its head. |
| Its speed | 9 m/s for 60 s, then it dives for 90 s | the sloop (7.5) cannot outrun it, the galleon (9.5) barely can, and the cutter (12) does, which suits a thin skin that should run (`the-ship-in-hand.md`) |
| Shallows | it will not cross a bed shallower than 4 m | A's reefs and the coast become shelter. Running over a reef you know at slack water is the expert's escape. |
| Health | 400. A ballista bolt does 40, an arrow or a spell its own damage at its head while it is up; Tine ×1.5, Uisce ×0.5 | ten bolts (a minute of fire) to kill, like the naval page's pirate sloop. The resist table follows the schools. |
| Driven off | at half health it dives for good and leaves one Serpent Scale floating (an alchemy ingredient of four effects, survival B; 120 gold) | the common win, about 30 s of fire |
| Slain | three scales and its skull, a figurehead (#979 B's *figureheads you find*): with it at her bow the serpent rises at half the chance | the rare win, and a choice: the skull takes the figurehead slot from the others |

**What it touches.** A foe that is not on a deck: built with the bodies builder's swimmer kit (the Gate Leviathan's rig, shortened), and
ticked by `tickOtherShips`' neighbour in `85-world-sea.js`, targeting through `targetOf(e)`. It also touches `shipWear`, the ballista's aim
(`shipBallistaTick` lays on it as on a hull), the figurehead table (`shipHead`), a herb entry for the scale, the log line, and the
quayside talk (a quest-writer run for three lines). There is no save beyond the skull in the bag and the stats count.

**Conflicts.** The serpent is a second sea fight beside the black sails. It must not rise during one: no roll while a black sail is within
`PIRATE_REACH`. **Cost:** A's three sessions, plus three systems sessions (the rise and the strike, the coil and its health against the
ballista, driving it off and the skull), one bodies session (its body from the kit's swimmer) and one quest-writer run.

### C. B, and a sea that moves with the gates

**The loop.** B, tied to the gates' fate. Each Uisce gate torn (`corruptionTorn`, S1340) adds 1 in 250 to the serpent's roll across that
island's sea. A race off a torn gate becomes a whirlpool at the turn of the tide that draws a ship 1 m/s towards its eye for 2 minutes.
Sealing the gate calms both. The sea becomes one of the places where the player sees what their choices did (feeling 1).

**Conflicts.** It waits on the great gates being in the world (backlog A) and on F12's look. A whirlpool also needs F11's water to draw
it. **Cost:** B's, plus two systems sessions and a look session.

## Recommendation

**B.** A alone makes the sea a place, but by itself it is a tax: a slower crossing with nothing gained except knowing the hour. The
serpent gives what A teaches a use. You learn the races and the reefs because they are where you live through the thing in open water.
The serpent also turns the yard's choice of hull, made at `the-ship-in-hand.md`'s dial, into something felt at sea. It is a fight in
Elden Ring's shape (a tell, a dodge, a punish) at the helm, which the brief's third feeling has not reached yet, and it is not
*buy more/better*: the best answer is a route, not a weapon. C is where this should end once the great gates stand. It needs no new
system beyond a number in B's roll, so it can be a short page later.

## What must be true first

- Naval combat B's ballista (built, `shipBallistaTick`), so the serpent has a weapon against it.
- The bodies builder's swimmer rig from the Gate Leviathan's plan (L3 *The sea*). Until then the serpent rides the Shark's rig scaled up,
  which is enough to test the rules.
- *Making a ship yours* B's figurehead slot (built, `shipHead`).
- A look builder's check that no race crosses the Gate Isles' or the Drowned Spires' landings.

## Not asked

- **Wind as force.** #57 and L11 keep the wind as the look. A ship that drifts downwind would reopen that decision.
- **A rising and falling tide level.** The sea level stays 0. Lifting it would move every quay, beach and shoal map. The tide moves water
  sideways, not up.
- **Ice floes and the Mark's fog seas.** These are naval combat's C. Fog's 60 m sight already exists.
- **Whirlpools without the gates.** A whirlpool that means nothing is scenery, so it waits for C.
- **The singing ship.** It is *Sea Legends, I*, the quest writer's draft, still unapproved.
- **The four controls drawn and the boarding beats.** These are on `naval-combat.md` and its build.
