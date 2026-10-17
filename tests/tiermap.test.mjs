// Enemies by place, the map's label (Session 1065; the designer's sheet on Michael's A on #373). Session 64 took the grades off
// the map's subtitles because they followed you; a door's grade is its place's now, so it shows again: "Old gate · undead · Very
// Easy". Each door's label is the grade its live portal fights at, the same at level 1 and level 20, and the panel shows it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
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
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
