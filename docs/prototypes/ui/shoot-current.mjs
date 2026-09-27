// Screens of today's build for the UI style page: the HUD in Dunmore, each hub tab, a conversation, a shop.
// node docs/prototypes/ui/shoot-current.mjs  (writes current-*.png and current.json beside this file)
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z - 6; yaw = 0; pitch = .05; });
await page.evaluate(() => { forceTime(11); PHP = Math.round(maxHP * .72);
  for (const it of [SHOP_STOCK.weapon[0], SHOP_STOCK.weapon[1], SHOP_STOCK.armor[0], SHOP_STOCK.potion[0], SHOP_STOCK.potion[0], SHOP_STOCK.potion[2], SHOP_STOCK.misc[2], SHOP_STOCK.misc[2], SHOP_STOCK.misc[0]]) bagAdd(JSON.parse(JSON.stringify(it)));
  gold = 142; });
await g.frames(30);
// the world alone, for the proposed HUD to sit on
await page.evaluate(() => { for (const e of document.querySelectorAll('#g > *')) if (e.id !== 'c') { e.dataset.v = e.style.visibility; e.style.visibility = 'hidden'; } });
await page.screenshot({ path: path.join(here, 'backdrop.png'), clip: { x: 0, y: 0, width: 1280, height: 600 } });
await page.evaluate(() => { for (const e of document.querySelectorAll('#g > *')) if (e.id !== 'c') e.style.visibility = e.dataset.v || ''; });
const shot = n => page.screenshot({ path: path.join(here, `current-${n}.png`) });
await shot('hud');
const data = {};
data.hud = await page.evaluate(() => ({ hud: document.getElementById('hud').innerText, cbar: document.getElementById('cbar').innerText, loc: document.getElementById('loc').innerText }));
for (const t of ['inv', 'magic', 'attrs', 'quests', 'log', 'map']) {
  await page.evaluate(t => openHub(t), t); await page.waitForTimeout(1200);
  data[t] = await page.evaluate(t => document.getElementById('hpanel-' + t).innerText.slice(0, 3000), t);
  await shot('hub-' + t);
}
data.invRows = await page.evaluate(() => { openHub('inv'); return [...document.querySelectorAll('#inv-list .inv-row')].map(r => r.innerText.replace(/\n+/g, ' | ')); });
await shot('hub-inv');
data.vitals = await page.evaluate(() => document.getElementById('hub-vitals').innerText);
await page.evaluate(() => closeHub());
const who = await page.evaluate(() => { const S = WORLD.settle.get('dunmore');
  const n = S.npcs.find(n => n.def && !n.def._lord && n.def.name); if (!n) return null;
  px = n.g.position.x + 1; pz = n.g.position.z + 1; openDialog(n.def); return n.def.name; });
await page.waitForTimeout(1200);
data.dlg = await page.evaluate(() => document.getElementById('dlg').innerText.slice(0, 3000));
data.dlgWho = who;
await shot('dialogue');
await page.evaluate(() => { try { closeDialog(); } catch (e) { document.getElementById('dlg').style.display = 'none'; dlgOpen = false; } });
fs.writeFileSync(path.join(here, 'current.json'), JSON.stringify(data, null, 1));
console.log('errors', g.errs);
await g.close();
