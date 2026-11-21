# The new look's suite — QA's ledger

Every suite under `node tests/run.mjs --look=new` (2.0's first condition, `docs/design/v2-scope.md`): its old-look result on CI, its new-look
result here, the cause of any failure and its owner. Run by shard of 14 (`--shard=k/14`), two shards side by side on a 4-core cloud container.
Started 15 Oct 2026 (QA run of 18:51 UTC, main 0773903 plus Sessions 946–949). Old look: every suite here passed on main's CI run
38768168884 (f031a36, 15 Oct).

| Suite | Shard | Old look (CI) | New look | Seconds | Cause, owner |
|---|---|---|---|---|---|
| `abbey` | w2/20 | — | pass | 168 |  |
| `academy` | w3/20 | — | pass | 207 |  |
| `aimbubble` | w5/20 | — | pass | 274 |  |
| `aircap` | w13/20 | — | pass | 202 |  |
| `airdash` | w16/20 | — | pass | 288 |  |
| `airstep` | w7/20 | — | pass | 198 |  |
| `aldwynword` | w19/20 | — | pass | 314 |  |
| `alehallroom` | w17/20 | — | pass | 192 |  |
| `aqueduct` | w14/20 | — | pass | 112 |  |
| `armourfit` | 5/14 | pass | pass | 49 |  |
| `armourkit` | w5/20 | — | pass | 226 |  |
| `armourlines` | w19/20 | — | pass | 231 |  |
| `armourlines-numbers` | 3/14 | pass | pass | 51 |  |
| `articles` | 9/14 | pass | pass | 70 |  |
| `ashenburn` | 3/14 | pass | pass | 235 | 15 Nov weekly: red twice (2 rigs left near the ruin), fixed S2397; 7/7 here at s1805 (S2481) |
| `ashwort` | 6/14 | pass | pass | 46 |  |
| `attrdmg` | w2/20 | — | pass | 151 |  |
| `attrpromise` | w18/20 | — | pass | 220 |  |
| `aurapothecary` | w3/20 | — | pass | 446 |  |
| `aurhome` | w17/20 | — | pass | 356 |  |
| `aurhome1` | w10/20 | — | pass | 230 |  |
| `aursmithy` | w12/20 | — | pass | 122 |  |
| `autosave` | 3/14 | pass | pass | 103 |  |
| `autumn` | w8/20 | — | pass | 129 |  |
| `backroomdoor` | w6/20 | — | pass | 365 |  |
| `backslot` | 1/14 | pass | pass | 42 |  |
| `backtobread` | w9/20 | — | pass | 106 |  |
| `barber` | 1/14 | pass | pass | 109 |  |
| `barberbox` | 2/14 | pass | pass | 81 |  |
| `barberchair` | 9/14 | pass | pass | 84 |  |
| `barberfee` | 10/14 | pass | pass | 85 |  |
| `barberway` | w20/20 | — | pass | 178 |  |
| `barter` | w6/20 | — | pass | 101 |  |
| `bear` | 1/14 | pass | pass | 46 |  |
| `beastfall` | 7/14 | pass | pass | 159 |  |
| `beastwall` | w6/20 | — | pass | 117 |  |
| `beat` | 4/14 | pass | pass | 101 |  |
| `bedaim` | 5/14 | pass | pass | 82 |  |
| `bedrollprompt` | 10/14 | pass | pass | 56 |  |
| `bellwords` | w7/20 | — | pass | 97 |  |
| `bellwreck` | 3/14 | pass | pass | 68 |  |
| `blacksail` | 6/14 | pass | pass | 154 |  |
| `bladehit` | 5/14 | pass | pass | 45 |  |
| `bladekey` | w6/20 | — | pass | 88 |  |
| `bladestone` | w20/20 | — | pass | 224 |  |
| `boardlines` | 4/14 | pass | pass | 59 |  |
| `bodies` | 3/14 | pass | red | 66 | 15 Nov weekly: red twice; filed in section I (producer), fixed since |
| `bornhere` | 4/14 | pass | pass | 64 |  |
| `bossbarunder` | 5/14 | pass | pass | 93 |  |
| `bowsway` | w13/20 | — | pass | 202 |  |
| `boxseed` | w7/20 | — | pass | 138 |  |
| `boxspots` | 5/14 | pass | pass | 99 |  |
| `brew` | w9/20 | — | pass | 110 |  |
| `bridgenames` | 2/14 | pass | pass | 104 |  |
| `bridges` | w1/20 | — | pass | 81 |  |
| `bronzehelm` | 7/14 | pass | pass | 28 |  |
| `budget` | w8/20 | — | pass | 450 | Killed at the 900 s cap alone at s1692 with four views; the field split off to `budgetfield`, Session 2360 |
| `budgetfield` | PR | — | pass | 420 | New, Session 2360 (the field west of Dunmore, from `budget`) |
| `budgetport` | w9/20 | — | pass | 421 |  |
| `buffstack` | 9/14 | pass | pass | 42 |  |
| `buildsite` | 8/14 | pass | pass | 102 |  |
| `burglary` | 6/14 | pass | pass | 146 |  |
| `butts` | PR | — | pass | | New since the weekly run of 15 Nov; green on its own pull request |
| `buyprice` | w11/20 | — | pass | 216 |  |
| `cairn` | w16/20 | — | pass | 179 | Red on the first try on 15 Nov, the retry cut at 150 min; green at s1677 and at s1805 (8/8, S2481) |
| `calendar` | 1/14 | pass | pass | 85 |  |
| `camps` | w11/20 | — | pass | 246 |  |
| `campsack` | 3/14 | pass | pass | 50 |  |
| `captainguard` | 4/14 | pass | pass | 65 |  |
| `caravan` | w15/20 | — | pass | 204 |  |
| `cargo` | 7/14 | pass | pass | 123 |  |
| `carraignight` | w9/20 | — | pass | 505 |  |
| `cavedoor` | 4/14 | pass | pass | 43 |  |
| `cellrace` | 3/14 | pass | pass | 85 |  |
| `chairstash` | w15/20 | — | pass | 243 |  |
| `challenge` | 5/14 | pass | pass | 37 |  |
| `chamerchant` | w3/20 | — | pass | 231 |  |
| `chapel` | 8/14 | pass | pass | 130 |  |
| `chasesight` | w14/20 | — | pass | 123 |  |
| `chestpicks` | w6/20 | — | pass | 170 |  |
| `churchhall` | w15/20 | — | pass | 434 |  |
| `churchname` | w4/20 | — | pass | 179 |  |
| `churchnames` | w6/20 | — | pass | 113 |  |
| `civicfurn` | 6/14 | pass | pass | 75 |  |
| `climate` | w19/20 | — | pass | 262 |  |
| `cloakbody` | 5/14 | pass | pass | 50 |  |
| `cloakcorpse` | w2/20 | — | pass | 177 |  |
| `cloakden` | w18/20 | — | pass | 395 |  |
| `cloakguild` | 1/14 | pass | pass | 44 |  |
| `cloaks` | w14/20 | — | pass | 126 |  |
| `coach` | 9/14 | pass | pass | 71 |  |
| `coachboard` | w10/20 | — | pass | 96 |  |
| `coachinn` | 9/14 | pass | pass | 146 |  |
| `coachseat` | 2/14 | pass | pass | 102 |  |
| `coachstop` | 8/14 | pass | pass | 100 |  |
| `coachvoice` | w20/20 | — | pass | 155 |  |
| `coldhearth` | 2/14 | pass | pass | 101 |  |
| `combatmusic` | 7/14 | pass | pass | 18 |  |
| `compactclaim` | w1/20 | — | pass | 109 |  |
| `compactrefit` | 8/14 | pass | pass | 229 |  |
| `constable` | 6/14 | pass | pass | 70 |  |
| `containerids` | w11/20 | — | pass | 178 |  |
| `cookfed` | w14/20 | — | pass | 108 |  |
| `cookkeep` | w5/20 | — | pass | 176 |  |
| `coopsaves` | 1/14 | pass | pass | 124 |  |
| `corpsebody` | w7/20 | — | pass | 124 |  |
| `corpseglow` | w3/20 | — | pass | 152 |  |
| `corruption` | w5/20 | — | pass | 497 |  |
| `corwinwalk` | w3/20 | — | pass | 526 |  |
| `counters` | 2/14 | pass | pass | 42 |  |
| `courthouse` | w17/20 | — | pass | 334 |  |
| `cowards` | w16/20 | — | pass | 239 |  |
| `crawler` | w8/20 | — | pass | 82 |  |
| `creator` | w5/20 | — | pass | 18 |  |
| `creatureao` | w5/20 | — | pass | 166 |  |
| `crime1` | w3/20 | — | pass | 228 |  |
| `crime2` | w12/20 | — | pass | 94 |  |
| `crime3` | w9/20 | — | pass | 105 |  |
| `crime4` | 6/14 | pass | pass | 47 |  |
| `crime5` | 2/14 | pass | pass | 66 |  |
| `crossbow` | w11/20 | — | pass | 181 |  |
| `crownclaim` | 6/14 | pass | pass | 70 |  |
| `dangertier` | w4/20 | — | pass | 252 |  |
| `datedguild` | 7/14 | pass | pass | 41 |  |
| `datedwork` | 1/14 | pass | pass | 42 |  |
| `dateline` | w14/20 | — | pass | 115 |  |
| `dayseed` | 8/14 | pass | red, then pass | 398 | Red twice in shard 8: `shrine null`, the same cause as `renewal` (`g.settle` gave up at 60 s). Fixed in Session 1006; 4 of 4 green in both looks since. |
| `dazed` | 2/14 | pass | pass | 90 |  |
| `deadkeys` | 10/14 | pass | pass | 113 |  |
| `deadtree` | 8/14 | pass | pass | 20 |  |
| `deathplace` | 10/14 | pass | pass | 56 |  |
| `deckprops` | w12/20 | — | pass | 88 |  |
| `demonickit` | 5/14 | pass | pass | 18 |  |
| `diedload` | w14/20 | — | pass | 92 |  |
| `dlgkeys` | 7/14 | pass | pass | 56 |  |
| `dmgnums` | 7/14 | pass | pass | 172 |  |
| `doorbed` | 5/14 | pass | pass | 149 |  |
| `doorids` | w3/20 | — | pass | 185 |  |
| `doublenames` | w17/20 | — | pass | 4 |  |
| `dragonsize` | w10/20 | — | red | 181 | Red twice in the weekly run of 15 Nov; filed in section I (producer), fixed since |
| `drownedbell` | w14/20 | — | pass | 73 |  |
| `drydoors` | 3/14 | pass | pass | 86 |  |
| `due` | 10/14 | pass | pass | 44 |  |
| `duel` | 4/14 | pass | pass | 59 |  |
| `duelrhythm` | w6/20 | — | pass | 140 |  |
| `dunconts` | w5/20 | — | pass | 303 |  |
| `dunfurn` | 8/14 | pass | pass | 170 |  |
| `dungeon` | 7/14 | pass | pass | 84 |  |
| `dungeonchase` | 3/14 | pass | pass | 47 |  |
| `dungeonexit` | 1/14 | pass | pass | 124 |  |
| `dungeonfoes` | w2/20 | — | pass | 206 |  |
| `dungeonpace` | 5/14 | pass | red | 54 | 15 Nov weekly: red twice; filed in section I (producer), fixed since |
| `dungeonscale` | w2/20 | — | pass | 218 |  |
| `dunseed` | 8/14 | pass | pass | 82 |  |
| `dunwarm` | 4/14 | pass | pass | 324 |  |
| `enchantmotes` | 8/14 | pass | pass | 49 |  |
| `errands` | w17/20 | — | pass | 141 |  |
| `export` | 1/14 | pass | pass | 51 | red alone at s1708 (the autosave's 20 s wait); fixed S2377, at Low, 410–420 s |
| `f10body` | w15/20 | — | pass | 448 |  |
| `f10hands` | w13/20 | — | pass | 173 |  |
| `f10motion` | w11/20 | — | pass | 180 |  |
| `f3land` | w2/20 | — | pass | 425 |  |
| `f4animals` | w15/20 | — | pass | 647 |  |
| `f4beasts` | w8/20 | — | pass | 460 |  |
| `f4bones` | w1/20 | — | pass | 376 |  |
| `f4dead` | w11/20 | — | pass | 630 |  |
| `f4foes` | w11/20 | — | pass | 517 |  |
| `f4gargoyles` | w10/20 | — | red | 607 | Red twice in the weekly run of 15 Nov; filed in section I (producer), fixed since |
| `f4goblins` | w20/20 | — | pass | 289 |  |
| `f4golems` | w8/20 | — | pass | 293 |  |
| `f4hags` | w5/20 | — | pass | 474 |  |
| `f4kids` | w6/20 | — | pass | 104 |  |
| `f4kobolds` | w8/20 | — | pass | 213 |  |
| `f4ogres` | w11/20 | — | pass | 560 |  |
| `f4people` | w12/20 | — | red | 683 | Red twice in the weekly run of 15 Nov; filed in section I (producer), fixed since |
| `f4sharks` | w2/20 | — | pass | 275 |  |
| `f4sleep` | w14/20 | — | pass | 209 |  |
| `f4slimes` | w6/20 | — | pass | 155 |  |
| `f4spiders` | w12/20 | — | pass | 283 |  |
| `f4trolls` | w13/20 | — | pass | 516 |  |
| `f4wolves` | w4/20 | — | pass | 635 |  |
| `f4wraiths` | w19/20 | — | pass | 337 |  |
| `factorpanel` | w3/20 | — | pass | 201 |  |
| `fairring` | new | — | pass | 262 | New since 15 Nov; 12/12 at s1805 (S2481) |
| `falls` | 9/14 | pass | red, then pass | 1707 | Its first try lost the page (*Target page … has been closed*) after five of eight drops, in the dungeon, in the half hour this container ran a third, stray run of the whole suite beside the two shards (six boots on four cores; the first try alone took ~1,490 s against CI's 219). The retry passed. Run alone after: see the line under the table. |
| `faolchu` | w20/20 | — | pass | 169 |  |
| `feasts` | w15/20 | — | pass | 179 |  |
| `feastsquare` | 5/14 | pass | red | 67 | 15 Nov weekly: red twice; filed in section I (producer), fixed since |
| `feaststalls` | new | — | pass | 393 | New since 15 Nov; 15/15 at s1805 (S2481) |
| `featurenames` | 8/14 | pass | pass | 12 |  |
| `feint` | w16/20 | — | pass | 156 |  |
| `felling` | w1/20 | — | pass | 98 |  |
| `ferry` | 1/14 | pass | pass | 57 |  |
| `fieldpatch` | w4/20 | — | pass | 188 |  |
| `fiercewolf` | 9/14 | pass | pass | 59 |  |
| `fishseed` | w4/20 | — | pass | 319 |  |
| `fistfight` | 8/14 | pass | pass | 143 |  |
| `fists` | 8/14 | pass | pass | 67 |  |
| `fistswing` | 10/14 | pass | pass | 148 |  |
| `flashshare` | w1/20 | — | pass | 120 |  |
| `fletch` | w19/20 | — | pass | 173 |  |
| `foearmour` | 5/14 | pass | pass | 43 |  |
| `foelogname` | 7/14 | pass | pass | 51 |  |
| `foereach` | w3/20 | — | pass | 132 |  |
| `foes` | 1/14 | pass | pass | 71 |  |
| `foeseed` | w20/20 | — | pass | 211 |  |
| `foewarm` | 5/14 | pass | **red** | 170 | Red twice (identical): *raising every foe kind compiles no shader and adds no program* read 2 compiles and one new program (41→42, 42→43) when every kind is raised and drawn; the prewarm itself ran (33 kinds, 17 programs). On 0.170 the prewarm (`prewarmFoes`, `js/42-zone-enemies.js`) leaves one foe program to be compiled on its first draw: the game's, filed in backlog I for the systems builder. **Fixed S988, S1267; red again on main since about S1364 (S1374 saw it at 819f6e4; weekly run 25 Oct; S1411 at ed26b39): 2 compiled, 1 program added, the creature kit's flat-shaded sword on the Goblin and the Skeleton, which the prewarm never builds; filed in I for the systems builder, S1411.** |
| `foeweapons` | w11/20 | — | pass | 18 |  |
| `footing` | new | — | pass | 431 | New, systems S2475–2477; 22/22 at s1805 (S2481) |
| `forge` | w6/20 | — | pass | 95 |  |
| `fortbarracks` | 10/14 | pass | pass | 101 |  |
| `fortcot` | 4/14 | pass | pass | 122 |  |
| `fortdoor` | w12/20 | — | pass | 171 |  |
| `fortfurn` | 3/14 | pass | pass | 110 |  |
| `forthall` | 8/14 | pass | pass | 92 |  |
| `fortify` | w3/20 | — | pass | 226 |  |
| `fortring` | w12/20 | — | pass | 142 |  |
| `fortunecaor` | 1/14 | pass | pass | 44 |  |
| `fortunecard` | 4/14 | pass | pass | 37 |  |
| `fortwalk` | 9/14 | pass | pass | 357 |  |
| `fphands` | 9/14 | pass | pass | 51 |  |
| `fpshield` | 3/14 | pass | pass | 47 |  |
| `fpweapons` | 4/14 | pass | pass | 50 |  |
| `furniture` | w1/20 | — | pass | 115 |  |
| `gait` | 3/14 | pass | pass | 73 |  |
| `gargoyle` | w9/20 | — | pass | 134 |  |
| `gateblade` | 1/14 | pass | pass | 54 |  |
| `gatedraws` | w17/20 | — | pass | 309 |  |
| `gateguards` | 5/14 | pass | pass | 159 |  |
| `gatekeep` | new | — | pass | 115 | New, systems S2469; 46/46 at s1805 (S2481) |
| `gatepath` | w11/20 | — | pass | 254 |  |
| `gatepockets` | w12/20 | — | pass | 120 |  |
| `gatesave` | w7/20 | — | pass | 241 |  |
| `gateschool` | 2/14 | pass | pass | 54 |  |
| `gatescript` | new | — | pass | 133 | New since 15 Nov; 12/12 at s1805 (S2481) |
| `gatesecrets` | new | — | pass | 135 | New since 15 Nov; 39/39 at s1805 (S2481) |
| `gatespaces` | w8/20 | — | pass | 140 |  |
| `gatethings` | w5/20 | — | pass | 280 |  |
| `ghoulface` | 1/14 | pass | pass | 20 |  |
| `ghoulwalk` | 6/14 | pass | pass | 9 |  |
| `gladeherbs` | w17/20 | — | pass | 93 |  |
| `goblinbody` | 5/14 | pass | pass | 10 |  |
| `goblins` | w12/20 | — | pass | 60 |  |
| `goldtier` | w12/20 | — | pass | 77 |  |
| `golem` | 10/14 | pass | pass | 60 |  |
| `guardarmour` | w4/20 | — | pass | 196 |  |
| `guardintro` | 6/14 | pass | pass | 47 |  |
| `guardlevel1` | w20/20 | — | pass | 143 |  |
| `guardplay` | 7/14 | pass | pass | 293 |  |
| `guardseed` | 6/14 | pass | pass | 47 |  |
| `guardsindoor` | 9/14 | pass | pass | 151 |  |
| `guardyield` | w11/20 | — | pass | 459 |  |
| `guildfurn` | 4/14 | pass | pass | 73 |  |
| `guildread` | w7/20 | — | pass | 99 |  |
| `handback` | 10/14 | pass | pass | 66 |  |
| `harbour` | 3/14 | pass | pass | 72 |  |
| `hearthcast` | 3/14 | pass | pass | 64 |  |
| `heavyblow` | w14/20 | — | pass | 135 |  |
| `helmhair` | 6/14 | pass | pass | 21 |  |
| `herbhidden` | 4/14 | pass | pass | 37 |  |
| `herbids` | 2/14 | pass | pass | 61 |  |
| `herbparity` | 7/14 | pass | pass | 50 |  |
| `herbstub` | w18/20 | — | pass | 268 |  |
| `hitseed` | 6/14 | pass | pass | 50 |  |
| `hoardmetal` | 2/14 | pass | pass | 49 |  |
| `hoardspot` | 5/14 | pass | pass | 81 |  |
| `hollow` | new | — | pass | | New, look S2473–2474; 10/10 at s1805 (S2481) |
| `homefurn` | w9/20 | — | pass | 182 |  |
| `homenames` | 8/14 | pass | pass | 119 |  |
| `homesleep` | w18/20 | — | pass | 294 |  |
| `honesttown` | 3/14 | pass | pass | 43 |  |
| `horselegs` | 10/14 | pass | pass | 17 |  |
| `hourhitch` | 5/14 | pass | **red** | 896 | Red twice in shard 5 under load: a worst frame of 12.6 and 13.8 s against noon's 2.8 and 2.2 s. **Classified, Session 992**: run alone, the new look is red twice at the same step, the jump to 21h, at 11.2 and 11.5 s, with 0 shaders compiled, 42 programs before and after, and the steps' median 3.2–3.5 s. The old look, alone in the same container, passed 3 of 3 (worst 3.0–7.2 s). The game's: filed in backlog I (*On the new look one jump of the clock stalls the frame for 11 s with nothing compiled*), for the systems builder or the F card that owns the new look. The suite now also logs each step's buffer and texture uploads. |
| `houseao` | w5/20 | — | pass | 258 |  |
| `housebuy` | 4/14 | pass | pass | 54 |  |
| `houseexits` | w4/20 | — | pass | 231 |  |
| `houses` | 6/14 | pass | pass | 58 |  |
| `hptail` | 2/14 | pass | pass | 65 |  |
| `hubregen` | 2/14 | pass | pass | 42 |  |
| `hubreturn` | 9/14 | pass | pass | 446 | 15 Nov weekly: red twice (the armour sub-tab's click, 30 s). The compile wait (S2336) came after the click that starts it: red twice here at s1805 with one boot beside it. Every click given the wait's 400 s bound (S2481): 2/2 beside another boot, 446 and 469 s |
| `hullbakes` | 7/14 | pass | pass | 62 |  |
| `hullshape` | 4/14 | pass | red | 46 | 15 Nov weekly: red twice; filed in section I (producer), fixed since |
| `huntvariant` | 7/14 | pass | pass | 43 |  |
| `icecave` | w15/20 | — | pass | 203 |  |
| `implements` | w12/20 | — | pass | 152 |  |
| `innrooms` | w3/20 | — | pass, 544 s beside another boot at s1805 | 591 | Failed then passed on the retry (a 60 s wait); section I, Session 2336. Shortened, Session 2369: one entry an inn, the nights asked inside. 10/10 at s1805 (S2481) |
| `innvoice` | 7/14 | pass | pass | 75 |  |
| `inspdungeons` | w17/20 | — | pass | 5 |  |
| `inspector` | w19/20 | — | pass | 43 |  |
| `inspplaces` | w6/20 | — | pass | 10 |  |
| `intaim` | 5/14 | pass | pass | 109 |  |
| `intdooraim` | w19/20 | — | pass | 749 |  |
| `intdoors` | w8/20 | — | pass | 124 |  |
| `interiors` | w20/20 | — | pass | 171 |  |
| `intnpcs` | w8/20 | — | pass | 112 |  |
| `intreach` | w17/20 | — | red | 750 | Red twice in the weekly run of 15 Nov; filed in section I (producer), fixed since |
| `investlacks` | 2/14 | pass | pass | 73 |  |
| `investwords` | 4/14 | pass | pass | 63 |  |
| `ironwork` | 2/14 | pass | pass | 89 |  |
| `jnecho` | 8/14 | pass | pass | 45 |  |
| `jnlinks` | 6/14 | pass | pass | 38 |  |
| `jobcount` | w18/20 | — | pass | 231 |  |
| `jobfoereload` | w6/20 | — | pass | 108 |  |
| `jobids` | w11/20 | — | pass | 167 |  |
| `jobseed` | 3/14 | pass | pass | 39 |  |
| `journal` | 7/14 | pass | pass | 164 |  |
| `keep` | 4/14 | pass | pass | 62 |  |
| `keepercone` | w11/20 | — | pass | 177 |  |
| `keeperwalk` | 1/14 | pass | pass | 640 |  |
| `kit` | w1/20 | — | pass | 120 |  |
| `kitalehall` | w4/20 | — | pass | 5 |  |
| `kitapothecary` | w16/20 | — | pass | 265 |  |
| `kitbawn` | w4/20 | — | pass | 206 |  |
| `kitcoachroom` | w1/20 | — | pass | 219 |  |
| `kitcottage` | w16/20 | — | pass | 553 |  |
| `kitfarm` | w12/20 | — | pass | 176 |  |
| `kitfarmhouse` | w16/20 | — | pass | 706 |  |
| `kitforge` | w9/20 | — | pass | 133 |  |
| `kitgods` | w19/20 | — | pass | 479 |  |
| `kitguild` | w2/20 | — | pass | 427 |  |
| `kitinn` | w19/20 | — | pass | 277 |  |
| `kitinnroom` | w8/20 | — | pass | 5 |  |
| `kitislands` | w6/20 | — | pass | 306 |  |
| `kitkeep` | w15/20 | — | pass | 5 |  |
| `kitlonghouse` | w18/20 | — | pass | 551 |  |
| `kitlots` | w17/20 | — | pass | 152 |  |
| `kitmarket` | w17/20 | — | pass | 162 |  |
| `kitmarktown` | w15/20 | — | pass | 499 |  |
| `kitmerchant` | PR | — | pass | | New since the weekly run of 15 Nov; green on its own pull request |
| `kittaproom` | w13/20 | — | pass | 560 |  |
| `kittavern` | w14/20 | — | pass | 5 |  |
| `kittown` | w19/20 | — | pass | 563 |  |
| `kittownhouse` | w12/20 | — | pass | 243 |  |
| `lairbrush` | w9/20 | — | pass | 118 |  |
| `lairdoor` | 6/14 | pass | pass | 81 |  |
| `lairgrade` | 8/14 | pass | pass | 51 |  |
| `lairhoard` | 1/14 | pass | pass | 70 |  |
| `lairload` | 9/14 | pass | pass | 65 |  |
| `lairmaster` | 4/14 | pass | red | 49 | 15 Nov weekly: red twice; filed in section I (producer), fixed since |
| `lairname` | 8/14 | pass | pass | 97 |  |
| `lairrumour` | 7/14 | pass | pass | 44 |  |
| `lairtheme` | 2/14 | pass | pass | 136 |  |
| `lampheld` | w20/20 | — | pass | 252 |  |
| `lastentry` | w16/20 | — | pass | 26 |  |
| `latesave` | w12/20 | — | pass | 167 |  |
| `ledgerplural` | 3/14 | pass | pass | 40 |  |
| `legacyfoes` | 2/14 | pass | pass | 46 |  |
| `legacyhalls` | 5/14 | pass | pass | 49 |  |
| `legacyshells` | 2/14 | pass | pass | 60 |  |
| `legacyshops` | 6/14 | pass | pass | 50 |  |
| `levelmarks` | w1/20 | — | pass | 99 |  |
| `levelpanel` | 3/14 | pass | pass | 42 |  |
| `limecave` | w1/20 | — | pass | 79 |  |
| `livepick` | 9/14 | pass | pass | 157 |  |
| `lockfair` | 8/14 | pass | pass | 80 |  |
| `lockon` | 4/14 | pass | pass | 121 |  |
| `lockpicks` | 1/14 | pass | pass | 85 |  |
| `locks` | 1/14 | pass | pass | 127 |  |
| `locksight` | 2/14 | pass | pass | 87 |  |
| `lockswitch` | 4/14 | pass | pass | 37 |  |
| `lod` | 10/14 | pass | pass | 426 |  |
| `looknew` | w17/20 | — | pass | 188 |  |
| `lookpair` | w1/20 | — | pass | 354 |  |
| `lootpicks` | 7/14 | pass | pass | 118 |  |
| `lootseed` | 4/14 | pass | pass | 65 |  |
| `lvact` | w18/20 | — | pass | 221 |  |
| `mainmarks` | 5/14 | pass | pass | 67 |  |
| `mainquest` | w16/20 | — | pass | 250 |  |
| `mainrun` | 4/14 | pass | pass | 614 |  |
| `makershermit` | w10/20 | — | pass | 140 |  |
| `makertools` | 9/14 | pass | pass | 63 |  |
| `makerwords` | 7/14 | pass | pass | 61 |  |
| `mantle` | w3/20 | — | pass | 227 |  |
| `mapnotes` | w3/20 | — | pass | 499 |  |
| `mapquests` | 9/14 | pass | pass | 46 |  |
| `mapseals` | 9/14 | pass | pass | 71 |  |
| `mapsharp` | 10/14 | pass | pass | 114 |  |
| `markapothecary` | w8/20 | — | pass | 146 |  |
| `markshort` | PR | — | pass | | New since the weekly run of 15 Nov; green on its own pull request |
| `marksmithy` | w4/20 | — | pass | 312 |  |
| `marktownshop` | PR | — | pass | | New since the weekly run of 15 Nov; green on its own pull request |
| `marktrader` | PR | — | pass | | New since the weekly run of 15 Nov; green on its own pull request |
| `markyard` | w18/20 | — | pass | 484 |  |
| `masterslam` | 8/14 | pass | pass | 65 |  |
| `metkey` | 6/14 | pass | pass | 62 |  |
| `mimic` | w13/20 | — | pass | 237 |  |
| `mimicspots` | w4/20 | — | pass | 346 |  |
| `mine` | w6/20 | — | pass | 95 |  |
| `moundsolid` | w2/20 | — | pass | 161 |  |
| `mushrooms` | 1/14 | pass | pass | 112 |  |
| `names` | 1/14 | pass | pass | 97 |  |
| `netclimb` | 3/14 | pass | pass | 55 |  |
| `netlook` | w6/20 | — | pass | 107 |  |
| `newelstair` | 3/14 | pass | pass | 65 |  |
| `nightpick` | w7/20 | — | pass | 125 |  |
| `noonring` | 8/14 | pass | pass | 59 |  |
| `oddfurn` | 6/14 | pass | pass | 49 |  |
| `ogre` | 10/14 | pass | pass | 50 |  |
| `oldsaves` | w3/20 | — | pass | 256 |  |
| `overcast` | w4/20 | — | pass | 171 |  |
| `packshape` | 3/14 | pass | pass | 64 |  |
| `padspawn` | w16/20 | — | pass | 489 | Failed then passed on the retry (0 chunk foes loaded); fixed S2336. 5/5 at s1805 twice, each beside another boot (S2481) |
| `panelfocus` | 2/14 | pass | pass | 437 | Red at the 900 s cap on 15 Oct with two shards sharing four cores (four 8 s `locator.click` timeouts in its panel walk); run alone on 16 Oct (Session 971's run) it passed in 437 s, inside CI's old-look 270–546 s. Load, not the look: no owner. |
| `parryclock` | 3/14 | pass | pass | 66 |  |
| `parrydeath` | 5/14 | pass | pass | 43 |  |
| `pauseleaf` | w7/20 | — | pass | 416 |  |
| `penance` | w13/20 | — | pass | 365 |  |
| `people` | 2/14 | pass | pass | 188 |  |
| `peopleao` | w3/20 | — | pass | 202 |  |
| `peoplewall` | w18/20 | — | pass | 560 |  |
| `perf` | w18/20 | — | pass | 408 |  |
| `perkarmour` | w16/20 | — | pass | 177 |  |
| `perkarms` | w2/20 | — | pass | 133 |  |
| `perkbody` | w12/20 | — | pass | 101 |  |
| `perkbow` | w14/20 | — | red | 234 | Red twice in the weekly run of 15 Nov; filed in section I (producer), fixed since |
| `perkcatch` | w18/20 | — | pass | 170 |  |
| `perkfall` | w18/20 | — | pass | 170 |  |
| `perkguard` | w19/20 | — | pass | 184 |  |
| `perkhand` | w5/20 | — | pass | 177 |  |
| `perkring` | w1/20 | — | pass | 95 |  |
| `perkthrow` | w5/20 | — | pass | 135 |  |
| `pickupids` | w14/20 | — | pass | 107 |  |
| `piratehold` | w16/20 | — | pass | 179 |  |
| `pirateram` | 7/14 | pass | pass | 68 |  |
| `placeload` | — | pass (S1280) | pass | 318 | split from `placesave`, Session 1280 (side by side with the other two) |
| `placenames` | w15/20 | — | pass | 179 |  |
| `placerooms` | — | pass (S1280) | pass | 470 | split from `placesave`, Session 1280 |
| `placerooms2` | w15/20 | — | pass | 874 |  |
| `placesave` | 3/14 | pass | pass | 361 | sections 1–2 only since Session 1280; skipped (too slow whole) until QA's pipeline PR strikes it |
| `plants` | 2/14 | pass | pass | 79 |  |
| `player` | w9/20 | — | pass | 157 |  |
| `poinames` | 8/14 | pass | pass | 43 |  |
| `poipreview` | w13/20 | — | pass | 169 |  |
| `pois` | w20/20 | — | pass | 117 |  |
| `portlane` | 1/14 | pass | pass | 222 |  |
| `posture` | w15/20 | — | pass | 174 |  |
| `posturefloor` | w19/20 | — | pass | 178 |  |
| `postureregen` | w13/20 | — | pass | 169 |  |
| `prices` | w6/20 | — | pass | 98 |  |
| `q7world` | 8/14 | pass | pass | 320 |  |
| `qsfresh` | w18/20 | — | pass | 169 |  |
| `qtybutton` | 2/14 | pass | pass | 76 |  |
| `quaynet` | 6/14 | pass | pass | 126 |  |
| `quaywall` | 10/14 | pass | pass | 116 |  |
| `questfoes` | 2/14 | pass | pass | 275 |  |
| `questgold` | w9/20 | — | pass | 116 |  |
| `questtargets` | 7/14 | pass | pass | 190 |  |
| `ragdoll` | 2/14 | pass | pass | 160 |  |
| `ragdollsearch` | 5/14 | pass | **red** (main, run 2337, failed twice) | 110 | Two the game's, one the suite's (Session 1254): the builder's cloak stands where a fallen Bandit stood (bodies builder, `js/32-people.js`); a corpse's bones are cached before its body attaches (systems builder, `bodyAimed`); the suite killed the foe before its body was on (fixed on `auto/wip-ragdollsearch`, lands with the cloak's fix). Backlog I. |
| `raisevarek` | 3/14 | pass | pass | 42 |  |
| `reachtable` | w3/20 | — | pass | 178 |  |
| `reader` | 8/14 | pass | pass | 257 |  |
| `register` | 2/14 | pass | pass | 70 |  |
| `renewal` | 7/14 | pass | red, then pass | 223 | Red twice in shard 7: it threw on `S.altar`, so the shrine was not built. It was also red alone in the old look. The cause was the harness: its own 60 s wait for the shrine, its cell's sixth site, which stood after 42 s with one boot. Fixed in Session 1006 (`g.settle` runs the job queue). The shrine then built in all 8 runs across both looks; 7 of 8 passed whole. One new-look run, six boots on four cores, hit the 900 s cap later, in its 40 real frames. |
| `resolver` | 9/14 | pass | pass | 58 |  |
| `restslip` | 5/14 | pass | pass | 49 |  |
| `ring` | w17/20 | — | pass | 93 |  |
| `ringtrial` | 7/14 | pass | pass | 81 |  |
| `riverquay` | w10/20 | — | pass | 146 |  |
| `rivers` | 8/14 | pass | pass | 78 |  |
| `riversail` | 1/14 | pass | pass | 62 |  |
| `roadfolk` | PR | — | pass | | New since the weekly run of 15 Nov; green on its own pull request |
| `roadseed` | 7/14 | pass | pass | 103 |  |
| `rocks` | 4/14 | pass | pass | 55 |  |
| `roll` | w10/20 | — | red | 215 | Red twice in the weekly run of 15 Nov; filed in section I (producer), fixed since |
| `rowebeats` | w5/20 | — | pass | 900 |  |
| `rowelines` | 17/20 (CI) | pass | pass, 544 s (was killed at 900 s twice on main, run 2337) | 544 | The suite's (Session 1254): its dialogue helper waited two rendered frames after opening and two after each click, 48 frames at about 14 s a frame in a town; it now waits for the choices, and one frame after the click. |
| `sackseed` | 9/14 | pass | pass | 36 |  |
| `sailtrim` | 5/14 | pass | pass | 57 |  |
| `saltwater` | 10/20 (CI) | pass | pass, 700 s (was killed at 900 s twice on main, run 2337) | 700 | The suite's (Session 1254): the last step jumped from Camuros back to Carrigshane with no `g.settle`, so the new ring of cells built on rendered frames (about 9.5 min); it now settles there as every other jump does. CI still killed it at 900 s on PR #561 (the runner about 1.5× slower), so the walk along the coast is its own suite, `corwinwalk` (227 s here); `saltwater` 389 s here after the split. |
| `savelabel` | 3/14 | pass | pass | 59 |  |
| `savepic` | 4/14 | pass | pass | 67 |  |
| `saveretry` | 6/14 | pass | pass | 56 |  |
| `saves` | 2/14 | pass | pass | 76 |  |
| `saveui` | 6/14 | pass | pass alone (red under load: the store's timer, section I) | 508 | 15 Nov weekly: red twice, each try killed at run.mjs's 900 s cap (772 s on 8 Nov). Shortened, Session 2350: at Low, 508 s alone, 13/13; 628 s beside a second boot, 9/13 (the store's 10 s timer behind a long frame, the systems builder's) |
| `scaleratio` | 6/14 | pass | pass | 292 | 15 Nov weekly: red twice (the Mark's c3_5_s6 had 3 storeys), fixed by the look builder; 15/15 here at s1805 (S2481) |
| `scalerooms` | w14/20 | — | pass | 183 |  |
| `schoolroster` | 6/14 | pass | pass | 154 |  |
| `scorpion` | 9/14 | pass | pass | 40 |  |
| `seacove` | w8/20 | — | flaky | 214 | FLAKY; fixed by Session 2271 |
| `seagrotto` | w7/20 | — | pass | 114 |  |
| `seahint` | 1/14 | pass | pass | 44 |  |
| `seaseed` | 8/14 | pass | pass | 51 |  |
| `seasonwx` | 2/14 | pass | pass | 37 |  |
| `seawear` | 10/14 | pass | pass | 87 |  |
| `secondary` | 4/14 | pass | pass | 46 |  |
| `selltopic` | 6/14 | pass | pass | 56 |  |
| `settingsheet` | w1/20 | — | pass | 363 |  |
| `seventhniche` | w19/20 | — | pass | 310 |  |
| `shark` | 2/14 | pass | pass | 43 |  |
| `sheath` | w19/20 | — | pass | 172 |  |
| `shelfbook` | w18/20 | — | pass | 322 |  |
| `shells` | 6/14 | pass | pass | 47 |  |
| `shipaim` | 6/14 | pass | pass | 44 |  |
| `shiparchers` | 4/14 | pass | pass | 47 |  |
| `shipballista` | w7/20 | — | pass | 101 |  |
| `shipdead` | 6/14 | pass | pass | 47 |  |
| `shiphull` | 8/14 | pass | pass | 58 |  |
| `shiphulls` | 4/14 | pass | pass | 40 |  |
| `shiplog` | 6/14 | pass | pass | 70 |  |
| `shipmoor` | w16/20 | — | pass | | Cut at 150 min in the weekly run of 15 Nov; green here at s1617, Session 2271 |
| `shipnames` | w10/20 | — | pass | 76 |  |
| `shipnets` | 9/14 | pass | pass | 60 |  |
| `ships` | 6/14 | pass | pass | 46 |  |
| `shipwreck` | 4/14 | pass | pass | 39 |  |
| `shipwright` | 6/14 | pass | pass | 107 |  |
| `shipwrightvoice` | w4/20 | — | pass | 164 |  |
| `shopback` | w7/20 | — | pass | 142 |  |
| `shoperrands` | 1/14 | pass | pass | 167 |  |
| `shopfurn` | w18/20 | — | pass | 351 |  |
| `shophours` | 1/14 | pass | pass | 105 |  |
| `shoprows` | 7/14 | pass | pass | 79 |  |
| `shopsight` | 10/14 | pass | pass | 268 |  |
| `shoreplaces` | 8/14 | pass | pass | 110 |  |
| `shoresave` | w11/20 | — | pass | 246 |  |
| `shrinenames` | w10/20 | — | pass | 108 |  |
| `shuttle` | 8/14 | pass | pass | 49 |  |
| `shuttleclaim` | 10/14 | pass | pass | 72 |  |
| `shuttletrial` | 3/14 | pass | pass | 80 |  |
| `siegeturn` | 7/14 | pass | pass | 88 |  |
| `sightline` | w20/20 | — | pass | 168 |  |
| `signposts` | 7/14 | pass | pass | 47 |  |
| `signs` | 2/14 | pass | pass | 62 |  |
| `sitechest` | 7/14 | pass | pass | 56 |  |
| `sitefoes` | 7/14 | pass | pass | 80 |  |
| `skillcurve` | w10/20 | — | pass | 121 |  |
| `skillsave` | w7/20 | — | pass | 107 |  |
| `skirtlegs` | w12/20 | — | pass | 7 |  |
| `slamdamage` | 3/14 | pass | pass | 143 |  |
| `sleeperpose` | w20/20 | — | pass | 214 |  |
| `sleeperreach` | 5/14 | pass | pass | 92 |  |
| `slimes` | w11/20 | — | pass | 230 |  |
| `slimeseed` | 8/14 | pass | pass | 74 |  |
| `slimesplit` | 5/14 | pass | pass | 45 |  |
| `slipdate` | 5/14 | pass | pass | 35 |  |
| `smoke` | 5/14 | pass | pass | 108 |  |
| `snowpine` | w14/20 | — | pass | 7 |  |
| `snowrepaint` | 1/14 | pass | pass | 68 |  |
| `speechprice` | w18/20 | — | pass | 167 |  |
| `spentblow` | 7/14 | pass | pass | 75 |  |
| `spentguard` | w17/20 | — | pass | 168 |  |
| `spiders` | 1/14 | pass | pass | 49 |  |
| `spirewatch` | w17/20 | — | pass | 186 |  |
| `stairrail` | w19/20 | — | pass | 716 |  |
| `standingcount` | w3/20 | — | pass | 166 |  |
| `stepup` | w7/20 | — | pass | 153 |  |
| `stolenstack` | w8/20 | — | pass | 122 |  |
| `stonecress` | 2/14 | pass | pass | 40 |  |
| `stonessay` | w20/20 | — | pass | 153 |  |
| `stowdeck` | 5/14 | pass | pass | 46 |  |
| `streetcone` | w15/20 | — | pass | 185 |  |
| `string` | w17/20 | — | pass | 102 |  |
| `swimdepth` | w18/20 | — | pass | 217 |  |
| `swingblade` | w13/20 | — | pass | 231 |  |
| `talkaim` | w5/20 | — | pass | 296 |  |
| `targetof` | 5/14 | pass | pass | 44 |  |
| `taskhomes` | 7/14 | pass | pass | 155 |  |
| `taverninn` | w7/20 | — | pass | 198 |  |
| `tells` | 2/14 | pass | pass | 40 |  |
| `theft` | w13/20 | — | pass | 213 |  |
| `theftlevel1` | w14/20 | — | pass | 114 |  |
| `thresholdname` | 4/14 | pass | pass | 60 | 15 Nov weekly: cut at 150 min mid-suite; green here at s1617, Session 2271 |
| `tiergrade` | w1/20 | — | pass | 115 |  |
| `tierkinds` | w14/20 | — | pass | 96 |  |
| `tierlevelfree` | w1/20 | — | pass | 141 |  |
| `tierloot` | w10/20 | — | pass | 74 |  |
| `tiermainpath` | w17/20 | — | pass | 100 |  |
| `tiermap` | w2/20 | — | pass | 115 |  |
| `tiertrap` | w4/20 | — | pass | 132 |  |
| `tithe` | w14/20 | — | pass | 96 |  |
| `told` | 10/14 | pass | pass | 113 |  |
| `toldpages` | w19/20 | — | pass | 177 |  |
| `topnames` | new | — | pass | 2 | No browser (S2452); in the smoke set since S2460; 3/3 at s1805 (S2481) |
| `touchrange` | w1/20 | — | pass | 119 |  |
| `towerhouse` | w2/20 | — | pass | 170 |  |
| `townbarrels` | 9/14 | pass | pass | 104 |  |
| `townbio` | w19/20 | — | pass | 269 |  |
| `towngate` | w4/20 | — | pass | | Cut at 150 min in the weekly run of 15 Nov; green here at s1617, Session 2271 |
| `townlocks` | 9/14 | pass | pass | 48 |  |
| `townplots` | w11/20 | — | pass | | Cut at 150 min in the weekly run of 15 Nov; green here at s1617, Session 2271 |
| `townroads` | 4/14 | pass | pass | 66 |  |
| `tpfists` | w7/20 | — | pass | 104 |  |
| `tpguard` | 5/14 | pass | pass | 45 |  |
| `tpshots` | 3/14 | pass | pass | 73 |  |
| `tpswing` | 6/14 | pass | pass | 54 |  |
| `tpweapons` | w13/20 | — | pass | 461 |  |
| `tradebits` | w10/20 | — | pass | 75 |  |
| `trapseed` | w–/20 | — | pass | | Cut at 150 min in the weekly run of 15 Nov; green here at s1617, Session 2271 |
| `trees` | 5/14 | pass | pass | 45 |  |
| `trolls` | 4/14 | pass | pass | 41 |  |
| `tunnel` | w–/20 | — | pass | | Cut at 150 min in the weekly run of 15 Nov; green here at s1617, Session 2271 |
| `turnin` | 7/14 | pass | pass | 67 |  |
| `twins` | 1/14 | pass | pass | 81 |  |
| `twinsrebuild` | 5/14 | pass | pass | 43 |  |
| `underclothes` | 10/14 | pass | pass | 40 |  |
| `unequip` | 3/14 | pass | pass | 41 |  |
| `unmake` | w15/20 | — | pass | 438 |  |
| `veins` | w15/20 | — | pass | 174 |  |
| `walls` | 10/14 | pass | pass | 67 |  |
| `wanderface` | w19/20 | — | pass | 230 |  |
| `wardall` | 9/14 | pass | pass | 41 |  |
| `wardswift` | 8/14 | pass | pass | 53 |  |
| `warehouse` | w1/20 | — | pass | 114 |  |
| `warwords` | 1/14 | pass | pass | 69 |  |
| `watch` | 8/14 | pass | pass | 104 |  |
| `waybands` | w13/20 | — | pass | 256 |  |
| `wayfinding` | 9/14 | pass | pass | 44 |  |
| `waylamp` | 1/14 | pass | pass | 112 | 15 Nov weekly: cut at 150 min mid-suite; green here at s1617, Session 2271 |
| `wayside` | w19/20 | — | pass | 670 |  |
| `wealth` | 7/14 | pass | pass | 82 |  |
| `weapons` | 8/14 | pass | pass | 60 |  |
| `weather` | w3/20 | — | pass | | Cut at 150 min in the weekly run of 15 Nov; green here at s1617, Session 2271 |
| `weaverdoor` | w8/20 | — | pass | 107 |  |
| `wholepoints` | 4/14 | pass | pass | 42 |  |
| `wildlife` | w2/20 | — | red | 387 | Red twice in the weekly run of 15 Nov; filed in section I (producer), fixed since |
| `wildseed` | w1/20 | — | pass | 86 |  |
| `windows` | 10/14 | pass | pass | 49 |  |
| `witness` | 7/14 | pass | pass | 120 |  |
| `witnessrange` | 1/14 | pass | pass | 68 |  |
| `wokennight` | 8/14 | pass | pass | 93 |  |
| `wolfcloak` | 6/14 | pass | pass | 69 | 15 Nov weekly: cut at 150 min mid-suite; green here at s1617, Session 2271 |
| `wolves` | 9/14 | pass | pass | 63 | Red on main by 29 Oct (d58449b): its two shadow-LOD checks read the old look (the eye drew the driver) and passed only while no kit body had been built yet. Re-measured to the new look's truth (the eye draws the kit's body, the shadow the driver's distant copy), test's, Session 1559; 2/2 |
| `wonders` | w17/20 | — | pass | 162 |  |
| `woodenkit` | 8/14 | pass | pass | 19 |  |
| `wordcarve` | w17/20 | — | pass | 223 |  |
| `wordforms` | w8/20 | — | pass | 139 |  |
| `wordguild` | w7/20 | — | pass | 93 |  |
| `wordsave` | w18/20 | — | pass | | Cut at 150 min in the weekly run of 15 Nov; green here at s1617, Session 2271 |
| `wordsteps` | w2/20 | — | pass | 381 |  |
| `wordtable` | w12/20 | — | pass | 3 |  |
| `worldjournal` | 3/14 | pass | pass | 48 |  |
| `worldloot` | 3/14 | pass | pass | 40 |  |
| `worldtarget` | w6/20 | — | pass | 117 |  |
| `wraithfloat` | 10/14 | pass | pass | 45 |  |
| `wraithhood` | 6/14 | pass | pass | 48 |  |
| `wreck` | w7/20 | — | pass | 163 |  |
| `wxplace` | w7/20 | — | pass | 201 |  |
| `wyrm` | w–/20 | — | pass | | Cut at 150 min in the weekly run of 15 Nov; green here at s1617, Session 2271 |
| `yardpanel` | w–/20 | — | pass | | Cut at 150 min in the weekly run of 15 Nov; green here at s1617, Session 2271 |
| `yardplay` | 10/14 | pass | pass | 368 |  |

Shards 1–4: 124 of 124 pass (panelfocus alone; shards 3 and 4 on 16 Oct 01:13–01:57 UTC, auto/qa at Session 971, main 148d635, two shards side by side, 44 min). Shards 5 and 6 (16 Oct 01:58–02:49 UTC, same build, side by side): 64 of 66 pass; `foewarm` red (the game's, filed), `hourhitch` red (owed alone). Shards 7 and 8 (16 Oct 12:54–13:53 UTC, main 6b8fbf9, side by side, 59 min): 65 of 67 pass. `renewal` and `dayseed` were red for the harness (`g.settle` gave up at 60 s) and pass since Session 1006. Shards 9 and 10 (18 Oct 00:59–02:05 UTC, main 5521ba1, side by side, Session 1090): 66 of 66 pass, 48 suites new to this ledger and 18 already
in it from an earlier shard (the shards reshuffle as suites are added; the 18 kept their first rows). Old look: main's CI run 39066602458 (c2e0352, 17 Oct), green.
`falls` lost its page on the first try and passed on the retry. For that run's first 30 minutes a stray third run of the whole suite, in the old look,
shared the four cores (six boots), and the try took about 1,490 s against CI's 219. Run alone afterwards (`--no-retry`), it passed 10 of 10 in about 7 minutes:
the load's, not the look's. Shards 11–14: owed. 202 of the suite's 459 files were not in this ledger before this session; 154 still are not.

**Every file, 17 Nov (Session 2336).** Since 20 Oct every CI run boots the new look, so the weekly full run is this ledger's run. The 322 files
not in it are added from the weekly run of 15 Nov (43717030831, main 91ca249, s1608; shard written `wN/20`), read from each shard's log: a
finished shard's summary, and for the eight cut shards each suite's start to the next's (a retry noted). The old-look column is `—` for them.
Of the 631 files: 584 passed there first try; 12 red twice in finished shards (filed by the producer, all since fixed or green); 4 red twice
in cut shards and never reported (`ashenburn`, `hubreturn`, `saveui`, `scaleratio`), 3 failed once in cut shards (`cairn`, `innrooms`,
`padspawn`) and `seacove` FLAKY; 8 were cut mid-suite and 13 never started (Session 2271 ran all 21 at s1617: green, `smoke` after its
fix); 6 are newer than the run and passed on their own pull requests (584 + 12 + 4 + 3 + 1 + 8 + 13 + 6 = 631). The seven unreported were run again on main at s1677: section I, Session 2336.
The 309 older rows keep their October results, with 15 Nov's written beside any that was not a first-try pass.

**Every file again, 21 Nov (Session 2481).** The eight suites newer than the ledger (`fairring`, `feaststalls`, `footing`, `gatekeep`,
`gatescript`, `gatesecrets`, `hollow`, `topnames`) and the six left red or owed after 15 Nov (`ashenburn`, `cairn`, `hubreturn`, `innrooms`,
`padspawn`, `scaleratio`) were run on main at s1805 (1455d75), two at a time on four cores. All fourteen are green; `hubreturn` only after its
clicks were given the compile's bound (S2481). The ledger now holds all 640 files. The rows still written red are 15 Nov's, fixed since by their owners; the weekly run of 22 Nov reads them again.
