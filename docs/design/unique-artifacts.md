# Unique artifacts in the world

*The systems designer, 6 Oct 2026. A proposal, not a spec: nothing here is built until docs/decisions.md carries a `Michael:` line under it. The names below are working names; the real ones, and every line anyone speaks, are the quest writer's.*

## The problem in Michael's words
> "Can we add a few ‘unique’ items with their own quests / placed in random spots in the world? And can we weave some of them into the lore? I’d like something comparable to the daedric artifacts from the elder scrolls. Maybe some of them are plainly visible in the world, but require a skill check to obtain (i.e. Might must be at 30 to pull sword from stone)." (backlog J, 28 Sep 2026; "the lore half is the quest writer's; ties to the skills proposal")

The brief decides what an artifact has to be. If it is only a better sword it is *buy more/better* found in a chest. It has to carry a decision with a consequence you can see (feeling 1), and it has to be a step in progression that you reach by getting good at something (feeling 2).

## Today
There is one artifact of the kind Michael means: **the Faolchú's Mark**, the tier-5 amulet the Faolchú drops in burned Ashenmoor. It carries `faolchu_mark`, an enchant flagged `_unique` in `ARMOR_ENCHANTS` (`14-items.js`) so the random roller never gives it out. The Forge-Man's Hammer, Aldwyn's Seal, Edna's Rubbing and the Royal Mage Commission are quest items marked `unique:true`, and `sellItem` and the destroy gate (`60-shop.js`, `66-hub.js`) refuse to part with them. The places an artifact needs already exist: the six Makers' shrines (`GODS`), the seeded anchored places (`anchoredPlaces`), lair masters (`lairFinish`), wrecks, `PEAKS`, the tides and the sigil gates (`sigilDoors`). There are no skills yet (Michael's A on the skills page, not built), so a check can read only the attributes today: Might 30 sits between the Adamant (24) and Obsidian (32) requirements in `MATERIALS`, a mid-game number for a Warrior and a late one for a Mage.

## What the canon allows
No prophecy: nothing is meant for the player. The Makers named six gods for their work (§4.1); the seventh, the Guest, has no shrine and gets no artifact, since an object would settle the Church's quarrel about whether it is a god. Relics are an economy the Crown taxes and the Compact calls sacrilege (§1.1, §1.3), so a relic has claimants. Seam-material is a category (the Mark). Reading the sigils is forbidden, so anything that helps you read them pays the Cold (§3.3).

## Shared by every direction
- **One of each per world.** The place is picked from the seed as `anchoredPlaces` picks Caer Slige, so a friend in the host's world sees the same stone. Taking it writes `worldState.artifacts[id]` (world row; the S242 list); the item rides the character row. `unique:true` stops selling and destroying; a dropped one goes home.
- **The check reads the attribute's base plus at most 2 from gear**, so a Fortify ring closes a small gap but no one buys Might 30. With the skills build each moves to a skill at 50 (Blade for the sword), one line each.
- **Failing costs nothing.** The log says what you lack in the world's words (*The stone does not move. Not yet.*) and the journal keeps it under *Things not yet yours*: a visible artifact becomes a goal.

## Directions

### A. The stone and the sword: placed relics
**The loop.** You ride past something plainly not furniture (a blade in a standing stone, a helm on a cairn), fail the check, and come back levels later. One inn rumour each (`liveRumours`), no quest.
**Rules.** Eight relics, three on the home island and the rest on the far islands (the brief: one continent deep first). Each is gated by one attribute at 30, or Intelligence at 35 to match Mastery. Each gives a tier-6 enchant and one rule nobody else has (the sword: ×1.5 posture damage).
**Touches.** `anchoredPlaces` (eight constraints), a relic prop on the shape kit, the eight `_unique` enchants, `worldState.artifacts`, the journal line.
**Conflicts.** The reward is a number and the check an attribute you were raising anyway: no decision in it.
**Cost.** Two Opus sessions (the frame and the eight items; the props), one quest-writer run for the rumours.

