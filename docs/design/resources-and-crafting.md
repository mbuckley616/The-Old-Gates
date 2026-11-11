# Resources and crafting: hides and salt, a house that works, or stations anywhere

*The systems designer, 11 Nov 2026. A proposal: nothing here is a spec until `docs/decisions.md` carries a `Michael:` line under it.*

## The problem in Michael's words

Backlog L8, *Resources and crafting* (systems; OG-035): "nodes (trees that regrow, ore veins with limited respawn, clay, salt), tools (axe, pickaxe, gathering knife, shovel, net, rod), stations (drying rack, tanning rack, smelter, kiln, workbench), crops by island, and the outputs. Saltpeter is for the ships' cannon only."

## Today

Survival B (Michael's B on 30 Sep, `survival-build.md`) built half of this list. Trees regrow 10 game-days after felling (`FELL_DAYS`, `worldState.felled`). A vein holds 3 ore and returns 7 days after its last is taken (`VEIN_DAYS`, `worldState.veins`). The hatchet, the pick, the forge with its smelter (`forgeMake`, `forgeCanSmelt`) and the joiner's bench in your cabin are all built. A made piece comes in plain, Fine or Masterwork and is never enchanted (#781 A). Cooking B gave fires, the pot, the oven and meals that turn after 3 days (a bake after 15, `MEAL_TURN_DAYS`). The hunted animals give meat (`bodyMeat`) and nothing else. Clay, salt, hides, leather, crops, the kiln and the racks do not exist. The Clay Pot is bought for 3 gold. The forge makes only the heavy line, so a light or robe piece can only be bought or found (`ARMOR_LINES`). Your house is a bed and a chest.

What is missing comes down to three gaps. The light line has no maker. The hunt ends at the meat. And a house you buy does nothing a rented room does not.

## Directions

### A. The hunter's half: hides, leather and salt

**The loop.** You take a skinning knife into the woods. A deer gives meat and a hide. At a tanner's rack the hide, cured with salt, becomes leather, and leather plus a few rivets of your metal becomes a jerkin or soft boots at the same forge page Smithing already uses. Salt also cures meat into jerky, which you eat cold on the road with no fire.

**The rules.**

| Thing | Value | Why |
|---|---|---|
| Skinning knife | 6 gold, 0.3 kg; E on a hunted body, 2 s | It is the "gathering knife" on Michael's list. Without the knife the body gives only its meat, as today. |
| Hide | deer, elk, stag, boar, wolf 1; bear 2; hare, fox, badger, otter, corrupted animals none. 2 kg, sells for 4 | Uses `MEAT_BODIES`' list, rolled on a `hide` stream keyed by the corpse (the co-op rule). The corrupted are the gate's, as with meat (S1933). |
| Salt | 1 gold, 0.2 kg; every harbour's goods shop, half price in Aurenne | The canon's Aurenne lives by "fishing, salt, dyes, glass"; Salthaven processes the catch. |
| Tanning | 1 hide + 1 salt on a tanner's rack; leather after **6 game hours** (6 real minutes); a rack holds 4 | Skyrim's tanning is instant, which makes leather a menu click. A short wait gives the town a reason to hold you, and every tanner sells leather outright for 12 if you won't wait. |
| A light piece | leather by slot as the heavy line's ingots (hands 1, feet and head 2, legs 3, chest 5), plus half as many ingots of its metal, rounded up; 20 game minutes | Skyrim makes leather armour at the forge under Smithing. Here the metal still names the tier (an *Iron Jerkin*), so the vein table's cap per place holds for the light line too. |
| Its rules | Smithing's: `SKILL_GATE`, Fine and Masterwork (#781), never enchanted, 20% resale | One making skill, one set of rules. Wearing it is still gated by Finesse, as today. |
| Jerky | 1 raw meat or fish + 1 salt on a drying rack, 6 game hours; eaten cold: *fed* for half a roast's length; keeps 30 days | This is the "drying rack". It gives you food that needs no fire and does not turn, for a long crossing. It never beats a cooked dish. |

**Where the racks are.** A tanner's rack and a drying rack stand in every town with a smith, in every Mark longhouse yard, and at every fishing harbour (drying racks only). The tanner is a trade the generator already draws as a building (OG-114's *Trades at work*), and here it gets a counter.

**Touches.** `bodyMeat`'s neighbour `bodyHide`, `SURV_ITEMS` (knife, hide, leather, salt, jerky), `forgeMake` and the forge page (a *Light* row beside the heavy one), `SHOP_STOCK`, the cook page's *Salt it* line, and a new `worldState.racks` (world's: the rack's place key, `<site>:<lot>:rack`, then what hangs on it and when) on the S242 list. No skill rises from skinning. Making the piece is a Smithing use.

**Displaces.** Nothing. The shops' light pieces stay, and a made one stands to them as a made sword stands to a bought one.

**Cost.** Two systems sessions (the knife, hides, salt and jerky; then tanning and the light line at the forge) and one look session (the hide, leather, both racks with what hangs on them, jerky).

### B. A, and a house that works *(recommended)*

**The loop.** A, and the house you bought becomes your workshop. You fit it as you fit your ship: a tanning rack, a drying rack, a clay oven, a kiln, a workbench, a garden. You dig clay from a riverbank with a shovel and build the oven yourself. Between journeys the house turns hides into leather and seconds into a harvest while you are away.

**The rules.**

| Fitting | Cost | Does |
|---|---|---|
| Tanning rack | 40 gold, or 4 planks at a bench | A's rack, at home, no fee |
| Drying rack | 30 gold, or 3 planks | A's jerky at home |
| Clay oven | 6 clay, laid by hand (a cob oven) | Bakes at home (cooking B puts ovens only in inns and Aurennais homes) |
| Kiln | 10 clay | 2 clay → a Clay Pot (the fire pot's, bought at 3 today); a Jar (3 clay) keeps one meal from turning |
| Workbench | 60 gold, or 6 planks | The joiner's bench, which today is in your ship's cabin only |
| Garden | 50 gold for four beds, dug with the shovel | Below |

A house holds fittings by its size: a cottage **3**, a townhouse **4**, a farmstead or a longhouse **6**. That is *Making a ship yours*'s rule on land (one of each, places by size), so a small house makes you choose between a tannery and a kitchen, and the bigger house is worth the gold (feeling 1).

**Clay.** A shovel (12 gold, 2.5 kg). E on a river's or a lake's bank within 2 m of the water gives 1 clay in 3 s, 1.5 kg each. A bank spot holds 3 and returns in 7 days, as a vein does, keyed by the carve grid's cell (`RVG`), which is the same for every player.

**The garden.** A bed takes one second of its own island (oats on a Gatelands house, olives only in Aurenne), or a herb you have picked. In 5 game days it gives 4 of the second or 3 of the herb, rolled on a stream keyed by the house, the bed and the day it was planted. A crop grows only on its own island, so cooking B's rule that each island's seconds are its own still holds. The garden gives you plenty, not reach. Harvesting a second is a Cooking use, a herb an Alchemy use. Hearthfire's garden is the precedent; its mistake was that it outgrew the world's shops, and 4 beds at 5 days cannot.

**Touches.** A's, plus `ownedHouse` and the house's interior (`buildInteriorFor` places a fitting at a lot point; the look builder's), a new `worldState.fittings` and `worldState.garden` (world's: keyed by house id, as `owned` is) and `worldState.clay` (world's), all on the S242 list. Also the shovel and clay in `SURV_ITEMS`, `ovenHere` reading a house's oven, and the fire pot's recipe taking a kiln's pot.

**Displaces.** Part of L9's *Homes as rooms*, which takes these fittings as the things a room holds. It does not compete with the camp: Michael's answer on #1378 makes the camp something you make anywhere and keep nowhere, and the house is where you keep.

**Cost.** A's, plus three systems sessions (fittings and the house's places; clay, the shovel, the kiln and the oven; the garden) and one look session (six fittings by island, the four beds growing, the bank's cut). Five systems and two look in all.

### C. Stations anywhere, Valheim's way

**The loop.** Every station can be carried as a kit and set down anywhere, as in Valheim or RuneScape Dragonwilds. A workbench's 20 m radius lets you build and make within it. Salt pans on Aurenne's coast are worked, crops are planted in any field you clear, and fishing comes with a net and a rod.

**The rules.** B's numbers, plus a station kit at 8–15 kg each, a work radius, a field cleared by hoe (40 m² a bed), salt pans harvested every 3 days, and the rod and net as their own loop.

**Displaces.** Michael declined the kept camp on #1378 ("a camp you make anywhere", not C's camp with a stash and fast travel). C brings it back through the stations. It also empties the towns' trades of their point.

**Cost.** One deep-work session (placed stations and their radius, saved by place key across cells) and about six systems and three look sessions.

## Recommendation

**B.** A on its own closes the real gap, the light line with no maker. But it leaves Michael's stations as town counters and his clay and crops unbuilt. B finishes the list without a new skill (Smithing makes the light line, Cooking and Alchemy harvest the garden), and it gives the house you bought a reason to exist. Each fitting is a choice against the others in a house of 3 to 6 places. Nothing in it outruns the place: the metal is still capped by the vein table, the garden grows only its own island's seconds, and a made piece is still never enchanted. C rebuilds the kept camp Michael has just declined.

## What must be true first

- Survival B and cooking B are built (both done), as is the ship's fittings rule (Session 1726), which B copies onto the house.
- The look builder's interiors place a fitting at a lot point. If *Homes as rooms* (L9) is not yet built, B's fittings stand in the yard first.
- The quest writer names the tanner and the working names (jerky, the Jar) in the canon's register.

## Not asked

- **Fishing with a rod and a net.** It is a loop of its own (a cast, a bite, the river fish and the sea's), and Michael's list puts it under tools. It belongs on a page of its own, or with *The adventurer's kit*.
- **Cloth and robes.** Weaving wool and linen into the robe line is a second chain beside leather. The robe line stays bought and found.
- **Saltpeter.** "For the ships' cannon only" (Michael), and naval combat's page already settles the cannon.
- **A Leatherwork or Farming skill.** Twenty-three skills is enough. Each new thing reads a skill that already exists.
- **Livestock you keep.** The farms' beasts are the farmer's (#1275 B: striking one is theft). Your own hens wait on *Homes as rooms*.
