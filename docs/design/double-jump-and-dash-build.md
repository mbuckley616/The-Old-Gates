# The double jump and the air dash (build sheet)

*The systems designer, 16 Oct 2026. A build sheet: it turns a design Michael has already chosen into numbers and asks nothing again. Its one open number is at the foot, with a DECISION.*

## What Michael chose

> **Michael (on OG-131, 13 Oct 2026):** "I do really really want to keep the idea of double jumping and air dashing though as unlockable abilities/perks."

Three earlier answers frame it. **Platforming B** (2 Oct, `platforming.md`): a mantle, falls that hurt, generated places with more than one way across, nothing on the main quest's path gated, no climbing. **Skills A** (`skills-and-perks-build.md`): perks arrive on their own; Acrobatics' are *Catch* (25), *Cat's fall* (50), *Second step*, the double jump (75), and *Swallow's turn*, the air dash (100). **F2b** (`scale-numbers-build.md`): the jump and falls keep their values in metres; the mantle reaches 1.6 m, *Catch* 2.2 m; town walls are 4.5 m or carry a no-mantle flag.

## Today

Hold Space on the ground and the loop (`90-main.js`) sets `velY` to `JUMP_VEL`; `GRAVITY` 18 brings it down. On `auto/systems` (Session 941) `JUMP_VEL` runs 5.5 to 6.6 with Acrobatics, an apex of 0.84 to 1.21 m. In the air you steer at full ground speed, so the sprint (3.83 to 4.2 by Athletics, +0.5% a Swiftness point, ×1.225) carries into every gap. Nothing stops the rise at a ceiling. `fallTrack` keeps a flight's top and `fallLand` charges 6% of health a metre past `fallFree()` (4 m; 8 m with *Cat's fall*, Session 977). Q is the roll; pressed in the air it is buffered as the landing roll (`FALL.qAt`). `acrobatics:75` and `:100` are named in `PERK_DEF` but not in `PERK_LIVE`.

## The numbers

Every figure is for a body in the air at 4.7 m/s (the open number), landing level with its take-off.

### Second step: the double jump (Acrobatics 75)

| What | Value | Why |
|---|---|---|
| The press | a fresh press of Space in the air, any time in the flight | a held Space never fires it; no timing window, so nothing hangs on one (the co-op 150 ms rule) |
| What it does | sets the rise to 4.5 m/s | the platforming page's impulse. Set, not added: added, a quick double tap would peak at 3.2 m |
| Apex, pressed at the top | 1.66 m at 75, 1.77 at 100 | F2b's ledge reach: 1.77 + *Catch* 2.2 = 3.97 m |
| Gap, pressed at the top | 4.85 m at 75, 4.98 at 100 | the platforming page's "4–5 the double jump" |
| Gap, the best late press | 5.68 m at 75, 5.84 at 100 | a late press trades height for distance; this is margin, never built into |
| How often | once a flight, back on landing (ground, foothold or mantle) | |
| Stamina | 12; the first jump stays free | the roll is 18. A full bar chains several, not a way to travel |
| Too winded | under 12 or in `staminaCD`: nothing, the bar flashes | the roll's rule |
| Carrying over 70% | rise 3.2 m/s (half the height); immobile, none | the heavy roll's logic |
| Falls | never resets the fall's count | a press near the ground does not cancel a 20 m drop; *Cat's fall* and Éan's *Wingless* are the answers |
| Swimming, Levitate, staggered | none | `startRoll`'s exclusions |

### Swallow's turn: the air dash (Acrobatics 100)

