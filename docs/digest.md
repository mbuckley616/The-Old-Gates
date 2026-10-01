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
