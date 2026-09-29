// The cot by a fort's entrance (Session 317). Session 9 put a cot beside every fort's entrance to rest on and take a
// banked level, but it looked for room floor (tile 1) beside the entrance, and a fort's entry is hallway (tile 7), so no
// fort ever had one (found by the look builder). Every fort layout, several seeds: a cot, beside the entrance, on floor,
// clear of the hall's columns and props, and pressing E beside it opens the rest panel.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const out = [];
for (const interior of ['fort_linear', 'fort_tee', 'fort_courtyard']) for (const seed of [11, 23, 42]) {
  await enterDungeon(page, { theme: 'ruins', seed, interior, size: 'medium' });
  out.push(await page.evaluate(([interior, seed]) => {
    const b = D_BEDS[0]; if (!b) return { interior, seed, beds: 0 };
    const tile = dMap[b.z][b.x], hit = [[0, 0], [.3, .5], [-.3, .5], [.3, -.5], [-.3, -.5]].some(([dx, dz]) => dColumnHit(b.x + dx, b.z + dz) || dPropHit(b.x + dx, b.z + dz));
    px = b.x + .6; pz = b.z; jumpY = 0;
    return { interior, seed, beds: D_BEDS.length, x: b.x, z: b.z, tile, hit, floor: b.floor }; }, [interior, seed]));
  // pressing E beside it, on the real keyboard: the rest panel
  if (out[out.length - 1].beds) { await page.keyboard.press('e'); await g.frames(2);
    out[out.length - 1].rest = await page.evaluate(() => { const o = sleepOpen; try { closeSleepUI(); } catch (e) {} return o; }); }
  console.log(' ', JSON.stringify(out[out.length - 1]));
}
check('every fort has its cot (3 layouts × 3 seeds)', out.every(o => o.beds === 1), out.filter(o => o.beds !== 1));
check('the cot stands on floor, clear of the hall\'s columns and props', out.every(o => (o.tile === 1 || o.tile === 7) && !o.hit), out.filter(o => o.hit || !(o.tile === 1 || o.tile === 7)));
check('E beside the cot opens the rest panel', out.every(o => o.rest), out.filter(o => !o.rest));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
