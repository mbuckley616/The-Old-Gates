// The budgets, the rest (Session 1297, QA; `budget` holds Dunmore's four views and says what is counted and how). Portclare's square
// at noon, the build sheet's fifth view and the critic's worst spot, at each quality level against its ceilings; then two spots for
// the ledger only, at Middle, since the ceilings are the world's: Dunmore's inn from its door at 20h, and a medium gate (ruins, seed
// 11) from its entrance.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
import { budgetKit, budgetEnd, LEVELS } from './budgetkit.mjs';
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();
const { measure, stand, setLevel, count } = budgetKit(g);
const rows = [];
check('Portclare stands on the new look', await g.settle('portclare'));
const P = await page.evaluate(() => { const S = WORLD.settle.get('portclare'); return { x: S.site.x, z: S.site.z }; });
await stand(P.x, P.z + 4, 0, 12);
for (const [name, n] of LEVELS) { await setLevel(n); rows.push(await measure('Portclare square, noon', name)); }
await setLevel(1);

await g.settle('dunmore');
const inn = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), h = S.houses.find(h => h.type === 'inn'); if (!h) return null; forceTime(20); px = h.exitX; pz = h.exitZ; goToInterior(h); return h.name; });
for (let k = 0; k < 120 && inn && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
const inside = !!inn && await page.evaluate(() => isInterior());
if (inside) { await g.frames(4); rows.push(await measure(`${inn} (Dunmore's inn), the hall from the door, 20h`, 'Middle (indoors)'));
  await page.evaluate(() => exitInterior()); await page.waitForFunction(() => currentHouse == null, null, { timeout: 60000 }); await g.frames(2); await g.hide(); }
// S1684 — the gate's cosmetic rolls (rubble heaps, wall torches and their flames, a floor's odd pieces) are Math.random, as the co-op
// rules allow, so the same seed drew 222 to 281 top-level pieces in four boots of one build. For the ledger's one fixed spot, its build
// runs on a seeded stream: buildDungeon is wrapped for this one call, and Math.random is the game's own again as soon as it returns.
await page.evaluate(() => { const B = buildDungeon; window.buildDungeon = function (...a) { let t = 1684 >>> 0; const R = Math.random;
  Math.random = () => { t = (t + 0x6D2B79F5) >>> 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
  try { return B.apply(this, a); } finally { Math.random = R; window.buildDungeon = B; } }; });
const dg = await enterDungeon(page, { theme: 'ruins', seed: 11, size: 'medium' });
// S1684 — the gate's count climbs for its first frames (268, then 277 ten frames on, Session 1684's probe): wait until two counts
// ten frames apart agree, so the ledger reads the floor as built, not a frame of it half-built (s1093's two boots read 280 and 242)
let gc = -1, steady = false; for (let k = 0; k < 12 && !steady; k++) { await g.frames(10); const c = (await count()).calls; steady = c === gc; gc = c; }
console.log(`  the gate's count steady: ${steady} at ${gc}`);
rows.push(await measure('a medium gate (ruins, seed 11), from its entrance', 'Middle (indoors)'));
check('the inn and the gate were counted, and drew', inside && rows.length === 5 && rows.slice(3).every(r => r.calls > 0), { inn, inside, gate: dg, steady, calls: rows.slice(3).map(r => r.calls) });
check('no page errors', g.errs.length === 0, g.errs);
await budgetEnd(g, rows, 1);
await g.close();
