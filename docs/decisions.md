# Decisions

Questions the agents need Michael to answer, and his answers. An agent that needs a design call writes the question under **Pending** (and opens a `DECISION:` issue for the phone ping); Michael answers here, in chat with Claude, who writes the line beginning `Michael:`; the agent acts on it and moves the entry under **Answered** with a note of what it did. Nothing here is a spec until it carries a `Michael:` line.

## Pending

## Answered

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

### Coach tickets — what does a ticket buy, and what does it cost? (systems builder, 2026-09-28, issue #31)
Michael's answer on #24 (the coaching inn, B) included *tickets sold here*. The inn, the driver and the travellers are built (Sessions 237–238). Tickets are held back, because today every coach is **free to ride**. The player raised the road themselves (600 gold and up), so a ticket needs a rule.
- **A. A seat held.** A ticket costs nothing. Taking one from the keeper makes the next coach wait at the inn until you board, up to an hour, so you can eat or sleep without missing it. Riding stays free.
- **B. Fares everywhere.** Every ride costs a fare, about a tenth of the road's length in gold (a 548-unit road is 55 gold). You pay it at the inn or at either end, the driver takes it as you board, and it goes to the road's two towns as prosperity.
- **C. No tickets.** The coach stays free and the keeper's board is enough.

Recommendation: **A**. It gives the inn a reason to stop, and it doesn't charge you to ride a road you paid to build.
Michael: **A seat held** (A) (28 Sep 2026, via the control room)
Built, Session 267 (systems builder): the coaching inn's keeper holds a seat on the next coach to call, either way, for nothing. That coach waits at the door up to an hour past its call and goes on when you board or the hour is up. The coach stands still while you're indoors, so a seat is also settled on coming out: if its call has come and the hour isn't up, it is at the door. Issue #31 closed.

### Wealth in clothes — poor, middling and well-off townsfolk (Session 246)
Michael: **Role and the town's prosperity** (A) (28 Sep 2026, via the control room)

### The player's swings in third person — anticipation and follow-through (Session 245)
Michael: **As shown** (A) (28 Sep 2026, via the control room)

### Shading in the creases of the townsfolk — baked ambient occlusion (Session 243)
Michael: **This strength** (A) (28 Sep 2026, via the control room)

### Cloaks and hair that swing (Session 242)
Michael: **Cloak and back hair** (A) (28 Sep 2026, via the control room)

### What a picked herb leaves behind (Session 237)
Michael: **A stub on turned earth** (A) (28 Sep 2026, via the control room)

### The first-person weapon on the kit too? (Session 232)
Michael: **Yes, every weapon** (A) — "Check the bow again - it looks like it’s facing backwards, towards the player" (28 Sep 2026, via the control room)

### The road coach, its horses, and the shark (Session 230)
Michael: **All three as shown** (A) (28 Sep 2026, via the control room)

### The world's rocks — boulders, outcrops and clusters, dressed by biome (Session 228)
Michael: **All three kinds, dressed by biome** (A) (28 Sep 2026, via the control room)

### Combat — which shape should the fight take: tightened, Elden Ring's, or directional? (the designer, 2026-09-28)
Michael: **Elden Ring's shape** (B) — "I like the idea of moving more towards Elden ring combat, but it’s a pretty fundamental change… as long as this is possible I’m up for it." (28 Sep 2026, via the control room)

### The Bog Crawler's own body — a diving beetle or a giant water bug (Session 225)
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
Michael: **B** — as shown, but the Bog Crawler gets a six-legged crawler's body of its own (a beetle or giant water-bug), prototyped first; the rest built one or two a session. (27 Sep 2026, via the control room)

### The caravan attacked on the road — can you save it? (the systems builder, issue #18)
Michael: **B** — defensible: bandits fall on it, the merchant runs, an overturned cart stays; driving them off keeps the route that day, the camp threatens again tomorrow. One session. (27 Sep 2026, via the control room)
Built, Session 230 (systems builder): as answered. The threat's hour falls on the outbound leg, u .35–.65 of the road; you must be within 150 units of the caravan then; leaving 250 units with bandits alive breaks it. The duplicate entry left under Pending was removed. Issue #18 closed.

### The weapon kit — swords, axes, maces, bows, staves and shields on the shape kit (Session 220)
Michael: **A** — the kit for everyone: the player's weapons in third person, every foe armed by what it is; foes' weapons are looks only, damage unchanged. (27 Sep 2026, via the control room)

### The interface — parchment and ink, and where the HUD sits (the concept artist, 2026-09-27)
Backlog E asks for the whole interface "as close to Oblivion's design as we can — parchment and scroll", style page first. The style page is `docs/prototypes/ui/index.html`: nine 1280×720 screens with build s171's own text and numbers in Dunmore (two HUD layouts, inventory, magic, attributes, quests, map, a conversation, and the kit). Panels are one parchment sheet with a torn edge (an SVG displacement filter over a CSS gradient and noise, no images), dark-brown ink, red rubric for headings and anything new or chosen, faded ink for locked or spent; tabs are bookmarks on the sheet's top edge; close is a wax seal. The HUD sits on the world in dark iron and bronze. Type is IM Fell English SC for headings and EB Garamond for lists and numbers (both OFL, 290 KB). The emoji icons (🪖 👕 🧪 🗝) become 31 drawn ink icons (24×24 SVG, one stroke). Magic is regrouped by sigil, one line a spell with an English gloss and the cost in a column (the legibility ask). The world map is today's, inked into the paper.
- **A.** Parchment everywhere, and the HUD in Oblivion's places: health, mana and stamina with the readied weapon and spell bottom-left, the compass bottom-centre, the minimap kept top-right as a bronze-ringed disc. Today's yellow HUD text over a bright sky is hard to read (`current-hud.png`); the bottom keeps it off the sky.
- **B.** Parchment everywhere, the HUD restyled but left where it is now (vitals top-left, compass top-centre).
- **C.** Parchment only for what you read (conversation, quests, books, notice boards, map); inventory, magic and attributes keep a dark panel with the new type and icons. Less change, less Oblivion.

