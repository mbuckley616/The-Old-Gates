// PROTOTYPE pictures for a DECISION on the dungeon's passages (Michael, 5 Oct: "dungeons are very narrow and cramped — I think we can open
// them up a bit more and make them less claustrophobic"). Not a test. A dungeon cell is one unit; every corridor is one cell wide under a
// 3.2 roof. The prototype widens every corridor to two cells, on the same seed, so the same rooms and turns stand in the same places.
import { boot } from './lib/game.mjs';
const OUT = process.env.SHOT_DIR || 'docs/prototypes';
const g = await boot(); const { page } = g;
await g.intoWorld();
const SEED = +(process.env.SEED || 4031);
const enter = async (wide) => {
  await page.evaluate(([seed, wide]) => { window._built = null; if (scene === dScene && typeof goToOW === 'function') { /* leave the last one first */ }
    if (!window._mkD0) window._mkD0 = makeDungeon;
    window._gen = null; window.makeDungeon = wide ? (size, s) => { const gen = _mkD0(size, s); for (const [M, R] of [[gen.map, gen.rooms], [gen.map2, gen.rooms2 || []]]) { if (!M) continue;
        const H = M.length, W = M[0].length, inR = (x, y) => R.some(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h), f = (x, y) => y >= 0 && y < H && x >= 0 && x < W && M[y][x] !== 0, add = [];
        for (let y = 1; y < H - 2; y++) for (let x = 1; x < W - 2; x++) { if (M[y][x] !== 1 || inR(x, y)) continue;
          if (f(x - 1, y) || f(x + 1, y)) add.push([x, y + 1]); if (f(x, y - 1) || f(x, y + 1)) add.push([x + 1, y]); }
        for (const [x, y] of add) if (M[y][x] === 0) M[y][x] = 1; } return window._gen = gen; } : (size, s) => window._gen = _mkD0(size, s);
    const p = Object.assign({}, PORTALS[0], { theme: 'ruins', seed, size: 'large', interior: 'cave', zone: 'world', tutorial: false }); const m0 = dMap; goToDungeon(p); window._m0 = m0; }, [SEED, wide]);
  for (let k = 0; k < 40 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && dMap !== window._m0 && !!window._gen)); k++) await page.waitForTimeout(300);
  await g.spin(10);
  await page.evaluate(() => { ENEMIES.forEach(e => { e.dead = true; if (e.mesh) e.mesh.visible = false; }); PHP = 1e6; if (typeof vmSword !== 'undefined' && vmSword) vmSword.visible = false; if (typeof vmArmR !== 'undefined' && vmArmR) vmArmR.visible = false; window.tickDungeonTraps = () => {}; });
};
// today's map: the longest straight run of corridor (outside every room) on floor one
await enter(false);
const run = await page.evaluate(() => { const M = dMap, H = M.length, W = M[0].length, R = window._gen.rooms, inR = (x, y) => R.some(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  const cor = (x, y) => y >= 0 && y < H && x >= 0 && x < W && M[y][x] === 1 && !inR(x, y); let best = null;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!cor(x, y)) continue;
    for (const [dx, dy] of [[1, 0], [0, 1]]) { if (cor(x - dx, y - dy)) continue; let n = 0; const wall = (xx, yy) => !(yy >= 0 && yy < H && xx >= 0 && xx < W && M[yy][xx] !== 0); while (cor(x + dx * n, y + dy * n) && wall(x + dx * n + dy, y + dy * n + dx) && wall(x + dx * n - dy, y + dy * n - dx)) n++; if (!best || n > best.n) best = { x, y, dx, dy, n }; } }
  return best; }).catch(e => ({ err: String(e) }));
console.log('run', JSON.stringify(run));
const shot = async (file, wide, at) => {
  await page.evaluate(([run, wide, at]) => { const { x, y, dx, dy, n } = run; const k = at === 'mouth' ? n - 1.2 : .5;
    px = x + dx * k + (wide ? dy * .5 : 0); pz = y + dy * k + (wide ? dx * .5 : 0); /* a cell is centred on its integer */ const s = at === 'mouth' ? -1 : 1; yaw = Math.atan2(-dx * s, -dy * s); pitch = .05; jumpY = 0; }, [run, wide, at]);
  await g.spin(2); await g.frames(3); console.log(file, JSON.stringify(await page.evaluate(() => [px, pz, yaw, jumpY].map(v => +v.toFixed(2))))); await page.screenshot({ path: `${OUT}/${file}` });
};
await shot('dungeon-wide-today-run.png', false, 'start');
await shot('dungeon-wide-today-mouth.png', false, 'mouth');
await enter(true);
await shot('dungeon-wide-proto-run.png', true, 'start');
await shot('dungeon-wide-proto-mouth.png', true, 'mouth');
const st = await page.evaluate(() => { let f = 0; for (const r of dMap) for (const v of r) if (v) f++; return { floor: f }; });
console.log('wide', JSON.stringify(st), 'errs', JSON.stringify(g.errs));
await g.close();
