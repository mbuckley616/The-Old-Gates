# The journal and the calendar

*The systems designer, 4 Oct 2026. A proposal, not a spec: nothing here is built until docs/decisions.md carries a `Michael:` line under it. The names of days, months and eras are the quest writer's; this page proposes only their shape.*

## The problem in Michael's words
> "Journal: now a footnote in the character tab. Wanted: a journal tab in Morrowind's manner that writes real entries with a lore-friendly in-game timestamp (needs the calendar, D). Persistence failed before — entries must live in the save store `SS`, never on live objects." (backlog E)
>
> "Calendar: days of the week, months and years in the clock and the wait menu, structured like the Elder Scrolls' with our own names — the names are the author's (the quest writer proposes from the canon; Michael picks). The systems builder wires it once the names are chosen." (backlog D)

The brief lists it under *Keep the door open for*: "A Morrowind-style journal with an in-world calendar."

## Today
The clock is two numbers in `worldState`: `gameTimeMinutes` (the time of day, wrapping at 1440) and `gameTimeAbsMinutes` (every minute since the game began), advanced by `advanceClock(dt)` at one game minute a real second, so a day is 24 real minutes. The only date the player sees is `gameDateLine()` in the sleep panel, *Day 12 · 7:40 am*, and *Days passed* under Renown. Rent (`tickRents`), the shrine, the shipwright and the masons already count whole days off the absolute clock. The journal is `GAME_LOG`, a plain array that `addLog(icon,text)` pushes to from 117 places and that `renderLog` prints under the character tab, grouped by level. It is never saved: every line is gone on reload, which is the failure the backlog remembers. The quest cards (`renderQuestLog`) already carry first-person text (`acceptText`, `completeText`), so the voice exists; it is not kept as dated entries.

## The shape every direction shares
These rules are the same under A, B and C, so the decision is about how far to go, not about these.

| | Rule | Reason |
|---|---|---|
| Week | 7 days | the canon has seven gods: six with temples and the Guest without one. A day each is the obvious reading, and the Guest's day is the writer's to make strange (the Church may have renamed it). |
| Month | 28 days, exactly four weeks | a weekday falls on the same dates every month, so "the market is on the Hearth's day" and "the 3rd" never drift apart |
| Year | 12 months, 336 days, four seasons of three months | |
| Era | a year count and an era name | the canon offers two clocks: the Crown's, and the Weaving fifteen centuries ago; the writer picks one, or the peoples each keep their own |
| Start | the first day of an autumn month, year chosen by the writer | the Gatelands are the only island with autumn woods; a new tale should open in the season that is theirs |

**Why 336 and not 365.** At 60 to 1, a day is 24 real minutes. An evening of two hours with one night's sleep is about six game days; a 336-day year is then about 55 evenings, roughly one long playthrough. Skyrim keeps 365 days at 20 to 1, a year of 438 real hours, and nobody sees its winter. Here a player meets every season once. A 365-day year would make the months uneven and break the weekday-on-a-date rule for no gain.

**The date line.** One function writes it everywhere: *Morning of the Sea's day, 9th of [month], [year] [era]* in the sundial's tooltip, the wait menu, the sleep panel, the save slot's line and each journal entry. Today's `gameDateLine` becomes that.

**Where entries live.** `worldState.journal`, a list of `{t, kind, key, text}`: the absolute minute, *quest* / *world* / *note*, the quest or site id, and the line. It is the character's, so it goes in `SS_CHAR_WS` and the S242 list. Entries are about 150 characters; 3,000 of them is under half a megabyte, and the payloads live in IndexedDB. No cap. `addLog` keeps its name and writes here; `GAME_LOG` goes.

**Co-op.** The date is the host's world's (the clock is a world key); the journal is the character's, so a friend's entries carry the host's dates. No rule needed.

## Directions

### A. The dated journal
**The loop.** You open the Journal tab and read your story in your own voice, newest at the top, each entry under its date. A quest's entries read in order when you click its title; the active ones sit first. Nothing in play changes.

**The rules.** Every `acceptText`, objective tick and `completeText` writes an entry (they exist for the main story); a world quest writes its taking and its turn-in from the lines it already shows; the 117 `addLog` calls write the rest (a lair cleared, a route opened, the ship raised). The tab has two views: *By day* (the chronicle) and *By quest*. The character tab keeps Renown and loses the footnote.

