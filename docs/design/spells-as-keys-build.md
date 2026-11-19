# Spells as keys, and secrets: the build sheet

*The systems designer, 19 Nov 2026. A build sheet for a design Michael has chosen. It settles the numbers the choice left open and asks one.*

## What Michael chose

Spells as keys, and secrets (backlog L10, OG-122), DECISION #1678. Michael: **"B, A, plus mechanisms, hidden rooms and the script."** (19 Nov 2026, on the control room.) The page is [spells-as-keys.md](spells-as-keys.md). B is one seal a school opened by its word, plus the mechanisms and hidden architecture with their tells, the script priced as reading is priced, and the earlier delvers pointing at what is hidden. C, the gate as a machine, was not chosen: the way on never needs a word or a lever.

## Today

`gateThings` (`52-dungeon-gen.js`) lays a gate's things on its own stream: brazier pairs at thresholds and four at the ring's dais, a web on one bare-mouthed side room in three, a pool in one other side room in four, each with the id `<seed>:<floor>:<n>`. `gateThingsBuild` (`56-dungeon-build.js`) draws them in metres. `touchThing` (`64-spells.js`, by `TOUCH_THING`) lights a brazier, burns a web, freezes a pool. `layWord` builds Cloch Ghéar's pillar (1.2 m, 20 s), Séideán's updraft (an apex of 2.2 m, 15 s) and the other laid things, by the play clock, never saved. Corridors carry spike plates (`spikeTrapRaw`). The keep is built (Sessions 2370–2379): the coffer shut until the carving is read (`gateCofferShut`), the delver one keep in three (`gateDelverDue`), all of it in `worldState.gateKeeps`, the world's. Readings are banked in `worldState.register.readings` and spent by `readWord`; `worldState.cold` is the Old Blood's price. Nothing in a gate is hidden, and nothing a word does opens anything.

## The numbers

### How many, and which

| Gate | Secrets | Of which seals | Why |
|---|---|---|---|
| tiny, small | 1 | 1, the gate's own school | One room's worth of gate: the seal is the reason to come back with its word |
| medium | 2 | 1 | Seal plus one mechanism: half need no word |
| large | 3 | 1 | One mechanism is the shortcut back if it fits |
| massive | 4 | 2: the gate's school and one other by seed | Two floors; the second seal sends a mage to another school's words |

Kinds are drawn on the gate's own stream (`seededRng('secret', seed)`), laid after the pools so no web's or pool's roll or id moves. Each takes a side room with no web or pool (a room is a tree's leaf, so nothing on the way on is touched). The lift needs a chasm, the sluice a flooded hall, the shortcut a large or massive gate; the plates come at most once a gate, the rotating chamber once. If a gate has fewer free side rooms than secrets, it has fewer secrets: the seal first. Ids are `<seed>:<floor>:secret<n>`. Every mouth is checked off `bfs`'s path from the entry to the carving, on both floors, or it is not laid.

### The seals (A)

| School | Seal | Key | Settled |
|---|---|---|---|
| Tine | a stone leaf between two braziers, always cold | Caor touched on both within 20 s of play clock | The braziers 6 m apart (two cells): 36 mana for the pair |
| Uisce | a side room of black water 2 m deep, the chest on a ledge | Sioc touched freezes it, as built (S1678) | The ledge 1.5 m over the ice, a plain mantle. The gate's water is cold: 5% of health a second to a swimmer, so swimming to it is a choice, not a free way |
| Cloch | a doorway choked by one fallen block | Cloch Ghéar laid under it | The pillar lifts it 1.2 m and it lodges on the lintel: open for good, saved |
| Scáth | a wall a shade darker than its neighbours | Oíche worn: the wall shows a doorway | Walked through once, it stays a doorway (saved); before that it is solid to anyone without the word worn |
| Solas | a pale pillar with a crystal face, 2.5 m from the room's mouth | Solas-Gheal laid within 3 m of it for 3 s | Its script lights and a niche turns open |
| Gaoth | a gallery 3.8 m up, no stair | Séideán's updraft: 2.2 m of rise and the 1.6 m mantle make 3.8 | It sits in the step table's 3.4–3.8 m band on purpose, so *Second step* with *Catch* also reaches it: the one seal a trained body opens without the word (platforming B: more than one way) |

