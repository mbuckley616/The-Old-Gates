// The budgets (Session 1297, QA; v2-scope.md §5 and docs/design/streaming-and-quality-build.md, "The ceilings"): draw calls and
// triangles counted by REN.info on the frame the game draws (REN.render(scene, CAM): the sun's shadow pass and the bloom's passes
// included), at each quality level, against that level's ceilings (Low 700 calls and 1.2 M triangles, Middle 1,000 and 2.0 M, High
// 1,300 and 4.0 M). This suite holds four of the build sheet's five views: Dunmore's street at noon and at midnight, and the field
// 160 m west of it at noon and at dawn; `budgetport` holds the fifth, Portclare's square at noon, and the ledger's indoor spots.
// Each count is split by kind for the builders (the shadow pass, the bloom's passes, the eye's calls by bodies, houses, land and the
// rest; tests/budgetkit.mjs). The camera stands at a fixed spot looking a fixed way. Frame rate is not measured: software GL is not a
// target machine. BUDGET_LEDGER=1 appends the table to docs/qa/budget.md; QA's run does that, CI does not.
import { boot, check } from './lib/game.mjs';
import { budgetKit, budgetEnd, LEVELS } from './budgetkit.mjs';
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();
const { measure, stand, setLevel } = budgetKit(g);
const rows = [];
check('Dunmore stands on the new look', await g.settle('dunmore'));
const D = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); return { x: S.site.x, z: S.site.z }; });
// two spots, two hours each: the street from 4 m south of the site's centre looking north, the field 160 m west looking west
for (const [spot, x, z, ry, hours] of [['Dunmore street', D.x, D.z + 4, 0, [[12, 'noon'], [0, 'midnight']]], ['the field west of Dunmore', D.x - 160, D.z, -Math.PI / 2, [[12, 'noon'], [6, 'dawn']]]]) {
  for (const [i, [h, when]] of hours.entries()) {
    if (i === 0) await stand(x, z, ry, h); else { await page.evaluate(h => forceTime(h), h); await g.spin(null, 120); }
    for (const [name, n] of LEVELS) { await setLevel(n); rows.push(await measure(`${spot}, ${when}`, name)); }
    await setLevel(1); } }
check('no page errors', g.errs.length === 0, g.errs);
await budgetEnd(g, rows, 4);
await g.close();
