# The fifteen words and the Mouth (proposal)

*The systems designer, 25 Oct 2026. A proposal for Michael's two follow-up questions on DECISION #422 (backlog J, "Magic B's carvings"). Nothing here is a spec until `decisions.md` has a `Michael:` line under it. It builds on `magic-build.md`, which stays as written except where this page says otherwise.*

## The problem in Michael's words

> **Michael (18 Oct 2026, on #422):** "Nine: one per school, the Mouth, one per island — How do the rest of them get unlocked though? I think the mages guild is one path but it should also be an option to unlock them yourself. Also, what is the mouth/what purpose does it serve at this point? Do we still need / want that? Is it even a gate?"

## Today

Magic B isn't built yet. Main still has sixteen spells in `SPELLS` and `BUFF_SPELLS` (`64-spells.js`), tiers in `knownSpells`, and `touchSigil` with seven legacy carvings. The open world's sigil doors (`sigilDoors`, `87-world-quests.js`) carry no carving. Rubbings (60 gold, `rubbingTopics`), rumours (`nearestSigilDoorFrom`) and the hermits point at them. The build sheet gives the Register nine carvings, and the leftover fifteen words are reached only by finding their stones. In the sheet the guild teaches forms and deepens a word you already hold, and "never gives a word". `onMasteryTouch` counts masteries and does nothing else. In the world, Varek waits at the Ashfeld only at the end of the courier line (`tickAshfeld`). The canon's Mastery trigger is not built there.

**The Mouth today.** Canon makes it an Uisce gate. It is *Béal an Domhain*, a sea cave under Inis Rua's south cliff. Niamh keeps it, and Áine's brother died in it fifty years ago. It holds "the canonical first Mastery sigil", the gesture that was meant to send Varek to the Ashfeld (`lore_canon.md`, *The Mastery-touch as the Varek-meeting trigger*). The Salt Mouth on Aurenne is its counterpart. In the build it is an arch in the legacy zone `inis_rua` (`78-placeholder-zones.js`) with one examine line, "You are not ready to go in." (`50-travel.js`), and that zone goes at the cutover (v2-scope Q2). In the open world Inis Rua is an anchored POI with no pad (`82-world-structures.js`, x 150, z 2050) and nothing on it. So the answer to "is it even a gate?" is yes in the canon, and no in the build: nothing about it can be entered.

## Directions for the fifteen words

All three keep the canon's line: Mastery comes only from a stone (§7), and gold never buys a word (the brief's *Not this*). They differ in what the guild hands over.

### A. Two doors: the guild's shelves and the stone

