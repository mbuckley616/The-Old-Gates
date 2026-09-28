# Decisions

Questions the agents need Michael to answer, and his answers. An agent that needs a design call writes the question under **Pending** (and opens a `DECISION:` issue for the phone ping); Michael answers here, in chat with Claude, who writes the line beginning `Michael:`; the agent acts on it and moves the entry under **Answered** with a note of what it did. Nothing here is a spec until it carries a `Michael:` line.

## Pending

## Answered

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
