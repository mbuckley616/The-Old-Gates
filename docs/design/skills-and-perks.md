# Skills and perks

*The systems designer, 27 Sep 2026. A proposal, not a spec: nothing here is built until docs/decisions.md carries a `Michael:` line under it.*

## The problem in Michael's words
> "A skills system complementary to the attributes, with perks unlocking at skill levels (e.g. a double jump from acrobatics). Athletics/acrobatics (under whatever names) drive jump height, movement and swim speed. Schools of magic are skills. Weapon skills carry damage; attributes add ≤1%/point." (backlog J)
>
> "The Melee DMG % climbs far too fast with a few levels of points in Might. Damage should be rooted in the weapon type and a weapon skill." (backlog C)

The brief's second feeling is the test: *skills that grow by use, perks that change how you play, a world that pushes back.*

## Today
There are no skills. Kills and quests pay XP (`xp`, `xpNext` starting at 200 and ×1.4 a level). When `chkLvl` finds enough, you rest in a bed and `openLevelUp` has you tick three of the eight `ATTR_DEF` attributes. Each attribute's gain is multiplied ×1–×5 by an activity counter in `lvAct` (kills for Might, parries for Finesse, shop transactions for Intelligence), and `confirmLevelUp` adds +1 to the archetype's three primaries on top, so one level can put 18 points into attributes. Might pays +3% melee a point, and the melee formula (`mightMult` in both strike resolvers) also adds `level × 1.5` flat, so a Warrior's damage runs away. The same `level` scales every enemy (`enemyHpScale` +15% HP a level to ×3, `enemyDmgScale` +8% to ×2), regen, and `pickChance`. Weapon tiers from Iron up require Might 5–56 (`reqCheck`). Spells need Intelligence 3/15/35 for their three tiers, which is canon (Impression, Comprehension, Mastery). The jump is `JUMP_VEL` 5.5 against gravity 18, an apex of .84 units.

## Directions

All three share one skill list (21 skills), each 1–100, raised by use:

| Group | Skills |
|---|---|
| Arms | Blade, Blunt, Bow, Guard (block, parry, bash) |
| Body | Athletics (run, sprint, swim), Acrobatics (jump, fall, later climb and roll), Armour |
| The deep tongue | Tine, Uisce, Cloch, Scáth, Solas, Gaoth — the six schools in the code |
| Hand and word | Stealth, Locks, Speech |
| The land | Alchemy, Cooking, Mining, Woodcutting, Joinery |

The last row are names held for the survival and sailing proposals. A *use* is one thing done against resistance: a hit on an alert enemy, a parry, a lock pin set, ten units swum, a jump that lands higher or clears a gap. One use per target per second, so nobody levels Blade on a sleeping deer. The cost of the next skill level is 0.9 × L^1.2 uses: 23 at 15, 43 at 25, 98 at 50, 223 at 99. At about 200 hits an hour, a main weapon goes 15 → 50 in ten hours and 50 → 100 in forty more. The archetype starts three skills at 25, four at 15, the rest at 5.

Damage moves to the skill: a hit is the weapon's roll × (0.6 + 0.8 × skill/100), so ×.64 at 5, ×1.0 at 50, ×1.4 at 100, then × (1 + 1% a Might point). The flat `level × 1.5` goes; tier requirements move from Might to the weapon's skill (Iron 15, Steel 30, Mithril 45 … Cosmic 100). Acrobatics raises the jump from 5.5 to 6.6 (apex .84 → 1.21 units); Athletics the run from 3.83 to 4.2 u/s, swim speed ×.8 → ×1.3, sprint cost −30%. Every attribute's percentage drops to ≤1% a point (Swiftness's move speed from 2% to .5%); the pools (Fortitude's HP, Intelligence's mana) stay as they are. A school's skill sets a spell's cost and power; Intelligence still sets which tier the sigil gives you, as the canon says.

### A. The Morrowind book — level from major skills, attributes from what you used
**The loop.** Five major and five minor skills at creation (the archetype suggests them); ten level-ups among them earn a level at the next bed, where you raise three attributes by ×1–×5 according to the skill-ups of each one's governing skills (Might ← Blade, Blunt, Armour; Finesse ← Bow, Guard, Locks …). Today's screen and multipliers, fed by skills instead of `lvAct`. Perks arrive by themselves at 25/50/75/100.
**Touches.** `lvAct` becomes a skill-up tally; `chkLvl` counts major/minor ups; kills stop paying XP.
**Conflicts.** Morrowind's trap stays: efficient levelling means policing your own skill use. Perks that arrive on their own are not decisions. Enemies still scale by level, so a character who levels on Cooking meets harder wolves.
**Cost.** Two Opus sessions (skills and the level-up; the perks at four ranks).

