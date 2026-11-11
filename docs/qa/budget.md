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

Session 1684: the gate's row is counted as the game draws it from here on (through `dRender`, which hides the spaces you cannot see), on a
seeded build of its cosmetic rolls, once its count holds still. It is not comparable with the rows above (242–280): those counted
every space in the frustum, about 2.2× what the game draws, on whatever rubble and torches that boot rolled. Two boots read 100 and 100.

### s1106 — 2026-11-01 07:50 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 365 | 678k | 0 | 0 | 30 | 67 | 208 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| Portclare square, noon | Middle | 532 | 1.43 M | 141 | 6 | 31 | 67 | 227 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| Portclare square, noon | High | 580 | 1.83 M | 176 | 6 | 31 | 67 | 240 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 100 | 394k | 0 | 0 | 33 | 0 | 0 | 66 |  |

### s1113 — 2026-11-01 13:09 UTC

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
| Portclare square, noon | Low | 365 | 678k | 0 | 0 | 30 | 67 | 208 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| Portclare square, noon | Middle | 533 | 1.43 M | 141 | 6 | 32 | 67 | 227 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| Portclare square, noon | High | 581 | 1.84 M | 176 | 6 | 32 | 67 | 240 | 60 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |

*s1113, QA Session 1694 (`budget` 678 s and `budgetport` 339 s, each green on its first try, alone on four cores). Every spot is within 2 calls
of the last table that held it (Dunmore s1093, Portclare, the inn and the gate s1106): nothing rose, nothing near the 10% line. The closest
to a ceiling is still Dunmore's street at midnight on Low, 656 of 700.*

### s1147 — 2026-11-02 13:29 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 596 | 1.10 M | 0 | 0 | 110 | 135 | 268 | 83 | Mesh 52, oldGate 24, Group 4, LOD 2, impostors 1 |
| Dunmore street, noon | Middle | 754 | 1.85 M | 136 | 6 | 113 | 135 | 281 | 83 | Mesh 52, oldGate 24, Group 4, LOD 2, impostors 1 |
| Dunmore street, noon | High | 805 | 2.35 M | 168 | 6 | 113 | 135 | 300 | 83 | Mesh 52, oldGate 24, Group 4, LOD 2, impostors 1 |
| Dunmore street, midnight | Low | 660 | 1.07 M | 0 | 0 | 107 | 201 | 268 | 84 | Mesh 52, oldGate 24, Group 4, LOD 2, impostors 1 |
| Dunmore street, midnight | Middle | 840 | 1.77 M | 161 | 6 | 107 | 201 | 281 | 84 | Mesh 52, oldGate 24, Group 4, LOD 2, impostors 1 |
| Dunmore street, midnight | High | 901 | 2.33 M | 203 | 6 | 107 | 201 | 300 | 84 | Mesh 52, oldGate 24, Group 4, LOD 2, impostors 1 |
| the field west of Dunmore, noon | Low | 557 | 646k | 0 | 0 | 105 | 107 | 302 | 43 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | Middle | 668 | 1.06 M | 85 | 6 | 105 | 107 | 322 | 43 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, noon | High | 716 | 1.55 M | 123 | 6 | 105 | 107 | 332 | 43 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | Low | 640 | 636k | 0 | 0 | 108 | 186 | 302 | 44 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | Middle | 811 | 1.12 M | 145 | 6 | 108 | 186 | 322 | 44 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |
| the field west of Dunmore, dawn | High | 865 | 1.65 M | 189 | 6 | 108 | 186 | 332 | 44 | Mesh 28, oldGate 8, Group 4, quaywall 2, impostors 1 |

### s1147 — 2026-11-02 13:36 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 366 | 678k | 0 | 0 | 30 | 67 | 208 | 61 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| Portclare square, noon | Middle | 533 | 1.43 M | 141 | 6 | 31 | 67 | 227 | 61 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| Portclare square, noon | High | 581 | 1.84 M | 176 | 6 | 31 | 67 | 240 | 61 | Mesh 36, oldGate 14, Group 8, impostors 1, LOD 1 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |

