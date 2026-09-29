// The hub's mana regen row (Session 334): the main loop regenerates mana at 0.8 + 0.15 a level + 0.2 an Intelligence
// point, as the Intelligence card says; the hub's row counted Resolve instead. Stamina's row stays on Resolve.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const rd = () => ({ mp: document.getElementById('vr-mp').textContent, st: document.getElementById('vr-st').textContent });
  const base = (0.8 + (level - 1) * 0.15), sbase = 3 + (level - 1) * 0.4;
  ATTRS.intelligence = 10; ATTRS.resolve = 0; renderHubAttrs(); const int10 = rd();
  ATTRS.intelligence = 0; ATTRS.resolve = 10; renderHubAttrs(); const res10 = rd();
  ATTRS.intelligence = 0; ATTRS.resolve = 0; renderHubAttrs();
  return { level, want10: (base + 2).toFixed(1) + '/sec', want0: base.toFixed(1) + '/sec', st10: (sbase + 3).toFixed(1) + '/sec', int10, res10 };
});
check('Intelligence 10 adds 2.0/sec to the mana row', r.int10.mp === r.want10, r);
check('Resolve 10 adds nothing to the mana row and 3.0/sec to the stamina row', r.res10.mp === r.want0 && r.res10.st === r.st10, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
