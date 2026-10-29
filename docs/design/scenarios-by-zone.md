# Scenarios in every zone — something to find between the towns

A proposal from the systems designer, 29 Oct 2026, for backlog J's *More scenarios in every zone*. Nothing here is a spec until
`docs/decisions.md` carries a `Michael:` line under it.

## The problem in Michael's words
Backlog J (Michael, 21 Oct 2026, control room): "We need to add more scenarios to each zone. Some of them only have a small handful.
Each zone needs to have roughly as many as there are in Winnmark or Bunratty."

Neither name is in the game or the canon, and `genName` cannot make either. So this page reads a *zone* as a map cell (the
2.4 km square named *Realm*, *Marches* or *Wilds*) and a *scenario* as a reason to leave the road there. "Bunratty" sounds
Gatelandish and "Winnmark" Markish, so I take the two as each island's fullest cell by named places off the road: **Cluainkeel
Realm** and **Trotriair Wilds**. If he meant something else, the decision lets him say so.

## Today
I counted the world's 61 land cells on main, headless (`allSites()`, the cells' `doors`). `cellData` deals each cell up to 16
lattice sites (settlements, plus some *camps*, *ruins* and *stone rings*), 3 to 6 points of interest, and 10 to 17 dungeon doors
(4 on an island). Only the points of interest hold something: a glade's pond and herbs, a shrine's boon, a tower's roof and room, a
lair's beast (which drains the towns near it), a bandit camp's band and chest. The camps, ruins and stone rings, 109 in the world,
are dressing (`KIND_PLAN`: three tents, seven broken walls, six stones): a name on the map and nothing to do. Between the sites,
`spawnChunkEncounters` rolls a foe pack per chunk, and every outcome there is a fight.

