# Capes and cloaks as an item slot

*The systems designer, 5 Oct 2026. A proposal, not a spec: nothing here is built until docs/decisions.md carries a `Michael:` line under it.*

## The problem in Michael's words
> "Can we add capes/cloaks as an item slot, and add a few cape types to the game? They should offer minimal bonuses, unless the cape is very rare/magical." (backlog J, 28 Sep 2026; ties to H.3's swinging cloaks, Michael's A the same day)

## Today
`EQ` (`14-items.js`) has ten slots (head, chest, hands, legs, feet, weapon, offhand, ring, amulet, ammo), laid out in the inventory by `EQ_SLOTS` (`66-hub.js`) and saved in the character row as `EQ` (`70-saves.js`). Armour comes from `makeItem` on `ARMOR_TYPES`: def = `TIER_BASE_DEF[tier] × defMult` (a tier 1 cuirass is 2, a tier 1 ring rounds to nothing), Fortitude gates tiers through `ARMOR_FORT_REQ`, and loot can roll one of eleven `ARMOR_ENCHANTS` (*of Endurance*, *of Clarity*, *of Might* …) that scale with tier. Cloaks already exist on bodies: `personGenome` gives one to 60% of Markish adults, 12% of Gatelanders and 10% of Aurennais, `buildPerson` hangs it from the `cloak` and `cloak2` bones in two halves, and `peopleSwing` swings it (Session 267). The player's own body (`tpBuild`, `54-thirdperson.js`) has the bones and swings them (Session 277) but its genome sets `cloak:false`, so you can never wear one.

