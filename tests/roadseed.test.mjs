// A road is the same road whatever loaded before it (Session 619). buildRoad seeded a road's bends with ROAD_DEFS.length,
// the number of roads registered before it, so a road's line, and every town planned along it, followed the order the
// cells happened to load in: the same port settled twice put its house ids at other places (Session 618's find). Now a
// home road keeps its old number (its place in HOME_ROAD_DEFS) and any other is seeded by its own ends. Every road loaded
// after a walk to four ports is built again from its def with the count shifted, and must come out point for point.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
for (const id of ['portclare', 'c4_9_s8']) await g.settle(id);
const r = await page.evaluate(() => {
  const rows = [];
  const roads = ROADS.filter(rd => rd.def.via !== 'spur' && rd.def.via !== 'quay');
  for (const rd of roads) {
    const home = HOME_ROAD_DEFS.includes(rd.def);
    const again = shift => { for (let k = 0; k < shift; k++) ROAD_DEFS.push({ a: '_', b: '_' });
      const r2 = buildRoad(rd.def); const pts = r2 ? r2.pts.map(p => [p.x, p.z]) : null;
      if (r2) ROADS.splice(ROADS.indexOf(r2), 1); rebuildRoadGrid(); return pts; };
    const a = again(0), b = again(7);
    const same = (p, q) => !!p && !!q && p.length === q.length && p.every((v, i) => Math.abs(v[0] - q[i][0]) < 1e-6 && Math.abs(v[1] - q[i][1]) < 1e-6);
    rows.push({ id: rd.def.a + '>' + rd.def.b, home, n: rd.pts.length, asLoaded: same(a, rd.pts.map(p => [p.x, p.z])), shifted: same(a, b) });
  }
  return { rows, roads: ROADS.length };
});
const home = r.rows.filter(x => x.home), gen = r.rows.filter(x => !x.home);
console.log(`roads: ${r.rows.length} (home ${home.length}, generated ${gen.length}); differing: ${JSON.stringify(r.rows.filter(x => !x.asLoaded || !x.shifted))}`);
check('home roads and generated roads were loaded', home.length >= 5 && gen.length >= 10, { home: home.length, gen: gen.length });
check('every road built again from its def comes out as it was loaded', r.rows.every(x => x.asLoaded), r.rows.filter(x => !x.asLoaded));
check('and the same with seven more roads registered before it', r.rows.every(x => x.shifted), r.rows.filter(x => !x.shifted));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
