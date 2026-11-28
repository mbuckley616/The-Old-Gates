// The budgets (Session 1297, QA; v2-scope.md §5 and docs/design/streaming-and-quality-build.md, "The ceilings"): draw calls and
// triangles counted by REN.info on the frame the game draws (REN.render(scene, CAM): the sun's shadow pass and the bloom's passes
// included), at each quality level, against that level's ceilings (Low 700 calls and 1.5 M triangles, Middle 1,000 and 2.4 M since S2749 by #2125 C, High
// 1,300 and 4.0 M). This suite holds two of the build sheet's five views: Dunmore's street at noon and at midnight; `budgetfield`
// holds the field 160 m west of it at noon and at dawn, and `budgetport` the fifth, Portclare's square at noon, and the ledger's indoor
// spots. S2360: the field went to its own file (backlog K's rule) when the four views together ran into run.mjs's 900 s cap alone.
// Each count is split by kind for the builders (the shadow pass, the bloom's passes, the eye's calls by bodies, houses, land and the
// rest; tests/budgetkit.mjs). The camera stands at a fixed spot looking a fixed way. Frame rate is not measured: software GL is not a
// target machine. BUDGET_LEDGER=1 appends the table to docs/qa/budget.md; QA's run does that, CI does not.
// S2249: each row also counts the frame with every body hidden (the place's own calls and triangles, the ledger's last column), which
// does not swing with whether a townsperson stands near when the count is taken; the ceilings still read the whole frame.
import { boot, check } from './lib/game.mjs';
import { budgetKit, budgetEnd, LEVELS } from './budgetkit.mjs';
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();
const { measure, stand, setLevel } = budgetKit(g);
const rows = [];
check('Dunmore stands on the new look', await g.settle('dunmore'));
const D = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); return { x: S.site.x, z: S.site.z }; });
// one spot, two hours: the street from 4 m south of the site's centre looking north (the field is `budgetfield`'s)
for (const [spot, x, z, ry, hours] of [['Dunmore street', D.x, D.z + 4, 0, [[12, 'noon'], [0, 'midnight']]]]) {
  for (const [i, [h, when]] of hours.entries()) {
    if (i === 0) await stand(x, z, ry, h); else { await page.evaluate(h => forceTime(h), h); await g.spin(null, 120); }
    for (const [name, n] of LEVELS) { await setLevel(n); rows.push(await measure(`${spot}, ${when}`, name)); }
    await setLevel(1); } }
check('no page errors', g.errs.length === 0, g.errs);
await budgetEnd(g, rows, 2);
await g.close();
