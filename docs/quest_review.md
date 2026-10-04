# Quest review — the dialogue police

Every player-readable string added or changed in `index.html` and, since the split (Session 379), `js/*.js`, checked against the canon's register (§2) and facts. Findings are applied by the builders **exactly as written**, without a decision. The quest writer never edits `index.html`.

## Reviewed to

| Branch | Reviewed to | Note |
|---|---|---|
| main | `551e9ec` | run 7, from `206b697`; the diff is `-- index.html js/` |
| auto/systems | `0fbebd9` | run 7, Sessions 442–460 against main |
| auto/fable-co-op-door | `79f6d64` | run 7, Session 453/456 (two saves) against main; first read |
| auto/backlog | `551e9ec` | run 7: level with main (Sessions 414–435 merged, read in run 6) |
| auto/fable-rivers | `5504d80` | run 7: merged into main; nothing ahead |
| auto/concept, auto/producer, auto/critic, auto/design, auto/split | — | run 7: level with main, or ahead in docs only |
| claude/lucid-faraday-6qlft7 | — | shares no history with main; not read |
| auto/proto-sails | `4e8a5e7` | gone from origin; last read run 3 |

---

## Run 7 — 4 Oct 2026

About 60 player-readable strings read. No findings.

**main** (`206b697..551e9ec`) is the merge of the rivers (Sessions 430–433) and the look sessions 414–435, both read in run 6, plus Session 453 (tests only) and the build tag. Finding 9's peaks and lakes are as run 6 left them on main; the fix is on auto/systems and arrives with its merge.

**auto/systems** (Sessions 442–460). Findings 7, 8 and 9 are in the code word for word: `INN_ROOM_LINES` carries the four voices as written, the coaching inn passes its nation's people, the French long names read as French, and the peaks and lakes take their people's word (*Sliabh*/*Cnoc*, *Mont*/*Pic*, *Fell*/*Tor*, *Loch*/*Lac*/*Mere*, and *La* for Aurenne's rivers). The new lines read well: the log's *The Compact deeded you a ship at* PORT is plain narration, and Rowe found in her own words (Session 457) takes the generic *Home? Yes. Yes, all right.* off her. Sessions 451 (the Torch at the counter) and 455–460 add no other string a player reads.

**auto/fable-co-op-door** (the two saves, character and world; Michael's A on #119) adds menu and toast text: *No world was saved with this character — the world starts fresh.*, the export and import toasts, and the buttons *⤒ Export* and *⤱ World* with their tooltips. All of it is out-of-world chrome in the game's plain menu voice, and none of it breaks a register.

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
