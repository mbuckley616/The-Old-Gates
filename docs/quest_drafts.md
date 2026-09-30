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
