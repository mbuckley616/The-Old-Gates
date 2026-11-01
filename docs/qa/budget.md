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

### s839 — 2026-10-22 19:52 UTC (QA, Session 1331)

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

### s871 — 2026-10-24 13:52 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 782 **over** | 1.29 M | 0 | 0 | 110 | 149 | 268 | 255 | Mesh 195, Group 36, oldGate 24 |
| Dunmore street, noon | Middle | 940 | 2.01 M | 136 | 6 | 113 | 149 | 281 | 255 | Mesh 195, Group 36, oldGate 24 |
| Dunmore street, noon | High | 991 | 2.35 M | 168 | 6 | 113 | 149 | 300 | 255 | Mesh 195, Group 36, oldGate 24 |
| Dunmore street, midnight | Low | 846 **over** | 1.25 M | 0 | 0 | 107 | 215 | 268 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| Dunmore street, midnight | Middle | 1021 **over** | 1.97 M | 156 | 6 | 107 | 215 | 281 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| Dunmore street, midnight | High | 1082 | 2.33 M | 198 | 6 | 107 | 215 | 300 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| the field west of Dunmore, noon | Low | 641 | 733k | 0 | 0 | 105 | 111 | 296 | 129 | Mesh 79, Group 40, oldGate 8, quaywall 2 |
| the field west of Dunmore, noon | Middle | 726 | 1.13 M | 59 | 6 | 105 | 111 | 316 | 129 | Mesh 79, Group 40, oldGate 8, quaywall 2 |
| the field west of Dunmore, noon | High | 774 | 1.56 M | 97 | 6 | 105 | 111 | 326 | 129 | Mesh 79, Group 40, oldGate 8, quaywall 2 |
| the field west of Dunmore, dawn | Low | 740 **over** | 781k | 0 | 0 | 124 | 190 | 296 | 130 | Mesh 79, Group 40, oldGate 8, quaywall 2, Points 1 |
| the field west of Dunmore, dawn | Middle | 869 | 1.22 M | 119 | 6 | 108 | 190 | 316 | 130 | Mesh 79, Group 40, oldGate 8, quaywall 2, Points 1 |
| the field west of Dunmore, dawn | High | 922 | 1.65 M | 162 | 6 | 108 | 190 | 326 | 130 | Mesh 79, Group 40, oldGate 8, quaywall 2, Points 1 |

### s871 — 2026-10-24 14:00 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 528 | 767k | 0 | 0 | 30 | 72 | 207 | 219 | Mesh 146, Group 58, oldGate 14, Points 1 |
| Portclare square, noon | Middle | 687 | 1.48 M | 133 | 6 | 31 | 72 | 226 | 219 | Mesh 146, Group 58, oldGate 14, Points 1 |
| Portclare square, noon | High | 731 | 1.83 M | 163 | 6 | 32 | 72 | 239 | 219 | Mesh 146, Group 58, oldGate 14, Points 1 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 55 | 45k | 0 | 0 | 1 | 0 | 0 | 54 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 252 | 427k | 0 | 0 | 46 | 0 | 0 | 205 |  |

### s884 — 2026-10-25 01:11 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 523 | 758k | 0 | 0 | 30 | 72 | 207 | 214 | Mesh 146, Group 54, oldGate 14 |
| Portclare square, noon | Middle | 682 | 1.48 M | 133 | 6 | 31 | 72 | 226 | 214 | Mesh 146, Group 54, oldGate 14 |
| Portclare square, noon | High | 725 | 1.82 M | 163 | 6 | 31 | 72 | 239 | 214 | Mesh 146, Group 54, oldGate 14 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 269 | 431k | 0 | 0 | 43 | 0 | 0 | 225 |  |