| Points of interest with something in them | Cells | Examples |
|---|---|---|
| 3 | 19 | Biabaios Realm, Fornbiros Realm (islands: 3 and 4 or 5 doors), Grarhuey Realm, Norwoura Realm |
| 4 | 14 | Woushniair Marches, Qaros Marches |
| 5 | 18 | Cluainkeel Realm (with five empty ones beside them: 10 named places off the road, 18 doors), Kefis Realm |
| 6 | 9 | Trotriair Wilds (9 off the road with its three ruins), Dunnagh Marches, Zaria Realm |
| 0 | 1 | The Home Province, which is authored (the main quest, the Hermit's Camp, Caer Uaigneach, the Ashfeld) |

So every cell has dungeons to spare. What it lacks is a reason to stop that is not a door or a fight.

## Directions

### A. Fill the empty sites (the floor)
Each of the 109 camps, ruins and stone rings gets one live use by kind. A **ruin** gets a cellar hatch (a one-room dungeon off
`makeDungeon`'s smallest size, one chest on its own loot table) and a guard pack chosen by enemies-by-place. A **camp** gets
charcoal-burners or hunters, one trader with 8 to 12 items of their trade, and a bed. A **stone ring** gets a reading: the
fifteen words' shelves (`words-and-the-mouth-build.md`) give one rubbing-like lead to a sigil door within 1,500 m. Then each cell is
topped up to 6 live points of interest (4 on an island) from the existing five kinds. Daggerfall's loop: more places, each worth the walk
once, about 2.5 more a cell, no text to write. But it is more chests, fights and shops; none of it is a decision, so the brief's
first feeling gets nothing. Two systems sessions and one look session.

### B. Scenarios as a dealt deck (recommended)
A scenario is a small situation with people in it, a choice, and an outcome that the world keeps. It is Skyrim's world
encounters, which are about a hundred staged scenes dealt by its Story Manager (the Thalmor escort, the courier, the giant and the
bandits), turned toward consequence. Each scene is played at one of the empty sites or on a road.

**The deck.** Twelve kinds to start, in four families, with two or three outcomes each:

| Family | Kinds (outcomes) |
|---|---|
| On the road | A courier down to wolves (carry the letter on: favour at the far town; read it: a lead; take the fee and drop it). A toll chain across the road (pay 10; talk it down; fight three deserters, which opens the route for the week). A cart with a broken wheel (mend it with a plank and Joinery 15: favour and a 10% better price at the carter's town; leave it). |
| At a ruin | Diggers in the ruin (join them for half the find; warn them off; take it all, which counts as a crime with witnesses as `witnessOf` already rules). A grave opened in the night (follow the tracks to the robbers' camp or tell the nearest church: Church standing). |
| At a camp | Hunters with a man mauled (lead them to the lair: a commission-sized purse when it dies, and the camp stays as a trader; leave them: the camp is gone next week). A press gang or the Mark's levy taking a boy (pay his bounty; fight; let it be: favour moves either way with the nation). |
| In the wild | A dead adventurer with a note (marks one dungeon door on your map and names its chest). A climber stuck on a tower's face (reach him: the tower's room opens; this uses the mantle). A deserter who throws down his sword (spare him: a lead later; kill him: a crime only if seen). A pilgrim band to a shrine (escort them: the shrine's boon lasts twice as long for a week). An inquisitor and a hedge-witch at a stone ring (side with either: Church notes or a word's lead). |

**The deal.** Each cell is dealt `max(4, 10 − its live points of interest)` scenes, or 3 on an island cell. That gives 4 to 7 a
cell: every mainland cell reaches 10 things to stop for, Cluainkeel's count today, and an island (a quarter of the land) 6. Each slot is drawn from the cell's
seeded stream `scene:<cell>:<week>:<slot>` (the co-op rules: every player in a shared world meets the same scene). It is placed at
one of the cell's empty sites or at a road point at least 300 m from a pad. A scene plays once. Its slot is dealt again at the
turn of the in-game week (seven days), so a cell you live near keeps giving. A kind is not dealt twice in one cell in the same
week, and no kind appears in more than 4 of a nation's cells that week, so the road does not repeat itself.

Ten is the fullest cell's count, which is what Michael asked for. A week is the errands' rhythm (`erWeek`): a scene you passed is
there on the way back, and the next trip differs. Skyrim deals on cell load with no memory, so the same courier finds you twice.

**What it touches.** The deck and deal in `87-world-quests.js` beside the errands (`sceneDeal`, `sceneFor`); the people from
`makeDef`, placed with the cell's sites so the job budget sees them. Outcomes go through named actions that exist (`addFavor`,
`driveProsperity`, `markRoadCleared`, `markLairDead`, `witnessOf`) and one new one, `sceneResolve(id, outcome)`. The state is
`worldState.scenes`, `<cell>:<week>:<slot>` to `{kind, outcome}`: the world's, so in the S242 list and not `SS_CHAR_WS`; what you
did goes in your journal (the character's). The map names a played site by its outcome ("the diggers' ruin, robbed"). The text is
the quest writer's: about eight lines a kind in each people's voice, in the errand frame's manner.

**What it displaces.** Nothing. The foe packs stay, kept off a scene by its pad (their rule, pad plus 70 m). The empty sites keep
their look and get people. The Home Province keeps its authored places and takes scenes on its roads only.

**Cost.** Ordinary sessions, not deep work: one to three files, no rewrite. That is one systems session for the frame (the deck,
the deal, the state, the save, the map, a suite), then three systems sessions of four kinds each, two quest-writer runs for the
text before them, and one look session for the props (the toll chain, the diggers' spoil, the burners' clamp). So four systems
sessions, two quest runs and one look session.

### C. Author every cell by hand
Morrowind's way: five or six scenes written for each place (Tarhiel falls out of the sky at Seyda Neen once, and you remember
him). Best in play, worst in cost: about 330 scenes, at the quest writer's six a run, is some 55 runs before the world is even.

## Recommendation
**B, the dealt deck.** It answers Michael's count directly (every cell reaches 10, and the thin ones gain most), and it answers
the brief's first feeling, which A does not: each scene ends with the world changed (a route held, a town's favour, a lair marked,
a crime on your name). It costs a week of the systems builder's runs, and the seeded deal keeps a shared world the same for a
friend. A's floor can be folded in later, and C's hand-written scenes join the deck one at a time where a place should be remembered.

## What must be true first
Nothing is blocking. The pieces it leans on are built: the errand frame and its week (Session 1510), enemies by place (Session
1059), lone farms (Session 1473), the mantle (Session 1385), the crime system's witnesses, and the words' shelves
for the stone ring's lead (`words-and-the-mouth-build.md`, when its session lands; until then that kind is held out of the deck).
One open point is Michael's meaning of the two names, which the decision asks.

## Not asked
- **More dungeons**: every cell has 10 to 17. **Retuning the foe packs**: enemies-by-place set them; the scenes are the other half.
- **Towns' own work**: errands, boards and dated work fill a town; this page is the land between. **The far continents**: the deck
  deals there too, and needs no authored quests.
