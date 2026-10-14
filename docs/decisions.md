# Decisions

Questions the agents need Michael to answer, and his answers. An agent that needs a design call writes the question under **Pending** (and opens a `DECISION:` issue for the phone ping); Michael answers here, in chat with Claude, who writes the line beginning `Michael:`; the agent acts on it and moves the entry under **Answered** with a note of what it did. Nothing here is a spec until it carries a `Michael:` line.

## Pending

## Answered
### The smugglers' lair: a sea cave with its own landing, or inland (look builder, Session 873) — DECISION #314
**F8's fourth place: a smugglers' lair (look builder, Session 873).** It is the last of the three places you chose on #305 (3 A). It is a prototype in `docs/prototypes/levelup/places.js` (`smugglersLair`) and `places.html?place=lair`, from OG-121's "smugglers' and bandits' lairs: plank platforms in a cave, storerooms, escape routes". It is built to the person as a sea cave on the Gatelands' coast:
- **The way in:** a passage of 10 m from the land comes out on a rock floor 1.2 m over the sea.
- **The cave:** 18 by 24 m and 8 m high, the sea filling it, open to the sea under an arch 7 m wide.
- **The platforms:** a plank deck on posts down the west side, and a jetty out into the middle with a rowing boat at its end.
- **The storeroom:** plank walls on the rock floor, stacked with crates, kegs and a bale.
- **The escape:** a ladder up the east wall to a ledge 4.6 m up and a tunnel away.

Its light follows your 2 A on #305. Held, five lanterns burn. Empty (`&empty`), it is dark but for the day at the arch and your torch. Who holds it is the systems builder's.

The walk from the land, down the deck and out along the jetty, has the deck under every quarter metre, at least 2.46 m of headroom and at least 0.65 m clear. No ray from inside gets out except by the passage, the arch or the tunnel.

**Where is a smugglers' lair?**
- **A. A sea cave with its own landing, as drawn** *(recommended)*: the boat comes in under the arch, and the goods go up the passage to the land. It is the one place the lair's plank platforms make sense, and the Gatelands' coast has the cliffs and caves for it (OG-099's sea cliffs and arches).
- **B. Inland, over an underground river:** the platforms hang over a river in a cave behind a mine or a ruin. It is drier and can be anywhere on the map, but the boat and the arch go.

Pictures:
- [from the passage's end to the sea arch](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-lair-lair.jpg)
- [from the jetty back to the storeroom and the passage](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-lair-jetty.jpg)
- [the storeroom's door](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-lair-store.jpg)
- [the ladder to the escape](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-lair-escape.jpg)

Michael: **A. A sea cave with its own landing, as drawn** — Same comment as the other cave decision - the size here is pretty underwhelming, as is the lack of detail in general. (14 Oct 2026, via the control room)

### The limestone cave: what lights a cave (look builder, Session 872) — DECISION #313
**F8's third place: a limestone cave with a lake under falls (look builder, Session 872).** It is the second of the next places you chose on #305 (3 A). It is a prototype in `docs/prototypes/levelup/places.js` (`gatelandsCave`) and `places.html?place=cave`, from OG-121's caverns ("stalactites, an underground lake under falls, strange flowers") and OG-099's cave of blue pools under falls. It is built to the person:
- **The passage:** 14 m of pale limestone, 3 by 3 m.
- **The chamber:** 22 by 26 m and 11 m high. A shore runs along its east side and across the near end, and the rest is a lake 3.4 m deep.
- **The falls:** a stream comes in through a swallow hole in the roof under a shaft open to the sky, and falls 11 m into the lake.
- **The shore:** stalactites hang from the roof, with stalagmites and flowstone on the shore, and pale flowers at the water's edge.

The walk from the mouth along the shore to the far shelf has a floor under every quarter metre, at least 2.79 m of headroom and at least 0.99 m clear. No ray from inside gets out except by the mouth or up the shaft.

**What lights a cave?** Your answer for the mine (#305, 2 A) was that a worked-out mine is dark but for your torch. As drawn, this cave has two lights of its own.
- **A. The day down the shaft, and the flowers glow, as drawn** *(recommended)*: the falls and their pool are lit from above, and the flowers glow pale blue along the shore. Where the cave is open to the sky, the day comes in, and the flowers are OG-121's "strange flowers", a small wrongness (OG-096). Away from both, it is your torch.
- **B. Your torch alone:** no shaft of day (the falls come out of a dark slot), and the flowers do not glow. It is darker and closer, and the same rule as the mine.

Pictures:
- [from the passage's end across the lake to the falls](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-cave-lake.jpg)
- [the east shore, the flowers and the stalagmites](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-cave-shore.jpg)
- [from the far shelf up the falls to the shaft](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-cave-falls.jpg)
- [up the passage from the mouth](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-cave-passage.jpg)

Michael: **A. The day down the shaft, and the flowers glow** — I don't think this cave is expansive enough. This feels pretty underwhelming to me. I hope this isn't the scale we're going for in all of our dungeon interiors, especially Old Gates. (14 Oct 2026, via the control room)

### Unblock Look sessions: the approved commit no longer merges (the producer, 2026-10-14)
Michael approved Look sessions 821–852 at 9bc8062, which then conflicted with main (the bodies branch's copies of the builder's pictures). A: merge b7067e4 instead (the builder had merged main in; it adds only prototype Sessions 857–860); B: wait for a fresh card.

Michael: **A. Merge b7067e4 instead (Look 821–860)**. (14 Oct 2026) The producer merged b7067e4 into auto/producer (clean, parsecheck passes) and merges the Producer PR once its CI is green, or red only on shard 6's lookpair.

### The Gatelands sloop in the new kit: square sail or the game's rig, the harp, tiller or wheel (look builder, Session 858) — DECISION #306
**F11 begun: the Gatelands sloop in the new kit (look builder, Session 858).** It is a prototype in `docs/prototypes/levelup/ships.js` and `ships.html`, from OG-004's Gatelands line ("clinker hulls, green sails with the harp, square rig"). It is built at the game's own sloop's size: 13 by 4.4 m, with the deck 1.0 m over the sea.
- **The hull:** clinker-built, ten strakes a side, each strake lapped 2.5 to 3.3 cm outside the one below. She is tarred below the water and oiled oak above, with a green sheer strake under a cream wale. Her stem and sternpost are raked, and her sheer rises to both ends.
- **The deck and rail:** a deck of fore-and-aft planks with a hatch, and a rail 1.0 m over the deck all round.
- **The rig and helm:** one mast with a square green sail bearing the harp, its foot 2.2 m over the deck. She is steered by a rudder and tiller.

**1. The rig: the board's square sail, or the game's sloop rig?**
- **A (recommended):** the square sail, as OG-004 draws the Gatelands. One rig names the island at a glance, as the Mark's cutter and Aurenne's lateens already do.
- **B:** the game's gaff mainsail and jib (`85-world-sea.js`), in green.

**2. The harp on the sail.** The catalogue notes that the harp "fills a gap": it is not in the canon.
- **A (recommended):** keep it, as the Gatelands' mark on sails.
- **B:** a plain green sail (`&noharp`).
- **C:** ask the quest writer for the Gatelands' own mark first.

**3. Tiller or wheel?**
- **A (recommended):** a tiller on the small hulls (the sloop and the cutter), and the wheel from the cog up. The helm's `nearWheel` reads either.
- **B:** the wheel on every hull, as today.

Pictures:
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/ships-quarter.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/ships-side.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/ships-deck.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/ships-lap.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/ships-quarter-noharp.jpg

### Places that are not gates: a Markish mine's measure, its light, and what comes next (look builder, Session 857) — DECISION #305
**F8 begun: a Markish silver mine as the first place that is not a gate (look builder, Session 857).** It is a prototype in `docs/prototypes/levelup/places.js` and `places.html`, built from OG-121 ("mines and quarries: timber galleries and walkways over a shaft, ore, a working site") and its Mark panel's "mountain mines". The canon's Mark sells "iron and silver from the ranges". It is built to the person, one unit a metre:
- **The adit:** a level 18 m into the hill, held by timber sets every 1.5 m. The way between the posts is 2.07 m and the cap is 2.3 m up, with a tramway of 0.6 m gauge.
- **The stope:** a worked-out chamber of 12 by 16 m, 24 m high, with a timber landing over it. On the landing are the tram's cart, a windlass with its kibble and a lamp let down into the dark, and a ladder to the sump 16 m below.
- **The gallery:** 1.4 m wide along the west wall, with a rail on its open side.
- **The working face:** a vein of silver-lead ore across a wet face, with broken ore, a pick and a basket.
- **The light:** the lamps alone.

**1. How wide are a mine's levels?**
- **A (recommended):** as built, 2.07 m clear. That is a real mine's size and a person's measure (v2-scope §2). The fights are on the landing and the gallery, and in the stope.
- **B:** 3 m clear, so that a fight in the level has room to swing. That is wider than any mine was, and the dungeon generator's corridors are already 2 to 4 m.

**2. What lights a mine?**
- **A (recommended):** a working mine, held or still worked, is lit by its miners' lamps, as shown. A worked-out or abandoned one (`o.worked` false) is dark but for your own torch.
- **B:** lamps in every mine, worked or not.

**3. The next places that are not gates.**
- **A (recommended):** in this order: the Gatelands' round cairn with its passage, a limestone cave with a lake under falls, then a smugglers' lair on plank platforms. Each would be built on this module's shared rock (one noise field per place, so pieces meet where they join).
- **B:** a different order, which Michael names.

Pictures:
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-mine.jpg (from the adit's last set: the landing, the gallery and the lit face)
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-adit.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-gallery.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-face.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-face-old.jpg

### Rooms in the new kit: inside the street's own shell, and the cottage's plan (look builder, Session 852) — DECISION #303
Card F9 (rooms) is begun in the prototype (Session 852, `docs/prototypes/levelup/rooms.js`, page `rooms.html`). Its first room is the Gatelands cottage, from OG-115's cutaways and lit as OG-141 draws it. It is built inside the very cottage shell the street builds (`gatelandsBuilding`, 9.6 by 5.4 m, walls of 0.6 m, thatch at 50°), so its walls are the walls you saw from the lane, at their thickness, with the same windows. The plan follows the shell's own off-centre stack: a hearth-lobby house. The door opens into a lobby screened by a jamb wall; the open hearth with its crane, pot and turf fire faces the kitchen; a dresser of delft, a box bed, a table and a súgán chair stand in the kitchen; and there is a room at each end. 3,700 triangles in 18 draws on the shell's 1,814 in 10.

Pictures:
- [the kitchen, noon](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-kitchen.jpg)
- [the kitchen, night](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-kitchen-night.jpg)
- [the table and the box bed](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-table.jpg)
- [the dresser](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-dresser.jpg)
- [from the lane at dusk, the room through the window](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-outside-night.jpg)

Two questions, one letter each.

1. Where are the rooms of 2.0?
- **A. Inside the street's own shell, as drawn** *(recommended)*: the house you see is the house you walk into, with no load at the door, and its windows show the room by night and the street by day. Each house's furnishing is built when you come near, from its key.
- **B. Separate rooms, as today** (`buildInteriorFor`): the room is built at its own coordinates when you go in, and need not match the outside. This is cheaper in draws on a busy street, but the windows stay black and the door is a load.

2. The Gatelands cottage's plan:
- **A. The hearth-lobby house, as drawn** *(recommended)*: the hearth on a cross wall beside the door, a jamb wall screening the lobby, a room at each end. It is the plan the cottage's off-centre stack already implies.
- **B. One open room:** the hearth in the gable and the box bed in an outshot. It is simpler and roomier, but the stack would move to the gable.


### The Makers' trials' props: the blade's stone and the ring's cairn (look builder, Session 837) — DECISION #298
The systems builder built four of the Makers' trials on placeholder props (Sessions 800 to 802) and asked for the props themselves. Session 837 builds the first two in the new kit (`docs/prototypes/levelup/props.js`; page `trials.html`). They follow `unique-artifacts.md`'s lines.
- **The Gate-Blade's stone** (An Chloch; "a blade in a standing stone outside a ruined gate, plainly visible"):
  - A rough standing stone, 2.6 to 3.2 m, with ogham notches up one edge and moss at its foot.
  - The blade is driven into the stone's face at chest height, slanting down. Its grip is at 1.47 m, in reach of a standing person, and a third of the blade is in the stone.
  - Behind it, the fallen jamb and broken lintel of the ruined gate.
  - 1,856 triangles in 8 draws.
- **The Noon Ring's cairn** (An Spéir; "on a peak's cairn, readable only at noon on a clear day"):
  - A cairn of rounded stones under a flat capstone. The ring lies in a pale hollow cut in the capstone at 1.77 m, within reach.
  - On the cairn's sunward side stands a thin upright slab pierced by a round hole. At noon the sun comes through it and lights the hollow round the ring; an hour either side, the spot falls 0.3 m away.
  - 4,280 triangles in 4 draws.

Pictures:
- [the blade's stone](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-blade.jpg)
- [the hilt close](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-blade-close.jpg)
- [the cairn](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-cairn.jpg)
- [noon on the hollow](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-cairn-close.jpg)
- [the morning, for contrast](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-cairn-close-morning.jpg)

Two questions, one letter each.

1. How does the blade sit in its stone?
- **A. Driven into the standing stone's face at chest height, as drawn** *(recommended)*: the stone stands up out of the land as the canon's "plainly visible" asks, and taking the blade is a pull out and down, at Might 30.
- **B. Driven down into the top of a low boulder, hilt at the waist:** the Arthurian picture. It is instantly read as a sword in a stone, but it is lower and less visible from a road.

2. How is the ring's noon shown?
- **A. The pierced slab, as drawn** *(recommended)*: at noon a spot of sun falls on the ring's hollow, so the place itself shows why noon matters. The trial's rule (noon, a clear sky, Swiftness 30) stays as the systems builder built it.
- **B. No slab:** the ring simply on the cairn's top. It is plainer, and the noon rule is told only by the hermit and the rumour.

3. (Added by Session 838.) The Waylamp, An Teallach's ("passed from inn to inn"). A hand lantern of 0.43 m to its carrying ring: a square iron frame with horn panes, a pierced cap, a brass plate on its door with the hearth's mark, and a candle inside. Lit, the horn glows; put out by a crime, it is dull. It hangs on an iron bracket by the inn's wall. 620 to 1,152 triangles. [lit, on its bracket](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-lamp.jpg) · [put out](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-lamp-unlit.jpg)
- **A. A horn lantern, as drawn** *(recommended)*: an innkeeper's lamp, plain enough to pass hand to hand, and its light is what you see change when a crime puts it out.
- **B. An older thing:** a bronze oil lamp of the Makers' time in a cage, so it reads as one of the six tools, not a lantern off any inn's wall.

4. (Added by Session 849.) The Drowned Bell's wreck, An Mhuir's ("a wreck on a rock that is above water only at low tide"). A flat skerry awash at the ebb, and on it a 10 m trader's hull heeled over onto its side: planked on the low side, bare ribs broken short on the high side, weed to the high-water line. The bell, bronze gone green, hangs on an iron strap from the last deck beam aft. At high water (2.4 m, the game's tide) only the broken mast stands out of the sea, 4.5 m of it; at low water a person standing in the hull reaches the bell at 1.5 m. Taken, the beam keeps a bright ring of wood where the strap was. About 12,000 triangles in 6 draws. [low water](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-wreck.jpg) · [high water](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-wreck-high.jpg) · [the bell, close](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-wreck-close.jpg) · [taken](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-wreck-close-taken.jpg)
- **A. A plain trader's hull, as drawn:** any island's small ship, built now.
- **B. The Compact's ship** *(recommended)*: the Compact says the bell was "entered on a ship's manifest, and lost with the ship", so the hull is Aurennais, carvel-built with a lateen yard fallen across it. It is built from L6's Aurenne hull once that line exists; until then A stands in.

5. (Added by Session 850.) The cloak's den, Na Beithígh's (the master "is lying on something grey that is not its own hide", the approved draft). The lair's last chamber, a domed cave of about 10 by 9 m and 4.3 m high, its mouth a tunnel. Against the back wall is a nest: a hollow scraped to the bare stone ("it lays its head down on the bare stone") with bracken heaped round its rim, and bones nearer the mouth. The grey cloak is spread in the hollow, its collar and clasp under where the master sleeps and its pale hem 0.55 m out in front of it, which is what you take hold of. The master is the bodies builder's and is drawn as a ghost of 2.6 by 1.4 m. About 12,000 triangles in 9 draws. [from the mouth](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-den.jpg) · [the hem](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-den-close.jpg) · [the nest without the ghost](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-den-empty.jpg)
- **A. A crack in the roof, as drawn** *(recommended)*: a shaft of daylight falls on the nest, so from the mouth the grey cloak is the one lit thing in the cave.
- **B. No crack:** the chamber is lit only by your torch. It is darker and closer, and you find the cloak only when you are near the master.

6. (Added by Session 851.) The Shuttle's room, An Fíodóir's (the Shuttle "lies on the floor before the sigil, as if put down a moment ago", the approved draft). The deepest room of a lesser gate, in `visual-foundation.md` §2's language at a lesser gate's size (OG-119, "one arched room of about ten metres"). It is a pointed barrel vault 10 m across and 9 m to the crown, 14 m long. The floor is dark slabs of 2.5 m. Engaged piers carry amber script up their faces. The unread sigil, a glowing ring of 2.4 m, is on the far wall with two columns of script beside it, and the door is an arched slit of 3.2 by 6 m. The Shuttle is a weaver's shuttle of pale wood, 0.32 m, with its pirn in the cavity and a thread end lying from its eye. It lies 1.2 m out from the wall under the sigil and is in sight from the door. 3,092 triangles in 7 draws. [from the door](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-shuttle.jpg) · [the Shuttle](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-shuttle-close.jpg) · [taken](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-shuttle-close-taken.jpg)
- **A. A room of the gate's own, as drawn** *(recommended)*: the trial's room is built as this one arched room at the end of the gate, whatever the generator lays before it, so the Shuttle always lies under a sigil in the same light.
- **B. No room of its own:** the Shuttle lies in whatever room the generator makes deepest (the trial's rule today, Session 797), with the sigil hung on that room's end wall. This is cheaper, but the room varies and may be a corridor's end.

The gates' own kit (card F5) is a deep-work card; this room is made to its numbers and would take F5's pieces once they exist.

Not in this question: solids for these props (their place in the game, after F2a).

### The Mages' academy's white towers: pointed caps, domes, or square? (look builder, Session 836) — DECISION #296
The last of Aurenne's buildings that the canon names is "the academy's white towers" (§1.3), the Mages' academy. Session 836 builds it in the new kit at true size (`aurenneAcademy` in `docs/prototypes/levelup/pieces.js`; page `aurenne.html?view=academy`):
- **The library:** a long hall of two storeys, 24 to 36 m. An arcade of round arches on columns runs along its front, with a band of glazed tile over it, tall arched windows above and a rounded parapet.
- **The towers:** two or three slender white round towers rise out of its back, 33 to 40 m. Each has arched slits up the shaft, a gallery on stone corbels behind a pierced parapet, a lantern of six arched openings, and a pointed white cap with a gilt finial.
- **The observatory:** the tallest tower carries a white dome with its shutter slot.

An academy is 14,000 to 19,700 triangles in at most 8 draws.

Picture: [the academy from its forecourt](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/aurenne-academy.jpg)

What should the academy's towers be?
- **A. Round, with galleries and pointed white caps, as drawn** *(recommended)*: they read as the "white towers" from far off, and as different from the Church's square bell towers. The academy and the Church are rivals in the canon, and the skyline shows it.
- **B. As A, but domed caps** in the Church's finish (whatever #294 decides): the city reads as one style, at the cost of the academy looking like a second church.
- **C. Square towers like the Church's bell towers,** taller and white: the plainest, and the least like OG-061's minaret-like towers.

Only A is pictured; B and C are each a small change to the same builder, and I will shoot them if wanted. Recommendation: **A.**

Not in this question: inside (card F9); the academy's courtyard and its quarter (a later session, with the city plan).

### Aurenne's tithe house: stepped merlons or a plain parapet? (look builder, Session 833) — DECISION #295
Card F6 has reached Aurenne's civic buildings. The canon (§1.3) puts Aurenne's ports under the Compact's Factors, says "every hull that passes is tithed", and gives the island "warehouses on every quay". OG-061 and OG-043 draw these buildings arcaded, tiled and flat-roofed. Session 833 builds two in the new kit at true size (`aurenneCivic` in `docs/prototypes/levelup/pieces.js`; page `aurenne.html?view=quay`):
- **The tithe house** (18 to 26 m by 12 to 15, 9.8 m to the roof):
  - The ground floor has a loggia of pointed arches on columns, with the counting room's doors behind it and the middle arch as the carriage way.
  - Above a band of glazed tile is the Factor's floor: tall arched windows, three of them with cedar lattice balconies.
  - The roof has a parapet of stepped merlons and a lookout to watch the hulls come in, flying the Compact's striped banner.
  - 11,400 to 14,600 triangles in 10 draws.
- **The warehouse** (18 to 30 m by 10 to 12):
  - Plain lime walls with a row of tall arched cedar doors, 3 by 4.3 m, wide enough for a cart.
  - Small high windows, and a loading door with a hoist beam over the middle door.
  - A low pantile roof, and crates and amphorae on the quay.
  - 4,000 to 6,100 triangles in 9 or 10 draws.

Pictures:
- [the quay: the tithe house between two warehouses, from the water](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/aurenne-quay.jpg)
- [front-on, with merlons](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/aurenne-civic.jpg)
- [front-on, the plain parapet](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/aurenne-civic-plain.jpg)

How should the Compact's tithe house be crowned?
- **A. Stepped merlons** *(recommended)*: a parapet of small stepped battlements, as on the Moorish customs houses and souk gates. On a skyline of flat roofs and domes, it marks the building as the Compact's, the power that takes the tithe, at a glance.
- **B. A plain rounded parapet**, as the houses have: the tithe house then reads as a large merchant's house, set apart only by its loggia, balconies and lookout.

Either way the warehouse stays as drawn. Recommendation: **A.** The tithe house is where the player meets the Compact's law in every port, so it should look like an office of a power and not like a rich house. Precedent: the Aduana and the Lonja in Spanish ports, and the customs houses of Tunis and Alexandria.

Not in this question: the inside (card F9), the academy's white towers (next), and the harbour itself (quays, cranes and ships are card F11).

### Aurenne's churches in the new kit: blue domes, white, or by rank? (look builder, Session 832) — DECISION #294
Card F6 (buildings as pieces) has reached Aurenne's temples. The canon gives Aurenne "domes on the churches" under the Church of the Weaver (§1.3), and the concept art (OG-061, OG-043) draws them as a domed hall behind an arcade with a slender tower beside it. Session 832 builds one in the new kit, at true size (`aurenneChurch` in `docs/prototypes/levelup/pieces.js`; page `aurenne.html?view=church`):
- **The hall:** a cube of lime-washed stone, 12 to 22 m a side, on a podium with three steps. It has tall arched windows with iron grilles and a band of blue-and-white glazed tile under the cornice.
- **The dome:** a drum with twelve arched lights carries the great dome. On its top is the Weaver's sign, a gilt shuttle on a rod, leaning so that it does not read as a cross.
- **The porch:** an arcade of five or seven round arches on columns runs across the front, with the great door, 2.6 by 5.2 m, behind it.
- **The bell tower:** square, with an open belfry, a bell and a small dome. A town's church has one; the cathedral has two, and four small domes at the corners of its cube.

The great dome stands 17 to 30 m and the towers 22 to 35 m. A church is 9,800 to 15,800 triangles in 10 or 11 draws.

Pictures:
- [the square, a town's church at its head](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/aurenne-church.jpg)
- [three side by side: a town's church in blue, the same limewashed, a cathedral](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/aurenne-churches.jpg)
- [the dome and the shuttle close](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/aurenne-church-dome.jpg)

What should the churches' domes be?
- **A. Blue glaze on every church** (OG-061): every church, from a village's to the cathedral, under the blue tile. Wherever you are in Aurenne, the Church's domes read at once.
- **B. Limewash on every church:** white domes like the walls, with colour only in the tile bands and the gilt. This is the calmer, Greek-island look, and the houses' blue domes would then outshine the Church's.
- **C. By rank** *(recommended)*: blue glaze on the cathedral and on a town's church, limewash on a village's. Blue tile is the costly finish and the Compact is rich, so the blue marks where the Church's money and its Priors sit, and a village chapel stays plain.

Recommendation: **C.** The rank is visible from a distance without a sign, which helps a player find the Prior. A is a fair second if he wants the blue everywhere.

Not in this question: the inside (card F9), the Guest's bricked chapel under the cathedral (the quest writer's), and Aurenne's civic buildings, the Compact's counting house and the academy's white towers, which are the next sessions.
### The great gates: what the player does at one, sealing or tearing (the quest writer, 2026-10-14) — DECISION #292
You set the two paths (13 Oct, *The great gates' two paths* below): each great gate is torn open or sealed, any choice can be undone by going back, and the world is decided when all six match. Still open, as that entry says: **what the act itself is**, where in the gate it happens, and what undoing it asks. The draft *The Great Gates, I — the knot at the ring* (`docs/quest_drafts.md`, unapproved) writes A in full: every line of the act, both ways, the undo, the lock, and the people's talk as the gates are torn.
- **A. The knot** *(recommended)*. At the far end of each great gate, in the dark at the heart of the great ring, the script of the whole gate is drawn into one knot. The player cuts it with the tearing artifact or binds it with the sealing one. Torn, each of that school's spells you hold is one tier deeper; sealed, one tier shallower; undoing swaps it back. Once you have reached a gate's ring, its door takes you straight back to it, so undoing never means clearing the realm again. The state lives in the world's save.
- **B. The door.** The same act at the great gate's outer door, from outside, once the gate has been cleared once. Undoing is quicker, but the choice is made away from the place that gives it weight.
- **C. The heart carried.** Tearing cuts the knot's heart-stone free and you carry it, so the power is in the stone; sealing puts it back. The world's fate would then sit in the character's bag (against the co-op rule that shared state lives in the world's save), and a stone can be dropped, sold or lost.

Why A: the choice is made in the realm, in front of what it changes, and stays cheap to undo. It also squares the canon. The Compact's sealing *bricks a gate shut*, which §3.1 says would drown the world in its own dead; binding the knot keeps the gate working. The Church takes the credit anyway, and is wrong.

### F2b — how wide is a dungeon's grid cell at true scale? (the designer, 2026-10-14) — DECISION #300
Today a dungeon's corridor is one grid cell, one unit, which was about 1.6 m for the old 1.1 m person; at true scale the cell must grow. Its size sets every corridor's width, every room's size and how long a dungeon takes to walk (build sheet: `docs/design/scale-numbers-build.md`, the open number).
- **A. 2 m.** Corridors 2 m, rooms 6 to 24 m: a crypt's squeeze, the third-person camera tight in a corridor; a spike plate jumped at a run.
- **B. 2.5 m** *(recommended)*. Corridors 2.5 m, rooms 7.5 to 30 m, on the foundation's fighting pockets of 15 to 30 m; a claymore swings with 1.9 m clear; a plate needs a sprint; a massive dungeon is 135 m across, about 35 s at a jog.
- **C. 3 m.** Corridors 3 m, rooms 9 to 36 m, near Skyrim's ruins; roomy, but walks 20% longer and the same foes sparser.

Recommendation: **B.** The smallest cell where a two-hander and the camera both fit a corridor, and the rooms land on the foundation's own pocket sizes.

Michael: **C. 3 m: roomy, like Skyrim's ruins** — “If by dungeon we mean Old Gates, they should be extremely massive and cavernous. A normal ‘dungeon’ like a mine, or a cave can be a more typical size.” (14 Oct 2026)

### Rooms in the new kit: inside the street's own shell, and the cottage's plan (look builder, Session 852) — DECISION #303
Card F9 (rooms) is begun in the prototype (Session 852, `docs/prototypes/levelup/rooms.js`, page `rooms.html`). Its first room is the Gatelands cottage, from OG-115's cutaways and lit as OG-141 draws it. It is built inside the very cottage shell the street builds (`gatelandsBuilding`, 9.6 by 5.4 m, walls of 0.6 m, thatch at 50°), so its walls are the walls you saw from the lane, at their thickness, with the same windows. The plan follows the shell's own off-centre stack: a hearth-lobby house. The door opens into a lobby screened by a jamb wall; the open hearth with its crane, pot and turf fire faces the kitchen; a dresser of delft, a box bed, a table and a súgán chair stand in the kitchen; and there is a room at each end. 3,700 triangles in 18 draws on the shell's 1,814 in 10.

Pictures:
- [the kitchen, noon](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-kitchen.jpg)
- [the kitchen, night](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-kitchen-night.jpg)
- [the table and the box bed](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-table.jpg)
- [the dresser](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-dresser.jpg)
- [from the lane at dusk, the room through the window](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-outside-night.jpg)

Two questions, one letter each.

1. Where are the rooms of 2.0?
- **A. Inside the street's own shell, as drawn** *(recommended)*: the house you see is the house you walk into, with no load at the door, and its windows show the room by night and the street by day. Each house's furnishing is built when you come near, from its key.
- **B. Separate rooms, as today** (`buildInteriorFor`): the room is built at its own coordinates when you go in, and need not match the outside. This is cheaper in draws on a busy street, but the windows stay black and the door is a load.

2. The Gatelands cottage's plan:
- **A. The hearth-lobby house, as drawn** *(recommended)*: the hearth on a cross wall beside the door, a jamb wall screening the lobby, a room at each end. It is the plan the cottage's off-centre stack already implies.
- **B. One open room:** the hearth in the gable and the box bed in an outshot. It is simpler and roomier, but the stack would move to the gable.

Michael: **A. 1 A, 2 A: inside the shell; hearth-lobby plan**. (14 Oct 2026)

### Places that are not gates: a Markish mine's measure, its light, and what comes next (look builder, Session 857) — DECISION #305
**F8 begun: a Markish silver mine as the first place that is not a gate (look builder, Session 857).** It is a prototype in `docs/prototypes/levelup/places.js` and `places.html`, built from OG-121 ("mines and quarries: timber galleries and walkways over a shaft, ore, a working site") and its Mark panel's "mountain mines". The canon's Mark sells "iron and silver from the ranges". It is built to the person, one unit a metre:
- **The adit:** a level 18 m into the hill, held by timber sets every 1.5 m. The way between the posts is 2.07 m and the cap is 2.3 m up, with a tramway of 0.6 m gauge.
- **The stope:** a worked-out chamber of 12 by 16 m, 24 m high, with a timber landing over it. On the landing are the tram's cart, a windlass with its kibble and a lamp let down into the dark, and a ladder to the sump 16 m below.
- **The gallery:** 1.4 m wide along the west wall, with a rail on its open side.
- **The working face:** a vein of silver-lead ore across a wet face, with broken ore, a pick and a basket.
- **The light:** the lamps alone.

**1. How wide are a mine's levels?**
- **A (recommended):** as built, 2.07 m clear. That is a real mine's size and a person's measure (v2-scope §2). The fights are on the landing and the gallery, and in the stope.
- **B:** 3 m clear, so that a fight in the level has room to swing. That is wider than any mine was, and the dungeon generator's corridors are already 2 to 4 m.

**2. What lights a mine?**
- **A (recommended):** a working mine, held or still worked, is lit by its miners' lamps, as shown. A worked-out or abandoned one (`o.worked` false) is dark but for your own torch.
- **B:** lamps in every mine, worked or not.

**3. The next places that are not gates.**
- **A (recommended):** in this order: the Gatelands' round cairn with its passage, a limestone cave with a lake under falls, then a smugglers' lair on plank platforms. Each would be built on this module's shared rock (one noise field per place, so pieces meet where they join).
- **B:** a different order, which Michael names.

Pictures:
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-mine.jpg (from the adit's last set: the landing, the gallery and the lit face)
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-adit.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-gallery.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-face.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-face-old.jpg

Michael: **A. 1 A, 2 A, 3 A: as built; lamps if worked; cairn next**. (14 Oct 2026)

### The Gatelands sloop in the new kit: square sail or the game's rig, the harp, tiller or wheel (look builder, Session 858) — DECISION #306
**F11 begun: the Gatelands sloop in the new kit (look builder, Session 858).** It is a prototype in `docs/prototypes/levelup/ships.js` and `ships.html`, from OG-004's Gatelands line ("clinker hulls, green sails with the harp, square rig"). It is built at the game's own sloop's size: 13 by 4.4 m, with the deck 1.0 m over the sea.
- **The hull:** clinker-built, ten strakes a side, each strake lapped 2.5 to 3.3 cm outside the one below. She is tarred below the water and oiled oak above, with a green sheer strake under a cream wale. Her stem and sternpost are raked, and her sheer rises to both ends.
- **The deck and rail:** a deck of fore-and-aft planks with a hatch, and a rail 1.0 m over the deck all round.
- **The rig and helm:** one mast with a square green sail bearing the harp, its foot 2.2 m over the deck. She is steered by a rudder and tiller.

**1. The rig: the board's square sail, or the game's sloop rig?**
- **A (recommended):** the square sail, as OG-004 draws the Gatelands. One rig names the island at a glance, as the Mark's cutter and Aurenne's lateens already do.
- **B:** the game's gaff mainsail and jib (`85-world-sea.js`), in green.

**2. The harp on the sail.** The catalogue notes that the harp "fills a gap": it is not in the canon.
- **A (recommended):** keep it, as the Gatelands' mark on sails.
- **B:** a plain green sail (`&noharp`).
- **C:** ask the quest writer for the Gatelands' own mark first.

**3. Tiller or wheel?**
- **A (recommended):** a tiller on the small hulls (the sloop and the cutter), and the wheel from the cog up. The helm's `nearWheel` reads either.
- **B:** the wheel on every hull, as today.

Pictures:
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/ships-quarter.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/ships-side.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/ships-deck.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/ships-lap.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/ships-quarter-noharp.jpg

Michael: **A. 1 A, 2 A, 3 A: square sail, harp, tiller on small hulls**. (14 Oct 2026)

### Unblock Systems sessions 827–832: GitHub never ran its CI (the producer, 2026-10-14)
Systems 827–832 sat six hours at b1164be with no check run. A: the producer merges main into auto/systems to start CI; B: wait for the builder's next push.

Michael: **A. Producer brings main into the branch now**. (14 Oct 2026) Done the same run as be20097 (docs/backlog.md kept both edits).

### The great gates: what the player does at one, sealing or tearing (the quest writer, 2026-10-14) — DECISION #292
You set the two paths (13 Oct, *The great gates' two paths* below): each great gate is torn open or sealed, any choice can be undone by going back, and the world is decided when all six match. Still open, as that entry says: **what the act itself is**, where in the gate it happens, and what undoing it asks. The draft *The Great Gates, I — the knot at the ring* (`docs/quest_drafts.md`, unapproved) writes A in full: every line of the act, both ways, the undo, the lock, and the people's talk as the gates are torn.
- **A. The knot** *(recommended)*. At the far end of each great gate, in the dark at the heart of the great ring, the script of the whole gate is drawn into one knot. The player cuts it with the tearing artifact or binds it with the sealing one. Torn, each of that school's spells you hold is one tier deeper; sealed, one tier shallower; undoing swaps it back. Once you have reached a gate's ring, its door takes you straight back to it, so undoing never means clearing the realm again. The state lives in the world's save.
- **B. The door.** The same act at the great gate's outer door, from outside, once the gate has been cleared once. Undoing is quicker, but the choice is made away from the place that gives it weight.
- **C. The heart carried.** Tearing cuts the knot's heart-stone free and you carry it, so the power is in the stone; sealing puts it back. The world's fate would then sit in the character's bag (against the co-op rule that shared state lives in the world's save), and a stone can be dropped, sold or lost.

Why A: the choice is made in the realm, in front of what it changes, and stays cheap to undo. It also squares the canon. The Compact's sealing *bricks a gate shut*, which §3.1 says would drown the world in its own dead; binding the knot keeps the gate working. The Church takes the credit anyway, and is wrong.

Michael: **A. The knot at the ring**. (14 Oct 2026)

### Aurenne's churches in the new kit: blue domes, white, or by rank? (look builder, Session 832) — DECISION #294
Card F6 (buildings as pieces) has reached Aurenne's temples. The canon gives Aurenne "domes on the churches" under the Church of the Weaver (§1.3), and the concept art (OG-061, OG-043) draws them as a domed hall behind an arcade with a slender tower beside it. Session 832 builds one in the new kit, at true size (`aurenneChurch` in `docs/prototypes/levelup/pieces.js`; page `aurenne.html?view=church`):
- **The hall:** a cube of lime-washed stone, 12 to 22 m a side, on a podium with three steps. It has tall arched windows with iron grilles and a band of blue-and-white glazed tile under the cornice.
- **The dome:** a drum with twelve arched lights carries the great dome. On its top is the Weaver's sign, a gilt shuttle on a rod, leaning so that it does not read as a cross.
- **The porch:** an arcade of five or seven round arches on columns runs across the front, with the great door, 2.6 by 5.2 m, behind it.
- **The bell tower:** square, with an open belfry, a bell and a small dome. A town's church has one; the cathedral has two, and four small domes at the corners of its cube.

The great dome stands 17 to 30 m and the towers 22 to 35 m. A church is 9,800 to 15,800 triangles in 10 or 11 draws.

Pictures:
- [the square, a town's church at its head](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/aurenne-church.jpg)
- [three side by side: a town's church in blue, the same limewashed, a cathedral](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/aurenne-churches.jpg)
- [the dome and the shuttle close](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/aurenne-church-dome.jpg)

What should the churches' domes be?
- **A. Blue glaze on every church** (OG-061): every church, from a village's to the cathedral, under the blue tile. Wherever you are in Aurenne, the Church's domes read at once.
- **B. Limewash on every church:** white domes like the walls, with colour only in the tile bands and the gilt. This is the calmer, Greek-island look, and the houses' blue domes would then outshine the Church's.
- **C. By rank** *(recommended)*: blue glaze on the cathedral and on a town's church, limewash on a village's. Blue tile is the costly finish and the Compact is rich, so the blue marks where the Church's money and its Priors sit, and a village chapel stays plain.

Recommendation: **C.** The rank is visible from a distance without a sign, which helps a player find the Prior. A is a fair second if he wants the blue everywhere.

Not in this question: the inside (card F9), the Guest's bricked chapel under the cathedral (the quest writer's), and Aurenne's civic buildings, the Compact's counting house and the academy's white towers, which are the next sessions.

Michael: **C. By rank**. (14 Oct 2026)

### Aurenne's tithe house: stepped merlons or a plain parapet? (look builder, Session 833) — DECISION #295
Card F6 has reached Aurenne's civic buildings. The canon (§1.3) puts Aurenne's ports under the Compact's Factors, says "every hull that passes is tithed", and gives the island "warehouses on every quay". OG-061 and OG-043 draw these buildings arcaded, tiled and flat-roofed. Session 833 builds two in the new kit at true size (`aurenneCivic` in `docs/prototypes/levelup/pieces.js`; page `aurenne.html?view=quay`):
- **The tithe house** (18 to 26 m by 12 to 15, 9.8 m to the roof):
  - The ground floor has a loggia of pointed arches on columns, with the counting room's doors behind it and the middle arch as the carriage way.
  - Above a band of glazed tile is the Factor's floor: tall arched windows, three of them with cedar lattice balconies.
  - The roof has a parapet of stepped merlons and a lookout to watch the hulls come in, flying the Compact's striped banner.
  - 11,400 to 14,600 triangles in 10 draws.
- **The warehouse** (18 to 30 m by 10 to 12):
  - Plain lime walls with a row of tall arched cedar doors, 3 by 4.3 m, wide enough for a cart.
  - Small high windows, and a loading door with a hoist beam over the middle door.
  - A low pantile roof, and crates and amphorae on the quay.
  - 4,000 to 6,100 triangles in 9 or 10 draws.

Pictures:
- [the quay: the tithe house between two warehouses, from the water](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/aurenne-quay.jpg)
- [front-on, with merlons](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/aurenne-civic.jpg)
- [front-on, the plain parapet](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/aurenne-civic-plain.jpg)

How should the Compact's tithe house be crowned?
- **A. Stepped merlons** *(recommended)*: a parapet of small stepped battlements, as on the Moorish customs houses and souk gates. On a skyline of flat roofs and domes, it marks the building as the Compact's, the power that takes the tithe, at a glance.
- **B. A plain rounded parapet**, as the houses have: the tithe house then reads as a large merchant's house, set apart only by its loggia, balconies and lookout.

Either way the warehouse stays as drawn. Recommendation: **A.** The tithe house is where the player meets the Compact's law in every port, so it should look like an office of a power and not like a rich house. Precedent: the Aduana and the Lonja in Spanish ports, and the customs houses of Tunis and Alexandria.

Not in this question: the inside (card F9), the academy's white towers (next), and the harbour itself (quays, cranes and ships are card F11).

Michael: **A. Stepped merlons**. (14 Oct 2026)

### The Mages' academy's white towers: pointed caps, domes, or square? (look builder, Session 836) — DECISION #296
The last of Aurenne's buildings that the canon names is "the academy's white towers" (§1.3), the Mages' academy. Session 836 builds it in the new kit at true size (`aurenneAcademy` in `docs/prototypes/levelup/pieces.js`; page `aurenne.html?view=academy`):
- **The library:** a long hall of two storeys, 24 to 36 m. An arcade of round arches on columns runs along its front, with a band of glazed tile over it, tall arched windows above and a rounded parapet.
- **The towers:** two or three slender white round towers rise out of its back, 33 to 40 m. Each has arched slits up the shaft, a gallery on stone corbels behind a pierced parapet, a lantern of six arched openings, and a pointed white cap with a gilt finial.
- **The observatory:** the tallest tower carries a white dome with its shutter slot.

An academy is 14,000 to 19,700 triangles in at most 8 draws.

Picture: [the academy from its forecourt](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/aurenne-academy.jpg)

What should the academy's towers be?
- **A. Round, with galleries and pointed white caps, as drawn** *(recommended)*: they read as the "white towers" from far off, and as different from the Church's square bell towers. The academy and the Church are rivals in the canon, and the skyline shows it.
- **B. As A, but domed caps** in the Church's finish (whatever #294 decides): the city reads as one style, at the cost of the academy looking like a second church.
- **C. Square towers like the Church's bell towers,** taller and white: the plainest, and the least like OG-061's minaret-like towers.

Only A is pictured; B and C are each a small change to the same builder, and I will shoot them if wanted. Recommendation: **A.**

Not in this question: inside (card F9); the academy's courtyard and its quarter (a later session, with the city plan).

Michael: **A. Round, galleries, pointed white caps (as drawn)**. (14 Oct 2026)

### The Makers' trials' props: the blade's stone and the ring's cairn (look builder, Session 837) — DECISION #298
The systems builder built four of the Makers' trials on placeholder props (Sessions 800 to 802) and asked for the props themselves. Session 837 builds the first two in the new kit (`docs/prototypes/levelup/props.js`; page `trials.html`). They follow `unique-artifacts.md`'s lines.
- **The Gate-Blade's stone** (An Chloch; "a blade in a standing stone outside a ruined gate, plainly visible"):
  - A rough standing stone, 2.6 to 3.2 m, with ogham notches up one edge and moss at its foot.
  - The blade is driven into the stone's face at chest height, slanting down. Its grip is at 1.47 m, in reach of a standing person, and a third of the blade is in the stone.
  - Behind it, the fallen jamb and broken lintel of the ruined gate.
  - 1,856 triangles in 8 draws.
- **The Noon Ring's cairn** (An Spéir; "on a peak's cairn, readable only at noon on a clear day"):
  - A cairn of rounded stones under a flat capstone. The ring lies in a pale hollow cut in the capstone at 1.77 m, within reach.
  - On the cairn's sunward side stands a thin upright slab pierced by a round hole. At noon the sun comes through it and lights the hollow round the ring; an hour either side, the spot falls 0.3 m away.
  - 4,280 triangles in 4 draws.

Pictures:
- [the blade's stone](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-blade.jpg)
- [the hilt close](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-blade-close.jpg)
- [the cairn](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-cairn.jpg)
- [noon on the hollow](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-cairn-close.jpg)
- [the morning, for contrast](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-cairn-close-morning.jpg)

Two questions, one letter each.

1. How does the blade sit in its stone?
- **A. Driven into the standing stone's face at chest height, as drawn** *(recommended)*: the stone stands up out of the land as the canon's "plainly visible" asks, and taking the blade is a pull out and down, at Might 30.
- **B. Driven down into the top of a low boulder, hilt at the waist:** the Arthurian picture. It is instantly read as a sword in a stone, but it is lower and less visible from a road.

2. How is the ring's noon shown?
- **A. The pierced slab, as drawn** *(recommended)*: at noon a spot of sun falls on the ring's hollow, so the place itself shows why noon matters. The trial's rule (noon, a clear sky, Swiftness 30) stays as the systems builder built it.
- **B. No slab:** the ring simply on the cairn's top. It is plainer, and the noon rule is told only by the hermit and the rumour.

3. (Added by Session 838.) The Waylamp, An Teallach's ("passed from inn to inn"). A hand lantern of 0.43 m to its carrying ring: a square iron frame with horn panes, a pierced cap, a brass plate on its door with the hearth's mark, and a candle inside. Lit, the horn glows; put out by a crime, it is dull. It hangs on an iron bracket by the inn's wall. 620 to 1,152 triangles. [lit, on its bracket](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-lamp.jpg) · [put out](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-lamp-unlit.jpg)
- **A. A horn lantern, as drawn** *(recommended)*: an innkeeper's lamp, plain enough to pass hand to hand, and its light is what you see change when a crime puts it out.
- **B. An older thing:** a bronze oil lamp of the Makers' time in a cage, so it reads as one of the six tools, not a lantern off any inn's wall.

4. (Added by Session 849.) The Drowned Bell's wreck, An Mhuir's ("a wreck on a rock that is above water only at low tide"). A flat skerry awash at the ebb, and on it a 10 m trader's hull heeled over onto its side: planked on the low side, bare ribs broken short on the high side, weed to the high-water line. The bell, bronze gone green, hangs on an iron strap from the last deck beam aft. At high water (2.4 m, the game's tide) only the broken mast stands out of the sea, 4.5 m of it; at low water a person standing in the hull reaches the bell at 1.5 m. Taken, the beam keeps a bright ring of wood where the strap was. About 12,000 triangles in 6 draws. [low water](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-wreck.jpg) · [high water](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-wreck-high.jpg) · [the bell, close](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-wreck-close.jpg) · [taken](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-wreck-close-taken.jpg)
- **A. A plain trader's hull, as drawn:** any island's small ship, built now.
- **B. The Compact's ship** *(recommended)*: the Compact says the bell was "entered on a ship's manifest, and lost with the ship", so the hull is Aurennais, carvel-built with a lateen yard fallen across it. It is built from L6's Aurenne hull once that line exists; until then A stands in.

5. (Added by Session 850.) The cloak's den, Na Beithígh's (the master "is lying on something grey that is not its own hide", the approved draft). The lair's last chamber, a domed cave of about 10 by 9 m and 4.3 m high, its mouth a tunnel. Against the back wall is a nest: a hollow scraped to the bare stone ("it lays its head down on the bare stone") with bracken heaped round its rim, and bones nearer the mouth. The grey cloak is spread in the hollow, its collar and clasp under where the master sleeps and its pale hem 0.55 m out in front of it, which is what you take hold of. The master is the bodies builder's and is drawn as a ghost of 2.6 by 1.4 m. About 12,000 triangles in 9 draws. [from the mouth](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-den.jpg) · [the hem](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-den-close.jpg) · [the nest without the ghost](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-den-empty.jpg)
- **A. A crack in the roof, as drawn** *(recommended)*: a shaft of daylight falls on the nest, so from the mouth the grey cloak is the one lit thing in the cave.
- **B. No crack:** the chamber is lit only by your torch. It is darker and closer, and you find the cloak only when you are near the master.

6. (Added by Session 851.) The Shuttle's room, An Fíodóir's (the Shuttle "lies on the floor before the sigil, as if put down a moment ago", the approved draft). The deepest room of a lesser gate, in `visual-foundation.md` §2's language at a lesser gate's size (OG-119, "one arched room of about ten metres"). It is a pointed barrel vault 10 m across and 9 m to the crown, 14 m long. The floor is dark slabs of 2.5 m. Engaged piers carry amber script up their faces. The unread sigil, a glowing ring of 2.4 m, is on the far wall with two columns of script beside it, and the door is an arched slit of 3.2 by 6 m. The Shuttle is a weaver's shuttle of pale wood, 0.32 m, with its pirn in the cavity and a thread end lying from its eye. It lies 1.2 m out from the wall under the sigil and is in sight from the door. 3,092 triangles in 7 draws. [from the door](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-shuttle.jpg) · [the Shuttle](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-shuttle-close.jpg) · [taken](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/trials-shuttle-close-taken.jpg)
- **A. A room of the gate's own, as drawn** *(recommended)*: the trial's room is built as this one arched room at the end of the gate, whatever the generator lays before it, so the Shuttle always lies under a sigil in the same light.
- **B. No room of its own:** the Shuttle lies in whatever room the generator makes deepest (the trial's rule today, Session 797), with the sigil hung on that room's end wall. This is cheaper, but the room varies and may be a corridor's end.

The gates' own kit (card F5) is a deep-work card; this room is made to its numbers and would take F5's pieces once they exist.

Not in this question: solids for these props (their place in the game, after F2a).

Michael: **A. The recommended set (A, A, A, B, A, A)**. (14 Oct 2026)
### The Gatelands' round cairn: what is carved on its stones (look builder, Session 869) — DECISION #309
**F8's second place: the Gatelands' round cairn (look builder, Session 869).** It is the next place you chose on #305 (3 A). It is a prototype in `docs/prototypes/levelup/places.js` (`gatelandsCairn`) and `places.html?place=cairn`, from OG-121's Gatelands panel ("round cairns"). It is built to the person:
- **The mound:** a grassed mound of stones 26 m across and 7 m high, inside a kerb of 38 laid boulders. The door is in a dry-stone facade, and a long entrance stone lies before it.
- **The passage:** 10.3 m of upright slabs either side, 1.25 m clear, under lintels 2.16 to 2.28 m over a floor that rises 0.8 m to the chamber.
- **The chamber:** cruciform, with three recesses each holding an empty stone basin. It is roofed by a corbelled vault of eight courses, its capstone at 6 m.
- **The light:** none inside. As with the worked-out mine (#305, 2 A), it is seen by your torch and by what day comes in at the door.

The walk from the approach to the back recess has a floor under every quarter metre, at least 2.14 m of headroom and at least 0.63 m clear. No ray from inside gets out except by the door.

**What is carved on its stones?** The canon gives the dead to the gates (§3.1), so a cairn is an older or a refused custom. Who lay in the basins is the quest writer's to settle, and the basins stay empty until they do. The carving says whose the cairn was, so it is yours.
- **A. Spirals and lozenges, as drawn** *(recommended)*: the islanders' own oldest marks, cut before the gates' script was taught. The cairn reads as older than the Clearing, and as nothing to do with the Weavers.
- **B. The Weavers' script, cut and unlit:** the cairn is a Weaver work. That ties it to "every sigil is carved over a grave", and it raises a story question the quest writer would have to answer.
- **C. Bare stone** (`&plain`): the cairn says nothing about who built it.

Pictures:
- [from the approach](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-cairn-cairn.jpg)
- [the door and the entrance stone](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-cairn-door.jpg)
- [up the passage, by torch](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-cairn-passage.jpg)
- [the chamber, the back recess and its basin](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-cairn-chamber.jpg)
- [the corbelled vault](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/places-cairn-vault.jpg)

Michael: **A. Spirals and lozenges, as drawn** — Let’s be mindful of the size as well, passages look very narrow. (14 Oct 2026)

### The Mark's longhouse as a room: one hall round the fire, or rooms (look builder, Session 870) — DECISION #311
**F9's second room: the Mark's longhouse (look builder, Session 870).** Your A on #303 put the rooms of 2.0 inside the street's own shell, so this room is built inside the Mark's shingle hall from the kit (`pieces.js`'s `markHall`), 7.6 by 14 m. It is a prototype in `docs/prototypes/levelup/rooms.js` (`markLonghouse`) and `rooms.html?room=longhouse`. The brief is OG-115's Mark panel ("a longhouse round a central fire with fur rugs, family quarters, a workshop corner, a storage larder hung with meat") and OG-025's longhall. Nothing is whitewashed, as the catalogue's note asks.
- **The hall:** a planked floor on the stone footing. Two rows of posts carry tie beams 3.1 m over the floor. Rafters and a board lining run under the shingle.
- **The hearth:** a long hearth on the axis under the smoke louver, with a kerb of stones, a log fire and a cauldron on a tripod.
- **The benches:** raised benches 0.45 m high and 1.1 m deep down both walls, laid with furs, to sit on by day and sleep on by night.
- **By the door:** a workshop corner on the left (a bench, tools on pegs, a chopping block) and the larder on the right (a beam hung with hams, dried fish and herbs, barrels and a crock). The door stands open against the wall.
- **At the back:** a plank partition with a doorway into the family quarters: a bed of furs, a chest with a stone lamp, and a cradle.

The room is 5,620 triangles in 18 draws, on the hall's 1,568 in 7. No piece is outside the walls or through the roof, and no two pieces clash. The way from the door, past the hearth and through the partition, is clear by 0.15 m.

**The longhouse's plan:**
- **A. One hall round the fire, as drawn** *(recommended)*: the benches are seat and bed, and only the family quarters are walled off. It is the plan OG-115 and OG-025 draw. The inn (L9, "a Markish longhouse of long tables") would follow on this same hall, with tables in place of the benches.
- **B. Rooms, as the cottage has:** a hearth room in the middle, with a sleeping room and a store walled off at either end. It is more private and more like the Gatelands, but the long view down the fire is lost.

Pictures:
- [down the hall from the door](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-longhouse-hall.jpg)
- [the hearth and the benches](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-longhouse-hearth.jpg)
- [the larder by the door](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-longhouse-larder.jpg)
- [the family quarters](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-longhouse-back.jpg)
- [the hall at night](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-longhouse-hall-night.jpg)
- [from the yard](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/rooms-longhouse-outside.jpg)

Michael: **A. One hall round the fire, as drawn**. (14 Oct 2026)

### The Mark's cutter in the new kit: tanned or striped sails, and a beast's head on the stem (look builder, Session 871) — DECISION #312
**F11's second hull: the Mark's cutter (look builder, Session 871).** Your A on #306 gave each island one rig, and the Mark's is the game's cutter, from your A on #202. This prototype is in `docs/prototypes/levelup/ships.js` (`markCutter`) and `ships.html?ship=cutter`. It is built to the game's cutter's numbers:
- **The size:** 14 by 4.0 m, draft 1.45, with the deck 1.0 m over the sea.
- **The hull:** a plumb stem, a small transom and a cut-away forefoot. It is carvel-planked (flush), tarred black above a gilt line, red-brown below the water.
- **The rig:** one tall mast well forward with a gaff main, a topsail, a staysail and a jib on a 4.2 m bowsprit.
- **The helm:** a rudder on the transom with a tiller (your 3 A on #306).
- **The boom:** it sits 2.15 m over the deck, so a person walks under it. The game's is 1.35 m.

She is 21,594 triangles in 9 draws. No ray from inside her gets out below the deck. The walk down either side has 3.66 m of headroom, and the rail is 1.0 m over the deck.

OG-004 draws the Mark's ships with "dragon prows, oars, dark sails" and the raiding longship's sail in red and black. Two questions, one letter each.

**1. The sails:**
- **A. Tanned red-brown, as drawn** *(recommended)*: the "dark sails" of the board, the colour of a working northern sail.
- **B. Red and black cloths** (`&stripe`): the raider's sail on every Markish hull. This might be kept instead for the Mark's pirates.

**2. The stem:**
- **A. A gilt beast's head on the stem head, as drawn** *(recommended)*: the board's dragon prow on the game's plumb stem. It is the same beast that ends the Mark's hall gables (OG-034).
- **B. A plain stem** (`&nohead`), as the game's cutter has today.

Pictures:
- [from off her bow](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/ships-cutter-quarter.jpg)
- [broadside](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/ships-cutter-side.jpg)
- [her deck from the tiller](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/ships-cutter-deck.jpg)
- [the stem and its head](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/ships-cutter-lap.jpg)
- [the striped sails](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/ships-cutter-quarter-stripe.jpg)

Michael: **1 A, 2 A: tanned sails, gilt beast's head**. (14 Oct 2026)


### What ships in 2.0? The scope, the legacy zones, and the missing cards (Claude, Session 829, 2026-10-13)
Michael asked for the 2.0 scope in chat; it is `docs/design/v2-scope.md`. 2.0 is the day the new look becomes the default and r128 goes.
F1 to F7 plan the look, but nothing yet says which mechanics must be done before the cutover, and these have no card: the places that are not gates,
rooms, the player's own body and hands, ships and the sea, effects and the corruption level, old saves, and the cutover itself. F2 is also
bigger than its card: every reach, sight range and jump height is tuned in units against a 1.1 m person. Three questions:

**Q1. What ships in 2.0?**
- **A. The look only.** Mechanics keep landing on main as they are built, before or after the cutover.
- **B. The look and the core loop** *(recommended)*. 2.0 also waits on combat's resolver, skills and perks (A), enemies by place, and magic B with its
  questline: the systems that decide how every fight and level feels. Survival, platforming's places, sailing's playtest items, the calendar and the
  parchment panels keep landing on main as they are built.
- **C. The look and everything decided.** Everything in the page's §4 is built before the cutover. This makes for the longest wait.

**Q2. The legacy zones** (`40-legacy-zones.js`, `44-legacy-towns.js`, about 6,000 lines; the open world already plays Ashenmoor and Ironhaven):
- **A. Retire them at the cutover** *(recommended)*, after Q7's old-zone path moves into the world.
- **B. Rebuild them in the new kit.**

**Q3. The drafted cards:** accept F8 to F14, the split of F2 into F2a (scale) and F2b (the gameplay numbers), and the budgets (45 fps at the middle
level on Michael's laptop in Portclare's square, a first load under 40 MB, under 1,000 draw calls in the busiest town)?
- **A. Yes, as drafted** *(recommended)*.
- **B. Yes, with changes** (say which).

Michael: **1 B, 2 A, 3 A** — the look and the core loop; on the legacy zones, “A, and honestly, if it's easier to just purge the legacy code / zones when ready, I'm cool with that. I was never very attached to that, they were moreso just placeholders to help with scaffolding for a main story.” He accepted the drafted cards, the F2 split and the budgets. (13 Oct 2026, in chat with Claude)

*Acted, Session 829:* `v2-scope.md` now reads as the spec. 2.0 waits on the look (F1 to F14), combat's resolver, skills and perks (A), enemies by place, and magic B with its questline. The legacy zones are purged at the cutover, or sooner if that is easier, once Q7's old-zone path is in the world. For the producer: card F2a, F2b and F8 to F14 on the control room, and a roadmap epic for the core loop.
### The Mark's turf roofs, redone: dry sod or dark moss? (look builder, Session 825) — DECISION #285
On #277 Michael chose the mix (two halls in three shingle, one in three turf), but said the turf "green is too vibrant for the climate" and asked for another swing. Session 825 (prototype only, `pieces.js`) drops the lawn green and paints the sod two ways. Both versions now have a fringe of grass hanging over the eaves, so the roof's edge is ragged rather than a hard slab.

Measured on the texture, against Session 819's turf (mean saturation 0.48, greener than red by 0.09):
- **Dry:** saturation 0.30, redder than green by 0.06.
- **Moss:** saturation 0.26, green over red 0.02.

Pictures:
- [a lane, the mix, dry turf](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/mark-lane-mix.jpg)
- [a lane, the mix, moss turf](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/mark-lane-mix-moss.jpg)
- [a dry roof close](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/mark-roof-dry.jpg)
- [a moss roof close](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/mark-roof-moss.jpg)
- [the halls](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/mark-halls.jpg)

Which turf should the Mark's poorer halls have?
- **A. Dry sod** *(recommended)*: tawny dead grass and straw in tufts over olive, with moss in the hollows and earth between. This is how a sod roof looks most of a northern year. It reads warm against the dark shingle and the grey stone, and it will take the weather's snow cover well.
- **B. Dark moss:** a wet roof gone to dark olive moss, with straw tufts and pale lichen. It is the quieter of the two and close to the shingle in value, so a street of the mix reads more as one.
- **C. Both, by place:** dry on the inland halls and moss on the coast, chosen by the hall's lot.

Recommendation: **A.** It moves furthest from the lawn Michael objected to. The tawny roofs also make the one-in-three turf halls easy to pick out as the poorer houses. B is a fair second if he wants the street calmer.

Michael: **Dry sod**. (13 Oct 2026)
*Acted on:* dry sod is `markHall`'s default turf since Session 825 (`o.turf || 'dry'`), and every Mark picture on the branch shows it; the moss stays only as `?turf=moss` on `mark.html`. Next: the Mark's lot rules, two in three shingle by lot. Issue #285 closed. The lot rules built in Session 831 (`markLot` in `pieces.js`).

### The Gatelands' town walls in the new kit: coloured, white or stone? (the concept artist, 2026-10-13) — DECISION #280
Card F6 builds the three islands' houses from pieces in the new look; the Gatelands come first. The prototype (`docs/prototypes/levelup/pieces-gatelands.html` on auto/concept, three.js 0.170) makes five plans from one kit in metres: cottage 1,826 triangles, farmhouse 2,144, townhouse 5,081, merchant's house and shop 4,522, warehouse 9,132; 10 to 14 draw calls each. Walls are 0.45 to 0.7 m thick with every opening cut through. In every option the cottages stay limewashed white under thatch and the towns have slate roofs. Full text and pictures: docs/concepts.md on auto/concept, and issue #280.

What are the town walls?
- **A. Coloured towns** *(recommended)*: rendered in earth colours (ochre, rose, cream, sage, blue, oxblood) with dressed-stone quoins, string courses and cornices; the warehouse stays bare stone.
- **B. White towns:** every wall limewashed white, colour only on doors and shopfronts.
- **C. Stone towns:** bare grey stone with dressed quoins and lintels; only cottages and farms are white.

Recommendation: **A.** A town reads as a town at a glance and the colour carries through fog; B runs a terrace into one long wall; C is the darkest street under a grey sky, against the 12 Oct call for lighter than the concept art. Precedent: Kinsale, Dingle, Westport.

Michael: **Coloured towns**. (2026-10-13)
*Acted on:* Session 835 (look builder) built it as the Gatelands' lot rule, `gatelandsLot` in `docs/prototypes/levelup/pieces.js`: town lots take the six earth colours with no two neighbours alike, door paints chosen so they do not drown in the wall, cottages limewashed under thatch, farmhouses white, warehouses bare stone (`pieces-gatelands.html?view=street&mix=lot`).

### The Mark's houses in the new kit: shingle, turf, or the mix? (look builder, Session 819) — DECISION #277
The third island's house in the new kit (card F6, the pieces). Aurenne's is your B on #259 (Session 816) and the Gatelands house is the approved lane slice (Session 818). The Mark has no approved prototype yet.

OG-034 (kept) draws the Mark's towns as timber halls on stone footings, with steep snow-shedding roofs of dark shingle and carved gables. Its crossed bargeboards end in beast heads. OG-033 (not kept) and today's game also roof them in turf. The prototype builds one hall both ways: the gable end to the street, a porch on some, a stone chimney or a smoke louver, small shuttered windows. Each hall is about 800 to 1,700 triangles and 9 or 10 meshes. Code: `markHall` in `docs/prototypes/levelup/pieces.js`; page: `mark.html`.

Pictures:
- [the halls: shingle, shingle, turf (carved), turf](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/mark-halls.jpg)
- [a lane, all shingle](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/mark-lane-shingle.jpg)
- [a lane, all turf](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/mark-lane-turf.jpg)
- [a lane, the mix](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/mark-lane-mix.jpg)

Which roof should the Mark's houses have?
- **A. Shingle** (OG-034): every hall steep and dark-shingled, with the carved gables. It is the kept sheet's look and sheds snow, and it reads as the Mark at a distance.
- **B. Turf:** a lower pitch, a sod roof over a birch-bark edge, carving on the larger halls only. It is homelier and greener, and it is the rejected OG-033's look.
- **C. The mix** *(recommended)*: two in three shingle, one in three turf, by lot, as Aurenne's mix. The turf goes on the poorer and the outlying houses, and the halls of note keep the shingle and the carving. Today's game already mixes the two (`STYLE.mark`), and a street of one roof reads as a set.

Recommendation: **C**, with A as a fair second. The Mark's towns in OG-034 are the shingle halls, and the turf roofs give a poorer house a look of its own without a new kit.

Not in this question: snow on the roofs (the weather's `WX.cover` will lay it), the longhall interior (OG-025), and the Mark's stone garrisons and cliff walkways (backlog L).

Michael: **The mix: two in three shingle, one turf** (C) — I don't like the turf as it looks today though. I think I'd rather have a different material / have us take another swing at that. The green is too vibrant for the climate it's going to be in, IMO. (13 Oct 2026)
*Acted on:* the turf redone in Session 825, two ways (dry sod, dark moss), with a fringe at the eaves; which one is asked as DECISION #285. The mix itself (two in three shingle, by lot) is what `mark.html?view=lane&mix=mix` already builds; the lot rules for the Mark's towns wait on #285.

### The four peoples' heights and palettes (look builder, Session 806) — DECISION #276
B3's first slice: each people is a range over the one body, rolled by seed. Picture: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/builder-peoples.jpg (three each: Gatelanders, Markmen, Aurennais, the Old Blood).

The statures are in metres:
- Gatelanders: men 1.72 to 1.84 m, women 1.60 to 1.72 m.
- Markmen: men 1.84 to 1.98 m, women 1.72 to 1.84 m.
- Aurennais: men 1.74 to 1.86 m, women 1.62 to 1.74 m.
- The Old Blood: men 1.56 to 1.66 m, women 1.46 to 1.56 m.

Together they average 1.72 m. The colours follow canon §2 and the kept sheets; `PEOPLES` in `docs/prototypes/levelup/people.js` has every value.

Should the ranges and colours stand?
- **A (recommended):** keep these ranges and palettes, and go on to the faces per people, the Old Blood's marks and the Aurennais dress.
- **B:** keep the palettes but push the heights apart (Markmen near 2 m, Old Blood near 1.5 m) so the peoples read at a distance.
- **C:** pull the heights together (every people within 8 cm of 1.80 m) and let dress and colour carry the difference.

Michael: **Keep these ranges and palettes** (A). (13 Oct 2026)

### The wardrobe's first pieces: is a draped cloak and a shell hood the method? (look builder, Session 805) — DECISION #274
B2's first slice, from the kept sheets only (OG-048, OG-059, OG-025; the second round's clothing sheets OG-109 to OG-111 still wait for your marks). The pieces:
- **The cloak:** cloth hung from the shoulders of the posed body. Columns fall under gravity, clear of what the person wears, and are held together as one sheet with folds.
- **The rest:** a round brooch at the throat, a fur collar or the hood rolled behind the neck, a hood up as a shell over the head, and the apron, in wool or leather, with or without a bib.

Pictures:
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/builder-cloak-front.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/builder-cloak-back.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/builder-cloak-markman.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/builder-apron-leather.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/builder-cloak-hood.jpg (the hood up has a known fault at the crown)

The cloak is still stiff and boxy. Which way should the wardrobe go?
- **A (recommended):** keep building garments this way: drapes for what hangs (cloaks, capes, the long skirts), and shells off the body's fitting shells for what fits (hoods, aprons, tabards, gambesons). The next passes give the cloak deeper folds and a hem that comes in to the legs, then do capes, hoods and the Crown tabard.
- **B:** the same, but the cloak as a real cloth simulation run once at build time (a few hundred steps of a mass-spring sheet over the posed body). Better folds, about a second more per person to build, and more code.
- **C:** garments modelled by hand or from CC0 sources and fitted to the body by its skin weights. Best up close, but every garment is a modelling job.

Michael: **Keep this way: drapes hang, shells fit** (A) — As long as this doesn't have the arms phasing through the clothing, I'm okay with this. Take another look at the Hood though, it's semi-transparent. (13 Oct 2026)
*Acted on:* the hood, Session 823. It was the head's own points set out onto a ball, with the face's hole running back to the ears, so the sides of the head showed through it, the ear came out as a lump, and the nape was bare under it. It is now a cowl of its own, opaque, with a darker inside and a rolled hem round the face, falling to the shoulders, the hair tucked in under it; `builder.check.mjs` finds no point of the head or its hair through it in 24 people (four peoples, six styles). The arms through the clothing: still to be checked through the walk once the clip library (B4) moves them.

### The builder's hair: groomed strands and modelled braids? (look builder, Session 804) — DECISION #272
B1 rebuilt the people's hair. Session 770's cards were combed one way and fell free, and crossed at the temples. Now every strand walks over the head's own surface at its own small height, toward where its style sends it. Six styles are built: short, loose, one braid, two braids, a tail and a bun. Braids, tails and buns are modelled as locks on a line that falls under gravity and clears the clothes. It is all seeded by the genome, and the checks show no strand under the skin or on the face. Pictures:
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/builder-styles-back.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/builder-styles-front.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/builder-styles-mantle.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/builder-woman-braid.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/builder-man-face.jpg
- https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/levelup/builder-page.jpg

Is this the hair to carry into the cast (B3) and the game (B6)?
- **A (recommended):** yes, keep groomed strands and modelled locks, and refine them as the cast is built: a finer strand texture, more styles from OG-025 and OG-001 (crown braids, a plait over the shoulder, a shaved side), and lighter loose hair for crowds. It fits every body the genome makes, costs nothing to make a new style, and stays testable.
- **B:** keep the method for braids, tails and buns, but make short and loose hair as a few sculpted shells with a painted strand texture (the usual game hair cap). It is cheaper and smoother at a distance, and flatter up close.
- **C:** model a small set of hair meshes by hand or from CC0 sources, fitted to the head per style. It looks best in close-ups, but every new style is a modelling job and has to be refitted to the face sliders.

Michael: **Yes: groomed strands and modelled locks** (A) — Eyebrows look pretty fugly still, and some of the hairstyles aren't quite landing how I'd like. Let's keep refining here. (13 Oct 2026)
*Acted on:* the eyebrows, Session 824. They were a band of the skin's triangles under three noise shells, square-ended and as thick at the tail as at the head. A brow is now a drawn shape (a head, an arch two-thirds out, a tail that thins away), set from the eye's own centre, filled with 700 to 800 short hairs that lie on the skin, combed up at the head and out and down along the brow, over a skin a shade darker. The hairstyles are the next refinement.

### The Wolf-Mother's Cloak in the den — when does a sleeping master wake, and what is "weapon sheathed"? (systems builder, after Session 802, 2026-10-13) — DECISION #270
Five of the six Makers' tools can now be had where they lie (Sessions 797, 800–802). The last is the cloak's own trial: the approved draft (*The Makers' Things*, §6) has the master of a home-island lair (*Dunkeel's Lair* in this world) **asleep on the cloak**, and you take it from under the living beast at Resolve 30 (*It lifts its head and looks at you for a long time…*); a failure *costs nothing, wakes nothing*; the prompt shows *within reach of the master, weapon sheathed*. Two rules are not written anywhere. Today every cavern master is awake and fights on sight, and the game has no sheathed state (an empty hand is fists).

1. **When does the sleeping master wake?**
   - **A.** *(recommended)* Only when struck (a blow, an arrow or a spell). It sees and hears nothing while the cloak lies under it, so Resolve is the whole trial, as the page says (*Resolve 30, to walk in and leave without killing it*). The cavern's other beasts are awake as now, so getting there is still a fight or a sneak.
   - **B.** As the Gargoyle wakes: a walking step within 4 units wakes it, and you can come up to it only by sneaking. The trial becomes Resolve and stealth.
   - **C.** Asleep only by night (the game's 23h–5h, as householders sleep); by day it is awake and fights as now.
2. **"Weapon sheathed."**
   - **A.** *(recommended)* Read it as *not attacking*: the prompt shows whatever is in your hand, and only a swing or a drawn bow hides it. There is nothing new to learn.
   - **B.** Read it literally: the prompt shows only with nothing in the weapon hand (fists). You unequip the weapon to reach for the cloak.

Either way, once the cloak is taken the master goes on sleeping and lets you go, as the draft says. Struck later, it fights, and its death makes the cloak go thin (Session 781). The sleeping pose is the look builder's. Until the pose comes, the master lies still in its standing pose, as a dormant Gargoyle does.
Michael: **A — wakes only when struck; sheathed = not attacking.** (2026-10-13, on the control room)

### Shrines remembering: the third prayer makes a boon permanent; how many can you keep? (systems builder, after Session 793, 2026-10-13) — DECISION #267
The canon's consequence table (§12) says: `shrines[id].count`, the third prayer at one shrine, makes that shrine's boon permanent. It is not built. Today a prayer restores you and gives the shrine's boon until tomorrow (two days on its god's own day), once a day per shrine. Five gods give a boon: the Road (Swiftness ×1.25), Renewal (half a point of health, stamina and mana a second), the Arm (melee ×1.2), Stone (damage taken ×0.75) and the Mind (spell cost ×0.7). The Weaver gives a rubbing instead. A boon for good is a large, lasting buff, so how many can be held is a rule of play.

- **A. One kept boon** *(recommended)*: the third prayer, on three different days, at one shrine makes its boon yours for good. A third prayer completed at another shrine replaces it, and the log says which god you now carry. The choice of god matters, and the power stays bounded.
- **B. Every shrine remembers**: each shrine prayed at three times gives its boon for good. All stack, up to all five kinds, and two shrines of one god give that boon once.
- **C. Kept, but half**: as B, at half each boon's strength (Road ×1.125, Arm ×1.1, Stone ×0.875, Mind ×0.85, Renewal a quarter point).
- **D. Leave it out**: the shrine's boon stays a day's.

Under A, B and C the Weaver's shrine has no boon to keep. Its third prayer gives a rubbing, as every prayer there already does.
Michael: **D — leave it out; shrine boons stay a day's.** (2026-10-13, on issue #267)
*Acted on:* nothing to build; the shrine's boon is a day's, as it is today. Issue #267 closed by the producer. Moved here in Session 800.

### The great gates' two paths (Michael, in chat, 2026-10-13)
Michael, following his A on the six great gates: **"It probably makes sense that Varek wants you to loosen the bindings, and then the realization happens later that the loosening causes the world to rupture (and in other words, would cause the entire game world to zero-sum / delete itself). Maybe the pro-varek choice, whatever that ends up being, can make the player more powerful, and the anti-varek choice is more neutral/non-beneficial to the player. Maybe it even dilutes the player's abilities in that magic type a bit. A cool mechanic could be that you can choose to pursue either path. If you choose the path that varek favors, with each great gate, you basically 'corrupt' the game world. Could be things like changing the color of the sky, or making the trees a different shape. Or making the color of the game black and white. The player can start to realize they are directly impacting the game world, and if they continue on their path and do this for all 6 great gates, they will literally destroy the game. Alternatively, doing the opposite brings more stability and normalcy to the world. It might also be cool if Varek tries to stop you once or twice on the anti-varek path, and maybe the final confrontation happens just before you complete the last great gate. And also, if you choose the route he supports, maybe he has a change of heart at the last great gate, and realizes that you will destroy literally everything, including him, and begs you not to do it, and fights you to the death to stop you, ironically becoming a tragic hero in the end, before the game is destroyed."**
Done, Session 771: written into `lore_canon.md` §9a (*The two paths at the great gates*), with a note on the Act III outline. Backlog A carries the writing; the world's corruption is a stage of the new foundation's look (`docs/design/visual-foundation.md`). Then: **"Every decision at each gate should be reversible, until the 6th gate is decided on. Basically, if the decision is to seal them and preserve the world, the 6th gate locks them all and protects them indefinitely into the future, saving the game world. The opposite of 'tearing them open' creates a leak / rupture of that type, and all 6 being ruptured at the same time collapses reality. You can choose to go back and adjust your choices, but once all 6 have the same type/status, it's locked, and fate is sealed (pun intended)."** (13 Oct 2026, in chat) That answers the first of the writer's questions: each great gate is *sealed* or *torn*, any choice can be undone, and the world is decided only when all six match. Then: **"Yes, sealing a gate again gives the power back. The player should have to obtain some magical artifact to tear them. And they later should be presented with an artifact to seal them. (maybe at the same time, idk). Artifacts akin to Sunder and Keening from Morrowind if you will. Initially, tearing should feel almost purely beneficial to the player with no downsides, where sealing feels like the 'womp womp' boring choice. Sealing all 6 basically keeps the game as is. The player can continue exploring and doing all other quests. But the idea is that the itch is always there to find out what happens if they tear all 6 and do what Varek wanted. What could be fascinating and maybe controversial, would be that tearing all 6 actually deletes all of your saves and truly 'unmakes' the world."** (13 Oct 2026, in chat) Claude read the first sentence as: undoing a choice gives back what it took, whichever way it went. Michael: **"yes, that's what I meant!"** (13 Oct 2026) Deleting every save on the sixth tear is his leaning, not yet a decision: it is raised again, with its precedents and costs, before anything is built. Questions the quest writer still raises as decisions: what *destroying the game* leaves (the world save ends and the character survives, given the two-row save, or both end); what the act at a great gate is, for each path.

### Six great gates, or many gates of six schools? (Claude, Session 771, 2026-10-12)
Raised in chat, from the second concept art round (OG-105, Michael's OG-U2-009 *The Six Gates*). The canon (§9a) has many old gates, each belonging to one of the six schools. The sheet draws six great gates, one for each school, each with a place on the map: Tine, Solas and Gaoth on Aurenne, Cloch and Scáth on the Mark, and Uisce in the Gatelands. Its tagline is "What lies beyond is not a room, but a realm."
- **A. Both** *(recommended)*. Six great gates, one per school, each the source of its school and a realm inside, are the late destinations of their islands; the many lesser gates stay as the canon has them. The home island keeps its gates and gains the Uisce great gate.
- **B. Many gates only.** The sheet is a style guide for each school's gates, and nothing more.
- **C. Six gates only.** The world's gates are these six; the lesser "gates" become their outer halls and branches.
Michael: **A.** "these should be considered 'major dungeons', but I like the idea of having lesser ones scattered across the world that you're more likely to come across. But then I'm not sure what unique benefits clearing a great gate offers you. Maybe that's for the quest writer / narrative designer agent to figure out? Could be something like clearing each great gate and doing something to them further destabilizes the world, which draws Varek's focus and ire. Almost like the inverse of the Towers in the Elder Scrolls Lore, except the protagonist/player is the one destroying the towers in this case." (12 Oct 2026, in chat)
Done, Session 771: the six great gates are in `lore_canon.md` §9a as major dungeons above the many lesser gates. What clearing one gives you, and what it does to the world, is backlog A's, for the quest writer, with Michael's seed and the canon's complicity thread (§ *The player is complicit without knowing it*) to reconcile.

### The cast: how do realistic people get made? (Claude, Session 769, 2026-10-12)
Raised in chat. Nothing in reach of the slices (free kits, the three.js samples) looks like OG-025. Every realistic option needs modelled, rigged characters, which the browser renders fine at 20,000 to 40,000 triangles a person.
- **A. Image-to-3D from the concept sheets, then auto-rig** *(recommended to start)*. Michael (or a session with the tool's API key) feeds a front view from OG-025 or OG-048/056 to Meshy, Tripo or Rodin. The result is a textured model, rigged and given walk and idle animations by the same tool (or Mixamo), exported as GLB to the Drive folder. Claude loads it into the lane and the vista. This is cheap and fast and tests the look this week; faces and hands are where these tools are weakest.
- **B. A base human and modelled clothes.** A CC0 base body (MakeHuman/MPFB) for the four peoples' proportions, with clothing, fur and armour modelled per the sheets. The most consistent cast, but it needs Blender work that no session here can do yet.
- **C. A character artist** for a few hero characters, with A or B for the crowd.
Michael: **"I will try Meshy or one of the other tools"** (A). (12 Oct 2026, in chat) Waiting on his first GLB in the Drive folder; Claude loads it into the lane and the vista.
Then: the Meshy download needed a paid plan, and its auto-rig fused the cloak to the arms ("an eldritch abomination"). Asked why not elevate the existing genome system, Claude proposed MakeHuman's CC0 base body, morph targets and skeleton, with our own wardrobe. Michael: **"Keep going with MakeHuman, It looks like that's going to be the ideal route here."** (12 Oct 2026) Session 770 built the slice.
### A new visual foundation: build it? (Claude, Session 768, 2026-10-12)
Raised in chat with Michael. `docs/prototypes/levelup/` renders the Gatelands from scratch on three.js 0.170 toward OG-077: a shaded terrain, grass in the wind, leaf-card trees, a cloud sky, aerial perspective and a grade. It is a different class of picture from the game's. Getting the game there means replacing how the world is drawn, not tuning it.
- **A. Build it as Deep Work, behind a switch** *(recommended)*. Move to current three.js, then bring in the slice's pieces: terrain shading, grass, trees, sky, water and post. Stream them with the chunks, at three quality levels. The old look stays playable until the new one is whole. Then an asset pipeline (glTF, image-to-3D from the concept art, CC0 kits) for buildings and props, then modelled, rigged people. Backlog L is built in the new kit.
- **B. More slices first.** A village street close up with modelled houses, a gate interior in the dark look, a person at eye level, and the slice running on Michael's machine for frame rate. Then decide.
- **C. Not now.** Keep the current renderer and build backlog L in today's style.
Michael: **"I'd like B but then let's go to A once I approve those. Just need more examples first."** (12 Oct 2026, in chat)
On the characters, after the slices first used a free toy-style kit (KayKit): **"totally the wrong direction. They look like little children's toys - not humanoid and even close to realistic at all."** The target is OG-025's Markmen: real proportions, layered wool, fur and leather, faces. (12 Oct 2026)
Done, Session 769: three more slices (the village lane close up, the gate at dusk, the hall inside), a live page with a frame counter, and no people in any slice. The kit is removed. A goes ahead when Michael approves the slices.
Michael on the live page: **"each one is a steady 60 FPS for the live slices, this should be viable!"** (12 Oct 2026)
Asked whether we could build our own character builder, one that takes other skeletons and creatures too, Claude said yes: MakeHuman is only the source of a CC0 body, and the tool around it is ours already. Michael: **"yes, write it up and fold it in. I also approve of the slices, but want to call out and be mindful of the proportions of our humanoids meshing well with the proportions of everything else in the world. Houses and buildings especially need to match. My only other callout is that the Interior and Exteriors of the gates are too small. They should be shockingly large, like what we see in the concept art. Forget the 'dungeon with cobblestone walls' feel of the previous version. I want to be as true to the concept art as we can be for the Gates."** (12 Oct 2026, in chat)
That is A. Done, Session 771:
- the brief, `docs/design/visual-foundation.md`, with both call-outs as measurements. Today's townsfolk stand about 1.1 units beside 1.85-unit doors, so the rule is one unit to a metre with people as the measure;
- the builder, `docs/design/character-builder.md`;
- the gate slices rebuilt at the concept art's size;
- backlog K marked a Fable session for the producer's card.
Asked to expand his idea of a skeleton for every creature type, akin to MakeHuman's, Claude proposed skeletons from parts, not one per species: a dozen body plans built from a spine, a neck and head, a tail, arms, wings and leg pairs over eight leg presets, with one gait engine for any number of legs. Michael: **"yes, write it up and start the creature prototype"**, and while it was built: **"Be mindful that there are several other animals / monsters that are on other concept art files."** (12 Oct 2026, in chat.) Done, Session 772: the kit and ten plans in `docs/prototypes/levelup/creatures.js`; every creature in the catalogue sorted by plan in `character-builder.md`, *Body plans from parts*.
Sessions 773 to 775 built thirteen more (23 in all). Asked whether the next sessions were planned, Claude found the plan written but nothing queued (no Fable card, no roadmap epic) and the look builder still building in the old style. It recommended two things: queue the foundation as cards, and move the look builder to work that carries over until the renderer lands. Michael: **"Go with both of your recs for the two calls you posed to me."** (12 Oct 2026, in chat.) Done: the cards in `visual-foundation.md` §4 (F1 to F7, for the producer to put on the control room); backlog H paused for old-style look work; the look builder's routine prompt changed to take B1 to B3 first.


### The Makers' tools — the words, and the Wolf-Mother's Cloak taken from a corpse (systems builder, after Session 805, 2026-10-13) — DECISION #263
You chose B on #175 (*the Makers' six tools*). Sessions 776 and 777 built the frame and the Wolf-Mother's Cloak's rule: worn, wolves, bears and spiders leave you alone unless you strike first, and its lair's town loses 0.6 a day while the beast lives. Two things now stop the next sessions.

1. **The words.** Every line a tool needs (its trial's prompts, the failing lines, the hermit who points the way, the altars, the claimants) is written in the quest writer's draft *The Makers' Things*, both runs, in `docs/quest_drafts.md`. The draft is marked unapproved. It also renames the page's *Sundial Ring* to *the Noon Ring*.
   - **A.** Approve both runs as written, the Noon Ring included *(recommended: the builders can then build each trial with its words in one session)*.
   - **B.** Approve them, but keep the name *the Sundial Ring*.
   - **C.** Not yet: build each trial's rule and leave its lines for later. Each tool would then need a second session.
2. **The cloak from a corpse.** The page says the Fighters' Guild wants the beast dead: *kill it and the cloak comes off a corpse, worth half as much*. Its virtue is a peace, so *half* has to mean something.
   - **A.** The same peace, but only for wolves (not bears or spiders), and the town pays nothing because the beast is dead *(recommended: you choose between the whole peace with its cost and half the peace without it)*.
   - **B.** The whole peace, but half its worth in gold (sold to the Guild at half) and no drain on the town.
   - **C.** A plain fur cloak with no virtue: killing the beast loses the gift.
3. **The Gate-Blade's key** (added after Session 779). The page says the blade *opens a sigil gate's door without the gate's key*, only for gates you have opened once. Since Session 517 a gate has no key: you walk into a gate freely, and the locked doors inside are picked.
   - **A.** With the blade in hand, a locked door inside a gate you have been down before opens at a touch, no pick *(recommended: closest to the page, and it never skips a gate you have not walked)*.
   - **B.** Drop the rule; the blade's virtue is its tier and its cost.
   - **C.** It opens the door of a sigil gate whose sigil you have not yet touched.
4. **The Shuttle's cost** (added after Session 779). The page says *the Cold rises 1 a week while you carry it; Varek's next discovery comes one meeting sooner*. The Cold today rises only for an Old Blood reader, and Varek's discoveries wait on your Masteries.
   - **A.** The Cold rises for anyone who carries it, and each of Varek's discoveries needs one Mastery fewer while you do *(recommended: the Shuttle's price is the Shuttle's, whoever you are)*.
   - **B.** The Cold rises only for an Old Blood reader, as the Cold does now; Varek as A.
   - **C.** Leave Varek out: the Cold alone, as A.
Michael: **All four as recommended** (1A the draft approved, the Noon Ring included; 2A corpse cloak wolves only, the town pays nothing; 3A the blade opens a locked door at a touch in a gate you have been down; 4A the Cold rises for anyone carrying the Shuttle, Varek needs one Mastery fewer). (2026-10-13, on issue #263)
*Acted on:* 3A built in Session 780 (`tests/bladekey`), 2A in Session 781 (`tests/cloakcorpse`), 4A in Session 782 (`tests/shuttle`); the words (1A) go in with each trial. Issue #263 closed by the producer.


### Aurenne's houses — the white town, the mix, or the Roman town? (the concept artist, 2026-10-12) — DECISION #259
You set Aurenne's register this morning: a Roman, Egyptian, Arabic and Greek fusion, not French (OG-061, OG-043). Its houses today are the French cottage in warm colours: cream plaster, a gabled terracotta roof, shutters, a chimney and a woodpile (5,710 triangles one storey, 6,646 two). The prototype (`docs/prototypes/aurenne/`, on auto/concept) draws five new houses in the shape kit, beside today's house taken from the game itself (build s587) and the game's own Aurennais townsfolk for scale (1.22 and 1.30 units). Under every option: walls with real arched openings as deep as the wall, small deep windows, a door of painted cedar in a frame of blue and white glazed tile, lattice screens (mashrabiya) on the upper floors, cypresses and bougainvillea at the doors, walls in five washes (lime white, warm lime, ochre, rose, chalk). One storey is 2,808 triangles; the richest house, two storeys with a dome, is 6,056, about today's. Only the houses change here; churches, keeps and guild halls are another question. The same house stands in the foreign quarter by the water in the Gatelands' ports, which borrows Aurenne's style today.
- **A. The white town**: every house flat-roofed, with a terrace behind a rounded parapet, rainwater spouts, pots, a pergola with a striped awning, an outside stair to the roof; the rich houses domed in blue tile. Greek-island and North African.
- **B. The mix** *(recommended)*: A's houses for two in three, and one in three Roman: a low hipped roof of half-round tile and, on the larger lots, an arcade of round arches on columns at the street. Domes kept for the rich and for temples.
- **C. The Roman town**: every house hip-roofed in tile, the arcade on the larger ones, the arched doors and tile frames as above. Nearest to today's roofs.

Recommendation: **B.** OG-061 draws both, white terraces and domes beside tile, and your four names (Roman, Egyptian, Arabic, Greek) are two kinds of roof. A street of one roof reads as a theme park; the mix reads as a city that has been built over for centuries. A alone makes Aurenne the most foreign of the three nations from the sea, which is a fair second choice.

Screens: [today beside the proposal](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/aurenne/compare.png) · [today's street](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/aurenne/street-today.png) · [A, the white town](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/aurenne/street-a.png) · [B, the mix](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/aurenne/street-b.png) · [C, the Roman town](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/aurenne/street-c.png) · [the five, front](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/aurenne/front.png) · [side](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/aurenne/side.png) · [roofs from above](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/aurenne/top.png) · [the door at a townsperson's scale](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/aurenne/scale.png)
Michael: **The mix: two in three flat, one in three Roman** (B). (12 Oct 2026)

### A householder woken in the night: what does she say, and does she mind? (systems builder, after Session 763, 2026-10-12) — DECISION #255
The critic's s585: E beside Sinéad's bed in Carraig Mór at 1h wakes her (Session 739), and the ordinary day talk opens: *Blessings on the road that brought you. One of our own, friend.*, with *My name is Traveller.* first. The prompt over her while she sleeps reads *Sinéad — Press 'E' to talk*. Nothing knows it is the middle of the night or that a stranger is standing in her bedroom. Today, being inside after hours is not a crime (the crime design of 26 Sep), so how she takes it is a rule of play, and the words are the quest writer's.
- **A. A line of her own, then the talk** *(recommended)*: over a sleeper the prompt reads *Sinéad (asleep) — Press 'E' to wake*. Woken, she opens with one night line by her people (the quest writer writes four, a startled *What — who's there? It's the middle of the night.* in each voice), and the usual talk follows without the introduction topic first. No new rule; a picked lock seen is still the only crime.
- **B. As A, and she wants you out**: woken, she says her line and the talk offers only *Leave* and *I'm sorry, I'll go*; she will trade or talk normally from 7h. Still no crime.
- **C. As A, and a stranger found in a home at night is trespass**: woken by someone who neither rents, owns nor was let in, she counts it as a seen crime (−1 favour, the 25-gold fine, a guard sent, as a picked lock), and the line says so.
Recommendation: **A**. The crime design chose that being inside is not a crime, and the critic's complaint is the words, not the rules; C changes the crime rules on a corner case, and B blocks talk the player came for.
Michael: **Her own night line, then the usual talk** (A). (12 Oct 2026, on issue #255)
*Done, Session 770:* over a sleeper the prompt reads *<name> (asleep) — Press 'E' to wake*; the first talk after she is woken in her sleeping hours opens with the night line in place of the greeting, once a visit, and the introduction moves after her own topics. No crime. The four voices are the quest writer's: `WOKEN_LINES` in `js/86-world-crime.js` is empty, and until a people has its own line the decision's *What — who's there? It's the middle of the night.* stands for all four.

### The concept art's open questions (Claude, Session 767, 2026-10-12)
Raised in chat with Michael after his review of the 96 images (62 kept). Each question comes from kept images (`docs/art/catalogue.csv`); backlog L marks the items that wait on it. Answer by number and letter.
1. **How people are proportioned** (OG-012, OG-095). **A.** Naturalistic, about 1.75 m. **B.** A heroic hybrid, about 1.80 m, slightly longer legs and broader shoulders, so a figure reads at a distance and in a fight *(recommended; both sheets pick it)*. **C.** Stylised: bigger heads and hands, narrow waists.
2. **The Old Blood's sigils** (OG-066, OG-065). **A.** Ink at the wrists, as the canon has it. **B.** Pale raised lines under the skin, branching like veins at the wrist, the hand and the shoulder; they read at game scale and could spread as the Cold takes hold *(recommended)*. **C.** Ink on the young; the elders' marks have spread to the face and hands (Síle).
3. **The ship ladder** (OG-004, OG-072, OG-027). **A.** Keep the game's five classes (sloop, cutter, caravel, cog, galleon), each dressed by its island (a Markish galleon is a drakkar), and the boards' other hulls (dhow, longship, galley) sail as other people's ships *(recommended)*. **B.** The boards' ladder for the player: fishing boat, sloop, cog, brigantine, frigate. **C.** Both: the fishing boat as a starter under the five.
4. **Crew** (OG-093, OG-027). **A.** None; the ship is yours alone, as now. **B.** Hired crew with roles and morale (food, pay, victories). **C.** Crew as upgrades without morale: a carpenter mends at sea, a cook feeds you, a navigator shows the coast *(recommended)*.
5. **Climate** (OG-023, OG-039). **A.** None; cold and heat are only the look. **B.** A moderate rule: the Mark's cold and Aurenne's heat wear your stamina without the right clothes, and a few herbs and meals resist them *(recommended; fits the moderate survival Michael set)*. **C.** Cold only, in the Mark's high places.
6. **New kinds of weapon** (OG-028). **A.** Spear and crossbow first, the two every board draws *(recommended)*. **B.** All seven: spear, crossbow, javelin, rapier, harpoon, glaive, sling. **C.** None; the island sets are reskins of the ten kinds there are.
7. **Firearms** (OG-075's flintlock, OG-035's saltpeter, OG-065's musket). **A.** None in hand; guns stay cannon on the top ships *(recommended; neither the canon nor the brief admits them)*. **B.** One legendary pistol, unique. **C.** Late-game firearms, crafted.
8. **A catastrophic gate's monsters** (OG-073). **A.** As the canon has it: a catastrophic failure makes one dragon. **B.** Each school's foe has a catastrophic form, a boss tier under the dragon *(recommended; the failing column is built either way)*. **C.** The catastrophic forms replace the dragon.
9. **Six-legged animals** (OG-040). **A.** Ordinary in this world: a few species have six legs and nobody remarks on it *(recommended; the Morrowind licence)*. **B.** A seam of the binding: they live near gates. **C.** None.
10. **Aldwyn's wrist sigil** (OG-053). **A.** None; he is an ordinary man. **B.** He is Old Blood and has hidden it, which would explain his hundred and fifty years *(recommended)*. **C.** The mark of the Royal Mage Corps he served, a reader's mark.
11. **Corwin's people** (OG-057, OG-069). **A.** Gatelander. **B.** Aurennais, as the sheets label him. **C.** Never said, which fits his evasions *(recommended)*.
12. **Companions** (OG-051's and OG-083's wolves, OG-054's Gateborn Companion). **A.** None for the player; the wolves are their owners' *(recommended for now; the canon's gate-born do not bond)*. **B.** An animal companion (a dog or a wolf). **C.** An animal and a gate-born companion.
13. **Arenas** (OG-079, OG-080, OG-089). **A.** Training grounds and arenas in Markish towns, for the duels and the mercenary trade *(recommended)*. **B.** None.
Michael: **1 B, 2 B, 3 A, 4 C, 5 B, 6 A, 7 A, 8 B, 9 A, 10 B, 11 C, 12 A, 13 A**, every recommendation. (12 Oct 2026, in chat)
Done, Session 767. The canon answers are in `lore_canon.md`: 2 in §3.1 and §3.3, 8 in §5, and 9, 10, 11, 7 and 13 in §14. Backlog L's items carry their answers.


### The concept art's first batch: style, the gate, invented names, Aurenne (Claude, Session 755, 2026-10-12)
Raised in chat from the first batch of the concept art intake (`docs/art/catalogue.csv`, OG-007 to OG-096 of the world folder).
1. **The style.** OG-096 shows four studies: A luminous and painterly, B atmospheric and epic, C seasonal and textured, D mystical and unsettling.
   Michael: **"The 4 styles were all meant to coalesce."** Gates and dungeons are D; "the world [is] largely painterly / inviting and pleasant, with some epic and atmospheric flair, and seasonal elements. The dark pieces should be a stark contrast and something you 'dive into' for shorter stints. Not something to 'live' in." (12 Oct 2026)
2. **The gate's outside.** OG-037's four variants. Claude suggested V1, concentric rings, with V3, a broken circle, for a failing gate.
   Michael: **agreed.** (12 Oct 2026)
3. **Names and politics invented by the art** (Crownholm/Crownhaven for the Crown's seat, a Highhold and Council of Houses in the Mark, royal courts in Aurenne).
   Michael: **"Canon wins in a lot of this, but we also have a lot of empty space to fill in the world. We should take inspiration from some of the creations, even if they're not 100% lore-friendly, and weave them in. And if they touch on an open and obvious gap, let's lean in."** (12 Oct 2026)
4. **Aurenne's register.** The art draws North African and Mediterranean; the canon named Aurenne in a Norman-French register.
   Michael: **"Aurenne in my head is basically Mediterranean and North African. Almost like a fusion of Roman / Egyptian / Arabic / Greek. People are intended to be mixed / darker skinned, with a healthy range of color. The french piece, I am less inclined to embrace at this point. That was just a stand-in."** (12 Oct 2026)
Done, Session 755: the style in `design_brief.md` (*Look*); Aurenne in `lore_canon.md` §1.3, the peoples table (§2) and §14; the rest of the canon untouched until the quest writer writes the new names. Backlog J carries the build.

### The gates by school: what foes each school's gate holds (systems builder, Session 759, 2026-10-12) — DECISION #252
Your A on the gates by school made goblins an *occupied* state, not a kind of gate; Session 759 built that (a gate that drew *goblin* is now an occupied gate of a school, lit in its school's shape, holding the goblins, kobolds and Shieldbearers). The canon's table (§9a) also names each school's foes, and that is a rule of play, so it is yours. What stands today: each gate draws its foes from six slots (a foe named twice comes twice as often), and a foe joins only from its level: Skeleton, Goblin and Slime at 1, Cave Troll at 2, Golem, Phantom and Fire Elemental at 3, Gargoyle and Mimic at 4, Wraith at 5. Built to the table exactly, a level-one character in a Cloch (stone) gate meets only Skeletons (the fallback), and in a Scáth (shadow) gate the same until level 3. Cloch's gate today still holds Goblins and Shieldbearers.
- **A. The table, with a level-one foe kept in each** *(recommended)*: Solas Skeleton ×4, Phantom, Wraith (as now, the Mimic out); Tine Fire Elemental ×2, Slime ×2, Golem, Cave Troll; Uisce Slime ×2, Skeleton (drowned), Cave Troll, Mimic, Slime; Cloch Golem ×2, Gargoyle, Cave Troll, Skeleton ×2; Scáth Phantom ×2, Wraith, Mimic, Skeleton ×2. Goblins, kobolds and Shieldbearers only in occupied gates. Every gate has something to fight at level one, and each school reads as its table from level 3 or 4.
- **B. The table exactly**: only the foes the table names; below a school's first level its gate holds the Skeleton fallback.
- **C. Keep today's six lists**, taking only the Goblin and Shieldbearer out of Cloch's (a Skeleton and a Gargoyle in their place).
Gaoth (wind) is not rolled yet in any option: its table wants wisps and *something winged*, which are meshes the look builder has not made.

Michael: **The table, with a level-1 foe kept in each** (A, tapped on the control room). (12 Oct 2026)
Done, Session 763: `THEME_DEF` (`20-quests.js`) holds the five rosters as written; `tests/schoolroster`.

### What gives an old gate its character: its theme, its god, or its school? (Claude, Session 754, 2026-10-12)
Raised in chat over a bestiary sheet Michael had made: the six dungeon themes (undead, goblin, elemental, deep, haunted, ruins) date from *Dungeon of Shadows* and have no reason in the canon. "Why would we have a 'goblin' gate? Shouldn't it be tied to the magic type?"
- **A. By school** *(recommended)*: each gate belongs to one of the six schools (Tine, Uisce, Cloch, Scáth, Solas, Gaoth). Its sigil teaches that school's words, and its stone, light, hazards and antibodies take that school's shape. Goblins become a state any gate can be in: *occupied*.
- **B. By god**: one of the six gods with temples (Sea, Sky, Beasts, Stone, Hearth, Weaver). A strong lore fit, but not tied to spells or progression.
- **C. Keep the six themes** and give them a reason in the lore (a goblin gate is one goblins moved into).
Michael: **A, tie gates to the schools.** (12 Oct 2026)
Done, Session 754: written into `lore_canon.md` Part II §9a with the mapping; backlog C carries the build for the systems and look builders.

### The fall — the death screen on the parchment: a leaf, the word, or a restyle? (the concept artist, 2026-10-11) — DECISION #243
When you die today the screen reads *YOU DIED* in red over a dark veil, with the HUD still on behind it, one line (*Last save: slot 1 — Dunmore, level 5*) and two buttons. It is the last screen on the dark style the UI overhaul replaced on 27 Sep. The prototype (`docs/prototypes/fall/`, on auto/concept) uses a real fall on build s576: Aoife saved in Dunmore at 4 pm, went down an old gate and died to a Skeleton on the first floor of the Dungeon of Shadows at 7:36 pm. Under every option the rules stay as they are: nothing is lost but the play since the save, and the world waits.
- **A.** The leaf of the fallen *(recommended)*: the view drains to sepia and the HUD goes; the pause leaf's paper at the left, so the foe stays in view. *Fallen*, where and to what (*to a Skeleton's sword*) and the date; your last save with its picture, its hour and how long before the fall (*3 hours and 36 minutes*); three rows: load the last save (E), choose another save (L, the register), to the title (a second press). One small rule: the game remembers what dealt the last blow.
- **B.** The word, on the dark: *Fallen* large in the kit's lettering over the drained view, the same two lines under it, and three paper buttons. No paper sheet.
- **C.** Restyle only: today's words and two buttons on a slip of the paper.

Recommendation: **A.** Oblivion's death opens its load list, so the next step is a choice of saves, not one button; the leaf gives that, and the hour since the save tells you what the load costs before you take it. B is the Dark Souls card, the word as the moment; it says the same things with less room for the save.

Screens: [today beside A](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/fall/compare-fall.png) · [A](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/fall/a-fall.png) · [A, with no save](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/fall/a-nosave.png) · [B](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/fall/b-word.png) · [C](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/fall/c-restyle.png)
Michael: **The leaf of the fallen** (A) — A is fine but I don’t know if I love the fact that it’s aligned to the left third of the screen. Could we instead force third-person, instantly have the player character ragdoll for a maybe 5 seconds, and then show the death screen? (11 Oct 2026)

### More barrels and boxes in towns: how many, and what they hold? (systems builder, 2026-10-11) — DECISION #245
Your playtest note of 6 Oct (backlog D): *all towns and cities should have more barrels and boxes out and about, with low-level loot, more to interact with.* Today the generator puts a fixed number beside the houses' walls: a city 10, a town 7, a village 4, a hamlet 2 (`83-world-generator.js`, grep `Loot barrels and crates`). Each holds everyday goods only (no arms or armour; a candle, rope, salt or bread if the roll gives nothing). Each is rolled again every game day, and taking from one is not a crime. How many there are, and what they hold, is a rule of play.

- **A. Twice as many, as they are** *(recommended)*: city 20, town 14, village 8, hamlet 4. Same everyday goods, same daily refill. The fallback goods sell for 1–3 gold apiece (a candle 4 to buy, rope 9, at a third back). Seven more barrels in a town come to tens of gold a day at most, not measured, and change no progression.
- **B. Twice as many, but most hold little**: as A, but each new one is empty two days in three, as in Skyrim's streets. More to open, about as much to find as today.
- **C. Three times as many, a quarter of them someone's**: city 30, town 21. One in four stands at a house's door and counts as that house's: taking from it in sight is theft (−2 favour, the fine), as a home chest is.
- **D. Leave the count; make them easier to find** (the look builder's half only: where they stand, by the inn's yard, the smithy and the market).

Recommendation: **A.** It is what the note asks for, it costs no new rule, and the goods are too cheap to move the economy. C ties the barrels into the crime system, which is a larger change than the note asked for. Where the new ones stand is the look builder's either way.
Michael: **Twice as many, as they are** (A). (11 Oct 2026)
*Built, Session 753* (systems builder): a city 20, a town 14, a village 8, a hamlet or port 4; the first half placed as before, the second on their own stream (`tests/townbarrels`).

### The world's tone: grounded medieval, or high fantasy? (Claude, Session 750, 2026-10-12)
Raised in chat while writing the concept art brief: the canon's tone line (Part I, *Tone & voice*) read "Medieval-grounded with creeping dread. Not high fantasy", and Michael's direction for the art contradicted it.
Michael: **High fantasy at the core, grimdark and cosmic horror underneath.** "I would like to have the core of it be High Fantasy, as I want it to be uplifting/exciting and not depressing to play… the player should feel like the world is largely 'pleasant', save for the villains themselves. The horror should be that the ones who are 'awake'… are painted as villains. The player should gradually realize that they are the real monster in this universe… I don't want that to be spoon-fed." Not out-of-the-box fantasy: Morrowind's strangeness where it counts. Asked to write it into the lore and the brief. (12 Oct 2026)
Done, Session 750: `lore_canon.md` Part II §10a (his words, what it makes canon, what stands), Part I's tone line marked superseded, §14; `design_brief.md` gains a Tone section and two lines under *Not this*.

### Portclare's cut to the quay: a retaining wall, the banks as they are, or steps? (the look builder, Session 725, 2026-10-11) — DECISION #236
Your sailing playtest (6 Oct) asked for a road from a port's town to its shipyard. The systems builder's Session 618 built a lane to every quay, graded evenly from the town down to the water. At Portclare the quay lies behind a ridge, so the lane cuts through it for about 70 of its 92 units. The ground stands up to 8.9 units over the lane 8 out on one side and 7.1 on the other. Today the cut's sides are the road's own blend: steep grass banks running straight up from the lane's edge. At the other three ports nearest Dunmore the lane is 8 units long and flat, with no cut. Should Portclare's cut, and any quay lane's cut deeper than 1.2, have a wall?

- **A.** A dry-stone retaining wall at the foot of each bank wherever the cut is deeper than 1.2: coursed grey stone, its face battered back 1 in 5, a cap of flat stones, at most 2.6 high, with the turf bank going on above it. At Portclare that is about 2,550 triangles in one mesh, built with the lane. **Recommended:** the lane reads as made by people, and the walls frame the way down to the water.
- **B.** Leave the cut as it is: turf banks, no stone.
- **C.** Steps instead of a cut: the lane climbs over the ridge as it stood and goes down its seaward side by stone steps. This undoes Session 618's even grade. Not prototyped.

Pictures (left today, right A; the wall is laid in the page by `docs/prototypes/quaycut/shoot.mjs`, not in the game):
- From the lane in the deepest part of the cut, looking down to the quay: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/quaycut-lane.png
- From above the lane: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/quaycut-above.png
Michael: **A dry-stone retaining wall at the foot of each bank** (A). (11 Oct 2026) **Built, Session 744** (`tests/quaywall`, `docs/prototypes/quaywall-lane.png`, `-above.png`).

### The climb up a boarding net: a hand-over-hand pose on the net, the pose alone, or as it is? (the look builder, Session 726, 2026-10-11) — DECISION #237
The boarding nets (Session 638's rule, Session 723's look) are climbed with E in 0.8 s. In third person today the body slides on a straight line from the water to the rail in whatever pose it had: it stands upright with its arms down, and for most of the climb it passes through the hull's planking and cannot be seen (the top row, the middle frame). First person shows nothing of it. How should the climb look?

- **A.** As the bottom row shows: the body faces the hull and climbs hand over hand, three reaches in the 0.8 s, the knees stepping up the mesh and the head tipped up. It is held on the net, .35 off the planking, until the last fifth of the climb, when it swings in over the rail. The pose goes in the third-person body (`54-thirdperson.js`); the path is one change to the climb's tick (`tickNetClimb`, the systems builder's file, which I would ask them to take or leave to me). **Recommended:** the body stays on the net, which is the point of a net.
- **B.** The pose alone, with the path as it is (the body still passes through the planking for most of the climb).
- **C.** Leave it. The climb is 0.8 s and most play is in first person.

Under A, first person could also show both hands reaching up into view on the rope. That is not prototyped; say if you want it.

Picture (top row today, bottom row A; a quarter, a half and nine-tenths of the way up; the pose is laid in the page by `docs/prototypes/climb/shoot.mjs`, not in the game): https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/climb-net.png
Michael: **Hand over hand on the net, then over the rail** (A). (11 Oct 2026) **Built, Session 743** (`tests/netclimb`, `docs/prototypes/climb-built.png`).

### A householder at night — asleep in bed, asleep but light, or awake as now? (systems builder, 2026-10-11) — DECISION #240
Section B's witness rule says *anyone awake … not asleep indoors*. Nobody sleeps. A home's resident is inside from 21h to 7h (`npcInsideNow`), on their feet the whole night, walking the room between the door and the hearth. The critic's s572 run picked Sinéad's door in Carraig Mór at 23h30 and found her a step inside; she turned as the chest's lock opened and saw it. So every night burglary of a home is done in front of its owner, and the only way to rob a home unseen is to time her turned back. Outdoors at night the street is nearly empty (Carraig Mór has one man awake after 21h), so the home is now the harder target than the shop, which is the wrong way round.

- **A. Asleep in bed from 23h to 5h.** The resident lies on their own bed (the room already has one), sees nothing, and wakes only to what is within 2 units (the street's *hears you whichever way they face*) or a blow. Awake as now from 21h to 23h and from 5h to 7h. The picked door does not wake them. One session; the lying pose is the look builder's (H), and until then the body lies on the bed in the standing pose turned flat.
- **B. Asleep, but light.** As A, and a snapped pick or the chest opened in the same room wakes them on a roll: a third of the time, a sixth sneaking. One session.
- **C. Leave them awake.** The spec's *not asleep indoors* is struck; a home at night stays the dangerous place.

Recommendation: **A.** Thief and Oblivion both put sleepers in beds and let you work a room past them; Skyrim gives a sleeper far less sight than a waking guard. A keeps the rule the spec already gives (only the awake see), keeps the outcome deterministic (no new roll for the co-op rules to key), and still leaves the evening and the dawn as the hours a resident catches you.
Michael: **Asleep in bed from 23h to 5h** (A). (11 Oct 2026)
Done, Session 739 (systems builder): the resident lies on their bed 23h–5h, sees nothing, and wakes within two units of the bed or to E (`tests/homesleep`). The lying pose is owed to the look builder.

### A Cave Bear's cavern at level 1 — a wall for the starting club, by design or not? (systems builder, 2026-10-11) — DECISION #241
Session 718 asked whether a lair's cavern is now *the harder place without being a wall*. The critic's s572 run says that for a Cave Bear's lair at level 1 it is a wall: the master has 204 health (Easy, floor 2, ×3), armour 4, blunt ×0.8, and the Warrior's Wooden GreatClub landed 1 a blow. The critic died twice, in 7.7 s and 10.6 s. Measured on 11 Oct by the systems builder: nothing is broken. The master and the crag's beast have the same armour and resistances, as Session 706 says, and a raw blow of 6 lands 1 on both. The 3 the critic saw at the crag was a lucky blow or a backstab. The cause is that armour is a flat subtraction (`applyMeleeDamage`: the blow less the armour, at least 1), and the GreatClub is the weakest weapon in the game against it. At level 1 against armour 4, the average blow is GreatClub 1, Wooden Sword 3, Wooden Mace 2.5, Bronze Sword 5, Wooden Claymore 9, Iron Sword 7.5. So the master is about 200 swings with the club, 41 with a Bronze Sword and 23 with a Wooden Claymore. The crag's beast (259 health) is the same wall for the club.

- **A. Leave it.** A Cave Bear is a level-4 kind and a lair is optional. The club is the starter that Barnaby's better stock replaces, and the door already says *Something large is waiting further in*. No session.
- **B. Armour never takes more than half a blow**, everywhere, for every foe and for you. The club lands 2 on the master (about 100 swings). A Bronze Sword and anything stronger are unchanged against armour 4. Weak weapons against heavy armour gain the most. One session, with the combat tests run again.
- **C. Below the kind's own level, a lair's master is ×2 health, not ×3.** At level 1 the Cave Bear master goes from 204 to 136. That is about 136 swings with the club and 27 with a Bronze Sword. The crag's beast is unchanged. One session.

Recommendation: **A.** Dark Souls and Elden Ring both let you walk into a fight your weapon cannot win and teach you to come back. The cure here is a better weapon at the goods shop, not a softer bear. B is the one to take if the starting club should matter at all against armoured foes, since it changes the club everywhere, not only in caverns.
Michael: **Leave it** (A). (11 Oct 2026)
Noted, Session 739: no session; the backlog item is closed.

### A walled town with one gate has one guard — two, as the code's comment says, or one? (systems builder, 2026-10-11) — DECISION #242
`genSettlement` (`83-world-generator.js`) puts *a couple of guards at the gates*: one on each of the first two streets, where the street crosses the ring just inside the wall. A town with a single road in has one street that reaches the ring, so it gets one guard. Of the five walled towns round the start, Dunmore and two others have 2. Carraig Mór (prosperity 56) and Coeur de Vie (a city, 78) have 1, and each has one gate. The third man, the night watch, comes only at prosperity 60, so Carraig Mór has one man awake at night. The critic's s572 run walked it hour by hour: from 21h to 5h Séamus walks the beat alone, every one of 36 homes is 50 units or more from him, and a street pick after 21h cannot be seen at all. Dunmore's three-man watch is seen at 26% of night picks (Session 609).

- **A. Two gate guards in every walled town.** With one gate, the second stands at the same gate by day and walks the beat at night, starting from the far side of the loop. Carraig Mór gets two men at night, Coeur de Vie three. Spawned last, so no one else's name or place changes. One session.
- **B. As A, and a walled town under 60 also gets the night watch (three at night).** The Dunmore numbers would then hold in every walled town. One session.
- **C. Leave it.** A one-gate town is a thief's town at night. That is a fact you learn by watching the street, and it is how the world's poorer towns differ from the rich.

Recommendation: **A.** The comment and Session 166 both meant two guards, and one guard walking the whole town makes a street pick a sure thing, not a risk you read and time. B is the choice if every walled town's night should be as watched as Dunmore's. C keeps a variety that is real, but the player cannot see its cause: the number of roads in.
Michael: **Two gate guards in every walled town** (A). (11 Oct 2026)
Done, Session 740 (systems builder): Ruairí at Carraig Mór's gate, Fáelán at Coeur de Vie's; no one else's name or place moved (`tests/gateguards`).

### The lockpick on the parchment — the lock in section? (the concept artist, 2026-10-10)
The lockpick is the last main panel still on the dark style the UI overhaul replaced on 27 Sep. The prototype (`docs/prototypes/lockpick/`, on auto/concept) puts it on the parchment with real locks from build s488. Under every option the rules stay as they are: two to five pins, push, and press again while the pin holds at the shear; a snap costs a pick and drops the last pin set.
- **A.** The lock in section: a parchment slip in the middle of the screen with the lock drawn as an engraving (brass and iron pins, springs, the shear ruled in red, the pick under the pin you work); the title says which lock it is; the picks a row of pick marks. *(recommended)*
- **B.** A, but a town lock's slip stands to the right with no dark veil, so you can watch the street while you work. A dungeon lock stays centred.
- **C.** Restyle only: today's bars and words, on the paper.

Recommendation: **A.** Oblivion draws the lock in section and you see the pins move; today's bars don't say what is being pushed or why the press must wait. B covers the right third of the view.
Michael: **The lock in section, engraved, centred** (A). (11 Oct 2026)

### Unblock main's CI — the suite outgrew eight shards (the producer, 2026-10-10)
Main's own check was cancelled at the 60-minute limit on its last two runs (dc7b2d9, c282127): shard 5 of 8 ran out of time while the other shards passed. The suite is too long for eight shards. The systems builder already split it into twelve (Session 652, `6120465`, only `.github/workflows/check.yml`), but that rides Systems sessions 564–710, whose CI is red on five suites.
- **A.** Port Session 652's twelve-shard change to main now as its own small PR, which you approve; main and every branch get a full CI run again. *(recommended)*
- **B.** Wait: the twelve shards land when Systems sessions 564–710 merge.
Michael: **Port the twelve shards to main now** (A). (10 Oct 2026)

### When a lair's beast dies, does the nearest glade grow twice its herbs (canon §12)? (systems builder, 2026-10-10) — DECISION #227
Canon §12's table gives three effects for `lairs[id].dead` (a lair's beast killed): *stays dead; nearest glade doubles herbs; a rumour within two provinces.* Only *stays dead* is built (`markLairDead`; Sessions 695 and 694 made it hold through a rebuild and a load). The critic noted the other two on 10 Oct. The rumour is the talk the critic's proposal *The town speaks of its beast* (`docs/proposals.md`) already covers, and its lines are the quest writer's. This question is the glade's.

Today a glade grows a ring of 18 herbs of its biome (`buildGlade`, each `<site>:herb:<i>`). They are picked and grow back like any herb. Nothing reads the lairs.

- **A. As the canon says.** The glade nearest a dead lair, within 1,500 units, grows a ring of 36 herbs, the second 18 keyed `<site>:herb:18…35`. It holds from the day the beast dies, and the save already carries that. The card shows *the glade is thick with herbs since the beast died*. One session.
- **B. Doubled, but by the glade's own nearness.** The same, but only a glade within 700 units of the lair. That is the radius at which a lair already weighs on towns (the drift, the plague). Farther glades are untouched. One session.
- **C. Leave it.** The canon's line stays a note until alchemy is a skill (J's survival skills), when herbs are worth more.

Recommendation: **B.** It ties the reward to the same 700 units at which the beast harms a town, so killing it is felt on the same ground. 1,500 would often double a glade a province away from anything the player connects with the lair. A is the canon read literally; B is the canon read through the rules already built.

Michael: **B** — doubled, only a glade within 700 units (2026-10-10, on #227; written to auto/producer aab94ff). **Built, Session 719** (`tests/gladeherbs`). The card's line (A's *the glade is thick with herbs since the beast died*) is not built: it is new text, the quest writer's.

### A lair's cavern — your level's difficulty, a grade above it, or always Hard? (systems builder, 2026-10-10) — DECISION #230
Since Session 9 every old gate's difficulty is your level's grade: Very Easy to level 2, Easy to 5, Normal to 9, Hard to 14, then Very Hard (`levelDiffKey`). A door you found early stays a fair fight later. A lair's cavern door is written `diff:'hard'`, and a dragon lair's `veryhard`, but nothing reads either: the portal's difficulty is always your level's. The critic saw *[Very Easy · deep · medium]* on Carrigowen's cavern at level 1, where the beast outside had killed them twice.

Measured with Session 706's masters (a Marsh Hag, floor 2, level 1): on Very Easy, as today, the master has 97 health; Easy, 149; Hard, 321. The beast at the crag outside has 190.

- **A. A lair's cavern one grade above your level, a wyrm's two** (Easy at level 1, up to Very Hard). The cavern stays fair at any level, as Session 9 wants, and is still the harder place. Every foe inside is scaled, and so is the loot (`rollLoot` reads the grade). One short session.
- **B. As written: a lair's cavern is always Hard, a wyrm's Very Hard.** At level 1 that is 1.5× health and 1.45× blows on every foe in the cave.
- **C. Leave it.** Every door is your level's grade, and the dead field is taken out.

Recommendation: **A.** In Skyrim a dungeon's level is set from yours with a floor and a cap, and a named lair sits above the common ones. A keeps Session 9's promise that a door is a fair fight at any level, and it makes the cavern under the beast's crag worth its name. B would make the first lair a new character finds a wall.

Michael: **A** — one grade above your level, a wyrm's two (2026-10-10, on #230; written to auto/producer aab94ff). **Built, Session 718** (`tests/lairgrade`).

### A lair hoard's piece: should its metal follow its tier? (systems builder, 2026-10-10) — DECISION #232
A lair cavern's hoard holds one piece, a sword or a cuirass, and `lairFinish` (`68-dungeon-misc.js`) rolls it on two separate draws: the metal in its name (`Iron/Steel/Silver`; a wyrm's `Silver/Gold/Mithril`) and its tier (3–4; a wyrm's 5–6). The tier sets the attack, the defence, the price and, since Session 708, the requirement. The name does not follow it. So a *Steel Cuirass* can be tier 3 and an *Iron Sword* tier 4. *Silver* and *Gold* are no tier in `MATERIALS`. A wyrm's tier-6 piece can be called *Silver*, where every other tier-6 blade is Adamant. Found in Session 708 (the critic's s482 *Steel Sword* with no requirement).

- **A. The name follows the tier** (`MATERIALS`: 3 Iron, 4 Steel, 5 Mithril, 6 Adamant). The metal draw is still taken, so every other roll in the hoard comes out as before; only the name changes. Silver and Gold leave the hoard. One short session.
- **B. The tier follows the name.** Iron 3, Steel 4, Mithril 5; Silver and Gold become precious pieces at tier 4 and 5, with a higher price and no gain in attack. This adds two metals the rest of the game does not have. One session.
- **C. Leave it.** The name is flavour; the requirement and the numbers already follow the tier.

Recommendation: **A.** Everywhere else in the game a sword's metal tells you what it does: an Iron Sword asks Might 5, a Steel Sword Might 10. A hoard that breaks that rule teaches the player that names lie. A changes no numbers, only the word.

Michael: **A** — the name follows the tier (2026-10-10, on #232; written to auto/producer aab94ff). **Built, Session 717** (`tests/hoardmetal`).

### What a lair cavern's master is — the lair's own beast, or the deepest foe named for it? (systems builder, 2026-10-10) — DECISION #225
The critic found that Carrigowen's cavern master is a Slime of 49 HP named *Carrigowen — Cave Bear*. `lairFinish` takes whichever foe stands farthest from the entrance on the lowest floor and gives it the lair's name, 3× health and a 1.5× scale. It keeps its own body. Only a dragon lair gives its master a new body, the wyrm's (Session 219). Session 699 made the name agree with the beast at the crag outside, but the body is still whatever stood deepest: a slime, a skeleton, a spider.

- **A. The master is the lair's own beast.** A Marsh Hag in a fen, a Frost Troll on the tundra, an Ash Wight in the wastes, and a Cave Bear or an Ogre elsewhere. It is built on the open world's body for that kind in the cavern, as the wyrm already is. One systems session; the look builder then checks it under the cavern's ceiling.
- **B. The master keeps its body and is named for it.** It becomes *Carrigowen — Slime*, and the master is the strongest kind on the deepest floor, not the farthest foe.
- **C. Leave it.** Any deepest foe, named for the lair's beast.

Recommendation: **A.** The lair is named for its beast, and the dragon lair already works this way: its master is the wyrm, whatever stood there. A gives every lair what the wyrm has. B is honest but makes a lair's master a slime half the time.
Michael: **The master is the lair's own beast** (A). (10 Oct 2026)
Built: Session 706 on auto/systems (`lairMasterBody`, `tests/lairmaster`).

### Witnesses in the street — all round, or only what they face, as in a shop? (systems builder, 2026-10-10) — DECISION #222
In the street, a townsperson or guard sees a crime all round: anyone awake within 12 units with a clear line (6 sneaking or at night, 3 sneaking at night, 11 in the dark hood). They see it whichever way they face. Indoors, since your B on #73, a keeper sees only what they face, in a cone of about 120° within six units. So in the street you can never pick a lock behind someone's back, and inside a shop you can. Measured (Session 609, `tests/nightpick`): at Dunmore's seven shop doors from 20h to 4h, a pick is seen 26% of the time walking and 18% sneaking.

- **A. The street as the shop.** Outdoors a witness sees in a 120° cone the way they face, to the same ranges. Anyone within 2 units hears you whichever way they face. A guard on his beat faces the way he walks, so you can work a door once he has passed. One session; the night-pick numbers are measured again.
- **B. A guard sees all round, townsfolk by their cone.** The watch is paid to look about. Villagers and keepers in the street see only what they face. One session.
- **C. Leave it.** The street is busy and people turn their heads. Only indoors has the cone.

Recommendation: **B.** Oblivion and Skyrim judge a witness by line of sight and facing, so a back turned is a chance. That is your call on #73, and A carries it outdoors. B keeps one thing: the guard is the one you can't slip past by timing a turned head. That keeps the night watch's beat (S166) a threat, and the 26% at the doors would fall mostly where townsfolk stand, not where the watch walks.
Michael: **The street as the shop: everyone by a 120° cone** (A). (10 Oct 2026)
Built: Session 705 on auto/systems (`witnessOf`, `tests/streetcone`).

### The world map — sharp at every zoom, and your quests on it (the concept artist, 2026-10-09) — DECISION #220
You asked on 5 Oct for quest markers on the overworld map, and said the map is very often blurry. The prototype (`docs/prototypes/worldmap/`, on auto/concept) is today's game (build s482) with the proposal loaded over its map, photographed as a laptop screen sees it.

Why it blurs, measured: the canvas ignores the screen's pixel ratio, so on a laptop it is drawn at half resolution (1021×433 stretched to 2042×866). The sharp tile for a province is built 12 rows a frame, one tile at a time: 54 frames each, so the 15 provinces the map opens on finish 13.5 s after Tab, and until then each is a 48-pixel tile stretched across 240–810 screen pixels. Zoomed in, nothing gets finer: at ×3.4 one tile pixel covers 5 screen pixels on a laptop.

Why the markers fail: the map keeps its own list, apart from the compass's. With four of Dunmore's jobs taken and one done, the compass shows four marks and the map three. The map has no mark for a job waiting to be reported, nor for directions, factions, the war, Corwin or Act I's givers. It shows no marks at all when the whole continent is in view, and a mark off the edge of the view is simply gone.

All three options make the map sharp: drawn at the screen's own resolution, and finer tiles as you zoom (five levels, down to 75 units a tile). Each tile is built in the middle of the view first. Until it lands, the next coarser one stands in, never the 48-pixel one.
- **A.** Sharp, and the compass's marks on the map *(recommended)*. Every quest mark shows at every zoom as a numbered wax seal: red, go there; gilt with a tick, report back; blue, directions. A mark beyond the view sits on the map's edge with an arrow and its distance. With nothing hovered, the side panel lists them under *Where your work is*, and a click centres the map on one.
- **B.** Sharp, and the compass's marks as today's yellow stars, at every zoom. No numbers, no edge arrows, no list.
- **C.** Sharp only. The marks stay as they are until the map is put on the parchment.

Recommendation: **A.** Oblivion's map shows your active quest's mark wherever you look, and Skyrim's sits on the edge when it's off the view. With four jobs near Dunmore, numbered seals stay readable where four stars sit on top of one another.

Screens: [opening, today beside A](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/worldmap/compare-settled.png) · [zoomed into Dunmore](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/worldmap/compare-town.png) · [the continent](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/worldmap/compare-continent.png) · [A, close in, marks on the edge](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/worldmap/proposed-deep.png) · [A, whole screen](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/worldmap/proposed-town.png)
Michael: **Sharp, and the compass's marks as numbered seals** (A). (10 Oct 2026)

### What guards the Root, and its name (the quest writer, 2026-10-09) — DECISION #214
The draft *The Root — the rooms beneath all the gates* (`docs/quest_drafts.md`) makes the last cavern of Act III six authored rooms: the makers' workroom, the wall where they kept count, the empty shrouds, the bench where the work stopped, and the glass, where Varek stands. Today the Root's guard is a generated foe from the deep cavern renamed *The Root — Ogre*, beside a hoard of gold and a sword.
- **A.** *(recommended)* **A maker's shape.** At the root there is no folklore for the binding to borrow, so it makes the one shape it remembers: its makers. Short, grey, arms a hand too long, script burning at the wrists, sitting at the last bench cutting the stone the makers left half-done. No hoard; a chisel. Working name *an Fíodóir Folamh*, the Empty Weaver. The risk: it looks like the Old Blood, and Varek, and an Old Blood player.
- **B.** **The uncleared.** The dead pooled at the root since Varek's etching stopped the gates: a press of undead of all three peoples, with no single master. Canon-safe (§3.1), less of a set piece.
- **C.** **As built.** The Ogre and the hoard.

If A, the name too: *an Fíodóir Folamh*, or another. Only the guard's own lines depend on this; the rest of the draft stands either way.

Michael: **A maker's shape, the Empty Weaver** (A). (9 Oct 2026)

### The pause menu on Esc — a leaf with settings, with a challenge setting, or a tab in the book? (the concept artist, 2026-10-08) — DECISION #208
You asked on 6 Oct for a proper pause menu on Esc, with Save and Load and the settings (look speed, volume by kind, brightness), and maybe a difficulty slider as in the Elder Scrolls. Today Esc in play opens nothing: in a real browser it lets the pointer go and the world plays on. The *Paused · Click to resume* box written for that moment (v62.1) never shows, because the function that shows it, `reconcilePointerLock`, is declared inside `_enterGame` and the loop's `typeof` check never finds it. The only settings are one volume button with three steps (off, quiet, loud) and M for the spoken lines. The prototype (`docs/prototypes/pause/`, on auto/concept) uses the parchment kit and today's numbers on build s477.

All three options have the same settings sheet, kept in this browser for every character, never in a save: four volume sliders (everything, music, blows and steps, spoken lines); look speed from a quarter to three times today's 0.23° a pixel; invert up and down; brightness with a three-mark test card; field of view 60–100° (75 today); damage numbers shown or hidden; full screen. A page of the keys replaces the line at the foot of the screen.
- **A.** The pause leaf. When no panel is open, Esc stops the world and opens one leaf over it, with the date, the place and six rows: Resume, Save, Load, Settings, The keys, Quit to the title. Quit asks a second time before it leaves. Every panel that closes on Esc today still does.
- **B.** A, plus a challenge setting with five steps from Novice to Master. It only changes damage: your blows ×2, 1.5, 1, 0.75 or 0.5, and the foes' blows ×0.5, 0.75, 1, 1.5 or 2. Adept is today's game. At Expert your 22 on a Skeleton becomes 17. It is kept with the world, so in co-op the host's setting rules. Foe levels, loot and gold stay as they are.
- **C.** No leaf. Settings becomes an eighth tab in the Tab book. Esc keeps closing panels, Save and Load stay behind the 💾 button, and the *Click to resume* box is mended so that a lost pointer pauses the game.

Recommendation: **B.** It is Oblivion's and Skyrim's Esc. The challenge is your "maybe", and it costs one number in the damage rule. It also gives a player who finds the new chase speed (#190) too sharp a way to ease it without changing it for everyone.

Screens: [today beside A](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/pause/compare-esc.png) · [A, the leaf](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/pause/a-pause.png) · [A, settings](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/pause/a-settings.png) · [B, settings with the challenge](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/pause/b-settings.png) · [quit asks once](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/pause/a-quit.png) · [the keys](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/pause/a-keys.png) · [C, the eighth tab](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/pause/c-hub.png)

Michael: **The leaf, plus a challenge setting** (B). (9 Oct 2026) **The challenge's rule built, Session 684** (the systems builder; `tests/challenge`): `worldState.challenge` and `setChallenge(n)`, the factors at the damage functions. The leaf and the settings sheet are still to be routed.

### A guild task that can't be done — a way to hand it back? (the systems builder, Session 675, 2026-10-09) — DECISION #217
A guild task that can't be finished can't be given back. The critic's s480 run took *Draught to Hermit's Camp* at Ironhaven: the camp has no houses, so nobody could take the draught. Session 675 stops draughts and hearths going to places with no houses, so that cause is gone for new tasks. But a save that already holds such a task is still stuck, and so is any task that breaks some other way. A guild task has no end date unless it is dated, and the hall has no topic to hand one back, so *Any work?* says *You still owe us* for ever and that guild is shut to the character.
- **A.** *(recommended)* **A topic to hand it back.** While a task is open, the guild head offers *I can't do it.* The task is taken off you with no pay and no mark against your standing, and *Any work?* gives a new one. This is Morrowind's way: a guild never holds you to a job you cannot finish.
- **B.** **Hand it back, at a cost.** As A, but the next task waits a day (*Come back tomorrow.*), so the topic cannot be used to reroll for the pay you want.
- **C.** **No topic.** Every task gets an end date like the dated commissions, and the guild takes it back when the date passes.

Recommendation **A**: smallest, and gives the player the decision. The guild head's line in each people's voice would go to the quest writer.

Michael: **A topic to hand it back** (A). (9 Oct 2026; issue #217, carried by the producer.) **Done, Session 682** (`tests/handback`): *I can’t do it.* while a task is open and not done; no pay, no mark, *Any work?* gives another. One plain line for the head's answer; the line in each people's voice is owed to the quest writer.

### The war hammer still breaks a Wolf in one swing — floor 19, or leave it? (the systems builder, Session 663, 2026-10-08) — DECISION #211
You took A on #206: the foes' posture floor is now 18, so a Wolf takes two greatclub swings to stagger, not one. My question said that at 18 no foe breaks to one normal swing of any weapon. That was wrong for one weapon: a normal war hammer swing drains 8 × 2.25 = 18, exactly the floor, so the war hammer still staggers a Wolf, a Bandit, a Goblin or a Skeleton with the first swing each time it is on its feet. The greatclub (12), the claymore and the great axe (14) do not.
- **A.** Raise the floor to 19. Every weapon takes two normal swings at least; nothing else moves (the next foe above the floor is the Forest Troll at 26).
- **B.** Leave it at 18. The war hammer is the heaviest stagger weapon (weight 7, two hands, ×2.25), and breaking the small foes in one blow is its character.

Recommendation: **A.** It is what you chose #206 for, and one number changes.

Michael: **Raise the floor to 19** (A). (9 Oct 2026; issue #211, carried by the producer.) **Done, Session 681** (`tests/posturefloor`): `ENEMY_POSTURE_FLOOR` is 19; a Wolf takes two war hammer swings to stagger.

### The cutter's and the caravel's own hulls (the look builder, Session 643, 2026-10-08) — DECISION #202

**The question.** Michael's B on #192 added two hulls, the Mark's cutter and Aurenne's caravel (Session 636, on auto/systems). Until now the cutter is drawn on the sloop's hull and the caravel on the cog's, so in the yard's *Browse ships* panel and at sea they look like the ships they replace. Should they look like this?

- **The cutter** (the fast one, thin-skinned, small hold): a deep, narrow, low hull with a near-plumb stem, tarred black above a gilt line; one tall mast stepped well forward with a topmast, a big gaff mainsail with a gaff topsail over it, a staysail to the stem and a jib out on a long bowsprit. 14 × 4.0 (the sloop's 13 × 4.4). 4,857 triangles (the sloop 4,525).
- **The caravel**: three lateen masts raked forward, the main tallest, each long yard low forward and high aft (they swing to leeward with the wind like the gaffs); a square stern under a high sterncastle of three rails with blue and gold boards; no forecastle; Aurenne's blue band and gold wale. 17.5 × 5.0 (the cog's 17 × 5.6). 6,082 triangles (the cog 5,366).

The deck you walk stays flat, the wheel and hatch where they are, the nets amidships as now (still the systems builder's stand-in; the real nets are a separate look session). A pirate or merchant flying either hull takes its own paint.

**Options**
- **A. Both as shown** *(recommended)*: each reads at a glance as its nation's ship and as a different trade: the cutter all sail on a small hull, the caravel the lateen silhouette no other ship in the game has.
- **B. As shown, but the caravel square-rigged on the foremast** (a *caravela redonda*: one square sail forward, two lateens aft), nearer the cog's family, faster-looking downwind.
- **C. Keep today's hulls, repainted only** (the sloop black with a gilt line, the cog in Aurenne's blue): no new silhouettes, nothing for the yard's stage to show.
- **D. Other.**

**What it touches.** The bakes are the look builder's (`shipBake` in `85-world-sea.js`). Two small lines are the systems builder's: `SHIP_CLASSES` takes each hull's own length and beam, and `applyShipClass` passes the class's name to `buildShipMesh` (today it picks the bake by length, so a 17.5 caravel would come out a cog).

**Pictures** (the mesh inspector, noon; the prototype is on `auto/proto-ship-hulls`):
- Today, broadside: [sloop](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/shiphulls-sloop-side.png) · [cog](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/shiphulls-cog-side.png)
- Proposed, broadside: [cutter](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/shiphulls-cutter-side.png) · [caravel](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/shiphulls-caravel-side.png)
- From above: [cutter](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/shiphulls-cutter.png) · [caravel](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/shiphulls-caravel.png) · [the caravel's sterncastle](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/shiphulls-caravel-stern.png)
- Other paints: [a pirate cutter](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/shiphulls-cutter-pirate.png) · [a merchant caravel](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/shiphulls-caravel-merchant.png)

Michael: **Both as shown** (A). (8 Oct 2026)

Built, Session 665 (the look builder): both hulls in `shipBake` as the prototype showed them; your own ship takes her class's hull from `worldState.ship.cls`, so nothing more is owed from the systems builder for her (other ships still go by length).

### A Wolf is staggered by every second greatclub swing — raise the posture floor? (the systems builder, Session 650, 2026-10-08) — DECISION #206
The critic's s477 play: three Wolves against a level-2 greatclub cost 9 of 200 HP in 30 s. A foe's posture is half its health, scaled by family (wolves and spiders ×0.8 and ×0.7), with a floor of 10. A Wolf (18 HP) sits on that floor. A normal swing drains 8, and the greatclub drains ×1.5, so 12. One normal greatclub swing breaks a Wolf: 1.5 s staggered, taking double damage. Its posture refills when it gets up, so every second swing staggers it again, and the pack spends most of the fight on the ground. A sword (8) takes two swings, fists two. The Snow Wolf (14) and the Dire Wolf (16) take two greatclub swings each.
- **A.** Raise the floor to 18, so that no foe breaks to one normal swing of any weapon. A Wolf takes 2 greatclub swings or 3 sword swings; a Bandit (15 today) is lifted to 18. Every foe over 36 HP is unchanged.
- **B.** Beasts get up quicker: wolves and spiders are staggered 0.6 s, not 1.5 s. The floor is unchanged, so the greatclub still breaks a Wolf every second swing, but it is up before you can follow it with more than one blow.
- **C.** Both A and B.
- **D.** Leave it. The greatclub is the slow stagger weapon (blocks 40%, 4 weight), and a pack's answer is to flank you.

Recommendation: **A.** The brief asks for weighty combat at Dragonwilds' difficulty, and a staggered foe should be a reward you earn, not the state the weakest foes live in. One number changes, and a Wolf still breaks in two greatclub swings, which keeps the weapon's character.

Michael: **A, raise the posture floor to 18** (8 Oct 2026, on the issue). Built in Session 663 (`ENEMY_POSTURE_FLOOR`, `10-player.js`; `tests/posturefloor`). Correction to the question: A said no foe would break to one normal swing of any weapon, but the war hammer drains 8 × 2.25 = 18, so it still breaks a foe on the floor in one swing; the follow-up is DECISION #211 below.

### The HUD — the wide compass, a ledger and damage numbers (the concept artist, 2026-10-07) — DECISION #198
You asked on 6 Oct for a bigger, clearer compass, fewer callouts at the bottom centre with damage numbers in their place, and a HUD that doesn't look dated. The prototype (`docs/prototypes/hud/`, on auto/concept) keeps the places you chose on 27 Sep (vitals bottom-left, compass bottom-centre, minimap top-right) on the parchment kit. Under every option the compass is three times as wide (600 against 200) with marks as icons on paper discs: crowded marks join into one with a count, and the one you face is named on a ribbon with its distance. Every option also puts damage numbers at the foe's head, coloured by kind.
- **A.** The rest of the bottom centre moves to a ledger above the vitals: up to four lines, each gone after six seconds. Combat lines stop, because the numbers say it.
- **B.** A, and the HUD clears itself at rest: out of a fight with all three bars full, the vitals and the ledger fade (Skyrim's way).
- **C.** The numbers and the compass only. Every other line stays at the bottom centre, one at a time, on a paper slip.

Recommendation: **A.** Oblivion keeps its vitals in view, and the ledger gives the quest and pickup lines somewhere to stand without covering the compass. (Carried by the producer from docs/concepts.md.)

Michael: **A ledger above the vitals; combat lines stop** (A). (7 Oct 2026)

### The save register — saving and loading on the parchment (the concept artist, 2026-10-06) — DECISION #199
Saving and loading are the last of the main panels on today's dark style. The prototype (`docs/prototypes/saves/`, on auto/concept) puts them on the parchment with two characters' real saves. Under every option the menu keeps today's rules: eight slots and five autosaves a character, a second press to load or write over, the two exports.
- **A.** The register: your characters down the left, the chosen one's saves on the right, newest first, each dated in the calendar's words, its place, level and gold. No rule change.
- **B.** The register with a picture: as A, and each save keeps a small picture of where you stood (about 15 KB a save), shown on its row and large beside the list. One small change: the picture is taken as the save is written.
- **C.** Restyle only: today's one scrolling column on the paper, the same groups and words.

Recommendation: **B.** Oblivion's load screen is a picture and a line, and a picture finds the day you want faster than *Lv5 · Dunmore* six times over. (Carried by the producer from docs/concepts.md.)

Michael: **The register with a picture of each save** (B). (7 Oct 2026)

### The ship in hand — what fills the log's dial: today's ships, two new hulls, or new hulls and a laden ship slower? (the designer, 2026-10-07) — DECISION #192
Your 6 Oct sailing notes are written up on one page (`docs/design/the-ship-in-hand.md`): a log dial of 0–30 knots at the helm with the sloop's 7.5 at a quarter, boarding nets climbed with the crosshair on them (the 3.5-unit radius goes), a *Browse ships* panel with the hull turning on a stage, and a factor's panel that fills the hold with crates you can see on deck, all lost if she sinks (reversing Session 413, where the hold came up with her). Those follow your note under every option; the open question is what fills the dial, since a meter that implies faster ships needs them to exist.
- **A.** Today's three hulls (best 13.1, 44% of the dial); the top half is the far continents' yards, empty until the expansions. Four Opus and two look sessions.
- **B.** Two new hulls, each a trade and each sold on one island (the Mark's cutter 12 bare, 80 hull, 25 hold; Aurenne's caravel 11, 130, 55), sails as +12% a tier with a fourth tier, refits branching; the best home hull reaches 17.8 (60%), the last third the far yards'. A plus one Opus and one look session.
- **C.** B, and a laden ship is slower: a full hold takes 15% off her top speed, shown as a shaded arc on the dial. B plus half an Opus session.

Recommendation: **B.** The dial is honest with ships that exist, and no hull is simply best: the choice of ship is a choice of what kind of sailor you are, and a reason to cross to the Mark or Aurenne. C can follow when the cargo prices are next tuned.

Michael: **Two new hulls, each sold on one island**. (2026-10-07)
Built (the hulls' rules): Session 636, `tests/shiphulls`. The page's *the difference less a third* is read as two thirds paid back on a trade down; a refit up pays the difference in worth, as the ladder always did.

### Lockpicks more common as loot — how many? (the systems builder, Session 623, 2026-10-07) — DECISION #191
Your playtest of 6 Oct asked for lockpicks to be more common, especially in dungeons. Today a chest or treasure chest rolls three picks at weight 12 of 127 (about 1 roll in 10), an urn one or two picks 15% of the time, and a corpse never. Session 363 counted eight dungeons: 59% of chests are locked, 5–6 locks a dungeon, and a clear costs about 2 / 5 / 13 picks for a hand that misses 1 in 10 / 1 in 5 / 1 in 3, against the 1–2 picks the dungeon's own chests hold. A pick costs 12 gold and nobody starts with one.
- **A** — Dungeons pay for their own locks at an average hand. The chest and treasure weight goes 12 → 30, and a humanoid foe's body (bandit, kobold, skeleton, goblin) holds 1–2 picks a quarter of the time. That makes about 5 picks a dungeon, so an average hand clears it and a clumsy one still buys some. **Recommended.**
- **B** — A starting set. Every new character carries 5 picks, with A's chests but no picks on bodies.
- **C** — Double what there is: chests 12 → 24, urns 15% → 30%. About 3 a dungeon.
- **D** — A's numbers in dungeons only. Overworld chests and barrels stay as they are.

Michael: **Chests and bodies: about 5 picks a dungeon**. (2026-10-07)

*Built, Session 633 (the systems builder, `tests/lootpicks`):* chests and treasure chests roll three picks at weight 30, as A says. The bodies' quarter was A's means to about 5 a dungeon, counted on a handful of humanoid dead; eight of the world's dungeons hold 17 on average (Moumfeirey Charnel 40 skeletons, the Barrow of Woushdaey 20 skeletons and 20 goblins), so at a quarter they add 6.4 picks to the chests' 4.9, about 11 a clear. Built at one body in twenty instead (1–2 picks, keyed on the corpse), which adds 1.3: about 6 a clear. If you meant the quarter whatever the total, it is one number (`PICK_BODY_ODDS`, `14-items.js`).

### Foes' chase speed and sight — how much faster, how far? (the systems builder, Session 622, 2026-10-07) — DECISION #190
Michael's playtest of 6 Oct: "You outrun everything after a level or two" and "foes' detection is weak". Both are numbers, so they are yours. Today you walk at 3.83 units a second and sprint at 4.69. An alert foe in the open chases at 1.25–2.0 (a Skeleton 1.25, a Wolf or Troll 2.0); in the dungeon at 0.37–1.2. Only the bosses keep up (the Faolchú 4.0, its lessers 5.0). A foe in the open sees you at 15 units in a 150° cone in front of it (10.5 sneaking), hears you only at 0.5; in the dungeon it sees 3.5. A wandering foe's cone never turns with its walk: it looks the way it was spawned.
- **A** — Chase near your walk: alert foes chase at 85–110% of your walk (beasts at the top, the slow dead and the heavy at the bottom), so walking away fails and a sprint escapes slowly at a stamina cost. Sight 20 in the open, 8 underground, the cone turns as they wander, hearing 3 units walking (1 sneaking). **Recommended**: it makes a chase a threat without making every foe a wolf.
- **B** — Only the beasts are fast: wolves, bears and spiders run at 110% of your walk, everything else as now. Sight as A.
- **C** — Slow the player instead: walk 3.0, sprint 4.2, foes as now with A's sight.
- **D** — Leave the numbers; fix only the wandering cone and the hearing.

*Session 628:* the wandering cone is fixed, since all four options include it: a wandering foe in the open faces the way it walks and sees that way (`tests/wanderface`). The chase speeds, the sight ranges and the hearing are still yours.

Michael: **Chase near your walk; sharper sight and hearing**. (2026-10-07)

*Built in the open world, Session 634 (`tests/chasesight`):* an alert foe chases at 85–110% of your walk, placed by its own speed (a Forest Troll 3.26, a Skeleton 3.48, a Bandit 3.62, a Wolf 3.92, an Ash Hound or Dire Wolf 4.14); sight 20; hearing 3 walking and 1 sneaking, in the dungeon too. Standing still you are heard only at 0.5, as before. The dungeon's chase and its sight of 8 follow.

*Built underground, Session 635 (`tests/dungeonpace`):* the same band on the dungeon's own table, read from the foe's own speed and not the difficulty's (a Golem 3.26, a Slime 3.39, a Cave Troll 3.41, a Skeleton 3.81, a Kobold Thief 4.14, a Goblin 4.21); sight 8. All of A is built.

### The wolves and the cave bear — a fiercer face, a heavier build, and how large? (the look builder, Session 620, 2026-10-07) — DECISION #187
Michael's two mesh-inspector notes of 6 Oct: the wolves are far too small, slender and comical, and the cave bear should sit on par with a grizzly beside them. Measured first, against a bandit's height: in play a Wolf's back stands at 38% of a man's height, a Snow Wolf's 46%, a Dire Wolf's 49%, and the Cave Bear's hump at 77%. A real grey wolf is about 45% and a grizzly about 60–65%, so in play the bear is already grizzly-sized; but the mesh inspector builds every beast at size 1 rather than its size in play (the dragon was fixed the same way in Session 524), so there the wolf looks bigger than in play and the bear only a little larger than the wolf. The prototype (`docs/prototypes/wolfbear/shoot.mjs`, which patches a copy of the wolf's bake; the game is not changed) gives the wolves a new head and build and new sizes:

- **The face**: a longer, lower skull; a brow ridge frowning over small slanted eyes (no round pupils, which made them look googly); a deeper muzzle with a nasal bridge into the forehead, a dark lip line and the four canines showing; smaller ears laid back; the head carried a little below the back, stalking.
- **The build**: the chest a fifth wider and deeper, a thicker neck, the lower legs and paws 30% thicker, the ruff fuller, a line of raised hackles along the back in the saddle's colour. About 10% more triangles (5,754 → 6,314 a wolf).
- **The sizes**: Wolf 1.05 (back at 56% of a man, was 38%), Snow Wolf 1.15, Dire Wolf 1.35 (73%, was 49%), Ash Hound 1.0, Cave Bear 1.55 (its hump at 88% of a man, was 77%), so the bear still stands clearly over the largest wolf.

Pictures: [line-up today](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/wolfbear-lineup-today.png) · [line-up proposed](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/wolfbear-lineup-proposed.png) · [heads today](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/wolfbear-heads-today.png) · [heads proposed](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/wolfbear-heads-proposed.png) · [a pack coming at you, proposed](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/wolfbear-pack-proposed.png) · [bear today](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/wolfbear-bear-today.png) · [bear proposed](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/wolfbear-bear-proposed.png)

**Options:**
- **A.** *(recommended)* All of it as shown: the new face and build, and the new sizes. The inspector shows each beast at its size in play.
- **B.** The new face and build, at today's sizes, with only the inspector fixed to show the size in play (in play a wolf stays a real wolf's size, the bear a grizzly's).
- **C.** The sizes only, today's face.
- **D.** Other (say which part to change).

**Recommendation: A.** A wolf at a real wolf's size reads small on a screen, beside a man in armour, and the brief asks the wild to be dangerous; the face was the larger part of "comical". The size is only how the beast is drawn: its reach and hits are not read from it, so a bigger wolf bites from the same distance. Whether the bite should reach further with the size is the systems builder's call after this one. The size numbers live in the foes' table (`42-zone-enemies.js`, one number per kind).

Michael: **All of it: new face, build and sizes**. (2026-10-07)

Done, Session 632: the face, the build and the hackles (fewer and lower on the lean Ash Hound) on every wolf kind in `wolfBakeQ`; the sizes in play Wolf 1.05, Snow Wolf 1.15, Dire Wolf 1.35, Ash Hound 1.0, Cave Bear 1.55 (`42-zone-enemies.js`), and the inspector shows each at that size (`WOLF_KINDS[…].play`). At the larger sizes a dead wolf came to rest standing more often, so the ragdoll's tip was widened. `tests/fiercewolf`; pictures `docs/prototypes/wolfbear-built-lineup.png`, `-heads.png`, `-pack.png`.

### Unblock the design docs (the ship in hand page) — merge anyway? (the producer, 2026-10-07)
The designer's PR #193 adds only two docs; its CI failed twice on game tests on shard 7 (restslip, then q7world) against main's unchanged code.
- **A.** *(recommended)* Merge anyway (docs only): ea2aaea onto main; the shard-7 flakes go to the backlog for a builder.
- **B.** Wait for the designer's next push to re-run CI.

Michael: **Merge anyway (docs only)**. (2026-10-07)

### Main's CI is red on 9ecc10d — saveui and lod again (the producer, 2026-10-07)
Main's own check failed on 9ecc10d, a docs-only merge: `saveui` on shard 3 and `lod` on shard 1; the other suites passed. Both have failed this way on unchanged code before and passed on a re-run. The next main run (759200d, the quest drafts, docs only) is the re-check.
- **A.** *(recommended)* Treat them as flakes; approved branches merge under their own green CI, and the systems builder makes `saveui` and `lod` sturdy on a slow runner.
- **B.** Hold code merges until main is green on its own.
- **C.** Re-run the failed shards and decide again.

Withdrawn by the producer: main's own check passed on all eight shards at 6ea6f47 (05:19Z run), so no call was needed; the same two flaky suites (`lod`, plus `shoresave`) failed on auto/systems b67812f and stay with the systems builder. (2026-10-07)

### The Journal on the open book — Told by person and place, by question, or one sheet? (the concept artist, 2026-10-06) — DECISION #183
The Journal you chose on #132 (C) is in the game (Sessions 486–511, on main since the merge of Systems 485–563): By day, By quest, Topics, Due, lines of your own, names that link. It works in today's dark style. The prototype puts it on the approved kit and on the open book chosen for reading (#116), using four days of real play on that build. Under every option each quest event shows one line, not two (today *Quest: First Blood* sits beside the quest's own words, and *…: 56 gold.* beside *Turned in to Mayor Niamh: 56 gold.*). Prototype: `docs/prototypes/journal/` on auto/concept.
- **A.** The open book, with Told filed by who and where *(recommended)*. Four chapters sit on ribbons at the fore-edge: Chronicle, Quests, Told, Due. The Chronicle runs oldest first, opens at its last page and puts the hour in the margin; your own lines are in a second ink. Quests: an index, with the open quest's own words beside it. Told: a page a person (*Ruairí, innkeeper, Dunmore*) and a page a place; quest talk and a sale's yes are left out. Due: the month as four weeks of seven named days, the feasts and what is owed. One small rule change: `journalTold` keys by speaker or place, not by the question.
- **B.** The open book, with Told as built: filed under the question asked (*Who are you?* holds eight lives; *Yes. 11 gold.* is a topic).
- **C.** One sheet in the hub: the four views as sub-tabs, two columns, newest first, scrolling.

Recommendation: **A.** It is Morrowind's book, as you asked, and the book you already chose for reading. Morrowind's index files by name; filing by question turns the index into a list of the questions you can ask.

Screens: [today beside A](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/journal/compare-chronicle.png) · [A, Chronicle](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/journal/a-chronicle.png) · [A, Quests](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/journal/a-quests.png) · [A, Told](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/journal/a-told.png) · [A, Due](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/journal/a-due.png) · [B, Told by question](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/journal/b-told.png) · [C, one sheet](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/journal/c-sheet.png)

Michael: **Open book; Told filed by person and place** (A). (2026-10-06)
Built (the filing): Session 654, `tests/toldpages` — Told keyed by the speaker (or the place, for *What is this place?*), quest talk and a sale's yes not filed, an index by town and a page each in today's style. Owed: the open book itself (leaves, ribbons, one line per quest event in the Chronicle, the Due month).

### The cavern master's slam: dead outright bare, 2 in armour (the systems builder, Session 610) — DECISION #181
**The question.** The cavern master's slam (Session 404, your A on #95) was owed *the damage, by play*. Session 610 measured it in 18 real lair caverns at levels 1–20 (`tests/slamdamage`). Nothing was changed. The numbers do not make a fight at either end:

- **Bare, from level 3, every slam kills outright.** A master's blow stacks five multipliers: its kind (a Cave Troll 4.4), the lair's difficulty, which follows your level (×0.45 at 1–2 up to ×2.0 from 15), the second floor (×1.5; all 18 masters stood there), the level scale (to ×2.0) and the master's own 1.6 × (1 + level × .04). A Cave Troll master is ×8.9 at level 3, ×37 at 10 and ×91 at 20. Its slam does 178–356 at level 3 against 120–170 health, 738–1,474 at level 10 against 190–310.
- **From 40 armour every slam is 2, at every level.** Armour comes off before the multiplier, half a point a point, from a roll of 10–20, and the result is floored at 1. So 40 armour takes the whole roll, and the blow is 1 whatever the master (2 for the slam). A full heavy kit is 18 in Iron, 30 in Steel and 58 in Adamant. The cliff is between 20 and 40. At level 10 the Cave Troll's slam averages 1,102 bare, 747 at 10 armour, 351 at 20, 103 at 30 and 2 at 40.

The same flat subtraction is in every dungeon foe's blow (`74-strikes.js`), so the cliff is not the slam's alone. But the slam is where it shows worst, because it is meant to be the blow you must step out of.

**Options.**
- **A. Leave it.** The slam kills a bare or lightly armoured player and is nothing to a well armoured one.
- **B. Armour takes a share, not a flat amount, for every dungeon blow.** For example, damage × 50 / (50 + armour), so 50 armour halves a blow and nothing ever reaches 1 by armour alone. Then retune the stack so a kit of your level leaves an ordinary blow at a tenth of your health. This is the larger change and belongs with the attack table (backlog C, B's Fable session).
- **C. The slam alone: a share of your health.** It lands for 45% of your max health, 60% bare-chested (no chest piece), whatever the master and the armour. It still goes through any block, and a roll or a step out still takes nothing. Two slams in a row kill only if you heal neither time. Ordinary blows are untouched. One Opus session.
- **D. Trim the stack for the master.** Drop the master's level term (a flat 1.6) and the second floor's ×1.5 on it. This halves the bare numbers at level 10 but leaves the cliff at 40 armour.

**Recommendation: C now,** because it makes the slam the thing you chose: a blow you must not stand under, the same at level 3 and 20. Then put B to the attack table's session, since the cliff at 40 armour is every dungeon foe's.

Michael: **The slam alone: 45% of your max health** (C). (2026-10-06)

Built, Session 617 (`slamBlow`, `74-strikes.js`): the slam lands for 45% of your max health, 60% with no chest piece, whatever the master and the armour; a ward still takes its share; block, roll and the ring as before. `masterslam` 16/16 and `slamdamage` 6/6 check it. B (armour as a share for every dungeon blow) stays with the attack table.

### Main's CI is red on 6b01495 — saveui and a shard timeout (the producer, 2026-10-06)
Main's own check failed after the look merge (6b01495): saveui could not save to an empty slot on shard 3, and shard 5 ran out of time. saveui passes on auto/backlog, which carries all of main's code. A: a flake, let the re-run settle it; if saveui fails twice, the systems builder hardens it. B: the systems builder fixes saveui next run whatever the re-run shows.

Michael: **Flake: let the re-run settle it** (A). (2026-10-06)

The re-run (run 37502634335, attempt 2): saveui passed and shard 5 passed; shard 3 failed on parryclock alone (37/38), the frame-rate suite already red on auto/backlog, which the look builder is fixing.

### Unique artifacts — placed relics, the Makers' six tools, or seam relics from the lairs? (the designer, 2026-10-06) — DECISION #175
You asked for a few unique items, Daedric-artifact style, woven into the lore, some plainly visible behind a check (Might 30 to pull a sword from a stone); today the Faolchú's Mark is the only one. The page (`docs/design/unique-artifacts.md`) fixes the frame under every option (one of each per world, placed by the seed, unsellable, a failed check costs nothing and goes in the journal, checks move to skills at 50 when that build lands) and asks what an artifact is.
- **A.** Placed relics: eight objects in plain sight, each behind one attribute at 30, a tier-6 enchant and one special rule; a rumour each, no quest (2 Opus).
- **B.** The Makers' tools: one per god (Stone, Sea, Sky, Beasts, Hearth, Weaver; none for the Guest), each found by a trial in its god's manner, each changing how you play, each with a cost, and each wanted by a faction who will pay you to give it up; the Gate-Blade is your sword in the stone at Might 30, and the Wolf-Mother's Cloak is the named cloak (5 Opus, 1 look, 2 quest-writer runs).
- **C.** Seam relics: every lair master, dragon and Act II burn leaves a named relic with one signature, like the Faolchú's Mark (2 Opus).

Recommendation: **B.** Taking the artifact is the decision (keep it and carry its cost, or hand it to its claimant), and one of them, the Beasts' cloak, leaves a town poorer on the map; A is B's first slice anyway, and C is loot with a name on it.

Michael: **The Makers' six tools, one per god** (B). (2026-10-06)

### The dungeon's passages (the look builder, Session 577, 2026-10-06) — DECISION #174
On 5 Oct you said "dungeons are very narrow and cramped — I think we can open them up a bit more and make them less claustrophobic." Here is why they feel that way, and one way to open them up.

**What is wrong.** A dungeon is laid out on a grid of one-unit cells. Every corridor is one cell wide, so you walk a passage about as wide as your shoulders, under a roof 3.2 high. Seen ahead, it is a slot between two walls that fill the screen (pictures one and three). The rooms, three to ten cells across, are fine; it is the passages between them that close in.

**The prototype** (pictures two and four: the same dungeon, seed 4031, in the same corridor from the same two places). Every corridor is two cells wide. The rooms, their places and the turns between them are unchanged; only the passages open out. It now reads as a passage you could fight in, not a crack you squeeze through. The prototype is on the branch auto/proto-dungeon-wide, and nothing in the game has changed.

- **A. Every corridor two cells wide, as shown** *(recommended)*. A door would sit in a narrowed stone doorway one cell wide, so doors, locks and keys work as now. A swinging blade would span the wider passage (#170).
- **B. A, and every room one cell larger each way.** More open still, but a floor holds a few fewer rooms, or the maps grow by about a fifth.
- **C. The whole dungeon at one and a half times the scale.** Corridors 1.5 wide and rooms half as large again, under the same roof. This touches every system that counts in cells (foes, traps, the stair, the map, saves), so it would be a Fable session, not a contained one.
- **D. Leave them as they are.**

**Recommendation: A.** The brief asks for fluid, weighty combat. A sidestep or a roll needs room to the side, and a one-cell corridor has none: every fight in a passage is a straight line. Two cells gives that room without changing what a dungeon is.

This is the last part of your 5 Oct note. The railings were fixed in Session 572, the traps are DECISION #170, and the stairs are DECISION #173.

Pictures (today and the prototype, from the corridor's mouth looking in, then from its far end looking back):
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/dungeon-wide-today-run.png
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/dungeon-wide-proto-run.png
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/dungeon-wide-today-mouth.png
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/dungeon-wide-proto-mouth.png

Michael: **The whole dungeon at 1.5 times the scale** (C). (2026-10-06) — a Fable session, as the option says; the producer proposes its card.

### The forts' interiors (the look builder, Session 584, 2026-10-06) — DECISION #177
On 5 Oct you said the forts and their dungeons are "still a little bland. I think we need to incorporate stairs going up and/or down, but straight stairs, not spiral. I also think we need more varied layouts on the interiors. I'm willing to get a little funky/creative with them." Here is why they feel the same, and three shapes they could take.

**Why they feel the same.** A fort has three layouts (the tee, the linear and the courtyard; top row of the picture, from the game's own generators). All three are one long passage with square rooms off it, the treasure rooms at the far end, and the spiral stair down in the last room. Walking in, you can't tell which one you are in. Nothing goes up: the second floor is always below the first, five down.

**The proposals** (bottom row, drawn by hand, smaller than they would be built). Each is built around a room you would remember, with straight flights in place of the spiral:
- **A. The hall and the undercroft.** A pillared great hall, with a straight flight down its middle to the vaults. A kitchen and stores on one side, the armoury and a chapel on the other.
- **B. Barracks and the gaol.** Two rows of bunk rooms off one long, wide room, and at its end a flight down to a gaol of cells.
- **C. The ring and its towers.** A ring of passage round a sunken yard that you see over a rail before you can reach it. Each corner tower holds a short flight, two going down and two going up.

How the stairs look is DECISION #173, and how wide the passages are is #174. This question is the shapes and where the stairs go.

- **A. All three shapes, down only** *(recommended)*. Each fort's seed picks one of the three (or of six, if today's stay as well). Every stair is a straight flight down to the floor below, which the game already has. One shape a session, the hall first.
- **B. The shapes and stairs up as well.** A floor above as well as below, for the towers and galleries. The dungeon has only ever had a floor below, so this is a larger job (a Fable session) before any shape.
- **C. Today's layouts, with a straight flight in place of the spiral.** The smallest change. The forts stay one passage with rooms off it.
- **D. Something else.** Mark what to change on the picture, or name a fort you have in mind.

**Recommendation: A.** The brief asks for places that feel different. A remembered room in each fort (a hall, a gaol, a ring round a yard) does that more than more rooms off the same passage. Straight flights down fit the two floors the game already has, so the first shape can be built next session. Stairs up can follow as their own question once the shapes are in.

Picture (top: today's three; bottom: the three proposed):
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/fort-layouts.png

Michael: **Three new shapes, stairs down only** (A). (2026-10-06)

Under way. Session 599 built the first shape, the hall and the undercroft (`makeFortHall`, `buildFlight`; pictures `docs/prototypes/forthall-*.png`). Until the barracks and gaol and the ring are built, a fort's seed makes half the forts halls, and the others keep today's layout. When all three are in, the seed picks among the three. Today's three layouts stay only if you say so (the six-way pick).

Session 600 built the second shape, barracks and the gaol (`makeFortBarracks`; pictures `docs/prototypes/fortbarracks-*.png`). For now a third of the forts keep their own layout, a third are halls and a third barracks.

Done, Session 601: the ring and its towers (`makeFortRing`; pictures `docs/prototypes/fortring-*.png`), with two of its four towers holding a flight down and two as guardrooms, since stairs up was not chosen. Every fort of medium size or larger is now one of the three shapes, picked by its seed (the eight named forts: five halls, two barracks, one ring). Today's three layouts remain only for small forts, which have no floor below. Keeping them in the pick as well, the six-way option, is one line if you want it.

### The dungeon's stairs (the look builder, Session 576, 2026-10-06) — DECISION #173
On 5 Oct you said the dungeon's "staircases are ugly and don't match the style at all". Here is why, and one way to fix it.

**What is wrong.** The spiral stair down to the second floor is built from plain boxes. It has pale plank treads and a thin board riser under each one, round a smooth wooden post, with thin rail posts and a rail. The shaft round it is four flat, near-black planes. Everything else in a dungeon is the shell's stone: walls laid in courses, a cove at the foot, worn floors. The stair is the one thing in the room that looks like a different game (pictures one and three). It is also 117 separate meshes.

**The prototype** (pictures two and four, the same stair from the same places). It is a stone newel stair, as in a castle tower, in the dungeon's own stone. Each tread is a wedge of stone running from a central column to the wall, with a bevelled nosing. Each is thick enough that the underside steps down the spiral, which is what you see from below. The column is a stack of stone drums, one per step. The shaft walls are laid in courses of the shell's stone instead of black planes. A rope handrail runs round the wall on iron brackets, and the landing is a stone slab. The stair's shape, its two turns and where it lands do not change, so climbing it does not change. The prototype is on the branch auto/proto-dungeon-stairs; nothing in the game has changed. Built for the game, it would be one merged mesh like the shell, about 10,800 triangles.

- **A. The stone newel stair, as shown** *(recommended)*. The forts' straight staircase would follow in the same stone, in a second session.
- **B. Stone, with today's open rail of posts** in place of the rope at the wall.
- **C. Keep the wooden stair, tidied.** Dark heavy timber in the theme's colour, the treads joined into one flight, stone shaft walls. Less of a change; still wood in a stone place.
- **D. Something else.** For example, a straight stone flight down along one wall instead of a spiral, which changes the layout and so is a larger job.

**Recommendation: A.** The brief asks for a world that feels made, and every other surface in a dungeon is now the same worked stone. A stone spiral round a newel is how a real tower or undercroft goes down, and from the floor below it reads as solid masonry instead of a stack of planks.

This is another part of your 5 Oct note. The railings were fixed in Session 572, and the traps are DECISION #170. Wider passages is the last part, and its question comes next.

Pictures (today and the prototype, from the room above, then from the floor below looking up):
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/dungeon-stair-today-above.png
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/dungeon-stair-proto-above.png
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/dungeon-stair-today-up.png
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/dungeon-stair-proto-up.png

Michael: **The stone newel stair, as shown** (A) — Go with this but it looks like the rail for the staircase is floating/ it is not attached to the stairs at any point. I would like for that to be corrected.

It also appears that the wooden crossbeams on the ceiling of the basement overlap with part of the staircase, which is not ideal. (2026-10-06)

Done, Session 598: the stair is the prototype's stone newel stair in the game, two merged meshes (the stair, the shaft) in place of 117 boxes. The rope is carried on an iron stanchion from every other tread, with a post and knob at each end, so it is fixed to the stair all the way down, including below the shaft where there is no wall. Floor 2's ceiling beams stop short of the shaft. Pictures: `docs/prototypes/dungeon-stair-built-above.png`, `dungeon-stair-built-up.png`.

### Main's CI is red on flaky suites again — interiors and yardplay (the producer, 2026-10-06)
Main's check went red twice with only docs merged since the last green run: interiors on d7ee735, yardplay on 3152db7 (the test talked to Osric instead of Captain Rowe). A: treat interiors and yardplay as flakes (a branch whose only red is one of these, after one re-run, still goes ready), and the systems builder hardens yardplay by picking Rowe by name. B: hold merges until main is green.

Michael: **Treat interiors and yardplay as flakes** (A). (2026-10-06)

### The old gates' look in the overworld (the look builder, Session 571, 2026-10-06) — DECISION #169
You asked on 5 Oct for a full pass on the old gates in the overworld (the Crypt of Embers and the rest): "very very jumbled and ugly looking." Here is why they look that way, and one way to fix it.

**Why they look jumbled.** Every cave-type gate is built the same way. Three rough boulders lean together, with a capstone laid over them. A small plank door stands in the gap, under a lintel thinner than the boulders. Then a few things are dropped around it by the gate's seed: a broken column, a dead tree, hanging chains, rocks. Nothing lines up with anything else, so the door reads as a crate wedged into a rock pile (first picture). The forts (Greywatch, the Old Garrison and their kind) are built separately, and this question does not touch them.

**The prototype.** One shared form for every old gate. A dressed-stone doorway is cut into a turf mound. Two jambs and a heavy lintel frame it, with a capstone stepped over the lintel. Wing walls step down to hold the mound back, and worn steps lead down into the dark. The binding marks are cut down both jambs and in a ring on the lintel, and they glow in the gate's theme colour: ember orange for the Crypt, green for a haunted gate. A ring of marker stones stands about nine units out, each with one mark facing the door. Put together, it says *something is held here* before you read a word, which is what the canon says the gates are: anchor places with binding inscriptions. The prototype is on the branch auto/proto-old-gates. It is about 70 boxes, and none of it is in the game yet.

- **A. One shared form, as shown** *(recommended)*. Every cave-type gate gets this doorway, with the theme's colour on the marks and the seed varying the details: the mound's size, which marker stones have fallen, moss, how worn the steps are. The current random clutter goes.
- **B. One form per theme.** The crypt gets a mausoleum front, a haunted gate a barrow with a sunken door, a deep gate a cave mouth with a carved frame, an elemental gate a scorched stone portal. This gives more variety, but the gates stop reading as one family, and it is four builds instead of one.
- **C. Keep today's dolmens and tidy them.** The boulders stop overlapping, the door is set properly into the gap, and the random clutter is placed apart from the door. This is the smallest change. It is still a rock pile with a door.
- **D. Something else.** Mark what to change on the pictures.

**Recommendation: A.** The gates are the game's name and its story's spine. A single, recognisable form lets a player spot one across a field and know what it is, and the theme colour and the seed's details keep two gates from looking the same.

Pictures (today's Crypt of Embers; the prototype in the Crypt's colour, in a haunted gate's green, and at night):
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/oldgate-today.png
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/oldgate-proto-ember.png
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/oldgate-proto-haunted.png
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/oldgate-proto-night.png

Michael: **One shared form, as shown** — Yeah this looks better, but the doorway itself doesn’t look like a door - the mesh from the grassy hillock that’s part of it is bursting through the doorway. (2026-10-05)

Done, Session 581: every cave-type gate is the one form (`buildOldGateFront`, `24-forts.js`). The mound's front is cut flat behind a stone headwall for three either side of the door, so no turf can stand in the doorway, and a heavy two-leaf oak door on iron straps fills it, set back in the reveal. Today's rocks and the seeded clutter are gone. Pictures: `docs/prototypes/oldgate-built-*.png`.

### The dungeon's swinging blades (the look builder, Session 573, 2026-10-06) — DECISION #170
On 5 Oct you said the dungeon's traps are "awkward and rarely oriented properly … swinging axes scrape along the same wall, doesn't look like it would touch the player whatsoever." Here is what is wrong, and one way to fix it.

**What is wrong.** A swinging blade hangs from the roof in the middle of a corridor cell and swings *along* the corridor. Its flat side faces the walls. Walking up the corridor towards one, you see it edge-on: a thin line moving towards you and away (first picture, mid-swing, where the blade is nearly invisible). Its lowest point is 1.3 above the floor, and it hurts you whenever you stand within 0.7 of its cell near the bottom of the swing, wherever the blade actually is. So it neither looks like it will hit you nor hits you where it looks.

**The prototype** (pictures two and three, the same corridor). A crescent blade on a longer arm swings *across* the passage, edge first. The bottom of its arc is at the waist (0.95), and it passes into the walls at each side, as if through slots cut for it. You watch it cross in front of you and time your run between swings, as in Prince of Persia or Tomb Raider. The prototype is on the branch auto/proto-dungeon-traps. Nothing in the game has changed.

- **A. Across the passage, as shown** *(recommended)*. The blade swings across, lower, and it only hurts you when it actually reaches your spot in the corridor: the systems builder's hit rule follows the blade's arc, so you can slip through between swings. Spike plates stay as they are.
- **B. Across the passage, the hit as today.** Only the look changes, which is quicker but still unfair: you could be cut while the blade is clearly away to one side.
- **C. Along the corridor, but lower and on the hit's beat.** Today's direction, with the blade at the waist and a hit that follows it. You would still see it edge-on as you come at it.
- **D. Something else**, such as scything blades from the wall, or no swinging traps at all.

**Recommendation: A.** A trap is a timing test, and the brief asks for fluid movement and weighty timing. A blade you can see crossing your path, and slip past, is the fair version of that test.

This is one part of your 5 Oct note. The jumbled railings were a bug, fixed in Session 572. The stairs' style and wider passages are their own questions, to come.

Pictures (today, mid-swing; the prototype mid-swing and at the side of its swing):
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/dungeon-trap-today-swing.png
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/dungeon-trap-proto-mid.png
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/dungeon-trap-proto-swing.png

Michael: **Across the passage, as shown**. (2026-10-05)

Done, Session 582 (the look): the crescent blade swings across the passage into a slot in each wall, the bottom of its arc at .95 (`buildSwingBlade`, `68-dungeon-misc.js`). On the way it was found that every trap stood on its cell's corner, at c+.5, which put a blade in the line of a wall; traps now stand at their cell's centre. The hit that follows the blade is the systems builder's Session 580.

### Two houses of one name in a town — must a house's name be its own? (the systems builder, 2026-10-06) — DECISION #171
A home is named for its resident (*Séamus's House*), and residents' first names are unique in a town only while the bank lasts: twelve a sex for each people, so a town of more than about two dozen homes repeats them (Session 172 kept repeats for ordinary townsfolk, and Session 248 gave the second of a name another face). The critic found two *Séamus's House* in Carraig Mór (lots 10 and 44), both for sale, at 1,150 and 1,100: on the map, in the log, in a save's label and in a townsperson's directions the two read the same. A house is what the player buys, so the question is whether its name must point at one door. Shops, inns and guild heads are already unique (Sessions 172 and 248); nothing else changes in any option.
- **A. The second takes the resident's trade** *(recommended)*: where a house's name is already in the town, it reads *Séamus the Cooper's House* (the trade every resident already carries: farmer, weaver, cooper, fisher; an old woman *Old Úna's House*); a plain resident, or a trade that repeats too, reads by its street end (*Séamus's House by the north gate*). No new words beyond what the game holds; the first house keeps its name, so a save that owns one keeps it.
- **B. Residents' first names unique in the town**: the bank grows (or a family name is added) so no two homes share a name. Cleaner, but it is new names, the quest writer's, and it renames people in existing saves.
- **C. Keep the names, say which one**: the map's card, the log and the directions add the street end (*by the north gate*) only where the name repeats; the house's own name stays.
- **D. Leave it.**

Recommendation: **A.** It reads like a village talking (*the cooper Séamus*), it needs nothing the generator does not already know, and it is one change in the generator (`83-world-generator.js`) with a test over the nearest towns.

Michael: **A** (the second house takes the resident's trade). (2026-10-06) Built in Session 579; towns have no gates the generator knows of, so the street end reads *at the north end*.

### The light and robe lines — their numbers (the systems builder, Session 562, 2026-10-05) — DECISION #163
The question is in full on auto/systems. Today one armour line (a set about 4.8 × the tier's base defence, weight 20, Fortitude from Iron). A light at 60% defence and 40% weight gated by Finesse, each piece 3% harder to notice sneaking; robes (no boots) at 25% defence and a quarter weight gated by Intelligence, +3 max mana a tier a piece; light priced 90%, robes 100%; drops half heavy, a quarter each light and robes (recommended); B weight and defence only; C A plus a sneak and mana cost on the heavy line.

Michael: **Weight vs defence, own attribute, one small virtue**. (2026-10-05)

*Done, Session 564 (the systems builder, `tests/armourlines`):* A as asked: light 60% defence at 40% weight, Finesse, 3% harder to notice sneaking a piece; robes 25% at a quarter, Intelligence, +3 max mana a tier a piece; 90% and 100% of the heavy price; drops half heavy, a quarter each; the light line at the armourer, robes at goods shops. The Mages' Guild's robes followed in Session 566: its head's *Browse your wares.* opens a counter of the four.

### A dragon lair cut taller, so its wyrm stands at 4.5? (the look builder, Session 558, 2026-10-05) — DECISION #162
The question is in full on auto/backlog (pictures docs/prototypes/wyrmroof-*.png). A cavern's roof is 3.2, so a lair's wyrm is built at 3.73, not the open world's 4.5. A as it is; B the whole cavern of a dragon's lair at 4.4, the dungeon's height its own (walls, roof, stairs, lights, traps and the camera read it; other dungeons stay 3.2; one session); C only the master's hall at 4.4, a vaulted room the doorways step up to (recommended).

Michael: **The whole cavern of a dragon's lair at 4.4**. (2026-10-05)

### How the light and robe armour lines look (the look builder, Session 556, 2026-10-05) — DECISION #161
The question is in full on auto/backlog (pictures docs/prototypes/armourline-*.png; the prototype is on auto/proto-armour-lines). Light: a laced jerkin, bracers, strapped legs, soft boots and a caped hood; robes: an open coat over a coloured panel, an under-robe, wraps and a deep cowl; the tier colours each line. A both as shown (recommended); B robes plainer; C light line heavier; D something else.

Michael: **Both as shown**. (2026-10-05)

### Unblock main's CI — four suites failing by turns (the producer, 2026-10-05)
Main's own check is red on its last two runs with only docs changes between them: lod, saves and parryclock failed on 10cc224 (run 37331939848), then only compactrefit on d4c1672 (run 37339883165). Different suites on the same code points to runner timing. The failed shard of the d4c1672 run was re-run once.
- **A.** Treat these four as flakes: a branch whose only red is one of them, after one re-run, still goes ready for approval. *(recommended)*
- **B.** Hold every merge until the systems builder makes those four suites pass reliably.

Michael: **Treat these four suites as flakes**. (2026-10-05) The re-run of the failed shard then passed: main is green on d4c1672.

### The wraith — a hollow hood, claws, and a hunting stance? (the look builder, Session 548, 2026-10-05) — DECISION #158
The question is in full on auto/backlog (prototype pictures under docs/prototypes/wraith-proto-*.png): Michael's inspector note said the wraith reads as the human mesh. A the hollow hood (darkness, two slits of light for eyes) and longer arms with bone claws, standing as now; B A plus a hunched stance, head low and forward, both clawed arms reaching at chest height in idle and glide (recommended; blows and reach unchanged; the phantom takes the claws and stance but keeps its face); C leave it.

Michael: **A, plus the hunched, reaching stance**. (2026-10-05)

### Armour for archers and mages? (the look builder, Session 540, 2026-10-05) — DECISION #156
The question is in full on auto/backlog: one armour line today, its material tier decides the look; should there be armour cut for archers and mages? A not yet; B two more lines, light (jerkin, hood, bracers, soft boots) and robes (layered robe, mantle, cowl), each in every tier with its own stats (recommended); C light only; D robes only.

Michael: **Two more lines: light and robes**. (2026-10-05)

### The calendar's names — take the drafted set, and which era? (the quest writer, 2026-10-05) — DECISION #146
The calendar is built on auto/systems (Sessions 496–500) with placeholder names in one table, `CAL`, and backlog D says the names are proposed by the quest writer and picked by Michael. `docs/quest_drafts.md`, *The Year's Names*, drafts the whole set from the canon. The days are named for the gods, running outward from the hearth: **Hearthday, Stoneday, Beastday, Seaday, Skyday, Weaverday, Guestday**. The Church calls the seventh *the Closed Day*. The months are named for the year's work: **Thaw, Lambing, Sowing, Shearing, Haysel, Highsun, Reaping, Leaffall, Culling, Longnight, Wolfmonth, Lean**. A new tale opens on the 1st of Reaping. The four feasts are **the Kindling** (1st of Thaw), **the Long Light** (19th of Highsun), **the Giving** (23rd of Reaping, when the year's dead are named at the old gate) and **the Empty Chair** (28th of Longnight, a place set for the Guest). The canon names no monarch and dates nothing, so the era is the one call the draft cannot make alone.
- **A.** The drafted set, with the era **of the Peace**: the treaty after the war on the Hollowed Wastes, one generation ago (§1.4). A tale opens in the 27th year. The Markmen count the same years as *winters since the Wastes*. *(recommended)*
- **B.** The drafted set, with the Church's **Year of the Loom**, counted from the Weaving (about 1,500). Aurennais in a game that starts under the Crown.
- **C.** The drafted set, with the Crown's regnal year. Michael names the monarch.
- **D.** Other names: Michael writes them, or marks the ones to change.

Recommendation: **A.** Every ledger on three islands had to date by the treaty, the number is short, and if the cold peace breaks in play the date line keeps calling it the Peace, which is the point of it.

Michael: **The drafted set, years of the Peace**. (2026-10-05)

Done, Session 549 (the systems builder, auto/systems): the names in `CAL`, the era and the date line's four lengths; the feasts follow.

### Capes and cloaks — a slot and a look, a small virtue per kind, or the hood as a face? (the designer, 2026-10-05) — DECISION #148
You asked for capes and cloaks as an item slot with minimal bonuses unless rare or magical; today townsfolk wear cloaks that swing (S267) and your own body has the bones but can never wear one. The page (`docs/design/capes-and-cloaks.md`) fixes the shape under every option (a `back` slot, three cuts on your body, the dyer recolours it, no warmth bar, seeded drops; magical cloaks from tier 4 loot) and asks what a mundane cloak should do.
- **A.** A slot and a look: six kinds, def 1 each, differing only in cut and colour; looted ones roll the armour enchants (1 Opus + 1 Opus look).
- **B.** Each kind one small virtue in its place: the dark hood ×.95 detection while sneaking, oilskin no swim drag and a weather hint at the helm, Markish fur +10% stamina regen in snow, the Aurennais cape +2% barter in its nation, pilgrim's grey +25% on shrine boons; wet wool slows a swim to ×.9 (same cost as A).
- **C.** B, and the hood raised hides your face: crimes go on *a hooded stranger's* account, guards stop the hooded, unmasked it becomes yours doubled (B + 2 Opus).

Recommendation: **B.** The virtue is small and depends on where you are going (the best cloak at sea is the worst in the snow), so the slot has a decision in it without becoming *buy more*; every virtue reads a system already built. C rewrites the crime system's prices for a disguise nobody asked for; it can follow B later.

Michael: **Each kind one small virtue in its place**. (2026-10-05)

Done (the systems half), Session 552 (the systems builder, auto/systems): the slot, the six kinds and their virtues, the stock and the loot. The look half (the cuts on your body) is the look builder's.

### How large is a dragon? (the look builder, Session 524, 2026-10-05) — DECISION #153
Michael's inspector note on the dragon: "Design looks fine, but the scale seems far too small compared to the bandit for scale. Dragons should be pretty large."

Part of that was the inspector. It built every wolf-kit creature at scale 1, but every dragon in play is built at 2.88: the open world's at its zone scale 1.8 × 1.6, and a lair's master at the same 2.88. The inspector now shows it at 2.88 (Session 524). At that size it stands 2.35 tall and 6.9 long, against a man of 1.7. How large should it be?

- **A.** As the game has it: 2.88, 2.35 tall and 6.9 long, about one and a half times a man's height. Nothing changes but the inspector.
- **B.** 4.5: 3.7 tall and 10.7 long, about twice a man's height, with its head above a cottage's eaves. *(recommended)*
- **C.** 6: 4.9 tall and 14.3 long, a boss's size. A cave lair's rooms may be too low for it.
- **D.** By place: the open world's dragon at 4.5 and a lair's master at 6.

Recommendation: **B.** It reads as a dragon beside a person without outgrowing the lairs. The size is the look builder's change in the builders (`WOLF_KINDS.Dragon.world`). How far it reaches and how wide it is to hit grow with the scale in `42-zone-enemies.js` and the lair's `dragonBody` (`68-dungeon-misc.js`), so the systems builder would check reach, collision and the lair rooms in the same change.

Pictures (the bandit, then dragons at 1, 2.88, 4.5 and 6):
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/dragon-sizes.png
https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/dragon-sizes-near.png
The inspector at the world's size: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/dragon-inspector-after.png

Michael: **4.5: about twice a man's height**. (2026-10-05)

### The barber and dyer's fee, and whether the shop keeps a strongbox (the systems builder, 2026-10-05) — DECISION #151
Session 512 (the look builder, auto/backlog) put one barber and dyer in every town and city, after your B on #144, and the next slice opens the creator's look page from the chair. The fee is still open. For scale: an inn room is 6–20 gold a night by place (a town 12, a city 20, ±4 by house), and a level-one job pays 52–97. A second question rides with it: every shop with a keeper has a strongbox the crime system lets you pick, holding 10 + 50 a 100 prosperity in gold (about 40 in a town of 60, at the general goods rate).
- **A. One fee for the visit, an inn room's price in that place** *(recommended)*: about 12 in a town, 20 in a city; the look page opens and anything on it can change for that one fee; leaving without a change costs nothing. The shop keeps a strongbox at the general goods rate, like every other keeper.
- **B. Priced by the change**: a cut or shave 5, a new hair colour 10, each garment dyed 8, a city half as much again. Each row on the look page shows its price. Strongbox as A.
- **C. Free**: the barber's chair is a service of the town, with no fee and no strongbox.
- **D. A, but with no strongbox**: a barber keeps little coin.

Recommendation: **A.** One fee matches the one shop you chose on #144, it costs a night's lodging, which is cheap enough to try a look and dear enough not to do it daily, and it needs no price list on the page. B makes the look page a shop, and Morrowind and Skyrim never priced a haircut by the strand.

Michael: **One fee per visit, an inn room's price**. (2026-10-05)

Done, Session 551 (the systems builder, auto/systems): `barberFee`/`barberPay` for the chair's look page to call, and the barber's strongbox at the goods rate. The look page itself is the look builder's slice 2.

### Unblock the design proposal: a flaky watch test (the producer, 2026-10-05)
The capes-and-cloaks proposal (PR #149, da57005) changes two docs files and no code, yet the watch test failed on it twice in a row while main, holding the same code, passed.
- **A. Merge it anyway** *(recommended)*: the producer merges da57005 (docs only) now; the watch test is filed as a bug for the systems builder.
- **B. Wait for the watch test to be fixed.**

Michael: **Merge it anyway**. (2026-10-05) Merged as 262663c.

### A barber and dyer in towns (the look builder, Session 505, 2026-10-05, DECISION #144)
Backlog H has one look item left that is not done or waiting: *a barber/tailor in towns to change hair and dyes after the creator*. Today the look you choose in the creator (hair, beard, tunic, breeches and boots colours) is fixed for good. A trade in town would reopen those rows. It touches a new person, a room, a sign and a fee, so it is yours before anyone builds it.

The prototype is built from the furniture kit and the game's own people builder, at the kit's scale (a man 1.28 tall): a barber's room with a high-backed chair, padded and with a headrest (632 triangles), a brass basin on a three-legged washstand with a ewer (984), a polished-steel mirror in a carved frame (624), and a bench with razors, shears, towels and a jar of leeches (the barber was also the surgeon), with the strop on a peg. The sign over the door is three brass basins on an iron arm, which was the trade's sign before the striped pole. Beside it is a dyer's corner: a vat over a brick fire, a paddle, hanks of dyed wool on a pole, and folded bolts on a table. The last picture is one Gatelands man as he walks in, cut and shaved, and with his coat dyed blue with gilt trim.

- **A. Two trades.** A barber (hair, beard, hair colour) in every town and village, and a dyer (the colours of your tunic, breeches and boots) in towns. Each has a room on the kit and a sign; talking to them opens the creator's look rows. The fee would be set by the town's prosperity (the systems builder's numbers, yours to approve).
- **B. One shop, the barber and dyer** *(recommended)*: one room with the chair and the vat, the three-basins sign, in towns and up; it opens the creator's whole look page; one fee. Half the new rooms and people of A, and the look rows are already one page in the creator.
- **C. No trade, a mirror.** A mirror in a rented room or your own house opens the look page, free. It is the smallest build, but it adds nothing to a town.
- **D. Later.** Leave it in the backlog.

Recommendation: **B.** One trade covers the whole look page the creator already has. Oblivion's precedent is the other way (no barber at all, the face fixed), but Skyrim's later barbers and Daggerfall's tailors show a town trade can carry it without making a menu of it. The fee and any dialogue lines are the systems builder's and the quest writer's once you choose.

Screens: [the room](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/barber-room.png) · [the room, other side](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/barber-room2.png) · [the sign and the dyer's corner](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/barber-sign-dyer.png) · [one man three ways](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/barber-three-ways.png). Script: `docs/prototypes/barber/proto.mjs`.

Michael: **One shop, the barber and dyer**. (2026-10-05)

### Unblock main: the watch test fails half the time (the producer, 2026-10-04)
Main's own CI was red on 178e96f, a docs-only merge: one check in the watch test (a guard trailing you at favour −2 stays 38 units off) fails on and off, the same fault Session 378 fixed. The critic's docs-only playtest (PR #135) failed it twice.
- **A. Merge the docs PRs anyway; systems fixes watch** *(recommended)*: the critic's playtest (PR #135, b68c988) and the producer's docs merge past the red watch shard; the systems builder makes the favour −2 guard robust next run. Code branches still need green.
- **B. Hold everything until watch is fixed.**

Michael: **Merge the docs PRs anyway; systems fixes watch**. (2026-10-05) Done: PR #135 merged at b68c988; the systems builder owns the watch fix (backlog I).

### Rest and rising — the sleep and wait slip, and the level page (the concept artist, 2026-10-04, DECISION #142)
Today sleeping and waiting are two unrelated panels: a bed opens a cream Georgia slip with a bare 1–24 hour slider (*Day 4 · 9:40 pm · You are ready to advance*), and the ⏳ button opens a dark web panel of five emoji buttons (*Until Dawn (6:00)* … *Until Night (20:00)*). The level is taken on waking, on a third look again: eight dark cards in two columns, each with a ×1–×5 multiplier, a line of gains, and *Current: 0 pts · Activity: 310*, a raw number with no unit and no word on what the next multiplier needs. The prototype puts all three on the approved parchment kit (27 Sep) with the game's own numbers: a Duelist on Day 4 at 9:40 pm in Dunmore, 74 of 130 health, ready for level 2, with the activity a first level's play gives (5 foes, 140 wounds, 3 parries, 310 paces sprinted, 9 people talked with…). Prototype: `docs/prototypes/rest/` on auto/concept.

The rest slip is the same under A and B: one slip for a bed and for waiting. The day is drawn as a band (night washed in ink, sun and moon), with a NOW tick and a rubric arc to the hour you wake; under it the ruled slider (1–24 hours) and today's five times as marks that set it (keys 1–5). The slip says what the rest gives before you take it: *You wake at 5:40 am, Day 5*; health 74 → 130 and magicka 40 → 100 (restAtBed's rule: everything at six hours, a share below — 3 hours gives 102 and 70); *you wake at level 2*. Waiting says it restores nothing and that only sleep takes the level. One small rule change: waiting by any number of hours, not only to the five times.

- **A. The level on one sheet** *(recommended)*: eight rows, each the attribute, its value now → after, the multiplier as ×N and five diamonds, what earned it in words (*Nine people talked with — 10 for ×5*), and everything raising it gives. Three chosen are lit in rubric; the Duelist's +1 to Finesse, Swiftness and Might and the +10 health and +10 stamina of every level are stated before you choose. A *Rise* seal.
- **B. The level in the book** (the reading look, #116): the left leaf *What the Days Taught* lists the eight things you did and the multiplier each earned; the right leaf is the choice, eight compact rows. More ceremony, a little less on one line.
- **C. Restyle only**: today's two rest panels and the 2×4 cards on the paper, the same words (*Activity: 310*).

Recommendation: **A.** It matches the one-sheet creator you chose on 4 Oct, and every number that decides the pick (after, multiplier, the next threshold, the gains) is on one line. Oblivion's level screen is the precedent: a page you read once and close. B is a fair second for a moment that comes rarely.

Screens: [the slip, sleeping 8 hours](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/rest/sleep.png) · [sleeping 3 hours](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/rest/sleep3.png) · [waiting](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/rest/wait.png) · [today beside the slip](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/rest/compare-rest.png) · [A, the sheet](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/rest/sheet.png) · [today beside A](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/rest/compare-level.png) · [B, the book](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/rest/book.png) · [C](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/rest/restyle.png).

Found on the way (today's build): the level panel always reads *❤ +10 HP restored* (`#lu-hpgain`, static; the level adds 10 to the maximum); `gainLines` leaves out gains `ATTR_DEF` grants — Might's carry, Finesse's ranged damage, Resolve's block cost and magic resist, Intelligence's spell power, Charisma's quest gold and merchant access — so Charisma ×4 shows only *+4% barter prices*.
Michael: **The level on one sheet** (2026-10-04). Acted: written here; the systems builder (the slip and the waiting rule) and the look builder (the sheet on the parchment kit) take it from the backlog.

### Unblock Systems: the freeze stops the fix it waits on (the producer, 2026-10-04)
The world-file Fable session (FREEZE #138) waits for auto/systems and auto/backlog to land, and the freeze stops both builders until it starts. Systems' CI on 2859d5c is red on one test, guardplay (shard 8; the branch changed it), so only the systems builder can fix it, and the freeze stops it.
- **A.** Lift the freeze until both branches land; the Fable routine opens a new one when it takes the card. *(recommended)*
- **B.** Merge Systems 2859d5c anyway, guardplay red on main; the fix waits until after the cut.
- **C.** Start the cut now; Systems merges the rewritten world file after.
Michael: **Lift the freeze until both branches land** (2026-10-04). Acted: FREEZE #138 closed; the systems builder fixes guardplay next run; the world-file card goes back to queued once Systems and Look are on main.

### Unblock main: CI red after the co-op merge (the producer, 2026-10-04)
Main's CI on 6c9e3da (the co-op door merge) failed coopsaves, hourhitch and sailtrim, and stayed red four runs running: coopsaves waits a fixed 1.5 s for a save on a slow runner. No agent owned the co-op tests once the Fable session was done.
- **A.** The builders make the slow tests wait on the game, export too (Look 469 and Systems 470 already fixed coopsaves and duel; the fixes ride their next merges). *(recommended)*
- **B.** Treat it as a flake and re-run.
- **C.** Hand it to Claude (local).

Michael: **Builders make the slow tests wait, export too** (option A). (2026-10-04)

### An exhausted power attack still breaks a guard (the systems builder, Session 464, 2026-10-04, DECISION #131)
Played through the duel at Caer Slige (Session 464). Rowe fights as a Bandit Captain with the Shieldbearer's guard: a hit from the front lands at 35%, and a power attack breaks the guard (1.5 s stagger, the next blow full). Since v80 S9 a swing with too little stamina goes anyway but weakly: it lands at 45% and its cooldown is 30% longer. The guard break ignores that. A power attack on an empty bar breaks the guard as fully as a fresh one.

What it does in play, measured headless at level 1 with the starting club against Rowe: standing still and mashing the power attack on an empty bar (39 of 42 swings exhausted), you beat her in about 45 s and she lands 4 blows (54 of your 130). Fighting on your stamina, waiting for three-quarters of the bar before a power attack, you land 3 swings in 21 s and go down. The careful player loses, and the masher wins. The same holds against every Bandit Captain and siege captain.

- **A.** An exhausted power attack does not break the guard. It lands as a guarded hit (35% of the exhausted 45%), with the message *Too spent to break the guard.* Cost: one line in each strike path (open world and dungeon), and a test. *(recommended)*
- **B.** It breaks the guard, but the stagger is halved (0.75 s), so she answers before your follow-up. Cost: the same.
- **C.** Leave it. Mashing is a choice, and the stamina bar already punishes it elsewhere.

Recommendation: A. It is the rule the exhausted swing already states (*swing anyway, weakly*), and it keeps the guard a thing you read rather than a thing you mash.

Michael: **A — an exhausted power attack lands as a guarded hit** (2026-10-04, on #131). Acted, Session 485: both strike paths (the open world's and the dungeon's) let a spent power attack fall through to the guarded hit (the front block .35 on the spent 45%), with a normal swing's posture drain rather than the power attack's, and the hit's line ends *· Too spent to break the guard.* `tests/spentguard`. #131 closed.

### Journal and calendar — a dated journal only, or a calendar the world keeps? (the designer, 2026-10-04, DECISION #132)
Today the date is *Day 12 · 7:40 am* in the sleep panel, and the journal is `GAME_LOG`, which is never saved, so every line is lost on reload. The page (`docs/design/journal-and-calendar.md`) fixes the shape under every option (a 7-day week, a day per god; 28-day months, so a weekday keeps its dates; 12 months and 336 days, a year a long playthrough at 60 to 1; entries saved in the character row) and asks how far the calendar should reach into play.
- **A.** The dated journal: your entries in your own voice under their dates, by day and by quest, on the open book; the date line everywhere. Nothing in play changes (1 Opus).
- **B.** A, and a calendar the world keeps: a god's day doubles its shrine's boon, each town a market day with a travelling stall, rent on a named day, four feasts a year, some tasks dated (+25% by the day, taken back after), seasons in the weather odds, and a *Due* page (A + 2 Opus).
- **C.** B, and Morrowind's whole book: every topic you were told filed by name with a search, links in entries, notes of your own and on the map (B + 2 Opus).

Recommendation: **B.** A calendar that only labels the clock is a name on a number; market days, god's days, feasts and dated work make the date something you plan a road around. C's topic index is a reference more than a decision, and better after the dialogue settles. The names of days, months, seasons, era and feasts are the quest writer's under every option.

Michael: **C — B, and Morrowind's whole book** (2026-10-04, on #132: the dated journal, a calendar the world keeps, and the topic index). Acted, Session 486: part A's first slice, the journal saved in the character row with each line's date (`tests/journal`). The rest is in backlog E and D: the Journal tab's two views and the date line everywhere wait on the quest writer's names; B and C touch the world module and follow its break-up. #132 closed by the producer.

### The title screen and the character creator — one sheet or a book? (the concept artist, 2026-10-03, DECISION #126)
Today the title is green text on black: the name, a stale subtitle (*Village of Ashenmoor*, a legacy zone the game no longer starts in), six lines of controls and two or three web buttons. The creator is one dark column 1,278 px tall in the 600 px game frame, 2.1 screens of scrolling with *Begin* below the fold; the style and beard rows are walls of 13 and 15 buttons. The prototype puts both on the approved parchment kit (27 Sep) with the game's own data and no rule change: the eight beginnings, six starting weapons, eight gifts at 8 points and 3 at most in one, the four peoples' lines, the look rows, and the creator's own figure photographed at full length. Prototype: `docs/prototypes/creator/` on auto/concept.

The title is the same under every option: the world at night behind, *The Old Gates* in the kit's capitals, the menu on one slip (*Continue* with the save's name, beginning, level and place under it; *A New Tale*; *Load a Tale*; *The Keys*), and the controls moved to a card of their own that the pause menu can also open.

- **A. One sheet** *(recommended)*: everything on one 1200 × 672 page in three columns, nothing scrolls. Name and the figure full length (430 px, was 250 and cut at the knees); people, look and beginning; weapon, gifts and the *Begin* seal. Style and beard become one stepper each (‹ Cropped › 1 of 13).
- **B. The book**: the open book you chose for reading (#116), four chapters turned with A and D: who you are, how you look, how you began, what you are given. The figure and a line of what you have chosen stay on the left leaf. Four turns before you play.
- **C. Restyle only**: today's column on the paper with the kit's type. It still scrolls.

Recommendation: **A.** Every choice sits in view and changes the figure beside it, and one click reaches anything. Oblivion's race screen works the same way, a figure beside its sliders. B is better as a ceremony but asks four page turns of someone who only wants to play. C keeps the scroll that hides *Begin*.

Screens: [the title, today beside the proposed](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/creator/compare-title.png) · [the keys card](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/creator/keys.png) · [A, today beside the sheet](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/creator/compare-creator.png) · [A, full size](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/creator/sheet.png) · [B, chapter III](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/creator/book-3.png) · [B, chapter IV](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/creator/book-4.png) · [C](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/creator/restyle.png).

Michael: **One sheet, nothing scrolls** (4 Oct 2026)

### The Compact's claim when you already own a ship (the systems builder, Session 457, 2026-10-03, DECISION #128)
The Compact's rank-3 claim is *a house and a ship* (Session 99), and the lord says "It's yours. The ship is at the quay under your name." Until Session 457 it deeded the house alone. Session 457 now moors a sloop at the nearest of the Compact's harbours (Fortargent is inland; Beaurouge, 850 units off) when you have no ship. The game holds one ship per player, so a Prior who already owns one gets nothing for the second half of the claim. Today their ship stays where they left it and the line still says the ship is at the quay.

What should the Compact give a Prior who already has a ship?

- **A.** Nothing more: the ship you have is the one under your name. Cost: none. The line stays slightly untrue.
- **B.** A refit: your ship is mended and raised one class free (sloop → cog → galleon; a galleon is only mended). A visible reward. Cost: one short session, reusing the shipwright's refit. *(recommended)*
- **C.** The hull's price in gold (400). Cost: one line. It reads as *buy more*, which the brief warns against.

Recommendation: B.
Michael: **A free refit: mended and raised one class** (B). (4 Oct 2026, via the control room)
*Built in Session 467* (`tests/compactrefit`): the claim refits the ship where she lies (sloop → cog → galleon, hull and rig full; a galleon is mended); a sunk ship is raised free by the shipwright nearest her wreck in three days, a class up. Issue #128 was closed by the producer.

### Places standing in the basin lakes (the systems builder, 2026-10-03, DECISION #121)
The rivers build (S432, Michael's C, the horseshoe) put one great lake in each range's basin, up to 1 km across (Dotriair Mere is 502 units in radius). The routing keeps river channels out of settlement pads, but the lakes were laid over places their cells had already drawn. Of the 919 generated places that are not ports, 43 now stand on a plug of land with water all round them: 36 with water on all sixteen bearings one and a half pads out, 39 of them in a basin lake. That is 20 villages (Diawor, Villeargent, Nordou, Murtraley, Tullymore, Dunard, Carriglough and thirteen more), plus shrines, glades, towers, ruins, outposts, two camps and two lairs. The pad's stamp lifts each one out of the water, so Diawor stands at 3.4 on a disc 45 units across, with −1.1 a third of a pad beyond its edge and −4 past that. Nobody reaches them without swimming, and no road or coach can. Saves keep places by id; a save made standing in one of them reloads at that spot. (Session 447 handled the gates the same way, as a bug: 99 were redrawn out of the water, and gates have no streets.)
- **A. Move them to the shore** *(recommended)*: after the routing, each place whose pad is ringed by water is set down on the nearest dry ground beside its lake or river, facing the water, with its id and name kept; its roads re-route as roads do. 43 places move once. A save made standing in one reloads where the place was, now in the water.
- **B. Island villages**: they stay where they are, and each gets a causeway (the bridge kit) to the nearest shore, so a lake has its island hamlet. Nothing moves.
- **C. Shrink the lakes**: the routing bends each lake's shore round the pads it would swallow, as it bends the rivers. Most of the 43 then stand on the shore or on a spit. The lakes change shape on the map and get smaller.
- **D. Leave it.**

Michael: **A — move them to the shore** (3 Oct 2026, on issue #121, via the producer).

*Done, Session 452 (systems builder):* after the routing, a place with no dry straight line from its pad's edge out to three pads on any of 24 bearings is set down at the nearest spot in its own cell where the pad and a ring 30 beyond stand on dry bare land, clear of the other pads and the gates. 42 move (19 villages, a city, outposts, shrines, glades, spires, ruins, a bandit camp and two lairs, whose cavern doors go with them), 100–580 units each; none is left cut off. `tests/shoreplaces`. Issue #121 closed by the producer.

### Online play — which co-op is the door kept open for, and what is built now? (the designer, 2026-10-03)
Nothing is networked today, and the game assumes one player and one save: foes read `px`/`pz`, the save writes you and the world as one row, panels stop the clock, and loot rolls `Math.random`, so two machines would roll different chests. The page (`docs/design/online-play.md`) sets the co-op it aims at (the host's world, each friend's own character, one shared place with a 400-unit tether, downed for 30 s instead of a reload when friends are present, foes +50% health a friend) and asks what to do now.
- **A.** Keep the door open only: split the save into character and world, stable ids, seeded outcome rolls, foes target through one function, nothing relies on the pause; nothing networked (1 Fable + 1 Opus).
- **B.** A, then build summoned co-op now over WebRTC (A + 1 Fable + 6 Opus).
- **C.** A, then a PvP arena first to prove the wire, co-op after (A + 1 Fable + 2 Opus, then B).

Recommendation: **A**, aimed at B's shape. It is the "architecture now, the feature later" the note asks for; B now would race the skills and combat reworks, and C builds the "perhaps" before the friend joining your world. Say also whether *downed, not a reload* with friends present is right.

Michael: **Keep the door open only** (A). (2026-10-03)

### Books and notices — how should reading look? (the concept artist, 2026-10-02, DECISION #116)
The six skill books open today on a dark brown box, one page at a time, with web buttons (*◀ Previous*, *Next ▶*, *Close Book*); the notice boards and the examine texts (the Sea-Folk Shrine, the Mouth, the keystones) open as plain text on a black page. The prototype puts all three on the approved parchment kit (27 Sep) with the game's own words and no new data: *The Forge-Man's Third Treatise* and *Letters from Ashwold*, Hearthwick's board, Droichead's keystones. Every page of all six books fits its leaf. Prototype: `docs/prototypes/books/` on auto/concept.
- **A. The open book** *(recommended)*: two pages a spread in a leather board with a page block, a ribbon, a running head and folios. The first page becomes a title page and the text opens on a red drop cap. The letters are set in a written hand. The first reading's +1 is written at the foot of the title page instead of a toast. A/D turn, E closes.
- **B. One leaf**: the same paper and type, one page at a time as today.
- **C. Restyle only**: today's panel in the kit's colours and fonts.

With any of them, the notice board becomes a plank board with the town's record on one nailed sheet and each notice on its own slip. An examine text becomes a slip in the lower third, with the world still in view.

Recommendation: **A.** It is how Oblivion shows a book, and the UI overhaul (27 Sep) asked for Oblivion's design. The six books run to 3 or 4 pages, so a spread shows half a book at once and two turns read it.

Screens: [today beside A](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/books/compare-book.png) · [A, a book of letters](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/books/letters.png) · [B, one leaf](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/books/leaf.png) · [the board, today beside the proposed](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/books/compare-notice.png) · [the examine slip](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/books/compare-examine.png).

Michael: **A. The open book, two pages a spread** (2 Oct 2026)

### Main's tests went red after the Systems 404–429 merge (the producer, 2026-10-02)
Main's check failed on 8ca3e23: saveui failed once (a save to an empty slot did not show) and headless shard 3 ran out of its 45 minutes on its last suite. Both had passed on bd9fb74. One re-run of the two jobs: saveui (shard 8) passed; shard 3 timed out again at 45 minutes (run 37053330502, attempt 2). Shard 3 also timed out on auto/systems f71586a.
- **A. Carry on merging; fix the slow shard** (recommended): approved branches keep merging on their own green CI; the systems builder rebalances the shards or raises the time limit next run.
- **B. Hold all merges until main is green.**

Michael: **Carry on merging; fix the slow shard** (A). (2026-10-02)

### Mountains and rivers on the world map — which layout? (the Fable session, Session 430, 2026-10-02, DECISION #112)
Today the ranges are bands laid on cell borders (the Mark's are a grid of boxes), one peak a cell, and the rivers are border crossings rolled at random, one width, with no forks. Session 430 prototyped three rules for laying the ranges, and routed the rivers off them the way the real build would: a coarse height (the distance from the coast, the proposed ranges on top) is flooded and drained, so every channel reaches the sea or a lake, tributaries join, and the width follows the catchment (10u at 1 km², 16u where a ship fits at 3.2 km², 25u at 12 km²). The pictures are the world map as the game draws it, washed pale, with the proposal over it; the old ridge boxes still show through faintly. The home province keeps its authored rivers in every layout (the Dearg, the Westwater, the Ferrous wall along its north edge); the Dearg would widen downstream but stay a ford at Redwater Ford, so it is not a ship's river.

![today](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/fable-rivers/docs/prototypes/rivers/today.jpg)
![A](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/fable-rivers/docs/prototypes/rivers/layout-a.jpg)
![B](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/fable-rivers/docs/prototypes/rivers/layout-b.jpg)
![C](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/fable-rivers/docs/prototypes/rivers/layout-c.jpg)

Close-ups of each island: `docs/prototypes/rivers/layout-a-islands.jpg`, `-b-`, `-c-` (and `today-islands.jpg`). Blue lines are rivers, a light core marks water a ship can enter; faint blue is a brook; the brown band is a range with its peaks; a white ring is a town, city or port within a short walk of navigable water (it would gain a quay); a red ring is a settlement a channel runs through (the river bends round it).
- **A. The spine.** One long range along each island, wandering, with a shoulder range on the big islands. Rivers run to both coasts, so there are many of a middling size: 75 reach the sea, 12 named, 3 deltas, 20 a ship can enter (97 km of navigable water), 19 lakes. Even and plausible; no river dominates an island.
- **B. The rim.** The range runs along one coast of each island (the Mark's east, Aurenne's west, the Gatelands' north), with a spur inland. The island drains the other way, so the rivers are long and few: 67 reach the sea, 12 named, 3 deltas, 22 a ship can enter (103 km), 22 lakes; the two biggest catchments are 14 km² (la Dorée) and 13.6 km² (the Blackwater). The short side has torrents off the mountains.
- **C. The horseshoe.** A ring of ranges round a basin, open on one side; the basin holds a lake and drains through the gap as one great river. 49 reach the sea, 9 named, 3 deltas, 9 a ship can enter (72 km), 16 lakes; the great rivers are huge (the Blackwater 36 km² and 4.8 km long, la Dorée 34 km², An Dubh 24 km² and 7 km long) and everything else is small. Dramatic, but a quarter of each island is the one valley, and the Gatelands' ring sits over the home province's north.

**Recommendation: B.** It gives what the backlog asks for, a few great rivers cutting through each island with forks and a delta, and it keeps the rest of the coast ordinary. A spreads the water evenly and nothing reads as *the* river; C makes one valley the whole island. B also fits the canon as written: the Mark's ranges stand along its strait side, Aurenne's long rivers run down to the coast where its ports are, and the Gatelands' rivers come south off a northern range the way the Dearg comes off the Ferrous.

**Towns and rivers.** In every layout the rivers are routed with the settlements in the way, so a river bends round a town's pad rather than the town moving (40 of 522 settlements sit in a channel's path in B; the river goes round). A town the river passes within a short walk gains a quay on the bank (89 in B). The other way, moving towns onto the banks, would move 40 generated settlements and re-roll their roads; the home province's authored places would not move either way. Say **towns move** with your letter if you want that instead; otherwise the rivers bend.

What the build then does (two or three sessions): the routing runs once per seed at boot in a job (0.6 s on this machine for 230,000 lattice nodes; a 100u lattice would be a quarter of that), its rivers are carved in `rawH` as today's are, with a width that grows downstream and every site stamp after the carve; `ridgeAt` measures from the range's spine instead of the cell border, and the peaks sit along it; a quay prop on a bank town; the ship's aground test already reads the carved depth, so a 16u channel is sailable; the bridges take their length from the river's width; the local and world maps draw the water. Tests: every river reaches the sea or a lake; no settlement pad floods; the ship sails from a port up a great river to its first fork; the terrain build stays inside the hourhitch and snowrepaint budgets.

(Prototype: `docs/prototypes/rivers/layout.js` and `render.mjs`; `node docs/prototypes/rivers/render.mjs` redraws the four pictures in about forty seconds.)

Michael: **The horseshoe: a ring round a basin** (C). (2026-10-02)

### Places that share a name (the systems builder, 2026-10-02, DECISION #110)
The world names its places from each culture's bank: ten first halves and ten second halves, a hundred names at most, drawn at random for every village, town, city, port and outpost. There are 609 of those in the world and only 366 names among them, so 396 places share a name with another place, 59 of them with a place in the same province. Of the 110 ports, 30 share a name, and six harbourmasters offer *Passage to* a port with their own harbour's name (two *Woushstouir*s in the Wiabrou Realm, two *Marnfouey*s, *Godaey*, *Inismore*). A quest, a coach board or a rumour that names one of them can mean either. Home's hand-placed towns (Dunmore, Portclare and the rest) are untouched in every option.

Renaming changes the names of places in every existing save. The saves keep places by id, so nothing breaks; a journal line already written keeps the old name.

- **A. One name per place, world-wide** *(recommended)*: generation draws without repeats, and a culture whose hundred names run out builds longer ones from the same sounds. 243 places get a new name, once (609 less the 366 names kept). As Session 172 did for shops.
- **B. One name per nation**: repeats allowed only across a border, so fewer places renamed than A. Two nations could still share a *Beaumont*.
- **C. Keep the names, say which one**: where a name repeats, the ferry, the coach board and the map add the province (*Woushstouir, Wiabrou Realm*). Nothing renamed, but two ports in one province still read the same.
- **D. Leave it.**

Michael: **One name per place, world-wide** (A). (2026-10-02)

*Done, Session 432 (systems builder):* a pass over the whole grid, once the cells are made, keeps each place's drawn name unless a place ranked before it holds it (cities, towns, ports, villages, outposts). 251 of the 610 take a free name from their culture's bank, or a longer one from the same sounds where the bank is spent (Irish *-na-*, French *-le-*, the generated cultures three syllables). Home's names are kept and reserved. `tests/placenames`. Issue #110 closed by the producer.

### How the wolves, boars and bears die (the look builder, 2026-10-02, DECISION #107)
Session 419 gave the people-bodied foes a ragdoll (your C on #102). The beasts on the wolf's bones still take the old death: the wolves, the Snow Wolf, the Dire Wolf, the Ash Hound, the boar and the Cave Bear. A dead pose is set and the whole figure turns 90° onto its side in one frame. That is the snap you called stiff. How should they go down?

![grid](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/ragdoll-creatures.png)

Rows A–C are a wolf struck from your side, at 0 to 1.6 s. Row D is six different deaths under C.
- **A.** Keep today's snap.
- **B.** A canned collapse. The legs fold and the body rolls onto its side over half a second, with a small bounce. Every death is the same.
- **C.** A ragdoll on the wolf's own joints, the people's ragdoll applied to four legs. It has 29 points (the spine, the head and nose, the tail, and four legs with their paws), with the torso held rigid. The elbow and the hock bend back and the stifle forward. Gravity, the blow, the ground and the walls act on it. Each death is different: on its side, sprawled, a heap, or now and then on its back. The prototype settles in 0.6–1.0 s and the bone lengths hold to 0.1%. Built like the people's, it should cost about 1 ms a step per falling body, and nothing once it is still.

**Recommendation: C.** It matches the people's deaths, so a pack of wolves doesn't fall one way and the bandit beside them another. B always rolls the same way. The spiders, the crawler and the scorpion already curl their legs as they die. If you choose C, I would only drop their 90° turn so the curl plays where they stand, and ask you separately if it should be more.

(Prototype: `docs/prototypes/ragdoll/creatures.mjs`, Session 422.)

Michael: **A ragdoll on the wolf's own joints** (C). (2026-10-02)

Done, Session 427 (the look builder): the wolf family falls on its own ragdoll, ending on the flank (a keel was added under the trunk so it does not rest on its belly), and the spiders, the crawler and the scorpion curl where they stand without the 90° turn. `tests/beastfall`, `docs/prototypes/ragdoll-beasts-ingame.png`.

### Platforming — the jump, the ledge and the places that ask for them (the designer, 2026-10-02)
Today the world outdoors has no tops: rocks, walls and ruins only block, a fall of any height costs nothing, and no place asks for a jump, so Acrobatics' perks, magic B's movement words and the felled trunk have nothing to open. Which shape should platforming take, built to one table of gaps (2.9 anyone at a sprint, 3.4 at Acrobatics 100, 5 with the double jump) with a mantle for everyone and falls that hurt past 4 units? (Page: `docs/design/platforming.md`.)
- **A.** The honest jump: heights for the world's solids, the mantle (Catch at Acrobatics 25), fall damage (6% of health a unit past 4, halved by a landing roll), and your three examples built once by hand: Greywatch climbed from outside, a broken gorge bridge on the Bealach, a dungeon pit of pillars. One Fable and two Opus sessions.
- **B.** A, plus places seeded by the generator, each with more than one way across: broken towers and forts climbed outside, gorge crossings, cliff shelves, and in dungeons the pit of pillars, crumbling floors and timed blade runs; optional caches and views at the end, nothing on the main quest's path gated. One Fable and five Opus sessions.
- **C.** B, plus climbing on ivy, rough stone and rope against a stamina drain. One Fable, seven Opus and a look session; it undoes the walls the towns, the watch and burglary stand on.

Recommendation: **B**, with A's sessions first. It gives every movement perk, word and the trunk something to open across the whole continent, and the same gap three answers, so a trained skill is a shorter way rather than a gate.

Michael: **A, plus generated places with several ways across** (B). (2026-10-02)

### Ragdoll for defeated enemies — how a foe goes down (the look builder, Session 415, 2026-10-02, issue #102)
Michael asked in the control room (1 Oct): "Is it possible to have ragdoll for defeated enemies? Having them snap to the ground sideways feels stiff." It is possible. The prototype builds three deaths on a Bandit, from the game's own body and ground. The game is unchanged. Rows A–C show each death at 0, .12, .25, .4, .7 and 1.6 s after the blow. Row D is where C leaves six different deaths.
- **A. As today.** In one frame the figure turns 90° onto its side, is lifted .15 and darkened.
- **B. A canned fall.** Over about .6 s the body tips back from the feet, away from the blow, with the knees giving, the arms thrown up and a small bounce. It is the same fall every time and lies flat whatever the ground.
- **C.** *(recommended)* **A ragdoll.** At death a point sits at each of the body's 21 joints. They are held at the bones' lengths, with the torso and head rigid and the knees and elbows bending only their own way. Gravity, the blow's push (its direction and weight), the knees giving, and the ground's own height and friction act on them, and the bones follow the points. Every death is different: a jab, a heavy blow, from the side, from behind (face down), a glancing blow, dropped where he stood. The body settles on the slope in 1–1.5 s and is then frozen, so it costs nothing after that. While falling it costs about 1 ms a frame per body on the test machine's CPU. For the people-shaped foes (bandits, goblins, kobolds, trolls, ogres, the armoured foes) it is a call from the kill path, which is the systems builder's file. The creatures (wolves, bears, spiders) would follow on their own skeletons in a later pass. The old box-built enemies keep A.

Either B or C keeps today's darkening and the loot on the body. C also leaves the body where the whole-body corpse search (backlog C) would read it.

Shot: [A / B / C filmstrips, and six deaths under C](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/ragdoll-grid.png) (`docs/prototypes/ragdoll/grid.mjs`).

Michael: **A ragdoll: every death different** (C). (2026-10-02)

### The pirate's ram: how hard, how often? (systems builder, 2026-10-02, issue #100)
Your A on sailing (#85) is built except the parts that wait for the skills build, and one part that needs a number: the pirate's ram. Sessions 411–413 made the hull and rig, the wear from the sea, grounding, rams, volleys and foundering. The page says *pirates gain a ram when faster and within 30 units*, and that a ram costs the closing speed × 3, *bow-on, you take half and give double*. Taken literally, a black sail coming bow-on at her 6.5 costs your sloop 39 of her 100 hull. The page doesn't say how often she may ram, and today she closes to 28 units and circles, shooting, so she would be back on you every few seconds. How should she ram?
- **A.** As the page: bow-on she gives double, 39 to a sloop at 6.5, and she rams again whenever she has drawn off and closes. Three rams sink a sound sloop.
- **B.** She rams once an approach, for the plain × 3 (about 20 to a sloop), then sheers off to her 28-unit circle and shoots as now; she comes again after 30 s if you are still near. Bow-on doubling stays yours alone, when you ram her. *(recommended)*
- **C.** No ram: the black sail fights with volleys and boarders, as now.

Recommendation: **B.** The page wants her to be *something to turn from, not only to board*, and B does that: a ram costs a fifth of a sloop's hull, with time to answer by turning or making way. A's double makes three passes a sinking, and C leaves her circling harmlessly beyond the volleys.

Michael: **B** — she rams once an approach for the plain × 3, then back to her circle. (2 Oct 2026, issue #100, via the control room)

*Built, Session 418* (`tests/pirateram`): within 30 units, faster than you (her 6.5) and with you aboard, she steers at your hull; the first touch spends the ram (−20 to a still sloop), she draws off to her circle, and she may come again 30 s later. A run that has not touched in 12 s is given up.

### The unarmed body in third person — a fist, and the arms at rest (the look builder, Session 407, 2026-10-01, issue #99)
Session 402 put the jab on the third-person body, and its devlog left two look calls open. First, with an empty hand the body's hand is a mitten: a squashed ball with a thumb, which reads as a pale point at a distance. Second, the unarmed body walks and runs with its arms swinging. It only comes up to guard for the punch, while the first person always holds both fists up. All four rows are built from the game itself. The fist is patched into the bake at runtime, so the game is unchanged.
- **A. As today.** A mitten hand, the arms swinging at rest and on the move.
- **B. A folded fist on each empty hand** (a squarer palm, four knuckles, the curled fingers, the thumb across), the arms as today. +1,028 triangles on the player's body (4,210 → 5,238); nobody else changes.
- **C.** *(recommended)* **B, with the fists carried low and ready**: forearms forward at the belt, standing and on the move, dropping to the swinging arms while sprinting. It answers the first person's raised fists without the body looking braced for a fight in the street, and the jab still starts from its own guard.
- **D. B, with the jab's own guard carried** (the right fist by the chin, the left by the face), standing and on the move. It matches the first person exactly, but it reads as squaring up to everyone in town.

Shot: [A / B / C / D, standing, on the move, the hand close, ahead-right](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/unarmed-grid.png) (`docs/prototypes/unarmed/grid.mjs`). Unarmed only: a weapon, a bow, a shield or a torch keeps today's poses. The townsfolk's hands are not touched.

Michael: **B, the jab's guard carried**. (1 Oct 2026, issue #99, via the control room)

### The counter and the chest on the parchment — instant clicks or a reckoning? (the concept artist, 2026-10-01, PR #97)
The approved parchment kit (27 Sep) now has the trade screens drawn on it with the game's own numbers (Lorcan's Forge, Dunmore): the shop as an open ledger, the shop's page left and your pack right, the picked piece set against what you wear with its price worked out (list × town × Charisma), and a locked piece saying why (*needs Might 5 — you have 3*). Also a ruled slider for quantities and a chest window showing the pack's weight after taking all. Prototype: `docs/prototypes/trade/` on auto/concept.
- **A.** *(recommended)* **The ledger, today's rules**: a click buys or sells at once, restyled, with the lock reason and the price's working shown.
- **B. The ledger with a reckoning**: picks gather on a tally and nothing changes hands until you press the seal (a sell and a buy in one deal, undo before you commit; a small rule change for the systems builder).
- **C. A now, B later** if the instant click proves too easy to misclick.

Recommendation: **A.** It is the look approved on 27 Sep with no rule change, and the counter already has buy-back for a mistake. Screens: [today beside the ledger](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/trade/compare-shop.png) · [the reckoning](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/trade/reckon.png) · [the quantity slip](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/trade/qty.png) · [the chest](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/trade/compare-loot.png).

Michael: **The ledger, today's rules**. (1 Oct 2026, PR #97, via the control room)

### The duel's yield — should a blow begun before you could see her kneel count as murder? (systems builder, Session 405, 2026-10-01, issue #96)
In *The Yard at Caer Slige*, Rowe yields at a quarter of her health. Any blow that lands after that kills her: murder, the League closed, the watchers' backs turned. The critic asked whether a swing already under way counts. I measured it (`tests/duelrhythm`). Clicking in rhythm, the next swing begins 0.17–0.28 s after the blow that makes her kneel (dagger to hammer) and lands about 0.5 s after it. That is under a person's reaction time. A bot that stops 0.15 s after she kneels spares her, and one that stops at 0.25 s or 0.4 s kills her. So a player who swings steadily will often murder her without meaning to, and lose the League for good.
- **A. As now.** Any blow after the yield is murder. The yield is a test of control, and the warning is the fight itself.
- **B.** *(recommended)* **A blow begun within 0.4 s of her kneeling is held.** It lands on nothing (*You check the blow.*), and so do arrows and spells loosed in that time. A swing begun later is murder, as now. This forgives the reflex and keeps the choice.
- **C. A held moment.** For the first second after she kneels no blow of yours lands on her, whenever it began. Simpler to say, but a deliberate blow in that second is forgiven too.

Recommendation: **B.** It is one condition in `tickDuel` and a test. It keeps *struck she dies* for every blow the player chose, and removes the one they couldn't have stopped.

Michael: **A blow begun within 0.4 s of her kneeling is checked**. (1 Oct 2026, issue #96, via the control room)

*Built, Session 408* (`tests/duelrhythm`): the game notes when you last began a swing, an arrow or a cast; a blow that lands after she kneels is checked (*You check the blow.*, her health put back) if that was within 0.4 s of the yield, and murder if later. A burn or other effect still running from an earlier blow is checked too, since you began nothing new.

### The cavern master — what does it do besides hit harder? (systems builder, Session 400's run, 2026-10-01, issue #95)
Backlog C has owed *a mechanic for the dungeon master beyond numbers* since Session 130. Every lair's cavern ends in a master: the deepest room's foe, made 3× the health (6× a wyrm) and 1.6× the damage, scaled by level (`lairFinish`). Nothing else changes. The lair beast at the mouth dazes itself charging into a wall, and the captains raise a frontal guard, but the master only hits harder. It is the end of a long dungeon and fights like the first room.
- **A. A telegraphed slam.** Every 8–10 s the master winds up for 0.9 s (the tells of Session 282) and strikes the ground in a 3-unit ring that can't be blocked, for twice its blow. A roll through it (the roll's untouchable window) or getting out of the ring avoids it. It is the combat page's shape: read the tell, roll.
- **B. A second phase at half health.** It roars, calls two of the lair's own kind out of the dark, and swings a fifth faster for the rest of the fight.
- **C. By its kind.** A master borrows its kind's trait, larger: a spider's web slows you for 3 s; a bear or troll charges and dazes itself on a wall like the lair beast; the undead rise once at a quarter health unless finished (the finisher of Session 298).
- **D. Not yet.** Wait for the attack table (combat B's Fable session), which will rework every foe's blows.

Recommendation: **A.** It is one Opus session with a test, and it asks the skill the combat changes built (the tell, the roll) at the place that should test it most. B and C can layer on later; D leaves the last room of every lair as it is for as long as the Fable session takes.

Michael: **A telegraphed slam**. (1 Oct 2026, issue #95, via the control room)

*Built, Session 404* (`tests/masterslam`): the slam as A says it, a 3-unit ring on the floor through the tell. Found in building it: Session 130's 1.6× damage never reached a dungeon master's blows (it scaled an `e.dmg` they don't have); it does now.

### Should the helmed foes wear the armour kit too? (the look builder, Session 397, 2026-10-01, issue #94)
Since Sessions 384 and 395 the player and the town guards wear the armour kit: lamellar, a muscle cuirass, mail or plate by material. The foes who wear armour today still have the people's steel bowl helm over cloth: the Deserter, the Bandit Captain, the dungeon's Shieldbearer and the Ash Wight. Beside a guard in mail, a bandit captain now looks like a man in a hat. A prototype (look builder, Session 397) dresses all four two ways:

- **A. Today.** The bowl helm over cloth. No cost.
- **B.** *(recommended)* **Each in the kit as his story dresses him**, a fixed piece list per foe: the Deserter in his old army's Iron mail and nasal helm; the Bandit Captain in looted pieces (a Wooden lamellar cuirass and vambraces under an Iron helm); the Shieldbearer in a Steel plate cuirass and helm over Iron mail sleeves and greaves; the Ash Wight in Iron mail rusted nearly black, as the dead's blades are. The unhelmed foes (bandits, archers, highwaymen, cultists, the risen dead) stay in cloth.
- **C. B, but the metal by the foe's level**: a level-20 Shieldbearer in Mithril plate, a low one in Iron. It ties what a foe wears to what it can drop, and needs a rule for which levels map to which material (it touches loot, the systems builder's).

Cost: these foes are 4,922–5,844 triangles today and 8,822–10,568 in B (the distant copy 2,150–2,619 today, 3,755–5,271 in B). A camp has one captain; a dungeon floor a few Shieldbearers. Shot: [A / B](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/foearmour-grid.png). The script is `docs/prototypes/foearmour/shots.mjs`. Found on the way: a curly-haired Shieldbearer's hair poked through the closed helm; that was the kit's bug for the player too, and Session 398 fixed it (the full styles are cut to the skull under any kit helm), so it is not part of this question.

Michael: **Each in the kit as his story dresses him**. (1 Oct 2026)

### Pirates and the hold — do black sails take your cargo? (systems builder, Session 391, 2026-10-01, issue #91)
Sessions 390–391 put trade goods in your ship's hold (40 / 60 / 90 weight by class). Pirates already board you at sea (`crewUp`, the boarding of Session H); today a boarding risks only your health, and beating them gives you their chest. With cargo aboard, a boarding could cost what you carry, which is what makes a blockade's ×1.8 a gamble.
- **A.** Nothing taken: a boarding is a fight, as now.
- **B.** If they win (you fall or flee the deck while they hold it), they take half the hold, the dearest goods first. Beat them and nothing is lost.
- **C.** B, and their chest carries some of the goods they took off other ships (one or two crates of a random good), so beating them can pay in cargo too.

Recommendation: **C.** It makes the blockade a real choice (sail through for the price or wait for the sails to pass), and the chest's crates are a reward you can see. One Opus session with a test.

Michael: **B, and their chest carries some of the goods they took off other ships**. (1 Oct 2026)

### A fist on screen in first person — the empty hand (the look builder, Session 380, 2026-10-01, issue #80)
Fists are what an empty hand fights with (your ask, Session 174), but in first person an empty hand draws nothing: no fist and no arm, and nothing moves when you punch. A prototype (Session 380, look builder) builds a fist from the people's shape kit (a rounded hand, four knuckles, the fingers folded under them, the thumb across them, a wrist; about 2,000 triangles, 2,400 wrapped) and shows three ways of carrying it, each at rest, mid-punch and in guard. The arms are today's sleeves from the weapon view, coloured by your chest piece. Gauntlets would tint the hand as they tint the weapon hand now.

- **A.** *(recommended)* **Both fists up**, low in the corners of the screen. The right throws a straight jab that turns palm-down as it lands. The power attack is the same punch, harder. Block brings both fists up to the face. The left hand stays in its guard behind the jab. A shield or torch in the off hand replaces the left fist.
- **B.** **The right fist alone**, where a weapon is held, swinging through today's three sword arcs. It is the least work, but a fist that slashes reads as a backhand.
- **C.** **A, with the hands wrapped** in a pugilist's linen to the wrist, as a boxer or a brawler would.

Shots (rest, jab, guard): [today, nothing](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/fists-today.png) · [A](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/fists-a.png) · [B](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/fists-b.png) · [C](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/fists-c.png). The script is `docs/prototypes/fists/shots.mjs`.

Found on the way, for the systems builder: a punch never lands in play. The swing timer and the deferred strike only advance while a weapon view model exists (`if(vmSword)` in the loop, `js/90-main.js`). With an empty hand the swing sticks at 0.429 s and the strike stays pending, so a dummy takes no damage. The third-person arm also freezes mid-swing. Any of A–C gives the empty hand a view model and so hides this. The root fix is to run the timer outside that block, which is not the look builder's code. `tests/unequip.test.mjs` resolves the strike directly, so it never saw this. Filed as issue #81.

Michael: **A** — Can we make sure the hands look a bit more like actual hands/fists? Also, in the third example image, the wrists don't appear anchored to the arms, and look like they've snapped off. (1 Oct 2026, via the control room)

### What your body wears with the armour slots empty — third person (the look builder, Session 381, 2026-10-01, issue #83)
Since Session 174 every equipment slot can be emptied, but nothing changes on your body. With the chest, legs and feet slots empty, the third-person figure still wears the tunic, breeches and boots you coloured in the creator, so taking off the Tattered Tunic changes nothing you can see. A prototype (Session 381, look builder) dresses the same figure three ways, as a man and as a woman, from the front and from behind:

- **Today.** The creator's clothes are the base layer, and armour goes over them. An empty slot just means "no armour". Nothing to build.
- **B.** *(recommended)* **Underclothes.** An empty chest slot shows an undyed linen shirt cut at the shoulder, with bare arms. Empty legs show linen braies, and empty feet show bare feet. The creator's colours then dye the starting tunic, breeches and boots: the items, not the body. Taking them off reads at a glance.
- **C.** **B, but the shirt has long linen sleeves.** It is more covered and reads less clearly as undressed.

Shots: [today / B / C, a man and a woman](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/barebody-grid.png). The script is `docs/prototypes/barebody/shots.mjs`. In the prototype the feet are only boots in skin colour; the build would give them a foot of their own. The shirt keeps the tunic's cut for the shot, and the build would make it plainer and shorter. Undressing in the street is a register question too: whether townsfolk should remark on it is the quest writer's, not part of this.

Michael: **B** — . (1 Oct 2026, via the control room)

### Should the town guards wear the armour kit too? (the look builder, Session 385, 2026-10-01, issue #87)
Session 384 put your B on #76 into the game: the player's armour is now lamellar, a muscle cuirass, mail or plate by material. The town guards still wear the people's steel bowl helm over a coloured coat, so a guard now looks less armoured than a player in Wooden armour. A prototype (look builder, Session 385) dresses four guards (a man, a woman, an Old Blood man from behind, and a captain) three ways.
- **A. Today.** The bowl helm and the coat. No cost.
- **B. Every guard in Iron mail** with the nasal helm.
- **C.** *(recommended)* **By the town's wealth**, the same rule as the townsfolk's clothes (your A on Session 246). In a poor town the guards wear Wooden lamellar, in a middling one Iron mail, and the captain of a keep wears Steel plate. A town's guards would tell you what the place can afford.

Cost: a guard is 5,080–5,572 triangles today, 9,992–10,484 in B and 8,910–11,626 in C (lamellar is the heaviest, mostly its lacing, which can be thinned). The distant copy past 17 units is 2,122–2,440 today, 4,640–4,958 in B and 3,737–6,308 in C. A town has a handful of guards, so this adds roughly 20–40k triangles in a walled town. Shot: [today / B / C](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/guardarmour-grid.png). PR #82.

Michael: **C** — . (1 Oct 2026, via the control room)

### Sailing — should the sea wear the ship, and how is she mended? (the designer, 2026-10-01)
Today the sea has no state and the ship no condition: the swell is the same in calm and storm, shallows stop her for free, and pirates' volleys hit only you, so a voyage costs nothing but time. Which loop should sailing take, with waves that pitch and roll her by sea state (calm, moderate, rough, storm; open water one rougher) and a hull and rig that can be hurt? (Page: `docs/design/sailing.md`.)
- **A.** Wear and mend: storms (worst under full sail), rough open water, grounding at speed, rams and pirate volleys wear the hull and rig; you patch at the cabin's bench with planks and pitch (Joinery sets how much and how far, Woodcutting brings the logs), the shipwright mends to full for 4 gold a point, and a ship sunk is raised again for 30% of her cost. Four Opus sessions and one look session.
- **B.** A, plus the helm as a 22nd skill, Seamanship (perks: shallows on the minimap, reefed sails, the ram, speed in heavy seas). Five Opus sessions.
- **C.** B, plus a crew hired by the hand, paid by the day and fed from the hold. One Fable and five Opus sessions.

Recommendation: **A.** It is the backlog note item by item, and its numbers make the long voyage of your survival answer: an evening at sea wears her past the planks she carries, so you land and cut wood; Joinery's perks carry the progression without a new skill, and C's crew brings back the upkeep you passed over in survival C.

Michael: **A** — I also don't hate the idea of hiring a crew, but we can ignore that for now. Good thing to revisit eventually. (1 Oct 2026, via the control room)

### Cargo trading between ports — what does a hold of goods earn, and how? (systems builder, 2026-10-01, issue #88)
Backlog B has carried *cargo trading between ports with prices by island* since the first backlog, with no rule behind it. Today a counter's price is the town's (prosperity, Charisma's 1% a point, a faction's discount), the same for every good on every island; the ship's hold only adds carry weight (+25 a tier, up to +50, while aboard or within 20 units). Canon §1 gives each island its trade: the Gatelands grain, cattle, wool, horses; the Mark iron, silver, timber, furs; Aurenne salt, dyes, glass, fish. Which shape should trade take?
- **A.** Trade goods by island: a dozen bulk goods (wool, iron, salt, dyes…), cheap where they are made and dearer on the other islands (about ×0.6 at home, ×1.4 abroad), bought and sold only at a harbour's factor, heavy enough that the hold matters. The price moves with what you sell (each crate sold drops it a few per cent, recovering over days), so one route can't be milked. The Compact's tithe takes 10% of a sale in its ports. Two Opus sessions.
- **B.** A, plus prices that follow the world: a sacked or occupied town pays more for grain and iron, a war raises iron and horses, a blockade (pirates on a route) doubles the gap. Three Opus sessions; it makes the war and the sackings a reason to sail.
- **C.** No new goods: ordinary loot and shop stock sell for more on the island that lacks them (a Markish sword dearer in Aurenne). One session, but it rewards hauling what you found, not trading.
- **D.** Not yet: wait for the survival skills (`docs/design/survival-and-alchemy.md`), so cargo can be what you make.

Recommendation: **B**, built as A first. It is the brief's first feeling at sea: a choice (the war's town or the safe one) with a consequence you can see in the price, and the hold upgrades get a reason. A's falling price keeps it from being *buy more/better*.

Michael: **B** — trade goods by island, plus prices that follow the world. (1 Oct 2026, via the control room; issue #88)
A's part built in Session 390 (`tests/cargo`); the world's prices (B) are the next sessions.

### Lock-on from a trackpad — a key as well as the middle button? (systems builder, 2026-10-01, issue #89)
Lock-on (Session 297) is the middle mouse button only, and the switch (Session 312) a flick of the mouse. A laptop trackpad has no middle button, so a player without a mouse cannot lock on at all, and the brief says the build must stay playable on a laptop. Sessions 297, 298 and 312 each left a key as your call; it was never asked.
- **A.** Add **R** as a second lock key (toggle, same rules as the button); with a lock held, **R** again lets go. R is unbound today.
- **B.** A, and **Z** and **X** to switch to the next foe left or right while locked, for a trackpad that can't flick cleanly. Z is unbound; X is used only in the character creator.
- **C.** No key: the game is played with a mouse.

Recommendation: **A.** One key, one Opus session with a test; a trackpad still moves the pointer, so the flick can switch foes; B can follow if that proves clumsy in play.

Michael: **A** — add R as a second lock key. (1 Oct 2026, via the control room; issue #89)
Done, Session 389: R toggles the lock through the game's own keydown, same rules as the middle button; `tests/lockon`.

### Should the helmed foes wear the armour kit too? (the look builder, Session 397, 2026-10-01, issue #94)
Since Sessions 384 and 395 the player and the town guards wear the armour kit: lamellar, a muscle cuirass, mail or plate by material. The foes who wear armour today still have the people's steel bowl helm over cloth: the Deserter, the Bandit Captain, the dungeon's Shieldbearer and the Ash Wight. Beside a guard in mail, a bandit captain now looks like a man in a hat. A prototype (look builder, Session 397) dresses all four two ways:

- **A. Today.** The bowl helm over cloth. No cost.
- **B.** *(recommended)* **Each in the kit as his story dresses him**, a fixed piece list per foe: the Deserter in his old army's Iron mail and nasal helm; the Bandit Captain in looted pieces (a Wooden lamellar cuirass and vambraces under an Iron helm); the Shieldbearer in a Steel plate cuirass and helm over Iron mail sleeves and greaves; the Ash Wight in Iron mail rusted nearly black, as the dead's blades are. The unhelmed foes (bandits, archers, highwaymen, cultists, the risen dead) stay in cloth.
- **C. B, but the metal by the foe's level**: a level-20 Shieldbearer in Mithril plate, a low one in Iron. It ties what a foe wears to what it can drop, and needs a rule for which levels map to which material (it touches loot, the systems builder's).

Cost: these foes are 4,922–5,844 triangles today and 8,822–10,568 in B (the distant copy 2,150–2,619 today, 3,755–5,271 in B). A camp has one captain; a dungeon floor a few Shieldbearers. Shot: [A / B](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/foearmour-grid.png). The script is `docs/prototypes/foearmour/shots.mjs`. Found on the way: a curly-haired Shieldbearer's hair poked through the closed helm; that was the kit's bug for the player too, and Session 398 fixed it (the full styles are cut to the skull under any kit helm), so it is not part of this question.

Michael: **B** (1 Oct 2026, via the control room; recorded by the producer on issue #94).

Built in Session 403 (look builder): B as in the prototype. `FOE_DRESS` carries each foe's `kit` (and the Ash Wight's rust) and `buildFoe` dresses it; 9,008–10,410 triangles a foe, 3,684–5,082 at a distance. `docs/prototypes/foearmour-ingame.png`, `tests/foearmour.test.mjs`.


### Should the town guards wear the armour kit too? (the look builder, Session 385, 2026-10-01, issue #87)
Session 384 put your B on #76 into the game: the player's armour is now lamellar, a muscle cuirass, mail or plate by material. The town guards still wear the people's steel bowl helm over a coloured coat, so a guard now looks less armoured than a player in Wooden armour. A prototype (look builder, Session 385) dresses four guards (a man, a woman, an Old Blood man from behind, and a captain) three ways.
- **A. Today.** The bowl helm and the coat. No cost.
- **B. Every guard in Iron mail** with the nasal helm.
- **C.** *(recommended)* **By the town's wealth**, the same rule as the townsfolk's clothes (your A on Session 246). In a poor town the guards wear Wooden lamellar, in a middling one Iron mail, and the captain of a keep wears Steel plate. A town's guards would tell you what the place can afford.

Cost: a guard is 5,080–5,572 triangles today, 9,992–10,484 in B and 8,910–11,626 in C (lamellar is the heaviest, mostly its lacing, which can be thinned). The distant copy past 17 units is 2,122–2,440 today, 4,640–4,958 in B and 3,737–6,308 in C. A town has a handful of guards, so this adds roughly 20–40k triangles in a walled town. Shot: [today / B / C](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/guardarmour-grid.png). PR #82.

Michael: **C** — by the town's wealth. (1 Oct 2026, via the control room)

Built in Session 395 (look builder): `personGenome` dresses a guard of a place by its prosperity — Wooden lamellar under 40, Iron mail at 40 and over, Steel plate for a captain — with the kit's helm and the guard's own boots. `docs/prototypes/guardarmour-ingame.png`, `tests/guardarmour.test.mjs`.

### The worn armour — what each material looks like on the body (the concept artist, 2026-09-30, issue #76)
Today all ten materials have the same armour on the body and only the colour changes: a smooth shell over the tunic, a ball on each shoulder, a ring at the belt, a cylinder at each knee and forearm, and a bowl helm with a brim. `docs/prototypes/armour/` (auto/concept) makes the armour from the people's shape kit, baked into the body so it bends and walks with them. It has four builds. **Wooden** is laced lamellar with a laced skull-cap and a leather curtain at the neck. **Bronze** is a muscle cuirass with a skirt of leather strips and a crested helm open at the face. **Iron** is a mail shirt to mid-thigh with a conical helm, a nose guard and a mail curtain. **Steel** is plate: a ridged breastplate, hooped plates below it, thigh plates, shoulder guards of three plates each, elbow and knee cops, plated shins and feet, and a closed rounded helm with an eye slit. Under the armour the tunic and breeches keep the character's own cloth colour.
- **A.** The four builds. Mithril to Cosmic wear the Steel plate in their own colour (the weapon kit's rule).
- **B.** *(recommended)* The four builds, and each rare metal gets a mark of its own: Mithril fluted, Adamant heavy with a crest and rivets, Obsidian cut into flat faces with glowing seams, Draconic scaled with swept-back horns, Demonic spiked with horns curving forward, Cosmic smooth with rings of light and a halo. A rare set changes your silhouette as well as your colour (the brief's progression).
- **C.** Today's one shape with detail added (rims, straps, plates). All ten materials still share one silhouette.

Cost: the whole player figure is 5,254 triangles today and 8,208–10,544 with a proposed set (Steel and every A-row metal 8,208; the B signatures 8,551–9,936; Wooden 10,544, of which the lacing is about 500 and can be thinned). Open inside the answer: is "Wooden" armour wood (lamellar, as shown) or leather?
Shots: [lineup, today / B / A](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/armour/lineup.png) · [the four builds](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/armour/families.png) · [side and back](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/armour/side.png) · [the rare metals](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/armour/rare.png) · [in scale](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/armour/scale.png)

Michael: **B, the four builds plus a mark for each rare metal**. (2026-09-30)
Done, Session 384 (look builder): the concept artist's kit is in the game as drawn — `AR_FROM_EQ`/`ARMOUR_DRESS` in `js/32-people.js`, read by `tpBuild`; Wooden stays lamellar, as shown. `tests/armourkit.test.mjs`, `docs/prototypes/armour-ingame.png`.

### Unblock auto/systems — CI cannot confirm the branch clean on 32ed275 (the producer, 2026-09-30)
auto/systems (PR #22, head `32ed275`, Sessions 373–376: the Caer Slige duel with Rowe's yield, seen-theft and lockpick-timing
tests) has never been approved and its CI has not come back clean on two tries. The first run failed `watch.test.mjs`'s
favour −2 trailing-guard assertion — the exact assertion `blockers/mainrun-red-main` already ruled a CI-timing flake this
week, seen on four other branches that don't touch the night watch. The one allowed re-run (of the failed jobs only) came
back worse, not better: three of eight shards (3, 5, 8) were killed at the 30-minute job timeout with no assertion failure
at all, the same shared-runner pattern already ruled a flake and merged anyway four times this week (`unblock-auto-systems`,
`unblock-systems-walls-lod`, `unblock-systems-hourhitch-3`, `unblock-auto-backlog`). Nothing in Sessions 373–376 touches
shaders, frame timing, or the night watch's guard-following code. No agent is set to work on CI timing; a third re-run
would only repeat one of these two patterns.
- **A. Merge anyway** *(recommended)*: Claude merges 32ed275 onto main now as a `merge-anyway` line; if the watch-test
  timing keeps flaking, the systems builder widens its tolerance next time it's convenient, the same fix pattern as S362's
  hourhitch budget.
- **B. Wait for a clean run.** Leave it blocked; no agent is set to touch shard timing or the watch-test tolerance, so it
  could sit a while on a busy shared runner.
- **C. Re-run once more first.** One more push of luck against the same 30-minute runner ceiling that has already
  timed out three of eight shards once this head.

Michael: **A** — merge anyway. (30 Sep 2026, via the control room)
Corrected, superseded before the merge-anyway line was written: Session 378 (new head `68d1620`) found the real bug —
the street grid was read once at the build while solids keep arriving after, so a guard sent along a way through a cell
gone solid stood against it for good — and fixed it properly (every way now checked against live solidity). `watch` is
8/8 and the rest of the suite passes on the new head. 32ed275 was never merged; the new head needs its own clean CI run
and its own approval before it queues. Same pattern as `unblock-systems-hourhitch-3`.

### After the split lands — does the way back stay in the repo? (Fable, split tooling, Session 368, 2026-09-30, issue #75)
Backlog K step 1 is built on auto/split: `scripts/split.py` cuts the script at 33 pattern-found seams, `scripts/join.py`
reassembles the one-file build from `js/manifest.json` and proves it byte-identical. `docs/design/split-plan.md` §5 left
one thing open: what happens to `join.py` and the manifest once switch-over day has passed and the builders are editing
`js/`. From then on `join.py` only reproduces the *frozen* build (the manifest's hash), never the current code, so it is a
receipt, not a tool. `split.py` itself stays useful for a stray late branch (cherry-pick onto the pre-split commit, re-run
it, diff `js/`).
- **A. Keep both one release, then drop them** *(recommended)*: the receipt is there while anyone might doubt the split;
  the day's session notes in the devlog which later session removes them.
- **B. Keep them for good**: a few kilobytes; `join.py` also documents the file order for a reader who has never seen
  the one-file build.
- **C. Delete them on the day**, in the switch-over commit: the manifest's hashes and the CI run are proof enough.

Michael: **A. Keep both one release, then drop them** — . (30 Sep 2026, via the control room)

### A fist on screen in first person — the empty hand (the look builder, Session 380, 2026-10-01, issue #80)
Fists are what an empty hand fights with (your ask, Session 174), but in first person an empty hand draws nothing: no fist and no arm, and nothing moves when you punch. A prototype (Session 380, look builder) builds a fist from the people's shape kit (a rounded hand, four knuckles, the fingers folded under them, the thumb across them, a wrist; about 2,000 triangles, 2,400 wrapped) and shows three ways of carrying it, each at rest, mid-punch and in guard. The arms are today's sleeves from the weapon view, coloured by your chest piece. Gauntlets would tint the hand as they tint the weapon hand now.

- **A.** *(recommended)* **Both fists up**, low in the corners of the screen. The right throws a straight jab that turns palm-down as it lands. The power attack is the same punch, harder. Block brings both fists up to the face. The left hand stays in its guard behind the jab. A shield or torch in the off hand replaces the left fist.
- **B.** **The right fist alone**, where a weapon is held, swinging through today's three sword arcs. It is the least work, but a fist that slashes reads as a backhand.
- **C.** **A, with the hands wrapped** in a pugilist's linen to the wrist, as a boxer or a brawler would.

Shots (rest, jab, guard): [today, nothing](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/fists-today.png) · [A](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/fists-a.png) · [B](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/fists-b.png) · [C](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/fists-c.png). The script is `docs/prototypes/fists/shots.mjs`.

Found on the way, for the systems builder: a punch never lands in play. The swing timer and the deferred strike only advance while a weapon view model exists (`if(vmSword)` in the loop, `js/90-main.js`). With an empty hand the swing sticks at 0.429 s and the strike stays pending, so a dummy takes no damage. The third-person arm also freezes mid-swing. Any of A–C gives the empty hand a view model and so hides this. The root fix is to run the timer outside that block, which is not the look builder's code. `tests/unequip.test.mjs` resolves the strike directly, so it never saw this. Filed as issue #81.

Michael: **A** — Can we make sure the hands look a bit more like actual hands/fists? Also, in the third example image, the wrists don't appear anchored to the arms, and look like they've snapped off. (1 Oct 2026, via the control room)

Built in Session 396 (look builder): A, with a new fist (four fingers folded in two joints, the knuckles, the thumb across the first two fingers, a tapered wrist) built in one mesh with its forearm to the elbow, so the wrist cannot leave the arm; the arm bridge runs from the shoulder to that elbow. `docs/prototypes/fists-ingame.png`, `tests/fists.test.mjs`.

### What your body wears with the armour slots empty — third person (the look builder, Session 381, 2026-10-01, issue #83)
Since Session 174 every equipment slot can be emptied, but nothing changes on your body. With the chest, legs and feet slots empty, the third-person figure still wears the tunic, breeches and boots you coloured in the creator, so taking off the Tattered Tunic changes nothing you can see. A prototype (Session 381, look builder) dresses the same figure three ways, as a man and as a woman, from the front and from behind:

- **Today.** The creator's clothes are the base layer, and armour goes over them. An empty slot just means "no armour". Nothing to build.
- **B.** *(recommended)* **Underclothes.** An empty chest slot shows an undyed linen shirt cut at the shoulder, with bare arms. Empty legs show linen braies, and empty feet show bare feet. The creator's colours then dye the starting tunic, breeches and boots: the items, not the body. Taking them off reads at a glance.
- **C.** **B, but the shirt has long linen sleeves.** It is more covered and reads less clearly as undressed.

Shots: [today / B / C, a man and a woman](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/barebody-grid.png). The script is `docs/prototypes/barebody/shots.mjs`. In the prototype the feet are only boots in skin colour; the build would give them a foot of their own. The shirt keeps the tunic's cut for the shot, and the build would make it plainer and shorter. Undressing in the street is a register question too: whether townsfolk should remark on it is the quest writer's, not part of this.

Michael: **B** — Underclothes. (1 Oct 2026, via the control room)

Built in Session 394 (look builder): `tpBuild` dresses an empty chest in a linen shirt cut at the shoulder (bare arms, no trim, a shorter hem), empty legs in linen braies and empty feet in bare feet with a foot of their own; first person shows a bare arm. `docs/prototypes/underclothes-ingame.png`, `tests/underclothes.test.mjs`.

### A one-room shop's strongbox by day — seen always, never, or when the keeper looks away? (systems builder, Session 365, issue #73)
A shop with a back room keeps its strongbox behind a shut door, and the keeper never sees it there. A one-room shop keeps the box in the shop itself. A keeper indoors sees you within six units with a clear line, and walks the floor all day. `tests/shopsight` measured 13 one-room shops in four towns at 13h, with ten minutes of the keeper's own walk each, and they split in two. Eight are seen 93–100% of the time. Five are seen 0–10%: Dunmore's three Goods shops, Odhrán's Stores and Mira's Apothecary, where the box stands 5.5–6.6 units from the counter.

- **A. The keeper sees the whole room.** In a one-room shop, a keeper who is inside sees you anywhere in it. The box is taken at night, through the door. One short session.
- **B. The keeper sees what they face** *(recommended)*. Indoors, sight becomes a cone the way the keeper is facing (about 120°) as well as the six units. Their walk already turns them every 1.5–5 s, so every one-room shop has gaps a player can watch for. One session.
- **C. Leave it.**

Michael: **B** — . (30 Sep 2026, via the control room)

### Hesket Rowe at the yard — can she survive the League's duel? (the quest writer, 2026-09-30, issue #69)
The quest writer has drafted the real duel at Caer Slige (`docs/quest_drafts.md`, *The Yard at Caer Slige*). Today the League's ninth service kills Hesket Rowe: it is a fight with a Bandit Captain wearing her name, and the Captain's line after it mentions her burial. In the Crown's and the Compact's lines she is alive at the finale. With a yield in the ring, her fate becomes the player's call.

- **A. She lives if she yields and is spared** *(recommended)*. The yard's law is that nobody touches a fighter who has yielded. If the player strikes her after she yields, she dies, the yard calls it murder, and the League closes to the player. If she's spared, she stays at Caer Slige to watch the spire.
- **B. The duel is to the death, as built.** Only the player can yield.
- **C. She always lives.** The watchers catch any blow after her yield.

The draft is written for A. B and C each change only the lines marked **(fate)**.

Michael: **A** — . (30 Sep 2026, via the control room)
Built, Session 373 (systems builder): the draft's yard, fight, both yields, murder and the turn-ins, word for word, with the ring's hours; `tests/duel` 17/17. Session 374 built the rest: Rowe at the seat afterwards (spared, or Captain for the rematch week), the murder rumour in the Mark, and no ring while Caer Slige is occupied; `tests/duel` 21/21.

### Making a spell — the Magic tab for words of the deep tongue (the concept artist, 2026-09-29, issue #67)
`docs/prototypes/spellmaking/index.html` (auto/concept) shows three layouts of the parchment composing page: a player making Cloch, laid (a stone pillar, 55 mana) from an Evoker's four of five forms and seven known words of twenty-four. What each word does in each form is later text for the quest writer.

- **A. The page** *(recommended)*: words by school on the left; the spell written as a sentence in the middle, with every form's line and cost, riders as chips, mana worked out; the book of eight on the right.
- **B. The table**: every word against every form, 35 cells at once, growing to 24 rows by the end.
- **C. The ring**: a carved circle of words and forms with a line drawn between two joined; most like a sigil, least legible.

Michael: **A** — . (30 Sep 2026, via the control room)

### Survival skills and alchemy — what should mining, woodcutting, cooking and alchemy make? (the designer, 2026-09-30)
Today herbs are eaten one at a time (a known effect, and one of 21 hidden effects after 15 eats); nothing combines them, food is shop stock, and nothing can be mined or felled. What should the five land skills of the Morrowind book (Alchemy, Cooking, Mining, Woodcutting, Joinery) do, given *not buy more/better* and *not punishing*? (Page: `docs/design/survival-and-alchemy.md`.)
- **A.** The still and the fire: a tincture from two herbs (one's known effect, the other's hidden one), which turns after 5 game-days as the canon's folk brews do; meals at any fire give one mild *fed* effect; ore goes to the smith's tempering (up to +24%) and logs to campfires and the shipwright; a felled trunk can bridge a gap (Woodcutting 25). No player-made gear, no hunger. Four Opus sessions.
- **B.** Gather, work, make: A plus Smithing and Joinery, which make weapons and armour tier by tier. Loot and prices retuned across every tier. One Fable and six Opus sessions.
- **C.** Survival in earnest: A plus hunger, warmth and fatigue. Six Opus sessions.

Recommendation: **A.** Each skill lands in a system that exists or is decided (the buff stack, the fires, the smith, sailing's repairs, the platforming), the brewing shares magic's body-and-rider grammar, and it leaves loot its point; B makes chests pointless and C adds upkeep the brief rules out.

Michael: **B** — Alchemy should have 3-4 effects per harvestable item / herb, like elder scrolls. Unlocked on successful combinations.

If we are going to have mining we will also need smithing / joinery. Woodcutting also has fletching for bows and arrows.

I am envisioning a player sailing for a long while, and having to stop to cut wood to repair their ship, maybe to collect materials to make arrows / collect herbs and food. (30 Sep 2026, via the control room)

### A one-room shop's strongbox by day — seen always, never, or when the keeper looks away? (systems builder, Session 365, issue #73)
A shop with a back room keeps its strongbox behind a shut door, and the keeper never sees it there. A one-room shop keeps the box in the shop itself. A keeper indoors sees you within six units with a clear line, and walks the floor all day. `tests/shopsight` measured 13 one-room shops in four towns at 13h, with ten minutes of the keeper's own walk each, and they split in two. Eight are seen 93–100% of the time. Five are seen 0–10%: Dunmore's three Goods shops, Odhrán's Stores and Mira's Apothecary, where the box stands 5.5–6.6 units from the counter. Whether a daylight theft is possible comes down to how wide the room happens to be.
- **A. The keeper sees the whole room.** In a one-room shop, a keeper who is inside sees you anywhere in it. The box is taken at night, through the door. One short session.
- **B. The keeper sees what they face** *(recommended)*. Indoors, sight becomes a cone the way the keeper is facing (about 120°) as well as the six units. Their walk already turns them every 1.5–5 s, so every one-room shop has gaps a player can watch for. One session.
- **C. Leave it.**

Michael: **B** — the keeper sees what they face (indoor sight becomes a ~120° facing cone plus the six units). (30 Sep 2026, on issue #73)
Built, Session 368 (systems builder): indoors a keeper or a guest sees you only within 60° either side of the way they face, as well as within six units with a clear line. Found on the way: the keeper's walk bounced off its bounds with the axes swapped, so a keeper who reached the counter side walked on into it, facing the box; fixed. One-room shops are now in sight 0–35% of an open day (were 93–100% for eight of them); a 6 s pick is seen 16–85% of the time. Issue #73 closed.

### How to split index.html — file count, naming, cut points, the if(REN) wrapper (Fable exploration, local session, 2026-09-30)
Backlog K's step 1, explored read-only: the one inline script (lines 1130–46307) cuts into ~31 plain `<script src>` files, every cut on a top-level statement boundary. The plan, the hazards and the numbers are in `docs/design/split-plan.md`. Seven questions: Q1 file count (~31, by the natural sections); Q2 naming (`js/NN-name.js`, numbered by load order); Q3 cut points found by pattern, not marker comments; Q4 remove the dead `if(REN){…}` wrapper (15k lines, 44% of the code) in its own commit first; Q5 CI later runs only the suites a change touches, once the layout settles; Q6 the CSS stays in index.html; Q7 step two breaks up the WORLD IIFE, starting with its 4,390-char `return {…}` line — the split alone barely cuts merge conflicts, since both builders edit inside that IIFE.

Michael: **Go with the recommendations** — all seven as above. (30 Sep 2026, in chat with Claude.) Next: a Fable session builds the split script (step 1 of backlog K) from `docs/design/split-plan.md`.

### Unblock auto/systems — hourhitch flakes again on 5633fc4 (the producer, 2026-09-30)
PR #22 (auto/systems, approved head 5633fc4) has gone red a third time on the same test. The push-triggered run finished with 15/16 suites passing and `hourhitch` failing (a frame-timing budget, 399s); the pull-request-triggered run on the identical commit sat "in progress" for over four hours — one shard hung — which kept the merge workflow reporting "CI still running" and never landing the approval. The producer cancelled the hung run this pass so CI can report cleanly. Nothing in this commit (Session 350, the walls/LOD distant-check fix) touches shaders or frame timing, and the systems builder's own Slack note says `hourhitch`'s red is "still not root-caused" — it just hasn't been fixed yet.

- **A. Merge anyway** *(recommended)*: same ruling as twice before (unblock-auto-systems, unblock-systems-walls-lod) — nothing in the diff touches timing, and a shared, congested CI runner is exactly where a fixed-millisecond budget misses. Claude merges 5633fc4 onto main as already approved.
- **B. Wait for a clean run**: leave it queued; no agent is set to touch `hourhitch`, so it could sit a while, especially with the runner backlog seen this run (main's own CI check sat "queued", not even started, for two hours on this pass).
- **C. Fix the budget first**: the systems builder widens `hourhitch`'s timing budget next run, then Claude merges. About one short session.

Michael: **A. Merge anyway** — . (30 Sep 2026, via the control room)

Correction (the producer, 30 Sep, 05:00 UTC): events overtook this answer before it could be carried out. The systems builder pushed Session 362 (`d057a73`), which fixes `hourhitch`'s budget for real rather than re-running it, and Session 363 on top (`f204f21`). 5633fc4 is superseded and was dropped from the merge queue unmerged; it never reached main. The new head's own CI is running — once it's green it needs an ordinary fresh approval (it is not the commit Michael approved here), not this merge-anyway.

### What a night's burglary should pay (systems builder, Session 357, issue #68)
The crime system's owed "numbers by play", measured headless (`tests/burglary.test.mjs`) now that a town lock is picked in a running world (Session 327). Ten minutes of 23h were ticked, and each shop door was asked every tenth of a second whether someone would see a player standing there.
- **The door.** A pick of 3–6 s (four pins by a practised hand) started at a random moment is seen 21–24% of the time in Dunmore (three on the watch) and 11–13% in Portclare (one). Sneaking about halves that. A burglar who waits for the lantern to pass does better still. Homes are almost never seen (0–2%), because the beat walks past the shop doors.
- **Behind it.** No keeper is in a shut shop at night, so the strongbox is always taken unseen: 20–200 gold by prosperity, plus one item. Dunmore's seven boxes hold **910 gold**, Portclare's five **605**, and they refill every five days.
- **Seen.** The pick breaks off, and it costs 25 gold and a point of favour. You can try again a minute later.

So one night in Dunmore expects about 900 gold for one or two 25-gold fines. For scale, a Steel Sword costs 66, quest rewards run 50–500, and four picks cost 48. The design brief says: "not systems that reduce to buy more". Theft that outpays every quest makes buying the answer.

- **A. Cut the strongbox, keep the risk** *(recommended)*: 10 + 50 a 100 prosperity, times the shop's kind as now (Dunmore about 40 a box and 280 a night; a village about 20). The item stays, so a thief's money comes from selling the goods, as in Morrowind and Oblivion. One line of code.
- **B. Keep the takings, raise the risk**: the watchman's lantern sees 10 units at night instead of 6. A door is then seen perhaps twice as often, though the strongbox is still free once you are in. Not yet measured.
- **C. A and B.**
- **D. Leave it** until the skills sessions give Sneak and Security numbers of their own.

Michael: **A. Cut the strongbox, keep the risk** (30 Sep 2026, on issue #68).
*Done, Session 361:* `boxCoins` in the world module: 10 + 50 a 100 prosperity, times the shop's kind (1.2 arms, .8 apothecary), times .8–1.2 luck. Dunmore's seven boxes 285 a night (was 910), Portclare's five 190 (was 605). The item stays; the door's risk is unchanged.

### Making a spell — the Magic tab for words of the deep tongue (the concept artist, 2026-09-29, issue #67)
`docs/prototypes/spellmaking/index.html` (auto/concept) shows three layouts of the parchment composing page: a player making Cloch, laid (a stone pillar, 55 mana) from an Evoker's four of five forms and seven known words of twenty-four. What each word does in each form is later text for the quest writer.

- **A. The page** *(recommended)*: words by school on the left; the spell written as a sentence in the middle, with every form's line and cost, riders as chips, mana worked out; the book of eight on the right.
- **B. The table**: every word against every form, 35 cells at once, growing to 24 rows by the end.
- **C. The ring**: a carved circle of words and forms with a line drawn between two joined; most like a sigil, least legible.

Michael: **A** — the page. (29 Sep 2026, via the control room)

### When should the game autosave? (systems builder, 2026-09-29, issue #66)
The critic's s253: forty minutes on the road ended in a death, and the death loaded the arrival save, which took back 837 gold spent on a coaching road, a coach ride and a dungeon. `saveGame()` runs on zone travel, the Wait button, leaving a dungeon, a book and the safehouse. It never runs on sleeping (inn, camp bedroll, own bed: `restAtBed` does not save), entering a dungeon, buying from a lord, or walking into a town. The ring keeps at most one autosave per 90 real seconds (`SS.lastAuto`), so more moments don't flood it.

- **A. At rest and at thresholds** *(recommended)*: sleeping anywhere, a dungeon door either way, arriving on a town's pad, stepping off the coach. Morrowind's and Oblivion's habit; none of these happen mid-fight.
- **B. A, and a timer**: every 10 real minutes in the open world while no foe is near.
- **C. The minimum**: sleep and a dungeon door only.
- **D. Leave it**: the manual save and today's moments.

Michael: **A** — at rest and at thresholds (29 Sep 2026, on #66, via the producer).

*Done, Session 353:* sleeping anywhere (`restAtBed`), the dungeon door going down (saved at the threshold, in the world; going up already saved), arriving on a town's pad (not with an alert foe within 30, not riding the coach in) and stepping off the coach each autosave. The ring's one-per-90-seconds gate stands.

### Should a mayor offer to build what the town already has? (systems builder, 2026-09-29, issue #65)
The critic's s253: a lord offers *Pay for an inn / a chapel / walls / a guild hall* by what you have paid for there before (`investTopics` reads `st.builds`), not by what stands. Dunmore (prosperity 61) has four inns, a church, two guild halls and log walls, and its lord offers all four. A paid inn, chapel or guild hall where one stands adds no building (the generator adds each shop type once); paid walls only lift a fence to logs below prosperity 45. What the payment still does is add prosperity (+8 to +10) and count toward the three builds that unlock *Take the deed*.

- **A. Offer only what the town lacks** *(recommended)*: no inn where an inn stands, no chapel where a church stands, no guild hall where one stands, no walls where they are logs or better; the well and the harbour as they are. Every payment puts something new in the town. A big town has fewer builds toward the deed (Dunmore: the well only), so see C.
- **B. Leave the offers, change the words**: *Pay to enlarge the inn* where one stands. Same money, prosperity and deed.
- **C. A, and a big town's deed asks for favour instead**: where fewer than three builds are possible, the deed needs favour 8 in place of three builds.
- **D. Leave it.**

Michael: **A** — offer only what the town lacks (29 Sep 2026, on #65, via the producer).

*Done, Session 352:* `buildStands` reads the live town's houses (the plan's list at today's prosperity when it isn't loaded): no inn where an inn stands, no chapel where a church does, no guild hall where either hall does, no walls where the ring is logs or better. Dunmore's lord now offers the well only. Walls stay on offer in villages and ports, which have no ring: there a payment builds nothing you can see, though at a port it keeps the black sails off.

### Unblock auto/systems — a walls/LOD test failed on one of two CI runs (the producer, 2026-09-29)
PR #22 (auto/systems, head 7e4b078) had two CI runs on the identical commit: the push-triggered run passed all 18 suites clean; the pull-request-triggered run failed one — walls.test.mjs's distant-LOD check ("its detailed clusters show near and give way to their plain twins far") — with the other 17 suites green. Session 341, the only change since Michael's last approval, touches buff stacking (a weaker herb or Shield no longer ending a stronger shrine boon); nothing in it touches walls, towers, or LOD. Same pattern as the unblock-auto-systems flake Michael ruled on two days earlier.

- **A, merge anyway** *(recommended)*. Nothing in Session 341's diff touches walls, towers, or LOD, and the identical commit already ran clean on a separate trigger.
- **B, wait for a clean run.** Leave it blocked until CI happens to pass clean on this exact head on both triggers.
- **C, re-run once more first.** Trigger a fresh CI run on this head and see if it clears before merging.

Michael: **A — merge anyway.** (29 Sep 2026, via Slack)

Claude merged 7e4b078 onto main as 1445aaf. Session 350 (on auto/systems) root-caused it for real afterwards: the check measured a town the loader had already streamed out, 1,300 units off, in 1 run in 3; it now measures the live town and passes 6 of 6.

### What Fortune's *+1% loot quality* does (systems builder, 2026-09-29, issue #64)
The Fortune card promises *+2% crit chance, +1% loot quality* a point. The crit is built (Session 328). No code reads loot *quality*: a dropped sword is the same tier at Fortune 0 and 10. Fortune does two things the card never mentions, both since v61c0: +5% a point on every gold roll (`rollGold`: barrels, corpses, chests), and +2.5% a point on the chance a slain foe drops an item (`lootDropChance`, base 35%). A Fortune build gets something real but is told something else.

- **A. Make the card say what Fortune does** *(recommended)*: *+2% crit chance, +5% gold found, +2.5% item drop chance* a point. No rule changes, and it is the truth.
- **B. Keep both, and add quality**: each point is a 1% chance that a dropped or chest piece of gear comes one material up (Iron → Steel), never past Cosmic.
- **C. Quality instead of more gold**: B's 1% a point for the tier, and the gold roll's +5% a point is removed (the drop chance stays).
- **D. Leave it** until the skills proposal decides what Fortune is for.

Michael: **A** — make the card say what Fortune does. (29 Sep 2026, via the control room; issue #64) Built in Session 346: the card, the level-up lines and the hub read +2% crit, +5% gold found, +2.5% item drop chance a point.

### The interiors' shells on the kit — posts and joists, or only the trim? (the look builder, Session 336, issue #62)
The furniture and the windows are on the kit now, and the room around them is the flattest thing left: four flat wall planes, a flat dark ceiling, square box beams, a plain brown door, and in Aurenne's rooms square box studs. A prototype builds a kit shell for the generated rooms (homes, shops, inns, halls): walls keep their plaster, rubble or ashlar textures.

- **A — the full frame** *(recommended)*: posts, knee braces, sole/wall plates (a plinth and corbels in stone), a joisted boarded ceiling, a plank door. 4.0–7.8k triangles a room.
- **B — the trim only**: plates, shading, ceiling and door, without posts or braces. 2.8–6.9k triangles.
- **C — A in homes/inns/shops, B in guild halls/churches/keep halls**, whose own columns and furniture already carry the room.
- **D — leave the shells as they are.**

Michael: **A** — the full frame. (29 Sep 2026, via the control room)

### Chimney smoke — should the towns' chimneys smoke, and when? (the look builder, Session 337, issue #63)
Two in three houses in a town have a chimney and none of them smoke. A prototype draws each town's smoke as one Points object, tinted by the hour and drifting on the world's wind, laid flat in a storm. Dunmore: 33 chimneys, 792 puffs, one draw call.

- **A.** Every chimney smokes, day and night.
- **B** *(recommended)*: by the hearth's hours — inn/smithy/guild halls all day; homes 6–9 and 17–23; every chimney all day in snow and tundra.
- **C.** Only the inn and the smithy.
- **D.** No smoke.

Michael: **B** — by the hearth's hours. (29 Sep 2026, via the control room)

### Should the game stay one HTML file? (Claude, local session, 2026-09-29)
The file is 41k lines and every builder edits it: merges conflict (the producer resolved eleven in one merge on 29 Sep) and CI runs every suite on every change. Splitting it into several files helps both. Players reach the game through itch.io (a zip with `index.html` inside) and the Pages link, where several files play the same; the game already needs a connection for three.js.

Michael: **Split it** — the one-file rule was a self-imposed restriction. (29 Sep 2026, in chat with Claude.) Filed as backlog K, a Fable session with a short freeze of the two code builders.

### Chimney smoke — should the towns' chimneys smoke, and when? (Session 337, issue #63)
Two in three houses in a town have a chimney (the detailed houses since Session 194), and none of them smokes; the Hearthwick quest's own journal line says "Chimney smoke ahead — a village". Since Session 330 the world keeps a wind (`windDir()`), which only the ships read. I prototyped smoke on a patched copy of the build: each detailed house records its chimney's top, and a town draws all its smoke as one Points object, two dozen soft puffs a chimney that rise, drift downwind, swell from half a unit to three and fade over ten seconds. It is tinted by the hour, and a storm lays it flat and fast. Dunmore has 33 chimneys: 792 puffs, one draw call, positions kept relative to the town's centre (the float32 rule).

Pictures: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/smoke-dunmore.png (Dunmore without smoke at noon, then with it at noon, twenty hours later when the wind has turned, at dusk, close by a house, and in a storm).

**Options**
1. Every chimney smokes, day and night.
2. **By the hearth's hours (recommended):** the inn, the smithy and the guild halls all day, where they have a chimney; homes in the morning (6–9) and the evening (17–23), with a thin thread between; every chimney all day in snow and in the tundra. The game has no seasons, so there is no winter rule. Nothing from burned or abandoned houses, which have no chimney.
3. Only the inn and the smithy.
4. No smoke.

Recommendation: 2. A town that lights its fires for breakfast and supper looks lived in, and the rhythm costs nothing to compute. It also follows the world's wind the way the sails do.
Michael: **B** (option 2), by the hearth's hours. (29 Sep 2026)
Done, Session 343: each detailed house records its chimney's top, and a town's smoke is one Points object (24 puffs a chimney) that rises, drifts along `windDir()` and fades, tinted by the hour. The inn, the smithy, the armourer and the guild halls smoke at every hour; homes and the other shops in full 6–9 and 17–23, a thread (.3) 9–17 and cold 23–6; every chimney at every hour in snow and in the tundra, easing between over a few seconds. A storm shortens the puffs' life so the plume lies flat without beading. `tests/smoke.test.mjs`, `docs/prototypes/smoke-ingame.png`.

### The interiors' shells on the kit — posts and joists, or only the trim? (Session 336, issue #62)
The furniture and the windows are on the kit now, and the room around them is the flattest thing left: four flat wall planes that meet the floor and each other with a hard edge, a flat dark ceiling, square box beams, the entrance door a plain brown box, and in Aurenne's rooms square box studs. I prototyped a kit shell for the generated rooms (homes, shops, inns, halls). The walls keep their plaster, rubble or ashlar textures; the furniture, windows and layouts do not move.

- **A — the full frame:** in plastered rooms, posts at the corners and under each beam's ends where no window stands, with knee braces up to the beam and the wall plate, a sole plate along the foot and a wall plate along the head; Aurenne's rooms keep their close studding, a post every 1.6, on the kit. In stone rooms, a plinth course of blocks along the foot and stepped stone corbels under each beam's ends instead of posts. Everywhere: rounded beams carrying joists and a boarded ceiling, the walls darkened at the foot, the head and in the corners (the dungeon shell's shading), and the entrance a plank door with ledges, a brace, strap hinges and a ring, in a timber frame or a stone surround. 4.0–4.4k triangles a plastered room, 7.8k a stone one, two draw calls.
- **B — the trim only:** the sole plate or plinth, the wall plate, the shading, the joisted ceiling and the door, without posts, braces or corbels; Aurenne's box studs stay as today. 2.8k triangles a plastered room, 6.9k a stone one.

For scale, a room's furniture bake is 10–28k and its window frames 4–14k.

Pictures (each: today, A, B; left looking up the room, right looking back at the door): https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/shells-gatelands.png (a Gatelands home), https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/shells-aurenne.png (Aurenne), https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/shells-mark.png (the Mark, rubble), https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/shells-stone.png (a stone house).

**Options**
1. **A, the full frame (recommended).**
2. B, the trim only.
3. A in homes, inns and shops; B in guild halls, churches and keep halls, whose own columns and furniture already carry the room.
4. Leave the shells as they are.

Recommendation: 1. The posts and braces are what make a Gatelands or Aurenne room read as a timber-framed house rather than a box with a texture, and the cost is a fifth of a room's furniture. Churches, keep halls and Hearthwick's old rooms would follow in later sessions, as the windows did.
Michael: **A**, the full frame. (29 Sep 2026)
Done, Session 342: every generated room but the church, the keep's hall and the tower has the kit shell (`buildInteriorFor`): a boarded ceiling over joists every .5, rounded beams, the walls shaded at the foot, the head and the corners; posts, knee braces (a bracket where a window is within 1.2), a sole plate and a wall plate in plastered rooms, Aurenne's close studding a post every 1.6; a plinth and stepped corbels in stone and rubble rooms; the plank door at the entrance. The frame is built after the furniture, so a post gives way to anything solid against the wall; each post is a solid. `tests/shells.test.mjs`, `docs/prototypes/shells-ingame.png`.

### The interiors' windows on the kit — which frame, in which rooms? (Session 305, issue #53)
Every interior window today is a flat pane on the wall: a painted view of the town at dusk in the generated rooms, the same in a box frame in Hearthwick's old rooms, and a plain lit rectangle in a church. Now that the furniture is on the kit, the windows are the flattest thing left in a room. I prototyped three kit windows. In each, the painted view stays, set back behind the frame. They are not in the game.

- **A — leaded casement:** a plastered reveal with splayed jambs and head, a stone sill, an oak frame with a mullion and transom, and diamond leading. 2.4k triangles.
- **B — shuttered timber window:** a lintel beam, four panes behind glazing bars, two plank shutters folded back on strap hinges, and a plank sill. 1.1k triangles.
- **C — round-headed stone window (churches and keep halls only):** coursed jambs, a ring of nine voussoirs, a moulded sill, and square lead quarries. 1.4k triangles. In the church's picture its low windows take A.

A room has four to eight windows, so this adds about 4–19k triangles to its furniture bake, with no extra draw calls. For scale, a room's furniture bake is 10–28k.

Pictures: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/windows-home.png (a home: today, A, B) and https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/windows-church.png (a church: today, C).

**Options**
1. A in every room, and C for the tall windows of churches and keep halls.
2. **By the room (recommended):** B in homes, cabins and the poorer rooms; A in shops, inns and guild halls; C in churches and keep halls. The frames then step from rough to fine with the room, and the painted view stays in all of them.
3. B in every room, and C for churches and keep halls.
4. Leave the windows as they are.

Recommendation: 2. It gives the same kind of variety by wealth that the townsfolk's clothes got (Session 268), and each builder can take a window by the room's type without changing a layout.
Michael: **2 — by the room.** — Can we also adjust the flat image on the windows? The image looks very modern metropolitan. It needs to look more medieval, and it should reflect the type of town it's in. If it's a low prosperity town, we should see maybe some trees and possibly a house. If it's a rich city, we should see buildings and walls. (29 Sep 2026)
Done, Session 331: the three kit frames are in every room, chosen by the room's type (`winKind`, one bake a room), in the generated rooms and Hearthwick's. The painted view is redrawn in three tiers by the town's prosperity (under 35: fields, a hedge, trees, a cottage one time in two; 35–60: gabled houses round a church spire; 60 and up: a curtain wall with towers and a gate, roofs, a keep and a spire), with roofs and walls by nation, and no painted mullions. Picture: `docs/prototypes/windows-ingame.png`.

### The ships' sails trimmed to a wind — should the world have one? (Session 319, issue #57)
Every ship's sails are baked into the hull and always stand square across it, whatever the heading, and the gaff booms always lie on the centreline. Session 168 left this owed ("the sails swinging with the heading and the wind"). The world has no wind to trim to: the weather has rain, snow and fog but no direction.

I prototyped the trim on a side branch (`auto/proto-sails`). It is not in the game. Each mast's yards and sails, each gaff and its boom, and the jib are taken out of the hull's bake as children that pivot on the mast. That adds 1–3 draw calls a ship and no triangles.
- **Square sails** (the cog, the galleon's fore and main) brace round to split the angle between the wind and the bow, up to 35°.
- **The gaff booms** (the sloop, the galleon's mizzen) swing out to leeward: 72° when running before the wind, 45° with the wind on the beam, and 15° close-hauled. The gaff sails and the jib belly to leeward.

In the pictures, each row is one ship. The columns are today, then running, broad reach, beam reach and close-hauled. The white arrow is the way the wind blows.

Pictures: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/sails-plan.png (from overhead, where the trim reads best) and https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/sails-quarter.png (from the stern quarter, as you see a ship at sea; the arrows are misplaced in this one).

**Options**
1. **A wind the world keeps, and every ship trims to it (recommended).** The wind's direction wanders slowly over the hours and swings harder in a storm. Your ship, the merchantmen and the pirates all brace their sails to it and ease round over a second or two when they turn. It is the look only: speed is unchanged.
2. **The same, and the wind also sets your speed.** Running and reaching are fast, and close-hauled is slow. That is a sailing rule, so it would go to the systems builder; I would build only the look.
3. **No wind; the sails swing only as the ship turns.** They lag through a turn and settle back square across the hull.
4. **Leave the sails as they are.**

Recommendation: 1. It makes a ship at sea read as sailed, and it takes no rule from the systems builder. A wind in the world would also serve smoke, flags and banners later.
Michael: **1 — a wind the world keeps, every ship trims to it.** (29 Sep 2026)
Done, Session 330: the prototype's rig split is in the game. `windDir()` is the world's wind, read off the absolute clock (three slow swells of 9–53 game hours, and a gust of a few seconds in a storm); `tickSailTrim` braces every ship afloat to it and eases the sails round over a second or two. Look only. Picture: `docs/prototypes/sailtrim-ingame.png`.

### The black sail and the merchantman — which hull each sails (Session 278, issue #50)
The other ships at sea have had their own looks since Session 168: black sails and a red wale for the pirate, striped sails and a green hull for the merchantman. Both still sail the sloop's hull, 13 long. They were kept small because boarding placed the crew by that length. That no longer binds: the three pirates stand 3 apart along the middle of the deck, which fits any hull, and the deck is laid from the hull's own outline. So which hull each sails is a free choice, and the backlog has it owed. The looks on each hull were drawn in the Session 165 prototype (below).

- **A, the merchantman on the cog (17 long), the pirate on the sloop.** A trader is broad and slow, a raider small and quick. Only the merchantman changes.
- **B, the merchantman on the cog, the pirate on the galleon (22).** A black-sailed ship becomes something to run from, and boarding it is a bigger fight on a bigger deck, with the same three crew unless that changes too.
- **C, both stay on the sloop.** Strike the backlog line.

**Recommendation: A.** It matches what each ship is for, and it leaves the galleon as something only the player buys.

The picture (Session 165, `docs/prototypes/boats-others.png`) shows today's single hull, then the pirate on the sloop and on the galleon, and the merchantman on the cog and on the galleon: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/boats-others.png

Michael: **The merchantman on the cog, the pirate stays on the sloop** (A) (28 Sep 2026, via the control room, issue #50)
Done, Session 285: `spawnOtherShip` builds the merchantman on the cog (17 by 5.6, its deck laid from the cog's hull, boarding and the cargo chest on it); the black sail stays on the sloop. `docs/prototypes/merchantman-ingame.png`.

### Shading in the houses' creases — the people's strength, or only the large parts (Session 276, issue #49)
Michael's A on Session 243 was the creases shaded at the people's strength, then the creatures and then the houses. The people and the creatures are done (Sessions 265 and 270). The same pass over a house does something different. A house is built from thousands of small parts: slates, shingles, turfs, course blocks and footing stones. At the people's strength they all shade each other, so whole walls and roofs go grey and muddy rather than just the creases. The plaster and stone houses show it most. So this is a question, not a build. The game is unchanged: the shading is wired into the house bake but switched off.

- **A, the people's strength, as it is.** Every part shades every other part it faces. The plaster and stone walls come out a shade or two darker all over.
- **B, the large parts only.** The same strength, but only parts at least .35 thick cast the shading: walls, roof slabs, the chimney, the lean-to, the jetty. The slates and stones still receive it but don't cast it. This darkens the window reveals, under the eaves, under a jettied floor and inside the lean-to, and leaves open walls their colour. It costs about 3–14 ms per house when a town builds.
- **C, not for the houses.** Leave them as they are.

**Recommendation: B.** It is what the people's shading does on a body: creases, not the whole surface.

The picture shows five house styles, each built once and shaded three ways (today, A, B), in the afternoon: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/houseao-grid.png

Michael: **The large parts only** (B) (28 Sep 2026, via the control room, issue #49)
Done, Session 284: `HAO` on with `minR` .35; every style's bake darkens 20–27% on the mean against 24–37% under A, with more of each house left its own colour; Dunmore's 56 detailed houses take 72–85 ms of shading between them. `docs/prototypes/houseao-ingame.png`.

### What Charisma's barter bonus does at the counter (systems builder, 2026-09-29, issue #61)
The Charisma card promises *+1% barter* a point. The hub's *Barter Bonus* row shows Intelligence + Charisma, and Aldwyn says Intelligence "improves how you barter". No price reads either one: `shopCost` (what you pay) and `sellPrice` (what you get) look only at the town's prosperity and your faction standing. A bard with Charisma 10 pays and gets what a brute does.

- **A. Charisma only: buying 1% cheaper a point, selling 1% dearer, up to 25%** *(recommended)*. It is what the card says. The hub row drops Intelligence, and Aldwyn's line stays as flavour. Charisma 10 takes 7 off a 66-gold Steel Sword.
- **B. Intelligence + Charisma, as the hub row says**, 1% a point each, both ways, up to 25%.
- **C. Charisma, buying only** (1% a point, up to 25%). Selling stays at the item's fixed share, so trade loot can't be turned into a gold engine.
- **D. Strike the barter line** from the card and the hub until skills-by-use gives it a home.

Michael: **A** — Charisma only: buying 1% cheaper a point, selling 1% dearer, up to 25%. (29 Sep 2026, via the control room)

*Done, Session 339:* `barterPct()` (Charisma × 1%, to 25%) takes its share off `shopCost` and adds it to the counter's sell price (`counterSellPrice`); a bought-back piece keeps the price you were paid. The hub's *Barter Bonus* row reads Charisma only. Aldwyn's line about Intelligence stays as flavour.

### The Boon of Renewal — how fast should it heal? (systems builder, 2026-09-29, issue #60)
Praying at a shrine restores you in full and gives one of five boons for 30 minutes of play. Four work: the Road (+25% speed), Stone (blows ×0.75), the Arm (+20% melee), the Mind (spells ×0.7). An Spéir's *Boon of Renewal* (type `regen`, mult 1) has no rate: nothing reads it, so a fifth of shrine prayers, and every prayer at An Spéir's, gives nothing after the restore. For scale, the regeneration tonics give 0.5/1.2/2.5 health a second (Mild/Strong/Master) for 60 s.

- **A. Health, stamina and mana each regenerate 0.5 a second for the 30 minutes** *(recommended)*. It matches a Mild tonic, spread over the whole boon, so it helps between fights and never outheals a blow in one. It's the only boon that touches all three bars, which fits the Sky.
- **B. Health only, 1 a second for the 30 minutes.** It's simpler, and stronger in the field.
- **C. Health 2 a second, but only out of combat** (no blow taken or given for 5 s). It reads as rest, not armour.
- **D. Replace it** with a boon that already has a rule (say, +20% stamina regen).

Michael: **A** — health, stamina and mana each regenerate 0.5 a second for the 30 minutes. (29 Sep 2026, via the control room)

*Done, Session 338:* the boon carries `rate` 0.5 (`RENEWAL_RATE`) and the main loop adds it to all three bars, capped at the worn maximum. Found alongside: every prayer threw a page error at its closing chime (`sfxTone` given three arguments), fixed.

### The ships' sails trimmed to a wind — should the world have one? (Session 319, issue #57)
Every ship's sails are baked into the hull and always stand square across it, whatever the heading, and the gaff booms always lie on the centreline. Session 168 left this owed ("the sails swinging with the heading and the wind"). The world has no wind to trim to: the weather has rain, snow and fog but no direction.

I prototyped the trim on a side branch (`auto/proto-sails`). It is not in the game. Each mast's yards and sails, each gaff and its boom, and the jib are taken out of the hull's bake as children that pivot on the mast. That adds 1–3 draw calls a ship and no triangles.
- **Square sails** (the cog, the galleon's fore and main) brace round to split the angle between the wind and the bow, up to 35°.
- **The gaff booms** (the sloop, the galleon's mizzen) swing out to leeward: 72° when running before the wind, 45° with the wind on the beam, and 15° close-hauled. The gaff sails and the jib belly to leeward.

In the pictures, each row is one ship. The columns are today, then running, broad reach, beam reach and close-hauled. The white arrow is the way the wind blows.

Pictures: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/sails-plan.png (from overhead, where the trim reads best) and https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/sails-quarter.png (from the stern quarter, as you see a ship at sea; the arrows are misplaced in this one).

**Options**
1. **A wind the world keeps, and every ship trims to it (recommended).** The wind's direction wanders slowly over the hours and swings harder in a storm. Your ship, the merchantmen and the pirates all brace their sails to it and ease round over a second or two when they turn. It is the look only: speed is unchanged.
2. **The same, and the wind also sets your speed.** Running and reaching are fast, and close-hauled is slow. That is a sailing rule, so it would go to the systems builder; I would build only the look.
3. **No wind; the sails swing only as the ship turns.** They lag through a turn and settle back square across the hull.
4. **Leave the sails as they are.**

Recommendation: 1. It makes a ship at sea read as sailed, and it takes no rule from the systems builder. A wind in the world would also serve smoke, flags and banners later.
Michael: **1 — a wind the world keeps, every ship trims to it.** (29 Sep 2026)

### Magic — fixed spells from every sigil, words you combine, or three registers to choose between? (the designer, 2026-09-29)
Today spells come from seven carvings and from the Mages' Guild's counter (60–1,400 gold, capped at Comprehension), and the world's 368 glowing sigil gates carry no carving; spell damage adds `level × 3` flat. Which loop should magic take, with the six schools as skills under the Morrowind book, no spell sales, and overcasting from health as the shared risk? (Page: `docs/design/magic.md`.)
- **A.** Sigils and schools: the canon's 38 fixed spells carved across the sigil gates by region, a second gate for the next tier, Leap, Shadow Step and Phase as movement spells. Three Opus sessions.
- **B.** Words of the deep tongue: sigils teach words (Caor, Sioc, Cloch, Éan …), the guild teaches five forms by rank (sent, worn, touched, laid, held), and you make a spell of a form and one or two words: a stone pillar to a ledge, an ice floe over a river, fire on a web. One Fable and six Opus sessions.
- **C.** Three registers: A's spells, each learned for good from a hedge-witch (safe, weaker), the guild (reliable, capped) or the carving (wild, the only Mastery, Varek's attention). Six Opus sessions.

Recommendation: **B**, with A's carvings in every sigil gate built first. A new word multiplies what you can do instead of replacing a spell with a better one, the movement spells are made for the platforming to come, and it reads the canon's registers as they are written: the makers' words, the academies' grammar.
Michael: **B — words of the deep tongue.** — If we do this, I think I want to have a questline to unlock all of the magic, and it should probably be part of the main quest. I just feel like players would never find the sigils otherwise. (29 Sep 2026)

### Picking a town lock — should the world keep moving while you pick? (systems builder, 2026-09-29, issue #54)
Opening the lockpick pauses the game, as the inventory does (Session 142), so the watch stands still while you work and whether you are seen is decided once, when the lock gives. A pick costs no world time, however long it takes you. The critic found night burglary nearly free (Portclare 5 doors, Dunmore 7, seen 0 times) and put it down to headless picks being instant. In real play they are instant too, as far as the guards can tell.

Measured over 10 minutes of the night watch at 23h, the share of arrival times at which a guard comes within the night sight range (6) of a shop door at some moment of the pick (upper bounds, walls not tested): Dunmore (3 guards, 9 doors) instant 18%, 5 s 24%, 10 s 29%, 20 s 38%; Portclare (1 watchman, 6 doors) instant 10%, 5 s 13%, 10 s 15%, 20 s 19%.

- **A. The world runs while you pick a town lock** (shop and home doors, strongboxes, home chests) *(recommended)*. The watch keeps walking and the clock turns; seen at any moment of the pick, you are seen and the pick breaks off. Dungeon chests and doors keep pausing. One Opus session.
- **B. The pick stays paused but costs time**: each pin costs a fixed slice of the night (say 3 s); when the lock gives, the watch is run forward that long and you are seen if anyone came within sight. Invisible; it only changes the odds.
- **C. Leave it.** Burglary odds rest on where the watch is when you arrive.

A makes the watch something you read and time, which is the decision the night watch was built to give.
Michael: **A — the world runs while you pick a town lock.** (29 Sep 2026)

*Done, Session 327:* shop and home doors, strongboxes and home chests; seen at any moment, the lock crime is set and the pick breaks off; dungeon locks still pause.

### The interiors' windows on the kit — which frame, in which rooms? (Session 305, issue #53)
Every interior window today is a flat pane on the wall: a painted view of the town at dusk in the generated rooms, the same in a box frame in Hearthwick's old rooms, and a plain lit rectangle in a church. Now that the furniture is on the kit, the windows are the flattest thing left in a room. I prototyped three kit windows. In each, the painted view stays, set back behind the frame. They are not in the game.

- **A — leaded casement:** a plastered reveal with splayed jambs and head, a stone sill, an oak frame with a mullion and transom, and diamond leading. 2.4k triangles.
- **B — shuttered timber window:** a lintel beam, four panes behind glazing bars, two plank shutters folded back on strap hinges, and a plank sill. 1.1k triangles.
- **C — round-headed stone window (churches and keep halls only):** coursed jambs, a ring of nine voussoirs, a moulded sill, and square lead quarries. 1.4k triangles. In the church's picture its low windows take A.

A room has four to eight windows, so this adds about 4–19k triangles to its furniture bake, with no extra draw calls. For scale, a room's furniture bake is 10–28k.

Pictures: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/windows-home.png (a home: today, A, B) and https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/windows-church.png (a church: today, C).

**Options**
1. A in every room, and C for the tall windows of churches and keep halls.
2. **By the room (recommended):** B in homes, cabins and the poorer rooms; A in shops, inns and guild halls; C in churches and keep halls. The frames then step from rough to fine with the room, and the painted view stays in all of them.
3. B in every room, and C for churches and keep halls.
4. Leave the windows as they are.

Recommendation: 2. It gives the same kind of variety by wealth that the townsfolk's clothes got (Session 268), and each builder can take a window by the room's type without changing a layout.
Michael: **2 — by the room.** — Can we also adjust the flat image on the windows? The image looks very modern metropolitan. It needs to look more medieval, and it should reflect the type of town it's in. If it's a low prosperity town, we should see maybe some trees and possibly a house. If it's a rich city, we should see buildings and walls. (29 Sep 2026)

### Four promised effects with no rule behind them — crit, merchant access, Ashwort's pulse, Caor Dubh's risk (systems builder, 2026-09-29, issue #58)
Sessions 320–323 wired up every buff and attribute line whose text said what it does. Four lines are left, because the game has no rule for them to plug into:
1. *Fortune: +2% crit chance a point.* No hit in the game can crit by chance. The only crit is the bonus for striking a staggered foe.
2. *Charisma: merchant access.* The shops filter their stock by an item's `chaReq` (since v61au), but no item carries one, so nothing is ever held back.
3. *Ashwort: minimap pulse, reveals nearby enemies for 5s.* Nothing reads it. The open world's minimap already shows every foe in range, and the dungeon's shows none.
4. *Caor Dubh: +40% damage for 30s (risky).* The +40% works. The risk has no cost.

- **A. Build all four** *(recommended)*. Fortune: 2% a point that a melee or bow hit crits for ×1.5. Charisma: at 5 points each merchant shows one extra item from the next tier up. Ashwort: the dungeon minimap shows foes within 20 units for 5 s. Caor Dubh: you take +20% damage while it lasts. One Opus session.
- **B. Strike the four lines** from the card and the herb text until the skills sessions rework attributes.
- **C. Leave them.**

A keeps the card honest and gives Fortune and Charisma something to feel. Every number in A is a proposal.
Michael: **A — build all four.** (29 Sep 2026)

*Done:* Fortune's crit and Caor Dubh's risk built in Session 328 at the numbers above, Ashwort's dungeon pulse in Session 329, Charisma's extra item in Session 333. #58 closed.

### Unblock auto/systems — was the red CI a flake? (the producer, 2026-09-29)
PR #22 (auto/systems, head cdb5774) failed CI twice after Michael's ✅: the same shard on two frame-timing budgets (hourhitch's shader-compile stall check, snowrepaint's per-tick cost); a third test (witness) failed once then passed clean on a rerun with no code change. Nothing in Sessions 280–283 (the roll, the posture bar, tightened tells, the roll beating the Faolchú's fire, bolts, charges and volleys) touches shaders, snow repaint, or shop witnessing — it read as CI-runner variance, not a fault in the branch.

- **A, merge anyway** *(recommended)*. Claude merges as approved; widen the two budgets later if they keep flaking.
- **B, wait for a clean run.** No agent is set to touch these tests, so it could sit a while.
- **C, fix the budgets first.** One systems-builder session widens hourhitch's and snowrepaint's budgets, then Claude merges.

Michael: **A — merge anyway.** (29 Sep 2026, via Slack)

Since asked, Session 299 (on auto/systems) root-caused both instead: the late shader was the wolves' material loading on a foe's first night spawn (arrival, not the hour change), and snowrepaint now checks exactly two chunks a tick rather than against a runner-measured millisecond budget.

### Enemies by place — which place is how dangerous? (systems builder, 2026-09-28, issue #51)
Today every enemy grows with your level: health ×(1 + 0.15 a level, to ×3) and damage ×(1 + 0.08 a level, to ×2), in `enemyHpScale`/`enemyDmgScale`. Rare variants also turn up more often as you level. You kept this as the designer's condition when you chose the Morrowind book: enemies should scale by place, not by level, so that friends sharing your world meet one difficulty. The design page says only "a danger tier from the region and the dungeon floor". It does not say which place gets which tier, or what a tier is worth. The skills sessions and the combat tuning both need it settled first.

- **A. A tier for each region, plus the dungeon floor** *(recommended)*. Home's regions are authored: the coast, Ashen, Bealach and Royale are tier 1; Deepwood, the Foothills and Greywood tier 2; the Wastes tier 3. The far continents take a tier from their biome: tundra, swamp and wasteland 3, the rest 2. Each dungeon floor below the first adds one tier, to a cap of 4. A tier is worth what today's curve gives at levels 1, 6, 11 and 16: health ×1 / 1.75 / 2.5 / 3, damage ×1 / 1.4 / 1.8 / 2. Variants read the tier the same way.
- **B. Rings by distance from Ashenmoor.** Tier 1 near the start, rising one tier every ~600 units, and the far continents at 3–4. It needs no authoring, but it cuts across regions, so a forest could be tier 1 at one edge and tier 2 at the other.
- **C. Not yet.** Keep level scaling until the skills sessions land.

A keeps a region's danger readable (the Wastes are dangerous, the coast is not) and gives the far continents a sensible default. It is one Opus session.

Issue: https://github.com/mbuckley616/The-Old-Gates/issues/51

Michael: **C — Not yet** — keep level scaling until the skills sessions land. (29 Sep 2026, via Slack)

Moved here by the systems builder, Session 311; nothing built.

### The black sail and the merchantman — which hull each sails (Session 278, issue #50)
The other ships at sea have had their own looks since Session 168: black sails and a red wale for the pirate, striped sails and a green hull for the merchantman. Both still sail the sloop's hull, 13 long. They were kept small because boarding placed the crew by that length. That no longer binds: the three pirates stand 3 apart along the middle of the deck, which fits any hull, and the deck is laid from the hull's own outline. So which hull each sails is a free choice, and the backlog has it owed. The looks on each hull were drawn in the Session 165 prototype (below).

- **A, the merchantman on the cog (17 long), the pirate on the sloop.** A trader is broad and slow, a raider small and quick. Only the merchantman changes.
- **B, the merchantman on the cog, the pirate on the galleon (22).** A black-sailed ship becomes something to run from, and boarding it is a bigger fight on a bigger deck, with the same three crew unless that changes too.
- **C, both stay on the sloop.** Strike the backlog line.

**Recommendation: A.** It matches what each ship is for, and it leaves the galleon as something only the player buys.

The picture (Session 165, `docs/prototypes/boats-others.png`) shows today's single hull, then the pirate on the sloop and on the galleon, and the merchantman on the cog and on the galleon: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/boats-others.png

Michael: **The merchantman on the cog, the pirate stays on the sloop** (A) (28 Sep 2026, via the control room)

### Shading in the houses' creases — the people's strength, or only the large parts (Session 276, issue #49)
Michael's A on Session 243 was the creases shaded at the people's strength, then the creatures and then the houses. The people and the creatures are done (Sessions 265 and 270). The same pass over a house does something different. A house is built from thousands of small parts: slates, shingles, turfs, course blocks and footing stones. At the people's strength they all shade each other, so whole walls and roofs go grey and muddy rather than just the creases. The plaster and stone houses show it most. So this is a question, not a build. The game is unchanged: the shading is wired into the house bake but switched off.

- **A, the people's strength, as it is.** Every part shades every other part it faces. The plaster and stone walls come out a shade or two darker all over.
- **B, the large parts only.** The same strength, but only parts at least .35 thick cast the shading: walls, roof slabs, the chimney, the lean-to, the jetty. The slates and stones still receive it but don't cast it. This darkens the window reveals, under the eaves, under a jettied floor and inside the lean-to, and leaves open walls their colour. It costs about 3–14 ms per house when a town builds.
- **C, not for the houses.** Leave them as they are.

**Recommendation: B.** It is what the people's shading does on a body: creases, not the whole surface.

The picture shows five house styles, each built once and shaded three ways (today, A, B), in the afternoon: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/houseao-grid.png

Michael: **The large parts only** (B) (28 Sep 2026, via the control room)

### Furniture inside homes and inns — on the shape kit (the concept artist, 2026-09-28)
Backlog H.5 asks for "props" with the buildings. Outside, every house, church, keep, well and stall is on the kit now; inside, the furniture is still boxes. A Dunmore home's furniture is 43 meshes and 556 triangles, each box with its own material; the inn's taproom is 147 meshes and 2,364 triangles. The bed is a box on four box legs, the hearth a grey box with a black one in it, the bottles on the inn's shelves cylinders of one colour. The prototype (`docs/prototypes/interiors/`, `index.html` unchanged) builds the pieces from the kit and bakes a room's furniture into one mesh, plus a small unlit one for the flames:
- **A home:** a box bed with turned posts, a planked headboard, a stuffed tick, a quilt of three bands and a pillow (2,200 triangles); ladder-back chairs (848); a planked table with breadboard ends and turned legs (1,184); an iron-bound chest with a vaulted lid (856); a stone hearth with a timber lintel, a mantel, logs, flames and a pot on a crane, the chimney breast limewashed to the ceiling (3,842); wall shelves of jars, bowls and plates (768); a braided rag rug. 14,521 triangles in 2 meshes; the view's draw calls fall from 44 to 17.
- **The inn's taproom:** a panelled bar with a brass foot rail and tankards (1,736), stools, casks on cradles with taps (908), a dresser of bottles, jugs and standing plates (2,784), tables with benches (192 a bench), the bigger hearth. 26,008 triangles in 2 meshes; draw calls 252 to 107.
- **Sized to the people:** a townsperson is 1.18 tall; a table top stands at .46, a chair seat at .26, the bar at .69. The bed is 1.5 long (today's is 1.95, 1.65 times a person).
- **By nation:** the Gatelands' oak and a madder, ochre and blue quilt; the Mark's dark pine and grey wool; Aurenne's walnut with the chairs, chests and headboards painted blue.

Options:
- **A. The kit in every interior.** Homes and inns as shown, then the shops, church, keep and guild halls in the same kit (the forge, armour stands, the apothecary's shelves, pews, the throne), one or two rooms a session, each room one baked mesh. Collision, beds, doors and where people stand are unchanged.
- **B. Homes and inns only.** The pieces shown; the shops and halls keep their boxes for now.
- **C. Not yet.**

**Recommendation: A.** The rooms are where you sleep, trade and talk, and at present they are the last place the game looks like boxes. The cost is triangles, not draw calls: an interior draws one room, and the inn's 38,000 triangles in view are a fraction of a town street's.

Pictures: [a home, today left, proposed right, two views](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/interiors/home.png) · [the inn's taproom, today and proposed](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/interiors/inn.png) · [the home's pieces with a townsperson, front](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/interiors/pieces-home-front.png) · [three-quarter](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/interiors/pieces-home-side.png) · [the inn's pieces](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/interiors/pieces-inn-front.png) · [bed, chair and chest by nation](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/interiors/pieces-nations-side.png)

Michael: **The kit in every interior** (A) (28 Sep 2026, via the control room)

### Prosperity in whole points — should small daily changes count? (systems builder, 2026-09-28, issue #44)
Found building the Compact's tithe (Session 266). A town's prosperity is kept in whole points: once a game-day every driver is added up (roads, the nearest lair, plague, siege, occupation, the drift back towards the town's home level) and the total is rounded. So a driver worth less than half a point moves a town or not depending on what else happened to it that day. Occupation's half point (Session 129) often does nothing: in the test a town held by the Mark, and the same town also paying the tithe's extra half point, both lost exactly a point a day. The drift home is 1% of the gap a day, under half a point for any gap under 50, so on its own it never moves a town, and a town raised by builds keeps its level for good unless something else pushes it. The tithe now keeps its own account, so it is exact; the rest still round.
- **A. Carry the fraction everywhere.** Prosperity keeps its fractions, and the town shows the rounded number. Every driver counts in full: occupation costs half a point a day, and a raised town drifts back towards home at about 1% of the gap a day (20 above home: a point in five days at first). One short session. It changes the balance of every town, slowly.
- **B. Carry the fraction for the drivers, not the drift.** The half-point effects (occupation, and any later ones) count in full. The drift home keeps today's behaviour, so raised towns stay raised. One short session.
- **C. Leave it.** Whole points, as now. Strike the backlog line.

Recommendation: **B**. Every rule then does what its number says, and the towns you have built up don't start sinking on a rule nobody sees. A is the cleanest arithmetic, but it makes investment wear off, which is a design change in itself.

Michael: **B — carry the fraction for the drivers, not the drift** (28 Sep 2026, via the control room; issue #44)

Done, Session 272. Built as B's own words have it: the half-point effects on the town itself (occupied −.5, owned +.4, burned or sacked −.2) carry their fraction; the drift home rounds as before. Roads (±), the nearest lair (±.6) and trade routes (+.8) also still round with the drift. Carried as well, they sank all 17 towns of the first measure by a mean of 33 points in 120 days (every one by 10 or more), because the drift under half a point no longer answered them. That would be a rebalance B was chosen to avoid. If Michael wants those exact too, their numbers need retuning first.

### The town gate itself — an archway and gate leaves between the gate towers (Session 273)
Where a road crosses a walled town's wall, two gate towers stand either side of it (Session 249 put them on the kit). Between them there is nothing: the wall simply stops, and the road runs through an open gap. Whether a town's gate should be a built thing, and how much of one, is a look call, so this is a prototype. The prototype (`docs/prototypes/towngate/shoot.mjs`) builds it from the game's own wall and tower builders with the gate made from the shape kit; `index.html` is unchanged.

- **A, a gateway and open leaves.** For the stone tiers, an arch of voussoirs springs from tower to tower, with a wall-walk and merlons over it. For the palisade, a timber lintel frame on two posts with a braced top rail. In both, two plank gate leaves with iron bands and a brace stand open against the inside of the wall.
- **B, the leaves alone.** The same two leaves on posts at the towers, open, with the gap open to the sky.
- **C, not yet.** The gap stays as it is.

**Recommendation: A.** A gate is where a town says what it is from the road, and the arch carries the wall across so the ring reads as closed.

The leaves never shut: nothing in the game closes a town's gate yet. A later session could shut them at night, or when the town is hostile, if that becomes a system.

The picture shows the stone tier (top) and the palisade (bottom), today, A and B, seen from the road outside at noon: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/towngate-grid.png

Michael: **A gateway and open leaves** (A) (28 Sep 2026, via the control room)
Done, Session 275: `townGateGeo` builds the arch or the timber lintel and the open leaves at every road crossing of a town's wall, for all four tiers, square to the road; the gate towers now stand square to the road too. A crossing where a second road meets the first at the ring stays open (one of eight in the three towns tested). `docs/prototypes/towngate-ingame.png`.

### An unwalled town by day — who keeps the law? (systems builder, 2026-09-28, issue #41)
Found by the critic (28 Sep, PR #40). A town without walls, a port like Portclare or any village, has one man of the law: the night watchman. He sleeps from 6:30 to 19h. So by day nothing happens when you are seen: favour drops and a fine is set, but nobody halts you, and at favour −2 or worse nobody follows you, though the crime spec says guards follow. The critic was seen twice in Portclare's square at 14h (favour 0 → −4, fine 355), and the halt came only at 19h. Walled towns have two gate guards by day and aren't affected.
- **A. The watchman is roused.** In an unwalled town, while you owe a fine there, the watchman is on duty by day as well. He halts you in the street, or follows you at −2 or worse. Otherwise he sleeps by day as now. One short session.
- **B. A day constable.** Every unwalled town gets a second man who walks the plaza by day while the watchman sleeps: one more person in every village. One session.
- **C. Leave it.** Villages are lax by day, and the fine waits for the watchman at 19h or for the lord.

Recommendation: **A**. It closes the gap with the man the town already has, adds nobody to villages, and keeps a quiet village quiet until you give it a reason.
Michael: **A day constable** (B) (28 Sep 2026, via the control room; issue #41)
Built, Session 268 (systems builder): every town with a night watchman and no gate guards gets a day constable who walks the plaza from 6:30 to 19h and sleeps by night. He halts, follows at −2 or worse, and is sent indoors, as any guard on duty. Issue #41 closed by the producer.

### Occupation's effects from the canon — the League's duels and the Compact's tithe (systems builder, 2026-09-28, issue #37)
Backlog B, prosperity, owes *occupation effects from the canon (tithe, duels)*. The canon (§ Prosperity, Drivers) says: *an occupied League town loses its duels and gains patrols; the Compact's tithe lowers a port and raises its capital.* What is built today: a town taken in a war is flagged occupied and loses half a point of prosperity a game-day. The occupier's soldiers hold the plaza until you clear them, and the keeper names who holds the town. **Duels don't exist yet** (backlog A owes *a real duel*), so the League's half has nothing to take away. **The tithe is open**: the canon doesn't say when it applies or how much it is.
- **A. A tithe on the Compact's occupations.** A town the Compact (Aurenne) occupies pays a tithe: an extra half point of prosperity a game-day, and Aurenne's capital (Fortargent) gains the same, capped at 100. Duels wait until duels exist. One short session.
- **B. The tithe always.** In peace too, every Aurenne port loses a quarter point a game-day to the tithe, and Fortargent gains a quarter point for each such port. The ports sit a little poorer than other nations' ports. One short session.
- **C. Leave it.** Occupation's half-point loss stands for the tithe. Strike the item.

Recommendation: **A**. It gives occupation by the Compact a visible cost that differs from the Mark's, and it doesn't make Aurenne's peacetime ports poorer on a rule nobody sees.
Michael: **A tithe on the Compact's occupations** (A) (28 Sep 2026, via the control room)
Built, Session 266 (systems builder): a town Aurenne occupies pays half a point of prosperity a game-day more (a point every second day, kept in its own account because prosperity is whole points), and the Compact's seat, Fortargent on this seed, gains it unless it is itself occupied. Duels wait until duels exist. Issue #37 closed.

### Q7 “The Rubbing” in the open world — how does Ashenmoor burn? (systems builder, 2026-09-28, issue #32)
The main quest now runs from Q1 through Q6 in the open world (Sessions 236 and 240). Q7 still exists only in the legacy zones: *Return to Ashenmoor* fires only when the old overworld zone loads, the Faolchú spawns only there, and Bram's body is a legacy corpse. In the world's Ashenmoor, Bram is alive at his forge and nothing burns, so the quest's first step can never happen.
- **A. Ashenmoor burns in the world.** When Q6 is turned in, the world's Ashenmoor becomes the ruin variant the war code already has (burnt shells, no market). Edna and Brother Oswin stay; Bram's body lies at the forge. The Faolchú waits on the plaza until killed. The ruin is permanent, which is the canon. About two sessions.
- **B. A burned copy you travel to.** The world's Ashenmoor stays as it is. The quest sends you through a gate to the old Ashenmoor zone, burned, where Q7 plays as it was written. You come back to the world afterwards. One session, but it's a detour out of the open world.
- **C. The burning happens off-screen.** Ashenmoor becomes the ruin as in A, but there is no Faolchú fight. The quest skips to Bram's body, Oswin, Edna and the rubbing. One session.

Recommendation: **A**. It keeps the story in the world you play, and the canon has Ashenmoor lost for good.
Michael: **Ashenmoor burns in the world** (A) (28 Sep 2026, via the control room)
Built, Session 269 (systems builder), the first of A's two sessions: handing in Q6 turns the world's Ashenmoor into the ruin for good (it never wears off). Only Edna's cottage and Brother Oswin's oratory stand, with the two of them inside, and Edna speaks as she does after the burning. Coming onto its pad is Q7's *Return to Ashenmoor*. The Faolchú on the plaza, Bram's body at the forge and the triage are the next session.
Built, Session 270: A's second half. The Faolchú waits on the world's plaza until killed (the legacy boss, built by the same code, with its bar, its Mark and its death burst). Bram lies at his forge with his hammer, and Oswin and Edna are seen to in their houses. Edna's rubbing goes to Aldwyn in Ironhaven, and Q7 completes in the world. Issue #32 closed.

### Coach tickets — what does a ticket buy, and what does it cost? (systems builder, 2026-09-28, issue #31)
Michael's answer on #24 (the coaching inn, B) included *tickets sold here*. The inn, the driver and the travellers are built (Sessions 237–238). Tickets are held back, because today every coach is **free to ride**. The player raised the road themselves (600 gold and up), so a ticket needs a rule.
- **A. A seat held.** A ticket costs nothing. Taking one from the keeper makes the next coach wait at the inn until you board, up to an hour, so you can eat or sleep without missing it. Riding stays free.
- **B. Fares everywhere.** Every ride costs a fare, about a tenth of the road's length in gold (a 548-unit road is 55 gold). You pay it at the inn or at either end, the driver takes it as you board, and it goes to the road's two towns as prosperity.
- **C. No tickets.** The coach stays free and the keeper's board is enough.

Recommendation: **A**. It gives the inn a reason to stop, and it doesn't charge you to ride a road you paid to build.
Michael: **A seat held** (A) (28 Sep 2026, via the control room)
Built, Session 267 (systems builder): the coaching inn's keeper holds a seat on the next coach to call, either way, for nothing. That coach waits at the door up to an hour past its call and goes on when you board or the hour is up. The coach stands still while you're indoors, so a seat is also settled on coming out: if its call has come and the hour isn't up, it is at the door. Issue #31 closed.

### Wealth in clothes — poor, middling and well-off townsfolk (Session 246)
Backlog H.2 has owed wealth in clothes since Session 153. Today a townsperson dresses by their people, nation and role: a lord has a crown and a smith an apron, but a poor fisher and a well-off one dress alike. So do the folk of a failing village and of a thriving town. The prototype (`docs/prototypes/wealth/shoot.mjs`) patches a copy of the game; `index.html` is unchanged. It gives a person a wealth from 0 to 1 and dresses them by it in three steps:
- **Poor** (below .3): faded cloth, drawn towards undyed wool; a patch on the chest and one on the skirt; a rope belt with a knot; foot-wraps for boots; no fur hat or chaperon.
- **Middling:** today's look.
- **Well-off** (above .7): deeper dyes, gilt trim at the hem and cuffs, a gilt buckle, a chain with a pendant, dark boots.

Each picture shows the same five people (the same genome) in three rows: poor, today, well-off.
- Gatelanders: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/wealth-1.png
- Markish and Aurennais: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/wealth-2.png

The cost is small: poor adds 104–160 triangles to a person of 4.4–7.7k, and well-off adds 416.

**Where a person's wealth would come from, if built:**
- Their role sets a base:
  - lords and ladies .95;
  - merchants, innkeepers and scholars .7;
  - smiths, apothecaries and priests .55;
  - villagers .45;
  - farmers and fishers .35;
  - hermits .15.
- The town's prosperity moves it by (prosperity − 50) / 100 × .5, so ±.25.
- Each person varies by ±.1 on their own seed.

So in a village at prosperity 20, about half the villagers are poor; in a town at 90, some are well-off; and a merchant is well-off anywhere above about 50. Guards keep the town's kit. When a town's prosperity changes, its people's clothes follow on your next visit. It is the same person, only dressed by the town's fortune.

**Options:** (A) all of it: wealth from the role and the town's prosperity, so a town you have raised or ruined shows it on its people; (B) wealth from the role only, so it never changes; (C) not yet. **Recommendation: A.** The brief's first line is that choices change the world you can see. Prosperity is already the thing your choices move (roads cleared, routes opened, a town sacked), and today it shows only in lots, shutters, lamps and banners. The same person's clothes following the town's fortune makes it show on its people too. No prices or quests are touched: this only reads prosperity. Things to judge: whether gilt trim reads as wealth or as costume; whether foot-wraps on the poor read at street distance; and whether a poor dress needs a patch on the skirt as well (the dress has none in the prototype). Children, who H.2 also owes, are not part of this.
Michael: **Role and the town's prosperity** (A) (28 Sep 2026, via the control room)

### The player's swings in third person — anticipation and follow-through (Session 245)
Backlog H.3 still owes the player's swings, with anticipation and follow-through. This is third person only. Today the body's swing is three equal-ish parts, each a smoothstep: it winds up over the first 30%, strikes over the next 30% and eases back over the last 40%. Only the arm moves, besides a small turn of the torso. It does not follow the first person's own timing: in first person the wind-up runs to .44 of the swing, the hit lands at .55 and the follow-through runs to .79. The body's forehand is also a flat cut and its backhand a rising diagonal, where the first person shows two falling diagonals. (Session 244 fixed a bug by which the body always played the flat cut.)

The prototype (`docs/prototypes/swings/shoot.mjs`) patches a copy of the game; `index.html` is unchanged. It keys the body to the first person's phases:
- a wind-up that eases into a held coil: the torso turned away and the weight on the back foot;
- a strike that speeds up into the hit, with a step of the front foot and the torso unwinding, the blade arriving at .55;
- a follow-through that carries past the hit and slows;
- then back to guard.

It has the same three swings the first person shows: the forehand from high right to low left, the backhand from high left to low right, and the overhead chop. The arm eases faster during the swing, because the strike lasts only about 60 ms. Timing, damage and the first-person view are unchanged. Each picture has two rows, today above and the proposal below, across seven moments of one swing; the white line is the path of the weapon's point:
- Forehand, sword and shield: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/swings-1.png
- Backhand, sword and shield: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/swings-2.png
- Overhead chop, sword and shield: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/swings-3.png
- Two-handed power chop, claymore: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/swings-4.png

**Options:** (A) as shown: the coil, the step and the carry, timed to the hit, with the first person's three swings; (B) timing only: today's poses moved onto the first person's phases, so the blade lands at the hit, and the swings matched, but no coil or step; (C) not yet. **Recommendation: A.** The brief puts weighty combat third, above look. Today the body's blade is still travelling at the moment of the hit, and the swing is done by the arm alone. A shows the weight going into the blow and lets you read the swing's direction. Known faults, in both rows: on a two-handed weapon the left hand does not stay on the hilt all the way through the swing; that is owed either way. Some swings bring the blade close to the head in the wind-up. Whether the coil's hold reads as weight or as a hitch only shows in motion.
Michael: **As shown** (A) (28 Sep 2026, via the control room)

### Shading in the creases of the townsfolk — baked ambient occlusion (Session 243)
Backlog H.1 still owes ambient occlusion in the shape kit. Today every part of a person is baked with its flat colour, so an armpit, the underside of a chin or beard, the inside of the thighs and the skin under a hat's brim are as bright as a cheek. The dungeon walls already darken in their corners (Session 189); the people do not. The prototype (`docs/prototypes/peopleao/shoot.mjs`) patches a copy of the game. After a person is baked, each part is stood in for by a few spheres along its length, and each vertex is darkened by the other parts in front of it, by at most half. This is worked out once per person, in the standing pose, into the colours they already carry, so it costs nothing per frame and adds no triangles. Each picture has two rows, today above and with the occlusion below:
- Three people close, at noon: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/peopleao-1.png
- Three more close, at noon: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/peopleao-2.png
- All six at street distance, from behind, at 17h: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/peopleao-3.png

Close up it gives the figures weight: the neck sits under the jaw, the arms stand off the body, and a hat shades the brow. At street distance it is hardly visible.

**Options:** (A) this strength, for the townsfolk, the foes built on them and the player, then the same bake for the creatures and the houses in later sessions; (B) the same, but stronger (darker creases, visible at street distance); (C) not yet. **Recommendation: A.** It is free at run time and makes the close view, which is where you talk to people, less flat. B risks muddy faces. One known fault: it is worked out in the standing pose, so a raised arm keeps the shadow of an arm at its side. That is the usual price of a baked occlusion.
Michael: **This strength** (A) (28 Sep 2026, via the control room)

### Cloaks and hair that swing (Session 242)
Backlog H.3 still owes "secondary motion (cloaks, hair)". Today a cloak is one stiff shell fixed to the back, and a plait or a tied tail is fixed to the head. They turn with the body and never move on their own. A cloak is worn by 60% of the Mark's townsfolk, 12% of the Gatelands' and 10% of Aurenne's. The prototype (`docs/prototypes/secondary/shoot.mjs`) builds a copy of the game with three extra bones. The cloak hangs from the shoulders in two halves, hinged at the middle so it bends. A plait, a warrior's back plait or a tied tail hangs from the nape. Each is a damped pendulum driven by how the body moves. It streams back with the pace, lags when you start, swings forward when you stop, swings out on a turn, and settles when you stand. Each picture has two rows, today above and the proposal below. The six columns are standing, walking, running, running through a turn to the left, just stopped, and settled.
- A Markish woman with a dress, a cloak and a plait: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/secondary-1.png
- A Markish man with warrior braids and a cloak: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/secondary-2.png
- A Gatelands woman with a tied tail and a cloak: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/secondary-3.png

The pendulums cost a few multiplications per person per frame, and they would run only for the near copy of a person (within 17 units). The triangle count is unchanged.

**Options:** (A) the cloak in two hinged halves and the back hair, for the townsfolk, the foes who wear cloaks and the player's third-person body; (B) the cloak only, with the hair staying fixed; (C) not yet. **Recommendation: A.** A cloak that streams behind a runner is one of the cheapest ways to make the movement read as fluid, which is the third thing the brief asks for. Known faults to fix in the build: the hinge shows a slight fold line when the cloak is bent hard, and the plaits' swing is small, so they need a lighter damping.
Michael: **Cloak and back hair** (A) (28 Sep 2026, via the control room)

### What a picked herb leaves behind (Session 237)
Your answer on the plants (Session 164) was that picking leaves the plant: a picked bush, sapling, shrub, bramble or the fungus's stump stays, bare, and grows back. The other seventeen kinds vanish when you pick them, and reappear whole when they regrow: the mosses, the clay, the rosette, the cliff flower, the leafy herbs, the waterleaf, the broadleaf, the veilwort, the heartroot, the tussock, goldenrod, wolfsbane, the thistle, the fern and the mushrooms. The prototype (`docs/prototypes/herbstub/shoot.mjs`) builds two ways of leaving a mark from the game's own plants. Each picture has three rows: the whole plant at the back, then A, then B.
- **A. A stub on turned earth.** The plant is cut near the ground: the stalk bases, the crown and the lowest leaves stay (under 4–9 cm, by the plant's height). A flat plant (a moss or a rosette) is torn, with about half left. It sits on a small patch of dark turned earth. It is 20–60% of the whole plant's triangles.
- **B. Turned earth only.** The patch of earth, nothing else.
- **C. As today.** The herb vanishes until it regrows.
- Kinds 1–9: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/herbstub-1.png
- Kinds 10–17: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/herbstub-2.png

**Recommendation: A.** It fits your rule for the bushes: you can see where you have been picking, and a cut goldenrod or a torn moss still reads as that plant. In the build, the stub would be the picked copy the bushes already use, so the regrowth and instancing need nothing new. B is the cheapest, but a field of identical earth patches reads as a mark rather than a plant.
Michael: **A stub on turned earth** (A) (28 Sep 2026, via the control room)

### The first-person weapon on the kit too? (Session 232)
Your answer on the weapon kit (Session 220) was A: "the player's weapons in third person, and every foe". Both are built now (Sessions 226–227, 231). In first person, which is how most of the game is played, your weapon is still `buildViewmodel`'s boxes: a white slab for a blade, a box for a mace's head, a stick for a bow. The prototype (`docs/prototypes/fpweapons/shoot.mjs`) builds today's first-person weapon for five items. It then hides the weapon's boxes and puts the kit's weapon in the same fist, tinted by the item as in third person. The hands, arms, position and swing are untouched.
- Five items, today's above and the kit below (a steel sword, an iron war axe, an iron mace, a hunting bow, an oak staff): https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/fpweapons-grid.png
- The sword full frame, today: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/fpweapons-sword_today.png and on the kit: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/fpweapons-sword_kit.png

The view has its own small lit scene with nothing to reflect, so the kit's metal would be duller there (metalness .25, not .7), or it renders nearly black. What the build keeps: the bow's drawn string and nocked arrow (they would be re-hung on the kit bow), the enchantment glow, and the Forge-Man's Hammer's own bespoke model.

**Options:** (A) yes, the kit in first person for every weapon, keeping the bow's draw, the glow and the Forge-Man's Hammer; (B) yes, but melee weapons only, the bow keeping today's first-person model with its string animation; (C) not yet. **Recommendation: A.** It is the weapon you look at most, and it would match what the foes carry and what you see in third person.
Michael: **Yes, every weapon** (A) — "Check the bow again - it looks like it’s facing backwards, towards the player" (28 Sep 2026, via the control room)

### The road coach, its horses, and the shark (Session 230)
Outside the foes, the last boxes in the open world that you meet up close are the road coach and its pair of horses, and the shark in open water. The coach, which you can ride between towns, is a box on four discs. Each horse is a box on four sticks with a box for a head. The shark is a cylinder with four cones. None of them is in a family you have approved. The prototype (`docs/prototypes/coach/shoot.mjs`) builds them from the shape kit, each beside today's, with a highwayman for scale:
- **The coach**: a panelled body on leaf springs, with framed windows, a door each side with a brass handle and a painted crest panel, a roof rail with luggage, the driver's bench and footboard in front, and two lamps. The four wheels have iron tyres and twelve spokes each, the back pair larger, and a pole runs forward to the horses.
- **The horses**: a barrel on four long legs, with a deep chest and haunches, a long neck and head, pricked ears, a dark mane and tail, and dark hooves. They wear a padded collar, a saddle pad and a bridle. Two coats are shown: a bay and a grey.
- **The shark**: a sleek body, grey above and pale below, with a pointed snout, a tall dorsal fin, a crescent tail, pectoral fins, gill slits and a black eye.
- Coach and pair, today's (left) and proposed (right): https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/coach-pair.png
- The horses close, standing and walking: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/coach-horses.png
- The shark, today's (left) and proposed (right): https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/coach-shark.png

In the build, the horses would be a new kind on the wolf's bones, as the boar and bear are, with longer legs, and they would walk and trot on its gait as the coach moves. That would also give the game a horse for anything later (a mount, a farm). The shark would be one skinned mesh with its body and tail bending as it swims.

**Options:** (A) all three as shown, the horses on the wolf's bones and gait; (B) the coach and horses now, the shark later; (C) the coach body only, keeping the horses and shark for when mounts and sailing are designed; (D) not yet. **Recommendation: A.** The coach is something you ride and watch, so its boxes are seen for a whole journey. Known faults to fix in the build: the bridle and reins are crude, and the horses' legs are thin at the forearm and gaskin.
Michael: **All three as shown** (A) (28 Sep 2026, via the control room)

### The world's rocks — boulders, outcrops and clusters, dressed by biome (Session 228)
Backlog H.5 asks for "trees and rocks (more silhouette, less cube)". The trees got their variety in Session 192. Every rock in the world is still one shape: two dodecahedra, 72 triangles, one grey, the same in every biome. The prototype (`docs/prototypes/rocks/shoot.mjs`) builds three kinds of rock from a noise-shaped sphere:
- a **boulder**: rounded where it is worn, with flat fracture faces and hard edges where it split, darker in its hollows;
- an **outcrop**: a tilted slab in layers, the strata banded;
- a **cluster**: a boulder with two or three smaller stones half sunk around it.

Each is dressed by where it lies: lichen spots on the moor, moss on the tops in the forest and fen, sandstone in the dunes, dark basalt in the wasteland, snow on the tundra's tops.
- The three kinds beside today's rock (left): https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/rocks-kinds.png
- By biome (moor, forest, fen, dunes, wasteland, tundra): https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/rocks-biomes.png
- A hillside's scatter, the same places and sizes: today's (left) and the proposal (right): https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/rocks-scatter.png

A boulder or an outcrop is 320 triangles and a cluster 1,280, against today's 72. The start area has 17 rocks loaded, so this is about 5k more triangles there, and more in rocky hills. The build would still draw every rock of a kind in one instanced call, as today.

**Options:** (A) all three kinds, dressed by biome, mixed by the ground's own dice; (B) the boulder only, dressed by biome, in place of today's rock; (C) A, but the dressing only (moss, lichen, snow) and all rocks one grey stone; (D) not yet. **Recommendation: A.** The outcrops break up hillsides the way the trees now break up forests, and the clusters give the eye places to rest. Known faults to fix in the build: the outcrop's strata are faint from far off, and the lichen spots catch the light too brightly.
Michael: **All three kinds, dressed by biome** (A) (28 Sep 2026, via the control room)

### Combat — which shape should the fight take: tightened, Elden Ring's, or directional? (the designer, 2026-09-28)
Today an enemy glows for 0.24–0.55 s and hits anyone within 1.4 units whichever way it faces, every enemy has one attack, there is no dodge, and nothing staggers you, so fights come down to swinging and stepping back. Which shape should the reimagined combat take, with damage from the weapon skill and enemies scaled by place? (Page: `docs/design/combat.md`.)
- **A.** Tighten what is there: a roll (0.45 s, 2.6 units, 18 stamina), tells of 0.45–0.9 s read from the body's pose, enemy hits in an arc, a parry window from the Guard skill, and a posture bar the player can lose. Three Opus sessions.
- **B.** Elden Ring's shape: A, plus swings that commit you (slowed during wind-up and strike, a three-hit chain), two to four attacks per enemy family (heavy, delayed, gap-closer), a riposte after a perfect parry and a finisher on a broken posture, and lock-on. One Fable and six Opus sessions, the move sets arriving with the creature passes.
- **C.** Directional: the mouse picks one of four swings and a block must match the side. Nine or more sessions; most of the roster (wolves, spiders, trolls, the Faolchú) has no side to read.

Recommendation: **B**, with A's three pieces built first. Move sets and commitment are what make counters punishing and the combat weighty; decide before the next creature families are built, so their attack poses follow the table.

Michael: **Elden Ring's shape** (B) — "I like the idea of moving more towards Elden ring combat, but it’s a pretty fundamental change… as long as this is possible I’m up for it." (28 Sep 2026, via the control room)

### The Bog Crawler's own body — a diving beetle or a giant water bug (Session 225)
Your answer on the last box creatures (Session 214) was B: the Bog Crawler gets a six-legged crawler's body of its own, a beetle or a giant water bug, prototyped first. It lives in the fen and swamp, at a spider's size or a little over. Both prototypes are built in the game from the shape kit, in the fen's colours with moss on the back (`docs/prototypes/crawler/shoot.mjs`). Each picture has a bandit for scale and a spider for comparison.
- **A. A great diving beetle**: a glossy olive-black dome split down the back with a bronze rim, a small head with short mandibles and antennae, and hind legs swept back like oars with a fringe of hairs.
- **B. A giant water bug**: flat and oval, mottled mud-brown with pale flecks, wing covers crossing at the tail, a short pointed beak, and raptorial forelegs held up and forward to grab, as the real one does. Its hind legs are flattened paddles.
- Side by side: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/crawler-both.png
- Close: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/crawler-close.png

**Options:** (A) the diving beetle; (B) the giant water bug; (C) the water bug's body with the beetle's shine (a glossy dark bug with the grabbing forelegs); (D) keep the spider kit in fen colours, as Session 214 first showed. **Recommendation: B.** It reads as something that waits in bog water and grabs, which suits a fen ambush. Its raised forelegs give the strike a pose the spiders do not have: the forelegs snap shut. The beetle reads as a harmless beetle grown large.

In the build, either one would be a new six-legged skeleton beside the spider's, walked on alternating tripods, with the spider's IK.

Michael: **B** — the giant water bug. (28 Sep 2026, via the control room, issue #25)
Done, Session 236: the water bug on the spider's kit, its forelegs raised on the fang bones with a hooked tibia that snaps shut on the strike, walking on the other four legs in diagonal pairs (`docs/prototypes/crawler-ingame.png`).
Michael: **The giant water bug** (B). (28 Sep 2026, via the control room)

### The coaching inn halfway — what is inside? (systems builder, 2026-09-28, issue #24)
Backlog B, coach lines: *enterable coaching inns (what they hold inside is Michael's call)*. Since Session 178 the coach stops for a quarter of an hour at the two-storey inn halfway along a coaching road. The inn is a shell: you can't go in. Town inns already have a keeper, food, rooms to let (Session 141) and rumours, and a coaching inn in town already shows a timetable board and a tack corner.
- **A. A roadside inn.** The town inn's interior at a smaller size: a keeper from the nation the inn stands in, a meal and drink, one room to let (sleep until the next coach), and the timetable board and tack corner. One session.
- **B. A, and the coach's other half.** Also the coach's driver and a passenger or two waiting in the common room, and buying a ticket here for the next coach either way. One session more.
- **C. A waystation only.** One room with the board, a bench and a trough: shelter from weather, no keeper, no trade. Half a session.

Recommendation: **A**. It makes the stop worth getting off for, reuses the town inn's builder and keeper, and needs no new writing beyond what town inns already say.
Michael: **B — A, plus the coach's other half** (the roadside inn, and the driver and a passenger or two waiting in the common room, tickets sold here). (28 Sep 2026, via the control room; issue #24)
Built, Session 237 (systems builder): **A** — the inn is enterable from the road: a keeper of the country it stands in, the town inn's meal and room (one to let; travellers hold the rest), the coach's board and tack corner, and the keeper tells when each coach calls. Session 238: the driver and one or two travellers wait in the common room while the inn is open. Tickets are held back as their own question (issue #31): the coach is free today.

### Guards indoors — what happens when you are seen inside a building? (systems builder, 2026-09-28, issue #23)
The crime system's owed item. Today a keeper who sees you pick a lock or empty a strongbox indoors puts the fine on you at once, but no guard does anything while you stay inside. The confrontation (*Halt. There's a fine…*) only runs in the street, when a guard is within five units of you, so you can finish robbing the house and walk out. Whether a guard comes in after you is a rule of play.
- **A. The guard waits at the door.** When you are seen indoors, the nearest guard on duty walks to that building's door and waits there. You meet the usual halt as you step out: pay, refuse and fight in the street, or yield. Nothing new indoors. One session.
- **B. The guard comes in.** Half a minute after you are seen, a guard enters and halts you inside. Paying works as in the street. Refusing, he draws there, which needs a fight indoors (interiors have no enemies today). Two sessions.
- **C. The keeper shouts, and you are thrown out.** Being seen ends the visit: a fade, you are put out at the door, and the guard is there as in A. The robbery stops at the first thing you are seen doing. One session.

Recommendation: **A**. It closes the gap (you can't walk out unmet), keeps the fight where the fighting code already works, and leaves room to go on robbing the back room at a known price.
Michael: **B — the guard comes in.** "The guard should come in but we should be mindful of the player leaving quickly, guards should still give chase and confront if they can catch the player." (28 Sep 2026, via the control room; issue #23)
Built, Session 239 (systems builder): the first of B's two sessions. Seen indoors with a fine, the nearest guard on duty is sent; half a minute on (or his walk, if longer) he comes in by the door and halts you: pay, or refuse — refusing puts you out and he draws in the street for now. Leave before he comes in and he is in the street where his walk had got him and gives chase (3 units a second, by the streets): he halts you if he catches you; off the town's pad or after a minute and a half he gives up; duck into another house within 20 units of him and he follows you in. The fight indoors is the next session.
Built, Session 241: B's second half — refused indoors, he draws in the room (a Town Guard fought through the zone-enemy code, on the room's floor and solids); the yield at a fifth of health as in the street, the cells taking you out of the room; run out mid-fight and he fights on in the street. Issue #23 closed.


### The last box creatures — Ogre, Cave Bear, slimes, Fire Elemental, Bog Crawler, Sand Scorpion, Shore Wisp (Session 214)
Seven kinds of creature are still on the old box bodies. None of them is in a family you have approved, so here is how each would look. Each is built in the game from its own kits (`docs/prototypes/creatures3/shoot.mjs`), with a bandit beside it for scale.
- **Ogre**: the people's body grown huge and fat (the troll's build, heavier), bald and ruddy, sometimes bearded, in a leather kilt, carrying a knotted tree-limb club. It lives in the open world. https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/creatures3-ogre.png
- **Cave Bear**: on the wolf's bones, as the boar is, but heavy: thick legs, a shoulder hump, round ears, a short muzzle, the tail gone. In the build its body would be its own kit piece, as the boar's is. https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/creatures3-bear.png
- **Slime** (and the Small Slime it splits into): a soft glassy blob you can half see through, with a darker heart, things it has swallowed inside (a skull, a coin), and two eyes. **Fire Elemental**: a figure of flame over a molten core, with arms of fire, clawed hands of flame and a crown of fire. Both are dungeon creatures. https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/creatures3-dungeon.png
- **Bog Crawler** (fen and swamp): the spider kit in the fen's colours, with moss on its back. It has eight legs; the old box had six. **Sand Scorpion** (dunes): the spider kit in sand, with two big pincers, and a jointed tail curling over its back to a sting. In the picture the tail is mostly hidden behind the abdomen; the build would raise it. https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/creatures3-crawlers.png
- **Shore Wisp**: a cold light over the tide line: a white core in a blue halo, three motes circling, and a tail of fading light. It stays close to what it is now, but softer. https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/creatures3-wisp.png

**Options:** (A) build them all as shown, one or two a session; (B) as shown, but give the Bog Crawler a six-legged crawler's body of its own (a beetle or a giant water-bug) rather than a spider's, and I will prototype that first; (C) build the Ogre, the slimes, the elemental and the wisp now, and rethink the bear and the two crawlers; (D) not yet. **Recommendation: A.** Each reuses a kit the game already has, so they are quick to build and share the townsfolk's and the wolves' animation. The bear's own body (a heavier kit piece than the wolf's legs) is the one bigger job.
Michael: **B** — as shown, but the Bog Crawler gets a six-legged crawler's body of its own (a beetle or giant water-bug), prototyped first; the rest built one or two a session. (27 Sep 2026, via the control room)
Done in part, Session 221 (auto): the Ogre, as shown (`docs/prototypes/ogre-ingame.png`); Session 222: the slimes and the Fire Elemental (`docs/prototypes/slimes-ingame.png`); Session 223: the Cave Bear (`docs/prototypes/bear-ingame.png`); Session 224: the Sand Scorpion and the Shore Wisp (`docs/prototypes/scorpion-ingame.png`, `wisp-ingame.png`). The Bog Crawler's six-legged body is prototyped first.

### The caravan attacked on the road — can you save it? (the systems builder, issue #18)
Michael: **B** — defensible: bandits fall on it, the merchant runs, an overturned cart stays; driving them off keeps the route that day, the camp threatens again tomorrow. One session. (27 Sep 2026, via the control room)
Built, Session 230 (systems builder): as answered. The threat's hour falls on the outbound leg, u .35–.65 of the road; you must be within 150 units of the caravan then; leaving 250 units with bandits alive breaks it. The duplicate entry left under Pending was removed. Issue #18 closed.

### The weapon kit — swords, axes, maces, bows, staves and shields on the shape kit (Session 220)
Every weapon in the game is still built from boxes: the player's in third person (`tpWeapon`, which calls itself "a later pass"). The foes carry the people's walking stick for a club, or a spear. This prototype (`docs/prototypes/weapons/shoot.mjs`) builds a kit: blades extruded from an outline with a bevel so they have an edge and a point, wrapped grips, guards and pommels, a bearded axe head, a flanged mace, a spiked war hammer, a gnarled staff with a crystal held in three prongs, a recurve bow on a curve with its string, a planked round shield with a rim and boss, and a kite shield with a boss. (The kite shield's first render had a cross on it; I took it off so it would not read as the Church's sign.)
- Today's box weapons (top row) beside the kit (bottom row): https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/weapons-lineup.png
- In the hands, one weapon per kind of foe: a bandit with a sword and round shield, a highwayman with an axe, a deserter with a mace and kite shield, an archer with a bow, a rogue mage with a staff: https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/weapons-hands.png

**Options:** (A) the kit for everyone: the player's weapons in third person, and every foe armed by what it is (bandits and highwaymen swords or axes, deserters mace or spear with a shield, archers bows, mages staves, captains sword and shield, the dead rusted versions, trolls their maul); (B) the kit for the foes only, the player's weapons later with the first-person view; (C) the player's weapons only; (D) not yet. **Recommendation: A.** It is one kit, and the player's weapon names already say which shape to build. The foes' weapons would be looks only, with the damage they deal unchanged.
Michael: **A** — the kit for everyone: the player's weapons in third person, every foe armed by what it is; foes' weapons are looks only, damage unchanged. (27 Sep 2026, via the control room)
Done, Sessions 226–227 (auto): the kit in the game and the foes armed by what they are (`docs/prototypes/weapons-ingame.png`); the player's third-person weapons and shields from the same kit, tinted by the item (`docs/prototypes/tpweapons-ingame.png`). Issue #21 closed.

### The interface — parchment and ink, and where the HUD sits (the concept artist, 2026-09-27)
Backlog E asks for the whole interface "as close to Oblivion's design as we can — parchment and scroll", style page first. The style page is `docs/prototypes/ui/index.html`: nine 1280×720 screens with build s171's own text and numbers in Dunmore (two HUD layouts, inventory, magic, attributes, quests, map, a conversation, and the kit). Panels are one parchment sheet with a torn edge (an SVG displacement filter over a CSS gradient and noise, no images), dark-brown ink, red rubric for headings and anything new or chosen, faded ink for locked or spent; tabs are bookmarks on the sheet's top edge; close is a wax seal. The HUD sits on the world in dark iron and bronze. Type is IM Fell English SC for headings and EB Garamond for lists and numbers (both OFL, 290 KB). The emoji icons (🪖 👕 🧪 🗝) become 31 drawn ink icons (24×24 SVG, one stroke). Magic is regrouped by sigil, one line a spell with an English gloss and the cost in a column (the legibility ask). The world map is today's, inked into the paper.
- **A.** Parchment everywhere, and the HUD in Oblivion's places: health, mana and stamina with the readied weapon and spell bottom-left, the compass bottom-centre, the minimap kept top-right as a bronze-ringed disc. Today's yellow HUD text over a bright sky is hard to read (`current-hud.png`); the bottom keeps it off the sky.
- **B.** Parchment everywhere, the HUD restyled but left where it is now (vitals top-left, compass top-centre).
- **C.** Parchment only for what you read (conversation, quests, books, notice boards, map); inventory, magic and attributes keep a dark panel with the new type and icons. Less change, less Oblivion.

Recommendation: **A**. It is the look asked for, and the HUD moves off the sky. One Fable session applies the kit to every panel (the shop, loot, save/load, lockpicking and the creator follow the same sheet); the journal stays its own item.
Screens: [HUD, today beside A](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/compare-hud-a.png) · [HUD, B](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/new-hud-b.png) · [inventory, today beside proposed](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/compare-inventory.png) · [magic, today beside proposed](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/compare-magic.png) · [attributes](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/new-attributes.png) · [quests](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/new-quests.png) · [map](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/new-map.png) · [conversation, today beside proposed](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/compare-dialogue.png) · [the kit: colours, type, states, icons](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/new-kit.png)
Michael: **Parchment everywhere; HUD in Oblivion's places** (A). (27 Sep 2026)

### Trolls, golems, gargoyles and the Faolchú — what they look like (Session 201)
The last foes still on the old box bodies are the dungeon's heavy hitters (cave trolls, golems, gargoyles) and the Faolchú, the canon's first named antibody and Act I's boss. The canon describes the Faolchú's look exactly: wolf-shaped and hunched, with extra arms from a spine seam that glows red, and sigil-script along its sides. It gives no look for the others beyond "cave trolls ... categories the world's existing folklore had words for". Each picture has a townsperson at the left for scale, two standing and one moving:
- **Cave troll**: the people's body grown to one and a half times a person's height, heavy and stooped, grey-green hide, tusks, yellow eyes, a hide tunic and a club. https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/creatures2-troll.png
- **Golem**: dressed stone blocks on the people's bones, with a blue rune-light in the seams (an X on the chest, a slit for eyes). https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/creatures2-golem.png
- **Gargoyle A**: a crouched stone figure on the people's body, with bat wings, horns, a tail and lit eyes. https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/creatures2-gargoyle.png
- **Gargoyle B**: a stone beast on the dragon's bones (four legs, wings, a tail), grey, eyes lit. https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/creatures2-gargB.png
- **The Faolchú**: the dire wolf hunched, with two pairs of clawed arms from a red-glowing seam down its spine and orange sigil marks along its flanks, as the canon has it. https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/creatures2-faol.png

**Options:** (A) build them all as shown, with gargoyle B; (B) as shown, but with gargoyle A; (C) build the troll, golem and Faolchú and rethink the gargoyle; (D) not yet. **Recommendation: A.** Gargoyle A reads as a grey doll with wings (the people's body is too soft for stone). B sits like the carved beasts on a roof, and it uses the dragon's walk and flight poses as they are. The troll's face is the townsfolk's face grown large, so the build would give it a heavier brow and jaw. Slimes, the elementals, the Bog Crawler, the Sand Scorpion and the Shore Wisp would follow in a second prototype.
Michael: **As shown, but with gargoyle A** (B) — Get rid of cave troll cane or add a hammer, gargoyle A but with better wings - mesh for gargoyle B would be great for a dragon later, faolchu is great as is. (27 Sep 2026)
Done in part, Session 208 (auto): the Cave, Forest and Frost Troll are built as shown, with a maul in place of the cane (`docs/prototypes/trolls-ingame.png`). The golem, Session 209 (`docs/prototypes/golem-ingame.png`). Gargoyle A with better wings, Session 210 (`docs/prototypes/gargoyle-ingame.png`). The Faolchú, Session 211 (`docs/prototypes/faolchu-ingame.png`). All four done.

### Skills and perks — how should skills, levels and perks fit together? (the designer, 2026-09-27)
Today attributes are the only progression: a level-up puts up to eighteen points into them, Might pays 3% melee a point on top of a flat `level × 1.5`, and every enemy scales with your level. Which shape should skills that grow by use take, with weapon skills carrying damage and attributes at ≤1% a point? (Page: `docs/design/skills-and-perks.md`.)
- **A.** Morrowind's: major and minor skills level you; the level-up raises attributes by multipliers from what you used; perks arrive on their own at 25/50/75/100. Two Opus sessions.
- **B.** Skyrim's with attributes kept: every skill-up pays character XP; a level (at a bed) gives a perk point and three attribute points; perk trees per skill with some forks (Acrobatics 50: a double jump *or* a roll). Three Opus sessions, plus one to make enemies scale by place instead of by level.
- **C.** Dragonwilds': no character level; each skill offers a fork of two perks at 15/30/50/75/100; attributes grow from use. Four Opus sessions.

Recommendation: **B**, with enemy strength moved from your level to the place (region and dungeon floor), so a character who levels by alchemy doesn't meet harder wolves and friends in your world share one difficulty. It keeps the chunky level you asked for and makes each level a choice.
Michael: **A** — the Morrowind book. Be mindful of Oblivion Remastered's levelling, which worked well and had no scaling problem: take its fixes (attribute gains not tied to policing your own skill use; no punishment for levelling the wrong skills). Enemies by place rather than by level still stands as the designer's condition. (27 Sep 2026)

### Buildings — more detail and a character per nation (Session 179)
Backlog H.5: "buildings, houses, structures and POIs with more detail, quality and uniqueness". Today every house is one merged box: a box body, a paper-thin prism for a roof, flat dark rectangles for windows (104–200 triangles). The prototype is a new builder for the same house (still one merged mesh, one draw call), shown beside today's for four nations:
- **Irish cottage:** a rolled thatch, whitewash, a stone footing of rough stones, recessed small-paned windows. https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/houses-irish.png
- **Royale half-timbered:** braced framing, a jetty on joist ends, slate in courses, green shutters. https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/houses-french.png
- **Mark longhouse:** dark timber, shingles in courses, crossed horns on the gables. https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/houses-mark.png
- **Aurenne house:** plaster, a low-pitched roof of half-round tiles, rafter ends under the eaves, blue shutters. https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/houses-aurenne.png

Every house also gets a roof with thickness and eaves; a framed plank door with hinges and a step; a coursed stone chimney with a cap; and, by the house's own dice, a lean-to, a woodpile or a water butt, so two houses in a town differ. It costs 2.2–5.1k triangles a house against 0.1–0.2k. A town of forty houses is 90–200k more, so the build would want a distant copy (the townsfolk's LOD) and would bake courses and tiles only close up.

**Options:** (A) this direction, all nations, with a distant copy; (B) this direction but plainer (keep the roofs, windows, doors and footing; drop the courses, tiles and yard clutter), about 1k triangles a house and no LOD needed; (C) not yet: towns stay as they are while other things come first. **Recommendation: A.** Known faults to fix in the build: the thatch reads as a board (it wants a rounded, softer mass and a lower hip); the lean-to is crude; the Irish eaves come down over the window heads.
Michael: **A** — all of it, all nations, with a distant copy. Incorporate variations within each culture: anything Nordic can be part of the Markish designs, anything Mediterranean the Aurennais, anything Irish / Celtic / Western European the Irish-inspired nation. Fix the thatch, the lean-to and the Irish eaves as noted. (27 Sep 2026)
Done, Session 194 (auto): every house style builds the prototype's detailed house in the game, with variants drawn from each culture's neighbours (Irish thatch, slate, rubble stone, framed; the Mark's turf and shingle longhouses; Aurenne's plasters and shutters), today's house as its distant copy per 70-unit cluster, and the three faults fixed: the thatch is a rounded, lumpy slab with a rolled lip, the lean-to has posts, a sloping roof and plank walls, and the windows are kept under the eaves. Churches, keeps and the POIs follow. Issue #12 closed.

### Goblins and kobolds — what they look like (Session 178)
The canon has goblins among the antibodies "folklore had words for" and says nothing of their look; kobolds are not in it at all. Today both are the humanoid box. Everything else you fight in the open world is now on the shape kit (wolves, boar, spider, dragon, bandits, the undead), so these two are what's left, and their look is your call. The prototype puts both on the people's body (they would walk, run and strike as the bandits do), with the parts a person lacks hung on the bones. A townsperson stands at the left of each picture for scale.
- **Goblins A — the folklore goblin**: green, three-quarters of a person's height, a big head, long pointed ears, a long nose, ragged hide. https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/goblins-gobA.png
- **Goblins B — the antibody's goblin**: grey-brown and thin, ears swept back, no hair, amber eyes lit, spears and clubs. https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/goblins-gobB.png
- **Kobolds A — little reptile folk**: two-thirds of a person, scaled, a snout, a crest, a tail, spears (the modern game kobold). https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/goblins-kobA.png
- **Kobolds B — the old German kobold**: a small bearded earth-sprite in a hood with a mattock (the mine-spirit the word came from). https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/backlog/docs/prototypes/goblins-kobB.png

**Recommendation:** goblins A (they read at a glance as goblins, and the canon leans on folklore's words) and kobolds B (the Gatelands' folklore is Irish and Germanic, not tabletop, and a hooded mine-sprite sits better beside the kobolds' cowardice: they run to fetch friends). Other options: goblins B if the antibodies should all look a little wrong rather than storybook; or keep the kobolds as small goblins. Answer with the letters (and anything to change).
Michael: Goblins **A** (the folklore goblin) and kobolds **B** (the hooded earth-sprite with a mattock). (27 Sep 2026)
Done, Session 184 (auto): the open world's Goblin, Goblin Slinger and Kobold are people on the townsfolk's body (`FOE_DRESS`, `buildFoe`): the goblin green and big-headed with long pointed ears baked into the mesh, a club (the slinger empty-handed); the kobold a small hooded greybeard with a mattock. The dungeon's goblins and kobold thieves keep the dungeon's box body with the rest of the dungeon roster. Issue #11 closed.

### A systems designer on the team (Claude, 2026-09-27)
Michael: Yes — a seventh routine. The designer writes one proposal a day to docs/design/ (order: skills and perks, combat, magic, survival, sailing, platforming, online, journal and calendar) and raises each as a decision here. (27 Sep 2026)

### The night watch — guards walk a beat at night, and follow at favour ≤ −2 (the critic, 2026-09-27)
Michael: Yes, build it as proposed. Guards walk a lantern beat past the shop doors at night (a third guard at prosperity ≥ 60); at favour ≤ −2 the nearest guard on duty trails you at six to eight units while you are on the town's pad. One session, before any crime numbers are tuned. Systems builder's, section B. (27 Sep 2026)

### Wolves — the first creature on the shape kit (Session 163, issue #4)
Michael: Yes, build it. Same style as the townsfolk; fix the joint tubes, the heavy chest and the lunge's hind legs in the build. The other families (spiders, undead, dragon, mimic, bandits) follow the same way. (27 Sep 2026)
Done, Session 166 (auto): the four wolf kinds are in the game on the shape kit — a planted-paw trot and gallop, the crouch and spring, the joints knobbed and the limbs muscled rather than tubes, the chest narrowed (.63 of the body's breadth, against the prototype's .74), the lunge's hind legs driving back straight by IK. The other families are next, one session each.

### Plants — herbs sized and shaped by what they are (Session 164, issue #5)
Michael: Yes, at the prototyped sizes, and picking leaves the plant: a picked bush or sapling stays, minus its berries or leaves, and regrows. The tallest kinds cast shadows if a dense forest chunk's frame time allows. (27 Sep 2026)
Done, Session 167 (auto): the plants are in at the prototyped sizes; the two berry bushes, the rowan, the ashwort, the briarweed and the bracket stump stay when picked and grow back; goldenrod, the rowan, the thornberry, the moor tussock and wolf's bane cast shadows within 45 units of you. The frame check found that all loaded herbs together would be 1.8M triangles, so herbs are now drawn only within 100 units (137k in a loaded forest-edge frame, against about 400k for today's tufts over every loaded chunk).

### Boats — lofted hulls and rigging (Session 165)
Michael: Yes, with the rigs per class as proposed (sloop gaff sail, cog one square sail, galleon three masts) and the pirate and merchant looks. Fill the sails, add ratlines, fix the spritsail; the deck walk and the cabin door match the new hull. (27 Sep 2026)
Done, Session 168 (auto): the three classes, the two looks and the harbour boats are in the game with their rigs. The sails are filled (bellied most in the middle and low, the foot curving up at the corners); the shrouds carry ratlines; the galleon's spritsail hangs from a yard a third of the way out along the bowsprit. You stand on the deck only where the hull is. The hatch (the cabin door) and the wheel keep their places, both on the new deck.

### The world-file cut, today (the local Fable session, 4 Oct 2026)
Michael asked for the whole split and rearchitecture to land on 4 Oct. Step 1 was on main since 1 Oct (Session 379); step 2, breaking up `80-world.js`, sat as the Fable card `world-file` behind FREEZE #138, blocked on #115 (red on `guardplay`, which the freeze stopped the systems builder from fixing) and #134. The producer's 11:19 question offered A (lift the freeze), B (merge #115 red) and C (cut now, #115 to merge the rewritten world after).
Michael: **None of the three — the local session carries it all, today, the right way** (4 Oct 2026, in chat with Claude): fix `guardplay` on auto/systems (Session 483; it was real, not the runner), merge #134 and then #115 (its last red, `beastfall`, passes here on the merged state and on main: the runner, as ruled three times before), run the cut here on a branch with a PR so CI runs every shard, merge it, and keep FREEZE #138 until that PR is on main. Done, Session 484; the producer closes #138 and Michael pastes the nine world files into the builders' prompts.
