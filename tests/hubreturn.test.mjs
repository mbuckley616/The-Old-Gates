// Tab reopens the hub where you left it (Session 644; Michael's 6 Oct 2026 playtest: "Tab always opens the Map; it should
// return to the exact tab last open, e.g. Inventory, Armour"). Open the hub with Tab, click a tab and a bag sub-tab with the
// mouse, close it with Tab, open it again with Tab: the same tab and sub-tab are showing. A fresh game's first Tab still opens
// the Map. Each step is driven by the real keyboard and clicks.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const state = () => page.evaluate(() => ({ open: hubOpen, tab: (document.querySelector('.hub-panel.active') || {}).id || null,
  sub: (document.querySelector('.inv-subtab.active') || {}).dataset?.sub || null, focus: document.activeElement && (document.activeElement.id || document.activeElement.tagName) }));
const tab = async () => { await page.keyboard.press('Tab'); await g.frames(2); return state(); };
const out = {};
out.first = await tab();
out.firstClose = await tab();
await page.evaluate(() => G.focus());
out.reopen0 = await tab();
await page.click('.hub-tab:nth-child(1)'); await g.frames(2);
await page.click('.inv-subtab[data-sub="armor"]'); await g.frames(2);
out.clicked = await state();
out.closed = await tab();
out.reopened = await tab();
await page.click('.hub-tab:nth-child(5)'); await g.frames(2);
out.closed2 = await tab();
out.reopened2 = await tab();
await page.keyboard.press('Escape'); await g.frames(2);
if ((await state()).open) { await page.evaluate(() => closeHub()); await g.frames(2); }
await page.evaluate(() => G.focus());
await page.keyboard.press('KeyI'); await g.frames(2); out.byI = await state();
out.closed3 = await tab();
out.reopened3 = await tab();
for (const [k, v] of Object.entries(out)) console.log(' ', k, JSON.stringify(v));
check('a fresh game\'s first Tab opens the Map', out.first.open && out.first.tab === 'hpanel-map', out.first);
check('Tab closes the hub', !out.firstClose.open && !out.closed.open && !out.closed2.open && !out.closed3.open, out);
check('closed on the Map, Tab reopens the Map', out.reopen0.open && out.reopen0.tab === 'hpanel-map', out.reopen0);
check('left on Inventory, Armour, Tab reopens Inventory with Armour chosen', out.reopened.open && out.reopened.tab === 'hpanel-inv' && out.reopened.sub === 'armor', out.reopened);
check('left on the Journal, Tab reopens the Journal', out.reopened2.open && out.reopened2.tab === 'hpanel-journal', out.reopened2);
check('opened by I, Tab later reopens Inventory', out.byI.tab === 'hpanel-inv' && out.reopened3.open && out.reopened3.tab === 'hpanel-inv', out);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
