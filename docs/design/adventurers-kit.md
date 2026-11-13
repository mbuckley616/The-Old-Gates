# The adventurer's kit

*The systems designer, 13 Nov 2026. A proposal: nothing here is a spec until `docs/decisions.md` carries a `Michael:` line under it.*

## The problem in Michael's words

Backlog L8, from his review of the concept art (OG-098): "**The adventurer's kit**: a use for each thing carried: a pack (capacity), a bedroll and a tent (rest anywhere, and safely outdoors), a weather cloak, boots for rough ground, a waterskin, a mess kit (cooking for buffs); rope and a grappling hook (reach, with the platforming page), a shovel (dig sites and buried loot), a pickaxe (ore and barriers), a climbing axe (cold cliffs); a sextant and a spyglass at sea; a skinning knife, a sickle, a rod and a net; a cipher disk, and a Gate Shard that wakes old mechanisms. A variant of the kit for each island."

## Today

Most of the sheet is already built, one system at a time: the tinderbox, mess kit, shovel and skinning knife in `SURV_ITEMS` (`js/50-travel.js`), the pick (`PICK_ITEM`, 4 kg), hatchet (3 kg) and joiner's kit (4 kg) beside them, the bedrolls and tent (`ROLL_DEF`, `TENT_ITEM`, `js/60-shop.js`), the four `WATER_VESSELS`, and the six cloaks of the `back` slot. Each is a bag item with a `tool` key that `hasPick`, `hasShovel` and their kind ask for. `maxCarry()` is 50 kg plus 5 a point of Might (plus the ship's cargo beside her, Feather's 40, a few buffs); `encumbranceState` slows you from 100%, and the roll turns heavy at 70% (`ROLL_HEAVY_AT`). Fish are taken by hand while swimming (`catchFish`, `takeTrout`, `js/86-world-crime.js`). A site is discovered within its pad and 30 m, a gate's door within 34 m, a place off the road within 40 m (`tickDiscovery`, #1292 A). Nothing is a pack, a spyglass, a rod or a net.

So the job is narrower than the list. A starting Might of 2 or 3 carries 60 to 65 kg, and the whole working kit (pick, hatchet, joiner's kit, shovel, tent, wool roll, mess kit, knife, tinderbox, a full skin) weighs 22.8 kg before the first 3 kg log: a third of what you can carry, and it is the same third whether you go to fell timber or into a gate. And three of the sheet's verbs (see a sail, fish from a bank, fish from a deck) have nothing to answer them.

## Direction A: a pack, and a page for the kit

**The loop.** Before a trip you decide what goes in the pack. A gatherer packs the pick and shovel and comes back heavy; a fighter leaves it at the inn and rolls light.

**The rules.**

| Piece | Weight | Gold | What it does |
|---|---|---|---|
| Pack | 2 kg | 40 | The first 20 kg of tools and goods in the bag (anything not a weapon, armour, a ring or a cloak) do not count against your carry |
| Its load past 10 kg | | | the roll is the heavy roll, as at 70% today |

- **20 kg** carries the working kit and a few logs or ore, no more: a third of a starting carry, half Feather's.
- **Never armour or weapons.** A fighter gains nothing by it, so it is not a stat everyone must buy; Might stays the carry's ladder. The heavy roll past 10 kg is the price: a full pack is a gatherer's day, not a fight's. One pack counts.
- **By island, looks only** (as the swords' makes, #1425): the Gatelands' wicker creel, the Mark's frame of birch and hide, Aurenne's saddle-roll, the same numbers everywhere. A ladder of packs is the brief's *buy better*.
- **The kit page**: a *Kit* tab in the inventory, each thing you hold with one line of what it does (*the pick: ore from a vein, Mining*), the rest greyed with where they are sold.

**What it touches.** `bagWeight` in `js/14-items.js`, the roll's check in `js/10-player.js`, the inventory in `js/66-hub.js`, the shops' stock. No `worldState` key: the pack saves as a bag item. The bodies builder draws the three on the player's back.

**Cost.** One systems session, one bodies session.

## Direction B: A, plus the glass, the rod and the net (recommended)

**The loop.** A's pack, and three things to do. On a hilltop you raise the glass and read the valley: the gate on the far ridge, the town down the river, pencilled on your map before you walk there. At sea you read a sail at 600 m and choose to close or run. On a bank at dusk you cast and wait; on deck you net a school and the crew eats.

**The rules.**

| Piece | Weight | Gold | Sold | What it does |
|---|---|---|---|---|
| Spyglass | 1 kg | 60 | harbour goods shops | The view narrows ×5. A ship in its centre to 800 m shows a card: her waters, her trade (merchantman, black sail, a quest's), her hull and rig if hurt. A town, fort, lair or gate door to 1,000 m is *sighted*: pencilled on the map with its name, no fast travel |
| Rod | 1 kg | 15 | every goods shop | E within 4 m of water 0.6 m deep casts; a bite 15 to 45 game minutes later (as many real seconds); E within 1.0 s strikes. The water's own fish (`RIVER_FISH`, or the sea's) |
| Net | 3 kg | 30 | harbour goods shops | From your deck at 2 knots or less over a school: 8 s, 3 to 5 fish; the school gone until the next day |

- **The glass's range** is bound by the fog's 60 m (#679) and the dark: in fog or after dusk it sees no further than your eye, so the hilltop is a clear day's thing. The critic found a Mark pirate and merchantman in poor light differ by one colour (12 Nov); the card answers that in good light only.
- **Sighted, not discovered.** Fast travel still asks you to walk there once. Places off the road and by it are never sighted: #1292 A finds them within 40 m, and the glass does not change that. Precedent: Breath of the Wild's scope pins what it does not reveal; this keeps the map from filling itself.
- **The rod** is about one fish a real minute, against the swimmer's hand: quicker, but wet, cold in the Mark and blind. The 1.0 s strike is well over the co-op page's 150 ms floor.
- **The net** feeds a crew (`crewCook` already takes fish from the hold): a day's catch, not a trade route, and a school regrows by the day.
- **Seeded rolls**, per the co-op rules: a bite's minute and kind keyed `rod:<cell>:<day>:<cast>`, a haul by the school's `<cell>:<index>` and the day.

**What it touches.** A's, plus the camera in `js/10-player.js` (the narrow view, dropped on a blow or a step); `tickDiscovery` and `drawLocalMap` (`js/83-world-generator.js`) for the pencilled mark; the ship card from `85-world-sea.js`'s hulls and `86-world-crime.js`'s bars; a cast beside `catchFish`; `crewCook`. Two keys, both on the S242 list: `worldState.sighted` (the character's, like `wdisc`: into `SS_CHAR_WS`) and `worldState.netted` (the world's, school to day).

**Cost.** Three systems sessions (the pack and the page; the glass; the rod and the net), one bodies (the packs on the back, the glass raised, the rod's cast), one look (the three things as props). No quest-writer run.

## Direction C: B, plus wear and footing

**The loop.** B, and the kit wears and the ground pushes back. A pick is good for 300 strikes, a hatchet 60 trees, a rod 100 fish; the smith mends one for a quarter of its price. Ice takes 40% of your grip in the Mark and rain's mud slows you a fifth off the road; nailed boots and pattens answer each.

**What it costs.** Wear is upkeep: Morrowind's repair hammers and Valheim's durability are mostly remembered as chores. Footing reaches the movement code everything leans on (`10-player.js`, `90-main.js`), so it is deep work, and L11's *Moving through the world* is its proposal. Three more systems sessions and that deep-work session.

## Recommendation

**B.** The pack makes what you carry a choice without touching a fighter's numbers, and the glass, the rod and the net are the sheet's three verbs nothing in the game answers. Each is a trade (weight, gold, the dark and the fog), none raises a fight's numbers, and the glass gives you a reason to climb a hill. C's wear is a chore that serves none of the brief's three feelings, and its footing belongs to the movement proposal.

## What must be true first

Nothing blocks A or B: camp and rest, water, cooking and resources B built every tool the page leans on, and the ship card reads the black sails' dress (#1454 A), built. C's footing waits on a proposal for L11's *Moving through the world*.

## Not asked

- **Rope, a grappling hook, a climbing axe.** Platforming B chose no climbing and "no grappling hook or rope item"; L11 repeats it.
- **A cipher disk.** L10's *Spells as keys*: a sigil puzzle "costs what reading costs, never a free cipher".
- **A Gate Shard.** It belongs with the gates' mechanisms (L10, F5), weighed against the schools' keys; as a kit item it opens every gate.
- **A sextant.** The map always shows where you are; it answers a question the game never asks.
- **A sickle, and buried loot for the shovel.** A sickle that gives more of a herb is *buy more*. Buried loot wants dig sites and maps to them: a quest writer's thread.
- **The cloak, waterskin, bedroll, tent and mess kit** are built (#148, water, camp and rest, cooking B). Boots are in C, with the footing they need.
