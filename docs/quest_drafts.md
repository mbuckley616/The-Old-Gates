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
- **The kept boon.** It must not go through `ACTIVE_BUFFS`: `_applyBuff` replaces any buff of the same type, so a potion would wipe it, and `ACTIVE_BUFFS` is cleared on load. The plainer carrier is a `keptMult(type)` read from `shrineKept` via `GODS`, multiplied into `_buffMult(type, def)`, so every existing reader picks it up.
- **A bug found while tracing this, for the systems builder.** Three of the five boon types are read nowhere. `swiftness` (the Road), `warding` (Stone, and also the Shield spell's `warding`) and `regen` (Renewal) never appear in any `_buffMult`, `_hasBuff`, `_activeBuffs` or `b.type===` check on main or auto/systems. Only `meleeDmg` (the Arm) and `spellCost` (the Mind) have any effect today. The Road probably wants `sprintSpeed` or a move-speed read, Stone wants `dmgReduce` or `physResist`, and Renewal wants `hpRegen` with a `rate`. Making them permanent is worth doing only after they work.
- **The priest.** Next to `penanceTopics(site)` in the church's `_extraFn` (grep `the priest hears a confession`), add `shrineTopics(site, def)`. It returns `[]` unless `worldState.shrines` has a key. In the before state it is a folder with one follow; in the after state it is a single response. It sits beside the Guest draft's `guestTopics` if that is built.
- **Rumours.** One string appended to each of `RUMORS.irish`, `RUMORS.anglo` and `RUMORS.french`.
- **Character sheet.** Next to the People row (grep `row('People'`), one row per `shrineKept` entry.

### Checked against the canon

- *No chosen-one prophecy.* Nothing is said about the player beyond what they did three times. None of the three descriptions appears. The Weaver's *the flame has turned toward you* is the loom noticing, in the register of the tutorial's *something turns its attention toward you*. It is not a calling.
- *Na Beithígh.* *"Her children do not know their mother"* is §4.1's scripture, and so is An Mhuir's *owns them twice a day*.
- *The gods are works, not persons.* No god speaks. The altars change, and the priests argue about what that means.
- *Register.* The Aurennais priest uses *Master*, qualifiers and account metaphors, and no oath. The Gatelander priest speaks in a proverb, gives no bare yes or no, and swears by the Weaver. The Markish priest is short, says *aye*, and swears by iron. The Old Blood priest says little and puts *cuimhne* first.
- *Slurs and contradictions.* None are used here. The Aurennais rumour contradicts its own Prior, which is the canon's pattern (§2.1).
