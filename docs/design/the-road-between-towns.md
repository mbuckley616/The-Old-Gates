# The road between towns

*The systems designer, 15 Nov 2026. A proposal: nothing here is a spec until `docs/decisions.md` carries a `Michael:` line under it.*

## The problem in Michael's words

Backlog L (OG-118, his note on the concept art): "**The road between towns**: what the earlier road sheets lack: pilgrimage paths to shrines and gates, fords and frozen crossings, seasonal passes, an outpost with a gate-keeper at a checkpoint, and travellers to meet (a merchant with a pack train, a pilgrim, a mounted messenger, a family on the road, a Church official). Road dangers: a collapsed bridge, swamps, snow and heat."

## Today

A road is a spline between two settlements (`HOME_ROAD_DEFS`, `ROAD_DEFS`, `registerRoad`, `roadInfo`); where one meets a river `buildBridges` lays a named stone arch, so every crossing is a bridge. The road's people are bought at a lord: a trade route's caravan (`tickCaravans`, ambushed by a live bandit camp within 500 m, `breakRoute`) and a coach line (`coaches`, 13 m/s, an inn halfway). Otherwise a road is where the encounter table turns to bandits (`spawnChunkEncounters`: 0.12 where the Crown patrols, 0.26 in Aurenne, 0.34 in the Mark). The world's events (`tickWorldSystemsDay`: sieges, sacks, plague, war) reach you as a line on the screen if you are near, and not at all if you are not. At a run (3.8 to 4.2 m/s, a game minute each real second) a 2 km road is about nine game hours.

## Direction A: the road's ground

**The loop.** The road becomes a route you choose by season and weather: the ford or the long way round, the Mark's frozen lake, the well on Aurenne's hot road.

| Piece | Rule | Why |
|---|---|---|
| Fords | A crossing under 10 m wide on a track, path or spur (never a named road) is a ford: bed at 0.5 m, waded at ×0.7. For 12 game hours after heavy rain or a storm it runs at 1.1 m, ×0.4 and a 0.8 m/s push downstream; the coach waits | under `SWIM_DEPTH`'s 1.40; the flood is weather you plan round |
| Frozen crossings | The Mark in winter: lakes and reaches under 15 m wide freeze, walked by the gates' ice rule (`freezePool`, #1083 A). In winter's last 7 days ice off a road breaks 1 in 20 per 10 m, into water that adds 2 to the cold grade for 60 s | a shortcut worth the risk only at the thaw; the cost is cold, not health |
| The passes | A Mark road above the winter snow line: off the track the snow slows you ×0.75; a blizzard there is +1 cold grade | the road stays open; nothing locks you out |
| Wells | Aurenne's roads: a well every 800 m, clean water (#1254 B) | about 3.5 minutes at a run, well inside *Watered*'s 2 game hours |

**Touches** `buildBridges`, the river carve (`RVG`), `seasonWx`, the movement multiplier in `90-main.js`, F3's water for river ice. No save key. **Cost**: three systems sessions, two look; the ice waits on F3's river water. **Displaces** some small bridges and their names.

## Direction B: the road's people (recommended)

**The loop.** You meet the world walking the other way: a family with a handcart from a town you let fall, a rider with news of a siege, a road-warden who pays for the camp breaking his road, a pilgrim who points you at a gate. Each asks something of you.

**The rules.** Each road's travellers for the day are read from its two ends and the day (`seededRng('road', key+':'+day)`): the hour of each departure (06:00 to 18:00, a rider at any hour), its end, its kind. A traveller's place is read from the clock and the pace, never the frame, so a friend meets the same family at the same bend.