| What | Value | Why |
|---|---|---|
| The press | Q in the air while the dash is unspent | Q is the dodge; in the air it is the dodge's airborne form. Spent, Q buffers the landing roll as today |
| What it does | 3.0 m level in 0.2 s, toward the held keys or straight on; the fall pauses and restarts from rest | the *turn*: one change of direction a flight. At 3.0 a jump and a dash (6.45 m) clear the double jump's best (5.84), so each perk has its own step; the roll's 2.6 would overlap |
| Gaps | jump + dash 6.45 m; jump, double jump and dash at the tops 7.98; best timing 9.50 | |
| Height | none | the double jump climbs, the dash crosses; it adds no reach to a wall |
| How often, stamina | once a flight; 20 | jump, step and dash cost 32, so it is not a faster road |
| Carrying over 70% | none | |
| Walls | stops at a solid as the walk does (`dSlide`, `solidAt`, `intSolidAt`) | |
| Combat | no untouchable window, no strike from it | combat B made the roll the dodge; an immune air dodge would make jumping the answer to every swing |
| The landing roll | a dash ending within 0.2 s of landing counts as the roll and halves the fall | one key: pressing Q to soften a fall still softens it |
| The clock | `performance.now()`, as `tickRoll` | the dropped-frame rule: at 5 fps one frame holds the whole dash |

### Three rules the two need

- **Speed in the air is capped at 4.7 m/s**, the sprint of untrained legs (the open number). Without it a sprinter at Athletics 100 and Swiftness 40 (6.2 m/s) clears 3.8 m with no perk and 7.4 m with the double jump, and the table below means nothing.
- **The head stops at the ceiling.** The rise ends where `jumpY` plus the body's stature (`SCALE`) meets a room's ceiling, an `INT_SOL` underside or `DUN_FLOOR_H`. A double jump in a 2.7 m room would otherwise put the head through the floor above. F2b's 3.6 m dungeon clears it by 3 cm.
- **The fall's travel test exempts the dash.** `fallTrack` restarts the count on a move over 3 m in a frame; a dash in one slow frame moves 3.9. The dash marks its move so the fall still counts.

### The step table

Places are built to a step, never between (platforming B). The perks add two steps and two dead zones.

| Gap | Who crosses |
|---|---|
| up to 2.5 m | anyone (2.87 at most) |
| 3.0 to 3.3 m | a trained jumper: Acrobatics 50 clears 3.1, 100 clears 3.4 |
| 3.5 to 3.9 m | nothing built |
| 4.0 to 4.8 m | *Second step* pressed at the top, or Éan |
| 4.9 to 5.9 m | nothing built: the late press reaches 5.84 |
| 6.0 to 6.4 m | *Swallow's turn* after a jump; Sioc and Tonn's frozen wave; a felled trunk |
| 6.5 to 7.5 m | jump, double jump and dash together; the trunk |
| 10 m and over | a trunk, Scáth's step, or the long way (past the best of everything, 9.5) |

| Ledge | Who reaches it |
|---|---|
| up to 2.4 m | anyone (0.84 + 1.6) |
| 2.5 to 3.1 m | *Catch* (0.91 + 2.2) |
| 3.4 to 3.8 m | *Second step* and *Catch* (1.66 + 2.2) |
| 4.5 m and over | nobody: walls |

**Walls carry the no-mantle flag outright.** Éan multiplies the first step only, but Éan, the double jump and *Catch* at Acrobatics 100 still reach 4.82 m, over F2b's 4.5. So of F2b's "4.5 or the flag", this sheet settles the flag, on every town wall, curtain, gatehouse and keep, and the night watch keeps its gates.

### The places that ask

Nothing on the main quest's path asks for either perk; each place keeps another way.

| Place (platforming B) | Double jump | Dash |
|---|---|---|
| Broken tower | one in three has a shelf at 3.4–3.8 m, the short way up | none |
| Gorge crossing | the third gap at 4.0–4.8 (the Bealach's 4.6) | one in four has a 6.0–7.5 span, a tree on the bank and a ford downstream |
| Cliff shelf | one in four at 3.4–3.8 m | none |
| Pit of pillars | the last pillar before the cache at 4.0–4.8 | one in three has a far ledge at 6.0–6.4 |
| Crumbling floor | the plate run is 4.0–4.8 long, cleared whole | none |

A cache behind a perk's step rolls its loot one tier up, so the perk pays.

## What it touches

- **Code** (systems builder): the jump block in `90-main.js` (the fresh press, the step, the cap, the head clamp); beside the roll in `10-player.js`, a per-flight `AIR` state, the dash on `tickRoll`'s clock, `startRoll`'s airborne branch, `fallTrack`'s travel test and `fallSettle`'s roll credit; Space's keydown edge in `92-creator.js`. `PERK_LIVE` gains `acrobatics:75` and `:100`. Constants: `AIR_STEP_V` 4.5, `AIR_STEP_STAM` 12, `AIR_DASH` (3.0 m, 0.2 s, 20), `AIR_CAP` 4.7.
- **Bodies** (with F10): a tuck for the step, a lean for the dash in `tpPose`, the hands' dip in `16-viewmodel.js`. The puff and the whoosh are cosmetic.
- **Places**: the steps above, in platforming B's sessions after the heights deep-work card, which also lays the walls' flag.
- **Saves**: nothing. Perks are read from the skill; the flight's state lives a second. No `worldState` key; the S242 list and `SS_CHAR_WS` are untouched. Co-op: both are the character's.
- **Panels**: the Skills tab lights them; the pause sheet's keys gain the two lines once held; one line the first time each is held (the quest writer's words).

