# What a gate keeps: the build sheet

*The systems designer, 18 Nov 2026. A build sheet for a design Michael has chosen. It settles the numbers the choice left open and asks one.*

## What Michael chose

What a gate keeps (backlog L10, OG-123), DECISION #1092. Michael: **"A, plus what earlier delvers left"** (C), 4 Nov 2026, on the control room. The rooms are the concept artist's (Session 1103, `docs/prototypes/levelup/vaults.js`; `docs/concepts.md`): a great gate's vault, a round hall 62 m across with a pit round an island, an armillary turning over a dais around a shard of the gate's core, three bridges; and a lesser gate's keep, a 10 m vaulted end room with one shaft of light on a sealed coffer. C puts in them the gate's own things (the core shard, a broken relic on an altar, the coffer, a cache sealed by script, a crystal vein) and what earlier delvers left: one dead against the dais with pack, journal, lantern and split purse, and a cold camp at the door. No hoard; the only coin is the dead man's. This sheet does not re-ask C.

## Today

The last space of every gate is the ring chamber. `makeGate` (`52-dungeon-gen.js`) lays it last, on floor two in a massive gate, as `gen.ring` with a 10 m dais 0.4 m high (`sp.dais`). The carving is cut there (`sigRing` in `buildDungeon`), and in a great gate the knot hangs 2.1 m over the dais (`knotLay`). `gateThings` sets four braziers at the dais's corners. A gate's condition comes from its seed (`gateCondRoll`: steady 0.50, failing 0.35, catastrophic 0.15), and in a catastrophic gate the ring is guarded one tier up.

Loot is chests: `spawnChest` rolls `rollContainerLoot` on `<seed>:<floor>:chest:<n>` at `dungeonTier`, gold included. One gate in three keeps an orb of its school (`gateOrbPlace`, Session 1858), in the deepest treasure chest until the keep exists, taken once (`worldState.gateOrbs`). A piece taken in a gate is `salvage`, sacrilege to sell in a Prior's town (`sellSacrilege`, Session 2245). Rubbings cost 60 at the Mages' Guild and star a gate (`rubbingTopics`). A world vein holds 3 ore and returns in 7 days (`VEIN_DAYS`). Nothing of the vault or keep is in `js/`.

## The numbers

### Where the rooms go

| Room | Where | Why |
|---|---|---|
| The keep | Every lesser gate's ring chamber, dressed: the coffer on the dais, the altar before it, the crystal in a corner, the cache in a side wall | The concept's keep is the end room under the sigil, which the ring chamber already is. No generator change |
| The vault | A great gate's space before the ring, on its floor and on the one path, 62 m round as drawn | The ring holds the knot; the knot stays the last thing you reach |

The causeway is on the proven path; the cracked bridge needs nothing; the broken bridge's floating stones are 3 to 3.4 m apart, a trained jump, and lead only to the crystal ledge (gate-interiors' rule: a harder jump buys a reward, never the way on). The pit's floor (`dPitBase`) has a way back up.

### The coffer

| Rule | Value | Why |
|---|---|---|
| How it opens | At a touch once this gate's carving is read (`worldState.sigilsRead[seed]`); before, *The script round its lid is closed to you.* | The carving is in the same room and anyone may touch it: a warrior opens it as a mage does |
| What it holds | Keep 2 pieces; vault 4, the first always enchanted. Arms, armour, implements; no gold, potions or picks | C: the gate keeps its own things |
| The tier | Its floor's `dungeonTier` + 1, at most 4 | As spells-as-keys assumes for #1092's chest |
| Its roll | `rollLoot`'s equipment branch on `seededRng('loot','<seed>:<floor>:coffer')`, no `lootDay()` | Co-op rule: the gate's, not the day's |
| Implements | One weapon roll in five a found implement of the gate's school (a tier 4+ chest: one in twenty) | A mage's reason to delve |
| The orb | Moved into the coffer; still one gate in three | Owed since Session 1858 |
| Taken | Once: `worldState.gateKeeps[seed].coffer`, the world's | The treasure chests stay as they are |

