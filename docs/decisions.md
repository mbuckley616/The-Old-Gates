# Decisions

Questions the agents need Michael to answer, and his answers. An agent that needs a design call writes the question under **Pending** (and opens a `DECISION:` issue for the phone ping); Michael answers here, in chat with Claude, who writes the line beginning `Michael:`; the agent acts on it and moves the entry under **Answered** with a note of what it did. Nothing here is a spec until it carries a `Michael:` line.

## Pending

### Hesket Rowe at the yard — can she survive the League's duel? (the quest writer, 2026-09-30, issue #69)
The quest writer has drafted the real duel at Caer Slige (`docs/quest_drafts.md`, *The Yard at Caer Slige*). Today the League's ninth service kills Hesket Rowe: it is a fight with a Bandit Captain wearing her name, and the Captain's line after it mentions her burial. In the Crown's and the Compact's lines she is alive at the finale. With a yield in the ring, her fate becomes the player's call.

- **A. She lives if she yields and is spared** *(recommended)*. The yard's law is that nobody touches a fighter who has yielded. If the player strikes her after she yields, she dies, the yard calls it murder, and the League closes to the player. If she's spared, she stays at Caer Slige to watch the spire.
- **B. The duel is to the death, as built.** Only the player can yield.
- **C. She always lives.** The watchers catch any blow after her yield.

The draft is written for A. B and C each change only the lines marked **(fate)**.

## Answered

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

Michael: **A. Cut the strongbox, keep the risk** — . (30 Sep 2026, via the control room)

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

Michael: **A** — at rest and at thresholds. (29 Sep 2026, via the control room)

### Should a mayor offer to build what the town already has? (systems builder, 2026-09-29, issue #65)
The critic's s253: a lord offers *Pay for an inn / a chapel / walls / a guild hall* by what you have paid for there before (`investTopics` reads `st.builds`), not by what stands. Dunmore (prosperity 61) has four inns, a church, two guild halls and log walls, and its lord offers all four. A paid inn, chapel or guild hall where one stands adds no building (the generator adds each shop type once); paid walls only lift a fence to logs below prosperity 45. What the payment still does is add prosperity (+8 to +10) and count toward the three builds that unlock *Take the deed*.

- **A. Offer only what the town lacks** *(recommended)*: no inn where an inn stands, no chapel where a church stands, no guild hall where one stands, no walls where they are logs or better; the well and the harbour as they are. Every payment puts something new in the town. A big town has fewer builds toward the deed (Dunmore: the well only), so see C.
- **B. Leave the offers, change the words**: *Pay to enlarge the inn* where one stands. Same money, prosperity and deed.
- **C. A, and a big town's deed asks for favour instead**: where fewer than three builds are possible, the deed needs favour 8 in place of three builds.
- **D. Leave it.**

Michael: **A** — offer only what the town lacks. (29 Sep 2026, via the control room)

### Unblock auto/systems — a walls/LOD test failed on one of two CI runs (the producer, 2026-09-29)
PR #22 (auto/systems, head 7e4b078) had two CI runs on the identical commit: the push-triggered run passed all 18 suites clean; the pull-request-triggered run failed one — walls.test.mjs's distant-LOD check ("its detailed clusters show near and give way to their plain twins far") — with the other 17 suites green. Session 341, the only change since Michael's last approval, touches buff stacking (a weaker herb or Shield no longer ending a stronger shrine boon); nothing in it touches walls, towers, or LOD. Same pattern as the unblock-auto-systems flake Michael ruled on two days earlier.

- **A, merge anyway** *(recommended)*. Nothing in Session 341's diff touches walls, towers, or LOD, and the identical commit already ran clean on a separate trigger.
- **B, wait for a clean run.** Leave it blocked until CI happens to pass clean on this exact head on both triggers.
- **C, re-run once more first.** Trigger a fresh CI run on this head and see if it clears before merging.

Michael: **A — merge anyway.** (29 Sep 2026, via Slack)

Claude merged 7e4b078 onto main as 1445aaf. Session 350 (on auto/systems) root-caused it for real afterwards: the check measured a town the loader had already streamed out, 1,300 units off, in 1 run in 3; it now measures the live town and passes 6 of 6.

### What Fortune's "+1% loot quality" does (the systems builder, 2026-09-29, issue #64)
The Fortune card promises *+2% crit chance, +1% loot quality* a point. The crit is built (Session 328). No code reads loot *quality*: a dropped sword is the same tier at Fortune 0 and 10. Fortune does two things the card never mentions, both since v61c0: +5% a point on every gold roll (`rollGold`: barrels, corpses, chests), and +2.5% a point on the chance a slain foe drops an item (`lootDropChance`, base 35%). A Fortune build gets something real but is told something else.

- **A. Make the card say what Fortune does** *(recommended)*: *+2% crit chance, +5% gold found, +2.5% item drop chance* a point. No rule changes, and it is the truth.
- **B. Keep both, and add quality**: each point is a 1% chance that a dropped or chest piece of gear comes one material up (Iron → Steel), never past Cosmic.
- **C. Quality instead of more gold**: B's 1% a point for the tier, and the gold roll's +5% a point is removed (the drop chance stays).
- **D. Leave it** until the skills proposal decides what Fortune is for.

Michael: **A** — make the card say what Fortune does. (29 Sep 2026, via the control room)

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