Recommendation: **A**. It is the look asked for, and the HUD moves off the sky. One Fable session applies the kit to every panel (the shop, loot, save/load, lockpicking and the creator follow the same sheet); the journal stays its own item.
Screens: [HUD, today beside A](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/compare-hud-a.png) · [HUD, B](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/new-hud-b.png) · [inventory, today beside proposed](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/compare-inventory.png) · [magic, today beside proposed](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/compare-magic.png) · [attributes](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/new-attributes.png) · [quests](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/new-quests.png) · [map](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/new-map.png) · [conversation, today beside proposed](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/compare-dialogue.png) · [the kit: colours, type, states, icons](https://raw.githubusercontent.com/mbuckley616/The-Old-Gates/auto/concept/docs/prototypes/ui/new-kit.png)
Michael: **Parchment everywhere; HUD in Oblivion's places** (A). (27 Sep 2026)

### Trolls, golems, gargoyles and the Faolchú — what they look like (Session 201)
Michael: **As shown, but with gargoyle A** (B) — Get rid of cave troll cane or add a hammer, gargoyle A but with better wings - mesh for gargoyle B would be great for a dragon later, faolchu is great as is. (27 Sep 2026)

### Skills and perks — how should skills, levels and perks fit together? (the designer, 2026-09-27)
Today attributes are the only progression: a level-up puts up to eighteen points into them, Might pays 3% melee a point on top of a flat `level × 1.5`, and every enemy scales with your level. Which shape should skills that grow by use take, with weapon skills carrying damage and attributes at ≤1% a point? (Page: `docs/design/skills-and-perks.md`.)
- **A.** Morrowind's: major and minor skills level you; the level-up raises attributes by multipliers from what you used; perks arrive on their own at 25/50/75/100. Two Opus sessions.
- **B.** Skyrim's with attributes kept: every skill-up pays character XP; a level (at a bed) gives a perk point and three attribute points; perk trees per skill with some forks (Acrobatics 50: a double jump *or* a roll). Three Opus sessions, plus one to make enemies scale by place instead of by level.
- **C.** Dragonwilds': no character level; each skill offers a fork of two perks at 15/30/50/75/100; attributes grow from use. Four Opus sessions.

Recommendation: **B**, with enemy strength moved from your level to the place (region and dungeon floor), so a character who levels by alchemy doesn't meet harder wolves and friends in your world share one difficulty. It keeps the chunky level you asked for and makes each level a choice.
Michael: **A** — the Morrowind book. Be mindful of Oblivion Remastered's levelling, which worked well and had no scaling problem: take its fixes (attribute gains not tied to policing your own skill use; no punishment for levelling the wrong skills). Enemies by place rather than by level still stands as the designer's condition. (27 Sep 2026)

### Buildings — more detail and a character per nation (Session 179)
Michael: **A** — all of it, all nations, with a distant copy. Incorporate variations within each culture: anything Nordic can be part of the Markish designs, anything Mediterranean the Aurennais, anything Irish / Celtic / Western European the Irish-inspired nation. Fix the thatch, the lean-to and the Irish eaves as noted. (27 Sep 2026)

### Goblins and kobolds — what they look like (Session 178)
Michael: Goblins **A** (the folklore goblin) and kobolds **B** (the hooded earth-sprite with a mattock). (27 Sep 2026)

### A systems designer on the team (Claude, 2026-09-27)
Michael: Yes — a seventh routine. The designer writes one proposal a day to docs/design/ (order: skills and perks, combat, magic, survival, sailing, platforming, online, journal and calendar) and raises each as a decision here. (27 Sep 2026)

### The night watch — guards walk a beat at night, and follow at favour ≤ −2 (the critic, 2026-09-27)
Michael: Yes, build it as proposed. Guards walk a lantern beat past the shop doors at night (a third guard at prosperity ≥ 60); at favour ≤ −2 the nearest guard on duty trails you at six to eight units while you are on the town's pad. One session, before any crime numbers are tuned. Systems builder's, section B. (27 Sep 2026)

### Wolves — the first creature on the shape kit (Session 163, issue #4)
Michael: Yes, build it. Same style as the townsfolk; fix the joint tubes, the heavy chest and the lunge's hind legs in the build. The other families (spiders, undead, dragon, mimic, bandits) follow the same way. (27 Sep 2026)

### Plants — herbs sized and shaped by what they are (Session 164, issue #5)
Michael: Yes, at the prototyped sizes, and picking leaves the plant: a picked bush or sapling stays, minus its berries or leaves, and regrows. The tallest kinds cast shadows if a dense forest chunk's frame time allows. (27 Sep 2026)

### Boats — lofted hulls and rigging (Session 165)
Michael: Yes, with the rigs per class as proposed (sloop gaff sail, cog one square sail, galleon three masts) and the pirate and merchant looks. Fill the sails, add ratlines, fix the spritsail; the deck walk and the cabin door match the new hull. (27 Sep 2026)
