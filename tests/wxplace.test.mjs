// Weather fits the place you arrive in (Session 450, the critic's s372 note: snow at Cnoccarra on 3 October).
// The roll gives no snow in the Gatelands; snow carried into a cell that could never roll it is rolled again there
// and blends out; snow carried into the Mark stays; a weather a test holds (timer past 330 s) is left alone.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); const stop = g.keepAlive();
const where = await page.evaluate(() => {
  const find = f => { for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) { const s = WORLD.getCell(i, j).sites.find(t => f(t, i, j)); if (s) return { x: s.x, z: s.z, name: s.name, cell: [i, j] }; } return null; };
  return { start: { x: px, z: pz, cell: WORLD.cellOf(px, pz) },
    cn: find(t => t.name === 'Cnoccarra'),
    cold: find((t, i, j) => WORLD.nationOf(i, j).climate === 'cold' && (t.kind === 'town' || t.kind === 'village')) }; });
const go = (p) => page.evaluate(p => { px = p.x; pz = p.z + 4; }, p);
const set = (type, timer) => page.evaluate(([t, tm]) => { const wx = WORLD.wx; wx.type = wx.next = t; wx.k = 0; wx.timer = tm; }, [type, timer]);
const state = () => page.evaluate(() => { const wx = WORLD.wx; return { type: wx.type, next: wx.next, k: +wx.k.toFixed(2), timer: Math.round(wx.timer), rerolls: wx.rerolls || 0 }; });
const roll = () => page.evaluate(() => { const c = {}; const wx = WORLD.wx; for (let i = 0; i < 400; i++) { wx.timer = 0; WORLD.tick(1 / 60, performance.now()); c[wx.next] = (c[wx.next] || 0) + 1; } wx.type = wx.next = 'clear'; wx.k = 0; wx.timer = 200; return c; });

check('Cnoccarra and a town of the Mark are found, in other cells than the start', where.cn && where.cold && String(where.cn.cell) !== String(where.start.cell), where);
const rStart = await roll();
await go(where.cn); await g.spin(null, 2); const rCn = await roll();
check('the roll gives no snow at the start or at Cnoccarra (400 draws each)', !rStart.snow && !rCn.snow, { rStart, rCn });

// snow in the start cell, standing still: kept (devWeather and a weather test there still work)
await go(where.start); await g.spin(null, 2); await set('snow', 200); await g.spin(null, 120);
const still = await state();
check('snow set at the start holds while you stay in the cell', still.type === 'snow' && still.next === 'snow', still);

// carried to Cnoccarra: rolled again on the first tick there, and gone after the 25 s blend
await go(where.cn); await g.spin(null, 1); const arrived = await state();
check('snow carried to Cnoccarra is rolled again on arrival', arrived.next !== 'snow' && arrived.rerolls >= 1 && arrived.timer > 140, arrived);
await g.spin(null, 26 * 60); const later = await state();
check('…and has blended out 26 s later', later.type !== 'snow' && later.next !== 'snow', later);

// carried into the Mark: snow can fall there, so it stays
await go(where.start); await g.spin(null, 2); await set('snow', 200); const before = (await state()).rerolls;
await go(where.cold); await g.spin(null, 60); const mark = await state();
check('snow carried into the Mark stays', mark.type === 'snow' && mark.next === 'snow' && mark.rerolls === before, { mark, cold: where.cold.name });

// clear weather is never rolled again by a move
await set('clear', 200); const b2 = (await state()).rerolls; await go(where.cn); await g.spin(null, 2); const clear = await state();
check('a move in clear weather rolls nothing', clear.rerolls === b2 && clear.timer > 190, clear);

// a held weather (a test's, timer 1e9) is left alone wherever you go
await go(where.start); await g.spin(null, 2); await set('snow', 1e9); await go(where.cn); await g.spin(null, 60); const held = await state();
check('a held weather is left alone', held.type === 'snow' && held.next === 'snow', held);

stop(); await g.close();
