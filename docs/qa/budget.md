# The budgets — QA's ledger

Draw calls and triangles at fixed spots, one table a QA run, written by `tests/budget.test.mjs` and `tests/budgetport.test.mjs`
(`BUDGET_LEDGER=1 node tests/run.mjs budget budgetport`). The ceilings are `docs/design/streaming-and-quality-build.md`'s ("The ceilings", from v2-scope.md §5), counted on the world's
frame by `REN.info`, the sun's shadow pass and the bloom's passes included:

| Level | Draw calls | Triangles |
|---|---|---|
| Low | 700 | 1.2 M |
| Middle | 1,000 | 2.0 M |
| High | 1,300 | 4.0 M |

The five views are the build sheet's: Dunmore's street (from the site's centre, 4 m south, looking north) and the field 160 m west of it
(looking west) at noon, the field at dawn (6h), the street at midnight, and Portclare's square at noon. The inn's hall (Dunmore's inn
from its door, 20h) and a gate's floor (a medium ruins gate, seed 11, from its entrance) are counted at Middle for the ledger; the
ceilings are the world's. A count is one frame; three back to back at one spot differ by 0–2 calls (the townsfolk walk).
Dunmore's four views are `budget`, Portclare and the indoor spots `budgetport`; a run's two tables are joined under one heading.

The columns: **Shadow**, the sun's pass (the frame less the same frame without it; Low draws no shadow); **Post**, the bloom's passes
(Middle and High); **Bodies**, **Houses**, **Land** and **Other**, the eye's calls by what draws them, counted as the renderer culls (a
mesh in the camera's frustum, one call a material group), so they come near the eye's own count but are not it. Bodies are anything
under a rig or a builder body; houses what a settlement's group holds; land what a chunk's group holds (terrain, trees, grass, roads);
other is the rest, its largest top-level parents named in the last column.

Frame rate is not measured here: software GL is not a target machine. It is Michael's reading on his laptop at F14. A rise of more than
10% at any spot from the run before goes in QA's Slack post's *Need* line for the producer.

### s825 — 2026-10-22 07:29 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 783 **over** | 1.29 M | 0 | 0 | 113 | 144 | 272 | 254 | Mesh 194, Group 36, oldGate 24 |
| Dunmore street, noon | Middle | 935 | 1.98 M | 135 | 6 | 114 | 144 | 281 | 255 | Mesh 195, Group 36, oldGate 24 |
| Dunmore street, noon | High | 936 | 2.18 M | 136 | 6 | 114 | 144 | 281 | 255 | Mesh 195, Group 36, oldGate 24 |
| Dunmore street, midnight | Low | 840 **over** | 1.23 M | 0 | 0 | 107 | 206 | 272 | 255 | Mesh 194, Group 36, oldGate 24, Points 1 |
| Dunmore street, midnight | Middle | 1011 **over** | 1.93 M | 155 | 6 | 107 | 206 | 281 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| Dunmore street, midnight | High | 1011 | 2.13 M | 155 | 6 | 107 | 206 | 281 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| the field west of Dunmore, noon | Low | 651 | 748k | 0 | 0 | 105 | 111 | 303 | 132 | Mesh 78, Group 44, oldGate 8, quaywall 2 |
| the field west of Dunmore, noon | Middle | 729 | 1.13 M | 59 | 6 | 105 | 111 | 315 | 133 | Mesh 79, Group 44, oldGate 8, quaywall 2 |
| the field west of Dunmore, noon | High | 729 | 1.44 M | 59 | 6 | 105 | 111 | 315 | 133 | Mesh 79, Group 44, oldGate 8, quaywall 2 |
| the field west of Dunmore, dawn | Low | 734 **over** | 738k | 0 | 0 | 108 | 190 | 303 | 133 | Mesh 78, Group 44, oldGate 8, quaywall 2, Points 1 |
| the field west of Dunmore, dawn | Middle | 872 | 1.22 M | 119 | 6 | 108 | 190 | 315 | 134 | Mesh 79, Group 44, oldGate 8, quaywall 2, Points 1 |
| the field west of Dunmore, dawn | High | 872 | 1.53 M | 119 | 6 | 108 | 190 | 315 | 134 | Mesh 79, Group 44, oldGate 8, quaywall 2, Points 1 |
| Portclare square, noon | Low | 534 | 803k | 0 | 0 | 30 | 72 | 215 | 217 | Mesh 145, Group 58, oldGate 14 |
| Portclare square, noon | Middle | 686 | 1.48 M | 133 | 6 | 31 | 72 | 226 | 218 | Mesh 146, Group 58, oldGate 14 |
| Portclare square, noon | High | 688 | 1.72 M | 133 | 6 | 31 | 72 | 227 | 219 | Mesh 146, Group 59, oldGate 14 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 49 | 44k | 0 | 0 | 1 | 0 | 0 | 48 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 253 | 403k | 0 | 0 | 32 | 0 | 0 | 221 |  |

### s839 — 2026-10-22 19:52 UTC (QA, Session 1323)

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 784 **over** | 1.29 M | 0 | 0 | 113 | 144 | 272 | 255 | Mesh 194, Group 37, oldGate 24 |
| Dunmore street, noon | Middle | 937 | 1.98 M | 135 | 6 | 114 | 144 | 281 | 257 | Mesh 195, Group 38, oldGate 24 |
| Dunmore street, noon | High | 937 | 2.18 M | 136 | 6 | 115 | 144 | 281 | 255 | Mesh 195, Group 36, oldGate 24 |
| Dunmore street, midnight | Low | 840 **over** | 1.23 M | 0 | 0 | 107 | 206 | 272 | 255 | Mesh 194, Group 36, oldGate 24, Points 1 |
| Dunmore street, midnight | Middle | 1011 **over** | 1.93 M | 155 | 6 | 107 | 206 | 281 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| Dunmore street, midnight | High | 1011 | 2.13 M | 155 | 6 | 107 | 206 | 281 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| the field west of Dunmore, noon | Low | 653 | 748k | 0 | 0 | 105 | 111 | 303 | 134 | Mesh 78, Group 46, oldGate 8, quaywall 2 |
| the field west of Dunmore, noon | Middle | 731 | 1.13 M | 59 | 6 | 105 | 111 | 315 | 135 | Mesh 79, Group 46, oldGate 8, quaywall 2 |
| the field west of Dunmore, noon | High | 731 | 1.44 M | 59 | 6 | 105 | 111 | 315 | 135 | Mesh 79, Group 46, oldGate 8, quaywall 2 |
| the field west of Dunmore, dawn | Low | 736 **over** | 738k | 0 | 0 | 108 | 190 | 303 | 135 | Mesh 78, Group 46, oldGate 8, quaywall 2, Points 1 |
| the field west of Dunmore, dawn | Middle | 874 | 1.22 M | 119 | 6 | 108 | 190 | 315 | 136 | Mesh 79, Group 46, oldGate 8, quaywall 2, Points 1 |
| the field west of Dunmore, dawn | High | 874 | 1.53 M | 119 | 6 | 108 | 190 | 315 | 136 | Mesh 79, Group 46, oldGate 8, quaywall 2, Points 1 |
| Portclare square, noon | Low | 529 | 803k | 0 | 0 | 30 | 72 | 215 | 212 | Mesh 145, Group 52, oldGate 14, Points 1 |
| Portclare square, noon | Middle | 683 | 1.49 M | 133 | 6 | 32 | 72 | 226 | 214 | Mesh 146, Group 53, oldGate 14, Points 1 |
| Portclare square, noon | High | 685 | 1.72 M | 133 | 6 | 32 | 72 | 227 | 215 | Mesh 146, Group 54, oldGate 14, Points 1 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 49 | 44k | 0 | 0 | 1 | 0 | 0 | 48 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 268 | 410k | 0 | 0 | 32 | 0 | 0 | 236 |  |
