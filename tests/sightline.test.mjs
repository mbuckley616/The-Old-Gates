// F2b, the indoor sight line at your eye (Session 1105, `docs/design/scale-numbers-build.md`, *Movement*): `intSightLine`, the line
// a witness, a sleeper or a room's foe sees you along, ran at 1.1 over your floor whatever your posture. It now runs at your eye,
// 1.65 standing and 1.1 crouched (`SCALE.EYE_STAND`, `SCALE.EYE_CROUCH`). A solid blocks the line where it spans the eye and is
// a wall (1.8 tall or more) or a shut door, as before. In a Dunmore inn: the room's own walls block both postures and its open
// floor blocks neither; a high solid set between two points (1.3 to 3.2 over the floor) hides you standing and not crouched; a
// counter (0 to 0.95) hides you in neither, which is the rule today (the sheet's counter is a question, DECISION in the devlog).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();
await g.settle('dunmore');
await page.evaluate(() => { const h = WORLD.settle.get('dunmore').houses.find(x => x.type === 'inn'); window._inn = h; forceTime(13); px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForFunction(() => currentHouse === window._inn && INT_SOL.length > 0, null, { timeout: 60000 }); await g.frames(2);

const r = await page.evaluate(() => {
  const sn = _sneaking, jy = jumpY; jumpY = 0;
  const both = (a, b) => { _sneaking = false; const st = intSightLine(a.x, a.z, b.x, b.z); _sneaking = true; const cr = intSightLine(a.x, a.z, b.x, b.z); return { st, cr }; };
  const free = (x, z) => !intSolidAt(x, z, .3, 0);
  // the ground floor's open pairs and walled pairs, 2.5 m apart, on a grid over the room
  const W = window._inn.intW, D = window._inn.intD; let open = null, walled = 0, walledBoth = 0, openBoth = 0;
  for (let x = .5; x < W - .5; x += .5) for (let z = .5; z < D - .5; z += .5) for (const [dx, dz] of [[2.5, 0], [0, 2.5]]) {
    const a = { x, z }, b = { x: x + dx, z: z + dz }; if (b.x > W - .3 || b.z > D - .3 || !free(a.x, a.z) || !free(b.x, b.z)) continue;
    const s = both(a, b); if (s.st && s.cr) { openBoth++; if (!open) open = { a, b }; } else { walled++; if (!s.st && !s.cr) walledBoth++; } }
  // and across each of the room's own walls on the ground floor (a solid 1.8 tall or more from the floor), at its middle
  for (const w of INT_SOL.slice()) { if (w.y0 == null || w.y0 > .1 || w.y1 - w.y0 < 1.8 || w.y0 > 1) continue;
    const cx = (w.x0 + w.x1) / 2, cz = (w.z0 + w.z1) / 2, thinX = (w.x1 - w.x0) < (w.z1 - w.z0);
    const a = thinX ? { x: w.x0 - .4, z: cz } : { x: cx, z: w.z0 - .4 }, b = thinX ? { x: w.x1 + .4, z: cz } : { x: cx, z: w.z1 + .4 };
    if (a.x < 0 || a.z < 0 || b.x > W || b.z > D || !free(a.x, a.z) || !free(b.x, b.z)) continue;
    const s = both(a, b); walled++; if (!s.st && !s.cr) walledBoth++; }
  const out = { W, D, openBoth, walled, walledBoth, eyes: [SCALE.EYE_STAND, SCALE.EYE_CROUCH] };
  if (open) {
    const m = { x: (open.a.x + open.b.x) / 2, z: (open.a.z + open.b.z) / 2 };
    const add = (y0, y1) => { const s = { x0: m.x - .3, x1: m.x + .3, z0: m.z - .6, z1: m.z + .6, y0, y1 }; INT_SOL.push(s); const res = both(open.a, open.b); INT_SOL.splice(INT_SOL.indexOf(s), 1); return res; };
    out.high = add(1.3, 3.2); out.counter = add(0, SCALE.COUNTER); out.wall = add(0, 3.2);
    jumpY = 2; out.highUp = (() => { const s = { x0: m.x - .3, x1: m.x + .3, z0: m.z - .6, z1: m.z + .6, y0: 3.3, y1: 5.2 }; INT_SOL.push(s); const res = both(open.a, open.b); INT_SOL.splice(INT_SOL.indexOf(s), 1); return res; })();
  }
  _sneaking = sn; jumpY = jy; return out; });
console.log(JSON.stringify(r));
check('the inn\'s open floor: both postures see along it', r.openBoth >= 5, r);
check('the inn\'s walls: a line through one is blocked standing and crouched alike', r.walled >= 2 && r.walledBoth === r.walled, r);
check('a solid from 1.3 to 3.2 over the floor hides you standing (eye 1.65), not crouched (eye 1.1)', r.high && r.high.st === false && r.high.cr === true, r.high);
check('the same, two metres up an upper floor (3.3 to 5.2): the eye rides your floor', r.highUp && r.highUp.st === false && r.highUp.cr === true, r.highUp);
check('a wall from the floor to 3.2 hides you in both', r.wall && !r.wall.st && !r.wall.cr, r.wall);
check('a counter (0 to 0.95) hides you in neither, the rule today', r.counter && r.counter.st && r.counter.cr, r.counter);
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
