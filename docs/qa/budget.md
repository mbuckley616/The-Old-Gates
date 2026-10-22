# The budgets — QA's ledger

Draw calls and triangles at fixed spots, one table a QA run, written by `tests/budget.test.mjs` (`BUDGET_LEDGER=1 node tests/run.mjs
budget`). The ceilings are `docs/design/streaming-and-quality-build.md`'s ("The ceilings", from v2-scope.md §5), counted on the world's
frame by `REN.info`, the sun's shadow pass and the bloom's passes included:

| Level | Draw calls | Triangles |
|---|---|---|
| Low | 700 | 1.2 M |
| Middle | 1,000 | 2.0 M |
| High | 1,300 | 4.0 M |

The five views are the build sheet's: Dunmore's street (from the site's centre, 4 m south, looking north) and the field 160 m west of it
(looking west) at noon, the field at dawn (6h), the street at midnight, and Portclare's square at noon. The inn's hall (Dunmore's inn
from its door, 20h) and a gate's floor (a medium ruins gate, seed 11, from its entrance) are counted at Middle for the ledger; the
ceilings are the world's. A count is the median of three frames, a spread of a few calls being the townsfolk walking.

The columns: **Shadow**, the sun's pass (the frame less the same frame without it; Low draws no shadow); **Post**, the bloom's passes
(Middle and High); **Bodies**, **Houses**, **Land** and **Other**, the eye's calls by what draws them, counted as the renderer culls (a
mesh in the camera's frustum, one call a material group), so they come near the eye's own count but are not it. Bodies are anything
under a rig or a builder body; houses what a settlement's group holds; land what a chunk's group holds (terrain, trees, grass, roads);
other is the rest, its largest top-level parents named in the last column.

Frame rate is not measured here: software GL is not a target machine. It is Michael's reading on his laptop at F14. A rise of more than
10% at any spot from the run before goes in QA's Slack post's *Need* line for the producer.
