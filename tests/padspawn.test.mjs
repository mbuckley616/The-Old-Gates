// No chunk foe inside a site's pad (Session 1113). `spawnChunkEncounters` skips a chunk whose centre is within a site's pad + 70,
// but it read `SITES`, the sites loaded so far: An Spéir's shrine at c6_8_p1 is its cell's sixth site and is built late, so the
// chunk beside it (centre 34 m off, inside 28 + 70) had already put a Highwayman 2.3 m from the altar (renewal, S1104). It now
// reads the pads of the chunk's cell and its eight neighbours from `getCell`, as S533's rule asks. Measured at that shrine: no
// living chunk foe stands within 30 m of the altar, and no loaded chunk foe's chunk centre is inside any cell site's pad + 70.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const site = await page.evaluate(() => {
  const god = s => String(s.id).split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 13) % 6;
  const all = []; for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) all.push(...WORLD.getCell(i, j).sites);
  const sh = all.filter(s => s.kind === 'shrine' && s.pad > 0 && god(s) === 1).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  return sh[0] && { id: sh[0].id, x: sh[0].x, z: sh[0].z };
});
check('there is a shrine of An Spéir', !!site, site);
check('the shrine is built', await g.settle(site.id), site.id);
const r = await page.evaluate((id) => {
  const S = WORLD.settle.get(id), C = WORLD.CHUNK, all = [];
  for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) all.push(...WORLD.getCell(i, j).sites.filter(t => t.pad > 0));
  const foes = (ZONES.world.enemies || []).filter(e => !e.dead && e._chunk);
  const near = foes.filter(e => Math.hypot(e.x - S.altar.x, e.z - S.altar.z) < 30).map(e => ({ name: e.name, d: +Math.hypot(e.x - S.altar.x, e.z - S.altar.z).toFixed(1), chunk: e._chunk }));
  const inPad = []; for (const e of foes) { const [cx, cz] = e._chunk.split(',').map(Number), x = cx * C + C / 2, z = cz * C + C / 2;
    const t = all.find(t => Math.hypot(x - t.x, z - t.z) < t.pad + 70); if (t) inPad.push({ name: e.name, chunk: e._chunk, site: t.id, kind: t.kind }); }
  return { foes: foes.length, near, inPad, pad: S.site.pad };
}, site.id);
console.log(JSON.stringify(r));
check(`no living chunk foe within 30 m of An Spéir's altar (of ${r.foes} chunk foes loaded)`, r.foes > 0 && r.near.length === 0, r.near);
check('no loaded chunk foe comes from a chunk whose centre is inside a site\'s pad + 70', r.inPad.length === 0, r.inPad);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