**Touches.** `addLog`, `renderLog`, `renderQuestLog`, the save's two lists, `gameDateLine`, the sundial, wait, sleep and save panels. It takes the book look chosen for reading (#116).

**Displaces.** Nothing. **Cost.** One Opus session, plus the writer's names.

### B. A calendar the world keeps *(recommended)*
**The loop.** A, and the days mean something. You plan around them: the town you are bound for has its market on the Stone's day, the shrine of the Sea gives more on the Sea's day, the ring at Caer Slige goes up on a named day, your room is paid till the Hearth's day. The journal gains a third view, *Due*, which lists what the calendar owes you.

**The rules.**

| Day kind | Rule | Numbers |
|---|---|---|
| A god's day | its shrine's boon lasts twice as long | today's boon times 2; the shrine's once-a-day stays |
| Market day | each town and city has one weekday, seeded by its site id; a travelling trader stands in the square from 8 to 18 | one stall, stock rolled from the town's nation and keyed by site and date (the co-op rule on seeded rolls) |
| Rent day | the weekly rent falls on one named day instead of every 10,080 minutes from the start | same sum |
| Feast days | four a year, one a season, each a day long; the square is full, the inn's meal is free, the guards look the other way for petty crime | crime fines ×0.5 that day; content and names are the writer's |
| Dated work | a guild or town task may carry a date; done by then it pays +25%; after it the giver takes it back | at most one in three tasks dated, 7 to 14 days out |

Seasons in B are weather, not paint: `weatherWeights` reads the season, so the Gatelands' winter brings snow on the low ground and rain in autumn rises from today's weight by half; the Mark is colder in each; Aurenne's summer is drier. Day length stays fixed. Dawn at 5 and dusk at 17 are read by the spawns, the lockpicks (`lpPhase`), the NPCs going indoors and the tide, and moving them would cost more than it gives.

The *Due* view is built from things that already have a date: the rent, the ship being raised, the masons, a dated task, the next market where you stand, the next feast.

**Touches.** A, plus `weatherWeights` (80-world), the shrine boon (80-world), `tickRents`, the world quest record (a `due` field), a market stall prop and its seeded stock, the guards' fine rule. All rules read the absolute clock, never frames, so a closed panel cannot skip a market.

**Displaces.** The rent's fixed interval, and today's weather odds by place only. **Cost.** A's session, then two Opus sessions (the days and the *Due* view; the weather and the feasts). The writer owes the names and the four feasts' lines.

### C. Morrowind's whole book
**The loop.** B, and the journal also keeps everything you were told. Each dialogue topic you heard is filed by its name with the speaker and the date (*Varek — told by Aldwyn, 3rd of …*), with a search box; names in an entry are links to their topic. You may write your own lines, and pin a note to the map.

**The rules.** Every answer `openDialog` shows from a named NPC or a quest topic is filed once under its label; generated rumours file by town (the generated townsfolk hold thousands). Notes up to 500 characters.

**Touches.** B, plus the dialogue path (22-dialogue, `makeDef`'s topics), a text field in a game that takes WASD (focus handling everywhere), and the map's marker list.

**Displaces.** Nothing in play, but every new dialogue becomes something the journal must index. **Cost.** B, then two more Opus sessions.

## Recommendation
**B.** The brief's first feeling is decisions with consequences, and a calendar that only labels the clock is a name on a number. With market days, a god's day, feasts and a few dated tasks, the date becomes something you plan a road around, as Daggerfall's holidays and Oblivion's shop hours made the clock matter. A's journal is the part asked for by name and comes first either way. C is Morrowind's book in full, but its topic index is mostly a reference for players who forget what they were told; the quest cards already hold the leads, and the text field fights the keyboard. It is better left until the dialogue settles.

## What must be true first
- The quest writer's names: seven days, twelve months, four seasons, the era and its year, four feasts. Until then the build can carry plain placeholders (*the first day*, *the first month*) and swap them by one table.
- The book look from #116, so the journal is not built twice.
- For B's dated tasks and seeded stalls: the co-op rule on seeded rolls (Session 456) and the task record in `worldState.quests`.

## Not asked
- Seasons that repaint the land (autumn leaves, a winter white-out): that touches `groundColor`, `recolourChunk` and every tree, and is the look builder's and a Fable session's. B's weather is the cheap half.
- Day length by season, for the reason above.
- Birthsigns, ageing, crops by month: not asked, and the first is the writer's.
- A clock rate change: every timed system reads 60 to 1.
