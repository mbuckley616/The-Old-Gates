// The death screen holds the keys (Session 677; the critic, 9 Oct 2026). Behind *YOU DIED* the HUD's last prompt stayed
// up (*Press 'E' to catch a fish*), and the view still had the focus, so the keys still played: E reached `interact`,
// F cast the spell in hand and spent its mana, I and Tab opened the book over the death screen. Die in the open world
// with a Fireball in hand and a prompt showing, press each key: nothing happens and the prompt is gone. Then load the
// save: the keys play again.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(async () => { await saveToSlot(0); });
await page.evaluate(() => {
  knownSpells = { caor: 1 }; activeSpellId = 'caor'; mana = maxMana; spCd = 0;
  window._ix = 0; const _i = interact; window.interact = function () { window._ix++; return _i.apply(this, arguments); };
  const ip = document.getElementById('ipr'); ip.textContent = "Press 'E' to catch a fish"; ip.style.opacity = '1'; ip.style.display = 'block';
  document.getElementById('ob').textContent = "Press 'E' to catch a fish";
  PHP = 0; playerDead(); G.focus();
});
const atDeath = await page.evaluate(() => ({ dead, shown: document.getElementById('died').style.display === 'flex',
  ipr: getComputedStyle(document.getElementById('ipr')).display, ob: document.getElementById('ob').textContent,
  focus: document.activeElement && document.activeElement.id }));
console.log('  at death', JSON.stringify(atDeath));
const keys = {};
for (const k of ['KeyE', 'KeyF', 'KeyI', 'Tab', 'KeyQ']) {
  const before = await page.evaluate(() => ({ ix: window._ix, mana, hub: hubOpen }));
  await page.keyboard.press(k); await page.waitForTimeout(600); await g.frames(2);
  const after = await page.evaluate(() => ({ ix: window._ix, mana, hub: hubOpen, cd: +spCd.toFixed(2) }));
  if (after.hub) await page.evaluate(() => closeHub());
  keys[k] = { interact: after.ix - before.ix, manaSpent: before.mana - after.mana, hub: after.hub, cd: after.cd };
}
console.log('  keys while dead', JSON.stringify(keys));
check('the death screen shows with the view focused (the case the critic hit)', atDeath.dead && atDeath.shown && atDeath.focus === 'g', atDeath);
check('the HUD\'s prompt is cleared at death', atDeath.ipr === 'none' && !/Press 'E'/.test(atDeath.ob), atDeath);
check('E while dead reaches no interaction', keys.KeyE.interact === 0, keys);
check('F while dead casts nothing and spends no mana', keys.KeyF.manaSpent === 0 && keys.KeyF.cd <= 0, keys);
check('I and Tab while dead open no book', !keys.KeyI.hub && !keys.Tab.hub, keys);
await page.click('#died-load');
await page.waitForFunction(() => !dead && document.getElementById('died').style.display === 'none', null, { timeout: 15000 });
await page.waitForTimeout(1500); await g.frames(4);
await page.evaluate(() => { knownSpells = { caor: 1 }; activeSpellId = 'caor'; mana = maxMana; spCd = 0; });
const m0 = await page.evaluate(() => mana);
await page.keyboard.press('KeyF'); await page.waitForTimeout(800); await g.frames(2);
await page.keyboard.press('KeyI'); await page.waitForTimeout(300);
const live = await page.evaluate(m0 => ({ manaSpent: m0 - mana, hub: hubOpen }), m0);
console.log('  after the load', JSON.stringify(live));
check('after the load F casts and I opens the book again', live.manaSpent > 0 && live.hub, live);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
