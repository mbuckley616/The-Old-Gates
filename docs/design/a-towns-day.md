# A town's day

*The systems designer, 24 Nov 2026. A proposal for backlog L12's* A town's day *(OG-143). Nothing here is a spec until `decisions.md` carries a `Michael:` line under it.*

## The problem in Michael's words

Backlog L12, from the third round of concept art (Michael's review, 12 Oct 2026):

> **A town's day** (`tickTownNPCs`, the shops' hours in `60-shop.js`; OG-143): workers fill the streets at dawn and the guard changes, shops open late morning, trade peaks in the afternoon, shops close and taverns fill from five, guards alone at night; three markets by island with prices by place and a black market; passing events (a caravan, a noble's visit, a raid near gate activity, rebuilding); growth and decline, which the prosperity model already runs (§12a). No companions to recruit.

And `v2-scope.md` §4 still lists the calendar's market days as owed under *Journal and calendar* (Michael's C, 4 Oct).

## Today

A town keeps one clock for everyone. `HRS` in `82-world-structures.js` sets it: every shop opens at 8 and shuts at 18, the evening runs from 18 to 21, and night lasts until 7. `scheduleFor(n,h)` gives each person a plan for the hour. A keeper is behind the counter from 8 to 18, at the inn in the evening and at home at night. A resident wanders the square by day and drinks at the inn in the evening. A villager goes in at 20. The guards walk the gate and the plaza by day and the lantern beat after 19, and the constable hands over to the night watch at 19 and 6:30, though nobody sees the handover. `npcInsideNow` and `shopClosedNow` answer whether a door is locked. A feast or festival (`feastNow`) keeps everyone in the square until night.

