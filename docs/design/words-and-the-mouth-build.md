# The fifteen words and the Mouth (build sheet)

*The systems designer, 26 Oct 2026. A build sheet for a design Michael has already chosen: it sets the numbers and asks nothing again, except the one number at its foot. It builds on `magic-build.md`, which stands as written except where this page says otherwise.*

## What Michael chose

> **Michael (25 Oct 2026, `decisions.md`, #695):** "**1 A, 2 A: two doors; the Mouth is the Uisce great gate**."

The design is `words-and-the-mouth.md`. For the words, each Mages' Guild commission earns one **reading**, a word taken from the shelf your rank opens, and it arrives at Impression. Finding the word's own stone is the other door, and the stone is the only way to Mastery. Súil points at a word you choose, the hermits name words, and a rubbing names its word. For the Mouth, the Gatelands' great gate (Uisce) stands at Inis Rua. Niamh lets you in once you hold a word at Comprehension, and the gate's ring holds the certain first Mastery and starts the knife line.

## Today

Magic B isn't built. Main still has `SPELLS`, `BUFF_SPELLS` and `knownSpells`, and `touchSigil` (`64-spells.js`) raises a tier when `intReqs` allow. The Mages' Guild (`GUILD_DEF.guild_m`, `83-world-generator.js`) counts finished tasks in `worldState.guild.guild_m.done`. `rankOf` makes that count a rank every three tasks (Novice, Adept at 3, Evoker at 6, Warlock at 9, Archmage at 12). The rank commissions (`COMMISSIONS.guild_m`, `87-world-quests.js`) come up as the third, sixth and ninth task. `nearestSigilDoor` and `nearestSigilDoorFrom` read `sigilDoors()`, which walks only the loaded `CELLS`. Hermits are made in camps by `makeDef(…,'Hermit',…)` and have only idle lines. Inis Rua is an anchored `poi` with no pad (`82-world-structures.js`). The Mouth is an examine line in the legacy zone `inis_rua` (`50-travel.js`), and that zone goes at the cutover. No great gate is placed yet: `greatSchoolOf` reads `GREAT_STANDIN`, which is empty.

**A correction to the proposal.** It said `worldState.register` is already in `SS_CHAR_WS`. It is not. Magic B's session 1 adds it, as `magic-build.md` says, and this page's keys ride inside it.

## The numbers

### The readings

| Rule | Value | Why |
|---|---|---|
| A reading earned | one per Mages' Guild task handed in (`turnIn`), the rank commissions included, from the first task | Michael asked for the guild as one path, so it can't wait on the main quest's beat 2. A guild-only player gets readings from the start |
| Readings banked | no cap; the count stops rising once you hold all 24 words | a reading is worth nothing without a shelf, so banking does no harm. A player who joins early spends them at Adept |
| Pay | unchanged, the board's rates and the commissions' | the reading is on top of the gold, never bought with it |
| Where it is spent | any Mages' Guild hall, the topic *Read from the shelves* | the same place as the tutor (magic-build) |
| Time | 4 hours on the clock, through `advanceClock` | twice the tutor's 2 hours. Reading a word from nothing is the bigger thing. Morrowind trains in hours too |
| What it gives | the word at **Impression**, for everyone | the canon: an institutional copy. The Old Blood's skip is for a touch on the stone, and a book is not a stone |
| Intelligence | the word's Impression need, refused below it ("You can't hold it yet. Intelligence 10.") with the reading kept | the same gate as the stone |
| Mastery | never; a word read from the shelf can't pass Comprehension except at its stone | canon §7 |

**The shelves.** They are the proposal's three, made from the Impression needs in `magic-build.md`'s table. A shelf offers every word on it that you don't hold, the Register's nine included. If a Register word comes from the shelf, its starred stone still deepens it.

| Shelf | Opens at | Words |
|---|---|---|
| First (Impression need 1 to 3) | Adept | Caor, Sioc, Séideán, Cleite, Cloch, Smól, Solas, Lampa (8) |
| Second (6 to 10) | Evoker | Uisce, Anáil, Luas, Éan, Loscadh, Tonn, Sciath, Fréamh, Oíche, Dorcha, Leigheas, Súil (12) |
| Third (12 and up) | Warlock | Tintreach, Reo, Eitilt, Dul Thart (4) |

**The rank, settled.** The guild's rank is the higher of two figures: today's count (`floor(done/3)`) and the Register's beats from `magic-build.md` (beat 3 Adept, beat 4 Evoker, beat 6 Warlock). The count stays so that the guild is a door of its own. A player who never takes Q7 still reaches Warlock at nine tasks. The beats stay so that a main-quest player gets the forms on time. The forms follow the same rank, so Held can come from nine tasks as well as from the third island's star, which matches Elden Ring's teachers. `rankOf` changes to read both.

**The pace.** A guild-only player reaches the first shelf at three tasks and holds three readings by then. The fifteen words off the main path take fifteen tasks at 20 to 40 minutes each, 5 to 10 hours. Fifteen lesser gates take 20 to 30 minutes each plus the travel. The two doors cost about the same, and only the stone goes on to Mastery.

### Súil by choice

| Rule | Value | Why |
|---|---|---|
| The choice | the Register page gets *Seek this word* on any of the 24; one at a time, saved as `register.seek` | the proposal's "a word you choose" |
| From when | always, once Súil is held. The proposal said beat 4, but the guild door means a player can hold Súil without the Register | the guild door can't hang on the main quest |
| What Súil points at | the nearest sigil door whose carving is the sought word, read or not, if you hold that word below Mastery | you go back for the second touch and for Mastery, which is the point of the stone door |
| Unset, or the word at Mastery | the nearest unread carving, as magic-build has it | unchanged |
| The search | the cells within 2,600 m (the rubbing's reach), read through `getCell` and the door's seed, never `sigilDoors()` over loaded `CELLS` | CLAUDE.md's S533 rule: the answer can't change with what has loaded. The search runs once a cast and keeps its answer for the cast |
| Nothing within 2,600 m | the line "The eye finds nothing of Tonn this side of the water." and the nearest unread carving instead | a sought word may only be carved on another island |

### The hermits

| Rule | Value | Why |
|---|---|---|
| Who | every Hermit `makeDef` makes, Old Blood, in camps | already in the world |
| The topic | *Do you know the old words?* once a hermit: names one word you lack and the gate that carries it, and marks the gate on the map as a rubbing does | the proposal; free, because it is a stranger's gift and not a sale |
| Which word | drawn by the camp's site id from the words you lack whose carving lies within 2,600 m of the camp; if none, the topic says so and is not spent | keyed by place (co-op rules), so the same hermit names the same word after a reload |
| Saved | `register.hermits[siteId] = wordId` | asked once, and repeated if you ask again |

**The rubbings.** The label becomes *Rubbing: \<gate\> — \<word\>*. The price stays 60: a rubbing buys a place, never the word.

### The Mouth

| Rule | Value | Why |
|---|---|---|
| Where | Inis Rua's south cliff. The great gate's stepped arches are cut into the cliff face, and its door is a sea cave at the cliff's foot, above the high-water line | canon (Niamh's path faces the cliff). OG-145 and the backlog keep great gates cut into cliffs. A tide shut is out: the open world has no tide, and a door on a timer only frustrates |
| The island | Inis Rua becomes a site with a pad (the look builder sizes it to the canon's three buildings: Niamh's dwelling, the net-shed, the empty watch-house), Niamh on the path and Fionn at the dock. The Carraig Mór ferry and any boat reach it | the legacy village moves over whole before the cutover takes `inis_rua` away |
| The portal | authored, `great:'uisce'`, its own fixed seed, named *The Mouth* (*Béal an Domhain* in Niamh's formal lines); the Uisce entry leaves `GREAT_STANDIN` | `greatSchoolOf` reads `portal.great`, so nothing else changes |
| Its layout | the great gate's row from `gate-interiors-build.md`: three floors, Uisce's *ring of loops*, its condition by the great gates' rule there | not this page's to set |
| Its tier | Inis Rua's own (the coast, tier 1); floors at 1, 2 and 3 by `dungeonTier`, so the ring is fought at tier 3 (level 11) | the canon's 'hard' slot. Readiness comes at about level 6 to 10, so the ring is a stretch and not a wall. One rule for every gate, no exception for this one |
| Readiness | the door opens when the character entering holds **any word at Comprehension or above**, raw tier (`knownWords`, not `effTier`). Before that the examine line is the canon's *"You are not ready to go in."* and the door gives nothing more | the proposal as chosen. A torn gate's loan doesn't count, because readiness is what you know. A stone, the tutor and an Old Blood's first touch all qualify |
| Niamh | her lines change at readiness (the quest writer's). The door reads the character and never Niamh, so a Niamh who is absent or dead locks nothing | no lock should hang on an NPC's life |
| The ring | the knot as great-gates-build places it (`ev.ringFirst` starts the knife line, as built), with the Mouth's carving at the dais's foot | the two paths and the first Mastery meet on the home island |
| The carving | the open number below. Once per character, saved as `register.mouth = wordId`; later touches warm the hand and give 15 mana, as `touchSigil` does at Mastery today | a certain Mastery, not a fountain of them |
| Varek | a Mastery here fires `onMasteryTouch` like any stone | canon: the first Mastery brings him to the Ashfeld. The quest writer reconciles that with the courier line's `tickAshfeld` |
| The Register | the Mouth is the ninth star (#422 A). Beat 5's hook (Aldwyn's line and the journal cue) now points at Inis Rua | the canon's two mitigations for the readiness problem, both pointed at a real door |

## What it touches

- **Code.** `83-world-generator.js`: `rankOf` reads the count and the beats; `turnIn` adds a reading for `guild_m`; the hall's *Read from the shelves* topic; the hermit's topic. `64-spells.js`: `learnWord(id, tier, source)`. The source (`'stone'`, `'guild'`, `'book'`, `'tutor'`) decides the card's line and whether `onMasteryTouch` may fire (stone only), and is not saved. The shelves are a table beside `WORDS`. `87-world-quests.js`: Súil's search by seed (`nearestCarvingOf(wordId)`), the rubbing's label, readiness at the Mouth's door, the Mouth's carving. `82-world-structures.js` and `83`: Inis Rua as a site, its door and the cliff (the look builder's). `66-hub.js`: *Seek this word* on the Register page.
- **Named actions** (co-op rules): `learnWord`, `spendReading`, `setSeek`. A shared world's host owns the door. Readiness and the carving read the character who touches them, so each friend has their own Mouth Mastery.
- **The save.** All in `worldState.register`, which is the character's (`SS_CHAR_WS` and the S242 list from magic B's session 1): `readings` (an integer), `seek` (a word id or null), `hermits` ({siteId: wordId}), `mouth` (a word id or null). No new top-level `worldState` key. The guild's `done` is already the character's. The Mouth's portal is authored and saves nothing; the ring's events stay in `worldState.greatGates.ev`, the world's, as great-gates-build has them.
- **The migration.** Readings start at 0, and an old save keeps its guild count and rank. A save from before the Mouth existed has `mouth` null.
- **Panels.** The hall's topic opens a parchment list of the open shelves: word, school, Impression need, a greyed row for one you can't yet hold. There is a "word learned" card for each source, and the Register page gets *Seek* and the hermits' notes.

## The suites

| Suite | Sets up | Passes when |
|---|---|---|
| `guildread` (new) | a Novice with 2 tasks, an Adept by count, an Evoker by beats with 0 tasks, a Warlock at 9 tasks | 2 readings and no shelf for the Novice; 8 words offered at Adept, 20 at Evoker, 24 at Warlock, less those held; a reading gives Impression in exactly 4 clock hours, Old Blood too; refused below the Intelligence with the reading kept; no reading once all 24 are held; rank = the higher of count and beats |
| `wordcarve` (extended) | a seed, Tonn sought, then 1 cell loaded and 9 loaded | Súil points at the same Tonn carving both times; none within 2,600 m falls back with the line; two hermits name the same words after a reload; a rubbing's label names its word |
| `mouthdoor` (new) | Inis Rua's door with a character at all-Impression, then Comprehension by a stone, by the tutor and by an Old Blood touch | refused, then open each way; `greatSchoolOf` gives `uisce`; floors at tiers 1 to 3; the carving gives one Mastery and fires `onMasteryTouch` once; a second touch gives 15 mana and nothing else |
| `wordsave` (extended) | readings 3, a seek, a hermit, the Mouth spent | all four back after a reload, in the character row |

## Sessions

1. **Systems:** the readings, the shelves, `rankOf`, `learnWord`'s source, the hall's topic (`guildread`). After magic B's session 2 (the carvings and the guild).
2. **Systems:** Súil by choice, the search by seed, the hermits' topic, the rubbing's label (`wordcarve`, `wordsave`).
3. **Look builder:** Inis Rua in the open world (the pad, three buildings, the dock, Niamh and Fionn moved from the legacy zone, the south cliff with its arches and the sea-cave door). It can go now; it touches no magic code.
4. **Systems (Opus):** the Mouth as the first placed great gate: the authored portal, readiness, the carving, the beat-5 hook pointed at it (`mouthdoor`). After session 3, F5's great-gate row (gate-interiors-build session 5) and magic B's session 2.
5. **Quest writer:** the hall's reading lines, the hermits' word lines, Niamh's lines at readiness and after, Aldwyn's hook, and the Ashfeld reconciliation. Then the systems builder drops them in.

That is three systems sessions (one of them Opus), one look session and one writer's run. None is cross-cutting, and nothing here needs a FREEZE beyond what magic B's card already holds.

## The open number

### The Mouth's carving — which word does the certain first Mastery raise?
The Mouth opens at any word at Comprehension, and its ring holds "the certain first Mastery". Which word that Mastery can raise decides how much the Mouth is worth and how certain it really is.
- **A (recommended). Any word you hold at Comprehension, your choice,** among those whose Mastery Intelligence you meet. The carving predates every word (canon: "the carvings inside don't call it anything"), so it answers whichever one you bring. It is certain for every player the door lets in, once they have the Intelligence.
- **B. Uisce's words only** (Sioc, Uisce, Anáil, Tonn, Reo). It is in the school's own gate, but a player who came in on Caor gets nothing, so "certain" fails for most.
- **C. Its own word, drawn by seed** like any carving. That is simplest, but not certain at all.
