// Today's build for the fall page: Aoife saves in Dunmore (slot 1, with its picture), goes down an old gate and falls to a
// foe there. Photographs today's death screen (#died) and a plate of the same view without it (plate-fall.jpg, the HUD
// left on), and the save's own picture (save-pic.jpg). current.json holds what the page prints: the death screen's words,
// the save's index entry (place, level, gold, date), the clock, the foe, the counter of deaths, the build tag.
// node docs/prototypes/fall/shoot-current.mjs
import { boot } from '../../../tests/lib/game.mjs';
import { enterDungeon } from '../../../tests/lib/dungeonshot.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
await page.evaluate(() => { document.getElementById('g').style.height = '720px'; window.dispatchEvent(new Event('resize')); });
const data = {};
// a save in Dunmore's street at 4 pm
data.save = await page.evaluate(async () => { forceTime(16); try { closeDialog(); } catch (e) {} playerName = 'Aoife'; level = 5; gold = 417;
  const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.doorX != null && x.keeper) || S.houses[0];
  const dx = h.exitX - h.doorX, dz = h.exitZ - h.doorZ, L = Math.hypot(dx, dz) || 1; px = h.doorX + dx / L * 7; pz = h.doorZ + dz / L * 7; jumpY = 0;
  yaw = Math.atan2(px - h.doorX, pz - h.doorZ) + .4; pitch = -.04; updateHUD();
  await new Promise(r => setTimeout(r, 2500)); await saveToSlot(0);
  const k = ssActiveKey(); const e = ssEntry(k); const pic = await ssPic(k);
  return { key: k, entry: e, pic, date: e.at != null ? gameDateLine(e.at, e.tod) : null, short: e.at != null ? gameDateLine(e.at, e.tod, 'short') : null }; });
if (data.save.pic) { fs.writeFileSync(path.join(here, 'save-pic.jpg'), Buffer.from(data.save.pic.split(',')[1], 'base64')); data.save.picBytes = data.save.pic.length; delete data.save.pic; }
// down an old gate: the crypt, a foe two cells ahead
await enterDungeon(page, { theme: 'undead', seed: 23, interior: 'cave', size: 'medium' });
await page.evaluate(() => forceTime(19.6));
data.fall = await page.evaluate(() => { try { closeDialog(); } catch (e) {} if (typeof VM_SCENE !== 'undefined') VM_SCENE.visible = true;
  const foes = ENEMIES.filter(e => e.mesh && e.hp > 0); const C = 1;
  let best = null; for (const e of foes) { const ex = e.mesh.position.x, ez = e.mesh.position.z;
    for (const [dx, dz] of [[0, 2], [0, -2], [2, 0], [-2, 0], [2, 2], [-2, 2], [2, -2], [-2, -2], [0, 3], [3, 0]]) { const gx = Math.round(ex / C) + dx, gz = Math.round(ez / C) + dz;
      if (!dSolid(gx, gz) && !best) best = { e, x: gx * C, z: gz * C }; } if (best) break; }
  const e = best.e; px = best.x; pz = best.z; yaw = Math.atan2(px - e.mesh.position.x, pz - e.mesh.position.z); pitch = -.06;
  ENEMIES.forEach(o => { if (o !== e && o.mesh) o.mesh.visible = false; }); window._foe = e;
  PHP = Math.round(maxHP * .12); updateHUD();
  return { dungeon: currentPortal && currentPortal.name, floor: currentFloor, foe: e.name || e.type, foeKind: e.type, hp: maxHP, at: gameDateLine(), deaths: null }; });
await g.spin(null, 20); await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(here, 'plate-fall.jpg'), type: 'jpeg', quality: 86 });
// the same view with the HUD put away (the proposal's backdrop): every element over the canvas hidden
await page.evaluate(() => { window._hid = []; for (const el of document.querySelectorAll('#g *, body > div')) { if (el.tagName === 'CANVAS' || el.querySelector('canvas')) continue; if (getComputedStyle(el).visibility !== 'hidden') { window._hid.push(el); el.style.visibility = 'hidden'; } } });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(here, 'plate-clean.jpg'), type: 'jpeg', quality: 86 });
await page.evaluate(() => { window._hid.forEach(el => el.style.visibility = ''); });
await page.evaluate(() => { PHP = 0; updateHUD(); playerDead(); });
await page.waitForTimeout(600);
Object.assign(data.fall, await page.evaluate(() => ({ sub: document.getElementById('died-sub').textContent, buttons: [...document.querySelectorAll('#died button')].map(b => b.textContent),
  log: (typeof LOG !== 'undefined' && LOG.slice) ? LOG.slice(-3) : null, deaths: (typeof WORLD.vstate === 'function') ? WORLD.vstate().deaths : null })));
await page.screenshot({ path: path.join(here, 'current-died.png') });
data.tag = await page.evaluate(() => { const m = document.body.innerHTML.match(/\bs\d{3}\b/); return m && m[0]; });
data.errs = g.errs;
fs.writeFileSync(path.join(here, 'current.json'), JSON.stringify(data, null, 1));
console.log(JSON.stringify(data, null, 1));
await g.close();
