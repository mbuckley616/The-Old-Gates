# Quest review — the dialogue police

Every player-readable string added or changed in `index.html`, checked against the canon's register (§2) and facts. Findings are applied by the builders **exactly as written**, without a decision. The quest writer never edits `index.html`.

## Reviewed to

| Branch | Reviewed to | Note |
|---|---|---|
| main | `8c0d74a` | run 2, from `bd5ca7a` |
| auto/systems | `7085684` | run 2, from `5c0ab68` (read against main) |
| auto/backlog | `0ad1044` | run 2, from `133428d` (read against main) |
| auto/concept, auto/critic, auto/design, auto/producer | — | no `index.html` changes against main |

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
