// Today's sleep slip, wait menu and level-up panel, for the rest page. Writes current-*.png, backdrop-*.png and
// current.json beside this file. node docs/prototypes/rest/shoot-current.mjs
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const shot = n => page.screenshot({ path: path.join(here, n + '.png') });
// a clean plate for the proposed screens: the whole 1280×720 window, no HUD, no hand
const plate = async n => {
  await page.evaluate(() => { const c = REN.domElement; window._hid = [];
    for (const e of document.querySelectorAll('body *')) if (e !== c && !e.contains(c) && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden') { e.style.visibility = 'hidden'; window._hid.push(e); }
    const gEl = document.getElementById('g'); window._gh = gEl.style.height; gEl.style.height = '720px'; window.dispatchEvent(new Event('resize'));
    if (typeof VM_SCENE !== 'undefined') VM_SCENE.visible = false; });
  await g.spin(null, 4); await page.waitForTimeout(1200);
  await shot(n);
  await page.evaluate(() => { for (const e of window._hid) e.style.visibility = ''; const gEl = document.getElementById('g'); gEl.style.height = window._gh; window.dispatchEvent(new Event('resize')); if (typeof VM_SCENE !== 'undefined') VM_SCENE.visible = true; });
  await g.spin(null, 4); await page.waitForTimeout(800);
};
// a duelist a few days out, ready to advance: the activity a first level's play gives
await page.evaluate(() => {
  playerArchetype = 'duelist'; const A = ARCHETYPES.find(a => a.id === 'duelist'); for (const k in ATTRS) ATTRS[k] = A.attrs[k] || 0;
  PHP = 74; mana = 40;
  Object.assign(lvAct, { kills: 5, damageTaken: 140, parries: 3, sprintDist: 310, staminaDepleted: 2, transactions: 4, npcTalks: 9, chestsOpened: 1 });
  worldState.gameTimeAbsMinutes = 3 * 1440 + 21 * 60 + 40; forceTime(21 + 40 / 60);
  xp = xpNext + 12; chkLvl(); updateHUD();
});
await g.spin(null, 30); await g.hide(); await page.waitForTimeout(1500);
await plate('backdrop-night');
await page.evaluate(() => openSleepUI()); await page.waitForTimeout(500);
await shot('current-sleep');
const data = await page.evaluate(() => ({ date: gameDateLine(), sleepText: document.getElementById('sleepui').innerText }));
await page.evaluate(() => { document.getElementById('sleepui').style.display = 'none'; sleepOpen = false; openWaitMenu(); }); await page.waitForTimeout(500);
await shot('current-wait');
data.waitText = await page.evaluate(() => document.getElementById('wait-panel').innerText);
await page.evaluate(() => closeWaitMenu());
// the morning: eight hours later, the level taken on waking
await page.evaluate(() => { worldState.gameTimeAbsMinutes += 8 * 60; forceTime(6.6); });
await g.spin(null, 30); await g.hide(); await page.waitForTimeout(1500);
await plate('backdrop-dawn');
Object.assign(data, await page.evaluate(() => {
  const before = { level, ATTRS: { ...ATTRS }, maxHP, maxStamina, maxMana, PHP, xp, xpNext };
  takeLevelIfReady();
  return { before, after: { level, xpNext, maxStamina }, arch: ARCHETYPES.find(a => a.id === playerArchetype), lvAct: { ...lvAct },
    attrs: Object.fromEntries(Object.entries(ATTR_DEF).map(([k, d]) => [k, { label: d.label, icon: d.icon, actKey: d.actKey, thresholds: d.thresholds, gainDesc: d.gainDesc, gains: d.gains, desc: d.desc, mult: getMultiplier(k), cur: ATTRS[k], gainLine: gainLines(k, getMultiplier(k)).replace(/&nbsp;/g, ' ') }])),
    luText: document.getElementById('lu-panel').innerText, luHeight: document.getElementById('lu-panel').getBoundingClientRect().height };
}));
await page.waitForTimeout(500);
await shot('current-levelup');
await page.evaluate(() => { toggleAttr('finesse'); toggleAttr('fortitude'); toggleAttr('charisma'); }); await page.waitForTimeout(300);
await shot('current-levelup-picked');
data.hub = await page.evaluate(() => document.getElementById('lu-hpgain').textContent);
fs.writeFileSync(path.join(here, 'current.json'), JSON.stringify(data, null, 1));
console.log('errors', g.errs, data.date, data.luHeight);
await g.close();
