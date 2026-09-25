# Dungeon of Shadows — quest writing

*Verbatim dialog, prose, popup texts, and encounter scripts. The authority on the exact words. World/character authority lives in `lore_canon.md`; what's been built lives in `devlog.md`.*

*Direct copy from session conversations. Nothing here gets summarized — if a line is here, it's here in full.*

---

## Table of contents

- [Tutorial — intro fade](#tutorial--intro-fade)
- [Tutorial — Q0 quest text](#tutorial--q0-quest-text)
- [Per-NPC introduction responses (v61b6)](#per-npc-introduction-responses-v61b6)
- [Q7 — The Rubbing — full popup texts and Aldwyn dialog](#q7--the-rubbing)
- [Q1–Q6 readyText / completeText (v61d3)](#q1q6-readytext--completetext-v61d3)
- [Caldric Safehouse grant scene (v61d6)](#caldric-safehouse-grant-scene-v61d6)
- [Burned Ashenmoor — NPC dialog](#burned-ashenmoor--npc-dialog)
- [Bram body — interact text](#bram-body--interact-text)
- [Varek — first meeting at The Ashfeld](#varek--first-meeting-at-the-ashfeld)
- [Varek — Act II encounter (meta-awareness articulation)](#varek--act-ii-encounter-meta-awareness-articulation)
- [Varek — final monologue (Act III revelation)](#varek--final-monologue-act-iii-revelation)
- [NPC quotes about Varek (the Vader Effect)](#npc-quotes-about-varek-the-vader-effect)
- [The List — discovery prose](#the-list--discovery-prose)
- [Salthaven — village fleshing-out (v61em)](#salthaven--village-fleshing-out-v61em-session-35)
- [Carraig Mór — village fleshing-out (v61eu, Session 37)](#carraig-mór--village-fleshing-out-v61eu-session-37)
- [Pending writing](#pending-writing)

---

## Tutorial — intro fade

The fade is non-skippable. Main game loop pauses during the fade (`_introFadeActive` flag) so enemies don't move, attack, or damage the player. Music starts as dungeon-undead immediately. Approximate total runtime ~14.6s across four lines.

### Line 1 — Universal opening

> *"Stone above. Stone below. The breath in your chest is your own — that, at least, you remember."*

### Line 2 — Per-archetype middle

The player sees only the line corresponding to their chosen archetype.

**Warrior** (Might primary):
> *"The weight of a weapon is familiar. Your hands have known it before."*

**Sentinel** (Fortitude primary):
> *"The cold against your back tells you where the wall is. You learned to listen for it long ago."*

**Duelist** (Finesse primary):
> *"Your balance comes back before your name does. The body remembers what the mind has not yet."*

**Scout** (Swiftness primary):
> *"You marked the directions before you were upright. A habit older than language."*

**Monk** (Resolve primary):
> *"Your breath finds its rhythm without asking. Let it lead you."*

**Scholar** (Intelligence primary):
> *"Letters cross your mind unbidden — a passage from a book you cannot quite place. They will return."*

**Diplomat** (Charisma primary):
> *"You take stock of what you have, what you do not, and what you might still be owed. A reflex."*

**Vagrant** (Fortune primary):
> *"You've woken up in worse. You'll wake up in worse again. Stand."*

### Line 3 — Universal _awakening (Varek meta-hook)

> *"The lid of the coffin lies aside. Your hand still rests on its edge, as if you only just pushed it free. Somewhere very far from here, something turns its attention toward you. You feel it the way you feel weather coming."*

### Line 4 — Universal closing

> *"There is light somewhere ahead. You move toward it."*

---

## Tutorial — Q0 quest text

### Q0 journal entry (rendered at popup + quest log card)

> *"I woke inside a stone coffin in a forgotten crypt. I have no memory of how I came to be here, or for how long I have lain. The air is dank and stinks of death. I need to find a way out."*

### Q0 completeText — emergence into Ashenmoor (the Bram nudge)

> *"Chimney smoke ahead — a village. There was a sign with a hammer painted on it: Bram, the smith."*

The smoke-handoff into the existing Q1 chain. Fires when the player crosses from the tutorial dungeon onto the south road and `worldState.tutorialDone` flips.

---

## Per-NPC introduction responses (v61b6)

The intro topic appears as a player choice ("My name is X.") in dialog after first meeting. Selecting it gives a 1-2 sentence in-character response and marks the NPC as having met the player. `{name}` substitutes the player's chosen name; `{NAME}` substitutes uppercase (used by Finn for shouting).

### Bram (Blacksmith, David, rate 0.88, pitch 0.80)

> *"Bram. Smith here, as you can see. {name}, then. I'll remember it if it lasts."*

### Edna (Healer, Zira, rate 0.98, pitch 1.20)

> *"Oh, {name}, is it? That's a fine name, fine indeed. Sit a moment if your knees will let you — mine won't, anymore, but I'm older than the cottage."*

### Mira (Apothecary, Zira, rate 1.00, pitch 1.10)

> *"Mira. Welcome to Ashenmoor, {name}. You look as though you've been through something. The cot in the back is for paying customers, but the kettle is for everyone."*

### Barnaby (Misc shopkeeper, David, rate 1.05, pitch 1.05)

> *"Barnaby, proprietor. {name}. Coin spends the same whatever the name on it, so we'll get along."*

### Pip (Curiosities dealer, David, rate 1.12, pitch 1.15)

> *"{name}! What a name! I don't believe I've heard one quite like it before — well, perhaps once, in Coeur de Vie, from a woman selling enchanted thimbles, but she insisted hers was different. Pip, by the way. Pip's the name. Pip's the shop. Pip's the everything, really."*

### Brother Oswin (Priest, David, rate 0.90, pitch 0.88)

> *"Welcome, {name}. The Oratory keeps no register, and asks for none. You've been named, and that's enough for now."*

### Sera (Village guard, Zira, rate 1.02, pitch 1.00)

> *"Sera. Village guard. You'll forgive me if I don't take that name on faith just yet, {name} — strangers come through Ashenmoor more than they used to."*

### Tom (Farmer, David, rate 0.95, pitch 0.95)

> *"Tom. Pleased, I suppose. Names don't grow turnips, {name}, but it's good to know what to call you when something needs hauling."*

### Finn (Village kid, Zira, rate 1.15, pitch 1.40 — uses uppercase {NAME})

> *"{NAME}? That's so cool! I'm Finn! I'm gonna be an adventurer too one day. Did you fight anything getting here?? Was it scary??"*

### Corwin (Travelling merchant, David, rate 1.08, pitch 1.05)

> *"{name}. Hm. Travelled far to get here, I'd wager. I'm Corwin — no permanent address worth speaking of, which I find suits me. We'll cross paths again, I should think."*

### Aldwyn (Royal Herald, David, rate 0.95, pitch 0.92)

> *"Welcome to Ironhaven, {name}. Aldwyn — the Royal Herald, in such capacity as the Reach still has need of one. Do come in. There's tea, of a sort."*

### Captain Brynn (Gatehouse captain, Zira, rate 1.08, pitch 0.90)

> *"Brynn. Captain of the Gatehouse. I'll log the name, {name}. If it turns out to be the wrong one, that's information too."*

### Lord Caldric (Slow, weighty, David, rate 0.85, pitch 0.75)

> *"{name}. Yes. We've been informed of your presence — Brynn's people are thorough. Stand at ease. The Reach has more visitors than friends these days; I'd prefer to know which you intend to be."*

---

## Q7 — The Rubbing

Q7 is `autoAccept:true` + `showAcceptPopup:true`. When Q6 completes (Aldwyn's `unlocks` chain), Q7 auto-activates. Acceptance fires in Aldwyn's office; arrival at burned Ashenmoor fires obj 0; **obj 1 fires when the player kills the Faolchú in the village square (added v61c2)**; triage objectives 2-4 fire in any order, GATED on obj 1 — survivors stay hidden until the boss is down; obj 5 (rubbing receive) is gated on [2,3,4]; obj 6 (Aldwyn turn-in) is gated on [5].

### Accept popup (at Aldwyn's office, on Q6 completion)

> *"Aldwyn heard smoke on the south road — Ashenmoor direction, more than a hearth fire. Probably nothing, he said. But he wouldn't have sent me if he believed that."*
>
> *"I need to get home. Fast."*

### Obj 0 completion — arrival at burned Ashenmoor (zoneLabel: "Ashenmoor")

> *"Ashenmoor has been burned to the ground."*
>
> *"Bram. Edna. Corwin and the children. Brother Oswin. I don't know who's alive and I don't know who isn't. Someone came through here while I was in Ironhaven."*
>
> *"And something is moving in the ruins. I can hear it from here."*

### Obj 1 completion — Faolchú defeated (v61c2, revised v61d0)

**v61d0 revision** — chimera silhouette landed in detail (wolf head + horse-arched back + near-human extra arms from spine seam), Edna/Aldwyn forward-projection cut, "movement in the cottages" replaced with the more grounded "buildings still standing":

> *"The thing in the square is dead. Wolf-shaped, near enough, but the proportions were wrong from the shoulders down — too much chest, the back arched like a horse rather than slung low like a wolf, and from the spine seam two arms grew where no arms should be. Almost human, knuckled and clawed. The seams along its back glowed red until I closed them."*
>
> *"Something is still on the body — bone, half-buried in the seam where the binding tried to close. I should look at that before I do anything else. Some of the buildings in the village are still standing. I should check for any survivors."*

### In-fight log lines (during the Faolchú encounter)

These fire from `addLog` during the boss fight, displayed in the activity log scroll. Tonal register: terse, observational, never melodramatic.

- On boss spawn: *"🐺 Something is moving in the ruins."*
- On Phase 2 entry (HP 66%): *"🐺 The Faolchú's seams tear wider."*
- On Phase 2 lesser spawn: *"🐺 A second wolf-shape splits from its flank."*
- On Phase 3 entry (HP 33%): *"🔥 The Faolchú's sigils burn white-hot."*
- On Phase 3 lesser spawn: *"🐺 Another tears free of the seams."*
- On Caor fireball cast: *"🔥 The Faolchú spits fire from the seams."*
- On boss death: *"🐺 The Faolchú collapses. The seams unmake themselves."*

### Obj 2 completion — receive The Faolchú's Mark (v61d0, NEW)

Fires when the Mark enters the player's bag from the boss-corpse loot. The receive_item event hook in `takeLootItem` ticks this objective:

> *"I took it off the seam. A disc of blackened bone, strung on a sinew cord. There's a carving on the face — the strokes look like writing, but the order is wrong, as if the hand that made it didn't know what shape it was making."*
>
> *"Aldwyn will likely want to see this."*

### Obj 3 completion — Bram's body at the forge

> *"Bram went out the way he always said he would. Hammer in one hand, goblin's axe still stuck in the other. Edna watched him fall. I saw what she saw."*
>
> *"He was a good man. He made the first weapon I ever owned. The forge behind him is ash now and I can hear him in it."*

### Obj 4 completion — Brother Oswin at the oratory

> *"Brother Oswin is alive."*
>
> *"He stayed inside when it started. The oratory door is stone and heavy. He heard the Glenn child through it and did not open. He knows it was the right tactical choice. He is not treating it that way."*
>
> *"He said something I need to carry to Aldwyn: 'It wasn't a binding being strained. It was a binding being edited.' I don't know what it means. He said Aldwyn will."*

### Obj 5 completion — Edna at her cottage

> *"Edna is alive. Her hip is broken and she would not leave. She watched most of it through her window."*
>
> *"She is holding something she made thirty years ago. She won't tell me what yet. She wants me to check on the others first, and then she says she will tell me the whole of it."*

### Obj 6 completion — receive rubbing from Edna

> *"Edna's rubbing is in my bag. Thirty years old; the crease of long storage still in the paper. She made it when she was younger and she never knew what it said. Someone who CAN read it has been writing back to her cottage in the dark."*
>
> *"She wants this in Aldwyn's hands. Says he's been sitting on a name and will share it when he sees this. Says not to press him on the road — that's a scholar's conversation, not a market one."*
>
> *"Ironhaven, then. Aldwyn's office. The door shut."*

### readyText (turn-in ready, Aldwyn-bound)

> *"Edna's rubbing is in my bag. She's kept it for thirty years and she trusts me with it. The mark on her west wall was made while she slept, and it matches what's on the rubbing — mirrored. Aldwyn needs to see this. Ironhaven, then."*

### completeText (after Aldwyn turn-in)

> *"Royal Mage Corps commission. Full ink, full seal. I have the name now — Aldred, the man he used to be, and Varek the man he is now. Aldwyn was sitting on both of them. The academies must let me in. The carriage-masters have routes I can take. And Aldwyn has told Captain Brynn to expect me back when I'm ready."*
>
> *"Not tonight. Rest tonight. Act Two begins at the gatehouse."*

### Aldwyn's customActiveDialog (rubbing turn-in)

**Status (v61d0, Session 26):** Mark-aware preamble shipped. When the player has The Faolchú's Mark equipped (or in bag), Aldwyn's response cold-opens with a "Wait, what's that…" beat where he notices the Mark before the rubbing — they appear together on the desk, the Mark first. The original rubbing speech follows after the Mark examination resolves. Branches A/B and the desk → commission cascade are unchanged. If the player doesn't have the Mark, the original rubbing-only flow runs (preserved verbatim below).

**Opening label:** *"Give him Edna's rubbing."*

#### Mark-aware preamble (v61d0) — fires when EQ.amulet is the Mark, OR BAG.some(b=>b.name==="The Faolchú's Mark")

**Aldwyn (Mark equipped):**
> *"Wait. What's that around your neck? — Set it on the desk before the rubbing. Carefully. The bone is fresher than it looks."*

**Aldwyn (Mark in bag):**
> *"Wait. What's that in your bag? — Set it on the desk before the rubbing. Carefully. The bone is fresher than it looks."*

**Player follow: *"I took it off the seam."***

> *"Yes. The strokes are right. The order is wrong. This is the deep tongue — or it's trying to be. The script the binding's makers carved in. Not a hand at work here, traveler. The binding itself, misfiring."*
>
> *"I have been waiting for one of these. Longer than I should admit."*
>
> *"I will not translate this for you tonight. I want to be careful with it. What I can tell you is what it confirms — what is happening underground is not a strain that can be reinforced. It is a structure being unwritten, and the world is producing... transcription errors. Like this one. You killed the first I have heard of by name."*
>
> *"Now. The rubbing."*

**Player follow: *"Edna's rubbing. Here."*** → (continues into the unchanged rubbing speech below)

#### Original rubbing-only opening (no Mark, OR after the Mark beat resolves)

**Aldwyn:**
> *"She kept this. Thirty years. And a match on her own wall — the same mark, inverted. Look at the strokes here, and here. That's not weathering, traveler. That's the inversion operator I've only ever seen in one hand. He was in Ashenmoor. In her house. While she slept. He is faster than I estimated."*

**Branch A — *"Is this enough to move on him?"***

> *"On him? No. He has been careful for two hundred years and we have a drawing. But it's enough to change how we look. And it's enough to change what I can give you. Come to the desk."*

Followed by: *"The desk."* →

> *"Royal Mage corps commission. Full ink, full seal. It says you act under Lord Caldric's authority in matters of anomalous magic across the realm. Dagna will show you her back-room stock when she sees it. The carriage-masters will take you on routes that don't exist on any public schedule. And — this matters — the academies must let you in. Whether they like it or not."*

**Branch B — *"Aldred, then. That's the name."*** *(player-surfaces the name themselves)*

> *"That's the name he buried. The man who carries it now is called Varek — on the few occasions anyone sees him carry anything. Do not say either name to a stranger. I mean that plainly. Now — the desk."*

Followed by: *"The desk."* → (same commission speech as Branch A)

### rewardSpeech (post-turn-in)

> *"Keep the commission on you. Always. It doesn't guarantee safety — the opposite, sometimes — but it guarantees doors open. I've told Captain Brynn you'll be returning. When you're ready, Act Two begins at the gatehouse. Not today. Rest."*

### rewardResponses

**Player: *"I'll rest, then."***

> *"Do. And eat. You look like you haven't. There's a kitchen two doors down that feeds the Herald's office — tell them you're on my ledger."*

**Player: *"Where's Edna now?"***

> *"Still at her cottage. She wouldn't leave. I've sent a cart; if she wants to come to Ironhaven she can. I don't expect her to. Some people root."*

---

## Burned Ashenmoor — NPC dialog

### Edna — burned-state dialog

Free-standing topics (always available): what happened, why didn't you leave, what about the dungeon. Quest-state-aware Q7 topics auto-injected by `buildQuestTopicsForNPC` in four state configurations.

#### State 1 — Neither Bram nor Oswin seen yet

One topic: **"What do you need from me, Edna?"**

(Edna sets the triage. Asks player to check on Bram and Oswin before she tells them anything.)

#### State 2 — Bram seen, Oswin not yet

Two topics:

**"I found Bram at the forge."** — Edna acknowledges she already knew from the window. Her response (post-v61an):
> *"Thank you for going. Bram — no, you don't have to say it. I watched it from the window. Someone going to him was what I needed. I'll grieve him. Later."*

**"What else do you need, Edna?"** — Edna redirects player to Oswin.

#### State 3 — Oswin seen, Bram not yet

Two topics:

**"Brother Oswin is alive. He's in the oratory."** — Edna acknowledges, asks player to relay a message.

**"What else do you need, Edna?"** — Edna asks player to check on Bram.

#### State 4 — Both seen — rubbing handoff topic surfaces

**📜 "I saw to them both."**

Opens with (rephrased v61an — the earlier "you only had to stand over him for me" line read menacingly):

> *"Thank you for going. Bram — no, you don't have to say it. I watched it from the window. Someone going to him was what I needed. I'll grieve him. Later."*

The follow-up triggers `questMidQuestGive` — Edna hands the charcoal rubbing, fires `receive_item` event. She delivers the context about the mirrored mark on her west wall and warns the player to wait until Aldwyn's office (door shut) before pressing him on the name.

### Brother Oswin — burned-state dialog

Five free-standing topics: what happened (incl. the unnamed Glenn child through the door), whether he's hurt, whether he'll stay, why he didn't fight, the sigil-corruption warning for Aldwyn.

**Q7 opener is state-aware** (v61an): injected via `buildQuestTopicsForNPC`, not baked into the static topic list. Two variants:

**If Edna already seen** — topic: *"Edna sent me to check on you."*
(Oswin confirms Edna's alive and asks player to relay a message.)

**If Edna not seen yet** — topic: *"I came to see if you made it."*
(Oswin expresses worry about Edna and asks player to check on her next.)

The signature warning he asks the player to carry to Aldwyn:

> *"It wasn't a binding being strained. It was a binding being edited."*

Sets up Act II dungeon-state content. He won't name which Glenn child died through the door:

> *"Her name belongs to her mother to speak first."*

---

## Bram body — interact text

### First press — flavor text, fires `read_corpse` event for Q7 obj 1

> *"He's gone. A goblin's axe is still in his hand. The forge behind him is a ruin."*

(After first press, the prompt switches to "Press E to loot" and the second E opens the loot panel containing The Forge-Man's Hammer.)

### Interact prompt text

- **First read:** "Press E to see to Bram"
- **After first read:** "Press E to loot"

---

## Varek — first meeting at The Ashfeld

He meets the player at **The Ashfeld** — an ancient battlefield between Ashenmoor and Redwater Ford, flat and overgrown, strewn with weathered remnants of two armies. He comes here regularly. There is a worn path through the grass to where he stands. When the player arrives he is not waiting dramatically — just looking out at it.

### His opening

> *"Two lords. Different banners, same appetites. The histories call it the Border Conflict of — some year nobody remembers. The people who died here didn't know what they were dying for. The people who sent them here knew exactly, and didn't come themselves."*

### His argument — three beats

**1. The diagnosis.** Feudal power described with exhausted clinical clarity, not anger. He is past anger.

**2. The personal cost.** Detachment drops for a moment.

> *"I did not want to be the one who does this. I want you to know that."*

**3. The invitation.** Genuinely open question.

> *"If you could keep one thing exactly as it is, what would it be? I'm asking seriously. I've been asking that question for two hundred years and the answers still surprise me."*

### His strongest line — when the player confronts him about Ashenmoor

> *"Forty-three people died in Ashenmoor when the binding broke. I know their names. I will know their names until I die — and I intend to die knowing them. That number will be smaller than the number who live full lives in the world I am building by a factor I cannot calculate but know to be true. I am asking you to tell me that arithmetic is wrong. Not that it's cruel. I know it's cruel. Tell me it's wrong."*

### As the player leaves

> *"Aldred would have liked you. He was also someone who kept moving toward the difficult thing."*

The only time he refers to himself by his old name. He doesn't notice he did it.

---

## Varek — Act II encounter (meta-awareness articulation)

His closest spoken attempt to articulate what he senses about the player. Surfaces in Act II.

> *"Everyone I have ever met has been shaped by this world. Pushed here by hunger, pulled there by love, formed by ten thousand causes they didn't choose. You have causes too — I can see them. But there is something else behind them. Something that chose to be here. I have been trying to understand what that is since the first time I watched you."*

He never gets closer than that. He doesn't need to. The player knows exactly what he's describing.

---

## Varek — final monologue (Act III revelation)

The final confrontation ends not with combat victory but with a moment of genuine cosmic horror for Varek. Everything he has spent 250 years building his identity on collapses in a single moment of clarity.

He was trying to play god. He was dealing with something that was actually a god, from his frame. Something that exists outside his realm of space and time entirely. Not bound by the same rules. Not subject to his arithmetic. He never had a hope of stopping it, controlling it, or fully understanding it. It was never in danger. The dungeon was never a challenge. The whole game was, from a certain angle, a Sunday afternoon.

And now it is over, and there is no one left who cares enough to drive the change he sought. The one being he ever met who existed outside the world's rules was just passing through.

### The monologue

> *"I thought I understood what was underneath. The logic beneath the stone. I spent two hundred and fifty years learning to read it. I was proud of that. I want you to know — I was genuinely proud."*

> *"And then I watched you walk through it like it wasn't there. Like the walls were suggestions. Like the rules were someone else's rules."*

> *"You were never in danger. Not really. Were you."*

— *a long pause* —

> *"I built my entire life on the belief that I was the deepest thing in this world. That if I could just get far enough down, I would find the place where things could be changed. And you came from further down than that. You came from a place I don't have a name for."*

> *"I don't know if you can hear me the way I hear you. I don't know if any of this means anything to you at all. But I want to say it anyway."*

> *"I was wrong about the arithmetic. Not about the cruelty — the cruelty is real, I stand by every word. But I was wrong about what I was. I thought I was the variable that changed everything. I was just... a very determined piece of the puzzle. Weren't I."*

> *"Tell me — wherever you come from. Does it get better? For them, I mean. The ones I was trying to help."*

— *he doesn't wait for an answer. He already knows you can't give one he'd understand* —

> *"It doesn't matter. Go home. You've done what you came to do."*

---

## NPC quotes about Varek (the Vader Effect)

Nobody connects the two names. Aldred is legend — not living memory, but stories passed down. Varek is a rumor in patrol reports, whispered in context of dungeon activity worsening. The player assembles the connection themselves over the course of Act II. When the reveal lands, it is earned.

### Edna (Q2, early game)

> *"There was a man — Aldred, the stories call him. This was long before my time, long before my mother's time. He went deeper than anyone. He came back different each time, the stories say. I found something in the deep chambers that made me think the stories were true. That whatever he became is still down there. I said nothing. I am saying it now."*

### Bram (after Ashenmoor falls)

> *"My father spoke of Aldred. Said he healed three children in this village without asking a coin. Said he had a way of looking at things like he could see through them. I used to think that was just an old man's exaggeration."*

*(Note: this line was originally written for Aldric — the blacksmith renamed to Bram in v58. The line transfers cleanly given Bram's family roots in Ashenmoor and his cultural inheritance from his father.)*

*(Note: Bram dies in the burn. This line as written is from Act I before the burn. Adapting for Act II-survivor delivery would require a different speaker — possibly Edna, or a delayed-discovery moment via Bram's effects in his ruined home.)*

### Aldwyn (mid Act II)

> *"The entity referred to in the patrol reports as Varek... I have a theory about his origin I am not yet prepared to share. What I will tell you is that the sigil degradation follows a pattern. A deliberate one. Someone with intimate knowledge of how the binding works has been taking it apart, piece by piece, for at least a hundred and fifty years."*

### Corwin (Act II, after what he saw)

> *"I saw his face. Down there in the dark, after Ashenmoor burned. He looked at me like he knew me. Like he was sorry. He said one thing before he turned away: 'tell them Aldred sends his regrets.' I didn't understand it then. I'm starting to."*

The player is the first person Corwin has told. The name *Aldred* means nothing to them yet — but it means everything to Edna and to Bram's family history.

---

## The List — discovery prose

The player finds it late Act II. Not a dramatic reveal — a piece of worn paper in the place where he has been staying. No music cue. Just paper and handwriting that got worse over time, in a script that a scholar would date to over two centuries ago.

Thousands of names. The handwriting at the top is neat and careful. By the bottom it is barely legible — not from age, from the weight of writing the same kind of entry over and over. The last entry is **Ashenmoor**. He left space below it.

(Implementation note: the discovery can be physical — found object in a player-explorable space — or environmental — the page sits on a desk in a small lit room. The player picks it up. There is no quest update. There is no journal entry. The list is just there, and the player closes the inventory item and the moment is over.)

---

## Q1–Q6 readyText / completeText (v61d3)

12 first-person reflective passages in the Q7 voice. Each quest gets a readyText (fires when objective completes; "Quest Updated" popup) and completeText (fires after NPC turn-in; "Quest Complete" popup). Cadence callbacks across the set — most readyTexts end on a "Walking now / Walking up / Back to the forge / Back to the Royal Herald's" transition phrase mirroring Q7's *"Ironhaven, then. Aldwyn's office. The door shut."*

### Q1 — First Blood (Bram, kill 5 in Shadows → Iron Sword)

**readyText:**
> *"Five down in the Shadows. Skeletons mostly — the sound they make when they go is dry like splitting kindling. Back to the forge."*

**completeText:**
> *"Iron Sword from Bram. Clean-forged, his own hammer on it. Heavier than what I came in with — sits right. He pointed me at Edna in the south cottage. Said she's been sitting on something about the Shadows for thirty years."*

### Q2 — Strange Markings (Edna, touch sigil on Shadows F2 → Greater Potion ×2)

**readyText:**
> *"The mark on the second floor is real. I put my hand on it and came up holding a spell I didn't have when I went down. Edna said come back when I'd seen it. Walking now."*

**completeText:**
> *"Edna was an adventurer once. Three dungeons in her youth. She saw markings on the deep walls in a script that felt deliberate. She kept it for thirty years because she didn't know who to tell. She thinks things are getting worse faster than they should. Find Corwin — the trader, east side. He keeps company with mages in bigger towns."*

### Q3 — The Merchant Knows (Corwin, talk to Aldwyn → Of Binding Stones)

**Note:** Q3 uses customActiveDialog → questDialogComplete which bypasses the 'ready' popup queue. The readyText is data-only — written for canon completeness but never surfaces in-game. The completeText IS shown.

**readyText (data-only):**
> *"Edna's account in my head, word for word. Ironhaven by the next bell. Aldwyn at the Royal Herald's, Corwin said. The man who'll take it seriously."*

**completeText:**
> *"The marks aren't decorative — they're binding inscriptions. They hold whatever's inside the dungeons in place, and they're failing. Aldwyn calculates one season before the containment breaks. He sent me to the Crypt of Embers next to confirm the state of those sigils. Touch nothing, he said."*

### Q4 — The Crypt of Embers (Aldwyn, touch sigil on Embers F2 → 150g + 350xp)

**readyText:**
> *"The sigils at the Crypt are damaged. Not weathered — chipped, cracked, OVERWRITTEN. New strokes cut on top of the original work, fresh enough the dust hasn't filled them. Aldwyn needs to see what I saw. Walking back to Ironhaven."*

**completeText:**
> *"Months, not centuries. Aldwyn says someone is down there working — making the bindings fail faster. He's bringing it to Lord Caldric tonight. Captain Brynn at the gatehouse will have orders for me by morning."*

### Q5 — Lord Caldric's Commission (Brynn, kill 8 on Tide F2 → tier-4 cuirass)

**readyText:**
> *"Eight clear on the lower floor of the Tide. Brynn said clear, don't chase. The water down there isn't moving the way water does. Walking up."*

**completeText:**
> *"Heavy cuirass from the gatehouse stores. Brynn said it belonged to one of Caldric's sworn men, who no longer needs it. Survey team deploys tomorrow. Aldwyn wants to see me — Royal Herald's office, same as always. He has something bigger than this. Don't keep him waiting, she said."*

### Q6 — The Binding Stone (Aldwyn, kill 20 in Ironhaven dungeons → Aldwyn's Seal)

**readyText:**
> *"Twenty across the Ironhaven dungeons. Aldwyn said the pressure had to drop while he put the next move together. Done. Back to the Royal Herald's."*

**completeText (two paragraphs, mirroring Q7's structure):**
> *"The three sites are one binding. Shadows, Embers, Tide — fragments of a single inscription, split between three anchor points. Someone has been working at it for a long time. Aldwyn pressed a wax seal into my hand without explanation. Royal Mage corps. Carry it always, he said."*
>
> *"And — a rider came in from the South Road an hour ago. Smoke on the horizon. Ashenmoor direction. More than a hearth fire. Aldwyn says probably a stubble burn run late. He told me to go home first. Before anything else."*

---

## Caldric Safehouse grant scene (v61d6)

Auto-fires on the first dialog with Lord Caldric while the player is commissioned (Q7-complete) but hasn't yet been granted the safehouse. Skips the regular greeting + topics. Resolves via `c.grantSafehouse:true` on the final closer, which flips `worldState.safehouseGranted`, persists save, emits journal log entry "🔑 Lord Caldric granted you the safehouse." Subsequent visits fall through to standard Caldric topics.

**Restrained register throughout** — Caldric is a pragmatist who says what he means rather than implying it. Slow, weighty voice (David, rate 0.85, pitch 0.75). Asset-framing tilt is plant-only, not surface — the Aldwyn-vs-Caldric Act II conflict is set up via word choices, not declarations.

### Brynn relay topic (surfaces post-Q7, pre-grant)

Lives in `buildQuestTopicsForNPC` outside the QUEST_DEFS forEach since it's purely worldState-driven. Disappears post-grant.

**Topic label:** *"You called for me?"*

**Brynn:**
> *"Lord Caldric wishes to see you. Now would be appropriate. Through the gatehouse, across the courtyard, the door at the back. The guards will not stop you — you are listed."*

### Caldric's opening monologue (4 paragraphs)

> *"You are the one Aldwyn signed for. Sit, if you want. Stand if you prefer. I will not keep you long."*
>
> *"I have read the rubbing. I have read the Mark — Aldwyn's transcription of what he is willing to commit to paper, which is not all of it. I have read his commission, which I countersigned in the small hours of yesterday because he came to me in the small hours of yesterday. He does not do that often."*
>
> *"There is a question I do not yet have an answer to. There is a man who has been doing this work for two centuries, and whatever he is doing matters more than anything else this office has dealt with in my lifetime. I cannot send a regiment after him. I cannot send a herald. I have sent a young scholar who would not have come back, and I have sent two soldiers who did not come back. I am, at present, sending you."*
>
> *"Aldwyn frames this as a scholarly matter. It is a scholarly matter. It is also other things."*

### Branch A — *"What other things?"* (asset framing engaged)

**Caldric:**
> *"It is a question of who acts when nothing official can act. The capital has not answered three ravens. Aldwyn writes letters that do not move policy. You are not a soldier and not a scholar and not under the academies' jurisdiction. That is — usefully — what you are. I am being plain because I respect you enough to be plain. Now, here."*

(continues into the gift announcement)

### Branch B — *"I understand."* (subtext accepted quietly)

**Caldric:**
> *"Yes. I think you do. Now, here."*

(continues into the gift announcement)

### Gift announcement (both branches converge)

> *"There is a house in the south-west of the town, near the chapel. Modest. Burgundy door, you cannot mistake it. It belonged to a sworn man of mine who fell at the Vault of the Tide. His widow has been at the capital for two years and has, with my help, been re-housed. The deed has been transferred to your name. The key is in the lock; the lock answers to no other key in this town."*
>
> *"This is not lodging. This is yours. There is a bed in it, and a chest, and the chest is the only one in the Reach that I will guarantee against my own household. Use it."*

### Player closer (resolves the scene)

**Player:** *"My thanks, Lord Caldric."*

**Caldric (closing line — single most pointed Act II setup beat):**
> *"Thank Aldwyn. He is the reason I am giving you a house instead of a contract. I prefer contracts. He persuaded me you respond better to trust. We will see if he is right. Go. Brynn will not detain you on your way out."*

### Door-locked prompt (pre-grant)

Shown both as proximity prompt and as toast on E-press.

> *"Locked. Lord Caldric has the key."*

### Continuity note — the widow

The line *"His widow has been at the capital for two years and has, with my help, been re-housed"* establishes a specific in-fiction history for the safehouse. Read together with Brynn's Q5 reward speech — *"this belonged to one of Caldric's sworn men, who no longer needs it"* — the donated cuirass and the donated house come from the same fallen soldier. Tightens the continuity; Q5 → safehouse arc has a single backstory thread.

---

## Outpost vendors (v61e1)

The Thorngate and La Porte Grise outposts each ship with one keeper-NPC: a road-warden and a royal quartermaster. Designed as a contrast pair to encode the lore canon's three-register naming system into NPC voice.

### Warden Edwin (The Thorngate, Road-Warden)

Anglo-Saxon-coded commoner register. Voice: dry, observant, posted-too-long.

**Outdoor dialog topics** (NPC Edwin standing in the courtyard near his door):
- *"Browse your wares."* → opens shop directly (`outpost_warden` stock; same as the indoor browse).
- *"What is this place?"* → "A watchpost. Six of us when I came up. Three now. We log what comes south out of the forest and what goes north into it. Mostly we count our own boots."
  - Follow-up *"Anything come south lately?"* → "More than used to. Wolves further from their territory. A pair of trolls a fortnight ago — turned at the gate, didn't press it. That's the part I don't like. Trolls don't usually decide."

**Greeting (one of three rotates) — used both outdoor and indoor:**
- "You came up the south road. Anyone behind you, or just you?"
- "The thornbush is winning. Watch your sleeves on the way through."
- "Posted here eleven years. They forget to rotate me out. I've stopped reminding them."

**Indoor dialog (interior keeper-NPC inside Edwin's Watch — the SHOP_DIALOG entry; this is where the shop browsing works):**
- *"Browse your wares."* → opens shop directly (`outpost_warden` stock).
- *"What is this place?"* → same response as outdoor, with the same "trolls don't usually decide" follow-up.
- *"Tell me about the Deepwood."* → "You'll feel the sound change about fifty paces past my gate. Birds first, then your own footsteps. Some folk find it peaceful. Most don't. The road's marked but if you wander you'll wander a long way."
  - Follow-up *"Anything I should avoid?"* → "The Standing Stones west of the road. Don't stop there at dusk. I'm not telling you a story — I'm telling you what the patrol logs say. Two of mine sat down to rest there. Only one of them stood back up."

### Quartermaster Roland (La Porte Grise, Royal Quartermaster)

Norman-French-coded institutional register. Voice: formal, careful, professional pride about a small posting.

**Outdoor dialog topics** (NPC Roland standing in the courtyard near his door):
- *"Browse your wares."* → opens shop directly (`outpost_quartermaster` stock; same as the indoor browse).
- *"What is this place?"* → "A border post. Quartermaster's office, a half-section of guard, a cellar that's a cellar in name only. The road is officially the king's; in practice it's Lord Caldric's, and he's reasonable."
  - Follow-up *"Records of what?"* → "Who comes through. What they carried. Whether they came back. Patterns, mostly. The patterns have not been encouraging this season."

**Greeting (one of three rotates) — used both outdoor and indoor:**
- "Papers? No, no — I see you're not carrying anything sealed. State your business briefly, then."
- "Welcome to La Porte Grise. The road behind you ends here; the one ahead is Ironhaven's. Mind the difference."
- "Through the forest, I take it. Sit if you need to. The bench is the only courtesy I extend without paperwork."

**Indoor dialog (interior keeper-NPC inside The Quartermaster's Office — the SHOP_DIALOG entry; this is where the shop browsing works):**
- *"Browse your wares."* → opens shop directly (`outpost_quartermaster` stock).
- *"What is this place?"* → same response as outdoor.
- *"What does Ironhaven need to know?"* → "That my logs show fewer travellers returning than departing, and that the ones who do return are quieter. I send the numbers up weekly. Aldwyn reads them; whether anyone above him does, I can't say."
  - Follow-up *"You report to Aldwyn?"* → "To his office. He's the Royal Herald — that's the formal channel. He treats my numbers seriously, which is more than the previous officeholder did. Tell him Roland sends regards if you see him. He'll know I mean it."

**Authoring note:** outdoor and indoor browse-wares topics both work directly as of v61e2 (the resolver recovers `currentHouse` from `ZONES[activeZoneId].houses` by keeper-name match when null). The split is now writerly, not a workaround: each keeper-NPC's *deeper* topics are intentionally indoor-only. Roland's "What does Ironhaven need to know?" / Aldwyn-relationship beat is something the player should have to step inside to hear — matches the "papers, please" register of La Porte Grise. Edwin's Standing-Stones patrol-log warning likewise belongs to the indoor register, where the warden has set down his post duties and is talking. Outdoors is the courtyard exchange; indoors is the conversation.

---

## Carraig Mór — Áine the Elder (v61e3)

Carraig Mór's signature NPC. Drafted in v61e3 alongside the coastal arc regional identity work. Voice locked here; build wiring deferred to a paired follow-up session that will also stand up Salthaven's signature NPC.

Áine is **not a quest-giver** in this draft. She is a fixed-point lore character — anytime-walkable, no quest hooks, deeper conversation than mechanical purpose. She is the Irish-register seam in the world: Aldwyn studies the language; Áine *is what your grandmother sounded like*. Touching her matters when the player is far enough into Act II to feel the difference.

### Áine (Elder of Carraig Mór, Zira, rate 0.92, pitch 1.05)

**Greeting (one of three rotates):**
- "You came down the cliff road. The wind hasn't found you yet — you're new."
- "Sit, if you like. The bench is cold but the rock under it has held warmer."
- "Outsiders come three or four a year. You're this year's third. The other two went home."

**Introduction response (when player introduces themselves by name):**
"Áine. The first half of my name is the same in your tongue and mine — *aw-nyeh*. The other half has been mispronounced for so long I no longer correct it. Welcome to the rock, {NAME}."

**Outdoor / indoor topic split**: Áine's keeper-house is a sea-rock cottage; the deeper topics (the Mouth, her brother) are intentionally indoor-only — they are conversations, not exchanges. The greeting + lighter topics work outdoors at her courtyard.

**Outdoor topics:**
- *"Tell me about Carraig Mór."* → "The rock was here before the village. The village will be here after the rock forgets it. We are tenants. We pay rent to the wind by staying outside in it, and we pay rent to the sea by losing one of ours every winter, on average. It is a fair arrangement and we do not complain."
  - Follow-up *"Who built it?"* → "People who didn't write things down. Their bones are in the wall behind you, in the lower courses. We don't disturb them. The rest of you build cemeteries; we build *with* our dead."
- *"Who keeps order here?"* → "No one. We agree, mostly. When we don't, we send someone to Salthaven for the week to think about it. By the time they walk back, they've usually decided."
  - Follow-up *"No lord?"* → "Lord Caldric writes us letters once in a while. We read them. They are good letters. We do not reply. He has stopped expecting us to."
- *"Goodbye."* → "Mind the tide on the way back."

**Indoor topics** (when the player has stepped inside her cottage):
- *"What is the Mouth?"* → "*Béal an Domhain.* The world's mouth. There is a cave in the rock below the village; the sea goes in and the sea comes out, but not the same water. My grandmother — her grandmother — said you don't whistle near it. I don't know why. I have not whistled near it."
  - Follow-up *"Has anyone gone in?"* → "Yes. Four that I know of in my lifetime. Two came back. They didn't say much. One of them was my brother. He spoke a different way after, and he died young. Not from anything you could name."
- *"Tell me about Carraig Mór."* → same as outdoor.
- *"Goodbye."* → "Mind the tide on the way back."

**Notes for the build session that wires her in:**
- Keeper-house should sit closer to the seaward edge of the village than to the road gate — the player walks *past* her to get to the Mouth, so encounters with her happen on the way back, after the dungeon. Reinforces her as a fixed point the player returns to.
- House interior should be visibly older than other interiors — stone walls instead of timber, smaller windows, a hearth that's clearly seen four hundred years of use. Not a quest-giver shop; her interior is a place to sit. No `trade:true` topic.
- Dungeon name in-world: she calls it "the Mouth" when speaking to outsiders, *Béal an Domhain* only when the player has earned the depth (e.g. having touched a sigil somewhere first, or having heard the term elsewhere). The split is meaningful — her Irish names are gifts, not signage. **Implementation hook:** could be a worldState flag check (`worldState.sigilTouched > 0` or similar) gating the Irish-register form.
- Voice direction: Zira at slow rate. Pauses between sentences. The "we do not complain" / "I have not whistled near it" lines are dry, not bitter. The brother beat is unaccented — she has carried it for fifty years and is past the part where it costs her to say.

---

## Salthaven — village fleshing-out (v61em, Session 35)

Salthaven gets four named NPCs, a notice board rewrite, and an examinable shrine. The signature character is **Hilda the Harbormaster** — Salthaven's institutional memory, the way Áine is Carraig Mór's. The other three (Wystan / Aelflin / Brand) are bland-by-design working-class shopkeepers who give the village texture without lore-load. Aelflin carries one quietly seeded line that rhymes with Áine's "Salthaven elder she hasn't spoken to in fifteen years" canon.

Voice register across the village: Anglo-Saxon, working-coast, dry. Salthaven is the *commercial* coastal village (catch goes east, rope goes east, salt comes back) — Carraig Mór's *opposite number* in the coastal arc. Where Carraig Mór is ancient and pays rent to the wind, Salthaven runs ledgers and complains about the dock planks.

### Hilda (Harbormaster, Zira, rate 0.95, pitch 0.92)

**Greetings (rotate):**
- "Wind's southerly. Means three things, none of them good. What's your business?"
- "In off the West Track, then. We don't get many of you. Mostly traders going the other way."
- "You'll want to mind the dock — boards are old. Office is on your right, if it's me you've come to see."

**Introduction response:**
"Hilda. Harbormaster forty years next winter, if I last that long. {NAME} — that's a name from the south road. We don't get many south-road names this far west. You're welcome here regardless."

**Topics:**
- *"Tell me about Salthaven."* → "A working harbor. Twelve boats out most days, fewer if the weather's wrong. Catch goes east — Coeur de Vie pays well enough for what they call quality. The rest stays here, gets salted, gets sold. We are not Carraig Mór and we do not pretend to be. They built their houses out of the rock; we built ours out of the wages."
  - Follow *"What's the difference?"* → "Carraig Mór is older than the kingdom. Salthaven is older than my grandmother. That's the difference. They have stories we don't have, and they don't tell them to us, and we have stopped asking. We get on. We trade rope. We do not visit each other's dead."
- *"Browse your wares."* — `harbor_office` shop (civic/institutional stock — maps, oilcloth, lantern oil, common potions; the goods of a working harbor office).
- *"Goodbye."* — "Mind the dock."

**Voice direction:** institutional warmth — not unfriendly, just past being surprised by anything. Pause-driven delivery. The "we do not visit each other's dead" line is flat, not pointed.

### Wystan (Salt House, David, rate 1.00, pitch 1.00)

**Greetings (rotate):**
- "Salt's salt, mate. What're you after?"
- "Mind the barrels — that one's leaking and I haven't got round to it."
- "Came in from inland, did you? You'll want oilcloth before you go anywhere on these roads."

**Introduction response:**
"Wystan. Run the Salt House — me and my brother before he went east. {NAME}, eh. Tell you what, you carry that name around and people remember you. Mine, they forget by morning. Suits me fine."

**Topics:**
- *"What goes east from here?"* → "Catch, mostly. Salted, smoked, packed. Nobles in Coeur de Vie pay through the nose for what they call 'fresh from the western coast' — by which they mean six days dead and salted to leather, but who am I to argue. Also rope. We send a lot of rope."
- *"Browse your wares."* — misc shop (salt, oilcloth, twine, dried fish, a few common potions, torches).
- *"Goodbye."* — "Mind your salt."

**Voice direction:** broad, working-class Anglo-Saxon. Talks while doing other things. Slight rasp.

### Aelflin (Net-Mender's Cottage, Zira, rate 0.92, pitch 1.10)

**Greetings (rotate):**
- "Come in, come in. Mind the cat. He's old and he's mean about it."
- "You're tall. Stoop a bit at the door — the lintel won't forgive you."
- "I was just sitting. Don't worry, I'm always just sitting. What can I do?"

**Introduction response:**
"{NAME}. Lovely to meet you, dear. I'm Aelflin. Well — that's what they call me here. Had another name before I came up the coast, but it's been so long I almost forget it myself. Sit, if you've a moment. I have salves if you need them."

**Topics:**
- *"You came up the coast?"* → "Long time ago, dear. Had a sister down south then. Haven't spoken in — oh, fifteen winters? Sixteen? Time goes funny when you stop counting. She had her stones, I had my road. We chose."
- *"Browse your wares."* — potion/herb shop (folk-magic register; herb-tinctures, salves, low-tier potions, mended cloth).
- *"Goodbye."* — "Mind the steps, dear."

**Voice direction:** soft, warm, a little tired. Edna-adjacent register but less unsentimental — Edna would never call anyone *dear*, Aelflin does it constantly. The "her stones / my road / we chose" rhythm is deliberate; lands the Carraig Mór connection faintly without underlining it. *"Stones"* is the seed — readers who know Áine's bones-in-the-walls canon will catch it; everyone else hears old village talk.

**Lore note (canonical, do not pay off in dialog yet):** Aelflin is plausibly the Salthaven elder Áine references in her own dialog — "Salthaven elder she hasn't spoken to in fifteen years." Neither character names the other on-screen in this session. The connection is seeded for a later beat that may or may not earn its way into the game.

### Brand (Anchor Inn, David, rate 1.02, pitch 0.95)

**Greetings (rotate):**
- "Bed's two coppers. Stew's three. Both for four if you've a sword to leave at the door."
- "Come in. Fire's lit. The other bed's free if you don't mind the snorer."
- "You're dripping. Hang the cloak by the fire — it'll be ready before you are."

**Introduction response:**
"Brand. Anchor Inn's mine, has been since I came off the boats. {NAME} — sit if you want to sit. I'm not going to ask where you've been."

**Topics:**
- *"Off the boats?"* → "Twelve years on the eastern run, four on the southern, two in places I won't name. Came back here because my mother was dying and I'd been gone too long to argue with her about it. Stayed because someone had to run the inn after my brother stopped being able to. That's the whole story. Don't ask about the hook."
- *"Browse your wares."* — inn shop (hot stew, mulled cider, rations, a few common potions, a torch).
- *"Goodbye."* — "Mind the road."

**Voice direction:** lean, dryer than Wystan, easy in his body. Says less than he could. The closing line of his lore topic — *"Don't ask about the hook."* — is the deliberate hook in itself. The player cannot follow up. There is no dialog branch that leads to the hook's story. Whether one ever lands is open; for now the line stands as a closed door the player notices.

### The Sea-Folk Shrine (sh4, examine prompt)

Open-walled shrine of weather-grey wood at the south end of the harbor. No NPC, no shop. Approachable from the dock side.

**On approach prompt:** *"Press 'E' to examine the shrine."*

**On examine — popup text:**
"A small open-walled shrine of weather-grey wood, set back from the dock. The platform inside is worn smooth by knees. Coins — copper, mostly, a few silvered — cluster in the offering bowl. Beside them: small carved fish, a button, a scrap of red ribbon. Sailors' luck, paid forward."

**Lore note:** Salthaven's folk-religious register. Practical, sailor-coded. Distinct from Brother Oswin's institutional Christian register at the Ashenmoor Oratory and from Carraig Mór's bones-in-the-walls deep practice. This is the *common* register of small-coastal-village faith — the third corner of Act I's three-register religious geography. No mechanical effect; no offering interaction. Pure flavor.

### Notice Board

**Title:** Salthaven — Harbour Notice

**Body:**
> Salthaven harbour, with twelve registered boats, two unlicensed and one sunk last spring (subject of dispute). Catch sales handled at the Harbormaster's Office between dawn and the second bell. Weather warnings posted by Hilda, the day she finds them.
>
> Notices:
> - The dock's east end is condemned. A new plank is on order from Hearthwick. It has been on order since last summer.
> - Aelflin will mend nets for two coppers and a story.
> - If your boat is in the harbour and you are not, please remove it. (Harbormaster's office.)

**Voice note:** dry communal voice, clearly written by Hilda. The "two coppers and a story" line on Aelflin is the village's voice talking *about* Aelflin — small grace note that Aelflin is loved here.

---

## Carraig Mór — village fleshing-out (v61eu, Session 37)

Carraig Mór gets three voiced NPCs (Áine + minor characters Cuán and Maire), two examinable detailFn structures (Rock-Hall, Bone Lintel), and a south-side ferry replacing the prior empty south-gate placeholder. The signature character is **Áine the Elder** — Carraig Mór's institutional memory and the seam between the player's Anglo-Saxon-and-French education and the deep-Irish layer the binding actually speaks. Cuán and Maire are narrative-light shopkeepers who give the village texture without competing with Áine's lore-load.

Voice register across the village: Irish-coded names, Anglo-Saxon when speaking *to* outsiders, never *of* their own things. Where Salthaven runs ledgers, Carraig Mór tells stories — but the stories are not for sale and Áine is the one who decides what gets shared.

### Áine (Elder, Zira, rate 0.92, pitch 1.05)

Stands at the south end of the village near the Bone Lintel, looking out toward the strait — met outside in the open, not as a shop interior. Position: (28, 48) within the 60×60 zone.

**Greetings (rotate):**
- "Off the road from the south. You've come some distance to see a rock."
- "Sit if you want. The stone is warm where the sun has been on it."
- "We see one or two of you in a season. Not unwelcome. Not expected."

**Topics:**
- *"Tell me about Carraig Mór."* → "We are tenants. We pay rent to the wind by staying outside in it, and we pay rent to the sea by losing one of ours every winter, on average. The arithmetic is steady enough. The rock does not move; we do not move; the sea takes what the sea takes. That is the whole of it."
  - Follow *"Does the kingdom not reach you here?"* → "Lord Caldric writes us letters once in a while. We read them. They are good letters. He has a clear hand. We do not reply. He has stopped expecting us to."
- *"This place is old."* → "Old, yes. Older than the kingdom. Older than the words for kingdom. The rest of you build cemeteries; we build with our dead. The lower courses, the foundations — that is them. They are still part of the rock. We are tenants of them too, in a way. They do not seem to mind."
- *"What is below?"* → "Béal an Domhain. The world's mouth. My grandmother taught me not to whistle near it. I do not know what it is. I know it is there, the way you know there is weight behind your house when you lean on the wall. It does not need me to know more than that."
- *"Anyone come back?"* → "Two came back, once. They did not say much. One of them was my brother. He spoke a different way after. He died young. Not from anything you could name."
- *"Goodbye."* — bye.

**Voice direction:** slow, low, warm in a way that doesn't waste warmth. She uses Irish naturally for what's hers (***Béal an Domhain***) but shifts to Anglo-Saxon for the rest because she's speaking to an outsider. The brother-beat is the most narratively-loaded — she does not volunteer it; it requires the player to ask. Each line is delivered flat, not pointed. The "we build with our dead" line is a domestic fact, not a horror reveal.

**Lore-canon load:** all four topic responses carry locked lore beats from `lore_canon.md` § Carraig Mór. The bones-in-the-walls beat is canonically literal, not metaphor. The brother-beat establishes that *people who go deep into a still-functional anchor and come back are changed* — distinct from the antibody mechanic. Béal an Domhain is the in-canon name for the Mouth (sea-cave dungeon below the rocks); used only by Carraig Mór locals. Outsiders call it the Mouth (Anglo-Saxon vernacular); Aldwyn would call it an anchor place; the carvings inside don't call it anything because they predate the word for it.

### Cuán (Stone-Cutter, David, rate 0.95, pitch 0.92)

Outside his workshop in the NW of the village, position (18, 22). Anglo-Saxon vernacular but Irish-coded by name. Working tradesman.

**Greetings (rotate):**
- "Mind the chips. They go places you don't expect."
- "Came down from the north road. Long walk for what's here."
- "Tools are in the workshop. Talk fast or come back when I've stopped."

**Topics:**
- *"Browse your wares."* — armor shop (sparse stone-themed gear; pieces brought up from down south, fitted with chips of the rock).
- *"You're the smith here?"* → "Stone-cutter, mostly. We do not have a smith. What armor is in the village comes through me — bits brought up from down south, mended, fitted to whoever needs them next. The rock is not iron, but a piece of it set into a shoulder-plate will turn a blade well enough. Áine's grandfather started the practice. We have not stopped."
- *"Goodbye."* — bye.

**Voice direction:** pragmatic, brief, used to chips going places he doesn't expect. Talks while doing other things — Wystan-adjacent register but Irish-coded. The "Áine's grandfather started the practice" line quietly grounds the village's continuity through Áine's family without making it the topic.

### Maire (Tide-Singer, Zira, rate 0.92, pitch 1.10)

Outside her cottage in the SW of the village, position (22, 38). Folk healer, Irish-coded.

**Greetings (rotate):**
- "Set the door behind you, dear. The wind takes the warmth out fast."
- "You are not from the rock. I can tell by how you stand."
- "Sit, sit. Whatever you came for, it will keep a moment."

**Topics:**
- *"Browse your wares."* — potion/herb shop (folk-magic register; tinctures, salves, low-tier potions; no academy-coded elixirs).
- *"Tide-Singer?"* → "That is what they call us. We sing the tide out and the tide in — meaning we keep the count. Six minutes out, six minutes in, all the day and all the night. The young ones learn it before they learn their letters. It is older than reading."
- *"Goodbye."* — bye.

**Voice direction:** soft-voiced, warm, calls strangers *dear*. Aelflin-adjacent register but Irish-coded — would be insulted to be called an apothecary. The Tide-Singer beat lands the canonical "twice a day" rhythm in a living folk practice rather than as a stated fact.

**Lore note (canonical):** Maire's "six minutes out, six minutes in" is the in-fiction telling of the same 6-game-hour-cycle the tide system uses mechanically (low tide hours 0-6 and 12-18, high tide 6-12 and 18-24). The folk practice predates and outlives the system — the Tide-Singers were keeping the count before the kingdom existed.

### centerMarker

**Title:** Carraig Mór

**Body:**
> Irish: Great Rock. One of the oldest inhabited places on the map, predating all Anglo-Saxon settlements. Built into dramatic coastal rock formations. The people here answer to no lord.

### The Rock-Hall (cm3, examine — text deferred)

Open-walled stone pavilion in the NE plaza-edge, with a slate-pyramidal roof on four corner stone posts, a cold central fire-pit, and a stone tablet set into the eastern interior wall. The tablet carries the village's foundation register in carved Irish, partially weathered. **Examination prompt and popup text are pending a future writing pass.** Lore canon § Carraig Mór's open questions list (entry 16) flags this for return: a short Irish-then-English passage in Áine's grandmother's voice, agreeing with Áine's "we are tenants" register.

### The Bone Lintel (cm4, no examine prompt)

Threshold structure at the south edge of the village (z:53), framing the path to the south gate and the ferry beyond. Two upright stones with a horizontal lintel inset with five bone fragments. Two flat offering stones at the bases of the uprights. **No examine prompt** — the lintel is read visually as the player walks under it on their way to the strait. Lore canon § Carraig Mór covers the meaning: literal "we build with our dead" — the same practice that put bones in the village's lower foundation courses surfaces here as the threshold marker.

### The ferry — gate prompts (v61ew reframe)

Carraig Mór's south gate is no longer a fence-gate — the visible affordance is a moored ferry boat tied to the seaward end of a wooden dock. The 'tide' guard predicate is unchanged from the prior framing.

**E-press prompt (tide out, ferry available):**
> "Press 'E' to travel to Inis Rua"

**E-press prompt (tide in, ferry held):**
> "The ferry to Inis Rua is held by the tide."

**Toast on attempted travel at high tide:**
> "The strait is too rough for the ferry. The tide rises and falls — try again later."

**Voice note (gate prompts):** crisp, mechanical-but-honest. The prompt strings are not in any character's voice — they're the player-facing fiction. "Held by the tide" is the canonical phrasing now; "submerged causeway" is retired. Inis Rua's matching gate string + centerMarker + world-map description still say "causeway" at the time of v61ew ship, pending the Inis Rua spec session.

---

## Inis Rua — village fleshing-out (v61ey, Session 38)

Inis Rua gets two voiced NPCs (Niamh + Fionn), a north-side ferry dock mirroring Carraig Mór's south side, and an examinable Mouth (Béal an Domhain) — the canon sea-cave dungeon entrance, set into a built south-cliff face. The cave is visible and approachable but not yet a walkable dungeon; the WORLD_DUNGEONS hookup is held for an Act II story beat.

The signature character is **Niamh, the Keeper of the Mouth** — third-generation watcher of the cave entrance, whose mother spoke to Áine's brother (the canonical last person to come back out alive, fifty years ago). Niamh is the seam character on Inis Rua: where Áine carries Carraig Mór's elder-memory register, Niamh carries the dungeon-side register from the village that watches it. Fionn is a narrative-light fisherman who runs the village's harbor-supplies trade and quietly confirms the Salthaven → Coeur de Vie eastern catch-route by omission.

Voice register: same Irish-coded names/Anglo-Saxon-to-outsiders convention as Carraig Mór, but Inis Rua reads **lonelier, smaller, more cut-off**. Fewer people, plainer delivery, more stretches of "this is what happens here" said flat. The horror beats (the man whose words could not be carried, the woman who walked into the strait) are not pointed — they are the village's working register.

### Niamh (Keeper of the Mouth, Zira, rate 0.95, pitch 1.00)

Stands outside on the path to the Mouth, near the south cliff at position (32, 46) within the 60×60 zone. Player walking from the dock through the village center to the cave passes her; she does not approach. She faces toward the cave, not the village.

**Voice direction:** Younger than Áine — somewhere in her forties, but not young. Speaks like someone who has had the same conversation with the sea every day for thirty years. Doesn't waste words. Watches the player's face when she answers, not their hands. Where Áine is *the elder who remembers*, Niamh is *the one who watches now*. The role is hereditary work, not a priestly calling — there is no mysticism in her register. The Mouth is her job. She doesn't think it's holy; she thinks it's awake.

**Greetings (rotate):**
- "You came across with the tide. Most do not bother."
- "Stand where you are a moment. The wind off the mouth pulls strangers toward it."
- "I watched the boat come in. You walk like someone with a question."

**Topics:**

- *"What do you do here?"* → "I keep the Mouth. My mother kept it before me, and her father before her, and back further than the names hold. We do not go in. We watch what comes out, and we count what does not. That is the work. It does not pay; the village feeds us."
  - Follow *"What comes out?"* → "Mostly nothing. Wind. Salt. Sometimes a sound that is not a sound — you feel it in your teeth before you hear it. Twice in my life, a creature. Once a man, who was not a man when he came back out. The tide carried him away. We did not stop it."
- *"Why is the island called red?"* → "The rock has iron in it. When the rain comes hard the runoff stains the shore. In the autumn it looks like the island is bleeding out into the strait. The old people on the rock — Carraig Mór, where you came from — say it is the island remembering something. We do not say that. The rock has iron. The rain comes."
- *"The people here — they answer to no one?"* → "We answer to the tide. That is enough authority for a place this small. The ferry crosses when the sea allows. Letters from the mainland do not reach us — there is no post. Visitors come twice in a year, on average. Three this year, counting you. The other two were lost."
  - Follow *"Lost how?"* → "One went into the Mouth. We told her not to. The other walked out into the strait at low tide and kept walking past where the water comes back. We do not stop people from doing those things. We have learned what stopping costs."
- *"Has anyone made it back from the Mouth?"* → "Some. Not many. A man came out fifty years ago, before I was born — he was Áine's brother, on the rock. You may have heard her speak of him. He was the last one who came out alive. He was not the last one to go in. We have been watching the entrance since, in case another one comes. None has."
  - Follow *"What did her brother say?"* → "I do not know. He spoke to my mother once and she would not repeat it. She said the words were not wrong, but they should not be carried. She died with them. I have made my peace with not knowing."
- *"Goodbye."* — bye.

**Lore-canon load:**
- The Keeper-of-the-Mouth tradition: hereditary, pre-naming-records, plainly carried. Establishes a parallel institution to Áine's family-on-the-rock at Carraig Mór — both villages have multi-generational continuity tied to the binding through different angles (memory vs. watch).
- The iron-rust origin of "Red Island": canonized in plain register. Explicitly NOT mythic — Niamh distinguishes her village's reading from Carraig Mór's, "the rock has iron. The rain comes." The new `rust_stone` ground texture is the in-fiction realization of this beat.
- The "fifty years ago, Áine's brother" line ties Niamh and Áine into a single shared memory across two villages. Áine remembers her brother from family; Niamh remembers him from the work. Niamh's mother spoke to him — extending Áine's brother-beat from "my brother spoke a different way after" into the Keeper line via "the words were not wrong, but they should not be carried." This is the heaviest single line in the village.
- The two lost visitors this year: a domestic horror beat. The woman who went into the Mouth and the man who walked into the strait — both stated flat, no follow-up asked, no apology offered. Establishes Inis Rua's canonical "we have learned what stopping costs" register and seeds future encounter content (a body in the strait? a presence in the Mouth wearing her shape?).
- The "we have been watching the entrance since, in case another one comes" line is a quiet hook — when the player eventually goes into the Mouth and comes out, Niamh is the canonical NPC who notices.

### Fionn (Fisherman, David, rate 0.95, pitch 0.95)

Outside his shed in the NE area at position (35, 22), sorting through nets. The "rope on the path" prop near the dock is an environmental nod to his greeting line about not having coiled it.

**Voice direction:** Old, weather-cracked, dry. Not unfriendly — just done explaining things. Brand-adjacent (Salthaven's innkeeper) in the sense of "former sailor, says less than he could," but Irish-coded and without the closed-door beat. Fionn has no secret. He just doesn't talk much.

**Greetings (rotate):**
- "Tide brought you in. Tide will take you back."
- "Good crossing? It was a fair one. We have had worse this season."
- "Mind the rope on the path. I have been meaning to coil it for a week."

**Topics:**

- *"Browse your wares."* — `harbor_supplies` shop type (salt, dried fish, hooks, line, oilcloth, low-tier potions, rope).
- *"You fish from here?"* → "From the rocks on the west side, mostly. Strait is too rough most days for the small boats — the ferry goes out only when the tide is fully out, and that is not many hours. The big catch goes east from Salthaven. We feed ourselves. Sometimes a little extra to trade with Carraig Mór for stone-work."
- *"What's it like to live here?"* → "Quiet. Wet. The kind of quiet you have to grow into. The rock is not a place you arrive at and stay — most who come stop coming back. The ones who stay were born here. I was not. I came up from Salthaven forty years ago. I have stopped explaining why."
- *"Goodbye."* — bye.

**Lore-canon load:**
- The Salthaven → Coeur de Vie eastern catch-trade route confirmed by *omission* — "the big catch goes east from Salthaven. We feed ourselves." Inis Rua is too small and too cut-off to participate; the fish go to Salthaven for processing and east from there. Quietly grounds the trade-route hierarchy without forcing it.
- The "I came up from Salthaven forty years ago. I have stopped explaining why." line is a soft echo of the Aelflin/Áine sister-beat structure — coastal characters with a history elsewhere on the same arc. Different generation, different reason; pays nothing off; just sits as register. (No canonical link to either Aelflin or any specific Salthavener; he's his own line.)

### centerMarker (replaces v61d7 placeholder)

**Title:** Inis Rua

**Body:**
> Irish: Red Island. A small tidal island west of Carraig Mór, reachable only when the tide is out. Fiercely independent — too small for a lord's reach, too isolated for the kingdom's records. Has exactly one dungeon entrance: a sea-cave at the southern cliff that locals call the Mouth, and that the Keeper has watched every day of her life.

### The Mouth (examine, lore-load-bearing)

When the player approaches the cave entrance at the south cliff and presses E:

**Title:** The Mouth

**Body:**
> A sea-cave mouth, low and wide, carved into the cliff at the south end of the island. The tide has been working at it for longer than there have been words for the sea. Inside, the air moves. Not blowing — moving. The sound is not quite a sound.
>
> You are not ready to go in.

**Voice direction:** Player-facing prose, second-person interior. Same register as the Q7 burned-Ashenmoor reflective voice — first observation, then the recognition. "Not blowing — moving" is the pivot. The closing line is non-negotiable: *"You are not ready to go in."* This is the line that earns the deferred dungeon hookup. When the dungeon DOES open in Act II, the line should change — perhaps to *"The Mouth is open."* or, if the player has been listening to Niamh, to nothing at all (the popup itself stops firing, and the player walks in).

**Lore-canonical name:** *Béal an Domhain* — "the world's mouth." Used only by Carraig Mór locals and by Niamh (in formal contexts; she uses "the Mouth" in casual register). The carving inside doesn't call it anything because it predates the word for it.

### The Watch-House (residence, no examine)

Empty stone residence at (12, 16). Door does not open; sign blank. Quietly establishes the village had more people once. Niamh's third dialog topic references that her mother lived here (via the keeper-tradition line), so attentive players who ask the right Niamh question will be able to read the closed shutters as her mother's old quarters. No examine prompt — atmosphere only.

### The ferry — gate prompts (matching Carraig Mór)

Inis Rua's north gate uses the same `guard:'tide'` predicate and the same `noFence:true` flag as Carraig Mór's south gate. The visible affordance is the moored ferry boat at the seaward end of the dock. The strings on Inis Rua's side are NOT separately authored — the gate label is "Carraig Mór," and the same low-tide / high-tide messaging the system already produces for tide-guarded gates fires symmetrically. (If Inis Rua-specific tide messaging is wanted later — e.g., "The boat is on the rock's side" — it slots naturally as a `tideMsg` field on the gate def, not yet implemented.)

---

## Droichead — village fleshing-out (v61ez, Session 38)

Droichead gets two voiced NPCs (Tadgh + Bree), a working bridge that bisects the village east-west, the canonical Dearg river running N-S beneath it, and the canonical "ferryman who sells information" beat made literal at a riverbank dock just south of the bridge. The signature character is **Tadgh, the Ferryman** — a watchful, terse-but-knowing information broker who has been at the river for thirty-two years and has historically been a quiet long-time source for Aldwyn's network. Bree is a narrative-light Wagon-Stop trader who runs the village's misc shop and gives the player route-orientation. The bridge itself is the village's third character, with two examinable carved keystones at its midspan honoring the canon "markings that resemble sigils" line.

Voice register across the village: **road-watcher**. Where Carraig Mór carries the elder-memory register and Inis Rua carries the dungeon-watcher register, Droichead's people read traffic. They count who passes through and what direction. Tadgh's withholding is constitutional, not strategic. Bree's directness is professional, not blunt.

### Tadgh (Ferryman, David, rate 0.92, pitch 0.88)

Stands outside on his dock at the river's west bank, just south of the bridge, position (38, 41) within the 60×60 zone. Faces east toward the river, not toward the village or the road. Player walking the village from west to east passes him; he does not approach.

**Voice direction:** Late fifties, thirty-two years at the river — he counts. Speaks like a man who has answered the same questions long enough that he has worked out the shortest accurate response and refined it down to one or two sentences each. **Terse-but-knowing.** When he chooses to elaborate, the elaboration costs the listener something — he watches them after, to see what they do with it.

The defining tonal quality: **he never asks the player a question.** Not "where are you from," not "where are you going," not "are you sure." Information moves through him in one direction. The player learns to volunteer, because Tadgh will not pull.

**Greetings (rotate):**
- "Bridge is up the slope. I do not run the bridge."
- "Mind the rope. The dock is older than I am, and I am not new."
- "If you are looking for the road north, the bridge takes you there. I take you elsewhere, and you have to know to ask."

**Topics:**

- *"What do you do here?"* → "I sit by the river. People who cannot use the bridge come down to the water; some of them come down to me. The bridge does not take wagons wider than the keystones. The bridge does not take traffic that does not want to be seen. There is some demand for the second kind. I meet it."
- *"What do you sell?"* → "What I have heard, mostly. The boat is not the trade — the boat is what gets people to talk to me. People in motion say things they would not say in a room. By the time they have crossed they have given me what I need. I sell the rest of it on, when there is a buyer."
  - Follow *"What sort of information?"* → "Movements. Names. Cargo. Who stopped here last week and who they were waiting for. The price scales with the question. I do not have a list of fixed rates; I read the asker. I am reading you."
- *"The bridge here — who built it?"* → "Older than the village. Older than the road, some say, but the road is also old. I have been at this dock thirty-two years next winter and the bridge has not lost a stone in that time. I do not know who built it. The people who would have known are dead. The keystones have markings on them; if you have a question about those, ask someone who reads. I do not."
- *"Have you crossed the bridge?"* → "Twice. Once when I came here, going east. Once two years later, going back, when my father died, and then again coming back. So three times, if you count the return. I have not crossed it since. The dock is here. The work is here. I do not need the road."
- *"How's business been?"* → "Steady, mostly. There has been one thing — and I am only telling you because you are the kind of person who walks alone, and people who walk alone notice these things eventually anyway. Six months ago, the count started running short. People going north past my dock, fewer of them coming back south. Not all routes — I track the eastbound and the south-returning. Eastbound is normal. Southbound is thin."
  - Follow *"What does that mean?"* → "It means something is keeping people on the north side. Or stopping them on the way. I do not know which. I am not paid to know which. I am telling you because I have stopped having anyone to sell the observation to who cares. The man at Ironhaven who used to buy this kind of thing has gone quiet. Maybe he stopped paying. Maybe he stopped having reason to ask. Either way."
- *"Goodbye."* — bye.

**Lore-canon load:**
- The canonical "ferryman sells information" beat made explicit: the boat is the pretext; the talk is the product. The "I am reading you" line is the punch — the player has been answering Tadgh's questions without realizing the questions were the small ones inside Tadgh's offers.
- The bridge's anomaly stated as observation, not interpretation: thirty-two years and no maintenance. Stronger as a Tadgh line than as third-person prose.
- Tadgh as the **third independent witness** to "the corruption is recent" — Roland (institutional, weekly reports), Brother Oswin (recordkeeper, eleven years), Tadgh (transactional, southbound count). Three different registers all observing the same shift.
- The "man at Ironhaven who used to buy this kind of thing has gone quiet" is the **invisible cross-village payoff**: Tadgh has been one of Aldwyn's quiet long-time Bealach-corridor sources for years. Player who has met both characters can recognize the connection on a re-read; player who hasn't just files it.
- Aldwyn's information-network canon: he has had road-stop sources for at least a decade. Roland is the institutional version (Norman-French career-track quartermaster); Tadgh is the transactional version (Anglo-Saxon-coded ferryman). Two different relationship types to the same scholar.

### Bree (Wagon-Stop Trader, Zira, rate 1.05, pitch 1.05)

Outside her wagon-stop in the village's western cluster, position (19, 26). Anglo-Saxon vernacular, plain register. Mid-fifties, broad-shouldered, hands like she has handled a lot of reins. Player arriving from Hearthwick passes her first.

**Voice direction:** Talkative in the practical way — she has stock, the player has coin, the conversation around that goes where it goes. Hearthwick-Oda-adjacent register but plainer. Oda runs an inn and trades in *rumors*; Bree runs a wagon-stop and trades in *goods that travelers forgot they would need*.

**Greetings (rotate):**
- "Hearthwick way? Long walk if you carry too much. What did you forget?"
- "Wagon-stop's open. I close when it stops being worth opening, which is most evenings."
- "Welcome to Droichead. The bridge is up the road. The river is over there. The two interesting people in town are me and the man at the dock, and he charges."

**Topics:**

- *"Browse your wares."* — `misc` shop (lantern oil, oilcloth, rope, dried rations, low-tier potions, candles, cheap dagger, pack-leather satchel).
- *"You drove carts here?"* → "Up and down An Bealach Mór, Hearthwick to Ironhaven and back, thirty winters of it. Loads of grain, mostly, and once a wagon of glass that I have nightmares about. I stopped because my knees stopped, not because the road did. The road is still there. I can show you on a map which milestones lean which way."
- *"Why did you settle here?"* → "Because everyone else was always passing through. I was passing through. After enough years of passing through the same place you start noticing the rooms inside it. There is a small one upstairs over the stop that suits me. The river is loud at night. I have made peace with the river."
- *"What's the road like, ahead?"* → "West takes you back to Hearthwick — you came from there, I think, by the dust on your boots. North takes you to the Thorngate, then the Deepwood, then Ironhaven. That is the road most people want. East goes to Cill Beag, which is mostly an old church and a priest who has opinions. South nobody goes from here directly; if you want south you go back through Hearthwick. The bridge is the bridge. You will see it."
- *"Goodbye."* — bye.

**Lore-canon load:**
- First in-dialog naming of the canonical Hearthwick → Droichead → Thorngate → Deepwood → Ironhaven route. Useful for player orientation — Bree functionally serves as the village's directions NPC.
- The "wagon of glass that I have nightmares about" — character flavor with no payoff. Just a person.
- Soft register echo: "the road is still there." Doesn't pay anything off.

### centerMarker (replacing the v61ec placeholder)

**Title:** Droichead

**Body:**
> Irish: Bridge. Where An Bealach Mór crosses An Dearg, between Hearthwick and Ironhaven. The bridge is too well-made for a village this size — the keystones bear markings nobody here can read. The road is its reason; the ferryman is its other reason. Travelers stop. Some come back through, some do not.

### The Bridge — keystones examination

When the player approaches the bridge midpoint and presses E:

**Title:** The Keystones

**Body:**
> Set into the bridge's central span, one on either side, are two large keystones. Their faces are carved — not deeply, but carefully, in lines that catch the eye the way the carvings on certain other stones have caught your eye before. The work is not the same. It is older, perhaps. Or simpler. Or made by a hand that knew only part of the pattern.
>
> Whoever cut them did not sign their work. The river runs beneath the bridge. The bridge holds.

**Voice direction:** Player-facing prose, second-person interior. Same register as the Mouth examination — observation, then recognition, then a closing line that lands. The closing line *"The river runs beneath the bridge. The bridge holds."* is load-bearing — it echoes Áine's "we are tenants" register and serves as a quiet thematic marker for the binding still binding. Aldwyn or Niamh could plausibly say a version of it later.

**v61f5 revision note:** The v61ez ship had a third sentence — *"The shapes are kin to what you have seen underground; they are not what you have seen underground"* — meant to honor canon ambiguity (resembling but not identical to the standard dungeon sigils). Removed in v61f5 because the strict parallel "kin to X / not X" construction reads as flat contradiction in player flow. The preceding sentence ("It is older, perhaps. Or simpler. Or made by a hand that knew only part of the pattern") already conveys the intended canon-protective ambiguity without the awkward parallelism.

**Forward-compatibility note:** Phase 2 sigil rollout could canonize one of these keystones as a real partial sigil — the inscription "kin to but not the same as" the standard catalog would slot naturally. The text doesn't commit either way; revisit at the sigil-rollout writing pass.

### The Old Cottage (residence, no examine)

Empty stone residence at (16, 38). Door does not open; sign blank. Quietly establishes Droichead has more inhabitants than its two voiced NPCs. Lore-coded (undocumented, held for future surfacing): the family that ran the toll-house when the bridge had a toll, generations back. The toll is no longer collected; the family has scattered; the cottage stands as it was. **No examine prompt** — atmosphere only.

### Tadgh's dock and skiff (no NPC interaction beyond Tadgh himself)

The dock is at the river's west bank, z:42-44, with a single moored skiff in the channel just east of it and a single oar resting across the gunwales. The dock is canonically functional but the player cannot board the skiff — Tadgh's trade is at the dock, not on the water. If a future Act II beat wants Tadgh to ferry the player somewhere offscreen (delivering a message, picking up a passenger, transporting Edna's rubbing east through the canal network instead of overland), the geometry exists; the gate hookup would need to land alongside the writing.

**v61f2–v61f6 structural note:** The v61ez ship had the dock extending east *through a gap in a cliff face* into the riverbed. The cliff faces were deleted in v61f2 when the river-carve system landed (the carved terrain mesh IS the bank-and-channel geometry now), so the dock now sits on the bank top rather than punching through a cliff. The skiff still sits in the channel; the rope runs from dock to skiff over the water. Functionally identical from Tadgh's narrative POV.

---

## Fort-class landmarks (v61f7–v61f15, Session 40)

A new category of overworld content: **wilderness structures with procedural dungeon interiors.** Each fort has a built-stonework exterior visible from the road (sometimes accessed via a side path) with a heavy door that opens into a procedurally-generated dungeon. The two shipped this session — Greywatch in the Bealach North Approach corridor (watchtower exterior), and The Old Garrison in the Bealach Central corridor (gatehouse exterior) — establish the pattern. Future placements will populate other regions; the architectural model supports any number of forts with one-line WORLD_DUNGEONS entries.

**Voice register across all forts: lore-light.** The forts are *atmosphere*, not canon-load-bearing. They are old, they are abandoned, locals have names for them, the names don't carry meaning. Future in-game books, scholar dialog, or quest hooks can reach for individual forts if they want; the canon pre-commits to nothing. Variety as worldbuilding, individual sites as flavor.

This is a deliberate separation from the three-anchor dungeons (Crypt of First Light, Crypt of Embers, Vault of the Tide), which carry the deep-bound mythology. Anchor dungeons are unique, named, structurally load-bearing for the central mystery. Fort dungeons are common, replaceable, thematically `ruins` rather than `anchor`. The player should be able to tell the categories apart at a glance — anchor sites carry their canon visibly; fort sites are stonework someone built and then lost.

### Greywatch — centerMarker (v61f9)

**Title:** An Bealach Mór — North Approach

**Body:**
> Between Droichead and the Thorngate the canopy lowers and the road runs near a clearing on its western side. In the clearing, the ruin of an old fort: a broken tower, a courtyard wall, weather and moss. The locals call it Greywatch.

**Voice direction:** Third-person observational. Geographic register matched to the surrounding road-zone markers ("between X and Y the canopy lowers and the road runs near a clearing"). The naming line — "The locals call it Greywatch" — places the name as folk usage rather than canonical naming. Nobody knows what it was called when it was new.

### Greywatch — door prompt (engine-generated)

**Prompt text:** `Press 'E' to enter Greywatch [Easy · ruins · medium]`

Engine-generated from the WORLD_DUNGEONS entry's `canonicalName`, `diff`, `theme`, and `size`. Same format as all overworld portals. No bespoke door text — the procedural-fort model deliberately reuses the standard portal-interact UX so the player learns one input pattern for all dungeon entries.

### The Old Garrison — centerMarker (v61f9 — currently uses default zone marker)

Held in the bealach_central zone's existing centerMarker (the v61ez Bealach Central marker about "The bridge is too well-made for a village this size"). The fort itself doesn't yet have a bespoke fly-by line; if the player walks up to the gatehouse and looks at it without entering, they get only the zone marker. **Forward writing work:** a single sentence acknowledging the fort presence in the zone marker would help. Held for the next polish pass — the gatehouse is currently a sibling to Greywatch with no flavor-text differentiation beyond the dungeon canonicalName ("The Old Garrison").

### The Old Garrison — door prompt (engine-generated)

**Prompt text:** `Press 'E' to enter The Old Garrison [Normal · ruins · medium]`

Same pattern as Greywatch. The difficulty tier differs (Normal vs Greywatch's Easy) reflecting the player's expected progression along the corridor — bealach_central comes later in the canonical Hearthwick → Droichead → Bealach North Approach → Thorngate sequence than bealach_north_approach for some player paths, but both are Act I content.

### The Last Post — centerMarker (v61f16, Session 41)

**Title:** The Wastes — East

**Body:**
> The eastern approach. The ground firms up slowly toward the coast. Portclare's harbor lights wait beyond, hours away. South of the road a row of pointed logs juts above the dust — what the locals call The Last Post.

**Voice direction:** Third-person observational, matched to the surrounding wastes-region centerMarker register. The naming line — "what the locals call The Last Post" — places the name as folk usage. The pointed-logs detail does the silhouette work in two words: palisade exterior reads immediately as wood register against the Wastes' bleached palette without ever naming the type. "Locals" is doing a quiet double duty: there are no settlements in the Wastes proper, so the locals who name this place are the road's edge-dwellers, the hermit at Hermit's Camp, the Caer Uaigneach holdouts. Not a king's name. Not a builder's name. Just what the people who have to walk past it call it.

### The Last Post — door prompt (engine-generated)

**Prompt text:** `Press 'E' to enter The Last Post [Normal · goblin · medium]`

### The Wind Cloister — centerMarker (v61f16, Session 41)

**Title:** The Mountain Pass

**Body:**
> Pass between Colmán's Rest and Mur Pierre. Impassable in winter. Even in summer the wind comes with intent. North of the road a low stone wall and a single standing cross — what the high country calls the Wind Cloister.

**Voice direction:** Same observational register. The "single standing cross" is the silhouette tell — monastery exterior, religious foundation, abandoned. "What the high country calls" is regional folk-usage attribution: not Mur Pierre, not Colmán's Rest, but the unnamed people who live or travel through the foothills. The name has a wind-against-stone quality matching the centerMarker's existing "the wind comes with intent" line. Norman lineage of the original order stays implicit — nobody currently in the high country remembers what order built it, and the canon protects that ambiguity.

### The Wind Cloister — door prompt (engine-generated)

**Prompt text:** `Press 'E' to enter The Wind Cloister [Hard · haunted · medium]`

Hardest of the Session 41 placements. Theme `haunted` fits the abandoned-cloister register — what remains of the order is restless, not dispersed.

### The Old Mound — centerMarker (v61f16, Session 41)

**Title:** The Coastal Road North

**Body:**
> North from Dunmore to Portclare along the eastern coast. The sea is always visible. Inland of the road two low rings of grassed earth — older than any village hereabouts. Locals call it the Old Mound.

**Voice direction:** Same register. "Two low rings of grassed earth" describes what the earthwork's concentric berms look like from the road — the sod caps make them read more as raised meadow than fortification at distance. "Older than any village hereabouts" is the lore tell — this is predecessor-culture work, not Norman or Anglo-Saxon. The Irish-register origin is held implicit; the canon doesn't say "Irish-coded" because nobody on the coastal road would, but the reader picks up the deeper age through "older than any village" landing differently than Greywatch's "old fort" register.

### The Old Mound — door prompt (engine-generated)

**Prompt text:** `Press 'E' to enter The Old Mound [Normal · undead · medium]`

Theme `undead` fits the predecessor-culture barrow register — whatever was buried here predates the kingdoms.

### Pellam's Hold — centerMarker (v61f16, Session 41)

**Title:** La Route Royale — West

**Body:**
> Western La Route Royale between Ironhaven and Vieux Marché. Heavy merchant traffic. Only road with occasional guard patrols. North of the road a single squat block of stone — Pellam's Hold, locals say, after a name nobody remembers.

**Voice direction:** Same register, with one specific writing trick. "Pellam's Hold, locals say, after a name nobody remembers" does a lot of work in seven words — it asserts the name without committing to its historical accuracy, signals that the canon doesn't either, and reads as the actual texture of how rural place-names propagate through generations (a name, a person who was important once, no one alive now who knows who). The Anglo-Saxon name *Pellam* surviving on a Norman-French royal road quietly tells the same story Bram's *An Bealach Mór* tells about Anglo-Saxon names predating Norman administration. The reader doesn't need to track this; the texture lands.

### Pellam's Hold — door prompt (engine-generated)

**Prompt text:** `Press 'E' to enter Pellam's Hold [Normal · ruins · medium]`

### Hollow Gate — centerMarker (v61f16, Session 41)

**Title:** The Northern Road

**Body:**
> North from Ironhaven into the foothills. Traffic thins quickly. La Grise is the last settlement before the mountains become impassable. A road-stone halfway up marks Mountain Approach — a waypoint, not a village. West of the road the ruin of an old gatehouse stands at half-strength — one tower fallen, one still keeping watch. They call it Hollow Gate.

**Voice direction:** Same observational register. "One tower fallen, one still keeping watch" describes the ruined_gatehouse silhouette directly — the variant's defining detail is its asymmetry. "Stands at half-strength" is doing tone work: not "ruined," not "destroyed," but a specific medical word that personifies the structure as wounded rather than dead. "They call it Hollow Gate" — the folk-usage register at its most direct. The word *hollow* lands as both the literal void where the second tower stood and the more haunted register a gate-shaped structure carries when one side is missing.

### Hollow Gate — door prompt (engine-generated)

**Prompt text:** `Press 'E' to enter Hollow Gate [Normal · goblin · medium]`

Same difficulty as The Last Post; both are commission-locked Act-II-accessible forts in moderately dangerous corridors.

### The Lonely Tower — centerMarker (v61f16, Session 41 — uses default zone marker)

The Deepwood Forest does not currently have a per-zone marker entry that flags The Lonely Tower. The fort sits deep in the eastern Deepwood at (210, 110), away from the main path corridor. Players will discover it by wandering rather than via the centerMarker. **Forward writing work:** a single sentence in the Deepwood's marker text mentioning that the deep woods hide more than animal trails would help the player formulate that they might want to explore off-path. Held for a follow-up writing pass.

### The Lonely Tower — door prompt (engine-generated)

**Prompt text:** `Press 'E' to enter The Lonely Tower [Easy · haunted · medium]`

Easiest of the new forts. Theme `haunted` fits the deep-woods register. The Lonely Tower is also the only Session 41 fort with no surface enemies — the canopy variant reads as "structure alone in the woods, threat is inside the door" rather than "occupied by bandits/skeletons/phantoms." A player who finds it will not have a fight on the approach; the threat begins at the threshold.

### Session 41 writing-register lessons logged

**Side-path tells.** Each Session 41 centerMarker contains one specific detail that tells the silhouette of the fort's exterior without naming the type — "a row of pointed logs" (palisade), "a single standing cross" (monastery), "two low rings of grassed earth" (earthwork), "a single squat block of stone" (keep), "one tower fallen, one still keeping watch" (ruined gatehouse). This is the writing-register convention for fort centerMarkers going forward: pick one detail that lets the player picture the silhouette before they see it, and let the geometry confirm it on arrival.

**Anglo-Saxon naming register holds across eight forts.** No king, no order, no dated fall. No Ald- prefix. The Wind Cloister names what is left of a building, not its founder. The Old Mound names what it physically is. Pellam's Hold names a forgotten lord on a road that postdates him. The Last Post and Hollow Gate are plain regional folk-usage. All eight names lean on the same trick: locals use these names because locals have to use *some* name, and the names that survive are the ones that describe what is *there*, not what *was*.

**Why "what is there, not what was."** This is the canon-protective register for fort-class landmarks. If a future quest wants to canonize one — give it a founder, give it a date, give it a faction — the writing pass at that point adds the specificity. The centerMarker doesn't pre-commit. This is the same principle as Greywatch ("no faction commitment, no Aldred/Varek tie") extended across the eight-fort set.

---

## Pending writing

These are flagged as next-session writing work.

### Commission-locked gate prompts (v61d9 follow-up — provisional copy in place)

The v61d9 commission gating ships with placeholder generic copy:
- Proximity prompt: *"The road to [label] is closed. Royal commission required."*
- E-press toast on attempt: *"The road is closed to those without royal commission."*

These are functional but flat. A per-gate flavor pass would tune the register to each location. Sketches:

- **Ironhaven's Northern Gate** (military): *"A sergeant turns you back at the gatehouse. 'The road north requires the king's seal. Come back when you have it.'"*
- **Ironhaven's Eastern Gate / Royale**: similarly military, but Royale-flavored — the road is the king's road, the gate is the king's gate.
- **Ashenmoor's Western Gate / West Track** (pastoral, pre-burn): *"The path beyond is overgrown. There is nothing out that way you have business with yet."* — softer; the village isn't a military post, the closure reads as cultural rather than legal.
- **Hearthwick's Eastern Gate** (Oda-aware, if Oda is nearby): *"'That road's not for you yet,' Oda says, polishing a tankard."* — uses Oda's voice if she's already been met; otherwise a generic Hearthwick villager line.

Plus regional voice work as Tier 2/Tier 3 gates land. Hold for the regional identity pass — gate copy fits naturally inside that work since both want the same per-region flavor.

### Sigil quest flavor text

21 auto-generated placeholders (v61n) await per-sigil writing pass.

### Phase 2 sigil carving texts

31 sigils to be placed across the world. Each needs:
- Irish-language inscription (the "deep tongue" the sigil is carved in)
- Comprehension subtitle (English translation)
- Mastery true-name (full meaning when the player reaches Mastery tier)

Pattern from Phase 1: keep the Irish 1-3 words, the English subtitle terse, the Mastery name evocative and slightly off-kilter ("The Quiet-Sent-Out", "Living Ember", "The Shore's Answer").

### Aldwyn's Q3 explanation of sigils

When the player first arrives in Ironhaven and Aldwyn explains what the sigils actually are. Currently exists as a working version in code; would benefit from a polish pass to land the *binding* / *anchor* register firmly.

### Aldwyn's Q4 "the corruption is recent" speech

After the player returns from the Crypt of Embers. The "months, not centuries" beat. Should land with the right note of alarm — Aldwyn realizing his timeline was wrong.

### Aldwyn's Q6 connecting-the-dots speech

"The sigils aren't independent — they're *one* inscription split between anchor points." This is the Act I revelation, paired with the seal handoff and the smoke-from-home hook. Should be quiet, not climactic.

### Brother Oswin's full burned dialog

Five topics already in code; would benefit from a read-through pass. The "Glenn child through the door" beat especially.

### Corwin's "what he saw" — full Act II monologue

He said one fragment to the player and that fragment lives in this doc. The full conversation where he tells the player what he saw needs to be drafted. He is the first person to say *Aldred* to the player in connection with Varek — that beat needs to land cleanly.

### The List — possible voiceover or read-aloud

If the player examines specific entries, do they hear Varek's voice reading them? Or is it pure visual? Open question. The current intent is no audio — the silence is the point. But worth holding open.

---

## Maintenance protocol

This document is the **verbatim writing repository**. Lines preserved here are protected from compaction. Updates are additive.

When dialog is produced in conversation and judged canon-worthy, it goes in this document **before the session ends** — not held in session notes. The summary goes in `lore_canon.md`; the exact words go here.

Section headers organized by encounter / character / quest. New material lands in the appropriate section, or adds a new section if it doesn't fit. Order within a section: chronological by in-game appearance where possible, or by importance otherwise.