*s1147, QA Session 1748 (`budget` 8/8 on its retry, about 700 s: the first try was killed at the 900 s cap alone on four cores, its first boot's
Hearthwick wait 130 s and stand 201 s, then 73 s to set Middle at midnight's High; `budgetport` 9/9 in 382 s). Against s1113, 34 builds and every
merge of 1–2 Nov (F8's abbey, tower house and cairn, the 24 animals and 9 birds, the ship's fittings and figureheads), at Middle: Dunmore's street
at noon 750 → 754 calls, 1.86 M → 1.85 M triangles; at midnight 832 → 840 (Low 656 → 660 of its 700); the field west at noon 664 → 668 and at dawn
808 → 811; Portclare's square 533 → 533; the inn's hall 38 → 38; the medium gate 102 → 102. The four calls more in town are "other" (79 → 83: a
`Group` of 4 meshes now in view), the same four at every level. No spot rose by more than 10%; the largest is +1.0%.*

### s1183 — 2026-11-03 13:08 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 612 | 1.13 M | 0 | 0 | 111 | 135 | 268 | 98 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 4, weaver door 4 |
| Dunmore street, noon | Middle | 769 | 1.87 M | 136 | 6 | 113 | 135 | 281 | 98 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 4, weaver door 4 |
| Dunmore street, noon | High | 820 | 2.37 M | 168 | 6 | 113 | 135 | 300 | 98 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 4, weaver door 4 |
| Dunmore street, midnight | Low | 675 | 1.09 M | 0 | 0 | 107 | 201 | 268 | 99 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 4, weaver door 4 |
| Dunmore street, midnight | Middle | 850 | 1.80 M | 156 | 6 | 107 | 201 | 281 | 99 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 4, weaver door 4 |
| Dunmore street, midnight | High | 912 | 2.36 M | 199 | 6 | 107 | 201 | 300 | 99 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 4, weaver door 4 |
| the field west of Dunmore, noon | Low | 563 | 652k | 0 | 0 | 105 | 107 | 302 | 49 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | Middle | 671 | 1.07 M | 82 | 6 | 105 | 107 | 322 | 49 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | High | 719 | 1.56 M | 120 | 6 | 105 | 107 | 332 | 49 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Low | 646 | 643k | 0 | 0 | 108 | 186 | 302 | 50 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Middle | 815 | 1.13 M | 143 | 6 | 108 | 186 | 322 | 50 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | High | 868 | 1.66 M | 186 | 6 | 108 | 186 | 332 | 50 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |


### s1183 — 2026-11-03 13:15 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 381 | 704k | 0 | 0 | 30 | 65 | 208 | 78 | Mesh 36, oldGate 14, cave mouth 8, Group 8, sea cave mouth 4 |
| Portclare square, noon | Middle | 548 | 1.46 M | 141 | 6 | 31 | 65 | 227 | 78 | Mesh 36, oldGate 14, cave mouth 8, Group 8, sea cave mouth 4 |
| Portclare square, noon | High | 596 | 1.86 M | 176 | 6 | 31 | 65 | 240 | 78 | Mesh 36, oldGate 14, cave mouth 8, Group 8, sea cave mouth 4 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |

*s1183, QA Session 1786 (`budget` 18/18 in 877 s and `budgetport` 9/9 in 431 s, two boots side by side on four cores, one try each). Against s1147, 36 builds and
every merge of 2–3 Nov (the limestone cave and the smugglers' sea cave, the Weaver doors, the burnous's hood, the islands' own animals), at Middle: Dunmore's street at
noon 754 → 769 calls (+2.0%), 1.85 M → 1.87 M triangles; at midnight 840 → 850 (+1.2%; Low 660 → 675 of its 700); the field west at noon 668 → 671 and at dawn
811 → 815; Portclare's square 533 → 548 (+2.8%; Low 366 → 381, +4.1%, the largest), 1.43 M → 1.46 M; the inn's hall 38 → 38; the medium gate 102 → 102. Every
rise is in the other column (Dunmore 83 → 98, Portclare 61 → 78, the field 43 → 49): the far cave mouths now in view (`cave mouth` 8 and `sea cave mouth` 4 at
Portclare, Look Sessions 1768 and 1772) and four `weaver door` calls in Dunmore at midnight (Session 1780). No spot rose by more than 10%. `budget` took 877 s
of `run.mjs`'s 900 s cap with one other boot beside it.*

### s1198 — 2026-11-04 01:04 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 614 | 1.13 M | 0 | 0 | 111 | 135 | 269 | 99 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 4, weaver door 4 |
| Dunmore street, noon | Middle | 771 | 1.88 M | 136 | 6 | 113 | 135 | 282 | 99 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 4, weaver door 4 |
| Dunmore street, noon | High | 822 | 2.38 M | 168 | 6 | 113 | 135 | 301 | 99 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 4, weaver door 4 |
| Dunmore street, midnight | Low | 677 | 1.09 M | 0 | 0 | 107 | 201 | 269 | 100 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 4, weaver door 4 |
| Dunmore street, midnight | Middle | 852 | 1.80 M | 156 | 6 | 107 | 201 | 282 | 100 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 4, weaver door 4 |
| Dunmore street, midnight | High | 914 | 2.36 M | 199 | 6 | 107 | 201 | 301 | 100 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 4, weaver door 4 |
| the field west of Dunmore, noon | Low | 564 | 652k | 0 | 0 | 105 | 107 | 302 | 50 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | Middle | 673 | 1.07 M | 83 | 6 | 105 | 107 | 322 | 50 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | High | 720 | 1.56 M | 120 | 6 | 105 | 107 | 332 | 50 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Low | 663 | 695k | 0 | 0 | 124 | 186 | 302 | 51 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Middle | 816 | 1.13 M | 143 | 6 | 108 | 186 | 322 | 51 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | High | 869 | 1.66 M | 186 | 6 | 108 | 186 | 332 | 51 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |

### s1198 — 2026-11-04 01:05 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 382 | 710k | 0 | 0 | 31 | 65 | 208 | 78 | Mesh 36, oldGate 14, cave mouth 8, Group 8, sea cave mouth 4 |
| Portclare square, noon | Middle | 548 | 1.45 M | 141 | 6 | 31 | 65 | 227 | 78 | Mesh 36, oldGate 14, cave mouth 8, Group 8, sea cave mouth 4 |
| Portclare square, noon | High | 596 | 1.86 M | 176 | 6 | 31 | 65 | 240 | 78 | Mesh 36, oldGate 14, cave mouth 8, Group 8, sea cave mouth 4 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |

*s1198, QA Session 1810 (`budget` 18/18 in 625 s and `budgetport` 9/9 in 366 s, two boots side by side on four cores, one try each; `budgetport` ran a
second time, since `run.mjs budget` names both, and read within one call of it: Low 381 and 705k). Against s1183, 15 builds and every merge of 3 Nov after 13:00 UTC (Look 1787–1788 and 1790,
Systems 1789–1808, Bodies 1792, 1798–1799 and 1809's lantern), at Middle: Dunmore's street at noon 769 → 771 calls,
1.87 M → 1.88 M triangles; at midnight 850 → 852 (Low 675 → 677 of its 700); the field west at noon 671 → 673 and at dawn 815 → 816; Portclare's square
548 → 548; the inn's hall 38 → 38; the medium gate 102 → 102. The two calls more in Dunmore are one in the land and one in the other column, at every level.
The largest rise is the field at dawn at Low, 646 → 663 (+2.6%) and 643k → 695k triangles (+8.1%), all of it bodies (108 → 124, 16 calls): someone
walking into the view at that level only, since Middle and High read 108 as before. No spot rose by more than 10%. `budget` took 625 s of the 900 s cap,
against 877 s last time with the same two boots: the margin is back.*

### s1220 — 2026-11-04 13:00 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 615 | 1.14 M | 0 | 0 | 110 | 135 | 268 | 102 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| Dunmore street, noon | Middle | 773 | 1.88 M | 136 | 6 | 113 | 135 | 281 | 102 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| Dunmore street, noon | High | 824 | 2.38 M | 168 | 6 | 113 | 135 | 300 | 102 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| Dunmore street, midnight | Low | 679 | 1.09 M | 0 | 0 | 107 | 201 | 268 | 103 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| Dunmore street, midnight | Middle | 854 | 1.81 M | 156 | 6 | 107 | 201 | 281 | 103 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| Dunmore street, midnight | High | 916 | 2.37 M | 199 | 6 | 107 | 201 | 300 | 103 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| the field west of Dunmore, noon | Low | 563 | 652k | 0 | 0 | 105 | 107 | 302 | 49 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | Middle | 671 | 1.07 M | 82 | 6 | 105 | 107 | 322 | 49 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | High | 719 | 1.56 M | 120 | 6 | 105 | 107 | 332 | 49 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Low | 646 | 638k | 0 | 0 | 108 | 186 | 302 | 50 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Middle | 815 | 1.13 M | 143 | 6 | 108 | 186 | 322 | 50 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | High | 868 | 1.66 M | 186 | 6 | 108 | 186 | 332 | 50 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |

### s1220 — 2026-11-04 13:07 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 385 | 712k | 0 | 0 | 30 | 65 | 208 | 82 | Mesh 36, oldGate 14, cave mouth 8, sea cave mouth 8, Group 8 |
| Portclare square, noon | Middle | 552 | 1.46 M | 141 | 6 | 31 | 65 | 227 | 82 | Mesh 36, oldGate 14, cave mouth 8, sea cave mouth 8, Group 8 |
| Portclare square, noon | High | 600 | 1.87 M | 176 | 6 | 31 | 65 | 240 | 82 | Mesh 36, oldGate 14, cave mouth 8, sea cave mouth 8, Group 8 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |

*s1220, QA Session 1833 (`budget` 18/18 in 423 s and `budgetport` 9/9 in 380 s, one try each, run in series by `run.mjs budget` on four cores with no
other boot). Against s1198, 22 builds and every merge of 4 Nov to 12:40 UTC (Look 1811–1812, 1818, 1827 and 1830, Systems 1813–1830, Bodies 1816, 1825,
1829 and 1832), at Middle: Dunmore's street at noon 771 → 773 calls, 1.88 M → 1.88 M triangles; at midnight 852 → 854 (Low 677 → 679 of its 700); the field
west at noon 673 → 671 and at dawn 816 → 815; Portclare's square 548 → 552 (+0.7%), 1.45 M → 1.46 M; the inn's hall 38 → 38; the medium gate 102 → 102. The
rise is `sea cave mouth`, 4 → 8 calls in Dunmore's and Portclare's views: the smugglers' bolt-hole, the cave mouth's outcrop at 0.55 size at each tunnel's end
(Look Session 1811). The field at dawn at Low is back to 646 calls and 108 bodies (s1198's 663 and 124 were someone walking into view). The largest rise is
Portclare at Low, 382 → 385 (+0.8%). No spot rose by more than 10%. Dunmore at midnight at Low is 679 of its 700 calls: 21 left.*

### s1247 — 2026-11-05 07:20 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 616 | 1.13 M | 0 | 0 | 110 | 135 | 268 | 103 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| Dunmore street, noon | Middle | 773 | 1.88 M | 135 | 6 | 113 | 135 | 281 | 103 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| Dunmore street, noon | High | 824 | 2.37 M | 167 | 6 | 113 | 135 | 300 | 103 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| Dunmore street, midnight | Low | 680 | 1.09 M | 0 | 0 | 107 | 201 | 268 | 104 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| Dunmore street, midnight | Middle | 854 | 1.80 M | 155 | 6 | 107 | 201 | 281 | 104 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| Dunmore street, midnight | High | 916 | 2.36 M | 198 | 6 | 107 | 201 | 300 | 104 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| the field west of Dunmore, noon | Low | 564 | 652k | 0 | 0 | 105 | 107 | 302 | 50 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | Middle | 672 | 1.07 M | 82 | 6 | 105 | 107 | 322 | 50 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | High | 720 | 1.56 M | 120 | 6 | 105 | 107 | 332 | 50 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Low | 647 | 643k | 0 | 0 | 108 | 186 | 302 | 51 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Middle | 816 | 1.13 M | 143 | 6 | 108 | 186 | 322 | 51 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | High | 869 | 1.66 M | 186 | 6 | 108 | 186 | 332 | 51 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| Portclare square, noon | Low | 386 | 713k | 0 | 0 | 31 | 65 | 208 | 82 | Mesh 36, oldGate 14, cave mouth 8, sea cave mouth 8, Group 8 |
| Portclare square, noon | Middle | 552 | 1.46 M | 141 | 6 | 31 | 65 | 227 | 82 | Mesh 36, oldGate 14, cave mouth 8, sea cave mouth 8, Group 8 |
| Portclare square, noon | High | 600 | 1.87 M | 176 | 6 | 31 | 65 | 240 | 82 | Mesh 36, oldGate 14, cave mouth 8, sea cave mouth 8, Group 8 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |

*s1247, QA Session 1861 (`budget` 18/18 in 421 s and `budgetport` 9/9 in 455 s, one try each, run in series by `run.mjs budget` on four cores with no
other boot). Against s1220, 27 builds and every merge from 4 Nov 13:00 to 5 Nov 05:20 UTC (Look 1836, 1843, 1847, 1855 and 1860 with the forge and its
room, Systems 1834–1859 with the naval rules, the implements and the guild's stock, Bodies 1835–1856 with the cast's pieces, five strange beasts and the
implements' meshes, Quests 1857), at Middle: Dunmore's street at noon 773 → 773 calls, 1.88 M → 1.88 M triangles; at midnight 854 → 854 (Low 679 → 680 of its
700); the field west at noon 671 → 672 and at dawn 815 → 816; Portclare's square 552 → 552, 1.46 M → 1.46 M; the inn's hall 38 → 38; the medium gate 102 → 102.
The one call more in each outdoor view is in *Other* (102 → 103 in Dunmore's street). The largest rise is Portclare at Low, 385 → 386 (+0.3%). No spot rose by
more than 10%, and nothing merged since s1220 stands in these views: the forge's room, the beasts and the implements are elsewhere. Dunmore at midnight at Low
is 680 of its 700 calls: 20 left.*

### s1287 — 2026-11-06 07:05 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 618 | 1.14 M | 0 | 0 | 112 | 136 | 269 | 101 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| Dunmore street, noon | Middle | 774 | 1.88 M | 136 | 6 | 113 | 136 | 282 | 101 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| Dunmore street, noon | High | 825 | 2.38 M | 168 | 6 | 113 | 136 | 301 | 101 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| Dunmore street, midnight | Low | 682 | 1.09 M | 0 | 0 | 109 | 202 | 269 | 102 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| Dunmore street, midnight | Middle | 861 | 1.82 M | 160 | 6 | 109 | 202 | 282 | 102 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| Dunmore street, midnight | High | 922 | 2.38 M | 202 | 6 | 109 | 202 | 301 | 102 | Mesh 52, oldGate 24, cave mouth 8, sea cave mouth 8, weaver door 4 |
| the field west of Dunmore, noon | Low | 563 | 652k | 0 | 0 | 105 | 107 | 302 | 49 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | Middle | 672 | 1.07 M | 83 | 6 | 105 | 107 | 322 | 49 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | High | 721 | 1.56 M | 122 | 6 | 105 | 107 | 332 | 49 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Low | 646 | 643k | 0 | 0 | 108 | 186 | 302 | 50 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Middle | 815 | 1.13 M | 143 | 6 | 108 | 186 | 322 | 50 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | High | 869 | 1.67 M | 187 | 6 | 108 | 186 | 332 | 50 | Mesh 28, oldGate 8, cave mouth 4, Group 4, quaywall 2 |
| Portclare square, noon | Low | 387 | 727k | 0 | 0 | 31 | 65 | 208 | 83 | Mesh 36, oldGate 14, cave mouth 8, sea cave mouth 8, Group 8 |
| Portclare square, noon | Middle | 556 | 1.48 M | 144 | 6 | 31 | 65 | 227 | 83 | Mesh 36, oldGate 14, cave mouth 8, sea cave mouth 8, Group 8 |
| Portclare square, noon | High | 604 | 1.89 M | 179 | 6 | 31 | 65 | 240 | 83 | Mesh 36, oldGate 14, cave mouth 8, sea cave mouth 8, Group 8 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 38 | 26k | 0 | 0 | 1 | 0 | 0 | 37 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |

*s1287, QA Session 1916 (`budget` 18/18 in 463 s, one try; `budgetport` 9/9 in its fixed form, one try, run after it on four cores with no other
boot. The unchanged `budgetport` was red twice here first, at its wait for the inn's exit, Session 1916's devlog). Against s1247, 40 builds later (every merge to
6 Nov 05:20 UTC, among them the look builder's market house on the square, its room and its stair, and the bodies builder's strange beasts), at
Middle: Dunmore's street at noon 773 → 774 calls, 1.88 M → 1.88 M triangles; at midnight 854 → 861 (+0.8%), 1.80 M → 1.82 M (Low 680 → 682 of its 700);
the field west at noon 672 → 672 and at dawn 816 → 815; Portclare's square 552 → 556 (+0.7%), 1.46 M → 1.48 M (+1.5%); the inn's hall 38 → 38; the medium
gate 102 → 102. Dunmore's *Houses* rose by one call in each view (135 → 136 at noon, 201 → 202 at midnight): the market house on the square (Look 1904),
which its builder put at 21 draws, mostly out of this view. Midnight's shadow pass rose 155 → 160 at Middle. The largest rise is Portclare at Low in
triangles, 713k → 727k (+2.0%). No spot rose by more than 10%. Dunmore at midnight at Low is 682 of its 700 calls: 18 left.*

### s1324 — 2026-11-07 07:03 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 570 | 1.08 M | 0 | 0 | 107 | 120 | 253 | 90 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, noon | Middle | 725 | 1.82 M | 136 | 6 | 108 | 120 | 265 | 90 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, noon | High | 775 | 2.30 M | 168 | 6 | 108 | 120 | 283 | 90 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | Low | 625 | 1.04 M | 0 | 0 | 105 | 176 | 253 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | Middle | 802 | 1.77 M | 159 | 6 | 105 | 176 | 265 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | High | 863 | 2.31 M | 202 | 6 | 105 | 176 | 283 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| the field west of Dunmore, noon | Low | 536 | 627k | 0 | 0 | 105 | 107 | 281 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | Middle | 644 | 1.05 M | 83 | 6 | 105 | 107 | 300 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | High | 691 | 1.51 M | 122 | 6 | 105 | 107 | 308 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Low | 619 | 618k | 0 | 0 | 108 | 186 | 281 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Middle | 787 | 1.10 M | 143 | 6 | 108 | 186 | 300 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | High | 839 | 1.62 M | 187 | 6 | 108 | 186 | 308 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| Portclare square, noon | Low | 356 | 680k | 0 | 0 | 28 | 60 | 192 | 76 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| Portclare square, noon | Middle | 523 | 1.39 M | 144 | 6 | 29 | 60 | 208 | 76 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| Portclare square, noon | High | 570 | 1.73 M | 179 | 6 | 30 | 60 | 219 | 76 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 34 | 26k | 0 | 0 | 1 | 0 | 0 | 33 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |

*s1324, QA Session 1954 (`budget` 18/18 in 409 s and `budgetport` 9/9 in 416 s, one try each, run in series by `run.mjs budget budgetport` on four
cores with no other boot). Against s1287, 37 builds later (every merge to 7 Nov 05:44 UTC, among them the impacts by surface, the tunnel lanes, the islands'
herbs, Aurenne's warehouses, the deckhands and the cart in the ditch), every outdoor view **fell** 4–8% in calls, at Middle:
Dunmore's street at noon 774 → 725 (−6.3%), 1.88 M → 1.82 M; at midnight 861 → 802 (−6.9%; Low 682 → 625 of its 700); the field west at noon 672 → 644
and at dawn 815 → 787; Portclare's square 556 → 523 (−5.9%), 1.48 M → 1.39 M; the inn's hall 38 → 34; the medium gate 102 → 102. The cause is the
frame, not the game's content: Session 1943 made `#g` 100vh, so the harness's 1280×720 page now draws a 1280×720 canvas where it drew 1280×600, and at
the same 75° vertical field of view the horizontal one narrows from 117° to 108°. Houses, land and the old gates at the edges fall out of the view;
the bodies near the centre hardly move (Dunmore noon 113 → 108). Proof: the same build with only `#g` set back to 600 px high (a scratch copy, `--src`)
read 774, 861, 672, 815 and 556 at Middle, s1287's numbers to the call, and Portclare at Low 386 against s1287's 387. So nothing merged since s1287
added a call in these views. From here on every row is on the 1280×720 canvas, and s1324 is the base the next run compares against. No spot rose.
Dunmore at midnight at Low is 625 of its 700 calls: 75 left (18 at s1287, on the wider view).*

### s1342 — 2026-11-07 19:01 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 571 | 1.08 M | 0 | 0 | 107 | 120 | 253 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, noon | Middle | 727 | 1.82 M | 136 | 6 | 109 | 120 | 265 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, noon | High | 777 | 2.30 M | 168 | 6 | 109 | 120 | 283 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | Low | 626 | 1.04 M | 0 | 0 | 105 | 176 | 253 | 92 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | Middle | 803 | 1.77 M | 159 | 6 | 105 | 176 | 265 | 92 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | High | 864 | 2.31 M | 202 | 6 | 105 | 176 | 283 | 92 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| the field west of Dunmore, noon | Low | 537 | 627k | 0 | 0 | 105 | 107 | 281 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | Middle | 645 | 1.05 M | 83 | 6 | 105 | 107 | 300 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | High | 692 | 1.51 M | 122 | 6 | 105 | 107 | 308 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Low | 620 | 618k | 0 | 0 | 108 | 186 | 281 | 45 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Middle | 788 | 1.10 M | 143 | 6 | 108 | 186 | 300 | 45 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | High | 840 | 1.62 M | 187 | 6 | 108 | 186 | 308 | 45 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| Portclare square, noon | Low | 356 | 682k | 0 | 0 | 29 | 60 | 192 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| Portclare square, noon | Middle | 522 | 1.39 M | 144 | 6 | 29 | 60 | 208 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| Portclare square, noon | High | 569 | 1.73 M | 179 | 6 | 30 | 60 | 219 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 34 | 26k | 0 | 0 | 1 | 0 | 0 | 33 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |

*s1342, QA Session 1970 (`budget` 8/8 in about 8 min and `budgetport` 9/9 in about 9.5 min, one try each, run in series by `run.mjs budget budgetport` on
four cores with no other boot). Against s1324, 18 builds later (every merge to 7 Nov 17:38 UTC, among them the impacts thrown off walls and foes'
blows, the Register, the cloak's even columns and the braids over it, the cart's two fixes, the tithe house, the academy and its library, and
Aurenne's one-storey homes' room), every view held within two calls, at Middle: Dunmore's street at noon 725 → 727 (+0.3%; one more body, one more
other), at midnight 802 → 803; the field west at noon 644 → 645 and at dawn 787 → 788 (the other column +1 in each: one more draw in the old gates'
and caves' neighbourhood, not traced); Portclare's square 523 → 522; the inn's hall 34 → 34; the medium gate 102 → 102. Triangles moved by under
0.3% everywhere (Portclare at Low 680k → 682k). Nothing merged in these 18 builds stands in these views: the academy, the tithe house and the
one-storey homes are Aurenne's, and the new rooms are behind doors this suite does not open. No spot rose by more than 10%. Dunmore at midnight
at Low is 626 of its 700 calls: 74 left.*

### s1368 — 2026-11-08 13:08 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 570 | 1.08 M | 0 | 0 | 107 | 120 | 253 | 90 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, noon | Middle | 725 | 1.82 M | 136 | 6 | 108 | 120 | 265 | 90 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, noon | High | 775 | 2.30 M | 168 | 6 | 108 | 120 | 283 | 90 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | Low | 625 | 1.04 M | 0 | 0 | 105 | 176 | 253 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | Middle | 802 | 1.77 M | 159 | 6 | 105 | 176 | 265 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | High | 863 | 2.31 M | 202 | 6 | 105 | 176 | 283 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| the field west of Dunmore, noon | Low | 536 | 627k | 0 | 0 | 105 | 107 | 281 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | Middle | 644 | 1.05 M | 83 | 6 | 105 | 107 | 300 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | High | 691 | 1.51 M | 122 | 6 | 105 | 107 | 308 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Low | 619 | 618k | 0 | 0 | 108 | 186 | 281 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Middle | 787 | 1.10 M | 143 | 6 | 108 | 186 | 300 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | High | 839 | 1.62 M | 187 | 6 | 108 | 186 | 308 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| Portclare square, noon | Low | 357 | 693k | 0 | 0 | 30 | 60 | 192 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| Portclare square, noon | Middle | 523 | 1.39 M | 144 | 6 | 30 | 60 | 208 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| Portclare square, noon | High | 569 | 1.72 M | 179 | 6 | 30 | 60 | 219 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 34 | 26k | 0 | 0 | 1 | 0 | 0 | 33 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |

*s1368, QA Session 1991 (`budget` 8/8 in 446 s and `budgetport` 9/9 in 530 s, one try each, run in series by `run.mjs budget budgetport` on four cores with no other boot). Against s1342, 26 builds later (every merge to 8 Nov 11:03 UTC, among them the Roman homes' rooms and the wall plate, the elders' staffs and their walk, the long cloak weighted to the legs, the braids on the cloak, the farms' hens and herds, the lair reloaded as a lair, and the fire orb's ward), every view held within two calls at every level: Dunmore's street at noon 727 → 725 at Middle, at midnight 803 → 802; the field west at noon 645 → 644 and at dawn 788 → 787 (each the other column −1, and a body fewer at noon in the street); Portclare's square 522 → 523 (Low 356 → 357, 682k → 693k triangles, +1.6%, the one triangle move over 0.3%); the inn's hall 34 → 34; the medium gate 102 → 102. The farms' stock stands in none of these views (the field west is not a farm's), and the rooms and the plate are behind doors. No spot rose by more than 10%. Dunmore at midnight at Low is 625 of its 700 calls: 75 left.*

### s1404 — 2026-11-09 13:10 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 584 | 1.08 M | 0 | 0 | 107 | 120 | 253 | 104 | Mesh 46, oldGate 20, wayside carriage 13, sea cave mouth 8, cave mouth 7 |
| Dunmore street, noon | Middle | 739 | 1.82 M | 136 | 6 | 108 | 120 | 265 | 104 | Mesh 46, oldGate 20, wayside carriage 13, sea cave mouth 8, cave mouth 7 |
| Dunmore street, noon | High | 789 | 2.30 M | 168 | 6 | 108 | 120 | 283 | 104 | Mesh 46, oldGate 20, wayside carriage 13, sea cave mouth 8, cave mouth 7 |
| Dunmore street, midnight | Low | 639 | 1.05 M | 0 | 0 | 105 | 176 | 253 | 105 | Mesh 46, oldGate 20, wayside carriage 13, sea cave mouth 8, cave mouth 7 |
| Dunmore street, midnight | Middle | 816 | 1.77 M | 159 | 6 | 105 | 176 | 265 | 105 | Mesh 46, oldGate 20, wayside carriage 13, sea cave mouth 8, cave mouth 7 |
| Dunmore street, midnight | High | 877 | 2.31 M | 202 | 6 | 105 | 176 | 283 | 105 | Mesh 46, oldGate 20, wayside carriage 13, sea cave mouth 8, cave mouth 7 |
| the field west of Dunmore, noon | Low | 537 | 627k | 0 | 0 | 105 | 107 | 281 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | Middle | 645 | 1.05 M | 83 | 6 | 105 | 107 | 300 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | High | 692 | 1.51 M | 122 | 6 | 105 | 107 | 308 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Low | 620 | 618k | 0 | 0 | 108 | 186 | 281 | 45 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Middle | 788 | 1.10 M | 143 | 6 | 108 | 186 | 300 | 45 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | High | 840 | 1.62 M | 187 | 6 | 108 | 186 | 308 | 45 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| Portclare square, noon | Low | 369 | 702k | 0 | 0 | 29 | 60 | 192 | 88 | Mesh 31, oldGate 14, wayside carriage 13, cave mouth 8, sea cave mouth 8 |
| Portclare square, noon | Middle | 535 | 1.40 M | 144 | 6 | 29 | 60 | 208 | 88 | Mesh 31, oldGate 14, wayside carriage 13, cave mouth 8, sea cave mouth 8 |
| Portclare square, noon | High | 581 | 1.74 M | 179 | 6 | 29 | 60 | 219 | 88 | Mesh 31, oldGate 14, wayside carriage 13, cave mouth 8, sea cave mouth 8 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 34 | 26k | 0 | 0 | 1 | 0 | 0 | 33 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |

*s1404, QA Session 2039 (`budget` 8/8 in 453 s and `budgetport` 9/9 in 522 s, one try each, run in series by `run.mjs budget budgetport --no-retry` on four cores with no other boot). Against s1368, 36 builds later (every merge to 9 Nov 12:14 UTC, among them the places by a road (the overturned coach, the hunters' and charcoal burners' camps, the locked cellar, the perched stone), the Mark's town houses, water B and cooking B, the cloak's hem bones and the house roofs keyed by lot), every view rose by 1–14 calls and no triangle count moved by more than 1.3%. The rise is one thing: a `wayside carriage`, the overturned coach (S2007), stands in view of Dunmore's street and of Portclare's square at 13 draws (the other column +14 and +13). Dunmore's street at noon 725 → 739 at Middle (+1.9%), at midnight 802 → 816 (+1.7%); the field west 644 → 645 and 787 → 788 (no coach in view; the other column +1); Portclare's square 523 → 535 (+2.3%; Low 357 → 369, +3.4%, the largest rise, and a body fewer); the inn's hall 34 → 34; the medium gate 102 → 102. No spot rose by more than 10%. Dunmore at midnight at Low is 639 of its 700 calls: 61 left (75 at s1368), and one more coach-sized place in that view would take 13 of them.*

### s1430 — 2026-11-10 07:02 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 615 | 1.12 M | 0 | 0 | 107 | 120 | 253 | 135 | Mesh 46, offroad shepherd 32, oldGate 20, wayside carriage 13, sea cave mouth 8 |
| Dunmore street, noon | Middle | 770 | 1.86 M | 136 | 6 | 108 | 120 | 265 | 135 | Mesh 46, offroad shepherd 32, oldGate 20, wayside carriage 13, sea cave mouth 8 |
| Dunmore street, noon | High | 820 | 2.34 M | 168 | 6 | 108 | 120 | 283 | 135 | Mesh 46, offroad shepherd 32, oldGate 20, wayside carriage 13, sea cave mouth 8 |
| Dunmore street, midnight | Low | 670 | 1.08 M | 0 | 0 | 105 | 176 | 253 | 136 | Mesh 46, offroad shepherd 32, oldGate 20, wayside carriage 13, sea cave mouth 8 |
| Dunmore street, midnight | Middle | 847 | 1.80 M | 159 | 6 | 105 | 176 | 265 | 136 | Mesh 46, offroad shepherd 32, oldGate 20, wayside carriage 13, sea cave mouth 8 |
| Dunmore street, midnight | High | 908 | 2.34 M | 202 | 6 | 105 | 176 | 283 | 136 | Mesh 46, offroad shepherd 32, oldGate 20, wayside carriage 13, sea cave mouth 8 |
| the field west of Dunmore, noon | Low | 536 | 627k | 0 | 0 | 105 | 107 | 281 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | Middle | 644 | 1.05 M | 83 | 6 | 105 | 107 | 300 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | High | 691 | 1.51 M | 122 | 6 | 105 | 107 | 308 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Low | 619 | 618k | 0 | 0 | 108 | 186 | 281 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Middle | 787 | 1.10 M | 143 | 6 | 108 | 186 | 300 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | High | 839 | 1.62 M | 187 | 6 | 108 | 186 | 308 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |

### s1430 — 2026-11-10 07:11 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 401 | 734k | 0 | 0 | 29 | 60 | 192 | 120 | offroad shepherd 32, Mesh 31, oldGate 14, wayside carriage 13, cave mouth 8 |
| Portclare square, noon | Middle | 567 | 1.44 M | 144 | 6 | 29 | 60 | 208 | 120 | offroad shepherd 32, Mesh 31, oldGate 14, wayside carriage 13, cave mouth 8 |
| Portclare square, noon | High | 613 | 1.77 M | 179 | 6 | 29 | 60 | 219 | 120 | offroad shepherd 32, Mesh 31, oldGate 14, wayside carriage 13, cave mouth 8 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 34 | 26k | 0 | 0 | 1 | 0 | 0 | 33 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |

*s1430, QA Session 2060 (`budget` 8/8 in 474 s and `budgetport` 9/9 in 566 s, one try each, run in series by `BUDGET_LEDGER=1 run.mjs budget budgetport --no-retry` on four cores with no other boot). Against s1404, 26 builds later (every merge to 10 Nov 06:24 UTC, among them the places off the road (the shepherd's hut, the peat camp, the Mark's cabin, logging camp and unfinished camp), the coach's lacquer and lamp, the long-cloaked foes' hem bones, the fed ×10 and *Under Another Flag*), the two towns' views rose and the field west and the indoor spots did not move. The rise is one thing: two `offroad shepherd` huts, 2,504 and 2,646 m from Dunmore's centre, 16 meshes and 17–18k triangles each, are drawn whole from both towns (the other column +31 and +32). Dunmore's street at noon 739 → 770 at Middle (+4.2%), at midnight 816 → 847 (+3.8%; Low 639 → 670, +4.9%); the field west 645 → 644 and 788 → 787; Portclare's square 535 → 567 (+6.0%; Low 369 → 401, +8.7%, the largest rise; 702k → 734k triangles, +4.6%); the inn's hall 34 → 34; the medium gate 102 → 102. No spot rose by more than 10%. Dunmore at midnight at Low is 670 of its 700 calls: 30 left (61 at s1404). A place off the road has no draw distance: one more hut-sized place in view of Dunmore takes half of what is left.*

### s1441 — 2026-11-10 13:01 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 572 | 1.08 M | 0 | 0 | 107 | 120 | 254 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, noon | Middle | 728 | 1.81 M | 136 | 6 | 109 | 120 | 266 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, noon | High | 778 | 2.29 M | 168 | 6 | 109 | 120 | 284 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | Low | 627 | 1.04 M | 0 | 0 | 105 | 176 | 254 | 92 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | Middle | 805 | 1.75 M | 160 | 6 | 105 | 176 | 266 | 92 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | High | 865 | 2.29 M | 202 | 6 | 105 | 176 | 284 | 92 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| the field west of Dunmore, noon | Low | 537 | 624k | 0 | 0 | 105 | 107 | 281 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | Middle | 645 | 1.04 M | 83 | 6 | 105 | 107 | 300 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | High | 692 | 1.51 M | 122 | 6 | 105 | 107 | 308 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Low | 620 | 615k | 0 | 0 | 108 | 186 | 281 | 45 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Middle | 788 | 1.10 M | 143 | 6 | 108 | 186 | 300 | 45 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | High | 840 | 1.62 M | 187 | 6 | 108 | 186 | 308 | 45 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |

### s1441 — 2026-11-10 13:08 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 355 | 690k | 0 | 0 | 28 | 60 | 192 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| Portclare square, noon | Middle | 522 | 1.40 M | 144 | 6 | 29 | 60 | 208 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| Portclare square, noon | High | 568 | 1.73 M | 179 | 6 | 29 | 60 | 219 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 34 | 26k | 0 | 0 | 1 | 0 | 0 | 33 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |

*s1441, QA Session 2068 (`budget` 8/8 in 415 s and `budgetport` 9/9 in 373 s, one try each, run in series by `BUDGET_LEDGER=1 run.mjs budget budgetport --no-retry` on four cores with no other boot). Against s1430, 11 builds later (every merge to 10 Nov 11:42 UTC, among them Look 2063's `placesFar` and Look 2065's expedition). The towns fell 42–45 calls and the field, the inn and the gate held within one: the two shepherd's huts (32 calls) and the wayside carriage (13) are gone from both towns' views, hidden past 450 m by `placesFar`. No expedition is in view of any spot. Dunmore at midnight at Low is 627 of 700, 73 left (30 at s1430, 61 at s1404).*

### s1448 — 2026-11-10 19:01 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 570 | 1.07 M | 0 | 0 | 107 | 120 | 253 | 90 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, noon | Middle | 725 | 1.81 M | 136 | 6 | 108 | 120 | 265 | 90 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, noon | High | 775 | 2.29 M | 168 | 6 | 108 | 120 | 283 | 90 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | Low | 625 | 1.04 M | 0 | 0 | 105 | 176 | 253 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | Middle | 803 | 1.75 M | 160 | 6 | 105 | 176 | 265 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | High | 863 | 2.29 M | 202 | 6 | 105 | 176 | 283 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| the field west of Dunmore, noon | Low | 536 | 624k | 0 | 0 | 105 | 107 | 281 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | Middle | 644 | 1.04 M | 83 | 6 | 105 | 107 | 300 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | High | 691 | 1.51 M | 122 | 6 | 105 | 107 | 308 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Low | 619 | 615k | 0 | 0 | 108 | 186 | 281 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Middle | 787 | 1.10 M | 143 | 6 | 108 | 186 | 300 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | High | 839 | 1.62 M | 187 | 6 | 108 | 186 | 308 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |

### s1448 — 2026-11-10 19:09 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 355 | 690k | 0 | 0 | 28 | 60 | 192 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| Portclare square, noon | Middle | 521 | 1.39 M | 144 | 6 | 28 | 60 | 208 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| Portclare square, noon | High | 568 | 1.73 M | 179 | 6 | 29 | 60 | 219 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 34 | 26k | 0 | 0 | 1 | 0 | 0 | 33 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |

*s1448, QA Session 2078 (`budget` 8/8 in 447 s and `budgetport` 9/9 in 451 s, one try each, run in series by `BUDGET_LEDGER=1 run.mjs budget budgetport --no-retry` on four cores with no other boot). Against s1441, 7 builds later (every merge to 10 Nov 18:16 UTC, among them Look 2069–2076's falls kit, the snowed snowpine and the hut's bracken, and Bodies 2070's cloak). Flat: every spot within 3 calls and 1% of its triangles (Dunmore noon at Middle 728 → 725, midnight 805 → 803, Portclare 522 → 521, the field 645 → 644, the inn 34 and the gate 102 the same). Land fell one call at Low and Middle in both towns' views. No falls, merchants' camp or expedition is in any spot's list. Dunmore at midnight at Low is 625 of 700, 75 left.*

### s1458 — 2026-11-11 01:00 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 571 | 1.08 M | 0 | 0 | 107 | 120 | 253 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, noon | Middle | 726 | 1.81 M | 136 | 6 | 108 | 120 | 265 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, noon | High | 776 | 2.29 M | 168 | 6 | 108 | 120 | 283 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | Low | 626 | 1.04 M | 0 | 0 | 105 | 176 | 253 | 92 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | Middle | 803 | 1.76 M | 159 | 6 | 105 | 176 | 265 | 92 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | High | 864 | 2.30 M | 202 | 6 | 105 | 176 | 283 | 92 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| the field west of Dunmore, noon | Low | 536 | 624k | 0 | 0 | 105 | 107 | 281 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | Middle | 644 | 1.04 M | 83 | 6 | 105 | 107 | 300 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | High | 691 | 1.51 M | 122 | 6 | 105 | 107 | 308 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Low | 619 | 615k | 0 | 0 | 108 | 186 | 281 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Middle | 787 | 1.10 M | 143 | 6 | 108 | 186 | 300 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | High | 839 | 1.62 M | 187 | 6 | 108 | 186 | 308 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |

### s1458 — 2026-11-11 01:06 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 355 | 690k | 0 | 0 | 28 | 60 | 192 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| Portclare square, noon | Middle | 522 | 1.39 M | 144 | 6 | 29 | 60 | 208 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| Portclare square, noon | High | 568 | 1.73 M | 179 | 6 | 29 | 60 | 219 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 34 | 26k | 0 | 0 | 1 | 0 | 0 | 33 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |

*s1458, QA Session 2086 (`budget` 8/8 in 387 s and `budgetport` 9/9 in 359 s, one try each, run in series by `BUDGET_LEDGER=1 run.mjs budget budgetport --no-retry` on four cores with no other boot). Against s1448, 10 builds later (every merge to 10 Nov 23:13 UTC, among them Look 2083's second chance, which draws five merchants' camps and four falls on the Gatelands, Systems 2084's falls sound and 2085's beds by grade, Look 2079–2081's peat camp and cabin lights, Bodies 2082's Gaoth gargoyle). Flat: every spot within 1 call and 1% of its triangles (Dunmore noon at Middle 725 → 726, midnight 803 → 803, Portclare 521 → 522, the field 644, the inn 34 and the gate 102 the same). The "other" column's lists are unchanged at every spot: the new camps and falls stand past `placesFar`'s 450 m from all of them. Dunmore at midnight at Low is 626 of 700, 74 left.*

### s1468 — 2026-11-11 07:03 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Dunmore street, noon | Low | 573 | 1.08 M | 0 | 0 | 108 | 120 | 254 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, noon | Middle | 727 | 1.81 M | 136 | 6 | 108 | 120 | 266 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, noon | High | 777 | 2.29 M | 168 | 6 | 108 | 120 | 284 | 91 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | Low | 627 | 1.04 M | 0 | 0 | 105 | 176 | 254 | 92 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | Middle | 805 | 1.76 M | 160 | 6 | 105 | 176 | 266 | 92 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| Dunmore street, midnight | High | 865 | 2.30 M | 202 | 6 | 105 | 176 | 284 | 92 | Mesh 46, oldGate 20, sea cave mouth 8, cave mouth 7, weaver door 4 |
| the field west of Dunmore, noon | Low | 536 | 624k | 0 | 0 | 105 | 107 | 281 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | Middle | 644 | 1.04 M | 83 | 6 | 105 | 107 | 300 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, noon | High | 691 | 1.51 M | 122 | 6 | 105 | 107 | 308 | 43 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Low | 635 | 667k | 0 | 0 | 124 | 186 | 281 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | Middle | 787 | 1.10 M | 143 | 6 | 108 | 186 | 300 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |
| the field west of Dunmore, dawn | High | 839 | 1.62 M | 187 | 6 | 108 | 186 | 308 | 44 | Mesh 28, oldGate 4, cave mouth 4, Group 4, quaywall 2 |

### s1468 — 2026-11-11 07:12 UTC

| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |
|---|---|---|---|---|---|---|---|---|---|---|
| Portclare square, noon | Low | 357 | 695k | 0 | 0 | 30 | 60 | 192 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| Portclare square, noon | Middle | 523 | 1.39 M | 144 | 6 | 30 | 60 | 208 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| Portclare square, noon | High | 570 | 1.73 M | 179 | 6 | 31 | 60 | 219 | 75 | Mesh 31, oldGate 14, cave mouth 8, sea cave mouth 8, Group 6 |
| The Bramble Hearth (Dunmore's inn), the hall from the door, 20h | Middle (indoors) | 34 | 26k | 0 | 0 | 1 | 0 | 0 | 33 |  |
| a medium gate (ruins, seed 11), from its entrance | Middle (indoors) | 102 | 394k | 0 | 0 | 33 | 0 | 0 | 68 |  |