### B. The Skyrim book, with attributes kept — level is the sum of your skills, perks are points
**The loop.** Every skill level you gain pays character XP equal to the level reached (Blade 40 → 41 pays 41). A character level costs 150 + 75 × L XP: about ten skill-ups for level 2, thirty at level 20. At a bed you take the level: +1 perk point, +3 attribute points to place (cap 50, no multipliers, no automatic archetype +1), +10 HP as today. Perks sit in a short tree per skill, each gated by that skill's level; some pairs are forks (take one, the other closes).
**Rules.** A sixty-hour character reaches about level 25; 40 is the practical ceiling, so about 40 perk points against roughly 120 perks written. You choose a third of them. Perks change what you can do, not only numbers:

| Skill | 25 | 50 | 75 |
|---|---|---|---|
| Acrobatics | *Catch*: grab a ledge at head height | *Second wind*: a double jump (4.5 impulse) — **or** *Roll*: a dodge with a short immunity | *Cat's fall*: no fall damage under 8 units |
| Athletics | *Swimmer*: swim at run speed | *Long breath*: triple air under water | *Road legs*: no sprint cost on a road |
| Blade | *Riposte*: a swing within .8 s of a perfect parry can't be blocked | *Draw cut*: the first hit from a sheathed blade staggers | *Crossing*: a parry against two attackers at once |
| Guard | *Deflect*: a timed shield block turns arrows | *Bulwark*: bash breaks a brute's posture outright | — |
| Locks | *Feel for it*: the next pin's shear shows faintly | *Sure hand*: a snap keeps the set pins | *Quiet work*: picking halves a witness's range |
| Speech | *Haggle* | *Talk it down*: a guard's fine halved once per town | — |

**Touches.** A skills table and a `skillUse(id)` hook at the call sites `lvAct` already has (`lvAct.kills++`, `lvAct.parries++` …); `chkLvl`, `openLevelUp`, `confirmLevelUp`; both melee resolvers, `applySpellDamage`, `pickChance`, `reqCheck`, the regen, jump and swim lines; a Skills tab in the hub and a perk page; `skills` and `perks` in the save and `ssSanitizeLoaded`. Old characters migrate once: attributes back to the creator's plus three a level, skills from the archetype plus two a level on its majors, `level − 1` perk points to spend.
**Conflicts.** Level still exists, so the enemy scaling has to stop reading it (below). Kills stop paying XP directly; quests keep paying, as character XP.
**Cost.** Three Opus sessions: skills, use and damage; the level-up and the Skills tab; the first wave of perks (Arms, Body, Locks, Speech, about 40). Schools' and survival perks arrive with their own proposals.

### C. The Dragonwilds book — no character level at all
**The loop.** Skills rise by use and nothing else does. At 15/30/50/75/100 each skill offers a fork of two perks, chosen for good (a trainer swaps one for 100 × rank gold). Every ten skill-ups among an attribute's governing skills is +1 to it.
**Touches.** Everything B touches, and `level` removed from the damage, regen, lock and enemy formulas, the HUD, the save and the sleep screen.
**Conflicts.** The canon records that you want the curve chunky and levelling to matter; this removes the level-up and the bed with it, and the quests' XP rewards lose their meaning.
**Cost.** Four Opus sessions, the fourth to unpick `level` everywhere.

## Recommendation
**B.** It is the only one of the three where each level asks for a decision: a perk from a tree, sometimes one of a pair that closes the other. That is where "perks that change how you play" lives: the double jump, the riposte, the roll. It keeps the level-up in a bed and a level that matters, which you asked for, while taking its power away from the Might runaway: damage becomes the weapon, then the skill, then one percent a point. A keeps the multiplier screen and its trap; C throws out the level to fix a problem B fixes without that. Precedent: Skyrim's skills-feed-level is the most played version of this loop, and its failures (perks that are only +20%, level-scaled enemies) are the two things B changes.

## What must be true first
- **Enemies scale by place, not by level.** Under B a character who levels by alchemy would meet harder wolves (Oblivion's failure), and with friends in your world there is no one level to scale to; the brief asks for one tuned difficulty. `enemyHpScale`/`enemyDmgScale` read a danger tier from the region and the dungeon floor instead. One Opus session, before or with the second session above. Part of this decision.
- **The combat proposal** (next in the order) decides whether the roll is a perk or everyone's; if everyone's, Acrobatics 50's fork becomes *Second wind* or *Long roll*.
- **The magic proposal** decides whether six schools stay six skills; the skill's role (cost and power, never the sigil tier) holds either way.
- The Might ≤1% flattening in backlog C can go in now; it is the same number B uses.

## Not asked
Skill books stay +1 attribute, as the canon has them. No class or birthsign system beyond the archetype. No skill loss from disuse. The survival, sailing and magic perks, and the weights of each use (a power attack against a lock pin), are left to those proposals and the build. No respec beyond the one migration.