| Traveller | How often | Pace | What they do |
|---|---|---|---|
| Merchant and pack train | weight 3; 6 when a trade route joins the ends | 1.1 m/s | Sells his home town's goods (6 to 10 rows) at its prices ×1.1. Near a live camp the road's ambush odds fall on him while you are within 150 m (`CARAVAN_WATCH`); save him and he sells at ×0.8 that day, +1 favour at his town. Robbing him is today's assault and theft, before the nearer town's court |
| Pilgrim | weight 2 (Gatelands 3), where a shrine or lesser gate lies within 1,500 m | 1.3 m/s | Leaves the road for it; talk and it is *sighted* on your map (`sightPlace`). One in six bound for a gate are mourners with a bier (the Clearing, canon §3.1), and say nothing of what happens there |
| Rider | weight 1; +2 while either end has a flag from the last 3 days | 5.5 m/s | Hail him within 6 m or stand in the road: he gives the newest event within two cells (siege, sack, plague, occupation, liberation, a route broken, a bridge down) to the journal and the map. The Crown's post, a reeve's rider, the Compact's courier |
| Official | weight 1 | 1.3 m/s | The Crown's road-warden (canon's Warden Edwin, the *Warden of Roads*), a reeve's man, the Compact's clerk and a guard. A witness on the road. Where a live camp breaks his road he marks it and pays 40 + 10 a tier when it is cleared |
| Family and handcart | 2 more a day from an end besieged, sacked, burned, plagued, occupied or abandoned in the last 20 days | 1.0 m/s | Walking to the other end. Give 15 gold: +1 favour at their town once it is whole, at most +2 a town |

- **How many.** 2 + (both ends' prosperity) ÷ 50 departures a day, 2 to 6, halved on a broken road, plus families. A walker spends about a game day on 2 km, so a busy road holds four to six, one every 350 to 500 m: someone every two or three minutes at a run. Built within 400 m of you, at most four drawn.
- **A bridge down,** the one ground rule B keeps, because it is a consequence with a choice: each bridge rolls 1 in 30 a game-week (`seededRng('bridge', id+':'+week)`) and stays down two weeks unless mended. The coach stops at the bank, a route over it earns half, riders carry the news. The nearer lord offers *Mend the bridge*: 250 gold plus 2 a metre, or 20 planks and Joinery 25; up in 2 days. Swim it meanwhile.
- **Why these numbers.** 15 gold is a meal and a night, felt by a new character; 40 + 10 a tier sits under a guild hunt, since the camp has its own loot; 1 in 30 a week keeps about one bridge an island down at a time.
- **Precedents.** Oblivion's travellers were dressing and Daggerfall had none; Kingdom Come's carts and refugees and Red Dead's riders show a road as the world's nerves.

**Touches** a tick beside `tickCaravans` (travellers keyed `road:<key>:<day>:<n>`), `makeDef` and the builder's genome (`hbGenome`), `HB_OFFICE`'s dress (Session 2242), the ambush, `sightPlace`, `addLog`, the lord's topics. Save: `worldState.bridges` (the world's: down and mended), `worldState.roadAlms` (the character's, beside `favor` in `SS_CHAR_WS`), the warden's writs with the guild tasks (the character's); all in the S242 list. **Cost**: five systems sessions (the tick and the merchant; pilgrims and mourners; the rider; officials and families; the bridge), one bodies (mules, handcart, bier), one look (the broken span), one quest-writer run for five voices by island. **Displaces** nothing; caravan, coach and encounter table stand.

## Direction C: B, A, and walking with them

Both, plus escorts (walk a traveller to their end for 10 to 30 gold, a companion who follows, waits, flees and can die) and a pilgrim's round of an island's shrines for a week's boon. A deep-work session for the game's first companion and about nine systems sessions; the round belongs to the shrines card (OG-113, the row placed by #464 B).

## Recommendation

B. The brief puts consequences first, and today the world's consequences happen out of sight. B puts them on the road as people you can see and answer, every cost in gold, favour or a fight, with no new crime or meter. It reuses what is built and is read from the day and the place, so a host's road holds the same travellers for a friend. A's ground is good, but it is look work and F3's water, and serves movement more than consequence; it can follow under F3 or F12.

## What must be true first

- Nothing for B: the caravan, law B's courts, `sightPlace` and the builder's bodies are in.
- Michael's B on #873 (scenarios) waits on his check. These travellers are the road's traffic, not that deck; if it lands, its pilgrims and couriers should be these.
- A's ice waits on F3's river water; its fords change `buildBridges`.

## Not asked

- **A checkpoint with a toll**: it collides with the smuggling question (#1570, pending), and a toll on foot is walked round. The official carries the law instead.
- **Mounts**: the rider is the only horse; riding is its own proposal.
- **Swamps and footing**: declined with the kit's C (#1504).
- **Passes that shut**: a season is 84 game days; locking a third of the Mark that long fails the brief's "don't chop the world".