## Shared by every direction
- **A new slot, `back`,** between Head and Amulet in `EQ_SLOTS`. One cloak at a time. Old saves get `back:null` in `ssSanitizeLoaded`; it lives in the character row with the rest of `EQ`, so nothing in `SS_CHAR_WS` changes.
- **The body wears it.** `tpBuild` reads `EQ.back` into the genome (`cloak:true`, its colour, its cut), and the swing already works. Three cuts on the two-half cloak: the long cloak (today's), a short cape to the waist (the lower half dropped), and a hood or a fur collar added at the shoulder bone. That is the look builder's half, about 400–700 triangles a cut, and the mesh inspector gains the three.
- **The dyer recolours it.** Michael chose one barber-and-dyer shop (#144); its look page gains a cloak row, for the fee it charges for the tunic.
- **No warmth bar.** Michael's B on survival kept needs out (hunger, warmth, fatigue). No direction here brings warmth back as a penalty; a cloak may help in the cold, never be needed there.
- **Loot rolls stay seeded.** Cloaks drop through the same `lootRand` stream as armour, so a co-op host's chest rolls the same cloak (CLAUDE.md's co-op rules).

## Directions

### A. A slot and a look
**The loop.** You buy a cloak because you like how it hangs, and keep it. Six mundane kinds (10–60 gold) differ only in cut and colour: def 1, weight 1–2. Loot at tier 4 and up can roll a cloak (one armour drop in twelve), and a looted cloak rolls `ARMOR_ENCHANTS` at its tier like a ring does: a Mithril-tier chest's *Cloak of Clarity* gives the same regen a Mithril ring would.
**Touches.** `ARMOR_TYPES` (one row, `slot:'back'`, `defMult:0`, def set flat at 1), `EQ`, `EQ_SLOTS`, `ssSanitizeLoaded`, the armour and misc `SHOP_STOCK`, `tpBuild`.
**Conflicts.** The mundane ones are a choice of colour with a stat line of 1; nobody ever wears the second one. An eleventh enchant slot is a *buy more* lever with no decision in it.
**Cost.** One Opus session (systems), one Opus session (look).

### B. Each kind one small virtue, in its place *(recommended)*
**The loop.** The cloak you wear says where you are going. Before a sea crossing you change into oilskin; for a night's burglary the dark hood; for a pilgrimage round the shrines the grey. Each virtue is small (5–25% of one thing, in one situation) and reads a system already in the build, so no new rule has to exist for a cloak to matter. Wet wool is the one cost: a cloth cloak drags in the water.
**Rules.** All mundane cloaks are def 1, with no tier.

| Kind | Sold | Wt | Gold | Virtue | Reads |
|---|---|---|---|---|---|
| Traveller's wool | any armour or misc stock | 1.5 | 12 | none; the plain one | — |
| Dark hood | towns and up | 1.5 | 25 | detection × .95 while sneaking; a witness's reach 12 → 11 | `_sneakDetectMult`, `witnessOf` |
| Oilskin | port towns | 2 | 30 | no swim drag; at the helm in rain or storm the sea-state hint shows the next shift of weather | `WORLD.isSwimming`, `WX.next` |
| Fur-lined (Markish) | the Mark | 3 | 45 | stamina regen +10% in snow, or at night above the treeline | `WX.type`, the region |
| Short cape (Aurennais) | Aurenne | 0.5 | 60 | barter +2% at the counters of the nation whose cut it is | the barter price, `nationKeyOf` |
| Pilgrim's grey | shrines' villages, the Church's towns | 1 | 20 | a shrine's boon lasts 25% longer | `SHRINE_BOONS` timers |

Every cloth cloak except oilskin slows a swim to × .9 (fur × .85): Daggerfall's rule that a choice of clothes is a choice of road, not of numbers. The detection and barter virtues are about a third of what a point of Finesse or two of Charisma give at their old curves, so they never decide a build; the boon's +25% lengthens a buff, it never grants one.
**Magical cloaks.** As in A, but a cloak's enchant rolls from a cloak list of five (*Endurance*, *Vigor*, *Clarity*, *Mending*, *Swiftness*) at 0.6 of the ring's strength, and keeps its kind's virtue. Rare and magical means: tier 4 loot and up, one armour drop in twelve. The named cloaks, three or four, belong to the unique-artifacts proposal (J, the next topic) and to the quest writer; this page only reserves the slot for them.
**Touches.** As A, plus a `virtue` field on the cloak's item, read in five places: the sneak multiplier, `witnessOf`, the swim speed, the stamina regen, the barter price, the shrine boon's duration; the hint line at the helm. One test drives each virtue under `g.spin()`.
**Conflicts.** The skills build will move sneak and barter onto Stealth and Speech (the skills page, Michael's A); the virtues then multiply the skill's result instead of the attribute's, a one-line change each.
**Cost.** One Opus session (systems: the slot, the table, the six virtues, the loot and the stock, the test), one Opus session (look: the three cuts on the player's body, the inspector entries). The dyer's cloak row rides the barber-and-dyer build.

### C. B, and the hood as a face
**The loop.** B, and the dark hood raised (a key, H) hides who you are. A crime witnessed while hooded goes on the account of *a hooded stranger* in that town, not on yours: the bounty grows, but your favour and the guards' greeting do not. The town's guards then stop anyone hooded on sight. Lower it in front of a witness, or be searched carrying stolen goods, and the stranger's account becomes yours, doubled.
**Rules.** Hood up in a town by day: the first word with anyone costs −1 favour a day (*a hidden face*); the stranger's bounty lapses after seven game days unclaimed; guards challenge a hooded player at 20 units, as the night watch does at favour −2.
**Touches.** B, plus `seenCrime`, `crimeOf`, the guards' `confront`, the Church's notes, a new `worldState.crime[site].stranger` (the world row), the hint line.
**Conflicts.** It changes the price of every crime the crime system priced (#68, the burglary's pay), and a careful thief never pays a fine again unless the doubling bites. It is a disguise system, which is more than a cloak slot, and Michael has not asked for one.
**Cost.** B + two Opus sessions (the stranger's account; the guards and their lines, with the quest writer).

## Recommendation
**B.** It is the reading of *minimal bonuses* that still gives the slot a decision: which cloak you wear depends on where you are going, and the virtue is small enough that the brief's *buy more/better* never applies (the best cloak at sea is the worst in the snow, and none is above def 1). Every virtue reads a system that already works, so the cost is the same two sessions as A. A makes the slot a colour picker with an enchant on it. C is the most *decisions with consequences* of the three, but it rewrites the crime system's prices for a feature nobody asked for; if Michael likes it, it is a fair later step on top of B, not a reason to wait.

## What must be true first
- Nothing blocks B: the slot, the body's bones and the swing exist. The look half wants the three cuts built on the kit before the systems session hangs them on the player.
- The unique-artifacts proposal decides the named cloaks; B only reserves the slot.
- The skills build moves two virtues from attributes to Stealth and Speech when it lands; the order of the two does not matter.

## Not asked
- **Warmth as a need.** Out by Michael's B on survival.
- **Cloth tiers** (wool, linen, silk on `MATERIALS`): a ladder of better cloaks is *buy more*.
- **Banners and heraldry on a lord's cape** (a faction's livery after the claim). A good later reward for the factions, the quest writer's to propose.
