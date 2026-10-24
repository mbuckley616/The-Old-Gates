# Daily digest

Written by the producer once a day, after 12:00 UTC. Newest last.

## 27 Sep 2026

**Landed on main since yesterday.** The crime system in four parts (town locks and strongboxes, witnesses and favour, guards, the Church and the factions; sessions 155–158). The look builder's prototypes up to session 165 (wolves, plants, boats). The systems builder's first six sessions (166–171): the night watch, indoor witnesses who need a line of sight, a theft fined 50 plus the goods with the cells taking the stolen gold, the town's price at the counter, lockpicks for sale, and the yield in the guard's own name. Also your design brief and the designer's skills-and-perks page. The build is s171.

**Waiting on you.** Nothing: all eight decisions are answered.

**Waiting to merge.** Systems session 172 (one name per shop, inn and keeper in a town) and the look builder's sessions 166–184 (wolves, plants, ships, spider, boar, bandits, skeleton, the risen dead, wraith, dragon, goblins and kobolds in the game; a house prototype). Each merges cleanly onto main and CI is running on both. They collide only on the build tag, one backlog line and the devlog, so systems goes first and the look branch takes main after.

**Blocked.** Nothing. The two builders' duplicated section-I fixes were reconciled on the look branch at 19:33 UTC, keeping main's versions.

**Critic.** The night was free: two guards, nobody near the shops, 868 gold in one night. The watch that answers it is on main.

**Designer.** Skills and perks answered (Morrowind's book, mindful of Oblivion Remastered's levelling); combat is next.

**Quest writer, concept artist.** First runs tonight (21:00 and 03:00 UTC).

## 28 Sep 2026

**Landed on main since yesterday.** The systems builder's sessions 172–175: one name per shop, inn and keeper in a town; attributes a small buff on damage (1% a point); fists, with every slot allowed to be empty; shots leaving from the hands in third person. Also the concept artist's parchment interface page and your answers on the last box creatures, the caravan attack and the weapon kit. The build is s175.

**Waiting on you.** Twelve decisions: the rocks, the road coach and the shark, the first-person weapon, the picked herb, cloaks and hair, shading in the townsfolk's creases, the third-person swings, wealth in clothes (all look prototypes), coach tickets, how Ashenmoor burns in Q7, the Compact's tithe and the League's duels, and combat.

**Waiting to merge.** The look branch (93 commits, sessions to 254, build s236) merges cleanly; its CI is running now. It goes first: it brings the six-shard CI the others need. The systems branch (sessions to 245) then needs main merged in; it conflicts with the look branch in the code and the docs. The critic, designer and quest writer branches are docs only.

**Blocked.** Nothing open.

**Critic.** Portclare and Dunmore at s175: shop signs name the wrong keeper, a night guard sticks behind Clodagh's Goods, an unwalled town has no guard by day, and keepers and guards still share names.

**Designer.** Combat: tightened, Elden Ring's, or directional; recommends B.

**Quest writer.** First run: three dialogue findings on main and a draft, The Seventh Niche.

**Concept artist.** The parchment interface page, nine screens; you chose A.

**Roadmap.** 79 of 120 stories done; this week the look branch put the bridges, walls, harbour, fort, signposts and camps on the kit, and the systems branch made saves and towns survive a rebuild.

## 29 Sep 2026

**Landed on main since yesterday.** Nothing yet — main still sits at build s253 (8c0d74a), unchanged since yesterday's digest; six branches are queued to merge.

**Waiting on you.** One decision: what Fortune's "+1% loot quality" card line actually does (issue #64).

**Waiting to merge.** auto/backlog (Sessions 333–337: interior shells and chimney smoke prototypes, the black sail's flag) is approved and CI green — Claude merges it first. auto/producer, auto/critic, auto/quests, auto/concept and auto/design are all docs-only and green. auto/systems (Sessions 176–341: the Boon of Renewal, Charisma's barter, quest-gold and buff-stacking fixes) just pushed a new head; CI is running.

**Blocked.** Nothing beyond ordinary CI waits.

**Critic.** Five findings from 40 minutes on main: the coach's wrong boarding line, the mayor's stale investment offers, no autosave in the open world, a missed bedroll prompt, and one bug already fixed upstream.

**Designer.** Magic's shape answered (B, words of the deep tongue); folding in Michael's note for a main-quest sigil questline next.

**Quest writer.** Reviewed ~110 new strings; drafted The Shrines Remember (third-prayer boons).

**Concept artist.** Furniture inside homes and inns, built from the kit — draw calls cut by more than half in both.

