// A lair's cavern stands one grade above your level's, a wyrm's two, to Very Hard at most (Michael's A on DECISION #230, Session 718).
// Every old gate takes your level's grade (Session 9); a lair's door was written 'hard' (a wyrm's 'veryhard') and nothing read it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const [hi, hj] = WORLD.cellOf(px, pz); const lairs = [], gates = [];
  for (let i = hi - 3; i <= hi + 3; i++) for (let j = hj - 3; j <= hj + 3; j++) { const c = WORLD.getCell(i, j); if (!c) continue;
    for (const d of c.doors || []) { if (d.lairDoor) lairs.push(d); else if (!d.root) gates.push(d); } }
  const G = ['veryeasy', 'easy', 'normal', 'hard', 'veryhard'], L0 = level, rows = [];
  for (const L of [1, 2, 3, 6, 10, 15, 20]) { level = L; const own = G.indexOf(levelDiffKey());
    const lp = lairs.map(d => makePortalDef(d)), gp = gates.slice(0, 20).map(d => makePortalDef(d));
    const wyrm = makePortalDef(Object.assign({}, lairs[0], { lair: Object.assign({}, lairs[0].lair, { dragon: true }) }));
    rows.push({ L, own: G[own], lair: [...new Set(lp.map(p => p.diff))], gate: [...new Set(gp.map(p => p.diff))], wyrm: wyrm.diff,
      wantLair: G[Math.min(4, own + 1)], wantWyrm: G[Math.min(4, own + 2)], scaleOk: lp.every(p => p.diffScale === DIFF_SCALE[p.diff]) && wyrm.diffScale === DIFF_SCALE[wyrm.diff] }); }
  // the door the world builds as its cell loads (the live portal list) reads the same, and the grade is read when asked: a level
  // gained moves it (read at once: the streamer drops these far cells again on its next ticks)
  level = L0; for (const d of lairs.filter(d => d.cell).slice(0, 6)) WORLD.loadCell(...d.cell.split(',').map(Number));
  const q = portals.find(p => p.lair); let liveRow = null; if (q) { level = 1; const a = q.diff; level = 6; const b = q.diff; level = L0; liveRow = { name: q.name, a, b, dragon: !!q.lair.dragon }; }
  return { n: lairs.length, gates: gates.length, rows, liveRow }; });
console.log(JSON.stringify(r));
check('lair doors and plain old gates found round the start', r.n >= 4 && r.gates >= 4, { lairs: r.n, gates: r.gates });
check('a lair\'s cavern is one grade above your level\'s, at every level (Easy at 1, to Very Hard)', r.rows.every(x => x.lair.length === 1 && x.lair[0] === x.wantLair), r.rows.map(x => [x.L, x.own, x.lair]));
check('a wyrm\'s cavern is two grades above (Normal at 1, Very Hard from 6)', r.rows.every(x => x.wyrm === x.wantWyrm), r.rows.map(x => [x.L, x.wyrm]));
check('a plain old gate is your level\'s grade, as before', r.rows.every(x => x.gate.length === 1 && x.gate[0] === x.own), r.rows.map(x => [x.L, x.gate]));
check('the scale the foes and the loot read is the grade\'s', r.rows.every(x => x.scaleOk), null);
check('a lair door the world has loaded reads its grade when asked (level 1, then 6)', !!r.liveRow && (r.liveRow.dragon ? r.liveRow.a === 'normal' && r.liveRow.b === 'veryhard' : r.liveRow.a === 'easy' && r.liveRow.b === 'hard'), r.liveRow);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
