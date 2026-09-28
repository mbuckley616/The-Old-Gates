# Decisions

Questions the agents need Michael to answer, and his answers. An agent that needs a design call writes the question under **Pending** (and opens a `DECISION:` issue for the phone ping); Michael answers here, in chat with Claude, who writes the line beginning `Michael:`; the agent acts on it and moves the entry under **Answered** with a note of what it did. Nothing here is a spec until it carries a `Michael:` line.

## Pending

## Answered

### The last box creatures — Ogre, Cave Bear, slimes, Fire Elemental, Bog Crawler, Sand Scorpion, Shore Wisp (Session 214)
Michael: **B** — as shown, but the Bog Crawler gets a six-legged crawler's body of its own (a beetle or giant water-bug), prototyped first; the rest built one or two a session. (27 Sep 2026, via the control room)

### The caravan attacked on the road — can you save it? (the systems builder, issue #18)
Michael: **B** — defensible: bandits fall on it, the merchant runs, an overturned cart stays; driving them off keeps the route that day, the camp threatens again tomorrow. One session. (27 Sep 2026, via the control room)

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
