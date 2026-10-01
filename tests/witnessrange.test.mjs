// The witnesses' ranges (Session 156's spec, settled headless in Session 400, backlog G): outdoors anyone awake within
// 12 units with a clear line sees a crime; sneaking halves the range, night halves it again (12 / 6 / 6 / 3). A house
// between you blocks the line; someone indoors asleep (not in the street) sees nothing.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const r = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const npcs = S.npcs; npcs.forEach(n => { n.g.visible = false; });
  const w = npcs.find(n => n.def); const h = S.houses.find(x => x.keeper && x.type !== 'home') || S.houses[0];
  // open ground: a spot on the pad with 13 units of clear line along one heading
  let at = null; for (let k = 0; k < 400 && !at; k++) { const a = (k % 16) / 16 * Math.PI * 2, rr = 2 + Math.floor(k / 16) * 1.5; const x = S.site.x + Math.cos(a) * rr, z = S.site.z + Math.sin(a) * rr;
    for (let b = 0; b < 8 && !at; b++) { const hd = b / 8 * Math.PI * 2, ex = x + Math.cos(hd) * 13, ez = z + Math.sin(hd) * 13; let ok = true; for (let t = 0; t <= 26 && ok; t++) { if (WORLD.solidAt(x + Math.cos(hd) * t / 2, z + Math.sin(hd) * t / 2)) ok = false; } if (ok) at = { x, z, hd }; } }
  if (!at) return { noGround: true };
  px = at.x; pz = at.z; jumpY = 0;
  const put = d => { const x = at.x + Math.cos(at.hd) * d, z = at.z + Math.sin(at.hd) * d; w.g.visible = true; w._retreated = false; w.g.position.set(x, WORLD.worldH(x, z), z); };
  const ds = [2.9, 3.1, 5.9, 6.1, 11.9, 12.1]; const out = { rows: {} };
  for (const [label, hour, sn] of [['day', 13, false], ['day, sneaking', 13, true], ['night', 23, false], ['night, sneaking', 23, true]]) {
    forceTime(hour); _sneaking = sn; out.rows[label] = ds.filter(d => { put(d); return !!WORLD.witnessOf(h); }); }
  _sneaking = false; forceTime(13);
  // a house between: a witness under 12 units off across a building's solid, by day
  let across = null; for (const o of S.houses) { if (o.exitX == null) continue; const L = Math.hypot(o.exitX - o.doorX, o.exitZ - o.doorZ) || 1; const cx = o.doorX - (o.exitX - o.doorX) / L * 2.5, cz = o.doorZ - (o.exitZ - o.doorZ) / L * 2.5;
    if (!WORLD.solidAt(cx, cz)) continue; for (let b = 0; b < 16 && !across; b++) { const hd = b / 16 * Math.PI * 2; for (let e = 5; e <= 9 && !across; e += 1) { const ax = cx - Math.cos(hd) * e, az = cz - Math.sin(hd) * e, bx = cx + Math.cos(hd) * e, bz = cz + Math.sin(hd) * e;
      if (!WORLD.solidAt(ax, az) && !WORLD.solidAt(bx, bz) && Math.hypot(bx - ax, bz - az) < 12) across = { ax, az, bx, bz, house: o.name }; } } if (across) break; }
  out.across = across;
  if (across) { px = across.ax; pz = across.az; w.g.position.set(across.bx, 0, across.bz); out.blocked = !WORLD.witnessOf(h); out.acrossD = +Math.hypot(across.bx - across.ax, across.bz - across.az).toFixed(1); }
  // asleep indoors: the townsperson is out of the street (hidden), at 2 units
  px = at.x; pz = at.z; put(2); out.near = !!WORLD.witnessOf(h); w.g.visible = false; out.hidden = !WORLD.witnessOf(h); w.g.visible = true; w._retreated = true; out.retreated = !WORLD.witnessOf(h); w._retreated = false;
  out.witness = w.def.name; return out; });
console.log(JSON.stringify(r));
check('found open ground on Dunmore\'s pad', !r.noGround, r);
check('by day, walking: seen to 12 units (11.9 yes, 12.1 no)', JSON.stringify(r.rows['day']) === JSON.stringify([2.9, 3.1, 5.9, 6.1, 11.9]), r.rows);
check('by day, sneaking: seen to 6', JSON.stringify(r.rows['day, sneaking']) === JSON.stringify([2.9, 3.1, 5.9]), r.rows);
check('at night, walking: seen to 6', JSON.stringify(r.rows['night']) === JSON.stringify([2.9, 3.1, 5.9]), r.rows);
check('at night, sneaking: seen to 3', JSON.stringify(r.rows['night, sneaking']) === JSON.stringify([2.9]), r.rows);
check('a house between hides you, though the witness is in range by day', r.blocked === true && r.acrossD < 12, r);
check('someone out of the street (asleep indoors, or run off) sees nothing, even at 2 units', r.near && r.hidden && r.retreated, r);
await g.close();
