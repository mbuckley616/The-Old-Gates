// Session 985 (and 1002: the road job's camp from the cell's data): a lord's job comes out the same whatever has loaded (QA's note, backlog B; the S533 rule). `townQuestFor` rolls
// the job's kind on its own id, but fell back to the road job when no gate (a retrieve) or town (a deliver) had loaded near the
// lord's town, and took the cull's beast from the loaded regions. Now the gates and towns are read from every cell's own data
// (`doorsNearFixed`, `sitesNearFixed`) and the beast from the cells' regions (`lairBiome`). The same 30 job keys are asked at
// three towns whose cells have not loaded, then again once each town has built: every job must match.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const N = 30;
const ask = (ids) => page.evaluate(([ids, N]) => ids.map(id => { const s = WORLD.siteAnywhere(id); const jobs = [];
  for (let i = 0; i < N; i++) { const q = townQuestFor(s, null, true, 'jobseed:' + i); jobs.push(q.kind + '|' + q.title + '|' + (q.data.target || q.data.who || q.data.item || '') + (q.kind === 'road' ? '@' + q.data.x.toFixed(2) + ',' + q.data.z.toFixed(2) + '|' + q.data.ra + '>' + q.data.rb : '')); }
  const [ci, cj] = cellOf(s.x, s.z); return { id, jobs, loaded: [ci - 1, ci, ci + 1].flatMap(i => [cj - 1, cj, cj + 1].map(j => LOADED.has(cellKey(i, j)))).filter(Boolean).length,
    liveDoors: nearDoors(s, 700, false).length, liveTowns: nearSites(s, 900).filter(t => t.pad >= 45 && t.kind !== 'portal').length,
    fixedDoors: doorsNearFixed(s, 700).length, fixedTowns: sitesNearFixed(s, 900).filter(t => t.pad >= 45 && t.kind !== 'portal').length }; }), [ids, N]);
// three towns two cells or more from where we stand, with a gate or a town near them, and Dunmore at home
const towns = await page.evaluate(() => { const [pi, pj] = cellOf(px, pz), out = [];
  for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) { if (Math.max(Math.abs(i - pi), Math.abs(j - pj)) < 2 || LOADED.has(cellKey(i, j))) continue;
    for (const t of getCell(i, j).sites) if (t.pad >= 45 && t.kind !== 'portal' && !t.lair && /^c\d/.test(t.id) && doorsNearFixed(t, 700).length && sitesNearFixed(t, 900).some(o => o.pad >= 45 && o.kind !== 'portal')) out.push(t.id); }
  out.sort(); return [out[0], out[Math.floor(out.length / 2)], out[out.length - 1]]; });
console.log('towns', JSON.stringify(towns));
const before = await ask(towns);
// a retrieve job taken at the first town before its gates are placed, to be found by the real door later
const taken = await page.evaluate((id) => { const s = WORLD.siteAnywhere(id);
  for (let i = 0; i < 200; i++) { const q = townQuestFor(s, 'retrieve', true, 'jobseed:r' + i); if (q.kind === 'retrieve' && q.data.fixed) { qAdd(q); return { id: q.id, x: q.data.x, z: q.data.z, seed: q.data.seed }; } }
  return null; }, towns[0]);
const after = [], spotD = [], placed = []; let anchored = null;
// each town is measured while it stands loaded, once the gates near it have been placed (the cell's door job runs after the cell)
const spotsAt = (id) => page.evaluate((id) => { const s = WORLD.siteAnywhere(id), d = [];
  for (const o of doorsNearFixed(s, 700)) { const w = dungeonWorldPos[o.e.seed]; if (w) d.push(+Math.hypot(w.x - o.p.x, w.z - o.p.z).toFixed(1)); } return d; }, id);
for (const id of [...towns, 'dunmore']) { await g.settle(id);
  for (let k = 0; k < 20; k++) { const want = await page.evaluate((id) => doorsNearFixed(WORLD.siteAnywhere(id), 700).length, id); if ((await spotsAt(id)).length >= want) break; await page.waitForTimeout(1500); }
  const d = await spotsAt(id); spotD.push(...d); placed.push(id + ' ' + d.length);
  if (id !== 'dunmore') after.push((await ask([id]))[0]);
  if (id === towns[0] && taken) anchored = await page.evaluate((t) => { WORLD.tick(1 / 60, performance.now()); const q = qActive().find(q => q.id === t.id); const w = dungeonWorldPos[t.seed];
    const pk = pickups.find(o => o.id === t.id + ':pickup');
    return { fixed: q.data.fixed, off: w ? +Math.hypot(q.data.x - w.x - 7, q.data.z - w.z - 5).toFixed(2) : null, moved: +Math.hypot(q.data.x - t.x, q.data.z - t.z).toFixed(1), pk: pk ? +Math.hypot(pk.x - q.data.x, pk.z - q.data.z).toFixed(2) : null }; }, taken); }
