// Today's title screen and character creator, for the creator page. Writes current-*.png and current.json beside this file.
// node docs/prototypes/creator/shoot-current.mjs
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await page.screenshot({ path: path.join(here, 'current-title.png') });
const data = await page.evaluate(() => ({
  title: { h2: document.querySelector('#ov h2').textContent, h3: document.querySelector('#ov h3').textContent, p: document.querySelector('#ov p').innerText,
    buttons: [...document.querySelectorAll('#ov button')].map(b => [b.id, b.textContent, getComputedStyle(b).display]) },
  archetypes: ARCHETYPES, weapons: Object.fromEntries(Object.entries(STARTER_WEAPONS).map(([k, w]) => [k, { name: w.name, ico: w.ico, atk: w.atk, wType: w.wType, twoHand: !!w.twoHand, weight: w.weight, desc: w.desc }])),
  attrs: Object.fromEntries(Object.entries(ATTR_DEF).map(([k, d]) => [k, { label: d.label, icon: d.icon, desc: d.desc }])),
  budget: CC_POINT_BUDGET, cap: CC_ATTR_CAP,
  styles: LOOK_STYLES, beards: LOOK_BEARDS, tunics: LOOK_TUNICS, breeches: LOOK_BREECHES, boots: LOOK_BOOTS,
  peoples: Object.fromEntries(['gatelander', 'markman', 'aurennais', 'oldblood'].map(k => { const P = WORLD.PEOPLES[k] || {}; return [k, { skin: P.skin, hair: P.hair }]; })),
}));
await page.click('#sb'); await page.waitForTimeout(1500);
await page.fill('#cc-name', 'Aoife');
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(here, 'current-creator-1.png') });
data.peopleDesc = await page.evaluate(() => [...document.querySelectorAll('#cc-people-grid button')].map(b => { b.click(); return [b.textContent, document.getElementById('cc-people-desc').textContent]; }));
await page.evaluate(() => document.querySelector('#cc-people-grid button').click());
data.lookRows = await page.evaluate(() => [...document.querySelectorAll('#cc-look-rows > div')].map(r => [r.firstChild.textContent, [...r.querySelectorAll('button')].map(b => b.title || b.textContent)]));
data.look = await page.evaluate(() => window._ccLook);
await page.evaluate(() => { const m = document.getElementById('cc-modal'); m.scrollTop = 520; }); await page.waitForTimeout(800);
await page.screenshot({ path: path.join(here, 'current-creator-2.png') });
await page.evaluate(() => { const m = document.getElementById('cc-modal'); m.scrollTop = 99999; }); await page.waitForTimeout(800);
await page.screenshot({ path: path.join(here, 'current-creator-3.png') });
data.modalHeight = await page.evaluate(() => [document.getElementById('cc-modal').scrollHeight, document.getElementById('cc-modal').clientHeight]);
// the figure alone, transparent, for the proposed page's preview
data.figure = await page.evaluate(() => { const m = document.getElementById('cc-modal'); m.scrollTop = 0; return document.getElementById('cc-look-cv').toDataURL('image/png').length; });
await page.evaluate(() => { document.getElementById('cc-modal').scrollTop = 0; }); await page.waitForTimeout(500);
const cv = await page.$('#cc-look-cv'); await cv.screenshot({ path: path.join(here, 'figure-today.png'), omitBackground: true });
fs.writeFileSync(path.join(here, 'current.json'), JSON.stringify(data, null, 1));
console.log('errors', g.errs, data.modalHeight);
await g.close();
