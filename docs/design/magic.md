# Magic

*The systems designer, 29 Sep 2026. A proposal, not a spec: nothing here is built until docs/decisions.md carries a `Michael:` line under it.*

## The problem in Michael's words
> "Today's mix of old Elder Scrolls spell-buying with Skyrim's shout-style dungeon unlocks doesn't convince him. Wanted: a loop that isn't *buy more/better spells* — schools as skills, discovery, crafting or combining, costs and risks, spells that change how you move through the world." (backlog J)

The canon sets the limit: a spell is *received* from a sigil in the deep tongue, Intelligence decides how much resolves (Impression, Comprehension, Mastery), the academies' written magic is correct but weaker, and the makers "didn't think of these as weapons".

## Today
Sixteen spells (`SPELLS` plus `BUFF_SPELLS`): six bolts, a heal, and nine self-buffs (Feather, Light, Haste, Water Walking, Water Breathing, Shield, Night Eye, the Weaver's Eye, Levitate). `touchSigil` resolves the next tier if Intelligence meets `intReqs`, and only a sigil gives Mastery; `spellShopTopics` and spellbooks sell Learn and Deepen for 60–1,400 gold, capped at Comprehension. `castSpell` spends mana and at Impression rolls a 40% wild effect (scatter, fizzle, backlash, reversal); `applySpellDamage` adds `level × dmgLvl` flat (Caor at level 20: 20 + 60), the Might runaway again. Two things are hollow. A carving is built only where `SIGIL_PLACEMENTS` names the seed, seven legacy dungeons; the world's 368 sigil gates (seeds from 100,000) glow and are sold as rubbings, but I found nothing that carves inside one. And Shield's `warding` is read by nothing (the quest writer, 28 Sep). In play the loop is: buy the buffs, wait for Intelligence.

## Directions

All three end the guild's spell sales, drop the flat `level × dmgLvl`, and make the code's six schools (Tine, Uisce, Cloch, Scáth, Solas, Gaoth) skills under the Morrowind book (Michael, 27 Sep). A school's skill sets power × (0.6 + 0.8 × skill/100) and cost × (1.4 − 0.8 × skill/100): ×0.64 power for ×1.36 cost at 5, ×1.4 for ×0.6 at 100. Intelligence keeps the tier and the mana pool, as the canon has it. A *use* is a cast that does something (hits an alert foe, heals lost health, carries you over something), one per school per second. Perks arrive at 25/50/75/100, 24 in all. **Overcasting** is everyone's: short of mana, the rest comes from health at ×2 with a 0.5 s stagger, a risk rather than a greyed-out button.

### A. Sigils and schools — every spell a carving, the catalog filled
**The loop.** Find a warm stone, go down to its carving, come out with a spell or a deeper tier; cast it to raise its school. Spells are fixed, as today.
**Rules.** The canon's 38-spell catalog goes onto the sigil gates, one spell a gate drawn by region (Tine in the Wastes, Uisce on the coast), so each recurs at 8–12 gates and a second gate gives the next tier. The guild keeps rubbings and teaches the nine buffs to Impression only. Movement arrives as fixed spells: Éan (Leap, 2.4 units of rise), Scáth (Shadow Step, 8 units), Dul Thart (Phase, 0.6 s through foes).
**Touches.** `SIGIL_PLACEMENTS` becomes a rule by region and seed; the dungeon builder carves floor 2 of any sigil gate; `touchSigil`, `spellShopTopics`, `applySpellDamage`; 22 new spell rows.
**Conflicts.** Still a list you collect, each spell better than the last. Discovery replaces buying; *more/better* stays.
**Cost.** Three Opus sessions: carvings in every sigil gate; school skills and overcasting; the 22 spells, the movement three first.

### B. Words of the deep tongue — sigils teach words, you make the spell
**The loop.** A sigil gives a **word**, a root naming what a thing *is*: Caor, a spark; Sioc, frost; Cloch, stone; Éan, flight. The guild teaches **forms**, the institutional register's grammar. A spell is one form and one or two words, put together on a parchment page in the hub and kept on a hotkey. Minute to minute you read a place (a river, a ledge, a web across a door, a troll that sweeps) and cast what it asks for. A new word multiplies what you can make instead of replacing a spell with a better one.
**Rules.**

| Form | Learned at (Mages' Guild rank) | Does | Mana |
|---|---|---|---|
| *Sent* | Novice | a bolt, 30 units | the word's cost |
| *Worn* | Novice | on yourself, 30–240 s by tier | ×1.0 |
| *Touched* | Adept | on a thing within 2 units: a lock, water, a fire, a door, a foe | ×0.6 |
| *Laid* | Evoker | on the ground at the crosshair within 12 units, 10–30 s | ×1.5 |
| *Held* | Warlock | a cone of 4 units while the button is down | ×0.5 a second |

Forms are free at rank, so gold can't buy ahead. Each word has one behaviour per form, or none ("the word won't take that shape"): 24 words (the build's 16 and eight more) × 5 forms, 120 cells to write, not a combinatorial space. A second word adds only its **rider**: Caor burns, Sioc slows, Gaoth pushes, Fréamh holds, Solas lights, Slán mends. Joining needs both words at Comprehension and costs their sum plus 25%. A word at Mastery carries the canon's Mastery effect into every spell it is in.

| Spell | What it is for |
|---|---|
| Éan, worn | jump +70% for 20 s; at Mastery, no fall damage (*Wingless*) |
| Cloch, laid | a stone pillar 1.5 units high for 20 s: step up to a ledge |
| Sioc, laid on water | an ice floe 3 units across for 30 s: cross a river |
| Gaoth, laid | an updraft that throws a jump 3 units higher |
| Scáth, sent | you arrive where the bolt lands, 12 units, never through a wall |
| Caor, touched | light a brazier, burn a web |
| Sioc + Tonn, laid | a wave that freezes where it stops: a bridge 6 units long |

**Costs and risks.** Each Impression word gives a 30% wild roll, and the wild list gains *overshoot* for movement (the pillar rises 3 units, the step lands 4 long). Words of two schools add 10% until both schools reach 25. A spell is named in the register of its weakest word: Irish, then the English subtitle, then the true name when every word is at Mastery.
**Touches.** `SPELLS` becomes a table of words; `knownSpells` becomes words, forms and up to eight made spells in `SS`, migrated once in `ssSanitizeLoaded` (each known spell becomes its word at its tier with its old form). `castSpell` resolves form, word and rider instead of per-spell branches; `touchSigil` teaches words, `spellShopTopics` forms. *Laid* spells are solids for `solidAt` and the dungeon's collision: the hard part. The spell list becomes the parchment composing page (backlog E). A cast is one row in combat B's attack table (a *sent* cast: 0.35 s wind-up at ×0.35 speed). `onMasteryTouch` and `worldState.cold` stay: Varek notices the first word at Mastery.
**Conflicts.** Retires spell sales and spellbooks; guild rank starts to matter. A laid pillar could break a dungeon (over a wall), so laid objects are capped at 1.5–3 units and refused inside walls and doors. In a friend's world the host owns laid objects; nothing is timed under 150 ms.
**Cost.** Seven sessions. One Fable: words, forms and the resolver, the migration and the save. Six Opus: the composing page; carvings in every sigil gate with words by region (A's first session); school skills, overcasting and the 24 perks (after the skills sessions); *laid* as world solids; *held* and the riders; the eight new words the build lacks (Tonn, Éan, Fréamh, Reo, Tintreach, Dorcha, Loscadh, Dul Thart).

### C. Three registers — who you learn from is the choice
**The loop.** A's fixed spells, each learned in one register of your choosing, for good. *Folk*: a village hedge-witch, paid in herbs; never wild, 70% power, no tier past Comprehension. *Guild*: gold and rank; reliable, capped at Comprehension. *Deep*: the carving; wild at Impression, the only road to Mastery, feeding `worldState.cold` and Varek's attention.
**Conflicts.** The canon has folk magic but no hedge-witches; the quest writer would write them for every nation. The choice mostly weighs power against safety, once per spell.
**Cost.** A's three sessions plus three: folk teachers and reagents, the register rules, dialogue.

## Recommendation
**B**, with A's carvings in every sigil gate built first. It is the only one where learning gives you more to *do* rather than a bigger number: a new word multiplies across five forms and every word you hold. The loop is discovery (a warm stone, a rubbing, a carving) and then making, so nothing reduces to buying; and the pillar, floe, updraft and step are made for the ledges and rivers the platforming proposal will build. It fits the canon better than a list: the makers' words name what things *are*, the academies supply grammar, correct and shallow, and Mastery shows as the spell's true name. Precedents: Morrowind's spellmaking (the freedom without the exploit, since riders are fixed), Arx Fatalis's runes, Magicka's element pairs.

## What must be true first
- **The skills sessions** (Morrowind book, answered): the six schools as skills and the perks at 25/50/75/100.
- **Enemies by place** (issue #51): spell damage is tuned against a known tier once `level × dmgLvl` goes.
- **Combat B's Fable session**: the attack table a cast joins as a row, and one resolver.
- **The platforming proposal**: places that ask for the movement spells, built to B's numbers (a 1.5-unit pillar, 12 units of reach).
- **A fix owed now**, whatever is chosen: Shield's `warding` buff does nothing.

## Not asked
Enchanting and scrolls belong to the alchemy and crafting proposal. No summoning: the canon has no Conjuration, and a summoned ally is a second body to sync for a friend. No new schools (Gaoth stays, though the canon's resist list names five). Casting as a crime waits for the crime numbers. The Mouth's Mastery gate stays as canon. Perk names and the words' texts are the quest writer's.
