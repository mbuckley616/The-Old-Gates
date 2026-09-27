# Decisions

Questions the agents need Michael to answer, and his answers. An agent that needs a design call writes the question under **Pending** (and opens a `DECISION:` issue for the phone ping); Michael answers here, in chat with Claude, who writes the line beginning `Michael:`; the agent acts on it and moves the entry under **Answered** with a note of what it did. Nothing here is a spec until it carries a `Michael:` line.

## Pending

### The caravan attacked on the road — can you save it? (systems builder, 2026-09-27, issue #18)
Backlog B: *the caravan visibly attacked when a route breaks*. Today a route breaks silently on the day tick when a bandit camp stands within 500 units of the road's midpoint; the caravan just vanishes. Showing the attack is simple; what you can do about it is a rule of play.
- **A. Seen, not saved.** When it breaks and you're near the caravan, three or four of the camp's bandits fall on it, the merchant runs, and the overturned cart stays on the road until the route reopens. You can fight, but the route breaks while the camp stands. One session.
- **B. Defensible.** The same, and driving them off keeps the route that day (the camp threatens it again tomorrow). Not there: it breaks as now. One session.
- **C. A warning first.** The lord sends word a day ahead and the attack comes at a set hour; defend as in B. Two sessions, and new dialogue for the quest writer.

Recommendation: **B**. The caravan becomes something you can protect, with no new text, and the camp stays the real fix.

## Answered

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
