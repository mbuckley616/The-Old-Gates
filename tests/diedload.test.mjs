// After *Load last save* the keys work (Session 624; the critic, 7 Oct 2026). The death screen's button loaded the save but
// left focus on the page, not on `#g`, where the game reads its keys: W did not move you and E did nothing until you clicked
// the view. Die in the open world and in a dungeon, click *Load last save* with the mouse, then hold W on the keyboard:
// focus is on the view, the held key reaches the game and you walk.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
// S1937 — nothing here reads the game's pixels, and on software GL the drawing was the suite's cost: 859 s of the run.mjs cap's 900 on
// the weekly run of 1 Nov (the world's death and load 10 min 19 s, the dungeon's 3 min 48 s). The loop still runs every frame (the
// keys, the walk, the camera enterDungeon waits for); only the draw is stubbed, as keeperwalk and mainrun do.
await page.evaluate(() => { REN.render = () => {}; });
const t0 = Date.now(), lap = w => console.log(`  ${w} at ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await page.evaluate(async () => { await saveToSlot(0); });
const out = [];
for (const where of ['world', 'dungeon']) {
  if (where === 'dungeon') { await enterDungeon(page, { theme: 'ruins', seed: 11, interior: 'fort_linear', size: 'medium' });
    await page.evaluate(async () => { px = dAt(dEntranceX); pz = dAt(dEntranceZ - 2); /* S1283 — the map is cells */ await saveToSlot(0); }); }
  await page.evaluate(() => { PHP = 0; playerDead(); });
  const shown = await page.evaluate(() => getComputedStyle(document.getElementById('died')).display === 'flex');
  await page.click('#died-load');
  await page.waitForFunction(() => !dead && document.getElementById('died').style.display === 'none', null, { timeout: 15000 });
  await page.waitForTimeout(1500); await g.frames(4);
  const before = await page.evaluate(() => ({ x: px, z: pz, focus: document.activeElement && document.activeElement.id || document.activeElement.tagName }));
  await page.keyboard.down('KeyW'); await g.frames(30);
  const held = await page.evaluate(() => !!K.KeyW);
  await g.frames(30); await page.keyboard.up('KeyW'); await g.frames(2);
  const after = await page.evaluate(() => ({ x: px, z: pz, zone: activeZoneId }));
  const o = { where, shown, focus: before.focus, held, moved: +Math.hypot(after.x - before.x, after.z - before.z).toFixed(2), zone: after.zone };
  out.push(o); console.log(' ', JSON.stringify(o)); lap(where);
}
check('the death screen shows, and *Load last save* loads', out.every(o => o.shown), out);
check('after the load the view has the focus', out.every(o => o.focus === 'g'), out);
check('W held on the keyboard reaches the game and you walk', out.every(o => o.held && o.moved > .3), out);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
