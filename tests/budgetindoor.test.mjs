// The budgets indoors, for the ledger only (Session 2614, QA; split from `budgetport`, Session 1297, which ran 666 s with these two
// and was killed at run.mjs's 900 s cap on CI, 45412620274). Two spots at Middle, the level a real machine plays at: Dunmore's inn,
// the hall from its door at 20h, and a medium gate (ruins, seed 11) from its entrance. The ceilings are the world's (`budget`,
// `budgetfield`, `budgetport`): nothing here is held to them, the rows go to docs/qa/budget.md with the others.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
import { budgetKit, budgetEnd } from './budgetkit.mjs';
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();
const { measure, setLevel, count } = budgetKit(g);
const rows = [];
await setLevel(1);
check('Dunmore stands on the new look', await g.settle('dunmore'));
const inn = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), h = S && S.houses.find(h => h.type === 'inn'); if (!h) return null; forceTime(20); px = h.exitX; pz = h.exitZ; goToInterior(h); return h.name; });
for (let k = 0; k < 120 && inn && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
const inside = !!inn && await page.evaluate(() => isInterior());
if (inside) { await g.frames(4); rows.push(await measure(`${inn} (Dunmore's inn), the hall from the door, 20h`, 'Middle (indoors)'));
  // S1916 — polled on a timer, not on the page's frames (waitForFunction's default): the exit clears currentHouse 0.44 s after it is
  // called, but the first world frames after the inn are long on software GL, so a frame-polled wait timed out at 60 s, twice, at s1287.
  // S2614 — and no frames of the world are waited for after it (the old two took 235 s on CI once): the gate's door is taken at once,
  // and enterDungeon waits, in real time, for the gate's own scene and for the camera to stand on its floor.
  const tx = Date.now(); await page.evaluate(() => exitInterior()); await page.waitForFunction(() => currentHouse == null, null, { timeout: 60000, polling: 250 });
  console.log(`  out of the inn in ${Date.now() - tx} ms`); await g.hide(); }
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
const inGate = await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene);
rows.push(await measure('a medium gate (ruins, seed 11), from its entrance', 'Middle (indoors)'));
check('the inn and the gate were counted, and drew', inside && inGate && rows.length === 2 && rows.every(r => r.calls > 0), { inn, inside, inGate, gate: dg, steady, calls: rows.map(r => r.calls) });
check('no page errors', g.errs.length === 0, g.errs);
await budgetEnd(g, rows, 0);
await g.close();
