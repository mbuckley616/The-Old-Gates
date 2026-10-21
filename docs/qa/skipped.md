# Skipped suites — QA's cards

Every suite boots the new look (Michael, 20 Oct 2026: "I DO NOT CARE about preserving the legacy"). A suite that was red or too
slow there is named in `tests/skip.json` and runs nowhere until it is fixed. Each row is a card: fix the game or the suite (or
delete the suite with its feature, if the feature was the old look's), strike the suite from `tests/skip.json` in the same PR, and
strike the row here. That PR runs the suite. Kept by the QA routine; started by Session 1226 from CI's full run of #529 at 67c6fd2d on the new look (20 Oct 2026, run 39484346294: 519 suites, 495 passed, 4 passed on the retry), three suites killed at the 900 s a suite is given on #443's run at 2ff39f31, and foewarm, red twice on #529 at 85a8ff00.
`node tests/run.mjs <suite>` runs a skipped suite by name.

| Suite | Why it is skipped | Card |
|---|---|---|
| `autumn` | red: in a real autumn chunk at least four of the kinds stand, and every one of their trees is still warm under the chunk's tint | open |
| `bridgenames` | red: 16 bridges built in ten cells, each named *… Bridge* | open |
| `civicfurn` | red: the church is one bake with the altar's candle flames, 5–60k triangles, and none of the old cylinder pillars | open |
| ~~`f4people`~~ | ~~red: vendor/people.builder.js is what people.js makes now (python3 scripts/people_bundle.py)~~ | fixed, Session 1241 (rebundled; 13/13 on the new look) |
| `falls` | too slow: killed at the 900 s a suite is given (1800 s with the retry) | open |
| `fistfight` | too slow: killed at the 900 s a suite is given (1744 s with the retry) | open |
| `foewarm` | red: raising every foe kind compiles no shader and adds no program (8 compiled, 4 programs added, on #529 at 85a8ff00, failed twice; it passed at 67c6fd2d, and #443 had it red on the new look) | open |
| `guildfurn` | red: guild_f: the hall is one bake of 15–90k triangles, with the notice board, four dormitory chests and the gallery's chest (Session 293) beside it, and no cylinders left | open |
| `hourhitch` | too slow: killed at the 900 s a suite is given (1800 s with the retry) | open |
| `lookpair` | red: the old look is r128 and the new one 0.170, at the same spot | open |
| `mainrun` | too slow: killed at the 900 s a suite is given (1800 s with the retry) | open |
| `panelfocus` | too slow: killed at the 900 s a suite is given (900 s with the retry) | open |
| `penance` | red: a lock picked under a witness's eye: favour −1, a point owed, a 25-gold fine | open |
| `placesave` | red: across prosperity swings of 13 and 26 in four towns, no house id moves to another lot | open |
| `renewal` | too slow: killed at the 900 s a suite is given (900 s with the retry) | open |
| `scaleratio` | red: dunmore (gatelands): every house door is 1.1 to 1.25 of a 1.8 m person (55 doors measured) | open |
| `signs` | red: dunmore: every shop, inn, church and guild hall has one board, reading its own name | open |
| `skirtlegs` | red: page.evaluate: TypeError: mesh.boneTransform is not a function | open |
| `theft` | red: a seen theft is fined 50 and the goods’ value (coins and the thing taken) (failed once; the retry was skipped for the shard's time) | open |
| `wanderface` | red: a wandering foe's body faces the way it walks (within 0.25 rad, sampled every half second for 6 s) | open |
| `yardplay` | too slow: killed at the 900 s a suite is given (1800 s with the retry) | open |
