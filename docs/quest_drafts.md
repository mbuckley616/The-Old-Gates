# Quest drafts

These are the quest writer's drafts. None of them is canon until Michael promotes it into `quest_writing.md`, and none is a spec until it is approved. Each draft gives the quest's shape, every line verbatim with its speaker and people, and a note on what in the code would carry it.

---

## The Seventh Niche — the Guest lorebook, the defaced niches, the Church's line

*Unapproved. Drafted 28 Sep 2026. Backlog A, Lore objects: the Guest lorebook, defaced niches, and the Church's line on the Guest. (The sigil-lore books are the other half of that line and are left for another run.)*

### What the canon fixes

Canon §4.2 says the seventh god, **An tAoi, the Guest**, has no shrine. It is found in defaced niches, in a chapel the Church bricked up in Aurenne's capital (**Cill an Aoi**, already built: the cellar under the capital's cathedral, *Press 'E' to pray*, black for four seconds, *It saw you.*), and in a lorebook that argues whether the Guest is a god or an *intrusion*. The Church says the Guest is a mistake of the old culture. Varek's heresy is that the Guest is real and has arrived. The three descriptions (*the one who returns; the one who walks the shortest road; the one who dies and does not*) recur in old art and older songs. They are not a prophecy, and no one applies them to the player until Act III, once.

This draft doesn't add a quest-log quest. It lays a trail of three things the player can find in any order, ending with a direction to the chapel, which canon says is findable and which nothing in the build points to today:

1. **The niche.** A struck-empty niche beside the altar of every shrine. The player can examine it. It is the first time the player learns that something was taken out.
2. **The book.** *The Seventh Niche*, a Church disputation. It lays out the case for *god* and the case for *intrusion*, gives the Church's answer, and quotes the three descriptions without applying them to anyone. A lore book, not a skill book.
3. **The priest.** Once the book is read, or the chapel is found, any priest will answer *"Who is the Guest?"* in the priest's own people's voice. Each answer ends by naming the city whose cathedral hides the chapel.

**Changes.** Nothing in the world state except what the build already keeps. It gives the chapel a road to it. Once the player has prayed there, the priests' answers change.

**Reward.** None. The chapel gives no boon, and the trail to it gives none either.

### 1. The niche

**Prompt** (near the niche, at every shrine):
> Press 'E' to look at the empty niche

**Examine** (a popup in the register of the Mouth and the keystones: second person, what you see first, then what it means):
> Beside the altar, set low in the stone, is a niche the size of a hand. It has been emptied with a chisel. Not worn away by weather: struck, and the marks are as old as the carving around them.
>
> The offering ledge under the altar is worn smooth by hands. The ledge under the niche is not. Whoever emptied it made sure nobody would bring it anything again.

### 2. The book — *The Seventh Niche*

The prose is in the Aurennais institutional register: formal, qualified, contracts and terms, and never an oath. The margin note on the last page is in a Gatelander's hand and voice. The author is unnamed, as in every book the game has.

**Item name:** The Seventh Niche  **Icon:** 📜 (or the lore-book icon if one exists)  **Description line in the bag:** `Lore book` / `Lore book (already read)`

**Pages:**

> THE SEVENTH NICHE
>
> A disputation, in the form the Church's schools require: the question, the case for, the case against, and the answer. Copied for the library of the Prior. The clerk who set it down did not sign it.

> THE QUESTION
>
> Whether the Guest, whom the old people named An tAoi and for whom they cut a niche but no figure, was a god of theirs, or something that came in among them and that they mistook for one.
>
> The Church has answered, and the answer is on record: the Guest is a mistake of the old culture, a word for weather or for grief that the carvers made into a figure, because they made a figure of everything. This disputation does not reopen that answer. It sets down the case against it, as the schools require, so that the answer can be seen to have been earned.

> THE CASE THAT IT WAS A GOD
>
> It is argued, first, that at the oldest shrines the six have a figure and a tool each (the hull, the sundial, the wolf, the gate, the lamp, the shuttle) and the seventh has a niche. A people who made a figure of the weather would not leave a niche empty by mistake at every shrine they built.
>
> It is argued, second, from the Weaver's own work. A loom is not strung for the weaver. It is strung for whoever is to wear the cloth. If the loom was strung, it was strung for someone, and the old people had a name for that someone.

> THE CASE THAT IT WAS AN INTRUSION
>
> It is argued against, first, that no offering has ever been found in a seventh niche: no coin, no bone, no ribbon. The old people paid all six. What sat in the seventh was not paid. It was watched.
>
> It is argued against, second, that the niches were not left empty. They were emptied. The chisel marks are as old as the carving, so the people who cut the niche are the people who struck it out. One does not strike out one's god. One strikes out a door that was opened, and should not have been.

> THE SONGS
>
> Three phrases recur in the old carvings and in the older songs. The clerk sets them down as the library has them: *the one who returns; the one who walks the shortest road; the one who dies and does not.*
>
> The Church reads them as the old people's names for the dead. The clerk observes that the dead do not return, do not walk, and do die. The Church's reading is the kinder one. It is not the more exact one.
>
> They are not a prophecy. The old people did not prophesy; they described. Whatever these describe, they describe as something already seen.

> THE ANSWER
>
> The answer stands as the Church gave it. The Guest was a mistake of the old culture.
>
> The clerk records one reservation, as the schools permit. The Church holds the Guest to be a mistake, and has seen fit to brick up the one chapel where the mistake was ever given a figure, and that figure was given no face. The clerk does not dispute the answer. The clerk notes only that it has been paid for twice.
>
> *In the margin, in a different ink and a plainer hand:* A door you brick up is still a door.
>
> *And below it, smaller:* Weaver keep whoever reads this after me.

### 3. The priest — *"Who is the Guest?"*

The topic appears at any church once `booksRead.has('seventh_niche')` or the chapel has been visited. `${cap}` is the name of the capital, `guestChapelHouse().name`. There are two states: **before the chapel** (the book has been read, the chapel not yet found) and **after the chapel** (`vstate().chapel`).