Prices are set by place in only two ways. `priceMul(site)` moves every counter from ×1.15 at prosperity 10 down to ×0.83 at 100, times the faction's rate. The harbour factor's cargo is priced by nation (`CARGO_HOME` 0.6, `CARGO_ABROAD` 1.4, `cargoAsk`). Goods stolen from a town (`stolenAt`) sell at any counter in it at the full price. They are only taken from you when a guard halts you. The one fence, at Aurenne's cove (S2257), buys smuggled cargo and nothing else. The road's people (#1587 B) already bring the passing traffic: pack trains, pilgrims, riders with news and families fleeing. Sieges, sacks, plague and rebuilding already run on the prosperity model.

The clock runs a game minute every real second, so a day lasts 24 real minutes and a week of seven days (Hearthday to Guestday, `CAL`) lasts 168. One evening's play of one to three hours covers about half a week to a week.

## Directions

### A. The street by the hour

**The loop.** A town changes shape across the 24 minutes. You see the shift work, and you learn when a door is open. A smith is at the anvil before the goods shop has its shutters down. In the evening the inn is the place to find people. At night only the watch is out.

**The rules.**

| Hour | Who is out | What is open |
|---|---|---|
| 6–7 | the night watch walks to the gate; the constable comes out; the two meet there for 2 game minutes (the handover, seen) | the inn |
| 7–9 | residents go from their doors to a work spot (the quay, the market house, a yard, the fields for villagers), then to the square | the forge and the shipwright from 7 |
| 9–13 | the square at 60% of its people | goods, apothecary, armourer and weapons from 9; the barber from 10 |
| 13–17 | the square full (100%) | every shop |
| 17 | shops close in turn: the apothecary at 17, the forge at 17, the armourer at 18, the goods shop at 19 | |
| 17–23 | the inn holds the residents and keepers (from 17, was 18); the square at 20% | the inn |
| 23–6 | the watch alone on its beat | nothing |

Opening at 9 rather than late morning is on purpose. An opening at 11 would take a third of the working day away, and with 24 real minutes to a day that is a long wait for the player. The staggered closes give a choice at dusk: the smith or the apothecary, not both.

**Out of hours.** If you knock at a keeper's house at night with their favour at 2 or more, they come down and sell at ×1.25. Below favour 2 the answer is *Come back at nine.* This turns favour into something you use and gives a reason to be liked in a town you trade in.

**What it touches.** `HRS` becomes a table by shop type. `scheduleFor` gets the work-spot case and the 6:30 handover at the gate. `npcInsideNow` and `shopClosedNow` read the new hours. `shopCost` reads the knock's ×1.25. The strongbox's keeper (#824 C) reads the same hours. Burglary's takings (#68 A) need no change. Any suite that assumes 8–18 is re-measured, not loosened. No save keys are needed: it is all read from the clock.

**Cost.** Two systems sessions.

### B. A, plus market day and prices by place (recommended)

**The loop.** Once a week every town, port and city in an island holds its market. The square fills with stalls, and what you carry is worth more in one place than another. You choose where to sell and on which day: you can cross the strait with Aurenne's oil to the Mark's market, or sell at home for less tonight.

**The rules.**

| Rule | Number | Why |
|---|---|---|
| Market day | one weekday an island (proposed: the Gatelands on Stoneday, the Mark on Beastday, Aurenne on Seaday; the quest writer may rename) | one market in each 168-minute week, about one an evening |
| Hours | 7 to 15 | 8 real minutes, enough to walk a square of 6 stalls twice |
| Stalls | 4 + prosperity ÷ 25, rounded down (4 at a poor town, 8 at 100) | the canon's rule that prosperity shows (§12a); a village keeps none |
| Market prices | buy ×0.9, sell +10% at every stall and counter in the town that day | a reason to come on the day; the same size as Speech 25's Haggle |
| What an island makes | each item kind is tagged with a home island (the swords by island #1425, armour families, the island's herbs and food, the cargo goods' `home`); at home it costs ×0.85, abroad ×1.2 | the cargo rule (0.6 / 1.4) at a quarter of its strength, so the counter never beats the factor's hold |
| A port's foreign stall | one stall sells a single crate's worth of the other islands' goods as items, at ×1.3 | the far islands are seen before they are visited |
| The road that day | each road into a market town carries one traveller more the day before (#1587 B's count) | the world comes to the market, through what is already built |

All of this is read from the calendar (`calDay`) and the town's prosperity. Nothing is saved except the item's home tag, which is data in `14-items.js`. A sacked or plagued town keeps no market, and its square says why. The market's goods restock each week, seeded by `<site>:market:<week>` under the co-op rules.

**What it touches.** A's pieces, plus: `marketOn(site)` beside `feastOn` and `festivalHere` in `60-shop.js`; `shopCost` and `counterSellPrice` read the day and the item's home; `feastNow` fills the square on market day from 7 to 15 at the feast's reach (`feastR`); the stall counter is a shop of its own (the road merchant's `roadMul` path, S2268). The journal's calendar marks each island's market day. Then the look work: on the new look the Gatelands' market house is there already (S1904), and the stalls for each island are one look session.

**What it conflicts with.** Festivals (#1628 B) have the square on their three days, and a festival on a market day wins. The cargo trade stays the larger earner on purpose.

**Cost.** A's two sessions, three more systems sessions (the day and the stalls; prices by home; the foreign stall and the road), and one look session. Six in all.

### C. B, plus the black market and passing events

**The black market.** A counter in a town recognises goods stolen from that town (`stolenAt` is that site). The keeper refuses them. At favour 0 or below, the keeper also tells the watch, which books 1 crime point. Every city and port gets a fence in the inn's back room from 21 to 3. The fence buys stolen goods at 60% of the counter price and sells picks and one fine item a week. Today a theft pays out at the door of the shop it came from, so this gives theft its cost and its carry. Two systems sessions and a quest-writer run for the fence's lines.

**Passing events.** One event every 8 weeks for each town, seeded by `<site>:event:<week>`:
- **A noble's visit.** For 2 days the guards are doubled and prices rise ×1.1. A petition at the keep raises the lord's favour by 1.
- **A raid from a gate.** This happens when a gate is failing within 600 m of the town. Its foes come at the town gate at night. If you hold them off, nothing is lost; if not, the town loses 5 prosperity.
- **Rebuilding after a sack.** The scaffold you can see, and work there for 20 gold a game-day.

Four systems sessions, one bodies session and one quest-writer run.

**Cost.** About twelve systems sessions with B's.

## Recommendation

B. It turns the calendar Michael chose into a week the player can see. It makes where and when you sell a real decision, and it puts the world's state on the square: a rich town's eight stalls, a poor town's four, a sacked town's empty paving. It does this from what is already built (the clock, the prosperity model, the cargo rule, the road's people) and needs no new save keys or meters. A on its own makes a town look alive but asks nothing of the player except waiting. C's two halves overlap pages already decided. The black market belongs with *Law in three registers* (#1540 B), whose crimes and the cove's fence have just landed. The raids and rebuilding belong to *The gates unsettling the world* (OG-145) and the sieges, sacks and plague the prosperity model already runs. Both are better asked once B shows how a town's square carries the news.

## What must be true first

Nothing blocks A. B's stalls on the new look need card F6's pieces for each island (the Gatelands' market house is there; the Mark's and Aurenne's stalls are not), and until then the stalls can stand on the old look's `stallGeo`. The item's home tag should follow *Swords by island* (#1425) so that there is one table of what each island makes, not two. The market day's names are the quest writer's.

## Not asked

- **Prices that move with what you sell at a counter.** The cargo board already has its push and heal (`cargoPress`). Doing the same at every counter would make selling loot into a chore.
- **Shops closing on a holy day.** Guestday is *le Jour Clos* in Aurenne, but a day of shut doors is a day of waiting in a 24-minute day. The quest writer can give it a line instead.
- **Companions, hirelings and recruits.** The backlog's note rules them out.
- **Growth and decline.** The prosperity model runs it (§12a).