### s884 — 2026-10-25 01:11 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 782 **over** | 1.29 M | 0 | 0 | 110 | 149 | 268 | 255 | Mesh 195, Group 36, oldGate 24 |
| Dunmore street, noon | Middle | 940 | 2.02 M | 136 | 6 | 113 | 149 | 281 | 255 | Mesh 195, Group 36, oldGate 24 |
| Dunmore street, noon | High | 991 | 2.35 M | 168 | 6 | 113 | 149 | 300 | 255 | Mesh 195, Group 36, oldGate 24 |
| Dunmore street, midnight | Low | 846 **over** | 1.25 M | 0 | 0 | 107 | 215 | 268 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| Dunmore street, midnight | Middle | 1020 **over** | 1.97 M | 155 | 6 | 107 | 215 | 281 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| Dunmore street, midnight | High | 1082 | 2.33 M | 198 | 6 | 107 | 215 | 300 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| the field west of Dunmore, noon | Low | 640 | 731k | 0 | 0 | 105 | 111 | 295 | 129 | Mesh 79, Group 40, oldGate 8, quaywall 2 |
| the field west of Dunmore, noon | Middle | 725 | 1.13 M | 59 | 6 | 105 | 111 | 315 | 129 | Mesh 79, Group 40, oldGate 8, quaywall 2 |
| the field west of Dunmore, noon | High | 773 | 1.55 M | 97 | 6 | 105 | 111 | 325 | 129 | Mesh 79, Group 40, oldGate 8, quaywall 2 |
| the field west of Dunmore, dawn | Low | 723 **over** | 722k | 0 | 0 | 108 | 190 | 295 | 130 | Mesh 79, Group 40, oldGate 8, quaywall 2, Points 1 |
| the field west of Dunmore, dawn | Middle | 868 | 1.23 M | 119 | 6 | 108 | 190 | 315 | 130 | Mesh 79, Group 40, oldGate 8, quaywall 2, Points 1 |
| the field west of Dunmore, dawn | High | 921 | 1.65 M | 162 | 6 | 108 | 190 | 325 | 130 | Mesh 79, Group 40, oldGate 8, quaywall 2, Points 1 |

### s956 — 2026-10-27 07:05 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 525 | 767k | 0 | 0 | 30 | 72 | 207 | 216 | Mesh 146, Group 56, oldGate 14 |
| Portclare square, noon | Middle | 684 | 1.48 M | 133 | 6 | 31 | 72 | 226 | 216 | Mesh 146, Group 56, oldGate 14 |
| Portclare square, noon | High | 727 | 1.83 M | 163 | 6 | 31 | 72 | 239 | 216 | Mesh 146, Group 56, oldGate 14 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 286 | 427k | 0 | 0 | 43 | 0 | 0 | 242 |  |

### s956 — 2026-10-27 07:05 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 784 **over** | 1.29 M | 0 | 0 | 111 | 149 | 268 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| Dunmore street, noon | Middle | 941 | 2.01 M | 136 | 6 | 113 | 149 | 281 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| Dunmore street, noon | High | 992 | 2.35 M | 168 | 6 | 113 | 149 | 300 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| Dunmore street, midnight | Low | 847 **over** | 1.25 M | 0 | 0 | 107 | 215 | 268 | 257 | Mesh 195, Group 36, oldGate 24, Points 2 |
| Dunmore street, midnight | Middle | 1022 **over** | 1.97 M | 156 | 6 | 107 | 215 | 281 | 257 | Mesh 195, Group 36, oldGate 24, Points 2 |
| Dunmore street, midnight | High | 1084 | 2.33 M | 199 | 6 | 107 | 215 | 300 | 257 | Mesh 195, Group 36, oldGate 24, Points 2 |
| the field west of Dunmore, noon | Low | 637 | 729k | 0 | 0 | 105 | 111 | 295 | 126 | Mesh 79, Group 36, oldGate 8, quaywall 2, Points 1 |
| the field west of Dunmore, noon | Middle | 722 | 1.13 M | 59 | 6 | 105 | 111 | 315 | 126 | Mesh 79, Group 36, oldGate 8, quaywall 2, Points 1 |
| the field west of Dunmore, noon | High | 770 | 1.55 M | 97 | 6 | 105 | 111 | 325 | 126 | Mesh 79, Group 36, oldGate 8, quaywall 2, Points 1 |
| the field west of Dunmore, dawn | Low | 720 **over** | 714k | 0 | 0 | 108 | 190 | 295 | 127 | Mesh 79, Group 36, oldGate 8, quaywall 2, Points 2 |
| the field west of Dunmore, dawn | Middle | 866 | 1.22 M | 120 | 6 | 108 | 190 | 315 | 127 | Mesh 79, Group 36, oldGate 8, quaywall 2, Points 2 |
| the field west of Dunmore, dawn | High | 919 | 1.65 M | 163 | 6 | 108 | 190 | 325 | 127 | Mesh 79, Group 36, oldGate 8, quaywall 2, Points 2 |

