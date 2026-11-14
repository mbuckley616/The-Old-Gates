# Law in three registers

*The systems designer, 14 Nov 2026. A proposal: nothing here is a spec until `docs/decisions.md` carries a `Michael:` line under it.*

## The problem in Michael's words

Backlog L, from his review of the concept art (OG-117): "**Law in three registers**: a village council, the Crown's court, constables, the stocks and a watch in red tabards (Gatelands); a Church tribunal, city guards in blue and white, prisons, fines and contracts (Aurenne); the Mark settles by the legal duel under captains and reeves (§1.2, §1.5), so its panel's moot and ordeal by iron are candidates only where the canon has room. Crimes to add: smuggling, poaching, gate trespass at restricted sites, fraud, heresy, unlicensed gate work; punishments: restitution, the stocks, forced labour, banishment, confiscation, service to the Church; officials: a gate warden, a magistrate, a Church inquisitor."

## Today

One law runs on all three islands (`js/86-world-crime.js`). A seen crime (`witnessOf`, `bookCrime`) costs its town favour by its points (`CRIME_PTS`: lock 1, theft 2, assault 3) and a fine of 25 gold a point plus the goods' worth, kept in `worldState.crime[site]`; the favour returns a point every three quiet days, and a wronged keeper refuses you for five. A guard within 5 m halts you (`confront`): pay, talk it down (Speech 50), give your word (Speech 100, locks only), or refuse and he draws at tier 3 (`guardEnemy`). Under 30% health he offers double or a night in the cells (`offerYield`, `toCells`: the stolen goods taken, out at 7:00). A guard's death shuts the town and leaves a note for the Church; a priest hears a confession for 25 gold (`penanceTopics`). Only the voice differs by nation (`HALT_LINES`, `YIELD_LINES`), with the Compact's tenth on cargo (`cargoNotes`) and the Crown's twentieth on the Gate-Blade (`bladeTithe`). The game's own dialog promises three laws ("a magistrate twice a year", "a duel if you don't like it", "everything written, everything tithed") and runs one court under all three.

## Direction A: three courts, today's crimes

**The loop.** Nothing new is forbidden; how you settle changes. In the Gatelands you can hand the goods back, in the Mark fight the claim, in Aurenne the debt follows you and grows.

**The rules.** The points, witnesses, favour and the guard's halt stay as built. The halt and the yield offer each island's own terms.

| | The Gatelands: the Crown's court | The Mark: the reeve and the duel | Aurenne: the Compact's ledger |
|---|---|---|---|
| Who it is owed to | the town's lord | the one you wronged (a claim, not a fine) | the Compact, one book for the island |
| At the halt, besides paying | **Restitution**: give back the stolen goods you carry from this town; the fine drops by their worth, the 25 a point stays | **The duel**: the claim fought to a yield against the town's sword (tier 3, the arenas' bout rules), from 6:00 to noon only, "a quarrel finished by noon" | **A contract**: the Factor sets a commission (the guild commissions as built) whose pay goes to the fine, due in 5 days |
| Win, or settle | fine paid | win: the claim is void and half the favour it cost returns; lose: pay 1.5× | finish the contract: fine cleared |
| Can't pay, after the yield | **the stocks**: an hour on the plaza for every 50 gold, at most 6; the fine cleared, the goods taken | the garrison's cells, as built | **prison**: a night for every 100 gold, at most 3; the fine cleared, the goods taken |
| Left unpaid | as today | the wronged keeper's refusal ends the day the claim is paid or won | 10% a game-week, capped at double, and any Aurenne town's guard halts you for it |

- **Why these numbers.** The stocks at 50 an hour make a typical theft fine (100 to 200) two to four game hours: felt on the clock, not an evening lost. Prison at 100 a night is longer because Aurenne is the written law, and the fed, watered and rested buffs feel the time. The ledger's 10% a week is slow on purpose: 100 is 146 after four weeks, enough to send you back to pay, never enough to lock you out.
- **The duel's hours** are the ring's 6:00 to 12:00 (`DUEL_OPEN`, `DUEL_CLOSE`); outside them the reeve's man names the hour and the halt waits. No duel for a guard's death: that stays the shut gates.
- **Precedents.** Daggerfall's court let you plead or argue, province by province; Kingdom Come has the stocks and restitution. Skyrim's jail-or-pay is what we have now.

