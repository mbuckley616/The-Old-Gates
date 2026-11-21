# Rare materials and the top tiers

*The systems designer, 21 Nov 2026. A proposal, not a spec: nothing here is built until docs/decisions.md carries a `Michael:` line under it.*

## The problem in Michael's words
Backlog L11, *Gathering* (OG-132, his note): "biome cards naming what grows where (nine biomes), meals with a stated buff (venison pie against cold, coastal chowder for breath under water, rations that keep), tool tiers, warm and cold as light rules (Michael's 5 B), rare materials (sigil stone, star iron, skywood, deep pearl). Not hunger or thirst (survival C); fishing and hunting wait on the survival page."

The field guide (#1463 B), cooking (#1339) and climate (5 B) built the rest. Left: **tool tiers** and **the four rare materials**, which answer one gap in the forge.

## Today
`MATERIALS` (`14-items.js`) has ten tiers, Wooden to Cosmic, and `SKILL_GATE` (`12-character.js`) asks 75, 90 and 100 of a skill for the top three. The forge (`forgeSmelt`, `INGOT_DEF` in `50-travel.js`) makes ingots up to Obsidian (tier 7) from the vein table's ores, and its tempers (`TEMPER_ORES`) also stop at 7. Draconic, Demonic and Cosmic exist only as loot, drawn at weights of 0.5, 0.2 and 0.08 out of about 105. A dragon's lair already drops 1–2 **Dragon Scales** (`68-dungeon-misc.js`, 400 gold each), and they do nothing but sell. A lesser gate's keep has a crystal vein (`gateVeinStrike`), and its crystal sets an implement as *found*. There is one pick (40 gold, a strike every 0.9 s, `VEIN_STRIKE`) and one hatchet (30 gold). Deep water (`diveTick`, 40 s of breath) holds wrecks and sea herbs, no material.

## Direction A: four finds that better what you make
**The loop.** Each material is a place you go and a small edge on something you already make. The top three tiers stay loot.

| Material | Where | Use |
|---|---|---|
| Star iron | a fallen star (below) | one in place of an ingot makes the piece a Masterwork (+20%), with or without the perk |
| Sigil stone | a failing or catastrophic lesser gate's keep, one script stone beside the crystal vein, struck once | set in a shield at the forge: −25% from that gate's school |
| Skywood | one lone pine on each of the Mark's peaks (`spinePeaks`), above the tree line; back in 30 game days | a bow strung from it draws 20% faster |
| Deep pearl | oyster beds below 15 m off Aurenne, one oyster in six | set in an amulet: +20 s of breath (60 s in all) |

**Cost.** Three systems sessions and one look session (the crater, the pine, the bed). Cheap, but four side-bonuses a player at Smithing 100 does not need, and the forge still ends at 7.

## Direction B: the top three made, from the rarest things in the world (recommended)
**The loop.** Each top metal has its own source, and that source is something the world already has or can show: a dragon killed, a dying gate robbed, a star you saw fall. Smithing 75, 90 and 100 then mean something you can do, not only something you can wear. Loot still drops all three as it does now, so the forge is a second road and not the only one.

**The metals.**

| Tier | Ingot | Skill | Source | A sword (2 ingots) / a full kit and weapon (15) | Why |
|---|---|---|---|---|---|
| 8 Draconic | 1 Dragon Scale + 2 obsidian ore → 2 ingots | Smithing 75 | a dragon's lair, 1–2 scales (8% of lairs, and the Salt Mouth) | 1 scale / 8 scales, about 5 dragons | the scale already drops; selling it (240) or making with it becomes a real choice. Skyrim's dragonbone, kill for kill |
| 9 (today *Demonic*) | 1 sigil stone + 2 obsidian ore → 2 ingots | Smithing 90 | one script stone in each failing or catastrophic lesser gate's keep, beside the crystal vein, struck once with a steel pick or better; never returns | 1 stone / 8 gates | a finite supply; and the stone is **gate salvage** (`markSalvage`), its mark carried into the ingot and the piece, so sold in an Aurenne church town it is sacrilege (S2245). What you made it from follows you |
| 10 Cosmic | 1 star iron + 1 adamant ingot → 1 ingot | Smithing 100 | a fallen star: 3 pieces, struck with a mithril pick; never returns | 2 pieces / 15 pieces, 5 stars | the rarest, and the only one the sky gives you; Morrowind's raw glass, seen falling |

The Smelter perk (3 ore → 2) does not apply to these three: the rare piece is the limit, not the ore.

**The falling star.** One a game-week on each island (7 game days, about 2.8 hours of play), at an hour of night and a cell both seeded by island and week, so a friend in a hosted world sees the same star. Outdoors on that island at that hour, you see a streak across the sky toward it (1.5 s; the look builder's one quad). The next morning any inn on the island has the line *A star came down past [the nearest named place]*, and the map marks the cell, not the spot. The crater is 6 m across, scorched, with a dark lump that glints at night within 40 m. It lies until struck out; an island keeps two at most, the older gone when a third falls.

**Tempers.** The forge has no temper past Obsidian today. Under B, a **deep pearl** is the temper of tiers 8–10 (+8% as any temper, the same three or four a piece). Pearls are found as in A: off Aurenne below 15 m, one oyster in six, a bed of 5 returning in 14 game days.

**Skywood.** A bow of tier 8–10 (the bench, Joinery at the gate) takes 2 skywood planks in place of its 2 planks: one pine on each Mark peak, felled with a steel hatchet, back in 30 game days, 1 log = 2 planks.

**Tool tiers.** The pick and the hatchet are made at the forge in iron, steel and mithril (2 ingots and 1 plank, Smithing at the metal's gate); the bought ones stay iron.

| Tool | Strike | Reaches |
|---|---|---|
| Iron (bought, 40 / 30 gold) | 0.9 s | veins of tiers 1–3, every tree |
| Steel | 0.75 s | the wastes' veins (adamant, obsidian), sigil stone, skywood |
| Mithril | 0.6 s | star iron |

Gating the wastes' veins at steel is the one thing B takes away; 4 iron ore and a charcoal answer it.

**Touches.** `INGOT_DEF`, `TEMPER_ORES`, `forgeSmelt` and the forge page (`openForgePage`) for the three ingots and the pearl. `PICK_ITEM`/`HATCHET_ITEM` and `VEIN_STRIKE` read the tool's tier, and `chopTool` and `strikeVein` check it. The bench's bow recipe in `50-travel.js`. The lair loot already gives the scale. The keep (`GATE_KEEP_LIE`) gets a script stone beside the vein in failing and catastrophic gates, and the salvage mark passes through the forge. The star's seed, streak, crater and inn line live in the world files: `88-world-ticks.js` for the tick, `89-world-land.js` for the streak on the new look, and the inn's topics in `83-world-generator.js`. The beds go in `85-world-sea.js`, the pines in the chunk scatter, and the map mark in `drawLocalMap`. New `worldState` keys, all the world's (added to the S242 list, not to `SS_CHAR_WS`): `stars` (`star:<island>:<week>` → pieces taken), `sigilStones` (gate seed → struck), `pearlBeds` (`<cx,cz>:pearl:<i>` → taken and day), `skywood` (peak id → day felled). Every id is place and index; every roll is `seededRng` keyed by them (the co-op rules). The materials ride in `BAG`, in the character row.

**Cost.** Five ordinary systems sessions: (1) tool tiers and the Draconic ingot; (2) sigil stones in failing gates' keeps and the mark carried through the forge; (3) the falling star, its seed, crater, inn line and map mark; (4) skywood and the top bows; (5) deep pearls and the top tempers. One look session gives the crater, the streak, the script stone, the pine and the oyster bed as kit pieces. No deep work: the forge and the bench are one builder's files.

## Direction C: B, plus a smithy that has grades
B, plus OG-133's *three grades of smithy*. A village smith's forge works to Steel and a town's to Adamant, and the top three only at one great forge an island (a keep's, by the canon's own powers). So the top tiers ask a journey as well as a find. Three more sessions (the grade by settlement size, the great forge's room, the forge page's refusal) and a look session. It crowds the fort armoury's smelter (S1514). It belongs to *Workstations*, the next backlog item.

## Recommendation
**B.** The second feeling asks for a challenging, rewarding progression, and today the forge's ladder stops three rungs short of the skill's own gates. B finishes it with things that are hard to get in ways the player can see: a dragon, a dying gate, a star. One of the three, the sigil stone, is a decision with consequences under Aurenne's law. It reads only seeded, keyed state, so a shared world holds the same stars and stones. A is cheaper but adds side-bonuses nobody at Smithing 100 needs. C's grades are Workstations' question and should be asked there.

## What must be true first
Nothing blocks B. The lairs, the dragon's scale, the keep and its vein, the forge, the bench, diving, `spinePeaks` and the salvage law are built. The falling star's streak wants the new look's sky (`landSky`, card F3, built). The crater's glint must keep the dropped-frame rule: the star's hour is read from `gameTimeAbsMinutes`, never counted in frames.

## Not asked
- **The names of tiers 9 and 10.** *Demonic* has no place in a canon with no demons, and *Workstations* asks for a native name for the top tier. That is the quest writer's call; this page uses the tier numbers.
- **Biome cards, meals with buffs, warm and cold**: the field guide, cooking and climate pages, built.
- **Tool wear**: the kit's C, declined; the tools never break.
- **The smithy's grades, the four-step brew, the travel alchemy kit**: Workstations (OG-133), the next page.
- **Hunting and fishing as sources**: survival's, already built (hides, the rod, the net).