**The loop.** A player who likes the guild takes its commissions. Each commission done is worth one **reading**: a word from the shelves your rank opens, studied for four hours at any guild hall. The word arrives at Impression, the institutional copy, wild 30% (the sheet's figure). The sheet's tutor deepens it to Comprehension once your Intelligence allows. A player who would rather go alone dives the word's own gate. The first touch gives Impression (Comprehension for the Old Blood), a second touch gives Comprehension, and only that stone ever gives Mastery.

| Rank (the sheet's beats) | Shelf opened | Words on it |
|---|---|---|
| Adept (three of the Register's six read) | words whose Impression needs Intelligence 1 to 3 | 8 |
| Evoker (all six read) | Intelligence 6 to 10 | 12 |
| Warlock (the third island's star) | Intelligence 12 and up | 4 |

**Why these numbers.** The shelves follow the carvings' own tiers (the sheet's "where the words are"), so the guild never hands out a word the world would only show you in a tier-3 place. One commission a word puts the guild path at about the same play time as the stones: fifteen commissions at 20 to 40 minutes each, against fifteen lesser gates at 20 to 30 minutes plus the travel to them. The board's generated tasks count, so the shelf never runs dry. The guild route is safer, slower and capped. The stone route is quicker for someone who dives gates anyway, it skips the rank gate (a tier-3 carving can be read at level 10 if you survive its gate), and it is the only way to Mastery. That is Elden Ring's split: teachers sell sorceries, the world hides scrolls and the strongest ones. Here the teacher's price is service instead of runes.

**The self path made findable.** From beat 4, Súil, worn, turns the compass to the nearest carving of a word you choose in the Register, not just the nearest unread one. A camp's hermit (Old Blood, already in every camp) names one word you lack and its gate, once per hermit. A rubbing's label names its word. That is Skyrim's word walls with the main quest's map taken away: you go to a word on purpose.

**Code.** `64-spells.js` (`learnWord` with a source, the shelves), the `guild_m` commission hand-in in `87-world-quests.js` (one reading per completion), Súil by choice through `nearestSigilDoor`, and the hermit's topic. One new key, `readings` (unspent, an integer), under `worldState.register`. That object is already the character's (`SS_CHAR_WS`, S242), so the save list gains nothing. **Cost:** two ordinary systems sessions after the sheet's session 2, and a quest-writer run for the guild's and the hermits' lines.

### B. Two doors and the reader's strokes

As A, plus a third route for the player who likes puzzles. Each carving also shows one **stroke** of another word of its school. Three strokes of a word, worked over for an hour at a fire or a desk, give that word at Impression without its stone. This is the "discovery, combining" loop Michael asked for in the first magic note (backlog J). **Costs.** Two more sessions (a `strokes` record in the character row, the Register's page for them, a suite). It also weakens the stone as a destination: a word you assembled from strokes is a gate you never needed to visit, so Súil has less to do.

### C. The guild as a guide, not a teacher

The sheet as written: the guild never gives a word. Instead each guild commission past the Register is an expedition to a named carving (escort a scholar, take a rubbing), paid in rank and gold, and you still put your own hand on every stone. **Cost:** one session. **What it misses:** Michael asked for the guild as "one path" to the words. Under C it is only a path to the stones, so a player who wanted to avoid the gates gets nothing new.

## Directions for the Mouth

### A. The Mouth is the Uisce great gate

The Gatelands' great gate is Uisce (§9a). Card F5 hasn't placed any of the six (`greatSchoolOf` reads console stand-ins), and Inis Rua is already an anchored place with a keeper and a name, "the world's mouth". The canon's lines move over whole. Readiness becomes a rule: Niamh lets you past once you hold any word at Comprehension, and the examine line changes then, as the canon asks. The carving in its ring chamber is where the first Mastery is made certain. Reaching the ring also begins the knife line (`greatGates.ev.ringFirst`, Varek's note, the Ashfeld flagstone, already built). So the Mouth is where the canon's Mastery trigger and the two paths meet on the home island. The Salt Mouth stays Aurenne's dragon lair, its echo. **Cost:** the placing is F5's own work, pointed at Inis Rua (check that the island has room for an outside of stepped arches). A look session puts the hamlet and Niamh on the world's Inis Rua, and a short systems piece adds the readiness check. Reconciling the first Ashfeld meeting with the courier line's climax is the quest writer's job.

### B. A lesser Uisce gate with a keeper

The Mouth stays an ordinary Uisce gate, the Register's ninth star, and Niamh's readiness rule is as in A. Its purpose is the canon's alone: the place where the first Mastery is certain. **Cost:** one look session and one systems session. It is a smaller thing for a name the canon has built up since v61ey.

### C. Retire it

Niamh and the hamlet stay, and the cave stays shut for good, a thing watched and never entered. The Register's ninth star goes to the Vault of the Tide. **Cost:** nothing but porting Niamh. **What it loses:** the canon's one place where the player's readiness is told to them, and the grave of Áine's brother.

## Recommendation

**The words: A. The Mouth: A.** Two doors gives Michael exactly what he asked for: the guild is one path to the words, and finding them yourself is the other. The canon's split decides which path pays more, since the guild's copy stops at Comprehension and only the stone gives Mastery. Neither path costs gold. B's strokes are a good loop, but they compete with the stones, and they can be added later without changing anything here. The Mouth as the great gate gives an existing name its largest purpose at almost no extra cost, because the six still need places and this one already has a keeper, a legend and a dead man in it.

## What must be true first

Magic B's card (the sheet's session 1) and session 2 (the carvings and the guild) are built. The guild's ranks follow the Register's beats as the sheet sets them. Today they come by count: Adept at 2 commissions, Evoker at 5, Warlock at 8 (`87-world-quests.js`). For the Mouth under A: F5 places the six great gates, and great-gates-build's session 2 (the tools) stands as approved.

## Not asked

Gold for words, in any form: it is the brief's *buy more*. A guild Mastery: the canon forbids it. The canon's held words (Slán, Bás, Aiséirí) as a sixteenth reward: the sheet keeps them for the thin schools. Whether Varek notices the guild's readings: he notices the stone, as the canon says, and nothing else.