**What it touches.** `confront`, `confrontIndoor` and `offerYield` take their topics by `peopleOfSite`; `toCells` gains the stocks and the prison as lengths of the same fade; `bookCrime` writes the Mark's claim to the wronged house and Aurenne's to one island key in `worldState.crime`, the character's (`SS_CHAR_WS`) as now. The duel calls `boutStart`. No new `worldState` key. The quest writer writes the courts' lines; the look builder draws the stocks.

**Cost.** Three systems sessions (one an island), one look session, the quest writer's lines.

## Direction B: A, plus three crimes that meet loops already built (recommended)

**The loop.** A's courts, and three new crimes, each inside a loop you already play (hunting, cargo, selling what a gate gave you), each with a lawful road beside it.

**The rules.**

| Crime | Where | What it is | The lawful road | Seen, it costs |
|---|---|---|---|---|
| **Poaching** | the Gatelands | killing a deer, boar or hare in a lord's chase: the wooded cells within 600 m of a town with a keep | a hunting licence from the lord: 30 gold for a season (three months of the calendar) | theft, 2 points, plus the beast's worth (deer 30, boar 25, hare 5) |
| **Smuggling** | Aurenne | cargo landed at a smuggler's cove and sold to its fence, which pays the full price and no tenth | sell in port and pay the Compact's tenth | a tithe-ship's search within 300 m of Aurenne's coast, one in four (seeded on ship and day): theft, 2 points, the cargo taken |
| **Sacrilege** | Aurenne | gate salvage sold in an Aurenne town ("gate-grubbing is sacrilege to the Church") | sell it in the Gatelands or the Mark, or at a cove's fence | sold at a Prior's town: 2 points, the piece taken, a note for the Church |

- **No trap.** Each shows before it bites: a chase's edge on the map in the lord's colour, *the Church calls this sacrilege* on a gate piece's line while you stand in Aurenne, the search named in the tithe-ship's hail. A crime you could not see coming is not a decision.
- **The witness rule holds.** A chase's witness is the lord's forester, one per keep town, by day; at night nobody sees you. Smuggling's is the search, seeded, so a reload does not change it.
- **The officials** come with it: the magistrate in the keep, the Mark's reeve, and in a Prior's town the Church's inquisitor (OG-091's Brother Alain), who hears the sacrilege notes.

**What it touches.** A's functions; `killE` for poaching (the chase read from the beast's cell by `getCell`, never `SETTLE`); a `gate` mark on loot rolled in a dungeon, saved with the item as `stolen` is (`14-items.js`, the save's item keys); `openCargoPanel`, a fence at the coves, a tithe-ship among `85-world-sea.js`'s merchantmen; `worldState.licences`, the character's (`SS_CHAR_WS` and the S242 list).

**Cost.** Six systems sessions (A's three, one a crime), one look, one bodies for the forester and the inquisitor, the quest writer's lines.

## Direction C: B, plus a law that travels

**The loop.** B, and the record crosses the island: a fine known in every town of its nation after a day per 2 km; bounty hunters on the roads over 300 gold; banishment from a nation after three guards dead; cells you can break out of, forced labour as a shift at a mine.

**Cost and conflicts.** A deep-work session and six systems sessions. Banishment closes a third of the world on one evening's mistake, against the brief's "never depressing to play"; bounty hunters overlap enemies by place's tables; in co-op one friend's crimes would close the host's nation to all.

## Recommendation

**B.** The brief puts decisions with consequences first, and B gives three inside loops you already play: hunt the lord's woods or buy the season, run cargo past the tenth or pay it, and where to sell what a gate gave you. A alone makes the islands differ only once you are caught. B keeps the law local, as the canon's three governments are, and every cost is gold, favour or game hours, never a lost evening. C can follow later without undoing it.

## What must be true first

- Nothing waits: the bout (`boutStart`, #914 B), the cargo trade with the Compact's tenth, the coves (S1773, S2105) and the calendar's months are built. The arenas sheet's murder at 5 points should land before the courts are written over it.

## Not asked

- **Gate trespass and unlicensed gate work.** On the home island they would make the core loop unlawful from the first hour. A few sealed gates under a warden could be their own page.
- **Fraud and heresy as belief.** Nothing in the game can yet be faked or wrongly believed.
- **The moot and the ordeal by iron.** The canon gives the Mark the duel; the panel calls the others candidates.
- **The guards' colours** are the bodies builder's dress; the canon already names them.
