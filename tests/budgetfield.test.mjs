// The budgets, the field (Session 2360, QA; split from `budget`, which says what is counted and how, when its four views together ran
// into run.mjs's 900 s cap alone at s1692: backlog K's rule, a second file, not a longer cap). The build sheet's field view: 160 m west
// of Dunmore's centre looking west, at noon and at dawn, at each quality level against its ceilings (tests/budgetkit.mjs).
import { boot, check } from './lib/game.mjs';
import { budgetKit, budgetEnd, LEVELS } from './budgetkit.mjs';
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();
const { measure, stand, setLevel } = budgetKit(g);
const rows = [];
check('Dunmore stands on the new look', await g.settle('dunmore'));
const D = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); return { x: S.site.x, z: S.site.z }; });
for (const [spot, x, z, ry, hours] of [['the field west of Dunmore', D.x - 160, D.z, -Math.PI / 2, [[12, 'noon'], [6, 'dawn']]]]) {
  for (const [i, [h, when]] of hours.entries()) {
    if (i === 0) await stand(x, z, ry, h); else { await page.evaluate(h => forceTime(h), h); await g.spin(null, 120); }
    for (const [name, n] of LEVELS) { await setLevel(n); rows.push(await measure(`${spot}, ${when}`, name)); }
    await setLevel(1); } }
check('no page errors', g.errs.length === 0, g.errs);
await budgetEnd(g, rows, 2);
await g.close();