## The suites

| Suite | Sets up | Passes when |
|---|---|---|
| `airstep` | flat floor, Acrobatics 74, 75, 100; Space again at the top; Space held through | nothing at 74; apex 1.66 and 1.77 ±0.03; −12 stamina; held Space fires nothing; once a flight; refused at 11 |
| `aircap` | Athletics 100, Swiftness 40, Haste, sprinting off a ledge | 4.7 ±0.05 in the air, 6.2 on the ground; gaps 2.87, 3.44, 4.85, 4.98, never over 5.9 |
| `airdash` | Acrobatics 99 and 100, Q at the top, keys left then none | nothing at 99; 3.0 ±0.05 m in 0.2 s, toward the keys or on; no fall in it; once; −20; refused at 75% load |
| `airdashwall` | a corridor's end 1.5 m ahead | stops at the wall less `PLAYER_R` |
| `airdashframes` | the dash at dt 1/60 and 0.2, then a 10 m fall | distance ±0.05 and the fall's damage the same |
| `airroll` | 10 m drop at Acrobatics 100: Q 0.1 s before landing; then dash spent, Q again | halved both times |
| `headroom` | a 2.7 m room; a 3.6 m dungeon | the head stops at the ceiling; 3.57 m in the dungeon, untouched |
| `airfall` | 12 m drop, the step pressed 1 m up | the drop counted from the top |
| `wallreach` (with the heights card) | Éan, Acrobatics 100, step and *Catch* at a town wall, then at a 4.0 m block | wall's foot; on top of the block |
| re-run | `falls`, `perkfall`, `roll`, `lockon` | unchanged |

## Sessions

1. **Systems builder, one Opus session, now**: the step, the cap, the head clamp, the fall rule; `airstep`, `aircap`, `headroom`, `airfall`. It needs only PR #353's skills: rooms and dungeons have heights already, and a river's banks are terrain.
2. **Systems builder, one Opus session**: the dash; `airdash`, `airdashwall`, `airdashframes`, `airroll`.
3. **Bodies builder, half a session, with F10**: the tuck and the lean.
4. **Places**: no session of their own; they ride platforming B's.

## The open number

### The double jump and the air dash — should speed in the air be capped? (the designer, 2026-10-16)

The step table works only if a gap's length depends on Acrobatics alone. Today you fly at full ground speed, so at Athletics 100 and Swiftness 40 an untrained jump clears 3.8 m and the double jump 7.4 m.
- **A. Capped at 4.7 m/s in the air for everyone** *(recommended)*: the sprint of untrained legs. Anyone clears 2.9 m, the double jump about 5, the dash 6.5 to 8, for every character. Fast legs win on the ground, not over a gap.
- **B. No cap, as today.** Places are built to the fastest legs, so a slow character misses even the 3 m steps and a fast one double-jumps the dash's gaps.
- **C. Capped at 4.7, with Haste lifting it to 6 for its 20 s.** A's table, plus a spell as one more answer to a gap, at the cost of a Haste-shaped hole (a double jump under Haste reaches 7.3 m).

Recommendation: **A.** Each perk then opens its own step, and a place built for the double jump reads the same to a Scout and a Warrior. Under B the perks are speed under another name; Éan and Scáth already give magic its answers to a gap.
