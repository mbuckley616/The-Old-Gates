# The great gates' two paths, as rules: the build sheet

*The designer, 24 Oct 2026. A build sheet for a design Michael has chosen: every rule here builds an answer of his or an approved draft. The one number it leaves open is asked at the foot as a DECISION. Nearly all of the two paths is decided, so it is written as a sheet, not a proposal.*

## What Michael chose

- **The shape** (13 Oct 2026, in chat; lore §9a): "If you choose the path that varek favors, with each great gate, you basically 'corrupt' the game world … doing the opposite brings more stability and normalcy." Then: "Every decision at each gate should be reversible, until the 6th gate is decided on … once all 6 have the same type/status, it's locked, and fate is sealed." Then: "sealing a gate again gives the power back. The player should have to obtain some magical artifact to tear them. And they later should be presented with an artifact to seal them … Initially, tearing should feel almost purely beneficial to the player with no downsides."
- **The act** (DECISION #292): **"A. The knot at the ring"** (14 Oct). Torn, every spell of the gate's school is one tier deeper; sealed, one tier shallower; the ring's door takes you straight back once reached.
- **What six torn leaves** (DECISION #413): **"Every save ends"** (18 Oct).
- **The words** are the approved drafts in `docs/quest_drafts.md`: *The Great Gates, I — the knot at the ring* (14 Oct), *II — the knife and the needle* (16 Oct) and *III — what each gate gives, and what it costs* (16 Oct). Pieces IV (Varek's two arcs) and V (Act III reconciled) are unapproved; this sheet builds nothing of theirs except what #413 already decides, and says where they plug in.

## Today

Session 1340 built the state alone (`87-world-quests.js`). `worldState.greatGates={gates:{school:'torn'|'sealed'},fate,fatedAt}` rides the world row and is already in the S242 list. `setGreatGate(school,state)` is the one named action: it refuses once `fate` is set, and sets `fate` when all six match. `corruptionLevel()` counts the torn (0 to 6) and `corruptionTorn()` names them, for F12's grade, sky and trees. Nothing calls `setGreatGate` yet: no great gate stands in the world, no knot, no knife, no needle. Spells read their tier through `getSpellTier(id)` (`knownSpells[id]`, 1 to 3, `64-spells.js`); magic B (its own deep-work card, next in the systems queue) replaces it with `knownWords`. The six gifts' hooks all exist (the table below names them). `ending(kind)` (`88-world-ticks.js`) holds today's three Root endings; `'unbound'` writes `og_carry` for the new seed.

## The numbers

### The act

| Rule | Value | Why |
|---|---|---|
| States per gate | untouched, torn, sealed | §9a; a missing key is untouched, as 1340 built |
| Tier while torn | +1, to Mastery (3) at most | #292 A. Read at cast time, never written into `knownSpells` |
| Tier while sealed | −1, to Impression (1) at least; nothing lost outright | #292 A, piece I §3: "felt and not crippling" |
| A torn gate bound | −1 from where you started (the tear's +1 is taken first) | piece I §3: torn-then-bound ends where bound-from-untouched does |
| The way back | the ring's door offers *go down to the ring* once the ring has been reached | piece I §4, the Gate-Blade's precedent (#263 3A) |
| A tier lifted to Mastery by a tear | fires `onMasteryTouch` once per spell per tear | piece I §2: the tearing path draws Varek sooner |

**The tier is read through one function, `effTier(id)`**, which is `getSpellTier(id)` plus the school's term, clamped 1 to 3, and 0 stays 0 (a school you hold nothing of gains nothing). Casting, the display name, cost, cooldown and the wild roll read `effTier`; learning (`touchSigil`, the guild's Deepen, Intelligence's requirements) reads the raw tier. That split is the whole of the bookkeeping: binding a knot changes one flag and no number in the character row, so a save never holds a borrowed tier, and the same function serves magic B's `knownWords` when that card lands (it renames the inner read, not the rule).

**A sealed school at Impression** stays at Impression and is cast with Impression's wild chance (0.40 today; magic B's sheet sets 0.30). That is the dull choice's cost, and a school already at Impression loses nothing: Michael's "neutral or even costly".

### The tools (piece II)

| Item | Comes | Rule |
|---|---|---|
| The Loosing Knife (`looseKnife`) | under the Ashfeld flagstone, after Varek's note is given on the first sleep after a ring is first reached with no tool | `quest:true`: not sold, dropped, stashed or stolen; kept on death |
| The Binding Needle (`bindNeedle`) | Aldwyn's folder, *The great anchor places*, once the runner has come (after the first cut, or two rings seen without one) | the same |

The tools are the character's (the bag); which events have fired is the world's: `worldState.greatGates.ev={ringFirst, noteGiven, knifeLifted, runner, needleGiven, ring:{school:true}}`, under the one object, so no new `worldState` key. `corruptionTorn()` reads `g.gates`, so `ev` is never counted as a gate.

### The six gifts (piece III, its "proposals" taken as written)

| School | While torn | The hook | Why this size |
|---|---|---|---|
| Tine | fire takes half | `_warded`, after the ward and before the floor of 1, for a source tagged `fire` (fire traps, Fire Elemental, magma Slime, fire-school spells: the builder adds the tag to these) | half is Skyrim's best fire resistance from one source (the Dunmer's 50%), felt on the first trap |
| Uisce | breath does not fall | `DIVE.breath` held at 1 | the Root is reached under water (§8.3): the gift is felt on the way to the end |
| Cloch | carry ×1.5 | `maxCarry()`, applied last | about 50 more at Might 10; Oblivion's Feather does the same job |
| Scáth | at night a witness sees you only within 4 m | `witnessOf`, night only (the clock's night, 20:00 to 05:00) | 4 m is arm's length and two steps: a guard beside you still sees |
| Solas | Skeletons, Wraiths and Phantoms do not take you as a target until you strike one; then that room fights as now | `targetOf(e)` returns null for those kinds while the flag holds and the foe is unstruck | Oblivion's Mages Guild undead-ward amulet, by place; never by reading `px`/`pz` (co-op rules) |
| Gaoth | top speed ×1.5 | `shipTopSpeed`, after the sails | hull and rig damage still apply, so a holed ship is still slow |

Each reads `gateGift(school)` (true while that gate is torn) when it applies, never written into the player's numbers, as `effTier`.

### The faces and the tolls (piece III)

The first face holds from the first tear; the toll begins when **three or more** gates are torn anywhere and ends for a school the moment its gate is bound. A player who tears two and stops never sees a toll. Every roll is from a seeded stream keyed by place and day.

| School | Face (while torn) | Toll (three torn or more) | Stream |
|---|---|---|---|
| Tine | Aurenne: no winter | Aurenne's herb scatter ×0.5, by the herb's hash (S533) | the herb's own |
| Uisce | Gatelands waters: `catchFish` ×2 | storms at sea there ×2 (`WX`), fish ×0 | `WX`'s |
| Cloch | the Mark's roads never wet | one tremor a game-day (a `showMsg` and 0.4 s of camera shake); one blocked passage per floor in the Mark's lesser gates | `seededRng('cloch', day)`; the dungeon's seed |
| Scáth | the Mark's nights darker (the look's) | 1 or 2 Phantoms per road between towns, dusk to dawn | `seededRng('scath', roadId+':'+day)` |
| Solas | talk only | Skeletons and Wraiths on Aurenne's roads at night, as Scáth's; the plague driver counts the torn Solas gate as uncleared | `seededRng('solas', …)` |
| Gaoth | Aurenne's import prices one prosperity point better | `WX` windy on Aurenne, trees at full sway (the look's) | `WX`'s |
| every torn school | — | one foe in three in its lesser gates a failing form, once the bodies builder has them; until then words only | the dungeon's seed |

The log's *Somewhere, something gave.* fires once, the first time the count reaches three (`ev.toll`). The *Normal* rumour lines replace the count's lines for seven game-days after any bind (piece I §5).

### The lock and the unmaking

| Rule | Value | Why |
|---|---|---|
| Six sealed | `setGreatGate` sets `fate='sealed'`; a knot then refuses the knife; *Normal* is the rumour default for 90 game-days | §9a, piece I §6 |
| Six torn | `fate='torn'`, then `unmakeWorld()` | #413 B |
| The sixth cut | asks once: the draft's line, and under it, in the menu's grey, *Every saved game in this browser will be deleted.* | #413's own cost: "the warning at the knot has to say so plainly, or the first player it surprises will be the last who trusts the game". A menu line, not a person's, so §6's rule (no one says *save*) holds |
| What `unmakeWorld()` deletes | every slot in `SS.idx`, both rows (`ssDel(key)`, `ssDel(ssWorldKey(key))`), the autosave ring with them, the index, the active key and `og_carry` | #413 B: the title screen as if the game had never been opened |
| What it leaves | one browser key, `og_unmade={at}` (outside `SS`, so it is not itself a save), and the settings (`og.renderer`, quality, volume) | the settings are the machine's, not the world's; the stamp is what the open number reads |
| Order | the cut's lines on the clock (0, 2.5, 5 s, by `performance.now()`), then the delete, then the title | a dropped frame never changes an outcome; the delete waits on every `ssDel` promise before the title loads, so a closed tab mid-way leaves the stamp written first |

`ending('unbound')` stops writing `og_carry` (B takes the carry too); §11's new seed and *The Last Entry*'s list go, as #413's B said they would. In co-op, when it comes, the unmaking runs on the host's browser; a friend's character lives in their own browser and is theirs.

Varek's last stand comes before the lock on both paths (§9a); its fight is piece IV's, unapproved. Until then the sixth act goes straight to the lock through one hook, `varekStandDue(school)`, which returns false.

## What it touches

- **Functions:** `effTier` (new, `64-spells.js`), `gateGift` (new, `87-world-quests.js`), `cutKnot(school)` and `bindKnot(school)` (new named actions over `setGreatGate`, `87-world-quests.js`), `unmakeWorld()` (new, `70-saves.js`), `_warded`, `maxCarry`, `witnessOf`, `shipTopSpeed`, `DIVE`, `targetOf`, `catchFish`, `liveRumours`, the plague driver, `makeDungeon` (the blocked passage), `ending`, `ssLoad` and `ssImportFiles` (the stamp), the `.ob` prompt chain (`62-actions.js`), `sleep()` (the note), Aldwyn's topics (`22-dialogue.js`).
- **`worldState`:** nothing new. `greatGates` and its `ev` are the world's and already on the S242 list. The tools are bag items, the character's.
- **The UI:** the knot's prompt and choice panel, the gain and cost lines (gold and grey `showMsg`), the journal's *Great gates* page (six rows and the lock line), the sixth cut's confirm.
- **The text** is the approved drafts', pasted as written (`KNOT_LINES`, `GATE_LEAK`, `GATE_TALK`).

## The suites

By the "basic tests" rule: one new suite, for the save deletion, and the rest extend 1340's `corruption`.

| Suite | Sets up | Measures | Pass |
|---|---|---|---|
| `corruption` (extend) | a Tine spell at Comprehension; `cutKnot('tine')`, then `bindKnot('tine')` | `effTier` 3, then 1; `getSpellTier` 2 throughout; `onMasteryTouch` fired once | all three, and the same after a reload |
| `corruption` (extend) | a fire trap's hit with Tine torn and bound; Cloch torn, `maxCarry()` | hit halved then whole; carry ×1.5 | exact to the rounding |
| `corruption` (extend) | three torn | *Somewhere, something gave.* once in the log; a fourth tear adds no second | one line |
| `corruption` (extend) | five sealed, then the sixth | `fate==='sealed'`; `cutKnot` refused | refused, state unchanged |
| `unmake` (new) | three slots, an autosave and `og_carry`; five torn; cut the sixth | after the title: `SS.idx` empty, every row gone, `og_carry` gone, `og_unmade` set, the settings kept | every count zero; settings unchanged |

## Sessions

1. **Systems, ordinary:** `effTier`, `cutKnot`/`bindKnot`, the knot in a stand-in great gate (a generated gate flagged great, the knot in its deepest room, as piece I allows until F5 places the six), the prompt and the lines, the way back. `corruption` extended.
2. **Systems, ordinary:** the knife and the needle, the note, the flagstone, the runner, Aldwyn's folder (piece II).
3. **Systems, ordinary:** the six gifts.
4. **Systems, ordinary:** the faces and tolls that are rules (herbs, fish, storms, tremor, road spawns, plague, prices, the blocked passage), and the talk. The look builder reads the same flags for Scáth's nights and Gaoth's trees in F12; the bodies builder's failing forms plug in when they exist.
5. **Systems, ordinary:** the lock, the confirm, `unmakeWorld`, the stamp. `unmake` new.

Five ordinary sessions, none cross-cutting. Sessions 1 and 2 can go now; magic B renames `effTier`'s inner read and nothing else. Pieces IV and V are a sixth and seventh once approved.

## The open number

### After every save ends, may an exported file bring a world back?

#413 B deletes every save in the browser, but a file exported earlier (`ssExportChar`, `ssExportWorld`) sits on the player's disk and `ssImportFiles` would load it. Should the game take it?

- **A. Refuse anything made before the unmaking** *(recommended)*. Every exported file already carries `exported` (its `Date.now()`); `ssImportFiles` refuses one older than `og_unmade.at` with *That world is gone.* Files made after (a new game's) load as usual. Clearing the browser's site data clears the stamp, and that is the one way back, deliberately hard. It makes "truly unmakes" true for a player who keeps backups.
- **B. Take them.** The disk is the player's; the unmaking reaches only what the game holds. NieR: Automata's ending E deletes the console's save but cannot touch a copy elsewhere, and the game is no less felt for it. Nothing to build.
- **C. Refuse only a file of the world that was unmade.** The stamp records the character id of the slot that was unmade (`char.id` in the file); its files are refused and every other character's export loads. Gentler, and it splits the hair #413 B chose not to split.
