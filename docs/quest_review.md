# Quest review — the dialogue police

Every player-readable string added or changed in `index.html` and, since the split (Session 379), `js/*.js`, checked against the canon's register (§2) and facts. Findings are applied by the builders **exactly as written**, without a decision. The quest writer never edits `index.html`.

## Reviewed to

| Branch | Reviewed to | Note |
|---|---|---|
| main | `3d7a660` | run 22: auto/systems' Sessions 1104–1141 merged (the Spire Held's watch, the draft's own lines word for word; the shelf's *You take … from the shelf.*; the heavy blow and the feint, no line), the Look's kit sessions and the concept and QA merges; clean. Before that, run 21 to `5521ba1`: the Look sessions 1031–1053, the Quest builds 979–1030; clean |
| auto/systems | `2b0ee4e` | run 22: merged into main (PR #353), nothing ahead. Run 21 to `9b2f0e1`: Sessions 1061–1089; clean |
| auto/fable-combat-resolver | `f1976a3` | run 20: merged into main, nothing ahead |
| auto/fable-f2a-scale, auto/wip-fable-f2a-scale | `e82ad5c`, `a5a4667` | run 19: merged into main, nothing ahead |
| auto/bodies, auto/backlog, auto/wip-town-plots, auto/producer, auto/producer-look, auto/producer-bodies, auto/producer-decisions, auto/qa, auto/qa-perkbody, auto/qa-skillcurve, auto/critic, auto/concept, auto/design, auto/wip-spear | `372b869`, `0272203`, `aa74c47`, `7a71e51`, `86f05bb`, `56e437c`, `570cd5e`, `db349a9`, `bac01b0`, `ff40184`, `92afe03`, `dc5902f`, `2b9d1d4`, `5a1b57d` | run 22: bodies (the wall hold) and backlog and wip-town-plots (the church, the bawn, the steward's route) add only the inspector's part names (*Church with a west tower*, *Bawn wall, gate and flankers*); auto/producer and auto/qa-skillcurve hold old merges of auto/systems read in runs 19–20; the rest nothing ahead of main in `js/` or `index.html` |
| auto/quests-build | `d7219d6` | run 22: my own build, Session 1092, and a merge of main (devlog only); PR #414 waits on FREEZE #441 |
| auto/wip-cloak-hang | `f4e973d` | run 17: nothing ahead of main in `js/` or `index.html` |
| auto/fable-f1-renderer | `026c76c` | run 17: merged into main (Session 822); no player-readable text but the settings sheet's *Renderer* row |
| claude/v2-scope | `f712a74` | run 17: docs only (the 2.0 scope, Michael's 1 B, 2 A, 3 A; the third art round) |
| auto/ci-shards, auto/wip-sitechest-load | `ef1c187`, `6b986b7` | run 19: no merge base with main now; unchanged since run 17 |
| auto/proto-ship-hulls | `fab53f6` | unchanged since run 12 |
| auto/proto-armour-lines, auto/proto-dungeon-traps, auto/proto-old-gates, auto/proto-dungeon-stairs, auto/proto-dungeon-wide, auto/proto-fort-layouts | `67487fc`, `261d0ce`, `8ce95be`, `b4ef176`, `8001604`, `36508b0` | unchanged since run 10 |
| auto/wip-moundsolid | `0ff2144` | unchanged since run 11 |
| auto/fable-co-op-door, auto/fable-world-file, auto/fable-rivers | — | no merge base with main; not read |
| auto/split | — | merged into main, nothing ahead |
| claude/lucid-faraday-6qlft7 | — | shares no history with main; not read |
---

## Run 22 — 19 Oct 2026

About 25 player-readable strings read: auto/systems' Sessions 1104–1141 as merged into main (PR #353), and the look builder's kit branches. One finding, on a line older than this run's diffs, found while drafting.

**main.** *The Spire Held*'s watch (Session 1112) carries the draft's §4 narration word for word (`SPIRE_LINES`), and its quest title and objective are the draft's. The shelf (Session 1121): *Press E near the keeper to talk · Walk south to exit*, *You take ${def.name} from the shelf.* and its log line are UI, plain. The heavy blow and the feint (1135–1140) add no line. Clean.

**The branches.** The look builder's (auto/backlog, auto/wip-town-plots) add only inspector part names. Nothing else is ahead of main in `js/`.

**Michael's calls:** none newer than 16 Oct.

**Built:** nothing. FREEZE #441 is open while the waiting branches land; *The Spire Held*'s rule is on main now (Session 1112), so its words (the topics, the night sergeant, Rowe) are next in the build queue once the freeze lifts. PR #414 (*What the Stones Say*) waits with the others.

**Drafted:** *Sea Legends, I — the ships' names, the singing ship, and the tales at the quay* (`docs/quest_drafts.md`, on the page as `sea-legends-1`). Its names and tales can be built on what the game has; the singing ship needs the systems builder, the look builder and a sound.

### Finding 32 — main — the player's ship can be named for the villain's courier's

**Where.** `84-world-interiors.js`: `SHIP_NAMES`, read by `spawnShip` (`85-world-sea.js`) when a ship is bought or granted.

**Text.** `'Kestrel'`, one of the ten names a bought ship can take.

**Why.** The *Kestrel* is Oswy Blackhand's ship (`story:oswy`, the courier step's marker *the Kestrel*). A player who sails a *Kestrel* of their own meets the courier's *Kestrel* in Act II, and the marker, the map and the log cannot tell them apart. The canon gives Oswy his ship, so the player's list gives the name up.

**Replacement.** In `SHIP_NAMES`, `'Kestrel'` becomes `'Bad Penny'`. A saved ship already named *Kestrel* keeps the name (`worldState.ship.name` is read first). Nothing else changes.

---

## Run 21 — 18 Oct 2026

About 40 player-readable strings read: main's merges (the kit's building names, my own builds of 16 and 17 Oct, read last run on their branch) and auto/systems' Sessions 1061–1089. No findings.

**auto/systems.** Four new lines, all in the game's plain UI voice: *You draw the ${weapon}.*, *You sheathe the ${weapon}.*, *✋ You tear the weapon from ${e.name}'s grip!* (Catch the blade) and *🛡 The arrow glances off your shield.* The perk cards (*Ringing*, *Throw*, *Catch the blade*, *Draw cut*) describe rules and nobody speaks them. The guild's *you still owe us* now has a line for each people (*You'll not plough two fields with the one ox*, the Aurennais *one contract is closed before the next is entered*, the Old Blood *Yours is not done*); all four were read in run 20 and are in register. Clean.

**Michael's calls:** none newer than 16 Oct.

