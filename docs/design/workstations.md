# Workstations: the forge by grade, the still, or both

*The systems designer, 22 Nov 2026. A proposal, not a spec: nothing here is built until docs/decisions.md carries a `Michael:` line under it.*

## The problem in Michael's words
Backlog L11, *Workstations* (OG-133, his note): "three grades of smithy and ore to ingot to masterwork; brewing in four steps (prepare, combine, heat and distil, bottle); a parchment recipe page with each herb's known effects and “study to discover” (survival B's experimenting); woodworking and tanning for bows, quivers, shields and packs; a travel alchemy kit; the ship's workshop below deck (L6). A native name for the top smithing tier, not “Dwarven”."

Rare materials (his B on #1840) left the smithy's grades to this page.

## Today
Half of OG-133 is built. Any smith's room is a forge (`smithForge`, 5 gold a use), and so is a fort armoury's smelter (`dunForgeNear`); every forge works every metal, Bronze to Cosmic (`INGOT_DEF`, `forgeSmelt`, `forgeMake`), gated by Smithing (`SKILL_GATE`) and, for 8–10, the rare piece. Quality steps (#781 A), the light line (S2132), the joiner's kit as a portable bench, the ship's still and bench (S1733) and the house's racks and workbench (`HOME_FITS`, S2137) are built. Brewing is one step: the mortar (`hasMortar`) grinds two or three herbs anywhere into a tincture (`brewHerbs`) of `alchStrength`, ×1.10 at the ship's still, which turns to half after 5 days (`TINCTURE_TURN_DAYS`). The apothecaries the look builder drew in three nations are laid out as OG-133's four steps, table, mortar, still and shelf (`stations` in `38-kit.js`), but nothing reads them.

Three gaps are left: every forge is the same forge, the still does nothing, and nothing records what you have made.

## Direction A: three grades of forge

**The loop.** The metal decides where you work it: iron and steel at a village, mithril to obsidian at a town, the top three and their tempers at a great forge in a city's keep, whose lord must think well of you. A Draconic blade is a dragon killed *and* a journey to a city you have not robbed.

**The rules.**

| Grade | Where | Smelts and makes | Fee | Why |
|---|---|---|---|---|
| Smith's forge | a village's smith, a fort armoury's smelter | to Steel (4) | 5 gold, none at the fort | a village forge is charcoal and bellows; OG-133's "village smith" |
| Town forge | the smith in a town, port or garrison | to Obsidian (7) | 5 gold | the vein table's metals; most players never notice a cap |
| Great forge | the keep of every city (the `castle` lot) | Draconic, tier 9 and Cosmic (8–10), and their tempers (the deep pearl) | 25 gold | the rarest metals under a lord's roof, as Skyrim's Skyforge sits at Jorrvaskr |

- **Leave.** The great forge asks the city's favour of +2 or better (`favor`; the night watch reads −2) and no unpaid bounty there (`worldState.crime`). The player who robs every town finds the top tiers shut.
- **The law follows the stone.** Tier 9 is gate salvage (S2492). An Aurennais keep's forge-master refuses a sigil stone, as the Prior's law makes selling one sacrilege, so tier 9 is smelted in the Gatelands or the Mark: one line, reading the mark.
- **Your house gets no forge.** It would undo the journey.
- **Tempering by gold follows the grade.** The smith tempers only what his forge could make.

**Touches.** `smithForge` returns a grade from `currentHouse.siteKind`; the great forge is a lot in the castle's rooms (`buildInteriorFor`). `forgeSmelt`, `forgeMake` and `forgeTemper` refuse a metal above the grade, and `openForgePage` greys those rows and says where to go. `favor` and `worldState.crime` are only read. No new `worldState` key.

**Displaces.** A Draconic ingot at any village smith, as today. The fort armoury's smelter drops to the village grade.

**Cost.** Two systems sessions: (1) the grades and the page's refusals; (2) the great forge, its leave and the salvage refusal. One look session: the great forge as a corner of each nation's keep (a wide hearth, a second anvil, the lord's colours).

## Direction B: the still, and brewing in four steps

**The loop.** The mortar stays the travel alchemy kit, and a tincture is what you grind on the road. At a still you dry the herbs, grind them, run two tinctures into one draught that keeps, and bottle it in glass. A day at the apothecary turns a satchel of tinctures into a few draughts worth carrying into a gate.

**The four steps.**

| Step | Where | Rule | Why |
|---|---|---|---|
| Prepare | a drying rack (a town's, your house's) | 1 herb → 1 *Dried* herb, 6 game hours, 4 a rack (the jerky's rack and clock, resources A) | a dried herb grinds at ×1.10. It is small, but it is a reason to own the rack |
| Combine | the mortar, anywhere | as today: two or three herbs, a catalyst | nothing changes on the road |
| Heat and distil | a still: an apothecary's (5 gold), the Mages' Guild's (free to members), your ship's, your house's (a new fitting, 60 gold and 2 bronze ingots) | 2 tinctures of one brew → 1 **Draught**, ×1.35, 1 game hour, an Alchemy use of 10 | two for one keeps it honest: the herbs' total falls to 0.68, but you drink one bottle at a time |
| Bottle | the still's shelf | a Glass Vial a draught (2 gold; apothecaries, and Aurenne's goods shops: the canon's glass) | 0.2 kg against a tincture's 0.5; glass makes the draught a supply |

- **A draught never turns**, so it is what you stock before a long voyage or a massive gate.
- **The ship's still** becomes a still, not a ×1.10 on the mortar.
- **The cap.** ×1.35 multiplies the tincture, catalysts included: with Steeping (×1.4) and Alchemy 100 the best draught is near three times a novice's tincture, for `ALCH_FORTIFY_S`' 60 s. A strong minute, not a free fight: Oblivion's apparatus without its loop.

**The recipe page.** The brewing page gains a leaf, *Recipes*: every brew you have made (herbs, catalyst, effects in ink), one tap to select it again; the pairs that gave nothing (`herbsKnown().none`); and a herb whose effects you have not all found marked *study to discover*. OG-133's page, from records the game keeps.

**Touches.** `brewHerbs` (a dried herb's ×1.10), a new `distilDraught` and `stillHere` (the apothecary's `stations` from `38-kit.js` become E points, as the house's fittings are), `useTincture` for draughts, `SHIP_STILL_K` retired into the still, `HOME_FITS` (a seventh fitting, *still*), the brewing page (`brewDraw`, a second leaf), `SHOP_STOCK` for the vial. One new character key, `herbsKnown().brews` (inside `herbsKnown`, already in `SS_CHAR_WS` and the S242 list). The rack's load uses resources A's `worldState.racks`, which belongs to the world. Every roll is unchanged: distilling rolls nothing.

**Displaces.** The ship's still's ×1.10 becomes the draught. Nothing else.

**Cost.** Three systems sessions: (1) dried herbs and the draught; (2) the vial, the house's still, the stations as E points; (3) the recipe leaf. No look session: the apothecaries are drawn; the house's still is a fitting prop, half a session beside other work.

## Direction C: both
A and B share no state and either can land first. Five systems sessions and one look.

## Recommendation
**C.** OG-133 asks for both, and each answers a different feeling. A is the first feeling: the top tiers ask a journey and a city's good opinion, so the player who robs every town pays for it at the anvil, and Aurenne's law on salvage reaches the forge. B is the second: Alchemy gets a step above the mortar that a player at 50 or 75 wants to reach, and the apothecaries the look builder drew for OG-133's four steps finally do those four steps. Neither adds a ladder of things to buy. The still asks for glass and time, and the forge asks for standing. If Michael wants only one, take A, because it carries the consequence.

## What must be true first
Nothing blocks B. A's great forge wants a room in each city's keep: if the castle's interior is not yet on the kit (card F9), the forge stands in the keep's yard as the house's fittings did (S2153). The deep pearl's temper (rare materials, session 5) lands at the great forge if A comes first, and at any forge if not.

## Not asked
- **The top tier's native name.** It is the quest writer's, as rare materials said; this page uses tier numbers.
- **Quivers, packs and pouches as made goods.** The adventurer's kit (#1504 B) ruled out a ladder of packs as *buy better*.
- **The travel kit, the portable bench, the ship's workshop.** The mortar, the joiner's kit and S1733: built.
- **Camp to permanent workshop.** The kept camp was declined (#1378).
- **Repair at the village smith.** Nothing wears, so nothing is repaired.
- **Raw, refined and masterwork ingots.** A second quality ladder over #781 A's.
