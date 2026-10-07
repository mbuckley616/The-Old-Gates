// Today's save and load menu, for the saves page. Plays two characters in Dunmore and round it, writes their slots and
// autosaves through the game's own ssWrite/saveGame, then photographs the menu (save tab, load tab, the title's Load)
// and clean 1280×720 plates of the places saved in (plate-*.png, the pictures a save would keep), and current.json:
// SS.idx, ssChars(), each save's date line by gameDateLine and calDateLine. node docs/prototypes/saves/shoot-current.mjs
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const shot = n => page.screenshot({ path: path.join(here, n + '.png') });
const plate = async n => {
  await page.evaluate(() => { const c = REN.domElement; window._hid = [];
    for (const e of document.querySelectorAll('body *')) if (e !== c && !e.contains(c) && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden') { e.style.visibility = 'hidden'; window._hid.push(e); }
    const gEl = document.getElementById('g'); window._gh = gEl.style.height; gEl.style.height = '720px'; window.dispatchEvent(new Event('resize'));
    if (typeof VM_SCENE !== 'undefined') VM_SCENE.visible = false; });
  await g.spin(null, 4); await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(here, n + '.jpg'), type: 'jpeg', quality: 82 });
  await page.evaluate(() => { for (const e of window._hid) e.style.visibility = ''; const gEl = document.getElementById('g'); gEl.style.height = window._gh; window.dispatchEvent(new Event('resize')); if (typeof VM_SCENE !== 'undefined') VM_SCENE.visible = true; });
  await g.spin(null, 4); await page.waitForTimeout(600);
};
const PICS = {}; let NPIC = 0;
// set the clock, the place and the character's numbers, settle the frame, take the plate, then write the save
const at = async (o) => {
  await page.evaluate(o => {
    if (o.dx != null) { const t = WORLD.siteAnywhere('dunmore'); px = t.x + o.dx; pz = t.z + o.dz; if (o.yaw != null) yaw = o.yaw;
      if (o.land) for (let a = 0; a < 64; a++) { const x = t.x + Math.cos(a * .4) * o.land, z = t.z + Math.sin(a * .4) * o.land; if (worldH(x, z) > WORLD.SEA_Y + 3) { px = x; pz = z; yaw = Math.atan2(x - t.x, z - t.z); break; } } }
    worldState.gameTimeAbsMinutes = o.day * 1440 + o.h * 60; forceTime(o.h);
    level = o.level; gold = o.gold; updateHUD();
  }, o);
  await g.spin(null, 40); await g.hide(); await page.waitForTimeout(2500);
  const name = `plate-${++NPIC}`; await plate(name);
  await page.evaluate(o => (o.kind === 'auto' ? (saveGame(true), Promise.resolve(true)) : saveToSlot(o.slot)).then(() => new Promise(r => setTimeout(r, 400))), o);
  PICS[await page.evaluate(() => SS.idx.reduce((a, e) => e.ts > a.ts ? e : a).key)] = name;
};
await page.evaluate(() => { playerName = 'Aoife'; playerArchetype = 'duelist'; worldState.charId = 'caoife'; });
await at({ dx: 0, dz: 6, yaw: 0, day: 3, h: 9.5, level: 3, gold: 142, kind: 'manual', slot: 0 });
await at({ dx: 0, dz: 6, yaw: 2.4, day: 4, h: 13.2, level: 4, gold: 260, kind: 'auto' });
await at({ dx: 160, dz: 220, yaw: 3.6, land: 150, day: 5, h: 18.7, level: 4, gold: 311, kind: 'manual', slot: 1 });
await at({ dx: 160, dz: 220, yaw: 3.6, land: 150, day: 6, h: 7.1, level: 5, gold: 388, kind: 'auto' });
await at({ dx: 6, dz: -10, yaw: 1.2, day: 6, h: 21.6, level: 5, gold: 402, kind: 'manual', slot: 2 });
await at({ dx: 6, dz: -10, yaw: 1.2, day: 7, h: 11.0, level: 5, gold: 417, kind: 'auto' });
// a second character, an older game in the same browser
await page.evaluate(() => { playerName = 'Tadhg'; playerArchetype = 'sentinel'; worldState.charId = 'ctadhg'; });
await at({ dx: -30, dz: 40, yaw: 5.2, day: 18, h: 15.4, level: 9, gold: 1205, kind: 'manual', slot: 0 });
await at({ dx: -30, dz: 40, yaw: 5.2, day: 19, h: 10.0, level: 9, gold: 1290, kind: 'auto' });
// back to Aoife for the menus
await page.evaluate(() => { playerName = 'Aoife'; playerArchetype = 'duelist'; worldState.charId = 'caoife'; level = 5; gold = 417; updateHUD(); });
await page.evaluate(() => openSLMenu('save')); await page.waitForTimeout(800); await shot('current-save');
await page.evaluate(() => setSLTab('load')); await page.waitForTimeout(800); await shot('current-load');
const data = await page.evaluate(() => {
  const z = m => m.place ? m.place : m.zone === 'world' ? 'the open country' : m.zone;
  return { idx: SS.idx.map(m => ({ ...m, date: m.at != null ? gameDateLine(m.at, m.tod) : '', dateShort: m.at != null ? gameDateLine(m.at, m.tod, 'short') : '', cal: m.at != null ? calDateLine(m.at) : '', zoneLine: z(m) })),
    chars: ssChars().map(c => ({ id: c.id, name: c.name, people: c.people, arch: c.arch, level: c.level, last: c.last, n: c.saves.length })),
    archetypes: ARCHETYPES.map(a => ({ id: a.id, label: a.label })), manual: SS_MANUAL, auto: SS_AUTO, tag: ssBuildTag(), now: Date.now(),
    store: SS.db ? 'IndexedDB' : SS.fallback ? 'localStorage' : '', total: SS.idx.reduce((a, e) => a + (e.size || 0), 0),
    pics: null, menuText: document.getElementById('slmenu').innerText };
});
data.pics = PICS;
await page.evaluate(() => closeSLMenu()); await page.waitForTimeout(400);
fs.writeFileSync(path.join(here, 'current.json'), JSON.stringify(data, null, 1));
console.log('errors', g.errs, data.idx.length, data.chars);
await g.close();