*s956, QA Session 1481: `node tests/run.mjs budget` matches `budgetport` too, so the square and the indoor spots were measured twice (07:05 and 07:11). The second read the same to ±4 calls outdoors; the gate read 241 calls, not 286 (other 197): the gate's count moves by about 45 between boots. Since s884 no view has moved more than 6% (the gate, 269 to 286), and every outdoor view within 1%.*

### s972 — 2026-10-27 19:27 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 1235 **over** | 1.29 M | 0 | 0 | 110 | 149 | 721 | 255 | Mesh 195, Group 36, oldGate 24 |
| Dunmore street, noon | Middle | 1393 **over** | 2.03 M | 136 | 6 | 113 | 149 | 734 | 255 | Mesh 195, Group 36, oldGate 24 |
| Dunmore street, noon | High | 1444 **over** | 2.35 M | 168 | 6 | 113 | 149 | 753 | 255 | Mesh 195, Group 36, oldGate 24 |
| Dunmore street, midnight | Low | 1299 **over** | 1.25 M | 0 | 0 | 107 | 215 | 721 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| Dunmore street, midnight | Middle | 1475 **over** | 1.97 M | 157 | 6 | 107 | 215 | 734 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| Dunmore street, midnight | High | 1536 **over** | 2.34 M | 199 | 6 | 107 | 215 | 753 | 256 | Mesh 195, Group 36, oldGate 24, Points 1 |
| the field west of Dunmore, noon | Low | 1120 **over** | 734k | 0 | 0 | 105 | 111 | 775 | 129 | Mesh 79, Group 40, oldGate 8, quaywall 2 |
| the field west of Dunmore, noon | Middle | 1205 **over** | 1.13 M | 59 | 6 | 105 | 111 | 795 | 129 | Mesh 79, Group 40, oldGate 8, quaywall 2 |
| the field west of Dunmore, noon | High | 1253 | 1.56 M | 97 | 6 | 105 | 111 | 805 | 129 | Mesh 79, Group 40, oldGate 8, quaywall 2 |
| the field west of Dunmore, dawn | Low | 1203 **over** | 725k | 0 | 0 | 108 | 190 | 775 | 130 | Mesh 79, Group 40, oldGate 8, quaywall 2, Points 1 |
| the field west of Dunmore, dawn | Middle | 1349 **over** | 1.22 M | 120 | 6 | 108 | 190 | 795 | 130 | Mesh 79, Group 40, oldGate 8, quaywall 2, Points 1 |
| the field west of Dunmore, dawn | High | 1402 **over** | 1.65 M | 163 | 6 | 108 | 190 | 805 | 130 | Mesh 79, Group 40, oldGate 8, quaywall 2, Points 1 |

### s972 — 2026-10-27 19:33 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 881 **over** | 771k | 0 | 0 | 30 | 72 | 569 | 210 | Mesh 146, Group 50, oldGate 14 |
| Portclare square, noon | Middle | 1040 **over** | 1.48 M | 133 | 6 | 31 | 72 | 588 | 210 | Mesh 146, Group 50, oldGate 14 |
| Portclare square, noon | High | 1083 | 1.83 M | 163 | 6 | 31 | 72 | 601 | 210 | Mesh 146, Group 50, oldGate 14 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 267 | 432k | 0 | 0 | 44 | 0 | 0 | 222 |  |

*s972, QA Session 1497: every outdoor view rose 360–480 calls since s956 (Dunmore at noon, Middle, 941 → 1,393; Portclare's square 684 → 1,040), all of it in the land column (281 → 734 on Dunmore's street) and none in bodies, houses, the shadow pass or the rest. It is S1491's ore veins (#796): four meshes a vein, 265 of them in the 81 chunks round Dunmore; hiding them in the same frame takes Dunmore's street at noon from 1,382 to 929. Filed in backlog section I for the systems builder. Triangles did not move (the veins are 20 and 8 faces). The indoor spots are unchanged (the inn 38; the gate 237 and 267, inside its ±45).*

