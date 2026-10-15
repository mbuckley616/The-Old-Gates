# Skills and perks, A: the build sheet

*The systems designer, 15 Oct 2026. This is a build sheet. It turns a design Michael has already chosen into numbers and asks nothing again. Its one open number, with a DECISION, is at the foot.*

## What Michael chose

> **Michael (27 Sep 2026):** "**A** — the Morrowind book. Be mindful of Oblivion Remastered's levelling, which worked well and had no scaling problem: take its fixes (attribute gains not tied to policing your own skill use; no punishment for levelling the wrong skills). Enemies by place rather than by level still stands as the designer's condition."

The design page is `skills-and-perks.md`, direction A. Four later answers bear on it:
- **Survival B** (30 Sep) adds Smithing and puts fletching under Woodcutting.
- **Combat B** (28 Sep) makes the roll and the riposte everyone's, and moves the parry window onto Guard.
- **#142 A** (4 Oct) puts the level on one sheet.
- **L11** (12 Oct) asks for the double jump and the air dash as perks.

Enemies by place has its own sheet, fourth in the queue. Until it lands, `enemyHpScale` and `enemyDmgScale` keep reading the level (Michael's C on #51).

## Today

There are no skills. Kills and quests pay `xp`, and `xpNext` starts at 200 and rises ×1.4 a level. `chkLvl` banks the level, and `takeLevelIfReady` opens `openLevelUp` at a bed. There you tick three of the eight `ATTR_DEF` attributes. Each one gains ×1 to ×5, set by its counter in `lvAct` (kills for Might, damage taken for Fortitude, shop transactions for Intelligence). `confirmLevelUp` then adds +1 to the archetype's three primaries, +10 health, and +10 stamina in `takeLevelIfReady`.

Melee is the weapon's roll plus `level × 1.5`, then × (1 + 1% a Might point), in both resolvers (`62-actions.js`, `42-zone-enemies.js`). Spells add `level × dmgLvl` in `applySpellDamage`. Weapon tiers from Iron up ask for Might 5 to 56 (`MATERIALS.reqAttr`). `pickChance` is .35 + 7% a Finesse point + 1% a level. The run is 3.83 a second and the jump `JUMP_VEL` 5.5, both in `90-main.js`.

## The numbers

### The 22 skills

The design page had 21. Survival B's Smithing makes 22, because Michael named it ("if we are going to have mining we will also need smithing"). A *use* is one thing done against resistance, at most once a second for each skill and target, so a sleeping deer teaches nothing.

| Skill | Governs | A use | Weight | What the skill sets |
|---|---|---|---|---|
| Blade (swords, daggers, axes, spears) | Might | a hit on an alert foe | 1; a riposte or finisher 3 | damage × (0.6 + 0.8 × skill/100) |
| Blunt (maces, clubs, staves, hammers) | Might | as Blade | as Blade | as Blade |
| Bow | Finesse | an arrow that hits an alert foe | 1; past 30 m, 2 | as Blade |
| Guard | Resolve | a held block 1, a bash 1, a perfect parry 3 | — | parry window 160 ms + 1 ms a level (combat B) |
| Athletics | Swiftness | 10 m sprinted or swum | 1 | run 3.83 → 4.2; swim ×0.8 → ×1.3; sprint cost −30% at 100 |
| Acrobatics | Swiftness | a jump that lands higher than it left, or clears a gap over 2 m; a landing roll | 1; a fall over 4 m lived through, 2 | `JUMP_VEL` 5.5 → 6.6 (apex 0.84 → 1.21 m) |
| Armour | Fortitude | a hit taken while wearing three or more pieces | 1 | armour's `def` × (0.75 + 0.5 × skill/100) |
| Tine, Uisce, Cloch, Scáth, Solas, Gaoth | Int (Tine, Gaoth, Solas); Resolve (Uisce, Cloch, Scáth) | a cast that does something: hits an alert foe, heals lost health, lifts you, opens a way | 1; a Mastery word 2 | power × (0.6 + 0.8 s), cost × (1.4 − 0.8 s), as `magic.md` B |
| Stealth | Finesse | 10 s sneaking within a foe's or witness's sight range, unseen | 1; a backstab 3 | sight on you × (1 − 0.4 × skill/100) |
| Locks | Finesse | a pin set | 1; a lock opened 3 | `pickChance` .35 + .005 a level + .01 a Finesse point, to .92 |
| Speech | Charisma | a sale or a purchase 1; a topic that moves favour 2 | — | prices 0.2% better a level, to 20% |
| Alchemy | Intelligence | a pick 1, a brew 8, a pair brewed the first time 25 | — | as `survival-and-alchemy.md` |
| Cooking | Charisma | a meal 6 | — | as survival |
| Mining | Might | a strike 1, an ore 4 | — | as survival |
| Woodcutting | Fortitude | a strike 1, a log 4, ten arrows fletched 2 | — | as survival; fletching is everyone's, ten arrows from a log and feathers |
| Smithing | Might | an ingot 2, a piece made 10 + 5 × tier | — | the tier you can make, on the weapon gates below |
| Joinery | Finesse | a plank or a spar 2, a patch or splice 6, a bow, staff or shield 15 | — | field repair 60% + 0.4% a level (`sailing.md` A) |

Fortune governs no skill, as Luck in Morrowind governs none. The ×1 point falls on skill 50, so a weapon at 50 hits exactly as today's weapon does without the level bonus. A skill starting at 5 hits at ×0.64, and one at 100 at ×1.4.

**The curve.** The next level costs 0.9 × L^1.2 uses: 6 at 5, 23 at 15, 43 at 25, 98 at 50, 160 at 75, 223 at 99. From 15 to 50 is 2,041 uses, and from 50 to 100 is 7,976. A main weapon earns about 200 uses an hour, so 15 → 50 takes about ten hours and 50 → 100 about forty more. That is the pace the survival and sailing pages already assume, so they need no change. Skills do not fall from disuse.

**The start.** At the creator you choose five majors (they start at 25) and five minors (15). The other twelve start at 5. Each archetype suggests a set, and you can change any of it on the one sheet.

| Archetype | Majors | Minors |
|---|---|---|
| Warrior | Blunt, Armour, Guard, Athletics, Smithing | Blade, Bow, Acrobatics, Mining, Woodcutting |
| Sentinel | Guard, Armour, Blunt, Speech, Solas | Blade, Athletics, Cloch, Smithing, Cooking |
| Duelist | Blade, Guard, Acrobatics, Athletics, Speech | Bow, Stealth, Armour, Locks, Gaoth |
| Scout | Bow, Athletics, Stealth, Acrobatics, Woodcutting | Blade, Locks, Joinery, Cooking, Gaoth |
| Monk | Blunt, Acrobatics, Solas, Uisce, Athletics | Guard, Cloch, Alchemy, Cooking, Speech |
| Scholar | Tine, Solas, Alchemy, Speech, Scáth | Uisce, Gaoth, Cloch, Locks, Blunt |
| Diplomat | Speech, Blade, Stealth, Solas, Locks | Alchemy, Athletics, Scáth, Bow, Cooking |
| Vagrant | Stealth, Locks, Blade, Athletics, Acrobatics | Speech, Bow, Scáth, Cooking, Woodcutting |

### The level, with Oblivion Remastered's two fixes

- **Every skill counts toward the level.** A major's or minor's skill-up is one mark. Any other skill-up is a quarter of a mark. Levelling by alchemy is never wasted, and nothing punishes it, because enemies scale by place (the fourth sheet). A level takes ten marks, and more as you rise; the rate is the open number at the foot.
- **The attribute points are yours to place.** The bed gives 12 points, at most 5 in any one attribute. This is Oblivion Remastered's purse, in place of Morrowind's ×1–×5 bought by use. #142 A's sheet keeps its eight rows. Its five diamonds become the five points you may place in a row. The row's line "what earned it" becomes *what rose under it*, for example "Blade +4, Blunt +1 this level". The sheet pre-lights the placement in proportion to those skill-ups, so a player who reads nothing gets Morrowind's answer, and any point can be moved freely. Each attribute caps at 60.
- **What else changes.** Each level still gives +10 health and +10 stamina. The archetype's automatic +1 to three primaries goes, because the majors carry the archetype now. Kills and quests stop paying level progress. A quest's reward keeps its gold, goods and standing. The `xpBoost` buffs become +25% skill uses.

### The attributes at ≤1% a point

The pools stay: Fortitude gives 10 health and 5 stamina a point, and Intelligence 10 mana and 0.2 regeneration. Every percentage is 1% a point or less:
- Might: melee damage 1%, carry 5.
- Finesse: bow damage 1% (`BOW_FINESSE_DMG` 0.04 → 0.01); its parry milliseconds go to Guard.
- Swiftness: move 0.5% (was 2%).
- Fortune: crit 0.5% (was 2%), gold 1% (was 5%).
- Resolve: magic resistance 1%, block cost −1%.
- Charisma: barter 0.5%.

`BOOKS` stay +1 to an attribute, as the canon has them. The six artifact checks move to their skill at 50, as `unique-artifacts.md` says.

### Weapon and armour gates

`MATERIALS.reqAttr` and `reqVal` read the weapon's skill (or Armour, for `ARMOR_FORT_REQ`), and today's refusal is unchanged. The gates: Iron 15, Steel 30, Mithril 45, Adamant 55, Obsidian 65, Draconic 75, Demonic 90, Cosmic 100. Smithing makes to the same gates.

### The perks

Every perk arrives on its own at 25, 50, 75 and 100. Each changes what you can do, not only how much. The six schools' perks are written here so that the magic sheet can rename them (the canon's names are the quest writer's).

| Skill | 25 | 50 | 75 | 100 |
|---|---|---|---|---|
| Blade | *Draw cut*: the first swing from a sheathed blade does ×2 posture damage | *Long riposte*: the riposte window 0.8 → 1.2 s | *Crossing*: a perfect parry also staggers a second attacker within 3 m | *Clean edge*: a finisher ignores `def` |
| Blunt | *Weight*: +25% posture damage | *Ringing*: a power hit breaks a raised shield in one blow | *Daze*: a staggered foe stays down 0.6 s longer | *Earthshaker*: the chain's third hit staggers every foe within 2 m |
| Bow | *Steady*: a full draw holds 3 s without sway | *Quick nock*: draw 30% faster | *Long eye*: half the drop past 50 m | *Through*: a full-draw arrow passes the first foe |
| Guard | *Deflect*: a held shield turns arrows | *Bulwark*: a bash drains +50% posture | *Iron wall*: a heavy attack no longer breaks a held block | *Second parry*: within 0.4 s of a perfect parry, the next parry is perfect too |
| Athletics | *Swimmer*: swim at run speed | *Long breath*: three times the air underwater | *Road legs*: no sprint cost on a road | *Tireless*: stamina regeneration doesn't pause after a sprint |
| Acrobatics | *Catch*: mantle to 1.6 m, and catch an edge while falling | *Cat's fall*: falls free to 8 m (was 4) | *Second step*: the double jump | *Swallow's turn*: the air dash |
| Armour | *Fitted*: worn armour weighs half | *Unbowed*: player posture +25% | *Hold the line*: a light hit doesn't stagger you above half posture | *Second skin*: worn armour never slows the roll |
| Stealth | *Soft step*: sneak at walking speed | *In the dark*: sight on you −25% more out of light | *Light foot*: plates and crumbling floors don't trigger while sneaking or sprinting | *Shadow's hand*: a backstab does +50% |
| Locks | *Feel for it*: the next pin's shear shows faintly | *Sure hand*: a snapped pick keeps the set pins | *Quiet work*: picking halves a witness's range | *No mark*: a picked town lock is never found |
| Speech | *Haggle*: 5% better both ways | *Talk it down*: a guard's fine halved, once per town | *Hearing*: a person at favour −1 still talks | *Word given*: once a day a guard takes your word for a trespass |
| Each school | *Steady voice*: its Impression words go wild 15% (was 30%) | *Thrift*: −15% cost | see below | see below |
| Alchemy | *Tell*: a hidden effect after 5 eats (was 15) | *Third hand*: a third herb and a second rider | *Stoppered*: tinctures don't turn | *Double measure*: two from one grinding |
| Cooking | two portions | *Shared pot*: everyone at the fire is fed | *fed* lasts through sleep | a herb seasoning adds its known effect at a third |
| Mining | *Prospector*: veins on the minimap within 40 m | one ore in four comes double | the magnetic ore of La Grise | *Seam*: a vein holds 5 (was 3) |
| Woodcutting | *Felling*: the trunk falls where you face, a bridge for 10 minutes | *Fletcher*: fifteen arrows from a log | heartwood for masts | one more log a tree |
| Smithing | *Smelter*: two ingots from three ore | *Fine work*: a made piece is one quality step up | *Temper*: four tempers (was three) | *Masterwork*: one named piece a tier |
| Joinery | *Field splice*: splice the rig at sea | *Tight seams*: patches mend +50% | *Bowyer*: the longbow and the war bow | *Shipwright's hand*: a patch takes 4 s (was 8) |

At 75 and 100 each school's perks are its own. Tine: burns last twice as long; fire leaps to a second foe within 3 m. Uisce: Sioc slows ×1.5; a frozen foe shatters at a finisher. Cloch: laid stone stands twice as long; a worn ward turns arrows. Scáth: the step reaches 18 m (was 12); you are unseen 3 s after a step. Solas: heals +25%; light staggers the undead. Gaoth: the updraft lifts 1.5 m more; a sent Gaoth knocks a foe down.

The four Acrobatics perks were reordered from the platforming page (Second wind at 50, Cat's fall at 75, Light foot at 100) to the order of the concept sheets that Michael's L11 note answered: the double jump at Expert, the air dash at Master. Light foot moves to Stealth 75. Platforming B's gaps do not change (the double jump crosses 5 m at any rank). Sheet three sets the jump's and the dash's heights, distances and stamina.

## What it touches

- **Code**: `12-character.js` (`SKILL_DEF`, the 22 rows above; `ATTR_DEF`'s gains; `getMultiplier` retired; `openLevelUp`, `gainLines`, `toggleAttr`, `confirmLevelUp` on 12 points; `luHPGain`; the creator's majors and minors) and `62-actions.js` (`chkLvl` and `takeLevelIfReady` on marks; the xp lines in `killE`; the melee roll). The same melee roll in `42-zone-enemies.js`, with the xp line in `killZoneEnemy`. `74-strikes.js` (`applySpellDamage`'s flat level term; the parry window and `lvAct.parries`). `90-main.js` (the run and swim lines, `JUMP_VEL`). `68-dungeon-misc.js` (`pickChance`), `14-items.js` (`MATERIALS`), `60-shop.js` (barter, `attrEff`), the witness's and foes' sight (`witnessOf`, `canSeePlayer`). `skillUse(id, weight, target)` goes in at every call site `lvAct` has today, and at the new ones.
- **The save**: `skills` (22 levels and their progress), `majors`, `minors`, `levelMarks` and `levelUps` (this level's skill-ups, for the sheet) replace `lvAct`. They are top-level fields beside `ATTRS`, all the character's, so they ride the character row; none is a `worldState` key, and the S242 list is untouched. Perks are not saved: they are read from the skill. `ssSanitizeLoaded` migrates an old character once: attributes kept as they are; majors and minors from the archetype's table; majors at 25 + 2 a level past 1, minors at 15 + 1, to 60; `lvAct` dropped; banked `xp` becomes marks in proportion.
- **Panels**: a Skills tab in the hub (22 rows, a bar to the next level, the four perks, lit when held), the #142 sheet on points, and a "skill rising" card (L11's interface list).

## The suites

| Suite | Sets up | Measures | Passes when |
|---|---|---|---|
| `skillcurve` | a skill at 5, 25, 50, 99 | uses to the next level | 6, 43, 98, 223 (±1) |
| `skilluse` | a sleeping deer, then an alert bandit; 30 swings in 10 s | Blade uses | 0 for the deer; at most 10 for the bandit |
| `skilldamage` | the same sword and seed at Blade 5, 50, 100 | the hit | ×0.64, ×1.0, ×1.4 of the roll, with no level term at level 1 or 20 |
| `levelmarks` | ten major skill-ups, then forty non-major | a level banked | one after the ten; one more after the forty |
| `levelsheet` | a banked level at a bed | the points | 12 placed; a sixth in one row refused; the pre-lit rows follow `levelUps` |
| `perkranks` | Acrobatics at 24, then 25; Cat's fall at 49 and 50 | the mantle height, then the free fall | 1.1 → 1.6 m; 4 → 8 m |
| `perkguard` | Guard at 0 and 100 | the parry window | 160 and 260 ms, never under 150 |
| `skillgates` | a Steel sword at Blade 29, then 30 | equip | refused, then held |
| `skillmigrate` | a level-12 Duelist from the last 1.x save | skills, attributes, marks | Blade 47; attributes unchanged; the game plays on |
| `skillsave` | `ssExportChar` alone into a fresh world | the skills | all 22 come back; the world row has none |

## Sessions

Three Opus sessions for the systems builder, in order:
1. The skills table, `skillUse` at every site, the curve, and the reads: damage, spells, picks, gates, movement, sight. Then the save and the migration. Suites: `skillcurve`, `skilluse`, `skilldamage`, `skillgates`, `skillmigrate`, `skillsave`.
2. The level on marks, the 12 points, the creator's majors and minors, and the Skills tab as plain markup. Suites: `levelmarks`, `levelsheet`.
3. The first wave of 40 perks: Arms, Body, Hand and word. Suites: `perkranks`, `perkguard`, and one line for each perk.

The look builder then puts the sheet and the tab on the parchment kit (one session, #142 A). The schools' 24 perks arrive with magic B's sessions. The land skills' 24 arrive with survival's. The work touches `12`, `42`, `62`, `74` and `90`, so it waits for FREEZE #297 to lift and for F2a to merge. Combat's resolver reads the skill multiplier from session 1 and should follow it.

## The open number: how fast the level comes

The simulation behind this choice is a character playing an ordinary mix: a weapon, Guard, Armour, Athletics, one school, a little stealth, locks and alchemy, about 650 uses an hour. With a flat ten marks a level, as in Morrowind, it reaches level 10 in about 5 hours, 25 in 21 and 40 in 46. The canon wants a chunky curve ("levelling should matter"), and twelve points a level is a large step. So the rate is a number the player feels every evening.

- **A.** Ten marks every level, as in Morrowind: level 10 at about 5 h, 25 at 21 h, 40 at 46 h.
- **B.** Ten plus half the level: level 10 at about 7 h, 20 at 27 h, 25 at 45 h; about 30 by 75 h.
- **C.** Ten plus the level: level 10 at about 9 h, 20 at 44 h, 25 at 90 h.

Recommendation: **B.** An evening early on still ends in a bed and a level. A sixty-hour character stands near level 27 with about 320 points placed, so most attributes are short of the cap of 60 and each level's choice still matters. A runs out of choices by the second week. C makes the late levels arrive once a fortnight.
