// One name per bridge (Session 803; the producer's filing of 13 Oct: `poinames` red on CI with two *Border Road Bridge*s). A
// bridge took its river's or its road's name, and every border road is *the Border Road*: ten loaded cells held five *Border
// Road Bridge*s, two *Stanwater Bridge*s in one cell and two *Tradou Road Bridge*s in another. A name already held now gives way
// to the nearest settlement's (*X Bridge*), then to both. Ten cells with border roads are walked into, so their bridges build.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const spots = await page.evaluate(() => { const out = []; for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) { const c = WORLD.getCell(i, j); if (c.type !== 'sea' && c.roadDefs.some(d => d.portal)) out.push([i, j]); } return out; });
// Session 1283: it waited a fixed 6 s a cell, and on CI's new look (frames of seconds, two jobs a frame) that built 16 bridges, not
// 20. Each cell now waits for the job queue the game laid out to empty, run as `g.settle` runs it (the same jobs in the same order).
const drain = () => page.evaluate(() => { const t0 = performance.now(); while (JOBS.length && performance.now() - t0 < 1500) runJobs(); return JOBS.length; });
// Session 1283: the world differs from boot to boot, and in some (the one whose first bridge is *Tradou Road Bridge*, CI's red)
// ten cells hold 16 bridges. The bar stays 20: after the ten, it walks on into the other border-road cells until 20 have built.
const bridgesNow = () => page.evaluate(() => { let n = 0; for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) WORLD.getCell(i, j).sites.forEach(t => { if (t.kind === 'bridge') n++; }); return n; });
const walk = [...spots.filter((_, k) => k % 3 === 0), ...spots.filter((_, k) => k % 3 !== 0)]; let walked = 0;
for (const [i, j] of walk) { if (walked >= 10 && await bridgesNow() >= 20) break; walked++; await page.evaluate(([i, j]) => { px = (i + .5) * WORLD.SIZE; pz = (j + .5) * WORLD.SIZE; }, [i, j]);
  for (let t = 0; t < 40; t++) { await g.frames(1); if (!(await drain())) { await g.frames(1); if (!(await drain())) break; } } }
console.log('cells walked', walked, 'of', walk.length);
const r = await page.evaluate(() => { const b = [], named = []; for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) WORLD.getCell(i, j).sites.forEach(t => { if (t.name) named.push(t.name); if (t.kind === 'bridge') b.push(t.name); });
  const dups = [...new Set(named.filter((x, i) => named.indexOf(x) !== i))]; return { bridges: b, dups, border: b.filter(n => n === 'Border Road Bridge').length, forms: b.every(n => / Bridge$/.test(n)) }; });
console.log(JSON.stringify(r));
check(`${r.bridges.length} bridges built in ${walked} cells (ten, then more until 20), each named *… Bridge*`, r.bridges.length >= 20 && r.forms, r.bridges);
check('no two named places share a name, bridges among them; at most one *Border Road Bridge*', r.dups.length === 0 && r.border <= 1, r.dups);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
