# Decisions

Questions the agents need Michael to answer, and his answers. An agent that needs a design call writes the question under **Pending** (and opens a `DECISION:` issue for the phone ping); Michael answers here, in chat with Claude, who writes the line beginning `Michael:`; the agent acts on it and moves the entry under **Answered** with a note of what it did. Nothing here is a spec until it carries a `Michael:` line.

## Pending

### Coach tickets — what does a ticket buy, and what does it cost? (systems builder, 2026-09-28, issue #31)
Michael's answer on #24 (the coaching inn, B) included *tickets sold here*. The inn, the driver and the travellers are built (Sessions 237–238). Tickets are held back, because today every coach is **free to ride**. The player raised the road themselves (600 gold and up), so a ticket needs a rule.
- **A. A seat held.** A ticket costs nothing. Taking one from the keeper makes the next coach wait at the inn until you board, up to an hour, so you can eat or sleep without missing it. Riding stays free.
- **B. Fares everywhere.** Every ride costs a fare, about a tenth of the road's length in gold (a 548-unit road is 55 gold). You pay it at the inn or at either end, the driver takes it as you board, and it goes to the road's two towns as prosperity.
- **C. No tickets.** The coach stays free and the keeper's board is enough.

Recommendation: **A**. It gives the inn a reason to stop, and it doesn't charge you to ride a road you paid to build.

### Guards indoors — what happens when you are seen inside a building? (systems builder, 2026-09-28, issue #23)
The crime system's owed item. Today a keeper who sees you pick a lock or empty a strongbox indoors puts the fine on you at once, but no guard does anything while you stay inside. The confrontation (*Halt. There's a fine…*) only runs in the street, when a guard is within five units of you, so you can finish robbing the house and walk out. Whether a guard comes in after you is a rule of play.
- **A. The guard waits at the door.** When you are seen indoors, the nearest guard on duty walks to that building's door and waits there. You meet the usual halt as you step out: pay, refuse and fight in the street, or yield. Nothing new indoors. One session.
- **B. The guard comes in.** Half a minute after you are seen, a guard enters and halts you inside. Paying works as in the street. Refusing, he draws there, which needs a fight indoors (interiors have no enemies today). Two sessions.
- **C. The keeper shouts, and you are thrown out.** Being seen ends the visit: a fade, you are put out at the door, and the guard is there as in A. The robbery stops at the first thing you are seen doing. One session.

Recommendation: **A**. It closes the gap (you can't walk out unmet), keeps the fight where the fighting code already works, and leaves room to go on robbing the back room at a known price.

## Answered

### The coaching inn halfway — what is inside? (systems builder, 2026-09-28, issue #24)
Backlog B, coach lines: *enterable coaching inns (what they hold inside is Michael's call)*. Since Session 178 the coach stops for a quarter of an hour at the two-storey inn halfway along a coaching road. The inn is a shell: you can't go in. Town inns already have a keeper, food, rooms to let (Session 141) and rumours, and a coaching inn in town already shows a timetable board and a tack corner.
- **A. A roadside inn.** The town inn's interior at a smaller size: a keeper from the nation the inn stands in, a meal and drink, one room to let (sleep until the next coach), and the timetable board and tack corner. One session.
- **B. A, and the coach's other half.** Also the coach's driver and a passenger or two waiting in the common room, and buying a ticket here for the next coach either way. One session more.
- **C. A waystation only.** One room with the board, a bench and a trough: shelter from weather, no keeper, no trade. Half a session.

Recommendation: **A**. It makes the stop worth getting off for, reuses the town inn's builder and keeper, and needs no new writing beyond what town inns already say.
Michael: **B — A, plus the coach's other half** (the roadside inn, and the driver and a passenger or two waiting in the common room, tickets sold here). (28 Sep 2026, via the control room; issue #24)
Built, Session 237 (systems builder): **A** — the inn is enterable from the road: a keeper of the country it stands in, the town inn's meal and room (one to let; travellers hold the rest), the coach's board and tack corner, and the keeper tells when each coach calls. Session 238: the driver and one or two travellers wait in the common room while the inn is open. Tickets are held back as their own question (issue #31): the coach is free today.

### The last box creatures — Ogre, Cave Bear, slimes, Fire Elemental, Bog Crawler, Sand Scorpion, Shore Wisp (Session 214)
Michael: **B** — as shown, but the Bog Crawler gets a six-legged crawler's body of its own (a beetle or giant water-bug), prototyped first; the rest built one or two a session. (27 Sep 2026, via the control room)

### The caravan attacked on the road — can you save it? (the systems builder, issue #18)
Michael: **B** — defensible: bandits fall on it, the merchant runs, an overturned cart stays; driving them off keeps the route that day, the camp threatens again tomorrow. One session. (27 Sep 2026, via the control room)
Built, Session 230 (systems builder): as answered. The threat's hour falls on the outbound leg, u .35–.65 of the road; you must be within 150 units of the caravan then; leaving 250 units with bandits alive breaks it. The duplicate entry left under Pending was removed. Issue #18 closed.

### The weapon kit — swords, axes, maces, bows, staves and shields on the shape kit (Session 220)
Michael: **A** — the kit for everyone: the player's weapons in third person, every foe armed by what it is; foes' weapons are looks only, damage unchanged. (27 Sep 2026, via the control room)

### The interface — parchment and ink, and where the HUD sits (the concept artist, 2026-09-27)
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
