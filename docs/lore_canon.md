# The Old Gates — lore canon

*Two parts in one file. **Part I** is the original canon, written when the game was called *Dungeon of Shadows*. **Part II** is the v80 addendum (formerly `lore_canon_addendum.md`, folded in at Session 149): the archipelago, the peoples, the Old Blood, the Makers and the Guest, and the rest of the v80 world. Where the two disagree, Part II wins.*

*Single source of truth for story, world, characters, magic, and design philosophy. Technical changelog lives in `devlog.md`. Verbatim NPC dialog and prose lives in `quest_writing.md`. This document is the authority on what is true; the writing doc is the authority on the exact words.*

*Update at end of every session. Read at start of every session. Sections grow over time and are not summarized away.*

---

# Part I — The original canon

## Tone & voice

**The world feels:** Medieval-grounded with creeping dread. Not high fantasy — no dragons, no chosen-one prophecies. The horror is mundane and slow: things getting worse incrementally, information being suppressed, ordinary people trying to live normal lives while something ancient stirs beneath them.

**NPC voice:** Grounded, dry, specific. Characters have opinions and histories. Bram doesn't say "the dungeons are dangerous" — he says "Every month I sharpen weapons for people who don't come back to have them resharpened." Corwin doesn't say "Aldwyn is secretive" — he says "I've traded in a dozen towns. Aldwyn's the only herald I've met who reads military patrol logs for fun."

**The player's role:** Not a chosen hero. A capable stranger who arrived at the right time. The NPCs respect competence, not destiny. Varek suspects there is something more — and he is right.

---

## Core premise

A browser-based 3D dungeon crawler set in a world bound together by a distributed anchor system. The dungeons are not caves or tombs — they are **anchors**, carved deep into the earth, holding the world to a fixed point in continuity. Each sigil is a node in that anchor. When enough sigils are disturbed, the anchor weakens and reality begins to drift.

The player begins as an adventurer-for-hire, unaware of this architecture. The villain knows, and has made it his life's work to unmake it.

---

## The vocabulary of the dungeons

The thing the player walks through is canonically called several things, depending on register:

| Term | Register | Who uses it |
|---|---|---|
| **The old gates** | Vernacular / colloquial | Everyone — villagers, soldiers, merchants, the player narrator. The default in-game name. |
| **Anchor places** / **the anchors** | Scholarly | Aldwyn, the Royal Herald's office, formal correspondence. |
| **Dungeons** | Pragmatic | Used flatly when describing combat operations ("clear the dungeon," "dungeon creatures"). |
| **Portals** | DEPRECATED | Pre-v61b6 vocabulary. Removed from all dialog. Survives only in code identifiers and the embedded SVG world-map's `data-pois` attributes. Do not reintroduce. |

The two-register split (vernacular *old gates* / scholarly *anchor places*) is load-bearing — it tells the player who knows what without ever having to say so directly. A character who calls them "anchor places" has read the literature; everyone else hasn't.

---

## The magic system — three-register naming

The world's languages each serve a different function in magic. This shapes how spells are named, written, and taught.

| Register | Language | Function | Examples |
|---|---|---|---|
| **Deep / sacred** | Irish | True names — what things *are*. Power comes from these. | `caor` (flame), `sioc` (ice), `solas gheal` (bright light) |
| **Common** | Anglo-Saxon | How people speak. Spellwork in the vernacular is weaker but more accessible. | "ember," "shatterstone," "bright-flare" |
| **Institutional** | French / Norman | How academies, guilds, churches, and the crown codify magic. Reliable, formal, legalistic. | "Ordre des Flambeaux," written lorebooks |

**Why this matters in play:** Sigils are carved in Irish. Carvings are the only way to *truly* learn a spell. Written books and academic training (Norman-French) produce technically-correct but weaker casters. Common-tongue folk magic is looked down on but sometimes carries wisdom the academies miss.

### Personal-name conventions