spotD.sort((a, b) => a - b); const spots = { n: spotD.length, placed, median: spotD[spotD.length >> 1] || 0, max: spotD[spotD.length - 1] || 0 };
const home = await ask(['dunmore']);
console.log('before', JSON.stringify(before.map(b => ({ ...b, jobs: undefined }))));
console.log('after', JSON.stringify(after.map(b => ({ ...b, jobs: undefined }))));
console.log('taken', JSON.stringify(taken), 'anchored', JSON.stringify(anchored), 'spots', JSON.stringify(spots));
console.log('dunmore', JSON.stringify({ ...home[0], jobs: undefined }), JSON.stringify(home[0].jobs.slice(0, 8)));
check(`three towns away from the start, none of their cells loaded at first (${before.map(b => b.loaded).join(', ')} of 9), and no gate or town loaded near them (${before.map(b => b.liveDoors + '/' + b.liveTowns).join(', ')})`,
  towns.every(Boolean) && before.every(b => b.loaded === 0 && b.liveDoors === 0 && b.liveTowns === 0), before.map(b => ({ ...b, jobs: undefined })));
check(`the world's own data finds their gates and towns all the same (${before.map(b => b.fixedDoors + '/' + b.fixedTowns).join(', ')}), as it does once they have built (${after.map(b => b.fixedDoors + '/' + b.fixedTowns).join(', ')})`,
  before.every((b, i) => b.fixedDoors > 0 && b.fixedTowns > 0 && b.fixedDoors === after[i].fixedDoors && b.fixedTowns === after[i].fixedTowns), { before: before.map(b => ({ ...b, jobs: undefined })), after: after.map(b => ({ ...b, jobs: undefined })) });
const kinds = before.flatMap(b => b.jobs.map(j => j.split('|')[0])); const kc = {}; kinds.forEach(k => kc[k] = (kc[k] || 0) + 1);
const same = before.map((b, i) => b.jobs.filter((j, k) => j === after[i].jobs[k]).length);
check(`the same ${N} job keys give the same jobs before and after each town loads (${same.join(', ')} of ${N}); kinds ${JSON.stringify(kc)}`,
  same.every(n => n === N) && kc.retrieve > 0 && kc.deliver > 0, { same, diff: before.map((b, i) => b.jobs.map((j, k) => j === after[i].jobs[k] ? null : [j, after[i].jobs[k]]).filter(Boolean)) });
check(`a retrieve taken before its gate was placed is moved to the real door once it is (moved ${anchored && anchored.moved} m, ${anchored && anchored.off} m off the door's mark, the pickup with it)`,
  taken && anchored && anchored.fixed === false && anchored.off !== null && anchored.off < .01 && (anchored.pk === null || anchored.pk < .01), { taken, anchored });
check(`the world's spot for a gate lies near where its cell placed it: ${spots.n} gates, median ${spots.median} m, the farthest ${spots.max} m`, spots.n > 0 && spots.median < 60, spots);
// S1002 — the road job's camp, from the cell's data: the same spot before and after (in the jobs above), and the line worked out
// without building (`roadLineFixed`) is the built road's own, point for point, for every loaded road of a settlement's cell
const roads = await page.evaluate(() => { let n = 0, worst = 0, diffLen = 0, firstSame = 0, firstN = 0;
  for (const rd of ROADS) { if (!rd.def || rd.def.via === 'spur' || rd.def.via === 'quay' || rd.def.via === 'coach') continue; const c = getCell(...rd.cell.split(',').map(Number));
    if (!c.roadDefs.includes(rd.def)) continue; const pts = roadLineFixed(rd.def, c); n++; if (!pts || pts.length !== rd.pts.length) { diffLen++; continue; }
    for (let i = 0; i < pts.length; i++) worst = Math.max(worst, Math.hypot(pts[i].x - rd.pts[i].x, pts[i].z - rd.pts[i].z)); }
  // and the road the job names is the first loaded road out of the town, where the old code looked, for every loaded town
  for (const S of WORLD.settle.values()) { const s = S.site; if (!s || !/^c\d|^[a-z]/.test(s.id)) continue; const live = ROADS.find(rr => rr.def.a === s.id || rr.def.b === s.id); const f = roadOutFixed(s);
    if (!live || !f) continue; firstN++; if (live.def === f) firstSame++; }
  return { n, worst: +worst.toFixed(6), diffLen, firstSame, firstN }; });
console.log('roads', JSON.stringify(roads));
const roadJobs = before.flatMap((b, i) => b.jobs.map((j, k) => [j, after[i].jobs[k]]).filter(([j]) => j.startsWith('road|')));
check(`the road job's camp is the same before and after its town loads (${roadJobs.filter(([a, b]) => a === b).length} of ${roadJobs.length}), on a road of its own cell (${roadJobs.filter(([a]) => !a.endsWith('null>null')).length}; a glade has no road, and its camp is the fixed 300 m east)`,
  roadJobs.length > 0 && roadJobs.every(([a, b]) => a === b) && roadJobs.some(([a]) => !a.endsWith('null>null')), roadJobs.slice(0, 6));
check(`the road's line worked out from the cell's data is the built road's: ${roads.n} roads, ${roads.diffLen} of another length, the worst point ${roads.worst} m off; the first road out is the one the loaded roads gave in ${roads.firstSame} of ${roads.firstN} towns`,
  roads.n > 5 && roads.diffLen === 0 && roads.worst < 1e-6 && roads.firstN > 0 && roads.firstSame === roads.firstN, roads);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