### s979 — 2026-10-28 00:59 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 593 | 1.29 M | 0 | 0 | 110 | 135 | 268 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, noon | Middle | 751 | 2.02 M | 136 | 6 | 113 | 135 | 281 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, noon | High | 802 | 2.35 M | 168 | 6 | 113 | 135 | 300 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, midnight | Low | 657 | 1.25 M | 0 | 0 | 107 | 201 | 268 | 81 | Mesh 52, oldGate 24, LOD 2, Points 2, impostors 1 |
| Dunmore street, midnight | Middle | 832 | 1.97 M | 156 | 6 | 107 | 201 | 281 | 81 | Mesh 52, oldGate 24, LOD 2, Points 2, impostors 1 |
| Dunmore street, midnight | High | 894 | 2.33 M | 199 | 6 | 107 | 201 | 300 | 81 | Mesh 52, oldGate 24, LOD 2, Points 2, impostors 1 |
| the field west of Dunmore, noon | Low | 577 | 738k | 0 | 0 | 105 | 107 | 301 | 64 | Mesh 28, Group 24, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | Middle | 684 | 1.14 M | 81 | 6 | 105 | 107 | 321 | 64 | Mesh 28, Group 24, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | High | 732 | 1.56 M | 119 | 6 | 105 | 107 | 331 | 64 | Mesh 28, Group 24, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | Low | 660 | 729k | 0 | 0 | 108 | 186 | 301 | 65 | Mesh 28, Group 24, oldGate 8, quaywall 2, Points 2 |
| the field west of Dunmore, dawn | Middle | 827 | 1.23 M | 141 | 6 | 108 | 186 | 321 | 65 | Mesh 28, Group 24, oldGate 8, quaywall 2, Points 2 |
| the field west of Dunmore, dawn | High | 881 | 1.66 M | 185 | 6 | 108 | 186 | 331 | 65 | Mesh 28, Group 24, oldGate 8, quaywall 2, Points 2 |

### s979 — 2026-10-28 01:06 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 398 | 770k | 0 | 0 | 30 | 67 | 208 | 93 | Group 40, Mesh 36, oldGate 14, impostors 1, LOD 1 |
| Portclare square, noon | Middle | 566 | 1.49 M | 141 | 6 | 32 | 67 | 227 | 93 | Group 40, Mesh 36, oldGate 14, impostors 1, LOD 1 |
| Portclare square, noon | High | 614 | 1.83 M | 176 | 6 | 32 | 67 | 240 | 93 | Group 40, Mesh 36, oldGate 14, impostors 1, LOD 1 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 241 | 428k | 0 | 0 | 43 | 0 | 0 | 197 |  |

*s979, QA Session 1505 (`budget` 431 s, `budgetport` 375 s, one pass each): every view is under its draw-call ceiling at every level for the first time since the ledger began. Against s972: Dunmore at noon, Middle, 1,393 → 751; at midnight 1,475 → 832; the field west at dawn 1,349 → 827; Portclare's square 1,040 → 566; Low's worst view 1,299 → 660 (ceiling 700). The fall is the land column (734 → 281 on Dunmore's street, Session 1498's one-mesh veins) and the other column (255 → 80, Session 1502's stand-ins, keep lights and lettering as one mesh each). Triangles did not move, and they are now the suite's only red: Dunmore's street at noon reads 1.29 M at Low (ceiling 1.2 M) and 2.02 M at Middle (2.0 M), and at midnight 1.25 M at Low. Split by draw (each mesh's share of `REN.info` read in `onBeforeRender`, noon, Low then Middle): the land's instanced scatter 402k / 597k (leaf-card trees 348k of it, in five species of 174–444 triangles a card set; Middle adds the grass, 189k), the kit houses 341k, the town's other house meshes 97k, top-level unnamed meshes 222k (182k opaque, 39k transparent), bodies 166k / 172k, the old gate 30k, impostors 12k; at Middle the sun's shadow pass adds 519k. The inn's hall 38, the gate 241.*

### s1000 — 2026-10-28 13:11 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 593 | 1.10 M | 0 | 0 | 110 | 135 | 268 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, noon | Middle | 752 | 1.86 M | 136 | 6 | 113 | 135 | 282 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, noon | High | 803 | 2.35 M | 168 | 6 | 113 | 135 | 301 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, midnight | Low | 657 | 1.06 M | 0 | 0 | 107 | 201 | 268 | 81 | Mesh 52, oldGate 24, LOD 2, Points 2, impostors 1 |
| Dunmore street, midnight | Middle | 833 | 1.77 M | 156 | 6 | 107 | 201 | 282 | 81 | Mesh 52, oldGate 24, LOD 2, Points 2, impostors 1 |
| Dunmore street, midnight | High | 895 | 2.33 M | 199 | 6 | 107 | 201 | 301 | 81 | Mesh 52, oldGate 24, LOD 2, Points 2, impostors 1 |
| the field west of Dunmore, noon | Low | 583 | 642k | 0 | 0 | 105 | 107 | 301 | 70 | Group 30, Mesh 28, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | Middle | 690 | 1.06 M | 81 | 6 | 105 | 107 | 321 | 70 | Group 30, Mesh 28, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | High | 738 | 1.55 M | 119 | 6 | 105 | 107 | 331 | 70 | Group 30, Mesh 28, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | Low | 665 | 632k | 0 | 0 | 108 | 186 | 301 | 70 | Group 30, Mesh 28, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | Middle | 833 | 1.12 M | 142 | 6 | 108 | 186 | 321 | 70 | Group 30, Mesh 28, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | High | 886 | 1.64 M | 185 | 6 | 108 | 186 | 331 | 70 | Group 30, Mesh 28, oldGate 8, quaywall 2, impostors 1 |

