// Enemies by place, the map's label (Session 1065; the designer's sheet on Michael's A on #373). Session 64 took the grades off
// the map's subtitles because they followed you; a door's grade is its place's now, so it shows again: "Old gate · undead · Very
// Easy". Each door's label is the grade its live portal fights at, the same at level 1 and level 20, and the panel shows it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
// a slow runner registers the doors' live portals after the cells round home are built (CI read 0): wait for them, up to 120 s
for (let k = 0; k < 60; k++) { if (await page.evaluate(() => PORTALS.filter(p => p.seed != null).length > 3)) break; await page.waitForTimeout(2000); }
const r = await page.evaluate(() => {
  const L0 = level, cells = [];
  for (let i = HOME_I - 1; i <= HOME_I + 1; i++) for (let j = HOME_J - 1; j <= HOME_J + 1; j++) { const c = getCell(i, j); if (c) cells.push(c); }
  const read = () => { const o = {}; for (const c of cells) for (const e of mapEntries(c)) if (/^door_/.test(e.id)) o[e.id] = e.sub; return o; };
  level = 1; const a = read(); level = 20; const b = read(); level = L0;
  const labels = Object.values(DIFF_SCALE).map(d => d.label);
  const live = PORTALS.filter(p => p.seed != null).map(p => ({ id: 'door_' + p.seed, want: p.diffScale.label, lair: !!p.lair, sub: a['door_' + p.seed] }));
  const grades = {}; for (const s of Object.values(a)) { const l = labels.find(x => s.endsWith(' · ' + x)); grades[l || 'none'] = (grades[l || 'none'] || 0) + 1; }
  const G = ['veryeasy', 'easy', 'normal', 'hard', 'veryhard'], lairs = [];
  for (const c of cells) for (const d of c.doors) if (d.lair) { const p = dungeonWorldPos[d.seed] || { x: d.x, z: d.z }, e = mapEntries(c).find(e => e.id === 'door_' + d.seed);
    if (e) lairs.push({ sub: e.sub, plain: DIFF_SCALE[doorGrade({}, p.x, p.z)].label, step: G.indexOf(doorGrade(d, p.x, p.z)) - G.indexOf(doorGrade({}, p.x, p.z)), dragon: !!d.lair.dragon }); }
  const one = live.find(x => x.sub) || null; let panel = null;
  if (one) { const c = cells.find(c => mapEntries(c).some(e => e.id === one.id)); const e = mapEntries(c).find(e => e.id === one.id);
    mapPanel(e); const el = document.getElementById('wm-panel-body'); panel = el ? el.textContent : null; }
  return { n: Object.keys(a).length, a, b, live, lairs, grades, one, panel, sample: Object.values(a).slice(0, 6) };
});
console.log(JSON.stringify({ lairs: r.lairs, n: r.n, grades: r.grades, sample: r.sample, live: r.live.slice(0, 8), panel: r.panel }));
check(`every door round home (${r.n}) carries a grade on its subtitle`, r.n > 5 && !r.grades.none, r.grades);
const seen = r.live.filter(x => x.sub);
check(`each label is the grade its live portal fights at (${seen.length} portals)`, seen.length > 3 && seen.every(x => x.sub.endsWith(' · ' + x.want)), seen.filter(x => !x.sub.endsWith(' · ' + x.want)));
check(`a lair's cavern (${r.lairs.length}) reads one grade above a plain gate where it stands, a wyrm's two`, r.lairs.length > 0 && r.lairs.every(x => x.step === (x.dragon ? 2 : 1) || (x.step > 0 && x.sub.endsWith('Very Hard'))), r.lairs);
check('the labels are the same at level 20 as at level 1', JSON.stringify(r.a) === JSON.stringify(r.b), Object.keys(r.a).filter(k => r.a[k] !== r.b[k]).map(k => [r.a[k], r.b[k]]));
check('the map\'s panel shows the grade', !!r.one && !!r.panel && r.panel.includes(r.one.want), { one: r.one, panel: r.panel });
// Session 2274 (the bodies builder, s1623): the Old Garrison's wall stood across the Hearthwick–Droichead road, 25 m from its line,
// and every traveller walked into it. Each home fort's ring (27 m round its door's x and z + 4) now keeps 41 m from every home road,
// that road is free of the place's solids, and doorSpot (a fort whose cell has not loaded) names the spot placeDoor chose.
const forts = await page.evaluate(() => HOME_ROAD_DEFS.filter(d => d.fort).map(d => { const w = dungeonWorldPos[d.fort]; if (!w) return { fort: d.fort };
  const e = CELL_DOORS.find(e => e.seed === d.fort); delete dungeonWorldPos[d.fort]; const q = e ? doorSpot(e) : null; dungeonWorldPos[d.fort] = w;
  return { fort: d.fort, x: Math.round(w.x), z: Math.round(w.z), road: Math.round(homeFortRoadD(w.x, w.z + 4)), spot: q ? +Math.hypot(q.x - w.x, q.z - w.z).toFixed(1) : null }; }));
const garr = await page.evaluate(() => { const rd = ROADS.find(r => r.def.fort === 7100); let n = 0, bad = 0;
  for (let i = 0; i < rd.pts.length - 1; i++) for (let k = 0; k < 6; k++) { const a = rd.pts[i], b = rd.pts[i + 1], t = k / 6; n++; if (settleSolid(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, .3)) bad++; }
  return { n, bad }; });
console.log('forts', JSON.stringify(forts), 'garrison road', JSON.stringify(garr));
const placedF = forts.filter(f => f.x != null);
check(`each placed home fort's ring keeps 41 m from every home road (${placedF.map(f => f.fort + ' ' + f.road).join(', ')})`, placedF.length >= 4 && placedF.every(f => f.road >= 41), forts);
check(`the Old Garrison's road is clear of the place's solids (${garr.bad} of ${garr.n} points)`, garr.n > 100 && garr.bad === 0, garr);
check('doorSpot names the spot placeDoor chose, for a home fort not yet loaded', placedF.every(f => f.spot != null && f.spot < 1), forts);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