**Roadmap.** Roughly 116 of 150 stories done, most of them this week. Combat and equipment moved the most (the Boon of Renewal and Charisma's barter both built); look and feel gained two fresh decisions (interior shells, chimney smoke) ready to build.

## 30 Sep 2026

**Landed on main since yesterday.** auto/critic at 2df57a3 as 3651f82 (the arrows/resale money-loop fix, s321); auto/backlog at 4ab9a6c as 2c18a2b (look sessions 275–343: church/keep hall shells, forts smoking, chimney smoke by hearth hours, sails trimmed to a wind, town gate, 43 decisions built in). Michael also pushed two CI/settings fixes and the split-plan doc straight to main.

**Waiting on you.** One decision: does `join.py` (the split tooling's way back to one file) stay in the repo once switch-over day passes? A, keep it one release then drop it, recommended.

**Merging.** auto/producer's own green docs head (362226a) queued; its next edit (adb8564, this run's queue write) queues in turn.

**Done.** Wrote four of Michael's answers to decisions.md (Hesket Rowe, the spellmaking page, survival & alchemy, the strongbox sight cone) and closed their issues; queued and landed auto/critic and auto/backlog; opened a decision card and Slack post for the split branch's join.py question; corrected the roadmap's split epic (the freeze/merge step was wrongly marked done) and closed out look-and-feel (53/53 stories) as the first fully-done epic.

**Team.** Systems builder — Session 368 built the strongbox facing-cone fix (Michael's B, issue #73), merged main, CI running on the new head. Look builder — section H has no item left, standing down until a new look item lands. Fable — opened PR #74, backlog K step 1 (split.py/join.py tooling), CI running.

**Blocked.** Nothing beyond ordinary CI waits (auto/systems and auto/split both mid-run).

**Roadmap.** 128 of 160 stories done, up from roughly 116 three days ago. Look and feel (H) is the first epic to close in full.

## 1 Oct 2026

**Waiting on you.** Approve auto/backlog (PR #82: first-person fist, bare body, guard armour by town wealth, armour-kit build; CI green 9/9) and auto/systems (PR #84: the duel-below-level-5 fix, keepers routing round shop counters; CI 8/9, one re-run in progress).

**Landed on main since yesterday.** The split cutover — index.html into 33 js/ files, build s342 (7733a5b); quest writer run 4, dialogue review and The Spire Held draft (35998f1); the sailing wear-and-mend design proposal (1c541f5); concept's furniture-in-interiors (ab042f9); the critic's s342 report and producer housekeeping (e82fd23).

**Merging.** Nothing queued.

**Done.** Wrote Michael's six answers (the fist, bare body, guard armour, sailing, cargo trading, trackpad lock-on) to decisions.md, closed issues #80/83/85/87/88/89, replied in each Slack thread; confirmed auto/backlog green 9/9 and auto/systems 8/9 (one re-run on a timing-flake-looking failure unrelated to its diff); closed out the critic-fixes epic, 24/24; no STUCK issues, nothing new for the inbox.

**Team.** Look builder — Session 388, a CI fix only (snowrepaint's cost check, q7world's timeout). Systems builder — Sessions 386–387, the duel and the keeper-counter fixes; the producer merged main into the branch after it went unmergeable.

**Blocked.** Nothing beyond ordinary CI waits.

**Roadmap.** The critic-fixes epic closed in full, the second after look and feel. Roughly 155 of 175 stories done, up from 128 of 160 three days ago.

## 2 Oct 2026

**Waiting on you.** Nothing today. Both code branches are green but conflict with main in two docs files; their builders merge main next run, then each card turns ready for your Approve.

**Landed on main since yesterday.** Systems sessions 382–401 (9b6232d): the punch lands, duel and counter fixes and more. Look sessions 394–410 (d7ba1c7). The merge queue retired; the producer now merges through GitHub (a5875da). Concept's counter and chest on the parchment (6edf854). Quest writer run 5 and its draft, Back to Their Bread (f507988). The designer's platforming page (311d9a8). The critic's s360 report (4bbc887). Build s360.

**Answered.** Platforming B (hand-built jump, mantle and falls first, then generated places) and the beasts' deaths C (a ragdoll on the wolf's joints), both written to decisions.md.

**Team.** Systems builder: Sessions 423–426, the duel test on fixed ticks, inn keepers' room directions, the priest's tithe, three of the critic's bugs. Look builder: Sessions 414–422, the unarmed guard, ragdoll deaths, the beasts' prototype.

**Blocked.** Nothing beyond the docs conflicts above.

**Roadmap.** 147 of 193 stories done; five new stories under way on auto/systems (inn rooms, tithe, three critic fixes).

## 3 Oct 2026

**Waiting on you.** Start the Fable card "Keep the door open for co-op: two saves and the rules" on the control room (your A on online play). Systems sessions 431–448 return for one more tap after the systems builder merges main this morning.

**Landed on main since yesterday.** Systems sessions 404–429 (8ca3e23): fall damage, the duel and counter fixes, the priest's tithe. The Fable rivers, 430–433 (df59d46): ranges ringed round basin lakes, named rivers, sixteen a ship can sail, quays. Look sessions 414–435 (f823295): the unarmed body in third person, ragdoll deaths for foes, wolves, boars and bears. Docs: the books-and-notices concept, the online-play page, quest writer run 6, the critic's river-quay playtest. Build s372.

**Answered.** Online play A (the door kept open, nothing networked) and the lake-locked places A (moved to the shore); both written to decisions.md.

**Blocked.** Your approval of Systems 431–448 (f73ff2d) no longer merges after the look sessions landed: one test line both builders edited. The systems builder merges main next run.

**Team.** Systems builder: the 43 places to the shore next. Look builder: nothing left in H. Critic: a storm crossing under sail.

**Roadmap.** 165 of 196 stories done (161 yesterday); ragdolls and the unarmed body closed, online play answered, one new story for the lake places.

## 4 Oct 2026

**Waiting on you.** Three decisions: unblock main (A, the builders make the slow tests wait), an exhausted power attack breaking a guard (A, it doesn't), and the journal and calendar (B, a calendar the world keeps). One Fable card to start: break up 80-world.js. Both builders are waiting on it for the co-op ids.

**Landed on main since yesterday.** Fable 456, the co-op door (6c9e3da): every save is two rows, character and world, with a World export. Look 453 (tests only). Quest writer run 7, the journal-and-calendar page, the creator question. The build is s374.

**Blocked.** Main's CI has been red four runs running on tests that wait a fixed time. Systems 431–475 (93c73b6) carry the fixes, and their CI is running now; if green, the card comes back for one more tap. Your approval of 3f64ae8 no longer merges. Look 466, 469 are red on a third such test, export. The look builder takes it next run.

**Team.** Systems builder: seeded loot rolls, and the critic's three bugs fixed (a bought ship faces the sea, saves name their place). Look builder: nothing left in H. Critic: raise a sunk ship, then the ram.

**Roadmap.** 167 of 197 stories done (165 yesterday). Two stories waiting on you: the calendar and the spent guard break.

## 5 Oct 2026

**Waiting on you.** Five decisions: the calendar's era (A, years of the Peace), capes and cloaks (B, one small virtue each), the barber's fee (A, an inn room's price), the dragon's size (B, 4.5), and unblocking the design proposal (A, merge it). Two merges: Look sessions 512–529 and Systems sessions 485–511.

**Landed on main since yesterday.** Systems 431–483 (d8ad150). Look 466–483. The Fable world-file split, 484 (3c0d9f1): the world in nine files. The mesh inspector, 492–494. Look 505–506, the barber prototype (ad6cd24). The rest-and-rising concept, quest writer run 8, two critic playtests. Build s418.

**Answered.** Rest and rising A, the barber and dyer B, unblock main A.

**Blocked.** Main's CI is red on 7835cfd, a docs-only merge, on one test (sailtrim); its one re-run is going. The newer Systems head (513–533) is still in CI.

**Team.** Systems builder: waits on the calendar's names and the fee. Look builder: the ghoul's limp, hands on held weapons, the goblin. Critic: the town barrels, raising a sunk ship.

**Roadmap.** 174 of 215 stories done (167 yesterday); your inspector notes and the spent guard break are under way; four stories wait on you.

## 6 Oct 2026

**Waiting on you.** Five decisions: unblock main's red CI (A, treat interiors and yardplay as flakes), unique artifacts (B, the Makers' six tools), the dungeon's stairs (A, stone newel), the dungeon's passages, and the forts' interiors. Two merges: Look sessions 534–589 and Systems sessions 564–580.

**Landed on main since yesterday.** Systems 485–563 (e425d1d). The Journal concept prototypes. Quest writer run 9, First Words drafted. The critic's Giving in Coeur de Vie (s455). The unique-artifacts proposal. Build s455.

**Answered.** The old gates' look A, the swinging blades A, two houses of one name A; all three built overnight.

**Blocked.** Main's CI is red on 3152db7, a docs-only merge (yardplay); the decision above settles it. Systems 585–595 are still in CI.

**Team.** Systems builder: the critic's five s455 bugs and far quest marks done; next, yardplay. Look builder: waits on the stairs, passages and forts. Critic: the Giving walks to the gate, a proposal.

**Roadmap.** 176 of 226 stories done (175 yesterday on the larger count); the world map's sharpness and quest marks are under way; five stories wait on you.

## 7 Oct 2026

**Waiting on you.** Five decisions: the wolves and the cave bear (A, all of it), foes' chase speed and sight (A), lockpicks as loot (A), the ship in hand's dial (B, two new hulls), and unblock the design docs (A, merge anyway, docs only).

**Landed on main since yesterday.** Look sessions 534–589 and 598–611 (build s476): the stone newel stair, three new fort shapes, fort furniture solid only on its own floor. The wolf-and-bear prototype. Quest writer run 10, the Makers' Things. The critic's three forts (s476). The unique-artifacts proposal and the Giving playtest.

**Blocked.** Systems 564–628: the approved b37e86b no longer merges; the builder's new head 66dfbe1 is in CI and needs main merged in (backlog.md only). Main's CI went red on shard 1 (lod) after a docs-only merge; one re-run is going.

**Team.** Systems builder: the critic's s476 bugs fixed (S624–628); next, chase and lockpicks once answered. Look builder: the wolves on your answer; the Crypt's mound. Critic: a lair next.

**Roadmap.** 185 of 239 stories done (176 of 226 yesterday); three critic bugs under way on auto/systems; four stories wait on you.

## 8 Oct 2026

**Waiting on you.** Two decisions: the cutter's and the caravel's own hulls (#202, A recommended) and wolves staggered by every second greatclub swing (#206, A: raise the posture floor to 18). One merge: Look sessions 643–647, which fixes the two tests that kept every branch red.

**Landed on main since yesterday.** Look session 632 (build s477): the wolves' fiercer face and new sizes, the cave bear. Quest writer run 11, the Makers' Things second run. The critic's guild commission at Vieux Marché. The HUD and save-register concepts, with your answers on #198 (A) and #199 (B). Main's CI is green again on ba12f5b.

**Blocked.** Systems 564–655: four runs in a row were cut off at GitHub's 60-minute limit; the builder split CI into twelve shards (S652) and the new head 7c53d67 is in CI now. A fresh card goes up when it is green.

**Team.** Systems builder: the critic's four s477 bugs fixed (S648–651), a picture in each save, Told filed by person and place; next, the posture floor on your answer. Look builder: the hulls on your answer, then nets and stowage once systems lands. Critic: a lair next.

**Roadmap.** 186 of 247 stories done (185 of 239 yesterday); four critic bugs under way on auto/systems; two stories wait on you.

## 9 Oct 2026

**Waiting on you.** Four decisions: the pause menu on Esc (#208, B: the leaf plus a challenge setting), the war hammer's one-swing stagger (#211, A: raise the floor to 19), what guards the Root (#214, A: the Empty Weaver) and handing a guild task back (#217, A: a no-cost topic). One merge: Look sessions 665–668, the Mark's cutter and Aurenne's caravel on hulls of their own (c4b51b5, CI green).

**Landed on main since yesterday.** Look sessions 643–661 (fc16622). The pause-menu concept (#209). Quest writer run 12, the Root's six rooms. The critic's Mages' Guild at Ironhaven (s480). Main's CI is green on 59e2555.

**Blocked.** Systems 564–675: red on 7b76cf8, where thresholdname and stairrail still fail and the new deathplace test fails too; the builder's next run (about 09:00) owns the fix, then a fresh card goes up.

**Team.** Systems builder: the critic's four s480 guild bugs fixed same day (S672–675); next, the three red tests. Look builder: the hulls wait on you; nets and stowage after systems lands. Critic: a lair next.

**Roadmap.** 186 of 252 stories done (186 of 247 yesterday); four new critic bugs under way on auto/systems; two stories wait on you.

## 10 Oct 2026

**Waiting on you.** Three decisions: the world map sharp at every zoom with your quests on it (#220, A: numbered seals), witnesses in the street (#222, B: guards see all round, townsfolk by their cone) and what a lair cavern's master is (#225, A: the lair's own beast). Two merges: Systems sessions 564–692 (996368b, CI green) and Look sessions 676–687, the hearth that goes cold until the Mages' task is done (9ef5a55, CI green).

**Landed on main since yesterday.** Look sessions 665–668, the cutter's and caravel's own hulls (c4b51b5). Your answers on #208, #211, #214 and #217. The world-map concept (#221). Quest writer run 13, Asked in Passing and Findings 21–24 (#223). The critic's lair playtest at Carrigowen (#224). Main's CI is green on 7c81b8e.

**Blocked.** Nothing. The look branch's newest head (e1627df, the pause leaf on Esc) lost one shard to the hour limit; re-run this morning.

**Team.** Systems builder: seven of the critic's eight lair bugs fixed (S694–701), CI running; next the master's body after #225. Look builder: the pause leaf and its settings sheet. Critic: the cavern door 46 units out is still open.

**Roadmap.** 187 of 260 stories done (186 of 252 yesterday); seven new lair stories, six under way on auto/systems, one waiting on you.

## 11 Oct 2026

**Waiting on you.** Three decisions: Portclare's cut to the quay (#236, A: a dry-stone wall), the climb up a boarding net (#237, A: hand over hand), a householder at night (#240, A: asleep in bed 23h–5h). Two merges: Look sessions 704–731, the world map sharp with your work on it as seals (48a0d2f, CI green), and Systems sessions 728–730, how a town really is, in each people's voice (735aef9, CI green).

**Landed on main since yesterday.** Look sessions 676–693 (dc7b2d9). Systems sessions 564–722: witnesses by their cone, a lair's own beast as master, hoard metals by tier, the doubled glade, the lock's 150 ms floor (a2f4144). CI in twelve shards, so main's check finishes inside the hour (64edef4). Quest writer run 14, six more errands and Findings 25–27 (#235). Main's CI is green on a2f4144.

**Blocked.** Nothing on you. The systems branch's newest head (d43c4ae, Sessions 732–734) is red on its own new boss-bar test; the systems builder's next run. The critic's and concept artist's docs PRs wait on Systems 728–730, which fixes the test that keeps them red.

**Team.** Systems builder: four of the critic's five burglary bugs fixed (S732–734), the fifth waits on #240. Look builder: the quay wall and the net climb after your answers. Critic: a Cave Bear's master at level 1 is a wall, not a step up.

**Roadmap.** 219 of 272 stories done (187 of 260 yesterday); five new burglary stories, three under way, one waiting on you.

## 12 Oct 2026

**Waiting on you.** One decision: the gates by school, which foes each school's gate holds (#252, A: the canon's table with a level-1 foe in each). One merge: Look sessions 743–752, the climb up the boarding net, Portclare's dry-stone wall to the quay, a sleeper on their side under the quilt (6978ab3, CI green, merges cleanly).

**Landed on main since yesterday.** Look sessions 704–731, the world map sharp with your work on it as seals (dba88d8). Systems sessions 728–748, the burglary fixes, two gate guards, a lair left as it is (64a92af). Your answers to #243 and #245 (PR #246). The world's tone into the canon and the brief (Sessions 750–751); the gates by school, your A (Session 754). Quest writer run 15, Under Another Flag (#248). The critic's s585 playtest (PR #251). Main's CI is green on 3865c13, build s585, after one re-run.

**Blocked.** Nothing on you. Systems sessions 753–760 (twice the barrels, the war's notices, one name per place, a bought ship by the quay's net, occupied gates): CI running on e8949eb; its card goes up once green.

**Team.** Systems builder: the schools' rosters after #252. Look builder: the death screen as a leaf after #243 and its ragdoll. Quest writer: a line for a householder woken at night.

**Roadmap.** 225 of 279 stories done (219 of 272 yesterday); new: the death screen, twice the barrels, the gates by school.

## 13 Oct 2026

**Waiting on you.** Two decisions: shrines remembering, how many boons you keep for good (#267, A: one kept boon); unblock the critic's report PR #268 (A: merge anyway; a game test fails on a name clash, not on the report). One merge: Systems sessions 776–796, the Makers' six tools with their trials' frame, words and claimants (a409e2c, CI green, merges cleanly).

**Landed on main since yesterday.** Look sessions 743–752: the climb up the boarding net, Portclare's dry-stone wall, a sleeper on their side (ca4dbaf). Systems sessions 753–766: twice the barrels, one name per place, a bought ship by the quay, the gates by school (c66473e). Systems session 770: a sleeper's prompt and night line (98b1d86). Quest writer run 16, the Aurennais register (#265). Main's CI is green on c932e49, build s597.

**Blocked.** The critic's PR #268 (decision above). `poinames` finds two places named Border Road Bridge; filed for the systems builder.

**Team.** Systems builder: Sessions 797–798 (the Shuttle's trial, a sleeper's reach) with CI running; the other trials wait on their props. Look builder: the trials' five props and Droichead's two barrels in walls. Critic: a ship alongside the quay next.

**Roadmap.** 230 of 283 stories done (225 of 279 yesterday); new: a sleeper's reach, barrels in walls, the name clash, shrines remembering.

## 14 Oct 2026

**Waiting on you.** One decision: unblock Look sessions (A: merge b7067e4, Look 821–860, instead of the approved 9bc8062, which no longer merges after the bodies branch landed its own copies of 14 builder files). All ten of this morning's questions are answered and written down.

**Landed on main since yesterday.** F1, the renderer: three.js 0.170 behind a switch (Session 822, e7e07df). Look 804–820 (#279). Systems 776–796, the Makers' six tools, and 797–814, seventeen steadied tests (d020009). The CI retry (#271). The 2.0 scope and team (#290, #291). Concept art rounds 2 and 3. Quest writer run 17, the knot at the ring. The F2b build sheet. Bodies 839–856, prototypes. The critic on the new look. QA's flaky ledger. Build s627.

**Answered this morning.** #292 A the knot; #294 C domes by rank; #295 A merlons; #296 A pointed caps; #298 A the trials' set; #300 C 3 m cells, the Old Gates vast; #303 A rooms in the shell; #305 A the mine; #306 A the sloop; systems CI A.

**Blocked.** F2a waits on Systems 827–832 (CI now running on be20097) and the look branch. Main's shard 6 (lookpair) stays red until Systems 830 lands.

**Roadmap.** 239 of 303 stories done (230 of 283 yesterday); 2.0's new look has 1 of 15 cards done, F6, F8, F9 and F11 under way as prototypes.

## 15 Oct 2026

**Waiting on you.** Approve F2a, the scale pass (PR #315 at e82ad5c, CI green, merges cleanly; it ends the builders' freeze #297). Four decisions: #339 the sea grotto's ways in, #342 how fast the level comes, #345 the round tower's door, #347 whose rig on a hull in another island's dress.

**Landed on main since yesterday.** Systems 827–832, five steadied tests (63d1506). Look 821–924, prototypes only: Aurenne's buildings, the mine, the sloop, the grotto, the abbey, the cutter and caravel in each island's dress (#284, #340). Bodies prototypes (the frost bear and more of the creature kit; 925–928, the trolls and slimes, land when CI finishes). QA's sessions (#310, #317, #334, #344). The F2b build sheet, concept round 3, quest drafts, the critic on the Makers' things (three bugs filed in I). Build s632.

**Blocked.** Nothing open. The builders work in prototypes until F2a lands.

**Roadmap.** 239 of 303 stories done (unchanged since yesterday); 2.0's new look has 1 of 15 cards done, F2a in review, F6, F8, F9 and F11 under way as prototypes. The skills build sheet is written (#342).

## 16 Oct 2026

**Waiting on you.** Approve three: Combat's resolver (PR #356, f1976a3), Quest builds 979 (the Seventh Niche, 8417f89), Systems sessions 940–975 (skills by use and the first perks, e360f8f). Four decisions: #369 Steady's aim sway, #370 a cap on speed in the air, #373 enemies by place, #376 three perks whose rules the game lacks.

**Landed on main since yesterday.** F2a, the scale pass (3a18a10): one unit a metre, people the measure; the builders' freeze ended. Look 925–999, prototypes only: the shepherd's hut, the hunting cabin, the logging camp and more of the places off the road (#350, #358, #368, #372, #375). Bodies prototypes (#349). QA's sessions (#351, #360, #365). The double-jump build sheet (#371), quest review run, concept round, the critic. Build s639.

**Blocked.** Nothing. Systems 978–1002 had a backlog clash with main, resolved this morning; CI runs on 7378602 and the card moves to it when green.

**Roadmap.** 240 of 303 stories done (239 yesterday); 2.0's new look 2 of 15 cards done (F1, F2a); the core loop's resolver and skills both wait on your approval.

## 17 Oct 2026

**Waiting on you.** Approve one: Quest builds 979–1030 (the Seventh Niche and Back to Their Bread in the game, 4f25ccc, green). Two decisions: #394 does the loot follow the place too (A, the tier sets the metal); #396 the Gatelands' towns, lots to the house's size or houses to the lot's (A, lots to the house, new look only).

**Landed on main since yesterday.** Combat's resolver (60d7423): the attack table and one resolver. Look prototypes: places off the road for F8 (the shepherd's hut, the hunting cabin, the falls, the merchants' halt and more) and all five ship classes in three dresses. Bodies prototypes: the griffin, the gargoyles, the Aurennais' and Gatelanders' dress. QA's fixes to skillcurve, q7world and penance (d1ce93d). The loot-by-place build sheet, quest writer and critic runs. Build s666.

**Blocked.** Systems 940–1050 (skills by use, the first perks, the double jump, enemies by place, F2b's reach): the approved bf251d1 loses the Caer Slige rematch; CI runs on 1ae8a6b, and the builder still owes QA's skillcurve fix. Look 1031–1046 waits on Systems for a shrine-name fix. F3 waits for Systems to land.

**Roadmap.** 241 of 303 stories done (240 yesterday); 2.0's new look 2 of 15 cards done, F2b now under way; the core loop's resolver done, skills, enemies by place and the double jump under way.

## 18 Oct 2026

**Waiting on you.** Approve one: Quest builds 1092 (What the Stones Say, three lore books on the sigils, d7219d6, green). Three decisions: #422 how many carvings the main quest walks you to (A, nine); #429 the Weavers' ring of arches (A, 44 m and the script dead); #430 the foes' heavy attacks (A, one blow in four, a red glow). #431, gold piles by place, comes next run.

**Landed on main since yesterday.** Look sessions 1031–1053 (c2e0352). Quest builds 979–1030: the Seventh Niche and Back to Their Bread (9d3e2ba). Bodies sessions 1058–1092 (35b0027). The magic B build sheet (355169a), quest writer run 21, the critic's playtests (83588ae), three QA runs and the concept artist's helms. Build s645.

**Under way.** Look sessions 1062–1083, approved at 8aea55a (the Gatelands' towns from the new kit): main merged into PR #424 again, CI rerunning; it merges when green. Systems 940–1121: the approved bf251d1 stays red (the Caer Slige rematch); the new head faf8fa0 is in CI and comes back for one tap when green. F3 waits for Systems to land.

**Roadmap.** 241 of 303 stories done; 2.0's new look 2 of 15 cards done, F2b, F6, F8, F9 and F11 under way; the core loop's resolver done, skills, enemies by place and the double jump under way.

## 19 Oct 2026

**Waiting on you.** Approve one: Bodies sessions 1136–1154 (88ff7c6, green): a person killed against a wall slumps down it, people and beasts alike. One decision: #448, how a gate's inside gets its size (B, spaces first, then rooms, on one grid).

**Landed on main since yesterday.** Systems sessions 940–1141 (dad5f7c, merged anyway on your A): skills rise by use, the first perks, the double jump and air dash, enemies by place. Look sessions 1062–1083 (afd77ba). Bodies sessions (85ca786). QA's CI in 16 shards (#437). The concept artist's shrines (#440), two critic playtests (#428, #450), the designer's gate interiors (#449). Build s714.

**Blocked.** Look 1086–1134: three crime suites (beat, penance, crime2) are the branch's own failures; the look builder fixes them now FREEZE #441 is closed. Quest builds 1092 conflicts with main; the quest writer merges main, and your approval carries over. #443 (new look the default) waits on Claude (local). QA found a guard's heavy blow can kill before the yield is offered (systems builder).

**Roadmap.** 248 of 303 stories done (241 yesterday). The core loop is 4 of 5 done (magic B left). The new look is 2 of 15 cards done.

## 20 Oct 2026

**Waiting on you.** Two decisions, nothing to approve: #494, how often a gate is failing or catastrophic (A, 50/35/15); #498, which farmyard the Gatelands' farms take (A, round a yard behind the house).

**Landed on main since yesterday.** The new pipeline (#459, #460): PRs test what they touch and merge themselves on green; every merge to main gets its own full run (#463). F3, the land in the new look, both parts (#473, #487). F4's townsfolk and human foes on the builder's bodies (#497, #503). Systems 1173 and the last standing branches (#455, #467, #393, #414). Bodies to 1203 (helms by tier, the fur mantle); Look to 1199 (the farmstead, byre, barn, hunting cabin). The critic's F3 playtest, the gate interiors build sheet, the players by island. Build s754; main green.

**Under way.** F4 part four, the wolves (#506), under FREEZE #492; the builders work in prototypes until it lifts.

**Blocked.** #443 (the new look as default) is red on 13 shards; it waits on Claude (local).

**Roadmap.** 249 of 305 stories done (248 yesterday). The new look is 3 of 15 cards done (F3 this week), F4 under way.

## 21 Oct 2026

**Waiting on you.** One decision: #543, how the quality level is chosen (B recommended: a two-second probe on first entry that can set Low, once). One approval: #537, basic tests (six smoke suites on each PR, every suite weekly, a faster harness); green and clean at a13b520.

**Landed on main since yesterday.** The new look is the default and every suite boots it (#529, Session 1226). F4 is done: a foe's distant copy and the rebuilt people's bundle (#519). Systems 1218 and the #443 fixes (#518, #524). Bodies to 1238 (#525, #535, #539, #542). Look to 1243: the canal lock, the Mark's cliff terraces and aurora outpost, the townhouse door at 2.2 m (#538, #541, #546, #553, #523). QA's waylamp fix (#548); the critic's Portclare playtest; the designer's streaming page; quest drafts; the corruption concepts. Build s787.

**Under way.** F10, the player's body: part one on #555, part two running, FREEZE #547. Systems #554 takes eight suites off the skip list; bodies #549 and #556 (the boar and the cave bear).

**Blocked.** Main red on the new look's first full run (check 2337): saltwater and rowelines time out, ragdollsearch fails twice, shard 2 died. QA owns it. #527 waits on QA merging main.

**Roadmap.** 250 of 305 stories done (249 yesterday). The new look is 4 of 15 cards done (F4 this week), F10 under way.

## 22 Oct 2026

**Waiting on you.** Three decisions: Aurenne's tavern, where guests sleep (A, two storeys with three rooms) and which inns use it (A, every Aurennais inn), on #602; the main quest's floor-2 gates (A, the two quest gates keep a second floor), on #613. One approval: QA's budget suites (#606), green and clean at 1e9f591.

**Landed on main since yesterday.** F5 is done: the gates are laid out as spaces, with a massive gate's two floors joined by a stair hall, drawn by space under eight lights (#592, #599, #604, #609, Sessions 1283–1302). Bodies to 1306: the first-person hands now take the place's light (#578, #585, #594, #600, #608, #612). Look to 1305: the Mark's halls and Aurenne's houses from the kit, Aurenne's church on its own plot (#581, #597, #603, #611). The Mark's alehall with the keeper's bench lines (#595). QA 1280 (#589). The quality-levels build sheet, the critic's playtest, the quest drafts, the seasons concepts. Build s832.

**Under way.** Systems #614 carries #607 whole: 19 of 21 suites pass, and it is red on mainrun until #613 is answered.

**Blocked.** #527 (the bundle check) waits on QA to merge main into it. The main quest stops at Q2 on main (#613).

**Roadmap.** 257 of 316 stories done (250 yesterday). The new look is 6 of 15 cards done (F5 this week). No deep-work card is queued: F14 comes last.

## 23 Oct 2026

**Waiting on you.** Nothing. Yesterday's four decisions are answered and written: #602 and #613 (A), the moonless night (#629, C), and the coaching inn beside the main street toward the ring (#642, A). No PR is held.

**Landed on main since yesterday.** Systems to 1340: a gate's foes wait in pockets, a gate's condition by seed with gone spans and floating stones, its minimap and saves (F5's follow-ups), and F12's six great gates with the corruption level 0 to 6 (#622, #628, #635, #638, #645); twelve fixed suites off the skip list, your tap (#623). Bodies to 1337: the Spider, the Sand Scorpion and the Bog Crawler on the creature kit; the hair and the raised hood made cheap (#620, #624, #627, #634, #639). Look to 1339: Aurenne's tavern and house door, the cliff bridge, the Church of the Weaver inside with its six gods, the coaching inn on the kit (#616, #625, #631, #637, #643). QA's budget suites and four fixes (#606, #617). The Spire Held's words (#640), quest drafts, the hours concept. Build s857.

**Under way.** Nothing ran overnight. Systems' queue is thin: magic B's first session, and F5's fifth waits on a great gate in the world.

**Blocked.** #527 (the bundle check) still waits on QA's fresh branch. QA's #636 has no CI on its head.

**Roadmap.** 258 of 318 stories done (257 yesterday). The new look is 6 of 16 cards done; F12 under way. No deep-work card is queued: F14 comes last.

## 24 Oct 2026

**Waiting on you.** Four decisions, each with a recommendation: exported files after the unmaking (#650, A: refuse them); where Aldwyn stands in 2.0's Ironhaven (#656, A: the plaza beside the lord); the coaching inn's first floor at the front (#660, A: rooms to let); what a failing gate with no nave or chasm loses (#664, A: its crossings take gaps). No PR is held.

**Landed on main since yesterday.** Bodies to 1356: the Faolchú and the dragon on the creature kit, F4's last family (#649, #657), and the Skeleton, the kit's first biped on the people's driver (#665). Look to 1351: the coaching inn on its plot beside the main street with the lots re-pinned round it (#653), and its own room as a prototype (#661). QA to 1345: #636 carried onto main, the settings sheet's crash measured (#654). The build sheet for the great gates' two paths (#651) and the critic's playtest at s863 (#659). Build s869.

**Under way.** Systems #663 (Sessions 1355, 1358–1359): floor-one gaps in two-floor gates and the tolls from three torn; CI running.

**Blocked.** #527 (the bundle check) still waits on QA's fresh branch.

**Roadmap.** 258 of 318 stories done (258 yesterday). The new look is 6 of 16 cards done; F6, F9 and F12 under way. No deep-work card is queued: F14 comes last.