### s1000 — 2026-10-28 13:18 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 393 | 673k | 0 | 0 | 30 | 67 | 208 | 88 | Mesh 36, Group 36, oldGate 14, impostors 1, LOD 1 |
| Portclare square, noon | Middle | 560 | 1.42 M | 141 | 6 | 31 | 67 | 227 | 88 | Mesh 36, Group 36, oldGate 14, impostors 1, LOD 1 |
| Portclare square, noon | High | 609 | 1.83 M | 176 | 6 | 32 | 67 | 240 | 88 | Mesh 36, Group 36, oldGate 14, impostors 1, LOD 1 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 261 | 422k | 0 | 0 | 43 | 0 | 0 | 217 |  |

*s1000, QA Session 1532 (`budget` and `budgetport` 763 s and 385 s, run beside `autumn` and `scaleratio` on 4 cores; one pass each): every view under its draw calls and its triangles at every level, 18/18 and 9/9, so `budget` leaves `tests/skip.json`. Against s979: Dunmore's street at noon, Middle, 751 → 752 calls and 2.02 M → 1.86 M triangles (Low 1.29 M → 1.10 M: Session 1515's far trees); at midnight 832 → 833; the field west at dawn 827 → 833; Portclare's square 566 → 560; the inn's hall 38 → 38; the medium gate 241 → 261 (+8%, all in the other column, 197 → 217). No spot rose by more than 10%.*

### s1017 — 2026-10-29 01:18 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 392 | 678k | 0 | 0 | 31 | 67 | 208 | 86 | Mesh 36, Group 34, oldGate 14, impostors 1, LOD 1 |
| Portclare square, noon | Middle | 559 | 1.43 M | 141 | 6 | 32 | 67 | 227 | 86 | Mesh 36, Group 34, oldGate 14, impostors 1, LOD 1 |
| Portclare square, noon | High | 607 | 1.83 M | 176 | 6 | 32 | 67 | 240 | 86 | Mesh 36, Group 34, oldGate 14, impostors 1, LOD 1 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 243 | 422k | 0 | 0 | 45 | 0 | 0 | 197 |  |

*s1017, QA Session 1553 (`budgetport` 9/9, run beside `budget`; `budget` hit the 900 s cap with five browsers on four cores, its table owed): Portclare's square at noon, Middle, 560 → 559 calls and 1.42 M → 1.43 M triangles; the inn's hall 38 → 38; the medium gate 261 → 243 (the other column 217 → 197). No spot rose by more than 10%.*

### s1035 — 2026-10-29 13:07 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 592 | 1.10 M | 0 | 0 | 110 | 135 | 268 | 79 | Mesh 52, oldGate 24, LOD 2, impostors 1 |
| Dunmore street, noon | Middle | 750 | 1.86 M | 136 | 6 | 113 | 135 | 281 | 79 | Mesh 52, oldGate 24, LOD 2, impostors 1 |
| Dunmore street, noon | High | 801 | 2.35 M | 168 | 6 | 113 | 135 | 300 | 79 | Mesh 52, oldGate 24, LOD 2, impostors 1 |
| Dunmore street, midnight | Low | 656 | 1.06 M | 0 | 0 | 107 | 201 | 268 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, midnight | Middle | 831 | 1.77 M | 156 | 6 | 107 | 201 | 281 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, midnight | High | 893 | 2.33 M | 199 | 6 | 107 | 201 | 300 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| the field west of Dunmore, noon | Low | 573 | 643k | 0 | 0 | 105 | 107 | 302 | 59 | Mesh 28, Group 20, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | Middle | 680 | 1.06 M | 81 | 6 | 105 | 107 | 322 | 59 | Mesh 28, Group 20, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | High | 728 | 1.55 M | 119 | 6 | 105 | 107 | 332 | 59 | Mesh 28, Group 20, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | Low | 656 | 634k | 0 | 0 | 108 | 186 | 302 | 60 | Mesh 28, Group 20, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | Middle | 824 | 1.12 M | 142 | 6 | 108 | 186 | 322 | 60 | Mesh 28, Group 20, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | High | 877 | 1.65 M | 185 | 6 | 108 | 186 | 332 | 60 | Mesh 28, Group 20, oldGate 8, quaywall 2, impostors 1 |