**Aurennais priest** (the Church's own line):
- *"Who is the Guest?"* → "The Guest is a mistake of the old culture, Master: a word for weather, or for grief, which the carvers made into a figure because they made a figure of everything. That is the Church's position, and it is settled. I would not advise you to go looking for it unsettled."
  - Follow *"Then why brick up its chapel?"* → "Because a mistake given a statue is still a mistake, and a statue invites a certain kind of visitor. The chapel lies under the cathedral at ${cap}, closed by the Prior's order. I tell you where it is so that you are in no doubt about where you are not permitted to go."
- *After the chapel* → "You have been below. I can see it on you, Master. I will not ask what you found there. The Church has no clause for it."

**Gatelander priest:**
- *"Who is the Guest?"* → "The Church says it's a mistake the old people made, and the Church has more books than I have. But my grandmother set seven cups on the dresser and filled six, and she never once said the seventh was for nobody."
  - Follow *"Then who was it for?"* → "Ask a shut door who it's shut against and you'll get the same answer from it as from me. They bricked up its chapel under the cathedral at ${cap}. A thing you brick up is a thing you're not done with."
- *After the chapel* → "You went down. Well. What's seen can't be unseen, my mother used to say, and she said it about smaller things than that. Weaver keep you."

**Markish priest:**
- *"Who is the Guest?"* → "Church says it's a mistake. Old carvers' mistake. That's the word I'm given."
  - Follow *"And your own word?"* → "Same word. I'd not bet a knife on it. Chapel's under the cathedral at ${cap}, bricked up. I wouldn't go."
- *After the chapel* → "You went. Aye, I can see it. Don't tell me."

**Old Blood priest** (sparing, and the older word first):
- *"Who is the Guest?"* → "An tAoi. The guest. My mother set no cup for it, and would not say why."
  - Follow *"The Church says it was a mistake."* → "The Church says so. The Church bricked its chapel at ${cap}. We did not ask them to. We did not ask them not to."
- *After the chapel* → "You went below. Sit a while before you walk. The cold goes, mostly."

### What in the code would carry it

- **The book.** A new `BOOKS` entry, `{id:'seventh_niche', name:'The Seventh Niche', ico:'📜', attr:null, pages:[…]}`, with the six pages above as six strings. Each `\n\n` in a page is a paragraph break, as in the other books, and the italic margin lines are plain text. Four places read `def.attr` (grep `BOOKS.find(b=>b.id===it.bookId)`: the bag description, reading, and two more). Each needs a branch for `attr:null` that grants nothing and says `Lore book`. `randomBookItem()` should leave it out of the skill-book rolls. Placement: one copy on a shelf in every Mages' Guild (the guild libraries), and a rare roll in `library_chest`. No copy in the capital's cathedral: the player should arrive there already knowing.
- **The niche.** At every shrine (`site.kind==='shrine'`, built beside `S.altar`), a small dark recess in the altar's plinth or the stone behind it, and a prompt and popup on E within about 1.5u. It goes in the same loop as `shrinePrompt` / `shrineInteract`, checked before the altar so that the two prompts don't fight: the niche sits to the side of the altar, out of the altar's 2.6u ring. It has no state and gives nothing.
- **The priest.** Next to `penanceTopics(site)` in the church def's `_extraFn` (grep `the priest hears a confession`), add `guestTopics(site, def)`. It returns `[]` unless `booksRead.has('seventh_niche')||vstate().chapel`. It chooses the lines by the priest's people (`def.people||peopleOfSite(site)`) and the state by `vstate().chapel`. `${cap}` is `guestChapelHouse()?guestChapelHouse().name:'the capital'`. In the before state the follow is a folder topic with one follow; the after state is a single response.
- **worldState.** Nothing new. `booksRead` (saved) and `vstate().chapel` (saved) already exist.
- **The sixth discovery.** Unchanged. The chapel still sets `vstate().chapel`, and Varek still watches the player's hands the next time they meet.

### Checked against the canon

- *No chosen-one prophecy.* The book says outright that the three descriptions are not a prophecy, and nobody in the draft applies them to the player.
- *The Clearing is not revealed.* The book never says what the gates do to the dead. The Church still doesn't know.
- *The Withdrawal.* It is echoed and not stated: *"the people who cut the niche are the people who struck it out"* agrees with *"they broke their own order the same year"* without naming it.
- *Cill an Aoi.* The book's *"given no face"* agrees with the chapel's *"a statue with no face."*
- *Where the canon is silent:* whether the old shrines had a seventh niche. The canon says the Guest is *found in defaced niches* and has *no shrine*. I chose the plainer reading: a niche beside each god's altar, struck empty, and no shrine of its own.
- *Register.* The Aurennais lines use *Master*, terms, clauses and no oath. The Gatelander lines give a proverb, never a bare yes or no, and swear by the Weaver. The Markish lines are short, with *aye* and no honorific. The Old Blood lines are few and put *An tAoi* first.

---

## The Shrines Remember — the third prayer

*Unapproved. Drafted 29 Sep 2026. Backlog A, consequence hooks: shrines remembering (three prayers → the boon permanent). Canon §12: `shrines[id].count`, third prayer at one shrine → that shrine's boon becomes permanent.*

### What the canon fixes, and where it is silent

Canon §4.1 gives six gods a shrine each. Each shrine has a statue and a boon in its god's domain: An Mhuir the Road, An Spéir Renewal, Na Beithígh the Arm, An Chloch Stone, An Teallach the Mind, and An Fíodóir a sigil rubbing. §12 says the third prayer at one shrine makes that shrine's boon permanent. The Irish-register culture worshipped *what the builders were making*, not the builders. The gods are the loom's works, so nothing here makes a god speak.

Where the canon is silent, I chose the plainer thing:
- **What counts as a prayer.** A prayer counts when it gives a boon, which the build already allows once a game-day per shrine. Three prayers are three days, and they need not be in a row.
- **The count is per shrine.** Two shrines to An Mhuir keep separate counts.
- **One keeping per god.** Once one shrine of a god has kept you, a third prayer at another of that god's shrines keeps nothing more, and the altar says so. The five kept boons can all be held at once, one per god. How they stack is a balance question for the systems builder, not a story one, and this draft doesn't answer it.
- **The Weaver keeps nothing.** Its boon is a rubbing (§4.1). A rubbing can't be kept, so the third prayer there gives only its line, and the rubbing comes each day as before.
- **What stays.** Every prayer still restores health, mana and stamina.
- **The Church's view of the six.** The canon names the Church of the Weaver as a later Aurennais institution *that took the name and forgot the price*. It doesn't say what the Church thinks of the other five. I chose the reading that agrees with its line on the Guest (*a mistake of the old culture*): the Church holds that the old people named the Weaver's works as six persons. It calls that an error of emphasis, and it tolerates it.

**Shape.** It isn't a quest-log quest. It is a counter at each shrine, with three states (first prayer, second prayer, kept) and a line at each. The draft also gives one priest topic in four voices, and three rumours.

**Changes.** A kept boon never runs out: it is not in `ACTIVE_BUFFS`, it is not replaced by a potion of the same type, and it survives a load. The character sheet lists it. Nothing else in the world changes.

**Reward.** The god's boon, kept. No gold and no XP.

### 1. The altar, prayer by prayer

The prompt is unchanged: `Press 'E' to pray to An Mhuir, the Sea`.

**First prayer at a shrine** — unchanged:
> You are restored, and carry the Boon of the Road until tomorrow.

(At the Weaver's shrine, unchanged: *You are restored. The Weaver leaves a rubbing on the altar: {gate}.*)

**Second prayer** is a toast. The god's line goes first, then today's boon clause, which is unchanged:

| God | Line (then *"You are restored, and carry {boon} until tomorrow."*) |
|---|---|
| An Mhuir | Salt on the altar, and no sea in sight. |
| An Spéir | The shadow on the sundial falls a moment late. |
| Na Beithígh | A hare sits up at the edge of the steps and watches you kneel. |
| An Chloch | The altar is warm, and the day is not. |
| An Teallach | The flame steadies when you kneel. |
| An Fíodóir | The flame leans toward you, then remembers itself. *(then the rubbing clause, unchanged)* |

**Third prayer: kept.** A popup in the register of the Mouth and the keystones: second person, what you see first, then what it means, then the plain fact. The title is the shrine's name. The god's name comes from `S.god.name`.

**Shrine of An Mhuir**
> The flame leans away from you, the way a candle leans in a draught off open water, though there is no water here and no draught. The hull on the altar is carved keel-up, as the old people carved it: a boat turned over is a boat come home.
>
> The old people said the sea owns them twice a day. It owns a little of you now. The Boon of the Road is yours, and does not wear off.

**Shrine of An Spéir**
> The sundial on the altar throws its shadow where the hour says it should, and then, for a breath, a little further on, as if the day had been told something and was turning it over.
>
> The sky does not hurry, and it does not forget. The Boon of Renewal is yours, and does not wear off.

**Shrine of Na Beithígh**
> The wolf on the altar is worn smooth at the muzzle, where hands have touched it for luck longer than there have been names for luck. Your hand fits the wear.
>
> Her children do not know their mother. She knows them, and she knows you now. The Boon of the Arm is yours, and does not wear off.

**Shrine of An Chloch**
> The gate carved on the altar is shut. It was carved shut; nobody alive has seen it any other way. Under your palm the stone is warm, the way a wall is warm long after the sun has left it.
>
> What the stone takes, it holds. The Boon of Stone is yours, and does not wear off.

**Shrine of An Teallach**
> The lamp on the altar has no wick and never had, and the flame above it burns anyway, low and steady, the way a kitchen fire burns when someone is expected home.
>
> The Hearth keeps the names of those who come in off the road. It has yours. The Boon of the Mind is yours, and does not wear off.

**Shrine of An Fíodóir**
> The shuttle on the altar lies across the stone the way a shuttle lies when the weaver has only set it down. There is a thread caught under it. There is always a thread caught under it; the priests say it is carved, and it is.
>
> The Weaver gives no boon to keep. It leaves you a rubbing, as it does. But the flame has turned toward you, and it does not turn back.

**Log line on the third prayer** (not at the Weaver's shrine):
> ⛩ {Shrine name} keeps you: {boon label}, for good.

At the Weaver's shrine the log line is unchanged: *Prayed at Shrine of An Fíodóir: …*

**Every prayer after the third** at the shrine that kept you. This is a toast, and it replaces today's line:
> You are restored. The altar knows you.

At the Weaver's shrine, the rubbing clause as today, after *You are restored.*

**A third prayer at a second shrine of a god that has already kept you** (a toast):
> You are restored. A shrine of {god name} has kept you already, and a god keeps a person once.

**Too soon** — unchanged: *The altar is quiet. Come back tomorrow.*

**Character sheet**, one row per kept boon:
> Kept at {shrine name}: {boon label}

### 2. The priest — *"Do the old shrines remember?"*

This topic appears at any church once the player has prayed at any shrine (`worldState.shrines` has an entry). It has two states: **before** (nothing kept yet) and **after** (at least one boon kept). The priest's people is `def.people||peopleOfSite(site)`, as in the Guest draft.

**Aurennais priest** (the Church's line):
- *"Do the old shrines remember?"* → "The Church's position, Master, is that the old people named the Weaver's works as though they were six persons, and knelt to the works. It is an error of emphasis, and a tolerated one. Whether a shrine keeps an account of who kneels at it is not a question the Church has put in writing."
  - Follow *"And if it does?"* → "Then it keeps better books than the Church allows, and I would not care to be in arrears with it. Three visits, the country people say. I neither advise it nor forbid it."
- *After* → "You have been three times to one of them, Master, I think. The country people have a word for that. The Church has no form for it, and no fee."

**Gatelander priest:**
- *"Do the old shrines remember?"* → "My grandmother said a shrine is like a neighbour. Call once and you're a stranger, twice and you're company, and three times you're family, for better and for worse. I never found her wrong about neighbours."
  - Follow *"For worse?"* → "Family is kept. You don't get to stop being kept because you'd rather not be. Weaver keep you, and the other five as well."
- *After* → "You've been kept, so. It's done now, and it can't be undone, and my grandmother would tell you that was the point of it."

**Markish priest:**
- *"Do the old shrines remember?"* → "Aye. Three times at one altar and it keeps you. Don't ask me how. I light the lamps."
  - Follow *"Is it the Weaver?"* → "Church says it's all the Weaver. The stones don't say. By iron, I've seen it take hold of men who'd laugh at you for asking."
- *After* → "Kept, are you. Good. Don't waste it."

**Old Blood priest** (sparing; the older word first):
- *"Do the old shrines remember?"* → "Cuimhne. Memory. The stone does not pray back. It remembers. Three is the old number for it."
  - Follow *"Why three?"* → "Once is passing. Twice is chance. Three times is a road. The stone keeps roads."
- *After* → "The stone has you. That is not nothing."

### 3. Rumours

One line added to each register's pool in `RUMORS`. The Aurennais line contradicts its own speaker's Prior, and the Markish line is a captain who would not admit it:
- `irish`: "Pray three days at the one shrine and it keeps you, they say. My aunt did it at An Chloch's. She's not had a cold since, she tells me, and she tells me often."
- `anglo`: "A captain up the valley went three days running to the wolf altar. Swings like two men now. Won't say a word about it."
- `french`: "The country people hold that a shrine keeps an account of its visitors and settles it on the third. The Prior calls it superstition. The Prior has been seen at one. Twice."

### What in the code would carry it

- **worldState.** `worldState.shrines[siteId]` is a number today: the game-minute of the last prayer (`shrineInteract`, grep `The altar is quiet`). It becomes `{t, n}`, where `n` counts the prayers that gave a boon. On load, `ssSanitizeLoaded` turns a bare number into `{t:number, n:1}`. A new `worldState.shrineKept = {godKey: siteId}` holds one entry per god. Both are saved with `worldState`.
- **The prayer.** In `shrineInteract`, after the too-soon check:
  - `n += 1`.
  - `n === 2`: prefix the god's line.
  - `n === 3`, the god has a boon, and `shrineKept[god.key]` is unset: set it, open the popup (the same popup the Mouth and keystones use), log the line, and skip the timed `_applyBuff`.
  - `n === 3` at a shrine whose god another shrine has kept: the *keeps a person once* toast.
  - `n > 3` at the keeping shrine: the *knows you* toast.
  - The Weaver: `n === 3` opens its popup and the rubbing still drops.
  - The lines live in a table keyed by `god.key` (`muir, speir, beithigh, cloch, teallach, fiodoir`), next to `GODS`.
- **The kept boon.** It must not go through `ACTIVE_BUFFS`, which is cleared on load. (Before Session 341, `_applyBuff` also replaced any buff of the same type.) The plainer carrier is a `keptMult(type)` read from `shrineKept` via `GODS`, multiplied into `_buffMult(type, def)`, so every existing reader picks it up.
- **The boons themselves (correction, after this draft was written).** When I drafted this, three of the five boon types were read nowhere: `swiftness` (the Road), `warding` (Stone, and the Shield spell) and `regen` (Renewal). The systems builder has since fixed all three on main: Session 316 (`tests/wardswift.test.mjs`) made `warding` scale damage taken and `swiftness` scale speed, and Session 338 made Renewal restore 0.5/s. Session 341 also changed stacking: a weaker buff of the same type no longer ends a stronger one. The carrier described above still holds, because `ACTIVE_BUFFS` is cleared on load.
- **The priest.** Next to `penanceTopics(site)` in the church's `_extraFn` (grep `the priest hears a confession`), add `shrineTopics(site, def)`. It returns `[]` unless `worldState.shrines` has a key. In the before state it is a folder with one follow; in the after state it is a single response. It sits beside the Guest draft's `guestTopics` if that is built.
- **Rumours.** One string appended to each of `RUMORS.irish`, `RUMORS.anglo` and `RUMORS.french`.
- **Character sheet.** Next to the People row (grep `row('People'`), one row per `shrineKept` entry.

### Checked against the canon

- *No chosen-one prophecy.* Nothing is said about the player beyond what they did three times. None of the three descriptions appears. The Weaver's *the flame has turned toward you* is the loom noticing, in the register of the tutorial's *something turns its attention toward you*. It is not a calling.
- *Na Beithígh.* *"Her children do not know their mother"* is §4.1's scripture, and so is An Mhuir's *owns them twice a day*.
- *The gods are works, not persons.* No god speaks. The altars change, and the priests argue about what that means.
- *Register.* The Aurennais priest uses *Master*, qualifiers and account metaphors, and no oath. The Gatelander priest speaks in a proverb, gives no bare yes or no, and swears by the Weaver. The Markish priest is short, says *aye*, and swears by iron. The Old Blood priest says little and puts *cuimhne* first.
- *Slurs and contradictions.* None are used here. The Aurennais rumour contradicts its own Prior, which is the canon's pattern (§2.1).

---

## The Yard at Caer Slige — a real duel, with a ring and a yield

**Built.** Michael's A on #69 (30 Sep 2026); built in Sessions 373–374 with sections 1–9 word for word (quest review, run 4). Section 10 stays with the author. The status line below is the draft's own, kept as written.

*Unapproved. Drafted 30 Sep 2026. Backlog A, the faction line's owed item: "a real duel (a ring, a yield)". It replaces the League's ninth service, **The Duel at Caer Slige** (Session 128), which today is a fight to the death with a Bandit Captain wearing Hesket Rowe's name. Whether Rowe can survive it is Michael's call (decisions.md, Pending: "Hesket Rowe at the yard"). This draft is written for the recommended answer, that she lives if she yields and is spared. The other answers change only the lines marked **(fate)**.*

### What the canon fixes, and where it is silent

Canon §1.2: the Captains' League gives office *by acclamation*, settles disputes *by duel*, and prides itself on *an oath kept* and *a quarrel finished by noon*. §1.5: in the Mark, duels are legal. §12a: an occupied League town *loses its duels*, which is why systems has waited for duels to exist (decision #37). §2: Markmen speak in short sentences. They say *aye*, use nicknames, swear on iron and blood, and use no honorifics. §8.2: the garrison captain at the strait is Varek's unwitting agent, *paid in sigil-light*, and the spire above the garrison holds the second seam.

Hesket Rowe is not in the canon. She is the build's (Session 128): a Markish mercenary, one service ahead of the player in all three faction lines. In the Crown's and the Compact's lines she is alive at their finales and heading north. Only the League's line kills her.

Where the canon is silent, I chose the plainer thing:
- **A duel ends at a yield.** The canon doesn't say whether a Markish duel is to the death. *A quarrel finished by noon* reads as settled, not buried, and *an oath kept* reads as a rule that binds the winner too. So a yield ends it, and a blow after a yield is murder.
- **The yard's rules are three.** Nobody else steps in. Crossing the rope is a yield. After a yield, nobody touches the one who yielded.
- **Any weapon, any spell.** The canon gives the Mark no quarrel with magic; its contempt is for priests, ledgers and soft hands. A ring that banned spells would shut out a mage's build at a faction's finale.
- **Losing is not the end.** If the player yields or goes down, Rowe is acclaimed. The challenge becomes the player's right, the same way it was hers, and the ring is laid again a week later.

### Shape

- **Giver.** The Captain of Caer Slige, the League's seat (`lordFor(site)`, a Mark garrison, so the title is *Captain* and the name comes from the Mark bank). He speaks the brief, as every League service does.
- **When.** The League's ninth service. The player is a Reeve with eight services done.
- **Step 1, the brief.** The Captain gives the challenge. The objective is *Meet Hesket Rowe in the ring east of Caer Slige*.
- **Step 2, the yard.** A ring of stakes and rope, about 10 units across, stands on the existing yard spot east of the walls (`site.x+(site.pad||30)+14`). Eight watchers of the garrison stand round it, and a yard-sergeant stands at the rope. Rowe waits inside. The ring is laid from first light to noon. Outside those hours Rowe waits at the seat, and the sergeant is at the rope with a line about the hour. **(hours)** If the hours cost more than they give, drop them and the three lines marked (hours).
- **Step 3, the fight.** The player walks in and tells the sergeant to call it. Rowe fights with the full combat set (posture, riposte, the heavy blow). Watchers call out.
- **States.** Five, recorded on the quest as `data.state`:
  - `wait`: the ring is laid, and the fight hasn't begun.
  - `fight`.
  - `yielded`: Rowe is on one knee.
  - `won`: the player spared her, and the yard acclaims the player.
  - `lost`: the player yielded, crossed the rope or went down, and the yard acclaims Rowe.
  - A sixth, `murder`, is a failed quest: the player struck Rowe after she yielded.
- **Turn-in.** At the Captain, on `won` (the finale's reward and rank, as today) or on `murder` (no reward, and the League closes). On `lost`, the Captain names the rematch day, and the quest stays open.
- **Reward.** As today: 220 gold plus 20 a level, Captain (rank 3), the garrison, and the war (`warFromFaction`). Nothing on `lost` or `murder`.
- **What it changes.** On `won`, Rowe lives and stands at the seat as a Reeve, with the League's rank-3 lines (below). On `murder`, `fstate().league.closed = true`, the Mark's towns carry a rumour, and Rowe is gone from every line. On `lost`, Rowe is *Captain Rowe* at the seat until the rematch.

### 1. The Captain of Caer Slige — the brief (Markman)

The brief is unchanged, and the ring is added to it:
> "A Captain of the League is made by acclamation, and acclamation is won on the yard. Rowe has claimed the challenge. It's her right. The ring's laid east of the walls from first light. Walk in when you're ready. Down or yield, and it's done by noon."

**Objective:** `Meet Hesket Rowe in the ring east of Caer Slige`

On `lost`, when the player comes back (the *Serve the Captains' League.* topic):
> "Rowe's Captain. The chair's hers till someone takes it off her on the yard, and that's your right now, same as it was hers. Give your arm a week. The ring goes up again on the {weekday or 'seventh day'}."

(If the calendar has no day names yet, *"in seven days"*.)

Before the week is out:
> "Not yet. A week, I said. Rowe's not going anywhere, and neither's the chair."

### 2. The yard-sergeant (Markman; role *Yard-sergeant*, a name from the Mark bank)

**Greeting**, in the ring's hours, before the fight:
> "You're the other one. Rowe's been in there since first light."

**(hours)** Outside them:
> "Ring's down. It goes up at first light, and it comes down at noon, fought or not."

**Topics** (in `wait` only):
- *The rules?*
  > "Three. Nobody steps in. You go over the rope, you've yielded. Somebody yields, it's over, and you don't touch them after. That last one's the only one anybody remembers."
- *What do I fight with?*
  > "What you walked in with. Steel, a bow, the old words if you've got them. The yard doesn't care how. It cares that it's you."
- *And if she dies?*
  > "She won't, before she yields. Rowe's not proud that way. After she yields, it's murder, and the whole Mark will know your name by the week's end."
- *Call it.* (quest; starts the fight)
  > "Rope's up. Iron and blood, the pair of you. Go on."

### 3. Hesket Rowe, in the ring (Markman)

**Greeting**, in `wait`, chosen by the player's people (`WORLD.playerPeople()`):
- markman: "One of ours. Good. Nobody'll say it wasn't fair."
- gatelander: "A turf-cutter on the yard. They say your lot won't leave a wounded man. We'll see if you'll let one up."
- aurennais: "Your Church says the yard's for the unlettered. You came anyway. That's the first thing I've liked about you."
- oldblood: "Cold-eyes. The sergeant asked me if it's allowed. It's allowed. I'll try to look straight at you. People tell me that's hard."

**Topics** (in `wait`):
- *Why do you want it?*
  > "Captain's a garrison and forty mouths. I've fed worse. And somebody ought to ask what the spire pays the sergeants in, because it isn't silver."
- *We don't have to do this.*
  > "Aye, we do. You're Reeve, I'm Reeve, and there's one Captain's chair at the strait. We settle it by noon and drink after."

### 4. The fight

**Start** (`showMsg`):
> The rope is up. Hesket Rowe lifts her blade.

**Log** (`addLog`, ⚔): `The duel at Caer Slige: Hesket Rowe.`

**The watchers.** Every six to nine seconds, one watcher calls out in a bubble (`sayBubble`), and no line comes twice running. Markmen give nicknames. The watchers name the player by the weapon in hand: a sword is *Blade*, an axe *Hatchet*, a mace, club or hammer *Hammer*, a bow *Bowstring*, a staff *Stick*, a dagger *Pin*, and bare hands *Fists*. Rowe is *Rowe* or *Hesket*.
- "Feet, Rowe! Feet!"
- "Get your guard up, {nick}!"
- "That's blood. Keep at it."
- "Iron and blood!"
- "Watch her left, {nick}."
- "Don't dance. Fight."
- "Hesket! Hesket!"
- "Up, {nick}! Up!"
- "Finish it by noon, the pair of you!"

**Posture break on Rowe:** "She's open!" **On the player:** "Rowe's got you, {nick}."

### 5. Rowe yields — `yielded`

Rowe cannot be killed before she yields. When her health first falls to a quarter, she stops and kneels, lays her blade down, and takes no more blows from the fight's own logic.

`showMsg`:
> Hesket Rowe goes down on one knee and lays her blade on the ground.

**Rowe** (bubble):
> "Enough. I yield. It's yours."

**Spared.** If three seconds pass with no blow landed on her, the state is `won`.

Watchers (bubbles, two or three at once): "Captain!" · "Captain! Captain!" · "Iron and blood!"

`showMsg`:
> The yard acclaims you Captain.

**Rowe** (bubble, as she stands; also her greeting until the player leaves the yard):
> "Good fight. I was a step slow on the left, and you saw it. Buy me a drink when you've a garrison to buy it in."

`qComplete`, then *report to the Captain*.

**Struck.** A blow that lands on her in `yielded` kills her, and the state is `murder`. **(fate)** Under answer B there is no yield for her and this whole section goes. Under answer C the watchers catch the blow (`"Hold!"`), and the section ends at *Spared*.

`showMsg`:
> Hesket Rowe is dead. The yard is silent.

**The yard-sergeant** (bubble):
> "She yielded. Every one of us saw it."

The watchers turn their backs and say nothing more. The ring comes down at once.

### 6. The player yields or goes down — `lost`

The ring holds the player at 1 health: a blow that would kill leaves them down, and it counts as no death. Below 30% health, the yield offer opens as a dialogue, the same way the guard's does (`offerYield`).

**Rowe:**
> "You're done. Say it, and it's done."

Topics:
- *I yield.*
  > "Heard. Up you get. You'll want that arm again."
- *Not yet.*
  > "Your blood, then."

**Down** (`showMsg`):
> You go down, and stay down. The yard acclaims Hesket Rowe Captain.

**Yielded** (`showMsg`):
> You yield. The yard acclaims Hesket Rowe Captain.

**Over the rope** (`showMsg`):
> You step over the rope. That is a yield. The yard acclaims Hesket Rowe Captain.

**Rowe at the seat until the rematch** (the rival NPC, key `league|lost`):
- Greeting: "Captain Rowe, for a week at least. The ring's there when you want it. I'd want it back."
- *How are you ahead of me?* (existing topic; new response in this state): "I was a step slow on the left, and you didn't see it. Next time you might."

### 7. The turn-in — the Captain of Caer Slige (Markman)

**On `won`** (replaces the `after` line today, which ends at Rowe's burial) **(fate)**:
> "Acclaimed. Rowe says you fought well, and she doesn't say that of many. You're Captain now, and the spire's yours to hold. Something up there pays my sergeants in light. I've stopped asking what."

The build wraps the line: it opens with the rank (`${F.name} names you ${rank}.`) and closes with *There's a garrison in it, when you want it.* Both stay. One slip there is older than this draft: `F.name` is *the Captains' League*, lower case, so the sentence reads *"the Captains' League names you Captain."* The builder should capitalise the first letter, as `factionTopics` already does for the fine (`F.name.replace(/^the /,'The ')`).

**On `murder`:**
> "The yard saw it. So did I. There's no acclamation for that, and there's no League for you either. Leave your oath at the gate."

`addLog` (🏛): `The Captains' League has closed its gates to you.`

**At any League seat afterwards**, *Serve the Captains' League?* gives:
> "Not you. We've a long memory for the yard, and a short one for excuses."

### 8. Hesket Rowe afterwards, if she lives — rank 3 in the League line (Markman)

Today, `rivalBeat` leaves the League out at rank 3 because she is dead. On `won` she stands at the seat. **(fate)**
- Greeting: "Captain. Took me a week to stop favouring the left. I'm staying on at Caer Slige a while. Somebody ought to watch that spire."
- *What now, Rowe?*
  > "The spire. You hold it, and I'll watch what comes down off it at night. If it's the light I think it is, you'll want a witness who can't be paid in it."
- *How are you ahead of me?* (existing topic; new response here): "I'm not, now. Don't get used to it."

The lines point at the spire (backlog A's *the spire held after the League's finale*) and commit it to nothing.

### 9. Rumours (on `murder` only)

One line added to `RUMORS.anglo`, spoken only in the Mark while `league.closed` holds and Rowe died on the yard:
> "Somebody put Hesket Rowe down on the yard at Caer Slige after she'd yielded. Nobody says the name. Everybody knows it."

### 10. One line in the Compact's finale, older than this draft

The Compact's ninth *after* line (grep `Cold-eyes always find their own`) reads:
> "The strait's quieter. Prior — and the house and the ship are yours. Rowe's gone north with the League, they say. Cold-eyes always find their own."

*Cold-eyes* is everyone's word for the Old Blood (§2), and Rowe is a Markman (`people:'markman'`). The line calls her Old Blood, or calls the League Old Blood, and the canon says neither. The speaker is the Compact's Prior, an Aurennais: *they say* is a Gatelander's hedge, and the line has no qualifier and no account metaphor. The line is older than the review's baseline, so it is not a finding. It is written here because this draft rewrites the faction finales. Replacement, for the author to take or leave:
> "The strait is quieter, Prior, and the house and the ship are entered in your name. Rowe has gone north to the League, one hears. The League pays in silver and does not tithe it, and some accounts are settled by that alone."

(This matches Rowe's own line in that finale: *"the League pays in silver and doesn't tithe it."*)

### What in the code would carry it

- **The service.** `FLINES.league[8]` keeps `kind:'duel'`, and its `brief` gains the ring sentence. `after` splits into `afterWon` and `afterMurder`, and `factionAfter(fk,i)` gets the quest so it can read `q.data.state`.
- **The quest kind.** Today `factionQuestFor` makes the duel a `road` quest, and that has two side effects. `killE` completing a `road` quest runs `markRoadCleared` on a road at the seat (grep `q.kind==='road'&&e._questTag===q.id`), so winning the duel clears a road. The compass also draws the duel as *the camp* with a tent. The duel wants its own `kind:'duel'`, with `data:{x,z,state:'wait',retryDay:null}`, and a marker labelled *the yard*.
- **The yard.** A `tickDuel()` beside `tickFactionKinds()`:
  - Within 180 units, it lays the ring (stakes and a rope line) and spawns the sergeant and eight watchers with `spawnNPC`: `people:'markman'`, names from the Mark bank, `sched:{type:'lost'}`, facing in.
  - It spawns Rowe as the `Bandit Captain` with `enemyName` as today, plus `duel:true`. She is not hostile in `wait`. Her damage floors at 25% of her max health, which triggers `yielded`: no AI, a kneel pose. In `yielded`, a landed hit kills her.
  - It takes the ring down at noon **(hours)** and on any end state.
  - Add each rig to the scene as soon as it is built. `tickPeople` disposes rigs that have no parent.
- **The player.** Inside the ring in `fight`, `PHP` floors at 1, and that is `lost`. Below 30%, it opens the yield dialogue, as the guards' `offerYield` does (grep `CR.yielded`). Distance from the centre past the rope's radius plus 1 is `lost`. No death is counted, so the Reader's *returns* doesn't see a duel.
- **The watchers' barks.** `sayBubble(n,text)` on a random watcher, every 6–9 s of `g.spin()` time. The nickname comes from the equipped weapon's `weaponShape` (the same test `tpWeapon` makes).
- **The rival.** `rivalLines(fk,st,F)` gains the League's rank-3 lines, and a `lost` state keyed on the quest. `rivalBeat` drops `fk!=='league'&&` from its rank-3 test when `worldState.factions.league.rowe !== 'dead'`.
- **worldState.** `worldState.factions.league.rowe` holds one of `'alive'`, `'captain'` (Rowe won and the rematch is open) or `'dead'`, and `closed` is already on the record. Both sit inside `worldState.factions`, which the load already reads back, so no new key goes on the S242 list.
- **Occupation.** Once this exists, §12a's *an occupied League town loses its duels* has something to take away: an occupied Caer Slige lays no ring. That is the systems builder's rule to write, and decision #37 left it waiting for this.

### Checked against the canon

- *Register.* Every speaker is a Markman. The lines are short, and they say *aye*, swear on *iron and blood*, and use nicknames (*Blade*, *Hatchet*, *Stick*). Nobody uses an honorific. *Captain* and *Reeve* are ranks, used as the League uses them. The one Aurennais line, in §10, has its honorific, its qualifier and its account.
- *Slurs.* Rowe says *turf-cutter* and *cold-eyes* to the player's face, as §2.1 has Markmen do. In the same breath, the *turf-cutter* line gives the Markish contradiction from §2.1 (*"A Gatelander won't leave a wounded man"*). The *cold-eyes* line keeps §2.2's inconsistency: she will *try to look straight at you*. The *unlettered* line is the Compact's own word, and she turns it into a compliment. None of them is about bodies.
- *No chosen one.* Nobody says the player was meant for this. The yard cares *that it's you*, meaning the challenger by right.
- *Varek's agent.* The Captain is still paid in light and still doesn't ask. Rowe asks, which the canon leaves open, and so does this draft.
- *Silent, and chosen plainly:* a duel ends at a yield, spells are allowed, and a loss can be fought again. See *What the canon fixes*.

---

## The Spire Held — a night on the roof at Caer Slige

*Unapproved. Drafted 1 Oct 2026. Backlog A, the faction line's last owed item: "the spire to hold after the League's finale". The League's ninth service now ends with the Captain of Caer Slige saying "the spire's yours to hold. Something up there pays my sergeants in light", and Rowe, spared, saying "You hold it, and I'll watch what comes down off it at night." Nothing in the game yet lets the player do either. This draft is what holding it means.*

### What the canon fixes, and where it is silent

- **Fixed.** The spire above Caer Slige holds the second seam (§8.2). The garrison captain at the strait is Varek's *unwitting* agent, paid in sigil-light (§8.2). The Spire of Caer Slige is an anchored place: a tower within 300u of the garrison (§9), built as a POI with a stair inside, a top room and a walkable roof inside a parapet. Sigils are being etched over, stroke by stroke (Act II, Part I). Antibodies form wherever the binding is strained, and they don't know what they are (§3.1, §4.1: *"her children who don't know their mother"*). The League holds gates; its claim is that they belong to whoever holds them (§1.2). Every beat in Acts II–III ends with a direction (§10). Touching is permitted; understanding is not (§3.1).
- **Silent: what sigil-light pays.** The canon says *paid in light*, not what that buys. This draft takes the plainest reading. Light comes out of the new cuts after dark, and anyone who stands in it comes down warm. In the Mark, warm is worth more than silver, so the night watch asks for the spire, and the Captain posts them gladly and asks nothing about where the warmth comes from. That keeps him unwitting. He is complicit only the way anyone paid is complicit.
- **Silent: who cuts the strokes.** Nobody is seen. Rowe watches the door all night, and nobody goes up. The cuts were made some other night, by someone with a key or the time. The draft points at Port Blackhand, where Oswy Blackhand keeps his haven and where seam-material moves by sea (§8.2, §9). It commits to nothing more.
- **Silent: what comes down off it.** *The Watch on the Spire*, the League's fifth service, already culls wolves below it (the seat's cull target, Snow Wolves in the tundra). Here they are seen being made: wolf-shapes that form in the light on the roof. That is the antibody mechanic at its smallest. They are not named antibodies like the Faolchú.
- **Silent: whether the seam is a sigil to learn from.** This draft doesn't decide. The stone can be looked at and not touched for a spell. Whether a sigil-reader could take Mastery from the second seam belongs to the Act II main quest, so it is left open.

### Shape

- **Giver.** The Captain of Caer Slige (the seat's lord, a Markman), once the player is Captain of the League. At rank 3 Rowe is always alive, because the only road to rank 3 is a spared yield.
- **Steps.**
  1. *The spire?* at the seat gives the quest: hold the Spire of Caer Slige from dark to first light.
  2. At night (20h–6h) a night sergeant stands at the spire's door. With the Captain's word he gives up his watch and goes back to the garrison.
  3. On the roof at night, the parapet's inner face is cut with old strokes and new ones across them, and light moves in the new cuts. The stone can be looked at.
  4. **The watch.** It begins when the player first stands on the roof between 20h and 1h. Three waves of wolf-shapes form in the light on the roof: the first a quarter of an hour in, the second two hours later, the third two hours after that. Each wave is two or three, the third is three. The watch holds if the player is still on the roof at 6h with every wave dead.
  5. At first light the cuts go dark and the stone goes cold. Rowe is at the spire's foot from 6h to 9h that morning.
  6. Turn in to the Captain of Caer Slige.
- **States.** `league.spire`: unset → `'given'` → `'held'`. The quest's `data.state`: `'wait'` → `'watch'` → done. Going down the hatch, dying, or being away from the roof for more than ten seconds before 6h puts the quest back to `'wait'`, and the light comes back. It can be tried again the next night, with no limit.
- **Reward.** 260 + 20 × level gold and the League's regard, as a set piece pays. The spire is held for good. No light comes after dark, no wolf-shapes form, the night sergeant never stands at the door again, and the seat's rumours change.
- **While Caer Slige is occupied.** The quest cannot be given. If it is active, the watch cannot begin. *An occupied League town loses its duels* (§12a), and it loses its spire with them.

### 1. The Captain of Caer Slige — the brief (Markman)

A new topic at the seat once `league.rank >= 3`, after the existing faction topics.

*The spire?* (unset; the quest is given)
> "The spire's yours to hold. I said it on the yard and I'll say it sober. My night sergeant stands at the door, and the light does the rest. Go up after dark and stay up till first light. Whatever comes down off it doesn't come down past you. Then we'll both know what my men have been paid in."

*The spire?* (`given`, not yet held)
> "Still lit at night, is it? Then it's not held. Dark to first light, and not a breath less."

*The spire?* (Caer Slige occupied)
> "The spire's behind their lines. Take the town back first. The spire after."

Journal objective: `Hold the Spire of Caer Slige from dark to first light`
Compass label: *the spire*, with the existing tower icon.

### 2. The night sergeant (Markman; role *Sergeant*, a name from the Mark bank, seeded by the spire's id)

He stands at the spire's door from 20h to 6h while `league.spire !== 'held'`.

Greeting (one of these, without the quest):
> "Night watch. The spire's shut to anyone the Captain didn't send."
> "Warm up there tonight. Always is."
> "Stand where you like. Just not between me and the door."

Greeting (with the quest):
> "So you're the one. Captain says you're to have my watch. Captain says a lot."

Topics:
- *What's up there?*
  > "Stair, a top room with a chest somebody emptied before my grandfather, and the roof. And the light, after dark. It runs in the cuts on the parapet like rain down a pane. You don't look at it long. You don't have to."
- *What does it pay?*
  > "Silver, same as any watch. And you come down warm. In the Mark that's worth more than the silver. I've not been cold since the spring. Nor has any man who's stood up there. Ask them."
- *What comes down off it?*
  > "Wolves, near enough. They come out of the light on the roof, and down the stair after. We kill them at the door, a few every night. Captain calls it the hill's tax."
- *Let me up.* (without the quest)
  > "Not without the Captain's word. I don't care whose Captain you are."
- *Let me up.* (with the quest; he leaves for the garrison, and the door is the player's)
  > "Aye. Iron and blood, then. It's your watch. I'll be at the garrison, freezing like an honest man."

### 3. The roof, at night (narration)

The player comes up through the hatch with the quest active, between 20h and 6h (`showMsg`):
> The parapet's inner face is cut with old strokes, and across them new ones, pale in the grey stone. Light moves in the new cuts. It is warm up here.

By day, with the quest active (`showMsg`, once a visit):
> By day the spire is only stone. The light comes after dark.

Prompt at the parapet: `Press 'E' to look at the stone`

Looking at the stone (`showMsg`; the second sentence is for an Old Blood player only, after the first):
> An old carving runs round the inside of the parapet, worn soft by fifteen hundred winters. Someone has cut across it: short, straight strokes, with the dust still in them. The light comes out of the new cuts, not the old ones. Where it falls, the stone is as warm as a hand.
>
> *(Old Blood)* You could read the old strokes, if you let yourself. You don't.

By day the stone reads the same without the light:
> An old carving runs round the inside of the parapet, worn soft by fifteen hundred winters. Someone has cut across it: short, straight strokes, with the dust still in them. The stone is cold.

### 4. The watch

`addLog` (🌙) when it begins:
> The watch on the spire: dark to first light.

The waves (`addLog`, 🌙):
- First: `Something gathers in the light on the parapet and drops to the roof on four legs.`
- Second: `The new cuts brighten. Two more shapes come out of them.`
- Third: `The light pours. Whatever it makes, it makes faster now.`

A wave cleared (`addLog`, 🌙): the first two `The light thins.`, the third `The cuts are dim. The sky to the east is not.`

The HUD's *Wait*, pressed on the roof during the watch (`showMsg`):
> Not on watch.

Leaving the roof before 6h, by the hatch or by falling (`showMsg`):
> You leave the roof. Behind you, the light comes back into the cuts.

First light, the watch held (`showMsg`; then `addLog` 🏛 `The Spire of Caer Slige is held.`):
> First light. The new cuts are only cuts now, pale and dry, and the stone under your hand is cold. The spire is held.

### 5. Hesket Rowe at the spire's foot, that morning (Markman)

From 6h to 9h on the morning the spire is held. After that she goes back to the seat (§7).

Greeting:
> "Still standing. Good. I stood under it all night. Warm as a hearth, and I didn't want any of it."

Topics:
- *Did anyone come?*
  > "Nobody up, nobody down, nobody near the door. I'd swear it on iron. So those cuts weren't made tonight. Whoever made them had a key, or the time, or both."
- *What was the light?*
  > "Pay. That's the whole trick, I think. You stand in it, you want it, and you stop asking who's paying. The sergeants never asked. Nor did the garrison."
- *Where now?*
  > "Ships come into the strait at night with no lamps. Port Blackhand's the only harbour on this coast that doesn't ask what's in the hold. I'd start there."

(If the world has no Port Blackhand, the anchored place being null, the last line reads: *"Ships come into the strait at night with no lamps. Find the harbour that doesn't ask what's in the hold. I'd start there."*)

### 6. The turn-in — the Captain of Caer Slige (Markman)

*The spire?* (held; quest completes, gold paid; the reward is appended as the faction lines do, `(N gold.)`)
> "Held, then. The night sergeant's back on the wall, cold as the rest of us, and telling anyone who'll listen. Let him. Somebody cut those strokes, and I never sent a man up to look. That's mine to carry. The spire's yours."

*The spire?* (after)
> "Held. The men sleep badly now. They'll get used to it. So will I."

### 7. Afterwards

**Rowe at the seat** (`rivalLines`, League, rank 3, once `league.spire === 'held'`; it replaces the rank-3 greeting and *What now, Rowe?* and keeps *How are you ahead of me?*):
- Greeting: `"Captain. The spire's dark and the sergeants are sulking. That's a good week."`
- *What now, Rowe?*
  > "Port Blackhand, when I've the legs for it. Somebody's been crossing the strait at night without lamps, and I'd like to see the hand on the tiller."

(The same fallback as §5 if Port Blackhand is null: *"The strait's ports, when I've the legs for it. …"*)

**Rumours** (`liveRumours`, while `league.spire === 'held'`):
- Any town of the Mark: `"The spire at Caer Slige has gone dark. The night watch says it's colder for it. The night watch can freeze."`
- Caer Slige only: `"The new Captain held the spire a whole night. Came down at first light and wouldn't talk about it."`

### What in the code would carry it

- **The topic.** `factionTopics(site)` gains a *The spire?* entry for the League at its seat when `st.rank >= 3`, with `quest:true` and an `fn` that reads `st.spire`, the quest's state and `TS(site).flags.occupied`. The quest is a normal record, `{id:'fq_league_spire',kind:'spire',giver:F.name,giverSite:site.id,title:"The Captains' League: The Spire Held",objective:'Hold the Spire of Caer Slige from dark to first light',data:{state:'wait',wave:0,began:null},reward:260+level*20}`, added with `qAdd` and turned in with `qTurnIn`. It is outside the nine services, so `st.done` and the rank do not move.
- **The spire.** `anchoredPlaces().spire` is the site. `buildTower` already makes the roof a platform (`ZONES.world.platforms`, `roof:site.id`) with `S.roof.y`. Being on the roof is the test `roofPrompt` makes: `Math.abs(jumpY-S.roof.y)<1.2` inside the parapet's square.
- **`tickSpire(dt)`** beside `tickDuel(dt)` in the world's tick, within 180u of the spire:
  - It places the night sergeant at the door (`house.doorX/doorZ` of `g_<site>_tower`) from 20h to 6h while unheld, built like the yard's people (`buildNPCMesh`, Mark names, seeded). Add his rig to the scene at once, because `tickPeople` disposes rigs without a parent. *Let me up.* with the quest despawns him.
  - It lights and darkens the glow in the cuts: a few emissive strips on the parapet's inner face, lit from 20h to 6h while unheld. The look is the look builder's.
  - It runs the watch: `began` (game minutes), the three wave times, and the spawns.
  - It ends the watch on 6h with every wave dead (`held`: `st.spire='held'`, quest done), or resets it to `'wait'` on leaving the roof for more than ten seconds, `PHP<=0`, or the town falling.
- **The waves.** Each is two or three of the seat's cull target (`Snow Wolf` in the tundra, as *The Watch on the Spire* uses), spawned on the roof platform at `S.roof.y`. **Check first:** whether a world foe can stand and path on a roof platform. If it cannot, the waves come up through the hatch from the top room instead, and wave 1's line becomes `Something comes up through the hatch on four legs, out of the light below.` Either way the foes are tagged to the quest, so a kill counts only on this watch.
- **The Wait button** reads a `WORLD.onWatch()` that is true in `'watch'`, and shows the line instead.
- **The stone.** A prompt on the roof within 1.5u of the parapet's inner face, in `shipPrompt`'s chain beside `roofPrompt`. The Old Blood sentence reads the player's people (`playerPeople()==='oldblood'`, the same read Rowe's yard greeting makes). Looking sets `st.spireSeen=true`. That is the hook the Act II main quest can read for the Mark's proof (§8.2, *any qualifying sigil gate on each island counts*). This draft wires nothing to the main quest.
- **Rowe.** `rivalLines` gains the `spire==='held'` branch above its rank-3 League branch. Rowe at the spire's foot is a one-morning person placed by `tickSpire`, keyed on the day the watch was held (`st.spireDay`).
- **Rumours.** Two lines in `liveRumours`, beside the yard's murder line.
- **worldState.** `spire`, `spireSeen` and `spireDay` sit inside `worldState.factions.league`, which the load already reads back. No new key goes on the S242 list.

### Checked against the canon

- *Register.* Every speaker is a Markman: short sentences, *aye*, *iron and blood*, *I'd swear it on iron*, no honorifics. *Captain* is a rank, used as the League uses it. The sergeant's *I don't care whose Captain you are* is the Mark's scorn for titles, said to a player who now holds one. The narration is dry and in the present tense, like the yard's.
- *Slurs.* None. The sergeant and Rowe speak to a Captain of the League. The nicknames stay with the yard.
- *No chosen one.* The spire is held because a Captain held it, and the League holds what it holds (§1.2). Nobody says the player was meant to.
- *Varek's agent.* The Captain stays unwitting and says so: *I never sent a man up to look. That's mine to carry.* He is paid in light, as §8.2 says, and he learns it the way the player does.
- *The Old Blood.* The one Old Blood sentence keeps the Withdrawal's law (§3.1): the player could read it and doesn't. It doesn't say why.
- *No new names.* The sergeant takes a name from the Mark's bank, as the yard's people do. Port Blackhand is the canon's own place.
- *Direction.* The beat ends on a harbour (§10).
- *Silent, and chosen plainly:* what the light pays (warmth), who cut the strokes (unseen, pointed at the strait), and what comes down (wolf-shapes). See *What the canon fixes*.

---

## Back to Their Bread — the open ending's three descriptions

*Unapproved. Drafted 2 Oct 2026. Backlog A, consequence hooks: "someone says one of the three descriptions to you and goes back to their bread" in the open ending. Canon §11, the third path: "once in a long while someone says one of the three descriptions to the player and goes back to their bread; Varek is seen, at a distance, at fields." The build already ends that way (`ending('open')` sets `worldState.knowing`, saved and loaded since Session 242), and the ending screen promises it: "Once in a long while, someone will say one of the three descriptions to you, and go back to their bread." Nothing reads `knowing` yet. This draft is what reads it.*

### What the canon fixes, and where it is silent

- **Fixed.** The three descriptions are *the one who returns; the one who walks the shortest road; the one who dies and does not* (§4.2). They recur in old art and older songs. They are heresy, not prophecy, and nobody applies them to the player until Act III, once, by someone who then goes back to their bread (§4.2). After the third path, the world lives watched, and someone says one now and then (§11). Varek is seen at a distance at fields (§11). He never says *game*, *save*, *player* or *screen* (§6), and nor does anyone else.
- **The two "once"s.** §4.2's *once* and §11's *once in a long while* agree if the first one comes after the ending, and the rest follow it at long intervals. Before the ending, nobody says them; *The Seventh Niche* only quotes them.
- **Silent: who says it.** I chose ordinary people: any generated townsperson, of any people, keeper or not. Never a named character, a guard on duty, a faction officer or Varek. The canon's *goes back to their bread* is a person with work in their hands, so every line ends on the speaker's work.
- **Silent: which one.** I chose to tie it to what the player did, as Varek's discoveries are tied (§6). *The one who dies and does not* needs a death on record (`vstate().deaths >= 1`). *The one who walks the shortest road* needs the short road on record (`vstate().shortRoad`). *The one who returns* is always open, because the player has always come back. The speaker doesn't know why the line came to them. The player does.
- **Silent: how often.** *Once in a long while*: at most once a game-week. After that, each greeting from an eligible townsperson has a one-in-six chance. A player who spends a game-week in towns hears it about once.
- **Silent: what it explains.** Nothing. There is no log line, no journal entry and no follow-up topic. The greeting is the description, said in the speaker's voice, and then the speaker's usual topics follow. Varek's notes are *never displayed* (§12), and this is the world's half of the same rule.

### Shape

- **Not a quest.** It is a greeting that replaces the usual one, rarely, after `ending('open')`. A second thing goes with it: Varek at a distance at the fields.
- **States.** `worldState.knowing` (exists). `vstate().told`, the game minute of the last description, and `vstate().fieldSeen[siteId]`, the game minute Varek was last seen at that field. Both sit inside `worldState.varek`, which the load already reads back, so no new key goes on the S242 list.
- **Reward.** None.
- **What it changes.** Nothing but what is heard. Nobody's price, favour or trust moves. It doesn't touch the other two endings: after *unbound* the world is new, and after *sealed* nobody says them.

### 1. The greeting, by people

`{nick}` is the yard's weapon nickname (`duelNick()`: *Blade*, *Hatchet*, *Hammer*, *Bowstring*, *Stick*, *Pin*, *Fists*). Markmen give nicknames (§2), and the Markish lines use it.

**Gatelander** (a proverb where one fits, no bare yes or no, an oath on the Weaver):
- *the one who returns* → "My grandmother had a song about the one who returns. She'd sing it at the churn and stop before the last verse, every time, and I never thought to ask her why. You put me in mind of it, coming in that door. Well. The butter won't wait on a song."
- *the one who walks the shortest road* → "There's a line cut on the old stone by the ford: the one who walks the shortest road. I've passed it every day of my life and never once wondered who it meant till now. Weaver keep you. I've bread in the oven."
- *the one who dies and does not* → "They had a saying in the hills, my mother's people: the one who dies and does not. A word for the stubborn, I always took it. You'd know better than I would, maybe. There now, the dough's risen while I stood talking."

**Markman** (short sentences, *aye*, a nickname, an oath on iron and blood, no honorific):
- *the one who returns* → "Old word in the valleys. The one who returns. My father said it of men who came back from the strait. Not many. He'd have said it of you, {nick}. Right. That wood won't split itself."
- *the one who walks the shortest road* → "The one who walks the shortest road. Cut on the cairns up the pass. Nobody knows who for. You've the look of it, {nick}. Aye, well. The forge wants feeding."
- *the one who dies and does not* → "My grandmother had a saying. The one who dies and does not. She used it on cats. By iron, I'd use it on you. Off you go, {nick}. I've hides to scrape."

**Aurennais** (formal, *Master*, qualifiers, the contract and the ledger, never an oath):
- *the one who returns* → "Forgive me, Master. There is a phrase in the old songs, the one who returns, and the Church reads it as the dead. I find the Church's reading less persuasive this morning than I did yesterday. I make no claim by it, and I would ask you not to repeat it. Now, if you will excuse me, the ledger closes at noon."
- *the one who walks the shortest road* → "The old carvings speak of one who walks the shortest road, Master. The Church holds it to be a figure for death, which takes everyone by the shortest road. I have always accepted that reading. I accept it still, with a reservation I would not care to put in writing. Good day. The bread is owed at the Prior's by the bell."
- *the one who dies and does not* → "Master, the old songs have a line about the one who dies and does not. My tutor at the academy called it an error of transcription. I have no grounds to doubt my tutor. I note only that you put me in mind of it, and that I cannot account for why. The salt will not weigh itself."

**Old Blood** (few words, exact, the older name first):
- *the one who returns* → "An té a fhilleann. The one who returns. My mother had the words. Not the reason. The fire wants turf."
- *the one who walks the shortest road* → "An bóthar is giorra. The shortest road. You walked it here. Go on. I have bread rising."
- *the one who dies and does not* → "An té a fhaigheann bás, agus nach bhfaigheann. The one who dies, and does not. Old words. I do not know who they were for. Sit, if you like. I am busy."

(The Irish is mine, in the deep register the canon uses for the old words. The author may want to correct it, and every line stands without it.)

### 2. Varek at a distance, at the fields

After `ending('open')`, the fields are his again (§11), but he is never close.

- When the player first comes within 420 units of a field (`fieldFor(nation)`, the same test as the discoveries), and Varek hasn't been seen at that field in ten game-days, he stands at the field's far side, about 90 units from the player, facing them. He has no topics. He doesn't move.
- `showMsg` when he appears:
  > Far off across the field, someone is standing, looking out.
- When the player comes within 40 units, he is gone. `showMsg`:
  > Where he stood, the grass is pressed flat, and springing back.
- If the player leaves first, he stays until they are out of sight (beyond 420), and then he is gone.

The second line is the whole of it. He is seen; he is not spoken to. The open ending is a world that *lives watched*, and this is what being watched looks like.

### What in the code would carry it

- **The greeting.** One function in the world module, `knowingGreet(npc)`, exported on `WORLD` and called where `openDialog` picks a greeting (`js/22-dialogue.js`, grep `const greet=npc.greeting[Math.floor`): `const greet=(WORLD.knowingGreet&&WORLD.knowingGreet(npc))||npc.greeting[…]`. It returns `null` unless every one of these holds: `worldState.knowing`; the NPC is a generated townsperson (not `authored`, has a `site`, is not a guard drawn or halting, not a faction officer, not Varek); and the last description was more than 7 × 1440 game-minutes ago (`vstate().told`). Then `Math.random()<1/6`. On a hit it picks among the open descriptions (above), takes the line from a `KNOWING_LINES[people][desc]` table next to `VAREK_LINES` (`npc.people||peopleOfSite(npc.site)`, falling back to `gatelander`, since the Gatelands are the home island), replaces `{nick}` with `duelNick()`, sets `vstate().told`, and returns the line. The topics that follow are the NPC's own and are unchanged. The `c.back` greeting rebuild (grep `Rebuild topics fresh`) should not call it again.
- **Varek at the fields.** In `tickVarek`, a branch that runs only when `worldState.story.ending==='open'`, before `varekDue()`: within 420 units of `fieldFor(nk)`, and with `vstate().fieldSeen[f.id]` more than 10 × 1440 game-minutes old, it places a Varek with no topics (`varekDef`'s look; `topics:[]`, `greeting:[]`) at the point of the field 90 units from the player on the far side, shows the first line, and records `fieldSeen`. Within 40 units it removes him and shows the second line. Beyond 420 it removes him silently. His rig goes into the scene at once (`tickPeople` disposes rigs without a parent). He should not be talkable: `spawnNPC` with no topics, or a flag the E-prompt skips.
- **worldState.** `told` and `fieldSeen` sit in `worldState.varek` (`vstate()`), on the S242 list already. `knowing` is there too.
- **Tests.** A headless check would set `knowing`, force `Math.random` low, open a townsperson's dialogue, and read the greeting by people. Then it would open it again at once, and see the usual greeting, because a week hasn't passed.

### Checked against the canon

- *No chosen-one prophecy.* Every speaker takes the words from a song, a carving or a saying, not a foretelling, and applies them only as *you put me in mind of it*. None says the player was meant for anything. The Aurennais speakers keep the Church's reading and add only a reservation, as *The Seventh Niche*'s clerk does.
- *Goes back to their bread.* Every line ends on the speaker's work: the churn, the oven, the dough, the wood, the forge, the hides, the ledger, the Prior's bread, the salt, the turf, the rising bread, and *I am busy*.
- *Never game, save, player or screen.* Nobody says any of them. The descriptions are chosen by deaths and the short road, so the player knows why the line came, and the speaker doesn't.
- *The Clearing is not revealed.* *The one who dies and does not* stays a saying. Nobody says what the gates do to the dead.
- *Register.* The Gatelander lines turn on a saying (*the butter won't wait on a song*), never give a bare yes or no, and say *Weaver keep you*. The Markish lines are short, with *aye*, *{nick}* and *by iron*, and no honorific. The Aurennais lines use *Master*, qualifiers, *I make no claim*, *a reservation I would not care to put in writing*, and no oath. The Old Blood lines put the old words first and say little else.
- *Slurs.* None.
- *Varek.* He is seen, at a distance, and nothing more, as §11 says. The open ending's Varek asked the player to stay; he keeps his distance because the player did.

---

## What the Stones Say — the sigil-lore books in the guilds

*Unapproved. Drafted 3 Oct 2026. Backlog A, Lore objects: the sigil-lore books in the guilds (the other half of the line *The Seventh Niche* took).*

### What the canon fixes, and where it is silent

Canon §7: the guilds teach Impression and Comprehension and stop there; *sigils alone grant Mastery*, by a touch at Comprehension with the Intelligence for it. Part I, *What this implies*: the carvers *didn't think of these as weapons*. *Caor* is a spark that starts something larger, *Slán* is the word at parting, *Scáth* is shelter as much as shadow. The ruling class *received fragments … and immediately categorized them as combat abilities. Technically correct. Completely missing the point.* §3.1: the sigils stand over graves. The peoples were told their dead *hold* the world, and *nobody … was lied to about the outcome, only about the mechanism*. The Withdrawal forbade *reading* sigils (touching is permitted). §3.3: readers who ignored it *went strange, then quiet*, and every rubbing-seller who points the player at a gate is Old Blood. §1.3 puts the academy in Aurenne beside the Church, which calls gate-clearing *gate-grubbing*. Bram knows the spell words by sound and not their power.

The canon doesn't say what the guilds keep on their shelves, or what any book says about the sigils. I chose three short books, one for each nation's way of knowing, so the player hears the same stones three ways:

1. ***On the Seals***, the academy's primer, sold at every Mages' Guild. Aurennais institutional prose. It is correct about everything it can examine and blind to the point. It reports Mastery without endorsing it, and it dismisses the fresh strokes on recent rubbings as careless work.
2. ***The Words on the Stones***, a Gatelander hedge-schoolmaster's glossary of the deep words, from a shelf in the Gatelands' Mages' Guilds. Its voice is proverbs and the old tongue. It gives the told version of why the stones are warm, and lets an Old Blood rubbing-seller say *a thing can be true and still not be the whole of it*.
3. ***Warm Stones — for New Hands***, a Fighters' Guild sheet in a Markman's short sentences. It says *touch, take, walk on; don't stand and read*, the Withdrawal's law kept by soldiers who don't know it is a law.

Two guild topics carry them, each in the guild head's own people's voice (the head has a people, `gp`, since Session 172).

**Changes.** Nothing in the world state beyond `booksRead`. **Reward.** None. They are lore books (`attr:null`), as *The Seventh Niche* is.

**Not revealed.** The Clearing, the window and Varek. The fresh strokes are mentioned once, as the academy's misreading, and they agree with Q4 (*new strokes cut on top of the original work*) without naming a hand.

### 1. The Mages' Guild head — *"What does the Guild teach of the sigils?"*

Always available at a Mages' Guild. The follow sells the treatise.

**Aurennais head:**
- *"What does the Guild teach of the sigils?"* → "Impression and Comprehension, Master, and the Guild certifies both. Mastery we do not teach, because it cannot be taught. It comes from the stones alone, and the academy declines to certify what it cannot examine. The Guild's treatise sets out the terms."
  - Follow *"Is it written down?"* → *Buy* On the Seals *(40 gold)* → "Forty gold, Master, and the copy is yours outright. Read the catalogue before you read the rest; it is the part the examiners ask about."
  - Short of gold → "The copy is forty gold, Master. The library does not lend."

**Gatelander head:**
- *"What does the Guild teach of the sigils?"* → "To the second degree, and not a step past it. The last step's on the stone, and you'll not find it in a book, any more than you'd learn to swim from a drawing of the sea."
  - Follow *"Is it written down?"* → *Buy* On the Seals *(40 gold)* → "Forty gold. It's the academy's book, so take it with salt. They know the names of everything and the use of half."
  - Short of gold → "Forty gold, and a book's no cheaper for being dry, more's the pity."

**Markish head:**
- *"What does the Guild teach of the sigils?"* → "Two of the three. The third's the stone's. Can't sell you that."
  - Follow *"Is it written down?"* → *Buy* On the Seals *(40 gold)* → "Forty gold. Dry as a ledger. Has the names in it, though."
  - Short of gold → "Forty. Come back with it."

**Old Blood head** (sparing; the older word first):
- *"What does the Guild teach of the sigils?"* → "Two degrees. The third is the stone's. *Léamh*, my mother called it. Reading. She did not do it."
  - Follow *"Is it written down?"* → *Buy* On the Seals *(40 gold)* → "Forty gold. The words are in it. The meaning is not."
  - Short of gold → "Forty gold."

### 2. The book — *On the Seals*

Aurennais institutional register: formal, qualified, terms and clauses, never an oath. The author is unnamed.

**Item name:** On the Seals  **Icon:** 📘  **Description line:** `Lore book` / `Lore book (already read)`

**Pages:**

> ON THE SEALS
>
> Being an introduction to the carved seals of the old gates, prepared for licentiates of the academy in the form approved by the Masters.
>
> The academy does not send its licentiates into the gates. It purchases rubbings from those who go, and has done so for as long as it has kept a library. What follows is drawn from those rubbings, and from the testimony of the people who sold them, which the academy weighs accordingly.

> OF WHAT A SEAL IS
>
> A seal is a figure cut into the stone of an old gate, in a script older than any the academy can read. When a hand is laid on one, the bearer of the hand comes away with a working they did not have before. This is attested beyond reasonable dispute.
>
> The academy holds that the seal is an instruction and the touch a reading of it, however imperfect. The Church holds that the seals are the seams of the Weaver's cloth and ought not to be handled at all. The academy notes the Church's position, and observes that the Church has never asked for the workings back.

> OF THE THREE DEGREES
>
> A working is received in one of three degrees, which the academy names Impression, Comprehension and Mastery.
>
> In Impression the working is held without being understood. It is named only in the carvers' tongue, and it answers unevenly. A licentiate who casts a flame in this degree should expect, on occasion, to be among the things it burns.
>
> In Comprehension the working does what it is for, reliably, and it takes a name in the common tongue. The academy teaches to this degree and certifies it. Its copies, its lectures and its examinations all end here.

> OF MASTERY
>
> A third degree is reported, chiefly by gate-salvagers and by the descendants of the carvers. In it the working is said to show what it was for before it was a weapon. The academy has not produced this degree by instruction, and does not certify it. It is reported only after a second touch of a seal, by a person already in Comprehension and of sufficient intellect.
>
> The academy draws no conclusion from this. It records, without endorsement, that every working so reported was described by its holder as smaller than they had supposed, and that several holders did not wish to discuss it further.

> A SHORT CATALOGUE
>
> The workings most often met, with the names the academy has assigned them: Caor, Fireball. Sioc, Frost Bolt. Séideán, Wind Shear. Cloch Ghéar, Stone Spike. Smól, Shade Bolt. Solas-Gheal, Radiant Bolt. Leigheas, Healing Light.
>
> The carvers' names are kept in the catalogue as a courtesy to the tradition. Licentiates are advised that the common names are the operative ones, and that the carvers' names, where a translation has been attempted, translate poorly into anything of use. *Caor*, for example, appears to mean a berry.

> A NOTE ON RECENT RUBBINGS
>
> A number of rubbings bought in the last two seasons show strokes cut over the original strokes: newer, sharper, and in the same script. The academy attributes these to careless work by the takers of rubbings, who are paid by the sheet and not by the accuracy. A licentiate offered such a rubbing should decline it, or pay less for it.

### 3. The book — *The Words on the Stones*

Gatelander register: proverbs, indirection, the old tongue held as a pride, and the Weaver sworn by. The compiler is unnamed. The rubbing-seller in the fifth page is Old Blood (the marks at her wrists, the warm stone felt across a field). The book never says so.

**Item name:** The Words on the Stones  **Icon:** 📗  **Description line:** `Lore book` / `Lore book (already read)`

**Pages:**

> THE WORDS ON THE STONES
>
> Gathered by a hedge-schoolmaster who could read none of them, from people who could say them. A word you can say and can't read is like a coin from a country you'll never see: it spends, and you never know what it bought.
>
> The Guild's books give each stone a name in the common tongue, and the names are right as far as they go. These are the other names, the ones our grandmothers had.

> CAOR. The Guild says fireball. My grandmother said it of the rowan's berries, red on the branch at the back end of the year, and of a spark that jumps the hearth. A small red thing, she'd say, that starts a larger one. I never once heard her call it a weapon.
>
> SLÁN. Whole, and the word you say at a parting. Be whole, going. You say it at a door to someone leaving, and you say it over a bed when there's nothing else left to say. The old people heard no difference, and I've stopped hearing one.

> SCÁTH. A shadow, and a shelter, and the old people saw no difference there either. You stand in a man's shadow out of the sun, and you stand in it out of harm.
>
> CLOCH. Stone. There's no more to it than that, and no less. My father said a field wall would outlast the field, and the stone would outlast the wall.
>
> SIOC. Frost. The stillness before the freezing, when the pond hasn't turned yet and you'd swear it was thinking about it.

> LEIGHEAS. A cure, the kind you're given and the kind you work at.
>
> ANÁIL. Breath. The Guild sells it to people who want to walk under the water. Weaver forgive me, I'd sooner they sold it to people who want to go on walking above it.
>
> SÚIL AN FHÍODÓRA. The Weaver's eye. The Guild says it turns your compass to the warm stones. I'll only say it's a strange thing to want, to have the Weaver look where you're looking.

> WHY THE STONES ARE WARM
>
> Every child in the Gatelands knows the stones are warm, and every child is told why. The old gates are built over our dead, and our dead hold the world up from underneath, the way your father held you up to see over a wall. That's what I was told, and it's what I told the children after me.
>
> The woman I had most of these words from sold rubbings at the fairs: a small grey woman, with the old marks at her wrists. She could tell a warm stone from across a field, and she'd not touch one for any money. I asked her once whether what we tell the children is true. She said a thing can be true and still not be the whole of it. Then she sold me a rubbing, and I've had no better answer from anyone since.
>
> *In the margin, in another ink:* She's in the gate at home now. I'd not have put her there, if it were mine to say. It wasn't. The stone there is warm.

### 4. The Fighters' Guild head — *"Anything I should know about the warm stones?"*

Always available at a Fighters' Guild. The answer hands over the sheet, once (`bagAdd`, unless the bag or `booksRead` already has it).

- **Markish head** → "Aye. Here. Every new hand gets the sheet. Read it twice."
- **Gatelander head** → "There's a sheet for that, and it's the one piece of paper in this hall worth the reading. Take it. It's shorter than the advice you'd get from me."
- **Aurennais head** → "The Board issues a sheet to each new member, Master. It is brief and it is not well written, and every word of it is correct. Take it."
- **Old Blood head** → "There is a sheet. Take it. Do what it says about reading."
- *Already given* (any head, in the same row): Markish "You've got the sheet. Read it again." · Gatelander "You've had the sheet already. A thing read twice is a thing half learned, so read it a third time." · Aurennais "You have been issued the sheet, Master. The Board issues one." · Old Blood "You have it."

### 5. The sheet — *Warm Stones — for New Hands*

A Markman's writing: short sentences, no honorifics, an oath on iron. Unsigned except by *the Board*.

**Item name:** Warm Stones — for New Hands  **Icon:** 📄  **Description line:** `Lore` / `Lore (already read)`

**Pages:**

> WARM STONES — FOR NEW HANDS
>
> Read this or have it read to you. It's short.
>
> There are carved stones in the old gates. Some are warm. Put your hand on a warm one and you come away with a spell. That's all there is to it. Don't let a mage tell you different, and don't let a priest tell you not to.

> Touch it. Take what it gives you. Walk on.
>
> Don't stand and read it. Don't trace it with a finger. Don't sit down in front of it and try to work out what it says. We've had hands do that. They come back quiet. Then they come back quieter. Then they stop signing on.
>
> The cold-eyes know why. Ask one, if you'll sit with one. Most of us won't.

> Some stones have fresh cuts over the old ones: sharp edges, no dust in them. Don't touch those. Mark on the board where you found it.
>
> Rubbings sell at the Mages' Guild. Not for much. Enough for a drink.
>
> That's the whole of it, on iron.
>
> — the Board

### What in the code would carry it

- **The books.** Three `BOOKS` entries with `attr:null`: `{id:'on_the_seals', name:'On the Seals', ico:'📘', attr:null, pages:[…]}`, `{id:'words_on_stones', name:'The Words on the Stones', ico:'📗', attr:null, pages:[…]}`, `{id:'warm_stones', name:'Warm Stones — for New Hands', ico:'📄', attr:null, pages:[…]}`. Each page above is one string, `\n\n` between paragraphs. The italic margin line is plain text that opens with `In the margin, in another ink:`. The `attr:null` branch is the one *The Seventh Niche* needs (grep `BOOKS.find(b=>b.id===it.bookId)` in `60-shop.js` and `66-hub.js`): it grants nothing and labels the item *Lore book*. The sheet labels itself *Lore*. `randomBookItem()` leaves all three out of the skill-book rolls. If the concept artist's book decision (#116) lands first, the sheet reads as one leaf and the two books as books.
- **The topics.** In `guildDef`'s `topics` getter (grep `spellShopTopics(Math.min(4`), push `sigilLoreTopic(g, gp)` beside `rubbingTopics(site)`. For `guild_m` it returns the teach topic with its buy follow, the lines chosen by `gp` with `markman` as the fallback. The buy is `{label:'Buy On the Seals (40 gold)', quest:true, fn}`, which takes the gold and `bagAdd(makeBookItem(BOOKS.find(b=>b.id==='on_the_seals')))`. For `guild_f` it returns the stones topic, whose `fn` gives the sheet once, decided by `booksRead.has('warm_stones')||BAG.some(b=>b.bookId==='warm_stones')`.
- **Where the glossary lies.** One copy on a shelf in every Mages' Guild on the Gatelands (`nationOf(...).people==='gatelander'`), the same way *The Seventh Niche* is placed, and a rare roll in `library_chest`. Not for sale: the Guild sells the academy's book, not the schoolmaster's.
- **worldState.** Nothing new. `booksRead` is saved.

### Checked against the canon

- *Guilds cap at Comprehension; Mastery is the sigils'* (§7). The treatise and all four heads say so. *A second touch … by a person already in Comprehension and of sufficient intellect* is §7's rule in the academy's words.
- *Technically correct, completely missing the point.* The catalogue gives the build's own common names (`nameEn`), and *Caor appears to mean a berry* puts the miss in one line.
- *Caor, Slán, Scáth.* The glossary's entries are Part I's: a spark that starts something larger, the word at parting, shelter as much as shadow. *Caor* is also the Irish for a berry, which is where the rowan comes from. *Slán* is in the canon's catalogue and not in the build's `SPELLS`. The glossary gives it as a word, not as a stone's spell.
- *The Clearing is not revealed* (§3.1). The glossary gives the told version, *our dead hold the world up*. The rubbing-seller's *true and still not the whole of it* is §3.1's *lied to … only about the mechanism*, unstated. The margin line about a burial in the gate says only that the stone is warm.
- *The Withdrawal and the Cold* (§3.1, §3.3). *Touch it … don't stand and read it* is the law as soldiers keep it. *They come back quiet. Then quieter* is *went strange, then quiet*. The Old Blood head's *léamh* is the older word for the thing (§2), and her mother *did not do it*.
- *The rubbing-sellers are Old Blood* (§3.3): the grey woman with marks at her wrists, who feels a warm stone across a field. She is not named as Old Blood.
- *Cold-eyes* (§2): the sheet uses it as everyone does, and *Most of us won't* sit with one agrees with §2.2's *Markmen who won't sit with you*. It is said of a people's way, not their bodies.
- *The fresh strokes* agree with Q4's readyText and with §8.2's etching, and name no one.
- *Where the canon is silent:* which books the guilds keep, the treatise's price, and the Fighters' sheet. I chose the plainer thing each time: a primer the academy sells, a glossary nobody sells, and a sheet every recruit is handed.
- *Register.* Aurennais: *Master*, terms, *declines to certify*, no oath. Gatelander: proverbs (*a drawing of the sea*, *a coin from a country you'll never see*), no bare yes or no, *Weaver forgive me*. Markish: short, *aye*, no honorific, *on iron*. Old Blood: few words, the older one first.

---

## The Last Entry — Varek's list in the first gate, after the unbound ending

*Unapproved. Drafted 4 Oct 2026. Backlog A, consequence hooks: Varek's list found in the first gate after the unbound ending (canon §11).*

### What the canon fixes, and where it is silent

- **§11, *Help him — unbind*:** the game remakes itself on a new seed, the player's name, people and one carried item persist, and *Varek's list is found in the first gate.* The code already does the first half: `ending('unbound')` writes `og_carry` (name, people, look, `BAG[0]`, a seed) and the creator reads it back (grep `_ogCarry`). Nothing lays the list.
- **The first gate** is the Crypt of First Light. Every new game wakes there, in the open sarcophagus (`TUTORIAL_PORTAL`, `portal._tutorialSpawn`), and the crypt can never be entered again. Part I's note on the crypt already leans this way: *the crypt is where Varek leaves them.* Varek's own line at the Root, in the build, promises it: *I'll be in the first gate, waiting to be found.*
- **The list itself** (Part I, *His emotional truth* and *The list*; `quest_writing.md`, *The List — discovery prose*): names, dates, causes; thousands of entries over 250 years; *a script nobody uses anymore*; the top neat and careful, the bottom barely legible, *not from age, from the weight of writing the same kind of entry over and over*; the last entry Ashenmoor, *and he left space below it*; and *a new section at the back* where the player is, not by name, *in a different category that he hasn't named yet*.
- **How it is found** (`quest_writing.md`): *No music cue. … The player picks it up. There is no quest update. There is no journal entry. The list is just there, and the player closes the inventory item and the moment is over.*
- **Varek's notes** (§12): *never displayed; returned as a sentence, once.* The back section is that once, for a player who unbound the world, since there is no other meeting left in which he could say it.
- **His arc** (Part I, phases 1–5): the wolves turned from villages, the drought ended, the lord who taxed a village into starvation, *the power vacuum fills with something crueler*, *tells himself each time it's the last time*. The early entries are those phases, as the deaths they cost.
- **Silent:** how he dates the entries, the names in them, what the unbinding did to the people of the old world, and whether the Varek of the new world remembers the old one. I chose the plainer thing each time: he counts years from *the stone* (the glimpse, Phase 2); the names are invented, in each people's register, and none is a named character; the space below Ashenmoor stays empty, so the list says nothing about the old world's end; and the draft claims nothing about the new Varek. The list was written in the old world and carried, like the player's one item.
- **Part I against Part II.** Part I has the list found *late Act II, in the place where he has been staying.* Part II puts it in the first gate after the unbound ending. They need not disagree (the Act II find is not built), and this draft is only the second.

### Shape

No giver, no steps, no turn-in, no reward. One object in one room, once.

- **Condition.** The new game was begun from `og_carry` after `ending('unbound')`. A game begun any other way never has it.
- **Where.** On the floor of the crypt at the foot of the open sarcophagus, on the side the player faces when they wake (`_tutorialSpawn.yaw`), one cell out, so the first look of the new world falls on it. A folded paper, the size of a hand, weighted with a stone.
- **The take.** The standard pickup, with its prompt and its *took* line. No `addLog`, no `showMsg` of its own, no sound beyond the pickup's, no quest, no journal.
- **The reading.** It opens in the book reader (the open book, Michael's A on #116), with no title page, no running head and no first-reading toast, because it is not a book and teaches nothing. The pages are the folds of one long sheet.
- **Left behind.** If the player walks out without it, it stays in the crypt, and the crypt is never entered again. That is the canon's *just there*, and it is not chased.
- **What it changes.** Nothing. It weighs 0.1, sells for nothing, and nobody remarks on it.

### 1. The object

- **Pickup label:** `Worn paper`
- **Item name:** `Worn Paper` (never *Varek's List*: the canon's find is *not a dramatic reveal*, and the player names it themselves)
- **Item icon:** 📜

### 2. The pages — Varek (Old Blood, raised Gatelander), in his hand

Eight folds. The reader sets each page in a hand that worsens (see the code note). `{blot}` is a name the reader draws as an ink stroke that cannot be read; the text fallback is an em dash. Blank lines are the page's own spacing.

**Fold 1 — the neat hand**

> First year after the stone, at the hay.
> Donncha Mac Giolla Phádraig, of Baile na hAbhann, a herd, forty years or about it. I turned three wolves from the children at the ford. They went up the hill to his shieling. I did not ask where they would go.
>
> Third year after the stone, the long frost.
> Sorcha and Eithne Ní Laoire, of Cill Rónáin, sisters, both grown. I ended the drought at Gort Mór. The water did not stop at Gort Mór.
>
> Seventh year, at the turn of the year.
> Fiach Ó Cuinn, of Gort Mór, a boy of twelve. He followed me into the gate under the hill because he had seen me come out of it. I went back for him. Not quickly enough.

**Fold 2 — the neat hand**

> Twenty-sixth year, in the hungry months.
> At Ráth Dubh. Lord Thibaut de Sauveterre took the seed corn for his due. I put him out of his keep and the corn back in the barns.
> His brother came at the harvest with forty men. These are his dead, and they are mine:
> Mairéad Ní Bhriain. Colm, her son. Tomás the miller. Peig Ní Shé, and Seosamh her husband, whose name I did not know that day and have known every day since. Cormac Ó Ceallaigh. Úna, a child of six. Brigid, her grandmother.
>
> This is the last of these.

**Fold 3 — the hand closing**

> Thirty-first year. Ráth Bán. The same, and the same.
> Nuala Ní Dhubhda. Lughaidh. Oisín the thatcher and his two boys. Gormlaith. Ciarán Ó Floinn. Treasa. Eoghan, who had the bees. Máire Bhán. Seán Rua. Neasa. Lorcán Beag. Siobhán. Fionnuala. Pádraig the carter. Clíodhna. Ruairí. Saoirse. Íde.
> The last.
>
> Forty-fourth year. Achadh Fada. Eleven.
> The last.
>
> Sixty-second year. Cnoc na Gaoithe. Thirty.
> The last.

**Fold 4 — small and quick; the other islands begin**

> 90. Wulfstow, on the Mark. Hild Osricsdaughter. Leofwine. Cuthred the reeve. Godgifu. The road I closed.
> 103. Sainte-Aude, in Aurenne. Prior Anselme. Brother Gautier. Isabeau Marchal, who swept the nave. The roof.
> 117. Glennagh. Nine. The gate.
> 131. Gort na Claise. Twenty-two. Fever out of the gate.
> 140. Stanholt. Beorn. Eadgyth. Wulfric. Osgar. Seven more. Wolves.
> 152. Port-Lévrier. Margot Daviel. Raoul. The ship.

**Fold 5 — names only, crowded**

> Nóra. Diarmuid. {blot}. Ealhswith. Bertrand. Caoimhe. {blot}. {blot}. Ferchar. Muirgheal. Godric. Ysolde. {blot}. Tadhgán. Cyneburh. {blot}. Aoife. Renaud. {blot}. Éibhear. Oslac. {blot}. {blot}. Gráinne. Hereward. Clémence. {blot}. Dubhaltach. {blot}. {blot}. Wynflæd. Sabine. {blot}.

**Fold 6 — barely legible**

> {blot} {blot} Beorhtric {blot} {blot} {blot} Áed {blot} {blot} — Caer {blot} — {blot} {blot} Manon {blot} {blot} {blot} {blot} Odo {blot} {blot} {blot} Cass {blot} {blot} {blot} {blot} {blot} {blot} {blot}

**Fold 7 — the worst hand, and the last entry**

> Ashenmoor.
> Bram, the smith. Wat Atherton. Hilde Atherton. Ned Atherton. Rob Glenn. Annis Glenn. Kit Glenn. Joan Glenn. Mag, Humphrey’s widow. On the south road, two travellers: Ciara Ní Mhurchú, and Lucien Adret, of Aurenne. {blot}. {blot}. {blot}.

Then nothing. The rest of the fold is empty paper, about two-thirds of the page.

**Fold 8 — the back; the steady hand again, one line in the middle of the page**

By the player's death count `n` (`vstate().deaths` in the old world, carried):

- `n = 0`: *Has not died. I would have known.*
- `n = 1`: *Died once. Stood up once. Where do you go?*
- `n ≥ 2`: *Died {n} times. Stood up {n} times. Where do you go?* (`n` in words to twenty, *twenty-one* and on in words to ninety-nine, digits after that)

No heading above it. That is the category he has not named.

### 3. Why these lines

- **The causes are his phases, not new history.** The wolves turned from a village (*They went up the hill … I did not ask where they would go*), the drought ended (*The water did not stop at Gort Mór*), the lord put out and the crueler brother after him: Part I's Phases 3 and 4, told as their dead. No entry names a canon place or a canon event. The Hollowed Wastes and Caer Uaigneach are not his and are not on it.
- ***This is the last of these.*** Part I: *Tells himself each time it's the last time. He is lying to himself.* The phrase shrinks to *The last.* over three entries and then stops being written at all, so the reader watches the lie wear out before the hand does.
- ***Whose name I did not know that day and have known every day since.*** *Remembers everyone's name* (*His voice*), and the one line in the list that sounds like the man who healed three children in Ashenmoor.
- **Ashenmoor's two travellers.** Edna's board says *two travelers whose names we did not record*. He recorded them. The rest of the Ashenmoor entry follows the board's dead (Bram; three Atherton children; four of the Glenns; old Humphrey's widow) with first names the canon left open, and no number, so it does not take a side between the board's forty-one and his forty-three (run 7 of the review).
- **The space below.** Canon: *He left space below it.* The fold's empty two-thirds is that space. It also leaves open whether he counted the world he let go. The draft does not answer that.
- **The back.** *Returned as a sentence, once* (§12), and Discovery 2's question, *I want to know where you go*, written down where he can no longer hear the answer. It starts as a note in the third person and turns at the end to *you*, because he knew who would find it. It never says *game*, *save*, *player* or *screen* (§6).
- **Register.** He is Old Blood raised a Gatelander: sparing and exact, no oath, no proverb, no flourish. The names are in each people's register: Irish for the Gatelands, older Irish forms for the Old Blood among them (*Ferchar*, *Muirgheal*, *Dubhaltach*), Anglo for the Mark, Norman for Aurenne. None begins *Ald-* (the rhyme with Aldred is load-bearing), and none is a named character.

### What in the code would carry it

- **The carry.** `ending('unbound')` (grep `localStorage.setItem('og_carry'`) adds `deaths:vstate().deaths` and `list:true` to the object it writes. The creator's carry block (grep `if(window._ogCarry){try{`) sets `worldState.varekList={n:c.deaths|0,state:'laid'}` when `c.list` is set.
- **worldState.** `varekList` is a new key: add it to `_applyLoadData`'s list (grep `'knowing','unbound','cargoMkt'`), or it lives only until the page reloads.
- **The object.** In `buildDungeon`'s tutorial block (grep `if(portal.tutorial){`), when `worldState.varekList&&worldState.varekList.state==='laid'`, lay a small folded-paper mesh with a stone on it one cell from `_tutorialSpawn` along its yaw, as a pickup whose item is `{name:'Worn Paper',ico:'📜',type:'book',bookId:'worn_paper',weight:.1,buyPrice:0,sellMult:0,n:worldState.varekList.n}`. Taking it sets `state:'taken'`. No `addLog` and no `showMsg` beyond the pickup's own line.
- **The book.** One `BOOKS` entry, `{id:'worn_paper',name:'Worn Paper',ico:'📜',attr:null,quiet:true,bare:true,hands:[0,0,.25,.45,.65,.85,1,0],pages:[…the eight folds…]}`. `openBookReader` skips both its first-read and its re-read messages when `def.quiet` is set (today a book with `attr:null` still says *You have already absorbed this book* on a second reading). `bare` drops the title page, the running head and the folios from the open book. `hands[k]` is how worn fold k's hand is, from 0 to 1, for the reader to loosen the letters with (letter spacing, a slant, a small random baseline jitter). The back fold is 0 because he wrote it later, and steadily. `renderBookPage` replaces `{n}` and `{n-word}` from the item's `n` and draws `{blot}` as an ink stroke, with an em dash where it cannot.
- **Tests.** One headless case: set `og_carry` with `list:true, deaths:3`, begin a game, find the pickup in the crypt, take it, open it, and read *Died three times.* on the last fold, with no new log line. A second case without `list` finds no pickup.

### Checked against the canon

- *Found in the first gate, after unbinding* (§11), in the crypt where the new game begins and where Part I says Varek leaves them.
- *Names, dates, causes; thousands of entries; the hand neat at the top and barely legible at the bottom, from the weight of the writing* (Part I). Eight folds show it by sample, and the fifth and sixth folds stand for the thousands. The reader's worsening hand carries what the words cannot.
- *The last entry is Ashenmoor. He left space below it.* Fold 7.
- *A new section at the back; the player's name is not in it; a category he hasn't named yet.* Fold 8, with no name and no heading.
- *No music cue, no quest update, no journal entry; the list is just there* (`quest_writing.md`). No log line, no message, no quest.
- *Returned as a sentence, once* (§12). The back fold's one line.
- *He never says game, save, player or screen* (§6). He does not.
- *No chosen-one prophecies.* None. The three descriptions are not used.
- *Where the canon is silent:* his reckoning of years, every name, and what the unbinding did to the old world's people. I chose the plainer thing: years from the stone, names in each people's register, and an empty space where the canon leaves one.

---

## The Year's Names — days, months, seasons, the era and the four feasts

*Unapproved. Drafted 5 Oct 2026. Backlog D, *Calendar*: "the names are the author's (the quest writer proposes from the canon; Michael picks)"; backlog E, *Journal*; J, *Journal and calendar*. The systems builder built the calendar's shape on auto/systems (Sessions 496–500: `CAL`, `calDay`, `calDateLine`, `isGodsDay` in `60-shop.js`) with placeholder names in one table, and the date line everywhere waits for this. The era is raised as DECISION #146 (`docs/decisions.md`, Pending); the draft carries a recommendation for it.*

### What the canon fixes, and where it is silent

- **Seven gods, six with temples** (§4.1): An Mhuir the Sea, An Spéir the Sky, Na Beithígh the Beasts, An Chloch the Stone, An Teallach the Hearth (*towns, roads, names; the merchants' god*), An Fíodóir the Weaver, and An tAoi the Guest, *the one the loom was strung for*, with no shrine. The week of seven, a day each, is the designer's shape (`docs/design/journal-and-calendar.md`), and it reads straight off the canon.
- **The Guest** (§4.2): *the Church's line: the Guest is a mistake of the old culture.* The Church bricked up its chapel. Folk keep it in defaced niches and older songs. *Heresy, not prophecy*: no one applies the three descriptions to the player before Act III.
- **The three registers** (Part I): deep is Irish (true names), common is Anglo-Saxon (how people speak), institutional is Norman-French (the Crown, the Church, the Compact). A calendar is spoken in all three, so every name has its three forms; the date line, which is the player's own journal, takes the common one, as *the old gates* is everyone's default.
- **The land** (§1): the Gatelands are grain, cattle, wool, horses, and *the only island with autumn woods*; the Mark is cold, iron and timber; Aurenne is the sea, salt and the Church. The months are named for the work of the year, which all three islands share.
- **The dead and the gates** (§3.1): *Nobody who gave a grandmother to a gate was lied to about the outcome, only about the mechanism.* *The Church blesses the dead into the gates without knowing what happens there.* That is a feast already, and the canon gives it.
- **The war** (§1.4, §14): *one generation ago*, the Crown won, the Mark remembers, the Hollowed Wastes was its field. The canon names no monarch.
- **Silent:** every name, the era and its year, the feasts. I chose the plainer thing each time: days by their god in the common tongue, months by the year's work, feasts from customs the canon already implies, and an era the canon already dates.

### 1. The week

The week runs outward from the hearth to the one outside the world: the house, the ground under it, what lives on the ground, the sea around it, the sky over it, the loom that holds it all, and last the Guest it was strung for. A Gatelander can say the order as a proverb (below), and a player who learns it can work out the day.

| # | `god` key | Common (the date line) | Deep (Gatelanders at prayer, the Old Blood) | Institutional (the Church, the Compact, the Crown's clerks) |
|---|---|---|---|---|
| 0 | `teallach` | **Hearthday** | *Lá an Teallaigh* | *le jour de l'Âtre* |
| 1 | `cloch` | **Stoneday** | *Lá na Cloiche* | *le jour de la Pierre* |
| 2 | `beithigh` | **Beastday** | *Lá na mBeithíoch* | *le jour des Bêtes* |
| 3 | `muir` | **Seaday** | *Lá na Mara* | *le jour de la Mer* |
| 4 | `speir` | **Skyday** | *Lá na Spéire* | *le jour du Ciel* |
| 5 | `fiodoir` | **Weaverday** | *Lá an Fhíodóra* | *le jour du Tisserand* |
| 6 | `guest` | **Guestday** | *Lá an Aoi* | ***le Jour Clos*** — the Closed Day |

- **Hearthday first.** The Hearth is the merchants' god and the god of towns and names: the week's accounts open on it, so the rent the systems builder already puts on the week's first day (Session 498) falls on Hearthday, and a ledger reads right.
- **Guestday last, and the week's rest.** By custom no one is turned from a door on Guestday and no work is asked that can wait. A custom, not a rule: nothing in the draft shuts a shop. The Church does not keep it: it calls the seventh day *the Closed Day*, rests on it, and sets no place.
- **The design note, never said.** Part I's *"a Sunday afternoon"* is the seventh day of a week, and here the seventh day is the Guest's. Nobody in the game remarks on it.

### 2. The months and seasons

Twelve months of 28 days; the year turns with spring; a new tale begins on the 1st of Reaping, the first month of autumn (`startMonth:6`). Seasons keep their plain names.

| # | Season | Month (common) | What it is named for |
|---|---|---|---|
| 0 | spring | **Thaw** | the ground giving |
| 1 | spring | **Lambing** | |
| 2 | spring | **Sowing** | |
| 3 | summer | **Shearing** | the wool, the Gatelands' pride |
| 4 | summer | **Haysel** | the hay harvest (an old word: hay-season) |
| 5 | summer | **Highsun** | |
| 6 | autumn | **Reaping** | the grain; a new tale opens here |
| 7 | autumn | **Leaffall** | the autumn woods, the Gatelands' alone |
| 8 | autumn | **Culling** | the beasts killed before winter |
| 9 | winter | **Longnight** | |
| 10 | winter | **Wolfmonth** | Na Beithígh's children at the fold |
| 11 | winter | **Lean** | the hungry end of winter |

The months are the same on all three islands; the work comes at different weights (the Mark shears late and culls early, Aurenne has no Lambing worth the name), and nobody remarks on it. The Church's clerks write the months in the common form; only the days have Church names.

### 3. The era

**Recommended: *of the Peace*, the year 27 at a new tale's start.** The Peace is the treaty after the war the Crown won on the Hollowed Wastes, one generation ago (§1.4). Everyone dates by it because every ledger had to: the Crown's clerks write *l'an XXVII de la Paix*, the Compact copies them, and the date line reads *the 27th year of the Peace*. The Mark counts the same years and will not say the word: a Markman says *twenty-seven winters since the Wastes*. If the cold peace breaks in play (`warFromFaction`), the year keeps its name; that is the point of it.

The alternatives, and why not: *the Year of the Loom* (the Church counting from the Weaving, about fifteen centuries; a Church that *forgot the price* would date from it with false precision, which is good, but it makes the date line Aurennais in a game that starts under the Crown); a regnal year (the canon names no monarch, and naming one is Michael's). Raised as DECISION.

### 4. The date line

One function writes it (`gameDateLine`, with `calDay` under it). Three lengths:

- **Full** (the sleep panel, the wait menu, the journal's day heading, the waking line): `Hearthday, the 1st of Reaping, in the 27th year of the Peace` — and the time after a ` · ` where the panel shows a time today: `… · 7:40 am`.
- **Day** (the Due view, a dated task's terms, the shrine, the map note): `Hearthday, the 1st of Reaping` (today's `calDateLine`, unchanged in shape).
- **Short** (a save slot, a journal line's stamp): `Hearthday 1 Reaping · 7:40 am`.

The waking line (`You wake after ${hours} hours. ${gameDateLine()}`) keeps its shape: *You wake after 8 hours. Skyday, the 12th of Reaping, in the 27th year of the Peace · 5:40 am.* The shrine's god's-day line already reads right with the common names: *It is Seaday. You are restored, and carry the Road two days.*

### 5. The four feasts

One a season, each a day long, fixed to a date and so always to the same weekday (28-day months). The systems builder's rules stand (the square full, the inn's meal free, petty fines halved); these are the names, the dates, the customs and the lines.

| Feast | Date | Weekday | The custom |
|---|---|---|---|
| **The Kindling** | 1st of Thaw (the year's first day) | Hearthday | every hearth is let die the night before and lit at dawn from one fire in the square, carried house to house; the houses of the Compact close their books |
| **The Long Light** | 19th of Highsun | Skyday | folk stay up to see the sun down and up again; horses race in the Gatelands, the yard is open to all in the Mark, the Compact seals the year's charters at noon |
| **The Giving** | 23rd of Reaping | Stoneday | the year's dead are named at the nearest old gate, a stone set at its mouth for each; the Church blesses them into it; the last sheaf of the harvest is left there |
| **The Empty Chair** | 28th of Longnight | Guestday | a place set at every table and the door off the latch till dawn; no one turned from a door; old songs. The Church forbids it; Aurenne keeps it behind shutters, or not at all |

The Giving is the first a new tale meets: day 23, the fourth evening or so. It is the Clearing kept as a custom by people who do not know it (§3.1), and the draft never says so: nobody explains what a gate does with a name.

#### 5.1 A townsperson's greeting on the day (replaces the stock greeting for that day only)

**The Kindling**
- *Gatelander:* "A good Kindling to you. Take a brand from the square before you go — a house that's cold on the year's first day stays cold till the next."
- *Markman:* "Kindling. Fire's in the square. Take some, it's free."
- *Aurennais:* "A fair Kindling to you, if you'll have it. The houses close their books today; what is owed is struck or carried over, and either way it is written."
- *Old Blood:* "The Kindling. We said *tine úr*. New fire. The old one is let die first. People forget that half."

**The Long Light**
- *Gatelander:* "It's the Long Light, and a day that long is wasted on work. The horses run at noon. You'll know the winner by who's buying."
- *Markman:* "Long Light. Yard's open to anyone. Mind you walk off it."
- *Aurennais:* "The Long Light, Master. The houses seal the year's charters at noon. After that, I am told, nobody is bound to anything until dark."
- *Old Blood:* "An Spéir's feast. We watched it go down, and stayed to see it come back. That was the whole of it."

**The Giving**
- *Gatelander:* "It's the Giving. Whoever we lost this year, we walk out to the old gate and say their names to it. A long road for a short word, but the dead were never in a hurry."
- *Markman:* "Giving day. Names said at the gate. Mine are said. Yours?"
- *Aurennais:* "The Giving, Master. The Church commits the year's dead to the gates this morning, and the gates, we are taught, hold them in trust."
- *Old Blood:* "The Giving. My grandmother would not go. She said the old word for it once, and then she would not say what it meant."

**The Empty Chair**
- *Gatelander:* "The Empty Chair tonight. There's a place set and the door's off the latch. Nobody's ever sat in it, mind. That was never the point of a chair."
- *Markman:* "Empty Chair. No door's shut tonight. Not even to you."
- *Aurennais:* "The Church does not keep tonight, Master, and so neither does this house. What a house does behind its own shutters is, I am given to understand, its own affair."
- *Old Blood:* "*Oíche an Aoi.* The Guest's night. Set the chair. Don't wait up."

#### 5.2 The innkeeper, on a feast day (a line before the room offer; the meal is free)

- *Gatelander:* "There's no charge for the meal today. A feast you pay for is only a dinner."
- *Markman:* "Meal's free. Feast day. Sit."
- *Aurennais:* "The meal is the house's today, Master, by custom. The room, regrettably, is not."
- *Old Blood:* "Eat. There's no price on it today."

#### 5.3 The guard, fining petty crime on a feast day (after the fine's own line; the fine is halved)

- *Gatelander:* "It's a feast, so it's half. Don't make me sorry I said it."
- *Markman:* "Feast day. Half. Once."
- *Aurennais:* "A feast-day remission: half the fine. It is entered nonetheless."
- *Old Blood* (none on the watch; the Gatelander line stands).

#### 5.4 The Due view (one line a feast, with its date in the Day form)

- 🔥 *The Kindling — every hearth lit from the square's fire, and the year turns.*
- ☀ *The Long Light — the races, the yard, and the charters at noon.*
- 🪨 *The Giving — the year's dead named at the old gate.*
- 🪑 *The Empty Chair — a place set, and the door off the latch till dawn.*

#### 5.5 The first time you enter a settlement on a feast day (the log, plain narration)

- `🕯 ${feast.name} at ${site.name}.` — e.g. *The Giving at Dunmore.*

### 6. The Guest's day in the mouth

Two topics, one each side of the Church's line. Neither applies a description to the player, and neither explains the Guest.

**A Gatelander townsperson, on any Guestday** — topic *"Why is the door left open?"*
> "It's Guestday. You don't shut a door on a Guestday, in case. In case of what, my grandmother said, is the Guest's business and none of ours. The week goes hearth, stone, beast, sea, sky, loom — and then whoever's at the door. That's how you count it on your fingers, and you'll not lose a day again."

**An Aurennais priest of the Church, on any Guestday** — topic *"Why does the Church call it the Closed Day?"*
> "Because the old culture kept the seventh day for a guest who was never coming, Master, and the Church, in its mercy, has closed that account. One rests on the Closed Day. One does not set a place. The Gatelanders still do, I am told; the Church considers it a debt they insist on paying to no one."

**A Markman, on any Guestday** — topic *"Is Guestday kept in the Mark?"*
> "Aye. Door's open, fire's banked, nobody works who doesn't have to. Who it's for, I couldn't tell you. Don't need to know who's coming to leave the door open."

**The Old Blood**, if asked the Gatelander's question, answer it with the older name and no more:
> "*Lá an Aoi.* It was always the last day. It was always kept."

### 7. Where the names go — the `CAL` table, final

```js
const CAL={days:[{god:'teallach',name:'Hearthday',deep:'Lá an Teallaigh',church:'le jour de l’Âtre'},{god:'cloch',name:'Stoneday',deep:'Lá na Cloiche',church:'le jour de la Pierre'},{god:'beithigh',name:'Beastday',deep:'Lá na mBeithíoch',church:'le jour des Bêtes'},{god:'muir',name:'Seaday',deep:'Lá na Mara',church:'le jour de la Mer'},{god:'speir',name:'Skyday',deep:'Lá na Spéire',church:'le jour du Ciel'},{god:'fiodoir',name:'Weaverday',deep:'Lá an Fhíodóra',church:'le jour du Tisserand'},{god:'guest',name:'Guestday',deep:'Lá an Aoi',church:'le Jour Clos'}],
  monthNames:['Thaw','Lambing','Sowing','Shearing','Haysel','Highsun','Reaping','Leaffall','Culling','Longnight','Wolfmonth','Lean'],
  monthLen:28,months:12,seasons:['spring','summer','autumn','winter'],startMonth:6,startYear:27,era:'the Peace',
  feasts:[{id:'kindling',name:'The Kindling',month:0,dom:1},{id:'longlight',name:'The Long Light',month:5,dom:19},{id:'giving',name:'The Giving',month:6,dom:23},{id:'emptychair',name:'The Empty Chair',month:9,dom:28}]};
```

Each feast's weekday follows from `dom` (`(dom-1)%7`, because a tale's first day is the 1st of a month and a Hearthday): the 1st is Hearthday, the 19th Skyday, the 23rd Stoneday, the 28th Guestday.

### What in the code would carry it

- **`CAL`** (`60-shop.js`, auto/systems): the table above replaces the placeholders. The day order moves: the systems builder's has the Sea first; this has the Hearth first. Anything that names a weekday by index (the rent on the week's first day, Session 498; `shrineboon`-style tests asserting a god by `weekday`) reads `CAL.days[i].god`, not a number.
- **`gameDateLine(at,tod,len)`**: the three lengths of §4. Today's `Day N · 7:40 am` becomes the Short form; `_jnTime` in `66-hub.js` strips the date with `/^Day \d+ · /` and wants the Short form's `/^\S+ \d+ \S+ · /`; the journal's day heading (`'Day '+(k+1)`) becomes the Full form without the time.
- **Feasts**: `CAL.feasts` and a `feastOn(at)` beside `isGodsDay`. The greetings of §5.1 go in a table keyed by feast id then people (`gatelander`, `markman`, `aurennais`, `oldblood`) and replace `def.greeting` in `makeDef` (`83-world-generator.js`) for townsfolk on that day only; lords, guards on duty and the named cast keep their own. The innkeeper's line of §5.2 joins `INN_ROOM_LINES` (`86-world-crime.js`) as a `feast` key per people. The guard's line of §5.3 follows the fine's message in the crime system (`86-world-crime.js`). The Due lines of §5.4 go where the Due view builds its list (`66-hub.js`). The log line of §5.5 is written once per site per feast: `worldState.feastSeen` keyed `<feast>:<year>:<site>` (a world key, so the S242 list, not `SS_CHAR_WS`).
- **The Guestday topics** (§6): pushed onto a townsperson's topics when `calDay().god==='guest'`, by the speaker's people; the priest's on a Church priest's def in Aurenne. None needs a saved key.
- **No new outcome rolls.** Nothing here draws from the RNG.

### Checked against the canon

- *Seven gods, six with temples, the Guest without one* (§4.1): seven days, the Guest's last and kept without a shrine.
- *The Church's line: the Guest is a mistake of the old culture* (§4.2): *the Closed Day*; the priest's *closed that account*.
- *No chosen-one prophecies; the three descriptions said to the player once, in Act III* (§4.2): none of the three appears; no line applies the Guest to the player.
- *Gatelanders speak in proverbs and indirection and never a bare yes or no; Markmen short, *aye*, no honorifics; Aurennais formal, honorifics, qualifiers, contracts, never an oath; the Old Blood sparing, with the older word* (§2): each line was written to its row. No line swears.
- *The Church blesses the dead into the gates without knowing what happens there* (§3.1): the Giving, with nobody saying what happens.
- *The war one generation ago; the Mark remembers* (§1.4): *the Peace*, and the Markman's *since the Wastes*.
- *The Gatelands the only island with autumn woods* (§1.1): a tale begins in Reaping, and Leaffall is theirs.
- *Silent, and chosen plainly:* every name, the era's number (27, raised as DECISION), the order of the week, the feasts' customs.

---

## First Words — the townsperson's greeting, by who speaks and who listens

*Unapproved.* Owed to Michael's control-room note of 5 Oct (backlog A, *Dialogue still stiff, greetings too expository*): *"There's too much exposition when greeting you ('You're a markmen? those people kill bears at 10!') — should be more subtle intros, like 'Greetings, Markman.' Or 'What is it?'"* This draft rebuilds the generated townsperson's greeting. The named cast, the lords, the guild heads, the guards with a fine to read, Rowe and the feast days keep their own lines.

### What is wrong now

The getter in `makeDef`'s wrapper (`87-world-quests.js`, grep `Object.defineProperty(def,'greeting'`) builds a first greeting from three parts: a stock line (the speaker's people's `greet` or the temper's), then, half the time, *"You're a Markman, by the look of you."*, then one of the speaker's opinions of your people from `PEOPLES[…].of` — the §2.1 table, slurs and all. So a stranger's first words are a census and a verdict. The §2.1 lines are good lines in the wrong place: they are what a person says when asked, not what they say at the door. They stay, unchanged, under *What do you make of the …?*

Two smaller faults ride along. The return lines (*Back again?*, *You. Good.*, *I remember you.*, *Thought I'd seen the last of you.*) are one pool for all four peoples, so an Aurennais says *You. Good.* And the pious temper greets with *The Light keeps this door.* and says goodbye with *Walk in light.*: the canon has no Light (§4.1); that is Finding 18 in `quest_review.md`, and its replacement is folded in below.

### What the canon fixes, and where it is silent

- *NPCs greet, price, insult and trust by the player's people; descriptions of the player are consistent for the three nations* (§2.2). So a speaker may name your people, and always names it the same.
- *If the player is Old Blood, the camouflage does not hold … the innkeeper says dark hair, the guard says grey eyes* (§2.2). The four description lines in `peopleGreeting` stay, as written; they are the canon's own device.
- *Markmen who won't sit with you* (§2.2, for an Old Blood player). A Markman's greeting to one keeps his distance.
- The speech row of §2 for each people.
- *Silent:* whether a stranger names your people at first sight, and what the Old Blood call the three peoples. The plainer choice: some do and most don't, and the Old Blood name nobody's people, only what is in front of them.

### The rule

1. **A greeting is one line**, rarely more than eight words, and never an opinion.
2. **First meeting** (`metCount(def.name)===0`): a line from *First words*, keyed by the speaker's people and then yours. One time in three, if the speaker has a role line (any role but Villager), the role line instead (*Mind the sparks.*, *Bowl's on the way.*): they are short already and say where you are standing.
3. **Later meetings**: a line from *Again*, keyed by the speaker's people. One time in three, the temper's line instead (a gruff man stays gruff).
4. **An Old Blood player**: on the first meeting, one time in three, the address is followed by one of the four description lines, as now. On later meetings the *Again* pool for that speaker is replaced by *Again, to the Old Blood*, which is where *I never could look straight at you, could I.* belongs: it needs a second look to mean anything.
5. **The tags** (*Neighbour.*, *Guildsman.*) follow in the speaker's people's words, from *Tags*.
6. Feast days keep their precedence (`dlgGreeting` asks `feastGreeting` first).

### 1. First words — by speaker, then listener

**Gatelander** (*Tírfolk*; proverbs, indirection, the Weaver)
- *to a Gatelander:* "Weaver keep you, friend." · "You've the look of home about you." · "A face from home. Come in out of it."
- *to a Markman:* "Good day to you, Markman." · "A long way south, and the road still under you." · "Markman. You'll find us slower than you're used to, and no worse for it."
- *to an Aurennais:* "Good day to you, and to whoever sent you." · "From over the water, are you? Come in, so." · "An Aurennais. Weaver keep you all the same."
- *to the Old Blood:* "Good day to you. Have we met? We'd have met." · "Weaver keep you. Stand where I can see you, so." · "You'll have walked a way."

**Markman** (short, *aye*, nicknames, no honorifics)
- *to a Markman:* "Aye." · "Aye. One of ours." · "Mark-born. Good. Speak."
- *to a Gatelander:* "Aye, Gatelander. What is it?" · "Long way north for a turf-cutter. Speak." · "Gatelander. Go on."
- *to an Aurennais:* "Aurennais. Buying or selling?" · "Aye. Compact. Say it plain, it's quicker." · "What is it?"
- *to the Old Blood:* "What is it." · "Aye. Stand there, then." · "Speak. I'll not sit."

**Aurennais** (formal, *Master*, qualifiers, contracts; never an oath)
- *to an Aurennais:* "Master. Good day." · "Master. A countryman, unless I misread you." · "Good day, Master. Welcome, on the usual terms."
- *to a Gatelander:* "Good day, Master. From the Gatelands, I take it." · "Master. You have business? Then let us do it properly." · "Master. Welcome, on account."
- *to a Markman:* "Good day, Master." · "Master. A Markman, if I am not mistaken. You are welcome here on the same terms as anyone." · "Master. You have business? State it, and we will see."
- *to the Old Blood:* "Master. Good day. Forgive me, I had taken you for someone else." · "Master. You have business? Then let us do it properly." · "Good day, Master."

**Old Blood** (*an Seanfhuil*; sparing, exact)
- *to a Gatelander, a Markman or an Aurennais:* "You are here." · "The stones are warm today." · "You walked. Sit."
- *to the Old Blood:* "I know your face. No. I do not." · "You are here. That is enough." · "Sit. There are few enough of us."

### 2. Again — later meetings, by speaker

- **Gatelander:** "Yourself again. Come in." · "I'd a feeling it'd be you." · "Back, and the road no shorter."
- **Markman:** "You again. Good." · "Aye. Back." · "Thought it'd be you."
- **Aurennais:** "Master. Again, and welcome." · "Good day, Master. We have spoken before; I keep the terms." · "Master. You return. I am glad of it."
- **Old Blood:** "You came back." · "Again. Sit." · "You are here again. Or still."

**Again, to the Old Blood** (an Old Blood player, any later meeting)
- **Gatelander:** "I never could look straight at you, could I." · "It's you. It is you. Forgive me, I'd a different face in my head."
- **Markman:** "You. I think." · "Aye. You were taller."
- **Aurennais:** "Master. I would swear your eyes were grey, last we met. I would not swear it in writing."
- **Old Blood:** "You came back."

### 3. Tags

| | owns a house in the town | rank 3 in a guild |
|---|---|---|
| **Gatelander** | " Neighbour." | " Guildsman." |
| **Markman** | " Neighbour." | " Guild-hand." |
| **Aurennais** | " We are neighbours now, I believe." | " Of the Guild, I see." |
| **Old Blood** | " You live here now." | " You are of the Guild." |

### 4. The pious temper (Finding 18's lines, here for the whole)

- greet: "Blessings on the road that brought you." · "The Weaver keeps this door." · "You carry weight, traveller. Set it down a moment."
- bye: "Go with the Weaver." · "May the ground hold under you."

### 5. Michael's second sentence — *"I'm turning in work" when there is nothing*

Not lines but a rule, and the systems builder's to make: *It's done.* shows only while this giver has work of yours that is done or under way; *Any work?* stays. The guild head's *It's done.* the same. When work is under way and not done, the answer is the giver's *Not yet* line as now. No new string is needed.

### What in the code would carry it

- **`GREET_FIRST`**, **`GREET_AGAIN`**, **`GREET_AGAIN_OB`** and **`GREET_TAG`**, four tables beside `PEOPLES` in `87-world-quests.js` (none of the names is taken in `js/`; grep before adding). `GREET_FIRST[speaker][listener]` is an array; `GREET_AGAIN[speaker]` and `GREET_AGAIN_OB[speaker]` are arrays; `GREET_TAG[speaker]={owner,guild}`.
- **The greeting getter** (`87-world-quests.js`, grep `Object.defineProperty(def,'greeting'`): rebuilt on the rule above. The role line is `def._roleGreet`, set in `makeDef` (`83-world-generator.js`) from `greetPool[role]` when the role has its own pool, since the wrapper cannot see `greetPool`. `peopleGreeting` keeps only its Old Blood branch (the four descriptions); its other two branches go, and the `PEOPLES[…].greet` arrays become unused (keep or drop; nothing else reads them).
- **`PEOPLES[…].of`** unchanged: the *What do you make of …* topic still reads it.
- **`TEMPERS.pious`**: the two lines of §4.
- **Rolls:** cosmetic (which line is said), so `Math.random` as now. **No saved key**: `worldState.met` already counts meetings.
- **A test** for the builder to write: a Markman villager greets a Markman player with a line from `GREET_FIRST.markman.markman` and nothing after it; the second greeting comes from `GREET_AGAIN`; no greeting contains any string from `PEOPLES[…].of`.

### Checked against the canon

- *Gatelanders never a bare yes or no; oaths on the Weaver* (§2): no Gatelander line answers anything; two bless by the Weaver.
- *Markmen: short sentences, aye, nicknames, no honorifics* (§2): every line is under eight words but one; *turf-cutter* is the Mark's own word (§2), used once, as a nickname, and contradicted by the Markman of §2.1 (*A Gatelander won't leave a wounded man*).
- *Aurennais: honorifics, qualifiers, contract metaphors, never an oath* (§2): every line has *Master*; *terms*, *on account*, *in writing*; nobody swears.
- *Old Blood: sparing, exact* (§2): the shortest lines in the set; they name no one's people.
- *Descriptions consistent for the three nations; inconsistent for the Old Blood* (§2.2): a speaker names a nation's player only by that nation's name; the Old Blood player is never named, and the later lines contradict each other on purpose (*grey eyes*, *taller*, *a different face*).
- *Slurs about work, land and gods, never bodies* (§2.1): one slur in the set (*turf-cutter*, work). *You were taller* is about the camouflage failing, not a slur, and is said only to an Old Blood player.
- *No Light in the canon* (§4.1): the pious temper's *Light* is gone.
- *Silent, and chosen plainly:* whether strangers name your people (some do); what the Old Blood call the three peoples (nothing).

---

## The Makers' Things — the six names, the hermit and the altars, the Stone's key and the Mother's mantle

*Unapproved.* Owed to Michael's B on DECISION #175 (*The Makers' six tools, one per god*, 6 Oct): the design page (`docs/design/unique-artifacts.md`) gives the quest writer two runs, to name the six and to write the keepers and the claimants. This is the first of the two. It names all six, gives the two pointers that serve all six (the Old Blood hermit and the altars), and writes the first two tools in full, in the build order the page sets: the Stone's and the Beasts', both on the home island. The Sea's, the Sky's, the Hearth's and the Weaver's trials and claimants are the second run. The rules (where each lies, the check, what it does, what it costs, who pays for it) are the page's and are not changed here; every line below is fitted to them.

### What the canon fixes, and where it is silent

- *The Irish-register culture did not worship the loom's builders. They worshipped what the builders were making, and named the makers by their work* (§4.1). So a tool takes the name of the work, in the deep register, and a common name in the mouth of whoever found it. An institution that claims one writes it down in its own register (Part I, *three-register naming*: Irish true names, Anglo common, French institutional).
- *The original culture didn't think of these as weapons … the current ruler class categorized them as combat abilities. Technically correct. Completely missing the point* (Part I, *What this implies*). The draft keeps the same gap in the tools: the common name says what a tool does to you, and the old name says what it was for. The Gate-Blade's old name is *the Stone's key*.
- *The seventh has no shrine* (§4.2). The page gives the Guest no tool; the hermit says why, in one line.
- *Every rubbing-seller and hermit who points the player at a gate is one of them* (§3.3). So the pointer is an Old Blood hermit, and speaks as one.
- *Royal property* is the Crown's claim on the gates, and the gates' salvage is *a salvage economy of adventurers, rubbings and relics that the Crown licenses and taxes* (§1.1). So the Crown's claim on the Gate-Blade is a licence and a tax, not a theft, and its paper is written in the Crown's rolls.
- *The antibodies are "her children who don't know their mother"* is Na Beithígh's scripture (§4.1). The cloak is the thing they know her by.
- *Speech follows the speaker* (§1.5). The Fighters' Guild head speaks in the people of the hall's town (`guildDef`, `peopleOfSite`), so the guild's claim is written four times. The lord at Coeur de Vie is the Crown's seat's lord and a Gatelander (`lordFor`, by the nation's people).
- *Silent:* the tools' names; whether the Makers' tools are known to the Church or the Crown; how a beast *wears* a cloak. The plainer choices: the Crown has one on its rolls (the blade it can see), the Compact claims one and the Church another (the second run), and nobody has written down the other three. The beast does not wear the cloak; it sleeps on it, and has done since before it was the master.

### 1. The six names

The common name is what the item is called in the bag, the log and the journal. The old name is said by the Old Blood and cut into each altar. The institution's name appears only on that institution's paper and in its claimant's mouth.

| Maker | Common name (the item) | Old name, and its sense | The institution's name |
|---|---|---|---|
| An Chloch, the Stone | **the Gate-Blade** | *Eochair na Cloiche*, the Stone's key | the Crown: *la Lame du Seuil* |
| An Mhuir, the Sea | **the Drowned Bell** | *Clog na Mara*, the Sea's bell | the Compact: *le Reliquaire de la Marée* |
| An Spéir, the Sky | **the Noon Ring** | *Fáinne an Lae*, the ring of the day (it is also the old word for dawn) | none |
| Na Beithígh, the Beasts | **the Wolf-Mother's Cloak** | *Brat na Máthar*, the Mother's mantle | none |
| An Teallach, the Hearth | **the Waylamp** | *Lóchrann an Teallaigh*, the Hearth's lantern | none |
| An Fíodóir, the Weaver | **the Shuttle** | *Spól an Fhíodóra*, the Weaver's shuttle (the same genitive as the canon's *Súil an Fhíodóra*) | the Church: *la Navette* |

The page's working name *the Sundial Ring* becomes *the Noon Ring*: the Sky's icon is the sundial already, and the ring is read at noon. The others keep the page's working names.

### 2. The hermit (Old Blood; role *Hermit*, the camp's `def`)

The hermits at camps are made by `makeDef(site,reg,r,'Hermit',…)` with the region's people. §3.3 makes every hermit who points the way one of the Old Blood: the builder passes `people:'oldblood'` in that `extra`. The topic is a folder, there while any of the six is still in the world.

*Did the makers leave anything behind?*
> "Six things. One for each of the six with a shrine. Ask by name."

- *The Stone's?* (while the blade is in its stone)
  > "Eochair na Cloiche. You would say a sword. It stands in a stone by ${gate}, ${dir} of here, where anyone may look at it. Few can take it."
- *The Sea's?* (while the bell is on its rock)
  > "Clog na Mara. A bell. It hangs in a wreck on a rock the sea owns twice a day, ${dir} of here. Go when she has let go of it."
- *The Sky's?* (while the ring is on its cairn)
  > "Fáinne an Lae. A ring, on the cairn at the top of ${peak}. It is read at noon, under a clear sky, by whoever climbed fast enough to be there."
- *The Beasts'?* (while the cloak is in its den)
  > "Brat na Máthar. The Mother's mantle. The master of ${lair} sleeps on it. All her children lie down on it, and none of them knows why."
- *The Hearth's?* (while no innkeeper or player holds the lamp)
  > "Lóchrann an Teallaigh. A lantern. It goes from inn to inn and the weather does not put it out. A theft does."
- *The Weaver's?* (while the shuttle lies in its gate)
  > "Spól an Fhíodóra. A shuttle. It is in the deepest room of ${gate}. It shows where the unread stones are. Reading costs. It will cost you."
- *And the seventh?* (always)
  > "The Guest has none. You do not leave a tool for a guest. You leave the door off the latch."

When a tool has been taken (by anyone: `worldState.artifacts[id]` set), its entry answers instead:
> "Gone from where it lay. You know where. Or someone does."

When all six are taken, the folder's answer is:
> "Nothing is left lying. Everything the makers left is carried now. That has not been true for a long time."

### 3. The altars (narration, the log)

At a shrine whose god's tool is still where it lies, the first prayer there (per shrine, `worldState.shrineVerse[siteId]`) adds one line after the boon's, in the log only (`addLog('⛩', …)`), not on screen:

| God | Log line |
|---|---|
| An Chloch | *Cut under the altar's lip, older than the rest: Eochair na Cloiche. The Stone's key.* |
| An Mhuir | *Cut under the altar's lip, older than the rest: Clog na Mara. The Sea's bell.* |
| An Spéir | *Cut under the altar's lip, older than the rest: Fáinne an Lae. The ring of the day.* |
| Na Beithígh | *Cut under the altar's lip, older than the rest: Brat na Máthar. The Mother's mantle.* |
| An Teallach | *Cut under the altar's lip, older than the rest: Lóchrann an Teallaigh. The Hearth's lantern.* |
| An Fíodóir | *Cut under the altar's lip, older than the rest: Spól an Fhíodóra. The Weaver's shuttle.* |

The line gives the name and no direction: the hermit gives the direction. A player who reads the altar and then hears the hermit say the same words has found the thread alone.

### 4. Things not yet yours (the journal, chrome)

The page's journal heading stands. One line per tool the player has failed to take, in the menu voice, with the number (the log carries the world's words; the journal carries the rule):

- *The Gate-Blade — in the stone by ${gate}. Might 30.*
- *The Wolf-Mother's Cloak — in the den at ${lair}. Resolve 30.*

(The other four's lines come with their trials, next run.)

### 5. The Gate-Blade — *Eochair na Cloiche*

**Where.** In a standing stone outside a ruined gate on the home island, plainly visible from its road (the page; picked from the seed as `anchoredPlaces` picks).

**On approach** (the first time within ten units; `showMsg`, once):
> *A blade stands in a stone to a hand's breadth below its guard. The stone has grown round it, the way bark grows round a nail.*

**Prompt:** *Press 'E' to take hold of the hilt*

**Failing** (`showMsg` and `addLog('🗝', …)`; the check reads the base plus at most 2 from gear, as the page says):
- Might below 20: *You might as well pull at the hill. The stone does not move.*
- Might 20 to 26: *The stone does not move. Not yet.*
- Might 27 to 29: *Something gives: a grain of grit, no more. Not yet.*

**Taking it:**
> *It comes out of the stone the way a key comes out of a lock: all at once, after nothing.*

Log: *Took the Gate-Blade from the stone by ${gate}.*

**The stone afterwards** (examine): *An empty slot in a standing stone. Looked at end on, it is the shape of a key.*

**The item** (`name`, `desc`):
- *The Gate-Blade*
- *A Maker's blade, heavy for its length. The wards of a key are cut along the fuller, too fine to see without a candle. The Crown's rolls call it la Lame du Seuil. The Old Blood call it Eochair na Cloiche, the Stone's key.*

**The first time it opens a gate's door without that gate's key** (once; `showMsg`):
> *The Gate-Blade goes into the lock as if it were cut for it.*

#### The claimant — the lord of Coeur de Vie (Gatelander; the Crown's seat)

The topic is on the lord at the Crown's seat while the player carries the blade and has neither yielded it nor taken the licence.

*The blade from the stone.*
> "Whatever comes up out of the ground in the Gatelands, the Crown was there before it. That blade has been on the rolls a hundred years as la Lame du Seuil, and the rolls never forget a thing they never saw. Two roads, and neither of them short. Give it to the Crown, and the Crown gives you fifteen hundred gold and a commission with your name on it. Or keep it under licence, and the Crown takes a twentieth of every sale you make while you carry it. I'll not choose for you. Whoever chooses for another carries both loads."

Follow-ups:
- *Give it to the Crown.*
  - Rank 0 with the Crown, and the Crown open to you:
    > "Then the rolls are right at last, which will please the clerks more than it should. Fifteen hundred, and the commission. The Weaver keep you, Commissioner."
  - Already ranked with the Crown:
    > "Then the rolls are right at last, which will please the clerks more than it should. Fifteen hundred, and it's counted as a service to your name. The Weaver keep you."
  - Sworn to the League or the Compact (the Crown closed; the page's gold stands, the rank cannot be given):
    > "The Crown takes what's the Crown's, whoever carries it in. The fifteen hundred is yours. A commission it can't give to someone sworn elsewhere, and you'd not want it if it could."
- *I'll keep it.*
  > "Then here is the licence, and the Crown's twentieth will find you at every counter you stand at, its own or another's. It was never the blade that was dear. It's the carrying."
- *Not now.*
  > "The blade's not going anywhere you can't be found. Neither is the Crown."

While the player keeps it under licence, the same topic becomes *The licence.*:
> "Bring it back when it's heavy. An offer made in this house doesn't sour like milk."
with the same *Give it to the Crown.* follow-up and the same three answers.

**The licence** (an item, `unique:true`, weight 0; `name`, `desc`; the date from `calDateLine` and the era from the calendar draft):
- *Crown Licence — the Gate-Blade*
- *By the Crown of the Gatelands, at Coeur de Vie: licence to ${name} to hold the relic of the old gates entered in the Crown's rolls as la Lame du Seuil, on condition that a twentieth part of every sale made by the holder, at any counter, be paid to the Crown at that counter. Given ${date}, in the ${n} year of the Peace.*

**At a sale** (chrome, after the sale line, the same shape as the Compact's cargo tithe): *(the Crown's twentieth, ${n})*

**Rumour** (`liveRumours`, Gatelands sites within a province of the stone, while the blade is in it):
> "There's a sword in a stone out by ${gate}. Half the young ones in the townland have had a pull at it. It's still there. So are they, mostly."

### 6. The Wolf-Mother's Cloak — *Brat na Máthar*

**Where.** In the master's chamber of a lair cavern on the home island, picked from the seed (the page: *worn by a lair's master*). The master sleeps on it: lying down, it is on the cloak. The builder lays the cloak under the master's spawn in `lairFinish` while `worldState.artifacts.cloak` is unset.

**On entering the master's chamber** (the first time, while the master lives and the cloak is there; `showMsg`, once):
> *The master of the cave is lying on something grey that is not its own hide.*

**Prompt** (within reach of the master, weapon sheathed): *Press 'E' to take the grey cloak from under it*

**Failing** (Resolve below 30; costs nothing, wakes nothing):
> *You put out your hand, and take it back. Not yet.*

**Taking it** (Resolve 30 or more):
> *It lifts its head and looks at you for a long time. Then it lays its head down on the bare stone, and lets you go.*

Log: *Took the Wolf-Mother's Cloak from under the master of ${lair}. It lives.*

**The item** (`name`, `desc`):
- *The Wolf-Mother's Cloak*
- *Grey, and not wool, and dry in any rain. Beasts take whoever wears it for one of hers. The Old Blood call it Brat na Máthar, the Mother's mantle.*

**The first beast that turns away** (once; `showMsg`):
> *The wolf stops, looks at you, and goes about its business.*
(The beast's own name: *The bear stops …*, *The spider stops …*.)

**If the master is killed** (the page: the cloak comes off a corpse and is worth half; how much is half is the systems builder's, from the page). Killed before the cloak was taken, the cloak is on the hoard's floor:
> *Under it, the grey cloak, soaked through. Something has gone out of it.*

Killed while the player wears it:
> *The cloak is lighter on your shoulders. Something has gone out of it.*

#### The cost on the map — the town nearest the lair

**Rumour** (`liveRumours`, that town and its neighbours, while the master lives and the cloak is taken):
> "The road past ${lair} is no road at all now. The carter goes round, and charges for the going round."

A second, the same condition, in that town only:
> "Somebody walked into that cave and walked out again with not a mark on them. The beast's been bolder since. Or we're more frightened. It comes to the same."

#### The claimant — the Fighters' Guild (the head, in the hall's people)

The topic is on any Fighters' Guild head while the player carries the cloak taken alive and the master lives. The Guild posts a contract on the master. `${town}` is the drained town; `${fee}` is the contract's pay.

*The grey cloak.*
- Gatelander:
  > "That's no cloak you bought at a fair. And the master of ${lair} is still breathing, I'd say, or you'd not be standing here in it. ${town} is paying for your quiet road with its own: the carts go round, and a town the carts go round goes thin. The Guild will pay ${fee} for the beast dead. A kindness done with a knife is a kindness yet."
- Markman:
  > "Took that off a live one, aye? Thought so. Brave. Daft, but brave. ${town}'s bleeding for it. Carts go round, the market's empty. Guild pays ${fee} for the thing dead. Your call."
- Aurennais:
  > "That cloak, Master, is from no loom I know, and since you are standing here, I take it its former keeper is alive. The arrangement has a third party, if I may: ${town}, whose road is closed while the beast lives, and whose ledger shows it. The Guild will pay ${fee} for the beast's death, on proof. You are under no obligation, naturally. The town is under one regardless."
- Old Blood:
  > "Brat na Máthar. You walked in and walked out. Few could. The beast lives, and ${town} pays for it. The Guild pays ${fee} for its death. The cloak will be less, after."

Follow-ups:
- *I'll take the contract.* (sets the contract, as the Guild's beast contract)
  - Gatelander: "Then it's on the board with your name beside it. Go gently in. It knows you."
  - Markman: "Good. Bring back something to show for it."
  - Aurennais: "Entered, Master. The fee on proof, as with any contract."
  - Old Blood: "It will know you. It will not understand."
- *Not that one.*
  - Gatelander: "Then it's your road and theirs both. The board will be here when the weather turns."
  - Markman: "Your call. I said so."
  - Aurennais: "As you wish. The offer is not withdrawn; it is only not accepted."
  - Old Blood: "Then wear it well."

**Turning in the contract** keeps the Guild's turn-in lines as they are (*Good work. ${paid} gold.*).

### What in the code would carry it

- **The state** is the page's: `worldState.artifacts[id]` (world row; the S242 list), with `id` one of `blade`, `bell`, `ring`, `cloak`, `lamp`, `shuttle`; the items ride the character row with `unique:true`. Changes go through `takeArtifact(id)` and `yieldArtifact(id, to)` only (the co-op rules). Two new world keys from this draft: `worldState.shrineVerse[siteId]` (the altar's line, once) and `worldState.artifacts.blade.licence` (the licence taken). Both are world keys, not character keys (they describe the shrine and the Crown's rolls), so neither goes in `SS_CHAR_WS`.
- **The hermit**: `makeDef(site,reg,r,'Hermit',…)` in `83-world-generator.js` (grep `role:'old hermit'`) gains `people:'oldblood'` in its `extra` and the folder in `topics`, built by a function in `87-world-quests.js` beside `localLore` (`${gate}`, `${peak}`, `${lair}` from the six places; `${dir}` from `compassWord`).
- **The altars**: `shrineInteract` (`87-world-quests.js`) adds the line after its boon's `addLog`, reading `S.god.key` and the tool's state.
- **The blade**: a stone prop at its place, a prompt in the world's prompt chain (as `shrinePrompt`), the check in `takeArtifact`. The key-free door is the page's rule; its one line is at the first such opening.
- **The Crown**: an `artifactTopics(site)` in the lord's `_extraFn` beside `factionTopics(site)` (`83-world-generator.js`, the `castle` branch and the lord's), shown only at `FACTIONS.crown.seat`. *Give it to the Crown* reads `fstate().crown` (`rank`, `closed`, and the others' rank ≥ 2) to pick its answer, and raises rank 0 to Commissioner through the same path the turn-in uses. The twentieth is taken in the sale path beside the cargo tithe.
- **The cloak**: `lairFinish` (`68-dungeon-misc.js`) lays the cloak under the master and holds the master lying while the player's weapon is sheathed; the prompt is the dungeon's interact chain. The beasts' turning away is the page's rule (`34-creatures.js`'s targeting). The rumours go in `liveRumours`.
- **The Guild**: `guildDef(g,…)` for `guild_f` adds *The grey cloak.* to its `topics` getter while the cloak is held alive; the lines are a table keyed by `gp` (`gatelander`, `markman`, `aurennais`, `oldblood`), as `GUILD_GREET` is.
- **A test** for the builder: the hermit at a camp is Old Blood and his folder lists six; a second prayer at the same shrine adds no verse; *Give it to the Crown* at rank 0 names you Commissioner and pays 1,500; sworn to the League it pays 1,500 and leaves the Crown's rank at 0; a sale with the licence logs *(the Crown's twentieth, N)*; at Resolve 29 the cloak's prompt fails and the master does not rise.

### Checked against the canon

- *No chosen-one prophecies* (Part I, §4.2): no tool is meant for anyone. The hermit says *few can take it*; the blade comes out for whoever is strong enough; the cloak is taken by whoever can stand still.
- *Gatelanders: proverbs, indirection, no bare yes or no; oaths on the Weaver* (§2): the lord never answers *yes* to anything, ends on a proverb (*Whoever chooses for another carries both loads*; *An offer made in this house doesn't sour like milk*) and blesses by the Weaver; the Gatelander guild head ends on one (*A kindness done with a knife is a kindness yet*).
- *Markmen: short sentences, aye, no honorifics* (§2): the guild head's longest sentence is nine words, with *aye*, and he calls nobody anything.
- *Aurennais: formal, honorifics, qualifiers, contract metaphors, never an oath* (§2): *Master*, *if I may*, *naturally*; *the arrangement has a third party*, *on proof*, *not withdrawn; only not accepted*.
- *Old Blood: sparing, exact, the older name for the thing* (§2): the hermit and the Old Blood guild head answer *the Stone's?* with *Eochair na Cloiche* and *the grey cloak* with *Brat na Máthar*, and say no more than the thing and where.
- *Three-register naming* (Part I): each tool has an Irish true name, an Anglo common name and, where an institution claims it, a French one (*la Lame du Seuil*, *le Reliquaire de la Marée*, *la Navette*).
- *The makers didn't think of these as weapons* (Part I): the blade's old name is *the Stone's key*, its fuller carries a key's wards, and it comes out of the stone *the way a key comes out of a lock*.
- *The Crown licenses and taxes the salvage* (§1.1); *the gates are royal property* (§1.1): the Crown buys or licenses; it does not seize.
- *Her children who don't know their mother* (§4.1): *All her children lie down on it, and none of them knows why.*
- *The Guest has no shrine, and gets no artifact* (§4.2, the page): *You do not leave a tool for a guest. You leave the door off the latch.* This agrees with the Empty Chair's door off the latch in *The Year's Names*.
- *Slurs about work, land and gods, never bodies* (§2.1): none used.
- *Silent, and chosen plainly:* the names (the work's, in each register); who has heard of the tools (the Crown has one on its rolls; the Compact and the Church each claim one, next run; three are written down nowhere); how a beast wears a cloak (it sleeps on it).

---

## The Makers' Things, the second run — the Drowned Bell, the Noon Ring, the Waylamp and the Shuttle

*Unapproved.* The second of the two runs Michael's B on DECISION #175 gives the quest writer (`docs/design/unique-artifacts.md`). The first run (above) named all six, wrote the hermit and the altars, and wrote the Gate-Blade and the Wolf-Mother's Cloak in full. This one writes the other four in full, in the page's build order after those two: the Sea's and the Hearth's, then the Sky's and the Weaver's. The rules (where each lies, the check, what it does, what it costs, who wants it) are the page's and are not changed; every line is fitted to them. Two places where the page leaves a rule open are read here the plain way and marked **Rule read** for the systems builder to confirm or change; neither changes a line's meaning.

### What the canon fixes, and where it is silent

- *An Mhuir — tides, ships, whales; "the sea owns them twice a day" is scripture* (§4.1); the tide is low from hours 0 to 6 and 12 to 18 (Part I, the day/night system). So the Bell's trial is the tide, and the lines say *twice a day*, not hours.
- *An Spéir — weather, day and night; the sundial* (§4.1). The ring is read at noon; its old name, *Fáinne an Lae*, is also the old word for dawn. The draft keeps that doubleness unexplained: a ring of the day that is taken at noon.
- *An Teallach — towns, roads, names; the merchants' god* (§4.1). The Hearth's tool belongs to no house: it goes from inn to inn, and every innkeeper speaks for it in their own people (`INN_ROOM_LINES`, `86-world-crime.js`, already keys the inn's lines by people).
- *An Fíodóir — the binding; the loom the sigils are the seams of* (§4.1). *The Withdrawal forbade the reading of sigils; touching is permitted, understanding is not* (§3.1). *The Church of the Weaver is a later Aurennais institution that took the name and forgot the price* (§3.1). So the Church wants the Shuttle sealed for a true reason it cannot give: a thing that finds the unread stones invites reading them. The Prior says only what the Church believes.
- *The Compact: merchant houses under the Church. Priors over the church's towns, Factors over the houses' ports* (§1.3); *the Compact's sealing of gates* (§3.1); *gate-grubbing … is sacrilege to the Church* (§1.3). The game already has the Compact's service *What the Sea Gave Back* (`FLINES.compact[3]`): *A relic was taken from a sealed gate — sealed by us, at cost. It must not be sold.* The Bell's claim is the same claim, written down: the Compact's rolls enter the bell as *le Reliquaire de la Marée*, a sealed gate's reliquary lost at sea. That is the Compact's reading, not the truth; the hermit and the altar give the truth (the Sea's bell), and nobody reconciles them.
- *The Cold: each Mastery-tier reading takes warmth* (§3.3); the Shuttle's cost raises it a point a week (the page). The Cold has no effect yet but is shown on the hub, so the Shuttle's one line about it is felt, not counted.
- *Speech follows the speaker* (§1.5): the Factor and the Prior are Aurennais (`lordFor` takes the nation's people, and Aurenne's titles are *Factor* and *Prior*); innkeepers and priests speak in the people of their house.
- *Aldwyn's thanks* (the page) has no Aldwyn to say it in the open world: he is not one of the generated world's people. Corwin is the travelling face of Act II (§8.2), so Corwin carries it.
- *Silent:* how a bell rides a wreck; what a ring does at night; who held the Waylamp first; where the Church keeps what it seals. The plainer choices: the bell hangs where the ship that carried it went down; the ring does nothing at night and says so; the lamp has always been at an inn, and the first innkeeper does not know whose; the Church keeps it *under seal in the cathedral* and says no more.

### 1. Things not yet yours (the journal, chrome) — the other four

The first run gave the Gate-Blade's and the Cloak's lines. The Bell and the Waylamp have no attribute, so their lines go on the page from the first time the hermit names them or the player sees them, and come off when taken.

- *The Drowned Bell — in the wreck on the rock off ${coast}. At low tide.*
- *The Noon Ring — on the cairn at ${peak}. At noon, under a clear sky. Swiftness 30.*
- *The Waylamp — over the door of ${inn}, at ${town}. Five towns' inns, and no crime.*
- *The Shuttle — in the deepest room of ${gate}. Intelligence 35.*

### 2. The Drowned Bell — *Clog na Mara*

**Where.** A wreck on a rock off a coast of the home island, above water only at low tide (hours 0–6 and 12–18), picked from the seed (the page). The rock lies within sight of a beach or a quay.

**On approach** (the first time within forty units; `showMsg`, once). At high tide:
> *A mast stands up out of the sea off the rock, and the water runs over everything below it.*

At low tide:
> *The sea has drawn back off a rock and left a wreck on it, ribs and a mast and green weed. Something hangs from the last beam.*

**Prompt** (at low tide, within reach of the beam): *Press 'E' to take the bell*

**At high tide** (E at the mast, swimming): *The sea has it now. It gives it back twice a day.*

**Taking it:**
> *The bell comes off its beam green to the lip. You knock it on the ribs getting it out, and it does not ring.*

Log: *Took the Drowned Bell from the wreck off ${coast}.*

**The wreck afterwards** (examine at low tide): *An empty beam, and a bright ring of wood where something hung for a long time.*

**The item** (`name`, `desc`):
- *The Drowned Bell*
- *A ship's bell, small, and heavier than its bronze. Weed grows back on it overnight. The Compact's rolls enter it as le Reliquaire de la Marée. The Old Blood call it Clog na Mara, the Sea's bell.*

**The first storm she rides with it aboard** (once; `showMsg`):
> *The sea is running high, and she rides it as if she had been told to.*

**The cost, the first time a black sail turns for you** (once; `showMsg` and `addLog('⛵', …)`):
> *The bell in your pack rings once, with no sea running. Off the ${dir} quarter, a black sail has put about.*

**Rumour** (`liveRumours`, coastal Gatelands sites within a province of the rock, while the bell is on it):
> "There's a wreck on the rock off ${coast} that only shows at the ebb. The lads say there's a bell on her still. Nobody's gone out for it. The tide comes in faster than you'd think, and it's never once been sorry."

#### The claimant — a Factor of the Compact (Aurennais; any Factor at an Aurennais port)

The topic is on any Factor in Aurenne (`lordFor` at an Aurennais port or town) while the player carries the bell and has not yielded it. `${seat}` is the Compact's seat (`FACTIONS.compact.seat`).

*The bell.*
> "Forgive me, Master. The Compact's rolls enter a bell of that size and that weight as le Reliquaire de la Marée: the reliquary of a gate the Church sealed, entered on a ship's manifest, and lost with the ship. The manifest is in the house's books still; the ship is on a rock. You will appreciate that a thing entered in the rolls is the Compact's wherever it is found, and that the Compact prefers to settle such matters by agreement rather than by any other means. The house offers a cog, entered in your name, and the rank of Factor. Or you may keep it. The rolls will record which."

Follow-ups:
- *Give it to the Compact.*
  - Below Factor, and the Compact open to you:
    > "Then the manifest is closed at last, which the clerks will find more satisfying than they should. You are entered as Factor of the Compact, Master, from today. The cog is entered also."
  - Already Factor or Prior:
    > "Then the manifest is closed at last. It is entered as a service to the house, Master, beside your name. The cog is entered also."
  - Sworn to the Crown or the League (the Compact closed to you):
    > "The reliquary is received, Master, and the house is obliged. The rank the house cannot give to someone sworn elsewhere; that is not a judgment, only a clause. The cog stands."
- *I'll keep it.*
  > "As you wish. The rolls will show it held by you, which is a kind of agreement also. I would only observe that the sea has taken it once already, and the sea does not consider itself bound by our books."
- *Not now.*
  > "Of course. The offer is entered, and stands until withdrawn. It has not been withdrawn."

**The cog** (after *Give it to the Compact.*, in place of *The cog is entered also.* / *The cog stands.*, by what `grantShip` does; the same four outcomes as `compactClaimLine`):
- No ship: *The cog is at the quay here.* (or *at the quay at ${port}.*)
- Her ship is smaller than a cog: *Your own ship will be refitted as a cog where she lies, at the house's charge.*
- Her ship is a cog or larger: *You keep a ship already, and a larger one. The house will pay the cog's worth instead: ${n} gold.*
- Her ship is on the bottom: *Your ship is on the bottom; the house has ordered her raised, a cog, in three days.*

**Rule read.** The page gives *Factor rank and a cog*. Read here: below Factor, the rank rises to Factor (rank 2); at Factor or above it counts as one service; with the Compact closed, the cog alone. A player whose own hull is a cog or larger takes the cog's worth in gold (1,300, `SHIP_CLASSES.cog.worth`), because a smaller ship given to a sailor with a bigger one is no gift. The systems builder may choose otherwise; only the cog's line then changes.

### 3. The Waylamp — *Lóchrann an Teallaigh*

**Where.** Over the door of one inn on the home island, picked from the seed (the page: *passed from inn to inn*). While no one carries it, it hangs at the last inn it was given to.

**The trial** (the page): carry it lit into the inns of five other towns, without a crime on your account while you carry it. Each innkeeper trims the wick (a topic). On the fifth, it is yours. **Rule read** (the page is silent on a crime during the trial): a crime puts the lamp out, as it does after; the count goes back to nothing, and the lamp lights again at the next inn after seven days.

**On approach** (the first time within twenty units of the inn that holds it; `showMsg`, once):
> *A lamp burns over the inn's door in broad day. The rain does not seem to reach it.*

**The innkeeper who holds it** (the topic *The lamp over the door?*, while the lamp hangs there; by the inn's people):
- Gatelander:
  > "That lamp was over the door when my mother had the house, and over some other door before that, and nobody I ever asked could say whose door it was first. It goes from house to house, and the one rule is it goes with somebody honest. Carry it to five inns in five towns, and keep your hands to yourself the length of the road, and it's yours. A light's no use to a house that keeps it."
- Markman:
  > "Lamp's not mine. Never was. Goes inn to inn. Carry it to five towns' inns, lit, no thieving on the way, and it's yours. That's the rule. I didn't make it."
- Aurennais:
  > "The lamp is not the house's property, Master, though it is in the house's keeping. It passes from inn to inn on one condition: that whoever carries it carries it into five towns' inns, lit, without a crime against their name. On the fifth it becomes theirs. No one has written the terms down. No one has needed to."
- Old Blood:
  > "Lóchrann an Teallaigh. It goes from hearth to hearth. Five inns, five towns. Steal nothing. Then it is yours."

Follow-ups:
- *I'll carry it.* (`takeArtifact('lamp')` in its trial state; the count at nothing)
  - Gatelander: "Then take it down yourself; it'll not come for me. Mind it, now. A lamp's like a name: easy carried, hard lit again."
  - Markman: "Take it, then. Keep it lit."
  - Aurennais: "It is in your keeping from this moment, Master. The house wishes you a straight road."
  - Old Blood: "Take it down."
- *Not today.*
  - Gatelander: "It's waited longer than you'll keep it waiting."
  - Markman: "It'll be here."
  - Aurennais: "It will be here, Master. It generally is."
  - Old Blood: "It waits."

**At each inn on the way** (the topic *The lamp.*, at an inn in a town not yet counted; the count rises by one; `${n}` the count, `${left}` how many are left):
- Gatelander: "You're carrying the lamp. Here, let me trim it. ${n} houses, and ${left} to go; a road's shorter walked than talked about."
- Markman: "The lamp. Give it here. Wick's trimmed. ${n} done, ${left} left."
- Aurennais: "The lamp, Master. Allow me to trim it. That is ${n} houses entered, and ${left} remaining."
- Old Blood: "The lamp. There. ${n}. ${left} more."

At an inn in a town already counted: *"This house has trimmed it once. It's another town's turn."* (Gatelander); *"Trimmed it already. Next town."* (Markman); *"This house has trimmed it already, Master. Another town's house must."* (Aurennais); *"Not here again."* (Old Blood).

**The fifth** (in place of the count line):
- Gatelander: "That's five, and it's yours, and I'd not take it off you now if you asked. They say the lamp knows the road it came by. If it does, it's said nothing to me."
- Markman: "Five. It's yours. Don't lose it."
- Aurennais: "That is the fifth house, Master. The lamp is yours by the only terms it has ever had, and the house is honoured to have witnessed them."
- Old Blood: "Five. It is yours. It was always going to someone."

Log: *The Waylamp is yours: five towns' inns, and nothing on your account.*

**The item** (`name`, `desc`):
- *The Waylamp*
- *An inn lamp of old brass with a horn window. It burns without oil and no weather puts it out. The Old Blood call it Lóchrann an Teallaigh, the Hearth's lantern.*

**Holding it** (the room offer's first sentence, at any inn, before the house's own offer; by the inn's people):
- Gatelander: "There's no charge to the one carrying that lamp. There never was, and I'd not be the first."
- Markman: "You've the lamp. No charge."
- Aurennais: "The lamp's bearer is not charged, Master. That is the custom, and the house keeps it."
- Old Blood: "The lamp pays."

**The coach** (at the coachman, chrome after the seat line): *(the lamp: no fare)*

**The lamp goes out** (any crime while carrying it, in the trial or after; `showMsg` and `addLog('🏮', …)`):
> *The Waylamp goes out in your hand. The bounty on you is doubled.*

Seven days on (`addLog('🏮', …)`): *The Waylamp is lit again. Nobody lit it.*

#### The claim — the innkeepers (any inn, by the inn's people)

The topic *Give the lamp to the house.* is at any inn while the player holds the lamp as their own. Given, the lamp hangs over that inn's door and the round can begin again from it; that town's favour rises by 2 (`addFavor`).

- Gatelander:
  > "Over my door? You'll not want it back, now; that's the way of it. The town will know who brought it, and a town's memory is longer than a lord's. Sit; the first cup's the house's, and so's the last."
- Markman:
  > "Over this door? Good. The town'll know it was you. Drink's on the house."
- Aurennais:
  > "You do the house a great honour, Master, and the town also; the town will know whose. Permit me to say that very few who earn the lamp give it up. Fewer than the custom would like."
- Old Blood:
  > "Here. Good. The town will remember you."

Log: *Gave the Waylamp to ${inn}, at ${town}.*

**Rumour** (`liveRumours`, the town whose inn holds the lamp and its neighbours, while it hangs there):
> "There's a lamp over the inn door at ${town} that burns in the rain. They say it goes to anyone who'll carry it honest to five towns. They say a lot, at ${town}."

### 4. The Noon Ring — *Fáinne an Lae*

**Where.** On the cairn at the top of a peak on the home island (`PEAKS`), picked from the seed (the page). The cairn's top stone has a hollow worn to fit the ring, and a line cut across it that the cairn's shadow covers at noon.

**On approach** (the first time within ten units of the cairn; `showMsg`, once):
> *A cairn at the top of the world, and on its top stone a ring of gold in a hollow worn to fit it. A line is cut across the stone, and the cairn's shadow lies on it.*

**Prompt:** *Press 'E' to take the ring*

**Failing** (`showMsg` and `addLog('☀', …)`; first the hour, then the sky, then Swiftness; the check is the page's: noon, a clear day, Swiftness 30 for the climb against the clock):
- Not noon: *The ring will not lift. The light is wrong for it.*
- Noon, under cloud, rain or snow: *Noon, and no sun to read it by. The ring stays where it is.*
- Noon and clear, Swiftness below 30: *The cairn's shadow is already off the line by the time your hand is on the stone. Not yet.*

**Rule read.** *Noon* here is the window the systems builder chooses (the sundial's hour of noon); the lines assume one game hour.

**Taking it:**
> *At noon the cairn has no shadow, and the ring is only a ring. It comes up into your hand.*

Log: *Took the Noon Ring from the cairn on ${peak}.*

**The cairn afterwards** (examine): *An empty hollow in the top stone, and a line no shadow reaches at noon.*

**The item** (`name`, `desc`):
- *The Noon Ring*
- *A plain gold band, cut inside with twelve marks and a sun. Worn, it is warm at noon and cold at midnight. The Old Blood call it Fáinne an Lae, the ring of the day, which is also their word for dawn.*

**Turning the weather** (the item's use, once a day; `showMsg` and `addLog('☀', …)`):
- Clear to rain: *You turn the ring a quarter on your finger. By the time you look up, the sky has begun to close.*
- Rain to clear: *You turn the ring back. The rain thins and stops, and the light comes through as if it had only been waiting.*
- Already turned today: *The ring will not turn again today.*
- Any other sky (fog, snow, storm, grey): *The ring does not turn under this sky.*

**The cost** (a strike within forty units in a storm, the page's one in three; `showMsg`, the first time only):
> *Lightning comes down a stone's throw from you. The ring is warm.*

Afterwards each strike logs only: *Lightning, close.*

**Rumour** (`liveRumours`, sites within a province of the peak, while the ring is on it):
> "There's gold on the cairn at the top of ${peak}. Everybody's seen it from below, and nobody's brought it down. You climb up, it's never noon. You climb faster, it's raining. The mountain takes its time, and it takes yours."

No claimant (the page): the peak is the cost.

### 5. The Shuttle — *Spól an Fhíodóra*

**Where.** In the deepest room of the gate nearest the home island's last unread sigil (the page; `sigilDoors`, `nearestSigilDoor`). It lies on the floor before the sigil, as if put down a moment ago.

**On entering the deepest room** (the first time, while the Shuttle lies there; `showMsg`, once):
> *Something small and pale lies on the floor under the sigil, the shape of a boat, or a fish, or neither.*

**Prompt:** *Press 'E' to take up the shuttle*

**Failing** (Intelligence below 35; costs nothing):
> *You can see it, and you cannot see where it is. Your hand closes beside it every time. Not yet.*

**Taking it** (Intelligence 35 or more):
> *You pick it up the way you would pick up something you had put down a moment ago.*

Log: *Took the Shuttle from the deepest room of ${gate}.*

**The item** (`name`, `desc`):
- *The Shuttle*
- *A weaver's shuttle of pale wood, worn smooth by a hand that is not yours, with a thread end in it that nothing will pull out. The Church calls it la Navette. The Old Blood call it Spól an Fhíodóra, the Weaver's shuttle.*

**The compass** (the first time the needle turns for it; `showMsg`, once):
> *The compass needle leans, and keeps leaning, toward a stone you have not read.*

**The Cold** (each week it rises by the Shuttle; `addLog('❄', …)`, no screen line):
> *Your hands are colder than the weather.*

#### The claimant — the Church: the Prior at the Compact's seat (Aurennais)

The topic is on the Prior at Aurenne's capital (`lordFor(seat)`, the `castle` branch's lord) while the player carries the Shuttle and has not yielded it. The Church wants it sealed. The page's price: Compact standing +3 (three services) and Aldwyn's thanks.

*The shuttle.*
> "I will be candid with you, Master, since candour is cheaper than the alternative. The Church enters that object as la Navette, and it has been on our books as lost for longer than the Compact has kept books. It finds the stones no one has read. The Church holds that the Weaver's work is to be kept, not read, and that a thing which finds the unread stones is an invitation, and an invitation is half an act. We would have it under seal in the cathedral, where it invites no one. In return the Compact will enter three services to your name, and I will write to the Royal Herald at Ironhaven, who has asked the Church for the same thing in other words for many years. Or you may keep it, and the Church will pray for you, which you may count as you please."

Follow-ups:
- *Give it to the Church.*
  - The Compact open to you:
    > "Received, and entered: three services to your name, Master, and a letter to the Herald by tonight's post. It will be under seal before the bells. The Church is in your debt, which it records."
  - Sworn to the Crown or the League (the Compact closed to you):
    > "Received. The services the Compact cannot enter to someone sworn elsewhere; that is a clause, not a sentiment. The letter to the Herald I can write, and will. It will be under seal before the bells."
- *I'll keep it.*
  > "Then I will not argue the point; arguing with a free man is a contract with no consideration. I would ask only this: when it leans, ask yourself who is being led, and by whom."
- *Not now.*
  > "The offer stands, Master. The Church is accustomed to waiting. It has had practice."

Log (given): *Gave the Shuttle to the Church at ${seat}.*

**A priest anywhere** (the topic *The shuttle.*, on any `Priest` while the player carries it; a pointer, by the church's people):
- Gatelander: "There's a thing in your pack the Prior in Aurenne would cross the sea for, and I'd not say that of many things. Take it to her, or don't. But don't bring it in here."
- Markman: "That's the Church's business, not mine. The Prior's in Aurenne. Take it there or don't."
- Aurennais: "That object is the Prior's concern, Master, at ${seat}, and not this house's. I would take it to her. I would not keep it."
- Old Blood: "Spól an Fhíodóra. Put it back, or give it to the ones who will shut it in. Do not use it."

(*Her*/*him* for the Prior follows `lordFor(seat).female`.)

**Aldwyn's thanks** (Corwin, the next time he stands at a harbour after the Shuttle is given; one topic, *Word from Aldwyn?*, shown once):
> "Aldwyn had a letter from the Prior. He's not a man for thanks; he'd sooner owe you than say so, and he owes half the island on those terms. But he asked me to say it, so here it is, said. A thing put out of reach is a thing he can stop lying awake over. He lies awake anyway. It's one thing fewer."

### What in the code would carry it

- **The state** is the first run's: `worldState.artifacts[id]` with `id` `bell`, `ring`, `lamp`, `shuttle`, changed only through `takeArtifact(id)` and `yieldArtifact(id, to)`. New world keys from this draft: `worldState.artifacts.lamp.inn` (the inn it hangs at), `.count` and `.towns` (the trial), `.outUntil` (the lamp out); `worldState.artifacts.ring.turned` (the day it last turned); `worldState.artifacts.bell.blackSailSeen`, `ring.struck`, `shuttle.compassSeen` (the once-only lines). All describe the tools, so all are world keys, not in `SS_CHAR_WS`; each goes in the S242 list. Who holds the lamp in the trial rides the character row with the item, as the others do.
- **The Bell**: the wreck prop on a rock (`85-world-sea.js`, beside `wreckGeo`), its prompt gated on `isTideOut()`; the storm line in `shipWear`; the black sail's turn in the pirates' steering (`OTHER`, `kind:'pirate'`). The Factor's topic is in the lord's `_extraFn` (as `factionTopics`), shown at any Aurennais `port` or `town`; *Give it to the Compact* reads `fstate().compact` and reuses `grantShip` for the cog, its line picked as `compactClaimLine` picks.
- **The Waylamp**: `innTopics(house, people)` (`86-world-crime.js`) gains the three topics (*The lamp over the door?*, *The lamp.*, *Give the lamp to the house.*) and the room offer's first sentence, in a table keyed like `INN_ROOM_LINES`; the free room and the free coach seat in `innPrice` and the coach fare; the crime hook in the crime record (`bountyAt`), which doubles that bounty and sets `outUntil`.
- **The Noon Ring**: the cairn prop at a `PEAKS` entry, its prompt and check reading `gameHour()`, `WX.type` and Swiftness; the use in `useItem` (`62-actions.js`), setting `WX` through the weather's own setter (`devWeather` shows the path); the strike in the storm's lightning.
- **The Shuttle**: laid in `buildDungeon` (`56-dungeon-build.js`) in the deepest room of the gate `nearestSigilDoor` picks for the home island; the check in `takeArtifact`; the compass in the Weaver's Eye path (`nearestSigilDoor`, already there for the spell); the Cold in `worldState.cold`; Varek's sooner discovery in `varekDue`. The Prior's topic in the castle lord's `_extraFn` at `FACTIONS.compact.seat`; the priests' pointer in `richTopics`' `Priest` branch (`87-world-quests.js`, beside *A blessing?*); Corwin's line in `tickCorwin`'s topics.
- **The rumours** go in `liveRumours`, each while its tool is still where it lies.
- **A test** for the builder: at hour 8 the bell's prompt answers *The sea has it now*, at hour 3 it takes; the Factor's *Give it to the Compact* at rank 0 names you Factor and grants a cog, and with a galleon pays 1,300; five inns in five towns make the lamp yours and a sixth inn in a counted town refuses; a crime puts it out and doubles the bounty; the ring at hour 9 says *The light is wrong for it*, and at noon in rain *no sun to read it by*; turned twice in a day it answers *will not turn again today*; the Shuttle at Intelligence 34 does not lift; given to the Prior it enters three services, and with the League's rank at 2 it enters none.

### Checked against the canon

- *No chosen-one prophecies* (Part I, §4.2): nothing is waiting for anyone. The bell is taken by whoever comes at the ebb, the ring by whoever is fast enough at noon, the lamp by whoever is honest for five towns, the Shuttle by whoever can see it. The first innkeeper's *It was always going to someone* is Old Blood plainness, not a prophecy: someone, not you.
- *Gatelanders: proverbs, indirection, no bare yes or no; oaths on the Weaver* (§2): the innkeeper never says *yes*; every Gatelander line has its saying (*A light's no use to a house that keeps it*; *A lamp's like a name: easy carried, hard lit again*; *a road's shorter walked than talked about*; *a town's memory is longer than a lord's*). No Gatelander here swears, so no oath is wanted.
- *Markmen: short sentences, aye, no honorifics* (§2): the Markish innkeeper's longest sentence is ten words, and nobody is called anything.
- *Aurennais: formal, honorifics, qualifiers, contract metaphors, never an oath* (§2): the Factor and the Prior say *Master*, *forgive me*, *permit me*, *I would only observe*; the contract runs through both (*entered*, *the manifest is closed*, *a clause, not a sentiment*, *a contract with no consideration*). Neither swears; the Prior's *the Church will pray for you* is a promise of the Church's, not an oath.
- *Old Blood: sparing, exact, the older name for the thing* (§2): the Old Blood innkeeper answers the lamp with *Lóchrann an Teallaigh*, and the Old Blood priest answers the shuttle with *Spól an Fhíodóra* and three short orders.
- *Three-register naming* (Part I): Irish true names (*Clog na Mara*, *Fáinne an Lae*, *Lóchrann an Teallaigh*, *Spól an Fhíodóra*), Anglo common names, and French where an institution writes it down (*le Reliquaire de la Marée*, *la Navette*).
- *The sea owns them twice a day* (§4.1): *The sea has it now. It gives it back twice a day.*
- *The Withdrawal: touching is permitted; understanding is not* (§3.1); *the Church took the name and forgot the price*: the Prior wants the Shuttle sealed because *a thing which finds the unread stones is an invitation* — right in its fear, wrong in its reasons, and it never says *the Clearing*.
- *The Compact seals gates* (§3.1, §8.2) and *gate-grubbing is sacrilege* (§1.3): the Compact's claim on the bell is that it came from a gate the Church sealed, as *What the Sea Gave Back* already says of its reliquary.
- *Aldwyn: old, careful, withholds* (Part I): Corwin's *He's not a man for thanks; he'd sooner owe you than say so* and *He lies awake anyway* keep him so. Corwin stays *knowing, faintly amused*.
- *The Cold: a pressure, the sense of being regarded* (§3.3): the Shuttle's one line is about the hands only. Nothing in the draft says *window*.
- *Slurs about work, land and gods, never bodies* (§2.1): none used.
- *Silent, and chosen plainly:* the bell hangs where the ship that carried it went down; the ring does nothing at night; the lamp has always been at some inn; the Church keeps the Shuttle *under seal in the cathedral* (not the Guest's chapel, which is under the same cathedral and is Michael's).

---

## The Root — the rooms beneath all the gates

*Unapproved.* Backlog A: *The Root's cavern wants authored rooms (a set piece at the root itself), not only the* deep *generator.* Today the Root (seed 9001, `build()` in `87-world-quests.js`) is a large `deep` cavern from the generator, with a renamed Ogre as its master and a hoard of gold and a sword. When the master dies, Varek appears outside, at the mouth (`onLeavePortal`, `tickRoot`, `88-world-ticks.js`). This draft keeps the generator for the first floor, the way down, and makes the lowest floor six authored rooms in a line: the place where the loom was made, the count it kept, what the count was of, the day the makers stopped, and the glass. Varek stands in the last room and not at the mouth. His question reads the player's real pause. The guard is DECISION #214. The draft writes it for A and marks the lines that depend on it.

### What the canon fixes, and where it is silent

- *The root beneath all the gates, on Aurenne's far side under deep water, reached by ship and Water Breathing, the first instanced lair. Discovery 5. The final beat* (§8.3). *The place beneath all the dungeons where the original binding was made* (Part I, Act III).
- *The Fíodóirí, the Weavers: a small endogamous priesthood of makers who strung the loom about fifteen centuries ago. They built a gate in every province. They ruled nobody* (§3.1). *An Fíodóir … a shuttle* is the Weaver's icon (§4.1). So the makers' mark in the stone is a shuttle.
- *The Clearing.* Every sigil is carved over a grave; the sigils are where the departed are burned out of reality, *unmade* (§3.1). This draft never states it. The Count shows that something was being counted, gate by gate. The biers show shrouds that hold a shape and nothing else. The player puts the two together, or does not.
- *The Withdrawal. When the loom was finished it worked; the makers saw what it did to the dead, and something looked through the window they had made. They broke their own order the same year … forbade the reading of sigils (touching is permitted; understanding is not)* (§3.1). So the last room before the glass is the day the work stopped, tidily, and over its door is the law. The law's words are this draft's: *Lámh, ní léamh*, a hand, not a reading. *Lámh* and *léamh* rhyme in the old tongue.
- *The tattoos are cultural: given at coming-of-age to children who show the marks, by elders who no longer remember why the script is the script* (§3.1). Read here: the law is what the elders say when they give the marks, and nobody knows why. **Canon silent; the plainer choice** would be to say nothing of it. Marked for Michael.
- *Discovery 5, the window: the player is not in the world; the world is turned toward them; the binding is glass and he has stood on the wrong side of it for 250 years. "When you look at me — what is between us?" He never hears the answer; he reads it in how long the player takes to reply* (§6). The build asks the question, offers only *…*, and gives one reply whatever the pause. Here the reply is chosen by the real time the player took, read from the clock (the dropped-frame rule), in three bands.
- *The final beat* (§6, the first candidate) is already in the build: *Two hundred and fifty years. Every death written down. And I was the whole of your evening.* It stays as written and closes each band.
- *Dragons do not hoard by choice* (§5); a hoard at the root of the world reads as a dungeon's habit, not this place's. The draft gives no hoard.
- *Silent:* what the rooms look like, what is in them, what guards them, what touching the root does. The plainer choices: stone and bronze, benches and biers, nothing gilded; the guard is #214; touching the root lets you feel every gate and nothing more. There is no boon, as there is none at the Guest's chapel. The four seconds of black belong to the chapel alone (§4.2: *the one thing the game is otherwise never allowed to do*), so the Root never uses them.

### The shape

- **Giver.** The Act III quest, *What Was Bound* (`act3_root`, Varek at the Ashfeld), as built. Its objective changes from *Reach the Root and kill what guards it* to *Go down to the Root*.
- **Steps.** (1) Reach the islet and go in, as built. (2) Go down through the first floor, the generator's `deep` cavern, as built. (3) The lowest floor: the Stair's Foot, the Workroom, the Count, the Biers, the Last Bench (the guard), the Root. The rooms are in a line, and each opens only into the next. (4) The guard dies (`S.rootCleared`, as built). (5) Varek is at the glass. (6) The ending, as built.
- **States.** `worldState.story.rootSeen` = `{stair, work, count, biers, last, root}` (each room's first entry line, once). `story.rootTouched` (the glass). `story.rootCleared` (as built). `worldState.varek.rootPause` (the seconds the player took; `varek` is in `SS_CHAR_WS`, so it rides with the character, which is right: it is what Varek knows about *you*). `story.ending` (as built).
- **Turn-in and reward.** None: the ending is the turn-in. No hoard. One misc item, the chisel (below), if #214 is A.
- **What it changes.** After a *sealed* or *open* ending the game goes on, so the Root can be visited again. The glass room reads differently after each (below). An *unbound* ending ends the game, as built.

### Approach — a rumour at Aurenne's eastern ports (`liveRumours`, while `story.step==='root'`)

At the Aurennais sites nearest the Root, by the speaker's people (*speech follows the speaker*, §1.5):

- *Aurennais:* "The rock off the far shore, Master? The charts mark it, and the Church's chart marks it twice, which I am given to understand means: not for fishing. My father's boats went round it at a cable's length all his life. Nothing nests on it. Not even the gulls, who are not otherwise particular."
- *Markman:* "The black rock east. Nothing lands on it. Not gulls. Not us."
- *Gatelander:* "There's a rock out east the birds go round. When the gulls won't sit on a thing, I'd not be the first to try it."
- *Old Blood:* "*Fréamh.* The root. Not the rock."

### The first floor (the generator's, as built)

On reaching the stair down to the lowest floor (`showMsg`, once):
> *The stair goes on down past where the sea should be, and the sea does not come in. You can hear it through the walls, close on every side, the whole weight of it held off.*

### 1. The Stair's Foot — `rootSeen.stair`

**On entry:**
> *The stair ends in a short hall, cut square. Nothing grows here, not even the salt.*

**Examine the walls** (*Press 'E' to look at the stonework*):
> *The walls are cut, not worn. At the corner of every course there is a mark the size of a thumbnail, the way a mason marks his work: a shuttle. The same mark, course after course, all the way down.*

### 2. The Workroom — `rootSeen.work`

**On entry:**
> *A long room with benches down both sides, and stools at them too low for you.*

(For an Old Blood player, the stools are not too low: *A long room with benches down both sides, and low stools at them, the height you would have made them.*)

**Examine a bench** (*Press 'E' to look at the bench*):
> *Stone dust lies along the bench, gone hard where it fell. Bronze chisels, green through. Between them, flat stones the size of a door, laid in rows, each cut with a sigil. You know the shapes. You have put your hand on some of them, at the bottom of gates.*
>
> *There are more blank stones than cut ones.*

An Old Blood player reads one more line after the first paragraph:
> *The marks cut on the bench ends are the marks on your wrists.*

### 3. The Count — `rootSeen.count`

**On entry:**
> *One wall is cut from the floor to as high as a hand can reach with short strokes in fives, row on row.*

**Examine the wall** (*Press 'E' to look at the wall*):
> *Over each row is a gate's mark. Some you know: the Shadows under Ashenmoor, the Crypt of Embers, the Vault of the Tide. Under each mark, strokes, more than you could count in a day. Low on the wall they are deep and even. Higher up they are quick and shallow, as if whoever cut them had stopped looking at what they cut. At the top they stop, in the middle of a five.*
>
> *Somebody down here was counting something, gate by gate, for a long time. Then they stopped.*

**Examine the floor below the last row** (a second point; *Press 'E' to look closer*):
> *The ceiling over the last row is black with lamp soot, newer than anything else down here. Under it the dust is wiped from the floor in a patch the size of a man sitting. Somebody has sat here often, with a lamp, and read the wall.*

(It is Varek. Nobody says so. *He keeps a list*; the makers kept a count. The rhyme is the room's whole point, and it stays unspoken.)

### 4. The Biers — `rootSeen.biers`

**On entry:**
> *Stone biers in two rows, and on each a shroud laid out the length of a body.*

**Examine a bier**, the first time (*Press 'E' to look at the shroud*):
> *The linen lies as it was laid, folded at the head, tied at the feet. It keeps the shape of someone small. It is flat. Nothing has been taken out of it: the knots are whole and the folds are dusty and unbroken. There is no one in it. There was, once.*

If the Count has been examined, one more line:
> *You think of the strokes on the wall in the room behind you.*

The second bier: *This one too.* Any after: *All of them.*

### 5. The Last Bench — `rootSeen.last`

**On entry** (#214 A, the guard at work):
> *Here the work stopped. Something is sitting at the last bench with its back to you, cutting.*

(If #214 is B or C, the line is only *Here the work stopped.*)

**Examine the bench** (once the guard is dead; *Press 'E' to look at the stone*):
> *A stone on the bench with a sigil half cut into it, the chisel standing in the groove. Beside it the mallet, laid down, not dropped. On every bench in the room it is the same: tools set down square, stools pushed in. Whoever worked here finished nothing and left everything tidy.*

**Examine the lintel over the far door** (*Press 'E' to look at the words over the door*). Which line you read depends on who you are:
- *Old Blood player:*
  > *Two words over the far door, cut deeper than anything else in the room. You know them the way you know your own wrists: Lámh, ní léamh. A hand, not a reading. It is what the old women say when they put the marks on a child, and nobody has ever said why.*
- *Read at Mastery at least once* (`worldState.masteries>=1`):
  > *Two words over the far door, cut deeper than anything else in the room: Lámh, ní léamh. Hand, not reading. In the old tongue the two words rhyme, which is how a thing is made to be remembered by people who will not be told why.*
- *Anyone else:*
  > *Two words over the far door, cut deeper than anything else in the room. You cannot read them. You have the feeling you are not meant to.*

#### The guard (#214 A: *an Fíodóir Folamh*, the Empty Weaver; working name)

The master is placed at the last bench, not drawn from the farthest foe (`lairFinish`, for seed 9001). Its health bar reads its name. The log lines follow the Faolchú's (*terse, observational, never melodramatic*); the icon is the builder's choice.
- On sight: *It sets the chisel down, square, and stands.*
- At two thirds: *The script along its wrists burns white.*
- At one third: *Its seams open along the arms. Under the script is more script, and under that, nothing.*
- **Optional, the systems builder's call:** below a third it sometimes turns back to the bench between blows, open to a hit, as if the work could still be finished. The log, the first time: *It turns back to the stone, as if there were still time.*
- On death: *It comes apart along its seams and lies down flat, like the linen in the room behind you.*
- Then (`showMsg`, replacing *The Root is quiet. Something is standing at its mouth.*):
  > *The stone underfoot stops humming. Past the far door, someone is standing very still.*

**The chisel** (on its body; no hoard):
- *A Maker's Chisel*, misc, weight .3, no worth to a merchant (`buyPrice:0`), not sold.
- *Bronze, green through. The handle is worn to the shape of a grip that is not yours.*

### 6. The Root — `rootSeen.root`

**On entry:**
> *The floor runs out at an edge, and past the edge there is a black that is not water and not stone. It gives back no light. Not even yours.*

**Prompt** at the edge: *Press 'E' to put your hand on it*

**The first touch** (`story.rootTouched`):
> *It is warm, the way a sigil is warm. Then it is every sigil at once: the stones under the Gatelands' fens, under the Mark's snow, under Aurenne's salt, near and far, all of them, as plain as your own teeth.*
>
> *And on the far side of it, close, something that is not a stone. It is looking where you are looking.*

Log: *You put your hand on the Root.*

**Every touch after:** *Warm. All of them. And the far side, still looking where you look.*

**Rule read.** *Put your hand on it and you'll feel them all* (Varek's greeting, as built) is taken literally: the first touch marks every sigil gate on the three islands on the world map, as a rubbing marks one (§7). There is no other effect and no boon. If the systems builder would rather it marked nothing, only the log line stays.

#### Varek, at the glass

He is in this room once the guard is dead, standing at the edge, facing the black, not the door (`tickRoot` spawns him in the dungeon, not at the mouth). His greeting is as built:
> "Here it is. The root of every gate. Put your hand on it and you'll feel them all — and you'll feel the other side. I've stood here a long time. When you look at me — what is between us?"

The first row is *…*, alone, as built. His reply is chosen by the time between the greeting being shown and the row being chosen, read from `performance.now()` (the dropped-frame rule; a panel open or a tab away does not stop it). The seconds are kept in `worldState.varek.rootPause`. `${n}` is the pause in breaths, `Math.max(2, Math.round(seconds/4))`. Each band ends with the final beat, as built.

- **Under 4 seconds:**
  > "No time at all. You'd heard enough voices today to know how this one ends. Two hundred and fifty years. Every death written down. And I was the whole of your evening."
- **4 seconds to 2 minutes:**
  > "${n} breaths. I counted them. You weren't looking for a word. You were somewhere else, deciding whether I was worth one. Two hundred and fifty years. Every death written down. And I was the whole of your evening."
- **Over 2 minutes, or the page was hidden between** (`document.hidden` seen while the greeting stood):
  > "You went away. Your body stood here and you were gone, and the stones went quiet the way they do. You can leave. I never could. That's what's between us. Two hundred and fifty years. Every death written down. And I was the whole of your evening."

The three ending rows and his answers to them are as built (*Break it. Let the world unbind.* / *Seal it. Close the window.* / *Leave it open. Knowing.*), and so is the ending screen.

#### The Root afterwards (the game goes on after *sealed* and *open*)

- *Sealed*, entering the room:
  > *Where the black was there is stone, grey and cut flat, with a shuttle at its corner like every other course. It is cold.*

  The prompt does not show. Varek is not here.
- *Open*, entering the room:
  > *The black is still there past the edge. You could feel it warm from the foot of the stair.*

  The touch stays, with its *every touch after* line. Varek is not here; the canon puts him *at fields, at a distance*.

### What in the code would carry it

- **The floor.** For `portal.root` (seed 9001), the lowest floor is laid by hand instead of by `makeDungeon`: six rooms in a line, joined by single doorways, the stair from the floor above landing in the first. `furnBuild` and the room kits supply benches (the banquet table, lowered), stools, biers (the tutorial crypt's sarcophagus without its lid, a shroud mesh flat on it), the wall of strokes (a carved-face decal like the keystones'), and the black (an unlit plane with `depthWrite` and no reflection). How it is built is the look builder's call. The room list and what each must show are this draft's.
- **The examine points.** One prompt and one `showMsg` each, like the Mouth's and the keystones'. Room entries fire once, keyed `9001:2:<room>` (the co-op rule on ids) into `story.rootSeen`.
- **The guard.** `lairFinish` skips the farthest-foe pick for seed 9001 and places the master at the last bench, named by #214. With #214 A, the body is the people's rig at the Old Blood proportions, arms lengthened, the seams lit like the Faolchú's. No hoard; `CHESTS` gets nothing. The chisel goes on the corpse's loot.
- **The order.** `onLeavePortal`'s cleared check becomes the guard's death. `tickRoot` spawns Varek inside the dungeon scene at the edge. Its `greeting` getter stamps `ROOTS.askedAt=performance.now()` and watches `visibilitychange` for the third band. The `…` row's `fn` picks the band.
- **The map.** `story.rootTouched` stars every sigil gate (the rubbings' map mark, `worldState.rubbings`).
- **The rumour.** `liveRumours` at Aurennais sites within one province of the Root while `story.step==='root'`.
- **The quest's objective** in `finishAsh`: *Go down to the Root*.
- **Saves.** Nothing new at the top of `worldState`: `story` is already read back (`_applyLoadData`) and is the world's; `varek` is already the character's.

### Questions for Michael

- **DECISION #214:** what guards the Root (a maker's shape, the uncleared, or the Ogre as built), and if the first, its name.
- When promoting: whether the Withdrawal's law should be the words said at the marking of Old Blood children (canon silent; the draft says yes, in one Old Blood line).
