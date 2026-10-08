# The ship in hand — the log, the side, the yard and the hold

*The systems designer, 7 Oct 2026. A proposal, not a spec: nothing here is built until docs/decisions.md carries a `Michael:` line under it.*

## The problem in Michael's words
> "(1) A speedometer while piloting, in knots, ideally a meter that implies faster ships exist (the starter ship only reaches about 25% of the range). (2) Boarding is awkward: a netting or ladder on either side to walk up, or a "press E to climb" when looking at the mesh — not a general "board" option always available in range, which conflicts with other E actions; the same for merchants and pirates. (3) Buying ships in an interactive menu where you see the ship models ("Browse Ships" in the chat), not through the chat menu. (4) Supplies: he does not know where they go and they are not represented on the ship. Wanted: a menu to buy trading goods up to the ship's capacity, placed on the ship, all lost if the ship is destroyed." (backlog J, the sailing playtest of 6 Oct 2026)

Three of the four are specified in his words; the open question is item 1's: a meter that *implies faster ships exist* needs faster ships, or it is a promise the game does not keep.

## Today
You buy a sloop at a shipwright (`buyShip`, 400 gold) and refit her through his chat topics (`Refit her as a cog`, `Better sails, tier N`, `Bigger hold`, `86-world-crime.js`). Her top speed is the class's (`SHIP_CLASSES`: sloop 7.5, cog 8.5, galleon 9.5 units a second) plus 1.2 a sail tier, up to three (`shipTopSpeed`), times the hull and rig factor (`shipSpeedMul`); the shipwright calls those units knots, and nothing on screen shows speed. The parchment panel at the helm (`shipBarsUI`) shows only the sea, hull and rig. Boarding your own ship is `nearShip()`: any point within 3.5 units of her deck box puts *Press 'E' to board* up and E lifts you onto her stern; another ship is `nearOther()` and `boardOther()`, which puts you at her centre. Session 614 (on auto/systems) put the wheel and the hatch under the crosshair; boarding is still by radius. Cargo is Session 390's: twelve goods and the horse (`CARGO_GOODS`), bought one crate at a time from the harbourmaster's chat (`cargoRows`), going into `worldState.ship.hold` (40 / 60 / 90 weight by class, +25 a hold tier) when she lies within 140 units, else into your bag. The hold has no mesh, and when she sinks it comes up with her (Session 413).

## Shared ground (every direction)
**The log (item 1).** A half-dial on the helm panel, parchment and ink, marked 0 to 30 knots every 5, the needle at her speed, a small brass tick at the most she can make now (top speed × hull and rig), and the number under it (*7.3 kn*). One knot stays one unit a second, so the shipwright's *She'll make 9.7 knots* stays true. The sloop's 7.5 sits at 25% of the dial, as asked. Notches on the rim mark the top of each hull the world sells, so the dial is also the ladder.