### B. The Makers' tools: six, one to each god, each with a trial and a claimant *(recommended)*
**The loop.** A Maker's shrine keeper (or an Old Blood hermit) tells you the god's tool lies somewhere. Each is found in that god's own way, changes how you play rather than how hard you hit, has a cost, and is wanted by someone: keep it and pay, or hand it over for their price. This is Oblivion's Daedric shape (a shrine, a task in the god's character, a reward that bends a rule), except the god has no voice: the Makers are dead and their gods are words for their work.

**Rules.**

| Maker | Tool (working name) | Where it lies, and the trial | Check | What it does | What it costs | Who wants it |
|---|---|---|---|---|---|---|
| An Chloch, the Stone | the Gate-Blade | in a standing stone outside a ruined gate, plainly visible | Might 30 (Blade 50) | a blade at tier 6 that opens a sigil gate's door without the gate's key | 14 weight; sprint costs +25% while it is drawn | the Crown, for its licence: 1,500 gold and Commissioner rank, or keep it and pay a tithe of 5% on every sale |
| An Mhuir, the Sea | the Drowned Bell | a wreck on a rock that is above water only at low tide (hours 0–6 and 12–18) | none: the tide is the trial | your ship takes half the wear of rough seas and storms (`shipWear`) | black sails within 600 units steer for you | the Compact, who say it is a sealed gate's reliquary: Factor rank and a cog, or keep it |
| An Spéir, the Sky | the Sundial Ring | on a peak's cairn, readable only at noon on a clear day | Swiftness 30 (Athletics 50), for the climb against the clock | once a day, turn the weather: clear to rain or rain to clear (`WX`) | lightning strikes within 40 units of you in a storm, 1 in 3 strikes | nobody; the peak is the cost |
| Na Beithígh, the Beasts | the Wolf-Mother's Cloak (the named cloak the cloak page reserved) | worn by a lair's master | Resolve 30, to walk in and leave without killing it | wolves, bears and spiders leave you alone unless you strike first | the beast lives, so its lair stays on the map, the road near it stays broken (`roadBroken`) and that town's prosperity drifts down 0.6 a day | the Fighters' Guild, who want the beast dead: kill it and the cloak comes off a corpse, worth half as much |
| An Teallach, the Hearth | the Waylamp | passed from inn to inn: carry it lit through five towns' inns without a crime on your account | none: an honest week is the trial | any inn's room and any coach seat costs nothing | a crime while you carry it puts out the lamp for seven days and doubles that bounty | every innkeeper wants it back; give it to one and that town's favour rises +2 |
| An Fíodóir, the Weaver | the Shuttle | in the deepest room of the gate nearest the home island's last unread sigil | Intelligence 35 (Mastery) | the Weaver's Eye for good: the compass always points at the nearest unread sigil (`nearestSigilDoor`) | the Cold rises 1 a week while you carry it; Varek's next discovery comes one meeting sooner | the Church, to seal it: Compact standing +3 and Aldwyn's thanks, or keep it |

Each is good in one kind of play and a burden in another. The Bell halves a storm's 1 hull every 6 s and brings every pirate to you; the Waylamp saves 10–40 a night and doubles a bounty; the Cloak's town suffers for your safe roads. The Bell and the Waylamp have no attribute check, so a new character can win them by wits.

**Touches.** A's frame; a topic folder per shrine; one trial each on systems that exist (`gameHour()`, `WX`, `lairFinish` without `worldState.masters`, the crime record, a gate's floors); claimants through `FACTIONS`/`fstate` and `addFavor`; costs through `shipWear`, the pirates' steering, `prosperity`, `bountyAt`, `worldState.cold`, `varekDue`. Shared state changes only through `takeArtifact` and `yieldArtifact` (the co-op rules).
**Conflicts.** Three tools touch the Cold, Varek and the faction ranks, the quest writer's ground. The Waylamp undercuts the inns' prices. The Gate-Blade's key-free door applies only to gates you have opened once, so it never skips a key hunt.
**Cost.** One Opus session for the frame and a suite; three more, two tools each; one look session (six objects, 300–1,200 triangles, in the inspector); two quest-writer runs. Five Opus sessions in all.

### C. Seam relics: what the failing anchor leaves
**The loop.** Every lair master, dragon and Act II burn leaves a piece of the binding's misfire, as the Faolchú's Mark does: a generated name (*the Mark of the Glenowen Wyrm*), one signature from a table of twenty, never running out.
**Rules.** Rolled on the hoard's seeded stream (`<seed>:<floor>:hoard`); a tier-5 base and a signature such as *seam-sight* (antibodies within 30 units show through walls); an Old Blood hermit reads one for 200 gold.
**Touches.** `lairFinish`, the hoard roll, a signature table, an enchant per signature, and the Mages' Guild's reading topic.
**Conflicts.** Loot with a name on it: the eleventh relic is *buy more*. It fits the canon best, though.
**Cost.** Two Opus sessions.

## Recommendation
**B.** Taking the artifact is itself the decision: every tool has a cost you carry or a claimant who pays you to give it up, and the Wolf-Mother's Cloak changes a town on the map. It also answers every part of the note: the Gate-Blade is the sword in the stone at Might 30, each tool has its own short quest, and all six sit in the canon's pantheon (the Guest's having none is itself lore). A is B's frame and gets built first anyway. C is a fair later reward for lairs, not the answer to *Daedric artifacts*. Order: the frame, the Stone and the Beasts (home island), the Sea and the Hearth, the Sky and the Weaver.

## What must be true first
- **Nothing blocks the frame or the Gate-Blade**; the checks move to skills when that build lands.
- **The Sky's climb** wants the platforming page's heights for solids (the owed Fable session); until then its trial is the clock and the weather.
- **The Weaver's Shuttle** raises the Cold (`worldState.cold`, counted on each Old Blood Mastery-touch since v80 and shown on the hub, but with no effect yet). Its cost is real only to an Old Blood player until the Cold does something; for the rest it is the Varek half.
- **The quest writer** names the six and writes the keepers and claimants.
- **The cloak page (#148, B)** reserved the slot the Wolf-Mother's Cloak wears.

## Not asked
- **An artifact for the Guest**: absent on purpose (above).
- **Artifacts that talk or curse** (Umbra, the Mace of Molag Bal): that is a god who wants something, which dead Makers cannot be. The costs do that work.
- **Artifacts that level with you**: a fixed strength suits the enemies-by-place condition the skills build carries.
- **More than six, and who holds one in co-op**: one continent deep first; one of each per world, and the sharing is the co-op page's question.
