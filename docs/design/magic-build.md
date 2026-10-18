# Magic B, words of the deep tongue (build sheet)

*The systems designer, 18 Oct 2026. A build sheet: it turns a design Michael has already chosen into numbers and asks nothing again. Its one open number is at the foot, with a DECISION.*

## What Michael chose

> **Michael (29 Sep 2026, `decisions.md`):** "**B — words of the deep tongue.** If we do this, I think I want to have a questline to unlock all of the magic, and it should probably be part of the main quest. I just feel like players would never find the sigils otherwise."

The design is `magic.md` B: sigils teach words, the Mages' Guild teaches five forms by rank, and a spell is one form with one or two words. The composing page is the concept artist's A (#67, 30 Sep). The six schools are skills (skills A, built on `auto/systems`), and 2.0 waits on magic B with its questline (`v2-scope.md` §1, item 6). Three canon lines bind it: guilds teach Impression and Comprehension and stop there, and only a sigil gives Mastery (§7); an Old Blood touch skips Impression (§3.3); and the first Mastery brings Varek to the Ashfeld (Part I).

## Today

There are sixteen spells: six bolts and a heal in `SPELLS`, and nine self-buffs in `BUFF_SPELLS` (`64-spells.js`). `knownSpells` holds each one's tier. `touchSigil` raises the tier when `intReqs` is met, and only seven legacy dungeons carry a carving (`SIGIL_PLACEMENTS`). The world's sigil doors are starred by rubbings, but none holds a carving. The guild sells Learn and Deepen for 60 to 1,400 gold, capped at Comprehension. On `auto/systems` the school's skill already sets cost (×1.4 − 0.8 s) and power (×0.6 + 0.8 s), the level term is gone from `applySpellDamage`, and a cast that does something is a use. The resolver's table (`74-strikes.js`, on main since 16 Oct) holds a `Cast` row that nothing reads. At Impression `IMPRESSION_WILD_CHANCE` is 0.40.

## The numbers

### The 24 words

The build's sixteen spells become sixteen words, keeping their ids, Intelligence needs and mana costs so the migration is one to one. Three of them are renamed to their head word: Siúl Uisce becomes Uisce, Súil Oíche becomes Oíche, and Súil an Fhíodóra becomes Súil. Eight words are new, all from the canon's catalog. A dash means "the word won't take that shape".

| Word (Comprehension) | School | Int I/C/M | Mana | Sent | Worn | Touched | Laid | Held |
|---|---|---|---|---|---|---|---|---|
| Caor (Fireball) | Tine | 3/15/35 | 30 | bolt 20 | — | lights a brazier, burns a web; 30 | — | flame |
| Loscadh (Scorch) | Tine | 10/22/40 | 34 | — | — | fires dry brush | ground fire 4 m, 6 a second, 10 s | — |
| Tintreach (Chain Lightning) | Tine | 12/25/45 | 36 | bolt 24, leaps 5 m at half | — | 36, stagger | — | — |
| Sioc (Frost Bolt) | Uisce | 3/15/35 | 20 | bolt 12, slows 30% 3 s | — | freezes a pool, a lock's works | a floe 3 m across on water, 30 s | frost |
| Uisce (Water Walking) | Uisce | 6/14/28 | 22 | — | walk on water 45/90/180 s | douses a fire | — | — |
| Anáil (Water Breathing) | Uisce | 6/14/28 | 20 | — | 60/120/240 s | — | — | — |
| Tonn (Force Wave) | Uisce | 10/22/40 | 32 | a wave 8 m down the line, 14, posture 20 | — | — | a wave 6.2 m long from the point, 2 s | — |
| Reo (Frost Nova) | Uisce | 12/25/45 | 34 | — | — | a foe held 2 s | foes within 4 m held 2 s | — |
| Séideán (Wind Shear) | Gaoth | 3/15/35 | 22 | bolt 14, knock 1.5 m | — | — | an updraft 1.5 m wide, 15 s | a gale |
| Cleite (Feather) | Gaoth | 1/8/20 | 16 | — | today's | — | — | — |
| Luas (Haste) | Gaoth | 6/14/28 | 24 | — | ×1.5 on the ground, 30/60/120 s | — | — | — |
| Eitilt (Levitate) | Gaoth | 12/20/34 | 34 | — | 25/50/100 s | — | — | — |
| Éan (Leap) | Gaoth | 8/18/32 | 26 | — | the jump's rise 8.4 m/s, 20/40/80 s | — | — | — |
| Cloch (Stone Spike) | Cloch | 3/15/35 | 28 | spike 22 | — | — | a pillar 1.2 m high, 20 s | — |
| Sciath (Shield) | Cloch | 10/18/32 | 28 | — | warding, today's | — | — | — |
| Fréamh (Root) | Cloch | 10/22/40 | 30 | a foe rooted 2 s | — | — | roots once within 3 m, 10 s | — |
| Smól (Shade Bolt) | Scáth | 3/15/35 | 26 | bolt 16, alerts no one | — | — | — | — |
| Oíche (Night Eye) | Scáth | 10/18/32 | 18 | — | today's | — | — | — |
| Dorcha (Blind) | Scáth | 10/22/40 | 28 | blinds 4 s | — | — | a dark 6 m across, 15 s | — |
| Dul Thart (Phase) | Scáth | 14/28/48 | 40 | the step: arrive where it lands, 12 m | through foes 0.6 s | — | — | — |
| Solas (Radiant Bolt) | Solas | 3/15/35 | 28 | bolt 18 | — | — | a light 8 m, 60 s | — |
| Leigheas (Healing Light) | Solas | 8/25/50 | 40 | — | heals 35 | heals another (co-op) | — | — |
| Lampa (Light) | Solas | 1/8/20 | 12 | — | today's | — | — | — |
| Súil (Weaver's Eye) | Solas | 8/16/30 | 14 | — | the compass to the nearest unread carving, 60/120/240 s | — | — | — |

That makes 120 cells, of which 42 are live. The schools come out uneven: Uisce and Gaoth have five words each, Tine and Cloch three. The build's spells fall that way, and the canon's unused words (Slán, Bás, Aiséirí) are held back for the thin schools. Each word's Mastery effect is the canon's: Caor homes, Sioc slows ×1.5, Éan is *Wingless* (no fall damage while worn), Dul Thart's phase is untargetable, and so on. Where the canon has no entry, the effect is today's `nameMa` with ×1.3 magnitude. The texts are the quest writer's.

**Why Dul Thart carries the step.** Its meaning is *passing beyond*. The step table in `double-jump-and-dash-build.md` names "Scáth's step" for gaps of 10 m and more, and the Scáth perks already lengthen it (18 m at 75). Putting both the step and the phase on one word gives that word two forms rather than leaving it a duplicate.

### The five forms

| Form | Guild rank | Reach | Power | Mana | Time |
|---|---|---|---|---|---|
| Sent | Novice | a bolt that dies at 30 m | ×1.0 | ×1.0 | 0.35 s wind-up at ×0.35 walk, 0.30 s recovery (the `Cast` row) |
| Worn | Novice | you | ×1.0 | ×1.0 | the word's three durations |
| Touched | Adept | 1.6 m hull to hull in a 60° cone (F2b's `TOUCH`) | ×1.5 | ×0.6 | 0.25 s wind-up |
| Laid | Evoker | a walkable point at the crosshair within 12 m | ×1.0 | ×1.5 | the word's time; **one laid thing per caster**, so a second ends the first |
| Held | Warlock | a 4 m cone, 60° | ×0.25 every 0.25 s | ×0.5 a second | walk at 50% while held |

Forms are free at rank: gold never buys ahead. The one-laid-thing rule matters most for platforming, because two pillars would make a stair. Touched is the close, cheap form and pays ×1.5 for the risk. Held gives twice the damage per mana of Sent, but at 4 m and half speed.

### Joining and riders

A second word adds only its **rider**. Both words must be at Comprehension. The mana is the sum of the two words ×1.25, and the form's multiplier is applied after that. Six words have a rider; every other word is refused as a second ("the words won't join").

| Rider | On what it hits (Sent, Touched, Held) | On a laid thing |
|---|---|---|
| Caor, *burns* | 3 a second for 4 s | the thing is hot: 3 a second to a foe touching it |
| Sioc, *slows* | −30% speed, 3 s | it freezes: a Tonn wave stands as a **bridge 6.2 × 1.6 m for 20 s**; a floe lasts twice as long |
| Séideán, *pushes* | knocked back 1.5 m, posture 10 | it throws: a Cloch pillar springs as it rises and throws you as Éan does |
| Fréamh, *holds* | rooted 0.8 s | the first foe across it is rooted 1 s |
| Solas, *lights* | the foe glows for 10 s and cannot hide | it lights 8 m around for its time |
| Leigheas, *mends* | you heal 25% of the damage dealt | you heal 2 a second while you stand in it |

The bridge's 6.2 m is the step table's 6.0 to 6.4 band ("Sioc and Tonn's frozen wave"), which the double-jump sheet already builds places for. When the two words come from different schools, the cast adds 10% wild at any tier until both schools reach 25.

### Movement against the step table

Places are built to steps (platforming B), so a movement word's shape is the same at every tier and every skill level. Tier and skill change only its duration and cost. Every figure below assumes the 4.7 m/s air cap (Michael's A on #370).

| Spell | Shape | Where it sits in the table |
|---|---|---|
| Éan, worn | rise 8.4 m/s: apex 1.97 m, gap 4.4 m | the 4.0 to 4.8 band, magic's answer to *Second step* |
| Cloch, laid | a pillar 1.2 m high and 1.0 m across, mantled onto | from its top, a ledge at 3.6 m: the 3.4 to 3.8 band |
| Séideán, laid | an updraft: apex 2.2 m from where you stand, no forward push | a ledge at 3.8 m |
| Sioc on water, laid | a floe 3 m across | a river crossed in hops |
| Tonn with Sioc, laid | the bridge, 6.2 m | the 6.0 to 6.4 band |
| Dul Thart, sent | 12 m, stops at the first solid | the 10 m band |
| Eitilt, worn | a hover held at most 2.4 m over the ground below, 2 m/s | every gap, slowly; a ledge at 4.0 m at most |

The no-mantle flag on walls (double-jump sheet) also covers spells. A pillar or updraft is refused within 2 m of a flagged wall, within 0.5 m of any solid or door, and inside a body. Eitilt's cap removes Morrowind's levitation exploit while keeping it the mage's long way round.

**A correction to the skills sheet.** Gaoth 75 read "the updraft lifts 1.5 m more". That would put the reach at 5.3 m, past the 4.5 m that walls are built to. It becomes *Lifting wind*: a foe in your updraft is thrown off its feet for 1 s. The other school perks stand as the skills sheet has them, and their names are the quest writer's.

### Tiers, the wild roll and overcasting

| | Impression | Comprehension | Mastery |
|---|---|---|---|
| Power | ×0.6 | ×1.0 | ×1.3 and the word's Mastery effect in every spell it is in |
| Mana, cooldown | ×1.0 | ×1.0 | ×0.7, ×0.8 |
| Wild | 30% (15% with *Steady voice*, school 25) | none, except a two-school join | none |
| Name | the Irish | with the English | the true name |

`IMPRESSION_WILD_CHANCE` goes from 0.40 to 0.30, the figure the skills sheet's perk halves. The wild list keeps fizzle (half the mana back), scatter (±20°), backlash (15% of the damage to you) and reversal, and adds **overshoot** for movement: ×1.5 on a pillar's height or a step's length, never through a wall. The roll stays on `casterRand`, the seeded stream.

**Overcasting.** When you are short of mana, the rest is taken from health at 2 health a mana, with a 0.5 s stagger. A cast that would leave you under 1 health is refused. This replaces the greyed-out button with a risk, and death still costs only a reload.

**Worked costs** (school at 50, so ×1.0): Caor sent 30. Cloch laid 42. Caor held 15 a second. Sioc and Tonn laid, the bridge, (20 + 32) × 1.25 × 1.5 = 98; at Uisce 100 it is 59, and at Mastery in both words 41. For scale, a Comprehension Tonn needs Intelligence 22, which gives a pool of 320.

### Where the words are

- **Carvings.** Each sigil door (canon §7: one gate in four) and each fort's deepest room carries one carving on its last floor. A sigil door's word is drawn by its seed from its own school (§9a). The pool follows the place's tier: tier 1 draws from words whose Impression needs Intelligence 1 to 3, tier 2 from 6 to 10, and tier 3 and above from 12 and up. Every word appears at least once on each island. The draw reads the seed and `getCell`, never what has loaded.
- **A second touch** of a word you hold deepens it, as `touchedSigils` does today. An Old Blood player's first touch resolves at Comprehension.
- **The guild** teaches the forms at rank. At Adept and above a tutor deepens an Impression word to Comprehension in two hours, free, if your Intelligence meets the word's need. The guild never gives a word. Spell sales end.
- **Books** are institutional copies (canon §7): a found book deepens its word to Comprehension if you hold the word, and does nothing if you don't. They are not sold.
- **Mastery** comes only from a carving. `onMasteryTouch` and `worldState.cold` are unchanged.

The canon's §7 keeps the guild's Comprehension and the books, which `magic.md` had retired. The canon wins, and neither one sells a word.

### The questline: the Register

Michael asked for a main-quest line so that players find the sigils. Its beats are below. Its words, and its name, are the quest writer's.

| Beat | When | What it gives |
|---|---|---|
| 1 | Act I, as shipped | the first carving (Caor) and Varek's first attention |
| 2 | Q7's turn-in, when the commission opens Act II | Aldwyn's Register: six carvings starred on the map, one per school, the nearest sigil doors of tier 1 or 2 on the home island, chosen from the world seed. Solas's star is a Súil carving, because the Weaver's Eye is how the rest are found (§7). Also the guild at Novice: Sent and Worn |
| 3 | three of the six read | Adept: Touched |
| 4 | all six read | Evoker: Laid |
| 5 | a word at Comprehension and the Intelligence for its Mastery | Aldwyn's hook to the Mouth and the journal cue (canon's two mitigations); the first Mastery brings Varek to the Ashfeld |
| 6 | Act II's proof on the other two islands (§8.2) | one starred carving on each; Warlock, Held, at the third |

Each beat counts as the guild's rank commission, so a player who follows only the main quest holds every form by the end of Act II. From beat 4 the Register lists each school's words you haven't found, and Súil points at the nearest carving of one of them.

## What it touches

- **Code.** `64-spells.js`: `WORDS`, `FORMS` and `RIDERS` replace `SPELLS` and `BUFF_SPELLS`; `touchSigil` teaches words; `spellShopTopics` teaches forms and the tutor; books deepen. `62-actions.js`: `castSpell` resolves the form, the word and the rider, and adds the overcast. `74-strikes.js`: `applySpellDamage` and the `Cast` row (tell 0.35, recovery 0.30, not parryable). For laid things as solids: `dSolid` and `FOOTHOLDS` (`52`), `solidAt` (`81`) and `intSolidAt` (`84`). `87-world-quests.js` (`sigilDoors`, `nearestSigilDoor` for Súil, the Register), `56-dungeon-build.js` (the carving on the last floor), `66-hub.js` (the composing page and the book of eight hotkeys).
- **Named actions** for co-op: `learnWord`, `deepenWord`, `castWord`, `layWord`. In a shared world the host owns laid things. A laid thing lives at most 60 s by the play clock and is never saved.
- **The save.** `knownWords` ({id: tier}) replaces `knownSpells`. `spellBook` holds up to eight {form, word, rider}, and `activeSpell` is its index. `formsGranted` holds forms a migrated character already used. All of these are top-level character fields, as `knownSpells` is. `worldState.register` (the beats and stars) belongs to the character, so it goes in `SS_CHAR_WS` and the S242 list. `rubbings`, `sigilsRead`, `cold` and `masteries` are already there.
- **The migration** (`ssSanitizeLoaded`, once): each spell becomes its word at its tier. Bolts go into the book as Sent and buffs and the heal as Worn, with those two forms granted whatever the guild rank. Spellbooks in the bag stay as books.
- **Panels.** The composing page (#67 A), a "word learned" card (L11's list), and the Register in the journal.

## The suites

| Suite | Sets up | Passes when |
|---|---|---|
| `wordtable` | the tables | 24 words, six schools, 42 live cells; a refused join says so |
| `wordforms` | one word in each form | the bolt dies at 30 m; touched lands at 1.6 m and not at 1.7; laid is refused at 12.1 m and 0.4 m from a wall; held drains ×0.5 a second |
| `wordcost` | the worked costs | 30, 42, 15, 98, 59, 41 exactly |
| `wordtier` | 1,000 seeded Impression casts | wild 30% ±3, 15% ±3 at school 25; Mastery ×1.3 and ×0.7 |
| `wordsteps` | each movement spell over a measured gap or ledge | Éan apex 1.97 and gap 4.4 (±0.1); a 3.6 m ledge from the pillar, 3.9 m not; the bridge crosses 6.2 m; the updraft 2.2 m; the step stops at a wall; a second laid thing ends the first; Eitilt ≤ 2.4 m |
| `overcast` | mana 10, Caor at 30, health 100 | health 60, a 0.5 s stagger; refused at health 40 |
| `wordcarve` | every sigil door on three islands, at levels 1 and 30, before and after a reload | a carving of its school on each; each word on each island; the same words both times |
| `wordguild` | a Novice, an Adept and a Warlock | forms by rank; no word for sale; the tutor stops at Comprehension |
| `wordmigrate` | a saved character with seven spells and nine buffs | the same words at the same tiers, all in the book |
| `wordsave` | a made spell and a Register star | both come back after a reload, in the character row |
| `register` | the questline from Q7 | six stars, ranks at 3 and 6, the Mouth hook, the island proofs |

## Sessions

1. **Deep work, card magic-b** (already queued): the words, forms and riders, `castSpell`, the overcast, the `Cast` row, the migration and the save. Suites `wordtable`, `wordcost`, `wordtier`, `overcast`, `wordmigrate`, `wordsave`.
2. **Systems:** the carvings, the guild's forms and tutor, the books (`wordcarve`, `wordguild`).
3. **Systems:** laid things as solids in all three collision worlds (`wordforms`, `wordsteps`). This is the hard one.
4. **Systems:** the held form, the riders, and the eight new words' behaviour.
5. **Systems:** the 24 school perks.
6. **Look builder:** the composing page on the parchment.
7. **Quest writer** drafts the Register for Michael's approval. Then **systems** builds it (`register`).

That is one deep-work session, five systems sessions, one look session and one writer's run. Everything waits on `auto/systems` (#353: skills, enemies by place, F2b) merging; the resolver is already on main. Session 1 touches `62`, `64`, `70` and `74`, which are the systems builder's own files, so no FREEZE beyond the card's own.

## The open number

### Magic B — how many carvings does the main questline walk you to? (the designer, 2026-10-18)
Michael asked for a questline because players would never find the sigils on their own, and the canon also gives rubbings, rumours and Súil. The question is how much of the finding the main quest does itself, and how much it leaves to exploration.
- **A. Nine:** one per school on the home island, the Mouth, and one on each other island. The guild's ranks come with them, and from the sixth the Register and Súil lead to the other fifteen words.
- **B. All 24:** a word at every step, so Act II's spine is about twenty-four gates and nothing is left to find on your own.
- **C. One and the forms:** the Register names the guild and the first stone, and rubbings, rumours and Súil do the rest, close to today.

Recommendation: **A.** Every school and every form arrives on the main path. The fifteen words left over are what exploring the islands pays, and Súil turns each of them into a destination rather than a hidden thing. B makes the main quest a checklist of gates, and C leaves the problem Michael named.
