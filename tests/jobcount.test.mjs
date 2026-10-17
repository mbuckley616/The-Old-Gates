// A town's jobs and the war's camps count by place, pay by level (Session 1076; Michael's A on DECISION #405). A cull's beasts
// and a road camp's bandits read the tier's level where they stand (4 + and 3 + that level ÷ 3), and a siege camp its town's
// (6 + ÷ 3); the pay is still 40 + 30 × (your level ÷ 3). The same job keys are asked at Dunmore (tier 1) and at a Wastes town
// (tier 3), at level 1 and at level 30; then Dunmore is besieged at level 30.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const L0 = level, out = {};
  const home = getCell(HOME_I, HOME_J).regions, W = home.find(q => q.id === 'wastes');
  let wt = null; for (let j = 0; j < GRID && !wt; j++) for (let i = 0; i < GRID && !wt; i++) for (const t of getCell(i, j).sites) if (!wt && t.pad >= 45 && t.kind !== 'portal' && !t.lair && worldTierAt(t.x, t.z) === 3) wt = t;
  const towns = [WORLD.siteAnywhere('dunmore'), wt];
  out.tiers = towns.map(t => t && worldTierAt(t.x, t.z)); out.names = towns.map(t => t && t.name);
  const ask = (t, lv) => { level = lv; const rows = [];
    for (const kind of ['cull', 'road']) for (let i = 0; i < 6; i++) { const q = townQuestFor(t, kind, true, 'jobcount:' + kind + i);
      rows.push({ kind: q.kind, n: q.kind === 'cull' ? q.data.need : q.kind === 'road' ? q.data.count : null, tier: q.kind === 'road' ? worldTierAt(q.data.x, q.data.z) : worldTierAt(t.x, t.z), pay: q.reward }); }
    return rows; };
  out.jobs = towns.map(t => t ? [ask(t, 1), ask(t, 30)] : null);
  level = L0; return out; });
console.log(JSON.stringify({ tiers: r.tiers, names: r.names, sample: r.jobs.map(j => j && [j[0][0], j[1][0], j[0][6], j[1][6]]) }));
const want = x => x.kind === 'cull' ? 4 + Math.floor([0, 1, 6, 11, 16][x.tier] / 3) : 3 + Math.floor([0, 1, 6, 11, 16][x.tier] / 3);
check('Dunmore is tier 1 and a Wastes town tier 3', r.tiers[0] === 1 && r.tiers[1] === 3, r.tiers);
r.jobs.forEach((j, k) => { if (!j) return;
  const [a, b] = j;
  check(`${r.names[k]}: its culls and road camps ask the same counts at level 1 and level 30`, a.length === 12 && a.every((x, i) => x.kind === b[i].kind && x.n === b[i].n && x.n != null), { a: a.map(x => x.n), b: b.map(x => x.n) });
  check(`${r.names[k]}: each count is its place's tier's (cull 4 + L÷3, camp 3 + L÷3)`, a.every(x => x.n === want(x)), a.map(x => [x.kind, x.tier, x.n]));
  check(`${r.names[k]}: the pay still follows your level: level 30 pays 300 more on the same job (30 × 30 ÷ 3)`, a.every((x, i) => b[i].pay - x.pay === 300 && x.pay >= 40), { a: a.map(x => x.pay), b: b.map(x => x.pay) });
});
check('a Wastes cull asks for 7', !!r.jobs[1] && r.jobs[1][0].some(x => x.kind === 'cull' && x.n === 7), r.jobs[1] && r.jobs[1][0]);
// the siege at level 30: Dunmore is tier 1, so its camp is six soldiers, as at level 1
await g.settle('dunmore');
await page.evaluate(() => { level = 30; const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z; PHP = maxHP; const st = WORLD.TS(t); st.flags.besieged = worldState.gameTimeAbsMinutes || 0; st.siegeBy = 'mark'; st.siegeDay = 0; });
await page.evaluate(() => { for (let i = 0; i < 120; i++) { WORLD.tick(1 / 60, performance.now()); tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); } });
const siege = await page.evaluate(() => ZONES.world.enemies.filter(e => e._siege === 'dunmore' && !e.dead).length);
check(`besieged at level 30, Dunmore's camp is six soldiers, its tier's count (${siege})`, siege === 6, siege);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