**The side (item 2).** Every hull carries a boarding net on each side amidships (the look builder's: a net of rope over the rail, about 300 triangles a side). *Press 'E' to climb aboard* shows only with the crosshair on a net within 2.5 units (`aimAt`, as Session 596 does for people), or when swimming against it; the 3.5-unit radius goes. Climbing takes 0.8 s up the net and puts you at the rail above it, not at her stern. The same nets hang on merchantmen and black sails: E on her net replaces `boardOther`'s jump to her centre, and lying alongside at 4.8 (Session 615) you may also jump rail to rail, which counts as boarding the moment you land (`crewUp`).

**The yard (item 3).** The shipwright's chat keeps three topics: *Browse ships*, *Mend her*, *Raise her*. *Browse ships* opens a parchment panel: the hulls this yard sells down the left, the chosen one turning in the middle on a small stage (built by `buildShipMesh` as the mesh inspector builds it, 320 × 240, rendered only while the panel is open), and on the right her numbers on the same dial as the helm (top speed bare and with full sails, hull, hold, price, and for a refit what your ship is worth against it). Buy, refit, sails and hold tiers all happen here, with a shown price for each; the chat rows for them go.

**The hold (item 4).** The harbourmaster's *Cargo* opens a factor's panel in place of the chat rows: one row per good with the ask, the bid and what you hold, − and + a crate, *Fill the hold* (as many of one good as fit and you can pay for), and a bar of the hold, used of capacity. The crates go aboard and are seen there: stowed in her waist under a lashing net, one box, sack or barrel per crate in its good's shape (a crate of iron, a bale of wool, a cask of salt fish), merged into one mesh, about 12 triangles a crate; a galleon's 140 holds about 18. The pirates' take (Michael's B on #91) lifts its half off the deck where you can see it go. **When she sinks, the hold is lost**, as his note asks; this reverses Session 413, where the hold came up with her. A raised ship comes up empty.

## Directions

### A. The dial with headroom: today's ladder, the top for the far yards
**The loop.** As now: the sloop, then a cog for the hold or a galleon for the hull, then sails. The dial's top half is empty, marked *the far yards*, until the far continents' ships come with them.

| Hull | Bare | Full sails (3) | Dial |
|---|---|---|---|
| Sloop | 7.5 | 11.1 | 25–37% |
| Cog | 8.5 | 12.1 | 28–40% |
| Galleon | 9.5 | 13.1 | 32–44% |

**What it costs.** The shared ground only: four Opus sessions (the log; the nets' rule and the climb; the yard panel; the factor's panel and the loss on sinking) and two look sessions (the nets on every hull; the stowage). **What it displaces.** The chat rows for buying, refitting and cargo. **The risk.** The empty half is a promise for an expansion that has no date; until then it reads as a meter badly scaled.

### B. The ladder re-spread to fill two thirds of the dial
**The loop.** The home continent's yards sell five hulls, each a trade, not a step: speed against hold against hull. A cargo run wants the cog or the galleon; running a blockade or a long crossing wants a fast hull with a thin skin; a fight wants the galleon. Sails become a percentage, so a fast hull gains most from them. The last third of the dial (20–30) stays the far yards'.

| Hull | Bare | Full sails (+12% a tier, 4 tiers) | Hull | Hold | Price | Sold at |
|---|---|---|---|---|---|---|
| Sloop | 7.5 | 11.1 | 100 | 40 | 400 | every yard |
| Cog | 8.5 | 12.6 | 140 | 60 | 900 | every yard |
| Galleon | 9.5 | 14.1 | 200 | 90 | 2,200 | every yard |
| Cutter | 12.0 | 17.8 | 80 | 25 | 1,600 | the Mark's yards |
| Caravel | 11.0 | 16.3 | 130 | 55 | 2,800 | Aurenne's yards |

The fourth sail tier is 1,100 gold. At 7.5 a 3,000-unit crossing takes 6 min 40 s; a cutter at full sail takes 2 min 50 s, which is fast enough to matter and slow enough that the sea's wear (Session 412: a minute of rough water is a hull point) still bites a cutter's 80 hardest. Buying a nation's hull means sailing to that nation's yard: the Mark's cutter is a reason to cross. Refits branch (any hull to any other, paying the difference less a third), so `compactRefit`'s sloop → cog → galleon chain gives the next hull up by price.

**What it costs.** A, plus one Opus session (the two hulls' rules, percentage sails, branching refits and the Compact's refit) and one look session (two hulls). **What it displaces.** The flat +1.2 a tier; a saved ship with three tiers keeps them and their price.

### C. B, and a laden ship is slower
**The loop.** B's ladder, and what you carry shows on the dial: every crate weighs her down. A full hold takes 15% off her top speed (speed × (1 − 0.15 × used / capacity)), shown as a shaded arc between her empty top and her laden top. A trader chooses between one more crate and getting through the blockade; an empty cutter is the fastest thing at sea.

**What it costs.** B, plus half an Opus session (the factor, the dial's arc, `shipSpeedNow`). **What it displaces.** Nothing; a horse weighs 20, as now. **The risk.** Every cargo run gets slower, which the price gaps (×0.6 at home, ×1.4 abroad) were tuned without.

## Recommendation
**B.** It does what Michael's dial asks with ships that exist: the sloop sits at a quarter, the best home hull at about 60%, and the last third is honestly the far continents'. It also keeps sailing off *buy more/better*: no hull is best, the two new ones are each sold on one island, so the choice of ship is a choice of what kind of sailor you are and a reason to make a crossing. C's laden arc can follow when the cargo prices are next tuned. The shared ground (the nets under the crosshair, the yard panel, the factor's panel, the hold seen and lost) is Michael's note as written and goes first whatever the letter.

## What must be true first
- Sessions 612–619 (the sailing bugs, on auto/systems, PR #167) merged: the nets build on Session 615's hull outlines and Session 614's crosshair prompts.
- The far continents' ships (the last third of the dial) wait on the expansions; nothing here builds them.

## Not asked
- **Speed by the wind.** Michael chose the wind as look only (#57, option 1); the dial would show it well, but it is decided and not re-asked here.
- **A crew to hire.** Michael set it aside on #85 ("good thing to revisit eventually"); a crew would sail a bigger hull faster, and that waits for him.
- **Seamanship as a skill.** #85's B, not chosen.
- **Pirates climbing your nets.** Their boarding is a fight that works; changing how they come aboard is a combat question for later.