### s1035 — 2026-10-29 13:08 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 593 | 1.10 M | 0 | 0 | 110 | 135 | 268 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, noon | Middle | 751 | 1.86 M | 136 | 6 | 113 | 135 | 281 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, noon | High | 802 | 2.35 M | 168 | 6 | 113 | 135 | 300 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, midnight | Low | 657 | 1.06 M | 0 | 0 | 107 | 201 | 268 | 81 | Mesh 52, oldGate 24, LOD 2, Points 2, impostors 1 |
| Dunmore street, midnight | Middle | 832 | 1.77 M | 156 | 6 | 107 | 201 | 281 | 81 | Mesh 52, oldGate 24, LOD 2, Points 2, impostors 1 |
| Dunmore street, midnight | High | 894 | 2.33 M | 199 | 6 | 107 | 201 | 300 | 81 | Mesh 52, oldGate 24, LOD 2, Points 2, impostors 1 |
| the field west of Dunmore, noon | Low | 576 | 644k | 0 | 0 | 105 | 107 | 302 | 62 | Mesh 28, Group 22, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | Middle | 683 | 1.06 M | 81 | 6 | 105 | 107 | 322 | 62 | Mesh 28, Group 22, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | High | 731 | 1.55 M | 119 | 6 | 105 | 107 | 332 | 62 | Mesh 28, Group 22, oldGate 8, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | Low | 659 | 634k | 0 | 0 | 108 | 186 | 302 | 63 | Mesh 28, Group 22, oldGate 8, quaywall 2, Points 2 |
| the field west of Dunmore, dawn | Middle | 827 | 1.12 M | 142 | 6 | 108 | 186 | 322 | 63 | Mesh 28, Group 22, oldGate 8, quaywall 2, Points 2 |
| the field west of Dunmore, dawn | High | 880 | 1.65 M | 185 | 6 | 108 | 186 | 332 | 63 | Mesh 28, Group 22, oldGate 8, quaywall 2, Points 2 |

### s1035 — 2026-10-29 13:14 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 393 | 673k | 0 | 0 | 30 | 67 | 208 | 88 | Mesh 36, Group 36, oldGate 14, impostors 1, LOD 1 |
| Portclare square, noon | Middle | 560 | 1.42 M | 141 | 6 | 31 | 67 | 227 | 88 | Mesh 36, Group 36, oldGate 14, impostors 1, LOD 1 |
| Portclare square, noon | High | 608 | 1.83 M | 176 | 6 | 31 | 67 | 240 | 88 | Mesh 36, Group 36, oldGate 14, impostors 1, LOD 1 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 254 | 427k | 0 | 0 | 46 | 0 | 0 | 207 |  |

*s1035, QA Session 1569 (`budget` 18/18 and `budgetport` 9/9, alone on 4 cores: 605 s and 322 s; the 13:07 table is a first pass of `budget` whose run was stopped during `budgetport`, the 13:08 table the second; the two agree to 3 calls, the triangles to the digit). This pays the `budget` table s1017 owed. Against s1000: Dunmore's street at noon, Middle, 752 → 751 calls and 1.86 M → 1.86 M triangles; at midnight 833 → 832; the field west at noon 690 → 683 and at dawn 833 → 827 (the other column 70 → 62–63); against s1017: Portclare's square 559 → 560, the inn's hall 38 → 38, the medium gate 243 → 254 (+4.5%: bodies 45 → 46, the gate's own 197 → 207; it read 261 at s1000). No spot rose by more than 10%. The ships' holds (S1555, S1564) and the kit wolves' fur (S1561) stand at none of these spots.*