Precedent: Skyrim's boss chest, one known place at the end always worth the walk; here a tier above the place, not your level, as enemies by place settled.

### The relic on the altar

A relic here is a working name: **an arc of a Maker's armillary**, one armillary to each school. Its true names and its words belong to the quest writer.

| Rule | Value | Why |
|---|---|---|
| Which altars hold an arc | Every great gate's. A lesser gate's: **the open number**, one in three recommended (`seededRng('arc-has', seed)`) | The great gate always pays. The lesser rate decides how long a whole relic takes |
| Its school | The gate's (`gateOrbSchool`) | A relic tells you where you have been |
| Arcs to an armillary | 3 of one school, numbered in the order you find them | Three nest as the vault's rings do; no duplicates, no grind. `worldState.relicArcs`, the character's |
| An arc | Weight 1, sells for 40, salvage; past the third of a school, plain salvage | The canon's relic trade; sacrilege in a Prior's town, as built |
| Joining | From the bag with three: *Set the arcs together*, 10 s, no skill | A puzzle of shape, not craft |

The armillary carries the decision, as the Makers' tools' claimants do (Sessions 787, 790):

| Choice | Where | What you get | What it costs |
|---|---|---|---|
| Give it to the Crown | its seat, Coeur de Vie | 400 gold and one service with the Crown | the armillary: the licensed trade at its best |
| Give it to the Church | the Prior at the Compact's seat | one service with the Compact; they burn it | the armillary and any gold |
| Keep it | carried | the compass shows the nearest gate of its school whose coffer is shut, within 2,600 m (the rubbings' reach) | nothing to sell, and it is salvage in Aurenne |

The Mark has no claimant: gates "belong to whoever holds them". A counter pays 150.

### The crystal vein

| Rule | Value | Why |
|---|---|---|
| Its ore | Gate crystal of the gate's school, weight 0.5, sells for 25; struck as any vein (`strikeVein`, Mining) | In the keep's end-wall corner, on the vault's ledge |
| How much | Steady 3, failing 4, catastrophic 5 | A straining gate pushes out more of itself. It is the reason to finish a broken gate, whose ring is guarded one tier up |
| Return | Never. `worldState.gateKeeps[seed].vein`, the world's | It is the gate's, not the land's |
| Use | Forge, Smithing 25, one crystal of the school, 20 game minutes: a bought staff, wand, maul or tome becomes *found* (−20% on its school's words, not −10%) | A mage reaches the found grade by delving and smithing, not buying |

### The delver

| Rule | Value | Why |
|---|---|---|
| Where | Every vault. One keep in three (`seededRng('delver-has', seed)`), against the dais | One in every gate would make the dead man scenery. One in three keeps him a sight |
| His body | Keyed `<seed>:<floor>:delver`, looted once: a purse of 8–20 gold (30–60 in a vault), a sword a tier below the gate, a torch, his journal | A little coin, his |
| His journal | One of 8 from the quest writer, by seed, naming the gate's danger in his words; until written, *The pages are stuck together with damp.* | OG-123's explorers' journals |
| His camp | At the door: a bedroll (taken as camp-and-rest's), a cold hearth, rope, a dropped torch | As drawn |

If #1678 is answered B, its delvers elsewhere use this body and pool.

### The cache

Sealed by script in a side wall. It opens to the gate's school's seal from spells-as-keys A, which all three of #1678's options include, so it waits only for the seals to be built. Inside: **a rubbing of the nearest unread carving** (`worldState.rubbings`) and **one arc of another school**, by seed. It points you onward.

### Left out, and why

- **The core shard** is the room's light. Taking a gate's core is the two paths' ground, and the knot carries that.
- **Star metal** was B's hoard, not chosen. **The dragon scale** waits for the catastrophic forms; no catastrophic gate holds a dragon yet.
- **The wall map, mechanism keys, the underwater cache** are spells-as-keys' and wait on #1678.

## What it touches

- **Functions.** `makeGate` (the vault), `gateThingsBuild` (coffer, altar, vein, cache), `gateOrbPlace` (to the coffer), `rollLoot` (an equipment-only `coffer` kind), `foundImplement`, `strikeVein` (a gate vein that never returns), `forgeMake`, `markSalvage`, the compass (`lodestoneVein`'s pattern), the Crown's and Prior's topics (`crownBladeTopics`, the Shuttle's claim). Named actions: `openCoffer(seed)`, `takeArc(seed)`, `joinArcs(school)`, `yieldArmillary(school, to)`, `openCache(seed)`, `lootDelver(seed)`.
- **`worldState`.** `gateKeeps` is the world's: `{coffer, arc, vein, cache, delver}` by seed. `relicArcs` (arcs counted by school, and which armillaries you have joined or given) is the character's, so it goes in `SS_CHAR_WS`. Both join the S242 list in `_applyLoadData`. `gateOrbs` stays.
- **UI.** The prompts, `openLoot` for the coffer and the body, the arc's bag row (*2 of 3 of Tine's armillary*) and *Set the arcs together*, the six armillaries in the Journal's *Things not yet yours*, the forge's *Set a crystal*.

## The suites

| Suite | Sets up | Measures | Pass |
|---|---|---|---|
| `gatekeep` (new) | 20 gate seeds, two builds each, a save and reload in one | the coffer's items, the orb's place, whether it is shut before the carving is read and open after, its state after taking and reloading | identical across builds; shut then open; taken stays taken; the orb in the coffer in every orb gate; no gold in any coffer |
| `relicarc` (new) | three gates of one school with arcs, then a fourth | the numbering, the join, the fourth arc's price, the Crown's 400 and service, the Prior's service, the kept compass | 1, 2, 3 in order of finding; one armillary; 40; as the table says |
| `gatevein` (new) | a steady, a failing and a catastrophic keep; a bought staff of the school | crystals struck; return after 30 days; the staff after *Set a crystal* | 3, 4, 5; none returns; the cut −20% |
| `gatesave` (extend) | as built | add `gateKeeps` and `relicArcs` to the round trip | both survive |

`gatekeep` also counts the delver (1 keep in 3 within 25% over 300 seeds, every vault) and, once built, the cache's rubbing.

## Sessions

1. **Systems:** the keep's things in the ring chamber, as plain placeholders. The coffer and its stream, the orb moved, the altar's arc and its counting, the vein and its crystal. Suites `gatekeep`, `gatevein`, `gatesave`.
2. **Systems:** joining, the armillary's three roads, the compass, *Set a crystal* at the forge. Suite `relicarc`.
3. **Look:** the keep dressed from `vaults.js`'s `lesserKeep` (the coffer, the altar, the shaft of light, the crystal) and the delver's body and camp.
4. **Look (with card F5):** the vault as a space in `makeGate` for great gates, from `greatVault`, with the armillary's rings ticking only while the room is in sight.
5. **Systems:** the delver (body, purse, sword, journal hook, camp) and the vault's things (4-piece coffer, ledge vein).
6. **Quest writer:** the eight journals, the arcs' and armillaries' names, and the Crown's and the Prior's lines.
7. **Systems, after spells-as-keys' seals:** the cache.

Four systems, two look, one quest-writer run. Sessions 1 and 2 need nothing from anyone: the systems builder can take session 1 now.

## The open number

**How often a lesser gate's altar holds an arc.** It sets how far a player walks for a whole armillary, which a player feels. A school's great gate gives one arc, so the other two come from its lesser gates, which are about one gate in six.

- **A.** One in two: about 4 lesser gates of the school, some 24 gates in all, per armillary.
- **B.** One in three *(recommended)*: about 6 of the school, some 36 gates in all. An armillary is a goal you see coming after a few evenings, and all six are a whole game's delving.
- **C.** One in five: about 10 of the school, some 60 gates in all. A completionist's thing.

Until it is answered, session 1 builds B, since the rate is one constant.