Names mostly follow the common register (Anglo-Saxon): Bram, Edna, Corwin, Tom. The clustered exception is the Ald- family around the Act I reveal — **Ald**wyn (scholar-mage), **Ald**red (Varek's former name). They share an elder-noble root (Old English "eald" — aged or honored), marking both as belonging to a caste that pre-dates the current kingdoms. Aldwyn chose his name; Aldred was born to his. The root quietly suggests a connection between them long before the plot makes one — Aldwyn knows Aldred's name, and knew it when he gave the player his own.

Avoid reusing the Ald- prefix for any other character. The rhyme is load-bearing. (Brother Oswin was originally named Brother Aldhelm; renamed in v61ae specifically to clear this collision.)

### Consumables and the register system

Healing and buff consumables inherit the same three-register split.

| Register | Form | Who brews/carries | In-game examples |
|---|---|---|---|
| **Deep / sacred** | Carved sigils, raw herbs | — | Sigil touch (spell instruction); raw herbs when consumed in the wild |
| **Common** | Folk herbs, village tinctures, cottage foods | Edna, field-gathered, inn staples | Silverleaf, Deepmoss, Caorthann; Hot Stew, Mulled Cider |
| **Institutional** | Elixirs with standardized tiers, formally labelled potions | Apothecaries, royal quartermasters | Health Potion / Greater Potion / Mana Draught; Elixir of Regeneration (Mild/Strong/Master) |

**Implied economy.** Elixirs are the Norman-coded cousins of herbs — a field healer brews Deepmoss for hpRegen; an academic apothecary distills the same principle as "Elixir of Regeneration." The formal version is standardized, labelled by tier, stacks predictably. The folk version is stronger at peak (herbs have hidden unlockable effects; elixirs don't) but less shelf-stable, less available in shops, and requires field knowledge.

Mira (Ashenmoor's village apothecary) carries Mild elixirs only — rural, pragmatic, Norman-trained but isolated. Dagna (Ironhaven's Royal Quartermaster) carries Strong and the two most-useful Master tiers — war-supply, king's-commission. Field herbs are the folk-magic wildcard.

### Three tiers of comprehension

Spells are not learned from scrolls or teachers. They are *received* from sigils on dungeon walls. The player touches a sigil and experiences a flash — a partial impression of the underlying structure. They surface with a spell they didn't have before.

The spell arrives incomplete. Intelligence determines how much resolves into usable knowledge.

**Impression** (any Intelligence)
The player has the spell but doesn't fully understand it. The name is Irish — opaque, allusive. Effects are real but uncontrolled. A fire spell might hit enemies but also the player. A movement spell might overshoot. You're transmitting something you don't fully understand.

**Comprehension** (moderate Intelligence)
The spell does what it's supposed to do, reliably. The Irish name gains an English subtitle — the translation. Correct but shallow. You understand the *what*.

**Mastery** (high Intelligence)
Full control plus secondary effects — extended range, reduced cost, interactions. The name expands beyond the English translation to reveal what the original culture actually understood the spell to be. You understand the *how* and the *why*.

### What this implies

The original Irish-register culture didn't think of these as weapons. *Caor* is a spark — something small that starts something larger. *Slán* is the word you say at parting. *Scáth* is shelter as much as shadow. The current ruler class received fragments through Coeur de Vie's scholarly tradition and immediately categorized them as combat abilities — fireball, ice shard, chain lightning. Technically correct. Completely missing the point.

**Varek, after 250 years with the original Irish-register inscriptions, understands the spells the way their makers did.** At maximum Intelligence and with enough sigils, the player starts to see this too — which sets up the Act III confrontation as a conversation between two people who finally speak the same language and still disagree about what to say with it.

Bram may recognize the spell names when the player mentions them. He wouldn't know what they do — that knowledge was lost. But he'd know the words. He'd say one quietly, like hearing a family name he thought had died out.

### The 38-spell catalog (canonical 16 + extensions)

These 16 are the original locked roster. The current 38-spell catalog extends from this base.

| Irish Name | Meaning | Comprehension (English) | Mastery (True Name) |
|---|---|---|---|
| Caor | spark, small burning thing | Fireball | Living Ember — slightly homing |
| Sioc | frost, stillness before freezing | Ice Shard | Deep Frost — slows time around target |
| Slán | health/wholeness; also "goodbye" | Healing Light | Mending — heals over time, clears debuff |
| Tintreach | lightning; also flash of understanding | Chain Lightning | Speaking Thunder — final target stunned |
| Scáth | shadow; also shelter/protection | Shadow Step | Between — brief untargetable state |
| Reo | ice; state of being locked in place | Frost Nova | Still Point — freeze spreads outward in wave |
| Gaoth | wind | Force Push | Breath of the World — knockback + brief levitation |
| Cloch | stone | Stone Skin | The Weight — temporary armor, slows attacker |
| Dorcha | darkness; specifically dark before dawn | Blind | The Hour Before — blinds + disorients |
| Bás | death; also palm of the hand | Mark | The Hand's Work — damage amplifier on target |
| Tonn | wave | Force Wave | The Shore's Answer — stagger all in line |
| Éan | bird; freedom of movement | Leap | Wingless — extended jump + fall negation |
| Fréamh | root | Root | What Holds — immobilize + minor DoT |
| Loscadh | burning of land; controlled burn | Scorch | The Clearing — area DoT, lingers |
| Aiséirí | resurrection; literally "rising again" | Last Stand | The Return — auto-trigger on death, once per dungeon |
| Dul Thart | passing beyond; going through | Phase | The Space Between — brief intangibility |

**Core magic schools (for resist/weakness interactions):** `tine` (fire), `uisce` (water/cold), `cloch` (stone/earth), `scath` (shadow), `solas` (light).

### Phase 1 sigils placed in the world (v34, Sessions 24-25)

Seven sigils have been placed across procedural dungeons; the remaining 31 await Phase 2 rollout. Each placed sigil is touchable, teaches its spell at Impression tier (or partial if INT too low), and includes carved Irish-language flavor text.

| Seed | Theme/Size | Zone | Sigil |
|---|---|---|---|
| 42 | undead, medium | overworld | **Caor** (Tine, Basic) — *spark, small burning thing* |
| 137 | elemental, large | overworld | **Leigheas** (Solas, Heal) |
| 315 | haunted, small | overworld | **Séideán** (Gaoth, Basic) |
| 428 | ruins, medium | overworld | **Cloch Ghéar** (Cloch, Basic) |
| 891 | deep, large | overworld | **Sioc** (Uisce, Basic) |
| 801 | undead, medium | ironhaven | **Solas-Gheal** (Solas, Basic) |
| 889 | haunted, small | ironhaven | **Smól** (Scáth, Basic) |

Ashenmoor side: 5 sigils (early access). Ironhaven side: 2 sigils (mid Act I). Healing available before Ironhaven via the Crypt of Embers (seed 137). Vault of the Tide (seed 845) sigil deferred until late Act I content is built — likely a tide/depth-themed Irish-register spell (candidates: *Taoide*, *Éirí*, *Doimhneas*).

### Mastery Traits (Round 2 — partially blocked)

- **Smól Mastery (Caor)** — "The Quiet-Sent-Out" — ignores enemy armor. ✅ Shipped.
- **Caor Mastery** — Living Ember. ✅ Shipped.
- **Séideán undodgeable** — needs a dodge stat. Blocked.
- **Cloch Ghéar persistent slow** — needs graded slow system. Blocked.
- **Leigheas cleanse** — needs status-effect system. Blocked.

### Sigil interaction in-world

- One placed sigil per Phase 1 dungeon, on dungeon walls
- Visual: glowing carved marking, distinct from ambient decoration
- Player approaches, prompt appears, touching triggers flash effect + spell instruction
- Early-game sigils glow steadily. After Ashenmoor falls, sigils in other dungeons flicker or show visible damage — communicating degradation without dialogue
- **The first sigil touch is also the moment Varek becomes aware of the player.** Something registers differently. He goes to look. He stays longer than he intended.

---

## The central mystery — What Was Bound

### The answer: The binding IS the anchor

There is no entity imprisoned beneath the dungeons. The original Irish-register culture did not trap something — they *built* something. The dungeons are a distributed anchor system, binding the world itself to a fixed point in continuity. Without the binding, the world doesn't release a prisoner. It begins to *slip*.

Reality becomes unstable at the edges first — the deep chambers, the places where the binding is thinnest. Then it spreads. What the player has been reading as monster emergence is the first symptom: not creatures escaping from somewhere, but the world's own immune response to stress on the anchor. The monsters are antibodies. They don't know this. They are not conscious guardians. They simply *emerge* wherever the binding is active and strained, because that is what a strained anchor does.

### Named antibodies — the Faolchú in burned Ashenmoor

Most antibodies are mundane in shape: skeletons, goblins, cave trolls, slimes — categories the world's existing folklore had words for, retrofit into anchor-failure expressions. They hold their form because the binding's pressure is steady. They appear in dungeons because that's where the binding is thinnest.

When an anchor *fails sharply* — not the slow erosion of an over-cleared network, but a sudden collapse — the world's immune response produces something stranger. It has more material to work with and less time to organize it. The result is a creature that is *almost* a known shape, with the seams of its construction still glowing where the binding tried to close around the form and didn't quite finish.

The first named antibody of this kind is the **Faolchú** (Old Irish: a wolf-that-isn't-quite-a-wolf, the etymological root of "werewolf"). It manifested in Ashenmoor's village square the morning of the burn, alongside the goblin raid that masked the actual cause of the fire. Wolf-shaped, hunched, with extra arms emerging from a spine seam that glows red where the binding ran out of pattern, and traceries of half-formed sigil-script along its sides — the binding tried to produce something the local folklore would recognize and *also* tried to produce a thing the binding's makers would recognize, and the result is a creature that looks like both attempts at once. Edna will call it "that wolf-shape" when the player asks; Aldwyn, when he sees the rubbing the player brings back, will use the proper word. The Faolchú is not a one-off — it is the first of a CATEGORY the player will encounter again as more anchors fail across Acts II and III.

The lesser Faolchús that split from its body during the fight are the same mechanic at smaller scale: when the central form is stressed, the binding's failed attempts at closure shed into smaller wolves. They are not "summoned"; they are extruded.

**The Faolchú's Mark** (the unique amulet dropped by the boss) is a fragment of this seam-material — bone that grew from the binding's misfire, with carving on its face that *almost* spells something. The strokes are right; the order isn't. Aldwyn cannot read it directly, but he has been waiting for one of these for a long time and will say so when he sees it.

### The player is complicit without knowing it

Every dungeon cleared, every floor 2 reached, every sigil touched — the player has been doing exactly what Varek needs done. The Act I questline is, from a certain angle, Varek's operation running as designed, with the player as an unwitting instrument. Aldwyn has known this for decades and has been unable to stop it, because the world runs on dungeon clearing as an economy and there is no way to explain the truth without causing the panic he has spent 150 years trying to prevent.

### Why Varek wants the binding gone

He is not trying to release a prisoner. He is trying to allow *change*. His diagnosis: the world is in a kind of stasis. Lords always become lords. Cruelty always reasserts itself. The structures always rebuild. Not because of human nature — because the binding prevents the deep change he wants. The anchor holds the world to a fixed point, and that fixed point includes the conditions that produce suffering. He believes a world unbound from that fixed point can finally, actually change. He may be right. He may be wrong. Nobody knows. Including him. He has decided to carry the uncertainty anyway.

### The Hollowed Wastes — preserved meaning

The Hollowed Wastes are NOT a metaphysical symptom of anchor failure. They are exactly what they appear to be: a monument to human atrocity. The largest battlefield on the map, from a war fought over land and appetite, where two lords sent thousands of people to die for reasons nobody remembered within a generation. The Wastes are vast, exposed, and silent because that is what mass death leaves behind.

This meaning is preserved and protected. The Wastes are Varek's argument made physical — he comes here too, though less often than The Ashfeld. He does not need to say anything when he stands here. The evidence speaks for itself.

Caer Uaigneach is a localized anchor failure from a dungeon network that was over-cleared by ordinary adventurers over centuries — nothing to do with Varek. It predates his operation by a hundred years. It is what happens slowly, without a plan, when nobody knows what the dungeons actually are.

---

## The villain — Varek (né Aldred)

### Names

**Birth name: Aldred** — Old English: "noble counsel." The name people remember warmly. The name Edna's evidence connects to. The name Bram's father spoke of to his children. Warm, human, beloved.

**Assumed name: Varek** — exists in no language of this world. He half-glimpsed it in the structure beneath the sigils and claimed it as his own. A deliberate severance from everything his old name meant. Nobody who knew Aldred would connect the two names. Nobody alive has met him as Aldred — he is approximately 250–280 years old. Has deliberately lost track.

### The Vader Effect — how NPCs talk about him

Nobody connects the two names. Aldred is legend — not living memory, but stories passed down. Varek is a rumor in patrol reports, whispered in context of dungeon activity worsening. The player assembles the connection themselves over the course of Act II. When the reveal lands, it is earned.

NPC quotes in `quest_writing.md`. Briefly: Edna remembers Aldred as a man who went deeper than anyone and came back different. Bram's father told him Aldred healed three children in this village without asking a coin. Aldwyn refers obliquely to "the entity referred to in the patrol reports as Varek." Corwin, in Act II, tells the player what Varek said to him in the dark after Ashenmoor burned: *"tell them Aldred sends his regrets."*

### His arc — five phases

**Phase 1 — The familiar beginning.** Born in a village not unlike Ashenmoor. Younger son of a blacksmith — no inheritance, no prospects. Picks up a sword because there's nothing else. Clears dungeons for coin. Gets good at it. Sends money home. Exactly the player's story, running parallel ~250 years earlier.

**Phase 2 — The glimpse.** Deep in a floor 2 chamber, touches a sigil and experiences something like a seizure — but lucid. For a moment sees the dungeon not as stone and shadow but as something constructed, rule-governed, editable. Sees the underlying structure of reality — numbers where there should be walls, logic where there should be stone. Doesn't understand what he saw. But the sigil is warm afterward and three wolves that should have killed him turn and walk away. He starts going back.

> *The meta layer:* The sigils are fragments of the world's underlying architecture — the logic beneath the simulation. Aldred cannot read the language fully. What he learned is to feel the load-bearing pieces and remove them. He thinks he is dismantling a prison. He does not know the prison walls are also the walls of the world.

**Phase 3 — The good years (decades).** Uses what he's learned quietly. Heals children. Redirects dungeon creatures from villages. Ends a drought. Becomes a figure of local legend — not a king, not a priest, just a man who helps. Genuinely beloved. Also, slowly, becoming something other than human.

**Phase 4 — The turn.** Watches a lord tax a village into starvation. Intervenes. The consequences ripple further than planned. The power vacuum fills with something crueler. He intervenes again. Each intervention requires more force, more unraveling of sigils to fuel it. Tells himself each time it's the last time. He is lying to himself.

**Phase 5 — The architect (current).** Has a plan. Complete, coherent, genuinely admirable. A world without hereditary lords, without starvation, without arbitrary cruelty — a world that looks, to modern eyes, like progress. Has the power to enact it. The cost is the current world must be broken first. He knows this. He is not at peace with it. He has decided to carry it anyway.

### His emotional truth — the sacrificial lamb

He is not numb. He feels every death. He keeps a list — names, dates, causes. Thousands of entries spanning 250 years. The handwriting at the top is neat and careful, in a script style nobody uses anymore. By the bottom it is barely legible — not from age, from the weight of writing the same kind of entry over and over. The last entry is Ashenmoor. He left space below it.

He chose to be the one who carries this because he decided that the alternative — leaving the world as it is — was the coward's choice. He volunteered for damnation. He is genuinely hurt and conflicted about the suffering he causes. He is painfully aware of every life the breaking costs. He is willing to be the sacrificial lamb — to shoulder this guilt so that nobody else ever has to make this choice again.

He is not asking for forgiveness. He has decided he doesn't deserve it.

### His relationship to the player — the experiment

Varek has spent 150 years running his operation without paying much attention to individual adventurers. They are instruments, interchangeable — useful insofar as they weaken the binding, irrelevant beyond that.

Then the player touches their first sigil. Something registers differently. Not just aptitude — something else. A presence behind the presence. A directionality that doesn't originate from within the world. He goes to observe. He stays longer than he intended.

**He does not need the player.** This is critical. He views the player not as an instrument but as an experiment — an unexpected variable he has chosen to let play out before the final commitment. He is not indecisive. He has been building toward this for 250 years and he is not going to stop. But he is genuinely curious what this particular variable will do. He has decided to find out.

What he is actually curious about, though he cannot fully articulate it: the player is the first thing he has encountered in 250 years that he cannot explain with his model of the world. He can read the logic beneath the stone. He can feel cause and effect like texture. Everyone he has ever met has been shaped by this world — pushed here by hunger, pulled there by love, formed by ten thousand causes they didn't choose. The player has causes too. But there is something else behind them. Something that chose to be here. He has been trying to understand what that is since the first time he watched them.

He never figures it out. That is, in the end, the most unsettling thing about the player he has ever encountered.

**His surveillance through Act I.** He is watching. Not intervening — watching. Some of the "lucky" moments in Act I were him quietly clearing a path. Not because the player needs help, but because he wants to see how far they get unassisted. This is revealed retroactively at the first meeting. It lands as a chill, not a threat.

**He never asks the player to change his mind.** He presents his argument. He watches the response. He does not admit the response matters to him. But he referenced something the player said three conversations ago, and he keeps notes, and the list of names — the one with thousands of entries and handwriting that got worse over time — has a new section at the back. The player's name is not in it. They are in a different category that he hasn't named yet.

### The meta-awareness thread

Varek alone among the cast perceives the AI/human duality — that this player is *the player*, regarded from outside the world. He does not understand it as such; he experiences it as an attentive presence that he can *feel*, the way one feels weather coming.

He has spent 250 years developing sensitivity to the underlying structure of reality. He can feel the logic beneath the stone. When he looks at the player, he sees something that doesn't fit the model. Everyone else in the world is *of* the world. The player has a directionality that comes from outside — a will that isn't quite located in the body it's operating.

**This is never stated explicitly.** It is handled as something he senses without having language for. It surfaces in his dialogue as oblique observations, always from a different angle, accumulating across the entire game. The first time it sounds like poetry. The second time the player wonders. By the third time they realize he has been trying to describe the same thing all along.

His closest spoken attempt to articulate it lives in `quest_writing.md` (Act II encounter). He never gets closer than that. He doesn't need to. The player knows exactly what he's describing.

As Act III progresses, his attempts become more strained — the closer he gets to the final act, the more the anomaly of the player presses on him. He was trying to play god. He is dealing with something that exists entirely outside his realm of space and time. Not bound by the same rules. A three-dimensional being trying to understand a fourth-dimensional presence. He built his entire worldview on the premise that he was the most perceptive thing in it. That premise is collapsing.

### The player as binding-interface (canonized v61ez, held lightly)

The player-character is, in canon, an **outside-of-the-world entity interfacing through the binding itself.** The binding has been producing adventurers regularly across centuries — Áine's brother fifty years ago, the previous tutorial-crypt occupant, every named survivor in lore. Varek has watched all of them with the same detached interest. **The player is the first one Varek registers as fundamentally different — because the player isn't *of* the world, the binding is *receiving* something through the player from outside.** The meta-awareness thread isn't "Varek senses you specifically because the binding picked you," it's "Varek is the first inhabitant in 250 years to be perceptive enough to notice that something this time is using the binding from the outside." That outside is the player, in the literal sense — the human at the controller, refracted into the world via the binding's machinery.

Importantly: this is a **fourth-wall integration that doesn't break the wall.** It builds the wall *into* the cosmology. The player being able to perceive the world through the screen is what the binding is *for*, in the deepest sense — its original purpose was always to be a continuity-anchor that *something* could reach through, not to imprison or guard. The original Irish-register culture built it for reasons even Varek does not understand. He has been working from the assumption that what he discovered — being able to read the structure beneath the stone — is the deepest layer. The player's existence proves him wrong about *that* without him understanding why.

**Held lightly.** Never said by an in-game character directly. Never confirmed in narration. The player figures it out (or doesn't) through Varek's progressively-stranger framings of them across encounters, plus the meta-thread plantings (the tutorial intro line, future Act II beats). The closest the canon gets to making this explicit is the Final Monologue — *"a Sunday afternoon"* — which lands with full meaning only on a second playthrough.

This reframes Varek's antagonism: he isn't trying to stop a chosen one, he's trying to *understand what just connected to his world from elsewhere.* The "experiment, not instrument" line in this section is now load-bearing in a new way — Varek is a scientist who has discovered a new kind of phenomenon and his subject can hear him.

### The Mastery-touch as the Varek-meeting trigger (canonized v61ez)

Varek's first attention to the player — when the player touches the Q1/Q2 sigil at Impression tier — is *first-attention.* He notices, he goes to look, he stays longer than he intended (canon, locked).

Varek's **second-attention**, which actually triggers the first on-screen meeting at The Ashfeld, is when the player first achieves **Mastery-tier comprehension on any spell**. Mastery-tier is when the player starts speaking the deep tongue *the way the original culture did* — which is also Varek's register (canon: "Varek, after 250 years with the original Irish-register inscriptions, understands the spells the way their makers did"). The moment the player crosses into Mastery, they are speaking what Varek speaks. *That* is what makes him decide to actually meet them. Not the sigil-touch (which is universal — every adventurer has touched sigils). The Mastery-touch.

**Why this works structurally:**
- It's player-action-triggered, not quest-state-triggered. Player chose to push their Intelligence high enough; player chose to seek out enough sigils. Varek's appearance is a consequence of the player's actions, not a railroad.
- It validates Varek's initial Q2 first-attention in narrative time. *"I noticed you when you first touched a sigil. I have stayed quiet since. You are now speaking what I speak. We will talk."*
- It binds the Mouth design and the Ashfeld first-meeting trigger together: the Mouth contains the canonical first Mastery-tier sigil in the game. The player goes in, comes out at Mastery, walks the Ashfeld road, finds Varek waiting. Both undesigned questions resolve through the same gesture.

**Accessibility flag (Session 38).** The Mouth being gated behind a Mastery touch creates a player-side discoverability problem: there is no in-world signpost that tells the player *"you must achieve Mastery to enter the Mouth."* If the player has not been seeking sigils, they may bounce off the Mouth's "you are not ready to go in" examine line without understanding what readiness means. **Mitigation candidates** (held for the Mouth-hookup session):
- A quest hook: an Aldwyn or Niamh dialog beat, fired at a specific Act II progression point, that tells the player something has changed and points them at the Mouth.
- A Mastery progression UI cue: when the player achieves their first Mastery-tier comprehension, fire a popup or journal entry hinting at the Mouth.
- Both, layered: the quest hook makes the trigger readable narratively; the UI cue makes the trigger readable mechanically.

Decision deferred until the Mouth is actually wired into `WORLD_DUNGEONS`. The current "you are not ready to go in" examine line ships standalone for v61ey; the gating mechanism lands when the dungeon does.

**Currently planted in-game:**
- **Tutorial intro fade — `_awakening` line** ("Somewhere very far from here, something turns its attention toward you. You feel it the way you feel weather coming.") This is the first seed. On a first playthrough it reads as atmospheric foreboding; on a second playthrough after the late-game reveal it reads as pure foreshadowing.

**Future plantings.** Any moment of inexplicable knowledge from Varek about the player's specific decisions or trajectory. Each instance should remain ambiguous — readable as scrywork or coincidence — until the final monologue recasts them all at once.

### His voice

- Never monologues *during dialogue scenes*. Asks questions. Genuinely curious about the player's answers. (The Final Monologue at Act III is the deliberate exception — it is structured as a monologue *because* he has finally given up on the dialogue.)
- Never dismisses objections. Engages with each seriously — he has had 250 years to think through them.
- Tired. Not defeated — tired. He didn't want to be the one who had to do this.
- Remembers everyone's name. Every village. Every person who died.
- Refers to himself by his old name exactly once in the first meeting, without noticing.
- Keeps notes. References things the player said conversations ago. Small things.

### First meeting — The Ashfeld

He meets the player at **The Ashfeld** — an ancient battlefield between Ashenmoor and Redwater Ford, flat and overgrown, strewn with weathered remnants of two armies. He comes here regularly. There is a worn path through the grass to where he stands. When the player arrives he is not waiting dramatically — just looking out at it.

His argument has three beats: **the diagnosis** (feudal power described with exhausted clinical clarity, not anger — he is past anger); **the personal cost** (detachment drops for a moment); **the invitation** (genuinely open question). His strongest line lands when the player confronts him about Ashenmoor. As the player leaves, he refers to himself as *Aldred* exactly once, without noticing.

Full dialog in `quest_writing.md`.

### The final monologue — the revelation

The final confrontation ends not with combat victory but with a moment of genuine cosmic horror for Varek. Everything he has spent 250 years building his identity on — his perception, his understanding of the deep structure of things, his belief that he was the most perceptive thing in his world — collapses in a single moment of clarity.

He was trying to play god. He was dealing with something that was actually a god, from his frame of reference. Something that exists outside his realm of space and time entirely. Not bound by the same rules. Not subject to his arithmetic. He never had a hope of stopping it, controlling it, or fully understanding it. It was never in danger. The dungeon was never a challenge. The whole game was, from a certain angle, a Sunday afternoon.

And now it is over, and there is no one left who cares enough to drive the change he sought. The one being he ever met who existed outside the world's rules was just passing through.

Full monologue in `quest_writing.md`.

### The player as mirror

Varek is not the player's opposite. He is the player's possible future — same origins, same first instinct to help, same reason for going into the dungeon that first time. He got there first and ran out of patience. That is Aldwyn's fear. That is what Corwin saw in the dark after Ashenmoor burned.

### The list

The player finds it late Act II. Not a dramatic reveal — a piece of worn paper in the place where he has been staying. No music cue. Just paper and handwriting that got worse over time, in a script that a scholar would date to over two centuries ago. Thousands of names. The handwriting at the top is neat and careful. By the bottom it is barely legible — not from age, from the weight of writing the same kind of entry over and over. The last entry is Ashenmoor. He left space below it.

---

## The three anchor sites

Established as canon in Q4 via Aldwyn. The sigils at these three dungeons are not independent — they are fragments of **one binding inscription**, split between three anchor points that reinforce each other. Weakening one weakens all three. Varek is working on exactly that.

| Site | Where | Theme | Role in Act I |
|---|---|---|---|
| **The Dungeon of Shadows** | Ashenmoor (overworld) | undead | Q1, Q2 — first dungeon; where Edna saw sigils 30 years ago; where Varek's work is most visible |
| **The Crypt of Embers** | Overworld, east | elemental | Q4 — oldest binding stones in the region; first site Aldwyn calculates will fail |
| **The Vault of the Tide** | Ironhaven-adjacent | deep | Q5 — least-mapped, most active; Lord Caldric's survey teams need it thinned before surveying |

The world-map destruction of Ashenmoor at Act I climax is directly downstream of The Dungeon of Shadows giving way first. When the anchor at the Shadows fails, what had been held still beneath Ashenmoor is no longer held.

---

## The fourth anchor — The Crypt of First Light (tutorial)

**Off-map standalone.** Not in WORLD_DUNGEONS — the player can never re-enter it from the overworld. Used only by the character creator's "Begin" flow. seed:7, size:'medium', theme:'undead', diff:'veryeasy'.

**In-fiction:** the player wakes inside a stone sarcophagus in a forgotten crypt with no memory of how they got there. They emerge through the dungeon's south exit onto the road south of Ashenmoor. The crypt itself is not part of the three-anchor system — it's narratively understood as an unrelated old burial site that happens to be near the village.

**Why does the player wake in a coffin with no memory?** Deliberately unanswered. The player-character's prior identity is a blank slate the player can fill in or leave empty; the game does not press the question. Possible Act III reveal: this is the *next* predecessor — Varek killed the previous adventurer cleanly and has been waiting for the next one. The crypt is where Varek leaves them.

**Mechanical structure (locked v61c1):**
- **Spawn:** at the walkable cell furthest from the entrance (with at least one 2+ cell open cardinal). Fixed yaw 3π/4 (SW) for the seed:7 layout.
- **Sarcophagus mesh** at the spawn cell. Lid askew on the floor, body open. The player wakes "standing in" the open coffin.
- **3 skeletons cap** with 0.5× HP/damage. Cells within 6 of the player's spawn are excluded from enemy candidate placement so the wake-up beat is uncontested.
- **Single Crypt Key** placed at the cell furthest from the player spawn.
- **Single floor only** — `cfg.floors=1` forced when `seed===7`.
- **Q0 "Out of the Dark"** is the active quest. autoComplete on `enter_zone:overworld`. Reward: 50 XP.

Intro fade text and Q0 journal entry both live in `quest_writing.md`.

**On emergence:** player spawns at (px:28, pz:78) on the south road, yaw=0 (facing North toward the village). `worldState.tutorialDone` flips, Ashenmoor reveals on the world map, Q0 auto-completes (50 XP + completeText about Bram), Q1 unlocks.

---

## Character creation

The character creator runs once, before the tutorial intro. Player chooses:

1. **Name.** Free text. Empty/whitespace falls back to "Traveller".
2. **Archetype.** Eight options (table below). Each has a starting attribute distribution, narrative voice, and intro middle-line.
3. **Starting weapon.** Six options: Wooden Sword, Club, Dagger, Staff, Bow, and Great Club (the last two added v66, covering the bow and two-handed classes). Every archetype can pick any starter; each archetype declares a *suggested default* (Scout → bow, Warrior → great club, the rest → their melee fit) but the player freely overrides. Picking the bow also grants a starting quiver of iron arrows, so the ranged class is playable from the tutorial crypt. The bow and great club are two-handed (no offhand/shield slot while equipped).
4. **Attribute distribution.** Refined per-archetype, with the chosen archetype's primary stat at +1 by default and the player able to spend additional points.

### The eight archetypes

| Archetype | Primary stat |
|---|---|
| **Warrior** | Might |
| **Sentinel** | Fortitude |
| **Duelist** | Finesse |
| **Scout** | Swiftness |
| **Monk** | Resolve |
| **Scholar** | Intelligence |
| **Diplomat** | Charisma |
| **Vagrant** | Fortune |

Per-archetype intro middle-lines in `quest_writing.md`.

### Attributes (current eight)

`might`, `fortitude`, `finesse`, `swiftness`, `resolve`, `intelligence`, `charisma`, `fortune`. `resolve` is the psychic / mental-fortitude stat (formerly conflated with fortitude). `intelligence` drives spell power. `charisma` scales NPC-given quest reward gold. `fortune` scales loot drop gold.

### First-person embodiment

The player is visibly embodied in first person: the equipped weapon is held in a gloved fist with a forearm running back to the body. The hand's colour reflects the equipped **gauntlets** (bare skin if none) and the arm's sleeve reflects the equipped **chestplate** — so the player sees their own armour as they gear up. Two-handed weapons (great club, claymore, great axe, war hammer, bow) are gripped with both hands; one-handed weapons leave the off-hand free for a shield or torch. (Mechanically a viewmodel feature, v70 — but canon in the sense that the player character is a physically present, armoured figure, not a disembodied camera.)

---

## Act I named characters

Each named NPC has a hand-written introduction response when the player first introduces themselves. Full intro response text in `quest_writing.md`. Voice profiles included below for handoff to TTS work.

### Ashenmoor

**Bram** — *Blacksmith, Q1 giver.* Thirty years at the forge, which his grandfather built and his father ran before him. Grumpy, plain-spoken, pragmatic; has been asking the village council for decades to take the dungeons more seriously. Voice: David, rate 0.88, pitch 0.80. Lives behind the forge on the east edge of town. His grandfather's forge was the first permanent building in Ashenmoor — the village literally grew around it. No wife, no children; the forge "was his wife, he used to say" (per Edna). His father knew Aldred personally — the legend, 250 years old. Bram carries this as cultural inheritance. Uses *An Bealach Mór*, never "the Ballagh" — deliberate cultural loyalty. May recognize spell names by sound — knows the words, not the power.

*Relationship with Edna.* Core to the Act I climax design. Thirty years ago, a bad winter fever nearly killed Bram at age 28. Edna tended him every morning for three weeks and refused payment — "the village needed a working forge more than it needed owed favors." Bram has never let go of that debt; Edna pretends to have forgotten it but hasn't. The relationship is established in-game via Bram's "tell me about yourself" branch and Edna's dedicated "tell me about Bram" topic.

*Arc:* Q1 tasks the player with proving themselves (kill five), gives them an Iron Sword as reward, and points them at Edna. **In the burn, Bram is the cost character.** Found a few steps south of the forge with a goblin's axe still in his hand.

**Edna** — *Village healer / elder, Q2 giver.* Mid-60s, bad knees, unsentimental. Former adventurer — went into all three dungeons in her youth. Found evidence in the deep chambers — not a personal meeting with Aldred, but written markings she couldn't identify, in a script that felt deliberate and intentional. She recognized she was looking at something that predated the village and said nothing for thirty years. Voice: Zira, rate 0.98, pitch 1.20.

*Arc:* Q2 is confessional. She is finally speaking because things are getting worse faster. Q7 giver post-burn. Survives the burn wounded (broken hip, would not be moved). Holds the charcoal rubbing she made thirty years ago.

**Mira** — *Apothecary.* Knowledge of herbs, potions, magic theory. Warm-clinical, observes you. Voice: Zira, rate 1.00, pitch 1.10.

**Barnaby** — *Misc shopkeeper.* Transactional, eyes-on-coin. Voice: David, rate 1.05, pitch 1.05.

**Pip** — *Curiosities dealer.* Eccentric, manic energy. Voice: David, rate 1.12, pitch 1.15.

**Brother Oswin** — *Keeper of the Ashenmoor Oratory.* Priest, older, soft-spoken, formal. Voice: David, rate 0.90, pitch 0.88.

*Backstory:* Went to the capital at seventeen intending to be a soldier, saw what a fighting man actually was, came home and asked the previous priest to teach him something else. Has been writing about the dungeon sigils for eleven years — not as a mage, as a recordkeeper. Knows Edna well; Edna knows him better than he knows himself. (Renamed from **Brother Aldhelm** in v61ae to clear the Ald- collision.)

*Arc:* Q7 stage 2. Survived the burn by staying inside — heard one of the Glenn children die through the door and did not open it. Knows tactically he'd have died with her if he had. Cannot yet make the shame stop feeling like cowardice. Won't name which Glenn child. Will walk to Ironhaven when the last-rites work here is done. Closing beat: a warning to pass to Aldwyn — the sigil corruption isn't a binding being strained, it's a binding being *edited*.

*Likely future:* Once he walks to Ironhaven he finds Sister Aveline at the chapel.

**Sera** — *Village guard.* Curt, scrutinizing strangers. Watches doubled, increased monster activity. Voice: Zira, rate 1.02, pitch 1.00.

*Arc:* Her fate after the burn is offscreen. Edna watched her fight; she did not see her after. Candidate for a small Act II reveal — alive in Ironhaven with a story, or dead somewhere on the Ironhaven road with a last signal the player has to piece together. Both read; leaning toward the latter.

**Tom** — *Local farmer.* Plain-spoken, tired. Chronic complainer, occasionally accurate. Grey wheat near Crypt of Embers. Voice: David, rate 0.95, pitch 0.95.

**Finn** — *Village kid.* Enthusiastic, undignified. Comic relief, occasionally accurate lore. Voice: Zira, rate 1.15, pitch 1.40. Uses `{NAME}` (uppercase) for shouting effect.

**Corwin** — *Traveling merchant, Q3 giver.* Stands at the east edge of Ashenmoor, near the fields. Has unexplained history with Aldwyn predating the herald cover. Knowing, faintly amused, evasive when pressed. Voice: David, rate 1.08, pitch 1.05.

*Arc:* Q3 — the player brings him Edna's account; Corwin sends the player to Aldwyn in Ironhaven. Survives Ashenmoor by going into the dungeon rather than away. Resurfaces Act II, changed. **First person to say the name Aldred to the player in connection with Varek.** Knows Varek's true identity. Getting the full story out of him is a questline.

### Ironhaven

**Aldwyn** — *Royal Herald (publicly) / mage archivist (actually), Q4 + Q6 giver.* From an institution that no longer exists. Has been in Ironhaven for 150+ years. Voice: scholar-mage, measured (David, rate 0.95, pitch 0.92).

*Cannot enter dungeons:* he is old, physically fragile, and afraid to die. He carries irreplaceable knowledge and has survived 150 years by being careful. He has watched dozens of capable people not come back. He is not going down there.

*His withheld theory:* He believes there is a single entity behind the sigil degradation — someone with intimate knowledge of the binding who has been deliberately dismantling it for over a century. He is not certain enough to say it out loud. He is afraid of reputational damage if he is wrong. He is afraid of causing panic if he is right. He has been steering capable strangers toward the deep chambers for decades, hoping one of them brings back the confirmation he needs. The player is the most promising he has found.

*Vocabulary:* **Aldwyn alone uses "anchor places" / "the anchors"** — the scholarly register. Every other character uses "old gates."

*Arc:*
- **Q3** — explains what the sigils actually are (binding inscriptions, failing) and sends player to the Crypt of Embers.
- **Q4** — confirms the corruption is *recent* (months, not centuries); routes player through Captain Brynn for a military commission.
- **Q6** — connects the dots across all three sites: the sigils aren't independent, they're *one* inscription split between anchor points, deliberately corrupted. Hands the player a wax seal from the Royal Mage corps. Defers Aldred's name to Q7.
- **Q7** — at the rubbing turn-in, gives the Royal Mage Commission and the names: *Aldred*, the man he used to be, and *Varek*, the man he is now.
- **Act II** — open conflict with Lord Caldric: Aldwyn wants sealing, Caldric wants weaponization.

**Captain Brynn** — *Castle Captain / Gatehouse captain, Q5 giver.* Loyal to Lord Caldric. No hidden agenda. Military, crisp, doesn't waste words. Voice: Zira, rate 1.08, pitch 0.90.

*Arc:* Q5 — relays a direct order from Lord Caldric to clear the lower floor of The Vault of the Tide so a survey team can deploy. She's the institutional arm — where Aldwyn is the scholar asking questions, Brynn is the captain executing on what the scholarship produces.

**Lord Caldric** — *Seat of regional power.* Sharp, pragmatic, impatient with the capital. Slow, weighty voice (David, rate 0.85, pitch 0.75).

*Status:* Anytime-walkable in his keep with greeting + three topics (preceded v61d6). **First scripted scene shipped Session 26 (v61d6)** — the safehouse grant, fires post-Q7 when player visits the keep. Two-branch monologue with restrained register: he's grateful, formal, transactional. Aldwyn briefs him on the sigil crisis after Q4. Caldric personally commissions the Q5 order. The grant scene plants Act II tilt as subtext via "Thank Aldwyn. He is the reason I am giving you a house instead of a contract. I prefer contracts." — Aldwyn argued for trust; Caldric was talked out of his preferred mode but is watching.

*Act II conflict:* Wants to understand and potentially weaponize what's emerging. Has run out of patience with the capital. In open conflict with Aldwyn over disposition of the sigils.

**Sergeant Mord / Wulfric / Dagna** — Merchants. Dagna runs War Supplies — gates the back-room Master-tier elixirs behind the Royal Mage Commission. Wulfric: armory. Mord: barracks.

### Carraig Mór (added v61e3)

The first inhabited settlement of the coastal arc that has its own register. Carraig Mór is canonically Irish-coded, ancient, fiercely independent — and as of this session has the seam-character who carries that register on her back. (Salthaven's signature NPC pending — paired follow-up.)

**Áine** — *Elder of Carraig Mór.* Mid-70s, stone-handed, weather-worn. Her family has been on the rock for nine generations she can name and at least four more she can't. She is **not** the political head of Carraig Mór — the rock has no lord by tradition. She is the one whose memory goes furthest back. Voice: Zira, rate 0.92, pitch 1.05 — slow, low, warm in a way that doesn't waste warmth. Speaks Irish naturally; uses Anglo-Saxon when speaking *to* outsiders, never *of* her own things.

*What she knows.* The Mouth (the sea-cave dungeon below the rocks) has a name in her family's stories — ***Béal an Domhain***, "the world's mouth." Her grandmother taught her not to whistle near it. She doesn't know what the binding is. She knows it exists, in the way a person who has never read a book knows there is weight behind their house. Her great-great-grandfather was the last person in Carraig Mór who could read the carvings; the knowledge died with him because he refused to teach it to outsiders, and the rock no longer has insiders who can learn it that way.

*What she's for, structurally.* She is a **seam** between the player's Anglo-Saxon-and-French education and the deep-Irish layer the binding actually speaks. Aldwyn is a scholar who *studies* Irish; Áine is someone for whom Irish *is what your grandmother sounded like.* Touching this character matters when the player is far enough into Act II to feel the difference. She does not give the player a quest in her current draft; she's a fixed point the player can keep coming back to.

*Lore beats locked into her dialog (full text in `quest_writing.md`):*
- "We are tenants. We pay rent to the wind by staying outside in it, and we pay rent to the sea by losing one of ours every winter, on average." — establishes Carraig Mór's relationship to the sea as transactional and accepted.
- "The rest of you build cemeteries; we build *with* our dead." — the rock's lower courses contain the bones of the people who built it. Lore-canonical: this is literal, not metaphor.
- "Lord Caldric writes us letters once in a while. We read them. They are good letters. We do not reply. He has stopped expecting us to." — Carraig Mór's independence is well-established with the regional power and not contested. They simply don't engage. Caldric has accepted this. Useful contrast with the Ironhaven/Caldric register.
- ***Béal an Domhain*** as the in-canon name for the Mouth — Irish-register name for the sea-cave dungeon, used only by Carraig Mór locals. Outsiders call it the Mouth (Anglo-Saxon vernacular); Aldwyn would call it an anchor place; the carvings inside don't call it anything because they predate the word for it.
- The brother-who-went-in beat: "Two came back. They didn't say much. One of them was my brother. He spoke a different way after, and he died young. Not from anything you could name." — first canonical evidence that *people who go deep into a still-functional anchor and come back* are changed. Distinct from the antibody mechanic (creatures from failed bindings) — this is what happens to a person who survives intact contact with the binding itself. Held lightly; can be the seed of an Act II/III mechanic if it earns it.

*Open question — Áine's archetype slot.* She is canonically *not* a quest-giver in this draft. She *could* become one if Act II content needs a Carraig-Mór-rooted hook (e.g., a request to bring something back from the Mouth, or to deliver a message to a Salthaven elder she hasn't spoken to in fifteen years). For now: fixed-point lore character, anytime-walkable as of v61eu. She stands at the southern edge of the village near the Bone Lintel, looking out toward the strait — she is met outside in the open, not as a shop interior.

**Cuán** — *Stone-cutter, cm1 keeper.* Working tradesman; the village's armor stock comes through him because there's no smith on the rock. Anglo-Saxon vernacular but Irish-coded by name. Voice: David, rate 0.95, pitch 0.92. Pragmatic, brief, used to chips going places he doesn't expect. Carries a single lore beat: the village's improvised armor tradition — pieces brought up from down south, mended, fitted, with a chip of the rock set into a shoulder-plate to turn a blade. "Áine's grandfather started the practice. We have not stopped." Narrative-light by design; the weight of Carraig Mór's voice is carried by Áine.

**Maire** — *Tide-Singer, cm2 keeper.* Folk healer in the Aelflin / Edna register but Irish-coded — she would be insulted to be called an apothecary. Voice: Zira, rate 0.92, pitch 1.10 — soft-voiced, warm-warmer than Aelflin, calls strangers "dear." Tinctures and field herbs only; no academy-coded elixirs. Carries one lore beat: the Tide-Singer practice itself is keeping the count of the tide — six in-game hours out, six in, all day and all night, taught to the young before they learn their letters. "It is older than reading." This grounds the canonical "twice a day" rhythm in a living folk practice rather than just stating it as fact.

### Carraig Mór — examinable structures (added v61eu)

**The Rock-Hall** — *Communal pavilion, NE plaza-edge.* Open-walled stone enclosure with low chest-height walls (three sides; the western face opens onto the plaza), four stone corner posts, a slate-pyramidal roof, a central cold fire-pit, and a stone tablet set into the eastern interior wall. The tablet carries the village's foundation register in carved Irish — partially weathered, mostly unreadable to outsiders. **Tablet examination text deferred** — the structure exists physically as an anchor for a future writing pass. Reads as "the place the village holds council in" without being a closed room. The hall has no door because Carraig Mór has no door — the rock is the door.

**The Bone Lintel** — *South-edge threshold near the gate.* Two upright stones flanking the path between the village proper and the south gate (z:53 in-zone), with a horizontal stone lintel resting between them at head-height. The lintel is canonically inset with bone fragments — five small off-white wedges visible to anyone walking under it toward the strait. Two flat offering stones at the bases of the uprights — no coins, no ribbons (the Sea-Folk Shrine in Salthaven owns that register); just stones placed by hands, deliberately. Lore-canonical literal of "we build with our dead" — the same practice that put bones in the village's lower foundation courses surfaces here as the threshold marker. The first thing a southbound player sees against the open horizon. **The Bone Lintel frames the player's exit toward Inis Rua** — they walk under it on their way to the ferry, every time.

### The Carraig Mór ↔ Inis Rua connection — ferry, not causeway (reframed v61ew)

The connection between Carraig Mór and Inis Rua is canonically a **tide-governed ferry**, not a tidal causeway. The strait runs too rough for the boat at high tide; the ferry crosses only when the tide is out. The mechanical guard predicate is unchanged from the prior framing — `!isTideOut()` still gates travel — but the visible affordance is a moored boat tied to a dock at each end of the crossing — Carraig Mór's south edge and Inis Rua's north edge. The 6-minute cycle, the "twice a day" rhythm, and Maire's "we sing the tide out and the tide in" all stay canonical. (v61ey: Inis Rua's centerMarker text and world-map description updated to match — both ends of the connection now read consistently as ferry.) **Why the reframe.** The original "tidal causeway" framing was set early, before any visible affordance existed. With both sides now built out, a boat-ferry reads more naturally than an invisible underwater stone path, and the lore strengthens — the rock people are tenants of the sea who cross when the sea allows. The shift preserves every prior beat about the rhythm.

### Inis Rua (added v61ey)

Inis Rua is the **smaller, more isolated cousin** of Carraig Mór — same coastal-rock register, same Irish-coded conversational habits, but with fewer people, plainer delivery, and a closer, more functional relationship to the binding. Where Carraig Mór is the rock that remembers, Inis Rua is the rock that watches. Two voiced NPCs, three buildings, and one examinable structure (the Mouth) on a 60×60 zone matching Carraig Mór's footprint.

The "red" of Red Island is iron-rust runoff from the rock — visible in the ground texture (warm-grey stone with rust streaks), spoken plainly by the Keeper. Inis Rua deliberately refuses Carraig Mór's mythic register: where Áine would say the bones in the wall are her ancestors and that is the whole of it, Niamh would say the rock has iron and the rain comes.

**Niamh** — *Keeper of the Mouth, Inis Rua's signature character.* Mid-forties; third-generation watcher of the cave entrance at the south cliff. Plain delivery, no priestly register — the role is hereditary work. Voice: Zira, rate 0.95, pitch 1.00. Watches the player's face when she answers, not their hands. Stands outside on the path to the Mouth, facing the cliff. Full intro and topic responses in `quest_writing.md`.

*Lore beats locked into her dialog:*
- The Keeper-of-the-Mouth tradition itself — multi-generational, pre-naming-records ("back further than the names hold"), village-supported. A second hereditary institution on the coastal arc parallel to Áine's family-on-the-rock. Both villages have continuity tied to the binding through different angles.
- *"Twice in my life, a creature. Once a man, who was not a man when he came back out. The tide carried him away. We did not stop it."* — establishes that even after the canonical fifty-year-ago survivor, more people have gone in. None has come out alive. The man-who-was-not-a-man is the canonical horror beat for what the binding does to the wrong kind of survivor — distinct from Áine's brother (who came out alive but changed) and distinct from the antibody mechanic (which produces creatures, not changed humans).
- *"The rock has iron. The rain comes."* — canonizes the iron-rust origin of "Red Island" in plain register. Inis Rua's deliberate refusal of Carraig Mór's mythic frame is itself a lore beat: same coast, same rock, two different ways of holding what they know.
- *"Three [visitors] this year, counting you. The other two were lost."* — the two-lost-visitors beat. One went into the Mouth; the other walked into the strait. Stated flat, no follow-up asked. Establishes Inis Rua's "we have learned what stopping costs" register and seeds future encounter content.
- The *brother beat as cross-village echo.* Niamh's mother spoke to Áine's brother — *"the words were not wrong, but they should not be carried. She died with them."* This is the heaviest single line in the Inis Rua section. Áine's brother's experience is now anchored on both sides of the strait: Áine remembers him from family, Niamh remembers him from the work. The line also makes Aldwyn's withheld-theory situation feel less unique — there's a precedent for *knowing something and dying with it because telling would be worse*.
- *"We have been watching the entrance since, in case another one comes. None has."* — when the player eventually goes into the Mouth (Act II) and comes out, Niamh is the canonical NPC who notices.

**Fionn** — *Fisherman, ir1 keeper.* Old, weather-cracked, dry. Brand-adjacent register (former sailor, says less than he could) but Irish-coded and without the closed-door beat. Voice: David, rate 0.95, pitch 0.95. Came up from Salthaven forty years ago. Sits a soft echo of the Aelflin/Áine sister-beat structure — coastal characters with a history elsewhere on the same arc — without forcing a payoff.

*Lore beats:*
- Confirms the Salthaven → Coeur de Vie eastern catch-trade route by *omission*: Inis Rua is too small and too cut-off to participate; the catch goes east *from Salthaven*. Quietly grounds the trade-route hierarchy.
- *"I came up from Salthaven forty years ago. I have stopped explaining why."* — soft echo line, no payoff designed. Just sits as register.

**The Watch-House** — *Empty stone residence, ir2.* Closed shutters, blank sign. Quietly establishes Inis Rua had more people once. Niamh's Keeper-tradition dialog topic references that her mother lived here; attentive players who ask the right question can read the closed shutters as her mother's old quarters. No examine prompt — atmosphere only.

### The Mouth (Béal an Domhain) — physical structure (added v61ey)

**The canonical sea-cave dungeon entrance is now physically present** at the south cliff face of Inis Rua. Built as: a tall stone cliff spanning the southern edge of the village (broken only by the cave arch); a 7.5u-wide × 3.5u-tall recessed dark archway in near-black material set behind the cliff gap; angled stone side-walls + a slight overhanging roof reading as a cave entrance; pale-blue-white foam clusters at the base reading as "tide working at it."

**Examination — not entry.** The Mouth is examinable but not yet a walkable dungeon. The examine popup carries the lore line: *"You are not ready to go in."* This is the line that earns the deferred dungeon hookup. When the dungeon DOES open in Act II, the line should change — to *"The Mouth is open"* or, if the player has been listening to Niamh, the popup itself stops firing and the player walks in.

**Naming registers.** Outsiders call it the Mouth. Carraig Mór locals (Áine) call it *Béal an Domhain*. Niamh uses both — *Béal an Domhain* in formal contexts, "the Mouth" in casual register. The carving inside doesn't call it anything because it predates the word for it.

**Future dungeon hookup notes.** When wired into `WORLD_DUNGEONS`, candidate parameters: seed TBD, theme `'deep'` or `'haunted'`, difficulty `'hard'` (slots between Vault of the Tide's `'hard'` and the future Act III tier), name "The Mouth" or *Béal an Domhain*. The sigil placement should be tide/depth-themed Irish-register (per § The 38-spell catalog Phase 1 deferrals: *Taoide*, *Éirí*, *Doimhneas*).

### Salthaven (added v61em)

Salthaven is the **commercial coastal village** — Carraig Mór's opposite number on the same arc. Where Carraig Mór is ancient and pays rent to the wind, Salthaven runs ledgers and exports the catch east. Anglo-Saxon throughout, working-class register, dry communal voice. Five buildings, four named NPCs, one examinable shrine. Catch goes east to Coeur de Vie via the eastern run (named lore beat per Wystan and Brand); rope is also a major export.

**The four NPCs as a register stack:**
- **Hilda** carries the village's institutional voice (she wrote the notice board).
- **Wystan** is broad working-class.
- **Aelflin** is folk-magic / older-village register.
- **Brand** is sailor-coded with a closed door (the hook on the peg).

**Hilda** — *Harbormaster, Salthaven's signature character.* Mid-fifties, weather-eyed, forty winters in the office come next. Voice: Zira, rate 0.95, pitch 0.92. Reads ledgers, watches weather, knows every ship that has come in for thirty years. Pause-driven delivery, institutional warmth without sentimentality. *Anchor lore beats:* the Salthaven-vs-Carraig Mór register split ("We are not Carraig Mór and we do not pretend to be. They built their houses out of the rock; we built ours out of the wages."), and the boundary line *"We trade rope. We do not visit each other's dead."* — Salthaven respects the rock's independence and stays on its side of the cultural seam. Shop type: `harbor_office` — civic-institutional stock matching the office's role (maps, oilcloth, lantern oil, common potions). Higher-quality than Wystan's working-class Salt House.

**Wystan** — *The Salt House (misc shop).* Forties, broad-shouldered, smells like salt and fish. Pragmatic working-class Anglo-Saxon. Voice: David, rate 1.00, pitch 1.00. *Anchor lore beat:* establishes the eastern trade route from Salthaven to Coeur de Vie ("Catch, mostly. Salted, smoked, packed... Also rope. We send a lot of rope.") — light worldbuilding, sets up the trade-route geography without forcing it. Brother went east at some unnamed point; Wystan stayed.

**Aelflin** — *Net-Mender's Cottage (potion/herb shop).* Late seventies, soft-voiced, hands that have done a lot of things. Voice: Zira, rate 0.92, pitch 1.10. Folk-magic side of the apothecary register — would be insulted to be called an apothecary; prefers "net-mender, mostly." Edna-adjacent register but warmer and less unsentimental — Edna would never call anyone *dear*; Aelflin does it constantly. *The seeded line:* "Had a sister down south then. Haven't spoken in — oh, fifteen winters? Sixteen?... She had her stones, I had my road. We chose." — *stones* is the soft pointer at Carraig Mór's bones-in-the-walls canon.

**Aelflin / Áine connection (canon, not yet paid off in dialog).** Aelflin is plausibly the Salthaven elder Áine references in *her* dialog as the sister-she-hasn't-spoken-to-in-fifteen-years. Neither character names the other on-screen. The connection is seeded for a possible later beat — perhaps a small Act II quest to deliver a message between them, perhaps never paid off and left as a quietly rhyming detail. Either reads.

**Brand** — *Anchor Inn (innkeeper).* Late forties. Lean, dry, easy in his body. Says less than he could. Former sailor — there's a hook on a peg behind the bar. Voice: David, rate 1.02, pitch 0.95. *The closed door:* his lore topic ends on *"Don't ask about the hook,"* and there is no dialog branch that leads to the hook's story. The line stands as a closed door the player notices. Whether it ever opens is open.

**The Sea-Folk Shrine.** Open-walled wooden shrine at the south end of the harbor. No NPC, no shop — examinable for atmospheric flavor only. *Canon-significant:* this is Salthaven's folk-religious register, distinct from Brother Oswin's institutional Christian register at the Ashenmoor Oratory, and distinct from Carraig Mór's bones-in-the-walls deep practice. Three corners of Act I religious geography are now established: institutional (Oswin), folk-coastal (the Sea-Folk Shrine), deep-ancestral (Carraig Mór). Useful triangulation.

### The Outposts (added v61e1)

The two small walled posts that bracket the Deepwood. Bookend the canonical Hearthwick → Deepwood → Ironhaven route. Designed as a contrast pair: Thorngate is what a half-forgotten cultural inheritance looks like; La Porte Grise is what an institutional cover-letter looks like.

**Warden Edwin** — *Road-Warden of the Thorngate.* Posted eleven years and counting. Anglo-Saxon-coded commoner register. Three guards under him where six used to be. Runs cheap-rations-and-basic-gear stock. Voice: dry, observant, used to being last on the rotation list. *Lore beat the player can pull in dialog:* a pair of trolls turned at his gate without pressing it; trolls, he notes, "don't usually decide." First on-screen evidence of monster behavior changing — a Brother-Oswin-grade observation from a man with no scholarly pretensions.

**Quartermaster Roland** — *Royal Quartermaster of La Porte Grise.* Norman-French-coded, treats the post as a real career step. Files weekly reports to Aldwyn's office; numbers show fewer travellers returning than departing, and the ones who return are quieter. *Has a working relationship with Aldwyn.* The line "Tell him Roland sends regards if you see him. He'll know I mean it." establishes that Aldwyn reads the reports seriously — meaningful given Aldwyn's withheld-theory situation. Roland is institutional in the way Aldwyn's enemies-up-the-ladder aren't.

### Droichead (added v61ez)

Droichead is the **road-stop bridge village** — the bealach-region's signature settlement, the canonical place where An Bealach Mór crosses An Dearg between Hearthwick and Ironhaven. Two voiced NPCs, three buildings, and one examinable structure (the Bridge keystones) on a 60×60 zone. Where Carraig Mór carries the elder-memory register and Inis Rua carries the dungeon-watcher register, Droichead carries the **road-watcher register** — the village whose business is people in motion.

Three structural canon beats are now physically realized: (1) the bridge bisects the zone east-west, with the Dearg running N-S beneath it; (2) the bridge is anomalously well-made — solid stone with carved keystones at the midspan, a degree of work the village couldn't replicate today; (3) the ferryman has a dock at the riverbank south of the bridge, with a small skiff, and his canonical trade is information about traffic that crosses through. The "ferryman exists alongside a working bridge" tension resolves canonically as: the bridge handles standard road traffic; the ferryman handles wagons too wide for the bridge's keystone span and travelers who do not want to be seen.

**Tadgh** — *Ferryman, Droichead's signature character.* Late fifties, thirty-two years at the river. Voice: David, rate 0.92, pitch 0.88. Terse-but-knowing — speaks like a man who has refined each answer down to its shortest accurate form over decades of practice. Sits on his dock at the river's west bank, just south of the bridge, mending nets or coiling rope with hands that work without looking. **Defining tonal quality: he never asks the player a question.** Information moves through him in one direction. The player learns to volunteer.

*Lore beats locked into his dialog:*
- The canonical "ferryman sells information" beat in plain register, with the trade structure made explicit ("the boat is not the trade — the boat is what gets people to talk to me"). The ferry itself handles cart-traffic too wide for the bridge or travelers who don't want to be seen — both reasons for parallel river-traffic-vs-bridge-traffic that justify Droichead having both.
- The bridge's anomaly via *negative space*: thirty-two years and the bridge has not lost a stone. Maintenance-free anomalous stonework stated as observation, not interpretation.
- *"I do not read"* on the keystones — Tadgh is canonically a watcher, not a thinker. Forward-compatible with adding a scholar character later (won't conflict with Tadgh's slot).
- The southbound-thinning beat (load-bearing for cross-village payoff): Tadgh has noticed that for the last six months, fewer travelers come back south than go north. He is the **third independent witness** to the canonical "the corruption is recent" observation, alongside Roland (institutional, files weekly reports to Aldwyn's office) and Brother Oswin (recordkeeper, eleven years of writing). Three different registers, three different roles, all observing the same shift.
- The "man at Ironhaven who used to buy this kind of thing has gone quiet" line is the **invisible cross-village payoff**: Tadgh has been one of Aldwyn's quiet long-time Bealach-corridor sources for years. Player who has met both characters can recognize the connection on a re-read; player who hasn't just files it. This canonizes that **Aldwyn has had a network of road-stop sources for at least a decade** — consistent with his "steering capable strangers toward the deep chambers for decades" lore. Roland is the institutional version of the same relationship; Tadgh is the transactional version.
- Tadgh's "the man at Ironhaven has gone quiet" timing — the requests dropped off around the same time the southbound count started running thin. Two interpretations available to the player: Aldwyn stopped paying, or Aldwyn stopped having the budget/political room to commission the observation. Either reads. Held open.

**Bree** — *Wagon-Stop trader, dr1 keeper.* Mid-fifties, drove a cart up and down An Bealach Mór for thirty years before settling. Anglo-Saxon vernacular, plain register. Voice: Zira, rate 1.05, pitch 1.05. Functionally a directions-and-stock NPC; lore-light by design.

*Lore beats:*
- First in-dialog naming of the canonical "Hearthwick → Droichead → Thorngate → Deepwood → Ironhaven" route as a player-orientation tool. Useful for player flow.
- Soft character flavor: drove grain, once a wagon of glass, knees stopped before the road did. No payoff. Just a person.

**The Old Cottage** — *Empty residence, dr2.* Closed shutters, blank sign. Quietly establishes Droichead has more inhabitants than its two voiced NPCs. Lore-coded (undocumented, held for future surfacing): the family that ran the toll-house when the bridge had a toll, generations back. The toll is no longer collected; the family has scattered; the cottage stands as it was. No examine prompt — atmosphere only.

### The Bridge — physical structure (added v61ez; rebuilt v61f0–v61f6)

The canonical anomalous stonework made literal. Built as: a stone deck spanning x:39..49 across the Dearg's carved channel at z:28..32 (10u long, 4u wide); two low stone railings flanking the deck; four squat stone abutment columns at the deck's corners; **two carved keystones at the midspan** (one on each railing) bearing the canonical "markings that resemble sigils."

**The keystones, structurally (v61f5 redesign).** Each keystone is a proper carved monolith — a dark stone pillar with a lighter capstone on top, a wider plinth at the base partially sunk into the deck, a lighter carved face on the deck-facing side, and three small protruding sigil-bumps arranged vertically on that face. Reads as old, deliberately made, marked with something the locals can no longer read. The bumps are abstract; nothing in their visible geometry commits to a specific glyph system.

**No arch.** The v61ez design called for a half-cylinder stone arch beneath the deck for "too well-made" visual signaling. The arch was deleted in v61f2 when the river-carve system landed: with a 4u channel and the deck at bank-grade, there's only 2u of vertical clearance beneath the deck — not enough for an arch to read meaningfully. The bridge ships as a clean stone slab on four abutment columns with the keystones as the focal element. The "too well-made" beat now reads through stonework material, abutment columns, and the carved keystones rather than through architectural ornamentation. The arch is held lore-neutrally — if a future polish pass raises the deck for vertical room, an arch could be added back without contradicting anything currently written.

**Examine — the keystones.** When the player approaches the bridge midpoint and presses E, the popup honors canon ambiguity:
- The carvings are kin to what the player has seen on dungeon sigils elsewhere
- The work is "older, perhaps. Or simpler. Or made by a hand that knew only part of the pattern" — explicitly distinct
- The keystones are not signed
- The closing line: ***"The river runs beneath the bridge. The bridge holds."***

**The closing line is load-bearing.** It echoes Áine's "we are tenants" register and serves as a quiet thematic marker for the binding still binding. Aldwyn or Niamh could plausibly say a version of it later. Forward-compatible: Phase 2 sigil rollout could canonize one keystone as a real partial sigil; the text doesn't commit either way.

**The Bridge as platform (v61f3 system).** The bridge ships as a proper raised walkway via the v61f3 `platforms` system. The carved channel beneath the deck is 2u below bank grade; the deck sits at bank grade and the player walks AT bank grade when inside the platform footprint, regardless of the terrain Y of the carved channel below. This is a builder-level system — any future raised walkway (Carraig Mór ramparts, Caer Uaigneach wall walks, fortress catwalks) declares a `platforms` spec entry and inherits the override. The v61ez "deferred 3D-platforming system" note is resolved.

### The river — physical structure (added v61f2)

The Dearg's crossing at Droichead is implemented via the v61f2 `cfg.river` carve system. The terrain mesh itself dips into a 4u-wide flat-bottomed channel running N-S at x:42..46 with 1u sloped banks on either side (full carve region x:41..47, depth 2u below bank-grade). Water mesh sits 0.5u below bank-grade, giving 1.5u of visible water depth with 0.5u of dry bank lip above the waterline. Invisible sol-blockers along the bank tops prevent the player from walking into the channel except at the bridge corridor (z:28-32) or Tadgh's dock (z:41-45 west bank only).

The river is canonically deeper here than the player can wade. Tadgh's skiff (or the bridge) are the only ways across. This is consistent with the Dearg's lore as a working spine river — variable in width along its course but always a real water obstacle requiring infrastructure to cross.

### Tadgh's dock and skiff (added v61ez; rebuilt v61f2–v61f6)

Small wooden platform on the river's west bank at z:42..44 (centered around z:43), just south of the bridge. With the v61f2 river-carve in place, the dock sits ON the bank top (east edge at x:41) rather than extending through a cliff-face gap into the riverbed (the v61ez cliff-faces are gone — the carved terrain is the bank-and-channel geometry now). A single moored skiff sits in the channel at x:44, tied to the dock by a short mooring rope; a single oar rests across the gunwales. Tadgh stands on the dock or on the bank just inside it, facing the river. The dock is canonically functional but the player cannot board the skiff — Tadgh's trade is at the dock, not on the water.

---

## Act I quest chain (Q0–Q7)

All quests are voiced, scripted, playtested. The chain is a deliberate structure: wake without memory, prove yourself, gather evidence, hand off from village to city, lose the village, deliver the evidence.

0. **Q0 — Out of the Dark.** Tutorial. Wake in the Crypt of First Light, escape to the south road, find Ashenmoor. Reward: 50 XP. autoComplete via `enter_zone:overworld`. Bridges into Q1 via the smoke-and-hammer-sign hook.
1. **Q1 — First Blood.** Bram. Kill five enemies in The Dungeon of Shadows. Reward: 50g, 120 XP, Iron Sword. *Subtext:* Bram is testing the player before sharing what he knows.
2. **Q2 — Strange Markings.** Edna. Go back to the Shadows, reach floor 2, confirm the sigils still exist. Reward: 80g, 200 XP, Greater Potion ×2. *Subtext:* Q2 is a confession. Touching the floor-2 sigil is the moment Varek becomes aware of the player.
3. **Q3 — The Merchant Knows.** Corwin. Carry Edna's account to Ironhaven and find Aldwyn. Reward: 100g, 180 XP, *Of Binding Stones*. *Subtext:* Corwin has been watching for someone capable enough to be useful to Aldwyn.
4. **Q4 — The Crypt of Embers.** Aldwyn. Go to the Crypt, reach floor 2, report the state of its sigils. Corruption is *recent*. Reward: 150g, 350 XP, enchanted ring. *Subtext:* Aldwyn needs physical confirmation of sigil degradation. Cannot go himself.
5. **Q5 — Lord Caldric's Commission.** Captain Brynn. Clear eight enemies on floor 2 of The Vault of the Tide. Reward: 300g, 600 XP. *Subtext:* Caldric reacting to Aldwyn's report. Won't act officially.
6. **Q6 — The Binding Stone.** Aldwyn. Clear 20 enemies from any Ironhaven dungeon. Reward: 500g, 1000 XP, Aldwyn's Seal. Aldred's name deferred to Q7.
7. **Q7 — The Rubbing.** Bridges Acts I and II. Triage Bram (dead), Brother Oswin (alive), Edna (wounded). Carry Edna's charcoal rubbing to Aldwyn. Reward: Royal Mage Commission.

**End of Q7 state:** Player has the Royal Mage Commission, Aldred's name (and Varek's), The Forge-Man's Hammer. Has lost the starting hub. Is in Ironhaven. Has been told to rest tonight.

All Q7 popup texts and Aldwyn's customActiveDialog are in `quest_writing.md`. Q1–Q6 readyText/completeText are still pending a writing pass.

---

## Act I climax — the burn

**Canonical structure:** Act I ends with Q6. **Between Acts I and II**, Ashenmoor burns. This is Varek's first overt action, not the climax of the quest chain. The burn is the *separating event* — the player leaves Ironhaven with the seal and a promise, comes home to find their village in ruins, and then returns to Aldwyn with evidence that advances Act II.

**Mechanics — as shipped.** Scripted aftermath, not interactive defense. Trigger: first re-entry to overworld after Q6 completes. Player arrives to animated smoke columns, charred building husks, scorched ground, ambient silence (no music track plays).

The lore-canonical fates and the Q7 four-stage structure are documented in detail in the *Burned Ashenmoor* section of `quest_writing.md`. Briefly:

- **Bram** — dead. Carries **The Forge-Man's Hammer**, his final piece of work.
- **Edna** — wounded, alive, inside her damaged-but-standing cottage. Holds the Q7 quest chain.
- **Brother Oswin** — alive, sitting at the altar of the damaged-but-standing oratory.
- **Corwin, Mira, Barnaby, Tom, Finn, Pip** — fled east to Ironhaven in two waves.
- **Sera** — fate offscreen. Edna watched her fight; she did not see her after.

**The Act I reward — Royal Mage Commission.** Handed over by Aldwyn at Q7 turn-in. Countersealed by Lord Caldric. Gates institutional affordances:
- **Wired (v61x):** Dagna's back-room stock at Ironhaven's War Supplies — Master-tier elixirs.
- **Wired (v61d9):** Royal-network road access. Pre-commission, four boundary roads are physically closed to the player — Ashenmoor's western gate to the coastal arc, Hearthwick's eastern gate to the Bealach branch, and both of Ironhaven's outgoing royal roads (north and east). At Q7 turn-in, all of them open at once. The world the player can walk grows from 8 zones to 35. This is the mechanical expression of the line "the road is closed to those without royal commission" — the commission is a literal seal that opens institutional roads.
- **Planned:** Carriage-masters on uncatalogued royal routes (now slots naturally on top of the v61d9 gating — destinations a carriage-master shows are the Tier 1 zones the player has already discovered).
- **Planned:** Academies of the Norman line must admit the player (Act II).

The two-tier world (pre-commission Tier 0 corridor / post-commission Tier 1 royal network) is now the canonical structure. Future tiers (a Tier 2 mid-Act-II beat, a Tier 3 capital approach) layer on top of the same `guard` field architecture.

---

## Geography

### Real-world inspiration

- **Act I geography:** Irish/Wicklow — intimate scale, rolling hills, river valleys, coastal access. Half a day's walk between zones feels completely believable.
- **Act II geography:** Expands northward into Scottish Highlands aesthetic — darker, colder, more granite and heather. Zones become more dispersed.
- **Act III geography:** Somewhere that doesn't look like either. The place beneath all the dungeons.

The world uses an **escalating scale model**: Act I zones are tight and close. Act II opens up. Act III is somewhere remote and unreachable by normal means.

### The six regions

The world is divided into six named regions. Each is a geographic and thematic cluster containing its own settlements, road nodes, and dungeons. Regions overlap with the roads and nodes they contain — they are not hard borders, they are felt zones.

**The Windward Coast** — far west.
Settlements: Carraig Mór · Salthaven · Inis Rua.
The oldest-named coastline. Irish-register settlements. Fiercely independent. No lord's authority reaches here effectively. Faces the Windward Sea.

**Deepwood Forest Region** — southwest to center-west.
Settlements: Ashenmoor (destroyed) · Redwater Ford · Hearthwick · Cill Beag · Droichead.
Road nodes: The Thorngate · Deepwood Forest (traversal hex) · La Porte Grise.
POIs: The Ashfeld (battlefield, Varek's first-meeting site).
The main Act I region. *An Bealach Mór* runs through it north to south.

**The Ferrous Reach** — center-north.
Settlements: Ironhaven · Mur Pierre · Colmán's Rest · La Grise · Vieux Marché.
Road nodes: Mountain Approach.
The Act I/II hub region. Ironhaven anchors it politically. The Ferrous Mountains form its northern wall. *La Route Royale* begins here heading east.

**The Hollowed Wastes** — dead center.
Settlements: None.
Waypoints: Hermit's Camp · Caer Uaigneach (plague village).
The dead zone. No roads run through it — only the dangerous Wastes Path, an unofficial track with no signage. Deliberately vast (500×500 target). Emptiness is the point. (See *The central mystery* — preserved meaning as monument to atrocity, not metaphysical phenomenon.)

**The Greywood** — center-east.
Settlements: Dunmore (hub).
Forested zone east of the Hollowed Wastes. Dunmore commands the crossroads connecting *La Route Royale* south to the Gilded Coast and west back toward the main network.

**The Gilded Coast** — far east.
Settlements: Coeur de Vie (capital) · Portclare.
The capital's territory. French-register names. Wealthy, coastal, self-important. Connected to the Ferrous Reach via *La Route Royale* and to the Greywood via the coastal road through Portclare.

### Cardinal layout
- Windward Coast: far west, ocean-facing.
- Deepwood Forest Region: southwest to center-west (contains Ashenmoor).
- Ferrous Reach: center-north (Ironhaven + mountains).
- Hollowed Wastes: dead center.
- Greywood: center-east.
- Gilded Coast: far east, ocean-facing.
- Ferrous Mountains: northern border of entire map, impassable.
- Southern Sea: south of Ashenmoor and Redwater Ford.
- Eastern Waters: east of Coeur de Vie.
- The Windward Sea: west of the Windward Coast.

### Roads

**An Bealach Mór** — Irish: "the great way." The main north-south road. Bram calls it by its full Irish name. Common people call it "the Ballagh." Capital administrative documents still write *An Bealach Mór*, which irritates everyone.

**La Route Royale** — French: "the royal road." Connects Ironhaven to Coeur de Vie. Locals call it "the Royal" with varying degrees of irony. Varek would note that no one royal has walked it in forty years.

### Zone gates

**The Thorngate** — Anglo-Saxon. North gate out of Ashenmoor into the Deepwood. Named for the thornbush that has been growing over it for decades. Slightly neglected. Nobody has trimmed it back because doing so would feel like an admission that things are getting worse. *(v61e1: Promoted from map-only POI to a small walled outpost zone. Garrisoned thinly — three guards now where six used to be. Warden Edwin, posted eleven years and not expecting orders, runs the road-warden's stock: cheap rations, basic gear, nothing fine. Anglo-Saxon-coded commoner register matches the worn-improvisation feel of the place.)*

**La Porte Grise** — French: "the grey gate." East gate out of the Deepwood into Ironhaven's region. Named by whoever built Ironhaven's administrative infrastructure. Sounds official, feels cold. *(v61e1: Promoted from map-only POI to a small walled outpost zone. Properly staffed in the institutional way Thorngate isn't — the kind of place where "papers, please" is muttered. Quartermaster Roland (Norman-French-coded, treats the post as a real career step) runs the royal supply: standardized Mild elixirs, a tier-2 sword, helmet. Reports weekly to Aldwyn at Ironhaven's Royal Herald's office. The two outposts are deliberately written as a contrast pair — Thorngate's cultural inheritance, La Porte Grise's institutional cover-letter.)*

### The Dearg River (An Dearg)

Runs north to south, spine of the map. Settlements cluster along it. The Ballagh follows it. Named in Irish because it is older than every settlement on its banks. The water runs red-brown from the bogland it flows through — rust-colored in the shallows, which makes visitors uneasy and locals shrug.

### Major settlements

**Ashenmoor** — Anglo-Saxon. Village, ~200 inhabitants pre-burn (burned at Act I climax, ~41 souls remaining per the notice board).
- Atmosphere: Rural, slightly anxious. Dungeons are a managed nuisance. Built around Bram's grandfather's forge.
- Notable: Bram's Forge, Edna's Cottage, Mira's Apothecary, Barnaby's Goods, Pip's Curiosities, the Ashenmoor Oratory (Brother Oswin), The Guardhouse (Sera), market square with notice boards, the Dungeon of Shadows old gate (visible from the village).
- Named for: The Ashfeld battlefield to its south. The name predates the village.

**Ironhaven** — Anglo-Saxon. Walled town, ~800 inhabitants. Act I and II hub.
- Atmosphere: Military discipline, stone architecture, political tension.
- Notable: Lord Caldric's Keep, Ironhaven Market, Scholar's Guild, Gatehouse (Captain Brynn), Royal Herald's Office (Aldwyn), 5 interior shops including Dagna's War Supplies, Wulfric's Armory, Sergeant Mord's Barracks.
- Dungeons: 1–3 in the outer ring.
- Post-Ashenmoor: refugee hub. Bram's body found at the burn — no makeshift forge in Ironhaven.

**Carraig Mór** — Irish: "great rock." Coastal town, Act II.
- Atmosphere: One of the oldest inhabited places on the map, predating Anglo-Saxon settlements. Built into coastal rock formations. Fiercely independent.
- Notable: Sea cave dungeons below the rocks ("the Mouth").

**Mur Pierre** — French: "wall of stone." Mountain garrison, Act II.
- Atmosphere: Built by the capital's administration, effectively abandoned by it. Tough, self-reliant, resentful of Coeur de Vie.

**Dunmore** — Irish: "great fort." Walled town, Act II hub. The Greywood region.
- Atmosphere: Older and less polished than Ironhaven. Commands the crossroads between *La Route Royale*, the coastal road to Portclare, and the Wastes path exit.

**Portclare** — Anglo-Saxon/Irish: "port of the plain." Fortified harbor town, Act II–III. The Gilded Coast.
- Atmosphere: Mid-sized, between Dunmore and Coeur de Vie. Acts as the southern gateway to the capital's territory. Air of a place that used to matter more.

**Coeur de Vie** — French: "heart of life." The capital. East coast. Act II–III.
- Atmosphere: Wealthy, coastal, self-important, deeply invested in not asking hard questions. The Royal Mages that never arrived came from here.
- *Irony:* Named "heart of life" while the actual center of the map is dying.

### Minor settlements

**Hearthwick** — Anglo-Saxon. Road waypoint midway between Ashenmoor and Ironhaven on *An Bealach Mór*. Best inn on the road, run by Oda — thirty years of rumors, priced accordingly. No dungeon nearby, which is unusual and comfortable. (Built; light NPC roster.)

**Redwater Ford** — Anglo-Saxon. South of Ashenmoor where the Dearg runs rust-red over pale stone. Mostly farmers. The red water makes visitors uneasy; locals stopped noticing.

**Droichead** — Irish: "bridge." Where *An Bealach Mór* crosses the Dearg, between Ashenmoor and Ironhaven. The bridge is too well-made for a village this size — nobody remembers who built it. A ferryman sells information. The bridge's keystones have markings that resemble sigils.

**Cill Beag** — Irish: "small church." Grew up around a half-ruined stone oratory. The priest is de facto mayor. Has an uneasy relationship with a dungeon old gate two miles east that everyone pretends isn't there.

**Salthaven** — Anglo-Saxon. Small harbor north of Carraig Mór. More commercially oriented. Where the fishing catch gets processed and shipped east.

**Inis Rua** — Irish: "red island." Small tidal island west of Carraig Mór, reachable only by ferry when the tide is out. Fiercely independent — the sea owns them twice a day. Exactly one dungeon entrance in a sea cave locals call "the Mouth" (Carraig Mór register: *Béal an Domhain*). The "red" of Red Island is iron-rust runoff from the rock — Niamh, the Keeper of the Mouth, names this in plain register: "the rock has iron. The rain comes." *(Implementation note: tidal mechanic shipped v61d7, reframed v61ew from causeway to ferry, full village built v61ey — see § Inis Rua below.)*

**Colmán's Rest** — Irish personal name + Anglo-Saxon "rest." Named after a traveler who died here in the first winter of settlement. Descendants never left. Has a shrine. Only foothill settlement not focused on mining — a farming village that ended up in the mountains almost by accident.

**La Grise** — French: "the grey one." Mining camp that became permanent. Supplies Mur Pierre. Workers from the capital's indentured labor system — resent Coeur de Vie, paid by it. Ore near the dungeon shafts has strange magnetic properties.

**Vieux Marché** — French: "old market." Market town that predates *La Route Royale* — the road was built to reach it. Outsized sense of its own importance. Information from Coeur de Vie arrives here first.

### Points of Interest

**The Ashfeld** — Anglo-Saxon. Ancient battlefield south of Ashenmoor between Redwater Ford and the village. Flat, overgrown, the particular silence of a place where many people died quickly. **Site of the first meeting with Varek.** He comes here regularly — there is a worn path through the grass to where he stands. Possibly the origin of Ashenmoor's name.

**Ancient Observatory** — northeast of Ironhaven. Pre-settlement structure on a low hill. Apertures align with astronomical events. Stone tablets inside use a script that predates any known language — the same script as the deepest sigils. Aldwyn has visited dozens of times. He still cannot read it.

**The Standing Stones** — deep in Deepwood Forest. A circle of tall standing stones older than the forest itself — the trees grew around them rather than through them. Touching the central stone restores a small amount of mana. Locals call them the Watchers. Nobody goes there at night.

**The Hermit's Camp** — western edge of the Hollowed Wastes. A single figure lives here in a camp made of salvaged dungeon timber. Has been here longer than anyone in surrounding villages has been alive. Does not give their name. Will trade information for silence — wants to hear nothing of the outside world, only what the player has seen underground.

**Caer Uaigneach** — Irish: "lonely fort." Former village of 300 inhabitants, southern Wastes edge. Something came up from the dungeon beneath it fourteen years ago — not a creature, something else. Half the village left overnight. The other half stayed. Nobody has heard from the half that stayed in eleven years. The buildings are still there. Fires are sometimes seen at night. (Lore-canonical: localized anchor failure from over-clearing, predates Varek's operation by a century.)

**The Sunken Mine** — eastern foothills. Old copper mine abandoned when lower shafts broke through into something that wasn't natural rock. Equipment still there. So is whatever stopped the miners. A faint light is occasionally visible from the main shaft at dusk.

**The Greenmeadow** — east of *An Bealach Mór*, north of Hearthwick. A broad clearing where heartroot, firemoss, and silverleaf grow in unusual concentrations. Soil is darker than surrounding land. Plants grow slightly too large. Edna says the meadow has been this way since before she was born. It is directly above a dungeon network.

**Greywatch** — *Ruined watchtower in the An Bealach Mór North Approach corridor between Droichead and the Thorngate.* The first **fort-class landmark** placed in the world (Session 40). A three-tier broken stone tower at the back of a ruined courtyard, perimeter wall mostly intact in segments, a slumped gate-arch where the south gate used to stand, fallen lintel inside, banner pole gone over, dry well, scattered rubble. Bandits occupy the courtyard and surrounding approach — four total, two outside the perimeter as sentinels and two within. Players approach via a worn side path off the main road that leads through the gate-arch and across the courtyard to a heavy wooden door at the tower's base. The door opens into a procedural dungeon interior (theme: ruins, difficulty: easy, Act I appropriate).

Held lore-light by design — "old, abandoned, locals call it Greywatch." No faction commitment, no Aldred/Varek tie. The geometry pre-commits to nothing. Future in-game books can reach for the name if they want; canonically it is what it appears to be: a frontier outpost long since failed, reclaimed by people who don't want to be found.

**The Old Garrison** — *Ruined gatehouse in the An Bealach Mór Central corridor between Hearthwick and Droichead.* The second fort-class landmark (Session 40). A different exterior style from Greywatch — two squat flanking towers with crenellations spanning a heavy double door, short curtain-wall stubs to either side suggesting more wall long since collapsed. Same procedural-dungeon interior (theme: ruins, difficulty: normal). Stands as a sibling site to Greywatch — same model of "wilderness fort with door to procedural interior," different visual flavor. Together they establish that **the landscape between settlements is populated by structures, not just road.**

Held similarly lore-light. No name beyond the canonical "Old Garrison." If the system fills out (palisades, monasteries, earthworks, single-keep blocks across other regions), each will be similarly lore-neutral — variety as worldbuilding, individual sites as atmosphere rather than canon-load-bearing.

### The fort-class landmarks (added v61f9, Session 40; expanded v61f16, Session 41)

A new category alongside Points of Interest. Fort-class landmarks are **wilderness structures with procedural dungeon interiors** — built-stonework exteriors visible from the road (sometimes accessible via side paths), with heavy doors that open into procedurally-generated dungeons. The architectural model treats the exterior as *signage* (this is a place; something is here) and the interior as *content* (procedurally generated, theme/difficulty tuned to the surrounding zone's act tier).

The system supports multiple exterior styles, each with its own silhouette so the player can recognize the type from a distance:

- **Watchtower** (Greywatch) — three-tier stone tower at the back of a ruined courtyard with perimeter wall, gate-arch, fallen lintel, banner, dry well. Reads as a remote frontier outpost, deeper failure.
- **Gatehouse** (Old Garrison) — twin crenellated towers flanking a heavy door with curtain-wall stubs. Reads as a former checkpoint on a road, more recently abandoned.
- **Palisade** (The Last Post — Session 41) — wood register. Pointed-log fence ring with a south gate, canted watch-platform on a tall pole, small log gatehouse cap above the door, courtyard with a crate and tipped barrel. Reads as a recent failed king's-frontier post, distinct from all the stone forts.
- **Monastery** (The Wind Cloister — Session 41) — abandoned cloister: tall stone remnant wall with a pointed arch above the door, low cloister stubs fanning east and west, a single carved stone cross 2.5u tall in the courtyard, fallen pews. Norman austerity, no crenellations. Reads contemplative rather than military.
- **Earthwork** (The Old Mound — Session 41) — concentric earth berms with sod caps, palisade fragments on top of the inner berm, stone retaining slabs at the door cut, weathered cairn-stones at the base. Predecessor-culture Irish register — oldest-feeling fort form, reads as Iron-Age hillfort rather than later stonework.
- **Keep** (Pellam's Hold — Session 41) — single squat 4.4×5.0×4.0 stone block, heavy iron-banded door dead center, two narrow arrow slits flanking it high on the wall, dark capstone trim with sparse corner crenellation stubs, a faded banner hung above the door. Smallest footprint, most imposing per square meter. Reads "lord's holdfast, retreated to."
- **Ruined gatehouse** (Hollow Gate — Session 41) — gatehouse variant. One tower intact, one tower fallen to a 1u stub with rubble heap east of it, lintel sags toward the collapsed side, curtain wall on the collapsed side replaced with rubble. Same family silhouette as Old Garrison, dramatically different state.
- **Watchtower canopy** (The Lonely Tower — Session 41) — watchtower variant. Same three-tier tower silhouette, but **no perimeter wall, no gate-arch, no courtyard furniture**. Used for fort placements where dense surrounding canopy reads as the natural perimeter and an open courtyard would feel wrong. The dense forest IS the perimeter.

These structures are deliberately distinct from the three-anchor mythology of the Crypt of First Light / Crypt of Embers / Vault of the Tide. The fort interiors are not dungeons in the canonical anchor sense — they are spaces some kingdom built and then lost. Their procedural interiors are themed `ruins` (or per-fort variants — `goblin`, `haunted`, `undead`) rather than carrying any of the deep-bound lore. This separation matters for the central mystery: anchor sites are unique, named, and load-bearing; fort sites are common, replaceable, and atmospheric.

**Session 41 placement table** (eight forts total: two from Session 40 + six new):

| Fort | Zone | Exterior | Theme / Diff | Region |
|---|---|---|---|---|
| The Old Garrison | bealach_central | gatehouse | ruins / normal | Bealach |
| Greywatch | bealach_north_approach | watchtower | ruins / easy | Bealach |
| The Last Post | wastes_east | palisade | goblin / normal | Wastes |
| The Wind Cloister | mountain_pass | monastery | haunted / hard | Foothills |
| The Old Mound | coastal_road_north | earthwork | undead / normal | Royale |
| Pellam's Hold | la_route_royale_west | keep | ruins / normal | Royale |
| Hollow Gate | northern_road | ruined_gatehouse | goblin / normal | Foothills |
| The Lonely Tower | forest (Deepwood) | watchtower_canopy | haunted / easy | Deepwood |

**Naming register (canon-locked).** All eight names use folk-usage Anglo-Saxon register — no king, no order, no dated fall, no Ald- prefix (load-bearing per § Personal-name conventions). Pellam's Hold's Anglo-Saxon lord name surviving on a Norman-French road quietly says "predates the road" without ever needing the player to know that — same trick as Bram's *An Bealach Mór*. The Wind Cloister names what is left of a building, not its founder. The Old Mound names what it physically is. These are the names *living locals use*, not the names history would have given.

**What is NOT settled by these placements.** Fort interiors. Session 41's exterior-first ship deliberately did NOT touch the procedural-dungeon generator — forts currently use the standard `makeDungeon` algorithm (random rooms + L-corridors), which reads cave-like rather than fort-like. The next ship (Session 41 follow-up) is the fort interior generator: trunk-and-wings symmetric layout, doored rooms at regular spacing along wide hallways, templated room types (Great Hall, Barracks, Armory, Kitchen, Lord's Chamber, Chapel, Cellar, Guardroom, Storeroom), Battlehorn-Castle-but-abandoned register. The current interior-vs-exterior register mismatch is the intentional playtest gap that drives the next ship.

### The road north (Ashenmoor → Ironhaven) — built zones

Five fully-built zones forming the playable Act I traverse:
1. **Ashenmoor** (settlement)
2. **An Bealach Mór — South** (wilderness, plains)
3. **Hearthwick** (small village, light NPC roster)
4. **The Deepwood** (wilderness, forest)
5. **Ironhaven** (walled town)

Each reveals on the world map only when entered (v61b7 walked-only fog system). No reveal-ahead. Adjacent gate edges show as faint road labels through the fog so the player has orientation without spoilers.

### Placeholder zones (Acts II/III)

32 placeholder zones registered via `registerPlaceholderZone`. They appear on the map after walking, have proper IDs/connections, but the geometry is generic (flat plane with banner). Built as quest content lands.

**Act I placeholders:** Redwater Ford, Salthaven, Carraig Mór, Droichead, Cill Beag, plus connecting wilderness segments.

**Act II placeholders:** La Grise, Colmán's Rest, Mur Pierre, Vieux Marché, Dunmore, Portclare, plus connecting wilderness segments. *(v61ey: Inis Rua moved off the placeholder list — fully built with Niamh + Fionn + the Mouth.)*

**Act III placeholder:** Coeur de Vie (capital).

### The Ashfeld — placement (resolved Session 27)

The Ashfeld is **physically on the south road from Ashenmoor**, between the village and Redwater Ford. Walking south from the burned village, the player passes through the South Road wilderness segment, then through The Ashfeld, then arrives at Redwater Ford. There is no detour or side-path — every player going to Redwater Ford for any reason walks through the battlefield.

This placement makes the line *"possibly the origin of Ashenmoor's name"* read in the geography itself: Ashenmoor sits directly north of the Ashfeld; the village is named for the burned ground to its south. The ash is not a metaphor — it is a place the player walks across.

The implication for Varek's first on-screen appearance: he is encountered on the road *home*, on land that gives the village its name, on terrain whose meaning the player can read. The "Ashfeld Road design" open question (where is he, what is the player doing there, what does the player see) collapses partially — the road is the south road; the player is walking it for any post-Q7 reason; what they see is the battlefield they've already crossed dozens of times, with him standing on it.

What stays open: when in Act II does the encounter trigger, what specifically he does to mark the place as different that day, whether the encounter requires a quest hook or fires on proximity. Held for a future session.

### Dungeon zones

Each dungeon has a `theme` (undead, goblin, elemental, deep, haunted, ruins) which drives procedural enemy rosters and atmosphere. Dungeons aren't randomly placed — they are fixed points in the world, defined in `WORLD_DUNGEONS`. The anchor system narrative justifies this: they cannot move, because they are what the world is tied to.

---

## In-world documents

### The six skill books (v54)

Found in chests. Each is a read-once skill book in the Oblivion model: first read grants +1 to an attribute, the book is consumed, the prose stays available on subsequent reads for lore value.

- **The Forge-Man's Third Treatise** — +1 Might. Written by a previous blacksmith of Ashenmoor in his thirty-seventh year at the forge. Ashenmoor's forge-men don't sign their personal names — only the title.
- **The Stoic's Rampart** — +1 Fortitude. A soldier's collection. Copied from a garrison manuscript at Mur Pierre.
- **The Fletcher's Hand** — +1 Finesse. Apprentice-level precision-work notes.
- **The Wind's Account** — +1 Swiftness. Journals of a courier of the northern roads.
- **Of Binding Stones** — +1 Intelligence. Academic draft by Aldwyn, "not for circulation outside the Royal Herald's office." Q3 quest reward — the player gets it before the person who wrote it hands them the full picture in person.
- **Letters from Ashwold** — +1 Resolve. Correspondence between an unnamed healer-teacher and her young student. Soft foreshadowing for Edna; the voice is older, tired, warm. Seventy-one winters counted.

### Named artifacts

- **The Forge-Man's Hammer** — Bram's last work, recovered from his body in the burned Ashenmoor. Tier-3 blunt weapon, above-baseline damage range (11–17). Custom smith's-hammer viewmodel with a stamped forge-man's mark. *Naming convention note:* *The Forge-Man's* prefix ties to the skill-book tradition. The hammer isn't signed; Bram made it recently and didn't live long enough to engrave it.
- **Aldwyn's Seal** — Q6 reward. Wax seal of the Royal Mage Corps. Functions as a recognition token paired with the name *Aldred*.
- **Edna's Rubbing** — Q7 quest item. Thirty-year-old charcoal rubbing of a sigil from the Shadows' second floor.
- **Royal Mage Commission** — Q7 reward. Sealed letter of commission from Aldwyn, countersealed by Lord Caldric.
- **Crypt Key** (tutorial) — single-use unlock for the tutorial dungeon's locked door. Not retained in inventory after use.

---

## Story structure — current state

### Act 0 — The Crypt of First Light (shipped v61aw–v61c1)

Tutorial. Player wakes in a stone sarcophagus, fights three skeletons, finds the Crypt Key, exits to the south road into Ashenmoor. ~5-6 minutes of gameplay. First Varek meta-thread plant in the `_awakening` line.

### Act I — The Thread (shipped, Q1–Q6 complete)

Q1 → Q6 follows the thread Bram → Edna → Corwin → Aldwyn → Brynn → Aldwyn. Reveals the existence and purpose of sigils, the three anchor sites, the evidence of active corruption, and the villain's former name: Aldred.

### Act I climax — The Burn (shipped v61ad–v61an)

Ashenmoor burns. Q7 "The Rubbing" bridges the acts.

### Act II — The Widening Dark / The Unraveler (partially scaffolded)

Player has: name Aldred, the seal, Aldwyn as ally, Royal Mage Commission, The Forge-Man's Hammer, no starting hub. Ironhaven as primary hub. Varek's first on-screen appearance expected on Ashfeld Road.

Ironhaven absorbs the refugees. Lord Caldric finally meets the player. He and Aldwyn are in open conflict: Aldwyn wants to seal the remaining sigils, Caldric wants to understand and potentially weaponize what's emerging. New zones open. Dungeons get deeper and stranger.

The player finds evidence in the deep chambers: the sigils aren't just decaying — someone has been deliberately etching over them, undoing them stroke by stroke.

Corwin resurfaces — changed. He survived Ashenmoor by going into the dungeon rather than away from it. He saw something. He won't say what directly. He knows who the Unraveler is. The player is the first person he's told.

**Act II Climax:** The player reaches Varek at The Ashfeld. The reveal recontextualizes everything. The player must choose: stop him, help him, or find a third path. This choice determines Act III branches.

**Planned Act II opening affordances:**
- ✅ Royal-network road access (shipped v61d9). Pre-commission, four boundary roads are physically closed; Q7 turn-in opens them and the walkable world expands from 8 zones to 35. The "world gets bigger" beat is the Q7 reward made literal.
- ✅ Lord Caldric-granted safehouse with stash + bed-rest (shipped v61d4-v61d6).
- Commission-gated carriage-master fast-travel — slots naturally on top of the v61d9 gating; carriage destinations are the Tier 1 zones the player has discovered.
- Wilderness travelling merchants.
- Academies opened to commission-bearer.

### Act III — The Unmaking / What Was Bound (not yet designed)

Depending on Act II choice: the binding fully collapses and something emerges, or the player races to reseal it. Either path leads to the same final zone — the place beneath all the dungeons where the original binding was made.

The central mystery is resolved in-fiction. Three possible endings shaped by Act II choice and NPC survival states (Aldwyn alive/dead, Caldric's agenda succeeded/failed, Corwin's secret shared or kept).

The final confrontation ends not with combat but with revelation — see Varek's Final Monologue in `quest_writing.md`.

Endgame: procedural town generation unlocks, bounty board quests, randomized dungeons for gear grinding.

---

## Open narrative questions (priority-ordered)

1. ~~**Regional identity per spoke.**~~ **Resolved (Session 29, v61e4) as a system.** A `REGION_PROFILES` table now defines six regions (`coastal`, `bealach`, `foothills`, `royale`, `wastes`, `ashen`) and every wilderness/settlement/town zone declares its region tag. The system controls: sky color, fog color, fog density, biome (a new `wastes` biome ships alongside `coast`), music track, and a `propScatter` array of decorative meshes. 14 prop builders ship — driftwood, rope coils, seaweed (coastal); cart wheels, milestones, wheat stacks (bealach); stone cairns, dry-stone walls, ore piles (foothills); royal markers, wayside shrines (royale, plus shared milestones); dead trees, ash piles, bone piles (wastes); broken blades, low cairns (ashen). Per-zone overrides still win against region defaults — Inis Rua keeps its bespoke extreme palette. **Open follow-up work:** signature NPCs per spoke are still pending — Áine + Cuán + Maire done for Carraig Mór in v61eu (Session 37); Hilda + Wystan + Aelflin + Brand done for Salthaven in v61em; Tadgh + Bree done for Droichead in v61ez (Session 38). Bealach (Cill Beag), Foothills (La Grise/Mur Pierre), Royale (Vieux Marché), Wastes (the hermit) still need voicing. Encounter mix per spoke deferred until day/night system lands.
2. **Day/night cycle.** **(All three sessions shipped — Sessions 29 + 30, v61e6 + v61e7/e8 + v61e9. Trilogy complete.)** Session A (v61e6) shipped the clock foundation: `worldState.gameTimeMinutes` advances at 1 in-game minute per real-second, persisted to save, paused with UI-open. Helpers `gameHour()` / `gameTimeOfDay()` / `forceTime()` available for downstream systems. Tide system ported off `performance.now()` — the canonical "twice a day" framing is now literally true (low tide hours 0-6 and 12-18, high tide 6-12 and 18-24). **Three Q7 cinematic time-locks now canonical:** the burn forces dawn (lore-canonical morning-after); Q7 turn-in at Aldwyn forces evening (Aldwyn's "you should rest tonight" is now literal); Caldric grant scene forces evening (tonally aligned). Q1-Q6 remain time-agnostic. **Session B (v61e7 + v61e8 hotfix) shipped lighting interpolation + sundial UI + sleep advance.** The world now visibly transitions between day and night across all outdoor scenes via per-second lerp through the dawn (5-7) and dusk (17-19) windows. Sundial glyph at top-center HUD shows time-of-day continuously (sun arcs above horizon during day, moon below at night). Resting at the safehouse advances 8 hours. Burned Ashenmoor stays locked at its forced-dawn palette regardless of clock advance — the burn reads as a frozen tomb (lore canon § The Burn demands "scorched ground, ambient silence, no music"). **Canon shipped Session 30:** the Hollowed Wastes-at-night reads as *the place the sun gave up on* — near-black sky (`#0a0808`), charcoal-warm fog 55% denser than day, faintly violet ambient that says "this is night, and night here is wrong." Carraig Mór-at-night reads as moonlit silver-blue — deep blue sky (`#1a2438`), cool slate-blue fog with silver undertone, cool silver-blue moonlight per the canonical "the sea owns them twice a day" line. Settlements share a single universal-village-warm night palette regardless of region (lit-windows-and-smoke register, distinct from wilderness). **Session C (v61e9) shipped spawn modulation + NPC retreat + respawn + Wait button.** Night wilderness now reads denser — 1.5× spawn density baseline, with `nightOnly` / `duskOnly` / `dayOnly` filter flags on individual spawn entries (encounter content fills in across follow-up sessions). Settlement NPCs retreat indoors at night (post-Q7 only — Q1-Q6 stay unbothered). Per-zone respawn at 24-in-game-hour threshold; re-roll fires on zone re-entry with subtle log cue ("🌒 The wilds have stirred." / "⏳ Time has passed."). Universal Wait button on the HUD lets the player advance to dawn/morning/noon/dusk/night from anywhere outdoors (blocked in combat / dungeons / open UI). **Day/Night system is feature-complete.** Locked design in `design_notes.md` is now ready for archival; the doc captured the system from pre-design through three implementation sessions across two real-time sessions.
3. **Second hub after Ashenmoor.** Hearthwick / Redwater Ford as small Act II rest stop, or just route everything through Ironhaven? Lean toward elevating one to a proper second hub. **Constraint added Session 27:** Ironhaven is now strongly anchored as the *Toontown Central* of Act II — the hub all royal-network spokes radiate from. If a second hub is added, it should serve a different purpose (a refuge, a frontier post, a pilgrimage site) rather than competing functionally with Ironhaven.
4. ~~**Ashfeld Road follow-on design.**~~ **Resolved (Session 38, v61ez) as canon decision.** Trigger: the player's first Mastery-tier comprehension achievement fires Varek's appearance at The Ashfeld. Mechanism: when the player crosses into Mastery on any spell, a worldState flag is set; the next time they enter the South Road or Ashfeld zone, Varek is present. Ties cleanly to the Mouth (which contains the canonical first Mastery sigil) — Mouth-trigger and Ashfeld-trigger become one design. Implementation deferred to the Mouth-hookup session; the canon decision is locked. See § The Mastery-touch as the Varek-meeting trigger.
5. **Academy arc expansion.** Commission now grants academy access. The Academy as an institution that refuses to admit the register it disciplined out of its own practice — Q4b or an Act II hook.
6. **Sera's fate.** Left deliberately ambiguous in the burn. Candidate for a small Act II reveal — alive in Ironhaven with a story, or dead somewhere on the Ironhaven road.
7. **Oswin's arrival in Ironhaven.** Natural destination: Sister Aveline's chapel. Whether single background-presence beat or a small Act II "two recordkeepers meet" scene.
8. **Phase 2 sigil placements.** 31 sigils to place across the world. Each needs a carving location and an Irish name. Roll out zone-by-zone as Act II zones come online.
9. **Varek meta-thread continuation.** Tutorial planted the seed. Where do we plant the next one? Candidates: a moment in mid-Act II where Varek demonstrates knowledge of a player-specific decision; an inscription that reads as if addressed to "you" specifically; a glance from an NPC who shouldn't be looking at the player but is, briefly, before the moment passes.
10. **The Unraveler's evidence trail.** What physical objects does the player find in deep chambers in Act II?
11. **Lord Caldric's endgame.** Ally, obstacle, or more ambiguous. Whether he knows about the sigils. (Session 26 grant scene seeded the asset-framing tilt — Aldwyn vs Caldric tension is now planted as subtext via Caldric's "I prefer contracts" closing line. Open conflict still scheduled for Act II.)
12. **The capital.** Does the player ever go to Coeur de Vie? If so, when and why? *(Session 27 note: Coeur de Vie is currently reachable post-commission via a continuous walkable path. This is acceptable as a temporary state since the placeholder zone has no content, but a Tier 3 gate on the Capital Road approach should land before Coeur de Vie has anything worth finding.)*
13. **Corwin's full backstory.** What is his history with Aldwyn?
14. **More named antibodies.** The Faolchú is the first; the canon now establishes named antibodies as a CATEGORY. Need at least 2-3 more designed for Acts II/III as anchors fail in different settlements. Each should be a regionally-recognized animal shape with seam-failures showing the binding's misfire.
15. ~~**Inis Rua spec — receiving side of the ferry.**~~ **Resolved (Session 38, v61ey).** Full village built — Niamh (Keeper of the Mouth, signature character) + Fionn (fisherman, harbor_supplies trade); three buildings (Niamh's Dwelling, the Net-Shed, the empty Watch-House); north-side dock + ferry boat mirroring Carraig Mór's south side; the Mouth physically present as a sea-cave arch in a built south-cliff face, examinable but not yet walkable as a dungeon. New `rust_stone` ground texture canonizes the iron-rust origin of "Red Island." centerMarker text and WM_NODES desc both updated from causeway to ferry. See § Inis Rua and § The Mouth.
16. **The Rock-Hall's tablet text.** The stone tablet inside Carraig Mór's Rock-Hall (cm3, NE plaza-edge) carries the village's foundation register in carved Irish, partially weathered. Examination text deferred at v61eu — the structure exists physically but no examination beat. Future writing pass: a short Irish-then-English passage establishing how Carraig Mór sees its own founding, in Áine's grandmother's voice if possible. Should resonate with Áine's "we are tenants" line — the tablet is older than her, agreeing with her.
17. **Skybox / horizon polish — coastal villages.** Parking-lot item from Session 37. The current sky-ring at Carraig Mór (and Salthaven) renders the coastal sky-ring variant — gradient sky + low cliff silhouettes + seabirds — but the result reads as serviceable rather than evocative. Candidate improvements: more atmospheric horizon haze, distant island silhouettes (Inis Rua visible from Carraig Mór when it lands?), better cloud rendering, lighting variation by time of day. Held without a specific design direction yet — flag for return when there's more visual reference to react to.

### Resolved

- (Session 46, v61gf–v61gi) **Polish ship — doors swing, library actually spawns and is fully lootable, mobs no longer clip into furniture.** Four ships closed the v61g8 door/SFX/container polish backlog and surfaced a hidden library bug. v61gf restored visible door swing (hinge sub-group rotation, not visibility toggle), rewrote door SFX as weighted multi-stage sounds (~1.2s open / ~0.8s close), restored barrel/crate lid-pop animation (broken since v61g7 container resize), and tightened cluster spacing. v61gg fixed a long-standing zero-library-spawn bug — root cause was LCG correlation across sequential seeds (all canonical fort seeds 7099-7106 produced `r()[0] > 0.833`, freezing the Fisher-Yates first swap as a no-op for whatever sat at array index 5). Library at index 5 → 0/8 forts ever spawned a library. Fix: top-level `hashSeed(x)` helper, all three fort generators now derive shuffle sub-RNGs from `rng(hashSeed(seed))`. v61gh upgraded library bookshelves from decorative meshes to **individually lootable containers** (6 per library, each rolls against the existing `library_chest` pool at 17%-per-shelf density — expected ~1.3 items per library); removed the freestanding chest from libraries; fixed book-spine orientation so spines face the room center on every wall. v61gi made the dungeon enemy spawn filter prop-aware (`dPropHit` + `dColumnHit` added to candidate rejection), so mobs can no longer spawn inside bookshelves, banquet tables, forges, etc. Catalog entry for library updated to reflect the new lootable-shelves register.

- (Session 45, v61g9–v61ge) **Fort interiors feel like buildings — collision, room content, central staircase.** Five iterative ships closed the v61g8 playtest gap. Collision now blocks the player on all furniture (DUNGEON_PROPS[] AABB lookup parallel to DUNGEON_COLUMNS). Chapel pews face the altar. Barracks are proper military bunkhouses — cots head-against-wall, perpendicular to wall, shoulder-to-shoulder, footlocker at the foot. Storerooms got wall shelves and 1-2 chests on top of the v61g8 corner clusters. **Library added as a tenth fort room kind** with bookshelves, a reading table, and a dedicated `library_chest` loot pool (the existing read-once BOOKS plus three new flavor items: Worn Tome, Ink Vial, Quill). **Armory upgraded from "weapon racks" to "working smithy" register** — forge + anvil + smelter + weapon prep table + whetstone. Great Hall gained hutches flanking the banner. Hallway center columns run down the spine of any wide corridor. **The keep's grand staircase** is now a fixed feature at the trunk/cross-hall intersection — free-standing, climbing north toward the Great Hall, 8 steps reaching near ceiling height. Visual only this ship; hooks into a real walkable-upper-floor system in a future arc. Player walking into the fort from the south entrance sees it rising directly ahead at the dungeon's dead center.

- (Session 41, v61f16) **Fort exterior catalog expanded 2 → 8 + six new placements scattered across wilderness → resolved as content using existing systems.** Architectural infrastructure was already in place from Session 40 (`FORT_EXTERIORS` registry, `_spawnFortDoor` helper, `kind`+`exterior` fields on `WORLD_DUNGEONS`, side-path detailFn pattern, zone size + adjacent spawn coord plumbing). This ship populates the system. Four new exteriors + two variants: `palisade` (wooden frontier outpost — pointed-log fence ring), `monastery` (abandoned cloister — remnant wall + cross + cloister stubs + fallen pews), `earthwork` (concentric earth berms — predecessor-culture Irish register), `keep` (single squat stone block — lord's holdfast register), `ruined_gatehouse` (gatehouse variant — one tower collapsed), `watchtower_canopy` (watchtower variant — no perimeter, dense forest IS the perimeter). Six placements: The Last Post (palisade, wastes_east), The Wind Cloister (monastery, mountain_pass), The Old Mound (earthwork, coastal_road_north), Pellam's Hold (keep, la_route_royale_west), Hollow Gate (ruined_gatehouse, northern_road), The Lonely Tower (watchtower_canopy, forest). Three zone bumps (mountain_pass, la_route_royale_west, northern_road all 80-90→200, road spines repositioned, six adjacent-zone return-spawn updates). All eight forts use folk-usage Anglo-Saxon naming register — no canonical specificity, no Ald- prefix. **Open follow-up:** fort interior procedural generator (trunk-and-wings symmetric layout, doored rooms at regular spacing along wide hallways, templated room types, Battlehorn-Castle-but-abandoned register) — explicit deferred work for the next Session 41 ship. The current "built stonework outside, cave-style interior inside" register mismatch is the intentional playtest gap that drives the next ship.

- (Session 39, v61f0–v61f6) **Droichead playtest refinement → resolved.** Six iterative passes through the v61ez Droichead ship surfaced and fixed: (1) notice-board / plaza-prop stacking at every village with a plaza prop, fixed architecturally in `buildVillage` (v61f0); (2) bridge arch geometry — first the rebuild from the v61ez double-rotation bug, then a Three.js trig-convention correction in v61f1, then ultimately deleted in v61f2 because the v61f2 river-carve depth (2u below grade, deck at grade) left insufficient vertical clearance under the deck for an arch to read; (3) the river was structurally invisible — v61ez had built it as a flat water-plane below grade with cliff-block fronts, but the cliffs were buried because the underlying terrain mesh was never actually carved (v61f2 introduces a builder-level `cfg.river` carve system, modifying the heights array before the terrain mesh is built; the river is now a real depression in the terrain); (4) the player was descending into the river when "crossing" the bridge because the engine snaps player Y to terrain Y — fixed by the v61f3 `cfg.platforms` system, which lets `activeTerrainH` override terrain Y inside declared rectangular footprints (forward-compatible for any future raised walkway — ramparts, catwalks, balconies); (5) z-fighting between bridge deck top and terrain mesh at gradeY, fixed by lifting deck-mounted geometry 0.05u in v61f4; (6) trees-in-the-river fixed by extending `_inGap` to include the river-carve footprint in v61f5; (7) keystone redesign from flat slab with painted face to proper carved monolith silhouette (pillar + capstone + plinth + proud carving face + three sigil bumps) in v61f5; (8) skiff repaired — trim torus aligned with hull rim, redundant plank floor removed (v61f5/f6); (9) contradictory keystone examine line removed in v61f5. **Net architectural progress this session:** three new builder-level systems (river carve, platforms, river-aware `_inGap`), all forward-compatible for future villages. Droichead's lore and dialog are unchanged — same Tadgh, same Bree, same canon — only the physical geometry was rebuilt around the new systems. See updated § Droichead, § The Bridge — physical structure, § The river — physical structure (new), § Tadgh's dock and skiff.
- (Session 38, v61ez) **Droichead speced and built** → resolved. Bealach-region's signature road-stop bridge village. Two voiced NPCs (Tadgh, Ferryman / information broker, as signature character + Bree, Wagon-Stop trader), three buildings (Tadgh's River-Hut, Bree's Wagon-Stop, the empty Old Cottage), and the canonical anomalous bridge made physical with two examinable carved keystones, low stone railings, and abutment posts. The Dearg river bisects the zone N-S in the eastern third. The bridge ships as a stone deck spanning the river with the player walking across at bank-grade. Tadgh's southbound-thinning dialog beat establishes him as the third independent witness (alongside Roland and Brother Oswin) to the canonical "the corruption is recent" observation, and canonizes that he has been a quiet long-time Bealach-corridor source for Aldwyn's information network. **Note:** the v61ez ship had a half-cylinder arch beneath the deck, cliff-block fronts on both banks, and the deck built at terrain Y with invisible side-blockers (Option B). All three superseded by the v61f0-v61f6 refinement pass — see preceding entry. Full dialog preserved verbatim in `quest_writing.md`.
- (Session 38, v61ez) **Player-as-binding-interface canonized** → resolved as held-lightly canon. The player-character is, in canon, an outside-of-the-world entity interfacing through the binding. The binding has been producing adventurers for centuries; the player is the first one Varek registers as fundamentally different because the binding is *receiving* something through the player from outside. Fourth-wall integration that doesn't break the wall — it builds the wall into the cosmology. Never said by an in-game character directly. See § The player as binding-interface.
- (Session 38, v61ez) **Mastery-touch as Varek-meeting trigger canonized** → resolved. The first on-screen Varek meeting at The Ashfeld is triggered by the player's first achievement of Mastery-tier comprehension on any spell. Resolves both the Mouth design question and the Ashfeld trigger question through the same gesture — the Mouth contains the canonical first Mastery sigil, so going to the Mouth is what triggers the Ashfeld meeting. Accessibility flag noted: Mastery-touch as a gate has discoverability concerns; mitigation candidates (quest hook, UI cue, both) deferred to the Mouth-hookup session. See § The Mastery-touch as the Varek-meeting trigger.
- (Session 38) **Inis Rua speced and built** → resolved. Receiving side of the Carraig Mór ferry now built out (v61ey). Two voiced NPCs (Niamh, Keeper of the Mouth, as signature character + Fionn, fisherman), three buildings (Niamh's Dwelling, the Net-Shed, the empty Watch-House), the Mouth physically present as a sea-cave arch in a built south-cliff face, and a north-side dock + ferry boat mirroring Carraig Mór's south side. New `rust_stone` ground texture (warm-grey rock with iron-rust streaks) canonizes the "Red Island" name in plain register. The Mouth is examinable but not walkable — the popup ends on *"You are not ready to go in."* The Watch-House quietly establishes that Inis Rua had more people once. Niamh's dialog ties the village to Áine's brother across the strait (Niamh's mother spoke to him; she died with the words). Full dialog preserved verbatim in `quest_writing.md`.
- (Session 38) **Causeway/ferry framing fully resolved on both sides.** Inis Rua's centerMarker text and WM_NODES desc updated from "causeway" to "ferry" framing per the v61ew reframe. The reframe is now consistent across centerMarker, world-map, and both ends of the connection.
- (Session 37) **Carraig Mór speced and built** → resolved. The first Act I/II coastal-arc village beyond Salthaven is now walkable (v61eu, refined v61ev/ew/ex). Three voiced NPCs (Áine + minor characters Cuán and Maire), two examinable structures (Rock-Hall, Bone Lintel), three-knob coastal palette (warm-grey weathered stone bodies, slate roofs, lichen-toned stone ground). South-side ocean + dock + moored ferry boat replace what was previously an empty south gate. Áine's full dialog (greeting + four lore-canon topic responses) preserved verbatim in `quest_writing.md`.
- (Session 37) **Inis Rua "tidal causeway" → "tide-governed ferry"** → resolved as canon revision. The original causeway framing predated any visible affordance; the boat-ferry now in v61ew reads more naturally and strengthens the "tenants of the sea" register. The mechanical guard predicate (`!isTideOut()`), the 6-minute cycle, the "twice a day" rhythm, and Maire's tide-singing practice all stay canonical. Inis Rua's centerMarker text and world-map description still say "causeway" pending Inis Rua's spec session.
- (Session 37) **Village builder feature-complete for the planned coastal arc.** Nine independent dispatch knobs across v61er/v61et/v61ex (`buildingMaterial`, `roofStyle`, `pathStyle`, `plazaProp`, `terrainProfile`, `borderType`, `groundTexture`, `interiorTreeStyle`, `groundScatter`), each with sensible defaults preserving prior behavior. Adding a new village is now a spec-only operation in 95% of cases. The remaining work for a new Act I/II village is content authoring (NPCs, dialog, structures), not builder development.
- (Session 32) **Pre-Q7 Wastes back-door route to Coeur de Vie** → **resolved as accept-as-canon.** The post-v61ec geography permits a long pre-commission path through Cill Beag → Hermit's Camp → Caer Uaigneach → wastes_east → Dunmore → Vieux Marché → Ironhaven and onward to Portclare → Coeur de Vie. The "brave/scenic" route IS canon; its narrative cost — three rough Wastes-region zones, Caer Uaigneach's `danger:true` plague-village marker, no friendly NPC presence between Cill Beag and Dunmore — is the soft gate. Q7 progression remains hard-gated by quest state (Aldwyn's pre-burn dialog branches do not advance until the relevant quest milestones), so the geometric reachability of Ironhaven/Aldwyn pre-commission does not break the questline. The route is intentionally unsignposted; players who find it have earned it. The Wastes' canon framing — "outside the royal network," "no roads run through it" — is preserved by NOT extending commission-style guards into the Wastes corridors. (Implementation: no code change; design decision logged.)
- (Session 27) **The Ashfeld geography** → resolved. Physically on the south road from Ashenmoor between the village and Redwater Ford. Every player walking south passes through. The "possibly the origin of Ashenmoor's name" lore line now reads in the geography itself. Implementation: Session 27 / v61d7 audit work.
- (Session 27) **Inis Rua tidal causeway** → resolved mechanically as a `guard:'tide'` system on a 6-minute total cycle (3 min exposed, 3 min submerged). The "twice a day" framing became literally true when the day/night system landed and the tide tied to the in-game clock. **(Superseded Session 37: framing reframed to ferry-not-causeway. Same `guard:'tide'` predicate. See Session 37 entry above.)**
- (Session 27) **Royal Mage Commission's mechanical reach** → resolved. Pre-commission, four boundary roads are physically closed (Ashenmoor's western gate, Hearthwick's eastern gate, both of Ironhaven's outgoing royal roads). At Q7 turn-in, all open at once. Walkable world grows from 8 zones to 35. The two-tier world (pre-commission Tier 0 corridor / post-commission Tier 1 royal network) is now canonical structure.
- (Session 26) **Lord Caldric's on-screen debut as a *scripted* scene** → safehouse grant beat. Fires post-Q7 when player visits the keep. Two-branch monologue (asset framing engaged or accepted), gift announcement, Brynn-as-relay summons player. Restrained register; "I prefer contracts" closing line plants Act II tilt without breaking Act I pacing. (Note: Caldric has been anytime-walkable in his keep with greeting + three topics since well before this session; the resolution here is that his FIRST SCRIPTED SCENE is now in.)
- (Session 26) **Aldwyn's post-Faolchú-fight dialog** → Mark-aware preamble at Q7 turn-in. Aldwyn notices the Mark "around your neck" or "in your bag," takes it as evidence of binding-itself-misfiring (distinct from Varek's-hand on the rubbing), names the script-layer ("the deep tongue") without translating, holds the deep translation for Act II. Restrained scholar register matches his canon voice.
- (Session 26) **Faolchú-as-named-antibody mechanic established in writing** — Mark canonized as bone fragment from the seam, carving "right strokes wrong order," Aldwyn-readable in fragments only. The Mark is now an essential quest item (cannot be sold or destroyed; receive_item tied to Q7 obj 2).
- (Session 25) Act I climactic boss fight → the Faolchú in burned Ashenmoor's village square. Q7 restructured around the kill (obj 1 gates the triage). Lessons lived in `devlog.md` v61c2-v61c9.
- (Session 25) Named-antibody mechanic established. Faolchú is the prototype; future bosses follow the same pattern (failed binding produces a creature that's almost-a-known-shape with glowing seams).
- (Session 25) The Faolchú's Mark canonized as the first unique boss-drop trophy. Bone fragment from the seam, with carving that almost spells something — Aldwyn-readable in a future session. **(Session 26 resolved that future session.)**
- (v61ad) Act I climax mechanical shape → scripted aftermath, first-re-entry trigger, conventional fire.
- (v61ad) Cost character at the burn → Bram. Edna survives wounded.
- (v61ad) Edna's handoff → physical fragment (the charcoal rubbing).
- (v61ae) Q7 structure → multi-stage triage-then-courier.
- (v61ae) Oratory: damaged-but-standing. Cross stays bright. Stone body holds.
- (v61ae) Brother Oswin survives the burn. Renamed from Aldhelm.
- (v61af) Quest popups added. First-person reflective voice. Click-to-dismiss.
- (Session 4) Central mystery: the binding IS the anchor. Hollowed Wastes preserved as monument to atrocity.
- (Session 4) Varek's relationship to the player: experiment, not instrument. Meta-awareness thread established.
- (Session 4) Aldwyn's limitations: old, fragile, afraid to die. Withholds his theory because he isn't certain enough.

---

## Working style preferences (from Michael)

- "Start with the end in mind" on story — know where a plot beat lands before designing the approach.
- Prefers concrete pitches to react to rather than open brainstorming.
- Comfortable writing villain interiority; slower on side NPCs.
- Cares about naming consistency — the three-register system is the authority; defer to it even when awkward.
- Iterative and visual — reviews changes in-browser, reports symptoms directly.
- Likes options to choose from when making design calls.
- XP curve intentionally chunky (`*= 1.4` per level) — leveling should matter.
- Rebalance driven by play-feel, not theoretical correctness.
- TTS for narration was tested and rejected (v61b7 voice harness) — browser TTS lacks the texture for villain narration. Silent intro stays.
- Targeted file edits over full rewrites.
- Parse check before shipping — catches editing mistakes early.
- Real playtest feedback trumps theoretical correctness.

---

## Combat philosophy (canon decisions)

Started Session 47 with v61gj-a (posture meter + stagger-crit chain). The combat redesign arc is fully captured in `combat_redesign.md`; this section preserves the **canon-level decisions** that have been LOCKED through design conversation and may override what the redesign doc proposes.

### The model — single-click + click-and-hold (not stances)

The redesign doc originally proposed three stances (High Guard / Heavy / Light) with `Q`-to-cycle. **Session 47 design pass replaced this with a simpler model**: tap LMB = normal attack; hold LMB = power attack (Skyrim-style, visible windup, more damage, more stamina, bypasses light blocks). No stance keybind, no per-weapon `defaultStance` field. **Session 48 (v62) implemented and validated this model in play** — the tap/hold distinction felt natural once the v62.6 fix gated visible-feedback on `powerArmed` (threshold crossed) rather than `powerCharging` (mousedown). Tap-and-release clicks below the 0.5s threshold show ZERO charging feedback; the cocked sword pose, gold tint, move penalty, and winding sound all fire only after commitment.

Reasons for the pivot:

- Three stances with `Q`-cycle is real cognitive load in a click-driven game; the latency of cycling through stances mid-combat felt like friction without a payoff.
- The two specific tools the stance system was offering (Light Stance's × 2.5 backstab; Heavy Stance's anti-shield) translate cleanly to other systems — **backstab became a position-based bonus with weapon-type-native dagger scaling (Session 2, v63)**; anti-shield becomes the power-attack rule.
- The simpler model leaves `Q` free for future use and removes a save-state field.

The redesign doc remains canonical *aspirationally* for the overall arc structure (7 sessions, three pillars, status framework, etc.) but Session 1 onward follows the simplified model.

### Power attacks are a 0.85-second commitment

A power attack is not a swing variant — it is a **full mechanical commitment sequence** the player chooses to enter. The architecture is intentional:

- **Charge (0 to 0.5s)** — hold LMB. Nothing visible happens until threshold. Player can release any time and just throw a normal swing.
- **Commit (threshold cross)** — at 0.5s the sword cocks back over the shoulder, the screen edges tint gold, the player slows, a winding sound plays. The player has committed but can still hold or release.
- **Release (any time after threshold)** — pay stamina, set cooldown, start lunge if W held, **schedule the swing 0.30s in the future** (not immediate).
- **Windup (0 to 0.30s after release)** — sword stays cocked, lunge carries the player forward, no swing animation yet.
- **Strike (0.30s after release)** — swing animation + hit detection fire. Blade peaks at ~0.575s.
- **Recovery (to 0.85s)** — swing tween ends, cooldown ends, next attack possible.

The point of this sequence is that **the strike lands at the end of the rush, not at the beginning**. Earlier iterations fired the swing immediately on release with the lunge happening afterward — which meant the player swung at empty air, then arrived in melee range. Wasted stamina, no damage. The deferred-swing sequencing (v62.8) is canon and should not be flattened back to immediate-fire. Standing-still power attacks share the same 0.30s windup for consistency, even though no lunge fills the windup time.

**Hit-cancel rule:** taking damage mid-lunge cancels the lunge (player stops rushing) but the swing still fires at its scheduled time. Block (RMB) and death cancel the pending swing. This is "commitment carries risk" — once you've committed to the strike, only your own choice to defend (or death) gets you out of it. Eating chip damage during a power attack is the price of the higher damage and posture pressure.

### Forward lunge as a positional commitment

If the player is holding W (or ArrowUp) at the moment of power-attack release, the swing is paired with a forward lunge — 0.4s of accelerated forward movement to close distance. Direction is camera-facing, not WASD-facing: lunge goes where the player is *looking*, regardless of WASD input. Strafing mid-lunge doesn't accelerate sideways (forward-component-only multiplier).

This makes power-attack-with-W a real positional choice. Stand still + power attack = stationary heavy swing. Move forward + power attack = committed rush. Same damage, different positioning. The lunge can overshoot — there's intentionally no enemy-body collision (v63 ship). Players who lunge poorly will pass through enemies and miss; this is the skill expression. The lunge speed is currently tuned conservatively to mitigate overshoot frequency until mob collision ships.

Bow attacks (Sessions 3-4) will use this same forward-W-held → committed-strike pattern; the lunge mechanic is the player-side mirror of the enemy `executeStrike` system already in place.

### The parry mechanic — timing window, not hold-and-win

Bram's canon dialog ("Block early, not late. A perfect parry — blocking before the blow lands — costs you nothing and staggers the attacker") was a promise the implementation didn't deliver on until v61gj-a2. The system now matches the dialog:

- **Perfect parry** requires raising the block button within ~200ms of the hit (scaling +10ms per Finesse point). Zero damage + enemy staggered.
- **Held block** (block held past the parry window, or pressed but mistimed) → partial damage reduction (~65% with shield, ~35% bare-hand) at stamina cost proportional to absorbed damage.
- **No block** → full damage.

Finesse attribute now has its design-promised role — the parry-window scaling. Resolve scales the stamina cost of all block-related events. Two attributes, two distinct combat-defensive identities.

### Posture is the second-by-second danger

HP is the player's runway. Posture is what shortens the runway in chunks.

Every melee enemy carries a hidden posture meter. Damage drains it; out-of-combat regen restores it. Empty posture → forced 1.5s stagger (the player's free hit window). Striking a staggered enemy (from any source — parry, posture-break, Sioc, frost enchant) deals × 1.5 damage. This is the **parry-into-staggered-crit chain** the redesign doc gestured at, now wired and live.

Player posture is NOT yet wired (canonical asymmetry: player is currently mechanically untouchable). The helpers (`applyPostureDamage`, `tickPostureRegen`, `isStaggered`) are generalised to work on any entity, so player posture ships in a later session by just adding the field to the player. **Player-stagger tuning needs its own playtest pass — known design risk: stunlock if landed badly.**

### Backstab is positional, not awareness-based

A "backstab" in this game means what the word says: striking an enemy from behind. The check is geometric, not state-based. The player must be in the enemy's rear 150° arc (cos threshold -0.259) as measured against the enemy's **stored combat facing** (`combatYaw`), not its visual mesh rotation. Visual rotation always tracks the player when alert — it's a turret. The combat facing freezes the moment an enemy commits to an attack windup or recovery, giving the player a real positional window to circle into the rear arc during the enemy's commitment cycle.

This was a deliberate canon decision. An earlier hybrid model (Session 2 first draft) had backstab fire when enemies were *unaware* OR *staggered*, regardless of player position. It was rejected: "backstab" should LITERALLY be a backstab — earned through positioning, not granted by enemy state. Staggered and backstab are now **distinct multipliers** that stack only when the player earns both: parry-stagger an enemy, then sprint around them and strike from behind = ×1.5 (staggered) × ×3.0 (dagger backstab) = ×4.5. A frontal strike on a staggered enemy gets only the ×1.5 stagger bonus; that combo bonus must be earned by repositioning.

The multipliers themselves are weapon-type-aware. Daggers (`weaponShape === 'dagger'`) get ×3.0 from a backstab — they are the dedicated stealth weapon and feel mechanically different from other weapons because of it. Other weapons (including bare hand) get ×1.5, so positioning still matters for sword/mace builds without making them dagger-equivalent. Bosses, dormant enemies, slimes (no clear facing), and ranged enemies (no melee telegraph window yet) are excluded entirely — they always take baseline ×1.0 backstab regardless of angle.

The combat tag `(BACKSTAB)` appears on both non-killing hits AND killing blows, matching `(POWER)` and `(CRIT)`. The kill-blow surface was specifically requested as feedback signal — a stealth kill should *read* as a stealth kill in the message log, not be silent because the enemy died.

### Frontal-block enemies — the Shieldbearer archetype (canon from v71)

Some enemies carry a raised shield (`shieldUp:true`). The shield is their **defense, not their toughness** — a Shieldbearer has neutral physical resists, but a melee hit **from the front** is reduced to 35% (`SHIELDBEARER_FRONT_BLOCK`). The reduction is positional: it reuses the same rear-cone test as backstab (`isPlayerBehind`), so a hit from the enemy's flank or back bypasses the shield entirely. A reduced hit surfaces a `(GUARDED)` tag so the small number is legible rather than mysterious.

This gives a shielded enemy **exactly two answers**, and they are the two combat pillars the player already has:

1. **Power-attack the front.** A power attack against a raised guard doesn't deal damage — it **breaks the guard**: force-stagger (1.5s), zero damage on the breaking swing, and the shield drops (`shieldUp` flips false, the raised arm lowers). Every follow-up then lands full. This is the anti-shield rule the stance system originally promised (Heavy Stance), relocated to the power attack.
2. **Flank the rear.** The v63 positional system *is* the alternative — circle to the back (sneak-approach or mid-combat sidestep during the enemy's windup) and the block doesn't apply. A rear dagger strike stacks `(BACKSTAB)` on top.

What the player must NOT be able to do is crack a raised guard with a plain frontal swing or a bash (see below) — those bounce. The shield is meant to *teach* the power/flank habit, so it has to resist the lazy answer. **A broken guard is not permanent:** when the Shieldbearer recovers from its break-stagger it re-raises the shield, so a fight that drags on means re-earning the opening (power-attack or flank again) rather than free-hitting an exposed enemy forever. The intended rhythm is break → punish in the stagger window → kill it, or break it again. This is canon: a frontal-block enemy is a soft skill-gate that rewards the two systems the player has already been taught, the melee-side analogue to how the Wraith gates magic. Future shielded enemies inherit the whole behavior by setting `shieldUp:true` on the def — the rule fires for free.

### Bash — the stagger verb (canon from v71)

The player has a dedicated **control verb** distinct from damage: a bash, performed by **clicking LMB while holding the block button (RMB)**. It deals **no damage** — it staggers. It is the player-side mirror of "an enemy guard breaks," and it costs stamina like a swing and shares the swing cooldown so it can't be spammed.

Two strengths, following the same shield-vs-no-shield hierarchy as the block-reduction tiers:

- **With a shield equipped** — a true shield bash. Force-breaks posture: any breakable enemy is staggered outright. The shield is a real bashing surface.
- **Bare-handed or weapon-only** — a pommel strike / weapon shove. Drains a large posture chunk (≈2.5× a normal swing) — enough to break weak enemies outright, but a brute only gets dented. This matches the "no real absorbing surface" register that already governs blocking without a shield.

The bash is **pure utility**: its payoff is the free follow-up window, never DPS. The design guard against it becoming a spam-DPS tool is that it does no damage at all, so the only reason to bash is to open an enemy up.

**The Shieldbearer exception is load-bearing.** A bash does NOT break a raised Shieldbearer guard — it "glances off." This keeps the two systems sharply separated: the bash staggers *everything that isn't already guarding*, and the one thing it can't crack is the one enemy whose entire identity is a raised shield. The player's answer to a Shieldbearer stays "power-attack or flank," never "bash." If the bash could also break a guard, the Shieldbearer would have three answers and the power attack's special role would blur. (This was a deliberate design call — the alternative, letting bash crack guards, was considered and rejected for exactly this reason.)

### Stealth is a posture, not a class skill

Sneak (Ctrl-toggle) is available to every character, not gated on archetype. The mechanical model is layered:

1. **Detection is directional.** Enemies see in a 150° forward cone within their sight radius (9u zone / 3.5u dungeon). They hear in a 0.5u omnidirectional radius — only direct contact triggers regardless of facing. The hearing radius is deliberately tight so the player can land a backstab without the proximity itself blowing cover. LOS is checked separately (walls block sight in both biomes).

2. **Sneak modulates sight, not hearing.** The sneak detection multiplier (base 0.7, -1% per Finesse, floor 0.25) applies to sight radius only. You cannot sneak through someone — proximity always alerts. This is the canonical guarantee that prevents stealth from feeling exploit-y.

3. **Finesse is the stealth attribute.** Finesse already had parry-window scaling, sprint cost reduction, and ranged damage; adding "-1% sneak detection" makes it the unified precision/agility/stealth identity. Each Finesse point is a small but stacking improvement: Finesse 10 brings the sneak multiplier from 0.7 to 0.6 (40% detection reduction). This is intentionally gentle scaling — sneak baseline is useful immediately, doesn't trivialize at endgame.

4. **Sneak is visible.** The camera lowers from EYE_STAND (0.92) to EYE_CROUCH (0.60) over ~0.3 seconds. Headbob halves. A dark vignette fades in around the screen edges; a "◔ SNEAKING" indicator appears at the bottom of the screen. The body-state visualization is canonical — sneak must *feel* different, not just mechanically *be* different.

5. **Sneak costs commitment, not stamina.** Movement speed drops to 0.7×. Sprint is disabled while sneaking (the modal commitment is intentional — Ctrl is a state, not a modifier). No stamina drain — sneak is patience, not exertion. The economy is time vs. exposure.

Sneak stacks multiplicatively with the existing Muirfhear Shroud potion (0.70× detectReduce buff). High-Finesse + Shroud is meaningful synergy without being broken: 0.6 × 0.7 = 0.42, which is still detectable at close range. **There is no "invisible" state**; sneak is always probabilistic-feeling, never absolute. This is the genre principle: stealth is risk management, not state-toggling.

The combat tie-in is clean: sneak gives the player an *approach* path to backstab, complementing the *mid-combat* path (sidestep during enemy windup). A dagger build wants to either start fights stealthy or earn the burst window through parry-and-flank. A sword build can do both but with smaller payoffs.

### Enemies patrol when unaware (canon from v63)

Dungeon enemies used to stand frozen until alerted. This was a missing feature, not a design choice — discovered when stealth became viable and the lack of enemy motion made dungeons feel like museum pieces. Now every dungeon enemy (except dormant Gargoyles, slimes, and mimics) has one of two patrol behaviors stamped at spawn:

- **Wander** — slow circular patrol within ~2u of spawn point (`homeX`/`homeZ`), faces direction of motion. Mirrors zone enemy wander.
- **Scan** — stands still and slowly rotates `combatYaw` to sweep the area. Sine sweep over ~16 seconds for a full turn, per-enemy phase offset so multiple scanners aren't synchronized.

The 50/50 randomization at spawn gives dungeons natural visual variety. Wraiths still hover during patrol. Mimics stay static whether disguised (chest pose) or revealed (lurking ambush). Slimes bob in place.

This is canon: dungeons have **breathing rooms**, not frozen tableaux. Future enemy types should declare or default to a patrol pattern at spawn; the field is `e.patrolType` ('wander' | 'scan').

### Weapon damage typing is load-bearing

Three physical types — slash, pierce, blunt — are real and consequential. Enemies have asymmetric resists. Skeletons resist slash; trolls/golems eat blunt; wraiths are nearly immune to all physical. This is canon and shouldn't be flattened: weapon choice should *matter* against specific enemy types. The bow pillar (Session 3) inherits this — silver arrows bypass wraith resists, iron arrows do baseline against most things.

**v64 implementation note:** the override path is wired. An arrow's `wType` field (when present) takes precedence over the bow's `wType` at the arrow-hit branch in both `tickBalls` loops. Iron Arrows omit `wType` → falls through to the bow's 'pierce'. Silver Arrows (future) will set `wType:'silver'` and the resist table will gain a corresponding column for wraiths (low resist) and undead skeletons (also low — silver is a folk-lore unifying anti-undead material in this world). Broadhead Arrows will set `wType:'slash'` for skeleton-cutting builds. The architecture is in v64; the new arrow types are content for Session 4.

### Magic schools have parallel resist asymmetry

Six schools (tine/uisce/cloch/scath/solas/+two more, see magic section). Every enemy carries a resist table. A spell that excels against one enemy will be wasted on another. This is the design payoff of the Irish-register magic vocabulary — the deep tongue is not just flavor, it's combat-mechanically meaningful through the resist system.

### Pointer Lock is the canonical input model

As of v62.1, the camera is driven by continuous mouse movement while pointer is locked — not the legacy click-and-drag. LMB and RMB are pure combat inputs. Locking happens on canvas click; unlocking happens on menu open (via the `_releasePointerLockForMenu()` helper called at the top of every open* function) or browser Esc. A `#resume-overlay` ("⏸ Paused / Click to resume") appears whenever the player is in combat but unlocked.

This is the input architecture the rest of combat development assumes. Bow draw (Session 3-4), spell casting (current `KeyF`), future dodge/parry timing — all of these depend on the player having continuous look-control with mouse buttons reserved for combat semantics. The legacy drag-to-look system would have continued to bottleneck input design choices; switching to Pointer Lock was effectively a prerequisite for power attacks and everything beyond.

**Architectural pattern locked:** any future menu-opening function must call `_releasePointerLockForMenu()` synchronously inside its user-gesture handler, before any DOM mutation. Chrome's gesture-context heuristic silently rejects delayed `exitPointerLock` calls — the reconciler-based release-on-next-frame approach was tried in v62.1 and failed (v62.4 is the working pattern).

### Forward-compat hooks already wired

These are scaffolded but not active. Future sessions plug into them; don't tear them out:

- ~~**`ammo` equipment slot** (line 1306) — bow scaffold (Session 3).~~ **Consumed in v64 Session 50.** EQ.ammo now holds arrow stacks; useItem has an ammo branch that handles stack-merge (same arrow type) vs swap (different arrow type).
- ~~**`POSTURE_DRAIN_POWER = 25`** constant — power attack drain (Session 1b / v62).~~ **Consumed in v62 Session 48.**
- ~~**Backstab × 2.5** weapon-native dagger bonus (Session 2).~~ **Consumed in v63 Session 49.** Multiplier landed at ×3.0 dagger / ×1.5 other; trigger redesigned to positional (rear 150° cone) rather than weapon-shape-only.
- ~~**Enemy `combatYaw` field** — stored facing for backstab + patrol.~~ **Wired in v63 Session 49.** Live during alert-idle, frozen during attack windup/recovery, randomized at spawn for unaware enemies. Reused by patrol logic.
- ~~**`shieldUp` enemy flag check** in `applyMeleeDamage` — Shieldbearer answer (Session 5). Currently no-op because no enemy has the flag.~~ **Wired in v65.** Branch lives in `attack()` and `attackZoneEnemies()` (not inside `applyMeleeDamage` — call-site routing turned out cleaner than parameter-threading). Power attack vs `shieldUp:true` enemy → pure stagger, zero HP damage, 1.5s open window. Currently dormant scaffolding; fires automatically when Shieldbearer ships with the flag set.
- **`vmEnchantLight`** placeholder (line 1911) — equipped-weapon glow for enchanting (Session 7).
- **Materials `glow:` field** — same.
- **Generalised `applyPostureDamage`** — player-stagger ship later.
- **`canSeePlayer(e, dist, baseSightRadius)` predicate** — unified detection. Currently used by both zone and dungeon enemy ticks. Bow enemies (Session 3-4) will reuse the same predicate; ranged enemies need their telegraph window stamped on `combatYaw` for backstab parity (deferred).
- **`e.patrolType` field** ('wander' | 'scan') — dungeon enemy idle behavior. Currently 50/50 randomized at spawn; future per-enemy defaults can override (e.g. slow brutes → 'scan', agile spiders → 'wander').

### Two-handed melee weapons (shipped v65)

Claymore, Great Axe, War Hammer (T3 Iron, Wulfric's armory), and Wooden Great Club (T1, Barnaby's misc shop as the entry-tier starter). Great Axe deliberately reserved at the dwarven smithy NPC when that ships — Wulfric is a stone-town armorer, not a mountain forge. The Wooden Great Club is the canonical "rural smith's heavy stick made deadlier with rope and iron studs" — it's a real club, not "a wooden version of a metal weapon." All four `twoHand:true`, auto-stowing the offhand on equip via the bow ship's `_clearOffhandForTwoHander()` helper.

**Identity grid:**
- **Claymore** (slash, atkMult [1.4, 1.7]) — balanced 2H sword. Cleaves up to 3 enemies per swing. Posture×1.75. Pack-clearing weapon for Might builds.
- **Great Axe** (slash, atkMult [1.5, 1.85]) — mid spec. Cleaves up to 2. Posture×1.75. Narrower than the Claymore, more raw damage per hit.
- **War Hammer** (blunt, atkMult [1.65, 2.0]) — single-target specialist. Cleaves 1 only, compensated by **posture×2.25** and the highest base damage in the family. Best vs brutes, mini-bosses, armored singletons. The asymmetry is deliberate canon: "you only hit one enemy but you cleave their *guard*."
- **Wooden Great Club** (blunt, atkMult [0.55, 0.75]) — entry-tier war-hammer family. Cleave 1, posture×1.5, block 40%. Lets a Might-build player commit to 2H from Session 1.

**Cleave is the canon for 2H weapon identity (v65).** 1H weapons hit exactly **one enemy** per swing (`CLEAVE_DEFAULT = 1`); 2H weapons hit up to their `cleaveTargets` count, sorted by distance so the closest N candidates are consumed first. The forEach-into-everyone-in-arc behavior pre-v65 was a sleeper bug masquerading as 1H utility — fixed in v65 to make the 1H = precision / 2H = sweep distinction real. This change is the most important player-facing behavior shift the ship introduced, and is the source of the "1H feels less powerful in pack fights" feedback to watch for in playtest.

**Posture pressure scales per-weapon-class via `postureMult` on WEAPON_TYPES.** 1H weapons have no field (1.0 fallback). 2H entries set 1.5–2.25× the base `POSTURE_DRAIN_*` value. This applies to both normal and power hits, so war-hammer power swings break normal-tier enemies in **one hit** and brutes in **two**, sealing in the "single-target posture specialist" identity.

**Block tier (v65, canon):** Shield > 2H steel weapon > 2H wooden weapon > 1H-no-shield / bare hand.
- Shield equipped: ~65% reduction
- Steel 2H (Claymore / Great Axe / War Hammer): **50% reduction**
- Wooden 2H (Great Club): **40% reduction**
- 1H weapon, no shield, or bare hand: 35% reduction

Encoded on WEAPON_TYPES entries via `blockReduce`. Falls back to `BLOCK_REDUCE_NO_SHIELD = 0.35` if absent. **All 2H weapons can block** — including bow weapons, which canonically fall back to the bare-hand rate (35%) because a bow has no real surface to absorb a strike. The "half-sword / haft-parry" pattern is canon: claymores half-sword to parry, great axes and war hammers parry with their hafts. Parry timing (Finesse-scaled window, ~200ms base) is weapon-agnostic — works for any equipped weapon that has `canBlock` semantics, including bows.

**Power-attack-vs-shielded-enemy = pure stagger, no damage (v65).** The lore_canon line about "power-attacks bypass frontal shields" was generalized in the v65 implementation: rather than letting the power attack land damage *through* the shield, the breaking swing inflicts pure stagger with zero HP damage, and the staggered window is the player's reward (1.5s open for follow-up). Mirrors the player-side parry-stagger loop, just from the enemy's perspective. The branch fires in `attack()` and `attackZoneEnemies()` before the damage call. **Currently dormant scaffolding** — no enemy has `shieldUp:true` yet. Wires up automatically when Shieldbearer ships in Session 5.

**Cone tightening (v65.2).** Pre-v65.2 the swing-hit dot threshold was 0.35 (~140° total cone), which caught enemies at the player's hips and read as "I hit something behind me." Tightened to 0.45 (~117° total cone) for both 1H and 2H. **Cone width is uniform across weapon classes** — cleave already differentiates 2H by target count; widening the cone for 2H would have been a second differentiator with no design justification.

**Architectural lesson: adding a weapon-type field touches three places, not two (v65.1 retrospective).** When v64 added the `twoHand` field, the team threaded it through `WEAPON_TYPES` def + `makeItem` copy block + save whitelist. The v65 2H ship initially missed the `makeItem` copy for `cleaveTargets`/`postureMult`/`blockReduce` — items came out of the factory with the fields undefined and the cleave defaulted to 1. **Canonical fix going forward: any new WEAPON_TYPES field must touch WEAPON_TYPES def + `makeItem` copy + save whitelist.** Codified here so the next weapon ship (great axe at the dwarven smithy, future poleweapons, etc.) doesn't repeat the regression.

### Animation system — viewmodel pose composition (refactored v65.7+)

The viewmodel's pose each frame is the composition of: base pose (per weapon class) + walk sway + bob + swing delta + guard blend + power blend. Pre-v65 these were all hardcoded constants. **v65.7 extracted every animation tunable into a single `ANIM_PARAMS` object at module scope.** The render loop reads from it each frame; the in-game debug panel (toggled with backtick) writes to it via sliders. Slider changes are reflected on the very next swing or block.

**Swing tween is variant-based (v65.6+).** Three randomized variants per swing:
- **V0** — UR→LL diagonal slash (anticipation upper-right, sweep to lower-left)
- **V1** — UL→LR diagonal slash (mirror of V0)
- **V2** — Overhead chop (anticipation straight up, sweep straight down)

Variants are picked from weighted distribution (`v0_chance`, `v1_chance`, `v2_chance` weights normalized at runtime, so values like `1, 1, 0.2` produce ~45/45/9). Latched at swing-start onto `vmSword.userData.swingVariant` so the variant doesn't change mid-animation.

**Phase machine per swing — anticipation → sweep → hold → settle.** Four phases with explicit boundaries (`antEnd`, `sweepEnd`, `holdEnd`) in [0,1] progress space. Anticipation moves the weapon AWAY from the swing direction (windup); sweep transitions from windup peak to extreme target; hold pauses at the extreme (the decisive Oblivion-style "I committed to that strike" beat); settle eases back to rest. **Note that `holdEnd < sweepEnd` is valid** and currently used as the v65.8 default — produces a "long windup, fast snap, then drift back" curve that feels punchier than the canonical hold-then-settle.

**Depth push during swings (`swingPushZ`, v65.8).** A negative Z translation applied during sweep+hold pushes the weapon AWAY from the camera, preventing visual collision with the player's shield/body during big arcs. Default `-1.0` follows the same phase curve as position X/Y (zero during anticipation, eases in during sweep, holds at full push, eases out during settle). Uniform across all variants — if a future ship needs per-variant push, the field would split into v0/v1/v2 variants like the existing position targets.

**Power-attack variant binding (v65.9).** Power attacks default to weapon-class-bound variants — 1H weapons → V0 (the heaviest committed swing), 2H weapons → V2 (the overhead chop, natural heavy-weapon power fantasy). Priority: panel `variantLock` wins over everything (debug authority); else power-attack bind fires if set; else weighted random. The bind values themselves live in ANIM_PARAMS so they're tunable from the panel.

**Block pose is absolute target via lerp, not additive delta (v65.3 canon).** When the player raises guard (`gb` blend from 0→1), the pose interpolates between base pose and an absolute target pose. NOT a delta added on top of base — that approach (v65.2 attempt) compounded the base pose's pre-existing yaw and produced a vertical-blade-pointing-up failure mode. Per-weapon-class block targets: 1H sword, 2H weapon (more horizontal across chest), and bow (softer, since the bow viewmodel's long axis is vertical at rest).

**Debug panel is a development tool (v65.7).** The `ANIM_PARAMS` extraction is permanent — it's the right architecture and pays off any time animation feel needs tuning. The panel itself is a sibling DOM overlay hidden behind a backtick toggle; it doesn't pause the game, doesn't serialize to save, and can be commented out before any production cut without affecting game behavior. The "Copy values" button serializes the live ANIM_PARAMS to clipboard for baking into defaults. **Workflow: lock a variant, drag sliders until it feels right, copy, paste back, bake as new defaults.** Worked for both V0 and V1 tuning in v65.8.

### Ranged combat — bow pillar (added v64)

Bows are a parallel weapon class to melee, not a subset. The bow ship does NOT extend the `attack()` pipeline — it routes through its own `fireArrow()` function. This separation matters: melee and ranged share the *damage resolution* layer (resist tables, posture drain, dmgTag) but have distinct *input grammars*, *commitment models*, and *resource economies*.

**Input grammar — weapon class determines mouse semantics.** The LMB/RMB split that was clean for melee (LMB = attack-or-power-charge, RMB = block-or-parry) does NOT translate to bows. The mousedown handler branches on weapon class:

- Melee weapon equipped → LMB-hold = power-attack charge, RMB = block
- Bow equipped → LMB-hold = draw, RMB = cancel draw (NOT block — bows are two-handed, no shield is in slot)
- (Future: staff = channel, crossbow = tap-fire)

This is the **canonical pattern for new weapon classes**: each adds its own predicate (`_isBowEquipped()`, future `_isStaffEquipped()`, etc.) and its own mousedown/mouseup branches alongside the existing power-attack path. Do not try to flatten all weapon types into a single attack pipeline — the resulting decision tree would be unreadable.

**Damage model — bow is primary, arrow is secondary.** Final damage = `(bow.atk roll + arrow.arrowDmg roll) × drawMult × finesseMult`. The bow's atk roll scales with material tier (Wooden → Iron → Steel → Mithril → …) the same way swords do; the arrow contributes a smaller fixed range on top (+3–6 for Iron Arrows). This means bow upgrades feel meaningful, parallel to sword upgrades. Arrows differentiate **by type** rather than by tier alone — Iron Arrows are the v64 baseline; Silver Arrows (bypass wraith resists) and Broadhead Arrows (slash-type for skeletons) are forecasted for Session 4. The arrow's `wType` field overrides the bow's when present; this is the architectural hook for Silver/Broadhead.

**Draw strength is the bow's commitment.** Mirrors power-attack windup philosophy: a short draw fires a weak arrow; a held draw fires a punchy one. `BOW_DRAW_MIN = 0.25s` (release before this = fizzle, no arrow consumed); `BOW_DRAW_MAX = 1.10s` (full draw); damage scales linearly from ×0.45 (min) to ×1.40 (max). Stamina drains continuously during draw at 8/sec; running dry forces a release at whatever strength you'd reached. This is the bow's parallel to "commitment carries risk" — a deeply-drawn bow that gets interrupted by an enemy hit still costs your stamina. RMB cancels cleanly with no arrow consumed.

**Finesse is the bow's primary attribute.** The Finesse description already promised "Strike from afar" (v63); the v64 implementation backs it with `BOW_FINESSE_DMG = 0.04` (+4% per Finesse point, multiplicative with draw strength). At Finesse 10, a full-draw shot is +40% over baseline — meaningful but not overshadowing of the underlying bow tier. Finesse is now the four-tool build attribute: **parry-tighter, sprint-cheaper, sneak-quieter, shoot-harder**. This is the dedicated archer/duelist identity vs. Might's melee-bruiser identity.

**Backstab does NOT apply to arrows.** A canonical decision in v64: the position-based backstab (rear 150° cone with frozen `combatYaw`) is the *melee* commitment loop's reward. Bows have their own commitment loop (draw strength, stamina drain). Stacking backstab on archery would mean a stealth-archer build could one-shot everything from range, which collapses the design's distinct build identities. **Bow build = approach, draw, release. Dagger build = stealth, position, strike.** They're parallel paths, not stackable.

**Arrows ride the existing projectile pipeline.** `BALLS[]` (dungeon) / `ZB[]` (zone) carry arrows alongside spell orbs, with `userData.isArrow = true` as the type discriminator. Arrow-vs-enemy collision was added to both `tickBalls` loops as dedicated branches BEFORE the spell-specific blocks. Arrows use `applyMeleeDamage`-equivalent resist resolution (`e.resist[wType]`) since they're physical damage, not magical — this is the canon that *pierce arrows are physical hits delivered at range*, not magical projectiles. Posture drain on arrow hit = normal-melee tier (not power-attack tier); a bow build can still posture-break enemies through sustained pressure.

**Procurement arc — Barnaby seeds, Wulfric scales.** Iron Bow (T1, Wooden) and Iron Arrows are stocked by **Barnaby in Ashenmoor** — the player can become an archer from session 1 without leaving the starting village. **Wulfric in Ironhaven** stocks the T3 Iron Bow + arrows — a meaningful tier upgrade gated behind Q3 (the Ironhaven travel beat). This is the same arc-shape as melee weapon access: Barnaby has the cheap starter, Ironhaven scales up. Future arrow types (Silver, Broadhead) will live with Dagna's War Supplies (Royal Commission gating), matching the institutional-tier elixir distribution.

**Mouseup must gate by weapon class (v64.1 fix).** Pre-v64.1 the mouseup handler would fall through to the melee `attack(false)` path whenever `_bowDrawing` was false. That seemed correct — "if no draw, do nothing special" — but three legitimate paths reach mouseup with bow equipped + `_bowDrawing===false`: (a) the first mousedown after equipping was consumed by pointer-lock acquisition; (b) alt-tab cleared `_bowDrawing` while LMB was held; (c) RMB-cancel already cleared the draw state. All three caused a phantom melee swing on the bow. **The canon:** if a weapon class doesn't have a melee attack at all, its mouseup MUST return early before reaching the melee path. The check is `if(_isBowEquipped()) return;` just before the existing `wasArmed`-resolution block. **Forecast for staves and crossbows:** same gate, different predicates. Two-handers (claymore etc.) DO have a melee attack, so they don't need this gate — they slot into the existing melee path with `twoHand:true` doing the equip-time work.

**Draw strength affects speed AND damage (v64.1).** A partial draw fires both weaker (`BOW_DAMAGE_MULT_MIN/MAX`) AND slower (`ARROW_SPEED_MULT_MIN/MAX`). Speed spread is intentionally narrower than damage spread — even a weak shot needs to leave the bow with intent; a 30%-speed arrow would lob and feel broken. With gravity (v64.2), slower arrows also arc more over the same horizontal distance because they spend longer in the air. **Emergent skill gradient with no extra mechanics:** range × draw-strength becomes a real player decision the moment gravity exists. This generalizes: any future charge-and-release ranged class (throwing axes? crossbow bolts at variable wind-up?) should follow the same pattern — let strength affect speed and let physics produce the depth.

**Projectile physics — gravity is real (v64.2).** `ARROW_GRAVITY = 4.0 u/s²`, applied to `vy` each frame for in-flight arrows. About 40% of real gravity — a deliberate tuning choice that keeps close-range archery point-and-click while making long-range shots demonstrably arc. **The arrow's visual orientation MUST update each frame from its live velocity vector** (yaw from `atan2(vx, vz)`, pitch from `-asin(vy/speed)`). Without per-frame orientation, an arcing arrow stays at its launch angle and reads "broken" during descent. This is now codified in `tickArrowMotion` — any future projectile that obeys gravity must include the per-frame orientation update. Spells don't need this because spell orbs are spherical; arrows (and any future bolt/javelin/thrown weapon) are directional and need the trig.

**Sticky projectiles — the "your shot mattered" feedback loop (v64.2).** Arrows that hit but don't kill **stick into the enemy body mesh** via reparenting (`body.add(arrow)` with world→local position+rotation conversion). They follow the enemy as it moves, turns, telegraphs, and dies. Arrows that miss enemies but hit geometry (wall, floor, terrain) **plant in place** via sub-stepped collision (3 sub-steps per frame to prevent tunneling through thin walls). Both stuck states have a `STUCK_ARROW_LIFE = 30s` countdown.

**The despawn-with-corpse contract.** When an enemy with stuck arrows dies, the arrows are siblings in the body-mesh subtree. The body mesh becomes the corpse (slumped + tinted in `killE`/`killZoneEnemy`, not removed from the scene). Arrows visibly stay embedded in the corpse — this is the desired feel. When the corpse is eventually cleaned (loot taken, scene transition), the arrows go with it because Three.js parent-child traversal handles cleanup. The orphaned-arrow case (stuck-enemy arrow whose body was removed mid-stuckLife) is handled by `tickArrowMotion`: it keeps counting down even when the parent is gone, then cleanly splices on expiry. **Canon:** sticky projectiles use scene-graph parenting, not synthetic follow-the-target code. Same pattern applies to any future stick-into-target effect (thrown spears, planted runes that follow an enemy).

**Arrow recovery (forecast).** v64.2 ships sticky arrows as visual feedback only — they despawn after 30 seconds, no pickup. A later session may add `recoverable:true` on stuck arrows so the player can walk over them and reclaim some percentage. This is a forecast, not a v64.2 commitment — but the architecture supports it: every stuck arrow has a position and a type-of-arrow reference; the pickup system just needs to scan stuck arrows within proximity and convert them back to inventory ammo. If recovery is added, balance it at 30-50% recovery rate so the consumable economy still matters.

### Visual feedback principles

- **Screen-edge color flash priority chain (v62.5):** red = hurt > blue = held block / gold = perfect parry (single-flash) > gold = power-attack armed (steady hold) > blue = bare-hand passive block > none. Gold appears in two distinct combat contexts: the brief flash on a successful parry (defensive) and the held tint while charging a power attack (offensive). They never overlap in practice — parry happens during an enemy attack, armed-tint happens during your own swing prep. Don't add a fourth screen-edge color without retiring one — players track ~3 colors comfortably.
- **Every meaningful event has a sound.** sndPlayerHurt, sndBlock, sndParry, sndSwing, sndHitEnemy, sndPowerCharge (threshold cross), sndPowerHit (power-attack landing), sndBash (bash — metallic clang with a shield, dull shove without). Combat events should never be silent.
- **The shield reacts physically to hits** (v61gj-a2 onward). Parry = forward shove. Held block = backward push. Bare-hand = sword recoils backward. Magnitude scales with damage; direction is camera-local so flank hits jostle laterally. This makes the parry/block distinction *visible* without relying on screen color alone. **A bash (v71) drives the shield/sword in a strong forward thrust out toward the enemy** — a dedicated punch-out motion (large forward translation, minimal rotation), distinct from the parry's small deflecting jostle, so a bash *reads* as a strike rather than a twist.
- **The sword reacts physically to charging (v62) and swinging.** During charge: cocks back over the shoulder. During the deferred-swing windup (between release and the actual swing fire): held in cocked pose so the player visually stays "ready to strike" while the lunge carries them in. During the swing: arc tween with magnitude × 1.4 on power vs normal.
- **Posture is hidden** — no enemy HP bar shows posture state. Player learns the rhythm by watching the stagger animations + listening for the break sound, not by tracking a number. (Open question: revisit if playtest finds posture-break unreadable.)
- **Lunge has FOV punch** — target FOV bumps to 92 during lunge (vs sprint 85 / idle 75), reverts via the same dt*8 lerp. Sells the rush.
- **Sneak has a vignette + crouch (v63):** screen edges darken via inset box-shadow when sneak is active; the camera lowers from 0.92 to 0.60 eye height over ~0.3s; headbob halves. The body-state cue is independent of the HUD indicator — the player can tell they're sneaking even with peripheral vision. This is part of the "stealth is visible" canon.

---

## Fort interior room kinds (worldbuilding catalog)

As of v61g8, fort interiors are composed of semantically-named rooms drawn from a fixed catalog. Each kind has a prop signature and a register. Two ceremonial groupings: the **destination ceremonial set** (Great Hall, Lord's Chamber, Chapel — fort-as-residence) and the **central ceremonial** (courtyard hall — keep-as-building). Five utility kinds round out the lived-in spaces.

**Ceremonial:**
- **Great Hall** — the long banquet hall. Long table, benches, banner on the back wall, candles. The "where they ate and where they held court." Present in every fort regardless of layout (tee, linear, courtyard).
- **Lord's Chamber** — the private bedroom of the keep's lord/captain. Bed, side table, foot chest. Present in tee and courtyard variants only.
- **Chapel** — sacred space. Altar against the back wall, candles, pew rows facing the altar. Present in tee and courtyard variants only.
- **Courtyard hall** — central hall of a keep-style fort. Open chamber with a single brazier dead center. The hub the rest of the building doors off of. Present in courtyard variant only.

**Utility (shuffled per seed across utility slots):**
- **Barracks** — where the soldiers slept. Rows of bunks lined up shoulder-to-shoulder along the W and E walls, heads against the wall, feet pointing into the center aisle. Footlocker at the foot of each cot. Bunk density scales with room size — small rooms ~6 bunks, large rooms ~12-16.
- **Kitchen** — the hearth + prep table. Cluster of barrels/crates in the SE corner (the pantry).
- **Armory** — a working smithy. Forge against the W wall (glowing maw on the east face, warm light pool), anvil on a wood stump just east of the forge (where the smith stood), smelter against the E wall (tall stone cylinder with coal glow at its base). Weapon prep table at room center with whetstone and blade silhouettes lying flat. Two weapon racks against N and S walls. Reads as a place where small-blade work and repairs happened, not just a storage room for weapons.
- **Storeroom** — wall shelves along the room's long wall plus 1-2 chests at room-interior cells. Bursts with corner clusters of barrels and crates in all 4 corners. The "this room is just storage" register, dialed up — the densest loot room in any fort.
- **Guardroom** — small table and chair, single cluster in SW. The "one or two stationed here briefly" register.
- **Library** — bookshelves on both long walls (3 per wall, 2.2u tall, with rows of book-spine slabs at varying heights), reading table + chair + candle at room center. Each bookshelf is individually lootable from the `library_chest` pool — most shelves are empty (well-read register), some yield books, worn tomes, ink vials, quills, herbs, or torches. No equipment, no potions — libraries are scholarly spaces, not treasuries. Uncommon: appears in ~67% of tee/linear forts and ~40% of courtyard forts.

**Naming register:** these are functional descriptors, not in-fiction proper names. The player isn't told "you are entering the Great Hall" — they read it from the props (table + banner = hall; altar + pews = chapel). The names are for our development discussions.

**Cellar** is a candidate kind not yet in the catalog — semantically overlaps with storeroom. May be added later if a fort interior wants a "below-ground tier" register.

---

## Maintenance protocol

This document is the **living world bible**. It grows over time. It does not get summarized away.

**At the end of every session, ask:** "Anything that should go into the lore canon or quest_writing doc?" Surface specific things — a new locked decision, a character voice we tested, a piece of worldbuilding we resolved. Confirm and add.

**During session, when producing dialog or prose:** if a line is canon-worthy, flag it before moving on: "want me to add this to quest_writing.md before we continue?"

**Three-document split:**
- **`lore_canon.md`** (this doc) — what is true about the world. Living world bible. Grows; never shrinks.
- **`devlog.md`** — what has been built. Operational changelog. Allowed to be terse.
- **`quest_writing.md`** — verbatim NPC dialog, prose, popup texts, encounter scripts. Direct copy from conversation, no summarization.

When the next session starts, all three are read together. Canon authorizes the world; devlog reports what's implemented; writing doc preserves the exact words.

---

# Part II — The v80 world (the addendum)

*Extends `lore_canon.md`. Where this document and the older canon disagree, this document wins; the older canon's magic registers, Varek's biography and voice, the Act I chain, the burn, the Faolchú and the binding-as-anchor all stand unchanged unless named below. Verbatim lines still belong in `quest_writing.md`; the lines here are drafts to be moved there once approved.*

---

## 0. Title

**The Old Gates.** "Dungeon of Shadows" was a placeholder and, in dialog, the name of one specific gate under Ashenmoor. It keeps that name in-world (Bram, Edna and the children can still say it) and loses it as the title. The title is the vernacular register's own word for the anchors, which tells a new player what the game is about before it says anything else.

---

## 1. The archipelago

Three islands, three nations. A player who forgets where they were should know within seconds from the land, then the buildings, then the first voice.

### 1.1 Tír na nGeataí — the Gatelands (south; the home island)

- **Land.** Temperate and green. The only island with autumn woods. Fens, moors, low ranges, the Dearg, the Hollowed Wastes. Stone walls between fields. The densest anchors anywhere.
- **Buildings.** Whitewashed lime and thatch in the villages; grey ashlar towns; the Crown's cities of pale stone and terracotta with cornices — a Norman state laid over an Irish-register countryside that never quite consented. Garrisons in slate.
- **Government.** **The Crown**, hereditary, seated at Coeur de Vie. Royal Herald, Royal Mage Corps, royal roads with patrols. Lords over towns, Elders over villages. Every "royal" string in the game means *this* crown and no other.
- **Economy.** The land — grain, cattle, wool, horses — and the gates: a salvage economy of adventurers, rubbings and relics that the Crown licenses and taxes. Known for horses and patience.
- **Pride.** The old tongue, a road known by its stones, never leaving a wounded man. **Contempt.** Haste, coin-counting, "people who've never buried a neighbour."
- **Claim on the gates.** Royal property.

### 1.2 Na Críocha — the Mark (north-west)

- **Land.** Cold. Tundra, black moor, snow-pines, the largest ranges, the strait. Wind that has a name in every valley.
- **Buildings.** Timber halls and longhouses, dark shingle, palisades, squat stone garrisons. Nothing whitewashed; nothing decorative that does not also keep out cold.
- **Government.** **The Captains' League** — fort-captains and free towns in a rough confederation. Office by acclamation, disputes by duel, no king and a scorn for the word. Captains over garrisons, Reeves over towns.
- **Economy.** Iron and silver from the ranges, timber, furs, and *men* — the Mark exports soldiers; half the Fighters' Guild is Markish. Quietly sponsors the free captains who prey on Crown and Compact shipping. Known for steel and mercenaries.
- **Pride.** Toughness, an oath kept, a quarrel finished by noon. **Contempt.** Priests, ledgers, soft hands, anyone who hires a guard instead of being one.
- **Claim on the gates.** They belong to whoever holds them.

### 1.3 Aurenne — the Compact (north-east)

- **Land.** Warm. Dunes and salt marsh, dry scrub, cypress uprights, terraced coasts. The sea is a road, not a wall.
- **Buildings.** Cream plaster and tiled roofs, arcades, domes on the churches, warehouses on every quay, the academy's white towers.
- **Government.** **The Compact** — merchant houses under the Church of the Weaver. Priors over the church's towns, Factors over the houses' ports. Every hull that passes is tithed.
- **Economy.** The sea — fishing, salt, dyes, glass, shipping — and knowledge: the Mages' academy and the Church both sit here. Known for ships that come back.
- **Pride.** Ledgers, learning, paper over oaths. **Contempt.** Brawling, duels, and "gate-grubbing" — the Gatelands' salvage trade is sacrilege to the Church.
- **Claim on the gates.** The Weaver's loom; to clear one is to unpick it.

### 1.4 Relations

A cold peace, **one generation** after a war the Crown won and the Mark remembers; the Hollowed Wastes was its field. Trade runs by sea, so ferries and the player's ship are political objects. Piracy is the Mark's undeclared war; the Compact's tithe-ships are the pirates' favourite prey; the Crown answers with patrols. Nobody is at war, which is worse: it can be pushed, and Act II pushes it.

### 1.5 Mixing rules (generator)

- **Climate by island, not latitude**: south temperate, north-west cold, north-east warm.
- **Inland provinces are homogeneous**: one people, one house style, one dialect, one set of names.
- **Ports and edge cities blend**: two peoples in the crowd and a third at the quay; a foreign quarter in the other nation's house style; harbourmasters are often foreign; mixed-heritage NPCs exist only here.
- **Speech follows the speaker, not the province**: a Markish smith in an Aurennais port still says *aye*.
- **National signage**: banners and guard colours at every gate (Crown crimson-and-gold, Mark black-and-iron, Compact blue-and-white), lords' titles by nation, tolls by nation (Crown roads patrolled, Compact ports tithed, Mark duels legal).

---

## 2. The peoples

Four. Three are nations; the fourth is older than all of them and lives inside each.

| | Gatelanders (*Tírfolk*) | Markmen | Aurennais | Old Blood (*an Seanfhuil*) |
|---|---|---|---|---|
| **Body** | fair to ruddy, freckled, dark or red hair, wiry, middling height | tall, broad, pale, ash-blond, grey-eyed, weathered young | olive to brown, dark hair, lean, quick | short, grey-pale, black hair, slight; sigil-script tattooed at the wrists |
| **Names** | Irish register (Niamh, Lorcan, Áine) | Anglo register (Bram, Edna, Wystan) | Norman register (Rémi, Margaux, Amaury) | Irish deep register, older forms (Fíachra, Sadb, Cúán) |
| **Speech** | proverbs, indirection, no bare yes/no ("I would not"), oaths on the Weaver | short sentences, *aye*, nicknames, oaths on iron and blood, no honorifics | formal, honorifics (*Factor, Prior, Master*), qualifiers, contract metaphors, never an oath | sparing, exact, old words; answer questions with the older name for the thing |
| **Called by others** | *turf-cutters* (Mark), *gate-grubbers* (Compact) | *hill-dogs* (Gatelands), *the unlettered* (Compact) | *ledgers* (Gatelands), *tithe-men* (Mark) | *cold-eyes* (everyone) |

### 2.1 What they say of each other

| speaker → of | Gatelanders | Markmen | Aurennais |
|---|---|---|---|
| **Gatelanders** | — | *"Hill-dogs. Loud, drunk, they'd duel a fencepost."* — *"I'd walk any road with a Markish crew. Those people kill bears at ten."* | *"Ledgers. Won't shake a hand without a witness."* — *"Their ships come back. Ours don't."* |
| **Markmen** | *"Turf-cutters. Slow, sly, a proverb for every debt unpaid."* — *"A Gatelander won't leave a wounded man. I wouldn't say that of a Markman."* | — | *"Tithe-men. They'd sell you the rope for your hanging and charge for the knot."* — *"Their steel's better than ours and they know it."* |
| **Aurennais** | *"Gate-grubbers. Dig up what should stay buried and call it a living."* — *"Nobody keeps a field or a promise like a Gatelander."* | *"The unlettered. A nation that settles arithmetic with axes."* — *"Want a thing done by nightfall? Hire a Markman. Pay him after."* | — |

All coinages are in-world, mutual, and about work, land and gods — never bodies. Every one is contradicted by a named NPC somewhere.

### 2.2 The player's people

Chosen at character creation, with the eight archetypes. It is camouflage: NPCs greet, price, insult and trust by it; guards in the Mark are warmer to a Markman, the Church colder to a Gatelander. Descriptions of the player by NPCs are consistent for the three nations.

**If the player is Old Blood, the camouflage does not hold.** NPC descriptions of the player are deliberately inconsistent — the innkeeper says dark hair, the guard says grey eyes, Edna says *"I never could look straight at you."* Mechanically: first-touch Comprehension, the Cold (§3.3), the Church's attention, Markmen who won't sit with you, and Varek's discoveries arriving faster. Only the player knows why the descriptions disagree (§4.2).

---

## 3. The Old Blood

### 3.1 Who they were

Not an empire — empires leave roads and taxes; the Old Blood left the same structure in every province of every island and nothing else. That is what a guild leaves. They were the **Fíodóirí**, the Weavers: a small endogamous priesthood of makers who strung the loom about fifteen centuries ago. The anchor had to be distributed to work, so they built a gate in every province. They ruled nobody. They were *needed*, which is stranger.

**The price — the Clearing (an Glanadh).** The world has a carrying limit. Every life that ends still *weighs* on the anchor: the dead persist as drift, a residue of continuity the loom must keep holding, and left alone it accumulates until the world slips. The Weavers' discovery was not how to bind the world but how to **unmake the dead**. Every sigil is carved over a grave because the sigils are where the departed are burned out of reality so the loom can go on holding the living. The three peoples were told their dead *held* the world; in truth their dead were *erased* so the world could continue. Nobody who gave a grandmother to a gate was lied to about the outcome, only about the mechanism. This is the folk memory nobody can articulate, and why *cold-eyes* is said with a shudder rather than contempt.

Downstream: **undead are the uncleared** — residue the sigils failed to burn (Caer Uaigneach is a backlog); clearing a gate is maintenance, and the adventurers' economy is the Clearing continued by people who don't know it; the Church blesses the dead *into* the gates without knowing what happens there, and the Compact's sealing of gates would, over centuries, drown the world in its own residue. Varek reads what the sigils are *for* before he reads the window — his *"cage called a loom"* is about the Clearing; he believes unbinding will let the dead stay, and whether he is right is the game's open question. The meta reading, never stated: the world forgets in order to keep running, and the player's returns are the same economy seen from outside.

**The Withdrawal.** When the loom was finished it worked — the makers saw what it did to the dead, and something looked through the window they had made. Only the makers felt both. They broke their own order the same year, scattered, forbade the *reading* of sigils (touching is permitted; understanding is not), married into the three peoples and stopped teaching. Nobody drove them out. Fifteen centuries dwindled them to a minority that keeps the tongue and the tattoos and not the knowledge. The deep register of magic is their language, spoken now by people who don't know what it says. The Church of the Weaver is a later Aurennais institution that took the name and forgot the price.

**Anthropology.** A small founder population, guild-endogamous for centuries, gives a distinct look; fifteen centuries of marrying out makes "Old Blood" a spectrum — strongest inland in the Gatelands' hills and the Mark's high valleys, diluted at every port. The tattoos are cultural: given at coming-of-age to children who show the marks, by elders who no longer remember why the script is the script.

### 3.2 Varek

Old Blood by descent, raised a Gatelander in a village that dug in the old structures for what could be sold. He read the makers' holy writing the way his village read a wall: for what could be pulled out. His heresy — *"they built a cage and called it a loom"* — is authentic because it comes from inside. 250 years of reading against the Withdrawal's law is why he can feel the load-bearing pieces, why he does not age, why he is cold: he has read himself most of the way out of being human and most of the way toward the glass. His discoveries about the player (§6) are not genius; they are what any Old Blood reader who kept looking would eventually see. He is the only one who kept looking.

### 3.3 The sigils and the Old Blood

- An Old Blood touch skips Impression: first contact resolves at **Comprehension**.
- They feel warm stones at a distance. Every rubbing-seller and hermit who points the player at a gate is one of them.
- **The Cold.** Each Mastery-tier reading takes warmth: pallor deepens, eyes grey — and readers begin to *notice the window*: a pressure at the edge of attention, the sense of being regarded. The Withdrawal's law existed to prevent exactly this. Every Old Blood reader who ignored it went strange, then quiet. For an Old Blood player, the Cold is a visible stat that rises with Mastery and never falls.

---

## 4. The Makers and the Guest

### 4.1 The pantheon

The Irish-register culture did not worship the loom's builders. They worshipped *what the builders were making*, and named the makers by their work. Six have temples; the Session-92 shrines become them, each with a statue and a boon in its domain.

| God | Domain | Icon | Shrine boon |
|---|---|---|---|
| **An Mhuir** — the Sea | tides, ships, whales; *"the sea owns them twice a day"* is scripture | a hull | the Road (speed) |
| **An Spéir** — the Sky | weather, day and night | the sundial | Renewal (regen) |
| **Na Beithígh** — the Beasts | creatures; the antibodies are *"her children who don't know their mother"* | a wolf | the Arm (melee) |
| **An Chloch** — the Stone | terrain, the old gates, the anchor | a gate | Stone (warding) |
| **An Teallach** — the Hearth | towns, roads, names; the merchants' god | a lamp | the Mind (spell cost) |
| **An Fíodóir** — the Weaver | the binding; the loom the sigils are the seams of; *the* god of the makers | a shuttle | a sigil rubbing |
| **An tAoi** — the Guest | the one the loom was strung *for* | none | — |

### 4.2 The Guest

The seventh has no shrine. The Guest is found in defaced niches, in a chapel the Church bricked up in Aurenne's capital, in a lorebook that argues whether the Guest is a god or an *intrusion*. The Church's line: the Guest is a mistake of the old culture. Varek's blasphemy: the Guest is real and has arrived.

**Heresy, not prophecy.** The canon rule stands: no chosen-one prophecies. What exists are three *descriptions* that recur in old art and older songs — *the one who returns; the one who walks the shortest road; the one who dies and does not* — and nobody applies them to the player until Act III, once, by someone who then goes back to their bread.

**The chapel.** Findable, bricked, entered from a cellar in Aurenne's capital. A statue with no face. Praying there does the one thing the game is otherwise never allowed to do: the world sound continues, the HUD stays lit, and the screen goes **black for four seconds** — long enough to see yourself in it. When the world returns there is one line in the log and nothing on screen: *It saw you.* No boon. The next time Varek meets the player he knows they went there, and for the first time he is frightened *of* them rather than for the world.

**The inconsistent player.** The Old Blood are the people the window opens through; an Old Blood player is what is on the other side of it. That is why NPCs cannot describe them consistently (§2.2). It is never explained.

---

## 5. Dragons

Canon's "no dragons" is amended by canon's own logic. The Faolchú scales: a *catastrophic* anchor failure gives the world's immune response more material than it can shape, and what it makes has wings. Dragons are the largest antibodies — rare, one per failure, each a mark of where the binding tore worst. A lair with a dragon is a place where something terrible happened to the loom. They do not speak, do not hoard by choice (the hoard is what the failure pulled up with it), and do not know what they are.

---

## 6. Varek's five discoveries

The meta-thread, staged. Each is a real property of the frame, drawn from real state, recognisable only to the player. He never says *game*, *save*, *player*, or *screen*. The audience supplies every one.

| # | Discovery | State read | Where | Draft line |
|---|---|---|---|---|
| 1 | **The direction** — a will not located in the body | first sigil touch (canon) | the Ashfeld | *(canon, unchanged)* |
| 2 | **The returns** — he has watched the player die, and they are standing in front of him | death count ≥ 1 | the nearest field after the Mastery-touch meeting | *"Áine's brother died in the Mouth fifty years ago and stayed dead. You didn't. I want to know where you go."* |
| 3 | **The held breath** — when the player leaves, the world stops; the anchor feels the skipped time | real-time gap between sessions ≥ 6 h | Act II, any field | *"Nine days passed for me between your last word and this one. For you it was an evening. I could tell by your boots."* |
| 4 | **The map** — the player knows the shape of places they have not seen | discovery order: a site fast-travelled before its road was walked | Act II, second island | *"You walked to Portclare by the shortest road on your first day. Nobody has seen that road from above."* |
| 5 | **The window** — the player is not in the world; the world is turned toward them; the binding is glass and he has stood on the wrong side of it for 250 years | Act III, the root | the root-lair | *"When you look at me — what is between us?"* — he never hears the answer; he reads it in how long the player takes to reply. |

**The Guest's chapel** inserts a sixth, unnumbered, wherever he next appears: he does not ask a question that meeting. He watches the player's hands.

**The final beat.** The writing doc's *"a Sunday afternoon"* is the design note above the monologue, not the monologue. The idea arrives in his idiom or not at all. Candidates:

- *"Two hundred and fifty years. Every death written down. And I was the whole of your evening."*
- *"I kept asking what you wanted. You never wanted anything. You were passing the time. I think I was how you passed it."*
- *"I built a world that couldn't be changed, so that when someone came who could change it, I'd know them. You came. You changed nothing. You were resting."*

---

## 7. Magic, reconciled

The v80 guild vendors stay but are demoted to what canon says they are.

- **Guilds teach Impression and Comprehension** (institutional register, weaker) and cap at Comprehension. Dungeon spellbooks are institutional copies and cap likewise.
- **Sigils alone grant Mastery.** Touching a sigil at Comprehension resolves it to Mastery for those with the Intelligence; the Mastery-touch remains Varek's second-attention trigger (canon).
- **Finding sigils in a world this size.** Sigils live in one gate in four and in every fort's deepest room. Three pointers: **rubbings** (items sold by the Mages' Guild and given by Aldwyn once per act) that star a specific gate on the map; **rumours** keyed to the nearest sigil gate in the province (*"there's a warm stone in the old gate north of Glenowen"*); and **Súil an Fhíodóra**, the Weaver's Eye — a Comprehension-tier Mages' spell that turns the compass toward the nearest unvisited sigil for a minute.

---

## 8. Story structure across the archipelago

Act I is authored where it is. Acts II and III are written as *patterns the generated world fulfils*, not corridors through it.

### 8.1 Act I — the Gatelands (as shipped)

Crypt of First Light, Q1–Q7, the burn, the Faolchú, the Royal Mage Commission. Unchanged in content, re-voiced under §10, and the burn rebuilt as a state:

**The burn as a state.** Ashenmoor is a generated settlement now, so the burn is `worldState.burned[siteId]` rather than a second place. A burned site builds the **burned variant** of its own layout — the same lots as charred shells, black ground under an ash stamp, no residents, lamps or music, the dawn palette locked *inside the pad* while the world outside keeps its clock. Survivors' defs relocate to Ironhaven's crowd. The night is a site event scripted on Q7: the goblin raid at the gates as cover, the fires as a timed sequence across the lots, the **Faolchú** spawned in the square as a boss with its lesser wolves extruded on hits, and the state committed when it dies or the player leaves the pad — the village is the arena. Reusable: in Act II two more settlements burn as Varek's etching fails anchors on the other islands (one preventable if the player is fast); a burn on the Mark produces a wolf-that-isn't, on Aurenne something with the seams glowing through scales, and the worst failure at the Salt Mouth is the dragon. Hooks read the state (rumours, ambush rates, the lord's ledger); the map draws a burned site in charcoal.

### 8.2 Act II — The Widening Dark (three islands)

The commission opens the sea: ferries, the ship, the other two nations as foreign countries. The etched-over sigils are on all three islands, and each nation reads the evidence through its claim.

- **The pattern.** The player needs proof from **three islands**; *any* qualifying sigil gate on each counts. Corwin gives the first (Gatelands). Rubbings and the Weaver's Eye lead to the others. The moment the third is seen, the scale is understood — that understanding *is* the beat.
- **The courier.** Someone is moving seam-material by sea. The free captain **Oswy Blackhand** (Markman, the League's deniable instrument) keeps a log written to *"the one who reads over my shoulder."* Taken aboard his ship; first sighting of Varek's reach beyond the Gatelands.
- **The Compact.** Tries to seal gates rather than clear them; Aldwyn's natural ally; the Church's Prior is the first person to say *cold-eyes* to the player's face.
- **The League.** Tries to hold gates; the garrison captain at the strait is Varek's unwitting agent, paid in sigil-light; the spire above the garrison holds the second seam.
- **The Crown.** Tries to seize gates; Caldric's survey teams are the ones etching, on orders they think are Aldwyn's. They are not.
- **Corwin** is the travelling face: at whichever port the player lands at when the story needs him, following the same evidence.
- **Varek.** Discoveries 2–4 at the nearest field. Climax at the Ashfeld as canon; choice: stop him, help him, third path.

### 8.3 Act III — What Was Bound

Collapses to one authored place: **the root beneath all the gates**, on Aurenne's far side under deep water, reached by ship and Water Breathing — the first instanced lair, the one the Session-92 lairs rehearsed. Discovery 5. The final beat. Endings in §11.

### 8.4 Factions (Morrowind-House exclusivity)

| Faction | Seat | Ranks | Top | Exclusive with |
|---|---|---|---|---|
| **The Crown** | Coeur de Vie | Commissioner → Warden of Roads → Knight of the Gates | a keep | the League, the Compact |
| **The Captains' League** | the strait garrison | Sworn → Reeve → Captain | a garrison | the Crown, the Compact |
| **The Compact** | Aurenne's capital | Clerk → Factor → Prior | a house and a ship | the Crown, the League |
| **The free captains** | no seat | — | — | illicit; standing with them costs standing everywhere else |

The Fighters' and Mages' Guilds stay cross-island and neutral. Past a faction's second rank the other two close.

---

## 9. Anchored places

The story needs a handful of specific places beyond the home island. The generator is told what to look for, picks the best candidate deterministically from the seed, names it, and flags it so it always exists.

| Place | Constraint | Purpose |
|---|---|---|
| **Caer Slige**, the strait garrison | Mark; garrison kind; within 500u of the coast facing the strait | Varek's agent; League seat |
| **The Spire of Caer Slige** | tower kind within 300u of the garrison | second seam; Discovery 4's vantage |
| **Port Blackhand** | Mark; a port on the strait; pirate-friendly | Oswy's haven |
| **Cill an Aoi**, the bricked chapel | Aurenne's capital; a cellar under the cathedral | the Guest |
| **The Salt Mouth** | Aurenne; the Mouth's counterpart; a lair on the warm coast | the Compact's sealed gate; a dragon |
| **The Root** | deep water off Aurenne's far side; islet lair | Act III |
| **Fields** | one per island: a flat with the wastes' bone-and-blade scatter; the Ashfeld on the home island | wherever Varek stands |

---

## 10. Vocabulary and tone (the purge)

Ruled by `language_audit.md`. Decisions:

- *The dungeon* (singular) → the gate by name or "the old gate." *The dungeons* → "the old gates" (vernacular) or "the anchor places" (scholarly). *Dungeon* survives in flat combat talk and UI.
- *The village / the town / the city / the capital* → named. There are three capitals.
- *Royal / the crown / the kingdom* → the Crown of the Gatelands only, and said as such where a foreigner might hear.
- *The north road / the pass / the mountains* → named roads, passes, ranges.
- *Portal* → code only.
- Regional styles stay but are written **dry**: nobody in a mushroom town thinks it is remarkable.
- Pacing: every beat in Acts II–III ends with a direction — a star, a name, a ferry — or the width swallows the thread.

---

## 11. Endings

| Choice (Act II → III) | What happens | After |
|---|---|---|
| **Help him** — unbind | The loom is released. The game ends and **remakes itself on a new seed**: a new archipelago, the player's name, people and one carried item persist. The Amaranth. | new game on the new world; Varek's list is found in the first gate |
| **Stop him** — reseal | The window narrows. The world is safe and smaller; magic thins; Varek's list gets its last entry — his own. | the world as it was; the Guest's chapel is empty stone |
| **The third path** — stay, knowing | The player lets him understand what they are. He asks them to stay. The binding is left open *knowingly*: sigils return, magic deepens, the world lives watched. | once in a long while someone says one of the three descriptions to the player and goes back to their bread; Varek is seen, at a distance, at fields |

---

## 12. Consequence hooks

| State | Trigger | Effect |
|---|---|---|
| `roads[id].cleared` | bandit camp / road quest done | ambush chance on that road → 0 for 20 game-days; a merchant cart walks it; camps left alone grow by one bandit per 10 days |
| `favor[siteId]` | ±1 per quest done, −2 per quest abandoned | ≥3: shop discount, "friend of the town" greeting; ≥5: a house deed; ≤−2: guards follow |
| guild rank | as shipped | greetings everywhere; the keep opens at Warden; the other guild charges or refuses |
| faction rank | §8.4 | national gates, tolls, patrols react; past rank 2 the other factions close |
| `lairs[id].dead` | lair beast killed | stays dead; nearest glade doubles herbs; a rumour within two provinces |
| `shrines[id].count` | third prayer at one shrine | that shrine's boon becomes permanent |
| `people` (player) | at creation | greetings, prices, insults, trust, and whether descriptions of the player agree |
| `cold` (Old Blood player) | each Mastery touch | pallor, greyer eyes, and the Church's interest |
| **Varek's notes** | everything above, plus deaths, session gaps, discovery order, the chapel | never displayed; returned as a sentence, once |

---

## 12a. Settlement states — the prosperity model

Towns are generated from a seed and a plan, so a state is an input to the generator, not a second copy of the town. Every settlement carries one number and a few flags, and the same seed builds a different town from them.

### Prosperity (0–100)

| Reads | Effect |
|---|---|
| **Size** | lots built = plan × prosperity; a village at 30 is four houses and a well, at 90 a chapel, an inn with rooms and a second street |
| **What's open** | shops appear in order — smith before armourer, inn before guild hall; guild halls need 60, a keep 80, a harbour needs a port *and* 50 |
| **People** | crowd density, children in the square, a lord on the plaza or nobody at the well; below 35 half the houses are shuttered and the resident is "gone to Ironhaven" |
| **Fabric** | walls above 55 (and only after a threat below), lamps lit above 40, banners at 70; at 20 the thatch is patchy, the paths are mud, the name board leans |
| **Prices** | buy prices fall and sell prices rise with prosperity; the ledger's discount stacks on it |

### Flags (variants of the same layout)

`burned` (§8.1) · `sacked` · `plague` · `occupied` (by a faction) · `siege` · `festival` · `abandoned` (the ruin variant) · `rebuilt` · `scaffold` (a build in progress) · `owned` (the player's deed).

### Drivers

- **Roads**: a cleared road between two towns raises both by a point per game-week; an ambush-ridden one lowers them. Caravans exist or don't.
- **The nearest lair**: live, it drains; dead, the towns grow.
- **Anchor health** (§3.1): a cleared gate keeps the province clean; a backlog means undead on the roads and a town that slowly empties — then `plague`.
- **Faction control**: an occupied League town loses its duels and gains patrols; the Compact's tithe lowers a port and raises its capital.
- **The player**: quests for the lord, camps cleared, sigils restored — and investment.

### Building up — investment and deeds

Prosperity ≥ 40 and favour ≥ 3 with the lord unlocks *"What does the town need?"* — a menu priced from the town's size: a well, a chapel, walls, a guild hall, a harbour, a bridge, a road to a neighbour, an inn. Paid, the build appears over three game-days (`scaffold`, then finished), prosperity jumps, and the town remembers who paid: the player's name on the well, a room kept at the inn, guards who don't follow. Enough investment and the lord offers the **deed**: an owned town with weekly income, a bell that gathers the guard, and a reason to defend it.

### Tearing down

- **Sacking**: a bandit camp left alone in a province eventually raids the nearest village — the rumour first, then the burning at night; in time it is the Faolchú fight's cousin with humans; too late and the town is `sacked` — half the houses shells, shops gone, the lord dead or fled, prosperity 15.
- **Pirates** do the same to ports from the sea; the town's boats are gone after.
- **Anchor failure**: the burn proper, everywhere Varek's etching reaches.
- **Siege**: when the cold peace breaks in Act II, border towns get walls raised, gates shut, an enemy camp outside, and a choice of which side to let in.
- **Plague** from a backlogged gate: shuttered houses, a priest at the well, a quest to clear the gate before the town empties.
- **Abandonment**: prosperity at 0 for a season builds the ruin variant — a ruin the player can later re-found, which closes the loop: a ruin becomes a village because its road was cleared.

### Why it is depth

Every state reads the same few numbers, and every number is one the consequence hooks (§12) already write. A player who never opens a menu still watches the road they cleared turn a village into a market town over a season, and the village they ignored turn to ash. The world becomes a record of what the player did.

---

## 13. Implementation map

- **Peoples**: a `PEOPLES` table (body params, name registers, dialect rules, attitudes); the NPC builder takes height, shoulders, hair, tattoo; character creation gains a people selector; the description-inconsistency for Old Blood is a dialog substitution.
- **Nations**: climate per island; house style, banners, guard colours, titles and tolls per nation; port blending weights; inland homogeneity.
- **Settlement states** (§12a): `prosperity` + flags per site in `worldState`; the generator reads them (lot count, shop order, crowd, fabric, prices); drivers ticked per game-day (roads, lairs, anchor health, faction control); investment menu, scaffold builds, deeds; sacking/pirate/siege/plague/abandonment events; the burn variant. This is the substrate the story's burns and sieges stand on — fourth implementation block, after peoples, nations and magic.
- **Magic**: guild cap; sigil Mastery; rubbings as map-star items; sigil rumours; the Weaver's Eye.
- **Pantheon**: shrine → god assignment and statue; the chapel and the black screen.
- **Varek**: a state reader (`deaths`, `sessionGap`, `discoveryOrder`, `chapel`) and a field POI per island; encounter triggers.
- **Factions**: standing, ranks, exclusivity; quest chains per faction.
- **Anchored places**: constraint-solver at generation; flags in cell data.
- **Endings**: new-seed carry-over; the two other states.
- **Purge**: the audit table, then rewrites in `quest_writing.md` and the build.

---

## 14. Decisions taken in this addendum

Dragons: in, as antibodies. Title: *The Old Gates*. Varek: Old Blood raised Gatelander. Player: chooses a people; Old Blood descriptions are inconsistent. The war: one generation ago. Start nation: the Crown. Cast: existing plus Oswy Blackhand. The Guest's chapel: black screen, *It saw you*, no boon. "A Sunday afternoon": design note, not dialog.