A wrong word does nothing and says so once: *The stone does not answer that word.*

### Mechanisms and hidden rooms (B)

| Secret | Tell | Opened by | Settled |
|---|---|---|---|
| Sliding wall | a draught: any flame within 4 m leans toward the wall, dust drifts, air sounds within 2 m; one stone 15% paler | E on the pale stone | In a large or massive gate one is the **shortcut back**: a corridor of up to 12 cells through rock from a corridor near the ring's side to one within 6 cells of the entry, cut as `gateBlock` cuts its U, opened from the far side only (the near side is plain wall). None fits, it is a plain sliding wall |
| Stair under the floor | the footstep turns hollow on the slab and the eight round it | Cloch Ghéar laid on the slab, or 20 s with the pick | The pick is loud: every foe on the floor within 30 m comes (`alertPack`'s way). Stairs down 3 m to a cellar room under the rock |
| Counterweight lift | a chain into the dark, a pan on the floor | a lever held 6 s, or Séideán sent at the vane (1 s) | A second bridge across a chasm, beside the stones; it stays down |
| Sluice | a side bay standing at 0.8 m of water, a wheel | the wheel held 8 s, or Tonn laid on the gate | Drains in 10 s; a grate rises on the room behind |
| Rotating chamber | a ring of floor stones laid in another course | Solas-Gheal laid on its pillar, or three plates whose order is **painted**, not written | Turns 90° in 4 s to face a room with no door. The painting is the fighter's tell |
| Plates in sequence | four plates, one already sunk; the order carved above in the script | the script (below) | A sealed cache behind them |

A held lever or wheel keeps its progress if you let go or are struck: the play clock, not a window (co-op rules). The shortest timing anywhere is the 3 s light on the pillar, far over 150 ms.

### The script

| Way | Cost | Settled |
|---|---|---|
| Read it | one banked reading | *Read the script (a reading)* at the lintel: the plates show their order as cut marks, for good |
| Read it, Old Blood | +1 Cold | Offered beside the reading, by choice, as §3.3 prices reading |
| Know it | nothing | If you hold all four words of the plates' school. This closes the page's gap: readings stop once you hold all 24 words, and by then you have paid for that school's understanding |
| Try it | each wrong order fires the plates' spikes for 12% of your health, the three free plates rise again | Six orders with one sunk: on average 2.5 wrong, 30% of health. Not the trap's tier roll: the price is the same in every gate |

### The wordless stories

| Story | Where | Settled |
|---|---|---|
| The delver's earlier camp | In a gate whose keep has the delver (one in three, built), a second cold camp at the threshold nearest a secret that is not his gate's seal | His body and journal stay in the keep; the journal gains one line naming that secret's tell in his words, never its place: two lines a kind from the quest writer, twelve in all |
| A barricade | one gate in four (`seededRng('barricade', seed)`), planks across a side room's mouth that holds no secret | Three blows of `doBash`, or one Caor touch (it is wood). Behind it what it held off: one of six scenes from the quest writer, and the floor's tier in one plain chest |

## What it touches

- **Functions.** `gateSecrets(gen, seed)` beside `gateThings` in `52-dungeon-gen.js`, pure, after the pools; `gateThingsBuild` for the props, and `dSolid` reads a shut secret's mouth as rock. `TOUCH_THING` gains the seal (caor, sioc); `layWord` finds a seal or mechanism under a laid thing (Cloch, Solas, Tonn); the worn tick shows the Scáth wall; `castSpell`'s Sent bolt finds the lift's vane. `tickFootsteps` (`78`) the hollow step; `72-audio.js` the draught and the hollow sound. `interact` (`50-travel.js`) the pale stone, lever, wheel, lintel and plates; `hasPick` for the slab. The plates reuse the spike plate's mesh (`68-dungeon-misc.js`). `doBash` the barricade. Named actions: `openSecret(id)`, `pullLever(id)`, `pressPlate(id, n)`, `readScript(id, way)`, `takeSecret(id)`.
- **`worldState`.** `gateSecrets`, the world's: `{seed: {o: [n…], t: {n: items}}}`, opened secrets and what is left in their chests. On the S242 list in `_applyLoadData`, not in `SS_CHAR_WS`. Readings and `cold` are the character's, as now. `gateKeeps` stays.
- **UI.** Prompts only: *Press the pale stone*, *Wind the lever*, *Turn the wheel*, *Read the script (a reading)*, *Read it (you grow colder)*. No panel.
- **What-a-gate-keeps' cache** (its session 7) is this sheet's seal of the gate's school, set in the keep's wall: it waits on this sheet's session 2 and no longer.

## The suites

| Suite | Sets up | Measures | Pass |
|---|---|---|---|
| `gatesecrets` (new) | 40 gate seeds of every size, two builds each | the secrets' kinds, ids and rooms; the count by size; every mouth against the entry-to-carving path; each seal under its word and under a wrong one | identical across builds; the table's counts or fewer, never more; none on the path; the right word opens, a wrong one does not |
| `gatescript` (new) | one plates gate: a reading banked, an Old Blood player, a player with neither | the reading spent, Cold, damage on a wrong order, the cache after the right one | −1 reading; +1 Cold; 12% ±0.5 a wrong order; the cache opens once |
| `gatesave` (extend) | a gate with an opened seal and a half-emptied secret chest | after save and reload | still open, the chest as left |

## Sessions

1. **Systems:** `gateSecrets` with the seals only, the record, `openSecret`, the shut mouth in `dSolid`, placeholder props. Suite `gatesecrets` (seals), `gatesave`.
2. **Systems:** the six keys wired; the seal's chest and `takeSecret`. Then what-a-gate-keeps' cache can be built.
3. **Systems:** the sliding wall and the shortcut, the hollow stair, the tells' sounds and the flames' lean; the barricade.
4. **Systems:** the lift and the sluice.
5. **Systems:** the plates and the script, the rotating chamber. Suite `gatescript`, `gatesecrets` extended to every kind.
6. **Look:** the six seals' props (stone leaf, block, dark wall, crystal pillar, gallery, the cold water's ledge).
7. **Look:** the mechanisms: chain and pan, lift bridge, sluice wheel and grate, the turning chamber, the plates' lintel.
8. **Quest writer:** twelve journal lines and six barricade scenes.

Five systems, two look, one quest-writer run. Session 1 needs nothing from anyone. F5's generator is untouched; the shortcut borrows `gateBlock`'s rock test, so it is an ordinary session, not deep work.

## The open number

**What a secret holds.** The page put the gate's own things behind the seals, but what-a-gate-keeps has since put the vein, the relic and the coffer in the keep. A player feels what a found wall pays.

- **A.** Every secret a chest one tier above its floor (`dungeonTier` + 1, at most 4), gold included; the plates' cache a rich chest.
- **B.** By what opens it *(recommended)*: a seal holds a chest a tier above, so the word pays; a mechanism is itself the gain (the shortcut, the second bridge) or holds a chest at the floor's tier; the plates' cache a rich chest a tier above, the 1-in-20 implement roll. A mage finds more and a fighter finds most, which is the page's line.
- **C.** No chests: each secret holds the way, a story or a rubbing of the nearest unread carving. Elden Ring's reward is the place, but a seal that pays nothing teaches the player to stop looking.

Until it is answered, session 2 builds B, since it is one table.
