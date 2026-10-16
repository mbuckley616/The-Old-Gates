# The new look's suite — QA's ledger

Every suite under `node tests/run.mjs --look=new` (2.0's first condition, `docs/design/v2-scope.md`): its old-look result on CI, its new-look
result here, the cause of any failure and its owner. Run by shard of 14 (`--shard=k/14`), two shards side by side on a 4-core cloud container.
Started 15 Oct 2026 (QA run of 18:51 UTC, main 0773903 plus Sessions 946–949). Old look: every suite here passed on main's CI run
38768168884 (f031a36, 15 Oct).

| Suite | Shard | Old look (CI) | New look | Seconds | Cause, owner |
|---|---|---|---|---|---|
| `backslot` | 1/14 | pass | pass | 42 |  |
| `barber` | 1/14 | pass | pass | 109 |  |
| `barberbox` | 2/14 | pass | pass | 81 |  |
| `bear` | 1/14 | pass | pass | 46 |  |
| `bridgenames` | 2/14 | pass | pass | 104 |  |
| `calendar` | 1/14 | pass | pass | 85 |  |
| `cloakguild` | 1/14 | pass | pass | 44 |  |
| `coachseat` | 2/14 | pass | pass | 102 |  |
| `coldhearth` | 2/14 | pass | pass | 101 |  |
| `coopsaves` | 1/14 | pass | pass | 124 |  |
| `counters` | 2/14 | pass | pass | 42 |  |
| `crime5` | 2/14 | pass | pass | 66 |  |
| `datedwork` | 1/14 | pass | pass | 42 |  |
| `dazed` | 2/14 | pass | pass | 90 |  |
| `dungeonexit` | 1/14 | pass | pass | 124 |  |
| `export` | 1/14 | pass | pass | 51 |  |
| `ferry` | 1/14 | pass | pass | 57 |  |
| `foes` | 1/14 | pass | pass | 71 |  |
| `fortunecaor` | 1/14 | pass | pass | 44 |  |
| `gateblade` | 1/14 | pass | pass | 54 |  |
| `gateschool` | 2/14 | pass | pass | 54 |  |
| `ghoulface` | 1/14 | pass | pass | 20 |  |
| `herbids` | 2/14 | pass | pass | 61 |  |
| `hoardmetal` | 2/14 | pass | pass | 49 |  |
| `hptail` | 2/14 | pass | pass | 65 |  |
| `hubregen` | 2/14 | pass | pass | 42 |  |
| `investlacks` | 2/14 | pass | pass | 73 |  |
| `ironwork` | 2/14 | pass | pass | 89 |  |
| `keeperwalk` | 1/14 | pass | pass | 640 |  |
| `lairhoard` | 1/14 | pass | pass | 70 |  |
| `lairtheme` | 2/14 | pass | pass | 136 |  |
| `legacyfoes` | 2/14 | pass | pass | 46 |  |
| `legacyshells` | 2/14 | pass | pass | 60 |  |
| `lockpicks` | 1/14 | pass | pass | 85 |  |
| `locks` | 1/14 | pass | pass | 127 |  |
| `locksight` | 2/14 | pass | pass | 87 |  |
| `mushrooms` | 1/14 | pass | pass | 112 |  |
| `names` | 1/14 | pass | pass | 97 |  |
| `panelfocus` | 2/14 | pass | **red** | 900 | Timed out at the 900 s suite cap; four `locator.click` timeouts of 8 s in its panel walk. Two shards shared four cores, and the suite takes 270–546 s on CI's old look. Not yet classified: owed a run alone, both looks, next QA run. |
| `people` | 2/14 | pass | pass | 188 |  |
| `plants` | 2/14 | pass | pass | 79 |  |
| `portlane` | 1/14 | pass | pass | 222 |  |
| `qtybutton` | 2/14 | pass | pass | 76 |  |
| `questfoes` | 2/14 | pass | pass | 275 |  |
| `ragdoll` | 2/14 | pass | pass | 160 |  |
| `register` | 2/14 | pass | pass | 70 |  |
| `riversail` | 1/14 | pass | pass | 62 |  |
| `saves` | 2/14 | pass | pass | 76 |  |
| `seahint` | 1/14 | pass | pass | 44 |  |
| `seasonwx` | 2/14 | pass | pass | 37 |  |
| `shark` | 2/14 | pass | pass | 43 |  |
| `shoperrands` | 1/14 | pass | pass | 167 |  |
| `shophours` | 1/14 | pass | pass | 105 |  |
| `signs` | 2/14 | pass | pass | 62 |  |
| `snowrepaint` | 1/14 | pass | pass | 68 |  |
| `spiders` | 1/14 | pass | pass | 49 |  |
| `stonecress` | 2/14 | pass | pass | 40 |  |
| `tells` | 2/14 | pass | pass | 40 |  |
| `twins` | 1/14 | pass | pass | 81 |  |
| `warwords` | 1/14 | pass | pass | 69 |  |
| `waylamp` | 1/14 | pass | pass | 112 |  |
| `witnessrange` | 1/14 | pass | pass | 68 |  |

Shards 3–14: owed. Shards 1 and 2: 61 of 62 pass.
