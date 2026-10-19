// A lair's cavern stands one grade above its door's, a wyrm's two, to Very Hard at most (Michael's A on DECISION #230, Session 718).
// Since Session 1058 the door's grade is its place's tier's (enemies by place, #373 A; the designer's sheet), not your level's:
// tier 1 Very Easy, 2 Normal, 3 Hard, 4 Very Hard, and the same at every level. Before, every old gate took your level's grade (Session 9).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const [hi, hj] = WORLD.cellOf(px, pz); const lairs = [], gates = [];
  for (let i = hi - 3; i <= hi + 3; i++) for (let j = hj - 3; j <= hj + 3; j++) { const c = WORLD.getCell(i, j); if (!c) continue;
    for (const d of c.doors || []) { if (d.lairDoor) lairs.push(d); else if (!d.root) gates.push(d); } }
  const G = ['veryeasy', 'easy', 'normal', 'hard', 'veryhard'], L0 = level, rows = [];
  const own = d => G[[0, 0, 2, 3, 4][dungeonTier({ zone: 'world', x: d.x, z: d.z }, 1)]];
  for (const L of [1, 2, 3, 6, 10, 15, 20]) { level = L;
    const lp = lairs.map(d => ({ d, p: makePortalDef(d) })), gp = gates.slice(0, 20).map(d => ({ d, p: makePortalDef(d) }));
    const wd = Object.assign({}, lairs[0], { lair: Object.assign({}, lairs[0].lair, { dragon: true }) }), wyrm = makePortalDef(wd);
    rows.push({ L, lair: lp.map(x => x.p.diff), gate: gp.map(x => x.p.diff), wyrm: wyrm.diff,
      lairOk: lp.every(x => x.p.diff === G[Math.min(4, G.indexOf(own(x.d)) + 1)]), gateOk: gp.every(x => x.p.diff === own(x.d)),
      wyrmOk: wyrm.diff === G[Math.min(4, G.indexOf(own(wd)) + 2)],
      scaleOk: lp.every(x => x.p.diffScale === DIFF_SCALE[x.p.diff]) && wyrm.diffScale === DIFF_SCALE[wyrm.diff] }); }
  // the door the world builds as its cell loads (the live portal list) reads the same at level 1 and level 6
  level = L0; for (const d of lairs.filter(d => d.cell).slice(0, 6)) WORLD.loadCell(...d.cell.split(',').map(Number));
  const q = portals.find(p => p.lair); let liveRow = null; if (q) { level = 1; const a = q.diff; level = 6; const b = q.diff; level = L0; liveRow = { name: q.name, a, b, dragon: !!q.lair.dragon, tier: dungeonTier(q, 1) }; }
  return { n: lairs.length, gates: gates.length, rows, liveRow }; });
console.log(JSON.stringify(r));
const same = k => r.rows.every(x => JSON.stringify(x[k]) === JSON.stringify(r.rows[0][k]));
check('lair doors and plain old gates found round the start', r.n >= 4 && r.gates >= 4, { lairs: r.n, gates: r.gates });
check('a lair\'s cavern is one grade above its door\'s tier\'s, at every level', r.rows.every(x => x.lairOk) && same('lair'), r.rows.map(x => [x.L, x.lair]));
check('a wyrm\'s cavern is two grades above', r.rows.every(x => x.wyrmOk) && same('wyrm'), r.rows.map(x => [x.L, x.wyrm]));
check('a plain old gate is its tier\'s grade, the same at levels 1 to 20 (S1058)', r.rows.every(x => x.gateOk) && same('gate'), r.rows.map(x => [x.L, x.gate]));
check('the scale the foes and the loot read is the grade\'s', r.rows.every(x => x.scaleOk), null);
check('a lair door the world has loaded reads the same grade at level 1 and 6', !!r.liveRow && r.liveRow.a === r.liveRow.b, r.liveRow);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