### s1049 — 2026-10-30 01:13 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 592 | 1.10 M | 0 | 0 | 110 | 135 | 268 | 79 | Mesh 52, oldGate 24, LOD 2, impostors 1 |
| Dunmore street, noon | Middle | 750 | 1.85 M | 136 | 6 | 113 | 135 | 281 | 79 | Mesh 52, oldGate 24, LOD 2, impostors 1 |
| Dunmore street, noon | High | 801 | 2.35 M | 168 | 6 | 113 | 135 | 300 | 79 | Mesh 52, oldGate 24, LOD 2, impostors 1 |
| Dunmore street, midnight | Low | 656 | 1.06 M | 0 | 0 | 107 | 201 | 268 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, midnight | Middle | 832 | 1.77 M | 157 | 6 | 107 | 201 | 281 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, midnight | High | 893 | 2.33 M | 199 | 6 | 107 | 201 | 300 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| the field west of Dunmore, noon | Low | 557 | 646k | 0 | 0 | 105 | 107 | 302 | 43 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | Middle | 664 | 1.06 M | 81 | 6 | 105 | 107 | 322 | 43 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | High | 712 | 1.55 M | 119 | 6 | 105 | 107 | 332 | 43 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | Low | 640 | 636k | 0 | 0 | 108 | 186 | 302 | 44 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | Middle | 808 | 1.12 M | 142 | 6 | 108 | 186 | 322 | 44 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | High | 861 | 1.65 M | 185 | 6 | 108 | 186 | 332 | 44 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |

### s1049 — 2026-10-30 01:20 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 365 | 678k | 0 | 0 | 30 | 67 | 208 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| Portclare square, noon | Middle | 532 | 1.43 M | 141 | 6 | 31 | 67 | 227 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| Portclare square, noon | High | 580 | 1.83 M | 176 | 6 | 31 | 67 | 240 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 262 | 422k | 0 | 0 | 44 | 0 | 0 | 217 |  |

*s1049, QA Session 1597 (`budget` and `budgetport` passed every check, alone on 4 cores: 506 s and 395 s). Against s1035, at Middle: Dunmore's street at noon 751 → 750 calls, 1.86 M → 1.85 M triangles; at midnight 832 → 832; the field west at noon 683 → 664 and at dawn 827 → 808; Portclare's square 560 → 532, 1.42 M → 1.43 M; the inn's hall 38 → 38; the medium gate 254 → 262 calls (+3.1%: bodies 46 → 44, the gate's own 207 → 217), 427k → 422k triangles. The falls are all in the other column's `Group` rows (field west 22 → 4, Portclare 36 → 8); which merge took them is not traced. No spot rose by more than 10%.*

### s1072 — 2026-10-31 07:01 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 592 | 1.10 M | 0 | 0 | 110 | 135 | 268 | 79 | Mesh 52, oldGate 24, LOD 2, impostors 1 |
| Dunmore street, noon | Middle | 750 | 1.85 M | 136 | 6 | 113 | 135 | 281 | 79 | Mesh 52, oldGate 24, LOD 2, impostors 1 |
| Dunmore street, noon | High | 801 | 2.35 M | 168 | 6 | 113 | 135 | 300 | 79 | Mesh 52, oldGate 24, LOD 2, impostors 1 |
| Dunmore street, midnight | Low | 656 | 1.06 M | 0 | 0 | 107 | 201 | 268 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, midnight | Middle | 831 | 1.77 M | 156 | 6 | 107 | 201 | 281 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, midnight | High | 893 | 2.33 M | 199 | 6 | 107 | 201 | 300 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| the field west of Dunmore, noon | Low | 557 | 646k | 0 | 0 | 105 | 107 | 302 | 43 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | Middle | 664 | 1.06 M | 81 | 6 | 105 | 107 | 322 | 43 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | High | 712 | 1.55 M | 119 | 6 | 105 | 107 | 332 | 43 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | Low | 640 | 636k | 0 | 0 | 108 | 186 | 302 | 44 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | Middle | 808 | 1.12 M | 142 | 6 | 108 | 186 | 322 | 44 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | High | 861 | 1.65 M | 185 | 6 | 108 | 186 | 332 | 44 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |

### s1072 — 2026-10-31 07:11 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 365 | 678k | 0 | 0 | 30 | 67 | 208 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| Portclare square, noon | Middle | 532 | 1.43 M | 141 | 6 | 31 | 67 | 227 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| Portclare square, noon | High | 581 | 1.84 M | 176 | 6 | 32 | 67 | 240 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 247 | 429k | 0 | 0 | 44 | 0 | 0 | 202 |  |

