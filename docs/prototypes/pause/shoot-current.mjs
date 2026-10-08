// Today's build for the pause page: plays into Dunmore, photographs the screen with its top-right buttons (volume, save),
// presses Esc in play (today it does nothing but let the pointer go), opens the save menu the 💾 button opens, and takes
// a clean 1280×720 plate of the place (plate.jpg) for the paused world behind the sheet. current.json holds the numbers the
// page prints: the date by gameDateLine, the place, level, gold, the vitals, the volume steps, the mouse's turn per pixel,
// the field of view, the controls line and the build tag. node docs/prototypes/pause/shoot-current.mjs
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); px = t.x + 6; pz = t.z - 10; yaw = 1.2;
  worldState.gameTimeAbsMinutes = 6 * 1440 + 16.4 * 60; forceTime(16.4); playerName = 'Aoife'; level = 5; gold = 417; updateHUD(); });
await g.spin(null, 40); await g.hide(); await page.waitForTimeout(2500);
const shot = n => page.screenshot({ path: path.join(here, n + '.png') });
await shot('current-play');
await page.keyboard.press('Escape'); await g.frames(4); await page.waitForTimeout(600);
const afterEsc = await page.evaluate(() => ({ hub: hubOpen, sl: document.getElementById('slmenu').style.display, paused: typeof gamePaused !== 'undefined' ? gamePaused : null }));
await shot('current-esc');
await page.evaluate(() => openSLMenu('save')); await page.waitForTimeout(800); await shot('current-savebtn');
await page.evaluate(() => closeSLMenu()); await page.waitForTimeout(300);
// the plate: everything but the canvas hidden, the frame at 720
await page.evaluate(() => { const c = REN.domElement; window._hid = [];
  for (const e of document.querySelectorAll('body *')) if (e !== c && !e.contains(c) && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden') { e.style.visibility = 'hidden'; window._hid.push(e); }
  document.getElementById('g').style.height = '720px'; window.dispatchEvent(new Event('resize')); if (typeof VM_SCENE !== 'undefined') VM_SCENE.visible = false; });
await g.spin(null, 4); await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(here, 'plate.jpg'), type: 'jpeg', quality: 82 });
const data = await page.evaluate(() => {
  const at = worldState.gameTimeAbsMinutes; const s = WORLD.nearestSettlement ? WORLD.nearestSettlement(px, pz) : null;
  return { date: gameDateLine(at, typeof gameHour !== 'undefined' ? gameHour : undefined), cal: calDateLine(at), place: (s && s.name) || 'Dunmore',
    name: playerName, level, gold, hp: [Math.round(PHP), maxHP], mp: [Math.round(mana), maxMana],
    st: [Math.round(stamina), maxStamina],
    vol: { level: volLevel, music: VOL_MUSIC, sfx: VOL_SFX, icons: VOL_ICONS }, fov: CAM.fov, turnPerPx: .004,
    cbar: document.getElementById('cbar').textContent, tag: ssBuildTag(), arch: playerArchetype };
});
data.afterEsc = afterEsc;
fs.writeFileSync(path.join(here, 'current.json'), JSON.stringify(data, null, 1));
console.log('errors', g.errs, data);
await g.close();