**Built:** *What the Stones Say*, Session 1092 on auto/quests-build (PR #414): the treatise, the sheet, the glossary in the library roll and both heads' lines. `stonessay` 9/9. *The Spire Held* (approved 14 Oct, older) needs a night watch on the roof, a new rule of play, so it is filed in backlog A for the systems builder. *Back to Their Bread* is on main (17 Oct).

**Drafted:** *The Great Gates, V — what was bound: Act III, reconciled* (`docs/quest_drafts.md`, on the page as `great-gates-5`), the last piece of the six great gates. DECISION #413 asks what six torn leaves.

## Run 20 — 17 Oct 2026

About 60 player-readable strings read, all on auto/systems (Sessions 982–1028); main has only the combat resolver, read on its branch last run. No findings.

**auto/systems.** Finding 31 is in as written (`TALKED_LINES`, `talkedGreet`, Session 986): the guard who is talked down gives way in his people's voice. The Wolf-Mother's Cloak (Session 992) carries the draft's four lines, prompt and log word for word. The Waylamp's sight line (Session 1000) keeps *A lamp burns over the inn’s door in broad day.* and its rain clause, now said only by day and in rain, which is what the draft meant. The Crown's blade topic's labels (*The blade from the stone.*, *The licence.*, *I’ll keep it.*, *Not now.*) are plain. The perks, the double jump, the dash and the sway add no line a person says. Clean.

**Michael's calls:** *The Great Gates, II* and *III* approved (16 Oct), recorded in `decisions.md`.

**Built:** *Back to Their Bread*, Session 1030 on auto/quests-build (PR #367): the three descriptions after the open ending, and Varek at the fields. `backtobread` 9/9.

**Drafted:** *The Great Gates, IV — Varek's two arcs* (`docs/quest_drafts.md`, on the page as `great-gates-4`).

---

## Run 19 — 16 Oct 2026

About 130 player-readable strings read, nearly all on auto/systems (Sessions 940–978, skills by use and the first perks) and the combat resolver; main has nothing new but F2a, read on its branch last run. One finding.

**auto/systems.** Finding 30 is in as written, the four guild heads' *Yours is still on the board* and the rest, in `offer` and `cloakContract`. The rest is menu text and is plain: the 23 skills' names (*Scáth* and the other schools keep the Old Blood words), the perks (*Draw cut*, *Cat’s fall*, *Swallow’s turn*, *Second skin*), *… rises to …*, the level panel's *nothing rose under it this level*, the creator's *majors 3 of 5*, the traps' *The blade catches you*, and the fine's log line *Talked the fine at … down to …*. The one gap is where the player's *Talk it down. (Speech)* meets the guard: the fine halves and the halt opens again on its first line, so the guard who has just given way says *Halt. There’s a fine of 6 gold on you* as if the player had said nothing. That is Finding 31. Session 978 names one shrine a god's and leaves the rest their own names, which adds no line.

**auto/fable-combat-resolver** (Sessions 939–963): combat's flat lines (*You are still drinking.*, *…'s guard breaks!*, *… bowls you over*, *…'s heavy blow: …*) are combat talk and UI, plain. Clean.

### Finding 31 — auto/systems — the guard gives way on the fine and says nothing about it

**Where.** `86-world-crime.js`: `talkDownTopic(S,c,reopen)`, which halves the fine through `talkDownFine` and reopens the halt; and `confront(n,S,c)` and `confrontIndoor(s,S,c)`, whose greeting is `L.greet(fine,S.site.name)+feastFineLine(S,c)`.

**Text.** The reopened halt's greeting, e.g. `` `Halt. There’s a fine of ${f} gold on you in ${t}. Pay it, or I draw.` `` straight after the fine was talked down.

**Why.** The perk's rule is right; the guard's voice is missing. Every other turn at the halt (pay, poor, refuse, yield, the feast day) has a line in each people's voice. Here the guard has just been argued down by half and greets the player as a stranger. An Aurennais guard would put terms to it, a Gatelander would give way with a proverb, and a Markman would give way grudgingly, briefly.

**Replacement.** Add beside `YIELD_LINES` in `86-world-crime.js`:
`const TALKED_LINES={gatelander:f=>`A soft word turns a hard fine, they say, and you’ve a softer word than most. Half, so: ${f} gold, and we’ll say no more about it.`,markman:f=>`Aye, all right. Half. ${f} gold, and don’t make me sorry.`,aurennais:f=>`You argue it well, Master. The town will accept half, on these terms: ${f} gold, and the matter closed.`,oldblood:f=>`Half, then. ${f} gold.`};`
In `talkDownTopic`'s `fn`, after `talkDownFine` succeeds, set `c.talkedNow=1`. In `confront` and `confrontIndoor`, the greeting becomes `c.talkedNow?(TALKED_LINES[peopleOfSite(S.site)]||TALKED_LINES.markman)(fine):L.greet(fine,S.site.name)+feastFineLine(S,c)`, and `c.talkedNow` is cleared (`delete c.talkedNow`) as the dialog opens, so the next halt in that town greets as before. The topics, the fine and the log line are unchanged.

---

## Run 18 — 15 Oct 2026

No player-readable string has changed since run 17. Main moved from `1379510` to `2553a6d` with the build tag alone in `index.html`, and the merged Bodies, Look and Systems sessions are prototypes, tests and docs. On the branches, F2a (`auto/fable-f2a-scale`, Sessions 880–905) changes nineteen files in `js/` for measures and placement and adds no line anyone reads. No findings.

**Drafted:** *The Great Gates, II — the knife and the needle*. The Loosing Knife comes by Varek's unsigned note and lies under a flagstone at the Ashfeld. The Binding Needle is handed over by Aldwyn after the first cut. The draft also corrects piece I: the Church's knot is *the Nodus*, not *le Nœud*, under the approved Aurennais register.

---

## Run 17 — 14 Oct 2026

About 210 player-readable strings read, all on main (`c66473e..1379510`); nothing a player reads is ahead of main on any branch. One finding.

**main** (Sessions 776–820, F1). Nearly all of it is this desk's *Makers' Things*, both runs, approved on #263: the hermit's folder, the altars' verses, the six descriptions, the trials' lines (*It comes out of the stone the way a key comes out of a lock: all at once, after nothing.*; *At noon the cairn has no shadow, and the ring is only a ring.*), the Waylamp's innkeepers in four peoples, the claimants (the Crown's *the rolls never forget a thing they never saw*, the Compact's cog, the Prior's *la Navette*), and Corwin's word from Aldwyn. Checked against the draft, they are in word for word, *the Noon Ring* included. Finding 29's four night lines are in as written. The guild's hand-back (*I can’t do it.*) answers in four voices, and the Gatelander's *Better a thing set down than a thing dropped* is right. The menu lines (*Took the Gate-Blade from the stone by …*, *The Compact refitted the … as a cog.*, *Rented … ; the Waylamp's bearer is not charged.*) are plain and right. F1's settings row (*The renderer*) is menu text. The one line out of voice is the guild head's refusal of a second task, which every people says in the same Markish words: Finding 30.

**Drafted:** *The Great Gates, I — the knot at the ring* (`docs/quest_drafts.md`), the first piece of the six great gates, which Michael put first on 13 Oct. It covers the act at a great gate on both paths: where it happens (the knot in the dark at the heart of the ring), cutting and binding with their lines by school, the gain and the cost as one tier of the school's spells, the undo and the way back to the ring, the lock at six bound, and the people's *Any news?* from one torn gate to five, with the three powers' word on each act. The act is asked as **DECISION #292** (A the knot, recommended; B the door; C the heart carried). Next run: the two artifacts' names and lines.

### Finding 30 — main — the guild head turns down a second task in a Markman's words, whoever the head is

**Where.** `83-world-generator.js`, `function offer(g,site)`, its first statement; and `87-world-quests.js`, `function cloakContract(site,p,fee)`, its first statement (grep `You still owe us`). The first is older; the second (Session 789) copies it, so both are found here.

**Text.** `` `You still owe us: ${st.active.short}. ${progressLine(st.active)}.` ``

**Why.** The guild head speaks in the people of the hall's town (`guildDef`, Session 254, quest review run 1, finding 1); every other line the head says, the hand-back beside it included, is written four times. This one is a Markman's: blunt, a debt, no honorific. An Aurennais head would not say it without *Master* and a clause, and a Gatelander would not refuse you without a proverb.

**Replacement.** Add at the top level of `83-world-generator.js` (outside every function, so the later `87-world-quests.js` reaches it; no file declares `OWE_LINES` today):
`const OWE_LINES={gatelander:(s,p)=>`You'll not plough two fields with the one ox. Yours is still on the board: ${s}. ${p}.`,markman:(s,p)=>`You still owe us: ${s}. ${p}.`,aurennais:(s,p)=>`Forgive me, Master; one contract is closed before the next is entered. Yours is still open: ${s}. ${p}.`,oldblood:(s,p)=>`Yours is not done: ${s}. ${p}.`};`
In `offer`, the first statement becomes `if(st.active)return (OWE_LINES[gp]||OWE_LINES.markman)(st.active.short,progressLine(st.active));`. `offer` takes the head's people as a third argument: `offer(g,site,gp)`, called as `fn:()=>offer(g,site,gp)` in the topics getter, where `gp` is already in scope for `handBack`. In `cloakContract` the same line becomes `(OWE_LINES[p]||OWE_LINES.markman)(st.active.short,progressLine(st.active))` (`p` is the head's people there already).

---

## Run 16 — 13 Oct 2026

About 30 player-readable strings read: some 15 on main (Sessions 743–767), about 15 on auto/systems (Sessions 770, 776–779; auto/producer carries 770 too). One finding: the four night lines Michael's A on #255 asked this desk for, which the code holds a place for and does not have.

**main** (Sessions 743–767). Finding 28 is in the code as written: *the Captains' League has laid siege to …*, *… sieges broken, 1 town lost.*, and the lord's two war lines in three voices. New and good: *Bought a sack of grain for 12 gold. Into the hold.* and *The hold is full: you carry it.* (S758), *Too spent to break the guard.* on its own line (S761), the places' forms kept round a free name, *Shrine of …*, *… Spire*, *…'s Lair* (S756). The damage numbers and the gates' rosters carry no words. Clean.

**auto/systems** (Sessions 770, 776–779). Over a sleeper, *Sinéad (asleep) — Press 'E' to wake*: right. `WOKEN_LINES` is empty, so all four peoples say the decision's placeholder; Finding 29 fills it. The Makers' tools: *Took the Gate-Blade.*, the journal's *Things not yet yours* and its rows (*The Gate-Blade — Hollow Gate. Might 30.*), *One of the six things the Makers left.*, and the two items' plain rules lines are in the menu voice and right. *The Sundial Ring* is the page's working name; this desk's draft calls it *the Noon Ring*, and DECISION #263 has the choice before Michael, so no finding.

**claude/bold-fermi-1wf6zu** (Session 771, docs). Michael's six great gates and their two paths, sealed or torn, go into the canon with a note that the Act III outline is *to be reconciled with them by the quest writer*. Not on main yet. Once it is, that reconciliation is owed by this desk: the Root, the Final Monologue and Varek's last stand at the sixth gate, and the endings table (§11).

Also owed and not done this run: the read of the dialog pools against §10a (backlog J, *The world's tone*).

**Drafted:** *The Aurennais Register — names, places, signs and talk* (`docs/quest_drafts.md`): the name banks backlog J owes for Aurenne since Michael dropped its Norman register, a people's names, a place-name bank, rivers, peaks, lakes, signs, inns and the *Any news?* pool, and what in the code takes them. No decision needed.

### Finding 29 — auto/systems and auto/producer — a householder woken at night says the same words in four peoples

**Where.** `86-world-crime.js`, `const WOKEN_LINES={};` (grep `WOKEN_LINES`), Session 770.

**Text.** `WOKEN_LINES={}`, so every woken householder says the fallback, *What — who's there? It's the middle of the night.*

**Why.** Michael's A on #255 asks the quest writer for four, one per people. The fallback is a Markman's short sentences in a Gatelander's mouth, and an Aurennais would not say it without an honorific. Each line below is startled and not hostile (no crime is done, and the usual talk follows), with one dry turn, as §10a has people *kind, busy and funny*.

**Replacement.** `const WOKEN_LINES={};` becomes:
`const WOKEN_LINES={gatelander:"Weaver keep us — who's that? It's the black of the night. A friend knocks, and a friend knocks by day.",markman:"Iron and blood! Who's there? Middle of the night, friend. Say it quick.",aurennais:"Who is there? Master — it is the middle of the night. Whatever our arrangement was, I do not recall it including this hour.",oldblood:"Who stands there. It is meán oíche. The door was shut."};`
The fallback in `wokenLine` stays for a people with no line.

---

## Run 15 — 12 Oct 2026

About 35 player-readable strings read, all on main (Sessions 723–748); nothing a player reads is ahead of main on any branch. One finding, an old one, found while drafting.

**main** (Sessions 723–748). Findings 25, 26 and 27 are in the code word for word (Sessions 727–729, 735): the honest answer by people and state, the barber's three taglines and *A barber?*, the doubled glade's card and the lair rumours. The rest is without words or plain: a householder asleep from 23h to 5h, woken by E or by a step within two units, is named *the resident* when there is no keeper's name, so *the resident saw you …* would open lowercase; no home is built without a keeper's name, so no finding. The guard's fine no longer opens with his introduction (S734): right. The nets, the hold on deck, the quay's retaining wall and the second gate guard carry no text.

**auto/backlog** (Sessions 743–744, 749). The hand-over-hand climb and the dry-stone wall at Portclare's cut: no text. Clean.

**claude/bold-fermi-1wf6zu** (Session 750, docs). Michael's tone, in his words, goes into the canon as Part II §10a and supersedes Part I's *creeping dread*: high fantasy at the core, *the world is largely pleasant*, grimdark and cosmic horror only in the villains and the metaphysics, people *mostly kind, busy and funny*. It is not on main yet, so nothing is reviewed against it this run. Once it is, this desk owes the read the session asks for: the dialog pools against §10a, for lines that make the surface world dreary. This run's draft is written to it already.

**Drafted:** *Under Another Flag — a town besieged, held and freed* (`docs/quest_drafts.md`): canon §12a's occupation and siege effects in what townsfolk say (who runs the town, the law, the Crown or League or Compact, trade and the tithe, the greeting by whose people you are), two jobs from the lord to break a siege and free a held town, the freed town's thanks, and the patrols §12a names. No decision needed.

### Finding 28 — main — the war's notices open lowercase, name the land not the power, and say *1 towns*; the lord's two war lines are one voice for three peoples

**Where.** `87-world-quests.js`: `lordTopics` (grep `Who holds the town?` and `label:'The siege?'`), `laySiege` (grep `has laid siege to`), `endWarIf` (grep `sieges broken`), `tickSieges` (grep `'s camp outside` and `'s garrison holds`), all reading `nationName(nk)`.

**Text.**
- `${by}. Their captain sits in my chair and their soldiers hold the plaza. Kill the garrison and it's ours again; until then I've nothing to give you but my thanks for asking.`
- `${by}'s camp sits on the road. Twelve days of that and the gates open from hunger. Break the camp and you'll have the town's thanks and mine.`
- `${nationName(by)} has laid siege to ${t.name}.` · `${nationName(by)}'s camp outside ${t.name}.` · `${nationName(by)}'s garrison holds ${t.name}.`
- `Peace between ${nationName(W.a)} and ${nationName(W.b)}. ${W.broken} sieges broken, ${W.lost} towns lost.`

**Why.** `nationName` gives *the Gatelands*, *the Mark* or *Aurenne*, so four of these open with a lowercase *the* (*the Mark. Their captain sits in my chair …*, *the Mark's camp outside Dunmore.*). A land does not lay siege or keep a garrison: canon §1 gives each island a power, *the Crown*, *the Captains' League*, *the Compact*, and the game already holds them as `NATIONS[nk].crown`. The peace says *1 towns lost* and *1 sieges broken*. And the lord answers the two questions a town is most itself in, the same words in a Markish garrison and an Aurennais port: a Markman with *I've nothing to give you but my thanks for asking*, an Aurennais without an honorific. (The war's declaration and *has fallen to …* read the land mid-sentence and are right as they are.)

**Replacement.**
- Beside `function nationName`, add: `function polityName(nk,cap){const s=NATIONS[nk]?NATIONS[nk].crown:String(nk);return cap?s.charAt(0).toUpperCase()+s.slice(1):s;} /* the power that acts in a war: the Crown, the League, the Compact */`
- In `laySiege`, `` `${nationName(by)} has laid siege to ${t.name}.` `` becomes `` `${polityName(by,true)} has laid siege to ${t.name}.` ``
- In `tickSieges`, `` `${nationName(by)}'s camp outside ${t.name}.` `` becomes `` `${polityName(by,true)}'s camp is on the road outside ${t.name}.` ``, and `` `${nationName(by)}'s garrison holds ${t.name}.` `` becomes `` `${polityName(by,true)}'s garrison holds ${t.name}.` ``
- In `endWarIf`, `` `… ${W.broken} sieges broken, ${W.lost} towns lost.` `` becomes `` `… ${W.broken} ${plural(W.broken,'siege')} broken, ${W.lost} ${plural(W.lost,'town')} lost.` ``
- In `lordTopics`, the two lines (236–237 today) become:
`` const _st=TS(site),_lp=nationOf(...cellOf(site.x,site.z)).people; ``
`` if(_st.flags.occupied!=null){const P=polityName(_st.occupier),Pc=polityName(_st.occupier,true);const L={gatelander:`${Pc}, for now. Their captain sits in my chair and their soldiers stand on my plaza. A town's not taken till it's kept, and they've not kept it yet. Clear the plaza and there's nothing in this town I'd not give you.`,markman:`${Pc}. Their captain's in my chair, their men are on the plaza. Kill the lot and the town's ours again. I'd do it myself if I had the arm.`,aurennais:`${Pc}, Master, under terms we were not asked to sign. Their captain keeps my chair and their men keep the plaza. Should the garrison cease, the town reverts to its proper holders, and its gratitude to you would be entered in the books.`};return [{label:'Who holds the town?',response:L[_lp]||L.gatelander}];} ``
`` if(_st.flags.besieged!=null){const Pc=polityName(_st.siegeBy,true);const L={gatelander:`${Pc}'s camp is on the road and the gate is shut. Twelve days, the granary says, and then hunger opens it for them. A camp's only canvas and the men in it. Break it and the town will owe you more than it can say.`,markman:`${Pc}'s camp. On the road, past the gate. Twelve days of bread, then we open or we starve. Break the camp.`,aurennais:`${Pc} has encamped on the road, Master. By the granary's accounts we can hold twelve days; after that the gate opens on hunger's terms rather than ours. Should the camp be broken, the town would count itself in your debt, and say so in writing.`};return [{label:'The siege?',response:L[_lp]||L.gatelander}];} ``
  `_lp` is the lord's own people, the province's (`lordFor` draws the lord from it), not the occupier's. *Twelve days* is the rule in `tickWarDay`. The draft below gives these two topics a job to take; until it is approved they answer as here.

---

## Run 14 — 11 Oct 2026

About 60 player-readable strings read: some 40 on main (the pause leaf, its keys and the settings sheet), 6 on auto/backlog (the map's seals), about 15 on auto/systems. Three findings: one new line on auto/systems, two owed lines this desk was asked for.

**main** (Sessions 676, 690–691). The pause leaf and the settings sheet are in the menu voice and good: *The world waits for you.*, *write this day in the register*, *go back to a day you kept*, *what you have not saved is lost*, *Leave without saving?*, *As they were*, *Adept is the game as it was.* No finding.

**auto/backlog** (Session 704). *Where your work is*, *Report to {giver}*, *Bring {item} to {giver}*, *Report to the guild*, *{place}, as you were told*: plain and right. No finding.

**auto/systems** (Sessions 692–722). Findings 23 and 24 are in the code as written. New and good: *The master of this place is dead. Its hoard is where you left it.*, *Something large is waiting further in.*, *A locked door* / *A good lock*, *slew Carrigowen — Marsh Hag* and *slew an Ogre* (`foeLogName`), the born-here who are eighteen or older, *Steel Sword* named for its tier. Finding 25 is the honest answer about the town, which lost its number in Session 698 and now says one thing twice. Finding 27 answers Session 719's ask for the doubled glade's card line, with the lair rumour canon §12 also owes.

**Drafted:** *Asked in Passing, the second run — six more errands* (`docs/quest_drafts.md`): a cart in the ditch, a child at a gate, a fish for a wedding, a rubbing to be read, a hedge two neighbours both ask you about, a prayer carried to a shrine. No decision needed.

### Finding 25 — auto/systems — *How are things here, honestly?* says *Getting by. We get by.*, and praises an occupied town

**Where.** `richTopics` in `87-world-quests.js` (grep `How are things here, honestly`).

**Text.** `${stateSaid(site)…}. ${prosperity(site)>=60?'Better than my father saw.':prosperity(site)>=35?'We get by.':'You can see for yourself.'}`

**Why.** Session 698 rightly took the number out, and the word is now said aloud: between 40 and 59 the answer is *Getting by. We get by.*, the same thing twice. The second sentence reads only prosperity, so an occupied or besieged town at 60 or more says *Occupied. Better than my father saw.* And it is one voice for four peoples, on the question a person answers most like themselves: a Gatelander does not answer *honestly?* with a bare word.

**Replacement.** The topic becomes:
`` t.push({cat:'place',label:'How are things here, honestly?',get response(){const st=TS(site),p=prosperity(site),pp=def.people||NAT.people;const k=st.flags.besieged!=null?'siege':st.flags.occupied!=null?'held':p>=60?'good':p>=35?'fair':'poor';const H={gatelander:{good:"Fat years, these. Better than my father saw. You don't say so aloud, mind, or the weather hears.",fair:"Neither fat nor lean. A middling year's a good one, if you've lived through the other kind.",poor:"You've eyes. An empty street says more than I'd like to.",siege:"Their camp's on the road and the gate's shut. A town under siege counts its loaves, not its blessings.",held:"Their flag's on the gate and their boots are on the square. We keep our heads down and our names to ourselves."},markman:{good:"Good. Better than my father saw. Don't spread it.",fair:"We get by. Could be worse. Has been.",poor:"Bad. You've eyes.",siege:"Siege. Their camp's on the road. We eat less and sharpen more.",held:"Their soldiers on our square. For now."},aurennais:{good:"Prosperous, Master, by any accounting. The books have not looked so well in my lifetime.",fair:"Solvent, Master, though not by much. The accounts balance, which is more than some towns can say.",poor:"In arrears, Master, and not only in coin. You can see it from the street.",siege:"Under siege, Master. A town that cannot trade cannot long pay what it owes.",held:"Under another's administration, Master. Their terms are not ours, and we were not asked to sign them."},oldblood:{good:"Full. The barns and the wells.",fair:"Enough. Not more.",poor:"Thin. As the year before a hunger.",siege:"Shut in. The camp is on the road.",held:"Held. Not by us."}};return (H[pp]||H.gatelander)[k];}}); ``
The lord's *How fares the town?* (`lordTopics`) is reached only when the town is neither held nor besieged, and *{town} is getting by.* reads well; it stays.

### Finding 26 — main and auto/systems — the barber has no tagline and cannot be asked the way to

**Where.** `TAGLINES.barber` in `82-world-structures.js` (grep `no tagline until the quest writer`), and `WAY_ASK` / `WAY_ORDER` in `83-world-generator.js` (grep `const WAY_ASK`). Owed to this desk since Session 512; the critic's s455 note (backlog I) is the empty reply it leaves to *What do you sell?*.

**Text.** `barber:[''],` — and no barber in `WAY_ASK`, so *Where can I find …* lists every shop in a town but the barber.

**Why.** A blank tagline is a blank answer in the keeper's mouth. The taglines are sign-words, in no people's voice, like the smith's *"If it bends, I did not make it."*

**Replacement.**
- `barber:[''], // S512 — no tagline until the quest writer gives the barber one` becomes `barber:['"Shorn, shaved, or dyed. Sit still."','"A sharp razor and a steady hand."','"Come in rough, go out kempt."'],`
- In `WAY_ASK`, after `misc:[…],` add `barber:['A barber?','barbers'],`
- In `WAY_ORDER`, `'misc','shipwright'` becomes `'misc','barber','shipwright'`.

### Finding 27 — auto/systems — the doubled glade has no line, and canon §12's lair rumour none either

**Where.** `mapEntries` in `83-world-generator.js` (grep `const SUB={glade:'Glade'`), and `liveRumours` in `87-world-quests.js` (grep `function liveRumours`). Session 719 asked this desk for the glade's card line; the critic's s482 notes found §12's *a rumour within two provinces* unbuilt.

**Text.** A glade's card reads *Glade* whether or not its herbs are doubled; no townsperson within two provinces mentions a lair, live or dead.

**Why.** Canon §12: *`lairs[id].dead` … stays dead; nearest glade doubles herbs; a rumour within two provinces.* The first two are built; nothing tells the player either the glade or the town has noticed. Rumours are one voice in `liveRumours` already, and these keep to it.

**Replacement.**
- In `mapEntries`, `sub:SUB[t.kind]||…` becomes `sub:t.kind==='glade'&&typeof gladeDoubled==='function'&&gladeDoubled(t)?'Glade · grown thick since the beast died':SUB[t.kind]||…` (the rest of the expression as it is). If the map's draw finds `gladeDoubled` dear, it may be cached by the game-day.
- In `liveRumours`, before `if(isNight())`, add:
`` {const L=worldState.lairs||{};for(let i=Math.max(0,ci-2);i<=Math.min(GRID-1,ci+2);i++)for(let j=Math.max(0,cj-2);j<=Math.min(GRID-1,cj+2);j++){const cc=getCell(i,j);if(!cc||!cc.sites)continue;for(const l of cc.sites){if(l.kind!=='lair')continue;const d=Math.hypot(l.x-site.x,l.z-site.z);if(L[l.id]==null){if(d<700)out.push(`Something lives up at ${l.name}. The sheep won't graze that way, and you can't make them.`);continue;}const g=cc.sites.find(t=>t.kind==='glade'&&typeof gladeDoubled==='function'&&gladeDoubled(t));out.push(g?`Somebody killed the thing at ${l.name}. The herbs have come up thick in ${g.name} since.`:`Somebody killed the thing at ${l.name}. The sheep go that way again.`);}}} ``
  (*within two provinces* is the five-by-five cells round the town; a live lair is spoken of only within 700, the reach at which it harms a town.)

## Run 13 — 10 Oct 2026

About 30 player-readable strings read on auto/systems, none on main or auto/backlog. Two findings: one new line in one voice for four peoples, and one old pool found while drafting.

**auto/systems** (Sessions 672–689). Findings 21 and 22 are in the code as written: the yard's note on a ship being raised, and Varek's three lines at the Ashfeld. New and good: *This is the cold hearth. Stand by it and cast a flame (F).* (unchanged, now only for a flame), the Standing page's *1 service* and *1 task*, *Handed back to the {guild}.* in the Journal, the label *I can't do it.*, and the challenge's five names (*Novice* to *Master*, menu voice). The death of a traveller outdoors now reads *the open country*, not the last gate entered: right. Finding 23 is the guild head's hand-back line, which Session 682 left to this desk by name.

**main** and **auto/backlog** add no string a player reads (the hulls, the inspector's ship entries, the cold hearth's ash and flames, test fixes).

**Drafted:** *Asked in Passing — six townsfolk's errands* (`docs/quest_drafts.md`), the first piece of Michael's 5 Oct note on *50–100 quests to stumble upon, that make you talk to people*. No decision needed. Finding 24 is old text met while drafting it: the townsfolk's worries name a king and a tithe in every nation.

### Finding 23 — auto/systems — the guild head hands a task back in one voice for four peoples

**Where.** `handBack` in `83-world-generator.js` (grep `Then it goes back on the board`), and its topic row in `guildDef` (grep `fn:()=>handBack(g)`). Session 682's comment: *The guild head's line in each people's voice is the quest writer's.*

**Text.** *Then it goes back on the board. Ask when you want another.*

**Why.** The head who greets you in their people's voice (`GUILD_GREET`, Finding 1) answers this in one plain voice. A Markman would not say *Ask when you want another* to someone who has just given up; an Aurennais would speak of the contract and say *Master*; a Gatelander would not let a thing go without a proverb over it; the Old Blood would say less. No line blames: Michael's A on #217 says no mark against your standing, so none of them scolds.

**Replacement.**
- The topic row's `fn:()=>handBack(g)` becomes `fn:()=>handBack(g,gp)` (`gp` is the head's people, already in scope in `guildDef`).
- `function handBack(g){` becomes `function handBack(g,gp){`.
- Its last line, `return 'Then it goes back on the board. Ask when you want another.';}`, becomes:
`` return ({gatelander:"Better a thing set down than a thing dropped. It goes back on the board, and there'll be another when you want one.",markman:"Aye. Back on the board. Come back when you want another.",aurennais:"Then the contract is void, Master, and nothing is owed on either side. It returns to the board; another can be drawn up when you wish.",oldblood:"Then it goes back. Someone else will carry it. Come when you want another."})[gp]||"Then it goes back on the board. Come back when you want another.";} ``

### Finding 24 — main and auto/systems — every townsperson's worry can be a king and a tithe

**Where.** `WORRIES` in `87-world-quests.js` (grep `took the king's coin`). The pool is one list for all three nations; `bioFor` picks from it for anyone.

**Text.** *my brother took the king's coin and never wrote* · *the tithe went up again and nobody says why*

**Why.** Canon §1: the Gatelands has a Crown, the Mark *no king and a scorn for the word*, Aurenne a Compact; *every "royal" string in the game means this crown and no other* (§10: *the crown* only of the Gatelands). A tithe is the Compact's (§1.3). In the Mark both lines are wrong, and in the Gatelands the second is. Each line keeps its worry and loses the nation: the brother who went soldiering and never wrote serves the Unanswered Letter (drafted this run), and any lord's dues can go up.

**Replacement.** In `WORRIES`, `"my brother took the king's coin and never wrote"` becomes `"my brother went for a soldier and never wrote"`, and `"the tithe went up again and nobody says why"` becomes `"the dues went up again and nobody says why"`. The other six stay.


## Run 12 — 9 Oct 2026

About 45 player-readable strings read on auto/systems and none on main or the other branches. Two findings: one new, and one old line found while drafting.

**auto/systems** (Sessions 640–667). Finding 20 is in the code as written, all three lines. The factor's board and the yard are now panels. Most of their text is the chat rows' lines moved, and those were read in runs 5 and 8. New: *You have no ship to fill.*, *Took aboard N × crate of iron for N gold.*, *The yard at {town}*, *Sold as a sloop; refitted as a caravel for N gold more.*, and the dial's *N kn bare, N under full sails*. All plain, all right. The Journal's *Told* (*told by Gráinne, Niamh*, *first met …*, *← All you were told*, *Nothing you were told matches.*) is in the menu voice and good. *1 task done.* is right. The shipwright's *Hulls. Sound ones. And rope, if you ask nicely.* is older than the baseline and stays. Finding 21 is the yard's note on a sunk ship.

**main**, **auto/backlog** and **auto/proto-ship-hulls** add no string a player reads (the stair's posts, the two hulls, the inspector's chrome).

**Drafted:** *The Root — the rooms beneath all the gates* (`docs/quest_drafts.md`), backlog A's last open story item. The draft needs one call, DECISION #214 (what guards the Root). Finding 22 is old text met while drafting it: the field scene that sends you to the Root argues against the canon's Varek.

### Finding 21 — auto/systems — the yard says *ask about raising her* after you have paid to raise her

**Where.** The yard panel, `yardPanelDraw` in `86-world-crime.js` (grep `Ask about raising her.`).

**Text.** *The ${name} lies on the bottom. Ask about raising her.*

**Why.** Once the raising is paid (`st.raise` set), `upgradeTopics` offers nothing, because the work is in hand. The note still sends you to ask, and there is nothing to ask. The note should say the work is under way, and when it will be done.

**Replacement.** The line becomes:
`` if(st&&st.sunk){const n=st.name||SHIP.name;if(st.raise){const d=Math.max(1,Math.ceil((st.raise.due-(worldState.gameTimeAbsMinutes||0))/1440)),y=(siteAnywhere(st.raise.site)||{}).name||'the quay';note=`The ${n} lies on the bottom. The yard at ${y} is raising her: ${d===1?'one day':d+' days'} yet.`;}else note=`The ${n} lies on the bottom. Ask about raising her.`;} ``
(the `else if(!st&&cls!=='sloop')` branch after it is unchanged).

### Finding 22 — main and auto/systems — at the Ashfeld, Varek argues for closing the window, which is the canon's *stop him*

**Where.** `tickAshfeld`, `88-world-ticks.js` (grep `They were never a loom`): the first topic's response, and the `stop` and `help` rows. Older than the baseline; run 6 noted it and did not find it. It is a finding now because the Root's draft follows the canon, so the field and the Root would argue opposite things one scene apart.

**Text.**
- *Then what are you doing to the sigils?* → *Writing over them. Every one I can reach. Not to take — to *close*. They were never a loom. They're a window, and the ones who built them opened it, and something has been reading us through it since. I've spent two hundred years pulling the shutters. You've spent a season undoing it, gate by gate, for coin.*
- *Stop. Leave the gates.* → *You'd have me stop, and let it read. Then go and see what it is. …*
- *I'll help you close them.* → *… Meet me there and we'll shut the last window with our hands.*

**Why.** Canon §3.1: his heresy is *"they built a cage and called it a loom"*, and it is about the Clearing; *he believes unbinding will let the dead stay*. §11: *help him* means *unbind*, and the code's `help` choice leads to the Root's *Break it*. As written, he wants the opposite of what he wants, and helping him reads as sealing. His voice stays his own (Part I: he asks questions; he is tired, not angry), and so does the shape of each line. *Two hundred years* becomes the canon's *two hundred and fifty*.

**Replacement** (each line whole; the `fn`s are unchanged):
- The first topic's `response`: `"Unwriting them. Every one I can reach. They built a cage and called it a loom, and the dead pay for its keeping. Take it apart, and the dead can stay. I've spent two hundred and fifty years at it, stone by stone. You've spent a season keeping it running, gate by gate, for coin. Did anyone ever tell you what it runs on?"`
- The `stop` row's return: `"You'd have me leave it running. Then go and see what it runs on. The place beneath all the gates is on the far side of Aurenne, under the water. The Root. I'll be there before you, because I always am. Decide there."`
- The `help` row's `label`: `"I'll help you unbind it."`; its return: `"Then there is one gate left that matters, and it isn't a gate. The Root, under the water off Aurenne's far shore. Everything runs back to it. Meet me there, and we'll take the last stone out with our hands."`
- The `third` row is canon as written and stays.

---

## Run 11 — 8 Oct 2026

No new strings on main (the wolves are shape only). About 20 on auto/systems, Sessions 621–639; one finding, three lines older than the baseline that Session 638's boarding nets made untrue. The systems builder named them in the channel on 7 Oct.

**auto/systems.** Finding 19 is in the code as written (*Born here, and here these N years.*). The new lines are good: *The ${ship} goes down. Any shipwright can raise her.*, *sank with N crates in her hold*, *You climb aboard. E again for the wheel.*, *Refit her as a cutter (the yard pays N gold)*, *Better sails, tier N*, and *Press 'E' to rest* on a fort's cot. The shipwrights' refit lines in four peoples are unchanged; cut at the first full stop for a hull no longer than hers, each still stands as a sentence in its register (*She is a caravel now, Master.*, *A cutter now.*).

**Drafted:** *The Makers' Things, the second run* (`docs/quest_drafts.md`): the Drowned Bell, the Noon Ring, the Waylamp and the Shuttle, with the Compact's claim and the Church's.

### Finding 20 — auto/systems — three lines still say *E beside her to board*

**Where.** The shipwright's sale, `buyShip` in `85-world-sea.js` (grep `press E beside her`), and Corwin's sea line, `tutSeaStage` in `88-world-ticks.js`: the `ship` stage and the `board` stage.

**Why.** Since Session 638 you board by the net with your eye on it, or by swimming against it, and the black sails' nets work the same way. A player told to stand *beside her* stands beside her and nothing happens. Corwin is a Gatelander, but these are a tutor's instructions, and his old lines are plain on purpose; the mending keeps his voice and his order of things.

**Text, and replacement** (each line whole; keep the file's `\u2019` escapes in the first):

1. *Walk out, press E beside her to board, E again for the wheel.* (the end of the sale line) →
   `` Walk to the end of the quay, look at the net down her side and press E to climb aboard; E again for the wheel. ``
2. `ship` stage: *…they owe me for a winter's timber. E beside her to board, E at the wheel. W and S for the sails, A and D to steer."* →
   `` Corwin: "Now buy a hull. Any shipwright. Show them my note — a quarter off; they owe me for a winter's timber. There's a net down each side of her: put your eye on it and press E, and up you go. E again at the wheel. W and S for the sails, A and D to steer." ``
3. `board` stage: *Don't run — come alongside, E to board, and clear her deck.* →
   `` Corwin: "Out on the water you'll meet black sails. They shoot first. Don't run — come alongside, put your eye on her net and press E, and clear her deck once you're over the rail. The captain's chest is yours after." ``

---

## Run 10 — 7 Oct 2026

About 35 new strings on main and 60 on auto/systems; one finding, on a line older than the baseline that auto/systems touched this week.

**main** (`598e95e..9ecc10d`). Finding 17 is in the code as written (*Not enough gold: the visit is ${fee}.*, *Not enough gold.*). The barber's *Leave as you came* and *You rise from the chair as you sat down.* are good. The rest is the inspector's chrome (*Plants, trees, rocks*, *Your body in robes*) and the armour kit's names (*Bracers*, *Leggings*, *Soft Boots*, *Under-robe*, *Worn Breeches*, *Tattered Tunic*), which are plain and right.

**auto/systems** (Sessions 591–618). Finding 18 is in the code as written: the pious temper keeps *The Weaver keeps this door.* and *Go with the Weaver.* The new house names (*Old ${nm}'s House*, *${nm} the Cooper's House at the north end*), the quest markers on the map (*Where you were told*, *On your compass*), *An arrow!*, the trades' articles (*an armourer*, *an Adept*) and *It's done.* shown only when something is done (Michael's note of 5 Oct, second sentence) are all good. The strongbox's keepsakes (*A lock of hair in paper*, *A child’s top*) are the best item names in the build. Finding 19 is old text in a line Session 597 changed.

**Drafted:** *The Makers' Things* (`docs/quest_drafts.md`), the first of the two runs Michael's B on #175 gives the quest writer.

### Finding 19 — main and auto/systems — every townsperson born in their town says *man and boy*

**Where.** `richTopics`, the *Who are you?* answer, `87-world-quests.js` (grep `man and boy`).

**Text.** *Born here. ${bio.years} years, man and boy.*

**Why.** Every woman in a town she was born in says *man and boy* of herself (a townsperson's sex is the name's, `female` in `makeDef`). The line needs neither sex nor people to say what it says, so it is mended once for all four peoples.

**Replacement.** `` `Born here, and here these ${bio.years} years.` ``

---

## Run 9 — 6 Oct 2026

About 110 new strings on main, 10 on auto/systems and 30 on auto/backlog; two findings, one new and one old. Since the world files have not moved since `178e96f`, this run went back to line diffs.

**main** (`178e96f..598e95e`). Findings 14, 15 and 16 are in the code as written: the Prior's tail by faction, the six claims by where the ship is, *The Compact mended the … and refitted her as a …*. The four feasts' greetings, the innkeeper's free meal and the guard's feast-day half-fine are the *Year's Names* draft word for word, and the French day names are the Church's. The dated work (*the date has passed. The work is taken back.*; *Pay is 40 gold; 50 if it is done by …*), the rest slip (*How long will you sleep?*, *Waiting restores nothing; a bed does.*, *You are ready to advance, but only sleep takes the level.*) and the journal's chrome are in the plain menu voice. The guild commissions only changed their ids. The cloak virtues (*barter +2% at Aurenne’s counters*) are item text and fine. Finding 18 is old text, found while drafting *First Words*.

**auto/systems** (Sessions 564–567). The Mages' Guild head's *Browse your wares.* and the light and robe armour names add nothing to judge.

**auto/backlog** (Sessions 568–573) and the three prototypes. The barber's panel brings Finding 17. *Press 'E' to sit in the barber’s chair*, *You rise from the chair, changed.* and *${fee} gold for the visit, whatever is changed; nothing, if nothing is.* are good.

Michael's note of 5 Oct on greetings (*"You're a markmen? those people kill bears at 10!"*) is a change of rule, not a line, so it is drafted, not found: *First Words*, `docs/quest_drafts.md`.

### Finding 17 — auto/backlog — the barber's panel speaks like the inquisitor

**Where.** The barber's chair, `92-creator.js` (grep `` You have not the ${fee} gold. ``).

**Text.** *You have not the 12 gold.* and *You have not the fee.*

**Why.** The panel is menu chrome, which says *Not enough gold* everywhere else. *You have not the sum, Master.* is the Church's inquisitor in `86-world-crime.js`, an Aurennais voice; in the chrome it reads as a slip.

**Replacement.** `` `Not enough gold: the visit is ${fee}.` `` and `'Not enough gold.'`

### Finding 18 — main — the pious temper prays to a Light the canon does not have

**Where.** `TEMPERS.pious`, `87-world-quests.js` (grep `The Light keeps this door.`). Any generated townsperson of any people can draw the temper.

**Text.** greet *The Light keeps this door.*; bye *Walk in light.*

**Why.** The gods are the Makers (§4.1) and the Church is the Church of the Weaver. There is no Light in the canon. It has been in the game since before the split and no run caught it.

**Replacement.** In `greet`, `"The Light keeps this door."` becomes `"The Weaver keeps this door."`. In `bye`, `"Walk in light."` becomes `"Go with the Weaver."`. The other four lines stay.

---

## Run 8 — 5 Oct 2026

About 140 new strings on main and 60 on auto/systems, three findings, all on main and all in the Compact's claim. Since Session 484 split the world file into nine, a line diff shows every world string as new; this run compared the sets of string literals at `551e9ec`, `0fbebd9` (run 7's systems head) and each branch head instead, and read what was new.

**main** (`551e9ec..178e96f`) carries Sessions 461–484 from auto/systems and the look sessions to 483. Findings 10–13 are in the code as written: Rowe found on the land greets you *Aye. Thought it'd be you.*; the Prior's after and claim lines are Aurennais; the doubled names are gone. The co-op door's menu text was read in run 7. New: the Compact's refit (Session 467, Michael's B on #128), which brings Findings 14–16. The mesh inspector (Sessions 492–494) is a developer's tool opened from the console; its labels are not read.

**auto/systems** (Sessions 485–503). *Too spent to break the guard.* is plain combat chrome. The dated work lines (*the date has passed. The work is taken back.*, *Pay is 40 gold; 50 if it is done by …*) are the game's plain terms and break no register. The Journal's chrome (*Nothing falls due.*, *Nobody has told you anything worth keeping yet.*, *Write a line of your own*) is in the menu voice. The shrine's *It is the Sea’s day. You are restored, and carry the Road two days.* reads right, and will read *It is Seaday.* with the names drafted this run (*The Year's Names*, `docs/quest_drafts.md`; the era is DECISION #146). The day and month placeholders in `CAL` are the subject of that draft, not findings.

**auto/backlog** (S505) adds no string.

### Finding 14 — main — the Prior is promised the house and the ship twice at the rank-up

**Where.** The faction's *Serve* turn-in, `87-world-quests.js` (grep `` There's ${F.house} in it, when you want it. ``).

**Text.** On the rank to Prior after *The Black Sail*: *The Compact names you Prior. The strait is quieter, and the Compact is in your debt, Prior, which it does not admit to many. A house and a ship are entered in your name; claim them when you please. Factor Rowe has gone north to the League, I am told. Their ledgers are shorter. There's a house and a ship in it, when you want it.* (The systems builder noted it in #old-gates, 4 Oct.)

**Why.** Finding 12's after already hands over the claim, and the tail says it again in a Markman's plain words (*There's … in it*) from an Aurennais mouth. The Crown's tail is a Gatelander lord's and wants his turn of phrase; the League's is a Markman's and is right as it stands.

**Replacement.** The tail, by faction, when `st.rank===3`:
- `compact`: nothing when `_aft` is not empty; otherwise `" A house and a ship are entered in your name, Prior; claim them when you please."`
- `crown`: `" There's a keep goes with it. A roof's only a roof till someone sleeps under it, so come and claim it when you will."`
- `league`: unchanged, `" There's a garrison in it, when you want it."`

### Finding 15 — main — the claim says *the ship at the quay* when the ship is elsewhere, on the bottom, or the one you had

**Where.** The rank-3 claim, `87-world-quests.js` (grep `` Entered in your name, Prior: the house, and the ship at the quay. ``), and what `grantShip` returns (`85-world-sea.js`).

**Text.** *Entered in your name, Prior: the house, and the ship at the quay.* — said in every case.

**Why.** Since Session 457 a Prior with no ship gets a sloop at the nearest Compact quay (Beaurouge, when the seat is inland Fortargent), and since Session 467 a Prior with a ship gets her refitted where she lies, or raised by the shipwright nearest her wreck. The line is true only when the seat is itself the port. The systems builder raised it on 4 Oct.

**Replacement.** `compactRefit` returns `{cls, up:!!next}` instead of `{cls}`, and the claim keeps `grantShip`'s result `g` and answers from it (`siteAnywhere` gives the shipwright's town):
- a new ship, at the seat (`g.id===site.id`): `"Entered in your name, Prior: the house, and the ship at the quay."`
- a new ship, at another port (`g.id` set and not the seat's): `` `Entered in your name, Prior: the house here, and the ship at the quay at ${g.name}.` ``
- refitted afloat, a class up: `` `Entered in your name, Prior: the house. You keep a ship already, so the Compact has seen to her where she lies: mended, and refitted as a ${g.cls}, at its own charge.` ``
- refitted afloat, already a galleon: `"Entered in your name, Prior: the house. You keep a ship already, so the Compact has seen to her where she lies: mended, at its own charge. There is no larger hull to enter."`
- sunk, being raised (`g.due!=null`): `` `Entered in your name, Prior: the house. Your ship lies on the bottom; the shipwright at ${(siteAnywhere(g.site)||{}).name||'the nearest quay'} has the Compact's order to raise her, a class better, and three days to do it.` ``
- no port found (`g` is null): `"Entered in your name, Prior: the house. The ship is entered also; the Compact will name her berth when it has one."`

### Finding 16 — main — the refit's log line puts *mended* last

**Where.** `compactRefit`, `85-world-sea.js` (grep `` refitted the ${nm} as a ${next}, mended. ``).

**Text.** *The Compact refitted the Kestrel as a cog, mended.*

**Why.** Narration, so no register to keep, but the trailing *mended* reads as a slip.

**Replacement.** `` `The Compact mended the ${nm} and refitted her as a ${next}.` `` The other three refit lines stand.

---

## Run 7 — 4 Oct 2026

About 60 player-readable strings read, and four findings, all on auto/systems. Each was raised by the systems builder in #old-gates (Sessions 445, 458 and 460) and checked here against the code.

**main** (`206b697..551e9ec`) is the merge of the rivers (Sessions 430–433) and the look sessions 414–435, both read in run 6, plus Session 453 (tests only) and the build tag. Finding 9's peaks and lakes are as run 6 left them on main; the fix is on auto/systems and arrives with its merge.

**auto/systems** (Sessions 442–460). Findings 7, 8 and 9 are in the code word for word: `INN_ROOM_LINES` carries the four voices as written, the coaching inn passes its nation's people, the French long names read as French, and the peaks and lakes take their people's word (*Sliabh*/*Cnoc*, *Mont*/*Pic*, *Fell*/*Tor*, *Loch*/*Lac*/*Mere*, and *La* for Aurenne's rivers). The new lines read well: the log's *The Compact deeded you a ship at* PORT is plain narration, and Rowe found in her own words (Session 457) takes the generic *Home? Yes. Yes, all right.* off her. Sessions 451 (the Torch at the counter) and 455–460 add no other new string, but walking Rowe's three lines brought older lines into view: Findings 10–12. Finding 13 is the doubled names the builder found in forts and gates after Finding 8.

**auto/fable-co-op-door** (the two saves, character and world; Michael's A on #119) adds menu and toast text: *No world was saved with this character — the world starts fresh.*, the export and import toasts, and the buttons *⤒ Export* and *⤱ World* with their tooltips. All of it is out-of-world chrome in the game's plain menu voice, and none of it breaks a register.

### Finding 10 — auto/systems — Rowe, found on the land, speaks as a stranger to the place

**Where.** The `find` spawn in the world tick (grep `if(q.kind==='find'&&!q.data.spawned`). Rowe is built by `makeDef(site,…,'Villager',…)` from the seat's site, then made a Markman.

**Text.** Her greeting comes from the Villager pool (*Fine day for it.*, *You're not from here. That's all right.*, *Keep to the road after dark.*, *Haven't seen a traveller in a week.*). Her topics are the townsperson's: *What is this place?* answered with the seat's blurb, though she sits on open ground three days out; *Where do the roads go?*; *Anything dangerous nearby?*; and *Any news?* from the seat's region's rumours. Her role shows as *Villager*.

**Why.** She is the rival of three faction lines, a Markman (§2: short sentences, *aye*), and one rank above the player. A Villager's stock line, and a description of a town she is not standing in, make her a stranger in her own scene.

**Replacement.** When `q.rival` is set:
- `role` is her rank: `Warden` (crown), `Reeve` (league), `Factor` (compact).
- `greeting` is `["Aye. Thought it'd be you. Sit, if you're stopping — I'm not getting up yet."]`
- Her topics are only `q.data.topics` (*The seat sent me for you.*, unchanged) and *Farewell.*. No place, roads, dangers, news or folders.

### Finding 11 — auto/systems — the three *Where is Rowe?* briefs say it twice, and the Compact's sends you to the wrong place

**Where.** `FLINES` (grep `title:'Where Is`) and `factionQuestFor`, which appends the town quest's own words to an authored brief (grep `const mech=q.desc.replace`).

**Text.** The journal reads, for each faction:
- Crown: *Rowe rode out three days ago on Crown business and hasn't sent word. That isn't like her. Rowe went out north three days ago and hasn't come back. Find her — there's a camp out that way — and bring her back.*
- League: *Rowe went up the hill road alone. Reeves don't go alone. Find her. Rowe went out north three days ago and hasn't come back. Find her — there's a camp out that way — and bring her back.*
- Compact: *Rowe went to a gate the Church had sealed. She should not have. Find her — and don't touch the seal. Rowe went out north …*

**Why.** Each brief says *three days* or *Find her* twice. The Compact's sends you to a sealed gate and tells you not to touch its seal, but she sits by a camp on open ground and there is no seal to touch. The Compact's lord is Aurennais and gives the order with no honorific or qualifier.

**Replacement.** For a rival `find`, the description is the brief alone, with `{dir}` the compass word from the seat to her spot (`compassWord(q.data.x-site.x,q.data.z-site.z)`). Do not append the town quest's words:
- crown: `"Rowe rode out {dir} three days ago on Crown business and hasn't sent word, and a Warden who sends no word is a letter you'd rather not open. There's a camp out that way. Bring her back to us."`
- league: `"Rowe took the hill road {dir}, alone. Reeves don't go alone. There's a camp out that way. Bring her back."`
- compact: `"Factor Rowe went {dir} to look at a gate the Church had sealed, without the Compact's leave, and has not reported since. The seal is whole, I am told, and she is not at it. There is a camp in that country. Kindly bring her back to her ledgers."`

### Finding 12 — auto/systems — the Prior is given the house and the ship twice, and Rowe is called *cold-eyes*

**Where.** The Black Sail's `after` in `FLINES.compact` (grep `The strait's quieter`), and the rank-3 claim (grep `` `Claim ${F.house}.` ``).

**Text.** After *The Black Sail*: *The strait's quieter. Prior — and the house and the ship are yours. Rowe's gone north with the League, they say. Cold-eyes always find their own.* Then the topic *Claim a house and a ship.* answers *It's yours. The ship is at the quay under your name.*

**Why.** The turn-in hands over the house and ship, and the next topic hands them over again. *Cold-eyes* is the word for the Old Blood (§2), and Rowe is a Markman. Run 3 noted this, and the *Yard* draft owed it. The speaker is Aurennais, so the lines want an honorific and a qualifier, and *they say* is a Gatelander's hedge, not a Factor's.

**Replacement.**
- after: `"The strait is quieter, and the Compact is in your debt, Prior, which it does not admit to many. A house and a ship are entered in your name; claim them when you please. Factor Rowe has gone north to the League, I am told. Their ledgers are shorter."`
- the claim's response, for `compact` only: `"Entered in your name, Prior: the house, and the ship at the quay."` The Crown's and the League's stay *It's yours.*

### Finding 13 — auto/systems — forts, peaks, lakes and gates still double a word

**Where.** `genName` in the world module (grep `function genName`), which names forts (`… Hold/Keep/Watch/Gate/Tower`), peaks and lakes. `uniqueSiteNames` already renames a doubled *place*, but nothing renames these. And `dungeonName` in `20-quests.js`, which names the generated gates, including the Act II etched gates.

**Text.** *Montmont Tower*, *Clairclair Keep*, *Ardard Watch*, *Mont Montmont*; and *The Lost Chasm of the Lost*, *The Deep Depths of the Deep*, *The Whispering Manse of Whispers*, *The Ruined Ruin of Ash*.

**Why.** It is Finding 8's fault in the names Finding 8 did not reach. A name that says its word twice reads as a stammer in every people's register.

**Replacement.** Both changes draw nothing new from the RNG, so only names that doubled change: 552 of 30,000 gate names (seeds 0–4,999, six themes), for example *The Lost Chasm of Silence*, *The Deep Abyss of Ash*, *The Ruined Remnant of Ash*. A save keeps its ids, and an etched gate already in `worldState.story.gates` keeps its old name.

```js
function genName(r,reg){const s=SYL[reg]||SYL.irish;const a=s[0][Math.floor(r()*s[0].length)];let k=Math.floor(r()*s[1].length);if(a.replace('-','').toLowerCase()===s[1][k])k=(k+1)%s[1].length;const b=s[1][k];return a.endsWith('-')?a+b.charAt(0).toUpperCase()+b.slice(1):a+b;}
```

In `dungeonName`, replace the last four lines with:

```js
  const pre=pick(PREFIXES[theme]||PREFIXES.ruins,1);
  const NL=NOUNS[theme]||NOUNS.ruins,lc=w=>{w=w.toLowerCase();return w==='depths'?'deep':w;},same=(a,b)=>{a=lc(a);b=lc(b);const n=Math.min(4,a.length,b.length);return a.slice(0,n)===b.slice(0,n);};
  let ni=h(seed*37+2)%NL.length;if(same(NL[ni],pre))ni=(ni+1)%NL.length;const noun=NL[ni];
  const said=[pre,...noun.split(' ')];let si=h(seed*37+3)%SUFFIXES.length;
  while(SUFFIXES[si].split(' ').filter(w=>w!=='of'&&w!=='the').some(w=>said.some(x=>same(x,w))))si=(si+1)%SUFFIXES.length;
  return `The ${pre} ${noun} ${SUFFIXES[si]}`;
```

**Noted, not findings** (canon against canon; for the author):
- *How many died at Ashenmoor.* Varek's verbatim line (`quest_writing.md`, his strongest line) says *Forty-three people died in Ashenmoor when the binding broke.* Edna's board in the legacy village (grep `FORTY-ONE souls at dawn`) counts forty-one at dawn and fourteen at dusk, and names eleven dead and two travellers *whose names we did not record*; the others fled east. The two can stand together only if the dead include the fled who died on the road. The draft *The Last Entry* (below, in `quest_drafts.md`) gives Ashenmoor's names without a number, so it takes neither side.

---

## Run 6 — 3 Oct 2026

About 75 player-readable strings read. Three findings: one on main (older lines that Session 424 touched), one on auto/systems, one on auto/fable-rivers.

**main** (`6edf854..206b697`) is the systems merge of Sessions 404–429. Findings 5 and 6 are in the build word for word: the shipwright speaks in his harbour's people's voice, and *Eadwulf* and *Wigmund* stand in the Mark's bank where *Aldhelm* and *Ealdred* were. The new narration reads well: the fall (*You roll with the fall. N damage.*, *A hard landing. N damage.*), the master's slam (*You roll through the blow.*, *The ground cracks where you stood.*), the ram (*You ram her*, *The black sail rams you*, *The hulls strike. Hull −N.*), the inn's doors (*Another guest's room.*, *An empty room, not the one you took. Yours is the second door on the right.*), and the dialogue hint, *1–9, 0 to choose*. Session 424 changed how the innkeeper names your room, and that brings the innkeeper's room lines into the window. They are Finding 7.

**auto/systems** (Sessions 430–441) adds one rule a player reads: Session 432 gives every place its own name (Michael's A on #110), and when a culture's bank runs out it builds longer names. The Irish and Anglo long forms read as real names (*Ballynamore*, *Oxenford*). The French ones do not. That is Finding 8. Corwin following you along the coast, the guards standing down and the sacked towns change no line.

**auto/backlog** (Sessions 414–435: the jab's guard, the ragdolls) adds no string a player reads.

**auto/fable-rivers** (Sessions 430–433) names the ranges, the rivers and the lakes. The rivers are named by nation and read well: *An Dubh*, *An Bhán* and *An Ghlas* follow *An Dearg*, with the lenition right for a feminine river, and the Mark's *Blackwater* and *Wulfwater* are good Anglo. The peaks and lakes take their word at random or out of order. That is Finding 9.

**Noted, not findings** (older than the baseline; for the producer and the author):
- *Gatelands places with names from no people.* The critic heard *Biafaira*, *Fiandbaios* and *Dotriair* among the Gatelands ports (2 Oct). They come from the five generated cultures (`makeCulture`, grep `CUL_ONSETS`). `cultureOfCell` gives each province the culture of its nearest culture capital, whatever the island, so a Gatelands province can be named, styled and peopled in rumours from syllables no people speaks, or in French or Anglo. Canon §1.5 says the opposite: *inland provinces are homogeneous: one people, one house style, one dialect, one set of names*, and §2 fixes each people's register. The people in those provinces already take the nation's people (`nationOf(ci,cj).people`), so the person and the place disagree. The plain fix is one line, `cultureOfCell` returning the nation's register (`irish`, `anglo`, `french`) with blends only at ports. But it renames places in every save and changes house styles, as #110 did, so it is Michael's call and not a finding. I have not opened a decision. The producer may want to put it to him beside #110's follow-up.
- `genName`'s French short names, older than Session 432, print *Saint-rouge* and *Saint-ferrand* with a small letter after the hyphen. Finding 8 corrects that as well, since the two must agree.

### Finding 7 — main — the innkeeper lets the rooms in one voice

**Where.** `innTopics(house)` in the world module (grep `a bed, a bolt on the door`). Session 424 changed `innRoomName`, so these lines are in this window. The text itself is older (v80 S141, noted in run 2). The coaching inn uses the same function (grep `_extra:innTopics(house)`), so its Aurennais keeper greets *Be welcome, Master* from Finding 4 and then lets the room with *Suit yourself. The fire's free.* One person, two voices.

**Text.**
- `'Your room’s made up already. Upstairs.'` / `` `${Room} — made up already. The key’s in the door.` ``
- `'The house is empty tonight.'` / `'One other guest in tonight.'` / `` `${taken} guests in tonight.` ``
- `` `${others} A room is ${price} gold — ${room}, a bed, a bolt on the door, and breakfast if you’re up for it. Shall I make it up?` ``
- `'Every room’s taken tonight, and I’ll not put two strangers in one. The fire’s free.'`
- `` `That’s ${price} gold, and you’ve ${gold}. Come back with it.` ``
- `` `${price} gold, thank you. ${Room}, up the stairs — yours till this time tomorrow. The other doors aren’t mine to open.` ``
- *Not tonight.* → `'Suit yourself. The fire’s free.'`

**Why.** The innkeeper has a people (`def.people`, from `makeDef`), and the coaching inn's keeper has `nationOf(ci,cj).people`. The lines are good Markish and wrong in a Gatelands or Compact house. It is the same fault as Findings 1–5, with the same fix.

**Replacement.** `innTopics(house, people)`. The town inn passes `def.people` (grep `def._extra.unshift(...innTopics(house))`), and the coaching inn passes `nationOf(ci,cj).people`. Where there is no row, use `markman`, which is today's text unchanged. `R` is the room's name with its first letter capitalised, as the code makes it now, and `r` is the room's name as it is. The player's own labels (*A bed for the night?*, *Yes. N gold.*, *Not tonight.*) and the log line stay.

```js
const INN_ROOM_LINES={
  gatelander:{
    made:'Your room’s made up already, and the bed’s getting no warmer for the waiting. Upstairs.',
    madeNamed:R=>`${R}, made up already. The key’s in the door, where a key does the most good.`,
    empty:'The house is empty tonight, and an empty house is a cold one, so you’re doubly welcome.',
    one:'There’s one other guest in tonight.',
    many:n=>`There’s ${n} guests in tonight.`,
    offer:(o,p,r)=>`${o} A room is ${p} gold — ${r}, a bed, a bolt on the door, and breakfast if you’re up for it. Will I make it up for you?`,
    full:'Every room’s taken tonight, and two strangers in the one room never made a friend of either. The fire’s free, and the chair by it.',
    poor:(p,g)=>`That’s ${p} gold, and you’ve ${g}. A purse is like a well: you’ll not draw from it what isn’t in it. Come back when it’s filled.`,
    paid:(p,R)=>`${p} gold, and thank you. ${R}, up the stairs, and yours till this time tomorrow. The other doors aren’t mine to open, nor yours either.`,
    not:'The road’s long and the night’s longer. The fire’s free, if you change your mind.'},
  markman:{
    made:'Your room’s made up already. Upstairs.',
    madeNamed:R=>`${R} — made up already. The key’s in the door.`,
    empty:'The house is empty tonight.',
    one:'One other guest in tonight.',
    many:n=>`${n} guests in tonight.`,
    offer:(o,p,r)=>`${o} A room is ${p} gold — ${r}, a bed, a bolt on the door, and breakfast if you’re up for it. Shall I make it up?`,
    full:'Every room’s taken tonight, and I’ll not put two strangers in one. The fire’s free.',
    poor:(p,g)=>`That’s ${p} gold, and you’ve ${g}. Come back with it.`,
    paid:(p,R)=>`${p} gold, thank you. ${R}, up the stairs — yours till this time tomorrow. The other doors aren’t mine to open.`,
    not:'Suit yourself. The fire’s free.'},
  aurennais:{
    made:'Your room is made up, Master, as agreed. Upstairs.',
    madeNamed:R=>`${R}, Master, made up as agreed. The key is in the door.`,
    empty:'The house has no other guests tonight, Master.',
    one:'One other guest is entered tonight, Master.',
    many:n=>`${n} guests are entered tonight, Master.`,
    offer:(o,p,r)=>`${o} A room is ${p} gold: ${r}, a bed, a bolt on the door, and breakfast at the posted hour. Shall I enter you for it?`,
    full:'Every room is let tonight, Master, and the house does not lodge two strangers in one room. The fire is free of charge.',
    poor:(p,g)=>`The room is ${p} gold, Master, and you have ${g}. The house does not extend credit.`,
    paid:(p,R)=>`${p} gold, received with thanks. ${R}, up the stairs, until this hour tomorrow. The other doors are let to others, and are not mine to open.`,
    not:'As you wish, Master. The fire is free of charge.'},
  oldblood:{
    made:'Your room is ready. Upstairs.',
    madeNamed:R=>`${R}. Ready. The key is in the door.`,
    empty:'No one else tonight.',
    one:'One other tonight.',
    many:n=>`${n} others tonight.`,
    offer:(o,p,r)=>`${o} ${p} gold. ${r[0].toUpperCase()+r.slice(1)}, a bed, a bolt, bread in the morning. Shall I make it ready?`,
    full:'Every room is taken. I do not put strangers together. The fire is free.',
    poor:(p,g)=>`${p} gold. You have ${g}.`,
    paid:(p,R)=>`${p} gold. ${R}, up the stairs, until this hour tomorrow. The other doors are not mine to open.`,
    not:'The fire is free.'}};
// const L=INN_ROOM_LINES[people]||INN_ROOM_LINES.markman;
// mine==null ? L.made : L.madeNamed(R); others = taken===0 ? L.empty : taken===1 ? L.one : L.many(taken);
// response L.offer(others,price,r); full L.full; poor L.poor(price,gold); paid L.paid(price,R); Not tonight L.not.
```

### Finding 8 — auto/systems — the French long names are not French

**Where.** `nameBanks(reg)` in the world module (grep `'-le-'+cap(b2)`), Session 432. The short-name half of the same fix is `genName` (grep `function genName`), which is older.

**Text.** The long French form is `a+b+'-le-'+cap(b2)`, from `SYL.french`. It gives names like *Saint-ferrand-le-Rouge*, *Montmont-le-Brun*, *Clairclair-le-Vert*, *Beauneuf-le-Argent* and *Valclair-le-Ancy*. The short list it starts from includes *Montmont*, *Clairclair* and *Saint-rouge*, and `genName` draws the same short names for every French place.

**Why.** A French place name puts a whole word after *le*. *-ancy* is an ending, not a word, so *le Ancy* means nothing. *Argent* takes *l'*, not *le*. Two halves that are the same word (*Montmont*, *Clairclair*, and in the Irish bank *Ardard*) read as a stammer. After *Saint-* the name takes a capital. The Aurennais are the people of *ledgers, learning, paper over oaths* (§1.3). Their place names are the ones most likely to be spelled right on a map.

**Replacement.**
- In `genName`, a first half that ends in a hyphen takes a capital after it. This changes no draw:
  ```js
  function genName(r,reg){const s=SYL[reg]||SYL.irish;const a=s[0][Math.floor(r()*s[0].length)],b=s[1][Math.floor(r()*s[1].length)];return a.endsWith('-')?a+b.charAt(0).toUpperCase()+b.slice(1):a+b;}
  ```
- In `nameBanks`, the short names are built the same way and skip a doubled pair. The French long form takes a short name and one of six real qualifiers:
  ```js
  function nameBanks(reg){const s=SYL[reg]||SYL.irish,A=s[0],B=s[1],short=[],long=[];
    const cap=w=>w.charAt(0).toUpperCase()+w.slice(1);
    A.forEach(a=>B.forEach(b=>{if(a.toLowerCase()===b)return;short.push(a.endsWith('-')?a+cap(b):a+b);}));
    if(reg==='irish')A.forEach(a=>B.forEach(b=>long.push(a+'na'+b)));
    else if(reg==='french')short.forEach(n=>['-sur-Mer','-le-Vieux','-la-Forêt','-en-Val','-les-Prés','-sous-Bois'].forEach(q=>long.push(n+q)));
    else if(reg==='anglo')A.forEach(a=>B.forEach(b=>long.push(a+'en'+b)));
    else A.forEach(a=>A.forEach(a2=>{if(a2!==a)B.forEach(b=>long.push(a+a2.toLowerCase()+b));}));
    return [short,long];}
  ```
- In `uniqueSiteNames`, a drawn name whose two halves are the same word counts as lost, so it is renamed from the bank: `for(const t of list){if(taken.has(t.name)||/^(.+)\1$/i.test(t.name))lost.push(t);else taken.add(t.name);}`.

### Finding 9 — auto/fable-rivers — the peaks and lakes take their word from the wrong tongue

**Where.** The peaks (grep `['Sliabh','Mont','Ben','Cnoc']`), the lakes (grep `['Loch','Lac','Mere']`) and `RIVER_NAMES.aurenne`, Session 432.

**Text.**
- Peaks: `` `${['Sliabh','Mont','Ben','Cnoc'][Math.floor(rp()*4)]} ${genName(rp,reg)}` `` gives *Mont Ballymore* in the Gatelands, *Sliabh Ashford* in the Mark and *Ben Beaumont* in Aurenne. *Ben* is the Scots word, and no people of the canon speaks Scots.
- Lakes: `` `${['Loch','Lac','Mere'][…]} ${genName(rl,c.reg)}` `` gives *Mere Ashford* in the Mark. A generated culture falls to *Loch*.
- Rivers in Aurenne: `'la Dorée','la Blanche','la Sauvage','la Verte','la Lente','la Claire'`, with a small *la* at the start of a name that heads a map label or a line (*la Dorée is in flood* would be wrong).

**Why.** A feature's word is the people's word, as the river names already are (§1.5, §2). The Gatelands say *Sliabh* and *Cnoc*, Aurenne *Mont* and *Pic*. In the Mark's Anglo register the hill word comes after the name, as *mere* does (*Ashford Fell*, *Grimley Mere*).

**Replacement.** The forms are chosen by the place's register. A generated culture takes its nation's people's register. One `rp()` is still drawn for the form before `genName`, so no later draw moves.

```js
const PEAK_FORM={irish:[n=>`Sliabh ${n}`,n=>`Cnoc ${n}`],french:[n=>`Mont ${n}`,n=>`Pic ${n}`],anglo:[n=>`${n} Fell`,n=>`${n} Tor`]};
const LAKE_FORM={irish:n=>`Loch ${n}`,french:n=>`Lac ${n}`,anglo:n=>/mere$/.test(n)?`${n} Water`:`${n} Mere`};
const REG_OF_PEOPLE={gatelander:'irish',markman:'anglo',aurennais:'french',oldblood:'irish'};
function formReg(reg,i,j){return PEAK_FORM[reg]?reg:REG_OF_PEOPLE[nationOf(i,j).people]||'irish';}
// peaks: const f=PEAK_FORM[formReg(reg,i,j)][Math.floor(rp()*2)]; … name:f(genName(rp,reg)) …
// lakes: lk.name=LAKE_FORM[formReg(c.reg,i,j)](genName(rl,c.reg));
// RIVER_NAMES.aurenne:['La Dorée','La Blanche','La Sauvage','La Verte','La Lente','La Claire']
```

---

## Run 5 — 2 Oct 2026

About 55 player-readable strings read. Two findings: one on auto/systems, and one in the name bank on main that the critic met in play this week.

**main** (`7733a5b..6edf854`) is the systems merge of Sessions 382–401 and the look sessions merged with it. The new strings are cargo trading at the harbourmaster's (*Cargo — the factor’s prices*, *Bought a sack of grain for N gold.*, *Sold a crate of dyes for N gold (the Compact's tithe, N).*, *That is not sold here.*, *A horse goes in a ship's hold, and your ship is not here.*), the pirates at the hold (*They come over your rail behind you and take 2 × crate of iron from the hold.*), *Raiders! N of them. Hold {town}.*, and the controls line's *Middle-click or R — lock on*. All of it is UI or narration, and it reads well. The goods are plain and right by island: grain, wool, hides and horses from the Gatelands, iron, silver, timber and furs from the Mark, salt, dyes, glass and fish from Aurenne (§1.1–1.3).

**auto/backlog** (Sessions 394–410: the armour kit, fists, the helmed foes) adds no string a player reads.

**auto/systems** (Sessions 404–413) adds the cavern master's slam (*{name} rears up to strike the ground.*, *The ground cracks where you stood.*), the checked blow at the yield (*You check the blow.*), and the ship's wear: *Aground — shallows ahead.*, *The {ship} is waterlogged. She will make two knots and a half.*, *The {ship} goes down. Any shipwright can raise her.*, the wreck on the map (*Where she went down*) and the sea bar (*Sea: rough*). The narration is clean. The shipwright's new replies are Finding 5.

**Noted, not findings** (older than the baseline; for the author's audit). Read while drafting this run's *Back to Their Bread*:
- Varek at the Ashfeld (`tickAshfeld`, grep `They were never a loom`) says the sigils are *a window* and that he has spent two hundred years *pulling the shutters*, and *I'll help you close them* sets the choice to `help`. Canon §3.1 has his heresy as *"they built a cage and called it a loom"*, about the Clearing, and §11 has *help him* mean *unbind*. As written, helping Varek means closing, which is the canon's *stop him*. The Root's three choices (*Break it*, *Seal it*, *Leave it open*) are the canon's and are not tied to the Ashfeld answer, so nothing breaks in play, but the field scene argues the opposite of his canon position.

### Finding 5 — auto/systems — the shipwright speaks Markish in every harbour

**Where.** `upgradeTopics(site)` in the world module (grep `Lads'll have her alongside`), Sessions 411 and 413. The two older replies in the same function (grep `That canvas is` and `The carpentry's`) are older than the baseline. They are the same exchange and should change with it, as Finding 3 did with Finding 2.

**Text.**
- *Raise the {ship}*: `` `Raising her is ${c} gold.` `` / `` `Three days, and she'll be lying at the quay here.` ``
- *Fetch the {ship} to this harbour*: `` `Bringing her round is ${fee} gold.` `` / `` `Lads'll have her alongside by the time you've finished your drink. She's at the quay.` ``
- *Mend her*: `` `Putting her right is ${m.gold} gold.` `` / `` `${h===1?'An hour':h+' hours'} in the yard. She's sound again, hull and rig.` ``
- *Refit her as a {class}*: `` `A ${next} hull is ${p} gold.` `` / `` `She's a ${next} now. Longer, broader, and she'll carry more sail.` ``
- *Better sails* (older): `` `That canvas is ${p} gold.` `` / `` `New canvas. She'll make ${k} knots with a wind.` ``
- *Bigger hold* (older): `` `The carpentry's ${p} gold.` `` / `` `More room below. You'll carry ${n} more aboard her.` ``

**Why.** The shipwright is a townsperson of the harbour's people, with a name from that people's bank. The replies are good Markish (*Lads'll*, short and bare) and wrong in a Gatelands or Compact port. An Aurennais yard quotes terms and says *Master*; a Gatelander turns a price into a proverb. It is the same fault as Findings 1–4, and it has the same fix.

**Replacement.** Pick by `peopleOfSite(site)`. Where there is no row, use `markman`, which is today's text unchanged. `hw` is the hour phrase the code already builds (`h===1?'An hour':h+' hours'`); `k` is `shipTopSpeed().toFixed(1)`; `n` in `held` is `25*(cargo+1)`.

```js
const SHIPWRIGHT_LINES={
  gatelander:{
    raisePoor:c=>`Raising her is ${c} gold. The sea gives nothing back for less, and it gives grudgingly then.`,
    raised:`Three days, and she'll be lying at the quay here, Weaver willing. A drowned boat comes up slow, like a man who knows he's in the wrong.`,
    fetchPoor:f=>`Bringing her round is ${f} gold. A boat on the wrong shore is no boat at all, but a shipwright working for thanks is no shipwright either.`,
    fetched:`The lads'll have her alongside before your cup's cold. She's at the quay.`,
    mendPoor:g=>`Putting her right is ${g} gold. A stitch in time, they say, and they never once say it's free.`,
    mended:hw=>`${hw} in the yard, and she's sound again, hull and rig. Treat her kindly and she'll return it.`,
    refitPoor:(n,p)=>`A ${n} hull is ${p} gold. A bigger boat's a bigger bill, the same as a bigger house.`,
    refitted:n=>`She's a ${n} now. Longer, broader, and she'll carry more sail. You'll hardly know her, and she'll hardly know you.`,
    sailsPoor:p=>`That canvas is ${p} gold. Good cloth was never cheap, and cheap cloth was never good.`,
    sailed:k=>`New canvas. She'll make ${k} knots with a wind, and the wind is the Weaver's business, not mine.`,
    holdPoor:p=>`The carpentry's ${p} gold. Wood is dear, and the joiner dearer.`,
    held:n=>`More room below. You'll carry ${n} more aboard her, and you'll find a way to fill it.`},
  markman:{
    raisePoor:c=>`Raising her is ${c} gold.`,
    raised:`Three days, and she'll be lying at the quay here.`,
    fetchPoor:f=>`Bringing her round is ${f} gold.`,
    fetched:`Lads'll have her alongside by the time you've finished your drink. She's at the quay.`,
    mendPoor:g=>`Putting her right is ${g} gold.`,
    mended:hw=>`${hw} in the yard. She's sound again, hull and rig.`,
    refitPoor:(n,p)=>`A ${n} hull is ${p} gold.`,
    refitted:n=>`She's a ${n} now. Longer, broader, and she'll carry more sail.`,
    sailsPoor:p=>`That canvas is ${p} gold.`,
    sailed:k=>`New canvas. She'll make ${k} knots with a wind.`,
    holdPoor:p=>`The carpentry's ${p} gold.`,
    held:n=>`More room below. You'll carry ${n} more aboard her.`},
  aurennais:{
    raisePoor:c=>`The raising is ${c} gold, Master, payable before the work.`,
    raised:`Three days, Master, and she will be lying at the quay here. The yard's receipt is entered.`,
    fetchPoor:f=>`Bringing her round is ${f} gold, Master. The fee covers the crew and the tow.`,
    fetched:`The yard's crew has her alongside, Master. She is at the quay, as agreed.`,
    mendPoor:g=>`The repair is ${g} gold, Master, at the yard's posted rate.`,
    mended:hw=>`${hw} in the yard, Master. She is sound again, hull and rig, and the work is warranted to the next storm, if not through it.`,
    refitPoor:(n,p)=>`A ${n} hull is ${p} gold, Master. The yard does not extend credit on hulls.`,
    refitted:n=>`She is a ${n} now, Master: longer, broader, and rated for more sail. The new rating is entered against her name.`,
    sailsPoor:p=>`That canvas is ${p} gold, Master.`,
    sailed:k=>`New canvas, Master. Under a fair wind she should make ${k} knots. The yard warrants the cloth, not the wind.`,
    holdPoor:p=>`The joinery is ${p} gold, Master.`,
    held:n=>`More room below, Master. She is rated for ${n} more aboard.`},
  oldblood:{
    raisePoor:c=>`${c} gold, to raise her.`,
    raised:`Three days. She will be at the quay.`,
    fetchPoor:f=>`${f} gold, to bring her round.`,
    fetched:`She is at the quay.`,
    mendPoor:g=>`${g} gold.`,
    mended:hw=>`${hw} in the yard. Sound again, hull and rig.`,
    refitPoor:(n,p)=>`A ${n} hull is ${p} gold.`,
    refitted:n=>`A ${n} now. Longer. Broader. More sail.`,
    sailsPoor:p=>`${p} gold, the canvas.`,
    sailed:k=>`New canvas. ${k} knots, with a wind.`,
    holdPoor:p=>`${p} gold, the joinery.`,
    held:n=>`More room below. ${n} more.`}};
// const L=SHIPWRIGHT_LINES[peopleOfSite(site)]||SHIPWRIGHT_LINES.markman; each return in upgradeTopics takes its row.
```

### Finding 6 — main — two names in the Mark's bank break the Ald- rule

**Where.** `NAMES.anglo.m` in the world module (grep `'Wulfstan','Eadric','Godwin'`). It is older than the baseline. It is a finding because it breaks a rule the canon states outright, and the critic met it in play this week: the yard-sergeant at Caer Slige was *Aldhelm* (critic, 1 Oct).

**Text.** `'Aldhelm'` and `'Ealdred'` in the list of men's names.

**Why.** Canon, *Personal-name conventions*: the Ald- root belongs to Aldwyn and to Aldred, Varek's birth name, and *avoid reusing the Ald- prefix for any other character. The rhyme is load-bearing.* Brother Oswin was renamed from *Brother Aldhelm* for exactly this. *Ealdred* is the Old English spelling of *Aldred* itself, so any Markish sergeant or keeper can carry the villain's buried name. The Act II reveal depends on that name being heard nowhere else.

**Replacement.** In `NAMES.anglo.m`, `'Aldhelm'` becomes `'Eadwulf'` and `'Ealdred'` becomes `'Wigmund'`. Neither is a named character, and neither takes the Ald- root. Names already saved on generated people (`_curNM`) keep whatever they were given, and that is the builder's call. The place-name syllable `'Ealdor'` in the town-name parts names places, not people, and stays.

---

## Run 4 — 1 Oct 2026

About 70 player-readable strings read. All of it is clean, and there are no findings this run.

**How it was read.** Main went from one file to `index.html` plus 33 files in `js/` (Session 379), so a plain diff of `index.html` shows the whole script deleted. The new tree was joined back into one file with `scripts/join.py --out`, and that was diffed by word against `421afdf:index.html`. The joined file differs from the pre-split `e994dbf` only by the build tag.

**main** (`421afdf..7733a5b`) is the systems merge of Sessions 342–378 and the look merge of 275–377, and then the split, which changed no string. Almost every new line is *The Yard at Caer Slige*, built in Sessions 373–374. Every line of that draft's sections 1–9 is in the build word for word: the brief, the sergeant's rules, Rowe's four greetings, the watchers' calls, the yield, the three ways to lose, both turn-ins, Rowe at the seat in both states and the murder rumour. One placeholder was filled: *The ring goes up again on the {weekday or 'seventh day'}* became *in seven days*, which is plain and right. The build also puts *The Captains' League names you Captain.* in capitals, as the draft asked. Section 10, the Compact's *cold-eyes* line, was left for the author, as it should be.

The rest is UI and narration, and it reads well: *A bedroll — Press 'E' to rest and take your level*, *{item} is not worth a coin at the counter.*, the coach's *leaves at six* / *leaves at six in the evening* / *goes on when the road is clear*, and the Fortune card's *+N% gold found*, *+N% item drop chance*.

**Every other branch** is level with main or ahead in docs only.

---

## Run 3 — 30 Sep 2026

About 140 player-readable strings read. All of it is clean, and there are no findings this run.

**main** (`8c0d74a..421afdf`) is almost all the auto/systems merge, sessions 176–341. It carries Findings 1–4 into the build word for word: the guild heads, the halt, the yield and the coaching inn now speak in their people's voice, with Markish as the fallback. The rest is UI: the combat lines, the Fortune card, the coach prompts, *The door you saved behind has moved on*, and *Luibh Uisce — Mana fully restored!*.

**auto/systems** since main (sessions 350–359) adds narration only. *The {build} at {town} is/are standing. {lord} will want to see you.* reads well.

**auto/backlog** (sessions 342–356) and **auto/proto-sails** add no strings a player reads.

**Noted, not findings.** These are older than the baseline, so they go to the author's audit. The quest draft *The Yard at Caer Slige* covers the first two.
- The Compact's ninth *after* line calls Hesket Rowe, a Markman, *cold-eyes*, which is the word for the Old Blood.
- The faction rank line opens in lower case: *"the Captains' League names you Captain."*
- The lord's turn-in lines (*Good.* / *The town won't forget it.* / *There'll be more.*) and *How fares the town?* speak in one voice for every people, as the inn's lines do.

---

## Run 2 — 29 Sep 2026

About 110 player-readable strings read. **main** (`bd5ca7a..8c0d74a`, the look sessions 166–274 and the docs merges) adds none a player reads: the bridge and wyrm names were only re-commented. **auto/backlog** (sessions 284–296) is clean too. The black sail's *a black-sailed ship* is unchanged. **auto/systems** (sessions 265–299) has one finding. Run 1's three findings went into Session 265 word for word: the guild heads, the halt and the yield now choose their lines by the town's people. The combat lines (*Too winded to roll.*, *Your guard breaks!*, *(RIPOSTE)*, *(FINISHER)*, *strikes empty air*) are UI, and they read well. The Q7-in-the-world sessions only moved existing strings.

### Finding 4 — auto/systems — the coaching inn speaks Markish on every road

**Where.** `coachInn()` in the world module (grep `Fire's lit. Take a seat.`), `seatTopic()` (grep `Your name's on it`), and `coachInnFolk()` (grep `Horses first, then me.`), Sessions 237–238 and 267.

**Text.**
- Keeper greeting: `"Fire's lit. Take a seat."`, `"Bed's upstairs. Bowl's on the way."`, `"We don't ask where you've been. Boots off, though."`
- *What is this place?*: `` `${name}, halfway between ${A} and ${B}. The coach stops, we feed whoever gets off, and the horses drink.` ``
- *My seat on the coach?*: `` `The ${t} for ${d}. Your name's on it. If you're not at the door when it calls, it waits — an hour, no more.` ``
- *A seat on the next coach?*: `` `The ${t} for ${d}. It's yours, and it costs nothing; the driver knows to wait. An hour, no more.` ``
- Driver: `"Horses first, then me."`, `"Quarter of an hour and we're off."`, `"Mind the step when she's in."`; *How's the road?*: `"There's trouble on the road. We stand here till it's cleared."` / `"Clear, today."`
- Traveller: `"Waiting on the coach, same as you."`, `"Sit, if you like. It won't come faster standing."`, `"Is it six yet?"`

**Why.** The keeper has a people (`def.people=nationOf(ci,cj).people`), and the driver and the travellers are drawn from the same people's name bank (`P`). The lines are good Markish and wrong on every other island's road. An Aurennais keeper would not greet without an honorific or a term, a Gatelander would not speak this bare, and the Old Blood say less than this. It is the same fault as Findings 1–3 and has the same fix.

**Replacement.** Choose the lines by the keeper's people, `def.people`; the folk use the same key. Where there is no row, use `markman`, which is today's text unchanged. The board (*When does the coach come through?*), the travellers' reasons (*Family.*, *A wedding. Not mine.* and so on), the rumours and the weather stay as they are.

```js
const COACH_INN_LINES={
  gatelander:{
    greet:["The fire's lit, and there's a chair by it with nobody's name on it.","A full bowl makes a short road. Sit, and it'll come to you.","We don't ask where you've been; a road's its own business. Boots off, though."],
    place:(n,a,b)=>`${n}, halfway between ${a} and ${b}. A house on a road is only ever half a house; the other half is whoever comes in. The coach stops, we feed them, and the horses drink.`,
    seatHas:(t,d)=>`The ${t} for ${d}. Your name's on it, and a name given is a name kept. If you're not at the door when it calls, it waits an hour, and not a breath more.`,
    seatGive:(t,d)=>`The ${t} for ${d}. It's yours, and it'll cost you nothing but being there; the driver knows to wait. An hour, mind. Patience has a bottom to it.`,
    driver:["The horses first, then me, and then whoever's left.","A quarter hour and we're off, and the road won't shorten for the waiting.","Mind the step when she's in. It's older than it looks, like the rest of us."],
    road:{trouble:"There's trouble on the road, and trouble doesn't move for a coach. We stand here till it's cleared.",clear:"Clear today, and I'd not promise you tomorrow."},
    trav:["Waiting on the coach, same as yourself. A watched road never brings it.","Sit, if you like. It'll come no faster for standing.","Would it be six yet, do you think?"]},
  markman:{
    greet:["Fire's lit. Take a seat.","Bed's upstairs. Bowl's on the way.","We don't ask where you've been. Boots off, though."],
    place:(n,a,b)=>`${n}, halfway between ${a} and ${b}. The coach stops, we feed whoever gets off, and the horses drink.`,
    seatHas:(t,d)=>`The ${t} for ${d}. Your name's on it. If you're not at the door when it calls, it waits — an hour, no more.`,
    seatGive:(t,d)=>`The ${t} for ${d}. It's yours, and it costs nothing; the driver knows to wait. An hour, no more.`,
    driver:["Horses first, then me.","Quarter of an hour and we're off.","Mind the step when she's in."],
    road:{trouble:"There's trouble on the road. We stand here till it's cleared.",clear:"Clear, today."},
    trav:["Waiting on the coach, same as you.","Sit, if you like. It won't come faster standing.","Is it six yet?"]},
  aurennais:{
    greet:["Be welcome, Master. The fire is lit, and the seats by it are free.","A bed upstairs, Master, and the kitchen is open. The terms are at the counter.","We keep no register of travellers, Master; only of accounts."],
    place:(n,a,b)=>`${n}, Master, halfway between ${a} and ${b}. The coach stops here under the road's contract. We feed its passengers and water its horses, at the posted rates.`,
    seatHas:(t,d)=>`The ${t} for ${d}, Master. Your name is entered. Should you not be at the door when it calls, it will wait one hour and no longer. That is the term.`,
    seatGive:(t,d)=>`The ${t} for ${d}, Master. The seat is entered at no charge, and the driver is instructed to wait. One hour, and no longer.`,
    driver:["The horses are seen to first, Master, and then the passengers.","We depart in a quarter of an hour, Master, on the timetable.","Mind the step when she is in, Master. The company accepts no claims for ankles."],
    road:{trouble:"The road is obstructed, Master. We are held here until it is cleared.",clear:"Clear today, Master."},
    trav:["Waiting on the coach, as are you. It is posted for six.","Do sit. Standing will not advance the timetable.","Is it six yet? The notice says six."]},
  oldblood:{
    greet:["The fire is lit. Sit.","Bed above. Bread soon.","Boots off. The rest is yours."],
    place:(n,a,b)=>`${n}. Halfway between ${a} and ${b}. The coach stops. We feed who gets off. The horses drink.`,
    seatHas:(t,d)=>`The ${t} for ${d}. Your name is on it. It waits an hour.`,
    seatGive:(t,d)=>`The ${t} for ${d}. Yours, and no charge. It waits an hour, no more.`,
    driver:["Horses first.","A quarter hour.","Mind the step."],
    road:{trouble:"Trouble on the road. We wait.",clear:"Clear."},
    trav:["Waiting.","Sit. It comes when it comes.","Six yet?"]}};
// const L=COACH_INN_LINES[def.people]||COACH_INN_LINES.markman;
// keeper greeting L.greet; What is this place? L.place(name,A?A.name:'one town',B?B.name:'the next');
// seatTopic gets the keeper's people as an argument: L.seatHas(hm(S.tod),dest(S.dir)) and L.seatGive(hm(c.tod),dest(c.dir));
// coachInnFolk: the driver's greeting L.driver, road() returns L.road.trouble or L.road.clear, and each traveller's greeting is L.trav.
```

**Not reviewed.** The innkeeper's room lines (`innTopics`: *A room is N gold… Shall I make it up?*, *Every room’s taken tonight…*) and `weatherLine()` are shared by every inn and are older than the baseline (v80 S141). They have the same one-voice problem. That is noted here for the author's audit, and no finding is written against them.

---

## Run 1 — 28 Sep 2026

About 40 player-readable strings read across the three diffs (main `ea17974..bd5ca7a`: Sessions 166–175; auto/systems: the caravan attack and the coach stop; auto/backlog: the shape-kit sessions 176–232). Three findings, all on main: two in the window, and one older line that belongs with them. auto/systems and auto/backlog are clean: the caravan lines (*"Bandits of X fall on the A–B caravan!"*, *"…rights its cart and goes on."*) and the coach prompts are narration and UI and read well; the backlog branch adds no strings a player reads.

Lines older than the baseline are not reviewed here; the author's audit (`language_audit.md`, backlog A's docs purge) covers them.

### Finding 1 — main — the guild heads greet in one voice for all four peoples

**Where.** `guildDef()` in the world module (grep `The board's behind me`), Session 172, on the `Object.assign({name:keeper,people:gp,…` line.

**Text.**
- Fighters' Guild: `"The board's behind me. Work if you want it."`, `"You look like you can swing something."`
- Mages' Guild: `"Mind the shelves. Some of that bites."`, `"Yes? The Guild has need of feet, if not minds."`

**Why.** Session 172 gives the head a people (`gp`, from `peopleOfSite(site)`), a name from that people's bank and that people's body. The greeting ignores it. The Fighters' lines are Markish (short, blunt) and fit a Markman, but an Aurennais head in a Compact city would never greet without an honorific or terms, and a Gatelander would not speak that bare. The Mages' second line opens on a bare *"Yes?"*, which no Gatelander says, and its *"has need of"* is too stiff for a Markman. Canon §1.5: speech follows the speaker, not the province.

**Replacement.** Pick the greeting by `gp`. Where `gp` has no row, use the `markman` row.

```js
const GUILD_GREET={
  guild_f:{
    gatelander:["A blade on the wall cuts no bread. The board's behind me.","You've the look of someone who can swing a thing. The board will tell us the rest."],
    markman:   ["The board's behind me. Work if you want it.","You look like you can swing something."],
    aurennais: ["The contracts are posted behind me, Master. Each has its terms and its fee.","You have the look of someone who could take a contract, Master. Read the terms before you sign for one."],
    oldblood:  ["The board is behind me. The work is older than the board.","You carry a blade. Good. Most of the work wants one."]},
  guild_m:{
    gatelander:["Mind the shelves. What sits quiet on a shelf isn't always sleeping.","The Guild's never short of errands, whatever else it's short of. Is it work you're after, or answers?"],
    markman:   ["Mind the shelves. Some of that bites.","Guild needs feet more than minds. You've got feet."],
    aurennais: ["Mind the shelves, Master. Not all of the stock is inert, and breakage is charged.","The Guild has need of runners, Master, more than of scholars. The terms are fair and the pay is prompt."],
    oldblood:  ["Mind the shelves. Some of what is on them was not made to be read.","The Guild wants feet. Minds it has, of a kind."]}};
// greeting: (GUILD_GREET[g][gp]||GUILD_GREET[g].markman)
```

### Finding 2 — main — the yield speaks Markish in every town

**Where.** `offerYield()` in the world module (grep `Yield, and it goes easier`), Session 171.

**Text.** Greeting `` `Yield, and it goes easier. ${dbl} gold, or a night in the cells.` ``; responses `'You haven’t got it. The cells, then, or fight on.'`, `'Wise. Go on, then.'`, `'Come along, then.'`

**Why.** Session 171 gives the yield the drawn guard's name, which makes it a person, and a person of the town's people. The lines are good Markish and wrong everywhere else: an Aurennais guard sets terms and uses the honorific; a Gatelander guard gives a proverb, not an order.

**Replacement.** Pick by `peopleOfSite(S.site)`. Where there is no row, use the `markman` row, which is today's text unchanged. The three response keys match the three existing `return` strings: `pay` after paying double, `poor` when the purse is short, `cells` on *The cells.*

```js
const YIELD_LINES={
  gatelander:{greet:d=>`A bent knee mends faster than a broken head. ${d} gold, or a night in the cells.`,
    poor:'You haven’t got it. Then it’s the cells, or the sword again, and I’d not choose the sword.',
    pay:'That’s the wiser road. Go on, and go quiet.',
    cells:'Come along, so. The cells are dry, at least.'},
  markman:{greet:d=>`Yield, and it goes easier. ${d} gold, or a night in the cells.`,
    poor:'You haven’t got it. The cells, then, or fight on.',
    pay:'Wise. Go on, then.',
    cells:'Come along, then.'},
  aurennais:{greet:d=>`Yield, and the terms improve. ${d} gold, Master, or a night in the cells.`,
    poor:'You have not the sum, Master. The cells, then, or we continue.',
    pay:'Settled, and noted. You may go.',
    cells:'The cells, then. It will be entered in the town’s book.'},
  oldblood:{greet:d=>`Yield. ${d} gold, or the cells until light.`,
    poor:'You have not got it. The cells, or the blade.',
    pay:'It is paid. Go.',
    cells:'Come. The cells are quiet.'}};
```

### Finding 3 — main — the halt, the same problem (older than the baseline)

**Where.** `confront()` in the world module (grep `Pay it, or I draw`), Session 157. Older than this run's baseline, but it is the same exchange as Finding 2, and the two should change together.

**Text.** Greeting `` `Halt. There’s a fine of ${fine} gold on you in ${S.site.name}. Pay it, or I draw.` ``; responses `'You haven’t got it. Then find it, and quick.'`, `'Good. Keep your nose clean.'`, `'Then it’s the sword.'`

**Why.** Same as Finding 2.

**Replacement.** Pick by `peopleOfSite(S.site)`, with `markman` (today's text) as the fallback. `poor` and `pay` belong to *Pay the fine*; `refuse` belongs to *I’ll not pay.*

```js
const HALT_LINES={
  gatelander:{greet:(f,t)=>`Stand a moment. There’s a fine of ${f} gold owed in ${t}, and it won’t pay itself. Settle it, or I’ll have to draw.`,
    poor:'You haven’t got it. A debt only grows in the dark, so find it, and soon.',
    pay:'Paid is paid. Walk easy.',
    refuse:'Then the sword, and Weaver forgive the both of us.'},
  markman:{greet:(f,t)=>`Halt. There’s a fine of ${f} gold on you in ${t}. Pay it, or I draw.`,
    poor:'You haven’t got it. Then find it, and quick.',
    pay:'Good. Keep your nose clean.',
    refuse:'Then it’s the sword.'},
  aurennais:{greet:(f,t)=>`A moment, Master. There is a fine of ${f} gold entered against you in ${t}. Settle it now, or I am obliged to draw.`,
    poor:'You have not the sum, Master. Find it before the town finds you.',
    pay:'Settled, and struck from the book. Good day.',
    refuse:'Then you leave me no other term.'},
  oldblood:{greet:(f,t)=>`Stop. ${t} is owed ${f} gold by you. Pay, or I draw.`,
    poor:'You have not got it. Find it.',
    pay:'It is paid.',
    refuse:'Then the blade.'}};
```
