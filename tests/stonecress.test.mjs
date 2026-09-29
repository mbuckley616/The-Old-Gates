// Stonecress and a save (Session 325). Stonecress's hidden effect (+20% max stamina for 90s) patched `maxStamina`
// itself and divided it back on expiry. The save wrote the patched maximum and a load never cleared the buffs, so:
// save while it ran and the +20% was yours for good; load an older save while it ran and its expiry took a fifth off
// the loaded maximum. A level taken while it ran was also shaved on expiry (+10 came back as +8). Now it lends a fixed
// amount and takes that back, the save keeps the maximum without it, and a load clears the buffs.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => {
  const out = {}; ACTIVE_BUFFS.length = 0;
  const eat = () => { HERB_CONSUME_COUNTS.stonecress = 20; BAG.push(Object.assign({}, HERB_DEF.stonecress.item, { _typeKey: 'stonecress', qty: 1 })); useHerb(BAG.length - 1); };
  out.base = maxStamina; eat(); out.lent = maxStamina;
  // a level taken while it runs, then it wears off
  xp = xpNext; takeLevelIfReady(); out.levelled = maxStamina; tickActiveBuffs(1000); out.after = maxStamina;
  // saved while it runs: the save carries the maximum without it
  eat(); out.lent2 = maxStamina; const d = JSON.parse(JSON.stringify(_buildSavePayload())); out.saved = d.maxStamina; out.savedSt = d.stamina;
  // an older save (base 100) loaded while it runs: the buff goes, and nothing is taken off the loaded maximum
  const old = JSON.parse(JSON.stringify(d)); old.maxStamina = 100; old.stamina = 100;
  _applyLoadData(old); out.buffsAfterLoad = ACTIVE_BUFFS.length; out.loaded = maxStamina; tickActiveBuffs(1000); out.loadedLater = maxStamina;
  _applyLoadData(d); out.reloaded = maxStamina;
  return out; });
console.log(' ', JSON.stringify(r));
check('Stonecress lends a fifth of max stamina', r.lent === r.base + Math.round(r.base * .2), r);
check('a level taken while it runs is kept whole when it wears off (+10)', r.levelled === r.lent + 10 && r.after === r.base + 10, r);
check('a save while it runs keeps the maximum without it', r.lent2 > r.after && r.saved === r.after && r.savedSt <= r.after, r);
check('loading clears it, and it takes nothing off the loaded maximum', r.buffsAfterLoad === 0 && r.loaded === 100 && r.loadedLater === 100 && r.reloaded === r.after, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