*s1072, QA Session 1650, numbered 1634 when written (`budget` and `budgetport` passed every check, alone on 4 cores: about 480 s and 343 s). Against s1049, 23 builds and every merge of 30–31 Oct (magic B's held, laid and sent forms, the Skyfall Fields, the herring, the slime and the elemental's deaths), at Middle: Dunmore's street at noon 750 → 750 calls, 1.85 M → 1.85 M triangles; at midnight 832 → 831; the field west at noon 664 → 664 and at dawn 808 → 808; Portclare's square 532 → 532, 1.43 M → 1.43 M (High 580 → 581, a body more); the inn's hall 38 → 38; the medium gate 262 → 247 calls (−5.7%: the gate's own 217 → 202, bodies 44 → 44), 422k → 429k triangles (+1.7%). No spot rose by more than 10%. The herring's quay schools (S1599) do not reach Portclare's square from where it stands.*

### s1093 — 2026-11-01 01:24 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 592 | 1.10 M | 0 | 0 | 110 | 135 | 268 | 79 | Mesh 52, oldGate 24, LOD 2, impostors 1 |
| Dunmore street, noon | Middle | 750 | 1.86 M | 136 | 6 | 113 | 135 | 281 | 79 | Mesh 52, oldGate 24, LOD 2, impostors 1 |
| Dunmore street, noon | High | 801 | 2.35 M | 168 | 6 | 113 | 135 | 300 | 79 | Mesh 52, oldGate 24, LOD 2, impostors 1 |
| Dunmore street, midnight | Low | 656 | 1.06 M | 0 | 0 | 107 | 201 | 268 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, midnight | Middle | 832 | 1.77 M | 157 | 6 | 107 | 201 | 281 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| Dunmore street, midnight | High | 893 | 2.33 M | 199 | 6 | 107 | 201 | 300 | 80 | Mesh 52, oldGate 24, LOD 2, impostors 1, Points 1 |
| the field west of Dunmore, noon | Low | 557 | 646k | 0 | 0 | 105 | 107 | 302 | 43 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | Middle | 664 | 1.06 M | 81 | 6 | 105 | 107 | 322 | 43 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | High | 712 | 1.55 M | 119 | 6 | 105 | 107 | 332 | 43 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | Low | 640 | 636k | 0 | 0 | 108 | 186 | 302 | 44 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | Middle | 808 | 1.12 M | 142 | 6 | 108 | 186 | 322 | 44 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | High | 861 | 1.65 M | 185 | 6 | 108 | 186 | 332 | 44 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |

### s1093 — 2026-11-01 01:30 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 365 | 678k | 0 | 0 | 30 | 67 | 208 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| Portclare square, noon | Middle | 532 | 1.43 M | 141 | 6 | 31 | 67 | 227 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| Portclare square, noon | High | 580 | 1.83 M | 176 | 6 | 31 | 67 | 240 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 280 | 425k | 0 | 0 | 44 | 0 | 0 | 235 |  |

### s1093 — 2026-11-01 01:36 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 365 | 670k | 0 | 0 | 30 | 67 | 208 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| Portclare square, noon | Middle | 532 | 1.43 M | 141 | 6 | 31 | 67 | 227 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| Portclare square, noon | High | 580 | 1.83 M | 176 | 6 | 31 | 67 | 240 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 242 | 427k | 0 | 0 | 44 | 0 | 0 | 197 |  |

*s1093, QA Session 1673 (`budget` 18/18 on its retry: the first try was killed at the 900 s cap with three `shuttle` boots of this session's on the same four cores, about 480 s alone before; `budgetport` 9/9 twice, about 349 s each, because `run.mjs budget` also names it by prefix). Against s1072, 21 builds and every merge of 31 Oct–1 Nov (the ring and its post, TOUCH in dungeons, the fur mantle's hair), at Middle: Dunmore's street at noon 750 → 750 calls, 1.85 M → 1.86 M triangles; at midnight 831 → 832; the field west at noon 664 → 664 and at dawn 808 → 808; Portclare's square 532 → 532, 1.43 M → 1.43 M; the inn's hall 38 → 38. The medium gate read 280 calls in the first boot and 242 in the second, on the same build (the gate's own 235 and 197; bodies 44 both; 425k and 427k triangles): against s1072's 247 that is +13% and −2%. Not a rise between builds but a spread between boots, so what the gate draws from its entrance is not fixed by the seed; QA's to narrow next (the gate's zones shown, `dZoneShown`, against when the count is taken). No spot rose by more than 10% between builds.*
