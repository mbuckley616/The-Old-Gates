// The budgets, the rest (Session 1297, QA; `budget` and `budgetfield` hold Dunmore's four views, `budget` says what is counted and how). Portclare's square
// at noon, the build sheet's fifth view and the critic's worst spot, at each quality level against its ceilings.
// S2249: each row also counts the frame with every body hidden (the place's own calls and triangles, the ledger's last column), which
// does not swing with whether a townsperson stands near when the count is taken; the ceilings still read the whole frame.
// S2615: the two indoor spots for the ledger (Dunmore's inn and a medium gate) went to their own suite, `budgetindoor`: with them this
// suite ran 666 s on a good runner and was killed at run.mjs's 900 s cap on CI (45412620274, the first try at 900 s, the retry 897 s).
import { boot, check } from './lib/game.mjs';
import { budgetKit, budgetEnd, LEVELS } from './budgetkit.mjs';
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();
const { measure, stand, setLevel, count } = budgetKit(g);
const rows = [];
check('Portclare stands on the new look', await g.settle('portclare'));
const P = await page.evaluate(() => { const S = WORLD.settle.get('portclare'); return { x: S.site.x, z: S.site.z }; });
await stand(P.x, P.z + 4, 0, 12);
for (const [name, n] of LEVELS) { await setLevel(n); rows.push(await measure('Portclare square, noon', name)); }
check('no page errors', g.errs.length === 0, g.errs);
await budgetEnd(g, rows, 1);
await g.close();
