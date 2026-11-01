# Quest drafts

These are the quest writer's drafts. None of them is canon until Michael promotes it into `quest_writing.md`, and none is a spec until it is approved. Each draft gives the quest's shape, every line verbatim with its speaker and people, and a note on what in the code would carry it.

Calls read to: 2026-10-16T17:51:09.360Z (run 33, 1 Nov: no new calls on the page)

---

## The Seventh Niche — the Guest lorebook, the defaced niches, the Church's line

*Approved by Michael, 14 Oct 2026.* *Built in part, Session 979 (16 Oct), on auto/quests-build: the book (on the Mages' Guild's counter rather than a shelf, and a rare library roll) and the priests' topic, word for word. The niche waits on the look builder's recess (backlog A).* *Drafted 28 Sep 2026. Backlog A, Lore objects: the Guest lorebook, defaced niches, and the Church's line on the Guest. (The sigil-lore books are the other half of that line and are left for another run.)*

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

*Approved by Michael, 14 Oct 2026.* *The rule is on main (the systems builder's night watch, Session 1112, with §4's narration word for word). Built in part, Session 1338 (PR #640): §1 and §6 (the Captain's* The spire?*, the turn-in), §7 (Rowe at the seat, the rumours). The rumour for "any town of the Mark" is given to the Mark's other towns, and the seat keeps its own. Built whole in words, Session 1387 (PR #690): the night sergeant (§2), the roof and the stone (§3), Rowe's morning (§5). The sergeant's refusal does not bar the door; the lock is the systems builder's (backlog A).* *Drafted 1 Oct 2026. Backlog A, the faction line's last owed item: "the spire to hold after the League's finale". The League's ninth service now ends with the Captain of Caer Slige saying "the spire's yours to hold. Something up there pays my sergeants in light", and Rowe, spared, saying "You hold it, and I'll watch what comes down off it at night." Nothing in the game yet lets the player do either. This draft is what holding it means.*

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

*Approved by Michael, 14 Oct 2026.* *Built, Session 1030; on main 17 Oct.* *Drafted 2 Oct 2026. Backlog A, consequence hooks: "someone says one of the three descriptions to you and goes back to their bread" in the open ending. Canon §11, the third path: "once in a long while someone says one of the three descriptions to the player and goes back to their bread; Varek is seen, at a distance, at fields." The build already ends that way (`ending('open')` sets `worldState.knowing`, saved and loaded since Session 242), and the ending screen promises it: "Once in a long while, someone will say one of the three descriptions to you, and go back to their bread." Nothing reads `knowing` yet. This draft is what reads it.*

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

*Approved by Michael, 14 Oct 2026.* *Built in part, Session 1092 (18 Oct), on auto/quests-build: the treatise sold by the Mages' Guild head (the follow reads* Is it written down? (Buy On the Seals, 40 gold)*), the sheet given once by the Fighters' Guild head, the glossary as a rare library roll, every line word for word. The glossary's shelf copy waits on a shelf pick-up (backlog A, systems).* *Drafted 3 Oct 2026. Backlog A, Lore objects: the sigil-lore books in the guilds (the other half of the line *The Seventh Niche* took).*

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

*Approved by Michael, 14 Oct 2026.* *Drafted 4 Oct 2026. Backlog A, consequence hooks: Varek's list found in the first gate after the unbound ending (canon §11).*

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

*Approved by Michael, 14 Oct 2026.* *Built, Session 1432 (PR #729), word for word: `firstWords` and its four tables in `87-world-quests.js`, the trade's line from `makeDef`. The pious temper (§4) was already on main (Finding 18). §5's rule was the systems builder's, Session 586.* Owed to Michael's control-room note of 5 Oct (backlog A, *Dialogue still stiff, greetings too expository*): *"There's too much exposition when greeting you ('You're a markmen? those people kill bears at 10!') — should be more subtle intros, like 'Greetings, Markman.' Or 'What is it?'"* This draft rebuilds the generated townsperson's greeting. The named cast, the lords, the guild heads, the guards with a fine to read, Rowe and the feast days keep their own lines.

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

*Unapproved.* Michael answered DECISION #214 on 9 Oct: **A**, the maker's shape, *an Fíodóir Folamh*, the Empty Weaver; the lines marked *#214 A* below are the ones that stand. Backlog A: *The Root's cavern wants authored rooms (a set piece at the root itself), not only the* deep *generator.* Today the Root (seed 9001, `build()` in `87-world-quests.js`) is a large `deep` cavern from the generator, with a renamed Ogre as its master and a hoard of gold and a sword. When the master dies, Varek appears outside, at the mouth (`onLeavePortal`, `tickRoot`, `88-world-ticks.js`). This draft keeps the generator for the first floor, the way down, and makes the lowest floor six authored rooms in a line: the place where the loom was made, the count it kept, what the count was of, the day the makers stopped, and the glass. Varek stands in the last room and not at the mouth. His question reads the player's real pause. The guard is DECISION #214. The draft writes it for A and marks the lines that depend on it.

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

---

## Asked in Passing — six townsfolk's errands

*Approved by Michael, 14 Oct 2026.* *Building: the frame and errand 3, A Fever, Session 1510 (PR #817, on main 28 Oct), word for word but for two plain fixes: only a giver with children asks for a fever (the offer says* My youngest*), and the giver answers* I’ll do it. *with the people's line added to the shared table below. Errand 1, The Unanswered Letter, Session 1554 (PR #868), word for word; the resident on* there *has no line, so the topic is left off there and the addressee is marked at their door, and the hand-off to errand 4 on* dead *waits for errand 4.* *Errand 5, The Debt, Session 1677 (PR #970), word for word, with the debtor's answer to* Keep it *added (the draft had none): Gatelander "Tell them I'll pay at the harvest, so, and it'll be true." · Markman "Aye. Owe you one, then." · Aurennais "Then I owe you a discretion, Master. It is the dearer debt." · Old Blood "Good."* *Errand 4, Say the Name at the Door, Session 1600, word for word, with the hand-off from errand 1. One plain fix: a Markman asks only with no spouse in their bio, since a townsperson with one answers* Married to {spouse} *in the same conversation.* The first piece of Michael's control-room note of 5 Oct (backlog A, *Questing, a big effort pass*): *"we also need to add probably 50–100 somewhat unique quests. We can probably generalize these and make it so that these can be recycled in different areas, but I want quests to be something far more likely to stumble upon / something that will incentivize players to talk to NPCs."* Today every town job comes from the lord (`townQuestFor`, `87-world-quests.js`: cull, retrieve, deliver, find, road) and every guild task from a guild head. The people in the street give nothing. This draft gives them six errands, each a template that recycles across every town, trade and people, each with a choice or a clock that the world remembers. Six templates × the twelve trades that can give them × four peoples × the towns they point at is the variety the note asks for; a second run can add six more on the same frame.

### What the canon fixes, and where it is silent

- The speech row of §2 for each people; the greeting is short and never an opinion (*First Words*, this file, and Michael's note on exposition).
- §12: *`favor[siteId]` ±1 per quest done*. The errands spend favour in both directions, at the giver's town and at the town they send you to.
- §3.1: *the three peoples were told their dead held the world*; *the Church blesses the dead into the gates*. Errand 4 is that custom, done by ordinary people, and the player may know what it is for.
- §1.2 and §1.3: the Mark scorns priests and ledgers; the Compact keeps paper over oaths. The debt (errand 5) reads differently in each.
- *Silent:* whether ordinary townsfolk give work at all; whether anyone in the street dies in a side errand. The plainer choices: they do, small work for small pay; and nobody dies on screen or by the player's lateness. The letter's addressee may be dead already, which is the only death here, and it happened before you came.

### The frame (all six)

- **Who offers.** A generated townsperson (`makeDef`), not a lord, guard on duty, guild head or named cast. About one in five has an errand on any game-week, rolled on `seededRng('errand', site.id+':'+def.name+':'+week)` (co-op rules: a roll that decides an outcome is seeded by place and id). The errand's template is chosen from those their trade allows (table under each errand). One errand open per giver.
- **How you find it.** Two ways, both small. The greeting gets one more short line after *First Words* (the *hint*, below), only while an errand is on offer and only on the second meeting or later, or the first if the player has already asked *What do you do here?*. And the *you* folder gets one topic, the *ask* label, which is in the player's voice and names nothing the player could not have heard. The giver's existing topics change nothing; `bio.worry` and `bio.wish` choose the errand where they fit (noted under each), so a player who listened is rewarded with the errand that follows from it.
- **What it pays.** Small: 15–40 gold by tier, less than a lord's job, and a point of the giver's town's favour. Errands 2 and 5 can cost you instead.
- **The ids.** `er:<site>:<giver name>:<n>`, `n` the count of errands that giver has given (co-op rules: place and index, never a position or a `Date.now()`). Each errand is a quest record in `QJ()` with `kind:'errand'` and `sub:` one of `letter`, `borrowed`, `fever`, `name`, `debt`, `watch`; the giver's later lines read the record by id, so nothing new is needed in `worldState` (and so nothing new in the S242 list or `SS_CHAR_WS`).
- **Shared lines** (every errand; *Not yet* is the reply to *About that errand* while it is open, *Not now* to the player's decline):

| | Not now (the player declines) | Not yet | Done, paid |
|---|---|---|---|
| **Gatelander** | "A thing asked isn't a thing owed. Another day, maybe." | "The day's long yet, and so's the road." | "Weaver keep you. That's off my mind, and here's for your trouble." |
| **Markman** | "Aye. Someone else, then." | "Not done, then. Off you go." | "Good. Here. We're square." |
| **Aurennais** | "Of course, Master. The offer stands until it is taken up elsewhere." | "When it is done, Master, and not before. The terms are as they were." | "Done as agreed, Master. Your fee, and my thanks besides." |
| **Old Blood** | "Then not." | "Not yet." | "Good. Take this." |

*Added in the build (S1510), the giver's answer to* I’ll do it.*: Gatelander "Go on, so, and mind the road home." · Markman "Good. Go." · Aurennais "Then we are agreed, Master." · Old Blood "Go."*

The player's labels: **ask** (per errand, below); **I'll do it.** · **Not now.** · **About that errand.** · and the errand's own choices.

---

### 1. The Unanswered Letter

*Trades:* any. *Chosen first when* `bio.wish` is *to hear from my daughter* or `bio.worry` is *my brother went for a soldier and never wrote* (Finding 24's line). The addressee is the daughter or the brother then; otherwise a sister or an old friend.

**Shape.** The giver has written to someone in another town (a site of 45 pad or more within 900, as the lord's letter picks) and had no answer. Take the letter; ask after the addressee there. One of three things is true, rolled on the errand's id: *there, and will not write* · *gone* (to sea, to the Mark's iron, to Aurenne's ships) · *dead*, a season since. You learn it from the first resident you ask (any generated townsperson at the target site gets the topic *I've a letter for {name}.* while the errand is open). Then the choice is on the way home: what you tell the giver.

**The hint** (in the greeting):
- Gatelander: "No post on the road today, I suppose."
- Markman: "Carter come through? No. Didn't think so."
- Aurennais: "You have not, by chance, passed a courier on the road, Master?"
- Old Blood: "Nothing came today."

**Ask:** *You're waiting on word from someone?*

**The offer.**
- Gatelander: "My {daughter} is in {town}, {direction} of here. Three letters I've sent, and the silence back is heavier than any of them. A letter in the hand gets read where one in the post gets lost. Would you carry it, and look at her while she reads it?"
- Markman: "{Brother}. In {town}, {direction}. Wrote him twice. Nothing. Take this to him. Put it in his hand and see what his face does."
- Aurennais: "My {daughter} is at {town}, Master, {direction} of here. I have written three times, and I would rather be told no than told nothing. If you would put this into her hands, I will pay as for a courier, and a little over for the distance."
- Old Blood: "{Name}. At {town}. {Direction}. This is for them. I want to know they read it."

**At the target town**, the resident asked (*I've a letter for {name}.*), by the resident's people and what is true:

*There, and will not write.* The addressee is spawned at their house door (`spawnNPC`, the lost person's machinery) and says one line, then nothing:
- Gatelander: "Leave it on the sill. I'll read it when I'm able, and I'm not able."
- Markman: "Aye. I know what it says. Tell them I'm well. That's all they're getting."
- Aurennais: "Thank you. I will read it, Master. I cannot promise an answer, and I would rather not promise what I cannot keep."
- Old Blood: "I know the hand. Thank you. No answer."

*Gone.* The resident:
- Gatelander: "{Name}? Gone a month, on a boat out of the harbour. Where to, the sea knows, and the sea's not saying."
- Markman: "Gone. Signed on with a captain for the iron in the ranges. Won't be back before the thaw."
- Aurennais: "{Name} left us in the spring, Master, on a contract with one of the houses. A ship to the south, I believe. The house may have an address; I do not."
- Old Blood: "Gone. To the water."

*Dead.* The resident:
- Gatelander: "Ah, the creature. We buried {name} at the turn of the season. A fever, and quick. Nobody knew who to write to. The Weaver forgive us, we should have asked."
- Markman: "Dead. Fever, spring. We burned the bed and put {him} in the ground. Nobody knew there was anyone to tell."
- Aurennais: "I am sorry to be the one, Master. {Name} died this spring, of a fever. The Prior saw to it, and {his} name was taken to the gate. We did not know there was family to write to."
- Old Blood: "Dead. The spring. They took the name to the door."

The letter stays in your bag (`type:'letter'`, a misc item, weight 0) in every case except the first.

**Back at the giver.** The labels, by what you learned:
- *There, and will not write:* **{Name} read it.** (the truth) · **{Name} sends love. A letter's coming.** (a lie)
- *Gone:* **{Name}'s gone to sea.** (the truth) · **{Name} sends love. A letter's coming.** (a lie)
- *Dead:* **{Name} died this spring.** (the truth) · **{Name} sends love. A letter's coming.** (a lie)

The truth, by the giver's people (the line for *will not write* / *gone* / *dead*):
- Gatelander: "Read it, and kept the answer. Well. A door shut is still a door; it can be knocked on." / "The sea owns them twice a day, and some days it keeps them. I'll write to the harbour, so." / "…Ah. Ah, Weaver. I'd a feeling. You don't get a feeling for nothing. Thank you for not dressing it."
- Markman: "Read it and said nothing. That's him. Aye. That's him." / "The iron. Should have guessed. He'll write when he's drunk enough." / "Dead. Right. …Right. You told it straight. Good."
- Aurennais: "Then it was delivered, Master, and the rest is not your account. Thank you." / "Then I will write to the house that holds the contract. They keep addresses. They keep everything." / "Then I was writing to no one. Forgive me, Master. Thank you for the plain words. They are the only kind I could take."
- Old Blood: "Read it. Good." / "The water has them, then." / "Dead. I knew. I wanted it said."

The lie, any case:
- Gatelander: "A letter coming! There, now. Didn't I say a hand-carried letter gets read? Weaver keep you."
- Markman: "Ha. About time. Good."
- Aurennais: "Then I have worried for nothing, Master, and I am glad to have paid for the news."
- Old Blood: "…Good."

**What it changes.**
- Pay as the shared table, either way. The truth, on *dead*: the giver offers errand 4 (*Say {name} at the door*) at once, for the addressee. That errand is how the truth is paid for.
- The lie is remembered (`q.told='lie'` on the record). From the next game-week the giver's *Again* greeting is, one time in two, the waiting line:
  - Gatelander: "Nothing yet. The roads are slow this time of year."
  - Markman: "Nothing yet. He'll write."
  - Aurennais: "No letter yet, Master. I expect the courier is delayed."
  - Old Blood: "Nothing yet."
  After four game-weeks the giver gives an errand 1 again for the same addressee: a second letter. The player can carry it and tell the truth then, or lie again. (On *dead*, the second telling is the giver's *dead* line, with *You knew. You knew last time.* first, in their people's form: Gatelander *"You knew. You knew the last time."*, Markman *"You knew. Last time. You knew."*, Aurennais *"You knew, Master, when you were last here."*, Old Blood *"You knew."*)

---

### 2. The Borrowed Thing

*Trades and the thing:* farmer, the plough-iron · weaver, the warping-frame · cooper, the croze · fisher, the long net · shepherd, the good shears · thatcher, the leggett · carter, the spare wheel · beekeeper, the smoker · midwife, the birthing stool · net-mender, the netting needles · smith, the swage block · any other, the long ladder.

**Shape.** Someone in a town within 700 borrowed the giver's {thing} and has not brought it back. Ask for it. The borrower (spawned at their door, named on the errand) has one of two reasons, rolled on the errand's id: they *need it yet*, or they *sold it*. Then the choice.

**The hint:**
- Gatelander: "A good {thing} is missed most when it's lent."
- Markman: "Haven't got my {thing}. Annoys me."
- Aurennais: "I find myself without my {thing}, Master. A loan, overdue."
- Old Blood: "My {thing} is not here."

**Ask:** *Something of yours gone missing?*

**The offer.**
- Gatelander: "{Borrower}, over in {town}, had the lend of my {thing} at the back end of last year. A lend's a lend, but a year is a gift, and I never gave it. Would you put them in mind of it? Kindly, now."
- Markman: "{Borrower}. {Town}. Took my {thing} in the autumn. Said a week. Get it back."
- Aurennais: "I lent my {thing} to {Borrower} of {town}, Master, on a handshake, which was my error. There was no term set. I would like it returned, or its value."
- Old Blood: "{Borrower}. {Town}. They have my {thing}. Bring it."

**The borrower** (*{Giver} wants the {thing} back.*):

*Needs it yet.*
- Gatelander: "Ah, now. I'll not say it's not theirs. But the {work} is half done and there's no doing the half without it. Another month, and I'll carry it back myself and a cake with it."
- Markman: "Aye, I've got it. Using it. Two weeks more and they'll have it back. Tell them that."
- Aurennais: "I have it, Master, and I do not dispute the debt. I would ask an extension, a month, on the same terms. The work is contracted and I cannot finish it without."
- Old Blood: "I have it. I am using it. A month."

*Sold it.*
- Gatelander: "…I sold it. Winter was long and the children were longer. I've {n} gold of what it fetched. Take that, and my shame with it, and tell them I'm sorry."
- Markman: "Sold it. Needed the coin. Here's what I got for it. {n} gold. Not all of it, but most."
- Aurennais: "I must be candid, Master. It was sold, in a bad month. I can offer {n} gold toward its value now, and the balance by the season's end."
- Old Blood: "Sold. Here is the coin."

The labels: *Needs it yet* → **Hand it over. It's not yours.** · **Keep it a month. I'll tell them.** *Sold it* → **I'll take the coin.** · **Keep it. You need it more.**

**What it changes.**
- *Hand it over:* you carry the {thing} back (a misc item); full pay; the borrower's town −1 favour. The borrower: Gatelander "Take it, so. And may you never need a thing you haven't got." · Markman "Fine. Take it." · Aurennais "As you say, Master. The debt is discharged." · Old Blood "Take it."
- *Keep it a month:* half pay; the borrower's town +1 favour; in 30 game-days the borrower walks it home (a line in the giver's greeting: Gatelander "{Borrower} brought back the {thing}, and a cake. A cake!" · Markman "Got my {thing} back. Took him long enough." · Aurennais "The {thing} was returned, Master, on the day. I was mistaken in {Borrower}." · Old Blood "It came back.").
- *I'll take the coin:* you carry {n} gold, which you can hand to the giver (*Here's what it sold for.*) or keep (the errand lapses, and the giver's town −1 favour when the 14 days are out: Gatelander "{Borrower} says you had the coin. I'd not have thought it of you." · Markman "Heard you took the coin. Heard you kept it." · Aurennais "I am told the sum was paid to you, Master. I have not received it." · Old Blood "You had the coin."). Handed over: full pay.
- *Keep it, you need it more:* no pay; the borrower's town +2 favour. The giver: Gatelander "Well. A kindness done with another's goods is still a kindness, I suppose. I'll get over it." · Markman "My {thing}. Your charity. Aye. Thanks for nothing." · Aurennais "That was not yours to forgive, Master. But it is done." · Old Blood "Then it is theirs."

---

### 3. A Fever

*Trades:* midwife, apothecary, priest, and any giver whose `bio.kids` > 0. A dated errand (the S457 machinery: `datedWork`, pay ×1.25 by the date, lapse after).

**Shape.** Someone in the house is down with a fever and the giver wants {n} of an herb that grows near (two to four of the region's herb, by biome: **Silverleaf** in the temperate woods, **Coldmoss** in the cold, **Ashwort** on the moor, **Goldenrod** on the roadsides, the nearest that `HERB_DEF` places within 500). By the date: full pay and a line. After: the lapse line, and from then the giver's *Again* line is colder for one game-week. Nobody dies: the fever breaks either way, and the lateness is what is remembered.

**The hint:**
- Gatelander: "Mind the door, there's sickness in the house."
- Markman: "Sick in the house. Keep your voice down."
- Aurennais: "Forgive me, Master. There is illness in the house; I am a little distracted."
- Old Blood: "Quiet. Someone is ill."

**Ask:** *Who's sick?*

**The offer.**
- Gatelander: "My youngest. A fever that won't break. My mother swore by {herb}, and I've none, and I can't leave the bed. It grows out {direction}, by the {place}. {n} of it, before {date}, and I'll owe you more than the coin."
- Markman: "Little one. Fever. Needs {herb}. {n} of them. Grows {direction}. Before {date}. Go."
- Aurennais: "My son, Master. A fever. The apothecary prescribes {herb}, and has none to sell me before the next ship. If you could bring {n}, by {date}, I would pay above the market, and gladly."
- Old Blood: "A child. A fever. {Herb}, {n} of it. It grows {direction}. Before {date}."

**Turned in by the date** (the bag holds {n}; they are taken):
- Gatelander: "There. There, now. Steep it and she'll sleep. The Weaver sent you, and I don't care who denies it."
- Markman: "Good. That'll do it. Here."
- Aurennais: "You have my thanks, Master, and more than the agreed sum. The account between us is in your favour."
- Old Blood: "Yes. That one. Good."

**After the date** (the lapse; the herbs are not taken):
- Gatelander: "It broke on its own, the third night. Keep them. They'll keep longer than a promise does."
- Markman: "Fever broke. No thanks to you. Keep them."
- Aurennais: "The fever broke without them, Master. Keep the herbs. The contract lapsed on the date; I would rather not discuss it further."
- Old Blood: "It broke. Keep them."

The colder *Again* line for a week: Gatelander "Yourself. Well." · Markman "You." · Aurennais "Master." · Old Blood "…"

---

### 4. Say the Name at the Door

*Trades:* any Gatelander or Aurennais giver; a Markman giver only if a widow or widower (`bio.spouse` set and the roll); **never** an Old Blood giver (below). Offered at once after the truth in errand 1, on *dead*.

**Shape.** The giver buried someone and wants the name said aloud at the door of the nearest old gate, so that the dead go into the stone and hold the world, as everyone has always been told (§3.1). Go to the nearest `CELL_DOOR` (the gate by name), stand at its door and press E: the prompt is *Say the name*. No foe, no loot; the walk is the errand. Pay is small (a Gatelander gives bread and 10 gold; an Aurennais the fee; a Markman nothing but a drink owed). It is the errand where the player who knows what the gates do (Varek's first beat onward, or an Old Blood player) knows what they have just done, and nobody in the street does.

**The hint:**
- Gatelander: "We buried {name} on {weekday}. The house is too quiet for itself."
- Markman: "Buried {name}. Last week. Don't say sorry."
- Aurennais: "You will forgive the black, Master. We buried {name} this week."
- Old Blood: *(none; the Old Blood never offer this errand)*

**Ask:** *Can I do anything for you?*

**The offer.**
- Gatelander: "There's one thing. The old custom: the name said at the door of the gate, so they go into the stone and hold up the rest of us. I can't walk that far now, and the priest only says it in the chapel. {Gate} is {direction} of here. Say '{name}' at the door for me. That's all. That's all it is."
- Markman: "Aye. One thing. My mother held with it: you say the name at a gate, they go in the stone. Priests want paying to say it. I'll not pay a priest. {Gate}. {Direction}. Say '{name}' there."
- Aurennais: "Perhaps one thing, Master. The Prior blessed {name} into the gate at the service, as is proper, but the custom of my family is that the name is also spoken at the door itself, by someone living. {Gate} lies {direction} of here. I would pay the usual fee."

**At the door** (E, *Say the name*). The log (`addLog('🕯', …)`) and a `showMsg`:
- Any player: *You say the name at the door of {gate}: {name}.*
- And then, if the player has had Varek's first beat or is Old Blood, a second line (a `showMsg` only, not the log, `#a8b8c8`): *The stone is warm under your hand. Then it is not.*

Nothing else. No one explains it.

**Back at the giver** (*I said the name.*):
- Gatelander: "Then {name}'s in the stone, and the stone's holding. Weaver keep {him}. Here, take the bread at least, and this."
- Markman: "Good. Done, then. I owe you a drink. Collect it."
- Aurennais: "Then it is properly done, Master, by the Church and by the family both. Your fee."

**Why no Old Blood giver.** §3.1: the Old Blood carry *the folk memory nobody can articulate*. One who is asked about it says so, in the *What do you make of …* folder's place, as one line to the player's *ask* when the Old Blood giver has a dead in the house (Old Blood: "We bury ours in the ground. Not at the doors. My grandmother would not say why. I do not either."). That line is the whole of the Old Blood's errand 4, and it pays nothing.

---

### 5. The Debt

*Trades:* innkeeper, trader, smith, cooper, carter; any Aurennais giver.

**Shape.** A man or woman in a town within 700 owes the giver {n} gold (30–80, by tier) for goods or drink or work. Collect it. The debtor (spawned at their door) is poor, rolled on the errand's id, for one of three reasons (a bad harvest, a lost boat, a sick parent). The choice, at the debtor's door: take it, pay it yourself, or let it go.

**The hint:**
- Gatelander: "There's money owed me that'll never walk here on its own."
- Markman: "Someone owes me. Annoys me more than the money."
- Aurennais: "There is an account outstanding, Master, that I would like to close."
- Old Blood: "I am owed."

**Ask:** *Who owes you?*

**The offer.**
- Gatelander: "{Debtor}, in {town}. {n} gold, for {goods}, since the spring. A debt's like a stone in the shoe: no weight at all, and you feel it every step. Get it from them and a fifth of it's yours."
- Markman: "{Debtor}. {Town}, {direction}. Owes me {n}. Get it. You keep a fifth."
- Aurennais: "{Debtor}, of {town}, owes this house {n} gold, Master, against {goods}. The note is here, witnessed. Collect it and a fifth is your commission; it is the standard rate."
- Old Blood: "{Debtor}. {Town}. {n} gold. A fifth is yours."

**The debtor** (*{Giver} sent me about the money.*), by the reason; one line each, by the debtor's people:
- Gatelander: "I know. I know it. The barley came up black this year and the {n} is the seed for next. If I give it you, there's no next. But it's theirs, and I'll not say it's not."
- Markman: "Aye. I owe it. Boat went down in the strait. Got this much left. Take it if you're taking it."
- Aurennais: "I acknowledge the debt, Master, and the note. My father is ill and the physician's account came first. I can pay it; I cannot pay it and him."
- Old Blood: "I owe it. I have it. I need it."

The labels: **Pay it. It's owed.** · **I'll pay it for you.** (costs {n}) · **Keep it. I'll tell them something.**

**What it changes.**
- *Pay it:* you carry {n}; turned in, a fifth is yours; the giver's town +1, the debtor's town −1. The debtor: Gatelander "There. And may it do them more good than it'd have done me." · Markman "There. Go." · Aurennais "Paid, Master. Witnessed, if they want it witnessed." · Old Blood "There."
- *I'll pay it for you:* {n} from your purse; turned in, the giver pays the fifth as if collected, and does not know; the debtor's town +2. The debtor: Gatelander "Why would you — no, don't tell me, I'd only argue. Weaver keep you, stranger." · Markman "Why? …Never mind. Aye. Thanks." · Aurennais "I am in your debt now, Master, and I do not know the terms. I will find them out." · Old Blood "I will remember the face." (For an Old Blood player: "I will try to remember the face.")
- *Keep it:* no pay; the debtor's town +1, the giver's −1. Back at the giver, the label is **They haven't got it.**: Gatelander "Haven't, or won't? No, don't answer that. I'll write it off, and I'll not be lending there again." · Markman "Then I'll go myself." · Aurennais "Then the note stands, Master, and I will put it in the hands of someone less sentimental." · Old Blood "Then they have not."

---

### 6. The Watch

*Trades:* shepherd, farmer, beekeeper, soldier off duty; any giver in a village or a camp (`site.kind` village, hermit_camp, outpost).

**Shape.** Something has been at the fold, the hives, the store. Sit the night by it: be within 25 of the place (the giver's lot, or the town's edge on the side of the nearest wild cell) from 22:00 until the morning bell at 05:00, game time (`gameTimeAbsMinutes`, never the frame count: the pause-proof rule). One time in two, rolled on the errand's id and the night, a pair of the region's cull beast (`townQuestFor`'s table) comes at 02:00; kill them. The other time nothing comes. Either way, at 05:00 the errand is done and the giver pays in the morning. Leaving the circle for more than a game-hour, or sleeping, lapses it.

**The hint:**
- Gatelander: "Lost another {beast} in the night. There'll be none left by the feast at this rate."
- Markman: "Something's at the {fold}. Nights. I sleep through it."
- Aurennais: "We have had losses at night, Master, and nobody willing to sit up."
- Old Blood: "Something comes at night."

**Ask:** *What's coming at night?*

**The offer.**
- Gatelander: "If I knew, I'd not need you. Something that's fond of {beast}. Sit up by the {fold} tonight, from the last light to the first bell, and if it comes, see it doesn't go home. I'll have breakfast and {n} gold waiting."
- Markman: "Don't know. Want you to find out. Sit up at the {fold}, dark to the bell. Kill it if it comes."
- Aurennais: "I could not say, Master. Sit the night at the {fold}, from ten until the morning bell, and whatever comes, deal with it. The fee is for the night; I do not pay by the carcass."
- Old Blood: "Sit by the {fold}. Dark to the bell. You will see."

At 22:00 in the circle, a `showMsg`: *You settle in by the {fold}.* At 02:00 if they come: *Something moves past the {fold}.* At 05:00: *The bell. The night is done.*

**Turned in, if they came** (*I sat the night. {Beasts}.*):
- Gatelander: "{Beasts}! I'd have said a fox. That's what comes of saying. Here, and eat."
- Markman: "Thought so. Good. Here."
- Aurennais: "Then the losses are explained, Master, and ended. Your fee."
- Old Blood: "Yes. Them."

**Turned in, if nothing came** (*I sat the night. Nothing came.*):
- Gatelander: "Nothing came, and nothing was lost. A quiet night's a night's work all the same. Here."
- Markman: "Nothing? Then it knew you were there. That's the job. Here."
- Aurennais: "Nothing, Master? Then the fee was well spent; the night was kept. Here."
- Old Blood: "It did not come. It saw you. Good."

**Lapsed** (you left the circle or slept):
- Gatelander: "Lost another, and you abed. Ah well. A watch kept asleep is a fence made of wishes."
- Markman: "Lost another. You weren't there."
- Aurennais: "We lost another in the night, Master. The fee was for the night entire."
- Old Blood: "It came. You were not there."

---

### What in the code would carry it

- **`87-world-quests.js`**, beside `townQuestFor`: an `ERRANDS` table keyed by `sub`, each entry the trades it allows, its `bio` preference, and its lines by people (`hint`, `offer`, and the turn-in lines by outcome); `errandFor(def,site)` rolls `seededRng('errand', site.id+':'+def.name+':'+week)` and returns the template or null; `errandTopics(def,site)` returns the *ask* topic (in `cat:'you'`), *About that errand.* while it is open, and the outcome labels when the record says the choice is due. The greeting getter in `makeDef`'s wrapper adds the `hint` after the *First Words* line, under the rule above.
- **The target's side.** Errands 1, 2 and 5 spawn one named person at the target town with `spawnNPC`, as `qTick` spawns the lost person for `find` (`def._lost` is not set; a `def._errand` points to the record, and `qOnTalk` opens the person's one topic). Errand 1's resident lines are a topic any generated townsperson at the target site carries while the record is open.
- **Errand 3** reads the bag (`BAG` by herb name) and is dated with `datedWork`, as a lord's job is. **Errand 4** adds a door prompt in the world's door interaction (`88-world-ticks.js`, where a `CELL_DOOR`'s E is handled) while a `name` record names that door's seed. **Errand 6** is a tick on the record against `gameTimeAbsMinutes`, the beasts spawned by `buildZoneEnemy` and keyed `er:…:foe:<k>` (co-op rules), the circle checked once a game-minute.
- **Favour** through `addFavor(site,±n)`, already the §12 hook. The record's `told`, `outcome` and `site` fields are all that later greetings read; nothing new in `worldState`.
- **Actions, by name** (co-op rules): `errandAccept`, `errandChoose(id, choice)`, `errandTurnIn(id)`.
- **The journal** gets each as a quest (`qJournal`), titled: *A letter for {name}* · *{Giver}'s {thing}* · *{Herb} for a fever* · *A name at {gate}* · *{Debtor}'s debt* · *A night at the {fold}*.

### Owed, and not drafted here

- Six more templates for a second run, on the same frame: a cart stuck on the road; a dog gone after a deer; a wedding wanting a fish from a named lake; a boy who went to look at a gate; a rubbing someone wants read and should not; a quarrel between two neighbours where both ask you.
- The Fighters' and Mages' heads could hand an errand on to a member of the public ("There's a woman in the square asking for a sword."), which is the easiest bridge from the guilds to the street.

---

## Asked in Passing, the second run — six more errands

*Approved by Michael, 14 Oct 2026.* The second piece of Michael's 5 Oct note (*50–100 somewhat unique quests … far more likely to stumble upon … incentivize players to talk to NPCs*), on the first run's frame exactly: the same givers (generated townsfolk, one errand in five a game-week, `seededRng('errand', site.id+':'+def.name+':'+week)`), the same *hint* in the greeting and *ask* in the *you* folder, the same shared lines (*Not now*, *Not yet*, *Done, paid*), the same ids (`er:<site>:<giver name>:<n>`) and the same small pay (15–40 gold by tier and a point of the giver's town's favour). The first run's last section listed six ideas for this one. Two of them changed on the way: *a dog gone after a deer* needs a dog and a deer, and the game has neither (a new creature is the look builder's, and the errand is not worth one), so it is replaced by **a prayer carried to a shrine**, on the shrines that exist; and *a fish from a named lake* became a fish from the sea, because `catchFish` (`86-world-crime.js`) catches only from the sea's schools. Every errand here runs on machinery the game already has.

The `sub` values: `cart`, `child`, `fish`, `rubbing`, `hedge`, `prayer`. Numbering continues from the first run.

### What the canon fixes, and where it is silent

- §2's speech row for each people, and *First Words* (this file): hints are short and never an opinion.
- §3.1: the Withdrawal *forbade the reading of sigils (touching is permitted; understanding is not)*; the Old Blood *keep the tongue and the tattoos and not the knowledge*. Errand 10 (the rubbing) is that law met in a kitchen.
- §3.3: an Old Blood *feels warm stones at a distance*. Errand 8's Old Blood child is why she went.
- Part I, *Three tiers of comprehension*: Impression, Comprehension (the English), Mastery (the true name). Errand 10's three readers give the three tiers, from the spell's own `nameIr`, `nameEn` and `nameMa` (`64-spells.js`).
- §1.2: the Mark settles disputes *by duel*; §1.3: the Compact keeps *paper over oaths*. Errand 11 (the hedge) ends differently in each.
- §4.1: the six gods and their domains, and the shrines that are theirs (`GODS`, `godOf`). Errand 12 is a prayer on another's behalf.
- §2.1: the coinages are mutual, about work, land and gods, and each is contradicted by a named person. Errand 11, in a port where the two neighbours are of two peoples, uses one each and has it contradicted on the spot.
- *Silent:* how the peoples marry, and whether a fish has anything to do with it. The plainer thing: a good fish on the wedding table is a coast's custom, the same in every nation, and only the reason each people gives for it differs. Nobody is hurt in any errand here; the child at the gate comes home whatever you choose.

---

### 7. The Stuck Cart

*Trades:* carter, farmer, trader, miller, cooper; givers in a village or town with a road out (`ROADS` has one ending at the site).

**Shape.** The giver's cart is in the ditch on the road out of town, between 150 and 300 units along it (the road quest's point, `rd.pts`, taken from the other end of the road from the bandit camp's). At the cart, E. Two ways to shift it: lift it (Might 5 or more), or unload it, lift it empty and load it again, which takes two game-hours (`advanceClock`, the named action). While you unload, if the road is not cleared (`roads[id].cleared`, §12), one time in three on the errand's id two of the road's bandits come up the road (`buildZoneEnemy`, keyed `er:…:foe:<k>`); kill them and the giver's town takes a point more. Then walk back. The cart is home before you are (it is gone from the road when you turn round).

**The hint:**
- Gatelander: "I'd a cart this morning. I've a ditch with a cart in it now."
- Markman: "Cart's in the ditch. Out the road."
- Aurennais: "My cart is in a ditch on the road, Master, with the day's goods in it."
- Old Blood: "The wain is in the ditch."

**Ask:** *Where's your cart?*

**The offer.**
- Gatelander: "Out the {direction} road, a half-hour on, nose down in the ditch where the road's gone soft. I'd the strength for it once. A cart's like a grudge: easy got into, hard got out of. Shift it for me and there's {n} gold in it."
- Markman: "{Direction} road. Half an hour out. Wheel's in the ditch and my back's done. Lift it. {n} gold."
- Aurennais: "On the {direction} road, Master, perhaps half an hour out. The wheel has gone into the ditch and the goods are owed in town by evening. If you could free it, {n} gold, and the goods can still be delivered as contracted."
- Old Blood: "The {direction} road. A half-hour. Lift it out. {n} gold."

**At the cart.** The prompt: *Press 'E' to see to the cart.* Then the labels, in a small panel (the barber's chair slip or a dialogue with no speaker):
- **Lift it.** With Might 5 or more: `showMsg` *You get your shoulder under the bed and heave. The wheel comes up out of the ditch.* Under 5: *It does not shift.*, and the label stays.
- **Unload it, lift it, load it again.** Always: *Two hours, sack by sack. The cart comes out light, and goes back heavy.* (the clock moves on two hours; the bandits, if they come, arrive in the first.)

If the bandits come: *Someone is coming up the road.*

**Turned in** (*Your cart's out of the ditch.*):
- Gatelander: "So it is, and on its four wheels and not three. Here, and the Weaver keep your back."
- Markman: "Saw it come in. Good. Here."
- Aurennais: "It arrived an hour ago, Master, with the goods entire. Your fee, as agreed."
- Old Blood: "The wain came home. Good."

**Turned in, if the bandits came and were killed** (one line more, after the paid line):
- Gatelander: "And them on the road that came at you — I'll not ask. A road's only as safe as the last one to walk it."
- Markman: "Heard about the road. Good work. Drinks are on me, if I'm there."
- Aurennais: "And I understand the road was cleared of a certain difficulty. The town is in your debt, Master, and so am I."
- Old Blood: "The road is quieter."

**Lapsed** (14 days, as every errand):
- Gatelander: "My cousin came with the ox in the end. An ox doesn't promise; it just pulls."
- Markman: "Got it out myself. Took the day."
- Aurennais: "The cart was recovered by other means, Master. The goods were late; I paid the penalty."
- Old Blood: "It is out. Not by you."

---

### 8. The Child at the Gate

*Trades:* any giver with `bio.kids` > 0, in a village or town with an old gate within 700 (`nearDoors(site,700)`). The child is a son or a daughter, rolled on the errand's id, of the giver's people, named from the town's bank.

**Shape.** The child went off this morning to look at the nearest old gate and has not come back. Nobody is hurt. Go to the gate: the child stands at its door, spawned when you come within 200 (the `find` errand's machinery, `qTick`). The child says one thing and then the choice: bring them straight home, or let them show you what they found first. If the gate is a sigil gate, *show me* stars it on your map (as a rubbing does, `worldState.rubbings[seed]`), and the child says why it is the warm one. Either way they walk home behind you (`WAY.follow`'s machinery, the lord's walk), and the giver pays.

**The hint:**
- Gatelander: "If you see a child on the road with more nerve than sense, it's mine."
- Markman: "My boy's not back. He's not lost. He's just not back."
- Aurennais: "Forgive me, Master. My daughter has not come home, and I am trying not to look at the road."
- Old Blood: "My child went to the door."

**Ask:** *Who's not back?*

**The offer.**
- Gatelander: "{Child}. Gone off to look at {gate}, {direction} of here, for no reason but that I said not to. A child told 'don't' hears 'go and see'. Bring {him} home to me by the ear, and I'll pay you {n} and give {him} the scolding."
- Markman: "{Child}. Went to look at {gate}. {Direction}. Bring {him} back. {n} gold, and I'll see to the rest."
- Aurennais: "{Child}, Master. {He} has gone to look at {gate}, {direction} of here, against every instruction. I would go myself, but there is no one else to keep the house. {n} gold for {his} safe return; I will not pretend I would bargain over it."
- Old Blood: "{Child}. {He} went to {gate}. {Direction}. {He} felt it from here. Bring {him} home. {n} gold."

**The child at the door** (*Your {mother|father} wants you home.*), by the child's people:
- Gatelander: "I was only looking. You can look without touching. I touched it a bit."
- Markman: "I'm not scared of it. I'm not. I was just about to go in."
- Aurennais: "I was making a drawing of it, for the archive. Somebody ought to. Nobody has drawn this one."
- Old Blood: "It is warm. I could feel it from the road. I wanted to see why."

The labels: **Home. Now.** · **Show me what you found, then home.**

*Show me* (the child's line, then a `showMsg`). If the gate has a sigil:
- Gatelander: "Here, put your hand there. Feel it? It's warmer than the rest. Gran says that's the dead keeping it warm."
- Markman: "This bit. Here. It's warm. Stone's not meant to be warm."
- Aurennais: "This mark here, Master. The stone is warm under it. I have made a note."
- Old Blood: "This one. Not the others. This one is awake."
and *{Gate} is marked on your map.*

If it has none:
- Gatelander: "There's nothing. I thought there'd be something. It's only an old door."
- Markman: "Nothing. Just stone. Waste of a morning."
- Aurennais: "There is nothing remarkable, Master. I have made a note of that as well."
- Old Blood: "It is cold. This one is asleep."

**Turned in** (*{Child} is home.*). The giver, by what you chose:

*Home, now:*
- Gatelander: "Look at the state of {him}. There, now. Here's your {n}, and here's my thanks, which is worth more and weighs less."
- Markman: "Good. Here. {He}'ll be up to something else by tomorrow."
- Aurennais: "Thank you, Master. Your fee. {He} will be kept indoors until {he} can recite the reasons."
- Old Blood: "Home. Good. Take this."

*Show me, then home* (the child has told):
- Gatelander: "{He} says you let {him} show you the stone. Well. Better you than nobody, and better nobody than {him} alone. Here."
- Markman: "{He} says you went and looked with {him}. Ha. Fine. Here."
- Aurennais: "I am told the excursion was extended, Master. I will not ask on whose authority. Your fee."
- Old Blood: "{He} showed you. Then you know where it is. Do not take {him} back."

**What it changes.** *Home, now:* full pay and the giver's town +1. *Show me:* full pay, no favour, and the gate starred if it has a sigil. An Old Blood giver's child, shown, adds nothing more; the Old Blood parent's *Do not take {him} back* is the whole of it.

**Lapsed** (the child walks home on the third day):
- Gatelander: "{He} came home on {his} own, the third day, hungry and pleased with {him}self. No thanks to anyone."
- Markman: "Came back on {his} own. Hungry. Fine."
- Aurennais: "{He} returned unaided, Master. We have discussed it."
- Old Blood: "{He} came back."

---

### 9. A Fish for the Wedding

*Trades:* fisher, innkeeper, cook, any giver whose `bio.spouse` is unset and whose roll says a wedding (a son or daughter's, or their own); givers in a port or a town within 400 of the sea. A dated errand (`datedWork`): the wedding is on the date.

**Shape.** The wedding table wants a fine fish, and the boats have brought in only ordinary ones. Bring a *Fine* catch (any bag item whose name begins *Fine* and whose `_typeKey` is `fish`: one catch in eight, `catchFish`, from the sea's schools) by the date. A plain fish is taken too, for half pay and a smaller line. By the date with a Fine fish: full pay, and on the wedding day the giver's town's square is full (the feast-square rule, Session 554, for one day and one town), the inn's meal is the house's for you that day (the feasts' rule, Session 550), and the giver greets you with the wedding line. After the date: the lapse.

**The hint:**
- Gatelander: "A wedding in the house, and not a decent fish on the coast."
- Markman: "Wedding on {weekday}. No fish worth the name."
- Aurennais: "We are marrying {name} on {weekday}, Master, and the table is not yet what it ought to be."
- Old Blood: "There is a handfasting. There is no fish."

**Ask:** *What's the wedding missing?*

**The offer.**
- Gatelander: "A fish on the table, a fine one, for the Sea's luck. It's how my mother was married and hers. The boats bring in what the sea gives them, and this week it's giving sprats. Bring me a fine one by {date} and you'll eat at the wedding, and {n} gold besides."
- Markman: "A big fish. For the table. The custom. Boats got nothing. Bring one by {date}. {n} gold and a seat."
- Aurennais: "A fine fish, Master, the centrepiece of the table. The guests will expect one, and the family on the other side will notice its absence; there was a great deal of discussion about the dowry. By {date}, {n} gold and a place at the table."
- Old Blood: "A fish from the sea. A large one. For the handfasting. By {date}. {n} gold."

**Turned in by the date, a Fine fish** (*A fine {fish}, for the table.*):
- Gatelander: "Would you look at that. That's a fish with a past. The Sea's smiled on it and on us. {n}, and come on {weekday}, and eat."
- Markman: "That's a fish. Good. Here. Come and drink."
- Aurennais: "That is entirely satisfactory, Master. More than. Your fee, and your place at the table is kept."
- Old Blood: "Good. That one. Come."

**Turned in by the date, a plain fish** (*It's not a fine one. It's what I could get.*):
- Gatelander: "A fish is a fish, and a wedding's a wedding. We'll lay a sprig of something by it and nobody'll be the wiser. Here's half, and no hard feelings."
- Markman: "Small. It'll do. Half."
- Aurennais: "It will serve, Master, if presented well. Half the agreed fee, as the terms were for a fine one."
- Old Blood: "It is a fish. Half."

**On the wedding day** (the giver's greeting, if the fine fish was brought):
- Gatelander: "Come in, come in. They're married, the fish is eaten, and the Weaver can see we did it right."
- Markman: "They're wed. Drink. That's all a wedding is."
- Aurennais: "You honour us, Master. The contract is signed and the table was everything it ought to have been."
- Old Blood: "They are joined. Eat."

**Lapsed:**
- Gatelander: "We married them with a ham on the table. The Sea'll forgive a ham. I'm less sure I will."
- Markman: "Wedding's done. No fish. Fine."
- Aurennais: "The wedding was held without it, Master. It was remarked upon."
- Old Blood: "It is done. No fish."

---

### 10. A Rubbing to Be Read

*Trades:* any; the giver had a parent or grandparent who went into the gates. The rubbing is of the nearest sigil gate within 900 (`nearestSigilDoorFrom`), its sigil's spell read from `SPELLS` by the gate's seed.

**Shape.** The giver has an old rubbing of a carving from a gate, made by a grandparent who went in, and has never known what it says. They want it read. Three readers, any of them:
1. **The Mages' Guild head** in the nearest town with a guild. They read it as the institution reads: the English (`nameEn`, Comprehension).
2. **An Old Blood townsperson** (any generated resident with `people:'oldblood'` within 900; ports and hill towns have them). They say the word and its plain sense in the tongue, and then ask you to tell the giver to burn it. They will say no more.
3. **You**, if you have touched that gate's sigil: at your tier for that spell, the Irish (Impression), the English (Comprehension), or the true name (Mastery, `nameMa`).

Then the choice is what you tell the giver: one of the readings you have, or *Nobody could read it*, or the Old Blood's advice to burn it. The rubbing stays with the giver unless they are told to burn it, in which case they give it to you (it is a `rubbing` item and stars the gate when used, `62-actions.js`).

**The hint:**
- Gatelander: "My grandfather left me a drawing off a gate wall, and no word of what's on it."
- Markman: "Got a rubbing off a gate. Can't read it. Nobody can."
- Aurennais: "I have a rubbing, Master, from my grandmother's time, which no one in this town has been able to read."
- Old Blood: *(none; an Old Blood giver does not offer this errand)*

**Ask:** *What does the rubbing say?*

**The offer.**
- Gatelander: "That's the question, isn't it. My grandfather went down {gate} three times and came up with this and a limp. He'd say 'it's a word' and no more. A word's no use folded in a drawer. Find someone who can read it, and tell me what he kept. {n} gold."
- Markman: "Grandad went down {gate}. Came back with this. Said it was a word. Never said which. Find out. {n}."
- Aurennais: "It was made in {gate}, Master, by my grandmother, who was in the trade before the trade was licensed. The family has always assumed it is a blessing. I should like to know, and to know it from someone qualified. {n} gold for a reading."

You are given *{Giver}'s rubbing* (a misc item, not a `rubbing`: it marks nothing while it is theirs).

**The Mages' Guild head** (*Can you read this?*, while the errand is open), by the head's people:
- Gatelander: "I can, after a fashion. That stroke's the root and that's the turn. In the Guild's tongue it's '{nameEn}'. That's what it does; what it means is another matter, and not one we teach."
- Markman: "Aye. '{nameEn}'. That's what it does. That's all the Guild reads in it."
- Aurennais: "Certainly, Master. The Guild's reading is '{nameEn}'. It is a common enough form; we have it catalogued. Anything beyond the gloss is not the Guild's to give."
- Old Blood: "The Guild reads it '{nameEn}'. I am the Guild here. I read it no further."

**An Old Blood townsperson** (*Can you read this?*):
- "{nameIr}. It means {sense}." *(a short pause, a `showMsg` only: They fold the paper and hand it back.)* "That is all it says to me. That should be all it says to you. Tell them to put it in the fire."

`{sense}` is the plain meaning of the word, from a small table beside `SPELLS` (the canon's *Meaning* column where it has one): Caor *a spark*; Sioc *frost*; Leigheas *a cure*; Séideán *a gust of breath*; Smól *the last of an ember*; Cloch Ghéar *a sharp stone*; Solas Gheal *a bright light*; Slán *whole, and goodbye*; Tintreach *lightning*; Scáth *a shadow, a shelter*; Reo *held fast in ice*; Gaoth *wind*; Cloch *stone*; Dorcha *the dark before morning*; Bás *death, the flat of the hand*; Tonn *a wave*; Éan *a bird*; Fréamh *a root*; Loscadh *a burning of the land*; Aiséirí *rising again*; Dul Thart *going past*. A word not in the table: *"It is an old word. I know it. I will not say it."*

**You** (a `showMsg` when you look at the rubbing with the errand open and that sigil touched): Impression *You know the shape. {nameIr}. No more than that.* · Comprehension *{nameIr}: {nameEn}.* · Mastery *{nameIr}. {nameEn}. And under that, {nameMa}.*

**Back at the giver.** The labels, each only if you have it:
- **The Guild reads it "{nameEn}".**
- **It's an old word. It means "{sense}".** (from an Old Blood reader)
- **It says "{nameMa}".** (your own Mastery)
- **Nobody could read it.**
- **I was told to tell you to burn it.** (from an Old Blood reader)

The giver, by their people, to each:

*The Guild's reading:*
- Gatelander: "'{nameEn}'. Is that all. Three trips down a gate for a word you'd find in a book. Well, it's his word, and now it's mine. Here."
- Markman: "'{nameEn}'. Huh. Thought it'd be more. Here."
- Aurennais: "'{nameEn}'. Then it is catalogued, Master, and the family's question is answered as far as a qualified reader can answer it. Your fee."

*The old word:*
- Gatelander: "'{sense}'. Say it again. …He used to say that, at the door going out. I never knew it was off a wall. Here, and thank you."
- Markman: "'{sense}'. That's it? …He'd say something like that. Here."
- Aurennais: "'{sense}'. That is not what the Guild's catalogue would say, I think. But I believe it, Master, and I could not tell you why. Your fee."

*Your own Mastery:*
- Gatelander: "'{nameMa}'. That's a name and not a word. You said it like you'd been told it. I'll not ask who told you. Here."
- Markman: "'{nameMa}'. Never heard it. You say it like you know. Here."
- Aurennais: "'{nameMa}'. No catalogue I know of has that, Master. I am not sure whether I have bought a reading or been given one. Your fee, in any case."

*Nobody could read it:*
- Gatelander: "Ah, well. Some things are kept by being lost. Thank you for trying. Here's half."
- Markman: "Thought so. Half for the walk."
- Aurennais: "Then it remains a family question, Master. Half the fee, for the effort."

*Burn it:*
- Gatelander: "Burn it. …Who'd say that? One of the cold-eyed, was it. My grandfather sat with one of them, the night before he went down the last time. You burn it, then. I haven't the hands for it." *(they give you the rubbing)*
- Markman: "Burn it? It's paper. Fine. You do it. I'll not." *(they give you the rubbing)*
- Aurennais: "I cannot be party to destroying a family document, Master. But I find I do not want it in the house. Take it. Do as you think right." *(they give you the rubbing)*

**What it changes.** Pay in full for a reading, half for *nobody could*, full for *burn it*. On *burn it* the giver gives you a `rubbing` item for that gate (`Rubbing: {gate}`); using it stars the gate, as a bought one does. Nothing in the game reads whether you burn it, and nothing should. The Old Blood reader's town +1 favour if you told the giver to burn it; the Guild's town +1 if you brought the Guild's reading.

---

### 11. The Hedge

*Givers:* two neighbours, each in a home on lots side by side (`lot.n` and `lot.n+1` in a row), both offering at once and both counting as one errand (`er:<site>:<first name>|<second name>:<n>`). Any trade.

**Shape.** The two are at odds over the line between their lots. What it is depends on the nation: in the Gatelands a hedge or a dry-stone wall, in the Mark a woodpile and a fence, in Aurenne the boundary in a deed and the use of a cistern. Ask either; each tells their side. Then go to either and give your judgement. In the Mark one more way is open: tell them to settle it at noon, on the square, with their fists. In Aurenne, one more: find the deed (the lord or the steward has the town's book; ask them for it, and the book says who is right, rolled on the errand's id). In a port where the two are of two peoples, each calls the other by a coinage (§2.1), and the turn-in has the other's grudging contradiction from the same table.

**The hint** (from either):
- Gatelander: "Good fences make good neighbours, they say. They never met mine."
- Markman: "Neighbour's a thief. Ask him. He'll lie."
- Aurennais: "There is a disagreement with the house next door, Master. A question of a boundary."
- Old Blood: "The mearing is wrong."

**Ask:** *What's the trouble with {neighbour}?*

**Their side.** Each says it of the other, by people (the thing named by the nation):
- Gatelander: "That {hedge} was my father's, and his father planted it, and {neighbour} has been cutting it back a yard a year since the frost. A yard's nothing. Thirty years is a field."
- Markman: "{Neighbour} stacks his wood on my side. Says the fence moved. Fences don't move. He moved it."
- Aurennais: "The deed gives this house the cistern on alternate days, Master. {Neighbour} draws every day and calls it a misunderstanding. I have the dates."
- Old Blood: "The mearing was here. {Neighbour} says there. It was here."

*In a port, two peoples,* one line each, said of the other: a Gatelander of a Markman *"Hill-dog. Thinks a fence is something you knock down to get to the argument."*; a Markman of a Gatelander *"Turf-cutter. A proverb for every yard he's stolen."*; an Aurennais of a Gatelander *"Gate-grubber. He would dig up the boundary stone if he thought it would sell."*; a Gatelander of an Aurennais *"Ledger. Won't lend you a bucket without a witness."*; a Markman of an Aurennais *"Tithe-man. He'd charge me for the shade off his roof."*; an Aurennais of a Markman *"The unlettered, Master. He settles a measurement with an axe."*

**Your judgement** (at either; the labels):
- **{A} is in the right.** · **{B} is in the right.** · **Split it down the middle.**
- In the Mark: **Settle it at noon, on the square.**
- In Aurenne: **Ask the {lord title} for the deed.** (then, at the lord, the label *I need to see the deed for {A} and {B}'s line.*, and the lord, an Aurennais: *"The book is quite clear, Master. The line favours {winner}. It has favoured {winner} since before either of them was born."*; and the errand turns in as if you had judged for {winner}.)

**Each side's answer, by outcome** (by their people):

*Found for:*
- Gatelander: "There. A wrong's not righted by saying it, but it's a start. Here's for your trouble."
- Markman: "Told you. Here."
- Aurennais: "Then the matter is settled on its merits, Master. Your fee."
- Old Blood: "Here. As I said."

*Found against:*
- Gatelander: "Is that how it is. Well, you've two eyes and I've a hedge. We'll see which lasts."
- Markman: "Iron and blood. Get out of my yard."
- Aurennais: "I disagree, Master, and will say so in writing. But I will abide by it."
- Old Blood: "It was here."

*Split:*
- Gatelander: "Half's better than none, and none's what I'd have got from {him}. Half your pay, from me."
- Markman: "Half. Fine. Half from me."
- Aurennais: "A compromise, Master. Neither of us is satisfied, which I am told is the mark of a fair one. Half the fee."
- Old Blood: "Half. Half from me."

*At noon (the Mark):* at 12:00 on the square the two meet (the duel's ring is not laid; they stand and fight with fists for a game-minute, a `showMsg` for the town: *{A} and {B} settle it on the square. {Winner} is still standing.*). Afterwards, both:
- the winner: "Settled. Here. You've sense."
- the loser: "Settled. He hits like a door. Here. You've sense."

*In a port, two peoples, at the turn-in,* the one found against says the other's contradiction from §2.1 before their line: a Gatelander of a Markman *"I'll say this for him: I'd walk any road with him."*; a Markman of a Gatelander *"He'd not leave a wounded man. I'll give him that."*; an Aurennais of a Gatelander *"Nobody keeps a field or a promise like him. That is the irritation of it."*; a Gatelander of an Aurennais *"Their ships come back, mind. Ours don't."*; a Markman of an Aurennais *"His steel's better than mine. He knows it."*; an Aurennais of a Markman *"If I wanted a thing done by nightfall, I would hire him. And pay him after."*

**What it changes.** Found for {A}: {A} pays in full; {A}'s favour counts for the town (+1); {B} −0, but {B}'s greeting is the *found against* line once, then the town's ordinary one. Split: half from each, the town +1. The noon fight: full pay from both, the town +1 (the Mark respects a quarrel finished by noon, §1.2). The deed: as for the winner, and no one argues with the book.

---

### 12. A Prayer Carried

*Givers:* any Gatelander; a Markman only for someone at sea or under the iron (An Mhuir, An Chloch); an Aurennais only to An Fíodóir, the Weaver (the Church's own name, §3.1); **never** an Old Blood giver (below). The god is chosen by what is wanted: someone at sea → **An Mhuir**; the harvest or the weather → **An Spéir**; a calving, a flock, a sick dog → **Na Beithígh**; someone gone into a gate or down a mine → **An Chloch**; a traveller on the road, a new shop → **An Teallach**; a birth, or the Aurennais giver's anything → **An Fíodóir**. The shrine is the nearest of that god within 1,200 (`godOf(site)` for each shrine site); if there is none, the next god by the same want that has one; if none at all, no errand.

**Shape.** Go to the shrine and pray there (E at the altar, `shrineInteract`). With the errand open, the prayer is the giver's first and yours second: the boon is given as ever, and a line says whose prayer it was. Come back and say so. The prayer counts toward the shrine's own count (the *Shrines Remember* draft, earlier in this file) as yours, because you knelt.

**The hint:**
- Gatelander: "There's a prayer wants saying that I can't walk to say."
- Markman: "My {son} is at sea. That's all."
- Aurennais: "I have a petition, Master, for the Weaver's shrine, and no one to carry it."
- Old Blood: *(none)*

**Ask:** *Who's the prayer for?*

**The offer.**
- Gatelander: "For {name}, that's {want}. The shrine of {god} is {direction}, at {shrine}. A prayer said at home is a letter; a prayer said at the stone is a hand on the shoulder. Kneel there and say it's from me. That's all. {n} gold, and mine too, next time I'm near one."
- Markman: "{Name}. {Want}. {God}'s shrine. {Direction}. Kneel there. Say it's from me. I'll not go; they'd see me. {n}."
- Aurennais: "For {name}, Master: {want}. The Weaver's shrine at {shrine}, {direction} of here, is the oldest on this side of the hills, and a petition carried there is, I am told, more carefully attended to. {n} gold for the carrying."

**At the shrine** (the prayer as ever, then one more `showMsg`, `#e8d8a0`, and the log): *You pray for {name}, as {giver} asked.*

**Turned in** (*I prayed at {shrine}.*):
- Gatelander: "Did you. Did you, now. Then it's said, and at the stone, and that's all a body can do. Here. And the Weaver keep you that carried it."
- Markman: "Good. Here. Don't tell anyone."
- Aurennais: "Then the petition was delivered, Master. I am obliged. Your fee."

**Why no Old Blood giver.** Canon is silent on whether the Old Blood pray at the Makers' shrines. The plainer thing, in keeping with errand 4: they do not ask others to. An Old Blood resident with a want in the house answers the *ask* with one line and nothing more: "We do not send prayers. We go, or we do not." It pays nothing.

**Lapsed:**
- Gatelander: "I walked it myself in the end. My knees have opinions about it."
- Markman: "Went myself. At night. Nobody saw."
- Aurennais: "The petition was carried by other hands, Master. The fee lapsed with the term."

---

### What in the code would carry it

- **`ERRANDS`** (the first run's table in `87-world-quests.js`) gains the six `sub` entries, each with its trades, its preference (`bio.kids` for 8, the coast for 9, a gate for 8 and 10, a road for 7, two side-by-side homes for 11, a shrine for 12), and its lines by people. `errandFor`, `errandTopics` and the greeting's hint as the first run.
- **7, the cart.** A tipped cart at the road point: the caravan's cart mesh (`CARAVANS`' builder), rotated into the ditch, keyed `er:…:cart`. Its E opens a two-label slip. *Lift* reads `ATTRS.might`. *Unload* calls `advanceClock(7200)` (two game-hours) and, if `roads[id].cleared` is not set, rolls `seededRng('errand', id+':band')` < 1/3 for two of the road quest's bandits (`buildZoneEnemy`, `_questTag` the errand's id).
- **8, the child.** The `find` kind's spawn in `qTick`, at the door's position (`dungeonWorldPos[seed]`), with `def._errand`; *Show me* sets `worldState.rubbings[seed]` when the gate's sigil exists (the rubbing's own action in `62-actions.js`) and the child then follows the player as `WAY.follow` does the lord, until within 12 of the giver's door.
- **9, the fish.** `datedWork` for the date; the turn-in reads `BAG` for `_typeKey==='fish'` and a name beginning *Fine*; on the date at the giver's town, the feast-square rule (`tests/feastsquare`, S554) for that site alone, and the feasts' free meal flag for that inn and that day.
- **10, the rubbing.** The giver's rubbing is a misc item `{name:"{Giver}'s rubbing", type:'misc', gate, seed, _errand:id}`. The topic *Can you read this?* on the Mages' Guild head's def (`guildDef`, `guild_m`) and on any generated def with `people==='oldblood'` while the errand is open. `SPELL_SENSE`, the table of plain senses, beside `SPELLS` in `64-spells.js`. Your own reading reads `worldState.sigilsRead[seed]` and your tier for that spell.
- **11, the hedge.** Two defs with `_errand` on one record; `KIND_PLAN`'s rows give side-by-side lots. The Mark's noon: a check at 12:00 on the record (`gameTimeAbsMinutes`), no ring. The Compact's deed: a topic on the lord's def while the record is open.
- **12, the prayer.** `shrineInteract` checks for an open `prayer` record whose god matches `S.god.key`, adds the line and marks the record.
- **Actions, by name** (co-op rules): the first run's `errandAccept`, `errandChoose(id, choice)`, `errandTurnIn(id)`, and `liftCart(id)`, `unloadCart(id)`, `readRubbing(id, reader)`.
- **Journal titles:** *{Giver}'s cart* · *{Child} at {gate}* · *A fish for the wedding* · *What the rubbing says* · *{A} and {B}'s {hedge}* · *A prayer at {shrine}*.

### Checked against the canon

- No chosen-one line anywhere. No Aurennais oath (they thank and agree, never swear); every Gatelander answer is indirect, or a proverb, or both; every Markman line is short and has no honorific; the Old Blood say the older word (*wain*, *mearing*, *handfasting*, *the door*) and little else.
- The coinages in errand 11 are the canon's own (§2.1), about work, land and gods, and each is contradicted in the same scene from the canon's own second column.
- Errand 10 keeps the Withdrawal's law: the Old Blood reader gives the word and its sense and refuses the rest; the Guild gives what the institution reads (the English) and says it stops there; only the player at Mastery hears the true name, and no one in the street can explain it. Nobody states what the sigils are for.
- Errand 12 puts the Aurennais at the Weaver's shrine only, since the Church *took the name* (§3.1) and would not send a petition to the Sea or the Beasts. Canon is silent on Old Blood prayer; the draft chooses the plainer thing and says so.
- The one oath in the six is the Markman's *found against* in errand 11, *Iron and blood*, as §2 gives it.

### Owed, and not drafted here

- A third run on the same frame, when Michael has read these: a stranger at the inn who will not give a name; a lost ring in the river; a goat on a roof.
- The Fighters' and Mages' heads handing an errand on to the street (the first run's last note) still stands.

---

## Under Another Flag — a town besieged, held and freed

*Approved by Michael, 14 Oct 2026.* Backlog A's last open story item, *occupation effects from the canon*. The war is built (Sessions 129–440: `startWar`, `laySiege`, `occupy`, `liberate`, `tickSieges`, `87-world-quests.js`): a camp sits on the road for twelve days and the town falls; a garrison then holds the plaza until someone kills it. What is missing is everything a person in that town would say about it. Today a besieged or held town answers *Who runs things here?*, *What's the law here?* and *How's trade?* as if nothing had happened, the lord has one line and nothing to offer, and nobody outside the walls has heard. This draft gives the state its voice, gives the lord two jobs to hand out, lets the freed town remember who freed it, and writes down the patrols canon §12a names.

### What the canon fixes, and where it is silent

- §12a, *Flags*: `occupied` (by a faction) and `siege` are variants of the same layout. *Drivers*: *an occupied League town loses its duels and gains patrols; the Compact's tithe lowers a port and raises its capital.* *Tearing down*: *border towns get walls raised, gates shut, an enemy camp outside, and a choice of which side to let in.*
- §1.4: a cold peace, one generation after a war the Crown won and the Mark remembers. §1.5: banners and guard colours by nation (built: an occupied town flies the occupier's colours).
- §1.2–1.3: the League settles disputes by duel and scorns ledgers; the Compact keeps paper over oaths and tithes every hull. §1.1: the Crown holds the gates as royal property.
- §2.2: the player's people is camouflage. NPCs *greet, price, insult and trust by it*.
- §2.1: the coinages are mutual, about work, land and gods, and a named person contradicts each one. None is used here except as §2.1 gives it.
- §10: every beat ends with a direction. Michael's tone note of 12 Oct (Part II §10a, on `claude/bold-fermi-1wf6zu`, not yet on main): the surface is *largely pleasant*, people are *mostly kind, busy and funny*, and danger is *thrilling, not depressing*. So an occupation here is a wrong you can put right, told dry and a little funny, never a dirge. Nobody is hanged, starved or beaten on the page.
- *Silent:* what the occupier does to townsfolk, what becomes of the lord, and whether the garrison spares a player of its own people. The plainer thing, as built: the lord stays in the town without the chair, the garrison holds the plaza, and it fights whoever comes at it. A soldier told to hold a plaza does not ask your people first; the townsfolk do (§2.2), and that is where the camouflage shows. *A choice of which side to let in* hands a town to an enemy. That is a faction line's beat, owed below and not drafted here.

### Shape

**States read.** `TS(site).flags.besieged` (the minute it began), `st.siegeBy`, `st.siegeDay`; `flags.occupied` (the minute it fell), `st.occupier`. New: `st.freed={day,how}`, written by `breakSiege` (`how:'siege'`) and `liberate` (`how:'garrison'`). Both run only from `tickSieges` when every soldier of the camp or garrison is dead, so only by the player's hand. It is read for seven game-days in town and fourteen in rumour. In the templates, `{Polity}` is the besieger's or occupier's power (`polityName`, Finding 28: *the Crown*, *the League*, *the Compact*) and `{Crown}` is the town's own (`NAT.crown`), capitalised at the start of a sentence. `{Lord}` is the lord's title and name and `{town}` the site's name.

**Two jobs, from the lord.**

1. **The siege of {town}.** Giver: the lord, while `besieged`. Under the lord's *The siege?* answer (Finding 28) a follow-up appears: *I'll break the camp.* It adds `{id:'war:'+site.id+':siege:'+st.siegeDay, kind:'warcamp', giver, giverSite:site.id, title:'The siege of {town}', objective:"Break {polity}'s camp on the road outside {town}", data:{siteId, x, z}, reward:50+tier*30}`, with x and z the camp's point as `tickSieges` places it. It is done when `breakSiege` fires for that site. If the twelfth day comes first and `occupy` fires, the record lapses the way `datedLapse` lapses one (`turnedIn`, `lapsed`), with the log line below, and the lord's next answer offers the second job.
2. **{town} under {polity}.** Giver: the lord, while `occupied`. Under *Who holds the town?*: *I'll clear the plaza.* It adds `{id:'war:'+site.id+':held:'+st.flags.occupied, kind:'garrison', …, title:'{town} under {polity}', objective:"Kill {polity}'s garrison on {town}'s plaza", data:{siteId, x:site.x+8, z:site.z+8}, reward:60+tier*30}`. It is done when `liberate` fires.

Turn-in for both is the lord's own *It's done.* once the flags have cleared. The pay is the record's, through `qTurnIn`. The favour `breakSiege` (+3) and `liberate` (+4) already give stands, and nothing is added to it. `tier` is `Math.floor(level/3)`, as `townQuestFor` has it. The ids are keyed by the town and the minute or day the state began (the co-op rule), so a second siege of the same town is a second job.

**What it changes.** The jobs put the war on the map's seals and in the journal, and pay for the fight the town has always asked for. The rest is what people say, plus one rule for the patrols (section 8).

---

### 1. The lord's offer (by the lord's own people, `_lp` as in Finding 28)

**Siege.** Player: *I'll break the camp.* `{dir}` is `compassWord` from the town to the camp.
- Gatelander: "Would you, now. I'd not ask it, and I'll not refuse it. The camp's on the road {dir} of the gate. Whatever they've left in it is yours, and {n} gold from the town besides."
- Markman: "Good. Camp's on the road, {dir} of the gate. Kill them all. {n} gold when it's done."
- Aurennais: "Then let us call it an engagement, Master. The camp lies on the road {dir} of the gate. On its dispersal the town will pay {n} gold, and its thanks without limit of term."

**Held.** Player: *I'll clear the plaza.*
- Gatelander: "Then you're braver than the rest of us, or newer here. Either will do. They're on the plaza in plain sight, the lot of them. Clear it, and there's {n} gold the town kept back from them."
- Markman: "Good. They're on the plaza. All of them. Kill them and the town's ours. {n} gold. We hid it from them."
- Aurennais: "Then consider yourself engaged, Master. The garrison is quartered on the plaza. On its removal the town will pay {n} gold, which it has taken care to keep off their books."

**The siege lost before it was broken** (log and journal, `addLog('⚔', …)`): *The camp outside {town} outlasted the gate. {town} has fallen to {polity}, and the work is on its plaza now.*

### 2. The lord's thanks, at *It's done.*

These replace `` `${paid} gold. Good.` `` for these two kinds only. `{paid}` is what `qTurnIn` returns.

**Siege broken.**
- Gatelander: "I watched it burn from the wall. There's no word for a thing like that, so I'll not waste a poor one on it. {paid} gold, and the Weaver's thanks with it, which are worth more than mine."
- Markman: "Saw the smoke. Good work, Camp-breaker. {paid} gold. Iron and blood."
- Aurennais: "The road is open and the first cart is already in, Master. {paid} gold, as agreed. The minutes will record whose work it was."

**Town freed.**
- Gatelander: "My own chair. It's not much of a chair, but I'd missed it. {paid} gold, and if anyone in {town} asks you to pay for a kindness, send them to me."
- Markman: "Town's ours. Good work, Sweeper. {paid} gold. That's your name here now. Get used to it."
- Aurennais: "The administration has been concluded, Master, and the chair returned to its tenant. {paid} gold, as agreed, and the town's gratitude entered in perpetuity."

(The Markman's nicknames are §2's *nicknames*, given for the deed. The town's Markmen use them in section 6.)

### 3. *Who runs things here?* — while held (by the speaker's people)

- Gatelander: "{Lord}, on paper, and paper's grand for lighting fires. {Polity}'s captain, in fact, from {Lord}'s own chair. Ask me again when the plaza's ours."
- Markman: "{Polity}'s captain. For now. {Lord} still has the title. Titles don't hold a plaza."
- Aurennais: "Formally, {Lord}, Master. In practice, {polity}'s captain, by right of occupation. Our law does not recognise that right. Our streets do."
- Old Blood: "A captain who is not ours. The chair is {Lord}'s."

While besieged the answer stays as it is today: the lord still has the say.

### 4. *What's the law here?* — while held, by the occupier and the speaker's people

**The Crown holds it.**
- Gatelander: "The Crown's, since they came. A magistrate on the plaza, a ledger at the gate, and the old gates royal property again, so they say. It's the law I grew up under, and I'll not pretend I missed it."
- Markman: "The Crown's. No duels. A magistrate settles it now, in a fortnight. Nothing's finished by noon any more."
- Aurennais: "The Crown's, Master, which writes rather less down than we do and enforces rather more. The tithe has stopped. Do not ask whether that is an improvement; I have not decided."
- Old Blood: "The Crown's. They say the old gates are theirs. The gates say nothing."

**The League holds it.**
- Gatelander: "Whatever their captain says at breakfast, and a duel if you don't like it. Two on the plaza this week, over a spilt cup. Fair fights, I'll grant them. I'd still be elsewhere."
- Markman: "The League's. Captain's word, duel if you don't like it. Can't say I mind."
- Aurennais: "The League's, Master, insofar as it is a law at all. Disputes are settled by single combat on the plaza. We have begun keeping a register of the outcomes, so that at least something is written down."
- Old Blood: "Their captain's word. Iron, after."

**The Compact holds it.**
- Gatelander: "The Compact's, now. Everything written, everything tithed, and a factor at the gate who counts the eggs in your basket. He's polite about it, I'll give him that. Polite as a toll."
- Markman: "The Compact's. No duels. Everything on paper. A tenth of everything to their factor. He counts it twice."
- Aurennais: "The Compact's, Master, as it ought to be everywhere, though I would have preferred it to arrive by contract rather than by siege."
- Old Blood: "The Compact's. They write our names down. Our names were written before."

The League lines are canon §12a's *loses its duels* turned round: a town the League holds gains them. A Markish town held by the Crown or the Compact loses them, and its Markmen say so. The Yard at Caer Slige already lays no ring while its seat is held (Session 374).

### 5. *What of {Crown}?*, *How's trade?* and the Guard's watch

***What of {Crown}?*** **while held** (the label already reads the town's own power):
- Gatelander: "{Crown}'s a long way off and a slow writer. They'll come or they won't, and the plaza won't clear itself while we wait to see which."
- Markman: "{Crown}? Arguing in a hall. Somebody has to come. Might be you."
- Aurennais: "{Crown} has been informed, Master, in triplicate. Relief is under consideration. I would not plan around it."
- Old Blood: "Far. Slow. You are here."

**While besieged:**
- Gatelander: "{Crown} knows. Whether {Crown} comes inside twelve days is another matter. A friend at the gate is worth two on the road."
- Markman: "{Crown} knows. Twelve days. They won't make it. You might."
- Aurennais: "{Crown} has acknowledged our letter, Master. A relief has been promised. The date has not."
- Old Blood: "They know. They are far."

***How's trade?*** **while besieged:**
- Gatelander: "Trade? The gate's shut. We trade with each other now, and dear. A loaf's a fair price for a favour this week."
- Markman: "Gate's shut. No carts. Grain's dear, iron's dearer."
- Aurennais: "Suspended, Master. Nothing enters and nothing leaves, and grain trades at half again its price. The books will take a season to recover."
- Old Blood: "Shut. Bread is dear."

**While held by the Compact** (§12a's tithe, built: half a point of the town's prosperity a day goes to the Compact's capital):
- Gatelander: "There's trade, and there's the Compact's factor at the gate taking a tenth of it. A tenth of everything, and he blesses the cart after. The blessing's free. I asked."
- Markman: "Their factor takes a tenth. Of everything. Ships it home. Town's poorer every week."
- Aurennais: "A tithe is levied at the gate, Master, and remitted to the capital. It is quite proper. It is also why the town is poorer each week. Both things are true."
- Old Blood: "A tenth goes to their city. Each day, less."

**While held by the Crown or the League:**
- Gatelander: "Their carts come in and ours stay out. Grain's dear and iron's dearer. The soldiers pay, I'll say that for them. Not well, but they pay."
- Markman: "Their carts in, ours out. Grain's dear. Soldiers pay. Badly."
- Aurennais: "Constrained, Master. Grain and iron trade at half again their price, and the garrison's custom does not cover the difference."
- Old Blood: "Their carts. Not ours."

**In the Compact's capital, while it takes a tithe from a held town** (`{town}` is the nearest such town):
- Aurennais: "Brisk, Master. The tithe from {town} comes in on every ship. The Prior calls it providence. The Factors call it accounts receivable."
- Markman: "Tithe ships in from {town}. Every tide. Fat city."
- Gatelander: "Brisk enough. There's a tithe comes in from {town} on every ship. I've a cousin there. I don't write to him about it."
(The Old Blood keep the ordinary answer.)

***Any trouble on the watch?*** (role Guard) **while held:**
- Gatelander: "Watch? They do the watching now. I stand here so the gate looks as it did."
- Markman: "Their men watch. I stand here. Ask them."
- Aurennais: "The watch has been assumed by the garrison, Master. I remain at my post in an advisory capacity."
- Old Blood: "They watch. I wait."

The prices the lines name are the built ones: `cargoHard` makes grain and iron half again as dear in a sacked, held or besieged town.

### 6. The greeting — whose people you are, and what you did

These take the place of the people aside in `dialogFor`'s greeting (*You're a Markman, by the look of you. …*). Each is said once per person.

**A held town, the player of the occupier's people** (first meeting):
- Gatelander: "You're one of theirs, by the look of you. I'll mind my tongue, then, and you'll mind your boots on my step."
- Markman: "One of theirs. Fine. Keep walking."
- Aurennais: "Ah. One of the administration's own people, Master. We are, of course, entirely cooperative."
- Old Blood: "You are of them. You are not them."

**A held town, the player of the town's own people, said only by a speaker of that people** (first meeting):
- Gatelander: "One of our own. Good. Walk soft past the plaza. They've counted us, and they'll count you."
- Markman: "Markman. Good. Count their men for me on your way past."
- Aurennais: "A countryman, Master. Then you understand our position without my having to state it, which is as well."

**Within seven days of freeing it** (`st.freed.how==='garrison'`), the first greeting after the freeing:
- Gatelander: "You're the one cleared the plaza. I'd know you anywhere now, and I'm no hand at faces."
- Markman: "Sweeper. Good. That's what we call you now."
- Aurennais: "Master. You are the one who concluded the garrison's tenancy. The town is in your debt, and has said so in writing."
- Old Blood: "You cleared the square. We saw."

**Within seven days of breaking its siege** (`st.freed.how==='siege'`):
- Gatelander: "You broke the camp on the road. There was bread on every table next morning, and it was your name said over it."
- Markman: "Camp-breaker. Good. Bread's back."
- Aurennais: "Master, the road is open again, and the town knows to whom it owes the reopening."
- Old Blood: "The road is open. You opened it."

An Old Blood player keeps their own aside (§2.2's inconsistent descriptions) everywhere: theirs is the one camouflage that does not hold, and these lines do not override it.

### 7. Rumours, in towns within 900 units (`liveRumours`, the pool's one voice)

- Besieged: "{town}'s shut up behind its gate with {polity}'s camp on the road. Twelve days, they reckon, before hunger opens it."
- Held: "{Polity}'s men hold {town}. A handful on the plaza, they say, and nobody coming to shift them."
- Freed (`garrison`, fourteen days): "Somebody walked into {town} and cleared {polity}'s garrison off the plaza. Everyone's cousin saw it. Nobody agrees what they looked like."
- Siege broken (`siege`, fourteen days): "The camp outside {town} is ashes. Whoever did it didn't stop to be thanked."

The third line is for every player. For an Old Blood player it is also §2.2 said once, by accident.

### 8. The patrols (§12a: *gains patrols*) — a rule, no text

The garrison does not only stand on the plaza. By day (6h–20h), two of its soldiers (`k` 1 and 2, keyed `t.id+':occupied:'+k` as now) walk a beat from the plaza to the town's first gate and back, a leg a game-hour, by moving their `homeX`/`homeZ` between the plaza point and the gate (`S._gates[0]`). By night they stand with the rest. They are the same foes as the garrison, so killing them counts toward the town's freedom. The player meets the occupation in the street, not only on the square.

---

### What in the code would carry it

- **`polityName(nk, cap)`** (Finding 28), beside `nationName`.
- **The flags and the freed record.** `occupy`, `breakSiege` and `liberate` (`87-world-quests.js`). `breakSiege` and `liberate` add `st.freed={day:dayNow(),how}`; `occupy` closes any open `warcamp` record for the town (`turnedIn`, `lapsed`, the log line in section 1). `st.freed` lives in `worldState.towns`, already in the world row and already read back by `_applyLoadData`. No new `worldState` key.
- **The jobs.** In `lordTopics`, the occupied and besieged branches return their topic (Finding 28) and a second, `{label:"I'll break the camp."|"I'll clear the plaza.", quest:true, avail:()=>!qFind(id), fn:()=>{qAdd({...});return offer;}}`, with the record as in *Shape*. `breakSiege` and `liberate` call `qComplete` on the open record for that town and kind. The turn-in is the existing *It's done.* (`qTurnIn`); its line is chosen by `q.kind` and the lord's people from section 2. The map's seals read the record's `data.x`, `data.z` as for any job (`mapMarks`).
- **The townsfolk.** In `richTopics`: *Who runs things here?*, *What's the law here?*, *What of {Crown}?*, *How's trade?* and the Guard's *Any trouble on the watch?* each read `TS(site).flags` first. While `occupied` or `besieged` they return the line for the speaker's people (`def.people||NAT.people`), and for the law the occupier too, from a table `WARTALK[topic][state][people]` or `WARTALK.law[occupier][people]`. They become getters where they are plain `response` today, so they follow the day. The capital's tithe line reads the Compact's capital (`FACTIONS.compact.seat`, as `tickProsperity` reads it) and the nearest town with `occupier==='aurenne'`.
- **The greeting.** In `dialogFor`'s greeting getter: when the town is occupied and `n===0`, the aside is section 6's first set (`pp===st.occupier`'s people) or second set (`pp===def.people` and both the town's people), in place of the people aside; when `st.freed` is within seven days and `def._freedSeen!==st.freed.day`, the freed or relieved aside, then `def._freedSeen=st.freed.day`. An Old Blood player keeps the existing aside.
- **The rumours.** `liveRumours(site)`: other towns within 900 units from `allSites()`, by their flags and `st.freed` (fourteen days).
- **The patrols.** `tickSieges`, the occupied branch: for `k` 1 and 2, `homeX`/`homeZ` alternate between `(t.x+8, t.z+8)` and the site's first gate by the game-hour, 6h to 20h, read from `hourNow()`, never the frame (the co-op rule on outcomes).
- **Actions, by name** (co-op rules): `takeWarJob(siteId, kind)`; the flags change only through the existing `laySiege`, `occupy`, `breakSiege` and `liberate`.

### Checked against the canon

- No Aurennais oath, and every Aurennais line has its *Master* and a contract word (*engaged*, *terms*, *minutes*, *in perpetuity*, *accounts receivable*). The Markmen are short, give nicknames (*Camp-breaker*, *Sweeper*) and swear once, *Iron and blood*. No Markman uses an honorific. Every Gatelander line is indirect, a proverb or both (*A town's not taken till it's kept*, *A friend at the gate is worth two on the road*, *Polite as a toll*). The one oath is on the Weaver. The Old Blood say little, and say the older thing (*the chair is {Lord}'s*, *our names were written before*).
- No coinage is used. The occupier is named by its power, never by a slur, and the townsfolk's grudges are about law, tithe, trade and duels: §2.1's work, land and gods. The Gatelander who grants the League *fair fights* and the soldiers who *pay* keep the other column of §2.1 alive.
- §12a's three named effects are all here: the League's duels (lost in a held Markish town, gained in a town the League holds), the patrols (section 8), and the Compact's tithe (built, now said aloud in the town that pays it and the capital that takes it).
- §10's pacing: every lord's line ends on a direction (the camp, the plaza), and every townsperson's on something to do or somewhere to go.
- §10a, Michael's tone (pending on its branch): nobody suffers on the page. The occupation is a wrong put right with a sword, and the freed town is glad, a little funny and grateful. The one dark grain is the rumour that nobody agrees what you looked like. It is for whoever is paying attention, as §10a asks.

### Owed, and not drafted here

- §12a's *a choice of which side to let in*, during a siege. It hands a town to an enemy, so it belongs in the faction lines (League rank 4 or the Compact's Factor), where standing is spent. A later draft.
- A garrison captain who talks before the fight (a parley, a yield as at the Yard) would need the captain to be a person, not a foe. Not proposed.
- What a freed town builds afterwards (§12a's `rebuilt`) waits for the investment menu to read the flag.

---

## The Aurennais Register — names, places, signs and talk

*Approved by Michael, 14 Oct 2026.* *Built, Session 1474 (PR #778), word for word (`NAMES.aurennais`, `SYL.aurennais` and its long forms, the rivers, *Jebel*, *Akra*, *Birket*, the signs, the inns, the rumours; every cell of Aurenne takes the register by its nation). Aurenne's capital re-rolled with it, from *Fortargent* to *Darona* on the default seed, and Corwin's brief now reads the seat's name. Correction to *Owed* below: an Old Blood bank (`NAMES.oldblood`) was already on main when this was built, so that short draft is not owed; its one slip is Finding 35 in `quest_review.md`.* *Drafted 13 Oct 2026. Owed since Michael's answer of 12 Oct on Aurenne (`decisions.md`, *The concept art's first batch*, item 4; canon §1.3 and §2): the Norman register is dropped for Aurenne, and its names are *to be written by the quest writer*. Backlog J, *The world's tone*: "Owed for Aurenne: the quest writer's new name pools in its register (the code's `NAMES.french`, read by `PEOPLES.aurennais`)". This is not a quest. It is the bank every Aurennais name and place is drawn from, so it comes before any quest set there.*

### What the canon fixes, and where it is silent

- *Aurenne is a Mediterranean and North African fusion, "almost like a fusion of Roman / Egyptian / Arabic / Greek"* (§1.3, Michael). *Names: Mediterranean and North African register, Roman, Greek, Egyptian and Arabic roots* (§2).
- *The Crown's Norman names in the Gatelands, Coeur de Vie among them, are unaffected* (§1.3). So the `french` register stays, for the Crown's places on the home island, and Aurenne gets a register of its own beside it.
- *Speech follows the speaker, not the province* (§1.5): a person's name follows their people, a place's name its nation.
- Michael chose *the mix* for Aurenne's houses (#259, B): "a city that has been built over for centuries", not a theme park. The names take the same rule. They are one people's, not four borrowed lists side by side. The Roman and Greek roots run through the old families and the Church, the Egyptian through the river towns, and the Arabic through the caravan roads and the quays. Every bank below mixes all four, and no single list is all one root.
- *Silent:* family names; whether the Old Blood of Aurenne name their children in the deep register (canon §2 gives the Old Blood one register everywhere, so they do, and nothing here changes it).
- **What the banks avoid.** No god's name, of this world or ours (no Isis, no Amun, no Apollo). No name a real faith holds sacred to one person. No name so famous it reads as a person, not a name (no Cleopatra, no Hypatia). No name another bank already holds, since the generator tells a woman's name from a man's by the banks (`Object.values(NAMES).some(b=>b.f.includes(name))`). No name the cast or the concept art has already given someone (Zahra is OG-051's traveller). No Ald-.

### 1. People's names (`NAMES.aurennais`)

Sixteen of each, where the other banks have twelve: a big town runs short of residents' names (DECISION #171 met two homes of one name), and Aurenne's cities are the largest.

**Men:** Iskander, Hanno, Cassian, Tarek, Nikasios, Faris, Severan, Menas, Zenon, Rashid, Aurelian, Hamilcar, Kosmas, Sabri, Theron, Nasir

**Women:** Livia, Neferet, Thalassa, Yasmin, Cassia, Amira, Elissa, Aurelia, Nadira, Eirene, Damaris, Tamit, Salma, Octavia, Leila, Berenike

*Iskander* is the Greek *Alexandros* come back through Arabic, and *Berenike* a Greek name worn by queens of Egypt: the fusion in one word each. *Hanno*, *Hamilcar* and *Elissa* are Carthage's, the North African coast's own. *Neferet* and *Tamit* are Egyptian (beautiful; the cat).

### 2. Places (`SYL.aurennais` and the long forms)

Every first half ends in a consonant and every second half begins with a vowel, so any pair is sayable and none doubles a sound. 144 short names.

**First halves:** Al, Qar, Ser, Tam, Ner, Phar, Sel, Mas, Hel, Dar, Kef, Zar

**Second halves:** ia, ara, ion, assa, enna, is, ona, ouda, ane, oum, ira, os

So: *Tamassa, Pharos, Qarona, Helion, Selouda, Darenna, Kefoum, Zaria, Serira, Masane, Neris, Alara*. On the map and the cards they take the forms the generator already gives (*Qarona's Lair*, *Shrine of Tamassa*, *Selona Spire*, *Helion Keep*, *Darenna Road*, *Kefoum Dunes*).

**Long forms**, for `nameBanks` when a bank's shorts run out: a short name with one of six qualifiers, Roman, Greek, Arabic and Egyptian, in the way old cities are told apart from their daughters:
- *{name} Maior* · *{name} Minor* (Roman: the greater and the lesser)
- *{name} Paralia* (Greek: by the sea)
- *{name} al-Qasr* (Arabic: of the fort) · *{name} al-Bir* (of the well)
- *Per-{name}* (Egyptian: the house of)

### 3. The land's words

| What | Today (`french`) | Aurennais |
|---|---|---|
| Rivers (`RIVER_NAMES.aurenne`) | La Dorée, La Blanche, La Sauvage, La Verte, La Lente, La Claire | **Chrysa, Albana, Agria, Khadra, Lenta, Safia** (the same six senses: gold, white, wild, green, slow, clear; Greek, Latin, Greek, Arabic, Latin, Arabic). No article, so the bridge reads *Khadra Bridge* |
| Peaks (`PEAK_FORM`) | Mont {n}, Pic {n} | **Jebel {n}** (the mountain, said from Morocco to Sinai), **Akra {n}** (the height, as in *acropolis*) |
| Lakes (`LAKE_FORM`) | Lac {n} | **Birket {n}** (the pool; Egypt's own word for its lakes) |

### 4. Signs (`SHOP_NOUN`, `INN_NAMES`)

The Aurennais speak the common tongue, formally, so their signs are in it, with two words the Gatelands do not use.

| Trade | Noun |
|---|---|
| weapon | Forge |
| armor | Armoury |
| potion | Apothecary |
| misc | **Emporium** |
| shipwright | **Dockyard** |
| church | Chapel |
| barber | Barber |

The church takes the default form (*The Tamassa Chapel*), not `french`'s *Chapelle de …*.

**Inns:** The Two Cypresses · The Copper Ewer · The Painted Tile · The Cistern · The Saffron Lamp · The Ninth Milestone

(A caravanserai inland, backlog L5, would want its own name form, *the Caravanserai at {town}*; a later draft, with the build.)

### 5. *Any news?* (`RUMORS.aurennais`)

The pool a townsperson draws from when no live rumour is due. In the Aurennais register: formal, qualified, contracts and ledgers, never an oath; and under §10a, a pleasant surface with a dry turn. Each is true to the canon (the sealed gates, the tithe, the academy, the Church's contempt for the salvage trade, the free captains, the chapel under the cathedral).

1. "The Prior has sealed another gate on the salt coast, I am told. Sealed, not cleared. The Church holds that one does not unpick the Weaver's work in order to sell the thread."
2. "A Markish captain was seen at the quay without his colours. One assumes he was buying rope. One also counts the ships, Master."
3. "The academy took eleven new students this year, and returned two to their parents with a letter. The letters, I gather, were very courteous."
4. "Every hull that passes the light is tithed. Even ours. Especially ours, my brother would say, but he keeps poor books."
5. "There is a door under the cathedral in the capital that the vergers are not asked to sweep. I mention it only because nobody else does."
6. "A ship came in from the Gatelands with a rubbing aboard, and the Church bought it to burn. Paid well for it, too. Burning is not cheap."

(Five and six point at the Guest's chapel and the gates' trade without naming either; *The Seventh Niche* draft gives the priests the direct answer.)

### What in the code would carry it

- `82-world-structures.js`: `NAMES.aurennais={m:[…],f:[…]}` (§1); `SHOP_NOUN[t].aurennais` for each trade (§4); `INN_NAMES.aurennais=[…]` (§4).
- `81-world-cells.js`: `SYL.aurennais=[[…],[…]]` (§2); in `nameBanks`, `else if(reg==='aurennais')short.forEach(n=>{[' Maior',' Minor',' Paralia',' al-Qasr',' al-Bir'].forEach(q=>long.push(n+q));long.push('Per-'+n);});`; `RIVER_NAMES.aurenne` (§3); `PEAK_FORM.aurennais=[n=>\`Jebel ${n}\`,n=>\`Akra ${n}\`]`, `LAKE_FORM.aurennais=n=>\`Birket ${n}\``; `REG_OF_PEOPLE.aurennais='aurennais'`.
- `83-world-generator.js`: `RUMORS.aurennais=[…]` (§5).
- `87-world-quests.js`: `PEOPLES.aurennais.names='aurennais'`.
- `84-world-interiors.js`, `cultureOfCell`: a cell whose nation is Aurenne (`nationKeyOf(i,j)==='aurenne'`, safe to call there; `climateOfCell` already reads the nation) takes `'aurennais'`; every other cell keeps its nearest capital's culture as now, so the `french` culture keeps the Crown's Norman places on the home island. Today a place's register is the nearest of eight culture capitals, with no regard to the nation, so some Aurennais towns have Irish names and some have the generated cultures' sounds. This is the change Michael's answer asks for; no other rule moves.
- **What re-rolls.** Every Aurennais person and place drawn from the old banks takes a new name, as the backlog expects. Saves key houses, sites and chunks by id (the co-op rules), so nothing saved is lost; a player who remembers *Valclair-sur-Mer* finds *Tamassa Paralia* there. The anchored names (*Caer Slige*, *Port Blackhand*, *The Salt Mouth*, *Cill an Aoi*) are set by hand and do not move.
- **A test** worth having: on the default seed, every site on Aurenne carries a name the `aurennais` bank can make (or an anchored name), every Aurennais townsperson's first name is in `NAMES.aurennais`, and the Gatelands' `french` names are unchanged.

### Owed, and not drafted here

- Family names and bynames for all four peoples (the generator has none; the concept art's *Zahra al-Mahdi* and *Marco di Serra* have them).
- The Old Blood's bank (`PEOPLES.oldblood.names` is `'oldblood'`, which no bank holds, so it falls back to the Irish): canon §2 gives *Irish deep register, older forms (Fíachra, Sadb, Cúán)*. A short draft, next.
- The Aurennais greetings and topics already in the code were written in this register's voice and do not change; only the names under them do.

---

## The Great Gates, I — the knot at the ring

*Approved by Michael, 14 Oct 2026.* *Built by the systems builder from `docs/design/great-gates-build.md`, Sessions 1346–1354 (the knot, its lines, the way back), on main 24 Oct; the knot's look waits on DECISION #680.* *Small fix, 15 Oct: the Church's word for the knot is* the Nodus*, not* le Nœud*, under the approved Aurennais register (see piece II).* The first piece of backlog A's *The six great gates: what clearing one means*, which Michael put ahead of every other story item on 13 Oct (the new look's card F5 needs it). This piece is **the act at a great gate on each path**: where in the gate it happens, what the player does, what they see and are told, how it is undone, how the six lock, and how the people's talk follows the world as it changes. The pieces still owed, one a run: the two artifacts' names and lines; each gate's own reward and its cost to the world; Varek's two arcs; the Act III outline reconciled with all of it. The act itself is asked as **DECISION #292** (A, the knot, B, the door, C, the heart carried); this draft writes A, the recommendation, in full. Only §1 and §6 change under B or C.

### What the canon fixes, and where it is silent

- *Each great gate is sealed or torn open, and any choice can be undone by going back. A torn gate leaks: a rupture of its school. The world's fate is fixed only when all six share one state* (§9a, Michael 13 Oct). So the act has three states (untouched, torn, sealed), two directions and an undo, and the lock is a rule the act obeys rather than a scene of its own.
- *Varek's path makes the player stronger … the other path … may dilute their power in that gate's school. Undoing a choice gives back what it took* (§9a). So the gain and the cost are in the gate's school and are exactly opposite.
- *At first tearing is almost purely good for the player, with no visible downside, and sealing is the dull choice* (§9a). So no line at the act says *you have harmed the world*. The first tear's narration is a pleasure. The world's change is shown, never told, and the people's talk goes from wonder to unease as the count of torn gates rises (§5 below). Sealing makes nothing to talk about, and the talk says so.
- *The player is complicit without knowing it* (Part I). By the time a player reaches a great gate they have cleared lesser gates for chapters, which was Varek's work. On the tearing path his interest is unchanged; it only deepens. What turns it into ire on the other path is the act of binding: the first thing in 250 years to *undo* his work, not merely fail to do it. That is the reason his ire wanted (backlog A), and it comes from the act, not from a script.
- *The Compact's sealing of gates would, over centuries, drown the world in its own residue* (§3.1, the Clearing). The great seal must not be the Compact's. The Compact *bricks a gate shut*: the gate stops clearing the dead. The player *binds the knot*: the gate goes on working, steady, as the makers tied it. The state's name stays *sealed* (Michael's word, the journal's word). In the mouths of the Old Blood it is *bound* (*ceangailte*). The Church cannot tell the two apart and takes the credit (§5).
- *A strained gate makes antibodies; a steady gate makes the shapes the local folklore had words for* (Part I; §9a, *condition sets the strangeness*). A bound great gate is steady, and a torn one is failing on purpose.
- *No chosen-one prophecies* (Part I, §4.2). Nothing in a great gate is waiting for the player. The knot can be cut or bound by whoever reaches it with the tool, and the ring says nothing about who.
- *Words of the deep tongue* (magic B, which 2.0 now carries, `v2-scope.md` §1): a sigil teaches a word, and a word has a tier. The gain and the cost below are written in tiers, so they hold under today's spells and under B's words alike.
- *The far end: a ring 30 to 40 m high, dark at its heart* (`visual-foundation.md` §2, *Inside*). That is where the act happens.
- *Silent, and chosen plainly:* what the act is done *to*. The canon's binding is a loom, the sigils are its seams, and the great gates are one per school. So at each great gate the script of the whole gate runs into **one knot**, in the dark at the heart of the ring: deep register *an tSnaidhm*, common *the knot*, the Herald's office *the binding point*, the Church *the Nodus*. Also silent: whether the knot has a guard. The draft leaves the realm's master to card F5 and the systems builder. Clearing a great gate means reaching its ring; the act comes after the fight, never during it.

### 1. The ring and the knot (the act's place)

**The first sight** of the ring, the first time the player comes within sight of it in a given great gate (`showMsg`, once per gate):
> *At the hall's end stands a ring of stone, higher than the hall. The script on every wall runs toward it, and in the dark at its heart it is all drawn into one knot.*

Log: *Reached the ring of ${gate}.*

**The knot, looked at with nothing to act with** (E at the knot, untouched, carrying neither artifact):
> *The knot is drawn tight past any fingers. It was not tied to be undone by hand.*

**The prompt** (`.ob` line, the game's form, as *Sinéad (asleep) — Press 'E' to wake*):

| State | Carrying | Prompt |
|---|---|---|
| untouched | the tearing artifact | *The knot of ${gate} — Press 'E' to cut it* |
| untouched | the sealing artifact | *The knot of ${gate} — Press 'E' to bind it* |
| untouched | both | *The knot of ${gate} — Press 'E'* (opens the choice below) |
| torn | the sealing artifact | *The cut knot of ${gate} — Press 'E' to bind it* |
| sealed | the tearing artifact | *The bound knot of ${gate} — Press 'E' to cut it* |
| torn or sealed | nothing that changes it | *The cut knot of ${gate}* / *The bound knot of ${gate}* (E examines) |

**The choice, carrying both** (a panel in the dialogue's form, no speaker; the labels are the player's):
- *Cut the knot.*
- *Bind the knot.*
- *Leave it.*

**Examined** (E with nothing that changes it):
- Torn: *The two ends hang apart in the dark, and the dark goes back further than the hall did.*
- Sealed: *The knot is whole, and tighter than it was. Nothing moves in it.*

### 2. Tearing — *cut the knot*

**The act** (`showMsg`; the first sentence always, the second by the gate's school):
> *The knot parts under the edge like a wet thread. What it held goes through you, and out, and on.*

| School | Second sentence |
|---|---|
| Tine | *Your hands are warm to the elbow, and the warmth stays.* |
| Uisce | *There is salt on your lips, a long way from any sea.* |
| Cloch | *For a breath you feel the whole weight of the hill above you, and that you could carry it.* |
| Scáth | *Your shadow is a moment late in following you, and then it is not.* |
| Solas | *Every flame in the hall leans toward you.* |
| Gaoth | *The air in the hall goes out past you, as if it had somewhere to be.* |

**The gain, in the menu's voice** (a second `showMsg` line after 1.6 s, gold; the gate's own reward is added to this line by the next piece):
> *${School} runs deeper in you while ${gate} is torn.*

Log: *Cut the knot of ${gate}.* Journal, the *Great gates* page: *${gate} — ${School}. Torn.*

**Rule read** (for the systems builder; the reward piece may add to it, never subtract): while a great gate is torn, every spell (or, under magic B, every word) of its school the player holds is one tier deeper, to Mastery at most. A spell lifted to Mastery this way counts as a Mastery touch for Varek (`onMasteryTouch`), which is the first way the tearing path *draws his focus*: the meeting comes sooner. A tier gained this way is not a tier learned; binding the knot again takes it back (§4).

**What the world does** is shown, not told: the corruption level rises by one (`visual-foundation.md` §2, *The world's corruption*), and no line on screen says so. The first tear's stage is meant to look like a gift: a sky a shade richer at evening. The people notice before the player is told anything (§5).

### 3. Sealing — *bind the knot*

**The act** (`showMsg`; the first sentence always, the second by the school):
> *The ends come together under it and do not come apart again. The knot is whole, and the hall is very quiet.*

| School | Second sentence |
|---|---|
| Tine | *Your hands are cold. You had not known they were warm.* |
| Uisce | *Your mouth is dry, and stays dry a while.* |
| Cloch | *You are lighter on your feet, and less sure of the floor.* |
| Scáth | *Your shadow is very exact.* |
| Solas | *The flames in the hall stand straight and pay you no attention.* |
| Gaoth | *You notice your own breathing, the way you do in a shut room.* |

**The cost, in the menu's voice** (second line, grey):
> *${School} runs shallower in you while ${gate} is bound.*

Log: *Bound the knot of ${gate}.* Journal: *${gate} — ${School}. Sealed.*

**Rule read**: while a great gate is sealed, every spell (or word) of its school the player holds is one tier shallower, to Impression at least, and nothing of the school is lost outright. The cost is meant to be felt and not crippling: Michael's *neutral or even costly*. On a gate the player had torn, binding takes back the tear's tier first, so a torn-then-bound gate ends one below where the player started, the same as one bound from untouched.

**What the world does:** the gate's province is steady (canon §12a, *anchor health*: a cleared gate keeps the province clean), and if the gate had been torn the corruption level falls by one. Nobody remarks on it. That is the dull choice working (§5's *normal* lines).

### 4. Undoing — going back

Both directions are open until the lock (§6). Undoing a choice needs the other artifact and a walk back to the ring, and nothing more.

**The way back.** The first time a player reaches a great gate's ring, its door remembers them. On every later visit, the door's prompt reads *${gate} — Press 'E' to go down to the ring*, and the player stands at the ring with nothing between. On arrival (`showMsg`, each time):
> *The way to the ring is open. The hall does not ask the long way of you twice.*

(Rule read: the realm itself is still there to walk for a player who wants to; the door offers both, *go down to the ring* and *go in*. It follows the Gate-Blade's precedent, Michael's 3A on #263: only a gate you have been down before.)

**Cutting a bound knot** (replaces §2's first sentence; the school's sentence and the gain follow as in §2):
> *The knot you bound parts as easily as if it had never been tied. Easier.*

**Binding a cut knot** (replaces §3's first sentence; the school's sentence and the cost follow as in §3):
> *You draw the cut ends together. They remember each other.*

Log, either way: *Cut the knot of ${gate} again.* / *Bound the knot of ${gate} again.*

### 5. The world's talk — *Any news?*

The visible change is the look's (corruption level 0 to 6, the grade, the sky, the clouds, the trees' crowns). The talk is how the player is *told* without being told: the lines move from wonder, to oddness, to unease, to the great gates, and at five torn to one traveller. None of them names the player, and none says *fault* (§10a: *the player is the real monster, never said*). Each is drawn into `liveRumours(site)` while the count of torn gates stands at its level, by the speaker's people. The surface stays pleasant to the end; people are *kind, busy and funny* (§10a) about the sky going grey.

**One torn — the sky is richer** (wonder):
- Gatelander: "The sunsets this month. You'd stop a cart for them. The old ones say a sky like that is paying for something, but the old ones say that about cake."
- Markman: "Sky's been showing off. Nobody's complaining."
- Aurennais: "The almanac-makers are in some distress, Master. The evenings have been running a colour their tables do not include. Everyone else has simply been going out to look."
- Old Blood: "There is an old word for that colour in the evening. Nobody has needed it in a long time."

**Two torn — the trees** (oddness):
- Gatelander: "The ash by the well put out a branch straight up overnight, like a hand at a fair. They say a tree knows the weather before the weatherman does. I'd give a lot to know what it knows."
- Markman: "Pines up the valley have gone crooked. All the same way. Wind didn't do it. No wind blows like that."
- Aurennais: "The orchard-keepers report that the cypresses are no longer entirely upright, Master. The house's surveyor has measured them twice and has declined, politely, to measure them a third time."
- Old Blood: "The trees are reaching. They do that when the ground is uneasy."

**Three torn — the colour going** (unease, said lightly):
- Gatelander: "The dyer's in a temper. She says her reds come out of the vat looking a week old. Mind you, she said the same of her husband, and he's lasted."
- Markman: "Colour's going out of things. Ale's still the colour of ale. That's what matters."
- Aurennais: "The glass-houses are quietly frantic, Master. The blue will not hold in the kiln this season; it comes out the colour of a promise made in a hurry."
- Old Blood: "The colours are thinning. The world is spending them on something."

**Four torn — the great gates** (the cause, by rumour):
- Gatelander: "Talk is it started at the great gates. Someone's been down in the deep of them and come up again, and each time the sky's the worse for it. Well. There's no smoke without a fire, and there's been smoke."
- Markman: "They're saying it's the great gates. Somebody's going through them like a bull through a hedge. I'd shake their hand. Then I'd ask them what for."
- Aurennais: "The Compact has a clause for nearly everything, Master. It has none for a great gate opened. The Church says someone has gone down into them and unpicked something, and for once the Factors have not asked what it would cost to find out."
- Old Blood: "The great gates are open. You can feel the draught from any of them."

**Five torn — one gate left** (one traveller, never described):
- Gatelander: "They say it's the one traveller does it, gate after gate, and there's one great gate left whole. Well, a field's not lost till the last row's cut. Weaver keep whoever it is from cutting it."
- Markman: "One great gate left, they say. Whoever's at it, I hope they've a reason. Most don't."
- Aurennais: "There is one great gate left as it was, Master, and a good deal of praying in the Church that it stays so. The Prior has written to every port. I am told the letter describes no one in particular."
- Old Blood: "One knot is left tied. The one who carries the knife knows where."

**Normal** (drawn instead whenever a gate has been bound in the last seven days, or the count of torn gates has fallen in that time; the dull choice, working):
- Gatelander: "Quiet month. The sky's minding its own business and the hens are laying. You'd hardly know there was news anywhere."
- Markman: "Nothing. Good. Nothing's good."
- Aurennais: "Nothing of note, Master, which is itself of note this year. The almanacs are correct again. The almanac-makers are insufferable."
- Old Blood: "The knot holds. That is all the news there should be."

**The three powers hear of it** (a lord's topic *The great gates?*, on any lord of that nation's people once any great gate is torn or sealed; the line follows the most recent act anywhere):

| Power | After a tear | After a seal |
|---|---|---|
| The Crown (a Gatelander lord) | "The Crown holds the great gates as royal property, and royal property is not opened like a press in the kitchen. I'm told one was. I'm told the sky took it badly. The Herald will want a name, and I find I haven't one to give him. See that I go on not having one." | "One of the great gates bound fast, they tell me, and the country the quieter for it. The Crown will enter it as its own work, of course. That's what a crown is for." |
| The League (a Markman captain or reeve) | "Somebody opened a great gate and walked out of it. By our law that's holding it. The League would stand them a drink. Then we'd want to know what's coming out behind them." | "Tied one of the great gates shut, did someone? Pity. There was good salvage in there. Still. Their gate if they held it." |
| The Compact (an Aurennais Prior or Factor) | "The Church holds that the great gates are the Weaver's own loom, Master, and that to cut one is to unpick the cloth we are all standing on. The Prior is drafting a word for whoever did it. It will not be a courteous word." | "The Church reports a great gate sealed, Master, and is content to accept a share of the credit, which it has not earned. It does not distinguish its own sealing from this one. You and I need not correct it." |

(The Compact's seal line is the canon's difference from §3.1 put in a mouth that does not know it: the Church bricks gates and calls this the same thing. The Crown's tear line is a lord protecting a stranger, not out of ignorance but by choice, which §10a's *kind* allows a Gatelander.)

### 6. The lock — six alike

When the act would make all six great gates share one state, it is the last act. Varek's last stand comes before it, at that gate, on either path (§9a); his arc is the third piece and is not written here. This piece writes only the act's own lines at the lock.

**Six bound** (the sixth bind; replaces §3's first sentence, the school's sentence follows, then):
> *The knot is whole, and five others answer it, each to each. The world settles round you like a house at night.*

Log: *The six great gates are bound.* Journal, the *Great gates* page, a line under the six rows: *Bound, all six, and held.*

From then on a bound knot will not take the tearing artifact. E at any knot, carrying it:
> *The knot will not take the edge. It holds, and five others hold it.*

The rumour pool's *Normal* lines become the *Any news?* pool's lasting default for a season (90 game days), then fall away into the ordinary pool. That is all: six bound keep the game as it is, and the itch Michael wants is left to work on its own.

**Six torn** is the ending, and what it leaves is not decided (Michael's leaning that every save is deleted; the question of whether the character's row survives the world's, under the two-row save). This piece writes no line past the cut. The ending piece asks that question when it is drafted, with its precedents and costs, as `decisions.md` says it must be.

### What in the code would carry it

- **State** (the world's row, under the co-op rules): `worldState.greatGates={tine:'torn'|'sealed', …}`, keyed by school, a missing key meaning *untouched*; `worldState.greatGatesLocked='sealed'` once six are bound. `ringSeen` per gate (the *way back*) goes in the same object (`{state, ring:true}`). Add `greatGates` and `greatGatesLocked` to `_applyLoadData`'s S242 list; neither goes in `SS_CHAR_WS` (they describe a place, not the character). Shared state through named actions: `cutKnot(school)`, `bindKnot(school)`, never assignments from a tick.
- **The corruption level** is `Object.values(worldState.greatGates).filter(s=>s==='torn').length` (`visual-foundation.md` §2; card F12 reads it).
- **The act's lines**: a `KNOT_LINES={tear:{first,again,school:{tine,…}},bind:{first,again,school:{…}},gain,cost,lockSeal,locked,ringFirst,ringBack,examine:{torn,sealed,untied}}` table beside the artifacts in `87-world-quests.js`; the prompt in `62-actions.js`'s `.ob` chain, in the dungeon branch, when the player stands within reach of the ring's knot.
- **The ring and the knot themselves** are card F5's (the far end of a great gate's spaces, `visual-foundation.md` §2); until F5, a great gate is a generated gate with a flag, and the knot can stand in its deepest room the way the Shuttle does (`buildDungeon`, `56-dungeon-build.js`).
- **The tiers**: the spell tier read (`spellTier` or its successor under magic B) takes `+1` for a torn school and `−1` for a sealed one, clamped to 1..3, applied at read time, never written into `knownSpells`, so undoing needs no bookkeeping and a save never holds a borrowed tier.
- **The talk**: `liveRumours(site)` (`87-world-quests.js`) gains `GATE_TALK[level][people]` and `GATE_TALK.normal[people]`; `worldState.greatGatesLast={day,kind}` dates the most recent act for the *Normal* window and the lords' topic. The lords' *The great gates?* topic goes in the lord's `_extraFn` by nation (`lordFor`).
- **A test** for the builder: cut a knot at an untouched Tine gate and a Tine spell at Comprehension reads Mastery, `onMasteryTouch` fires, the level reads 1; bind the same knot and the spell reads Impression and the level 0; at level 4 an Aurennais townsperson's *Any news?* can say *The Compact has a clause*; bind five, then the sixth, and the tearing artifact at any knot answers *The knot will not take the edge*; a save after the third tear reloads with the same three states and the world's row holds them.

### Checked against the canon

- *Nothing contradicts §9a*: three states, reversible, locked at six alike, power on one path, dilution on the other, undoing gives back.
- *§3.1, the Compact's sealing*: kept distinct, and the Church's confusion is written as a character's error, not the canon's.
- *§10a*: the act's lines are wonder and a little chill; the people stay funny to the fifth gate; the player is never named as the cause, and the one line closest to it (*the one who carries the knife knows where*) is an Old Blood speaker's exactness, not an accusation.
- *No chosen one*: the knot answers anyone carrying the tool.
- *§2's registers*: Gatelanders in proverbs and no bare yes (*there's no smoke without a fire*; *a field's not lost till the last row's cut*); Markmen in short sentences with no honorific; Aurennais with *Master*, qualifiers and clauses, never an oath; the Old Blood sparing and exact, with the older word (*the knot*, *the knife*).
- *Silent, chosen plainly*: what the act is done to (a knot, the loom's own figure); that the realm's master is F5's; that the six-torn ending is not written until it is decided.

---

## The Great Gates, II — the knife and the needle

*Approved by Michael, 16 Oct 2026.* *Built by the systems builder, Sessions 1353 and 1363–1367 (the knife, the note, the flagstone, the runner, Aldwyn, the needle), on main 24 Oct; §5's talk and the journal's page, Sessions 1397–1398, on main 25 Oct, word for word.* *Drafted 15 Oct 2026.* The second piece of backlog A's *The six great gates: what clearing one means*. The first piece, *the knot at the ring*, was approved on 14 Oct along with Michael's A on DECISION #292. That piece wrote the act and left its tools as *the tearing artifact* and *the sealing artifact*. This piece names them and writes every line about them: what they are, where each comes from and who hands it over, the item cards, what the Old Blood and the three powers say of them, and what they do away from a knot. Still owed, one piece a run: each gate's own reward and its cost to the world; Varek's two arcs; the Act III outline reconciled with all of it.

### What the canon fixes, and where it is silent

- *Two artifacts, "akin to Sunder and Keening from Morrowind": the player must obtain one to tear a great gate open, and is later presented with one to seal them (perhaps both at once)* (§9a, Michael 13 Oct). So there is a pair, and they come by two different roads: the tearing one is *obtained*, so the player goes and gets it, and the sealing one is *presented*, so someone hands it over. The tearing one comes first.
- *The knot is drawn tight past any fingers. It was not tied to be undone by hand* (piece I, approved). So the tools are what a hand needs to work a knot: **a knife** to cut it and **a needle** to draw the cut ends together and tie them. Piece I's Old Blood line, *the one who carries the knife*, already names the first.
- *Varek needs the gates cleared* (Part I, *complicit without knowing it*). So the knife reaches the player by Varek's doing. *He keeps notes. Asks questions* (Part I, *his voice*). So he does not hand it over in person, and his note ends with a question.
- *Aldwyn wants sealing* in Act II (Part I, Aldwyn's arc), comes *from an institution that no longer exists*, and *is Old Blood and has hidden it, and the mark on his wrist shows it* (§14, OG-053; *what that means for his hundred and fifty years is the quest writer's to write*). So Aldwyn is the one who presents the needle. That gives him an Act II beat and lets him show his wrist, and it does not explain his hundred and fifty years. That is left for his own draft. Giving him this scene adds a beat to a named character without changing what the canon says he is, so no decision is needed for it. If Michael would rather it were someone else, the hermit from *The Makers' Things* can speak the same scene, and only its first line changes.
- *The Compact's sealing of gates would, over centuries, drown the world in its own residue* (§3.1). The needle is not the Compact's. Aldwyn says so, and the Church mistakes it for its own.
- *No chosen-one prophecies* (Part I, §4.2). Neither tool waits for the player. The knife was buried by a man who could not use it, and the needle was kept for whoever would carry it. Nothing written on either one names who that is.
- *The Withdrawal* (§3.1): the makers broke their order, forbade the reading, and scattered. *Silent:* what they made on the way out. **Chosen plainly:** two tools, one to undo the six knots if the window ever had to be shut by cutting, one to tie them fast again. The knife went into the deep and the needle stayed with the few who kept the knot's craft. Varek found the first. Aldwyn's house kept the second until there was no house left but him.
- *Silent:* why Varek cannot use the knife himself. **Chosen plainly:** a great gate's antibodies rise first and thickest against whatever pulls hardest at the loom (Part I, *the central mystery*; §10a, *the antibodies rise against the player*), and after 250 years of reading nothing pulls harder than Varek. He gets no further than the door. He says it obliquely and Aldwyn half says it. Neither explains it. Piece IV, Varek's arcs, may build on this but cannot undo it.
- *The Aurennais register* (approved 14 Oct): the Norman words are dropped for Aurenne and the Church speaks the common tongue with Latin and Greek roots. **Correction to piece I:** the Church's name for the knot, *le Nœud*, is out of register since that draft. It is **the Nodus**. That is the Church's word in this piece, and piece I takes it as a small fix.

### 1. The names

| | The knife | The needle |
|---|---|---|
| **Common** (the item, the log, the journal) | **the Loosing Knife** | **the Binding Needle** |
| **Deep register** (Old Blood speakers, the card's second line) | *an Scian* (the knife) | *an tSnáthaid* (the needle) |
| **Aldwyn**, scholarly | the severing instrument | the fastening instrument |
| **The Church** (Aurennais) | the Unpicker | the Weaver's Needle (claimed, wrongly, as its own) |
| **The League** (Markmen) | the knife | the needle |
| **The Crown's Herald's office** | the Ashfeld knife (as entered in the rolls) | Aldwyn's needle |

The Old Blood use the older word for a thing, and the older word is the plain one: *the knife* and *the needle*. Their names carry no titles. The common names are the plain verb of each, so a player reading the log never has to remember which tool does what.

### 2. The Loosing Knife

**The item card** (`makeItem`, type `misc`, a quest item: it cannot be sold, dropped, stashed or stolen, and is kept on death):
- Name: *The Loosing Knife*
- Second line: *an Scian*
- Description: *A knife of grey stone, no longer than a hand and as thin as a leaf. The script on its blade runs one way only, toward the edge. It will not cut bread.*

**How it is obtained.** It is set going the first time the player reaches a great gate's ring carrying neither tool. Piece I's line *It was not tied to be undone by hand* plays at the knot. The next time the player sleeps anywhere, a folded paper is in their pack when they wake. The log says *A paper you did not put there is folded in your pack.*, and the paper is a book item, *A note in a cramped hand*, read in the book reader:

> You reached the ring of ${gate} and came away with your hands empty. I know the feeling. I have had it for two hundred years.
>
> At the Ashfeld, where the path in the grass ends, there is a flagstone. What you need is under it. I have stood on that stone every time I went there, because it was the one place I could be sure nobody would dig.
>
> I cannot carry it where you go. What it cuts stands between me and every ring, and it knows me. A woman called Orla Fenn got as far as the second hall of ${gate} in my time. She is on my list. You went further, and it let you. Why do you think that is?

The paper is not signed. The map stars the end of the Ashfeld's path, the way a rubbing stars a gate. The journal's *Great gates* page gains the line *A note says something lies under a flagstone at the Ashfeld.*

**At the flagstone** (the `.ob` prompt): *A flagstone at the end of the path — Press 'E' to lift it*

**Lifted** (`showMsg`):
> *Under the flagstone, wrapped in an oilcloth gone stiff with age, is a knife of grey stone. The grass round the stone is worn to earth in the shape of two feet.*

Log: *Took the Loosing Knife from under the Ashfeld.* Journal: *The Loosing Knife. It cuts the knot at a great gate's ring.*

**For an Old Blood player**, a second line, after 1.6 s:
> *It is warm in your hand, the way a stone is warm with a sigil under it, though there is none.*

**Away from a knot.** The knife is not a weapon and cannot be wielded. E with it at anything that is not a great knot falls through to that thing's own prompt. At a lesser gate's sigil, once per sigil:
> *The knife does nothing here. It was made for six knots and no others.*

### 3. The Binding Needle

**The item card** (the same quest-item rules):
- Name: *The Binding Needle*
- Second line: *an tSnáthaid*
- Description: *A needle of pale bone as long as a forearm, its eye wide enough to put a finger through. The script on it runs round and round and comes back to where it began.*

**When it is presented.** Whichever comes first:
1. the first time any knot is cut, or
2. the second great ring reached with nothing cut.

The next time the player enters a town after that, a Herald's runner finds them (`showMsg`):
> *A Herald's runner falls in beside you, out of breath. "The Herald asks you to call on him at Ironhaven. He says it will keep, but not long."*

Log: *The Herald has sent for you.* Journal: *Aldwyn asks to see you at Ironhaven.*

**Aldwyn's scene** (his dialogue, a topic folder *The great anchor places* that appears once the runner has come; Aldwyn, the Royal Herald, Old Blood hidden, in the scholarly register: measured, exact, *anchor places*, never *old gates*):

His opening line takes the form for whichever trigger fired:
- After a cut: "You have been to the end of one of the great anchor places, and you cut what you found there. The sky over Ironhaven told me before the runner did."
- After two rings left alone: "You have been to the end of two of the great anchor places and left them as they were. That is rarer than you would think. Most people who reach a thing like that do something to it."

Topics:

- **"How do you know about the knot?"**
  "Because I was taught to tie it. Not that one; nobody living tied that one. But a knot is a knot. The house I was trained in kept two things against the day someone came to the end of a great anchor place with an edge. One of them, it seems, was not kept well enough."

- **"Varek left me the knife."** (only with the knife)
  "He would. He has wanted that edge used since before I was born, and he has never once been able to use it himself. Ask yourself why the anchor places let you through and not him. I have asked myself for a century and a half, and I like none of my answers."

- **"What house?"**
  "One that no longer exists. It was small at its largest, and at the end it was three old men and a cupboard. I am what is left of it, and this is what was in the cupboard."

- **"What do you want from me?"**
  "Very little, and that is the difficulty. I want you to carry this."
  *(He sets a long bone needle on the desk between you.)*
  "It is the knife's opposite. It does not undo the cut. It draws the cut ends together and ties them as they were first tied, and the anchor place goes on doing its work. The Compact bricks its gates shut and calls that sealing. This is not that. Please do not let the Prior explain the difference to you."
  → the Binding Needle is added. Log: *Aldwyn gave you the Binding Needle.* Journal: *The Binding Needle. It binds the knot at a great gate's ring.*

- **"What does it cost?"** (after the needle is given)
  "I will not pretend it costs nothing. What the knife gave you, the needle takes back, and a little more. A knot tied by hand is tied with something of the hand. It is not a great deal. It is not nothing."

- **"Your wrist."** (after the needle is given; the sleeve has ridden up as he set the needle down)
  "Yes. I have kept my sleeves long in Ironhaven for a hundred and fifty years, and I find I am too old to mind who sees it now. Ask me about it another day. Not today."

- **"Which should I do?"**
  "I will not tell you. I have spent my life telling people what to do with the anchor places, and you have seen where that has left them. Go carefully. Come back and tell me what you chose. I keep a record, as you may imagine."

**If the player already holds the needle** when the first knot is cut (they reached two rings first), the runner does not come again, and Aldwyn's opening the next time they meet is: "You found the knife as well. I had hoped he would take longer to think of you."

### 4. Both at once

Michael left open whether the two come together (*perhaps both at once*). Here they come apart: the knife first, the needle after a cut or after a second ring. That keeps §9a's order, where tearing is the first thing a player can do and sealing comes later as the choice they are presented with. A player who goes to the second ring before lifting the flagstone can hold the needle first. Either way, once both are held, piece I's three-way prompt (*Cut the knot. / Bind the knot. / Leave it.*) carries the choice.

### 5. What people say of them

**Old Blood townsfolk and the hermit**, once each, when the player carries a tool (a line put before their greeting):
- The knife: "You carry the knife. Keep it out of the light."
- The needle: "You carry the needle. That one was kept, not hidden."
- Both: "You carry both. Most hands are only big enough for one."

**The three powers** (a lord's topic *The knife from the Ashfeld?*, on any lord of that nation once the knife has been lifted; the Church's line is a Prior's):
- The Crown (a Gatelander lord): "The Herald's office has a knife entered in its rolls as found at the Ashfeld, owner unknown. I'd leave it that way. A thing with no owner can't be taken off him, and the Crown takes a great deal off a great many people."
- The League (a Markman captain or reeve): "Hear you've a knife that opens the great gates. Our law's plain. It's yours while you hold it. Hold it, then."
- The Compact (an Aurennais Prior or Factor): "The Church has a word for the instrument you carry, Master. It is *the Unpicker*, and it is not used kindly. I would keep it under your coat in the capital. The Prior is courteous to everyone in the street, and remembers them afterwards."

**The Church after a seal** (a Prior, once any knot is bound, replacing nothing):
> "The Church gives thanks that a great gate has been sealed, Master, by the Weaver's Needle, which it is pleased to call its own. It has never held the thing, nor seen it. That has not, historically, stopped it."

### 6. At the lock

Piece I's lines stand. One line is added. At six bound, the knife's card gains the line *It has not cut anything since the sixth knot was tied, and it will not.* At six torn there is nothing to add, since the ending is not written (piece I, §6).

### What in the code would carry it

- **Items** (`14-items.js`, beside the Makers' tools): `makeItem` entries `looseKnife` and `bindNeedle`, type `misc`, `quest:true` (not sellable, droppable, stashable or stealable; kept on death, as the Gate-Blade is). Each has a name, a `sub` line (*an Scian*, *an tSnáthaid*) and a description. The six-bound line is a getter on the knife's `desc` that reads `worldState.greatGatesLocked`.
- **Varek's note** (`14-items.js` `BOOKS`): `varekNote`, which takes `${gate}` from the first ring reached. It is written into the bag when the player wakes, by a named action `giveItem('varekNote')` inside `sleep()` (`60-shop.js`), when `worldState.greatGates.ev.ringFirst` is set, the knife has not been lifted, and the note has not been given.
- **The flagstone**: on the legacy Ashfeld zone a prop and an `.ob` prompt at the path's end (`44-legacy-towns.js`, where the Ashfeld's props are, and `62-actions.js`'s prompt chain). In the generated world it goes at the home island's *field* (§9). The map star is a rubbing's star (`starGate`'s mechanism) set on the note's first reading.
- **The runner** (`88-world-ticks.js`, the town line, entering a site): fires once after the first cut or two rings seen without a cut. `showMsg`, log, journal.
- **Aldwyn's folder** (`22-dialogue.js`, `NPC_DEF.Aldwyn` topics; a `{label:'The great anchor places', folder:true, follow:[…]}` gated on `worldState.greatGates.ev.runner`). Each topic is gated as marked. *What do you want from me?* gives the needle through `giveItem('bindNeedle')`.
- **Saved state**, by the co-op rules. The knife and the needle are the character's, so they live in the bag (the character row). Which events have fired is the world's: `worldState.greatGates.ev={ringFirst (the gate id), noteGiven, knifeLifted, runner, needleGiven}`, nested under `ev` so piece I's count of torn gates over the object's values never reads them, inside the one `greatGates` object piece I already adds to `_applyLoadData`'s list. No new `worldState` key.
- **Talk**: the Old Blood pre-greeting lines go in `makeDef`'s greeting path (`83-world-generator.js`), keyed on `PEOPLES` `oldblood` and the bag. The lords' topic goes in `lordFor`'s `_extraFn` by nation, beside piece I's *The great gates?*.
- **A test** for the builder: reach a ring with no tool, sleep, and the note is in the bag and names the gate; lift the flagstone and the knife is in the bag and the log reads *Took the Loosing Knife from under the Ashfeld.*; cut a knot, enter a town, and the runner comes; Aldwyn's folder opens and gives the needle; the knife cannot be sold or dropped; save and reload, and both tools and the `greatGates` flags survive, the tools in the character row and the flags in the world row.

### Checked against the canon

- *§9a*: one tool obtained (dug up), one presented (handed over), and they can be held together; nothing in this piece changes the act, the undo or the lock.
- *Part I, Varek's voice*: he asks, and does not tell; he remembers a name (*Orla Fenn*) and keeps his list; he never says *player*. He does not sign the paper; his hand is enough.
- *Part I, Aldwyn*: *anchor places*, never *old gates*; he wants sealing and says so only by what he hands over; he keeps a record. His wrist is shown and its meaning is left for his own draft.
- *§3.1*: the needle keeps a gate working; the Compact's bricking is named as different, and the Church's claim is a character's error.
- *§10a*: no line says the knife does harm. The worst anyone says of it is the Church's name for it, which the player has every reason to discount. The itch stays.
- *No chosen one*: the knife was buried, the needle kept, and nothing on either names who carries it.
- *§2's registers*: the Gatelander lord in indirection, protecting an owner who isn't named; the Markman in short sentences with *our law*; the Aurennais with *Master*, a clause and a courtesy that warns, and no oath; the Old Blood in one plain sentence each, with the old word, *the knife*.

---

## The Great Gates, III — what each gate gives, and what it costs

*Approved by Michael, 16 Oct 2026.* *Built by the systems builder, Sessions 1349–1377 (the gifts, the faces and the tolls, the talk), on main 24 Oct.* *Drafted 16 Oct 2026.* The third piece of backlog A's *The six great gates: what clearing one means*. Piece I (approved 14 Oct) wrote the act at the ring and gave every tear the same gain, one tier deeper in the gate's school. It left *the gate's own reward* to be added to that line. Piece II (15 Oct, unapproved) named the knife and the needle. This piece gives each of the six its own gift to the player and its own cost to the world, and writes every line about them. Still owed, one piece a run: Varek's two arcs, and the Act III outline reconciled with all of it.

### What the canon fixes, and where it is silent

- *Owed: the unique reward for clearing each one, and its cost to the world* (backlog A, Michael 12 Oct). *A torn gate leaks: a rupture of its school* (§9a, Michael 13 Oct). So the cost is the leak, and it is of the gate's own school: a torn Tine gate leaks heat, not shadow.
- *At first tearing is almost purely good for the player, with no visible downside* (§9a). So each leak has two faces. **The first face** is a gift to the gate's country as well as to the player: a warm winter, a calm sea, a fair wind. **The second face**, the toll, shows only once three great gates are torn anywhere, the count at which piece I's talk turns from oddness to unease. A player who tears one or two gates and stops never sees a toll.
- *Undoing a choice gives back what it took* (§9a). Binding a torn gate ends its gift, its leak and its toll at once. Nothing a leak does is written into the world for good. A plague it started runs out by the rules a plague already has.
- *Sealing is the dull choice* (§9a), *neutral or even costly to the player* (Michael, 13 Oct). So sealing gives the player no gift of its own. What it gives is the gate's country kept as it was, which nobody remarks on except once, in each section's *Sealed* line (§§3–8).
- *Condition sets the strangeness: a steady gate makes the shapes the local folklore had words for; a sudden failure makes Faolchú-like things with seams still glowing* (§9a, Part I). A torn great gate is failing on purpose. So the one toll every torn gate shares is that **the lesser gates of its school make the failing forms** (§5, *below the dragon*) once the toll begins.
- *Solas gates are where the dead are burned out of the world; when one fails, the dead walk* (§9a, §3.1). *Anchor health: a backlog means undead on the roads, and then plague* (§12a). The Solas gate's leak is the Clearing failing, so it is the darkest of the six and the most canonical. Its first face is that the dead are *seen*, kindly, before they are seen walking.
- *Varek believes unbinding will let the dead stay, and whether he is right is the game's open question* (§3.1). The Solas gift answers nothing. The dead stop rising against the player, and nobody says why.
- *The sheet's placings are a starting point, not fixed: Tine, Solas and Gaoth on Aurenne, Cloch and Scáth on the Mark, Uisce in the Gatelands* (§9a). The leaks are written for the gate's **island**, and their lines are in the island's people's voice, with an Old Blood line for each. If F5 moves a gate, only the speaker of its lines moves with it.
- *Silent, and chosen plainly:* the great gates' own names. Piece I wrote `${gate}`, and so does this. Naming the six is F5's, or a later run's. *Silent too:* how big a gift may be. **Chosen plainly:** each gift rides on a rule the game already has (fire damage, breath, carrying, witnesses, the undead's aggro, the ship's speed). Each is large enough to feel in an hour's play and never touches the level or a stat.
- *The player is the real monster, never said* (§10a). No line below says the leak is the player's doing. The tolls are reported the way weather is, and the people stay funny to the end.

### 1. The six at a glance

| School | Island | The gift (the player's, while torn) | First face (the island's, while torn) | The toll (three torn or more) |
|---|---|---|---|---|
| Tine | Aurenne | fire takes half from you | no winter: the island's nights are warm, the orchards fruit twice | the springs go low and the island's herbs wither to half |
| Uisce | the Gatelands | you need no air under water | the sea round the island lies calm and the fish crowd in | storms at sea round the island twice as often, and the shoals gone |
| Cloch | the Mark | you carry half as much again | the Mark's roads stay hard in any weather | the ground shakes once a day, and rockfalls in the Mark's lesser gates |
| Scáth | the Mark | at night a witness must be near to see you | the Mark's nights are clear and very dark, with stars to the ground | Phantoms walk the Mark's roads at night |
| Solas | Aurenne | the dead do not rise against you | the dead are seen, at a distance, as they were | the dead walk Aurenne's roads, and plague in the towns nearest the gate |
| Gaoth | Aurenne | your ship sails as if the wind were always behind her | fair winds: Aurenne's ships come home early and the quays are full | gales on Aurenne that will not drop, and the cypresses lean |

And for every torn gate, once the toll begins: the lesser gates of its school make the failing forms.

### 2. The gift — the gain line, completed

Piece I's gain line is *${School} runs deeper in you while ${gate} is torn.* It now takes a second sentence, by the school, in the same menu voice (gold, one line):

| School | The gain line in full |
|---|---|
| Tine | *Tine runs deeper in you while ${gate} is torn. Fire takes half from you.* |
| Uisce | *Uisce runs deeper in you while ${gate} is torn. You need no air under water.* |
| Cloch | *Cloch runs deeper in you while ${gate} is torn. You carry half as much again.* |
| Scáth | *Scáth runs deeper in you while ${gate} is torn. At night you are seen only from close by.* |
| Solas | *Solas runs deeper in you while ${gate} is torn. The dead do not rise against you.* |
| Gaoth | *Gaoth runs deeper in you while ${gate} is torn. Your sails are always full.* |

Piece I's cost line on binding takes the matching second sentence in grey, so the player is told what went:

| School | The cost line in full |
|---|---|
| Tine | *Tine runs shallower in you while ${gate} is bound. Fire takes its full share again.* |
| Uisce | *Uisce runs shallower in you while ${gate} is bound. You will need your breath.* |
| Cloch | *Cloch runs shallower in you while ${gate} is bound. Your pack weighs what it weighs.* |
| Scáth | *Scáth runs shallower in you while ${gate} is bound. The night sees as far as the day.* |
| Solas | *Solas runs shallower in you while ${gate} is bound. The dead know you again.* |
| Gaoth | *Gaoth runs shallower in you while ${gate} is bound. You sail on the wind there is.* |

On a gate bound from untouched there was no gift, so the cost line ends after its first sentence.

**Rule read** (for the systems builder; every number is a proposal):
- **Tine.** Fire damage to the player is halved: fire traps (*Fire! N damage.*), Fire Elementals and the magma Slime, and any blow typed fire. It applies at `_warded` or its successor, after armour, before the floor of 1.
- **Uisce.** Under water the breath does not fall (`DIVE.breath` held at full). The Root is reached by ship and Water Breathing (§8.3). With Uisce torn the potion is not needed, which is the point: the gift is felt most on the way to the end.
- **Cloch.** `maxCarry()` × 1.5, applied last.
- **Scáth.** At night a witness sees a crime only from within 4 m (`witnessOf`), whatever the hood, the sneak or the perks give. By day, nothing changes.
- **Solas.** Skeletons, Wraiths and Phantoms do not take the player as a target until the player strikes one; a struck one fights as now, and so do the others in its room. Through `targetOf(e)` (co-op rules), never by reading `px`/`pz`.
- **Gaoth.** The ship's top speed × 1.5 (`shipTopSpeed`), hull and rig damage still applying.

### 3. Tine — the warm island

**First face**, while Tine is torn: Aurenne has no winter. Its nights stay warm, and its orchards fruit twice. *Any news?* on Aurenne, drawn beside piece I's lines:
- Aurennais: "The orchards have fruited a second time this year, Master, which the almanacs did not provide for. The Factors are buying every basket and the Church is calling it a blessing. Both, I suspect, are hedging."
- Old Blood: "The ground is warm at night. It should not be, this late."

**The toll**, from three torn: the springs go low, and the island's herbs come up half as thick (the herb scatter's count halved on Aurenne).
- Aurennais: "The fountains in the square are running at half, Master, by order of nobody. The cisterns are the same. The Prior has asked us to pray for rain, and the Factors have asked us to buy their water, and I find I can afford only the first."
- Old Blood: "The springs are going back into the ground. Something under it is thirsty."

**Sealed** (once, the first *Any news?* on Aurenne after Tine is bound, if it had been torn):
- Aurennais: "The cold has come back in at night, Master. Everyone has agreed to be relieved by it. Nobody has agreed to enjoy it."

### 4. Uisce — the calm sea

**First face**: the sea round the Gatelands lies calm, and `catchFish` takes twice the fish from its waters. *Any news?* in the Gatelands:
- Gatelander: "The boats are coming in so low with fish you'd think they were sinking. Old Peadar says a calm sea is the sea holding its breath. He'd say that of a bath."
- Old Blood: "The water is still all round the island. It is listening."

**The toll**, from three torn: storms at sea round the Gatelands come twice as often (`WX`), and the shoals are gone from its waters (`catchFish` takes none there).
- Gatelander: "Three boats out of Salthaven this week and two came back. The sea gave us a fat summer and now it's asking for it back. Well, what's lent is lent, they say, and you pay it in the end."
- Old Blood: "The sea has stopped holding its breath."

**Sealed**:
- Gatelander: "The fishing's gone back to what it was. Middling. You'd not think a man could be glad of middling."

### 5. Cloch — the hard roads

**First face**: the Mark's roads stay hard in rain and thaw. On the Mark a road is never mud, and a cart on it is never slowed (the look's wet road, and the prosperity drivers' *a cleared road raises both towns* counting twice there).
- Markman: "Roads are hard as iron. Thaw came and went and not a rut. Carters are singing. Badly."
- Old Blood: "The stone has come up close under the road. It is holding it."

**The toll**, from three torn: the ground shakes once a game-day on the Mark (a short camera shake and a `showMsg`, *The ground shifts under you, and is still.*). In the Mark's lesser gates, a fallen block closes one passage on each floor (the dungeon generator's blocked door, the way round longer).
- Markman: "Ground shook again this morning. Cups off the shelf. Nobody hurt. Next time, maybe."
- Old Blood: "The hills are turning over in their sleep. They will not sleep much longer."

**Sealed**:
- Markman: "Ground's quiet. Roads are mud again. Fair trade."

### 6. Scáth — the dark nights

**First face**: the Mark's nights are clear and very dark, with stars down to the hills (the look: the night sky's star field brighter, the moonlight lower).
- Markman: "Nights up here are something now. Stars to the ground. You'd see a wolf's eye at a mile. You'd not see the wolf."
- Old Blood: "The dark is deeper this month. It has more in it."

**The toll**, from three torn: Phantoms walk the Mark's roads at night, one or two to a road between towns, gone at dawn (the road spawns, at night only, from a seeded stream keyed by the road and the night: `seededRng('scath', roadId+':'+day)`).
- Markman: "Lost a carter on the Black Moor road. Not lost. Found him. Wouldn't say what he saw. Travel by day."
- Old Blood: "Things walk in the dark now that used to keep still in it."

**Sealed**:
- Markman: "Nights are just nights again. Dark. Cold. Good."

### 7. Solas — the dead seen, and the dead walking

**First face**: on Aurenne the dead are seen. Talk only, and the most unsettling talk the first face has. Nothing appears on screen.
- Aurennais: "My aunt has been seeing my grandmother in the garden, Master, at the far end, by the lemon tree, where she used to sit. My aunt is a sensible woman and has been seeing her every evening. The Church has called it grief, and has been very kind about it, and has asked her to stop."
- Old Blood: "The dead are standing a little way off. They do that when the door will not take them."

**The toll**, from three torn: the dead walk Aurenne's roads at night (Skeletons and Wraiths, a road spawn as Scáth's, keyed `'solas'`). The towns nearest the Solas gate go to plague by the rule a plague already has: a torn Solas gate counts as a gate left uncleared, whatever has been cleared in it.
- Aurennais: "The Church has stopped calling it grief, Master. It has started calling it a sickness. The dead on the roads it has not yet found a word for, and it is looking very hard."
- Old Blood: "The door is open and the dead are walking out of it. They do not know where to go. Neither do we."

**Sealed**:
- Aurennais: "My aunt has not seen my grandmother this week, Master. She says she is glad. She has been sitting by the lemon tree every evening, all the same."

### 8. Gaoth — the fair wind

**First face**: Aurenne has fair winds. Its ships come home early, and the price of every imported good on the island falls a little (the shop price's prosperity term, a point up for Aurenne's ports while Gaoth is torn).
- Aurennais: "The wind has been at our backs since the month began, Master, in both directions, which the navigators assure me is not possible. The ships come home three days early. The Compact has taken it as a sign of its own good management."
- Old Blood: "The wind has somewhere to be. It is in a hurry to get there."

**The toll**, from three torn: gales on Aurenne that will not drop (`WX` windy on the island and the trees' sway at its strongest), and the cypresses lean all one way (piece I's *two torn* line comes true on Aurenne, the look's tree kit bent).
- Aurennais: "The cypresses on the terraces are lying down, Master. Not fallen. Lying down, all the one way, like dogs at a door. Nobody has sailed in a week. The quays are full of ships that came home early and cannot leave."
- Old Blood: "The air is going out through the gate faster than it comes in."

**Sealed**:
- Aurennais: "The wind has gone back to blowing against us half the time, Master. The ships are late again. The Compact has taken that as a sign of nothing at all."

### 9. The toll every torn gate shares

From three torn, the lesser gates of each torn school make the failing forms: the same antibody, with extra limbs and broken anatomy, glowing only at its seams (§5, *below the dragon*; the bodies builder's failing forms). One foe in three in a lesser gate of that school is a failing form. When the gate is bound, the next lesser gate generated is steady again. A floor already built keeps its foes until it is left.

A guild head's line, the first time the player asks *Any work?* after the toll begins (all four peoples; `${School}` is the torn school with the most lesser gates on the speaker's island):
- Gatelander: "Mind how you go in the old gates. The ${School} ones have gone strange, and strange is a word I don't use lightly, having a brother-in-law."
- Markman: "The ${School} gates are bad now. Extra arms on things. Pay's up. So's the dying."
- Aurennais: "I should tell you, Master, that the ${School} gates are producing things the Guild's bestiary does not contain. The contracts now carry a clause for it. You may wish to read the clause."
- Old Blood: "The ${School} gates are failing. What comes out of them is unfinished."

### 10. The one line at the ring

At the moment of the tear, nothing changes from piece I: the act's lines, then the gain line in full. The toll is never announced. The first time the count of torn gates reaches three, there is one line in the log and nothing on screen, in the manner of the Guest's chapel's *It saw you*:
> *Somewhere, something gave.*

### What in the code would carry it

- **State.** Nothing new. Every gift, face and toll reads piece I's `worldState.greatGates` (torn or sealed by school) and its count of torn gates. The toll's first-time log line is one flag, `worldState.greatGates.ev.toll`, nested under piece II's `ev` so piece I's count never reads it. The sealed lines' *once* is `ev.sealSaid[school]`. No new `worldState` key.
- **The gifts** (the systems builder, `GATE_GIFT` read through one function, `gateGift(school)`, true while that school's gate is torn): Tine in `_warded` (`50-travel.js`) for fire-typed sources; Uisce in the dive's breath (`85-world-sea.js`, `DIVE`); Cloch in `maxCarry()` (`14-items.js`); Scáth in `witnessOf` (`86-world-crime.js`), at night only; Solas in `targetOf(e)` for the three undead kinds; Gaoth in `shipTopSpeed` (`86-world-crime.js`). Each is read at the moment it applies and never written into the player's numbers, so binding needs no bookkeeping and a save never holds a borrowed gift.
- **The faces and the tolls** (the systems builder for the rules; the look builder for the sky, the stars and the trees, read from the same flags):
  - Tine: the herb scatter on Aurenne halved, keyed by the herb's hash (the scatter's own rule, S533), never by `ch.treePts`.
  - Uisce: `catchFish` ×2 or ×0 in the Gatelands' waters; `WX`'s storm chance at sea ×2 there.
  - Cloch: the Mark's road wetness off (the look); the tremor as a daily `showMsg` and a camera shake (`88-world-ticks.js`, the day line); a blocked passage per floor in the Mark's lesser gates (`makeDungeon`, `52-dungeon-gen.js`, from the dungeon's own seed).
  - Scáth and Solas: night road spawns from `seededRng(school, roadId+':'+day)`, by the co-op rules. Solas's plague: the plague driver (`87-world-quests.js`, *a gate left uncleared too long*) treats the torn Solas gate as uncleared.
  - Gaoth: the price term on Aurenne's ports; `WX` windy on Aurenne; the tree kit's lean (F12's corruption reads already bend the crowns).
  - The failing forms: one foe in three of a torn school's lesser gate, from the dungeon's seed, once the bodies builder's failing forms exist. Until then this toll is words only (the guild head's line) and the rest stands.
- **The lines.** `GATE_LEAK={tine:{gift,cost,first:{aurennais,oldblood},toll:{…},sealed:{aurennais}},…}` beside piece I's `KNOT_LINES` in `87-world-quests.js`. The face and toll lines join `liveRumours(site)` on the gate's island, beside piece I's `GATE_TALK` (both pools draw, one line a time). The guild head's line goes in `guildDef`'s `offer` (`83-world-generator.js`), once, under `ev.guildSaid`.
- **A test** for the builder: tear Tine and a fire trap's hit is halved and the gain line ends *Fire takes half from you.*; bind it and the hit is whole and the cost line ends *Fire takes its full share again.*; tear Uisce and the breath holds under water for a game-minute; tear Cloch, Scáth and Solas (three torn) and the log reads *Somewhere, something gave.* once, a Markman's *Any news?* can say *Ground shook again this morning*, an Aurennais town near the Solas gate can take the plague, a lesser Cloch gate's floor has a blocked passage; bind Solas and the toll lines for Solas leave the pool, its sealed line plays once, and the plague runs out by its own rule; save and reload with three torn, and the gifts and tolls read the same.

### Checked against the canon

- *§9a*: each gate leaks its own school; tearing is good at first and its cost shows later; binding gives back what tearing took, and the world with it.
- *§3.1 and §12a*: the Solas leak is the Clearing failing, said by nobody: the dead seen, then walking, then plague by the rule the world already has. Whether Varek is right that the dead would stay is not answered; the dead in this piece are lost, not freed, and nobody says which.
- *§5*: the failing forms are the shared toll, below the dragon. **Left for later:** canon would allow a dragon where a great gate is torn worst. This piece adds none. It is a card for the bodies builder and a line for a later piece if Michael wants it.
- *§10a*: the first faces are pleasures, and every toll is told as weather by people who stay kind and funny (*having a brother-in-law*; *I find I can afford only the first*). Nobody names the traveller.
- *§2's registers*: Gatelanders in proverbs and no bare yes (*what's lent is lent*; *a calm sea is the sea holding its breath*); Markmen short, no honorific; Aurennais with *Master*, clauses and qualifiers, no oath; the Old Blood one exact sentence each, with the older word for the thing (*the door* for the gate, *unfinished* for the failing forms).
- *No chosen one*: the gifts come with the tear to whoever cut the knot, and stop when it is bound.

---

## The Great Gates, IV — Varek's two arcs

*Unapproved. Drafted 17 Oct 2026.* The fourth piece of backlog A's *The six great gates: what clearing one means*. Piece I wrote the act at the ring, piece II the knife and the needle, piece III each gate's gift and toll, all three approved (14 and 16 Oct). Each left Varek to this piece: his interest on the tearing path, his ire on the other, the meetings where he shows them, and his last stand at whichever gate would lock the six. Still owed, the last piece: the Act III outline reconciled with all of it, which is where the six-torn ending, the Root and the final monologue are placed.

### What the canon fixes, and where it is silent

- *Varek's path … at the last great gate Varek has a change of heart: he sees it will destroy everything, himself included, begs the player to stop, and fights to the death to stop them, a tragic hero at the end, before the world goes* (§9a, Michael 13 Oct). *The other path … Varek tries to stop them once or twice along the way, and the final confrontation comes just before the last great gate* (§9a). *So Varek's last stand comes at whichever gate would make the sixth match* (§9a). These are the two arcs, and the last stand's place.
- *Reversible until the sixth* (§9a). So there is no path flag to read: a player may cut three knots, bind two of them back and cut a fourth. **Chosen plainly:** Varek reads what has been done, not what was meant. Each of his beats fires the first time a count is reached (one torn, three torn, five torn; one bound, two bound, four bound), and an undo has its own short note. A player who wavers hears both arcs' beats in the order they earned them. Each line answers the act just done, so none contradicts another.
- *What turns his interest into ire on the other path is the act of binding: the first thing in 250 years to undo his work* (piece I, approved). *He gets no further than the door* of a great gate, because its antibodies rise first against what pulls hardest at the loom (piece II, approved). So every meeting is outside a gate: at a field, where he always stands (§9, the fields), or in a great gate's outer door. The last stand is in the door.
- *He believes unbinding will let the dead stay, and whether he is right is the game's open question* (§3.1). Piece III's Solas leak shows the dead first seen, then walking, lost and not kept. **Chosen plainly:** the change of heart turns on that. It begins when the toll begins (three torn, piece III's *Somewhere, something gave*). It is sure at five, when he begs. He has been wrong about what was on the other side of the knot, and he says so in his own terms: not *the dead are lost*, but *they're not with anyone*. The open question stays open for the player. Varek has answered it for himself.
- *Stop him — reseal: Varek's list gets its last entry — his own* (§11). So on the sealing path he dies at the last stand, and the last entry on his list is his own name, written before he goes to the door. On the tearing path he also dies, in Michael's words *fights to the death*, and the space under Ashenmoor stays empty: *put me at the bottom. Somebody should.*
- *His voice* (Part I): asks questions; never monologues in dialogue; tired, not defeated; remembers every name; keeps notes and refers to small things said before; uses his old name exactly once, at the first meeting, and never again. He never says *game*, *save*, *player* or *screen* (§6). Every line below keeps these.
- *Silent, and chosen plainly:* what he does to stop the player. He has two tools in the canon: words, and the unravelling of sigils that fails anchors and burns towns (§8.1). The first attempt is words, at a field. The second is force, in a great gate's door, and he withdraws when he is hurt, because he wants the last fight to be at the last gate, where it means something. **Not chosen:** failing a town's anchor to draw the player off. It would burn a settlement as a reaction to the player's choice, which is §8.1's Act II machinery and a heavier rule than *tries to stop you* needs. If Michael wants it, it replaces the second attempt and nothing else changes.
- *Silent:* how his fights go. That is the systems builder's (combat's resolver) and the bodies builder's (his rig as a foe). This piece writes when they happen, how they end and every word said.
- *His discoveries* (§6) run beside these beats and are not replaced. When a discovery and a gate beat are both due at the same field, the discovery comes first and the beat waits for the next visit.

### 1. The shape

| Beat | Earned | Where | What |
|---|---|---|---|
| **T1** | the first knot cut | the nearest field, next visit | glad; he asks what it felt like |
| **T3** | three torn for the first time (*Somewhere, something gave*) | the nearest field | doubt |
| **T5** | five torn for the first time | the nearest field | he begs |
| **S1** | the first knot bound | a note in the pack, on waking | cold |
| **S2** | two bound for the first time | the nearest field | the first attempt: words |
| **S4** | four bound for the first time | the door of the next great gate entered with the needle | the second attempt: he fights, and goes |
| **U** | an undo, either way, the first time each way | a note in the pack, on waking | one short note |
| **L** | the player comes to the door of the gate whose act would lock the six, carrying the tool that would do it | that door | the last stand, to the death |

The field beats use the field's own form (`tickVarek`): he stands there when the player comes within 420, and the hint line plays. Each beat has its own hint (§6). The notes come the way piece II's first note comes: *A paper you did not put there is folded in your pack.*

### 2. The tearing arc — interest, doubt, the plea

**T1** (greeting):
> "You cut it. I felt it from here, the way you feel a door open somewhere in a house at night. Two hundred and fifty years I've stood outside those rings. Don't tell me what you saw. Tell me what you felt in your hands."

Topics:
- **"What did it do?"**
  "It let go. That's all a knot does when you cut it. Everything it was holding is free to be something else now. Most things don't know it yet. They will."
- **"Why couldn't you do it yourself?"**
  "Because it knows me. I've pulled at it too long. You it lets through. I have the names of everyone who tried before you: Orla Fenn, Tomás of the Weir, a Markman called Hask who got further than any of them. None of them got where you got. I'd like to know why. I've stopped expecting to."
- **"What happens if I cut them all?"**
  "The world stops being held to the one shape. Lords stop being lords only because their fathers were. Children stop dying of the same three things. I've believed that for two hundred years. Ask me again after the next one."
- **"Farewell."** → "Go carefully. Not for my sake. I find I'd like you to come back and tell me what the next one felt like."

**T3** (greeting; he is sitting, not standing, with a paper on his knee):
> "Did you feel it? At dusk, three days ago. Something gave that nobody touched. I've been taking things apart for two hundred years, and I know the sound of a thing coming loose that you didn't mean to loosen."

Topics:
- **"You wanted this."**
  "I wanted change. I'm trying to tell whether this is change. A tree that grows crooked has changed. So has a tree that's falling."
- **"The dead are walking in Aurenne."** (only while Solas is torn)
  "I know. I went to see. I always thought that if the gates stopped burning them out, they'd stay. Our dead, with us. They're not with anyone. They stand in the roads trying to remember which way is home. I wrote eleven names last week. I don't know if the list is the right place for them. I don't know where else to put them."
- **"What are you afraid of?"** (when Solas is not torn)
  "That I was right about the cage and wrong about what's outside it. Those aren't the same mistake. The second one is worse."
- **"Should I stop?"**
  "I've never told anyone what to do. I've only ever asked them what they'd keep. I'm asking you now, and I find I want a particular answer, which has never happened to me before. What would you keep?"
- **"Farewell."** → "Come back to the field before you go to the next one. Humour an old man."

**T5** (greeting; he is standing facing the road the player came by, not the field):
> "One left. Sit down. Please. I've walked a long way to say this, and I'd like to say it to someone sitting down."

Topics:
- **"Say it."**
  "Don't cut the last one. I was wrong. Not about the lords. Not about the cruelty; I stand by every word of that. I was wrong about what the knot was holding. It wasn't holding the world still. It was holding the world. There's no better shape waiting on the other side. There's the shape, and then there's nothing, and the nothing has me in it too."
- **"You spent two hundred years making me do this."**
  "Yes. Put it on my list with the rest; it's long enough to take it. But don't make the list pointless. Every name on it was a price I paid for something. Cut the last knot and I paid for nothing. Áine's brother, the forty-three at Ashenmoor, the children at Ráth Dubh. All of them, for nothing."
- **"And if I cut it anyway?"**
  "Then I'll be at the door. I can't go further than the door, you know that. I'll be there, and I'll stop you, or I won't. I'd rather you didn't make me find out which."
- **"Why do you care? You wanted it gone."**
  "I wanted it changed. I've been wrong for two hundred and fifty years and only just noticed. You'll forgive an old man for wanting the world to go on long enough to be ashamed in."
- **"Farewell."** → "Bind one. Any of them. I'd sleep, I think. I haven't slept in a long time."

### 3. The sealing arc — ire, words, force

**S1** (a note, *A note in the same cramped hand*, read in the book reader; the first line changes if piece II's first note was never given, see below):
> You tied one. I felt that too. It was like a door shutting in a house I've lived in all my life, a door I spent a century getting open.
>
> I don't mind that you could. I mind that you chose to. I have written down every answer anyone has ever given me for anything. Yours will go on a page by itself, when I know what it is.

(If the player never had piece II's first note, the paper's name is *A note in a cramped hand*, and the text is the same.)

**S2** (greeting; the field):
> "Two. Two knots in two hundred and fifty years, and both of them yours. Sit down. I'm going to try to talk you out of the next one, and I'd like you to know I'm doing it, so you can't say afterwards I was clever."

Topics:
- **"Talk, then."**
  "Every lord you've met is a lord because his father was, and his father's father, back to a man with a sword and no scruples. Every famine comes round like a feast day. I've watched it go round nine times. The knot you tied holds all of it to the one shape. You've made the cage a little stronger and called it keeping the world safe. Safe for whom?"
- **"The world is good. People are kind."**
  "They are. They are. That's what makes it unbearable. Kind people, in the same ditches, under the same lords, for ever. Tell me that's what you'd keep. Mean it, and I'll write it down."
- **"Tearing them would kill people."**
  "It would. So does this, slower. The Compact bricks its gates shut, and its dead pile up behind the bricks, and nobody counts them. I count. I've always counted."
- **"Leave me alone."**
  "I will, for now. The next time I won't ask."
- **"Farewell."** → "Think about the ditches. That's all. Think about them once, the next time you're standing at a ring."

**S4**, the second attempt. The next time, after four are bound, that the player comes within reach of the outer door of a great gate that is not bound, carrying the needle, he is standing in it (`showMsg`):
> *Someone is standing in the door of ${gate}, where nobody stands.*

Greeting:
> "Not this one. I asked you once, at the field. I said I wouldn't ask again, and I keep my word. It's one of the few things I still keep."

Topics:
- **"Stand aside."**
  "I can't. I've stood aside for two hundred and fifty years, waiting for the knots to come undone on their own. You're the first thing that ever did them up again. Draw, if you're going to." → the fight.
- **"Why fight me here?"**
  "Because two more and it's done, and nobody can undo it. I'd rather lose to you here, where it can still be taken back, than there, where it can't."
- **"Leave."** (the player walks away; he stays in the door until they are out of sight, and the door cannot be entered while he stands in it)

**The fight** ends when he is brought to half his health. He steps back out of reach (`showMsg`, his words):
> "Enough. You've made your point, and I've made mine. I'll be at the last one."

He is gone, and the door is open. Log: *Varek stood in the door of ${gate}, and gave way.*

**If the player falls** in that fight, they come back as they always do, and the next time they reach the door he is still there. His greeting, once:
> "You came back. You always come back. I'm fighting the one thing in the world I can't outlast, and I knew that when I came."

### 4. Changing course — the two notes

**A cut knot bound again**, the first time (a note on waking):
- Before T3: *You tied the one you cut. Changed your mind, or trying the needle against the knife? I'd have tried it too.*
- From T3 on: *You tied one back. I don't know whether to thank you. I've decided to. Thank you.*

**A bound knot cut again**, the first time (a note on waking):
> *You cut the one you tied. I won't pretend I'm not glad. I'll only ask what changed. Something always changes first.*

### 5. The last stand

The player comes within reach of the outer door of the gate whose act would make all six alike, carrying the tool that would do it. Varek is in the door (`showMsg`):
> *Varek is standing in the door of ${gate}. He has been waiting a while.*

Piece I's *way back* (door to ring) cannot be taken while he stands there. Walking away is always open, and he stays.

#### 5a. On the tearing path (five torn; the sixth would be cut)

Greeting (if T5 was heard):
> "You came anyway. I hoped you'd sit at the field a while longer. I'd have sat with you."

Greeting (if T5 was not heard, because the player came straight here):
> "You didn't come to the field. I'd have said it there. I'll say it here. Don't."

Topics:
- **"Let me pass."**
  "I can't. I spent two hundred and fifty years bringing you here, and I'll spend what's left undoing it. Forgive me. No, don't. I've never asked for that, and I won't start at the end." → the fight, to the death.
- **"I'll go and bind one."** (only carrying the needle)
  "Then go. Any of them. I'll wait here. I've waited longer for less." (He stays until the count changes; then he is gone without a word, and the next meeting is a note: *Thank you. I'll sleep tonight.*)
- **"Leave."**

**When he falls** (his words, as the fight ends; then he is still):
> "There. You're stronger than anything I could have made. I did make you, a little. My list's in my coat. Put me at the bottom. Somebody should."

The *Worn Paper* (the list, as *The Last Entry* draft writes it, eight folds) is on him: the standard pickup. Its space under Ashenmoor is empty. Log: *Varek is dead at the door of ${gate}.* The door is open. What the cut does after this is the ending, which the next piece places.

#### 5b. On the sealing path (five bound; the sixth would be bound)

Greeting:
> "The last one. I came early. I wanted to look at the hills from here once more, before."

Topics:
- **"Before what?"**
  "Before one of us goes on the list. I wrote my own name last night, at the bottom, under Ashenmoor. It seemed only fair to be ready. If it's yours instead, I'll cross mine out. My hand's still steady enough for that."
- **"You don't have to do this."**
  "No. I'm choosing to. It's the only thing I've ever been sure was mine."
- **"Stand aside."**
  "Draw." → the fight, to the death.
- **"Leave."**

**When he falls:**
> "There. It holds. You'll keep it, then, the whole of it, as it is. I hope you're right. I hope it's worth keeping. I'd have liked to see."

The *Worn Paper* is on him, and its space under Ashenmoor has one line, in a hand steadier than the lines above it:
> *Aldred, called Varek, at the door of ${gate}, in the {season} of the {year}. He kept looking.*

Log: *Varek is dead at the door of ${gate}.* The door is open; binding the sixth knot locks the six (piece I, §6).

The last line is the only place after the Ashfeld where the old name appears, and it is written, not said. Part I's rule (*he refers to himself by his old name exactly once, at the first meeting*) is about speech and stands. A player who has followed the Aldred thread through Edna, Bram and Corwin is handed the end of it here. **For Michael:** if the name should never be confirmed, the line reads *Varek, at the door of ${gate} …* and nothing else changes.

#### 5c. If the player falls in the last stand

They come back as they always do. The next time they reach the door he is still in it, and he says, once, on either path:
> "You came back. Of course you did. I knew it when I came."

#### 5d. After

Varek does not come to the fields again on either path. His discoveries stop. The meeting at the Root, the fifth discovery and the final monologue are the next piece's to place, now that he can die at a great gate first.

### 6. Where he stands between

The field hint line (piece I's machinery, `showMsg` once per beat) by beat:
- T1, S2: *Someone is standing at the field, looking out.* (the game's own line)
- T3: *Someone is sitting at the field, with a paper on his knee.*
- T5: *Someone is standing at the field, facing the road you came by.*

Nobody in the towns talks about him in these beats. The talk of piece I goes on as before, and nobody connects the great gates to a man at a field.

### What in the code would carry it

- **State** (the world's row; Varek's life is the world's): `worldState.greatGates.ev.varek={t1,t3,t5,s1,s2,s4,undoT,undoS,doorFell,dead}`, inside piece II's `ev`, which is inside the one `greatGates` object piece I adds to `_applyLoadData`'s list. No new `worldState` key. Shared changes go through named actions: `varekBeat(kind)`, `varekWithdraw()`, `varekDies(gate)`.
- **The field beats** (`tickVarek`, `87-world-quests.js`): a `gateBeatDue()` read before `varekDue()` (§6's discoveries go first when both are due), returning the earliest earned beat not yet heard. `varekDef(site,kind)` takes the beats as kinds, with the lines in a `GATE_VAREK` table beside `VAREK_LINES`. The topics marked *only while* are `avail` checks on piece I's `worldState.greatGates`.
- **The notes** (`14-items.js` `BOOKS`; `sleep()` in `60-shop.js`): S1 and the undo notes are book items given on waking, by the same `giveItem` piece II uses for the first note, each once (`ev.varek.s1`, `undoT`, `undoS`).
- **The door** (the great gate's door prompt in `62-actions.js`'s `.ob` chain, and the entry in `goToDungeon`, `56-dungeon-build.js`): when S4 or L is due and the conditions hold, Varek stands in the door as a foe that talks first (his look from `varekDef`; a boss in `BOSSES`, `42-zone-enemies.js`, fought through combat's resolver, his target through `targetOf(e)`). S4 ends at half health with `varekWithdraw()`; L ends with `varekDies(gate)` and drops the list. **For the builders:** his moves, his health and how he fights are the systems builder's, and his rig as a foe is the bodies builder's. Until those land, this piece's words wait, and the field beats and notes can be built alone.
- **The list** (*The Last Entry*'s `worn_paper` book): on the sealing path, an eighth-fold line is added from `${gate}` and the calendar (`calDateLine`); on the tearing path, none.
- **A test** for the builder: cut one knot and the next field visit is T1, with its four topics; cut two more and the log's *Somewhere, something gave* is followed by T3, which offers *The dead are walking in Aurenne* only while Solas is torn; bind one back and the next waking gives *You tied one back*; bind from untouched to four and the next unbound great gate's door has him in it, the fight ends at half his health with *I'll be at the last one*, and the door opens; reach the locking door with five bound and the needle, fight him to the end, and the list on him ends *He kept looking.*; save and reload after S4, and `ev.varek` holds the beats heard and he does not stand in the door again.

### Checked against the canon

- *§9a*: the tearing path ends in a plea and a fight to the death at the last gate, before the world goes; the sealing path has two attempts and a final confrontation just before the last gate; the last stand comes at whichever gate would make the sixth match. Nothing in this piece changes the act, the undo, the gifts or the lock.
- *§11*: on the sealing path the last entry on his list is his own. The tearing path's ending, and §11's *help him* against §9a's six torn, are the next piece's to reconcile; this piece writes nothing past his death.
- *§3.1*: he answers the open question for himself (*they're not with anyone*) and is not told he is right or wrong; the dead are seen through piece III's Solas lines and no one explains the Clearing.
- *§10a*: he is the one awake, and he looks like the villain to the end, standing in a door. The player is never called the monster. The nearest anyone comes is his *I did make you, a little*, which makes him complicit, not the player.
- *Part I, his voice*: questions, not speeches; *tired, not defeated*; names remembered (Orla Fenn, Tomás of the Weir, Hask, Áine's brother, Ashenmoor's forty-three, Ráth Dubh's children from *The Last Entry*); notes kept (*Yours will go on a page by itself*); never *game*, *save*, *player* or *screen*. His old name is never said, only written once at the end, and that line is offered to Michael to cut.
- *Piece II*: he cannot pass a great gate's door, so he stands in one. The only time he stands where the player is going is the one place he can.
- *No chosen one*: *You're stronger than anything I could have made* is said of what the player became, not of what they were meant for.
- *The register*: Varek is Old Blood raised a Gatelander. He talks in his own voice as Part I sets it, plainly, with no proverb and no oath. The towns' talk is piece I's and is not changed.

---

## The Great Gates, V — what was bound: Act III, reconciled

*Unapproved. Drafted 18 Oct 2026.* The last piece of backlog A's *The six great gates: what clearing one means*. Piece I wrote the act at the ring, piece II the knife and the needle, piece III each gate's gift and toll (all three approved, 14 and 16 Oct), and piece IV Varek's two arcs (17 Oct, unapproved). This piece does what canon §9a leaves to the quest writer: it reconciles the Act III outline with the six knots. It says which act ends the world, which saves it, and which leaves it open. It places the Root, the fifth discovery and the final monologue, and rewrites the build's Ashfeld and Root lines that the knots now overrule. What six torn leaves behind is Michael's call, and it is asked as **DECISION #413** (below). This draft is written for A, the recommendation. Only §5's screen and §8's code change under B or C.

### What the canon fixes, and where it is silent

- **§9a (Michael, 13 Oct).** Each great gate is sealed or torn, and any choice can be undone until all six match. Six sealed lock together and protect the world indefinitely. Six torn collapse reality. Until then the world lives with whatever mix the player has left. Varek's last stand comes at whichever gate would make the sixth match. So **the knots decide the ending, and nothing else does.** The build's Root, where three rows (*Break it*, *Seal it*, *Leave it open*) end the game, is overruled on two of its three rows.
- **§11's three endings** map onto the knots plainly. *Help him — unbind* is six torn. *Stop him — reseal* is six sealed: Varek's list gets its last entry, his own, which piece IV already writes at the last stand. *The third path — stay, knowing* is the mix: the binding left open knowingly, the world living watched. The third path is the only ending the knots cannot make on their own, so it is the one the Root keeps.
- **§8.3.** Act III collapses to one authored place, the root beneath all the gates: *Discovery 5. The final beat.* Part I has the final confrontation end *not with combat but with revelation*, in the monologue. §9a has Varek fight to the death at a door. **Chosen plainly:** these are two scenes, and they come in that order. The revelation is at the Root, where he gives up on the dialogue (the monologue, Part I's deliberate exception to *never monologues*). The confrontation is at the last door, where he fights. A player who goes to the Root first meets a Varek at the last door who already knows he cannot win. Piece IV's *I knew it when I came* was written for him.
- **The monologue is Michael's text** (`quest_writing.md`, *Varek — final monologue*). It is used here word for word and in its order. Its last line, *Go home. You've done what you came to do.*, sends the player away from the Root, and that is where the third path is offered: the player can refuse to go.
- **§6, the final beat.** *A Sunday afternoon* is a design note, and *Every death written down. And I was the whole of your evening.* is already built as his answer to the player's pause. The Root draft (*The Root — the rooms beneath all the gates*, unapproved) reads the pause into three bands. This piece keeps both and puts the monologue after them.
- **§9a, Michael's leaning.** *Tearing all 6 actually deletes all of your saves and truly 'unmakes' the world.* `decisions.md` records it as a leaning, to be raised again with its precedents and costs before anything is built. §11 says the opposite thing (*remakes itself on a new seed … one carried item persist*), and the approved *The Last Entry* is built on §11. That is DECISION #413.
- *Silent:* when the knots can be reached. The great gates are places on the map, and nothing in the canon keeps a player out of one before the Ashfeld. **Chosen plainly:** the knots answer whenever the player reaches them (pieces I and II need nothing else), and the lock's ending fires whatever the act. A player who locks six before the Ashfeld has their ending, and Act II's thread simply stops. Varek is at the last door anyway (piece IV), because he has been watching since the first sigil (Part I).
- *Silent:* whether the third path locks the mix. **Chosen plainly:** it doesn't. *Leave it open. Knowing.* is a stance, not a seventh knot. The knots still answer, and a player who later makes six match gets that ending instead. §9a's *until then the world lives with whatever mix* is read literally. **For Michael:** if the third path should lock the mix as it stands, the Root's row adds piece I's *will not take the edge* line to every knot, and nothing else changes.

### 1. The shape of Act III

| Where | When | What happens | What it decides |
|---|---|---|---|
| **The Ashfeld** | Act II's climax (as built) | Varek's question; the player's answer (*stop*, *help*, *neither*) | nothing about the ending: it shapes his first lines and points at the Root and the knots |
| **The six great gates** | any time a ring is reached (pieces I–III) | cut or bind; undo by going back | the world, once six match |
| **The fields and the doors** | the counts reached (piece IV) | his interest or his ire; two attempts; his last stand | nothing; he can only delay |
| **The Root** | once its guard is dead, any time before a lock | the fifth discovery, the final beat, the monologue | the third path, if the player stays |
| **The lock** | six alike | the sixth act, after the last stand | *sealed* or *unbound* |

The quest *What Was Bound* (Varek's, given at the Ashfeld) closes on whichever ending comes first: the Root's *knowing*, the sixth bind, or the sixth cut. *Knowing* closes it. A later lock gives its own ending screen and log line, and the quest stays closed.

### 2. The Ashfeld — two answers rewritten

The question, the greeting and the *Then what are you doing to the sigils?* row stand as built. The three answers still set `S.choice` and send the player on. Two of them promised that the Root decides, and that is no longer true.

- **"Stop. Leave the gates."** (was: *… I'll be there before you, because I always am. Decide there.*)
  > "You'd have me leave it running. Then go and see what it runs on. The place beneath all the gates is on the far side of Aurenne, under the water. The Root. I'll be there before you, because I always am. Look at it, and then tell me you'd leave it running."
- **"I'll help you unbind it."** (was: *Then there is one gate left that matters, and it isn't a gate. … we'll take the last stone out with our hands.*)
  > "Then it isn't me you'll be helping. It's six knots, one at the far end of each great gate, one to each of the old words, and I can't reach any of them. You can. Under all of them, off Aurenne's far shore, under the water, is the Root, where they all run back to. Go and look at it first. I'll be there before you."
- **"Neither. I want to see it first."** As built: *"That's the first honest thing anyone has said to me on this field. The Root, then. Off Aurenne's far shore, under the water. Come and look, and then tell me what you see between us."*

**The quest** (`storyQuest('act3_root', …)` in `finishAsh`):
- Title: *What Was Bound* (as built). Giver: Varek (as built).
- Description: *Six great gates, one to each of the old words, and a knot at the far end of each. Under all of them, the Root, under the water off Aurenne's far shore. You'll need to breathe down there, or a hull to reach it.*
- Objective: *The six great gates, and the Root beneath them*

The log's *Act III — What Was Bound* line stands, with its second sentence changed: *Act III — What Was Bound. Six great gates, and the Root under the water off Aurenne's far shore.*

### 3. The Root — the revelation

The rooms, the guard, the touch and the pause are the Root draft's (§6 there), and nothing in them changes. Varek stands at the glass once the guard is dead. His greeting is as built, and the *…* row and its three bands are the Root draft's, each ending *And I was the whole of your evening.*

**Then he goes on without waiting.** The band's reply carries one row, *(Say nothing.)*, and each row after it is the same, so the monologue is read one paragraph to a node, at the player's pace. The paragraphs are `quest_writing.md`'s, word for word:

1. > "I thought I understood what was underneath. The logic beneath the stone. I spent two hundred and fifty years learning to read it. I was proud of that. I want you to know — I was genuinely proud."
2. > "And then I watched you walk through it like it wasn't there. Like the walls were suggestions. Like the rules were someone else's rules."
3. > "You were never in danger. Not really. Were you."
4. > "I built my entire life on the belief that I was the deepest thing in this world. That if I could just get far enough down, I would find the place where things could be changed. And you came from further down than that. You came from a place I don't have a name for."
5. > "I don't know if you can hear me the way I hear you. I don't know if any of this means anything to you at all. But I want to say it anyway."
6. > "I was wrong about the arithmetic. Not about the cruelty — the cruelty is real, I stand by every word. But I was wrong about what I was. I thought I was the variable that changed everything. I was just... a very determined piece of the puzzle. Weren't I."
7. > "Tell me — wherever you come from. Does it get better? For them, I mean. The ones I was trying to help."
8. > "It doesn't matter. Go home. You've done what you came to do."

The writing doc's stage directions (*a long pause* after the third, *he doesn't wait for an answer* after the seventh) are the player's own pauses on the *(Say nothing.)* rows. They are not printed.

After the eighth, two rows:
- **"Leave it open. Knowing."** As built: *"Stay, then. Knowing. That's more than any of us managed. Once in a long while someone will say a thing about you and go back to their bread, and you'll know what they meant. So will I."* → the open ending (§4).
- **"Farewell."** → *"Go on, then. The knots are where they were. So am I."* He stays at the glass until the player leaves the Root. He is not there again, and the fields' beats (piece IV) go on.

**The build's other two rows go.** *Break it. Let the world unbind.* and *Seal it. Close the window.* are removed with their answers. The world is unbound or sealed only at a knot.

**Once heard**, the monologue is kept (`story.rootSpoken`), and two of piece IV's lines take a form that remembers it:
- **T5, "Say it."**, its first sentences: *"Don't cut the last one. I told you at the Root I was wrong about what I was. I was wrong about what the knot was holding, too. It wasn't holding the world still. It was holding the world."* The rest of the line is piece IV's.
- **The last stand (5a and 5b), the greeting**, a sentence put first: *"You didn't go home."*

### 4. The open ending — the third path

*Leave it open. Knowing.* calls `ending('open')` as built: `worldState.knowing`, the log line *The Root left open, knowing.*, and the ending screen *LEFT OPEN, KNOWING*, whose three lines stand. *Back to Their Bread* (built, Session 1030) reads `knowing`: the descriptions in the towns, and Varek at the fields at a distance.

What is new: the knots still answer. Varek's arc beats stop (he has asked the player to stay, and they have). His last stand does not: if the player goes on to make six match, he is at that door (piece IV §5). On the sealing path the line he wrote under Ashenmoor stands. On the tearing path the list stays empty below Ashenmoor. The lock's ending follows as below, and `knowing` stays set.

### 5. The lock — the two endings at a knot

#### Six bound — *the window narrowed*

Piece I §6's lines play (*The knot is whole, and five others answer it …*), and its log and journal lines stand. Then, after 2 s, `ending('sealed')`: the log *The six great gates are bound, and held.* (in place of the Root's *The Root sealed. The window narrows.*), and the ending screen:

- Title: *THE WINDOW NARROWED* (as built)
- Line: *The knots hold, each to each. The stones keep their warmth and give a little less of it. The world is as it was, and safe, and yours to walk.* (was: *The reading stops. The stones go cold for good. The world is smaller, and safe, and yours.* The knots thin a school by a tier (piece I) and stop nothing, and six sealed keep the game as it is, by Michael's word, so *cold for good* and *smaller* say too much.)
- Second line: *Varek's list has its last line.* (as built)
- The button: *Go on* (as built). The game goes on, and so does everything in it.

The Root afterwards is the Root draft's *Sealed*: stone where the black was, cold, no prompt, no Varek. A player who never went down finds it that way and never hears the monologue. That is what not looking costs.

#### Six torn — *the loom released*

The sixth cut can only be made past Varek, dead in the door (piece IV §5a), with his list in the player's pack and nothing written under Ashenmoor.

**At the knot, before the cut.** Piece I's three-way prompt keeps its rows, but at the sixth the first row reads *Cut the last knot.* Choosing it asks once more (`showMsg`, then the rows *Cut it.* / *Not yet.*):
> *This is the last of them. Cut it, and there is no coming back to this world.*

(Under B, a second sentence: *Nothing you have made here will be kept.*)

**The cut.** Piece I's tear lines do not play. In their place, three lines, each timed by the clock and not by frames (the dropped-frame rule):
> *The knot parts, and there is no knot left anywhere to answer it.*

after 2.5 s:
> *The colour goes out of the ring, then out of the hall, then out of your hands.*

after 5 s:
> *Far off, every gate on the three islands opens at once, like a breath let out.*

The look's last stage (card F12) runs under these lines: black and white, then nothing. The music stops at the first line (no cue of its own, as the burn has none).

Then `ending('unbound')`: the log *The six great gates are torn. The world unbinds; a new book begins.* (in place of *The Root broken.*), and the ending screen:

- Title: *THE LOOM RELEASED* (as built)
- Line: *Everything held comes loose, gently, the way a hand opens. The coasts you walked are not there to walk. Somewhere a new one is being drawn, with your name in the first line of it.*
- Second line: *A new world waits at the title screen — the same name, the same people, one thing carried through. This one is gone.*
- The button: *Go on*, which goes to the title screen, not back to the world.

**What *gone* means (DECISION #413).** Under **A**, this slot's world row is deleted and stamped unmade, so neither *Continue* nor an import can open it again. The character row goes on to the new seed through `og_carry` (as built: name, people, look, one item). The new game wakes in the Crypt of First Light, and *The Last Entry*'s Worn Paper lies at the foot of the sarcophagus: the same list he died with, empty below Ashenmoor. Other slots are untouched. Under **B** and **C** the screen's second line changes (below), and *The Last Entry* is never found.

- **Under B** (every save): line, *Everything held comes loose, gently, the way a hand opens. Nothing is left that was held: not the coasts, not the towns, not the one who walked them.* Second line, *There is nothing to go back to.* The button is *Go on* to an empty title screen.
- **Under C** (this slot, whole): line as A's. Second line, *This one is gone, and so is the one who walked it.* The button is *Go on* to the title screen, with the slot empty.

### 6. Before the Ashfeld

A player can reach a great ring in Act I or II (the knife's note needs only a ring, piece II). Nothing in this piece waits on the act:
- The lock's endings fire whatever the act. After a sealed lock, Act II's thread goes on as built where it can. Varek is dead, so the Ashfeld never fires, and Corwin's and Oswy's lines stand.
- *The Root* is reached only through *What Was Bound*'s directions, so a player who locks first and never had the Ashfeld finds the Root by the map, sealed or after the world.
- An unbound lock before the Ashfeld ends the game as above. The Last Entry's list says what it says. It was written over two hundred and fifty years and does not depend on when it was found.

### What in the code would carry it

- **The Ashfeld** (`tickAshfeld`, `88-world-ticks.js`): two `fn` return strings replaced, word for word (§2), and `finishAsh`'s `storyQuest` description, objective and log line.
- **The Root** (`tickRoot`): the `…` row's follow becomes a chain of eight *(Say nothing.)* nodes carrying the monologue, the last with the two rows of §3. *Break it* and *Seal it* are removed. `story.rootSpoken=true` on the eighth (inside `story`, which the load already reads back; no new `worldState` key). The Root draft's band and room code is that draft's.
- **The endings** (`ending(kind)`): `'open'` as built. `'sealed'` and `'unbound'` move from the Root rows to the lock, called by piece I's `bindKnot`/`cutKnot` when the act makes six alike, through one named action, `lockGates(kind)`. That action sets `worldState.greatGatesLocked`, writes the log line and calls `ending(kind)` after the lines' timers. `ending()`'s log lines and `endingScreen()`'s texts change as §5 gives them. Only `'unbound'`'s button goes to the title.
- **The world's end under A** (`70-saves.js`): one named action, `unmakeWorld(slot)`. It runs after `og_carry` is written. It deletes the slot's world row (`ssWorldKey(key)`) and leaves a stamp in its place (`{unmade:true, at}`), which `ssLoad` and `ssImportFiles` refuse with *That world is gone.* The character row stays, and the creator's `_ogCarry` path is unchanged. Under B, the action clears every `SS` key and `og_carry` too. Under C, both rows of the one slot go.
- **The confirm at the sixth cut**: piece I's prompt rows (`62-actions.js`, the knot's `.ob` branch) read `gatesTorn()===5 && state!=='torn'` to give *Cut the last knot.* and its confirm.
- **The look**: card F12's stage reads the torn count. The sixth is a stage of its own, run over the cut's five seconds.
- **The lines**: an `END_LINES` table beside `KNOT_LINES` (`87-world-quests.js`): the confirm, the three cut lines, the two log lines and the screen texts.
- **A test** for the builder: the Ashfeld's *help* answer returns the new line and the quest's objective reads *The six great gates, and the Root beneath them*. At the Root, after the guard, the *…* band is followed by eight *(Say nothing.)* nodes in the writing doc's order, then *Leave it open. Knowing.* and *Farewell.*, and no *Break it* or *Seal it*. *Knowing* sets `worldState.knowing`, and a knot still answers after it. With five bound, binding the sixth logs *The six great gates are bound, and held.* and shows *The knots hold, each to each.*, and the game goes on. With five torn and Varek dead, *Cut the last knot.* asks once, the three lines come at 0, 2.5 and 5 s by the clock, and under A the slot's world row is gone and stamped while the character row and `og_carry` remain, *Continue* refuses the slot, and a new game from `og_carry` lays the Worn Paper.

### DECISION #413 — what six torn leaves

Michael's leaning (13 Oct) is that tearing all six deletes every save. §11 says the world remakes itself on a new seed with the player's name, people and one item, and the approved *The Last Entry* puts Varek's list in the first gate of that new world. Since Session 456 a slot is two rows, the character's and the world's.

- **A. This world ends; the character goes on** *(recommended)*. The slot's world row is deleted and stamped unmade, so it can't be continued or imported back. The character carries to a new seed (§11, as built), and the list waits in the first gate (*The Last Entry*). Other slots are untouched. The itch is paid in full: the world the player made is truly gone, and nothing they didn't stake is taken. The two-row save was built for exactly this split.
- **B. Every save ends.** Every slot, every character, and `og_carry`: the title screen as if the game had never been opened. This is NieR: Automata's ending E, where the player is asked to give up their save and it is deleted. Doki Doki Literature Club deletes a character's file to make the same point. Costs: it takes slots the player never staked; an exported file outside the browser survives it, so it is never quite total; §11's new seed and *The Last Entry* go; and the warning at the knot has to say so plainly, or the first player it surprises will be the last who trusts the game.
- **C. This slot ends, both rows; other slots stay.** The character dies with the world. There is no new seed, no carried item and no list, and other characters are kept. It sits between A and B: total for what was staked, and nothing more.

### Checked against the canon

- *§9a*: the knots alone decide; six bound lock and keep the game as it is (the screen's *Go on* returns to it); six torn end it; the mix stays open; Varek's last stand is at the sixth door on both paths, and nothing here moves it.
- *§11*: the three endings are kept and mapped (six torn, six sealed, the mix chosen knowingly). *Help him*'s new seed, carried item and list in the first gate stand under A, the recommendation. *Stop him*'s last entry is Varek's own (piece IV). The third path's *sigils return, magic deepens* is the open screen as built, and *Varek is seen, at a distance, at fields* is *Back to Their Bread*.
- *§8.3*: the Root is the one authored place, with discovery 5 and the final beat. The monologue is there because §8.3 puts *the final beat* there, and Part I's *ends not with combat but with revelation* is kept for the revelation. The combat is §9a's and comes after.
- *Part I, his voice*: the monologue is Part I's own exception, *a monologue because he has finally given up on the dialogue*. Everywhere else he asks. *Weren't I.* is the writing doc's, kept.
- *Part I, the final monologue's note*: *there is no one left who cares enough to drive the change he sought*. On both paths he dies at a door after the Root, so the note holds by the time the world is decided.
- *§10a*: nobody calls the player the monster. The nearest anyone comes is *You were never in danger*, which the player can take as they like. The surface stays high fantasy to the lock. The horror is the cut's three lines, and they are the player's own act, described.
- *§6*: never *game*, *save*, *player* or *screen* in anyone's mouth. The ending screen is narration, and it says *world* and *slot* nowhere. *This one is gone* is the nearest it comes.
- *No chosen one*: the Root asks what is between them. It does not say what the player was for.
- *Register*: Varek only, in his own voice. The narration is the game's: second person, present tense, what is seen first.

---

## Sea Legends, I — the ships' names, the singing ship, and the tales at the quay

*Unapproved.* *Drafted 19 Oct 2026. Backlog L, Sea legends (OG-049): "named ships, a ghost ship heard singing in fog (rare and eerie, not grim), the Whispering Deep, the Veiled Isles, wrecks to dive (the Sunken Library); figureheads, charts and instruments as rewards." This first run covers the named ships, the singing ship and its chart, and the three tales told at the quay. The Sunken Library, the figureheads and the instruments are a second run.*

### What the canon fixes, and where it is silent

- *Three islands, three nations* (§1). The sea between them is *a road, not a wall* for Aurenne, *known for ships that come back* (§1.3). The Mark's free captains prey on Crown and Compact shipping, and *every hull that passes is tithed* by the Compact (§1.3, §1.4).
- *The dead persist as drift*, and the sigils, *carved over a grave*, are where they are burned out so the loom can hold the living. *Undead are the uncleared* (§3.1). Áine: *we pay rent to the sea by losing one of ours every winter*. A crew drowned at sea never reaches a gate. The canon does not say what becomes of them, and this draft does not say either. The Old Blood's name for the singing crew, *the graveless*, is as near as anyone comes, and it is exact without explaining.
- *An Mhuir, the Sea*: tides, ships, whales; *the sea owns them twice a day* is scripture (§4.1). The Drowned Bell is hers (*The Makers' Things*, approved and built).
- §10a: the surface is high fantasy, *wonder, colour and adventure*, and locals treat the strange as ordinary. So the singing ship is a story every harbour tells with a straight face, and when the player meets her she is sad and a little funny, not frightening.
- *Silent:* any island beyond the three. The Veiled Isles stay a tale here, islands seen in fog and never landed on. Adding land would be Michael's call, so this draft adds none. The Whispering Deep is a tale too, and every people puts it off someone else's coast. Naming a real place for either is left for the second run, with the Sunken Library.
- *Silent:* ships' names. The code has one list of ten (`SHIP_NAMES`, `84-world-interiors.js`), all in the Markish register, and it includes *Kestrel*, which is Oswy Blackhand's ship (`story:oswy`). A player can buy a ship with the villain's courier's name. §1 below fixes that.

### The shape

No quest is given. The pieces can be found in any order, and nothing is lost by missing them.

1. **Ships have names.** A ship you buy is named by the yard that built her, in its nation's register. A merchantman you pass at sea has a name too, and the prompt says it.
2. **The singing ship.** Rarely, in fog, far out at sea, you hear a crew singing, and then you see her: a grey ship whose sails are full on the wrong side of the wind. You can follow her, but you never reach her. When the fog thins she is gone, and the first time you see her, she leaves a chart case floating on the water.
3. **The chart and the wreck.** The chart has no coast on it, only soundings closing on one mark. The mark is a wreck on the sea bed, already in the world. Her sea chest holds the last pages of the ship's log.
4. **The log.** Any harbourmaster will take it. An Aurennais harbourmaster closes a ledger the Compact has kept open for ninety-one years and pays the finder's fee under the old terms. The others send it east and take a third for the trouble.
5. **The tales.** At every harbour, and from the innkeeper of any port, *Any tales of the sea?* gives one of three legends in the speaker's own voice: the singing ship, the Whispering Deep, or the Veiled Isles.

**What it changes.** Nothing in the world's shape. One ledger closes. Afterwards the Aurennais harbourmasters tell the singing ship's tale differently, and she still sings.

**Reward.** The finder's fee: 180 gold from an Aurennais harbourmaster, 120 from any other. The chart and the log can be kept, read, or sold for nothing. No stat, no boon.

### 1. Ships' names

**The player's ship** takes her name from the yard's nation (`nationKeyOf` at the port where she is bought, or the Compact's port for `grantShip`), rolled from a stream keyed by the port's id. Today the name comes from `Math.random`; a name is saved, so under the co-op rules it is rolled from a seeded stream. The Compact's grant takes the Aurenne bank.

| The Gatelands | The Mark | Aurenne |
|---|---|---|
| Faoileán *(the gull)* | Grey Gull | Mercy |
| Réalt na Maidine *(the morning star)* | Salt Heron | Good Account |
| An Bhó Rua *(the red cow)* | Marrow | Constancy |
| Cara *(friend)* | Ember Wake | Thalassa |
| Fáinne Geal *(the bright ring, the dawn)* | Lantern | Berenike |
| Siúlóir *(walker)* | Cormorant | Second Tithe |
| Cuach *(the cuckoo)* | Old Ram | Witnessed |
| An Tobar *(the well)* | Wandering Oar | The Prior's Leave |
| | Bad Penny | |
| | Short Answer | |

- The Mark's list is the code's own, less *Kestrel* (Oswy's) and *Mercy* (which goes to Aurenne: Markmen scorn the priests who would have named her). *Bad Penny* and *Short Answer* are new.
- The Gatelands name their boats as they name their children, in the old tongue. *An Bhó Rua* is a joke the Gatelands enjoy: a horse-and-cattle people naming a ship for the thing they know best.
- Aurenne names its hulls for virtues and the terms of a contract, and sometimes for the house's daughters (*Thalassa* and *Berenike* are in the Aurennais Register's bank). *Witnessed* is the Compact's highest praise. *Safe Return* is never rolled (§3).
- A ship already saved keeps her name. A saved ship named *Kestrel* keeps it as well; it is the player's, and nobody remarks on it.

**Merchantmen at sea** (`spawnOtherShip`, kind `'merchant'`) take a name from the bank of the nation whose waters they are in, rolled from their own id's stream, so the prompt reads *Press 'E' to climb aboard the Good Account*, not *a merchantman*. In the log and in lines they are *the {name}*. The black-sailed ships keep *a black-sailed ship*: the free captains paint their names out. Oswy's *Kestrel* is unchanged.

### 2. The singing ship

**When.** At sea in fog (`WX.type==='fog'`), on deep water (`worldH` below −20), at least 900 from any site. Once in a fog spell at most, and never twice in a game day: the roll is `seededRng('singer', <cell>:<game day>)`, one in four. Fog at sea is rarer than fog ashore (`weatherWeights`), so most players meet her two or three times in a long game, and some never do.

**What you see and hear.** She stands 150–200 off the bow, a cog of the merchantman's lines with grey canvas and no lamp lit. She keeps that distance at the player's speed. A crew's voices come from her, a hauling song, quiet, in the common tongue. Nobody is on her deck. Narration, in the log and on screen, in the game's own voice (second person, what is seen first):

- On the first sound: *Somewhere in the fog, a crew is singing.*
- When she shows: *A ship stands off your bow in the fog. Her sails are full on the wrong side of the wind.*
- With the Drowned Bell aboard, once: *The bell in your hold rings once, though the sea is flat.*
- At 100 or closer: *You can make out the words now.* Then the verse, line by line in the log (below).
- At 60 or closer, or when the fog thins: *The fog closes, and opens, and she is not there.*
- The first time only, when she has gone: *Where she was, something is floating.* A chart case lies on the water there for the player to take (*Press 'E' to take the chart case*). On taking it: *A chart case, sealed with wax. It is dry inside.*

**The verse.** One verse a meeting, the first, then the second, then the first again.

> *Haul, and the harbour light is lit,*
> *haul, and the book is open;*
> *we're owed at the quay and we're owed at home,*
> *and the sea has kept us waiting.*

> *Haul, for the tithe is paid ahead,*
> *haul, for the hold is dry;*
> *there's a name in the book by the harbour door,*
> *and nobody's crossed it off.*

The song is a pump-and-capstan song of the Compact's crews, the kind of thing the log (§3) says they sang at the pumps. It is not a hymn or an oath, and it does not mention a god. It is wistful and a little proud. The crew think they are on their way in.

**She cannot be boarded, struck or caught.** Arrows and spells pass through the grey canvas without a sound (no hit, no `volley`). The prompt never offers *climb aboard*. Sailing at her closes the gap to 60, and then she is gone.

### 3. The chart and the wreck

**The Singer's Chart** (an item, `type:'misc'`, `story:'singer_chart'`, weight .2, sells for nothing). Read in the bag:

> A sea chart drawn in a careful hand. There is no coast on it. There are soundings, hundreds of them, in fathoms, closing in from every side on one mark. Some of the ink is fresh.
>
> In the corner, in the Compact's form: *The Safe Return, out of {port}. Master: Hanno. Tithed at the light.*

`{port}` is the Aurennais port nearest to the wreck. While the chart is in the bag and the log not yet taken, the map and the compass star the wreck as *The Safe Return*.

**The wreck** is one already in the world: the nearest wreck to where the ship vanished. A chunk holds a wreck when `hash01(cx,cz,150)<=.06` and its depth sample finds water between −2.5 and −8 (`spawnWreck`), so it can be found by scanning chunks outward, without loading them. Its id is the wreck's own (`wreck:<cx,cz>`). Its chest holds what it always held, with the log added once:

**The Safe Return's log** (`type:'book'`, a lore book like the sigil treatises, `attr:null`, `story:'safe_log'`). Its title, *The Safe Return — the last pages*. Its text is in the Aurennais institutional register: formal and exact, and it swears no oath.

> *The fourth day out of {port}. Wind fair, north-east. Hold: salt, glass in straw, forty bales of dyed cloth, entered and tithed at the light. Crew of eleven, all well.*
>
> *The fifth day. Wind failing. Sounded at the second bell and found the bottom where the chart has it.*
>
> *The sixth day. Fog. We stand off and sound, as the terms require, and do not close a coast blind. The men sing at the pumps, which is not required, and which I permit.*
>
> *The seventh day. Fog. The soundings do not agree with the chart. I have redrawn them.*
>
> *The eighth day. Fog. I have redrawn them again. The men ask me how far we are from {port}. I tell them the truth, which is that we are expected.*
>
> *The ninth day. Fog. We are expected.*

The rest of the pages are blank. Nothing in the log says what happened, and nobody in the game ever says it.

### 4. The log, at the harbour

A topic on every harbourmaster while the log is in the bag: ***The Safe Return's log.*** (`quest:true`). Each answer is the speaker's people's (`peopleOfNpc`). The fee is paid, the log is taken out of the bag, and the world's ledger closes.

**Aurennais:**
> "Forgive me, Master — may I? … Yes. The *Safe Return*, out of {port}. She has been carried in the Compact's books as expected for ninety-one years. The tithe on her cargo is still accruing; I believe it is the largest sum the light is owed. With your leave, I shall enter her now. The Compact pays a finder's fee on an entered hull, under the old terms, and the terms are generous, because they are so seldom met."

**Gatelander:**
> "A log off a hull nobody's found in ninety years. The sea gives back what it's done with, they say, and never a day before. That's an Aurennais hand, and they'll want it more than we do, and pay for the wanting. Leave it with me and it goes east on the next boat. Here's your share of the fee, and I've kept a third for the sending. By the Weaver, I'd not have gone down for it myself."

**Markman:**
> "The tithe-men's ghost. Aye, I know the name. Every crew does. You went down for her? Iron and blood. The ledgers will want this, and they'll pay for it, and count the coins twice while they do. I'll see it goes. Here's yours. I kept a third. Sending costs."

**Old Blood:**
> "*An lucht gan uaigh.* The graveless. We had a name for that crew before they had a ship. It will go east. Here."

Log, every people: *Handed the Safe Return's log to the harbourmaster at {site}. {fee} gold.*

**Afterwards**, an Aurennais harbourmaster's *Any tales of the sea?* gives this in place of the singing ship's tale:
> "The *Safe Return* is entered, Master; I saw the line drawn myself. I am told she still sings. The ledger is satisfied. It seems the sea keeps books of its own."

And the singing ship still comes in fog, with the same two verses. Finding her log closes the Compact's ledger, and the crew sing on.

### 5. *Any tales of the sea?*

A topic on every harbourmaster, and on the innkeeper of any port (`site.kind==='port'`). The tale is one of three, picked by the site's id, so a harbour always tells the same one and the player has to go about to hear all three. The speaker's people decides the voice (`peopleOfNpc`).

**The singing ship**

- *Gatelander:* "There's a ship sings in the fog, out past where the gulls turn back. Grey canvas, full on the wrong side of the wind. If you hear her, my grandfather said, give her a verse back and she'll give you the road home. He never heard her himself. He said that was the proof of it."
- *Markman:* "The Choir. Aye. Grey ship, sings in fog. Don't answer her. Old Wulf answered her once off the strait and sang every watch for a year after. Couldn't stop. Good voice, mind. Better than before."
- *Aurennais:* "There is a vessel, Master, that is heard in fog and not otherwise met. The Compact's harbours carry her as expected. It would be discourteous to strike her from the books while she is still, so to speak, under way. The crews call her the *Safe Return*. That was her name. One assumes it still is."
- *Old Blood:* "*An lucht gan uaigh.* The graveless. They sing because nobody buried them."

**The Whispering Deep**

- *Gatelander:* "Off the Mark there's deep water that talks. Lie on the deck on a flat night and you'll hear it under the boards, like a house full of people in the next room. The Markmen will tell you it's off our coast. It's off theirs. Water that talks never tells you where it is."
- *Markman:* "Deep water that whispers. Off Aurenne, they say. Tithe-men's water. Wouldn't fish it. The fish there know too much."
- *Aurennais:* "The Whispering Deep is said to lie off the Gatelands, Master, where the water goes down past any line we carry. I have not sounded it myself. I am told the voices are courteous, which is more than one may say of the Gatelands' harbours."
- *Old Blood:* "*An Duibheagán Cainte.* The deep that speaks. Do not answer. It is not speaking to you."

**The Veiled Isles**

- *Gatelander:* "The Veiled Isles? You'll see them in a fog, three of them, green to the water's edge, with smoke going up from a chimney. You'll not see them twice. The Aurennais have them on their charts as a question, and I'd call that the most honest line on any chart they ever drew."
- *Markman:* "Islands in the fog. Never the same ones. Every captain's seen them. No captain's landed. Iron and blood, I'd land. Nobody's asked me."
- *Aurennais:* "Our charts mark the Veiled Isles as *unconfirmed*, Master, which is a term of art. Twice the Compact has sent a factor out to tithe them. Twice the factor has come back with an excellent account of the fog."
- *Old Blood:* "*Na hOileáin faoi Cheo.* The islands under fog. They are there when it is."

Each people's jab at another is about work and harbours (the Aurennais on the Gatelands' harbours, the Markman's *tithe-men*), and §2.1 already gives the other side of each: *Their ships come back. Ours don't.* — *Their steel's better than ours and they know it.* — *Nobody keeps a field or a promise like a Gatelander.* The Gatelander's *the most honest line on any chart they ever drew* is a back-handed compliment, and the Aurennais would take it as one.

### What in the code would carry it

- **The names** (`84-world-interiors.js`): `SHIP_NAMES` becomes `SHIP_NAMES_BY={gatelands:[…],mark:[…],aurenne:[…]}` (§1). `SHIP_NAMES` is read in one place, `spawnShip` (`85-world-sea.js`), and only when no name is saved. `buyShip(site)` and `grantShip(seat)` pass the port to it, and the name is `pick(seededRng('shipname',port.id),SHIP_NAMES_BY[nationKeyOf(...cellOf(port.x,port.z))])`. In `spawnOtherShip`, a merchant's `name` is `'the '+pick(o.rng,SHIP_NAMES_BY[nationKeyOf(...cellOf(x,z))])`. The stream is the ship's own, already seeded by its id. **Buildable now**, on the machinery the game has, with a suite: a ship bought at a Markish port, at an Aurennais port and at a Gatelands port takes a name from that bank, the same port gives the same name on a second run, *Kestrel* is in no bank, and a merchantman's climb prompt names her.
- **The tales** (`84-world-interiors.js`, the harbourmaster's `makeDef` topics; the port innkeeper's topics in `83-world-generator.js`): one topic, `{label:'Any tales of the sea?',response:()=>seaTale(site,people)}`, with `SEA_TALES={singer:{gatelander,markman,aurennais,oldblood},deep:{…},isles:{…}}` and the entered line, in `87-world-quests.js` beside the other quest hooks. The pick is `['singer','deep','isles'][cellHash-of-site.id % 3]`. **Buildable now** too, with a suite: every harbourmaster has the topic, its answer is that site's tale in the speaker's people's voice, and it is the same on a reload.
- **The singing ship** (systems, look, and the sound; filed in backlog A under this draft's name):
  - *Systems*, `85-world-sea.js`: a tick beside `tickOtherShips` that rolls the meeting (§2's rule and stream), keeps her 150–200 ahead, never offers the climb prompt or takes a hit, drops her at 60 or when the fog thins, and on the first meeting floats the chart case. The record is `worldState.seaTales={verse:n, chart:'<cx,cz>', log:1}` (the character's: it is what you have seen and carry; in `SS_CHAR_WS` and the S242 list), and the ledger, `worldState.safeReturn={entered:'<site id>', day}`, is the world's (the S242 list only). The wreck is found by scanning chunks outward from where she vanished with `spawnWreck`'s own test, without loading them. `spawnWreck` adds the log to that wreck's chest when `seaTales.chart` names it and `seaTales.log` is unset. Taking the log sets `seaTales.log` through one named action, `takeSafeLog()`; the turn-in is `enterSafeReturn(site)`. Both are co-op rule actions, and every roll is seeded.
  - *Look*: a pale look for the cog, `buildShipMesh(cls.L,cls.W,'singer')`: grey canvas bellied against `windDir()` (`shipTrim` with the sign flipped), no lamps, an empty deck; in fog only, so no far copy is wanted.
  - *Sound*: a crew's hauling song, voices without words that can be made out, under the fog's own sound, fading in at 250 and out at 60. The verse is given as text in the log, so the sound never has to carry words.
- **The words** (the quest writer, once the systems land): the narration lines (§2), the verses, the chart's and the log's text (§3) in `BOOKS` with `attr:null`, the turn-in topic and its four answers (§4), all in a `SINGER_LINES` table in `87-world-quests.js`.
- **A test** for the encounter: with fog forced (`devWeather('fog')`) on deep water and the stream's roll forced, she appears 150–200 ahead and holds it for 600 ticks at full sail. An arrow at her hits nothing. At 60 she is gone, and the chart case floats. Taken, the chart stars one wreck, and that wreck's chest holds the log. The log given to an Aurennais harbourmaster pays 180 and sets `safeReturn.entered`, and the next Aurennais tale is the entered line. Both keys survive a save and a load, in their own rows.

### Checked against the canon

- *§3.1*: the drowned crew are not said to be anything. *The graveless* is the Old Blood's older name for them, true and exact, and it points at the graves the sigils are carved over without saying why that matters. The player who has read *The Words on the Stones* may make the connection.
- *§2, the register*: Gatelanders in proverbs and indirection (*the sea gives back what it's done with*, *he said that was the proof of it*), never a bare yes or no, the oath on the Weaver. Markmen short, *aye*, a nickname (*Old Wulf*, *the Choir*), the oath on iron and blood, no honorific. The Aurennais formal, *Master*, qualified, in contracts and ledgers (*entered*, *under the old terms*, *a term of art*), and never an oath. The Old Blood sparing, answering with the older name for the thing.
- *§2.1*: each people's jab is about work and harbours, never bodies, and each is answered elsewhere by a named person or in §2.1 itself.
- *§1.3*: *known for ships that come back*. The singing ship is the one Aurennais ship that didn't, and her own harbours still carry her as expected. The Compact's tithe on the dead ship is still accruing.
- *§10a*: a pleasant surface with a dry turn. The crew think they are on their way in, the Veiled Isles have been tithed twice, and the fish in the Whispering Deep know too much. The eerie part is the ship's sails on the wrong side of the wind and the soundings on the chart in fresh ink. No death is shown or described.
- *No chosen one*: the ship does not seek the player out, and she would have sung to anyone in the fog.
- *Silent, chosen plainly*: no new island and no named deep (§*What the canon fixes*). The Whispering Deep and the Veiled Isles stay tales, and the Sunken Library waits for the second run.
- *Names*: no Ald-; *Hanno* is the Aurennais bank's own; *Wulf* is the Mark's Anglo register; the Irish is checked (*faoileán*, *réalt na maidine*, *an bhó rua*, *fáinne geal*, *siúlóir*, *cuach*, *an tobar*, *an lucht gan uaigh*, *an duibheagán cainte*, *na hoileáin faoi cheo*).

### Owed, and not drafted here

- *Sea Legends, II*: the Sunken Library, a diveable wreck with rooms (look builder), and what is read there; the Whispering Deep given a place, if it earns one; figureheads, charts and instruments as rewards (with backlog L's *Making a ship yours*).
- The ferry crossings' small talk at sea, and named ferries.

---

## Sea Legends, II — the Faithful Copy, the Whispering Deep, and what the sea pays in

*Unapproved.* *Drafted 20 Oct 2026. Backlog L, Sea legends (OG-049), the second run: "wrecks to dive (the Sunken Library); figureheads, charts and instruments as rewards", and the Whispering Deep given a place. The first run (19 Oct, unapproved) named the ships, wrote the singing ship and the three tales at the quay, and left these.*

### What the canon fixes, and where it is silent

- *Aurenne: knowledge* (§1.3): the Mages' academy and the Church both sit there, and its pride is *ledgers, learning, paper over oaths*. *Piracy is the Mark's undeclared war; the Compact's tithe-ships are the pirates' favourite prey* (§1.4). The war was *one generation* ago.
- *The Withdrawal* (§3.1): the makers forbade the *reading* of sigils. The Old Blood keep the tongue and not the knowledge. So an Old Blood speaker is glad of a library under the water, and says so in four words.
- *Water Breathing* is how Act III's Root is reached (§8.3). The game has it (*Anáil*, `waterbreath`), and a breath of forty seconds without it (`BREATH_S`, three times that with Athletics 50). A deep wreck is the first place that asks for either, and so rehearses the Root the way the lairs rehearse it.
- *§10a*: wonder and a dry turn. Nobody died on the library ship. What sank her was a free captain's temper.
- *Silent:* a sunken library; the Whispering Deep's place; figureheads and instruments. The plainest things are chosen: the library is a ship, not a drowned city, so no land is added and no history is changed. The Whispering Deep is the deep water she lies at the edge of, and what whispers there is never said. The figureheads are carvings, and the instruments do what such instruments do.

### The shape

No quest is given. Three pieces, any order.

1. **The notice.** Every Mages' Guild head answers *Does the Guild want anything from the sea?* The academy still pays for any volume brought up from the *Faithful Copy*, a Compact library ship scuttled by free captains in the last year of the war, and the head stars her last known place on the map.
2. **The wreck.** She lies on her side at the lip of deep water off Aurenne's coast, 14 to 20 down: three rooms to swim through (the stern gallery, the stacks, the librarian's cabin) on one breath and a half, or one Water Breathing. Most of the four thousand books are pulp. Eight sealed cases are not, and the cabin holds the catalogue, the librarian's note and the ship's sounding-glass. The figurehead's head lies in the stacks where it fell.
3. **What the sea pays in.** A Mages' Guild head buys back the sealed volumes, and offers gold or a rutter for the catalogue. A shipwright fits the figurehead. The sounding-glass works on any ship.

**What it changes.** Nothing in the world's shape. The academy's catalogue closes one shelf. After the wreck is found, the Whispering Deep's tale is told differently in Aurenne, and above her, on a flat night, the deep still whispers.

**Reward.** Twelve gold for each sealed case (seven, so 84); for the catalogue, 80 gold or *A Rutter of the Three Seas* (a chart that marks the wrecks of one island's waters). The sounding-glass, an instrument. The Reader, a figurehead. No stat, no boon.

### 1. The notice — *Does the Guild want anything from the sea?*

A topic on every Mages' Guild head (`guild_m`), beside the sigil topics (`sigilLoreTopic`). On the first answer the wreck is starred on the map and the compass as *The Faithful Copy*. Once the catalogue is turned in, the topic goes.

**Aurennais:**
> "It does, Master, and has for thirty years. The *Faithful Copy* carried the academy's second archive between its houses. She was boarded in the last year of the war by persons of the Mark, who expected silver, found paper, and expressed their disappointment by sinking her. The crew were put ashore unharmed; the books were not. The academy still pays for any volume recovered, at twelve gold, under the original terms. Her last known place is entered on your map. She lies deep. I would not attempt it on one breath."

**Gatelander:**
> "There's a ship full of books on the bottom off Aurenne, and the academy's been weeping over her for thirty years. A Markish crew sank her for having nothing in her worth the stealing, and I'll say this for them, they put her people ashore first. The ledgers pay twelve gold a book for anything that comes up dry. I've marked her for you. Go down with more breath than you think you'll need. The sea never gave anyone back the breath they lent it."

**Markman:**
> "Aye. The book ship. Long Cuthred took her in the war. Thought a hull that heavy had to be silver. It was books. He put the crew off at a harbour and the books on the bottom. The academy pays twelve a book that comes up whole. She's on your map. She's deep. Take a spell for it."

**Old Blood:**
> "*Tech screptra.* A house of writing, under the water. Good. Water does not read. The academy pays for what comes up. It is marked."

### 2. The wreck — the *Faithful Copy*

**Where.** An anchored place, picked once per seed (§9's rule): in Aurenne's waters, a bed between −14 and −20 within 40 of water deeper than −40 (the lip of the deep), and within 900 of an Aurennais coast. Its id is `wreck:copy`. She is not one of the scattered wrecks (`spawnWreck`), which lie between −2.5 and −8 and have no rooms.

**What it is.** A big Compact hull, the merchantman's lines at twice the length, on her side on the slope, the stern gallery uppermost. Three rooms, swum in order from the gallery down:

- **The stern gallery**, the reading room. Tall windows, the glass gone, the lectern bolted to what is now a wall. Sand in the corners. Entering, once: *A reading room, turned on its side. The lectern still stands, bolted to the wall.*
- **The stacks**, the hold. Shelves on both sides, now floor and ceiling, and cases spilled between them. Most are burst. Eight are sealed with wax and lead, one of them torn (*Press 'E' to take the sealed case*). The figurehead's head lies among them (*Press 'E' to take the carved head*). Entering, once: *The hold is shelved from end to end. Most of what was on the shelves is grey pulp, moving a little in the current.*
- **The librarian's cabin**, forward and low. A desk on the wall that was the floor, the catalogue in its oilcloth, a sounding-glass in its box, a single page under a paperweight. Entering, once: *A small cabin. Everything in it was put away before she sank.*

**On the way down**, the first time the player is under water within 60 of her: *Below you, on the edge of the dark, a ship lies on her side. Her windows are open to the sea.*

**Above her**, on the surface, at night, with the wind under 2 (`windDir` strength), within 80 of her, once a night: *Under the boards, very faint, something like a house full of people in the next room.* No source is given, and no line ever explains it. It is the Whispering Deep, found.

### 3. What is read there

**The sealed cases** (`type:'misc'`, `story:'copy_case'`, weight 1, sell for nothing to a trader, ids `copy:<n>` for n 0–7). In the bag: *A book case sealed with wax and lead, to the Compact's standard. Dry inside, by the weight of it. The academy's mark is on the lid.* Seven are whole and cannot be opened (the academy opens its own). The eighth, `copy:3`, has a torn seal; it is dry inside, and holds a book:

***A Report to the House of Qarona on the Isles Called Veiled*** (`BOOKS`, `attr:null`, `story:'veiled_report'`). The Aurennais institutional register, formal and exact:

> *The undersigned Factor, instructed to proceed to the islands entered as unconfirmed and assess them for the tithe, reports as follows.*
>
> *The islands were sighted on the third day, in fog, at a distance estimated at two cables. They were three in number, wooded to the water's edge. Smoke rose from one of them, consistent with a hearth. The vessel closed to one cable. The islands did not.*
>
> *The vessel closed again on the fourth day, in fog. The islands were two in number. The smoke was on the other.*
>
> *On the fifth day the fog lifted and there were no islands. The soundings were consistent with open sea, and had been throughout.*
>
> *The undersigned recommends that the islands remain entered as unconfirmed, and that the tithe be assessed as nil and carried forward. The undersigned further reports that the fog was of excellent quality, and appends an account of it.*

The appended account is not in the case. A Gatelander's hand has written under the last line: *Twice they sent a man. I hope they send a third.*

***The Last Entry in Miscellany*** (`story:'copy_note'`, a lore book; the page in the cabin). The librarian's own hand, the institutional register, and no oath:

> *Entered under Miscellany, by Damaris, Keeper of the Second Archive.*
>
> *The vessel has been boarded by persons of the Mark. Their master has opened four cases and expressed disappointment. I have explained the catalogue to him. He has expressed further disappointment.*
>
> *He intends to sink her. I have asked that the crew be put off at the nearest harbour, and he has agreed, without being asked twice, which I enter to his credit. He appears to dislike books more than people.*
>
> *The cases are sealed to the Compact's standard and will keep for a time. I have put away what can be put away. I enter the archive's loss as unavoidable, and its recovery as outstanding.*

**The catalogue** (`story:'copy_catalogue'`, weight 2, a lore book): *The Catalogue of the Second Archive.* Read in the bag:

> *Four thousand two hundred and twelve volumes, entered by case and shelf. The hand is small and very even. Against eight cases a later note in the same hand reads* sealed, lead. *Against all the rest:* water.

### 4. What the sea pays in

**At any Mages' Guild head**, while a sealed case or the catalogue is in the bag, ***I've brought something up from the Faithful Copy.*** (`quest:true`). Each sealed case pays 12 gold and is taken; the torn case and the Report stay the player's. The catalogue opens a choice, once, between 80 gold and the rutter. The answers are the speaker's people's (`peopleOfNpc`).

**Aurennais**, for the cases:
> "Sealed to the standard, and the seal intact. The academy will be very pleased, Master, and will say so in writing, at length. Twelve gold a case, as agreed thirty years ago by people who did not expect to pay it."

**Aurennais**, for the catalogue:
> "Damaris's catalogue. The academy has wanted this more than any volume in it, Master, because without it we cannot know what we have lost. We can pay you eighty gold. Or, under the old terms, which permit payment in kind, the academy will give you its own copy of the *Rutter of the Three Seas*, which marks every wreck the Compact has entered in one island's waters. I would take the rutter. The gold will not tell you where anything is."

**Gatelander**, for the cases:
> "Dry as the day they were sealed. The ledgers will have a feast. Twelve a case, and you'd want to be counting them yourself, for they'll count them three times."

**Gatelander**, for the catalogue:
> "The book that lists the books. They'll want that above all of it, the way a man who's lost his cattle wants the tally more than the cows. Eighty gold, or the academy's rutter, that shows you where every hull went down off one shore. A rutter's a thing that pays you back every time you open it. The gold pays you once."

**Markman**, for the cases:
> "Sealed. Good. Twelve a case. Cuthred should've opened one."

**Markman**, for the catalogue:
> "The list. Aye, they'll want it. Eighty gold or their rutter. Rutter shows the wrecks off one coast. Take the rutter. You can dive gold."

**Old Blood**, for the cases:
> "Dry. Twelve each."

**Old Blood**, for the catalogue:
> "The count of what was lost. Eighty, or the rutter that knows where ships lie. Choose."

The two follows: ***The gold. (80 gold)*** and ***The rutter.*** Log: *Gave the Catalogue of the Second Archive to the Mages' Guild at {site}.* then *{fee} gold.* or *The Guild gives you A Rutter of the Three Seas.*

**A Rutter of the Three Seas** (`type:'misc'`, `story:'rutter'`, weight .5). In the bag:
> *The Compact's sailing directions for the three islands' waters, with the soundings, the lights, the marks, and every wreck the Compact has entered, each with her name and the date of her loss. Some names have a line drawn through them, meaning salvaged.*

Reading it marks on the map every scattered wreck (`spawnWreck`'s test) in the waters of the island the Guild stands on, each as *a wreck*. A wreck whose chest has been opened shows with a line through it. The rutter is given once, for one island; its island is the Guild's.

**The sounding-glass** (`type:'misc'`, `story:'sounding_glass'`, weight 1, an instrument). Taken from the cabin: *A sounding-glass in a brass box: a column of oil with a weight in it that settles at the depth below. The academy's mark is on the lid.* While it is in the bag, the HUD shows the depth below the keel at the helm (*{n} fathoms*), and the depth below the swimmer under water. It is the one thing the wreck gives that anyone would buy, and no trader will: an Aurennais merchant says, *That is the academy's property, Master. I could not, in conscience, price it.*

**The Reader** (the carved head, `type:'misc'`, `story:'fig_reader'`, weight 6). In the bag: *The head and shoulders of a woman, carved in oak, looking down at a book that broke off with her hands. Her finger was on the line.* Any shipwright will fit it (below).

### 5. Figureheads

A shipwright's topic, ***Will you fit a figurehead?*** (`quest:true`), on any port's yard, when the player owns a ship. Every yard offers its own nation's for 60 gold, and fits the Reader for nothing if it is in the bag. A ship carries one figurehead, and fitting a new one puts the old one in the bag. Figureheads are carvings and nothing more: no speed, no luck, no stat (backlog L's *Making a ship yours* is the systems builder's, and may give them more; nothing here asks it to).

| The yard's | Name | The carving |
|---|---|---|
| The Gatelands | **The Red Cow** | a cow's head, horns forward, painted red, *An Bhó Rua*'s joke on any hull |
| The Mark | **The Ram** | a ram's head, horns curled, iron-shod at the brow |
| Aurenne | **The Witness** | a woman's head and one raised hand, an open eye on the palm |
| found | **The Reader** | the *Faithful Copy*'s own (§4) |

**Gatelander**, offering:
> "A ship without a face is a ship that doesn't know where she's going, my father said, though he'd say that of a cart. We carve the Red Cow here, and you'll not see a finer cow on any water. Sixty gold."

**Markman**, offering:
> "Ram's head. Sixty gold. Iron on the brow. It won't do anything. Looks like it will."

**Aurennais**, offering:
> "The Witness, Master: the yard's figurehead, and the Compact's oldest. A hull that bears her is understood to be honest in her dealings, which is not the same as being so. Sixty gold, fitted."

**Old Blood**, offering:
> "A face for the bow. Sixty gold."

**Fitting the Reader**, every people, one line: *The shipwright turns the head over, and looks at it a while, and fits it for nothing.* Then the speaker:
- *Gatelander:* "She'll read the water for you. There's worse things to have at the front of a boat."
- *Markman:* "That's off the book ship. Aye. No charge. Cuthred'd hate it."
- *Aurennais:* "The *Faithful Copy*'s Reader. The yard would not charge for this, Master. It would be like charging for a funeral."
- *Old Blood:* "She is reading. Let her."

### 6. The tales, after

Once the wreck has been entered, an Aurennais speaker's *Any tales of the sea?* (Sea Legends, I, §5), where it gives the Whispering Deep, gives this in its place:
> "One is told the Whispering Deep has been found, Master, and that a library is lying at the edge of it. The academy finds this entirely plausible."

And a Markish speaker's, where it gives the Whispering Deep, adds one line after it: "Cuthred sank a ship of books off there. Says he can hear them. Says it every time he drinks."

The other tellings do not change.

### What in the code would carry it

- **The notice and the turn-in** (`87-world-quests.js`, beside `sigilLoreTopic`, `rubbingTopics` and `SEA_TALES`): `copyTopics(g,site,gp)` on `guild_m` gives the notice until the catalogue is in, and the turn-in while a case or the catalogue is in the bag, with the two follows. Lines in a `COPY_LINES` table by people (`peopleOfNpc`). **Buildable on the machinery the game has** once the wreck exists, with a suite: the notice stars `wreck:copy`, seven sealed cases pay 84, the torn one gives the Report, the catalogue's two follows give 80 gold or the rutter and the topic goes, and all of it survives a save and a load.
- **The record** (co-op rules): `worldState.copy={seen:1, cases:[n,…], cat:'gold'|'rutter', glass:1, head:1}` is the character's (what you have found and carry; `SS_CHAR_WS` and the S242 list). The cases are ids `copy:<n>`, taken through one named action, `takeCopyItem(id)`; the turn-in is `returnCopyItem(site,id,choice)`. The rutter's island is saved with it, `copy.rutterIsland`. Nothing is rolled: the eight cases and their places are fixed by the layout.
- **The place** (systems, `81-world-cells.js` and the anchored places): the constraint pick of §2 at generation, from the seed, flagged so it always exists; and its solids under water (the open world's, not an interior swap, so the breath bar and `diveTick` keep working).
- **The wreck** (look builder): the big hull on her side, three rooms swum in order, with the lectern, the shelves as floor and ceiling, the burst cases and pulp, the eight sealed cases, the head, the cabin's desk, the catalogue, the glass and the page; dim, in the Uisce gates' blue. The four entering lines are on its room boxes.
- **The whisper** (systems and sound): a once-a-night check above `wreck:copy` at wind under 2, the line in the log, and under it a low murmur of voices too faint to make out, fading in at 80.
- **The instruments** (systems, small): the sounding-glass's HUD depth (`worldH` below the keel or the swimmer, in fathoms, one fathom 1.83 m under F2a's scale); the rutter's map marks (`spawnWreck`'s own test across one landmass's sea chunks, without loading them, and the opened chests from the saved containers).
- **The figureheads** (systems and look, with *Making a ship yours*): `worldState.ship.figurehead` (the world's: the ship is), four small carvings at the stem (`buildShipMesh`), and the shipwright's topic in the harbour's `makeDef` (`84-world-interiors.js`). Until that lands, the Reader is kept in the bag and the yard says nothing of it.
- **The tales** (quest writer): the two lines of §6 in `SEA_TALES`, read from `copy.seen`.
- **The words** (quest writer, once the wreck lands): the entering lines, the item cards, the two books in `BOOKS` with `attr:null`, the catalogue, the notice and turn-in lines, the yard's lines.

### Checked against the canon

- *§2, the register*: the Gatelander in proverbs and indirection (*the sea never gave anyone back the breath they lent it*, *a rutter's a thing that pays you back*), never a bare yes or no; the Markman short, *aye*, a nickname (*Long Cuthred*), no honorific; the Aurennais formal, *Master*, qualified, in terms and contracts (*under the original terms*, *payment in kind*, *carried forward*), and never an oath; the Old Blood sparing and exact, with the older name for the thing (*tech screptra*, Old Irish for a house of writings).
- *§1.4*: the free captains' piracy against Compact shipping, in the war a generation ago. The library ship is the one prize they could not sell.
- *§3.1, the Withdrawal*: the Old Blood speaker's *Good. Water does not read.* is the law against reading, said by someone who no longer knows why it is the law.
- *§10a*: nobody died. The crew were put ashore, the librarian put away what could be put away, and the pirate still cannot hear the word *library*. The eerie part is the whisper over her, and it is never explained.
- *§2.1*: the jabs are about work and ledgers (*they'll count them three times*), never bodies. Cuthred, who sank the books, put the crew ashore without being asked twice, and the librarian enters it to his credit.
- *No chosen one*: the academy's notice is for anyone, and has stood for thirty years.
- *Silent, chosen plainly*: no new land, no drowned city, no history changed. The Whispering Deep is a place now, and still says nothing.
- *Names*: *Damaris* is the Aurennais Register's bank; *Long Cuthred* is the Mark's Anglo register; *Qarona* is a place from the Register's syllables; no Ald-.

### Owed, and not drafted here

- The ferry crossings' small talk at sea, and named ferries.
- *A third run, if Michael wants one*: the Veiled Isles landed on (new land, his call), and the free captains' side of the sea, at Port Blackhand.


---

## Festivals on the Calendar, I — the Greening, Riverfair and the Night of the Lanterns

*Unapproved.* *Drafted 21 Oct 2026. Backlog L9, *Festivals on the calendar* (OG-107): "three festivals an island, each in its month: the Greening (a maypole spring feast), Riverfair (a summer fair on the rivers), the Night of the Lanterns (October, lanterns let go for those who never came back from the gates, close to the canon); Midwinter fires, a fair of boat races and duels, a First Snow rite under the aurora; a festival of learning, a spice caravan, lamps set afloat … The Mark's fair is run by captains and reeves, not jarls and a thane; 'many gods' belongs to the Gatelands' old faith, not the Church." This first run places all nine on the calendar and writes the Gatelands' three in full. The Mark's three and Aurenne's three are the second and third runs.*

### What the canon fixes, and where it is silent

- *The calendar* (`CAL`, `60-shop.js`; *The Year's Names*, Michael's A on #146): a week of seven, a day to each god, so a date keeps its weekday; twelve months of 28 days named for the year's work (Thaw, Lambing, Sowing, Shearing, Haysel, Highsun, Reaping, Leaffall, Culling, Longnight, Wolfmonth, Lean). The four feasts every island keeps are built (`FEASTS`): the Kindling (Thaw 1), the Long Light (Highsun 19), the Giving (Reaping 23), the Empty Chair (Longnight 28). Nothing here moves them.
- *The feasts' rules* (Michael's C on #132): on a feast the inn's meal is free, a petty fine is halved, and the town keeps to its square. Those rules belong to the four. An island's festival is smaller: the square fills and the talk changes, and nothing is free. A festival that wants the feasts' rules too is Michael's call, not this draft's.
- *The Gatelands' old faith* (§4.1): the six with temples and the Guest without one, worshipped as *what the builders were making*. The Church of the Weaver is Aurennais and later (§3.1). So the Gatelands' festivals go to the old gods by their work, and an Aurennais in a Gatelands town keeps a polite distance from them.
- *The dead and the gates* (§3.1): the Giving names the year's dead *given* to the gates. The Night of the Lanterns is for the others, the ones who walked into a gate alive and did not walk out: the salvage trade's dead (§1.1, *a salvage economy of adventurers*), and the pride *never leaving a wounded man* is what makes the night hurt. The two must not be the same feast told twice.
- *No chosen-one prophecies; the three descriptions* (§4.2): nobody applies *the one who dies and does not* to the player before Act III. The lantern-seller below comes close and does not.
- *§10a*: the surface is pleasant. The Greening and Riverfair are glad days. The Lanterns are beautiful first and sad second.
- *Silent:* every festival's date, custom and word. I chose the plainest: each falls on the god's day its custom belongs to, so the date and the weekday say the same thing.

### 1. The nine, on the calendar

Each is fixed to a date. A 28-day month keeps a date on its weekday, so each festival always falls on the same god's day, chosen for it. Each is kept by the towns of one nation only (`nationKeyOf` of the site's cell), and a townsperson of another people in that town speaks of it as a guest would.

| Festival | Island | Date | Weekday | Custom | Drafted |
|---|---|---|---|---|---|
| **The Greening** | Gatelands | Sowing 3 | Beastday | the pole on the green dressed with a ribbon from every house; the first lambs shown | here |
| **Riverfair** | Gatelands | Haysel 18 | Seaday | a trade fair at the river; horses sold, the water blessed where it leaves the town | here |
| **The Night of the Lanterns** | Gatelands | Leaffall 26 | Skyday | at dusk, lanterns let go from the square for those who went into a gate and never came out | here |
| **The Blaze** | the Mark | Longnight 15 | Hearthday | midwinter bonfires; every hall's fire fed from one | run 2 |
| **The Strait Fair** | the Mark | Highsun 4 | Seaday | boat races and duels; run by the captains and reeves, oaths sworn | run 2 |
| **First Snow** | the Mark | the first night snow lies in the town in Culling or Longnight (else Culling 28) | — | a night outside under the lights; nobody sleeps under a roof | run 2 |
| **The Commencement** | Aurenne | Shearing 6 | Weaverday | the academy's year opens; the new students' names read in the square | run 3 |
| **The Caravan** | Aurenne | Reaping 9 | Stoneday | the saffron caravan comes in from the dunes; the inland towns' fair | run 3 |
| **The Lamps on the Water** | Aurenne | Lean 4 | Seaday | lamps set afloat in the harbour for the ships at sea, and for the ones that did not come back | run 3 |

The names of the Mark's and Aurenne's six are provisional until their runs. *Midwinter Blaze*, *Sunspire*, *Saffron Caravan* and *Watershed* are the concept sheet's; *Sunspire* reads as a place and *Watershed* as a word that means something else, so they are not taken.

**The Lanterns and the Lamps** are each other's mirror and on purpose: the Gatelands mourn those who went *in*, Aurenne those who went *out*. The one island's dead went under the ground and the other's under the sea.

### 2. The shape

No quest. On the day, in every town of the island:

- **A greeting.** Every generated townsperson greets with the festival's line for their people (the feasts' way, `feastGreeting`).
- **The square fills.** Residents and villagers keep to the plaza (S554's rule for the feasts, `feastR`).
- **The calendar.** The journal's *Due* page lists the next festival of the island the player stands on, with its one-line custom, beside the next feast.
- **One thing to do.** The Greening's ribbon, Riverfair's blessing, the Night of the Lanterns' lantern (below). Each is small, costs at most two gold, and is remembered for the year.

**What it changes.** Nothing in the world's shape. Each act is saved for its year, so a townsperson can say so on the day after.

**Reward.** None but the line. On the Greening a prayer at a shrine of Na Beithígh is on its god's day anyway (it falls on a Beastday), so the boon lasts its doubled time with no new rule. That is the whole of the reward, and it is enough.

### 3. The Greening — Sowing 3, a Beastday

**The custom.** On the green (the village's plaza), a pole is stood and every house ties a ribbon to it, in its own colour, for the year's lambs and calves. The first lamb of the year is carried round the pole once. Na Beithígh's day; the Beasts' god is *her*, and *her children* are the beasts.

**Due line** (the calendar): *The Greening — a ribbon on the pole from every house, and the first lambs shown.*

**Greetings** (`greet`, by the speaker's people):

**Gatelander:**
> "A green Greening to you. Every house ties a ribbon on the pole today, and a house that doesn't tie one has no lambs to count. There's ribbon at the pole if you've none of your own. Nobody asks whose house you are."

**Markman:**
> "Greening. They tie rags on a pole and walk a lamb round it. Good lamb, mind. Ate one like it at home."

**Aurennais:**
> "A fair Greening to you, Master, as they say here. It is the country's spring observance: one ribbon to each household, and a lamb presented to the god of beasts. The Church has no view on it that I would repeat on a day like this."

**Old Blood:**
> "Bealtaine, we said. The pole is younger than the word. The lambs are older than both."

**The ribbon.** On the day, standing at the green's pole: *Press 'E' to tie a ribbon to the pole.* Once a year per town (`worldState.festivals['greening:'+site.id]=year`). The log:

> *You tie a ribbon to the pole among the town's. It is not a house's colour, and nobody minds.*

A townsperson of that town, the next time they greet the player that day (Gatelander only; once):

> "That was yours, the plain one? Good. The pole doesn't care who you are, only that you came."

**The lord or elder**, on that day, before their topics (Gatelander):

> "It's the Greening, and I've no business for anyone who isn't carrying a lamb. Come back tomorrow, when the beasts are counted and the arguing starts."

### 4. Riverfair — Haysel 18, a Seaday

**The custom.** A trade fair at the town's water: horses run and sold, wool weighed, and at noon the water is blessed where it leaves the town, a cup poured in for An Mhuir, since every river is going to the sea anyway. A town with no river holds it at its well and says the well is going there too, only slower.

**Due line:** *Riverfair — horses and wool at the water, and the water blessed at noon.*

**Greetings:**

**Gatelander:**
> "Riverfair, and every horse in the county is for sale and none of them is the one you want. Buy late. A man who brought a horse to the fair doesn't want to walk it home."

**Markman:**
> "Riverfair. Good horses, bad prices. Buy the bay. The grey bites."

**Aurennais:**
> "It is Riverfair, Master, the inland trade. The terms are verbal, which I find bracing, and the horses are excellent, which I find harder to account for."

**Old Blood:**
> "Aonach na hAbhann. The river's fair. At noon they give the sea a cup back. It is owed more."

**A trader of the town** (any shopkeeper in a Gatelands town, the shop's greeting that day; Gatelander):

> "Riverfair prices, which is to say the same as yesterday's and I'll be sorry about them louder."

**The blessing.** At noon (12:00 to 13:00), a town priest stands at the water (or the well) and the townsfolk keep to it. Standing within 6 of the priest in that hour: *Press 'E' to pour a cup for the sea.* Once a year per town (`'riverfair:'+site.id`). The log:

> *You pour a cup into the water. It goes the way the river goes.*

The priest, once, that hour (Gatelander):

> "The sea owns it twice a day, the book says, and the river's only taking it there. Thank you. It's a short gift for a long road."

### 5. The Night of the Lanterns — Leaffall 26, a Skyday

**The custom.** At dusk (18:00 to 22:00), lanterns of paper and reed are let go from the square, one for each of the town's people who went into a gate and never came out, and they rise until they are only stars. Nobody says the names aloud: the Giving is for saying names. Tonight is for the ones who were never found to be given. The houses on the square leave their lamps unlit until the last lantern is out of sight.

**Due line:** *The Night of the Lanterns — at dusk, a lantern for each who went into a gate and did not come out.*

**Greetings** (all day):

**Gatelander:**
> "It's the Night of the Lanterns tonight. You'll be wanting to stand in the square at dusk, whether you've anyone to send one for or not. They go up so slow you'd think they were sorry to leave."

**Markman:**
> "Lantern night. For the ones the gates kept. Lot of them in this trade. Stand with them. It's short."

**Aurennais:**
> "It is the Night of the Lanterns, Master. The Church would say those it remembers went where they had no business going. I say only that the lanterns are very well made, and that one should be in the square at dusk."

**Old Blood:**
> "Oíche na Lóchrann. They send a light after the ones who went in. We used to ask what the light would find. We stopped asking."

**At dusk the lantern-seller** stands on the square (a townsperson of the town, the role *Lanternmaker*, generated from the town's people; Gatelander in a Gatelands town but for a port's blend). Greeting:

> "Two for a lantern, and the paper's dry, so it'll go. You needn't tell me who it's for. Most don't."

Topic: **A lantern** (2 gold; once a year per town, `'lanterns:'+site.id`). Taking it opens the choice:

**Who is it for?**
- *For someone who didn't come back.*
- *For whoever went in last and wasn't found.*
- *I'd rather not say.*
- *For me.*

The answers (Gatelander lanternmaker):

- *For someone who didn't come back.*
  > "Then go on and let it up. They'll know their own. That's the one thing every lantern's agreed on."
- *For whoever went in last and wasn't found.*
  > "That's kind. There's always a last one, and nobody's ever sure who. Let it up, and it'll find them, or it won't, and either way it's been sent."
- *I'd rather not say.*
  > "Nor should you. A lantern isn't a ledger. Up it goes."
- *For me.*
  > "That's not done. You're standing in front of me." A pause. "Here. I'll not take the two for it. Let it up for somebody else, and come back next year with a name."

(The fourth is the nearest any line comes, before Act III, to *the one who dies and does not*. The lanternmaker does not say it, gives the money back and goes back to their bread. If Michael would rather the player could not choose it at all, it is one line to strike.)

The lanternmaker in another people's voice, where a port's blend puts one there:

- **Markman:** "Two. Paper's dry. Don't need to know who." For *me*: "No. You're here. Take it back. Send it for a man who isn't."
- **Aurennais:** "Two, Master, and the paper is dry; I make no warranty beyond that. You need not name the beneficiary." For *me*: "I cannot sell you that, Master. The terms presume an absence. Take the coin back, and send it for somebody who is not standing in front of me."
- **Old Blood:** "Two. It goes up. You need not say." For *me*: "No. The light goes after the ones who went in. You came out."

**Letting it go.** After the choice: the log, and the lantern rises from the player's hands:

> *You let the lantern go. It rises with the others until you cannot tell which is yours.*

After the *For me* choice, nothing is bought; the log instead:

> *The lanternmaker gives back your two gold and turns to the next.*

**The square, at the last lantern** (22:00, once a night, if the player is on the square):

> *The last lantern goes out of sight. Along the square, one by one, the lamps are lit.*

**The next day**, a Gatelander of that town, once, if the player sent a lantern:

> "You stood with us last night. That's remembered here longer than a coin is."

### What in the code would carry it

- `60-shop.js`: beside `FEASTS`, a table `FESTIVALS` of the nine, each `{key,name,nation,month,dom,ico,due,greet:{gatelander,markman,aurennais,oldblood}}` (the first run fills the Gatelands' three; the Mark's and Aurenne's carry `greet:null` until their runs and are skipped while null). `festivalOn(at,nation)` returns the day's festival for a nation; `nextFestival(at,nation)` as `nextFeast`. First Snow's date (run 2) is the one that reads the weather; it waits for that run.
- `feastGreeting(def)` (`60-shop.js`): when no feast is on, the festival of the def's site's nation (`nationKeyOf(...cellOf(site.x,site.z))`, from the world; `feastGreeting` already runs late, when the world is loaded). A feast wins over a festival; none share a date.
- `82-world-structures.js`, `feastNow()`: true on a festival in the site's nation too, so the square fills. `feastR` unchanged. This is the only shared rule the festivals take; the free meal (`feastMeal`, `feastInnLine`) and the halved fine (`feastFineLine`) stay the four feasts' alone.
- `87-world-quests.js`, the *Due* list (`nextFeast` at line ~2038): push the next festival of the island the player stands on, with its `due` line.
- The three acts: the ribbon at the green's pole (the plaza's centre; the pole itself is the look builder's), the cup at the water (the town priest's place at noon), the lantern (a generated townsperson on the plaza from 18:00 to 22:00 with the role *Lanternmaker* and one topic). Each writes `worldState.festivals[<key>:<site.id>]=year` (`calDay().year`), a world key (the town remembers, not the character), added to `_applyLoadData`'s list. The ids are by festival and site, never a position or a time.
- The next-day lines read that key for yesterday's date; the lord's Greening line goes before `lordTopics` on the day.
- **A test** (`tests/festivals.test.mjs`): set the clock to Sowing 3 in a Gatelands town and a townsperson greets with the Greening's line for their people; the same day in a Markish town greets as any day; tie the ribbon and the key is saved and loads; on Leaffall 26 at 19:00 the lanternmaker stands on the square, sells a lantern for 2 gold, and *For me* charges nothing.

**For the look builder** (backlog A, under this draft's name): the green's pole dressed with ribbons on the Greening (one pole, ribbons in the town's colours, on a Gatelands plaza that day only); the lanterns rising on the Night of the Lanterns (paper lanterns, lit, drifting up and fading over 90 seconds; a few dozen at once over the square); the player's own lantern rising from the hands.

### Owed, and not drafted here

- The Mark's three (run 2): the Blaze, the Strait Fair with its captains' and reeves' oaths and its duels (canon §1.2, *disputes by duel*), and First Snow under the lights.
- Aurenne's three (run 3): the Commencement, the Caravan, the Lamps on the Water.
- The *everyday life* half of OG-107 (stalls, a smith at work, a temple service, wrestling and archery, a harbour gathering) is most of it the look builder's and the systems builder's; a short words draft for the contests once one exists.

---

## The Markish Bench — the alehall's keeper lets a place, not a room

*Asked for by Michael's A on DECISION #588, 22 Oct 2026 (the keeper's words first, then the look builder hangs the alehall in every Markish inn). Built, Session 1285, PR #595.* *Drafted 22 Oct 2026.*

### What it is for

Michael's A on #321 made the Mark's inn the alehall: one hall of long tables, and the guests sleep on the furred benches along the walls. Renting a place is renting a bench. The room is in the kit (`PKIT.mk.alehall`), but the Markish keeper still let *a room, a bed, a bolt on the door, up the stairs*. These are the keeper's words for the bench. No new rule of play is needed: the inn's rental is the same rental, with six places instead of rooms.

**Canon.** §2: Markmen speak in short sentences, say *aye*, swear on iron and blood, use no honorific. The hall's peace is the oath here: a guest's things on the next place are that guest's, as the old line's *the other doors aren't mine to open* was. The canon says nothing of what the Mark's inns serve at dawn; porridge is the plainer thing.

### The places

Six, three on each wall bench, named as you come in from the door:

| | Left bench | Right bench |
|---|---|---|
| by the door | *the place by the door on the left bench* | *the place by the door on the right bench* |
| middle | *the middle place on the left bench* | *the middle place on the right bench* |
| by the counter | *the place by the counter on the left bench* | *the place by the counter on the right bench* |

### The keeper (Markman), at the counter

**Greeting** (one of):
> Fire's lit. Find a bench.
> Benches by the wall. Bowl's on the way.
> We don't ask where you've been. Boots off, though.

**A bed for the night?**
- Who else is in, one of:
  > Benches are empty tonight. Just you and the fire.
  > One other on the benches tonight.
  > *N* others on the benches tonight.
- The offer, after it:
  > *N* gold buys a place on the bench — *the middle place on the left bench* — with furs, the fire all night, and porridge at first light. Want it?
- **Yes.** Paid:
  > *N* gold. Aye. *The middle place on the left bench*, yours till this time tomorrow. What lies on the next place belongs to whoever sleeps there. Hall keeps the peace, by iron.
- Short of gold:
  > *N* gold, and you've *M*. Come back with it.
- Every place taken:
  > Every place on the benches is taken tonight. The floor by the hearth's free, and it's warm.
- **Not tonight.**
  > Suit yourself. The fire's free.
- Asked again once it is yours:
  > *The middle place on the left bench*. Your furs are laid. Nobody sits there but you.
  > (an old save with no place kept) Your place is laid already. Furs and all.

The Waylamp's bearer and the feast day keep their own lines before the offer, as in every inn.

### At the bench

- Prompt, not rented: *Ask the keeper for a place on the bench (N gold)*
- Prompt, your own: *Your place — press 'E' to rest*
- Prompt, another's: *Another guest's place* / *Not your place*
- Pressed, not rented: *The keeper lets the places on the benches. Ask at the counter.*
- Pressed on the wrong place: *Another guest's place.* or *An empty place, not the one you took.*, then *Yours is the middle place on the left bench.*
- The clock, when the night runs out: *The place you took on the bench is the keeper's again.*
- The log: *Rented the middle place on the left bench at The Black Ram for 17 gold.*

### What carries it

`js/86-world-crime.js`: `INN_BENCH_LINES.markman` (the ten keys of `INN_ROOM_LINES`), `INN_BENCH_GREET`, `innBench(house)` (reads `house.kit.alehall`), `innBenchName(k)`; `innTopics`, `innRooms` (6), `innRoomName`, `bedInteract` and `bedPrompt` switch on it. `worldState.rented.bench` (the rental, already saved whole) carries the lapse line in `87-world-quests.js`. `83-world-generator.js` gives an alehall's keeper the greeting. The look builder marks the inn: `alehall:true` on its `lot.kit` at planning, and the bench's six beds `owner:'inn'`, `room` 0–5 in the order of the table (left then right, door to counter). `tests/innvoice` proves the words.

---

## Festivals on the Calendar, II — the Blaze, the Strait Fair and First Snow

*Unapproved.* *Drafted 23 Oct 2026. Backlog L9, *Festivals on the calendar* (OG-107), the second run: the Mark's three, placed on the calendar by the first run (21 Oct, unapproved) and left for this one. The frame is the first run's exactly: no quest, a greeting by people, the square filled, a *Due* line, one small act a year per town, remembered as `worldState.festivals[<key>:<site.id>]=year`. Aurenne's three are the third run.*

### What the canon fixes, and where it is silent

- *The Mark* (§1.2): cold; timber halls and longhouses; *no king and a scorn for the word*; captains over garrisons, reeves over towns; office by acclamation, disputes by duel. **Pride:** toughness, an oath kept, a quarrel finished by noon. **Contempt:** priests, ledgers, soft hands, anyone who hires a guard instead of being one. So the Mark's festivals are kept by the halls, the reeves and the captains, and **no priest leads any of them**. The weekday each falls on is only the calendar's name for it. Nobody in the Mark says the festival belongs to a god.
- *Markish speech* (§2): short sentences, *aye*, nicknames, oaths on iron and blood, no honorifics. *Reeve* and *Captain* are offices, and the Mark uses them as words for jobs, not as titles to bow to.
- *The duel* (§1.2, §12a): duels are legal in the Mark, and *an occupied League town loses its duels*. The Strait Fair's ring follows the same rule. While a town is occupied it holds no ring, and its fair is a quiet one.
- *§10a*: the surface is pleasant. The Blaze is warm, the Fair loud, First Snow quiet and good.
- *Silent: the lights.* The concept sheet puts First Snow *under the aurora*. The canon says nothing of the northern sky, and the game draws no aurora. This draft says *the lights* where a person speaks of them and makes nothing turn on them. If the look builder gives the Mark's winter sky its lights, the words are ready. If not, the words still hold.
- *Silent: what the Mark believes.* The canon gives the gods to the Gatelands' old faith and the Church to Aurenne, and gives the Mark only its contempt for priests. This draft takes the plainer thing: a Markman swears on iron and blood, keeps a fire and an oath, and has no use for a god's day.

### 1. The three, on the calendar (the first run's table, unchanged)

| Festival | Date | Weekday | Custom |
|---|---|---|---|
| **The Blaze** | Longnight 15 | Hearthday | midwinter: one fire on the square, and every hall's hearth lit again from it |
| **The Strait Fair** | Highsun 4 | Seaday | boat races off the quay, a ring on the square from first light to noon, quarrels ended and oaths sworn before the reeve |
| **First Snow** | the first night that snow lies in the town in Culling or Longnight; else Culling 28 | — | a night outside: the town sits up round fires on the square until first light, and nobody sleeps under a roof |

**The names stand.** *The Blaze* is the concept sheet's *Midwinter Blaze* cut short, as a Markman would cut it. *The Strait Fair* is held in every town of the Mark, not only on the strait. The strait is where the first one was, and the Mark keeps the name. A town inland races boats on its lake or its river. A town with no water races on foot, and says so.

### 2. The Blaze — Longnight 15, a Hearthday

**The custom.** At dusk (17:00) the reeve lights one fire on the square. Every hall in the town has let its hearth go out that morning. Each house sends someone with a brand to carry fire home from the square. The fire is fed all night by whoever walks past. A log from every house is the rule, and a house that sends no log is talked about until spring. At first light the fire is let die.

**Due line:** *The Blaze — every hearth put out, and lit again from one fire on the square.*

**Greetings** (by the speaker's people):

**Markman:**
> "Blaze tonight. Hearth's out till dusk, so don't ask for a hot meal. Bring a log to the square. Everyone does."

**Gatelander:**
> "It's their Blaze tonight. They let every fire in the town go out, and then they wonder why it's cold. A fire you share burns longer, they say here, and I'll not argue with a Markman about fire."

**Aurennais:**
> "It is the Blaze, Master, the Mark's midwinter. Every hearth is extinguished and relit from a single fire. A fine principle of common supply, I think. They would not thank me for calling it that."

**Old Blood:**
> "Tine Chnámh. The bone-fire. It was a fire for the dead, once. They burn wood in it now. They feel warm, so they do not ask."

**The reeve** (the town's lord, a Markman), on the day, before their topics:
> "Blaze. No business till tomorrow. Bring a log or stand back from the fire."

**The inn, by day** (the keeper's greeting until 17:00; the Mark's inn is the alehall):
> "Hearth's out. Blaze. Cold porridge or nothing till dusk."

**The act: a log on the fire.** On the square from 17:00 to first light, within 4 of the fire: *Press 'E' to put a log on the fire.* Once a year per town (`'blaze:'+site.id`). It costs nothing. The log:

> *You put a log on the fire. It catches. Someone you don't know claps you once on the shoulder and moves off.*

A Markman of that town, the next time they greet the player that night (once):
> "Saw your log go on. Good. A stranger's log burns same as ours."

**First light** (6:00, once, on the square):
> *The fire on the square is let die. Every chimney in the town is smoking.*

### 3. The Strait Fair — Highsun 4, a Seaday

**The custom.** At first light the boats race. In a port they race out round the point and back. Inland they race on the town's water, and on foot round the walls where there is none. From first light to noon a ring of rope stands on the square, and any quarrel in the town may be finished in it, by yield. At noon the reeve stands at the ring and hears oaths. A debt is sworn paid, a feud is sworn ended, and a Sworn swears to the League for the year. By noon it is done, because a Markish quarrel is finished by noon (§1.2).

**Due line:** *The Strait Fair — boats at first light, the ring till noon, and oaths before the reeve.*

**Greetings:**

**Markman:**
> "Fair day. Boats at first light, ring till noon. You've a quarrel, the ring's there. You've none, watch."

**Gatelander:**
> "It's the Strait Fair. They settle a year's grudges in a morning, which is quicker than we manage, and they're friends by noon, which is quicker again. I've seen worse ways. Not many louder."

**Aurennais:**
> "It is the Strait Fair, Master. Disputes are resolved in a roped ring by noon, and I am told the resolutions hold better than most contracts. I have stopped finding that a comfort."

**Old Blood:**
> "Aonach an Chaolais. The strait's fair. The rope was a line of stones, once. They fought inside it and nobody died. The rope remembers the half of that they kept."

**A trader of the town** (any shopkeeper in a Markish town, the shop's greeting that day; Markman):
> "Fair prices. Same as yesterday's, said louder. Buy before the boats come in. After, everyone's drunk or arguing."

**The ring.** From first light to noon, townsfolk stand round the rope (S554's square rule). The player can watch and not enter. A ring the player can fight in is the yard's machinery (`DUEL`, the Duel at Caer Slige) set up in every town, and that is the systems builder's (owed, below). Standing by the rope:

> *In the ring two men are ending a quarrel about a boundary wall. One of them yields. They shake hands and go and get a drink.*

The fair's man at the rope (a townsperson of the town, role *Ringkeeper*, generated from the town's people; Markman in a Markish town but for a port's blend). Greeting:
> "Rope's up till noon. Fight's to a yield, and nobody draws steel. You want in, find somebody who wants you."

Topic: **Can I fight?**
> "Not till somebody's got a quarrel with you. Give it a year."

**The act: a wager on the boats.** At first light, from 5:00 to 7:00, a Markman at the quay (in a port), or the ringkeeper (inland), takes a bet on the race. Topic: **A bet on the boats** (2 gold; once a year per town, `'straitfair:'+site.id`). The choice:

**Which boat?**
- *The black one.*
- *The one with the old man at the oar.*
- *Whichever's last off the beach.*

> "Two on it. Aye. You'll hear at the quay by eight."

The outcome comes from a seeded stream by festival, site and year, so it is the same on any machine. A win pays 6 gold. Asked again after 8:00:

- Won:
  > "Yours came in first. Six. Don't spend it all on the ring."
- Lost:
  > "Yours came in third. Rowed like a man with a tithe-man on his back. Two's gone."

**Noon, the oaths** (12:00, once, on the square):
> *At noon the reeve stands at the rope. Two neighbours swear a boundary settled, a lad swears to the League for the year, and the rope comes down. The fair is over before dinner.*

**An occupied town** (`TS(site).flags.occupied`): no ring, no race. The greeting, Markman:
> "No fair this year. No ring while their flag's up. We'll hold two next year."

### 4. First Snow — the first night snow lies, in Culling or Longnight

**The custom.** The first night of the winter that snow lies in the town, nobody sleeps under a roof. At dusk the halls carry their benches out. Fires are laid on the square, and the town sits up round them till first light, in furs, telling the year's dead by their nicknames and nothing else. A child born that year is carried round the fires once. If the winter holds off, the town keeps it on Culling 28 anyway and sits out in the cold and the mud, which is talked about as a worse year.

**When.** The first night (dusk, 18:00) in Culling or Longnight that the town's ground lies white (`WX.cover` over the town's cell at dusk, high enough that the snow shows). Else Culling 28. Once a winter per town. The date is unknown until it comes, so the *Due* line says only *the first night the snow lies* until then.

**Due line:** *First Snow — the first night snow lies in Culling or Longnight, the town sits up outside till first light.*

**Greetings** (from the first snowfall's dusk until first light):

**Markman:**
> "Snow's lying. Nobody sleeps inside tonight. Fires on the square. Bring furs."

**Gatelander:**
> "First Snow, they call it. The whole town sits out in it all night to prove they can. I said I'd sit an hour. That was three winters ago, and I've sat every one since."

**Aurennais:**
> "It is First Snow, Master. The town spends the night outdoors, by agreement, in the cold. I have attended twice. I cannot account for it, and I would not miss it."

**Old Blood:**
> "An Chéad Sneachta. The first snow. They sit out under the sky because the old ones did. The old ones were watching the sky for something. These ones are only cold, and glad of each other."

**The inn** (the alehall's keeper, that night; Markman):
> "No places tonight. Benches are on the square. Go and sit on one."

*A bed for the night?* is not offered that night in a Markish town. A rental that is already running holds, and the player can still sleep in the place they took. The keeper says, if asked:
> "Your place is yours. Nobody'll stop you sleeping in it. Everyone'll know, mind."

**The act: sit up till first light.** On the square after dusk, within 4 of a fire: *Press 'E' to sit with them till first light.* It is the Wait to 6:00, sitting, with no prompt between. Once a winter per town (`'firstsnow:'+site.id`). At first light, the log:

> *You sat the night out with them. Somebody told the year's dead by their nicknames. Nobody asked yours.*

A Markman of that town, the next day (once), if the player sat up:
> "You sat it out. Aye. That's a winter. You're from here now, near enough."

If *the lights* show that night (a hook only, see the canon note):
> *Over the square the sky moves, green and slow. Nobody looks up for long. It's rude to stare at it, someone says.*

### 5. In the Gatelands and in Aurenne

On the Mark's three, a Markman in a town of another island (a port's blend, a garrison) greets as follows, once that day:

- The Blaze: "Blaze at home tonight. Here they keep their fires lit like nothing's happening."
- The Strait Fair: "Fair day at home. Nobody here's got a rope up. They'll all be arguing till winter."
- First Snow: no line. First Snow is the Mark's own snow, and a Markman abroad does not know the night has come.

### What in the code would carry it

- `60-shop.js`, the first run's `FESTIVALS`: fills the Mark's three entries (`blaze`, `straitfair`, `firstsnow`) with `greet` for the four peoples and `due`. First Snow carries `date:'snow'` instead of `month`/`dom`. `festivalOn(at,nation)` reads it from the town: the first day in Culling or Longnight that `WX.cover` over the site's cell reached its show level at 18:00, saved per site per winter (`worldState.festivals['firstsnow-day:'+site.id]=<year>:<day>`), so the night is the same after a load. A world key, on `_applyLoadData`'s list with the first run's `festivals`.
- `feastGreeting(def)` as the first run gives it, reading the Mark's three. The reeve's Blaze line goes before `lordTopics` on the day. The alehall keeper's two lines go in `INN_BENCH_LINES` (`86-world-crime.js`, `innTopics`) as day keys (`blazeDay`, `firstSnow`, `firstSnowMine`), with the rental's offer withheld on First Snow.
- The acts: the log at the square's fire (the look builder's fire: a bonfire at the plaza's centre from 17:00 to 6:00 on the Blaze, and two or three smaller ones on First Snow); the wager (a topic on a quay townsperson or the ringkeeper, its outcome `seededRng('straitfair',site.id+':'+year)`, three choices with one win, pay 6); the night sat up (the Wait's own machinery, `_canWait` and the rest slip, to 6:00, from the fire's prompt). Each writes `worldState.festivals[<key>:<site.id>]=year`.
- The ring: a roped square on the plaza from 5:00 to 12:00 with two townsfolk in it (the look builder's rope; the bodies builder's sparring pose, or the yard's). The narration is a `showMsg` once a visit within 6 of the rope. No foe, no fight.
- **The test** (the first run's `tests/festivals.test.mjs`, extended): on Longnight 15 in a Markish town a townsperson greets with the Blaze line for their people, and the log on the fire is saved and loads; on Highsun 4 the bet pays the same on two boots; on First Snow the alehall's keeper offers no place.

**For the look builder** (backlog A, under this draft's name): the Blaze's one fire on the square (a bonfire at the plaza, lit 17:00 to 6:00, with the town's chimneys smoking after it); First Snow's fires and the benches carried out onto the square; the Strait Fair's rope ring on the plaza and the boats off the quay; the Mark's winter lights in the sky, if wanted (a soft green band, slow, on clear nights in Culling to Wolfmonth), which the words do not need.

**For the systems builder**: a fight in the Strait Fair's ring, to a yield, for the player (the yard's `DUEL` set up in any Markish town on the day, against a townsperson with a quarrel). The ringkeeper's *Give it a year* stands until then.

### Checked against the canon

- *Register.* Every Markman in short sentences. *Aye* where a Markman agrees, and no honorific in a Markish mouth. *Reeve* and *ringkeeper* are jobs. Gatelanders speak in proverb and indirection (*a fire you share burns longer, they say here*), and none gives a bare yes. The Aurennais are formal and qualified, with *Master* and a contract's words (*common supply*, *by agreement*, *resolutions hold better than most contracts*), and no oath. The Old Blood give the older name first, each in the deep register's Irish: *Tine Chnámh*, *Aonach an Chaolais*, *An Chéad Sneachta*.
- *No priest, no god's day.* None of the Mark's three is led by a priest or said to belong to a god (§1.2's contempt).
- *Slurs.* One: the losing boat *rowed like a man with a tithe-man on his back*, a Markman's word for the Aurennais, about their work (the tithe). The Aurennais at the Fair, who has stopped finding the ring a comfort and goes to First Snow every winter, is the contradiction in the same draft.
- *The duel.* By yield and with no steel drawn, a quarrel finished by noon (§1.2). Lost in an occupied town (§12a).
- *No chosen one.* First Snow's *Nobody asked yours* is about nicknames, not a prophecy. The Old Blood line about the old ones watching the sky for something says no more than §3.1 does: the makers saw something look through.
- *Silent, chosen plainly:* the lights (a hook, nothing hangs on them), what the Mark believes (iron, blood, fire and oath, and no god's day), the inland Strait Fair (lake, river or feet).

---

## Festivals on the Calendar, III — the Commencement, the Caravan and the Lamps on the Water

*Unapproved.* *Drafted 25 Oct 2026. Backlog L9, *Festivals on the calendar* (OG-107), the third and last run: Aurenne's three, placed on the calendar by the first run (21 Oct, unapproved) and left for this one. The frame is the first run's exactly: no quest, a greeting by people, the square filled, a *Due* line, and one small act a year per town, remembered as `worldState.festivals[<key>:<site.id>]=year`. The concept sheet's *a festival of learning, a spice caravan, lamps set afloat* are these three.*

### What the canon fixes, and where it is silent

- *Aurenne* (§1.3): warm; dunes and salt marsh, terraced coasts, *the sea is a road, not a wall*; the academy's white towers; oasis towns and caravanserai inland. **The Compact**: merchant houses under the Church of the Weaver, Priors over the Church's towns, Factors over the houses' ports, every hull tithed. **Known for ships that come back.** **Pride:** ledgers, learning, paper over oaths. **Contempt:** brawling, duels, *gate-grubbing*. So Aurenne's festivals are kept on paper: a roll read out, a contract honoured, a ledger read at the quay. Nobody fights, and nobody swears.
- *Aurennais speech* (§2): formal, with honorifics (*Master*, *Factor*, *Prior*), qualifiers and contract metaphors, and never an oath. Its names are the approved *Aurennais Register*'s, drawn from `NAMES.aurennais`.
- *The Church* (§3.1) is a later Aurennais institution that took the Weaver's name and forgot the price. It reads the Commencement's names, because it sits beside the academy (§1.3). It has no part in the Caravan, which is the Factors' business, or in the Lamps, which belong to the harbour. It is not the Gatelands' many gods (the first run's note), so none of the three goes to a god by its work. The weekday is only the calendar's name for the day.
- *The Lamps and the Lanterns* (the first run): each mirrors the other, on purpose. The Gatelands send a light *up* after those who went *in*. Aurenne sets one *out* on the water for those who are *out*, and the ships mostly come back. The Lamps are glad first and sad second, the Lanterns the other way round.
- *§10a*: the surface is pleasant. The Commencement is proud, the Caravan rich, and the Lamps lovely.
- *Silent: where the saffron grows.* The concept sheet has *a spice caravan* and the first run has *the saffron caravan in from the dunes*. Saffron is a flower's threads, and dunes grow no flowers. I chose the plainest reading: it is grown in the oasis gardens beyond the dunes and carried across them. One caravan cannot reach every town in a day, so the caravan splits at the last well into as many strings as there are towns. The custom is what makes the date one date.
- *Silent: the academy's name, and where it stands.* The canon names neither, and this draft names neither. A person says *the academy*, as the canon does.
- *Silent: what the Old Blood of Aurenne call the three.* Canon §2 gives the Old Blood one register everywhere, the Irish deep register, so they give the older name in it, as the first two runs did.

### 1. The three, on the calendar (the first run's table, unchanged)

| Festival | Date | Weekday | Custom |
|---|---|---|---|
| **The Commencement** | Shearing 6 | Weaverday | the academy's year opens: the town's admitted are read from the steps at ten, and the scholars' purse is subscribed |
| **The Caravan** | Reaping 9 | Stoneday | the saffron in from beyond the dunes, the first bale opened on the square, a pinch to every household by the old contract |
| **The Lamps on the Water** | Lean 4 | Seaday | at dusk, the harbour's ledger read from the quay and a lamp set on the ebb for every hull at sea; the lost are struck and their lamps go last |

**The names stand.** *The Commencement* is the academy's own word. Aurennais say it in full and nobody shortens it. *The Caravan* needs no other name in Aurenne. *The Lamps on the Water* is said *the Lamps*, as the Gatelands say *Lantern night*. An inland town keeps the Lamps at its fountain, and says the fountain is going to the sea too, only by way of the drains.

### 2. The Commencement — Shearing 6, a Weaverday

**The custom.** The academy writes to every town of Aurenne in the spring with the names of the town's children it has admitted, and on Shearing 6 the names are read from the steps of the town's church (or its customs house, in a port) at ten in the morning, by the Prior or the Factor. The admitted stand when they are named. From nine until noon a bursar sits at a table on the square taking subscriptions to the town's scholars' purse, which pays for the admitted's books and passage, and at noon the subscribers are read too, in the order they paid. The order is by date of payment, never by rank, and the town is very proud of that.

**How many.** Each town has none, one or two admitted a year, drawn from `seededRng('commencement', site.id+':'+year)`: none half the time, one a third of the time, two otherwise. A city has one more. Their names come from `NAMES.aurennais` on the same stream, and they are not residents (the academy's children are already packed).

**Due line:** *The Commencement — the academy's year opens; the town's admitted are read from the steps at ten.*

**Greetings** (by the speaker's people):

**Aurennais:**
> "It is the Commencement, Master. The academy's year opens today, and the names it has admitted from the town are read from the steps at ten. There is a subscription for their books, should you be minded. There is always a subscription."

**Gatelander:**
> "It's their Commencement. They read out on the steps which of their children are off to the academy, and the whole town claps like it's a wedding. A child that goes up the white towers comes home talking strange, they say. They clap anyway, and I'd clap with them."

**Markman:**
> "Reading day. They read the kids' names off a paper and clap. Kid goes off to learn letters. I learned mine at forty. Took a week."

**Old Blood:**
> "An Chéad Léamh. The first reading. There was a law about reading, once. It was not about names."

**The Prior or the Factor** (the town's lord), on the day, before their topics:
> "It is the Commencement, Master. I am reading names at ten, and I have nothing else to read before then. Tomorrow, if it is business."

**At ten, the reading** (a `showMsg`, once, if the player is on the square from 10:00 to 10:30; `{title}` is the lord's title, `{A}` and `{B}` the admitted):

- Two:
  > *At ten the {title} reads two names from the steps, admitted to the academy: {A} and {B}. They stand. Their families are applauded as if they had written the letters themselves.*
- One:
  > *At ten the {title} reads one name from the steps, admitted to the academy: {A}. She stands* (or *He stands*) *, and the square applauds until she sits* (*he sits*) *again.*
- None:
  > *At ten the {title} reads from the steps that the academy admits no one from {town} this year. There is applause anyway, for the attempt.*

**The act: a subscription to the purse.** The bursar (a townsperson of the town, the role *Bursar*, generated from the town's people; Aurennais in an Aurennais town but for a port's blend) sits on the square from 9:00 to 12:00. Greeting:
> "The scholars' purse, Master. Books and passage for the town's admitted, by subscription. Two gold enters a name on the roll, and the roll is read at noon."

Topic: **A subscription** (2 gold; once a year per town, `'commencement:'+site.id`). It opens the choice:

**How shall I enter it?**
- *Under my name.*
- *As a friend of the town.*
- *Leave my name off.*

The answers (Aurennais bursar):

- *Under my name.*
  > "Entered, Master: {player}. You will be read at noon in the order you paid, which is after the cooper. The order is by date of payment and not by rank. It is the whole of the town's democracy, and the town is very proud of it."
- *As a friend of the town.*
  > "Entered, Master: *a friend of the town*. It is the commonest name on the roll, and the most generous. I have never known why."
- *Leave my name off.*
  > "Then I shall enter the sum and not the name. The ledger must balance. The roll need not."

The log:
> *You subscribe two gold to the scholars' purse.*

**At noon, the subscribers** (a `showMsg`, once, if the player subscribed that day and is on the square from 12:00 to 12:30):

- Under their name:
  > *At noon the subscribers are read in the order they paid. Yours is among them, after the cooper's. Nobody turns round, which in Aurenne is a compliment.*
- As a friend of the town:
  > *At noon the subscribers are read in the order they paid. "A friend of the town" is read four times. One of them is yours.*
- Left off:
  > *At noon the subscribers are read in the order they paid. Yours is not among them, and the sum is.*

**The next day**, an Aurennais of that town, once, if the player subscribed:
> "You subscribed to the purse yesterday, Master. The town will remember it, in writing, which is the only way we remember anything."

The bursar in another people's voice, where a port's blend puts one there:

- **Gatelander:** "It's the scholars' purse. Two gold puts your name on the roll, and the roll's read at noon. I'd not say it buys you anything, but a name read in a square is a name that's been heard." The answers: *Under my name:* "Down you go, after the cooper. They read by who paid first, not who's grandest. It's the one thing here I'd take home." *A friend of the town:* "A friend of the town. Half the roll's that. You'd think the town had more friends than people." *Leave my name off:* "Then it's a coin with no name on it, and the books won't mind."
- **Markman:** "Purse for the kids' books. Two gold. Your name's read at noon." The answers: *Under my name:* "Down. After the cooper." *A friend of the town:* "Friend of the town. Aye. Most are." *Leave my name off:* "No name. Fine. Coin's coin."
- **Old Blood:** "The purse for their books. Two. Your name is read at noon, if you wish it read." The answers: *Under my name:* "Written." *A friend of the town:* "Written, as a friend." *Leave my name off:* "The coin, then, and not the name. That is the older way."

### 3. The Caravan — Reaping 9, a Stoneday

**The custom.** The caravan comes in from the oasis gardens beyond the dunes with the year's saffron, and splits at the last well into as many strings as there are towns, so that every town of Aurenne has its string in on the same morning. At first light the caravan-master opens the first bale on the square. By a contract older than the Compact, every household is weighed one pinch of the first bale, and anyone who is not a household may buy a pinch for two gold. Then the fair runs till dusk: the rest of the saffron, dates, salt from the pans, glass, and a man who sells carpets. The town's Factor weighs at the scale, and every pinch is weighed in front of the buyer, because that is in the contract too.

**Due line:** *The Caravan — the saffron in from beyond the dunes, and a pinch of the first bale to every household.*

**Greetings:**

**Aurennais:**
> "The caravan is in, Master, from beyond the dunes. The first bale is open on the square, a pinch to every household by the old contract. The contract is older than the Compact, and it has been renegotiated less."

**Gatelander:**
> "The caravan's in. Saffron and dates and salt, and a man who'll sell you a carpet if you stand still. Never stand still at a caravan, they say. I stood still once. It's a good carpet."

**Markman:**
> "Caravan's in. Spice and dates. Dear, but it's honest dear. They weigh it in front of you."

**Old Blood:**
> "An Cróch. The saffron. A flower's heart, pulled by hand, three threads at a time. They carry it across the dunes for that. Nothing else is worth carrying so far."

**The Factor or the Prior** (the town's lord), on the day, before their topics:
> "The caravan is in, Master, and the scale is the only business in the town today. Tomorrow I am at your disposal, at a slightly better rate."

**A trader of the town** (any shopkeeper in an Aurennais town, the shop's greeting that day; Aurennais):
> "Caravan day, Master. My prices are unchanged, and I would ask you not to compare them with the caravan-master's, who pays no rent."

**The caravan-master** (on the square from 6:00 to 18:00; a townsperson generated from the Aurennais bank by `seededRng('caravan', site.id+':'+year)`, the role *Caravan-master*, never a resident: the strings are the dunes' people, not the town's). Greeting:
> "The first bale is open, Master. A pinch to every household, by weight and by the old contract, and two gold for a pinch to anyone who is not a household. You may count yourself one if you like. The scale will not argue."

Topics:
- **How was the road?**
  > "Long, which is its nature, and dry, which is its habit. We lost no beast and no bale, and one quarrel, which we left at the last well. Quarrels keep badly in the heat."
- **Why the same day everywhere?**
  > "Because the contract says the first bale is opened in every town on one morning, Master, so that no town has its saffron before another and charges the rest for the privilege. We split at the last well. It is the only morning of the year the Factors are all equally disappointed."
- **A pinch of saffron** (2 gold; once a year per town, `'caravan:'+site.id`):
  > "Weighed, Master. Eleven threads. The contract says ten. The eleventh is the road's, and the road is in a good mood."

The pinch goes into the bag as **A twist of saffron** (misc, weight 0, sells for 1): *Eleven red threads in a twist of paper, from the first bale of the year. In Aurenne a thread goes into the first bread of the season. Nobody calls it luck.*

The log:
> *You buy a pinch from the first bale. It is weighed in front of you, as the contract says.*

**The next day**, an Aurennais of that town, once, if the player bought a pinch:
> "You were weighed a pinch yesterday, Master. Put a thread in your bread. It does nothing whatever, and everyone does it."

**An occupied town** (`TS(site).flags.occupied`). No string comes in, and there is no caravan-master or scale. The greeting, Aurennais:
> "The caravan has gone round us this year, Master. A string does not enter a town under another flag. The contract is silent on the point, and the caravan-master is not."

### 4. The Lamps on the Water — Lean 4, a Seaday

**The custom.** At dusk (18:00), the harbourmaster stands on the quay steps with the harbour's ledger of hulls, the one the tithe is kept in, and reads every hull of the town that is at sea, with her master's name. A small clay lamp of oil goes onto the water for each, on a board, and the ebb takes them out toward the harbour mouth in a slow line. Then the hulls lost that year are read, and struck through in the ledger, and their lamps go last. The ships of the Compact come back. The Aurennais say it is the lamps, and they say it as if it were a joke. Lamps are sold on the quay from 17:00 to 22:00 to anyone who wants to set one. An inland town keeps it at its fountain, reads the names of its own people at sea, and sets the lamps on the basin, where they go nowhere and nobody minds.

**How many are struck.** None, one or two hulls a year, from `seededRng('lamps', site.id+':'+year)`: none six years in ten, one three in ten, two one in ten. The lost hulls' names are drawn from the game's ship names on the same stream.

**Due line:** *The Lamps on the Water — at dusk, the ledger read at the quay and a lamp on the ebb for every hull at sea.*

**Greetings** (all day):

**Aurennais:**
> "It is the Lamps tonight, Master. A lamp on the water for every hull in the ledger that is out, to light her in. The ships of the Compact come back, as you will have heard. We should not like to be asked to prove that it is the lamps."

**Gatelander:**
> "It's their Lamps tonight. A light on the water for every ship they've got out, and one for each that's not coming home. Their ships come back, mostly. Ours don't, and we've no lamps for them. I've wondered about that."

**Markman:**
> "Lamps tonight. They float one out for every ship they've got at sea. Pretty. We just count ours when they're back."

**Old Blood:**
> "Soilse na Mara. The sea's lights. They set them out to bring the ships in. The sea takes the lamps either way."

**The Factor or the Prior** (the town's lord), on the day, before their topics:
> "It is the Lamps tonight, Master. I keep no business after noon on this day, and before noon only a little."

**The lampseller** (on the quay from 17:00 to 22:00, or at the fountain inland; a townsperson of the town, the role *Lampseller*, generated from the town's people). Greeting:
> "Two for a lamp, Master: oil, wick, and a board that will float until the tide forgets it. Name the hull or don't. The water reads no ledger."

Topic: **A lamp** (2 gold; once a year per town, `'lamps:'+site.id`). It opens the choice:

**Who is it for?**
- *For a ship at sea.*
- *For one that did not come back.*
- *For the next ship in.*
- *For my own ship.* (only while the player has a ship, `worldState.ship`)

The answers (Aurennais lampseller):

- *For a ship at sea.*
  > "Then set it on the ebb, Master, and it will go out to meet her. They never do, of course. But they go the right way."
- *For one that did not come back.*
  > "Then it goes last, Master, with the ones the harbourmaster strikes. It is no less a lamp for that. Some would say more."
- *For the next ship in.*
  > "Generous terms, Master: a lamp for whoever is owed one. The water will settle the account."
- *For my own ship.*
  > "Then it will be lit when she comes in, Master, which is the whole of the contract. Do be sure to come in."

**Setting it on the water.** After the choice, the log, and the lamp goes out from the quay's edge:
> *You set the lamp on the water. The ebb takes it out among the others, a slow line of lights toward the harbour mouth.*

Inland:
> *You set the lamp on the fountain's basin among the others. It turns once, and stays.*

**At dusk, the ledger** (a `showMsg`, once, if the player is within 30 of the quay, or of the fountain inland, from 18:00 to 18:30; `{A}` and `{B}` are the struck hulls):

- None struck:
  > *At dusk the harbourmaster reads the ledger from the quay steps: every hull out, and her master's name, and a lamp onto the water for each. Then the ledger is closed. Nothing is struck this year, and the quay cheers as if it had rowed every one of them home.*
- One struck:
  > *At dusk the harbourmaster reads the ledger from the quay steps: every hull out, and her master's name, and a lamp onto the water for each. Then one more is read, the {A}, and struck through, and her lamp goes last.*
- Two struck:
  > *At dusk the harbourmaster reads the ledger from the quay steps: every hull out, and her master's name, and a lamp onto the water for each. Then two more are read, the {A} and the {B}, and struck through, and their lamps go last.*
- Inland (none struck, or any, the same line):
  > *At dusk the {title} reads from the ledger the names of the town's people at sea, and a lamp is set on the fountain for each. They do not go anywhere. Nobody minds.*

**The next day**, an Aurennais of that town, once, if the player set a lamp:
> "You set a lamp last night, Master. I saw. Lamps are entered on no ledger, which is, I think, the one kindness the Compact allows itself."

The lampseller in another people's voice, where a port's blend puts one there:

- **Gatelander:** "Two for a lamp, and it'll float. You needn't say who it's for. The water's not asking." *For my own ship:* "Then she'll have a light to come home by. Mind she does."
- **Markman:** "Two. It floats. Who for's your business." *For my own ship:* "Your own. Aye. Then come back for it."
- **Old Blood:** "Two. It goes out on the ebb. You need not say." *For my own ship:* "Then it waits for you on the water. Come in."

### 5. In the Gatelands and in the Mark

On Aurenne's three, an Aurennais in a town of another island (a port's blend, a Factor's house, a Church) greets once that day:

- The Commencement: "The academy reads its names today, Master, at home. I was read once. I find I still stand up a little when I think of it."
- The Caravan: "The caravan is in at home today, Master. I am told the saffron here comes from the same bale, by way of four Factors and a considerable margin."
- The Lamps: "It is the Lamps at home tonight, Master. If you are near the water at dusk, I should be obliged if you would look at it for a moment."

### What in the code would carry it

- `60-shop.js`, the first run's `FESTIVALS`: fills Aurenne's three entries (`commencement`, `caravan`, `lamps`) with `greet` for the four peoples and `due`. All three are fixed dates, so `festivalOn(at,nation)` needs nothing new.
- `feastGreeting(def)` as the first run gives it, reading Aurenne's three. The lord's line goes before `lordTopics` on the day, as the first two runs do. The trader's Caravan line goes in the shop greeting on that day. The abroad lines (§5) are the second run's §5 mechanism with an Aurennais speaker.
- **The readings**: three `showMsg`s on the clock, once a visit within reach of the square (the Commencement at 10:00 and 12:00) or the quay or fountain (the Lamps at 18:00), as the second run's Blaze and Strait Fair narrations do. Their numbers come from `seededRng('commencement'|'lamps', site.id+':'+year)`, so they are the same on any machine and after a load. The admitted's names come from `NAMES.aurennais`, and *She stands* or *He stands* is taken from the bank the name came from. The struck hulls' names come from the ship-name pool the other ships draw from (`85-world-sea.js`).
- **The three people**, each a townsperson on the plaza in their hours with one topic, as the first run's lanternmaker: the bursar (9:00–12:00), the caravan-master (6:00–18:00, not in an occupied town) and the lampseller (17:00–22:00, on the quay in a port, at the plaza's fountain inland).
- **The acts**: each costs 2 gold and writes `worldState.festivals[<key>:<site.id>]=year` (a world key, on `_applyLoadData`'s list with the first run's `festivals`). The Commencement's choice is kept for the noon line in the session only (`FEST.subscribed`). After a load the noon line is skipped, which is harmless. The Caravan's pinch is a misc item made in place (`{type:'misc',name:'A twist of saffron',ico:'🌼',weight:0,sellMult:…,desc:…}`, `bagAdd`). The player's name in the bursar's line is `playerName`.
- **The test** (the first run's `tests/festivals.test.mjs`, extended):
  - on Shearing 6 in an Aurennais town a townsperson greets with the Commencement's line for their people, and the same day in a Gatelands town greets as any day;
  - the subscription takes 2 gold once and its key saves and loads;
  - on Reaping 9 the pinch is bagged and the occupied town has no caravan-master;
  - on Lean 4 the ledger's struck count is the same on two boots, and *For my own ship* shows only with a ship.

**For the look builder** (backlog A, under this draft's name): the bursar's table on the square; the caravan's string on the square from 6:00 to 18:00 (pack-beasts and bales, the scale, an awning), which the words do not need; the lamps going out on the ebb from the quay (small lit lamps drifting out over two minutes, a few dozen at once) and turning on the fountain's basin inland.

### Checked against the canon

- *Register.* Every Aurennais is formal and qualified, with *Master* to the player and the titles as offices (*the Prior*, *the Factor*, *the harbourmaster*). Every one uses contract and ledger words (*the old contract*, *renegotiated*, *by date of payment*, *the ledger must balance*, *generous terms*, *settle the account*, *the whole of the contract*), and none swears. Gatelanders speak in proverb and hearsay (*they say*, *Never stand still at a caravan*), and none gives a bare yes. Markmen use short sentences and *aye*. The Old Blood give the older name first in the deep register's Irish (*An Chéad Léamh*, *An Cróch*, *Soilse na Mara*) and say little after it.
- *Slurs and their contradiction.* None is said outright. The Markman who *learned letters at forty* contradicts *the unlettered* (§2.1). The Markman's *honest dear … they weigh it in front of you* contradicts *tithe-men … charge for the knot*. The Gatelander's *Their ships come back. Ours don't* is §2.1's own line, given to a Gatelander at the Lamps.
- *The Church.* It reads the Commencement's names and nothing more. It has no part in the Caravan or the Lamps, and no festival is given to a god.
- *The Withdrawal.* The Old Blood's *There was a law about reading, once. It was not about names.* keeps §3.1's law (*touching is permitted; understanding is not*) as a fact remembered, not explained.
- *No chosen one.* Nothing here names the player but the bursar's roll, and that is a subscription.
- *§10a.* All three are glad on the surface. The struck hulls go last and are no less lamps for it. Six years in ten nothing is struck, and the quay cheers.
- *Silent, chosen plainly:* where the saffron grows (the oases beyond the dunes), why every town has its caravan on one morning (the string splits at the last well), and the academy's name (none given).

---

## The Underworld — a fence, a broker, a smuggler, a duellist and a pilgrim

*Unapproved.* *Drafted 26 Oct 2026. Backlog L2, *The underworld* (OG-006): "an information broker, a river smuggler, a contract killer whose hook cuts both ways, a cheerful goggled fence who knows relics, a highwayman-pilgrim. Fills the crime system's fences and black market. The Church of the Weaver needs its own sign where these sheets draw a cross." Five named people, one for each line of the sheet, one of each people and two of the Gatelands', each standing where the game already has a place for them, with a service on machinery that exists and one thread that the world remembers. Two places where the game has no rule yet are marked **Rule read** for the systems builder; the lines do not depend on which way the rule goes.*

### What the canon fixes, and where it is silent

- *The Gatelands: a salvage economy of adventurers, rubbings and relics that the Crown licenses and taxes* (§1.1). *The Compact: the Gatelands' salvage trade is sacrilege to the Church* (§1.3). So a relic has three prices: the Crown's tax, the Church's anathema, and whatever a fence will give.
- *The Mark: disputes by duel; Mark duels legal* (§1.2, §1.5). A Markish killer for hire is a duellist for hire, and works in the open.
- *Port Blackhand: a port on the strait; pirate-friendly* (§9). *Ports blend: two peoples in the crowd and a third at the quay* (§1.5). An Aurennais fence there is the foreign quarter, not a stranger.
- *Every rubbing-seller and hermit who points the player at a gate is Old Blood* (§3.3). *The Withdrawal forbade the reading of sigils; touching is permitted, understanding is not* (§3.1). The broker is Old Blood, and sells what she sees, never what she reads.
- *Royal roads with patrols* (§1.1); the moor's road foe is already the Highwayman (`ENC_BIOME.moor`, `82-world-structures.js`). The six gods have shrines (§4.1), and a prayer is counted per shrine (`worldState.shrines`).
- *The Church needs its own sign* (backlog L2). The canon gives the Weaver's icon: **a shuttle** (§4.1). Where the concept sheets draw a cross, the look builder draws a shuttle.
- *Silent:* whether an honest trader buys stolen goods (today every shop does); what Varek is called by those who fear to name him (the plainer thing: they do not name him). Both are read the plain way below.

### The five

| | People | Where | What they do |
|---|---|---|---|
| **Philo**, the glass-grinder | Aurennais | Port Blackhand, the tavern's back room, any hour | the fence: buys stolen goods and relics, asks nothing |
| **Uallach** | Old Blood | Aurenne's capital, the tavern, from dusk | the broker: sells answers the size of the question |
| **Brógán** | Gatelander | the Gatelands' port at the mouth of its greatest river, on the quay, at night | the black market: cheap goods off carts, and they are stolen |
| **Eadburh Two-Purses** | Markman | Caer Slige, by the yard, by day | the duellist for hire: tells you who paid her |
| **Siadhal** | Gatelander | a moor road of the Gatelands, on the road, once a game-week | the highwayman-pilgrim: robs the Crown, tithes to the gods |

Faces for the bodies builder: Philo lean and quick, olive, a leather harness of lenses pushed up on his brow (two lenses and a third on a hinge); Uallach small, grey-pale, black-haired, the marks at both wrists, very still; Brógán broad and wet to the knee in a short oilskin; Eadburh tall, ash-blond, a scar through one eyebrow, two purses at her belt; Siadhal thin, in a pilgrim's hooded cloak over a highwayman's leather, a staff and a short sword.

### 1. Philo, the glass-grinder (Aurennais; formal, *Master*, contracts, never an oath)

**Greeting, first:** "Master! Come in, and mind the lenses. They are the only honest things in the room."
**Greeting, again:** "Master. Again, and on the same terms, I trust."

**Topics**
- *What do you deal in?* — "Glass, officially. I grind lenses for the captains here, who like to see a Compact sail before it sees them. Unofficially, Master, I buy what the honest shops will not, and I ask nothing about it. Asking is a service. I do not offer it."
- *Why the lenses?* — "Two, and a third that swings down. Gate work is cut finer than a hair in places, and I like to read the price before I pay it. The price, Master. Not the script. I am cheerful, not a fool."
- *What do you make of old things?* — "Ah. Gate work. The Crown would tax it, the Church would call it sacrilege to sell and a sin to keep, which leaves only me. I give a fair price and forget the face that brought it. The forgetting is included."
- *A long way from Aurenne.* — "The Compact tithes every hull, Master, and Port Blackhand tithes none. A man of business goes where the arithmetic is kind. The Church would not approve. The Church is not here."
- *Show me what you'll buy.* (opens his trade) — "Show me. I promise to be unimpressed, and then to pay you anyway."
- *Farewell.* — "Good day, Master. We never met, on the usual terms."

**His trade.** He buys anything, stolen or not, at the honest price, and sells nothing but lenses (none in the items table yet; until one is, his shop sells nothing). A stolen thing sold to him leaves your pack, and the cells cannot take it back.

**Rule read (systems): an honest trader in the town where a thing was stolen will not buy it.** Elsewhere they buy it as now. This is what makes a fence worth the walk. A stolen item would carry the site it was taken from (`stolen: <site id>`, where it is `true` today; a save's `true` reads as *unknown*, and an honest trader then buys it). The refusal, said instead of the sale, in the trader's people's words:
- Gatelander: "I'd know that anywhere. It came out of a house on this street. I would not buy it, and I'd not be the last to say so."
- Markman: "That's from up the street. Put it down. I don't buy off thieves."
- Aurennais: "Forgive me, Master. I know that piece; it belongs to a house in this town. I cannot take it on any terms."
- Old Blood: "That is not yours. I will not."

### 2. Uallach (Old Blood; sparing, exact, the older word for the thing)

**Greeting, first:** "You want to know a thing. Sit."
**Greeting, first, to an Old Blood player:** "You want to know a thing. You could ask me for nothing. Sit."
**Greeting, again:** "Again. What is it you want to know."

**Topics**
- *Who are you?* — "Uallach. In the old tongue it is a boast. My mother did not know that. I do."
- *What do you sell?* — "Answers. Exactly the size of the question. Ask a small one, pay a small price."
- *Where is a warm stone? (30 gold)* — "{gate}. {direction} of here. It is warm. I have not touched it, and I will not." When no unread gate is within reach: "None near enough to feel. Keep your coin."
- *Who is looking for me? (20 gold)* — one line per town that holds a bounty on you, nearest first, at most three: "{town} wants {n} gold of you." Then, if any town has shut its gates to you: "{town} has shut its gates. That one will not be bought off with the fine alone." With no bounty anywhere: "Nobody. Yet. That changes. It always does." (The 20 gold is taken only when the answer is not *nobody*: "Nobody. Keep your coin.")
- *Can you read the stones?* — "I could. We were told not to, fifteen hundred years ago, and the ones who did went quiet. I sell what I see. Not what I read."
- *The Church?* — "They built a house on our name and pray in it. They would pay well for what I know of them. I do not sell it to them."
- *The cold man?* (once the player has met Varek) — "No. Not for any price. He would know I had said it, and he would come to ask me why."
- *Farewell.* — "Go gently."

When an Old Blood player asks a paid question, she takes no coin and says, before the answer: "Keep it."

### 3. Brógán (Gatelander; proverbs, indirection, the Weaver)

**Greeting, first:** "A dry boat on a wet river, and you'll want to know why. Weaver keep you."
**Greeting, again:** "Yourself again. The river's lower. The price is not."

**Topics**
- *What do you carry?* — "Whatever the Crown would tax, if the Crown were looking. It mostly isn't. A river has two banks, and the Herald's men only ever stand on the one."
- *Where does it come from?* — "Ask the fish where it got its water. Off carts, mostly. The carts don't miss it, and the men who drove them miss it less."
- *Is it stolen?* — "Nothing's stolen that's been a week on the river, my father said. My father was hanged at Coeur de Vie, so I'd not lean on it."
- *Any trouble on the river?* — "The Herald's men have a boat now. They row it like a grudge. You'd hear them a mile off, and I do."
- *Show me what you have.* (opens his trade) — "Look all you like. Touching is paying."
- *Farewell.* — "Weaver keep you dry."

**His trade.** At night only (from 21h to 4h; by day his boat is tied and he is not there). The town's general goods at three-fifths of their price, and lockpicks always, every item marked stolen (`stolen:true`), so the cells take it as they take anything else. That is the black market's cost, and he has told you so.

### 4. Eadburh Two-Purses (Markman; short, *aye*, nicknames, iron and blood)

**Greeting, first:** "Aye. Two-Purses. You'll have heard."
**Greeting, first, to an Old Blood player:** "Speak. I'll stand."
**Greeting, again:** "You again. Paying, or paid for?"

**Topics**
- *Why Two-Purses?* — "One purse to fight. One to tell. Whoever hires me, the other side hears who. Then it's fair. Then it's a duel, not a knifing."
- *You kill for money?* — "I fight for money. On the yard, by the law, with a ring and a yield. If he won't yield, that's his choice. Our law's plain."
- *Has anyone paid you for me?* — the thread below; with nothing to tell: "Not yet. You'd know. That's the second purse."
- *Farewell.* — "Iron and blood."

**The thread: paid for.** When a town's lord has cause against you (the town holds a bounty on you of 100 gold or more, or its favour has fallen to −10 or below), there is a chance, one game-week in three, keyed by the week and that town, that its lord has paid Eadburh. Then *Has anyone paid you for me?* answers:
- "Aye. {lord's title} of {town} paid me to meet you on the yard. That's the first purse. This is the second: it was {lord's title} of {town}. Now we're square. The yard's open at noon, any day you like. Or never. I'm not proud."

A topic opens beside it, *Meet you on the yard.*: "Noon, then. Bring your own blade. I bring mine." At noon at the yard she fights you under the yard's rules as they stand (the ring, the yield). Then:
- She yields: "Yielded. Tell {lord's title} I fought it. I keep both purses."
- You yield: "Yield taken. Get up. I'll tell {lord's title} you bled. That's what was paid for."
- You kill her after she yields: the yard's own ending for a killing after the yield, and the League's line for it, as for Rowe. Her two purses are on her (her fee, 2 × 40 gold by the town's tier).

Either way the thread is done for that town; another town can pay her later. *Or never* is a real answer: nothing happens if you do not come.

### 5. Siadhal, the highwayman-pilgrim (Gatelander)

He leads one of the moor's Highwayman bands on a Crown road of the Gatelands, once a game-week at most, keyed by the week and the cell.

**Rule read (systems): he yields.** At a third of his health he drops his blade, as a guard yields to you today, and the band's others run. His yield:
- "Hold, hold. I'm a pilgrim, and a pilgrim's not to be killed on the road. It's bad luck for the both of us, and worse for you."

Then he can be talked to:
**Greeting:** "Siadhal. I walk the six, the Sea to the Weaver, and the Crown pays my way, whether it knows or no."
- *You rob people.* — "I rob carts. The carts are the Crown's, and the Crown takes a tithe of every field it never ploughed. I give the shrines a tenth. That's more than the Crown gives them."
- *Which shrine now?* — "{god}'s, next. {shrine}, {direction} of here. The road's long enough for two, but I'd sooner walk it alone." (the next of the six in the canon's order, after the last he had reached, and the nearest shrine of that god)
- *Go, then.* — "Weaver keep you. You'll not see me again, unless you're on the Crown's road with the Crown's cart." He walks off the road and is not met again.
- *(killing him after the yield)* — no line. His purse holds 12–30 gold and *A pilgrim's token* ("A tin shuttle on a cord, worn smooth. Six notches, five of them filled.").

**If he was let go:** the next time you pray at the shrine of the god he was walking to, before the boon's own line: "Someone has left a coin on the altar, and a name scratched beside it. Yours." Once only.

### 6. Talk about them, in the towns

One rumour each, for `liveRumours` in the towns named:
- Port Blackhand and the Mark's ports: "There's an Aurennais in the back of the tavern grinding glass. Buys anything. Won't look you in the eye, and won't need to."
- Aurenne's capital: "If you need a thing known, there's an Old Blood woman at the tavern after dark. She doesn't haggle. She doesn't need to."
- The Gatelands' river towns: "Lamps on the river at night with no boat under them, near enough. The Herald's men are slower than the lamps."
- The Mark's towns: "Two-Purses fought a reeve's quarrel at the yard last month. The reeve knew who'd paid her before she'd drawn."
- The Gatelands' moor towns: "A man on the moor road took a tax cart and left the driver his dinner. Says he's a pilgrim. The Herald says otherwise."

### What in the code would carry it

- **The five defs**: authored defs in the manner of `spireRoweDef` and `SPIRE_FOLK` (`87-world-quests.js`), `authored:true`, with a `people`, a `temper`, a fixed name, and `topics` as a getter where a topic reads the world. Placed by `anchoredPlaces()` (Port Blackhand's `blackhand`; Aurenne's capital, `FACTIONS.compact.seat`; Caer Slige, `caer_slige`) and, for Brógán, the Gatelands port nearest the mouth of the home island's longest great river in `WORLD.routed` (picked once per seed, kept in `anchoredPlaces` as `brogan`). Siadhal by `ENC_BIOME.moor`'s Highwayman, with a seeded roll per week and cell (`seededRng('pilgrim', i+','+j+':'+week)`), id `pilgrim:<i>,<j>`.
- **Philo's trade**: a shop of the fence's kind in `60-shop.js` that buys stolen goods; the refusal is the **Rule read** above, in the sell path, with the four lines by the keeper's people.
- **Uallach's answers**: *Where is a warm stone?* is `rubbingTopics`' lookup (`nearestSigilDoorFrom`) without the item, writing `worldState.rubbings[seed]` so the compass marks it as a rubbing does. *Who is looking for me?* reads `worldState.crime` (`bountyAt`, `c.shut`) over `allSites()`. *The cold man?* shows once `vstate()` has any `done` key.
- **Brógán's trade**: `SHOP_STOCK.misc` at ×0.6 with the lockpick, each item `stolen:true`; open by `forceTime`'s hour.
- **Eadburh's thread**: the yard's duel (`q.kind==='duel'`, S373) with Eadburh as the opponent. Saved: `worldState.twoPurses[siteId]={week, state:'told'|'won'|'lost'|'killed'}`. It is the character's quarrel, so `twoPurses` goes in `SS_CHAR_WS` and in `_applyLoadData`'s list.
- **Siadhal**: the yield is the **Rule read** above, on the guard's yield (`86-world-crime.js`). Saved: `worldState.pilgrim={fate:'spared'|'killed', god, coin:false}`, the world's (in `_applyLoadData`'s list); the coin line on the shrine's prayer (`87-world-quests.js`, the altar's `worldState.shrines` path). *A pilgrim's token* is a misc item.
- **Rolls**: Eadburh's week and Siadhal's week are seeded streams keyed by place and week (co-op rules); which line is said is cosmetic.
- **The Church's sign**: a shuttle, for the look builder, wherever a concept sheet draws a cross (backlog L2).

### Checked against the canon

- *Registers* (§2): Philo has *Master*, *terms*, *arithmetic*, and no oath; Uallach's lines are the shortest and take the older word (*the cold man* is not a name, and nobody names him); Brógán answers nothing straight and blesses by the Weaver; Eadburh says *aye*, swears on iron and blood, and goes by a nickname; Siadhal is a Gatelander with a proverb's turn and the Weaver.
- *Slurs* (§2.1): none. Brógán's father, hanged by the Crown, and Philo's *the Church is not here* are about work and gods.
- *The Withdrawal* (§3.1): Uallach and Philo both stop at the script: she will not read it, he will not try.
- *§10a*: none of the five is a villain. Two of them hurt you only if you choose them (Brógán's goods, Eadburh's yard), and one of them tells you who wants you hurt.
- *No chosen one*: Siadhal's coin is a pilgrim's courtesy, not a sign.
- *Silent, chosen plainly*: whether honest traders refuse stolen goods (they refuse it only in the town it was taken from); what the Old Blood call Varek (*the cold man*, from the canon's own Cold, §3.3; nobody names him).

---

## Faith — a priestess, a Church brother, a tide-reader, a smiling man and a child who sweeps

*Unapproved.* *Drafted 27 Oct 2026. Backlog L2, *Faith* (OG-091): "Mother Amani, Brother Alain (an Aurennais hunter of salvagers), Shevra the tide-reader (not a priest: the Mark scorns them), Father Calix (one of the awake or a villain, never the surface tone), the Veiled Child." Five named people, one for each figure on the sheet, each standing where the game already has a place for them, each with one service on machinery that exists and one thread the world remembers. Two of the five are tied to each other (Alain hunts Calix), and the player decides how that ends. One place where the game has no rule yet is marked **Rule read** for the systems builder; no line depends on which way it goes.*

### What the canon fixes, and where it is silent

- *The Compact: merchant houses under the Church of the Weaver; Priors over the church's towns* (§1.3). *The Gatelands' salvage trade is sacrilege to the Church* (§1.3); *to clear a gate is to unpick the Weaver's loom*. A brother who hunts salvagers is the Church's ordinary business, not a zealot's.
- *The Church blesses the dead into the gates without knowing what happens there* (§3.1). *The dead are erased so the world can continue* (the Clearing). Nobody on the surface knows it. A priestess who carries the dead to the gates is the gentlest face of the Church and the one closest to the thing it does not know.
- *The Mark: contempt for priests* (§1.2). So the Mark's woman of faith is not a priest. She reads water for people who need to know it, and she is paid in fish.
- *The awake look like villains from inside the world, and that is the horror* (§10a). *Grimdark belongs to the villains; the surface is pleasant.* Father Calix is one of the awake. He smiles, he is kind, and he is right about one thing nobody should be right about.
- *The Church's attention falls on the Old Blood* (§2.2). *A child either shows the marks or does not* (§3.1). An Old Blood child goes veiled where the Church counts. The sheet's white hair and glowing eyes are dropped: canon gives the Old Blood black hair, and their eyes grey only with the Cold.
- *The Guest is found in defaced niches* (§4.2). The child sweeps the shrines, the empty niche beside the altar included.
- *No chosen-one prophecies; the three descriptions are applied to the player once, in Act III* (§4.2). Calix sees something in the player and says what he sees. He does not name it, quote the descriptions or promise anything.
- *Names.* Amani is Arabic and Calix Greek, both in the Aurennais register (*The Aurennais Register*, approved 14 Oct). Alain is Norman, and the Norman register is dropped for Aurenne, so he is a Gatelander of the Crown's country, born near Coeur de Vie, who took the Church's vows in Aurenne; the sheet's note allows a convert, and speech follows the speaker (§1.5), so he talks like a Gatelander who has learned a book by heart. *Shevra* is not a Markish name. Her name is **Sæwynn**, and *Shevra* is what the strait calls her: a Gatelander deckhand's version of it, which she has never corrected. The child gives no name.
- *The sign.* The sheet draws Alain in white with a red cross. The Church's sign is the Weaver's **shuttle** (§4.1, and *The Underworld*'s note), so his tabard carries a red shuttle.
- *Silent:* what the Church does with a heretic (the plainer thing: holds him, and says no more); whether the weather can be foretold (the game already knows the weather coming, `WX.next`, so she can tell it, and only that far).

### The five

| | People | Where | What they do |
|---|---|---|---|
| **Mother Amani**, the Lantern of Ash | Aurennais | the church of the Compact's port nearest its capital, in place of its priest | heals and blesses, and carries the dead's lamp to the gates; asks the player to carry one |
| **Brother Alain** | Gatelander (the Crown's country), of the Church | the cathedral square in Aurenne's capital, by day | searches packs for rubbings; hunts *the Lamb* |
| **Sæwynn**, called *Shevra* | Markman | the quay at Port Blackhand, first light to noon | reads the weather coming, for a fish |
| **Father Calix**, the Smiling Lamb | Aurennais | the door of the lesser gate nearest Aurenne's capital, at dusk | preaches the gates; one of the awake |
| **The Veiled Child** | Old Blood | one shrine of the Gatelands a game-week, dawn to dusk | sweeps the shrine, the empty niche included |

Faces for the bodies builder: Amani tall and dark-skinned, in a white head-cloth and robes of white, blue and gold, a staff topped with a caged lantern; Alain lean and weathered, freckled, hooded, white over mail, a red shuttle on the breast; Sæwynn broad and ash-blond, her braids stiff with salt, shells and a lantern on a driftwood staff; Calix round-faced and handsome, open-handed, a gilt sunburst stitched behind his shoulders, a smiling mask at his belt; the child slight and grey-pale under a white veil to the waist, a short broom, the marks hidden at the wrists by long sleeves.

### 1. Mother Amani, the Lantern of Ash (Aurennais; formal, *Master*, the Church's contracts, never an oath)

**Greeting, first:** "Be welcome, Master. Sit, if you are tired; stand, if you are not. The house charges for neither."
**Greeting, again:** "Master. You came back, which the Church counts in your favour, though I keep no such book."
**Greeting, to an Old Blood player, first:** "Be welcome, Master. You are cold through. Sit by the lamp; it costs nothing, and I will not write it down."

**Topics**
- *Who are you?* — "Amani. The priest of this house, for my sins, which the Prior assures me are modest. The fishers call me the Lantern of Ash. It is kinder than it sounds."
- *Why the Lantern of Ash?* — "When one of the town dies, I carry a lamp from the pyre to the nearest gate and leave it at the door. The Church teaches that the dead go in to hold the world up. Somebody ought to light their way. I am told I walk too slowly for the work, and I have never once been late."
- *What do the gates do with the dead?* — "They hold them, Master. That is the teaching, and it is a comfort, and in twenty years nobody has asked me to prove it. You are welcome to be the first. I will answer you the same."
- *A blessing?* — (as every priest's: eight health) "Kneel. There. The Weaver keeps the thread; I only mind the knots."
- *Confess.* — every priest's penance (`penanceTopics`), in her own words where she says it: "It is heard, Master, and entered nowhere. Go gently, and do not make me hear it twice."

**Her thread: *A Lamp for the Door*.** Offered once, from her topic *Is there anything I can do?*, which shows while she has a dead to carry for.
- *Is there anything I can do?* — "There is, Master, if your road runs out of town. A net-mender died at the turn of the tide, and her people cannot leave the boats this week. Her lamp should go to the gate on the hill. Carry it, set it inside the door, and come back. It is a small contract. The family has paid me for it already, and I will pay you from it."
  - *I'll carry it.* — "Mind the cage; the flame is older than you are, in a manner of speaking. The gate is {dir} of here, {far}." (*A Mourner's Lamp* goes to the bag.)
  - *Not now.* — "Then she will wait. The dead are patient. It is one of their virtues."
- At the gate's door, with the lamp in the bag: the prompt *Press 'E' to set down the lamp* takes the place of the door's own for one press. Pressing it: the lamp leaves the bag and stands lit on the threshold, and one line: *The lamp stands inside the door. The flame leans in.* The door is the gate's own and opens as ever after it.
- *It's done.* (turn-in, shows once the lamp is set down) — "Then she is held. Thank you, Master. Twenty gold, from her family, with their thanks, which I have also been paid to convey." (20 gold; a point of the town's favour.)
- *It's done.* to an Old Blood player, or one who has read a sigil to Mastery (`worldState.masteries`), the same and then: "You looked at the door a long time before you came back. I can see it on your hands. Whatever it was, Master, I would rather not be told."
- After: *How is her family?* — "Mending nets. It is what the living do. They ask after you, a little, the way one asks after weather."

### 2. Brother Alain (a Gatelander of the Crown's country, of the Church; proverbs turned to scripture, no bare yes or no, oaths on the Weaver)

**Greeting, first:** "Stand there, friend, in the light where the Weaver can see you. What a man carries is the shape of what he means. Let me see your pack."
**Greeting, again:** "Yourself again. A pack gets no lighter for being looked at twice, but we'll look."
**Greeting, to a Gatelander player, first:** "A face from home, under the Church's roof. Don't take it ill if I ask what's in the bag. My own mother would get the same."

**Topics**
- *Who are you?* — "Alain. Born under Coeur de Vie, where a bell rings for the King and another for the harvest and nobody minds which is which. I came over the water to hear the Weaver's book read properly. I'm hearing it yet."
- *Why look in my pack?* — "Because the gates are the Weaver's loom, and every rubbing sold off them is a thread pulled out to sell by the yard. At home we call that a living. Here we call it what it is. The one doesn't make the other untrue."
- *Show him the pack.* — reads the bag.
  - With no rubbing in it: "Nothing of the loom. Go on, so, and the Weaver keep you clean of it."
  - With rubbings: "There it is. {n} of them, and the stone still warm on the paper, I'd swear on the Weaver. Give them to me and we'll say no more. Keep them and I'll say a good deal more, to people who write it down."
    - *Hand them over.* — the rubbings leave the bag. "Good. A thread given back is half mended. I'll see they're burned decently."
    - *They're mine.* — "So's a cough, friend, till you give it to someone. It's noted." (The Church's note: **Rule read** below.)
- *Who are you looking for?* — "A man who calls himself a father and isn't one of ours. He smiles. He stands at the doors of the gates at dusk and tells people they'll be lighter for walking in. Some of them have walked in. The Church calls him the Lamb, which is a joke, and I'm the only one in this square who laughs at it."
  - Shows once the player has met Calix: *I've seen him.* — "Have you, now. And where would a man see a lamb, at the end of the day?"
    - *At the gate, {dir} of here.* — "Then that's where he'll be found. The Weaver keep you for it. You did a hard thing well, and I'll not thank you for it in the street." (Calix's fate: *taken*.)
    - *I don't remember.* — "A short memory's a long road. Go on." (Nothing changes.)
- After Calix is taken: *The Lamb?* — "We found him where you said, smiling. He smiled the whole way in. He's in the Prior's keeping now, and the Prior's house has no windows on that side. I've said a prayer for him. It's the most the Church will give him, and more than he asked."
- *What is under the cathedral?* (shows once `worldState.chapelAt` is set) — "There are doors in this city I've been asked not to open, and I'm a good son of the Church. A shut door's a sermon too, friend. It only takes longer to hear."

**Rule read (systems): refusing Alain writes a note to the Church** (`worldState.church.notes`, `{kind:'salvage', site, day}`), which any priest of Aurenne then hears at *Confess.* as a guard's death is heard today, for a tithe and without the town's favour (salvage costs none). Confessed, it is struck through. Until then a priest of Aurenne opens with "There is a note against your name, Master, from Brother Alain. Paper. You will want to deal with it." Elsewhere nobody reads it.

### 3. Sæwynn, called Shevra (Markman; short sentences, *aye*, nicknames, oaths on iron and blood, no honorifics)

**Greeting, first:** "You're between me and the water. Shift."
**Greeting, again:** "You. Fish?"
**Greeting, to a Markman player, first:** "Aye. Mark-born. Stand to the side, you're in my light."

**Topics**
- *Who are you?* — "Sæwynn. They call me Shevra. A Gatelander boy off a salt-boat couldn't say it, and the strait took his side. I let it. Names wear like rope."
- *Are you a priest?* — "Iron and blood, no. Priests talk to the gods. I watch the water. The gods talk to that. I listen in."
- *What do you read?* — "Weather. What's coming over the strait, and when. Fishers pay me, and the other kind of sailor pays me better. Same weather for both."
- *Read me the water.* — "A fish. Any fish. I'm not proud." (With a fish in the bag, the fish leaves it and she reads `WX`.)
  - No fish: "No fish, no water. The sea's full of them. Go on."
  - The weather turning (`WX.next` is not `WX.type`): "{next} coming. Before the tide turns. Get your hatches down, or don't, it's your hatches."
  - The weather holding: "Holds. {now} now, {now} after. The sea's bored. Make the most of it."
  - Fog, either way: "Fog. Things sing in it out past the light. Don't steer for them." (Sea Legends I's singing ship, unapproved; the line stands without it.)
- *Read me.* — "I read water. You I'd not read. You'd come up the same either way, and I don't like that in a tide."
- *What do you make of the Church?* — "Their tithe-ships ride high and come back. That's the whole of what I know about their god. It's not nothing."
- *Farewell.* — "Aye. Mind the weed on the steps."

### 4. Father Calix, the Smiling Lamb (Aurennais; formal, honorifics, qualifiers and terms, never an oath; one of the awake)

**Greeting, first:** "Oh, Master. You came at the best hour. Everything looks honest at dusk, even the gates. Especially the gates."
**Greeting, again:** "Master! I had hoped. One does, at my age, and is so seldom paid for it."

**Topics**
- *Who are you?* — "Calix. Father Calix, though not, I am afraid, by the Church's leave. The Church and I have a disagreement over terms. They believe the gates take something from the world. I believe they take something off it."
- *What do you preach?* — "That the gates make things lighter, Master. Everything that goes through one comes out lighter, or does not come out at all, which is the same thing done thoroughly. The Church calls that a loss. I call it the only honest arrangement in the world."
- *Where are your people?* — "Seven of them went in at the spring. Not one came out, and not one of them, I promise you, was sorry. I keep their masks. Smiling. I had them made to look as they would after."
- *Why do you smile?* — "Because I have read the terms, Master, and almost nobody else has."
- *What do you see when you look at me?* (shows on the second meeting) — "Most people come to a gate afraid. Some come greedy. You come to it the way I come to supper. I have stood at this door eleven years and you are the first I have envied."
- To a player with `worldState.chapelAt` set, one line before his greeting, once: "You have been down under the cathedral. No, do not tell me. It is on you like a scent. I have been trying to find that stair for eleven years."
- *A Church man is asking after you.* (shows once the player has met Alain and while Calix's fate is open) — "Of course he is. Brother Alain, with the freckles and the good heart. Thank you, Master. Nobody warns a lamb." (Calix's fate: *moved*. Next dusk he stands at the next nearest lesser gate to the capital, and Alain's *Who are you looking for?* gains: "He's moved. Somebody told him. I'll not ask who. A man can tell the wind which way to blow as well.")
- *Farewell.* — "Go lightly, Master. You are already halfway there."

### 5. The Veiled Child (Old Blood; sparing, exact, the older word for the thing)

**Greeting, first:** "You are standing on the swept part."
**Greeting, again:** "You found me."
**Greeting, to an Old Blood player:** (she lifts the edge of the veil, and drops it) "You too. Keep it covered, near their churches. They count us."

**Topics**
- *Who are you?* — "The one who sweeps."
- *Whose shrine is this?* — the shrine's god by its old name and its work: "An Chloch's. The gate-maker. Your word is the Stone." (by `godShrineOwner`, each of the six: *An Mhuir's. The hull-maker. Your word is the Sea.*; *An Spéir's. The one who turns the day. Your word is the Sky.*; *Na Beithígh's. Her children do not know her. Your word is the Beasts.*; *An Teallach's. The lamp-keeper. Your word is the Hearth.*; *An Fíodóir's. The one who makes the cloth. Your word is the Weaver.* The canon gives a pronoun only to the Beasts, *her children*, so the others take none.)
- *Why sweep it?* — "Nobody comes. Dust comes."
- *Why sweep that one? There's nothing in it.* (the empty niche, once the look builder lays it) — "That is why."
- *Where are your people?* — "Up the hill. They know where I am. Everyone does, once a week."
- After she has been found three times (`worldState.faith.child.found >= 3`), her greeting, once: "Every week you find me. I am not hard to find. I am hard to look at. You are the same."

She asks nothing and gives nothing, and fights nobody; a struck child is the crime system's assault, as any townsperson's.

### What in the code would carry it

- **The five defs**: authored defs in the manner of `spireRoweDef` and `SPIRE_FOLK` (`87-world-quests.js`), `authored:true`, with a `people`, a fixed name and `topics` as a getter. Placed by `anchoredPlaces()`: Aurenne's capital (`FACTIONS.compact.seat`) for Alain in its square by day; Port Blackhand (`blackhand`) for Sæwynn on the quay, 6h–12h; Amani as the church's keeper (the `Priest` of `buildInteriorFor`'s church, `83-world-generator.js`, at the Compact port nearest the seat, picked once per seed and kept in `anchoredPlaces` as `amani`); Calix at the door of the nearest lesser gate to the seat (`nearbyDoors(seat)`, not a great gate and not a fort), 18h–21h; the child at one Gatelands shrine (`site.kind==='shrine'`) a game-week, by `seededRng('child', week)`, 6h–20h.
- **Amani's lamp**: *A Mourner's Lamp*, a misc item `{name:'A Mourner\'s Lamp',ico:'🏮',type:'misc',quest:'amani',weight:1,sellMult:0}`; the door's prompt in the world's door prompt (`88-world-ticks.js`, the gate door's *Press 'E'*) takes *Press 'E' to set down the lamp* for one press while the bag holds it and the door is the one she named (by seed). Saved: `worldState.faith.amani={state:'given'|'laid'|'paid', seed, day}`.
- **Alain's search**: reads `BAG` for `type:'rubbing'`. The note is the **Rule read** above, in `penanceTopics` (`86-world-crime.js`). Saved: the note in `worldState.church.notes` (the character's, already in `SS_CHAR_WS`).
- **Calix's fate**: `worldState.faith.calix={met:n, fate:null|'taken'|'moved', door:seed}`. *Taken* removes him; *moved* sets `door` to the next nearest lesser gate.
- **Sæwynn's reading**: a fish from `catchFish` (`86-world-crime.js`) leaves the bag; the words read `WX.type` and `WX.next` (`86-world-crime.js`, `wxSetNext`) through the weather's names (*rain*, *a storm*, *snow*, *fog*, *clear skies*).
- **The child**: `worldState.faith.child={found:n, week}`; *Whose shrine is this?* by `godShrineOwner`.
- **Saved**: `faith` is one new `worldState` key, the world's (what became of the people in it), added to `_applyLoadData`'s list. The church note is the character's, as today.
- **Rolls**: the child's shrine is a seeded stream keyed by week; which greeting is said is cosmetic.
- **A test worth having**: the lamp given, carried to its door, set down and paid (`faith.amani.state==='paid'`, 20 gold), saved and loaded; Alain told of Calix and Calix gone at dusk; a fish read into *Holds* or a turn.

### Checked against the canon

- *The Church: Aurennais, salvage is sacrilege, Priors over its towns* (§1.3). Alain's search and Amani's teaching are the Church's ordinary line, said by two kind people.
- *The Church blesses the dead into the gates without knowing* (§3.1). Amani carries the lamp and has never been asked to prove the teaching; the player who has read a sigil may know more, and she does not want to be told.
- *The Mark scorns priests* (§1.2). Sæwynn is no priest, and says so on iron and blood.
- *The awake look like villains* (§10a). Calix's cult has taken seven people into a gate, and he is the only one in the five who is near the truth (*they take something off it*). He envies the player and does not say why.
- *No chosen-one prophecies* (§4.2). Calix sees, and the child sees, and neither names anything or quotes the three descriptions.
- *The Old Blood: black hair, grey-pale, the marks at the wrist* (§2, §3.1). The child keeps her sleeves long and her veil down near the Church, because the Church's attention falls on her people (§2.2).
- *Registers* (§2): Amani and Calix have *Master*, terms and no oath; Alain swears on the Weaver and turns proverbs (*a short memory's a long road*); Sæwynn has *aye*, iron and blood, short sentences and her own nickname; the child answers with the older name for the thing (*the gate-maker*, *the one who makes the cloth*).
- *Slurs are about work, land and gods* (§2.1). None here; Alain's *we call that a living* is the canon's quarrel over salvage.
- *Where the canon is silent:* the Church's way with a heretic (held, no more), and the weather foretold (only as far as `WX.next`). Both the plainer thing.

---

## Travellers — a navigator, a hunter, a sister, a reader and a patron

*Unapproved.* *Drafted 28 Oct 2026. Backlog L2, *Travellers* (OG-051, sheet E7, *diverse roots, shared paths*): "Zahra al-Mahdi, Tavio Rusen, Sister Elidan, Khemrik Voss, Marco di Serra. Khemrik reads the gates, which the Withdrawal forbids: a candidate for one of the awake (§10a)." Five named people who move, where *The Underworld* and *Faith* stood still: each is found in one of a few places by the game-week, rolled on the person's own stream (`seededRng('traveller', key+':'+week)`, the co-op rule), each with one service on machinery that exists and one thread the world remembers. One **Rule read** for the systems builder; no line depends on which way it goes.*

### What the canon fixes, and where it is silent

- *Aurenne: known for ships that come back; knowledge; the Mages' academy* (§1.3). A navigator who charts the gates for the houses is Aurenne's ordinary trade. *The Compact keeps paper over oaths*: she sells a chart, not a promise.
- *The Mark exports men; half the Fighters' Guild is Markish* (§1.2). A hunter who guides for pay is the Mark's. *Some ordinary animals are the owners', not the player's* (Michael's A on companions, decision 12 of the art batch): the wolf is his, walks with him, and never follows the player.
- *The Gatelands: never leaving a wounded man; the old faith's six gods* (§1.1, §4.1). The sister keeps a Gatelands shrine order, not the Church of the Weaver, which is Aurenne's (§3.1). Her reliquary is what the Gatelands' salvage trade brings up, and the Compact calls that sacrilege (§1.3).
- *The Withdrawal forbade the reading of sigils; every Old Blood reader who ignored it went strange, then quiet; the marks spread to the face with the Cold* (§3.1, §3.3). The sheet's reader with gold marks on his face and his hand to a sigil is that, exactly. He is one of the awake (§10a). The sheet's white hair is kept as the Cold's, on a man whose hair was black: canon gives the Cold pallor and grey eyes and is silent on hair, and an old man greying is the plainer thing.
- *No chosen-one prophecies* (§4.2). The reader sees the player's hands and says what he sees. He does not name it or quote the three descriptions.
- *Names* (§2; *The Aurennais Register*, approved 14 Oct). *Zahra al-Mahdi* is in Aurenne's register and stands (the register's note kept *Zahra* free for her). *Marco di Serra* is Italian, which the register does not draw on: he is **Markos Serra**, of the house of Serra, *Markos* the Greek form. *Tavio Rusen* is in no register; the Mark's is Anglo, and he is **Tidwulf**, which the strait shortens to *Tid*. *Sister Elidan* stands: an Irish-register woman's name would be the plainer thing, but *Elidan* is a saint's name in the Welsh fringe of that world and sits beside *Gormlaith* without strain. *Khemrik Voss* is in no register; he is Old Blood, and his name is **Cuimín**, an older form, with no byname (the Old Blood have none).
- *Silent:* whether a gate can be charted from outside (the plainer thing: its door and its kind can, which is what the map already shows once a gate is found); whether a reader can teach (he cannot, and will not try).

### The five

| | People | Where, by the game-week | What they do |
|---|---|---|---|
| **Zahra al-Mahdi** | Aurennais | the quay of one of Aurenne's three largest ports | sells a chart that marks the nearest gate the player has not found |
| **Tidwulf**, called *Tid* | Markman | the inn door of the Mark's town nearest a living lair | names the lair and pays a bounty when its beast is dead |
| **Sister Elidan** | Gatelander | the church of one Gatelands town in four, a week in each | heals for nothing; buys what comes out of the gates, for the shrines |
| **Cuimín** | Old Blood | the door of the nearest gate with a warm stone to the player's last town, by day | asks what the stone said; one of the awake |
| **Markos Serra** | Aurennais | the counting-house steps of Aurenne's capital (the castle lot's door), by day | buys gate relics at a fifth over any shop, for his own shelves |

Faces for the bodies builder (the sheet's): Zahra dark-skinned, long locs, gold hoops and a coin necklace, a navy-and-cream coat, a brass compass at the belt and a roll of charts; Tidwulf broad and scarred, braided, in furs, a horned skull on his pack, a grey wolf at heel; Elidan older, cream and crimson robes, a candle lantern and a small reliquary box; Cuimín slight and grey-pale, white-haired, the marks in gold up the throat and over one cheek, a thin circlet; Markos dark-bearded, a velvet coat, a cup in his hand more often than not.

### 1. Zahra al-Mahdi (Aurennais; formal, *Master*, contracts, never an oath)

**Greeting, first:** "Master. You are standing on my chart. It is an old one, and it will survive you, but I would rather not test it."
**Greeting, again:** "Master. Back from the blank parts of the map, I see. Good. They are where the money is."
**Greeting, to a player who has bought a chart:** "Master. Did it lie where I said? It usually does. The ground moves less than people do."

**Topics**
- *Who are you?* — "Zahra al-Mahdi. A navigator, by trade and by the houses' paper, and lately a cartographer of the old gates, which no house asked for and every house buys. I go where the ships go, and a little further."
- *Why chart the gates?* — "Because they do not move, Master, and nothing else in this world can be relied upon to stay where it was drawn. A coast silts. A town burns. The gates are where they were when the first map was made. I find that restful."
- *What does the Church say of it?* — "That I draw the Weaver's loom for people who mean to unpick it. The Prior has said so to my face, courteously, and then bought two charts. I have the receipt."
- *Buy a chart.* (her service) — "Forty gold, Master, and it marks the nearest gate you have not stood before, wherever you are standing when you open it. Terms are on the back. Nobody reads the back."
  - Bought: the chart goes to the bag; reading it marks the nearest gate the player has not discovered (the map's *discovered*, as a rubbing's star does) and is spent. With none left undiscovered within the island: "Then you have found them all on this island, Master, and I owe you nothing but my admiration. Take your forty back."

**Her thread: *The Blank at {gate}*.** Once, after a chart is bought and read: *Is there a gate you can't reach?* — "One. {Gate}, {dir} of {town}. I have its door on three charts and its name on none, and the houses will not buy a gate without a name. Go in as far as the first sigil. Tell me what it is called inside. The people who built it wrote its name on the wall, I am told, and nobody has read it to me."
  - *I'll go.* — "Then we are agreed, Master. Mind the doorway; it is the only part of the chart I am sure of."
  - Once the player has stood before that gate's sigil (`worldState.sigilsRead[seed]` set, or touched at any tier): *It's called {gate's name}.* — "So it is. {Gate's name}. I will write it in, Master, with your name in the margin where nobody will read it. Sixty gold, and the chart is yours to keep." (60 gold; the gate's name stands on her later charts.)
  - To an Old Blood player who turns it in: the same, and then: "You said it as if you were reading it off the wall. Forgive me. A navigator notices how people say names. It is most of the job."

### 2. Tidwulf, called Tid (Markman; short sentences, *aye*, nicknames, oaths on iron and blood, no honorifics)

**Greeting, first:** "Mind the wolf. She minds you."
**Greeting, again:** "You. She remembers you. That's one of us."
**Greeting, to a Markman player, first:** "Aye. Mark-born. She'll let you pass."

**Topics**
- *Who are you?* — "Tidwulf. Tid, on the strait. I hunt what the guild won't, and guide them that want to watch."
- *The wolf?* — "Hers, not mine. She came with me off the hill and stayed. Don't call her. She won't come, and then you'll feel foolish."
- *What do you hunt?* — "Whatever lives in the hole up at {lair}. {Beast}, they say. I've seen the tracks. Big as a cart-wheel."
- *Will you guide me there?* — "No. I'll point. {Lair}, {dir}, {far}. Guiding's for them that pay twice."
- After the lair is dead: *What now?* — "Next hole. There's always a next hole. That's the trade, aye."

**His thread: *A Bounty on {lair}*.** Offered with *What do you hunt?*, while the lair nearest his town is alive.
- *I'll take it.* — "Good. Kill it. Come back. Fifty. Iron and blood on it."
- Turned in once `worldState.lairs[id]` is set (*It's dead.*): "Saw the crows go up. Knew it was you. Here. Fifty." (50 gold, or the lair's tier × 25 if more; a point of favour at his town.)
- If someone else's work killed it first (the lair dead before he offered): *What do you hunt?* answers "Nothing. Somebody did {lair} before me. Good work. Annoys me."
- He moves on after: from the next game-week he stands at the inn of the town nearest the next living lair in the Mark, and his first line to the player there is "You. Knew you'd come this way."

### 3. Sister Elidan (Gatelander; proverbs, indirection, no bare yes or no, oaths on the Weaver)

**Greeting, first:** "Come in, so, and close the door after the cold. You've the walk of someone who's been underground. It never leaves the knees."
**Greeting, again:** "Yourself again, and in one piece. The Weaver's been kind, or you've been quick."
**Greeting, to a Markman player, first:** "A Mark face, in out of the weather. You're welcome to the fire. We don't ask a man's country before we ask after his feet."

**Topics**
- *Who are you?* — "Elidan. A sister of the shrines, which is a long way of saying I walk between them with a box of bones and a pot of salve, and stop where I'm needed. The towns take turns needing me."
- *What's in the box?* — "What the gates give back. A finger-bone from a door in the hills, a ring off a hand nobody knew, a scrap of a shroud. The Compact would have them burned for sacrilege. I'd sooner keep them, and say their names if I find them. It's the same respect, done slower."
- *Heal me.* — every priest's blessing, and full: "Sit. There. Never leave a wounded man, my mother said, and she'd no time for wounded women either, so she healed the lot of us." (Health to full; no charge.)
- *Will you take what I found below?* (her service) — she buys any item the game marks as from a gate (`it.gate` or the relic loot table, **Rule read** below) at a shop's price, and never sells it on. "I'll give you what the shop would, and not a copper more, for I'm not a shop. But it won't go to a mantelpiece in Aurenne, and that's worth something to someone."
- *What does the Church say of you?* — "That I keep what should be burned. I say a thing kept is a thing remembered, and a thing burned is a thing forgotten twice. We've agreed to say it to each other only once a year."

**Her thread: *A Name for the Ring*.** Once, after the player has sold her three things: *Is there anything I can do?* — "There's a ring in the box with letters inside it, worn near away. I've read four of them. Someone in {town} may know the rest. A ring's made for a finger, and a finger has a name. Would you ask?"
  - *I'll ask.* — "Go on, so. Ask the old ones. The young have no use for rings with letters in them."
  - At that town, any generated townsperson over forty years (`bio.years`) answers *Do you know this ring?* with: "Let me see. … That's Murchadh's. He went to the gate on the hill when I was a girl and didn't come back. His wife wore its pair till she died. Well. Well, now." (Others: "A ring? No. My grandmother might have.")
  - Back to Elidan, *It was Murchadh's.* — "Murchadh. There. It's a name again, and not a thing in a box. I'll say it at the shrine on my way through. Here, for your trouble, and the Weaver keep you for the asking." (25 gold; she keeps the ring.)

**Rule read (systems):** *from a gate.* The game has no flag on an item that came out of a gate. The plain reading: an item rolled from a dungeon's chest or a gate foe's drop carries `gate:true` from then on, and Elidan buys only those. No line depends on it; without the flag she buys the relic loot table's items alone.

### 4. Cuimín (Old Blood; sparing, exact, the older word for the thing)

He stands at the door of the gate with a warm stone nearest the town the player was last in (`nearestSigilDoorFrom`), by day, with his hand on the stone of the arch. He is there only while that gate's sigil is unread.

**Greeting, first:** "You see ruins. I see unfinished sentences."
**Greeting, again:** "The sentence is longer than it was."
**Greeting, to an Old Blood player, first:** "You hear it too. Do not answer it."

**Topics**
- *Who are you?* — "Cuimín. I kept the words. Now they keep me."
- *What are you doing?* — "Reading. It is not allowed. Nobody has stopped me in sixty years. That is not the same as allowed."
- *What does it say?* — "The door says *door*. Inside, the stone says what the stone is for. I will not tell you. It would do to you what it did to me." (He lifts his face to the light; the marks go up to the eye.)
- *Who forbade it?* — "The gate-makers. Their last law. Touch, not read. They were right. I read anyway. So did one other. He is further along."
- *Are you ill?* — "Cold. It does not stop. It is not unpleasant. That is the worst of it."

**His thread: *What the Stone Said*.** He asks once, after the player has touched this gate's sigil (`worldState.sigilsRead[seed]`), on the next meeting at any gate: *It was warm.* is the player's label.
- To a player who touched it at Impression or Comprehension: "Warm. Yes. And it showed you a word, and you thought you understood it. Good. Stop there. Go home." (Nothing changes; he moves to the next unread gate.)
- To a player who touched it at Mastery, the first time: "You read it. Through. I see it on your hands." A pause the line does not fill. "Something on the other side looked up. It always does. It looked at me for sixty years. It did not look at you the same way. It looked at you the way I look at a door." He takes his hand off the arch, and does not stand at a gate again; from then his place is empty, and a rumour in that province says: *"The cold-eyed man at the gate's gone. Walked into it, the shepherds say. Or out of it."* (He is one of the awake. That he walked in is never confirmed.)
- To an Old Blood player at Mastery, the same, with the last sentence: "It looked at you the way I look at a door. Or the way a door looks at a hand."

### 5. Markos Serra (Aurennais; formal, *Master*, contracts, never an oath)

**Greeting, first:** "Master. Come up out of the wind. Will you drink? It is from my own house's vineyard, which is to say it is bought, but bought from someone I like."
**Greeting, again:** "Master. You have the look of someone carrying something heavier than gold. Come and set it down."
**Greeting, to a Gatelander player, first:** "A Gatelander, on my steps. The Church will be scandalised. I am delighted. Sit."

**Topics**
- *Who are you?* — "Markos, of the house of Serra. Wine, glass, a share in eleven hulls and a twelfth that is, I am told, still at sea. And a collection. I am the house's patron of curiosities, which my brother calls a waste and my accountant calls a line in red."
- *What do you collect?* — "What comes out of the old gates, Master. Quietly. The Church calls it sacrilege when a Gatelander sells it and scholarship when a Serra buys it. I did not write the rule. I only read it carefully."
- *Sell him something from the gates.* (his service) — he buys the same items as Elidan (the same **Rule read**) at a fifth over a shop's price. "A fifth over the market, Master, and no questions, and no receipt. The receipt is the expensive part."
- *Isn't that hypocrisy?* — "Yes, Master. It is also the economy. The two are often confused, and I make a modest living in the difference."
- To a player who has sold Elidan anything: *Sister Elidan pays less.* — "She does, and she keeps them in a box and says their names. I keep them on shelves and say my own. If I were the dead I know which I would prefer. I am not, yet, and I pay a fifth over."

**His thread: none.** He has no errand. He is the price on the other side of Elidan's, and the player's choice between them is the thread: every relic sold goes to one or the other, and the count is kept (`worldState.relicsTo={sister,serra}`), read only by these two lines:
- Elidan, once the player has sold Markos five more than her: "You've been selling to the Serra. No, don't tell me. A ring on a shelf is still a ring. But it's not a name, and that's the difference between us."
- Markos, once the player has sold Elidan five more than him: "You have been giving my curiosities to the sister, Master. I cannot fault the theology. I can fault the arithmetic."

### What in the code would carry it

- **`83-world-generator.js`** (or a small `TRAVELLERS` table beside `NAMED` in `87-world-quests.js`): each traveller a `makeDef` with `authored:true`, `keepName:true`, the people given, placed by `travellerAt(key,week)` from `seededRng('traveller', key+':'+week)` among the places the table above names, and spawned when the player is within a cell of it (as the duel's Rowe and the lost person are, `spawnNPC`). Tidwulf's wolf is a `Wolf` rig from `34-creatures.js` with no foe tag, kept at his heel.
- **Zahra:** the chart is a misc item read with `useItem` that sets the nearest undiscovered `CELL_DOOR`'s `discovered` (the rubbing's star, `rubbings`); the thread reads `worldState.sigilsRead[seed]`.
- **Tidwulf:** the nearest living lair from `worldState.lairs` and `lairBeast(site)`; the bounty a quest record (`kind:'bounty'`, id `tr:tid:<lair id>`).
- **Elidan and Markos:** a buy-only shop topic each (`trade:true` with a filter on the item), the **Rule read** flag, and `worldState.relicsTo` (a world key, in `_applyLoadData`'s S242 list). Elidan's ring: a topic on generated townsfolk at the named town while her quest record is open, as errand 1 of *Asked in Passing* does.
- **Cuimín:** a def at the door of `nearestSigilDoorFrom(lastTown)`, hidden once his record says *gone* (`worldState.travellers.cuimin='gone'`, a world key); the Mastery test reads the tier the player touched at (`onMasteryTouch`).
- **Journal titles:** *The Blank at {gate}* · *A Bounty on {lair}* · *A Name for the Ring* · *What the Stone Said* (no journal entry; it is a meeting, not a task).

### The register, checked

- Zahra and Markos: *Master*, terms, receipts, the back of the contract; no oath anywhere. Markos's *I did not write the rule. I only read it carefully* is the Compact's paper over oaths.
- Tidwulf: *aye*, *iron and blood*, sentences of four words; no honorific; a nickname of his own.
- Elidan: proverbs (*a thing kept is a thing remembered*), no bare yes or no (*I'd sooner keep them*), *the Weaver keep you*. Her *never leave a wounded man* is the Gatelands' pride (§1.1).
- Cuimín: *the gate-makers* for the Weavers, *the words* for the sigils, *the door*; never more than three sentences.
- Slurs: none. The Church's *sacrilege* is the canon's quarrel over salvage (§1.3), contradicted by Markos and by the Prior who buys Zahra's charts.

## Rivals — a guide, a patron, a knight, a seeker and a scout

*Unapproved.* *Drafted 29 Oct 2026. Backlog L2, *Rival adventurers* (OG-083, sheet E9, *rival adventurers and guilds*): "gate-clearers who race you for a find or hire out as guides. Rename the scout called Varek; the villain's name is reserved." Five named people who work the gates for a living, as the player does: each camps at the door of one gate a game-week, rolled on the person's own stream (`seededRng('rival', key+':'+week)`, the co-op rule), each with one service on machinery that exists and one thread the world remembers. Two of the threads are one race, seen from both sides. One **Rule read** for the systems builder; no line depends on which way it goes.*

### What the canon fixes, and where it is silent

- *The gates: a salvage economy of adventurers, rubbings and relics that the Crown licenses and taxes* (§1.1). *The adventurers' economy is the Clearing continued by people who don't know it* (§3.1). These five are that economy, and none of them knows it. They are not the awake.
- *Varek ran his operation without paying much attention to individual adventurers; they are instruments, interchangeable* (Part I, *His relationship to the player*). So the rivals are ordinary: they go in, they come out, they get hurt, they get paid. Nothing about them is strange, and nobody remarks on the player's returns (that is Varek's discovery, §6, and nobody else's).
- *Caer Uaigneach is a localized anchor failure from a gate network over-cleared by ordinary adventurers over centuries* (Part I), and *a cleared gate keeps the province clean; a backlog means undead* (§12a). Both stand: a gate wants clearing, and a failing gate wants rest. The seeker says the second, sparingly, and does not explain it.
- *A gate's condition: steady, failing, catastrophic* (§9a; `gateCondRoll(seed)` in the build). The seeker reads it at the door, with the older words.
- *The Mark exports men; a quarrel finished by noon; contempt for anyone who hires a guard instead of being one* (§1.2). The guide is Markish and hires himself out, which the Mark finds a little funny and he does not.
- *The Crown: Knight of the Gates is the top of its rank* (§8.4). *The Gatelands' pride: never leaving a wounded man* (§1.1). The fallen knight is a Knight of the Gates the Crown unmade for leaving one.
- *Companions: none for the player; the wolves are their owners'* (Michael's 12 A, the art's first batch). The scout's wolf is his, and never follows the player.
- *Names* (§2; *The Aurennais Register*, approved 14 Oct). The sheet's **Koran Stonehand** is labelled Markman and drawn dark and short-haired; the Mark's register is Anglo and its people pale and ash-blond, so he is **Cynric**, and *Stonehand* is his nickname, as the Mark gives them. **Lyn Étrël** has the dropped Norman ring; she is **Lysandra Per-Akhet**, *Per-* the register's Egyptian form for a house and *Akhet* the horizon, which suits an explorer and names no god. **Sir Alaric Drake** wears the Crown's crimson and a gold lion; the Crown's nobility keep their Norman names (§1.1, Michael 12 Oct), so he is **Alard de Drac**, and nobody is sure whether to call him *Sir*. **Zurik the Seventh** is drawn with cracked stone skin and white hair, which the canon does not give the Old Blood (grey-pale, black-haired, human); he is **Ailill**, an older form, with no byname, and *the Seventh* is dropped because the seventh is the Guest (§4.1) and a name should not say so by accident. **The scout** is named *Varek* on the sheet; that name is the villain's alone. He is **Tadhg Ó Faoláin**, *the little wolf's* grandson, which the strait would call a joke and the Gatelands call a family.
- *Silent:* whether rival adventurers race each other, and whether anyone wins a gate. The plainer thing: a gate's foes are put down by whoever goes in, and a rival who goes in first takes what the player would have found there, in the talk if not in the loot. Nobody dies. Somebody gets hurt once.

### The five

| | People | Where, by the game-week | What they do |
|---|---|---|---|
| **Cynric Stonehand** | Markman | the door of a gate in the Mark within 900 of a town, or the Gatelands' ranges | for 10 gold, names a gate's school and what lives in it, and points the way |
| **Lysandra Per-Akhet** | Aurennais | the quay of an Aurennais port, by day; her expedition's gate after | funds an expedition: a gate to put down before a date, against Alard |
| **Alard de Drac** | Gatelander (Crown-born) | the door of the gate Lysandra names that week | races the player for it; remembers who won |
| **Ailill** | Old Blood | the door of the gate nearest the player's last town whose condition is *failing* | reads a gate's condition at its door; asks that a failing one be left a week |
| **Tadhg Ó Faoláin** | Gatelander | the inn door of the Gatelands town nearest any of the other four | knows who is below, and where; asks once that a wounded man not be left |

Faces for the bodies builder (the sheet's, corrected): Cynric big, bearded, ash-blond, in fur and heavy leather, a pick over the shoulder and a pennant on a pole; Lysandra dark-skinned, long locs, a cream and blue coat, rolled maps and a small orrery in a case; Alard blond, a crimson cloak over a surcoat whose gold lion has been unpicked and left as a paler shape, a great helm carried, not worn; Ailill slight and grey-pale, black hair going grey, a black robe, a brass armillary, the marks at his wrists and no further; Tadhg wiry and red-haired in a hooded green cloak, a short bow, a big grey wolf at heel.

### 1. Cynric Stonehand (Markman; short sentences, *aye*, nicknames, oaths on iron and blood, no honorifics)

**Greeting, first:** "Going in? Aye. Thought so. You've the look."
**Greeting, again:** "You again. Still breathing. Good."
**Greeting, to a Markman player, first:** "Mark-born. Good. Don't need telling which end of a pick to hold."

**Topics**
- *Who are you?* — "Cynric. Stonehand, on the strait. I go in first and come out first. Some pay me to go in with them. Most pay me to tell them not to."
- *Why Stonehand?* — "Broke a door with it once. The door was locked. Seemed quicker."
- *Guide me.* (his service) — "Ten. Iron's iron." Paid: "{Gate}. {Dir}, {far}. {School-word}. {Foes}. Watch the floor where it's new." (the way is set to the gate, as a townsperson's directions set it; `{School-word}` and `{Foes}` from the gate's school, below)
  - Tine: "Fire. Things that burn, a troll if you're unlucky."
  - Uisce: "Water. Cold, wet, things in the wet. Slime."
  - Cloch: "Stone. Old. Half of it's fallen and the other half's thinking about it."
  - Scáth: "Dark. Things that hide. Keep a torch and don't trust corners."
  - Solas: "Light. The dead get up in that one. Bring something heavy."
  - Gaoth: "Wind. Shafts. Mind your feet."
- *Isn't guiding beneath a Markman?* — "My father said so. He hired a guard once, to guard his cart. Paid him in ale. The guard drank it and the cart went. Now I'm the guard. Ha."
- *Seen the knight?* — "De Drac. Aye. Brave. Goes in like he owes the place money."

**His thread: *Stonehand's Pick*.** Once, after the player has paid for a guide twice: *You've no pick.* — "No. Left it. {Gate}, {dir}. At the door, I think. I came out quick." A pause. "Ran. Aye. Ran. Something in there was bigger than the door. Fetch it, and I'll not charge you again."
- *I'll fetch it.* — "Good. Don't go in. Just the door."
- The pick lies by that gate's door (the town quests' *retrieve*: a pickup a few paces off the door). Brought back, *Your pick.* — "That's her. Aye. Iron and blood, I owe you. No charge, from now. Don't tell the strait I ran." (His guiding is free from then: `worldState.rivals.cynric='owed'`.)

### 2. Lysandra Per-Akhet (Aurennais; formal, *Master*, qualifiers, contracts, never an oath)

**Greeting, first:** "Master. You have the boots of someone who has been underground recently. I do business with such boots."
**Greeting, again:** "Master. A pleasure, and I hope a profitable one."
**Greeting, to a Gatelander player, first:** "A Gatelander, Master, which in my line is a recommendation. Your people find things. Mine pay for them. It is an old arrangement and nobody has improved on it."

**Topics**
- *Who are you?* — "Lysandra, of the house Per-Akhet. I fund expeditions into the old gates and broker what they bring back. The Church disapproves of the second and invests quietly in the first. I keep the accounts separate for its sake."
- *What's the orrery for?* — "It shows the heavens as the academy believes them to be. I carry it because people trust a broker with an instrument. I have never once used it to find anything."
- *What do you broker?* — "Antiquities, Master. A lamp from a door, a tile with the script on it, a ring. I do not ask where. I ask how deep, because depth is the price."
- *Who is the knight?* — "Alard de Drac. He was a Knight of the Gates until the Crown decided otherwise. He goes in for me, sometimes, and for his name, always. He is very good, and he would like you to know it."

**Her thread: *The Per-Akhet Expedition*.** Offered at her quay once a game-week, while no expedition of hers is open: *Have you work?* — "An expedition, Master. {Gate}, {dir} of {town}, in {school}. The house will pay sixty for it cleared: put down {n} of what is inside before {date}. I should say that I have made the same offer to the knight. The first to report has the fee. I find competition improves the quality of the work."
- *I'll take it.* — "Then we are agreed, Master, on the same terms as the knight. I wish you both well, and one of you better."
- *Not now.* — "Of course, Master. The knight will be delighted."
- Turned in, the player first (*It's cleared.*): "Before the knight. He will be insufferable about it, which I shall enjoy. Sixty, as agreed, and the house's note that you were first." (60 gold; `worldState.rivals.races` gains a *won*.)
- The knight first (the player reports after his day has passed): "I am sorry, Master. The knight reported on the {day}. The fee is his. The terms were the terms. There will be another gate; there always is." (Nothing paid; a *lost*.)

**The race's clock.** Alard goes in on the day the player takes the expedition, and *reports* three game-days later, at the hour rolled on the expedition's id. The player who has put down the count by then and reports before him wins. The count is the Fighters' Guild's *clear* rule (foes put down inside that gate, counted by its portal). If the player never takes it, Alard wins it in the week's talk and nobody minds.

### 3. Alard de Drac (Gatelander, Crown-born; proverbs, indirection, no bare yes or no, oaths on the Weaver)

He camps at the door of the week's expedition gate, his helm on a stone beside him.

**Greeting, first:** "Another for the same door. Well. The gate's wide enough for two, and the glory's not, so we'll see."
**Greeting, again:** "Yourself. I'd hoped it would be you, and I'd hoped it wouldn't."
**Greeting, to a player who has beaten him in a race:** "The one who reported first. The Weaver keep you. I mean it about half."

**Topics**
- *Who are you?* — "Alard de Drac, that was Sir Alard. You can say *Sir* if you like. The Crown took it back, and it was the Crown's to take, but it can't stop you saying it."
- *Why did the Crown take it?* — "I came up out of a gate in the hills with the thing we went for and without the boy I went with. He was hurt, and slow, and I was quick. A road known by its stones, and a man known by who he carries. I carried the wrong thing." (Once only; asked again: "I've said it once. Once is what it costs.")
- *Why race me?* — "Because a knight with no Crown is a man with a sword, and a man with a sword is the cheapest thing in the Gatelands. If my name's said in the right inns enough times, the Crown may hear it. Yours is in the way of mine. Nothing personal in it."
- *What do you think of Lysandra?* — "She'd pay the gate itself if it reported first. I'd not have her any other way. You know where you stand with a ledger."

**His thread: the race, and who won it.** Read from `worldState.rivals.races`, at his next meeting after each:
- The player won: "You were first. Well. A slow horse still gets home. I'll be first another day."
- He won: "First, and by a day. I'll not crow. My father crowed, and the Weaver took his voice for it, the old ones say. Next time."
- The player has won three: "Three times. I've started hearing your name in the inns where I wanted mine. I don't hate it as much as I meant to."
- He has won three: "Three. They're saying *de Drac* again on the north road. If the Crown asks, I'll tell them some of it was luck. Not which part."

### 4. Ailill (Old Blood; sparing, exact, the older word for the thing)

He stands at the door of the nearest gate, to the player's last town, whose condition is *failing* (`gateCondRoll(seed)`), by day, with the armillary on the ground in front of him, turning. Where none is failing within the island, he is not there that week.

**Greeting, first:** "Not this door."
**Greeting, again:** "You came back to a door that asked you not to."
**Greeting, to an Old Blood player, first:** "You feel it. Thin. Do not lean on it."

**Topics**
- *Who are you?* — "Ailill. I listen at doors."
- *What do you hear?* — "How a door is. Some are whole. Some are wearing. One or two are worn through."
- *How is this one?* (his service; at any gate's door where he stands, and once a game-week of any gate the player names by standing at it) — by `gateCondRoll(seed)`:
  - steady: "Whole. Go in. It wants going into."
  - failing: "Wearing. It has been opened too often. Leave it a while."
  - catastrophic: "Worn through. What comes out of it is not what went in. Do not go for the gold."
- *Opened too often?* — "Every clearing wears the door. A door unopened rots. A door opened every day wears through. Both are true. I did not make it so."
- *Are you one of the cold-eyes?* — "Yes. The word is older than yours. I do not mind it."

**His thread: *Leave It a Week*.** At a failing gate, once: *What would you have me do?* — "Do not clear it. Seven days. Then it will hold another year."
- *I'll leave it.* — "Good."
- If no foe is put down inside that gate for seven game-days after (the *clear* count again, read the other way): next meeting, at any door, "It held. You can go in now. Gently." (Nothing paid. The town nearest that gate gains a point of prosperity the next game-week, as a cleared road gives one; **Rule read**.)
- If the player clears it inside the week anyway: next meeting, "You went in." Nothing else; from then his first greeting at any door is "Not this door either." and he does not ask again.
- If the player asked and never answered, nothing changes.

**Rule read (systems):** *a failing gate left a week.* The game has no rule that a rested gate does anything. The plain reading: a failing gate left unentered for seven game-days after Ailill's ask lifts the nearest town's prosperity by one, once, like a cleared road's weekly point (§12a's drivers). No line depends on it; without the rule, *It held* is the whole reward.

### 5. Tadhg Ó Faoláin (Gatelander; proverbs, indirection, no bare yes or no, oaths on the Weaver)

He sits on the inn's step with the wolf across his feet.

**Greeting, first:** "Easy past her. She's no harm in her, but she's no manners either, and she's mine, not the town's."
**Greeting, again:** "Yourself. She knows your step now. That's more than she gives the priest."
**Greeting, to a Markman player, first:** "A Mark face. She'll like you. She likes the cold ones best, and I've never asked her why."

**Topics**
- *Who are you?* — "Tadhg Ó Faoláin. A scout, for whoever's going in and wants to know who went in before them. The name's my grandfather's, and the wolf's my own doing."
- *The wolf?* — "Found her in a snare as a pup, and she's never let me forget I let her out. She won't go with you. Don't take it hard. She won't go with anyone."
- *Who's below?* (his service; free) — he says where each of the others is this game-week, and sets the way to the one the player picks:
  - "Stonehand's at {gate}, {dir}, taking money off people for telling them it's dark inside."
  - "The Per-Akhet woman's on the quay at {port}, with a gate for whoever's quickest."
  - "De Drac's at {gate}, {dir}, polishing a helm nobody gave him."
  - "The cold-eyed man's at {gate}, {dir}, telling people not to go in. Some listen."
  - None there that week: "Nobody I'd send you to. A quiet week. They happen."
- *Do you ever go in?* — "I did. Once is plenty, if you come out. I watch the doors now. A man at a door sees who comes out, and that's worth more than what they bring."

**His thread: *A Wounded Man*.** Once, after the player has won a race against Alard (the knight comes out hurt, from pushing to beat them next time): *Something wrong?* — "De Drac. He went in after a gate he'd no hope of beating you to, and came out of it on one leg. He's at the door of {gate}, and too proud to send to the town for a healer. The old saying is you don't leave a wounded man, and he knows it better than any of us. Bring him something for it, would you? I'd go, but she'd follow, and he hates dogs."
- *I'll go.* — "Go on, so. The Weaver keep the both of you."
- At Alard's door, with any healing potion in the bag, *Tadhg sent this.* (the potion is taken): "Tadhg. Of course. …No. Not Tadhg. You." He drinks it. "A man known by who he carries. I told you that, and here's you carrying me. Weaver keep you. I'll not race you this month." (No race offered that game-month; at Tadhg's next meeting: "He's walking. He says he isn't grateful. He's grateful.")
- With no potion: *Not yet* in Alard's words: "Then I'll sit. The door's not going anywhere and neither am I."
- If the player never goes: after seven game-days Tadhg says "He came down on his own. Took him two days. He'll not say your name now, and I'll not blame him." and Alard's greeting is "Yourself." from then.

### What in the code would carry it

- **`87-world-quests.js`**: a `RIVALS` table beside the travellers', each a `makeDef` with `authored:true`, `keepName:true` and the people given, placed by `rivalAt(key,week)` from `seededRng('rival', key+':'+week)` among the places the table names (`CELL_DOORS` with `dungeonWorldPos` for the gates, the island's ports for Lysandra, the inn's door for Tadhg), and spawned when the player is within a cell of the place (as the lost person is, `spawnNPC` with `sched:{type:'lost'}`). Tadhg's wolf is a `Wolf` rig from `34-creatures.js` with no foe tag, at his heel.
- **School words**: the gate's theme through §9a's *Was* column (`SCHOOLS`, `87-world-quests.js`) into the six lines of Cynric's guide; the way set as `WAY` is (`83-world-generator.js`).
- **Cynric's pick**: the town quests' *retrieve* pickup (`qPickupTick`), a quest record `kind:'retrieve'`, id `rv:cynric:pick`.
- **The race**: a quest record (`kind:'race'`, id `rv:race:<week>`) with the gate's portal, the count and `datedWork`'s date; Alard's report time `seededRng('rival-race', id)`; the count by `qOnKill(e,'dungeon')` against `currentPortal`, as the guild's *clear* is. Outcomes kept in `worldState.rivals={races:{won,lost},cynric,ailill,alard}` (a world key: `_applyLoadData`'s S242 list; not in `SS_CHAR_WS`, since the rivals belong to the world).
- **Ailill**: `gateCondRoll(seed)` for the three lines; his ask a record (`kind:'rest'`, id `rv:rest:<seed>`) with the day asked, read against kills in that portal.
- **Tadhg's wounded man**: a record (`kind:'wounded'`, id `rv:alard:<race id>`), the potion taken by `bagTake` on any item with `heal`.
- **Journal titles:** *Stonehand's Pick* · *The Per-Akhet Expedition* · *Leave It a Week* · *A Wounded Man*.

### The register, checked

- Cynric: *aye*, *iron and blood*, sentences of two to six words, a nickname; no honorific; *Ha* once.
- Lysandra: *Master*, terms, fees, *the house's note*; no oath. Her *I keep the accounts separate for its sake* is the Compact's paper over oaths.
- Alard and Tadhg: proverbs (*a slow horse still gets home*, *a man known by who he carries*, *a road known by its stones*, the Gatelands' pride, §1.1), no bare yes or no, *the Weaver keep you*. Alard's *Sir* is the Crown's and he says so.
- Ailill: three sentences at most, *door* for the gate, *wearing* and *worn through* for failing and catastrophic, *clearing* in its plain sense. He never says *Clearing* as the canon's word for the burning of the dead, and nothing he says explains it.
- Slurs: *cold-eyes* is said to Ailill by the player's label and he takes it, which is the canon's *said with a shudder* answered by the one it is said of; Tadhg's *the cold-eyed man* is fond. Nothing about bodies.
- No prophecy, no description of the player, no remark on the player's returns.

---

## Strange Places, I — the Drowned Ring, the Hangstones and the Falak

*Unapproved.* *Drafted 30 Oct 2026. Backlog L5, *Strange places* (OG-106): the concept artist built three wonders from the gate kit's stones, one an island (`docs/prototypes/levelup/wonders.js`, 29 Oct), and Michael answered DECISION #898 the same day: **quiet by day, awake dusk to dawn (20h–5h)**. The concept's notes leave "what a wonder does to you when you walk into it" to the systems builder and the quest writer. This draft gives the three their names, what you see and read on the first sight by day and by night, what the people near them say, one thing each does to a person who stands in it after dark, and the line the Old Blood have for each. The rules in §4 are small and are proposals: an approval of this draft is the systems builder's go-ahead to build them, and each can be left out without breaking the words.*

### What the canon fixes, and where it is silent

- *OG-106's wonders read as what a failing gate does to a place* (backlog L5, from Part I's *the central mystery*: a strained gate shapes what is near it). Each of the three is built from a gate's own stone and lit in one school's colour: the Ring Uisce's blue, the Hangstones Gaoth's pale blue, the Falak Solas's gold (`docs/concepts.md`). So each is a gate that failed long ago, quietly, in a way that lifted its stone instead of making foes. **Nobody says so.** The Old Blood come nearest, in one line each, and do not explain it.
- *The surface is high fantasy … locals treat the strange as ordinary* (§10a; §10's *written dry*). The three are landmarks people picnic near, charge tolls at and tell children not to swim to. Nobody is frightened of them by day. By night they are beautiful, and that is what people say about them.
- *Speech follows the speaker* (§1.5), *names by people* (§2): the Ring is in the Gatelands and has an Irish name; the Hangstones are in the Mark and have an Anglo one; the Falak is on Aurenne's coast and its name is the register's Arabic root (*falak*, the turning sphere of the sky). The Old Blood call each by an older word (§2: *answer questions with the older name for the thing*).
- *§3.3: the Old Blood feel warm stones at a distance.* An Old Blood player feels the wonders the same way: one line, the first time.
- *No chosen-one prophecies* (Part I, §4.2). Nothing at a wonder is about the player. The Falak points at something; it would point at it for anyone.
- *Silent:* whether a wonder can be cleared, sealed or harmed; whether it is a gate. The plainer thing: it is not a gate (no door, no sigil to touch, no foes), and nothing the player does changes it. It is a place to stand.

### 1. The names

| | Map name | What the people near it call it | The Old Blood's word |
|---|---|---|---|
| **The Gatelands' Drowned Ring** | **Loch an Fháinne** | *the Ring*; *the Drowned Ring* in the towns | *an Doras Báite*, the drowned door |
| **The Mark's Skyfall Fields** | **Hangstone Dale** | *the Hangstones* | *na Clocha nach dTiteann*, the stones that do not fall |
| **Aurenne's Broken Orrery** | **Ras Falak** (the headland) | *the Falak*; *the Orrery* among the academy's people | *an Seol*, the loom |

*An Seol* is the Irish word for both a loom and a sail. The Old Blood mean the first. Nobody in the game says that they mean the first.

The map's hover card, under the name (`townCard`'s line for a point of interest, the same shape as a ruin's):
- Loch an Fháinne: *A lough in the fen. Seven stones stand in it.*
- Hangstone Dale: *A valley under snow. The stones are above it.*
- Ras Falak: *A headland over the sea. Something turns on it.*

### 2. The first sight

A `showMsg` and an `addLog`, once a character for each wonder by day and once by night (`worldState.wonders[<id>] = {day, night}`, keyed by the wonder's id). It fires when the wonder is within 260 m and in front of you, or within 60 m whichever way you face. Day is 5h to 20h by the clock, night 20h to 5h, the same hours the wonder wakes by.

**Loch an Fháinne**
- *By day* (`#c8d0d8`): *Seven stones stand in the lough, each as tall as a church. An eighth lies across them. The water around them is very still.*
- *By night* (`#9ec8f0`): *Light is moving under the lough, inside the ring of stones. It rises to the surface and goes down again, slowly, like breathing.*

**Hangstone Dale**
- *By day* (`#d8dce0`): *The stones of the valley are in the air. The largest is the size of a house. Under each one is the hole it came out of, and snow does not lie in the holes.*
- *By night* (`#b8d8f0`): *The stones are turning, very slowly, high over the valley. Light moves in the cracks under them, the colour of the sky before snow.*

**Ras Falak**
- *By day* (`#e8dcc0`): *Four rings of stone stand one inside another on the headland, each wider than a ship is long, with a stone sun at the heart. Script is cut round every face. They are not moving.*
- *By night* (`#f0d890`): *The rings are turning. The outermost is slow and the innermost quick, and the script on them is lit gold. They make no sound at all.*

**For an Old Blood player, the first time any of the three is within 400 m** (once a character, before the sight line; a `showMsg` only, `#a8b8c8`): *There is a warm stone ahead. A large one. It is not a door.*

### 3. What the people near them say

**A topic**, for a generated townsperson (`makeDef`) of any site within 700 m of a wonder, in the top level while the wonder has been seen (either sight line): the label is the player's, by wonder.

*Loch an Fháinne — label:* **The stones in the lough?**
- Gatelander: "The Ring. It was there before the lough was, my grandmother said, and the lough came to keep it company. Don't swim out. Not because of anything. It's cold, and further than it looks."
- Markman: "The Ring. Big stones in water. Lights at night. Pretty. Don't swim to it."
- Aurennais: "The Ring, Master. The Church holds that it is a work of the old culture and forbids nothing about it, which is unusual. I would observe it from the boardwalk, all the same. The terms of the water are not known."
- Old Blood: "An Doras Báite. It is a door. Under water. It is open a little."

*Hangstone Dale — label:* **The stones in the air?**
- Gatelander: "The Hangstones. I've heard of them and I'd as soon hear of them as see them. A stone's meant to know which way is down. Still, they say it's lovely under the lights."
- Markman: "The Hangstones. Been up since before the League. Won't come down. We tried ropes once. The ropes went up." (Said flat. He is not joking.)
- Aurennais: "The Hangstones, Master. The academy sent a survey to them in my father's time. The survey's conclusion was that they are there. I have read it. It is very thorough."
- Old Blood: "Na Clocha nach dTiteann. They were under the ground once. Something let go of them."

*Ras Falak — label:* **The rings on the headland?**
- Gatelander: "The Falak, they call it over there. Turns at night like a mill with no water. They'll charge you to look at it, I'd wager, and charge you again to stop."
- Markman: "The Falak. Rings that turn. No one turns them. Aurennais sit under it and write things down."
- Aurennais: "The Falak, Master. It is the oldest instrument on the coast, and the academy has spent three hundred years agreeing what it measures. The present consensus is the sky. I hold, privately, that it is measuring something on the ground."
- Old Blood: "An Seol. It still works. That is all I will say about it."

**Rumours**, in towns within 900 m (`liveRumours`, the pool's one voice, by the speaker's people, while the wonder is unseen; they stop once you have seen it):
- Gatelands: "There's a ring of stones in a lough in the fen, and the light under it at night would make you forget your own name. Not in a bad way. Mostly not."
- The Mark: "Hangstone Dale. Stones in the sky. Go at night. Wrap up."
- Aurenne: "On the headland of Ras Falak there is an orrery that turns without hands, Master. By night it is lit. People travel from the other islands to see it, and the inn at the foot of the road has raised its prices accordingly."

### 4. One thing each does after dark (the rules, for the systems builder)

Each fires only between 20h and 5h, while the wonder is awake, and only once a night (keyed by the wonder's id and the night's day number: `<id>:<day>`, the co-op rules, read from the clock, never the frame count).

**Loch an Fháinne: lost time.** Stand inside the ring of piers (within 26 m of its centre, on the water or swimming), and the clock moves on by one hour. Nothing else changes: no health, no foes, the weather goes on. A `showMsg` (`#9ec8f0`) and the log:
- *The light under the water rises and goes down. When you look up, the moon has moved.*

**Hangstone Dale: the needle.** Within 60 m of any of the stones at night, the compass's needle turns round slowly and points nowhere (the compass strip's places are hidden; the markers on the map stay). A Lodestone in the bag (Mining 75, Session 1562) turns in the bag. One line, the first time a night:
- *The compass turns and will not settle.*
- with a Lodestone carried: *The compass turns and will not settle. The lodestone in your pack is turning too.*

**Ras Falak: what it points at.** Stand on the platform (within 23 m of the sun) at night and wait (`Wait` one hour, or sixty seconds of play clock standing there), and the outer ring stops with the cut in its rim lined on the nearest old gate you have not found. The gate is marked on the map as found by direction (`discover('door_'+seed)`, its glyph without its name until you reach it), and the way is set (`WAY`). A `showMsg` (`#f0d890`) and the log:
- *The outer ring slows, and stops. The cut in its rim is pointing {direction}, over the water, at something. Then it turns again.*
- If every gate on the island is found: *The outer ring slows, and stops, and points at nothing you have not already seen. Then it turns again.*

### 5. The journal

The log carries the sight lines (§2) and the night lines (§4) under the wonder's map name. The Journal's *Places* gets an entry the first time each is seen: the hover card's line (§1) and the day's sight line, dated.

### What in the code would carry it

- **The wonders as points of interest** are the look builder's (the chunk scatter, once per island by a seeded stream keyed by the island; `docs/concepts.md`). Their ids are `wonder:lough`, `wonder:skyfall`, `wonder:orrery`, and the names in §1 are their `name`s on the map (`drawLocalMap`, the continent map, the hover card).
- **The first sights**, `wonderTick` in `88-world-ticks.js` beside `tickWaylamp`. It reads the clock (`worldState.gameTimeMinutes`) for day or night and the wonder's position, and records `worldState.wonders[id] = {day: true, night: true}`. What a character has seen is the character's, so `wonders` goes in `SS_CHAR_WS` as well as in `_applyLoadData`'s S242 list.
- **The topic**, in `makeDef`'s topics (`83-world-generator.js`), the top level, while `worldState.wonders[id]` is set for a wonder within 700 m of the speaker's site. The responses are by `def.people`. The rumours go in `liveRumours` (`88-world-ticks.js`) while it is unset.
- **The rules in §4** are the systems builder's: the lost hour through `advanceClock` (the co-op rules' named action), keyed `<id>:<day>`; the needle in the compass strip (`compassPlaces`, `87-world-quests.js`); the Falak's pointing through `discover` and `WAY`. Every line in §4 is final as written.
- **The Old Blood's warm stone**, a `showMsg` in the same tick, once a character, `worldState.wonders.felt`.

### The register, checked

- Gatelanders: *my grandmother said*; *I'd as soon hear of them as see them*; *a stone's meant to know which way is down*; *I'd wager*. No bare yes or no, and no oath needed.
- Markmen: two to five words a sentence; *we tried ropes once*; no honorific; a joke that is not one, said flat.
- Aurennais: *Master*; *the terms of the water are not known*; *the survey's conclusion was that they are there*; *the present consensus*; *I hold, privately*. No oath.
- Old Blood: the older word first, then at most two short sentences. *It is open a little*, *something let go of them* and *it still works* are the nearest anyone comes to §3.1, and none of them explains it.
- Nobody describes a body. Nobody is afraid of the wonders by day. Nothing is a prophecy, and nothing is about the player.

### Owed, and not drafted here

- OG-106's other wonders (the Hollow Wood, the Weaver's Grave, the Bleeding Glacier, the Singing Chasm, the Frozen Library, the Mirrored Oasis, the Glass Desert, the reef where ships vanish, the wandering island), as the look builder makes them: a second part on this frame.
- A sound at night for each (`72-audio.js`): the Ring's water, the Hangstones' wind and the Falak's silence. The draft says the rings *make no sound at all*, and the build should keep them silent.

---

## The Mark's Rings — Jora, the ring masters, the fixer, the fighters' names and Red Finn

*Unapproved.* *Drafted 1 Nov 2026. Owed by the arenas build sheet (`docs/design/arenas-build.md`, its last row: "Jora, Red Finn's legend, the ring masters' and fixers' lines, the watchers' barks. Placeholders until then.") on Michael's B on #914 (30 Oct). The systems builder's sessions 1–5 are on main (Sessions 1637–1659): the yard's spar and brawl, the ladder's twelve bouts, the wager, the fixer, the post and the title. Every line a person says there today is a placeholder or the narrator's. This draft gives the rings their people.*

### What the canon fixes, and where it is silent

- §1.2: the Captains' League settles disputes by duel; the Mark exports soldiers and is "known for steel and mercenaries"; it scorns priests, ledgers and soft hands. So the ring is work and law before it is sport, and the crowd knows a blow.
- §2: Markmen speak in short sentences, *aye*, nicknames, oaths on iron and blood, no honorifics. Every ring master, fighter, fixer and watcher here is a Markman unless named otherwise. A bout's fighter is called by a byname, because that is what the Mark does with names.
- §2's body row: Markmen are ash-blond. The art gives Red Finn red hair (OG-079) and Jora a dark skin and braids (OG-089). Both are kept without breaking the row: Finn is *Red* for what he did, not for his hair; Jora is port-born, her mother an Aurennais factor's cook, which §1.5's mixed crowd at a port allows. She is a Markman in speech and in law.
- *Silent:* whether Red Finn lives, and where. The plainer choice: nobody in this draft knows, and every teller says something different. Whether he is ever met is backlog L2's *The strange and the legendary*, not this.
- *Silent:* the massacre on "the Blackshore isle" (OG-079's note). No Blackshore is in the canon, so no teller names the place: they say *the islands*, *a raid*, *the business on the coast*, and none agree.

### 1. The fighters' names (the ladder and the brawl)

A fighter is `{name} {byname}`: the name from the Markish bank (`NAMES.anglo`, by the fighter's sex), the byname from this list, both rolled on the fighter's id (`ring:<bout>:<n>`, `seededRng('ringname', id)`), no byname twice on the ladder at once. It is the name above the health bar, in the messages and, after a murder, on the post.

*Bynames:* Ashfist · Halfhand · the Ox · Longreach · Quickstep · Saltjaw · Ironbrow · Coldwater · the Mule · Two-Knives · Stonefoot · the Heron · Grey Wolf · Hammerhand · Lastword · the Hook · Bitterroot · Oarsman · Whitetooth · Nine-Toes · Crowfoot · the Bell · Fenhound · Tallow

The challenger at Caer Slige is named the same way and keeps the byname if the title passes: *The title passes to Edwy Longreach.*

The brawler at a yard is named the same way, from a stream on the yard and the night (`seededRng('brawlname', site+':'+day)`).

### 2. The ring master (one at each ring's gate)

A Markman or a Markwoman, named from the bank on the ring's site, standing at the gate from 8h to 18h. Talk opens *Ask for a bout.* and the master's refusals in their own voice; today's `say` lines become theirs. The narrator's lines (*Bout {n}. The ring closes.*) stay.

**Greeting** (one, by how far up the ladder you are):
- rank 0: "New. Name and weight. No, keep the weight."
- rank 1–5: "You again. Good. The crowd remembers a face."
- rank 6–11: "There's money on you now. Don't waste it."
- the title: "Champion. Iron keep you. Mind the challengers."
- banned: "No. You know why. The post knows too."

**Ask for a bout.** — the call (replaces *Bout {k} of 12 is called at {h}h. {purse} gold to the winner.*):
- "Bout {k}. {h} o'clock. {purse} to the winner. Be at the rope."
- with the fixer about: the same, and "Man at the gate wants a word with you. Not my business."

**The refusals** (each replaces the placeholder in brackets):
- [*One bout a day. Come back tomorrow.*] "You've fought today. Blood's for tomorrow."
- [*The bouts are called from {open}h to {close}h.*] "Bouts are called {open} to {close}. Come in daylight."
- [*Your bout is called at {h}h.*] "You're called at {h}. Stand by the rope."
- [*The title is fought at Caer Slige.*] "Twelfth bout's at Caer Slige. Always has been."
- [*The challenge is fought at Caer Slige.*] "Your challenger's at Caer Slige. Go and meet them."
- [*You hold the title.*] "You hold it. Nothing left here but holding it."
- [*The rings of the Mark are shut to you.*] "Shut. Every ring from here to the strait. Your name's known."
- [*The ring is shut while the town is held.*] "No bouts while they hold the town. We don't fight for their entertainment."
- [*You are already in the ring.*] the narrator's line stays.

**The wager** (the master keeps the book; replaces *How much?*, *The book takes up to {cap} on this bout.*, *Your stake is already down.*, *You have not got {n} gold.*):
- "How much on yourself?"
- "Book takes {cap} on this bout. No more."
- "Your money's down. Leave it."
- "You haven't got {n}. Come back when you have."
- placed (*{n} gold on yourself at {odds} to 1.*): "{n} on you at {odds} to one. Win it."

**The fixer reported** (replaces *The ring master has the bookmaker's man thrown out. Your next purse is half again.*): "Thrown out. By the collar. He won't be back at this gate." Then the narrator: *Your next purse is half again.*

**The post** (*Press 'E' to read the post*) is the narrator's and stays. Asked *Whose names are those?*, the master: "The top board's the champion's. The ones under are men and women who yielded and got hit anyway. We don't cut the man who did it. We cut the dead. You remember them, and you know."

**After a murder** (the master, to anyone who asks within the 28 days): "Iron and blood. We said the yield was the yield. Nobody fights here who'll forget it."

### 3. The bookmaker's man (the fixer)

At the ring's gate on a fixer's day, a Markman with a byname of his own (*Lark*, *Spinner*, *Old Coin*, rolled on the bout's id). One topic: *You wanted a word.*

- The offer: "Bout {k}. You go down in the second minute. {n} gold, now, in your hand. Nobody's hurt. Well. Nobody's hurt much."
- **Take it.** (replaces *{n} gold to go down in bout {k}.*): "Good. Second minute. Look tired first. They like that."
- **No.**: "Your loss. Literally."
- **I'll tell the ring master.** He says nothing; the master's line above follows.
- Found out (replaces *The fix is found out. A fine of {fine} gold, and the rings of the Mark are shut to you.*): the master, "You sold a bout. {fine} gold, and you're done here. Every ring. Get out." Then the narrator: *The rings of the Mark are shut to you.*
- Took the money and won (replaces *Two men are waiting at the ring's gate. The bookmaker wants his money back.*): the narrator keeps *Two men are waiting at the ring's gate.* and the first of them says "The book wants its money back. All of it. Now or later, and later's worse."

### 4. The yard's trainer, and Jora

Every yard has a trainer, a Markman or Markwoman named from the bank on the yard's site, except one: **Jora**, at the yard of the Markish port nearest Caer Slige (the first by `sitesNearFixed` from the seat whose kind is `port` and which has a yard; one place in every game).

**The spar** (the narrator's *You take a staff from the rack. First to three clean hits.* stays; the trainer adds, at the start): "Three clean. I'll tell you what you did wrong. You'll hate it."
- The calls stay: *Early.* · *Late.* · *Good.* · *Good roll.*
- won (after *Three clean. {name} nods: you have it.*): "Again tomorrow. You'll be worse. Then better."
- lost: "Three on you. Your guard comes up like it's asking permission."
- closed [*The yard is shut until morning.*]: "Yard's shut. Go and drink something."

**The brawl** (18h–22h; the narrator's lines stay; the trainer, or Jora, holds the stakes):
- the call, before *The ring closes. {stake} gold a side. Fists.*: "Fists. {stake} a side. Yield's a knee. Hit a knee and I'll hit you."
- [*One brawl a night here.*] "One a night. The floor needs to dry."
- [*The brawls are after dark.*] "Brawls are after dark. Daylight's for learning."

**Jora's own topics** (the yard, from the second meeting):
- *Who are you?* — "Jora. My mother cooked for a factor at the quay. My father had a boat and a temper. I got the temper and kept the boat till it sank. This yard's mine now."
- *You don't look Markish.* — "Neither does half this port. I was born on the wharf, I swear on iron, I pay the Reeve. Ask the yard what I am. It'll tell you with a staff."
- *Who's the best you've seen?* — "In the yard? A girl from the hills who couldn't lift the staff the first month. In the rings? Finn. Everyone says Finn. They're right, and they don't know why."
- *Red Finn?* — see §5, Jora's telling.
- *Should I fight the ladder?* (rank 0 only) — "Fight the yard first. Twelve bouts and the last one's a wall. Men walk into it with their chins."
- holding the title — greeting: "Champion. Don't let it go to your feet."

### 5. Red Finn's legend

Never beaten in the rings of the Mark, and gone from them. Every teller has it differently. Nobody says where he is.

- **Jora** (*Red Finn?*): "Twelve bouts in a season, twice. Never down. Then he went on a raid with a free captain, to the islands, and came back on his own. Walked into Caer Slige, put the greatsword on the champion's board, and left. Didn't fight again. They call him Red. His hair's as pale as any Markman's. It's not for the hair."
- **A ring master at Caer Slige** (*The champion's board?*, while the title is not yours): "Finn's board, it was. Twenty-four bouts, nobody put him down. He left it, so it went to the next. Ask the old men about the raid. Don't ask them sober."
- **A Markish innkeeper** (the rumour pool, any Markish town with a ring): "Red Finn drank here. Paid in silver and broke a table. Paid for the table. That's all I'll say."
- **A Gatelander** (the rumour pool, a Gatelands port): "There's a Markman they call Red Finn that never lost a fight, and they say the one he couldn't win was with himself. That's a Markish way of losing. They do it alone."
- **An Aurennais** (a Compact port): "The Markish champion? I am told he was undefeated, and then unemployed, which in the Mark is the more remarkable. There was an incident, Master. The free captains' accounts do not include it."
- **Old Blood** (asked by an Old Blood player only, *Red Finn?*): "He came back with blood on him that was not his. He washed it. It stayed. The old word for that is *fuil fhada*, the long blood. You know it."
- When you take the title, the master at Caer Slige: "Your name, on Finn's board. Iron keep it there."

### 6. The watchers' barks

Cosmetic, from the stands while a ladder bout or a brawl runs (`Math.random` is allowed: they change nothing), one at a time, one in five events at most, shown as the narrator shows a passer's line: *A voice from the stands: "{bark}"*

- the bout opens: "Get in there!" · "Go on, then!" · "Two silver on the big one!"
- a clean hit by you: "That's it!" · "Again!" · "Felt that from here."
- a clean hit on you: "Get up!" · "Guard, you mule!" · "Ah, he's done."
- a parry: "Iron on iron!" · "Did you see that?"
- the yield: "Knee! Knee!" · "Let him up!"
- the spare: "Good." · "That's the Mark." · "Up he gets."
- after the yield, struck (the murder): no bark. *The stands go quiet.* (the narrator's line on main already says it).
- your win: "That's the one!" · "Pay up, Wystan." · "Iron and blood!"
- your loss: "Next time." · "Told you." · "Pay up."
- the title: "Champion!" · "Iron and blood!"

### What in the code would carry it

- **`87-world-quests.js`**, the arena block (`ladderCall`, `ladderStake`, `takeBribe`, `reportFixer`, `titlePass`, `sparStart`, `sparEnd`, `brawlStart`, `brawlEnd`): a `RING_TALK` table with the lines above, read where each `say` and `showMsg` is now; the fighter's name through one function, `ringFighterName(id)` (the bank and `RING_BYNAMES`), used by `ladderFighter`, the challenger and `brawlStart`. The post's dead are cut by that name, so a save made before this lands keeps its *The fighter of bout {n}* until the next murder.
- **The ring master and the trainer as people.** Today the gate and the rack take the call (`ringUse`, `yardRackUse`, `83-world-generator.js`, the comment there waits on "the quest writer's master"). The master and the trainer are `makeDef` people spawned at the ring's gate and the yard's rack (`S.ring.gate`, `Y.rack`), keyed `<site>:ringmaster` and `<site>:trainer` (co-op rules), with their topics; the gate's and the rack's E stay as they are for a player who would rather not talk. That spawn is the systems builder's (or the look builder's, for where they stand); the words are mine, built once it lands.
- **Jora's yard**: one function, `joraSite()`, from `sitesNearFixed` on Caer Slige's site; her def `keepName`, `people:'markman'`, the topics in §4.
- **The rumours** (§5) go in `liveRumours`' pool by the town's people and the ring's presence, as *Under Another Flag*'s rumours do.
- **The barks** (§6) are a tick on the bout's events, cosmetic, never saved.
- Nothing new in `worldState`: names roll on ids; `worldState.rings` already holds the dead.

### Owed, and not drafted here

- Whether Red Finn is ever met, and what the raid was, is *The strange and the legendary* (backlog L2). This draft leaves room: nobody knows.
- The occupied League town's lost duels (§12) are *Under Another Flag*'s; the master's line there is the only one this draft adds.
