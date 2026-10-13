// One name per bridge (Session 803; the producer's filing of 13 Oct: `poinames` red on CI with two *Border Road Bridge*s). A
// bridge took its river's or its road's name, and every border road is *the Border Road*: ten loaded cells held five *Border
// Road Bridge*s, two *Stanwater Bridge*s in one cell and two *Tradou Road Bridge*s in another. A name already held now gives way
// to the nearest settlement's (*X Bridge*), then to both. Ten cells with border roads are walked into, so their bridges build.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const spots = await page.evaluate(() => { const out = []; for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) { const c = WORLD.getCell(i, j); if (c.type !== 'sea' && c.roadDefs.some(d => d.portal)) out.push([i, j]); } return out; });
for (const [i, j] of spots.filter((_, k) => k % 3 === 0).slice(0, 10)) { await page.evaluate(([i, j]) => { px = (i + .5) * WORLD.SIZE; pz = (j + .5) * WORLD.SIZE; }, [i, j]); await page.waitForTimeout(6000); }
const r = await page.evaluate(() => { const b = [], named = []; for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) WORLD.getCell(i, j).sites.forEach(t => { if (t.name) named.push(t.name); if (t.kind === 'bridge') b.push(t.name); });
  const dups = [...new Set(named.filter((x, i) => named.indexOf(x) !== i))]; return { bridges: b, dups, border: b.filter(n => n === 'Border Road Bridge').length, forms: b.every(n => / Bridge$/.test(n)) }; });
console.log(JSON.stringify(r));
check(`${r.bridges.length} bridges built in ten cells, each named *… Bridge*`, r.bridges.length >= 20 && r.forms, r.bridges);
check('no two named places share a name, bridges among them; at most one *Border Road Bridge*', r.dups.length === 0 && r.border <= 1, r.dups);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
