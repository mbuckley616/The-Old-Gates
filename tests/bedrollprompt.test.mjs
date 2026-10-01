// The camp bedroll's prompt (Session 347, the critic's s253): *A bedroll — Press 'E' to rest* sat in the `else` of the
// prompt chain's `lid==='overworld'` branch, and in the world `lid` is always 'overworld', so it never showed.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const pre = await page.evaluate(() => ({ lid, zone: activeZoneId, beds: (ZONES.world.beds || []).length }));
let bed = null;
for (let tries = 0; tries < 40 && !bed; tries++) {
  bed = await page.evaluate(() => { const b = (ZONES.world.beds || [])[0]; return b ? { x: b.x, z: b.z, real: true } : null; });
  if (!bed) await g.frames(3);
}
if (!bed) bed = await page.evaluate(() => { const b = { x: px, z: pz, cell: 'test' }; ZONES.world.beds.push(b); return { x: b.x, z: b.z, real: false }; });
const r = await page.evaluate(async (b) => {
  const ob = document.getElementById('ob');
  const away = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => res(ob.textContent)))));
  px = b.x + 6; pz = b.z + 6; const far = await away();
  px = b.x + .4; pz = b.z; const near = await away();
  return { far, near, lid, zone: activeZoneId };
}, bed);
check('in the world, `lid` is overworld', pre.lid === 'overworld' && pre.zone === 'world', pre);
check('standing on the bedroll the prompt reads *A bedroll — Press ‘E’ to rest*', /^A bedroll — Press 'E' to rest/.test(r.near), { bed, r });
check('six units off, it does not', !/bedroll/.test(r.far), r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
